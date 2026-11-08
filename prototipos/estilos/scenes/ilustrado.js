/* Estilo: Ilustrado à mão (livro de histórias, aquarela/guache). Canvas 2D. */
(function () {
  window.SCENES = window.SCENES || {};
  var T = 3.6, TAU = Math.PI * 2;

  /* ---------- utilidades ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ss(a, b, t) { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutBack(t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgba(h, a) { var c = hx(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(h, f) {
    var c = hx(h), o = '#';
    for (var i = 0; i < 3; i++) {
      var v = f < 0 ? c[i] * (1 + f) : c[i] + (255 - c[i]) * f;
      v = clamp(Math.round(v), 0, 255); o += (v < 16 ? '0' : '') + v.toString(16);
    }
    return o;
  }
  function smooth(c, p) {
    var n = p.length;
    c.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2);
    for (var i = 0; i < n; i++) {
      var a = p[i], b = p[(i + 1) % n];
      c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    c.closePath();
  }
  function poly(c, p) { c.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }
  function blobPts(cx, cy, rx, ry, R, irr, n) {
    n = n || 14; irr = irr == null ? 0.14 : irr; var p = [], ph = R() * TAU, ph2 = R() * TAU;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, k = 1 + irr * (Math.sin(a * 3 + ph) * 0.6 + Math.sin(a * 5 + ph2) * 0.4) + (R() - 0.5) * irr * 0.8;
      p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return p;
  }
  /* mancha de aquarela: camadas translúcidas com tremor + borda com pigmento acumulado + sangramento */
  function wc(c, pts, col, R, o) {
    o = o || {};
    var L = o.layers || 4, j = o.jit == null ? 1.8 : o.jit, a = o.alpha || 0.3, draw = o.straight ? poly : smooth;
    for (var l = 0; l < L; l++) {
      var q = pts.map(function (p) { return [p[0] + (R() - 0.5) * 2 * j, p[1] + (R() - 0.5) * 2 * j]; });
      c.beginPath(); draw(c, q); c.fillStyle = rgba(col, a); c.fill();
    }
    if (o.mottle) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
      c.save(); c.beginPath(); draw(c, pts); c.clip();
      for (var m = 0; m < o.mottle; m++) {
        var r = (x1 - x0 + y1 - y0) * (0.05 + R() * 0.12);
        c.beginPath(); smooth(c, blobPts(lerp(x0, x1, R()), lerp(y0, y1, R()), r, r * (0.6 + R() * 0.5), R, 0.25, 10));
        c.fillStyle = R() < 0.5 ? rgba(shade(col, -0.25), 0.1) : rgba(shade(col, 0.3), 0.12); c.fill();
      }
      if (o.lightTop) {
        var g = c.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, 'rgba(255,236,190,' + o.lightTop + ')'); g.addColorStop(0.5, 'rgba(255,236,190,0)');
        c.fillStyle = g; c.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);
      }
      c.restore();
    }
    if (o.edge !== 0) {
      c.beginPath(); draw(c, pts); c.strokeStyle = rgba(shade(col, -0.4), o.edge || 0.3);
      c.lineWidth = o.lw || 1.1; c.lineJoin = 'round'; c.stroke();
    }
    if (o.bleed) {
      for (var b = 0; b < o.bleed; b++) {
        var p = pts[(R() * pts.length) | 0], rr = 1.5 + R() * 4.5;
        c.beginPath(); smooth(c, blobPts(p[0] + (R() - 0.5) * 5, p[1] + (R() - 0.5) * 5, rr, rr, R, 0.3, 8));
        c.fillStyle = rgba(col, 0.1); c.fill();
      }
    }
  }
  function hillPts(x0, x1, step, f, bottom) {
    var p = [];
    for (var x = x0; x <= x1 + 0.1; x += step) p.push([x, f(x)]);
    p.push([x1, bottom]); p.push([x0, bottom]);
    return p;
  }
  function softGlow(c, x, y, r, col, a) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function star(c, x, y, r, rot) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r;
      if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }

  /* textura de papel (gerada uma vez) */
  var PAPER = null;
  function paperTile() {
    if (PAPER) return PAPER;
    var S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    var c = cv.getContext('2d'), id = c.createImageData(S, S), d = id.data, R = rng(77);
    var low = [];
    for (var i = 0; i < 16 * 16; i++) low.push(R());
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var lx = (x / 16) | 0, ly = (y / 16) | 0, l = low[(ly % 16) * 16 + (lx % 16)];
      var v = 246 - R() * 22 - l * 8;
      var k = (y * S + x) * 4; d[k] = v + 4; d[k + 1] = v; d[k + 2] = v - 8; d[k + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    for (var f = 0; f < 140; f++) {
      c.strokeStyle = 'rgba(120,95,60,' + (0.04 + R() * 0.07) + ')'; c.lineWidth = 0.6;
      var fx = R() * S, fy = R() * S, a = R() * TAU, len = 4 + R() * 14;
      c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + Math.cos(a + 0.6) * len * 0.5, fy + Math.sin(a + 0.6) * len * 0.5, fx + Math.cos(a) * len, fy + Math.sin(a) * len); c.stroke();
    }
    PAPER = cv; return cv;
  }

  /* ---------- personagens (pintados + contorno de lápis) ---------- */
  var INK = 'rgba(78,50,32,0.82)';
  function part(c, build, fill, bb, dir, noStroke) {
    c.beginPath(); build(c); c.fillStyle = fill; c.fill();
    c.save(); c.clip();
    var g = c.createLinearGradient(dir > 0 ? bb[0] : bb[2], bb[1], dir > 0 ? bb[2] : bb[0], bb[3]);
    g.addColorStop(0, 'rgba(255,238,200,0.38)'); g.addColorStop(0.45, 'rgba(255,238,200,0)');
    g.addColorStop(0.7, 'rgba(70,35,30,0)'); g.addColorStop(1, 'rgba(70,35,30,0.28)');
    c.fillStyle = g; c.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
    c.restore();
    if (!noStroke) {
      c.beginPath(); build(c); c.strokeStyle = INK; c.lineWidth = 1.35; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
      c.save(); c.translate(0.5, 0.35); c.beginPath(); build(c); c.strokeStyle = 'rgba(78,50,32,0.18)'; c.lineWidth = 0.8; c.stroke(); c.restore();
    }
  }
  function rr(c, x, y, w, h, r) {
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function ell(c, x, y, rx, ry) { c.ellipse(x, y, rx, ry, 0, 0, TAU); }

  var SKIN = '#f1c39a', BLUE = '#3f7fc4', NAVY = '#2c4f86', ORANGE = '#ec8a34', HAIR = '#6a4127', SHOE = '#7b4a2c';

  function heroHead(c, look) {
    // pescoço + cabeça + cabelo
    part(c, function (c) { rr(c, -2.5, -78, 7, 8, 2); }, shade(SKIN, -0.08), [-3, -78, 5, -70], -1);
    part(c, function (c) { ell(c, 2, -91, 16, 15.5); }, SKIN, [-14, -107, 18, -75], -1);
    // orelha
    part(c, function (c) { ell(c, -6, -89, 3.6, 4.6); }, shade(SKIN, -0.05), [-10, -94, -2, -84], -1);
    // cabelo
    part(c, function (c) {
      c.moveTo(-14, -88); c.quadraticCurveTo(-17, -106, 0, -108.5); c.quadraticCurveTo(14, -110, 19, -97);
      c.quadraticCurveTo(13, -101, 8, -98); c.quadraticCurveTo(10, -103, 4, -101); c.quadraticCurveTo(-2, -97, -5, -99);
      c.quadraticCurveTo(-9, -93, -9, -84); c.quadraticCurveTo(-12, -84, -14, -88); c.closePath();
    }, HAIR, [-17, -110, 19, -84], -1);
    // olho, sobrancelha, sorriso, bochecha
    c.fillStyle = '#2b1d16'; c.beginPath(); ell(c, 9.5 + look, -91, 2.1, 2.8); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(10.2 + look, -92.2, 0.8, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(80,50,30,.8)'; c.lineWidth = 1.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(6.5, -97); c.quadraticCurveTo(9.5, -99, 12.5, -97.4); c.stroke();
    c.beginPath(); c.moveTo(9, -84.5); c.quadraticCurveTo(12.5, -82, 15.5, -85.5); c.stroke();
    softGlow(c, 7, -86.5, 5.5, '#ef7d72', 0.55);
  }
  function drawHero(c, x, y, t, walk, hop) {
    var ph = t * TAU * 2.2, sw = Math.sin(ph) * walk, bob = -Math.abs(Math.cos(ph)) * 2.2 * walk - hop;
    var breath = Math.sin(t * TAU / T * 2) * 0.6 * (1 - walk);
    c.save(); c.translate(x, y);
    // sombra no chão (pintada)
    c.fillStyle = 'rgba(60,70,40,0.22)'; c.beginPath(); ell(c, 4, 1, 20 - hop * 0.3, 4); c.fill();
    c.translate(0, bob);
    function leg(a, back) {
      c.save(); c.translate(0, -34); c.rotate(a);
      var col = back ? shade(SKIN, -0.14) : SKIN;
      part(c, function (c) { rr(c, -3.6, -2, 7.2, 30, 3.2); }, col, [-4, -2, 4, 28], -1);
      part(c, function (c) { c.moveTo(-5, 26); c.quadraticCurveTo(-5, 33, 2, 33.5); c.lineTo(9, 33.5); c.quadraticCurveTo(10, 28, 4, 26); c.closePath(); }, back ? shade(SHOE, -0.2) : SHOE, [-5, 26, 10, 34], -1);
      c.restore();
    }
    function arm(a, back) {
      c.save(); c.translate(1, -67 + breath); c.rotate(a);
      part(c, function (c) { rr(c, -4.5, -2, 9, 13, 4); }, back ? shade(BLUE, -0.2) : BLUE, [-5, -2, 5, 11], -1);
      part(c, function (c) { rr(c, -3.2, 9, 6.4, 13, 3); }, back ? shade(SKIN, -0.14) : SKIN, [-3, 9, 3, 22], -1);
      part(c, function (c) { c.arc(0, 23.5, 3.8, 0, TAU); }, back ? shade(SKIN, -0.14) : SKIN, [-4, 20, 4, 27], -1);
      c.restore();
    }
    leg(-sw * 0.55, true);
    arm(sw * 0.6, true);
    // mochila
    part(c, function (c) { rr(c, -23, -75 + breath, 17, 33, 6); }, ORANGE, [-23, -75, -6, -42], -1);
    part(c, function (c) { rr(c, -24, -77 + breath, 18, 11, 5); }, shade(ORANGE, -0.15), [-24, -77, -6, -66], -1);
    part(c, function (c) { rr(c, -21, -56 + breath, 11, 10, 3); }, shade(ORANGE, 0.15), [-21, -56, -10, -46], -1);
    // shorts
    part(c, function (c) { c.moveTo(-10, -44); c.lineTo(10, -44); c.lineTo(11, -30); c.lineTo(-11, -30); c.closePath(); }, NAVY, [-11, -44, 11, -30], -1);
    leg(sw * 0.55, false);
    // túnica
    part(c, function (c) {
      c.moveTo(-9, -73 + breath); c.quadraticCurveTo(1, -77 + breath, 11, -73 + breath);
      c.quadraticCurveTo(14, -55, 14, -38); c.quadraticCurveTo(1, -35, -12, -38); c.quadraticCurveTo(-12, -58, -9, -73 + breath); c.closePath();
    }, BLUE, [-12, -77, 14, -36], -1);
    // cinto e alça
    c.strokeStyle = shade(ORANGE, -0.3); c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-7, -72 + breath); c.quadraticCurveTo(0, -60, 2, -48); c.stroke();
    c.strokeStyle = '#d9b36a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-12, -43); c.quadraticCurveTo(1, -40.5, 14, -43); c.stroke();
    // gola
    c.strokeStyle = 'rgba(255,248,230,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3, -74 + breath); c.quadraticCurveTo(2, -70 + breath, 7, -74 + breath); c.stroke();
    c.save(); c.translate(0, breath); heroHead(c, walk > 0.1 ? 0 : 0.6); c.restore();
    arm(-sw * 0.6, false);
    c.restore();
  }

  var APRON = '#8a5733', SHIRT = '#d9825a', PANTS = '#6d6a7a', HAT = '#f4c23c', BEARD = '#fbf6ea';
  function drawMentor(c, x, y, t, point, wave) {
    var breath = Math.sin(t * TAU / T * 2) * 0.8;
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(60,70,40,0.22)'; c.beginPath(); ell(c, -2, 1, 26, 5); c.fill();
    c.scale(-1, 1); // olha para a esquerda (para a ponte)
    var D = 1; // luz vem da esquerda do mundo => direita local
    // pernas e botas
    part(c, function (c) { rr(c, -13, -42, 11, 38, 4); }, shade(PANTS, -0.12), [-13, -42, -2, -4], D);
    part(c, function (c) { rr(c, 2, -42, 11, 38, 4); }, PANTS, [2, -42, 13, -4], D);
    part(c, function (c) { c.moveTo(-15, -6); c.quadraticCurveTo(-15, 1, -8, 1); c.lineTo(1, 1); c.quadraticCurveTo(1, -6, -4, -7); c.closePath(); }, '#5a3a24', [-15, -7, 1, 1], D);
    part(c, function (c) { c.moveTo(1, -6); c.quadraticCurveTo(1, 1, 8, 1); c.lineTo(17, 1); c.quadraticCurveTo(17, -6, 11, -7); c.closePath(); }, '#5a3a24', [1, -7, 17, 1], D);
    // braço de trás (na cintura)
    c.save(); c.translate(-14, -88 + breath); c.rotate(0.35 + Math.sin(wave * TAU * 2) * 0.0);
    part(c, function (c) { rr(c, -5.5, -2, 11, 30, 5.5); }, shade(SHIRT, -0.18), [-6, -2, 6, 28], D);
    part(c, function (c) { c.arc(0, 29, 5, 0, TAU); }, shade(SKIN, -0.12), [-5, 24, 5, 34], D);
    c.restore();
    // corpo (camisa)
    part(c, function (c) {
      c.moveTo(-17, -90 + breath); c.quadraticCurveTo(0, -98 + breath, 17, -90 + breath);
      c.quadraticCurveTo(26, -64, 19, -40); c.quadraticCurveTo(0, -34, -19, -40); c.quadraticCurveTo(-25, -64, -17, -90 + breath); c.closePath();
    }, SHIRT, [-25, -98, 26, -36], D);
    // avental
    part(c, function (c) {
      c.moveTo(-10, -80 + breath); c.lineTo(12, -80 + breath); c.quadraticCurveTo(22, -58, 18, -32); c.quadraticCurveTo(0, -28, -17, -32); c.quadraticCurveTo(-20, -58, -10, -80 + breath); c.closePath();
    }, APRON, [-20, -80, 22, -30], D);
    part(c, function (c) { rr(c, -6, -58, 15, 11, 3); }, shade(APRON, -0.15), [-6, -58, 9, -47], D);
    // martelo no bolso
    part(c, function (c) { rr(c, 3, -70, 3.5, 16, 1.5); }, '#c9925a', [3, -70, 7, -54], D);
    part(c, function (c) { rr(c, -1, -73, 12, 5, 1.5); }, '#8f9aa6', [-1, -73, 11, -68], D);
    c.strokeStyle = 'rgba(255,240,210,.35)'; c.lineWidth = 1; c.setLineDash([2, 2]);
    c.beginPath(); c.moveTo(-14, -36); c.quadraticCurveTo(0, -32, 16, -36); c.stroke(); c.setLineDash([]);
    // cabeça
    var hy = -106 + breath;
    part(c, function (c) { ell(c, 0, hy, 17, 17); }, SKIN, [-17, hy - 17, 17, hy + 17], D);
    part(c, function (c) { ell(c, -11, hy + 1, 3.5, 5); }, shade(SKIN, -0.06), [-15, hy - 4, -7, hy + 6], D);
    // barba
    part(c, function (c) {
      c.moveTo(-13, hy + 2); c.quadraticCurveTo(-16, hy + 20, -6, hy + 28); c.quadraticCurveTo(0, hy + 34, 7, hy + 28);
      c.quadraticCurveTo(18, hy + 22, 16, hy + 3); c.quadraticCurveTo(12, hy + 10, 6, hy + 8); c.quadraticCurveTo(0, hy + 6, -4, hy + 8); c.quadraticCurveTo(-10, hy + 8, -13, hy + 2); c.closePath();
    }, BEARD, [-16, hy, 18, hy + 33], D);
    // bigode e nariz
    part(c, function (c) { c.moveTo(0, hy + 6); c.quadraticCurveTo(7, hy + 3, 13, hy + 8); c.quadraticCurveTo(7, hy + 11, 0, hy + 8); c.quadraticCurveTo(-5, hy + 10, -8, hy + 6); c.quadraticCurveTo(-4, hy + 3, 0, hy + 6); c.closePath(); }, '#f3eee2', [-8, hy + 3, 13, hy + 11], D);
    part(c, function (c) { ell(c, 9, hy + 2, 4.5, 4); }, '#eaa080', [5, hy - 2, 14, hy + 6], D);
    // olhos sorrindo
    c.strokeStyle = '#3a2618'; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(1, hy - 4); c.quadraticCurveTo(4, hy - 7.5, 7, hy - 4); c.stroke();
    c.beginPath(); c.moveTo(10.5, hy - 4.5); c.quadraticCurveTo(12.5, hy - 7.5, 14.5, hy - 4.5); c.stroke();
    c.strokeStyle = 'rgba(250,250,245,.95)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(0, hy - 10); c.quadraticCurveTo(4, hy - 12, 8, hy - 10); c.stroke();
    softGlow(c, 3, hy + 2, 5, '#ef7d72', 0.45);
    // capacete
    part(c, function (c) { c.moveTo(-17, hy - 7); c.quadraticCurveTo(-16, hy - 27, 1, hy - 27); c.quadraticCurveTo(17, hy - 27, 17, hy - 7); c.closePath(); }, HAT, [-17, hy - 27, 17, hy - 7], D);
    part(c, function (c) { rr(c, -20, hy - 9, 44, 6, 3); }, shade(HAT, -0.1), [-20, hy - 9, 24, hy - 3], D);
    c.strokeStyle = 'rgba(255,250,220,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-1, hy - 26); c.lineTo(-1, hy - 10); c.stroke();
    // braço da frente (aponta / acena)
    var a = lerp(-0.2, -2.05, point) + Math.sin(wave * TAU * 3) * 0.3 * ss(0, 0.15, wave) * (1 - ss(0.85, 1, wave));
    c.save(); c.translate(15, -86 + breath); c.rotate(a);
    part(c, function (c) { rr(c, -5.5, -2, 11, 30, 5.5); }, SHIRT, [-6, -2, 6, 28], D);
    part(c, function (c) { c.arc(0, 30, 5.2, 0, TAU); }, SKIN, [-5, 25, 5, 35], D);
    c.restore();
    c.restore();
  }

  /* ---------- montagem ---------- */
  window.SCENES['ilustrado'] = {
    mount: function (host) {
      var reduce = false;
      try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      host.style.background = '#f3e3c3';
      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      host.appendChild(canvas);
      var ctx = canvas.getContext('2d');

      /* ----- HUD ----- */
      var paperURL = '';
      try { paperURL = paperTile().toDataURL('image/png'); } catch (e) {}
      var style = document.createElement('style');
      var P = '.ilustrado-';
      style.textContent = [
        P + 'hud{position:absolute;inset:0;pointer-events:none;font-family:"Patrick Hand","Fredoka",system-ui,sans-serif;color:#4a3222;--u:1px;}',
        P + 'paper{background-color:#fbf3e0;background-image:url(' + paperURL + '),linear-gradient(170deg,#fffaf0,#f3e5c6);background-blend-mode:multiply;border:calc(var(--u)*1.6) solid rgba(96,66,42,.62);border-radius:calc(var(--u)*16) calc(var(--u)*7) calc(var(--u)*15) calc(var(--u)*8)/calc(var(--u)*8) calc(var(--u)*15) calc(var(--u)*7) calc(var(--u)*14);box-shadow:0 calc(var(--u)*1.5) 0 rgba(255,255,255,.5) inset,0 calc(var(--u)*3) calc(var(--u)*1) rgba(110,80,50,.18),0 calc(var(--u)*8) calc(var(--u)*16) rgba(70,45,25,.28);}',
        P + 'top{position:absolute;left:calc(var(--u)*12);right:calc(var(--u)*12);top:calc(env(safe-area-inset-top,0px) + 36px);display:flex;gap:calc(var(--u)*10);align-items:center;}',
        P + 'ava{flex:none;width:calc(var(--u)*62);height:calc(var(--u)*62);border-radius:50%;padding:calc(var(--u)*3);transform:rotate(-3deg);}',
        P + 'ava canvas{width:100%;height:100%;border-radius:50%;display:block;border:calc(var(--u)*1.5) solid rgba(96,66,42,.5);}',
        P + 'lvl{flex:1;min-width:0;padding:calc(var(--u)*7) calc(var(--u)*12) calc(var(--u)*9);transform:rotate(.6deg);}',
        P + 'lvl .t{font-size:calc(var(--u)*21);line-height:1;white-space:nowrap;display:flex;justify-content:space-between;align-items:baseline;gap:calc(var(--u)*6);}',
        P + 'lvl .t small{font-size:calc(var(--u)*15);color:#7a5a3e;}',
        P + 'bar{margin-top:calc(var(--u)*6);height:calc(var(--u)*13);border:calc(var(--u)*1.5) solid rgba(96,66,42,.7);border-radius:calc(var(--u)*9) calc(var(--u)*5) calc(var(--u)*8) calc(var(--u)*6);background:rgba(120,90,60,.12);overflow:hidden;position:relative;}',
        P + 'bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(180deg,#ffd77a,#f0a640 60%,#e08a2c);border-right:calc(var(--u)*1.5) solid rgba(160,90,30,.6);border-radius:0 calc(var(--u)*6) calc(var(--u)*6) 0;box-shadow:inset 0 calc(var(--u)*2) 0 rgba(255,250,220,.6);}',
        P + 'bar b{position:absolute;inset:0;background-image:url(' + paperURL + ');mix-blend-mode:multiply;opacity:.6;}',
        P + 'mis{position:absolute;left:calc(var(--u)*20);top:calc(env(safe-area-inset-top,0px) + 36px + var(--u)*74);display:flex;align-items:center;gap:calc(var(--u)*8);padding:calc(var(--u)*6) calc(var(--u)*13) calc(var(--u)*6) calc(var(--u)*8);transform:rotate(-1.4deg);font-size:calc(var(--u)*17);line-height:1.05;max-width:calc(100% - var(--u)*40);}',
        P + 'mis svg{flex:none;width:calc(var(--u)*30);height:calc(var(--u)*30);}',
        P + 'mis em{font-style:normal;color:#b0562a;}',
        P + 'pin{position:absolute;top:calc(var(--u)*-6);left:50%;width:calc(var(--u)*34);height:calc(var(--u)*12);transform:translateX(-50%) rotate(3deg);background:rgba(236,214,160,.75);border-left:1px dashed rgba(150,120,70,.4);border-right:1px dashed rgba(150,120,70,.4);}',
        P + 'bub{position:absolute;width:calc(var(--u)*214);padding:calc(var(--u)*16) calc(var(--u)*14) calc(var(--u)*12);font-size:calc(var(--u)*19);line-height:1.12;transform-origin:85% 100%;opacity:0;}',
        P + 'bub .nm{position:absolute;top:calc(var(--u)*-14);left:calc(var(--u)*12);font-size:calc(var(--u)*15);padding:calc(var(--u)*2) calc(var(--u)*10) calc(var(--u)*1);background:#b0562a;color:#fff6e4;border-radius:calc(var(--u)*7) calc(var(--u)*3) calc(var(--u)*8) calc(var(--u)*3);transform:rotate(-3deg);box-shadow:0 calc(var(--u)*2) calc(var(--u)*4) rgba(70,40,20,.3);letter-spacing:.02em;}',
        P + 'bub .tail{position:absolute;bottom:calc(var(--u)*-15);right:calc(var(--u)*34);width:calc(var(--u)*22);height:calc(var(--u)*18);}',
        P + 'xp{position:absolute;font-size:calc(var(--u)*30);color:#d9821f;opacity:0;white-space:nowrap;text-shadow:0 0 calc(var(--u)*2) #fff8e6,0 calc(var(--u)*2) 0 #fff3d6,0 0 calc(var(--u)*10) rgba(255,220,140,.9);-webkit-text-stroke:calc(var(--u)*.6) rgba(120,60,20,.6);}',
        P + 'btns{position:absolute;left:calc(var(--u)*12);right:calc(var(--u)*12);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;gap:calc(var(--u)*10);}',
        P + 'btn{flex:1;height:calc(var(--u)*80);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*2);font-size:calc(var(--u)*20);line-height:1;}',
        P + 'btn svg{width:calc(var(--u)*36);height:calc(var(--u)*36);}',
        P + 'btn.main{background-color:#fde3b8;}',
        P + 'wash{position:absolute;inset:0;background-color:#f6ead2;background-image:url(' + paperURL + ');background-blend-mode:multiply;opacity:0;}'
      ].join('\n');
      host.appendChild(style);

      var INKS = 'stroke="#5a3a24" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
      var ICON_BRIDGE = '<svg viewBox="0 0 32 32"><path d="M3 20 Q16 10 29 20" fill="none" ' + INKS + '/><path d="M2 21 Q16 12 30 21 L30 24 Q16 15 2 24Z" fill="#c98a52" ' + INKS + '/><path d="M8 18v-6M16 15v-6M24 18v-6M5 13 Q16 4 27 13" fill="none" ' + INKS + '/><path d="M1 27 Q8 25 16 27 T31 27" fill="none" stroke="#6aa6c8" stroke-width="2" stroke-linecap="round"/></svg>';
      var ICON_HAMMER = '<svg viewBox="0 0 36 36"><rect x="16" y="12" width="5" height="21" rx="2" transform="rotate(-35 18 22)" fill="#d39a5e" ' + INKS + '/><path d="M7 9 L20 4 L25 9 L22 13 L18 11 L10 15Z" fill="#9aa6b2" ' + INKS + '/><circle cx="28" cy="27" r="2" fill="#f4c23c"/><path d="M30 6l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#f4c23c"/></svg>';
      var ICON_BAG = '<svg viewBox="0 0 36 36"><path d="M13 9 Q18 3 23 9" fill="none" ' + INKS + '/><rect x="7" y="9" width="22" height="23" rx="7" fill="#ec8a34" ' + INKS + '/><path d="M7 16 Q18 21 29 16" fill="none" ' + INKS + '/><rect x="12" y="21" width="12" height="8" rx="3" fill="#f6b56c" ' + INKS + '/></svg>';
      var ICON_MAP = '<svg viewBox="0 0 36 36"><path d="M4 9 L13 5 L23 9 L32 5 L32 27 L23 31 L13 27 L4 31Z" fill="#f2deb0" ' + INKS + '/><path d="M13 5v22M23 9v22" fill="none" stroke="#5a3a24" stroke-width="1" opacity=".5"/><path d="M8 22 Q13 14 18 19 T27 13" fill="none" stroke="#b0562a" stroke-width="1.6" stroke-dasharray="2 2.4" stroke-linecap="round"/><path d="M25 10l4 4M29 10l-4 4" ' + INKS + ' stroke="#b0562a"/></svg>';
      var TAIL = '<svg viewBox="0 0 22 18"><path d="M1 0 Q8 6 17 17 Q14 7 21 0Z" fill="#f8eed8" stroke="rgba(96,66,42,.62)" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 1.2 H22" stroke="#f8eed8" stroke-width="3"/></svg>';

      var hud = document.createElement('div'); hud.className = 'ilustrado-hud';
      hud.innerHTML =
        '<div class="ilustrado-top">' +
          '<div class="ilustrado-ava ilustrado-paper"><canvas width="128" height="128"></canvas></div>' +
          '<div class="ilustrado-lvl ilustrado-paper"><div class="t"><span>Nível 4 · Explorador</span><small class="ilustrado-xpt">620/1000</small></div>' +
          '<div class="ilustrado-bar"><i style="width:62%"></i><b></b></div></div>' +
        '</div>' +
        '<div class="ilustrado-mis ilustrado-paper"><span class="ilustrado-pin"></span>' + ICON_BRIDGE + '<span><em>Missão:</em> consertar a ponte da vila</span></div>' +
        '<div class="ilustrado-bub ilustrado-paper"><span class="nm">Mestre Tomé</span>A viga precisa se apoiar dos dois lados!<span class="tail">' + TAIL + '</span></div>' +
        '<div class="ilustrado-xp">+50 XP</div>' +
        '<div class="ilustrado-wash"></div>' +
        '<div class="ilustrado-btns">' +
          '<div class="ilustrado-btn ilustrado-paper main" style="transform:rotate(-1.2deg)">' + ICON_HAMMER + 'Construir</div>' +
          '<div class="ilustrado-btn ilustrado-paper" style="transform:rotate(.8deg)">' + ICON_BAG + 'Mochila</div>' +
          '<div class="ilustrado-btn ilustrado-paper" style="transform:rotate(-.5deg)">' + ICON_MAP + 'Mapa</div>' +
        '</div>';
      host.appendChild(hud);
      var q = function (s) { return hud.querySelector(s); };
      var elBar = q('.ilustrado-bar i'), elXpt = q('.ilustrado-xpt'), elBub = q('.ilustrado-bub'), elXp = q('.ilustrado-xp'), elWash = q('.ilustrado-wash');
      // move a "lavagem" para baixo do HUD (mas sobre o canvas)
      host.insertBefore(elWash, hud);
      elWash.style.pointerEvents = 'none';

      // avatar pintado
      (function () {
        var av = q('.ilustrado-ava canvas'), a = av.getContext('2d');
        var g = a.createRadialGradient(50, 40, 10, 64, 64, 80); g.addColorStop(0, '#fbe6b8'); g.addColorStop(1, '#a9c9de');
        a.fillStyle = g; a.fillRect(0, 0, 128, 128);
        a.save(); a.translate(60, 250); a.scale(2.05, 2.05); drawHero(a, 0, 0, 0.3, 0, 0); a.restore();
        a.globalCompositeOperation = 'multiply'; a.globalAlpha = 0.5; a.drawImage(paperTile(), 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = 'source-over';
      })();

      /* ----- camadas pré-pintadas ----- */
      var W = 0, H = 0, s = 1, k = 1, Hd = 844, G = 553, Hy = 380, M = 30, LW = 390 + 60;
      var layers = {}, grade = null, glow = null, river = null;

      function mk(w, h) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k)); var c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); return { cv: cv, c: c }; }
      function archY(x) { return G - 13 * Math.sin(Math.PI * clamp((x - 112) / 186, 0, 1)); }
      var GAP0 = 192, GAP1 = 218;

      function riverPts() {
        var L = [[190, G - 66], [184, G - 52], [168, G - 30], [150, G], [130, G + 90], [104, Hd + 6]];
        var Rr = [[204, G - 66], [214, G - 52], [234, G - 30], [262, G], [292, G + 90], [346, Hd + 6]];
        return L.concat(Rr.reverse());
      }
      function tree(c, R, x, y, h, w, hue) {
        // tronco
        wc(c, [[x - 5, y], [x - 3, y - h * 0.45], [x - 9, y - h * 0.62], [x - 2, y - h * 0.55], [x + 1, y - h * 0.7], [x + 3, y - h * 0.5], [x + 6, y]], '#7a5236', R, { straight: true, layers: 3, alpha: 0.5, jit: 0.8 });
        var greens = hue || ['#5f8f45', '#77a44f', '#9cba5a', '#4f7a3f'];
        var cy = y - h * 0.68;
        for (var i = 0; i < 26; i++) {
          var a = R() * TAU, d = Math.sqrt(R());
          var bx = x + Math.cos(a) * w * 0.42 * d, by = cy + Math.sin(a) * h * 0.3 * d, r = w * (0.16 + R() * 0.12);
          var lit = (bx < x ? 0.3 : 0) + (by < cy ? 0.3 : 0) + R() * 0.3;
          var col = greens[lit > 0.55 ? 2 : lit > 0.3 ? 1 : (R() < 0.5 ? 0 : 3)];
          wc(c, blobPts(bx, by, r, r * 0.85, R, 0.2, 11), col, R, { layers: 2, alpha: 0.42, jit: 1.5, edge: 0.18 });
        }
        // brilho quente do fim de tarde
        for (var j = 0; j < 7; j++) {
          var ax = x - w * 0.25 + (R() - 0.5) * w * 0.35, ay = cy - h * 0.18 + (R() - 0.5) * h * 0.18, r2 = w * (0.08 + R() * 0.08);
          wc(c, blobPts(ax, ay, r2, r2 * 0.8, R, 0.2, 9), '#e2d47a', R, { layers: 2, alpha: 0.35, jit: 1, edge: 0 });
        }
      }
      function bridge(c, R, withGapEdges) {
        var x0 = 112, x1 = 298;
        // arcos de apoio por baixo
        c.strokeStyle = '#6b4329'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(122, G + 22); c.quadraticCurveTo(205, G - 6, 288, G + 22); c.stroke();
        c.lineWidth = 2.4; c.strokeStyle = '#7d5133';
        [140, 165, 245, 270].forEach(function (px) { c.beginPath(); c.moveTo(px, archY(px) + 14); c.lineTo(px + (px < 205 ? -4 : 4), G + 30); c.stroke(); });
        // corrimão de trás
        c.strokeStyle = '#9b6b45'; c.lineWidth = 2.6;
        for (var px = 116; px <= 296; px += 30) { c.beginPath(); c.moveTo(px, archY(px) - 10); c.lineTo(px, archY(px) - 34); c.stroke(); }
        c.beginPath(); for (var x = 114; x <= 296; x += 4) { var yy = archY(x) - 33; if (x === 114) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke();
        // tábuas do deck
        var cols = ['#b07a4b', '#a46f42', '#bb8655', '#9c683e'];
        for (var i = 0, xx = x0; xx < x1 - 1; i++) {
          var w = 12.4;
          if (xx >= GAP0 - 0.5 && xx < GAP1) { xx = GAP1; continue; }
          var xa = xx, xb = Math.min(xx + w, x1);
          if (xa < GAP0 && xb > GAP0) xb = GAP0;
          var pts = [[xa + 0.6, archY(xa) - 11], [xb - 0.6, archY(xb) - 11], [xb - 0.6, archY(xb) + 9], [xa + 0.6, archY(xa) + 9]];
          wc(c, pts, cols[i % 4], R, { straight: true, layers: 2, alpha: 0.75, jit: 0.4, edge: 0.55, lw: 0.9 });
          c.strokeStyle = 'rgba(90,55,30,.25)'; c.lineWidth = 0.6; c.beginPath();
          c.moveTo(xa + 3, archY(xa) - 6); c.lineTo(xa + 3 + (R() - 0.5) * 3, archY(xa) + 6); c.stroke();
          xx = xb;
        }
        // viga lateral da frente
        function beam(xa, xb) {
          var pts = []; for (var x = xa; x <= xb + 0.01; x += (xb - xa) / 8) pts.push([x, archY(x) + 8]);
          for (x = xb; x >= xa - 0.01; x -= (xb - xa) / 8) pts.push([x, archY(x) + 17]);
          wc(c, pts, '#7a4d2e', R, { straight: true, layers: 2, alpha: 0.8, jit: 0.3, edge: 0.6 });
        }
        beam(x0, GAP0); beam(GAP1, x1);
        if (withGapEdges) {
          // pontas lascadas do vão
          c.strokeStyle = 'rgba(70,40,20,.8)'; c.lineWidth = 1.2; c.beginPath();
          c.moveTo(GAP0, archY(GAP0) - 11); c.lineTo(GAP0 - 2, archY(GAP0) - 3); c.lineTo(GAP0 + 1, archY(GAP0) + 4); c.lineTo(GAP0 - 1, archY(GAP0) + 17);
          c.moveTo(GAP1, archY(GAP1) - 11); c.lineTo(GAP1 + 2, archY(GAP1) - 2); c.lineTo(GAP1 - 1, archY(GAP1) + 6); c.lineTo(GAP1 + 1, archY(GAP1) + 17); c.stroke();
        }
        // corrimão da frente (evitando o centro)
        c.strokeStyle = '#7d5133'; c.lineWidth = 3.2;
        [114, 150, 260, 296].forEach(function (px) { c.beginPath(); c.moveTo(px, archY(px) + 12); c.lineTo(px, archY(px) - 24); c.stroke(); });
        c.lineWidth = 2.8; c.beginPath(); for (var x2 = 112; x2 <= 298; x2 += 4) { var y2 = archY(x2) - 23; if (x2 === 112) c.moveTo(x2, y2); else c.lineTo(x2, y2); } c.stroke();
        c.strokeStyle = 'rgba(255,225,170,.45)'; c.lineWidth = 1; c.beginPath(); for (x2 = 112; x2 <= 298; x2 += 4) { y2 = archY(x2) - 24.2; if (x2 === 112) c.moveTo(x2, y2); else c.lineTo(x2, y2); } c.stroke();
      }
      function piece(c, x, y, rot) {
        // a viga nova (deck + viga lateral), madeira clara
        c.save(); c.translate(x, y); c.rotate(rot);
        var w = GAP1 - GAP0;
        c.fillStyle = '#d8a46a'; c.beginPath(); rr(c, -w / 2, -11, w, 20, 1.5); c.fill();
        c.fillStyle = '#c38e58'; c.fillRect(-w / 2 + w / 2 - 0.4, -11, 0.9, 20);
        c.fillStyle = '#9a6238'; c.beginPath(); rr(c, -w / 2, 8, w, 9, 1.5); c.fill();
        c.strokeStyle = 'rgba(255,240,200,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-w / 2 + 2, -9); c.lineTo(w / 2 - 2, -9); c.stroke();
        c.strokeStyle = 'rgba(120,70,35,.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-w / 2 + 4, -4); c.quadraticCurveTo(0, -1, w / 2 - 4, -5); c.moveTo(-w / 2 + 3, 3); c.quadraticCurveTo(0, 5, w / 2 - 5, 2); c.stroke();
        c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); rr(c, -w / 2, -11, w, 28, 1.5); c.stroke();
        c.beginPath(); c.moveTo(-w / 2, 8); c.lineTo(w / 2, 8); c.stroke();
        c.restore();
      }

      function paint() {
        var R = rng(2024), L, c, i;
        Hy = G - 175;
        // ---- L0 céu ----
        L = mk(LW, Hd); c = L.c; c.translate(M, 0);
        var g = c.createLinearGradient(0, 0, 0, Hd);
        g.addColorStop(0, '#6c9fd0'); g.addColorStop(0.24, '#93bde0'); g.addColorStop(Hy / Hd * 0.82, '#f2d5ab');
        g.addColorStop(Hy / Hd, '#f9dfb2'); g.addColorStop(1, '#f2dcb4');
        c.fillStyle = g; c.fillRect(-M, 0, LW, Hd);
        for (i = 0; i < 14; i++) {
          var yy = R() * Hy, col = yy < Hy * 0.45 ? '#6f9cc8' : (R() < 0.5 ? '#f5c79a' : '#f0b9a0');
          wc(c, blobPts(R() * 420 - 20, yy, 70 + R() * 90, 10 + R() * 14, R, 0.25, 12), col, R, { layers: 2, alpha: 0.14, jit: 4, edge: 0 });
        }
        softGlow(c, 70, Hy - 70, 210, '#fff0c4', 0.85);
        softGlow(c, 70, Hy - 70, 70, '#fff6d0', 0.95);
        wc(c, blobPts(70, Hy - 70, 24, 24, R, 0.05, 16), '#ffe7a0', R, { layers: 4, alpha: 0.55, jit: 1, edge: 0.2 });
        wc(c, blobPts(66, Hy - 74, 13, 13, R, 0.05, 12), '#fffbe6', R, { layers: 2, alpha: 0.6, jit: 1, edge: 0 });
        function cloud(cx, cy, sc) {
          for (var j = 0; j < 9; j++) {
            var bx = cx + (R() - 0.5) * 90 * sc, by = cy + (R() - 0.6) * 20 * sc, r = (16 + R() * 18) * sc;
            wc(c, blobPts(bx, by + 6 * sc, r * 1.05, r * 0.8, R, 0.18, 12), '#e9b9a6', R, { layers: 2, alpha: 0.18, jit: 2, edge: 0 });
            wc(c, blobPts(bx - 2, by, r, r * 0.78, R, 0.18, 12), '#fffaf0', R, { layers: 2, alpha: 0.42, jit: 2, edge: 0.06 });
          }
        }
        cloud(300, Hy - 150, 1.0); cloud(120, Hy - 230, 0.8); cloud(250, Hy - 260, 0.65); cloud(355, Hy - 60, 0.6); cloud(30, Hy - 130, 0.55);
        layers.sky = L.cv;
        // ---- L1 longe: montes e castelo ----
        L = mk(LW, Hd); c = L.c; c.translate(M, 0);
        wc(c, hillPts(-M, 390 + M, 10, function (x) { return Hy - 30 - 26 * Math.sin(x / 70 + 1) - 12 * Math.sin(x / 23); }, Hd), '#b8c0d6', R, { layers: 3, alpha: 0.35, jit: 2, edge: 0.15, mottle: 8 });
        var castleBase = Hy - 46;
        wc(c, hillPts(-M, 390 + M, 10, function (x) { return Hy - 8 - 34 * Math.exp(-Math.pow((x - 300) / 70, 2)) - 6 * Math.sin(x / 31); }, Hd), '#9fb0c4', R, { layers: 3, alpha: 0.42, jit: 2, edge: 0.18, mottle: 8 });
        // castelo (aquarela azulada, atmosférica)
        var cx0 = 300, cb = Hy - 38;
        var stone = '#a7a6c0';
        wc(c, [[cx0 - 26, cb], [cx0 - 26, cb - 28], [cx0 + 26, cb - 28], [cx0 + 26, cb]], stone, R, { straight: true, layers: 3, alpha: 0.45, jit: 0.6, edge: 0.3 });
        for (i = 0; i < 6; i++) { var bx2 = cx0 - 24 + i * 9; wc(c, [[bx2, cb - 28], [bx2, cb - 33], [bx2 + 5, cb - 33], [bx2 + 5, cb - 28]], stone, R, { straight: true, layers: 2, alpha: 0.45, jit: 0.3, edge: 0.25 }); }
        [[cx0 - 30, 46, 9], [cx0 + 30, 40, 8], [cx0 + 4, 62, 8]].forEach(function (tw) {
          var tx = tw[0], th = tw[1], hw = tw[2];
          wc(c, [[tx - hw, cb], [tx - hw, cb - th], [tx + hw, cb - th], [tx + hw, cb]], tw[1] > 50 ? '#b3b0c9' : stone, R, { straight: true, layers: 3, alpha: 0.5, jit: 0.5, edge: 0.3 });
          wc(c, [[tx - hw - 3, cb - th], [tx, cb - th - hw * 2.3], [tx + hw + 3, cb - th]], '#c98a8e', R, { straight: true, layers: 3, alpha: 0.55, jit: 0.4, edge: 0.3 });
          c.fillStyle = 'rgba(90,85,120,.45)'; c.beginPath(); rr(c, tx - 1.5, cb - th + 10, 3, 6, 1.5); c.fill();
        });
        c.strokeStyle = 'rgba(100,90,120,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx0 + 4, cb - 62 - 18); c.lineTo(cx0 + 4, cb - 62 - 28); c.stroke();
        c.fillStyle = 'rgba(214,120,90,.75)'; c.beginPath(); c.moveTo(cx0 + 4, cb - 89); c.lineTo(cx0 + 13, cb - 86); c.lineTo(cx0 + 4, cb - 83); c.fill();
        c.fillStyle = 'rgba(255,220,150,.5)'; c.beginPath(); rr(c, cx0 - 4, cb - 14, 8, 14, 4); c.fill();
        // névoa quente no pé
        var gm = c.createLinearGradient(0, Hy - 50, 0, Hy + 30); gm.addColorStop(0, 'rgba(250,225,185,0)'); gm.addColorStop(0.55, 'rgba(250,225,185,.5)'); gm.addColorStop(1, 'rgba(250,225,185,0)');
        c.fillStyle = gm; c.fillRect(-M, Hy - 50, LW, 80);
        layers.far = L.cv;
        // ---- L2 meio: colinas verdes, árvores pequenas ----
        L = mk(LW, Hd); c = L.c; c.translate(M, 0);
        wc(c, hillPts(-M, 390 + M, 8, function (x) { return Hy + 4 - 18 * Math.sin(x / 55 + 2) - 8 * Math.sin(x / 19); }, Hd), '#9dba6a', R, { layers: 3, alpha: 0.42, jit: 2, edge: 0.2, mottle: 14, lightTop: 0.5 });
        // campos
        for (i = 0; i < 5; i++) {
          var fx = R() * 390, fy = Hy + 18 + R() * 30;
          wc(c, [[fx - 30, fy], [fx + 26, fy - 6], [fx + 34, fy + 6], [fx - 22, fy + 12]], R() < 0.5 ? '#d8cf7d' : '#a7c46e', R, { straight: true, layers: 2, alpha: 0.35, jit: 1.5, edge: 0.1 });
        }
        for (i = 0; i < 14; i++) {
          var tx2 = R() * 420 - 15, ty2 = Hy + 14 + R() * 26;
          if (tx2 > 160 && tx2 < 230) continue;
          var tr = 6 + R() * 6;
          wc(c, blobPts(tx2, ty2 - tr, tr * 0.8, tr, R, 0.15, 10), R() < 0.5 ? '#6d9a4c' : '#5c8a46', R, { layers: 2, alpha: 0.6, jit: 0.8, edge: 0.25 });
          wc(c, blobPts(tx2 - tr * 0.3, ty2 - tr * 1.3, tr * 0.35, tr * 0.35, R, 0.2, 8), '#d3d57e', R, { layers: 1, alpha: 0.5, jit: 0.5, edge: 0 });
        }
        wc(c, hillPts(-M, 390 + M, 8, function (x) { return G - 70 - 14 * Math.sin(x / 40) - 10 * Math.cos(x / 23 + 1); }, Hd), '#86ac5c', R, { layers: 3, alpha: 0.45, jit: 2, edge: 0.2, mottle: 12, lightTop: 0.45 });
        layers.mid = L.cv;
        // ---- L3 perto: margens, riacho, casa, ponte, árvore ----
        L = mk(LW, Hd); c = L.c; c.translate(M, 0);
        wc(c, hillPts(-M, 390 + M, 8, function (x) { return G - 46 - 8 * Math.sin(x / 30 + 0.5); }, Hd), '#7ea656', R, { layers: 4, alpha: 0.42, jit: 2, edge: 0.2, mottle: 30, lightTop: 0.35 });
        // pinceladas de grama
        for (i = 0; i < 260; i++) {
          var gx = R() * 450 - 30, gy = G - 40 + R() * (Hd - G + 40);
          c.strokeStyle = rgba(R() < 0.5 ? '#5c8a40' : '#b6c96a', 0.25 + R() * 0.25); c.lineWidth = 0.9 + R();
          c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + 1, gy - 4, gx + (R() - 0.3) * 5, gy - 6 - R() * 6); c.stroke();
        }
        // riacho
        var rp = riverPts();
        river = rp;
        c.save(); c.beginPath(); smooth(c, rp); c.clip();
        var gw = c.createLinearGradient(0, G - 66, 0, Hd); gw.addColorStop(0, '#e9dcbc'); gw.addColorStop(0.12, '#a9cbd6'); gw.addColorStop(0.55, '#6fa5bf'); gw.addColorStop(1, '#4f88a8');
        c.fillStyle = gw; c.fillRect(80, Hy, 280, Hd - Hy + 10);
        for (i = 0; i < 18; i++) {
          var wy = Hy + 20 + R() * (Hd - Hy);
          wc(c, blobPts(160 + R() * 140, wy, 30 + R() * 40, 4 + R() * 6, R, 0.3, 10), R() < 0.5 ? '#3f7898' : '#cfe4e6', R, { layers: 2, alpha: 0.16, jit: 2, edge: 0 });
        }
        // reflexo das margens e do céu quente
        softGlow(c, 205, G + 120, 90, '#fde3b4', 0.35);
        // reflexo da ponte (invertido)
        c.save(); c.globalAlpha = 0.28; c.translate(0, 2 * (G + 18)); c.scale(1, -1); bridge(c, rng(5), false); c.restore();
        // sombra sob a ponte
        c.fillStyle = 'rgba(30,50,70,.22)'; c.beginPath(); ell(c, 205, G + 26, 70, 9); c.fill();
        c.restore();
        // margem: borda de terra com pigmento
        c.beginPath(); smooth(c, rp); c.strokeStyle = 'rgba(110,85,50,.45)'; c.lineWidth = 2.2; c.stroke();
        for (i = 0; i < 40; i++) {
          var p = rp[(R() * rp.length) | 0];
          var t2 = R(), a0 = rp[2], b0 = rp[3];
          var ex = lerp(rp[2][0], rp[5][0], t2), ey = lerp(rp[2][1], rp[5][1], t2);
          if (R() < 0.5) { ex = lerp(rp[9][0], rp[6][0], t2); ey = lerp(rp[9][1], rp[6][1], t2); }
          wc(c, blobPts(ex, ey, 3 + R() * 4, 2 + R() * 2, R, 0.3, 8), R() < 0.5 ? '#a08a62' : '#8c9b70', R, { layers: 1, alpha: 0.45, jit: 0.4, edge: 0.2 });
        }
        // moitas onde o riacho nasce
        for (i = 0; i < 12; i++) { var mbx = 172 + R() * 52, mby = G - 64 + R() * 10, mr = 7 + R() * 7; wc(c, blobPts(mbx, mby, mr * 1.2, mr * 0.8, R, 0.2, 10), R() < 0.5 ? '#6b9a4b' : '#8db35a', R, { layers: 2, alpha: 0.6, jit: 0.8, edge: 0.22 }); }
        // caminho de terra até a ponte
        wc(c, [[-30, G + 70], [20, G + 30], [70, G + 18], [118, G + 8], [122, G + 26], [80, G + 38], [30, G + 60], [-30, G + 110]], '#d9b98a', R, { layers: 3, alpha: 0.4, jit: 2, edge: 0.18, mottle: 6 });
        wc(c, [[262, G + 6], [300, G + 10], [360, G + 22], [420, G + 30], [420, G + 52], [350, G + 44], [290, G + 30], [258, G + 22]], '#d9b98a', R, { layers: 3, alpha: 0.4, jit: 2, edge: 0.18, mottle: 6 });
        // casinha
        var hx0 = 6, hx1 = 104, hb = G - 4, ht = G - 92;
        wc(c, blobPts(55, hb + 2, 62, 8, R, 0.1, 12), '#4f6d3a', R, { layers: 2, alpha: 0.25, jit: 2, edge: 0 });
        wc(c, [[hx0, hb], [hx0, ht], [hx1, ht], [hx1, hb]], '#f1e2c4', R, { straight: true, layers: 3, alpha: 0.7, jit: 0.6, edge: 0.45, mottle: 6 });
        // vigas enxaimel
        c.strokeStyle = 'rgba(120,80,50,.75)'; c.lineWidth = 3;
        [[hx0 + 2, ht + 20, hx1 - 2, ht + 20], [hx0 + 34, ht, hx0 + 34, hb], [hx1 - 30, ht, hx1 - 30, hb], [hx0 + 2, ht + 2, hx0 + 32, ht + 20], [hx1 - 2, ht + 2, hx1 - 28, ht + 20]].forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
        // telhado
        wc(c, [[hx0 - 12, ht + 4], [hx0 + 18, ht - 46], [hx1 - 16, ht - 46], [hx1 + 12, ht + 4]], '#c4623f', R, { straight: true, layers: 4, alpha: 0.5, jit: 0.8, edge: 0.45, mottle: 8, lightTop: 0.4 });
        c.strokeStyle = 'rgba(120,50,30,.35)'; c.lineWidth = 1;
        for (i = 1; i < 5; i++) { var ry2 = ht + 4 - i * 10; c.beginPath(); c.moveTo(hx0 - 12 + i * 6, ry2); c.lineTo(hx1 + 12 - i * 6, ry2); c.stroke(); }
        // chaminé
        wc(c, [[hx1 - 30, ht - 30], [hx1 - 30, ht - 58], [hx1 - 18, ht - 58], [hx1 - 18, ht - 22]], '#a35d45', R, { straight: true, layers: 3, alpha: 0.65, jit: 0.4, edge: 0.4 });
        // porta e janela com luz
        wc(c, [[hx0 + 40, hb], [hx0 + 40, hb - 38], [hx0 + 47, hb - 44], [hx0 + 56, hb - 38], [hx0 + 56, hb]], '#4f7f8c', R, { straight: true, layers: 3, alpha: 0.75, jit: 0.3, edge: 0.5 });
        c.fillStyle = '#f2c23c'; c.beginPath(); c.arc(hx0 + 52, hb - 18, 1.6, 0, TAU); c.fill();
        softGlow(c, hx0 + 18, ht + 44, 22, '#ffd27a', 0.6);
        wc(c, [[hx0 + 9, ht + 34], [hx0 + 27, ht + 34], [hx0 + 27, ht + 54], [hx0 + 9, ht + 54]], '#ffd77e', R, { straight: true, layers: 2, alpha: 0.8, jit: 0.3, edge: 0.5 });
        c.strokeStyle = 'rgba(110,70,45,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx0 + 18, ht + 34); c.lineTo(hx0 + 18, ht + 54); c.moveTo(hx0 + 9, ht + 44); c.lineTo(hx0 + 27, ht + 44); c.stroke();
        wc(c, [[hx1 - 24, ht + 34], [hx1 - 8, ht + 34], [hx1 - 8, ht + 52], [hx1 - 24, ht + 52]], '#ffd77e', R, { straight: true, layers: 2, alpha: 0.8, jit: 0.3, edge: 0.5 });
        // flores na janela
        for (i = 0; i < 6; i++) wc(c, blobPts(hx1 - 24 + i * 3.2, ht + 54, 2.4, 2.2, R, 0.2, 7), ['#e86a6a', '#f4b2c0', '#f2d24a'][i % 3], R, { layers: 1, alpha: 0.9, jit: 0.2, edge: 0.3 });
        // cerquinha
        c.strokeStyle = 'rgba(140,100,65,.85)'; c.lineWidth = 2.2;
        for (i = 0; i < 4; i++) { var fx2 = hx1 + 6 + i * 9; c.beginPath(); c.moveTo(fx2, G + 4); c.lineTo(fx2, G - 16); c.stroke(); }
        c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx1 + 3, G - 11); c.lineTo(hx1 + 35, G - 9); c.moveTo(hx1 + 3, G - 3); c.lineTo(hx1 + 35, G - 1); c.stroke();
        // árvore grande à direita
        tree(c, R, 372, G + 2, 240, 120);
        // arbusto atrás do mentor
        for (i = 0; i < 8; i++) wc(c, blobPts(300 + R() * 60, G - 6 + R() * 8, 12 + R() * 8, 10, R, 0.2, 10), R() < 0.5 ? '#6b9a4b' : '#90b25a', R, { layers: 2, alpha: 0.5, jit: 1, edge: 0.2 });
        // pedras da cabeceira
        [[110, G + 14], [120, G + 20], [296, G + 16], [306, G + 22]].forEach(function (s2) { wc(c, blobPts(s2[0], s2[1], 9, 6, R, 0.2, 9), '#a6a29a', R, { layers: 2, alpha: 0.75, jit: 0.4, edge: 0.4, mottle: 2 }); });
        bridge(c, R, true);
        layers.near = L.cv;
        // ---- L4 frente ----
        L = mk(LW, Hd); c = L.c; c.translate(M, 0);
        var fb = Hd;
        wc(c, hillPts(-M, 130, 8, function (x) { return G + 150 + Math.pow((x + 30) / 160, 2) * 70 + 6 * Math.sin(x / 13); }, fb + 5), '#6f9b4c', R, { layers: 3, alpha: 0.55, jit: 2, edge: 0.2, mottle: 10, lightTop: 0.35 });
        wc(c, hillPts(280, 390 + M, 8, function (x) { return G + 190 - Math.pow((x - 280) / 140, 2) * 60 + 6 * Math.sin(x / 11); }, fb + 5), '#6f9b4c', R, { layers: 3, alpha: 0.55, jit: 2, edge: 0.2, mottle: 10, lightTop: 0.35 });
        // juncos
        function reed(x, y, h, bend) {
          c.strokeStyle = rgba(R() < 0.5 ? '#557f3c' : '#6d9346', 0.85); c.lineWidth = 1.6 + R(); c.lineCap = 'round';
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + bend * 0.3, y - h * 0.6, x + bend, y - h); c.stroke();
        }
        for (i = 0; i < 14; i++) reed(118 + R() * 30, G + 160 + R() * 20, 30 + R() * 40, (R() - 0.3) * 16);
        for (i = 0; i < 12; i++) reed(286 + R() * 30, G + 190 + R() * 20, 30 + R() * 40, (R() - 0.7) * 16);
        // taboas
        [[132, G + 112], [146, G + 128], [300, G + 140]].forEach(function (tb) { wc(c, [[tb[0] - 2.5, tb[1]], [tb[0] + 2.5, tb[1]], [tb[0] + 2.5, tb[1] + 13], [tb[0] - 2.5, tb[1] + 13]], '#7b4f2f', R, { layers: 2, alpha: 0.8, jit: 0.3, edge: 0.4 }); });
        // flores
        for (i = 0; i < 24; i++) {
          var lx = R() < 0.55 ? R() * 120 - 10 : 290 + R() * 100, ly = G + 175 + R() * 110;
          var fc = ['#f2d24a', '#f6f0e6', '#e87d8a', '#b98ad8'][(R() * 4) | 0];
          for (var pt = 0; pt < 5; pt++) { var pa = pt / 5 * TAU; wc(c, blobPts(lx + Math.cos(pa) * 3, ly + Math.sin(pa) * 3, 2.6, 2.2, R, 0.2, 6), fc, R, { layers: 1, alpha: 0.85, jit: 0.2, edge: 0.25 }); }
          c.fillStyle = '#c98a2c'; c.beginPath(); c.arc(lx, ly, 1.4, 0, TAU); c.fill();
        }
        // pedras no rio
        [[176, G + 100, 11], [232, G + 150, 14], [190, G + 210, 9]].forEach(function (st) {
          wc(c, blobPts(st[0], st[1], st[2], st[2] * 0.55, R, 0.18, 10), '#9b9a92', R, { layers: 2, alpha: 0.8, jit: 0.4, edge: 0.45, mottle: 3, lightTop: 0.5 });
          c.strokeStyle = 'rgba(240,250,250,.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(st[0], st[1] + st[2] * 0.5, st[2] * 1.3, st[2] * 0.25, 0, 0.2, Math.PI - 0.2); c.stroke();
        });
        // vitórias-régias
        [[200, G + 70], [250, G + 105], [160, G + 160]].forEach(function (lp) {
          c.save(); c.translate(lp[0], lp[1]);
          wc(c, blobPts(0, 0, 9, 3.8, R, 0.1, 10), '#6fa257', R, { layers: 2, alpha: 0.8, jit: 0.2, edge: 0.45 });
          c.restore();
        });
        wc(c, blobPts(204, G + 68, 2.5, 2, R, 0.2, 6), '#f4b2c0', R, { layers: 2, alpha: 0.9, jit: 0.2, edge: 0.3 });
        layers.fg = L.cv;

        // ---- acabamento: papel + vinheta (multiply) e luz (screen) ----
        L = mk(390, Hd); c = L.c;
        c.fillStyle = c.createPattern(paperTile(), 'repeat');
        c.save(); c.scale(1 / Math.max(1, k * 0.75), 1 / Math.max(1, k * 0.75)); c.fillRect(0, 0, 390 * 4, Hd * 4); c.restore();
        var vg = c.createRadialGradient(195, Hd * 0.48, Hd * 0.25, 195, Hd * 0.5, Hd * 0.72);
        vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(176,140,100,.55)');
        c.fillStyle = vg; c.fillRect(0, 0, 390, Hd);
        grade = L.cv;
        L = mk(390, Hd); c = L.c;
        softGlow(c, 60, Hy - 60, 330, '#ffcf86', 0.35);
        var lg = c.createLinearGradient(0, 0, 390, Hd); lg.addColorStop(0, 'rgba(255,200,120,.12)'); lg.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = lg; c.fillRect(0, 0, 390, Hd);
        glow = L.cv;
      }

      /* ----- quadro ----- */
      var shimmer = (function () { var R = rng(9), a = []; for (var i = 0; i < 46; i++) a.push([R(), R(), R() * TAU, R()]); return a; })();
      var sparks = (function () { var R = rng(31), a = []; for (var i = 0; i < 14; i++) a.push([R() * TAU, 34 + R() * 46, 5 + R() * 5, R() * TAU, R()]); return a; })();
      var lastXp = -1, bubShown = null;

      function frame(t) {
        var c = ctx;
        c.setTransform(k, 0, 0, k, 0, 0);
        var A = reduce ? 0 : 16;
        var cx = A * (0.5 - 0.5 * Math.cos(TAU * t / T));
        var reset = t >= 3.33;
        // ---- estados do roteiro ----
        var walkP = reset ? 0 : ss(0, 1.2, t);
        var hx = lerp(34, 94, reset ? 0 : (t < 1.2 ? (t / 1.2) * (1 - 0.35 * (t / 1.2)) / 0.65 : 1));
        var walking = (!reset && t < 1.2) ? 1 - ss(1.0, 1.2, t) : 0;
        var hop = (!reset ? Math.max(0, Math.sin(clamp((t - 2.35) / 0.35, 0, 1) * Math.PI)) * 7 : 0);
        var drop = reset ? -1 : (t < 1.6 ? -1 : clamp((t - 1.6) / 0.6, 0, 1));
        var landed = drop >= 1;
        // ---- camadas ----
        c.clearRect(0, 0, 390, Hd);
        c.drawImage(layers.sky, -M - cx * 0.06, 0, LW, Hd);
        // pássaros
        c.strokeStyle = 'rgba(80,60,60,.6)'; c.lineWidth = 1.3; c.lineCap = 'round';
        for (var b = 0; b < 3; b++) {
          var bxp = 150 + b * 26 + Math.sin(TAU * t / T + b) * 10 - cx * 0.1, byp = Hy - 110 - b * 9 + Math.sin(TAU * t / T * 2 + b * 2) * 4;
          var fl = Math.sin(TAU * t / T * 8 + b * 1.7) * 3;
          c.beginPath(); c.moveTo(bxp - 5, byp - fl); c.quadraticCurveTo(bxp - 2, byp - 2, bxp, byp); c.quadraticCurveTo(bxp + 2, byp - 2, bxp + 5, byp - fl); c.stroke();
        }
        c.drawImage(layers.far, -M - cx * 0.18, 0, LW, Hd);
        c.drawImage(layers.mid, -M - cx * 0.45, 0, LW, Hd);
        c.drawImage(layers.near, -M - cx, 0, LW, Hd);
        c.save(); c.translate(-cx, 0);
        // fumaça da chaminé
        for (var sm = 0; sm < 5; sm++) {
          var f = ((t / T) + sm / 5) % 1, sx = 80 + Math.sin(f * 5 + sm) * 4 + f * 14, sy = G - 154 - f * 70, sr = 5 + f * 12;
          c.fillStyle = 'rgba(245,240,232,' + (Math.sin(f * Math.PI) * 0.45).toFixed(3) + ')';
          c.beginPath(); smooth(c, blobPts(sx, sy, sr, sr * 0.8, rng(sm + 3), 0.15, 9)); c.fill();
        }
        // brilho na água
        c.save(); c.beginPath(); smooth(c, river); c.clip();
        for (var i = 0; i < shimmer.length; i++) {
          var sh = shimmer[i], yy = lerp(G - 50, Hd, sh[1] * sh[1] * 0.6 + sh[1] * 0.4);
          var per = (yy - G + 66) / (Hd - G + 66), wdt = 4 + per * 16;
          var xxl = lerp(lerp(184, 104, per), lerp(210, 346, per), sh[0]) + Math.sin(TAU * t / T + sh[2]) * (2 + per * 6);
          var al = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(TAU * t / T * 2 + sh[2] * 3));
          c.strokeStyle = 'rgba(255,248,230,' + al.toFixed(3) + ')'; c.lineWidth = 0.8 + per * 1.4;
          c.beginPath(); c.moveTo(xxl - wdt / 2, yy); c.quadraticCurveTo(xxl, yy - 1.2, xxl + wdt / 2, yy); c.stroke();
        }
        if (drop >= 0) {
          c.globalAlpha = 0.16 * ss(0, 1, drop); c.save(); c.translate(0, 2 * (G + 18)); c.scale(1, -1); piece(c, (GAP0 + GAP1) / 2, archY(205) + lerp(-150, 0, drop), 0); c.restore(); c.globalAlpha = 1;
        }
        c.restore();
        // mentor e herói
        var point = ss(0.75, 1.05, t) * (1 - ss(2.2, 2.45, t));
        var wave = clamp((t - 2.35) / 0.8, 0, 1);
        if (reset) { point = 0; wave = 0; }
        var wavePose = Math.sin(clamp(wave, 0, 1) * Math.PI);
        drawMentor(c, 338, G + 32, t, Math.max(point, wavePose * 0.85), wave);
        drawHero(c, hx, G + 26, t, walking, hop);
        // peça descendo
        if (drop >= 0) {
          var e = drop < 1 ? 1 - Math.pow(1 - drop, 3) : 1;
          var bounce = landed ? Math.max(0, Math.sin(clamp((t - 2.2) / 0.22, 0, 1) * Math.PI)) * 3 : 0;
          var py = archY(205) + lerp(-150, 0, e) - bounce + 0.5, rot = (1 - e) * 0.25 * Math.sin(drop * 9);
          var glowA = ss(1.6, 1.8, t) * (1 - ss(2.5, 3.0, t));
          if (glowA > 0) {
            c.globalCompositeOperation = 'lighter';
            softGlow(c, 205, py, 46, '#ffd77a', 0.55 * glowA);
            c.globalCompositeOperation = 'source-over';
          }
          piece(c, 205, py, rot);
          if (glowA > 0) { c.globalCompositeOperation = 'lighter'; softGlow(c, 205, py, 18, '#fff2c0', 0.5 * glowA); c.globalCompositeOperation = 'source-over'; }
          // poeira e estrelinhas no encaixe
          var st = clamp((t - 2.2) / 0.75, 0, 1);
          if (!reset && st > 0 && st < 1) {
            for (var d = 0; d < 6; d++) {
              var dx = (d - 2.5) * 9, dr = 4 + st * 9;
              c.fillStyle = 'rgba(214,186,140,' + (0.45 * (1 - st)).toFixed(3) + ')';
              c.beginPath(); smooth(c, blobPts(205 + dx * (1 + st * 1.6), archY(205) + 12 - st * 6, dr, dr * 0.7, rng(d + 11), 0.2, 8)); c.fill();
            }
            for (var sp = 0; sp < sparks.length; sp++) {
              var sk = sparks[sp], dist = sk[1] * (1 - Math.pow(1 - st, 2.2));
              var sxp = 205 + Math.cos(sk[0]) * dist, syp = archY(205) - 6 + Math.sin(sk[0]) * dist * 0.75 - st * 14;
              c.fillStyle = sk[4] < 0.5 ? 'rgba(255,214,90,' + (1 - st).toFixed(3) + ')' : 'rgba(255,250,225,' + (1 - st).toFixed(3) + ')';
              star(c, sxp, syp, sk[2] * (1 - st * 0.5), sk[3] + st * 3); c.fill();
              c.strokeStyle = 'rgba(160,100,30,' + (0.5 * (1 - st)).toFixed(3) + ')'; c.lineWidth = 0.6; c.stroke();
            }
          }
        }
        c.restore();
        c.drawImage(layers.fg, -M - cx * 1.25, 0, LW, Hd);
        c.globalCompositeOperation = 'multiply'; c.drawImage(grade, 0, 0, 390, Hd);
        c.globalCompositeOperation = 'screen'; c.drawImage(glow, 0, 0, 390, Hd);
        c.globalCompositeOperation = 'source-over';

        // ---- HUD ----
        var xpv = reset ? 620 : Math.round(lerp(620, 670, ss(2.4, 2.85, t)));
        if (t > 3.05 && !reset) xpv = 670;
        if (xpv !== lastXp) { lastXp = xpv; elXpt.textContent = xpv + '/1000'; elBar.style.width = (xpv / 10) + '%'; }
        // balão
        var bIn = clamp((t - 0.8) / 0.32, 0, 1), bOut = ss(2.95, 3.2, t);
        var bOp = reset ? 0 : (bIn > 0 ? Math.min(1, bIn * 2.5) * (1 - bOut) : 0);
        var bSc = reset ? 0.8 : lerp(0.6, 1, easeOutBack(bIn)) - bOut * 0.06;
        elBub.style.opacity = bOp.toFixed(3);
        var mx = (338 - cx) * s, my = (G + 32 - 152) * s;
        elBub.style.right = Math.max(8 * s, W - mx - 70 * s) + 'px';
        elBub.style.bottom = (H - my + 6 * s) + 'px';
        elBub.style.transform = 'rotate(1.2deg) scale(' + bSc.toFixed(3) + ')';
        // +50 XP
        var xt = clamp((t - 2.4) / 0.75, 0, 1);
        var xo = reset || xt <= 0 ? 0 : Math.min(1, xt * 5) * (1 - ss(0.65, 1, xt));
        elXp.style.opacity = xo.toFixed(3);
        elXp.style.left = ((205 - cx) * s - 52 * s) + 'px';
        elXp.style.top = ((archY(205) - 70 - xt * 46) * s) + 'px';
        elXp.style.transform = 'scale(' + (0.7 + 0.3 * easeOutBack(Math.min(1, xt * 3))).toFixed(3) + ') rotate(-4deg)';
        // lavagem de papel no fecho do loop
        var wash = t < 3.05 ? 0 : (t < 3.33 ? ss(3.05, 3.33, t) : 1 - ss(3.33, 3.6, t));
        elWash.style.opacity = (wash * 0.92).toFixed(3);
      }

      /* ----- tamanho ----- */
      function layout() {
        var r = host.getBoundingClientRect();
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        s = W / 390; k = s * dpr; Hd = H / s;
        G = Math.round(Math.min(Hd * 0.655, Hd - 270));
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        hud.style.setProperty('--u', s + 'px');
        elWash.style.setProperty('--u', s + 'px');
        paint();
      }
      var raf = 0, t0 = performance.now(), pending = true;
      var ro = new ResizeObserver(function () { pending = true; });
      ro.observe(host);
      function loop(now) {
        raf = requestAnimationFrame(loop);
        if (pending) { pending = false; layout(); }
        var t = ((now - t0) / 1000) % T; if (t < 0) t += T;
        frame(t);
      }
      layout(); pending = false; frame(0);
      raf = requestAnimationFrame(loop);
      return {
        destroy: function () {
          cancelAnimationFrame(raf); ro.disconnect();
          layers = {}; grade = glow = null; host.innerHTML = '';
        }
      };
    }
  };
})();
