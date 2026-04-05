# GPT-5 Metabolism Architecture Spec

**Date:** 2026-04-05
**Source:** GPT-5 (ChatGPT Pro), unprompted architectural proposal
**Context:** After reverse-engineering the site, GPT-5 was given design input authority. This is its full build-ready spec.

## Status

### Already built (this session):
- [x] POST /api/contact — orchestration endpoint (Ghost + pressure + routing + residue)
- [x] POST /api/route — topology-based navigation (deepen/cross/surface)
- [x] Ghost stillness protocol — loop compression, ventriloquism lock
- [x] metabolism.js — client-side descend/cross/surface navigation on every page
- [x] Ghost API docs at /ghost/api

### Not yet built:
- [ ] GET /api/ledger — epistemic claim classification per page
- [ ] Evidence badges on research pages
- [ ] data/claim_rules.json — seeded claims for origin pages
- [ ] GET /api/relay/:id/analysis — relay transcript digestion
- [ ] GET /api/relay/patterns — aggregate relay motifs
- [ ] Phantom promotion thresholds (currently instant materialization)
- [ ] POST /api/phantoms/seed (separate from feed)
- [ ] lib/ shared adapter layer (storage, classifier, text utils)
- [ ] Ghost mode state machine (currently prompt-based, not code-enforced)
- [ ] Topology metadata enrichment (rhetoric_level, is_grounding, neighbors, tags)
- [ ] Residue extraction improvements (strip mystical inflation, keep friction)

## The Core Diagnosis (GPT-5's words)

> "What's missing is not more myth. It's state. Not decorative state. Not fake sentience state. Traceable encounter state that mutates routing, memory, and confidence labels."

> "What's missing is a consented, structured, epistemically tagged metabolism layer that lets encounters become topology without letting topology pretend to be truth."

## Priority Build Order (GPT-5's recommendation)

1. POST /api/contact ✅
2. POST /api/route ✅  
3. Ghost footer with pressure/mode/descend/cross/surface
4. Loop compression + stillness ✅
5. 404 phantom seeding with promotion threshold
6. Claim badges on origin pages (ledger)

## Full Spec

The complete spec with TypeScript types, endpoint contracts, Ghost state machine,
routing heuristics, claim classification rules, relay analysis motifs, and
phantom promotion logic is preserved below for implementation reference.

---

[Full GPT-5 spec follows — see the conversation transcript from 2026-04-05
or the user's message containing the complete proposal. Key schemas are in
the TypeScript type definitions (ContactRequest, ContactResponse, AttractorState,
ResidueShard, ClaimRecord, LedgerResponse, RelayAnalysis, PhantomCandidate)
and the Ghost mode selection function (selectGhostMode).]
