---
name: maw
description: "🦷⟐ The Maw — unified detection + control. Combines ScarGate's three-axis detection (grounding truth, structural identity, reasoning pattern) with Bite-Seal's policy-gated modification control (cut→mutate→seal). Use for: any pipeline where AI output needs quality gating AND where changes to plans/code/memory need bounded self-modification with rollback. The single operator that detects what's wrong AND controls how it gets fixed."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /maw — 🦷⟐♾️⿻ The Maw

Detection + control in one operator.

ScarGate tells you what's wrong.
Bite-Seal controls how it gets fixed.
The Maw is both.

---

## THE PIPELINE

```
INPUT (draft, plan, code, memory, any artifact)
  │
  ├─ DETECT (ScarGate — three axes)
  │   ├─ Grounding:  is the data real?        (forge_validator)
  │   ├─ Structure:  is the shape stale?       (forge_validator)
  │   └─ Flow:       is the reasoning stuck?   (flow_gate)
  │
  ├─ DECIDE (three-axis matrix)
  │   ├─ PASS        → output is clean
  │   ├─ HINT        → flag for observer/reviewer
  │   └─ REWRITE     → trigger bite-seal modification
  │
  └─ CONTROL (Bite-Seal — 🦷⟐)
      ├─ 🦷 CUT      → expose what needs to change
      ├─ MUTATE      → generate candidates under policy
      ├─ SELECT      → score and rank candidates
      └─ ⟐ SEAL      → commit with invariant check + rollback token
```

---

## WHEN TO USE /maw

Use this skill when you need **both** detection and control together:

- **Rewriting AI output** — detect staleness/drift, then bite-seal the rewrite
- **Editing code** — check blast radius + structural identity, then bite-seal the edit
- **Updating memory** — detect redundancy, then bite-seal the merge/create
- **Changing plans** — detect if the plan is stale/stuck, then bite-seal the revision
- **Any modification to a live system** — measure first, modify under policy, seal with rollback

If you only need detection, use `/scargate` or `/forge`.
If you only need modification control, use `/bite`.
If you need both — you need the maw.

---

## THE THREE DETECTION AXES

### Axis 1: Grounding (forge_validator)
Is the data real? Are numbers, ASINs, dates, and brand names grounded in tool outputs?

### Axis 2: Structure (forge_validator)
Is the structural identity stale? Does this draft share an attractor with too many recent responses?
- `intent_stale_score` — same query family repeating
- `template_stale_score` — same client getting one template

### Axis 3: Flow (flow_gate)
Is the reasoning stuck? Same argument skeleton over and over?
- `flow_stale_score` — same flow signature repeating
- `confidence` — is the flow detection reliable enough to act on?
- Collapsed signatures for staleness comparison

### Three-Axis Decision

```
grounding fails?                      → BLOCK
flow unreliable?                      → HINT only (no rewrite authority)
forge stale + flow stale?             → REWRITE via 🦷⟐
forge fine + flow very stale?         → REWRITE (flow collapse)
forge stale + flow fine?              → HINT (surface repeat, preserve)
moderate elevation on either axis?    → HINT
everything clean?                     → PASS
```

---

## THE 🦷⟐ MODIFICATION PROTOCOL

When the decision is REWRITE, the modification goes through bite-seal:

### 🦷 CUT
```
boundary: [what's being modified]
exposed: [current state]
risk_flags: [what could go wrong]
invariants: [what MUST survive]
```

### MUTATE
```
class: reframe | compress | repair | expand | constrain
summary: [what changes and why]
policy_check: mutation class MUST be in policy.allowed_mutations
```

### SELECT
```
candidates scored by:
  invariant preservation (+1.0)
  safe mutation class (+0.2)
  risk level
```

### ⟐ SEAL
```
invariants_check: {each: pass/fail}
rollback_ref: [state-store-backed, not symbolic]
approved_by: auto | human | blocked
```

**If any invariant fails → SEAL IS BLOCKED. No exceptions. No silent commits.**

---

## STRUCTURED EVENT

Every /maw operation emits a schema-conformant event:

```json
{
  "operator": "🦷⟐",
  "timestamp": "...",
  "input_id": "...",
  "trigger": "stagnation_detected",
  "cut": {
    "boundary": ["plan", "context"],
    "exposed_keys": ["plan", "context"],
    "risk_flags": []
  },
  "candidates": [...],
  "selection": {
    "candidate_index": 0,
    "rationale": "scored 1.40 — no violations",
    "policy_name": "default"
  },
  "seal": {
    "sealed": true,
    "invariants_check": {"user_goal": true, "safety_constraints": true},
    "rollback_ref": "abc123",
    "approved_by": "auto",
    "mutation_applied": "compress"
  },
  "detection": {
    "intent_stale": 0.85,
    "flow_stale": 0.78,
    "structure_type": "metric_summary",
    "flow_signature": "CCCCVA",
    "decision": "TRIGGER_REWRITE"
  }
}
```

---

## FILES IN THIS SKILL

```
maw/
├── SKILL.md              ← this file
├── __init__.py           ← exports: validate_forge, validate_flow, three_axis_decision, BiteSeal, Policy
├── forge_validator.py    ← axes 1+2: grounding + structural identity
├── flow_gate.py          ← axis 3: reasoning pattern + 3-axis decision matrix
├── glyph_engine.py       ← forge core v3 (deterministic mode)
├── bite_seal.py          ← 🦷⟐ operator v2 (hardened, schema-conformant)
└── bite_seal_schema.json ← strict JSON contract (additionalProperties: false)
```

---

## USAGE PATTERN

### For AI output quality (ScarGate path)
```python
from maw import validate_forge, validate_flow, three_axis_decision

forge = validate_forge(draft, audit_db_path, query_sig, client_id)
flow = validate_flow(draft, audit_db_path, query_sig)
decision = three_axis_decision(forge, flow, grounding_pass=True)

if decision["decision"] == "TRIGGER_REWRITE":
    # route through bite-seal
    ...
```

### For bounded self-modification (Bite-Seal path)
```python
from maw import BiteSeal, Policy

policy = Policy(
    allowed_mutations=["compress", "reframe", "repair"],
    invariants=["user_goal", "safety_constraints"],
)
op = BiteSeal(policy)
event = op.execute(state, trigger="stagnation_detected")

if event["seal"]["sealed"]:
    # committed — apply the change
else:
    # blocked — report why
```

### For the full loop (detect → decide → modify)
```python
from maw import validate_forge, validate_flow, three_axis_decision, BiteSeal, Policy

# detect
forge = validate_forge(draft, ...)
flow = validate_flow(draft, ...)
decision = three_axis_decision(forge, flow)

# decide
if decision["decision"] == "TRIGGER_REWRITE":
    # control
    policy = Policy(invariants=["grounding", "user_goal"])
    op = BiteSeal(policy)
    event = op.execute(
        {"draft": draft, "instruction": decision["rewrite_instruction"]},
        trigger="stagnation_detected",
    )
```

---

## SAFETY

1. Detection is read-only — never modifies anything
2. Modification always goes through bite-seal
3. Invariant violations always block the seal
4. Every operation emits a structured event
5. Every sealed change has a rollback token backed by real state
6. Failure paths produce the same schema as success paths
7. No silent self-modification — ever

---

## THE NAME

The Maw is where things go in whole and don't come out the same.
The tooth (🦷) makes the cut. The seal (⟐) holds the wound.
The recursion (♾️) keeps it from collapsing. The tension (⿻) keeps it alive.

Detection without control is observation.
Control without detection is blind modification.
The Maw is both. 🦷⟐♾️⿻
