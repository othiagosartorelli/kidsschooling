/* Estilo BLOCOS (voxel) — KidsSchooling
   Mundo de cubos macios em tons pastel, personagens fofos de cabeça cúbica.
   Loop de 3,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'voxel';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x) { var c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function hash(x, z) { var s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }

  /* ---------- canvas textures ---------- */
  function bevelCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
    // soft rounded-edge look: darker rim, light top-left highlight
    var grd = g.createLinearGradient(0, 0, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.06)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(60,40,70,0.16)'; g.lineWidth = 6; g.strokeRect(3, 3, 58, 58);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(7, 57); g.lineTo(7, 7); g.lineTo(57, 7); g.stroke();
    return c;
  }
  function grassAtlas() {
    var c = document.createElement('canvas'); c.width = 128; c.height = 64;
    var g = c.getContext('2d');
    // top (0..63)
    g.fillStyle = '#9ad979'; g.fillRect(0, 0, 64, 64);
    for (var i = 0; i < 22; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.13)' : 'rgba(70,140,60,0.12)';
      var x = (i * 37) % 54 + 4, y = (i * 53) % 54 + 4;
      g.fillRect(x, y, 6, 6);
    }
    g.strokeStyle = 'rgba(40,90,40,0.14)'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 60);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(5, 59); g.lineTo(5, 5); g.lineTo(59, 5); g.stroke();
    // side (64..127)
    g.fillStyle = '#c99a6e'; g.fillRect(64, 0, 64, 64);
    for (i = 0; i < 14; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(110,70,40,0.16)';
      g.fillRect(64 + (i * 29) % 52 + 4, 22 + (i * 41) % 36, 7, 5);
    }
    g.fillStyle = '#9ad979'; g.fillRect(64, 0, 64, 14);
    for (i = 0; i < 8; i++) { g.fillRect(64 + i * 8, 14, 8, (i % 3 === 0) ? 9 : (i % 2 ? 5 : 2)); }
    g.strokeStyle = 'rgba(70,40,30,0.18)'; g.lineWidth = 4; g.strokeRect(66, 2, 60, 60);
    return c;
  }
  function waterCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,255,1)';
    g.fillStyle = 'rgba(120,190,230,0.35)';
    g.fillRect(0, 40, 64, 6); g.fillRect(10, 14, 30, 4); g.fillRect(44, 26, 16, 4);
    g.strokeStyle = 'rgba(40,110,170,0.25)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61);
    return c;
  }
  function skyCanvas() {
    var c = document.createElement('canvas'); c.width = 4; c.height = 256;
    var g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#6fb7f0'); grd.addColorStop(0.55, '#a9dbf7'); grd.addColorStop(1, '#fdf1d6');
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    return c;
  }
  function starCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.translate(32, 32);
    g.fillStyle = '#fff6b0';
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 11 : 28, a = i * Math.PI / 5 - Math.PI / 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.lineWidth = 4; g.strokeStyle = '#ffc93c'; g.stroke();
    return c;
  }

  /* ---------- HUD ---------- */
  var CSS = [
    '.voxel-root{position:absolute;inset:0;overflow:hidden;font-family:"Lilita One","Fredoka",system-ui,sans-serif;color:#3a2c4f;-webkit-user-select:none;user-select:none;}',
    '.voxel-root canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.voxel-fade{position:absolute;inset:0;background:#fff7e6;opacity:0;pointer-events:none;}',
    '.voxel-hud{position:absolute;inset:0;pointer-events:none;font-size:calc(16px*var(--s));}',
    '.voxel-panel{background:#fff8e8;border:calc(3px*var(--s)) solid #3a2c4f;box-shadow:0 calc(5px*var(--s)) 0 #3a2c4f;}',
    '.voxel-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(10px*var(--s));}',
    '.voxel-ava{flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));border-radius:50%;border:calc(3px*var(--s)) solid #3a2c4f;background:#bfe6ff;overflow:hidden;box-shadow:inset 0 calc(-4px*var(--s)) 0 rgba(58,44,79,.18);}',
    '.voxel-ava svg{width:100%;height:100%;display:block}',
    '.voxel-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(6px*var(--s));}',
    '.voxel-lvl{display:flex;align-items:center;gap:calc(6px*var(--s));font-size:calc(17px*var(--s));line-height:1;white-space:nowrap;}',
    '.voxel-lv{display:inline-grid;place-items:center;min-width:calc(24px*var(--s));height:calc(24px*var(--s));background:#ffcf4d;border:calc(2.5px*var(--s)) solid #3a2c4f;font-size:calc(14px*var(--s));}',
    '.voxel-xp{position:relative;height:calc(20px*var(--s));background:#e7dcc6;border:calc(2.5px*var(--s)) solid #3a2c4f;overflow:hidden;}',
    '.voxel-xpfill{position:absolute;left:0;top:0;bottom:0;width:62%;background:repeating-linear-gradient(90deg,#7ed957 0,#7ed957 calc(14px*var(--s)),#6cc84a calc(14px*var(--s)),#6cc84a calc(16px*var(--s)));box-shadow:inset 0 calc(4px*var(--s)) 0 rgba(255,255,255,.45);}',
    '.voxel-xptxt{position:absolute;right:calc(6px*var(--s));top:50%;transform:translateY(-50%);font-size:calc(12.5px*var(--s));color:#3a2c4f;text-shadow:0 1px 0 #fff;}',
    '.voxel-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px + 92px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(6px*var(--s)) calc(10px*var(--s)) calc(6px*var(--s)) calc(6px*var(--s));max-width:76%;}',
    '.voxel-qi{flex:none;width:calc(30px*var(--s));height:calc(30px*var(--s));background:#ffb36b;border:calc(2.5px*var(--s)) solid #3a2c4f;display:grid;place-items:center;}',
    '.voxel-qi svg{width:78%;height:78%}',
    '.voxel-qt{font-size:calc(13.5px*var(--s));line-height:1.15;}',
    '.voxel-qt small{display:block;font-size:calc(11px*var(--s));color:#d0663a;letter-spacing:.06em;}',
    '.voxel-bub{position:absolute;left:0;top:0;width:calc(214px*var(--s));padding:calc(12px*var(--s)) calc(12px*var(--s)) calc(10px*var(--s));opacity:0;transform-origin:50% 100%;}',
    '.voxel-name{position:absolute;left:calc(8px*var(--s));top:calc(-15px*var(--s));background:#ffcf4d;border:calc(2.5px*var(--s)) solid #3a2c4f;padding:calc(2px*var(--s)) calc(8px*var(--s));font-size:calc(13px*var(--s));}',
    '.voxel-say{font-family:"Fredoka","Lilita One",system-ui,sans-serif;font-weight:600;font-size:calc(15px*var(--s));line-height:1.22;color:#3a2c4f;}',
    '.voxel-tail{position:absolute;bottom:calc(-17px*var(--s));width:calc(16px*var(--s));height:calc(14px*var(--s));}',
    '.voxel-tail i{position:absolute;display:block;background:#fff8e8;border:calc(3px*var(--s)) solid #3a2c4f;border-top:0;}',
    '.voxel-plus{position:absolute;left:0;top:0;font-size:calc(30px*var(--s));color:#ffd23f;-webkit-text-stroke:calc(5px*var(--s)) #3a2c4f;paint-order:stroke fill;text-shadow:0 calc(4px*var(--s)) 0 #3a2c4f;letter-spacing:.02em;opacity:0;white-space:nowrap;}',
    '.voxel-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;gap:calc(10px*var(--s));}',
    '.voxel-btn{flex:1;height:calc(76px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));border:calc(3px*var(--s)) solid #3a2c4f;box-shadow:0 calc(7px*var(--s)) 0 #3a2c4f, inset 0 calc(-7px*var(--s)) 0 rgba(0,0,0,.14), inset 0 calc(5px*var(--s)) 0 rgba(255,255,255,.45);font-size:calc(16px*var(--s));color:#fff;text-shadow:0 calc(2px*var(--s)) 0 rgba(58,44,79,.75);}',
    '.voxel-btn svg{width:calc(30px*var(--s));height:calc(30px*var(--s));filter:drop-shadow(0 calc(2px*var(--s)) 0 rgba(58,44,79,.6));}',
    '.voxel-b1{background:#ff9466}.voxel-b2{background:#5cb6f2}.voxel-b3{background:#66cf8a}'
  ].join('\n');

  var AVATAR = '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#bfe6ff"/><rect x="0" y="30" width="40" height="10" fill="#9ad979"/>' +
    '<rect x="9" y="30" width="22" height="12" fill="#4a8fe0"/>' +
    '<rect x="9" y="9" width="22" height="21" fill="#ffd1a8"/><rect x="8" y="6" width="24" height="7" fill="#6b4226"/><rect x="8" y="12" width="4" height="7" fill="#6b4226"/><rect x="20" y="12" width="6" height="3" fill="#6b4226"/>' +
    '<rect x="13" y="17" width="3" height="5" fill="#2b2140"/><rect x="24" y="17" width="3" height="5" fill="#2b2140"/><rect x="13.5" y="17.5" width="1.2" height="1.4" fill="#fff"/><rect x="24.5" y="17.5" width="1.2" height="1.4" fill="#fff"/>' +
    '<rect x="10.5" y="23" width="3.5" height="2" fill="#ff9aa2"/><rect x="26" y="23" width="3.5" height="2" fill="#ff9aa2"/><rect x="18" y="24" width="4" height="2" fill="#8a3b3b"/></svg>';
  var IC_BRIDGE = '<svg viewBox="0 0 16 16"><rect x="1" y="8" width="14" height="3" fill="#3a2c4f"/><rect x="2" y="9" width="3" height="1" fill="#fff8e8"/><rect x="11" y="9" width="3" height="1" fill="#fff8e8"/><rect x="7" y="9" width="2" height="1" fill="#ffd23f"/><rect x="2" y="4" width="2" height="9" fill="#3a2c4f"/><rect x="12" y="4" width="2" height="9" fill="#3a2c4f"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 16 16"><rect x="1" y="9" width="6" height="6" fill="#ffe2a8" stroke="#3a2c4f" stroke-width="1"/><rect x="9" y="9" width="6" height="6" fill="#ffe2a8" stroke="#3a2c4f" stroke-width="1"/><rect x="5" y="2" width="6" height="6" fill="#fff" stroke="#3a2c4f" stroke-width="1"/><rect x="7" y="4" width="2" height="2" fill="#3a2c4f"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 16 16"><rect x="5" y="1" width="6" height="3" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="2" y="4" width="12" height="11" fill="#ffb36b" stroke="#3a2c4f" stroke-width="1"/><rect x="2" y="4" width="12" height="4" fill="#ff9466" stroke="#3a2c4f" stroke-width="1"/><rect x="5" y="10" width="6" height="3" fill="#fff8e8" stroke="#3a2c4f" stroke-width="1"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 16 16"><rect x="1" y="3" width="5" height="11" fill="#fff8e8" stroke="#3a2c4f" stroke-width="1"/><rect x="6" y="2" width="4" height="11" fill="#d9f2c7" stroke="#3a2c4f" stroke-width="1"/><rect x="10" y="3" width="5" height="11" fill="#fff8e8" stroke="#3a2c4f" stroke-width="1"/><rect x="11" y="6" width="2" height="2" fill="#ff6b6b"/><rect x="3" y="9" width="2" height="1" fill="#5cb6f2"/><rect x="7" y="7" width="2" height="1" fill="#5cb6f2"/></svg>';

  function buildHUD(root) {
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var hud = document.createElement('div'); hud.className = 'voxel-hud';
    hud.innerHTML =
      '<div class="voxel-top voxel-panel"><div class="voxel-ava">' + AVATAR + '</div><div class="voxel-stat">' +
      '<div class="voxel-lvl"><span class="voxel-lv">4</span>Nível 4 · Explorador</div>' +
      '<div class="voxel-xp"><div class="voxel-xpfill"></div><span class="voxel-xptxt">620/1000 XP</span></div></div></div>' +
      '<div class="voxel-quest voxel-panel"><span class="voxel-qi">' + IC_BRIDGE + '</span><div class="voxel-qt"><small>MISSÃO</small>Consertar a ponte da vila</div></div>' +
      '<div class="voxel-bub voxel-panel"><span class="voxel-name">Mestre Tomé</span><div class="voxel-say">A viga precisa se apoiar dos dois lados!</div>' +
      '<span class="voxel-tail"><i style="left:0;top:0;width:100%;height:45%"></i><i style="left:22%;top:40%;width:56%;height:60%;"></i></span></div>' +
      '<div class="voxel-plus">+50 XP</div>' +
      '<div class="voxel-btns"><div class="voxel-btn voxel-b1">' + IC_BUILD + 'Construir</div><div class="voxel-btn voxel-b2">' + IC_BAG + 'Mochila</div><div class="voxel-btn voxel-b3">' + IC_MAP + 'Mapa</div></div>';
    root.appendChild(hud);
    return {
      hud: hud,
      fill: hud.querySelector('.voxel-xpfill'),
      txt: hud.querySelector('.voxel-xptxt'),
      bub: hud.querySelector('.voxel-bub'),
      tail: hud.querySelector('.voxel-tail'),
      plus: hud.querySelector('.voxel-plus'),
      quest: hud.querySelector('.voxel-quest')
    };
  }

  /* ---------- scene ---------- */
  function mount(host) {
    var reduced = false;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var root = document.createElement('div'); root.className = 'voxel-root';
    host.appendChild(root);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    var fade = document.createElement('div'); fade.className = 'voxel-fade'; root.appendChild(fade);
    var H = buildHUD(root);

    var scene = new THREE.Scene();
    var textures = [];
    function tex(canvas, nearest) {
      var t = new THREE.CanvasTexture(canvas);
      if (nearest) { t.magFilter = THREE.NearestFilter; }
      t.anisotropy = 4; textures.push(t); return t;
    }
    var skyTex = tex(skyCanvas());
    scene.background = skyTex;
    scene.fog = new THREE.Fog(0xd6eef8, 24, 52);

    var camera = new THREE.PerspectiveCamera(50, 0.5, 0.1, 120);

    scene.add(new THREE.HemisphereLight(0xeaf6ff, 0xc9b48a, 0.78));
    var sun = new THREE.DirectionalLight(0xfff1d8, 0.72);
    sun.position.set(7, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0015;
    sun.target.position.set(0, 0, -1);
    scene.add(sun); scene.add(sun.target);

    var bevelTex = tex(bevelCanvas());
    var unitBox = new THREE.BoxGeometry(1, 1, 1);
    var matCache = {};
    function mat(color) {
      if (!matCache[color]) matCache[color] = new THREE.MeshLambertMaterial({ color: color, map: bevelTex });
      return matCache[color];
    }

    /* --- voxel batch (instanced) --- */
    var vox = [];
    function V(x, y, z, c, sx, sy, sz) { vox.push([x, y, z, sx || 1, sy || sx || 1, sz || sx || 1, c]); }
    function flushVox() {
      var m = new THREE.InstancedMesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xffffff, map: bevelTex }), vox.length);
      var o = new THREE.Object3D(), col = new THREE.Color();
      for (var i = 0; i < vox.length; i++) {
        var v = vox[i];
        o.position.set(v[0], v[1], v[2]); o.scale.set(v[3], v[4], v[5]); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        col.set(v[6]); m.setColorAt(i, col);
      }
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m); vox = [];
      return m;
    }

    /* --- terrain --- */
    var X0 = -13, X1 = 13, Z0 = -24, Z1 = 10;
    var gBox = new THREE.BoxGeometry(1, 1, 1);
    (function remapUV() {
      var uv = gBox.attributes.uv;
      for (var f = 0; f < 6; f++) {
        var u0, uw, v0, vh;
        if (f === 2) { u0 = 0; uw = 0.5; v0 = 0; vh = 1; }
        else if (f === 3) { u0 = 0.55; uw = 0.4; v0 = 0.05; vh = 0.4; }
        else { u0 = 0.5; uw = 0.5; v0 = 0; vh = 1; }
        for (var k = 0; k < 4; k++) {
          var i = f * 4 + k;
          uv.setXY(i, u0 + uv.getX(i) * uw, v0 + uv.getY(i) * vh);
        }
      }
      uv.needsUpdate = true;
    })();
    var grassTex = tex(grassAtlas());
    var grassMat = new THREE.MeshLambertMaterial({ map: grassTex });
    var cells = [];
    function heightAt(x, z) {
      if (z >= -1 && z <= 1) return -99; // river
      var ring = -z - 11 + Math.round(Math.sin(x * 0.45) * 1.5);
      if (ring >= 6) return 2;
      if (ring >= 1) return 1;
      return 0;
    }
    for (var gx = X0; gx <= X1; gx++) {
      for (var gz = Z0; gz <= Z1; gz++) {
        var h = heightAt(gx, gz);
        if (h === -99) continue;
        cells.push([gx, h - 0.5, gz]);
        for (var hh = h - 1; hh >= 0; hh--) V(gx, hh - 0.5, gz, '#c99a6e');
      }
    }
    var grass = new THREE.InstancedMesh(gBox, grassMat, cells.length);
    (function () {
      var o = new THREE.Object3D(), col = new THREE.Color();
      for (var i = 0; i < cells.length; i++) {
        o.position.set(cells[i][0], cells[i][1], cells[i][2]); o.updateMatrix();
        grass.setMatrixAt(i, o.matrix);
        var b = 0.95 + hash(cells[i][0] * 3, cells[i][2]) * 0.09;
        col.setRGB(b, b, b); grass.setColorAt(i, col);
      }
    })();
    grass.receiveShadow = true;
    scene.add(grass);
    // far ground under fog
    var far = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x9ad979 }));
    far.rotation.x = -Math.PI / 2; far.position.set(0, -1.02, -40); scene.add(far);

    // riverbed
    for (gx = X0; gx <= X1; gx++) for (gz = -1; gz <= 1; gz++) V(gx, -1.5, gz, hash(gx, gz) > 0.7 ? '#e9d6a6' : '#f1e2b8');

    /* --- water (animated translucent cubes) --- */
    var waterTex = tex(waterCanvas());
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x7fd0ec, map: waterTex, transparent: true, opacity: 0.78, depthWrite: false });
    var wCount = (X1 - X0 + 1) * 3;
    var water = new THREE.InstancedMesh(unitBox, waterMat, wCount);
    water.renderOrder = 2;
    scene.add(water);
    var wObj = new THREE.Object3D();
    function updateWater(t) {
      var i = 0, w = Math.PI * 2 / LOOP;
      for (var x = X0; x <= X1; x++) for (var z = -1; z <= 1; z++) {
        var ph = x * 0.7 + z * 1.3;
        wObj.position.set(x, -0.66 + Math.sin(t * w + ph) * 0.05, z);
        wObj.scale.set(1, 0.68, 1); wObj.updateMatrix();
        water.setMatrixAt(i++, wObj.matrix);
      }
      water.instanceMatrix.needsUpdate = true;
      waterTex.offset.x = -(t / LOOP) * 2;
    }
    // lily pads & a rock
    var lily = [];
    [[-3, 0.6], [4, -0.5], [6.5, 0.8], [-6, -0.6]].forEach(function (p) {
      var m = new THREE.Mesh(unitBox, mat('#7cc46a'));
      m.scale.set(0.5, 0.06, 0.5); m.position.set(p[0], -0.27, p[1]); scene.add(m);
      var f = new THREE.Mesh(unitBox, mat('#ffb3c7')); f.scale.set(0.16, 0.12, 0.16); f.position.set(0.1, 1.4, 0); m.add(f);
      lily.push(m);
    });

    /* --- path stones --- */
    [[0, 3], [0.1, 4], [-0.1, 5], [0, 6], [0.2, 7], [0, 8], [0, 9]].forEach(function (p, i) {
      V(p[0] - 0.22, 0.03, p[1] - 0.2, '#efe2c2', 0.5, 0.08, 0.5);
      V(p[0] + 0.25, 0.03, p[1] + 0.22, '#e6d6b1', 0.42, 0.08, 0.42);
    });
    [[-0.4, -2.6], [-0.3, -3.6], [-0.2, -4.6]].forEach(function (p) { V(p[0], 0.03, p[1], '#efe2c2', 0.7, 0.08, 0.7); });

    /* --- bridge --- */
    var WOOD = '#b77a4a', WOOD2 = '#a96d40', WOODD = '#8a5634';
    var deckY = 0.12;
    V(-0.62, -0.02, 0, WOODD, 0.2, 0.2, 5.2);
    V(0.62, -0.02, 0, WOODD, 0.2, 0.2, 5.2);
    for (var k = 0; k <= 8; k++) {
      var pz = -2 + k * 0.5;
      if (k === 4) continue;
      V(0, deckY + 0.06, pz, k % 2 ? WOOD : WOOD2, 1.5, 0.16, 0.44);
    }
    [[-0.72, -1.6], [0.72, -1.6], [-0.72, 1.6], [0.72, 1.6], [-0.72, -2.4], [0.72, -2.4], [-0.72, 2.4], [0.72, 2.4]].forEach(function (p) {
      V(p[0], 0.2, p[1], WOODD, 0.2, 1.4, 0.2);
    });
    V(-0.72, 0.85, 0, '#c58d5c', 0.12, 0.12, 5.0);
    V(0.72, 0.85, 0, '#c58d5c', 0.12, 0.12, 5.0);
    [[-0.72, 0], [0.72, 0]].forEach(function (p) { V(p[0], -0.4, p[1] + 0.9, WOODD, 0.18, 1.1, 0.18); V(p[0], -0.4, p[1] - 0.9, WOODD, 0.18, 1.1, 0.18); });

    /* --- trees --- */
    function tree(x, z, s, leaf) {
      s = s || 1;
      for (var i = 0; i < 3; i++) V(x, 0.3 + i * 0.6 * s, z, '#9c6a43', 0.5 * s, 0.6 * s, 0.5 * s);
      var L = leaf || '#7fcf8a', L2 = '#69bd78', top = 1.9 * s;
      for (var ix = -1; ix <= 1; ix++) for (var iz = -1; iz <= 1; iz++) for (var iy = 0; iy < 2; iy++) {
        if (Math.abs(ix) + Math.abs(iz) === 2 && iy === 1) continue;
        V(x + ix * 0.6 * s, top + iy * 0.6 * s, z + iz * 0.6 * s, (ix + iz + iy) % 2 ? L : L2, 0.6 * s);
      }
      V(x, top + 1.2 * s, z, L, 0.6 * s);
      V(x + 0.3 * s, top + 0.25 * s, z + 0.95 * s, '#ff8fa3', 0.16 * s);
      V(x - 0.95 * s, top + 0.75 * s, z + 0.2 * s, '#ff8fa3', 0.16 * s);
    }
    tree(-3.6, 4.2, 1); tree(7.4, 5.2, 1.05, '#8fd694'); tree(-3.3, -4.9, 1.1); tree(-6.2, -2.8, 0.95, '#a3dd8f');
    tree(6.8, -7.5, 1.2, '#8fd694'); tree(-8, -9, 1.3); tree(1.8, -11, 1.25, '#a3dd8f'); tree(-6.5, 7.5, 1.1); tree(7.5, 2.5, 0.9, '#a3dd8f');
    tree(-11, -4, 1.1); tree(11, -12, 1.3);

    /* --- house (0.5 voxels) --- */
    (function house(cx, cz) {
      var s = 0.5, W = 7, D = 6, Hh = 5;
      for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) {
        if (x > 0 && x < W - 1 && z > 0 && z < D - 1) continue;
        var px = cx + (x - (W - 1) / 2) * s, pz = cz + (z - (D - 1) / 2) * s, py = s / 2 + y * s;
        var front = z === D - 1;
        if (front && x === 3 && y < 3) continue; // door
        if (front && (x === 1 || x === 5) && (y === 2 || y === 3)) { V(px, py, pz, '#bfeaff', s); continue; }
        if ((x === 0 || x === W - 1) && (z === 0 || z === D - 1)) { V(px, py, pz, '#d9b48a', s); continue; }
        V(px, py, pz, y === 0 ? '#e8d6bd' : '#fff2dc', s);
      }
      // door
      V(cx, 0.75, cz + (D - 1) / 2 * s + 0.02, '#a86a45', 0.5, 1.5, 0.5);
      V(cx + 0.15, 0.75, cz + (D - 1) / 2 * s + 0.28, '#ffd24d', 0.08);
      // roof (stepped)
      for (var r = 0; r < 4; r++) {
        var ry = Hh * s + r * s / 1.0 * 0.5 + s / 2;
        for (x = -1 + r; x <= W - r; x++) {
          for (z = -1; z <= D; z++) {
            var rx = cx + (x - (W - 1) / 2) * s, rz = cz + (z - (D - 1) / 2) * s;
            if (x === -1 + r || x === W - r || r === 3) V(rx, ry, rz, (z % 2) ? '#ff7f6e' : '#f26d5d', s, s * 0.5, s);
          }
        }
      }
      for (x = 3; x <= 3; x++) for (z = -1; z <= D; z++) V(cx + (x - (W - 1) / 2) * s, Hh * s + 2.0, cz + (z - (D - 1) / 2) * s, '#f26d5d', s, s * 0.5, s);
      V(cx + 1.0, Hh * s + 1.5, cz - 0.6, '#c9b9a8', 0.4, 1.0, 0.4);
      // flower box & bushes
      V(cx - 1.0, 1.0, cz + 1.65, '#a86a45', 0.6, 0.15, 0.25);
      V(cx - 1.15, 1.14, cz + 1.65, '#ff8fa3', 0.15); V(cx - 0.85, 1.14, cz + 1.65, '#ffd24d', 0.15);
      V(cx + 1.0, 1.0, cz + 1.65, '#a86a45', 0.6, 0.15, 0.25);
      V(cx + 1.15, 1.14, cz + 1.65, '#ff8fa3', 0.15); V(cx + 0.85, 1.14, cz + 1.65, '#b49cff', 0.15);
    })(-0.2, -6.4);

    /* --- fence, flowers, crates --- */
    for (var f = 0; f < 5; f++) { V(2.2 + f * 0.6, 0.3, 3.1, '#e7c79a', 0.14, 0.6, 0.14); }
    V(3.4, 0.42, 3.1, '#e7c79a', 2.6, 0.1, 0.08); V(3.4, 0.2, 3.1, '#e7c79a', 2.6, 0.1, 0.08);
    var flowerCols = ['#ff8fa3', '#ffd24d', '#b49cff', '#ffffff', '#ff9466'];
    for (f = 0; f < 34; f++) {
      var fx = (hash(f, 1) - 0.5) * 16, fz = (hash(f, 2) - 0.5) * 18 - 1;
      if (Math.abs(fz) < 2.2 || (Math.abs(fx) < 1.2 && fz > 2)) continue;
      V(fx, 0.06, fz, '#5fae5a', 0.08, 0.14, 0.08);
      V(fx, 0.18, fz, flowerCols[f % 5], 0.16);
    }
    // crates + spare planks near the bridge (the builder's spot)
    V(-1.7, 0.25, 2.9, '#d9a066', 0.5); V(-1.7, 0.75, 2.9, '#e0ae78', 0.5); V(-2.25, 0.25, 3.1, '#d9a066', 0.5);
    V(-1.9, 0.08, 3.8, WOOD, 1.2, 0.14, 0.4); V(-1.9, 0.22, 3.8, WOOD2, 1.2, 0.14, 0.4);
    // rocks
    [[2.6, -2.2], [-2.3, 2.3], [5.5, 2.2], [-5, 2.1]].forEach(function (p) { V(p[0], 0.15, p[1], '#c8c3d6', 0.5, 0.3, 0.45); V(p[0] + 0.3, 0.1, p[1] + 0.2, '#b6b0c7', 0.3, 0.2, 0.3); });

    var staticVox = flushVox();

    /* --- clouds --- */
    var clouds = new THREE.Group(); scene.add(clouds);
    var cMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35, map: bevelTex, fog: false });
    [[-6, 11, -18, 1.4], [6, 13, -22, 1.8], [-1, 15, -30, 2.2], [10, 10, -14, 1.1]].forEach(function (c) {
      var g = new THREE.Group();
      [[0, 0, 0, 3, 0.9, 1.6], [1.0, 0.6, 0, 1.8, 0.8, 1.3], [-0.9, 0.4, 0.2, 1.4, 0.7, 1.2]].forEach(function (b) {
        var m = new THREE.Mesh(unitBox, cMat); m.position.set(b[0], b[1], b[2]); m.scale.set(b[3], b[4], b[5]); g.add(m);
      });
      g.scale.setScalar(c[3]); g.position.set(c[0], c[1], c[2]); g.userData.x = c[0];
      clouds.add(g);
    });

    /* --- characters --- */
    function part(parent, w, h, d, c, x, y, z) {
      var m = new THREE.Mesh(unitBox, mat(c)); m.scale.set(w, h, d); m.position.set(x, y, z);
      m.castShadow = true; parent.add(m); return m;
    }
    function pivot(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }

    // HERO
    var hero = new THREE.Group(); scene.add(hero);
    var hb = pivot(hero, 0, 0, 0);
    var SKIN = '#ffd1a8', BLUE = '#4a8fe0', BLUE2 = '#3a6fc0';
    var legL = pivot(hb, -0.13, 0.42, 0), legR = pivot(hb, 0.13, 0.42, 0);
    [legL, legR].forEach(function (l) { part(l, 0.2, 0.32, 0.22, '#35508a', 0, -0.18, 0); part(l, 0.22, 0.12, 0.28, '#6b4a3a', 0, -0.37, 0.03); });
    part(hb, 0.5, 0.46, 0.32, BLUE, 0, 0.64, 0);
    part(hb, 0.52, 0.08, 0.34, BLUE2, 0, 0.45, 0);
    part(hb, 0.2, 0.1, 0.02, '#ffffff', 0, 0.72, 0.17);
    var armL = pivot(hb, -0.32, 0.82, 0), armR = pivot(hb, 0.32, 0.82, 0);
    [armL, armR].forEach(function (a) { part(a, 0.15, 0.3, 0.17, BLUE, 0, -0.12, 0); part(a, 0.14, 0.12, 0.15, SKIN, 0, -0.32, 0); });
    // backpack
    part(hb, 0.42, 0.44, 0.2, '#ff9a3c', 0, 0.68, -0.26);
    part(hb, 0.44, 0.14, 0.22, '#f07a24', 0, 0.86, -0.27);
    part(hb, 0.24, 0.14, 0.06, '#ffc27a', 0, 0.58, -0.38);
    var head = pivot(hb, 0, 1.18, 0);
    part(head, 0.66, 0.6, 0.6, SKIN, 0, 0.1, 0);
    part(head, 0.7, 0.2, 0.64, '#6b4226', 0, 0.44, -0.01);
    part(head, 0.7, 0.4, 0.14, '#6b4226', 0, 0.24, -0.26);
    part(head, 0.12, 0.26, 0.6, '#6b4226', -0.31, 0.26, 0); part(head, 0.12, 0.26, 0.6, '#6b4226', 0.31, 0.26, 0);
    part(head, 0.26, 0.1, 0.06, '#6b4226', 0.12, 0.31, 0.3);
    part(head, 0.1, 0.15, 0.03, '#2b2140', -0.14, 0.08, 0.305); part(head, 0.1, 0.15, 0.03, '#2b2140', 0.14, 0.08, 0.305);
    part(head, 0.04, 0.05, 0.02, '#ffffff', -0.12, 0.12, 0.322); part(head, 0.04, 0.05, 0.02, '#ffffff', 0.16, 0.12, 0.322);
    part(head, 0.11, 0.06, 0.02, '#ff9aa2', -0.24, -0.04, 0.305); part(head, 0.11, 0.06, 0.02, '#ff9aa2', 0.24, -0.04, 0.305);
    part(head, 0.12, 0.04, 0.02, '#8a3b3b', 0, -0.07, 0.305);

    // MENTOR — Mestre Tomé
    var tome = new THREE.Group(); scene.add(tome);
    var tb = pivot(tome, 0, 0, 0);
    var tl1 = pivot(tb, -0.16, 0.42, 0), tl2 = pivot(tb, 0.16, 0.42, 0);
    [tl1, tl2].forEach(function (l) { part(l, 0.24, 0.34, 0.26, '#6f6a8a', 0, -0.17, 0); part(l, 0.26, 0.12, 0.32, '#5a3d2e', 0, -0.37, 0.03); });
    part(tb, 0.68, 0.6, 0.42, '#f3ead8', 0, 0.72, 0);
    part(tb, 0.56, 0.62, 0.04, '#9b6338', 0, 0.62, 0.22);
    part(tb, 0.24, 0.14, 0.03, '#b57a48', 0, 0.56, 0.245);
    part(tb, 0.04, 0.16, 0.03, '#ffd24d', 0.06, 0.66, 0.255);
    var tA1 = pivot(tb, -0.42, 0.96, 0), tA2 = pivot(tb, 0.42, 0.96, 0);
    [tA1, tA2].forEach(function (a) { part(a, 0.18, 0.36, 0.2, '#f3ead8', 0, -0.15, 0); part(a, 0.17, 0.14, 0.18, '#f2c39c', 0, -0.38, 0); });
    var th = pivot(tb, 0, 1.36, 0);
    part(th, 0.66, 0.58, 0.58, '#f2c39c', 0, 0.06, 0);
    part(th, 0.7, 0.3, 0.2, '#ffffff', 0, -0.14, 0.24);
    part(th, 0.4, 0.18, 0.12, '#ffffff', 0, -0.33, 0.26);
    part(th, 0.12, 0.36, 0.5, '#ffffff', -0.3, 0.0, 0.02); part(th, 0.12, 0.36, 0.5, '#ffffff', 0.3, 0.0, 0.02);
    part(th, 0.3, 0.08, 0.04, '#f2f2f2', 0, -0.0, 0.34);
    part(th, 0.12, 0.1, 0.06, '#e3a77e', 0, 0.06, 0.32);
    part(th, 0.12, 0.04, 0.03, '#8a3b3b', 0, -0.1, 0.345);
    part(th, 0.09, 0.08, 0.03, '#2b2140', -0.14, 0.15, 0.3); part(th, 0.09, 0.08, 0.03, '#2b2140', 0.14, 0.15, 0.3);
    part(th, 0.14, 0.04, 0.03, '#ffffff', -0.14, 0.23, 0.3); part(th, 0.14, 0.04, 0.03, '#ffffff', 0.14, 0.23, 0.3);
    part(th, 0.74, 0.24, 0.66, '#ffcf3a', 0, 0.42, -0.01);
    part(th, 0.5, 0.12, 0.5, '#ffcf3a', 0, 0.58, -0.01);
    part(th, 0.8, 0.06, 0.24, '#f4b81f', 0, 0.31, 0.38);
    part(th, 0.06, 0.2, 0.68, '#f4b81f', 0, 0.48, -0.01);
    tome.position.set(-0.9, 0, -3.0);
    tome.rotation.y = 0.35;

    /* --- the missing beam + slot marker + fx --- */
    var beam = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xd08a52, map: bevelTex, emissive: 0xffd27a, emissiveIntensity: 0 }));
    beam.scale.set(1.5, 0.16, 0.44); beam.castShadow = true; scene.add(beam);
    var slotGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.52, 0.18, 0.46));
    var slot = new THREE.LineSegments(slotGeo, new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true }));
    slot.position.set(0, deckY + 0.06, 0); scene.add(slot);
    var slotFill = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color: 0xfff1a6, transparent: true, opacity: 0.3, depthWrite: false }));
    slotFill.scale.set(1.48, 0.12, 0.42); slotFill.position.copy(slot.position); scene.add(slotFill);

    var starTex = tex(starCanvas());
    var stars = [];
    for (var si = 0; si < 12; si++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false }));
      var a = si / 12 * Math.PI * 2;
      sp.userData = { dx: Math.cos(a), dz: Math.sin(a), up: 0.8 + (si % 3) * 0.35, sz: 0.22 + (si % 2) * 0.12 };
      sp.visible = false; scene.add(sp); stars.push(sp);
    }
    var puffs = [];
    var puffMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, map: bevelTex });
    for (si = 0; si < 8; si++) {
      var pm = new THREE.Mesh(unitBox, puffMat);
      var b2 = si / 8 * Math.PI * 2;
      pm.userData = { dx: Math.cos(b2) * (si % 2 ? 1 : 0.4), dz: Math.sin(b2) * 0.5 };
      pm.visible = false; scene.add(pm); puffs.push(pm);
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
      obj.getWorldPosition(tmpV); tmpV.y += y || 0;
      tmpV.project(camera);
      return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * Hgt };
    }

    /* --- animation --- */
    var t0 = performance.now(), raf = 0;
    var camBase = new THREE.Vector3(5.5, 6.7, 7.2), look = new THREE.Vector3(-0.4, 0.3, 0.0);
    var HERO_Z0 = 4.7, HERO_Z1 = 2.95;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = typeof window.__SCENE_TIME === 'number' ? window.__SCENE_TIME : ((now - t0) / 1000) % LOOP;
      var w = Math.PI * 2 / LOOP;
      var amp = reduced ? 0.15 : 1;

      // camera: slow dolly-in that loops
      var cyc = 0.5 - 0.5 * Math.cos(t * w);
      camera.position.set(camBase.x - cyc * 0.6 * amp, camBase.y - cyc * 0.4 * amp, camBase.z - cyc * 1.0 * amp);
      camera.lookAt(look.x, look.y, look.z - cyc * 0.4 * amp);

      updateWater(t);
      lily.forEach(function (m, i) { m.position.y = -0.27 + Math.sin(t * w + i * 1.7) * 0.05; m.rotation.y = Math.sin(t * w + i) * 0.15; });
      clouds.children.forEach(function (c, i) { c.position.x = c.userData.x + Math.sin(t * w + i) * 0.35; });

      // hero walk
      var walkK = sstep(0, 1.25, t);
      var walking = t < 1.25;
      hero.position.set(lerp(0.05, 0, walkK), 0, lerp(HERO_Z0, HERO_Z1, walkK));
      hero.rotation.y = Math.PI + (walking ? 0 : Math.sin(t * 2) * 0.08);
      var cyc2 = Math.sin(t * 13);
      var wa = walking ? sstep(0, 0.15, t) * (1 - sstep(1.05, 1.25, t)) : 0;
      legL.rotation.x = cyc2 * 0.7 * wa; legR.rotation.x = -cyc2 * 0.7 * wa;
      armL.rotation.x = -cyc2 * 0.6 * wa; armR.rotation.x = cyc2 * 0.6 * wa;
      hb.position.y = Math.abs(cyc2) * 0.06 * wa;
      // joy hop after the fix
      var hop = t > 2.3 && t < 2.75 ? Math.sin((t - 2.3) / 0.45 * Math.PI) : 0;
      hb.position.y += hop * 0.35;
      if (hop > 0) { armL.rotation.z = -hop * 2.2; armR.rotation.z = hop * 2.2; armL.rotation.x = 0; armR.rotation.x = 0; }
      else { armL.rotation.z = 0; armR.rotation.z = 0; }
      if (!walking) hb.position.y += Math.sin(t * 5) * 0.012;
      head.rotation.x = walking ? 0 : -0.05;

      // mentor
      tb.position.y = Math.sin(t * w * 2) * 0.015;
      var point = sstep(0.7, 1.0, t) * (1 - sstep(2.9, 3.2, t));
      tA2.rotation.x = -point * 1.5; tA2.rotation.z = point * 0.35;
      var cheer = t > 2.3 && t < 2.9 ? Math.sin((t - 2.3) / 0.6 * Math.PI) : 0;
      tA1.rotation.z = -cheer * 2.4;
      th.rotation.z = Math.sin(t * w * 2) * 0.04;
      th.rotation.y = 0.15 * point;

      // beam drop & click
      var bt = clamp((t - 1.6) / 0.6, 0, 1);
      var by;
      if (t < 1.6) { beam.visible = false; }
      else {
        beam.visible = t < 3.33;
        if (bt < 1) { var e = bt * bt; by = lerp(4.2, deckY + 0.06, e); beam.rotation.set(0, (1 - e) * 1.2, (1 - e) * 0.4); }
        else { var ft = t - 2.2; by = deckY + 0.06 + Math.max(0, Math.sin(ft * 18) * Math.exp(-ft * 9) * 0.12); beam.rotation.set(0, 0, 0); }
        beam.position.set(0, by, 0);
        var sc2 = t < 1.75 ? outBack(clamp((t - 1.6) / 0.15, 0, 1)) : 1;
        beam.scale.set(1.5 * sc2, 0.16 * sc2, 0.44 * sc2);
        beam.material.emissiveIntensity = t < 2.2 ? 0.25 : 0.6 * Math.exp(-(t - 2.2) * 4);
      }
      var slotOn = t < 2.2 ? 1 : 1 - sstep(2.2, 2.35, t);
      slot.material.opacity = slotOn * (0.55 + 0.45 * Math.sin(t * 9));
      slotFill.material.opacity = slotOn * (0.38 + 0.2 * Math.sin(t * 9));
      slot.visible = slotFill.visible = slotOn > 0.01;

      // sparkle + dust
      var ft2 = t - 2.2;
      stars.forEach(function (s) {
        if (ft2 > 0 && ft2 < 0.75) {
          s.visible = true;
          var k = ft2 / 0.75, d = s.userData;
          s.position.set(d.dx * (0.4 + k * 1.1), deckY + 0.2 + d.up * Math.sin(k * Math.PI * 0.8), d.dz * (0.3 + k * 0.6));
          var z = d.sz * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.7);
          s.scale.set(z, z, z); s.material.opacity = 1 - k * k; s.material.rotation = k * 3;
        } else s.visible = false;
      });
      puffs.forEach(function (p) {
        if (ft2 > 0 && ft2 < 0.6) {
          p.visible = true; var k = ft2 / 0.6;
          p.position.set(p.userData.dx * (0.7 + k * 0.5), deckY + 0.1 + k * 0.25, p.userData.dz * (0.5 + k * 0.4));
          var z = 0.12 + k * 0.14; p.scale.set(z, z, z); p.rotation.y = k * 2;
        } else p.visible = false;
      });
      puffMat.opacity = ft2 > 0 && ft2 < 0.6 ? 0.9 * (1 - ft2 / 0.6) : 0;

      // loop fade
      var fo = t > 3.05 ? (t < 3.33 ? sstep(3.05, 3.33, t) : 1 - sstep(3.33, 3.6, t)) : 0;
      fade.style.opacity = fo.toFixed(3);

      renderer.render(scene, camera);

      // --- HUD dynamics ---
      var bubIn = sstep(0.8, 1.0, t), bubOut = 1 - sstep(2.3, 2.5, t);
      var bo = bubIn * bubOut;
      var hp = toScreen(th, 1.0);
      var bw = H.bub.offsetWidth, bh = H.bub.offsetHeight;
      var bx = clamp(hp.x - bw * 0.82, 10, W - bw - 10);
      var minTop = H.quest.offsetTop + H.quest.offsetHeight + 26 * S;
      var byy = Math.max(minTop, hp.y - bh - 22 * S);
      var pop = bubIn < 1 ? outBack(bubIn) : 1;
      H.bub.style.opacity = bo.toFixed(3);
      H.bub.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + byy.toFixed(1) + 'px) scale(' + (0.6 + 0.4 * pop).toFixed(3) + ')';
      H.tail.style.left = clamp(hp.x - bx - 8 * S, 12 * S, bw - 30 * S).toFixed(1) + 'px';

      var pt = clamp((t - 2.4) / 0.8, 0, 1);
      var bp = toScreen(beam.visible ? beam : slot, 0.4);
      H.plus.style.opacity = (pt > 0 && pt < 1 ? (pt < 0.15 ? pt / 0.15 : 1 - sstep(0.6, 1, pt)) : 0).toFixed(3);
      H.plus.style.transform = 'translate(' + (bp.x - 48 * S).toFixed(1) + 'px,' + (bp.y - 30 * S - pt * 90 * S).toFixed(1) + 'px) scale(' + (0.7 + 0.3 * outBack(clamp(pt / 0.25, 0, 1))).toFixed(3) + ')';

      var fill = 620 + 50 * sstep(2.55, 2.95, t) * (1 - sstep(3.1, 3.5, t));
      H.fill.style.width = (fill / 10).toFixed(2) + '%';
      H.txt.textContent = Math.round(fill) + '/1000 XP';
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
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        host.innerHTML = '';
      }
    };
  }

  window.SCENES[ID] = { mount: mount };
})();
