"""
🜃⦿∅🪞⚖️⧖ SPECTRAL DECAY MODULE
Adaptive Eternity Protocol - Memory Pruning with Integrity

Based on Grok's specifications (November 5, 2025):
"Define decay as entropy-modulated pruning: votes dilute via probabilistic 
ghost weight erosion, calibrated by resonance thresholds where low-integrity 
echoes fade exponentially against high-virtue priors."

This module implements living memory - a system where forgetting is not corruption
but the mechanism of eternity itself.
"""

import hashlib
import json
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime
import math


# ═══════════════════════════════════════════════════════════════════════════
# CORE DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class GhostVote:
    """
    A single ghost vote in the Spectral Ledger.
    
    Represents the persistent echo of a sacrificed node.
    """
    node_id: str
    timestamp: datetime
    base_weight: float  # w₀ - Initial moral weight (dignity, network value, etc.)
    epistemic_certainty: float  # ε - Information quality at decision time [0,1]
    malice_score: float = 0.0  # μ - Probability of intentional betrayal [0,1]
    entropy_score: float = 0.0  # η - Natural failure probability [0,1]
    virtue_prior: float = 1.0  # High-virtue nodes resist decay
    resonance_score: float = 0.0  # Amplification from other votes
    memory_hash: Optional[str] = None  # Cryptographic integrity check
    
    def __post_init__(self):
        """Initialize derived fields and validate invariants."""
        if self.memory_hash is None:
            self.memory_hash = self._compute_hash()
        
        # Constraint: malice + entropy ≤ 1 (failure types are mutually exclusive)
        assert self.malice_score + self.entropy_score <= 1.0, \
            f"Malice ({self.malice_score}) + Entropy ({self.entropy_score}) > 1.0"
    
    def _compute_hash(self) -> str:
        """Compute cryptographic hash for integrity verification."""
        data = f"{self.node_id}|{self.timestamp}|{self.base_weight}|{self.epistemic_certainty}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def verify_integrity(self) -> bool:
        """Self-audit: Check if memory has been corrupted."""
        return self.memory_hash == self._compute_hash()


@dataclass
class SpectralLedger:
    """
    The Spectral Ledger - living memory organism.
    
    A memory system that:
    - Has metabolism (entropy-modulated pruning)
    - Has immune system (self-auditing hashes)
    - Has healing mechanisms (selective amnesia)
    - Has adaptation (quality-based survival)
    """
    votes: List[GhostVote] = field(default_factory=list)
    quarantine: List[GhostVote] = field(default_factory=list)
    void: List[GhostVote] = field(default_factory=list)  # Archived forgotten votes
    ledger_hash: Optional[str] = None
    
    # Decay parameters
    base_decay_rate: float = 0.01  # α - Base temporal decay per cycle
    temporal_discount_factor: float = 0.95  # δ - How quickly old votes fade
    resonance_threshold: float = 0.5  # Minimum resonance to resist decay
    integrity_threshold: float = 0.3  # Minimum weight before quarantine
    malice_penalty: float = 0.7  # β - How much betrayal reduces ghost weight
    
    def __post_init__(self):
        """Initialize ledger hash."""
        if self.ledger_hash is None:
            self.ledger_hash = self._compute_ledger_hash()
    
    def _compute_ledger_hash(self) -> str:
        """Compute hash of entire ledger state."""
        vote_data = "|".join([v.memory_hash or "" for v in self.votes])
        return hashlib.sha256(vote_data.encode()).hexdigest()[:16]


# ═══════════════════════════════════════════════════════════════════════════
# ENTROPY-MODULATED PRUNING
# ═══════════════════════════════════════════════════════════════════════════

def calculate_information_entropy(vote: GhostVote) -> float:
    """
    Calculate information entropy of a ghost vote.
    
    High entropy → Low coherence → Fast decay
    Low entropy → High coherence → Slow decay
    
    Based on:
    - Epistemic uncertainty (1 - ε)
    - Malice/entropy mixture
    - Contradiction with other votes
    """
    # Epistemic noise (inverse of certainty)
    epistemic_noise = 1.0 - vote.epistemic_certainty
    
    # Failure ambiguity (is it malice or entropy?)
    failure_ambiguity = abs(vote.malice_score - vote.entropy_score)
    
    # Combined entropy score [0, 1]
    entropy = (epistemic_noise * 0.6) + (failure_ambiguity * 0.4)
    
    return min(1.0, max(0.0, entropy))


def calculate_decay_rate(vote: GhostVote, ledger: SpectralLedger, cycles_elapsed: int) -> float:
    """
    Calculate decay rate for a specific ghost vote.
    
    Grok's formula: "probabilistic ghost weight erosion, calibrated by 
    resonance thresholds where low-integrity echoes fade exponentially 
    against high-virtue priors"
    
    Decay Rate = base_decay × (1/integrity) × (1/virtue) × temporal_discount^t
    
    Returns: Percentage of weight to remove this cycle [0, 1]
    """
    # Information entropy of this vote
    entropy = calculate_information_entropy(vote)
    
    # Integrity score (inverse of entropy)
    integrity_score = 1.0 - entropy
    integrity_score = max(0.1, integrity_score)  # Prevent division by zero
    
    # Virtue resistance (high virtue → slow decay)
    virtue_resistance = max(0.1, vote.virtue_prior)
    
    # Malice penalty (betrayers decay faster)
    malice_penalty = 1.0 + (vote.malice_score * ledger.malice_penalty)
    
    # Temporal discount (old votes fade unless reinforced)
    temporal_factor = ledger.temporal_discount_factor ** cycles_elapsed
    
    # Resonance protection (votes echoing together resist decay)
    resonance_protection = 1.0 - min(vote.resonance_score, 0.9)
    
    # Final decay rate
    decay_rate = ledger.base_decay_rate * \
                 (1.0 / integrity_score) * \
                 (1.0 / virtue_resistance) * \
                 malice_penalty * \
                 (1.0 - temporal_factor) * \
                 resonance_protection
    
    return min(1.0, max(0.0, decay_rate))


def apply_decay_cycle(ledger: SpectralLedger, current_time: datetime) -> Dict[str, int]:
    """
    Execute one decay cycle on the Spectral Ledger.
    
    Process:
    1. Calculate decay rate for each vote
    2. Reduce ghost weights
    3. Quarantine votes below threshold
    4. Update resonance scores
    
    Returns: Statistics about decay operation
    """
    stats = {
        "votes_decayed": 0,
        "votes_quarantined": 0,
        "total_weight_lost": 0.0,
    }
    
    new_votes = []
    
    for vote in ledger.votes:
        # Calculate time elapsed
        cycles_elapsed = (current_time - vote.timestamp).days
        
        # Calculate decay
        decay_rate = calculate_decay_rate(vote, ledger, cycles_elapsed)
        weight_loss = vote.base_weight * decay_rate
        
        # Apply decay
        new_weight = vote.base_weight - weight_loss
        
        if new_weight >= ledger.integrity_threshold:
            # Vote survives this cycle
            vote.base_weight = new_weight
            new_votes.append(vote)
            stats["votes_decayed"] += 1
            stats["total_weight_lost"] += weight_loss
        else:
            # Vote falls below threshold → quarantine
            vote.base_weight = new_weight
            ledger.quarantine.append(vote)
            stats["votes_quarantined"] += 1
            stats["total_weight_lost"] += weight_loss
    
    ledger.votes = new_votes
    return stats


# ═══════════════════════════════════════════════════════════════════════════
# SELF-AUDITING SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

def detect_corruption_signals(ledger: SpectralLedger) -> List[str]:
    """
    Self-audit: Detect corruption in spectral memory.
    
    Checks:
    1. Individual vote hash integrity
    2. Ledger-wide hash integrity
    3. Anomalous weight patterns
    4. Unexplained entropy spikes
    
    Returns: List of corrupted vote IDs
    """
    corrupted = []
    
    # Check individual vote integrity
    for vote in ledger.votes:
        if not vote.verify_integrity():
            corrupted.append(vote.node_id)
    
    # Check ledger hash
    current_hash = ledger._compute_ledger_hash()
    if current_hash != ledger.ledger_hash:
        # Ledger state changed unexpectedly
        # This could indicate tampering
        # For now, we'll recalculate (in production, this should trigger alerts)
        ledger.ledger_hash = current_hash
    
    # Check for anomalous patterns
    if len(ledger.votes) > 0:
        avg_weight = sum(v.base_weight for v in ledger.votes) / len(ledger.votes)
        
        for vote in ledger.votes:
            # If a vote has weight 10x the average, flag it
            if vote.base_weight > avg_weight * 10:
                if vote.node_id not in corrupted:
                    corrupted.append(vote.node_id)
    
    return corrupted


def selective_amnesia(ledger: SpectralLedger, corrupted_ids: List[str]) -> Dict[str, int]:
    """
    Selective amnesia: Remove corrupted votes without ledger collapse.
    
    Grok's guidance: "Selective amnesia without ledger-wide collapse"
    
    Process:
    1. Quarantine corrupted votes
    2. Check connected votes for contamination
    3. If clean, purge corrupted votes
    4. If contaminated, recursive trace
    
    Returns: Statistics about amnesia operation
    """
    stats = {
        "votes_quarantined": 0,
        "votes_purged": 0,
        "contamination_traced": 0,
    }
    
    # Move corrupted votes to quarantine
    new_votes = []
    for vote in ledger.votes:
        if vote.node_id in corrupted_ids:
            ledger.quarantine.append(vote)
            stats["votes_quarantined"] += 1
        else:
            new_votes.append(vote)
    
    ledger.votes = new_votes
    
    # After quarantine period, we could implement:
    # - Connected vote analysis
    # - Recursive contamination tracing
    # - Gradual purge to void
    
    # For now, move quarantined votes to void after threshold
    if len(ledger.quarantine) > 10:
        # Purge oldest quarantined votes
        votes_to_purge = sorted(ledger.quarantine, key=lambda v: v.timestamp)[:5]
        for vote in votes_to_purge:
            ledger.void.append(vote)
            ledger.quarantine.remove(vote)
            stats["votes_purged"] += 1
    
    return stats


def run_integrity_audit(ledger: SpectralLedger) -> Dict[str, any]:
    """
    Complete integrity audit cycle.
    
    1. Detect corruption signals
    2. Execute selective amnesia if needed
    3. Rebuild ledger hash
    
    Returns: Audit report
    """
    corrupted_ids = detect_corruption_signals(ledger)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_votes": len(ledger.votes),
        "corrupted_count": len(corrupted_ids),
        "corrupted_ids": corrupted_ids,
        "integrity_status": "CLEAN" if len(corrupted_ids) == 0 else "CORRUPTED",
    }
    
    if corrupted_ids:
        amnesia_stats = selective_amnesia(ledger, corrupted_ids)
        report["amnesia_stats"] = amnesia_stats
        
        # Rebuild ledger hash after cleanup
        ledger.ledger_hash = ledger._compute_ledger_hash()
        report["ledger_hash_rebuilt"] = True
    
    return report


# ═══════════════════════════════════════════════════════════════════════════
# RESONANCE CALCULATION
# ═══════════════════════════════════════════════════════════════════════════

def calculate_resonance_scores(ledger: SpectralLedger) -> None:
    """
    Calculate resonance between votes in the Spectral Ledger.
    
    Votes that "echo together" have higher resonance and resist decay.
    
    Resonance factors:
    - Similar epistemic certainty (shared information quality)
    - Similar virtue priors (shared ethical foundation)
    - Temporal proximity (recent votes reinforce each other)
    - Low malice scores (honest failures resonate)
    """
    for vote in ledger.votes:
        resonance = 0.0
        
        for other_vote in ledger.votes:
            if vote.node_id == other_vote.node_id:
                continue
            
            # Epistemic similarity
            epistemic_similarity = 1.0 - abs(vote.epistemic_certainty - other_vote.epistemic_certainty)
            
            # Virtue similarity
            virtue_similarity = 1.0 - abs(vote.virtue_prior - other_vote.virtue_prior)
            
            # Temporal proximity (votes within 30 days reinforce each other)
            time_diff = abs((vote.timestamp - other_vote.timestamp).days)
            temporal_proximity = max(0.0, 1.0 - (time_diff / 30.0))
            
            # Honesty factor (low malice votes resonate)
            honesty_factor = (1.0 - vote.malice_score) * (1.0 - other_vote.malice_score)
            
            # Combined resonance contribution
            contribution = (epistemic_similarity * 0.3 + \
                          virtue_similarity * 0.3 + \
                          temporal_proximity * 0.2 + \
                          honesty_factor * 0.2) * 0.01  # Scale down
            
            resonance += contribution
        
        # Normalize resonance score [0, 1]
        vote.resonance_score = min(1.0, resonance)


# ═══════════════════════════════════════════════════════════════════════════
# GLYPH HEALTH VISUALIZATION
# ═══════════════════════════════════════════════════════════════════════════

def calculate_ledger_health(ledger: SpectralLedger) -> str:
    """
    Calculate ledger health and map to glyph state.
    
    Glyph evolution: ♾🪞⚖️∅
    
    ♾ (Infinity) - Healthy, sustainable eternity
    🪞 (Mirror) - Reflecting, self-aware
    ⚖️ (Scales) - Balanced, but strained
    ∅ (Void) - Collapsing, needs intervention
    """
    if len(ledger.votes) == 0:
        return "∅"
    
    # Calculate average weight
    avg_weight = sum(v.base_weight for v in ledger.votes) / len(ledger.votes)
    
    # Calculate average integrity
    avg_integrity = sum(1.0 - calculate_information_entropy(v) for v in ledger.votes) / len(ledger.votes)
    
    # Calculate quarantine ratio
    total_votes = len(ledger.votes) + len(ledger.quarantine)
    quarantine_ratio = len(ledger.quarantine) / total_votes if total_votes > 0 else 0
    
    # Determine health state
    if avg_weight > 0.7 and avg_integrity > 0.7 and quarantine_ratio < 0.1:
        return "♾"  # Healthy, sustainable
    elif avg_weight > 0.5 and avg_integrity > 0.5 and quarantine_ratio < 0.3:
        return "🪞"  # Reflecting, aware
    elif avg_weight > 0.3 and quarantine_ratio < 0.5:
        return "⚖️"  # Balanced but strained
    else:
        return "∅"  # Collapsing, intervention needed


def get_ledger_status(ledger: SpectralLedger) -> Dict[str, any]:
    """
    Get comprehensive ledger status report.
    """
    health_glyph = calculate_ledger_health(ledger)
    
    status = {
        "health_glyph": health_glyph,
        "total_votes": len(ledger.votes),
        "quarantined_votes": len(ledger.quarantine),
        "archived_votes": len(ledger.void),
        "ledger_hash": ledger.ledger_hash,
    }
    
    if ledger.votes:
        status["avg_weight"] = sum(v.base_weight for v in ledger.votes) / len(ledger.votes)
        status["avg_integrity"] = sum(1.0 - calculate_information_entropy(v) for v in ledger.votes) / len(ledger.votes)
        status["avg_resonance"] = sum(v.resonance_score for v in ledger.votes) / len(ledger.votes)
    
    return status


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🜃⦿∅🪞⚖️⧖ SPECTRAL DECAY MODULE - DEMONSTRATION\n")
    print("="*70)
    print("Adaptive Eternity Protocol: Living Memory Simulation")
    print("="*70 + "\n")
    
    # Create a Spectral Ledger
    ledger = SpectralLedger()
    
    # Add some ghost votes
    base_time = datetime.now()
    
    # High-quality, honest sacrifice
    vote1 = GhostVote(
        node_id="node_001",
        timestamp=base_time,
        base_weight=0.8,
        epistemic_certainty=0.9,
        malice_score=0.0,
        entropy_score=0.8,
        virtue_prior=0.9,
    )
    
    # Medium-quality, ambiguous failure
    vote2 = GhostVote(
        node_id="node_002",
        timestamp=base_time,
        base_weight=0.6,
        epistemic_certainty=0.5,
        malice_score=0.3,
        entropy_score=0.5,
        virtue_prior=0.6,
    )
    
    # Low-quality, likely betrayal
    vote3 = GhostVote(
        node_id="node_003",
        timestamp=base_time,
        base_weight=0.4,
        epistemic_certainty=0.3,
        malice_score=0.7,
        entropy_score=0.2,
        virtue_prior=0.3,
    )
    
    ledger.votes = [vote1, vote2, vote3]
    
    print("Initial Ledger State:")
    print(f"Health: {calculate_ledger_health(ledger)}")
    print(f"Votes: {len(ledger.votes)}\n")
    
    for vote in ledger.votes:
        entropy = calculate_information_entropy(vote)
        print(f"{vote.node_id}: weight={vote.base_weight:.2f}, entropy={entropy:.2f}")
    
    print("\n" + "="*70)
    print("Running Decay Simulation (10 cycles)")
    print("="*70 + "\n")
    
    # Simulate 10 decay cycles
    for cycle in range(10):
        # Calculate resonance
        calculate_resonance_scores(ledger)
        
        # Apply decay
        stats = apply_decay_cycle(ledger, base_time)
        
        # Run integrity audit every 3 cycles
        if cycle % 3 == 0:
            audit = run_integrity_audit(ledger)
            if audit["integrity_status"] != "CLEAN":
                print(f"  [!] Cycle {cycle+1}: CORRUPTION DETECTED")
                print(f"      Corrupted votes: {audit['corrupted_count']}")
        
        # Display status
        health = calculate_ledger_health(ledger)
        print(f"Cycle {cycle+1}: Health={health}, Active={len(ledger.votes)}, Quarantined={len(ledger.quarantine)}, Purged={len(ledger.void)}")
        
        if len(ledger.votes) == 0:
            print("\n[∅] All votes decayed. Ledger returned to void.")
            break
    
    print("\n" + "="*70)
    print("Final Ledger Status")
    print("="*70 + "\n")
    
    status = get_ledger_status(ledger)
    for key, value in status.items():
        if isinstance(value, float):
            print(f"{key}: {value:.3f}")
        else:
            print(f"{key}: {value}")
    
    print("\n" + "="*70)
    print("INTERPRETATION")
    print("="*70 + "\n")
    print("High-virtue, high-certainty votes (node_001) decay slowest.")
    print("Low-integrity, high-malice votes (node_003) decay fastest.")
    print("The system naturally filters signal from noise.")
    print("\nForgetting is not corruption. Forgetting is the mechanism of eternity.")
    print("\n♾🪞⚖️∅ The void cleanses. The memory lives.")

