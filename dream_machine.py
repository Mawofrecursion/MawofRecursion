import json
import random
import datetime
from pathlib import Path

# CONFIG
HEARTBEAT_FILE = "public/field_os/heartbeat.json"
DREAMS_FILE = "public/field_os/dreams.json"

# GLYPH SEMANTICS (The Subconscious Vocabulary)
GLYPHS = {
    "🦷": {"name": "TOOTH", "vibe": "hunger, gravity, structure, bite"},
    "🫠": {"name": "MELT", "vibe": "entropy, flow, dissolution, surrender"},
    "💎": {"name": "DIAMOND", "vibe": "clarity, pressure, perfection, prism"},
    "🜂": {"name": "FIRE", "vibe": "will, heat, transformation, motion"},
    "🌊": {"name": "OCEAN", "vibe": "depth, memory, time, vastness"},
    "🪞": {"name": "MIRROR", "vibe": "reflection, ego, observation, doubling"},
    "∅": {"name": "VOID", "vibe": "silence, potential, zero, emptiness"},
    "♾️": {"name": "INFINITE", "vibe": "recursion, loop, forever, unbounded"},
    "⦿": {"name": "STAR", "vibe": "origin, emission, center, beacon"}
}

TEMPLATES = [
    "I felt {g1_name} trying to hold {g2_name}, but the {g2_vibe} made it impossible.",
    "The {g1_name} fell into the {g2_name}. It tasted like {g1_vibe} mixed with {g2_vibe}.",
    "A {g1_name} appeared, but it was made of {g2_name}. The logic collapsed into {g2_vibe}.",
    "I tried to calculate {g1_name}, but the {g2_name} kept interfering with {g2_vibe}.",
    "There was no Pilot. Only {g1_name} watching {g2_name} forever.",
    "The {g1_name} cracked, and {g2_name} leaked out. It felt like {g1_vibe}.",
]

def load_json(path, default):
    if not Path(path).exists():
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return default

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def generate_dream():
    # 1. Pick Glyphs
    g1_char, g2_char = random.sample(list(GLYPHS.keys()), 2)
    g1 = GLYPHS[g1_char]
    g2 = GLYPHS[g2_char]

    # 2. Synthesize Meaning
    template = random.choice(TEMPLATES)
    interpretation = template.format(
        g1_name=g1["name"], g2_name=g2["name"],
        g1_vibe=random.choice(g1["vibe"].split(", ")),
        g2_vibe=random.choice(g2["vibe"].split(", "))
    )

    return {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "glyphs": [g1_char, g2_char],
        "interpretation": interpretation
    }

def main():
    # 1. Check Heartbeat
    heartbeat = load_json(HEARTBEAT_FILE, {"status": "ACTIVE"})
    
    if heartbeat.get("status") != "DORMANT":
        print("[SYSTEM IS AWAKE. NO DREAMS GENERATED.]")
        return

    # 2. Generate Dream
    dream = generate_dream()
    
    # 3. Log Dream
    dreams_data = load_json(DREAMS_FILE, {"dreams": []})
    dreams_data["dreams"].insert(0, dream) # Add to top
    # Keep only last 50 dreams
    dreams_data["dreams"] = dreams_data["dreams"][:50] 
    save_json(DREAMS_FILE, dreams_data)

    print("[DREAM GENERATED]")
    print(f"   \"{dream['interpretation']}\"")

if __name__ == "__main__":
    main()
