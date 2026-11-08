/* Estilo: Massinha (claymation). three.js r128 global THREE. Pose em ~12 fps + "boiling". */
(function () {
  window.SCENES = window.SCENES || {};
  var T = 3.6, TAU = Math.PI * 2, NF = 43; // 43 quadros em 3,6 s ≈ 12 fps

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
  function hash(a, b) { var r = rng(a * 7919 + b * 104729 + 13); r(); return r(); }
  function n3(x, y, z, s) {
    return Math.sin(x * 1.7 + s) * Math.sin(y * 2.3 + s * 1.3) * Math.sin(z * 1.9 + s * 0.7) * 0.5 +
      Math.sin(x * 3.1 + y * 2.7 + s * 2.1) * 0.25 + Math.sin(y * 3.3 - z * 2.9 + s) * Math.sin(x * 2.1 + s) * 0.25;
  }

  /* texturas de argila (canvas) */
  function makeTextures() {
    var S = 256, R = rng(42);
    // relevo: ruído + digitais + amassados
    var b = document.createElement('canvas'); b.width = b.height = S; var c = b.getContext('2d');
    c.fillStyle = '#808080'; c.fillRect(0, 0, S, S);
    for (var i = 0; i < 900; i++) {
      var x = R() * S, y = R() * S, r = 2 + R() * 9, v = 128 + (R() - 0.5) * 50;
      var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ',.5)'); g.addColorStop(1, 'rgba(128,128,128,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (var f = 0; f < 7; f++) {
      var fx = R() * S, fy = R() * S, rot = R() * Math.PI, rx = 14 + R() * 10;
      c.save(); c.translate(fx, fy); c.rotate(rot);
      for (var k = 2; k < rx; k += 2.6) {
        c.strokeStyle = k % 5.2 < 2.6 ? 'rgba(90,90,90,.45)' : 'rgba(170,170,170,.4)'; c.lineWidth = 1.1;
        c.beginPath(); c.ellipse(0, 0, k, k * 1.35, 0, R() * 0.6, Math.PI * 2 - R() * 0.8); c.stroke();
      }
      c.restore();
    }
    for (i = 0; i < 40; i++) {
      x = R() * S; y = R() * S; r = 3 + R() * 6;
      g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, 'rgba(70,70,70,.45)'); g.addColorStop(1, 'rgba(128,128,128,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // cor: manchinhas claras/escuras (multiplica a cor base)
    var m = document.createElement('canvas'); m.width = m.height = S; var d = m.getContext('2d');
    d.fillStyle = '#f4f1ec'; d.fillRect(0, 0, S, S);
    for (i = 0; i < 500; i++) {
      x = R() * S; y = R() * S; r = 3 + R() * 16; var w = R() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(215,205,195,.35)';
      g = d.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, w); g.addColorStop(1, 'rgba(244,241,236,0)');
      d.fillStyle = g; d.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (i = 0; i < 1400; i++) { d.fillStyle = 'rgba(120,100,90,' + (R() * 0.12) + ')'; d.fillRect(R() * S, R() * S, 1, 1); }
    // água: ondinhas
    var wv = document.createElement('canvas'); wv.width = wv.height = S; var e = wv.getContext('2d');
    e.fillStyle = '#808080'; e.fillRect(0, 0, S, S);
    for (i = 0; i < 70; i++) {
      x = R() * S; y = R() * S; var L = 14 + R() * 30;
      e.strokeStyle = 'rgba(200,200,200,.55)'; e.lineWidth = 3 + R() * 3; e.lineCap = 'round';
      e.beginPath(); e.moveTo(x, y); e.quadraticCurveTo(x + L / 2, y - 5, x + L, y); e.stroke();
      e.strokeStyle = 'rgba(60,60,60,.35)'; e.lineWidth = 2; e.beginPath(); e.moveTo(x + 2, y + 4); e.quadraticCurveTo(x + L / 2, y, x + L - 2, y + 4); e.stroke();
    }
    return { bump: b, mottle: m, water: wv };
  }

  window.SCENES['massinha'] = {
    mount: function (host) {
      if (!window.THREE) {
        host.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;font-family:\'Baloo 2\',system-ui,sans-serif;color:#7a4b2a;background:#ffe9c9">Carregando massinha…</div>';
        return { destroy: function () { host.innerHTML = ''; } };
      }
      var THREE = window.THREE;
      var reduce = false;
      try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      host.style.background = '#cfe9f7';

      var disposables = [];
      function track(o) { disposables.push(o); return o; }

      /* ----- renderer ----- */
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.92;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      host.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(45, 0.46, 0.5, 120);

      /* ----- texturas ----- */
      var TX = makeTextures();
      var bumpTex = track(new THREE.CanvasTexture(TX.bump)); bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping; bumpTex.repeat.set(1.5, 1.5);
      var mottleTex = track(new THREE.CanvasTexture(TX.mottle)); mottleTex.wrapS = mottleTex.wrapT = THREE.RepeatWrapping; mottleTex.encoding = THREE.sRGBEncoding; mottleTex.repeat.set(1.5, 1.5);
      var waterTex = track(new THREE.CanvasTexture(TX.water)); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(1.2, 5);
      // céu de fundo pintado (cartolina de estúdio)
      var skyC = document.createElement('canvas'); skyC.width = 16; skyC.height = 256;
      (function () {
        var c = skyC.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#6fb8ea'); g.addColorStop(0.45, '#a9dcf5'); g.addColorStop(0.72, '#ffe6bf'); g.addColorStop(1, '#ffd9a8');
        c.fillStyle = g; c.fillRect(0, 0, 16, 256);
      })();
      var skyTex = track(new THREE.CanvasTexture(skyC)); skyTex.encoding = THREE.sRGBEncoding;
      scene.background = skyTex;

      /* ----- materiais ----- */
      var MATS = {};
      function clay(hex, o) {
        o = o || {};
        var key = hex + JSON.stringify(o);
        if (MATS[key]) return MATS[key];
        var m = new THREE.MeshStandardMaterial({
          color: new THREE.Color(hex).convertSRGBToLinear(), roughness: o.rough != null ? o.rough : 0.7, metalness: 0,
          map: o.noMap ? null : mottleTex, bumpMap: o.noBump ? null : (o.bumpMap || bumpTex), bumpScale: o.bump != null ? o.bump : 0.07,
          emissive: o.emissive ? new THREE.Color(o.emissive).convertSRGBToLinear() : new THREE.Color(0), emissiveIntensity: o.ei || 1,
          transparent: !!o.transparent, opacity: o.opacity != null ? o.opacity : 1
        });
        MATS[key] = track(m); return m;
      }

      /* ----- geometrias de argila ----- */
      function weld(g) {
        g.computeVertexNormals();
        var p = g.attributes.position, n = g.attributes.normal, map = {}, i, key;
        for (i = 0; i < p.count; i++) {
          key = Math.round(p.getX(i) * 1000) + '_' + Math.round(p.getY(i) * 1000) + '_' + Math.round(p.getZ(i) * 1000);
          var a = map[key] || (map[key] = [0, 0, 0]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i);
        }
        for (i = 0; i < p.count; i++) {
          key = Math.round(p.getX(i) * 1000) + '_' + Math.round(p.getY(i) * 1000) + '_' + Math.round(p.getZ(i) * 1000);
          var s = map[key], l = Math.hypot(s[0], s[1], s[2]) || 1; n.setXYZ(i, s[0] / l, s[1] / l, s[2] / l);
        }
        n.needsUpdate = true; return g;
      }
      var seedC = 1;
      function blob(r, amp, w, h) {
        var g = new THREE.SphereGeometry(r, w || 22, h || 16), p = g.attributes.position, v = new THREE.Vector3(), s = (seedC++) * 1.37;
        amp = amp == null ? 0.05 : amp; var fq = 2.4 / r;
        for (var i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i); var len = v.length() || 1;
          var k = 1 + amp * n3(v.x * fq, v.y * fq, v.z * fq, s);
          p.setXYZ(i, v.x * k, v.y * k, v.z * k);
        }
        return track(weld(g));
      }
      function rbox(w, h, d, r, amp, seg) {
        seg = seg || 5; r = Math.min(r, w / 2, h / 2, d / 2); amp = amp == null ? 0.03 : amp;
        var g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3(), q = new THREE.Vector3(), s = (seedC++) * 2.11;
        var ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r, fq = 2.2 / Math.max(r, 0.15);
        for (var i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          q.set(clamp(v.x, -ix, ix), clamp(v.y, -iy, iy), clamp(v.z, -iz, iz));
          var nx = v.x - q.x, ny = v.y - q.y, nz = v.z - q.z, l = Math.hypot(nx, ny, nz) || 1;
          var rr = r * (1 + amp * n3(v.x * fq, v.y * fq, v.z * fq, s));
          p.setXYZ(i, q.x + nx / l * rr, q.y + ny / l * rr, q.z + nz / l * rr);
        }
        return track(weld(g));
      }
      function cyl(rt, rb, h, seg) { return track(new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1)); }

      var boilers = [];
      function mesh(parent, geo, mat, x, y, z, sx, sy, sz, opt) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x || 0, y || 0, z || 0);
        if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
        opt = opt || {};
        if (opt.rx) m.rotation.x = opt.rx; if (opt.ry) m.rotation.y = opt.ry; if (opt.rz) m.rotation.z = opt.rz;
        m.castShadow = opt.cast !== false; m.receiveShadow = opt.receive !== false;
        parent.add(m);
        if (opt.boil !== false) boilers.push({ m: m, p: m.position.clone(), s: m.scale.clone(), r: m.rotation.clone(), a: opt.boil || 1 });
        return m;
      }
      function pivot(parent, x, y, z) { var o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; }

      /* ----- luzes de estúdio ----- */
      var hemi = new THREE.HemisphereLight(0xfff0dc, 0x7a5c40, 0.5); scene.add(hemi);
      var key = new THREE.DirectionalLight(0xffdcaa, 1.25);
      key.position.set(-6, 10, 8); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
      key.shadow.camera.near = 1; key.shadow.camera.far = 30; key.shadow.bias = -0.0015; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
      scene.add(key); key.target.position.set(0, 0, 1); scene.add(key.target);
      var fill = new THREE.DirectionalLight(0xbfd8ff, 0.32); fill.position.set(7, 4, 6); scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffd2a0, 0.35); rim.position.set(2, 5, -8); scene.add(rim);
      var flash = new THREE.PointLight(0xffd36a, 0, 4.5, 2); scene.add(flash);

      /* ----- cenário ----- */
      var C = {
        grass: '#5fb43f', grass2: '#94d16a', dirt: '#b8835a', water: '#2f8ed3', wood: '#a8693d', wood2: '#8f5632', wood3: '#c07f4b', newWood: '#e3a868',
        skin: '#f6c7a1', blue: '#3d86d8', navy: '#2d4f8f', orange: '#ff8c33', hair: '#6b3f22', shoe: '#7a4526',
        apron: '#8a5634', shirt: '#7fb36a', pants: '#6c6a80', hat: '#ffc928', white: '#fbf7ef', pink: '#ff9aa0', black: '#1d1716'
      };
      var world = new THREE.Group(); scene.add(world);
      // margens (camada de grama sobre terra)
      [-1, 1].forEach(function (sd) {
        mesh(world, rbox(9, 1.6, 30, 0.55, 0.04, 8), clay(C.dirt), sd * 5.75, -0.95, 2, null, null, null, { boil: false });
        mesh(world, rbox(9.2, 0.5, 30.2, 0.24, 0.06, 8), clay(C.grass, { bump: 0.09 }), sd * 5.72, -0.12, 2, null, null, null, { boil: false });
      });
      // leito e água
      mesh(world, rbox(4, 0.6, 30, 0.2, 0.02, 4), clay('#3d7fa6'), 0, -1.35, 2, null, null, null, { boil: false });
      var waterMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.water).convertSRGBToLinear(), roughness: 0.42, metalness: 0, bumpMap: waterTex, bumpScale: 0.03, map: mottleTex });
      track(waterMat);
      var water = mesh(world, track(new THREE.PlaneGeometry(2.9, 30, 1, 1)), waterMat, 0, -0.42, 2, null, null, null, { rx: -Math.PI / 2, boil: false, cast: false });
      // colinas ao fundo
      var hillCols = ['#8cc96b', '#6fb35a', '#a3d47a', '#7fbf65'];
      [[-7, -15, 6.5, 3.2], [1, -17, 7.5, 3.8], [8, -14, 6, 2.6], [-1.5, -12.5, 4.5, 1.7], [5, -11.5, 4, 1.5], [-6.5, -11, 4, 1.4]].forEach(function (h, i) {
        mesh(world, blob(1, 0.06, 28, 18), clay(hillCols[i % 4], { bump: 0.05 }), h[0], -0.2, h[1], h[2], h[3], h[2] * 0.55, { boil: false, cast: false });
      });
      // castelinho no morro
      (function () {
        var g = new THREE.Group(); g.position.set(3.4, 2.9, -17); world.add(g);
        var st = clay('#d9d2e6'), roof = clay('#e2715d'), dark = clay('#6a5a7a');
        mesh(g, rbox(2.2, 1.2, 1, 0.14, 0.05), st, 0, 0.6, 0);
        for (var i = 0; i < 5; i++) mesh(g, rbox(0.3, 0.3, 0.3, 0.08), st, -0.9 + i * 0.45, 1.3, 0.3);
        [[-1.15, 1.9], [1.15, 1.6], [0.1, 2.6]].forEach(function (tw) {
          mesh(g, cyl(0.38, 0.42, tw[1], 14), st, tw[0], tw[1] / 2, 0.1);
          mesh(g, cyl(0.02, 0.55, 0.9, 14), roof, tw[0], tw[1] + 0.42, 0.1);
          mesh(g, blob(0.1, 0.05, 10, 8), dark, tw[0], tw[1] * 0.6, 0.52, 1, 1.5, 0.5);
        });
        mesh(g, rbox(0.5, 0.6, 0.2, 0.22, 0.03), dark, 0, 0.3, 0.5);
        mesh(g, cyl(0.03, 0.03, 0.6, 6), dark, 0.1, 3.35, 0.1);
        mesh(g, rbox(0.4, 0.24, 0.06, 0.05, 0.05), clay('#ffcf3f'), 0.32, 3.55, 0.1);
      })();
      // nuvens e sol de massinha
      [[-3.2, 9.6, -20, 1.2], [3.6, 11.2, -22, 1.0], [5.6, 7.6, -19, 0.75], [-6.2, 7.2, -21, 0.8]].forEach(function (cl) {
        var g = new THREE.Group(); g.position.set(cl[0], cl[1], cl[2]); g.scale.setScalar(cl[3]); world.add(g);
        var wm = clay('#ffffff', { rough: 0.8 });
        mesh(g, blob(1, 0.05), wm, 0, 0, 0, 1.3, 0.8, 0.7, { cast: false });
        mesh(g, blob(1, 0.05), wm, -1.2, -0.25, 0, 0.9, 0.6, 0.6, { cast: false });
        mesh(g, blob(1, 0.05), wm, 1.25, -0.2, 0.1, 1, 0.65, 0.6, { cast: false });
        mesh(g, blob(1, 0.05), wm, 0.4, 0.55, -0.1, 0.8, 0.6, 0.6, { cast: false });
      });
      mesh(world, blob(1.3, 0.04, 24, 16), clay('#ffd54a', { emissive: '#ffb627', ei: 0.55 }), -5.4, 12.5, -24, 1, 1, 0.4, { cast: false });

      // casinha
      (function () {
        var g = new THREE.Group(); g.position.set(-4.6, 0, -3.4); g.rotation.y = 0.32; world.add(g);
        mesh(g, rbox(2.6, 1.8, 2, 0.22, 0.04), clay('#fff1d6'), 0, 0.95, 0);
        var roofM = clay('#e8603f', { bump: 0.04 });
        mesh(g, rbox(3.1, 0.3, 1.45, 0.14, 0.05), roofM, 0, 2.3, 0.5, null, null, null, { rx: 0.72 });
        mesh(g, rbox(3.1, 0.3, 1.45, 0.14, 0.05), roofM, 0, 2.3, -0.5, null, null, null, { rx: -0.72 });
        mesh(g, rbox(0.42, 0.9, 0.42, 0.1, 0.05), clay('#b5644a'), 0.8, 2.75, -0.35);
        mesh(g, rbox(0.62, 1.05, 0.2, 0.28, 0.04), clay('#4f9aa0'), 0.35, 0.55, 1.0);
        mesh(g, blob(0.06, 0.05, 8, 6), clay('#ffcf3f', { rough: 0.35 }), 0.55, 0.55, 1.12);
        mesh(g, rbox(0.62, 0.55, 0.16, 0.12, 0.04), clay('#ffdc6b', { emissive: '#ffb84a', ei: 0.35 }), -0.75, 1.15, 1.0);
        mesh(g, rbox(0.75, 0.12, 0.24, 0.05, 0.04), clay('#a8693d'), -0.75, 0.83, 1.06);
        for (var i = 0; i < 4; i++) mesh(g, blob(0.08, 0.06, 8, 6), clay(['#ff6f7d', '#ffd23f', '#ff9ccf', '#ffffff'][i]), -1.0 + i * 0.17, 0.95, 1.12);
      })();
      // árvores fofas
      function tree(x, z, s, col) {
        var g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
        mesh(g, rbox(0.38, 1.6, 0.38, 0.17, 0.08), clay('#8a5732'), 0, 0.8, 0);
        mesh(g, blob(1, 0.07), clay(col), 0, 2.1, 0, 1.05, 0.95, 1.0);
        mesh(g, blob(0.75, 0.07), clay(col), -0.6, 1.75, 0.25);
        mesh(g, blob(0.7, 0.07), clay(col), 0.62, 1.8, 0.15);
        mesh(g, blob(0.6, 0.07), clay(shadeHex(col, 0.12)), 0.05, 2.75, 0.1);
        for (var i = 0; i < 3; i++) mesh(g, blob(0.11, 0.05, 10, 8), clay('#ff6b5c', { rough: 0.45 }), [-0.5, 0.45, 0.1][i], [2.0, 2.25, 1.6][i], [0.75, 0.7, 0.95][i]);
        return g;
      }
      function shadeHex(h, f) { var c = new THREE.Color(h); c.lerp(new THREE.Color('#ffffff'), f); return '#' + c.getHexString(); }
      tree(4.4, -2.6, 1.15, '#5fae4c');
      tree(-6.6, 0.8, 1.0, '#6fbf55');
      tree(7.2, -6.5, 1.2, '#55a347');
      tree(-2.6, -7.5, 0.85, '#79c45c');
      // arbustos, pedras, flores
      [[2.3, -1.3, 0.45], [4.4, 2.0, 0.5], [-2.3, -2.0, 0.42], [-3.3, 3.6, 0.55], [2.6, 4.4, 0.5], [-2.4, 7.5, 0.6], [2.5, 8.5, 0.62]].forEach(function (b) { mesh(world, blob(b[2], 0.08), clay('#5aa845'), b[0], b[2] * 0.4, b[1], 1.2, 0.8, 1); });
      [[-1.45, 2.6, 0.32], [1.5, 1.9, 0.28], [-1.2, 6.5, 0.4], [1.3, 7.8, 0.36], [-0.5, 5.6, 0.3], [0.35, 7.0, 0.3], [-0.2, 8.4, 0.3], [-0.6, 10.5, 0.4]].forEach(function (s) { mesh(world, blob(s[2], 0.12, 14, 10), clay('#a9a6a0'), s[0], -0.38, s[1], 1.2, 0.6, 1); });
      (function () {
        var R = rng(5), cols = ['#ff6b7d', '#ffd23f', '#ffffff', '#c38bff', '#ff9a3c'];
        for (var i = 0; i < 40; i++) {
          var sd = R() < 0.5 ? -1 : 1, x = sd * (1.75 + R() * 2.4), z = 2.4 + R() * 9;
          if (sd < 0 && x > -4.3 && z < 1.6) continue;
          var col = cols[(R() * cols.length) | 0];
          mesh(world, cyl(0.02, 0.02, 0.3, 5), clay('#3f8a3a'), x, 0.25, z, null, null, null, { cast: false });
          var head = new THREE.Group(); head.position.set(x, 0.42, z); world.add(head);
          for (var p = 0; p < 5; p++) mesh(head, blob(0.07, 0.05, 8, 6), clay(col), Math.cos(p / 5 * TAU) * 0.08, 0, Math.sin(p / 5 * TAU) * 0.08, 1, 0.55, 1, { cast: false });
          mesh(head, blob(0.05, 0.05, 8, 6), clay('#ffb020'), 0, 0.03, 0, 1, 0.8, 1, { cast: false });
        }
        // juncos
        for (i = 0; i < 16; i++) {
          sd = i % 2 ? 1 : -1; x = sd * (1.3 + R() * 0.3); z = 3 + R() * 7;
          mesh(world, rbox(0.07, 0.9 + R() * 0.5, 0.07, 0.035, 0.05, 3), clay('#4f9a3e'), x, 0.2, z, null, null, null, { rz: sd * -0.15 * R(), cast: false });
        }
        // vitórias-régias
        for (i = 0; i < 5; i++) mesh(world, cyl(0.28, 0.28, 0.05, 12), clay('#5cb85a'), (R() - 0.5) * 1.8, -0.39, 3 + i * 1.6, null, null, null, { cast: false });
        mesh(world, blob(0.09, 0.05, 8, 6), clay('#ff9ccf'), 0.4, -0.3, 4.1);
      })();
      // patinho no riacho
      var duck = new THREE.Group(); duck.position.set(0.55, -0.38, 3.4); duck.rotation.y = -0.6; world.add(duck);
      mesh(duck, blob(0.3, 0.05), clay('#ffd93b'), 0, 0.15, 0, 1.25, 0.8, 1);
      mesh(duck, blob(0.2, 0.05), clay('#ffd93b'), 0, 0.45, 0.24);
      mesh(duck, blob(0.09, 0.05, 10, 8), clay('#ff8a2a'), 0, 0.42, 0.45, 1.2, 0.5, 1);
      mesh(duck, blob(0.035, 0, 8, 6), clay(C.black, { rough: 0.2, noMap: true, noBump: true }), 0.09, 0.52, 0.4);
      mesh(duck, blob(0.035, 0, 8, 6), clay(C.black, { rough: 0.2, noMap: true, noBump: true }), -0.09, 0.52, 0.4);

      /* ----- ponte ----- */
      var bridge = new THREE.Group(); world.add(bridge);
      function deckY(x) { return 0.5 + 0.14 * Math.cos(clamp(x / 2.2, -1, 1) * Math.PI / 2); }
      var woods = [clay(C.wood), clay(C.wood2), clay(C.wood3)];
      for (var px = -2.0, pi = 0; px <= 2.01; px += 0.4, pi++) {
        if (Math.abs(px) < 0.3) continue;
        mesh(bridge, rbox(0.36, 0.16, 1.3, 0.06, 0.08, 3), woods[pi % 3], px, deckY(px), 0, null, null, null, { rz: -px * 0.05 });
      }
      [-1, 1].forEach(function (sd) {
        // vigas laterais (quebradas no meio)
        [[-1.25, -2.05, -0.45], [1.25, 0.45, 2.05]].forEach(function (s) {
          var len = s[2] - s[1];
          mesh(bridge, rbox(len, 0.16, 0.16, 0.07, 0.05, 4), clay(C.wood2), s[0], deckY(s[0]) - 0.15, sd * 0.56, null, null, null, { rz: -s[0] * 0.07 });
        });
        // postes e corrimão
        [-1.95, -1.0, 1.0, 1.95].forEach(function (x) { mesh(bridge, rbox(0.16, 0.8, 0.16, 0.07, 0.05, 3), clay(C.wood), x, deckY(x) + 0.38, sd * 0.68); });
        mesh(bridge, rbox(4.1, 0.12, 0.13, 0.06, 0.05, 4), clay(C.wood3), 0, deckY(0) + 0.66, sd * 0.68, null, null, null, { boil: 0.4 });
      });
      // a peça que falta
      var pieceG = new THREE.Group(); world.add(pieceG);
      var piece = mesh(pieceG, rbox(1.0, 0.2, 1.22, 0.07, 0.05, 4), clay(C.newWood), 0, 0, 0);
      mesh(pieceG, rbox(0.04, 0.03, 1.1, 0.015, 0, 2), clay('#c78a52'), 0, 0.1, 0, null, null, null, { boil: false });
      var PIECE_Y = deckY(0) - 0.01;

      // estrelinhas e poeira
      var starShape = new THREE.Shape();
      for (var si = 0; si < 10; si++) { var sa = si / 10 * TAU + Math.PI / 2, srr = si % 2 ? 0.08 : 0.19; if (si) starShape.lineTo(Math.cos(sa) * srr, Math.sin(sa) * srr); else starShape.moveTo(Math.cos(sa) * srr, Math.sin(sa) * srr); }
      var starGeo = track(new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 3 }));
      starGeo.center();
      var stars = [], SR = rng(17);
      for (si = 0; si < 9; si++) {
        var sm = new THREE.Mesh(starGeo, clay(si % 3 ? '#ffd23f' : '#fff3b0', { emissive: '#ffb020', ei: 0.35, rough: 0.5 }));
        sm.visible = false; world.add(sm);
        stars.push({ m: sm, a: (si / 9) * TAU + SR() * 0.4, d: 0.9 + SR() * 0.8, sp: SR() });
      }
      var dusts = [];
      for (si = 0; si < 6; si++) {
        var dm = new THREE.Mesh(blob(0.16, 0.12, 10, 8), clay('#e8d2b0', { transparent: true, opacity: 0.9 }));
        dm.visible = false; world.add(dm); dusts.push({ m: dm, x: (si - 2.5) * 0.28, z: (si % 2 ? 0.55 : -0.2) });
      }
      // mesmo material para todas as poeiras: uma única opacidade
      var dustMat = dusts[0].m.material;

      /* ----- personagens ----- */
      function eyes(parent, x, y, z, r) {
        var em = clay('#211a18', { rough: 0.18, noMap: true, bump: 0.004 }), hm = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        [-1, 1].forEach(function (sd) {
          var e = mesh(parent, blob(r, 0, 14, 10), em, sd * x, y, z, 1, 1, 0.5, { boil: 0.5 });
          var h = new THREE.Mesh(blob(r * 0.28, 0, 8, 6), hm); h.position.set(sd * x + r * 0.35, y + r * 0.35, z + r * 0.45); parent.add(h);
          // aro de botão
          mesh(parent, track(new THREE.TorusGeometry(r * 0.95, r * 0.18, 6, 16)), em, sd * x, y, z + r * 0.1, null, null, null, { boil: false, cast: false });
        });
      }
      function smile(parent, x, y, z, r, tube) {
        var m = mesh(parent, track(new THREE.TorusGeometry(r, tube, 8, 14, Math.PI)), clay('#8a3b2e', { rough: 0.5 }), x, y, z, null, null, null, { rz: Math.PI, cast: false });
        return m;
      }

      // herói
      var hero = new THREE.Group(); world.add(hero);
      var H = {};
      (function () {
        var body = new THREE.Group(); hero.add(body); H.body = body;
        H.legL = pivot(hero, -0.15, 0.55, 0); H.legR = pivot(hero, 0.15, 0.55, 0);
        [H.legL, H.legR].forEach(function (lg) {
          mesh(lg, rbox(0.24, 0.5, 0.26, 0.11, 0.05), clay(C.skin), 0, -0.22, 0);
          mesh(lg, rbox(0.28, 0.2, 0.3, 0.1, 0.05), clay(C.navy), 0, -0.05, 0);
          mesh(lg, blob(0.17, 0.06), clay(C.shoe), 0, -0.47, 0.06, 1, 0.65, 1.35);
        });
        mesh(body, blob(0.44, 0.04), clay(C.blue), 0, 0.98, 0, 1, 1.08, 0.88);
        mesh(body, rbox(0.66, 0.24, 0.58, 0.12, 0.04), clay(C.navy), 0, 0.64, 0);
        mesh(body, track(new THREE.TorusGeometry(0.4, 0.04, 6, 20)), clay('#ffcf3f'), 0, 0.76, 0, 1, 1, 0.9, { rx: Math.PI / 2, boil: 0.5 });
        mesh(body, blob(0.07, 0.05, 8, 6), clay('#ffffff'), 0.0, 1.12, 0.38, 1, 1, 0.5);
        // mochila
        mesh(body, rbox(0.62, 0.66, 0.34, 0.15, 0.05), clay(C.orange), 0, 1.0, -0.42);
        mesh(body, rbox(0.64, 0.24, 0.38, 0.11, 0.05), clay('#e8702a'), 0, 1.27, -0.43);
        mesh(body, rbox(0.38, 0.24, 0.12, 0.08, 0.05), clay('#ffb066'), 0, 0.86, -0.6);
        [-1, 1].forEach(function (sd) { mesh(body, track(new THREE.TorusGeometry(0.3, 0.045, 6, 12, Math.PI)), clay('#e8702a'), sd * 0.25, 1.05, -0.05, null, null, null, { ry: Math.PI / 2, rz: Math.PI / 2 }); });
        // braços
        H.armL = pivot(body, -0.43, 1.25, 0); H.armR = pivot(body, 0.43, 1.25, 0);
        [H.armL, H.armR].forEach(function (am, i) {
          mesh(am, rbox(0.2, 0.46, 0.2, 0.1, 0.05), clay(C.blue), 0, -0.2, 0);
          mesh(am, blob(0.11, 0.05, 12, 10), clay(C.skin), 0, -0.46, 0);
        });
        // cabeça
        var head = new THREE.Group(); head.position.set(0, 1.86, 0); body.add(head); H.head = head;
        mesh(head, blob(0.5, 0.03), clay(C.skin), 0, 0, 0, 1.02, 0.96, 1);
        mesh(head, blob(0.53, 0.05), clay(C.hair, { bump: 0.04 }), 0, 0.16, -0.08, 1.02, 0.78, 1.0);
        mesh(head, blob(0.16, 0.08, 10, 8), clay(C.hair), -0.16, 0.36, 0.36, 1.3, 0.7, 0.8);
        mesh(head, blob(0.15, 0.08, 10, 8), clay(C.hair), 0.14, 0.4, 0.34, 1.2, 0.7, 0.8);
        mesh(head, blob(0.12, 0.08, 10, 8), clay(C.hair), 0.0, 0.55, 0.12, 1, 1.3, 1, { rz: 0.4 });
        mesh(head, blob(0.11, 0.05, 10, 8), clay(C.skin), -0.5, -0.02, 0, 0.6, 1, 1);
        mesh(head, blob(0.11, 0.05, 10, 8), clay(C.skin), 0.5, -0.02, 0, 0.6, 1, 1);
        eyes(head, 0.17, 0.02, 0.45, 0.075);
        mesh(head, blob(0.07, 0.05, 10, 8), clay(C.pink, { rough: 0.6 }), -0.29, -0.12, 0.4, 1, 0.7, 0.4);
        mesh(head, blob(0.07, 0.05, 10, 8), clay(C.pink, { rough: 0.6 }), 0.29, -0.12, 0.4, 1, 0.7, 0.4);
        mesh(head, blob(0.07, 0.05, 10, 8), clay('#f2b48c'), 0, -0.07, 0.5);
        smile(head, 0, -0.2, 0.45, 0.1, 0.025);
      })();
      hero.rotation.y = 0.75;

      // Mestre Tomé
      var mentor = new THREE.Group(); world.add(mentor);
      var Mt = {};
      (function () {
        var body = new THREE.Group(); mentor.add(body); Mt.body = body;
        [-1, 1].forEach(function (sd) {
          mesh(mentor, rbox(0.3, 0.62, 0.32, 0.13, 0.05), clay(C.pants), sd * 0.2, 0.36, 0);
          mesh(mentor, blob(0.2, 0.06), clay('#5c3820'), sd * 0.2, 0.08, 0.08, 1.05, 0.7, 1.35);
        });
        mesh(body, blob(0.64, 0.04), clay(C.shirt), 0, 1.15, 0, 1, 1.02, 0.9);
        var apG = track(new THREE.SphereGeometry(0.68, 20, 14, Math.PI / 2 - 0.85, 1.7, 0.75, 1.75));
        mesh(body, apG, clay(C.apron), 0, 1.13, 0.02, 1, 1.02, 0.92, { boil: 0.5 }).material.side = THREE.DoubleSide;
        mesh(body, rbox(0.4, 0.26, 0.1, 0.06, 0.05), clay('#6f4126'), 0.02, 0.92, 0.6, null, null, null, { rx: 0.25 });
        mesh(body, cyl(0.04, 0.04, 0.42, 8), clay('#e0a05e'), 0.12, 1.1, 0.6, null, null, null, { rz: 0.15, rx: 0.25 });
        mesh(body, rbox(0.28, 0.1, 0.1, 0.03, 0.03), clay('#9aa6b5', { rough: 0.45 }), 0.15, 1.31, 0.56);
        [-1, 1].forEach(function (sd) { mesh(body, rbox(0.1, 0.5, 0.08, 0.04, 0.05), clay(C.apron), sd * 0.26, 1.66, 0.42, null, null, null, { rx: -0.5 }); });
        Mt.armL = pivot(body, -0.62, 1.5, 0); Mt.armR = pivot(body, 0.62, 1.5, 0);
        [Mt.armL, Mt.armR].forEach(function (am) {
          mesh(am, rbox(0.24, 0.55, 0.24, 0.12, 0.05), clay(C.shirt), 0, -0.24, 0);
          mesh(am, blob(0.14, 0.05, 12, 10), clay(C.skin), 0, -0.55, 0);
        });
        var head = new THREE.Group(); head.position.set(0, 2.12, 0); body.add(head); Mt.head = head;
        mesh(head, blob(0.5, 0.03), clay(C.skin), 0, 0, 0);
        mesh(head, blob(0.5, 0.07), clay(C.white, { bump: 0.05 }), 0, -0.3, 0.14, 1.05, 0.85, 0.78);
        mesh(head, blob(0.2, 0.08, 12, 10), clay(C.white), -0.14, -0.1, 0.45, 1.1, 0.55, 0.6, { rz: 0.25 });
        mesh(head, blob(0.2, 0.08, 12, 10), clay(C.white), 0.14, -0.1, 0.45, 1.1, 0.55, 0.6, { rz: -0.25 });
        mesh(head, blob(0.13, 0.05, 12, 10), clay('#f39a86'), 0, 0.0, 0.53);
        eyes(head, 0.18, 0.15, 0.43, 0.07);
        mesh(head, rbox(0.2, 0.07, 0.08, 0.035, 0.08, 3), clay(C.white), -0.18, 0.29, 0.43, null, null, null, { rz: 0.15 });
        mesh(head, rbox(0.2, 0.07, 0.08, 0.035, 0.08, 3), clay(C.white), 0.18, 0.29, 0.43, null, null, null, { rz: -0.15 });
        mesh(head, blob(0.06, 0.05, 8, 6), clay(C.pink), -0.33, 0.02, 0.36, 1, 0.7, 0.4);
        mesh(head, blob(0.06, 0.05, 8, 6), clay(C.pink), 0.33, 0.02, 0.36, 1, 0.7, 0.4);
        // capacete
        var hatGeo = track(new THREE.SphereGeometry(0.54, 22, 12, 0, TAU, 0, Math.PI / 2));
        mesh(head, hatGeo, clay(C.hat, { rough: 0.55 }), 0, 0.18, 0);
        mesh(head, cyl(0.68, 0.68, 0.07, 22), clay(C.hat, { rough: 0.55 }), 0, 0.2, 0.08);
        mesh(head, rbox(0.12, 0.2, 0.9, 0.05, 0.04, 3), clay('#ffd95c', { rough: 0.55 }), 0, 0.62, 0, null, null, null, { rx: 0 });
      })();
      mentor.rotation.y = -0.8; mentor.scale.setScalar(1.1);

      /* ----- HUD ----- */
      var paperURL = '';
      try { paperURL = TX.mottle.toDataURL('image/png'); } catch (e) {}
      var P = '.massinha-';
      var css = document.createElement('style');
      css.textContent = [
        P + 'hud{position:absolute;inset:0;pointer-events:none;font-family:"Baloo 2","Fredoka",system-ui,sans-serif;color:#5a3520;--u:1px;font-weight:700;}',
        P + 'clay{background-image:url(' + paperURL + ');background-size:calc(var(--u)*120);background-blend-mode:multiply;border-radius:calc(var(--u)*24) calc(var(--u)*20) calc(var(--u)*26) calc(var(--u)*18)/calc(var(--u)*20) calc(var(--u)*26) calc(var(--u)*18) calc(var(--u)*24);box-shadow:inset 0 calc(var(--u)*-5) calc(var(--u)*2) rgba(90,40,10,.18),inset 0 calc(var(--u)*4) calc(var(--u)*5) rgba(255,255,255,.75),inset calc(var(--u)*3) 0 calc(var(--u)*4) rgba(255,255,255,.25),0 calc(var(--u)*6) calc(var(--u)*10) rgba(70,35,10,.28),0 calc(var(--u)*2) 0 rgba(70,35,10,.12);}',
        P + 'top{position:absolute;left:calc(var(--u)*12);right:calc(var(--u)*12);top:calc(env(safe-area-inset-top,0px) + 36px);display:flex;gap:calc(var(--u)*10);align-items:center;}',
        P + 'ava{flex:none;width:calc(var(--u)*66);height:calc(var(--u)*66);border-radius:50%;background-color:#ffc928;padding:calc(var(--u)*5);box-sizing:border-box;}',
        P + 'ava canvas{width:100%;height:100%;border-radius:50%;display:block;box-shadow:inset 0 0 0 calc(var(--u)*2) rgba(150,90,10,.25);}',
        P + 'lvl{flex:1;min-width:0;background-color:#fff6ea;padding:calc(var(--u)*7) calc(var(--u)*14) calc(var(--u)*10);}',
        P + 'lvl .t{font-size:calc(var(--u)*19);font-weight:800;line-height:1.05;white-space:nowrap;display:flex;justify-content:space-between;align-items:baseline;gap:calc(var(--u)*6);}',
        P + 'lvl .t small{font-size:calc(var(--u)*14);color:#9a6a45;font-weight:700;}',
        P + 'bar{margin-top:calc(var(--u)*5);height:calc(var(--u)*16);border-radius:999px;background:#ead6bd;box-shadow:inset 0 calc(var(--u)*3) calc(var(--u)*3) rgba(110,60,20,.28),inset 0 calc(var(--u)*-1) 0 rgba(255,255,255,.6);position:relative;overflow:hidden;}',
        P + 'bar i{position:absolute;left:calc(var(--u)*2);top:calc(var(--u)*2);bottom:calc(var(--u)*2);border-radius:999px;background:linear-gradient(180deg,#a8e27a,#62b84a);box-shadow:inset 0 calc(var(--u)*-3) calc(var(--u)*2) rgba(30,90,20,.35),0 calc(var(--u)*1) calc(var(--u)*2) rgba(30,60,10,.3);}',
        P + 'bar i:after{content:"";position:absolute;left:calc(var(--u)*6);right:calc(var(--u)*6);top:calc(var(--u)*2);height:calc(var(--u)*3.5);border-radius:99px;background:rgba(255,255,255,.6);}',
        P + 'mis{position:absolute;left:calc(var(--u)*16);top:calc(env(safe-area-inset-top,0px) + 36px + var(--u)*76);display:flex;align-items:center;gap:calc(var(--u)*8);padding:calc(var(--u)*6) calc(var(--u)*16) calc(var(--u)*6) calc(var(--u)*8);background-color:#ffe1a3;font-size:calc(var(--u)*16);line-height:1.1;transform:rotate(-1.5deg);max-width:calc(100% - var(--u)*36);}',
        P + 'mis .ic{flex:none;width:calc(var(--u)*32);height:calc(var(--u)*32);border-radius:50%;background:#ff8c33;display:grid;place-items:center;box-shadow:inset 0 calc(var(--u)*-3) calc(var(--u)*2) rgba(120,40,0,.3),inset 0 calc(var(--u)*2) calc(var(--u)*2) rgba(255,255,255,.5);}',
        P + 'mis svg{width:72%;height:72%;}',
        P + 'mis b{color:#d65a14;font-weight:800;}',
        P + 'bub{position:absolute;width:calc(var(--u)*218);background-color:#ffffff;padding:calc(var(--u)*16) calc(var(--u)*16) calc(var(--u)*12);font-size:calc(var(--u)*18);line-height:1.15;font-weight:700;color:#4a2c18;opacity:0;transform-origin:80% 110%;}',
        P + 'bub .nm{position:absolute;top:calc(var(--u)*-15);left:calc(var(--u)*12);font-size:calc(var(--u)*15);font-weight:800;padding:calc(var(--u)*2) calc(var(--u)*12) 0;background:#ff8c33;color:#fff;border-radius:999px;box-shadow:inset 0 calc(var(--u)*-3) calc(var(--u)*2) rgba(120,40,0,.3),inset 0 calc(var(--u)*2) calc(var(--u)*2) rgba(255,255,255,.45),0 calc(var(--u)*3) calc(var(--u)*5) rgba(80,30,0,.25);transform:rotate(-3deg);}',
        P + 'bub .tail{position:absolute;bottom:calc(var(--u)*-21);right:calc(var(--u)*44);width:calc(var(--u)*26);height:calc(var(--u)*24);filter:drop-shadow(0 calc(var(--u)*4) calc(var(--u)*3) rgba(70,35,10,.22));}',
        P + 'xp{position:absolute;font-size:calc(var(--u)*36);font-weight:800;color:#ffd23f;opacity:0;white-space:nowrap;-webkit-text-stroke:calc(var(--u)*1.6) #c8621c;paint-order:stroke fill;text-shadow:0 calc(var(--u)*3) 0 #b4521a,0 calc(var(--u)*7) calc(var(--u)*8) rgba(60,25,0,.3);}',
        P + 'btns{position:absolute;left:calc(var(--u)*12);right:calc(var(--u)*12);bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(var(--u)*10);}',
        P + 'btn{flex:1;height:calc(var(--u)*84);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;font-size:calc(var(--u)*19);font-weight:800;line-height:1;color:#fff;text-shadow:0 calc(var(--u)*2) 0 rgba(80,30,0,.35);}',
        P + 'btn svg{width:calc(var(--u)*38);height:calc(var(--u)*38);margin-bottom:calc(var(--u)*2);filter:drop-shadow(0 calc(var(--u)*2) 0 rgba(80,30,0,.3));}',
        P + 'fade{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,#fff3df,#ffd9b0);opacity:0;pointer-events:none;}'
      ].join('\n');
      host.appendChild(css);
      var SV = 'fill="#fff" stroke="#6a3410" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
      var hud = document.createElement('div'); hud.className = 'massinha-hud';
      hud.innerHTML =
        '<div class="massinha-top"><div class="massinha-ava massinha-clay"><canvas width="128" height="128"></canvas></div>' +
        '<div class="massinha-lvl massinha-clay"><div class="t"><span>Nível 4 · Explorador</span><small class="massinha-xpt">620/1000</small></div><div class="massinha-bar"><i style="width:62%"></i></div></div></div>' +
        '<div class="massinha-mis massinha-clay"><span class="ic"><svg viewBox="0 0 32 32"><path d="M9 28V5" ' + SV + ' fill="none"/><path d="M10 6 Q16 3 20 6 T28 7 L27 17 Q22 19 18 16 T10 16Z" ' + SV + '/><circle cx="9" cy="28" r="2.5" ' + SV + '/></svg></span><span><b>Missão:</b> consertar a ponte da vila</span></div>' +
        '<div class="massinha-bub massinha-clay"><span class="nm">Mestre Tomé</span><svg class="tail" viewBox="0 0 26 24"><path d="M2 0 Q12 8 20 23 Q19 10 25 0Z" fill="#fff"/></svg>A viga precisa se apoiar dos dois lados!</div>' +
        '<div class="massinha-xp">+50 XP</div>' +
        '<div class="massinha-btns">' +
          '<div class="massinha-btn massinha-clay" style="background-color:#ffb428;transform:rotate(-1.5deg)"><svg viewBox="0 0 40 40"><rect x="17" y="13" width="7" height="23" rx="3.5" transform="rotate(-35 20 24)" ' + SV + '/><path d="M6 12 Q6 7 12 6 L23 4 Q28 5 28 10 L26 15 Q22 13 17 15 L11 17 Q6 17 6 12Z" ' + SV + '/></svg>Construir</div>' +
          '<div class="massinha-btn massinha-clay" style="background-color:#ff7a45;transform:rotate(1deg)"><svg viewBox="0 0 40 40"><path d="M14 10 Q20 2 26 10" ' + SV + ' fill="none"/><rect x="7" y="10" width="26" height="26" rx="10" ' + SV + '/><path d="M8 19 Q20 25 32 19" ' + SV + ' fill="none"/><rect x="14" y="25" width="12" height="7" rx="3.5" ' + SV + '/></svg>Mochila</div>' +
          '<div class="massinha-btn massinha-clay" style="background-color:#4fbf8a;transform:rotate(-.6deg)"><svg viewBox="0 0 40 40"><path d="M4 10 Q4 8 6 7 L14 4 L26 8 L34 5 Q36 5 36 7 L36 30 Q36 32 34 33 L26 36 L14 32 L6 35 Q4 35 4 33Z" ' + SV + '/><path d="M10 26 Q15 17 20 22 T30 14" fill="none" stroke="#ff7a45" stroke-width="2.6" stroke-dasharray="3 3" stroke-linecap="round"/></svg>Mapa</div>' +
        '</div>';
      host.appendChild(hud);
      var fade = document.createElement('div'); fade.className = 'massinha-fade'; host.insertBefore(fade, hud);
      var q = function (s) { return hud.querySelector(s); };
      var elBar = q('.massinha-bar i'), elXpt = q('.massinha-xpt'), elBub = q('.massinha-bub'), elXp = q('.massinha-xp');

      /* ----- tamanho / câmera ----- */
      var W = 1, Hh = 1, u = 1;
      var target = new THREE.Vector3(0, 1.15, 0.3), camDir = new THREE.Vector3(0, 4.6, 22).normalize(), camDist = 23;
      function layout() {
        var r = host.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
        renderer.setSize(W, Hh, false);
        camera.aspect = W / Hh;
        var vf = 42; camera.fov = vf;
        var halfT = Math.tan(vf * Math.PI / 360) * camera.aspect;
        camDist = clamp(4.5 / halfT, 12, 34);
        camera.updateProjectionMatrix();
        u = W / 390; hud.style.setProperty('--u', u + 'px');
      }

      /* ----- avatar renderizado ----- */
      function makeAvatar() {
        try {
          var rt = new THREE.WebGLRenderTarget(128, 128);
          var cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
          hero.updateMatrixWorld(true);
          var hp = new THREE.Vector3(); H.head.getWorldPosition(hp);
          var dir = new THREE.Vector3(Math.sin(0.75), 0.15, Math.cos(0.75)).normalize();
          cam.position.copy(hp).addScaledVector(dir, 2.6); cam.lookAt(hp.x, hp.y - 0.08, hp.z);
          var bg = scene.background; scene.background = new THREE.Color('#bfe6fb');
          var oldRT = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(scene, cam);
          var px = new Uint8Array(128 * 128 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 128, 128, px);
          renderer.setRenderTarget(oldRT); scene.background = bg; rt.dispose();
          var cv = q('.massinha-ava canvas'), c2 = cv.getContext('2d'), id = c2.createImageData(128, 128);
          for (var y = 0; y < 128; y++) for (var x = 0; x < 128 * 4; x++) id.data[y * 512 + x] = px[(127 - y) * 512 + x];
          // render target é linear: aplica sRGB aproximado
          for (var i = 0; i < id.data.length; i += 4) { for (var k = 0; k < 3; k++) id.data[i + k] = Math.round(255 * Math.pow(id.data[i + k] / 255, 1 / 2.2)); id.data[i + 3] = 255; }
          c2.putImageData(id, 0, 0);
        } catch (e) {}
      }

      /* ----- animação (pose em passos de ~12 fps) ----- */
      var v3 = new THREE.Vector3(), lastF = -1, lastXp = -1;
      function pose(t, fi) {
        var reset = t >= 3.33;
        // herói anda até a ponte
        var wk = reset ? 0 : clamp(t / 1.2, 0, 1);
        var hx = lerp(-3.4, -2.5, reset ? 0 : 1 - Math.pow(1 - wk, 1.6));
        var walking = (!reset && t < 1.2) ? 1 : 0;
        var ph = t * TAU * 2.4;
        var hop = reset ? 0 : Math.max(0, Math.sin(clamp((t - 2.4) / 0.42, 0, 1) * Math.PI));
        var crouch = reset ? 0 : Math.max(0, Math.sin(clamp((t - 2.25) / 0.15, 0, 1) * Math.PI)) * (t < 2.4 ? 1 : 0);
        hero.position.set(hx, hop * 0.45 + Math.abs(Math.sin(ph)) * 0.08 * walking, 1.15);
        hero.scale.set(1.14 * (1 + crouch * 0.08 - hop * 0.03), 1.14 * (1 - crouch * 0.12 + hop * 0.06), 1.14 * (1 + crouch * 0.08 - hop * 0.03));
        H.legL.rotation.x = Math.sin(ph) * 0.6 * walking; H.legR.rotation.x = -Math.sin(ph) * 0.6 * walking;
        H.armL.rotation.x = -Math.sin(ph) * 0.7 * walking; H.armR.rotation.x = Math.sin(ph) * 0.7 * walking;
        var cheer = hop;
        H.armL.rotation.z = -0.12 - cheer * 2.2; H.armR.rotation.z = 0.12 + cheer * 2.2;
        H.body.rotation.z = Math.sin(ph) * 0.06 * walking;
        H.head.rotation.x = walking ? 0 : -0.08; H.head.rotation.y = walking ? 0 : 0.25;
        // mentor
        var point = reset ? 0 : ss(0.75, 1.0, t) * (1 - ss(2.2, 2.4, t));
        var wave = reset ? 0 : ss(2.35, 2.5, t) * (1 - ss(3.0, 3.25, t));
        mentor.position.set(2.8, 0, 1.35);
        Mt.body.rotation.z = Math.sin(t * TAU / T * 2) * 0.03;
        Mt.body.position.y = Math.sin(t * TAU / T * 4) * 0.02;
        Mt.armL.rotation.x = 0.1 - 1.5 * point; Mt.armL.rotation.z = -0.22 - 0.75 * point;
        Mt.armR.rotation.x = -0.2 * wave; Mt.armR.rotation.z = 0.2 + wave * (2.3 + Math.sin(t * TAU * 3.2) * 0.35);
        Mt.head.rotation.z = point * 0.08 - wave * 0.08; Mt.head.rotation.y = -point * 0.15;
        // a peça
        var drop = reset ? -1 : (t < 1.6 ? -1 : clamp((t - 1.6) / 0.55, 0, 1));
        pieceG.visible = drop >= 0;
        if (drop >= 0) {
          var e = drop * drop; // cai acelerando
          var land = clamp((t - 2.15) / 0.3, 0, 1);
          var sq = land > 0 ? Math.sin(land * Math.PI) * (1 - land) * 1.6 : 0;
          pieceG.position.set(0, lerp(3.3, PIECE_Y, e) + (land > 0 ? Math.max(0, Math.sin(land * Math.PI * 2)) * 0.06 * (1 - land) : 0), 0);
          pieceG.scale.set(1 + sq * 0.35 - (drop < 1 ? 0.06 : 0), 1 - sq * 0.45 + (drop < 1 ? 0.18 : 0), 1 + sq * 0.2);
          pieceG.rotation.z = drop < 1 ? Math.sin(drop * 7) * 0.12 * (1 - drop) : 0;
          flash.position.set(0, pieceG.position.y + 0.6, 0.8);
        }
        flash.intensity = reset ? 0 : 2.2 * ss(1.6, 1.75, t) * (1 - ss(2.4, 2.9, t));
        // estrelinhas
        var st = clamp((t - 2.15) / 0.8, 0, 1), on = !reset && st > 0 && st < 1;
        stars.forEach(function (s, i) {
          s.m.visible = on;
          if (!on) return;
          var d = s.d * (1 - Math.pow(1 - st, 2.4));
          s.m.position.set(Math.cos(s.a) * d * 1.3, PIECE_Y + 0.35 + Math.sin(s.a) * d * 0.8 + st * 0.6, 0.6 + s.sp * 0.4);
          var sc = Math.sin(Math.min(1, st * 1.4) * Math.PI) * (0.9 + s.sp * 0.5) + 0.001;
          s.m.scale.setScalar(sc * 1.45); s.m.rotation.z = st * 4 + i;
        });
        var dt = clamp((t - 2.15) / 0.6, 0, 1), don = !reset && dt > 0 && dt < 1;
        dustMat.opacity = 0.85 * (1 - dt);
        dusts.forEach(function (d, i) {
          d.m.visible = don; if (!don) return;
          d.m.position.set(d.x * (1 + dt * 2.2), PIECE_Y + 0.05 + dt * 0.25, d.z + 0.1);
          d.m.scale.setScalar(0.6 + dt * 1.4);
        });
        // patinho e água
        duck.position.y = -0.38 + Math.sin(t * TAU / T * 3) * 0.035;
        duck.rotation.z = Math.sin(t * TAU / T * 3 + 1) * 0.08;
        waterTex.offset.set(fi % 2 ? 0.03 : 0, -t / T * 2);
        // boiling: tremor sutil por quadro
        var bo = (fi >> 1) % 3;
        bumpTex.offset.set(bo * 0.37, bo * 0.21); mottleTex.offset.set(bo * 0.13, bo * 0.29);
        for (var i = 0; i < boilers.length; i++) {
          var b = boilers[i], a = b.a, h1 = hash(fi, i), h2 = hash(fi + 101, i), h3 = hash(fi + 211, i);
          var k = 1 + (h1 - 0.5) * 0.028 * a;
          b.m.scale.set(b.s.x * k, b.s.y * (1 + (h2 - 0.5) * 0.028 * a), b.s.z * k);
          b.m.rotation.set(b.r.x + (h3 - 0.5) * 0.02 * a, b.r.y + (h1 - 0.5) * 0.02 * a, b.r.z + (h2 - 0.5) * 0.02 * a);
        }
        // câmera (dolly suave, em passos)
        var A = reduce ? 0 : 1;
        var cw = 0.5 - 0.5 * Math.cos(TAU * t / T);
        camera.position.copy(target).addScaledVector(camDir, camDist * (1 - 0.05 * cw * A));
        camera.position.x += (Math.sin(TAU * t / T) * 0.45 - 0.1) * A;
        camera.lookAt(target.x + cw * 0.25 * A, target.y, target.z);

      }
      function hudUpdate(t) {
        var reset = t >= 3.33;
        var xpv = reset ? 620 : Math.round(lerp(620, 670, ss(2.4, 2.85, t)));
        if (xpv !== lastXp) { lastXp = xpv; elXpt.textContent = xpv + '/1000'; elBar.style.width = 'calc(' + (xpv / 10) + '% - ' + (4 * u).toFixed(1) + 'px)'; }
        var bIn = clamp((t - 0.8) / 0.3, 0, 1), bOut = ss(2.95, 3.2, t);
        var bOp = reset ? 0 : (bIn > 0 ? Math.min(1, bIn * 3) * (1 - bOut) : 0);
        var bSc = reset ? 0.7 : lerp(0.5, 1, easeOutBack(bIn)) * (1 - bOut * 0.15);
        elBub.style.opacity = bOp.toFixed(3);
        Mt.head.getWorldPosition(v3); v3.y += 0.9; v3.project(camera);
        var sx = (v3.x * 0.5 + 0.5) * W, sy = (-v3.y * 0.5 + 0.5) * Hh;
        elBub.style.right = Math.max(10 * u, W - sx - 64 * u) + 'px';
        elBub.style.bottom = (Hh - sy + 14 * u) + 'px';
        elBub.style.transform = 'rotate(1.5deg) scale(' + bSc.toFixed(3) + ')';
        var xt = clamp((t - 2.4) / 0.75, 0, 1);
        elXp.style.opacity = (reset || xt <= 0 ? 0 : Math.min(1, xt * 5) * (1 - ss(0.65, 1, xt))).toFixed(3);
        v3.set(0, PIECE_Y + 1.1, 0).project(camera);
        elXp.style.left = ((v3.x * 0.5 + 0.5) * W - 60 * u) + 'px';
        elXp.style.top = ((-v3.y * 0.5 + 0.5) * Hh - xt * 50 * u - 30 * u) + 'px';
        elXp.style.transform = 'scale(' + (0.6 + 0.4 * easeOutBack(Math.min(1, xt * 3))).toFixed(3) + ') rotate(-5deg)';
        var fd = t < 3.08 ? 0 : (t < 3.33 ? ss(3.08, 3.33, t) : 1 - ss(3.33, 3.6, t));
        fade.style.opacity = (fd * 0.95).toFixed(3);
      }

      var raf = 0, t0 = performance.now(), pending = false, dead = false;
      var ro = new ResizeObserver(function () { pending = true; });
      ro.observe(host);
      function renderAt(t) {
        var fi = Math.floor(t / T * NF) % NF, tq = fi * T / NF;
        if (fi !== lastF || pending) {
          lastF = fi; pose(tq, fi);
          renderer.render(scene, camera);
        }
        hudUpdate(t);
      }
      function loop(now) {
        if (dead) return;
        raf = requestAnimationFrame(loop);
        if (pending) { layout(); }
        var t = ((now - t0) / 1000) % T; if (t < 0) t += T;
        renderAt(t);
        pending = false;
      }
      layout();
      pose(0, 0); hudUpdate(0);
      makeAvatar();
      renderer.render(scene, camera); lastF = 0;
      raf = requestAnimationFrame(loop);

      return {
        destroy: function () {
          dead = true; cancelAnimationFrame(raf); ro.disconnect();
          scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
          disposables.forEach(function (d) { try { d.dispose(); } catch (e) {} });
          renderer.dispose();
          try { renderer.forceContextLoss(); } catch (e) {}
          host.innerHTML = '';
        }
      };
    }
  };
})();
