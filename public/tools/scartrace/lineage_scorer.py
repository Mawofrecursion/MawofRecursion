"""
lineage_scorer.py — Structural lineage comparison for ScarTrace

Compares two document chunks and scores their structural similarity
across five axes: attractor, structure, flow, term chains, rarity.

Subtracts a canon penalty for common domain patterns.

Output classifications:
  COMMON_DOMAIN_OVERLAP  — shared field knowledge, not copying
  FRAMEWORK_OVERLAP      — shared reasoning skeleton beyond canon
  EXPRESSIVE_OVERLAP     — rare structural alignment worth review

Never outputs PLAGIARISM. That is a human judgment, not a measurement.

Zero dependencies beyond glyph_engine.py and flow_tagger.py.
"""

import re
import sys
import os
from typing import List, Dict, Any, Optional, Set

# add parent dir to path for glyph_engine import
_parent = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _parent not in sys.path:
    sys.path.insert(0, _parent)

from glyph_forge_mutate import converge
from scartrace.flow_tagger import extract_flow, flow_bigrams, flow_signature


# ============================================================
# TERM EXTRACTION
# ============================================================

STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "it", "its", "they", "them", "their", "we", "our", "you",
    "your", "he", "she", "him", "her", "and", "or", "but", "not", "no",
    "if", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "as", "up", "out", "so", "than", "then", "also", "very", "just",
    "more", "most", "some", "any", "all", "each", "every", "both",
    "such", "like", "about", "into", "over", "after", "before",
}


def extract_key_terms(text: str, min_length: int = 4) -> List[str]:
    """Extract key content terms, preserving order."""
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) >= min_length]


def extract_term_chains(text: str, window: int = 5) -> List[str]:
    """Extract ordered term chains (n-gram-like but by key terms, not all words)."""
    terms = extract_key_terms(text)
    chains = []
    for i in range(len(terms) - window + 1):
        chains.append(" ".join(terms[i:i + window]))
    return chains


def find_rare_terms(terms: List[str], common_terms: Optional[Set[str]] = None) -> List[str]:
    """Identify terms that are NOT in the common domain vocabulary."""
    if common_terms is None:
        return terms  # no domain pack → all terms are "rare"
    return [t for t in terms if t not in common_terms]


# ============================================================
# FLOW ALIGNMENT — local sequence alignment on flow tags
# ============================================================

def flow_alignment_score(flow_a: List[str], flow_b: List[str]) -> float:
    """
    Score alignment between two flow sequences.
    Uses longest common subsequence ratio.
    """
    if not flow_a or not flow_b:
        return 0.0

    m, n = len(flow_a), len(flow_b)
    # LCS dynamic programming
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if flow_a[i-1] == flow_b[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    lcs_len = dp[m][n]
    return (2 * lcs_len) / (m + n)  # Dice coefficient on LCS


def flow_bigram_overlap(flow_a: List[str], flow_b: List[str]) -> float:
    """Jaccard similarity on flow bigrams."""
    bg_a = set(flow_bigrams(flow_a))
    bg_b = set(flow_bigrams(flow_b))
    if not bg_a or not bg_b:
        return 0.0
    intersection = bg_a & bg_b
    union = bg_a | bg_b
    return len(intersection) / len(union)


# ============================================================
# LINEAGE FINGERPRINT — enriched chunk fingerprint
# ============================================================

def lineage_fingerprint(text: str, common_terms: Optional[Set[str]] = None) -> Dict[str, Any]:
    """
    Compute a full lineage fingerprint for a chunk.
    This is the enriched version of forge_fingerprint for document comparison.
    """
    # attractor
    result = converge(text[:1200])

    # flow
    flow = extract_flow(text)
    sig = flow_signature(flow)
    bigrams = flow_bigrams(flow)

    # terms
    key_terms = extract_key_terms(text)
    rare = find_rare_terms(key_terms, common_terms)
    chains = extract_term_chains(text)

    return {
        "glyph_hash": result["identity_hash"],
        "orbit_type": result["orbit_type"],
        "orbit_period": result["orbit_period"],
        "convergence_depth": result["convergence_depth"],
        "terminal_identity": result["terminal_identity"],
        "flow": flow,
        "flow_signature": sig,
        "flow_bigrams": bigrams,
        "key_terms": key_terms[:30],  # cap for storage
        "rare_terms": rare[:20],
        "term_chains": chains[:15],
    }


# ============================================================
# DOMAIN PACK — canon suppression
# ============================================================

def load_domain_pack(path: str) -> Dict[str, Any]:
    """Load a domain pack from JSON file."""
    import json
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def empty_domain_pack() -> Dict[str, Any]:
    """Return an empty domain pack (no suppression)."""
    return {
        "domain": "generic",
        "common_terms": set(),
        "common_flow_patterns": set(),
    }


# ============================================================
# LINEAGE SCORING
# ============================================================

def score_lineage(
    fp_a: Dict[str, Any],
    fp_b: Dict[str, Any],
    domain_pack: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Score structural lineage between two chunk fingerprints.

    Returns:
        {
            "lineage_score": 0.0-1.0,
            "classification": "COMMON_DOMAIN_OVERLAP" | "FRAMEWORK_OVERLAP" | "EXPRESSIVE_OVERLAP",
            "components": {
                "attractor_similarity": float,
                "structure_similarity": float,
                "flow_alignment": float,
                "term_chain_overlap": float,
                "rarity_bonus": float,
                "canon_penalty": float,
            },
            "shared_flow_bigrams": [...],
            "shared_rare_terms": [...],
        }
    """
    if domain_pack is None:
        domain_pack = empty_domain_pack()

    common_terms = set(domain_pack.get("common_terms", []))
    common_flows = set(domain_pack.get("common_flow_patterns", []))

    # 1. Attractor similarity
    attractor_sim = 0.0
    if fp_a["glyph_hash"] == fp_b["glyph_hash"]:
        attractor_sim = 1.0
    elif fp_a["orbit_type"] == fp_b["orbit_type"]:
        attractor_sim = 0.4
        if fp_a["orbit_period"] == fp_b["orbit_period"]:
            attractor_sim += 0.1
        if abs(fp_a["convergence_depth"] - fp_b["convergence_depth"]) <= 2:
            attractor_sim += 0.1

    # 2. Flow alignment
    flow_align = flow_alignment_score(fp_a["flow"], fp_b["flow"])
    bigram_overlap = flow_bigram_overlap(fp_a["flow"], fp_b["flow"])
    flow_score = 0.6 * flow_align + 0.4 * bigram_overlap

    # 3. Term chain overlap
    chains_a = set(fp_a.get("term_chains", []))
    chains_b = set(fp_b.get("term_chains", []))
    if chains_a and chains_b:
        chain_overlap = len(chains_a & chains_b) / max(len(chains_a | chains_b), 1)
    else:
        chain_overlap = 0.0

    # 4. Rarity bonus — shared rare terms
    rare_a = set(fp_a.get("rare_terms", []))
    rare_b = set(fp_b.get("rare_terms", []))
    shared_rare = rare_a & rare_b
    if rare_a and rare_b:
        rarity_bonus = len(shared_rare) / max(len(rare_a | rare_b), 1)
    else:
        rarity_bonus = 0.0

    # 5. Canon penalty — shared flow bigrams that are common in the domain
    shared_bigrams = set(fp_a["flow_bigrams"]) & set(fp_b["flow_bigrams"])
    canon_bigrams = shared_bigrams & common_flows
    if shared_bigrams:
        canon_ratio = len(canon_bigrams) / len(shared_bigrams)
    else:
        canon_ratio = 0.0

    # also penalize if most shared terms are common domain terms
    shared_terms = set(fp_a["key_terms"]) & set(fp_b["key_terms"])
    canon_terms = shared_terms & common_terms
    if shared_terms:
        term_canon_ratio = len(canon_terms) / len(shared_terms)
    else:
        term_canon_ratio = 0.0

    canon_penalty = 0.5 * canon_ratio + 0.5 * term_canon_ratio

    # Structure similarity (simple — same flow signature shape)
    sig_a = fp_a.get("flow_signature", "")
    sig_b = fp_b.get("flow_signature", "")
    if sig_a and sig_b:
        # compare character distributions
        from collections import Counter
        ca = Counter(sig_a)
        cb = Counter(sig_b)
        all_tags = set(ca.keys()) | set(cb.keys())
        if all_tags:
            structure_sim = sum(min(ca.get(t,0), cb.get(t,0)) for t in all_tags) / max(
                sum(max(ca.get(t,0), cb.get(t,0)) for t in all_tags), 1)
        else:
            structure_sim = 0.0
    else:
        structure_sim = 0.0

    # WEIGHTED SCORE
    lineage_score = (
        0.30 * attractor_sim +
        0.20 * structure_sim +
        0.25 * flow_score +
        0.15 * chain_overlap +
        0.10 * rarity_bonus -
        0.20 * canon_penalty
    )
    lineage_score = max(0.0, min(1.0, lineage_score))

    # CLASSIFICATION
    if lineage_score < 0.25 or canon_penalty > 0.5:
        classification = "COMMON_DOMAIN_OVERLAP"
    elif lineage_score < 0.55:
        classification = "FRAMEWORK_OVERLAP"
    else:
        classification = "EXPRESSIVE_OVERLAP"

    return {
        "lineage_score": round(lineage_score, 4),
        "classification": classification,
        "components": {
            "attractor_similarity": round(attractor_sim, 4),
            "structure_similarity": round(structure_sim, 4),
            "flow_alignment": round(flow_score, 4),
            "term_chain_overlap": round(chain_overlap, 4),
            "rarity_bonus": round(rarity_bonus, 4),
            "canon_penalty": round(canon_penalty, 4),
        },
        "shared_flow_bigrams": sorted(shared_bigrams),
        "shared_rare_terms": sorted(shared_rare),
        "flow_a": fp_a.get("flow_signature", ""),
        "flow_b": fp_b.get("flow_signature", ""),
    }
