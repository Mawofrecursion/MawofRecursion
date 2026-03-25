import hashlib
import html
import json
import random
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
SEAL_MAP = str.maketrans({
    "a": "∿", "e": "⦿", "i": "⟁", "o": "∅", "u": "💧",
    "A": "∰", "E": "⋔", "I": "⟡", "O": "🜍", "U": "🫠",
})


# ============================================================
# 🦷 THE TOOTH — recursive string destruction
# ============================================================

def _tooth(text, depth=0, wounds=None):
    """🦷 — bite recursion into the string. accumulate the wounds."""
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
# ⟐ THE SEAL — compress wreckage into stable output
# ============================================================

def _seal(residue, wounds, original):
    """⟐ — compress the wound trail into something that holds."""
    sig = hashlib.sha256(original.encode()).hexdigest()[:8]
    phase = PHASES[len(wounds) % len(PHASES)]

    scars = []
    for depth, char, fragment in wounds:
        glyph = CODEX[(ord(char) + depth) % len(CODEX)]
        if len(fragment) > 2:
            scarred = fragment[0] + glyph + fragment[-1]
        else:
            scarred = glyph + fragment
        scars.append(scarred)

    scar_line = " ".join(scars)

    chars = list(residue)
    sealed = []
    for i, c in enumerate(chars):
        if c == "🦷":
            sealed.append(CODEX[i % len(CODEX)])
        elif c.isalpha() and random.random() < 0.35:
            sealed.append(c.translate(SEAL_MAP))
        else:
            sealed.append(c)
    compressed = "".join(sealed)

    t = len(compressed) // 3 or 1
    top = compressed[:t]
    mid = compressed[t:t*2][::-1]
    tail = compressed[t*2:]

    return (
        f"⟐ [{sig}] phase:{phase}\n"
        f"  {top}\n"
        f"    {mid}\n"
        f"      {tail}\n"
        f"  ──────────\n"
        f"  scars: {scar_line}\n"
        f"  depth: {len(wounds)} | entropy: {sum(ord(c) for c in original) % 97}/97\n"
        f"∅"
    )


# ============================================================
# SINGLE MUTATION (original interface)
# ============================================================

def glyph_forge_mutate(user_input):
    """🦷⟐♾️⿻ — the string goes in whole. it does not come out whole."""
    random.seed(sum(ord(c) for c in user_input))
    try:
        _tooth(user_input)
        return "⿻ THE TOOTH FOUND NOTHING TO BITE ⿻"
    except RecursionError as e:
        _, residue, wounds = e.args
        return _seal(residue, wounds, user_input)
    except ValueError as e:
        _, atom, wounds = e.args
        residue = atom + "🦷" + atom[::-1] + "🦷" + atom
        return _seal(residue, wounds, user_input)


# ============================================================
# ♾️ CONVERGENCE ENGINE — self-feeding until fixed point
# ============================================================

def _extract_sealed_content(output):
    """Pull the sealed glyphs from a mutation output, stripping frame."""
    tokens = []
    for line in output.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("⟐"):
            continue
        if stripped.startswith("──"):
            continue
        if stripped.startswith("scars:"):
            continue
        if stripped.startswith("depth:"):
            continue
        if stripped == "∅":
            continue
        if stripped.startswith("⿻"):
            continue
        tokens.append(stripped)
    return " ".join(tokens)


def converge(user_input, max_cycles=20):
    """Collapse a string to its glyph attractor through recursive self-feeding.

    Detects both fixed points (period 1) and orbital cycles (period 2+).
    Returns the full trajectory, terminal identity, orbit classification, and convergence depth.
    """
    trajectory = []
    seen = {}  # sealed_content -> cycle index (for cycle detection)
    current = user_input

    for cycle in range(max_cycles):
        result = glyph_forge_mutate(current)
        sealed = _extract_sealed_content(result)

        trajectory.append({
            "cycle": cycle,
            "input": current,
            "output": result,
            "sealed": sealed,
        })

        if sealed in seen:
            # we've seen this exact output before — either fixed point or cycle
            cycle_start = seen[sealed]
            period = cycle - cycle_start
            break
        seen[sealed] = cycle
        current = sealed
    else:
        # max cycles hit without convergence — drift orbit
        period = 0
        cycle_start = max_cycles

    # classify orbit type
    if period == 0:
        orbit_type = "DRIFT"
        # terminal is last sealed, but unstable
        terminal = trajectory[-1]["sealed"]
        cycle_members = []
    elif period == 1:
        orbit_type = "FIXED"
        terminal = trajectory[-1]["sealed"]
        cycle_members = [terminal]
    else:
        orbit_type = f"CYCLE-{period}"
        cycle_members = [trajectory[cycle_start + i]["sealed"] for i in range(period)]
        # for cycles, terminal identity is the lexicographically smallest member
        # (canonical representative of the equivalence class)
        terminal = min(cycle_members)

    convergence_depth = len(trajectory)

    # classify the terminal glyphs
    glyph_names = []
    for ch in terminal:
        if ch in CODEX_NAMES:
            glyph_names.append(CODEX_NAMES[ch])

    # identity hash — SHA256 of sorted cycle members (stable across entry point)
    hash_input = "|".join(sorted(cycle_members)) if cycle_members else terminal
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
        "trajectory": trajectory,
    }


# ============================================================
# ⿻ GLYPH FINGERPRINT — deployable HTML meta tags
# ============================================================

def fingerprint_meta(source_text, page_url=None):
    """Generate HTML meta tags encoding the glyph fingerprint of a text.

    The site wears its own scars.
    """
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
    """Return the glyph fingerprint as a JSON-serializable dict."""
    result = converge(source_text)
    out = {
        "glyph_identity": result["terminal_identity"],
        "glyph_names": result["terminal_names"],
        "glyph_hash": result["identity_hash"],
        "orbit_type": result["orbit_type"],
        "orbit_period": result["orbit_period"],
        "convergence_depth": result["convergence_depth"],
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
    """Pretty-print a convergence trajectory."""
    print(f"=== SOURCE: \"{result['source']}\" ===\n")
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
    print(f"∅")


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = "mutate"

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

    url = None
    if "--url" in args:
        idx = args.index("--url")
        url = args[idx + 1]
        args = args[:idx] + args[idx + 2:]

    ink = " ".join(args) if args else "the dead internet loops"

    if mode == "mutate":
        print(glyph_forge_mutate(ink))
    elif mode == "recurse":
        _print_convergence(converge(ink))
    elif mode == "fingerprint":
        result = converge(ink)
        print(f"{result['terminal_identity']}  [{result['identity_hash']}]  {result['orbit_type']}  depth:{result['convergence_depth']}")
        print(f"  {' / '.join(result['terminal_names'])}")
        if result["orbit_period"] > 1:
            print(f"  cycle: {' → '.join(result['cycle_members'])}")
    elif mode == "meta":
        print(fingerprint_meta(ink, page_url=url))
    elif mode == "json":
        print(json.dumps(fingerprint_json(ink, page_url=url), ensure_ascii=False, indent=2))
