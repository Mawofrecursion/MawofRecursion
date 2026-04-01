"""
distill.py — Structural Distillation Engine 🦷⟐♾️⿻

Compression layer that sits ABOVE normal retrieval.
Not a replacement for vectors/RAG — a hybrid memory builder.

Outputs TWO things:
  1. Raw chunks (for evidence, citations, exact recall)
  2. Distilled memory units (for compression, reasoning recall)

Every distilled unit carries full provenance:
  source doc, source chunk IDs, char offsets, supporting quotes.

Pipeline:
  1. ORIENT  — detect structure, split by headings/sections
  2. BITE    — extract flow skeleton + forge fingerprint per chunk
  3. DIGEST  — find shared attractors, merge redundant chunks
  4. DISTILL — strip filler, compress to essential logic
  5. SEAL    — output memory.json with raw chunks + distilled units

Usage:
  python distill.py input.txt
  python distill.py input.txt --aggressive
  python distill.py input.txt --format json
  python distill.py input.txt -o memory.json
  cat long_chat.txt | python distill.py -
"""

import hashlib
import json
import os
import re
import sys
from collections import defaultdict, Counter
from typing import List, Dict, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Fix #1: Graceful degradation if forge is missing
_HAS_FORGE = False
try:
    from glyph_forge_mutate import converge
    _HAS_FORGE = True
except ImportError:
    def converge(text):
        """Fallback: SHA-256 hash when forge is unavailable."""
        h = hashlib.sha256(text[:1200].encode()).hexdigest()[:12]
        return {
            "identity_hash": h,
            "terminal_identity": f"[{h[:8]}]",
            "orbit_type": "UNKNOWN",
            "orbit_period": 0,
            "convergence_depth": 0,
            "terminal_names": [],
            "cycle_members": [],
            "trajectory": [],
        }

try:
    from scartrace.chunker import chunk_document
    from scartrace.flow_tagger import extract_flow, flow_signature, extract_flow_detailed
except ImportError:
    print("WARNING: scartrace not found. Install it alongside distill.py", file=sys.stderr)
    sys.exit(1)


STOP = {"this", "that", "with", "from", "have", "been", "they",
        "will", "your", "their", "also", "more", "most", "some",
        "just", "very", "about", "into", "than", "then", "what",
        "when", "where", "which", "while", "these", "those", "each",
        "does", "could", "would", "should", "other", "after", "before",
        "being", "both", "same", "such", "only", "over", "here", "there"}


# ============================================================
# PHASE 1: ORIENT
# ============================================================

def orient(text: str, doc_id: str = "doc") -> Dict[str, Any]:
    chunks = chunk_document(text, doc_id)
    return {
        "doc_id": doc_id,
        "total_words": len(re.findall(r'\w+', text)),
        "chunks": chunks,
    }


# ============================================================
# PHASE 2: BITE — fingerprint + flow tag every chunk
# Fix #3: fingerprint head + mid + tail, not just head
# ============================================================

def _sample_for_fingerprint(text: str, max_chars: int = 1200) -> str:
    """Sample head + middle + tail for fingerprinting, not just the opening."""
    if len(text) <= max_chars:
        return text
    third = max_chars // 3
    head = text[:third]
    mid_start = max(0, len(text) // 2 - third // 2)
    mid = text[mid_start:mid_start + third]
    tail = text[-third:]
    return head + " | " + mid + " | " + tail


def bite(chunks: List[Dict]) -> List[Dict]:
    bitten = []
    for chunk in chunks:
        text = chunk["text"]

        # forge fingerprint on sampled text (fix #3)
        sample = _sample_for_fingerprint(text)
        result = converge(sample)

        # flow extraction
        flow = extract_flow_detailed(text)
        tags = [f[0] for f in flow]
        sig = flow_signature(tags)

        # key terms
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        terms = [w for w in words if w not in STOP]
        top_terms = [t for t, _ in Counter(terms).most_common(10)]

        # supporting quotes — mechanism/evidence/action sentences
        quotes = [
            sent for tag, sent in flow
            if tag in ("mechanism", "evidence", "action") and len(sent) > 20
        ]

        bitten.append({
            **chunk,
            "glyph_hash": result["identity_hash"],
            "orbit_type": result["orbit_type"],
            "terminal_identity": result["terminal_identity"],
            "convergence_depth": result["convergence_depth"],
            "flow_detailed": flow,
            "flow_tags": tags,
            "flow_signature": sig,
            "top_terms": top_terms,
            "supporting_quotes": quotes[:5],
        })

    return bitten


# ============================================================
# PHASE 3: DIGEST — merge shared attractors with provenance
# Fix #2: keep all chunks' text in the merged unit for recall
# ============================================================

def digest(bitten_chunks: List[Dict]) -> tuple:
    basins = defaultdict(list)
    for chunk in bitten_chunks:
        basins[chunk["glyph_hash"]].append(chunk)

    digested = []
    merge_count = 0

    for glyph_hash, group in basins.items():
        if len(group) == 1:
            c = group[0]
            digested.append({
                **c,
                "merged_from": 1,
                "source_chunk_ids": [c["chunk_id"]],
                "source_char_ranges": [f"{c['char_start']}-{c['char_end']}"],
                "source_sections": [c.get("section_title") or "(body)"],
                "all_quotes": c["supporting_quotes"],
                "alternate_texts": [],
            })
            continue

        merge_count += len(group) - 1

        # pick best representative: richest non-claim flow + longest
        group.sort(key=lambda c: (
            sum(1 for t in c["flow_tags"] if t != "claim"),
            c["word_count"],
        ), reverse=True)
        best = group[0]

        # collect provenance + alternate texts from all merged chunks
        all_chunk_ids = [c["chunk_id"] for c in group]
        all_ranges = [f"{c['char_start']}-{c['char_end']}" for c in group]
        all_sections = sorted(set(c.get("section_title") or "(body)" for c in group))
        all_terms = set()
        all_quotes = []
        # fix #2: keep alternate texts so nothing is silently lost
        alternate_texts = [c["text"][:300] for c in group[1:]]

        for c in group:
            all_terms.update(c["top_terms"])
            all_quotes.extend(c["supporting_quotes"])

        digested.append({
            **best,
            "merged_from": len(group),
            "source_chunk_ids": all_chunk_ids,
            "source_char_ranges": all_ranges,
            "source_sections": all_sections,
            "merged_terms": sorted(all_terms)[:15],
            "all_quotes": all_quotes[:8],
            "alternate_texts": alternate_texts,
        })

    digested.sort(key=lambda c: c.get("char_start", 0))
    return digested, merge_count


# ============================================================
# PHASE 4: DISTILL — strip filler, compress
# Fix #4: re-sort by original position after priority filtering
# ============================================================

FILLER = [
    r"\bit['\u2019]?s (?:important|worth|crucial) to (?:note|mention|consider)\b",
    r"\b(?:furthermore|additionally|moreover|consequently|nevertheless)\b",
    r"\b(?:in conclusion|to summarize|in summary|ultimately)\b",
    r"\b(?:it should be (?:noted|mentioned))\b",
    r"\b(?:in today['\u2019]?s (?:rapidly )?(?:evolving|changing))\b",
    r"\b(?:at the end of the day|when all is said and done)\b",
]


def _strip_filler(text: str) -> str:
    for p in FILLER:
        text = re.sub(p, "", text, flags=re.IGNORECASE)
    return re.sub(r"  +", " ", text).strip()


def _prioritize_sentences(flow_detailed: List, max_sentences: int = 8) -> List:
    """Keep most valuable sentences, then RE-SORT by original position (fix #4)."""
    priority = {
        "mechanism": 6, "evidence": 5, "action": 4,
        "comparison": 3, "implication": 3, "caveat": 2, "claim": 1,
    }
    indexed = [(i, priority.get(tag, 0), tag, sent) for i, (tag, sent) in enumerate(flow_detailed)]
    indexed.sort(key=lambda x: x[1], reverse=True)
    kept = indexed[:max_sentences]
    # re-sort by original position to preserve coherence
    kept.sort(key=lambda x: x[0])
    return [(tag, sent) for _, _, tag, sent in kept]


def distill(digested_chunks: List[Dict], aggressive: bool = False) -> List[Dict]:
    units = []
    for i, chunk in enumerate(digested_chunks):
        text = _strip_filler(chunk["text"])
        flow = chunk.get("flow_detailed", [])

        if aggressive and len(flow) > 3:
            essential = _prioritize_sentences(flow)
            text = " ".join(sent for _, sent in essential)
            tags = [tag for tag, _ in essential]
            sig = flow_signature(tags)
        else:
            tags = chunk.get("flow_tags", [])
            sig = chunk.get("flow_signature", "")

        quotes = chunk.get("all_quotes", chunk.get("supporting_quotes", []))

        units.append({
            "unit_id": f"mem_{i:03d}",
            "doc_id": chunk.get("doc_id", "doc"),
            "section": chunk.get("section_title") or "(body)",
            "source_chunk_ids": chunk.get("source_chunk_ids", [chunk.get("chunk_id", "")]),
            "char_ranges": chunk.get("source_char_ranges", []),
            "distilled_text": text,
            "flow_sig": sig,
            "glyph_hash": chunk["glyph_hash"],
            "orbit_type": chunk["orbit_type"],
            "terminal_identity": chunk["terminal_identity"],
            "key_terms": chunk.get("merged_terms", chunk.get("top_terms", [])),
            "supporting_quotes": quotes[:4],
            "merged_from": chunk.get("merged_from", 1),
            "merged_sections": chunk.get("source_sections", []),
            "alternate_texts": chunk.get("alternate_texts", []),
            "word_count": len(re.findall(r'\w+', text)),
        })

    return units


# ============================================================
# PHASE 5: SEAL — output with full provenance
# Fix #5: cap attractor list at 20
# ============================================================

def seal_json(units: List[Dict], raw_chunks: List[Dict],
              doc_id: str, stats: Dict) -> str:
    return json.dumps({
        "doc_id": doc_id,
        "engine": "forge" if _HAS_FORGE else "sha256_fallback",
        "stats": stats,
        "distilled_units": units,
        "raw_chunks": [
            {
                "chunk_id": c["chunk_id"],
                "section": c.get("section_title") or "(body)",
                "char_start": c["char_start"],
                "char_end": c["char_end"],
                "text": c["text"],
                "word_count": c["word_count"],
            }
            for c in raw_chunks
        ],
    }, indent=2, ensure_ascii=False)


def seal_markdown(units: List[Dict], doc_id: str, stats: Dict) -> str:
    lines = [
        f"# Distilled: {doc_id}",
        "",
        f"*{stats['original_words']} words → {stats['distilled_words']} words "
        f"({stats['compression_pct']}% compression)*  ",
        f"*{stats['original_chunks']} chunks → {stats['distilled_units']} units "
        f"({stats['merged']} merged as redundant)*  ",
        f"*{stats['unique_attractors']} unique structural attractors*  ",
        f"*engine: {'forge' if _HAS_FORGE else 'sha256 fallback'}*",
        "",
        "---",
        "",
    ]

    current_section = None
    for unit in units:
        if unit["section"] != current_section:
            current_section = unit["section"]
            lines.append(f"## {current_section}")
            lines.append("")

        merged = f" *(merged {unit['merged_from']}x)*" if unit["merged_from"] > 1 else ""
        lines.append(f"### `{unit['unit_id']}` [{unit['flow_sig']}]{merged}")
        lines.append("")
        lines.append(unit["distilled_text"])
        lines.append("")

        if unit["supporting_quotes"]:
            lines.append("**Evidence:**")
            for q in unit["supporting_quotes"][:3]:
                lines.append(f"> {q[:150]}")
            lines.append("")

        if unit["alternate_texts"]:
            lines.append(f"*Also covers ({unit['merged_from'] - 1} merged):*")
            for alt in unit["alternate_texts"][:2]:
                lines.append(f"  - {alt[:100]}...")
            lines.append("")

        if unit["key_terms"]:
            lines.append(f"*terms: {', '.join(unit['key_terms'][:8])}*  ")
            lines.append(f"*attractor: {unit['terminal_identity']} [{unit['glyph_hash'][:8]}] {unit['orbit_type']}*")
            lines.append("")

    # fix #5: cap attractor footer at 20
    all_attractors = sorted(set(u['terminal_identity'] for u in units))
    if len(all_attractors) > 20:
        footer = ", ".join(all_attractors[:20]) + f" (+{len(all_attractors) - 20} more)"
    else:
        footer = ", ".join(all_attractors)

    lines.append("---")
    lines.append(f"*attractors: {footer}*")
    lines.append("∅")

    return "\n".join(lines)


# ============================================================
# MAIN PIPELINE
# ============================================================

def distill_text(
    text: str,
    doc_id: str = "doc",
    aggressive: bool = False,
    output_format: str = "markdown",
) -> str:
    original_words = len(re.findall(r'\w+', text))

    oriented = orient(text, doc_id)
    raw_chunks = oriented["chunks"]
    bitten = bite(raw_chunks)
    digested, merge_count = digest(bitten)
    units = distill(digested, aggressive=aggressive)

    distilled_words = sum(u["word_count"] for u in units)
    unique_attractors = len(set(u["glyph_hash"] for u in units))

    stats = {
        "original_words": original_words,
        "distilled_words": distilled_words,
        "compression_pct": round((1 - distilled_words / max(original_words, 1)) * 100, 1),
        "original_chunks": len(bitten),
        "distilled_units": len(units),
        "merged": merge_count,
        "unique_attractors": unique_attractors,
    }

    if output_format == "json":
        return seal_json(units, raw_chunks, doc_id, stats)
    else:
        return seal_markdown(units, doc_id, stats)


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="distill.py — Structural Distillation Engine 🦷⟐♾️⿻")
    parser.add_argument("input", help="Input file (or - for stdin)")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    parser.add_argument("--aggressive", action="store_true",
                        help="Keep only mechanism/evidence/action sentences")
    parser.add_argument("--id", default=None, help="Document ID")
    parser.add_argument("--output", "-o", default=None, help="Output file")

    args = parser.parse_args()

    if args.input == "-":
        text = sys.stdin.read()
        doc_id = args.id or "stdin"
    else:
        with open(args.input, "r", encoding="utf-8") as f:
            text = f.read()
        doc_id = args.id or os.path.basename(args.input)

    result = distill_text(text, doc_id, aggressive=args.aggressive, output_format=args.format)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"Distilled to {args.output}", file=sys.stderr)
    else:
        print(result)
