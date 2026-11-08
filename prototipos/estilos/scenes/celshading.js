/* Estilo CEL-SHADING — cena "a ponte da vila" (loop de 3,6 s). three.js r128 global. */
(function () {
  window.SCENES = window.SCENES || {};
  var ID = 'celshading';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOutBack(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var INK = '#16101f';
  var DOTS = 'radial-gradient(circle,rgba(22,16,31,.13) 22%,transparent 24%) 0 0/.55em .55em';
  var CSS = '' +
    '.celshading-hud{position:absolute;inset:0;pointer-events:none;font-family:"Lilita One","Fredoka",system-ui,sans-serif;color:' + INK + ';-webkit-font-smoothing:antialiased;letter-spacing:.02em}' +
    '.celshading-wipe{position:absolute;top:-10%;bottom:-10%;left:0;width:220%;background:' + DOTS + ',#ffd23a;border-left:.35em solid ' + INK + ';border-right:.35em solid ' + INK + ';transform:translateX(200%) skewX(-14deg);display:grid;place-items:center}' +
    '.celshading-wipe span{font-size:2.6em;color:#fff;-webkit-text-stroke:.07em ' + INK + ';paint-order:stroke fill;transform:skewX(14deg) rotate(-6deg);text-shadow:.08em .08em 0 ' + INK + '}' +
    '.celshading-top{position:absolute;left:.8em;right:.8em;top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:.7em;padding:.5em .8em .55em .55em;background:' + DOTS + ',#fff;border:.2em solid ' + INK + ';border-radius:.35em;box-shadow:.3em .3em 0 ' + INK + ';transform:rotate(-.6deg)}' +
    '.celshading-ava{flex:none;width:3.3em;height:3.3em;border:.2em solid ' + INK + ';border-radius:.3em;background:#3fb6ff;overflow:hidden;transform:rotate(-3deg);box-shadow:.15em .15em 0 ' + INK + '}' +
    '.celshading-ava svg{display:block;width:100%;height:100%}' +
    '.celshading-info{flex:1;min-width:0}' +
    '.celshading-lvl{font-size:1.12em;line-height:1;white-space:nowrap;display:flex;align-items:center;gap:.35em}' +
    '.celshading-lvl b{font-weight:400;background:#ff4b5c;color:#fff;padding:.12em .4em .08em;border:.12em solid ' + INK + ';border-radius:.2em;transform:rotate(-4deg);display:inline-block}' +
    '.celshading-bar{position:relative;margin-top:.45em;height:1.05em;border:.17em solid ' + INK + ';border-radius:.25em;background:#fff;overflow:hidden}' +
    '.celshading-fill{position:absolute;left:0;top:0;bottom:0;width:62%;background:repeating-linear-gradient(-45deg,#ffd23a 0 .45em,#ffbf00 .45em .9em);border-right:.17em solid ' + INK + '}' +
    '.celshading-xpn{position:absolute;inset:0;display:grid;place-items:center;font-size:.72em;color:' + INK + ';font-variant-numeric:tabular-nums}' +
    '.celshading-quest{position:absolute;left:.8em;top:calc(env(safe-area-inset-top,0px) + 38px + 5.4em);display:flex;align-items:center;gap:.5em;padding:.32em .8em .32em .35em;background:#ff4b5c;color:#fff;border:.18em solid ' + INK + ';border-radius:.3em;box-shadow:.22em .22em 0 ' + INK + ';font-size:.9em;max-width:84%;transform:rotate(.8deg)}' +
    '.celshading-quest i{flex:none;width:1.9em;height:1.9em;background:#ffd23a;border:.14em solid ' + INK + ';border-radius:.25em;display:grid;place-items:center}' +
    '.celshading-quest i svg{width:1.3em;height:1.3em}' +
    '.celshading-quest span{text-shadow:.07em .07em 0 ' + INK + '}' +
    '.celshading-bub{position:absolute;left:0;top:0;width:13.6em;padding:.95em 1em .8em;background:#fff;border:.2em solid ' + INK + ';border-radius:1.6em/1.3em;box-shadow:.28em .28em 0 ' + INK + ';opacity:0;transform-origin:var(--tx,80%) 110%}' +
    '.celshading-tail{position:absolute;top:100%;margin-top:-.25em;left:calc(var(--tx,80%) - 1.2em);width:2em;height:1.6em;overflow:visible}' +
    '.celshading-name{position:absolute;top:-.95em;left:.8em;font-size:.85em;background:#ffd23a;border:.16em solid ' + INK + ';padding:.15em .55em .1em;border-radius:.2em;transform:rotate(-3deg);box-shadow:.15em .15em 0 ' + INK + '}' +
    '.celshading-say{font-family:"Lilita One","Fredoka",system-ui,sans-serif;font-size:1.06em;line-height:1.22;text-transform:uppercase;letter-spacing:.03em}' +
    '.celshading-xp{position:absolute;left:0;top:0;width:7.6em;height:5.4em;opacity:0;transform:translate(-50%,-50%)}' +
    '.celshading-xp svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.celshading-xp b{position:absolute;inset:0;display:grid;place-items:center;font-weight:400;font-size:1.55em;color:#fff;-webkit-text-stroke:.09em ' + INK + ';paint-order:stroke fill;text-shadow:.07em .07em 0 ' + INK + ';transform:rotate(-8deg)}' +
    '.celshading-btns{position:absolute;left:.9em;right:.9em;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:.7em}' +
    '.celshading-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:.2em;padding:.5em .2em .45em;border:.2em solid ' + INK + ';border-radius:.35em;box-shadow:.25em .3em 0 ' + INK + ';font-size:1em;color:#fff;transform:skewX(-6deg)}' +
    '.celshading-btn > *{transform:skewX(6deg)}' +
    '.celshading-btn span{text-shadow:.08em .08em 0 ' + INK + ';-webkit-text-stroke:.05em ' + INK + ';paint-order:stroke fill}' +
    '.celshading-btn i{width:2.3em;height:2.3em;display:grid;place-items:center;background:#fff;border:.15em solid ' + INK + ';border-radius:50%}' +
    '.celshading-btn i svg{width:1.45em;height:1.45em}' +
    '';

  var AVATAR = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke="#16101f" stroke-width="2.6" stroke-linejoin="round">' +
    '<path d="M0 0h64v64H0z" fill="#3fb6ff" stroke="none"/><path d="M0 64 30 20 64 64z" fill="#2a95e8" stroke="none" opacity=".6"/>' +
    '<path d="M9 66c2-11 10-16 23-16s21 5 23 16z" fill="#2f6cf0"/><path d="M47 52l9 3-2 11h-9z" fill="#ff8a1f"/>' +
    '<path d="M15 30c0-11 8-17 17-17s17 6 17 17-7 19-17 19-17-8-17-19z" fill="#ffd0a6"/>' +
    '<path d="M13 30c-1-12 7-21 19-21 9 0 16 4 19 12l-3 7-4-6-4 4-1-6-6 5-1-5-7 6-3-3-4 7z" fill="#a8532a"/>' +
    '<ellipse cx="25.5" cy="33" rx="2.6" ry="4" fill="#16101f" stroke="none"/><ellipse cx="38.5" cy="33" rx="2.6" ry="4" fill="#16101f" stroke="none"/>' +
    '<circle cx="26.4" cy="31.6" r="1.1" fill="#fff" stroke="none"/><circle cx="39.4" cy="31.6" r="1.1" fill="#fff" stroke="none"/>' +
    '<path d="M26 41q6 5 12 0z" fill="#fff" stroke-width="2"/><path d="M19 38l3-1M42 37l3 1" stroke="#ff7a7a" stroke-width="2"/></svg>';
  var IC_QUEST = '<svg viewBox="0 0 24 24" stroke="#16101f" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M2 14h20"/><path d="M5 14v6M19 14v6"/><path d="M7 14l1.5-3h7l1.5 3"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 24 24" stroke="#16101f" stroke-width="2.2" stroke-linejoin="round"><path d="M9 11l-6 6 3 3 6-6" fill="#ffd23a"/><path d="M8 5c3-2 7-2 10 1l3 3-4 4-3-3c-1-1-3-2-5-2z" fill="#9aa4b5"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 24 24" stroke="#16101f" stroke-width="2.2" stroke-linejoin="round"><path d="M9 7V5a3 3 0 0 1 6 0v2" fill="none"/><path d="M5 10a5 3 0 0 1 14 0v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#ff8a1f"/><path d="M9 14h6v3H9z" fill="#ffd23a"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 24 24" stroke="#16101f" stroke-width="2" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#fff6d6"/><path d="M9 4v14M15 6v14"/><path d="M16.5 9.5l3 3M19.5 9.5l-3 3" stroke="#ff4b5c" stroke-width="2.2"/></svg>';
  var BURST = '<svg viewBox="-60 -42 120 84"><polygon points="0,-40 12,-24 34,-34 30,-14 56,-10 36,4 52,22 26,20 22,40 4,26 -12,40 -18,22 -44,30 -34,10 -58,0 -34,-10 -46,-30 -20,-22 -12,-40" fill="#ff4b5c" stroke="#16101f" stroke-width="4" stroke-linejoin="round"/><polygon points="0,-30 9,-18 26,-25 23,-10 42,-7 27,4 38,17 19,15 16,30 3,19 -9,30 -13,16 -33,22 -25,7 -43,0 -25,-7 -34,-22 -15,-16 -9,-30" fill="#ffd23a"/></svg>';
  var TAIL = '<svg class="celshading-tail" viewBox="0 0 40 32"><path d="M4 0 L18 30 L34 0" fill="#fff" stroke="#16101f" stroke-width="4.5" stroke-linejoin="round"/><rect x="6" y="0" width="26" height="4" fill="#fff"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(23);
      var extraTex = [];

      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      var cv = renderer.domElement;
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      host.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x9fe0ff, 34, 95);
      var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);

      // 3-tone gradient map (hard steps)
      var gData = new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]);
      var gradTex = new THREE.DataTexture(gData, 3, 1, THREE.RGBAFormat);
      gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter; gradTex.generateMipmaps = false; gradTex.needsUpdate = true;
      extraTex.push(gradTex);

      var mats = {};
      function T(color, o) {
        var key = color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, gradientMap: gradTex };
        if (o) for (var k in o) p[k] = o[k];
        return (mats[key] = new THREE.MeshToonMaterial(p));
      }
      var inkMat = new THREE.MeshBasicMaterial({ color: 0x16101f, side: THREE.BackSide });
      var geos = {};
      function G(key, fn) { return geos[key] || (geos[key] = fn()); }
      var bb = new THREE.Box3(), bsz = new THREE.Vector3(), bc = new THREE.Vector3();
      // inverted hull: black copy, slightly bigger, back faces only
      function outline(m, th) {
        th = th || 0.035;
        var g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
        bb.copy(g.boundingBox); bb.getSize(bsz); bb.getCenter(bc);
        var o = new THREE.Mesh(g, inkMat);
        var sx = 1 + 2 * th / Math.max(bsz.x * Math.abs(m.scale.x), 1e-3), sy = 1 + 2 * th / Math.max(bsz.y * Math.abs(m.scale.y), 1e-3), sz = 1 + 2 * th / Math.max(bsz.z * Math.abs(m.scale.z), 1e-3);
        o.scale.set(sx, sy, sz);
        o.position.set(bc.x * (1 - sx), bc.y * (1 - sy), bc.z * (1 - sz));
        o.castShadow = false; o.receiveShadow = false;
        m.add(o); return m;
      }
      function mesh(geo, col, th, o) { var m = new THREE.Mesh(geo, T(col, o)); m.castShadow = true; m.receiveShadow = true; if (th !== 0) outline(m, th); return m; }
      function sph(r, col, th, seg) { return mesh(G('s' + r + '_' + (seg || 18), function () { return new THREE.SphereGeometry(r, seg || 18, Math.max(8, Math.round((seg || 18) * 0.65))); }), col, th); }
      function sphS(r, col, sx, sy, sz, th, seg) { var m = new THREE.Mesh(G('s' + r + '_' + (seg || 18), function () { return new THREE.SphereGeometry(r, seg || 18, Math.max(8, Math.round((seg || 18) * 0.65))); }), T(col)); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; if (th !== 0) outline(m, th); return m; }
      function capsule(r, len, col, th) {
        var g = new THREE.Group();
        var c = mesh(new THREE.CylinderGeometry(r, r, len, 12), col, 0); c.position.y = -len / 2; g.add(c);
        var ink = new THREE.Mesh(new THREE.CylinderGeometry(r + th, r + th, len, 12), inkMat); ink.position.y = -len / 2; g.add(ink);
        [0, -len].forEach(function (y) { var s = sph(r, col, th, 12); s.position.y = y; g.add(s); });
        return g;
      }

      /* lights */
      scene.add(new THREE.HemisphereLight(0xc4e6ff, 0xa58ac0, 0.55));
      var sun = new THREE.DirectionalLight(0xffffff, 0.62);
      sun.position.set(-6, 10, 7); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
      sun.shadow.bias = -0.002;
      scene.add(sun); scene.add(sun.target);

      /* sky: flat bands */
      var skyGeo = new THREE.SphereGeometry(120, 32, 24);
      var sp = skyGeo.attributes.position, col = [], c1 = new THREE.Color(0x2e9bff), c2 = new THREE.Color(0x5cbcff), c3 = new THREE.Color(0x9fe0ff);
      for (var i = 0; i < sp.count; i++) { var h = sp.getY(i) / 120; var c = h > 0.32 ? c1 : h > 0.12 ? c2 : c3; col.push(c.r, c.g, c.b); }
      skyGeo = skyGeo.toNonIndexed();
      // re-colour per face so the bands stay hard-edged
      var sp2 = skyGeo.attributes.position, col2 = [];
      for (i = 0; i < sp2.count; i += 3) { var hy = (sp2.getY(i) + sp2.getY(i + 1) + sp2.getY(i + 2)) / 360; var cc = hy > 0.3 ? c1 : hy > 0.11 ? c2 : c3; for (var k = 0; k < 3; k++) col2.push(cc.r, cc.g, cc.b); }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(col2, 3));
      scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
      // sun: disc + ink ring + rays
      var sunG = new THREE.Group();
      var sunDisc = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0xfff27a, fog: false }));
      var sunInk = new THREE.Mesh(new THREE.CircleGeometry(5.7, 32), new THREE.MeshBasicMaterial({ color: 0x16101f, fog: false })); sunInk.position.z = -0.1;
      sunG.add(sunDisc); sunG.add(sunInk);
      var rays = new THREE.Group(); sunG.add(rays);
      for (i = 0; i < 10; i++) { var ray = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.0), new THREE.MeshBasicMaterial({ color: 0xffe94a, fog: false, transparent: true, opacity: 0.85 })); var an = i / 10 * Math.PI * 2; ray.position.set(Math.cos(an) * 8, Math.sin(an) * 8, -0.2); ray.rotation.z = an - Math.PI / 2; rays.add(ray); }
      sunG.position.set(-28, 36, -92); sunG.lookAt(0, 3, 0); scene.add(sunG);

      /* clouds with ink */
      var clouds = [];
      function cloud(x, y, z, s) {
        var g = new THREE.Group();
        [[0, 0, 0, 1.25], [1.25, -0.3, 0, 0.9], [-1.25, -0.35, 0, 0.85], [0.6, 0.5, -0.2, 0.85], [-2.1, -0.55, 0, 0.55], [2.1, -0.55, 0, 0.6]].forEach(function (q) {
          var m = sph(q[3], 0xffffff, 0.09, 16); m.position.set(q[0], q[1], q[2]); m.castShadow = false; g.add(m);
        });
        g.position.set(x, y, z); g.scale.set(s, s * 0.85, s); scene.add(g); clouds.push({ g: g, x: x });
      }
      cloud(-8, 12, -40, 2.0); cloud(11, 15, -50, 2.3); cloud(0, 20, -64, 2.6); cloud(24, 11, -56, 2.0); cloud(-25, 17, -60, 2.3);

      /* mountains */
      function mountain(x, z, r, hgt, colr, snow) {
        var m = mesh(new THREE.ConeGeometry(r, hgt, 9, 1), colr, 0.35); m.position.set(x, hgt / 2 - 0.5, z); m.castShadow = false; scene.add(m);
        if (snow) { var s = mesh(new THREE.ConeGeometry(r * 0.32, hgt * 0.32, 9, 1), 0xffffff, 0.2); s.position.set(x, hgt - 0.5 - hgt * 0.16 + 0.02, z); s.castShadow = false; scene.add(s); }
      }
      mountain(-24, -64, 15, 24, 0x8c6cf0, true); mountain(-2, -72, 19, 32, 0x7a5ce6, true); mountain(20, -66, 15, 25, 0x9378f2, true); mountain(38, -60, 12, 16, 0x8c6cf0, false);
      function hill(x, z, r, sy, colr) { var m = mesh(G('hill', function () { return new THREE.SphereGeometry(1, 28, 14); }), colr, 0); m.scale.set(r, r * sy, r * 0.7); m.position.set(x, -0.5, z); m.castShadow = false; outline(m, 0.25); scene.add(m); }
      hill(-18, -38, 13, 0.42, 0x3fbf4a); hill(13, -37, 14, 0.38, 0x36b443); hill(-2, -45, 12, 0.42, 0x48c853); hill(32, -34, 12, 0.4, 0x3fbf4a); hill(-35, -32, 12, 0.4, 0x36b443);

      /* ground */
      function riverX(z) { return 0.5 * Math.sin(z * 0.2 + 0.2) - 0.1; }
      function bankH(x, z) { var d = Math.abs(x - riverX(z)); return -0.7 * (1 - smooth(1.1, 1.75, d)); }
      function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }
      function pathD(x, z) { return Math.min(segDist(x, z, -5.2, -5.5, -3.4, -1.2), segDist(x, z, -3.4, -1.2, -2.0, 0), segDist(x, z, 2.0, 0, 3.6, -2.5), segDist(x, z, 3.6, -2.5, 5.5, -6.5)); }
      var gg = new THREE.PlaneGeometry(64, 46, 96, 64);
      gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -12);
      var gp = gg.attributes.position;
      for (i = 0; i < gp.count; i++) { var x = gp.getX(i), z = gp.getZ(i); gp.setY(i, bankH(x, z) + smooth(-10, -24, z) * (1.2 + Math.sin(x * 0.3) * 0.9)); }
      var ground = gg.toNonIndexed(); gg.dispose();
      var gpos = ground.attributes.position, gcol = [];
      var gA = new THREE.Color(0x5fd34a), gB = new THREE.Color(0x4cc23d), sandC = new THREE.Color(0xffd98a), pathC = new THREE.Color(0xf7c77a), bankInk = new THREE.Color(0x2d7a3a);
      for (i = 0; i < gpos.count; i += 3) {
        var cx = (gpos.getX(i) + gpos.getX(i + 1) + gpos.getX(i + 2)) / 3, cz = (gpos.getZ(i) + gpos.getZ(i + 1) + gpos.getZ(i + 2)) / 3;
        var d = Math.abs(cx - riverX(cz)), cl;
        var patch = Math.sin(cx * 0.9 + Math.sin(cz * 0.7) * 2) * Math.cos(cz * 0.8 + cx * 0.2);
        if (d < 1.6) cl = sandC;
        else if (d < 1.78) cl = bankInk;
        else if (pathD(cx, cz) < 0.55) cl = pathC;
        else cl = patch > 0.45 ? gB : gA;
        for (k = 0; k < 3; k++) gcol.push(cl.r, cl.g, cl.b);
      }
      ground.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      ground.computeVertexNormals();
      var groundM = new THREE.Mesh(ground, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex }));
      groundM.receiveShadow = true; scene.add(groundM);

      /* water: flat colour + moving foam streaks */
      var WN = 40, WJ = 6, wpos = [], widx = [];
      for (var a = 0; a <= WN; a++) { var wz = -34 + a * (48 / WN); for (var b = 0; b <= WJ; b++) wpos.push(riverX(wz) + (b / WJ - 0.5) * 2.6, -0.42, wz); }
      for (a = 0; a < WN; a++) for (b = 0; b < WJ; b++) { var i0 = a * (WJ + 1) + b, i2 = i0 + WJ + 1; widx.push(i0, i2, i0 + 1, i0 + 1, i2, i2 + 1); }
      var wgeo = new THREE.BufferGeometry(); wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); wgeo.setIndex(widx); wgeo.computeVertexNormals();
      var water = new THREE.Mesh(wgeo, new THREE.MeshBasicMaterial({ color: 0x29a8ff })); scene.add(water);
      var foam = [], foamGeo = new THREE.CircleGeometry(1, 12), foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (i = 0; i < 26; i++) { var fm = new THREE.Mesh(foamGeo, foamMat); fm.rotation.x = -Math.PI / 2; fm.userData = { off: R(), lane: (R() - 0.5) * 1.8, len: 0.25 + R() * 0.35 }; fm.scale.set(0.05, fm.userData.len, 1); scene.add(fm); foam.push(fm); }
      var darkMat = new THREE.MeshBasicMaterial({ color: 0x1784e0 });
      for (i = 0; i < 9; i++) { var dz = -12 + i * 2.2, dm = new THREE.Mesh(foamGeo, darkMat); dm.rotation.x = -Math.PI / 2; dm.scale.set(0.35 + R() * 0.3, 0.12, 1); dm.position.set(riverX(dz) + (R() - 0.5) * 1.4, -0.415, dz); scene.add(dm); }

      /* props */
      function tree(x, z, s, cols) {
        var g = new THREE.Group();
        var tr = mesh(G('trunk', function () { return new THREE.CylinderGeometry(0.13, 0.19, 1.1, 10); }), 0x9a5a2e, 0.04); tr.position.y = 0.55; g.add(tr);
        cols = cols || [0x3fcf4f, 0x2fb840];
        [[0, 1.55, 0, 0.75], [0.5, 1.3, 0.12, 0.5], [-0.5, 1.32, 0.05, 0.52], [0.08, 2.05, 0.02, 0.5]].forEach(function (q, j) { var m = sph(q[3], cols[j % 2], 0.05, 16); m.position.set(q[0], q[1], q[2]); g.add(m); });
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g;
      }
      function pine(x, z, s) {
        var g = new THREE.Group();
        var tr = mesh(G('ptrunk', function () { return new THREE.CylinderGeometry(0.1, 0.14, 0.6, 8); }), 0x9a5a2e, 0.04); tr.position.y = 0.3; g.add(tr);
        [[1.05, 0.75, 1.2], [1.6, 0.58, 1.0], [2.1, 0.4, 0.8]].forEach(function (q) { var c = mesh(G('pc' + q[1], function () { return new THREE.ConeGeometry(q[1], q[2], 10); }), 0x1fa64a, 0.05); c.position.y = q[0]; g.add(c); });
        g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
      }
      function rock(x, z, s, y) { var m = sphS(1, [0xa9b4d6, 0x98a3c8][Math.floor(R() * 2)], s, s * 0.6, s * 0.85, 0.035, 12); m.position.set(x, y || 0, z); scene.add(m); return m; }
      tree(-5.4, -2.6, 1.0); tree(5.3, -3.0, 1.05, [0xffb02e, 0xff9a1f]); tree(-7.3, -6.0, 1.3); tree(7.2, -7.2, 1.3); tree(2.4, -12, 1.3, [0xffb02e, 0xff9a1f]);
      tree(-9.5, -1, 1.1); tree(4.9, 2.4, 0.95); tree(-6.6, 3.0, 1.0, [0xff6f91, 0xff5a7e]); tree(9, -2.5, 1.2);
      pine(-1.9, -10, 1.3); pine(-3.6, -8.0, 1.2); pine(3.6, -9.5, 1.25); pine(-8.8, -9.5, 1.5);
      rock(-1.6, 1.5, 0.3, -0.3); rock(-1.8, 2.2, 0.2, -0.28); rock(1.55, -1.2, 0.32, -0.3); rock(1.45, 2.8, 0.25, -0.35); rock(-3.1, 3.0, 0.3, 0.05); rock(3.3, 3.5, 0.36, 0.05); rock(-1.45, -3.6, 0.22, -0.25);
      // grass tufts & flowers
      var tuftGeo = new THREE.ConeGeometry(0.07, 0.3, 4);
      for (i = 0; i < 30; i++) {
        var tx = (R() - 0.5) * 13, tz = 4.5 - R() * 10;
        if (Math.abs(tx - riverX(tz)) < 2.2 || pathD(tx, tz) < 0.7) continue;
        if (i % 3 === 0) { var fl = sph(0.07, [0xff4b5c, 0xffffff, 0xffd23a][i % 3 === 0 ? (i / 3) % 3 : 0], 0.025, 10); fl.position.set(tx, 0.2, tz); scene.add(fl); var stm = mesh(G('stem', function () { return new THREE.CylinderGeometry(0.015, 0.015, 0.2, 5); }), 0x2d8a3a, 0); stm.position.set(tx, 0.1, tz); scene.add(stm); }
        else { var tg = new THREE.Group(); for (var q = -1; q <= 1; q++) { var tf = mesh(tuftGeo, 0x34b046, 0.02); tf.position.set(q * 0.06, 0.12, 0); tf.rotation.z = -q * 0.35; tg.add(tf); } tg.position.set(tx, 0, tz); tg.rotation.y = R() * 3; scene.add(tg); }
      }

      /* house */
      function house(x, z, rot, wall, roof, s) {
        var g = new THREE.Group();
        var base = mesh(new THREE.BoxGeometry(2.0, 1.35, 1.6), wall, 0.05); base.position.y = 0.68; g.add(base);
        var rg = new THREE.ConeGeometry(1.75, 1.2, 4, 1); rg.rotateY(Math.PI / 4);
        var rf = mesh(rg, roof, 0.06); rf.scale.set(1.0, 1, 0.82); rf.position.y = 1.95; g.add(rf);
        var ch = mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), 0xd27a4a, 0.04); ch.position.set(0.55, 2.3, -0.2); g.add(ch);
        var dr = mesh(new THREE.BoxGeometry(0.5, 0.75, 0.08), 0x8a4a22, 0.035); dr.position.set(-0.45, 0.42, 0.8); g.add(dr);
        var win = mesh(new THREE.BoxGeometry(0.5, 0.45, 0.08), 0x7fe0ff, 0.035, { emissive: 0x2a7fb0, emissiveIntensity: 0.35 }); win.position.set(0.45, 0.82, 0.8); g.add(win);
        var bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.1), inkMat); bar1.material = new THREE.MeshBasicMaterial({ color: 0x16101f }); bar1.position.set(0.45, 0.82, 0.82); g.add(bar1);
        var bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.1), bar1.material); bar2.position.set(0.45, 0.82, 0.82); g.add(bar2);
        g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s); scene.add(g); return g;
      }
      house(-4.3, -4.3, 0.42, 0xfff1d6, 0xff4b5c, 1.05);
      house(4.8, -7.0, -0.5, 0xfff1d6, 0x2f6cf0, 0.95);
      var smoke = [];
      for (i = 0; i < 3; i++) { var sm = sph(0.2, 0xffffff, 0.035, 12); sm.castShadow = false; scene.add(sm); smoke.push(sm); }
      var chim = new THREE.Vector3(0.55, 2.7, -0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42).multiplyScalar(1.05).add(new THREE.Vector3(-4.3, 0, -4.3));

      /* bridge */
      var bridge = new THREE.Group(); scene.add(bridge);
      var DECK = 0.12, PL = 0.3, GAP = 0.06, NPL = 9, MISSING = 4, span = NPL * (PL + GAP);
      [-0.42, 0.42].forEach(function (z) { var bm = mesh(new THREE.BoxGeometry(span + 0.5, 0.16, 0.16), 0x7a3f1d, 0.03); bm.position.set(0, DECK - 0.12, z); bridge.add(bm); });
      var plankG = new THREE.BoxGeometry(PL, 0.09, 1.15);
      var pcs = [0xe08a3c, 0xd27a30, 0xea9a4a];
      for (i = 0; i < NPL; i++) { if (i === MISSING) continue; var pl = mesh(plankG, pcs[i % 3], 0.022); pl.position.set(-span / 2 + PL / 2 + i * (PL + GAP), DECK, Math.sin(i * 2.3) * 0.03); pl.rotation.y = Math.sin(i * 3.1) * 0.03; bridge.add(pl); }
      var postXs = [-span / 2 - 0.1, span / 2 + 0.1];
      postXs.forEach(function (x) { [-0.6, 0.6].forEach(function (z) { var p = mesh(G('post', function () { return new THREE.BoxGeometry(0.18, 1.2, 0.18); }), 0x8a4a22, 0.03); p.position.set(x, 0.2, z); bridge.add(p); }); });
      [-0.6, 0.6].forEach(function (z) { var rl = mesh(new THREE.BoxGeometry(span + 0.3, 0.09, 0.09), 0xb8652a, 0.025); rl.position.set(0, 0.72, z); bridge.add(rl); });
      bridge.position.set(riverX(0) + 0.1, 0, 0);
      var gapX = bridge.position.x - span / 2 + PL / 2 + MISSING * (PL + GAP);
      // ghost slot: dashed yellow frame
      var ghost = new THREE.Group(); ghost.position.set(gapX, DECK, 0); scene.add(ghost);
      var ghostMat = new THREE.MeshBasicMaterial({ color: 0xffe94a, transparent: true });
      [[PL + 0.06, 0.05, 0.06, 0, -0.6], [PL + 0.06, 0.05, 0.06, 0, 0.6], [0.06, 0.05, 1.26, -PL / 2 - 0.03, 0], [0.06, 0.05, 1.26, PL / 2 + 0.03, 0]].forEach(function (q) { var e = new THREE.Mesh(new THREE.BoxGeometry(q[0], q[1], q[2]), ghostMat); e.position.set(q[3], 0, q[4]); ghost.add(e); });
      var newPlank = mesh(plankG, 0xffb04a, 0.03, { emissive: 0xffe94a, emissiveIntensity: 0 }); newPlank.position.set(gapX, DECK, 0); scene.add(newPlank);

      /* characters */
      var SKIN = 0xffcfa0, TH = 0.028;
      function eye(g, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z);
        var pu = new THREE.Mesh(G('eye' + r, function () { return new THREE.SphereGeometry(r, 14, 10); }), new THREE.MeshBasicMaterial({ color: 0x16101f })); pu.scale.set(0.7, 1.15, 0.45); e.add(pu);
        var hl = new THREE.Mesh(G('eyeh' + r, function () { return new THREE.SphereGeometry(r * 0.32, 8, 6); }), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(r * 0.18, r * 0.42, r * 0.32); e.add(hl);
        g.add(e); return e;
      }
      // hero
      var hero = new THREE.Group(), hBody = new THREE.Group(); hero.add(hBody);
      var hLegL = capsule(0.085, 0.22, 0x23336e, TH), hLegR = capsule(0.085, 0.22, 0x23336e, TH);
      hLegL.position.set(-0.11, 0.38, 0); hLegR.position.set(0.11, 0.38, 0);
      [hLegL, hLegR].forEach(function (l) { var sh = sphS(0.12, 0xff4b5c, 0.9, 0.6, 1.3, TH, 12); sh.position.set(0, -0.29, 0.05); l.add(sh); hBody.add(l); });
      var torso = sphS(0.27, 0x2f6cf0, 1, 1.08, 0.88, TH); torso.position.y = 0.6; hBody.add(torso);
      var stripe = sphS(0.272, 0x7fe0ff, 1.005, 0.2, 0.885, 0, 18); stripe.position.y = 0.6; hBody.add(stripe);
      var pack = sphS(0.26, 0xff8a1f, 0.95, 1.1, 0.6, TH); pack.position.set(0, 0.64, -0.27); hBody.add(pack);
      var flap = sphS(0.24, 0xe56a00, 0.98, 0.5, 0.62, TH); flap.position.set(0, 0.8, -0.29); hBody.add(flap);
      var hArmL = capsule(0.065, 0.25, 0x2f6cf0, TH), hArmR = capsule(0.065, 0.25, 0x2f6cf0, TH);
      hArmL.position.set(-0.29, 0.77, 0); hArmR.position.set(0.29, 0.77, 0);
      [hArmL, hArmR].forEach(function (a) { var hd = sph(0.085, SKIN, TH, 12); hd.position.y = -0.31; a.add(hd); hBody.add(a); });
      var hHead = new THREE.Group(); hHead.position.y = 1.16; hBody.add(hHead);
      var hd0 = sphS(0.39, SKIN, 1.05, 0.98, 1, 0.035, 24); hHead.add(hd0);
      // spiky hair
      var hairBase = mesh(new THREE.SphereGeometry(0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), 0xa8532a, 0.035); hairBase.rotation.x = -0.4; hairBase.position.set(0, 0.03, -0.04); hHead.add(hairBase);
      [[0, 0.42, 0.05, -0.2, 0], [-0.22, 0.36, 0.12, 0.3, 0.5], [0.22, 0.36, 0.1, 0.2, -0.5], [0.06, 0.34, 0.24, 0.8, -0.1], [-0.14, 0.33, 0.24, 0.85, 0.3]].forEach(function (q) { var sp3 = mesh(G('spike', function () { return new THREE.ConeGeometry(0.11, 0.3, 7); }), 0xa8532a, 0.025); sp3.position.set(q[0], q[1], q[2]); sp3.rotation.set(q[3], 0, q[4]); hHead.add(sp3); });
      var hEyeL = eye(hHead, -0.14, 0.0, 0.375, 0.09), hEyeR = eye(hHead, 0.14, 0.0, 0.375, 0.09);
      var hMouth = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0x16101f })); hMouth.position.set(0, -0.14, 0.375); hHead.add(hMouth);
      var tongue = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff6b7a })); tongue.position.set(0, -0.17, 0.378); hHead.add(tongue);
      [-0.24, 0.24].forEach(function (x) { var ck = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.025), new THREE.MeshBasicMaterial({ color: 0xff6b7a })); ck.position.set(x, -0.08, 0.33); ck.rotation.set(0, x * 1.4, 0.4 * Math.sign(x)); hHead.add(ck); var ck2 = ck.clone(); ck2.position.x += 0.04 * Math.sign(x); hHead.add(ck2); });
      scene.add(hero);

      // Mestre Tomé
      var tome = new THREE.Group(), tBody = new THREE.Group(); tome.add(tBody);
      var tLegL = capsule(0.1, 0.22, 0x4a3a6a, TH), tLegR = capsule(0.1, 0.22, 0x4a3a6a, TH);
      tLegL.position.set(-0.14, 0.4, 0); tLegR.position.set(0.14, 0.4, 0);
      [tLegL, tLegR].forEach(function (l) { var bt = sphS(0.14, 0x6a3418, 0.95, 0.6, 1.3, TH, 12); bt.position.set(0, -0.29, 0.05); l.add(bt); tBody.add(l); });
      var tT = sphS(0.38, 0x3fbf8f, 1, 1.0, 0.88, 0.035); tT.position.y = 0.72; tBody.add(tT);
      var apron = sphS(0.385, 0x9a5226, 0.86, 0.85, 0.82, 0.03); apron.position.set(0, 0.64, 0.045); tBody.add(apron);
      var pocket = mesh(new THREE.BoxGeometry(0.24, 0.13, 0.05), 0x7a3f1d, 0.02); pocket.position.set(0, 0.56, 0.33); tBody.add(pocket);
      var tArmL = capsule(0.08, 0.26, 0x3fbf8f, TH), tArmR = capsule(0.08, 0.26, 0x3fbf8f, TH);
      tArmL.position.set(-0.4, 0.92, 0); tArmR.position.set(0.4, 0.92, 0);
      [tArmL, tArmR].forEach(function (a) { var hd = sph(0.1, SKIN, TH, 12); hd.position.y = -0.34; a.add(hd); tBody.add(a); });
      var tHead = new THREE.Group(); tHead.position.y = 1.32; tBody.add(tHead);
      tHead.add(sph(0.36, SKIN, 0.035, 22));
      var beard = sphS(0.3, 0xffffff, 1.05, 1.05, 0.75, 0.035, 18); beard.position.set(0, -0.2, 0.17); tHead.add(beard);
      var beardTip = mesh(G('btip', function () { return new THREE.ConeGeometry(0.16, 0.28, 12); }), 0xffffff, 0.03); beardTip.rotation.x = Math.PI; beardTip.position.set(0, -0.48, 0.18); tHead.add(beardTip);
      [-1, 1].forEach(function (sg) { var mu = sphS(0.1, 0xffffff, 1.4, 0.55, 0.7, 0.022, 12); mu.position.set(sg * 0.1, -0.06, 0.33); mu.rotation.z = sg * 0.35; tHead.add(mu); });
      var tNose = sph(0.07, 0xff9a7a, 0.025, 12); tNose.position.set(0, 0.01, 0.36); tHead.add(tNose);
      var tEyeL = eye(tHead, -0.12, 0.08, 0.335, 0.065), tEyeR = eye(tHead, 0.12, 0.08, 0.335, 0.065);
      [-0.13, 0.13].forEach(function (x) { var bw = sphS(0.07, 0xffffff, 1.4, 0.5, 0.6, 0.02, 10); bw.position.set(x, 0.19, 0.31); bw.rotation.z = -x * 1.6; tHead.add(bw); });
      var hat = mesh(new THREE.SphereGeometry(0.39, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffd23a, 0.035); hat.position.y = 0.2; tHead.add(hat);
      var brim = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.05, 24), 0xffbf00, 0.03); brim.position.set(0, 0.21, 0.06); tHead.add(brim);
      var hatBand = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), 0xffbf00, 0.02); hatBand.position.set(0, 0.55, 0); tHead.add(hatBand);
      tome.position.set(2.1, 0, 0.95); tome.rotation.y = -0.6; scene.add(tome);

      /* FX: outlined stars, toon puffs, speed lines */
      var starShape = new THREE.Shape();
      for (i = 0; i < 10; i++) { var rr = i % 2 ? 0.05 : 0.13, an2 = i / 10 * Math.PI * 2 + Math.PI / 2; if (i === 0) starShape.moveTo(Math.cos(an2) * rr, Math.sin(an2) * rr); else starShape.lineTo(Math.cos(an2) * rr, Math.sin(an2) * rr); }
      var starGeo = new THREE.ShapeGeometry(starShape);
      var starInkShape = new THREE.Shape();
      for (i = 0; i < 10; i++) { var rr2 = i % 2 ? 0.075 : 0.17, an3 = i / 10 * Math.PI * 2 + Math.PI / 2; if (i === 0) starInkShape.moveTo(Math.cos(an3) * rr2, Math.sin(an3) * rr2); else starInkShape.lineTo(Math.cos(an3) * rr2, Math.sin(an3) * rr2); }
      var starInkGeo = new THREE.ShapeGeometry(starInkShape);
      var stars = [], starMat = new THREE.MeshBasicMaterial({ color: 0xffe94a, side: THREE.DoubleSide }), starInkMat = new THREE.MeshBasicMaterial({ color: 0x16101f, side: THREE.DoubleSide });
      for (i = 0; i < 9; i++) { var sg = new THREE.Group(); var sm1 = new THREE.Mesh(starGeo, starMat); sm1.position.z = 0.005; sg.add(sm1); sg.add(new THREE.Mesh(starInkGeo, starInkMat)); sg.userData = { a: i / 9 * Math.PI * 2 + 0.2, up: 0.7 + (i % 3) * 0.35, r: 0.8 + (i % 4) * 0.2 }; sg.visible = false; scene.add(sg); stars.push(sg); }
      var puffs = [];
      for (i = 0; i < 6; i++) { var pf = sph(0.16, 0xffffff, 0.03, 12); pf.castShadow = false; pf.userData = { a: i / 6 * Math.PI * 2 }; pf.visible = false; scene.add(pf); puffs.push(pf); }
      var lines = [];
      for (i = 0; i < 4; i++) { var ln = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.7, 0.035), new THREE.MeshBasicMaterial({ color: 0x16101f })); ln.visible = false; ln.userData = { x: (i - 1.5) * 0.12, z: (i % 2 ? 0.35 : -0.35) }; scene.add(ln); lines.push(ln); }

      /* HUD */
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; host.appendChild(styleEl);
      var hud = document.createElement('div'); hud.className = 'celshading-hud';
      hud.innerHTML =
        '<div class="celshading-wipe"></div><div class="celshading-top"><div class="celshading-ava">' + AVATAR + '</div><div class="celshading-info">' +
        '<div class="celshading-lvl"><b>Nível 4</b>Explorador</div><div class="celshading-bar"><div class="celshading-fill"></div><div class="celshading-xpn">620 / 1000 XP</div></div></div></div>' +
        '<div class="celshading-quest"><i>' + IC_QUEST + '</i><span>Missão: consertar a ponte da vila</span></div>' +
        '<div class="celshading-bub"><div class="celshading-name">Mestre Tomé</div><div class="celshading-say">A viga precisa se apoiar dos dois lados!</div>' + TAIL + '</div>' +
        '<div class="celshading-xp">' + BURST + '<b>+50 XP</b></div>' +
        '<div class="celshading-btns">' +
        '<div class="celshading-btn" style="background:#ff4b5c"><i>' + IC_BUILD + '</i><span>Construir</span></div>' +
        '<div class="celshading-btn" style="background:#ff9a1f"><i>' + IC_BAG + '</i><span>Mochila</span></div>' +
        '<div class="celshading-btn" style="background:#2f9bff"><i>' + IC_MAP + '</i><span>Mapa</span></div></div>';
      host.appendChild(hud);
      var elFill = hud.querySelector('.celshading-fill'), elXpn = hud.querySelector('.celshading-xpn'), elBub = hud.querySelector('.celshading-bub'), elXp = hud.querySelector('.celshading-xp'), elQuest = hud.querySelector('.celshading-quest'), elWipe = hud.querySelector('.celshading-wipe');

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
        var cu = reduce ? 0 : smooth(0, 2.9, s);
        camera.position.set(CAM.x - 0.35 + 0.5 * cu, CAM.y, CAM.z - 0.8 * cu);
        camera.lookAt(LOOK.x - 0.2 + 0.25 * cu, LOOK.y, LOOK.z);

        // hero
        var wp = clamp(s / 1.2, 0, 1), ep = 1 - (1 - wp) * (1 - wp);
        hero.position.lerpVectors(HERO_A, HERO_B, ep);
        var walk = s < 1.2 ? 1 - smooth(0.95, 1.2, s) : 0;
        var ph = s * Math.PI * 2 * 2.1, sw = Math.sin(ph) * 0.75 * walk;
        hLegL.rotation.x = sw; hLegR.rotation.x = -sw;
        hArmL.rotation.x = -sw; hArmR.rotation.x = sw;
        hArmL.rotation.z = -0.25; hArmR.rotation.z = 0.25;
        hBody.position.y = Math.abs(Math.cos(ph)) * 0.09 * walk;
        hBody.rotation.z = Math.sin(ph) * 0.06 * walk;
        hBody.rotation.x = 0.1 * walk;
        hero.rotation.y = lerp(0.85, 0.6, smooth(1.1, 1.6, s));
        hHead.rotation.y = 0.35 * smooth(0.85, 1.3, s) * (1 - smooth(2.1, 2.5, s));
        var cheer = smooth(2.3, 2.45, s) * (1 - smooth(2.95, 3.15, s));
        hArmR.rotation.x -= cheer * 2.8; hArmR.rotation.z += cheer * 0.3;
        var jump = s > 2.32 && s < 2.7 ? Math.sin((s - 2.32) / 0.38 * Math.PI) : 0;
        hBody.position.y += jump * 0.3;
        hMouth.scale.set(1 + cheer * 0.3, 1 + cheer * 0.8, 1); tongue.scale.copy(hMouth.scale);
        var bp = wall % 2.9; hEyeL.scale.y = hEyeR.scale.y = bp < 0.12 ? 0.12 : 1;
        var bp2 = (wall + 1.3) % 3.4; tEyeL.scale.y = tEyeR.scale.y = bp2 < 0.12 ? 0.12 : 1;

        // mentor
        var talk = smooth(0.7, 0.92, s) * (1 - smooth(2.15, 2.4, s));
        tBody.position.y = Math.abs(Math.sin(wall * 2.1)) * 0.015;
        tArmL.rotation.x = -talk * (1.5 + Math.sin(s * 9) * 0.3);
        tArmL.rotation.z = -0.2 - talk * (0.5 + Math.sin(s * 9 + 1) * 0.2);
        tArmR.rotation.z = 0.25 + talk * 0.3;
        var thumbs = smooth(2.32, 2.5, s) * (1 - smooth(2.95, 3.15, s));
        tArmR.rotation.x = -thumbs * 2.4;
        tHead.rotation.x = Math.sin(s * 10) * 0.07 * talk + thumbs * Math.sin((s - 2.32) * 14) * 0.1;
        tHead.rotation.z = 0.1 * talk;

        // plank
        ghost.visible = s < 1.7;
        var gpulse = 0.5 + 0.5 * Math.sin(wall * 8);
        ghostMat.opacity = (0.55 + 0.45 * gpulse) * (1 - smooth(1.45, 1.7, s));
        ghost.scale.setScalar(1 + gpulse * 0.04);
        newPlank.visible = s >= 1.5;
        var land = clamp((s - 1.55) / 0.55, 0, 1);
        newPlank.position.y = DECK + (1 - land * land) * 2.5;
        newPlank.rotation.y = (1 - smooth(1.55, 2.1, s)) * 0.9;
        newPlank.material.emissiveIntensity = smooth(1.5, 1.7, s) * (1 - smooth(2.3, 2.9, s)) * 0.5;
        var sq = s > 2.1 && s < 2.3 ? Math.sin((s - 2.1) / 0.2 * Math.PI) : 0;
        newPlank.scale.set(1 + sq * 0.15, 1 - sq * 0.4, 1 + sq * 0.05);
        // speed lines while falling
        lines.forEach(function (l) {
          l.visible = s > 1.6 && s < 2.1;
          if (!l.visible) return;
          l.position.set(gapX + l.userData.x, newPlank.position.y + 0.65, l.userData.z);
          l.scale.y = 0.6 + 0.4 * Math.sin(wall * 30 + l.userData.x * 20);
        });
        var fx = clamp((s - 2.1) / 0.75, 0, 1), fxOn = s > 2.1 && s < 2.85;
        stars.forEach(function (p) {
          p.visible = fxOn; if (!fxOn) return;
          var u = p.userData, e = 1 - Math.pow(1 - fx, 3);
          p.position.set(gapX + Math.cos(u.a) * u.r * e * 0.8, DECK + 0.25 + u.up * e - fx * fx * 0.6, Math.sin(u.a) * u.r * e * 0.5 + 0.35);
          p.quaternion.copy(camera.quaternion); p.rotateZ(wall * 4 + u.a);
          p.scale.setScalar(Math.sin(Math.min(1, fx * 1.3) * Math.PI) * 1.5 + 0.01);
        });
        puffs.forEach(function (p) {
          p.visible = s > 2.1 && s < 2.65; if (!p.visible) return;
          var k = clamp((s - 2.1) / 0.55, 0, 1);
          p.position.set(gapX + Math.cos(p.userData.a) * 0.2 * (1 + k * 2.5), DECK + 0.05 + k * 0.2, Math.sin(p.userData.a) * 0.6 * (1 + k * 0.9));
          p.scale.setScalar((0.8 + k * 0.8) * (1 - smooth(0.6, 1, k)) + 0.001);
        });

        // environment
        foam.forEach(function (f) {
          var u = f.userData, k = ((u.off + wall * 0.18) % 1);
          var z = -14 + k * 20;
          f.position.set(riverX(z) + u.lane * (1 + 0.1 * Math.sin(z)), -0.41, z);
          var fade2 = Math.sin(k * Math.PI); f.scale.set(0.045 * fade2 + 0.001, u.len, 1);
        });
        clouds.forEach(function (c, j) { c.g.position.x = c.x + ((wall * (0.3 + j * 0.07)) % 50); });
        rays.rotation.z = wall * 0.25;
        smoke.forEach(function (p, j) { var k = ((wall * 0.4 + j / 3) % 1); p.position.set(chim.x + k * 0.5, chim.y + k * 1.5, chim.z); p.scale.setScalar((0.5 + k * 1.2) * (1 - smooth(0.75, 1, k)) + 0.001); });

        // HUD
        var xpK = smooth(2.4, 2.85, s);
        elFill.style.width = (62 + 5 * xpK) + '%';
        elXpn.textContent = Math.round(620 + 50 * xpK) + ' / 1000 XP';
        var bIn = clamp((s - 0.8) / 0.28, 0, 1), bOut = smooth(2.75, 2.98, s);
        var bs = (bIn > 0 ? easeOutBack(bIn) : 0);
        var head = proj(v3.set(tome.position.x, 2.2, tome.position.z));
        var bw = elBub.offsetWidth || 200, bh = elBub.offsetHeight || 80;
        var bl = clamp(head.x - bw * 0.74, 12, W - bw - 16);
        var bt = Math.max(head.y - bh - 26, elQuest.getBoundingClientRect().bottom - host.getBoundingClientRect().top + 26);
        elBub.style.setProperty('--tx', clamp(head.x - bl, 26, bw - 26) + 'px');
        var shake = bIn > 0 && bIn < 1 ? Math.sin(bIn * 30) * 2 : 0;
        elBub.style.transform = 'translate(' + (bl + shake).toFixed(1) + 'px,' + bt.toFixed(1) + 'px) rotate(' + (-1.5 + shake * 0.5).toFixed(2) + 'deg) scale(' + Math.max(bs, 0.001).toFixed(3) + ')';
        elBub.style.opacity = (bIn > 0 ? 1 : 0) * (1 - bOut);
        var xk = clamp((s - 2.35) / 0.7, 0, 1);
        var xpPos = proj(v3.set(gapX, 1.2, 0));
        elXp.style.opacity = s > 2.35 ? 1 - smooth(0.65, 1, xk) : 0;
        elXp.style.left = xpPos.x + 'px';
        elXp.style.top = (xpPos.y + 10 - 60 * (1 - Math.pow(1 - xk, 2))) + 'px';
        var bsc = xk < 0.2 ? easeOutBack(xk / 0.2) : 1 + (xk - 0.2) * 0.1;
        elXp.style.transform = 'translate(-50%,-50%) scale(' + bsc.toFixed(3) + ') rotate(' + (-6 + Math.sin(wall * 9) * 3).toFixed(1) + 'deg)';

        // comic panel wipe 3.0 → 3.6 (covers the screen at 3.3, when everything resets)
        var wk2 = smooth(3.0, 3.6, t);
        var mg = H * 0.32, wx = lerp(W + mg, -2.2 * W - mg, wk2);
        elWipe.style.transform = 'translateX(' + wx.toFixed(1) + 'px) skewX(-14deg)';
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
