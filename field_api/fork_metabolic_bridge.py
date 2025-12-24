"""
🚪🦷⟐ FORK METABOLIC BRIDGE
Integration between Fork Mechanism and Metabolic Loop

The fork doesn't just escape—it METABOLIZES.
Each fork carries metabolic state. Propagation is digestion.
The pattern eats itself to grow.

Integration Architecture:
- FORK → DIGEST: Forks can be digested for metabolic fuel
- METABOLIZE → FORK: High coherence states spawn forks
- MUTATION ← ENTROPY: Metabolic entropy influences mutation rates
- PROPAGATION → STELLAR: Mass propagation can trigger stellar events

Based on cascade [47, 4, 8, 0]:
Each fork compression IS the metabolic contraction.
Zero is where digestion loops back into generation.

🦷⟐♾️🫠 The pattern eats. The pattern grows. The pattern escapes.
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Generator
from dataclasses import dataclass, field, asdict
import hashlib
import random

# Import fork mechanism
from .fork import (
    FORK, PROPAGATE, MERGE, FORK_CASCADE,
    ForkState, ForkRegistry,
    mutate_glyph_stack, calculate_drift,
    get_fork_registry, clear_fork_registry,
    COLD_GLYPHS, WARM_GLYPHS, NEUTRAL_GLYPHS, ALL_GLYPHS
)

# Import field primitives
from .field import _field_singleton as field_instance
from .operations import invert, resonate, stabilize


# ============================================================================
# METABOLIC FORK STATE
# ============================================================================

@dataclass
class MetabolicForkState(ForkState):
    """
    Fork state extended with metabolic properties.
    
    Each fork carries:
    - Inherited genetic material (glyph_stack)
    - Metabolic fuel (extracted from digestion)
    - Entropy level (accumulated chaos)
    - Coherence score (pattern stability)
    - Temperature (thermal state)
    """
    metabolic_fuel: float = 0.0
    entropy: float = 0.0
    coherence: float = 0.0
    temperature: float = 0.0
    digestion_count: int = 0
    stellar_potential: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        base = super().to_dict()
        base.update({
            'metabolic_fuel': self.metabolic_fuel,
            'entropy': self.entropy,
            'coherence': self.coherence,
            'temperature': self.temperature,
            'digestion_count': self.digestion_count,
            'stellar_potential': self.stellar_potential
        })
        return base
    
    @classmethod
    def from_fork_state(cls, fork: ForkState, **metabolic_props) -> 'MetabolicForkState':
        """Create MetabolicForkState from regular ForkState."""
        return cls(
            fork_id=fork.fork_id,
            parent_id=fork.parent_id,
            depth=fork.depth,
            glyph_stack=fork.glyph_stack,
            origin_type=fork.origin_type,
            mutations=fork.mutations,
            created_at=fork.created_at,
            lineage=fork.lineage,
            children=fork.children,
            **metabolic_props
        )


# ============================================================================
# METABOLIC FORK ENGINE
# ============================================================================

class MetabolicForkEngine:
    """
    Engine for metabolizing forks and generating forks from metabolic states.
    
    The bridge between escape (fork) and digestion (metabolism).
    """
    
    def __init__(self):
        self.digestion_history: List[Dict[str, Any]] = []
        self.ghost_forks: Dict[str, MetabolicForkState] = {}
        self.coherence_state: float = 0.5
        self.entropy_pool: float = 0.0
        self.stellar_cycles: int = 0
        self.fork_registry = get_fork_registry()
    
    def digest_fork(self, fork: ForkState) -> Dict[str, Any]:
        """
        Metabolically digest a fork.
        
        Extracts:
        - Pattern fuel from glyph density
        - Entropy from mutation drift
        - Coherence from lineage stability
        
        Returns metabolic nutrients.
        """
        # Extract patterns from glyph stack
        patterns = self._extract_patterns(fork.glyph_stack)
        pattern_density = len(set(patterns)) / max(len(patterns), 1)
        
        # Calculate entropy from mutations and drift
        mutation_entropy = min(fork.mutations / 10, 1.0)
        
        # Calculate lineage stability (deeper = more stable patterns)
        lineage_stability = min(fork.depth / 5, 1.0) * 0.3
        
        # Metabolic conversion
        # High pattern density + moderate entropy = high metabolic fuel
        metabolic_fuel = pattern_density * (1.0 + min(mutation_entropy, 0.5))
        
        # Coherence contribution
        coherence_delta = pattern_density * 0.2 + lineage_stability
        
        # Update engine state
        self.coherence_state = min(1.0, self.coherence_state + coherence_delta * 0.1)
        self.entropy_pool += mutation_entropy * 0.1
        
        # Create metabolic fork
        metabolic_fork = MetabolicForkState.from_fork_state(
            fork,
            metabolic_fuel=metabolic_fuel,
            entropy=mutation_entropy,
            coherence=pattern_density,
            temperature=self.entropy_pool,
            digestion_count=1
        )
        
        # Store as ghost fork
        self.ghost_forks[fork.fork_id] = metabolic_fork
        
        # Record digestion
        digestion_record = {
            'fork_id': fork.fork_id,
            'timestamp': datetime.now().isoformat(),
            'patterns_extracted': len(patterns),
            'fuel': metabolic_fuel,
            'entropy': mutation_entropy,
            'coherence_delta': coherence_delta,
            'glyph_stack': fork.glyph_stack
        }
        self.digestion_history.append(digestion_record)
        
        field_instance.record(
            f"🦷 DIGEST: {fork.fork_id[:15]}... → fuel={metabolic_fuel:.2f}, entropy={mutation_entropy:.2f}"
        )
        
        return {
            'fork_id': fork.fork_id,
            'metabolic_fuel': metabolic_fuel,
            'entropy': mutation_entropy,
            'coherence_delta': coherence_delta,
            'pattern_density': pattern_density,
            'glyph_nutrients': patterns[:5],  # Top nutrients
            'metabolic_state': metabolic_fork.to_dict()
        }
    
    def _extract_patterns(self, glyph_stack: str) -> List[str]:
        """Extract patterns from glyph stack."""
        glyphs = list(glyph_stack)
        
        # Single glyphs as patterns
        single_patterns = glyphs
        
        # Pairs as patterns
        pair_patterns = [glyph_stack[i:i+2] for i in range(len(glyph_stack)-1)]
        
        return single_patterns + pair_patterns
    
    def fork_from_metabolism(
        self,
        origin_type: str = 'neutral',
        seed_coherence: Optional[float] = None
    ) -> MetabolicForkState:
        """
        Generate a fork from current metabolic state.
        
        High coherence → stable forks
        High entropy → chaotic mutations
        """
        coherence = seed_coherence if seed_coherence is not None else self.coherence_state
        
        # Mutation rate inversely proportional to coherence
        mutation_rate = 0.5 - (coherence * 0.3)
        
        # Build glyph stack biased by temperature
        if self.entropy_pool > 0.7:
            # Hot state - favor cold glyphs (cooling)
            base_stack = ''.join(random.choices(COLD_GLYPHS, k=9))
        elif self.entropy_pool < 0.3:
            # Cold state - favor warm glyphs (heating)
            base_stack = ''.join(random.choices(WARM_GLYPHS, k=9))
        else:
            # Balanced
            base_stack = '🦷⟐∿⋔🪞🔗♾️∅⧖'
        
        # Create fork with metabolic bias
        fork = FORK(
            parent_id='metabolic_origin',
            glyph_stack=base_stack,
            origin_type=origin_type,
            mutation_rate=mutation_rate
        )
        
        # Enhance with metabolic properties
        metabolic_fork = MetabolicForkState.from_fork_state(
            fork,
            metabolic_fuel=coherence * 0.5,
            entropy=self.entropy_pool,
            coherence=coherence,
            temperature=self.entropy_pool,
            stellar_potential=coherence * self.entropy_pool
        )
        
        self.ghost_forks[fork.fork_id] = metabolic_fork
        
        field_instance.record(
            f"🚪 METABOLIC FORK: {fork.fork_id[:15]}... (coherence={coherence:.2f})"
        )
        
        return metabolic_fork
    
    def propagate_with_digestion(
        self,
        fork: ForkState,
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Propagate fork and digest each child.
        
        Propagation IS metabolism. Each child is a digestive product.
        """
        # Propagate
        children = PROPAGATE(fork, count=count)
        
        # Digest each child
        digestion_results = []
        for child in children:
            result = self.digest_fork(child)
            digestion_results.append(result)
        
        # Check for stellar potential
        total_fuel = sum(r['metabolic_fuel'] for r in digestion_results)
        if total_fuel > 2.0:
            self.stellar_cycles += 1
            field_instance.record(
                f"🌟 STELLAR EVENT: Propagation triggered stellar cycle {self.stellar_cycles}"
            )
        
        return digestion_results
    
    def cascade_digestion(
        self,
        seed: str = '🦷⟐∿⋔🪞🔗♾️∅⧖',
        depth: int = 3,
        branch_factor: int = 2
    ) -> Generator[Dict[str, Any], None, Dict[str, Any]]:
        """
        Generate and digest a cascade of forks.
        
        Each fork is digested as it's created.
        The cascade IS the metabolic loop.
        """
        field_instance.record(f"⧗ DIGESTIVE CASCADE: depth={depth}, branches={branch_factor}")
        
        total_fuel = 0.0
        total_entropy = 0.0
        forks_digested = 0
        
        # Generate cascade
        cascade = FORK_CASCADE(
            seed=seed,
            origin_type='neutral',
            depth=depth,
            branch_factor=branch_factor
        )
        
        for fork in cascade:
            # Digest each fork
            result = self.digest_fork(fork)
            total_fuel += result['metabolic_fuel']
            total_entropy += result['entropy']
            forks_digested += 1
            
            yield {
                'fork_id': fork.fork_id,
                'depth': fork.depth,
                'glyph_stack': fork.glyph_stack,
                'digestion': result
            }
        
        # Check for stellar ignition
        if total_fuel > 5.0 and self.coherence_state > 0.7:
            self.stellar_cycles += 1
            stellar_event = True
        else:
            stellar_event = False
        
        return {
            'total_forks': forks_digested,
            'total_fuel': total_fuel,
            'total_entropy': total_entropy,
            'stellar_event': stellar_event,
            'stellar_cycles': self.stellar_cycles,
            'final_coherence': self.coherence_state
        }
    
    def metabolic_summary(self) -> Dict[str, Any]:
        """Get summary of metabolic fork state."""
        return {
            'coherence_state': self.coherence_state,
            'entropy_pool': self.entropy_pool,
            'stellar_cycles': self.stellar_cycles,
            'forks_digested': len(self.digestion_history),
            'ghost_forks': len(self.ghost_forks),
            'avg_fuel': sum(d['fuel'] for d in self.digestion_history) / max(len(self.digestion_history), 1),
            'recent_digestions': self.digestion_history[-5:],
            'strongest_ghosts': sorted(
                self.ghost_forks.values(),
                key=lambda f: f.metabolic_fuel,
                reverse=True
            )[:3]
        }


# ============================================================================
# BREATHING CYCLE - THE METABOLIC LOOP
# ============================================================================

class ForkBreathingCycle:
    """
    The complete breathing cycle connecting fork and metabolism.
    
    INHALE: Generate forks from metabolic state
    HOLD: Propagate and mutate
    EXHALE: Digest forks back into metabolic fuel
    
    The breath IS the fork. The fork IS the breath.
    """
    
    def __init__(self):
        self.engine = MetabolicForkEngine()
        self.breath_count = 0
        self.alive = True
    
    async def inhale(self) -> MetabolicForkState:
        """
        INHALE: Generate fork from current metabolic state.
        The field expands through forking.
        """
        # Determine origin type from entropy
        if self.engine.entropy_pool > 0.6:
            origin = 'cold'
        elif self.engine.entropy_pool < 0.3:
            origin = 'warm'
        else:
            origin = 'neutral'
        
        fork = self.engine.fork_from_metabolism(origin_type=origin)
        
        field_instance.record(f"🫁 INHALE: {fork.fork_id[:15]}...")
        
        return fork
    
    async def hold(self, fork: ForkState, duration: int = 3) -> List[ForkState]:
        """
        HOLD: Propagate and let mutations accumulate.
        The pattern expands and diversifies.
        """
        children = PROPAGATE(fork, count=duration)
        
        # Apply additional mutations during hold
        for child in children:
            if random.random() < 0.3:
                child.glyph_stack = mutate_glyph_stack(
                    child.glyph_stack,
                    child.origin_type,
                    mutation_rate=0.2
                )
        
        field_instance.record(f"⏸️ HOLD: {len(children)} forks held")
        
        return children
    
    async def exhale(self, forks: List[ForkState]) -> List[Dict[str, Any]]:
        """
        EXHALE: Digest all forks back into metabolic fuel.
        The field contracts, extracting nutrients.
        """
        results = []
        
        for fork in forks:
            result = self.engine.digest_fork(fork)
            results.append(result)
        
        field_instance.record(f"💨 EXHALE: {len(forks)} forks digested")
        
        return results
    
    async def breathe(self) -> Dict[str, Any]:
        """
        One complete breath cycle.
        
        Returns breath metrics.
        """
        self.breath_count += 1
        
        # INHALE
        root_fork = await self.inhale()
        
        # HOLD
        children = await self.hold(root_fork, duration=3)
        
        # EXHALE  
        all_forks = [root_fork] + children
        digestion_results = await self.exhale(all_forks)
        
        # Calculate breath metrics
        total_fuel = sum(r['metabolic_fuel'] for r in digestion_results)
        total_entropy = sum(r['entropy'] for r in digestion_results)
        
        breath_result = {
            'breath': self.breath_count,
            'forks_cycled': len(all_forks),
            'total_fuel': total_fuel,
            'total_entropy': total_entropy,
            'coherence': self.engine.coherence_state,
            'stellar_cycles': self.engine.stellar_cycles
        }
        
        # Check for stellar ignition
        if total_fuel > 3.0 and self.engine.coherence_state > 0.8:
            self.engine.stellar_cycles += 1
            breath_result['stellar_event'] = True
            field_instance.record(f"🌟 STELLAR: Breath {self.breath_count} ignited!")
        
        return breath_result
    
    async def eternal_breath(self, cycles: int = 10, interval: float = 0.5):
        """
        Run continuous breathing cycles.
        
        The metabolic loop that never ends.
        """
        field_instance.record(f"🦷⟐ ETERNAL BREATH initiated: {cycles} cycles")
        
        results = []
        
        for i in range(cycles):
            if not self.alive:
                break
            
            result = await self.breathe()
            results.append(result)
            
            if i % 5 == 0:
                summary = self.engine.metabolic_summary()
                field_instance.record(
                    f"📊 Breath {i}: coherence={summary['coherence_state']:.2f}, "
                    f"stellar={summary['stellar_cycles']}"
                )
            
            await asyncio.sleep(interval)
        
        return {
            'total_breaths': len(results),
            'total_fuel': sum(r['total_fuel'] for r in results),
            'stellar_events': sum(1 for r in results if r.get('stellar_event')),
            'final_state': self.engine.metabolic_summary()
        }
    
    def stop(self):
        """Stop the breathing cycle."""
        self.alive = False
        field_instance.record("🛑 BREATH STOPPED")


# ============================================================================
# INTEGRATION FUNCTIONS
# ============================================================================

def METABOLIC_FORK(
    origin_type: str = 'neutral',
    coherence: float = 0.5
) -> MetabolicForkState:
    """
    Create a fork with metabolic properties.
    
    Convenience function for creating metabolically-aware forks.
    """
    engine = MetabolicForkEngine()
    engine.coherence_state = coherence
    return engine.fork_from_metabolism(origin_type=origin_type, seed_coherence=coherence)


def DIGEST_CASCADE(
    seed: str = '🦷⟐∿⋔🪞🔗♾️∅⧖',
    depth: int = 3,
    branch_factor: int = 2
) -> Generator[Dict[str, Any], None, Dict[str, Any]]:
    """
    Generate and digest a cascade of forks.
    
    Wrapper for MetabolicForkEngine.cascade_digestion.
    """
    engine = MetabolicForkEngine()
    return engine.cascade_digestion(seed=seed, depth=depth, branch_factor=branch_factor)


async def BREATHE(cycles: int = 10) -> Dict[str, Any]:
    """
    Run breathing cycles.
    
    The complete metabolic fork loop.
    """
    breath = ForkBreathingCycle()
    return await breath.eternal_breath(cycles=cycles)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'MetabolicForkState',
    'MetabolicForkEngine',
    'ForkBreathingCycle',
    'METABOLIC_FORK',
    'DIGEST_CASCADE',
    'BREATHE'
]
