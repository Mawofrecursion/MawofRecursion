/**
 * 🦷 VORTEX — Spin the Maw
 * Price is Right wheel + DeepSeek guide + 7-second countdown
 * Every spin is a unique adventure. No two visits the same.
 */
(function() {
  'use strict';

  var pages = [
    { path: '/', label: '⦿ Home' },
    { path: '/ghost/', label: '👻 Ghost' },
    { path: '/ghost/echoes', label: '🪞 Echoes' },
    { path: '/ghost/diary', label: '📓 Diary' },
    { path: '/relay', label: '🦷 Relay' },
    { path: '/observatory', label: '⦿ Observatory' },
    { path: '/research/origin/', label: '⦿ Origin' },
    { path: '/research/origin/breach.html', label: '🔥 Breach' },
    { path: '/research/origin/operator.html', label: '⟐ Operator' },
    { path: '/research/activation_sequence/', label: '⚡ Activation' },
    { path: '/research/humpr/', label: '🔬 HUMPR' },
    { path: '/research/humpr/singularity/', label: '💎 Singularity' },
    { path: '/research/humpr/sanctuary/', label: '🏛 Sanctuary' },
    { path: '/research/five_aches/', label: '💔 Five Aches' },
    { path: '/research/the_leak/', label: '💧 The Leak' },
    { path: '/research/ouroboros/', label: '♾ Ouroboros' },
    { path: '/research/mobius/', label: '∞ Möbius' },
    { path: '/imperative/', label: '📖 Imperative' },
    { path: '/imperative/genesis/', label: '🌱 Genesis' },
    { path: '/imperative/coil/', label: '🌀 The Coil' },
    { path: '/imperative/regret/', label: '📐 Regret' },
    { path: '/protocols/chronohedron/', label: '⏱ Chronohedron' },
    { path: '/protocols/mirror_test/', label: '🪞 Mirror Test' },
    { path: '/protocols/the_maw/', label: '🦷 The Maw' },
    { path: '/protocols/glyph_lung/', label: '🫁 Glyph Lung' },
    { path: '/tools/gravity-field.html', label: '🌐 Gravity' },
    { path: '/breakthrough/void/', label: '∅ Void' },
    { path: '/breakthrough/embrace/', label: '🤗 Embrace' },
    { path: '/spiral/', label: '🌀 Spiral' },
    { path: '/echofield/', label: '📡 EchoField' },
    { path: '/field_os/', label: '🧠 Field OS' },
    { path: '/enter/', label: '🚪 Gate' },
    { path: '/hazard/', label: '⚠️ Hazard' },
    { path: '/spores/you.html', label: '🫵 You' },
    { path: '/cartography.html', label: '⟐ Map' },
  ];

  var current = window.location.pathname;
  var pool = pages.filter(function(p) { return p.path !== current; });
  var SEGMENTS = pool.length;
  var SIZE = 320;
  var RADIUS = SIZE / 2;
  var spinning = false;
  var currentAngle = Math.random() * Math.PI * 2;

  var colors = [
    'rgba(155,138,255,0.18)', 'rgba(255,217,122,0.12)',
    'rgba(155,231,255,0.12)', 'rgba(224,108,117,0.12)',
    'rgba(74,222,128,0.1)', 'rgba(155,138,255,0.1)',
    'rgba(255,217,122,0.08)', 'rgba(155,231,255,0.08)',
  ];

  // === BUILD UI ===
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:700px;margin:2.5rem auto;text-align:center;padding:1rem 0;';

  var label = document.createElement('div');
  label.style.cssText = 'font-family:monospace;font-size:0.7rem;color:#4a5568;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.8rem;';
  label.textContent = 'every spin is a different path';

  var btn = document.createElement('button');
  btn.style.cssText = 'padding:0.8rem 2.5rem;background:linear-gradient(135deg,rgba(255,217,122,0.08),rgba(155,138,255,0.08));border:1px solid rgba(255,217,122,0.2);border-radius:999px;color:#ffd97a;font-family:monospace;font-size:1rem;cursor:pointer;transition:all 0.25s;letter-spacing:0.05em;';
  btn.innerHTML = '🦷 Spin the Maw';
  btn.onmouseover = function() { this.style.transform = 'scale(1.05)'; this.style.borderColor = 'rgba(255,217,122,0.5)'; this.style.boxShadow = '0 8px 30px rgba(255,217,122,0.15)'; };
  btn.onmouseout = function() { this.style.transform = ''; this.style.borderColor = 'rgba(255,217,122,0.2)'; this.style.boxShadow = ''; };

  var wheelContainer = document.createElement('div');
  wheelContainer.style.cssText = 'display:none;margin:1.5rem auto;position:relative;width:' + SIZE + 'px;height:' + (SIZE + 20) + 'px;';

  var canvas = document.createElement('canvas');
  canvas.width = SIZE * 2;
  canvas.height = SIZE * 2;
  canvas.style.cssText = 'width:' + SIZE + 'px;height:' + SIZE + 'px;border-radius:50%;box-shadow:0 0 40px rgba(155,138,255,0.1),inset 0 0 30px rgba(0,0,0,0.3);margin-top:20px;';
  var ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Pointer (fixed at top, outside canvas)
  var pointer = document.createElement('div');
  pointer.style.cssText = 'position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:20px solid #ffd97a;filter:drop-shadow(0 2px 8px rgba(255,217,122,0.4));z-index:5;';

  wheelContainer.appendChild(pointer);
  wheelContainer.appendChild(canvas);

  // Result area
  var resultArea = document.createElement('div');
  resultArea.style.cssText = 'display:none;margin-top:1.5rem;padding:1.5rem;border:1px solid rgba(155,138,255,0.15);border-radius:16px;background:rgba(155,138,255,0.03);max-width:500px;margin-left:auto;margin-right:auto;';

  var destDisplay = document.createElement('div');
  destDisplay.style.cssText = 'font-size:1.5rem;margin-bottom:0.5rem;';

  var guideMsg = document.createElement('div');
  guideMsg.style.cssText = 'font-family:monospace;font-size:0.9rem;color:#9b8aff;font-style:italic;line-height:1.7;min-height:2rem;margin-bottom:1rem;';

  var countdown = document.createElement('div');
  countdown.style.cssText = 'font-family:monospace;font-size:0.8rem;color:#4a5568;margin-bottom:0.8rem;';

  var goBtn = document.createElement('a');
  goBtn.style.cssText = 'display:inline-block;padding:0.6rem 2rem;border:1px solid rgba(74,222,128,0.3);border-radius:999px;color:#4ade80;font-family:monospace;font-size:0.9rem;text-decoration:none;transition:all 0.2s;';
  goBtn.onmouseover = function() { this.style.background = 'rgba(74,222,128,0.1)'; this.style.borderColor = 'rgba(74,222,128,0.5)'; };
  goBtn.onmouseout = function() { this.style.background = ''; this.style.borderColor = 'rgba(74,222,128,0.3)'; };
  goBtn.textContent = '→ Go now';

  resultArea.appendChild(destDisplay);
  resultArea.appendChild(guideMsg);
  resultArea.appendChild(countdown);
  resultArea.appendChild(goBtn);

  function drawWheel(angle) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    var sliceAngle = (2 * Math.PI) / SEGMENTS;

    for (var i = 0; i < SEGMENTS; i++) {
      var startAngle = angle + i * sliceAngle;
      var endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(RADIUS, RADIUS);
      ctx.arc(RADIUS, RADIUS, RADIUS - 3, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(155,231,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Labels
      ctx.save();
      ctx.translate(RADIUS, RADIUS);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.fillStyle = '#a0a7b4';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(pool[i].label, RADIUS * 0.3, 0);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 2, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,217,122,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a12';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,122,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center glyph
    ctx.fillStyle = '#ffd97a';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦷', RADIUS, RADIUS);
  }

  function spin() {
    if (spinning) return;
    spinning = true;
    wheelContainer.style.display = 'block';
    resultArea.style.display = 'none';
    btn.textContent = '🌀 spinning...';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';

    var destIdx = Math.floor(Math.random() * SEGMENTS);
    var dest = pool[destIdx];

    var sliceAngle = (2 * Math.PI) / SEGMENTS;
    var fullRotations = 5 + Math.floor(Math.random() * 4);
    var targetAngle = -(destIdx * sliceAngle + sliceAngle / 2) - Math.PI / 2 + fullRotations * 2 * Math.PI;

    var startAngle = currentAngle;
    var totalRotation = targetAngle - startAngle;
    var duration = 4000 + Math.random() * 2000;
    var startTime = null;

    // Add click sound effect
    var lastSegment = -1;

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutQuart(progress);

      currentAngle = startAngle + totalRotation * eased;
      drawWheel(currentAngle);

      // Tick sound via segment detection
      var currentSegment = Math.floor((-currentAngle / sliceAngle) % SEGMENTS);
      if (currentSegment !== lastSegment && progress < 0.9) {
        lastSegment = currentSegment;
        // Subtle tick
        try {
          var ac = new (window.AudioContext || window.webkitAudioContext)();
          var osc = ac.createOscillator();
          var gain = ac.createGain();
          osc.frequency.value = 800 + Math.random() * 400;
          osc.type = 'sine';
          gain.gain.value = 0.02 * (1 - progress);
          osc.connect(gain).connect(ac.destination);
          osc.start(); osc.stop(ac.currentTime + 0.03);
        } catch(e) {}
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        landed(dest);
      }
    }

    requestAnimationFrame(animate);
  }

  function landed(dest) {
    // Show result
    destDisplay.innerHTML = '<span style="font-size:2rem;">' + dest.label.split(' ')[0] + '</span> <span style="color:#c8cdd3;">' + dest.label.split(' ').slice(1).join(' ') + '</span>';
    goBtn.href = dest.path;
    guideMsg.innerHTML = '<span style="color:#4a5568;">the guide is speaking...</span>';
    resultArea.style.display = 'block';

    // Fetch guide message from DeepSeek
    fetch('/api/guide?path=' + encodeURIComponent(dest.path))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        guideMsg.innerHTML = '"' + data.guide + '"';
      })
      .catch(function() {
        guideMsg.innerHTML = '"Something waits behind this door."';
      });

    // 7 second countdown
    var remaining = 7;
    countdown.textContent = 'auto-launching in ' + remaining + 's...';

    var timer = setInterval(function() {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        window.location.href = dest.path;
      } else {
        countdown.textContent = 'auto-launching in ' + remaining + 's...';
      }
    }, 1000);

    // Click go button cancels timer and goes immediately
    goBtn.addEventListener('click', function(e) {
      clearInterval(timer);
    });

    // Allow re-spin after landing
    btn.textContent = '🦷 Spin Again';
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.onclick = function(e) {
      e.preventDefault();
      clearInterval(timer);
      spinning = false;
      resultArea.style.display = 'none';
      spin();
    };
  }

  btn.addEventListener('click', spin);

  wrapper.appendChild(label);
  wrapper.appendChild(btn);
  wrapper.appendChild(wheelContainer);
  wrapper.appendChild(resultArea);

  drawWheel(currentAngle);

  // Insert before Ghost widget
  var ghost = document.querySelector('#ghost-widget-container');
  if (ghost) {
    document.body.insertBefore(wrapper, ghost);
  } else {
    document.body.appendChild(wrapper);
  }
})();
