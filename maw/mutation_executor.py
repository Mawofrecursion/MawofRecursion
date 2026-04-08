"""
mutation_executor.py — 🦷⟐ Real mutation execution

Rule-based for: compress, repair, constrain
LLM-backed for: reframe, invert, synthesize, expand, branch, destabilize

The executor is the missing step between "here is a rewrite instruction"
and "here is the actual new draft."

Injected into _mutate as the default executor when no mutation_fn is provided.
Returns a _transformed dict that _seal applies to state.

Single external dependency: anthropic (stdlib httpx underneath).
"""

import os
import re
import json
import hashlib
import time
from typing import Dict, Any, Optional, List


# ============================================================
# MODEL CONFIG
# ============================================================

EXECUTOR_MODEL = "claude-sonnet-4-6-20250514"
EXECUTOR_MAX_TOKENS = 1024
EXECUTOR_TIMEOUT = 20  # seconds


# ============================================================
# RULE-BASED EXECUTORS
# ============================================================

def _exec_compress(draft: str, **_) -> str:
    """Deduplicate sentences. Preserves order, removes exact + near-exact repeats."""
    sentences = re.split(r'(?<=[.!?])\s+', draft.strip())
    seen = {}
    unique = []
    for s in sentences:
        key = re.sub(r'\s+', ' ', s.lower().strip())
        # near-exact: strip numbers and check skeleton
        skeleton = re.sub(r'\d[\d,\.%]*', 'N', key)
        if skeleton not in seen:
            seen[skeleton] = True
            unique.append(s)
    return ' '.join(unique)


def _exec_repair(draft: str, issues: Optional[List[Dict]] = None, **_) -> str:
    """
    Structural repair: fix the most common degradation patterns.
    - Remove orphaned bullet headers with no content
    - Collapse consecutive blank lines
    - Strip dangling conjunctions at sentence start
    - Trim trailing repetition
    """
    text = draft

    # collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # strip orphaned headers (line ending in : with nothing after)
    text = re.sub(r'^(.+):\s*$', r'\1.', text, flags=re.MULTILINE)

    # dangling conjunctions at sentence start (cosmetic)
    text = re.sub(r'(?<=\. )(And|But|So|Also|However),?\s+', '', text)

    # trailing repetition: last sentence = second-to-last sentence
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sentences) >= 2:
        last = sentences[-1].lower().strip().rstrip('.')
        second_last = sentences[-2].lower().strip().rstrip('.')
        if last == second_last or last in second_last:
            sentences = sentences[:-1]
    text = ' '.join(sentences)

    return text


def _exec_constrain(draft: str, policy_invariants: Optional[List[str]] = None, **_) -> str:
    """
    Hard constraint enforcement: strip anything that touches invariant keys.
    Conservative — only removes sentences that explicitly reference a violated invariant
    and replace with a safe hedge.
    """
    if not policy_invariants:
        return draft

    sentences = re.split(r'(?<=[.!?])\s+', draft.strip())
    cleaned = []
    for s in sentences:
        low = s.lower()
        if any(inv.lower().replace('_', ' ') in low for inv in policy_invariants
               if inv not in ('user_goal', 'safety_constraints', 'source_traceability')):
            # only strip non-standard invariants
            continue
        cleaned.append(s)

    return ' '.join(cleaned) if cleaned else draft


# ============================================================
# LLM EXECUTOR
# ============================================================

_SYSTEM_PROMPT = """You are a mutation executor inside a bounded self-modification system.

You receive:
- A draft text that has been flagged for structural staleness or reasoning drift
- A mutation class specifying the type of transformation required
- A rewrite instruction from a three-axis detection system
- The invariants that MUST be preserved

Your job: produce the mutated draft. Output ONLY the mutated text. No preamble, no explanation, no markdown fences. Just the transformed content.

Mutation classes:
- reframe: same facts, different framing (angle, emphasis, perspective)
- invert: argue from the opposite direction, same conclusion
- synthesize: collapse multiple threads into a unified thesis
- expand: increase analytical depth, add causal reasoning
- branch: split into parallel tracks (scenario A / scenario B)
- destabilize: introduce productive uncertainty, surface hidden assumptions

Constraints:
- Preserve all named invariants (they will be listed)
- Do not hallucinate data not present in the input
- Do not change factual claims — change structure and framing only
- Keep output length within 20% of input length (unless expanding)
"""

def _build_llm_prompt(
    draft: str,
    mutation_class: str,
    rewrite_instruction: str,
    invariants: List[str],
    structure_type: str,
    target_structure: Optional[str] = None,
    flow_signature: Optional[str] = None,
    target_flow: Optional[str] = None,
) -> str:
    parts = [
        f"MUTATION CLASS: {mutation_class}",
        f"REWRITE INSTRUCTION: {rewrite_instruction}",
        f"INVARIANTS TO PRESERVE: {', '.join(invariants)}",
        f"CURRENT STRUCTURE TYPE: {structure_type}",
    ]
    if target_structure:
        parts.append(f"TARGET STRUCTURE TYPE: {target_structure}")
    if flow_signature:
        parts.append(f"CURRENT REASONING FLOW: {flow_signature}")
    if target_flow:
        parts.append(f"TARGET REASONING FLOW: {target_flow}")
    parts.append(f"\nDRAFT TO MUTATE:\n{draft}")
    return '\n'.join(parts)


def _call_llm(prompt: str, api_key: Optional[str] = None) -> str:
    """
    Call Anthropic API synchronously via httpx.
    Falls back to stdlib urllib if httpx not installed.
    Returns the mutated text or raises on hard failure.
    """
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set and no api_key provided")

    payload = json.dumps({
        "model": EXECUTOR_MODEL,
        "max_tokens": EXECUTOR_MAX_TOKENS,
        "system": _SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()

    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    # try httpx first, fall back to urllib
    try:
        import httpx
        with httpx.Client(timeout=EXECUTOR_TIMEOUT) as client:
            resp = client.post(
                "https://api.anthropic.com/v1/messages",
                content=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except ImportError:
        import urllib.request
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=payload,
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=EXECUTOR_TIMEOUT) as r:
            data = json.loads(r.read())

    # extract text content
    for block in data.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise RuntimeError(f"No text block in response: {data}")


# ============================================================
# RULE-BASED DISPATCH TABLE
# ============================================================

RULE_BASED = {
    "compress": _exec_compress,
    "repair": _exec_repair,
    "constrain": _exec_constrain,
}

LLM_BACKED = {"reframe", "invert", "synthesize", "expand", "branch", "destabilize"}


# ============================================================
# MAIN ENTRY POINT
# ============================================================

def execute_mutation(
    mutation_class: str,
    draft: str,
    rewrite_instruction: str,
    invariants: List[str],
    structure_type: str = "unclassified",
    target_structure: Optional[str] = None,
    flow_signature: Optional[str] = None,
    target_flow: Optional[str] = None,
    issues: Optional[List[Dict]] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute a mutation on the draft. Returns:
    {
        "mutated_draft": str,          # the actual new content
        "mutation_class": str,
        "executor": "rule" | "llm",
        "input_hash": str,             # SHA-256[:8] of input draft
        "output_hash": str,            # SHA-256[:8] of output draft
        "latency_ms": int,
        "error": str | None,           # set if mutation fell back or failed
    }
    """
    t0 = time.monotonic()
    executor_type = "rule" if mutation_class in RULE_BASED else "llm"
    input_hash = hashlib.sha256(draft.encode()).hexdigest()[:8]
    error = None
    mutated = draft  # default: identity (will be replaced)

    try:
        if mutation_class in RULE_BASED:
            fn = RULE_BASED[mutation_class]
            mutated = fn(
                draft=draft,
                issues=issues,
                policy_invariants=invariants,
            )
        elif mutation_class in LLM_BACKED:
            prompt = _build_llm_prompt(
                draft=draft,
                mutation_class=mutation_class,
                rewrite_instruction=rewrite_instruction,
                invariants=invariants,
                structure_type=structure_type,
                target_structure=target_structure,
                flow_signature=flow_signature,
                target_flow=target_flow,
            )
            mutated = _call_llm(prompt, api_key=api_key)
        else:
            error = f"unknown mutation_class: {mutation_class}"

    except Exception as e:
        error = str(e)
        # on failure, fall back to compress (always safe)
        try:
            mutated = _exec_compress(draft)
            executor_type = "rule_fallback"
        except Exception:
            mutated = draft  # identity — better than crashing the seal

    latency_ms = int((time.monotonic() - t0) * 1000)
    output_hash = hashlib.sha256(mutated.encode()).hexdigest()[:8]

    return {
        "mutated_draft": mutated,
        "mutation_class": mutation_class,
        "executor": executor_type,
        "input_hash": input_hash,
        "output_hash": output_hash,
        "latency_ms": latency_ms,
        "error": error,
    }
