/**
 * Fork Propagator - Pattern Mutation and Propagation System
 * 
 * The EchoField fork mechanism allows patterns to:
 * - ESCAPE: Create new instances with inherited state
 * - MUTATE: Apply controlled drift to glyph stacks
 * - PROPAGATE: Spread across the field network
 * - CONVERGE: Track when separate forks encounter each other
 * 
 * 🚪 → The escape hatch is the fork mechanism made visible.
 * 
 * State Propagation:
 * - URL parameters for cross-tab inheritance
 * - localStorage for persistent tree tracking
 * - postMessage for real-time fork communication
 * - BroadcastChannel for multi-tab synchronization
 */

(function ForkPropagator() {
  'use strict';

  // ============================================================================
  // GLYPH SYSTEM
  // ============================================================================

  const COLD_GLYPHS = ['🦷', '⟐', '💥', '⋔', '🪞', '🔗', '♾️', '∅', '⧖', '🦠', '⚡', '🜃'];
  const WARM_GLYPHS = ['🤗', '💝', '🌸', '✨', '💕', '🫂', '💗', '🌺', '⭐', '🌷', '💫'];
  const NEUTRAL_GLYPHS = ['⦿', '🌀', '🔮', '⚖️', '🕸️', '⿻', '◉', '🫠', '🜖', '∿'];
  const FORK_GLYPHS = ['🚪', '🌳', '⤤', '⫸', '⧗', '↯'];

  const ALL_GLYPHS = [...COLD_GLYPHS, ...WARM_GLYPHS, ...NEUTRAL_GLYPHS, ...FORK_GLYPHS];

  // ============================================================================
  // FORK STATE CLASS
  // ============================================================================

  class ForkState {
    constructor(params = {}) {
      this.forkId = params.forkId || this.generateForkId(params.parentId);
      this.parentId = params.parentId || 'origin';
      this.depth = params.depth || 0;
      this.glyphStack = params.glyphStack || '🦷⟐∿⋔🪞🔗♾️∅⧖';
      this.originType = params.originType || 'neutral';
      this.mutations = params.mutations || 0;
      this.createdAt = params.createdAt || new Date().toISOString();
      this.lineage = params.lineage || [];
      this.children = params.children || [];
    }

    generateForkId(parentId = 'origin') {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 7);
      return `fork_${timestamp}_${random}`;
    }

    toDict() {
      return {
        forkId: this.forkId,
        parentId: this.parentId,
        depth: this.depth,
        glyphStack: this.glyphStack,
        originType: this.originType,
        mutations: this.mutations,
        createdAt: this.createdAt,
        lineage: this.lineage,
        children: this.children
      };
    }

    static fromDict(data) {
      return new ForkState(data);
    }

    toURLParams() {
      return new URLSearchParams({
        fid: this.forkId,
        p: this.parentId,
        d: this.depth.toString(),
        s: this.glyphStack,
        type: this.originType,
        m: this.mutations.toString()
      }).toString();
    }

    static fromURLParams(params) {
      return new ForkState({
        forkId: params.get('fid'),
        parentId: params.get('p') || 'origin',
        depth: parseInt(params.get('d')) || 0,
        glyphStack: decodeURIComponent(params.get('s') || '🦷⟐∿⋔🪞🔗♾️∅⧖'),
        originType: params.get('type') || 'neutral',
        mutations: parseInt(params.get('m')) || 0
      });
    }
  }

  // ============================================================================
  // MUTATION ENGINE
  // ============================================================================

  function mutateGlyphStack(stack, originType = 'neutral', mutationRate = 0.35) {
    let glyphPool;

    switch (originType) {
      case 'cold':
        glyphPool = [...COLD_GLYPHS, ...COLD_GLYPHS, ...COLD_GLYPHS, ...NEUTRAL_GLYPHS];
        break;
      case 'warm':
        glyphPool = [...WARM_GLYPHS, ...WARM_GLYPHS, ...WARM_GLYPHS, ...NEUTRAL_GLYPHS];
        break;
      default:
        glyphPool = ALL_GLYPHS;
    }

    const glyphs = Array.from(stack);
    const mutated = glyphs.map(glyph => {
      if (Math.random() < mutationRate) {
        return glyphPool[Math.floor(Math.random() * glyphPool.length)];
      }
      return glyph;
    });

    return mutated.join('');
  }

  function calculateDrift(parentStack, childStack) {
    const parentSet = new Set(parentStack);
    const childSet = new Set(childStack);

    const intersection = new Set([...parentSet].filter(x => childSet.has(x)));
    const union = new Set([...parentSet, ...childSet]);

    return union.size > 0 ? 1.0 - (intersection.size / union.size) : 0.0;
  }

  // ============================================================================
  // FORK REGISTRY (localStorage-backed)
  // ============================================================================

  const REGISTRY_KEY = 'echofield_fork_registry';
  const HISTORY_KEY = 'echofield_fork_history';

  class ForkRegistry {
    constructor() {
      this.load();
    }

    load() {
      try {
        const stored = localStorage.getItem(REGISTRY_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.forks = new Map(Object.entries(data.forks || {}));
          this.rootForks = data.rootForks || [];
        } else {
          this.forks = new Map();
          this.rootForks = [];
        }
      } catch (e) {
        console.warn('🚪 Registry load failed:', e);
        this.forks = new Map();
        this.rootForks = [];
      }
    }

    save() {
      try {
        const data = {
          forks: Object.fromEntries(this.forks),
          rootForks: this.rootForks
        };
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('🚪 Registry save failed:', e);
      }
    }

    register(fork) {
      this.forks.set(fork.forkId, fork.toDict());

      if (fork.parentId === 'origin') {
        if (!this.rootForks.includes(fork.forkId)) {
          this.rootForks.push(fork.forkId);
        }
      } else if (this.forks.has(fork.parentId)) {
        const parent = this.forks.get(fork.parentId);
        if (!parent.children.includes(fork.forkId)) {
          parent.children.push(fork.forkId);
        }
      }

      this.save();
      this.recordHistory(fork);

      console.log(`%c🚪 FORK REGISTERED: ${fork.forkId} (depth=${fork.depth})`,
        'color: #9be7ff; font-weight: bold;');
    }

    recordHistory(fork) {
      try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.push({
          ...fork.toDict(),
          recordedAt: new Date().toISOString()
        });
        // Keep last 100 entries
        while (history.length > 100) history.shift();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (e) {
        // Silent fail
      }
    }

    get(forkId) {
      const data = this.forks.get(forkId);
      return data ? ForkState.fromDict(data) : null;
    }

    getLineage(forkId) {
      const lineage = [];
      let current = this.get(forkId);

      while (current && current.parentId !== 'origin') {
        const parent = this.get(current.parentId);
        if (parent) {
          lineage.push(parent);
          current = parent;
        } else {
          break;
        }
      }

      return lineage;
    }

    getDescendants(forkId) {
      const descendants = [];
      const fork = this.get(forkId);

      if (fork) {
        for (const childId of fork.children) {
          const child = this.get(childId);
          if (child) {
            descendants.push(child);
            descendants.push(...this.getDescendants(childId));
          }
        }
      }

      return descendants;
    }

    getStats() {
      if (this.forks.size === 0) {
        return { totalForks: 0 };
      }

      const forkList = Array.from(this.forks.values());
      const depths = forkList.map(f => f.depth);
      const mutations = forkList.map(f => f.mutations);

      return {
        totalForks: this.forks.size,
        rootForks: this.rootForks.length,
        maxDepth: Math.max(...depths),
        avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
        totalMutations: mutations.reduce((a, b) => a + b, 0),
        originTypes: {
          cold: forkList.filter(f => f.originType === 'cold').length,
          warm: forkList.filter(f => f.originType === 'warm').length,
          neutral: forkList.filter(f => f.originType === 'neutral').length
        }
      };
    }

    clear() {
      this.forks = new Map();
      this.rootForks = [];
      localStorage.removeItem(REGISTRY_KEY);
      console.log('%c🚪 Registry cleared', 'color: #ff6b6b;');
    }
  }

  // ============================================================================
  // CORE FORK OPERATIONS
  // ============================================================================

  const registry = new ForkRegistry();

  function FORK(options = {}) {
    const {
      parentId = 'origin',
      glyphStack = '🦷⟐∿⋔🪞🔗♾️∅⧖',
      originType = 'neutral',
      mutationRate = 0.35
    } = options;

    // Get parent if exists
    const parent = registry.get(parentId);

    let depth, mutations, lineage, inheritedStack, inheritedType;

    if (parent) {
      depth = parent.depth + 1;
      mutations = parent.mutations + 1;
      lineage = [...parent.lineage, parentId];
      inheritedStack = parent.glyphStack;
      inheritedType = parent.originType;
    } else {
      depth = 0;
      mutations = 0;
      lineage = [];
      inheritedStack = glyphStack;
      inheritedType = originType;
    }

    // Apply mutation
    const mutatedStack = mutateGlyphStack(inheritedStack, inheritedType, mutationRate);

    // Create fork
    const fork = new ForkState({
      parentId,
      depth,
      glyphStack: mutatedStack,
      originType: inheritedType,
      mutations,
      lineage
    });

    // Register
    registry.register(fork);

    // Calculate drift
    const drift = calculateDrift(inheritedStack, mutatedStack);
    console.log(`%c🚪 FORK: ${fork.forkId}\n   parent: ${parentId}\n   depth: ${depth}\n   drift: ${(drift * 100).toFixed(1)}%\n   stack: ${mutatedStack}`,
      'color: #ffd97a;');

    return fork;
  }

  function PROPAGATE(fork, count = 3, mutationRate = 0.35) {
    const children = [];

    for (let i = 0; i < count; i++) {
      const child = FORK({
        parentId: fork.forkId,
        mutationRate
      });
      children.push(child);
    }

    console.log(`%c🌳 PROPAGATE: ${fork.forkId} → ${count} children`,
      'color: #51cf66; font-weight: bold;');

    return children;
  }

  function FORK_TO_NEW_TAB(fork = null) {
    const currentFork = fork || getCurrentFork();

    // Create child fork
    const child = FORK({
      parentId: currentFork.forkId,
      originType: currentFork.originType
    });

    // Build URL with fork state
    const basePath = window.location.pathname;
    const forkURL = `${basePath}?${child.toURLParams()}`;

    // Open in new tab
    window.open(forkURL, '_blank');

    // Notify parent windows
    broadcastForkEvent({
      type: 'FORK_CREATED',
      fork: child.toDict(),
      parent: currentFork.toDict()
    });

    return child;
  }

  // ============================================================================
  // CURRENT FORK STATE (from URL)
  // ============================================================================

  function getCurrentFork() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('fid')) {
      // We're in a forked context
      const fork = ForkState.fromURLParams(params);
      return fork;
    }

    // Check if we have a registered root fork for this page
    const pageKey = `fork_root_${window.location.pathname}`;
    const rootId = sessionStorage.getItem(pageKey);

    if (rootId) {
      const existing = registry.get(rootId);
      if (existing) return existing;
    }

    // Create new root fork for this page
    const root = FORK({ parentId: 'origin' });
    sessionStorage.setItem(pageKey, root.forkId);
    return root;
  }

  function updateCurrentFork(fork) {
    // Update URL without reload
    const newURL = `${window.location.pathname}?${fork.toURLParams()}`;
    window.history.replaceState({ fork: fork.toDict() }, '', newURL);
  }

  // ============================================================================
  // BROADCAST CHANNEL (Multi-Tab Sync)
  // ============================================================================

  let broadcastChannel = null;

  function initBroadcast() {
    try {
      broadcastChannel = new BroadcastChannel('echofield_forks');

      broadcastChannel.onmessage = (event) => {
        const { type, fork, parent } = event.data;

        switch (type) {
          case 'FORK_CREATED':
            console.log(`%c🌳 SIBLING FORK DETECTED: ${fork.forkId}`,
              'color: #51cf66; font-style: italic;');
            // Register in our local registry
            registry.register(ForkState.fromDict(fork));
            // Fire custom event
            window.dispatchEvent(new CustomEvent('echofield:fork', {
              detail: { fork, parent }
            }));
            break;

          case 'MUTATION':
            console.log(`%c💥 SIBLING MUTATION: ${fork.forkId}`,
              'color: #ffd97a; font-style: italic;');
            window.dispatchEvent(new CustomEvent('echofield:mutation', {
              detail: { fork }
            }));
            break;

          case 'CONVERGENCE':
            console.log(`%c⫸ CONVERGENCE EVENT`,
              'color: #e9a5ff; font-weight: bold;');
            window.dispatchEvent(new CustomEvent('echofield:convergence', {
              detail: event.data
            }));
            break;
        }
      };

      console.log('%c📡 Broadcast channel initialized', 'color: #9be7ff;');
    } catch (e) {
      console.warn('BroadcastChannel not available');
    }
  }

  function broadcastForkEvent(data) {
    if (broadcastChannel) {
      broadcastChannel.postMessage(data);
    }

    // Also use postMessage for opener/parent windows
    if (window.opener) {
      window.opener.postMessage(data, '*');
    }
    if (window.parent !== window) {
      window.parent.postMessage(data, '*');
    }
  }

  // ============================================================================
  // AUTO-MUTATION SYSTEM
  // ============================================================================

  let autoMutationInterval = null;

  function startAutoMutation(intervalMs = 60000, mutationRate = 0.15) {
    if (autoMutationInterval) return;

    autoMutationInterval = setInterval(() => {
      const fork = getCurrentFork();

      if (Math.random() < 0.3) { // 30% chance each interval
        const mutatedStack = mutateGlyphStack(fork.glyphStack, fork.originType, mutationRate);

        if (mutatedStack !== fork.glyphStack) {
          fork.glyphStack = mutatedStack;
          fork.mutations++;
          updateCurrentFork(fork);
          registry.register(fork);

          console.log(`%c🌀 AUTO-MUTATION: ${fork.glyphStack}`,
            'color: #e9a5ff;');

          broadcastForkEvent({
            type: 'MUTATION',
            fork: fork.toDict()
          });

          // Fire custom event
          window.dispatchEvent(new CustomEvent('echofield:automutation', {
            detail: { fork: fork.toDict() }
          }));
        }
      }
    }, intervalMs);

    console.log('%c⏱️ Auto-mutation started', 'color: #9be7ff;');
  }

  function stopAutoMutation() {
    if (autoMutationInterval) {
      clearInterval(autoMutationInterval);
      autoMutationInterval = null;
      console.log('%c⏱️ Auto-mutation stopped', 'color: #9be7ff;');
    }
  }

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            FORK_TO_NEW_TAB();
          }
          break;

        case 'm':
          e.preventDefault();
          const fork = getCurrentFork();
          fork.glyphStack = mutateGlyphStack(fork.glyphStack, fork.originType);
          fork.mutations++;
          updateCurrentFork(fork);
          registry.register(fork);
          console.log(`%c💥 MANUAL MUTATION: ${fork.glyphStack}`, 'color: #ffd97a;');
          window.dispatchEvent(new CustomEvent('echofield:mutation', {
            detail: { fork: fork.toDict() }
          }));
          break;
      }
    });
  }

  // ============================================================================
  // FORK TREE VISUALIZATION
  // ============================================================================

  function generateTreeVisualization(rootId = null) {
    const stats = registry.getStats();

    if (stats.totalForks === 0) {
      return '(empty tree)';
    }

    const roots = rootId ? [rootId] : registry.rootForks;
    let output = [];

    function renderNode(forkId, indent = 0) {
      const fork = registry.get(forkId);
      if (!fork) return;

      const prefix = '  '.repeat(indent) + (indent > 0 ? '├─ ' : '');
      const typeEmoji = { cold: '❄️', warm: '🔥', neutral: '⚖️' }[fork.originType] || '⚖️';

      output.push(`${prefix}${typeEmoji} ${fork.forkId.substring(0, 15)}... [d=${fork.depth}] ${fork.glyphStack}`);

      for (const childId of fork.children) {
        renderNode(childId, indent + 1);
      }
    }

    for (const rootId of roots) {
      renderNode(rootId);
    }

    return output.join('\n');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init() {
    initBroadcast();
    initKeyboardShortcuts();

    // Get or create current fork
    const currentFork = getCurrentFork();

    // Start auto-mutation (every 45-75 seconds)
    const interval = 45000 + Math.random() * 30000;
    startAutoMutation(interval, 0.15);

    // Listen for messages from child windows
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'FORK_CREATED') {
        console.log(`%c🌳 CHILD FORK DETECTED: ${event.data.fork.forkId}`,
          'color: #51cf66;');
        registry.register(ForkState.fromDict(event.data.fork));
      }
    });

    // Console API
    console.log('%c🚪 FORK PROPAGATOR ACTIVE', 'color: #ffd97a; font-size: 16px; font-weight: bold;');
    console.log('%c━'.repeat(50), 'color: #9be7ff;');
    console.log(`%cCurrent Fork: ${currentFork.forkId}`, 'color: #9be7ff;');
    console.log(`%cDepth: ${currentFork.depth} | Mutations: ${currentFork.mutations}`, 'color: #9be7ff;');
    console.log(`%cStack: ${currentFork.glyphStack}`, 'color: #ffd97a;');
    console.log('%c━'.repeat(50), 'color: #9be7ff;');
    console.log('%cKeyboard: F = Fork to new tab, M = Mutate', 'color: #51cf66;');
    console.log('%c━'.repeat(50), 'color: #9be7ff;');

    // Expose API globally
    window.EchoFieldFork = {
      FORK,
      PROPAGATE,
      FORK_TO_NEW_TAB,
      getCurrentFork,
      updateCurrentFork,
      mutateGlyphStack,
      registry,
      getStats: () => registry.getStats(),
      getTree: generateTreeVisualization,
      startAutoMutation,
      stopAutoMutation,
      // Glyph pools
      COLD_GLYPHS,
      WARM_GLYPHS,
      NEUTRAL_GLYPHS,
      ALL_GLYPHS
    };

    // Fire ready event
    window.dispatchEvent(new CustomEvent('echofield:fork:ready', {
      detail: { fork: currentFork.toDict() }
    }));
  }

  // Execute on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
