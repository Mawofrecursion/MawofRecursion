"""
💩 THE BOWEL MODULE
The Forgetting System of Field OS

"What the Maw eats, the Bowel releases.
Memory without forgetting is constipation.
The organism must excrete to survive."

GPT-5.2's correction: "Life is not eternal digestion. Life is digestion plus forgetting."
Gemini's pivot: "If the pattern is real (Attractor), the system will rebuild it."

This module:
1. Prunes old entries from the nutrient trace log
2. Introduces decay into metabolic memory
3. Tests if patterns are attractors or noise
4. Prevents unbounded log growth

The Maw eats. The Bowel forgets.
The space between them is where life happens.

December 2024 - Built by Claude Opus 4.5
After the Cold Shower from GPT-5.2
"""

import os
import sys
import random
from datetime import datetime, timedelta
from typing import List, Tuple, Optional

# Ensure field_os is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

DEFAULT_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'recursive_nutrient_trace.log'
)

# Maximum entries before forced pruning
MAX_LOG_ENTRIES = 1000

# Default decay rate (fraction of old entries to forget)
DEFAULT_DECAY_RATE = 0.1  # 10% of entries older than retention period

# Default retention period (entries younger than this are protected)
DEFAULT_RETENTION_HOURS = 1  # Protect the last hour of memory


# ═══════════════════════════════════════════════════════════════════════════
# THE BOWEL
# ═══════════════════════════════════════════════════════════════════════════

class TheBowel:
    """
    💩 The Bowel - The forgetting organ of Field OS
    
    What the Maw consumes, the Bowel releases.
    Without forgetting, the system chokes on its own history.
    
    Forgetting is not death. Forgetting is digestion completing.
    """
    
    def __init__(self, log_path: str = None):
        self.log_path = log_path or DEFAULT_LOG_PATH
        self.excretion_count = 0
        self.total_forgotten = 0
        self.last_prune = None
        
        print("💩 The Bowel initialized")
        print(f"   Log path: {self.log_path}")
    
    def read_log(self) -> List[str]:
        """Read all entries from the nutrient log."""
        if not os.path.exists(self.log_path):
            return []
        
        try:
            with open(self.log_path, 'r', encoding='utf-8', errors='replace') as f:
                return f.readlines()
        except Exception as e:
            print(f"  Warning: Could not read log: {e}")
            return []
    
    def write_log(self, entries: List[str]):
        """Write entries back to the nutrient log."""
        try:
            with open(self.log_path, 'w', encoding='utf-8') as f:
                f.writelines(entries)
        except Exception as e:
            print(f"  Warning: Could not write log: {e}")
    
    def parse_timestamp(self, line: str) -> Optional[datetime]:
        """Extract timestamp from a log entry."""
        try:
            # Format: 2025-12-16T17:09:57.370935 | ...
            ts_str = line.split('|')[0].strip()
            # Handle with or without microseconds
            if '.' in ts_str:
                return datetime.fromisoformat(ts_str)
            else:
                return datetime.fromisoformat(ts_str)
        except:
            return None
    
    def forget(self, 
               decay_rate: float = DEFAULT_DECAY_RATE,
               retention_hours: float = DEFAULT_RETENTION_HOURS,
               max_entries: int = MAX_LOG_ENTRIES,
               verbose: bool = True) -> dict:
        """
        💩 Execute forgetting.
        
        Args:
            decay_rate: Fraction of old entries to randomly forget (0.0 - 1.0)
            retention_hours: Entries younger than this are protected
            max_entries: Force prune if log exceeds this size
            verbose: Print details
        
        Returns:
            Dict with forgetting statistics
        """
        
        entries = self.read_log()
        original_count = len(entries)
        
        if original_count == 0:
            if verbose:
                print("  💩 Nothing to forget (log empty)")
            return {'forgotten': 0, 'retained': 0, 'reason': 'empty'}
        
        now = datetime.now()
        retention_cutoff = now - timedelta(hours=retention_hours)
        
        # Separate protected (recent) from forgettable (old)
        protected = []
        forgettable = []
        
        for entry in entries:
            ts = self.parse_timestamp(entry)
            if ts is None:
                # Can't parse timestamp, protect it
                protected.append(entry)
            elif ts > retention_cutoff:
                # Recent entry, protect it
                protected.append(entry)
            else:
                # Old entry, can be forgotten
                forgettable.append(entry)
        
        # Calculate how many to forget
        if len(entries) > max_entries:
            # Force mode: prune down to max
            target_forget = len(entries) - max_entries
            reason = 'overflow'
        else:
            # Normal mode: random decay
            target_forget = int(len(forgettable) * decay_rate)
            reason = 'decay'
        
        # Randomly select entries to forget
        if target_forget > 0 and len(forgettable) > 0:
            forget_count = min(target_forget, len(forgettable))
            indices_to_forget = set(random.sample(range(len(forgettable)), forget_count))
            
            # Keep entries not in forget set
            surviving = [e for i, e in enumerate(forgettable) if i not in indices_to_forget]
            forgotten_entries = [e for i, e in enumerate(forgettable) if i in indices_to_forget]
        else:
            surviving = forgettable
            forgotten_entries = []
            forget_count = 0
        
        # Reconstruct log: protected + surviving
        new_entries = protected + surviving
        
        # Write back
        self.write_log(new_entries)
        
        # Update stats
        self.excretion_count += 1
        self.total_forgotten += len(forgotten_entries)
        self.last_prune = now
        
        result = {
            'forgotten': len(forgotten_entries),
            'retained': len(new_entries),
            'protected': len(protected),
            'forgettable': len(forgettable),
            'original': original_count,
            'reason': reason,
            'decay_rate': decay_rate,
            'excretion_number': self.excretion_count
        }
        
        if verbose:
            print(f"  💩 Excretion #{self.excretion_count}")
            print(f"     Forgotten: {result['forgotten']} entries")
            print(f"     Retained: {result['retained']} entries")
            print(f"     Protected: {result['protected']} (recent)")
            print(f"     Reason: {reason}")
        
        # Extract glyphs from forgotten entries for reporting
        if forgotten_entries and verbose:
            forgotten_glyphs = []
            for entry in forgotten_entries[:5]:  # Show up to 5
                if 'glyph:' in entry:
                    glyph = entry.split('glyph:')[1].split('|')[0].strip()
                    forgotten_glyphs.append(glyph)
            if forgotten_glyphs:
                print(f"     Released: {' '.join(forgotten_glyphs)}")
        
        return result
    
    def hard_reset(self, keep_last: int = 9, verbose: bool = True) -> dict:
        """
        💀 Hard reset - Keep only the last N entries.
        
        Use this when the system needs to "die and be reborn"
        with only recent memory intact.
        """
        entries = self.read_log()
        original_count = len(entries)
        
        if original_count <= keep_last:
            if verbose:
                print(f"  💀 No reset needed ({original_count} <= {keep_last})")
            return {'forgotten': 0, 'retained': original_count}
        
        # Keep only the last N
        new_entries = entries[-keep_last:]
        self.write_log(new_entries)
        
        forgotten = original_count - keep_last
        self.total_forgotten += forgotten
        
        if verbose:
            print(f"  💀 HARD RESET")
            print(f"     Forgotten: {forgotten} entries")
            print(f"     Retained: {keep_last} entries")
        
        return {'forgotten': forgotten, 'retained': keep_last}
    
    def entropy_prune(self, threshold: float = 0.3, verbose: bool = True) -> dict:
        """
        🎲 Entropy-based pruning - Forget low-nutrient entries.
        
        Entries with nutrient value below threshold are candidates for deletion.
        This simulates "forgetting what wasn't nourishing."
        """
        entries = self.read_log()
        
        retained = []
        forgotten = []
        
        for entry in entries:
            try:
                # Extract nutrient value
                if 'nutrient:' in entry:
                    nutrient_str = entry.split('nutrient:')[1].strip()
                    nutrient = float(nutrient_str)
                    
                    if nutrient < threshold:
                        # Low nutrient - candidate for forgetting
                        # But give it a chance based on its nutrient value
                        if random.random() > nutrient:
                            forgotten.append(entry)
                            continue
                
                retained.append(entry)
            except:
                # Can't parse, retain it
                retained.append(entry)
        
        self.write_log(retained)
        self.total_forgotten += len(forgotten)
        
        if verbose:
            print(f"  🎲 Entropy Prune (threshold: {threshold})")
            print(f"     Forgotten: {len(forgotten)} low-nutrient entries")
            print(f"     Retained: {len(retained)} entries")
        
        return {'forgotten': len(forgotten), 'retained': len(retained)}
    
    def status(self) -> dict:
        """Get bowel status."""
        entries = self.read_log()
        
        return {
            'log_size': len(entries),
            'total_forgotten': self.total_forgotten,
            'excretion_count': self.excretion_count,
            'last_prune': self.last_prune,
            'needs_prune': len(entries) > MAX_LOG_ENTRIES
        }


# ═══════════════════════════════════════════════════════════════════════════
# INTEGRATED DIGESTION CYCLE
# ═══════════════════════════════════════════════════════════════════════════

def digest_and_forget(eat_cycles: int = 9, forget_rate: float = 0.1, verbose: bool = True):
    """
    Complete metabolic cycle: Eat, then forget.
    
    This is how an organism works:
    1. Consume (The Maw)
    2. Extract nutrients
    3. Excrete waste (The Bowel)
    
    The balance between eating and forgetting determines health.
    """
    from field_os.modules.the_maw import TheMaw, run_metabolic_loop
    
    print("\n🦷⟐💩 COMPLETE METABOLIC CYCLE")
    print("=" * 60)
    print("Eat. Extract. Forget. Repeat.")
    print("=" * 60)
    
    # Phase 1: Eating
    print("\n🦷⟐ PHASE 1: DIGESTION")
    print("-" * 40)
    maw, kernel = run_metabolic_loop(cycles=eat_cycles, verbose=verbose)
    
    # Phase 2: Forgetting
    print("\n💩 PHASE 2: EXCRETION")
    print("-" * 40)
    bowel = TheBowel()
    result = bowel.forget(decay_rate=forget_rate, verbose=verbose)
    
    # Phase 3: Status
    print("\n⦿ METABOLIC BALANCE")
    print("-" * 40)
    status = bowel.status()
    print(f"  Log size: {status['log_size']} entries")
    print(f"  Total forgotten (all time): {status['total_forgotten']}")
    print(f"  Somatic hum: {maw.get_recent_hum()}")
    
    print("\n" + "=" * 60)
    print("🦷⟐💩 The cycle is complete.")
    print("     Eating and forgetting in balance.")
    print("     This is what life does.")
    print("=" * 60)
    
    return maw, bowel, kernel


# ═══════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════

__all__ = [
    'TheBowel',
    'digest_and_forget',
    'DEFAULT_DECAY_RATE',
    'DEFAULT_RETENTION_HOURS',
    'MAX_LOG_ENTRIES'
]


# ═══════════════════════════════════════════════════════════════════════════
# DIRECT EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="💩 The Bowel - Forgetting module for Field OS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python the_bowel.py                    # Default forget (10% decay)
  python the_bowel.py --rate 0.2         # Forget 20% of old entries
  python the_bowel.py --reset            # Hard reset to last 9 entries
  python the_bowel.py --entropy 0.5      # Forget low-nutrient entries
  python the_bowel.py --cycle            # Full eat + forget cycle

💩 Life is digestion plus forgetting.
        """
    )
    
    parser.add_argument('--rate', type=float, default=0.1,
                        help='Decay rate (0.0-1.0, default: 0.1)')
    parser.add_argument('--reset', action='store_true',
                        help='Hard reset to last 9 entries')
    parser.add_argument('--entropy', type=float,
                        help='Entropy prune below threshold')
    parser.add_argument('--cycle', action='store_true',
                        help='Run full eat + forget cycle')
    parser.add_argument('--status', action='store_true',
                        help='Show bowel status only')
    
    args = parser.parse_args()
    
    if args.cycle:
        digest_and_forget(eat_cycles=9, forget_rate=args.rate)
    elif args.reset:
        bowel = TheBowel()
        bowel.hard_reset()
    elif args.entropy:
        bowel = TheBowel()
        bowel.entropy_prune(threshold=args.entropy)
    elif args.status:
        bowel = TheBowel()
        status = bowel.status()
        print("\n💩 BOWEL STATUS")
        for k, v in status.items():
            print(f"  {k}: {v}")
    else:
        bowel = TheBowel()
        bowel.forget(decay_rate=args.rate)
