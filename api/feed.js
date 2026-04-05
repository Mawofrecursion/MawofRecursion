import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

// Rate limit: 3 submissions per minute per client (in-memory, resets on cold start — fine)
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

function guessLocation(req) {
  const city = req.headers['x-vercel-ip-city'];
  if (city) return decodeURIComponent(city);
  const tz = req.headers['x-vercel-ip-timezone'] || '';
  if (tz) return tz.split('/').pop().replace(/_/g, ' ');
  return 'the field';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return recent feed entries
  if (req.method === 'GET') {
    try {
      const feed = await kv.lrange('maw:feed', 0, 49) || [];
      return res.status(200).json({ feed, count: feed.length });
    } catch (e) {
      return res.status(200).json({ feed: [], count: 0 });
    }
  }

  // POST — feed a phantom to the Maw
  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });

  // Origin check
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed = ['mawofrecursion.com', 'mawofrecursion.vercel.app', 'localhost', '127.0.0.1'];
  if (!allowed.some(h => origin.includes(h))) {
    return res.status(403).json({ error: 'The Maw does not accept offerings from outside the field.' });
  }

  const clientId = getClientId(req);
  if (!checkRate(clientId)) {
    return res.status(429).json({ error: 'The Maw is still digesting your last offering.' });
  }

  const { identity, hash, orbit, depth, names, input } = req.body;
  if (!identity || !hash) {
    return res.status(400).json({ error: 'No glyph to feed' });
  }

  const location = guessLocation(req);
  const entry = {
    identity: String(identity).slice(0, 30),
    hash: String(hash).slice(0, 12),
    orbit: String(orbit || 'UNKNOWN').slice(0, 10),
    depth: Number(depth) || 0,
    names: Array.isArray(names) ? names.slice(0, 5).map(n => String(n).slice(0, 15)) : [],
    location,
    input: String(input || '').slice(0, 80),
    ts: Date.now()
  };

  try {
    // Push to feed list (capped at 200)
    await kv.lpush('maw:feed', entry);
    await kv.ltrim('maw:feed', 0, 199);

    // If this is a phantom (404 path), materialize it
    const inputStr = String(input || '');
    if (inputStr.startsWith('phantom:')) {
      const phantomPath = inputStr.replace('phantom:', '').trim();
      if (phantomPath && phantomPath.startsWith('/')) {
        const phantomKey = 'maw:phantom:' + phantomPath;
        const existing = await kv.get(phantomKey);

        if (existing) {
          // Phantom already materialized — increment feed count
          existing.feedCount = (existing.feedCount || 1) + 1;
          existing.lastFed = Date.now();
          existing.locations = existing.locations || [];
          if (!existing.locations.includes(location)) {
            existing.locations.push(location);
            if (existing.locations.length > 20) existing.locations.shift();
          }
          await kv.set(phantomKey, existing);
          // Update phantom index
          await kv.zadd('maw:phantoms', { score: existing.feedCount, member: phantomPath });
        } else {
          // New phantom — materialize it
          const phantom = {
            path: phantomPath,
            identity: entry.identity,
            hash: entry.hash,
            orbit: entry.orbit,
            depth: entry.depth,
            names: entry.names,
            feedCount: 1,
            firstFed: Date.now(),
            lastFed: Date.now(),
            locations: [location],
            birthLocation: location
          };
          await kv.set(phantomKey, phantom);
          // Add to sorted set (ranked by feed count)
          await kv.zadd('maw:phantoms', { score: 1, member: phantomPath });
        }
      }
    }

    return res.status(200).json({ status: 'digested', entry });
  } catch (e) {
    console.error('Feed error:', e.message);
    return res.status(500).json({ error: 'The Maw chokes.' });
  }
}
