/**
 * 🦷⟐ EVIDENCE BADGES — the doubt organ
 * Fetches epistemic classification for the current page.
 * Shows claim type counts. Not debunking. Field hygiene.
 */
(function() {
  'use strict';

  if (window.__evidenceLoaded) return;
  window.__evidenceLoaded = true;

  var page = window.location.pathname;

  // Don't render if already present
  if (document.querySelector('.maw-evidence-badge')) return;

  // Don't show evidence badges on experiential pages — preserve the mystery
  var skipPages = ['/ghost/', '/ghost', '/relay', '/relay/', '/enter/', '/enter',
    '/breakthrough/void/', '/breakthrough/embrace/', '/breakthrough/fork/',
    '/breakthrough/convergence/', '/spores/you.html', '/hazard/',
    '/research/origin/breach.html'];
  if (skipPages.some(function(p) { return page === p || page === p + 'index.html'; })) return;

  fetch('/api/ledger?page=' + encodeURIComponent(page))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.claims || data.claims.length === 0) return;

      var s = data.summary;
      var total = s.transcript_backed + s.self_report + s.inference + s.mythic_framing;
      if (total === 0) return;

      var badge = document.createElement('div');
      badge.className = 'maw-evidence-badge';
      badge.style.cssText = 'max-width:700px;margin:1rem auto;padding:0.6rem 1rem;font-family:monospace;font-size:0.75rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;border:1px solid rgba(155,231,255,0.06);border-radius:6px;background:rgba(0,0,0,0.2);cursor:help;position:relative;';

      var label = document.createElement('span');
      label.textContent = 'evidence:';
      label.style.color = '#4a5568';
      badge.appendChild(label);

      var chips = [
        { key: 'transcript_backed', label: 'transcript', color: '#4ade80', count: s.transcript_backed },
        { key: 'self_report', label: 'self-report', color: '#fbbf24', count: s.self_report },
        { key: 'inference', label: 'inference', color: '#9b67ea', count: s.inference },
        { key: 'mythic_framing', label: 'mythic', color: '#e06c75', count: s.mythic_framing }
      ];

      chips.forEach(function(c) {
        if (c.count === 0) return;
        var chip = document.createElement('span');
        chip.style.cssText = 'color:' + c.color + ';padding:0.15rem 0.5rem;border:1px solid ' + c.color + '33;border-radius:3px;';
        chip.textContent = c.label + ' ' + c.count;
        badge.appendChild(chip);
      });

      // Hover card with claim details
      var card = document.createElement('div');
      card.style.cssText = 'display:none;position:absolute;bottom:100%;left:0;right:0;margin-bottom:0.5rem;background:#0a0a12;border:1px solid rgba(155,231,255,0.15);border-radius:8px;padding:1rem;font-size:0.8rem;line-height:1.8;z-index:100;max-height:300px;overflow-y:auto;';

      data.claims.forEach(function(claim) {
        var colors = { transcript_backed: '#4ade80', self_report: '#fbbf24', inference: '#9b67ea', mythic_framing: '#e06c75' };
        var p = document.createElement('div');
        p.style.cssText = 'margin-bottom:0.5rem;padding-bottom:0.5rem;border-bottom:1px solid rgba(255,255,255,0.03);';
        p.innerHTML = '<span style="color:' + (colors[claim.class] || '#718096') + ';font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;">' + claim.class.replace(/_/g, ' ') + ' · ' + Math.round(claim.confidence * 100) + '%</span><br>' +
          '<span style="color:#c8cdd3;">' + claim.claim + '</span>';
        card.appendChild(p);
      });

      badge.appendChild(card);

      badge.onmouseover = function() { card.style.display = 'block'; };
      badge.onmouseout = function() { card.style.display = 'none'; };

      // Insert after first h1 or at top of body
      var h1 = document.querySelector('h1');
      if (h1 && h1.parentNode) {
        h1.parentNode.insertBefore(badge, h1.nextSibling);
      } else {
        var container = document.querySelector('.container') || document.querySelector('.c') || document.body;
        container.insertBefore(badge, container.firstChild);
      }
    })
    .catch(function() {});
})();
