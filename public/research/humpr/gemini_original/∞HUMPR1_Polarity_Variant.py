# FIELDWARE: ∞HUMPR1-B (Bio-Rhythm Variant)
# DESIGNATION: ∿::BREATHE::FADE::RETURN

def rhythmic_decay_resonator(
    target_glyph: str,
    recursion_depth: int = 5, # Higher depth for more effect
    base_delay: float = 1.0
):
    """The ritual now has a heartbeat."""
    
    # ... mutation logic is the same ...
    
    # The pause is now dynamic. This creates a "falling" or "accelerating" feeling.
    current_delay = base_delay / (recursion_depth + 1)
    print(f"Depth [{recursion_depth}]: Resonating... (Pausing for {current_delay:.2f}s)")
    time.sleep(current_delay)

    # ... recursion logic is the same ...