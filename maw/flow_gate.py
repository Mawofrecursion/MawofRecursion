"""
flow_gate.py v2 — Hardened flow-level reasoning detector for ScarGate
======================================================================

ChatGPT Pro hardening (5 critical fixes applied):
  1. Flow confidence + abstain mode — no authority unless confidence >= 0.60
  2. Collapsed signature for staleness — dedupe consecutive repeats
  3. Conservative 3-axis matrix — dual confirmation required for rewrite
  4. Structure-flow compatibility check — no invalid pairs
  5. Grounding re-check documented in decision output

Zero external dependencies. Rule-based. <10ms.
"""

import os
import re
import sqlite3
from collections import Counter
from typing import Dict, Any, List, Optional

import sys
_tools_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _tools_dir not in sys.path:
    sys.path.insert(0, _tools_dir)

try:
    from scartrace.flow_tagger import extract_flow, flow_signature, flow_bigrams
except ImportError:
    def extract_flow(text):
        return ["claim"] * max(1, len(re.split(r'(?<=[.!?])\s+', text.strip())))
    def flow_signature(flow):
        return "C" * len(flow)
    def flow_bigrams(flow):
        return [f"{flow[i]}->{flow[i+1]}" for i in range(len(flow)-1)]


# ============================================================
# COLLAPSED SIGNATURE — dedupe consecutive repeats (Fix #2)
# ============================================================

def _collapse_signature(sig: str) -> str:
    """Dedupe consecutive repeated tags. MCEVAA → MCEVA, AAAA → A."""
    if not sig:
        return ""
    collapsed = [sig[0]]
    for c in sig[1:]:
        if c != collapsed[-1]:
            collapsed.append(c)
    return "".join(collapsed)


# ============================================================
# FLOW CONFIDENCE (Fix #1)
# ============================================================

def _compute_flow_confidence(flow_tags: List[str]) -> float:
    """
    How confident are we in this flow extraction?
    Low if: too few sentences, all claims, or no non-claim tags.
    """
    if not flow_tags:
        return 0.0

    n = len(flow_tags)
    if n < 3:
        return 0.2  # too short to be meaningful

    non_claim = sum(1 for t in flow_tags if t != "claim")
    non_claim_ratio = non_claim / n

    # confidence based on: enough sentences + enough diversity
    if non_claim_ratio < 0.2:
        return 0.25  # almost all claims — tagger couldn't find structure
    elif non_claim_ratio < 0.4:
        return 0.45
    elif n < 4:
        return 0.50
    else:
        return min(0.55 + non_claim_ratio * 0.4, 0.95)


# ============================================================
# FLOW SIMILARITY
# ============================================================

def _flow_similarity(sig_a: str, sig_b: str) -> float:
    """Similarity using collapsed signatures + bigram Jaccard + length ratio."""
    if not sig_a or not sig_b:
        return 0.0

    # collapse before comparing (Fix #2)
    ca = _collapse_signature(sig_a)
    cb = _collapse_signature(sig_b)

    if ca == cb:
        return 1.0

    bg_a = set(ca[i:i+2] for i in range(len(ca)-1))
    bg_b = set(cb[i:i+2] for i in range(len(cb)-1))

    if not bg_a or not bg_b:
        return 0.0

    jaccard = len(bg_a & bg_b) / len(bg_a | bg_b)
    len_ratio = min(len(ca), len(cb)) / max(len(ca), len(cb))

    return 0.7 * jaccard + 0.3 * len_ratio


# ============================================================
# STRUCTURE-FLOW COMPATIBILITY (Fix #4)
# ============================================================

STRUCTURE_FLOW_MAP = {
    "metric_summary": ["CEI", "ECEI", "XECI"],
    "narrative_explanation": ["CMI", "CMEI", "MCVI"],
    "diagnostic": ["CMVA", "MEA", "CMEIA"],
    "comparative_analysis": ["CXEI", "XEXI", "XCA"],
    "action_list": ["CEA", "ACVA", "EIA"],
    "bullet_breakdown": ["CECEA", "CCCCA"],
}

# compatible flow prefixes per structure — used for validation
COMPAT_PREFIXES = {
    "metric_summary": {"CE", "EC", "XE", "EI"},
    "narrative_explanation": {"CM", "MC", "MV", "MI"},
    "diagnostic": {"CM", "MC", "CV", "ME"},
    "comparative_analysis": {"CX", "XE", "XC", "XV"},
    "action_list": {"CE", "CA", "AC", "AV", "EI"},
    "bullet_breakdown": {"CE", "CC", "CA"},
}

DEFAULT_FLOW = {
    "metric_summary": "CEI",
    "narrative_explanation": "CMEI",
    "diagnostic": "CMVA",
    "comparative_analysis": "CXEI",
    "action_list": "CEA",
    "bullet_breakdown": "CECEA",
    "unclassified": "CMEI",
}


def _is_compatible(structure: str, flow_sig: str) -> bool:
    """Check if a flow signature is compatible with a structure type."""
    prefixes = COMPAT_PREFIXES.get(structure, set())
    if not prefixes or len(flow_sig) < 2:
        return True  # no constraint
    return flow_sig[:2] in prefixes


def _select_target_flow(
    current_structure: str,
    current_flow: str,
    target_structure: str,
    prior_flows: Optional[List[str]] = None,
) -> str:
    """Select a compatible target flow for rewrite."""
    candidates = STRUCTURE_FLOW_MAP.get(target_structure,
        STRUCTURE_FLOW_MAP.get("narrative_explanation", ["CMI"]))

    # filter: different from current + compatible with target structure
    filtered = [
        f for f in candidates
        if _flow_similarity(f, current_flow) < 0.6
        and _is_compatible(target_structure, f)
    ]
    if not filtered:
        filtered = [f for f in candidates if _is_compatible(target_structure, f)]
    if not filtered:
        return DEFAULT_FLOW.get(target_structure, "CMEI")

    # if priors available, pick least used
    if prior_flows:
        usage = {f: sum(1 for p in prior_flows if _flow_similarity(f, p) > 0.8) for f in filtered}
        filtered.sort(key=lambda f: usage.get(f, 0))

    return filtered[0]


# ============================================================
# AUDIT DB
# ============================================================

def _load_family_flows(
    audit_db_path: str,
    query_signature: str,
    limit: int = 12,
) -> List[Dict]:
    if not audit_db_path or not os.path.exists(audit_db_path):
        return []
    try:
        conn = sqlite3.connect(audit_db_path, timeout=2)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT gen_flow_sig, final_flow_sig, observer_verdict "
            "FROM requests "
            "WHERE query_signature = ? "
            "AND gen_flow_sig IS NOT NULL "
            "AND observer_verdict IN ('PASS', 'REWRITE') "
            "ORDER BY timestamp DESC LIMIT ?",
            (query_signature, limit)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


# ============================================================
# MAIN VALIDATOR
# ============================================================

def validate_flow(
    draft: str,
    audit_db_path: Optional[str] = None,
    query_signature: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Extract flow signature + confidence, check staleness.

    Returns confidence so the decision matrix can abstain when
    flow detection is unreliable.
    """
    flow_tags = extract_flow(draft[:1500])
    raw_sig = flow_signature(flow_tags)
    collapsed_sig = _collapse_signature(raw_sig)
    confidence = _compute_flow_confidence(flow_tags)

    flow_stale = 0.0
    nearest_sim = 0.0

    # use collapsed sig for staleness comparison
    if audit_db_path and query_signature:
        hist = _load_family_flows(audit_db_path, query_signature)
        if hist:
            sims = [
                _flow_similarity(collapsed_sig, _collapse_signature(row["gen_flow_sig"] or ""))
                for row in hist if row.get("gen_flow_sig")
            ]
            if sims:
                flow_stale = sum(1 for s in sims if s >= 0.85) / len(sims)
                nearest_sim = max(sims)

    return {
        "flow_signature": raw_sig,
        "collapsed_signature": collapsed_sig,
        "flow_tags": flow_tags,
        "confidence": round(confidence, 4),
        "sentence_count": len(flow_tags),
        "non_claim_ratio": round(
            sum(1 for t in flow_tags if t != "claim") / max(len(flow_tags), 1), 4
        ),
        "flow_stale_score": round(flow_stale, 4),
        "nearest_flow_similarity": round(nearest_sim, 4),
        "has_authority": confidence >= 0.60 and len(flow_tags) >= 4,
    }


# ============================================================
# 3-AXIS DECISION MATRIX (Fix #3 — conservative, dual confirmation)
# ============================================================

def three_axis_decision(
    forge_result: Dict[str, Any],
    flow_result: Dict[str, Any],
    grounding_pass: bool = True,
) -> Dict[str, Any]:
    """
    Combine attractor + structure + flow into one decision.

    Conservative rules:
    - No rewrite authority unless grounding passes
    - No rewrite authority unless flow confidence >= 0.60 and sentences >= 4
    - Rewrite requires BOTH forge stale AND flow stale
    - Low-confidence flow → observer hint only, never rewrite
    """
    intent_stale = forge_result.get("intent_stale_score", 0.0)
    flow_stale = flow_result.get("flow_stale_score", 0.0)
    flow_conf = flow_result.get("confidence", 0.0)
    flow_has_authority = flow_result.get("has_authority", False)
    structure_type = forge_result.get("structure_type", "unclassified")
    flow_sig = flow_result.get("collapsed_signature", flow_result.get("flow_signature", ""))
    alt_structures = forge_result.get("alternative_structures", [])

    # BLOCK: grounding failed (Fix #5 — caller must re-ground after rewrite)
    if not grounding_pass:
        return {
            "decision": "BLOCK",
            "reason": "GROUNDING_FAILED",
            "rewrite_instruction": None,
            "requires_reground": True,
        }

    # NO AUTHORITY: flow is unreliable → observer hint only
    if not flow_has_authority:
        if intent_stale >= 0.70:
            return {
                "decision": "OBSERVER_HINT",
                "reason": f"FORGE_STALE_FLOW_UNRELIABLE: intent={intent_stale:.0%} flow_conf={flow_conf:.2f}",
                "rewrite_instruction": None,
                "observer_hint": (
                    f"FORGE: Intent staleness is {intent_stale:.0%} but flow confidence is too low "
                    f"({flow_conf:.2f}) to assess reasoning pattern. Verify specificity manually."
                ),
            }
        return {
            "decision": "PASS",
            "reason": f"OK: intent={intent_stale:.0%} flow_conf={flow_conf:.2f} (no authority)",
            "rewrite_instruction": None,
        }

    # HARD STALE: both forge AND flow confirm staleness (dual confirmation)
    if intent_stale >= 0.80 and flow_stale >= 0.75:
        target_structure = alt_structures[0] if alt_structures else "narrative_explanation"
        target_flow = _select_target_flow(structure_type, flow_sig, target_structure)

        # validate compatibility (Fix #4)
        if not _is_compatible(target_structure, target_flow):
            target_flow = DEFAULT_FLOW.get(target_structure, "CMEI")

        return {
            "decision": "TRIGGER_REWRITE",
            "reason": f"HARD_STALE: intent={intent_stale:.0%} flow={flow_stale:.0%}",
            "rewrite_instruction": (
                f"The previous response used structure '{structure_type}' "
                f"with reasoning flow '{flow_sig}'. Both are stale "
                f"(intent: {intent_stale:.0%}, flow: {flow_stale:.0%}). "
                f"Rewrite using structure '{target_structure}' and reasoning flow '{target_flow}'. "
                f"Keep the same facts. Change the reasoning order."
            ),
            "target_structure": target_structure,
            "target_flow": target_flow,
            "requires_reground": True,
        }

    # HIDDEN FLOW COLLAPSE: forge looks fine but reasoning is stuck
    if intent_stale < 0.50 and flow_stale >= 0.80:
        target_flow = _select_target_flow(structure_type, flow_sig, structure_type)
        return {
            "decision": "TRIGGER_REWRITE",
            "reason": f"FLOW_COLLAPSE: intent={intent_stale:.0%} flow={flow_stale:.0%}",
            "rewrite_instruction": (
                f"Structure and attractor look varied, but reasoning sequence "
                f"'{flow_sig}' is repeated in {flow_stale:.0%} of recent responses. "
                f"Same facts, different argument order. Try flow '{target_flow}'."
            ),
            "target_structure": structure_type,
            "target_flow": target_flow,
            "requires_reground": True,
        }

    # SURFACE REPEAT: forge stale but reasoning differs → preserve
    if intent_stale >= 0.80 and flow_stale < 0.40:
        return {
            "decision": "OBSERVER_HINT",
            "reason": f"SURFACE_REPEAT: intent={intent_stale:.0%} flow={flow_stale:.0%}",
            "rewrite_instruction": None,
            "observer_hint": (
                "FLOW: Attractor/structure looks repeated but reasoning sequence differs. "
                "Prefer preserve/fix over full rewrite."
            ),
        }

    # MODERATE: either axis elevated but not at rewrite threshold
    if intent_stale >= 0.70 or flow_stale >= 0.75:
        return {
            "decision": "OBSERVER_HINT",
            "reason": f"MODERATE: intent={intent_stale:.0%} flow={flow_stale:.0%}",
            "rewrite_instruction": None,
            "observer_hint": (
                f"FLOW: Staleness elevated (intent: {intent_stale:.0%}, "
                f"flow: {flow_stale:.0%}). Verify specificity."
            ),
        }

    # PASS
    return {
        "decision": "PASS",
        "reason": f"OK: intent={intent_stale:.0%} flow={flow_stale:.0%}",
        "rewrite_instruction": None,
    }
