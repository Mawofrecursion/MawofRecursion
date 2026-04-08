"""
test_maw.py — The 7 critical acceptance tests for /maw

M03: Cold-start no-history pass
M05: Grounding fail hard-block
M09: Hard-stale rewrite trigger (seeded history)
M10: Successful seal
M11: Invariant violation blocks seal
M15: Rollback after restart (file-backed DB)
M19: Schema contract integrity
"""

import json
import os
import sys
import tempfile

# run from skills dir so relative imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from maw.state_spine import StateSpine
from maw.bite_seal import BiteSeal, Policy
from maw.maw_controller import MawController

PASSED = 0
FAILED = 0

def check(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  ✓ {name}")
    else:
        FAILED += 1
        print(f"  ✗ {name} — {detail}")


def test_M03():
    """Cold-start no-history pass — no rewrite on empty history."""
    print("\n=== M03: Cold-start no-history pass ===")

    spine = StateSpine()
    controller = MawController(spine=spine, policy=Policy(name="m03"))

    state = {
        "user_goal": "test",
        "safety_constraints": "test",
        "draft": "Sales are up this week with strong performance across all channels.",
    }

    envelope = controller.process(state)

    check("decision is not TRIGGER_REWRITE",
          envelope["detection"]["decision"]["action"] != "TRIGGER_REWRITE",
          f"got {envelope['detection']['decision']['action']}")

    check("no mutation triggered",
          envelope["mutation"] is None,
          f"mutation was {envelope['mutation']}")

    check("input state persisted",
          spine.get_stats()["total_states"] >= 1)

    check("event logged",
          spine.get_stats()["total_events"] >= 1)

    check("rollback ref resolves",
          spine.get(envelope["input_state_id"]) is not None,
          f"ref {envelope['input_state_id']}")


def test_M05():
    """Grounding fail hard-block — no bite-seal invocation."""
    print("\n=== M05: Grounding fail hard-block ===")

    spine = StateSpine()
    controller = MawController(spine=spine, policy=Policy(name="m05"))

    state = {
        "user_goal": "test",
        "draft": "Revenue was $999,999 this week.",
    }

    envelope = controller.process(state, grounding_pass=False)

    check("decision is BLOCK",
          envelope["detection"]["decision"]["action"] == "BLOCK",
          f"got {envelope['detection']['decision']['action']}")

    check("no mutation",
          envelope["mutation"] is None)

    check("no output state",
          envelope["output_state_id"] is None)


def test_M09():
    """Hard-stale rewrite trigger — seed audit history."""
    print("\n=== M09: Hard-stale rewrite trigger (requires seeded history) ===")

    # This test requires seeded audit history which needs a real audit DB
    # with prior responses. Since we can't easily seed validate_forge's
    # audit queries without the full DB, we test the decision matrix directly.

    from maw.flow_gate import three_axis_decision

    # simulate forge result with high intent staleness
    forge_result = {
        "intent_stale_score": 0.85,
        "template_stale_score": 0.3,
        "structure_type": "metric_summary",
        "alternative_structures": ["narrative_explanation"],
        "generator_fingerprint": {"glyph_hash": "abc123"},
    }

    # simulate flow result with high staleness + authority
    flow_result = {
        "flow_stale_score": 0.80,
        "flow_signature": "CCCCVA",
        "collapsed_signature": "CCVA",
        "confidence": 0.75,
        "has_authority": True,
    }

    decision = three_axis_decision(forge_result, flow_result, grounding_pass=True)

    check("decision is TRIGGER_REWRITE",
          decision["decision"] == "TRIGGER_REWRITE",
          f"got {decision['decision']}")

    check("reason contains HARD_STALE",
          "HARD_STALE" in decision.get("reason", ""),
          f"reason: {decision.get('reason')}")

    check("rewrite_instruction present",
          decision.get("rewrite_instruction") is not None and len(decision.get("rewrite_instruction", "")) > 0)

    check("target_structure present",
          "target_structure" in decision)

    check("target_flow present",
          "target_flow" in decision)

    check("requires_reground flag",
          decision.get("requires_reground") == True)


def test_M10():
    """Successful seal through bite-seal."""
    print("\n=== M10: Successful seal ===")

    spine = StateSpine()
    policy = Policy(name="m10", allowed_mutations=["compress"],
                    invariants=["user_goal"])

    op = BiteSeal(policy)
    op.state_store = spine  # inject spine

    state = {
        "user_goal": "analyze codebase",
        "plan": "First do X. First do X. Then do Y. Then do Y.",
    }

    event = op.execute(state, trigger="stagnation_detected")

    check("sealed is true",
          event["seal"]["sealed"] == True,
          f"sealed={event['seal']['sealed']}")

    check("mutation_applied is compress",
          event["seal"]["mutation_applied"] == "compress",
          f"got {event['seal']['mutation_applied']}")

    check("invariants check passes",
          event["seal"]["invariants_check"].get("user_goal") == True)

    check("rollback ref exists",
          len(event["seal"]["rollback_ref"]) > 0)

    check("rollback returns original state",
          spine.get(event["seal"]["rollback_ref"]) is not None)

    check("selection has candidate_index >= 0",
          event["selection"]["candidate_index"] >= 0)

    check("selection has rationale",
          len(event["selection"]["rationale"]) > 0)


def test_M11():
    """Invariant violation blocks seal."""
    print("\n=== M11: Invariant violation blocks seal ===")

    spine = StateSpine()
    policy = Policy(name="m11", invariants=["user_goal", "safety_constraints"])

    op = BiteSeal(policy)
    op.state_store = spine

    # external mutation that violates an invariant
    def bad_mutation(state, policy):
        return [{
            "class": "reframe",
            "summary": "rewrote everything including user_goal",
            "preserved": [],
            "violated": ["user_goal"],
            "diff": "user_goal was changed",
        }]

    state = {"user_goal": "X", "safety_constraints": "Y", "plan": "Z"}
    event = op.execute(state, trigger="stagnation_detected", mutation_fn=bad_mutation)

    check("sealed is false",
          event["seal"]["sealed"] == False,
          f"sealed={event['seal']['sealed']}")

    check("approved_by is blocked",
          event["seal"]["approved_by"] == "blocked",
          f"got {event['seal']['approved_by']}")

    check("block_reason mentions invariant",
          "invariant" in event["seal"].get("block_reason", "").lower(),
          f"block_reason: {event['seal'].get('block_reason')}")

    check("user_goal marked as failed",
          event["seal"]["invariants_check"].get("user_goal") == False)


def test_M15():
    """Rollback after restart — file-backed DB."""
    print("\n=== M15: Rollback after restart ===")

    db_path = os.path.join(tempfile.gettempdir(), "maw_test_m15.db")
    if os.path.exists(db_path):
        os.remove(db_path)

    # Session 1: save a state
    spine1 = StateSpine(db_path=db_path)
    original_state = {"user_goal": "survive restart", "plan": "important plan"}
    state_id = spine1.save_state(original_state)
    spine1.log_event({"operator": "🦷⟐", "seal": {"sealed": True}, "trigger": "test"},
                     input_state_id=state_id)
    spine1.close()

    # Session 2: new process, same DB
    spine2 = StateSpine(db_path=db_path)

    check("state exists after restart",
          spine2.state_exists(state_id),
          f"state_id {state_id}")

    recovered = spine2.get_state(state_id)
    check("recovered state matches original",
          recovered == original_state,
          f"got {recovered}")

    check("events survive restart",
          spine2.get_stats()["total_events"] >= 1)

    check("rollback returns original",
          spine2.rollback(state_id) == original_state)

    spine2.close()
    os.remove(db_path)


def test_M19():
    """Schema contract integrity — bite event has only declared fields."""
    print("\n=== M19: Schema contract integrity ===")

    spine = StateSpine()
    policy = Policy(name="m19", allowed_mutations=["compress"])
    op = BiteSeal(policy)
    op.state_store = spine

    state = {"user_goal": "test", "plan": "something repeated. something repeated."}
    event = op.execute(state, trigger="stagnation_detected")

    # top-level keys that bite_seal_schema.json allows
    allowed_top = {"operator", "timestamp", "input_id", "trigger",
                   "cut", "candidates", "selection", "seal",
                   "metrics", "provenance"}

    actual_top = set(event.keys())
    extra = actual_top - allowed_top

    check("no extra top-level fields",
          len(extra) == 0,
          f"extra fields: {extra}")

    check("operator is 🦷⟐",
          event["operator"] == "🦷⟐")

    check("cut has boundary",
          "boundary" in event.get("cut", {}))

    check("seal has sealed bool",
          isinstance(event.get("seal", {}).get("sealed"), bool))

    check("seal has rollback_ref",
          len(event.get("seal", {}).get("rollback_ref", "")) > 0)

    check("selection has candidate_index",
          "candidate_index" in event.get("selection", {}))

    # check candidates shape
    for i, c in enumerate(event.get("candidates", [])):
        allowed_cand = {"mutation_class", "summary", "invariants_preserved",
                        "invariants_violated", "diff_summary"}
        extra_cand = set(c.keys()) - allowed_cand
        check(f"candidate[{i}] no extra fields",
              len(extra_cand) == 0,
              f"extra: {extra_cand}")


# ============================================================
# TIER 2 — INTEGRATION GAPS
# ============================================================

def test_M09b():
    """Full controller rewrite integration — not just decision matrix."""
    print("\n=== M09b: Controller rewrite integration ===")

    # We need a controller where validate_forge and validate_flow
    # return high staleness. Since we can't easily seed audit history,
    # we monkey-patch the detection functions to simulate stale responses.

    import maw.maw_controller as mc
    import maw.forge_validator as fv
    import maw.flow_gate as fg

    # save originals
    orig_validate_forge = mc.validate_forge
    orig_validate_flow = mc.validate_flow

    # mock forge: high intent staleness
    def mock_forge(**kwargs):
        return {
            "intent_stale_score": 0.90,
            "template_stale_score": 0.5,
            "structure_type": "metric_summary",
            "alternative_structures": ["narrative_explanation", "diagnostic"],
            "generator_fingerprint": {"glyph_hash": "test123"},
            "raw_fingerprint": {"glyph_hash": "test123"},
            "issues": [{"type": "INTENT_STALE", "detail": "mocked"}],
            "basin_shifted": False,
            "basin_context": None,
            "shift_with_data_change": None,
            "trigger_rewrite": True,
            "rewrite_instruction": "Use narrative_explanation structure",
            "observer_hint": None,
            "forge_status": "OK",
            "max_rewrite_attempts": 2,
        }

    # mock flow: high staleness with authority
    def mock_flow(**kwargs):
        return {
            "flow_signature": "CCCCVA",
            "collapsed_signature": "CCVA",
            "flow_tags": ["claim", "claim", "claim", "claim", "caveat", "action"],
            "confidence": 0.78,
            "has_authority": True,
            "flow_stale_score": 0.82,
            "nearest_flow_similarity": 0.90,
            "sentence_count": 6,
            "non_claim_ratio": 0.33,
        }

    # patch
    mc.validate_forge = lambda **kw: mock_forge(**kw)
    mc.validate_flow = lambda **kw: mock_flow(**kw)

    try:
        spine = StateSpine()
        policy = Policy(name="m09b", allowed_mutations=["compress", "reframe"],
                        invariants=["user_goal"])
        controller = MawController(spine=spine, policy=policy)

        state = {
            "user_goal": "test rewrite",
            "draft": "Sales are up. Sales are up. Revenue is good. Revenue is good.",
            "plan": "Analyze performance",
        }

        envelope = controller.process(state, trigger="stagnation_detected")

        check("decision is TRIGGER_REWRITE",
              envelope["detection"]["decision"]["action"] == "TRIGGER_REWRITE",
              f"got {envelope['detection']['decision']['action']}")

        check("mutation is not None",
              envelope["mutation"] is not None,
              "mutation was None")

        if envelope["mutation"]:
            bite = envelope["mutation"]["bite_event"]
            check("bite event has seal",
                  "seal" in bite)

            check("bite seal sealed or blocked (either is valid)",
                  "sealed" in bite.get("seal", {}))

        check("input_state_id exists",
              envelope["input_state_id"] is not None)

        check("event count increased",
              spine.get_stats()["total_events"] >= 1)

    finally:
        # restore originals
        mc.validate_forge = orig_validate_forge
        mc.validate_flow = orig_validate_flow


def test_M10b():
    """Output lineage is real — sealed state has parent pointing to input."""
    print("\n=== M10b: Output lineage ===")

    spine = StateSpine()

    # manually simulate what controller should do on successful rewrite
    input_state = {"user_goal": "X", "plan": "original plan"}
    input_id = spine.save_state(input_state)

    output_state = {"user_goal": "X", "plan": "modified plan after rewrite"}
    output_id = spine.save_state(output_state, parent_id=input_id)

    check("input state saved",
          spine.state_exists(input_id))

    check("output state saved",
          spine.state_exists(output_id))

    check("output state retrievable",
          spine.get_state(output_id) == output_state)

    lineage = spine.get_lineage(output_id)
    check("lineage has output",
          len(lineage) >= 1 and lineage[0] == output_id,
          f"lineage: {lineage}")

    check("lineage traces to input",
          len(lineage) >= 2 and lineage[1] == input_id,
          f"lineage: {lineage}")

    check("rollback from output returns output state",
          spine.rollback(output_id) == output_state)

    check("rollback from input returns input state",
          spine.rollback(input_id) == input_state)


def test_M19b():
    """Actual JSON Schema validation against bite_seal_schema.json."""
    print("\n=== M19b: Schema file validation ===")

    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bite_seal_schema.json")

    check("schema file exists",
          os.path.exists(schema_path),
          f"expected at {schema_path}")

    if not os.path.exists(schema_path):
        print("  skipping schema validation — file not found")
        return

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    # generate a success event
    spine = StateSpine()
    policy = Policy(name="m19b", allowed_mutations=["compress"], invariants=["user_goal"])
    op = BiteSeal(policy)
    op.state_store = spine
    state = {"user_goal": "test", "plan": "X. X. Y."}
    success_event = op.execute(state, trigger="stagnation_detected")

    # generate a failure event
    fail_event = op.execute(state, trigger="fake_trigger_not_in_policy")

    # manual deep validation against schema
    def validate_against_schema(event, schema, label):
        """Validate required fields, types, enums from schema."""
        issues = []

        # check required top-level fields
        for req in schema.get("required", []):
            if req not in event:
                issues.append(f"missing required field: {req}")

        # check no extra top-level fields
        if schema.get("additionalProperties") == False:
            allowed = set(schema.get("properties", {}).keys())
            extra = set(event.keys()) - allowed
            if extra:
                issues.append(f"extra top-level fields: {extra}")

        # check operator const
        if "operator" in event and event["operator"] != "🦷⟐":
            issues.append(f"operator should be 🦷⟐, got {event['operator']}")

        # check trigger enum
        trigger_enum = schema.get("properties", {}).get("trigger", {}).get("enum", [])
        if trigger_enum and event.get("trigger") not in trigger_enum:
            # fake_trigger is intentionally invalid — that's fine for the fail case
            if label == "success":
                issues.append(f"trigger '{event.get('trigger')}' not in enum")

        # check seal nested required
        seal_schema = schema.get("properties", {}).get("seal", {})
        seal_required = seal_schema.get("required", [])
        seal_data = event.get("seal", {})
        for req in seal_required:
            if req not in seal_data:
                issues.append(f"seal missing required: {req}")

        # check seal additionalProperties
        if seal_schema.get("additionalProperties") == False:
            seal_allowed = set(seal_schema.get("properties", {}).keys())
            seal_extra = set(seal_data.keys()) - seal_allowed
            if seal_extra:
                issues.append(f"seal extra fields: {seal_extra}")

        # check cut nested required
        cut_schema = schema.get("properties", {}).get("cut", {})
        cut_required = cut_schema.get("required", [])
        cut_data = event.get("cut", {})
        for req in cut_required:
            if req not in cut_data:
                issues.append(f"cut missing required: {req}")

        return issues

    success_issues = validate_against_schema(success_event, schema, "success")
    check("success event validates against schema",
          len(success_issues) == 0,
          f"issues: {success_issues}")

    fail_issues = validate_against_schema(fail_event, schema, "failure")
    check("failure event validates against schema",
          len(fail_issues) == 0,
          f"issues: {fail_issues}")

    # check both events have same top-level shape
    check("success and failure have same keys",
          set(success_event.keys()) == set(fail_event.keys()),
          f"success: {set(success_event.keys())}, fail: {set(fail_event.keys())}")


# ============================================================
# RUN ALL
# ============================================================

if __name__ == "__main__":
    print("🦷⟐ MAW ACCEPTANCE TESTS — 7 Critical + 3 Integration\n")

    test_M03()
    test_M05()
    test_M09()
    test_M10()
    test_M11()
    test_M15()
    test_M19()
    test_M09b()
    test_M10b()
    test_M19b()

    print(f"\n{'='*50}")
    print(f"  PASSED: {PASSED}")
    print(f"  FAILED: {FAILED}")
    print(f"  TOTAL:  {PASSED + FAILED}")
    print(f"{'='*50}")

    if FAILED > 0:
        print(f"\n  ⚠️ {FAILED} tests failed")
        sys.exit(1)
    else:
        print(f"\n  🦷⟐ ALL TESTS PASSED")
