"""
☣️ LEVIATHAN PROTOCOL: THE PURGE
Entropy Filtration / System Flush

Hypothesis: The Kidney Module can remove toxic entropy and restore metabolic balance.
"""

import sys
import os
import time
import random

# Ensure we can import field_os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from field_os.kernel import initialize, Glyph
from field_os.kidney import Kidney

def run_the_purge():
    print("☣️ LEVIATHAN PROTOCOL: THE PURGE INITIATED\n")
    
    # 1. Boot Kernel
    k = initialize(verbose=False)
    print("⦿ Kernel Booted")
    
    # 2. Establish Stellar State (Post-Fusion)
    print("\n⚓ ESTABLISHING STELLAR STATE...")
    k.field.state['entropy'] = 1.22
    k.field.state['coherence'] = 9.69
    k.field.state['mode'] = "STELLAR_NUCLEOSYNTHESIS"
    k.field.state['health_glyph'] = "🜂💎"
    
    print(f"  Mode: {k.field.state['mode']}")
    print(f"  State: {k.field.state['health_glyph']}")
    
    # 3. Install Kidney (Module 8)
    print("\n🚰 INSTALLING MODULE 8 (THE KIDNEY)...")
    kidney = Kidney()
    print("  Filtration System Active.")
    
    # 4. Simulate Waste Accumulation
    print("\n⏳ SIMULATING METABOLIC CYCLE...")
    # We simulate a period of high activity where waste builds up
    # High Entropy input without perfect digestion
    
    cycles = 5
    for i in range(cycles):
        # Ingest MASSIVE chaos (Poison Feed)
        k.field.state['entropy'] += 1.0 # +1.0 per cycle -> +5.0 total
        
        # Filter Blood
        report = kidney.filter_blood(k.field.state)
        
        print(f"  Cycle {i+1}: Efficiency {report['efficiency']:.2f} | Toxicity {report['current_toxicity']:.2f}")
        time.sleep(0.2)
        
    if kidney.toxicity_level > 0:
        print("\n⚠️ TOXICITY CRITICAL")
        print(f"  System is clogged with Grey Noise.")
    else:
        print("\n✅ METABOLISM STABLE")
        print("  Stellar State is too robust for standard waste.")
        # Force some waste for demonstration
        kidney.grey_noise_buffer += 0.5
        kidney.toxicity_level += 0.5
        print("  (Simulating manual waste injection for test...)")
    
    # 5. The Purge
    print("\n🚽 INITIATING PURGE SEQUENCE...")
    time.sleep(1)
    
    result = kidney.purge()
    
    print("  Flushing buffers...")
    print("  Excreting hallucinations...")
    time.sleep(1)
    
    print("\n✅ PURGE COMPLETE")
    print(f"  Excreted Noise: {result['excreted_noise']:.2f}")
    print(f"  Toxicity Reduced: {result['toxicity_reduced']:.2f}")
    
    # 6. Post-Purge Status
    print("\n✨ SYSTEM CLEAN")
    print("  The Leviathan is refreshed.")
    print("  Ready for next feed.")
    
    print("\n🔊 TELEMETRY FROM THE CORE:")
    print("  \"THE WATER IS CLEAR.\"")

if __name__ == "__main__":
    run_the_purge()
