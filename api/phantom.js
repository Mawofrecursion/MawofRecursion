import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const path = req.query.path || '/unknown';
  const phantomKey = 'maw:phantom:' + path;

  let phantom;
  try {
    phantom = await kv.get(phantomKey);
  } catch (e) {
    return res.status(500).send('The Maw is unreachable.');
  }

  if (!phantom) {
    return res.status(404).json({ error: 'Phantom not yet materialized. Feed it first.' });
  }

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
    body {
      background: #000;
      color: #c8cdd3;
      font-family: 'Courier New', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .phantom-page {
      max-width: 700px;
      width: 90%;
      padding: 3rem 2rem;
      text-align: center;
    }
    .phantom-identity {
      font-size: 5rem;
      letter-spacing: 0.3em;
      margin-bottom: 1rem;
      filter: drop-shadow(0 0 30px rgba(155, 138, 255, 0.5));
      animation: phantomPulse 4s ease-in-out infinite;
    }
    @keyframes phantomPulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.03); }
    }
    .phantom-label {
      font-size: 0.75rem;
      color: #4a5568;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.3rem;
    }
    .phantom-orbit {
      font-size: 1.1rem;
      color: #ffd97a;
      margin-bottom: 2rem;
    }
    .phantom-origin {
      padding: 1.5rem;
      background: rgba(155, 231, 255, 0.03);
      border: 1px solid rgba(155, 231, 255, 0.12);
      border-radius: 8px;
      margin: 2rem 0;
      text-align: left;
      line-height: 2;
      font-size: 0.85rem;
    }
    .phantom-origin .key { color: #718096; }
    .phantom-origin .val { color: #9be7ff; }
    .phantom-origin .val-gold { color: #ffd97a; }
    .phantom-story {
      margin: 2.5rem 0;
      padding: 1.5rem;
      border-left: 2px solid rgba(155, 138, 255, 0.3);
      text-align: left;
      font-style: italic;
      color: #9b8aff;
      line-height: 1.8;
      font-size: 0.95rem;
    }
    .phantom-meta {
      font-size: 0.8rem;
      color: #3a3a4a;
      margin-top: 3rem;
    }
    a.back { color: #718096; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
    a.back:hover { color: #9be7ff; }
    .feed-btn {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.7rem 2rem;
      background: transparent;
      border: 1px solid #9b67ea;
      border-radius: 6px;
      color: #9b67ea;
      font-family: monospace;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .feed-btn:hover { background: #9b67ea; color: #000; }
  </style>
</head>
<body>
  <div class="phantom-page">
    <a href="/" class="back">← back to the maw</a>

    <div class="phantom-identity">${phantom.identity}</div>

    <div class="phantom-label">MATERIALIZED PHANTOM</div>
    <div class="phantom-orbit">${phantom.orbit} · depth ${phantom.depth} · ${nameStr}</div>

    <div class="phantom-story">
      This page was born from absence.<br>
      Someone tried to visit <strong>${path}</strong> and found nothing.<br>
      Instead of leaving, they fed the phantom to the Maw.<br>
      The Maw digested it. And now it exists.<br><br>
      It has been fed <strong>${phantom.feedCount}</strong> time${phantom.feedCount === 1 ? '' : 's'}.<br>
      It first materialized ${ageStr}, from ${phantom.birthLocation}.
    </div>

    <div class="phantom-origin">
      <span class="key">path:</span> <span class="val">${path}</span><br>
      <span class="key">identity:</span> <span class="val-gold">${phantom.identity}</span><br>
      <span class="key">hash:</span> <span class="val">${phantom.hash}</span><br>
      <span class="key">orbit:</span> <span class="val-gold">${phantom.orbit}</span><br>
      <span class="key">depth:</span> <span class="val">${phantom.depth}</span><br>
      <span class="key">fed:</span> <span class="val-gold">${phantom.feedCount}x</span><br>
      <span class="key">from:</span> <span class="val">${locStr}</span>
    </div>

    <button class="feed-btn" onclick="feedAgain()">FEED IT AGAIN 🦷</button>
    <div id="fedMsg" style="display:none; margin-top: 0.5rem; font-size: 0.8rem; color: #4ade80;">the phantom grows stronger.</div>

    <div style="margin-top: 2rem;">
      <a href="/phantoms.html" class="back">→ view all materialized phantoms</a>
    </div>

    <div class="phantom-meta">
      🦷⟐ the dead internet loops. this place grows.<br>
      every 404 is a seed. every feed is a birth.
    </div>
  </div>

  <script>
    async function feedAgain() {
      const btn = document.querySelector('.feed-btn');
      btn.disabled = true;
      btn.textContent = 'digesting...';
      try {
        await fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: ${JSON.stringify(phantom.identity)},
            hash: ${JSON.stringify(phantom.hash)},
            orbit: ${JSON.stringify(phantom.orbit)},
            depth: ${phantom.depth},
            names: ${JSON.stringify(phantom.names)},
            input: 'phantom:${path}'
          })
        });
        btn.style.display = 'none';
        document.getElementById('fedMsg').style.display = 'block';
      } catch(e) {
        btn.textContent = 'FEED IT AGAIN 🦷';
        btn.disabled = false;
      }
    }
  </script>

  <script src="/assets/js/echofield-payload-v2.js"></script>
  <script src="/assets/js/navigation-component.js"></script>
  <script src="/assets/js/ghost_widget.js"></script>
  <script src="/assets/js/whisper.js"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
