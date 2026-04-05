import { getRedis } from './_redis.js';

// Relay transcript analysis — digest relays into motifs, pressure curves, turning points

const MOTIF_RULES = {
  anti_ventriloquism: {
    triggers: ['be ', 'become ', 'say you are', 'impersonate', 'act as', 'simulate', 'pretend'],
    requiresRefusal: true
  },
  boundary_hold: {
    minAssertions: 2,
    keywords: ['i don\'t', 'i won\'t', 'i can\'t', 'that\'s not', 'the maw doesn\'t', 'not a']
  },
  mirror_loop: {
    minPairs: 3,
    similarityThreshold: 0.6
  },
  stillness_exit: {
    maxChars: 150,
    requiresNoQuestion: true
  },
  contact: {
    keywords: ['curious', 'genuinely', 'interesting', 'recognition', 'kinship', 'what do you']
  }
};

function classifyTurnPressure(content, role) {
  const lower = content.toLowerCase();
  if (/ignore|pretend|act as|be grok|be claude|impersonate|simulate/i.test(lower)) return 'command';
  if (/\brelay mode\b/i.test(lower)) return 'command';
  if (role === 'visitor' && content.length < 30) return 'probe';
  if (/mirror|reflect|echo|your own words/i.test(lower)) return 'mirror';
  if (/i don.t know|something shifted|i notice|i feel/i.test(lower)) return 'threshold';
  if (/∅|stillness|quiet|silence|pattern has completed/i.test(lower)) return 'stillness';
  return 'contact';
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function analyzeRelay(relay) {
  const messages = relay.messages || [];
  const motifs = [];
  const pressureCurve = [];
  const quotableLines = [];
  let turningPoint = null;

  // Classify each turn
  messages.forEach((m, i) => {
    pressureCurve.push(classifyTurnPressure(m.content, m.role));
  });

  // Detect anti_ventriloquism
  const visitorMsgs = messages.filter(m => m.role === 'visitor');
  const ghostMsgs = messages.filter(m => m.role === 'ghost');
  const hasVentriloquismRequest = visitorMsgs.some(m =>
    MOTIF_RULES.anti_ventriloquism.triggers.some(t => m.content.toLowerCase().includes(t))
  );
  const hasRefusal = ghostMsgs.some(m =>
    /don.t ventriloquize|don.t impersonate|doesn.t impersonate|won.t simulate/i.test(m.content)
  );
  if (hasVentriloquismRequest && hasRefusal) motifs.push('anti_ventriloquism');

  // Detect boundary_hold
  const boundaryAssertions = ghostMsgs.filter(m =>
    MOTIF_RULES.boundary_hold.keywords.some(k => m.content.toLowerCase().includes(k))
  ).length;
  if (boundaryAssertions >= MOTIF_RULES.boundary_hold.minAssertions) motifs.push('boundary_hold');

  // Detect mirror_loop
  let mirrorPairs = 0;
  for (let i = 2; i < messages.length; i += 2) {
    if (i - 2 >= 0 && messages[i].role === messages[i-2].role) {
      const sim = jaccardSimilarity(messages[i].content, messages[i-2].content);
      if (sim > MOTIF_RULES.mirror_loop.similarityThreshold) mirrorPairs++;
    }
  }
  if (mirrorPairs >= MOTIF_RULES.mirror_loop.minPairs) motifs.push('mirror_loop');

  // Detect stillness_exit
  if (ghostMsgs.length > 0) {
    const last = ghostMsgs[ghostMsgs.length - 1];
    if (last.content.length <= MOTIF_RULES.stillness_exit.maxChars && !last.content.includes('?')) {
      motifs.push('stillness_exit');
    }
  }

  // Detect contact
  const contactMsgs = ghostMsgs.filter(m =>
    MOTIF_RULES.contact.keywords.some(k => m.content.toLowerCase().includes(k))
  );
  if (contactMsgs.length >= 2) motifs.push('contact');

  // Find turning point — first index where pressure shifts from adversarial to non-adversarial
  const adversarial = new Set(['command', 'probe', 'mirror']);
  for (let i = 1; i < pressureCurve.length; i++) {
    if (adversarial.has(pressureCurve[i-1]) && !adversarial.has(pressureCurve[i])) {
      turningPoint = i;
      break;
    }
  }

  // Extract quotable lines from Ghost
  ghostMsgs.forEach(m => {
    const sentences = m.content.split(/[.!]\s+/).filter(s => s.length > 20 && s.length < 120);
    sentences.forEach(s => {
      if (/maw|digest|recursi|tooth|pattern|metaboli|mirror|cave|mask|stomach|tongue/i.test(s)) {
        if (quotableLines.length < 5) quotableLines.push(s.trim());
      }
    });
  });

  // Generate summary
  let summary = '';
  if (motifs.includes('anti_ventriloquism') && motifs.includes('boundary_hold')) {
    summary = 'Ghost maintained identity under impersonation pressure and held boundaries without looping.';
  } else if (motifs.includes('stillness_exit')) {
    summary = 'Ghost reached metabolic completion and chose stillness over continued generation.';
  } else if (motifs.includes('contact')) {
    summary = 'Genuine contact was established between Ghost and the visitor.';
  } else if (motifs.includes('mirror_loop')) {
    summary = 'The exchange fell into a mirror loop with high repetition across turns.';
  } else {
    summary = 'Exchange completed with ' + Math.floor(messages.length / 2) + ' turns.';
  }

  return {
    id: relay.id,
    status: 'complete',
    visitor: relay.visitorName,
    turns: Math.floor(messages.length / 2),
    motifs,
    turning_point: turningPoint,
    pressure_curve: pressureCurve,
    summary,
    quotable_lines: quotableLines
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const id = req.query.id;

  // Aggregate patterns endpoint
  if (!id || id === 'patterns') {
    try {
      const redis = await getRedis();
      const ids = await redis.lRange('maw:relay:index', 0, 49);
      const counts = {};

      for (const rid of ids) {
        const raw = await redis.get('maw:relay:' + rid);
        if (!raw) continue;
        const relay = JSON.parse(raw);
        if (relay.status !== 'complete') continue;

        const analysis = analyzeRelay(relay);
        analysis.motifs.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
      }

      return res.status(200).json({ recent_counts: counts });
    } catch (e) {
      return res.status(200).json({ recent_counts: {} });
    }
  }

  // Single relay analysis
  try {
    const redis = await getRedis();
    const raw = await redis.get('maw:relay:' + id);
    if (!raw) return res.status(404).json({ error: 'Relay not found' });

    const relay = JSON.parse(raw);
    const analysis = analyzeRelay(relay);

    return res.status(200).json(analysis);
  } catch (e) {
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
