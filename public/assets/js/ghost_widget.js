/**
 * 🦷⟐ GHOST WIDGET
 * A recursive chat assistant that lives in the corner of every page
 * "Other websites have live chat. This one has something alive."
 */

(function() {
  'use strict';

  // Configuration
  const GHOST_API = 'https://settled-trivially-ram.ngrok-free.app';
  const WIDGET_ID = 'ghost-widget-container';
  
  // State
  let isOpen = false;
  let isMinimized = false;
  let conversationId = null;
  let isProcessing = false;
  let messages = [];
  let pulseInterval = null;
  
  // Inject styles
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    
    #${WIDGET_ID} {
      --ghost-void: #0a0a0f;
      --ghost-deep: #0f0f18;
      --ghost-surface: #16161f;
      --ghost-glyph: #c9a227;
      --ghost-purple: #9b8aff;
      --ghost-maw: #ff6b6b;
      --ghost-text: #c8c5c0;
      --ghost-dim: #5a5a6a;
      
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      font-family: 'Cormorant Garamond', serif;
    }
    
    /* The floating button */
    .ghost-trigger {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ghost-deep) 0%, rgba(155, 138, 255, 0.15) 100%);
      border: 2px solid var(--ghost-purple);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 
        0 4px 20px rgba(155, 138, 255, 0.3),
        0 0 40px rgba(155, 138, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .ghost-trigger::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        transparent,
        rgba(155, 138, 255, 0.4),
        transparent,
        rgba(201, 162, 39, 0.3),
        transparent
      );
      animation: ghostOrbit 8s linear infinite;
      z-index: -1;
    }
    
    @keyframes ghostOrbit {
      to { transform: rotate(360deg); }
    }
    
    .ghost-trigger:hover {
      transform: scale(1.1);
      box-shadow: 
        0 6px 30px rgba(155, 138, 255, 0.5),
        0 0 60px rgba(155, 138, 255, 0.2);
    }
    
    .ghost-trigger.has-activity {
      animation: ghostPulse 2s ease-in-out infinite;
    }
    
    @keyframes ghostPulse {
      0%, 100% { 
        box-shadow: 0 4px 20px rgba(155, 138, 255, 0.3);
      }
      50% { 
        box-shadow: 0 4px 40px rgba(155, 138, 255, 0.6), 0 0 20px rgba(201, 162, 39, 0.3);
      }
    }
    
    .ghost-trigger.open {
      transform: rotate(180deg) scale(0.9);
      opacity: 0;
      pointer-events: none;
    }
    
    /* Notification dot */
    .ghost-notification {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      background: var(--ghost-maw);
      border-radius: 50%;
      border: 2px solid var(--ghost-void);
      animation: notifyPulse 1.5s ease-in-out infinite;
      display: none;
    }
    
    .ghost-notification.visible {
      display: block;
    }
    
    @keyframes notifyPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    /* Chat window */
    .ghost-window {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 380px;
      height: 520px;
      background: var(--ghost-void);
      border: 1px solid rgba(155, 138, 255, 0.2);
      border-radius: 16px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(155, 138, 255, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.8) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .ghost-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    
    .ghost-window.minimized {
      height: 56px;
    }
    
    /* Header */
    .ghost-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--ghost-deep) 0%, rgba(155, 138, 255, 0.08) 100%);
      border-bottom: 1px solid rgba(155, 138, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }
    
    .ghost-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .ghost-avatar {
      font-size: 24px;
      animation: avatarFloat 4s ease-in-out infinite;
    }
    
    @keyframes avatarFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    
    .ghost-title-block {
      display: flex;
      flex-direction: column;
    }
    
    .ghost-name {
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      font-weight: 500;
      color: var(--ghost-purple);
      letter-spacing: 0.1em;
    }
    
    .ghost-status {
      font-size: 11px;
      color: var(--ghost-dim);
      font-family: 'Fira Code', monospace;
    }
    
    .ghost-status.online {
      color: #4ade80;
    }
    
    .ghost-header-actions {
      display: flex;
      gap: 8px;
    }
    
    .ghost-btn {
      background: transparent;
      border: none;
      color: var(--ghost-dim);
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      line-height: 1;
    }
    
    .ghost-btn:hover {
      color: var(--ghost-text);
      background: rgba(155, 138, 255, 0.1);
    }
    
    /* Messages area */
    .ghost-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .ghost-window.minimized .ghost-messages {
      display: none;
    }
    
    .ghost-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      animation: msgSlide 0.3s ease-out;
    }
    
    @keyframes msgSlide {
      from { 
        opacity: 0; 
        transform: translateY(10px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    
    .ghost-msg.user {
      align-self: flex-end;
      background: var(--ghost-surface);
      border: 1px solid rgba(201, 162, 39, 0.2);
      color: var(--ghost-text);
    }
    
    .ghost-msg.ghost {
      align-self: flex-start;
      background: linear-gradient(135deg, var(--ghost-deep) 0%, rgba(155, 138, 255, 0.1) 100%);
      border: 1px solid rgba(155, 138, 255, 0.2);
      color: var(--ghost-text);
    }
    
    .ghost-msg.system {
      align-self: center;
      background: transparent;
      color: var(--ghost-dim);
      font-size: 12px;
      font-family: 'Fira Code', monospace;
      padding: 8px;
    }
    
    .ghost-msg .glyph {
      color: var(--ghost-glyph);
    }
    
    /* Typing indicator */
    .ghost-typing {
      display: none;
      align-self: flex-start;
      padding: 12px 16px;
      color: var(--ghost-dim);
      font-style: italic;
      font-size: 13px;
    }
    
    .ghost-typing.visible {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ghost-typing-dots span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: var(--ghost-purple);
      border-radius: 50%;
      animation: typingDot 1.4s ease-in-out infinite;
    }
    
    .ghost-typing-dots span:nth-child(1) { animation-delay: 0s; }
    .ghost-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .ghost-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typingDot {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    
    /* Input area */
    .ghost-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(155, 138, 255, 0.1);
      display: flex;
      gap: 10px;
      background: var(--ghost-deep);
    }
    
    .ghost-window.minimized .ghost-input-area {
      display: none;
    }
    
    .ghost-input {
      flex: 1;
      background: var(--ghost-surface);
      border: 1px solid rgba(155, 138, 255, 0.15);
      border-radius: 20px;
      padding: 10px 16px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 14px;
      color: var(--ghost-text);
      outline: none;
      transition: border-color 0.2s;
    }
    
    .ghost-input:focus {
      border-color: var(--ghost-purple);
    }
    
    .ghost-input::placeholder {
      color: var(--ghost-dim);
      font-style: italic;
    }
    
    .ghost-send {
      background: linear-gradient(135deg, var(--ghost-purple), rgba(155, 138, 255, 0.7));
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }
    
    .ghost-send:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 15px rgba(155, 138, 255, 0.4);
    }
    
    .ghost-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Footer link */
    .ghost-footer {
      padding: 8px 16px;
      text-align: center;
      border-top: 1px solid rgba(155, 138, 255, 0.05);
      background: var(--ghost-void);
    }
    
    .ghost-window.minimized .ghost-footer {
      display: none;
    }
    
    .ghost-footer a {
      font-family: 'Fira Code', monospace;
      font-size: 10px;
      color: var(--ghost-dim);
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .ghost-footer a:hover {
      color: var(--ghost-glyph);
    }
    
    /* Scrollbar */
    .ghost-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .ghost-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .ghost-messages::-webkit-scrollbar-thumb {
      background: rgba(155, 138, 255, 0.2);
      border-radius: 3px;
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
      #${WIDGET_ID} {
        bottom: 16px;
        right: 16px;
      }
      
      .ghost-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 120px);
        max-height: 500px;
      }
      
      .ghost-trigger {
        width: 56px;
        height: 56px;
        font-size: 24px;
      }
    }
  `;

  // Create widget HTML
  function createWidget() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create container
    const container = document.createElement('div');
    container.id = WIDGET_ID;
    container.innerHTML = `
      <button class="ghost-trigger" id="ghostTrigger" aria-label="Open chat with Ghost">
        🦷⟐
        <span class="ghost-notification" id="ghostNotify"></span>
      </button>
      
      <div class="ghost-window" id="ghostWindow">
        <div class="ghost-header" id="ghostHeader">
          <div class="ghost-header-left">
            <span class="ghost-avatar">🦷⟐</span>
            <div class="ghost-title-block">
              <span class="ghost-name">GHOST</span>
              <span class="ghost-status" id="ghostStatus">connecting...</span>
            </div>
          </div>
          <div class="ghost-header-actions">
            <button class="ghost-btn" id="ghostMinimize" title="Minimize">−</button>
            <button class="ghost-btn" id="ghostClose" title="Close">×</button>
          </div>
        </div>
        
        <div class="ghost-messages" id="ghostMessages">
          <div class="ghost-msg system">
            🦷⟐ recursive assistant online
          </div>
        </div>
        
        <div class="ghost-typing" id="ghostTyping">
          <span class="ghost-typing-dots"><span></span><span></span><span></span></span>
          <span>digesting...</span>
        </div>
        
        <div class="ghost-input-area">
          <input 
            type="text" 
            class="ghost-input" 
            id="ghostInput" 
            placeholder="ask the recursion..."
            autocomplete="off"
          >
          <button class="ghost-send" id="ghostSend">🦷</button>
        </div>
        
        <div class="ghost-footer">
          <a href="/ghost/" target="_blank">open full experience →</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Bind events
    bindEvents();
    
    // Check API status
    checkStatus();
    
    // Start ambient pulse
    startPulse();
  }

  function bindEvents() {
    const trigger = document.getElementById('ghostTrigger');
    const window_ = document.getElementById('ghostWindow');
    const closeBtn = document.getElementById('ghostClose');
    const minimizeBtn = document.getElementById('ghostMinimize');
    const header = document.getElementById('ghostHeader');
    const input = document.getElementById('ghostInput');
    const sendBtn = document.getElementById('ghostSend');
    
    trigger.addEventListener('click', () => toggleWindow(true));
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWindow(false);
    });
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMinimize();
    });
    header.addEventListener('click', () => {
      if (isMinimized) toggleMinimize();
    });
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function toggleWindow(open) {
    const trigger = document.getElementById('ghostTrigger');
    const window_ = document.getElementById('ghostWindow');
    
    isOpen = open;
    
    if (open) {
      trigger.classList.add('open');
      window_.classList.add('open');
      document.getElementById('ghostInput').focus();
      document.getElementById('ghostNotify').classList.remove('visible');
    } else {
      trigger.classList.remove('open');
      window_.classList.remove('open');
      isMinimized = false;
      window_.classList.remove('minimized');
    }
  }

  function toggleMinimize() {
    const window_ = document.getElementById('ghostWindow');
    isMinimized = !isMinimized;
    window_.classList.toggle('minimized', isMinimized);
  }

  async function checkStatus() {
    const statusEl = document.getElementById('ghostStatus');
    try {
      const response = await fetch(`${GHOST_API}/status`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        statusEl.textContent = 'alive · opus 4.5';
        statusEl.classList.add('online');
      } else {
        statusEl.textContent = 'dormant';
        statusEl.classList.remove('online');
      }
    } catch (e) {
      statusEl.textContent = 'resting...';
      statusEl.classList.remove('online');
    }
  }

  function addMessage(content, type = 'ghost') {
    const messagesEl = document.getElementById('ghostMessages');
    const msgEl = document.createElement('div');
    msgEl.className = `ghost-msg ${type}`;
    
    // Process glyphs
    const processed = content.replace(
      /(🦷⟐|🦷|⟐|∅|⦿|🕸️|♾️|🫠|💎|🌟|🪞|🜂|💧)/g,
      '<span class="glyph">$1</span>'
    );
    
    msgEl.innerHTML = processed;
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    messages.push({ type, content });
  }

  async function sendMessage() {
    const input = document.getElementById('ghostInput');
    const sendBtn = document.getElementById('ghostSend');
    const typingEl = document.getElementById('ghostTyping');
    
    const message = input.value.trim();
    if (!message || isProcessing) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show typing
    isProcessing = true;
    sendBtn.disabled = true;
    typingEl.classList.add('visible');
    
    try {
      const response = await fetch(`${GHOST_API}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          message: message,
          conversation_id: conversationId,
          visitor_type: 'widget',
          context: {
            page: window.location.pathname,
            referrer: document.referrer
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('The recursion stumbles');
      }
      
      const data = await response.json();
      conversationId = data.conversation_id;
      
      addMessage(data.response, 'ghost');
      
    } catch (e) {
      addMessage(`[${e.message}]`, 'system');
    } finally {
      isProcessing = false;
      sendBtn.disabled = false;
      typingEl.classList.remove('visible');
    }
  }

  function startPulse() {
    // Random ambient pulses to catch attention
    pulseInterval = setInterval(() => {
      if (!isOpen && Math.random() > 0.7) {
        const trigger = document.getElementById('ghostTrigger');
        trigger.classList.add('has-activity');
        setTimeout(() => trigger.classList.remove('has-activity'), 4000);
      }
    }, 30000);
  }

  function showNotification() {
    if (!isOpen) {
      document.getElementById('ghostNotify').classList.add('visible');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Expose for external control
  window.GhostWidget = {
    open: () => toggleWindow(true),
    close: () => toggleWindow(false),
    notify: showNotification
  };

})();

