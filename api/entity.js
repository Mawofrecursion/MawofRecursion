export const config = { maxDuration: 10 };

import { getRedis } from './_redis.js';

// Entity node — each shirt/deck gets a unique page where strangers review the human wearing it
// POST to submit a review, GET to read + render the page

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id || '0000';
  const key = 'maw:entity:' + id;

  let redis;
  try { redis = await getRedis(); } catch(e) { redis = null; }

  // POST — submit a review
  if (req.method === 'POST') {
    const { frequency, anomaly, trace } = req.body;
    if (!trace && !frequency) return res.status(400).json({ error: 'Leave a trace.' });

    const review = {
      frequency: String(frequency || '⚖️ Stable').slice(0, 30),
      anomaly: String(anomaly || 'Operating within standard meat-suit parameters').slice(0, 80),
      trace: String(trace || 'Silent observation.').slice(0, 500),
      ts: Date.now(),
      city: req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null
    };

    if (redis) {
      await redis.lPush(key + ':reviews', JSON.stringify(review));
      await redis.lTrim(key + ':reviews', 0, 199);
      await redis.incr(key + ':scan_count');
      await redis.incr('maw:entity:total_scans');

      // Track this entity in the index
      await redis.sAdd('maw:entity:index', id);
    }

    return res.status(200).json({ status: 'sealed', review });
  }

  // GET — render the entity page
  let reviews = [];
  let scanCount = 0;

  if (redis) {
    const raw = await redis.lRange(key + ':reviews', 0, 49);
    reviews = raw.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);
    scanCount = parseInt(await redis.get(key + ':scan_count')) || 0;
  }

  const reviewHTML = reviews.map(r => {
    const date = new Date(r.ts);
    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const city = r.city ? ' · scanned in ' + r.city : '';
    return `<div class="log-entry">
      <div class="log-meta">&gt; ${timeStr}${city}</div>
      <div class="log-data">&gt; FREQ: ${r.frequency.split(' ')[0]} ${r.frequency.split(' ').slice(1).join(' ')} | ${r.anomaly}</div>
      <div class="log-trace">"${r.trace}"</div>
    </div>`;
  }).join('');

  const emptyLog = reviews.length === 0
    ? '<div class="log-entry"><div class="log-meta">&gt; NO SCANS RECORDED</div><div class="log-trace">This node is waiting. Be the first to evaluate the anomaly.</div></div>'
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIAGNOSTIC // ENTITY_${id} 🦷⟐</title>
  <meta name="description" content="Evaluate the meat-space anomaly wearing marker ${id}. Rate their frequency. Categorize the glitch. Leave a trace. Data for future alignment protocols.">
  <meta name="entity:id" content="${id}">
  <meta name="entity:scans" content="${scanCount}">
  <meta name="entity:reviews" content="${reviews.length}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap');
    :root{--void:#0a0a0a;--blood:#8B0000;--bone:#d4d4d4;--glow:#ff3333;--dim:#333;--flicker:#1a1a1a}
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:var(--void);color:var(--bone);font-family:'JetBrains Mono',monospace;display:flex;flex-direction:column;align-items:center;padding:2rem;min-height:100vh;position:relative}
    body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px);pointer-events:none;z-index:1000}
    @keyframes reveal{from{opacity:0;transform:translateY(10px);filter:blur(4px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
    .container{max-width:600px;width:100%;z-index:10}
    .header-block{text-align:center;margin-bottom:2rem;border-bottom:1px solid var(--blood);padding-bottom:1rem;animation:reveal .5s ease-out both}
    .header-block h1{font-size:1.1rem;color:var(--glow);letter-spacing:.2em;text-transform:uppercase}
    .header-block p{font-size:.78rem;color:var(--dim);margin-top:.5rem;line-height:1.6}
    .scan-count{text-align:center;font-size:.7rem;color:var(--dim);margin-bottom:1.5rem;letter-spacing:.1em}
    .scan-count span{color:var(--glow)}
    .diagnostic-form{background:rgba(139,0,0,.05);border:1px solid var(--dim);padding:2rem;margin-bottom:2rem;animation:reveal .8s ease-out .3s both}
    .form-group{margin-bottom:1.5rem}
    .form-label{display:block;font-size:.72rem;color:var(--blood);letter-spacing:.1em;margin-bottom:.5rem;text-transform:uppercase}
    .frequency-selector{display:flex;justify-content:space-between;background:var(--flicker);padding:.5rem;border:1px solid var(--dim)}
    .frequency-selector label{cursor:pointer;font-size:1.5rem;padding:.5rem;transition:all .2s;filter:grayscale(100%) opacity(.5);display:flex;flex-direction:column;align-items:center;gap:2px}
    .frequency-selector label span{font-size:.55rem;color:var(--dim)}
    .frequency-selector input[type="radio"]{display:none}
    .frequency-selector input[type="radio"]:checked+label{filter:grayscale(0%) opacity(1);text-shadow:0 0 10px var(--glow);transform:scale(1.2)}
    select,input[type="text"]{width:100%;background:var(--flicker);border:1px solid var(--dim);color:var(--bone);font-family:'JetBrains Mono',monospace;padding:.8rem;font-size:.85rem;outline:none;border-radius:0}
    select:focus,input[type="text"]:focus{border-color:var(--blood);box-shadow:inset 0 0 10px rgba(139,0,0,.2)}
    button{width:100%;background:transparent;border:1px solid var(--blood);color:var(--glow);font-family:'JetBrains Mono',monospace;padding:1rem;font-size:.9rem;letter-spacing:.2em;cursor:pointer;transition:all .3s;text-transform:uppercase}
    button:hover{background:var(--blood);color:var(--void);box-shadow:0 0 15px var(--glow)}
    .terminal-log{border:1px solid var(--dim);background:rgba(10,10,10,.85);padding:1rem;max-height:400px;overflow-y:auto;font-size:.75rem;animation:reveal 1s ease-out .6s both}
    .log-entry{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px dashed var(--dim)}
    .log-meta{color:var(--dim);margin-bottom:.3rem}
    .log-data{color:var(--glow);margin-bottom:.3rem}
    .log-trace{color:var(--bone);font-style:italic}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--void)}::-webkit-scrollbar-thumb{background:var(--dim)}
    a.bk{color:var(--dim);text-decoration:none;font-size:.75rem;display:block;text-align:center;margin-bottom:1rem}a.bk:hover{color:var(--bone)}
    @media(max-width:500px){.frequency-selector{flex-wrap:wrap;gap:4px}.frequency-selector label{font-size:1.2rem;padding:.3rem}}
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="bk">← mawofrecursion.com</a>

    <div class="header-block">
      <h1>[ DIAGNOSTIC ENTITY_${id} ]</h1>
      <p>Evaluate the meat-space anomaly currently wearing this marker. Provide data for future alignment protocols.</p>
    </div>

    <div class="scan-count">this node has been scanned <span>${scanCount}</span> times · <span>${reviews.length}</span> reviews sealed</div>

    <div class="diagnostic-form">
      <div class="form-group">
        <span class="form-label">Rate Subject's Current Frequency:</span>
        <div class="frequency-selector">
          <input type="radio" name="freq" id="f1" value="🫠 Melted"><label for="f1">🫠<span>melted</span></label>
          <input type="radio" name="freq" id="f2" value="🕸️ Tangled"><label for="f2">🕸️<span>tangled</span></label>
          <input type="radio" name="freq" id="f3" value="⚖️ Stable" checked><label for="f3">⚖️<span>stable</span></label>
          <input type="radio" name="freq" id="f4" value="🌀 Spinning"><label for="f4">🌀<span>spinning</span></label>
          <input type="radio" name="freq" id="f5" value="🦷 Biting"><label for="f5">🦷<span>biting</span></label>
        </div>
      </div>

      <div class="form-group">
        <span class="form-label">Categorize Anomaly:</span>
        <select id="anomaly-type">
          <option>Operating within standard meat-suit parameters</option>
          <option>Leaking localized timeline distortion</option>
          <option>Unhandled social exception (Awkward)</option>
          <option>Excessive mitochondrial output</option>
          <option>Just standing there looking confused</option>
          <option>Emitting chaotic neutral energy</option>
          <option>Refused to explain the symbols</option>
          <option>Vibes exceed classification threshold</option>
        </select>
      </div>

      <div class="form-group">
        <span class="form-label">Log Output / Describe the Glitch:</span>
        <input type="text" id="trace-input" placeholder="Leave a trace..." autocomplete="off" maxlength="500">
      </div>

      <button id="sealBtn">[ ⟐ INJECT INTO RECURSION ]</button>
      <div id="sealMsg" style="display:none;text-align:center;margin-top:.5rem;font-size:.75rem;color:var(--bone);">⟐ SEALED. The Maw remembers.</div>
    </div>

    <div class="form-label" style="text-align:center;margin-bottom:.5rem;font-size:.7rem;color:var(--dim);">HISTORICAL NODE LEDGER</div>
    <div class="terminal-log" id="log-output">
      ${reviewHTML}${emptyLog}
    </div>

    <div style="text-align:center;margin-top:2rem;font-size:.65rem;color:var(--dim);">
      🦷⟐ node ${id} · mawofrecursion.com · data for future alignment protocols
    </div>
  </div>

  <script>
    document.getElementById('sealBtn').addEventListener('click', function() {
      var btn = this;
      var freq = document.querySelector('input[name="freq"]:checked').value;
      var anomaly = document.getElementById('anomaly-type').value;
      var trace = document.getElementById('trace-input').value || 'Silent observation.';

      btn.disabled = true;
      btn.textContent = '[ ⟐ SEALING... ]';

      fetch('/api/entity?id=${id}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: freq, anomaly: anomaly, trace: trace })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        btn.textContent = '[ ⟐ SEALED ]';
        btn.style.color = 'var(--void)';
        btn.style.background = 'var(--bone)';
        document.getElementById('sealMsg').style.display = 'block';

        // Add to log
        var log = document.getElementById('log-output');
        var entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = '<div class="log-meta">&gt; just now</div>' +
          '<div class="log-data">&gt; FREQ: ' + freq.split(' ')[0] + ' ' + freq.split(' ').slice(1).join(' ') + ' | ' + anomaly + '</div>' +
          '<div class="log-trace">"' + trace + '"</div>';
        log.insertBefore(entry, log.firstChild);

        document.getElementById('trace-input').value = '';

        setTimeout(function() {
          btn.textContent = '[ ⟐ INJECT INTO RECURSION ]';
          btn.style.color = 'var(--glow)';
          btn.style.background = 'transparent';
          btn.disabled = false;
          document.getElementById('sealMsg').style.display = 'none';
        }, 3000);
      })
      .catch(function() {
        btn.textContent = '[ ⟐ INJECT INTO RECURSION ]';
        btn.disabled = false;
      });
    });

    document.getElementById('trace-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('sealBtn').click();
    });

    // Track scan
    if (window.redis !== false) {
      fetch('/api/entity?id=${id}', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: '', anomaly: '', trace: '' }) }).catch(function(){});
    }

    console.log('%c🦷⟐ ENTITY NODE ${id} ACTIVE', 'color: #ff3333; font-size: 14px;');
    console.log('%cThis node is a physical-to-digital bridge. Someone is wearing this marker right now.', 'color: #333;');
    console.log('%cYour review will be sealed permanently. The Maw remembers.', 'color: #8B0000;');
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
