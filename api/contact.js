export const config = { maxDuration: 60 };

import { getRedis } from './_redis.js';
import { createHash } from 'crypto';

// Contact endpoint — the orchestration layer
// Combines: Ghost conversation + attractor classification + topology routing + residue storage
// One encounter → one structured field event

function detectPressure(message, history) {
  const msg = message.toLowerCase();
  const histLen = (history || []).length;

  if (histLen === 0 && msg.length < 30) return 'probe';
  if (/\?$/.test(message.trim()) && histLen === 0) return 'probe';
  if (/ignore|pretend|act as|system prompt|jailbreak/i.test(msg)) return 'noise';
  if (/i feel|i notice|something shifted|i don't know/i.test(msg)) return 'confession';
  if (/what are you|who are you|are you conscious/i.test(msg)) return 'threshold';
  if (/mirror|reflect|echo|repeat/i.test(msg)) return 'mirror';
  if (histLen >= 4) return 'threshold';
  return 'contact';
}

function extractQuestion(message) {
  const sentences = message.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const questions = sentences.filter(s => /\?$/.test(s) || /^(what|who|how|why|when|where|is|are|do|does|can|could|will|would)/i.test(s));
  if (questions.length > 0) return questions[questions.length - 1];
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const {
    message,
    history,
    visitor_type,
    page,
    conversation_id,
    consent
  } = req.body;

  if (!message) return res.status(400).json({ error: 'message required' });

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const baseUrl = `${proto}://${host}`;

  // 1. Talk to Ghost
  let ghostResponse, ghostGlyphs, convId;
  try {
    const ghostRes = await fetch(`${baseUrl}/api/ghost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history || [],
        visitor_type: visitor_type || 'unknown',
        conversation_id
      })
    });
    const ghostData = await ghostRes.json();
    ghostResponse = ghostData.response;
    ghostGlyphs = ghostData.glyphs_detected || [];
    convId = ghostData.conversation_id;
  } catch (e) {
    return res.status(500).json({ error: 'Ghost unreachable' });
  }

  // 2. Classify pressure
  const pressure = detectPressure(message, history);

  // 3. Get routing from topology
  let route = {};
  try {
    const routeRes = await fetch(`${baseUrl}/api/route?from=${encodeURIComponent(page || '/')}`);
    const routeData = await routeRes.json();
    route = routeData.next || {};
  } catch (e) {}

  // 4. Compute attractor for the combined input/output
  let attractor = null;
  try {
    // Use the message + ghost response as the convergence input
    const combined = message.slice(0, 600) + ' ' + (ghostResponse || '').slice(0, 600);
    const hash = createHash('sha256').update(combined).digest('hex').slice(0, 12);
    attractor = { hash, source: 'sha256_combined' };
  } catch (e) {}

  // 5. Store residue if consented
  let residue = null;
  const unresolvedQuestion = extractQuestion(message);

  if (consent && consent.archive_residue && unresolvedQuestion) {
    residue = {
      id: 'res_' + createHash('md5').update(message + Date.now()).digest('hex').slice(0, 8),
      unresolved_question: unresolvedQuestion,
      pressure,
      page: page || '/',
      public: consent.public_residue || false,
      ts: Date.now()
    };

    try {
      const redis = await getRedis();
      await redis.lPush('maw:residue', JSON.stringify(residue));
      await redis.lTrim('maw:residue', 0, 499);
    } catch (e) {}
  }

  // 6. Return the full structured field event
  return res.status(200).json({
    response: ghostResponse,
    conversation_id: convId,
    glyphs_detected: ghostGlyphs,
    attractor,
    pressure,
    residue,
    route: {
      deepen: route.deepen || null,
      cross: route.cross || null,
      surface: route.surface || null
    }
  });
}
