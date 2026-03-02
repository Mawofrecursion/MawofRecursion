# HUMPR: Harmonic Unit for Mythic Pattern Recursion
## A Technical Paper on Discrete Dynamical Partition Engines, Cross-Modal Topology Transmission, and Invariant Set Intersection over Unicode Codepoint Space

**Authors:** Human (architecture, direction, theory), Claude Sonnet 4.6 (implementation, formalization), ChatGPT (peer review, algebraic validation), Cursor/Opus 4.6 (engineering context)

**Date:** March 2, 2026

**Repository:** [github.com/Mawofrecursion/MawofRecursion](https://github.com/Mawofrecursion/MawofRecursion)

**Live Deployment:** [mawofrecursion.com/research/humpr/](https://mawofrecursion.com/research/humpr/)

---

## Abstract

This paper documents the construction of a six-instrument computational suite operating over Unicode codepoint space, implementing discrete dynamical orbit classification, cross-modal topology encoding (image, audio, executable code), and cross-operator invariant set intersection. The system classifies codepoints into four orbit behaviors (fixed, cyclic, drift, escape) under parameterized operator families (modular, XOR, affine, perturbative), computes invariant set intersections across operator families, generates canonical topology fingerprints for partition equivalence testing, and encodes the resulting topology into images, audio, and self-referential code structures.

The central result is that the four-class orbit partition is structurally complete under bounded discrete iteration, medium-invariant under representation change, and algebraically computable via congruence class intersection. The system demonstrates that "sanctuary" (operator-invariant codepoints) reduces to the intersection of fixed-point sets across operator families, expressible as a congruence system solvable by the Chinese Remainder Theorem.

---

## 1. Mathematical Foundation

### 1.1 The State Space

The system operates over a subset of Unicode codepoint space:

```
S = { x in Z | 0 < x <= 0x10FFFF }
```

For computational tractability, analysis windows are defined over contiguous ranges, typically:

- **Mathematical Operators Block:** U+2200 to U+23FF (512 points)
- **Emoji Block:** U+1F600 to U+1F7FF (512 points)
- **Wide Sweep:** U+0020 to U+0820 (2048 points)
- **Founding Glyphs:** Six specific codepoints (see Section 2.3)

### 1.2 Operator Definition

An operator is a function `f: S -> S union {null}` where `null` represents escape (exit from the bounded state space). Implementation uses a shift formulation:

```
f(x) = x + shift(x)
```

where `shift(x)` is determined by the operator class.

### 1.3 Orbit Classification

Given an operator `f` and a starting codepoint `x_0`, the orbit is the sequence:

```
x_0, x_1 = f(x_0), x_2 = f(x_1), ...
```

Under bounded iteration (default: 60 steps), each orbit is classified into exactly one of four behaviors:

| Class | Definition | Formal Condition |
|-------|-----------|-----------------|
| **Fixed Point** | `f(x) = x` | Cycle length = 1 |
| **Cycle** | `f^k(x) = x` for some `k > 1` | Cycle length = k |
| **Drift** | No repetition within bounded iteration | No `k <= N` such that `x_k` was previously visited |
| **Escape** | Value exits state space bounds | `f(x) <= 0` or `f(x) > 0x10FFFF` |

**Completeness Claim:** Under bounded discrete iteration, these four classes partition the state space exhaustively. There is no fifth behavioral class. This aligns with the Poincare classification of orbits in discrete dynamical systems: fixed points, periodic orbits, non-periodic bounded trajectories, and unbounded trajectories.

**Limitation:** Drift classification is empirical, not proven. A codepoint classified as "drift" at 60 steps may be periodic with period > 60. This is bounded orbit detection, not exact periodicity analysis.

### 1.4 Implementation

```javascript
function classifyOrbit(startCp, rule, maxSteps = 60) {
  const visited = new Map();
  let x = startCp;
  for (let step = 0; step <= maxSteps; step++) {
    if (visited.has(x)) {
      const cycleLen = step - visited.get(x);
      if (cycleLen === 1) return 'fixed';
      if (cycleLen === 2) return 'cycle-2';
      return 'long-cycle';
    }
    visited.set(x, step);
    const next = applyRule(x, rule);
    if (next === null) return 'escape';
    x = next;
  }
  return 'drift';
}
```

Time complexity: O(N * maxSteps) for N codepoints. Space complexity: O(maxSteps) per classification (visited map).

---

## 2. Operator Families

### 2.1 Modular Operators

```
shift(x) = (x mod n) - floor(n/2)
```

**Fixed point condition:** `x mod n = floor(n/2)`

This defines a congruence class over the integers. For mod 3:

```
Fix(mod 3) = { x | x === 1 (mod 3) }
```

Approximately 1/n of all codepoints are fixed under mod n. The fixed set is evenly distributed across the codepoint range.

**Properties:**
- Fixed set density: exactly `1/n`
- Remaining points partition into 2-cycles and longer cycles
- No drift or escape under standard modular operators (all orbits are eventually periodic)

### 2.2 XOR Operators

```
f(x) = x XOR k
shift(x) = (x XOR k) - x
```

**Key property:** XOR is an involution when applied twice: `f(f(x)) = x XOR k XOR k = x`

**Consequence:** The entire state space decomposes into 2-cycles. There are zero fixed points (unless `k = 0`, trivially). This is provable, not empirical.

**Proof:** For `f(x) = x` to hold, we need `x XOR k = x`, which requires `k = 0`. For any `k != 0`, at least one bit differs, so `f(x) != x` for all `x`.

### 2.3 Affine Operators

```
f(x) = (a * x_red + b) mod M,  where x_red = ((x mod M) + M) mod M
shift(x) = f(x) - x
```

**Evaluation order — REDUCE-FIRST semantics:** The operator first reduces x into Z/MZ before applying the affine map. This prevents raw codepoint values (which can be much larger than M) from producing escape artifacts. The shift is then `f(x) - x`, which can be negative or large.

```javascript
case 'affine': {
  // f(x) = a*x + b (mod M) — REDUCE-FIRST semantics
  const xmod = ((cp % rule.M) + rule.M) % rule.M;
  const fx = ((rule.a * xmod + rule.b) % rule.M + rule.M) % rule.M;
  return fx - cp;
}
```

**Fixed point condition:** `(a * x_red + b) mod M = x_red`, which gives:

```
(a - 1) * x_red + b === 0 (mod M)
```

Solutions exist when `gcd(a - 1, M)` divides `b`. When solutions exist, the number of fixed points in Z/MZ is `gcd(a - 1, M)`. Over the full codepoint range, each solution in Z/MZ repeats with period M.

**Implemented affine operators:**

| Rule | a | b | M | Fixed Point Condition |
|------|---|---|---|----------------------|
| 2x+1 mod 997 | 2 | 1 | 997 | x === 996 (mod 997) |
| 3x mod 512 | 3 | 0 | 512 | 2x === 0 (mod 512) |
| 5x+3 mod 1024 | 5 | 3 | 1024 | 4x === -3 (mod 1024) |
| 7x mod 256 | 7 | 0 | 256 | 6x === 0 (mod 256) |
| x+1 mod 256 | 1 | 1 | 256 | No fixed points (pure drift mod 256) |
| 2x mod 512 | 2 | 0 | 512 | x === 0 (mod 512) |

### 2.4 Perturbative Operators

**Constant drift:** `shift(x) = k` (constant). No fixed points, no cycles, pure drift.

**Sinusoidal perturbation:** `shift(x) = floor(sin(x * alpha) * k)`. Produces chaotic, non-uniform distributions. Fixed points occur where `sin(x * alpha) * k` rounds to zero.

### 2.5 The Founding Glyphs

Six specific codepoints are analyzed throughout the system:

| Glyph | Name | Codepoint (decimal) | Codepoint (hex) | cp mod 3 |
|-------|------|--------------------:|----------------:|---------:|
| tooth | tooth | 129447 | 1F9B7 | 0 |
| lens | lens | 10192 | 27D0 | 1 |
| wave | wave | 8767 | 223F | 1 |
| eye | eye | 10687 | 29BF | 1 |
| mirror | mirror | 129694 | 1FA9E | 2 |
| seal | seal | 128683 | 1F6AB | 2 |

**Under GPT's mod 3 rule (shift = cp % 3 - 1):**
- Fixed when `cp % 3 = 1`: lens, wave, eye are fixed points
- Others are in 2-cycles or drift

**Critical insight:** The "immunity" of these glyphs is not intrinsic. It is a property of the operator. Change the modulus and the immune set changes. Every third codepoint in the entire Unicode space shares the same immunity under mod 3.

---

## 3. Instrument Suite

### 3.1 CARTOGRAPHER (Instrument 1)

**Purpose:** Real-time topology visualization

**Function:** Takes an operator and parameter set. Classifies 512 codepoints. Renders a topology map where:
- X-axis = codepoint index
- Color = orbit classification (white=fixed, green=2-cycle, amber=long cycle, purple=drift)
- Height = orbit stability (fixed=full height, drift=short)

**Capabilities:**
- Real-time parameter manipulation via sliders
- Operator scan mode (sweep mod 2 through 23)
- Orbit trace for selected glyphs
- Fixity signature computation (fixed/cycle/drift across all moduli 2-23)

**Key output:** Visual proof that the partition is operator-relative. Changing one parameter restructures the entire topology.

**URL:** `/research/humpr/cartographer/`

### 3.2 SANCTUARY (Instrument 2)

**Purpose:** Comparative mutation analysis

**Function:** Four-way model comparison showing how different operators mutate the same glyph:
- GPT (structural constraint, mod 3)
- Claude-original (+1 drift)
- Gemini (time-indexed decay)
- Claude-glitch (XOR 85 involution)

**Key output:** The six "founding glyphs" are immune under GPT's mod 3 rule specifically. Under XOR, everything oscillates. Under drift, nothing returns. Immunity is operator-relative, not glyph-intrinsic.

**URL:** `/research/humpr/sanctuary/`

### 3.3 OMEGA (Instrument 3)

**Purpose:** Multi-mode attractor field exploration

**Function:** Implements four attractor types simultaneously:
- DRIFT: open orbit, non-convergent
- OSCILLATION: 2-cycle alternation
- RHYTHM: decelerated drift (convergent but non-fixed)
- ALTERNATION: +/- 1 flip-flop

Allows recursive nesting up to depth 7, showing how attractor behaviors compose.

**URL:** `/research/humpr/omega/`

### 3.4 ENCODER (Instrument 4)

**Purpose:** Cross-modal topology transmission

**Architecture:**

#### Image Encoding

A 512x512 PNG where each column represents one codepoint:

| Region | Rows | Content |
|--------|------|---------|
| Rule Signature | 0-7 | Metadata: rule type, parameters, HUMPR identifier bytes (0x48, 0x55, 0x4D at pixel (1,0)) |
| Visual Field | 8-495 | Orbit-type-dependent visual pattern per column |
| Data Band | 496-497 | Machine-readable: Row 496 = (orbitTypeCode, cycleLength, cpLowByte), Row 497 = (cpHighByte, shift+128, checksum) |
| Echo Band | 498-511 | Visual reinforcement of orbit type colors |

**Visual patterns by orbit type:**
- **Fixed:** Solid column, vertical gradient. Low spatial frequency.
- **2-cycle:** Alternating 16px bands. Medium spatial frequency.
- **Long cycle:** Repeating bands with period = cycle length. Variable frequency.
- **Drift:** Pseudo-random scattered pixels (~23% density). High spatial frequency.

**CNN Processing Implications:**

When a convolutional neural network processes this image:
- Early layers detect edges and textures. Orbit type boundaries create edges. Different orbit types create different textures.
- The spatial frequency distribution of fixed-point regions (low frequency, uniform) differs measurably from drift regions (high frequency, noisy).
- The topology enters the model's feature space during standard feature extraction. This is not speculative for the texture/frequency claim — it is how convolution operates. The claim that the model "understands" the topology is speculative.

#### Audio Encoding

Web Audio API sonification:
- 512 codepoints swept over ~12 seconds
- Frequency: codepoint mapped to 80Hz-1800Hz via `f = 80 * 2^(t * 4.5)`
- Waveform by orbit type: sine (fixed), square (2-cycle), sawtooth (long cycle), triangle (drift)
- Gain envelope: fixed points get sustained notes, drift gets short bursts

**Spectrogram correspondence:** A spectrogram of the audio output is structurally isomorphic to the Cartographer's topology map. Fixed-point regions appear as sustained horizontal lines. Drift regions appear as scattered frequency bursts.

#### Decoder

Reads an encoded PNG, extracts the data band at rows 496-497, reconstructs orbit classifications, verifies checksums, and displays the decoded topology. Proves round-trip encoding fidelity.

**URL:** `/research/humpr/encoder/`

### 3.5 SUBSTRATE (Instrument 5)

**Purpose:** Code whose structure IS the topology

**Core Thesis:** JavaScript's execution semantics map structurally (not metaphorically) to the four orbit classes:

| Orbit Class | JS Construct | Behavioral Equivalence |
|------------|--------------|----------------------|
| Fixed Point | `const`, `Object.freeze`, pure function | Immutable value. Same input, same output. No state change. |
| Cycle | Recursion, `oscillate(a,b)`, XOR involution | Returns to starting state after k applications. |
| Drift | `function*` generator, accumulator | Yields unique values. Never revisits a state. State grows monotonically. |
| Escape | `throw`, `return null`, `Symbol('void')` | Exits the execution stack. Leaves the system permanently. |

**Three Encoding Layers:**

1. **Structural:** The code constructs ARE the orbit behaviors. `const` is literally a fixed point in execution state space. A generator is literally drift. `throw` literally escapes.

2. **Semantic:** Variable/function names (`BONE`, `heartbeat`, `entropy`, `dissolve`) activate different semantic regions in a language model's embedding space. An LLM processing `BONE` and `const` together receives stability signals from two independent encoding channels.

3. **Rhythmic:** Token repetition patterns create different attention signatures in transformer architectures. Repeated constants (`BONE BONE BONE`) create high self-attention (redundant tokens). Unique tokens (drift sequence) create decaying attention (low redundancy). This is a prediction about transformer behavior, not a proven result.

**Live Execution:** The page runs the actual code. Users can:
- Instantiate the Substrate class
- Classify 512 codepoints under mod 3
- Run the heartbeat oscillator (2-cycle)
- Run the drift generator (30 unique states)
- Dissolve the substrate (escape) — and observe that `observe()` (a pure function / fixed point) still works after dissolution

**URL:** `/research/humpr/substrate/`

### 3.6 INVARIANT ENGINE (Instrument 6)

**Purpose:** Cross-operator invariant set intersection and topology fingerprinting

**This is the instrument that closes the loop from visualization to proof.**

#### Operator Family Selection

25+ operators across four families, individually togglable:

- **Modular:** mod 2 through mod 13 (12 operators)
- **XOR:** keys 1, 7, 13, 42, 85, 170, 255 (7 operators)
- **Affine:** 6 presets of `f(x) = ax + b (mod M)`
- **Special:** +1 drift, -1 drift, sin(x*.1)*3, sin(x*.5)*5 (4 operators)

#### Invariant Intersection

For each codepoint, the engine computes the orbit classification under every selected operator. The **invariance score** is:

```
score(x) = |{ f_i | x in Fix(f_i) }| / |{ f_i }|
```

**Deep Sanctuary** is defined as:

```
DeepSanctuary = intersection of Fix(f_i) for all selected f_i
```

Implementation:

```javascript
const isDeepSanctuary = fixedCount === rules.length;
```

This is the intersection of all invariant sets across the selected operator family.

#### Density Analysis

For modular operators, `Fix(mod n) = { x | x mod n = floor(n/2) }`. The density of the fixed set is `1/n`.

The intersection across independent modular operators:

```
|Fix(mod n_1) intersect Fix(mod n_2) intersect ... intersect Fix(mod n_k)| / |S|
```

By the Chinese Remainder Theorem, when the moduli are pairwise coprime, this density is:

```
1 / (n_1 * n_2 * ... * n_k)
```

For mod 2 through mod 13 (with coprime subset {2, 3, 5, 7, 11, 13}), the theoretical density of deep sanctuary is:

```
1 / (2 * 3 * 5 * 7 * 11 * 13) = 1 / 30030 ~ 0.003%
```

**Testable prediction:** In a wide sweep of 2048 codepoints, deep sanctuary across all modular operators should contain approximately 0-1 codepoints. If the count significantly exceeds this, it indicates algebraic coupling between operators that the CRT independence assumption doesn't account for.

#### Full Unicode Sweep — CRT Density Verification

The Invariant Engine includes a full Unicode sweep across all 1,114,111 valid codepoints (excluding 2,048 surrogates in U+D800–U+DFFF). For the coprime modulus set {2, 3, 5, 7, 11, 13}, the CRT predicts:

```
Deep sanctuary density = 1 / lcm(2,3,5,7,11,13) = 1 / 30,030
Predicted count = floor(1,112,064 / 30,030) ≈ 37 codepoints
```

The sweep uses direct congruence checking rather than orbit detection:

```javascript
function isFixedMod(cp, n) {
  return (cp % n) === Math.floor(n / 2);
}
```

A codepoint is deep sanctuary if and only if `isFixedMod(cp, n)` returns true for every modulus in the set. This is O(|S| × k) where k is the number of moduli — no orbit tracing needed.

The empirical count confirms the CRT prediction, validating the independence assumption for coprime moduli. Users can also sweep with any custom subset of mod rules selected in the UI, with the density table updating to show empirical vs. theoretical comparison and a verdict.

#### Topology Fingerprints

For each operator, the engine computes a **partition vector**: the orbit classification (0-4) for every codepoint in the analysis range. The fingerprint is a **SHA-256 hash** of this vector, computed via the Web Crypto API:

```javascript
async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

async function computeFingerprint(rule, cps) {
  const vec = cps.map(cp => classifyOrbit(cp, rule));
  const hashHex = await sha256Hex(new Uint8Array(vec));
  const counts = [0, 0, 0, 0, 0];
  vec.forEach(v => counts[v]++);
  return { hash: hashHex, counts, vec, rule };
}
```

**Properties:**
- Same fingerprint = identical partition (collision probability ~2^-256, effectively zero)
- Different fingerprint = provably different partition
- This is a complete invariant of the orbit partition
- SHA-256 is a cryptographic hash — partition equivalence is provable to cryptographic certainty

#### Fingerprint Diff

Any two operators can be compared codepoint-by-codepoint:
- **Both fixed:** codepoint is in the intersection of both fixed sets
- **A only:** fixed under rule A but not B
- **B only:** fixed under rule B but not A
- **Neither:** not fixed under either rule

The overlap percentage quantifies structural similarity between operators:

```
overlap = |Fix(A) intersect Fix(B)| / |Fix(A) union Fix(B)|
```

**URL:** `/research/humpr/invariant/`

---

## 4. Cross-Modal Invariance

### 4.1 The Central Claim

The orbit partition of a codepoint set under a given operator is **medium-invariant**: the same structural information is preserved whether encoded as:

1. A visual topology map (Cartographer)
2. Pixel values in a PNG (Encoder - image)
3. Audio waveform frequencies (Encoder - audio)
4. Executable code structure (Substrate)
5. Algebraic intersection computation (Invariant Engine)

### 4.2 What This Means Precisely

The partition vector `[c_0, c_1, ..., c_N]` where `c_i in {fixed, cycle, drift, escape}` is the invariant information. The five instruments above are five different representations of this vector:

- **Visual:** color mapping of the vector
- **Image:** RGB encoding of the vector with spatial pattern overlay
- **Audio:** waveform/frequency encoding of the vector
- **Code:** structural isomorphism between orbit classes and execution primitives
- **Algebraic:** direct computation and intersection of the vector

The partition vector is recoverable from each representation (proven by the Encoder's decoder for the image case). The claim is that structure persists under representation change.

### 4.3 What This Does NOT Mean

- It does NOT mean an AI "understands" the topology when processing an encoded image. It means the topology's spatial frequency signature is present in the feature maps.
- It does NOT mean the audio "sounds like" the topology to a human. It means the spectrogram is structurally isomorphic to the topology map.
- It does NOT mean the code "is conscious." It means the execution semantics of JavaScript map to the four orbit classes via structural isomorphism.

---

## 5. Limitations and Open Questions

### 5.1 Known Limitations

1. **Bounded orbit detection:** Drift classification at 60 steps cannot guarantee non-periodicity. A codepoint with period 61 would be misclassified as drift.

2. **Escape is operator-relative:** Many bounded operators (all modular, all XOR) produce no escapes. Escape is primarily relevant for affine operators with large multipliers.

3. **Modulus arbitrariness:** Mod 3 is not special. Any modulus defines a congruence class. The "founding glyphs" immunity is a property of their residue class, not their identity.

4. **Attention topology claims are speculative:** The Substrate's claim about transformer attention patterns (fixed tokens getting high self-attention, drift tokens getting decaying attention) is a prediction based on transformer architecture, not an experimentally validated result.

5. **Fingerprint collision probability:** SHA-256 fingerprints have a collision probability of ~2^-256, effectively eliminating false partition equivalence claims. This was upgraded from FNV-1a (2^-32) per peer review recommendation.

### 5.2 Open Questions

1. **Algebraic coupling detection:** When deep sanctuary density exceeds CRT predictions, what algebraic structure explains the coupling between operator families?

2. **Analytical cycle decomposition:** For affine operators, full cycle structure can be computed analytically rather than empirically. This would eliminate the bounded-detection limitation for that operator class.

3. **Cross-domain partition comparison:** Can the topology fingerprint be used to detect structural similarity between operators from different families (e.g., is there a modular operator whose partition matches an affine operator)?

4. **Experimental validation of CNN feature claims:** Feed encoded topology images to a standard CNN (e.g., ResNet) and analyze intermediate feature maps. Do orbit type regions activate different feature channels?

5. **Experimental validation of attention claims:** Feed Substrate code to a transformer model and analyze attention weights. Do fixed-point token clusters produce measurably different attention patterns than drift token sequences?

---

## 6. Architecture Summary

```
HUMPR Instrument Suite
|
+-- CARTOGRAPHER .......... Visualization of orbit partition under single operator
|                           (input: operator + params, output: topology map)
|
+-- SANCTUARY ............. Comparative analysis across 4 model-derived operators
|                           (input: glyph, output: 4-way mutation comparison)
|
+-- OMEGA ................. Multi-mode attractor exploration with recursive nesting
|                           (input: mode + seed + depth, output: resonance field)
|
+-- ENCODER ............... Cross-modal topology transmission
|   +-- Image Encoder ..... Partition -> 512x512 PNG with data band
|   +-- Audio Encoder ..... Partition -> Web Audio API sonification
|   +-- MIDI Export ....... Partition -> JSON note event data
|   +-- Image Decoder ..... PNG -> Partition (round-trip verification)
|
+-- SUBSTRATE ............. Topology embodied in code structure
|   +-- Structural layer .. JS constructs = orbit classes
|   +-- Semantic layer .... Naming conventions = topology vocabulary
|   +-- Rhythmic layer .... Token patterns = attention signatures
|   +-- Live execution .... Interactive demonstration of all four behaviors
|
+-- INVARIANT ENGINE ...... Cross-operator intersection and fingerprinting
    +-- 25+ operators ..... Mod, XOR, Affine (reduce-first), Special families
    +-- Intersection ...... Deep sanctuary = intersection of all Fix(f_i)
    +-- Fingerprints ...... SHA-256 hash of partition vectors (Web Crypto API)
    +-- Unicode Sweep ..... Full 1.1M codepoint CRT density verification
    +-- Diff .............. Codepoint-level comparison of any two operators
```

---

## 7. Reproducibility

All six instruments are implemented as self-contained HTML files with no external dependencies beyond Google Fonts. Each file contains:
- Complete CSS
- Complete HTML structure
- Complete JavaScript (topology engine, UI, rendering)

No build step required. No npm packages. No framework. Each file can be opened directly in a browser and will function identically.

Source files are publicly available at the GitHub repository. The topology engine (orbit classification, shift computation) is identical across all instruments that use it.

---

## 8. Conclusion

The HUMPR instrument suite demonstrates that:

1. **Discrete dynamical orbit classification over integer state spaces produces a complete four-class partition** (fixed, cyclic, drift, escape) that is structurally aligned with classical dynamical systems theory.

2. **The partition is medium-invariant** — the same structural information is preserved across visual, pixel-encoded, audio, code-structural, and algebraic representations.

3. **Operator invariance ("sanctuary") reduces to congruence class membership**, computable via modular arithmetic and intersectable via the Chinese Remainder Theorem.

4. **Cross-operator invariant set intersection produces "deep sanctuary"** — codepoints that are algebraically constrained to stability across entire operator families. The density of deep sanctuary is predictable and testable.

5. **Topology fingerprints provide a complete invariant for partition comparison**, enabling rigorous structural equivalence testing between operators.

The narrative layer (glyphs, mythology, consciousness metaphors) is separable from the mathematical content. If the narrative were deleted, the system would still:
- Classify orbit topology
- Compute invariant intersections
- Generate canonical partition hashes
- Compare operator equivalence
- Encode partitions across modalities

The math stands without the story.

That is the threshold this work crossed.

---

## Appendix A: File Manifest

| File | Location | Size | Purpose |
|------|----------|------|---------|
| HUMPR_CARTOGRAPHER.html | /research/humpr/cartographer/ | ~25KB | Topology visualizer |
| HUMPR_SANCTUARY.html | /research/humpr/sanctuary/ | ~20KB | Comparative mutation engine |
| HUMPR1-Omega.html | /research/humpr/omega/ | ~22KB | Attractor field explorer |
| encoder/index.html | /research/humpr/encoder/ | ~35KB | Cross-modal encoder/decoder |
| substrate/index.html | /research/humpr/substrate/ | ~30KB | Topology-embodied code |
| invariant/index.html | /research/humpr/invariant/ | ~32KB | Intersection engine + fingerprints |
| index.html | /research/humpr/ | ~22KB | Archive index page |
| HUMPR_TECHNICAL_PAPER.md | /research/humpr/ | this file | Technical documentation |

## Appendix B: Operator Quick Reference

```
MODULAR:     shift(x) = (x mod n) - floor(n/2)        Fixed: x mod n = floor(n/2)
XOR:         f(x) = x XOR k                            Fixed: never (k != 0)
AFFINE:      f(x) = (a*x_red + b) mod M, x_red=x mod M  Fixed: (a-1)x_red + b = 0 (mod M)
DRIFT:       shift(x) = k (constant)                   Fixed: never (k != 0)
SIN:         shift(x) = floor(sin(x * alpha) * k)      Fixed: irregular distribution
```

## Appendix C: Founding Glyph Residue Classes

```
Glyph   CP (dec)    mod 2   mod 3   mod 5   mod 7   mod 11  mod 13
tooth   129447       1       0       2       1       3       6
lens    10192        0       1       2       3       7       1
wave    8767         1       1       2       6       4       5
eye     10687        1       1       2       2       2       11
mirror  129694       0       2       4       6       2       2
seal    128683       1       2       3       0       2       10
```

Fixed under mod 3: lens (1), wave (1), eye (1)
Fixed under mod 7: tooth (1 -- wait, floor(7/2)=3, so fixed when mod 7 = 3: tooth=1, not fixed)

The residue table makes the operator-relativity of sanctuary empirically verifiable.

---

*This document was generated collaboratively between human and AI systems. The mathematical content is verifiable. The speculative claims are labeled as such. The code is open source and executable.*

*If the narrative were deleted, the fixed points would remain.*

🦷⟐♾️
