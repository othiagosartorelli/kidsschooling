/* Estilo CARTOON 3D — cena "a ponte da vila" (loop de 3,6 s). three.js r128 global. */
(function () {
  window.SCENES = window.SCENES || {};
  var ID = 'cartoon';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOutBack(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function easeOutBounce(x) { var n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var CSS = '' +
    '.cartoon-hud{position:absolute;inset:0;pointer-events:none;font-family:"Fredoka","Baloo 2",system-ui,sans-serif;color:#3a2a5c;-webkit-font-smoothing:antialiased}' +
    '.cartoon-iris{position:absolute;inset:0;opacity:0}' +
    '.cartoon-top{position:absolute;left:.85em;right:.85em;top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:.65em;padding:.5em .85em .55em .5em;background:#fff;border-radius:1.6em;box-shadow:0 .32em 0 #c6d6f5,0 .7em 1.2em rgba(40,60,120,.18)}' +
    '.cartoon-ava{position:relative;flex:none;width:3.5em;height:3.5em;border-radius:50%;background:linear-gradient(160deg,#ffcf5a,#ff8a3d);padding:.22em;box-shadow:0 .2em 0 #e0691f}' +
    '.cartoon-ava svg{display:block;width:100%;height:100%;border-radius:50%;background:#bfe6ff}' +
    '.cartoon-lv{position:absolute;right:-.35em;bottom:-.3em;width:1.55em;height:1.55em;border-radius:50%;background:#8a5cf6;color:#fff;font-weight:700;font-size:.9em;display:grid;place-items:center;border:.15em solid #fff;box-shadow:0 .12em 0 #5b34c0}' +
    '.cartoon-info{flex:1;min-width:0}' +
    '.cartoon-lvl{font-weight:600;font-size:1.08em;line-height:1.1;white-space:nowrap}' +
    '.cartoon-lvl span{color:#8a5cf6}' +
    '.cartoon-bar{position:relative;margin-top:.4em;height:1.05em;border-radius:1em;background:#e9eefb;box-shadow:inset 0 .12em 0 rgba(0,0,0,.08);overflow:hidden}' +
    '.cartoon-fill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:1em;background:linear-gradient(180deg,#9ef06b,#4ccf3a);box-shadow:inset 0 -.15em 0 #36a92a}' +
    '.cartoon-fill:after{content:"";position:absolute;left:.4em;right:.4em;top:.16em;height:.22em;border-radius:1em;background:rgba(255,255,255,.65)}' +
    '.cartoon-xpn{position:absolute;inset:0;display:grid;place-items:center;font-size:.72em;font-weight:700;color:#2c4a1c;font-variant-numeric:tabular-nums;letter-spacing:.02em}' +
    '.cartoon-quest{position:absolute;left:.85em;top:calc(env(safe-area-inset-top,0px) + 38px + 5.3em);display:flex;align-items:center;gap:.5em;padding:.38em .9em .38em .38em;background:#ffd84a;border-radius:2em;box-shadow:0 .25em 0 #e0a91c;font-weight:600;font-size:.88em;color:#5a3a06;max-width:82%}' +
    '.cartoon-quest i{flex:none;width:1.9em;height:1.9em;border-radius:50%;background:#fff;display:grid;place-items:center}' +
    '.cartoon-quest i svg{width:1.25em;height:1.25em}' +
    '.cartoon-bub{position:absolute;left:0;top:0;width:13.4em;padding:.75em 1em .85em;background:#fff;border-radius:1.5em;box-shadow:0 .3em 0 #d5dcf0,0 .8em 1.5em rgba(40,60,120,.22);opacity:0;transform-origin:var(--tx,80%) 110%}' +
    '.cartoon-bub:after{content:"";position:absolute;bottom:-.75em;left:calc(var(--tx,80%) - .8em);width:1.6em;height:1.1em;background:#fff;border-radius:0 0 1.2em 0;clip-path:polygon(0 0,100% 0,62% 100%)}' +
    '.cartoon-name{position:absolute;top:-.85em;left:.9em;font-weight:600;font-size:.82em;color:#fff;background:#8a5cf6;padding:.22em .75em;border-radius:1em;box-shadow:0 .18em 0 #5b34c0}' +
    '.cartoon-say{font-size:1.04em;font-weight:500;line-height:1.28;margin-top:.15em}' +
    '.cartoon-xp{position:absolute;left:0;top:0;font-weight:700;font-size:1.9em;color:#ffe14d;opacity:0;white-space:nowrap;transform:translate(-50%,-50%);' +
    'text-shadow:0 .06em 0 #8a5cf6,.06em 0 0 #8a5cf6,-.06em 0 0 #8a5cf6,0 -.06em 0 #8a5cf6,.05em .05em 0 #8a5cf6,-.05em .05em 0 #8a5cf6,.05em -.05em 0 #8a5cf6,-.05em -.05em 0 #8a5cf6,0 .16em 0 #5b34c0}' +
    '.cartoon-btns{position:absolute;left:.5em;right:.5em;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;justify-content:space-around;align-items:flex-end}' +
    '.cartoon-btn{display:flex;flex-direction:column;align-items:center;gap:.25em;width:33%}' +
    '.cartoon-btn i{width:4.1em;height:4.1em;border-radius:50%;display:grid;place-items:center;border:.22em solid #fff;position:relative}' +
    '.cartoon-btn i:before{content:"";position:absolute;left:18%;top:10%;width:40%;height:22%;border-radius:50%;background:rgba(255,255,255,.45);transform:rotate(-20deg)}' +
    '.cartoon-btn i svg{width:2em;height:2em}' +
    '.cartoon-btn b{font-weight:600;font-size:.9em;white-space:nowrap;color:#3a2a5c;background:#fff;padding:.18em .65em;border-radius:1em;box-shadow:0 .2em 0 #c6d6f5}' +
    '';

  var AVATAR = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M10 64c2-12 10-17 22-17s20 5 22 17z" fill="#3d7bff"/><path d="M24 48l8 6 8-6" fill="#ffffff" opacity=".9"/>' +
    '<circle cx="32" cy="30" r="17" fill="#ffd2b0"/><circle cx="15.5" cy="31" r="3.5" fill="#ffc29a"/><circle cx="48.5" cy="31" r="3.5" fill="#ffc29a"/>' +
    '<path d="M14 28c0-11 8-17 18-17s19 6 18 17c-4-5-10-7-15-6 3-2 4-4 4-6-4 4-12 6-25 12z" fill="#8a4b25"/>' +
    '<ellipse cx="25" cy="32" rx="4" ry="5" fill="#fff"/><ellipse cx="39" cy="32" rx="4" ry="5" fill="#fff"/><circle cx="25.6" cy="33" r="2.8" fill="#3a2a5c"/><circle cx="39.6" cy="33" r="2.8" fill="#3a2a5c"/>' +
    '<circle cx="26.6" cy="31.6" r="1" fill="#fff"/><circle cx="40.6" cy="31.6" r="1" fill="#fff"/>' +
    '<ellipse cx="20" cy="39" rx="3" ry="2" fill="#ff8f8f" opacity=".7"/><ellipse cx="44" cy="39" rx="3" ry="2" fill="#ff8f8f" opacity=".7"/>' +
    '<path d="M27 40q5 5 10 0" stroke="#a03a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  var IC_QUEST = '<svg viewBox="0 0 24 24"><path d="M3 14q9-6 18 0" stroke="#c0762a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M6 12.3v6M12 10.5v8M18 12.3v6" stroke="#8a4b25" stroke-width="2.4" stroke-linecap="round"/><path d="M12 2l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#ffb800"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 24 24"><rect x="11" y="9" width="3.4" height="13" rx="1.7" transform="rotate(40 12.7 15.5)" fill="#fff"/><path d="M6 4.5c3-2.5 8-2.5 11.5 1l2 2-4.5 4.5-2.5-2.5c-1.5-1.5-4-2-6.5-1.5z" fill="#fff"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 24 24"><path d="M5 10a7 7 0 0 1 14 0v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#fff"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7" stroke="#fff" stroke-width="2.2" fill="none"/><rect x="8.5" y="13" width="7" height="5" rx="2" fill="#ff9a2e"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 24 24"><path d="M2.5 6.5l6-2.5 7 2.5 6-2.5v13.5l-6 2.5-7-2.5-6 2.5z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 4v13.5M15.5 6.5V20" stroke="#38b25a" stroke-width="1.6"/><path d="M5 14l2.5-3 3 2 3-4" stroke="#ff6b6b" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-dasharray="1.6 1.8"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(11);
      var extraTex = [];

      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      var cv = renderer.domElement;
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      host.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xcdeeff, 30, 85);
      var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);

      var mats = {};
      function M(color, o) {
        var key = color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, roughness: 0.62, metalness: 0 };
        if (o) for (var k in o) p[k] = o[k];
        return (mats[key] = new THREE.MeshStandardMaterial(p));
      }
      var geos = {};
      function G(key, fn) { return geos[key] || (geos[key] = fn()); }
      function sph(r, col, o, seg) { var m = new THREE.Mesh(G('s' + r + '_' + (seg || 20), function () { return new THREE.SphereGeometry(r, seg || 20, Math.max(8, Math.round((seg || 20) * 0.7))); }), M(col, o)); m.castShadow = true; m.receiveShadow = true; return m; }
      function mesh(geo, col, o, noShadow) { var m = new THREE.Mesh(geo, M(col, o)); if (!noShadow) { m.castShadow = true; m.receiveShadow = true; } return m; }
      // capsule = cylinder + two spheres, pivot at top, hanging down
      function capsule(r, len, col, o) {
        var g = new THREE.Group();
        var c = mesh(new THREE.CylinderGeometry(r, r, len, 16, 1, true), col, o); c.position.y = -len / 2; g.add(c);
        var a = sph(r, col, o, 16); g.add(a);
        var b = sph(r, col, o, 16); b.position.y = -len; g.add(b);
        return g;
      }

      /* lights */
      scene.add(new THREE.HemisphereLight(0xdcefff, 0x6aa850, 0.62));
      var sun = new THREE.DirectionalLight(0xfff0d8, 0.8);
      sun.position.set(-6, 11, 8); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
      sun.shadow.bias = -0.001; sun.shadow.radius = 4;
      scene.add(sun); scene.add(sun.target);
      var fill = new THREE.DirectionalLight(0xc9dcff, 0.25); fill.position.set(6, 4, 6); scene.add(fill);

      /* sky */
      var skyGeo = new THREE.SphereGeometry(120, 32, 16);
      var sp = skyGeo.attributes.position, col = [], cTop = new THREE.Color(0x2f9bff), cHor = new THREE.Color(0xc8f0ff), tmp = new THREE.Color();
      for (var i = 0; i < sp.count; i++) { var h = sp.getY(i) / 120; tmp.copy(cHor).lerp(cTop, smooth(0.0, 0.6, h)); col.push(tmp.r, tmp.g, tmp.b); }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));

      // sun glow sprite
      var gc = document.createElement('canvas'); gc.width = gc.height = 128;
      var gx = gc.getContext('2d'), grd = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,240,1)'); grd.addColorStop(0.25, 'rgba(255,250,210,0.95)'); grd.addColorStop(0.32, 'rgba(255,240,180,0.45)'); grd.addColorStop(1, 'rgba(255,240,180,0)');
      gx.fillStyle = grd; gx.fillRect(0, 0, 128, 128);
      var glowTex = new THREE.CanvasTexture(gc); extraTex.push(glowTex);
      var sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, depthWrite: false, transparent: true }));
      sunSpr.position.set(-30, 34, -90); sunSpr.scale.set(30, 30, 1); scene.add(sunSpr);

      /* clouds */
      var clouds = [];
      var cloudMat = M(0xffffff, { roughness: 0.9, emissive: 0xc9e6ff, emissiveIntensity: 0.45 });
      function cloud(x, y, z, s) {
        var g = new THREE.Group();
        [[0, 0, 0, 1.3], [1.2, -0.25, 0.1, 0.95], [-1.25, -0.3, 0.1, 0.9], [0.55, 0.55, 0, 0.9], [-0.5, 0.4, 0.1, 0.8], [2.0, -0.45, 0, 0.6], [-2.0, -0.5, 0, 0.55]].forEach(function (q) {
          var m = new THREE.Mesh(G('cl' + q[3], function () { return new THREE.SphereGeometry(q[3], 18, 12); }), cloudMat);
          m.position.set(q[0], q[1], q[2]); g.add(m);
        });
        var base = new THREE.Mesh(G('clb', function () { return new THREE.CylinderGeometry(1, 1, 0.3, 20); }), cloudMat); base.scale.set(2.3, 1, 0.8); base.position.y = -0.55; g.add(base);
        g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); clouds.push({ g: g, x: x });
      }
      cloud(-9, 12, -40, 2.0); cloud(10, 15, -48, 2.4); cloud(-1, 19, -62, 2.6); cloud(22, 10, -55, 2.0); cloud(-24, 17, -60, 2.4);

      /* background hills */
      function hill(x, z, r, sy, c) { var m = mesh(G('hill', function () { return new THREE.SphereGeometry(1, 32, 16); }), c, { roughness: 0.9 }, true); m.scale.set(r, r * sy, r * 0.7); m.position.set(x, -0.4, z); scene.add(m); return m; }
      hill(-28, -60, 22, 0.55, 0x9fd8c0); hill(2, -66, 26, 0.6, 0xa6dcc8); hill(30, -58, 22, 0.5, 0x9fd8c0);
      hill(-18, -38, 14, 0.42, 0x6fcf5a); hill(14, -36, 15, 0.38, 0x67c752); hill(-2, -44, 13, 0.4, 0x7ad663); hill(32, -34, 12, 0.4, 0x74d15c); hill(-36, -32, 12, 0.4, 0x6ccd57);

      /* ground */
      function riverX(z) { return 0.5 * Math.sin(z * 0.2 + 0.2) - 0.1; }
      function bankH(x, z) { var d = Math.abs(x - riverX(z)); return -0.7 * (1 - smooth(1.05, 1.95, d)); }
      function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }
      function pathD(x, z) { return Math.min(segDist(x, z, -5.2, -5.5, -3.4, -1.2), segDist(x, z, -3.4, -1.2, -2.0, 0), segDist(x, z, 2.0, 0, 3.6, -2.5), segDist(x, z, 3.6, -2.5, 5.5, -6.5)); }
      var gg = new THREE.PlaneGeometry(64, 46, 90, 60);
      gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -12);
      var gp = gg.attributes.position, gcol = [];
      var grassA = new THREE.Color(0x7bd341), grassB = new THREE.Color(0x58bb34), sandC = new THREE.Color(0xf2d290), pathC = new THREE.Color(0xeec27e);
      for (i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i), y = bankH(x, z);
        y += smooth(-10, -24, z) * (1.2 + Math.sin(x * 0.3) * 0.9);
        y += Math.sin(x * 0.7 + z * 0.4) * 0.05 * smooth(2.2, 3.5, Math.abs(x - riverX(z)));
        gp.setY(i, y);
        var d = Math.abs(x - riverX(z));
        tmp.copy(grassA).lerp(grassB, 0.5 + 0.5 * Math.sin(x * 0.45 + z * 0.6) * Math.cos(z * 0.3));
        var pd = pathD(x, z); if (pd < 0.7) tmp.lerp(pathC, 1 - smooth(0.4, 0.7, pd));
        if (d < 1.9) tmp.lerp(sandC, 1 - smooth(1.4, 1.9, d));
        gcol.push(tmp.r, tmp.g, tmp.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      var ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
      ground.receiveShadow = true; scene.add(ground);

      /* water with moving cartoon shine */
      var wc = document.createElement('canvas'); wc.width = 128; wc.height = 256;
      var wx2 = wc.getContext('2d');
      var wg = wx2.createLinearGradient(0, 0, 128, 0); wg.addColorStop(0, '#2a9be6'); wg.addColorStop(0.5, '#47bdf5'); wg.addColorStop(1, '#2a9be6');
      wx2.fillStyle = wg; wx2.fillRect(0, 0, 128, 256);
      wx2.fillStyle = 'rgba(255,255,255,0.75)';
      for (i = 0; i < 9; i++) { var ex = 20 + R() * 88, ey = R() * 256; wx2.beginPath(); wx2.ellipse(ex, ey, 9 + R() * 12, 2.4, 0, 0, Math.PI * 2); wx2.fill(); wx2.beginPath(); wx2.ellipse(ex, ey + 256 * (ey > 128 ? -1 : 1), 9 + R() * 12, 2.4, 0, 0, Math.PI * 2); wx2.fill(); }
      var waterTex = new THREE.CanvasTexture(wc); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; extraTex.push(waterTex);
      var WN = 50, WJ = 8, wpos = [], wuv = [], widx = [];
      for (var a = 0; a <= WN; a++) { var wz = -34 + a * (48 / WN); for (var b = 0; b <= WJ; b++) { wpos.push(riverX(wz) + (b / WJ - 0.5) * 2.6, -0.4, wz); wuv.push(b / WJ, a / WN * 9); } }
      for (a = 0; a < WN; a++) for (b = 0; b < WJ; b++) { var i0 = a * (WJ + 1) + b, i2 = i0 + WJ + 1; widx.push(i0, i2, i0 + 1, i0 + 1, i2, i2 + 1); }
      var wgeo = new THREE.BufferGeometry();
      wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); wgeo.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2)); wgeo.setIndex(widx); wgeo.computeVertexNormals();
      var water = new THREE.Mesh(wgeo, new THREE.MeshStandardMaterial({ map: waterTex, roughness: 0.2, metalness: 0.05, emissive: 0x0f5c94, emissiveIntensity: 0.15 }));
      water.receiveShadow = true; scene.add(water);

      /* props */
      var stoneCols = [0xb8b6d6, 0xa9a7c9, 0xc7c5e0];
      function stone(x, z, s, y) { var m = sph(1, stoneCols[Math.floor(R() * 3)], { roughness: 0.8 }, 16); m.scale.set(s, s * 0.6, s * 0.85); m.position.set(x, (y || 0), z); scene.add(m); return m; }
      function tree(x, z, s, c1, fruit) {
        var g = new THREE.Group();
        var tr = mesh(G('trunk', function () { return new THREE.CylinderGeometry(0.12, 0.18, 1.1, 12); }), 0xa0623a); tr.position.y = 0.55; g.add(tr);
        var cols = c1 || [0x5bc94a, 0x4db63f, 0x6ad656];
        [[0, 1.55, 0, 0.72], [0.5, 1.3, 0.1, 0.5], [-0.48, 1.3, 0.05, 0.52], [0.1, 2.05, 0.05, 0.5], [0.05, 1.35, 0.42, 0.45]].forEach(function (q, j) { var m = sph(q[3], cols[j % 3], { roughness: 0.75 }); m.position.set(q[0], q[1], q[2]); g.add(m); });
        if (fruit) [[0.35, 1.6, 0.55], [-0.4, 1.45, 0.45], [0.6, 1.9, 0.2], [-0.15, 2.0, 0.42]].forEach(function (q) { var f = sph(0.07, 0xff4d5e, { roughness: 0.3 }, 10); f.position.set(q[0], q[1], q[2]); g.add(f); });
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g;
      }
      function bush(x, z, s) { var g = new THREE.Group(); [[0, 0.25, 0, 0.38], [0.35, 0.18, 0, 0.28], [-0.33, 0.18, 0.05, 0.27]].forEach(function (q) { var m = sph(q[3], 0x55c247, { roughness: 0.8 }); m.position.set(q[0], q[1], q[2]); g.add(m); }); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); }
      function mushroom(x, z, s) {
        var g = new THREE.Group();
        var st = mesh(G('mst', function () { return new THREE.CylinderGeometry(0.07, 0.09, 0.22, 12); }), 0xfff6e6); st.position.y = 0.11; g.add(st);
        var cap = mesh(G('mcap', function () { return new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); }), 0xff4d5e, { roughness: 0.4 }); cap.position.y = 0.2; g.add(cap);
        [[0.07, 0.31, 0.08], [-0.08, 0.3, 0.07], [0, 0.35, -0.06]].forEach(function (q) { var d = sph(0.03, 0xffffff, null, 8); d.position.set(q[0], q[1], q[2]); g.add(d); });
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
      }
      function flower(x, z, c) {
        var g = new THREE.Group();
        var stem = mesh(G('stem', function () { return new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6); }), 0x3d9a35, null, true); stem.position.y = 0.12; g.add(stem);
        for (var q = 0; q < 5; q++) { var p = sph(0.05, c, { roughness: 0.5 }, 10); var an = q / 5 * Math.PI * 2; p.position.set(Math.cos(an) * 0.06, 0.26, Math.sin(an) * 0.06); p.castShadow = false; g.add(p); }
        var ctr = sph(0.045, 0xffd23f, null, 10); ctr.position.y = 0.27; g.add(ctr);
        g.position.set(x, 0, z); scene.add(g);
      }
      tree(-5.4, -2.6, 1.0, null, true); tree(5.3, -3.0, 1.05); tree(-7.3, -6.0, 1.3); tree(7.2, -7.2, 1.3, [0x7ccf3f, 0x6bbd35, 0x8ddc4f]); tree(-1.9, -10, 1.2); tree(2.4, -12, 1.3, null, true);
      tree(-9.5, -1, 1.1, [0x7ccf3f, 0x6bbd35, 0x8ddc4f]); tree(4.9, 2.4, 0.95, null, true); tree(-6.6, 3.0, 1.0); tree(9, -2.5, 1.2);
      bush(-3.2, -2.6, 0.9); bush(3.4, -1.7, 0.8); bush(-4.6, 1.6, 0.8); bush(6.4, 0.6, 0.9);
      stone(-1.65, 1.5, 0.3, -0.3); stone(-1.85, 2.2, 0.2, -0.28); stone(1.6, -1.2, 0.32, -0.3); stone(1.5, 2.8, 0.25, -0.35); stone(-3.1, 3.0, 0.28, 0.05); stone(3.3, 3.5, 0.36, 0.05); stone(-1.45, -3.6, 0.22, -0.25);
      mushroom(-2.9, 1.3, 1.1); mushroom(-3.2, 1.55, 0.75); mushroom(3.4, 2.0, 0.9);
      var fcols = [0xff7eb6, 0xffffff, 0xb08cff, 0xff8a5c];
      for (i = 0; i < 18; i++) { var fx = (R() - 0.5) * 13, fz = 4.5 - R() * 10; if (Math.abs(fx - riverX(fz)) < 2.3 || pathD(fx, fz) < 0.75) continue; flower(fx, fz, fcols[i % 4]); }

      /* house */
      function house(x, z, rot, wall, roof, s) {
        var g = new THREE.Group();
        var base = mesh(new THREE.BoxGeometry(2.0, 1.35, 1.6), wall); base.position.y = 0.68; g.add(base);
        var trim = mesh(new THREE.BoxGeometry(2.1, 0.2, 1.7), 0xd9c3a5); trim.position.y = 0.1; g.add(trim);
        var rg = new THREE.ConeGeometry(1.75, 1.2, 4, 1); rg.rotateY(Math.PI / 4);
        var rf = mesh(rg, roof, { roughness: 0.5 }); rf.scale.set(1.0, 1, 0.82); rf.position.y = 1.95; g.add(rf);
        var ch = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.6, 14), 0xd9c3a5); ch.position.set(0.55, 2.3, -0.2); g.add(ch);
        var dr = mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), 0x9a5a32); dr.position.set(-0.45, 0.42, 0.8); g.add(dr);
        var arch = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16, 1, false, -Math.PI / 2, Math.PI), 0x9a5a32); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2; arch.position.set(-0.45, 0.72, 0.8); arch.rotation.set(Math.PI / 2, 0, 0); g.add(arch);
        var knob = sph(0.04, 0xffd23f, null, 8); knob.position.set(-0.3, 0.42, 0.86); g.add(knob);
        var win = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), 0xaee6ff, { emissive: 0x66b8e0, emissiveIntensity: 0.35, roughness: 0.2 }); win.rotation.x = Math.PI / 2; win.position.set(0.45, 0.8, 0.81); g.add(win);
        var fr = mesh(new THREE.TorusGeometry(0.25, 0.05, 8, 24), 0xffffff); fr.position.set(0.45, 0.8, 0.84); g.add(fr);
        var fb = mesh(new THREE.BoxGeometry(0.6, 0.14, 0.16), 0x9a5a32); fb.position.set(0.45, 0.45, 0.88); g.add(fb);
        [0xff7eb6, 0xffd23f, 0xff7eb6].forEach(function (c, q) { var f = sph(0.07, c, null, 10); f.position.set(0.28 + q * 0.17, 0.56, 0.9); g.add(f); });
        g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s); scene.add(g); return g;
      }
      var houseA = house(-4.3, -4.3, 0.42, 0xfff3dc, 0xff6b5b, 1.05);
      house(4.8, -7.0, -0.5, 0xfff0d6, 0x5b8cff, 0.95);
      var smoke = [];
      for (i = 0; i < 4; i++) { var smk = sph(0.2, 0xffffff, { transparent: true, opacity: 0.9, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.3 }); smk.castShadow = false; smk.material = smk.material.clone(); scene.add(smk); smoke.push(smk); }
      var chim = new THREE.Vector3(0.55, 2.65, -0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42).multiplyScalar(1.05).add(new THREE.Vector3(-4.3, 0, -4.3));

      // fence
      for (i = 0; i < 5; i++) { var fp = mesh(G('fp', function () { return new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10); }), 0xffffff); fp.position.set(-6.9 + i * 0.6, 0.28, 0.6 + i * 0.12); scene.add(fp); var fcap = sph(0.08, 0xffffff, null, 10); fcap.position.set(-6.9 + i * 0.6, 0.57, 0.6 + i * 0.12); scene.add(fcap); }
      var frail = mesh(new THREE.BoxGeometry(2.6, 0.08, 0.05), 0xffffff); frail.position.set(-5.7, 0.4, 0.84); frail.rotation.y = -0.2; scene.add(frail);

      /* bridge */
      var bridge = new THREE.Group(); scene.add(bridge);
      var DECK = 0.12, PL = 0.3, GAP = 0.05, NPL = 9, MISSING = 4, span = NPL * (PL + GAP);
      [-0.42, 0.42].forEach(function (z) { var bm = mesh(new THREE.BoxGeometry(span + 0.5, 0.16, 0.16), 0x8a4f2a); bm.position.set(0, DECK - 0.12, z); bridge.add(bm); });
      var plankG = new THREE.BoxGeometry(PL, 0.09, 1.15);
      var pcs = [0xd99254, 0xcf8749, 0xe39d5e];
      for (i = 0; i < NPL; i++) { if (i === MISSING) continue; var pl = mesh(plankG, pcs[i % 3], { roughness: 0.7 }); pl.position.set(-span / 2 + PL / 2 + i * (PL + GAP), DECK + Math.sin(i * 1.7) * 0.01, Math.sin(i * 2.3) * 0.03); pl.rotation.y = Math.sin(i * 3.1) * 0.03; bridge.add(pl); }
      var postXs = [-span / 2 - 0.1, span / 2 + 0.1], tops = [];
      postXs.forEach(function (x) { [-0.6, 0.6].forEach(function (z) { var p = mesh(G('post', function () { return new THREE.CylinderGeometry(0.09, 0.1, 1.2, 14); }), 0x9a5a32); p.position.set(x, 0.2, z); bridge.add(p); var c = sph(0.12, 0xffc23d, { roughness: 0.4 }, 14); c.position.set(x, 0.85, z); bridge.add(c); tops.push(new THREE.Vector3(x, 0.78, z)); }); });
      [-0.6, 0.6].forEach(function (z) {
        var c = new THREE.CatmullRomCurve3([new THREE.Vector3(postXs[0], 0.78, z), new THREE.Vector3(-span / 4, 0.62, z), new THREE.Vector3(0, 0.58, z), new THREE.Vector3(span / 4, 0.62, z), new THREE.Vector3(postXs[1], 0.78, z)]);
        bridge.add(mesh(new THREE.TubeGeometry(c, 30, 0.04, 8, false), 0xf3d7a6, { roughness: 0.9 }));
      });
      bridge.position.set(riverX(0) + 0.1, 0, 0);
      var gapX = bridge.position.x - span / 2 + PL / 2 + MISSING * (PL + GAP);

      var ghost = new THREE.Mesh(new THREE.BoxGeometry(PL + 0.05, 0.1, 1.2), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.5, depthWrite: false }));
      ghost.position.set(gapX, DECK, 0); scene.add(ghost);
      var newPlank = mesh(plankG, 0xf0ad6a, { emissive: 0xffd36b, emissiveIntensity: 0, roughness: 0.6 }); newPlank.position.set(gapX, DECK, 0); scene.add(newPlank);
      var plankGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1a0, transparent: true, depthWrite: false, opacity: 0 })); plankGlow.scale.set(2.4, 2.4, 1); scene.add(plankGlow);

      /* characters */
      var SKIN = 0xffcfa8;
      function makeEye(g, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z);
        var w = sph(r, 0xffffff, { roughness: 0.25 }, 16); w.scale.set(0.85, 1.05, 0.5); w.castShadow = false; e.add(w);
        var p = sph(r * 0.66, 0x2a1d4f, { roughness: 0.2 }, 14); p.scale.set(1, 1.1, 0.5); p.position.set(0, -r * 0.08, r * 0.3); p.castShadow = false; e.add(p);
        var hl = sph(r * 0.22, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }, 8); hl.position.set(r * 0.22, r * 0.25, r * 0.55); hl.castShadow = false; e.add(hl);
        var hl2 = sph(r * 0.1, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }, 6); hl2.position.set(-r * 0.2, -r * 0.3, r * 0.55); hl2.castShadow = false; e.add(hl2);
        g.add(e); return e;
      }
      function smileMesh(r, tube, col) { return mesh(new THREE.TorusGeometry(r, tube, 8, 16, Math.PI), col, { roughness: 0.4 }, true); }

      // hero
      var hero = new THREE.Group(), hSquash = new THREE.Group(), hBody = new THREE.Group(); hero.add(hSquash); hSquash.add(hBody);
      var hLegL = capsule(0.085, 0.2, 0x26407a), hLegR = capsule(0.085, 0.2, 0x26407a);
      hLegL.position.set(-0.11, 0.36, 0); hLegR.position.set(0.11, 0.36, 0);
      [hLegL, hLegR].forEach(function (l) { var sh = sph(0.12, 0xff5a4e, { roughness: 0.4 }, 14); sh.scale.set(0.9, 0.6, 1.3); sh.position.set(0, -0.27, 0.05); l.add(sh); var sole = sph(0.12, 0xffffff, null, 14); sole.scale.set(0.92, 0.25, 1.32); sole.position.set(0, -0.31, 0.05); l.add(sole); hBody.add(l); });
      var torso = sph(0.27, 0x3d7bff, { roughness: 0.55 }); torso.scale.set(1, 1.05, 0.88); torso.position.y = 0.58; hBody.add(torso);
      var shorts = sph(0.255, 0x26407a); shorts.scale.set(1.02, 0.6, 0.9); shorts.position.y = 0.43; hBody.add(shorts);
      var collar = mesh(new THREE.TorusGeometry(0.13, 0.04, 8, 18), 0xffffff, null, true); collar.rotation.x = Math.PI / 2; collar.position.y = 0.82; hBody.add(collar);
      var star = sph(0.05, 0xffd23f, { emissive: 0xffb800, emissiveIntensity: 0.3 }, 10); star.scale.z = 0.4; star.position.set(0.1, 0.66, 0.24); hBody.add(star);
      var pack = sph(0.26, 0xff9a2e, { roughness: 0.5 }); pack.scale.set(0.95, 1.1, 0.6); pack.position.set(0, 0.62, -0.27); hBody.add(pack);
      var flap = sph(0.24, 0xf07d14, { roughness: 0.5 }); flap.scale.set(0.98, 0.55, 0.62); flap.position.set(0, 0.78, -0.28); hBody.add(flap);
      var pk = sph(0.12, 0xf07d14); pk.scale.set(1.2, 0.8, 0.5); pk.position.set(0, 0.52, -0.42); hBody.add(pk);
      [-0.13, 0.13].forEach(function (x) { var st = mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 16, Math.PI), 0xf07d14, null, true); st.rotation.y = Math.PI / 2; st.position.set(x, 0.6, -0.02); hBody.add(st); });
      var hArmL = capsule(0.065, 0.24, 0x3d7bff), hArmR = capsule(0.065, 0.24, 0x3d7bff);
      hArmL.position.set(-0.29, 0.74, 0); hArmR.position.set(0.29, 0.74, 0);
      [hArmL, hArmR].forEach(function (a) { var hd = sph(0.085, SKIN, null, 14); hd.position.y = -0.3; a.add(hd); hBody.add(a); });
      var hHead = new THREE.Group(); hHead.position.y = 1.14; hBody.add(hHead);
      var hd0 = sph(0.4, SKIN, { roughness: 0.6 }, 28); hd0.scale.set(1.05, 0.98, 1); hHead.add(hd0);
      [-1, 1].forEach(function (sg) { var ear = sph(0.08, 0xffbf94, null, 12); ear.position.set(sg * 0.41, -0.02, 0); hHead.add(ear); });
      var hair = mesh(new THREE.SphereGeometry(0.43, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x8a4b25, { roughness: 0.55 }); hair.rotation.x = -0.35; hair.position.set(0, 0.02, -0.03); hair.scale.set(1.04, 1, 1); hHead.add(hair);
      var fringe = sph(0.2, 0x8a4b25, { roughness: 0.55 }); fringe.scale.set(1.5, 0.55, 0.8); fringe.position.set(-0.08, 0.27, 0.27); fringe.rotation.z = 0.3; hHead.add(fringe);
      var tuft = mesh(new THREE.ConeGeometry(0.09, 0.28, 12), 0x8a4b25, { roughness: 0.55 }); tuft.position.set(0.05, 0.47, -0.02); tuft.rotation.z = -0.5; hHead.add(tuft);
      var hEyeL = makeEye(hHead, -0.145, 0.0, 0.33, 0.125), hEyeR = makeEye(hHead, 0.145, 0.0, 0.33, 0.125);
      [-0.15, 0.15].forEach(function (x) { var bw = sph(0.06, 0x6b3a1c, null, 8); bw.scale.set(1.2, 0.3, 0.4); bw.position.set(x, 0.17, 0.36); bw.rotation.z = -x * 1.2; hHead.add(bw); });
      [-0.25, 0.25].forEach(function (x) { var ck = sph(0.07, 0xff8f8f, { transparent: true, opacity: 0.75 }, 10); ck.scale.set(1, 0.6, 0.3); ck.position.set(x, -0.1, 0.31); ck.castShadow = false; hHead.add(ck); });
      var hMouth = smileMesh(0.07, 0.018, 0xb0413a); hMouth.rotation.z = Math.PI; hMouth.position.set(0, -0.14, 0.37); hHead.add(hMouth);
      var hNose = sph(0.04, 0xffb98f, null, 10); hNose.position.set(0, -0.05, 0.39); hHead.add(hNose);
      scene.add(hero);

      // Mestre Tomé
      var tome = new THREE.Group(), tBody = new THREE.Group(); tome.add(tBody);
      var tLegL = capsule(0.1, 0.22, 0x6b5a8a), tLegR = capsule(0.1, 0.22, 0x6b5a8a);
      tLegL.position.set(-0.14, 0.4, 0); tLegR.position.set(0.14, 0.4, 0);
      [tLegL, tLegR].forEach(function (l) { var bt = sph(0.14, 0x6a3c1f, { roughness: 0.5 }, 14); bt.scale.set(0.95, 0.6, 1.3); bt.position.set(0, -0.29, 0.05); l.add(bt); tBody.add(l); });
      var tT = sph(0.38, 0xe2574c, { roughness: 0.6 }); tT.scale.set(1, 1.0, 0.88); tT.position.y = 0.72; tBody.add(tT);
      var apron = mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.62, 20, 1, true, -1.0, 2.0), 0x9a5a32, { side: THREE.DoubleSide, roughness: 0.8 }); apron.position.set(0, 0.62, 0.02); tBody.add(apron);
      var apTop = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.04), 0x9a5a32); apTop.position.set(0, 0.98, 0.31); apTop.rotation.x = -0.35; tBody.add(apTop);
      var pocket = mesh(new THREE.CylinderGeometry(0.385, 0.39, 0.15, 16, 1, true, -0.4, 0.8), 0x7d4625, { side: THREE.DoubleSide }); pocket.position.set(0, 0.55, 0.03); tBody.add(pocket);
      var pencil = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), 0xffd23f); pencil.position.set(0.1, 0.65, 0.39); pencil.rotation.z = 0.25; tBody.add(pencil);
      var tArmL = capsule(0.08, 0.26, 0xe2574c), tArmR = capsule(0.08, 0.26, 0xe2574c);
      tArmL.position.set(-0.4, 0.92, 0); tArmR.position.set(0.4, 0.92, 0);
      [tArmL, tArmR].forEach(function (a) { var fa = sph(0.085, SKIN, null, 12); fa.position.y = -0.22; fa.scale.y = 1.4; a.add(fa); var hd = sph(0.1, SKIN, null, 14); hd.position.y = -0.34; a.add(hd); tBody.add(a); });
      var tHead = new THREE.Group(); tHead.position.y = 1.32; tBody.add(tHead);
      var th0 = sph(0.36, SKIN, null, 26); tHead.add(th0);
      [-1, 1].forEach(function (sg) { var ear = sph(0.075, 0xffbf94, null, 12); ear.position.set(sg * 0.36, 0, 0); tHead.add(ear); });
      var beardParts = [[0, -0.2, 0.2, 0.25], [-0.17, -0.12, 0.2, 0.17], [0.17, -0.12, 0.2, 0.17], [0, -0.36, 0.14, 0.17], [-0.24, 0.0, 0.12, 0.12], [0.24, 0.0, 0.12, 0.12]];
      beardParts.forEach(function (q) { var b2 = sph(q[3], 0xfafafa, { roughness: 0.9 }, 16); b2.position.set(q[0], q[1], q[2]); tHead.add(b2); });
      [-1, 1].forEach(function (sg) { var mu = sph(0.1, 0xffffff, { roughness: 0.9 }, 14); mu.scale.set(1.3, 0.6, 0.7); mu.position.set(sg * 0.09, -0.07, 0.34); mu.rotation.z = sg * 0.3; tHead.add(mu); });
      var tNose = sph(0.075, 0xff9f86, { roughness: 0.4 }, 14); tNose.position.set(0, 0.0, 0.37); tHead.add(tNose);
      var tEyeL = makeEye(tHead, -0.12, 0.06, 0.31, 0.08), tEyeR = makeEye(tHead, 0.12, 0.06, 0.31, 0.08);
      [-0.13, 0.13].forEach(function (x) { var bw = sph(0.07, 0xffffff, { roughness: 0.9 }, 10); bw.scale.set(1.3, 0.55, 0.6); bw.position.set(x, 0.155, 0.33); bw.rotation.z = -x * 1.5; tHead.add(bw); });
      var hat = mesh(new THREE.SphereGeometry(0.39, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc81f, { roughness: 0.35 }); hat.position.y = 0.19; tHead.add(hat);
      var brim = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.05, 28), 0xffb400, { roughness: 0.35 }); brim.position.set(0, 0.2, 0.06); tHead.add(brim);
      var ridge = mesh(new THREE.TorusGeometry(0.39, 0.035, 8, 24, Math.PI), 0xffb400, { roughness: 0.35 }); ridge.rotation.y = Math.PI / 2; ridge.position.y = 0.2; tHead.add(ridge);
      tome.position.set(2.1, 0, 0.95); tome.rotation.y = -0.6; scene.add(tome);

      /* FX: stars + puffs */
      var starShape = new THREE.Shape();
      for (i = 0; i < 10; i++) { var rr = i % 2 ? 0.045 : 0.11, an = i / 10 * Math.PI * 2 + Math.PI / 2; if (i === 0) starShape.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else starShape.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      var starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 }); starGeo.center();
      var stars = [];
      var starCols = [0xffd23f, 0xff7eb6, 0x7fe0ff, 0xb08cff];
      for (i = 0; i < 10; i++) { var stm = new THREE.Mesh(starGeo, M(starCols[i % 4], { emissive: starCols[i % 4], emissiveIntensity: 0.55, roughness: 0.3 })); stm.userData = { a: i / 10 * Math.PI * 2 + 0.3, up: 0.7 + (i % 3) * 0.35, r: 0.7 + (i % 4) * 0.18 }; stm.visible = false; scene.add(stm); stars.push(stm); }
      var puffs = [];
      for (i = 0; i < 7; i++) { var pf = sph(0.16, 0xffffff, { transparent: true, opacity: 0.9, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 }); pf.material = pf.material.clone(); pf.castShadow = false; pf.userData = { a: i / 7 * Math.PI * 2 }; pf.visible = false; scene.add(pf); puffs.push(pf); }

      /* HUD */
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; host.appendChild(styleEl);
      var iris = document.createElement('div'); iris.className = 'cartoon-iris'; host.appendChild(iris);
      var hud = document.createElement('div'); hud.className = 'cartoon-hud';
      hud.innerHTML =
        '<div class="cartoon-top"><div class="cartoon-ava">' + AVATAR + '<span class="cartoon-lv">4</span></div><div class="cartoon-info">' +
        '<div class="cartoon-lvl">Nível 4 · <span>Explorador</span></div><div class="cartoon-bar"><div class="cartoon-fill"></div><div class="cartoon-xpn">620 / 1000 XP</div></div></div></div>' +
        '<div class="cartoon-quest"><i>' + IC_QUEST + '</i>Missão: consertar a ponte da vila</div>' +
        '<div class="cartoon-bub"><div class="cartoon-name">Mestre Tomé</div><div class="cartoon-say">A viga precisa se apoiar dos dois lados!</div></div>' +
        '<div class="cartoon-xp">+50 XP</div>' +
        '<div class="cartoon-btns">' +
        '<div class="cartoon-btn"><i style="background:linear-gradient(180deg,#ffb15c,#ff7a2e);box-shadow:0 .3em 0 #d9561a,0 .5em 1em rgba(0,0,0,.2)">' + IC_BUILD + '</i><b>Construir</b></div>' +
        '<div class="cartoon-btn"><i style="background:linear-gradient(180deg,#b897ff,#8a5cf6);box-shadow:0 .3em 0 #5b34c0,0 .5em 1em rgba(0,0,0,.2)">' + IC_BAG + '</i><b>Mochila</b></div>' +
        '<div class="cartoon-btn"><i style="background:linear-gradient(180deg,#7ee07a,#38b25a);box-shadow:0 .3em 0 #23843f,0 .5em 1em rgba(0,0,0,.2)">' + IC_MAP + '</i><b>Mapa</b></div></div>';
      host.appendChild(hud);
      var elFill = hud.querySelector('.cartoon-fill'), elXpn = hud.querySelector('.cartoon-xpn'), elBub = hud.querySelector('.cartoon-bub'), elXp = hud.querySelector('.cartoon-xp'), elQuest = hud.querySelector('.cartoon-quest');

      /* layout */
      var CAM = new THREE.Vector3(0, 3.3, 9.4), LOOK = new THREE.Vector3(0.1, 1.0, 0);
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        var dist = CAM.distanceTo(LOOK);
        camera.fov = clamp(2 * Math.atan(3.35 / dist / camera.aspect) * 180 / Math.PI, 34, 78);
        camera.setViewOffset(W, H, 0, -H * 0.1, W, H);
        camera.updateProjectionMatrix();
        hud.style.fontSize = (15 * clamp(Math.min(W / 390, H / 720), 0.78, 1.5)) + 'px';
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);

      var HERO_A = new THREE.Vector3(-3.9, 0, -1.9), HERO_B = new THREE.Vector3(-1.95, 0, 0.5);
      var v3 = new THREE.Vector3();
      function proj(v) { v3.copy(v).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }

      function update(t, wall) {
        var s = t >= 3.3 ? 0 : t;
        // camera
        var cu = reduce ? 0 : smooth(0, 2.9, s);
        camera.position.set(CAM.x - 0.35 + 0.5 * cu, CAM.y + (reduce ? 0 : 0.08 * Math.sin(wall * 0.9)), CAM.z - 0.8 * cu);
        camera.lookAt(LOOK.x - 0.2 + 0.25 * cu, LOOK.y, LOOK.z);

        // hero walk with squash & stretch
        var wp = clamp(s / 1.2, 0, 1), ep = 1 - (1 - wp) * (1 - wp);
        hero.position.lerpVectors(HERO_A, HERO_B, ep);
        var walk = s < 1.2 ? 1 - smooth(0.95, 1.2, s) : 0;
        var ph = s * Math.PI * 2 * 2.1;
        var sw = Math.sin(ph) * 0.7 * walk;
        hLegL.rotation.x = sw; hLegR.rotation.x = -sw;
        hArmL.rotation.x = -sw; hArmR.rotation.x = sw;
        hArmL.rotation.z = -0.25; hArmR.rotation.z = 0.25;
        var bounce = Math.abs(Math.cos(ph));
        var landSq = smooth(1.1, 1.22, s) * (1 - smooth(1.22, 1.5, s));
        var sy = 1 + (bounce - 0.5) * 0.12 * walk - landSq * 0.12 + Math.sin(wall * 3.2) * 0.012;
        hSquash.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
        hBody.position.y = bounce * 0.09 * walk;
        hBody.rotation.z = Math.sin(ph) * 0.06 * walk;
        hBody.rotation.x = 0.08 * walk;
        hero.rotation.y = lerp(0.85, 0.6, smooth(1.1, 1.6, s));
        hHead.rotation.y = 0.35 * smooth(0.85, 1.3, s) * (1 - smooth(2.1, 2.5, s));
        hHead.rotation.z = Math.sin(ph) * 0.05 * walk + 0.12 * smooth(1.0, 1.3, s) * (1 - smooth(2.1, 2.4, s));
        var cheer = smooth(2.3, 2.45, s) * (1 - smooth(2.95, 3.15, s));
        hArmR.rotation.x -= cheer * 2.7; hArmR.rotation.z += cheer * 0.3 + Math.sin(s * 22) * 0.15 * cheer;
        hArmL.rotation.x -= cheer * 2.7; hArmL.rotation.z -= cheer * 0.3 + Math.sin(s * 22) * 0.15 * cheer;
        var jump = s > 2.32 && s < 2.72 ? Math.sin((s - 2.32) / 0.4 * Math.PI) : 0;
        hBody.position.y += jump * 0.28;
        if (jump > 0) { var js = 1 + jump * 0.1; hSquash.scale.set(1 / Math.sqrt(js), js, 1 / Math.sqrt(js)); }
        hMouth.scale.set(1 + cheer * 0.4, 1 + cheer * 0.9, 1);
        // blinks
        var bp = (wall % 2.9), blink = bp < 0.13 ? Math.abs(Math.cos(bp / 0.13 * Math.PI)) : 1;
        hEyeL.scale.y = hEyeR.scale.y = Math.max(0.08, blink);
        var bp2 = ((wall + 1.3) % 3.4), blink2 = bp2 < 0.13 ? Math.abs(Math.cos(bp2 / 0.13 * Math.PI)) : 1;
        tEyeL.scale.y = tEyeR.scale.y = Math.max(0.08, blink2);

        // mentor gestures
        var talk = smooth(0.7, 0.92, s) * (1 - smooth(2.15, 2.4, s));
        tBody.position.y = Math.abs(Math.sin(wall * 2.1)) * 0.015;
        tBody.rotation.z = Math.sin(s * 6) * 0.04 * talk;
        tArmL.rotation.x = -talk * (1.5 + Math.sin(s * 9) * 0.3);
        tArmL.rotation.z = -0.2 - talk * (0.5 + Math.sin(s * 9 + 1) * 0.25);
        tArmR.rotation.x = -talk * 0.6; tArmR.rotation.z = 0.25 + talk * 0.5;
        var thumbs = smooth(2.32, 2.5, s) * (1 - smooth(2.95, 3.15, s));
        tArmR.rotation.x -= thumbs * 2.4; tArmR.rotation.z += thumbs * 0.2 + Math.sin(s * 18) * 0.2 * thumbs;
        tHead.rotation.x = Math.sin(s * 10) * 0.07 * talk + thumbs * Math.sin((s - 2.32) * 14) * 0.1;
        tHead.rotation.z = 0.1 * talk;
        var tsq = 1 + Math.sin(s * 10) * 0.03 * talk + thumbs * 0.04 * Math.sin((s - 2.32) * 14);
        tBody.scale.set(1 / Math.sqrt(tsq), tsq, 1 / Math.sqrt(tsq));

        // plank
        ghost.visible = s < 1.75;
        ghost.material.opacity = (0.3 + 0.35 * (0.5 + 0.5 * Math.sin(wall * 7))) * (1 - smooth(1.5, 1.75, s));
        newPlank.visible = s >= 1.5;
        var land = clamp((s - 1.55) / 0.7, 0, 1);
        newPlank.position.y = DECK + (1 - easeOutBounce(land)) * 2.4;
        newPlank.rotation.y = (1 - smooth(1.55, 2.1, s)) * 3.2;
        newPlank.rotation.z = (1 - smooth(1.55, 2.1, s)) * 0.3;
        var glow = smooth(1.5, 1.75, s) * (1 - smooth(2.4, 2.95, s));
        newPlank.material.emissiveIntensity = glow * 0.6;
        plankGlow.position.copy(newPlank.position); plankGlow.material.opacity = Math.max(glow * 0.8, s < 1.6 ? (0.35 + 0.25 * Math.sin(wall * 7)) * (1 - smooth(1.4, 1.6, s)) : 0);
        if (s < 1.5) plankGlow.position.set(gapX, DECK + 0.1, 0);
        var sq = s > 2.08 && s < 2.3 ? Math.sin((s - 2.08) / 0.22 * Math.PI) : 0;
        newPlank.scale.set(1 + sq * 0.15, 1 - sq * 0.35, 1 + sq * 0.05);

        var fx = clamp((s - 2.1) / 0.75, 0, 1), fxOn = s > 2.1 && s < 2.85;
        stars.forEach(function (p) {
          p.visible = fxOn; if (!fxOn) return;
          var u = p.userData, e = 1 - Math.pow(1 - fx, 3);
          p.position.set(gapX + Math.cos(u.a) * u.r * e * 0.8, DECK + 0.2 + u.up * e - fx * fx * 0.6, Math.sin(u.a) * u.r * e * 0.6 + 0.3);
          p.rotation.z = wall * 5 + u.a; p.rotation.y = Math.sin(wall * 3 + u.a) * 0.6;
          p.scale.setScalar(Math.sin(Math.min(1, fx * 1.4) * Math.PI) * 1.6 + 0.01);
        });
        puffs.forEach(function (p) {
          p.visible = s > 2.08 && s < 2.75; if (!p.visible) return;
          var k = clamp((s - 2.08) / 0.65, 0, 1);
          p.position.set(gapX + Math.cos(p.userData.a) * 0.2 * (1 + k * 2.5), DECK + 0.05 + k * 0.2, Math.sin(p.userData.a) * 0.6 * (1 + k * 0.9));
          p.scale.setScalar(0.6 + k * 1.2); p.material.opacity = 0.9 * (1 - k * k);
        });

        // environment
        waterTex.offset.y = -wall * 0.35;
        waterTex.offset.x = Math.sin(wall * 1.2) * 0.02;
        clouds.forEach(function (c, j) { c.g.position.x = c.x + ((wall * (0.3 + j * 0.07)) % 50); c.g.position.y += Math.sin(wall + j) * 0.002; });
        smoke.forEach(function (p, j) { var k = ((wall * 0.4 + j / 4) % 1); p.position.set(chim.x + k * 0.5 + Math.sin(k * 6) * 0.1, chim.y + k * 1.6, chim.z); p.scale.setScalar(0.5 + k * 1.3); p.material.opacity = 0.85 * (1 - k); });

        // HUD
        var xpK = smooth(2.4, 2.85, s);
        elFill.style.width = (62 + 5 * xpK) + '%';
        elXpn.textContent = Math.round(620 + 50 * xpK) + ' / 1000 XP';
        var bIn = clamp((s - 0.8) / 0.32, 0, 1), bOut = smooth(2.75, 2.98, s);
        var bs = (bIn > 0 ? easeOutBack(bIn) : 0) * (1 - bOut * 0.4);
        var head = proj(v3.set(tome.position.x, 2.15, tome.position.z));
        var bw = elBub.offsetWidth || 200, bh = elBub.offsetHeight || 80;
        var bl = clamp(head.x - bw * 0.74, 12, W - bw - 12);
        var hostTop = host.getBoundingClientRect().top;
        var bt = Math.max(head.y - bh - 20, elQuest.getBoundingClientRect().bottom - hostTop + 22);
        elBub.style.setProperty('--tx', clamp(head.x - bl, 24, bw - 24) + 'px');
        elBub.style.transform = 'translate(' + bl.toFixed(1) + 'px,' + (bt + Math.sin(wall * 3) * 2).toFixed(1) + 'px) scale(' + Math.max(bs, 0.001).toFixed(3) + ')';
        elBub.style.opacity = Math.min(1, bIn * 3) * (1 - bOut);
        var xk = clamp((s - 2.35) / 0.7, 0, 1);
        var xpPos = proj(v3.set(gapX, 1.1, 0));
        elXp.style.opacity = s > 2.35 ? (xk < 0.12 ? xk / 0.12 : 1 - smooth(0.62, 1, xk)) : 0;
        elXp.style.left = xpPos.x + 'px';
        elXp.style.top = (xpPos.y - 80 * (1 - Math.pow(1 - xk, 2))) + 'px';
        elXp.style.transform = 'translate(-50%,-50%) scale(' + (xk < 0.25 ? easeOutBack(xk / 0.25) * 1.1 : 1.1 - (xk - 0.25) * 0.2) + ') rotate(' + (Math.sin(xk * 12) * 4 * (1 - xk)) + 'deg)';

        // iris wipe (closes on the hero, reopens)
        var ik = t < 3.3 ? smooth(3.0, 3.3, t) : 1 - smooth(3.3, 3.6, t);
        if (ik <= 0.001) { iris.style.opacity = 0; }
        else {
          var hp = proj(v3.set(hero.position.x, 1.0, hero.position.z));
          var maxR = Math.sqrt(W * W + H * H);
          var rr2 = maxR * (1 - ik);
          iris.style.opacity = 1;
          iris.style.background = 'radial-gradient(circle at ' + hp.x.toFixed(0) + 'px ' + hp.y.toFixed(0) + 'px, transparent ' + rr2.toFixed(0) + 'px, #3a2a5c ' + (rr2 + 2).toFixed(0) + 'px)';
        }
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
          extraTex.forEach(function (tx) { tx.dispose(); });
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
