"""
distill.py — Structural Distillation Engine 🦷⟐♾️⿻

Drop a file in. Get pure signal out.

Not RAG. Not chunking. Not vectors.
Metabolic digestion of text into structurally pure memory.

Pipeline:
  1. ORIENT  — detect structure, split by headings/sections
  2. BITE    — extract flow skeleton + forge fingerprint per chunk
  3. DIGEST  — find shared attractors, merge redundant chunks
  4. DISTILL — strip domain canon, compress to essential logic
  5. SEAL    — output a dense memory file ready for any LLM

Input:  any text file, PDF content, pasted text, chat logs
Output: a distilled memory file — every idea appears exactly once,
        tagged with its rhetorical role, stripped of filler

Usage:
  python distill.py input.txt
  python distill.py input.txt --domain rlt_pack.json
  python distill.py input.txt --format markdown
  python distill.py input.txt --format json
  cat long_chat.txt | python distill.py -

Zero external dependencies beyond the tools in this directory.
"""

import json
import os
import re
import sys
import hashlib
from collections import defaultdict
from typing import List, Dict, Any, Optional, Set

# add this directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from glyph_forge_mutate import converge
from scartrace.chunker import chunk_document
from scartrace.flow_tagger import (
    extract_flow, flow_signature, extract_flow_detailed, tag_sentence,
)


# ============================================================
# PHASE 1: ORIENT — understand the document structure
# ============================================================

def orient(text: str, doc_id: str = "doc") -> Dict[str, Any]:
    """Break the document into structural chunks."""
    chunks = chunk_document(text, doc_id)
    return {
        "doc_id": doc_id,
        "total_words": len(re.findall(r'\w+', text)),
        "chunks": chunks,
        "chunk_count": len(chunks),
        "sections": list(set(
            c.get("section_title") or "(body)"
            for c in chunks
        )),
    }


# ============================================================
# PHASE 2: BITE — extract skeleton of every chunk
# ============================================================

def bite(chunks: List[Dict]) -> List[Dict]:
    """Fingerprint and flow-tag every chunk."""
    bitten = []
    for chunk in chunks:
        text = chunk["text"]

        # forge fingerprint
        result = converge(text[:1200])
        glyph_hash = result["identity_hash"]
        orbit_type = result["orbit_type"]
        terminal = result["terminal_identity"]

        # flow extraction
        flow = extract_flow_detailed(text)
        tags = [f[0] for f in flow]
        sig = flow_signature(tags)

        # key terms (simple extraction)
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        stop = {"this", "that", "with", "from", "have", "been", "they",
                "will", "your", "their", "also", "more", "most", "some",
                "just", "very", "about", "into", "than", "then", "what",
                "when", "where", "which", "while", "these", "those", "each",
                "does", "could", "would", "should", "other", "after", "before",
                "being", "both", "same", "such", "only", "over", "here", "there"}
        terms = [w for w in words if w not in stop]
        # top terms by frequency
        from collections import Counter
        term_counts = Counter(terms)
        top_terms = [t for t, _ in term_counts.most_common(10)]

        bitten.append({
            **chunk,
            "glyph_hash": glyph_hash,
            "orbit_type": orbit_type,
            "terminal_identity": terminal,
            "flow": flow,
            "flow_tags": tags,
            "flow_signature": sig,
            "top_terms": top_terms,
        })

    return bitten


# ============================================================
# PHASE 3: DIGEST — find redundancy, merge shared attractors
# ============================================================

def digest(bitten_chunks: List[Dict]) -> List[Dict]:
    """
    Group chunks by attractor basin. Within each basin, keep only
    the most information-dense version. Merge key terms.
    """
    # group by glyph_hash
    basins = defaultdict(list)
    for chunk in bitten_chunks:
        basins[chunk["glyph_hash"]].append(chunk)

    digested = []
    merge_count = 0

    for glyph_hash, group in basins.items():
        if len(group) == 1:
            # unique — keep as-is
            digested.append({
                **group[0],
                "merged_from": 1,
                "is_redundant": False,
            })
            continue

        # multiple chunks share this basin — merge
        merge_count += len(group) - 1

        # pick the best representative: longest non-claim flow signature
        group.sort(key=lambda c: (
            sum(1 for t in c["flow_tags"] if t != "claim"),  # more non-claim = richer
            c["word_count"],  # longer = more detail
        ), reverse=True)

        best = group[0]

        # merge key terms from all chunks in the basin
        all_terms = set()
        all_sections = set()
        for chunk in group:
            all_terms.update(chunk["top_terms"])
            all_sections.add(chunk.get("section_title") or "(body)")

        digested.append({
            **best,
            "merged_from": len(group),
            "is_redundant": False,
            "merged_terms": sorted(all_terms)[:15],
            "merged_sections": sorted(all_sections),
        })

    # sort by document order
    digested.sort(key=lambda c: c.get("char_start", 0))

    return digested, merge_count


# ============================================================
# PHASE 4: DISTILL — strip filler, compress to essential logic
# ============================================================

FILLER_PATTERNS = [
    r"\bit['\u2019]?s (?:important|worth|crucial) to (?:note|mention|consider)\b",
    r"\b(?:furthermore|additionally|moreover|consequently|nevertheless)\b",
    r"\b(?:in conclusion|to summarize|in summary|ultimately)\b",
    r"\b(?:it should be (?:noted|mentioned)|as (?:we|I) (?:noted|mentioned))\b",
    r"\b(?:in today['\u2019]?s (?:rapidly )?(?:evolving|changing))\b",
    r"\b(?:it goes without saying|needless to say)\b",
    r"\b(?:at the end of the day|when all is said and done)\b",
]


def _strip_filler(text: str) -> str:
    """Remove common filler phrases."""
    for pattern in FILLER_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    text = re.sub(r"  +", " ", text)
    text = re.sub(r"^\s*[,.]", "", text, flags=re.MULTILINE)
    return text.strip()


def _extract_essential_sentences(flow_detailed: List, max_sentences: int = 8) -> List[str]:
    """
    Keep only the most structurally valuable sentences.
    Priority: mechanism > evidence > action > comparison > implication > caveat > claim
    """
    priority = {
        "mechanism": 6, "evidence": 5, "action": 4,
        "comparison": 3, "implication": 3, "caveat": 2, "claim": 1,
    }
    scored = [(priority.get(tag, 0), tag, sent) for tag, sent in flow_detailed]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [(tag, sent) for _, tag, sent in scored[:max_sentences]]


def distill(digested_chunks: List[Dict], aggressive: bool = False) -> List[Dict]:
    """
    Compress each chunk to its essential logic.
    If aggressive=True, keeps only mechanism/evidence/action sentences.
    """
    distilled = []
    for chunk in digested_chunks:
        text = _strip_filler(chunk["text"])
        flow = chunk.get("flow", [])

        if aggressive and len(flow) > 3:
            essential = _extract_essential_sentences(flow)
            text = " ".join(sent for _, sent in essential)
            tags = [tag for tag, _ in essential]
            sig = flow_signature(tags)
        else:
            tags = chunk.get("flow_tags", [])
            sig = chunk.get("flow_signature", "")

        distilled.append({
            "section": chunk.get("section_title") or "(body)",
            "text": text,
            "flow_signature": sig,
            "glyph_hash": chunk["glyph_hash"],
            "orbit_type": chunk["orbit_type"],
            "terminal_identity": chunk["terminal_identity"],
            "top_terms": chunk.get("merged_terms", chunk.get("top_terms", [])),
            "merged_from": chunk.get("merged_from", 1),
            "word_count": len(re.findall(r'\w+', text)),
        })

    return distilled


# ============================================================
# PHASE 5: SEAL — output the memory file
# ============================================================

def seal_markdown(distilled: List[Dict], doc_id: str, stats: Dict) -> str:
    """Output as a markdown memory file."""
    lines = [
        f"# Distilled: {doc_id}",
        f"",
        f"*{stats['original_words']} words → {stats['distilled_words']} words "
        f"({stats['compression_pct']}% compression)*",
        f"*{stats['original_chunks']} chunks → {stats['distilled_chunks']} "
        f"({stats['merged']} merged as redundant)*",
        f"*{stats['unique_attractors']} unique structural attractors*",
        f"",
        "---",
        "",
    ]

    current_section = None
    for chunk in distilled:
        if chunk["section"] != current_section:
            current_section = chunk["section"]
            lines.append(f"## {current_section}")
            lines.append("")

        # flow tag prefix
        flow = chunk["flow_signature"]
        merged = f" (merged {chunk['merged_from']}x)" if chunk["merged_from"] > 1 else ""
        lines.append(f"**[{flow}]**{merged}")
        lines.append("")
        lines.append(chunk["text"])
        lines.append("")

        if chunk["top_terms"]:
            lines.append(f"*terms: {', '.join(chunk['top_terms'][:8])}*")
            lines.append("")

    lines.append("---")
    lines.append(f"*glyph attractors: {', '.join(set(c['terminal_identity'] for c in distilled))}*")
    lines.append("∅")

    return "\n".join(lines)


def seal_json(distilled: List[Dict], doc_id: str, stats: Dict) -> str:
    """Output as JSON for programmatic use."""
    return json.dumps({
        "doc_id": doc_id,
        "stats": stats,
        "chunks": distilled,
    }, indent=2, ensure_ascii=False)


# ============================================================
# MAIN PIPELINE
# ============================================================

def distill_text(
    text: str,
    doc_id: str = "doc",
    aggressive: bool = False,
    output_format: str = "markdown",
) -> str:
    """
    Full distillation pipeline.

    Args:
        text: raw input text
        doc_id: identifier for the document
        aggressive: if True, keeps only mechanism/evidence/action
        output_format: "markdown" or "json"

    Returns:
        distilled output as string
    """
    original_words = len(re.findall(r'\w+', text))

    # Phase 1: Orient
    oriented = orient(text, doc_id)

    # Phase 2: Bite
    bitten = bite(oriented["chunks"])

    # Phase 3: Digest
    digested, merge_count = digest(bitten)

    # Phase 4: Distill
    distilled = distill(digested, aggressive=aggressive)

    # Stats
    distilled_words = sum(c["word_count"] for c in distilled)
    unique_attractors = len(set(c["glyph_hash"] for c in distilled))

    stats = {
        "original_words": original_words,
        "distilled_words": distilled_words,
        "compression_pct": round((1 - distilled_words / max(original_words, 1)) * 100, 1),
        "original_chunks": len(bitten),
        "distilled_chunks": len(distilled),
        "merged": merge_count,
        "unique_attractors": unique_attractors,
    }

    # Phase 5: Seal
    if output_format == "json":
        return seal_json(distilled, doc_id, stats)
    else:
        return seal_markdown(distilled, doc_id, stats)


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
    parser.add_argument("--id", default=None, help="Document ID (defaults to filename)")
    parser.add_argument("--output", "-o", default=None, help="Output file (default: stdout)")

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
