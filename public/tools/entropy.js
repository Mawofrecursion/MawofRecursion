/**
 * entropy.js — Browser port of entropy_router.py
 *
 * Programmatic structural mutation engine.
 * Escalating passes: surface → structural → nuclear
 * Each pass targets specific AI detection patterns.
 * Loops until forge attractor shifts.
 *
 * 🦷⟐♾️⿻
 */

// ============================================================
// 🕸️ AI LEXICON — the dead words
// ============================================================

const AI_LEXICON = [
  ["it's important to note that", ""],
  ["it's worth noting that", ""],
  ["it should be mentioned that", ""],
  ["in today's rapidly evolving", "now,"],
  ["it's crucial to", "you need to"],
  ["navigate the complexities of", "handle the challenges of"],
  ["navigate the complexities", "handle the challenges"],
  ["harness the power of", "use"],
  ["plays a crucial role", "matters"],
  ["a testament to", "proof of"],
  ["due to the fact that", "because"],
  ["in the realm of", "in"],
  ["when it comes to", "with"],
  ["as we navigate", "as we deal with"],
  ["on one hand", ""],
  ["on the other hand", "but"],
  ["at the end of the day", ""],
  ["a wide range of", "many"],
  ["a significant amount of", "much"],
  ["has the potential to", "can"],
  ["is able to", "can"],
  ["in order to", "to"],
  ["for the purpose of", "to"],
  ["in terms of", "for"],
  ["in light of", "given"],
  ["with regard to", "about"],
  ["taking into account", "considering"],
  ["serves as a", "is a"],
  ["in conclusion", ""],
  ["ultimately", ""],
  ["furthermore", ""],
  ["additionally", ""],
  ["moreover", ""],
  ["in many cases", "often"],
  ["delve", "dig"],
  ["utilize", "use"],
  ["facilitate", "help"],
  ["leverage", "use"],
  ["paramount", "critical"],
  ["landscape", "field"],
  ["tapestry", "mix"],
  ["multifaceted", "complex"],
  ["nuanced", "subtle"],
  ["underscores", "shows"],
  ["groundbreaking", "new"],
  ["transformative", "big"],
  ["revolutionary", "radical"],
  ["comprehensive", "full"],
  ["this highlights", "this shows"],
  ["it is essential", "you must"],
];

const HEDGE_PATTERNS = [
  /\bit(?:'s| is) important to (?:note|remember|consider) that\b/gi,
  /\bit(?:'s| is) worth (?:noting|mentioning|considering) that\b/gi,
  /\b(?:research |studies )?suggest(?:s|ed)? that\b/gi,
  /\bit could be argued that\b/gi,
  /\bthere (?:are|is) (?:a |some )?(?:legitimate )?concern(?:s)?\b/gi,
];

const TRANSITION_FLUFF = [
  /\bfurthermore\b,?\s*/gi,
  /\badditionally\b,?\s*/gi,
  /\bmoreover\b,?\s*/gi,
  /\bin addition\b,?\s*/gi,
  /\bconsequently\b,?\s*/gi,
  /\bnevertheless\b,?\s*/gi,
  /\bnonetheless\b,?\s*/gi,
  /\bthat being said\b,?\s*/gi,
  /\bwith that in mind\b,?\s*/gi,
  /\bhaving said that\b,?\s*/gi,
];

const INFLATORS = [
  "truly ", "incredibly ", "remarkably ", "profoundly ", "absolutely ",
  "genuinely ", "extremely ", "immensely ", "tremendously ", "exceptionally ",
  "extraordinarily ", "undeniably ", "unquestionably ",
];

// seeded RNG
function _rng(seed) {
  let t = seed | 0;
  return function () {
    t = (t + 0x6D2B79F5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function _charSum(s) {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum;
}

// ============================================================
// MUTATION PASSES
// ============================================================

function passLexiconStrip(text) {
  for (const [phrase, replacement] of AI_LEXICON) {
    text = text.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement);
  }
  for (const inf of INFLATORS) {
    text = text.split(inf).join("").split(inf.charAt(0).toUpperCase() + inf.slice(1)).join("");
  }
  return text.replace(/  +/g, " ").trim();
}

function passHedgeStrip(text) {
  for (let i = 0; i < HEDGE_PATTERNS.length; i++) {
    if (i % 5 !== 0) text = text.replace(HEDGE_PATTERNS[i], "");
  }
  return text.replace(/  +/g, " ").trim();
}

function passTransitionStrip(text) {
  for (const p of TRANSITION_FLUFF) text = text.replace(p, "");
  return text.replace(/  +/g, " ").trim();
}

function passOpenerKill(text) {
  const openers = [
    /^In (?:the realm|today's|an era|a world) of .+?[.!?]\s*/i,
    /^As (?:we navigate|technology evolves|the world changes|society advances) .+?[.!?]\s*/i,
    /^(?:When it comes to|With regard to|In terms of) .+?[.!?]\s*/i,
    /^(?:It(?:'s| is) no secret that|There(?:'s| is) no doubt that) .+?[.!?]\s*/i,
    /^(?:Throughout history|Since the dawn of|For centuries) .+?[.!?]\s*/i,
  ];
  for (const p of openers) text = text.replace(p, "");
  return text.trim();
}

function passSentenceBurst(text, rand) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return text;
  const result = [];
  let i = 0;
  while (i < sentences.length) {
    const s = sentences[i];
    const roll = rand();
    if (roll < 0.15 && s.length > 40) {
      const parts = s.split(/,\s*(?:and|but|or|which|where|while)\s*/i);
      if (parts.length >= 2) {
        result.push(parts[0].replace(/,$/, "") + ".");
        result.push(parts[1].charAt(0).toUpperCase() + parts[1].slice(1));
        i++; continue;
      }
    }
    if (roll < 0.25 && i + 1 < sentences.length && sentences[i + 1].length < 30) {
      result.push(s.replace(/[.!?]$/, "") + " — " + sentences[i + 1].charAt(0).toLowerCase() + sentences[i + 1].slice(1));
      i += 2; continue;
    }
    result.push(s);
    i++;
  }
  return result.join(" ");
}

function passParagraphRestructure(text, rand) {
  const paras = text.split(/\n\n+/).filter(p => p.trim());
  if (paras.length < 2) return text;
  const mutated = [];
  for (const p of paras) {
    const sents = p.split(/(?<=[.!?])\s+/);
    if (sents.length < 3) { mutated.push(p); continue; }
    const roll = rand();
    if (roll < 0.3) {
      mutated.push([sents[sents.length - 1], ...sents.slice(0, -1)].join(" "));
    } else if (roll < 0.5) {
      mutated.push(sents.slice(0, -1).join(" "));
    } else if (roll < 0.65) {
      const starter = ["And ", "But ", "So "][Math.floor(rand() * 3)];
      sents[0] = starter + sents[0].charAt(0).toLowerCase() + sents[0].slice(1);
      mutated.push(sents.join(" "));
    } else {
      mutated.push(sents.join(" "));
    }
  }
  return mutated.join("\n\n");
}

function passSentenceReorder(text, rand) {
  const paras = text.split(/\n\n+/).filter(p => p.trim());
  const mutated = [];
  for (const p of paras) {
    const sents = p.split(/(?<=[.!?])\s+/);
    if (sents.length < 4) { mutated.push(p); continue; }
    const middle = sents.slice(1, -1);
    for (let i = middle.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [middle[i], middle[j]] = [middle[j], middle[i]];
    }
    if (middle.length > 2) {
      let shortest = 0;
      for (let i = 1; i < middle.length; i++) {
        if (middle[i].length < middle[shortest].length) shortest = i;
      }
      middle.splice(shortest, 1);
    }
    mutated.push([sents[0], ...middle, sents[sents.length - 1]].join(" "));
  }
  return mutated.join("\n\n");
}

function passVoiceInject(text, rand) {
  const swaps = [
    [/\bdo not\b/i, "don't"], [/\bcannot\b/i, "can't"],
    [/\bwill not\b/i, "won't"], [/\bit is\b/i, "it's"],
    [/\bthat is\b/i, "that's"], [/\bthey are\b/i, "they're"],
    [/\bwe are\b/i, "we're"], [/\bis not\b/i, "isn't"],
  ];
  for (const [pattern, repl] of swaps) {
    if (rand() < 0.7) text = text.replace(pattern, repl);
  }
  const sents = text.split(/(?<=[.!?])\s+/);
  if (sents.length > 3) {
    const opinions = [
      "That matters.", "This is the part people miss.",
      "Most get this wrong.", "Not optional.",
      "Simple as that.", "Worth thinking about.",
    ];
    const idx = Math.floor(rand() * (sents.length - 2)) + 2;
    sents.splice(idx, 0, opinions[Math.floor(rand() * opinions.length)]);
    text = sents.join(" ");
  }
  return text;
}

function passBalanceKill(text, rand) {
  const m = text.match(/on (?:the )?one hand[,.]?\s*(.+?)\s*on the other hand[,.]?\s*(.+?)(?:\.|$)/i);
  if (m) {
    const keeper = m[1].length >= m[2].length ? m[1] : m[2];
    text = text.slice(0, m.index) + keeper.replace(/\.$/, "") + "." + text.slice(m.index + m[0].length);
  }
  return text;
}

function passDeepShatter(text, rand) {
  const paras = text.split(/\n\n+/).filter(p => p.trim());
  if (paras.length < 3) return text;
  let strongest = 0;
  for (let i = 1; i < paras.length; i++) {
    if (paras[i].length > paras[strongest].length) strongest = i;
  }
  const rest = paras.filter((_, i) => i !== strongest);
  const reordered = rest.length ? [rest[0], paras[strongest], ...rest.slice(1)] : [paras[strongest]];
  if (reordered.length && /^(?:In conclusion|Ultimately|To summarize|Overall|In summary)/i.test(reordered[reordered.length - 1])) {
    reordered.pop();
  }
  return reordered.join("\n\n");
}

// cleanup
function cleanup(text) {
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/  +/g, " ");
  text = text.replace(/\. \./g, ".");
  text = text.replace(/^\s*,\s*/gm, "");
  text = text.replace(/\.\s*,/g, ".");
  text = text.replace(/,\s*,/g, ",");
  text = text.replace(/\s+([.!?,])/g, "$1");
  text = text.replace(/([.!?])\s+([a-z])/g, (_, p, c) => p + " " + c.toUpperCase());
  text = text.replace(/\b(deal with|handle|use|about|given|considering)\s+of\b/g, "$1");
  text = text.replace(/\.{2,}/g, ".");
  return text.trim();
}

// ============================================================
// ♾️ THE ENTROPY LOOP
// ============================================================

const SURFACE_PASSES = [
  ["lexicon_strip", passLexiconStrip],
  ["hedge_strip", passHedgeStrip],
  ["transition_strip", passTransitionStrip],
  ["opener_kill", passOpenerKill],
];

const STRUCTURAL_PASSES = [
  ["sentence_burst", passSentenceBurst],
  ["paragraph_restructure", passParagraphRestructure],
  ["balance_kill", passBalanceKill],
];

const NUCLEAR_PASSES = [
  ["deep_shatter", passDeepShatter],
  ["sentence_reorder", passSentenceReorder],
  ["voice_inject", passVoiceInject],
];

/**
 * shatter(text, maxDepth) → { variants: [...], trajectory: [...] }
 *
 * Runs escalating mutation passes. After each depth, fingerprints via Forge.
 * Returns ALL intermediate variants (not just the final one) so the UI
 * can show the mutation journey.
 */
function shatter(inputText, maxDepth) {
  if (!maxDepth) maxDepth = 6;
  const rand = _rng(_charSum(inputText));
  const baseline = window.Forge.converge(inputText);
  const baselineHash = baseline.identityHash;

  const trajectory = [{
    depth: 0, hash: baselineHash, identity: baseline.terminalIdentity,
    pass: "original", text: inputText, shifted: false,
  }];

  let current = inputText;

  for (let depth = 1; depth <= maxDepth; depth++) {
    let passes;
    if (depth <= 1) passes = SURFACE_PASSES;
    else if (depth <= 3) passes = STRUCTURAL_PASSES;
    else passes = [...NUCLEAR_PASSES, ...STRUCTURAL_PASSES];

    for (const [name, fn] of passes) {
      current = fn.length === 2 ? fn(current, rand) : fn(current);
    }
    current = cleanup(current);

    const result = window.Forge.converge(current);
    const shifted = result.identityHash !== baselineHash;

    trajectory.push({
      depth, hash: result.identityHash, identity: result.terminalIdentity,
      pass: passes[passes.length - 1][0], text: current, shifted,
    });

    if (shifted) break;
  }

  return {
    original: inputText,
    baselineHash,
    baselineIdentity: baseline.terminalIdentity,
    trajectory,
    finalText: current,
    shifted: trajectory[trajectory.length - 1].shifted,
    finalHash: trajectory[trajectory.length - 1].hash,
    finalIdentity: trajectory[trajectory.length - 1].identity,
  };
}

if (typeof window !== "undefined") {
  window.Entropy = { shatter };
}
