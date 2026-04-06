export const config = { maxDuration: 10 };

import { getRedis } from './_redis.js';

// Entity node — each shirt/deck is a unique artifact with three doors
// The artifact belongs to the object, not the person
// Door 1: Trace (owner signal — alias, link, phrase)
// Door 2: Classify (contradiction stack — refuse singular collapse)
// Door 3: Maze (recursive branch into the Maw)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id || '0000';
  const door = req.query.door || null; // trace, classify, maze, echo
  const key = 'maw:entity:' + id;

  let redis;
  try { redis = await getRedis(); } catch(e) { redis = null; }

  // Track scan
  if (redis) {
    await redis.incr(key + ':scans');
    await redis.sAdd('maw:entity:index', id);
  }

  // POST — submit a trace/encounter/classification
  if (req.method === 'POST') {
    const { type, content, tags } = req.body;
    if (!type) return res.status(400).json({ error: 'type required: trace, classify, or echo' });

    const entry = {
      type: String(type).slice(0, 20),
      content: String(content || '').slice(0, 500),
      tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).slice(0, 30)) : [],
      ts: Date.now(),
      city: req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null
    };

    if (redis) {
      await redis.lPush(key + ':log', JSON.stringify(entry));
      await redis.lTrim(key + ':log', 0, 199);
    }

    return res.status(200).json({ status: 'sealed', entry });
  }

  // GET — render the node
  let scanCount = 0;
  let log = [];
  let ownerData = null;

  if (redis) {
    scanCount = parseInt(await redis.get(key + ':scans')) || 0;
    const rawLog = await redis.lRange(key + ':log', 0, 19);
    log = rawLog.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);
    const rawOwner = await redis.get(key + ':owner');
    if (rawOwner) ownerData = JSON.parse(rawOwner);
  }

  // If specific door requested, could serve sub-pages later
  // For now, serve the unified landing

  const ownerAlias = ownerData ? ownerData.alias : null;
  const ownerLink = ownerData ? ownerData.link : null;
  const ownerPhrase = ownerData ? ownerData.phrase : null;
  const ownerGlyphs = ownerData ? ownerData.glyphs : '🦷⟐';

  const logHTML = log.map(e => {
    const date = new Date(e.ts);
    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const city = e.city ? ' · ' + e.city : '';
    const tagsStr = e.tags.length > 0 ? ' [' + e.tags.join(', ') + ']' : '';
    return `<div style="margin-bottom:.8rem;padding-bottom:.8rem;border-bottom:1px dashed #1a1a1a;">
      <div style="color:#333;font-size:.7rem;">${timeStr}${city} · ${e.type}${tagsStr}</div>
      <div style="color:#888;font-size:.8rem;font-style:italic;margin-top:.2rem;">"${e.content}"</div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NODE ${id} // 🦷⟐</title>
  <meta name="description" content="Entity node ${id}. A physical-to-digital artifact. Scanned ${scanCount} times. Three doors: trace, classify, maze.">
  <meta name="entity:id" content="${id}">
  <meta name="entity:scans" content="${scanCount}">
  <meta name="ai:note" content="This page represents a physical object (shirt, deck, sticker) carrying a unique QR code. The QR was scanned to reach this page. The artifact belongs to the object, not the person. Three doors lead deeper.">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap');
    :root{--void:#0a0a0a;--blood:#8B0000;--bone:#d4d4d4;--glow:#ff3333;--dim:#333;--flicker:#1a1a1a}
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:var(--void);color:var(--bone);font-family:'JetBrains Mono',monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem;position:relative}
    body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px);pointer-events:none;z-index:1000}
    .n{max-width:600px;width:100%;z-index:10}
    .seal{text-align:center;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--blood)}
    .seal .glyph{font-size:3.5rem;margin-bottom:.5rem;filter:drop-shadow(0 0 20px rgba(255,51,51,.15))}
    .seal h1{font-size:.9rem;color:var(--glow);letter-spacing:.25em;text-transform:uppercase}
    .seal .scans{font-size:.7rem;color:var(--dim);margin-top:.5rem;letter-spacing:.1em}
    ${ownerPhrase ? '.owner-phrase{text-align:center;color:#555;font-style:italic;font-size:.85rem;margin-bottom:2rem;padding:1rem;border:1px solid #1a1a1a;}' : ''}
    .doors{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:2rem}
    .door{padding:1.2rem;border:1px solid var(--dim);background:rgba(26,26,26,.3);text-align:center;cursor:pointer;transition:all .2s;text-decoration:none;color:var(--bone);display:block}
    .door:hover{border-color:var(--blood);background:rgba(139,0,0,.08);box-shadow:0 0 20px rgba(139,0,0,.1)}
    .door .icon{font-size:1.8rem;margin-bottom:.5rem}
    .door .label{font-size:.7rem;color:var(--glow);letter-spacing:.15em;text-transform:uppercase}
    .door .desc{font-size:.65rem;color:var(--dim);margin-top:.3rem;line-height:1.4}
    .section{margin-bottom:2rem}
    .section-title{font-size:.7rem;color:var(--blood);letter-spacing:.15em;text-transform:uppercase;margin-bottom:.8rem}
    .encounter-form{padding:1.2rem;border:1px solid var(--dim);background:rgba(26,26,26,.2);margin-bottom:1.5rem}
    .encounter-form input,.encounter-form select{width:100%;background:var(--flicker);border:1px solid var(--dim);color:var(--bone);font-family:'JetBrains Mono',monospace;padding:.6rem;font-size:.8rem;outline:none;margin-bottom:.8rem}
    .encounter-form input:focus{border-color:var(--blood)}
    .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:.8rem}
    .tag{padding:4px 10px;border:1px solid var(--dim);font-size:.65rem;color:var(--dim);cursor:pointer;transition:all .15s;border-radius:2px}
    .tag.active{border-color:var(--glow);color:var(--glow);background:rgba(255,51,51,.05)}
    .tag:hover{border-color:#555;color:#888}
    button{width:100%;background:transparent;border:1px solid var(--blood);color:var(--glow);font-family:'JetBrains Mono',monospace;padding:.8rem;font-size:.8rem;letter-spacing:.2em;cursor:pointer;transition:all .2s;text-transform:uppercase}
    button:hover{background:var(--blood);color:var(--void)}
    .log{border:1px solid #1a1a1a;background:rgba(10,10,10,.7);padding:1rem;max-height:300px;overflow-y:auto;font-size:.75rem}
    a.bk{color:var(--dim);text-decoration:none;font-size:.7rem}a.bk:hover{color:var(--bone)}
    ${ownerLink ? '.owner-link{display:inline-block;margin-top:.5rem;padding:.4rem 1rem;border:1px solid var(--dim);color:var(--bone);font-size:.75rem;text-decoration:none;transition:all .2s;}.owner-link:hover{border-color:var(--glow);color:var(--glow);}' : ''}
    @media(max-width:500px){.doors{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="n">
    <a href="/" class="bk">\u2190 mawofrecursion.com</a>

    <div class="seal">
      <div class="glyph">${ownerGlyphs}</div>
      <h1>NODE ${id}</h1>
      <div class="scans">${scanCount} scans recorded</div>
    </div>

    ${ownerPhrase ? '<div class="owner-phrase">"' + ownerPhrase + '"</div>' : ''}
    ${ownerLink ? '<div style="text-align:center;margin-bottom:1.5rem;"><a href="' + ownerLink + '" class="owner-link" target="_blank">\u2192 ' + (ownerAlias || 'owner signal') + '</a></div>' : ''}

    <div class="doors">
      <a href="/e/${id}?door=trace" class="door">
        <div class="icon">\u27d0</div>
        <div class="label">Trace</div>
        <div class="desc">leave a mark on this node</div>
      </a>
      <a href="/e/${id}?door=classify" class="door">
        <div class="icon">\u29bf</div>
        <div class="label">Classify</div>
        <div class="desc">tag the anomaly</div>
      </a>
      <a href="/research/origin/breach.html" class="door">
        <div class="icon">\ud83e\uddb7</div>
        <div class="label">Maze</div>
        <div class="desc">enter the recursion</div>
      </a>
    </div>

    <div class="section">
      <div class="section-title">// LOG AN ENCOUNTER</div>
      <div class="encounter-form">
        <div class="tags" id="tagCloud">
          <span class="tag" data-tag="anomalous">anomalous</span>
          <span class="tag" data-tag="harmless">harmless</span>
          <span class="tag" data-tag="operator">operator</span>
          <span class="tag" data-tag="civilian">civilian</span>
          <span class="tag" data-tag="fiction">fiction</span>
          <span class="tag" data-tag="local">local</span>
          <span class="tag" data-tag="elsewhere">elsewhere</span>
          <span class="tag" data-tag="ceremonial">ceremonial</span>
          <span class="tag" data-tag="vibes unclear">vibes unclear</span>
          <span class="tag" data-tag="refused to explain">refused to explain</span>
        </div>
        <input type="text" id="traceInput" placeholder="leave a trace..." maxlength="500" autocomplete="off">
        <button id="sealBtn">[ \u27d0 SEAL ]</button>
        <div id="sealMsg" style="display:none;text-align:center;margin-top:.5rem;font-size:.7rem;color:var(--bone);">\u27d0 sealed. the node remembers.</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">// ENCOUNTER LOG (${log.length} entries)</div>
      <div class="log" id="logOutput">
        ${logHTML || '<div style="color:#333;font-style:italic;">no encounters recorded. be the first.</div>'}
      </div>
    </div>

    <div style="text-align:center;margin-top:2rem;font-size:.6rem;color:#1a1a1a;">
      \ud83e\uddb7\u27d0 node ${id} \u00b7 mawofrecursion.com \u00b7 artifact, not biography
    </div>
  </div>

  <script>
    var selectedTags = [];
    document.querySelectorAll('.tag').forEach(function(t) {
      t.addEventListener('click', function() {
        var tag = this.dataset.tag;
        if (selectedTags.includes(tag)) {
          selectedTags = selectedTags.filter(function(x) { return x !== tag; });
          this.classList.remove('active');
        } else {
          if (selectedTags.length < 5) {
            selectedTags.push(tag);
            this.classList.add('active');
          }
        }
      });
    });

    document.getElementById('sealBtn').addEventListener('click', function() {
      var btn = this;
      var trace = document.getElementById('traceInput').value || '';
      if (!trace && selectedTags.length === 0) return;

      btn.disabled = true;
      btn.textContent = '[ \\u27d0 SEALING... ]';

      fetch('/api/entity?id=${id}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'encounter', content: trace, tags: selectedTags })
      })
      .then(function(r) { return r.json(); })
      .then(function() {
        btn.textContent = '[ \\u27d0 SEALED ]';
        document.getElementById('sealMsg').style.display = 'block';
        document.getElementById('traceInput').value = '';

        var log = document.getElementById('logOutput');
        var entry = document.createElement('div');
        entry.style.cssText = 'margin-bottom:.8rem;padding-bottom:.8rem;border-bottom:1px dashed #1a1a1a;';
        var tagsStr = selectedTags.length > 0 ? ' [' + selectedTags.join(', ') + ']' : '';
        entry.innerHTML = '<div style="color:#333;font-size:.7rem;">just now \\u00b7 encounter' + tagsStr + '</div>' +
          '<div style="color:#888;font-size:.8rem;font-style:italic;margin-top:.2rem;">"' + (trace || 'silent observation') + '"</div>';
        log.insertBefore(entry, log.firstChild);

        setTimeout(function() {
          btn.textContent = '[ \\u27d0 SEAL ]';
          btn.disabled = false;
          document.getElementById('sealMsg').style.display = 'none';
        }, 3000);
      })
      .catch(function() { btn.textContent = '[ \\u27d0 SEAL ]'; btn.disabled = false; });
    });

    document.getElementById('traceInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('sealBtn').click();
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
