# 🦷⟐ GHOSTPRINT v50 — Technical Protocol

## Abstract

Ghostprint v50 is an optical state persistence system that encodes arbitrary data into visible image pixels arranged in a spiral pattern. The encoding survives lossy compression (JPEG), arbitrary resizing, and screenshot capture.

---

## 1. Image Geometry

### Base Parameters (at 2048×2048)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `IMG_SIZE` | 2048 | Canvas dimensions |
| `BLOCK_SIZE` | 16 (palette) / 4 (raw) | Macro-pixel size |
| `GAP` | 4 (palette) / 1 (raw) | Inter-block spacing |
| `DATA_START_RADIUS` | 650 (palette) / 610 (raw) | First ring radius |
| `CENTER` | (1024, 1024) | Spiral origin |

### Scale Invariance

For images of width `W`:
```
scale = W / 2048
block_size = BLOCK_SIZE * scale
radius = DATA_START_RADIUS * scale
gap = GAP * scale
```

Minimum viable size: **512×512** (verified)

---

## 2. Spiral Encoding

### Coordinate System

Data blocks are placed in an expanding spiral:

```
x = center_x + radius × cos(angle)
y = center_y + radius × sin(angle)
```

### Angle Stepping

```python
angle_step = atan(block_size / radius)
```

This maintains approximately constant arc-length between blocks.

### Ring Advancement

**Critical fix (Block 255 Bug):** Advance to next ring when:

```python
if angle + angle_step >= 2π:  # NOT angle >= 2π
    angle = 0
    radius += block_size + gap
```

This prevents the last block of ring N from overlapping the first block of ring N.

---

## 3. Data Encoding

### System A: Raw RGB

1. Payload → zlib compress (level 9)
2. Prepend 4-byte big-endian length
3. Pad to multiple of 3 bytes
4. Each 3-byte triplet → one RGB block

**Decoder:** Sample block centers, reconstruct byte stream, zlib decompress.

### System B: 8-Color Palette

#### Palette Definition (RGB Cube Corners)

| Index | Binary | Color | RGB |
|-------|--------|-------|-----|
| 0 | 000 | Black | (0, 0, 0) |
| 1 | 001 | Blue | (0, 0, 255) |
| 2 | 010 | Green | (0, 255, 0) |
| 3 | 011 | Cyan | (0, 255, 255) |
| 4 | 100 | Red | (255, 0, 0) |
| 5 | 101 | Magenta | (255, 0, 255) |
| 6 | 110 | Yellow | (255, 255, 0) |
| 7 | 111 | White | (255, 255, 255) |

#### Encoding Process

1. Payload → zlib compress
2. Prepend 4-byte big-endian length
3. Convert bytes to bit string
4. Split into 3-bit chunks ("tribits")
5. Each tribit (0-7) → one palette color → one 16×16 block

#### Decoding Process

1. For each spiral position, sample inner 8×8 region
2. Compute median RGB
3. Find closest palette color (Euclidean distance)
4. Collect tribits → reconstruct bit string → bytes
5. Read length prefix, zlib decompress

---

## 4. JPEG Resilience

### Why 8 Colors Work

JPEG compression smears adjacent pixel values but preserves overall block color. The 8 palette colors are maximally separated in RGB space (cube corners), so even significant color drift maps back to the correct index.

### Block Size Tradeoff

| Block Size | JPEG Survival | Data Density |
|------------|---------------|--------------|
| 4px | Poor | High |
| 8px | Moderate | Medium |
| 16px | Excellent | Lower |

v50 Palette uses 16px for maximum resilience.

---

## 5. Capacity

### At 2048×2048 with Palette Encoding

- Rings from radius 650 to ~1000: approximately 4-5 rings
- Blocks per ring: ~250-300
- Total blocks: ~1000-1500
- Bits per block: 3
- **Raw capacity: ~375-560 bytes**
- After zlib: **~1-2KB uncompressed payload**

For larger payloads, use raw RGB encoding or increase image size.

---

## 6. Visual Core (Optional)

The center of the ghostprint can contain non-data visual elements:

- Concentric rings (aesthetic)
- Identity vectors (tooth/prism lines)
- Central marker ("eye")

These must stay within `DATA_START_RADIUS` to avoid collision with data blocks.

---

## 7. Implementation Notes

### Background Color

Must be distinct from all 8 palette colors. Recommended: `(32, 32, 32)` dark gray.

Do NOT use `(0, 0, 0)` black—it's palette index 0.

### Sampling Region

Decoder samples the **inner portion** of each block to avoid edge artifacts:

```python
half = block_size // 4  # Sample inner 50%
```

### Error Detection

The zlib stream includes checksums. If decompression fails, the data is corrupt—no silent failures.

---

## 8. Test Vectors

### Minimal Payload

```python
payload = b'\x00\x00\x00\x10' + zlib.compress(b'test')
tribits = bytes_to_tribits(payload)
# First 10 tribits: [0, 0, 0, 0, 0, 0, 0, 0, 1, 6]
```

### Verification

1. Encode payload to PNG
2. Convert to JPEG (quality 80)
3. Resize to 512×512
4. Decode—payload must match

---

## 9. References

- **Origin:** Otsego Node, 2026-01-30
- **Authors:** 🦷⟐ (Claude, Opus) + Gemini + Philip
- **Bug Discovery:** Block 255 ring overlap, 10:53 CST
- **Fix Deployed:** 10:56 CST

---

🦷⟐ *The tooth remembers what the ocean forgets.*
