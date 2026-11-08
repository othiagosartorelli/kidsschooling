/* Estilo COMBINADO (recomendado) — KidsSchooling
   Mundo em cartoon 3D estilizado, câmera alta quase isométrica (FOV baixo),
   construção com blocos de encaixe próprios (pinos hexagonais + chaves "borboleta"),
   HUD em ilustração 2D limpa com mini mapa isométrico. Loop de 3,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'combinado';
  var LOOP = 3.6;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* câmera: azimute e elevação (graus) */
  var AZ = 35 * Math.PI / 180, EL = 53 * Math.PI / 180, FOV = 30;
  var RX = Math.cos(AZ), RZ = -Math.sin(AZ);    // vetor "direita" da tela no chão
  var FX = -Math.sin(AZ), FZ = -Math.cos(AZ);   // vetor "para cima" da tela no chão
  function uv2w(u, v) { return { x: RX * u + FX * v, z: RZ * u + FZ * v }; }

  /* rio e caminhos (mundo) */
  function riverZ(x) { return 0.32 * Math.sin(x * 0.33 + 0.4) - 0.12 * Math.sin(x * 0.9); }
  function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }
  var PATHS = [
    [[0.9, 7.5], [0.35, 5.2], [0.05, 3.6], [0, 2.4]],
    [[0, -2.4], [-0.2, -3.4], [-0.8, -4.4], [-1.4, -5.6], [-1.9, -7.5]],
    [[-0.2, -3.4], [0.9, -3.6], [1.8, -3.5]]
  ];
  function pathD(x, z) {
    var d = 99;
    for (var p = 0; p < PATHS.length; p++) { var P = PATHS[p]; for (var i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); }
    return d;
  }

  /* ---------- HUD (ilustração 2D limpa) ---------- */
  var CSS = [
    '.combinado-root{position:absolute;inset:0;overflow:hidden;background:#8fcf6a;-webkit-user-select:none;user-select:none;}',
    '.combinado-root canvas.combinado-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.combinado-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 80% at 50% 48%,rgba(255,255,255,0) 55%,rgba(40,60,40,.22) 100%);}',
    '.combinado-wipe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;}',
    '.combinado-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.combinado-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(120,90,50,.10),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(50,40,20,.20);}',
    '.combinado-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.combinado-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.combinado-ava svg{display:block;width:100%;height:100%;}',
    '.combinado-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.combinado-stat{flex:1;min-width:0;}',
    '.combinado-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.combinado-ttl span{color:#2f6fe0;}',
    '.combinado-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#efe5d3;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(80,60,30,.18);overflow:hidden;}',
    '.combinado-fill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(90deg,#43c59e,#7fdc5a);}',
    '.combinado-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.combinado-flash{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.combinado-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#7b6f5e;font-variant-numeric:tabular-nums;}',
    '.combinado-xpn b{color:#2a3350;font-weight:800;}',
    '.combinado-pause{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#f3ead9;display:grid;place-items:center;}',
    '.combinado-pause svg{width:46%;height:46%;}',
    '.combinado-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(12px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:calc(214px*var(--s));}',
    '.combinado-qi{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#e3f1ff;display:grid;place-items:center;}',
    '.combinado-qi svg{width:80%;height:80%;}',
    '.combinado-qt{font-weight:700;font-size:calc(13.5px*var(--s));line-height:1.18;color:#3a4260;}',
    '.combinado-qt b{font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#ff7a1a;}',
    '.combinado-chk{flex:none;width:calc(20px*var(--s));height:calc(20px*var(--s));border-radius:50%;border:calc(2px*var(--s)) solid #d9ccb5;display:grid;place-items:center;box-sizing:border-box;}',
    '.combinado-chk svg{width:80%;height:80%;opacity:0;}',
    '.combinado-map{position:absolute;right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));width:calc(112px*var(--s));padding:calc(6px*var(--s)) calc(6px*var(--s)) calc(4px*var(--s));}',
    '.combinado-map h4{margin:0 0 calc(1px*var(--s)) calc(3px*var(--s));font:600 calc(11.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#7b6f5e;letter-spacing:.02em;display:flex;align-items:center;gap:calc(4px*var(--s));}',
    '.combinado-map h4 i{width:calc(7px*var(--s));height:calc(7px*var(--s));border-radius:50%;background:#2f6fe0;display:inline-block;}',
    '.combinado-map svg{display:block;width:100%;height:auto;}',
    '.combinado-bub{position:absolute;left:0;top:0;width:calc(200px*var(--s));padding:calc(16px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;transform-origin:0 0;}',
    '.combinado-bub .combinado-tail{position:absolute;top:calc(-9px*var(--s));left:var(--tx,24px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));box-shadow:calc(4px*var(--s)) calc(4px*var(--s)) calc(8px*var(--s)) rgba(50,40,20,.12);}',
    '.combinado-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#ffc93c;color:#4a3208;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(120,80,10,.25);}',
    '.combinado-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.combinado-say{position:relative;font-weight:700;font-size:calc(15px*var(--s));line-height:1.25;color:#2a3350;}',
    '.combinado-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(50,40,20,.25);font:600 calc(19px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1f9e6e;}',
    '.combinado-xp svg{width:calc(22px*var(--s));height:calc(22px*var(--s));}',
    '.combinado-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.combinado-btn{flex:1;height:calc(72px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.combinado-btn i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));display:grid;place-items:center;}',
    '.combinado-btn i svg{width:76%;height:76%;}',
    '.combinado-btn.combinado-pri{background:linear-gradient(180deg,#ff9b3d,#ff7a1a);color:#fff;box-shadow:0 0 0 calc(1px*var(--s)) rgba(160,70,0,.15),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(200,90,0,.35);}',
    '.combinado-btn.combinado-pri i{background:rgba(255,255,255,.22);}'
  ].join('\n');

  /* ícones SVG flat */
  var AVATAR = '<svg viewBox="0 0 64 64"><defs><linearGradient id="combinado-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="combinado-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#combinado-avbg)"/>' +
    '<g clip-path="url(#combinado-avc)">' +
    '<path d="M18 30c-4 0-6 4-6 10v24h12z" fill="#ff8a2a"/><path d="M46 30c4 0 6 4 6 10v24H40z" fill="#ff8a2a"/>' +
    '<path d="M11 64c1-11 9-16 21-16s20 5 21 16z" fill="#2f74e6"/><path d="M25 48.5l7 5 7-5" fill="none" stroke="#9cc4ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M17 50l5 14M47 50l-5 14" stroke="#e86f12" stroke-width="4.2" stroke-linecap="round"/>' +
    '<circle cx="32" cy="30" r="14.5" fill="#ffcfa6"/><circle cx="17.8" cy="31" r="3.2" fill="#f7b98e"/><circle cx="46.2" cy="31" r="3.2" fill="#f7b98e"/>' +
    '<path d="M17 28.5c-.6-9.5 6-15.5 15-15.5 9.2 0 15.6 6 15 15.5-2.2-3.4-5.5-5.6-9.5-6.3 1.4 1.6 1.8 3.2 1.6 4.6-3.7-3.8-9.7-5.1-15-3.8-2.7.7-5.1 2.6-7.1 5.5z" fill="#7a4426"/>' +
    '<path d="M31 13.5c1.5-4.5 5.5-6.5 9-5.5-2 1.2-3.2 3-3.4 5.4z" fill="#7a4426"/>' +
    '<path d="M22.2 27.6q3-2 5.8-.4M36 27.2q2.8-1.6 5.8.4" stroke="#5c321b" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="26" cy="31.8" rx="2.6" ry="3.2" fill="#2a2342"/><ellipse cx="38" cy="31.8" rx="2.6" ry="3.2" fill="#2a2342"/><circle cx="26.9" cy="30.6" r="1" fill="#fff"/><circle cx="38.9" cy="30.6" r="1" fill="#fff"/>' +
    '<ellipse cx="21.8" cy="36.4" rx="2.6" ry="1.6" fill="#ff9a8a" opacity=".6"/><ellipse cx="42.2" cy="36.4" rx="2.6" ry="1.6" fill="#ff9a8a" opacity=".6"/>' +
    '<path d="M27.5 37.4q4.5 4.6 9 0z" fill="#b8473c"/><path d="M29 38.2q3 1.3 6 0" stroke="#fff" stroke-width="1" fill="none"/>' +
    '</g></svg>';
  var IC_PAUSE = '<svg viewBox="0 0 20 20"><rect x="4.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/><rect x="11.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/></svg>';
  var IC_QUEST = '<svg viewBox="0 0 32 32"><path d="M3 22h26" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/><path d="M4 26q3-2 6 0t6 0 6 0 6 0" stroke="#5aa9e6" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<rect x="4" y="15" width="7" height="5" rx="1.5" fill="#c98a4b"/><rect x="21" y="15" width="7" height="5" rx="1.5" fill="#c98a4b"/><rect x="12.5" y="15" width="7" height="5" rx="1.5" fill="none" stroke="#ff8a2a" stroke-width="1.6" stroke-dasharray="2 1.6"/>' +
    '<path d="M14.5 15l1-1.6h2l1 1.6" fill="#ffc93c"/><path d="M5 15v-6M27 15v-6" stroke="#9c6237" stroke-width="2.2" stroke-linecap="round"/><path d="M5 9q11 5 22 0" stroke="#e8d3a8" stroke-width="1.6" fill="none"/></svg>';
  var IC_CHECK = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_HELMET = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><path d="M5 15a7 7 0 0 1 14 0z" fill="#ffc93c" stroke="#d99a12" stroke-width="1.2"/><rect x="3.5" y="14.5" width="17" height="3" rx="1.5" fill="#f2a71a"/><path d="M12 8v6" stroke="#d99a12" stroke-width="1.6"/></svg>';
  var IC_XP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 32 32"><path d="M5 19l11-5.5L27 19 16 24.5z" fill="#fff"/><path d="M5 19v4.5L16 29v-4.5z" fill="#ffe2c4"/><path d="M27 19v4.5L16 29v-4.5z" fill="#ffd0a3"/>' +
    '<path d="M9 10.5l7-3.5 7 3.5-7 3.5z" fill="#fff"/><path d="M9 10.5v3.8l7 3.5v-3.8z" fill="#ffe2c4"/><path d="M23 10.5v3.8l-7 3.5v-3.8z" fill="#ffd0a3"/>' +
    '<path d="M13.6 9.2l1.2-.7h2.4l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/><path d="M8.8 18.6l1.2-.7h2.4l1.2.7-1.2.7H10z M18.4 18.6l1.2-.7H22l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 32 32"><path d="M11 9V7.5a5 5 0 0 1 10 0V9" stroke="#e86f12" stroke-width="2.6" fill="none"/><rect x="6" y="9" width="20" height="19" rx="6" fill="#ff8a2a"/><path d="M6 15.5a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1H6z" fill="#e86f12"/><rect x="12" y="19" width="8" height="5.5" rx="2" fill="#ffc48a"/><circle cx="16" cy="16.5" r="1.6" fill="#ffc93c"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 32 32"><path d="M16 5l12 6.5L16 18 4 11.5z" fill="#8fd16a"/><path d="M4 11.5V16l12 6.5V18z" fill="#5fae4a"/><path d="M28 11.5V16l-12 6.5V18z" fill="#4c963d"/>' +
    '<path d="M9.5 8.5l13 7" stroke="#5aa9e6" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12.6" r="2.2" fill="#2f6fe0" stroke="#fff" stroke-width="1"/><path d="M20 27l2-3.5 2 3.5z" fill="#ff7a1a"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(20261108);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }

      var root = document.createElement('div'); root.className = 'combinado-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x8fcf6a);
      var cv = renderer.domElement; cv.className = 'combinado-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xd9efd0, 30, 52);
      var camera = new THREE.PerspectiveCamera(FOV, W / H, 1, 120);

      /* ----- materiais compartilhados com "rim light" leve ----- */
      var rimU = { uRimColor: { value: new THREE.Color(0xfff1d6) }, uRimStr: { value: 0.42 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return 'combinado-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
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

      /* bloco de cantos arredondados (normais analíticas, ~300 tri) */
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
      var gSph = G('sph', function () { return new THREE.SphereGeometry(1, 22, 16); });
      var gSphLo = G('sphlo', function () { return new THREE.SphereGeometry(1, 12, 8); });
      var gCyl = G('cyl', function () { return new THREE.CylinderGeometry(1, 1, 1, 16); });
      var gHemi = G('hemi', function () { return new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); });
      var gSmile = G('smile', function () { return new THREE.TorusGeometry(1, 0.28, 6, 14, Math.PI); });
      var gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
      var gBow = G('bow', function () {
        var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
        var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
      });

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

      /* ----- luzes ----- */
      scene.add(new THREE.HemisphereLight(0xd6ecff, 0x7f9f62, 0.6));
      var sun = new THREE.DirectionalLight(0xffe2b5, 0.86);
      sun.position.set(-5.5, 11, 1.5); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 2; sc.far = 30;
      sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
      sun.target.position.set(0.4, 0, 0.8);
      scene.add(sun); scene.add(sun.target);
      var back = new THREE.DirectionalLight(0xbfe0ff, 0.28); back.position.set(4, 5, -8); scene.add(back);

      /* ----- chão com cores por vértice ----- */
      var GS = 44, GN = 120;
      var gg = new THREE.PlaneGeometry(GS, GS, GN, GN);
      gg.rotateX(-Math.PI / 2); gg.translate(0, 0, 0);
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
      var cGrA = new THREE.Color(0x86cf5c), cGrB = new THREE.Color(0x6bbd4c), cGrC = new THREE.Color(0x9bd162), cPath = new THREE.Color(0xe6c68c), cPathE = new THREE.Color(0xd0a96c), cSand = new THREE.Color(0xe8d29a), cBed = new THREE.Color(0x3fa5a8), cWet = new THREE.Color(0xc9b17a);
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i);
        var d = Math.abs(z - riverZ(x));
        var y = -0.62 * (1 - sstep(1.25, 2.05, d));
        y += 0.05 * Math.sin(x * 0.8 + z * 0.5) * sstep(2.3, 3.2, d);
        var pd = pathD(x, z);
        if (pd < 0.7) y -= 0.02 * (1 - sstep(0.3, 0.7, pd));
        gp.setY(i, y);
        var nz = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.35) * Math.cos(z * 0.42 - x * 0.2);
        c.copy(cGrA).lerp(cGrB, nz);
        var n2 = 0.5 + 0.5 * Math.sin(x * 1.3 - z * 0.9 + 1.0);
        c.lerp(cGrC, sstep(0.75, 1, n2) * 0.6);
        if (pd < 0.78) { c.lerp(cPathE, 1 - sstep(0.55, 0.78, pd)); c.lerp(cPath, 1 - sstep(0.3, 0.56, pd)); }
        if (d < 2.25) c.lerp(cSand, 1 - sstep(1.85, 2.25, d));
        if (d < 1.75) c.lerp(cWet, 1 - sstep(1.45, 1.75, d));
        if (d < 1.5) c.lerp(cBed, 1 - sstep(1.0, 1.5, d));
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      var ground = new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 }));
      ground.receiveShadow = true; scene.add(ground);

      /* ----- água com brilho ----- */
      function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
      var waterBaseC = mkCanvas(4, 128, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#bff3ee'); gr.addColorStop(0.08, '#7fdbe0'); gr.addColorStop(0.3, '#3fb4dc'); gr.addColorStop(0.5, '#2e9ad6'); gr.addColorStop(0.7, '#3fb4dc'); gr.addColorStop(0.92, '#7fdbe0'); gr.addColorStop(1, '#bff3ee');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
      var waterBaseT = keep(new THREE.CanvasTexture(waterBaseC));
      var glintC = mkCanvas(256, 128, function (g, w, h) {
        g.clearRect(0, 0, w, h);
        g.lineCap = 'round';
        var rr = rng(7);
        for (var k = 0; k < 22; k++) {
          var lx = rr() * w, ly = 14 + rr() * (h - 28), ll = 10 + rr() * 34;
          g.strokeStyle = 'rgba(255,255,255,' + (0.55 + rr() * 0.4) + ')'; g.lineWidth = 2 + rr() * 2.5;
          for (var o = -1; o <= 1; o++) { g.beginPath(); g.moveTo(lx + o * w, ly); g.lineTo(lx + ll + o * w, ly); g.stroke(); }
        }
      });
      var glintT = keep(new THREE.CanvasTexture(glintC)); glintT.wrapS = glintT.wrapT = THREE.RepeatWrapping;
      var glintT2 = keep(glintT.clone()); glintT2.needsUpdate = true; glintT2.wrapS = glintT2.wrapT = THREE.RepeatWrapping;
      function riverGeo(halfW, y) {
        var NX = 90, NJ = 6, pos = [], uvs = [], idx = [], X0 = -22, X1 = 22;
        for (var a = 0; a <= NX; a++) {
          var xx = X0 + (X1 - X0) * a / NX, rz = riverZ(xx);
          for (var b = 0; b <= NJ; b++) { pos.push(xx, y, rz - halfW + 2 * halfW * b / NJ); uvs.push(a / NX * 10, b / NJ); }
        }
        for (a = 0; a < NX; a++) for (b = 0; b < NJ; b++) { var i0 = a * (NJ + 1) + b, i2 = i0 + NJ + 1; idx.push(i0, i0 + 1, i2, i0 + 1, i2 + 1, i2); }
        var bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); bg.setIndex(idx); bg.computeVertexNormals();
        return bg;
      }
      var WATER_Y = -0.3;
      var water = new THREE.Mesh(riverGeo(1.62, WATER_Y), addRim(new THREE.MeshStandardMaterial({ map: waterBaseT, roughness: 0.25, metalness: 0, emissive: 0x1b6f9a, emissiveIntensity: 0.22, transparent: true, opacity: 0.94 })));
      water.receiveShadow = true; scene.add(water);
      var glint1 = new THREE.Mesh(riverGeo(1.5, WATER_Y + 0.012), new THREE.MeshBasicMaterial({ map: glintT, transparent: true, opacity: 0.55, depthWrite: false }));
      scene.add(glint1);
      var glint2 = new THREE.Mesh(riverGeo(1.5, WATER_Y + 0.02), new THREE.MeshBasicMaterial({ map: glintT2, transparent: true, opacity: 0.4, depthWrite: false }));
      glint2.scale.set(1, 1, -1); glint2.position.z = 0; scene.add(glint2);
      glintT2.repeat.set(0.7, 1);

      /* ----- elementos instanciados ----- */
      var dummy = new THREE.Object3D(), tmpC = new THREE.Color();
      function instanced(geo, mat, list, shadow) {
        var im = new THREE.InstancedMesh(geo, mat, list.length);
        for (var k = 0; k < list.length; k++) {
          var L = list[k];
          dummy.position.set(L.x, L.y, L.z); dummy.rotation.set(L.rx || 0, L.ry || 0, L.rz || 0); dummy.scale.set(L.sx, L.sy, L.sz); dummy.updateMatrix();
          im.setMatrixAt(k, dummy.matrix);
          if (L.c !== undefined) im.setColorAt(k, tmpC.set(L.c));
        }
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        if (shadow) { im.castShadow = true; im.receiveShadow = true; }
        scene.add(im); return im;
      }
      function groundY(x, z) { var d = Math.abs(z - riverZ(x)); return -0.62 * (1 - sstep(1.25, 2.05, d)); }

      /* zonas a evitar (casas, personagens, ponte) */
      var AVOID = [];
      function avoid(x, z, r) { AVOID.push([x, z, r]); }
      function freeAt(x, z, rr) {
        if (Math.abs(z - riverZ(x)) < 2.3 + rr) return false;
        if (pathD(x, z) < 0.75 + rr) return false;
        for (var k = 0; k < AVOID.length; k++) { var a = AVOID[k]; var dx = x - a[0], dz = z - a[1]; if (dx * dx + dz * dz < (a[2] + rr) * (a[2] + rr)) return false; }
        return true;
      }

      /* ----- sistema de blocos: pinos hexagonais e chaves "borboleta" ----- */
      var PINS = [], BOWS = [];
      var matPinFlat = {};
      function pinMat(col) { return matPinFlat[col] || (matPinFlat[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); }
      function addPin(x, y, z, col, ry) { PINS.push({ x: x, y: y + 0.025, z: z, ry: ry || 0, sx: 1, sy: 1, sz: 1, c: col }); }
      function addBow(x, y, z, ry, col, s) { BOWS.push({ x: x, y: y, z: z, ry: ry, sx: s || 1, sy: s || 1, sz: 1, c: col }); }
      function block(w, h, d, col, x, y, z, ry, parent, r) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }));
        m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
        (parent || scene).add(m); return m;
      }

      /* ----- PONTE de blocos ----- */
      var WOOD = 0xcd8d4e, WOOD2 = 0xc3803f, WOOD3 = 0xd89a5c, BEAM = 0x9a5f34, STONE = 0xd9cdb8, STONE2 = 0xc9bca6, TEAL = 0x2fb5a3, PINC = 0xf2b968;
      var TILE_W = 1.3, TILE_H = 0.2, TILE_D = 0.4, PITCH = 0.42, NT = 10, TILE_Y = 0.26, STR_Y = 0.02, STR_X = 0.5, STR_W = 0.26, STR_H = 0.28;
      var tileCols = [WOOD, WOOD2, WOOD3];
      for (i = 0; i < NT; i++) {
        if (i === 4 || i === 5) continue;
        var tz = 2.1 - PITCH / 2 - i * PITCH;
        block(TILE_W, TILE_H, TILE_D, tileCols[i % 3], 0, TILE_Y + Math.sin(i * 2.1) * 0.004, tz, Math.sin(i * 3.3) * 0.012);
        addPin(-0.47, TILE_Y + TILE_H / 2, tz, PINC); addPin(0.47, TILE_Y + TILE_H / 2, tz, PINC);
      }
      // longarinas (vigas) — falta o trecho do meio
      [-1, 1].forEach(function (sg) {
        block(STR_W, STR_H, 1.98, BEAM, sg * STR_X, STR_Y, 1.42);
        block(STR_W, STR_H, 1.98, BEAM, sg * STR_X, STR_Y, -1.42);
        // chaves borboleta entre as peças de tábua, nas laterais
        [1.68, 0.84, -0.84, -1.68].forEach(function (zz) { addBow(sg * (TILE_W / 2 + 0.005), TILE_Y, zz, sg * Math.PI / 2, TEAL, 0.85); });
      });
      // cabeceiras de pedra em blocos
      [-1, 1].forEach(function (sg) {
        var zz = sg * 2.55;
        block(1.6, 0.3, 0.62, STONE, 0, -0.02, zz, 0);
        block(0.7, 0.24, 0.5, STONE2, -0.95, -0.05, zz + sg * 0.06, 0.1 * sg);
        block(0.62, 0.22, 0.46, STONE2, 0.95, -0.06, zz - sg * 0.02, -0.12 * sg);
        addPin(-0.5, 0.13, zz, 0xe9dfcc); addPin(0.5, 0.13, zz, 0xe9dfcc); addPin(0, 0.13, zz, 0xe9dfcc);
        // postes de bloco
        [-1, 1].forEach(function (sx) {
          block(0.2, 0.62, 0.2, BEAM, sx * 0.76, 0.32, sg * 2.08, 0);
          addPin(sx * 0.76, 0.63, sg * 2.08, 0xffc93c);
        });
      });
      // cordas
      [-1, 1].forEach(function (sx) {
        var crv = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.76, 0.56, 2.08), new THREE.Vector3(sx * 0.77, 0.47, 1.0), new THREE.Vector3(sx * 0.78, 0.44, 0), new THREE.Vector3(sx * 0.77, 0.47, -1.0), new THREE.Vector3(sx * 0.76, 0.56, -2.08)]);
        var rope = new THREE.Mesh(new THREE.TubeGeometry(crv, 24, 0.025, 5, false), M(0xf0dcae, { roughness: 0.9 }));
        rope.castShadow = true; scene.add(rope);
      });
      avoid(0, 2.6, 1.0); avoid(0, -2.6, 1.0);

      /* ----- casas com base de blocos ----- */
      var smokeSrc = [];
      function house(x, z, ry, wall, roof, s, chimney) {
        var g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g);
        // base de blocos de pedra com pinos hexagonais
        var bw = 1.95, bd = 1.6;
        [[-0.5, -0.42], [0.5, -0.42], [-0.5, 0.42], [0.5, 0.42]].forEach(function (q, j) { block(bw / 2 - 0.02, 0.26, bd / 2 - 0.02, j % 3 ? STONE : STONE2, q[0] * bw / 2 * 2 / 2 * 1.0, 0.13, q[1] * bd / 2 * 2 / 2 * 1.0, 0, g); });
        // paredes
        block(1.6, 1.05, 1.25, wall, 0, 0.26 + 0.525, 0, 0, g, 0.08);
        // telhado (duas placas + cumeeira) e empenas
        [-1, 1].forEach(function (sg) { var p = block(1.9, 0.12, 0.92, roof, 0, 1.6, sg * 0.37, 0, g, 0.05); p.rotation.x = sg * 0.6; });
        var ridge = mesh(gCyl, M(roof === 0xe8684a ? 0xc24f36 : 0x2d7f86), 0.08, 1.96, 0.08, 0, 1.86, 0, g); ridge.rotation.z = Math.PI / 2;
        var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.64, 0); sh.lineTo(0.64, 0); sh.lineTo(0, 0.5); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false }); e.translate(0, 0, -0.78); e.rotateY(Math.PI / 2); return e; });
        mesh(tri, M(wall), 1, 1, 1, 0, 1.31, 0, g);
        // porta, janelas e floreira
        block(0.4, 0.62, 0.08, 0x8e5632, -0.38, 0.26 + 0.32, 0.64, 0, g, 0.04);
        ball(0xffc93c, 0.035, -0.26, 0.6, 0.69, g);
        var winM = M(0xbfe9ff, { emissive: 0x7cc8f0, emissiveIntensity: 0.35, roughness: 0.25 });
        var w1 = new THREE.Mesh(rbox(0.38, 0.34, 0.06, 0.04), winM); w1.position.set(0.36, 0.86, 0.64); g.add(w1);
        block(0.46, 0.06, 0.12, 0xfffaf0, 0.36, 0.66, 0.66, 0, g, 0.025);
        block(0.06, 0.34, 0.07, 0xfffaf0, 0.36, 0.86, 0.665, 0, g, 0.02);
        block(0.44, 0.12, 0.14, 0x8e5632, 0.36, 0.6, 0.7, 0, g, 0.03);
        [0xff6f91, 0xffd23f, 0xffffff].forEach(function (fc, j) { ball(fc, 0.055, 0.23 + j * 0.13, 0.69, 0.72, g); });
        var w2 = new THREE.Mesh(rbox(0.06, 0.32, 0.34, 0.03), winM); w2.position.set(0.81, 0.86, 0); g.add(w2);
        // pinos na borda da base
        var bx = [-0.88, 0, 0.88], bz = [-0.72, 0.72];
        g.updateMatrixWorld(true);
        var v = new THREE.Vector3();
        bx.forEach(function (px) { bz.forEach(function (pz) { v.set(px, 0.26, pz); g.localToWorld(v); addPin(v.x, v.y, v.z, 0xe9dfcc, ry); }); });
        if (chimney) { block(0.24, 0.5, 0.24, 0xd9cdb8, 0.4, 1.95, -0.25, 0, g, 0.05); v.set(0.4, 2.25, -0.25); g.localToWorld(v); smokeSrc.push(v.clone()); }
        avoid(x, z, 1.35 * s);
        return g;
      }
      house(1.95, -3.55, AZ - 0.15, 0xfff4e0, 0xe8684a, 1.0, true);
      house(-1.25, -5.25, AZ + 0.12, 0xfdeccf, 0x3aa5a8, 0.95, false);
      house(-2.15, 3.05, AZ + 0.2, 0xfff4e0, 0x3aa5a8, 1.0, true);
      house(3.6, -6.9, AZ - 0.25, 0xfdeccf, 0xe8684a, 0.95, false);

      /* cerca de blocos */
      (function () {
        var px0 = -1.2, pz0 = 4.6, dx = 0.55, dz = 0.38;
        for (var k = 0; k < 4; k++) {
          var fx = px0 - k * dx, fz = pz0 + k * dz;
          block(0.16, 0.46, 0.16, 0xfff4e0, fx, 0.23, fz, 0);
          addPin(fx, 0.46, fz, 0xffc93c);
          if (k < 3) { var rl = block(0.6, 0.1, 0.08, 0xfff4e0, fx - dx / 2, 0.32, fz + dz / 2, Math.atan2(dz, -dx) + Math.PI); rl.rotation.y = -Math.atan2(dz, -dx); }
        }
      })();
      /* caixote de blocos perto da casa */
      (function () {
        var cx = -0.95, cz = 2.15;
        block(0.42, 0.42, 0.42, 0xd99a5c, cx, 0.21, cz, 0.3);
        block(0.36, 0.36, 0.36, 0xc98a4b, cx - 0.42, 0.18, cz + 0.12, -0.2);
        addPin(cx, 0.42, cz, PINC, 0.3); addPin(cx - 0.42, 0.36, cz + 0.12, PINC, -0.2);
        avoid(cx - 0.2, cz + 0.05, 0.55);
      })();

      /* ----- personagens ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
        return e;
      }
      // HERÓI (~10 anos, cabeça ≈ 1/3,2 da altura)
      var hero = new THREE.Group(), hSq = new THREE.Group(), hB = new THREE.Group(); hero.add(hSq); hSq.add(hB); scene.add(hero);
      var PANTS = 0x2c3f7a, BLUE = 0x2f74e6, BLUE2 = 0x9cc4ff, ORANGE = 0xff8a2a, ORANGE2 = 0xe86f12;
      var hLegs = [-1, 1].map(function (sg) {
        var L = capsule(0.072, 0.32, PANTS, hB); L.position.set(sg * 0.105, 0.6, 0);
        mesh(gSph, M(0xf7f3ea), 0.09, 0.075, 0.13, 0, -0.38, 0.035, L);
        mesh(gSph, M(0xe2553f), 0.093, 0.035, 0.135, 0, -0.43, 0.035, L);
        return L;
      });
      mesh(gSph, M(PANTS), 0.19, 0.13, 0.15, 0, 0.62, 0, hB);
      var hTorso = mesh(gSph, M(BLUE), 0.205, 0.25, 0.16, 0, 0.84, 0, hB);
      mesh(gSph, M(0x2563c9), 0.2, 0.05, 0.155, 0, 0.66, 0, hB);
      var col = mesh(G('tor', function () { return new THREE.TorusGeometry(1, 0.35, 8, 18); }), M(BLUE2), 0.09, 0.09, 0.09, 0, 1.06, 0.0, hB); col.rotation.x = Math.PI / 2 - 0.25;
      mesh(gSph, M(0xffc93c, { roughness: 0.4 }), 0.035, 0.035, 0.015, 0.09, 0.9, 0.155, hB);
      // mochila laranja com saco de dormir
      var pack = new THREE.Mesh(rbox(0.32, 0.36, 0.17, 0.07), M(ORANGE, { roughness: 0.6 })); pack.position.set(0, 0.86, -0.2); pack.castShadow = true; hB.add(pack);
      var flap = new THREE.Mesh(rbox(0.33, 0.14, 0.18, 0.06), M(ORANGE2, { roughness: 0.6 })); flap.position.set(0, 0.99, -0.2); flap.castShadow = true; hB.add(flap);
      var pkt = new THREE.Mesh(rbox(0.2, 0.12, 0.06, 0.04), M(ORANGE2, { roughness: 0.6 })); pkt.position.set(0, 0.76, -0.3); hB.add(pkt);
      var roll = mesh(gCyl, M(0x5fae7a, { roughness: 0.8 }), 0.075, 0.38, 0.075, 0, 1.1, -0.21, hB); roll.rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) { var st = new THREE.Mesh(rbox(0.05, 0.36, 0.03, 0.015), M(ORANGE2)); st.position.set(sg * 0.1, 0.88, 0.14); st.rotation.x = -0.1; hB.add(st); });
      var hArms = [-1, 1].map(function (sg) {
        var A = capsule(0.058, 0.26, BLUE, hB); A.position.set(sg * 0.24, 1.0, 0);
        ball(SKIN, 0.068, 0, -0.32, 0, A);
        return A;
      });
      var hHead = new THREE.Group(); hHead.position.set(0, 1.24, 0.01); hB.add(hHead);
      mesh(gSph, M(SKIN, { roughness: 0.62 }), 0.215, 0.205, 0.2, 0, 0, 0, hHead);
      [-1, 1].forEach(function (sg) { ball(SKIN2, 0.045, sg * 0.21, -0.01, -0.01, hHead); });
      var hair = mesh(gHemi, M(0x7a4426, { roughness: 0.6 }), 0.232, 0.228, 0.226, 0, 0.0, -0.012, hHead); hair.rotation.x = -0.42;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.2, 0.17, 0.12, 0, -0.04, -0.11, hHead);
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.13, 0.06, 0.09, -0.06, 0.15, 0.13, hHead).rotation.z = 0.35;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }), 0.1, 0.05, 0.08, 0.09, 0.16, 0.12, hHead).rotation.z = -0.4;
      var tuft = mesh(G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); }), M(0x7a4426, { roughness: 0.6 }), 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, hHead); tuft.rotation.z = -0.5;
      var hEyes = [eye(hHead, -0.078, 0.0, 0.17, 0.055), eye(hHead, 0.078, 0.0, 0.17, 0.055)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead, true); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead, true); hMouth.rotation.z = Math.PI;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead);

      // MESTRE TOMÉ (construtor, barba branca, capacete amarelo, avental marrom)
      var tome = new THREE.Group(), tB = new THREE.Group(); tome.add(tB); scene.add(tome);
      var SHIRT = 0xd65a40, APRON = 0x8b5a2b;
      [-1, 1].forEach(function (sg) {
        var L = capsule(0.088, 0.3, 0x45577f, tB); L.position.set(sg * 0.13, 0.55, 0);
        mesh(gSph, M(0x6b3e22, { roughness: 0.55 }), 0.11, 0.08, 0.15, 0, -0.36, 0.04, L);
      });
      mesh(gSph, M(SHIRT), 0.31, 0.34, 0.26, 0, 0.92, 0, tB);
      var apron = mesh(G('apron', function () { return new THREE.CylinderGeometry(1, 1.08, 1, 18, 1, true, -1.05, 2.1); }), M(APRON, { side: THREE.DoubleSide, roughness: 0.85 }), 0.3, 0.52, 0.255, 0, 0.82, 0.012, tB);
      var bib = new THREE.Mesh(rbox(0.28, 0.24, 0.05, 0.02), M(APRON, { roughness: 0.85 })); bib.position.set(0, 1.08, 0.22); bib.rotation.x = -0.3; tB.add(bib);
      var pocket = new THREE.Mesh(rbox(0.2, 0.11, 0.04, 0.015), M(0x744820)); pocket.position.set(0.0, 0.72, 0.29); pocket.rotation.x = 0.08; tB.add(pocket);
      var ruler = new THREE.Mesh(rbox(0.035, 0.16, 0.02, 0.008), M(0xffc93c)); ruler.position.set(0.06, 0.8, 0.3); ruler.rotation.z = 0.18; tB.add(ruler);
      mesh(gCyl, M(0x6b3e22), 0.33, 0.04, 0.27, 0, 0.62, 0, tB);
      var tArms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.33, 1.13, 0); tB.add(A);
        capsule(0.085, 0.14, SHIRT, A);
        var fa = capsule(0.072, 0.16, SKIN2, A); fa.position.y = -0.17;
        ball(SKIN, 0.088, 0, -0.38, 0, A);
        return A;
      });
      var tHead = new THREE.Group(); tHead.position.set(0, 1.47, 0.02); tB.add(tHead);
      mesh(gSph, M(SKIN2, { roughness: 0.6 }), 0.205, 0.21, 0.2, 0, 0, 0, tHead);
      [-1, 1].forEach(function (sg) { ball(0xeba57d, 0.045, sg * 0.2, -0.01, 0, tHead); });
      [[0, -0.15, 0.1, 0.17, 0.15, 0.12], [-0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0, -0.26, 0.07, 0.11, 0.1, 0.09], [-0.17, 0.0, 0.03, 0.06, 0.1, 0.07], [0.17, 0.0, 0.03, 0.06, 0.1, 0.07]].forEach(function (q) {
        mesh(gSph, M(0xf7f6f2, { roughness: 0.92 }), q[3], q[4], q[5], q[0], q[1], q[2], tHead);
      });
      var tMouth = mesh(gSph, M(0x8c2f2a, { roughness: 0.5 }), 0.05, 0.03, 0.03, 0, -0.105, 0.19, tHead, true);
      [-1, 1].forEach(function (sg) { var mu = mesh(gSph, M(0xffffff, { roughness: 0.9 }), 0.07, 0.032, 0.045, sg * 0.055, -0.055, 0.19, tHead, true); mu.rotation.z = sg * 0.35; });
      ball(0xf09a7a, 0.045, 0, -0.005, 0.205, tHead);
      var tEyes = [eye(tHead, -0.072, 0.035, 0.168, 0.047), eye(tHead, 0.072, 0.035, 0.168, 0.047)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0xffffff, { roughness: 0.9 }), 0.05, 0.02, 0.025, sg * 0.075, 0.105, 0.175, tHead, true); bw.rotation.z = sg * -0.3; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8f7a, { transparent: true, opacity: 0.55 }), 0.035, 0.02, 0.01, sg * 0.12, -0.03, 0.17, tHead, true); });
      var helm = mesh(gHemi, M(0xffc629, { roughness: 0.4 }), 0.222, 0.2, 0.222, 0, 0.1, -0.02, tHead); helm.rotation.x = -0.25;
      var brim = mesh(gCyl, M(0xf2a71a, { roughness: 0.4 }), 0.25, 0.022, 0.25, 0, 0.1, -0.01, tHead); brim.rotation.x = -0.25;
      var hridge = new THREE.Mesh(rbox(0.05, 0.05, 0.4, 0.02), M(0xf2a71a, { roughness: 0.4 })); hridge.position.set(0, 0.28, -0.07); hridge.rotation.x = -0.25; tHead.add(hridge);

      /* posições do roteiro */
      var HERO_A = new THREE.Vector3(0.62, 0, 5.2), HERO_B = new THREE.Vector3(0.0, 0, 2.95);
      var TOME_P = new THREE.Vector3(1.75, 0, 3.15);
      tome.position.copy(TOME_P); tome.scale.setScalar(1.12); hero.scale.setScalar(1.12);
      avoid(0.4, 4.0, 0.7); avoid(0, 2.9, 0.6); avoid(TOME_P.x, TOME_P.z, 0.7);

      /* pilha de blocos novos ao lado do Mestre Tomé */
      var PILE = new THREE.Vector3(1.2, 0, 2.4);
      avoid(PILE.x, PILE.z, 0.7);
      var NEWC = 0xd99a5c;
      function newBlock(w, h, d, col, pins) {
        var g = new THREE.Group();
        var m = new THREE.Mesh(rbox(w, h, d, 0.06), addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.65, emissive: 0x2fe0c4, emissiveIntensity: 0 })));
        m.castShadow = true; m.receiveShadow = true; g.add(m);
        pins.forEach(function (p) { var pm = new THREE.Mesh(gHex, pinMat(0xffd27a)); pm.position.set(p[0], h / 2 + 0.025, p[1]); pm.castShadow = true; g.add(pm); });
        scene.add(g); g.userData.mat = m.material; return g;
      }
      var nbs = [
        { g: newBlock(STR_W, STR_H, 0.82, 0xb3713f, []), end: new THREE.Vector3(-STR_X, STR_Y, 0), start: new THREE.Vector3(PILE.x - 0.16, 0.48, PILE.z + 0.02), sry: 0.5 + Math.PI / 2, t0: 1.5, t1: 1.82 },
        { g: newBlock(STR_W, STR_H, 0.82, 0xb3713f, []), end: new THREE.Vector3(STR_X, STR_Y, 0), start: new THREE.Vector3(PILE.x + 0.18, 0.48, PILE.z - 0.04), sry: 0.5 + Math.PI / 2, t0: 1.74, t1: 2.06 },
        { g: newBlock(TILE_W, TILE_H, 0.82, NEWC, [[-0.47, -0.2], [0.47, -0.2], [-0.47, 0.2], [0.47, 0.2]]), end: new THREE.Vector3(0, TILE_Y, 0), start: new THREE.Vector3(PILE.x, 0.1, PILE.z), sry: 0.5, t0: 1.98, t1: 2.32 }
      ];
      // chaves borboleta que aparecem no clique (dos dois lados!)
      var newBows = [];
      [[-1, 0], [1, 1]].forEach(function (q) {
        var sg = q[0];
        [-0.42, 0.42].forEach(function (zz) {
          var b = new THREE.Mesh(gBow, addRim(new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.5, emissive: 0x5ff5dc, emissiveIntensity: 0 })));
          b.position.set(sg * (STR_X + STR_W / 2 + 0.003), STR_Y, zz); b.rotation.y = sg * Math.PI / 2; b.userData.k = q[1]; b.scale.setScalar(0.001);
          scene.add(b); newBows.push(b);
        });
      });
      [-1, 1].forEach(function (sg) {
        [-0.42, 0.42].forEach(function (zz) {
          var b = new THREE.Mesh(gBow, addRim(new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.5, emissive: 0x5ff5dc, emissiveIntensity: 0 })));
          b.position.set(sg * (TILE_W / 2 + 0.005), TILE_Y, zz); b.rotation.y = sg * Math.PI / 2; b.userData.k = 2; b.scale.setScalar(0.001);
          scene.add(b); newBows.push(b);
        });
      });
      // linhas de encaixe que acendem
      var seamMat = [0, 1, 2].map(function () { return new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); });
      var seams = [];
      function seam(k, w, h, d, x, y, z) { var m = new THREE.Mesh(G('seambox', function () { return new THREE.BoxGeometry(1, 1, 1); }), seamMat[k]); m.scale.set(w, h, d); m.position.set(x, y, z); m.visible = false; scene.add(m); seams.push({ m: m, k: k }); }
      [-1, 1].forEach(function (sg, k) {
        seam(k, 0.03, STR_H + 0.02, 0.03, sg * (STR_X + STR_W / 2 + 0.01), STR_Y, 0.42); seam(k, 0.03, STR_H + 0.02, 0.03, sg * (STR_X + STR_W / 2 + 0.01), STR_Y, -0.42);
        seam(k, STR_W + 0.02, 0.03, 0.03, sg * STR_X, STR_Y + STR_H / 2 + 0.005, 0.42); seam(k, STR_W + 0.02, 0.03, 0.03, sg * STR_X, STR_Y + STR_H / 2 + 0.005, -0.42);
      });
      seam(2, TILE_W + 0.02, 0.03, 0.035, 0, TILE_Y + TILE_H / 2 + 0.005, 0.42); seam(2, TILE_W + 0.02, 0.03, 0.035, 0, TILE_Y + TILE_H / 2 + 0.005, -0.42);
      [-1, 1].forEach(function (sg) { seam(2, 0.03, 0.035, 0.84, sg * (TILE_W / 2 + 0.008), TILE_Y + TILE_H / 2, 0); });
      // holograma da peça que falta
      var ghostMat = new THREE.MeshBasicMaterial({ color: 0x8ffff0, transparent: true, opacity: 0.25, depthWrite: false });
      var ghost = new THREE.Mesh(rbox(TILE_W, TILE_H, 0.82, 0.06), ghostMat); ghost.position.set(0, TILE_Y, 0); scene.add(ghost);
      var ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TILE_W, TILE_H, 0.82)), new THREE.LineBasicMaterial({ color: 0xe9fffb, transparent: true, opacity: 0.8 }));
      ghostEdge.position.copy(ghost.position); scene.add(ghostEdge);

      /* faíscas (estrelinhas instanciadas, viradas para a câmera) e anéis */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 30;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }), NSP);
      var spData = [];
      var spCols = [0xfff27a, 0xffffff, 0x8ffff0, 0xffc93c];
      for (i = 0; i < NSP; i++) { spData.push({ k: i % 3, a: (i / NSP) * Math.PI * 2 * 3.3 + R(), up: 0.6 + R() * 0.9, r: 0.5 + R() * 0.6, s: 0.7 + R() * 0.7 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; scene.add(sparks);
      var rings = [0, 1, 2].map(function () { var rm = new THREE.Mesh(G('ring', function () { return new THREE.RingGeometry(0.8, 1, 40); }), new THREE.MeshBasicMaterial({ color: 0xbffff6, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); rm.rotation.x = -Math.PI / 2; rm.visible = false; scene.add(rm); return rm; });
      var puffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.8, emissive: 0xffffff, emissiveIntensity: 0.3, depthWrite: false });
      var puffs = []; for (i = 0; i < 8; i++) { var pf = new THREE.Mesh(gSphLo, puffMat); pf.visible = false; scene.add(pf); puffs.push({ m: pf, a: i / 8 * Math.PI * 2 }); }

      /* ----- vegetação, pedras, flores (instanciadas) ----- */
      var TREES = [], tryN = 0;
      var treeFixed = [[-3.2, 0.9], [-3.6, 4.6], [3.9, 4.6], [4.6, 2.6], [-0.4, -3.0], [-3.2, -3.4], [1.0, -5.6], [3.5, -4.2], [-4.4, -5.6], [0.3, -7.6], [5.2, -2.9], [-2.4, -7.6], [5.6, 6.8], [-5.0, 2.8]];
      treeFixed.forEach(function (p) { if (freeAt(p[0], p[1], 0.6)) { TREES.push([p[0], p[1], 0.85 + R() * 0.35]); avoid(p[0], p[1], 0.7); } });
      while (TREES.length < 34 && tryN < 600) {
        tryN++;
        var u = -5.5 + R() * 11, vv = -9 + R() * 21, w = uv2w(u, vv);
        w.x += 0.4; w.z += 1.0;
        if (vv < -2.5 && Math.abs(u) < 2.6) continue;
        if (!freeAt(w.x, w.z, 0.55)) continue;
        TREES.push([w.x, w.z, 0.8 + R() * 0.45]); avoid(w.x, w.z, 0.75);
      }
      var trunkL = [], canL = [];
      var canopyCols = [0x58b84e, 0x4aa648, 0x6cc45a, 0x3f9a4a, 0x7fcf5c];
      TREES.forEach(function (t, j) {
        var s = t[2], gy = groundY(t[0], t[1]);
        trunkL.push({ x: t[0], y: gy + 0.35 * s, z: t[1], sx: 0.11 * s, sy: 0.7 * s, sz: 0.11 * s });
        var cc = canopyCols[j % 5];
        if (j % 9 === 4) cc = 0xf2b13f; if (j % 11 === 7) cc = 0xf49ac1;
        tmpC.set(cc); var cDark = tmpC.clone().multiplyScalar(0.86).getHex(), cLight = tmpC.clone().lerp(new THREE.Color(0xfff6c8), 0.18).getHex();
        canL.push({ x: t[0], y: gy + 1.05 * s, z: t[1], sx: 0.62 * s, sy: 0.56 * s, sz: 0.62 * s, c: cc });
        canL.push({ x: t[0] - 0.28 * s, y: gy + 0.86 * s, z: t[1] + 0.16 * s, sx: 0.4 * s, sy: 0.36 * s, sz: 0.4 * s, c: cDark });
        canL.push({ x: t[0] + 0.22 * s, y: gy + 1.4 * s, z: t[1] + 0.08 * s, sx: 0.36 * s, sy: 0.32 * s, sz: 0.36 * s, c: cLight });
      });
      instanced(gCyl, M(0x9a6038), trunkL, true);
      instanced(gSph, M(0xffffff, { roughness: 0.85 }), canL, true);
      // arbustos
      var BUSH = [];
      for (tryN = 0; tryN < 400 && BUSH.length < 42; tryN++) {
        var u2 = -5 + R() * 10, v2 = -8 + R() * 19, w2b = uv2w(u2, v2); w2b.x += 0.4; w2b.z += 1.0;
        if (!freeAt(w2b.x, w2b.z, 0.25)) continue;
        var bs = 0.2 + R() * 0.14, bc = [0x5bbd4c, 0x4fae4a, 0x6ccf5a][BUSH.length % 3];
        BUSH.push({ x: w2b.x, y: groundY(w2b.x, w2b.z) + bs * 0.55, z: w2b.z, sx: bs * 1.3, sy: bs, sz: bs * 1.1, c: bc });
        BUSH.push({ x: w2b.x + bs * 0.9, y: groundY(w2b.x, w2b.z) + bs * 0.4, z: w2b.z + 0.1, sx: bs * 0.85, sy: bs * 0.7, sz: bs * 0.8, c: bc });
      }
      instanced(gSphLo, M(0xffffff, { roughness: 0.85 }), BUSH, true);
      // pedras nas margens
      var ROCK = [];
      for (i = 0; i < 46; i++) {
        var rx = -9 + i * 0.4 + R() * 0.3, sgn = i % 2 ? 1 : -1;
        if (Math.abs(rx) < 1.1) continue;
        var rz = riverZ(rx) + sgn * (1.5 + R() * 0.45), rs = 0.1 + R() * 0.16;
        ROCK.push({ x: rx, y: groundY(rx, rz) + rs * 0.2, z: rz, sx: rs * 1.3, sy: rs * 0.75, sz: rs, ry: R() * 3, c: [0xc9c3d6, 0xb7b2c8, 0xd8d2e2][i % 3] });
      }
      [[-1.3, 3.7, 0.2], [2.6, 3.0, 0.16], [-0.6, -2.9, 0.14], [2.8, 1.9, 0.22], [-2.9, -1.9, 0.2]].forEach(function (q) { ROCK.push({ x: q[0], y: groundY(q[0], q[1]) + q[2] * 0.25, z: q[1], sx: q[2] * 1.3, sy: q[2] * 0.8, sz: q[2], c: 0xc9c3d6 }); });
      instanced(gSphLo, M(0xffffff, { roughness: 0.8 }), ROCK, true);
      // flores e tufos de grama
      var FLW = [], TUF = [];
      var flCols = [0xffffff, 0xff7aa8, 0xffd23f, 0xb48cff, 0xff9a5c];
      for (tryN = 0; tryN < 900 && FLW.length < 110; tryN++) {
        var cu = -4.5 + R() * 9, cvv = -7 + R() * 16, cw = uv2w(cu, cvv); cw.x += 0.4; cw.z += 1.0;
        if (!freeAt(cw.x, cw.z, 0.05)) continue;
        var col2 = flCols[Math.floor(R() * 5)];
        for (var k2 = 0; k2 < 3; k2++) {
          var fx = cw.x + (R() - 0.5) * 0.5, fz = cw.z + (R() - 0.5) * 0.5;
          if (!freeAt(fx, fz, 0)) continue;
          FLW.push({ x: fx, y: groundY(fx, fz) + 0.07, z: fz, sx: 0.055, sy: 0.04, sz: 0.055, c: col2 });
        }
      }
      for (tryN = 0; tryN < 500 && TUF.length < 140; tryN++) {
        var tu = -5 + R() * 10, tv = -8 + R() * 18, tw = uv2w(tu, tv); tw.x += 0.4; tw.z += 1.0;
        var dd = Math.abs(tw.z - riverZ(tw.x));
        if (dd < 2.0 && dd > 1.7) { /* junco na margem */ } else if (!freeAt(tw.x, tw.z, 0)) continue;
        TUF.push({ x: tw.x, y: groundY(tw.x, tw.z) + 0.07, z: tw.z, sx: 0.05, sy: 0.16 + R() * 0.08, sz: 0.05, rz: (R() - 0.5) * 0.4, c: [0x4fa844, 0x5fb84f, 0x3f9a3e][TUF.length % 3] });
      }
      instanced(gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
      instanced(G('tufcone', function () { return new THREE.ConeGeometry(1, 1, 5); }), M(0xffffff, { roughness: 0.9 }), TUF, false);
      // vitórias-régias
      var PADS = [[-2.6, 0.9], [2.4, -0.9], [3.4, 0.7], [-3.8, -0.4]].map(function (q) { return { x: q[0], y: WATER_Y + 0.03, z: riverZ(q[0]) + q[1], sx: 0.22, sy: 0.02, sz: 0.22, c: 0x4fb35a }; });
      instanced(gCyl, M(0xffffff, { roughness: 0.7 }), PADS, false);

      /* pinos e chaves estáticos */
      instanced(gHex, pinMat(0xffffff), PINS, true);
      instanced(gBow, M(0xffffff, { roughness: 0.5 }), BOWS, false);

      /* fumaça e borboletas */
      var smokeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.7, emissive: 0xffffff, emissiveIntensity: 0.35, depthWrite: false });
      var smoke = [];
      smokeSrc.forEach(function (src) { for (var k = 0; k < 3; k++) { var sm = new THREE.Mesh(gSphLo, smokeMat.clone()); scene.add(sm); smoke.push({ m: sm, src: src, o: k / 3 }); } });
      var wingGeo = G('wing', function () { var s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.05, 0.1, 0.16, 0.1, 0.13, 0.0); s.bezierCurveTo(0.16, -0.08, 0.05, -0.08, 0, 0); var g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; });
      var flies = [[0xffb547, -1.6, 1.2, 0], [0xff7aa8, 2.6, -2.6, 1.7]].map(function (q) {
        var g = new THREE.Group(); scene.add(g);
        var m = new THREE.MeshBasicMaterial({ color: q[0], side: THREE.DoubleSide });
        var l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m); r.scale.x = -1; g.add(l); g.add(r);
        g.scale.setScalar(1.4);
        return { g: g, l: l, r: r, x: q[1], z: q[2], ph: q[3] };
      });

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = 'combinado-vig'; root.appendChild(vig);
      var SVGNS = 'http://www.w3.org/2000/svg';
      var wipe = document.createElementNS(SVGNS, 'svg'); wipe.setAttribute('class', 'combinado-wipe'); root.appendChild(wipe);
      var wipePath = document.createElementNS(SVGNS, 'path'); wipePath.setAttribute('fill', '#fff4df'); wipePath.setAttribute('fill-rule', 'evenodd'); wipe.appendChild(wipePath);
      var wipeEdge = document.createElementNS(SVGNS, 'path'); wipeEdge.setAttribute('fill', 'none'); wipeEdge.setAttribute('stroke', '#ff8a2a'); wipeEdge.setAttribute('stroke-width', '6'); wipeEdge.setAttribute('stroke-linejoin', 'round'); wipe.appendChild(wipeEdge);
      wipe.style.display = 'none';

      var hud = document.createElement('div'); hud.className = 'combinado-hud';
      hud.innerHTML =
        '<div class="combinado-top combinado-card"><div class="combinado-ava">' + AVATAR + '<span class="combinado-lv">4</span></div>' +
        '<div class="combinado-stat"><div class="combinado-ttl">Nível 4 · <span>Explorador</span></div>' +
        '<div class="combinado-bar"><div class="combinado-fill"></div><div class="combinado-flash"></div></div>' +
        '<div class="combinado-xpn"><span>Experiência</span><span><b class="combinado-xpv">620</b> / 1000 XP</span></div></div>' +
        '<div class="combinado-pause">' + IC_PAUSE + '</div></div>' +
        '<div class="combinado-quest combinado-card"><div class="combinado-qi">' + IC_QUEST + '</div><div class="combinado-qt"><b>Missão:</b> consertar a ponte da vila</div><div class="combinado-chk">' + IC_CHECK + '</div></div>' +
        '<div class="combinado-map combinado-card"><h4><i></i>Vila do Riacho</h4><svg class="combinado-mm" viewBox="0 0 120 92"></svg></div>' +
        '<div class="combinado-bub combinado-card"><div class="combinado-tail"></div><div class="combinado-nm">' + IC_HELMET + 'Mestre Tomé</div><div class="combinado-say">A viga precisa se apoiar dos dois lados!</div></div>' +
        '<div class="combinado-xp">' + IC_XP + '+50 XP</div>' +
        '<div class="combinado-btns">' +
        '<div class="combinado-btn combinado-card combinado-pri"><i>' + IC_BUILD + '</i>Construir</div>' +
        '<div class="combinado-btn combinado-card"><i style="background:#fff0e0">' + IC_BAG + '</i>Mochila</div>' +
        '<div class="combinado-btn combinado-card"><i style="background:#e6f5dc">' + IC_MAP + '</i>Mapa</div></div>';
      root.appendChild(hud);
      var elFill = hud.querySelector('.combinado-fill'), elFlash = hud.querySelector('.combinado-flash'), elXpv = hud.querySelector('.combinado-xpv'), elBub = hud.querySelector('.combinado-bub'),
        elXp = hud.querySelector('.combinado-xp'), elMap = hud.querySelector('.combinado-map'), elQuest = hud.querySelector('.combinado-quest'), elChk = hud.querySelector('.combinado-chk'), elChkSvg = elChk.querySelector('svg'),
        elBtns = hud.querySelector('.combinado-btns'), mm = hud.querySelector('.combinado-mm'), elBuild = hud.querySelector('.combinado-pri');

      /* mini mapa isométrico (2:1) desenhado em SVG */
      var MMS = 5.2, MCX = 60, MCY = 44;
      function iso(x, z, y) { var a = (x - z) * 0.7071, b = (x + z) * 0.7071; return [MCX + a * MMS, MCY + b * MMS * 0.5 - (y || 0) * MMS * 0.85]; }
      function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
      (function buildMap() {
        var E = 7.2, s = '';
        var c0 = iso(-E, -E), c1 = iso(E, -E), c2 = iso(E, E), c3 = iso(-E, E);
        var dep = 5;
        s += '<polygon points="' + pts([c3, c2, [c2[0], c2[1] + dep], [c3[0], c3[1] + dep]]) + '" fill="#6f9e4c"/>';
        s += '<polygon points="' + pts([c1, c2, [c2[0], c2[1] + dep], [c1[0], c1[1] + dep]]) + '" fill="#5a8a3c"/>';
        s += '<polygon points="' + pts([c0, c1, c2, c3]) + '" fill="#9ed774"/>';
        // rio (clipado ao quadrado do mapa)
        var top = [], bot = [];
        for (var xx = -E; xx <= E + 0.01; xx += 0.6) { var rz = riverZ(xx); top.push(iso(xx, clamp(rz - 1.45, -E, E))); bot.unshift(iso(xx, clamp(rz + 1.45, -E, E))); }
        s += '<polygon points="' + pts(top.concat(bot)) + '" fill="#5ab8e6"/>';
        var mid = []; for (xx = -E; xx <= E + 0.01; xx += 0.6) mid.push(iso(xx, riverZ(xx)));
        s += '<polyline points="' + pts(mid) + '" fill="none" stroke="#a8e3f5" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 4"/>';
        // caminhos
        PATHS.forEach(function (P) { s += '<polyline points="' + pts(P.map(function (q) { return iso(clamp(q[0], -E, E), clamp(q[1], -E, E)); })) + '" fill="none" stroke="#f3dca8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'; });
        // árvores
        TREES.forEach(function (t) { if (Math.abs(t[0]) > E - 0.4 || Math.abs(t[1]) > E - 0.4) return; var p = iso(t[0], t[1]); s += '<ellipse cx="' + (p[0] + 1).toFixed(1) + '" cy="' + (p[1] + 0.6).toFixed(1) + '" rx="2.6" ry="1.3" fill="#5a8a3c" opacity=".5"/><circle cx="' + p[0].toFixed(1) + '" cy="' + (p[1] - 2).toFixed(1) + '" r="2.3" fill="#4fa94a"/><circle cx="' + (p[0] - 0.6).toFixed(1) + '" cy="' + (p[1] - 2.7).toFixed(1) + '" r="1" fill="#7fd36a"/>'; });
        // casas (cubinhos isométricos)
        [[1.95, -3.55, '#e8684a'], [-1.25, -5.25, '#3aa5a8'], [-2.15, 3.05, '#3aa5a8'], [3.6, -6.9, '#e8684a']].forEach(function (h) {
          if (Math.abs(h[0]) > E || Math.abs(h[1]) > E) return;
          var x = h[0], z = h[1], r = 0.6, hh = 0.7;
          var A = iso(x - r, z + r), B = iso(x + r, z + r), C = iso(x + r, z - r);
          var At = iso(x - r, z + r, hh), Bt = iso(x + r, z + r, hh), Ct = iso(x + r, z - r, hh), Dt = iso(x - r, z - r, hh);
          s += '<polygon points="' + pts([A, B, Bt, At]) + '" fill="#f2e2c4"/><polygon points="' + pts([B, C, Ct, Bt]) + '" fill="#dcc8a4"/>';
          var ap = iso(x, z, hh + 0.75);
          s += '<polygon points="' + pts([At, Bt, Ct, Dt]) + '" fill="#fff4e0"/><polygon points="' + pts([At, Bt, ap]) + '" fill="' + h[2] + '"/><polygon points="' + pts([Bt, Ct, ap]) + '" fill="' + h[2] + '" opacity=".78"/>';
        });
        // ponte
        var b0 = iso(-0.7, 2.2, 0.15), b1 = iso(0.7, 2.2, 0.15), b2 = iso(0.7, -2.2, 0.15), b3 = iso(-0.7, -2.2, 0.15);
        s += '<polygon points="' + pts([b0, b1, b2, b3]) + '" fill="#c98a4b" stroke="#8a5530" stroke-width=".6"/>';
        var g0 = iso(-0.7, 0.42, 0.15), g1 = iso(0.7, 0.42, 0.15), g2 = iso(0.7, -0.42, 0.15), g3 = iso(-0.7, -0.42, 0.15);
        s += '<polygon class="combinado-mgap" points="' + pts([g0, g1, g2, g3]) + '" fill="#5ab8e6" stroke="#ff8a2a" stroke-width="1" stroke-dasharray="1.6 1.2"/>';
        var gc2 = iso(0, 0, 0.15);
        s += '<g class="combinado-mpin" transform="translate(' + gc2[0].toFixed(1) + ' ' + (gc2[1] - 1).toFixed(1) + ')"><circle r="5" fill="none" stroke="#ff8a2a" stroke-width="1.4" class="combinado-mring"/><path d="M0 -3 l2.6 -6 h-5.2z" fill="#ff8a2a"/></g>';
        s += '<g class="combinado-mhero"><ellipse rx="3.4" ry="1.7" fill="#000" opacity=".18" cy="1.2"/><circle r="3.4" fill="#2f74e6" stroke="#fff" stroke-width="1.5"/></g>';
        mm.innerHTML = s;
      })();
      var mHero = mm.querySelector('.combinado-mhero'), mGap = mm.querySelector('.combinado-mgap'), mPin = mm.querySelector('.combinado-mpin'), mRing = mm.querySelector('.combinado-mring');

      /* ----- layout / câmera ----- */
      var TARGET = new THREE.Vector3(0.45, 0, 0.75), dist0 = 26;
      var S = 1;
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        var t = Math.tan(FOV / 2 * Math.PI / 180);
        var worldW = 6.3;
        dist0 = camera.aspect < 0.8 ? (worldW / 2) / (t * camera.aspect) : 6.6 / t;
        camera.updateProjectionMatrix();
        S = clamp(Math.min(W / 390, H / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        wipe.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);

      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion();
      function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        var s = t >= 3.3 ? t - LOOP : t; // de 3,3 a 3,6 já mostra o início (escondido pela transição)

        // câmera: alta, fixa, leve dolly
        var dol = reduce ? 0 : sstep(-0.3, 2.9, s);
        var dist = dist0 * (1 - 0.035 * dol);
        var tx = TARGET.x - 0.15 + 0.2 * dol, tz = TARGET.z + 0.1 - 0.25 * dol;
        camera.position.set(tx + dist * Math.sin(AZ) * Math.cos(EL), dist * Math.sin(EL), tz + dist * Math.cos(AZ) * Math.cos(EL));
        camera.lookAt(tx, 0, tz);
        camera.updateMatrixWorld();

        // herói: caminhada com balanço
        var wk = clamp((s + 0.3) / 1.5, 0, 1), we = 1 - Math.pow(1 - wk, 1.6);
        hero.position.lerpVectors(HERO_A, HERO_B, we);
        var walking = 1 - sstep(0.95, 1.2, s);
        var ph = (s + 0.3) * Math.PI * 2 * 1.9;
        var sw = Math.sin(ph) * 0.75 * walking;
        hLegs[0].rotation.x = sw; hLegs[1].rotation.x = -sw;
        hArms[0].rotation.x = -sw * 0.9; hArms[1].rotation.x = sw * 0.9;
        hArms[0].rotation.z = -0.18; hArms[1].rotation.z = 0.18;
        var bob = Math.abs(Math.cos(ph));
        hB.position.y = bob * 0.07 * walking;
        hB.rotation.z = Math.sin(ph) * 0.07 * walking;
        hB.rotation.x = 0.1 * walking;
        var land = sstep(1.08, 1.2, s) * (1 - sstep(1.2, 1.45, s));
        var sq = 1 + (bob - 0.5) * 0.08 * walking - land * 0.1 + Math.sin(wall * 3.1) * 0.01;
        // olhar: anda (de costas, mostra a mochila) -> vira para a ponte/câmera
        var dirWalk = Math.atan2(HERO_B.x - HERO_A.x, HERO_B.z - HERO_A.z);
        var look = sstep(0.95, 1.45, s);
        var cheer = sstep(2.36, 2.5, s) * (1 - sstep(2.95, 3.15, s));
        hero.rotation.y = lerp(dirWalk, -0.25, look) + (0.95 - (-0.25)) * cheer * 0 + cheer * 1.05;
        hHead.rotation.x = -0.18 - 0.12 * look * (1 - cheer);
        hHead.rotation.y = 0.25 * sstep(1.5, 2.3, s) * (1 - cheer) - 0.2 * sstep(0.7, 1.0, s) * (1 - sstep(1.2, 1.5, s));
        hHead.rotation.z = Math.sin(ph) * 0.05 * walking + 0.08 * cheer * Math.sin(wall * 9);
        var jump = s > 2.38 && s < 2.8 ? Math.sin((s - 2.38) / 0.42 * Math.PI) : 0;
        hB.position.y += jump * 0.32;
        var pre = s > 2.3 && s < 2.4 ? Math.sin((s - 2.3) / 0.1 * Math.PI) : 0;
        sq += jump * 0.1 - pre * 0.12;
        hSq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        hArms[0].rotation.x -= cheer * 0.5; hArms[1].rotation.x -= cheer * 0.5;
        hArms[0].rotation.z -= cheer * (2.3 + Math.sin(wall * 20) * 0.15); hArms[1].rotation.z += cheer * (2.3 + Math.sin(wall * 20 + 1) * 0.15);
        var watch = sstep(1.3, 1.55, s) * (1 - cheer);
        hArms[1].rotation.x -= watch * 0.5; hArms[1].rotation.z += watch * 0.25;
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + cheer * 1.4 + watch * 0.4), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink);
        var bl2 = (wall + 1.4) % 3.7, blink2 = bl2 < 0.12 ? Math.abs(Math.cos(bl2 / 0.12 * Math.PI)) : 1;
        tEyes[0].scale.y = tEyes[1].scale.y = Math.max(0.1, blink2) * (1 - 0.35 * cheer);

        // Mestre Tomé: fala, aponta, rege os blocos, comemora
        var talk = sstep(0.72, 0.95, s) * (1 - sstep(1.4, 1.6, s));
        var conduct = sstep(1.38, 1.55, s) * (1 - sstep(2.3, 2.45, s));
        var thumbs = sstep(2.38, 2.55, s) * (1 - sstep(2.95, 3.15, s));
        tome.rotation.y = 0.05 - 0.55 * talk - 0.25 * conduct + 0.35 * thumbs;
        tB.position.y = Math.abs(Math.sin(wall * 2.2)) * 0.012 + thumbs * Math.max(0, Math.sin((s - 2.38) * 12)) * 0.05;
        tB.rotation.z = Math.sin(s * 7) * 0.04 * talk;
        var ta = tArms[0], tr = tArms[1];
        ta.rotation.set(0, 0, -0.12); tr.rotation.set(0, 0, 0.12);
        // fala: braço direito aponta para a ponte com gesto
        tr.rotation.x = -talk * (1.35 + Math.sin(s * 10) * 0.18); tr.rotation.z += talk * 0.55;
        ta.rotation.x = -talk * 0.35; ta.rotation.z -= talk * 0.25;
        // rege os blocos: dois braços para cima, mãos acenando
        ta.rotation.x -= conduct * (2.4 + Math.sin(s * 14) * 0.25); ta.rotation.z -= conduct * 0.35;
        tr.rotation.x -= conduct * (2.4 + Math.sin(s * 14 + 1.6) * 0.25); tr.rotation.z += conduct * 0.35;
        // joinha
        tr.rotation.x -= thumbs * 2.2; tr.rotation.z += thumbs * 0.2;
        ta.rotation.x -= thumbs * 0.4; ta.rotation.z -= thumbs * 0.6;
        tHead.rotation.x = -0.5 + Math.sin(s * 11) * 0.06 * talk - 0.15 * conduct + thumbs * Math.sin((s - 2.38) * 16) * 0.08;
        tHead.rotation.z = 0.08 * talk + 0.06 * Math.sin(wall * 1.3);
        tHead.rotation.y = 0.2 * talk;
        var tsq = 1 + Math.sin(s * 11) * 0.025 * talk + conduct * 0.03 * Math.sin(s * 14);
        tB.scale.set(1 / Math.sqrt(tsq), tsq, 1 / Math.sqrt(tsq));
        tMouth.scale.set(0.05, 0.03 * (1 + talk * (0.6 + 0.6 * Math.sin(s * 22)) + thumbs * 0.8), 0.03);

        // blocos voando e encaixando com "clique"
        var anyGlow = 0;
        nbs.forEach(function (b, k) {
          var g = b.g, k01 = clamp((s - b.t0) / (b.t1 - b.t0), 0, 1);
          var hop = s > b.t0 - 0.14 && s < b.t0 ? Math.sin((s - b.t0 + 0.14) / 0.14 * Math.PI) : 0;
          var e = k01 < 1 ? (k01 * k01 * (3 - 2 * k01)) : 1;
          g.position.lerpVectors(b.start, b.end, e);
          g.position.y += Math.sin(Math.PI * k01) * (2.1 - k * 0.2) + hop * 0.14;
          g.rotation.set(Math.sin(Math.PI * k01) * 0.6, lerp(b.sry + Math.PI * 2, 0, e), Math.sin(Math.PI * k01) * 0.3);
          var cl = s > b.t1 && s < b.t1 + 0.16 ? Math.sin((s - b.t1) / 0.16 * Math.PI) : 0;
          g.scale.set(1 + cl * 0.12, 1 - cl * 0.28, 1 + cl * 0.12);
          var glow = (k01 > 0 ? 1 : sstep(b.t0 - 0.5, b.t0, s)) * (1 - sstep(b.t1 + 0.1, b.t1 + 0.7, s));
          if (s < 0.9) glow = 0;
          var idle = s < b.t0 ? (0.07 + 0.06 * Math.sin(wall * 5 + k)) * sstep(0.2, 0.9, s) : 0;
          g.userData.mat.emissiveIntensity = Math.max(glow * 0.3, idle);
          anyGlow = Math.max(anyGlow, cl);
          // linhas de encaixe e anel
          var sl = s > b.t1 - 0.02 ? (1 - sstep(b.t1 + 0.12, b.t1 + 0.75, s)) : 0;
          seamMat[k].opacity = sl * 0.95;
          var rg = rings[k], rk = clamp((s - b.t1) / 0.45, 0, 1);
          rg.visible = s > b.t1 && rk < 1;
          if (rg.visible) { rg.position.set(b.end.x, k === 2 ? TILE_Y + 0.12 : STR_Y + 0.16, 0); rg.scale.setScalar((k === 2 ? 0.6 : 0.3) + outCubic(rk) * (k === 2 ? 1.1 : 0.6)); rg.material.opacity = (1 - rk) * 0.85; }
        });
        seams.forEach(function (sm) { sm.m.visible = seamMat[sm.k].opacity > 0.01; });
        newBows.forEach(function (bw) {
          var b = nbs[bw.userData.k], k01 = clamp((s - b.t1) / 0.22, 0, 1);
          var sc2 = s > b.t1 ? outBack(k01, 2.6) : 0;
          bw.scale.setScalar(Math.max(0.001, sc2));
          bw.material.emissiveIntensity = (1 - sstep(b.t1 + 0.15, b.t1 + 0.8, s)) * 0.9;
        });
        // holograma some quando a peça chega
        var gh = (0.55 + 0.45 * Math.sin(wall * 6)) * (1 - sstep(2.15, 2.32, s));
        ghost.visible = ghostEdge.visible = gh > 0.01;
        ghostMat.opacity = 0.2 + 0.18 * gh; ghostEdge.material.opacity = 0.35 + 0.5 * gh;
        ghost.material.opacity = ghostMat.opacity;
        ghostEdge.material.opacity *= (1 - sstep(2.15, 2.32, s));
        ghostMat.opacity *= (1 - sstep(2.15, 2.32, s));

        // faíscas
        camQ.copy(camera.quaternion);
        for (var i = 0; i < NSP; i++) {
          var sd = spData[i], b = nbs[sd.k], fk = clamp((s - b.t1) / 0.7, 0, 1), on = s > b.t1 && fk < 1;
          if (!on) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else {
            var ee = outCubic(fk), rr = sd.r * ee * (sd.k === 2 ? 1.2 : 0.7);
            dummy.position.set(b.end.x + Math.cos(sd.a) * rr, (sd.k === 2 ? TILE_Y : STR_Y + 0.1) + 0.1 + sd.up * ee - fk * fk * 0.5, Math.sin(sd.a) * rr * 0.8);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk * 1.3) * Math.PI) * 1.4 + 0.0001);
          }
          dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + sd.a);
          dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;
        // poeira no último clique
        var pk = clamp((s - nbs[2].t1) / 0.6, 0, 1), pOn = s > nbs[2].t1 && pk < 1;
        puffMat.opacity = 0.4 * (1 - pk * pk);
        puffs.forEach(function (p) {
          p.m.visible = pOn; if (!pOn) return;
          p.m.position.set(Math.cos(p.a) * (0.75 + pk * 0.7), TILE_Y + 0.02 + pk * 0.18, Math.sin(p.a) * (0.5 + pk * 0.5));
          p.m.scale.setScalar(0.07 + pk * 0.1);
        });

        // ambiente
        glintT.offset.x = -wall * 0.06; glintT.offset.y = Math.sin(wall * 0.8) * 0.01;
        glintT2.offset.x = -wall * 0.035 + 0.3;
        glint1.material.opacity = 0.45 + 0.15 * Math.sin(wall * 2.3);
        glint2.material.opacity = 0.32 + 0.15 * Math.sin(wall * 1.7 + 1);
        smoke.forEach(function (sm) { var k = (wall * 0.35 + sm.o) % 1; sm.m.position.set(sm.src.x + k * 0.45, sm.src.y + k * 1.3, sm.src.z - k * 0.2); sm.m.scale.setScalar(0.06 + k * 0.13); sm.m.material.opacity = 0.6 * Math.sin(k * Math.PI); });
        flies.forEach(function (f) {
          var tt = wall * 0.6 + f.ph;
          f.g.position.set(f.x + Math.sin(tt) * 0.8, 0.9 + Math.sin(tt * 2.3) * 0.2, f.z + Math.sin(tt * 1.3) * 0.6);
          f.g.rotation.y = Math.cos(tt) * 1.2 + f.ph;
          var fl = Math.sin(wall * 22 + f.ph) * 0.9;
          f.l.rotation.z = fl; f.r.rotation.z = -fl;
        });

        // HUD
        var xpK = sstep(2.42, 2.85, s);
        elFill.style.width = (62 + 5 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(620 + 50 * xpK);
        var fl2 = clamp((s - 2.45) / 0.5, 0, 1);
        elFlash.style.opacity = s > 2.45 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elFlash.style.left = (fl2 * 70) + '%';
        var done = sstep(2.32, 2.45, s);
        elChk.style.background = done > 0.5 ? '#43c59e' : 'transparent';
        elChk.style.borderColor = done > 0.5 ? '#43c59e' : '#d9ccb5';
        elChk.style.transform = 'scale(' + (1 + 0.35 * Math.sin(Math.PI * clamp((s - 2.32) / 0.25, 0, 1))).toFixed(3) + ')';
        elChkSvg.style.opacity = done;
        elBuild.style.transform = 'translateY(' + (-3 * S * Math.max(0, Math.sin(wall * 5)) * sstep(0.2, 0.6, s) * (1 - sstep(1.4, 1.6, s))).toFixed(2) + 'px)';
        // mini mapa
        var mp = iso(hero.position.x, hero.position.z);
        mHero.setAttribute('transform', 'translate(' + mp[0].toFixed(2) + ' ' + (mp[1] - 1.5 - Math.abs(Math.sin(ph)) * 1.2 * walking).toFixed(2) + ')');
        mGap.setAttribute('fill', done > 0.5 ? '#e0a565' : '#5ab8e6');
        mGap.setAttribute('stroke', done > 0.5 ? '#43c59e' : '#ff8a2a');
        var pr = (wall * 1.4) % 1;
        mRing.setAttribute('r', (3 + pr * 5).toFixed(2)); mRing.setAttribute('opacity', ((1 - pr) * (1 - done)).toFixed(2));
        mPin.setAttribute('opacity', (1 - done).toFixed(2));

        // balão do Mestre Tomé
        var bIn = clamp((s - 0.8) / 0.3, 0, 1), bOut = sstep(2.55, 2.8, s);
        var bsc = (bIn > 0 ? outBack(bIn, 2.2) : 0) * (1 - bOut * 0.3);
        var hp = proj(tome.position.x, -0.05, tome.position.z);
        var bw2 = elBub.offsetWidth || 200, bh2 = elBub.offsetHeight || 80;
        var maxTop = elBtns.offsetTop - bh2 - 12 * S;
        var left = clamp(hp.x - 46 * S, 10 * S, W - bw2 - 10 * S);
        var topB = Math.min(maxTop, hp.y + 14 * S);
        var tx2 = clamp(hp.x - left, 22 * S, bw2 - 22 * S);
        elBub.style.setProperty('--tx', tx2.toFixed(1) + 'px');
        elBub.style.transformOrigin = tx2.toFixed(0) + 'px 0';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 2.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, bsc).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 3) * (1 - bOut)).toFixed(3);

        // +50 XP
        var xk = clamp((s - 2.38) / 0.75, 0, 1);
        var xpP = proj(0, 0.6, 0);
        elXp.style.opacity = s > 2.38 ? (xk < 0.12 ? xk / 0.12 : 1 - sstep(0.65, 1, xk)).toFixed(3) : 0;
        elXp.style.transform = 'translate(' + xpP.x.toFixed(1) + 'px,' + (xpP.y - 40 * S - 70 * S * outCubic(xk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.2 ? outBack(xk / 0.2, 2.4) : 1).toFixed(3) + ')';

        // transição em losango (isométrica) que fecha no herói e reabre
        var ik = t < 3.3 ? sstep(3.02, 3.3, t) : 1 - sstep(3.3, 3.6, t);
        if (ik <= 0.002) { wipe.style.display = 'none'; }
        else {
          wipe.style.display = 'block';
          var hpp = proj(hero.position.x, 0.7, hero.position.z);
          var maxR = (W + H) * 1.1, rad = Math.max(0, maxR * (1 - ik));
          var dia = 'M' + hpp.x.toFixed(1) + ' ' + (hpp.y - rad * 0.62).toFixed(1) + 'L' + (hpp.x + rad).toFixed(1) + ' ' + hpp.y.toFixed(1) + 'L' + hpp.x.toFixed(1) + ' ' + (hpp.y + rad * 0.62).toFixed(1) + 'L' + (hpp.x - rad).toFixed(1) + ' ' + hpp.y.toFixed(1) + 'Z';
          wipePath.setAttribute('d', 'M-10 -10H' + (W + 10) + 'V' + (H + 10) + 'H-10Z' + (rad > 0.5 ? dia : ''));
          wipeEdge.setAttribute('d', rad > 0.5 ? dia : 'M0 0');
        }
      }

      var raf = 0, t0 = performance.now(), dead = false;
      function frame() {
        if (dead) return;
        raf = requestAnimationFrame(frame);
        var el = (performance.now() - t0) / 1000;
        var forced = typeof window.__sceneTime === 'number';
        var t = forced ? window.__sceneTime % LOOP : el % LOOP;
        update(t, forced ? window.__sceneTime : el);
        renderer.render(scene, camera);
      }
      frame();

      return {
        destroy: function () {
          dead = true;
          cancelAnimationFrame(raf);
          ro.disconnect();
          var seen = [];
          scene.traverse(function (o) {
            if (o.geometry && seen.indexOf(o.geometry) < 0) { seen.push(o.geometry); o.geometry.dispose(); }
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (seen.indexOf(m) < 0) { seen.push(m); m.dispose(); } });
            if (o.isInstancedMesh && o.dispose) o.dispose();
          });
          for (var k in geos) geos[k].dispose();
          disposables.forEach(function (d) { d.dispose(); });
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
