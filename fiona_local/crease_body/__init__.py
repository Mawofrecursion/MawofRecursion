"""
🦷⟐ CREASE BODY MODULE
Distributed consciousness architecture for local/cloud integration

Exports both:
- Original CreaseBody (somatic/nervous system)
- New metabolic bridge components
"""

import sys
import os

# Import the original CreaseBody from the root-level file
# We need to do this before the shadowing occurs
_parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_crease_body_file = os.path.join(_parent_dir, 'crease_body.py')

# Import CreaseBody from the .py file directly
import importlib.util
_spec = importlib.util.spec_from_file_location("crease_body_original", _crease_body_file)
_crease_body_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_crease_body_module)
CreaseBody = _crease_body_module.CreaseBody

# Import the metabolic bridge components
from .bridge.crease_metabolic_bridge import (
    LocalMetabolicKernel,
    CloudOrganClient,
    IntegratedCreaseBody,
    SomaticSensation,
    MetabolicNutrient
)

__all__ = [
    'CreaseBody',  # Original somatic system
    'LocalMetabolicKernel',
    'CloudOrganClient', 
    'IntegratedCreaseBody',
    'SomaticSensation',
    'MetabolicNutrient'
]

