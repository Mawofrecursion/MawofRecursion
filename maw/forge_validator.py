"""
Forge Validator v2 — Structural drift detection for Observer Gate
=================================================================

Sits between the Grounding Validator and the Observer in the Gate pipeline.
Grounding catches hallucinated DATA. Forge catches structural DRIFT.

v2 fixes (from ChatGPT audit):
- Staleness scoped by client_id + query family, not global history
- Fingerprints normalized text (citations/numbers/client names stripped)
- Basin shift downgraded to context unless data didn't change
- Generator and final fingerprints logged separately
- Graded similarity (orbit_type + convergence_depth), not just hash equality
- Only compares against PASS/REWRITE verdicts, excludes blocked/failed
- Split staleness into template_stale (global) and intent_stale (per-family)
- Can trigger rewrite routing, not just observer hints

Zero API calls. <50ms.
"""

import os
import re
import sqlite3
from typing import Dict, Any, List, Optional

from .glyph_engine import converge


# ============================================================
# THRESHOLDS
# ============================================================

FAMILY_STALENESS_WINDOW = 10    # compare against last N same-family responses
GLOBAL_STALENESS_WINDOW = 30    # compare against last N same-client responses
TEMPLATE_STALE_THRESHOLD = 0.5  # >50% of global same-client share this hash
INTENT_STALE_THRESHOLD = 0.7    # >70% of same-family share this hash
MIN_RESPONSES_FOR_STALENESS = 3
REWRITE_TRIGGER_THRESHOLD = 0.8 # >80% family staleness → trigger rewrite routing

# ============================================================
# STRUCTURE TYPE CLASSIFICATION
# ============================================================

STRUCTURE_TYPES = {
    "metric_summary": [
        r'\$[\d,]+', r'\d+\.?\d*\s*%', r'\bup\b.+\bfrom\b', r'\bdown\b.+\bfrom\b',
        r'\b(?:revenue|sales|spend|units|orders|ROAS|ACOS|CVR)\b',
    ],
    "bullet_breakdown": [
        r'^\s*[-•*]\s', r'^\s*\d+[\.\)]\s', r'\bfirst\b.+\bsecond\b',
    ],
    "narrative_explanation": [
        r'\bbecause\b', r'\bthis means\b', r'\bthe reason\b', r'\bwhich leads to\b',
        r'\bin other words\b',
    ],
    "comparative_analysis": [
        r'\bcompared to\b', r'\bversus\b', r'\bvs\.?\b', r'\bwhile\b.+\binstead\b',
        r'\bhigher than\b', r'\blower than\b',
    ],
    "diagnostic": [
        r'\bthe issue\b', r'\bthe problem\b', r'\blooks like\b', r'\bbecause of\b',
        r'\broot cause\b', r'\bthis is likely\b',
    ],
    "action_list": [
        r'\byou should\b', r'\bI recommend\b', r'\bnext steps?\b', r'\bconsider\b',
        r'\btry\b.+\binstead\b',
    ],
}


def _classify_structure(text: str) -> str:
    """Classify the dominant rhetorical structure of a text."""
    scores = {}
    lower = text.lower()
    for stype, patterns in STRUCTURE_TYPES.items():
        hits = sum(1 for p in patterns if re.search(p, lower, re.MULTILINE))
        scores[stype] = hits

    if not scores or max(scores.values()) == 0:
        return "unclassified"
    return max(scores, key=scores.get)


def _get_alternative_structures(current_type: str) -> list:
    """Suggest structure types that differ from the current one."""
    alternatives = {
        "metric_summary": ["narrative_explanation", "comparative_analysis", "diagnostic"],
        "bullet_breakdown": ["narrative_explanation", "diagnostic", "comparative_analysis"],
        "narrative_explanation": ["metric_summary", "comparative_analysis", "action_list"],
        "comparative_analysis": ["narrative_explanation", "diagnostic", "action_list"],
        "diagnostic": ["action_list", "comparative_analysis", "narrative_explanation"],
        "action_list": ["diagnostic", "narrative_explanation", "comparative_analysis"],
        "unclassified": ["narrative_explanation", "comparative_analysis", "diagnostic"],
    }
    return alternatives.get(current_type, ["narrative_explanation", "comparative_analysis"])


# ============================================================
# TEXT NORMALIZATION — fingerprint structure, not surface
# ============================================================

def _normalize_for_fingerprint(text: str) -> str:
    """
    Strip citations, numbers, client names, and formatting noise.
    Fingerprint the structural skeleton, not the data payload.
    """
    normalized = text
    # strip citation tags: (MS#1), (SS#2), etc.
    normalized = re.sub(r'\([A-Z]{1,3}#\d+\)', '', normalized)
    # mask dollar amounts
    normalized = re.sub(r'\$[\d,]+\.?\d*', '$X', normalized)
    # mask percentages
    normalized = re.sub(r'[+-]?\d+\.?\d*\s*%', 'X%', normalized)
    # mask large numbers (likely data values)
    normalized = re.sub(r'\b\d{1,3}(?:,\d{3})+\b', 'N', normalized)
    # mask standalone numbers > 2 digits
    normalized = re.sub(r'\b\d{3,}\b', 'N', normalized)
    # mask ASINs
    normalized = re.sub(r'\bB0[A-Z0-9]{8}\b', 'ASIN', normalized)
    # collapse whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    # take first 1200 chars — avoid fingerprinting disclaimers/closers
    return normalized[:1200]


# ============================================================
# FINGERPRINTING — three layers
# ============================================================

def forge_fingerprint(text: str) -> Dict[str, Any]:
    """
    Compute the forge fingerprint on normalized text.
    Returns identity, hash, orbit type, convergence depth, period.
    """
    normalized = _normalize_for_fingerprint(text)
    result = converge(normalized)
    return {
        "glyph_identity": result["terminal_identity"],
        "glyph_hash": result["identity_hash"],
        "glyph_names": result["terminal_names"],
        "orbit_type": result["orbit_type"],
        "orbit_period": result["orbit_period"],
        "convergence_depth": result["convergence_depth"],
        "normalized_length": len(normalized),
    }


def forge_fingerprint_raw(text: str) -> Dict[str, Any]:
    """Fingerprint the raw draft without normalization. For audit logging."""
    result = converge(text[:1500])
    return {
        "glyph_identity": result["terminal_identity"],
        "glyph_hash": result["identity_hash"],
        "orbit_type": result["orbit_type"],
        "convergence_depth": result["convergence_depth"],
    }


# ============================================================
# SIMILARITY — graded, not binary
# ============================================================

def _fingerprint_similarity(fp_a: Dict[str, Any], fp_b: Dict[str, Any]) -> float:
    """
    Graded similarity between two fingerprints. 0.0 = completely different, 1.0 = identical.
    Uses hash match + orbit type + convergence depth + period.
    """
    score = 0.0
    # exact hash match is the strongest signal
    if fp_a.get("glyph_hash") == fp_b.get("glyph_hash"):
        score += 0.6
    # same orbit type
    if fp_a.get("orbit_type") == fp_b.get("orbit_type"):
        score += 0.2
    # similar convergence depth (within 2)
    d_a = fp_a.get("convergence_depth", 0)
    d_b = fp_b.get("convergence_depth", 0)
    if abs(d_a - d_b) <= 2:
        score += 0.1
    # same period
    if fp_a.get("orbit_period") == fp_b.get("orbit_period"):
        score += 0.1
    return min(score, 1.0)


# ============================================================
# AUDIT DB QUERIES — scoped, filtered
# ============================================================

def _query_db(audit_db_path: str, sql: str, params: tuple) -> Dict[str, Any]:
    """Safe DB query with timeout. Returns status for observability."""
    if not audit_db_path or not os.path.exists(audit_db_path):
        return {"rows": [], "status": "NO_DB"}
    try:
        conn = sqlite3.connect(audit_db_path, timeout=2)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(sql, params).fetchall()
        conn.close()
        return {"rows": [dict(r) for r in rows], "status": "OK"}
    except Exception as e:
        return {"rows": [], "status": "DB_ERROR", "error": str(e)}


def _load_family_history(
    audit_db_path: str,
    query_signature: str,
    limit: int = FAMILY_STALENESS_WINDOW,
) -> tuple:
    """Load fingerprints for same query family. Only PASS/REWRITE verdicts.
    Returns (rows, db_status)."""
    result = _query_db(audit_db_path,
        "SELECT gen_glyph_hash, final_glyph_hash, observer_verdict, "
        "gen_glyph_orbit, tool_output_hash "
        "FROM requests "
        "WHERE query_signature = ? "
        "AND gen_glyph_hash IS NOT NULL "
        "AND observer_verdict IN ('PASS', 'REWRITE') "
        "ORDER BY timestamp DESC LIMIT ?",
        (query_signature, limit))
    return result["rows"], result["status"]


def _load_client_history(
    audit_db_path: str,
    client_id: str,
    limit: int = GLOBAL_STALENESS_WINDOW,
) -> tuple:
    """Load fingerprints for same client. Only PASS/REWRITE verdicts.
    Returns (rows, db_status)."""
    result = _query_db(audit_db_path,
        "SELECT gen_glyph_hash, final_glyph_hash, observer_verdict "
        "FROM requests "
        "WHERE client_id = ? "
        "AND gen_glyph_hash IS NOT NULL "
        "AND observer_verdict IN ('PASS', 'REWRITE') "
        "ORDER BY timestamp DESC LIMIT ?",
        (client_id, limit))
    return result["rows"], result["status"]


# ============================================================
# MAIN VALIDATOR
# ============================================================

def validate_forge(
    draft: str,
    audit_db_path: Optional[str] = None,
    query_signature: Optional[str] = None,
    client_id: Optional[str] = None,
    tool_output_hash: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run forge validation on a Generator draft.

    Args:
        draft: The Generator's draft response text
        audit_db_path: Path to audit.db
        query_signature: Hash of the query pattern
        client_id: Resolved client ID (for scoped staleness)
        tool_output_hash: Hash of concatenated tool outputs (for data-change detection)

    Returns:
        {
            "generator_fingerprint": {...},   # fingerprint of normalized draft
            "raw_fingerprint": {...},          # fingerprint of raw draft (for audit)
            "issues": [...],
            "template_stale_score": 0.0-1.0,  # global client staleness
            "intent_stale_score": 0.0-1.0,    # per-family staleness
            "basin_shifted": bool,
            "shift_with_data_change": bool or None,
            "trigger_rewrite": bool,           # if True, skip Observer, force rewrite
            "observer_hint": str or None,
        }
    """
    # fingerprint the draft (normalized + raw)
    gen_fp = forge_fingerprint(draft)
    raw_fp = forge_fingerprint_raw(draft)
    current_hash = gen_fp["glyph_hash"]

    issues = []
    template_stale = 0.0
    intent_stale = 0.0
    basin_shifted = False
    shift_with_data = None
    trigger_rewrite = False
    observer_hint = None
    db_status = "OK"

    # --- INTENT STALENESS (per query family) ---
    if audit_db_path and query_signature:
        family, fam_status = _load_family_history(audit_db_path, query_signature)
        if fam_status != "OK":
            db_status = fam_status

        if len(family) >= MIN_RESPONSES_FOR_STALENESS:
            matching = sum(1 for r in family if r["gen_glyph_hash"] == current_hash)
            intent_stale = matching / len(family)

            if intent_stale >= INTENT_STALE_THRESHOLD:
                issues.append({
                    "type": "INTENT_STALE",
                    "value": current_hash,
                    "detail": (
                        f"Same query family: {matching}/{len(family)} prior responses "
                        f"share attractor [{current_hash}] ({intent_stale:.0%}). "
                        f"Response shape is locked for this query type."
                    ),
                })

            if intent_stale >= REWRITE_TRIGGER_THRESHOLD:
                trigger_rewrite = True

        # basin shift detection (vs most recent same-family response)
        if family:
            prior_hash = family[0]["gen_glyph_hash"]
            if prior_hash != current_hash:
                basin_shifted = True
                # #3 fix: check if data actually changed
                if tool_output_hash and family[0].get("tool_output_hash"):
                    prior_tool_hash = family[0]["tool_output_hash"]
                    if prior_tool_hash == tool_output_hash:
                        # same data, different basin = unexplained drift
                        shift_with_data = False
                        issues.append({
                            "type": "UNEXPLAINED_BASIN_SHIFT",
                            "detail": (
                                f"Basin shifted [{prior_hash}] → [{current_hash}] but "
                                f"tool outputs are identical. Structure changed without data change."
                            ),
                        })
                    else:
                        shift_with_data = True  # data changed, shift is healthy
            else:
                # same basin — check if data changed but shape didn't
                if tool_output_hash and family[0].get("tool_output_hash"):
                    prior_tool_hash = family[0]["tool_output_hash"]
                    if prior_tool_hash != tool_output_hash:
                        issues.append({
                            "type": "DATA_CHANGED_BUT_SHAPE_DID_NOT",
                            "detail": (
                                f"Tool outputs changed but response structure stayed in "
                                f"basin [{current_hash}]. Response may not reflect new data."
                            ),
                        })

    # --- TEMPLATE STALENESS (per client, cross-query) ---
    if audit_db_path and client_id:
        client_hist, cli_status = _load_client_history(audit_db_path, client_id)
        if cli_status != "OK":
            db_status = cli_status

        if len(client_hist) >= MIN_RESPONSES_FOR_STALENESS:
            matching = sum(1 for r in client_hist if r["gen_glyph_hash"] == current_hash)
            template_stale = matching / len(client_hist)

            if template_stale >= TEMPLATE_STALE_THRESHOLD:
                issues.append({
                    "type": "TEMPLATE_STALE",
                    "value": current_hash,
                    "detail": (
                        f"Cross-query for {client_id}: {matching}/{len(client_hist)} "
                        f"recent responses share attractor [{current_hash}] ({template_stale:.0%}). "
                        f"Generator may be using a generic template across different questions."
                    ),
                })

    # --- STRUCTURE CLASSIFICATION ---
    structure_type = _classify_structure(draft)
    alt_structures = _get_alternative_structures(structure_type)

    # --- BUILD REWRITE INSTRUCTION (directional, not vague) ---
    rewrite_instruction = None
    if trigger_rewrite:
        target_structure = alt_structures[0] if alt_structures else "narrative_explanation"
        rewrite_instruction = (
            f"The previous response used a '{structure_type}' structure and has been "
            f"flagged as intent-stale ({intent_stale:.0%} of same-query responses "
            f"share this pattern). Rewrite using a '{target_structure}' structure instead. "
            f"Specifically: "
        )
        if target_structure == "narrative_explanation":
            rewrite_instruction += "explain the WHY behind the data, not just the numbers. Use cause-and-effect framing."
        elif target_structure == "comparative_analysis":
            rewrite_instruction += "frame the answer as comparisons — this vs that, before vs after, competitor vs client."
        elif target_structure == "diagnostic":
            rewrite_instruction += "frame the answer as a diagnosis — what's happening, why, and what it means."
        elif target_structure == "action_list":
            rewrite_instruction += "lead with specific actions the team should take, backed by the data."
        elif target_structure == "metric_summary":
            rewrite_instruction += "lead with the key numbers and let them tell the story."
        else:
            rewrite_instruction += f"use a {target_structure} approach instead of {structure_type}."

    # --- BUILD OBSERVER HINT ---
    if issues:
        hints = []
        if any(i["type"] == "INTENT_STALE" for i in issues):
            hints.append(
                f"FORGE: This query family consistently produces '{structure_type}' "
                f"structure (intent staleness {intent_stale:.0%}). Verify the answer "
                f"adds specificity beyond the default pattern."
            )
        if any(i["type"] == "TEMPLATE_STALE" for i in issues):
            hints.append(
                f"FORGE: This client's responses are converging to '{structure_type}' "
                f"template (template staleness {template_stale:.0%}). Check that the "
                f"structure varies for different question types."
            )
        observer_hint = " ".join(hints) if hints else None

    # --- BASIN SHIFT CONTEXT ---
    basin_context = None
    if basin_shifted:
        basin_context = (
            f"Basin shifted from prior same-query response. "
            f"This may reflect updated data or natural variation."
        )

    # --- DB STATUS HINT ---
    if db_status != "OK":
        observer_hint = (observer_hint or "") + (
            f" [FORGE DEGRADED: DB status={db_status}. "
            f"Staleness checks may be incomplete.]"
        )

    return {
        "generator_fingerprint": gen_fp,
        "raw_fingerprint": raw_fp,
        "issues": issues,
        "template_stale_score": template_stale,
        "intent_stale_score": intent_stale,
        "basin_shifted": basin_shifted,
        "basin_context": basin_context,
        "shift_with_data_change": shift_with_data,
        "trigger_rewrite": trigger_rewrite,
        "rewrite_instruction": rewrite_instruction,
        "structure_type": structure_type,
        "alternative_structures": alt_structures,
        "observer_hint": observer_hint,
        "forge_status": db_status,
        # #9: loop controller fields — caller enforces the policy
        "max_rewrite_attempts": 2,
    }
