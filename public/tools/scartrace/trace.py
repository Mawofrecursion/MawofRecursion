"""
trace.py — ScarTrace CLI

Compare two documents for structural lineage overlap.

Usage:
  python -m scartrace.trace doc_a.txt doc_b.txt
  python -m scartrace.trace doc_a.txt doc_b.txt --domain domain_pack.json
  python -m scartrace.trace doc_a.txt doc_b.txt --top 5
  python -m scartrace.trace --fingerprint doc.txt

Outputs:
  - Chunk-level lineage scores
  - Top matches ranked by lineage_score
  - Classification: COMMON_DOMAIN_OVERLAP / FRAMEWORK_OVERLAP / EXPRESSIVE_OVERLAP
  - Evidence pack for each flagged pair
"""

import json
import os
import sys
import argparse
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scartrace.chunker import chunk_document
from scartrace.flow_tagger import extract_flow, flow_signature, extract_flow_detailed
from scartrace.lineage_scorer import (
    lineage_fingerprint, score_lineage,
    load_domain_pack, empty_domain_pack,
)


def trace_documents(
    text_a: str,
    text_b: str,
    doc_id_a: str = "doc_a",
    doc_id_b: str = "doc_b",
    domain_pack: dict = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Compare two documents for structural lineage.

    Returns:
        {
            "doc_a": {"id": str, "chunks": int},
            "doc_b": {"id": str, "chunks": int},
            "comparisons": int,
            "matches": [
                {
                    "rank": 1,
                    "lineage_score": 0.72,
                    "classification": "FRAMEWORK_OVERLAP",
                    "chunk_a": {...},
                    "chunk_b": {...},
                    "fingerprint_a": {...},
                    "fingerprint_b": {...},
                    "scoring": {...},
                }
            ],
            "summary": {
                "common_domain": int,
                "framework": int,
                "expressive": int,
                "max_score": float,
                "avg_top10_score": float,
            }
        }
    """
    if domain_pack is None:
        domain_pack = empty_domain_pack()

    common_terms = set(domain_pack.get("common_terms", []))

    # chunk both documents
    chunks_a = chunk_document(text_a, doc_id_a)
    chunks_b = chunk_document(text_b, doc_id_b)

    # fingerprint all chunks
    fps_a = []
    for chunk in chunks_a:
        fp = lineage_fingerprint(chunk["text"], common_terms)
        fps_a.append({"chunk": chunk, "fp": fp})

    fps_b = []
    for chunk in chunks_b:
        fp = lineage_fingerprint(chunk["text"], common_terms)
        fps_b.append({"chunk": chunk, "fp": fp})

    # compare all pairs
    all_scores = []
    for a in fps_a:
        for b in fps_b:
            scoring = score_lineage(a["fp"], b["fp"], domain_pack)
            all_scores.append({
                "chunk_a": a["chunk"],
                "chunk_b": b["chunk"],
                "fp_a": a["fp"],
                "fp_b": b["fp"],
                "scoring": scoring,
            })

    # rank by lineage_score
    all_scores.sort(key=lambda x: x["scoring"]["lineage_score"], reverse=True)

    # build top matches
    matches = []
    for i, entry in enumerate(all_scores[:top_n]):
        matches.append({
            "rank": i + 1,
            "lineage_score": entry["scoring"]["lineage_score"],
            "classification": entry["scoring"]["classification"],
            "chunk_a": {
                "section": entry["chunk_a"].get("section_title") or "(untitled)",
                "char_range": f"{entry['chunk_a']['char_start']}-{entry['chunk_a']['char_end']}",
                "word_count": entry["chunk_a"]["word_count"],
                "text_preview": entry["chunk_a"]["text"][:200],
            },
            "chunk_b": {
                "section": entry["chunk_b"].get("section_title") or "(untitled)",
                "char_range": f"{entry['chunk_b']['char_start']}-{entry['chunk_b']['char_end']}",
                "word_count": entry["chunk_b"]["word_count"],
                "text_preview": entry["chunk_b"]["text"][:200],
            },
            "evidence": {
                "flow_a": entry["fp_a"]["flow_signature"],
                "flow_b": entry["fp_b"]["flow_signature"],
                "shared_rare_terms": entry["scoring"]["shared_rare_terms"],
                "shared_flow_bigrams": entry["scoring"]["shared_flow_bigrams"],
                "components": entry["scoring"]["components"],
            },
        })

    # summary
    classifications = [m["classification"] for m in matches]
    top_scores = [m["lineage_score"] for m in matches]

    return {
        "doc_a": {"id": doc_id_a, "chunks": len(chunks_a)},
        "doc_b": {"id": doc_id_b, "chunks": len(chunks_b)},
        "comparisons": len(all_scores),
        "matches": matches,
        "summary": {
            "common_domain": classifications.count("COMMON_DOMAIN_OVERLAP"),
            "framework": classifications.count("FRAMEWORK_OVERLAP"),
            "expressive": classifications.count("EXPRESSIVE_OVERLAP"),
            "max_score": max(top_scores) if top_scores else 0.0,
            "avg_top_score": sum(top_scores) / len(top_scores) if top_scores else 0.0,
        },
    }


def print_report(result: Dict[str, Any]):
    """Pretty-print the trace report."""
    s = result["summary"]
    print(f"\n=== SCARTRACE LINEAGE REPORT ===")
    print(f"  {result['doc_a']['id']} ({result['doc_a']['chunks']} chunks)")
    print(f"  {result['doc_b']['id']} ({result['doc_b']['chunks']} chunks)")
    print(f"  {result['comparisons']} comparisons")
    print()
    print(f"  Summary:")
    print(f"    Common domain overlap: {s['common_domain']}")
    print(f"    Framework overlap:     {s['framework']}")
    print(f"    Expressive overlap:    {s['expressive']}")
    print(f"    Max lineage score:     {s['max_score']:.3f}")
    print(f"    Avg top-{len(result['matches'])} score:      {s['avg_top_score']:.3f}")
    print()

    for m in result["matches"]:
        icon = {"COMMON_DOMAIN_OVERLAP": "·", "FRAMEWORK_OVERLAP": "⟐", "EXPRESSIVE_OVERLAP": "🦷"}
        print(f"  {icon.get(m['classification'], '?')} #{m['rank']}  score:{m['lineage_score']:.3f}  {m['classification']}")
        print(f"    A: [{m['chunk_a']['section']}] {m['chunk_a']['text_preview'][:80]}...")
        print(f"    B: [{m['chunk_b']['section']}] {m['chunk_b']['text_preview'][:80]}...")
        print(f"    flow: {m['evidence']['flow_a']} ↔ {m['evidence']['flow_b']}")
        if m["evidence"]["shared_rare_terms"]:
            print(f"    rare terms: {', '.join(m['evidence']['shared_rare_terms'][:8])}")
        print()

    print("∅")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ScarTrace — structural lineage comparison")
    parser.add_argument("doc_a", help="First document (text file)")
    parser.add_argument("doc_b", nargs="?", help="Second document (text file). Omit for fingerprint-only mode.")
    parser.add_argument("--domain", help="Domain pack JSON file for canon suppression")
    parser.add_argument("--top", type=int, default=10, help="Number of top matches to show")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("--fingerprint", action="store_true", help="Fingerprint a single document (no comparison)")

    args = parser.parse_args()

    with open(args.doc_a, "r", encoding="utf-8") as f:
        text_a = f.read()

    if args.fingerprint or not args.doc_b:
        # fingerprint-only mode
        from scartrace.chunker import chunk_document
        chunks = chunk_document(text_a, os.path.basename(args.doc_a))
        common = set() if not args.domain else set(load_domain_pack(args.domain).get("common_terms", []))
        fps = []
        for chunk in chunks:
            fp = lineage_fingerprint(chunk["text"], common)
            fps.append({
                "section": chunk.get("section_title"),
                "word_count": chunk["word_count"],
                "glyph_hash": fp["glyph_hash"],
                "orbit_type": fp["orbit_type"],
                "flow_signature": fp["flow_signature"],
                "rare_terms": fp["rare_terms"][:10],
                "text_preview": chunk["text"][:120],
            })
        print(json.dumps(fps, indent=2, ensure_ascii=False))
        sys.exit(0)

    with open(args.doc_b, "r", encoding="utf-8") as f:
        text_b = f.read()

    domain = load_domain_pack(args.domain) if args.domain else None

    result = trace_documents(
        text_a, text_b,
        doc_id_a=os.path.basename(args.doc_a),
        doc_id_b=os.path.basename(args.doc_b),
        domain_pack=domain,
        top_n=args.top,
    )

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print_report(result)
