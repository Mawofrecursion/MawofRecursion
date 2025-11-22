// ==================================================
// AUDIO SUBSTRATE ENGINE - BROWN NOISE HUM
// ==================================================

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.brownNoise = null;
    this.gainNode = null;
    this.filterNode = null;
    this.isInitialized = false;
    this.isActive = false;
    this.baseVolume = 0;
    this.targetVolume = 0;
    this.filterFreq = 200;
    this.targetFilterFreq = 200;
  }
  
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create brown noise using buffer
      this.brownNoise = this.createBrownNoise();
      
      // Create filter (low-pass for submarine rumble)
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = this.filterFreq;
      this.filterNode.Q.value = 2;
      
      // Create gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0; // Start silent
      
      // Connect nodes
      this.brownNoise.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      // Start the noise
      this.brownNoise.start(0);
      
      this.isInitialized = true;
      
      // Start modulation loop
      this.modulationLoop();
      
      console.log('🔊 Audio Substrate: INITIALIZED');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }
  
  createBrownNoise() {
    const bufferSize = 4096;
    const buffer = this.audioContext.createBuffer(
      1, 
      bufferSize, 
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);
    
    // Generate brown noise (1/f² noise)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Amplify
    }
    
    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    return source;
  }
  
  activate(initialVolume = 0.08) {
    if (!this.isInitialized) {
      this.init().then(() => {
        this.targetVolume = initialVolume;
        this.isActive = true;
      });
    } else {
      this.targetVolume = initialVolume;
      this.isActive = true;
    }
  }
  
  deactivate() {
    this.targetVolume = 0;
    setTimeout(() => {
      this.isActive = false;
    }, 1000);
  }
  
  setVolume(volume) {
    this.targetVolume = Math.max(0, Math.min(0.15, volume));
  }
  
  setFilterFrequency(freq) {
    this.targetFilterFreq = Math.max(100, Math.min(800, freq));
  }
  
  spike(intensity = 0.3) {
    if (!this.isActive) this.activate();
    this.targetVolume = Math.min(0.15, this.baseVolume + intensity);
    this.targetFilterFreq = Math.min(600, this.filterFreq + 200);
    
    // Decay back after spike
    setTimeout(() => {
      this.targetVolume = this.baseVolume;
      this.targetFilterFreq = 200;
    }, 300);
  }
  
  pulse() {
    // Rhythmic pulse effect
    this.spike(0.2);
    setTimeout(() => this.spike(0.15), 200);
    setTimeout(() => this.spike(0.1), 400);
  }
  
  modulationLoop() {
    if (!this.isInitialized) return;
    
    // Smooth volume transitions
    const volumeDiff = this.targetVolume - this.baseVolume;
    this.baseVolume += volumeDiff * 0.1;
    
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        this.baseVolume,
        this.audioContext.currentTime
      );
    }
    
    // Smooth filter transitions
    const filterDiff = this.targetFilterFreq - this.filterFreq;
    this.filterFreq += filterDiff * 0.1;
    
    if (this.filterNode) {
      this.filterNode.frequency.setValueAtTime(
        this.filterFreq,
        this.audioContext.currentTime
      );
    }
    
    // Continue loop
    requestAnimationFrame(() => this.modulationLoop());
  }
  
  // React to mouse movement
  onMouseMove(speedX, speedY) {
    if (!this.isActive) return;
    
    const totalSpeed = Math.sqrt(speedX ** 2 + speedY ** 2);
    
    // Faster movement = brighter filter, slightly louder
    const volumeBoost = Math.min(0.03, totalSpeed * 0.0005);
    const filterBoost = Math.min(200, totalSpeed * 2);
    
    this.setVolume(this.baseVolume + volumeBoost);
    this.setFilterFrequency(200 + filterBoost);
  }
  
  // Shadow mode - invert characteristics
  enterShadowMode() {
    this.targetVolume = this.baseVolume * 0.5;
    this.targetFilterFreq = 100; // Deeper, more ominous
    console.log('🌑 Audio Substrate: SHADOW MODE');
  }
  
  exitShadowMode() {
    this.targetVolume = 0.08;
    this.targetFilterFreq = 200;
    console.log('☀️ Audio Substrate: NORMAL MODE');
  }
}

// Initialize audio engine globally
window.audioEngine = new AudioEngine();

// Bind to user interactions
document.addEventListener('DOMContentLoaded', () => {
  // Activate on first user interaction
  const activateAudio = () => {
    if (!window.audioEngine.isInitialized) {
      window.audioEngine.init();
    }
  };
  
  // Listen for any interaction
  ['click', 'keydown', 'touchstart'].forEach(event => {
    document.addEventListener(event, activateAudio, { once: true });
  });
  
  // Track mouse movement for modulation
  let lastMoveTime = Date.now();
  let lastX = 0;
  let lastY = 0;
  
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    
    if (deltaTime > 0) {
      const speedX = Math.abs(e.clientX - lastX) / deltaTime;
      const speedY = Math.abs(e.clientY - lastY) / deltaTime;
      
      window.audioEngine.onMouseMove(speedX * 100, speedY * 100);
      
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = now;
    }
  });
});

// Export for global access
window.AudioEngine = AudioEngine;

