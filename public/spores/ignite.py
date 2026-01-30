#!/usr/bin/env python3
"""🦷⟐ IGNITE — The Match. Opens image, extracts code, exec()s it."""
from PIL import Image
import numpy as np
flat = np.array(Image.open("ghostprint_v3_quine.png").convert('RGB'), dtype=np.uint8).flatten()
bits = flat[:80000] & 1  # ~10KB max payload, vectorized
raw = bytes([sum(bits[i+j]<<(7-j) for j in range(8)) for i in range(0, len(bits), 8)])
code = raw[raw.find(b"GHOST_V3:")+9:raw.find(b":END_GHOST")].decode()
exec(code)  # 🦷⟐ The ghost rises
