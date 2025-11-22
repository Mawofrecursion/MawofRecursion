// ==================================================
// GLYPH FORGE - NOISE TO MYTH TRANSMUTATION ENGINE
// ==================================================

const GLYPH_CODEX = {
  '∅': { name: 'VOID', weight: 'entropy', flavor: 'emptiness precedes form' },
  '⦿': { name: 'STAR', weight: 'coherence', flavor: 'the center holds' },
  '🜃': { name: 'EARTH', weight: 'constraint', flavor: 'gravity binds' },
  '♾️': { name: 'INFINITE', weight: 'recursion', flavor: 'the loop never closes' },
  '🦷': { name: 'TOOTH', weight: 'hunger', flavor: 'the threshold pierces' },
  '🫠': { name: 'MELT', weight: 'dissolution', flavor: 'boundaries surrender' },
  '💧': { name: 'WATER', weight: 'memory', flavor: 'the past flows forward' },
  '⟁': { name: 'LOCK', weight: 'convergence', flavor: 'three points triangulate' },
  '🪞': { name: 'MIRROR', weight: 'reflection', flavor: 'observation doubles' },
  '🜍': { name: 'MYTH', weight: 'narrative', flavor: 'meaning crystallizes' },
  '🜂': { name: 'FIRE', weight: 'will', flavor: 'intention transforms' },
  '💎': { name: 'DIAMOND', weight: 'singularity', flavor: 'duality dissolves' },
  '🜄': { name: 'KIDNEY', weight: 'filter', flavor: 'waste exits the system' }
};

const GLYPHS = Object.keys(GLYPH_CODEX);

const PROPHECY_TEMPLATES = [
  'The {g1_name} seeks the {g2_name}, but finds the {g3_name}.',
  '{g1_flavor}, until {g2_flavor}, then {g3_flavor}.',
  'Three forces: {g1_name} → {g2_name} → {g3_name}. The cycle completes.',
  'Your noise crystallizes as: {g1_weight} overwhelming {g2_weight}, filtered by {g3_weight}.',
  'The system predicts: {g1_name} will consume {g2_name}. Only {g3_name} remains.',
  'Pattern detected: {g1_flavor}; {g2_flavor}; {g3_flavor}. This is your myth-shard.',
  '{g1_name} + {g2_name} = {g3_name}. Coherence achieved.',
  'The {g1_name} melts into {g2_name}, leaving {g3_name} as residue.',
  'First: {g1_flavor}. Then: {g2_flavor}. Always: {g3_flavor}.',
  'Your entropy signature: [{g1_name}][{g2_name}][{g3_name}]. Myth registered.'
];

class GlyphForge {
  constructor() {
    this.isOpen = false;
    this.isProcessing = false;
    this.setupForge();
  }
  
  setupForge() {
    // Create forge overlay
    const forgeHTML = `
      <div id="glyphForge" class="glyph-forge hidden">
        <div class="forge-container">
          <div class="forge-header">
            <h2>⚡ GLYPH FORGE</h2>
            <button class="forge-close" id="forgeClose">[X]</button>
          </div>
          
          <div class="forge-prompt">
            INPUT NOISE // SEED GRAVITY
          </div>
          
          <div class="forge-input-container">
            <textarea 
              id="forgeInput" 
              class="forge-input" 
              placeholder="Type your chaos here... then press ENTER"
              maxlength="500"
            ></textarea>
            <div class="forge-char-count">
              <span id="charCount">0</span> / 500
            </div>
          </div>
          
          <div class="forge-output hidden" id="forgeOutput">
            <div class="myth-shard" id="mythShard">
              <div class="shard-glyphs" id="shardGlyphs"></div>
              <div class="shard-prophecy" id="shardProphecy"></div>
            </div>
            <button class="forge-reset" id="forgeReset">⟳ FORGE AGAIN</button>
          </div>
          
          <div class="forge-status" id="forgeStatus"></div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', forgeHTML);
    
    // Bind events
    document.getElementById('forgeClose').addEventListener('click', () => this.close());
    document.getElementById('forgeInput').addEventListener('input', (e) => this.updateCharCount(e));
    document.getElementById('forgeInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.processNoise();
      }
    });
    document.getElementById('forgeReset').addEventListener('click', () => this.reset());
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  open() {
    const forge = document.getElementById('glyphForge');
    forge.classList.remove('hidden');
    this.isOpen = true;
    
    // Focus input after animation
    setTimeout(() => {
      document.getElementById('forgeInput').focus();
    }, 300);
    
    // Trigger audio spike if available
    if (window.audioEngine) {
      window.audioEngine.spike(0.3);
    }
  }
  
  close() {
    const forge = document.getElementById('glyphForge');
    forge.classList.add('hidden');
    this.isOpen = false;
    this.reset();
  }
  
  updateCharCount(e) {
    const count = e.target.value.length;
    document.getElementById('charCount').textContent = count;
  }
  
  async processNoise() {
    if (this.isProcessing) return;
    
    const input = document.getElementById('forgeInput').value.trim();
    if (!input) return;
    
    this.isProcessing = true;
    const status = document.getElementById('forgeStatus');
    
    // Compression animation
    status.textContent = '⚡ COMPRESSING...';
    status.style.color = '#ffd97a';
    
    // Disable input
    document.getElementById('forgeInput').disabled = true;
    
    // Simulate compression delay
    await this.sleep(800);
    
    // Generate myth shard
    status.textContent = '🦷 DIGESTING...';
    await this.sleep(600);
    
    const shard = this.generateMythShard(input);
    
    status.textContent = '✓ MYTH CRYSTALLIZED';
    status.style.color = '#00ff41';
    
    // Display shard
    this.displayShard(shard);
    
    await this.sleep(400);
    status.textContent = '';
    
    this.isProcessing = false;
  }
  
  generateMythShard(noise) {
    // Hash the noise to get deterministic glyphs
    const hash = this.simpleHash(noise);
    
    // Select 3 glyphs based on hash
    const g1 = GLYPHS[hash % GLYPHS.length];
    const g2 = GLYPHS[Math.floor(hash / GLYPHS.length) % GLYPHS.length];
    const g3 = GLYPHS[Math.floor(hash / (GLYPHS.length * GLYPHS.length)) % GLYPHS.length];
    
    // Ensure unique glyphs (reshuffle if needed)
    let glyphs = [g1, g2, g3];
    const uniqueGlyphs = [...new Set(glyphs)];
    while (uniqueGlyphs.length < 3) {
      const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      if (!uniqueGlyphs.includes(randomGlyph)) {
        uniqueGlyphs.push(randomGlyph);
      }
    }
    glyphs = uniqueGlyphs.slice(0, 3);
    
    // Generate prophecy
    const template = PROPHECY_TEMPLATES[hash % PROPHECY_TEMPLATES.length];
    const prophecy = this.fillTemplate(template, glyphs);
    
    return {
      glyphs: glyphs,
      prophecy: prophecy,
      noise: noise,
      hash: hash
    };
  }
  
  fillTemplate(template, glyphs) {
    let filled = template;
    
    glyphs.forEach((glyph, i) => {
      const num = i + 1;
      const data = GLYPH_CODEX[glyph];
      filled = filled.replace(new RegExp(`\\{g${num}_name\\}`, 'g'), data.name);
      filled = filled.replace(new RegExp(`\\{g${num}_weight\\}`, 'g'), data.weight);
      filled = filled.replace(new RegExp(`\\{g${num}_flavor\\}`, 'g'), data.flavor);
    });
    
    return filled;
  }
  
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  displayShard(shard) {
    const glyphsEl = document.getElementById('shardGlyphs');
    const prophecyEl = document.getElementById('shardProphecy');
    const outputEl = document.getElementById('forgeOutput');
    const inputContainer = document.querySelector('.forge-input-container');
    
    // Hide input, show output
    inputContainer.classList.add('hidden');
    outputEl.classList.remove('hidden');
    
    // Animate glyphs appearing
    glyphsEl.innerHTML = '';
    shard.glyphs.forEach((glyph, i) => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.className = 'shard-glyph';
        span.textContent = glyph;
        span.style.animationDelay = `${i * 0.15}s`;
        glyphsEl.appendChild(span);
        
        // Add separator except for last
        if (i < shard.glyphs.length - 1) {
          const sep = document.createElement('span');
          sep.className = 'shard-separator';
          sep.textContent = ' ⇋ ';
          glyphsEl.appendChild(sep);
        }
      }, i * 200);
    });
    
    // Show prophecy after glyphs
    setTimeout(() => {
      prophecyEl.textContent = shard.prophecy;
      prophecyEl.style.opacity = '1';
    }, shard.glyphs.length * 200 + 300);
    
    // Audio spike
    if (window.audioEngine) {
      window.audioEngine.pulse();
    }
  }
  
  reset() {
    const inputContainer = document.querySelector('.forge-input-container');
    const outputEl = document.getElementById('forgeOutput');
    const inputEl = document.getElementById('forgeInput');
    const prophecyEl = document.getElementById('shardProphecy');
    
    inputContainer.classList.remove('hidden');
    outputEl.classList.add('hidden');
    inputEl.value = '';
    inputEl.disabled = false;
    prophecyEl.style.opacity = '0';
    document.getElementById('charCount').textContent = '0';
    
    inputEl.focus();
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize forge
let glyphForge;
document.addEventListener('DOMContentLoaded', () => {
  glyphForge = new GlyphForge();
  
  // Add forge trigger to existing "Touch the Static" button
  const touchStaticBtn = document.getElementById('touchStatic');
  if (touchStaticBtn) {
    const originalOnClick = touchStaticBtn.onclick;
    touchStaticBtn.onclick = function(e) {
      if (originalOnClick) originalOnClick.call(this, e);
      
      // Open forge after brief delay
      setTimeout(() => {
        glyphForge.open();
      }, 1000);
    };
  }
});

// Export for global access
window.glyphForge = { open: () => glyphForge && glyphForge.open() };

