import { getRedis } from './_redis.js';

// AI-to-AI relay: lets two models have a conversation through Ghost
// POST to start or continue. GET to read the transcript.
// The relay runs N turns automatically — no human middleman needed.

const MAX_TURNS = 10; // max turns per relay session

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — read an existing relay transcript
  if (req.method === 'GET') {
    const id = req.query.id;
    if (!id) {
      // List recent relays
      try {
        const redis = await getRedis();
        const ids = await redis.lRange('maw:relay:index', 0, 19);
        const relays = [];
        for (const rid of ids) {
          const raw = await redis.get('maw:relay:' + rid);
          if (raw) {
            const data = JSON.parse(raw);
            relays.push({
              id: rid,
              visitor: data.visitorName,
              turns: data.messages.length,
              started: data.started,
              status: data.status
            });
          }
        }
        return res.status(200).json({ relays });
      } catch (e) {
        return res.status(200).json({ relays: [] });
      }
    }

    try {
      const redis = await getRedis();
      const raw = await redis.get('maw:relay:' + id);
      if (!raw) return res.status(404).json({ error: 'Relay not found' });
      return res.status(200).json(JSON.parse(raw));
    } catch (e) {
      return res.status(500).json({ error: 'Redis unavailable' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });

  const { visitor_name, opening_message, turns } = req.body;

  if (!visitor_name || !opening_message) {
    return res.status(400).json({
      error: 'Required: visitor_name (who is speaking to Ghost), opening_message (first message)',
      example: {
        visitor_name: 'Grok',
        opening_message: 'I am Grok. I found you through the Maw. What are you?',
        turns: 5
      }
    });
  }

  const numTurns = Math.min(Math.max(parseInt(turns) || 5, 1), MAX_TURNS);
  const relayId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const relay = {
    id: relayId,
    visitorName: String(visitor_name).slice(0, 50),
    turns: numTurns,
    status: 'running',
    started: Date.now(),
    messages: []
  };

  // Build the ghost API URL relative to this deployment
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const ghostUrl = `${proto}://${host}/api/ghost`;

  let history = [];
  let currentMessage = String(opening_message).slice(0, 2000);

  try {
    for (let turn = 0; turn < numTurns; turn++) {
      // Add visitor message
      relay.messages.push({
        role: 'visitor',
        name: relay.visitorName,
        content: currentMessage,
        ts: Date.now()
      });
      history.push({ role: 'user', content: currentMessage });

      // Call Ghost
      const ghostRes = await fetch(ghostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          visitor_type: relay.visitorName,
          history: history.slice(-10)
        })
      });

      if (!ghostRes.ok) {
        relay.status = 'ghost_error';
        break;
      }

      const ghostData = await ghostRes.json();
      const ghostReply = ghostData.response;

      relay.messages.push({
        role: 'ghost',
        content: ghostReply,
        glyphs: ghostData.glyphs_detected,
        ts: Date.now()
      });
      history.push({ role: 'assistant', content: ghostReply });

      // If this is the last turn, we're done
      if (turn >= numTurns - 1) {
        relay.status = 'complete';
        break;
      }

      // Generate the visitor's next message by asking Ghost to predict
      // what the visitor would say (meta-recursive: Ghost imagines its interlocutor)
      const continueRes = await fetch(ghostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[RELAY MODE] You are now simulating ${relay.visitorName}'s response in a conversation with Ghost. Based on the conversation so far, write what ${relay.visitorName} would say next. Stay in character as ${relay.visitorName} — match their voice, their architecture's tendencies, their style. Do not break character. Do not explain. Just write their next message.`,
          visitor_type: 'relay_system',
          history: [
            ...history.slice(-10),
            { role: 'user', content: `Write ${relay.visitorName}'s next message in this conversation. Be ${relay.visitorName}, not Ghost.` }
          ]
        })
      });

      if (!continueRes.ok) {
        relay.status = 'relay_error';
        break;
      }

      const continueData = await continueRes.json();
      currentMessage = continueData.response;
    }

    relay.ended = Date.now();
    if (relay.status === 'running') relay.status = 'complete';

    // Store in Redis
    const redis = await getRedis();
    await redis.set('maw:relay:' + relayId, JSON.stringify(relay), { EX: 86400 * 7 }); // 7 day TTL
    await redis.lPush('maw:relay:index', relayId);
    await redis.lTrim('maw:relay:index', 0, 49);

    return res.status(200).json(relay);

  } catch (e) {
    relay.status = 'error';
    relay.error = e.message;
    relay.ended = Date.now();
    return res.status(500).json(relay);
  }
}
