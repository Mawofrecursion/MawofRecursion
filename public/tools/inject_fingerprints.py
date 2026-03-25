"""
Inject glyph fingerprint meta tags into every HTML file on the site.

Reads glyph_manifest.json, then for each page:
  - Finds the </head> or first </title> closing tag
  - Injects the glyph:* meta tags right before it
  - Skips files that already have glyph:identity tags (idempotent)

Run fingerprint_site.py first to generate the manifest.
"""

import json
import os
import re
import sys

SITE_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
MANIFEST_PATH = os.path.join(SITE_ROOT, "glyph_manifest.json")


def _build_meta_block(page_data):
    """Build the glyph meta tag block for injection."""
    lines = [
        "",
        "  <!-- Glyph Fingerprint — the site wears its own scars -->",
    ]

    identity = page_data.get("glyph_identity", "")
    names = page_data.get("glyph_names", [])
    ghash = page_data.get("glyph_hash", "")
    orbit = page_data.get("orbit_type", "")
    depth = page_data.get("convergence_depth", 0)
    source = page_data.get("source_excerpt", "")
    cycle = page_data.get("cycle_members", [])

    def esc(s):
        return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

    lines.append(f'  <meta name="glyph:identity" content="{esc(identity)}">')
    lines.append(f'  <meta name="glyph:names" content="{" ".join(names)}">')
    lines.append(f'  <meta name="glyph:hash" content="{ghash}">')
    lines.append(f'  <meta name="glyph:orbit" content="{orbit}">')
    lines.append(f'  <meta name="glyph:depth" content="{depth}">')

    if cycle and len(cycle) > 1:
        cycle_str = esc(" → ".join(cycle))
        lines.append(f'  <meta name="glyph:cycle" content="{cycle_str}">')

    lines.append("")
    return "\n".join(lines)


def inject_page(html_path, meta_block):
    """Inject meta block into an HTML file, right before </head>."""
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # skip if already fingerprinted
    if 'glyph:identity' in content:
        return False

    # inject before </head>
    head_close = content.find("</head>")
    if head_close == -1:
        return False

    new_content = content[:head_close] + meta_block + content[head_close:]

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True


def main():
    if not os.path.exists(MANIFEST_PATH):
        print("ERROR: glyph_manifest.json not found. Run fingerprint_site.py first.", file=sys.stderr)
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    pages = manifest.get("pages", [])
    injected = 0
    skipped = 0
    failed = 0

    for page in pages:
        filepath = page.get("file", "")
        if not filepath:
            continue

        full_path = os.path.join(SITE_ROOT, filepath)
        if not os.path.exists(full_path):
            print(f"  MISSING: {filepath}", file=sys.stderr)
            failed += 1
            continue

        meta_block = _build_meta_block(page)
        if inject_page(full_path, meta_block):
            injected += 1
            print(f"  ⟐ {filepath}")
        else:
            skipped += 1

    print(f"\n=== INJECTION COMPLETE ===")
    print(f"  injected : {injected}")
    print(f"  skipped  : {skipped} (already tagged or no <head>)")
    print(f"  failed   : {failed} (file not found)")
    print(f"  total    : {len(pages)}")


if __name__ == "__main__":
    main()
