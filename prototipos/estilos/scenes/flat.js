/* KidsSchooling · Estilo FLAT 2D VETORIAL
   Canvas 2D em resolução do aparelho, formas geométricas chapadas, camadas com paralaxe. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var LOOP = 3.6, TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  var K = {
    sky: '#8fd8ff', skyLow: '#c5edff', sun: '#ffd23f', sunHalo: 'rgba(255,226,120,0.35)',
    hillFar: '#a9e4b6', hillFar2: '#93d9a5', hillMid: '#69c584', hillMid2: '#56b873',
    grass: '#5fc163', grassD: '#4aa851', earth: '#e9a96a', earthD: '#d18f52', earthDD: '#b8773f',
    water: '#3aa7f0', waterD: '#2a8fd8', waterL: '#8fd8ff',
    wood: '#c98a4f', woodD: '#a5683a', woodL: '#e3a868',
    leaf: '#4cbf6b', leafL: '#74d68a', leafD: '#3aa85a', trunk: '#9a6a43',
    skin: '#ffd2ae', skinD: '#f2b48c', cheek: 'rgba(255,128,128,0.45)', ink: '#2c3350',
    blue: '#3d7be8', blueD: '#2f63c4', navy: '#2e3c74', orange: '#ff9233', orangeD: '#e06f12',
    hair: '#5b3a29', yellow: '#ffc928', yellowD: '#f0a800', beard: '#ffffff', beardD: '#e6ebf2',
    teal: '#36b3a2', apron: '#a8693a', apronD: '#8a522a', pants: '#5a4a6a'
  };

  /* ---------- primitivas ---------- */
  function rr(c, x, y, w, h, r, keep) {
    r = Math.min(r, w / 2, h / 2);
    if (!keep) c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function circ(c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fillStyle = col; c.fill(); }
  function pill(c, x1, y1, x2, y2, w, col) {
    c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = col;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function cloud(c, x, y, s) {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x - 26 * s, y + 4 * s, 16 * s, 0, TAU);
    c.arc(x - 4 * s, y - 8 * s, 22 * s, 0, TAU);
    c.arc(x + 22 * s, y + 2 * s, 17 * s, 0, TAU);
    c.fill();
    rr(c, x - 42 * s, y + 2 * s, 82 * s, 18 * s, 9 * s); c.fill();
    c.fillStyle = 'rgba(160,210,240,0.35)';
    rr(c, x - 36 * s, y + 14 * s, 70 * s, 6 * s, 3 * s); c.fill();
  }
  function tree(c, x, y, s, variant) {
    fillRR(c, x - 5 * s, y - 34 * s, 10 * s, 34 * s, 4 * s, K.trunk);
    if (variant === 1) { // pinheiro arredondado
      c.fillStyle = K.leafD;
      for (var i = 0; i < 3; i++) {
        var w = (34 - i * 8) * s, yy = y - (28 + i * 18) * s;
        c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x, yy - 34 * s); c.lineTo(x + w, yy); c.closePath();
        c.lineJoin = 'round'; c.lineWidth = 8 * s; c.strokeStyle = K.leafD; c.stroke(); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.14)';
      c.beginPath(); c.moveTo(x - 4 * s, y - 60 * s); c.lineTo(x, y - 96 * s); c.lineTo(x - 20 * s, y - 52 * s); c.closePath(); c.fill();
      return;
    }
    var r = 30 * s, cy = y - 58 * s;
    circ(c, x, cy, r, K.leaf);
    c.save(); c.beginPath(); c.arc(x, cy, r, 0, TAU); c.clip();
    circ(c, x - 10 * s, cy - 10 * s, r * 0.8, K.leafL);
    circ(c, x + 14 * s, cy + 16 * s, r * 0.7, K.leafD);
    c.restore();
    if (variant === 2) { circ(c, x - 8 * s, cy + 4 * s, 4.5 * s, '#ff6b6b'); circ(c, x + 12 * s, cy - 8 * s, 4.5 * s, '#ff6b6b'); circ(c, x + 4 * s, cy + 16 * s, 4.5 * s, '#ff6b6b'); }
  }
  function bush(c, x, y, s, col, colL, dots) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x - 14 * s, y - 10 * s, 13 * s, 0, TAU); c.arc(x + 2 * s, y - 16 * s, 16 * s, 0, TAU); c.arc(x + 18 * s, y - 9 * s, 12 * s, 0, TAU); c.fill();
    fillRR(c, x - 27 * s, y - 12 * s, 57 * s, 12 * s, 6 * s, col);
    circ(c, x - 2 * s, y - 22 * s, 7 * s, colL);
    if (dots) { circ(c, x - 14 * s, y - 12 * s, 3.2 * s, dots); circ(c, x + 10 * s, y - 18 * s, 3.2 * s, dots); circ(c, x + 18 * s, y - 8 * s, 3.2 * s, dots); }
  }
  function flower(c, x, y, s, col, sway) {
    c.save(); c.translate(x, y); c.rotate(sway);
    pill(c, 0, 0, 0, -16 * s, 2.6 * s, K.grassD);
    for (var i = 0; i < 5; i++) { var a = i / 5 * TAU; circ(c, Math.cos(a) * 4.5 * s, -18 * s + Math.sin(a) * 4.5 * s, 3.6 * s, col); }
    circ(c, 0, -18 * s, 3 * s, '#ffd23f');
    c.restore();
  }
  function star5(c, x, y, r, rot, col) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = rot + i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r * 0.48 : r;
      if (i === 0) c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); else c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath(); c.lineJoin = 'round'; c.fillStyle = col; c.fill();
  }

  /* ---------- personagens (desenhados olhando para a direita) ---------- */
  function drawHeroHead(c, x, y) {
    // y = centro da cabeça
    circ(c, x - 3, y - 4, 22, K.hair);
    circ(c, x - 8, y + 4, 5.5, K.skinD);              // orelha
    circ(c, x + 4, y + 3, 18.5, K.skin);              // rosto
    c.fillStyle = K.hair;                              // franja
    c.beginPath(); c.ellipse(x + 6, y - 13, 17, 9, -0.25, 0, TAU); c.fill();
    circ(c, x - 12, y - 6, 9, K.hair);
    circ(c, x + 7, y + 3, 2.9, K.ink); circ(c, x + 17, y + 3, 2.9, K.ink);
    circ(c, x + 8, y + 2, 1, '#fff'); circ(c, x + 18, y + 2, 1, '#fff');
    circ(c, x + 3, y + 10, 4, K.cheek); circ(c, x + 21, y + 10, 3.5, K.cheek);
    c.beginPath(); c.arc(x + 13, y + 10, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 2.2; c.lineCap = 'round'; c.strokeStyle = K.ink; c.stroke();
  }
  function drawHero(c, x, y, ph, amp, squash) {
    var sw = Math.sin(ph) * amp, bob = Math.abs(Math.sin(ph)) * 3 * amp;
    c.save(); c.translate(x, y);
    c.scale(1 + (1 - squash) * 0.5, squash); c.translate(0, 0);
    // sombra
    c.fillStyle = 'rgba(30,60,40,0.18)'; c.beginPath(); c.ellipse(0, 1, 22, 5, 0, 0, TAU); c.fill();
    var hipY = -27 - bob;
    // perna de trás
    var a2 = -sw * 0.55, lx2 = Math.sin(a2) * 22, ly2 = Math.cos(a2) * 22;
    pill(c, -3, hipY, -3 + lx2, hipY + ly2, 10, '#26315f');
    fillRR(c, -3 + lx2 - 4, hipY + ly2 - 3, 14, 7, 3.5, '#4a2e22');
    // braço de trás
    var aa2 = sw * 0.6;
    pill(c, -2, -58 - bob, -2 + Math.sin(aa2) * 18, -58 - bob + Math.cos(aa2) * 18, 8, K.blueD);
    // mochila
    fillRR(c, -27, -66 - bob, 18, 32, 7, K.orange);
    fillRR(c, -27, -66 - bob, 18, 12, 6, K.orangeD);
    circ(c, -18, -46 - bob, 2.5, '#ffd23f');
    // corpo
    fillRR(c, -15, -68 - bob, 30, 40, 13, K.blue);
    fillRR(c, -15, -40 - bob, 30, 13, 6, K.navy);
    pill(c, -10, -66 - bob, -4, -44 - bob, 4.5, K.orangeD); // alça
    circ(c, 6, -52 - bob, 2.6, 'rgba(255,255,255,0.55)');
    // perna da frente
    var a1 = sw * 0.55, lx1 = Math.sin(a1) * 22, ly1 = Math.cos(a1) * 22;
    pill(c, 4, hipY, 4 + lx1, hipY + ly1, 10, K.navy);
    fillRR(c, 4 + lx1 - 4, hipY + ly1 - 3, 15, 7, 3.5, '#5a3626');
    // braço da frente
    var aa1 = -sw * 0.6;
    var hx = 6 + Math.sin(aa1) * 18, hy = -58 - bob + Math.cos(aa1) * 18;
    pill(c, 6, -58 - bob, hx, hy, 8.5, K.blue);
    circ(c, hx, hy + 1, 5, K.skin);
    drawHeroHead(c, 2, -88 - bob);
    c.restore();
  }
  function drawTomeHead(c, x, y, blink) {
    circ(c, x - 12, y + 3, 6, K.skinD);
    circ(c, x + 2, y + 2, 20, K.skin);
    circ(c, x - 10, y - 2, 8, '#d9dde6');            // cabelo grisalho atrás
    // barba
    c.fillStyle = K.beard;
    c.beginPath(); c.moveTo(x - 14, y + 4); c.quadraticCurveTo(x - 12, y + 34, x + 6, y + 36); c.quadraticCurveTo(x + 24, y + 30, x + 24, y + 6);
    c.quadraticCurveTo(x + 10, y + 14, x - 14, y + 4); c.fill();
    c.fillStyle = K.beardD;
    c.beginPath(); c.moveTo(x - 4, y + 22); c.quadraticCurveTo(x + 6, y + 34, x + 16, y + 26); c.quadraticCurveTo(x + 8, y + 31, x - 4, y + 22); c.fill();
    // bigode
    c.fillStyle = K.beard;
    c.beginPath(); c.ellipse(x + 9, y + 11, 12, 5.5, 0, 0, TAU); c.fill();
    circ(c, x + 15, y + 5, 4.6, '#f0a07a');           // nariz
    circ(c, x + 1, y + 7, 4.5, K.cheek); circ(c, x + 20, y + 4, 3.2, K.cheek);
    // olhos sorrindo
    c.strokeStyle = K.ink; c.lineWidth = 2.4; c.lineCap = 'round';
    if (blink) { pill(c, x + 4, y - 1, x + 9, y - 1, 2.4, K.ink); pill(c, x + 15, y - 2, x + 19, y - 2, 2.4, K.ink); }
    else {
      c.beginPath(); c.arc(x + 6.5, y + 0, 3.6, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
      c.beginPath(); c.arc(x + 17.5, y - 1, 3.2, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    }
    // sobrancelhas brancas
    pill(c, x + 3, y - 7, x + 9, y - 8, 3, '#ffffff');
    // capacete
    c.fillStyle = K.yellow;
    c.beginPath(); c.arc(x + 1, y - 9, 22, Math.PI, 0); c.closePath(); c.fill();
    fillRR(c, x - 22, y - 12, 50, 7, 3.5, K.yellowD);
    fillRR(c, x - 4, y - 31, 9, 20, 4.5, '#ffe27a');
    circ(c, x + 1, y - 9, 0, K.yellow);
  }
  function drawTome(c, x, y, talk, wave, bob, blink) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(30,60,40,0.18)'; c.beginPath(); c.ellipse(0, 1, 27, 5.5, 0, 0, TAU); c.fill();
    var b = bob;
    // pernas
    pill(c, -8, -24, -9, -5, 12, K.pants); pill(c, 8, -24, 9, -5, 12, '#4c3d5c');
    fillRR(c, -16, -7, 17, 8, 4, '#4a2e22'); fillRR(c, 3, -7, 18, 8, 4, '#5a3626');
    // braço de trás
    pill(c, -12, -60 - b, -16, -34 - b, 10, '#2f9b8c');
    circ(c, -16, -32 - b, 5.5, K.skin);
    // corpo
    fillRR(c, -21, -74 - b, 42, 54, 18, K.teal);
    // avental
    fillRR(c, -13, -60 - b, 30, 42, 8, K.apron);
    fillRR(c, -7, -44 - b, 18, 11, 4, K.apronD);
    pill(c, -12, -58 - b, -19, -70 - b, 3, K.apronD);
    // régua no bolso
    fillRR(c, -4, -52 - b, 5, 12, 1.5, '#ffd23f');
    // braço da frente (acena ao falar)
    var ang = wave ? (-2.2 + Math.sin(talk * 9) * 0.35) : -0.25;
    var hx = 12 + Math.sin(-ang) * 0, sx = 13, sy = -62 - b;
    var ex = sx + Math.cos(ang + Math.PI / 2) * 22, ey = sy + Math.sin(ang + Math.PI / 2) * 22;
    pill(c, sx, sy, ex, ey, 10.5, K.teal);
    circ(c, ex, ey, 6, K.skin);
    if (wave) { pill(c, ex - 1, ey - 4, ex - 1, ey - 9, 4, K.skin); }
    drawTomeHead(c, 0, -94 - b, blink);
    c.restore();
  }

  /* ---------- ícones SVG do HUD ---------- */
  var SVG = {
    hammer: '<svg viewBox="0 0 24 24"><rect x="10.2" y="9" width="3.6" height="13" rx="1.8" fill="#fff"/><path d="M5 4.5h10.5l3 3v2.2H5.8A2 2 0 0 1 3.8 7.7V5.7A1.2 1.2 0 0 1 5 4.5z" fill="#fff"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="7" width="16" height="15" rx="5" fill="#fff"/><rect x="8" y="13" width="8" height="5" rx="2" fill="currentColor" opacity=".35"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M3 6.2 8.6 4l6.8 2.4L21 4.2v13.6L15.4 20l-6.8-2.4L3 19.8z" fill="#fff"/><path d="M8.6 4v13.6M15.4 6.4V20" stroke="currentColor" stroke-opacity=".35" stroke-width="1.6"/><circle cx="12" cy="11" r="1.6" fill="currentColor"/></svg>',
    bridge: '<svg viewBox="0 0 24 24"><path d="M2 14h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M5 14V9M12 14V8M19 14V9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M3 9.5Q12 4 21 9.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M4 19c2-1.4 4-1.4 6 0s4 1.4 6 0 3-1 4-.6" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };

  window.SCENES['flat'] = {
    mount: function (host) {
      var reduce = false;
      try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

      var root = document.createElement('div');
      root.className = 'flat-root';
      root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:' + K.sky + ';';
      host.appendChild(root);
      var style = document.createElement('style');
      style.textContent = [
        '.flat-root,.flat-root *{box-sizing:border-box;}',
        '.flat-cv{position:absolute;left:0;top:0;display:block;}',
        '.flat-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,sans-serif;color:#2c3350;font-size:calc(16px*var(--u));}',
        '.flat-top{position:absolute;left:calc(14px*var(--u));right:calc(14px*var(--u));top:calc(env(safe-area-inset-top,0px) + 34px);display:flex;flex-direction:column;gap:calc(8px*var(--u));align-items:flex-start;}',
        '.flat-card{background:#fff;border-radius:calc(20px*var(--u));box-shadow:0 calc(4px*var(--u)) 0 rgba(44,51,80,.10);}',
        '.flat-player{align-self:stretch;display:flex;align-items:center;gap:calc(10px*var(--u));padding:calc(9px*var(--u)) calc(14px*var(--u)) calc(9px*var(--u)) calc(9px*var(--u));}',
        '.flat-av{flex:none;width:calc(50px*var(--u));height:calc(50px*var(--u));border-radius:50%;background:#ffe8a3;overflow:hidden;box-shadow:inset 0 0 0 calc(3px*var(--u)) #ffc928;}',
        '.flat-av canvas{width:100%;height:100%;display:block;}',
        '.flat-pinfo{flex:1;min-width:0;}',
        '.flat-lvl{font-family:"Fredoka","Baloo 2",system-ui,sans-serif;font-weight:600;font-size:calc(17px*var(--u));line-height:1.1;white-space:nowrap;}',
        '.flat-lvl span{color:#3d7be8;}',
        '.flat-xprow{display:flex;align-items:center;gap:calc(8px*var(--u));margin-top:calc(6px*var(--u));}',
        '.flat-bar{flex:1;height:calc(12px*var(--u));border-radius:999px;background:#e9eef8;overflow:hidden;position:relative;}',
        '.flat-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#ffb020;}',
        '.flat-fill:after{content:"";position:absolute;left:calc(5px*var(--u));right:calc(5px*var(--u));top:calc(2.5px*var(--u));height:calc(3px*var(--u));border-radius:9px;background:rgba(255,255,255,.55);}',
        '.flat-xpt{font-weight:800;font-size:calc(12.5px*var(--u));color:#7a839c;white-space:nowrap;font-variant-numeric:tabular-nums;}',
        '.flat-xpt b{color:#2c3350;}',
        '.flat-mis{display:flex;align-items:center;gap:calc(8px*var(--u));padding:calc(6px*var(--u)) calc(14px*var(--u)) calc(6px*var(--u)) calc(6px*var(--u));border-radius:999px;font-weight:700;font-size:calc(14px*var(--u));}',
        '.flat-mis i{flex:none;display:grid;place-items:center;width:calc(30px*var(--u));height:calc(30px*var(--u));border-radius:50%;background:#ff8a3d;}',
        '.flat-mis i svg{width:62%;height:62%;}',
        '.flat-mis b{color:#ff7a1a;font-weight:800;}',
        '.flat-say{position:absolute;left:calc(14px*var(--u));right:calc(14px*var(--u));display:flex;gap:calc(12px*var(--u));align-items:center;padding:calc(14px*var(--u)) calc(16px*var(--u)) calc(14px*var(--u)) calc(14px*var(--u));transform-origin:85% 0;opacity:0;}',
        '.flat-say:before{content:"";position:absolute;right:calc(44px*var(--u));top:calc(-11px*var(--u));width:calc(26px*var(--u));height:calc(26px*var(--u));background:#fff;border-radius:calc(5px*var(--u));transform:rotate(45deg);}',
        '.flat-say .flat-av{width:calc(54px*var(--u));height:calc(54px*var(--u));background:#c9f0e9;box-shadow:inset 0 0 0 calc(3px*var(--u)) #36b3a2;position:relative;}',
        '.flat-name{font-family:"Fredoka","Baloo 2",system-ui,sans-serif;font-weight:600;font-size:calc(14px*var(--u));color:#1f9a89;letter-spacing:.02em;}',
        '.flat-line{font-weight:800;font-size:calc(17px*var(--u));line-height:1.28;margin-top:calc(2px*var(--u));}',
        '.flat-line span{display:inline-block;opacity:0;transform:translateY(calc(6px*var(--u)));}',
        '.flat-btns{position:absolute;left:calc(14px*var(--u));right:calc(14px*var(--u));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--u));}',
        '.flat-btn{flex:1;height:calc(64px*var(--u));border-radius:calc(20px*var(--u));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(2px*var(--u));color:#fff;font-family:"Fredoka","Baloo 2",system-ui,sans-serif;font-weight:600;font-size:calc(15px*var(--u));letter-spacing:.01em;}',
        '.flat-btn svg{width:calc(24px*var(--u));height:calc(24px*var(--u));}',
        '.flat-b1{background:#ff8a3d;box-shadow:0 calc(5px*var(--u)) 0 #e0661a;color:#e0661a;} .flat-b1 span{color:#fff;}',
        '.flat-b2{background:#3d7be8;box-shadow:0 calc(5px*var(--u)) 0 #2a5cc0;color:#2a5cc0;} .flat-b2 span{color:#fff;}',
        '.flat-b3{background:#2fb67c;box-shadow:0 calc(5px*var(--u)) 0 #1f9160;color:#1f9160;} .flat-b3 span{color:#fff;}',
        '.flat-xp{position:absolute;display:flex;align-items:center;gap:calc(5px*var(--u));padding:calc(6px*var(--u)) calc(13px*var(--u)) calc(6px*var(--u)) calc(7px*var(--u));border-radius:999px;background:#ffb020;color:#fff;font-family:"Fredoka","Baloo 2",system-ui,sans-serif;font-weight:700;font-size:calc(20px*var(--u));box-shadow:0 calc(4px*var(--u)) 0 #e08a00;opacity:0;white-space:nowrap;}',
        '.flat-xp i{display:grid;place-items:center;width:calc(26px*var(--u));height:calc(26px*var(--u));border-radius:50%;background:#ff8a00;}',
        '.flat-xp i svg{width:70%;height:70%;}'
      ].join('\n');
      root.appendChild(style);

      var cv = document.createElement('canvas');
      cv.className = 'flat-cv';
      root.appendChild(cv);
      var ctx = cv.getContext('2d');

      var LINE = 'A viga precisa se apoiar dos dois lados!';
      var words = LINE.split(' ');
      var hud = document.createElement('div');
      hud.className = 'flat-hud';
      hud.innerHTML =
        '<div class="flat-top">' +
          '<div class="flat-card flat-player"><div class="flat-av"><canvas class="flat-avh"></canvas></div><div class="flat-pinfo">' +
            '<div class="flat-lvl">Nível 4 · <span>Explorador</span></div>' +
            '<div class="flat-xprow"><div class="flat-bar"><div class="flat-fill"></div></div><div class="flat-xpt"><b class="flat-xpn">620</b>/1000 XP</div></div>' +
          '</div></div>' +
          '<div class="flat-card flat-mis"><i>' + SVG.bridge + '</i><div><b>Missão:</b> consertar a ponte da vila</div></div>' +
        '</div>' +
        '<div class="flat-xp"><i>' + SVG.star + '</i>+50 XP</div>' +
        '<div class="flat-card flat-say"><div class="flat-av"><canvas class="flat-avt"></canvas></div><div><div class="flat-name">Mestre Tomé</div><div class="flat-line">' +
          words.map(function (w) { return '<span>' + w + '</span>'; }).join(' ') + '</div></div></div>' +
        '<div class="flat-btns">' +
          '<div class="flat-btn flat-b1">' + SVG.hammer + '<span>Construir</span></div>' +
          '<div class="flat-btn flat-b2">' + SVG.bag + '<span>Mochila</span></div>' +
          '<div class="flat-btn flat-b3">' + SVG.map + '<span>Mapa</span></div>' +
        '</div>';
      root.appendChild(hud);
      function q(s) { return hud.querySelector(s); }
      var elFill = q('.flat-fill'), elXpN = q('.flat-xpn'), elSay = q('.flat-say'), elXp = q('.flat-xp');
      var wordEls = hud.querySelectorAll('.flat-line span');

      function paintAvatar(canvas, which) {
        var d = Math.min(2, window.devicePixelRatio || 1), sz = 60;
        canvas.width = sz * d; canvas.height = sz * d;
        var c = canvas.getContext('2d');
        c.setTransform(d, 0, 0, d, 0, 0);
        if (which === 'hero') {
          fillRR(c, 14, 46, 32, 30, 12, K.blue); fillRR(c, 9, 48, 9, 20, 4, K.orange); fillRR(c, 42, 48, 9, 20, 4, K.orange);
          c.save(); c.translate(30, 30); c.scale(1.05, 1.05); drawHeroHead(c, -4, 0); c.restore();
        } else {
          fillRR(c, 10, 50, 40, 30, 14, K.teal); fillRR(c, 18, 54, 24, 30, 6, K.apron);
          c.save(); c.translate(30, 33); c.scale(-0.95, 0.95); drawTomeHead(c, -4, 0, false); c.restore();
        }
      }

      var W = 0, H = 0, dpr = 1, k = 1, Hu = 844, GY = 532;
      function layout() {
        var r = host.getBoundingClientRect();
        W = Math.max(200, r.width); H = Math.max(300, r.height);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        k = W / 390; Hu = H / k;
        GY = Math.round(Hu * 0.585);
        root.style.setProperty('--u', k.toFixed(4));
        paintAvatar(q('.flat-avh'), 'hero');
        paintAvatar(q('.flat-avt'), 'tome');
        // cartão de fala: logo acima dos botões
        elSay.style.bottom = 'calc(env(safe-area-inset-bottom,0px) + 20px + ' + (64 + 18) * k + 'px)';
      }
      var ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(layout); ro.observe(host); }
      layout();

      // ponte (unidades do mundo)
      var LB = 166, RB = 302;           // margens
      var DX0 = 150, DX1 = 318, NSEG = 5, MISS = 2;
      var SEGW = (DX1 - DX0) / NSEG;

      function drawDeckSeg(c, x, y, w, glow) {
        fillRR(c, x + 1, y, w - 2, 18, 5, K.woodD);
        fillRR(c, x + 1, y, w - 2, 12, 5, glow ? '#ffd27a' : K.wood);
        fillRR(c, x + 4, y + 2.5, w - 14, 3, 1.5, glow ? '#fff1c2' : K.woodL);
        circ(c, x + 5, y + 7, 1.6, '#7b4b28'); circ(c, x + w - 6, y + 7, 1.6, '#7b4b28');
      }

      function render(t) {
        var c = ctx;
        var pan = reduce ? 0 : (t < 3.35 ? lerp(-10, 0, easeInOut(seg(t, 0, 1.7))) : -10);
        var zoom = 1.08 + (reduce ? 0 : (t < 3.35 ? lerp(0, 0.03, easeInOut(seg(t, 0, 1.7))) : 0));
        var shake = (!reduce && t > 2.2 && t < 2.36) ? Math.sin(t * 120) * 1.6 * (1 - seg(t, 2.2, 2.36)) : 0;
        var base = dpr * k;
        c.setTransform(base, 0, 0, base, 0, 0);

        // céu
        var g = c.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, K.sky); g.addColorStop(1, K.skyLow);
        c.fillStyle = g; c.fillRect(0, 0, 390, Hu);

        function layer(f) { // paralaxe + zoom em torno do foco
          c.setTransform(base, 0, 0, base, 0, 0);
          var fx = 234, fy = GY;
          var z = 1 + (zoom - 1) * f;
          c.translate(fx, fy + shake * f); c.scale(z, z); c.translate(-fx - pan * f, -fy);
        }

        // sol
        layer(0.05);
        var sp = 1 + Math.sin(t / LOOP * TAU) * 0.04;
        circ(c, 312, GY - 268, 62 * sp, 'rgba(255,236,150,0.28)');
        circ(c, 312, GY - 268, 46 * sp, 'rgba(255,226,120,0.45)');
        circ(c, 312, GY - 268, 32, K.sun);
        // nuvens
        layer(0.12);
        var cb = Math.sin(t / LOOP * TAU);
        cloud(c, 84 + cb * 6, GY - 250, 1.0);
        cloud(c, 236 - cb * 5, GY - 196, 0.72);
        cloud(c, 392 + cb * 4, GY - 318, 0.8);
        cloud(c, -6 - cb * 3, GY - 150, 0.6);
        // passarinhos
        c.strokeStyle = '#3b5b8c'; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
        for (var bi = 0; bi < 2; bi++) {
          var bx = 168 + bi * 26 + Math.cos(t / LOOP * TAU + bi) * 10, by = GY - 290 + bi * 12 + Math.sin(t / LOOP * TAU * 2 + bi) * 5;
          var wf = Math.sin(t * TAU * 2.5 + bi * 2) * 3.5;
          c.beginPath(); c.moveTo(bx - 7, by - wf); c.lineTo(bx, by); c.lineTo(bx + 7, by - wf); c.stroke();
        }

        // colinas distantes (com capelinha)
        layer(0.25);
        c.fillStyle = K.hillFar;
        c.beginPath(); c.ellipse(60, GY - 30, 210, 150, 0, Math.PI, 0); c.fill();
        c.fillStyle = K.hillFar2;
        c.beginPath(); c.ellipse(360, GY - 20, 230, 130, 0, Math.PI, 0); c.fill();
        // capelinha
        var chx = 372, chy = GY - 146;
        fillRR(c, chx - 14, chy - 18, 28, 20, 2, '#ffffff');
        c.fillStyle = '#ff8a6a'; c.beginPath(); c.moveTo(chx - 17, chy - 17); c.lineTo(chx, chy - 30); c.lineTo(chx + 17, chy - 17); c.closePath(); c.fill();
        fillRR(c, chx - 4, chy - 44, 8, 16, 1, '#ffffff');
        fillRR(c, chx - 1, chy - 54, 2, 10, 1, '#f0a800'); fillRR(c, chx - 4, chy - 51, 8, 2, 1, '#f0a800');
        fillRR(c, chx - 3, chy - 9, 6, 11, 3, '#c98a4f');
        // colinas médias com arvorezinhas
        layer(0.45);
        c.fillStyle = K.hillMid;
        c.beginPath(); c.ellipse(-20, GY + 10, 200, 110, 0, Math.PI, 0); c.fill();
        c.fillStyle = K.hillMid2;
        c.beginPath(); c.ellipse(330, GY + 20, 190, 100, 0, Math.PI, 0); c.fill();
        var small = [[80, GY - 92], [120, GY - 80], [262, GY - 70], [300, GY - 78], [420, GY - 60]];
        for (var si = 0; si < small.length; si++) {
          fillRR(c, small[si][0] - 2, small[si][1] - 4, 4, 14, 2, '#5e8a54');
          circ(c, small[si][0], small[si][1] - 10, 10, si % 2 ? '#3fa862' : '#46b06a');
        }

        // ------- camada principal -------
        layer(1);
        // casa (atrás do herói)
        var hx0 = 6, hw = 104, hh = 84, hy = GY - hh;
        fillRR(c, hx0 + 62, hy - 58, 16, 40, 3, '#d45f45');
        fillRR(c, hx0 + 59, hy - 62, 22, 9, 3, '#b84a35');
        for (var sm = 0; sm < 3; sm++) {
          var sp2 = ((t / 1.2) + sm / 3) % 1;
          circ(c, hx0 + 70 + sp2 * 18 + Math.sin(sp2 * 5) * 3, hy - 70 - sp2 * 46, 6 + sp2 * 9, 'rgba(255,255,255,' + (0.85 * (1 - sp2)).toFixed(3) + ')');
        }
        fillRR(c, hx0, hy, hw, hh + 2, 6, '#ffe6bf');
        c.fillStyle = '#f6d3a0'; c.fillRect(hx0 + hw * 0.62, hy, hw * 0.38 - 0.5, hh);
        c.fillStyle = '#ff7a59';
        c.beginPath(); c.moveTo(hx0 - 14, hy + 4); c.lineTo(hx0 + hw / 2, hy - 52); c.lineTo(hx0 + hw + 14, hy + 4); c.closePath();
        c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = '#ff7a59'; c.stroke(); c.fill();
        c.fillStyle = '#e85f40';
        c.beginPath(); c.moveTo(hx0 + hw / 2, hy - 52); c.lineTo(hx0 + hw + 14, hy + 4); c.lineTo(hx0 + hw / 2, hy + 4); c.closePath(); c.fill();
        circ(c, hx0 + hw / 2, hy - 20, 11, '#ffe6bf'); circ(c, hx0 + hw / 2, hy - 20, 7.5, '#8fdcff');
        fillRR(c, hx0 + hw / 2 - 1, hy - 27.5, 2, 15, 1, '#ffe6bf'); fillRR(c, hx0 + hw / 2 - 7.5, hy - 21, 15, 2, 1, '#ffe6bf');
        fillRR(c, hx0 + 60, hy + 34, 26, 50, 13, '#b86b3e');
        fillRR(c, hx0 + 60, hy + 70, 26, 14, 0, '#b86b3e');
        circ(c, hx0 + 80, hy + 60, 2.5, '#ffd23f');
        fillRR(c, hx0 + 14, hy + 26, 30, 26, 6, '#8fdcff');
        fillRR(c, hx0 + 14, hy + 26, 30, 9, 4, '#b9ecff');
        fillRR(c, hx0 + 28, hy + 26, 2.5, 26, 1, '#ffffff');
        fillRR(c, hx0 + 10, hy + 51, 38, 8, 4, '#a5683a');
        circ(c, hx0 + 17, hy + 49, 4.5, '#ff6b8a'); circ(c, hx0 + 29, hy + 48, 4.5, '#ffd23f'); circ(c, hx0 + 41, hy + 49, 4.5, '#ff6b8a');

        // árvores e arbustos
        tree(c, 128, GY, 1.0, 2);
        tree(c, 372, GY, 1.05, 1);
        tree(c, 410, GY, 0.9, 0);
        bush(c, -6, GY + 2, 0.9, '#3fae5c', '#62c97c', '#ff8fb1');
        bush(c, 312, GY + 2, 0.7, '#3fae5c', '#62c97c', '#ffd23f');

        // vale do riacho: terra com um "U" recortado, água dentro
        var WY = GY + 52, TB = GY + 168;
        c.save();
        c.beginPath(); c.rect(-80, GY, 560, Hu); c.clip();
        c.beginPath(); c.rect(-80, GY - 60, 560, Hu); rr(c, LB, GY - 40, RB - LB, TB - GY + 40, 44, true); c.clip('evenodd');
        c.fillStyle = K.earth; c.fillRect(-80, GY, 560, Hu);
        c.fillStyle = K.earthD; c.fillRect(-80, GY + 56, 560, 26);
        c.fillStyle = K.earthDD; c.fillRect(-80, TB + 10, 560, Hu);
        var stones = [[40, GY + 34, 6], [110, GY + 100, 7], [24, GY + 120, 5], [340, GY + 36, 6], [372, GY + 104, 8], [228, TB + 30, 7], [196, TB + 50, 5]];
        for (var s3 = 0; s3 < stones.length; s3++) { c.fillStyle = stones[s3][1] > TB ? '#a0652f' : K.earthDD; c.beginPath(); c.ellipse(stones[s3][0], stones[s3][1], stones[s3][2] * 1.5, stones[s3][2], 0, 0, TAU); c.fill(); }
        c.restore();
        // estacas da ponte (até o leito)
        fillRR(c, DX0 + SEGW * 1.5 - 6, GY + 4, 12, TB - GY - 4, 3, '#8a5530');
        fillRR(c, DX0 + SEGW * 3.5 - 6, GY + 4, 12, TB - GY - 4, 3, '#8a5530');
        // água recortada no vale
        c.save();
        rr(c, LB, GY - 40, RB - LB, TB - GY + 40, 44); c.clip();
        c.fillStyle = K.water;
        c.beginPath(); c.moveTo(LB - 4, TB + 10);
        for (var wx = LB - 4; wx <= RB + 4; wx += 6) c.lineTo(wx, WY + Math.sin(wx * 0.07 + t / 1.2 * TAU) * 2.4);
        c.lineTo(RB + 4, TB + 10); c.closePath(); c.fill();
        c.fillStyle = K.waterD; c.fillRect(LB, WY + 62, RB - LB, TB);
        var off = (t / LOOP) * 60;
        for (var row = 0; row < 3; row++) for (var dx = -60; dx < RB - LB + 60; dx += 60) {
          var xx = LB + dx + ((off * (row % 2 ? -1 : 1) + row * 23) % 60 + 60) % 60;
          if (xx > LB + 6 && xx < RB - 22) fillRR(c, xx, WY + 14 + row * 26, 16 - row * 3, 3.5, 2, row === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)');
        }
        // peixinho que pula
        var fp = seg(t, 0.4, 1.3);
        if (fp > 0 && fp < 1) {
          var fxp = lerp(LB + 22, LB + 62, fp), fyp = WY + 8 - Math.sin(fp * Math.PI) * 30;
          c.save(); c.translate(fxp, fyp); c.rotate(lerp(-0.9, 0.9, fp));
          c.fillStyle = '#ff9a3d'; c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(-7, 0); c.lineTo(-14, -5); c.lineTo(-14, 5); c.closePath(); c.fill();
          circ(c, 4, -1, 1.4, K.ink);
          c.restore();
        }
        c.restore();
        // anéis das estacas
        for (var pi = 0; pi < 2; pi++) {
          var px = DX0 + SEGW * (pi ? 3.5 : 1.5), rp = (t / 1.2 + pi * 0.5) % 1;
          c.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - rp)).toFixed(3) + ')'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(px, WY + 2, 8 + rp * 14, 2 + rp * 3, 0, 0, TAU); c.stroke();
        }
        // gramado das margens
        c.fillStyle = K.grassD; rr(c, -60, GY - 2, LB + 60 + 8, 20, 10); c.fill(); rr(c, RB - 8, GY - 2, 540 - RB, 20, 10); c.fill();
        c.fillStyle = K.grass; rr(c, -60, GY - 4, LB + 60 + 8, 14, 7); c.fill(); rr(c, RB - 8, GY - 4, 540 - RB, 14, 7); c.fill();

        // ponte: pilares sobre a margem + tabuleiro
        fillRR(c, DX0 - 4, GY - 2, 14, 26, 3, K.woodD);
        fillRR(c, DX1 - 10, GY - 2, 14, 26, 3, K.woodD);
        // corrimão (atrás do tabuleiro)
        for (var pp = 0; pp <= NSEG; pp++) {
          var postX = DX0 + pp * SEGW;
          fillRR(c, postX - 3.5, GY - 34, 7, 34, 3.5, K.woodD);
          circ(c, postX, GY - 35, 5, K.wood);
        }
        pill(c, DX0, GY - 28, DX1, GY - 28, 5, K.wood);
        pill(c, DX0, GY - 15, DX1, GY - 15, 4, K.woodD);
        var deckY = GY - 4;
        for (var sgi = 0; sgi < NSEG; sgi++) if (sgi !== MISS) drawDeckSeg(c, DX0 + sgi * SEGW, deckY, SEGW, false);
        // contorno pontilhado da peça que falta (dica)
        if (t < 2.2 || t >= 3.35) {
          var ga = 0.6 + 0.35 * Math.sin(t / LOOP * TAU * 3);
          c.save(); c.setLineDash([5, 4]); c.lineDashOffset = -t * 20; c.lineWidth = 2.4; c.strokeStyle = 'rgba(255,255,255,' + ga.toFixed(3) + ')';
          rr(c, DX0 + MISS * SEGW + 3, deckY + 1, SEGW - 6, 16, 5); c.stroke(); c.restore();
        }

        // peça que falta
        var gx = DX0 + MISS * SEGW, gcx = gx + SEGW / 2;
        var placed = t >= 2.2 && t < 3.35;
        if (t >= 1.6 && t < 3.35) {
          var appear = easeBack(seg(t, 1.6, 1.85));
          var fall = easeIn(seg(t, 1.9, 2.2));
          var py = placed ? deckY : lerp(deckY - 150, deckY, fall);
          var rot = placed ? 0 : (1 - fall) * Math.sin(t * 6) * 0.12;
          var sq = placed ? 1 - Math.sin(seg(t, 2.2, 2.4) * Math.PI) * 0.22 : 1;
          var hover = placed ? 0 : (1 - seg(t, 1.9, 2.0)) * Math.sin(t * 8) * 3;
          // brilho atrás quando aparece
          if (!placed) {
            var gl = 0.5 + 0.5 * Math.sin(t * 14);
            circ(c, gcx, py + 7 + hover, 34 * appear * (placed ? 1 : lerp(1.3, 1, fall)), 'rgba(255,240,170,' + (0.45 + 0.2 * gl).toFixed(3) + ')');
            // sombra no rio
            c.fillStyle = 'rgba(20,70,130,' + (0.12 + 0.25 * fall).toFixed(3) + ')';
            c.beginPath(); c.ellipse(gcx, WY + 3, 10 + 12 * fall, 3, 0, 0, TAU); c.fill();
          }
          c.save();
          c.translate(gcx, py + 7 + hover);
          c.rotate(rot);
          var big = placed ? 1 : lerp(1.45, 1, fall);
          c.scale(appear * (2 - sq) * big, appear * sq * big);
          drawDeckSeg(c, -SEGW / 2, -9, SEGW, !placed || t < 2.3);
          c.restore();
        }
        // efeitos de encaixe
        if (t >= 2.2 && t < 3.0) {
          var q2 = seg(t, 2.2, 3.0), qe = easeOut(q2);
          c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - q2)).toFixed(3) + ')'; c.lineWidth = 4 * (1 - q2) + 1;
          c.beginPath(); c.ellipse(gcx, deckY + 6, 20 + qe * 60, 8 + qe * 26, 0, 0, TAU); c.stroke();
          for (var pf = 0; pf < 6; pf++) {
            var side = pf < 3 ? -1 : 1, kk = pf % 3;
            circ(c, gcx + side * (SEGW / 2 + qe * (14 + kk * 12)), deckY + 10 - qe * (6 + kk * 8), (7 - kk) * (1 - q2), 'rgba(255,240,215,' + (1 - q2).toFixed(3) + ')');
          }
          var cols = ['#ffd23f', '#ff8a3d', '#3d7be8', '#2fb67c', '#ff6b8a', '#ffd23f', '#3d7be8', '#ff8a3d'];
          for (var cf = 0; cf < 8; cf++) {
            var an = -Math.PI / 2 + (cf - 3.5) * 0.36;
            var dist = 20 + qe * 70;
            var cx2 = gcx + Math.cos(an) * dist, cy2 = deckY - 4 + Math.sin(an) * dist + q2 * q2 * 40;
            var sz = 7 * (1 - q2 * 0.7);
            if (cf % 2) star5(c, cx2, cy2, sz, t * 6 + cf, cols[cf]);
            else circ(c, cx2, cy2, sz * 0.55, cols[cf]);
          }
        }

        // herói
        var walk = t < 3.35 ? seg(t, 0, 1.3) : 0;
        var heroX = lerp(40, 128, easeOut(walk) * 0.35 + walk * 0.65);
        var amp = t < 3.35 ? 1 - seg(t, 1.15, 1.4) : 1;
        var ph = t * TAU * 2.4;
        var jumpP = seg(t, 2.38, 2.72);
        var jump = Math.sin(jumpP * Math.PI) * 18;
        var squash = 1;
        if (t > 2.3 && t < 2.38) squash = 1 - Math.sin(seg(t, 2.3, 2.38) * Math.PI) * 0.12;
        if (t > 2.72 && t < 2.82) squash = 1 - Math.sin(seg(t, 2.72, 2.82) * Math.PI) * 0.1;
        c.save();
        if (jump > 0) { c.fillStyle = 'rgba(30,60,40,0.10)'; c.beginPath(); c.ellipse(heroX, GY + 1, 18, 4, 0, 0, TAU); c.fill(); }
        drawHero(c, heroX, GY - jump, ph, amp, squash);
        c.restore();

        // Mestre Tomé (espelhado: olha para a esquerda)
        var talking = t > 0.8 && t < 2.0;
        var cheer = t > 2.3 && t < 2.9;
        c.save(); c.translate(330, GY); c.scale(-1, 1);
        var mb = Math.sin(t / LOOP * TAU * 3) * 1.5 + (talking ? Math.abs(Math.sin(t * 10)) * 1.5 : 0);
        var blink = (t > 1.3 && t < 1.4) || (t > 3.3 && t < 3.4);
        drawTome(c, 0, 0, t, talking || cheer, mb, blink);
        c.restore();

        // primeiro plano
        layer(1.25);
        var fy = GY + 200;
        c.fillStyle = '#4fb35a';
        c.beginPath(); c.ellipse(40, Hu + 30, 200, Hu - fy + 70, 0, Math.PI, 0); c.fill();
        c.beginPath(); c.ellipse(390, Hu + 40, 170, Hu - fy + 60, 0, Math.PI, 0); c.fill();
        var fl = [[30, fy + 26, '#ff6b8a'], [64, fy + 14, '#ffffff'], [104, fy + 34, '#ffd23f'], [300, fy + 30, '#b48cff'], [340, fy + 18, '#ff6b8a'], [372, fy + 36, '#ffffff']];
        for (var fi = 0; fi < fl.length; fi++) flower(c, fl[fi][0], fl[fi][1], 1.1, fl[fi][2], Math.sin(t / LOOP * TAU * 2 + fi) * 0.12);
        bush(c, 170, Hu + 6, 1.3, '#3a9f4f', '#55b968', null);

        // íris de transição (fecha e abre para emendar o loop)
        c.setTransform(base, 0, 0, base, 0, 0);
        var iris = t < 3.05 ? 0 : t < 3.35 ? easeInOut(seg(t, 3.05, 3.35)) : 1 - easeInOut(seg(t, 3.35, 3.6));
        if (iris > 0) {
          var maxR = Math.sqrt(390 * 390 + Hu * Hu);
          var ir = (1 - iris) * maxR;
          c.fillStyle = '#26305a';
          c.beginPath(); c.rect(0, 0, 390, Hu); c.arc(234, GY - 40, Math.max(0.1, ir), 0, TAU, true); c.fill();
        }

        /* --- HUD --- */
        var xp = 620 + 50 * easeOut(seg(t, 2.5, 2.95));
        if (t >= 3.1) xp = lerp(670, 620, easeInOut(seg(t, 3.1, 3.5)));
        elFill.style.width = (xp / 10) + '%';
        elXpN.textContent = Math.round(xp);
        var xpP = seg(t, 2.4, 3.05);
        if (xpP > 0 && xpP < 1) {
          var pop = easeBack(seg(t, 2.4, 2.6));
          elXp.style.opacity = xpP < 0.75 ? 1 : 1 - (xpP - 0.75) / 0.25;
          var ex = 234 + (gcx - 234 - pan) * zoom;
          elXp.style.left = (ex * k) + 'px';
          elXp.style.top = ((GY - 84 - easeOut(xpP) * 60) * k) + 'px';
          elXp.style.transform = 'translate(-50%,-50%) scale(' + pop.toFixed(3) + ')';
        } else elXp.style.opacity = 0;

        var sIn = seg(t, 0.8, 1.05), sOut = seg(t, 3.0, 3.18);
        var sv = sIn > 0 && sOut < 1;
        elSay.style.opacity = sv ? (1 - sOut) : 0;
        elSay.style.transform = 'scale(' + (sv ? (easeBack(sIn) * (1 - 0.1 * sOut)) : 0.6).toFixed(3) + ')';
        for (var wi = 0; wi < wordEls.length; wi++) {
          var wp = t >= 3.0 ? 1 : easeOut(seg(t, 0.95 + wi * 0.09, 1.15 + wi * 0.09));
          wordEls[wi].style.opacity = wp;
          wordEls[wi].style.transform = 'translateY(' + ((1 - wp) * 6 * k).toFixed(2) + 'px)';
        }
      }

      var start = performance.now(), raf = 0;
      function loop(now) {
        var t = (typeof window.__animT === 'number') ? window.__animT : ((((now - start) / 1000) % LOOP) + LOOP) % LOOP;
        render(t);
        raf = requestAnimationFrame(loop);
      }
      render(0);
      raf = requestAnimationFrame(loop);

      return {
        destroy: function () {
          cancelAnimationFrame(raf);
          if (ro) ro.disconnect();
          host.innerHTML = '';
        }
      };
    }
  };
})();
