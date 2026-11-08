/* Estilo LOW POLY — cena "a ponte da vila" (loop de 3,6 s). three.js r128 global. */
(function () {
  window.SCENES = window.SCENES || {};
  var ID = 'lowpoly';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash3(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }

  var CSS = '' +
    '.lowpoly-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,sans-serif;color:#23313f;-webkit-font-smoothing:antialiased}' +
    '.lowpoly-fade{position:absolute;inset:0;background:linear-gradient(180deg,#e9f4fb,#fff4e4);opacity:0}' +
    '.lowpoly-top{position:absolute;left:.9em;right:.9em;top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:.7em;padding:.55em .8em .55em .55em;background:rgba(255,255,255,.86);border-radius:1.1em;box-shadow:0 .5em 1.4em rgba(35,49,63,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '.lowpoly-ava{flex:none;width:3.3em;height:3.3em;clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%);background:linear-gradient(135deg,#ff8a5b,#ffc857);display:grid;place-items:center}' +
    '.lowpoly-ava svg{width:2.95em;height:2.95em;clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}' +
    '.lowpoly-info{flex:1;min-width:0}' +
    '.lowpoly-row{display:flex;justify-content:space-between;align-items:baseline;gap:.5em}' +
    '.lowpoly-lvl{font-family:"Fredoka","Nunito Sans",system-ui,sans-serif;font-weight:600;font-size:1.05em;letter-spacing:.01em;white-space:nowrap}' +
    '.lowpoly-lvl b{display:inline-grid;place-items:center;min-width:1.6em;height:1.6em;margin-right:.35em;color:#fff;background:#1fa39a;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);font-size:.85em}' +
    '.lowpoly-xpt{font-size:.78em;font-weight:800;color:#5d6b78;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.lowpoly-bar{position:relative;margin-top:.45em;height:.75em;background:#e3eaef;clip-path:polygon(.45em 0,100% 0,calc(100% - .45em) 100%,0 100%);overflow:hidden}' +
    '.lowpoly-fill{position:absolute;left:0;top:0;bottom:0;width:62%;background:linear-gradient(90deg,#1fa39a,#5fd0a4);clip-path:polygon(0 0,100% 0,calc(100% - .45em) 100%,0 100%)}' +
    '.lowpoly-fill:after{content:"";position:absolute;left:0;right:0;top:0;height:45%;background:rgba(255,255,255,.35)}' +
    '.lowpoly-quest{position:absolute;left:.9em;top:calc(env(safe-area-inset-top,0px) + 38px + 5.2em);display:flex;align-items:center;gap:.55em;padding:.45em .85em .45em .45em;background:rgba(35,49,63,.78);color:#fff;border-radius:.9em;font-weight:700;font-size:.86em;max-width:78%;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
    '.lowpoly-quest i{flex:none;width:2em;height:2em;display:grid;place-items:center;background:#ffc857;clip-path:polygon(50% 0,100% 28%,100% 72%,50% 100%,0 72%,0 28%)}' +
    '.lowpoly-quest i svg{width:1.2em;height:1.2em}' +
    '.lowpoly-quest span{line-height:1.25}' +
    '.lowpoly-quest small{display:block;font-size:.78em;font-weight:700;color:#ffc857;letter-spacing:.08em;text-transform:uppercase}' +
    '.lowpoly-bub{position:absolute;left:0;top:0;width:13.6em;padding:.7em .9em .8em;background:#fff;border-radius:1em;box-shadow:0 .6em 1.6em rgba(35,49,63,.22);opacity:0;transform-origin:var(--tx,80%) 100%}' +
    '.lowpoly-bub:after{content:"";position:absolute;bottom:-.7em;left:calc(var(--tx,80%) - .7em);width:1.4em;height:.8em;background:#fff;clip-path:polygon(0 0,100% 0,45% 100%)}' +
    '.lowpoly-name{display:inline-block;font-family:"Fredoka",system-ui,sans-serif;font-weight:600;font-size:.82em;color:#fff;background:#ff7a59;padding:.15em .6em;border-radius:.5em;margin-bottom:.3em}' +
    '.lowpoly-say{font-size:1.02em;font-weight:700;line-height:1.3}' +
    '.lowpoly-xp{position:absolute;left:0;top:0;font-family:"Fredoka",system-ui,sans-serif;font-weight:700;font-size:1.7em;color:#fff;opacity:0;white-space:nowrap;text-shadow:0 .08em 0 #1fa39a,0 .2em .5em rgba(35,49,63,.35);transform:translate(-50%,-50%)}' +
    '.lowpoly-btns{position:absolute;left:.9em;right:.9em;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:.6em}' +
    '.lowpoly-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:.3em;padding:.6em .2em .65em;background:rgba(255,255,255,.9);border-radius:1.1em;box-shadow:0 .5em 1.3em rgba(35,49,63,.18);font-family:"Fredoka","Nunito Sans",system-ui,sans-serif;font-weight:600;font-size:1em;color:#23313f;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '.lowpoly-btn i{width:2.7em;height:2.7em;display:grid;place-items:center;clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}' +
    '.lowpoly-btn i svg{width:1.45em;height:1.45em}' +
    '.lowpoly-btn.main{background:#23313f;color:#fff}' +
    '';

  var AVATAR = '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="60" height="60" fill="#8fd3e8"/><polygon points="0,60 0,44 30,38 60,46 60,60" fill="#7cc2dc"/>' +
    '<polygon points="12,60 18,46 42,46 48,60" fill="#2f6fd6"/><polygon points="18,46 30,52 42,46" fill="#4b8bf0"/>' +
    '<polygon points="16,24 22,12 38,12 44,24 42,38 30,45 18,38" fill="#f2c39b"/><polygon points="30,45 42,38 44,24 30,30" fill="#e3ad84"/>' +
    '<polygon points="14,25 18,10 30,6 42,9 46,22 40,18 33,20 24,17 18,22" fill="#6b3f22"/><polygon points="30,6 42,9 46,22 40,18" fill="#55301a"/>' +
    '<circle cx="24" cy="28" r="2.4" fill="#23313f"/><circle cx="36" cy="28" r="2.4" fill="#23313f"/>' +
    '<polygon points="25,36 35,36 30,39.5" fill="#c4553e"/><circle cx="20" cy="33" r="2.2" fill="#f59a86" opacity=".7"/><circle cx="40" cy="33" r="2.2" fill="#f59a86" opacity=".7"/></svg>';
  var IC_QUEST = '<svg viewBox="0 0 24 24"><path d="M2 15h20M4 15v4M20 15v4M7 15v-3M12 15v-3M17 15v-3M3 12h18" stroke="#23313f" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-3 3-6-6z" fill="#fff"/><path d="M12.5 8.5L4 17l3 3 8.5-8.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#fff"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="#fff" stroke-width="2" fill="none"/><rect x="9" y="13" width="6" height="4" rx="1" fill="#ff7a59"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#fff"/><path d="M9 4v14M15 6v14" stroke="#1fa39a" stroke-width="1.6"/><circle cx="17.5" cy="10" r="1.8" fill="#ff7a59"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;

      /* ---------- renderer ---------- */
      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      var cv = renderer.domElement;
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      host.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xd8ecf2, 26, 75);
      var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);

      var mats = {};
      function M(color, o) {
        var key = color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, flatShading: true, roughness: 0.92, metalness: 0 };
        if (o) for (var k in o) p[k] = o[k];
        return (mats[key] = new THREE.MeshStandardMaterial(p));
      }
      function mesh(geo, color, o, noShadow) {
        var m = new THREE.Mesh(geo, M(color, o));
        if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
        return m;
      }
      function jitter(geo, amt, seed) {
        var p = geo.attributes.position;
        for (var i = 0; i < p.count; i++) {
          var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          var kx = Math.round(x * 100) / 100, ky = Math.round(y * 100) / 100, kz = Math.round(z * 100) / 100;
          p.setXYZ(i, x + (hash3(kx, ky, kz + seed) - 0.5) * amt, y + (hash3(ky, kz, kx + seed) - 0.5) * amt, z + (hash3(kz, kx, ky + seed) - 0.5) * amt);
        }
        geo.computeVertexNormals();
        return geo;
      }
      var R = rng(7);

      /* ---------- lights ---------- */
      scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6d8a4a, 0.75));
      var sun = new THREE.DirectionalLight(0xfff1d6, 0.95);
      sun.position.set(-7, 12, 7);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
      sun.shadow.bias = -0.0015;
      scene.add(sun); scene.add(sun.target);

      /* ---------- sky ---------- */
      var skyGeo = new THREE.SphereGeometry(120, 24, 14);
      var sCol = [], sp = skyGeo.attributes.position, cTop = new THREE.Color(0x3f8fd2), cMid = new THREE.Color(0x8fcbea), cHor = new THREE.Color(0xfde6c4), tmp = new THREE.Color();
      for (var i = 0; i < sp.count; i++) {
        var h = sp.getY(i) / 120;
        if (h > 0.18) tmp.copy(cMid).lerp(cTop, smooth(0.18, 0.75, h)); else tmp.copy(cHor).lerp(cMid, smooth(-0.02, 0.18, h));
        sCol.push(tmp.r, tmp.g, tmp.b);
      }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(sCol, 3));
      var sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
      scene.add(sky);
      var sunDisk = new THREE.Mesh(new THREE.CircleGeometry(4.2, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
      sunDisk.position.set(26, 30, -95); sunDisk.lookAt(0, 0, 0); scene.add(sunDisk);
      var sunHalo = new THREE.Mesh(new THREE.CircleGeometry(7.5, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.28, fog: false }));
      sunHalo.position.set(26, 30, -95.5); sunHalo.lookAt(0, 0, 0); scene.add(sunHalo);

      /* ---------- clouds ---------- */
      var clouds = [];
      function cloud(x, y, z, s) {
        var g = new THREE.Group();
        var parts = [[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.3, -0.25, 0, 1.05], [0.5, 0.55, -0.2, 0.95]];
        parts.forEach(function (q, j) {
          var m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(q[3], 0), 0.25, j + x), M(0xffffff, { roughness: 1, emissive: 0x9fb7c9, emissiveIntensity: 0.35 }));
          m.position.set(q[0], q[1], q[2]); m.scale.y = 0.62; g.add(m);
        });
        g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); clouds.push({ g: g, x: x });
      }
      cloud(-10, 13, -40, 2.2); cloud(12, 17, -55, 2.8); cloud(2, 21, -70, 3.2); cloud(-22, 19, -60, 2.6);

      /* ---------- mountains ---------- */
      function mountain(x, z, r, h, col, snow, seed) {
        var g = jitter(new THREE.ConeGeometry(r, h, 7, 3), r * 0.12, seed);
        var m = mesh(g, col, null, true); m.position.set(x, h / 2 - 0.5, z); m.rotation.y = seed; scene.add(m);
        if (snow) {
          var sg = jitter(new THREE.ConeGeometry(r * 0.3, h * 0.3, 7, 1), r * 0.05, seed + 3);
          var s = mesh(sg, 0xf4f7fb, null, true); s.position.set(x, h - 0.5 - h * 0.15 + 0.05, z); s.rotation.y = seed; scene.add(s);
        }
      }
      mountain(-26, -62, 16, 22, 0x8aa0c8, true, 1); mountain(-6, -70, 20, 30, 0x7f95c0, true, 2); mountain(18, -64, 17, 24, 0x8ea6cc, true, 3); mountain(38, -58, 14, 17, 0x93abd0, false, 4);
      mountain(-36, -48, 12, 12, 0x7fae9a, false, 5); mountain(-14, -44, 11, 10, 0x6fa58a, false, 6); mountain(10, -46, 13, 11, 0x78ab8e, false, 7); mountain(30, -42, 11, 10, 0x6ea488, false, 8);

      /* ---------- ground + stream ---------- */
      function riverX(z) { return 0.55 * Math.sin(z * 0.2 + 0.2) - 0.11; }
      function bankH(x, z) {
        var d = Math.abs(x - riverX(z));
        return -0.75 * (1 - smooth(1.15, 2.05, d));
      }
      function segDist(px, pz, ax, az, bx, bz) {
        var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
        var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
        var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz);
      }
      function pathD(x, z) {
        return Math.min(segDist(x, z, -5.2, -5.5, -3.3, -1.0), segDist(x, z, -3.3, -1.0, -2.05, 0), segDist(x, z, 2.05, 0, 3.6, -2.5), segDist(x, z, 3.6, -2.5, 5.5, -6.5));
      }
      var gg = new THREE.PlaneGeometry(64, 50, 56, 44);
      gg.rotateX(-Math.PI / 2);
      gg.translate(0, 0, -14);
      var gp = gg.attributes.position;
      for (i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i);
        var y = bankH(x, z);
        var far = smooth(-12, -30, z);
        y += far * (1.5 + 1.5 * Math.sin(x * 0.25) + Math.sin(x * 0.6 + 1) * 0.6);
        var jit = Math.abs(x - riverX(z)) < 1.2 ? 0.03 : 0.12;
        y += (hash3(Math.round(x * 10), Math.round(z * 10), 1) - 0.5) * jit;
        if (Math.abs(x - riverX(z)) > 2.4 && pathD(x, z) > 0.8) y += (hash3(x, z, 2) - 0.3) * 0.12;
        gp.setY(i, y);
      }
      var ground = gg.toNonIndexed();
      gg.dispose();
      var gpos = ground.attributes.position, gcol = [];
      var greens = [0x8cc63f, 0x7fbd3c, 0x98cf4f, 0x86c247, 0x75b33a].map(function (c) { return new THREE.Color(c); });
      var sand = new THREE.Color(0xe6c79a), sandD = new THREE.Color(0xcfae80), pathC = new THREE.Color(0xe2bf8a), pathD2 = new THREE.Color(0xd3ad77);
      for (i = 0; i < gpos.count; i += 3) {
        var cx = (gpos.getX(i) + gpos.getX(i + 1) + gpos.getX(i + 2)) / 3, cz = (gpos.getZ(i) + gpos.getZ(i + 1) + gpos.getZ(i + 2)) / 3, cy = (gpos.getY(i) + gpos.getY(i + 1) + gpos.getY(i + 2)) / 3;
        var r = hash3(cx, cz, 3), c;
        if (cy < -0.12 && Math.abs(cx - riverX(cz)) < 2.2) c = r > 0.5 ? sand : sandD;
        else if (pathD(cx, cz) < 0.5) c = r > 0.5 ? pathC : pathD2;
        else c = greens[Math.floor(r * greens.length)];
        for (var k = 0; k < 3; k++) gcol.push(c.r, c.g, c.b);
      }
      ground.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      ground.computeVertexNormals();
      var groundM = new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
      groundM.receiveShadow = true; scene.add(groundM);

      // water: faceted strip that ripples
      var WN = 46, WJ = 5, wBase = [], wIdx = [];
      for (var a = 0; a <= WN; a++) {
        var wz = -34 + a * (48 / WN);
        for (var b = 0; b <= WJ; b++) {
          var wx = riverX(wz) + (b / WJ - 0.5) * 2.7 + (b > 0 && b < WJ ? (hash3(a, b, 9) - 0.5) * 0.25 : 0);
          wBase.push(wx, -0.42, wz + (b % 2) * 0.3);
        }
      }
      for (a = 0; a < WN; a++) for (b = 0; b < WJ; b++) {
        var i0 = a * (WJ + 1) + b, i1 = i0 + 1, i2 = i0 + WJ + 1, i3 = i2 + 1;
        wIdx.push(i0, i2, i1, i1, i2, i3);
      }
      var wTmp = new THREE.BufferGeometry();
      wTmp.setAttribute('position', new THREE.Float32BufferAttribute(wBase, 3));
      wTmp.setIndex(wIdx);
      var waterGeo = wTmp.toNonIndexed(); wTmp.dispose();
      var waterBase = Float32Array.from(waterGeo.attributes.position.array);
      var water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x3aa3cc, flatShading: true, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.94 }));
      water.receiveShadow = true; scene.add(water);
      function updateWater(w) {
        var arr = waterGeo.attributes.position.array;
        for (var q = 0; q < arr.length; q += 3) {
          var x = waterBase[q], z = waterBase[q + 2];
          arr[q + 1] = waterBase[q + 1] + 0.06 * Math.sin(x * 2.3 + z * 1.1 + w * 2.6) + 0.04 * Math.sin(z * 2.1 - w * 3.2);
        }
        waterGeo.attributes.position.needsUpdate = true;
        waterGeo.computeVertexNormals();
      }
      // foam / lilies
      for (i = 0; i < 4; i++) {
        var lz = -6 + i * 3.1, lily = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 6), 0x5fae4a, null, true);
        lily.position.set(riverX(lz) + (i % 2 ? 0.75 : -0.8), -0.36, lz); scene.add(lily);
      }

      /* ---------- props ---------- */
      function rock(x, z, s, col, y) {
        var m = mesh(jitter(new THREE.DodecahedronGeometry(s, 0), s * 0.35, x * 3 + z), col || 0x9aa5ad);
        m.position.set(x, (y === undefined ? 0 : y) + s * 0.35, z); m.scale.y = 0.7; m.rotation.y = x; scene.add(m); return m;
      }
      function pine(x, z, s, col) {
        var g = new THREE.Group();
        var trunk = mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.6, 5), 0x8a5a33); trunk.position.y = 0.3; g.add(trunk);
        var c1 = mesh(jitter(new THREE.ConeGeometry(0.75, 1.3, 6, 1), 0.08, x), col || 0x3e9a5c); c1.position.y = 1.05; g.add(c1);
        var c2 = mesh(jitter(new THREE.ConeGeometry(0.58, 1.1, 6, 1), 0.08, z), col ? col : 0x47a865); c2.position.y = 1.65; c2.rotation.y = 0.5; g.add(c2);
        var c3 = mesh(new THREE.ConeGeometry(0.38, 0.85, 6, 1), 0x56b870); c3.position.y = 2.2; g.add(c3);
        g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = x * 1.7; scene.add(g); return g;
      }
      function roundTree(x, z, s, col) {
        var g = new THREE.Group();
        var trunk = mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.9, 5), 0x8a5a33); trunk.position.y = 0.45; g.add(trunk);
        var top = mesh(jitter(new THREE.IcosahedronGeometry(0.75, 0), 0.15, x + z), col || 0x6cbf4f); top.position.y = 1.35; g.add(top);
        var top2 = mesh(jitter(new THREE.IcosahedronGeometry(0.5, 0), 0.1, x - z), col || 0x6cbf4f); top2.position.set(0.35, 1.75, 0.1); g.add(top2);
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g;
      }
      pine(-5.6, -2.2, 1.0); pine(-4.4, -7.5, 1.3); pine(-7.2, -5.5, 1.15); pine(5.6, -3.4, 1.1); pine(7.4, -6.2, 1.3, 0x3b8f57); pine(3.2, -9.5, 1.2);
      pine(-1.6, -11, 1.25); pine(1.8, -13, 1.1); pine(-9, -10, 1.4); pine(9.5, -11, 1.5);
      roundTree(4.6, 1.8, 1.0, 0xf2a541); roundTree(-6.4, 2.6, 1.05); roundTree(6.6, -0.6, 0.9, 0x7cc657); roundTree(-8.5, -1.5, 1.1, 0xf2a541);
      rock(-1.75, 1.5, 0.28, 0, -0.35); rock(-1.9, 2.1, 0.18, 0, -0.3); rock(1.7, -1.3, 0.3, 0, -0.35); rock(1.55, 2.7, 0.22, 0x8d989f, -0.4); rock(-3.2, 2.9, 0.3); rock(3.4, 3.4, 0.38); rock(-1.4, -3.6, 0.22, 0, -0.3);
      // flowers & grass tufts
      var flowerCols = [0xff7a8a, 0xffd25a, 0xffffff, 0xb48cf2];
      for (i = 0; i < 26; i++) {
        var fx = (R() - 0.5) * 14, fz = 4.2 - R() * 10;
        if (Math.abs(fx - riverX(fz)) < 2.3 || pathD(fx, fz) < 0.7) continue;
        if (R() < 0.55) {
          var f = mesh(new THREE.OctahedronGeometry(0.07, 0), flowerCols[i % 4], null, true); f.position.set(fx, 0.18, fz); scene.add(f);
          var st = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 3), 0x4e9a3a, null, true); st.position.set(fx, 0.09, fz); scene.add(st);
        } else {
          var tuft = mesh(new THREE.ConeGeometry(0.09, 0.28, 3), 0x6aa83a, null, true); tuft.position.set(fx, 0.12, fz); tuft.rotation.z = (R() - 0.5) * 0.4; scene.add(tuft);
        }
      }

      /* ---------- houses ---------- */
      function house(x, z, rot, wall, roof, s) {
        var g = new THREE.Group();
        var base = mesh(new THREE.BoxGeometry(2.0, 1.3, 1.6), wall); base.position.y = 0.65; g.add(base);
        var stone = mesh(new THREE.BoxGeometry(2.08, 0.25, 1.68), 0xb6a38a); stone.position.y = 0.12; g.add(stone);
        var rg = new THREE.CylinderGeometry(1.0, 1.0, 2.3, 3, 1); rg.rotateZ(Math.PI / 2); rg.rotateX(Math.PI / 6 + Math.PI);
        var rf = mesh(rg, roof); rf.scale.set(1, 0.9, 1.1); rf.position.y = 1.62; g.add(rf);
        var ch = mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), 0xb6a38a); ch.position.set(0.55, 2.05, -0.3); g.add(ch);
        var door = mesh(new THREE.BoxGeometry(0.45, 0.75, 0.06), 0x8d5a2b); door.position.set(-0.4, 0.5, 0.81); g.add(door);
        var win = mesh(new THREE.BoxGeometry(0.45, 0.4, 0.06), 0x9fd9ef, { emissive: 0x3c6e80, emissiveIntensity: 0.3 }); win.position.set(0.45, 0.75, 0.81); g.add(win);
        var sill = mesh(new THREE.BoxGeometry(0.55, 0.06, 0.12), 0x8d5a2b); sill.position.set(0.45, 0.53, 0.84); g.add(sill);
        var box = mesh(new THREE.BoxGeometry(0.5, 0.12, 0.14), 0xc0703a); box.position.set(0.45, 0.47, 0.9); g.add(box);
        for (var q = 0; q < 3; q++) { var fl = mesh(new THREE.OctahedronGeometry(0.06, 0), [0xff7a8a, 0xffd25a, 0xff7a8a][q], null, true); fl.position.set(0.3 + q * 0.15, 0.58, 0.92); g.add(fl); }
        g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s || 1); scene.add(g); return g;
      }
      house(-4.4, -4.2, 0.45, 0xf6e7cf, 0xe0603e, 1.05);
      house(4.7, -6.8, -0.5, 0xf3dcc2, 0x3f7fbf, 0.95);
      // smoke puffs
      var smoke = [];
      for (i = 0; i < 3; i++) { var sm = mesh(new THREE.IcosahedronGeometry(0.18, 0), 0xffffff, { transparent: true, opacity: 0.8 }, true); scene.add(sm); smoke.push(sm); }
      var chimney = new THREE.Vector3(-4.4 + Math.cos(0.45) * 0.55 * 1.05 - Math.sin(0.45) * 0.3 * 1.05, 2.5 * 1.05, -4.2 - Math.sin(0.45) * 0.55 * 1.05 - Math.cos(0.45) * 0.3 * 1.05);

      // fence
      for (i = 0; i < 5; i++) {
        var px = -6.8 + i * 0.6, pz = 0.6 + i * 0.12;
        var post = mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), 0xa8743f); post.position.set(px, 0.27, pz); scene.add(post);
      }
      var rail = mesh(new THREE.BoxGeometry(2.6, 0.07, 0.05), 0xb98450); rail.position.set(-5.6, 0.38, 0.84); rail.rotation.y = -0.2; scene.add(rail);
      // signpost
      var sign = new THREE.Group();
      var sp1 = mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), 0x8d5a2b); sp1.position.y = 0.45; sign.add(sp1);
      var sb = mesh(new THREE.BoxGeometry(0.62, 0.22, 0.05), 0xd9a066); sb.position.set(0.15, 0.78, 0); sb.rotation.z = 0.05; sign.add(sb);
      sign.position.set(-2.9, 0, -0.9); sign.rotation.y = 0.5; scene.add(sign);

      /* ---------- bridge ---------- */
      var bridge = new THREE.Group(); scene.add(bridge);
      var DECK = 0.12, PL = 0.3, GAP = 0.05, NPL = 9, MISSING = 4;
      var span = NPL * (PL + GAP);
      [-0.42, 0.42].forEach(function (z) {
        var beam = mesh(new THREE.BoxGeometry(span + 0.5, 0.16, 0.16), 0x7a4a26); beam.position.set(0, DECK - 0.12, z); bridge.add(beam);
      });
      var plankCols = [0xc98a4b, 0xbf8043, 0xd3955a];
      for (i = 0; i < NPL; i++) {
        if (i === MISSING) continue;
        var pl = mesh(new THREE.BoxGeometry(PL, 0.08, 1.15), plankCols[i % 3]);
        pl.position.set(-span / 2 + PL / 2 + i * (PL + GAP), DECK, (hash3(i, 1, 1) - 0.5) * 0.06);
        pl.rotation.y = (hash3(i, 2, 2) - 0.5) * 0.06; bridge.add(pl);
      }
      var postX = [-span / 2 - 0.1, span / 2 + 0.1];
      postX.forEach(function (x) {
        [-0.6, 0.6].forEach(function (z) {
          var p = mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.25, 6), 0x8d5a2b); p.position.set(x, 0.18, z); bridge.add(p);
          var cap = mesh(new THREE.ConeGeometry(0.11, 0.14, 6), 0x7a4a26); cap.position.set(x, 0.86, z); bridge.add(cap);
        });
      });
      [-0.6, 0.6].forEach(function (z) {
        var rl = mesh(new THREE.BoxGeometry(span + 0.2, 0.07, 0.07), 0xa66d38); rl.position.set(0, 0.7, z); bridge.add(rl);
        var rl2 = mesh(new THREE.BoxGeometry(span + 0.2, 0.05, 0.05), 0xa66d38); rl2.position.set(0, 0.42, z); bridge.add(rl2);
      });
      // under-supports in the water
      [-0.75, 0.75].forEach(function (x) {
        var leg = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 5), 0x6e4322); leg.position.set(x, -0.3, 0); leg.rotation.x = Math.PI / 2 * 0; bridge.add(leg);
      });
      bridge.position.set(riverX(0) + 0.11, 0, 0);
      var gapX = bridge.position.x - span / 2 + PL / 2 + MISSING * (PL + GAP);

      // ghost slot + new plank
      var ghost = new THREE.Mesh(new THREE.BoxGeometry(PL + 0.04, 0.1, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.5, depthWrite: false }));
      ghost.position.set(gapX, DECK, 0); scene.add(ghost);
      var ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(ghost.geometry), new THREE.LineBasicMaterial({ color: 0xfff3b0, transparent: true }));
      ghost.add(ghostEdge);
      var newPlank = mesh(new THREE.BoxGeometry(PL, 0.08, 1.15), 0xe0a565, { emissive: 0xffc34d, emissiveIntensity: 0 });
      newPlank.position.set(gapX, DECK, 0); scene.add(newPlank);

      /* ---------- characters ---------- */
      var SKIN = 0xf2c39b;
      function limb(r1, r2, len, col) { var g = new THREE.Group(); var m = mesh(new THREE.CylinderGeometry(r1, r2, len, 5), col); m.position.y = -len / 2; g.add(m); return g; }
      function eye(x, y, z, g) { var e = mesh(new THREE.SphereGeometry(0.035, 5, 4), 0x23313f, { roughness: 0.4 }, true); e.position.set(x, y, z); g.add(e); return e; }

      // hero
      var hero = new THREE.Group(); var heroBody = new THREE.Group(); hero.add(heroBody);
      var hLegL = limb(0.085, 0.075, 0.42, 0x2c3e66), hLegR = limb(0.085, 0.075, 0.42, 0x2c3e66);
      hLegL.position.set(-0.1, 0.5, 0); hLegR.position.set(0.1, 0.5, 0);
      [hLegL, hLegR].forEach(function (l) { var sh = mesh(new THREE.BoxGeometry(0.13, 0.09, 0.22), 0xf7f7f2); sh.position.set(0, -0.44, 0.04); l.add(sh); var so = mesh(new THREE.BoxGeometry(0.135, 0.03, 0.225), 0xff7a59); so.position.set(0, -0.475, 0.04); l.add(so); heroBody.add(l); });
      var hTorso = mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 6), 0x2f6fd6); hTorso.position.y = 0.76; heroBody.add(hTorso);
      var hBelt = mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.07, 6), 0x1f4ea0); hBelt.position.y = 0.54; heroBody.add(hBelt);
      var hCollar = mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.07, 6), 0x4b8bf0); hCollar.position.y = 1.02; heroBody.add(hCollar);
      var pack = mesh(new THREE.BoxGeometry(0.36, 0.42, 0.2), 0xff8a3d); pack.position.set(0, 0.8, -0.27); heroBody.add(pack);
      var flap = mesh(new THREE.BoxGeometry(0.37, 0.14, 0.22), 0xe56f25); flap.position.set(0, 0.97, -0.27); heroBody.add(flap);
      var pkt = mesh(new THREE.BoxGeometry(0.22, 0.13, 0.06), 0xe56f25); pkt.position.set(0, 0.68, -0.39); heroBody.add(pkt);
      [-0.12, 0.12].forEach(function (x) { var st = mesh(new THREE.BoxGeometry(0.05, 0.42, 0.04), 0xe56f25); st.position.set(x, 0.82, 0.2); st.rotation.x = -0.12; heroBody.add(st); });
      var hArmL = limb(0.06, 0.055, 0.38, 0x2f6fd6), hArmR = limb(0.06, 0.055, 0.38, 0x2f6fd6);
      hArmL.position.set(-0.27, 0.97, 0); hArmR.position.set(0.27, 0.97, 0);
      [hArmL, hArmR].forEach(function (a) { var hd = mesh(new THREE.IcosahedronGeometry(0.065, 0), SKIN); hd.position.y = -0.42; a.add(hd); heroBody.add(a); });
      var hHead = new THREE.Group(); hHead.position.y = 1.28; heroBody.add(hHead);
      hHead.add(mesh(new THREE.IcosahedronGeometry(0.27, 1), SKIN));
      var hair = mesh(new THREE.SphereGeometry(0.29, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), 0x6b3f22); hair.position.set(0, 0.03, -0.02); hair.rotation.x = -0.25; hHead.add(hair);
      for (i = 0; i < 3; i++) { var tuft2 = mesh(new THREE.ConeGeometry(0.08, 0.2, 4), 0x6b3f22); tuft2.position.set(-0.1 + i * 0.1, 0.17, 0.2); tuft2.rotation.x = 1.9; tuft2.rotation.z = (i - 1) * 0.3; hHead.add(tuft2); }
      var hEyeL = eye(-0.095, 0.0, 0.245, hHead), hEyeR = eye(0.095, 0.0, 0.245, hHead);
      [-0.15, 0.15].forEach(function (x) { var ck = mesh(new THREE.CircleGeometry(0.04, 6), 0xf59a86, { transparent: true, opacity: 0.8 }, true); ck.position.set(x, -0.07, 0.245); ck.rotation.y = x * 2; hHead.add(ck); });
      var smile = mesh(new THREE.TorusGeometry(0.05, 0.013, 3, 6, Math.PI), 0x8b3a2b, null, true); smile.position.set(0, -0.09, 0.255); smile.rotation.z = Math.PI; hHead.add(smile);
      var nose = mesh(new THREE.TetrahedronGeometry(0.035, 0), 0xe3ad84, null, true); nose.position.set(0, -0.03, 0.27); hHead.add(nose);
      scene.add(hero);

      // mentor
      var tome = new THREE.Group(); var tBody = new THREE.Group(); tome.add(tBody);
      var tLegL = limb(0.1, 0.09, 0.45, 0x5b4a3a), tLegR = limb(0.1, 0.09, 0.45, 0x5b4a3a);
      tLegL.position.set(-0.13, 0.52, 0); tLegR.position.set(0.13, 0.52, 0);
      [tLegL, tLegR].forEach(function (l) { var bt = mesh(new THREE.BoxGeometry(0.17, 0.12, 0.26), 0x4a2f1c); bt.position.set(0, -0.46, 0.04); l.add(bt); tBody.add(l); });
      var tTorso = mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.66, 6), 0x5fa36b); tTorso.position.y = 0.85; tBody.add(tTorso);
      var apron = mesh(new THREE.BoxGeometry(0.38, 0.64, 0.05), 0x9a6234); apron.position.set(0, 0.74, 0.31); apron.rotation.x = -0.06; tBody.add(apron);
      var apPkt = mesh(new THREE.BoxGeometry(0.26, 0.14, 0.03), 0x7f4e27); apPkt.position.set(0, 0.62, 0.345); tBody.add(apPkt);
      var ruler = mesh(new THREE.BoxGeometry(0.04, 0.2, 0.02), 0xffc857); ruler.position.set(0.07, 0.72, 0.355); ruler.rotation.z = 0.2; tBody.add(ruler);
      var tArmL = limb(0.075, 0.07, 0.44, 0x5fa36b), tArmR = limb(0.075, 0.07, 0.44, 0x5fa36b);
      tArmL.position.set(-0.36, 1.12, 0); tArmR.position.set(0.36, 1.12, 0);
      [tArmL, tArmR].forEach(function (a) { var hd = mesh(new THREE.IcosahedronGeometry(0.08, 0), SKIN); hd.position.y = -0.48; a.add(hd); tBody.add(a); });
      var tHead = new THREE.Group(); tHead.position.y = 1.47; tBody.add(tHead);
      tHead.add(mesh(new THREE.IcosahedronGeometry(0.27, 1), SKIN));
      var beard = mesh(jitter(new THREE.IcosahedronGeometry(0.24, 0), 0.04, 11), 0xf4f4f0); beard.position.set(0, -0.15, 0.12); beard.scale.set(1.05, 1.0, 0.8); tHead.add(beard);
      var must = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), 0xffffff); must.position.set(0, -0.06, 0.25); tHead.add(must);
      var tNose = mesh(new THREE.IcosahedronGeometry(0.055, 0), 0xe7a882); tNose.position.set(0, 0.0, 0.27); tHead.add(tNose);
      eye(-0.1, 0.06, 0.235, tHead); eye(0.1, 0.06, 0.235, tHead);
      [-0.1, 0.1].forEach(function (x) { var br = mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), 0xf4f4f0); br.position.set(x, 0.13, 0.245); br.rotation.z = -x; tHead.add(br); });
      var hat = mesh(new THREE.SphereGeometry(0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc83d, { roughness: 0.6 }); hat.position.y = 0.08; tHead.add(hat);
      var brim = mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.04, 8), 0xffb81f, { roughness: 0.6 }); brim.position.set(0, 0.09, 0.04); tHead.add(brim);
      var ridge = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), 0xffb81f); ridge.position.y = 0.36; tHead.add(ridge);
      tome.position.set(2.2, 0, 0.95); tome.rotation.y = -0.62; scene.add(tome);

      // contact shadows are real shadows; tiny dark disc under hero for grounding
      /* ---------- FX ---------- */
      var sparks = [], dust = [];
      for (i = 0; i < 12; i++) {
        var s = mesh(new THREE.OctahedronGeometry(0.07, 0), i % 3 ? 0xffd75a : 0xffffff, { emissive: 0xffc23a, emissiveIntensity: 0.8 }, true);
        s.userData = { a: (i / 12) * Math.PI * 2 + hash3(i, 3, 3), up: 0.6 + hash3(i, 4, 4) * 0.9, r: 0.6 + hash3(i, 5, 5) * 0.6 };
        s.visible = false; scene.add(s); sparks.push(s);
      }
      for (i = 0; i < 6; i++) {
        var d = mesh(new THREE.IcosahedronGeometry(0.12, 0), 0xf3e2c4, { transparent: true, opacity: 0.9 }, true);
        d.userData = { a: (i / 6) * Math.PI * 2 }; d.visible = false; scene.add(d); dust.push(d);
      }
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 6), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(gapX, DECK + 0.08, 0); scene.add(ring);

      /* ---------- HUD ---------- */
      var style = document.createElement('style'); style.textContent = CSS; host.appendChild(style);
      var fade = document.createElement('div'); fade.className = 'lowpoly-fade'; host.appendChild(fade);
      var hud = document.createElement('div'); hud.className = 'lowpoly-hud';
      hud.innerHTML =
        '<div class="lowpoly-top"><div class="lowpoly-ava">' + AVATAR + '</div><div class="lowpoly-info"><div class="lowpoly-row"><div class="lowpoly-lvl"><b>4</b>Nível 4 · Explorador</div></div>' +
        '<div class="lowpoly-bar"><div class="lowpoly-fill"></div></div><div class="lowpoly-row" style="margin-top:.25em"><span class="lowpoly-xpt">XP</span><span class="lowpoly-xpt lowpoly-xpn">620 / 1000</span></div></div></div>' +
        '<div class="lowpoly-quest"><i>' + IC_QUEST + '</i><span>Missão: consertar a ponte da vila</span></div>' +
        '<div class="lowpoly-bub"><div class="lowpoly-name">Mestre Tomé</div><div class="lowpoly-say">A viga precisa se apoiar dos dois lados!</div></div>' +
        '<div class="lowpoly-xp">+50 XP</div>' +
        '<div class="lowpoly-btns"><div class="lowpoly-btn main"><i style="background:#ff7a59">' + IC_BUILD + '</i>Construir</div>' +
        '<div class="lowpoly-btn"><i style="background:#ffb03a">' + IC_BAG + '</i>Mochila</div><div class="lowpoly-btn"><i style="background:#1fa39a">' + IC_MAP + '</i>Mapa</div></div>';
      host.appendChild(hud);
      var elFill = hud.querySelector('.lowpoly-fill'), elXpn = hud.querySelector('.lowpoly-xpn'), elBub = hud.querySelector('.lowpoly-bub'), elXp = hud.querySelector('.lowpoly-xp');

      /* ---------- layout ---------- */
      var CAM = new THREE.Vector3(0, 3.3, 9.4), LOOK = new THREE.Vector3(0.1, 1.0, 0);
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        var dist = CAM.distanceTo(LOOK);
        var halfW = 3.55;
        var vf = 2 * Math.atan(halfW / dist / camera.aspect) * 180 / Math.PI;
        camera.fov = clamp(vf, 34, 78);
        camera.setViewOffset(W, H, 0, -H * 0.1, W, H);
        camera.updateProjectionMatrix();
        var base = clamp(Math.min(W / 390, H / 720), 0.78, 1.5);
        hud.style.fontSize = (15 * base) + 'px';
      }
      layout();
      var ro = new ResizeObserver(function () { layout(); });
      ro.observe(host);

      /* ---------- animation ---------- */
      var HERO_A = new THREE.Vector3(-3.9, 0, -1.9), HERO_B = new THREE.Vector3(-2.0, 0, 0.45);
      var v3 = new THREE.Vector3();
      function proj(v) { v3.copy(v).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }

      function update(t, wall) {
        var s = t >= 3.3 ? 0 : t;               // story time (resets while screen is faded)
        // fade
        var fo = t < 3.3 ? smooth(3.02, 3.28, t) : 1 - smooth(3.32, 3.6, t);
        fade.style.opacity = (fo * 0.96).toFixed(3);

        // camera
        var cu = reduce ? 0 : smooth(0, 2.9, s);
        camera.position.set(CAM.x - 0.5 + 0.9 * cu, CAM.y + 0.1 * Math.sin(wall * 0.9), CAM.z - 0.8 * cu);
        camera.lookAt(LOOK.x - 0.3 + 0.4 * cu, LOOK.y, LOOK.z);

        // hero walk
        var wp = clamp(s / 1.2, 0, 1), ep = 1 - (1 - wp) * (1 - wp);
        hero.position.lerpVectors(HERO_A, HERO_B, ep);
        var walk = s < 1.2 ? 1 - smooth(0.95, 1.2, s) : 0;
        var ph = s * Math.PI * 2 * 2.1;
        var sw = Math.sin(ph) * 0.65 * walk;
        hLegL.rotation.x = sw; hLegR.rotation.x = -sw;
        hArmL.rotation.x = -sw * 0.9; hArmR.rotation.x = sw * 0.9;
        hArmL.rotation.z = -0.12; hArmR.rotation.z = 0.12;
        heroBody.position.y = Math.abs(Math.cos(ph)) * 0.06 * walk + Math.sin(wall * 3) * 0.008;
        heroBody.rotation.z = Math.sin(ph) * 0.05 * walk;
        var heading = lerp(0.88, 0.6, smooth(1.1, 1.6, s));
        hero.rotation.y = heading;
        hHead.rotation.y = 0.35 * smooth(0.9, 1.4, s) * (1 - smooth(2.2, 2.6, s)) + 0.0;
        hHead.rotation.x = 0.1 * smooth(1.4, 1.8, s) * (1 - smooth(2.2, 2.5, s));
        // hero cheers after the plank lands
        var cheer = smooth(2.3, 2.5, s) * (1 - smooth(2.9, 3.1, s));
        hArmR.rotation.x -= cheer * 2.6; hArmR.rotation.z += cheer * 0.2;
        heroBody.position.y += cheer * Math.abs(Math.sin((s - 2.3) * 9)) * 0.12;
        // blink
        var bl = ((wall % 2.7) < 0.12) ? 0.15 : 1; hEyeL.scale.y = hEyeR.scale.y = bl;

        // mentor
        var talk = smooth(0.7, 0.95, s) * (1 - smooth(2.2, 2.45, s));
        tBody.position.y = Math.sin(wall * 2.2) * 0.012;
        tArmL.rotation.x = -talk * (1.6 + Math.sin(s * 10) * 0.25);
        tArmL.rotation.z = -talk * 0.35;
        tArmR.rotation.z = 0.12 + talk * 0.1;
        var thumbs = smooth(2.35, 2.55, s) * (1 - smooth(2.95, 3.15, s));
        tArmR.rotation.x = -thumbs * 2.3; tArmR.rotation.z += thumbs * 0.4;
        tHead.rotation.x = Math.sin(s * 11) * 0.06 * talk + thumbs * Math.sin((s - 2.35) * 12) * 0.08;
        tHead.rotation.y = 0.15 * talk;

        // plank
        var drop = smooth(1.55, 2.2, s);
        var land = clamp((s - 1.55) / 0.65, 0, 1);
        ghost.visible = s < 1.75;
        ghost.material.opacity = (0.35 + 0.35 * (0.5 + 0.5 * Math.sin(wall * 7))) * (1 - smooth(1.5, 1.75, s)); ghostEdge.material.opacity = 1 - smooth(1.5, 1.75, s);
        newPlank.visible = s >= 1.5;
        var yy = DECK + (1 - easeOutBack(land)) * 2.4;
        if (land <= 0) yy = DECK + 2.4;
        newPlank.position.y = yy;
        newPlank.rotation.y = (1 - drop) * 1.4;
        newPlank.rotation.z = (1 - drop) * 0.35;
        var glow = smooth(1.5, 1.8, s) * (1 - smooth(2.3, 2.9, s));
        newPlank.material.emissiveIntensity = glow * 0.55;
        newPlank.scale.set(1, 1, 1);
        var sq = s > 2.2 && s < 2.4 ? Math.sin((s - 2.2) / 0.2 * Math.PI) : 0;
        newPlank.scale.y = 1 - sq * 0.3; newPlank.scale.z = 1 + sq * 0.06;

        // impact fx
        var fx = clamp((s - 2.18) / 0.7, 0, 1);
        var fxOn = s > 2.18 && s < 2.9;
        sparks.forEach(function (p) {
          p.visible = fxOn;
          if (!fxOn) return;
          var u = p.userData, e = 1 - Math.pow(1 - fx, 3);
          p.position.set(gapX + Math.cos(u.a) * u.r * e * 0.6, DECK + 0.1 + u.up * e - fx * fx * 0.5, Math.sin(u.a) * u.r * e);
          p.rotation.y = wall * 6; p.rotation.x = wall * 4;
          p.scale.setScalar((1 - fx) * 1.4 + 0.1);
        });
        dust.forEach(function (p) {
          p.visible = s > 2.18 && s < 2.75;
          if (!p.visible) return;
          var k = clamp((s - 2.18) / 0.55, 0, 1);
          p.position.set(gapX + Math.cos(p.userData.a) * 0.25 * (1 + k * 2), DECK + 0.05 + k * 0.25, Math.sin(p.userData.a) * 0.55 * (1 + k));
          p.scale.setScalar(0.6 + k * 1.3); p.material.opacity = 0.85 * (1 - k);
        });
        ring.material.opacity = s > 2.18 && s < 2.8 ? (1 - clamp((s - 2.18) / 0.6, 0, 1)) * 0.9 : 0;
        var rk = clamp((s - 2.18) / 0.6, 0, 1); ring.scale.setScalar(1 + rk * 4);

        // nature
        water && updateWater(wall);
        clouds.forEach(function (c, j) { c.g.position.x = c.x + ((wall * (0.25 + j * 0.06)) % 60) - 0; });
        smoke.forEach(function (p, j) {
          var k = ((wall * 0.45 + j / 3) % 1);
          p.position.set(chimney.x + k * 0.5, chimney.y + k * 1.5, chimney.z);
          p.scale.setScalar(0.6 + k * 1.4); p.material.opacity = 0.75 * (1 - k);
        });
        ruler.rotation.z = 0.2;

        // HUD
        var xpK = smooth(2.4, 2.85, s);
        elFill.style.width = (62 + 5 * xpK) + '%';
        elXpn.textContent = Math.round(620 + 50 * xpK) + ' / 1000';
        var bIn = clamp((s - 0.8) / 0.3, 0, 1), bOut = smooth(2.75, 2.98, s);
        var bs = (bIn > 0 ? easeOutBack(bIn) : 0) * (1 - bOut);
        var head = proj(v3.set(tome.position.x, 2.05, tome.position.z));
        var bw = elBub.offsetWidth || 200, bh = elBub.offsetHeight || 80;
        var bl2 = clamp(head.x - bw * 0.72, 12, W - bw - 12);
        var bt = head.y - bh - 18;
        var topLimit = hud.querySelector('.lowpoly-quest').getBoundingClientRect().bottom - host.getBoundingClientRect().top + 10;
        if (bt < topLimit) bt = topLimit;
        elBub.style.setProperty('--tx', clamp(head.x - bl2, 20, bw - 20) + 'px');
        elBub.style.transform = 'translate(' + bl2.toFixed(1) + 'px,' + bt.toFixed(1) + 'px) scale(' + Math.max(bs, 0.001).toFixed(3) + ')';
        elBub.style.opacity = Math.min(1, bIn * 2) * (1 - bOut);
        var xk = clamp((s - 2.35) / 0.7, 0, 1);
        var xpPos = proj(v3.set(gapX, 1.0, 0));
        elXp.style.opacity = s > 2.35 ? (xk < 0.15 ? xk / 0.15 : 1 - smooth(0.6, 1, xk)) : 0;
        elXp.style.left = xpPos.x + 'px';
        elXp.style.top = (xpPos.y - 70 * (1 - Math.pow(1 - xk, 2))) + 'px';
        elXp.style.transform = 'translate(-50%,-50%) scale(' + (0.7 + 0.4 * Math.min(1, xk * 4) - 0.1 * xk) + ')';
      }

      var raf = 0, start = performance.now();
      function frame() {
        raf = requestAnimationFrame(frame);
        var el = (performance.now() - start) / 1000;
        var forced = typeof window.__sceneTime === 'number';
        var t = forced ? window.__sceneTime % LOOP : el % LOOP;
        update(t, forced ? window.__sceneTime : el);
        renderer.render(scene, camera);
      }
      frame();

      return {
        destroy: function () {
          cancelAnimationFrame(raf);
          ro.disconnect();
          scene.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }
          });
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
