/* KidsSchooling · Estilo HD-2D
   Sprites de pixel art (matrizes de caracteres → canvas → textura Nearest) em planos voltados
   para a câmera, dentro de um diorama 3D em three.js r128: blocos de terreno com textura pixelada,
   água com brilho animado, casinha 3D, sombras suaves, vagalumes e o desfoque tilt-shift
   (passe de tela cheia sobre um render target) com vinheta e gradação quente.
   Loop de 3,6 s. Global THREE. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'hd2d';
  var LOOP = 3.6, TAU = Math.PI * 2;

  /* ---------------- utilidades ---------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function outBack(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function hash(x, y, s) {
    var h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi, s), hash(xi + 1, yi, s), xf), lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), xf), yf);
  }
  var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer(x, y) { return (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  var RGBC = {};
  function rgb(hex) {
    if (RGBC[hex]) return RGBC[hex];
    var n = parseInt(hex.slice(1), 16);
    return (RGBC[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // buffer de pixels simples
  function PB(w, h) {
    this.w = w; this.h = h; this.c = mkCanvas(w, h); this.g = this.c.getContext('2d');
    this.img = this.g.createImageData(w, h); this.d = this.img.data;
  }
  PB.prototype.set = function (x, y, col, a) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var o = (y * this.w + x) * 4, c = typeof col === 'string' ? rgb(col) : col;
    this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = a == null ? 255 : a;
  };
  PB.prototype.a = function (x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; };
  PB.prototype.outline = function (col) {
    var w = this.w, h = this.h, x, y, mark = [];
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (this.a(x, y) > 0) continue;
      if (this.a(x - 1, y) > 0 || this.a(x + 1, y) > 0 || this.a(x, y - 1) > 0 || this.a(x, y + 1) > 0) mark.push(x, y);
    }
    for (var i = 0; i < mark.length; i += 2) this.set(mark[i], mark[i + 1], col);
    return this;
  };
  PB.prototype.done = function () { this.g.putImageData(this.img, 0, 0); return this.c; };

  var OUTL = '#2b1a26';

  /* ---------------- sprites em matrizes de caracteres ---------------- */
  var PAL = {
    h: '#5a321f', H: '#7d4a2b', j: '#a9693c',
    s: '#f8cba6', S: '#e2a27f', e: '#2b1a26', w: '#ffffff', c: '#f59a8c', m: '#b4483e',
    b: '#3f80e4', B: '#2a59b2', L: '#86b8ff',
    r: '#f28c28', R: '#c3631a', Q: '#ffbe6c',
    p: '#2e3b72', P: '#1f284f', k: '#7a4426', K: '#4c2914',
    y: '#ffcf33', Y: '#e2a313', Z: '#fff3a6',
    W: '#ffffff', V: '#d9dfea', g: '#b9bfcc',
    t: '#c9553f', T: '#9b3d2e', a: '#8f5a33', A: '#6a3f22', n: '#4b5273', N: '#363b57',
    x: '#ffe066', X: '#d49a18', D: '#e2bd84', E: '#c49a63', G: '#79d0ff', F: '#57b36a', M: '#e8524a', O: '#ffffff', U: '#9aa4b8'
  };
  function spriteRows(rows, pal, outline, flip) {
    var h = rows.length, w = 0, i, j;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var p = outline ? 1 : 0;
    var pb = new PB(w + p * 2, h + p * 2);
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var ch = rows[j].charAt(flip ? w - 1 - i : i);
      if (ch && ch !== '.' && ch !== ' ' && pal[ch]) pb.set(i + p, j + p, pal[ch]);
    }
    if (outline) pb.outline(outline);
    return pb.done();
  }

  // Herói: olhando para a direita em 3/4. Cabeça + tronco + pernas (4 quadros de caminhada).
  var HERO_HEAD = [
    '....hhhhhhh.....',
    '..hhHHHHHHHhh...',
    '.hHHjjjHHHHHHh..',
    '.hHjjHHHHHHHHHh.',
    'hHHHHHHHHHHHHHHh',
    'hHHHHHHHHHhHHHHh',
    'hHHHHHHhHHsHHhHh',
    'hHHHHHhssssssHsh',
    'hHHHHSsssssssssh',
    'hHHHSsseWsssseWs',
    '.hHHSsseesssseeS',
    '.hHSSscsssssssc.',
    '..hSSssssmmsss..',
    '....SSSssssss...'
  ];
  var HERO_BODY = [
    [ // braço à frente
      '..rrrbbbbbbbb...',
      '.rQQrbLLbbbbbb..',
      '.rQrrbbbbbbbBbs.',
      '.rrrRBbbbbbbBss.',
      '.rRRRBBbbbbbb...',
      '..RR..ppppppp...'
    ],
    [ // braço ao lado
      '..rrrbbbbbbbb...',
      '.rQQrbLLbbbbbb..',
      '.rQrrbbbbbbBbb..',
      '.rrrRBbbbbbBbb..',
      '.rRRRBBbbbbsss..',
      '..RR..ppppppp...'
    ],
    [ // braço atrás
      '..rrrbbbbbbbb...',
      '.rQQrbLLbbbbbb..',
      '.rQrrbbbbbbbbb..',
      '.rrrRBbBbbbbbb..',
      '.rRRRsBbbbbbb...',
      '..RR..ppppppp...'
    ]
  ];
  var HERO_LEGS = [
    ['......ppp.PPP...', '.....pp....PP...', '....kkk....KKK..'],
    ['.......ppPP.....', '.......ppPP.....', '......kkkKKK....'],
    ['......PPP.ppp...', '.....PP....pp...', '....KKK....kkk..'],
    ['.......PPpp.....', '.......PPpp.....', '......KKKkkk....']
  ];
  var HERO_IDLE_LEGS = ['.......pp.PP....', '.......pp.PP....', '......kkk.KKK...'];
  function heroFrame(body, legs) { return HERO_HEAD.concat(HERO_BODY[body], legs); }

  // Mestre Tomé: olhando para a esquerda. 2 quadros de gesto (braço baixo / braço erguido).
  var TOME_A = [
    '......ZZyyyyy.....',
    '....Zyyyyyyyyyy...',
    '...yZyyyyyyyyyyY..',
    '...yyyyyyyyyyyYY..',
    '.YYYYYYYYYYYYYYYY.',
    '...gsssssssssggg..',
    '...ssesssseessgg..',
    '...ssesssseesSgg..',
    '..SsssssssssssSg..',
    '..cWWWssssWWWcS...',
    '..WWWWWWWWWWWWW...',
    '..WWWWWmmWWWWWV...',
    '...WWWWWWWWWWWV...',
    '....VWWWWWWWVV....',
    '...ttVVWWWWVtt....',
    '..tttaaaaaaaatt...',
    '..ttaaaaaaaaaatt..',
    '..ttaaaAAaaaaatt..',
    '..ssaaaaaaaaaass..',
    '..ss.aaaaaaaa.ss..',
    '.....AaaaaaaaA....',
    '.....nnnn.nnnn....',
    '.....nnnN.nnnN....',
    '....KKKkk.KKKkk...'
  ];
  var TOME_B = TOME_A.slice();
  // braço erguido (lado esquerdo da imagem = direção da ponte)
  TOME_B[9] = 'ss.WWWssssWWWcS...';
  TOME_B[10] = 'ssWWWWWWWWWWWWW...';
  TOME_B[11] = 'ttWWWWWmmWWWWWV...';
  TOME_B[12] = 'tt.WWWWWWWWWWWV...';
  TOME_B[13] = '.tt.VWWWWWWWVV....';
  TOME_B[14] = '..tttVVWWWWVtt....';
  TOME_B[15] = '...ttaaaaaaaatt...';
  TOME_B[16] = '...taaaaaaaaaatt..';
  TOME_B[17] = '...taaaAAaaaaatt..';
  TOME_B[18] = '....aaaaaaaaaass..';
  TOME_B[19] = '.....aaaaaaaa.ss..';

  // Rostos de frente para o HUD
  var HERO_FACE = [
    '....hhhhhhhh....',
    '..hhHHHHHHHHhh..',
    '.hHHjjHHHHHHHHh.',
    '.hHjHHHHHHHHHHh.',
    'hHHHHHHHHHHHHHHh',
    'hHHHhHHHHHhHHHHh',
    'hHHsshHHHhsshHHh',
    'hHsssssssssssHHh',
    'hSssessssssessSh',
    'hSssessssssessS.',
    '.Scsssssssssscs.',
    '..sssssmmsssss..',
    '...SSsssssssS...',
    '....bbbSSSbbb...',
    '..rrbbbbbbbbbrr.',
    '.rrbbbbLbbbbbbrr'
  ];
  var TOME_FACE = [
    '....ZZyyyyyy....',
    '...Zyyyyyyyyy...',
    '..yyyyyyyyyyyY..',
    '..yyyyyyyyyyyY..',
    '.YYYYYYYYYYYYYY.',
    '.ggssssssssssgg.',
    '.gsseesssseessg.',
    '.gsseesssseessg.',
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
    '..UUUUUUU...',
    '.UOOOOOOUU..',
    '.UUUUUUUUU..',
    '....aa......',
    '....aa......',
    '....aa......',
    '....aa......',
    '....AA......',
    '....AA......',
    '....AA......'
  ];
  var ICON_BAG = [
    '...RRRRRR...',
    '..R......R..',
    '.rrrrrrrrrr.',
    'rQQrrrrrrrrr',
    'rQrrrxxrrrRr',
    'rrrrrXXrrrRr',
    'rrrrrrrrrrRr',
    'rRRRRRRRRRRr',
    'rrrrrrrrrrRr',
    '.RRRRRRRRRR.'
  ];
  var ICON_MAP = [
    'DDDD.DDDDDD.',
    'DFFDDDGGDDDD',
    'DFFFDDGGGDD.',
    'DDFFDDDGGDDD',
    'DDDDMDDDGDD.',
    'DDDDDMDDDDDD',
    'DDGDDDMMDDD.',
    'DGGGDDDDMMDD',
    'DDGDDDDDDMD.',
    'EEEEEEEEEEEE'
  ];
  var ICON_BRIDGE = [
    '.EEEEEEEEEE.',
    'EDDDDDDDDDDE',
    '.EDDDDDDDDE.',
    '.DDaaaaaaDD.',
    '.DDDDDDDDDD.',
    '.DDaaaaaDDD.',
    '.DDDDDDDDDD.',
    '.DDaaaaaaDD.',
    '.DDDDDDMMDD.',
    '.EDDDDDMMDE.',
    'EDDDDDDDDDDE',
    '.EEEEEEEEEE.'
  ];
  var BUBBLE = [
    '.OOOOOOOOOOOO.',
    'OOOOOOOOOOOOOO',
    'OOeeOOeeOOeeOO',
    'OOeeOOeeOOeeOO',
    'OOOOOOOOOOOOOO',
    '.OOOOOOOOOOOO.',
    '...OOO........',
    '...OO.........',
    '...O..........'
  ];
  var ARROW = [
    '..xxxxx..',
    '..xxxxx..',
    '..xxxxx..',
    'xxxxxxxxx',
    '.xxxxxxx.',
    '..xxxxx..',
    '...xxx...',
    '....x....'
  ];
  var CURSOR = [
    'xx......',
    'xZxx....',
    'xZZZxx..',
    'xZZZZZxx',
    'xZZZZXxx',
    'xZZXxx..',
    'xXxx....',
    'xx......'
  ];

  /* ---------------- arte procedural ---------------- */
  function canopyCanvas(seed, kind) {
    var W, H, blobs, trunk, i, x, y;
    var greens = ['#1d4a2e', '#2a6a37', '#3d8c3e', '#5eac47', '#9ad468'];
    if (kind === 'apple' || kind === 'round') {
      W = 40; H = 54; blobs = [[20, 20, 13], [11, 26, 8.5], [29, 26, 8.5], [20, 10, 8.5], [13, 14, 7], [27, 15, 7], [20, 29, 9]];
      trunk = [17, 23, 32, 51];
    } else if (kind === 'bush') {
      W = 24; H = 15; blobs = [[8, 9, 6], [16, 9, 6.5], [12, 6, 5.5]]; trunk = null;
    } else { // pinheiro
      W = 30; H = 56; blobs = null; trunk = [13, 17, 44, 53];
      greens = ['#183f2f', '#215c3a', '#2f7a44', '#4b9a50', '#7fc36a'];
    }
    var pb = new PB(W, H);
    if (trunk) {
      for (y = trunk[2]; y <= trunk[3]; y++) {
        var flare = y > trunk[3] - 3 ? (y - (trunk[3] - 3)) : 0;
        for (x = trunk[0] - flare; x <= trunk[1] + flare; x++) {
          var tx = (x - trunk[0] + flare) / (trunk[1] - trunk[0] + flare * 2);
          var col = tx < 0.3 ? '#a2683c' : tx < 0.75 ? '#7c4a2a' : '#5a321c';
          if (hash(x, y, seed + 9) > 0.86) col = '#5a321c';
          pb.set(x, y, col);
        }
      }
    }
    var Lx = -0.55, Ly = -0.83;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var best = -1, nx = 0, ny = 0;
      if (blobs) {
        for (i = 0; i < blobs.length; i++) {
          var b = blobs[i], dx = x + 0.5 - b[0], dy = y + 0.5 - b[1], d = Math.sqrt(dx * dx + dy * dy);
          var r = b[2] + (hash(x >> 1, y >> 1, seed + i) - 0.5) * 1.8;
          var k = (r - d) / r;
          if (k > 0 && (best < 0 || b[1] > blobs[best][1] - 0.01 && k > 0.0)) {
            // preferir blobs mais baixos (mais à frente) para dar volume em camadas
            if (best < 0 || b[1] >= blobs[best][1] || k > 0.35) { best = i; nx = dx / r; ny = dy / r; }
          }
        }
      } else {
        // pinheiro em 4 camadas
        var tiers = [[2, 15, 6], [10, 25, 9], [18, 35, 12], [27, 46, 14]];
        for (i = 0; i < tiers.length; i++) {
          var tt = tiers[i];
          if (y >= tt[0] && y <= tt[1]) {
            var f = (y - tt[0]) / (tt[1] - tt[0]);
            var hw = 1 + f * tt[2] + (hash(x, y, seed) - 0.5) * 1.4;
            var ddx = x + 0.5 - W / 2;
            if (Math.abs(ddx) < hw) { best = i; nx = ddx / (hw + 0.01); ny = f * 1.6 - 0.9; }
          }
        }
      }
      if (best < 0) continue;
      var lit = -(nx * Lx + ny * Ly);
      var lum = 0.48 - lit * 0.42 + (vnoise(x * 0.5, y * 0.5, seed) - 0.5) * 0.35;
      if (blobs) lum += (blobs[best][1] < 16 ? 0.1 : 0);
      var idx = Math.floor(clamp(lum, 0, 0.999) * 5 + bayer(x, y) - 0.5);
      idx = clamp(idx, 0, 4);
      if (hash(x, y, seed + 3) > 0.94 && idx < 4 && lum > 0.45) idx++;
      if (hash(x, y, seed + 4) > 0.95 && idx > 0 && lum < 0.5) idx--;
      pb.set(x, y, greens[idx]);
      if (kind === 'apple' && hash(x >> 1, y >> 1, seed + 7) > 0.965 && (x & 1) === 0 && (y & 1) === 0) {
        pb.set(x, y, '#e8473f'); pb.set(x + 1, y, '#e8473f'); pb.set(x, y + 1, '#b32f2f'); pb.set(x + 1, y + 1, '#e8473f');
      }
    }
    pb.outline('#1a2b1f');
    return pb.done();
  }

  function puffCanvas() {
    var pb = new PB(12, 12);
    for (var y = 0; y < 12; y++) for (var x = 0; x < 12; x++) {
      var d1 = Math.hypot(x + 0.5 - 5, y + 0.5 - 7), d2 = Math.hypot(x + 0.5 - 7.5, y + 0.5 - 5), d3 = Math.hypot(x + 0.5 - 4, y + 0.5 - 4.5);
      if (d1 < 4.3 || d2 < 4 || d3 < 3) {
        var sh = (x + y > 13) ? '#e7dccb' : '#ffffff';
        pb.set(x, y, sh);
      }
    }
    return pb.done();
  }
  function glowCanvas(inner, outer) {
    var c = mkCanvas(64, 64), g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  }
  function blobShadowCanvas() {
    var pb = new PB(16, 8);
    for (var y = 0; y < 8; y++) for (var x = 0; x < 16; x++) {
      var dx = (x + 0.5 - 8) / 8, dy = (y + 0.5 - 4) / 4, d = dx * dx + dy * dy;
      if (d < 1) pb.set(x, y, '#000000', d < 0.45 ? 255 : 150);
    }
    return pb.done();
  }
  function shaftCanvas() {
    var c = mkCanvas(32, 128), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.25, 'rgba(255,236,190,0.9)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 128);
    var gx = g.createLinearGradient(0, 0, 32, 0);
    gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 128);
    return c;
  }
  function slotCanvas() {
    // contorno tracejado dourado do vão (20 x 22 px)
    var pb = new PB(20, 22);
    for (var x = 0; x < 20; x++) for (var y = 0; y < 22; y++) {
      var edge = x < 2 || x > 17 || y < 2 || y > 19;
      if (!edge) { pb.set(x, y, '#ffe9a0', 60); continue; }
      var along = (x < 2 || x > 17) ? y : x;
      if (((along >> 2) & 1) === 0) pb.set(x, y, '#ffd84a');
    }
    return pb.done();
  }
  function lilyCanvas() {
    var pb = new PB(10, 8);
    for (var y = 0; y < 8; y++) for (var x = 0; x < 10; x++) {
      var dx = (x + 0.5 - 5) / 5, dy = (y + 0.5 - 4) / 4;
      if (dx * dx + dy * dy < 1 && !(x >= 5 && x <= 6 && y <= 3)) pb.set(x, y, (x + y) % 5 === 0 ? '#86c95a' : '#4f9e46');
    }
    pb.set(3, 2, '#ffd6ec'); pb.set(4, 2, '#ff9ccc'); pb.set(3, 3, '#ff9ccc'); pb.set(4, 3, '#fff1a0');
    pb.outline('#1f4a2c');
    return pb.done();
  }
  function reedCanvas(seed) {
    var pb = new PB(10, 14);
    for (var i = 0; i < 5; i++) {
      var x0 = 1 + i * 2, top = 2 + Math.floor(hash(i, 1, seed) * 6);
      for (var y = top; y < 14; y++) pb.set(x0 + (y < 7 && i % 2 ? 1 : 0), y, y < top + 2 ? '#b4dc78' : (i % 2 ? '#5e9e48' : '#7cb85a'));
      if (hash(i, 2, seed) > 0.55) { pb.set(x0, top - 1, '#8a5a32'); pb.set(x0, top - 2, '#8a5a32'); }
    }
    pb.outline('#1a2b1f');
    return pb.done();
  }
  function flowerCanvas(c1, c2) {
    var pb = new PB(9, 10);
    pb.set(4, 5, '#3d8c3e'); pb.set(4, 6, '#3d8c3e'); pb.set(4, 7, '#3d8c3e'); pb.set(4, 8, '#3d8c3e'); pb.set(3, 7, '#5eac47'); pb.set(5, 6, '#5eac47');
    pb.set(4, 1, c1); pb.set(3, 2, c1); pb.set(5, 2, c1); pb.set(4, 3, c1); pb.set(4, 2, c2);
    pb.set(1, 4, c1); pb.set(1, 5, c2); pb.set(7, 3, c1);
    pb.outline('#1a2b1f');
    return pb.done();
  }

  // textura de tábuas (16x16, tábuas correndo na vertical)
  function plankCanvas(light) {
    var pb = new PB(16, 16);
    var tones = light ? ['#f0c58a', '#e2b175', '#d7a466', '#e9bb7e'] : ['#a8703f', '#986334', '#8a5a2f', '#a26a3a'];
    var dark = light ? '#a8743f' : '#5a361c', hi = light ? '#ffe2b0' : '#c48b54';
    for (var x = 0; x < 16; x++) for (var y = 0; y < 16; y++) {
      var p = x >> 2, lx = x & 3;
      var c = tones[p];
      if (lx === 3) c = dark;
      else if (lx === 0) c = hi;
      else if (hash(x, y >> 1, p + 11) > 0.82) c = light ? '#cf9a5e' : '#7d5029';
      if ((y === 2 || y === 13) && lx === 1) c = light ? '#8c6a4a' : '#3a2414';
      pb.set(x, y, c);
    }
    return pb.done();
  }
  // viga (grão na horizontal) para a peça nova
  function beamCanvas() {
    var pb = new PB(20, 22);
    for (var x = 0; x < 20; x++) for (var y = 0; y < 22; y++) {
      var row = Math.floor(y / 5.5);
      var c = ['#f3c98c', '#e8b878', '#f6d29a', '#e3b070'][row & 3];
      if (y % 5 === 4 || y === 21) c = '#b07a42';
      else if (y % 5 === 0) c = '#ffe6bc';
      else if (hash(x >> 1, y, 7) > 0.84) c = '#d5a064';
      if (x === 0 || x === 19) c = '#9a6534';
      if ((x === 2 || x === 17) && (y % 5 === 2)) c = '#6b5a4a';
      pb.set(x, y, c);
    }
    return pb.done();
  }
  function roofCanvas(base, dark, hi) {
    var pb = new PB(16, 16);
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var row = y >> 2, off = (row & 1) * 2, lx = (x + off) & 3, ly = y & 3;
      var c = base;
      if (ly === 3 || lx === 3) c = dark;
      else if (ly === 0) c = hi;
      else if (hash(x, y, 31) > 0.88) c = dark;
      pb.set(x, y, c);
    }
    return pb.done();
  }
  function stoneCanvas() {
    var pb = new PB(16, 16);
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var row = y >> 2, off = (row & 1) * 3, bx = Math.floor((x + off) / 6), lx = (x + off) % 6, ly = y & 3;
      var tone = ['#a9a39a', '#9a948b', '#b6b0a6'][Math.floor(hash(bx, row, 5) * 3)];
      var c = tone;
      if (ly === 3 || lx === 5) c = '#6d665f';
      else if (ly === 0 && lx < 4) c = '#cbc5ba';
      pb.set(x, y, c);
    }
    return pb.done();
  }

  // parede de casa (frente/lado) com enxaimel, porta e janelas pintadas
  function wallCanvas(wu, hu, opts) {
    var W = Math.round(wu * 16), H = Math.round(hu * 16), x, y;
    var pb = new PB(W, H);
    var pl = opts.plaster || ['#f4e6c8', '#ecdcbc', '#f8eed6'];
    var tim = opts.timber || '#7a4a2a', timD = '#55311b';
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var n = vnoise(x * 0.3, y * 0.3, opts.seed || 1);
      var c = pl[n < 0.35 ? 1 : n > 0.72 ? 2 : 0];
      if (hash(x, y, 4) > 0.97) c = pl[1];
      pb.set(x, y, c);
    }
    // base de pedra
    var sb = 5;
    for (y = H - sb; y < H; y++) for (x = 0; x < W; x++) {
      var row = (y - (H - sb)) >> 1, off = (row & 1) * 2, lx = (x + off) % 5;
      pb.set(x, y, (lx === 4 || ((y - (H - sb)) & 1) === 1 && lx === 0) ? '#6f6860' : (hash(x >> 2, row, 2) > 0.5 ? '#aaa298' : '#968f86'));
    }
    function beam(x0, y0, x1, y1) { for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) pb.set(xx, yy, (xx === x1 || yy === y1) ? timD : tim); }
    beam(0, 0, W - 1, 1); beam(0, H - sb - 2, W - 1, H - sb - 1);
    beam(0, 0, 1, H - sb - 1); beam(W - 2, 0, W - 1, H - sb - 1);
    if (opts.mid) beam(Math.round(W / 2) - 1, 0, Math.round(W / 2), H - sb - 1);
    (opts.windows || []).forEach(function (wd) {
      var wx = Math.round(wd[0] * 16), wy = Math.round(wd[1] * 16), ww = 10, wh = 9;
      for (y = -1; y <= wh; y++) for (x = -1; x <= ww; x++) {
        var edge = x === -1 || y === -1 || x === ww || y === wh;
        var c2 = edge ? timD : (x === 4 || x === 5 || y === 4) ? '#7a4a2a' : (y < 2 && x < 3 ? '#fff7cf' : (y + x < 7 ? '#ffe58a' : '#ffc95a'));
        pb.set(wx + x, wy + y, c2);
      }
      // floreira
      for (x = -1; x <= ww; x++) { pb.set(wx + x, wy + wh + 1, '#8a5a32'); pb.set(wx + x, wy + wh + 2, '#6a3f22'); }
      for (x = 0; x < ww; x += 2) { pb.set(wx + x, wy + wh, x % 4 ? '#ff7aa8' : '#e8473f'); pb.set(wx + x + 1, wy + wh, '#4f9e46'); }
      // venezianas
      for (y = 0; y < wh; y++) { pb.set(wx - 3, wy + y, y % 2 ? '#3b6db0' : '#4f86cf'); pb.set(wx - 2, wy + y, '#3b6db0'); pb.set(wx + ww + 1, wy + y, '#3b6db0'); pb.set(wx + ww + 2, wy + y, y % 2 ? '#3b6db0' : '#4f86cf'); }
    });
    if (opts.door) {
      var dx0 = Math.round(opts.door[0] * 16), dw = 11, dh = 18, dy0 = H - sb - dh;
      for (y = -2; y < dh; y++) for (x = -2; x < dw + 2; x++) {
        var e2 = x < 0 || x >= dw || y < 0;
        var arch = y < 2 && (x < 1 || x > dw - 2);
        var c3 = e2 ? timD : arch ? timD : ((x % 3 === 2) ? '#6a3c20' : (x % 3 === 0 ? '#a4683a' : '#8f5a32'));
        pb.set(dx0 + x, dy0 + y, c3);
      }
      pb.set(dx0 + dw - 3, dy0 + 9, '#ffd84a'); pb.set(dx0 + dw - 3, dy0 + 10, '#d49a18');
      for (x = -3; x < dw + 3; x++) pb.set(dx0 + x, H - 1, '#c9c1b5');
    }
    return pb.done();
  }

  /* ---------------- HUD (DOM) ---------------- */
  var CSS = [
    '.hd2d-root{position:absolute;inset:0;overflow:hidden;background:#1a2340;-webkit-user-select:none;user-select:none;}',
    '.hd2d-root>canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.hd2d-hud{position:absolute;inset:0;pointer-events:none;color:#f6f1e3;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--u:1;}',
    '.hd2d-px{font-family:"Pixelify Sans","Nunito Sans",system-ui,sans-serif;}',
    '.hd2d-win{position:absolute;background:linear-gradient(180deg,rgba(38,58,122,.86) 0%,rgba(18,28,72,.88) 55%,rgba(12,18,52,.9) 100%);border:calc(1.5px*var(--u)) solid #ead9a6;border-radius:calc(7px*var(--u));box-shadow:inset 0 0 0 calc(1.5px*var(--u)) rgba(8,12,34,.85),inset 0 0 0 calc(3px*var(--u)) rgba(255,255,255,.10),0 calc(6px*var(--u)) calc(16px*var(--u)) rgba(6,10,30,.45);}',
    '.hd2d-win:before,.hd2d-win:after{content:"";position:absolute;width:calc(5px*var(--u));height:calc(5px*var(--u));background:#ffe6a0;transform:rotate(45deg);box-shadow:0 0 calc(4px*var(--u)) rgba(255,220,140,.8);}',
    '.hd2d-win:before{left:calc(-3.5px*var(--u));top:calc(-3.5px*var(--u));}',
    '.hd2d-win:after{right:calc(-3.5px*var(--u));bottom:calc(-3.5px*var(--u));}',
    '.hd2d-top{left:calc(12px*var(--u));right:calc(12px*var(--u));top:calc(env(safe-area-inset-top,0px) + 40px);display:flex;align-items:center;gap:calc(10px*var(--u));padding:calc(8px*var(--u)) calc(12px*var(--u)) calc(8px*var(--u)) calc(8px*var(--u));}',
    '.hd2d-ava{position:relative;flex:none;width:calc(52px*var(--u));height:calc(52px*var(--u));border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#8fd0ff,#3d76c8);box-shadow:0 0 0 calc(2px*var(--u)) #ead9a6,0 0 0 calc(3.5px*var(--u)) rgba(8,12,34,.9),0 0 calc(10px*var(--u)) rgba(255,220,140,.35);}',
    '.hd2d-ava canvas,.hd2d-por canvas,.hd2d-ico canvas,.hd2d-qi canvas,.hd2d-cur{image-rendering:pixelated;image-rendering:crisp-edges;display:block;}',
    '.hd2d-ava canvas{position:absolute;left:12%;top:14%;width:76%;height:76%;}',
    '.hd2d-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(6px*var(--u));}',
    '.hd2d-row{display:flex;align-items:baseline;justify-content:space-between;gap:calc(6px*var(--u));white-space:nowrap;}',
    '.hd2d-lvl{font-size:calc(17.5px*var(--u));font-weight:600;letter-spacing:.02em;line-height:1;text-shadow:0 calc(2px*var(--u)) 0 rgba(6,10,30,.8);}',
    '.hd2d-lvl em{font-style:normal;color:#ffd970;}',
    '.hd2d-xptxt{font-size:calc(12.5px*var(--u));font-weight:800;color:#cfd8f2;font-variant-numeric:tabular-nums;}',
    '.hd2d-xptxt b{color:#ffd970;font-weight:800;}',
    '.hd2d-xp{position:relative;height:calc(11px*var(--u));border-radius:calc(3px*var(--u));background:#0a1030;box-shadow:inset 0 0 0 1px rgba(234,217,166,.55);overflow:hidden;}',
    '.hd2d-xpfill{position:absolute;left:calc(2px*var(--u));top:calc(2px*var(--u));bottom:calc(2px*var(--u));width:62%;border-radius:calc(2px*var(--u));background:linear-gradient(180deg,#fff2b0 0%,#ffd24a 45%,#e79a1a 100%);box-shadow:0 0 calc(8px*var(--u)) rgba(255,210,90,.6);}',
    '.hd2d-xpfill:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(7px*var(--u)),rgba(120,60,0,.28) calc(7px*var(--u)) calc(8px*var(--u)));}',
    '.hd2d-quest{left:calc(12px*var(--u));top:calc(env(safe-area-inset-top,0px) + 40px + 80px*var(--u));display:flex;align-items:center;gap:calc(8px*var(--u));padding:calc(7px*var(--u)) calc(12px*var(--u)) calc(7px*var(--u)) calc(8px*var(--u));max-width:calc(100% - 24px*var(--u));}',
    '.hd2d-qi{flex:none;width:calc(28px*var(--u));height:calc(28px*var(--u));border-radius:calc(5px*var(--u));background:rgba(255,220,140,.14);box-shadow:inset 0 0 0 1px rgba(234,217,166,.5);display:grid;place-items:center;}',
    '.hd2d-qi canvas{width:78%;height:auto;}',
    '.hd2d-qt{font-size:calc(14px*var(--u));font-weight:700;line-height:1.15;white-space:nowrap;}',
    '.hd2d-qt span{font-family:"Pixelify Sans","Nunito Sans",system-ui,sans-serif;font-weight:600;color:#ffd970;margin-right:calc(4px*var(--u));letter-spacing:.02em;}',
    '.hd2d-chk{flex:none;width:calc(16px*var(--u));height:calc(16px*var(--u));border-radius:calc(3px*var(--u));box-shadow:inset 0 0 0 calc(1.5px*var(--u)) #ead9a6;display:grid;place-items:center;font:800 calc(12px*var(--u))/1 "Nunito Sans",system-ui,sans-serif;color:#1a2340;}',
    '.hd2d-dlg{left:calc(12px*var(--u));right:calc(12px*var(--u));padding:calc(14px*var(--u)) calc(14px*var(--u)) calc(14px*var(--u)) calc(12px*var(--u));display:flex;gap:calc(12px*var(--u));align-items:flex-start;transform-origin:50% 100%;opacity:0;}',
    '.hd2d-tag{position:absolute;left:calc(12px*var(--u));top:calc(-15px*var(--u));padding:calc(4px*var(--u)) calc(10px*var(--u)) calc(5px*var(--u));font-size:calc(14px*var(--u));font-weight:600;letter-spacing:.03em;line-height:1;color:#2a1a08;background:linear-gradient(180deg,#fff0bf,#f2c868);border:calc(1.5px*var(--u)) solid #7a5418;border-radius:calc(4px*var(--u));box-shadow:0 calc(2px*var(--u)) 0 rgba(6,10,30,.6);}',
    '.hd2d-por{flex:none;width:calc(54px*var(--u));height:calc(54px*var(--u));border-radius:calc(5px*var(--u));background:radial-gradient(circle at 50% 30%,#ffe6a8,#e09a4a);box-shadow:0 0 0 calc(1.5px*var(--u)) #ead9a6,0 0 0 calc(3px*var(--u)) rgba(8,12,34,.9);overflow:hidden;position:relative;margin-top:calc(4px*var(--u));}',
    '.hd2d-por canvas{position:absolute;left:8%;top:10%;width:84%;height:84%;}',
    '.hd2d-say{flex:1;min-width:0;font-size:calc(16.5px*var(--u));font-weight:700;line-height:1.35;padding-top:calc(5px*var(--u));min-height:calc(46px*var(--u));text-shadow:0 calc(1.5px*var(--u)) 0 rgba(6,10,30,.7);}',
    '.hd2d-say i{visibility:hidden;font-style:normal;}',
    '.hd2d-more{position:absolute;right:calc(12px*var(--u));bottom:calc(6px*var(--u));width:0;height:0;border-left:calc(6px*var(--u)) solid transparent;border-right:calc(6px*var(--u)) solid transparent;border-top:calc(7px*var(--u)) solid #ffd970;filter:drop-shadow(0 0 calc(3px*var(--u)) rgba(255,210,90,.8));opacity:0;}',
    '.hd2d-bar{position:absolute;left:calc(12px*var(--u));right:calc(12px*var(--u));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(9px*var(--u));}',
    '.hd2d-btn{position:relative;flex:1;height:calc(72px*var(--u));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(6px*var(--u));font-size:calc(15.5px*var(--u));font-weight:600;letter-spacing:.03em;line-height:1;text-shadow:0 calc(2px*var(--u)) 0 rgba(6,10,30,.8);}',
    '.hd2d-ico{width:calc(30px*var(--u));height:calc(26px*var(--u));display:grid;place-items:center;}',
    '.hd2d-ico canvas{width:calc(27px*var(--u));height:auto;filter:drop-shadow(0 calc(2px*var(--u)) 0 rgba(6,10,30,.7));}',
    '.hd2d-on{border-color:#fff1c4;background:linear-gradient(180deg,rgba(70,96,180,.92) 0%,rgba(34,52,124,.92) 60%,rgba(20,32,86,.94) 100%);box-shadow:inset 0 0 0 calc(1.5px*var(--u)) rgba(8,12,34,.85),inset 0 0 0 calc(3px*var(--u)) rgba(255,230,160,.25),0 0 calc(14px*var(--u)) rgba(255,214,110,.45),0 calc(6px*var(--u)) calc(16px*var(--u)) rgba(6,10,30,.45);color:#fff3c8;}',
    '.hd2d-cur{position:absolute;left:calc(7px*var(--u));top:calc(13px*var(--u));width:calc(14px*var(--u));height:calc(14px*var(--u));filter:drop-shadow(0 calc(2px*var(--u)) 0 rgba(6,10,30,.7));}',
    '.hd2d-plus{position:absolute;left:0;top:0;font-size:calc(26px*var(--u));font-weight:700;letter-spacing:.03em;color:#ffe27a;white-space:nowrap;opacity:0;text-shadow:calc(2px*var(--u)) 0 0 #5a2e08,calc(-2px*var(--u)) 0 0 #5a2e08,0 calc(2px*var(--u)) 0 #5a2e08,0 calc(-2px*var(--u)) 0 #5a2e08,0 calc(4px*var(--u)) 0 rgba(6,10,30,.55),0 0 calc(14px*var(--u)) rgba(255,220,120,.9);}',
    '.hd2d-plus small{font-size:.62em;color:#fff6d0;margin-left:calc(3px*var(--u));}'
  ].join('\n');

  function pixelCanvasEl(rows, pal, outline) { var c = spriteRows(rows, pal, outline); return c; }

  function buildHUD(root) {
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var hud = document.createElement('div'); hud.className = 'hd2d-hud';
    hud.innerHTML =
      '<div class="hd2d-win hd2d-top"><div class="hd2d-ava"></div><div class="hd2d-stat">' +
      '<div class="hd2d-row"><span class="hd2d-lvl hd2d-px">Nível 4 <em>·</em> Explorador</span><span class="hd2d-xptxt"><b>XP</b> <span class="hd2d-xpn">620</span>/1000</span></div>' +
      '<div class="hd2d-xp"><div class="hd2d-xpfill"></div></div></div></div>' +
      '<div class="hd2d-win hd2d-quest"><span class="hd2d-qi"></span><span class="hd2d-qt"><span>Missão:</span>consertar a ponte da vila</span><span class="hd2d-chk"></span></div>' +
      '<div class="hd2d-win hd2d-dlg"><span class="hd2d-tag hd2d-px">Mestre Tomé</span><span class="hd2d-por"></span><div class="hd2d-say"></div><span class="hd2d-more"></span></div>' +
      '<div class="hd2d-plus hd2d-px">+50<small>XP</small></div>' +
      '<div class="hd2d-bar">' +
      '<div class="hd2d-win hd2d-btn hd2d-on hd2d-px"><span class="hd2d-ico"></span>Construir</div>' +
      '<div class="hd2d-win hd2d-btn hd2d-px"><span class="hd2d-ico"></span>Mochila</div>' +
      '<div class="hd2d-win hd2d-btn hd2d-px"><span class="hd2d-ico"></span>Mapa</div></div>';
    root.appendChild(hud);
    function q(s) { return hud.querySelector(s); }
    q('.hd2d-ava').appendChild(pixelCanvasEl(HERO_FACE, PAL, null));
    q('.hd2d-por').appendChild(pixelCanvasEl(TOME_FACE, PAL, null));
    q('.hd2d-qi').appendChild(pixelCanvasEl(ICON_BRIDGE, PAL, OUTL));
    var icos = hud.querySelectorAll('.hd2d-ico');
    icos[0].appendChild(pixelCanvasEl(ICON_HAMMER, PAL, OUTL));
    icos[1].appendChild(pixelCanvasEl(ICON_BAG, PAL, OUTL));
    icos[2].appendChild(pixelCanvasEl(ICON_MAP, PAL, OUTL));
    var cur = spriteRows(CURSOR, PAL, OUTL); cur.className = 'hd2d-cur';
    q('.hd2d-on').appendChild(cur);
    var say = q('.hd2d-say');
    return {
      hud: hud, fill: q('.hd2d-xpfill'), xpn: q('.hd2d-xpn'), dlg: q('.hd2d-dlg'), say: say,
      more: q('.hd2d-more'), plus: q('.hd2d-plus'), chk: q('.hd2d-chk'), quest: q('.hd2d-quest'),
      bar: q('.hd2d-bar'), cur: cur, top: q('.hd2d-top')
    };
  }

  /* ---------------- shaders ---------------- */
  var WATER_VS = [
    'attribute float aEdge;',
    'varying vec3 vW; varying float vE;',
    'void main(){ vE = aEdge; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }'
  ].join('\n');
  var WATER_FS = [
    'uniform float uT;',
    'varying vec3 vW; varying float vE;',
    'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'void main(){',
    '  float TAU = 6.2831853;',
    '  vec2 p = (floor(vW.xz * 16.0) + 0.5) / 16.0;',
    '  float w1 = sin(p.y * 3.1416 + sin(p.x * 2.3 + p.y * 0.9) * 1.1 - uT * TAU * 2.0);',
    '  float w2 = sin(p.y * 6.2832 - p.x * 1.7 - uT * TAU * 4.0 + sin(p.x * 4.0) * 0.8);',
    '  float w = w1 * 0.6 + w2 * 0.4;',
    '  float e = vE + (h1(floor(vW.xz * 8.0)) - 0.5) * 0.06;',
    '  vec3 deep = vec3(0.13, 0.36, 0.60); vec3 mid = vec3(0.20, 0.50, 0.74); vec3 lite = vec3(0.38, 0.70, 0.88); vec3 shine = vec3(0.80, 0.94, 1.0);',
    '  vec3 col = mix(mid, deep, smoothstep(0.25, 0.9, e));',
    '  if (w > 0.55) col = mix(col, lite, 0.75);',
    '  else if (w < -0.6) col = mix(col, deep * 0.9, 0.6);',
    '  if (w > 0.93 && h1(floor(vW.xz * 16.0)) > 0.7) col = shine;',
    '  vec2 sc = floor(vW.xz * 8.0); float r = h1(sc + 3.7);',
    '  float tw = sin(TAU * (uT * 2.0 + r * 5.0));',
    '  if (r > 0.965 && tw > 0.55) col = vec3(1.0, 0.99, 0.9);',
    '  if (e < 0.16) col = mix(col, vec3(0.86, 0.95, 1.0), 0.7);',
    '  if (e < 0.08) col = vec3(0.97, 1.0, 1.0);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  var FALL_FS = [
    'uniform float uT;',
    'varying vec3 vW; varying float vE;',
    'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'void main(){',
    '  vec2 p = floor(vec2(vW.x, vW.y) * 16.0);',
    '  float r = h1(vec2(p.x, 1.0));',
    '  float v = fract((p.y / 16.0) * 1.0 + uT * (2.0 + floor(r * 2.0)) + r * 3.0);',
    '  vec3 col = mix(vec3(0.30, 0.62, 0.90), vec3(0.55, 0.82, 0.98), step(0.55, v));',
    '  if (v > 0.86) col = vec3(0.95, 1.0, 1.0);',
    '  if (vE < 0.08 || vE > 0.92) col = mix(col, vec3(0.9,0.97,1.0), 0.6);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  var MOTE_VS = [
    'attribute vec4 aSeed; attribute vec3 aCol;',
    'uniform float uT; uniform float uScale;',
    'varying vec3 vC; varying float vA;',
    'void main(){',
    '  float TAU = 6.2831853;',
    '  vec3 p = position;',
    '  float ph = aSeed.x;',
    '  p.x += sin(TAU * (uT * 1.0 + ph)) * aSeed.z;',
    '  p.y += sin(TAU * (uT * 2.0 + ph * 1.7)) * aSeed.z * 0.45;',
    '  p.z += cos(TAU * (uT * 1.0 + ph)) * aSeed.z * 0.6;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  gl_PointSize = aSeed.w * uScale / -mv.z;',
    '  vA = 0.55 + 0.45 * sin(TAU * (uT * 3.0 + ph * 2.3));',
    '  vC = aCol;',
    '}'
  ].join('\n');
  var MOTE_FS = [
    'varying vec3 vC; varying float vA;',
    'void main(){',
    '  vec2 q = floor(gl_PointCoord * 8.0) / 8.0 + 0.0625 - 0.5;',
    '  float sq = max(abs(q.x), abs(q.y));',
    '  float core = sq < 0.13 ? 1.0 : 0.0;',
    '  float cross = (abs(q.x) < 0.07 || abs(q.y) < 0.07) && sq < 0.32 ? 0.45 : 0.0;',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float glow = pow(max(0.0, 1.0 - d * 2.0), 2.0) * 0.45;',
    '  float a = (core + cross + glow) * vA;',
    '  gl_FragColor = vec4(vC * a, a);',
    '}'
  ].join('\n');
  var SPARK_VS = [
    'attribute float aSize; attribute vec3 aCol; attribute float aAlpha;',
    'uniform float uScale;',
    'varying vec3 vC; varying float vA;',
    'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / -mv.z; vC = aCol; vA = aAlpha; }'
  ].join('\n');
  var SPARK_FS = [
    'varying vec3 vC; varying float vA;',
    'void main(){ if (vA < 0.01) discard; vec2 q = gl_PointCoord - 0.5; float sq = max(abs(q.x),abs(q.y)); if (sq > 0.5) discard; vec3 c = sq < 0.22 ? vec3(1.0) : vC; gl_FragColor = vec4(c * vA, vA); }'
  ].join('\n');
  var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var POST_FS = [
    'uniform sampler2D tDiffuse; uniform vec2 uRes;',
    'uniform float uFocus, uBandTop, uBandBot, uRamp, uMaxTop, uMaxBot, uAll, uDim;',
    'varying vec2 vUv;',
    'void main(){',
    '  float dy = vUv.y - uFocus;',
    '  float k = dy > 0.0 ? smoothstep(uBandTop, uBandTop + uRamp, dy) * uMaxTop : smoothstep(uBandBot, uBandBot + uRamp, -dy) * uMaxBot;',
    '  float r = k + uAll;',
    '  vec3 col;',
    '  if (r < 0.75) { col = texture2D(tDiffuse, vUv).rgb; }',
    '  else {',
    '    vec3 acc = vec3(0.0); float ws = 0.0;',
    '    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;',
    '    for (int i = 0; i < 16; i++) {',
    '      float fi = float(i);',
    '      float rr = sqrt((fi + 0.5) / 16.0) * r;',
    '      float an = fi * 2.39996323 + jit;',
    '      vec3 s = texture2D(tDiffuse, vUv + vec2(cos(an), sin(an)) * rr / uRes).rgb;',
    '      float l = dot(s, vec3(0.299, 0.587, 0.114));',
    '      float wt = 1.0 + 4.0 * l * l * l * l;',
    '      acc += s * wt; ws += wt;',
    '    }',
    '    col = acc / ws;',
    '  }',
    '  float l = dot(col, vec3(0.299, 0.587, 0.114));',
    '  col = mix(vec3(l), col, 1.06);',
    '  col = col * vec3(1.05, 1.0, 0.9) + vec3(0.015, 0.008, 0.0);',
    '  col = mix(col, col * col * (3.0 - 2.0 * col), 0.25);',
    '  vec2 v = vUv - 0.5; v.x *= uRes.x / uRes.y * 1.25;',
    '  float vig = smoothstep(0.85, 0.2, length(v));',
    '  col *= mix(0.68, 1.0, vig);',
    '  col = mix(col, vec3(1.0, 0.96, 0.88), uDim);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* ---------------- mundo ---------------- */
  var X0 = -9, X1 = 9, Z0 = -21, Z1 = 16; // células inteiras
  function streamCenter(z) { return z <= -6 ? -1 : (z <= 4 ? 0 : (z <= 9 ? 1 : 2)); }
  function isStream(x, z) { var c = streamCenter(z); return x >= c - 1 && x <= c + 1; }
  function cellH(x, z) {
    if (z <= -9) return isStream(x, z) ? 0.2 : 1.0;
    if (isStream(x, z)) return -0.8;
    if (z === -8 && (x === -4 || x === -3)) return 0.5;
    if (z >= 9 && x >= 5) return 0.5;
    if (x <= -6 && z >= -7 && z <= -4) return 0.5;
    return 0;
  }
  var PATHS = [
    [-9.5, 0.15, -2.6, 0.15, 1.25],
    [-3.9, 0.3, -4.4, 6.0, 1.05], [-4.4, 6.0, -4.0, 16.5, 1.05],
    [2.6, 0.15, 4.6, 0.15, 1.25], [3.3, 0.15, 3.2, -2.8, 1.05],
    [4.6, 0.15, 6.6, 4.0, 1.0], [6.6, 4.0, 9.5, 7.5, 1.0],
    [-3.2, 0.1, -3.5, -7.6, 0.95], [-3.5, -8.5, -3.6, -14, 0.95], [-3.6, -14, 3.0, -13.2, 0.95]
  ];
  function segDist(px, pz, s) {
    var ax = s[0], az = s[1], bx = s[2], bz = s[3], dx = bx - ax, dz = bz - az;
    var t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1);
    var qx = ax + dx * t - px, qz = az + dz * t - pz;
    return Math.sqrt(qx * qx + qz * qz) - s[4] / 2;
  }
  function pathD(x, z) { var d = 9; for (var i = 0; i < PATHS.length; i++) d = Math.min(d, segDist(x, z, PATHS[i])); return d; }

  function paintGround() {
    var NX = X1 - X0 + 1, NZ = Z1 - Z0 + 1, PX = 16;
    var W = NX * PX, Hh = NZ * PX;
    var pb = new PB(W, Hh);
    var G = ['#447f36', '#538f3d', '#62a046', '#78b152', '#97c463'].map(rgb);
    var GP = ['#4f8a3a', '#5e9a41', '#6ea94a', '#84b956', '#a2cb68'].map(rgb);
    var P = ['#c99b62', '#d8ad72', '#e4bf86', '#efd29d'].map(rgb);
    var PE = rgb('#9f7a48');
    var FL = [['#ffffff', '#ffe066'], ['#ffd84a', '#e08a1a'], ['#ff8fb8', '#ffe066'], ['#b9a3ff', '#ffffff'], ['#ff6b5b', '#ffd84a']];
    var x, y;
    for (y = 0; y < Hh; y++) for (x = 0; x < W; x++) {
      var wx = X0 - 0.5 + (x + 0.5) / PX, wz = Z0 - 0.5 + (y + 0.5) / PX;
      var cx = Math.round(wx), cz = Math.round(wz);
      var hh = cellH(cx, cz);
      var nq = (hash(x, y, 1) - 0.5) * 0.12;
      var pd = pathD(wx, wz) + (vnoise(wx * 3, wz * 3, 5) - 0.5) * 0.22 + nq;
      var col;
      if (isStream(cx, cz)) { col = rgb('#8d7a5a'); }
      else if (pd < 0 && hh <= 1.0) {
        var pn = vnoise(wx * 2.2, wz * 2.2, 8) + (hash(x, y, 2) - 0.5) * 0.35;
        var pi = clamp(Math.floor(pn * 4), 0, 3);
        col = P[pi];
        if (hash(x >> 1, y >> 1, 3) > 0.93) col = rgb('#a98657');
        if (pd > -0.07) col = PE;
      } else {
        var pal = hh >= 1 ? GP : G;
        var n1 = vnoise(wx * 0.45, wz * 0.45, 2), n2 = vnoise(wx * 1.6, wz * 1.6, 3);
        var lum = n1 * 0.6 + n2 * 0.4 + (hash(x, y, 4) - 0.5) * 0.28;
        if (pd < 0.1) lum -= 0.25; // borda escura junto ao caminho
        // AO junto a degraus mais altos
        var hx = cellH(Math.round(wx + 0.35), cz), hx2 = cellH(Math.round(wx - 0.35), cz), hz = cellH(cx, Math.round(wz - 0.35));
        if (hx > hh || hx2 > hh || hz > hh) lum -= 0.22;
        var gi = clamp(Math.floor(lum * 5 + bayer(x, y) - 0.5), 0, 4);
        col = pal[gi];
      }
      pb.set(x, y, col);
    }
    // tufos de grama e flores
    for (var i = 0; i < 1400; i++) {
      x = Math.floor(hash(i, 7, 9) * W); y = Math.floor(hash(i, 8, 9) * Hh);
      var wx2 = X0 - 0.5 + x / PX, wz2 = Z0 - 0.5 + y / PX;
      if (isStream(Math.round(wx2), Math.round(wz2)) || pathD(wx2, wz2) < 0.15) continue;
      var fl = vnoise(wx2 * 0.7, wz2 * 0.7, 11);
      if (hash(i, 9, 9) < 0.55) {
        var tc = hash(i, 10, 9) > 0.5 ? '#9ad468' : '#7cc155';
        pb.set(x, y, tc); pb.set(x - 1, y - 1, tc); pb.set(x + 1, y - 1, tc); pb.set(x, y + 1, '#3f8a3a');
      } else if (fl > 0.48) {
        var f = FL[Math.floor(hash(i, 12, 9) * FL.length)];
        pb.set(x, y, f[1]); pb.set(x - 1, y, f[0]); pb.set(x + 1, y, f[0]); pb.set(x, y - 1, f[0]); pb.set(x, y + 1, f[0]);
        pb.set(x + 1, y + 1, '#2f6f33');
      }
    }
    return pb.done();
  }
  function paintSides() {
    // 4 ladrilhos 16x16: borda de grama/terra, terra, borda de grama/pedra, pedra
    var pb = new PB(64, 16), x, y;
    var dirt = ['#7b5233', '#8a5e3a', '#6c4629', '#94683f'];
    for (var t = 0; t < 4; t++) for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
      var X = t * 16 + x, c;
      var lipLen = (t === 0 || t === 2) ? 4 + Math.floor(hash(x, 0, t) * 3) - (x % 5 === 0 ? 1 : 0) : -1;
      if (y < lipLen) c = y === 0 ? '#8ccf62' : (y === lipLen - 1 ? '#3f8a3a' : (hash(x, y, 5) > 0.5 ? '#5aab47' : '#4c9a3f'));
      else if (t < 2) {
        var n = hash(x >> 1, y >> 1, 6 + t) * 0.6 + hash(x, y, 7) * 0.4;
        c = dirt[Math.floor(n * 4) % 4];
        if (hash(x, y, 8) > 0.93) c = '#b58a5c';
        if ((y === 9 || y === 10) && hash(x, 0, 9) > 0.35) c = '#5e3c22';
        if (y === lipLen && hash(x, y, 10) > 0.4) c = '#2e5e2c';
      } else {
        var row = y >> 2, off = (row & 1) * 3, lx = (x + off) % 6, ly = y & 3;
        c = ['#a39d93', '#958f86', '#b1aba0'][Math.floor(hash((x + off) / 6 | 0, row, 12) * 3)];
        if (ly === 3 || lx === 5) c = '#655e57';
        else if (ly === 0) c = '#c6c0b4';
        if (y === lipLen) c = '#2e5e2c';
      }
      pb.set(X, y, c);
    }
    return pb.done();
  }
  function paintSky() {
    var c = mkCanvas(8, 256), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#4f8fe0'); gr.addColorStop(0.45, '#8fc6f2'); gr.addColorStop(0.8, '#d6ecf6'); gr.addColorStop(1, '#ffe9c2');
    g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    return c;
  }
  function paintBackdrop() {
    var W = 320, H = 96, x, y;
    var pb = new PB(W, H);
    function ridge(seed, base, amp, f) { var r = []; for (x = 0; x < W; x++) r.push(base - amp * (vnoise(x * f, 0, seed) * 0.75 + vnoise(x * f * 3, 1, seed) * 0.25)); return r; }
    // nuvens em pixel
    var clouds = [[40, 14, 26], [150, 8, 34], [250, 18, 24], [300, 6, 18]];
    clouds.forEach(function (cl) {
      for (y = -10; y < 10; y++) for (x = -cl[2]; x < cl[2]; x++) {
        var d = Math.pow(x / cl[2], 2) + Math.pow(y / 6, 2) - (vnoise((cl[0] + x) * 0.15, y * 0.2, 4) - 0.5) * 0.8;
        if (d < 1 && y < 5) pb.set(cl[0] + x, cl[1] + y, y > 2 ? '#e3eefa' : (y < -3 ? '#ffffff' : '#f4f9ff'));
      }
    });
    var far = ridge(21, 64, 30, 0.012), mid = ridge(33, 80, 24, 0.02), nearR = ridge(44, 92, 14, 0.04);
    for (x = 0; x < W; x++) {
      for (y = Math.floor(far[x]); y < H; y++) pb.set(x, y, y < far[x] + 2 ? '#b8d4e8' : '#9fc0dc');
      for (y = Math.floor(mid[x]); y < H; y++) pb.set(x, y, y < mid[x] + 2 ? '#9cc49a' : ((x + y) % 7 === 0 ? '#79a882' : '#86b48a'));
    }
    // arvorezinhas no morro do meio
    for (var i = 0; i < 70; i++) {
      var tx = Math.floor(hash(i, 1, 77) * W), ty = Math.floor(mid[tx]) + 2 + Math.floor(hash(i, 2, 77) * 8), r = 2 + Math.floor(hash(i, 3, 77) * 2);
      for (y = -r * 2; y <= 0; y++) for (x = -r; x <= r; x++) if (Math.abs(x) <= r * (1 + y / (r * 2)) + 0.5) pb.set(tx + x, ty + y, x < 0 ? '#5d9468' : '#4c8059');
    }
    // capelinha no morro
    var cx = 214, cy = Math.floor(far[cx]) + 6;
    for (y = 0; y < 9; y++) for (x = -5; x <= 5; x++) pb.set(cx + x, cy + y, (x === 0 && y > 4) ? '#8a6a5a' : (x < 0 ? '#f6efe2' : '#e1d8c8'));
    for (y = 0; y < 5; y++) for (x = -6 + y; x <= 6 - y; x++) pb.set(cx + x, cy - 1 - y, x < 0 ? '#d9653b' : '#b84f2c');
    for (y = 0; y < 5; y++) pb.set(cx, cy - 6 - y, '#fff6e0');
    pb.set(cx - 1, cy - 9, '#fff6e0'); pb.set(cx + 1, cy - 9, '#fff6e0');
    for (x = 0; x < W; x++) for (y = Math.floor(nearR[x]); y < H; y++) pb.set(x, y, y < nearR[x] + 2 ? '#7fb36a' : '#6aa25e');
    return pb.done();
  }

  /* ---------------- montagem ---------------- */
  function mount(host) {
    var reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

    var root = document.createElement('div'); root.className = 'hd2d-root';
    host.appendChild(root);
    var renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5); // pixel art não ganha com 2x; poupa o passe de desfoque
    renderer.setPixelRatio(DPR);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    var H = buildHUD(root);

    var disposables = [];
    function track(o) { disposables.push(o); return o; }
    function tex(c, repeat) {
      var t = new THREE.CanvasTexture(c);
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      return track(t);
    }
    function smoothTex(c) { var t = new THREE.CanvasTexture(c); return track(t); }

    var scene = new THREE.Scene();
    scene.background = smoothTex(paintSky());
    var camera = new THREE.PerspectiveCamera(20, 0.5, 1, 260);

    /* luzes */
    var hemi = new THREE.HemisphereLight(0xd2e2ff, 0x9a8060, 0.5); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffd9a2, 1.12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -13; sc.right = 13; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 70;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    sun.position.set(-9, 16, 5); sun.target.position.set(0, 0, -2);
    scene.add(sun); scene.add(sun.target);

    /* terreno em blocos */
    var groundTex = tex(paintGround());
    var sideTex = tex(paintSides());
    (function buildTerrain() {
      var tp = [], tn = [], tu = [], sp = [], sn = [], su = [];
      var NX = X1 - X0 + 1, NZ = Z1 - Z0 + 1, eps = 0.5 / 64;
      function quad(arrP, arrN, arrU, a, b, c, d, n, uv) {
        // a,b,c,d em sentido anti-horário visto de fora
        arrP.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
        for (var i = 0; i < 6; i++) arrN.push(n[0], n[1], n[2]);
        arrU.push(uv[0], uv[1], uv[2], uv[3], uv[4], uv[5], uv[0], uv[1], uv[4], uv[5], uv[6], uv[7]);
      }
      for (var z = Z0; z <= Z1; z++) for (var x = X0; x <= X1; x++) {
        var h = cellH(x, z);
        var xa = x - 0.5, xb = x + 0.5, za = z - 0.5, zb = z + 0.5;
        var u0 = (xa - (X0 - 0.5)) / NX, u1 = (xb - (X0 - 0.5)) / NX;
        var v0 = 1 - (za - (Z0 - 0.5)) / NZ, v1 = 1 - (zb - (Z0 - 0.5)) / NZ;
        if (!isStream(x, z)) quad(tp, tn, tu, [xa, h, zb], [xb, h, zb], [xb, h, za], [xa, h, za], [0, 1, 0], [u0, v1, u1, v1, u1, v0, u0, v0]);
        var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var k = 0; k < 4; k++) {
          var nx = x + nb[k][0], nz = z + nb[k][1];
          var outside = nx < X0 || nx > X1 || nz < Z0 || nz > Z1;
          var nh = outside ? -2.5 : cellH(nx, nz);
          if (nh >= h) continue;
          if (outside && nb[k][1] !== 1) continue;
          var yTop = h, tile0 = (h >= 1 || (z <= -9 && !isStream(x, z))) ? 2 : 0;
          var seg = 0;
          while (yTop > nh + 0.001) {
            var yBot = Math.max(nh, yTop - 1);
            var tl = seg === 0 ? tile0 : (tile0 === 2 ? 3 : 1);
            var tu0 = tl * 0.25 + eps, tu1 = (tl + 1) * 0.25 - eps;
            var tvTop = 1 - eps, tvBot = 1 - (yTop - yBot) + eps;
            var A, B, C, D, N;
            if (k === 0) { A = [xb, yBot, zb]; B = [xb, yBot, za]; C = [xb, yTop, za]; D = [xb, yTop, zb]; N = [1, 0, 0]; }
            else if (k === 1) { A = [xa, yBot, za]; B = [xa, yBot, zb]; C = [xa, yTop, zb]; D = [xa, yTop, za]; N = [-1, 0, 0]; }
            else if (k === 2) { A = [xa, yBot, zb]; B = [xb, yBot, zb]; C = [xb, yTop, zb]; D = [xa, yTop, zb]; N = [0, 0, 1]; }
            else { A = [xb, yBot, za]; B = [xa, yBot, za]; C = [xa, yTop, za]; D = [xb, yTop, za]; N = [0, 0, -1]; }
            quad(sp, sn, su, A, B, C, D, N, [tu0, tvBot, tu1, tvBot, tu1, tvTop, tu0, tvTop]);
            yTop = yBot; seg++;
          }
        }
      }
      function mk(p, n, u, map) {
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
        var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: map }));
        m.receiveShadow = true; scene.add(m); return m;
      }
      mk(tp, tn, tu, groundTex);
      mk(sp, sn, su, sideTex).castShadow = false;
    })();

    /* água */
    var waterUni = { uT: { value: 0 } };
    var waterMat = new THREE.ShaderMaterial({ uniforms: waterUni, vertexShader: WATER_VS, fragmentShader: WATER_FS });
    (function buildWater() {
      var P = [], E = [];
      function strip(z0, z1, cxa, y) {
        var xs = [cxa - 1.5, cxa - 1.1, cxa + 1.1, cxa + 1.5], es = [0, 0.4, 0.4, 0];
        // as bordas: e = 0 na margem; "centro" 0.4..1 calculado no meio
        xs = [cxa - 1.5, cxa - 0.9, cxa, cxa + 0.9, cxa + 1.5]; es = [0, 0.6, 1, 0.6, 0];
        for (var i = 0; i < xs.length - 1; i++) {
          var a = xs[i], b = xs[i + 1];
          P.push(a, y, z1, b, y, z1, b, y, z0, a, y, z1, b, y, z0, a, y, z0);
          E.push(es[i], es[i + 1], es[i + 1], es[i], es[i + 1], es[i]);
        }
      }
      for (var z = -8; z <= Z1; z++) strip(z - 0.5, z + 0.5, streamCenter(z), -0.25);
      for (z = Z0; z <= -9; z++) strip(z - 0.5, z + 0.5, streamCenter(z), 0.75);
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 1));
      var m = new THREE.Mesh(g, waterMat); scene.add(m);
      // cachoeira
      var fg = new THREE.BufferGeometry(), fx0 = -2.5, fx1 = 0.5, fz = -8.5;
      fg.setAttribute('position', new THREE.Float32BufferAttribute([fx0, -0.25, fz, fx1, -0.25, fz, fx1, 0.75, fz, fx0, -0.25, fz, fx1, 0.75, fz, fx0, 0.75, fz], 3));
      fg.setAttribute('aEdge', new THREE.Float32BufferAttribute([0, 1, 1, 0, 1, 0], 1));
      var fm = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: waterUni, vertexShader: WATER_VS, fragmentShader: FALL_FS }));
      scene.add(fm);
    })();

    /* helpers de malha */
    var boxGeo = new THREE.BoxGeometry(1, 1, 1);
    var matCache = {};
    function lam(key, opts) { if (!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial(opts); return matCache[key]; }
    function worldBox(w, h, d, map, color, opts) {
      var g = new THREE.BoxGeometry(w, h, d);
      var uv = g.attributes.uv;
      // faces: +x,-x,+y,-y,+z,-z (4 vértices cada)
      var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (var f = 0; f < 6; f++) for (var i = 0; i < 4; i++) {
        var j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0], uv.getY(j) * dims[f][1]);
      }
      var o = { map: map }; if (color) o.color = color;
      if (opts) for (var kk in opts) o[kk] = opts[kk];
      var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial(o));
      m.castShadow = true; m.receiveShadow = true;
      return m;
    }

    var plankTex = tex(plankCanvas(false), true);
    var stoneTex = tex(stoneCanvas(), true);

    /* ponte */
    var bridge = new THREE.Group(); scene.add(bridge);
    var DECK_Y = 0.16, DECK_T = 0.14, GAP = 0.62;
    [-1, 1].forEach(function (s) {
      var a = GAP, b = 2.75, len = b - a;
      var deck = worldBox(len, DECK_T, 1.36, plankTex);
      deck.position.set(s * (a + len / 2), DECK_Y - DECK_T / 2, 0.15); bridge.add(deck);
      [-0.5, 0.8].forEach(function (zz) {
        var str = worldBox(len, 0.12, 0.12, plankTex, 0x8a6a50);
        str.position.set(s * (a + len / 2), DECK_Y - DECK_T - 0.06, zz); bridge.add(str);
      });
      // pilar no rio
      var pier = worldBox(0.28, 1.1, 1.3, stoneTex);
      pier.position.set(s * 0.56, -0.58 + 0.02, 0.15); bridge.add(pier);
      // guarda-corpo
      var posts = [a + 0.12, 1.55, b - 0.08];
      [-0.5, 0.8].forEach(function (zz) {
        posts.forEach(function (px) {
          var p = worldBox(0.14, 0.62, 0.14, plankTex, 0x9a7050);
          p.position.set(s * px, DECK_Y + 0.31, zz); bridge.add(p);
        });
        var rail = worldBox(b - a - 0.05, 0.08, 0.1, plankTex, 0xb08060);
        rail.position.set(s * ((a + 0.12 + b - 0.08) / 2), DECK_Y + 0.55, zz); bridge.add(rail);
      });
    });
    // lanternas nas cabeceiras
    var glowWarm = smoothTex(glowCanvas('rgba(255,236,170,1)', 'rgba(255,190,90,0.45)'));
    var glowWhite = smoothTex(glowCanvas('rgba(255,255,240,1)', 'rgba(255,245,200,0.4)'));
    var glows = [];
    function glowSprite(texr, x, y, z, s, op) {
      var m = new THREE.SpriteMaterial({ map: texr, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op });
      var sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, 1); scene.add(sp);
      sp.userData.base = op; glows.push(sp); return sp;
    }
    [[-2.75, 0.8], [2.75, 0.8]].forEach(function (lp) {
      var pole = worldBox(0.12, 1.25, 0.12, plankTex, 0x7a5a40); pole.position.set(lp[0], 0.62, lp[1] + 0.05); scene.add(pole);
      var lamp = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xffe08a })); lamp.scale.set(0.2, 0.22, 0.2);
      lamp.position.set(lp[0], 1.33, lp[1] + 0.05); scene.add(lamp);
      var cap = worldBox(0.3, 0.07, 0.3, plankTex, 0x5a3a24); cap.position.set(lp[0], 1.48, lp[1] + 0.05); scene.add(cap);
      glowSprite(glowWarm, lp[0], 1.33, lp[1] + 0.1, 1.3, 0.55);
    });

    /* vão + peça nova */
    var slot = new THREE.Mesh(new THREE.PlaneGeometry(GAP * 2, 1.36), new THREE.MeshBasicMaterial({ map: tex(slotCanvas()), transparent: true, depthWrite: false }));
    slot.rotation.x = -Math.PI / 2; slot.position.set(0, DECK_Y + 0.01, 0.15); scene.add(slot);
    var beamTex = tex(beamCanvas());
    var beamMat = new THREE.MeshLambertMaterial({ map: beamTex, emissive: 0xffc860, emissiveIntensity: 0 });
    var beam = new THREE.Mesh(new THREE.BoxGeometry(GAP * 2 + 0.02, DECK_T, 1.36), beamMat);
    beam.castShadow = true; scene.add(beam);
    var beamGlow = glowSprite(glowWarm, 0, 1, 0.15, 2.4, 0);

    /* sprites */
    var SPX = 1 / 16, TILT = 0.32;
    function spriteMesh(canvas, scale, opts) {
      var t = tex(canvas);
      var w = canvas.width * SPX * (scale || 1), h = canvas.height * SPX * (scale || 1);
      var g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
      var m = new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide });
      if (opts && opts.color) m.color.set(opts.color);
      var mesh = new THREE.Mesh(g, m);
      if (!opts || opts.shadow !== false) {
        mesh.castShadow = true;
        mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5, side: THREE.DoubleSide });
        disposables.push(mesh.customDepthMaterial);
      }
      var grp = new THREE.Group(); grp.add(mesh);
      mesh.rotation.x = -TILT;
      grp.userData.mesh = mesh;
      return grp;
    }
    var shadowTex = tex(blobShadowCanvas());
    var shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.28, depthWrite: false });
    var shadowGeo = new THREE.PlaneGeometry(1, 0.5); shadowGeo.rotateX(-Math.PI / 2);
    function blob(parent, w, y) { var m = new THREE.Mesh(shadowGeo, shadowMat); m.scale.set(w, 1, w); m.position.y = (y || 0) + 0.015; parent.add(m); return m; }

    // árvores
    var sways = [];
    var treeCanv = {
      round: canopyCanvas(3, 'round'), apple: canopyCanvas(5, 'apple'), pine: canopyCanvas(8, 'pine'), round2: canopyCanvas(12, 'round'), bush: canopyCanvas(14, 'bush'), bush2: canopyCanvas(17, 'bush')
    };
    var treeTex = {}; Object.keys(treeCanv).forEach(function (k) { treeTex[k] = treeCanv[k]; });
    function addTree(kind, x, z, s) {
      var y = cellH(Math.round(x), Math.round(z));
      var g = spriteMesh(treeTex[kind], s || 1);
      g.position.set(x, y, z); scene.add(g);
      blob(g, kind.indexOf('bush') === 0 ? 1.4 : 1.6 * (s || 1));
      if (kind.indexOf('bush') !== 0) sways.push(g.userData.mesh);
      return g;
    }
    [
      ['round', -5.6, -2.6, 1.05], ['apple', -7.2, -0.9, 1], ['pine', -6.3, -6.2, 1.1], ['round2', -4.4, -5.8, 0.95],
      ['pine', 6.9, -2.2, 1.0], ['round', 7.0, 1.7, 1.1], ['apple', 2.4, -6.4, 0.95], ['round2', -1.9, -10.6, 1.0],
      ['pine', -6.8, -11.5, 1.15], ['pine', 6.6, -10.4, 1.1], ['round', 0.9, -15.0, 1.1], ['pine', -7.5, -16.0, 1.2], ['round2', 7.4, -15.5, 1.1],
      ['apple', 6.1, 8.2, 1.15], ['round', -7.4, 7.2, 1.2], ['pine', 7.6, 12.2, 1.3], ['round2', -2.0, 12.4, 1.25],
      ['bush', -3.4, -2.1], ['bush2', 3.9, 2.4], ['bush', -6.2, 2.6], ['bush2', 5.8, -6.2], ['bush', -1.6, -7.2], ['bush2', 1.4, 7.6], ['bush', -3.0, 5.2], ['bush2', 4.4, 11.2], ['bush', -5.2, -9.6]
    ].forEach(function (d) { addTree(d[0], d[1], d[2], d[3]); });

    // juncos, flores e vitórias-régias
    var reedC = [reedCanvas(1), reedCanvas(2)];
    [[-1.55, -2.2], [1.6, -3.4], [-1.6, 2.6], [2.55, 6.2], [-0.6, 7.6], [1.5, -6.5], [-2.6, -5.2]].forEach(function (r, i) {
      var g = spriteMesh(reedC[i % 2], 1, { shadow: false }); g.position.set(r[0], i === 3 || i === 4 ? 0 : 0, r[1]); scene.add(g);
    });
    var flowerC = [flowerCanvas('#ffffff', '#ffd84a'), flowerCanvas('#ff8fb8', '#ffe066'), flowerCanvas('#ffd84a', '#e08a1a'), flowerCanvas('#b9a3ff', '#ffffff')];
    for (var fi = 0; fi < 26; fi++) {
      var fx = -8 + hash(fi, 1, 41) * 16, fz = 3 + hash(fi, 2, 41) * 12;
      if (isStream(Math.round(fx), Math.round(fz)) || pathD(fx, fz) < 0.3) continue;
      var fg = spriteMesh(flowerC[fi % 4], 1.2, { shadow: false }); fg.position.set(fx, cellH(Math.round(fx), Math.round(fz)), fz); scene.add(fg);
    }
    var lilyT = tex(lilyCanvas());
    var lilies = [];
    [[-0.7, 3.2], [0.9, 5.6], [-0.2, -3.8], [1.8, 9.5], [-1.4, -6.8]].forEach(function (l, i) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(10 * SPX * 1.2, 8 * SPX * 1.2), new THREE.MeshBasicMaterial({ map: lilyT, alphaTest: 0.5 }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = i * 1.3; m.position.set(l[0], -0.235, l[1]); scene.add(m); lilies.push(m);
    });

    // pedras
    [[-1.7, -1.0, 0.35], [1.75, 1.3, 0.3], [-1.6, 1.4, 0.25], [1.7, -0.9, 0.22], [2.6, 4.6, 0.3], [-2.4, -6.0, 0.3], [-0.2, -8.2, 0.4], [0.6, -8.3, 0.3]].forEach(function (r, i) {
      var b = worldBox(r[2] * 1.4, r[2], r[2] * 1.1, stoneTex, 0xd8d2c8);
      b.position.set(r[0], cellH(Math.round(r[0]), Math.round(r[1])) + r[2] * 0.35, r[1]); b.rotation.y = i * 0.7; scene.add(b);
    });

    /* casas */
    var smokeTex = tex(puffCanvas());
    var smokes = [];
    function buildHouse(o) {
      var g = new THREE.Group();
      var front = tex(wallCanvas(o.w, o.h, { door: o.door, windows: o.windows, seed: o.seed, mid: true }));
      var side = tex(wallCanvas(o.d, o.h, { windows: o.sideWin, seed: o.seed + 1 }));
      var mats = [side, side, null, null, front, front].map(function (t) { return t ? new THREE.MeshLambertMaterial({ map: t }) : lam('roofunder', { color: 0x5a3a24 }); });
      var body = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), mats);
      body.position.y = o.h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
      // telhado em duas águas (cumeeira ao longo de x)
      var ov = 0.28, rh = o.rh, x0 = -o.w / 2 - ov, x1 = o.w / 2 + ov, zf = o.d / 2 + ov, zb = -o.d / 2 - ov, yb = o.h - 0.08, yr = o.h + rh;
      var sl = Math.sqrt(rh * rh + (o.d / 2 + ov) * (o.d / 2 + ov));
      var rg = new THREE.BufferGeometry();
      var pos = [x0, yb, zf, x1, yb, zf, x1, yr, 0, x0, yb, zf, x1, yr, 0, x0, yr, 0,
                 x1, yb, zb, x0, yb, zb, x0, yr, 0, x1, yb, zb, x0, yr, 0, x1, yr, 0];
      var W2 = x1 - x0;
      var uvs = [0, 0, W2, 0, W2, sl, 0, 0, W2, sl, 0, sl, 0, 0, W2, 0, W2, sl, 0, 0, W2, sl, 0, sl];
      rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      rg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      rg.computeVertexNormals();
      var roofT = tex(roofCanvas(o.roof[0], o.roof[1], o.roof[2]), true);
      var roof = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: roofT, side: THREE.DoubleSide }));
      roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
      // empenas
      var gg = new THREE.BufferGeometry();
      var hw = o.w / 2 - 0.001, hd = o.d / 2;
      gg.setAttribute('position', new THREE.Float32BufferAttribute([hw, o.h, hd, hw, o.h, -hd, hw, yr - 0.05, 0, -hw, o.h, -hd, -hw, o.h, hd, -hw, yr - 0.05, 0], 3));
      gg.computeVertexNormals();
      var gm = new THREE.Mesh(gg, lam('gable' + o.seed, { color: o.gable || 0xe9d7b4 })); g.add(gm);
      // borda do telhado (beiral)
      var eave = worldBox(W2, 0.08, 0.1, plankTex, 0x6a4024); eave.position.set(0, yb - 0.03, zf); g.add(eave);
      // chaminé
      if (o.chimney) {
        var ch = worldBox(0.38, 1.0, 0.38, stoneTex); ch.position.set(o.w * 0.28, o.h + rh * 0.55 + 0.25, -o.d * 0.18); g.add(ch);
        for (var i = 0; i < 4; i++) {
          var sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false }));
          sm.userData = { i: i, x: o.x + o.w * 0.28, y: (o.y || 0) + o.h + rh * 0.55 + 0.8, z: o.z - o.d * 0.18 };
          scene.add(sm); smokes.push(sm);
        }
      }
      g.position.set(o.x, o.y || 0, o.z); g.rotation.y = o.ry || 0; scene.add(g);
      (o.glows || []).forEach(function (gp) { glowSprite(glowWarm, o.x + gp[0], (o.y || 0) + gp[1], o.z + o.d / 2 + 0.15, gp[2] || 0.9, 0.35); });
      return g;
    }
    buildHouse({ x: 3.75, z: -3.9, w: 2.75, h: 1.7, d: 2.1, rh: 1.15, door: [0.55], windows: [[1.55, 0.5]], sideWin: [[0.75, 0.45]], seed: 3,
      roof: ['#d9653b', '#9b3f22', '#f08a5a'], chimney: true, glows: [[0.55 - 1.375 + 0.95 + 0.33, 1.1, 0.9]] });
    buildHouse({ x: -4.8, y: 1, z: -13.2, w: 2.3, h: 1.4, d: 1.8, rh: 0.95, door: [0.9], windows: [[0.25, 0.4]], sideWin: [], seed: 7,
      roof: ['#4f86cf', '#2f5a98', '#7fb0ee'], chimney: true });
    buildHouse({ x: 3.6, y: 1, z: -16.2, w: 2.5, h: 1.5, d: 1.8, rh: 1.0, door: [0.4], windows: [[1.4, 0.45]], sideWin: [], seed: 9,
      roof: ['#5ea24a', '#3b7a33', '#8ccf62'], chimney: false });

    // caixotes e tábuas do Mestre Tomé
    var crateTex = tex(plankCanvas(true), true);
    var cr1 = worldBox(0.55, 0.5, 0.55, crateTex, 0xe8c8a0); cr1.position.set(4.3, 0.25, 1.35); scene.add(cr1);
    var cr2 = worldBox(0.45, 0.42, 0.45, crateTex, 0xe8c8a0); cr2.position.set(4.35, 0.71, 1.35); cr2.rotation.y = 0.3; scene.add(cr2);
    var pile = worldBox(1.3, 0.12, 0.42, beamTex ? crateTex : crateTex, 0xffe0b0); pile.position.set(3.4, 0.06, 1.75); scene.add(pile);
    var pile2 = worldBox(1.2, 0.12, 0.4, crateTex, 0xffd8a0); pile2.position.set(3.45, 0.18, 1.72); pile2.rotation.y = 0.08; scene.add(pile2);
    // placa
    var signP = worldBox(0.1, 0.8, 0.1, plankTex); signP.position.set(-3.1, 0.4, -0.75); scene.add(signP);
    var signB = worldBox(0.7, 0.32, 0.06, crateTex, 0xf0d0a0); signB.position.set(-3.1, 0.72, -0.72); scene.add(signB);
    // cerca no primeiro plano
    for (var fx2 = -8; fx2 <= -6.2; fx2 += 0.6) {
      var fp = worldBox(0.12, 0.55, 0.12, crateTex, 0xf4ead8); fp.position.set(fx2, 0.275, 3.6); scene.add(fp);
    }
    var fr = worldBox(2.0, 0.08, 0.08, crateTex, 0xf4ead8); fr.position.set(-7.1, 0.4, 3.6); scene.add(fr);
    for (fx2 = 4.0; fx2 <= 5.8; fx2 += 0.6) { var fp2 = worldBox(0.12, 0.55, 0.12, crateTex, 0xf4ead8); fp2.position.set(fx2, 0.275, -1.3); scene.add(fp2); }
    var fr2 = worldBox(1.9, 0.08, 0.08, crateTex, 0xf4ead8); fr2.position.set(4.9, 0.4, -1.3); scene.add(fr2);

    /* fundo: morros em pixel art */
    var bdTex = tex(paintBackdrop());
    var backdrop = new THREE.Mesh(new THREE.PlaneGeometry(64, 19.2), new THREE.MeshBasicMaterial({ map: bdTex, transparent: true, alphaTest: 0.5, fog: false }));
    backdrop.position.set(0, 6.0, -29); scene.add(backdrop);

    /* raios de luz */
    var shaftT = smoothTex(shaftCanvas());
    var shafts = [];
    [[-4.5, -6, 2.4, 0.18], [-1.8, -9, 1.6, 0.14], [1.5, -5, 2.0, 0.12]].forEach(function (s) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(s[2], 9), new THREE.MeshBasicMaterial({ map: shaftT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: s[3], side: THREE.DoubleSide }));
      m.position.set(s[0], 3.5, s[1]); m.rotation.z = -0.55; m.rotation.y = 0.2; m.userData.base = s[3]; scene.add(m); shafts.push(m);
    });

    /* personagens */
    var heroFrames = [heroFrame(0, HERO_LEGS[0]), heroFrame(1, HERO_LEGS[1]), heroFrame(2, HERO_LEGS[2]), heroFrame(1, HERO_LEGS[3]), heroFrame(1, HERO_IDLE_LEGS)].map(function (r) { return tex(spriteRows(r, PAL, OUTL)); });
    var hero = spriteMesh(spriteRows(heroFrame(1, HERO_IDLE_LEGS), PAL, OUTL), 1);
    var heroMesh = hero.userData.mesh;
    scene.add(hero);
    var heroBlob = blob(hero, 0.9);
    var tomeFrames = [tex(spriteRows(TOME_A, PAL, OUTL)), tex(spriteRows(TOME_B, PAL, OUTL))];
    var tome = spriteMesh(spriteRows(TOME_A, PAL, OUTL), 1);
    var tomeMesh = tome.userData.mesh;
    tome.position.set(3.25, 0, 0.55); scene.add(tome);
    blob(tome, 1.0);
    var bubble = spriteMesh(spriteRows(BUBBLE, PAL, OUTL), 1, { shadow: false });
    scene.add(bubble);
    var arrow = spriteMesh(spriteRows(ARROW, PAL, OUTL), 1, { shadow: false }); scene.add(arrow);

    /* partículas de luz */
    var MOTES = 46;
    var mp = [], ms = [], mc = [];
    for (var mi = 0; mi < MOTES; mi++) {
      var near = mi >= MOTES - 7;
      var mx = -6 + hash(mi, 1, 61) * 12, mz = near ? 8 + hash(mi, 2, 61) * 4 : -9 + hash(mi, 2, 61) * 16, my = near ? 1.5 + hash(mi, 3, 61) * 2 : 0.4 + hash(mi, 3, 61) * 2.2;
      if (!near && mi < 8) { mz = -16 + hash(mi, 2, 61) * 6; my = 1.4 + hash(mi, 3, 61) * 2; }
      mp.push(mx, my, mz);
      ms.push(hash(mi, 4, 61), 0, 0.15 + hash(mi, 5, 61) * 0.35, near ? 0.5 + hash(mi, 6, 61) * 0.3 : 0.22 + hash(mi, 6, 61) * 0.16);
      var warm = hash(mi, 7, 61) > 0.3;
      mc.push(warm ? 1.0 : 0.85, warm ? 0.86 : 1.0, warm ? 0.45 : 0.75);
    }
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
    mg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ms, 4));
    mg.setAttribute('aCol', new THREE.Float32BufferAttribute(mc, 3));
    var moteUni = { uT: { value: 0 }, uScale: { value: 400 } };
    var motes = new THREE.Points(mg, new THREE.ShaderMaterial({ uniforms: moteUni, vertexShader: MOTE_VS, fragmentShader: MOTE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    motes.frustumCulled = false; scene.add(motes);

    /* faíscas em pixel */
    var SPK = 26;
    var spP = new Float32Array(SPK * 3), spS = new Float32Array(SPK), spC = new Float32Array(SPK * 3), spA = new Float32Array(SPK);
    var spD = [];
    for (var si = 0; si < SPK; si++) {
      var ang = hash(si, 1, 71) * TAU, spd = 1.2 + hash(si, 2, 71) * 2.2;
      spD.push({ x: (si % 2 ? 1 : -1) * (0.45 + hash(si, 5, 71) * 0.2), vx: Math.cos(ang) * spd * 0.7, vz: Math.sin(ang) * spd * 0.45, vy: 2.0 + hash(si, 3, 71) * 2.6, delay: hash(si, 4, 71) * 0.08 });
      spS[si] = 0.05 + hash(si, 6, 71) * 0.05;
      var pal3 = [[1, 0.85, 0.3], [1, 0.95, 0.6], [1, 0.65, 0.25], [0.7, 0.95, 1]][si % 4];
      spC[si * 3] = pal3[0]; spC[si * 3 + 1] = pal3[1]; spC[si * 3 + 2] = pal3[2];
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spP, 3));
    sg.setAttribute('aSize', new THREE.BufferAttribute(spS, 1));
    sg.setAttribute('aCol', new THREE.BufferAttribute(spC, 3));
    sg.setAttribute('aAlpha', new THREE.BufferAttribute(spA, 1));
    var sparkUni = { uScale: { value: 400 } };
    var sparks = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: sparkUni, vertexShader: SPARK_VS, fragmentShader: SPARK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sparks.frustumCulled = false; scene.add(sparks);
    var puffs = [];
    for (var pi2 = 0; pi2 < 6; pi2++) {
      var pm = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false }));
      pm.userData = { side: pi2 % 2 ? 1 : -1, k: Math.floor(pi2 / 2) };
      pm.visible = false; scene.add(pm); puffs.push(pm);
    }
    var flash = glowSprite(glowWhite, 0, DECK_Y + 0.3, 0.3, 3.2, 0);

    /* pós-processamento: tilt-shift */
    var rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    var rt;
    var isGL2 = renderer.capabilities && renderer.capabilities.isWebGL2;
    if (isGL2 && THREE.WebGLMultisampleRenderTarget) { rt = new THREE.WebGLMultisampleRenderTarget(4, 4, rtOpts); rt.samples = 4; }
    else rt = new THREE.WebGLRenderTarget(4, 4, rtOpts);
    var postUni = {
      tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uFocus: { value: 0.5 },
      uBandTop: { value: 0.1 }, uBandBot: { value: 0.12 }, uRamp: { value: 0.22 }, uMaxTop: { value: 8 }, uMaxBot: { value: 9 }, uAll: { value: 0 }, uDim: { value: 0 }
    };
    var postMat = new THREE.ShaderMaterial({ uniforms: postUni, vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false });
    var postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat); postQuad.frustumCulled = false; postScene.add(postQuad);

    /* layout */
    var W = 1, Hh = 1, U = 1, baseDist = 50;
    var focusPt = new THREE.Vector3(0, 0, 0.2);
    var camTarget = new THREE.Vector3(-0.4, 0, -0.9);
    var PITCH = 38 * Math.PI / 180;
    function layout() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, r.width); Hh = Math.max(1, r.height);
      U = clamp(W / 390, 0.8, 1.4);
      H.hud.style.setProperty('--u', U.toFixed(4));
      renderer.setSize(W, Hh, false);
      var pw = Math.round(W * DPR), ph = Math.round(Hh * DPR);
      rt.setSize(pw, ph);
      postUni.uRes.value.set(pw, ph);
      postUni.uMaxTop.value = 7.5 * DPR * U; postUni.uMaxBot.value = 8.5 * DPR * U;
      var asp = W / Hh;
      camera.aspect = asp;
      // a largura útil (≈ 11 unidades no plano da ponte) cabe na tela
      var halfW = 4.55;
      var tanH = Math.tan(camera.fov * Math.PI / 360) * asp;
      baseDist = clamp(halfW / tanH, 26, 70);
      camera.updateProjectionMatrix();
      var sc2 = ph / (2 * Math.tan(camera.fov * Math.PI / 360));
      moteUni.uScale.value = sc2; sparkUni.uScale.value = sc2;
      // diálogo logo acima dos botões
      var barH = H.bar.offsetHeight || 72 * U;
      H.dlg.style.bottom = 'calc(env(safe-area-inset-bottom,0px) + 20px + ' + (barH + 22 * U).toFixed(1) + 'px)';
    }
    layout();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { layout(); }); ro.observe(host); }

    var tmpV = new THREE.Vector3();
    function project(x, y, z) {
      tmpV.set(x, y, z).project(camera);
      return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * Hh, v: (tmpV.y + 1) / 2 };
    }

    var LINE = 'A viga precisa se apoiar dos dois lados!';
    var lastN = -1;
    function setSay(n) {
      if (n === lastN) return; lastN = n;
      H.say.innerHTML = '';
      H.say.appendChild(document.createTextNode(LINE.slice(0, n)));
      var hid = document.createElement('i'); hid.textContent = LINE.slice(n); H.say.appendChild(hid);
    }
    setSay(0);

    var HERO_X0 = -3.95, HERO_Z0 = 2.5, HERO_X1 = -3.4, HERO_Z1 = 0.3;
    var t0 = performance.now(), raf = 0, curHeroF = -1, curTomeF = -1;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = typeof window.__SCENE_TIME === 'number' ? window.__SCENE_TIME : ((now - t0) / 1000) % LOOP;
      t = ((t % LOOP) + LOOP) % LOOP;
      var ph = t / LOOP, w = TAU / LOOP;
      var amp = reduced ? 0.15 : 1;

      /* câmera com dolly lento */
      var cyc = 0.5 - 0.5 * Math.cos(t * w);
      var dist = baseDist * (1 - 0.045 * cyc * amp);
      var tx = camTarget.x + Math.sin(t * w) * 0.35 * amp;
      camera.position.set(tx + Math.sin(t * w) * 0.6 * amp, camTarget.y + Math.sin(PITCH) * dist, camTarget.z + Math.cos(PITCH) * dist);
      camera.lookAt(tx, camTarget.y, camTarget.z);

      waterUni.uT.value = ph; moteUni.uT.value = ph;
      lilies.forEach(function (l, i) { l.position.y = -0.235 + Math.sin(t * w * 2 + i) * 0.01; l.rotation.z = i * 1.3 + Math.sin(t * w + i) * 0.08; });
      sways.forEach(function (m, i) { m.rotation.z = Math.sin(t * w + i * 1.7) * 0.022; });
      shafts.forEach(function (s, i) { s.material.opacity = s.userData.base * (0.75 + 0.25 * Math.sin(t * w + i * 2)); });
      smokes.forEach(function (s) {
        var k = (ph + s.userData.i / 4) % 1;
        s.position.set(s.userData.x + Math.sin(k * 3 + s.userData.i) * 0.15 + k * 0.4, s.userData.y + k * 1.4, s.userData.z);
        var sz = 0.35 + k * 0.5; s.scale.set(sz, sz, 1);
        s.material.opacity = 0.85 * Math.sin(k * Math.PI);
      });

      /* herói */
      var walkK = clamp(t / 1.2, 0, 1), walking = t < 1.2;
      walkK = walkK < 0.85 ? walkK : 0.85 + (1 - Math.pow(1 - (walkK - 0.85) / 0.15, 2)) * 0.15;
      if (t >= 3.3) walkK = 0;
      var hx = lerp(HERO_X0, HERO_X1, walkK), hz = lerp(HERO_Z0, HERO_Z1, walkK);
      var fIdx;
      var hop = (t > 2.4 && t < 2.8) ? Math.sin((t - 2.4) / 0.4 * Math.PI) : 0;
      if (walking) {
        fIdx = Math.floor(t * 9) % 4;
      } else fIdx = 4;
      if (fIdx !== curHeroF) { heroMesh.material.map = heroFrames[fIdx]; heroMesh.customDepthMaterial.map = heroFrames[fIdx]; curHeroF = fIdx; }
      var bob = walking && (fIdx === 1 || fIdx === 3) ? SPX : 0;
      if (!walking) bob = (Math.sin(t * w * 3) > 0.6 ? SPX : 0);
      hero.position.set(hx, 0, hz);
      heroMesh.position.y = bob + hop * 0.35;
      heroBlob.scale.set(0.9 - hop * 0.3, 1, 0.9 - hop * 0.3);

      /* Mestre Tomé: 2 quadros de gesto */
      var talking = t > 0.8 && t < 2.3;
      var cheer = t > 2.35 && t < 2.9;
      var tf = talking ? (Math.floor((t - 0.8) / 0.2) % 2) : (cheer ? 1 : 0);
      if (tf !== curTomeF) { tomeMesh.material.map = tomeFrames[tf]; tomeMesh.customDepthMaterial.map = tomeFrames[tf]; curTomeF = tf; }
      tomeMesh.position.y = cheer ? Math.abs(Math.sin((t - 2.35) * 11)) * 0.08 : 0;
      var bIn = sstep(0.72, 0.85, t) * (1 - sstep(2.25, 2.4, t));
      bubble.position.set(3.0, 1.85 + Math.sin(t * w * 4) * 0.03, 0.6);
      bubble.scale.setScalar(0.001 + outBack(bIn) * 0.999 * (bIn > 0 ? 1 : 0));
      bubble.visible = bIn > 0.01;

      /* peça da ponte */
      var LAND = 2.2;
      var slotOn = t < LAND ? 1 : 0;
      slot.visible = slotOn > 0;
      slot.material.opacity = 0.55 + 0.45 * (Math.sin(t * 9) > 0 ? 1 : 0.4);
      arrow.visible = t < 1.62;
      arrow.position.set(0, DECK_Y + 0.65 + Math.abs(Math.sin(t * 5.5)) * 0.25, 0.15);
      arrow.scale.setScalar(1 - sstep(1.5, 1.62, t) + 0.001);
      if (t < 1.55 || t >= 3.3) { beam.visible = false; beamGlow.material.opacity = 0; }
      else {
        beam.visible = true;
        var by, rotY = 0, rotZ = 0;
        if (t < LAND) {
          var e = clamp((t - 1.55) / (LAND - 1.55), 0, 1);
          var ee = e * e * (1.6 - 0.6 * e);
          by = lerp(DECK_Y + 3.6, DECK_Y - DECK_T / 2, ee);
          rotY = (1 - e) * 0.9; rotZ = Math.sin(e * Math.PI) * 0.12;
        } else {
          var ft = t - LAND;
          by = DECK_Y - DECK_T / 2 + Math.abs(Math.sin(ft * 18)) * Math.exp(-ft * 12) * 0.14;
        }
        beam.position.set(0, by, 0.15); beam.rotation.set(0, rotY, rotZ);
        var sIn = outBack(clamp((t - 1.55) / 0.18, 0, 1));
        beam.scale.set(sIn, sIn, sIn);
        var gl = t < LAND ? 0.7 : 0.9 * Math.exp(-(t - LAND) * 5);
        beamMat.emissiveIntensity = t < LAND ? 0.12 + 0.08 * Math.sin(t * 20) : 0.55 * Math.exp(-(t - LAND) * 4);
        beamGlow.position.set(0, by + 0.1, 0.25); beamGlow.material.opacity = gl * Math.min(1, sIn);
      }
      var ft2 = t - LAND;
      flash.material.opacity = ft2 > 0 && ft2 < 0.5 ? (1 - ft2 / 0.5) * 0.9 : 0;
      flash.scale.setScalar(2 + ft2 * 4);
      for (var i = 0; i < SPK; i++) {
        var d = spD[i], st = ft2 - d.delay;
        if (st > 0 && st < 0.75 && t < 3.3) {
          var px = d.x + d.vx * st, py = DECK_Y + 0.05 + d.vy * st - 6.5 * st * st, pz = 0.15 + d.vz * st;
          // quantiza em "pixels" de mundo para leitura de pixel art
          spP[i * 3] = Math.round(px * 16) / 16; spP[i * 3 + 1] = Math.max(DECK_Y, Math.round(py * 16) / 16); spP[i * 3 + 2] = Math.round(pz * 16) / 16;
          spA[i] = (Math.floor(st * 20) % 3 === 2 && st > 0.4) ? 0.2 : 1 - sstep(0.45, 0.75, st);
        } else { spA[i] = 0; spP[i * 3 + 1] = -50; }
      }
      sg.attributes.position.needsUpdate = true; sg.attributes.aAlpha.needsUpdate = true;
      puffs.forEach(function (p) {
        var k = (ft2 - p.userData.k * 0.05) / 0.6;
        if (k > 0 && k < 1 && t < 3.3) {
          p.visible = true;
          p.position.set(p.userData.side * (0.55 + k * 0.5 + p.userData.k * 0.15), DECK_Y + 0.15 + k * 0.3 + p.userData.k * 0.06, 0.15 + (p.userData.k - 1) * 0.45);
          var s2 = 0.3 + k * 0.35; p.scale.set(s2, s2, 1); p.material.opacity = 0.95 * (1 - k);
        } else p.visible = false;
      });
      glows.forEach(function (g) { if (g !== beamGlow && g !== flash) g.material.opacity = g.userData.base * (0.85 + 0.15 * Math.sin(t * w * 2 + g.position.x)); });

      /* tilt-shift: foco acompanha a ponte; no fim do loop, desfoque geral disfarça o reinício */
      var fp = project(focusPt.x, focusPt.y, focusPt.z);
      postUni.uFocus.value = fp.v + 0.02;
      var rs = t > 3.0 ? Math.sin(clamp((t - 3.0) / 0.6, 0, 1) * Math.PI) : 0;
      postUni.uAll.value = rs * 7 * DPR * U;
      postUni.uDim.value = rs * 0.28;

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);

      /* HUD */
      var dIn = sstep(0.75, 0.92, t), dOut = 1 - sstep(2.85, 3.0, t);
      var dk = Math.min(dIn, dOut);
      H.dlg.style.opacity = dk > 0 ? Math.min(1, dk * 1.6).toFixed(3) : '0';
      H.dlg.style.transform = 'scaleY(' + (0.08 + 0.92 * dk).toFixed(3) + ')';
      var n = Math.floor(clamp((t - 0.88) / 1.0, 0, 1) * LINE.length);
      setSay(n);
      H.more.style.opacity = (n === LINE.length && Math.floor(t * 3.5) % 2 === 0 && dk > 0.9) ? '1' : '0';
      var bp = project(0, DECK_Y + 0.4, 0.15);
      var pt = clamp((t - 2.4) / 0.85, 0, 1);
      if (pt > 0 && pt < 1) {
        H.plus.style.opacity = (pt < 0.12 ? pt / 0.12 : 1 - sstep(0.6, 1, pt)).toFixed(3);
        var pw2 = H.plus.offsetWidth || 80;
        H.plus.style.transform = 'translate(' + (bp.x - pw2 / 2).toFixed(1) + 'px,' + (bp.y - 34 * U - pt * 70 * U).toFixed(1) + 'px) scale(' + (0.6 + 0.4 * outBack(clamp(pt / 0.22, 0, 1))).toFixed(3) + ')';
      } else H.plus.style.opacity = '0';
      var xpK = sstep(2.5, 2.95, t) * (1 - sstep(3.15, 3.45, t));
      var xp = 620 + 50 * xpK;
      H.fill.style.width = 'calc(' + (xp / 10).toFixed(2) + '% - ' + (4 * U).toFixed(1) + 'px)';
      H.xpn.textContent = String(Math.round(xp));
      var done = t > 2.42 && t < 3.3;
      H.chk.textContent = done ? '✓' : '';
      H.chk.style.background = done ? '#ffd970' : 'transparent';
      H.quest.style.borderColor = done ? '#fff1c4' : '';
      H.cur.style.transform = 'translateX(' + (Math.sin(t * w * 4) > 0 ? 2 * U : 0).toFixed(1) + 'px)';
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        var geos = [], mats = [];
        function collect(o) {
          if (o.geometry && geos.indexOf(o.geometry) < 0) geos.push(o.geometry);
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m && mats.indexOf(m) < 0) mats.push(m); });
        }
        scene.traverse(collect); postScene.traverse(collect);
        geos.forEach(function (g) { g.dispose(); });
        mats.forEach(function (m) { m.dispose(); });
        disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
        boxGeo.dispose();
        rt.dispose();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        host.innerHTML = '';
      }
    };
  }

  window.SCENES[ID] = { mount: mount };
})();
