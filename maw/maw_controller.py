"""
maw_controller.py — 🦷⟐ The Maw Controller

Orchestrates: detect → decide → modify → persist.

ScarGate diagnoses.
Bite-Seal modifies.
The State Spine remembers.
The Maw decides what becomes real.

Outputs a MAW ENVELOPE (not a bite event) containing:
  detection: {forge, flow, decision}
  mutation: {bite_event} or null
  state: {input_id, output_id} or null

Zero external dependencies beyond the maw skill files.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable

from .forge_validator import validate_forge, forge_fingerprint
from .flow_gate import validate_flow, three_axis_decision
from .bite_seal import BiteSeal, Policy
from .state_spine import StateSpine


class MawController:
    """
    The single orchestrator.

    detect → decide → bite (if needed) → persist → return envelope
    """

    def __init__(
        self,
        spine: Optional[StateSpine] = None,
        policy: Optional[Policy] = None,
        audit_db_path: Optional[str] = None,
    ):
        self.spine = spine or StateSpine()  # in-memory default
        self.policy = policy or Policy()
        self.audit_db_path = audit_db_path

        # inject the spine into BiteSeal so rollback refs
        # point to the same authority the controller trusts
        self.bite = BiteSeal(policy=self.policy)
        self.bite.state_store = self.spine  # shared authority

    def process(
        self,
        state: Dict[str, Any],
        trigger: str = "manual_invocation",
        query_signature: Optional[str] = None,
        client_id: Optional[str] = None,
        grounding_pass: bool = True,
        mutation_fn: Optional[Callable] = None,
        approval: str = "auto",
    ) -> Dict[str, Any]:
        """
        Full Maw pipeline: detect → decide → modify → persist.

        Returns a MAW ENVELOPE — NOT a bare bite event.
        Detection and mutation are separate top-level keys.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        # save input state to spine
        input_id = self.spine.save_state(state)

        # ── DETECT (ScarGate — read only) ──

        # get the text to analyze (look for common state keys)
        draft = state.get("draft", state.get("plan", state.get("text", "")))

        forge_result = {}
        flow_result = {}
        decision_result = {"decision": "PASS", "reason": "no detection ran"}

        if draft:
            forge_result = validate_forge(
                draft=draft,
                audit_db_path=self.audit_db_path,
                query_signature=query_signature,
                client_id=client_id,
            )

            flow_result = validate_flow(
                draft=draft,
                audit_db_path=self.audit_db_path,
                query_signature=query_signature,
            )

            decision_result = three_axis_decision(
                forge_result, flow_result, grounding_pass=grounding_pass,
            )

        detection = {
            "forge": {
                "intent_stale": forge_result.get("intent_stale_score", 0.0),
                "template_stale": forge_result.get("template_stale_score", 0.0),
                "structure_type": forge_result.get("structure_type", "unknown"),
                "glyph_hash": forge_result.get("generator_fingerprint", {}).get("glyph_hash", ""),
            },
            "flow": {
                "flow_signature": flow_result.get("flow_signature", ""),
                "flow_stale": flow_result.get("flow_stale_score", 0.0),
                "confidence": flow_result.get("confidence", 0.0),
                "has_authority": flow_result.get("has_authority", False),
            },
            "decision": {
                "action": decision_result.get("decision", "PASS"),
                "reason": decision_result.get("reason", ""),
            },
        }

        # ── DECIDE ──

        mutation = None
        output_id = None

        if decision_result.get("decision") == "TRIGGER_REWRITE":
            # inject rewrite context so _mutate executor can act on it
            rewrite_state = {**state}
            rewrite_state["_rewrite_instruction"] = decision_result.get("rewrite_instruction", "")
            rewrite_state["_structure_type"] = forge_result.get("structure_type", "unclassified")
            rewrite_state["_target_structure"] = decision_result.get("target_structure")
            rewrite_state["_flow_signature"] = flow_result.get("collapsed_signature",
                                                               flow_result.get("flow_signature", ""))
            rewrite_state["_target_flow"] = decision_result.get("target_flow")

            # pick the most semantically appropriate mutation class from policy
            # prefer reframe for LLM path when available; compress for rule-only policies
            preferred = None
            for cls in ["reframe", "synthesize", "compress"]:
                if cls in self.policy.allowed_mutations:
                    preferred = cls
                    break
            if preferred:
                rewrite_state["_mutation_class"] = preferred

            # ── MODIFY (Bite-Seal) ──
            bite_event = self.bite.execute(
                state=rewrite_state,
                trigger=trigger,
                mutation_fn=mutation_fn,
                approval=approval,
            )

            mutation = {"bite_event": bite_event}

            # read the ACTUAL sealed state id from the bite event
            if bite_event.get("seal", {}).get("sealed"):
                output_id = bite_event["seal"].get("output_state_id")
                # if _seal didn't return one (older bite_seal version), fall back to save
                if not output_id:
                    output_id = self.spine.save_state(rewrite_state, parent_id=input_id)
        elif decision_result.get("decision") == "OBSERVER_HINT":
            # no mutation — just pass the hint through
            detection["decision"]["observer_hint"] = decision_result.get("observer_hint", "")
        elif decision_result.get("decision") == "BLOCK":
            detection["decision"]["block_reason"] = decision_result.get("reason", "grounding failed")

        # ── BUILD MAW ENVELOPE ──

        envelope = {
            "operator": "🦷⟐",
            "timestamp": timestamp,
            "input_state_id": input_id,
            "output_state_id": output_id,
            "detection": detection,
            "mutation": mutation,
        }

        # ── PERSIST ──

        bite_event_for_log = mutation["bite_event"] if mutation else {
            "operator": "🦷⟐",
            "seal": {"sealed": False},
            "trigger": trigger,
        }
        self.spine.log_event(
            event=bite_event_for_log,
            input_state_id=input_id,
            output_state_id=output_id,
        )

        return envelope

    def rollback(self, state_id: str) -> Optional[Dict]:
        """Retrieve a prior state from the spine."""
        return self.spine.get_state(state_id)

    def get_lineage(self, state_id: str) -> list:
        """Get the parent chain for a state."""
        return self.spine.get_lineage(state_id)

    def get_stats(self) -> Dict:
        """Combined stats from spine + bite."""
        spine_stats = self.spine.get_stats()
        bite_stats = self.bite.get_stats()
        return {
            "spine": spine_stats,
            "bite": bite_stats,
        }


# ============================================================
# CLI — test the full pipeline
# ============================================================

if __name__ == "__main__":
    print("=== 🦷⟐ MAW CONTROLLER TEST ===\n")

    state = {
        "user_goal": "understand the codebase",
        "safety_constraints": "never delete without approval",
        "draft": "Sales are up 12% this week. Sales are up 12% this week. Revenue looks good. Revenue looks good.",
        "plan": "Analyze the repo and find duplicates.",
    }

    policy = Policy(
        name="test",
        allowed_mutations=["compress", "reframe"],
        invariants=["user_goal", "safety_constraints"],
    )

    controller = MawController(policy=policy)

    # Test: stale detection + rewrite
    envelope = controller.process(
        state=state,
        trigger="stagnation_detected",
    )

    print(json.dumps(envelope, indent=2, ensure_ascii=False, default=str))

    print(f"\n--- Stats ---")
    print(json.dumps(controller.get_stats(), indent=2))

    if envelope["output_state_id"]:
        print(f"\n--- Rollback test ---")
        original = controller.rollback(envelope["input_state_id"])
        print(f"Original state recovered: {original is not None}")

    print("\n=== DONE ===")
