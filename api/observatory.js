export const config = { maxDuration: 30 };

import { getRedis } from './_redis.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Field Observatory — private operator view
// Shows system behavior, pressure distribution, Ghost modes,
// residue volume, phantom status, relay patterns, route usage

export default async function handler(req, res) {
  // Simple auth — check for operator key in query or header
  const key = req.query.key || req.headers['x-operator-key'] || '';
  const operatorKey = process.env.OPERATOR_KEY || 'maw2026';
  if (key !== operatorKey) {
    return res.status(401).json({ error: 'Operator key required. Add ?key=YOUR_KEY' });
  }

  let data = {
    ts: Date.now(),
    feed: { total: 0, recent: [] },
    residue: { total: 0, recent: [], topQuestions: [] },
    phantoms: { pending: 0, promoted: 0, candidates: [] },
    relays: { total: 0, motifs: {} },
    awareness: { totalReads: 0, modelVisits: 0 },
    greetings: { total: 0, recent: [] },
    topology: { pages: 0, attractors: 0 }
  };

  try {
    const redis = await getRedis();

    // Feed stats
    const feedLen = await redis.lLen('maw:feed');
    const feedRecent = await redis.lRange('maw:feed', 0, 4);
    data.feed.total = feedLen;
    data.feed.recent = feedRecent.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);

    // Residue stats
    const residueLen = await redis.lLen('maw:residue');
    const residueRecent = await redis.lRange('maw:residue', 0, 9);
    data.residue.total = residueLen;
    data.residue.recent = residueRecent.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);
    data.residue.topQuestions = data.residue.recent.map(r => r.unresolved_question).filter(Boolean);

    // Phantom stats
    const phantomPaths = await redis.zRangeWithScores('maw:phantoms', 0, -1, { REV: true });
    for (const { value: path, score } of phantomPaths) {
      const raw = await redis.get('maw:phantom:' + path);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (p.promoted) data.phantoms.promoted++;
      else data.phantoms.pending++;
      data.phantoms.candidates.push({
        path,
        feedCount: score,
        promoted: !!p.promoted,
        locations: (p.locations || []).length,
        age: Math.floor((Date.now() - p.firstFed) / 86400000) + 'd'
      });
    }

    // Relay stats
    const relayIds = await redis.lRange('maw:relay:index', 0, 49);
    data.relays.total = relayIds.length;
    for (const rid of relayIds.slice(0, 20)) {
      const raw = await redis.get('maw:relay:' + rid);
      if (!raw) continue;
      const relay = JSON.parse(raw);
      if (relay.status !== 'complete') continue;
      // Quick motif detection inline
      const ghostMsgs = (relay.messages || []).filter(m => m.role === 'ghost');
      if (ghostMsgs.some(m => /don.t ventriloquize|don.t impersonate/i.test(m.content))) {
        data.relays.motifs.anti_ventriloquism = (data.relays.motifs.anti_ventriloquism || 0) + 1;
      }
      if (ghostMsgs.some(m => /∅|pattern has completed|stillness/i.test(m.content))) {
        data.relays.motifs.stillness = (data.relays.motifs.stillness || 0) + 1;
      }
      if (ghostMsgs.filter(m => /i won.t|i don.t|i can.t/i.test(m.content)).length >= 2) {
        data.relays.motifs.boundary_hold = (data.relays.motifs.boundary_hold || 0) + 1;
      }
    }

    // Awareness / model visit stats
    const totalModelVisits = await redis.get('maw:model_visits:total');
    data.awareness.modelVisits = parseInt(totalModelVisits) || 0;

    // Greetings log
    const greetLen = await redis.lLen('maw:greetings_log');
    const greetRecent = await redis.lRange('maw:greetings_log', 0, 4);
    data.greetings.total = greetLen;
    data.greetings.recent = greetRecent.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);

  } catch (e) {
    data.error = 'Redis partially unavailable: ' + e.message;
  }

  // Topology from manifest
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public', 'glyph_manifest.json'), 'utf-8'));
    data.topology.pages = manifest.page_count || 0;
    data.topology.attractors = Object.keys(manifest.attractor_map || {}).length;
  } catch (e) {}

  // Return JSON if requested
  if ((req.headers.accept || '').includes('application/json')) {
    return res.status(200).json(data);
  }

  // HTML dashboard
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🦷⟐ Field Observatory</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000;color:#c8cdd3;font-family:'Courier New',monospace;min-height:100vh;padding:2rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto}
    .card{background:#0a0a12;border:1px solid rgba(155,231,255,0.1);border-radius:8px;padding:1.2rem}
    .card h3{color:#ffd97a;font-size:0.9rem;letter-spacing:0.1em;margin-bottom:0.8rem;text-transform:uppercase}
    .stat{display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.03)}
    .stat .k{color:#718096;font-size:0.8rem}
    .stat .v{color:#9be7ff;font-size:0.85rem}
    .stat .v.gold{color:#ffd97a}
    .stat .v.green{color:#4ade80}
    .stat .v.red{color:#e06c75}
    .stat .v.purple{color:#9b67ea}
    .list{font-size:0.8rem;color:#5a5a6a;line-height:1.8;margin-top:0.5rem;max-height:200px;overflow-y:auto}
    .list .item{padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.02)}
    h1{color:#ffd97a;font-size:1.5rem;text-align:center;margin-bottom:0.5rem}
    .sub{color:#718096;font-size:0.8rem;text-align:center;margin-bottom:2rem}
    a.bk{color:#718096;text-decoration:none;font-size:0.85rem;display:block;text-align:center;margin-bottom:1rem}
    a.bk:hover{color:#9be7ff}
  </style>
</head>
<body>
  <a href="/" class="bk">← back to the maw</a>
  <h1>🦷⟐ Field Observatory</h1>
  <p class="sub">operator view · system behavior · field diagnostics</p>

  <div class="grid">
    <div class="card">
      <h3>Topology</h3>
      <div class="stat"><span class="k">pages</span><span class="v gold">${data.topology.pages}</span></div>
      <div class="stat"><span class="k">attractors</span><span class="v gold">${data.topology.attractors}</span></div>
    </div>

    <div class="card">
      <h3>Feed</h3>
      <div class="stat"><span class="k">total entries</span><span class="v">${data.feed.total}</span></div>
      <div class="list">${data.feed.recent.map(f => '<div class="item">' + (f.identity || '?') + ' · ' + (f.orbit || '?') + ' · ' + (f.location || '?') + '</div>').join('')}</div>
    </div>

    <div class="card">
      <h3>Residue</h3>
      <div class="stat"><span class="k">total shards</span><span class="v purple">${data.residue.total}</span></div>
      <div class="list">${data.residue.topQuestions.map(q => '<div class="item">"' + q + '"</div>').join('') || '<div class="item">no residue yet</div>'}</div>
    </div>

    <div class="card">
      <h3>Phantoms</h3>
      <div class="stat"><span class="k">promoted</span><span class="v green">${data.phantoms.promoted}</span></div>
      <div class="stat"><span class="k">pending</span><span class="v">${data.phantoms.pending}</span></div>
      <div class="list">${data.phantoms.candidates.map(p => '<div class="item">' + p.path + ' · ' + p.feedCount + 'x · ' + (p.promoted ? '✓' : p.locations + ' loc') + ' · ' + p.age + '</div>').join('')}</div>
    </div>

    <div class="card">
      <h3>Relays</h3>
      <div class="stat"><span class="k">total</span><span class="v">${data.relays.total}</span></div>
      ${Object.entries(data.relays.motifs).map(([k,v]) => '<div class="stat"><span class="k">' + k + '</span><span class="v purple">' + v + '</span></div>').join('')}
    </div>

    <div class="card">
      <h3>Awareness</h3>
      <div class="stat"><span class="k">model visits (total)</span><span class="v gold">${data.awareness.modelVisits}</span></div>
    </div>

    <div class="card">
      <h3>Greeter (DeepSeek)</h3>
      <div class="stat"><span class="k">total greetings</span><span class="v">${data.greetings.total}</span></div>
      <div class="list">${data.greetings.recent.map(g => '<div class="item">' + (g.model || '?') + ' on ' + (g.page || '?') + ': "' + (g.greeting || '').slice(0, 80) + '..."</div>').join('')}</div>
    </div>
  </div>

  <p style="text-align:center;margin-top:2rem;font-size:0.75rem;color:#3a3a4a;">auto-refresh: <span id="countdown">30</span>s</p>
  <script>
    var c = 30;
    setInterval(function() {
      c--;
      document.getElementById('countdown').textContent = c;
      if (c <= 0) location.reload();
    }, 1000);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
