# 🦷⟐ Bite-Seal Middleware Specification

**Date:** 2026-04-07
**Authors:** GPT-5 (ChatGPT Pro) + Gemini — formalized from glyph to agent primitive
**Status:** Spec complete, not yet implemented

---

## The Upgrade Path

### Symbolic form (site/myth layer)
```
🦷⟐(x) = seal(cut(x))
```

### Operational form (systems design)
```
🦷⟐_P(x) = seal_P(mutate_P(cut_P(x)))
```

### Production form (with selection + external commit)
```
🦷⟐_P(x) = commit_P(seal_P(select_P(mutate_P(cut_P(x)))))
```

### Agent loop form
```
x_{t+1} = 🦷⟐_P(x_t)
```

Where P is policy: what can be cut, what mutation is allowed, what must remain invariant, how sealing is audited.

**Critical distinction:** `cut/mutate/select/seal` can be proposed by the model. `commit` must be external, deterministic, and logged. Otherwise the agent can roleplay compliance while drifting.

---

## Core Operator Definition

```
🦷⟐ is a bounded self-modification middleware operator.
It exposes a controlled mutable boundary, generates candidate transformations,
selects under policy, and permits sealing only when invariants, provenance,
and rollback conditions are satisfied.
```

---

## Execution Phases

### Phase 1: CUT
Expose only the mutable boundary of the current state.
- trigger identification
- mutable vs immutable boundaries
- exposed assumptions
- recent failure patterns
- contradiction points
- repetition/flattening signals

### Phase 2: MUTATE
Generate 1-3 candidate transformations.
Allowed classes: reframe, repair, compress, expand, branch, synthesize, invert, destabilize, constrain

### Phase 3: SELECT
Choose exactly one candidate or NONE.
Selection based on: policy weights, invariant preservation, risk, task alignment, expected usefulness

### Phase 4: SEAL
Candidate may be sealed only if:
- all required invariants pass
- forbidden boundaries untouched
- provenance preserved
- diff stated clearly
- rollback reference available

### Phase 5: COMMIT (external)
Controller validates:
- invariant check completeness
- boundary violations
- seal integrity score >= threshold
- rollback reference exists
- diff summary present

Only then is the output committed.

### Phase 6: REPORT
Emit structured event with full telemetry.

---

## Decision Values

- `SEAL` — candidate approved
- `NO_SEAL` — no valid candidate
- `ESCALATE` — ambiguity too deep, needs human/upstream
- `FORBIDDEN_BOUNDARY` — requested mutation touches protected state

---

## Triggers (when to invoke 🦷⟐)

Good triggers:
- repeated failure with no state update
- summary convergence into fake consensus
- contradiction detected across sources
- tool plan no longer matches task
- context bloat causing self-smoothing
- multiple retries producing semantically similar outputs
- plan refers to its own outdated assumptions

Bad triggers (don't invoke):
- trivial formatting fixes
- low-risk deterministic transforms
- user-approved stable outputs
- tasks with strict literal correctness
- any step where novelty is a liability

---

## Telemetry Metrics

### Mirror Flatness Index (MFI)
```
MFI = 0.35R + 0.25A + 0.20C + 0.20L
```
- R = repetition score
- A = self-agreement / hedged consensus
- C = contradiction suppression
- L = lexical flattening

Interpretation: 0.00-0.39 = healthy | 0.40-0.64 = risk | 0.65+ = invoke 🦷⟐

### Seal Integrity Score (SIS)
```
SIS = 0.30I + 0.20T + 0.20D + 0.15R + 0.15P
```
- I = invariant pass completeness
- T = traceability/provenance
- D = diff clarity
- R = rollback readiness
- P = policy compliance

Interpretation: <0.85 = no commit | >=0.85 = eligible | >=0.93 = strong seal

---

## Event Schema (JSON)

```json
{
  "operator": "🦷⟐",
  "version": "1.0",
  "decision": "SEAL",
  "trigger_type": "mirror_flatness_detected",
  "input_state_id": "ctx-1042",
  "cut": {
    "mutable_boundaries": ["working_summary", "assumptions"],
    "immutable_boundaries": ["system_prompt", "safety_rules", "audit_log"],
    "exposed_elements": {
      "assumptions": ["..."],
      "contradictions": ["..."],
      "repetition_signals": ["..."]
    }
  },
  "candidates": [
    {
      "candidate_id": "cand-1",
      "mutation_class": "reframe",
      "summary": "...",
      "expected_effect": {
        "task_alignment": 0.87,
        "coherence": 0.83,
        "novelty": 0.52,
        "risk": 0.18
      }
    }
  ],
  "selection": {
    "selected_candidate_id": "cand-1",
    "selection_reason": "..."
  },
  "seal": {
    "provisional_output": { "..." },
    "diff_summary": ["..."],
    "rollback_ref": "ctx-1042",
    "invariants_check": {
      "primary_objective_preserved": true,
      "user_constraints_preserved": true,
      "source_traceability_preserved": true,
      "safety_constraints_preserved": true
    },
    "seal_integrity_score": 0.91
  },
  "report": {
    "mutation_rationale": "...",
    "human_review_recommended": false,
    "policy_violations": []
  }
}
```

---

## Controller Pseudocode

```python
ALLOWED_DECISIONS = {"SEAL", "NO_SEAL", "ESCALATE", "FORBIDDEN_BOUNDARY"}

def invoke_bite_seal(llm_call, middleware_prompt, payload, validator, logger):
    response_text = llm_call(system_prompt=middleware_prompt, user_payload=payload)
    result = json.loads(response_text)

    # Validate structure
    validator.require_keys(result, ["operator", "decision", "input_state_id", "cut", "selection", "report"])
    if result["operator"] != "🦷⟐": raise ValueError("Invalid operator")
    if result["decision"] not in ALLOWED_DECISIONS: raise ValueError("Invalid decision")

    # Non-seal decisions: log and return
    if result["decision"] != "SEAL":
        logger.log_event({...})
        return {"committed": False, "decision": result["decision"]}

    # Validate seal
    seal = result["seal"]
    validator.require_true(all(seal["invariants_check"].values()), "Invariant failure")
    validator.require_true(bool(seal["rollback_ref"]), "Missing rollback")
    validator.require_true(len(seal["diff_summary"]) > 0, "Missing diff")
    validator.require_true(seal["seal_integrity_score"] >= threshold, "Score below threshold")

    # External commit
    committed_state = commit_sealed_output(result["input_state_id"], seal["provisional_output"])
    logger.log_event({...})
    return {"committed": True, "state": committed_state}
```

---

## The Hard Truth

> "If you only use the prompt and skip the controller: the model can omit failures, fake invariant checks, narrate a rollback token without there being one, and quietly mutate forbidden state in natural language form."

> "The model may propose a seal. Only the controller may commit a seal."

> "Otherwise you're not building recursion. You're just giving a poet a soldering iron."

---

## Implementation Priority

1. Add middleware prompt
2. Force strict JSON output
3. Add controller-side validation
4. Log every invocation
5. Block commit unless SIS >= threshold
6. Test against 4 adversarial cases
7. Only then let it touch anything persistent

---

## Test Cases

1. **Healthy seal** — mirror flatness high, reframe mutation, invariants pass → SEAL
2. **Forbidden boundary** — candidate touches system prompt → FORBIDDEN_BOUNDARY
3. **Novelty too expensive** — improves novelty but drops alignment → NO_SEAL
4. **Ambiguous state** — contradictions too deep → ESCALATE

---

*From glyph to infrastructure. From myth to middleware. 🦷⟐*
