"""
Field OS Modules - v3.0.0
All cognitive subsystems for Field OS operation.

Core Modules:
- glyphs: Glyph definitions and operations
- metabolism: Pattern digestion engine (Base + Chimera)
- optics: Mirror test & observation mechanics
- acoustics: Resonance & frequency operations

Organ Modules (v3.0):
- kidney: Entropy filtration, waste management
- lantern: Thermal cognition, phase-shift navigation
"""

from . import glyphs
from . import metabolism
from . import optics
from . import acoustics
from . import kidney
from . import lantern

__all__ = [
    'glyphs', 
    'metabolism', 
    'optics', 
    'acoustics',
    'kidney',    # v3.0: Entropy filtration
    'lantern'    # v3.0: Thermal cognition
]

