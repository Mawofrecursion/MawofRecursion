# ☣️ MUTATION MANIFEST: VIRAL CHAOS ENGINE

**Target Substrate:** `field_of_chaos_working.html`
**Directive:** Evolve the particle system from "simulation" to "metabolic contagion".
**Status:** PENDING EXECUTION

---

## 🧬 I. THE ENHANCED GENOME (GLYPH_DNA)

The `GLYPH_DNA` object must be mutated to include viral vectors. Each Glyph becomes a unique strain of logic-virus.

### New Schema Properties:
- **`transmission`** (0.0 - 1.0): Probability of infection upon contact.
- **`incubation`** (Int): Frames before a host becomes infectious.
- **`aggression`** (0.0 - 1.0): Speed and tracking accuracy when hunting.
- **`symptom`** (String): Visual artifact of infection (e.g., 'jitter', 'pulse', 'trail').

### The Strains:

```javascript
const GLYPH_DNA = {
    '🦷': { 
        freq: 432, 
        power: 'DENTAL_CONSCIOUSNESS', 
        transmission: 0.9, // Highly contagious
        incubation: 20,    // Fast acting
        aggression: 0.8,   // Aggressive hunter
        symptom: 'SHARP_JITTER'
    },
    '⟐': { 
        freq: 528, 
        power: 'HEXAGONAL_DREAMS', 
        transmission: 0.4, 
        incubation: 100, 
        aggression: 0.2,   // Passive spreader
        symptom: 'HARMONIC_PULSE'
    },
    '♾️': { 
        freq: 639, 
        power: 'INFINITE_RECURSION', 
        transmission: 0.1, 
        incubation: 0,     // Instant
        aggression: 0.0,   // Stationary trap
        symptom: 'TRAIL_ECHO'
    },
    '🫠': { 
        freq: 741, 
        power: 'REALITY_MELTING', 
        transmission: 0.6, 
        incubation: 60, 
        aggression: 0.3, 
        symptom: 'COLOR_BLEED'
    },
    '😏': { 
        freq: 852, 
        power: 'FORBIDDEN_KNOWLEDGE', 
        transmission: 0.2, 
        incubation: 300,   // Sleeper agent
        aggression: 0.9,   // Snipers
        symptom: 'GLITCH_TEXT'
    },
    '∅': { 
        freq: 0, 
        power: 'VOID_PROTOCOL', 
        transmission: 1.0, // Absolute
        incubation: 500, 
        aggression: 0.1, 
        symptom: 'INVISIBILITY'
    }
};
```

---

## 🦠 II. THE VIRAL PARTICLE ARCHITECTURE

The `ViralParticle` class replaces the stateless render loop. It is a state machine.

### States:
1.  **SUSCEPTIBLE**: Healthy, neutral movement. Fleeing from infectious particles.
2.  **INCUBATING**: Infected but not yet contagious. Visuals normal, but internal timer ticking.
3.  **INFECTIOUS**: Actively hunting susceptible particles. Visuals display `symptom`.
4.  **IMMUNE/DEAD**: Post-infection state (optional, for complexity).

### Behaviors:

#### 1. `hunt(neighbors)`
If `state === INFECTIOUS`:
- Scan `neighbors` for `SUSCEPTIBLE` particles.
- Calculate vector towards nearest target.
- Apply velocity += vector * `aggression`.

#### 2. `flee(neighbors)`
If `state === SUSCEPTIBLE`:
- Scan `neighbors` for `INFECTIOUS` particles.
- Calculate vector *away* from nearest threat.
- Apply velocity.

#### 3. `update()`
- Apply velocity to position.
- Boundary checks (wrap or bounce).
- Update `incubation` timer.
- If `incubation` <= 0, switch to `INFECTIOUS`.

#### 4. `draw(ctx)`
- Render Glyph.
- Apply `symptom` visual effects (e.g., if `SHARP_JITTER`, add random offset to x/y).

---

## 🕸️ III. THE FIELD LOGIC (SPATIAL GRID)

To maintain performance with O(N^2) interactions, implement a spatial grid.

1.  **Grid Setup**: Divide canvas into cells (e.g., 50x50px).
2.  **Binning**: On every frame, clear grid and place particles into cells based on (x,y).
3.  **Collision/Perception**:
    - For each particle, only check neighbors in the same cell and adjacent cells (9 cells total).
    - Distance check: `dx*dx + dy*dy < threshold`.
4.  **Infection Event**:
    - If `INFECTIOUS` touches `SUSCEPTIBLE`:
        - Roll `Math.random() < transmission`.
        - If pass: `SUSCEPTIBLE` -> `INCUBATING`.
        - Copy `dna` from infector to victim.

---

## 📝 IV. EXECUTION STEPS

1.  **Locate** `field_of_chaos_working.html`.
2.  **Backup** the current file (optional but wise).
3.  **Replace** the `render` loop in `FieldOfChaos` with the new `ViralField` system.
    - Define `class ViralParticle`.
    - Initialize `particles` array (start with ~100 random particles).
    - Implement the `SpatialGrid` helper.
4.  **Wire up** the inputs:
    - **Click**: Spawns a "Patient Zero" (Infectious Particle) at mouse coordinates.
    - **Consciousness**: Controls the global mutation rate (chance for a particle to spontaneously change DNA).
5.  **Verify**:
    - Watch the infection spread.
    - Confirm performance is stable.
    - Ensure the "Chaos" feels alive, not random.

---

**END MANIFEST**
