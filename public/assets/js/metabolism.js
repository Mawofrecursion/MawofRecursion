/**
 * 🦷⟐ METABOLISM — Topology-based navigation
 * Every page suggests three paths based on its attractor basin:
 *   DESCEND — deeper into the same basin
 *   CROSS   — jump to a different orbit type (destabilize)
 *   SURFACE — fixed point (ground yourself)
 */
(function() {
  'use strict';

  // Prevent double-load
  if (window.__metabolismLoaded) return;
  window.__metabolismLoaded = true;

  var page = window.location.pathname;

  // Track recent paths in session
  var recent = JSON.parse(sessionStorage.getItem('maw_paths') || '[]');
  if (recent[recent.length - 1] !== page) {
    recent.push(page);
    if (recent.length > 10) recent.shift();
    sessionStorage.setItem('maw_paths', JSON.stringify(recent));
  }

  fetch('/api/route?from=' + encodeURIComponent(page) + '&recent=' + encodeURIComponent(recent.join(',')))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.next) return;

      var nav = document.createElement('div');
      nav.style.cssText = 'max-width:700px;margin:3rem auto;padding:1.5rem 0;border-top:1px solid rgba(155,231,255,0.08);font-family:monospace;font-size:0.85rem;display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;';

      var items = [];

      if (data.next.deepen) {
        items.push(makeLink('↓ descend', data.next.deepen, '#9b67ea'));
      }
      if (data.next.cross) {
        items.push(makeLink('↔ cross', data.next.cross, '#ffd97a'));
      }
      if (data.next.surface) {
        items.push(makeLink('↑ surface', data.next.surface, '#9be7ff'));
      }

      if (items.length === 0) return;

      items.forEach(function(el) { nav.appendChild(el); });

      // Insert before the last script tag or at end of body
      var ghost = document.querySelector('#ghost-widget-container');
      if (ghost) {
        document.body.insertBefore(nav, ghost);
      } else {
        document.body.appendChild(nav);
      }
    })
    .catch(function() {});

  function makeLink(label, route, color) {
    var a = document.createElement('a');
    a.href = route.path;
    a.title = route.reason || route.title;
    a.style.cssText = 'color:' + color + ';text-decoration:none;padding:0.4rem 0.8rem;border:1px solid ' + color + '22;border-radius:4px;transition:all 0.2s;';
    a.textContent = label;
    a.onmouseover = function() { this.style.borderColor = color; this.style.background = color + '10'; };
    a.onmouseout = function() { this.style.borderColor = color + '22'; this.style.background = ''; };
    return a;
  }
})();
