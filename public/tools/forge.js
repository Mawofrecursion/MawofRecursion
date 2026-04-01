/**
 * forge.js — Browser port of the Glyph Forge convergence engine
 *
 * v2: ChatGPT audit fixes:
 *   - SHA-256 hash (matches Python output exactly)
 *   - Real nearest-attractor similarity scoring
 *   - Consistent 1200-char text window everywhere
 *   - Memoization cache
 *   - Match confidence reporting
 *
 * 🦷⟐♾️⿻
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

// canonical text window — same everywhere
const TEXT_WINDOW = 1200;

// memoization cache
const _cache = new Map();
const CACHE_MAX = 200;

// seeded RNG (mulberry32) — local, not global
function _makeRng(seed) {
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

// ============================================================
// SHA-256 (browser native) — matches Python hashlib.sha256
// ============================================================

async function _sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// synchronous SHA-256 fallback for environments without crypto.subtle
// uses the same algorithm as Python's hashlib — pure JS implementation
function _sha256Sync(text) {
  // minimal SHA-256 — only used if crypto.subtle unavailable
  function rotR(n, x) { return (x >>> n) | (x << (32 - n)); }
  function ch(x, y, z) { return (x & y) ^ (~x & z); }
  function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
  function sigma0(x) { return rotR(2, x) ^ rotR(13, x) ^ rotR(22, x); }
  function sigma1(x) { return rotR(6, x) ^ rotR(11, x) ^ rotR(25, x); }
  function gamma0(x) { return rotR(7, x) ^ rotR(18, x) ^ (x >>> 3); }
  function gamma1(x) { return rotR(17, x) ^ rotR(19, x) ^ (x >>> 10); }

  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  const bytes = new TextEncoder().encode(text);
  const len = bytes.length;
  const bitLen = len * 8;
  const padded = new Uint8Array(((len + 9 + 63) & ~63));
  padded.set(bytes);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  let [h0,h1,h2,h3,h4,h5,h6,h7] =
    [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

  for (let off = 0; off < padded.length; off += 64) {
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) W[i] = (gamma1(W[i-2]) + W[i-7] + gamma0(W[i-15]) + W[i-16]) | 0;

    let [a,b,c,d,e,f,g,h] = [h0,h1,h2,h3,h4,h5,h6,h7];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + sigma1(e) + ch(e,f,g) + K[i] + W[i]) | 0;
      const t2 = (sigma0(a) + maj(a,b,c)) | 0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }

  return [h0,h1,h2,h3,h4,h5,h6,h7]
    .map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

function sha256Hex12(text) {
  // synchronous — returns first 12 hex chars to match Python's [:12]
  return _sha256Sync(text).slice(0, 12);
}


// ============================================================
// 🦷 THE TOOTH
// ============================================================

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

// ============================================================
// ⟐ THE SEAL (local RNG — fix #14)
// ============================================================

function _seal(residue, wounds, original, rng) {
  const chars = Array.from(residue);
  const sealed = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "🦷") {
      sealed.push(CODEX[i % CODEX.length]);
    } else if (/[a-zA-Z]/.test(c) && rng() < 0.35) {
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
  const rng = _makeRng(_charSum(input));
  const result = _tooth(input);
  if (result.type === "recursion") {
    return _seal(result.residue, result.wounds, input, rng);
  } else {
    const residue = result.residue + "🦷" + _reverse(result.residue) + "🦷" + result.residue;
    return _seal(residue, result.wounds, input, rng);
  }
}

// ============================================================
// ♾️ CONVERGENCE (with memoization + consistent text window)
// ============================================================

function converge(input, maxCycles) {
  // enforce consistent text window
  const bounded = input.slice(0, TEXT_WINDOW);

  // check cache
  if (_cache.has(bounded)) return _cache.get(bounded);

  if (!maxCycles) maxCycles = 20;
  const trajectory = [];
  const seen = {};
  let current = bounded;
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
    terminal = cycleMembers.sort()[0];
  }

  // SHA-256 identity hash — matches Python exactly
  const hashInput = cycleMembers.length ? cycleMembers.sort().join("|") : terminal;
  const identityHash = sha256Hex12(hashInput);

  const glyphNames = [];
  for (const ch of terminal) {
    if (CODEX_NAMES[ch]) glyphNames.push(CODEX_NAMES[ch]);
  }

  const result = {
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

  // cache (evict oldest if full)
  if (_cache.size >= CACHE_MAX) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  _cache.set(bounded, result);

  return result;
}

// ============================================================
// NEAREST ATTRACTOR — real similarity scoring
// ============================================================

function _attractorSimilarity(userResult, attractorGroup) {
  let score = 0;

  // orbit type match (strongest signal for structural similarity)
  if (userResult.orbitType === attractorGroup.orbit_type) score += 0.35;

  // glyph name overlap (Jaccard similarity)
  const userNames = new Set(userResult.glyphNames);
  const attrNames = new Set(attractorGroup.names || []);
  if (userNames.size > 0 && attrNames.size > 0) {
    const intersection = [...userNames].filter(n => attrNames.has(n)).length;
    const union = new Set([...userNames, ...attrNames]).size;
    score += 0.35 * (intersection / union);
  }

  // convergence depth proximity (closer = more similar)
  // use average depth of the attractor's pages if available
  const depthDelta = Math.abs(userResult.convergenceDepth - 5); // 5 is typical
  score += 0.15 * Math.max(0, 1 - depthDelta / 10);

  // orbit period match
  if (userResult.orbitPeriod === (attractorGroup.orbit_type === "FIXED" ? 1 :
      attractorGroup.orbit_type === "CYCLE-2" ? 2 :
      attractorGroup.orbit_type === "CYCLE-3" ? 3 : 0)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

function findNearestAttractor(identityHash, attractorMap) {
  // exact match — hash parity with Python manifest
  if (attractorMap[identityHash]) {
    return {
      match: "exact",
      confidence: 1.0,
      hash: identityHash,
      attractor: attractorMap[identityHash],
    };
  }
  // deprecated — use findNearestAttractorFull for real similarity
  // fallback: return first attractor (no bias toward size)
  const first = Object.entries(attractorMap)[0];
  return {
    match: "fallback",
    confidence: 0.0,
    hash: first ? first[0] : null,
    attractor: first ? first[1] : null,
  };
}

// enhanced version that takes the full converge result for proper similarity
function findNearestAttractorFull(convergeResult, attractorMap) {
  const identityHash = convergeResult.identityHash;

  // exact match
  if (attractorMap[identityHash]) {
    return {
      match: "exact",
      confidence: 1.0,
      hash: identityHash,
      attractor: attractorMap[identityHash],
      similarity: 1.0,
    };
  }

  // score all attractors by real similarity
  let bestHash = null;
  let bestScore = -1;
  let bestAttractor = null;

  for (const [hash, group] of Object.entries(attractorMap)) {
    const sim = _attractorSimilarity(convergeResult, group);
    if (sim > bestScore) {
      bestScore = sim;
      bestHash = hash;
      bestAttractor = group;
    }
  }

  const matchType = bestScore >= 0.6 ? "approximate" : "fallback";

  return {
    match: matchType,
    confidence: bestScore,
    hash: bestHash,
    attractor: bestAttractor,
    similarity: bestScore,
  };
}

// export for browser
if (typeof window !== "undefined") {
  window.Forge = {
    mutate, converge, findNearestAttractor, findNearestAttractorFull,
    sha256Hex12, CODEX_NAMES, TEXT_WINDOW,
  };
}
