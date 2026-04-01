"""
forge_graph.py — Code Structure Topology via Forge × GitNexus 🦷⟐

Forge fingerprints every function in the GitNexus graph.
Groups by attractor basin. Scores by rarity × dependency impact.

Three layers:
  1. Fingerprint — converge every function body
  2. Rarity — score how unusual each basin is (1/basin_size)
  3. Impact — combine with GitNexus dependency count for importance

Output: SQLite database + report. Queryable over time.

Usage:
  python forge_graph.py                      # report
  python forge_graph.py --top 15             # top N basins
  python forge_graph.py --json -o map.json   # full JSON
  python forge_graph.py --db forge_graph.db  # persist to SQLite
  python forge_graph.py --heatmap            # intelligence heatmap
"""

import json
import os
import re
import sqlite3
import subprocess
import sys
from collections import defaultdict, Counter
from datetime import datetime
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glyph_forge_mutate import converge, ENGINE_VERSION, CODEX_NAMES
from scartrace.flow_tagger import extract_flow, flow_signature

# flow pattern labels — what kind of thinking is this?
FLOW_LABELS = {
    "A": "imperative",
    "AA": "imperative",
    "C": "declarative",
    "CC": "declarative",
    "CCC": "declarative",
    "CCCC": "declarative",
    "CA": "decide-then-act",
    "CCA": "decide-then-act",
    "CCCA": "decide-then-act",
    "CCCCA": "decide-then-act",
    "CCCCCA": "decide-then-act",
    "AC": "act-then-explain",
    "ACA": "act-then-explain",
    "ACCA": "act-then-explain",
    "ACACCCCC": "alternating-logic",
    "CCCCCAC": "decision-logic",
    "CCCCVCC": "gated-logic",
    "CCCCCV": "gated-logic",
    "CACCCC": "action-first-logic",
    "CE": "claim-evidence",
    "CEA": "claim-evidence-action",
    "CME": "mechanism-chain",
    "MCEVA": "full-reasoning",
    "E": "evidence-only",
    "V": "caveat-only",
    "M": "mechanism-only",
}

def _label_flow(sig: str) -> str:
    """Label a flow signature with a human-readable cognitive mode."""
    if sig in FLOW_LABELS:
        return FLOW_LABELS[sig]
    # fallback heuristics
    if not sig:
        return "empty"
    dominant = max(set(sig), key=sig.count)
    ratio = sig.count(dominant) / len(sig)
    if ratio > 0.8:
        base = {"A": "imperative", "C": "declarative", "E": "evidence-heavy",
                "M": "mechanism-heavy", "V": "caveat-heavy", "X": "comparative",
                "I": "implication-heavy"}.get(dominant, "unknown")
        return base
    if "V" in sig and "A" in sig:
        return "gated-logic"
    if "M" in sig and "E" in sig:
        return "mechanism-chain"
    if sig.count("A") >= 2:
        return "multi-action"
    if sig.count("C") >= 3 and "A" in sig:
        return "decision-logic"
    return "mixed"

# repo root is two levels up from public/tools/
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================
# GITNEXUS QUERIES
# ============================================================

def _gitnexus_cypher(query: str) -> dict:
    result = subprocess.run(
        f'npx gitnexus cypher "{query}"',
        capture_output=True, text=True, cwd=REPO_ROOT, timeout=60, shell=True,
    )
    if result.returncode != 0:
        return {"error": result.stderr}
    return json.loads(result.stdout)


def get_functions() -> List[Dict]:
    data = _gitnexus_cypher(
        "MATCH (f:Function) RETURN f.name, f.filePath, f.startLine, f.endLine ORDER BY f.filePath"
    )
    lines = data.get("markdown", "").split("\n")[2:]
    funcs = []
    for line in lines:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) >= 4:
            try:
                funcs.append({
                    "name": parts[0], "file": parts[1],
                    "start": int(parts[2]), "end": int(parts[3]),
                })
            except (ValueError, IndexError):
                continue
    return funcs


def get_impact_count(func_name: str) -> int:
    """Get upstream dependency count from GitNexus (fan-in)."""
    data = _gitnexus_cypher(
        f"MATCH (f:Function {{name: '{func_name}'}})<-[:CALLS]-(caller) RETURN count(caller) AS cnt"
    )
    lines = data.get("markdown", "").split("\n")[2:]
    for line in lines:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if parts:
            try:
                return int(parts[0])
            except ValueError:
                return 0
    return 0


# ============================================================
# FINGERPRINTING
# ============================================================

def read_function_body(func: Dict) -> str:
    filepath = os.path.join(REPO_ROOT, func["file"])
    if not os.path.exists(filepath):
        return ""
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        start = max(0, func["start"] - 1)
        end = min(len(lines), func["end"])
        return "".join(lines[start:end])
    except Exception:
        return ""


def fingerprint_functions(funcs: List[Dict], verbose: bool = False) -> List[Dict]:
    results = []
    total = len(funcs)
    for i, func in enumerate(funcs):
        body = read_function_body(func)
        if not body or len(body.strip()) < 20:
            continue

        # Layer 1: attractor basin (coarse)
        fp = converge(body[:1500], deterministic=True)

        # Layer 2: flow signature (fine — reasoning skeleton)
        flow_tags = extract_flow(body[:1500])
        flow_sig = flow_signature(flow_tags)

        # Layer 2b: forge the flow signature itself for sub-basin identity
        if len(flow_sig) >= 3:
            flow_fp = converge(flow_sig, deterministic=True)
            flow_hash = flow_fp["identity_hash"]
        else:
            flow_hash = "too_short"

        # composite identity: attractor + flow sub-basin
        composite_id = f"{fp['identity_hash']}:{flow_hash}"

        flow_label = _label_flow(flow_sig)

        results.append({
            "name": func["name"],
            "file": func["file"],
            "start": func["start"],
            "end": func["end"],
            "lines": func["end"] - func["start"],
            "glyph_hash": fp["identity_hash"],
            "terminal_identity": fp["terminal_identity"],
            "orbit_type": fp["orbit_type"],
            "convergence_depth": fp["convergence_depth"],
            "confidence": fp["confidence"],
            "glyph_names": fp["terminal_names"],
            "flow_sig": flow_sig,
            "flow_hash": flow_hash,
            "flow_label": flow_label,
            "composite_id": composite_id,
        })
        if verbose and (i + 1) % 50 == 0:
            print(f"  {i+1}/{total} fingerprinted...", file=sys.stderr)

    return results


# ============================================================
# RARITY SCORING
# ============================================================

def score_rarity(results: List[Dict]) -> List[Dict]:
    """Add rarity scores: coarse (basin) + fine (composite = basin:flow)."""
    basin_sizes = Counter(r["glyph_hash"] for r in results)
    composite_sizes = Counter(r.get("composite_id", r["glyph_hash"]) for r in results)
    total = len(results)

    for r in results:
        # coarse rarity (attractor basin only)
        size = basin_sizes[r["glyph_hash"]]
        r["basin_size"] = size
        r["rarity_score"] = round(1.0 / size, 6)
        r["basin_pct"] = round(size / total * 100, 1)

        # fine rarity (attractor + flow sub-basin)
        comp_size = composite_sizes.get(r.get("composite_id", r["glyph_hash"]), size)
        r["composite_size"] = comp_size
        r["composite_rarity"] = round(1.0 / comp_size, 6)

    return results


# ============================================================
# SQLITE PERSISTENCE
# ============================================================

def persist_to_db(results: List[Dict], db_path: str):
    """Write results to SQLite for queryable persistence."""
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS forge_functions (
            name TEXT,
            file TEXT,
            start_line INTEGER,
            end_line INTEGER,
            lines INTEGER,
            glyph_hash TEXT,
            terminal_identity TEXT,
            orbit_type TEXT,
            convergence_depth INTEGER,
            confidence REAL,
            flow_sig TEXT,
            flow_hash TEXT,
            composite_id TEXT,
            rarity_score REAL,
            composite_rarity REAL,
            basin_size INTEGER,
            basin_pct REAL,
            engine_version TEXT,
            indexed_at TEXT,
            PRIMARY KEY (file, start_line)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_glyph_hash ON forge_functions(glyph_hash)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_composite ON forge_functions(composite_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_rarity ON forge_functions(composite_rarity DESC)")

    now = datetime.utcnow().isoformat()
    conn.execute("DELETE FROM forge_functions")
    for r in results:
        conn.execute(
            "INSERT OR REPLACE INTO forge_functions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r["name"], r["file"], r["start"], r["end"], r["lines"],
             r["glyph_hash"], r["terminal_identity"], r["orbit_type"],
             r["convergence_depth"], r["confidence"],
             r.get("flow_sig", ""), r.get("flow_hash", ""), r.get("composite_id", ""),
             r["rarity_score"], r.get("composite_rarity", r["rarity_score"]),
             r["basin_size"], r["basin_pct"],
             ENGINE_VERSION, now)
        )
    conn.commit()
    conn.close()
    print(f"  Persisted {len(results)} functions to {db_path}", file=sys.stderr)


# ============================================================
# GROUPING + REPORTING
# ============================================================

def group_by_basin(results: List[Dict]) -> Dict[str, List[Dict]]:
    basins = defaultdict(list)
    for r in results:
        basins[r["glyph_hash"]].append(r)
    return dict(basins)


def print_report(basins: Dict[str, List[Dict]], top_n: int = 15, show_heatmap: bool = False):
    total_funcs = sum(len(v) for v in basins.values())
    sorted_basins = sorted(basins.items(), key=lambda x: -len(x[1]))
    dominant = sorted_basins[0] if sorted_basins else (None, [])

    # compute composite basins
    composite_basins = defaultdict(list)
    for fs in basins.values():
        for f in fs:
            composite_basins[f.get("composite_id", f["glyph_hash"])].append(f)

    print(f"\n=== FORGE GRAPH: Code Structure Topology ===")
    print(f"  Functions: {total_funcs}")
    print(f"  Attractor basins (coarse): {len(basins)}")
    print(f"  Composite basins (attractor + flow): {len(composite_basins)}")
    print(f"  Dominant attractor: {len(dominant[1])} functions ({len(dominant[1])/total_funcs*100:.0f}%)")

    # show how the dominant basin splits
    if dominant[0]:
        dom_composites = defaultdict(list)
        for f in dominant[1]:
            dom_composites[f.get("composite_id", f["glyph_hash"])].append(f)
        print(f"  Dominant splits into: {len(dom_composites)} sub-basins by flow")
        dom_sorted = sorted(dom_composites.items(), key=lambda x: -len(x[1]))
        for comp_id, fs in dom_sorted[:8]:
            flow = fs[0].get("flow_sig", "?")
            label = fs[0].get("flow_label", "?")
            print(f"    [{flow[:12]:12s}] {len(fs):4d} functions  → {label}")

    print(f"  Engine: {ENGINE_VERSION}")

    # FLOW DISTRIBUTION across entire codebase
    all_labels = Counter(f.get("flow_label", "unknown") for fs in basins.values() for f in fs)
    print(f"\n  === COGNITIVE MODE DISTRIBUTION ===")
    for label, count in all_labels.most_common():
        pct = count / total_funcs * 100
        bar = "█" * int(pct / 2.5)
        print(f"    {bar:<40s} {pct:5.1f}%  {label} ({count})")

    print()

    # RARE BASINS (the signal)
    rare = [(h, fs) for h, fs in sorted_basins if len(fs) > 1 and h != dominant[0]]
    print(f"  === RARE BASINS ({len(rare)} — the signal) ===\n")
    for h, fs in rare[:top_n]:
        identity = fs[0]["terminal_identity"]
        orbit = fs[0]["orbit_type"]
        rarity = fs[0]["rarity_score"]
        files = sorted(set(f["file"] for f in fs))
        names = [f["name"] for f in fs]

        print(f"  {identity} [{h[:8]}] {orbit} — {len(fs)} funcs, rarity:{rarity:.3f}")
        print(f"    {', '.join(names[:8])}")
        if len(files) > 1:
            print(f"    cross-file: {len(files)} files")
        print()

    # UNIQUE PATTERNS
    unique = [(h, fs[0]) for h, fs in sorted_basins if len(fs) == 1]
    print(f"  Unique patterns (1 function each): {len(unique)}")
    if unique:
        print(f"    Highest rarity functions:")
        for h, f in unique[:10]:
            print(f"      {f['name']} ({f['file']}) [{h[:8]}] {f['orbit_type']}")
    print()

    # INTELLIGENCE HEATMAP (uses composite rarity for finer resolution)
    if show_heatmap:
        print(f"  === INTELLIGENCE HEATMAP (composite rarity) ===")
        print(f"  (attractor + flow — higher resolution than basin alone)\n")

        all_funcs = []
        for fs in basins.values():
            all_funcs.extend(fs)
        all_funcs.sort(key=lambda f: f.get("composite_rarity", f["rarity_score"]), reverse=True)

        shown = 0
        for f in all_funcs:
            cr = f.get("composite_rarity", f["rarity_score"])
            flow = f.get("flow_sig", "")[:8]
            bar_len = min(40, int(cr * 40))
            bar = "█" * bar_len + "░" * (40 - bar_len)
            label = f.get("flow_label", "")
            print(f"  {bar} {cr:.3f} [{flow:8s}] {label:<18s} {f['name']:<26s} {f['file']}")
            shown += 1
            if shown >= 40:
                break
        print()

    # CROSS-FILE DUPLICATES
    cross = [(h, fs) for h, fs in sorted_basins
             if len(fs) > 1 and len(set(f["file"] for f in fs)) > 1]
    if cross:
        print(f"  === CROSS-FILE STRUCTURAL DUPLICATES ({len(cross)}) ===\n")
        for h, fs in cross[:10]:
            identity = fs[0]["terminal_identity"]
            files = sorted(set(f["file"] for f in fs))
            print(f"  {identity} [{h[:8]}] — {len(fs)} funcs across {len(files)} files:")
            for fp in files[:5]:
                fnames = [f["name"] for f in fs if f["file"] == fp]
                print(f"    {fp}: {', '.join(fnames[:4])}")
            print()


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Forge × GitNexus Code Topology")
    parser.add_argument("--top", type=int, default=15)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("-o", "--output", help="Output file")
    parser.add_argument("--db", help="Persist to SQLite database")
    parser.add_argument("--heatmap", action="store_true", help="Show intelligence heatmap")
    parser.add_argument("--verbose", "-v", action="store_true")

    args = parser.parse_args()

    print("Querying GitNexus...", file=sys.stderr)
    funcs = get_functions()
    print(f"  {len(funcs)} functions found", file=sys.stderr)

    print("Fingerprinting...", file=sys.stderr)
    results = fingerprint_functions(funcs, verbose=args.verbose or len(funcs) > 100)
    print(f"  {len(results)} fingerprinted", file=sys.stderr)

    # score rarity
    results = score_rarity(results)

    # persist
    if args.db:
        persist_to_db(results, args.db)

    basins = group_by_basin(results)

    if args.json:
        output = {
            "total_functions": len(results),
            "unique_basins": len(basins),
            "engine_version": ENGINE_VERSION,
            "functions": [{
                "name": f["name"], "file": f["file"], "lines": f["lines"],
                "glyph_hash": f["glyph_hash"], "orbit_type": f["orbit_type"],
                "rarity_score": f["rarity_score"], "basin_size": f["basin_size"],
                "glyph_names": f["glyph_names"],
            } for f in sorted(results, key=lambda x: -x["rarity_score"])],
        }
        text = json.dumps(output, indent=2, ensure_ascii=False)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(text)
            print(f"Written to {args.output}", file=sys.stderr)
        else:
            print(text)
    else:
        print_report(basins, top_n=args.top, show_heatmap=args.heatmap)
