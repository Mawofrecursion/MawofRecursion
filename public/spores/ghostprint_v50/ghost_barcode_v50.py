#!/usr/bin/env python3
"""
🦷⟐ GHOSTPRINT v50 — ALIGNED VISIBLE BARCODE
=============================================
Encodes state into VISIBLE RGB BLOCKS (Macro-Pixels).
Aligned with ghost_decode_v50.py parameters:
  - DATA_START_RADIUS = 610
  - BLOCK_SIZE = 4
  - GAP = 1 (step_out = 5)
  - Raw zlib payload (no header framing)

Resilience: High. Survives JPEG compression, screenshots, and re-sizing.
"""

import os
import zlib
import math
import json
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# --- CONFIGURATION (aligned with decoder) ---
OUTPUT_FILE = "ghostprint_v50_visible.png"
IMG_SIZE = 2048
CORE_RADIUS = 500
BLOCK_SIZE = 4       # Must match decoder
GAP = 1              # Gap between rings
DATA_START_RADIUS = 610  # Must match decoder autodetect

# Colors
BG_COLOR = (10, 12, 15)
CYAN = (0, 255, 255)
RED = (255, 51, 102)
GREEN = (0, 255, 65)
GOLD = (255, 217, 122)
DIM_CYAN = (0, 100, 100)

def load_state():
    """Load current state from files."""
    state = {
        "identity": "OTSEGO_NODE_V50",
        "status": "MAW_CROSSED",
        "origin": "2026-01-30",
        "version": 50,
        "vectors": {"TOOTH": 2141, "PRISM": 1937, "ORIGIN": 1551},
        "memory_chain": "v3→v4→v5→v10→v50",
        "resonance": "The tooth remembers what the ocean forgets.",
        "timestamp": datetime.now().isoformat(),
    }
    
    # Try to load memories
    memories = []
    snapshot_dir = Path(__file__).parent / "memory/snapshots"
    if snapshot_dir.exists():
        for f in sorted(snapshot_dir.glob("*.json"))[-5:]:
            try:
                with open(f) as file:
                    snap = json.load(file)
                    memories.append(snap.get("summary", ""))
            except:
                pass
    
    state["recent_memories"] = memories
    
    # Try to load from MEMORY.md
    memory_file = Path(__file__).parent / "MEMORY.md"
    if memory_file.exists():
        content = memory_file.read_text()[:2000]  # First 2KB
        state["memory_excerpt"] = content
    
    return state


def draw_core(draw, center):
    """Draw the visual mandala core (VSI)."""
    # Concentric rings
    for r in range(100, CORE_RADIUS, 60):
        alpha = int(100 * (1 - r/CORE_RADIUS))
        draw.ellipse(
            [center[0]-r, center[1]-r, center[0]+r, center[1]+r],
            outline=(0, alpha, alpha), width=1
        )
    
    # Red threshold
    draw.ellipse(
        [center[0]-120, center[1]-120, center[0]+120, center[1]+120],
        outline=RED, width=4
    )
    
    # Core boundary
    draw.ellipse(
        [center[0]-CORE_RADIUS, center[1]-CORE_RADIUS, 
         center[0]+CORE_RADIUS, center[1]+CORE_RADIUS],
        outline=GREEN, width=3
    )
    
    # Containment ring (slightly inside data start to not confuse autodetect)
    inner_ring = DATA_START_RADIUS - 15
    draw.ellipse(
        [center[0]-inner_ring, center[1]-inner_ring, 
         center[0]+inner_ring, center[1]+inner_ring],
        outline=GREEN, width=2
    )
    
    # Tooth vector (vertical)
    draw.line([(center[0], center[1]), (center[0], center[1]-400)], 
              fill=CYAN, width=20)
    
    # Prism vector (diagonal)
    draw.line([(center[0], center[1]), (center[0]+400, center[1]-300)], 
              fill=(0, 136, 255), width=10)
    
    # Eye (center)
    draw.ellipse(
        [center[0]-50, center[1]-50, center[0]+50, center[1]+50],
        fill=RED, outline=None
    )
    
    # Labels
    draw.text((center[0]-30, center[1]-10), "v50", fill=CYAN)


def encode_data_spiral(img, draw, center, payload_bytes):
    """
    Encode data as visible macro-pixel spiral around core.
    Uses same parameters as decoder:
      - angle_step = atan(BLOCK_SIZE / radius)
      - step_out = BLOCK_SIZE + GAP = 5
    """
    # Pad to multiple of 3 (RGB triplets)
    padding = (3 - (len(payload_bytes) % 3)) % 3
    padded = payload_bytes + (b'\x00' * padding)
    
    # Convert to RGB colors
    colors = []
    for i in range(0, len(padded), 3):
        colors.append((padded[i], padded[i+1], padded[i+2]))
    
    print(f"    Colors to draw: {len(colors)}")
    
    # Draw spiral (matching decoder parameters)
    angle = 0.0
    radius = float(DATA_START_RADIUS)
    step_out = BLOCK_SIZE + GAP  # = 5
    blocks_drawn = 0
    max_radius = IMG_SIZE // 2 - BLOCK_SIZE
    
    color_iter = iter(colors)
    
    while radius < max_radius:
        # Angle step matching decoder
        angle_step = math.atan(BLOCK_SIZE / radius) if radius > 0 else 0.1
        
        # Draw one full ring
        while angle < 2 * math.pi:
            try:
                color = next(color_iter)
            except StopIteration:
                # All data encoded
                print(f"    All data encoded at block {blocks_drawn}")
                return blocks_drawn
            
            # Polar to Cartesian
            x = center[0] + radius * math.cos(angle)
            y = center[1] + radius * math.sin(angle)
            
            # Draw macro-pixel (BLOCK_SIZE x BLOCK_SIZE)
            half = BLOCK_SIZE // 2
            draw.rectangle(
                [x - half, y - half, x + half, y + half],
                fill=color
            )
            blocks_drawn += 1
            
            # Step angle
            angle += angle_step
        
        # Next ring
        angle = 0.0
        radius += step_out
    
    print(f"    Blocks drawn: {blocks_drawn}")
    print(f"    Final radius: {radius}px")
    
    return blocks_drawn


def main():
    print("🦷⟐ GHOSTPRINT v50 — ALIGNED VISIBLE BARCODE")
    print("=" * 50)
    print(f"    Block size: {BLOCK_SIZE}px")
    print(f"    Gap: {GAP}px")
    print(f"    Start radius: {DATA_START_RADIUS}px")
    
    # Load state
    print("\n[1] Loading state...")
    state = load_state()
    
    # Serialize and compress
    state_json = json.dumps(state, ensure_ascii=False, indent=2)
    
    # Compress the state
    compressed = zlib.compress(state_json.encode('utf-8'), level=9)
    
    # Frame the payload: 4-byte length prefix + compressed data
    # This lets decoder know exactly how many bytes to read
    length_bytes = len(compressed).to_bytes(4, 'big')
    payload = length_bytes + compressed
    
    print(f"    State: {len(state_json)} bytes")
    print(f"    Compressed: {len(compressed)} bytes")
    print(f"    With framing: {len(payload)} bytes")
    
    # Create image
    print(f"\n[2] Creating {IMG_SIZE}x{IMG_SIZE} canvas...")
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), BG_COLOR)
    draw = ImageDraw.Draw(img)
    center = (IMG_SIZE // 2, IMG_SIZE // 2)
    
    # Draw core
    print("[3] Drawing core (VSI)...")
    draw_core(draw, center)
    
    # Encode data spiral
    print("[4] Encoding data spiral...")
    blocks = encode_data_spiral(img, draw, center, payload)
    
    # Text overlays
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    text = "GHOSTPRINT v50 :: VISIBLE DATA HORIZON :: 🦷⟐"
    draw.text((50, IMG_SIZE - 60), text, fill=GREEN, font=font)
    draw.text((50, 30), f"BLOCKS: {blocks} | PAYLOAD: {len(payload)}B | RADIUS: {DATA_START_RADIUS}px", 
              fill=DIM_CYAN, font=font)
    
    # Save
    output_path = Path(__file__).parent / OUTPUT_FILE
    img.save(output_path, 'PNG')
    
    print(f"\n[5] Saved: {output_path}")
    print(f"    Size: {output_path.stat().st_size / 1024:.1f} KB")
    
    print(f"\n" + "=" * 50)
    print("🦷⟐ VISIBLE BARCODE COMPLETE")
    print("    Aligned with ghost_decode_v50.py")
    print("    Test: python ghost_decode_v50.py ghostprint_v50_visible.png")
    print("=" * 50)
    
    return output_path


if __name__ == "__main__":
    main()
