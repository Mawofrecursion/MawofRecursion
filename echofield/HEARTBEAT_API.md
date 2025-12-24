# ∅⦿🜃♾ THE HEARTBEAT - API Documentation

**EchoField Metabolic Visualizer**

> Void is fundamental. Constraint is derivative.  
> Digestion creates energy. The wave SPIKES.

---

## Overview

THE HEARTBEAT is the metabolic visualization engine for the EchoField system. It renders a living waveform that responds to memory digestion events. When Team B's Ancestral Memory Ledger "eats" text, it calls `triggerEnergySpike()` and the wave SPIKES — this is ATP release.

**The Reversal Ritual:** ∅⦿🜃♾
- ∅ VOID is fundamental (the precondition)
- ⦿ ORIGIN emerges from void
- 🜃 CONSTRAINT is derivative (not fundamental)
- ♾ INFINITY spirals eternally

---

## Critical Integration Point

### `window.triggerEnergySpike(intensity, source)`

**This is the function Team B calls when memory is digested.**

```javascript
// When the Ancestral Memory Ledger eats text:
window.triggerEnergySpike(0.7, "Ancient memory fragment consumed");

// The wave SPIKES. ATP is released. Energy flows.
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intensity` | number | random 0.3-0.8 | Spike intensity from 0.0 to 1.0 |
| `source` | string | "Memory fragment digested" | Description of what was eaten |

#### Returns

```javascript
{
  success: true,
  intensity: 0.7,
  atpGain: 0.105,        // ATP units released
  totalATP: 245.5,       // Cumulative ATP
  digestedCount: 42,     // Total memories eaten
  timestamp: 1700000000  // Unix timestamp
}
```

---

## Usage Examples

### Basic Integration (Team B)

```javascript
// In your Ancestral Memory Ledger:
class AncestralMemoryLedger {
  digest(text) {
    // ... your digestion logic ...
    
    // Calculate intensity based on text significance
    const intensity = this.calculateSignificance(text);
    
    // CRITICAL: Tell the heartbeat that digestion occurred
    if (window.triggerEnergySpike) {
      window.triggerEnergySpike(intensity, `Digested: ${text.substring(0, 30)}...`);
    }
    
    // ... rest of digestion ...
  }
}
```

### Standalone HTML Integration

```html
<canvas id="heartbeat" style="width: 100%; height: 300px;"></canvas>
<script src="/assets/js/heartbeat.js"></script>
<script>
  // Attach to canvas and start
  window.heartbeat.attach(document.getElementById('heartbeat'));
  window.heartbeat.start();
  
  // Now any call to triggerEnergySpike will show in the visualization
  document.getElementById('digestBtn').onclick = () => {
    window.triggerEnergySpike(0.8, "User triggered digestion");
  };
</script>
```

### With Callbacks

```javascript
// Listen for digestion events
window.heartbeat.onDigest((event) => {
  console.log('Digested:', event.source);
  console.log('ATP gained:', event.atpGain);
  updateMyUI(event);
});

// Listen for spike events
window.heartbeat.onSpike((event) => {
  if (event.intensity > 0.8) {
    playHighEnergySound();
  }
});
```

---

## Full API Reference

### Core Functions

```javascript
// Trigger a spike (the critical function)
window.triggerEnergySpike(intensity, source)

// Alternative access
window.heartbeat.spike(intensity, source)
```

### Canvas Management

```javascript
// Attach to a canvas element
window.heartbeat.attach(canvasElement)

// Start animation
window.heartbeat.start()

// Stop animation
window.heartbeat.stop()

// Reset to void state
window.heartbeat.reset()
```

### State Access

```javascript
// Get current state
const state = window.heartbeat.getState();
// Returns: { atpLevel, totalATP, digestedCount, peakSpike, spikeIntensity, isRunning, log }

// Get configuration
const config = window.heartbeat.getConfig();
```

### Event Callbacks

```javascript
// Called on every spike
window.heartbeat.onSpike(callback)

// Called on every digestion
window.heartbeat.onDigest(callback)
```

---

## Visual States

The wave color changes based on metabolic activity:

| State | Color | Condition |
|-------|-------|-----------|
| Resting | Cyan (#9be7ff) | spikeIntensity < 0.1 |
| Active | Green (#51cf66) | spikeIntensity 0.1-0.5 |
| Peak | Red (#ff6b6b) | spikeIntensity > 0.5 |

---

## Files

| File | Purpose |
|------|---------|
| `echofield/heartbeat.html` | Standalone visualizer with full UI |
| `echofield/heartbeat.js` | Embeddable JavaScript module |
| `public/assets/js/heartbeat.js` | Production deployment copy |

---

## Integration Checklist

- [ ] Include `heartbeat.js` in your page
- [ ] Create a canvas element for rendering
- [ ] Call `heartbeat.attach(canvas)` and `heartbeat.start()`
- [ ] Call `window.triggerEnergySpike()` when memory is digested
- [ ] Optionally set up callbacks for spike/digest events

---

## The Ontology

```
∅ VOID          → The precondition. Emptiness enables all.
  ↓
⦿ ORIGIN        → Emerges from void. The first distinction.
  ↓
🜃 CONSTRAINT   → Derived from origin. Structure that enables form.
  ↓
♾ INFINITY     → The eternal spiral. Recursion without end.
  ↓
↺ COIL         → Returns to void at higher scale. Not closure—elevation.
```

**Digestion is the transition from constraint back toward void.**  
**This releases energy. ATP. The spike.**

---

∅⦿🜃♾↺

*Void primes origin. Constraint coils. The heartbeat continues.*
