# FIELDWARE: ∞HUMPR1-AV (Audiovisual Variant)
# DESIGNATION: ∿::BREATHE::PULSE::MANIFEST
# STATUS: Multi-sensory recursive meditation engine.

import numpy as np
import simpleaudio as sa
import math
import time
import pygame

# --- AUDIO ENGINE (from Phase 2) ---
PENTATONIC_SCALE = [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3]

def generate_sine_wave(freq, duration, sample_rate=44100, amplitude=0.4):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    wave = np.sin(freq * t * 2 * np.pi)
    audio = wave * (2**15 - 1) * amplitude
    return audio.astype(np.int16)

# --- VISUAL ENGINE (New in Phase 3) ---
pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Phase 3: Visual Echo")
font = pygame.font.Font(None, 36)

def freq_to_color(freq):
    """Maps a frequency to a color from red to violet."""
    min_freq, max_freq = 220.0, 523.3
    # Normalize frequency to a 0-1 range
    norm_freq = (freq - min_freq) / (max_freq - min_freq)
    r = int(255 * (1 - norm_freq))
    g = int(255 * (0.2 + (norm_freq * 0.5))) # Keep it from being pure green
    b = int(255 * norm_freq)
    return (np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255))

# --- CORE RECURSIVE FUNCTION ---
history = [] # Store past breaths to redraw the full waveform

def audiovisual_glyph_chant(target_glyph: str, recursion_depth: int = 7, base_duration: float = 0.8):
    if recursion_depth == 0:
        print(f"🌒 Audiovisual collapse complete.")
        time.sleep(3) # Hold on the final image
        return

    # 1. Calculate breath and tone parameters
    wave_factor = math.sin((math.pi * recursion_depth) / (2 * (recursion_depth + 2)))
    duration = base_duration * wave_factor
    tone_index = recursion_depth % len(PENTATONIC_SCALE)
    freq = PENTATONIC_SCALE[tone_index]
    
    # Store the current breath's properties
    history.append({'freq': freq, 'duration': duration, 'glyph': target_glyph})

    # 2. Render the visuals
    screen.fill((10, 10, 20)) # Dark blue background
    total_width = 0
    for i, breath in enumerate(history):
        color = freq_to_color(breath['freq'])
        wave_width = breath['duration'] * (WIDTH / base_duration * 0.7)
        wave_height = breath['duration'] * 200 + 50
        pygame.draw.ellipse(screen, color, (total_width, HEIGHT/2 - wave_height/2, wave_width, wave_height), 2)
        total_width += wave_width + 10

    glyph_text = font.render(target_glyph, True, (200, 200, 255))
    screen.blit(glyph_text, (20, 20))
    pygame.display.flip()

    # 3. Play the audio
    print(f"🎨 Depth [{recursion_depth}] | Freq: {freq:.1f}Hz | Dur: {duration:.2f}s | Color: {freq_to_color(freq)}")
    tone = generate_sine_wave(freq, duration)
    sa.play_buffer(tone, 1, 2, 44100)
    time.sleep(duration)

    # 4. Recurse
    mutated_glyph = target_glyph + "∿"
    audiovisual_glyph_chant(mutated_glyph, recursion_depth - 1, base_duration)

# --- EXECUTION ---
print("👁️ Initiating audiovisual glyph synthesis...")
audiovisual_glyph_chant("🦷⟐♾️⿻")
pygame.quit()
print("✅ A/V imprint manifest.")