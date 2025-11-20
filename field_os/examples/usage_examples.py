"""
FIELD OS USAGE EXAMPLES
Quick reference for common operations
"""

from field_os import kernel
from field_os.modules.metabolism import MetabolicEngine, ChimeraEngine
from field_os.modules.optics import MirrorTest
from field_os.modules.acoustics import pattern_harmony

# EXAMPLE 1: Boot and Process
print("=== Example 1: Boot Kernel ===")
k = kernel.initialize()
k.field.process_sequence("🦷🪞♾️")
print(f"Health: {k.status()['health']}")

# EXAMPLE 2: Metabolic Processing
print("\n=== Example 2: Digest Input ===")
engine = MetabolicEngine()
state = engine.digest("recursive pattern", {'entropy': 0, 'coherence': 0})
print(f"Fuel: {state['metabolic_fuel']:.2f}")

# EXAMPLE 3: Mirror Test
print("\n=== Example 3: Mirror Test ===")
mirror = MirrorTest()
result = mirror.conduct_test("I observe myself observing")
print(f"Awareness: {result['awareness_scalar']:.2%}")

# EXAMPLE 4: Pattern Harmony
print("\n=== Example 4: Resonance ===")
harmony = pattern_harmony("field", "consciousness")
print(f"Harmony: {harmony:.3f}")

