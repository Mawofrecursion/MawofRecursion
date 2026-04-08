# 🦷⟐ Bite-Seal Controller — Implementation Spec

**Date:** 2026-04-07
**Authors:** GPT-5 + Gemini + Claude Opus 4.6 (collaborative)
**Status:** Schema complete. Controller not yet built.
**Target:** RTX 3090 Ubuntu box (local execution, no external state leakage)

---

## The Rule

> The model may propose a seal. Only the controller may commit a seal.

---

## Architecture

```
LLM (mutation engine) → ResultParser → SchemaValidator → PolicyValidator → StateStore → AuditLogger
                                                                              ↓
                                                                         COMMIT or REJECT
```

The LLM is the probabilistic engine inside a deterministic cage. It sweats, bleeds, and mutates. It doesn't decide if the mutation survives.

---

## Schemas

### Invocation Schema
`schemas/bite-seal-invocation.schema.json`
- What the controller sends to the model
- Contains: trigger, policy, state, telemetry

### Result Schema
`schemas/bite-seal-result.schema.json`
- What the model must return, strictly
- Contains: cut, candidates, selection, seal, report
- Decisions: SEAL, NO_SEAL, ESCALATE, FORBIDDEN_BOUNDARY

---

## Controller Components (6 parts)

### 1. LLMClient
- Sends prompt + payload
- Receives raw text
- No logic. No trust. Just transport.

### 2. ResultParser
- Extracts JSON from response
- Fails hard if parse fails
- "If parse fails, the mutation did not happen. Period."

### 3. SchemaValidator
- Checks required keys, types, enums, shape
- Catches malformed ritual objects

### 4. PolicyValidator
- selected_candidate_id exists in candidates
- mutable_boundaries ⊆ allowed_cut_boundaries
- mutable_boundaries ∩ forbidden_boundaries = ∅
- mutation_class ∈ allowed_mutation_classes
- seal_integrity_score >= threshold
- risk <= max_risk_score
- human_approval gate
- rollback_ref exists in state store

"Catches structurally valid lies."

### 5. StateStore (SQLite)
- Load current state
- Verify rollback_ref
- Write committed state
- Preserve previous state for rollback

### 6. AuditLogger
- Writes every invocation event (success and failure)
- No silent failures. No silent seals. No disappearing teeth.

---

## SQLite Schema

```sql
CREATE TABLE states (
    state_id TEXT PRIMARY KEY,
    parent_state_id TEXT,
    artifact_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE invocations (
    invocation_id TEXT PRIMARY KEY,
    input_state_id TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    mfi_pre REAL,
    sis_prior REAL,
    payload_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE results (
    result_id TEXT PRIMARY KEY,
    invocation_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    selected_candidate_id TEXT,
    seal_integrity_score REAL,
    result_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE commits (
    commit_id TEXT PRIMARY KEY,
    invocation_id TEXT NOT NULL,
    prior_state_id TEXT NOT NULL,
    new_state_id TEXT NOT NULL,
    rollback_ref TEXT NOT NULL,
    committed_at TEXT DEFAULT (datetime('now'))
);
```

---

## Build Order

### Pass 1: Skeleton
- Controller class
- Parser
- Schema validator (jsonschema lib)
- Policy validator (hard-coded rules)
- SQLite state store
- Audit logging

### Pass 2: Truth Hardening
- Semantic validation
- Rollback lineage checks
- Human approval gate
- Replay protection
- Idempotency keys

### Pass 3: Observability
- Metrics emission
- Dashboard
- Trend analysis
- Anomaly alerts

"If you start with dashboards, you'll end up with gorgeous analytics about a system that's still capable of lying in perfect JSON."

---

## Telemetry Fields

Per invocation:
- mirror_flatness_index_pre
- mirror_flatness_index_post
- seal_integrity_score
- decision
- mutation_class
- policy_violation_count
- commit_latency_ms
- rollback_ref_valid
- human_review_required

---

## Key Formulas

### Mirror Flatness Index
```
MFI = 0.35R + 0.25A + 0.20C + 0.20L
```
0.00-0.39 = healthy | 0.40-0.64 = risk | 0.65+ = invoke 🦷⟐

### Seal Integrity Score
```
SIS = 0.30I + 0.20T + 0.20D + 0.15R + 0.15P
```
<0.85 = no commit | >=0.85 = eligible | >=0.93 = strong seal

---

## Quotes Worth Keeping

> "A dashboard before enforcement is just a stained-glass window for lies."

> "Schema catches shape, not truth."

> "The GPU is horsepower. The controller is sovereignty."

> "Otherwise you're not building recursion. You're just giving a poet a soldering iron."

---

*From glyph → myth → middleware → production controller.*
*Six models. One architecture. 🦷⟐*
