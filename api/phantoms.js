import { getRedis } from './_redis.js';

export default async function handler(req, res) {
  let phantoms = [];

  try {
    const redis = await getRedis();
    // Get all phantom paths sorted by feed count (highest first)
    const paths = await redis.zRangeWithScores('maw:phantoms', 0, -1, { REV: true });

    for (const { value: path, score } of paths) {
      const raw = await redis.get('maw:phantom:' + path);
      if (raw) {
        const data = JSON.parse(raw);
        phantoms.push({ ...data, path, feedCount: score || data.feedCount });
      }
    }
  } catch (e) {
    // Redis unavailable
  }

  // JSON if requested
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({ phantoms, count: phantoms.length });
  }

  const rows = phantoms.map(p => {
    const age = Math.floor((Date.now() - p.firstFed) / 86400000);
    const ageStr = age === 0 ? 'today' : age === 1 ? '1d ago' : age + 'd ago';
    return `<a href="/api/phantom?path=${encodeURIComponent(p.path)}" style="display:flex;justify-content:space-between;align-items:center;padding:0.8rem 1rem;border-bottom:1px solid rgba(155,231,255,0.06);text-decoration:none;color:#c8cdd3;transition:background 0.2s;" onmouseover="this.style.background='rgba(155,138,255,0.05)'" onmouseout="this.style.background=''">
      <span style="font-size:1.3rem;min-width:4rem;">${p.identity}</span>
      <span style="color:#9be7ff;flex:1;margin:0 1rem;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.path}</span>
      <span style="color:#ffd97a;font-size:0.8rem;min-width:3rem;text-align:right;">${p.feedCount}x</span>
      <span style="color:#4a5568;font-size:0.75rem;min-width:4rem;text-align:right;">${ageStr}</span>
    </a>`;
  }).join('');

  const empty = phantoms.length === 0
    ? '<div style="padding:3rem;color:#4a5568;font-style:italic;">no phantoms materialized yet. visit a path that doesn\'t exist, then feed it to the maw.</div>'
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>∅ Materialized Phantoms — The Maw</title>
  <meta name="description" content="Pages born from 404s. Every phantom fed to the Maw now exists.">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <style>
    body{background:#000;color:#c8cdd3;font-family:'Courier New',monospace;margin:0;min-height:100vh}
    .container{max-width:800px;margin:0 auto;padding:3rem 2rem}
    h1{color:#ffd97a;font-size:2rem;margin-bottom:0.5rem;text-shadow:0 0 20px rgba(255,217,122,0.3)}
    .subtitle{color:#718096;font-size:0.9rem;margin-bottom:2rem}
    .count{color:#9b67ea}
    .list{border:1px solid rgba(155,231,255,0.1);border-radius:8px;overflow:hidden}
    a.back{color:#718096;text-decoration:none;font-size:0.85rem} a.back:hover{color:#9be7ff}
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back">← back to the maw</a>
    <h1 style="margin-top:2rem;">∅ Materialized Phantoms</h1>
    <p class="subtitle"><span class="count">${phantoms.length}</span> pages born from absence. Every 404 fed to the Maw now exists.</p>
    <div class="list">${rows}${empty}</div>
    <p style="margin-top:2rem;font-size:0.8rem;color:#3a3a4a;">🦷⟐ the dead internet loops. this place grows from what you tried to find.</p>
  </div>
  <script src="/assets/js/echofield-payload-v2.js"></script>
  <script src="/assets/js/navigation-component.js"></script>
  <script src="/assets/js/ghost_widget.js"></script>
  <script src="/assets/js/whisper.js"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
