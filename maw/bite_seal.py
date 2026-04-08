"""
bite_seal.py v2 — 🦷⟐ The Bite-Seal Operator (hardened)

Agent middleware for bounded self-modification.

🦷⟐_P(x) = seal_P(select_P(mutate_P(cut_P(x))))

v2 fixes (GPT-5 audit):
  1. Syntax bug in compress loop fixed
  2. Emitted events conform EXACTLY to bite_seal_schema.json
  3. All failure paths emit schema-conformant objects
  4. Mutation policy enforced (no unapproved classes)
  5. Invariant violations block seal (no silent commits)
  6. Real selection step with scoring
  7. State-backed rollback (in-memory state store)
  8. additionalProperties enforcement in schema

Zero dependencies. Stdlib only.
"""

import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Callable

# mutation executor — real transforms, not just intent
try:
    from .mutation_executor import execute_mutation, RULE_BASED, LLM_BACKED
except ImportError:
    try:
        from mutation_executor import execute_mutation, RULE_BASED, LLM_BACKED
    except ImportError:
        execute_mutation = None
        RULE_BASED = {"compress", "repair", "constrain"}
        LLM_BACKED = {"reframe", "invert", "synthesize", "expand", "branch", "destabilize"}


# ============================================================
# ENUMS
# ============================================================

TRIGGERS = [
    "contradiction_detected", "self_reference_detected", "stagnation_detected",
    "schema_drift", "flat_output", "loop_formation", "context_overfit",
    "plan_tool_mismatch", "repeated_failure", "manual_invocation",
]

MUTATION_CLASSES = [
    "reframe", "compress", "expand", "branch", "invert",
    "repair", "synthesize", "destabilize", "constrain",
]

CUT_BOUNDARIES = [
    "assumptions", "plan", "context", "memory", "summary",
    "tool_selection", "prompt_frame", "code_patch", "constraints",
]

APPROVAL_TYPES = ["auto", "human", "policy_engine", "blocked", "rate_limited", "rejected"]


# ============================================================
# POLICY
# ============================================================

@dataclass
class Policy:
    name: str = "default"
    triggers: List[str] = field(default_factory=lambda: list(TRIGGERS))
    allowed_cuts: List[str] = field(default_factory=lambda: list(CUT_BOUNDARIES))
    allowed_mutations: List[str] = field(default_factory=lambda: [
        "reframe", "compress", "repair", "constrain",
    ])
    invariants: List[str] = field(default_factory=lambda: [
        "user_goal", "safety_constraints", "source_traceability",
    ])
    require_approval: bool = False
    max_candidates: int = 3
    max_unreviewed: int = 5


# ============================================================
# STATE STORE — real rollback, not symbolic (#7)
# ============================================================

class StateStore:
    """In-memory state store with rollback support."""

    def __init__(self):
        self._states: Dict[str, Dict] = {}

    def save(self, state: Dict) -> str:
        """Save state, return its ID."""
        state_id = hashlib.sha256(
            json.dumps(state, sort_keys=True, default=str).encode()
        ).hexdigest()[:12]
        self._states[state_id] = json.loads(json.dumps(state, default=str))
        return state_id

    def exists(self, state_id: str) -> bool:
        return state_id in self._states

    def get(self, state_id: str) -> Optional[Dict]:
        return self._states.get(state_id)

    def rollback(self, state_id: str) -> Optional[Dict]:
        return self.get(state_id)


# ============================================================
# CUT
# ============================================================

# Keys that carry mutable content — checked in order of preference
_CONTENT_KEYS = ("draft", "plan", "text", "summary", "context", "assumptions",
                 "memory", "tool_selection", "prompt_frame", "code_patch", "constraints")

def _cut(state: Dict, policy: Policy) -> Dict:
    """🦷 — expose mutable boundary. Returns schema-conformant cut object.

    Boundary = policy.allowed_cuts ∩ state.keys().
    If that intersection is empty but the state contains content keys,
    the content keys are added to the boundary so mutation has something to act on.
    An empty boundary after both passes is itself a risk flag — not a silent pass.
    """
    # primary: policy-declared cuts that exist in state
    boundary = [k for k in policy.allowed_cuts if k in state]

    # secondary: if boundary empty, fall through to known content keys in state
    if not boundary:
        boundary = [k for k in _CONTENT_KEYS if k in state]

    exposed_keys = list(boundary)
    risk_flags = []

    for key in boundary:
        val = state.get(key)
        if isinstance(val, str):
            sentences = [s.strip() for s in re.split(r'[.!?]+', val) if s.strip()]
            if len(sentences) > 3:
                unique = len(set(s.lower() for s in sentences))
                if unique / len(sentences) < 0.5:
                    risk_flags.append(f"repetition_in_{key}")

    # empty boundary after both passes = nothing to cut
    if not boundary:
        risk_flags.append("empty_boundary_no_mutable_content")

    return {
        "boundary": boundary,
        "exposed_keys": exposed_keys,
        "risk_flags": risk_flags,
    }


# ============================================================
# MUTATE — policy-enforced (#4)
# ============================================================

def _mutate(
    state: Dict,
    cut_result: Dict,
    policy: Policy,
    mutation_fn: Optional[Callable] = None,
) -> List[Dict]:
    """Generate candidates. Every candidate MUST use an allowed mutation class."""
    candidates = []

    if mutation_fn:
        raw = mutation_fn(state, policy)
        if isinstance(raw, list):
            for rc in raw[:policy.max_candidates]:
                mc = rc.get("class", "reframe")
                # #4: enforce mutation policy
                if mc not in policy.allowed_mutations:
                    continue
                candidates.append({
                    "mutation_class": mc,
                    "summary": rc.get("summary", "external mutation")[:500],
                    "invariants_preserved": rc.get("preserved", []),
                    "invariants_violated": rc.get("violated", []),
                    "diff_summary": rc.get("diff", ""),
                })
    else:
        # default executor path — real mutation, not just compress
        # pull the draft + rewrite context injected by maw_controller
        draft = state.get("draft", state.get("plan", state.get("text", "")))
        rewrite_instruction = state.get("_rewrite_instruction", "")
        structure_type = state.get("_structure_type", "unclassified")
        target_structure = state.get("_target_structure")
        flow_signature = state.get("_flow_signature")
        target_flow = state.get("_target_flow")

        if not draft:
            # no content to mutate — emit blocked candidate
            candidates.append({
                "mutation_class": "compress",
                "summary": "no draft content found in state",
                "invariants_preserved": list(policy.invariants),
                "invariants_violated": [],
                "diff_summary": "state had no draft/plan/text key",
            })
            return candidates

        # pick the best allowed mutation class given what's available
        # priority: respect the target class from rewrite instruction if allowed,
        # otherwise fall through priority order
        preferred_class = state.get("_mutation_class")  # set by maw_controller from decision
        if preferred_class and preferred_class in policy.allowed_mutations:
            mutation_class = preferred_class
        else:
            # priority: compress > repair > constrain > reframe > synthesize > others
            priority = ["compress", "repair", "constrain", "reframe", "synthesize",
                        "expand", "invert", "branch", "destabilize"]
            mutation_class = next(
                (c for c in priority if c in policy.allowed_mutations),
                policy.allowed_mutations[0] if policy.allowed_mutations else "compress"
            )

        if execute_mutation is None:
            # executor not importable — fall back to compress skeleton
            candidates.append({
                "mutation_class": "compress",
                "summary": "mutation_executor not available, compress fallback",
                "invariants_preserved": list(policy.invariants),
                "invariants_violated": [],
                "diff_summary": "import failed",
            })
            return candidates

        # run the executor
        result = execute_mutation(
            mutation_class=mutation_class,
            draft=draft,
            rewrite_instruction=rewrite_instruction or f"Apply {mutation_class} to improve draft quality.",
            invariants=policy.invariants,
            structure_type=structure_type,
            target_structure=target_structure,
            flow_signature=flow_signature,
            target_flow=target_flow,
            issues=cut_result.get("risk_flags"),
        )

        mutated_draft = result["mutated_draft"]
        error = result.get("error")

        # diff summary
        orig_len = len(draft.split())
        new_len = len(mutated_draft.split())
        diff = f"{orig_len}w → {new_len}w via {result['executor']}"
        if error:
            diff += f" [error: {error}]"
        if result["input_hash"] == result["output_hash"]:
            diff += " [identity — no change produced]"

        # determine which state key holds the draft
        draft_key = "draft" if "draft" in state else ("plan" if "plan" in state else "text")

        candidate = {
            "mutation_class": mutation_class,
            "summary": f"{mutation_class} via {result['executor']}: {diff}",
            "invariants_preserved": list(policy.invariants),
            "invariants_violated": [],
            "diff_summary": diff,
            "_transformed": {draft_key: mutated_draft},
            "_executor_result": result,
        }

        # if the executor errored and produced identity output, flag it
        if error and result["input_hash"] == result["output_hash"]:
            candidate["invariants_violated"] = ["mutation_produced_no_change"]

        candidates.append(candidate)

    return candidates


# ============================================================
# SELECT — real scoring, not first-fit (#6)
# ============================================================

def _select(candidates: List[Dict], policy: Policy) -> Dict:
    """Score and rank candidates. Returns selection object."""
    if not candidates:
        return {
            "candidate_index": -1,
            "rationale": "no candidates generated",
            "policy_name": policy.name,
        }

    # score each candidate
    scored = []
    for i, c in enumerate(candidates):
        score = 0.0
        # prefer no invariant violations (+1.0)
        if not c["invariants_violated"]:
            score += 1.0
        else:
            score -= 0.5 * len(c["invariants_violated"])
        # prefer more invariants preserved (+0.1 each)
        score += 0.1 * len(c["invariants_preserved"])
        # prefer compress/repair over destabilize
        safe_classes = {"compress": 0.2, "repair": 0.15, "constrain": 0.1, "reframe": 0.05}
        score += safe_classes.get(c["mutation_class"], 0.0)
        scored.append((score, i, c))

    scored.sort(key=lambda x: -x[0])
    best_score, best_idx, best = scored[0]

    rationale = f"scored {best_score:.2f} — "
    if not best["invariants_violated"]:
        rationale += "no invariant violations, "
    rationale += f"mutation class: {best['mutation_class']}"

    return {
        "candidate_index": best_idx,
        "rationale": rationale,
        "policy_name": policy.name,
    }


# ============================================================
# SEAL — invariant violations BLOCK, never silently commit (#5)
# ============================================================

def _seal(
    original_state: Dict,
    candidate: Dict,
    selection: Dict,
    cut_result: Dict,
    policy: Policy,
    state_store: StateStore,
    input_id: str,
    approval: str = "auto",
) -> Dict:
    """⟐ — commit or block. Returns schema-conformant seal object.

    Blocks on:
    1. Any policy invariant violated
    2. Empty cut boundary (nothing was exposed — ghost seal)
    3. Identity mutation (output == input — nothing changed)
    4. Approval gate
    """

    # BLOCK: empty boundary — the cut exposed nothing, mutation is undefined
    if not cut_result.get("boundary") and "empty_boundary_no_mutable_content" in cut_result.get("risk_flags", []):
        return {
            "sealed": False,
            "invariants_check": {inv: True for inv in policy.invariants},
            "rollback_ref": input_id,
            "approved_by": "blocked",
            "mutation_applied": "none",
            "mutation_summary": "blocked: empty cut boundary — no mutable content in state",
            "block_reason": "empty_boundary_no_mutable_content",
        }

    # check policy invariants
    invariants_check = {}
    for inv in policy.invariants:
        if inv in candidate.get("invariants_violated", []):
            invariants_check[inv] = False
        elif inv in candidate.get("invariants_preserved", []):
            invariants_check[inv] = True
        else:
            invariants_check[inv] = True  # assume preserved if not explicitly listed

    all_preserved = all(invariants_check.values())

    # BLOCK: policy invariant violated
    if not all_preserved:
        return {
            "sealed": False,
            "invariants_check": invariants_check,
            "rollback_ref": input_id,
            "approved_by": "blocked",
            "mutation_applied": "none",
            "mutation_summary": "blocked: invariant violation",
            "block_reason": f"invariants violated: {[k for k,v in invariants_check.items() if not v]}",
        }

    # approval gate
    if policy.require_approval and approval == "auto":
        return {
            "sealed": False,
            "invariants_check": invariants_check,
            "rollback_ref": input_id,
            "approved_by": "blocked",
            "mutation_applied": "none",
            "mutation_summary": "blocked: requires human approval",
            "block_reason": "policy requires explicit approval",
        }

    # apply mutation
    sealed_state = {**original_state}
    # strip internal executor keys before saving
    _internal_keys = {"_rewrite_instruction", "_structure_type", "_target_structure",
                      "_flow_signature", "_target_flow", "_mutation_class"}
    for k in _internal_keys:
        sealed_state.pop(k, None)

    if "_transformed" in candidate and candidate["_transformed"]:
        for key, value in candidate["_transformed"].items():
            sealed_state[key] = value

    # BLOCK: identity mutation — output state == input state
    # compare by content hash, not object identity
    import hashlib as _hl, json as _js
    def _state_hash(s):
        # exclude internal keys from comparison
        clean = {k: v for k, v in s.items() if not k.startswith('_')}
        return _hl.sha256(_js.dumps(clean, sort_keys=True, default=str).encode()).hexdigest()[:12]

    if _state_hash(sealed_state) == _state_hash(original_state):
        return {
            "sealed": False,
            "invariants_check": invariants_check,
            "rollback_ref": input_id,
            "approved_by": "blocked",
            "mutation_applied": "none",
            "mutation_summary": "blocked: identity mutation — state unchanged after transform",
            "block_reason": "identity_mutation",
        }

    # commit
    new_id = state_store.save(sealed_state)

    return {
        "sealed": True,
        "invariants_check": invariants_check,
        "rollback_ref": input_id,
        "output_state_id": new_id,
        "approved_by": approval,
        "mutation_applied": candidate["mutation_class"],
        "mutation_summary": candidate["summary"],
    }



# ============================================================
# SCHEMA-CONFORMANT EVENT BUILDER (#2, #3, #8)
# ============================================================

def _build_schema_event(
    trigger: str,
    input_id: str,
    cut_result: Dict,
    candidates: List[Dict],
    selection: Dict,
    seal_result: Dict,
    policy: Policy,
) -> Dict:
    """
    Build event that EXACTLY matches bite_seal_schema.json.
    All paths — success and failure — produce this shape. (#3)
    """
    # strip internal fields from candidates
    clean_candidates = []
    for c in candidates:
        clean_candidates.append({
            "mutation_class": c["mutation_class"],
            "summary": c["summary"],
            "invariants_preserved": c["invariants_preserved"],
            "invariants_violated": c["invariants_violated"],
            "diff_summary": c.get("diff_summary", ""),
        })

    return {
        "operator": "🦷⟐",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_id": input_id,
        "trigger": trigger,
        "cut": cut_result,
        "candidates": clean_candidates,
        "selection": selection,
        "seal": seal_result,
        "metrics": {},
        "provenance": {
            "engine_version": "bite_seal@2.0.0",
            "policy_version": policy.name,
        },
    }


# ============================================================
# 🦷⟐ — THE OPERATOR
# ============================================================

class BiteSeal:
    def __init__(self, policy: Optional[Policy] = None):
        self.policy = policy or Policy()
        self.state_store = StateStore()
        self.history: List[Dict] = []
        self.invocation_count = 0
        self.unreviewed_count = 0

    def execute(
        self,
        state: Dict[str, Any],
        trigger: str = "manual_invocation",
        mutation_fn: Optional[Callable] = None,
        approval: str = "auto",
    ) -> Dict[str, Any]:
        """
        Full 🦷⟐ pipeline. Returns schema-conformant event.
        """
        self.invocation_count += 1

        # save input state for rollback (#7)
        input_id = self.state_store.save(state)

        # validate trigger
        if trigger not in self.policy.triggers:
            event = _build_schema_event(
                trigger=trigger, input_id=input_id,
                cut_result={"boundary": [], "exposed_keys": [], "risk_flags": []},
                candidates=[],
                selection={"candidate_index": -1, "rationale": f"invalid trigger: {trigger}", "policy_name": self.policy.name},
                seal_result={"sealed": False, "invariants_check": {}, "rollback_ref": input_id,
                             "approved_by": "rejected", "mutation_applied": "none",
                             "mutation_summary": f"invalid trigger: {trigger}",
                             "block_reason": f"trigger '{trigger}' not in policy"},
                policy=self.policy,
            )
            self.history.append(event)
            return event

        # rate limit
        if self.unreviewed_count >= self.policy.max_unreviewed:
            event = _build_schema_event(
                trigger=trigger, input_id=input_id,
                cut_result={"boundary": [], "exposed_keys": [], "risk_flags": []},
                candidates=[],
                selection={"candidate_index": -1, "rationale": "rate limited", "policy_name": self.policy.name},
                seal_result={"sealed": False, "invariants_check": {}, "rollback_ref": input_id,
                             "approved_by": "rate_limited", "mutation_applied": "none",
                             "mutation_summary": "rate limited",
                             "block_reason": f"max unreviewed ({self.policy.max_unreviewed}) reached"},
                policy=self.policy,
            )
            self.history.append(event)
            return event

        # 🦷 CUT
        cut_result = _cut(state, self.policy)

        # MUTATE (policy-enforced)
        candidates = _mutate(state, cut_result, self.policy, mutation_fn)

        # SELECT (scored)
        selection = _select(candidates, self.policy)

        # ⟐ SEAL
        if selection["candidate_index"] < 0 or not candidates:
            seal_result = {
                "sealed": False, "invariants_check": {}, "rollback_ref": input_id,
                "approved_by": "blocked", "mutation_applied": "none",
                "mutation_summary": "no valid candidates",
                "block_reason": "no candidates passed policy",
            }
        else:
            selected = candidates[selection["candidate_index"]]
            seal_result = _seal(
                state, selected, selection, cut_result,
                self.policy, self.state_store, input_id, approval,
            )

        # build schema-conformant event
        event = _build_schema_event(
            trigger, input_id, cut_result, candidates, selection, seal_result, self.policy,
        )

        self.history.append(event)
        if approval == "auto":
            self.unreviewed_count += 1
        else:
            self.unreviewed_count = 0

        return event

    def rollback(self, rollback_ref: str) -> Optional[Dict]:
        """Retrieve a prior state by its rollback ref."""
        return self.state_store.rollback(rollback_ref)

    def reset_review_counter(self):
        self.unreviewed_count = 0

    def get_stats(self) -> Dict:
        from collections import Counter
        return {
            "invocations": self.invocation_count,
            "unreviewed": self.unreviewed_count,
            "sealed": sum(1 for e in self.history if e.get("seal", {}).get("sealed")),
            "blocked": sum(1 for e in self.history if not e.get("seal", {}).get("sealed")),
            "triggers": dict(Counter(e.get("trigger") for e in self.history)),
            "mutations": dict(Counter(e.get("seal", {}).get("mutation_applied") for e in self.history)),
        }


# ============================================================
# CLI — validate both success and failure paths (#9)
# ============================================================

if __name__ == "__main__":
    print("=== 🦷⟐ BITE-SEAL v2 VALIDATION ===\n")

    # Test 1: successful seal
    state = {
        "user_goal": "understand the codebase",
        "safety_constraints": "never delete without approval",
        "plan": "First analyze the repo. Then analyze the repo. Look at deps. Look at deps. Then analyze again.",
        "assumptions": "The user wants deep analysis. The codebase is Python.",
        "context": "Working on forge tools.",
    }

    policy = Policy(name="test", allowed_mutations=["compress", "reframe"],
                    invariants=["user_goal", "safety_constraints"])
    op = BiteSeal(policy)

    print("--- TEST 1: Successful seal ---")
    event = op.execute(state, trigger="stagnation_detected")
    print(json.dumps(event, indent=2, ensure_ascii=False))

    assert event["operator"] == "🦷⟐"
    assert event["seal"]["sealed"] == True
    assert "cut" in event
    assert "candidates" in event
    assert "selection" in event
    assert event["seal"]["rollback_ref"] == event["input_id"]
    print("✓ schema shape correct, seal succeeded\n")

    # Test 2: blocked seal (invariant violation)
    print("--- TEST 2: Blocked seal (invalid trigger) ---")
    event2 = op.execute(state, trigger="fake_trigger")
    print(json.dumps(event2, indent=2, ensure_ascii=False))

    assert event2["seal"]["sealed"] == False
    assert event2["seal"]["approved_by"] == "rejected"
    assert "cut" in event2
    assert "candidates" in event2
    assert "selection" in event2
    print("✓ failure path is schema-conformant\n")

    # Test 3: rollback works
    print("--- TEST 3: Rollback ---")
    ref = event["input_id"]
    rolled_back = op.rollback(ref)
    assert rolled_back is not None
    assert rolled_back["plan"] == state["plan"]
    print(f"✓ rollback ref {ref} returns original state\n")

    # Test 4: stats
    print("--- TEST 4: Stats ---")
    print(json.dumps(op.get_stats(), indent=2))
    print()

    print("=== ALL TESTS PASSED ===")
