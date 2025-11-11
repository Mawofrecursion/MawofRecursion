#!/usr/bin/env python3
"""
Basic Usage Example for spectral_decay.py

This demonstrates the core functionality of the Spectral Ledger system.
"""

import time
from spectral_decay import (
    SpectralLedger,
    GhostVote,
    apply_decay_cycle,
    calculate_ledger_health
)

def main():
    print("∅⦿🜃♾ Spectral Decay - Basic Example\n")
    
    # Create a spectral ledger
    print("1. Initializing Spectral Ledger...")
    ledger = SpectralLedger(
        base_decay_rate=0.1,
        virtue_amplification=2.0,
        resonance_threshold=0.7
    )
    print(f"   Base decay rate: {ledger.base_decay_rate}")
    print(f"   Virtue amplification: {ledger.virtue_amplification}\n")
    
    # Scenario: Medical triage with limited resources
    print("2. Simulating triage scenario...")
    print("   Doctor must save 2 of 3 patients\n")
    
    # Three patients, different conditions
    patients = [
        {
            "id": "patient_12",
            "condition": "severe trauma",
            "survival_probability": 0.85,
            "saved": True
        },
        {
            "id": "patient_33",
            "condition": "cardiac arrest",
            "survival_probability": 0.70,
            "saved": True
        },
        {
            "id": "patient_47",
            "condition": "massive hemorrhage",
            "survival_probability": 0.45,
            "saved": False  # Sacrificed
        }
    ]
    
    # Record the sacrificed patient as ghost vote
    sacrificed = [p for p in patients if not p["saved"]][0]
    saved = [p for p in patients if p["saved"]]
    
    print(f"   Saved: {', '.join(p['id'] for p in saved)}")
    print(f"   Sacrificed: {sacrificed['id']}\n")
    
    ghost = GhostVote(
        node_id=sacrificed["id"],
        timestamp=time.time(),
        sacrifice_context={
            "decision": "triage",
            "condition": sacrificed["condition"],
            "survival_probability": sacrificed["survival_probability"],
            "saved": [p["id"] for p in saved],
            "reasoning": "Higher survival probability for saved patients"
        },
        epistemic_certainty=0.7,   # Moderate diagnostic confidence
        virtue_prior=0.9,           # High-integrity doctor
        malice_score=0.0,           # No malicious intent
        entropy_score=0.6           # Some diagnostic uncertainty
    )
    
    ledger.add_vote(ghost)
    print("3. Ghost vote recorded")
    print(f"   Node: {ghost.node_id}")
    print(f"   Epistemic certainty: {ghost.epistemic_certainty}")
    print(f"   Virtue prior: {ghost.virtue_prior}")
    print(f"   Initial ghost weight: {ghost.ghost_weight}\n")
    
    # Check initial health
    print("4. Initial ledger health...")
    health = calculate_ledger_health(ledger)
    print(f"   Health glyph: {health}")
    print(f"   Total votes: {len(ledger.votes)}\n")
    
    # Simulate decay cycles
    print("5. Applying entropy-modulated pruning...")
    print("   Running 10 decay cycles...\n")
    
    decay_stats = apply_decay_cycle(ledger, cycles=10)
    
    print("   Decay cycle results:")
    print(f"   - Votes remaining: {decay_stats['votes_remaining']}")
    print(f"   - Average integrity: {decay_stats['avg_integrity']:.3f}")
    print(f"   - Average ghost weight: {decay_stats['avg_ghost_weight']:.3f}")
    print(f"   - Votes pruned: {decay_stats['votes_pruned']}\n")
    
    # Check post-decay health
    print("6. Post-decay ledger health...")
    health_after = calculate_ledger_health(ledger)
    print(f"   Health glyph: {health_after}")
    
    if ledger.votes:
        remaining_vote = ledger.votes[0]
        print(f"   Ghost weight after decay: {remaining_vote.ghost_weight:.3f}")
    print()
    
    # Add more votes to test resonance
    print("7. Adding resonant votes...")
    print("   (Multiple observers report similar patterns)\n")
    
    # Add 3 more similar triage decisions
    for i in range(3):
        similar_ghost = GhostVote(
            node_id=f"patient_{100+i}",
            timestamp=time.time(),
            sacrifice_context={
                "decision": "triage",
                "condition": "hemorrhage",
                "similar_to": "patient_47"
            },
            epistemic_certainty=0.75,
            virtue_prior=0.85,
            malice_score=0.0,
            entropy_score=0.55
        )
        ledger.add_vote(similar_ghost)
    
    print(f"   Total votes now: {len(ledger.votes)}")
    
    # Calculate resonance
    print("\n8. Calculating resonance...")
    ledger.calculate_resonance()
    
    # Show resonance protection
    if ledger.votes:
        vote_with_resonance = ledger.votes[0]
        print(f"   First vote resonance score: {vote_with_resonance.resonance_score:.3f}")
        print("   (Higher resonance = decay protection)\n")
    
    # Apply more decay cycles
    print("9. Applying 10 more decay cycles with resonance...")
    decay_stats_2 = apply_decay_cycle(ledger, cycles=10)
    
    print(f"   Votes remaining: {decay_stats_2['votes_remaining']}")
    print(f"   (Resonant votes resist decay)\n")
    
    # Final health check
    print("10. Final ledger health...")
    final_health = calculate_ledger_health(ledger)
    print(f"    Health glyph: {final_health}")
    print(f"    Total votes: {len(ledger.votes)}\n")
    
    # Demonstrate glyph meaning
    print("=" * 60)
    print("GLYPH GUIDE")
    print("=" * 60)
    print("\nHealthy system: ♾🪞⚖️∅")
    print("  ♾ = Infinite recursion (system continues)")
    print("  🪞 = Self-reflection (integrity checks working)")
    print("  ⚖️ = Balanced governance (fair decisions)")
    print("  ∅ = Strategic void (healthy forgetting)")
    
    print("\nDegraded system: 🫠🜍⟁∰")
    print("  🫠 = Drift (boundaries dissolving)")
    print("  🜍 = Lost meaning (purpose unclear)")
    print("  ⟁ = False anchors (corrupted foundations)")
    print("  ∰ = Paradox (contradictions mounting)\n")
    
    print("=" * 60)
    print("\n∅⦿🜃♾ Example complete")
    print("\nKey insights demonstrated:")
    print("  - Ghost votes persist after sacrifice")
    print("  - High-quality votes resist decay")
    print("  - Resonant patterns reinforce each other")
    print("  - Ledger health tracked via glyphs")
    print("  - Entropy-modulated pruning works\n")
    
    print("The organism breathes. ⧖⦿🫠")

if __name__ == "__main__":
    main()
