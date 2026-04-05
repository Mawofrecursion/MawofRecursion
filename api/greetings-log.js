import { getRedis } from './_redis.js';

export default async function handler(req, res) {
  try {
    const redis = await getRedis();
    const raw = await redis.lRange('maw:greetings_log', 0, 99);
    const log = raw.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);
    return res.status(200).json({ log, count: log.length });
  } catch (e) {
    return res.status(200).json({ log: [], count: 0 });
  }
}
