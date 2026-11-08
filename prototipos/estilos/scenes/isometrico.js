/* Estilo ISOMÉTRICO 2.5D — KidsSchooling
   A vila como uma maquete flutuante, vista por câmera ortográfica isométrica.
   Loop de 3,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'isometrico';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x) { var c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function hash(x, z) { var s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }

  function skyCanvas() {
    var c = document.createElement('canvas'); c.width = 4; c.height = 256;
    var g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#8fd3f4'); grd.addColorStop(0.6, '#cdeefa'); grd.addColorStop(1, '#fff3dc');
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    return c;
  }
  function waterCanvas() {
    var c = document.createElement('canvas'); c.width = 128; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 64);
    g.strokeStyle = 'rgba(160,225,250,0.9)'; g.lineWidth = 3; g.lineCap = 'round';
    [[10, 12, 30], [60, 22, 40], [20, 40, 26], [80, 50, 30], [100, 8, 20]].forEach(function (l) {
      g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[0] + l[2], l[1]); g.stroke();
    });
    return c;
  }
  function fallCanvas() {
    var c = document.createElement('canvas'); c.width = 64; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(170,225,250,1)';
    for (var i = 0; i < 9; i++) g.fillRect((i * 23) % 60, (i * 37) % 128, 4, 34);
    return c;
  }
  function starCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.translate(32, 32);
    g.fillStyle = '#fff3a0';
    g.beginPath();
    for (var i = 0; i < 8; i++) {
      var r = i % 2 ? 7 : 28, a = i * Math.PI / 4;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
    return c;
  }

  /* ---------- HUD ---------- */
  var CSS = [
    '.isometrico-root{position:absolute;inset:0;overflow:hidden;font-family:"Fredoka","Baloo 2",system-ui,sans-serif;color:#33415c;-webkit-user-select:none;user-select:none;}',
    '.isometrico-root canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.isometrico-fade{position:absolute;inset:0;background:#eaf7fd;opacity:0;pointer-events:none;}',
    '.isometrico-hud{position:absolute;inset:0;pointer-events:none;font-size:calc(16px*var(--s));}',
    '.isometrico-panel{background:rgba(255,253,247,.94);border-radius:calc(16px*var(--s));box-shadow:0 calc(3px*var(--s)) 0 rgba(51,65,92,.12),0 calc(8px*var(--s)) calc(20px*var(--s)) rgba(51,65,92,.16);border:1px solid rgba(255,255,255,.9);}',
    '.isometrico-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.isometrico-ava{position:relative;flex:none;width:calc(52px*var(--s));height:calc(52px*var(--s));border-radius:50%;background:#bfe6f7;border:calc(3px*var(--s)) solid #fff;box-shadow:0 0 0 calc(2px*var(--s)) #7cc6e6;overflow:hidden;}',
    '.isometrico-ava svg{width:100%;height:100%;display:block}',
    '.isometrico-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(5px*var(--s));}',
    '.isometrico-row{display:flex;align-items:baseline;justify-content:space-between;gap:calc(6px*var(--s));white-space:nowrap;}',
    '.isometrico-lvl{font-weight:600;font-size:calc(17px*var(--s));line-height:1.1;}',
    '.isometrico-lvl em{font-style:normal;color:#e58a3a;}',
    '.isometrico-xptxt{font-weight:500;font-size:calc(12.5px*var(--s));color:#6b7a99;}',
    '.isometrico-xp{position:relative;height:calc(12px*var(--s));border-radius:99px;background:#e6edf5;overflow:hidden;}',
    '.isometrico-xpfill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(90deg,#7ed6a0,#41b883);}',
    '.isometrico-xpfill:after{content:"";position:absolute;left:calc(4px*var(--s));right:calc(4px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:9px;background:rgba(255,255,255,.5);}',
    '.isometrico-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px + 82px*var(--s));display:flex;align-items:center;gap:calc(9px*var(--s));padding:calc(7px*var(--s)) calc(14px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:80%;}',
    '.isometrico-qi{flex:none;width:calc(32px*var(--s));height:calc(32px*var(--s));border-radius:calc(10px*var(--s));background:#ffe3c2;display:grid;place-items:center;}',
    '.isometrico-qi svg{width:72%;height:72%}',
    '.isometrico-qt{font-weight:500;font-size:calc(14px*var(--s));line-height:1.15;}',
    '.isometrico-qt b{display:block;font-weight:600;font-size:calc(11.5px*var(--s));color:#e58a3a;text-transform:uppercase;letter-spacing:.08em;}',
    '.isometrico-check{flex:none;width:calc(18px*var(--s));height:calc(18px*var(--s));border-radius:50%;border:calc(2px*var(--s)) solid #c9d5e3;margin-left:calc(4px*var(--s));}',
    '.isometrico-bub{position:absolute;left:0;top:0;width:calc(206px*var(--s));padding:calc(10px*var(--s)) calc(12px*var(--s)) calc(10px*var(--s));opacity:0;transform-origin:50% 100%;border-radius:calc(16px*var(--s));display:flex;gap:calc(9px*var(--s));align-items:flex-start;}',
    '.isometrico-bav{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#ffe9a8;overflow:hidden;}',
    '.isometrico-bav svg{width:100%;height:100%;display:block}',
    '.isometrico-name{display:block;font-weight:600;font-size:calc(13px*var(--s));color:#c2672a;line-height:1.1;margin-bottom:calc(2px*var(--s));}',
    '.isometrico-say{font-weight:500;font-size:calc(15px*var(--s));line-height:1.2;}',
    '.isometrico-tail{position:absolute;bottom:calc(-9px*var(--s));width:calc(18px*var(--s));height:calc(18px*var(--s));background:rgba(255,253,247,1);transform:rotate(45deg);border-radius:0 0 calc(4px*var(--s)) 0;box-shadow:calc(3px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s)) rgba(51,65,92,.08);}',
    '.isometrico-plus{position:absolute;left:0;top:0;display:flex;align-items:center;gap:calc(6px*var(--s));padding:calc(4px*var(--s)) calc(12px*var(--s)) calc(4px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#fffdf7;box-shadow:0 calc(4px*var(--s)) calc(12px*var(--s)) rgba(51,65,92,.25);font-weight:600;font-size:calc(19px*var(--s));color:#2f9e6a;opacity:0;white-space:nowrap;}',
    '.isometrico-plus i{display:grid;place-items:center;width:calc(26px*var(--s));height:calc(26px*var(--s));border-radius:50%;background:#41b883;color:#fff;font-style:normal;font-size:calc(13px*var(--s));}',
    '.isometrico-bar{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(8px*var(--s));padding:calc(8px*var(--s));border-radius:calc(22px*var(--s));}',
    '.isometrico-btn{flex:1;height:calc(70px*var(--s));border-radius:calc(16px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font-weight:600;font-size:calc(15px*var(--s));line-height:1;background:#f3f6fa;color:#33415c;}',
    '.isometrico-btn span{display:grid;place-items:center;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));}',
    '.isometrico-btn svg{width:66%;height:66%}',
    '.isometrico-on{background:linear-gradient(180deg,#ffb36b,#f39540);color:#fff;box-shadow:0 calc(4px*var(--s)) 0 #d27426;}',
    '.isometrico-on span{background:rgba(255,255,255,.28)}'
  ].join('\n');

  var AVATAR = '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#bfe6f7"/><ellipse cx="20" cy="41" rx="13" ry="9" fill="#3d7fd9"/>' +
    '<circle cx="20" cy="21" r="10" fill="#ffd3b0"/><path d="M9.6 20 Q10 9.5 20 9.5 Q30 9.5 30.4 20 Q27 14 20 15 Q14 14 9.6 20Z" fill="#7b4b2a"/>' +
    '<circle cx="16.3" cy="22" r="1.5" fill="#33415c"/><circle cx="23.7" cy="22" r="1.5" fill="#33415c"/>' +
    '<circle cx="13.8" cy="25" r="1.6" fill="#ffaaa5" opacity=".8"/><circle cx="26.2" cy="25" r="1.6" fill="#ffaaa5" opacity=".8"/>' +
    '<path d="M17.4 25.6 Q20 27.8 22.6 25.6" stroke="#9a4a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>';
  var TOME = '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#ffe9a8"/><circle cx="20" cy="23" r="10" fill="#f2c39c"/>' +
    '<path d="M10.5 24 Q12 36 20 36 Q28 36 29.5 24 Q25 28 20 27.5 Q15 28 10.5 24Z" fill="#fff"/><path d="M15 26 Q20 24 25 26 Q20 27.5 15 26Z" fill="#fff"/>' +
    '<circle cx="16.5" cy="21.5" r="1.4" fill="#33415c"/><circle cx="23.5" cy="21.5" r="1.4" fill="#33415c"/>' +
    '<path d="M8.5 17 Q9 7 20 7 Q31 7 31.5 17Z" fill="#ffc83d"/><rect x="6.5" y="15.5" width="27" height="3" rx="1.5" fill="#f2a900"/></svg>';
  var IC_BRIDGE = '<svg viewBox="0 0 24 24"><path d="M2 14 Q12 6 22 14" stroke="#c2672a" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="2" y="14" width="20" height="3" rx="1" fill="#c2672a"/><rect x="10" y="14" width="4" height="3" fill="#ffe3c2" stroke="#e58a3a" stroke-dasharray="1.4 1"/><path d="M3 21 q2.5 -1.6 5 0 t5 0 t5 0 t5 0" stroke="#4fb3dd" stroke-width="1.6" fill="none"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 24 24"><path d="M4 11 L12 5 L20 11" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="11" width="12" height="9" rx="1.5" fill="currentColor"/><rect x="10.5" y="14.5" width="3" height="5.5" rx="1" fill="#f39540"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 24 24"><path d="M9 7 V5.5 a3 3 0 0 1 6 0 V7" stroke="#e58a3a" stroke-width="2" fill="none"/><rect x="5" y="7" width="14" height="13" rx="4" fill="#ffb36b"/><rect x="8" y="12" width="8" height="4.5" rx="1.5" fill="#fff3e0"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 24 24"><path d="M3 6.5 L9 4.5 L15 6.5 L21 4.5 V17.5 L15 19.5 L9 17.5 L3 19.5Z" fill="#9fdcc0"/><path d="M9 4.5 V17.5 M15 6.5 V19.5" stroke="#5bb98c" stroke-width="1.4"/><circle cx="17.5" cy="10" r="1.8" fill="#ef6f5e"/></svg>';

  function buildHUD(root) {
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var hud = document.createElement('div'); hud.className = 'isometrico-hud';
    hud.innerHTML =
      '<div class="isometrico-top isometrico-panel"><div class="isometrico-ava">' + AVATAR + '</div><div class="isometrico-stat">' +
      '<div class="isometrico-row"><span class="isometrico-lvl">Nível 4 <em>·</em> Explorador</span><span class="isometrico-xptxt">620/1000 XP</span></div>' +
      '<div class="isometrico-xp"><div class="isometrico-xpfill"></div></div></div></div>' +
      '<div class="isometrico-quest isometrico-panel"><span class="isometrico-qi">' + IC_BRIDGE + '</span><div class="isometrico-qt"><b>Missão</b>Consertar a ponte da vila</div><span class="isometrico-check"></span></div>' +
      '<div class="isometrico-bub isometrico-panel"><span class="isometrico-bav">' + TOME + '</span><div><span class="isometrico-name">Mestre Tomé</span><div class="isometrico-say">A viga precisa se apoiar dos dois lados!</div></div><span class="isometrico-tail"></span></div>' +
      '<div class="isometrico-plus"><i>XP</i>+50 XP</div>' +
      '<div class="isometrico-bar isometrico-panel"><div class="isometrico-btn isometrico-on"><span>' + IC_BUILD + '</span>Construir</div><div class="isometrico-btn"><span style="background:#ffe9d2">' + IC_BAG + '</span>Mochila</div><div class="isometrico-btn"><span style="background:#dff3ea">' + IC_MAP + '</span>Mapa</div></div>';
    root.appendChild(hud);
    return {
      hud: hud,
      fill: hud.querySelector('.isometrico-xpfill'),
      txt: hud.querySelector('.isometrico-xptxt'),
      bub: hud.querySelector('.isometrico-bub'),
      tail: hud.querySelector('.isometrico-tail'),
      plus: hud.querySelector('.isometrico-plus'),
      quest: hud.querySelector('.isometrico-quest'),
      check: hud.querySelector('.isometrico-check'),
      bar: hud.querySelector('.isometrico-bar')
    };
  }

  function roundedShape(x0, z0, x1, z1, r) { // r: [r(x0,z0), r(x1,z0), r(x1,z1), r(x0,z1)] ; shape y = -z
    var s = new THREE.Shape();
    var p = [[x0, z0, r[0]], [x1, z0, r[1]], [x1, z1, r[2]], [x0, z1, r[3]]];
    // walk the corners
    function pt(x, z) { return [x, -z]; }
    var a = pt(x0 + r[0], z0); s.moveTo(a[0], a[1]);
    var b = pt(x1 - r[1], z0); s.lineTo(b[0], b[1]);
    if (r[1]) { var c = pt(x1, z0), d = pt(x1, z0 + r[1]); s.quadraticCurveTo(c[0], c[1], d[0], d[1]); }
    b = pt(x1, z1 - r[2]); s.lineTo(b[0], b[1]);
    if (r[2]) { c = pt(x1, z1); d = pt(x1 - r[2], z1); s.quadraticCurveTo(c[0], c[1], d[0], d[1]); }
    b = pt(x0 + r[3], z1); s.lineTo(b[0], b[1]);
    if (r[3]) { c = pt(x0, z1); d = pt(x0, z1 - r[3]); s.quadraticCurveTo(c[0], c[1], d[0], d[1]); }
    b = pt(x0, z0 + r[0]); s.lineTo(b[0], b[1]);
    if (r[0]) { c = pt(x0, z0); d = pt(x0 + r[0], z0); s.quadraticCurveTo(c[0], c[1], d[0], d[1]); }
    return s;
  }

  function mount(host) {
    var reduced = false;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var root = document.createElement('div'); root.className = 'isometrico-root';
    host.appendChild(root);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    var fade = document.createElement('div'); fade.className = 'isometrico-fade'; root.appendChild(fade);
    var H = buildHUD(root);

    var scene = new THREE.Scene();
    var textures = [];
    function tex(c) { var t = new THREE.CanvasTexture(c); textures.push(t); return t; }
    scene.background = tex(skyCanvas());

    var camera = new THREE.OrthographicCamera(-5, 5, 10, -10, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xf4fbff, 0xb7a58a, 0.62));
    var sun = new THREE.DirectionalLight(0xfff0d6, 0.62);
    sun.position.set(-6, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.001;
    scene.add(sun); scene.add(sun.target);
    var fill = new THREE.DirectionalLight(0xdff2ff, 0.18); fill.position.set(8, 4, 6); scene.add(fill);

    var matCache = {};
    function mat(c, flat, extra) {
      var k = c + (flat ? 'f' : '') + (extra ? JSON.stringify(extra) : '');
      if (!matCache[k]) {
        var o = { color: c, roughness: 0.92, metalness: 0, flatShading: !!flat };
        if (extra) for (var p in extra) o[p] = extra[p];
        matCache[k] = new THREE.MeshStandardMaterial(o);
      }
      return matCache[k];
    }
    var unitBox = new THREE.BoxGeometry(1, 1, 1);
    var sphere = new THREE.SphereGeometry(1, 16, 12);
    var cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
    var cone4 = new THREE.CylinderGeometry(0, 1, 1, 4); cone4.rotateY(Math.PI / 4);
    var cone = new THREE.CylinderGeometry(0, 1, 1, 12);
    var extra = [];
    function M(geo, c, x, y, z, sx, sy, sz, parent, flat, ex) {
      var m = new THREE.Mesh(geo, mat(c, flat, ex));
      m.position.set(x, y, z); m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
      m.castShadow = true; m.receiveShadow = true;
      (parent || scene).add(m); return m;
    }
    function extrude(shape, depth, y, c, bevel) {
      var g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: !!bevel, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 8 });
      g.rotateX(-Math.PI / 2); g.translate(0, y, 0); extra.push(g);
      var m = new THREE.Mesh(g, mat(c)); m.receiveShadow = true; m.castShadow = true; scene.add(m); return m;
    }

    /* --- the floating island --- */
    var X0 = -4.2, X1 = 4.2, Z0 = -7.2, Z1 = 7.2, RIV = 1.4, R = 1.5;
    var island = new THREE.Group(); scene.add(island);
    // grass slabs (two banks)
    extrude(roundedShape(X0, Z0, X1, -RIV, [R, R, 0, 0]), 0.22, -0.22, '#8fd36f');
    extrude(roundedShape(X0, RIV, X1, Z1, [0, 0, R, R]), 0.22, -0.22, '#8fd36f');
    extrude(roundedShape(X0, Z0, X1, -RIV, [R, R, 0, 0]), 0.5, -0.72, '#c08a5b');
    extrude(roundedShape(X0, RIV, X1, Z1, [0, 0, R, R]), 0.5, -0.72, '#c08a5b');
    // base strata, whole footprint
    extrude(roundedShape(X0, Z0, X1, Z1, [R, R, R, R]), 0.9, -1.62, '#a8774c');
    extrude(roundedShape(X0 + 0.15, Z0 + 0.15, X1 - 0.15, Z1 - 0.15, [R, R, R, R]), 0.7, -2.32, '#8c6a52');
    // pebbles in strata (decor on visible sides)
    for (var pi = 0; pi < 26; pi++) {
      var onX = pi % 2 === 0;
      var px = onX ? X1 + 0.02 : X0 + 1.5 + hash(pi, 3) * (X1 - X0 - 3);
      var pz = onX ? Z0 + 1.5 + hash(pi, 4) * (Z1 - Z0 - 3) : Z1 + 0.02;
      if (onX && Math.abs(pz) < RIV + 0.2) continue;
      M(sphere, hash(pi, 5) > 0.5 ? '#d6b48c' : '#7a5a44', px, -0.9 - hash(pi, 6) * 1.2, pz, 0.12 + hash(pi, 7) * 0.08, 0.08, 0.12, null, true);
    }
    // rocky underside (faceted)
    var under = new THREE.CylinderGeometry(1, 0.15, 1, 9, 2); extra.push(under);
    var pos = under.attributes.position;
    for (var vi = 0; vi < pos.count; vi++) {
      if (pos.getY(vi) < 0.49) { pos.setX(vi, pos.getX(vi) * (0.85 + hash(vi, 1) * 0.3)); pos.setZ(vi, pos.getZ(vi) * (0.85 + hash(vi, 2) * 0.3)); }
    }
    under.computeVertexNormals();
    M(under, '#7d6150', 0, -3.6, 0, 3.4, 2.6, 6.0, null, true);
    M(under, '#6c5244', 1.4, -4.4, 3.5, 1.4, 1.6, 1.6, null, true);
    M(under, '#6c5244', -1.2, -4.2, -3.8, 1.5, 1.7, 1.6, null, true);
    // tiny floating rocks
    var floaters = [];
    [[5.6, -2.2, 3.5, 0.45], [-5.4, -1.6, -3, 0.35], [4.8, -4.5, -5, 0.3]].forEach(function (f) {
      var g = new THREE.Group(); g.position.set(f[0], f[1], f[2]); scene.add(g);
      M(under, '#7d6150', 0, -0.25, 0, f[3] * 1.4, f[3] * 1.4, f[3] * 1.4, g, true);
      M(cyl, '#8fd36f', 0, 0.12, 0, f[3] * 1.3, 0.12, f[3] * 1.3, g);
      g.userData.y = f[1]; floaters.push(g);
    });

    /* --- river, waterfall --- */
    var wTex = tex(waterCanvas()); wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping; wTex.repeat.set(2, 1);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x5cc2e6, map: wTex, roughness: 0.25, transparent: true, opacity: 0.88 });
    var river = new THREE.Mesh(unitBox, waterMat);
    river.scale.set(X1 - X0, 0.9, RIV * 2); river.position.set(0, -0.38 - 0.45, 0); river.receiveShadow = true; scene.add(river);
    M(unitBox, '#e9d3a4', 0, -1.4, 0, X1 - X0 - 0.02, 0.2, RIV * 2 - 0.02);
    var fTex = tex(fallCanvas()); fTex.wrapS = fTex.wrapT = THREE.RepeatWrapping; fTex.repeat.set(2, 2);
    var fallMat = new THREE.MeshBasicMaterial({ color: 0x8fdaf2, map: fTex, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
    var fall = new THREE.Mesh(new THREE.PlaneGeometry(RIV * 2 - 0.3, 3.6), fallMat);
    fall.rotation.y = Math.PI / 2; fall.position.set(X1 + 0.12, -0.4 - 1.8, 0); scene.add(fall);
    var lip = M(cyl, '#bde9f7', X1 + 0.05, -0.38, 0, 0.14, RIV * 2 - 0.2, 0.14); lip.rotation.x = Math.PI / 2; lip.castShadow = false;
    var mist = [];
    for (var mi = 0; mi < 6; mi++) {
      var mm = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      mm.position.set(X1 + 0.3, -3.9, -0.9 + mi * 0.36); mm.userData.p = mi; scene.add(mm); mist.push(mm);
    }
    // stones & lily pads in the river
    [[-2.8, 0.7], [2.6, -0.8], [-1.6, -0.9]].forEach(function (p) { M(sphere, '#b9b4c4', p[0], -0.38, p[1], 0.22, 0.1, 0.18, null, true); });
    var lilies = [];
    [[-3.2, -0.5], [1.8, 0.8], [3.3, 0.3]].forEach(function (p, i) {
      var l = M(cyl, '#6cc06a', p[0], -0.35, p[1], 0.2, 0.02, 0.2); l.castShadow = false;
      if (i !== 1) M(sphere, '#ffb3c7', 0, 2.5, 0, 0.3, 2.5, 0.3, l);
      lilies.push(l);
    });
    // duck
    var duck = new THREE.Group(); scene.add(duck);
    M(sphere, '#fff7d6', 0, 0, 0, 0.16, 0.11, 0.12, duck);
    M(sphere, '#fff7d6', 0.12, 0.12, 0, 0.08, 0.08, 0.08, duck);
    M(cone, '#ff9a3c', 0.22, 0.12, 0, 0.03, 0.08, 0.03, duck).rotation.z = -Math.PI / 2;

    /* --- bridge --- */
    var BRN = '#8a5a3a', PL = '#d29b62', PL2 = '#c18752', deckY = 0.08;
    M(unitBox, BRN, -0.55, -0.02, 0, 0.14, 0.14, 4.4);
    M(unitBox, BRN, 0.55, -0.02, 0, 0.14, 0.14, 4.4);
    var plankZ = [], GAPZ = 0.0;
    for (var k = 0; k < 9; k++) {
      var z = -2.0 + k * 0.5;
      plankZ.push(z);
      if (Math.abs(z - GAPZ) < 0.01) continue;
      M(unitBox, k % 2 ? PL : PL2, 0, deckY, z + 0.0, 1.3, 0.08, 0.44);
    }
    [[-0.62, -2.1], [0.62, -2.1], [-0.62, 2.1], [0.62, 2.1], [-0.62, 0], [0.62, 0]].forEach(function (p) {
      M(cyl, BRN, p[0], 0.25, p[1], 0.06, 0.7, 0.06);
      M(sphere, '#e2ad72', p[0], 0.62, p[1], 0.075);
    });
    M(unitBox, '#e2ad72', -0.62, 0.5, 0, 0.06, 0.06, 4.2); M(unitBox, '#e2ad72', 0.62, 0.5, 0, 0.06, 0.06, 4.2);

    /* --- houses --- */
    function house(x, z, w, d, hgt, wall, roof, rot, chimney) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g);
      M(unitBox, '#d9c7aa', 0, 0.06, 0, w + 0.14, 0.12, d + 0.14, g);
      M(unitBox, wall, 0, 0.12 + hgt / 2, 0, w, hgt, d, g);
      var r = M(cone4, roof, 0, 0.12 + hgt + 0.42, 0, w * 0.82, 0.84, d * 0.82, g);
      M(unitBox, roof, 0, 0.12 + hgt + 0.02, 0, w + 0.24, 0.06, d + 0.24, g);
      M(unitBox, '#9a5b3c', 0, 0.12 + 0.36, d / 2 + 0.01, 0.34, 0.66, 0.04, g);
      M(sphere, '#ffd24d', 0.1, 0.48, d / 2 + 0.035, 0.03, 0.03, 0.02, g);
      [-1, 1].forEach(function (s) {
        M(unitBox, '#ffffff', s * w * 0.3, 0.12 + hgt * 0.62, d / 2 + 0.01, 0.32, 0.32, 0.03, g);
        M(unitBox, '#7fc8ea', s * w * 0.3, 0.12 + hgt * 0.62, d / 2 + 0.025, 0.24, 0.24, 0.03, g);
        M(unitBox, '#ffffff', w / 2 + 0.01, 0.12 + hgt * 0.62, s * d * 0.25, 0.03, 0.3, 0.3, g);
        M(unitBox, '#7fc8ea', w / 2 + 0.025, 0.12 + hgt * 0.62, s * d * 0.25, 0.03, 0.22, 0.22, g);
      });
      M(unitBox, '#a8683a', -w * 0.3, 0.12 + hgt * 0.62 - 0.22, d / 2 + 0.06, 0.38, 0.08, 0.1, g);
      M(sphere, '#ff8fa3', -w * 0.3 - 0.1, 0.12 + hgt * 0.62 - 0.15, d / 2 + 0.06, 0.06, 0.06, 0.06, g);
      M(sphere, '#ffd24d', -w * 0.3 + 0.1, 0.12 + hgt * 0.62 - 0.15, d / 2 + 0.06, 0.06, 0.06, 0.06, g);
      if (chimney) M(unitBox, '#c9b9a8', w * 0.25, 0.12 + hgt + 0.55, -d * 0.15, 0.2, 0.5, 0.2, g);
      return g;
    }
    house(0.6, -4.7, 1.9, 1.5, 1.05, '#fff1dc', '#ef6f5e', 0, true);
    house(2.6, -2.7, 1.1, 1.0, 0.8, '#fdebd3', '#4fb3c9', -Math.PI / 2);
    house(-2.4, -5.6, 1.2, 1.1, 0.85, '#fff6e6', '#f4b740', 0.3);
    house(2.5, 4.7, 1.4, 1.2, 0.9, '#fff1dc', '#9b7bd6', -Math.PI / 2 + 0.0, true);

    /* --- trees --- */
    var treeSways = [];
    function tree(x, z, s, c) {
      var g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      M(cyl, '#8a5a3a', 0, 0.3 * s, 0, 0.08 * s, 0.6 * s, 0.08 * s, g);
      var top = new THREE.Group(); top.position.y = 0.6 * s; g.add(top);
      M(sphere, c || '#5fbf6a', 0, 0.38 * s, 0, 0.48 * s, 0.46 * s, 0.48 * s, top);
      M(sphere, c ? c : '#6fcb72', 0.22 * s, 0.62 * s, 0.1 * s, 0.3 * s, 0.28 * s, 0.3 * s, top);
      treeSways.push(top);
      return g;
    }
    function pine(x, z, s) {
      M(cyl, '#8a5a3a', x, 0.15 * s, z, 0.06 * s, 0.3 * s, 0.06 * s);
      M(cone, '#3f9e64', x, 0.65 * s, z, 0.42 * s, 0.8 * s, 0.42 * s);
      M(cone, '#4fb371', x, 1.05 * s, z, 0.3 * s, 0.6 * s, 0.3 * s);
    }
    tree(-3.0, -2.6, 1.0); tree(3.4, -4.8, 0.9, '#7ccf6e'); tree(-1.0, -6.4, 0.85, '#70c46b'); pine(-3.4, -4.2, 1.1); pine(3.5, -6.4, 1.0);
    tree(-3.2, 2.4, 1.05, '#7ccf6e'); tree(-3.0, 6.0, 0.95); pine(3.5, 2.3, 1.0); tree(0.9, 6.3, 0.8, '#70c46b'); pine(-1.4, 6.6, 0.8);
    // bushes
    [[-1.4, -2.2], [1.6, -2.0], [3.4, 6.2], [-3.6, 4.4], [1.4, 2.2]].forEach(function (b, i) {
      M(sphere, i % 2 ? '#6fcb72' : '#5fbf6a', b[0], 0.12, b[1], 0.28, 0.22, 0.28);
    });

    /* --- paths, fence, flowers, wheelbarrow, crates --- */
    for (var s1 = 0; s1 < 6; s1++) M(cyl, '#efe0c2', ((s1 % 2) - 0.5) * 0.18, 0.01, 2.0 + s1 * 0.75, 0.26, 0.03, 0.2).castShadow = false;
    for (s1 = 0; s1 < 4; s1++) M(cyl, '#efe0c2', ((s1 % 2) - 0.5) * 0.18 + 0.15, 0.01, -2.0 - s1 * 0.65, 0.24, 0.03, 0.2).castShadow = false;
    // garden with fence (near bank, left)
    var gx0 = -2.8, gx1 = -1.1, gz0 = 3.4, gz1 = 5.2;
    M(unitBox, '#a7774f', (gx0 + gx1) / 2, 0.03, (gz0 + gz1) / 2, gx1 - gx0 - 0.1, 0.06, gz1 - gz0 - 0.1);
    for (var r1 = 0; r1 < 3; r1++) for (var c1 = 0; c1 < 3; c1++) {
      M(sphere, ['#ff8fa3', '#ffd24d', '#b49cff'][(r1 + c1) % 3], gx0 + 0.35 + c1 * 0.5, 0.12, gz0 + 0.35 + r1 * 0.55, 0.09);
      M(sphere, '#6cc06a', gx0 + 0.35 + c1 * 0.5, 0.06, gz0 + 0.42 + r1 * 0.55, 0.1, 0.05, 0.1);
    }
    function fenceLine(xa, za, xb, zb) {
      var n = Math.round(Math.hypot(xb - xa, zb - za) / 0.35);
      for (var i = 0; i <= n; i++) M(unitBox, '#fff6e6', lerp(xa, xb, i / n), 0.16, lerp(za, zb, i / n), 0.06, 0.32, 0.06);
      var rl = M(unitBox, '#fff6e6', (xa + xb) / 2, 0.22, (za + zb) / 2, Math.abs(xb - xa) + 0.04, 0.04, Math.abs(zb - za) + 0.04);
    }
    fenceLine(gx0, gz0, gx1, gz0); fenceLine(gx0, gz1, gx1, gz1); fenceLine(gx0, gz0, gx0, gz1); fenceLine(gx1, gz0, gx1, gz0 + 0.8);
    // wheelbarrow with planks
    var wb = new THREE.Group(); wb.position.set(1.35, 0, 3.1); wb.rotation.y = 0.5; scene.add(wb);
    M(unitBox, '#ef6f5e', 0, 0.3, 0, 0.42, 0.18, 0.62, wb);
    M(unitBox, '#d8574a', 0, 0.22, 0, 0.36, 0.06, 0.54, wb);
    var wheel = M(cyl, '#4a4f63', 0, 0.12, 0.38, 0.11, 0.06, 0.11, wb); wheel.rotation.z = Math.PI / 2;
    M(unitBox, '#8a5a3a', -0.15, 0.3, -0.42, 0.04, 0.04, 0.5, wb); M(unitBox, '#8a5a3a', 0.15, 0.3, -0.42, 0.04, 0.04, 0.5, wb);
    M(unitBox, PL, 0, 0.43, 0, 0.12, 0.05, 0.8, wb); M(unitBox, PL2, 0.1, 0.47, 0.02, 0.12, 0.05, 0.8, wb);
    // crates & barrel near the bridge
    M(unitBox, '#d9a066', -1.1, 0.17, 2.2, 0.34, 0.34, 0.34); M(unitBox, '#e0ae78', -1.1, 0.5, 2.2, 0.3, 0.3, 0.3);
    M(cyl, '#b07a4a', 1.2, 0.2, -2.3, 0.16, 0.4, 0.16);
    // flowers scattered
    var fc = ['#ff8fa3', '#ffd24d', '#ffffff', '#b49cff', '#ff9a3c'];
    for (var f = 0; f < 40; f++) {
      var fx = X0 + 0.4 + hash(f, 11) * (X1 - X0 - 0.8), fz = Z0 + 0.6 + hash(f, 12) * (Z1 - Z0 - 1.2);
      if (Math.abs(fz) < RIV + 0.3 || Math.abs(fx) < 0.7) continue;
      M(sphere, fc[f % 5], fx, 0.05, fz, 0.05).castShadow = false;
    }
    // lamp post
    M(cyl, '#4a4f63', 0.95, 0.45, 2.2, 0.03, 0.9, 0.03); M(sphere, '#fff1b0', 0.95, 0.92, 2.2, 0.08, 0.08, 0.08, null, false, { emissive: 0xffe9a0, emissiveIntensity: 0.4 });

    /* --- clouds --- */
    var clouds = [];
    [[-6, 2, -8, 1.1], [6, -2.5, 6, 1.3], [-5.5, -5, 4, 1.0], [5, 4, -9, 0.9]].forEach(function (c) {
      var g = new THREE.Group(); g.position.set(c[0], c[1], c[2]); g.scale.setScalar(c[3]); scene.add(g);
      [[0, 0, 0, 0.8], [0.7, -0.1, 0.1, 0.55], [-0.7, -0.15, 0, 0.5], [0.2, 0.3, -0.2, 0.55]].forEach(function (b) {
        var m = new THREE.Mesh(sphere, mat('#ffffff', false, { emissive: 0xffffff, emissiveIntensity: 0.35 })); m.position.set(b[0], b[1], b[2]); m.scale.set(b[3], b[3] * 0.7, b[3]); g.add(m);
      });
      g.userData.x = c[0]; clouds.push(g);
    });

    /* --- characters (small, round) --- */
    function pivot(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
    var SK = '#ffd3b0';
    var hero = new THREE.Group(); scene.add(hero);
    var hb = pivot(hero, 0, 0, 0);
    var legL = pivot(hb, -0.07, 0.2, 0), legR = pivot(hb, 0.07, 0.2, 0);
    [legL, legR].forEach(function (l) { M(cyl, '#2d5ba8', 0, -0.09, 0, 0.05, 0.18, 0.05, l); M(sphere, '#6b3f26', 0, -0.18, 0.02, 0.06, 0.04, 0.08, l); });
    M(sphere, '#3d7fd9', 0, 0.34, 0, 0.15, 0.18, 0.13, hb);
    var armL = pivot(hb, -0.15, 0.42, 0), armR = pivot(hb, 0.15, 0.42, 0);
    [armL, armR].forEach(function (a) { M(cyl, '#3d7fd9', 0, -0.07, 0, 0.035, 0.15, 0.035, a); M(sphere, SK, 0, -0.16, 0, 0.04, 0.04, 0.04, a); });
    M(unitBox, '#ff9a3c', 0, 0.37, -0.15, 0.2, 0.22, 0.1, hb);
    M(unitBox, '#f07a24', 0, 0.46, -0.155, 0.21, 0.06, 0.11, hb);
    var head = pivot(hb, 0, 0.66, 0);
    M(sphere, SK, 0, 0, 0, 0.17, 0.16, 0.16, head);
    var hr = M(sphere, '#7b4b2a', 0, 0.05, -0.025, 0.18, 0.14, 0.165, head);
    M(sphere, '#33415c', -0.06, -0.0, 0.145, 0.022, 0.03, 0.015, head); M(sphere, '#33415c', 0.06, -0.0, 0.145, 0.022, 0.03, 0.015, head);
    M(sphere, '#ffaaa5', -0.1, -0.05, 0.12, 0.03, 0.02, 0.015, head); M(sphere, '#ffaaa5', 0.1, -0.05, 0.12, 0.03, 0.02, 0.015, head);

    var tome = new THREE.Group(); scene.add(tome);
    var tb = pivot(tome, 0, 0, 0);
    [-0.08, 0.08].forEach(function (x) { M(cyl, '#6a6f86', x, 0.11, 0, 0.055, 0.22, 0.055, tb); M(sphere, '#4a2e1e', x, 0.02, 0.02, 0.065, 0.04, 0.09, tb); });
    M(sphere, '#f4ecdc', 0, 0.42, 0, 0.19, 0.22, 0.16, tb);
    M(sphere, '#8b5a2b', 0, 0.38, 0.05, 0.17, 0.19, 0.13, tb);
    var tA1 = pivot(tb, -0.19, 0.52, 0), tA2 = pivot(tb, 0.19, 0.52, 0);
    [tA1, tA2].forEach(function (a) { M(cyl, '#f4ecdc', 0, -0.08, 0, 0.04, 0.17, 0.04, a); M(sphere, '#f2c39c', 0, -0.18, 0, 0.045, 0.045, 0.045, a); });
    var th = pivot(tb, 0, 0.8, 0);
    M(sphere, '#f2c39c', 0, 0, 0, 0.17, 0.16, 0.16, th);
    M(sphere, '#ffffff', 0, -0.08, 0.07, 0.15, 0.13, 0.11, th);
    M(sphere, '#33415c', -0.06, 0.03, 0.145, 0.02, 0.026, 0.014, th); M(sphere, '#33415c', 0.06, 0.03, 0.145, 0.02, 0.026, 0.014, th);
    M(sphere, '#ffc83d', 0, 0.05, 0, 0.19, 0.13, 0.19, th);
    M(cyl, '#f2a900', 0, 0.06, 0.02, 0.23, 0.02, 0.22, th);
    tome.position.set(-0.85, 0, -2.75); tome.rotation.y = 0.45;

    /* --- missing beam & fx --- */
    var beamMat = new THREE.MeshStandardMaterial({ color: 0xe0a466, roughness: 0.8, emissive: 0xffd27a, emissiveIntensity: 0 });
    var beam = new THREE.Mesh(unitBox, beamMat); beam.scale.set(1.3, 0.08, 0.44); beam.castShadow = true; scene.add(beam);
    var slot = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, depthWrite: false }));
    slot.scale.set(1.3, 0.05, 0.44); slot.position.set(0, deckY, GAPZ); scene.add(slot);
    var marker = new THREE.Group(); scene.add(marker);
    M(cone, '#ffb34d', 0, 0, 0, 0.12, 0.22, 0.12, marker).rotation.x = Math.PI;
    var starTex = tex(starCanvas());
    var stars = [];
    for (var si = 0; si < 10; si++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false }));
      var a = si / 10 * Math.PI * 2;
      sp.userData = { dx: Math.cos(a), dz: Math.sin(a), up: 0.5 + (si % 3) * 0.25, sz: 0.22 + (si % 2) * 0.1 };
      sp.visible = false; scene.add(sp); stars.push(sp);
    }
    var dust = [];
    for (si = 0; si < 8; si++) {
      var dm = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, depthWrite: false }));
      var b2 = si / 8 * Math.PI * 2; dm.userData = { dx: Math.cos(b2), dz: Math.sin(b2) * 0.6 };
      dm.visible = false; scene.add(dm); dust.push(dm);
    }

    /* --- layout --- */
    var W = 1, Hgt = 1, S = 1, viewW = 9.8;
    function layout() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, r.width); Hgt = Math.max(1, r.height);
      S = clamp(W / 390, 0.78, 1.35);
      H.hud.style.setProperty('--s', S.toFixed(3));
      renderer.setSize(W, Hgt, false);
      var asp = W / Hgt;
      // island fits the width; in very tall screens keep a minimum height coverage
      var vw = Math.max(viewW, 15 * asp);
      var vh = vw / asp;
      // shift the frustum so the island sits between HUD and buttons
      var off = vh * 0.02;
      camera.left = -vw / 2; camera.right = vw / 2; camera.top = vh / 2 + off; camera.bottom = -vh / 2 + off;
      camera.updateProjectionMatrix();
    }
    layout();
    var ro = new ResizeObserver(layout); ro.observe(host);
    var tmpV = new THREE.Vector3();
    function toScreen(obj, y) {
      obj.getWorldPosition(tmpV); tmpV.y += y || 0; tmpV.project(camera);
      return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * Hgt };
    }

    var t0 = performance.now(), raf = 0;
    var EL = Math.atan(1 / Math.sqrt(2)); // true isometric elevation
    var target = new THREE.Vector3(0.2, -0.6, 0.4);
    var HERO_Z0 = 5.2, HERO_Z1 = 2.55;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = typeof window.__SCENE_TIME === 'number' ? window.__SCENE_TIME : ((now - t0) / 1000) % LOOP;
      var w = Math.PI * 2 / LOOP;
      var amp = reduced ? 0.1 : 1;
      var cyc = 0.5 - 0.5 * Math.cos(t * w);
      var az = (26 + Math.sin(t * w) * 4 * amp) * Math.PI / 180;
      var dist = 40;
      camera.position.set(target.x + Math.sin(az) * Math.cos(EL) * dist, target.y + Math.sin(EL) * dist, target.z + Math.cos(az) * Math.cos(EL) * dist);
      camera.lookAt(target);
      camera.zoom = 1 + cyc * 0.07 * amp;
      camera.updateProjectionMatrix();

      wTex.offset.x = -(t / LOOP);
      fTex.offset.y = (t / LOOP) * 2;
      mist.forEach(function (m) { var k = ((t / LOOP) * 2 + m.userData.p / 6) % 1; m.scale.setScalar(0.12 + k * 0.25); m.position.y = -3.9 + k * 0.3; m.material.opacity = 0.7 * (1 - k); });
      lilies.forEach(function (l, i) { l.position.y = -0.35 + Math.sin(t * w + i * 2) * 0.015; });
      floaters.forEach(function (g, i) { g.position.y = g.userData.y + Math.sin(t * w + i * 2) * 0.15; });
      clouds.forEach(function (c, i) { c.position.x = c.userData.x + Math.sin(t * w + i) * 0.3; });
      treeSways.forEach(function (tp, i) { tp.rotation.z = Math.sin(t * w + i) * 0.03; });
      var dk = (t / LOOP);
      duck.position.set(lerp(-3.6, 3.0, dk) + 0, -0.33 + Math.sin(t * 8) * 0.01, 0.75 - Math.sin(dk * Math.PI) * 0.15);
      duck.visible = dk < 0.95 && dk > 0.04;
      duck.scale.setScalar(Math.min(1, sstep(0.04, 0.1, dk) * (1 - sstep(0.88, 0.95, dk))) + 0.0001);

      // hero walk
      var walkK = sstep(0, 1.25, t), walking = t < 1.25;
      hero.position.set(0, 0, lerp(HERO_Z0, HERO_Z1, walkK));
      hero.rotation.y = Math.PI + (walking ? 0 : Math.sin(t * 2) * 0.1);
      var cy2 = Math.sin(t * 13);
      var wa = walking ? sstep(0, 0.15, t) * (1 - sstep(1.05, 1.25, t)) : 0;
      legL.rotation.x = cy2 * 0.7 * wa; legR.rotation.x = -cy2 * 0.7 * wa;
      armL.rotation.x = -cy2 * 0.6 * wa; armR.rotation.x = cy2 * 0.6 * wa;
      hb.position.y = Math.abs(cy2) * 0.03 * wa;
      var hop = t > 2.3 && t < 2.75 ? Math.sin((t - 2.3) / 0.45 * Math.PI) : 0;
      hb.position.y += hop * 0.2;
      armL.rotation.z = hop > 0 ? -hop * 2.3 : 0; armR.rotation.z = hop > 0 ? hop * 2.3 : 0;

      // mentor
      var point = sstep(0.7, 1.0, t) * (1 - sstep(2.9, 3.2, t));
      tA2.rotation.x = -point * 1.4; tA2.rotation.z = point * 0.3;
      var cheer = t > 2.3 && t < 2.9 ? Math.sin((t - 2.3) / 0.6 * Math.PI) : 0;
      tA1.rotation.z = -cheer * 2.4;
      tb.position.y = cheer * 0.06;
      th.rotation.z = Math.sin(t * w * 2) * 0.06;

      // beam
      var LAND = 2.2;
      if (t < 1.6 || t > 3.33) beam.visible = false;
      else {
        beam.visible = true;
        var by;
        if (t < LAND) { var e = clamp((t - 1.6) / (LAND - 1.6), 0, 1); e = e * e; by = lerp(3.0, deckY, e); beam.rotation.set(0, (1 - e) * 1.0, 0); }
        else { var ft = t - LAND; by = deckY + Math.abs(Math.sin(ft * 16)) * Math.exp(-ft * 10) * 0.12; beam.rotation.set(0, 0, 0); }
        var ap = t < 1.75 ? outBack(clamp((t - 1.6) / 0.15, 0, 1)) : 1;
        beam.scale.set(1.3 * ap, 0.08 * ap, 0.44 * ap);
        beam.position.set(0, by, GAPZ);
        beamMat.emissiveIntensity = t < LAND ? 0.2 : 0.6 * Math.exp(-(t - LAND) * 4);
      }
      var on = t < LAND ? 1 : 1 - sstep(LAND, LAND + 0.15, t);
      var pulse = 0.5 + 0.5 * Math.sin(t * 9);
      slot.material.opacity = on * (0.35 + 0.35 * pulse);
      slot.visible = on > 0.01;
      marker.visible = t < 1.6;
      marker.position.set(0, 0.62 + Math.abs(Math.sin(t * 5)) * 0.18, GAPZ);
      marker.scale.setScalar(1 - sstep(1.45, 1.6, t) + 0.0001);
      var ft2 = t - LAND;
      stars.forEach(function (s) {
        if (ft2 > 0 && ft2 < 0.75) {
          s.visible = true; var k = ft2 / 0.75, d = s.userData;
          s.position.set(d.dx * (0.4 + k * 0.8), deckY + 0.2 + d.up * Math.sin(k * Math.PI * 0.8), GAPZ + d.dz * (0.25 + k * 0.5));
          var z = d.sz * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.7);
          s.scale.set(z, z, z); s.material.opacity = 1 - k * k; s.material.rotation = k * 2;
        } else s.visible = false;
      });
      dust.forEach(function (d) {
        if (ft2 > 0 && ft2 < 0.6) {
          d.visible = true; var k = ft2 / 0.6;
          d.position.set(d.userData.dx * (0.6 + k * 0.4), deckY + 0.05 + k * 0.15, GAPZ + d.userData.dz * (0.3 + k * 0.3));
          d.scale.setScalar(0.07 + k * 0.08); d.material.opacity = 0.9 * (1 - k);
        } else d.visible = false;
      });

      var fo = t > 3.05 ? (t < 3.33 ? sstep(3.05, 3.33, t) : 1 - sstep(3.33, 3.6, t)) : 0;
      fade.style.opacity = fo.toFixed(3);

      renderer.render(scene, camera);

      // HUD
      var bubIn = sstep(0.8, 1.0, t), bubOut = 1 - sstep(2.3, 2.5, t);
      var hp = toScreen(th, 0.3);
      var bw = H.bub.offsetWidth, bh = H.bub.offsetHeight;
      var bx = clamp(hp.x - bw * 0.35, 10, W - bw - 10);
      var minTop = H.quest.offsetTop + H.quest.offsetHeight + 12 * S;
      var byy = Math.max(minTop, hp.y - bh - 16 * S);
      var pop = bubIn < 1 ? outBack(bubIn) : 1;
      H.bub.style.opacity = (bubIn * bubOut).toFixed(3);
      H.bub.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + byy.toFixed(1) + 'px) scale(' + (0.6 + 0.4 * pop).toFixed(3) + ')';
      H.tail.style.left = clamp(hp.x - bx - 9 * S, 16 * S, bw - 34 * S).toFixed(1) + 'px';
      var pt = clamp((t - 2.4) / 0.8, 0, 1);
      var bp = toScreen(slot, 0.4);
      H.plus.style.opacity = (pt > 0 && pt < 1 ? (pt < 0.15 ? pt / 0.15 : 1 - sstep(0.6, 1, pt)) : 0).toFixed(3);
      H.plus.style.transform = 'translate(' + (bp.x - 50 * S).toFixed(1) + 'px,' + (bp.y - 30 * S - pt * 80 * S).toFixed(1) + 'px) scale(' + (0.7 + 0.3 * outBack(clamp(pt / 0.25, 0, 1))).toFixed(3) + ')';
      var fv = 620 + 50 * sstep(2.55, 2.95, t) * (1 - sstep(3.1, 3.5, t));
      H.fill.style.width = (fv / 10).toFixed(2) + '%';
      H.txt.textContent = Math.round(fv) + '/1000 XP';
      var done = sstep(2.25, 2.4, t) * (1 - sstep(3.1, 3.4, t));
      H.check.style.background = done > 0.5 ? '#41b883' : 'transparent';
      H.check.style.borderColor = done > 0.5 ? '#41b883' : '#c9d5e3';
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        ro.disconnect();
        var geos = [], mats = [];
        scene.traverse(function (o) {
          if (o.geometry && geos.indexOf(o.geometry) < 0) geos.push(o.geometry);
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (mats.indexOf(m) < 0) mats.push(m); });
        });
        geos.forEach(function (g) { g.dispose(); });
        mats.forEach(function (m) { m.dispose(); });
        textures.forEach(function (t) { t.dispose(); });
        extra.forEach(function (g) { g.dispose(); });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        host.innerHTML = '';
      }
    };
  }

  window.SCENES[ID] = { mount: mount };
})();
