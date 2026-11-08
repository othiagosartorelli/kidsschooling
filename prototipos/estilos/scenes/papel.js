/* KidsSchooling · Estilo PAPEL RECORTADO
   Camadas de papel pré-renderizadas (textura de ruído, bordas irregulares, sombras projetadas),
   personagens como fantoches de papel com borda branca de adesivo, balanço de teatro de varetas. */
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
  function rnd(i, s) {
    var h = Math.imul((i | 0) + 0x9e37, 374761393) ^ Math.imul((s | 0) + 0x7f4a, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  var P = {
    sky: '#cfe9f3', sun: '#ffc53d', sunIn: '#ffdb6e', cloud: '#fffdf7',
    far1: '#c7e5bb', far2: '#addaa3', mid1: '#8fcb85', mid2: '#79bd72',
    earth: '#e4b47c', earthD: '#cf9a63', earthDD: '#b98352', wall: '#a8784e',
    grass: '#7cc56c', grassD: '#5ea956',
    w0: '#8fd2f0', w1: '#5fb4e6', w2: '#3d95d4',
    wood: '#cd8f55', woodD: '#a66a3a', woodL: '#e7b07a',
    skin: '#ffd3b0', skinD: '#f0b48c', ink: '#3a2e2a', hair: '#62402d',
    blue: '#4a86e8', blueD: '#3569c4', navy: '#34427a', orange: '#ff9a3c', orangeD: '#e67a1c',
    yellow: '#ffcb2e', yellowD: '#eba900', beard: '#ffffff', teal: '#3db3a2', tealD: '#2c998a',
    apron: '#a8693a', apronD: '#8a5229', pants: '#5d4a66', boot: '#5a3626', paperW: '#fffdf6'
  };

  /* ---------- formas de papel com bordas irregulares ---------- */
  function wobPoly(c, pts, seed, amp, step) {
    step = step || 7; amp = amp == null ? 1.2 : amp;
    c.beginPath();
    var n = pts.length, idx = 0;
    for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var m = Math.max(1, Math.round(L / step)), nx = -dy / L, ny = dx / L;
      for (var j = 0; j < m; j++) {
        var f = j / m, o = (rnd(idx++, seed) - 0.5) * amp * (j === 0 ? 0.3 : 1);
        var x = a[0] + dx * f + nx * o, y = a[1] + dy * f + ny * o;
        if (i === 0 && j === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
    }
    c.closePath();
  }
  function wobCircle(c, x, y, r, seed, amp) {
    var n = Math.max(14, Math.round(r * 0.9)), pts = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, rr = r + (rnd(i, seed) - 0.5) * (amp == null ? Math.max(1, r * 0.05) : amp);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    wobPoly(c, pts, seed + 7, 0.4, 100);
  }
  function rrPts(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    var pts = [], k, corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (var q = 0; q < 4; q++) for (k = 0; k <= 4; k++) {
      var a = corners[q][2] + k / 4 * Math.PI / 2;
      pts.push([corners[q][0] + Math.cos(a) * r, corners[q][1] + Math.sin(a) * r]);
    }
    return pts;
  }
  function wobRR(c, x, y, w, h, r, seed, amp) { wobPoly(c, rrPts(x, y, w, h, r), seed, amp == null ? 0.9 : amp, 6); }
  function F(c, col) { c.fillStyle = col; c.fill(); }

  /* ---------- montagem ---------- */
  window.SCENES['papel'] = {
    mount: function (host) {
      var reduce = false;
      try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

      // textura de papel (ruído + fibras), usada no canvas e no HUD
      var noise = document.createElement('canvas'); noise.width = 128; noise.height = 128;
      (function () {
        var c = noise.getContext('2d'), id = c.createImageData(128, 128), d = id.data, i;
        for (i = 0; i < 128 * 128; i++) {
          var v = rnd(i, 3), dark = v < 0.5;
          d[i * 4] = dark ? 90 : 255; d[i * 4 + 1] = dark ? 70 : 255; d[i * 4 + 2] = dark ? 45 : 250;
          d[i * 4 + 3] = Math.floor((dark ? v * 2 : (v - 0.5) * 2) * 26);
        }
        c.putImageData(id, 0, 0);
        c.lineCap = 'round';
        for (i = 0; i < 70; i++) {
          var x = rnd(i, 11) * 128, y = rnd(i, 12) * 128, a = rnd(i, 13) * TAU, l = 3 + rnd(i, 14) * 9;
          c.strokeStyle = rnd(i, 15) < 0.5 ? 'rgba(110,85,55,0.10)' : 'rgba(255,255,255,0.22)';
          c.lineWidth = 0.7;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
        }
      })();
      var noiseURL = noise.toDataURL();

      var root = document.createElement('div');
      root.className = 'papel-root';
      root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:' + P.sky + ';';
      host.appendChild(root);

      var zig = 'polygon(0 0,100% 0,97% 20%,100% 40%,97% 60%,100% 80%,97% 100%,0 100%,3% 80%,0 60%,3% 40%,0 20%)';
      var torn = (function () {
        var p = ['0 0'];
        for (var i = 0; i <= 8; i++) p.push('calc(100% - ' + (i % 2 ? 0 : 3) + 'px) ' + (i / 8 * 100).toFixed(1) + '%');
        p.push('0 100%');
        return 'polygon(' + p.join(',') + ')';
      })();
      var paperBg = 'background-image:url(' + noiseURL + ');background-size:128px 128px;';
      var style = document.createElement('style');
      style.textContent = [
        '.papel-root,.papel-root *{box-sizing:border-box;}',
        '.papel-cv{position:absolute;left:0;top:0;display:block;}',
        '.papel-hud{position:absolute;inset:0;pointer-events:none;font-family:"Patrick Hand",system-ui,sans-serif;color:#3a2e2a;font-size:calc(17px*var(--u));line-height:1.15;}',
        '.papel-p{position:relative;' + paperBg + 'box-shadow:0 calc(3px*var(--u)) calc(5px*var(--u)) rgba(70,45,20,.28),0 1px 1px rgba(70,45,20,.2);}',
        '.papel-tape{position:absolute;width:calc(46px*var(--u));height:calc(17px*var(--u));background:rgba(255,238,170,.72);clip-path:' + zig + ';z-index:2;}',
        '.papel-tape:after{content:"";position:absolute;inset:0;' + paperBg + 'opacity:.6;}',
        '.papel-top{position:absolute;left:calc(14px*var(--u));right:calc(14px*var(--u));top:calc(env(safe-area-inset-top,0px) + 34px);display:flex;flex-direction:column;align-items:flex-start;gap:calc(10px*var(--u));}',
        '.papel-player{display:flex;align-items:center;gap:calc(10px*var(--u));align-self:stretch;}',
        '.papel-av{flex:none;width:calc(58px*var(--u));height:calc(58px*var(--u));border-radius:50%;background-color:#ffe39a;border:calc(3.5px*var(--u)) solid #fffdf6;overflow:hidden;transform:rotate(-4deg);}',
        '.papel-av canvas{width:100%;height:100%;display:block;}',
        '.papel-tag{flex:1;min-width:0;background-color:#f6e7c8;padding:calc(8px*var(--u)) calc(14px*var(--u)) calc(9px*var(--u));border-radius:calc(4px*var(--u));transform:rotate(-1.2deg);clip-path:none;}',
        '.papel-lvl{font-size:calc(21px*var(--u));white-space:nowrap;}',
        '.papel-lvl b{font-weight:400;color:#c4521f;}',
        '.papel-xprow{display:flex;align-items:center;gap:calc(8px*var(--u));margin-top:calc(4px*var(--u));}',
        '.papel-bar{flex:1;height:calc(13px*var(--u));background-color:#dccaa6;' + paperBg + 'box-shadow:inset 0 1px 2px rgba(70,45,20,.35);position:relative;border-radius:2px;}',
        '.papel-fill{position:absolute;left:0;top:calc(1.5px*var(--u));bottom:calc(1.5px*var(--u));background-color:#ff9a3c;' + paperBg + 'clip-path:' + torn + ';box-shadow:0 1px 1px rgba(0,0,0,.2);}',
        '.papel-xpt{font-size:calc(15px*var(--u));white-space:nowrap;color:#6b5a48;font-variant-numeric:tabular-nums;}',
        '.papel-xpt b{font-weight:400;color:#3a2e2a;}',
        '.papel-mis{display:flex;align-items:center;gap:calc(8px*var(--u));background-color:#fff6b8;padding:calc(7px*var(--u)) calc(14px*var(--u)) calc(7px*var(--u)) calc(10px*var(--u));transform:rotate(1deg);margin-left:calc(6px*var(--u));font-size:calc(17px*var(--u));background-image:url(' + noiseURL + '),repeating-linear-gradient(transparent 0 calc(19px*var(--u)),rgba(90,140,200,.25) calc(19px*var(--u)) calc(20px*var(--u)));}',
        '.papel-mis svg{width:calc(26px*var(--u));height:calc(26px*var(--u));flex:none;}',
        '.papel-mis b{font-weight:400;color:#c4521f;}',
        '.papel-say{position:absolute;left:calc(14px*var(--u));right:calc(14px*var(--u));background-color:#fffdf6;border-radius:calc(22px*var(--u)) calc(26px*var(--u)) calc(20px*var(--u)) calc(28px*var(--u));padding:calc(16px*var(--u)) calc(16px*var(--u)) calc(14px*var(--u)) calc(14px*var(--u));display:flex;gap:calc(12px*var(--u));align-items:center;transform-origin:80% 0;opacity:0;}',
        '.papel-say:before{content:"";position:absolute;right:calc(52px*var(--u));top:calc(-12px*var(--u));width:calc(28px*var(--u));height:calc(28px*var(--u));background:#fffdf6;transform:rotate(45deg);border-radius:3px;}',
        '.papel-say .papel-av{width:calc(54px*var(--u));height:calc(54px*var(--u));background-color:#c9eee6;}',
        '.papel-name{position:absolute;left:calc(70px*var(--u));top:calc(-15px*var(--u));background-color:#f2c14e;padding:calc(3px*var(--u)) calc(12px*var(--u)) calc(3px*var(--u)) calc(14px*var(--u));font-size:calc(16px*var(--u));transform:rotate(-3deg);clip-path:polygon(calc(10px*var(--u)) 0,100% 0,100% 100%,calc(10px*var(--u)) 100%,0 50%);}',
        '.papel-line{font-size:calc(21px*var(--u));line-height:1.2;min-height:2.4em;padding-top:calc(4px*var(--u));}',
        '.papel-btns{position:absolute;left:calc(16px*var(--u));right:calc(16px*var(--u));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(12px*var(--u));}',
        '.papel-btn{flex:1;height:calc(66px*var(--u));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#fff;font-size:calc(19px*var(--u));border:calc(3.5px*var(--u)) solid #fffdf6;text-shadow:0 1px 0 rgba(0,0,0,.18);}',
        '.papel-btn svg{width:calc(26px*var(--u));height:calc(26px*var(--u));}',
        '.papel-b1{background-color:#f07a3a;border-radius:18px 24px 16px 22px/22px 16px 24px 18px;transform:rotate(-2deg);}',
        '.papel-b2{background-color:#4a86e8;border-radius:24px 18px 22px 16px/16px 24px 18px 22px;transform:rotate(1.2deg) translateY(calc(-2px*var(--u)));}',
        '.papel-b3{background-color:#3fa968;border-radius:16px 22px 18px 24px/24px 18px 22px 16px;transform:rotate(-0.8deg);}',
        '.papel-xp{position:absolute;padding:calc(5px*var(--u)) calc(16px*var(--u));background-color:#ffd23f;font-size:calc(26px*var(--u));color:#8a3d12;opacity:0;white-space:nowrap;border:calc(3px*var(--u)) solid #fffdf6;border-radius:6px 10px 7px 12px;}',
        '.papel-xp .papel-tape{left:50%;top:calc(-10px*var(--u));margin-left:calc(-20px*var(--u));width:calc(40px*var(--u));transform:rotate(-6deg);}'
      ].join('\n');
      root.appendChild(style);

      var cv = document.createElement('canvas');
      cv.className = 'papel-cv';
      root.appendChild(cv);
      var ctx = cv.getContext('2d');

      var SV = {
        bridge: '<svg viewBox="0 0 26 26"><path d="M2 15h22" stroke="#a66a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M5 15V10M13 15V9M21 15V10" stroke="#cd8f55" stroke-width="2.6" stroke-linecap="round"/><path d="M3 10.5Q13 4.5 23 10.5" fill="none" stroke="#cd8f55" stroke-width="2.4" stroke-linecap="round"/><path d="M4 21c2.2-1.4 4.4-1.4 6.6 0s4.4 1.4 6.6 0 3.3-1 4.6-.6" fill="none" stroke="#4a86e8" stroke-width="2" stroke-linecap="round"/></svg>',
        hammer: '<svg viewBox="0 0 24 24"><rect x="10.2" y="9" width="3.6" height="13" rx="1.6" fill="#fff"/><path d="M5 4.5h10.5l3 3v2.2H5.8A2 2 0 0 1 3.8 7.7V5.7A1.2 1.2 0 0 1 5 4.5z" fill="#fff"/></svg>',
        bag: '<svg viewBox="0 0 24 24"><path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="7" width="16" height="15" rx="5" fill="#fff"/><rect x="8" y="13" width="8" height="5" rx="2" fill="#4a86e8" opacity=".45"/></svg>',
        map: '<svg viewBox="0 0 24 24"><path d="M3 6.2 8.6 4l6.8 2.4L21 4.2v13.6L15.4 20l-6.8-2.4L3 19.8z" fill="#fff"/><path d="M8.6 4v13.6M15.4 6.4V20" stroke="#3fa968" stroke-opacity=".5" stroke-width="1.6"/></svg>'
      };
      var LINE = 'A viga precisa se apoiar dos dois lados!';
      var hud = document.createElement('div');
      hud.className = 'papel-hud';
      hud.innerHTML =
        '<div class="papel-top">' +
          '<div class="papel-player"><div class="papel-av papel-p"><canvas class="papel-avh"></canvas></div>' +
            '<div class="papel-tag papel-p"><span class="papel-tape" style="right:calc(-14px*var(--u));top:calc(-6px*var(--u));transform:rotate(32deg)"></span>' +
              '<div class="papel-lvl">Nível 4 · <b>Explorador</b></div>' +
              '<div class="papel-xprow"><div class="papel-bar"><div class="papel-fill"></div></div><div class="papel-xpt"><b class="papel-xpn">620</b>/1000 XP</div></div>' +
            '</div></div>' +
          '<div class="papel-mis papel-p"><span class="papel-tape" style="right:calc(-18px*var(--u));top:calc(-4px*var(--u));transform:rotate(24deg)"></span>' + SV.bridge + '<div><b>Missão:</b> consertar a ponte da vila</div></div>' +
        '</div>' +
        '<div class="papel-xp papel-p"><span class="papel-tape"></span>+50 XP</div>' +
        '<div class="papel-say papel-p"><div class="papel-name papel-p">Mestre Tomé</div><span class="papel-tape" style="right:calc(-14px*var(--u));bottom:calc(-2px*var(--u));transform:rotate(-38deg)"></span>' +
          '<div class="papel-av papel-p"><canvas class="papel-avt"></canvas></div><div class="papel-line"></div></div>' +
        '<div class="papel-btns">' +
          '<div class="papel-btn papel-b1 papel-p">' + SV.hammer + '<span>Construir</span></div>' +
          '<div class="papel-btn papel-b2 papel-p">' + SV.bag + '<span>Mochila</span></div>' +
          '<div class="papel-btn papel-b3 papel-p">' + SV.map + '<span>Mapa</span></div>' +
        '</div>';
      root.appendChild(hud);
      function q(s) { return hud.querySelector(s); }
      var elFill = q('.papel-fill'), elXpN = q('.papel-xpn'), elSay = q('.papel-say'), elLine = q('.papel-line'), elXp = q('.papel-xp');

      /* ---------- sprites (recortes) ---------- */
      var S = 1, W = 0, H = 0, dpr = 1, k = 1, Hu = 844, GY = 506;
      var LB = 166, RB = 300, DX0 = 146, DX1 = 320, NSEG = 5, MISS = 2, SEGW = (DX1 - DX0) / NSEG;
      var SPR = {};
      var pat = null;

      function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
      function makeSprite(box, draw, o) {
        o = o || {};
        var pad = o.pad != null ? o.pad : 14, bw = box[2] - box[0], bh = box[3] - box[1];
        var Wd = Math.ceil((bw + 2 * pad) * S), Hd = Math.ceil((bh + 2 * pad) * S);
        var A = canvas(Wd, Hd), a = A.getContext('2d');
        a.setTransform(S, 0, 0, S, (pad - box[0]) * S, (pad - box[1]) * S);
        a.lineJoin = 'round'; a.lineCap = 'round';
        draw(a);
        if (o.tex !== false) {
          a.setTransform(1, 0, 0, 1, 0, 0);
          a.globalCompositeOperation = 'source-atop';
          a.fillStyle = a.createPattern(noise, 'repeat');
          a.fillRect(0, 0, Wd, Hd);
          a.globalCompositeOperation = 'source-over';
        }
        var Fc = canvas(Wd, Hd), f = Fc.getContext('2d'), src = A;
        if (o.border) {
          var B = canvas(Wd, Hd), b = B.getContext('2d'), r = o.border * S;
          for (var i = 0; i < 16; i++) b.drawImage(A, Math.cos(i / 16 * TAU) * r, Math.sin(i / 16 * TAU) * r);
          b.globalCompositeOperation = 'source-in'; b.fillStyle = P.paperW; b.fillRect(0, 0, Wd, Hd);
          src = B;
        }
        if (o.shadow !== false) {
          f.shadowColor = 'rgba(70,45,20,' + (o.sa != null ? o.sa : 0.32) + ')';
          f.shadowBlur = (o.blur != null ? o.blur : 6) * S;
          f.shadowOffsetY = (o.sy != null ? o.sy : 3) * S; f.shadowOffsetX = (o.sx != null ? o.sx : 1) * S;
        }
        f.drawImage(src, 0, 0);
        f.shadowColor = 'transparent';
        if (o.border) f.drawImage(A, 0, 0);
        return { cv: Fc, x: box[0] - pad, y: box[1] - pad, w: bw + 2 * pad, h: bh + 2 * pad };
      }
      function put(sp, x, y, rot, sx, sy) {
        ctx.save(); ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        if (sx != null) ctx.scale(sx, sy != null ? sy : sx);
        ctx.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
        ctx.restore();
      }

      // --- desenhos ---
      function heroHead(c, x, y) {
        wobCircle(c, x - 3, y - 4, 22, 21); F(c, P.hair);
        wobCircle(c, x - 8, y + 4, 5.5, 22); F(c, P.skinD);
        wobCircle(c, x + 4, y + 3, 18.5, 23); F(c, P.skin);
        c.beginPath(); c.ellipse(x + 6, y - 13, 17, 9, -0.25, 0, TAU); F(c, P.hair);
        wobCircle(c, x - 12, y - 6, 9, 24); F(c, P.hair);
        c.beginPath(); c.arc(x + 7, y + 3, 2.9, 0, TAU); F(c, P.ink);
        c.beginPath(); c.arc(x + 17, y + 3, 2.9, 0, TAU); F(c, P.ink);
        c.beginPath(); c.arc(x + 4, y + 10, 4, 0, TAU); F(c, 'rgba(255,120,120,0.45)');
        c.beginPath(); c.arc(x + 21, y + 10, 3.4, 0, TAU); F(c, 'rgba(255,120,120,0.45)');
        c.beginPath(); c.arc(x + 13, y + 10, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke();
      }
      function tomeHead(c, x, y) {
        wobCircle(c, x - 12, y + 3, 6, 31); F(c, P.skinD);
        wobCircle(c, x + 2, y + 2, 20, 32); F(c, P.skin);
        wobCircle(c, x - 10, y - 2, 8, 33); F(c, '#dfe2ea');
        c.beginPath(); c.moveTo(x - 14, y + 4); c.quadraticCurveTo(x - 12, y + 34, x + 6, y + 36); c.quadraticCurveTo(x + 24, y + 30, x + 24, y + 6);
        c.quadraticCurveTo(x + 10, y + 14, x - 14, y + 4); F(c, P.beard);
        c.beginPath(); c.ellipse(x + 9, y + 11, 12, 5.5, 0, 0, TAU); F(c, '#f6f6f6');
        c.beginPath(); c.arc(x + 15, y + 5, 4.6, 0, TAU); F(c, '#f0a07a');
        c.beginPath(); c.arc(x + 1, y + 7, 4.4, 0, TAU); F(c, 'rgba(255,120,120,0.45)');
        c.strokeStyle = P.ink; c.lineWidth = 2.4;
        c.beginPath(); c.arc(x + 6.5, y, 3.6, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
        c.beginPath(); c.arc(x + 17.5, y - 1, 3.2, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
        c.beginPath(); c.arc(x + 1, y - 9, 22, Math.PI, 0); c.closePath(); F(c, P.yellow);
        wobRR(c, x - 22, y - 12, 50, 7.5, 3.5, 34); F(c, P.yellowD);
        wobRR(c, x - 4, y - 31, 9, 20, 4.5, 35); F(c, '#ffe27a');
      }
      function buildSprites() {
        SPR = {};
        // céu (fundo fixo)
        SPR.sky = makeSprite([-70, -20, 460, Hu + 20], function (c) { c.fillStyle = P.sky; c.fillRect(-70, -20, 530, Hu + 40); }, { shadow: false, pad: 0 });
        // sol com raios (gira 1/12 de volta por ciclo -> emenda perfeita)
        SPR.sun = makeSprite([-56, -56, 56, 56], function (c) {
          for (var i = 0; i < 12; i++) {
            var a = i / 12 * TAU;
            wobPoly(c, [[Math.cos(a - 0.13) * 34, Math.sin(a - 0.13) * 34], [Math.cos(a) * 54, Math.sin(a) * 54], [Math.cos(a + 0.13) * 34, Math.sin(a + 0.13) * 34]], 40 + i, 0.8, 5);
            F(c, i % 2 ? '#ffb43a' : P.sun);
          }
          wobCircle(c, 0, 0, 34, 41); F(c, P.sun);
          wobCircle(c, -3, -3, 26, 42); F(c, P.sunIn);
        }, { border: 2.5, sa: 0.2 });
        function cloudDraw(seed) {
          return function (c) {
            wobCircle(c, -26, 4, 17, seed); F(c, P.cloud);
            wobCircle(c, -3, -9, 23, seed + 1); F(c, P.cloud);
            wobCircle(c, 22, 2, 18, seed + 2); F(c, P.cloud);
            wobRR(c, -44, 2, 86, 19, 9, seed + 3); F(c, P.cloud);
          };
        }
        SPR.cloud1 = makeSprite([-46, -34, 44, 24], cloudDraw(50), { sa: 0.16, blur: 8, sy: 4 });
        SPR.cloud2 = makeSprite([-46, -34, 44, 24], cloudDraw(60), { sa: 0.16, blur: 8, sy: 4 });
        // colinas distantes (com capelinha)
        SPR.far = makeSprite([-70, GY - 230, 460, GY + 40], function (c) {
          var pts = [[-70, GY + 40]], x;
          for (x = -70; x <= 460; x += 10) pts.push([x, GY - 120 - Math.sin((x + 40) / 520 * Math.PI * 1.6) * 70 + Math.sin(x * 0.03) * 6]);
          pts.push([460, GY + 40]);
          wobPoly(c, pts, 70, 1.4, 8); F(c, P.far1);
          // capelinha
          var cx = 336, cy = GY - 128 - Math.sin((cx + 40) / 520 * Math.PI * 1.6) * 70 + 4;
          wobRR(c, cx - 14, cy - 20, 28, 22, 2, 71); F(c, '#fffaf0');
          wobPoly(c, [[cx - 18, cy - 18], [cx, cy - 32], [cx + 18, cy - 18]], 72, 0.6, 5); F(c, '#e9785a');
          wobRR(c, cx - 4.5, cy - 46, 9, 16, 1, 73); F(c, '#fffaf0');
          wobPoly(c, [[cx - 6, cy - 45], [cx, cy - 53], [cx + 6, cy - 45]], 74, 0.3, 5); F(c, '#e9785a');
          c.fillStyle = '#d9a63a'; c.fillRect(cx - 0.9, cy - 63, 1.8, 10); c.fillRect(cx - 3.5, cy - 60, 7, 1.8);
          wobRR(c, cx - 3, cy - 10, 6, 12, 3, 75); F(c, '#b9804c');
        }, { sa: 0.22, blur: 7 });
        SPR.far2 = makeSprite([-70, GY - 160, 460, GY + 40], function (c) {
          var pts = [[-70, GY + 40]], x;
          for (x = -70; x <= 460; x += 10) pts.push([x, GY - 70 - Math.sin((x - 120) / 420 * Math.PI) * 40 + Math.cos(x * 0.04) * 5]);
          pts.push([460, GY + 40]);
          wobPoly(c, pts, 80, 1.4, 8); F(c, P.far2);
        }, { sa: 0.25, blur: 7 });
        SPR.mid = makeSprite([-70, GY - 120, 460, GY + 40], function (c) {
          var pts = [[-70, GY + 40]], x;
          for (x = -70; x <= 460; x += 10) pts.push([x, GY - 40 - Math.max(0, Math.sin((x + 70) / 300 * Math.PI)) * 46 - Math.max(0, Math.sin((x - 230) / 260 * Math.PI)) * 40]);
          pts.push([460, GY + 40]);
          wobPoly(c, pts, 90, 1.4, 8); F(c, P.mid1);
          var tr = [[40, GY - 78], [74, GY - 86], [282, GY - 70], [316, GY - 72], [410, GY - 52]];
          for (var i = 0; i < tr.length; i++) {
            wobRR(c, tr[i][0] - 2, tr[i][1] - 4, 4, 14, 1.5, 91 + i); F(c, '#8a6a48');
            wobCircle(c, tr[i][0], tr[i][1] - 12, 10, 95 + i); F(c, i % 2 ? '#5aa85c' : '#64b464');
          }
        }, { sa: 0.28, blur: 7 });
        // fundo do vale (parede de terra atrás da água)
        SPR.trench = makeSprite([LB - 10, GY - 6, RB + 10, GY + 200], function (c) {
          wobPoly(c, [[LB - 10, GY], [RB + 10, GY], [RB + 10, GY + 200], [LB - 10, GY + 200]], 100, 1.2, 8); F(c, P.wall);
          c.fillStyle = 'rgba(80,50,25,0.18)';
          for (var i = 0; i < 5; i++) { c.beginPath(); c.ellipse(LB + 20 + rnd(i, 101) * (RB - LB - 40), GY + 14 + rnd(i, 102) * 30, 7, 4, 0, 0, TAU); c.fill(); }
        }, { shadow: false });
        // faixas de água (deslizam como cenário de teatro)
        function waterStrip(y, col, seed, amp) {
          return makeSprite([LB - 40, y - 12, RB + 40, GY + 200], function (c) {
            var pts = [], x;
            for (x = LB - 40; x <= RB + 40; x += 4) pts.push([x, y + Math.sin(x * 0.11 + seed) * amp]);
            pts.push([RB + 40, GY + 200]); pts.push([LB - 40, GY + 200]);
            wobPoly(c, pts, seed, 0.8, 5); F(c, col);
          }, { sa: 0.22, blur: 5, sy: -2, sx: 0 });
        }
        SPR.w0 = waterStrip(GY + 44, P.w0, 110, 3.5);
        SPR.w1 = waterStrip(GY + 62, P.w1, 120, 4);
        SPR.w2 = waterStrip(GY + 90, P.w2, 130, 4.5);
        // estacas da ponte
        SPR.piles = makeSprite([DX0, GY - 4, DX1, GY + 190], function (c) {
          wobRR(c, DX0 + SEGW * 1.5 - 6, GY, 12, 180, 3, 140); F(c, '#8a5530');
          wobRR(c, DX0 + SEGW * 3.5 - 6, GY, 12, 180, 3, 141); F(c, '#8a5530');
        }, { sa: 0.25 });
        // chão com o vale recortado
        SPR.ground = makeSprite([-70, GY - 14, 460, Hu + 30], function (c) {
          var U = [[-70, GY]], hw = (RB - LB) / 2, mx = (LB + RB) / 2;
          for (var ua = 0; ua <= 28; ua++) { var aa = ua / 28 * Math.PI; U.push([mx - Math.cos(aa) * hw * (0.92 + 0.08 * Math.sin(aa)), GY + Math.pow(Math.sin(aa), 0.8) * 168]); }
          U.push([460, GY], [460, Hu + 30], [-70, Hu + 30]);
          wobPoly(c, U, 150, 1.6, 6); F(c, P.earth);
          c.save(); wobPoly(c, U, 150, 1.6, 6); c.clip();
          var band = [[-70, GY + 74], [LB - 20, GY + 66], [RB + 20, GY + 70], [460, GY + 62], [460, GY + 110], [-70, GY + 118]];
          wobPoly(c, band, 151, 1.6, 7); F(c, P.earthD);
          wobPoly(c, [[-70, GY + 200], [460, GY + 196], [460, Hu + 40], [-70, Hu + 40]], 152, 1.6, 7); F(c, P.earthDD);
          for (var i = 0; i < 9; i++) {
            var sx = -40 + rnd(i, 153) * 480, sy = GY + 30 + rnd(i, 154) * 220;
            if (sx > LB - 10 && sx < RB + 10 && sy < GY + 175) continue;
            wobCircle(c, sx, sy, 5 + rnd(i, 155) * 4, 156 + i); F(c, 'rgba(120,80,45,0.35)');
          }
          c.restore();
          // grama
          function grass(x0, x1, seed) {
            var pts = [], x, n = 0;
            for (x = x0; x <= x1; x += 6) pts.push([x, GY - 4 - (n++ % 2 ? 6 : 0) * rnd(n, seed)]);
            pts.push([x1, GY + 14]); pts.push([x0, GY + 14]);
            wobPoly(c, pts, seed, 0.6, 6); F(c, P.grass);
            wobPoly(c, [[x0, GY + 8], [x1, GY + 8], [x1, GY + 16], [x0, GY + 17]], seed + 1, 1, 6); F(c, P.grassD);
          }
          grass(-70, LB + 2, 160); grass(RB - 2, 460, 162);
        }, { sa: 0.34, blur: 8, sy: -1 });
        // ponte (tabuleiro com uma peça faltando)
        function deckSeg(c, x, y, w, seed, glow) {
          wobRR(c, x + 1, y, w - 2, 17, 4, seed); F(c, P.woodD);
          wobRR(c, x + 1, y, w - 2, 12, 4, seed + 1); F(c, glow ? '#ffd27a' : P.wood);
          wobRR(c, x + 5, y + 2.5, w - 16, 3, 1.5, seed + 2); F(c, glow ? '#fff0c0' : P.woodL);
          c.beginPath(); c.arc(x + 5, y + 7, 1.6, 0, TAU); F(c, '#6e4224');
          c.beginPath(); c.arc(x + w - 6, y + 7, 1.6, 0, TAU); F(c, '#6e4224');
        }
        SPR.bridge = makeSprite([DX0 - 8, GY - 44, DX1 + 8, GY + 24], function (c) {
          for (var p = 0; p <= NSEG; p++) {
            var px = DX0 + p * SEGW;
            wobRR(c, px - 4, GY - 36, 8, 36, 3, 170 + p); F(c, P.woodD);
            wobCircle(c, px, GY - 37, 5.5, 180 + p); F(c, P.wood);
          }
          wobRR(c, DX0 - 2, GY - 31, DX1 - DX0 + 4, 6, 3, 190); F(c, P.wood);
          wobRR(c, DX0 - 2, GY - 17, DX1 - DX0 + 4, 5, 2.5, 191); F(c, P.woodD);
          for (var s = 0; s < NSEG; s++) if (s !== MISS) deckSeg(c, DX0 + s * SEGW, GY - 4, SEGW, 200 + s * 3, false);
          wobRR(c, DX0 - 6, GY - 4, 12, 24, 3, 220); F(c, P.woodD);
          wobRR(c, DX1 - 6, GY - 4, 12, 24, 3, 221); F(c, P.woodD);
        }, { border: 2.5, sa: 0.32 });
        SPR.plank = makeSprite([-SEGW / 2, -9, SEGW / 2, 9], function (c) { deckSeg(c, -SEGW / 2, -8.5, SEGW, 230, false); }, { border: 2.5, sa: 0.3 });
        SPR.plankBack = makeSprite([-SEGW / 2, -9, SEGW / 2, 9], function (c) { wobRR(c, -SEGW / 2 + 1, -8.5, SEGW - 2, 17, 4, 231); F(c, '#b07a4c'); c.strokeStyle = 'rgba(80,50,25,0.25)'; c.lineWidth = 1; for (var i = -12; i < 14; i += 5) { c.beginPath(); c.moveTo(i, -6); c.lineTo(i + 3, 6); c.stroke(); } }, { border: 2.5, sa: 0.3 });
        // casa
        SPR.house = makeSprite([-62, -150, 62, 2], function (c) {
          wobRR(c, 14, -132, 16, 40, 2, 240); F(c, '#c75a40');
          wobRR(c, 11, -138, 22, 9, 2, 241); F(c, '#a8452f');
          wobRR(c, -52, -84, 104, 86, 4, 242); F(c, '#f8dfb4');
          wobPoly(c, [[18, -84], [52, -84], [52, 2], [18, 2]], 243, 0.8, 8); F(c, '#efcf9c');
          wobPoly(c, [[-66, -80], [0, -142], [66, -80]], 244, 1.2, 7); F(c, '#ec6c4b');
          wobPoly(c, [[0, -142], [66, -80], [0, -80]], 245, 0.8, 7); F(c, '#d4573a');
          wobCircle(c, 0, -106, 11, 246); F(c, '#f8dfb4'); wobCircle(c, 0, -106, 7.5, 247); F(c, '#9adcf5');
          wobRR(c, 6, -48, 26, 50, 13, 248); F(c, '#b56a3c');
          c.beginPath(); c.arc(26, -22, 2.4, 0, TAU); F(c, '#ffd23f');
          wobRR(c, -40, -58, 30, 26, 4, 249); F(c, '#9adcf5');
          c.fillStyle = '#fffdf6'; c.fillRect(-26, -58, 2.5, 26); c.fillRect(-40, -46, 30, 2.5);
          wobRR(c, -44, -34, 38, 8, 3, 250); F(c, '#a8693a');
          c.beginPath(); c.arc(-37, -35, 4.5, 0, TAU); F(c, '#ff6b8a'); c.beginPath(); c.arc(-25, -36, 4.5, 0, TAU); F(c, '#ffd23f'); c.beginPath(); c.arc(-13, -35, 4.5, 0, TAU); F(c, '#ff6b8a');
        }, { border: 3, sa: 0.32 });
        SPR.puff = makeSprite([-10, -10, 10, 10], function (c) { wobCircle(c, 0, 0, 10, 260); F(c, '#ffffff'); }, { sa: 0.15, blur: 4, sy: 2 });
        // árvores
        SPR.tree = makeSprite([-34, -96, 34, 2], function (c) {
          wobRR(c, -6, -40, 12, 42, 3, 270); F(c, '#9a6a43');
          wobCircle(c, 0, -60, 32, 271); F(c, '#58b45e');
          wobCircle(c, -9, -68, 22, 272); F(c, '#78cc72');
          [[-10, -54], [12, -66], [6, -44], [-18, -72]].forEach(function (p, i) { c.beginPath(); c.arc(p[0], p[1], 4.6, 0, TAU); F(c, '#ef5350'); });
        }, { border: 3, sa: 0.32 });
        SPR.pine = makeSprite([-36, -118, 36, 2], function (c) {
          wobRR(c, -5, -30, 10, 32, 3, 280); F(c, '#8a5a38');
          for (var i = 0; i < 3; i++) { var w = 34 - i * 8, y = -24 - i * 22; wobPoly(c, [[-w, y], [0, y - 44], [w, y]], 281 + i, 1, 6); F(c, i % 2 ? '#3f9a5a' : '#48a862'); }
        }, { border: 3, sa: 0.32 });
        SPR.bush = makeSprite([-30, -34, 32, 2], function (c) {
          wobCircle(c, -14, -12, 14, 290); F(c, '#4fa85a'); wobCircle(c, 4, -18, 17, 291); F(c, '#4fa85a'); wobCircle(c, 19, -10, 12, 292); F(c, '#4fa85a');
          wobRR(c, -27, -14, 56, 15, 7, 293); F(c, '#4fa85a');
          wobCircle(c, 0, -22, 8, 294); F(c, '#6cc070');
          c.beginPath(); c.arc(-14, -12, 3.4, 0, TAU); F(c, '#ff8fb1'); c.beginPath(); c.arc(12, -18, 3.4, 0, TAU); F(c, '#ff8fb1'); c.beginPath(); c.arc(20, -6, 3.4, 0, TAU); F(c, '#ff8fb1');
        }, { border: 3, sa: 0.32 });
        // primeiro plano
        SPR.fg = makeSprite([-70, GY + 150, 460, Hu + 30], function (c) {
          var pts = [], x, i = 0;
          for (x = -70; x <= 460; x += 9) { var bump = Math.max(0, Math.sin((x + 80) / 300 * Math.PI)) * 60 + Math.max(0, Math.sin((x - 210) / 280 * Math.PI)) * 48; pts.push([x, GY + 270 - bump - (i++ % 2 ? 9 : 0)]); }
          pts.push([460, Hu + 30]); pts.push([-70, Hu + 30]);
          wobPoly(c, pts, 300, 1, 6); F(c, '#62b35b');
          var fl = [[16, GY + 222, '#ff6b8a'], [52, GY + 210, '#fffdf6'], [96, GY + 226, '#ffd23f'], [300, GY + 232, '#b48cff'], [338, GY + 214, '#ff6b8a'], [372, GY + 232, '#fffdf6']];
          for (var f = 0; f < fl.length; f++) {
            var fx = fl[f][0], fy = fl[f][1];
            wobRR(c, fx - 1.4, fy, 2.8, 24, 1, 310 + f); F(c, '#3f8f45');
            wobPoly(c, [[fx, fy + 12], [fx + 10, fy + 6], [fx + 4, fy + 14]], 320 + f, 0.4, 5); F(c, '#4ea052');
            for (var p = 0; p < 5; p++) { var a = p / 5 * TAU; wobCircle(c, fx + Math.cos(a) * 5, fy - 2 + Math.sin(a) * 5, 4.2, 330 + f * 5 + p); F(c, fl[f][2]); }
            c.beginPath(); c.arc(fx, fy - 2, 3.2, 0, TAU); F(c, '#ffb020');
          }
        }, { sa: 0.35, blur: 9, sy: -3 });
        // fantoche do herói (peças com colchete)
        SPR.hLegB = makeSprite([-6, -2, 12, 30], function (c) { wobRR(c, -5, -2, 10, 26, 5, 400); F(c, '#27325f'); wobRR(c, -5, 21, 15, 8, 4, 401); F(c, '#4a2e22'); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        SPR.hLegF = makeSprite([-6, -2, 12, 30], function (c) { wobRR(c, -5, -2, 10, 26, 5, 402); F(c, P.navy); wobRR(c, -5, 21, 15, 8, 4, 403); F(c, P.boot); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        SPR.hBody = makeSprite([-30, -88, 28, 2], function (c) {
          wobRR(c, -28, -40, 18, 32, 7, 410); F(c, P.orange);
          wobRR(c, -28, -40, 18, 12, 6, 411); F(c, P.orangeD);
          c.beginPath(); c.arc(-19, -20, 2.5, 0, TAU); F(c, '#ffd23f');
          wobRR(c, -15, -42, 30, 42, 13, 412); F(c, P.blue);
          wobRR(c, -15, -12, 30, 13, 6, 413); F(c, P.navy);
          c.strokeStyle = P.orangeD; c.lineWidth = 4.5; c.beginPath(); c.moveTo(-10, -40); c.lineTo(-4, -18); c.stroke();
          heroHead(c, 2, -61);
        }, { border: 2.8, sa: 0.3 });
        SPR.hArm = makeSprite([-6, -3, 6, 25], function (c) { wobRR(c, -4.5, -3, 9, 21, 4.5, 420); F(c, P.blue); wobCircle(c, 0, 19, 5, 421); F(c, P.skin); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        // fantoche do Mestre Tomé
        SPR.tLegB = makeSprite([-8, -2, 14, 24], function (c) { wobRR(c, -6, -2, 12, 20, 5, 430); F(c, '#4c3d5c'); wobRR(c, -7, 15, 17, 8, 4, 431); F(c, '#4a2e22'); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        SPR.tLegF = makeSprite([-8, -2, 14, 24], function (c) { wobRR(c, -6, -2, 12, 20, 5, 432); F(c, P.pants); wobRR(c, -7, 15, 17, 8, 4, 433); F(c, P.boot); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        SPR.tBody = makeSprite([-28, -106, 30, 4], function (c) {
          wobRR(c, -16, -40, 10, 26, 5, 440); F(c, P.tealD);
          wobRR(c, -21, -52, 42, 54, 18, 441); F(c, P.teal);
          wobRR(c, -13, -38, 30, 40, 8, 442); F(c, P.apron);
          wobRR(c, -7, -22, 18, 11, 4, 443); F(c, P.apronD);
          wobRR(c, -4, -30, 5, 12, 1.5, 444); F(c, '#ffd23f');
          c.strokeStyle = P.apronD; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, -36); c.lineTo(-19, -48); c.stroke();
          tomeHead(c, 0, -72);
        }, { border: 2.8, sa: 0.3 });
        SPR.tArm = makeSprite([-6, -3, 7, 30], function (c) { wobRR(c, -5, -3, 10.5, 24, 5, 450); F(c, P.teal); wobCircle(c, 0, 24, 6, 451); F(c, P.skin); }, { border: 2, sa: 0.25, blur: 3, sy: 2 });
        // efeitos
        SPR.starY = makeSprite([-9, -9, 9, 9], starDraw('#ffd23f'), { border: 1.6, sa: 0.25, blur: 3, sy: 1.5, pad: 6 });
        SPR.starB = makeSprite([-9, -9, 9, 9], starDraw('#6aa8ff'), { border: 1.6, sa: 0.25, blur: 3, sy: 1.5, pad: 6 });
        SPR.starP = makeSprite([-9, -9, 9, 9], starDraw('#ff7aa2'), { border: 1.6, sa: 0.25, blur: 3, sy: 1.5, pad: 6 });
        SPR.conf = ['#ffd23f', '#4a86e8', '#ff7aa2', '#3fa968', '#ff9a3c'].map(function (col, i) {
          return makeSprite([-4, -2.5, 4, 2.5], function (c) { wobRR(c, -4, -2.5, 8, 5, 1, 500 + i); F(c, col); }, { sa: 0.2, blur: 2, sy: 1, pad: 4 });
        });
        // cortina de teatro (transição)
        SPR.curtain = makeSprite([0, -20, 230, Hu + 20], function (c) {
          var pts = [[0, -20], [214, -20]], y;
          for (y = -20; y <= Hu + 20; y += 20) pts.push([214 + Math.sin(y * 0.05) * 6, y]);
          pts.push([0, Hu + 20]);
          wobPoly(c, pts, 520, 1.2, 8); F(c, '#d94848');
          for (var i = 0; i < 6; i++) { wobRR(c, 14 + i * 34, -20, 12, Hu + 40, 6, 530 + i); F(c, 'rgba(150,30,40,0.35)'); }
          for (i = 0; i < 6; i++) { wobRR(c, 30 + i * 34, -20, 5, Hu + 40, 2.5, 540 + i); F(c, 'rgba(255,190,170,0.25)'); }
        }, { sa: 0.4, blur: 12, sx: 4 });
        function starDraw(col) {
          return function (c) {
            var pts = [];
            for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 4 : 9; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
            wobPoly(c, pts, 560, 0.3, 3); F(c, col);
          };
        }
      }

      function paintAvatar(canvasEl, which) {
        var d = Math.min(2, window.devicePixelRatio || 1);
        canvasEl.width = 64 * d; canvasEl.height = 64 * d;
        var c = canvasEl.getContext('2d');
        c.setTransform(d, 0, 0, d, 0, 0); c.lineJoin = 'round'; c.lineCap = 'round';
        if (which === 'hero') {
          wobRR(c, 14, 48, 36, 30, 12, 600); F(c, P.blue); wobRR(c, 8, 50, 10, 22, 4, 601); F(c, P.orange);
          c.save(); c.translate(32, 32); c.scale(1.1, 1.1); heroHead(c, -4, 0); c.restore();
        } else {
          wobRR(c, 12, 52, 40, 30, 14, 602); F(c, P.teal); wobRR(c, 20, 56, 24, 30, 6, 603); F(c, P.apron);
          c.save(); c.translate(33, 35); c.scale(-1, 1); tomeHead(c, -2, 0); c.restore();
        }
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
        c.fillStyle = c.createPattern(noise, 'repeat'); c.fillRect(0, 0, canvasEl.width, canvasEl.height);
      }

      function layout() {
        var r = host.getBoundingClientRect();
        W = Math.max(200, r.width); H = Math.max(300, r.height);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        k = W / 390; Hu = H / k; S = k * dpr;
        GY = Math.round(Hu * 0.6);
        root.style.setProperty('--u', k.toFixed(4));
        buildSprites();
        paintAvatar(q('.papel-avh'), 'hero');
        paintAvatar(q('.papel-avt'), 'tome');
        elSay.style.bottom = 'calc(env(safe-area-inset-bottom,0px) + 20px + ' + ((66 + 22) * k) + 'px)';
      }
      var ro = null, lastW = 0, lastH = 0;
      if (window.ResizeObserver) {
        ro = new ResizeObserver(function () {
          var r = host.getBoundingClientRect();
          if (Math.abs(r.width - lastW) < 0.5 && Math.abs(r.height - lastH) < 0.5) return;
          lastW = r.width; lastH = r.height; layout();
        });
        ro.observe(host);
      }
      layout();
      lastW = W; lastH = H;

      var lastN = -1;
      function render(t) {
        var c = ctx, base = dpr * k;
        var pan = reduce ? 0 : (t < 3.35 ? lerp(-10, 0, easeInOut(seg(t, 0, 1.7))) : -10);
        var zoom = 1.06 + (reduce ? 0 : (t < 3.35 ? lerp(0, 0.03, easeInOut(seg(t, 0, 1.7))) : 0));
        var swayK = reduce ? 0.35 : 1;
        function sw(n, ph) { return Math.sin(t / LOOP * TAU * n + ph) * swayK; }
        function layer(f) {
          c.setTransform(base, 0, 0, base, 0, 0);
          var z = 1 + (zoom - 1) * f;
          c.translate(234, GY); c.scale(z, z); c.translate(-234 - pan * f, -GY);
        }
        c.setTransform(base, 0, 0, base, 0, 0);
        put(SPR.sky, 0, 0);

        layer(0.06);
        put(SPR.sun, 312, GY - 270, t / LOOP * TAU / 12 + (reduce ? 0 : 0));
        layer(0.12);
        put(SPR.cloud1, 84 + sw(1, 0) * 7, GY - 248 + sw(2, 1) * 2);
        put(SPR.cloud2, 238 - sw(1, 0.5) * 6, GY - 196 + sw(2, 2) * 2, 0, 0.72);
        put(SPR.cloud2, 396 + sw(1, 2) * 5, GY - 330, 0, 0.85);
        put(SPR.cloud1, -4 - sw(1, 1) * 4, GY - 150, 0, 0.6);

        // camadas de papel com balanço suave
        layer(0.22); c.translate(0, sw(1, 0.3) * 1.5); put(SPR.far, 0, 0, sw(1, 0) * 0.004);
        layer(0.3); c.translate(sw(1, 1.3) * 2, sw(1, 1.1) * 1.5); put(SPR.far2, 0, 0);
        layer(0.45); c.translate(sw(1, 2.2) * 2.5, sw(1, 2) * 2); put(SPR.mid, 0, 0, sw(1, 2.5) * 0.003);

        layer(1);
        // casa e árvores (atrás)
        var sm;
        for (sm = 0; sm < 3; sm++) {
          var sp2 = ((t / 1.2) + sm / 3) % 1;
          c.globalAlpha = Math.min(1, (1 - sp2) * 1.4);
          put(SPR.puff, 82 + sp2 * 16 + Math.sin(sp2 * 5) * 3, GY - 150 - sp2 * 46, sp2 * 2, 0.5 + sp2 * 0.8);
        }
        c.globalAlpha = 1;
        put(SPR.house, 60, GY + 2, sw(1, 0.2) * 0.012);
        put(SPR.tree, 130, GY + 4, sw(1, 1.2) * 0.03);
        put(SPR.pine, 372, GY + 4, sw(1, 2.1) * 0.03);
        put(SPR.bush, 316, GY + 4, sw(1, 0.7) * 0.03, 0.8);
        put(SPR.bush, -4, GY + 4, sw(1, 2.7) * 0.03);

        // vale, água e ponte
        put(SPR.trench, 0, 0);
        put(SPR.w0, Math.sin(t / 1.2 * TAU) * 7, 0);
        put(SPR.piles, 0, 0);
        put(SPR.w1, -Math.sin(t / 1.2 * TAU + 1) * 9, Math.sin(t / 1.2 * TAU) * 1.5);
        // peixinho de papel
        var fp = seg(t, 0.4, 1.3), WY = GY + 62;
        if (fp > 0 && fp < 1) {
          c.save(); c.translate(lerp(LB + 30, LB + 70, fp), WY + 6 - Math.sin(fp * Math.PI) * 34); c.rotate(lerp(-0.9, 0.9, fp));
          c.fillStyle = P.paperW; c.beginPath(); c.ellipse(0, 0, 11, 7, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-8, 0); c.lineTo(-17, -7); c.lineTo(-17, 7); c.closePath(); c.fill();
          c.fillStyle = '#ff9a3d'; c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-7, 0); c.lineTo(-14, -5); c.lineTo(-14, 5); c.closePath(); c.fill();
          c.fillStyle = P.ink; c.beginPath(); c.arc(4, -1, 1.4, 0, TAU); c.fill();
          c.restore();
        }
        put(SPR.w2, Math.sin(t / 1.2 * TAU + 2) * 8, Math.sin(t / 1.2 * TAU + 1) * 2);

        var gcx = DX0 + MISS * SEGW + SEGW / 2, deckC = GY + 4.5;
        // varetas + fantoches
        function rod(x, y) { c.fillStyle = '#d8b07a'; c.fillRect(x - 1.6, y, 3.2, 170); c.fillStyle = 'rgba(120,80,40,0.35)'; c.fillRect(x + 0.6, y, 1, 170); }
        function brad(x, y) { c.beginPath(); c.arc(x, y, 1.9, 0, TAU); c.fillStyle = '#d9a83a'; c.fill(); c.beginPath(); c.arc(x - 0.5, y - 0.5, 0.8, 0, TAU); c.fillStyle = '#fff1b0'; c.fill(); }
        var walk = t < 3.35 ? seg(t, 0, 1.3) : 0;
        var hx = lerp(38, 124, easeOut(walk) * 0.35 + walk * 0.65);
        var amp = t < 3.35 ? 1 - seg(t, 1.15, 1.4) : 1;
        var ph2 = t * TAU * 2.4, swing = Math.sin(ph2) * amp;
        var bob = Math.abs(Math.sin(ph2)) * 4 * amp;
        var jump = Math.sin(seg(t, 2.38, 2.72) * Math.PI) * 20;
        var tilt = swing * 0.05 + sw(2, 0.4) * 0.02;
        c.fillStyle = 'rgba(70,45,20,0.18)'; c.beginPath(); c.ellipse(hx, GY + 2, 20 - jump * 0.3, 4, 0, 0, TAU); c.fill();
        c.save(); c.translate(hx, GY - bob - jump); c.rotate(tilt);
        rod(-1, -27);
        put(SPR.hLegB, -3, -27, -swing * 0.5);
        put(SPR.hBody, 0, -27);
        put(SPR.hLegF, 4, -27, swing * 0.5);
        put(SPR.hArm, 6, -58, -swing * 0.6);
        brad(4, -27); brad(6, -58);
        c.restore();

        var talking = t > 0.8 && t < 2.0, cheer = t > 2.3 && t < 2.9;
        var mb = sw(3, 0) * 1.5 + (talking ? Math.abs(Math.sin(t * 10)) * 2 : 0);
        c.save(); c.translate(330, GY - mb); c.scale(-1, 1); c.rotate(sw(2, 1.7) * 0.025 + (talking ? Math.sin(t * 10) * 0.02 : 0));
        rod(0, -22);
        put(SPR.tLegB, -8, -22, 0.05);
        put(SPR.tLegF, 8, -22, -0.05);
        put(SPR.tArm, -12, -60, 0.15);
        put(SPR.tBody, 0, -22);
        var armA = (talking || cheer) ? -2.4 + Math.sin(t * 9) * 0.35 : -0.2;
        put(SPR.tArm, 13, -62, armA);
        brad(13, -62);
        c.restore();

        function drawPiece() {
        // contorno tracejado (lápis) da peça que falta
        if (t < 2.2 || t >= 3.35) {
          c.save(); c.setLineDash([4, 4]); c.lineDashOffset = -t * 16; c.lineWidth = 2; c.strokeStyle = 'rgba(255,253,246,' + (0.65 + 0.3 * Math.sin(t / LOOP * TAU * 3)).toFixed(3) + ')';
          c.strokeRect(gcx - SEGW / 2 + 3, GY - 3, SEGW - 6, 15); c.restore();
        }

        // peça: surge dobrada, desdobra, desce e encaixa
        var placed = t >= 2.2 && t < 3.35;
        if (t >= 1.55 && t < 3.35) {
          var app = easeBack(seg(t, 1.55, 1.75));
          var unfold = easeInOut(seg(t, 1.7, 2.0));
          var fall = easeIn(seg(t, 1.95, 2.2));
          var py = placed ? deckC : lerp(deckC - 150, deckC, fall);
          var sq = placed ? 1 - Math.sin(seg(t, 2.2, 2.4) * Math.PI) * 0.2 : 1;
          var big = placed ? 1 : lerp(1.5, 1, fall);
          var rot = placed ? 0 : (1 - fall) * Math.sin(t * 5) * 0.1;
          var hov = placed ? 0 : (1 - fall) * Math.sin(t * 7) * 3;
          if (!placed) {
            c.fillStyle = 'rgba(40,60,90,' + (0.1 + 0.2 * fall).toFixed(3) + ')';
            c.beginPath(); c.ellipse(gcx, WY - 14, 8 + 14 * fall, 3, 0, 0, TAU); c.fill();
          }
          c.save(); c.translate(gcx, py + hov); c.rotate(rot); c.scale(app * big * (2 - sq), app * big * sq);
          var th = (1 - unfold) * Math.PI;       // ângulo da aba (π = dobrada por cima)
          var sp = SPR.plank, half = sp.w / 2;
          // metade esquerda fixa
          c.drawImage(sp.cv, 0, 0, sp.cv.width / 2, sp.cv.height, sp.x, sp.y, half, sp.h);
          var cw = Math.cos(th);
          if (cw >= 0) {
            c.drawImage(sp.cv, sp.cv.width / 2, 0, sp.cv.width / 2, sp.cv.height, 0, sp.y, half * cw, sp.h);
            if (cw < 0.98) { c.fillStyle = 'rgba(60,35,15,' + (0.3 * (1 - cw)).toFixed(3) + ')'; c.fillRect(0, -8.5, (SEGW / 2 - 1) * cw, 17); }
          } else {
            var bk = SPR.plankBack;
            c.save(); c.scale(-1, 1);
            c.drawImage(bk.cv, bk.cv.width / 2, 0, bk.cv.width / 2, bk.cv.height, 0, bk.y, half * -cw, bk.h);
            c.restore();
            c.fillStyle = 'rgba(255,255,255,' + (0.18 * -cw).toFixed(3) + ')'; c.fillRect(-(SEGW / 2 - 1) * -cw, -8.5, (SEGW / 2 - 1) * -cw, 17);
          }
          // vinco
          if (!placed && unfold < 1) { c.strokeStyle = 'rgba(80,50,25,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 9); c.stroke(); }
          c.restore();
          if (!placed) {
            for (var gs = 0; gs < 4; gs++) {
              var ph = (t * 2.5 + gs / 4) % 1, ang = gs / 4 * TAU + t;
              c.globalAlpha = Math.sin(ph * Math.PI);
              put([SPR.starY, SPR.starB, SPR.starP, SPR.starY][gs], gcx + Math.cos(ang) * 40, py + hov + Math.sin(ang) * 22, t * 3 + gs, 0.5 + ph * 0.4);
            }
            c.globalAlpha = 1;
          }
        }
        // efeitos do encaixe: confete de papel, estrelas, poeira
        if (t >= 2.2 && t < 3.05) {
          var q2 = seg(t, 2.2, 3.05), qe = easeOut(q2);
          for (var pf = 0; pf < 6; pf++) {
            var side = pf < 3 ? -1 : 1, kk = pf % 3;
            c.globalAlpha = 1 - q2;
            put(SPR.puff, gcx + side * (SEGW / 2 + qe * (12 + kk * 12)), deckC + 4 - qe * (6 + kk * 8), kk, (0.7 - kk * 0.15) * (1 - q2 * 0.5));
          }
          c.globalAlpha = 1;
          for (var cf = 0; cf < 12; cf++) {
            var an = -Math.PI / 2 + (cf - 5.5) * 0.24 + (rnd(cf, 700) - 0.5) * 0.2;
            var dist = 18 + qe * (60 + rnd(cf, 701) * 30);
            var cx2 = gcx + Math.cos(an) * dist, cy2 = deckC - 6 + Math.sin(an) * dist + q2 * q2 * 70;
            var spin = t * (6 + rnd(cf, 702) * 6) + cf;
            if (q2 > 0.85) c.globalAlpha = (1 - q2) / 0.15;
            if (cf % 3 === 0) put([SPR.starY, SPR.starB, SPR.starP][cf % 9 / 3 | 0], cx2, cy2, spin * 0.4, 0.9 - q2 * 0.3);
            else { c.save(); c.translate(cx2, cy2); c.rotate(spin); c.scale(1, Math.cos(spin * 1.3)); var cs = SPR.conf[cf % 5]; c.drawImage(cs.cv, cs.x, cs.y, cs.w, cs.h); c.restore(); }
            c.globalAlpha = 1;
          }
        }

        }
        // chão (frente do palco: esconde as varetas) e ponte
        put(SPR.ground, 0, 0);
        c.save(); c.translate(234, GY); c.rotate(sw(1, 0.9) * 0.004); c.translate(-234, -GY);
        put(SPR.bridge, 0, 0);
        c.restore();
        drawPiece();

        // primeiro plano
        layer(1.25); c.translate(sw(1, 3) * 3, sw(1, 2.6) * 2);
        put(SPR.fg, 0, 0, sw(1, 0.1) * 0.003);

        // cortina de teatro (emenda do loop)
        var cur = t < 3.02 ? 0 : t < 3.33 ? easeInOut(seg(t, 3.02, 3.33)) : 1 - easeInOut(seg(t, 3.37, 3.6));
        if (cur > 0) {
          c.setTransform(base, 0, 0, base, 0, 0);
          var off = (1 - cur) * 225;
          put(SPR.curtain, -20 - off, 0);
          c.save(); c.translate(410 + off, 0); c.scale(-1, 1); put(SPR.curtain, 0, 0); c.restore();
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
          elXp.style.top = ((GY - 90 - easeOut(xpP) * 56) * k) + 'px';
          elXp.style.transform = 'translate(-50%,-50%) rotate(' + (-4 + Math.sin(t * 6) * 3).toFixed(2) + 'deg) scale(' + pop.toFixed(3) + ')';
        } else elXp.style.opacity = 0;
        var sIn = seg(t, 0.8, 1.05), sOut = seg(t, 3.0, 3.18), sv = sIn > 0 && sOut < 1;
        elSay.style.opacity = sv ? (1 - sOut) : 0;
        elSay.style.transform = 'rotate(' + (-1.5 + (1 - easeOut(sIn)) * 6).toFixed(2) + 'deg) scale(' + (sv ? easeBack(sIn) * (1 - 0.1 * sOut) : 0.6).toFixed(3) + ')';
        var n = t >= 3.0 ? LINE.length : clamp(Math.floor((t - 0.95) * 40), 0, LINE.length);
        if (n !== lastN) { lastN = n; elLine.textContent = LINE.slice(0, n); }
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
          SPR = {};
          host.innerHTML = '';
        }
      };
    }
  };
})();
