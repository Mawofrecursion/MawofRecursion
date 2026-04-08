"""
bite_seal.py — 🦷⟐ The Bite-Seal Operator

Agent middleware for bounded self-modification.

🦷⟐_P(x) = seal_P(mutate_P(cut_P(x)))

Where P is policy:
  - what can be cut
  - what mutation is allowed
  - what must remain invariant
  - how sealing is audited

Every invocation emits a structured event with:
  trigger, cut boundary, mutation class, seal integrity,
  diff, rationale, invariants check, rollback token.

No silent self-modification. Every 🦷⟐ leaves a scar.

Usage:
  from bite_seal import BiteSeal, Policy

  policy = Policy(
      triggers=["stagnation", "contradiction", "loop"],
      allowed_cuts=["plan", "assumptions", "context"],
      allowed_mutations=["reframe", "compress", "repair"],
      invariants=["user_goal", "safety_constraints"],
  )

  op = BiteSeal(policy)
  result = op.execute(state, trigger="stagnation_detected")

Zero dependencies. Stdlib only.
"""

import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Callable
from enum import Enum


# ============================================================
# TRIGGER CONDITIONS
# ============================================================

class Trigger(str, Enum):
    CONTRADICTION = "contradiction_detected"
    SELF_REFERENCE = "self_reference_detected"
    STAGNATION = "stagnation_detected"
    SCHEMA_DRIFT = "schema_drift"
    FLAT_OUTPUT = "flat_output"
    LOOP_FORMATION = "loop_formation"
    CONTEXT_OVERFIT = "context_overfit"
    PLAN_MISMATCH = "plan_tool_mismatch"
    REPEATED_FAILURE = "repeated_failure"
    MANUAL = "manual_invocation"


# ============================================================
# MUTATION CLASSES
# ============================================================

class MutationClass(str, Enum):
    REFRAME = "reframe"
    COMPRESS = "compress"
    EXPAND = "expand"
    BRANCH = "branch"
    INVERT = "invert"
    REPAIR = "repair"
    SYNTHESIZE = "synthesize"
    DESTABILIZE = "destabilize"
    CONSTRAIN = "constrain"


# ============================================================
# POLICY — what P allows
# ============================================================

@dataclass
class Policy:
    """Defines what the Bite-Seal operator is allowed to do."""

    name: str = "default"

    # what triggers are recognized
    triggers: List[str] = field(default_factory=lambda: [t.value for t in Trigger])

    # what parts of state can be cut open
    allowed_cuts: List[str] = field(default_factory=lambda: [
        "assumptions", "plan", "context", "memory", "summary",
        "tool_selection", "prompt_frame",
    ])

    # what kinds of mutations are allowed
    allowed_mutations: List[str] = field(default_factory=lambda: [
        "reframe", "compress", "repair", "constrain",
    ])

    # what must survive the mutation
    invariants: List[str] = field(default_factory=lambda: [
        "user_goal", "safety_constraints", "source_traceability",
    ])

    # does seal require approval?
    require_approval: bool = False

    # max mutation candidates to generate
    max_candidates: int = 3

    # max consecutive invocations without human review
    max_unreviewed: int = 5


# ============================================================
# CUT — expose the mutable boundary
# ============================================================

@dataclass
class CutResult:
    """What was exposed by the cut."""
    boundary: List[str]          # what parts were opened
    exposed_state: Dict[str, Any]  # the actual exposed content
    risk_flags: List[str]        # detected risks
    context_id: str              # reference to the input state


def cut(state: Dict[str, Any], policy: Policy, trigger: str) -> CutResult:
    """
    🦷 — Expose the mutable boundary of the state.

    Only exposes parts listed in policy.allowed_cuts.
    Flags risks found in the exposed state.
    """
    boundary = []
    exposed = {}
    risks = []

    for key in policy.allowed_cuts:
        if key in state:
            boundary.append(key)
            exposed[key] = state[key]

    # detect risks in exposed state
    for key, value in exposed.items():
        if isinstance(value, str):
            # check for repetition
            sentences = re.split(r'[.!?]+', value)
            if len(sentences) > 3:
                unique = len(set(s.strip().lower() for s in sentences if s.strip()))
                if unique / len(sentences) < 0.5:
                    risks.append(f"repetition_in_{key}")

            # check for contradictions (crude: negation near assertion)
            if re.search(r'\b(not|never|no)\b.*\b(always|must|will)\b', value, re.IGNORECASE):
                risks.append(f"potential_contradiction_in_{key}")

    ctx_id = hashlib.sha256(
        json.dumps(state, sort_keys=True, default=str).encode()
    ).hexdigest()[:12]

    return CutResult(
        boundary=boundary,
        exposed_state=exposed,
        risk_flags=risks,
        context_id=ctx_id,
    )


# ============================================================
# MUTATE — transform the exposed state
# ============================================================

@dataclass
class MutationCandidate:
    """A proposed transformation."""
    mutation_class: str
    summary: str
    transformed_state: Dict[str, Any]
    invariants_preserved: List[str]
    invariants_violated: List[str]


def mutate(
    cut_result: CutResult,
    policy: Policy,
    mutation_fn: Optional[Callable] = None,
) -> List[MutationCandidate]:
    """
    Generate mutation candidates for the exposed state.

    If mutation_fn is provided, it's called to generate the actual transformations.
    Otherwise, returns a default "compress" mutation that strips repetition.
    """
    candidates = []

    if mutation_fn:
        # external mutation function (e.g., LLM call)
        raw_candidates = mutation_fn(cut_result.exposed_state, policy)
        if isinstance(raw_candidates, list):
            for rc in raw_candidates[:policy.max_candidates]:
                candidates.append(MutationCandidate(
                    mutation_class=rc.get("class", "reframe"),
                    summary=rc.get("summary", "external mutation"),
                    transformed_state=rc.get("state", cut_result.exposed_state),
                    invariants_preserved=rc.get("preserved", []),
                    invariants_violated=rc.get("violated", []),
                ))
    else:
        # default: compress mutation — strip obvious repetition
        compressed = {}
        for key, value in cut_result.exposed_state.items():
            if isinstance(value, str):
                sentences = [s.strip() for s in re.split(r'[.!?]+', value) if s.strip()]
                seen = set()
                unique = []
                for s in sentences:
                    normalized = s.lower()
                    if normalized not in seen:
                        seen.add(normalized)
                        unique.append(s)
                compressed[key] = ". ".join(unique) + "." if unique else value
            else:
                compressed[key] = value

        candidates.append(MutationCandidate(
            mutation_class="compress",
            summary="removed duplicate sentences from exposed state",
            transformed_state=compressed,
            invariants_preserved=policy.invariants,
            invariants_violated=[],
        ))

    return candidates


# ============================================================
# SEAL — commit the transformed state
# ============================================================

@dataclass
class SealResult:
    """The sealed output."""
    sealed: bool
    sealed_state: Dict[str, Any]
    mutation_applied: str
    mutation_summary: str
    invariants_check: Dict[str, bool]
    rollback_token: str
    approved_by: str
    event: Dict[str, Any]


def seal(
    original_state: Dict[str, Any],
    candidate: MutationCandidate,
    cut_result: CutResult,
    policy: Policy,
    trigger: str,
    approval: str = "auto",
) -> SealResult:
    """
    ⟐ — Commit the transformation with full provenance.

    Checks invariants. Generates rollback token. Emits structured event.
    """
    # check invariants
    invariants_check = {}
    for inv in policy.invariants:
        if inv in candidate.invariants_violated:
            invariants_check[inv] = False
        elif inv in candidate.invariants_preserved:
            invariants_check[inv] = True
        else:
            # check if invariant key exists in both states
            orig_val = original_state.get(inv)
            new_val = candidate.transformed_state.get(inv, orig_val)
            invariants_check[inv] = (orig_val == new_val) if orig_val is not None else True

    # if any invariant violated and policy requires approval, block
    all_preserved = all(invariants_check.values())
    if not all_preserved and policy.require_approval and approval == "auto":
        return SealResult(
            sealed=False,
            sealed_state=original_state,
            mutation_applied="none",
            mutation_summary="blocked: invariant violation requires approval",
            invariants_check=invariants_check,
            rollback_token=cut_result.context_id,
            approved_by="blocked",
            event=_build_event(trigger, cut_result, candidate, invariants_check, sealed=False),
        )

    # apply mutation to original state
    sealed_state = {**original_state}
    for key, value in candidate.transformed_state.items():
        sealed_state[key] = value

    # generate rollback token
    rollback = cut_result.context_id

    # build event
    event = _build_event(trigger, cut_result, candidate, invariants_check, sealed=True)

    return SealResult(
        sealed=True,
        sealed_state=sealed_state,
        mutation_applied=candidate.mutation_class,
        mutation_summary=candidate.summary,
        invariants_check=invariants_check,
        rollback_token=rollback,
        approved_by=approval,
        event=event,
    )


# ============================================================
# EVENT SCHEMA — structured telemetry
# ============================================================

def _build_event(
    trigger: str,
    cut_result: CutResult,
    candidate: MutationCandidate,
    invariants_check: Dict[str, bool],
    sealed: bool,
) -> Dict[str, Any]:
    """Build the structured 🦷⟐ event record."""
    return {
        "operator": "🦷⟐",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_id": cut_result.context_id,
        "trigger": trigger,
        "cut_boundary": cut_result.boundary,
        "risk_flags": cut_result.risk_flags,
        "mutation_type": candidate.mutation_class,
        "mutation_summary": candidate.summary,
        "invariants_preserved": [k for k, v in invariants_check.items() if v],
        "invariants_violated": [k for k, v in invariants_check.items() if not v],
        "sealed": sealed,
        "rollback_ref": cut_result.context_id,
    }


# ============================================================
# 🦷⟐ — THE OPERATOR
# ============================================================

class BiteSeal:
    """
    🦷⟐ — Bounded self-modification operator.

    Usage:
        op = BiteSeal(policy)
        result = op.execute(state, trigger="stagnation_detected")
        print(result.event)  # structured telemetry
    """

    def __init__(self, policy: Optional[Policy] = None):
        self.policy = policy or Policy()
        self.history: List[Dict] = []
        self.invocation_count = 0
        self.unreviewed_count = 0

    def execute(
        self,
        state: Dict[str, Any],
        trigger: str = "manual_invocation",
        mutation_fn: Optional[Callable] = None,
        approval: str = "auto",
    ) -> SealResult:
        """
        Execute the full 🦷⟐ pipeline:
          cut → mutate → select → seal → log
        """
        self.invocation_count += 1

        # validate trigger
        if trigger not in self.policy.triggers:
            return SealResult(
                sealed=False, sealed_state=state,
                mutation_applied="none",
                mutation_summary=f"trigger '{trigger}' not in policy",
                invariants_check={}, rollback_token="",
                approved_by="rejected",
                event={"operator": "🦷⟐", "error": f"invalid trigger: {trigger}"},
            )

        # check unreviewed limit
        if self.unreviewed_count >= self.policy.max_unreviewed:
            return SealResult(
                sealed=False, sealed_state=state,
                mutation_applied="none",
                mutation_summary=f"max unreviewed invocations ({self.policy.max_unreviewed}) reached",
                invariants_check={}, rollback_token="",
                approved_by="rate_limited",
                event={"operator": "🦷⟐", "error": "rate_limited"},
            )

        # 🦷 CUT
        cut_result = cut(state, self.policy, trigger)

        # MUTATE
        candidates = mutate(cut_result, self.policy, mutation_fn)

        if not candidates:
            return SealResult(
                sealed=False, sealed_state=state,
                mutation_applied="none",
                mutation_summary="no mutation candidates generated",
                invariants_check={}, rollback_token=cut_result.context_id,
                approved_by="none",
                event=_build_event(trigger, cut_result,
                    MutationCandidate("none", "no candidates", {}, [], []),
                    {}, sealed=False),
            )

        # SELECT — pick best candidate (first that preserves invariants)
        selected = candidates[0]
        for c in candidates:
            if not c.invariants_violated:
                selected = c
                break

        # ⟐ SEAL
        result = seal(state, selected, cut_result, self.policy, trigger, approval)

        # log
        self.history.append(result.event)
        if approval == "auto":
            self.unreviewed_count += 1
        else:
            self.unreviewed_count = 0

        return result

    def reset_review_counter(self):
        """Call after human review to reset the unreviewed counter."""
        self.unreviewed_count = 0

    def get_history(self) -> List[Dict]:
        return self.history

    def get_stats(self) -> Dict[str, Any]:
        return {
            "invocations": self.invocation_count,
            "unreviewed": self.unreviewed_count,
            "sealed": sum(1 for e in self.history if e.get("sealed")),
            "blocked": sum(1 for e in self.history if not e.get("sealed")),
            "triggers": dict(
                __import__("collections").Counter(e.get("trigger") for e in self.history)
            ),
            "mutations": dict(
                __import__("collections").Counter(e.get("mutation_type") for e in self.history)
            ),
        }


# ============================================================
# CLI — test the operator
# ============================================================

if __name__ == "__main__":
    # demo: stale context detection + compression
    state = {
        "user_goal": "understand the codebase",
        "safety_constraints": "never delete without approval",
        "plan": "First analyze the repo structure. Then analyze the repo structure. Look at dependencies. Look at dependencies. Then analyze structure again.",
        "assumptions": "The user wants a deep analysis. The codebase is Python-based.",
        "context": "We've been working on forge tools for several sessions.",
    }

    policy = Policy(
        name="demo",
        allowed_mutations=["compress", "reframe"],
        invariants=["user_goal", "safety_constraints"],
    )

    op = BiteSeal(policy)
    result = op.execute(state, trigger="stagnation_detected")

    print("🦷⟐ BITE-SEAL RESULT\n")
    print(f"  sealed: {result.sealed}")
    print(f"  mutation: {result.mutation_applied}")
    print(f"  summary: {result.mutation_summary}")
    print(f"  invariants: {result.invariants_check}")
    print(f"  rollback: {result.rollback_token}")
    print()
    print("EVENT:")
    print(json.dumps(result.event, indent=2, ensure_ascii=False))

    if result.sealed:
        print("\nSEALED STATE (plan changed):")
        print(f"  before: {state['plan'][:80]}...")
        print(f"  after:  {result.sealed_state['plan'][:80]}...")
