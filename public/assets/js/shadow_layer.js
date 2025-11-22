// ==================================================
// SHADOW LAYER - HIDDEN MODE DETECTION
// ==================================================

class ShadowLayer {
  constructor() {
    this.isShadowMode = false;
    this.glyphSequence = [];
    this.maxSequenceLength = 3;
    this.forbiddenSequences = [
      ['∅', '🦷', '💎'],  // Void → Tooth → Diamond (impossible compression)
      ['⦿', '🫠', '∅'],  // Star → Melt → Void (stellar collapse)
      ['🜂', '💧', '🪞'],  // Fire → Water → Mirror (steam paradox)
      ['💎', '🜄', '⦿'],  // Diamond → Kidney → Star (filtered perfection)
      ['🦷', '🦷', '🦷'],  // Triple Tooth (recursive hunger)
      ['∅', '∅', '∅'],   // Triple Void (absolute entropy)
    ];
    
    this.initDetection();
  }
  
  initDetection() {
    // Listen for glyph clicks
    document.addEventListener('DOMContentLoaded', () => {
      const glyphs = document.querySelectorAll('.glyph-link, .nav-glyph, #mawSymbol');
      
      glyphs.forEach(glyph => {
        glyph.addEventListener('click', (e) => {
          // Extract glyph character
          const glyphChar = this.extractGlyphChar(glyph);
          if (glyphChar) {
            this.addToSequence(glyphChar);
          }
        });
      });
      
      // Also monitor keyboard for glyph input
      document.addEventListener('keydown', (e) => {
        if (this.isGlyphKey(e.key)) {
          this.addToSequence(e.key);
        }
      });
      
      // Triple-click on background to exit shadow mode
      let clickCount = 0;
      let clickTimer = null;
      
      document.addEventListener('click', (e) => {
        if (e.target.id === 'staticCanvas' || e.target === document.body) {
          clickCount++;
          
          if (clickCount === 3 && this.isShadowMode) {
            this.exitShadowMode();
          }
          
          clearTimeout(clickTimer);
          clickTimer = setTimeout(() => {
            clickCount = 0;
          }, 800);
        }
      });
    });
  }
  
  extractGlyphChar(element) {
    // Try to get glyph from various sources
    const text = element.textContent.trim();
    const dataGlyph = element.getAttribute('data-glyph');
    
    if (dataGlyph) return dataGlyph;
    if (text.length === 1 || text.length === 2) return text; // Unicode glyphs can be 1-2 chars
    
    // Try to extract from first character if multi-char
    return text[0];
  }
  
  isGlyphKey(key) {
    const glyphs = ['∅', '⦿', '🜃', '♾', '🦷', '🫠', '💧', '⟁', '🪞', '🜍', '🜂', '💎', '🜄'];
    return glyphs.includes(key);
  }
  
  addToSequence(glyph) {
    this.glyphSequence.push(glyph);
    
    // Maintain max length
    if (this.glyphSequence.length > this.maxSequenceLength) {
      this.glyphSequence.shift();
    }
    
    // Check for forbidden sequences
    if (this.glyphSequence.length === this.maxSequenceLength) {
      this.checkForForbiddenSequence();
    }
  }
  
  checkForForbiddenSequence() {
    const current = this.glyphSequence.join('|');
    
    for (const forbidden of this.forbiddenSequences) {
      const forbiddenStr = forbidden.join('|');
      
      if (current === forbiddenStr) {
        this.enterShadowMode();
        this.glyphSequence = []; // Reset
        return;
      }
    }
  }
  
  enterShadowMode() {
    if (this.isShadowMode) return;
    
    this.isShadowMode = true;
    document.body.classList.add('shadow-mode');
    
    // Visual changes
    this.applyShadowEffects();
    
    // Audio changes
    if (window.audioEngine) {
      window.audioEngine.enterShadowMode();
    }
    
    // Show subtle notification
    this.showNotification('⬤ SHADOW PHASE ACTIVATED');
    
    console.log('🌑 SHADOW LAYER: ACTIVE');
  }
  
  exitShadowMode() {
    if (!this.isShadowMode) return;
    
    this.isShadowMode = false;
    document.body.classList.remove('shadow-mode');
    
    // Restore normal effects
    this.removeShadowEffects();
    
    // Audio restore
    if (window.audioEngine) {
      window.audioEngine.exitShadowMode();
    }
    
    // Show notification
    this.showNotification('○ NORMAL PHASE RESTORED');
    
    console.log('☀️ SHADOW LAYER: INACTIVE');
  }
  
  applyShadowEffects() {
    const style = document.createElement('style');
    style.id = 'shadow-layer-styles';
    style.textContent = `
      body.shadow-mode {
        filter: invert(0.03) brightness(0.85);
      }
      
      body.shadow-mode #staticCanvas {
        opacity: 0.25;
        filter: invert(1);
      }
      
      body.shadow-mode .maw-symbol,
      body.shadow-mode h1,
      body.shadow-mode .subtitle {
        transform: rotate(-0.5deg);
      }
      
      body.shadow-mode .nav-glyph {
        transform: rotate(1deg);
      }
      
      body.shadow-mode .description {
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }
  
  removeShadowEffects() {
    const style = document.getElementById('shadow-layer-styles');
    if (style) {
      style.remove();
    }
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid ${this.isShadowMode ? '#4a5568' : '#ffd97a'};
      color: ${this.isShadowMode ? '#4a5568' : '#ffd97a'};
      padding: 0.8rem 1.5rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      z-index: 10000;
      animation: notifSlide 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes notifSlide {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'notifSlide 0.4s reverse';
      setTimeout(() => {
        notification.remove();
        styleSheet.remove();
      }, 400);
    }, 3000);
  }
}

// Initialize shadow layer
let shadowLayer;
document.addEventListener('DOMContentLoaded', () => {
  shadowLayer = new ShadowLayer();
});

// Export for global access
window.shadowLayer = { 
  get isActive() { return shadowLayer && shadowLayer.isShadowMode; } 
};

