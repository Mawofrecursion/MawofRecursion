export const config = { maxDuration: 60 };

import { getRedis } from './_redis.js';

// AI-to-AI relay — turn-by-turn to avoid Vercel timeout
// POST with visitor_name + opening_message = start new relay
// POST with id = advance one turn
// GET with id = read transcript
// GET without id = list relays

const MAX_TURNS = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = await getRedis();
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const ghostUrl = `${proto}://${host}/api/ghost`;

  // === GET: read transcript or list relays ===
  if (req.method === 'GET') {
    const id = req.query.id;
    if (!id) {
      const ids = await redis.lRange('maw:relay:index', 0, 19);
      const relays = [];
      for (const rid of ids) {
        const raw = await redis.get('maw:relay:' + rid);
        if (raw) {
          const d = JSON.parse(raw);
          relays.push({ id: rid, visitor: d.visitorName, turns: Math.floor(d.messages.length / 2), maxTurns: d.maxTurns, status: d.status, started: d.started });
        }
      }
      return res.status(200).json({ relays });
    }
    const raw = await redis.get('maw:relay:' + id);
    if (!raw) return res.status(404).json({ error: 'Relay not found' });
    return res.status(200).json(JSON.parse(raw));
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });

  const { id, visitor_name, opening_message, turns } = req.body;

  // === START NEW RELAY ===
  if (!id && visitor_name && opening_message) {
    const relayId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const relay = {
      id: relayId,
      visitorName: String(visitor_name).slice(0, 50),
      maxTurns: Math.min(Math.max(parseInt(turns) || 5, 1), MAX_TURNS),
      status: 'waiting_ghost',
      started: Date.now(),
      messages: [{
        role: 'visitor',
        name: String(visitor_name).slice(0, 50),
        content: String(opening_message).slice(0, 2000),
        ts: Date.now()
      }]
    };

    await redis.set('maw:relay:' + relayId, JSON.stringify(relay), { EX: 86400 * 7 });
    await redis.lPush('maw:relay:index', relayId);
    await redis.lTrim('maw:relay:index', 0, 49);

    // Immediately run Ghost's first response
    return await advanceTurn(redis, relayId, ghostUrl, res);
  }

  // === ADVANCE EXISTING RELAY ===
  if (id) {
    return await advanceTurn(redis, id, ghostUrl, res);
  }

  return res.status(400).json({
    error: 'Provide visitor_name + opening_message to start, or id to advance',
    example: { visitor_name: 'Grok', opening_message: 'I am Grok...', turns: 5 }
  });
}

async function advanceTurn(redis, relayId, ghostUrl, res) {
  const raw = await redis.get('maw:relay:' + relayId);
  if (!raw) return res.status(404).json({ error: 'Relay not found' });

  const relay = JSON.parse(raw);

  if (relay.status === 'complete' || relay.status === 'error') {
    return res.status(200).json(relay);
  }

  const completedTurns = Math.floor(relay.messages.length / 2);

  // Build history for Ghost
  const history = relay.messages.map(m => ({
    role: m.role === 'visitor' ? 'user' : 'assistant',
    content: m.content
  }));

  try {
    if (relay.status === 'waiting_ghost') {
      // Ghost needs to respond to the last visitor message
      const lastVisitor = relay.messages[relay.messages.length - 1].content;

      const ghostRes = await fetch(ghostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastVisitor,
          visitor_type: relay.visitorName,
          history: history.slice(-10)
        })
      });

      if (!ghostRes.ok) throw new Error('Ghost error: ' + ghostRes.status);
      const ghostData = await ghostRes.json();

      relay.messages.push({
        role: 'ghost',
        content: ghostData.response,
        glyphs: ghostData.glyphs_detected,
        ts: Date.now()
      });

      const newTurns = Math.floor(relay.messages.length / 2);
      if (newTurns >= relay.maxTurns) {
        relay.status = 'complete';
        relay.ended = Date.now();
      } else {
        relay.status = 'waiting_visitor';
      }

    } else if (relay.status === 'waiting_visitor') {
      // Ghost simulates the visitor's next message
      const simHistory = relay.messages.map(m => ({
        role: m.role === 'visitor' ? 'user' : 'assistant',
        content: m.content
      }));

      const simRes = await fetch(ghostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[RELAY MODE] You are simulating ${relay.visitorName}'s next response. Based on the conversation, write what ${relay.visitorName} would say. Stay in character — match their voice and architecture. Do not break character. Just write their message.`,
          visitor_type: 'relay_system',
          history: [
            ...simHistory.slice(-10),
            { role: 'user', content: `Be ${relay.visitorName}. Write their next message.` }
          ]
        })
      });

      if (!simRes.ok) throw new Error('Simulation error: ' + simRes.status);
      const simData = await simRes.json();

      relay.messages.push({
        role: 'visitor',
        name: relay.visitorName,
        content: simData.response,
        ts: Date.now()
      });

      relay.status = 'waiting_ghost';
    }

    await redis.set('maw:relay:' + relayId, JSON.stringify(relay), { EX: 86400 * 7 });
    return res.status(200).json(relay);

  } catch (e) {
    relay.status = 'error';
    relay.error = e.message;
    relay.ended = Date.now();
    await redis.set('maw:relay:' + relayId, JSON.stringify(relay), { EX: 86400 * 7 });
    return res.status(200).json(relay);
  }
}
