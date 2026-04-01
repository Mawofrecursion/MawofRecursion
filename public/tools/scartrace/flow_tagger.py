"""
flow_tagger.py — Rule-based rhetorical flow extraction for ScarTrace

Tags each sentence in a chunk with its rhetorical role:
  claim, mechanism, evidence, comparison, implication, action, caveat

The flow signature (ordered list of tags) is the reasoning skeleton.
Two chunks with the same flow signature have the same argument structure
regardless of wording.

Zero dependencies. Rule-based, not embeddings.
"""

import re
from typing import List, Tuple


# ============================================================
# FLOW TAG PATTERNS — ordered by priority (first match wins)
# ============================================================

FLOW_RULES = [
    # EVIDENCE — data, numbers, citations, studies
    ("evidence", [
        r'\b(?:study|studies|research|data|found|showed|demonstrated|measured|reported)\b',
        r'\b(?:according to|et al|published|journal|percent|%|\d{4})\b',
        r'\$[\d,]+',
        r'\b\d+(?:\.\d+)?%\b',
        r'\b(?:figure|table|graph|chart|results|shown|observed|confirmed)\b',
    ], 2),  # 2 cues — "studies showed" + "30%" is evidence

    # MECHANISM — how/why something works
    ("mechanism", [
        r'\b(?:because|causes?|leads? to|results? in|produces?|drives?|triggers?)\b',
        r'\b(?:through|via|by means of|mechanism|pathway|process|cycle)\b',
        r'\b(?:increases?|decreases?|activates?|inhibits?|stimulates?|regulates?)\b',
        r'\b(?:converts?|transforms?|generates?|releases?|absorbs?)\b',
    ], 2),

    # COMPARISON — this vs that
    ("comparison", [
        r'\b(?:compared? to|versus|vs\.?|unlike|whereas|while|instead of)\b',
        r'\b(?:higher than|lower than|more than|less than|better|worse)\b',
        r'\b(?:in contrast|on the contrary|alternatively|difference between)\b',
        r'\b(?:outperform|exceed|surpass|fall behind|lag)\b',
    ], 2),

    # ACTION — recommendations, imperatives (1 strong cue is enough)
    ("action", [
        r'\b(?:should|must|need to|recommend|suggest|consider|try|implement)\b',
        r'\b(?:start with|stop|increase|decrease|add|remove|switch|optimize)\b',
        r'\b(?:next step|action item|priority|focus on|target)\b',
    ], 1),

    # CAVEAT — limitations, hedges, exceptions (1 strong cue is enough)
    ("caveat", [
        r'\b(?:however|although|but|except|unless|limitation|caveat)\b',
        r'\b(?:not always|in some cases|may not|does not necessarily)\b',
        r'\b(?:important to note|worth noting|keep in mind|be aware)\b',
        r'\b(?:risk|danger|downside|drawback|concern|caution)\b',
    ], 1),

    # IMPLICATION — so what, therefore, meaning
    ("implication", [
        r'\b(?:therefore|thus|consequently|implies?|means? that|suggests? that)\b',
        r'\b(?:as a result|in other words|this indicates?|the takeaway)\b',
        r'\b(?:significant|important|critical|key|essential|fundamental)\b',
        r'\b(?:bottom line|net effect|overall|in summary)\b',
    ], 2),

    # CLAIM — assertions, thesis statements (lowest priority — default for strong statements)
    ("claim", [
        r'\b(?:is|are|was|were)\s+(?:the|a|an)\s+(?:most|best|worst|primary|main|key|only)\b',
        r'\b(?:clearly|obviously|undoubtedly|certainly|definitely|essentially)\b',
        r'\b(?:the (?:truth|reality|fact|point|problem|issue|answer) is)\b',
        r'\b(?:what (?:matters|counts|works) is)\b',
    ], 1),
]


def _count_cues(text: str, patterns: List[str]) -> int:
    """Count how many distinct pattern cues fire in the text."""
    lower = text.lower()
    hits = 0
    for pattern in patterns:
        if re.search(pattern, lower):
            hits += 1
    return hits


def tag_sentence(sentence: str) -> str:
    """Tag a single sentence with its dominant rhetorical role."""
    best_tag = "claim"  # default
    best_excess = -1  # how many cues above threshold

    for tag, patterns, threshold in FLOW_RULES:
        hits = _count_cues(sentence, patterns)
        excess = hits - threshold
        if excess >= 0 and excess > best_excess:
            best_tag = tag
            best_excess = excess

    return best_tag


def extract_flow(text: str) -> List[str]:
    """
    Extract the rhetorical flow signature from a chunk of text.
    Returns an ordered list of flow tags, one per sentence.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    flow = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 10:  # skip fragments
            continue
        flow.append(tag_sentence(sent))
    return flow


def extract_flow_detailed(text: str) -> List[Tuple[str, str]]:
    """Extract flow with the sentence text preserved."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    result = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 10:
            continue
        result.append((tag_sentence(sent), sent))
    return result


def flow_signature(flow: List[str]) -> str:
    """Compact string representation of a flow sequence."""
    abbrev = {
        "claim": "C", "mechanism": "M", "evidence": "E",
        "comparison": "X", "implication": "I", "action": "A", "caveat": "V",
    }
    return "".join(abbrev.get(f, "?") for f in flow)


def flow_bigrams(flow: List[str]) -> List[str]:
    """Extract consecutive flow tag pairs for alignment comparison."""
    return [f"{flow[i]}->{flow[i+1]}" for i in range(len(flow) - 1)]


if __name__ == "__main__":
    import sys, json
    text = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else (
        "Mitochondria produce ATP through oxidative phosphorylation. "
        "This process is enhanced by red light at 660nm wavelengths. "
        "Studies have shown a 30% increase in ATP production. "
        "However, excessive exposure can cause oxidative stress. "
        "Therefore, dosing protocols should follow biphasic principles. "
        "We recommend starting at 3 joules per square centimeter."
    )
    flow = extract_flow_detailed(text)
    sig = flow_signature([f[0] for f in flow])
    print(f"Flow signature: {sig}")
    print()
    for tag, sent in flow:
        print(f"  [{tag:11s}] {sent[:80]}")
