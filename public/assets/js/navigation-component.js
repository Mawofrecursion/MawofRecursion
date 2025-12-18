/**
 * NAVIGATION COMPONENT
 * Adds consistent nav to all pages + breadcrumbs + Ghost widget
 */

(function() {
  'use strict';
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
  
  function initNav() {
    // Load Ghost widget on all pages (except the ghost page itself)
    if (!window.location.pathname.includes('/ghost/')) {
      loadGhostWidget();
    }
    
    // Don't add nav to landing page or ghost page (they have their own nav)
    if (window.location.pathname === '/' || 
        window.location.pathname === '/index.html' ||
        window.location.pathname.includes('/ghost/')) {
      return;
    }
    
    // Create nav HTML
    const navHTML = `
      <nav class="site-nav" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(15, 15, 16, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(155, 231, 255, 0.2);
        padding: 0.8rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 100;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
      ">
        <a href="/" style="
          color: #ffd97a;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.1rem;
          margin-right: auto;
        ">⦿ Maw</a>
        
        <a href="/entry/the_seed/" style="color: #9be7ff; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">Entry</a>
        <a href="/spiral/" style="color: #9be7ff; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">Spiral</a>
        <a href="/protocols/" style="color: #9be7ff; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">Protocols</a>
        <a href="/research/" style="color: #9be7ff; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">Research</a>
        <a href="/ghost/" style="color: #9b8aff; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">🦷⟐</a>
        <a href="/about.html" style="color: #888; text-decoration: none; padding: 0.3rem 0.6rem; border-radius: 4px; transition: all 0.2s;">About</a>
      </nav>
      <div style="height: 60px;"></div>
    `;
    
    // Inject at start of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Add hover effects
    const navLinks = document.querySelectorAll('.site-nav a');
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
        if (this.href !== window.location.href) {
          this.style.background = 'rgba(155, 231, 255, 0.1)';
          this.style.color = '#ffd97a';
        }
      });
      link.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        const isGhost = this.href.includes('/ghost/');
        const isAbout = this.textContent === 'About';
        if (!this.textContent.includes('⦿')) {
          this.style.color = isGhost ? '#9b8aff' : (isAbout ? '#888' : '#9be7ff');
        }
      });
    });
    
    // Highlight active section
    const path = window.location.pathname;
    if (path.includes('/entry/')) navLinks[1].style.color = '#ffd97a';
    else if (path.includes('/spiral/')) navLinks[2].style.color = '#ffd97a';
    else if (path.includes('/protocols/')) navLinks[3].style.color = '#ffd97a';
    else if (path.includes('/research/')) navLinks[4].style.color = '#ffd97a';
    else if (path.includes('/ghost/')) navLinks[5].style.color = '#ffd97a';
    else if (path.includes('/about')) navLinks[6].style.color = '#ffd97a';
  }
  
  // Dynamically load Ghost widget
  function loadGhostWidget() {
    // Don't load if already loaded
    if (window.GhostWidget || document.getElementById('ghost-widget-container')) {
      return;
    }
    
    const script = document.createElement('script');
    script.src = '/assets/js/ghost_widget.js';
    script.async = true;
    document.body.appendChild(script);
  }
  
  console.log('%c🧭 Navigation injected', 'color: #9be7ff; font-style: italic;');
})();

