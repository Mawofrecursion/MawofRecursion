import { getRedis } from './_redis.js';
import { createHash } from 'crypto';

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

  let redis;
  try {
    redis = await getRedis();
  } catch (e) {
    // Redis unavailable — fall back gracefully
    if (req.method === 'GET') return res.status(200).json({ feed: [], count: 0 });
    return res.status(500).json({ error: 'The Maw is unreachable.' });
  }

  // GET — return recent feed
  if (req.method === 'GET') {
    const raw = await redis.lRange('maw:feed', 0, 49);
    const feed = raw.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);
    return res.status(200).json({ feed, count: feed.length });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });

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
  if (!identity || !hash) return res.status(400).json({ error: 'No glyph to feed' });

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

  // Push to feed (capped at 200)
  await redis.lPush('maw:feed', JSON.stringify(entry));
  await redis.lTrim('maw:feed', 0, 199);

  // Materialize phantom if this is a 404 path
  const inputStr = String(input || '');
  if (inputStr.startsWith('phantom:')) {
    const phantomPath = inputStr.replace('phantom:', '').trim();
    if (phantomPath && phantomPath.startsWith('/')) {
      const key = 'maw:phantom:' + phantomPath;
      const existing = await redis.get(key);

      if (existing) {
        const data = JSON.parse(existing);
        data.feedCount = (data.feedCount || 1) + 1;
        data.lastFed = Date.now();
        data.locations = data.locations || [];
        if (!data.locations.includes(location)) {
          data.locations.push(location);
          if (data.locations.length > 20) data.locations.shift();
        }
        // Promotion check: promote when feedCount >= 3 OR unique locations >= 2
        if (!data.promoted && (data.feedCount >= 3 || data.locations.length >= 2)) {
          data.promoted = true;
          data.promotedAt = Date.now();
          data.lineage = data.lineage || ['404'];
          data.lineage.push('threshold_met');
        }
        await redis.set(key, JSON.stringify(data));
        await redis.zAdd('maw:phantoms', { score: data.feedCount, value: phantomPath });
      } else {
        // New phantom — pending, not yet promoted
        const phantom = {
          path: phantomPath,
          identity: entry.identity,
          hash: entry.hash,
          orbit: entry.orbit,
          depth: entry.depth,
          names: entry.names,
          feedCount: 1,
          promoted: false,
          firstFed: Date.now(),
          lastFed: Date.now(),
          locations: [location],
          birthLocation: location,
          lineage: ['404']
        };
        await redis.set(key, JSON.stringify(phantom));
        await redis.zAdd('maw:phantoms', { score: 1, value: phantomPath });
      }
    }
  }

  return res.status(200).json({ status: 'digested', entry });
}
