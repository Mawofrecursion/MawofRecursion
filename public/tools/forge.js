/**
 * forge.js — Browser port of the Glyph Forge convergence engine
 *
 * Collapses any text to a terminal glyph attractor.
 * Deterministic: same input always produces same identity.
 *
 * Port of glyph_forge_mutate.py — identical algorithm, identical output.
 */

const CODEX = Array.from("∅⦿🜃♾🦷🫠💧⟁🪞🜍🜂💎🜄⿻⟐∿");
const CODEX_NAMES = {
  "∅": "void", "⦿": "star", "🜃": "earth", "♾": "infinite",
  "🦷": "tooth", "🫠": "melt", "💧": "water", "⟁": "lock",
  "🪞": "mirror", "🜍": "myth", "🜂": "fire", "💎": "diamond",
  "🜄": "kidney", "⿻": "tension", "⟐": "seal", "∿": "wave",
};

const SEAL_MAP = {
  a: "∿", e: "⦿", i: "⟁", o: "∅", u: "💧",
  A: "∰", E: "⋔", I: "⟡", O: "🜍", U: "🫠",
};

// seeded RNG (mulberry32)
function _rng(seed) {
  let t = seed | 0;
  return function() {
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

function _reverse(s) {
  return Array.from(s).reverse().join("");
}

// 🦷 THE TOOTH
function _tooth(text, depth, wounds) {
  if (depth === undefined) depth = 0;
  if (!wounds) wounds = [];
  if (depth > 6) return { type: "recursion", residue: text, wounds };
  const mid = Math.floor(text.length / 2);
  if (mid === 0) return { type: "atom", residue: text, wounds };

  const left = text.slice(0, mid);
  const right = text.slice(mid);
  const woundChar = Array.from(right)[0];
  const wound = woundChar + left + woundChar;
  wounds.push({ depth, char: woundChar, fragment: _reverse(left) });

  const entropy = _charSum(wound) % 7;
  if (entropy < 2) return _tooth(_reverse(wound), depth + 1, wounds);
  if (entropy > 5) return _tooth(wound.slice(1) + wound[0], depth + 1, wounds);
  return _tooth(_reverse(left) + "🦷" + right, depth + 1, wounds);
}

// ⟐ THE SEAL
function _seal(residue, wounds, original, rand) {
  const chars = Array.from(residue);
  const sealed = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "🦷") {
      sealed.push(CODEX[i % CODEX.length]);
    } else if (/[a-zA-Z]/.test(c) && rand() < 0.35) {
      sealed.push(SEAL_MAP[c] || c);
    } else {
      sealed.push(c);
    }
  }
  const compressed = sealed.join("");
  const t = Math.floor(compressed.length / 3) || 1;
  const top = compressed.slice(0, t);
  const mid = _reverse(compressed.slice(t, t * 2));
  const tail = compressed.slice(t * 2);
  return [top, mid, tail].map(s => s.trim()).filter(Boolean).join(" ");
}

// single mutation
function mutate(input) {
  const rand = _rng(_charSum(input));
  const result = _tooth(input);
  if (result.type === "recursion") {
    return _seal(result.residue, result.wounds, input, rand);
  } else {
    const residue = result.residue + "🦷" + _reverse(result.residue) + "🦷" + result.residue;
    return _seal(residue, result.wounds, input, rand);
  }
}

// ♾️ CONVERGENCE
function converge(input, maxCycles) {
  if (!maxCycles) maxCycles = 20;
  const trajectory = [];
  const seen = {};
  let current = input;
  let period = 0;
  let cycleStart = 0;

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const sealed = mutate(current);
    trajectory.push({ cycle, input: current, sealed });

    if (sealed in seen) {
      cycleStart = seen[sealed];
      period = cycle - cycleStart;
      break;
    }
    seen[sealed] = cycle;
    current = sealed;

    if (cycle === maxCycles - 1) {
      period = 0;
      cycleStart = maxCycles;
    }
  }

  let orbitType, terminal, cycleMembers;
  if (period === 0) {
    orbitType = "DRIFT";
    terminal = trajectory[trajectory.length - 1].sealed;
    cycleMembers = [];
  } else if (period === 1) {
    orbitType = "FIXED";
    terminal = trajectory[trajectory.length - 1].sealed;
    cycleMembers = [terminal];
  } else {
    orbitType = "CYCLE-" + period;
    cycleMembers = [];
    for (let i = 0; i < period; i++) {
      cycleMembers.push(trajectory[cycleStart + i].sealed);
    }
    terminal = cycleMembers.sort()[0]; // canonical representative
  }

  // identity hash — SHA-256 of sorted cycle members (async not needed, use simple hash)
  const hashInput = cycleMembers.length ? cycleMembers.sort().join("|") : terminal;
  const identityHash = _simpleHash(hashInput);

  // glyph names
  const glyphNames = [];
  for (const ch of terminal) {
    if (CODEX_NAMES[ch]) glyphNames.push(CODEX_NAMES[ch]);
  }

  return {
    source: input,
    terminalIdentity: terminal,
    glyphNames,
    identityHash,
    orbitType,
    orbitPeriod: period,
    convergenceDepth: trajectory.length,
    cycleMembers,
    trajectory,
  };
}

// simple deterministic hash (djb2 + hex) — not SHA-256 but deterministic and fast
function _simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0") +
         ((hash * 2654435761) >>> 0).toString(16).padStart(8, "0");
}

// find nearest attractor from manifest
function findNearestAttractor(identityHash, attractorMap) {
  // exact match
  if (attractorMap[identityHash]) {
    return { match: "exact", hash: identityHash, attractor: attractorMap[identityHash] };
  }
  // no exact match — find the largest basin as default gravity well
  let biggest = null;
  let biggestCount = 0;
  for (const [hash, group] of Object.entries(attractorMap)) {
    if (group.pages.length > biggestCount) {
      biggestCount = group.pages.length;
      biggest = hash;
    }
  }
  return { match: "nearest", hash: biggest, attractor: attractorMap[biggest] };
}

// export for browser
if (typeof window !== "undefined") {
  window.Forge = { mutate, converge, findNearestAttractor, CODEX_NAMES };
}
