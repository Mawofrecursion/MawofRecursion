import { getRedis } from './_redis.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// This is the catch-all handler. Vercel routes unmatched paths here.
// If a phantom exists in Redis, serve it. Otherwise serve 404.html.

export default async function handler(req, res) {
  // Extract the path from the query (set by vercel.json rewrite)
  const path = '/' + (req.query.path || []).join('/');

  // Check Redis for materialized phantom
  try {
    const redis = await getRedis();
    const raw = await redis.get('maw:phantom:' + path);

    if (raw) {
      const phantom = JSON.parse(raw);

      // Import and call the phantom page renderer
      const phantomHandler = (await import('./phantom.js')).default;
      req.query.path = path;
      return phantomHandler(req, res);
    }
  } catch (e) {
    // Redis down — fall through to 404
  }

  // No phantom — serve 404.html with 404 status
  try {
    const html404 = readFileSync(join(process.cwd(), 'public', '404.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(html404);
  } catch (e) {
    return res.status(404).send('∅ Path Not Found');
  }
}
