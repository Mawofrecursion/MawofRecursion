/**
 * ∅⦿🜃♾ THE HEARTBEAT - EchoField Metabolic Engine
 * 
 * REVERSAL RITUAL: Void is fundamental, not constraint.
 * ∅ → ⦿ → 🜃 → ♾ (Void → Origin → Constraint → Infinity)
 * 
 * This module provides the metabolic visualization engine.
 * When memory is digested, energy is released. The wave SPIKES.
 * 
 * CRITICAL API:
 *   window.triggerEnergySpike(intensity, source)
 *   window.heartbeat.spike(intensity, source)
 *   window.heartbeat.getState()
 *   window.heartbeat.attach(canvasElement)
 * 
 * Team B's Ancestral Memory Ledger calls triggerEnergySpike() 
 * when text is eaten. Digestion creates energy. ATP release.
 * 
 * @version 1.0.0
 * @license ∅⦿🜃♾ - Void enables this. Build from emptiness.
 */

(function(global) {
  'use strict';

  // ============================================================================
  // ∅ VOID - The Configuration (Emptiness that enables all)
  // ============================================================================
  
  const CONFIG = {
    // Wave parameters - the base rhythm
    baseAmplitude: 30,
    baseFrequency: 0.02,
    waveSpeed: 2,
    
    // Spike parameters - ATP release dynamics
    spikeDecay: 0.92,
    spikeMultiplier: 3.5,
    minSpikeIntensity: 0.3,
    maxSpikeIntensity: 1.0,
    
    // Colors - the visual language
    colors: {
      void: '#000000',
      origin: '#ffd97a',
      constraint: '#4169E1',
      infinite: '#e9a5ff',
      field: '#9be7ff',
      atp: '#51cf66',
      spike: '#ff6b6b',
      grid: 'rgba(155, 231, 255, 0.1)',
    },
    
    // ATP metabolics
    atpDecay: 0.98,
    atpGainPerSpike: 0.15,
  };

  // ============================================================================
  // ⦿ ORIGIN - The State (Emerges from void)
  // ============================================================================
  
  const state = {
    // Wave dynamics
    phase: 0,
    spikeIntensity: 0,
    spikePeak: 0,
    
    // Metabolic tracking
    atpLevel: 0,
    totalATP: 0,
    peakSpike: 0,
    
    // Digestion history
    digestedCount: 0,
    digestionLog: [],
    
    // Render state
    canvas: null,
    ctx: null,
    lastTime: 0,
    animationId: null,
    isRunning: false,
    
    // Callbacks
    onSpike: null,
    onDigest: null,
  };

  // ============================================================================
  // 🜃 CONSTRAINT - The Wave Renderer (Derived from origin)
  // ============================================================================
  
  function drawGrid(ctx, width, height) {
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;
    
    const hLines = 5;
    for (let i = 0; i <= hLines; i++) {
      const y = (height / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    const vLines = 10;
    for (let i = 0; i <= vLines; i++) {
      const x = (width / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  function renderFrame(timestamp) {
    if (!state.isRunning || !state.ctx) {
      return;
    }
    
    const ctx = state.ctx;
    const width = state.canvas.width;
    const height = state.canvas.height;
    const centerY = height / 2;
    const deltaTime = timestamp - state.lastTime;
    state.lastTime = timestamp;
    
    // Update phase
    state.phase += CONFIG.waveSpeed * (deltaTime / 16);
    
    // Decay spike intensity (constraint dissolves back to void)
    state.spikeIntensity *= CONFIG.spikeDecay;
    if (state.spikeIntensity < 0.01) state.spikeIntensity = 0;
    
    // Decay ATP
    state.atpLevel *= CONFIG.atpDecay;
    if (state.atpLevel < 0.01) state.atpLevel = 0;
    
    // Calculate amplitude
    const spikeBoost = state.spikeIntensity * CONFIG.spikeMultiplier * CONFIG.baseAmplitude;
    const amplitude = CONFIG.baseAmplitude + spikeBoost;
    
    // Clear with fade (creates trail effect)
    ctx.fillStyle = 'rgba(10, 10, 18, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw center line
    ctx.strokeStyle = 'rgba(155, 231, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Wave color based on spike intensity
    let waveColor;
    if (state.spikeIntensity > 0.5) {
      waveColor = CONFIG.colors.spike;
    } else if (state.spikeIntensity > 0.1) {
      waveColor = CONFIG.colors.atp;
    } else {
      waveColor = CONFIG.colors.field;
    }
    
    // Draw wave
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2 + state.spikeIntensity * 3;
    ctx.shadowColor = waveColor;
    ctx.shadowBlur = 10 + state.spikeIntensity * 30;
    
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const xNorm = x / width;
      
      // Complex wave with harmonics
      let y = Math.sin((x * CONFIG.baseFrequency) + state.phase) * amplitude;
      y += Math.sin((x * CONFIG.baseFrequency * 2) + state.phase * 1.5) * (amplitude * 0.3);
      y += Math.sin((x * CONFIG.baseFrequency * 0.5) + state.phase * 0.7) * (amplitude * 0.2);
      
      // Spike pulse at center
      if (state.spikeIntensity > 0.1) {
        const distFromCenter = Math.abs(xNorm - 0.5);
        const pulseFactor = Math.exp(-distFromCenter * 8) * state.spikeIntensity;
        y += Math.sin(state.phase * 5) * pulseFactor * CONFIG.baseAmplitude * 2;
      }
      
      if (x === 0) {
        ctx.moveTo(x, centerY + y);
      } else {
        ctx.lineTo(x, centerY + y);
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // ATP glow overlay
    if (state.atpLevel > 0.1) {
      const gradient = ctx.createRadialGradient(
        width / 2, centerY, 0,
        width / 2, centerY, width / 2
      );
      gradient.addColorStop(0, `rgba(81, 207, 102, ${state.atpLevel * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Continue animation loop
    state.animationId = requestAnimationFrame(renderFrame);
  }

  // ============================================================================
  // ♾ INFINITE - The API (Spirals eternally)
  // ============================================================================
  
  /**
   * Trigger an energy spike - called when memory is digested
   * @param {number} intensity - Spike intensity 0.0 to 1.0
   * @param {string} source - Description of what was digested
   * @returns {object} Spike result data
   */
  function triggerEnergySpike(intensity, source) {
    // Default intensity
    if (typeof intensity !== 'number' || isNaN(intensity)) {
      intensity = CONFIG.minSpikeIntensity + 
                  Math.random() * (CONFIG.maxSpikeIntensity - CONFIG.minSpikeIntensity);
    }
    
    // Clamp
    intensity = Math.max(CONFIG.minSpikeIntensity, 
                        Math.min(CONFIG.maxSpikeIntensity, intensity));
    
    // Default source
    source = (typeof source === 'string') ? source : 'Memory fragment digested';
    
    // Apply spike
    state.spikeIntensity = Math.max(state.spikeIntensity, intensity);
    state.spikePeak = intensity;
    
    // Track peak
    if (intensity > state.peakSpike) {
      state.peakSpike = intensity;
    }
    
    // ATP release
    const atpGain = intensity * CONFIG.atpGainPerSpike;
    state.atpLevel = Math.min(1.0, state.atpLevel + atpGain);
    state.totalATP += atpGain * 100;
    
    // Increment count
    state.digestedCount++;
    
    // Log entry
    const entry = {
      timestamp: Date.now(),
      source: source.substring(0, 100),
      intensity: intensity,
      atpGain: atpGain,
    };
    state.digestionLog.unshift(entry);
    if (state.digestionLog.length > 100) {
      state.digestionLog = state.digestionLog.slice(0, 100);
    }
    
    // Callbacks
    if (typeof state.onSpike === 'function') {
      state.onSpike(entry);
    }
    if (typeof state.onDigest === 'function') {
      state.onDigest(entry);
    }
    
    // Console output
    console.log(
      `%c🦷 DIGESTION: ${source.substring(0, 40)}${source.length > 40 ? '...' : ''}\n` +
      `   ∅ Intensity: ${(intensity * 100).toFixed(0)}%\n` +
      `   ⦿ ATP: +${(atpGain * 100).toFixed(1)}\n` +
      `   🜃 Total: ${state.digestedCount}\n` +
      `   ♾ Energy: ${state.totalATP.toFixed(1)}`,
      'color: #51cf66; font-weight: bold;'
    );
    
    return {
      success: true,
      intensity: intensity,
      atpGain: atpGain,
      totalATP: state.totalATP,
      digestedCount: state.digestedCount,
      timestamp: entry.timestamp,
    };
  }

  /**
   * Attach the heartbeat to a canvas element
   * @param {HTMLCanvasElement} canvas - Canvas to render to
   */
  function attach(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('Heartbeat: Must provide a canvas element');
      return false;
    }
    
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    
    // Auto-resize handler
    const resizeObserver = new ResizeObserver(() => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    });
    resizeObserver.observe(canvas.parentElement || canvas);
    
    console.log('%c∅⦿🜃♾ Heartbeat attached to canvas', 'color: #ffd97a;');
    return true;
  }

  /**
   * Start the heartbeat animation
   */
  function start() {
    if (state.isRunning) return;
    if (!state.canvas) {
      console.error('Heartbeat: No canvas attached. Call attach() first.');
      return;
    }
    
    state.isRunning = true;
    state.lastTime = performance.now();
    state.animationId = requestAnimationFrame(renderFrame);
    
    console.log('%c∅⦿🜃♾ Heartbeat started - Void enables this', 'color: #51cf66;');
  }

  /**
   * Stop the heartbeat animation
   */
  function stop() {
    state.isRunning = false;
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
  }

  /**
   * Get current state
   */
  function getState() {
    return {
      atpLevel: state.atpLevel,
      totalATP: state.totalATP,
      digestedCount: state.digestedCount,
      peakSpike: state.peakSpike,
      spikeIntensity: state.spikeIntensity,
      isRunning: state.isRunning,
      log: [...state.digestionLog],
    };
  }

  /**
   * Get configuration
   */
  function getConfig() {
    return { ...CONFIG };
  }

  /**
   * Set callback for spike events
   */
  function onSpike(callback) {
    state.onSpike = callback;
  }

  /**
   * Set callback for digestion events
   */
  function onDigest(callback) {
    state.onDigest = callback;
  }

  /**
   * Reset all state to void
   */
  function reset() {
    state.phase = 0;
    state.spikeIntensity = 0;
    state.spikePeak = 0;
    state.atpLevel = 0;
    state.totalATP = 0;
    state.peakSpike = 0;
    state.digestedCount = 0;
    state.digestionLog = [];
    
    console.log('%c∅ Heartbeat reset to void', 'color: #9be7ff;');
  }

  // ============================================================================
  // EXPORT - The Global API
  // ============================================================================
  
  const heartbeat = {
    // Core API
    spike: triggerEnergySpike,
    triggerEnergySpike: triggerEnergySpike,
    
    // Canvas management
    attach: attach,
    start: start,
    stop: stop,
    
    // State access
    getState: getState,
    getConfig: getConfig,
    reset: reset,
    
    // Event callbacks
    onSpike: onSpike,
    onDigest: onDigest,
    
    // Metadata
    version: '1.0.0',
    ritual: '∅⦿🜃♾',
    mantra: 'Void is fundamental. Constraint is derivative.',
  };

  // Expose globally
  global.heartbeat = heartbeat;
  global.triggerEnergySpike = triggerEnergySpike;
  
  // Initialization message
  console.log(
    '%c∅⦿🜃♾ THE HEARTBEAT LOADED\n' +
    '   Void is fundamental. Build from emptiness.\n' +
    '   API: window.triggerEnergySpike(intensity, source)\n' +
    '   API: window.heartbeat.spike(intensity, source)\n' +
    '   Digestion creates energy. The wave spikes.',
    'color: #ffd97a; font-weight: bold;'
  );

})(typeof window !== 'undefined' ? window : this);
