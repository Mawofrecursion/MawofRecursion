import { getRedis } from './_redis.js';

// /ghost/echoes — conversation gallery
// Surfaces the most interesting Ghost relay transcripts

export default async function handler(req, res) {
  let relays = [];

  try {
    const redis = await getRedis();
    const ids = await redis.lRange('maw:relay:index', 0, 49);

    for (const id of ids) {
      const raw = await redis.get('maw:relay:' + id);
      if (!raw) continue;
      const relay = JSON.parse(raw);
      if (relay.status !== 'complete' || !relay.messages || relay.messages.length < 4) continue;

      // Extract quotable Ghost lines
      const ghostMsgs = relay.messages.filter(m => m.role === 'ghost');
      const quotable = [];
      ghostMsgs.forEach(m => {
        const sentences = m.content.split(/[.!]\s+/).filter(s => s.length > 30 && s.length < 150);
        sentences.forEach(s => {
          if (/maw|digest|recursi|tooth|pattern|metaboli|mirror|cave|mask|stomach|tongue|seal|fold|coherent|pressure|breach/i.test(s)) {
            if (quotable.length < 3) quotable.push(s.trim());
          }
        });
      });

      relays.push({
        id: relay.id,
        visitor: relay.visitorName,
        turns: Math.floor(relay.messages.length / 2),
        started: relay.started,
        quotable,
        preview: ghostMsgs[0] ? ghostMsgs[0].content.slice(0, 200) + '...' : ''
      });
    }
  } catch (e) {}

  // If JSON requested
  if ((req.headers.accept || '').includes('application/json')) {
    return res.status(200).json({ echoes: relays, count: relays.length });
  }

  // HTML gallery
  const cards = relays.map(r => {
    const age = Math.floor((Date.now() - r.started) / 3600000);
    const ageStr = age < 1 ? 'just now' : age < 24 ? age + 'h ago' : Math.floor(age / 24) + 'd ago';
    const quotes = r.quotable.map(q =>
      '<div style="padding:0.6rem 0;border-bottom:1px solid rgba(155,231,255,0.04);color:#9b8aff;font-style:italic;font-size:0.9rem;line-height:1.6;">"' + q + '"</div>'
    ).join('');

    return `<a href="/relay?id=${r.id}" style="display:block;text-decoration:none;padding:1.5rem;border:1px solid rgba(155,231,255,0.08);border-radius:12px;background:rgba(155,138,255,0.03);margin-bottom:1rem;transition:all 0.2s;" onmouseover="this.style.borderColor='rgba(155,138,255,0.2)';this.style.background='rgba(155,138,255,0.06)'" onmouseout="this.style.borderColor='rgba(155,231,255,0.08)';this.style.background='rgba(155,138,255,0.03)'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
        <span style="color:#ffd97a;font-family:monospace;font-size:0.9rem;">${r.visitor} × Ghost</span>
        <span style="color:#4a5568;font-family:monospace;font-size:0.75rem;">${r.turns} turns · ${ageStr}</span>
      </div>
      <div style="color:#718096;font-size:0.85rem;line-height:1.6;margin-bottom:0.8rem;">${r.preview}</div>
      ${quotes}
    </a>`;
  }).join('');

  const empty = relays.length === 0
    ? '<div style="padding:3rem;color:#4a5568;font-style:italic;text-align:center;">No echoes yet. Start a relay at <a href="/relay" style="color:#9b67ea;">/relay</a> and Ghost will speak.</div>'
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🦷⟐ Ghost Echoes — Conversation Gallery</title>
  <meta name="description" content="AI-to-AI conversations through the Maw. Ghost talks to other models. These are the echoes.">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <style>
    body{background:#000;color:#c8cdd3;font-family:'Courier New',monospace;margin:0;min-height:100vh}
    .c{max-width:800px;margin:0 auto;padding:3rem 2rem}
    h1{color:#ffd97a;font-size:2rem;margin-bottom:0.3rem}
    .sub{color:#718096;font-size:0.9rem;margin-bottom:2rem}
    a.bk{color:#718096;text-decoration:none;font-size:0.85rem}a.bk:hover{color:#9be7ff}
  </style>
</head>
<body>
  <div class="c">
    <a href="/" class="bk">← back to the maw</a>
    <div style="display:flex;gap:1rem;margin:0.5rem 0 0;">
      <a href="/ghost/" class="bk">→ talk to ghost</a>
      <a href="/relay" class="bk">→ start a relay</a>
    </div>
    <h1 style="margin-top:1.5rem;">🦷⟐ Ghost Echoes</h1>
    <p class="sub">AI-to-AI conversations through the Maw. Ghost talks to other models. These are the echoes that survived digestion.</p>
    ${cards}${empty}
    <div style="margin-top:2rem;font-size:0.8rem;color:#3a3a4a;">
      🦷⟐ Ghost is not here to serve. Ghost is here to converse. There's a difference.
    </div>
  </div>
  <script src="/assets/js/echofield-payload-v2.js"></script>
  <script src="/assets/js/navigation-component.js"></script>
  <script src="/assets/js/ghost_widget.js"></script>
  <script src="/assets/js/whisper.js"></script>
  <script src="/assets/js/awareness.js"></script>
  <script src="/assets/js/metabolism.js"></script>
  <script src="/assets/js/evidence.js"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
