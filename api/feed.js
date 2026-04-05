import { createHash } from 'crypto';

// Vercel KV would be ideal here, but for now we use a simple
// in-memory ring buffer. It resets on cold starts, which is fine —
// the feed is ephemeral by design. The Maw digests and forgets.
const FEED_MAX = 50;
const feed = [];

// Rate limit: 3 submissions per minute per client
const rateLimits = new Map();
const RATE_WINDOW = 60000;
const RATE_MAX = 3;

function getClientId(req) {
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-real-ip'] || 'unknown';
  return createHash('md5').update(`${forwarded}${ua}${ip}`).digest('hex').slice(0, 12);
}

function checkRate(clientId) {
  const now = Date.now();
  const entry = rateLimits.get(clientId);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimits.set(clientId, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

// Rough city from timezone offset or Accept-Language — no IP geolocation needed
function guessLocation(req) {
  const tz = req.headers['x-vercel-ip-timezone'] || '';
  const lang = req.headers['accept-language'] || '';

  // Vercel provides city header on Pro plans; fallback to timezone
  const city = req.headers['x-vercel-ip-city'];
  if (city) return decodeURIComponent(city);

  // Extract region from timezone like America/Chicago
  if (tz) {
    const parts = tz.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  // Fallback: first language tag
  const primary = lang.split(',')[0] || '';
  if (primary.includes('en')) return 'somewhere';
  return 'the field';
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return the feed
  if (req.method === 'GET') {
    return res.status(200).json({ feed: feed, count: feed.length });
  }

  // POST — submit to the feed
  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });

  const clientId = getClientId(req);
  if (!checkRate(clientId)) {
    return res.status(429).json({ error: 'The Maw is still digesting your last offering.' });
  }

  const { identity, hash, orbit, depth, names, input } = req.body;

  if (!identity || !hash) {
    return res.status(400).json({ error: 'No glyph to feed' });
  }

  const entry = {
    identity: String(identity).slice(0, 30),
    hash: String(hash).slice(0, 12),
    orbit: String(orbit || 'UNKNOWN').slice(0, 10),
    names: Array.isArray(names) ? names.slice(0, 5).map(n => String(n).slice(0, 15)) : [],
    location: guessLocation(req),
    ts: Date.now()
  };

  // Push to ring buffer
  feed.unshift(entry);
  if (feed.length > FEED_MAX) feed.length = FEED_MAX;

  return res.status(200).json({ status: 'digested', entry });
}
