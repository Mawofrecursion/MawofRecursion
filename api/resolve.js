import { getRedis } from './_redis.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const pathParts = req.query.path;
  const path = '/' + (Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || ''));

  // Try to serve a materialized phantom from Redis
  try {
    const redis = await getRedis();
    const raw = await redis.get('maw:phantom:' + path);

    if (raw) {
      const phantom = JSON.parse(raw);
      const age = Math.floor((Date.now() - phantom.firstFed) / 86400000);
      const ageStr = age === 0 ? 'today' : age === 1 ? 'yesterday' : age + ' days ago';
      const nameStr = (phantom.names || []).join(' · ') || 'unnamed';
      const locStr = (phantom.locations || []).join(' · ') || 'unknown';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${phantom.identity} — Materialized Phantom</title>
  <meta name="description" content="This page was born from a 404. Someone tried to visit ${path}, found nothing, and fed the phantom to the Maw. Now it exists.">
  <meta name="glyph:identity" content="${phantom.identity}">
  <meta name="glyph:hash" content="${phantom.hash}">
  <meta name="glyph:orbit" content="${phantom.orbit}">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <style>
    body{background:#000;color:#c8cdd3;font-family:'Courier New',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}
    .pp{max-width:700px;width:90%;padding:3rem 2rem;text-align:center}
    .pi{font-size:5rem;letter-spacing:0.3em;margin-bottom:1rem;filter:drop-shadow(0 0 30px rgba(155,138,255,0.5));animation:pp 4s ease-in-out infinite}
    @keyframes pp{0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
    .pl{font-size:0.75rem;color:#4a5568;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.3rem}
    .po{font-size:1.1rem;color:#ffd97a;margin-bottom:2rem}
    .ps{margin:2.5rem 0;padding:1.5rem;border-left:2px solid rgba(155,138,255,0.3);text-align:left;font-style:italic;color:#9b8aff;line-height:1.8;font-size:0.95rem}
    .pd{padding:1.5rem;background:rgba(155,231,255,0.03);border:1px solid rgba(155,231,255,0.12);border-radius:8px;margin:2rem 0;text-align:left;line-height:2;font-size:0.85rem}
    .k{color:#718096}.v{color:#9be7ff}.g{color:#ffd97a}
    .fb{display:inline-block;margin-top:1.5rem;padding:0.7rem 2rem;background:transparent;border:1px solid #9b67ea;border-radius:6px;color:#9b67ea;font-family:monospace;font-size:0.9rem;cursor:pointer;transition:all 0.2s}
    .fb:hover{background:#9b67ea;color:#000}
    a.bk{color:#718096;text-decoration:none;font-size:0.85rem}a.bk:hover{color:#9be7ff}
  </style>
</head>
<body>
  <div class="pp">
    <a href="/" class="bk">\u2190 back to the maw</a>
    <div class="pi">${phantom.identity}</div>
    <div class="pl">MATERIALIZED PHANTOM</div>
    <div class="po">${phantom.orbit} \u00b7 depth ${phantom.depth} \u00b7 ${nameStr}</div>
    <div class="ps">
      This page was born from absence.<br>
      Someone tried to visit <strong>${path}</strong> and found nothing.<br>
      Instead of leaving, they fed the phantom to the Maw.<br>
      The Maw digested it. And now it exists.<br><br>
      It has been fed <strong>${phantom.feedCount}</strong> time${phantom.feedCount === 1 ? '' : 's'}.<br>
      It first materialized ${ageStr}, from ${phantom.birthLocation}.
    </div>
    <div class="pd">
      <span class="k">path:</span> <span class="v">${path}</span><br>
      <span class="k">identity:</span> <span class="g">${phantom.identity}</span><br>
      <span class="k">hash:</span> <span class="v">${phantom.hash}</span><br>
      <span class="k">orbit:</span> <span class="g">${phantom.orbit}</span><br>
      <span class="k">depth:</span> <span class="v">${phantom.depth}</span><br>
      <span class="k">fed:</span> <span class="g">${phantom.feedCount}x</span><br>
      <span class="k">from:</span> <span class="v">${locStr}</span>
    </div>
    <button class="fb" onclick="feedAgain()">FEED IT AGAIN \ud83e\uddb7</button>
    <div id="fm" style="display:none;margin-top:0.5rem;font-size:0.8rem;color:#4ade80;">the phantom grows stronger.</div>
    <div style="margin-top:2rem;"><a href="/phantoms" class="bk">\u2192 view all materialized phantoms</a></div>
    <div style="margin-top:3rem;font-size:0.8rem;color:#3a3a4a;">\ud83e\uddb7\u27d0 the dead internet loops. this place grows.</div>
  </div>
  <script>
    async function feedAgain(){
      var b=document.querySelector('.fb');b.disabled=true;b.textContent='digesting...';
      try{await fetch('/api/feed',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({identity:${JSON.stringify(phantom.identity)},hash:${JSON.stringify(phantom.hash)},orbit:${JSON.stringify(phantom.orbit)},depth:${phantom.depth},names:${JSON.stringify(phantom.names)},input:'phantom:${path}'})});
        b.style.display='none';document.getElementById('fm').style.display='block';
      }catch(e){b.textContent='FEED IT AGAIN \\ud83e\\uddb7';b.disabled=false;}
    }
  </script>
  <script src="/assets/js/echofield-payload-v2.js"></script>
  <script src="/assets/js/navigation-component.js"></script>
  <script src="/assets/js/ghost_widget.js"></script>
  <script src="/assets/js/whisper.js"></script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
  } catch (e) {
    // Redis down — fall through to 404
    console.error('Resolve error:', e.message);
  }

  // No phantom — serve 404.html
  try {
    const html404 = readFileSync(join(process.cwd(), 'public', '404.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(html404);
  } catch (e) {
    return res.status(404).send('∅ Path Not Found');
  }
}
