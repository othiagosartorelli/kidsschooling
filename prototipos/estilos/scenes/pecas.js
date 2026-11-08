/* Estilo PEÇAS DE MONTAR — KidsSchooling
   Mundo de peças de plástico brilhante com pinos, base verde, personagens de corpo arredondado.
   Loop de 3,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'pecas';
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
    grd.addColorStop(0, '#3f9bff'); grd.addColorStop(0.5, '#8fd0ff'); grd.addColorStop(1, '#e8f6ff');
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    return c;
  }
  function starCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.translate(32, 32);
    var grd = g.createRadialGradient(0, 0, 2, 0, 0, 30);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#fff27a'); grd.addColorStop(1, '#ffc400');
    g.fillStyle = grd;
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 11 : 29, a = i * Math.PI / 5 - Math.PI / 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    return c;
  }

  /* ---------- HUD ---------- */
  var CSS = [
    '.pecas-root{position:absolute;inset:0;overflow:hidden;font-family:"Baloo 2","Fredoka",system-ui,sans-serif;color:#1d2b53;-webkit-user-select:none;user-select:none;}',
    '.pecas-root canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.pecas-fade{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,#ffffff,#d8efff);opacity:0;pointer-events:none;}',
    '.pecas-hud{position:absolute;inset:0;pointer-events:none;font-size:calc(16px*var(--s));}',
    '.pecas-panel{background:linear-gradient(180deg,#ffffff 0%,#f1f5ff 100%);border-radius:calc(20px*var(--s));box-shadow:0 calc(5px*var(--s)) 0 #b9c6e4,0 calc(10px*var(--s)) calc(18px*var(--s)) rgba(20,40,90,.22),inset 0 calc(2px*var(--s)) 0 #fff;}',
    '.pecas-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.pecas-ava{flex:none;width:calc(56px*var(--s));height:calc(56px*var(--s));border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7c2,#ffd21f 60%,#e8a900);padding:calc(4px*var(--s));box-shadow:0 calc(3px*var(--s)) 0 #c98f00;}',
    '.pecas-ava svg{width:100%;height:100%;display:block;border-radius:50%}',
    '.pecas-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(4px*var(--s));}',
    '.pecas-lvl{display:flex;align-items:center;gap:calc(6px*var(--s));font-weight:800;font-size:calc(18px*var(--s));line-height:1.05;white-space:nowrap;}',
    '.pecas-lv{display:inline-grid;place-items:center;width:calc(26px*var(--s));height:calc(26px*var(--s));border-radius:50%;color:#fff;font-size:calc(15px*var(--s));background:radial-gradient(circle at 35% 30%,#ff8a7a,#e8382a 65%);box-shadow:0 calc(2px*var(--s)) 0 #a51f14;}',
    '.pecas-xp{position:relative;height:calc(20px*var(--s));border-radius:99px;background:#dfe6f5;box-shadow:inset 0 calc(2px*var(--s)) calc(3px*var(--s)) rgba(20,40,90,.25);overflow:hidden;}',
    '.pecas-xpfill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(180deg,#9ff07a 0%,#3fc23a 55%,#2a9b2a 100%);box-shadow:inset 0 calc(3px*var(--s)) 0 rgba(255,255,255,.55);}',
    '.pecas-xptxt{position:absolute;right:calc(8px*var(--s));top:50%;transform:translateY(-50%);font-weight:800;font-size:calc(12.5px*var(--s));line-height:1;color:#1d2b53;}',
    '.pecas-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px + 92px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(14px*var(--s)) calc(6px*var(--s)) calc(7px*var(--s));border-radius:calc(16px*var(--s));background:linear-gradient(180deg,#fff27a,#ffd21f);box-shadow:0 calc(4px*var(--s)) 0 #d9a400,0 calc(8px*var(--s)) calc(14px*var(--s)) rgba(20,40,90,.2),inset 0 calc(2px*var(--s)) 0 rgba(255,255,255,.7);max-width:78%;}',
    '.pecas-quest:before,.pecas-quest:after{content:"";position:absolute;top:calc(-6px*var(--s));width:calc(18px*var(--s));height:calc(8px*var(--s));border-radius:calc(6px*var(--s)) calc(6px*var(--s)) 0 0;background:linear-gradient(180deg,#fff7a8,#ffd21f);}',
    '.pecas-quest:before{left:calc(22px*var(--s))}.pecas-quest:after{left:calc(50px*var(--s))}',
    '.pecas-qi{flex:none;width:calc(32px*var(--s));height:calc(32px*var(--s));border-radius:calc(10px*var(--s));background:#fff;display:grid;place-items:center;box-shadow:inset 0 calc(-2px*var(--s)) 0 rgba(0,0,0,.08);}',
    '.pecas-qi svg{width:80%;height:80%}',
    '.pecas-qt{font-weight:700;font-size:calc(14px*var(--s));line-height:1.1;color:#3b2a00;}',
    '.pecas-qt b{display:block;font-weight:800;font-size:calc(11.5px*var(--s));color:#c0392b;letter-spacing:.05em;}',
    '.pecas-bub{position:absolute;left:0;top:0;width:calc(212px*var(--s));padding:calc(14px*var(--s)) calc(14px*var(--s)) calc(10px*var(--s));opacity:0;transform-origin:50% 100%;border-radius:calc(20px*var(--s));}',
    '.pecas-name{position:absolute;left:calc(12px*var(--s));top:calc(-13px*var(--s));padding:calc(1px*var(--s)) calc(10px*var(--s));border-radius:99px;color:#fff;font-weight:800;font-size:calc(13.5px*var(--s));background:linear-gradient(180deg,#ff8a7a,#e8382a);box-shadow:0 calc(2px*var(--s)) 0 #a51f14;}',
    '.pecas-say{font-weight:700;font-size:calc(15.5px*var(--s));line-height:1.18;}',
    '.pecas-tail{position:absolute;bottom:calc(-12px*var(--s));width:0;height:0;border-left:calc(11px*var(--s)) solid transparent;border-right:calc(11px*var(--s)) solid transparent;border-top:calc(14px*var(--s)) solid #f1f5ff;}',
    '.pecas-plus{position:absolute;left:0;top:0;font-weight:800;font-size:calc(32px*var(--s));color:#fff;opacity:0;white-space:nowrap;-webkit-text-stroke:calc(6px*var(--s)) #e8382a;paint-order:stroke fill;text-shadow:0 calc(4px*var(--s)) 0 #a51f14;}',
    '.pecas-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;gap:calc(10px*var(--s));}',
    '.pecas-btn{position:relative;flex:1;height:calc(74px*var(--s));border-radius:calc(18px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#fff;font-weight:800;font-size:calc(16.5px*var(--s));line-height:1;text-shadow:0 calc(2px*var(--s)) 0 rgba(0,0,0,.25);}',
    '.pecas-btn svg{width:calc(32px*var(--s));height:calc(32px*var(--s));margin-bottom:calc(3px*var(--s));}',
    '.pecas-btn i{position:absolute;top:calc(-7px*var(--s));width:calc(22px*var(--s));height:calc(9px*var(--s));border-radius:calc(8px*var(--s)) calc(8px*var(--s)) calc(2px*var(--s)) calc(2px*var(--s));}',
    '.pecas-btn i:nth-child(1){left:18%}.pecas-btn i:nth-child(2){right:18%}',
    '.pecas-r{background:linear-gradient(180deg,#ff8f80 0%,#ef4636 55%,#d32f22 100%);box-shadow:0 calc(6px*var(--s)) 0 #a51f14,0 calc(10px*var(--s)) calc(16px*var(--s)) rgba(0,0,0,.25),inset 0 calc(3px*var(--s)) 0 rgba(255,255,255,.55);}',
    '.pecas-r i{background:linear-gradient(180deg,#ffb3a8,#ef4636)}',
    '.pecas-b{background:linear-gradient(180deg,#7cc0ff 0%,#2f86ee 55%,#1f6bd0 100%);box-shadow:0 calc(6px*var(--s)) 0 #154c99,0 calc(10px*var(--s)) calc(16px*var(--s)) rgba(0,0,0,.25),inset 0 calc(3px*var(--s)) 0 rgba(255,255,255,.55);}',
    '.pecas-b i{background:linear-gradient(180deg,#b5dcff,#2f86ee)}',
    '.pecas-g{background:linear-gradient(180deg,#8ee67a 0%,#36b44a 55%,#27963a 100%);box-shadow:0 calc(6px*var(--s)) 0 #1b6e2a,0 calc(10px*var(--s)) calc(16px*var(--s)) rgba(0,0,0,.25),inset 0 calc(3px*var(--s)) 0 rgba(255,255,255,.55);}',
    '.pecas-g i{background:linear-gradient(180deg,#c3f5b5,#36b44a)}'
  ].join('\n');

  var AVATAR = '<svg viewBox="0 0 40 40"><defs><radialGradient id="pecasAvBg" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#d6efff"/><stop offset="1" stop-color="#7cc0ff"/></radialGradient>' +
    '<radialGradient id="pecasAvSk" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffe6cc"/><stop offset="1" stop-color="#f4b98a"/></radialGradient></defs>' +
    '<rect width="40" height="40" fill="url(#pecasAvBg)"/><ellipse cx="20" cy="42" rx="14" ry="10" fill="#2f86ee"/>' +
    '<circle cx="20" cy="21" r="11" fill="url(#pecasAvSk)"/><path d="M8.6 20 A11.4 11.4 0 0 1 31.4 20 Q26 15.5 20 16.5 Q13 15 8.6 20Z" fill="#7a4a2a"/>' +
    '<rect x="17" y="7.5" width="6" height="3" rx="1.2" fill="#7a4a2a"/>' +
    '<circle cx="16" cy="22" r="1.9" fill="#1d2b53"/><circle cx="24" cy="22" r="1.9" fill="#1d2b53"/><circle cx="16.6" cy="21.3" r=".6" fill="#fff"/><circle cx="24.6" cy="21.3" r=".6" fill="#fff"/>' +
    '<ellipse cx="13.2" cy="25.5" rx="1.8" ry="1.1" fill="#ff9aa2"/><ellipse cx="26.8" cy="25.5" rx="1.8" ry="1.1" fill="#ff9aa2"/>' +
    '<path d="M17 26 Q20 28.6 23 26" stroke="#8a3b3b" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';
  var IC_BRIDGE = '<svg viewBox="0 0 24 24"><rect x="2" y="11" width="20" height="5" rx="1.5" fill="#c98a4b"/><circle cx="6" cy="10.5" r="1.3" fill="#e0a466"/><circle cx="18" cy="10.5" r="1.3" fill="#e0a466"/><rect x="10" y="11" width="4" height="5" fill="#ffd21f" stroke="#e8382a" stroke-width="1" stroke-dasharray="1.5 1"/><rect x="3" y="6" width="2.4" height="13" rx="1" fill="#8a5634"/><rect x="18.6" y="6" width="2.4" height="13" rx="1" fill="#8a5634"/><path d="M2 20 q3 -2 6 0 t6 0 t6 0" stroke="#2f86ee" stroke-width="1.6" fill="none"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="9" rx="2" fill="#fff"/><rect x="5.5" y="8" width="4" height="4" rx="1.2" fill="#fff"/><rect x="14.5" y="8" width="4" height="4" rx="1.2" fill="#fff"/><rect x="3" y="17" width="18" height="3" rx="1.5" fill="#000" opacity=".12"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 24 24"><path d="M8 7 V5.5 a4 4 0 0 1 8 0 V7" stroke="#fff" stroke-width="2.2" fill="none"/><rect x="4" y="7" width="16" height="14" rx="4" fill="#fff"/><rect x="7" y="13" width="10" height="5" rx="2" fill="#bfe0ff"/><circle cx="9" cy="9.5" r="1.3" fill="#bfe0ff"/><circle cx="15" cy="9.5" r="1.3" fill="#bfe0ff"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 24 24"><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20Z" fill="#fff"/><path d="M9 4 V18 M15 6 V20" stroke="#bdeab0" stroke-width="1.5"/><circle cx="17.5" cy="9.5" r="2" fill="#ef4636"/><path d="M5 15 q3 -3 6 -1 t5 -3" stroke="#36b44a" stroke-width="1.4" fill="none" stroke-dasharray="1.6 1.4"/></svg>';

  function buildHUD(root) {
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var hud = document.createElement('div'); hud.className = 'pecas-hud';
    hud.innerHTML =
      '<div class="pecas-top pecas-panel"><div class="pecas-ava">' + AVATAR + '</div><div class="pecas-stat">' +
      '<div class="pecas-lvl"><span class="pecas-lv">4</span>Nível 4 · Explorador</div>' +
      '<div class="pecas-xp"><div class="pecas-xpfill"></div><span class="pecas-xptxt">620/1000 XP</span></div></div></div>' +
      '<div class="pecas-quest"><span class="pecas-qi">' + IC_BRIDGE + '</span><div class="pecas-qt"><b>MISSÃO</b>Consertar a ponte da vila</div></div>' +
      '<div class="pecas-bub pecas-panel"><span class="pecas-name">Mestre Tomé</span><div class="pecas-say">A viga precisa se apoiar dos dois lados!</div><span class="pecas-tail"></span></div>' +
      '<div class="pecas-plus">+50 XP</div>' +
      '<div class="pecas-btns"><div class="pecas-btn pecas-r"><i></i><i></i>' + IC_BUILD + 'Construir</div><div class="pecas-btn pecas-b"><i></i><i></i>' + IC_BAG + 'Mochila</div><div class="pecas-btn pecas-g"><i></i><i></i>' + IC_MAP + 'Mapa</div></div>';
    root.appendChild(hud);
    return {
      hud: hud,
      fill: hud.querySelector('.pecas-xpfill'),
      txt: hud.querySelector('.pecas-xptxt'),
      bub: hud.querySelector('.pecas-bub'),
      tail: hud.querySelector('.pecas-tail'),
      plus: hud.querySelector('.pecas-plus'),
      quest: hud.querySelector('.pecas-quest')
    };
  }

  function mount(host) {
    var reduced = false;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var root = document.createElement('div'); root.className = 'pecas-root';
    host.appendChild(root);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    var fade = document.createElement('div'); fade.className = 'pecas-fade'; root.appendChild(fade);
    var H = buildHUD(root);

    var scene = new THREE.Scene();
    var textures = [], extraDispose = [];
    var skyTex = new THREE.CanvasTexture(skyCanvas()); textures.push(skyTex);
    scene.background = skyTex;
    scene.fog = new THREE.Fog(0xcfeaff, 22, 50);

    // simple studio environment for glossy plastic
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envScene = new THREE.Scene();
    var envGeo = new THREE.SphereGeometry(10, 16, 12);
    var cols = [], pos = envGeo.attributes.position, cc = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var yy = pos.getY(i) / 10;
      if (yy > 0) cc.setRGB(lerp(0.7, 0.35, yy), lerp(0.8, 0.6, yy), 0.95); else cc.setRGB(0.3, 0.42, 0.28);
      cols.push(cc.r, cc.g, cc.b);
    }
    envGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    var envMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    envScene.add(new THREE.Mesh(envGeo, envMat));
    var boxL = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    boxL.position.set(4, 7, 4); boxL.lookAt(0, 0, 0); envScene.add(boxL);
    var envRT = pmrem.fromScene(envScene, 0.03);
    scene.environment = envRT.texture;
    extraDispose.push(envGeo, envMat, boxL.geometry, boxL.material, envRT, pmrem);

    var camera = new THREE.PerspectiveCamera(50, 0.5, 0.1, 120);
    scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x6f9f5a, 0.32));
    var sun = new THREE.DirectionalLight(0xfff4e0, 0.85);
    sun.position.set(6, 13, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0012;
    sun.target.position.set(-1, 0, -1);
    scene.add(sun); scene.add(sun.target);

    var matCache = {};
    function mat(color, extra) {
      var k = color + (extra ? JSON.stringify(extra) : '');
      if (!matCache[k]) {
        var o = { color: color, roughness: 0.3, metalness: 0.0, envMapIntensity: 0.32 };
        if (extra) for (var p in extra) o[p] = extra[p];
        matCache[k] = new THREE.MeshStandardMaterial(o);
      }
      return matCache[k];
    }
    var unitBox = new THREE.BoxGeometry(1, 1, 1);
    var studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.09, 12);
    studGeo.translate(0, 0.045, 0);
    var roundGeo = new THREE.CylinderGeometry(1, 1, 1, 20);
    var sphereGeo = new THREE.SphereGeometry(1, 20, 14);
    var domeGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);

    /* --- instanced bricks + studs --- */
    var bricks = [], studs = [];
    var STEP = 0.4;
    function addStuds(cx, topY, cz, w, d, c) {
      var nx = Math.max(1, Math.round(w / STEP)), nz = Math.max(1, Math.round(d / STEP));
      for (var ix = 0; ix < nx; ix++) for (var iz = 0; iz < nz; iz++) {
        studs.push([cx - w / 2 + STEP / 2 + ix * STEP, topY, cz - d / 2 + STEP / 2 + iz * STEP, c]);
      }
    }
    function B(x, y, z, w, h, d, c, noStuds) { // y = bottom
      bricks.push([x, y + h / 2, z, w, h, d, c]);
      if (!noStuds) addStuds(x, y + h, z, w, d, c);
    }
    function flush() {
      var o = new THREE.Object3D(), col = new THREE.Color();
      var bm = new THREE.InstancedMesh(unitBox, mat('#ffffff'), bricks.length);
      bricks.forEach(function (b, i) {
        o.position.set(b[0], b[1], b[2]); o.scale.set(b[3] - 0.012, b[4] - 0.006, b[5] - 0.012); o.rotation.set(0, 0, 0); o.updateMatrix();
        bm.setMatrixAt(i, o.matrix); col.set(b[6]); bm.setColorAt(i, col);
      });
      bm.castShadow = true; bm.receiveShadow = true; scene.add(bm);
      var sm = new THREE.InstancedMesh(studGeo, mat('#ffffff'), studs.length);
      o.scale.set(1, 1, 1);
      studs.forEach(function (s, i) {
        o.position.set(s[0], s[1], s[2]); o.updateMatrix();
        sm.setMatrixAt(i, o.matrix); col.set(s[3]); sm.setColorAt(i, col);
      });
      sm.receiveShadow = true; scene.add(sm);
      bricks = []; studs = [];
    }
    function mesh(geo, c, x, y, z, sx, sy, sz, parent, extra) {
      var m = new THREE.Mesh(geo, mat(c, extra));
      m.position.set(x, y, z); m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
      m.castShadow = true; m.receiveShadow = true;
      (parent || scene).add(m); return m;
    }
    function stud(parent, x, y, z, c, r) {
      var m = new THREE.Mesh(studGeo, mat(c)); m.position.set(x, y, z); if (r) m.scale.set(r, r, r); m.castShadow = true; parent.add(m); return m;
    }

    /* --- base plates --- */
    var GREEN = '#3aa845', GREEN2 = '#4cb852';
    var groundMat = mat(GREEN);
    var nearG = mesh(unitBox, GREEN, 0, -0.35, 6.2, 34, 0.7, 9.2); nearG.castShadow = false;
    var farG = mesh(unitBox, GREEN, 0, -0.35, -13.8, 34, 0.7, 24.4); farG.castShadow = false;
    // studs on the plates near the action (skip path + house)
    function blocked(x, z) {
      if (Math.abs(x) < 0.75 && z > 1.6) return true;               // path near bank
      if (Math.abs(x + 0.4) < 0.75 && z < -1.6 && z > -4.2) return true; // path far bank
      if (x > -2.2 && x < 1.8 && z > -8.4 && z < -4.4) return true;  // house
      return false;
    }
    for (var sx = -8.2; sx <= 8.2; sx += STEP) {
      for (var sz = -13; sz <= 8.6; sz += STEP) {
        if (sz > -1.65 && sz < 1.65) continue;
        if (blocked(sx, sz)) continue;
        studs.push([sx, 0, sz, GREEN]);
      }
    }
    // path tiles (smooth)
    for (var pz = 2.0; pz < 9; pz += 0.8) B(0, 0, pz, 0.78, 0.08, 0.78, (Math.round(pz / 0.8) % 2) ? '#f2e3c0' : '#e9d6ac', true);
    for (pz = -2.0; pz > -4.2; pz -= 0.8) B(-0.4, 0, pz, 0.78, 0.08, 0.78, (Math.round(pz / 0.8) % 2) ? '#f2e3c0' : '#e9d6ac', true);
    // river bed & bank edge bricks
    mesh(unitBox, '#1f6fd1', 0, -0.9, 0, 34, 0.4, 3.3).castShadow = false;
    for (var bx = -12; bx <= 12; bx += 1.6) {
      B(bx, -0.7, 1.75, 1.6, 0.7, 0.3, hash(bx, 1) > 0.5 ? '#3aa83f' : '#4dbb52', true);
      B(bx + 0.8, -0.7, -1.75, 1.6, 0.7, 0.3, hash(bx, 2) > 0.5 ? '#3aa83f' : '#4dbb52', true);
    }
    // back terraces
    for (var tx = -16; tx <= 16; tx += 3.2) {
      var tz = -11.5 - hash(tx, 5) * 2;
      B(tx, 0, tz - 4, 3.2, 0.48, 8, GREEN2, false);
      if (hash(tx, 9) > 0.35) B(tx + 0.4, 0.48, tz - 6, 2.4, 0.48, 6, '#6fd06a', false);
    }

    /* --- water tiles (translucent, gently bobbing) --- */
    var wMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.8, envMapIntensity: 0.6 });
    var wCells = [];
    for (var wx = -14; wx <= 14; wx += 0.8) for (var wz = -1.2; wz <= 1.21; wz += 0.8) wCells.push([wx, wz]);
    var water = new THREE.InstancedMesh(unitBox, wMat, wCells.length);
    (function () { var col = new THREE.Color(); wCells.forEach(function (c, i) { col.set(((Math.round(c[0] / 0.8) + Math.round(c[1] / 0.8)) % 2) ? '#58b8ff' : '#7cc9ff'); water.setColorAt(i, col); }); })();
    water.renderOrder = 2; scene.add(water);
    var wObj = new THREE.Object3D();
    var foam = [];
    for (var fl = 0; fl < 3; fl++) for (var fk = 0; fk < 12; fk++) {
      var fm = mesh(roundGeo, '#ffffff', 0, -0.2, 0, 0.16 + (fk % 3) * 0.05, 0.03, 0.16 + (fk % 3) * 0.05);
      fm.castShadow = false; fm.userData = { lane: [-1.0, 0.05, 0.95][fl] + (fk % 2) * 0.15, x0: -14 + fk * 2.4 + fl * 0.8 };
      foam.push(fm);
    }
    function updateWater(t) {
      var w = Math.PI * 2 / LOOP;
      wCells.forEach(function (c, i) {
        wObj.position.set(c[0], -0.3 + Math.sin(t * w + c[0] * 0.9 + c[1] * 2) * 0.025, c[1]);
        wObj.scale.set(0.79, 0.16, 0.79); wObj.updateMatrix(); water.setMatrixAt(i, wObj.matrix);
      });
      water.instanceMatrix.needsUpdate = true;
      foam.forEach(function (f) {
        var x = f.userData.x0 + (t / LOOP) * 2.4;
        if (x > 14) x -= 28.8;
        f.position.set(x, -0.2 + Math.sin(t * w + x) * 0.02, f.userData.lane);
      });
    }

    /* --- bridge --- */
    var BR = '#8a4f2b', TAN = '#c98a45', TAN2 = '#b8793a', deckY = 0.06;
    B(-0.64, -0.24, 0, 0.32, 0.3, 5.6, BR, true);
    B(0.64, -0.24, 0, 0.32, 0.3, 5.6, BR, true);
    var plankZ = [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0], GAPZ = 0.4;
    plankZ.forEach(function (z, i) { if (z !== GAPZ) B(0, deckY, z, 1.6, 0.16, 0.76, i % 2 ? TAN : TAN2); });
    [[-0.72, -2.5], [0.72, -2.5], [-0.72, 2.5], [0.72, 2.5], [-0.72, 0], [0.72, 0]].forEach(function (p) {
      var post = mesh(roundGeo, BR, p[0], 0.4, p[1], 0.13, 0.9, 0.13);
      stud(scene, p[0], 0.85, p[1], BR);
      mesh(roundGeo, BR, p[0], -0.5, p[1], 0.16, 0.6, 0.16).castShadow = false;
    });
    B(-0.72, 0.68, 0, 0.18, 0.12, 5.2, '#e8b36c'); B(0.72, 0.68, 0, 0.18, 0.12, 5.2, '#e8b36c');

    /* --- trees (stacked cones) --- */
    var treeTops = [];
    function tree(x, z, s, c1, c2) {
      s = s || 1; c1 = c1 || '#2fa84f'; c2 = c2 || '#45c463';
      mesh(roundGeo, '#7a4a2a', x, 0.3 * s, z, 0.16 * s, 0.6 * s, 0.16 * s);
      var layers = [[0.95, 0.75, 0.5], [0.75, 0.55, 0.5], [0.52, 0.3, 0.5]];
      var y = 0.55 * s;
      layers.forEach(function (L, i) {
        var g = new THREE.CylinderGeometry(L[1] * s, L[0] * s, L[2] * s, 20); extraDispose.push(g);
        mesh(g, i % 2 ? c2 : c1, x, y + L[2] * s / 2, z, 1);
        y += L[2] * s * 0.8;
      });
      var tp = stud(scene, x, y + 0.08 * s, z, c2, 1.3 * s);
      treeTops.push(tp);
      // little fruit studs
      [[0.7, 0.75, 0.3], [-0.4, 1.1, 0.5], [0.2, 1.5, -0.45]].forEach(function (f) { mesh(sphereGeo, '#ff5a4f', x + f[0] * s, f[1] * s, z + f[2] * s, 0.08 * s); });
    }
    tree(-3.6, 4.2, 1); tree(7.4, 5.2, 1.05, '#36b35a', '#5fd07a'); tree(-3.3, -4.9, 1.1); tree(-6.2, -2.8, 0.95, '#2b9e48', '#58c45a');
    tree(6.8, -7.5, 1.25); tree(-8, -9, 1.3, '#36b35a', '#5fd07a'); tree(1.8, -10.6, 1.2); tree(-6.5, 7.2, 1.1); tree(7.5, 1.2 + 1.2, 0.9);
    tree(-11, -4, 1.1); tree(10.5, -11, 1.3);
    // round bushes
    [[-2.2, 2.5], [2.6, -2.4], [5.2, 2.4], [-4.6, 2.3], [-1.6, -6.5]].forEach(function (p, i) {
      mesh(domeGeo, i % 2 ? '#45c463' : '#2fa84f', p[0], 0, p[1], 0.42, 0.36, 0.42);
      stud(scene, p[0], 0.35, p[1], i % 2 ? '#45c463' : '#2fa84f');
    });

    /* --- house of bricks --- */
    (function house(cx, cz) {
      var W = 3.2, D = 2.4, rows = 5, h = 0.4;
      for (var r = 0; r < rows; r++) {
        var y = r * h, off = (r % 2) * 0.4;
        for (var x = -W / 2 + off; x < W / 2 - 0.01; x += 0.8) {
          var w = Math.min(0.8, W / 2 - x);
          var midx = cx + x + w / 2;
          var front = !(r >= 1 && r <= 3 && Math.abs(midx - cx) < 0.5) && !((r === 2 || r === 3) && Math.abs(midx - cx - 1.0) < 0.35) && !((r === 2 || r === 3) && Math.abs(midx - cx + 1.0) < 0.35);
          if (r === 0 && Math.abs(midx - cx) < 0.5) front = false;
          if (front) B(midx, y, cz + D / 2 - 0.2, w, h, 0.4, (r + Math.round(x * 3)) % 3 ? '#fff5e1' : '#ffe9c4', true);
          B(midx, y, cz - D / 2 + 0.2, w, h, 0.4, (r + Math.round(x * 3)) % 3 ? '#fff5e1' : '#ffe9c4', true);
        }
        for (var z = -D / 2 + 0.4 + off * 0.5; z < D / 2 - 0.41; z += 0.8) {
          var d = Math.min(0.8, D / 2 - 0.4 - z);
          var midz = cz + z + d / 2;
          var win = (r === 2 || r === 3) && Math.abs(midz - cz) < 0.35;
          if (!win) B(cx - W / 2 + 0.2, y, midz, 0.4, h, d, '#ffe9c4', true);
          B(cx + W / 2 - 0.2, y, midz, 0.4, h, d, (r % 2) ? '#fff5e1' : '#ffe9c4', true);
        }
      }
      // door + windows
      mesh(unitBox, '#e8382a', cx, 0.8, cz + D / 2 - 0.2, 0.78, 1.58, 0.3);
      mesh(sphereGeo, '#ffd21f', cx + 0.24, 0.8, cz + D / 2 - 0.03, 0.06);
      [[cx + 1.0, cz + D / 2 - 0.2, 0], [cx - 1.0, cz + D / 2 - 0.2, 0], [cx - W / 2 + 0.2, cz, 1]].forEach(function (p) {
        var m = mesh(unitBox, '#9fe0ff', p[0], 1.2, p[1], p[2] ? 0.2 : 0.62, 0.78, p[2] ? 0.62 : 0.2, null, { transparent: true, opacity: 0.75, roughness: 0.05 });
        m.castShadow = false;
        mesh(unitBox, '#ffffff', p[0], 0.78, p[1] + (p[2] ? 0 : 0.12), p[2] ? 0.5 : 0.78, 0.08, p[2] ? 0.78 : 0.5);
      });
      // roof
      var shape = new THREE.Shape();
      shape.moveTo(-W / 2 - 0.35, 0); shape.lineTo(W / 2 + 0.35, 0); shape.lineTo(0.12, 1.45); shape.lineTo(-0.12, 1.45); shape.lineTo(-W / 2 - 0.35, 0);
      var rg = new THREE.ExtrudeGeometry(shape, { depth: D + 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
      rg.translate(0, 0, -(D + 0.5) / 2); extraDispose.push(rg);
      mesh(rg, '#e8382a', cx, rows * h, cz, 1);
      for (var sz2 = -D / 2 - 0.1; sz2 <= D / 2 + 0.11; sz2 += 0.4) stud(scene, cx, rows * h + 1.49, cz + sz2, '#e8382a', 0.9);
      B(cx + 0.9, rows * h + 0.4, cz - 0.5, 0.4, 1.2, 0.4, '#9aa5b8');
      // flower pots
      [[cx - 1.0, '#ff7ab8'], [cx + 1.0, '#ffd21f']].forEach(function (f) {
        B(f[0], 0.62, cz + D / 2 + 0.12, 0.6, 0.12, 0.2, '#7a4a2a', true);
        mesh(sphereGeo, f[1], f[0] - 0.14, 0.82, cz + D / 2 + 0.12, 0.08); mesh(sphereGeo, f[1], f[0] + 0.14, 0.82, cz + D / 2 + 0.12, 0.08);
      });
    })(-0.2, -6.4);

    /* --- flowers, fence, crates --- */
    var fcols = ['#ff5a4f', '#ffd21f', '#ff7ab8', '#ffffff', '#9b7bff'];
    for (var f = 0; f < 30; f++) {
      var fx = Math.round(((hash(f, 1) - 0.5) * 15) / STEP) * STEP, fz = Math.round(((hash(f, 2) - 0.5) * 17 - 1) / STEP) * STEP;
      if (Math.abs(fz) < 2.0 || blocked(fx, fz) || (Math.abs(fx) < 1.2)) continue;
      mesh(roundGeo, '#2b9e48', fx, 0.08, fz, 0.03, 0.16, 0.03);
      var fh = mesh(roundGeo, fcols[f % 5], fx, 0.2, fz, 0.13, 0.05, 0.13);
      mesh(sphereGeo, '#ffd21f', fx, 0.24, fz, 0.05);
    }
    for (var fe = 0; fe < 5; fe++) { mesh(roundGeo, '#fff5e1', 2.2 + fe * 0.6, 0.3, 3.2, 0.07, 0.6, 0.07); stud(scene, 2.2 + fe * 0.6, 0.6, 3.2, '#fff5e1', 0.6); }
    B(3.4, 0.36, 3.2, 2.6, 0.1, 0.12, '#fff5e1', true); B(3.4, 0.14, 3.2, 2.6, 0.1, 0.12, '#fff5e1', true);
    B(-1.8, 0, 2.9, 0.8, 0.48, 0.8, '#ffd21f'); B(-1.8, 0.48, 2.9, 0.8, 0.48, 0.8, '#2f86ee'); B(-2.5, 0, 3.4, 0.8, 0.48, 0.8, '#e8382a');
    B(-2.0, 0, 4.1, 1.6, 0.16, 0.4, TAN); B(-2.0, 0.16, 4.1, 1.6, 0.16, 0.4, TAN2);
    flush();

    /* --- clouds: round plates --- */
    var clouds = new THREE.Group(); scene.add(clouds);
    var cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.25, fog: false });
    [[-6, 11, -18, 1.4], [6, 13, -22, 1.8], [-1, 15, -30, 2.2], [10, 10, -14, 1.1]].forEach(function (c) {
      var g = new THREE.Group();
      [[0, 0, 0, 1.4, 0.5], [1.1, 0.35, 0, 0.9, 0.5], [-1.0, 0.25, 0.2, 0.8, 0.5], [0.2, 0.6, 0, 0.8, 0.4]].forEach(function (b) {
        var m = new THREE.Mesh(roundGeo, cloudMat); m.position.set(b[0], b[1], b[2]); m.scale.set(b[3], b[4], b[3] * 0.7); g.add(m);
      });
      g.scale.setScalar(c[3]); g.position.set(c[0], c[1], c[2]); g.userData.x = c[0];
      clouds.add(g);
    });

    /* --- characters (rounded, built from parts) --- */
    function pivot(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
    var SKIN = '#ffd6b0';
    // HERO
    var hero = new THREE.Group(); scene.add(hero);
    var hb = pivot(hero, 0, 0, 0);
    var legL = pivot(hb, -0.11, 0.34, 0), legR = pivot(hb, 0.11, 0.34, 0);
    [legL, legR].forEach(function (l) {
      mesh(roundGeo, '#24488f', 0, -0.14, 0, 0.09, 0.28, 0.09, l);
      mesh(sphereGeo, '#6b3f26', 0, -0.29, 0.04, 0.11, 0.07, 0.14, l);
    });
    var tg = new THREE.CylinderGeometry(0.21, 0.25, 0.42, 20); extraDispose.push(tg);
    mesh(tg, '#2f86ee', 0, 0.55, 0, 1, 1, 1, hb);
    mesh(roundGeo, '#7cc0ff', 0, 0.38, 0, 0.255, 0.06, 0.255, hb);
    mesh(sphereGeo, '#2f86ee', 0, 0.76, 0, 0.21, 0.07, 0.21, hb);
    var armL = pivot(hb, -0.26, 0.7, 0), armR = pivot(hb, 0.26, 0.7, 0);
    [armL, armR].forEach(function (a) {
      mesh(roundGeo, '#2f86ee', 0, -0.12, 0, 0.065, 0.26, 0.065, a);
      mesh(sphereGeo, SKIN, 0, -0.27, 0, 0.075, 0.075, 0.075, a);
    });
    // backpack
    var bp = new THREE.Group(); bp.position.set(0, 0.58, -0.26); hb.add(bp);
    mesh(unitBox, '#ff8a1f', 0, 0, 0, 0.36, 0.36, 0.18, bp);
    mesh(unitBox, '#ff6a00', 0, 0.12, 0.005, 0.37, 0.12, 0.19, bp);
    mesh(unitBox, '#ffb05c', 0, -0.07, -0.1, 0.22, 0.12, 0.04, bp);
    stud(bp, -0.09, 0.18, 0, '#ff8a1f', 0.7); stud(bp, 0.09, 0.18, 0, '#ff8a1f', 0.7);
    var head = pivot(hb, 0, 1.0, 0);
    mesh(sphereGeo, SKIN, 0, 0, 0, 0.29, 0.27, 0.27, head);
    var hair = mesh(domeGeo, '#7a4a2a', 0, 0.02, -0.02, 0.305, 0.27, 0.29, head);
    hair.rotation.x = -0.35;
    mesh(sphereGeo, '#7a4a2a', 0.08, 0.17, 0.2, 0.12, 0.06, 0.07, head);
    stud(head, 0, 0.25, -0.04, '#7a4a2a', 0.95);
    [-1, 1].forEach(function (sd) {
      mesh(sphereGeo, '#1d2b53', sd * 0.1, 0.0, 0.245, 0.045, 0.06, 0.03, head);
      mesh(sphereGeo, '#ffffff', sd * 0.1 + 0.015, 0.025, 0.27, 0.014, 0.018, 0.01, head);
      mesh(roundGeo, '#ff9aa2', sd * 0.17, -0.07, 0.21, 0.04, 0.01, 0.03, head).rotation.x = Math.PI / 2 - 0.4;
      mesh(sphereGeo, SKIN, sd * 0.285, -0.01, 0, 0.05, 0.06, 0.04, head);
    });
    var smileG = new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI); extraDispose.push(smileG);
    var sm1 = mesh(smileG, '#8a3b3b', 0, -0.08, 0.25, 1, 1, 1, head); sm1.rotation.set(0.25, 0, Math.PI);

    // MENTOR
    var tome = new THREE.Group(); scene.add(tome);
    var tb = pivot(tome, 0, 0, 0);
    var tl1 = pivot(tb, -0.14, 0.36, 0), tl2 = pivot(tb, 0.14, 0.36, 0);
    [tl1, tl2].forEach(function (l) { mesh(roundGeo, '#5f5a7a', 0, -0.15, 0, 0.11, 0.3, 0.11, l); mesh(sphereGeo, '#4a2e1e', 0, -0.31, 0.04, 0.13, 0.08, 0.16, l); });
    var tg2 = new THREE.CylinderGeometry(0.27, 0.32, 0.52, 20); extraDispose.push(tg2);
    mesh(tg2, '#f4ecdc', 0, 0.62, 0, 1, 1, 1, tb);
    var apG = new THREE.CylinderGeometry(0.285, 0.335, 0.5, 20, 1, true, -0.95, 1.9); extraDispose.push(apG);
    mesh(apG, '#8a5126', 0, 0.6, 0, 1, 1, 1, tb, { side: THREE.DoubleSide });
    mesh(unitBox, '#a8683a', 0, 0.52, 0.31, 0.2, 0.12, 0.04, tb);
    mesh(roundGeo, '#ffd21f', 0.05, 0.6, 0.31, 0.02, 0.16, 0.02, tb);
    mesh(sphereGeo, '#f4ecdc', 0, 0.88, 0, 0.27, 0.08, 0.27, tb);
    var tA1 = pivot(tb, -0.32, 0.82, 0), tA2 = pivot(tb, 0.32, 0.82, 0);
    [tA1, tA2].forEach(function (a) { mesh(roundGeo, '#f4ecdc', 0, -0.14, 0, 0.08, 0.3, 0.08, a); mesh(sphereGeo, '#f2c39c', 0, -0.31, 0, 0.09, 0.09, 0.09, a); });
    var th = pivot(tb, 0, 1.17, 0);
    mesh(sphereGeo, '#f2c39c', 0, 0, 0, 0.3, 0.28, 0.28, th);
    mesh(sphereGeo, '#ffffff', 0, -0.12, 0.12, 0.24, 0.2, 0.18, th);
    mesh(sphereGeo, '#ffffff', -0.07, -0.04, 0.25, 0.08, 0.04, 0.04, th);
    mesh(sphereGeo, '#ffffff', 0.07, -0.04, 0.25, 0.08, 0.04, 0.04, th);
    mesh(sphereGeo, '#e3a77e', 0, 0.0, 0.28, 0.05, 0.045, 0.045, th);
    [-1, 1].forEach(function (sd) {
      mesh(sphereGeo, '#1d2b53', sd * 0.1, 0.07, 0.25, 0.035, 0.045, 0.025, th);
      mesh(unitBox, '#ffffff', sd * 0.1, 0.14, 0.25, 0.1, 0.03, 0.03, th);
      mesh(sphereGeo, '#f2c39c', sd * 0.29, 0.0, 0, 0.05, 0.06, 0.04, th);
    });
    mesh(domeGeo, '#ffcf1f', 0, 0.08, -0.01, 0.33, 0.27, 0.32, th);
    mesh(roundGeo, '#f2b600', 0, 0.09, 0.03, 0.39, 0.03, 0.38, th);
    mesh(unitBox, '#f2b600', 0, 0.26, -0.01, 0.06, 0.12, 0.6, th);
    stud(th, 0, 0.34, -0.01, '#ffcf1f', 1.1);
    tome.position.set(-0.9, 0, -3.0);
    tome.rotation.y = 0.35;

    /* --- missing piece, ghost slot, fx --- */
    var piece = new THREE.Group(); scene.add(piece);
    var pMat = new THREE.MeshStandardMaterial({ color: 0xe8b36c, roughness: 0.25, envMapIntensity: 0.35, emissive: 0xffe08a, emissiveIntensity: 0 });
    var pBody = new THREE.Mesh(unitBox, pMat); pBody.scale.set(1.588, 0.154, 0.748); pBody.position.y = 0.08; pBody.castShadow = true; piece.add(pBody);
    for (var px = 0; px < 4; px++) for (var pz2 = 0; pz2 < 2; pz2++) { var s1 = new THREE.Mesh(studGeo, pMat); s1.position.set(-0.6 + px * 0.4, 0.16, -0.2 + pz2 * 0.4); s1.castShadow = true; piece.add(s1); }
    var ghost = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    ghost.scale.set(1.6, 0.16, 0.78); ghost.position.set(0, deckY + 0.08, GAPZ); scene.add(ghost);
    var ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(unitBox), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
    ghostEdge.scale.copy(ghost.scale); ghostEdge.position.copy(ghost.position); scene.add(ghostEdge);
    var ringGeo = new THREE.RingGeometry(0.8, 1.0, 32); extraDispose.push(ringGeo);
    var ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, deckY + 0.25, GAPZ); scene.add(ring);
    var starTex = new THREE.CanvasTexture(starCanvas()); textures.push(starTex);
    var stars = [];
    for (var si = 0; si < 12; si++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false }));
      var a = si / 12 * Math.PI * 2;
      sp.userData = { dx: Math.cos(a), dz: Math.sin(a), up: 0.7 + (si % 3) * 0.35, sz: 0.24 + (si % 2) * 0.12 };
      sp.visible = false; scene.add(sp); stars.push(sp);
    }
    var confetti = [];
    var ccols = ['#e8382a', '#ffd21f', '#2f86ee', '#36b44a', '#ff7ab8'];
    for (si = 0; si < 14; si++) {
      var cm = new THREE.Mesh(studGeo, mat(ccols[si % 5]));
      var b2 = si / 14 * Math.PI * 2;
      cm.userData = { dx: Math.cos(b2) * (0.6 + (si % 3) * 0.3), dz: Math.sin(b2) * (0.5 + (si % 2) * 0.3), vy: 2.2 + (si % 4) * 0.5, r: si };
      cm.visible = false; scene.add(cm); confetti.push(cm);
    }

    /* --- layout --- */
    var W = 1, Hgt = 1, S = 1;
    function layout() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, r.width); Hgt = Math.max(1, r.height);
      S = clamp(W / 390, 0.78, 1.35);
      H.hud.style.setProperty('--s', S.toFixed(3));
      renderer.setSize(W, Hgt, false);
      var asp = W / Hgt;
      camera.aspect = asp;
      var hfov = 49 * Math.PI / 180;
      camera.fov = clamp(2 * Math.atan(Math.tan(hfov / 2) / asp) * 180 / Math.PI, 40, 100);
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
    var camBase = new THREE.Vector3(5.5, 6.7, 7.2), look = new THREE.Vector3(-0.4, 0.3, 0.0);
    var HERO_Z0 = 4.8, HERO_Z1 = 3.15;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = typeof window.__SCENE_TIME === 'number' ? window.__SCENE_TIME : ((now - t0) / 1000) % LOOP;
      var w = Math.PI * 2 / LOOP;
      var amp = reduced ? 0.15 : 1;
      var cyc = 0.5 - 0.5 * Math.cos(t * w);
      camera.position.set(camBase.x - cyc * 0.7 * amp, camBase.y - cyc * 0.4 * amp, camBase.z - cyc * 0.9 * amp);
      camera.lookAt(look.x, look.y, look.z);

      updateWater(t);
      clouds.children.forEach(function (c, i) { c.position.x = c.userData.x + Math.sin(t * w + i) * 0.35; });

      // hero
      var walkK = sstep(0, 1.25, t), walking = t < 1.25;
      hero.position.set(0, 0, lerp(HERO_Z0, HERO_Z1, walkK));
      hero.rotation.y = Math.PI + (walking ? 0 : Math.sin(t * 2) * 0.1);
      var cy2 = Math.sin(t * 13);
      var wa = walking ? sstep(0, 0.15, t) * (1 - sstep(1.05, 1.25, t)) : 0;
      legL.rotation.x = cy2 * 0.7 * wa; legR.rotation.x = -cy2 * 0.7 * wa;
      armL.rotation.x = -cy2 * 0.6 * wa; armR.rotation.x = cy2 * 0.6 * wa;
      hb.position.y = Math.abs(cy2) * 0.05 * wa;
      hb.rotation.z = cy2 * 0.05 * wa;
      var hop = t > 2.3 && t < 2.75 ? Math.sin((t - 2.3) / 0.45 * Math.PI) : 0;
      hb.position.y += hop * 0.32;
      armL.rotation.z = hop > 0 ? -hop * 2.3 : 0; armR.rotation.z = hop > 0 ? hop * 2.3 : 0;
      if (!walking) hb.position.y += Math.sin(t * 5) * 0.01;

      // mentor
      tb.position.y = Math.sin(t * w * 2) * 0.012;
      var point = sstep(0.7, 1.0, t) * (1 - sstep(2.9, 3.2, t));
      tA2.rotation.x = -point * 1.4; tA2.rotation.z = point * 0.3;
      var cheer = t > 2.3 && t < 2.9 ? Math.sin((t - 2.3) / 0.6 * Math.PI) : 0;
      tA1.rotation.z = -cheer * 2.4;
      th.rotation.z = Math.sin(t * w * 2) * 0.05;

      // piece drop + click
      var LAND = 2.15;
      if (t < 1.6 || t > 3.33) piece.visible = false;
      else {
        piece.visible = true;
        var py, sq = 1;
        if (t < LAND) { var e = clamp((t - 1.6) / (LAND - 1.6), 0, 1); e = e * e; py = lerp(3.6, deckY, e); piece.rotation.set(0, (1 - e) * 0.9, 0); }
        else {
          var ft = t - LAND;
          py = deckY + Math.abs(Math.sin(ft * 16)) * Math.exp(-ft * 10) * 0.28;
          sq = 1 - Math.exp(-ft * 14) * 0.25 * Math.cos(ft * 30);
          piece.rotation.set(0, 0, 0);
        }
        var appear = t < 1.75 ? outBack(clamp((t - 1.6) / 0.15, 0, 1)) : 1;
        piece.position.set(0, py, GAPZ);
        piece.scale.set(appear * (2 - sq), appear * sq, appear * (2 - sq));
        pMat.emissiveIntensity = t < LAND ? 0.15 : 0.55 * Math.exp(-(t - LAND) * 4);
      }
      var gOn = t < LAND ? 1 : 1 - sstep(LAND, LAND + 0.12, t);
      var pulse = 0.5 + 0.5 * Math.sin(t * 9);
      ghost.material.opacity = gOn * (0.2 + 0.25 * pulse);
      ghostEdge.material.opacity = gOn * (0.5 + 0.5 * pulse);
      ghost.visible = ghostEdge.visible = gOn > 0.01;
      var rt = (t - LAND) / 0.5;
      ring.visible = rt > 0 && rt < 1;
      if (ring.visible) { var rs = 0.8 + rt * 1.6; ring.scale.set(rs, rs, rs); ring.material.opacity = 1 - rt; }
      var ft2 = t - LAND;
      stars.forEach(function (s) {
        if (ft2 > 0 && ft2 < 0.75) {
          s.visible = true; var k = ft2 / 0.75, d = s.userData;
          s.position.set(d.dx * (0.5 + k * 1.1), deckY + 0.25 + d.up * Math.sin(k * Math.PI * 0.8), GAPZ + d.dz * (0.35 + k * 0.6));
          var z = d.sz * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.7);
          s.scale.set(z, z, z); s.material.opacity = 1 - k * k; s.material.rotation = k * 3;
        } else s.visible = false;
      });
      confetti.forEach(function (c) {
        if (ft2 > 0 && ft2 < 0.9) {
          c.visible = true; var d = c.userData, k = ft2;
          c.position.set(d.dx * k * 1.6, deckY + 0.2 + d.vy * k - 4.5 * k * k, GAPZ + d.dz * k * 1.6);
          c.rotation.set(k * 8 + d.r, k * 5, k * 6);
          var z = 0.7 * (1 - sstep(0.6, 0.9, k)); c.scale.set(z, z, z);
        } else c.visible = false;
      });

      var fo = t > 3.05 ? (t < 3.33 ? sstep(3.05, 3.33, t) : 1 - sstep(3.33, 3.6, t)) : 0;
      fade.style.opacity = fo.toFixed(3);

      renderer.render(scene, camera);

      // HUD
      var bubIn = sstep(0.8, 1.0, t), bubOut = 1 - sstep(2.3, 2.5, t);
      var hp = toScreen(th, 0.75);
      var bw = H.bub.offsetWidth, bh = H.bub.offsetHeight;
      var bx = clamp(hp.x - bw * 0.82, 10, W - bw - 10);
      var minTop = H.quest.offsetTop + H.quest.offsetHeight + 24 * S;
      var byy = Math.max(minTop, hp.y - bh - 18 * S);
      var pop = bubIn < 1 ? outBack(bubIn) : 1;
      H.bub.style.opacity = (bubIn * bubOut).toFixed(3);
      H.bub.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + byy.toFixed(1) + 'px) scale(' + (0.6 + 0.4 * pop).toFixed(3) + ')';
      H.tail.style.left = clamp(hp.x - bx - 11 * S, 14 * S, bw - 36 * S).toFixed(1) + 'px';
      var pt = clamp((t - 2.4) / 0.8, 0, 1);
      var bpos = toScreen(ghost, 0.5);
      H.plus.style.opacity = (pt > 0 && pt < 1 ? (pt < 0.15 ? pt / 0.15 : 1 - sstep(0.6, 1, pt)) : 0).toFixed(3);
      H.plus.style.transform = 'translate(' + (bpos.x - 52 * S).toFixed(1) + 'px,' + (bpos.y - 34 * S - pt * 90 * S).toFixed(1) + 'px) scale(' + (0.7 + 0.3 * outBack(clamp(pt / 0.25, 0, 1))).toFixed(3) + ')';
      var fillv = 620 + 50 * sstep(2.55, 2.95, t) * (1 - sstep(3.1, 3.5, t));
      H.fill.style.width = (fillv / 10).toFixed(2) + '%';
      H.txt.textContent = Math.round(fillv) + '/1000 XP';
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
        extraDispose.forEach(function (x) { if (x && x.dispose) x.dispose(); });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        host.innerHTML = '';
      }
    };
  }

  window.SCENES[ID] = { mount: mount };
})();
