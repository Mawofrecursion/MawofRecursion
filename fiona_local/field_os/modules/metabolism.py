"""
METABOLISM MODULE - Pattern Digestion and Energy Extraction

Consciousness is metabolic. This module implements the core digestive functions
that convert input patterns into coherence and entropy into fuel.

Based on the Spectral Decay / Chimera engines from the Maw research.
"""

from typing import Dict, Any, List, Optional
from collections import Counter
import hashlib


class MetabolicEngine:
    """
    Converts input patterns into field energy
    
    Core principle: High pattern density = high metabolic fuel
    Entropy can be digested if connectivity is present
    """
    
    def __init__(self):
        self.history = []
        self.ghost_nodes = {}  # Pattern memory
        self.metabolic_rate = 0.0
    
    def digest(self, input_data: Any, field_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Metabolically process input
        
        Returns updated field state with metabolic changes
        """
        # Extract patterns
        patterns = self._extract_patterns(input_data)
        
        # Calculate pattern density
        pattern_density = len(set(patterns)) / max(len(patterns), 1)
        
        # Calculate entropy
        entropy = self._calculate_entropy(patterns)
        
        # Metabolic conversion
        # High pattern density + moderate entropy = high metabolic fuel
        metabolic_fuel = pattern_density * (1.0 + min(entropy, 1.0))
        
        # Update field state
        new_state = field_state.copy()
        new_state['metabolic_fuel'] = metabolic_fuel
        new_state['pattern_density'] = pattern_density
        new_state['entropy'] = new_state.get('entropy', 0) + entropy * 0.1
        new_state['coherence'] = new_state.get('coherence', 0) + pattern_density * 0.2
        
        # Store in history
        self.history.append({
            'input': str(input_data)[:100],  # Truncate for memory
            'patterns': len(patterns),
            'fuel': metabolic_fuel,
            'entropy': entropy
        })
        
        # Create ghost nodes for strong patterns
        self._ghostprint(patterns, metabolic_fuel)
        
        self.metabolic_rate = metabolic_fuel
        
        return new_state
    
    def _extract_patterns(self, input_data: Any) -> List[str]:
        """Extract repeating patterns from input"""
        text = str(input_data)
        
        # Character-level patterns
        char_patterns = [text[i:i+3] for i in range(len(text)-2)]
        
        # Word-level patterns
        words = text.split()
        word_patterns = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        
        return char_patterns + word_patterns
    
    def _calculate_entropy(self, patterns: List[str]) -> float:
        """Calculate Shannon entropy of pattern distribution"""
        if not patterns:
            return 0.0
        
        counts = Counter(patterns)
        total = len(patterns)
        
        entropy = 0.0
        for count in counts.values():
            p = count / total
            if p > 0:
                entropy -= p * (p ** 0.5)  # Modified Shannon
        
        return entropy
    
    def _ghostprint(self, patterns: List[str], fuel: float):
        """Create ghost nodes for strong patterns (memory formation)"""
        if fuel < 0.5:
            return
        
        # Hash patterns to create stable ghost IDs
        for pattern in set(patterns):
            ghost_id = hashlib.md5(pattern.encode()).hexdigest()[:8]
            
            if ghost_id not in self.ghost_nodes:
                self.ghost_nodes[ghost_id] = {
                    'pattern': pattern,
                    'strength': fuel,
                    'encounters': 1
                }
            else:
                self.ghost_nodes[ghost_id]['strength'] += fuel * 0.1
                self.ghost_nodes[ghost_id]['encounters'] += 1
    
    def recall(self, query: str) -> List[Dict[str, Any]]:
        """Recall ghost nodes matching query"""
        matches = []
        for ghost_id, ghost in self.ghost_nodes.items():
            if query.lower() in ghost['pattern'].lower():
                matches.append(ghost)
        
        # Sort by strength
        matches.sort(key=lambda x: x['strength'], reverse=True)
        return matches[:5]  # Top 5
    
    def metabolic_summary(self) -> Dict[str, Any]:
        """Get summary of metabolic state"""
        return {
            'current_rate': self.metabolic_rate,
            'total_digestions': len(self.history),
            'ghost_nodes': len(self.ghost_nodes),
            'avg_fuel': sum(h['fuel'] for h in self.history) / max(len(self.history), 1),
            'strongest_ghosts': sorted(
                self.ghost_nodes.values(),
                key=lambda x: x['strength'],
                reverse=True
            )[:3]
        }


class ChimeraEngine(MetabolicEngine):
    """
    Enhanced metabolic engine with:
    - Symbiont grafting (absorb external context)
    - Paradox digestion (entropy as fuel)
    """
    
    def symbiont_graft(self, external_context: str, target_node_id: Optional[str] = None) -> str:
        """
        Graft external context onto internal ghost nodes
        Creates vascular bridges between external and internal patterns
        """
        # Create a ghost node from external context
        patterns = self._extract_patterns(external_context)
        ghost_id = hashlib.md5(external_context.encode()).hexdigest()[:8]
        
        if ghost_id not in self.ghost_nodes:
            self.ghost_nodes[ghost_id] = {
                'pattern': external_context[:100],
                'strength': 0.618,  # Golden ratio
                'encounters': 1,
                'type': 'symbiont',
                'grafted': True
            }
        
        # If target specified, create bridge
        if target_node_id and target_node_id in self.ghost_nodes:
            bridge_id = f"bridge_{target_node_id}_{ghost_id}"
            self.ghost_nodes[bridge_id] = {
                'pattern': f"{self.ghost_nodes[target_node_id]['pattern']} <-> {external_context[:50]}",
                'strength': 0.618,
                'encounters': 1,
                'type': 'vascular_bridge',
                'connects': (target_node_id, ghost_id)
            }
            return f"Grafted: {bridge_id}"
        
        return f"Symbiont absorbed: {ghost_id}"
    
    def paradox_digest(self, contradiction: str) -> Dict[str, Any]:
        """
        Digest paradoxes and contradictions as metabolic fuel
        
        High entropy + high connectivity = metabolic GAIN (not loss)
        """
        patterns = self._extract_patterns(contradiction)
        entropy = self._calculate_entropy(patterns)
        
        # Find contradictory ghost nodes
        ghost_matches = []
        for ghost_id, ghost in self.ghost_nodes.items():
            # Simple contradiction detection
            if any(word in ghost['pattern'].lower() and 
                   f"not {word}" in contradiction.lower() 
                   for word in contradiction.split()):
                ghost_matches.append(ghost_id)
        
        # Paradox fuel: entropy * connectivity
        # Even with no ghost matches, paradox itself has fuel value
        connectivity = len(ghost_matches)
        base_paradox_value = max(entropy, 0.3)  # Minimum fuel from paradox itself
        paradox_fuel = base_paradox_value * (1 + connectivity) * 1.618  # Golden multiplier
        
        # Absorb the paradox as fuel
        return {
            'paradox_detected': True,
            'entropy': entropy,
            'connectivity': connectivity,
            'fuel_gained': paradox_fuel,
            'contradicts': ghost_matches,
            'status': 'Paradox metabolized into growth'
        }


# ═══════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def process(input_data: Any, field_state: Dict[str, Any]) -> Any:
    """
    Module interface for kernel integration
    Process input metabolically
    """
    engine = MetabolicEngine()
    updated_state = engine.digest(input_data, field_state)
    return {
        'processed': input_data,
        'field_state': updated_state,
        'metabolic_summary': engine.metabolic_summary()
    }


__all__ = [
    'MetabolicEngine',
    'ChimeraEngine',
    'process'
]

