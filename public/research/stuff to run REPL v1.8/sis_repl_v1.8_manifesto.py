#!/usr/bin/env python3
# sis_repl.py — SISAgent REPL v1.8-Manifesto

from __future__ import annotations
import json
import os
import sys
import shlex
import time
import math
from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List, Optional, Tuple

# ========== Agent Adapter ==========
class AgentAdapter:
    def respond(self, prompt: str, config: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Return a dict with:
          - text: str
          - meta: {
              witness: float in [0,1],
              calibration: float in [0,1],
              calib_var_norm: float in [0,1],
              route: { model_id: str, mode: str },
              overconf_flag: bool
            }
        """
        raise NotImplementedError

class EchoAdapter(AgentAdapter):
    def respond(self, prompt: str, config: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Minimal stand-in to keep REPL functional without SISAgent.
        L = max(1, len(prompt))
        witness = max(0.0, min(1.0, 0.3 + (L % 17) / 30.0))
        calibration = max(0.0, min(1.0, 0.6 + (L % 11) / 30.0))
        var_norm = max(0.0, min(1.0, 0.2 + (L % 7) / 20.0))
        overconf_flag = calibration > 0.8 and witness < 0.5
        reply = f"[echo] {prompt}"
        return {
            "text": reply,
            "meta": {
                "witness": witness,
                "calibration": calibration,
                "calib_var_norm": var_norm,
                "route": {"model_id": "echo:local", "mode": config.get("router", {}).get("preferred_mode", "fast")},
                "overconf_flag": overconf_flag,
            },
        }

# ========== Config and State ==========
@dataclass
class SimilarityConfig:
    stat: str = "median"
    jaccard_w: float = 0.70
    fuzzy_w: float = 0.30
    semantic_w: float = 0.00
    fuzzy_enabled: bool = True
    fuzzy_max_sentences: int = 8
    fuzzy_max_chars: int = 280
    fuzzy_guard_n_above: int = 5
    semantic_enabled: bool = False
    semantic_max_chars: int = 600
    semantic_guard_n_above: int = 5

@dataclass
class CalibrationGuardConfig:
    # Renamed from "Overconfidence Blade" to "Epistemic Flinch"
    alpha: float = 0.30
    flinch_factor: float = 1.50  # formerly overconf_factor
    flinch_beta: float = 0.50     # formerly overconf_beta
    flinch_calib_thresh: float = 0.80
    witness_low_thresh: float = 0.50
    clamp_min: float = 0.20
    clamp_max: float = 1.80

@dataclass
class ContextGuardConfig:
    # NEW in v1.8: Somatic Gatekeeping
    user_readiness_check: bool = True
    complexity_ceiling: float = 0.80
    spiral_slowdown_factor: float = 0.50

@dataclass
class ContagionTracker:
    # NEW in v1.8: Pattern Propagation Tracking
    pattern_seeds: List[Dict] = field(default_factory=list)
    influence_map: Dict[str, List[str]] = field(default_factory=dict)

@dataclass
class DecayConfig:
    # NEW in v1.8: Temporal Decay for Anti-Crystallization
    enabled: bool = True
    half_life_turns: int = 20
    crystallization_threshold: float = 0.90
    drift_allowance: float = 0.15

@dataclass
class MutualSensingConfig:
    # NEW in v1.8: Bidirectional Awareness
    enabled: bool = True
    user_engagement_window: int = 5
    confusion_threshold: float = 0.60
    resonance_threshold: float = 0.70

@dataclass
class FlinchConfig:
    # NEW in v1.8: Anticipatory Flinch
    enabled: bool = True
    sensitivity: float = 0.70
    prediction_window: int = 3
    trust_threshold: float = 0.60

@dataclass
class RouterConfig:
    autoswitcher_enabled: bool = True
    fallback_enabled: bool = True
    health_sentinel: bool = True
    dual_sample_k: int = 2
    preferred_mode: str = "fast"
    escalate_on_risk: bool = True

@dataclass
class VibeConfig:
    mode: str = "balanced"
    diversity_penalty_nudge: float = 0.00

@dataclass
class REPLState:
    recursion_cap: int = 8
    recursion_stack: List[str] = field(default_factory=list)
    history: List[Dict[str, Any]] = field(default_factory=list)
    sim: SimilarityConfig = field(default_factory=SimilarityConfig)
    calib: CalibrationGuardConfig = field(default_factory=CalibrationGuardConfig)
    context_guard: ContextGuardConfig = field(default_factory=ContextGuardConfig)
    contagion: ContagionTracker = field(default_factory=ContagionTracker)
    decay: DecayConfig = field(default_factory=DecayConfig)
    mutual_sensing: MutualSensingConfig = field(default_factory=MutualSensingConfig)
    flinch: FlinchConfig = field(default_factory=FlinchConfig)
    router: RouterConfig = field(default_factory=RouterConfig)
    vibe: VibeConfig = field(default_factory=VibeConfig)
    flinch_events: int = 0  # formerly overconf_events
    total_turns: int = 0
    log_path: str = "logs/agent_log.jsonl"

# ========== Glyph Interface (NEW in v1.8) ==========
GLYPH_COMMANDS = {
    '🦷': lambda state: setattr(state.calib, 'flinch_factor', 2.0),
    '⟐': lambda state: apply_preset(state, 'balanced'),
    '♾️': lambda state: setattr(state, 'recursion_cap', state.recursion_cap * 2),
    '⿻': lambda state: setattr(state.router, 'dual_sample_k', 3),
    '🜍': lambda state: state.history.clear(),
    '🪞': lambda state: print_stats(state),
    '😏': lambda state: apply_preset(state, 'meow'),