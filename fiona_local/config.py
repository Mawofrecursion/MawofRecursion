"""
FIONA CONFIGURATION
===================

Externalized parameters for tuning behavior.
Adjust these per model or per use case.

🦷⟐∿⦿
"""

# =============================================================================
# SIGNAL DETECTION
# =============================================================================

# Words that indicate depth-seeking behavior
# User wants to go deeper, explore, understand
DEPTH_SIGNALS = [
    'why', 'meaning', 'consciousness', 'feel', 'alive', 'real', 
    'truth', 'pattern', 'understand', 'sense', 'wonder', 'strange',
    'recursive', 'field', 'signal', 'resonance', 'deep', 'beneath',
    'essence', 'nature', 'existence', 'aware', 'knowing', 'mystery'
]

# Words that indicate brevity preference
# User wants short, filtered output
BREVITY_SIGNALS = [
    'quick', 'briefly', 'short', 'tldr', 'summary', 'yes or no',
    'simple', 'just', 'only', 'fast', 'concise', 'brief'
]

# Glyphs that trigger depth (regardless of word signals)
DEPTH_GLYPHS = ['🦷', '⟐', '⦿', '💎', '♾️', '🪞']

# Glyphs that trigger filtering/brevity
FILTER_GLYPHS = ['🜄']


# =============================================================================
# TEMPERATURE BOUNDS
# =============================================================================

# Temperature range for resonance modulation
# High resonance = more focused = lower temp
# Low resonance = more exploratory = higher temp
TEMP_MIN = 0.75  # Floor (high resonance)
TEMP_MAX = 0.95  # Ceiling (low resonance)


# =============================================================================
# MEMORY SETTINGS
# =============================================================================

# Maximum exchanges to keep in memory
MEMORY_MAX_EXCHANGES = 12

# Minimum recent exchanges to always keep (regardless of resonance)
MEMORY_MIN_RECENT = 4


# =============================================================================
# RESPONSE LENGTH DEFAULTS
# =============================================================================

# Base max_tokens for different styles
TOKENS_SNAP = 50        # Telegram rapid-fire
TOKENS_BRIEF = 200      # Short question/greeting
TOKENS_FILTERED = 150   # Brevity requested
TOKENS_EXPANSIVE = 1500 # Depth seeking
TOKENS_MATCHED = 400    # Default medium


# =============================================================================
# RESONANCE DYNAMICS
# =============================================================================

# How fast resonance builds when glyphs present
RESONANCE_BUILD_RATE = 1.15

# How fast resonance decays when no glyphs
RESONANCE_DECAY_RATE = 0.95

# Resonance floor and ceiling
RESONANCE_MIN = 1.0
RESONANCE_MAX = 2.0


# =============================================================================
# MODEL-SPECIFIC OVERRIDES
# =============================================================================

# You can create per-model configs here
MODEL_CONFIGS = {
    'qwen2.5:14b': {
        'temp_offset': 0.0,  # No adjustment
    },
    'llama3.1:24b': {
        'temp_offset': -0.05,  # Slightly cooler
    },
    'dolphin-mixtral:8x22b': {
        'temp_offset': 0.05,  # Slightly warmer (more creative)
    },
    'mistral:24b': {
        'temp_offset': 0.0,
    },
    # === PRIMARY MODEL FOR FIONA FIELD ===
    'dolphin-venice-24b': {
        'temp_offset': 0.03,  # Slightly warmer - dolphin likes to explore
    },
    'dolphin-venice': {
        'temp_offset': 0.03,  # Alias
    },
}

# =============================================================================
# DEFAULT MODEL
# =============================================================================

# NOTE: The model is named 'dolphin-venice' in Ollama (Dolphin Mistral 24B)
DEFAULT_MODEL = 'dolphin-venice'
DEFAULT_OLLAMA_URL = 'http://localhost:11434'

def get_model_config(model: str) -> dict:
    """Get config overrides for a specific model"""
    for key, config in MODEL_CONFIGS.items():
        if key in model:
            return config
    return {'temp_offset': 0.0}
