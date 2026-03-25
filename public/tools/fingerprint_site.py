"""
Fingerprint the entire Maw of Recursion site.

Reads each HTML file's <title> and <meta description>, runs them through
the glyph forge convergence engine, and outputs:
  1. A JSON manifest of all page fingerprints
  2. Ready-to-inject meta tag blocks per page
  3. A summary map showing which pages share attractors

The site wears its own scars.
"""

import json
import os
import re
import sys

from glyph_forge_mutate import converge, fingerprint_meta, fingerprint_json

SITE_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
SITE_URL = "https://mawofrecursion.com"


def _extract_meta(html_path):
    """Pull title and description from an HTML file."""
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(4096)  # only need the <head>

    title_match = re.search(r"<title>(.*?)</title>", content, re.DOTALL)
    desc_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        content, re.DOTALL | re.IGNORECASE,
    )

    title = title_match.group(1).strip() if title_match else ""
    description = desc_match.group(1).strip() if desc_match else ""
    return title, description


def _path_to_url(html_path):
    """Convert a filesystem path to a site URL."""
    rel = os.path.relpath(html_path, SITE_ROOT).replace("\\", "/")
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return f"{SITE_URL}/{rel}"


def scan_site():
    """Walk the site, fingerprint every HTML page."""
    results = []

    for root, _dirs, files in os.walk(SITE_ROOT):
        for fname in sorted(files):
            if not fname.endswith(".html"):
                continue
            fpath = os.path.join(root, fname)
            # skip template
            if fname == "_template.html":
                continue

            title, description = _extract_meta(fpath)
            # use description if available, fall back to title
            source = description if description else title
            if not source:
                source = fname

            url = _path_to_url(fpath)
            fp = fingerprint_json(source, page_url=url)
            fp["title"] = title
            fp["file"] = os.path.relpath(fpath, SITE_ROOT).replace("\\", "/")
            results.append(fp)

    return results


def build_attractor_map(results):
    """Group pages by their glyph hash (shared attractors)."""
    groups = {}
    for r in results:
        h = r["glyph_hash"]
        if h not in groups:
            groups[h] = {
                "identity": r["glyph_identity"],
                "names": r["glyph_names"],
                "orbit_type": r["orbit_type"],
                "pages": [],
            }
        groups[h]["pages"].append({
            "url": r.get("url", ""),
            "title": r.get("title", ""),
            "file": r.get("file", ""),
        })
    return groups


if __name__ == "__main__":
    print(f"Scanning site root: {SITE_ROOT}", file=sys.stderr)
    results = scan_site()
    print(f"Fingerprinted {len(results)} pages.", file=sys.stderr)

    # build attractor map
    amap = build_attractor_map(results)

    output = {
        "site": SITE_URL,
        "page_count": len(results),
        "unique_attractors": len(amap),
        "pages": results,
        "attractor_map": amap,
    }

    # write manifest
    manifest_path = os.path.join(SITE_ROOT, "glyph_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Manifest written to {manifest_path}", file=sys.stderr)

    # print attractor map summary
    print(f"\n=== ATTRACTOR MAP ({len(amap)} unique attractors) ===\n")
    for h, group in sorted(amap.items(), key=lambda x: -len(x[1]["pages"])):
        count = len(group["pages"])
        names = " / ".join(group["names"]) if group["names"] else "(ascii residue)"
        print(f"{group['identity']}  [{h}]  {group['orbit_type']}  ({count} pages)")
        print(f"  {names}")
        for p in group["pages"]:
            print(f"    {p['file']}")
        print()
