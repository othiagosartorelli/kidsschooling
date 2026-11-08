/* KidsSchooling · Estilo PIXEL ART 2D
   Canvas de baixa resolução ampliado em escala inteira (pixels nítidos).
   Mapa pré-desenhado pixel a pixel (3 quadros de água/flores), sprites em matrizes de caracteres. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var LOOP = 3.6;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function hash(x, y, s) {
    var h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }
  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }

  /* ---------- paleta ---------- */
  var C = {
    out: '#2a1c16',
    g0: '#5cab4a', g1: '#58a546', g2: '#61b04e', gD: '#46913c', gL: '#7cc65e', gS: '#4a953f',
    p0: '#d8b27a', pD: '#c29763', pL: '#e8ca94', pE: '#b4874f', peb: '#a5876a',
    w0: '#3b88d6', wD: '#2d6db9', wDD: '#285f9f', wL: '#6fb8f0', wF: '#d4f1ff',
    c0: '#8f5f36', c1: '#7a4d2b', c2: '#5e3a20',
    wd0: '#a8693a', wdL: '#cf9156', wdD: '#86502c', wdS: '#52301a', wdT: '#e0a868',
    t0: '#2f7a3a', t1: '#3f9a45', t2: '#58b94f', t3: '#8fdc6a', tO: '#1d4a28',
    bark: '#7a4a2a', barkD: '#55321c'
  };

  /* ---------- sprites (matriz de caracteres -> cor), contorno automático ---------- */
  var SPAL = {
    h: '#5b3421', H: '#80502f', s: '#f4c39c', S: '#dc9c74', c: '#f59a8c', e: '#2a1c16', w: '#ffffff',
    b: '#3c7fe6', B: '#2a5bb8', L: '#7fb2ff', p: '#2f3c70', P: '#232c55', k: '#7a4325', K: '#56301a',
    r: '#f28a24', R: '#c8660f', Q: '#ffb45c', m: '#c4473f',
    y: '#ffcd33', Y: '#e0a21a', Z: '#fff1a0', W: '#ffffff', V: '#dfe5ee', g: '#c9cdd6',
    a: '#8d5a34', A: '#6b4022', t: '#d65a4a', T: '#a8433a', n: '#4c5374', N: '#383d58', o: '#2a1c16',
    x: '#ffe066', X: '#d9a020', G: '#7dd3fc', F: '#4aa36a', D: '#d8b27a', E: '#a5d4ff', M: '#e94f4f'
  };
  function makeSprite(rows, flip, outline) {
    var w = 0, h = rows.length, i, j;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var pad = outline === false ? 0 : 1;
    var cv = document.createElement('canvas');
    cv.width = w + pad * 2; cv.height = h + pad * 2;
    var cx = cv.getContext('2d');
    var id = cx.createImageData(cv.width, cv.height), d = id.data;
    var solid = [];
    for (j = 0; j < cv.height; j++) { solid.push([]); for (i = 0; i < cv.width; i++) solid[j].push(false); }
    function put(x, y, col) { var o = (y * cv.width + x) * 4, c = hex(col); d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var ch = rows[j].charAt(flip ? w - 1 - i : i);
      if (ch && ch !== '.' && ch !== ' ' && SPAL[ch]) { put(i + pad, j + pad, SPAL[ch]); solid[j + pad][i + pad] = true; }
    }
    if (pad) {
      for (j = 0; j < cv.height; j++) for (i = 0; i < cv.width; i++) {
        if (solid[j][i]) continue;
        if ((i > 0 && solid[j][i - 1]) || (i < cv.width - 1 && solid[j][i + 1]) || (j > 0 && solid[j - 1][i]) || (j < cv.height - 1 && solid[j + 1][i])) put(i, j, C.out);
      }
    }
    cx.putImageData(id, 0, 0);
    return cv;
  }

  // Herói (lado, olhando para a direita): cabeça+tronco e pernas separados (balanço ao andar)
  var HERO_TOP = [
    '...hhhhhh....',
    '..hhhhhhhHh..',
    '.hhhhhhhhhHh.',
    'hhhhhhhhhhhhh',
    'hhhhhhhhhhsss',
    'hhhhhhhsssss.',
    'hhhhhSsssesss',
    'hhhhSSsssess.',
    '.hhhSsssscss.',
    '..hhSsssssm..',
    '....SSSsss...',
    '...rrbbbbb...',
    '..rQrbbbbbb..',
    '..rrrRbLbbs..',
    '..rrrRbbbbs..',
    '..rrrRBbbb...',
    '...rrpppp....'
  ];
  var HERO_LEGS = [
    ['....ppPP....', '...pp..PP...', '..kk....KK..'],   // passo A
    ['.....pPp....', '.....pP.....', '.....kK.....'],   // passagem
    ['....PPpp....', '...PP..pp...', '..KK....kk..'],   // passo B
    ['.....Ppp....', '.....Pp.....', '.....Kk.....']    // passagem
  ];
  var HERO_IDLE = ['.....pPp....', '.....pPp....', '.....kKk....'];

  // Mestre Tomé (lado, olhando para a esquerda): capacete amarelo, barba branca, avental marrom
  var TOME_TOP = [
    '.....ZZyyyy....',
    '...Zyyyyyyyyy..',
    '..yyyyyyyyyyYY.',
    '..yyyyyyyyyyYY.',
    'YYYYYYYYYYYYYY.',
    '..ssssssggggg..',
    '.ssesssssgggg..',
    '.sssssssSgggg..',
    'sssWWsscsSggg..',
    '.WWWWWWWWWWg...',
    '.WWWWWWWWWWV...',
    '..WWWWWWWWV....',
    '..tWWWWWWVtt...',
    '.ttaWWWWVaatT..',
    'ssaaaVVaaaatT..',
    '.taaaaaaaaatT..',
    '..aaAaaaAaaTT..',
    '..aaaaaaaaaT...',
    '..AaaaaaaaaA...'
  ];
  var TOME_LEGS = ['...nnN.nnN...', '...nnN.nnN...', '..KKKk.KKKk..'];
  var TOME_ARM_UP = ['ss.', 'ts.', 'tt.']; // mão levantada ao falar

  // Rostos de frente (avatar e retrato)
  var HERO_FACE = [
    '.....hhhhhh.....',
    '...hhhhhhhhhH...',
    '..hhhhhhhhhhhH..',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhsshhhhsshhh.',
    '.hhsssssssssshh.',
    '.hssseesseesssh.',
    '.hsssweessewssh.',
    'Sscssssssssscss',
    '.Sssssm..msssS.',
    '..sssssmmssss..',
    '...SSssssssSS...',
    '...bbbbwwbbbb...',
    '..rbbbbbbbbbbr..',
    '.rrbbbLbbbbbbrr.'
  ];
  var TOME_FACE = [
    '....ZZyyyyyy....',
    '...Zyyyyyyyyy...',
    '..yyyyyyyyyyyY..',
    '..yyyyyyyyyyyY..',
    '.YYYYYYYYYYYYYY.',
    '.ggssssssssssgg.',
    '.gsseesssseessg.',
    '.gsssssssssssg..',
    '.gcsssSSSssscg..',
    '.WWWWsssssWWWW..',
    '.WWWWWWWWWWWWWW.',
    '.VWWWWWmmWWWWWV.',
    '..VWWWWWWWWWWV..',
    '..tVWWWWWWWWVt..',
    '.ttaaVWWWWVaatt.',
    'ttaaaaVWWVaaaatt'
  ];
  var ICON_HAMMER = [
    '..aaaaaaa...',
    '.aAAAAAAAa..',
    '.aAAAAAAAa..',
    '..aaaaaaa...',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '.....KK.....'
  ];
  ICON_HAMMER = [
    '.gggggggg...',
    'gWWWWWWWgg..',
    'gggggggggg..',
    '....kk......',
    '....kk......',
    '....kk......',
    '....kk......',
    '....kk......',
    '....KK......',
    '....KK......'
  ];
  var ICON_BAG = [
    '...rrrrrr...',
    '..rR....Rr..',
    '.rrrrrrrrrr.',
    'rQQrrrrrrrrr',
    'rQrrrxxrrrRr',
    'rrrrrxxrrrRr',
    'rrrrrrrrrrRr',
    'rRRRRRRRRRRr',
    'rrrrrrrrrrRr',
    '.RRRRRRRRRR.'
  ];
  var ICON_MAP = [
    'DDDD.DDDD.DD',
    'DFFDDDGGDDDD',
    'DFFFDGGGDDMD',
    'DDFDDGGDDMDD',
    'DDDDGGDDDDDD',
    'DDDGGDDMMDDD',
    'DDGGDDMMDFFD',
    'DGGDDDDDDFFD',
    'DDDDD.DDDDDD',
    '.DD...DDD...'
  ];
  var ICON_SCROLL = [
    '.xxxxxxxxx.',
    'xXZZZZZZZXx',
    '.xZooZooZx.',
    '.xZZZZZZZx.',
    '.xZoooZooZx',
    '.xZZZZZZZx.',
    '.xZooZoooZ.',
    'xXZZZZZZZXx',
    '.xxxxxxxxx.'
  ];

  /* ---------- mapa ---------- */
  var MW = 212, MH = 440;
  var RY0 = 200, RY1 = 248;              // riacho
  var BX0 = 104, BX1 = 132;              // ponte (x)
  var BY0 = 190, BY1 = 262;              // ponte (y)
  var PLH = 6, NPL = 12, MISS = 5;       // tábuas
  var PATHY = 274;                       // linha dos pés no caminho

  function inRiver(x, y) { return y >= RY0 && y <= RY1 + (hash(x >> 2, 7) < 0.5 ? 0 : 1); }
  function isPath(x, y) {
    var j1 = hash(x >> 2, 11) < 0.35 ? 1 : 0, j2 = hash(x >> 2, 12) < 0.35 ? 1 : 0;
    if (x <= 176 - (hash(y >> 2, 13) < 0.5 ? 1 : 0) && y >= 267 + j1 && y <= 282 - j2) return true;
    var jy = hash(y >> 2, 14) < 0.4 ? 1 : 0;
    if (x >= 101 + jy && x <= 135 - jy && y >= BY1 - 4 && y <= 270) return true;
    if (x >= 108 + jy && x <= 128 - jy && y >= 168 && y <= 196) return true;
    if (y >= 168 + j1 && y <= 181 - j2 && x >= 52 && x <= 128) return true;
    return false;
  }

  function Raster(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  Raster.prototype.px = function (x, y, col) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var o = (y * this.w + x) * 4, c = typeof col === 'string' ? hex(col) : col;
    this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = 255;
  };
  Raster.prototype.rect = function (x, y, w, h, col) {
    var c = hex(col), i, j;
    for (j = y; j < y + h; j++) for (i = x; i < x + w; i++) this.px(i, j, c);
  };
  Raster.prototype.dark = function (x, y, k) { // escurece
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var o = (y * this.w + x) * 4;
    this.d[o] *= k; this.d[o + 1] *= k; this.d[o + 2] *= k;
  };
  Raster.prototype.sprite = function (rows, x, y) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var ch = rows[j].charAt(i);
      if (ch !== '.' && SPAL[ch]) this.px(x + i, y + j, SPAL[ch]);
    }
  };
  // blob genérico com sombreamento pontilhado (Bayer) e contorno
  Raster.prototype.blob = function (x0, y0, x1, y1, inside, tones, outline, lx, ly) {
    var i, j, k;
    for (j = y0; j <= y1; j++) for (i = x0; i <= x1; i++) {
      var v = inside(i, j);
      if (v === false) continue;
      var edge = inside(i - 1, j) === false || inside(i + 1, j) === false || inside(i, j - 1) === false || inside(i, j + 1) === false;
      if (edge && outline) { this.px(i, j, outline); continue; }
      var l = clamp(v + (bayer(i, j) - 0.5) * 0.35, 0, 0.999);
      k = Math.floor(l * tones.length);
      this.px(i, j, tones[k]);
    }
  };

  function drawTree(R, cx, cy, r, fruit, seed) {
    var i, j;
    // sombra
    for (j = -3; j <= 4; j++) for (i = -r - 2; i <= r + 3; i++) {
      if ((i * i) / ((r + 2) * (r + 2)) + (j * j) / 16 <= 1) R.dark(cx + i + 2, cy + r + 3 + j, 0.8);
    }
    // tronco
    for (j = 0; j < 9; j++) for (i = -3; i <= 2; i++) {
      var col = i === -3 || i === 2 ? C.barkD : (i === -2 ? '#9a6238' : C.bark);
      if (j === 8 && (i === -3 || i === 2)) continue;
      R.px(cx + i, cy + r - 3 + j, col);
    }
    R.px(cx - 4, cy + r + 5, C.barkD); R.px(cx + 3, cy + r + 5, C.barkD);
    var circles = [[cx, cy, r], [cx - r * 0.55, cy + r * 0.3, r * 0.68], [cx + r * 0.55, cy + r * 0.25, r * 0.7], [cx - r * 0.1, cy - r * 0.35, r * 0.75]];
    function inside(x, y) {
      for (var k = 0; k < circles.length; k++) {
        var c = circles[k], dx = x - c[0], dy = y - c[1];
        if (dx * dx + dy * dy <= c[2] * c[2]) {
          var nx = (x - cx) / r, ny = (y - cy) / r;
          var ln = 0.55 - 0.42 * nx - 0.5 * ny + (hash(x, y, seed) - 0.5) * 0.18;
          // pequenos "tufos" de folhas
          var ring = Math.sin((x * 0.9 + y * 1.3)) * 0.06;
          return clamp(ln + ring, 0, 1);
        }
      }
      return false;
    }
    R.blob(cx - r * 2, cy - r * 2, cx + r * 2, cy + r * 2, inside, [C.t0, C.t1, C.t2, C.t3], C.tO);
    if (fruit) {
      for (var f = 0; f < 6; f++) {
        var fx = Math.round(cx + (hash(f, seed, 3) - 0.5) * r * 1.4), fy = Math.round(cy + (hash(f, seed, 4) - 0.4) * r * 1.2);
        if (inside(fx, fy) !== false && inside(fx + 1, fy + 1) !== false) {
          R.px(fx, fy, '#e5484d'); R.px(fx + 1, fy, '#e5484d'); R.px(fx, fy + 1, '#b83238'); R.px(fx + 1, fy + 1, '#e5484d'); R.px(fx, fy, '#ff9a9a');
        }
      }
    }
  }
  function drawBush(R, cx, cy, r, seed, berries) {
    var i, j;
    for (j = -2; j <= 2; j++) for (i = -r - 1; i <= r + 2; i++) if ((i * i) / ((r + 1) * (r + 1)) + (j * j) / 4 <= 1) R.dark(cx + i + 1, cy + r - 1 + j, 0.82);
    var circles = [[cx - r * 0.45, cy + 1, r * 0.7], [cx + r * 0.45, cy + 1, r * 0.7], [cx, cy - r * 0.2, r * 0.8]];
    function inside(x, y) {
      for (var k = 0; k < circles.length; k++) {
        var c = circles[k], dx = x - c[0], dy = y - c[1];
        if (dx * dx + dy * dy <= c[2] * c[2]) return clamp(0.6 - 0.4 * (x - cx) / r - 0.6 * (y - cy) / r + (hash(x, y, seed) - 0.5) * 0.2, 0, 1);
      }
      return false;
    }
    R.blob(cx - r * 2, cy - r * 2, cx + r * 2, cy + r * 2, inside, [C.t0, C.t1, C.t2, C.t3], C.tO);
    if (berries) for (var b = 0; b < 4; b++) {
      var bx = Math.round(cx + (hash(b, seed, 9) - 0.5) * r * 1.2), by = Math.round(cy + (hash(b, seed, 8) - 0.5) * r * 0.8);
      if (inside(bx, by) !== false) { R.px(bx, by, '#ff7eb6'); R.px(bx + 1, by, '#ffd1e6'); }
    }
  }
  function drawRock(R, cx, cy, rx, ry, seed, wet) {
    function inside(x, y) {
      var dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) return false;
      return clamp(0.6 - 0.5 * dx - 0.6 * dy + (hash(x, y, seed) - 0.5) * 0.2, 0, 1);
    }
    R.blob(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, inside, ['#6f7680', '#8d949e', '#aeb5bf', '#d3d8de'], '#3a3f48');
  }

  function buildMap(f) {
    var R = new Raster(MW, MH), x, y, i, j, k;
    var gTones = [hex(C.g0), hex(C.g1), hex(C.g2)];
    // grama com variação por tile
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      var tv = hash(x >> 3, y >> 3, 1);
      R.px(x, y, gTones[tv < 0.5 ? 0 : tv < 0.78 ? 1 : 2]);
    }
    for (y = 1; y < MH; y++) for (x = 1; x < MW - 1; x++) {
      var hv = hash(x, y, 2);
      if (hv < 0.010) { R.px(x, y, C.gD); R.px(x - 1, y - 1, C.gD); R.px(x + 1, y - 1, C.gD); R.px(x, y - 1, C.gS); }
      else if (hv < 0.018) { R.px(x, y, C.gL); }
      else if (hv < 0.021) { R.px(x, y, C.gL); R.px(x + 1, y, C.gL); R.px(x, y + 1, C.gS); }
    }
    // caminho de terra
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      if (!isPath(x, y)) continue;
      var e = !isPath(x - 1, y) || !isPath(x + 1, y) || !isPath(x, y - 1) || !isPath(x, y + 1);
      var pv = hash(x, y, 5);
      if (e) R.px(x, y, !isPath(x, y - 1) ? C.pE : C.pD);
      else R.px(x, y, pv < 0.06 ? C.pD : pv < 0.12 ? C.pL : C.p0);
      if (!e && pv > 0.993) { R.px(x, y, C.peb); R.px(x + 1, y, '#c7ad90'); }
    }
    // grama sobre a borda superior do caminho (sombra)
    for (x = 0; x < MW; x++) for (y = 0; y < MH; y++) if (isPath(x, y) && !isPath(x, y - 1) && hash(x, y, 31) < 0.4) R.px(x, y, C.gS);

    // flores
    var fcols = ['#ff6b8a', '#ffffff', '#ffd23f', '#b48cff', '#ff8c42', '#ffffff'];
    for (k = 0; k < 150; k++) {
      x = 2 + Math.floor(hash(k, 1, 40) * (MW - 4)); y = 2 + Math.floor(hash(k, 2, 40) * (MH - 4));
      if (isPath(x, y) || isPath(x + 2, y + 2) || isPath(x - 2, y - 2) || (y > RY0 - 9 && y < RY1 + 5)) continue;
      var fc = fcols[k % fcols.length], sw = (f === 1 && k % 2 === 0) ? 1 : (f === 2 && k % 3 === 0 ? -1 : 0);
      R.px(x, y + 2, C.gD);
      R.px(x + sw, y + 1, '#3f8a36');
      R.px(x + sw, y - 1, fc); R.px(x + sw - 1, y, fc); R.px(x + sw + 1, y, fc); R.px(x + sw, y + 1 - 1 + 1, fc);
      R.px(x + sw, y, '#ffe066');
      if (fc === '#ffffff') R.px(x + sw, y, '#f5b82e');
    }

    // margem de cima (barranco)
    for (x = 0; x < MW; x++) {
      var lip = hash(x >> 1, 50) < 0.5 ? 1 : 0;
      for (y = RY0 - 6; y < RY0; y++) {
        var dy = y - (RY0 - 6), col;
        if (dy < lip) col = C.gS;
        else if (dy === 5) col = C.c2;
        else col = ((x + (dy >> 1) * 3) % 7 === 0) ? C.c1 : (dy === 1 + lip ? '#a3703f' : C.c0);
        R.px(x, y, col);
      }
      if (hash(x, 51) < 0.12) R.px(x, RY0 - 3, '#b5b0a5');
    }
    // água animada
    for (y = RY0; y <= RY1 + 1; y++) for (x = 0; x < MW; x++) {
      if (!inRiver(x, y)) continue;
      var d = y - RY0, wc = C.w0;
      if (d < 3) wc = C.wDD; else if (d < 6) wc = (bayer(x, y) < (6 - d) / 4) ? C.wD : C.w0;
      else if (((y + (x >> 4)) % 9 === 0) && ((x + f * 3) % 11 < 5)) wc = '#4693dd';
      R.px(x, y, wc);
      if (y >= RY1 - 1 && inRiver(x, y + 1) === false) {
        if ((x + f) % 3 !== 0) R.px(x, y, C.wF);
      }
    }
    for (k = 0; k < 46; k++) {
      var sx = Math.floor(hash(k, 3, 60) * MW), sy = RY0 + 7 + Math.floor(hash(k, 4, 60) * (RY1 - RY0 - 10));
      var len = 3 + Math.floor(hash(k, 5, 60) * 5) + (f === 1 ? 1 : 0) - (f === 2 ? 1 : 0);
      var ox = (sx + f * 2) % MW;
      for (i = 0; i < len; i++) R.px((ox + i) % MW, sy, i === 0 || i === len - 1 ? '#5aa6e8' : C.wL);
      if (hash(k, f, 61) < 0.35) R.px((ox + len + 2) % MW, sy - 1, '#ffffff');
    }
    // pedras e vitórias-régias no riacho
    function foamRing(cx, cy, rx, ry) {
      for (var a = 0; a < 28; a++) {
        var an = a / 28 * Math.PI * 2 + f * 0.3;
        if ((a + f) % 2) R.px(Math.round(cx + Math.cos(an) * (rx + 2)), Math.round(cy + Math.sin(an) * (ry + 1.5)), C.wF);
      }
    }
    foamRing(30, 236, 5, 3); drawRock(R, 30, 236, 5, 3, 3, true);
    foamRing(190, 214, 4, 3); drawRock(R, 190, 214, 4, 3, 4, true);
    foamRing(62, 212, 2, 2); drawRock(R, 62, 212, 2, 2, 5, true);
    function lily(cx, cy, flower) {
      for (j = -3; j <= 3; j++) for (i = -4; i <= 4; i++) {
        if ((i * i) / 16 + (j * j) / 9 > 1) continue;
        if (i >= 0 && Math.abs(j) <= Math.max(0, i - 2) * 0) continue;
        var notch = (j === 0 && i > 0) || (j === -1 && i > 2);
        if (notch) continue;
        R.px(cx + i, cy + j, (i + j < -2) ? '#7dc46a' : (i + j > 3 ? '#3f8f45' : '#5bb05a'));
      }
      if (flower) { R.px(cx - 1, cy - 1, '#ff9ec7'); R.px(cx, cy - 2, '#ffc4dd'); R.px(cx + 1, cy - 1, '#ff9ec7'); R.px(cx, cy - 1, '#ffe066'); }
    }
    lily(80, 238, true); lily(160, 230, false); lily(170, 238, true); lily(14, 214, false);

    // ponte: sombra na água
    for (y = RY0; y <= RY1 + 1; y++) for (x = BX1 + 4; x <= BX1 + 7; x++) if (inRiver(x, y)) R.dark(x, y, 0.72);
    for (x = BX0 - 3; x <= BX1 + 6; x++) R.dark(x, RY1 + 2, 0.8);
    // estacas na água
    function pile(px, py) {
      R.rect(px, py, 4, 6, C.wdD); R.rect(px + 1, py, 1, 6, C.wd0); R.rect(px, py + 5, 4, 1, C.wdS);
      R.px(px - 1, py + 6, C.wF); R.px(px + 4, py + 6, C.wF); R.px(px + 1 + (f % 2), py + 7, C.wF);
    }
    pile(BX0 - 3, RY0 + 16); pile(BX1, RY0 + 16); pile(BX0 - 3, RY1 - 12); pile(BX1, RY1 - 12);
    // tábuas
    for (k = 0; k < NPL; k++) {
      if (k === MISS) continue;
      drawPlank(R, BY0 + k * PLH, k);
    }
    // vão: sombra das tábuas vizinhas
    var gy = BY0 + MISS * PLH;
    for (x = BX0; x < BX1; x++) { R.dark(x, gy, 0.6); R.dark(x, gy + 1, 0.8); }
    // corrimãos (troncos) com postes
    function rail(rx) {
      for (y = BY0 - 3; y <= BY1 + 1; y++) {
        R.px(rx, y, C.wdS); R.px(rx + 1, y, C.wdL); R.px(rx + 2, y, C.wd0); R.px(rx + 3, y, C.wdS);
        if (hash(rx, y, 70) < 0.15) R.px(rx + 2, y, C.wdD);
      }
      for (y = BY0 - 5; y <= BY1; y += 18) {
        R.rect(rx - 1, y, 6, 7, C.wdS); R.rect(rx, y + 1, 4, 2, C.wdT); R.rect(rx, y + 3, 4, 3, C.wd0); R.px(rx, y + 3, C.wdL); R.px(rx + 3, y + 4, C.wdD);
        R.px(rx + 1, y + 1, '#f0c48a');
      }
    }
    rail(BX0 - 4); rail(BX1);

    // cerca branca na margem de cima
    function fence(x0, x1, fy) {
      for (x = x0; x <= x1; x++) { R.px(x, fy + 2, '#d9cfbb'); R.px(x, fy + 5, '#d9cfbb'); R.px(x, fy + 3, '#b9ad94'); R.px(x, fy + 6, '#b9ad94'); }
      for (x = x0; x <= x1; x += 5) {
        R.px(x, fy - 1, C.out); R.rect(x - 1, fy, 3, 8, C.out);
        R.px(x, fy, '#fbf6ea'); for (j = 1; j < 7; j++) R.px(x, fy + j, j < 3 ? '#fbf6ea' : '#e8dfcc');
        R.dark(x + 2, fy + 8, 0.8);
      }
    }
    fence(4, 98, 183); fence(140, 208, 183);

    // casinha
    var hx = 34, hw = 58, roofY = 112, wallY = 140, baseY = 172;
    for (y = roofY + 6; y < baseY + 4; y++) for (x = hx + hw; x < hx + hw + 6; x++) R.dark(x, y, 0.78);
    for (x = hx + 2; x < hx + hw + 6; x++) for (y = baseY; y < baseY + 4; y++) R.dark(x, y, 0.8);
    // paredes
    for (y = wallY; y < baseY; y++) for (x = hx; x < hx + hw; x++) {
      var wcol = '#f3e2c0';
      if (hash(x, y, 80) < 0.05) wcol = '#e8d4ae';
      if (y < wallY + 3) wcol = '#c9b48f';
      R.px(x, y, wcol);
    }
    for (y = wallY; y < baseY; y++) { R.px(hx, y, C.out); R.px(hx + hw - 1, y, C.out); R.px(hx + 1, y, '#8a5a33'); R.px(hx + 2, y, '#8a5a33'); R.px(hx + hw - 3, y, '#8a5a33'); R.px(hx + hw - 2, y, '#6b4022'); }
    for (x = hx; x < hx + hw; x++) { R.px(x, baseY - 5, '#9aa0a8'); for (y = baseY - 4; y < baseY; y++) R.px(x, y, ((x + (y % 2) * 3) % 6 === 0 || y === baseY - 1) ? '#6f747c' : '#a9afb7'); R.px(x, baseY, C.out); }
    // porta
    var dx0 = hx + 23;
    for (y = wallY + 11; y < baseY - 4; y++) for (x = dx0; x < dx0 + 12; x++) {
      var top = y - (wallY + 11);
      if (top === 0 && (x < dx0 + 2 || x > dx0 + 9)) continue;
      if (top === 1 && (x < dx0 + 1 || x > dx0 + 10)) continue;
      var dc = (x === dx0 || x === dx0 + 11 || top === 0 || (top === 1 && (x === dx0 + 1 || x === dx0 + 10))) ? C.out : ((x - dx0) % 4 === 0 ? '#6b3519' : '#94522c');
      if ((x - dx0) === 1 && dc !== C.out) dc = '#b06a3c';
      R.px(x, y, dc);
    }
    R.px(dx0 + 9, wallY + 22, '#ffd23f'); R.px(dx0 + 9, wallY + 23, '#c99a1a');
    R.rect(dx0 - 1, baseY - 4, 14, 1, '#8b8f97');
    // janelas
    function win(wx, wy) {
      R.rect(wx - 1, wy - 1, 12, 11, C.out);
      R.rect(wx, wy, 10, 9, '#7fc8f0');
      for (i = 0; i < 4; i++) R.px(wx + 1 + i, wy + 3 - i, '#d4f1ff');
      R.px(wx + 6, wy + 6, '#d4f1ff'); R.px(wx + 7, wy + 5, '#d4f1ff');
      R.rect(wx + 4, wy, 2, 9, '#f6efe0'); R.rect(wx, wy + 4, 10, 1, '#f6efe0');
      R.rect(wx - 2, wy + 9, 14, 3, '#7a4626'); R.rect(wx - 2, wy + 9, 14, 1, '#a8693a');
      for (i = 0; i < 12; i += 2) { R.px(wx - 1 + i, wy + 8, i % 4 ? '#ff6b8a' : '#ffd23f'); R.px(wx + i, wy + 8, '#3f9a45'); }
    }
    win(hx + 7, wallY + 9); win(hx + hw - 17, wallY + 9);
    // telhado
    for (y = roofY; y < wallY + 2; y++) {
      var ry = y - roofY, inset = ry < 2 ? 3 - ry : 0;
      for (x = hx - 4 + inset; x < hx + hw + 4 - inset; x++) {
        var rc;
        var row = (ry - 3) % 5, col2 = (x + (Math.floor((ry - 3) / 5) % 2) * 3) % 7;
        if (ry < 3) rc = ry === 0 ? C.out : '#9c3524';
        else if (y >= wallY) rc = y === wallY + 1 ? C.out : '#7c2a1c';
        else if (row === 0) rc = '#f08060';
        else if (row === 4) rc = '#a8402c';
        else if (col2 === 0) rc = '#b8432e';
        else rc = (hash(x, y, 90) < 0.06) ? '#e86a4a' : '#d9573b';
        if (x === hx - 4 + inset || x === hx + hw + 3 - inset) rc = C.out;
        R.px(x, y, rc);
      }
    }
    // chaminé
    for (y = 101; y < 119; y++) for (x = hx + 42; x < hx + 50; x++) {
      var cc = (x === hx + 42 || x === hx + 49) ? C.out : (((x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 || y % 4 === 0) ? '#7c818b' : '#a3a9b3');
      if (y <= 102) cc = y === 101 ? C.out : '#4b4f57';
      R.px(x, y, cc);
    }

    // placa perto da ponte
    R.rect(96, 186, 2, 8, C.wdS); R.rect(90, 178, 14, 8, C.out); R.rect(91, 179, 12, 6, C.wdL); R.rect(91, 183, 12, 2, C.wd0);
    R.px(94, 181, C.out); R.px(95, 181, C.out); R.px(96, 181, C.out); R.px(97, 181, C.out); R.px(98, 181, C.out); R.px(97, 180, C.out); R.px(97, 182, C.out);

    // materiais do construtor (perto do Mestre Tomé)
    function board(bx, by, w) { R.rect(bx - 1, by - 1, w + 2, 5, C.out); R.rect(bx, by, w, 3, C.wd0); R.rect(bx, by, w, 1, C.wdL); R.px(bx + 3, by + 1, C.wdD); R.px(bx + w - 5, by + 2, C.wdD); }
    for (x = 158; x < 186; x++) R.dark(x, 297, 0.8);
    board(160, 290, 22); board(158, 286, 22); board(161, 282, 20);
    R.rect(144, 288, 12, 8, C.out); R.rect(145, 289, 10, 6, '#e04a3a'); R.rect(145, 289, 10, 1, '#ff7a64'); R.rect(145, 293, 10, 1, '#b8352a'); R.rect(148, 286, 4, 1, C.out); R.px(147, 287, C.out); R.px(152, 287, C.out); R.px(149, 291, '#ffd23f'); R.px(150, 291, '#ffd23f');

    // árvores e arbustos (de cima para baixo)
    drawTree(R, 18, 46, 13, false, 1); drawTree(R, 64, 64, 12, true, 2); drawTree(R, 120, 40, 14, false, 3);
    drawTree(R, 170, 70, 13, true, 4); drawTree(R, 204, 34, 12, false, 5);
    drawTree(R, 12, 132, 12, true, 6); drawTree(R, 150, 128, 12, false, 7); drawTree(R, 196, 146, 11, false, 8);
    drawBush(R, 106, 152, 6, 11, true); drawBush(R, 180, 172, 5, 12, false); drawBush(R, 22, 168, 5, 13, true);
    drawTree(R, 16, 314, 13, false, 9); drawTree(R, 74, 330, 12, true, 10); drawTree(R, 198, 316, 12, false, 11);
    drawTree(R, 128, 350, 13, false, 12); drawTree(R, 30, 392, 12, true, 13); drawTree(R, 176, 396, 13, false, 14);
    drawBush(R, 112, 304, 6, 15, true); drawBush(R, 46, 296, 5, 16, false); drawBush(R, 92, 410, 6, 17, true);

    var cv = document.createElement('canvas');
    cv.width = MW; cv.height = MH;
    var cx = cv.getContext('2d'), id = cx.createImageData(MW, MH);
    id.data.set(R.d);
    cx.putImageData(id, 0, 0);
    return cv;
  }
  function drawPlank(R, y0, k) {
    var x, j, tone = hash(k, 0, 77);
    var base = tone < 0.33 ? C.wd0 : tone < 0.66 ? '#b0723f' : '#a06434';
    for (j = 0; j < PLH; j++) for (x = BX0; x < BX1; x++) {
      var col;
      if (j === PLH - 1) col = C.wdS;
      else if (j === 0) col = C.wdL;
      else if (j === PLH - 2) col = C.wdD;
      else col = hash(x >> 1, y0 + j, k) < 0.12 ? C.wdD : base;
      R.px(x, y0 + j, col);
    }
    R.px(BX0 + 2, y0 + 2, '#5d5f66'); R.px(BX1 - 3, y0 + 2, '#5d5f66');
  }
  // tábua solta (canvas) para a animação
  function makePlank() {
    var R = new Raster(BX1 - BX0 + 2, PLH + 2), x, j;
    for (j = 0; j < PLH + 2; j++) for (x = 0; x < BX1 - BX0 + 2; x++) R.px(x, j, C.out);
    for (j = 0; j < PLH - 1; j++) for (x = 0; x < BX1 - BX0; x++) {
      var col = j === 0 ? C.wdT : j === PLH - 2 ? C.wdD : (hash(x >> 1, j, 99) < 0.12 ? C.wdD : '#b8783f');
      R.px(x + 1, j + 1, col);
    }
    R.px(3, 3, '#5d5f66'); R.px(BX1 - BX0 - 2, 3, '#5d5f66');
    var cv = document.createElement('canvas'); cv.width = R.w; cv.height = R.h;
    var cx = cv.getContext('2d'), id = cx.createImageData(R.w, R.h); id.data.set(R.d); cx.putImageData(id, 0, 0);
    return cv;
  }

  /* ---------- bordas de janela RPG (9-slice gerado) ---------- */
  function windowBorder(fill, line, inner) {
    var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
    var cx = cv.getContext('2d');
    var corner = [
      '..dddd',
      '.dwwww',
      'dwwddd',
      'dwdiff',
      'dwdfff',
      'dwdfff'
    ];
    var map = { d: '#0f1236', w: line, i: inner, f: fill };
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var cxp = x < 6 ? x : (x > 9 ? 15 - x : 5), cyp = y < 6 ? y : (y > 9 ? 15 - y : 5);
      var ch = corner[cyp].charAt(cxp);
      if (ch === '.') continue;
      // bordas retas: usa coluna/linha 5 do canto
      if (x >= 6 && x <= 9 && y >= 6 && y <= 9) ch = 'f';
      cx.fillStyle = map[ch]; cx.fillRect(x, y, 1, 1);
    }
    return cv.toDataURL();
  }
  function bevelBorder(fill, light, dark) {
    var cv = document.createElement('canvas'); cv.width = 12; cv.height = 12;
    var cx = cv.getContext('2d');
    for (var y = 0; y < 12; y++) for (var x = 0; x < 12; x++) {
      var corner = (x === 0 || x === 11) && (y === 0 || y === 11);
      if (corner) continue;
      var col;
      if (x === 0 || y === 0 || x === 11 || y === 11 || ((x === 1 || x === 10) && (y === 1 || y === 10))) col = '#0f1236';
      else if (y >= 9 || x >= 10) col = dark;
      else if (y === 1 || x === 1) col = light;
      else col = fill;
      cx.fillStyle = col; cx.fillRect(x, y, 1, 1);
    }
    return cv.toDataURL();
  }
  function circleAvatar(rows, bg, ring) {
    var S = 22, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    var cx = cv.getContext('2d'), c = (S - 1) / 2;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var d = Math.sqrt((x - c) * (x - c) + (y - c) * (y - c));
      if (d > 10.9) continue;
      cx.fillStyle = d > 9.9 ? '#0f1236' : d > 8.4 ? ring : bg;
      if (d <= 8.4 && y > 13) cx.fillStyle = '#9fd9ff';
      cx.fillRect(x, y, 1, 1);
    }
    var sp = makeSprite(rows, false, true);
    cx.save();
    cx.beginPath();
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) { var dd = Math.sqrt((x - c) * (x - c) + (y - c) * (y - c)); if (dd <= 8.4) cx.rect(x, y, 1, 1); }
    cx.clip();
    cx.drawImage(sp, 2, 3);
    cx.restore();
    return cv;
  }

  /* ---------- montagem ---------- */
  window.SCENES['pixel'] = {
    mount: function (host) {
      var reduce = false;
      try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

      var maps = [buildMap(0), buildMap(1), buildMap(2)];
      var plank = makePlank();
      var heroTop = makeSprite(HERO_TOP, false), heroLegs = HERO_LEGS.map(function (r) { return makeSprite(r, false); });
      var heroIdle = makeSprite(HERO_IDLE, false);
      var tomeTop = makeSprite(TOME_TOP, false), tomeLegs = makeSprite(TOME_LEGS, false), tomeArm = makeSprite(TOME_ARM_UP, false);

      var root = document.createElement('div');
      root.className = 'pixel-root';
      root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#5cab4a;';
      host.appendChild(root);

      var style = document.createElement('style');
      var winImg = windowBorder('#25307a', '#ffffff', '#3a49a8');
      var tagImg = windowBorder('#c0532f', '#ffe7b0', '#d9693f');
      var btnImgs = [bevelBorder('#f28a24', '#ffc070', '#b8600e'), bevelBorder('#3c7fe6', '#8fbaff', '#2550a8'), bevelBorder('#3fa35a', '#8ad89a', '#287a3e')];
      style.textContent = [
        '.pixel-root, .pixel-root *{box-sizing:border-box;}',
        '.pixel-cv{position:absolute;left:0;top:0;image-rendering:pixelated;image-rendering:crisp-edges;}',
        '.pixel-hud{position:absolute;inset:0;pointer-events:none;font-family:"Pixelify Sans",system-ui,sans-serif;color:#fff;line-height:1.15;-webkit-font-smoothing:none;}',
        '.pixel-win{border-style:solid;border-color:transparent;border-width:calc(var(--px)*6);border-image-source:url(' + winImg + ');border-image-slice:6 fill;border-image-repeat:stretch;image-rendering:pixelated;}',
        '.pixel-top{position:absolute;left:calc(12px*var(--u));right:calc(12px*var(--u));top:calc(env(safe-area-inset-top,0px) + 34px);display:flex;flex-direction:column;gap:calc(6px*var(--u));}',
        '.pixel-row{display:flex;align-items:center;gap:calc(6px*var(--u));}',
        '.pixel-av{flex:none;image-rendering:pixelated;display:block;filter:drop-shadow(0 calc(var(--px)*1) 0 rgba(15,18,54,.55));}',
        '.pixel-stat{flex:1;min-width:0;padding:0 calc(4px*var(--u)) calc(1px*var(--u));}',
        '.pixel-lvl{font-size:calc(17px*var(--u));font-weight:700;letter-spacing:.02em;text-shadow:calc(var(--px)*1) calc(var(--px)*1) 0 #0f1236;white-space:nowrap;}',
        '.pixel-lvl b{color:#ffd23f;font-weight:700;}',
        '.pixel-xprow{display:flex;align-items:center;gap:calc(6px*var(--u));margin-top:calc(3px*var(--u));}',
        '.pixel-xp{position:relative;flex:1;height:calc(var(--px)*6);background:#0f1236;padding:var(--px);}',
        '.pixel-xpin{position:relative;height:100%;background:#2c2f5e;overflow:hidden;}',
        '.pixel-xpfill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#fff3a0 0 34%,#ffd23f 34% 70%,#e09a10 70%);}',
        '.pixel-xpticks{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(var(--px)*7),rgba(15,18,54,.55) calc(var(--px)*7) calc(var(--px)*8));}',
        '.pixel-xptxt{font-size:calc(12.5px*var(--u));color:#cfe0ff;white-space:nowrap;font-variant-numeric:tabular-nums;}',
        '.pixel-xptxt b{color:#ffd23f;}',
        '.pixel-mis{align-self:flex-start;display:flex;align-items:center;gap:calc(7px*var(--u));padding:0 calc(6px*var(--u)) 0 calc(3px*var(--u));font-size:calc(14px*var(--u));max-width:100%;}',
        '.pixel-mis span{color:#ffd23f;}',
        '.pixel-mis canvas{image-rendering:pixelated;flex:none;}',
        '.pixel-dlg{position:absolute;left:calc(10px*var(--u));right:calc(10px*var(--u));display:flex;gap:calc(8px*var(--u));align-items:flex-start;transform-origin:50% 100%;min-height:calc(104px*var(--u));padding:calc(16px*var(--u)) calc(4px*var(--u)) calc(2px*var(--u));}',
        '.pixel-dlg .pixel-por{flex:none;image-rendering:pixelated;background:#9fd9ff;border:var(--px) solid #0f1236;box-shadow:0 0 0 var(--px) #fff;margin:calc(var(--px)*1);}',
        '.pixel-name{position:absolute;left:calc(14px*var(--u));top:calc(var(--px)*-12);font-size:calc(14px*var(--u));font-weight:700;padding:0 calc(5px*var(--u));color:#fff3d0;}',
        '.pixel-txt{flex:1;font-size:calc(17.5px*var(--u));line-height:1.3;letter-spacing:.01em;min-height:3.9em;text-shadow:var(--px) var(--px) 0 #0f1236;}',
        '.pixel-car{position:absolute;right:calc(10px*var(--u));bottom:calc(2px*var(--u));color:#ffd23f;font-size:calc(13px*var(--u));}',
        '.pixel-btns{position:absolute;left:calc(10px*var(--u));right:calc(10px*var(--u));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(8px*var(--u));}',
        '.pixel-btn{flex:1;height:calc(70px*var(--u));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(3px*var(--u));border-style:solid;border-color:transparent;border-width:calc(var(--px)*4);border-image-slice:4 fill;border-image-repeat:stretch;image-rendering:pixelated;font-size:calc(15px*var(--u));font-weight:700;text-shadow:var(--px) var(--px) 0 rgba(15,18,54,.7);filter:drop-shadow(0 calc(var(--px)*2) 0 rgba(15,18,54,.55));}',
        '.pixel-btn canvas{image-rendering:pixelated;}',
        '.pixel-float{position:absolute;font-size:calc(24px*var(--u));font-weight:700;color:#ffd23f;white-space:nowrap;transform:translate(-50%,-50%);text-shadow:var(--px) 0 0 #0f1236,calc(var(--px)*-1) 0 0 #0f1236,0 var(--px) 0 #0f1236,0 calc(var(--px)*-1) 0 #0f1236,calc(var(--px)*2) calc(var(--px)*2) 0 #0f1236;opacity:0;}'
      ].join('\n');
      root.appendChild(style);

      var cv = document.createElement('canvas');
      cv.className = 'pixel-cv';
      root.appendChild(cv);
      var ctx = cv.getContext('2d');

      var hud = document.createElement('div');
      hud.className = 'pixel-hud';
      hud.innerHTML =
        '<div class="pixel-top">' +
          '<div class="pixel-row">' +
            '<canvas class="pixel-av"></canvas>' +
            '<div class="pixel-stat pixel-win">' +
              '<div class="pixel-lvl">Nível 4 · <b>Explorador</b></div>' +
              '<div class="pixel-xprow"><div class="pixel-xp"><div class="pixel-xpin"><div class="pixel-xpfill"></div><div class="pixel-xpticks"></div></div></div><div class="pixel-xptxt"><b>XP</b> <span class="pixel-xpn">620</span>/1000</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="pixel-mis pixel-win"><canvas class="pixel-misic"></canvas><div><span>Missão:</span> consertar a ponte da vila</div></div>' +
        '</div>' +
        '<div class="pixel-float">+50 XP</div>' +
        '<div class="pixel-dlg pixel-win">' +
          '<div class="pixel-name pixel-win" style="border-image-source:url(' + tagImg + ')">Mestre Tomé</div>' +
          '<canvas class="pixel-por"></canvas>' +
          '<div class="pixel-txt"></div><div class="pixel-car">▼</div>' +
        '</div>' +
        '<div class="pixel-btns">' +
          '<div class="pixel-btn" style="border-image-source:url(' + btnImgs[0] + ')"><canvas></canvas><span>Construir</span></div>' +
          '<div class="pixel-btn" style="border-image-source:url(' + btnImgs[1] + ')"><canvas></canvas><span>Mochila</span></div>' +
          '<div class="pixel-btn" style="border-image-source:url(' + btnImgs[2] + ')"><canvas></canvas><span>Mapa</span></div>' +
        '</div>';
      root.appendChild(hud);

      function q(sel) { return hud.querySelector(sel); }
      var elFill = q('.pixel-xpfill'), elXpN = q('.pixel-xpn'), elFloat = q('.pixel-float');
      var elDlg = q('.pixel-dlg'), elTxt = q('.pixel-txt'), elCar = q('.pixel-car');
      var avSrc = circleAvatar(HERO_FACE, '#ffe9a8', '#ffd23f');
      var porSrc = makeSprite(TOME_FACE, false, false);
      var icons = [makeSprite(ICON_HAMMER, false), makeSprite(ICON_BAG, false), makeSprite(ICON_MAP, false)];
      var misIcon = makeSprite(ICON_SCROLL, false);

      function blit(canvas, src, scale) {
        canvas.width = src.width; canvas.height = src.height;
        canvas.getContext('2d').drawImage(src, 0, 0);
        canvas.style.width = src.width * scale + 'px';
        canvas.style.height = src.height * scale + 'px';
      }

      var W = 0, H = 0, S = 3, LW = 0, LH = 0, u = 1, cssPx = 3, dlgBottom = 0;
      var LINE = 'A viga precisa se apoiar dos dois lados!';

      function layout() {
        var r = host.getBoundingClientRect();
        W = Math.max(200, r.width); H = Math.max(300, r.height);
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        S = Math.max(2, Math.round(W * dpr / 125));
        LW = Math.ceil(W * dpr / S); LH = Math.ceil(H * dpr / S);
        cv.width = LW; cv.height = LH;
        cssPx = S / dpr;
        cv.style.width = (LW * cssPx) + 'px'; cv.style.height = (LH * cssPx) + 'px';
        ctx.imageSmoothingEnabled = false;
        u = W / 390;
        var hp = Math.max(2, Math.round(2.2 * u));
        root.style.setProperty('--u', u.toFixed(4));
        root.style.setProperty('--px', hp + 'px');
        var ap = Math.max(2, Math.round(2.9 * u));
        blit(q('.pixel-av'), avSrc, ap);
        blit(q('.pixel-por'), porSrc, Math.max(2, Math.round(3.4 * u)));
        blit(q('.pixel-misic'), misIcon, hp);
        var bc = hud.querySelectorAll('.pixel-btn canvas');
        for (var i = 0; i < bc.length; i++) blit(bc[i], icons[i], Math.max(2, Math.round(2.4 * u)));
        // diálogo logo acima dos botões
        var btnH = 70 * u;
        elDlg.style.bottom = 'calc(env(safe-area-inset-bottom,0px) + 20px + ' + (btnH + 16 * u) + 'px)';
      }

      var ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(function () { layout(); }); ro.observe(host); }
      layout();

      // padrões de pontilhado para a transição do loop
      var ditherPats = [];
      for (var lvl = 0; lvl <= 16; lvl++) {
        var pc = document.createElement('canvas'); pc.width = 4; pc.height = 4;
        var pcx = pc.getContext('2d'); pcx.fillStyle = '#12142e';
        for (var dy = 0; dy < 4; dy++) for (var dx = 0; dx < 4; dx++) if (BAYER[dy * 4 + dx] < lvl) pcx.fillRect(dx, dy, 1, 1);
        ditherPats.push(ctx.createPattern(pc, 'repeat'));
      }

      function pxCircle(x, y, r, col) {
        ctx.fillStyle = col;
        for (var j = -r; j <= r; j++) {
          var w = Math.round(Math.sqrt(Math.max(0, r * r - j * j + r * 0.6)));
          ctx.fillRect(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1);
        }
      }
      function shadow(x, y, w) {
        ctx.fillStyle = 'rgba(20,50,20,0.28)';
        ctx.fillRect(Math.round(x - w + 1), Math.round(y - 1), w * 2 - 1, 1);
        ctx.fillRect(Math.round(x - w), Math.round(y), w * 2 + 1, 1);
        ctx.fillRect(Math.round(x - w + 1), Math.round(y + 1), w * 2 - 1, 1);
      }
      function star(x, y, size, col) {
        x = Math.round(x); y = Math.round(y);
        ctx.fillStyle = col;
        ctx.fillRect(x - size, y, size * 2 + 1, 1);
        ctx.fillRect(x, y - size, 1, size * 2 + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      }

      var start = performance.now(), raf = 0, lastTyped = -1, lastXp = -1;

      function render(t) {
        var camBaseX = Math.round((BX0 + BX1) / 2 - LW * 0.6);
        var camBaseY = Math.round(PATHY - LH * 0.70);
        var settle = t < 3.35 ? easeInOut(seg(t, 0, 1.5)) : 0;
        var camX = camBaseX + (reduce ? 0 : Math.round(lerp(-8, 0, settle)));
        var camY = camBaseY + (reduce ? 0 : Math.round(lerp(4, 0, settle)));
        if (!reduce && t > 2.12 && t < 2.3) camY += (Math.floor(t * 40) % 2 ? 1 : -1);
        var f = Math.floor(t / 0.3) % 3;

        ctx.drawImage(maps[f], -camX, -camY);

        function X(v) { return Math.round(v - camX); }
        function Y(v) { return Math.round(v - camY); }

        // fumaça da chaminé
        for (var k = 0; k < 3; k++) {
          var p = ((t / 1.2) + k / 3) % 1;
          var a = (1 - p) * 0.85;
          pxCircle(X(80 + p * 8 + Math.sin(p * 7 + k) * 2), Y(99 - p * 26), Math.round(1 + p * 3), 'rgba(255,255,255,' + a.toFixed(2) + ')');
        }

        // peça da ponte
        var slotY = BY0 + MISS * PLH;
        var placed = t >= 2.15 && t < 3.35;
        if (placed) {
          ctx.drawImage(plank, X(BX0 - 1), Y(slotY - 1));
          if (t < 2.27 && Math.floor(t * 30) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(X(BX0), Y(slotY), BX1 - BX0, PLH - 1); }
        } else if (t >= 1.55 && t < 2.15) {
          var appear = seg(t, 1.55, 1.75), fall = seg(t, 1.78, 2.15);
          var hgt = Math.round(lerp(40, 0, fall * fall));
          // sombra crescendo na água
          var sw = Math.round(lerp(6, (BX1 - BX0) / 2, fall));
          ctx.fillStyle = 'rgba(10,30,70,' + (0.25 + 0.3 * fall).toFixed(2) + ')';
          ctx.fillRect(X((BX0 + BX1) / 2 - sw), Y(slotY + 1), sw * 2, PLH - 2);
          if (appear > 0) {
            var py = Y(slotY - 1 - hgt) + (fall === 0 ? Math.round(Math.sin(t * 18) * 1) : 0);
            if (appear < 1) {
              // surge com um "zoom" em degraus
              var wv = Math.max(2, Math.round((BX1 - BX0 + 2) * appear));
              ctx.drawImage(plank, X((BX0 + BX1) / 2) - (wv >> 1), py, wv, PLH + 2);
            } else {
              if (Math.floor(t * 16) % 2 === 0) { ctx.fillStyle = '#fff27a'; ctx.fillRect(X(BX0 - 2), py - 1, BX1 - BX0 + 4, PLH + 4); }
              ctx.drawImage(plank, X(BX0 - 1), py);
            }
            // brilhinhos em volta
            for (var s2 = 0; s2 < 4; s2++) {
              var ph = (t * 3 + s2 / 4) % 1;
              var sx2 = BX0 - 6 + ((s2 * 13 + 5) % (BX1 - BX0 + 12));
              star(X(sx2), py - 3 - Math.round(ph * 8) + (s2 % 2) * 8, ph < 0.5 ? 1 : 0, '#fff27a');
            }
          }
        }
        // poeira e estrelinhas ao encaixar
        if (t >= 2.15 && t < 2.85) {
          var q2 = seg(t, 2.15, 2.85), qe = easeOut(q2);
          for (var d2 = 0; d2 < 6; d2++) {
            var side = d2 < 3 ? -1 : 1, kk = d2 % 3;
            var dxp = (side < 0 ? BX0 - 2 : BX1 + 1) + side * qe * (6 + kk * 5);
            var dyp = slotY + 2 - qe * (2 + kk * 3) + kk * 2;
            var rr = Math.max(0, Math.round((1 - q2) * (2 + (kk % 2))));
            if (rr > 0 || q2 < 0.8) pxCircle(X(dxp), Y(dyp), rr, 'rgba(245,232,200,' + (1 - q2).toFixed(2) + ')');
          }
          for (var st = 0; st < 8; st++) {
            var an = st / 8 * Math.PI * 2 + 0.3;
            var dist = 4 + qe * 22;
            var tw = Math.floor(t * 20 + st) % 3;
            if (q2 < 0.92) star(X((BX0 + BX1) / 2 + Math.cos(an) * dist * 1.2), Y(slotY + 2 + Math.sin(an) * dist * 0.8), tw === 0 ? 2 : 1, st % 2 ? '#ffd23f' : '#ffffff');
          }
        }

        // herói
        var hx0 = camBaseX + 16, hx1 = BX0 - 12;
        var walk = t < 3.35 ? seg(t, 0, 1.25) : 0;
        var hx = lerp(hx0, hx1, easeOut(walk) * 0.25 + walk * 0.75);
        var moving = t < 1.25;
        var hop = (t > 2.32 && t < 2.62) ? Math.round(Math.sin(seg(t, 2.32, 2.62) * Math.PI) * 6) : 0;
        var frame = Math.floor(t / 0.13) % 4;
        var bob = moving ? (frame % 2 === 1 ? -1 : 0) : (Math.floor(t / 0.5) % 2 ? 0 : 0);
        shadow(X(hx), Y(PATHY + 1), 6 - (hop > 3 ? 1 : 0));
        var legs = moving ? heroLegs[frame] : heroIdle;
        var hxs = X(hx) - 7, hys = Y(PATHY) - hop;
        ctx.drawImage(legs, hxs, hys - legs.height + 1);
        ctx.drawImage(heroTop, hxs, hys - legs.height + 1 - heroTop.height + 2 + bob);

        // Mestre Tomé
        var mx = BX1 + 18;
        var talking = t > 0.85 && t < 2.0;
        var mbob = talking ? (Math.floor(t / 0.15) % 2 ? -1 : 0) : (Math.floor(t / 0.6) % 2 ? -1 : 0);
        shadow(X(mx), Y(PATHY + 1), 7);
        var mxs = X(mx) - 8, mys = Y(PATHY);
        ctx.drawImage(tomeLegs, mxs + 1, mys - tomeLegs.height + 1);
        var topY = mys - tomeLegs.height + 1 - tomeTop.height + 2 + mbob;
        ctx.drawImage(tomeTop, mxs, topY);
        if (talking || (t > 2.2 && t < 2.9)) ctx.drawImage(tomeArm, mxs - 2, topY + 10 - (Math.floor(t / 0.2) % 2));

        // balãozinho "..." sobre o mentor
        if (t > 0.8 && t < 2.0) {
          var bx = X(mx) - 4, by = topY - 11;
          ctx.fillStyle = '#0f1236'; ctx.fillRect(bx - 1, by - 1, 17, 9); ctx.fillRect(bx + 2, by + 8, 3, 1); ctx.fillRect(bx + 3, by + 9, 1, 1);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, 15, 7); ctx.fillRect(bx + 3, by + 7, 1, 1);
          ctx.fillStyle = '#0f1236';
          var nd = 1 + Math.floor(t / 0.2) % 3;
          for (var di = 0; di < nd; di++) ctx.fillRect(bx + 3 + di * 4, by + 3, 2, 2);
        }

        // borboletas
        for (var bfy = 0; bfy < 2; bfy++) {
          var ang = (t / LOOP) * Math.PI * 2 * (bfy ? 1 : 2) + bfy * 2;
          var bxw = (bfy ? 60 : 168) + Math.cos(ang) * 12, byw = (bfy ? 300 : 160) + Math.sin(ang * 2) * 6 - 4;
          var flap = Math.floor(t / 0.1) % 2;
          ctx.fillStyle = bfy ? '#ffffff' : '#ffd23f';
          if (flap) { ctx.fillRect(X(bxw) - 2, Y(byw), 2, 2); ctx.fillRect(X(bxw) + 1, Y(byw), 2, 2); }
          else { ctx.fillRect(X(bxw) - 1, Y(byw), 1, 2); ctx.fillRect(X(bxw) + 1, Y(byw), 1, 2); }
          ctx.fillStyle = '#2a1c16'; ctx.fillRect(X(bxw), Y(byw), 1, 2);
        }

        // transição de loop (pontilhado clássico)
        var fade = t < 3.1 ? 0 : t < 3.35 ? seg(t, 3.1, 3.35) : 1 - seg(t, 3.35, 3.6);
        if (fade > 0) { ctx.fillStyle = ditherPats[Math.round(fade * 16)]; ctx.fillRect(0, 0, LW, LH); }

        /* --- HUD --- */
        var xp = 620 + 50 * easeOut(seg(t, 2.45, 2.85));
        if (t >= 3.1) xp = lerp(670, 620, easeInOut(seg(t, 3.1, 3.5)));
        var xpi = Math.round(xp);
        if (xpi !== lastXp) {
          lastXp = xpi;
          elXpN.textContent = xpi;
          elFill.style.width = (Math.floor(xpi / 10) / 100 * 100) + '%';
        }
        // "+50 XP"
        var fl = seg(t, 2.4, 3.05);
        if (fl > 0 && fl < 1) {
          elFloat.style.opacity = fl < 0.7 ? 1 : (1 - (fl - 0.7) / 0.3);
          var stepY = Math.round(easeOut(fl) * 10) * 3;
          elFloat.style.left = (X((BX0 + BX1) / 2) * cssPx) + 'px';
          elFloat.style.top = (Y(slotY - 14) * cssPx - stepY * u) + 'px';
        } else elFloat.style.opacity = 0;

        // caixa de diálogo
        var open = seg(t, 0.8, 0.95), close = seg(t, 3.0, 3.15);
        var k2 = open * (1 - close);
        if (k2 <= 0) { elDlg.style.visibility = 'hidden'; }
        else {
          elDlg.style.visibility = 'visible';
          var steps = Math.ceil(k2 * 4) / 4;
          elDlg.style.transform = 'scaleY(' + steps + ')';
        }
        var n = clamp(Math.floor((t - 0.92) * 42), 0, LINE.length);
        if (t >= 3.0) n = LINE.length;
        if (n !== lastTyped) { lastTyped = n; elTxt.textContent = LINE.slice(0, n); }
        elCar.style.visibility = (n === LINE.length && Math.floor(t / 0.25) % 2 === 0) ? 'visible' : 'hidden';
      }

      function loop(now) {
        var t = (typeof window.__animT === 'number') ? window.__animT : ((((now - start) / 1000) % LOOP) + LOOP) % LOOP;
        render(t);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      render(0);

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
