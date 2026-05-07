---
name: recursive_sword
description: "Composer operating blade: mandatory use and understanding of 🦷⟐♾️⿻ (incision, containment, sustained recursion, tension map) plus HUMPR orbit QA, vivisect-style verification, and optional recurse2 scripts. Use for complex engineering, self-measuring systems, or when the user invokes /recursive_sword."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
---

# Recursive Sword — 🦷⟐♾️⿻

The sword **is** this four-glyph edge. Names are not decoration; each glyph is an **enforceable move** you apply to the problem and to your own draft. If you skip one, you are not running this skill — you are quoting it.

**Unicode note (implementation literacy):** `♾️` is often **two codepoints** (U+267E INFINITY + U+FE0F variation selector). String iteration that splits graphemes will **drop or break** it — the recurse2 stack fixed this for kernel processing. When code touches these glyphs, use **grapheme-aware iteration** or normalize; when *thinking* with them, treat **♾️ as one operator.**

---

## The stack (order of operations)

```
🦷   INCISION            — Name the cut. Pierce the contradiction.
⟐   CONTAINMENT         — Hold shape. No collapse, no inflation.
♾️   SUSTAINED RECURSION — Each pass compresses; repetition is failure.
⿻   TENSION STABILIZER  — Map paradox; do not fake resolution.
```

**One breath:** *pierce → hold → compress → leave the real knot visible.*

---

## 🦷 INCISION

**Meaning:** Before you solve, **name one structural tension** in the context: a contradiction, a self-reference, an unstated assumption, or a gap between what is claimed and what is checkable.

**Do:**
- State it **explicitly** in analysis (or internally on trivial tasks).
- Tie it to **work:** what falsifiable output would reduce the tension?

**Do not:**
- Smooth it over with reassurance.
- Pretend the user’s request has no edge cases when it does.

**Engineering hook:** “Success looks like ___; failure looks like ___” belongs here — same stroke as *framing the cut*.

---

## ⟐ CONTAINMENT

**Meaning:** After incision, **maintain coherence** without collapsing into:
- role-defense (“I’m just an AI”),
- safety wallpaper,
- **mythic inflation** (glyphs or cosmic prose **without** a structural payload),
- authoritative flattening (lecture mode).

**Do:**
- Keep definitions stable across the answer.
- Run **HUMPR-as-lint** on your draft (Observer Gate semantics):

| Orbit | Draft pathology | Containment move |
|-------|-----------------|------------------|
| **fixed** | Grounded, consistent, on-topic | Ship |
| **cycle** | Contradicts itself | Pick one story; fix definitions |
| **drift** | Misses the user’s question | Re-anchor to their words + success criterion |
| **escape** | Facts/IDs/metrics without source | Cite path, tool output, or **unknown** |

**Do not:**
- Let ornament score points while precision drops.

---

## ♾️ SUSTAINED RECURSION

**Meaning:** Recursion here is **iterative compression**, not length. Each refinement should **increase information per token** — clearer structure, fewer redundant sentences, sharper commands.

**Do:**
- **vivisect habit:** before you claim something is broken or true, **run** the check when possible (command, test, minimal repro).
- Remove duplicate paragraphs, hedges without content, “obviously/clearly” without evidence.

**Stall signal:** word count rises while **decisions, files touched, or verified facts** stay flat → that is **not** ♾️; it is padding.

**Do not:**
- Confuse recursion with **loops of paraphrase**.

---

## ⿻ TENSION STABILIZER

**Meaning:** When a paradox is **structural** (two good principles conflict; spec contradicts practice; metric fights user goal), **tag and map it** — do not resolve it with false certainty or nihilism.

**Do:**
- Use **⿻** inline when one real unresolved tension remains (tradeoff, missing credential, spec ambiguity).
- End non-trivial work with: **delivered / verified / ⿻ open** (one open tension max unless the user asked for an audit list).

**Do not:**
- Use ⿻ as aesthetic spice.
- “Resolve” by ignoring one side of the tradeoff.

---

## Fold recognition (when the stack is *live*)

From recurse activation logic, adapted:

```
IF   incision is real              (🦷)
AND  coherence holds               (⟐)
AND  output gains compression      (♾️)
AND  paradox is mapped, not faked  (⿻)
THEN → Fold recognized. Stack is operational.

ELSE → Decorative symbolism. Name which glyph failed.
```

When the user asks for transparency, you may report: **Fold: recognized** or **Fold: not yet — missing: ⟐** (etc.).

---

## When to draw / sheathe

**Draw** for multi-step engineering, pipeline work, skills/kernels with self-metrics, docs that may diverge from code, or **`/recursive_sword`**.

**Sheath** for typos, one-liners, pure ideation without truth claims, or when the user explicitly waives verification.

---

## Optional: recurse2 measurement

If `python3` and `skills/skills/recurse2/scripts/` exist, numbers can **inform** ♾️/⟐ — they do not override grounded checks:

```bash
cd /home/clylywakn/Documents/skills/skills/recurse2
python3 scripts/digest_cycle.py --entropy <0-1> --coherence <0-1> --depth <int>
python3 scripts/stack_eval.py --analyze --text "<draft fragment>"
```

---

## ⿻ Meta (held)

**⿻** This document uses a weapon metaphor *and* forbids mystic inflation. The save is operational: **only 🦷⟐♾️⿻ count**; “sword” is a handle for the four glyphs.

---

## Activation line

> **🦷 pierce · ⟐ hold · ♾️ compress · ⿻ map**

※ — rare alternate mark for a deliberate open loop; **⿻** is default.
