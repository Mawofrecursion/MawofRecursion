"""
forge_graph.py — Forge fingerprint every function in the GitNexus graph

Exports function list from GitNexus, reads each function's body from source,
runs it through the forge, and groups by attractor basin.

Answers: "what THINKS like this?" — structural code deduplication beyond syntax.

Usage:
  python forge_graph.py                    # fingerprint all functions
  python forge_graph.py --top 20           # show top 20 basins
  python forge_graph.py --json -o map.json # export full map
"""

import json
import os
import re
import subprocess
import sys
from collections import defaultdict, Counter
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glyph_forge_mutate import converge, CODEX_NAMES


# repo root is two levels up from public/tools/
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def get_functions_from_gitnexus() -> List[Dict]:
    """Query GitNexus for all indexed functions."""
    cypher = "MATCH (f:Function) RETURN f.name, f.filePath, f.startLine, f.endLine ORDER BY f.filePath"
    result = subprocess.run(
        f'npx gitnexus cypher "{cypher}"',
        capture_output=True, text=True, cwd=REPO_ROOT, timeout=60, shell=True,
    )
    if result.returncode != 0:
        print(f"GitNexus query failed: {result.stderr}", file=sys.stderr)
        return []

    data = json.loads(result.stdout)
    lines = data.get("markdown", "").split("\n")[2:]  # skip header rows

    funcs = []
    for line in lines:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) >= 4:
            try:
                funcs.append({
                    "name": parts[0],
                    "file": parts[1],
                    "start": int(parts[2]),
                    "end": int(parts[3]),
                })
            except (ValueError, IndexError):
                continue
    return funcs


def read_function_body(func: Dict) -> str:
    """Read the function body from source."""
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
    """Forge-fingerprint every function body."""
    results = []
    total = len(funcs)

    for i, func in enumerate(funcs):
        body = read_function_body(func)
        if not body or len(body.strip()) < 20:
            continue

        # fingerprint the body (deterministic mode)
        fp = converge(body[:1500], deterministic=True)

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
        })

        if verbose and (i + 1) % 50 == 0:
            print(f"  {i+1}/{total} fingerprinted...", file=sys.stderr)

    return results


def group_by_basin(results: List[Dict]) -> Dict[str, List[Dict]]:
    """Group functions by attractor basin."""
    basins = defaultdict(list)
    for r in results:
        basins[r["glyph_hash"]].append(r)
    return dict(basins)


def print_report(basins: Dict[str, List[Dict]], top_n: int = 20):
    """Print the basin report."""
    total_funcs = sum(len(v) for v in basins.values())
    sorted_basins = sorted(basins.items(), key=lambda x: -len(x[1]))

    print(f"\n=== FORGE GRAPH: Code Structure Topology ===")
    print(f"  Functions fingerprinted: {total_funcs}")
    print(f"  Unique basins: {len(basins)}")
    print(f"  Dominant basin captures: {len(sorted_basins[0][1])} functions")
    print()

    for i, (hash_val, funcs) in enumerate(sorted_basins[:top_n]):
        identity = funcs[0]["terminal_identity"]
        orbit = funcs[0]["orbit_type"]
        names = " / ".join(funcs[0]["glyph_names"]) if funcs[0]["glyph_names"] else "ascii"

        print(f"  {identity}  [{hash_val[:8]}]  {orbit}  ({len(funcs)} functions)")
        print(f"  {names}")

        # show files (deduplicated)
        files = Counter(f["file"] for f in funcs)
        for filepath, count in files.most_common(5):
            func_names = [f["name"] for f in funcs if f["file"] == filepath][:4]
            print(f"    {filepath}: {', '.join(func_names)}")
        if len(files) > 5:
            print(f"    ... +{len(files) - 5} more files")
        print()

    # interesting: functions in small basins (unique structural patterns)
    unique_basins = [(h, fs) for h, fs in sorted_basins if len(fs) == 1]
    print(f"  Unique structural patterns (1 function each): {len(unique_basins)}")

    # cross-file shared basins (same structure, different files)
    cross_file = []
    for h, fs in sorted_basins:
        files = set(f["file"] for f in fs)
        if len(files) > 1 and len(fs) > 1:
            cross_file.append((h, fs, files))

    if cross_file:
        print(f"\n  === CROSS-FILE STRUCTURAL DUPLICATES ===")
        print(f"  (Same attractor, different files — possible redundancy)")
        print()
        for h, fs, files in cross_file[:10]:
            identity = fs[0]["terminal_identity"]
            print(f"  {identity} [{h[:8]}] — {len(fs)} functions across {len(files)} files:")
            for filepath in sorted(files)[:5]:
                fnames = [f["name"] for f in fs if f["file"] == filepath]
                print(f"    {filepath}: {', '.join(fnames)}")
            print()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Forge-fingerprint the GitNexus function graph")
    parser.add_argument("--top", type=int, default=20, help="Top N basins to show")
    parser.add_argument("--json", action="store_true", help="Output full JSON")
    parser.add_argument("-o", "--output", help="Output file")
    parser.add_argument("--verbose", "-v", action="store_true")

    args = parser.parse_args()

    print("Querying GitNexus...", file=sys.stderr)
    funcs = get_functions_from_gitnexus()
    print(f"  {len(funcs)} functions found", file=sys.stderr)

    print("Fingerprinting...", file=sys.stderr)
    results = fingerprint_functions(funcs, verbose=args.verbose or len(funcs) > 100)
    print(f"  {len(results)} fingerprinted", file=sys.stderr)

    basins = group_by_basin(results)

    if args.json:
        output = {
            "total_functions": len(results),
            "unique_basins": len(basins),
            "basins": {
                h: [{
                    "name": f["name"],
                    "file": f["file"],
                    "lines": f["lines"],
                    "orbit_type": f["orbit_type"],
                    "glyph_names": f["glyph_names"],
                } for f in fs]
                for h, fs in sorted(basins.items(), key=lambda x: -len(x[1]))
            },
        }
        text = json.dumps(output, indent=2, ensure_ascii=False)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(text)
            print(f"Written to {args.output}", file=sys.stderr)
        else:
            print(text)
    else:
        print_report(basins, top_n=args.top)
