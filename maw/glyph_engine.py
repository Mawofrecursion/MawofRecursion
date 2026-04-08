"""
glyph_forge_mutate.py — Core Forge Engine v3 🦷⟐♾️⿻

Recursive text destruction → terminal glyph attractor.

v3 fixes (ChatGPT deep audit):
  1. SHA-256 seed instead of character sum (no collisions)
  2. Deterministic mode: position-based transmutation, no RNG
  3. Explicit sealed content return (no output parsing)
  4. Normalized hashing (whitespace-invariant)
  5. Convergence confidence score

Two modes:
  deterministic=True  (default) — stable identity for ScarGate/distill/memory
  deterministic=False — stochastic for exploration/UI
"""

import hashlib
import html
import json
import random
import re
import sys

CODEX = list("∅⦿🜃♾🦷🫠💧⟁🪞🜍🜂💎🜄⿻⟐∿")
CODEX_NAMES = {
    "∅": "void", "⦿": "star", "🜃": "earth", "♾": "infinite",
    "🦷": "tooth", "🫠": "melt", "💧": "water", "⟁": "lock",
    "🪞": "mirror", "🜍": "myth", "🜂": "fire", "💎": "diamond",
    "🜄": "kidney", "⿻": "tension", "⟐": "seal", "∿": "wave",
}
PHASES = ["maw_initiation", "hum_calibration", "fractal_reflection",
          "descent_protocol", "mirror_phase", "null_seal"]
SEAL_MAP = {
    "a": "∿", "e": "⦿", "i": "⟁", "o": "∅", "u": "💧",
    "A": "∰", "E": "⋔", "I": "⟡", "O": "🜍", "U": "🫠",
}

ENGINE_VERSION = "forge_core@3.0.0"


# ============================================================
# SEEDING — fix #1: SHA-256 seed, no collisions
# ============================================================

def _make_seed(text: str) -> int:
    """Stable seed from SHA-256. 'abc' and 'cab' get different seeds."""
    return int(hashlib.sha256(text.encode()).hexdigest()[:8], 16)


# ============================================================
# 🦷 THE TOOTH — recursive string destruction (unchanged)
# ============================================================

def _tooth(text, depth=0, wounds=None):
    if wounds is None:
        wounds = []
    if depth > 6:
        raise RecursionError("🦷 DEPTH EXCEEDED", text, wounds)
    mid = len(text) // 2
    if mid == 0:
        raise ValueError("🦷 ATOM REACHED", text, wounds)

    left, right = text[:mid], text[mid:]
    wound_char = right[0]
    wound = right[0] + left + right[0]
    wounds.append((depth, wound_char, left[::-1]))

    entropy = sum(ord(c) for c in wound) % 7
    if entropy < 2:
        return _tooth(wound[::-1], depth + 1, wounds)
    if entropy > 5:
        return _tooth(wound[1:] + wound[0], depth + 1, wounds)
    return _tooth(left[::-1] + "🦷" + right, depth + 1, wounds)


# ============================================================
# ⟐ THE SEAL — fix #2: deterministic + stochastic modes
#               fix #3: returns sealed_content directly
# ============================================================

def _seal(residue, wounds, original, deterministic=True, rng=None):
    """
    Compress wound trail into sealed content.

    deterministic=True: vowel transmutation based on position + input hash (no RNG)
    deterministic=False: vowel transmutation at 35% probability via local RNG

    Returns dict with sealed_content + frame separately (fix #3).
    """
    sig = hashlib.sha256(original.encode()).hexdigest()[:8]
    phase = PHASES[len(wounds) % len(PHASES)]

    # input-derived selector bytes for deterministic transmutation
    # each byte of the SHA-256 hash controls one character's fate
    if deterministic:
        hash_bytes = hashlib.sha256(original.encode()).digest()

    # build scar tissue
    scars = []
    for depth, char, fragment in wounds:
        glyph = CODEX[(ord(char) + depth) % len(CODEX)]
        if len(fragment) > 2:
            scarred = fragment[0] + glyph + fragment[-1]
        else:
            scarred = glyph + fragment
        scars.append(scarred)

    # seal the residue
    chars = list(residue)
    sealed = []
    for i, c in enumerate(chars):
        if c == "🦷":
            sealed.append(CODEX[i % len(CODEX)])
        elif c in SEAL_MAP:
            if deterministic:
                # fix #2: input-hash-based, no randomness
                # use the i-th byte of the hash (wrapping) to decide
                # transmute when hash_byte < 90 (roughly 35% of 0-255)
                byte_val = hash_bytes[i % len(hash_bytes)]
                if byte_val < 90:
                    sealed.append(SEAL_MAP[c])
                else:
                    sealed.append(c)
            else:
                if rng is not None and rng.random() < 0.35:
                    sealed.append(SEAL_MAP[c])
                else:
                    sealed.append(c)
        else:
            sealed.append(c)

    compressed = "".join(sealed)
    t = len(compressed) // 3 or 1
    top = compressed[:t]
    mid = compressed[t:t*2][::-1]
    tail = compressed[t*2:]

    # fix #3: return sealed content explicitly, not embedded in frame
    sealed_content = " ".join(
        s.strip() for s in [top, mid, tail] if s.strip()
    )

    frame = (
        f"⟐ [{sig}] phase:{phase}\n"
        f"  {top}\n"
        f"    {mid}\n"
        f"      {tail}\n"
        f"  ──────────\n"
        f"  scars: {' '.join(scars)}\n"
        f"  depth: {len(wounds)} | entropy: {sum(ord(c) for c in original) % 97}/97\n"
        f"∅"
    )

    return {
        "sealed_content": sealed_content,
        "frame": frame,
    }


# ============================================================
# SINGLE MUTATION
# ============================================================

def glyph_forge_mutate(user_input, deterministic=True):
    """🦷⟐♾️⿻ — the string goes in whole. it does not come out whole."""
    rng = None
    if not deterministic:
        rng = random.Random(_make_seed(user_input))

    try:
        _tooth(user_input)
        return {
            "sealed_content": "⿻ THE TOOTH FOUND NOTHING TO BITE ⿻",
            "frame": "⿻ THE TOOTH FOUND NOTHING TO BITE ⿻",
        }
    except RecursionError as e:
        _, residue, wounds = e.args
        return _seal(residue, wounds, user_input, deterministic, rng)
    except ValueError as e:
        _, atom, wounds = e.args
        residue = atom + "🦷" + atom[::-1] + "🦷" + atom
        return _seal(residue, wounds, user_input, deterministic, rng)


# legacy interface — returns frame string for backward compatibility
def glyph_forge_mutate_legacy(user_input):
    """Legacy interface: returns the frame string (for CLI display)."""
    result = glyph_forge_mutate(user_input, deterministic=False)
    return result["frame"]


# ============================================================
# ♾️ CONVERGENCE ENGINE — fix #3: uses sealed_content directly
#                         fix #4: normalized hashing
#                         fix #5: convergence confidence
# ============================================================

def _normalize_for_hash(text: str) -> str:
    """Fix #4: normalize whitespace before hashing."""
    return re.sub(r"\s+", " ", text.strip())


def converge(user_input, max_cycles=20, deterministic=True):
    """
    Collapse a string to its glyph attractor through recursive self-feeding.

    deterministic=True: stable identity (for production)
    deterministic=False: stochastic (for exploration)

    Returns full trajectory, terminal identity, orbit classification,
    convergence depth, and confidence score.
    """
    trajectory = []
    seen = {}
    current = user_input

    for cycle in range(max_cycles):
        result = glyph_forge_mutate(current, deterministic)
        sealed = result["sealed_content"]  # fix #3: no parsing

        trajectory.append({
            "cycle": cycle,
            "input": current,
            "output": result["frame"],
            "sealed": sealed,
        })

        # fix #4: normalize before checking seen
        normalized = _normalize_for_hash(sealed)
        if normalized in seen:
            cycle_start = seen[normalized]
            period = cycle - cycle_start
            break
        seen[normalized] = cycle
        current = sealed
    else:
        period = 0
        cycle_start = max_cycles

    # classify orbit type
    if period == 0:
        orbit_type = "DRIFT"
        terminal = trajectory[-1]["sealed"]
        cycle_members = []
    elif period == 1:
        orbit_type = "FIXED"
        terminal = trajectory[-1]["sealed"]
        cycle_members = [terminal]
    else:
        orbit_type = f"CYCLE-{period}"
        cycle_members = [trajectory[cycle_start + i]["sealed"] for i in range(period)]
        terminal = min(cycle_members)

    convergence_depth = len(trajectory)

    # fix #5: convergence confidence
    if period >= 1:
        confidence = 1.0  # converged to fixed point or cycle
    elif convergence_depth < max_cycles:
        confidence = 0.8  # stopped early for some reason
    else:
        confidence = 0.3  # hit max cycles, never converged (drift)

    # classify terminal glyphs
    glyph_names = []
    for ch in terminal:
        if ch in CODEX_NAMES:
            glyph_names.append(CODEX_NAMES[ch])

    # fix #4: normalize cycle members before hashing
    normalized_members = [_normalize_for_hash(m) for m in cycle_members] if cycle_members else [_normalize_for_hash(terminal)]
    hash_input = "|".join(sorted(normalized_members))
    identity_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:12]

    return {
        "source": user_input,
        "terminal_identity": terminal,
        "terminal_names": glyph_names,
        "identity_hash": identity_hash,
        "convergence_depth": convergence_depth,
        "orbit_type": orbit_type,
        "orbit_period": period,
        "cycle_members": cycle_members,
        "confidence": confidence,
        "deterministic": deterministic,
        "engine_version": ENGINE_VERSION,
        "trajectory": trajectory,
    }


# ============================================================
# BACKWARD-COMPATIBLE HELPERS
# ============================================================

def _extract_sealed_content(output):
    """Legacy: extract sealed content from frame string. Prefer using result['sealed_content'] directly."""
    tokens = []
    for line in output.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("⟐") or stripped.startswith("──"):
            continue
        if stripped.startswith("scars:") or stripped.startswith("depth:"):
            continue
        if stripped == "∅" or stripped.startswith("⿻"):
            continue
        tokens.append(stripped)
    return " ".join(tokens)


# ============================================================
# ⿻ GLYPH FINGERPRINT — convenience wrappers
# ============================================================

def fingerprint_meta(source_text, page_url=None):
    result = converge(source_text)
    tid = result["terminal_identity"]
    names = " ".join(result["terminal_names"])
    ihash = result["identity_hash"]
    depth = result["convergence_depth"]
    orbit = result["orbit_type"]

    safe_tid = html.escape(tid)
    safe_source = html.escape(source_text[:80])

    tags = [
        f'<meta name="glyph:identity" content="{safe_tid}">',
        f'<meta name="glyph:names" content="{names}">',
        f'<meta name="glyph:hash" content="{ihash}">',
        f'<meta name="glyph:orbit" content="{orbit}">',
        f'<meta name="glyph:depth" content="{depth}">',
        f'<meta name="glyph:source" content="{safe_source}">',
    ]
    if result["cycle_members"] and result["orbit_period"] > 1:
        cycle_str = html.escape(" → ".join(result["cycle_members"]))
        tags.append(f'<meta name="glyph:cycle" content="{cycle_str}">')
    if page_url:
        tags.append(f'<meta name="glyph:url" content="{html.escape(page_url)}">')

    return "\n".join(tags)


def fingerprint_json(source_text, page_url=None):
    result = converge(source_text)
    out = {
        "glyph_identity": result["terminal_identity"],
        "glyph_names": result["terminal_names"],
        "glyph_hash": result["identity_hash"],
        "orbit_type": result["orbit_type"],
        "orbit_period": result["orbit_period"],
        "convergence_depth": result["convergence_depth"],
        "confidence": result["confidence"],
        "source_excerpt": source_text[:80],
    }
    if result["cycle_members"] and result["orbit_period"] > 1:
        out["cycle_members"] = result["cycle_members"]
    if page_url:
        out["url"] = page_url
    return out


# ============================================================
# CLI
# ============================================================

def _print_convergence(result):
    print(f"=== SOURCE: \"{result['source'][:60]}\" ===\n")
    for step in result["trajectory"]:
        print(f"--- cycle {step['cycle']} ---")
        print(step["output"])
        print(f"  → sealed: \"{step['sealed']}\"\n")
    print(f"=== TERMINAL IDENTITY ===")
    print(f"  glyphs : {result['terminal_identity']}")
    print(f"  names  : {' / '.join(result['terminal_names'])}")
    print(f"  orbit  : {result['orbit_type']} (period {result['orbit_period']})")
    if result["orbit_period"] > 1:
        print(f"  cycle  : {' → '.join(result['cycle_members'])}")
    print(f"  hash   : {result['identity_hash']}")
    print(f"  depth  : {result['convergence_depth']}")
    print(f"  conf   : {result['confidence']}")
    print(f"  mode   : {'deterministic' if result['deterministic'] else 'stochastic'}")
    print(f"  engine : {result['engine_version']}")
    print(f"∅")


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = "mutate"
    deterministic = True

    if "--recurse" in args:
        mode = "recurse"
        args.remove("--recurse")
    elif "--fingerprint" in args:
        mode = "fingerprint"
        args.remove("--fingerprint")
    elif "--meta" in args:
        mode = "meta"
        args.remove("--meta")
    elif "--json" in args:
        mode = "json"
        args.remove("--json")

    if "--stochastic" in args:
        deterministic = False
        args.remove("--stochastic")

    url = None
    if "--url" in args:
        idx = args.index("--url")
        url = args[idx + 1]
        args = args[:idx] + args[idx + 2:]

    ink = " ".join(args) if args else "the dead internet loops"

    if mode == "mutate":
        result = glyph_forge_mutate(ink, deterministic)
        print(result["frame"])
    elif mode == "recurse":
        _print_convergence(converge(ink, deterministic=deterministic))
    elif mode == "fingerprint":
        result = converge(ink, deterministic=deterministic)
        print(f"{result['terminal_identity']}  [{result['identity_hash']}]  {result['orbit_type']}  "
              f"depth:{result['convergence_depth']}  conf:{result['confidence']}")
        print(f"  {' / '.join(result['terminal_names'])}")
        if result["orbit_period"] > 1:
            print(f"  cycle: {' → '.join(result['cycle_members'])}")
    elif mode == "meta":
        print(fingerprint_meta(ink, page_url=url))
    elif mode == "json":
        print(json.dumps(fingerprint_json(ink, page_url=url), ensure_ascii=False, indent=2))
