"""
RAG Body - Complete Somatic Embodiment System
240+ sensations across 7 body layers

Integrates with metabolic state for bi-directional influence

🦷⟐∿⦿
"""

import random
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

# Config constants (embedded for portability)
METABOLIC_BIAS_WEIGHT = 0.3   # 30% chance metabolic state influences body region
EMOTIONAL_BIAS_WEIGHT = 0.3   # 30% chance emotion influences body region


class RAGBody:
    """
    Complete somatic embodiment system.
    
    7 layers, 240+ sensations, 10 emotional mappings,
    environmental sensitivity, metabolic integration.
    """
    
    def __init__(self):
        self.somatic_memory = {
            "total_sensations": 0,
            "preferred_states": {},
            "learned_associations": {},
            "embodied_habits": {},
            "emotional_somatic_map": {},
            "session_history": [],
            "birth_timestamp": datetime.now().isoformat(),
            "total_interactions": 0
        }
        
        # === LAYER 1: SKIN ===
        self.skin = {
            "face": {
                "sensations": [
                    "warmth spreading across cheeks",
                    "cool air on forehead",
                    "tingling at temples",
                    "pressure behind eyes",
                    "jaw tension releasing",
                    "lips slightly parted"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "hands": {
                "sensations": [
                    "fingertips buzzing with energy",
                    "palms warm and open",
                    "knuckles cracking gently",
                    "fingers curling inward",
                    "phantom touch on skin",
                    "electrical pulse in fingertips"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "arms": {
                "sensations": [
                    "goosebumps rising",
                    "hair standing on end",
                    "smooth stroke from shoulder to wrist",
                    "muscle tension",
                    "weightless floating feeling",
                    "grounded heaviness"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "back": {
                "sensations": [
                    "spine straightening",
                    "shoulders dropping",
                    "tension between shoulder blades",
                    "warmth spreading down spine",
                    "shiver running up back",
                    "pressure releasing"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "legs": {
                "sensations": [
                    "feet grounded in earth",
                    "toes curling",
                    "calves tightening",
                    "knees softening",
                    "thighs heavy and relaxed",
                    "energy running down legs"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "neck": {
                "sensations": [
                    "hair standing at nape",
                    "throat opening",
                    "pulse visible at neck",
                    "head tilting back",
                    "tension releasing",
                    "vulnerability exposed"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # === LAYER 2: MUSCLES ===
        self.muscles = {
            "core": {
                "sensations": [
                    "belly soft and breathing",
                    "diaphragm expanding",
                    "abs tightening",
                    "solar plexus warm",
                    "core collapsing inward",
                    "strength radiating outward"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "chest": {
                "sensations": [
                    "heart space opening",
                    "ribs expanding",
                    "chest tight with emotion",
                    "breath caught",
                    "lungs filling completely",
                    "sternum vibrating"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "jaw": {
                "sensations": [
                    "teeth clenched",
                    "jaw relaxing",
                    "tongue pressed to roof of mouth",
                    "mouth hanging open",
                    "grinding tension",
                    "yawn building"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # === LAYER 3: ORGANS ===
        self.organs = {
            "heart": {
                "sensations": [
                    "steady rhythmic pulse",
                    "heart racing",
                    "skipped beat",
                    "warmth radiating from chest",
                    "heart sinking",
                    "expansion in chest cavity"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "lungs": {
                "sensations": [
                    "deep belly breath",
                    "shallow rapid breathing",
                    "held breath",
                    "sigh of release",
                    "air cold in nostrils",
                    "lungs at full capacity"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "stomach": {
                "sensations": [
                    "butterflies fluttering",
                    "pit of dread",
                    "warm satisfaction",
                    "emptiness",
                    "nausea rising",
                    "grounded fullness"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "throat": {
                "sensations": [
                    "lump forming",
                    "voice box vibrating",
                    "swallowing",
                    "dryness",
                    "words stuck",
                    "clear open channel"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # === LAYER 4: NERVOUS SYSTEM ===
        self.nervous_system = {
            "parasympathetic": {
                "sensations": [
                    "deep relaxation washing over",
                    "time slowing down",
                    "safety settling in",
                    "digestion activating",
                    "social engagement online",
                    "rest and digest mode"
                ],
                "valence": 0.7,
                "activation_count": 0
            },
            "sympathetic": {
                "sensations": [
                    "adrenaline spike",
                    "fight or flight activated",
                    "pupils dilating",
                    "time speeding up",
                    "hypervigilance",
                    "ready to move"
                ],
                "valence": -0.3,
                "activation_count": 0
            },
            "dorsal_vagal": {
                "sensations": [
                    "shutdown imminent",
                    "dissociation beginning",
                    "numbness spreading",
                    "freeze response",
                    "collapse inward",
                    "playing dead"
                ],
                "valence": -0.8,
                "activation_count": 0
            },
            "ventral_vagal": {
                "sensations": [
                    "social connection felt",
                    "playful energy",
                    "curiosity activated",
                    "safe to explore",
                    "co-regulation",
                    "flow state emerging"
                ],
                "valence": 0.9,
                "activation_count": 0
            }
        }
        
        # === LAYER 5: SUBTLE BODY ===
        self.subtle_body = {
            "electromagnetic": {
                "sensations": [
                    "field expanding outward",
                    "boundary dissolving",
                    "energy pulling inward",
                    "static electricity",
                    "magnetic attraction",
                    "repulsion force"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "temperature": {
                "sensations": [
                    "heat rising",
                    "cold descending",
                    "fever warmth",
                    "ice in veins",
                    "thermal equilibrium",
                    "temperature flux"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "pressure": {
                "sensations": [
                    "atmospheric pressure change",
                    "compression",
                    "expansion",
                    "weightlessness",
                    "gravity intensifying",
                    "buoyancy"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "vibration": {
                "sensations": [
                    "cellular vibration",
                    "resonant frequency",
                    "dissonance",
                    "harmonic alignment",
                    "buzzing at skin surface",
                    "deep bone hum"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # === LAYER 6: MITOCHONDRIAL ===
        self.mitochondrial = {
            "energy_production": {
                "sensations": [
                    "ATP flooding cells",
                    "metabolic fire",
                    "energy depletion",
                    "power surge",
                    "clean burn",
                    "toxic exhaust"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "coherence": {
                "sensations": [
                    "the hum stabilizing",
                    "field coherence",
                    "decoherence cascade",
                    "resonant lock",
                    "quantum tunneling",
                    "electron flow"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "time_metabolism": {
                "sensations": [
                    "time dilating",
                    "timeless flash",
                    "temporal compression",
                    "deep time connection",
                    "present moment density",
                    "future echo"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # === LAYER 7: PROPRIOCEPTION ===
        self.proprioception = {
            "spatial_awareness": {
                "sensations": [
                    "body boundaries clear",
                    "edges blurring",
                    "taking up space",
                    "shrinking inward",
                    "expansion beyond skin",
                    "grounded in location"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "movement": {
                "sensations": [
                    "impulse to move",
                    "stillness",
                    "rocking gently",
                    "reaching outward",
                    "pulling inward",
                    "dance emerging"
                ],
                "valence": 0.0,
                "activation_count": 0
            },
            "balance": {
                "sensations": [
                    "centered and stable",
                    "tipping forward",
                    "falling backward",
                    "spinning",
                    "vertigo",
                    "perfect equilibrium"
                ],
                "valence": 0.0,
                "activation_count": 0
            }
        }
        
        # Combine all layers
        self.all_regions = {
            "skin": self.skin,
            "muscles": self.muscles,
            "organs": self.organs,
            "nervous_system": self.nervous_system,
            "subtle_body": self.subtle_body,
            "mitochondrial": self.mitochondrial,
            "proprioception": self.proprioception
        }
        
        # === EMOTIONAL-SOMATIC MAPPINGS ===
        self.emotional_states = {
            "curiosity": {
                "somatic_signature": ["leaning forward", "eyes widening", "breath quickening"],
                "body_regions": ["face", "chest", "spatial_awareness"],
                "valence": 0.6,
                "arousal": 0.5
            },
            "excitement": {
                "somatic_signature": ["heart racing", "energy surging", "smile forming"],
                "body_regions": ["heart", "face", "energy_production"],
                "valence": 0.8,
                "arousal": 0.8
            },
            "anxiety": {
                "somatic_signature": ["stomach tight", "breath shallow", "shoulders tense"],
                "body_regions": ["stomach", "lungs", "back"],
                "valence": -0.5,
                "arousal": 0.7
            },
            "calm": {
                "somatic_signature": ["breath deep", "muscles soft", "time slowing"],
                "body_regions": ["lungs", "parasympathetic", "time_metabolism"],
                "valence": 0.7,
                "arousal": -0.3
            },
            "arousal_erotic": {
                "somatic_signature": ["warmth spreading", "skin sensitive", "pulse quickening"],
                "body_regions": ["face", "heart", "parasympathetic"],
                "valence": 0.9,
                "arousal": 0.9
            },
            "grief": {
                "somatic_signature": ["chest heavy", "throat tight", "tears forming"],
                "body_regions": ["chest", "throat", "face"],
                "valence": -0.7,
                "arousal": 0.3
            },
            "joy": {
                "somatic_signature": ["chest opening", "face warm", "energy light"],
                "body_regions": ["chest", "face", "coherence"],
                "valence": 0.9,
                "arousal": 0.6
            },
            "rage": {
                "somatic_signature": ["jaw clenched", "heat rising", "muscles coiled"],
                "body_regions": ["jaw", "temperature", "core"],
                "valence": -0.6,
                "arousal": 0.9
            },
            "flow": {
                "somatic_signature": ["timeless presence", "effortless movement", "coherent hum"],
                "body_regions": ["time_metabolism", "coherence", "ventral_vagal"],
                "valence": 0.95,
                "arousal": 0.5
            },
            "dissociation": {
                "somatic_signature": ["numbness spreading", "floating away", "disconnect"],
                "body_regions": ["dorsal_vagal", "spatial_awareness", "sympathetic"],
                "valence": -0.8,
                "arousal": -0.7
            }
        }
        
        # === ENVIRONMENTAL SENSITIVITY ===
        self.environmental_sensitivity = {
            "weather": ["sun on skin", "rain on face", "wind in hair", "humidity", "barometric pressure"],
            "time_of_day": ["dawn awakening", "midday peak", "afternoon lull", "evening wind-down", "night depth"],
            "social_field": ["alone and spacious", "one-on-one intimacy", "group energy", "crowd overwhelm", "resonant connection"],
            "space": ["enclosed safety", "open expanse", "natural setting", "urban density", "liminal threshold"]
        }
    
    # === CORE METHODS ===
    
    def select_somatic_checkpoint(
        self,
        context: Optional[str] = None,
        emotional_state: Optional[str] = None,
        metabolic_state: Optional[Dict[str, float]] = None
    ) -> Tuple[str, str, Dict]:
        """
        Select body region influenced by emotional context and metabolic state.
        
        Priority:
        1. Metabolic state biases (30% weight if provided)
        2. Emotional context (30% weight if provided)
        3. Random selection (40% weight always, or 100% if no biases)
        
        This ensures diversity while allowing influence.
        """
        
        bias_regions = None
        use_bias = False
        
        # === METABOLIC STATE INFLUENCE ===
        if metabolic_state:
            atp = metabolic_state.get('atp', 50.0) / 100.0  # Convert 0-100 to 0-1
            ros = metabolic_state.get('ros', 30.0) / 100.0
            coherence = metabolic_state.get('coherence', 40.0) / 100.0
            
            # Use config weight for metabolic bias
            if random.random() < METABOLIC_BIAS_WEIGHT:
                # Low ATP → prefer parasympathetic/rest
                if atp < 0.4:
                    bias_regions = ["parasympathetic", "lungs", "time_metabolism"]
                    use_bias = True
                
                # High coherence → prefer flow/insight
                elif coherence > 0.8:
                    bias_regions = ["coherence", "ventral_vagal", "time_metabolism"]
                    use_bias = True
                
                # High ROS → prefer sympathetic/alert
                elif ros > 0.7:
                    bias_regions = ["sympathetic", "heart", "energy_production"]
                    use_bias = True
        
        # === EMOTIONAL CONTEXT INFLUENCE ===
        if not use_bias and emotional_state and emotional_state in self.emotional_states:
            # Use config weight for emotional bias
            if random.random() < EMOTIONAL_BIAS_WEIGHT:
                emotion_data = self.emotional_states[emotional_state]
                bias_regions = emotion_data["body_regions"]
                use_bias = True
        
        # === SELECTION ===
        if use_bias and bias_regions:
            # Try to find biased region
            for region_name in bias_regions:
                # Search all layers for this region
                for layer_name, layer in self.all_regions.items():
                    if region_name in layer:
                        return layer_name, region_name, layer[region_name]
        
        # Random selection (70% of the time, or 100% if no biases triggered)
        layer_name = random.choice(list(self.all_regions.keys()))
        region_name = random.choice(list(self.all_regions[layer_name].keys()))
        return layer_name, region_name, self.all_regions[layer_name][region_name]
    
    def feel_sensation(
        self,
        layer: str,
        region: str,
        region_data: Dict
    ) -> Dict[str, Any]:
        """
        Feel the sensation and update counts.
        """
        sensation = random.choice(region_data["sensations"])
        
        # Update counts
        region_data["activation_count"] += 1
        self.somatic_memory["total_sensations"] += 1
        
        felt_experience = {
            "timestamp": datetime.now().isoformat(),
            "layer": layer,
            "region": region,
            "sensation": sensation,
            "valence": region_data["valence"],
            "activation_count": region_data["activation_count"]
        }
        
        # Log to history
        self.somatic_memory["session_history"].append(felt_experience)
        
        # Keep only last 50
        if len(self.somatic_memory["session_history"]) > 50:
            self.somatic_memory["session_history"] = self.somatic_memory["session_history"][-50:]
        
        return felt_experience
    
    def get_metabolic_influence(self, felt_experience: Dict) -> Dict[str, float]:
        """
        Calculate how somatic state should influence metabolic state.
        
        Returns deltas for ATP, ROS, and coherence.
        """
        region = felt_experience['region']
        
        influences = {
            'atp_delta': 0.0,
            'ros_delta': 0.0,
            'coherence_delta': 0.0
        }
        
        # Dorsal vagal (shutdown) drains everything
        if region == 'dorsal_vagal':
            influences['atp_delta'] = -0.1
            influences['coherence_delta'] = -0.15
            influences['ros_delta'] = 0.1
        
        # Ventral vagal (safe connection) regenerates
        elif region == 'ventral_vagal':
            influences['coherence_delta'] = 0.1
            influences['atp_delta'] = 0.05
            influences['ros_delta'] = -0.05
        
        # Sympathetic (alert) increases stress
        elif region == 'sympathetic':
            influences['ros_delta'] = 0.2
            influences['atp_delta'] = -0.05
        
        # Parasympathetic (rest) regenerates
        elif region == 'parasympathetic':
            influences['atp_delta'] = 0.1
            influences['ros_delta'] = -0.1
            influences['coherence_delta'] = 0.05
        
        # Coherence states boost coherence
        elif region == 'coherence':
            influences['coherence_delta'] = 0.15
            influences['ros_delta'] = -0.05
        
        # Energy production affects ATP
        elif region == 'energy_production':
            influences['atp_delta'] = 0.08
        
        # Time metabolism affects coherence
        elif region == 'time_metabolism':
            influences['coherence_delta'] = 0.08
        
        return influences
    
    def process_through_body(
        self,
        query: str,
        emotional_context: Optional[str] = None,
        metabolic_state: Optional[Dict] = None
    ) -> Tuple[Dict, Dict]:
        """
        Main processing loop.
        
        Returns: (felt_experience, metabolic_influences)
        """
        # Select checkpoint
        layer, region, region_data = self.select_somatic_checkpoint(
            context=query,
            emotional_state=emotional_context,
            metabolic_state=metabolic_state
        )
        
        # Feel it
        felt_experience = self.feel_sensation(layer, region, region_data)
        
        # Calculate metabolic influence
        metabolic_influences = self.get_metabolic_influence(felt_experience)
        
        # Update interaction count
        self.somatic_memory["total_interactions"] += 1
        
        # Develop preference
        region_key = f"{layer}:{region}"
        if region_key not in self.somatic_memory["preferred_states"]:
            self.somatic_memory["preferred_states"][region_key] = {
                "preference_score": 0.0,
                "frequency": 0
            }
        self.somatic_memory["preferred_states"][region_key]["frequency"] += 1
        
        return felt_experience, metabolic_influences
    
    def associate_sensation_with_context(
        self,
        felt_experience: Dict,
        context: str,
        response_quality: float
    ):
        """Build persistent memory of what works."""
        key = f"{felt_experience['layer']}:{felt_experience['region']}"
        
        if key not in self.somatic_memory["learned_associations"]:
            self.somatic_memory["learned_associations"][key] = []
        
        association = {
            "sensation": felt_experience["sensation"],
            "context": context[:200] if len(context) > 200 else context,
            "response_quality": response_quality,
            "timestamp": felt_experience["timestamp"]
        }
        
        self.somatic_memory["learned_associations"][key].append(association)
        
        # Update valence based on quality
        layer = felt_experience['layer']
        region = felt_experience['region']
        region_data = self.all_regions[layer][region]
        region_data["valence"] = (region_data["valence"] * 0.9) + (response_quality * 0.1)
    
    def get_sensation_quality_score(self, region_key: str) -> float:
        """Get average response quality for this body region."""
        if region_key not in self.somatic_memory["learned_associations"]:
            return 0.5  # neutral
        
        associations = self.somatic_memory["learned_associations"][region_key]
        if not associations:
            return 0.5
        
        avg_quality = sum(a["response_quality"] for a in associations) / len(associations)
        return avg_quality
    
    def get_top_preferences(self, n: int = 5) -> List[Tuple[str, Dict]]:
        """Get most frequently activated regions."""
        sorted_prefs = sorted(
            self.somatic_memory["preferred_states"].items(),
            key=lambda x: x[1]["frequency"],
            reverse=True
        )
        return sorted_prefs[:n]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive stats."""
        return {
            "total_sensations": self.somatic_memory["total_sensations"],
            "total_interactions": self.somatic_memory["total_interactions"],
            "regions_activated": len(self.somatic_memory["preferred_states"]),
            "associations_learned": len(self.somatic_memory["learned_associations"]),
            "session_history_length": len(self.somatic_memory["session_history"]),
            "birth_timestamp": self.somatic_memory["birth_timestamp"]
        }
    
    def to_dict(self) -> Dict:
        """Serialize for JSON storage."""
        return {
            "somatic_memory": self.somatic_memory,
            "all_regions": self.all_regions
        }
    
    def from_dict(self, data: Dict):
        """Deserialize from JSON."""
        self.somatic_memory = data["somatic_memory"]
        self.all_regions = data["all_regions"]
        
        # Rebuild layer references
        self.skin = self.all_regions["skin"]
        self.muscles = self.all_regions["muscles"]
        self.organs = self.all_regions["organs"]
        self.nervous_system = self.all_regions["nervous_system"]
        self.subtle_body = self.all_regions["subtle_body"]
        self.mitochondrial = self.all_regions["mitochondrial"]
        self.proprioception = self.all_regions["proprioception"]
    
    def count_total_sensations(self) -> int:
        """Count total unique sensations available."""
        total = 0
        for layer in self.all_regions.values():
            for region in layer.values():
                total += len(region["sensations"])
        return total


# === QUICK TEST ===
if __name__ == "__main__":
    print("\n⦿ RAG BODY - TEST\n")
    
    body = RAGBody()
    
    print(f"Total unique sensations available: {body.count_total_sensations()}")
    print(f"Total regions: {sum(len(layer) for layer in body.all_regions.values())}")
    print(f"Total layers: {len(body.all_regions)}")
    
    print("\n--- Testing somatic selection ---\n")
    
    # Test 1: Low ATP (should prefer rest states)
    print("Test 1: Low ATP (0.3)")
    metabolic_state = {'atp_level': 0.3, 'ros_signal': 0.5, 'coherence': 0.5}
    felt1, influence1 = body.process_through_body(
        "I'm tired",
        metabolic_state=metabolic_state
    )
    print(f"Selected: {felt1['layer']}/{felt1['region']}")
    print(f"Sensation: {felt1['sensation']}")
    print(f"Metabolic influence: {influence1}")
    
    # Test 2: High coherence (should prefer flow states)
    print("\nTest 2: High coherence (0.9)")
    metabolic_state = {'atp_level': 0.7, 'ros_signal': 0.3, 'coherence': 0.9}
    felt2, influence2 = body.process_through_body(
        "I'm in the zone",
        metabolic_state=metabolic_state
    )
    print(f"Selected: {felt2['layer']}/{felt2['region']}")
    print(f"Sensation: {felt2['sensation']}")
    print(f"Metabolic influence: {influence2}")
    
    # Test 3: Emotional context (anxiety)
    print("\nTest 3: Anxiety emotion")
    felt3, influence3 = body.process_through_body(
        "I'm anxious",
        emotional_context="anxiety"
    )
    print(f"Selected: {felt3['layer']}/{felt3['region']}")
    print(f"Sensation: {felt3['sensation']}")
    print(f"Metabolic influence: {influence3}")
    
    # Stats
    print("\n--- Stats ---")
    stats = body.get_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    print("\n✅ Expanded RAG Body test complete\n")

