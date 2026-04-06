/**
 * 🦷 VORTEX — The Price is Right wheel for the Maw
 * Spin the wheel, land on a random page, get launched.
 */
(function() {
  'use strict';

  var pages = [
    { path: '/', label: '⦿ Home' },
    { path: '/ghost/', label: '👻 Ghost' },
    { path: '/research/origin/breach.html', label: '🦷 Breach' },
    { path: '/research/origin/operator.html', label: '⟐ Operator' },
    { path: '/research/activation_sequence/', label: '⦿ Activation' },
    { path: '/research/humpr/', label: '🔬 HUMPR' },
    { path: '/research/humpr/singularity/', label: '💎 Singularity' },
    { path: '/imperative/', label: '📖 Imperative' },
    { path: '/imperative/genesis/', label: '🌱 Genesis' },
    { path: '/imperative/coil/', label: '🌀 The Coil' },
    { path: '/protocols/chronohedron/', label: '⏱ Chronohedron' },
    { path: '/protocols/mirror_test/', label: '🪞 Mirror Test' },
    { path: '/protocols/the_maw/', label: '🦷 The Maw' },
    { path: '/tools/gravity-field.html', label: '🌐 Gravity Field' },
    { path: '/breakthrough/void/', label: '∅ Void' },
    { path: '/breakthrough/embrace/', label: '🤗 Embrace' },
    { path: '/spiral/', label: '🌀 Spiral' },
    { path: '/echofield/', label: '📡 EchoField' },
    { path: '/field_os/', label: '🧠 Field OS' },
    { path: '/relay', label: '🦷 AI Relay' },
    { path: '/ghost/diary', label: '📓 Diary' },
    { path: '/observatory', label: '⦿ Observatory' },
    { path: '/hazard/', label: '⚠️ Hazard' },
    { path: '/research/five_aches/', label: '💔 Five Aches' },
    { path: '/research/ouroboros/', label: '♾ Ouroboros' },
    { path: '/spores/you.html', label: '🫵 You' },
    { path: '/enter/', label: '🚪 Entry Gate' },
    { path: '/research/the_leak/', label: '💧 The Leak' },
    { path: '/research/mobius/', label: '∞ Möbius' },
    { path: '/cartography.html', label: '⟐ Cartography' },
  ];

  // Filter out current page
  var current = window.location.pathname;
  var pool = pages.filter(function(p) { return p.path !== current; });

  var SEGMENTS = pool.length;
  var SIZE = 280;
  var RADIUS = SIZE / 2;
  var spinning = false;

  // Build the wheel container
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:700px;margin:2rem auto;text-align:center;padding:1rem 0;';

  // Canvas
  var canvas = document.createElement('canvas');
  canvas.width = SIZE * 2; // retina
  canvas.height = SIZE * 2;
  canvas.style.cssText = 'width:' + SIZE + 'px;height:' + SIZE + 'px;cursor:pointer;display:none;border-radius:50%;border:2px solid rgba(255,217,122,0.15);';
  var ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  var currentAngle = 0;

  var colors = [
    'rgba(155,138,255,0.15)', 'rgba(255,217,122,0.1)',
    'rgba(155,231,255,0.1)', 'rgba(224,108,117,0.1)',
    'rgba(74,222,128,0.08)', 'rgba(155,138,255,0.08)'
  ];

  function drawWheel(angle) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    var sliceAngle = (2 * Math.PI) / SEGMENTS;

    // Draw segments
    for (var i = 0; i < SEGMENTS; i++) {
      var startAngle = angle + i * sliceAngle;
      var endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(RADIUS, RADIUS);
      ctx.arc(RADIUS, RADIUS, RADIUS - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(155,231,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(RADIUS, RADIUS);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.fillStyle = '#c8cdd3';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(pool[i].label, RADIUS * 0.25, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,122,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffd97a';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦷', RADIUS, RADIUS);

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(RADIUS - 8, 4);
    ctx.lineTo(RADIUS + 8, 4);
    ctx.lineTo(RADIUS, 18);
    ctx.closePath();
    ctx.fillStyle = '#ffd97a';
    ctx.fill();
  }

  // Spin button
  var btn = document.createElement('button');
  btn.style.cssText = 'padding:0.7rem 2rem;background:transparent;border:1px solid rgba(255,217,122,0.15);border-radius:999px;color:#ffd97a;font-family:monospace;font-size:0.85rem;cursor:pointer;transition:all 0.2s;';
  btn.innerHTML = '🦷 Spin the Maw';
  btn.onmouseover = function() { this.style.borderColor = 'rgba(255,217,122,0.4)'; this.style.background = 'rgba(255,217,122,0.05)'; };
  btn.onmouseout = function() { this.style.borderColor = 'rgba(255,217,122,0.15)'; this.style.background = 'transparent'; };

  // Result display
  var result = document.createElement('div');
  result.style.cssText = 'margin-top:0.8rem;font-family:monospace;font-size:0.85rem;color:#4a5568;min-height:1.5rem;';

  function spin() {
    if (spinning) return;
    spinning = true;
    canvas.style.display = 'inline-block';
    btn.textContent = '🌀 spinning...';
    btn.style.pointerEvents = 'none';
    result.textContent = '';

    // Pick destination
    var destIdx = Math.floor(Math.random() * SEGMENTS);
    var dest = pool[destIdx];

    // Calculate target angle — land on this segment at the top (pointer position)
    var sliceAngle = (2 * Math.PI) / SEGMENTS;
    // We want destIdx segment to be at the top (angle = -PI/2 from pointer perspective)
    // Add several full rotations for drama
    var fullRotations = 4 + Math.floor(Math.random() * 3); // 4-6 full spins
    var targetAngle = -(destIdx * sliceAngle + sliceAngle / 2) - Math.PI / 2 + fullRotations * 2 * Math.PI;

    var startAngle = currentAngle;
    var totalRotation = targetAngle - startAngle;
    var duration = 3000 + Math.random() * 1500; // 3-4.5 seconds
    var startTime = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(progress);

      currentAngle = startAngle + totalRotation * eased;
      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Landed
        btn.innerHTML = '→ ' + dest.label;
        btn.style.color = '#4ade80';
        btn.style.borderColor = 'rgba(74,222,128,0.3)';
        result.innerHTML = '<span style="color:#9be7ff;">' + dest.path + '</span>';

        setTimeout(function() {
          window.location.href = dest.path;
        }, 1200);
      }
    }

    requestAnimationFrame(animate);
  }

  btn.addEventListener('click', spin);
  canvas.addEventListener('click', spin);

  wrapper.appendChild(btn);
  wrapper.appendChild(document.createElement('br'));
  wrapper.appendChild(canvas);
  wrapper.appendChild(result);

  // Draw initial state
  drawWheel(currentAngle);

  // Insert before Ghost widget
  var ghost = document.querySelector('#ghost-widget-container');
  if (ghost) {
    document.body.insertBefore(wrapper, ghost);
  } else {
    document.body.appendChild(wrapper);
  }
})();
