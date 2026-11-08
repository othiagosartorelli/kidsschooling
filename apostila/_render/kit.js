/* KidsSchooling — kit de modelos 3D para gerar as ilustrações da apostila.
   O código dos personagens (Herói, Dona Lia), dos blocos de encaixe (pinos hexagonais, travas
   borboleta), das barracas e caixotes foi copiado de prototipos/variacoes/scenes/dialogo.js
   (cena aprovada) e reorganizado em funções reutilizáveis. Três.js r128 global. */
(function () {
  'use strict';
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  window.makeKit = function (opts) {
    opts = opts || {};
    var R = rng(opts.seed || 20261115);
    var rimU = { uRimColor: { value: new THREE.Color(opts.rimColor || 0xffd9a0) }, uRimStr: { value: opts.rimStr == null ? 0.42 : opts.rimStr } };
    function addRim(m) {
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
        sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
      };
      m.customProgramCacheKey = function () { return 'kit-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : '') + (m.map ? 'm' : ''); };
      return m;
    }
    var mats = {};
    function M(color, o) {
      var key = color + (o ? JSON.stringify(o) : '');
      if (mats[key]) return mats[key];
      var p = { color: color, roughness: 0.78, metalness: 0 };
      if (o) for (var k in o) p[k] = o[k];
      return (mats[key] = addRim(new THREE.MeshStandardMaterial(p)));
    }
    var geos = {};
    function G(key, fn) { return geos[key] || (geos[key] = fn()); }
    function rbox(w, h, d, r) {
      return G('rb' + w + '_' + h + '_' + d + '_' + r, function () {
        var n = 5, g = new THREE.BoxGeometry(1, 1, 1, n, n, n);
        var pos = g.attributes.position, nor = g.attributes.normal;
        var hs = [w / 2, h / 2, d / 2];
        function remap(u, half) { var a = half - r, i = Math.round((u + 0.5) * n); return [-half, -(a + 0.414 * r), -a, a, a + 0.414 * r, half][i]; }
        for (var i = 0; i < pos.count; i++) {
          var p = [remap(pos.getX(i), hs[0]), remap(pos.getY(i), hs[1]), remap(pos.getZ(i), hs[2])];
          var inn = [clamp(p[0], -hs[0] + r, hs[0] - r), clamp(p[1], -hs[1] + r, hs[1] - r), clamp(p[2], -hs[2] + r, hs[2] - r)];
          var o = [p[0] - inn[0], p[1] - inn[1], p[2] - inn[2]], L = Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]);
          if (L > 1e-6) { o[0] /= L; o[1] /= L; o[2] /= L; pos.setXYZ(i, inn[0] + o[0] * r, inn[1] + o[1] * r, inn[2] + o[2] * r); nor.setXYZ(i, o[0], o[1], o[2]); }
          else pos.setXYZ(i, p[0], p[1], p[2]);
        }
        g.computeBoundingSphere();
        return g;
      });
    }
    var gSph = G('sph', function () { return new THREE.SphereGeometry(1, 28, 20); });
    var gSphLo = G('sphlo', function () { return new THREE.SphereGeometry(1, 14, 10); });
    var gCyl = G('cyl', function () { return new THREE.CylinderGeometry(1, 1, 1, 24); });
    var gHemi = G('hemi', function () { return new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); });
    var gSmile = G('smile', function () { return new THREE.TorusGeometry(1, 0.28, 6, 14, Math.PI); });
    var gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
    var gBow = G('bow', function () {
      var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
      var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
    });
    var gCone = G('cone', function () { return new THREE.ConeGeometry(1, 1, 12); });
    function mesh(geo, mat, sx, sy, sz, x, y, z, parent, noShadow) {
      var m = new THREE.Mesh(geo, mat);
      m.scale.set(sx, sy, sz); m.position.set(x, y, z);
      if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
      if (parent) parent.add(m);
      return m;
    }
    function ball(col, r, x, y, z, parent, o) { return mesh(gSph, M(col, o), r, r, r, x, y, z, parent); }
    function capsule(r, len, col, parent, o) {
      var g = new THREE.Group();
      mesh(gCyl, M(col, o), r, len, r, 0, -len / 2, 0, g);
      mesh(gSph, M(col, o), r, r, r, 0, 0, 0, g);
      mesh(gSph, M(col, o), r, r, r, 0, -len, 0, g);
      if (parent) parent.add(g);
      return g;
    }
    function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
    function tex(c) { var t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; }

    /* blocos de encaixe */
    var WOOD = 0xcd8d4e, WOOD2 = 0xc3803f, WOOD3 = 0xd89a5c, BEAM = 0x9a5f34, TEAL = 0x2fb5a3, PINC = 0xf2b968;
    var pinMats = {};
    function pinMat(col) { return pinMats[col] || (pinMats[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); }
    function pin(g, x, y, z, col) { var m = new THREE.Mesh(gHex, pinMat(col)); m.position.set(x, y + 0.025, z); m.castShadow = true; g.add(m); return m; }
    function bow(g, x, y, z, ry, col, s) { var m = new THREE.Mesh(gBow, M(col, { roughness: 0.5 })); m.position.set(x, y, z); m.rotation.y = ry; m.scale.set(s || 1, s || 1, 1); g.add(m); return m; }
    function block(w, h, d, col, x, y, z, ry, parent, r) {
      var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
      parent.add(m); return m;
    }
    function fruit(g, x, y, z, sx, sy, sz, col, ry) { var m = mesh(gSphLo, M(col, { roughness: 0.55 }), sx, sy, sz, x, y, z, g); m.rotation.y = ry || 0; return m; }

    function crate(parent, x, y, z, ry, fruitCol, kind, w, d) {
      w = w || 0.5; d = d || 0.36;
      var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; parent.add(g);
      block(w, 0.24, d, WOOD3, 0, 0.12, 0, 0, g, 0.035);
      [-1, 1].forEach(function (sg) { block(w + 0.02, 0.05, 0.03, BEAM, 0, 0.07 + (sg + 1) * 0.06, d / 2 + 0.006, 0, g, 0.012); });
      pin(g, -w / 2 + 0.06, 0.24, -d / 2 + 0.06, PINC); pin(g, w / 2 - 0.06, 0.24, -d / 2 + 0.06, PINC);
      if (!fruitCol) return g;
      var nx = Math.round(w / 0.11), nz = Math.round(d / 0.11);
      for (var a = 0; a < nx; a++) for (var b = 0; b < nz; b++) {
        var fx = -w / 2 + (a + 0.5) * w / nx + (R() - 0.5) * 0.02, fz = -d / 2 + (b + 0.5) * d / nz + (R() - 0.5) * 0.02;
        var heap = 0.04 * Math.sin((a + 0.5) / nx * Math.PI) * Math.sin((b + 0.5) / nz * Math.PI);
        var col = fruitCol[Math.floor(R() * fruitCol.length)];
        if (kind === 'lemon') fruit(g, fx, 0.26 + heap, fz, 0.062, 0.05, 0.05, col, R() * 3);
        else if (kind === 'grape') fruit(g, fx, 0.26 + heap, fz, 0.04, 0.04, 0.04, col);
        else fruit(g, fx, 0.265 + heap, fz, 0.058, 0.054, 0.058, col);
      }
      return g;
    }
    var awnT = {};
    function stripeTex(a, b) {
      var key = a + b; if (awnT[key]) return awnT[key];
      var cc = mkCanvas(128, 8, function (g, w, h) { for (var k = 0; k < 8; k++) { g.fillStyle = k % 2 ? b : a; g.fillRect(k * 16, 0, 16, h); } });
      var t = tex(cc); t.magFilter = THREE.LinearFilter; return (awnT[key] = t);
    }
    var gScal = G('scal', function () { return new THREE.CircleGeometry(1, 14, Math.PI, Math.PI); });
    function stall(cA, cB, goods, front) {
      var g = new THREE.Group();
      var cw = 1.5, cd = 0.62;
      block(cw, 0.6, cd, WOOD2, 0, 0.3, 0, 0, g, 0.05);
      block(cw + 0.1, 0.07, cd + 0.12, WOOD3, 0, 0.635, 0.02, 0, g, 0.03);
      block(cw - 0.12, 0.42, 0.04, front || (cA === '#fff6e6' ? 0x3fae6e : 0xfff1dc), 0, 0.3, cd / 2 + 0.01, 0, g, 0.02);
      [-0.5, 0, 0.5].forEach(function (px) { pin(g, px, 0.67, -0.24, PINC); });
      bow(g, -cw / 2 - 0.005, 0.45, 0.12, -Math.PI / 2, TEAL, 0.8); bow(g, cw / 2 + 0.005, 0.45, 0.12, Math.PI / 2, TEAL, 0.8);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) {
        var hh = q[1] > 0 ? 1.62 : 1.95;
        block(0.08, hh, 0.08, BEAM, q[0] * (cw / 2 + 0.02), hh / 2, q[1] * (cd / 2 + 0.06), 0, g, 0.025);
      });
      var awM = addRim(new THREE.MeshStandardMaterial({ map: stripeTex(cA, cB), roughness: 0.8, side: THREE.DoubleSide }));
      var aw = new THREE.Mesh(G('awn', function () { var p = new THREE.PlaneGeometry(1, 1, 1, 4); var pp = p.attributes.position; for (var k = 0; k < pp.count; k++) { var yy = pp.getY(k); pp.setZ(k, 0.06 * Math.sin((yy + 0.5) * Math.PI)); } p.computeVertexNormals(); return p; }), awM);
      aw.scale.set(cw + 0.36, 1.05, 1); aw.position.set(0, 1.83, 0.06); aw.rotation.x = -Math.PI / 2 + 0.36; aw.castShadow = true; aw.receiveShadow = true; g.add(aw);
      var n = 8;
      for (var k = 0; k < n; k++) {
        var sm = new THREE.Mesh(gScal, M(k % 2 ? cB : cA, { side: THREE.DoubleSide, roughness: 0.8 }));
        var fx = -(cw + 0.36) / 2 + (k + 0.5) * (cw + 0.36) / n;
        sm.scale.set((cw + 0.36) / n / 2, 0.1, 1); sm.position.set(fx, 1.66, 0.565); g.add(sm);
      }
      if (goods) goods(g);
      return g;
    }
    var FR_OR = [0xff8a1a, 0xff9a2a, 0xf57d12], FR_AP = [0xe8443a, 0xd93a3a, 0xf05a3a], FR_LE = [0xffe14a, 0xffd23f, 0xfff06a], FR_GR = [0x8a4fc4, 0x7a46b4, 0x9c62d4], FR_GN = [0x8bd14a, 0x7cc23f];
    function liaStall() {
      return stall('#fff6e6', '#3fae6e', function (g) {
        crate(g, -0.45, 0.67, 0.0, 0.05, FR_OR, 'or');
        crate(g, 0.08, 0.67, -0.02, -0.04, FR_AP, 'ap');
        crate(g, 0.55, 0.67, 0.02, 0.06, FR_LE, 'lemon', 0.4);
        crate(g, -0.5, 0, 0.62, 0.2, FR_GN, 'ap', 0.46, 0.34);
        crate(g, 0.2, 0, 0.66, -0.15, FR_GR, 'grape', 0.44, 0.32);
      });
    }
    /* banca de brinquedos (para "desejo"): blocos de encaixe coloridos, bola e pião */
    function toyStall() {
      return stall('#3a8ee6', '#fff3e6', function (g) {
        var cols = [0xff6f91, 0xffc93c, 0x43c59e, 0x4a8ff0, 0xff8a2a];
        for (var k = 0; k < 5; k++) {
          var bx = -0.55 + k * 0.17, h = 0.12 + (k % 3) * 0.12;
          for (var j = 0; j < 1 + (k % 3); j++) { block(0.14, 0.12, 0.14, cols[(k + j) % 5], bx, 0.73 + j * 0.125, -0.05, 0, g, 0.025); }
          pin(g, bx, 0.67 + (1 + (k % 3)) * 0.125, -0.05, cols[(k + (k % 3)) % 5]);
        }
        var b = ball(0xff5a5a, 0.13, 0.42, 0.8, 0.05, g);
        var stripe = mesh(G('bst', function () { return new THREE.TorusGeometry(1, 0.12, 8, 24); }), M(0xfffaf0), 0.13, 0.13, 0.13, 0.42, 0.8, 0.05, g); stripe.rotation.y = 0.6;
        var top = mesh(gCone, M(0x9c62d4), 0.1, 0.16, 0.1, 0.2, 0.75, 0.15, g); top.rotation.x = Math.PI;
        ball(0xffc93c, 0.035, 0.2, 0.85, 0.15, g);
        crate(g, -0.45, 0, 0.62, 0.15, null, null, 0.5, 0.36);
        block(0.2, 0.2, 0.2, 0x43c59e, -0.5, 0.36, 0.62, 0.3, g, 0.04); pin(g, -0.5, 0.46, 0.62, 0x43c59e);
        ball(0x4a8ff0, 0.12, -0.28, 0.36, 0.66, g);
      });
    }

    /* banca de limonada do herói */
    function lemonStand() {
      var lemon = new THREE.Group();
      block(0.92, 0.5, 0.5, WOOD3, 0, 0.25, 0, 0, lemon, 0.04);
      var cloth = new THREE.Mesh(rbox(0.98, 0.06, 0.56, 0.025), addRim(new THREE.MeshStandardMaterial({ map: stripeTex('#ffe14a', '#fffaf0'), roughness: 0.85 }))); cloth.position.set(0, 0.52, 0); cloth.castShadow = true; cloth.receiveShadow = true; lemon.add(cloth);
      block(0.9, 0.3, 0.035, 0xffe14a, 0, 0.3, 0.26, 0, lemon, 0.015);
      pin(lemon, -0.36, 0.55, -0.18, PINC); pin(lemon, 0.36, 0.55, -0.18, PINC);
      bow(lemon, -0.465, 0.3, 0.0, -Math.PI / 2, TEAL, 0.75); bow(lemon, 0.465, 0.3, 0.0, Math.PI / 2, TEAL, 0.75);
      var pitcherM = addRim(new THREE.MeshStandardMaterial({ color: 0xfff2a0, roughness: 0.2, transparent: true, opacity: 0.85, emissive: 0xffc94a, emissiveIntensity: 0.25 }));
      var pitcher = new THREE.Mesh(G('pitch', function () { return new THREE.CylinderGeometry(0.085, 0.1, 0.26, 20); }), pitcherM); pitcher.position.set(-0.18, 0.68, 0.02); pitcher.castShadow = true; lemon.add(pitcher);
      var handle = mesh(G('hand', function () { return new THREE.TorusGeometry(1, 0.22, 6, 12, Math.PI); }), M(0xfff6d8, { roughness: 0.3 }), 0.06, 0.07, 0.07, -0.08, 0.69, 0.02, lemon); handle.rotation.z = -Math.PI / 2;
      [0.04, 0.17].forEach(function (gx) { var gl = new THREE.Mesh(G('glass', function () { return new THREE.CylinderGeometry(0.045, 0.038, 0.11, 14); }), pitcherM); gl.position.set(gx, 0.61, 0.1); gl.castShadow = true; lemon.add(gl); });
      [[0.3, 0.58, -0.08], [0.36, 0.58, 0.02], [0.27, 0.58, 0.06], [0.33, 0.63, -0.02]].forEach(function (q) { fruit(lemon, q[0], q[1], q[2], 0.062, 0.05, 0.05, 0xffe14a, R() * 3); });
      var signC = mkCanvas(128, 96, function (g, w, h) {
        g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#ffb21a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
        g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(64, 50, 28, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff3a8'; g.beginPath(); g.arc(64, 50, 21, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#ffd23f'; g.lineWidth = 3; for (var k = 0; k < 4; k++) { var a = k * Math.PI / 4; g.beginPath(); g.moveTo(64 - Math.cos(a) * 21, 50 - Math.sin(a) * 21); g.lineTo(64 + Math.cos(a) * 21, 50 + Math.sin(a) * 21); g.stroke(); }
      });
      block(0.05, 0.62, 0.05, BEAM, 0.4, 0.82, -0.2, 0, lemon, 0.02);
      var sign = new THREE.Mesh(rbox(0.36, 0.27, 0.035, 0.02), M(0xfffaf0)); sign.position.set(0.4, 1.12, -0.17); sign.castShadow = true; lemon.add(sign);
      var signF = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex(signC), toneMapped: false })); signF.scale.set(0.32, 0.24, 1); signF.position.set(0.4, 1.12, -0.15); signF.userData.noOutline = true; lemon.add(signF);
      return lemon;
    }

    var STONE = 0xe7c9b0, STONE2 = 0xd9b89e;
    function house(wall, roof) {
      var g = new THREE.Group();
      var bw = 1.95, bd = 1.6;
      [[-0.5, -0.42], [0.5, -0.42], [-0.5, 0.42], [0.5, 0.42]].forEach(function (q, j) { block(bw / 2 - 0.02, 0.26, bd / 2 - 0.02, j % 3 ? STONE : STONE2, q[0] * bw / 2, 0.13, q[1] * bd / 2, 0, g); });
      block(1.6, 1.05, 1.25, wall, 0, 0.26 + 0.525, 0, 0, g, 0.08);
      [-1, 1].forEach(function (sg) { var p = block(1.9, 0.12, 0.92, roof, 0, 1.6, sg * 0.37, 0, g, 0.05); p.rotation.x = sg * 0.6; });
      var ridge = mesh(gCyl, M(0x9a3f2e), 0.08, 1.96, 0.08, 0, 1.86, 0, g); ridge.rotation.z = Math.PI / 2;
      var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.64, 0); sh.lineTo(0.64, 0); sh.lineTo(0, 0.5); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false }); e.translate(0, 0, -0.78); e.rotateY(Math.PI / 2); return e; });
      mesh(tri, M(wall), 1, 1, 1, 0, 1.31, 0, g);
      block(0.4, 0.62, 0.08, 0x8e5632, -0.38, 0.26 + 0.32, 0.64, 0, g, 0.04);
      var winM = M(0xffd27a, { emissive: 0xffa53a, emissiveIntensity: 0.45, roughness: 0.3 });
      var w1 = new THREE.Mesh(rbox(0.38, 0.34, 0.06, 0.04), winM); w1.position.set(0.36, 0.86, 0.64); g.add(w1);
      block(0.46, 0.06, 0.12, 0xfffaf0, 0.36, 0.66, 0.66, 0, g, 0.025);
      block(0.06, 0.34, 0.07, 0xfffaf0, 0.36, 0.86, 0.665, 0, g, 0.02);
      block(0.44, 0.12, 0.14, 0x8e5632, 0.36, 0.6, 0.7, 0, g, 0.03);
      [0xff6f91, 0xffd23f, 0xffffff].forEach(function (fc, j) { ball(fc, 0.055, 0.23 + j * 0.13, 0.69, 0.72, g); });
      [-0.88, 0, 0.88].forEach(function (px) { [-0.72, 0.72].forEach(function (pz) { pin(g, px, 0.26, pz, 0xf3e3cf); }); });
      return g;
    }
    /* capelinha (para a oferta: parte de "Doar") — mesmo traço das casas */
    function chapel() {
      var g = house(0xfffaf0, 0x3aa5a8);
      var tw = new THREE.Group(); tw.position.set(0, 0, 0.2); g.add(tw);
      block(0.5, 0.6, 0.5, 0xfffaf0, 0, 2.05, -0.1, 0, tw, 0.05);
      var cn = mesh(G('cone4', function () { return new THREE.ConeGeometry(1, 1, 4); }), M(0x3aa5a8), 0.4, 0.5, 0.4, 0, 2.6, -0.1, tw); cn.rotation.y = Math.PI / 4;
      block(0.05, 0.3, 0.05, 0xffc93c, 0, 3.0, -0.1, 0, tw, 0.02);
      block(0.18, 0.05, 0.05, 0xffc93c, 0, 3.05, -0.1, 0, tw, 0.02);
      return g;
    }
    function tree(s, cc) {
      var g = new THREE.Group(); s = s || 1; cc = cc || 0x7fae4a;
      mesh(gCyl, M(0x9a6038), 0.11 * s, 0.7 * s, 0.11 * s, 0, 0.35 * s, 0, g);
      var c = new THREE.Color(cc), cDark = c.clone().multiplyScalar(0.84).getHex(), cLight = c.clone().lerp(new THREE.Color(0xffe2a0), 0.25).getHex();
      mesh(gSph, M(cc, { roughness: 0.85 }), 0.62 * s, 0.56 * s, 0.62 * s, 0, 1.05 * s, 0, g);
      mesh(gSph, M(cDark, { roughness: 0.85 }), 0.4 * s, 0.36 * s, 0.4 * s, -0.28 * s, 0.86 * s, 0.16 * s, g);
      mesh(gSph, M(cLight, { roughness: 0.85 }), 0.36 * s, 0.32 * s, 0.36 * s, 0.22 * s, 1.4 * s, 0.08 * s, g);
      return g;
    }
    function fountain() {
      var g = new THREE.Group(), n = 10, rad = 0.92;
      for (var k = 0; k < n; k++) {
        var a = k / n * Math.PI * 2, bx = Math.cos(a) * rad, bz = Math.sin(a) * rad;
        block(0.6, 0.34, 0.26, k % 2 ? STONE : STONE2, bx, 0.17, bz, -a + Math.PI / 2, g, 0.05);
        pin(g, bx, 0.34, bz, 0xfff1dc);
      }
      var wat = mesh(gCyl, M(0x5cc6d8, { roughness: 0.15 }), rad - 0.08, 0.04, rad - 0.08, 0, 0.26, 0, g);
      block(0.3, 0.9, 0.3, STONE, 0, 0.55, 0, 0.4, g, 0.06);
      mesh(G('bowl', function () { return new THREE.CylinderGeometry(1, 0.55, 0.5, 20); }), M(STONE2), 0.38, 0.32, 0.38, 0, 1.06, 0, g);
      mesh(gCyl, M(0x7fd6e6, { roughness: 0.15 }), 0.34, 0.02, 0.34, 0, 1.15, 0, g);
      ball(0xffc93c, 0.07, 0, 1.28, 0, g);
      return g;
    }
    function barrel() {
      var g = new THREE.Group();
      mesh(G('barrel', function () { return new THREE.CylinderGeometry(0.2, 0.18, 0.5, 16); }), M(WOOD2), 1, 1, 1, 0, 0.25, 0, g);
      [0.1, 0.4].forEach(function (yy) { mesh(G('band2', function () { return new THREE.TorusGeometry(0.2, 0.018, 5, 18); }), M(0x6a4a50, { roughness: 0.5 }), 1, 1, 1, 0, yy, 0, g).rotation.x = Math.PI / 2; });
      mesh(gCyl, M(WOOD3), 0.19, 0.02, 0.19, 0, 0.5, 0, g);
      return g;
    }
    /* coreto (palco do chefão) */
    function gazebo() {
      var g = new THREE.Group(), n = 8, rad = 0.85;
      mesh(G('oct', function () { return new THREE.CylinderGeometry(1, 1.04, 1, 8); }), M(STONE2), 1.0, 0.24, 1.0, 0, 0.12, 0, g);
      mesh(G('oct', function () { return new THREE.CylinderGeometry(1, 1.04, 1, 8); }), M(0xfff1dc), 0.94, 0.04, 0.94, 0, 0.26, 0, g);
      for (var k = 0; k < n; k++) {
        var a = (k + 0.5) / n * Math.PI * 2;
        block(0.08, 1.15, 0.08, 0xfffaf0, Math.cos(a) * rad, 0.24 + 0.575, Math.sin(a) * rad, 0, g, 0.025);
      }
      var roof = mesh(G('oroof', function () { return new THREE.ConeGeometry(1, 1, 8); }), M(0x9c62d4), 1.15, 0.6, 1.15, 0, 1.68, 0, g); roof.rotation.y = Math.PI / 8;
      ball(0xffc93c, 0.09, 0, 2.02, 0, g);
      return g;
    }

    /* personagens */
    var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
    function eye(parent, x, y, z, r) {
      var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
      mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
      mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
      var hl = mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true); hl.userData.noOutline = true;
      return e;
    }
    function noOut(m) { m.userData.noOutline = true; return m; }
    function makeHero() {
      var hero = new THREE.Group(), hB = new THREE.Group(); hero.add(hB);
      var PANTS = 0x2c3f7a, BLUE = 0x2f74e6, BLUE2 = 0x9cc4ff, ORANGE = 0xff8a2a, ORANGE2 = 0xe86f12;
      var legs = [-1, 1].map(function (sg) {
        var L = capsule(0.072, 0.32, PANTS, hB); L.position.set(sg * 0.105, 0.6, 0);
        mesh(gSph, M(0xf7f3ea), 0.09, 0.075, 0.13, 0, -0.38, 0.035, L);
        mesh(gSph, M(0xe2553f), 0.093, 0.035, 0.135, 0, -0.43, 0.035, L);
        return L;
      });
      mesh(gSph, M(PANTS), 0.19, 0.13, 0.15, 0, 0.62, 0, hB);
      mesh(gSph, M(BLUE), 0.205, 0.25, 0.16, 0, 0.84, 0, hB);
      mesh(gSph, M(0x2563c9), 0.2, 0.05, 0.155, 0, 0.66, 0, hB);
      var col = mesh(G('tor', function () { return new THREE.TorusGeometry(1, 0.35, 8, 18); }), M(BLUE2), 0.09, 0.09, 0.09, 0, 1.06, 0.0, hB); col.rotation.x = Math.PI / 2 - 0.25;
      noOut(mesh(gSph, M(0xffc93c, { roughness: 0.4 }), 0.035, 0.035, 0.015, 0.09, 0.9, 0.155, hB));
      var pack = new THREE.Mesh(rbox(0.32, 0.36, 0.17, 0.07), M(ORANGE, { roughness: 0.6 })); pack.position.set(0, 0.86, -0.2); pack.castShadow = true; hB.add(pack);
      var flap = new THREE.Mesh(rbox(0.33, 0.14, 0.18, 0.06), M(ORANGE2, { roughness: 0.6 })); flap.position.set(0, 0.99, -0.2); flap.castShadow = true; hB.add(flap);
      var pkt = new THREE.Mesh(rbox(0.2, 0.12, 0.06, 0.04), M(ORANGE2, { roughness: 0.6 })); pkt.position.set(0, 0.76, -0.3); hB.add(pkt);
      var roll = mesh(gCyl, M(0x5fae7a, { roughness: 0.8 }), 0.075, 0.38, 0.075, 0, 1.1, -0.21, hB); roll.rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) { var st = new THREE.Mesh(rbox(0.05, 0.36, 0.03, 0.015), M(ORANGE2)); st.position.set(sg * 0.1, 0.88, 0.14); st.rotation.x = -0.1; hB.add(st); });
      var arms = [-1, 1].map(function (sg) {
        var A = capsule(0.058, 0.26, BLUE, hB); A.position.set(sg * 0.24, 1.0, 0);
        ball(SKIN, 0.068, 0, -0.32, 0, A);
        return A;
      });
      arms[0].rotation.z = -0.16; arms[1].rotation.z = 0.16;
      var head = new THREE.Group(); head.position.set(0, 1.24, 0.01); hB.add(head);
      mesh(gSph, M(SKIN, { roughness: 0.62 }), 0.215, 0.205, 0.2, 0, 0, 0, head);
      [-1, 1].forEach(function (sg) { ball(SKIN2, 0.045, sg * 0.21, -0.01, -0.01, head); });
      var hair = mesh(gHemi, M(0x7a4426, { roughness: 0.6 }), 0.232, 0.228, 0.226, 0, 0.0, -0.012, head); hair.rotation.x = -0.42;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.2, 0.17, 0.12, 0, -0.04, -0.11, head);
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.13, 0.06, 0.09, -0.06, 0.15, 0.13, head).rotation.z = 0.35;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.1, 0.05, 0.08, 0.09, 0.16, 0.12, head).rotation.z = -0.4;
      var tuft = mesh(gCone, M(0x7a4426, { roughness: 0.6 }), 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, head); tuft.rotation.z = -0.5;
      eye(head, -0.078, 0.0, 0.17, 0.055); eye(head, 0.078, 0.0, 0.17, 0.055);
      [-1, 1].forEach(function (sg) { var bw = noOut(mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, head, true)); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { noOut(mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, head, true)); });
      var mouth = noOut(mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, head, true)); mouth.rotation.z = Math.PI;
      noOut(ball(SKIN2, 0.022, 0, -0.025, 0.205, head));
      var hand = new THREE.Object3D(); hand.position.set(0, -0.32, 0); arms[1].add(hand);
      return { root: hero, body: hB, arms: arms, legs: legs, head: head, mouth: mouth, hand: hand };
    }
    function makeLia() {
      var lia = new THREE.Group(), lB = new THREE.Group(); lia.add(lB);
      var LSKIN = 0xe9a877, LSKIN2 = 0xdc9567, BLOUSE = 0xffd27a, SKIRT = 0xc6533e, LAPRON = 0x3aa565, LAPRON2 = 0x2b8a52, SCARF = 0xe2463f;
      [-1, 1].forEach(function (sg) { mesh(gSph, M(0x6b3e22, { roughness: 0.55 }), 0.1, 0.075, 0.15, sg * 0.12, 0.06, 0.05, lB); });
      mesh(G('skirt', function () { return new THREE.CylinderGeometry(0.26, 0.335, 0.6, 24); }), M(SKIRT, { roughness: 0.85 }), 1, 1, 1, 0, 0.4, 0, lB);
      mesh(G('skhem', function () { return new THREE.TorusGeometry(0.325, 0.022, 6, 28); }), M(0xffc93c), 1, 1, 1, 0, 0.13, 0, lB).rotation.x = Math.PI / 2;
      mesh(gSph, M(BLOUSE), 0.29, 0.33, 0.25, 0, 0.92, 0, lB);
      noOut(mesh(G('apron', function () { return new THREE.CylinderGeometry(1, 1.08, 1, 20, 1, true, -1.05, 2.1); }), M(LAPRON, { side: THREE.DoubleSide, roughness: 0.85 }), 0.31, 0.62, 0.27, 0, 0.62, 0.02, lB));
      var bib = new THREE.Mesh(rbox(0.27, 0.24, 0.05, 0.02), M(LAPRON, { roughness: 0.85 })); bib.position.set(0, 1.03, 0.21); bib.rotation.x = -0.28; bib.castShadow = true; lB.add(bib);
      var pocket = new THREE.Mesh(rbox(0.22, 0.12, 0.04, 0.02), M(LAPRON2)); pocket.position.set(0, 0.6, 0.32); pocket.rotation.x = 0.1; lB.add(pocket);
      noOut(mesh(gSph, M(0xffd23f, { roughness: 0.35 }), 0.04, 0.04, 0.015, 0.05, 0.66, 0.335, lB, true));
      mesh(gCyl, M(LAPRON2), 0.3, 0.04, 0.26, 0, 0.86, 0.01, lB);
      [-1, 1].forEach(function (sg) { var st = new THREE.Mesh(rbox(0.04, 0.3, 0.03, 0.012), M(LAPRON2)); st.position.set(sg * 0.12, 1.16, 0.17); st.rotation.x = -0.45; lB.add(st); });
      var arms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.31, 1.12, 0); lB.add(A);
        capsule(0.082, 0.1, BLOUSE, A);
        var fa = capsule(0.066, 0.18, LSKIN2, A); fa.position.y = -0.15;
        ball(LSKIN, 0.08, 0, -0.38, 0, A);
        return A;
      });
      arms[0].rotation.z = -0.14; arms[1].rotation.z = 0.14;
      var head = new THREE.Group(); head.position.set(0, 1.44, 0.02); lB.add(head);
      mesh(gSph, M(LSKIN, { roughness: 0.6 }), 0.2, 0.205, 0.195, 0, 0, 0, head);
      [-1, 1].forEach(function (sg) { mesh(gSph, M(0x8a7a76, { roughness: 0.7 }), 0.07, 0.1, 0.09, sg * 0.165, 0.0, -0.03, head); });
      var scarf = mesh(gHemi, M(SCARF, { roughness: 0.7 }), 0.228, 0.235, 0.228, 0, 0.02, -0.015, head); scarf.rotation.x = -0.38;
      mesh(G('band', function () { return new THREE.TorusGeometry(1, 0.13, 8, 28); }), M(0xc23a34, { roughness: 0.7 }), 0.205, 0.205, 0.24, 0, 0.07, 0.02, head).rotation.x = Math.PI / 2 - 0.35;
      for (var di = 0; di < 9; di++) {
        var th = -1.0 + (di % 3) * 1.0 + (di > 2 ? 0.45 : 0), ph = 0.35 + Math.floor(di / 3) * 0.45;
        var dv = new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(ph), Math.cos(th) * Math.sin(ph)).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.38);
        if (dv.z > 0.55) continue;
        var dt = noOut(mesh(gSphLo, M(0xfffaf0, { roughness: 0.7 }), 0.022, 0.022, 0.01, dv.x * 0.232, dv.y * 0.238 + 0.02, dv.z * 0.232 - 0.015, head, true));
        dt.lookAt(dv.x * 2, dv.y * 2 + 0.02, dv.z * 2);
      }
      ball(SCARF, 0.06, 0, 0.14, -0.2, head);
      [-1, 1].forEach(function (sg) { var tl = mesh(gSph, M(SCARF, { roughness: 0.7 }), 0.05, 0.11, 0.025, sg * 0.05, 0.04, -0.25, head); tl.rotation.z = sg * 0.4; tl.rotation.x = 0.4; });
      eye(head, -0.07, 0.01, 0.17, 0.043); eye(head, 0.07, 0.01, 0.17, 0.043);
      var gRim = G('rim', function () { return new THREE.TorusGeometry(1, 0.11, 6, 22); });
      var glassM = M(0x7a3b2a, { roughness: 0.4 });
      [-1, 1].forEach(function (sg) { noOut(mesh(gRim, glassM, 0.058, 0.052, 0.058, sg * 0.072, 0.012, 0.195, head, true)); });
      noOut(mesh(gCyl, glassM, 0.008, 0.03, 0.008, 0, 0.022, 0.2, head, true)).rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) { var ar = noOut(mesh(gCyl, glassM, 0.007, 0.15, 0.007, sg * 0.14, 0.02, 0.12, head, true)); ar.rotation.x = Math.PI / 2; ar.rotation.z = sg * 0.35; });
      [-1, 1].forEach(function (sg) { var bw = noOut(mesh(gSph, M(0x6b5650), 0.042, 0.012, 0.015, sg * 0.072, 0.085, 0.185, head, true)); bw.rotation.z = sg * -0.25; });
      [-1, 1].forEach(function (sg) { noOut(mesh(gSphLo, M(0xff7f6a, { transparent: true, opacity: 0.55 }), 0.036, 0.021, 0.01, sg * 0.118, -0.05, 0.165, head, true)); });
      noOut(ball(LSKIN2, 0.032, 0, -0.03, 0.2, head));
      var mouth = noOut(mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.045, 0.034, 0.03, 0, -0.095, 0.18, head, true)); mouth.rotation.z = Math.PI;
      [-1, 1].forEach(function (sg) { noOut(ball(0xffc93c, 0.022, sg * 0.195, -0.07, 0.0, head, { roughness: 0.3, metalness: 0.3 })); });
      var hand = new THREE.Object3D(); hand.position.set(0, -0.38, 0); arms[1].add(hand);
      return { root: lia, body: lB, arms: arms, head: head, mouth: mouth, hand: hand };
    }

    /* moeda 3D (dourada, com R$ na face) */
    var coinTexCache = {};
    function coinFaceTex(label, base, ink) {
      var key = label + base; if (coinTexCache[key]) return coinTexCache[key];
      var c = mkCanvas(256, 256, function (g, w, h) {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 92, 0, Math.PI * 2); g.stroke();
        g.fillStyle = ink; g.font = '700 ' + (label.length > 2 ? 78 : 96) + 'px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(label, 128, 134);
      });
      return (coinTexCache[key] = tex(c));
    }
    function coin(opts2) {
      opts2 = opts2 || {};
      var r = opts2.r || 0.16, th = opts2.th || 0.04;
      var base = opts2.base || '#ffd23f', side = opts2.side || 0xe8a21a, ink = opts2.ink || '#b4700c';
      var faceM = addRim(new THREE.MeshStandardMaterial({ map: coinFaceTex(opts2.label || 'R$', base, ink), roughness: 0.35, metalness: 0.15 }));
      var sideM = M(side, { roughness: 0.35, metalness: 0.15 });
      var m = new THREE.Mesh(G('coin', function () { return new THREE.CylinderGeometry(1, 1, 1, 40); }), [sideM, faceM, faceM]);
      m.scale.set(r, th, r); m.castShadow = true; m.receiveShadow = true;
      var g = new THREE.Group(); g.add(m);
      return g;
    }
    function coinPile(n, spread) {
      var g = new THREE.Group(); spread = spread || 0.4;
      // pilhas + algumas soltas
      var stacks = [[0, 0, 7], [0.36, 0.08, 4], [-0.32, 0.12, 3]];
      stacks.forEach(function (s) {
        for (var k = 0; k < s[2]; k++) { var c = coin(); c.position.set(s[0] + (R() - 0.5) * 0.02, 0.02 + k * 0.042, s[1] + (R() - 0.5) * 0.02); c.rotation.y = R() * 6; g.add(c); }
      });
      [[0.2, 0.42, 0.3], [-0.18, 0.45, -0.4], [0.58, 0.4, 0.5]].forEach(function (q) { var c = coin(); c.position.set(q[0], 0.02, q[1]); c.rotation.set(0, q[2], 0); g.add(c); });
      var lean = coin(); lean.position.set(-0.5, 0.14, 0.32); lean.rotation.set(Math.PI / 2 - 0.35, 0, 0.3); g.add(lean);
      return g;
    }

    /* pote de vidro com tampa colorida, rótulo com ícone e palavra */
    var JARCOL = [
      { lid: '#ff6f91', lid2: '#e2507a', word: 'DOAR' },
      { lid: '#43c59e', lid2: '#2fa883', word: 'POUPAR' },
      { lid: '#4a8ff0', lid2: '#3474d6', word: 'GASTAR' }
    ];
    function labelTex(k) {
      var J = JARCOL[k];
      var c = mkCanvas(512, 400, function (g, w, h) {
        g.clearRect(0, 0, w, h);
        function rr(x, y, ww, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); }
        rr(10, 10, w - 20, h - 20, 60); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 16; g.strokeStyle = J.lid; g.stroke();
        g.save(); g.translate(256, 165); g.scale(7.2, 7.2); g.translate(-40, -55);
        if (k === 0) { g.fillStyle = '#ff6f91'; g.fill(new Path2D('M40 63c-6.6-4.6-11-8-11-12.4 0-2.8 2.2-4.9 4.9-4.9 2.3 0 4.3 1.4 6.1 3.6 1.8-2.2 3.8-3.6 6.1-3.6 2.7 0 4.9 2.1 4.9 4.9 0 4.4-4.4 7.8-11 12.4z')); }
        if (k === 1) {
          g.fillStyle = '#ff9fb6'; g.beginPath(); g.ellipse(40, 55, 9.4, 7.2, 0, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.arc(46.6, 53.2, 3.4, 0, Math.PI * 2); g.fill();
          g.fill(new Path2D('M34.5 49.5l1.6-3.6 2.6 3z'));
          g.fillStyle = '#f07a98'; g.beginPath(); g.ellipse(47.8, 53.6, 1.6, 1.3, 0, 0, Math.PI * 2); g.fill();
          g.fillRect(36.2, 60.4, 2.8, 3.6); g.fillRect(42, 60.4, 2.8, 3.6);
          g.fillStyle = '#5a2a3a'; g.beginPath(); g.arc(43, 51.8, 1, 0, Math.PI * 2); g.fill(); g.fillRect(37.4, 47.2, 5.6, 1.6);
        }
        if (k === 2) {
          g.strokeStyle = '#2f6fe0'; g.lineWidth = 2; g.stroke(new Path2D('M35.5 50.5v-1.6a4.5 4.5 0 0 1 9 0v1.6'));
          g.fillStyle = '#4a8ff0'; g.beginPath(); g.moveTo(35.1, 50); g.arcTo(48.5, 50, 48.5, 63.5, 3.6); g.arcTo(48.5, 63.5, 31.5, 63.5, 3.6); g.arcTo(31.5, 63.5, 31.5, 50, 3.6); g.arcTo(31.5, 50, 48.5, 50, 3.6); g.fill();
          g.strokeStyle = '#2f6fe0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(31.5, 55); g.lineTo(48.5, 55); g.stroke();
          g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(40, 58.4, 2, 0, Math.PI * 2); g.fill();
        }
        g.restore();
        g.fillStyle = '#2a3350'; g.font = '600 ' + (J.word.length > 4 ? 84 : 96) + 'px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillText(J.word, 256, 350);
      });
      return tex(c);
    }
    function jar(k, nCoins) {
      var J = JARCOL[k], g = new THREE.Group();
      var H = 0.62, Rr = 0.27;
      // moedas dentro (empilhadas e um pouco tortas)
      var n = nCoins == null ? 5 : nCoins;
      for (var i = 0; i < n; i++) { var c = coin({ r: 0.13, th: 0.035 }); c.position.set((i % 2 ? 0.05 : -0.05) + (R() - 0.5) * 0.04, 0.05 + i * 0.045, (R() - 0.5) * 0.06); c.rotation.set((R() - 0.5) * 0.25, R() * 6, (R() - 0.5) * 0.25); c.traverse(function (o) { o.userData.noOutline = true; }); g.add(c); }
      var glassM = addRim(new THREE.MeshStandardMaterial({ color: 0xcfeefa, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
      var body = new THREE.Mesh(G('jarb', function () {
        var pts = [], sh = [[0, 0], [Rr - 0.06, 0], [Rr, 0.05], [Rr, H - 0.12], [Rr - 0.05, H - 0.04], [Rr - 0.06, H]];
        // curva suave
        for (var t = 0; t <= 1.0001; t += 0.05) {
          var y = t * H, r;
          if (y < 0.05) r = (Rr - 0.06) + 0.06 * Math.sin(y / 0.05 * Math.PI / 2);
          else if (y > H - 0.12) r = Rr - 0.06 * Math.sin((y - (H - 0.12)) / 0.12 * Math.PI / 2);
          else r = Rr;
          pts.push(new THREE.Vector2(r, y));
        }
        pts.unshift(new THREE.Vector2(0, 0));
        return new THREE.LatheGeometry(pts, 40);
      }), glassM);
      body.renderOrder = 2; body.userData.glass = true; g.add(body);
      // brilho do vidro
      var shine = noOut(mesh(gCyl, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }), 0.018, 0.34, 0.018, -Rr * 0.72, 0.3, Rr * 0.68, g, true)); shine.renderOrder = 3;
      var shine2 = noOut(mesh(gCyl, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), 0.012, 0.1, 0.012, -Rr * 0.6, 0.53, Rr * 0.78, g, true)); shine2.renderOrder = 3;
      // tampa
      var lid = mesh(G('lid', function () { return new THREE.CylinderGeometry(1, 1, 1, 40); }), M(new THREE.Color(J.lid).getHex(), { roughness: 0.5 }), Rr - 0.02, 0.1, Rr - 0.02, 0, H + 0.05, 0, g);
      mesh(G('lidr', function () { return new THREE.TorusGeometry(1, 0.06, 8, 40); }), M(new THREE.Color(J.lid2).getHex(), { roughness: 0.5 }), Rr - 0.02, Rr - 0.02, 1.2, 0, H + 0.01, 0, g).rotation.x = Math.PI / 2;
      // fenda da moeda
      noOut(block(0.14, 0.02, 0.035, 0x3a2a2a, 0, H + 0.1, 0, 0, g, 0.008));
      // pino hexagonal da tampa (marca dos blocos)
      // rótulo (cartão creme na frente, levemente curvo)
      var lbl = new THREE.Mesh(G('lbl', function () { return new THREE.CylinderGeometry(Rr + 0.004, Rr + 0.004, 0.3, 30, 1, true, -0.72, 1.44); }), new THREE.MeshStandardMaterial({ map: labelTex(k), transparent: true, roughness: 0.7, side: THREE.FrontSide }));
      lbl.position.y = 0.28; lbl.renderOrder = 4; lbl.userData.noOutline = true; g.add(lbl);
      return g;
    }

    /* Contorno de ilustração (casco invertido, largura fixa em unidades de vista) */
    function addOutlines(root, width, color) {
      var list = [];
      root.traverse(function (o) {
        if (!o.isMesh || o.userData.noOutline || o.userData.isOutline || o.userData.glass) return;
        var mt = Array.isArray(o.material) ? o.material[0] : o.material;
        if (mt.transparent && mt.opacity < 0.9) return;
        list.push(o);
      });
      var om = new THREE.ShaderMaterial({
        uniforms: { uW: { value: width }, uC: { value: new THREE.Color(color) } },
        vertexShader: 'uniform float uW; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal); mv.xyz += n * uW; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC,1.0); }',
        side: THREE.BackSide
      });
      list.forEach(function (o) {
        var h = new THREE.Mesh(o.geometry, om); h.userData.isOutline = true; h.castShadow = false; h.receiveShadow = false;
        o.add(h);
      });
    }

    return {
      M: M, G: G, mesh: mesh, ball: ball, block: block, pin: pin, bow: bow, rbox: rbox, crate: crate, stall: stall, liaStall: liaStall, toyStall: toyStall,
      lemonStand: lemonStand, house: house, chapel: chapel, tree: tree, fountain: fountain, barrel: barrel, gazebo: gazebo,
      makeHero: makeHero, makeLia: makeLia, coin: coin, coinPile: coinPile, jar: jar, addOutlines: addOutlines, addRim: addRim,
      FR: { OR: FR_OR, AP: FR_AP, LE: FR_LE, GR: FR_GR, GN: FR_GN }, COL: { WOOD: WOOD, WOOD2: WOOD2, WOOD3: WOOD3, BEAM: BEAM, TEAL: TEAL, PINC: PINC, STONE: STONE, STONE2: STONE2 }, rng: R
    };
  };
})();
