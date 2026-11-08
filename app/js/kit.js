/* KidsSchooling — kit 3D reaproveitado das cenas aprovadas (combinado.js, chefao.js):
   materiais com "rim light", blocos de cantos arredondados, pinos hexagonais, travas borboleta,
   Herói (agora com menino/menina e 3 tons de pele), Mestre Tomé e Guardião da Ponte Antiga. */
(function () {
  'use strict';
  var KS = window.KS = window.KS || {};
  var u = KS.u, clamp = u.clamp;

  /* tons de pele: [pele, sombra (orelha/nariz), bochecha, cabelo] */
  KS.SKINS = [
    { skin: 0xffcfa6, skin2: 0xf7b98e, blush: 0xff9a8a, hair: 0x7a4426, brow: 0x5c321b, css: ['#ffcfa6', '#f7b98e', '#7a4426', '#5c321b'] },
    { skin: 0xd9a06b, skin2: 0xc98b58, blush: 0xe07a6a, hair: 0x4a2a18, brow: 0x3a2012, css: ['#d9a06b', '#c98b58', '#4a2a18', '#3a2012'] },
    { skin: 0x8d5a3b, skin2: 0x7a4b30, blush: 0xc0605a, hair: 0x241510, brow: 0x1a0f0a, css: ['#8d5a3b', '#7a4b30', '#241510', '#1a0f0a'] }
  ];

  KS.makeKit = function (scene) {
    var K = {};
    /* ----- materiais compartilhados com "rim light" leve ----- */
    var rimU = K.rimU = { uRimColor: { value: new THREE.Color(0xfff1d6) }, uRimStr: { value: 0.42 } };
    function addRim(m) {
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
        sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
      };
      m.customProgramCacheKey = function () { return 'ks-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
      return m;
    }
    K.addRim = addRim;
    var mats = {};
    function M(color, o) {
      var key = color + (o ? JSON.stringify(o) : '');
      if (mats[key]) return mats[key];
      var p = { color: color, roughness: 0.78, metalness: 0 };
      if (o) for (var k in o) p[k] = o[k];
      return (mats[key] = addRim(new THREE.MeshStandardMaterial(p)));
    }
    K.M = M;
    var geos = K.geos = {};
    function G(key, fn) { return geos[key] || (geos[key] = fn()); }
    K.G = G;

    /* bloco de cantos arredondados (normais analíticas, ~300 tri) */
    function rbox(w, h, d, r) {
      return G('rb' + w + '_' + h + '_' + d + '_' + r, function () {
        var n = 5, g = new THREE.BoxGeometry(1, 1, 1, n, n, n);
        var pos = g.attributes.position, nor = g.attributes.normal;
        var hs = [w / 2, h / 2, d / 2];
        function remap(v, half) { var a = half - r, i = Math.round((v + 0.5) * n); return [-half, -(a + 0.414 * r), -a, a, a + 0.414 * r, half][i]; }
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
    K.rbox = rbox;
    var gSph = K.gSph = G('sph', function () { return new THREE.SphereGeometry(1, 22, 16); });
    var gSphLo = K.gSphLo = G('sphlo', function () { return new THREE.SphereGeometry(1, 12, 8); });
    var gCyl = K.gCyl = G('cyl', function () { return new THREE.CylinderGeometry(1, 1, 1, 16); });
    var gHemi = K.gHemi = G('hemi', function () { return new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); });
    var gSmile = K.gSmile = G('smile', function () { return new THREE.TorusGeometry(1, 0.28, 6, 14, Math.PI); });
    var gCone = K.gCone = G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); });
    K.gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
    K.gBow = G('bow', function () {
      var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
      var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
    });
    /* trava borboleta "deitada" (para encaixar por cima, atravessando uma emenda ao longo de z) */
    K.gBowFlat = G('bowflat', function () {
      var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.026); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.026); s.lineTo(-0.1, 0.055); s.closePath();
      var e = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
      e.rotateX(-Math.PI / 2); e.rotateY(Math.PI / 2); e.translate(0, -0.012, 0); return e;
    });

    function mesh(geo, mat, sx, sy, sz, x, y, z, parent, noShadow) {
      var m = new THREE.Mesh(geo, mat);
      m.scale.set(sx, sy, sz); m.position.set(x, y, z);
      if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
      if (parent) parent.add(m);
      return m;
    }
    K.mesh = mesh;
    function ball(col, r, x, y, z, parent, o) { return mesh(gSph, M(col, o), r, r, r, x, y, z, parent); }
    K.ball = ball;
    function capsule(r, len, col, parent, o) {
      var g = new THREE.Group();
      mesh(gCyl, M(col, o), r, len, r, 0, -len / 2, 0, g);
      mesh(gSph, M(col, o), r, r, r, 0, 0, 0, g);
      mesh(gSph, M(col, o), r, r, r, 0, -len, 0, g);
      if (parent) parent.add(g);
      return g;
    }
    K.capsule = capsule;
    function block(w, h, d, col, x, y, z, ry, parent, r) {
      var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
      (parent || scene).add(m); return m;
    }
    K.block = block;
    var pinMats = {};
    K.pinMat = function (col) { return pinMats[col] || (pinMats[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); };

    function eye(parent, x, y, z, r) {
      var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
      mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
      mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
      mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
      return e;
    }

    /* textura de brilho radial (olhos do guardião, sol) */
    K.glowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
      var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
    })();

    /* ================= HERÓI (~10 anos; idêntico ao aprovado, com variação menino/menina e tons de pele) ================= */
    K.buildHero = function (opt) {
      var girl = !!(opt && opt.girl), P = KS.SKINS[(opt && opt.skin) | 0] || KS.SKINS[0];
      var SKIN = P.skin, SKIN2 = P.skin2, HAIR = P.hair;
      var hero = new THREE.Group(), hSq = new THREE.Group(), hB = new THREE.Group(); hero.add(hSq); hSq.add(hB);
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
      mesh(gSph, M(0xffc93c, { roughness: 0.4 }), 0.035, 0.035, 0.015, 0.09, 0.9, 0.155, hB);
      // mochila laranja com saco de dormir
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
      var head = new THREE.Group(); head.position.set(0, 1.24, 0.01); hB.add(head);
      mesh(gSph, M(SKIN, { roughness: 0.62 }), 0.215, 0.205, 0.2, 0, 0, 0, head);
      [-1, 1].forEach(function (sg) { ball(SKIN2, 0.045, sg * 0.21, -0.01, -0.01, head); });
      var HM = M(HAIR, { roughness: 0.6 });
      var hair = mesh(gHemi, HM, 0.232, 0.228, 0.226, 0, 0.0, -0.012, head); hair.rotation.x = -0.42;
      mesh(gSph, HM, 0.2, 0.17, 0.12, 0, -0.04, -0.11, head);
      mesh(gSph, HM, 0.13, 0.06, 0.09, -0.06, 0.15, 0.13, head).rotation.z = 0.35;
      mesh(gSph, HM, 0.1, 0.05, 0.08, 0.09, 0.16, 0.12, head).rotation.z = -0.4;
      if (girl) {
        // cabelo comprido atrás, mechas laterais, rabo de cavalo e presilha amarela
        mesh(gSph, HM, 0.215, 0.24, 0.14, 0, -0.12, -0.1, head);
        [-1, 1].forEach(function (sg) { var lk = mesh(gSph, HM, 0.06, 0.16, 0.07, sg * 0.19, -0.1, 0.03, head); lk.rotation.z = sg * 0.12; });
        var tail = new THREE.Group(); tail.position.set(0, 0.06, -0.2); head.add(tail);
        ball(HAIR, 0.085, 0, 0, -0.04, tail, { roughness: 0.6 });
        var tl = mesh(gSph, HM, 0.075, 0.17, 0.075, 0, -0.14, -0.1, tail); tl.rotation.x = 0.35;
        ball(0xffc93c, 0.038, 0, 0.02, 0.03, tail, { roughness: 0.4 });
        ball(0xff6f91, 0.03, 0.13, 0.17, 0.12, head, { roughness: 0.4 });
      } else {
        var tuft = mesh(gCone, HM, 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, head); tuft.rotation.z = -0.5;
      }
      var eyes = [eye(head, -0.078, 0.0, 0.17, 0.055), eye(head, 0.078, 0.0, 0.17, 0.055)];
      if (girl) [-1, 1].forEach(function (sg) { var la = mesh(gSph, M(0x2a2342), 0.026, 0.01, 0.012, sg * 0.118, 0.04, 0.17, head, true); la.rotation.z = sg * 0.5; });
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(P.brow), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, head, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(P.blush, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, head, true); });
      var mouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, head, true); mouth.rotation.z = Math.PI;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, head);
      hero.scale.setScalar(1.12);
      return { g: hero, sq: hSq, b: hB, legs: legs, arms: arms, head: head, eyes: eyes, mouth: mouth, phase: 0, walk: 0, cheer: 0 };
    };
    /* animação do herói: andar, parado, comemorar */
    K.animHero = function (h, dt, wall, speed) {
      var target = speed > 0.05 ? 1 : 0;
      h.walk += (target - h.walk) * u.damp(dt, 10);
      h.phase += dt * Math.PI * 2 * 1.9 * clamp(speed / 2.2, 0.6, 1.4) * (h.walk > 0.02 ? 1 : 0);
      var w = h.walk, ph = h.phase, sw = Math.sin(ph) * 0.75 * w;
      h.legs[0].rotation.x = sw; h.legs[1].rotation.x = -sw;
      h.arms[0].rotation.x = -sw * 0.9; h.arms[1].rotation.x = sw * 0.9;
      h.arms[0].rotation.z = -0.18; h.arms[1].rotation.z = 0.18;
      var bob = Math.abs(Math.cos(ph));
      h.b.position.y = bob * 0.07 * w;
      h.b.rotation.z = Math.sin(ph) * 0.07 * w;
      h.b.rotation.x = 0.1 * w;
      var ch = h.cheer;
      var jump = ch > 0 ? Math.abs(Math.sin(wall * 7)) * 0.18 * ch : 0;
      h.b.position.y += jump;
      var sq = 1 + (bob - 0.5) * 0.08 * w + Math.sin(wall * 3.1) * 0.01;
      h.sq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      h.arms[0].rotation.z -= ch * (2.3 + Math.sin(wall * 20) * 0.15); h.arms[1].rotation.z += ch * (2.3 + Math.sin(wall * 20 + 1) * 0.15);
      h.head.rotation.z = Math.sin(ph) * 0.05 * w + 0.08 * ch * Math.sin(wall * 9);
      h.mouth.scale.set(0.036 * (1 + ch * 0.35), 0.03 * (1 + ch * 1.4), 0.03);
      var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
      h.eyes[0].scale.y = h.eyes[1].scale.y = Math.max(0.1, blink);
    };

    /* ================= MESTRE TOMÉ (construtor, barba branca, capacete amarelo, avental marrom) ================= */
    K.buildTome = function () {
      var tome = new THREE.Group(), tB = new THREE.Group(); tome.add(tB);
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e, SHIRT = 0xd65a40, APRON = 0x8b5a2b;
      [-1, 1].forEach(function (sg) {
        var L = capsule(0.088, 0.3, 0x45577f, tB); L.position.set(sg * 0.13, 0.55, 0);
        mesh(gSph, M(0x6b3e22, { roughness: 0.55 }), 0.11, 0.08, 0.15, 0, -0.36, 0.04, L);
      });
      mesh(gSph, M(SHIRT), 0.31, 0.34, 0.26, 0, 0.92, 0, tB);
      mesh(G('apron', function () { return new THREE.CylinderGeometry(1, 1.08, 1, 18, 1, true, -1.05, 2.1); }), M(APRON, { side: THREE.DoubleSide, roughness: 0.85 }), 0.3, 0.52, 0.255, 0, 0.82, 0.012, tB);
      var bib = new THREE.Mesh(rbox(0.28, 0.24, 0.05, 0.02), M(APRON, { roughness: 0.85 })); bib.position.set(0, 1.08, 0.22); bib.rotation.x = -0.3; tB.add(bib);
      var pocket = new THREE.Mesh(rbox(0.2, 0.11, 0.04, 0.015), M(0x744820)); pocket.position.set(0.0, 0.72, 0.29); pocket.rotation.x = 0.08; tB.add(pocket);
      var ruler = new THREE.Mesh(rbox(0.035, 0.16, 0.02, 0.008), M(0xffc93c)); ruler.position.set(0.06, 0.8, 0.3); ruler.rotation.z = 0.18; tB.add(ruler);
      mesh(gCyl, M(0x6b3e22), 0.33, 0.04, 0.27, 0, 0.62, 0, tB);
      var arms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.33, 1.13, 0); tB.add(A);
        capsule(0.085, 0.14, SHIRT, A);
        var fa = capsule(0.072, 0.16, SKIN2, A); fa.position.y = -0.17;
        ball(SKIN, 0.088, 0, -0.38, 0, A);
        return A;
      });
      var head = new THREE.Group(); head.position.set(0, 1.47, 0.02); tB.add(head);
      mesh(gSph, M(SKIN2, { roughness: 0.6 }), 0.205, 0.21, 0.2, 0, 0, 0, head);
      [-1, 1].forEach(function (sg) { ball(0xeba57d, 0.045, sg * 0.2, -0.01, 0, head); });
      [[0, -0.15, 0.1, 0.17, 0.15, 0.12], [-0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0, -0.26, 0.07, 0.11, 0.1, 0.09], [-0.17, 0.0, 0.03, 0.06, 0.1, 0.07], [0.17, 0.0, 0.03, 0.06, 0.1, 0.07]].forEach(function (q) {
        mesh(gSph, M(0xf7f6f2, { roughness: 0.92 }), q[3], q[4], q[5], q[0], q[1], q[2], head);
      });
      var mouth = mesh(gSph, M(0x8c2f2a, { roughness: 0.5 }), 0.05, 0.03, 0.03, 0, -0.105, 0.19, head, true);
      [-1, 1].forEach(function (sg) { var mu = mesh(gSph, M(0xffffff, { roughness: 0.9 }), 0.07, 0.032, 0.045, sg * 0.055, -0.055, 0.19, head, true); mu.rotation.z = sg * 0.35; });
      ball(0xf09a7a, 0.045, 0, -0.005, 0.205, head);
      var eyes = [eye(head, -0.072, 0.035, 0.168, 0.047), eye(head, 0.072, 0.035, 0.168, 0.047)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0xffffff, { roughness: 0.9 }), 0.05, 0.02, 0.025, sg * 0.075, 0.105, 0.175, head, true); bw.rotation.z = sg * -0.3; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8f7a, { transparent: true, opacity: 0.55 }), 0.035, 0.02, 0.01, sg * 0.12, -0.03, 0.17, head, true); });
      var helm = mesh(gHemi, M(0xffc629, { roughness: 0.4 }), 0.222, 0.2, 0.222, 0, 0.1, -0.02, head); helm.rotation.x = -0.25;
      var brim = mesh(gCyl, M(0xf2a71a, { roughness: 0.4 }), 0.25, 0.022, 0.25, 0, 0.1, -0.01, head); brim.rotation.x = -0.25;
      var hridge = new THREE.Mesh(rbox(0.05, 0.05, 0.4, 0.02), M(0xf2a71a, { roughness: 0.4 })); hridge.position.set(0, 0.28, -0.07); hridge.rotation.x = -0.25; head.add(hridge);
      tome.scale.setScalar(1.12);
      return { g: tome, b: tB, arms: arms, head: head, eyes: eyes, mouth: mouth, talk: 0, point: 0, cheer: 0, conduct: 0 };
    };
    K.animTome = function (t, dt, wall) {
      var talk = t.talk, point = t.point, cheer = t.cheer, cond = t.conduct;
      var talkOsc = talk * (0.5 + 0.5 * Math.sin(wall * 9));
      t.b.position.y = Math.abs(Math.sin(wall * 2.2)) * 0.012 + cheer * Math.max(0, Math.sin(wall * 12)) * 0.05;
      t.b.rotation.z = Math.sin(wall * 7) * 0.035 * talk;
      var ta = t.arms[0], tr = t.arms[1];
      ta.rotation.set(0, 0, -0.12); tr.rotation.set(0, 0, 0.12);
      // fala: gesto com a mão direita
      tr.rotation.x = -talk * (0.7 + Math.sin(wall * 6) * 0.25); tr.rotation.z += talk * 0.35;
      // aponta (para a ponte)
      tr.rotation.x -= point * 1.0; tr.rotation.z += point * 0.3;
      // rege os blocos
      ta.rotation.x -= cond * (2.4 + Math.sin(wall * 14) * 0.25); ta.rotation.z -= cond * 0.35;
      tr.rotation.x -= cond * (2.4 + Math.sin(wall * 14 + 1.6) * 0.25) * (1 - point); tr.rotation.z += cond * 0.35;
      // joinha / comemora
      tr.rotation.x -= cheer * 2.2; tr.rotation.z += cheer * 0.2;
      ta.rotation.x -= cheer * 0.4; ta.rotation.z -= cheer * 0.6;
      t.head.rotation.x = -0.18 + Math.sin(wall * 11) * 0.05 * talk + cheer * Math.sin(wall * 16) * 0.06;
      t.head.rotation.z = 0.06 * talk + 0.05 * Math.sin(wall * 1.3);
      var sq = 1 + Math.sin(wall * 11) * 0.02 * talk;
      t.b.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      t.mouth.scale.set(0.05, 0.03 * (1 + talkOsc * 1.1 + cheer * 0.8), 0.03);
      var bl = (wall + 1.4) % 3.7, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
      t.eyes[0].scale.y = t.eyes[1].scale.y = Math.max(0.1, blink) * (1 - 0.35 * cheer);
    };

    /* ================= GUARDIÃO DA PONTE ANTIGA (pedra, madeira e musgo; olhos âmbar; sereno) ================= */
    K.buildGuardian = function () {
      var GST = 0xcbbba4, GST2 = 0xb8a690, GST3 = 0xd9cbb5, GWOOD = 0x8a5a34, GWOOD2 = 0x6f4526, MOSSC = 0x6f9e44, MOSSC2 = 0x5c8a3a, TEAL = 0x2fb5a3, PINC = 0xf2b968;
      var guard = new THREE.Group();
      var gBody = new THREE.Group(); guard.add(gBody);
      [-1, 1].forEach(function (sg) {
        block(0.98, 0.36, 1.18, GST2, sg * 0.62, 0.18, 0.08, 0, gBody, 0.1);
        block(0.74, 1.55, 0.74, GST, sg * 0.62, 1.12, 0, 0, gBody, 0.12);
        block(0.8, 0.16, 0.8, GWOOD, sg * 0.62, 1.2, 0, 0, gBody, 0.04);
        mesh(gSphLo, M(MOSSC), 0.36, 0.12, 0.36, sg * 0.62, 1.92, 0.05, gBody);
      });
      var torso = new THREE.Group(); torso.position.set(0, 1.95, 0); gBody.add(torso);
      block(1.95, 0.5, 1.05, GWOOD, 0, 0.12, 0, 0, torso, 0.1);
      [-1, 1].forEach(function (sg) { var bw = new THREE.Mesh(K.gBow, M(TEAL, { roughness: 0.5 })); bw.position.set(sg * 0.98, 0.12, 0.2); bw.rotation.y = sg * Math.PI / 2; bw.scale.setScalar(2.4); torso.add(bw); });
      block(2.2, 1.7, 1.22, GST, 0, 1.15, 0, 0, torso, 0.22);
      block(1.9, 0.5, 1.1, GST3, 0, 2.02, -0.02, 0, torso, 0.2);
      block(1.3, 0.95, 0.14, GWOOD, 0, 1.2, 0.62, 0, torso, 0.05);
      block(1.36, 0.1, 0.16, GWOOD2, 0, 1.68, 0.63, 0, torso, 0.03);
      var runeMat = new THREE.MeshBasicMaterial({ color: 0xffb648 });
      var rune = new THREE.Mesh(G('runearc', function () { return new THREE.TorusGeometry(0.34, 0.055, 6, 20, Math.PI); }), runeMat); rune.position.set(0, 1.0, 0.7); torso.add(rune);
      var runeB = new THREE.Mesh(rbox(0.86, 0.07, 0.04, 0.02), runeMat); runeB.position.set(0, 1.0, 0.7); torso.add(runeB);
      [-1, 1].forEach(function (sg) { var rp = new THREE.Mesh(rbox(0.07, 0.3, 0.04, 0.02), runeMat); rp.position.set(sg * 0.34, 0.86, 0.7); torso.add(rp); });
      var crackMat = new THREE.MeshBasicMaterial({ color: 0xffa83c });
      [[-0.75, 1.5, 0.62, 0.5, 0.35], [0.8, 0.85, 0.62, 0.45, -0.5], [-0.62, 0.62, 0.62, 0.3, 0.9]].forEach(function (q) { var cm = new THREE.Mesh(rbox(0.035, q[3], 0.02, 0.01), crackMat); cm.position.set(q[0], q[1], q[2]); cm.rotation.z = q[4]; torso.add(cm); });
      [-0.6, -0.2, 0.2, 0.6].forEach(function (px) { var pm2 = new THREE.Mesh(K.gHex, M(PINC, { roughness: 0.6, flatShading: true })); pm2.scale.setScalar(2.2); pm2.position.set(px, 2.3, 0.3); torso.add(pm2); });
      [[-0.75, 2.28, 0.0, 0.55], [0.7, 2.27, -0.1, 0.5], [0, 2.3, -0.3, 0.6]].forEach(function (q) { mesh(gSphLo, M(MOSSC), q[3], 0.16, q[3] * 0.8, q[0], q[1], q[2], torso); });
      [[-0.6, 2.4, 0.25, 0xff9ac1], [0.55, 2.39, 0.2, 0xffffff], [0.78, 2.37, -0.15, 0xffd23f], [-0.85, 2.36, -0.2, 0xffffff]].forEach(function (q) { ball(q[3], 0.06, q[0], q[1], q[2], torso); });
      var arms = [-1, 1].map(function (sg) {
        var sh = new THREE.Group(); sh.position.set(sg * 1.32, 1.85, 0); torso.add(sh);
        mesh(gSph, M(GST2), 0.56, 0.52, 0.56, 0, 0, 0, sh);
        mesh(gHemi, M(MOSSC), 0.5, 0.26, 0.5, 0, 0.26, 0, sh);
        ball(0xff9ac1, 0.05, sg * 0.1, 0.5, 0.2, sh); ball(0xffffff, 0.045, -sg * 0.15, 0.48, 0.1, sh);
        block(0.56, 1.0, 0.56, GST, 0, -0.62, 0, 0, sh, 0.12);
        var elbow = new THREE.Group(); elbow.position.set(0, -1.12, 0); sh.add(elbow);
        var bw = new THREE.Mesh(K.gBow, M(TEAL, { roughness: 0.5 })); bw.position.set(sg * 0.29, 0, 0); bw.rotation.y = sg * Math.PI / 2; bw.scale.setScalar(2.2); elbow.add(bw);
        block(0.5, 0.95, 0.5, GWOOD, 0, -0.45, 0, 0, elbow, 0.08);
        [-0.2, -0.65].forEach(function (yy) { mesh(gCyl, M(0xd9c08a, { roughness: 0.9 }), 0.27, 0.07, 0.27, 0, yy, 0, elbow); });
        block(0.62, 0.5, 0.5, GST3, 0, -1.08, 0.04, 0, elbow, 0.16);
        var vine = new THREE.Mesh(G('vine' + sg, function () { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0.3), new THREE.Vector3(sg * 0.1, -0.35, 0.36), new THREE.Vector3(sg * 0.05, -0.8, 0.33)]), 10, 0.03, 5, false); }), M(MOSSC2));
        sh.add(vine);
        return { sh: sh, elbow: elbow, sg: sg };
      });
      var head = new THREE.Group(); head.position.set(0, 2.62, 0.08); torso.add(head);
      mesh(gCyl, M(GST2), 0.32, 0.3, 0.32, 0, -0.18, 0, head);
      var hb = new THREE.Group(); hb.position.y = 0.55; head.add(hb);
      block(1.25, 1.08, 1.0, GST3, 0, 0, 0, 0, hb, 0.28);
      block(1.36, 0.2, 0.34, GWOOD, 0, 0.28, 0.4, 0, hb, 0.05);
      block(0.24, 0.36, 0.22, GST, 0, -0.05, 0.52, 0, hb, 0.08);
      [-1, 1].forEach(function (sg) { block(0.16, 0.34, 0.3, GST2, sg * 0.66, -0.02, 0, 0, hb, 0.06); });
      var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffbe4a });
      var eyes = [-1, 1].map(function (sg) {
        var e = new THREE.Group(); e.position.set(sg * 0.29, 0.07, 0.505); hb.add(e);
        mesh(gSph, M(0x5a4636, { roughness: 0.9 }), 0.17, 0.12, 0.05, 0, 0, -0.01, e, true);
        mesh(gSph, eyeMat, 0.13, 0.095, 0.05, 0, 0, 0.012, e, true);
        mesh(gSphLo, new THREE.MeshBasicMaterial({ color: 0xfff6dc }), 0.035, 0.03, 0.02, sg * -0.04 + 0.03, 0.03, 0.05, e, true);
        var lid = mesh(gHemi, M(GST3), 0.165, 0.16, 0.07, 0, 0, 0.0, e, true); lid.rotation.x = Math.PI / 2;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex, color: 0xffb040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        sp.position.set(0, 0, 0.08); sp.scale.setScalar(0.6); e.add(sp);
        return { e: e, lid: lid, sp: sp };
      });
      [-1, 1].forEach(function (sg) { var br = block(0.3, 0.07, 0.08, 0x8f7d68, sg * 0.29, 0.21, 0.5, 0, hb, 0.03); br.rotation.z = sg * -0.12; });
      var mouth = mesh(gSmile, M(0x5a4636, { roughness: 0.9 }), 0.13, 0.08, 0.06, 0, -0.27, 0.49, hb, true); mouth.rotation.z = Math.PI;
      [[0, -0.5, 0.42, 0.42, 0.2], [-0.28, -0.42, 0.42, 0.22, 0.18], [0.28, -0.42, 0.42, 0.22, 0.18], [0, -0.66, 0.36, 0.26, 0.16], [-0.46, -0.28, 0.38, 0.12, 0.2], [0.46, -0.28, 0.38, 0.12, 0.2]].forEach(function (q, k) { mesh(gSph, M(k % 2 ? MOSSC2 : MOSSC, { roughness: 0.95 }), q[3], q[4], 0.16, q[0], q[1], q[2], hb); });
      ball(0xffffff, 0.05, -0.18, -0.58, 0.55, hb); ball(0xff9ac1, 0.045, 0.2, -0.62, 0.5, hb);
      mesh(gHemi, M(MOSSC), 0.5, 0.18, 0.42, 0, 0.5, -0.05, hb);
      var sprout = new THREE.Group(); sprout.position.set(0.12, 0.62, 0.02); hb.add(sprout);
      mesh(gCyl, M(0x5c8a3a), 0.025, 0.3, 0.025, 0, 0.15, 0, sprout);
      [-1, 1].forEach(function (sg) { var lf = mesh(gSph, M(0x8cc65a, { roughness: 0.6 }), 0.13, 0.04, 0.07, sg * 0.12, 0.3, 0, sprout); lf.rotation.z = sg * 0.5; });
      ball(0xffd23f, 0.05, 0, 0.33, 0, sprout);
      return { g: guard, body: gBody, torso: torso, arms: arms, head: head, hb: hb, eyes: eyes, mouth: mouth, sprout: sprout, runeMat: runeMat, awake: 0, bow: 0, talk: 0 };
    };
    K.animGuardian = function (G2, dt, wall) {
      var a = G2.awake, bw = G2.bow;
      // respira devagar; acordado levanta a cabeça; "curva-se" ao aprovar
      G2.torso.rotation.x = 0.22 * (1 - a) + 0.32 * bw + Math.sin(wall * 0.9) * 0.012;
      G2.torso.position.y = 1.95 - 0.08 * (1 - a) + Math.sin(wall * 0.9) * 0.015;
      G2.head.rotation.x = 0.35 * (1 - a) + 0.25 * bw + Math.sin(wall * 1.3) * 0.02 * a;
      G2.head.rotation.z = Math.sin(wall * 0.7) * 0.03 * a;
      G2.hb.rotation.y = Math.sin(wall * 0.5) * 0.06 * a;
      G2.arms.forEach(function (ar) {
        ar.sh.rotation.x = -0.15 * a - 0.5 * bw;
        ar.sh.rotation.z = ar.sg * (0.12 + 0.06 * a + 0.04 * Math.sin(wall * 1.1));
        ar.elbow.rotation.x = -0.35 * a - 0.9 * bw - 0.25 * G2.talk * (0.5 + 0.5 * Math.sin(wall * 3 + ar.sg));
      });
      var open = a * (1 - 0.65 * bw);
      G2.eyes.forEach(function (e) {
        e.lid.rotation.x = Math.PI / 2 - open * 1.2;
        e.sp.material.opacity = 0.3 + 0.6 * a + 0.2 * Math.sin(wall * 2);
      });
      G2.runeMat.color.setHSL(0.1, 1, 0.55 + 0.12 * a + 0.05 * Math.sin(wall * 2.2));
      G2.mouth.scale.set(0.13, 0.08 * (1 + G2.talk * (0.5 + 0.5 * Math.sin(wall * 10))), 0.06);
      G2.sprout.rotation.z = Math.sin(wall * 2.1) * 0.12;
    };

    /* ================= faíscas, anéis e poeira (encaixes) ================= */
    var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
    var NSP = 90;
    var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }), NSP);
    var spCols = [0xfff27a, 0xffffff, 0x8ffff0, 0xffc93c], tmpC = new THREE.Color(), dummy = new THREE.Object3D();
    var spData = [];
    for (var i = 0; i < NSP; i++) { spData.push({ life: 0, t: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1, a: Math.random() * 6 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
    sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; sparks.renderOrder = 8; scene.add(sparks);
    var spNext = 0;
    var rings = [];
    for (i = 0; i < 4; i++) { var rm = new THREE.Mesh(G('ring', function () { return new THREE.RingGeometry(0.8, 1, 40); }), new THREE.MeshBasicMaterial({ color: 0xbffff6, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); rm.rotation.x = -Math.PI / 2; rm.visible = false; scene.add(rm); rings.push({ m: rm, t: 1, s: 1 }); }
    var ringNext = 0;
    K.burst = function (pos, n, power, size) {
      for (var k = 0; k < n; k++) {
        var d = spData[spNext]; spNext = (spNext + 1) % NSP;
        var an = Math.random() * Math.PI * 2, sp = (0.6 + Math.random() * 0.9) * (power || 1);
        d.p.copy(pos); d.v.set(Math.cos(an) * sp, (1.2 + Math.random() * 1.6) * (power || 1), Math.sin(an) * sp);
        d.life = 0.7 + Math.random() * 0.4; d.t = 0; d.s = (0.7 + Math.random() * 0.7) * (size || 1);
      }
      var r = rings[ringNext]; ringNext = (ringNext + 1) % rings.length;
      r.m.position.copy(pos); r.m.position.y += 0.02; r.t = 0; r.s = (size || 1) * 0.9; r.m.visible = true;
    };
    var camQ = new THREE.Quaternion();
    K.updateFx = function (dt, camera, wall) {
      camQ.copy(camera.quaternion);
      for (var k = 0; k < NSP; k++) {
        var d = spData[k];
        if (d.t < d.life) {
          d.t += dt; d.v.y -= 4.2 * dt; d.p.addScaledVector(d.v, dt);
          var f = d.t / d.life;
          dummy.position.copy(d.p); dummy.scale.setScalar(d.s * Math.sin(Math.min(1, f * 1.4) * Math.PI) * 1.3 + 0.0001);
        } else { dummy.position.set(0, -60, 0); dummy.scale.setScalar(0.0001); }
        dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + d.a);
        dummy.updateMatrix(); sparks.setMatrixAt(k, dummy.matrix);
      }
      sparks.instanceMatrix.needsUpdate = true;
      rings.forEach(function (r) {
        if (!r.m.visible) return;
        r.t += dt / 0.5;
        if (r.t >= 1) { r.m.visible = false; return; }
        r.m.scale.setScalar(r.s * (0.3 + u.outCubic(r.t) * 1.2)); r.m.material.opacity = (1 - r.t) * 0.85;
      });
    };
    return K;
  };
})();
