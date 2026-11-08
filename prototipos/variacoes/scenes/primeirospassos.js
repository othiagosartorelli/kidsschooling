/* Variação PRIMEIROS PASSOS (3 a 5 anos, trilha Alfabetização) — KidsSchooling
   Mesmo estilo da cena "combinado" (herói idêntico, blocos com pinos hexagonais e chaves borboleta,
   materiais com rim light, HUD em cartões creme). Câmera mais perto e frontal, cores vivas de manhã,
   blocos com letras B-O-L-A que quicam e se encaixam, bola de verdade com confete,
   HUD só de ícones (estrelas, microfone grande com "BO-LA"). Loop de 6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'primeirospassos';
  var LOOP = 6.0;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var FOV = 32;
  var AZ = 0.0, EL = 6 * Math.PI / 180;

  /* letras e cores dos blocos (primárias suaves) */
  var LET = ['B', 'O', 'L', 'A'];
  var BCOL = [0xff6b6b, 0xffc93c, 0x4d9de0, 0x5cc970];
  var BDARK = ['#c83a3f', '#d08a00', '#2766b0', '#2c9447'];
  var HUDC = ['#e5484d', '#e89a00', '#2f7fd6', '#2fae5a'];

  var CSS = [
    '.primeirospassos-root{position:absolute;inset:0;overflow:hidden;background:#7cc8ff;-webkit-user-select:none;user-select:none;}',
    '.primeirospassos-root canvas.primeirospassos-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.primeirospassos-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 90% at 50% 45%,rgba(255,255,255,0) 60%,rgba(30,80,140,.16) 100%);}',
    '.primeirospassos-wipe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;z-index:10;}',
    '.primeirospassos-hud{position:absolute;inset:0;pointer-events:none;font-family:"Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;-webkit-font-smoothing:antialiased;}',
    '.primeirospassos-card{background:#fffaf0;border-radius:calc(24px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(120,90,50,.10),0 calc(7px*var(--s)) calc(18px*var(--s)) rgba(30,60,90,.22);}',
    '.primeirospassos-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(10px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.primeirospassos-ava{flex:none;width:calc(62px*var(--s));height:calc(62px*var(--s));}',
    '.primeirospassos-ava svg{display:block;width:100%;height:100%;}',
    '.primeirospassos-stars{flex:1;display:flex;justify-content:space-between;align-items:center;min-width:0;padding:calc(6px*var(--s)) calc(8px*var(--s));border-radius:99px;background:#f3ead9;box-shadow:inset 0 calc(2px*var(--s)) calc(3px*var(--s)) rgba(80,60,30,.14);}',
    '.primeirospassos-star{position:relative;width:calc(36px*var(--s));height:calc(36px*var(--s));}',
    '.primeirospassos-star svg{position:absolute;inset:0;width:100%;height:100%;}',
    '.primeirospassos-star .primeirospassos-on{transform:scale(0);}',
    '.primeirospassos-home{flex:none;width:calc(50px*var(--s));height:calc(50px*var(--s));border-radius:50%;background:#ffe2c4;display:grid;place-items:center;}',
    '.primeirospassos-home svg{width:64%;height:64%;}',
    '.primeirospassos-panel{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 18px);padding:calc(12px*var(--s)) calc(12px*var(--s)) calc(14px*var(--s));display:flex;flex-direction:column;align-items:center;gap:calc(8px*var(--s));}',
    '.primeirospassos-word{display:flex;align-items:center;justify-content:center;gap:calc(4px*var(--s));height:calc(74px*var(--s));}',
    '.primeirospassos-syl{display:flex;padding:0 calc(10px*var(--s));border-radius:calc(18px*var(--s));}',
    '.primeirospassos-ch{display:inline-block;font:700 calc(64px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.01em;}',
    '.primeirospassos-dash{font:700 calc(48px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#d5c7ad;}',
    '.primeirospassos-row{display:flex;align-items:center;justify-content:space-between;width:100%;}',
    '.primeirospassos-side{flex:none;width:calc(82px*var(--s));height:calc(82px*var(--s));border-radius:50%;display:grid;place-items:center;box-shadow:0 calc(5px*var(--s)) 0 rgba(0,0,0,.12),0 calc(8px*var(--s)) calc(14px*var(--s)) rgba(30,60,90,.2);}',
    '.primeirospassos-side svg{width:60%;height:60%;}',
    '.primeirospassos-micw{position:relative;flex:none;width:calc(130px*var(--s));height:calc(118px*var(--s));display:grid;place-items:center;}',
    '.primeirospassos-mic{position:relative;z-index:2;width:calc(112px*var(--s));height:calc(112px*var(--s));border-radius:50%;background:radial-gradient(circle at 50% 35%,#ff9a5c,#ff6a3d 70%);display:grid;place-items:center;box-shadow:0 calc(6px*var(--s)) 0 #d4482a,0 calc(10px*var(--s)) calc(20px*var(--s)) rgba(220,80,40,.45);}',
    '.primeirospassos-mic svg{width:52%;height:52%;}',
    '.primeirospassos-ring{position:absolute;left:50%;top:50%;width:calc(112px*var(--s));height:calc(112px*var(--s));margin:calc(-56px*var(--s)) 0 0 calc(-56px*var(--s));border-radius:50%;border:calc(4px*var(--s)) solid #ff8a5c;box-sizing:border-box;opacity:0;}',
    '.primeirospassos-wave{position:absolute;top:50%;width:calc(46px*var(--s));height:calc(70px*var(--s));margin-top:calc(-35px*var(--s));}',
    '.primeirospassos-wave svg{width:100%;height:100%;overflow:visible;}',
    '.primeirospassos-plus{position:absolute;left:0;top:0;opacity:0;display:flex;align-items:center;gap:calc(4px*var(--s));padding:calc(8px*var(--s)) calc(18px*var(--s)) calc(8px*var(--s)) calc(14px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(8px*var(--s)) calc(18px*var(--s)) rgba(30,60,90,.3);font:700 calc(54px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#f29d00;white-space:nowrap;}',
    '.primeirospassos-plus svg{width:calc(58px*var(--s));height:calc(58px*var(--s));}',
    '.primeirospassos-fly{position:absolute;left:0;top:0;width:calc(34px*var(--s));height:calc(34px*var(--s));opacity:0;}',
    '.primeirospassos-fly svg{width:100%;height:100%;}'
  ].join('\n');

  var AVATAR = '<svg viewBox="0 0 64 64"><defs><linearGradient id="primeirospassos-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="primeirospassos-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#primeirospassos-avbg)"/>' +
    '<g clip-path="url(#primeirospassos-avc)">' +
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
  var STAR_P = 'M18 3.2l4.3 9 9.8 1.3-7.2 6.8 1.8 9.8L18 25.4l-8.7 4.7 1.8-9.8-7.2-6.8 9.8-1.3z';
  var STAR_OFF = '<svg viewBox="0 0 36 34"><path d="' + STAR_P + '" fill="#fffaf0" stroke="#dccbb0" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  var STAR_ON = '<svg class="primeirospassos-on" viewBox="0 0 36 34"><path d="' + STAR_P + '" fill="#ffc93c" stroke="#f29d00" stroke-width="2.4" stroke-linejoin="round"/><path d="M12.5 13.5l3-.4 1.4-3" stroke="#fff6c8" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  var STAR_BIG = '<svg viewBox="0 0 36 34"><path d="' + STAR_P + '" fill="#ffc93c" stroke="#f29d00" stroke-width="2.2" stroke-linejoin="round"/><path d="M12.5 13.5l3-.4 1.4-3" stroke="#fff6c8" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  var IC_HOME = '<svg viewBox="0 0 32 32"><path d="M4 15.5L16 5l12 10.5" stroke="#e86f12" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 14v11a2.5 2.5 0 0 0 2.5 2.5h12a2.5 2.5 0 0 0 2.5-2.5V14L16 6.8z" fill="#ff8a2a"/><rect x="13" y="18.5" width="6" height="9" rx="2" fill="#ffe2c4"/></svg>';
  var IC_MIC = '<svg viewBox="0 0 32 32"><rect x="11" y="3" width="10" height="17" rx="5" fill="#fff"/><path d="M7 15a9 9 0 0 0 18 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 24v4.5M11 29h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M14 7.5v6" stroke="#ffb08a" stroke-width="2" stroke-linecap="round"/></svg>';
  var IC_SPK = '<svg viewBox="0 0 32 32"><path d="M5 12.5h5l7-6v19l-7-6H5z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M21 11.5a6 6 0 0 1 0 9M24.5 8a11 11 0 0 1 0 16" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>';
  var IC_BALL = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12.5" fill="#fff"/><path d="M16 3.5a12.5 12.5 0 0 1 11.3 7.2C22 9 18 12 16 16z" fill="#ff6b6b"/><path d="M28.4 17.5a12.5 12.5 0 0 1-8 10C21 22 19 18 16 16z" fill="#ffc93c"/><path d="M12 27.8A12.5 12.5 0 0 1 3.7 18.5C8.5 19.5 13 18 16 16z" fill="#4d9de0"/><path d="M4 11.5A12.5 12.5 0 0 1 12 4.2C11.5 9 13 13 16 16z" fill="#5cc970"/><circle cx="16" cy="16" r="12.5" fill="none" stroke="#2a3350" stroke-opacity=".18" stroke-width="1.4"/><circle cx="16" cy="16" r="2.4" fill="#fff"/><path d="M8.5 8.5a9 9 0 0 1 4-2.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".8"/></svg>';
  var WAVE_L = '<svg viewBox="0 0 46 70"><path class="primeirospassos-w1" d="M34 22q-7 13 0 26" stroke="#ff8a5c" stroke-width="5" fill="none" stroke-linecap="round"/><path class="primeirospassos-w2" d="M22 12q-12 23 0 46" stroke="#ffb48a" stroke-width="5" fill="none" stroke-linecap="round"/><path class="primeirospassos-w3" d="M10 3q-17 32 0 64" stroke="#ffd2b8" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(5150);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }

      var root = document.createElement('div'); root.className = 'primeirospassos-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x7cc8ff);
      var cv = renderer.domElement; cv.className = 'primeirospassos-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xbfe6ff, 16, 42);
      var camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 140);

      var rimU = { uRimColor: { value: new THREE.Color(0xffffff) }, uRimStr: { value: 0.38 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return 'primeirospassos-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : '') + (m.map ? 'm' : ''); };
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
      var gSph = G('sph', function () { return new THREE.SphereGeometry(1, 22, 16); });
      var gSphLo = G('sphlo', function () { return new THREE.SphereGeometry(1, 12, 8); });
      var gCyl = G('cyl', function () { return new THREE.CylinderGeometry(1, 1, 1, 16); });
      var gHemi = G('hemi', function () { return new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); });
      var gSmile = G('smile', function () { return new THREE.TorusGeometry(1, 0.28, 6, 14, Math.PI); });
      var gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
      var gCone = G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); });
      var gPlane = G('plane', function () { return new THREE.PlaneGeometry(1, 1); });
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
      function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
      var dummy = new THREE.Object3D(), tmpC = new THREE.Color(), vtmp = new THREE.Vector3();
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

      /* ----- céu azul forte de manhã ----- */
      var SUN_DIR = new THREE.Vector3(0.55, 0.42, -0.72).normalize();
      var skyMat = new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN_DIR } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform vec3 uSun; varying vec3 vDir;',
          'void main(){',
          ' vec3 d = normalize(vDir); float h = d.y;',
          ' vec3 c = mix(vec3(0.80,0.93,1.0), vec3(0.42,0.76,1.0), smoothstep(0.0,0.18,h));',
          ' c = mix(c, vec3(0.16,0.52,0.96), smoothstep(0.16,0.6,h));',
          ' float s = max(dot(d,uSun),0.0);',
          ' c += vec3(1.0,0.95,0.75) * (pow(s,12.0)*0.25 + pow(s,120.0)*0.5);',
          ' gl_FragColor = vec4(c,1.0);',
          '}'].join('\n'),
        side: THREE.BackSide, depthWrite: false, fog: false
      });
      var sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), skyMat); sky.renderOrder = -10; scene.add(sky);

      /* ----- luzes ----- */
      scene.add(new THREE.HemisphereLight(0xdcf0ff, 0xd8d0a8, 0.72));
      var sun = new THREE.DirectionalLight(0xfff3d8, 0.95);
      sun.position.set(4.5, 9, 6); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 2; sc.far = 25;
      sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
      sun.target.position.set(0, 0, -0.3);
      scene.add(sun); scene.add(sun.target);
      var back = new THREE.DirectionalLight(0xcfe8ff, 0.3); back.position.set(-4, 5, -8); scene.add(back);

      /* ----- chão de grama viva ----- */
      var gg = new THREE.PlaneGeometry(70, 70, 70, 70); gg.rotateX(-Math.PI / 2);
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
      var cA = new THREE.Color(0x7fd34e), cB = new THREE.Color(0x66c444), cC = new THREE.Color(0x9be05a), cPath = new THREE.Color(0xf2d79a);
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i);
        var y = 0;
        var nz = 0.5 + 0.5 * Math.sin(x * 0.6 + z * 0.4) * Math.cos(z * 0.5 - x * 0.25);
        c.copy(cA).lerp(cB, nz);
        c.lerp(cC, sstep(0.7, 1, 0.5 + 0.5 * Math.sin(x * 1.2 - z * 0.8 + 1)) * 0.6);
        // trilha de terra que passa atrás
        var pz = -2.7 + 0.25 * Math.sin(x * 0.4);
        var pd = Math.abs(z - pz);
        if (pd < 0.55) c.lerp(cPath, 1 - sstep(0.35, 0.55, pd));
        gp.setY(i, y);
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      var ground = new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 }));
      ground.receiveShadow = true; scene.add(ground);

      /* ----- blocos (pinos e chaves borboleta) ----- */
      var PINS = [], BOWS = [];
      var matPinFlat = {};
      function pinMat(col) { return matPinFlat[col] || (matPinFlat[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); }
      function block(w, h, d, col, x, y, z, ry, parent, r) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.65 }));
        m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
        (parent || scene).add(m); return m;
      }
      var TEAL = 0x2fb5a3;

      /* morros, nuvens, árvores e casinha ao fundo */
      var HILLS = [[-9, -15, 7, 2.6, 0x8fdc5e], [3, -18, 9, 3.2, 0x74cf52], [12, -14, 6, 2.2, 0x9be36a], [-2, -22, 10, 3.8, 0x66c048], [-16, -20, 8, 3.0, 0x7fd658], [18, -22, 9, 3.4, 0x6cc84e]];
      instanced(gSph, M(0xffffff, { roughness: 0.95 }), HILLS.map(function (h) { return { x: h[0], y: -0.2, z: h[1], sx: h[2], sy: h[3], sz: h[2] * 0.6, c: h[4] }; }), false);
      var CLOUD = [];
      [[-4.2, 4.3, -20, 0.95], [4.0, 5.0, -24, 1.2], [11, 3.9, -22, 0.9], [-12, 5.2, -26, 1.1], [0.2, 6.2, -30, 1.0]].forEach(function (q) {
        [[0, 0, 1], [0.9, -0.15, 0.75], [-0.9, -0.2, 0.7], [0.4, 0.45, 0.7], [-0.4, 0.35, 0.65]].forEach(function (p) { CLOUD.push({ x: q[0] + p[0] * q[3] * 1.2, y: q[1] + p[1] * q[3], z: q[2], sx: p[2] * q[3] * 1.15, sy: p[2] * q[3] * 0.85, sz: p[2] * q[3] * 0.7, c: 0xffffff }); });
      });
      var cloudMesh = instanced(gSph, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xdff0ff, emissiveIntensity: 0.55, fog: false }), CLOUD, false);
      var trunkL = [], canL = [];
      var canopyCols = [0x58c24e, 0x4ab648, 0x6cd45a, 0x3faa4a, 0x8fdc5c];
      [[-2.9, -3.6, 1.1], [3.0, -3.4, 1.0], [-4.6, -5.5, 1.2], [4.8, -6.0, 1.2], [-1.2, -6.6, 1.0], [1.8, -7.4, 1.1], [-6.5, -2.5, 1.1], [6.4, -2.2, 1.0], [-7.5, -8, 1.3], [7.8, -9, 1.3], [0.2, -10, 1.2]].forEach(function (t, j) {
        var s = t[2];
        trunkL.push({ x: t[0], y: 0.35 * s, z: t[1], sx: 0.11 * s, sy: 0.7 * s, sz: 0.11 * s });
        var cc = canopyCols[j % 5]; if (j === 4) cc = 0xf49ac1; if (j === 7) cc = 0xffb547;
        tmpC.set(cc); var cDark = tmpC.clone().multiplyScalar(0.86).getHex(), cLight = tmpC.clone().lerp(new THREE.Color(0xfff6c8), 0.2).getHex();
        canL.push({ x: t[0], y: 1.05 * s, z: t[1], sx: 0.62 * s, sy: 0.56 * s, sz: 0.62 * s, c: cc });
        canL.push({ x: t[0] - 0.28 * s, y: 0.86 * s, z: t[1] + 0.16 * s, sx: 0.4 * s, sy: 0.36 * s, sz: 0.4 * s, c: cDark });
        canL.push({ x: t[0] + 0.22 * s, y: 1.4 * s, z: t[1] + 0.08 * s, sx: 0.36 * s, sy: 0.32 * s, sz: 0.36 * s, c: cLight });
      });
      instanced(gCyl, M(0x9a6038), trunkL, true);
      instanced(gSph, M(0xffffff, { roughness: 0.85 }), canL, true);
      // casinha (igual à vila)
      (function () {
        var g = new THREE.Group(); g.position.set(-1.6, 0, -5.0); g.rotation.y = 0.25; scene.add(g);
        var STONE = 0xd9cdb8, STONE2 = 0xc9bca6, wall = 0xfff4e0, roof = 0xff6b6b;
        [[-0.5, -0.42], [0.5, -0.42], [-0.5, 0.42], [0.5, 0.42]].forEach(function (q, j) { block(0.955, 0.26, 0.78, j % 3 ? STONE : STONE2, q[0] * 0.975, 0.13, q[1] * 0.8, 0, g); });
        block(1.6, 1.05, 1.25, wall, 0, 0.785, 0, 0, g, 0.08);
        [-1, 1].forEach(function (sg) { var p = block(1.9, 0.12, 0.92, roof, 0, 1.6, sg * 0.37, 0, g, 0.05); p.rotation.x = sg * 0.6; });
        var ridge = mesh(gCyl, M(0xd94f4f), 0.08, 1.96, 0.08, 0, 1.86, 0, g); ridge.rotation.z = Math.PI / 2;
        var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.64, 0); sh.lineTo(0.64, 0); sh.lineTo(0, 0.5); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false }); e.translate(0, 0, -0.78); e.rotateY(Math.PI / 2); return e; });
        mesh(tri, M(wall), 1, 1, 1, 0, 1.31, 0, g);
        block(0.4, 0.62, 0.08, 0x4d9de0, -0.38, 0.58, 0.64, 0, g, 0.04);
        var winM = M(0xbfe9ff, { emissive: 0x7cc8f0, emissiveIntensity: 0.35, roughness: 0.25 });
        var w1 = new THREE.Mesh(rbox(0.38, 0.34, 0.06, 0.04), winM); w1.position.set(0.36, 0.86, 0.64); g.add(w1);
        block(0.46, 0.06, 0.12, 0xfffaf0, 0.36, 0.66, 0.66, 0, g, 0.025);
        block(0.44, 0.12, 0.14, 0x8e5632, 0.36, 0.6, 0.7, 0, g, 0.03);
        [0xff6f91, 0xffd23f, 0xffffff].forEach(function (fc, j) { ball(fc, 0.055, 0.23 + j * 0.13, 0.69, 0.72, g); });
      })();
      // cerca de blocos atrás
      (function () {
        for (var k = 0; k < 13; k++) {
          var fx = -6 + k * 1.0, fz = -2.05;
          if (Math.abs(fx - 1.15) < 0.4) continue;
          block(0.16, 0.5, 0.16, 0xfff4e0, fx, 0.25, fz, 0);
          PINS.push({ x: fx, y: 0.525, z: fz, ry: 0, sx: 1, sy: 1, sz: 1, c: 0xffc93c });
          if (k < 12) block(0.86, 0.1, 0.08, 0xfff4e0, fx + 0.5, 0.33, fz, 0, null, 0.03);
        }
      })();
      // flores e tufos
      var FLW = [], TUF = [];
      var flCols = [0xffffff, 0xff7aa8, 0xffd23f, 0xb48cff, 0xff9a5c, 0xff5a5a];
      function free(x, z) { if (z > -0.95 && z < 1.1 && Math.abs(x) < 1.7) return false; if (Math.abs(x + 0.85) < 0.6 && Math.abs(z + 0.95) < 0.6) return false; if (Math.abs(x - 1.1) < 0.5 && Math.abs(z + 1.1) < 0.5) return false; return true; }
      for (var tries = 0; tries < 900 && FLW.length < 150; tries++) {
        var fx = -5 + R() * 10, fz = -4.5 + R() * 7;
        if (!free(fx, fz)) continue;
        var col2 = flCols[Math.floor(R() * flCols.length)];
        for (var k2 = 0; k2 < 3; k2++) {
          var ax = fx + (R() - 0.5) * 0.4, az = fz + (R() - 0.5) * 0.4;
          if (!free(ax, az)) continue;
          FLW.push({ x: ax, y: 0.075, z: az, sx: 0.06, sy: 0.045, sz: 0.06, c: col2 });
          TUF.push({ x: ax + 0.03, y: 0.03, z: az, sx: 0.012, sy: 0.08, sz: 0.012, c: 0x4fa844 });
        }
      }
      for (tries = 0; tries < 400 && TUF.length < 300; tries++) {
        var tx = -5 + R() * 10, tz = -4.5 + R() * 7;
        if (!free(tx, tz)) continue;
        TUF.push({ x: tx, y: 0.07, z: tz, sx: 0.05, sy: 0.15 + R() * 0.08, sz: 0.05, rz: (R() - 0.5) * 0.4, c: [0x4fb844, 0x5fc84f, 0x3fa83e][TUF.length % 3] });
      }
      instanced(gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
      instanced(G('tufcone', function () { return new THREE.ConeGeometry(1, 1, 5); }), M(0xffffff, { roughness: 0.9 }), TUF, false);
      // arbustos
      var BUSH = [];
      [[-2.2, -1.6], [2.3, -1.5], [-3.3, 0.4], [3.4, 0.6], [-2.6, 1.9], [2.7, 2.1], [-4.4, -1.2], [4.3, -0.9]].forEach(function (q, j) {
        var bs = 0.26 + (j % 3) * 0.05, bc = [0x5bc94c, 0x4fbe4a, 0x6cd85a][j % 3];
        BUSH.push({ x: q[0], y: bs * 0.55, z: q[1], sx: bs * 1.3, sy: bs, sz: bs * 1.1, c: bc });
        BUSH.push({ x: q[0] + bs * 0.9, y: bs * 0.4, z: q[1] + 0.1, sx: bs * 0.85, sy: bs * 0.7, sz: bs * 0.8, c: bc });
      });
      instanced(gSphLo, M(0xffffff, { roughness: 0.85 }), BUSH, true);

      /* ----- letras em textura de canvas (Fredoka quando carregar) ----- */
      var letterTex = [], ghostTex = [];
      function drawLetter(g, w, h, ch, k, ghost) {
        g.clearRect(0, 0, w, h);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '700 196px "Fredoka","Baloo 2","Lilita One",system-ui,sans-serif';
        if (ghost) {
          g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(ch, w / 2, h / 2 + 12);
          g.setLineDash([18, 12]); g.lineWidth = 10; g.strokeStyle = BDARK[k]; g.lineJoin = 'round'; g.lineCap = 'round';
          g.strokeText(ch, w / 2, h / 2 + 12);
          return;
        }
        g.lineJoin = 'round';
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillText(ch, w / 2 + 4, h / 2 + 22);
        g.lineWidth = 22; g.strokeStyle = BDARK[k]; g.strokeText(ch, w / 2, h / 2 + 14);
        g.fillStyle = '#ffffff'; g.fillText(ch, w / 2, h / 2 + 14);
      }
      LET.forEach(function (ch, k) {
        var cc = mkCanvas(256, 256, function (g, w, h) { drawLetter(g, w, h, ch, k, false); });
        var t = keep(new THREE.CanvasTexture(cc)); t.anisotropy = 4; letterTex.push({ t: t, c: cc });
        var gc = mkCanvas(256, 256, function (g, w, h) { drawLetter(g, w, h, ch, k, true); });
        var gt = keep(new THREE.CanvasTexture(gc)); ghostTex.push({ t: gt, c: gc });
      });
      var dead = false;
      if (document.fonts && document.fonts.load) {
        document.fonts.load('700 100px "Fredoka"').then(function () {
          if (dead) return;
          LET.forEach(function (ch, k) {
            drawLetter(letterTex[k].c.getContext('2d'), 256, 256, ch, k, false); letterTex[k].t.needsUpdate = true;
            drawLetter(ghostTex[k].c.getContext('2d'), 256, 256, ch, k, true); ghostTex[k].t.needsUpdate = true;
          });
        }).catch(function () {});
      }

      /* base de encaixe e blocos com letras */
      var BS = 0.62, GAP = 0.04, ROW_Z = 0.3, BASE_Y = 0.12;
      var SLOT = [0, 1, 2, 3].map(function (k) { return new THREE.Vector3((k - 1.5) * (BS + GAP), BASE_Y + BS / 2, ROW_Z); });
      var plate = block(4 * (BS + GAP) + 0.24, 0.12, BS + 0.26, 0xffe2b0, 0, 0.06, ROW_Z, 0, null, 0.05);
      [-1, 1].forEach(function (sg) { [-1, 1].forEach(function (sz) { PINS.push({ x: sg * (2 * (BS + GAP) + 0.04), y: 0.145, z: ROW_Z + sz * 0.25, ry: 0, sx: 1, sy: 1, sz: 1, c: 0xffc93c }); }); });
      [-1.5, -0.5, 0.5, 1.5].forEach(function (k) { BOWS.push({ x: k * (BS + GAP), y: 0.06, z: ROW_Z + (BS + 0.26) / 2 + 0.006, ry: 0, sx: 0.9, sy: 0.9, sz: 1, c: TEAL }); });

      var ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
      var ghosts = SLOT.map(function (p, k) {
        var g = new THREE.Group(); g.position.copy(p); scene.add(g);
        var gmM = ghostMat.clone(); gmM.color.set(BCOL[k]); var gm = new THREE.Mesh(rbox(BS, BS, BS, 0.08), gmM); g.add(gm);
        var ge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BS, BS, BS)), new THREE.LineBasicMaterial({ color: BCOL[k], transparent: true, opacity: 0.8 })); g.add(ge);
        var gl = new THREE.Mesh(gPlane, new THREE.MeshBasicMaterial({ map: ghostTex[k].t, transparent: true, depthWrite: false, opacity: 0.9 })); gl.scale.set(BS * 0.86, BS * 0.86, 1); gl.position.z = BS / 2 + 0.01; g.add(gl);
        return { g: g, m: gm, e: ge, l: gl };
      });

      var blocks = LET.map(function (ch, k) {
        var g = new THREE.Group(); scene.add(g);
        var inner = new THREE.Group(); g.add(inner);
        var mat = addRim(new THREE.MeshStandardMaterial({ color: BCOL[k], roughness: 0.55, emissive: BCOL[k], emissiveIntensity: 0 }));
        var m = new THREE.Mesh(rbox(BS, BS, BS, 0.08), mat); m.castShadow = true; m.receiveShadow = true; inner.add(m);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var pm = new THREE.Mesh(gHex, pinMat(tmpC.set(BCOL[k]).lerp(new THREE.Color(0xffffff), 0.35).getHex())); pm.scale.setScalar(1.25); pm.position.set(q[0] * 0.15, BS / 2 + 0.03, q[1] * 0.15); pm.castShadow = true; inner.add(pm); });
        var lf = new THREE.Mesh(gPlane, new THREE.MeshBasicMaterial({ map: letterTex[k].t, transparent: true, depthWrite: false })); lf.scale.set(BS * 0.9, BS * 0.9, 1); lf.position.z = BS / 2 + 0.006; inner.add(lf);
        var side = k % 2 ? 1 : -1;
        return { g: g, inner: inner, mat: mat, k: k, from: new THREE.Vector3(side * (k < 2 ? 1.6 : 2.7), BS / 2, ROW_Z + 0.5), t0: 0.35 + k * 0.5, t1: 0.35 + k * 0.5 + 0.62 };
      });
      // chaves borboleta que surgem na frente, entre os blocos
      var newBows = [1, 2, 3].map(function (k) {
        var b = new THREE.Mesh(gBow, addRim(new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.5, emissive: 0x5ff5dc, emissiveIntensity: 0 })));
        b.position.set((k - 2) * (BS + GAP), BASE_Y + 0.13, ROW_Z + BS / 2 + 0.008); b.scale.setScalar(0.001); scene.add(b);
        b.userData.k = k; return b;
      });
      var seamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      var seams = [1, 2, 3].map(function (k) {
        var m = new THREE.Mesh(G('seambox', function () { return new THREE.BoxGeometry(1, 1, 1); }), seamMat.clone());
        m.scale.set(0.035, BS + 0.02, BS + 0.02); m.position.set((k - 2) * (BS + GAP), BASE_Y + BS / 2, ROW_Z); m.visible = false; scene.add(m); return m;
      });

      /* bola de verdade (gomos coloridos) */
      var ballGeo = G('beach', function () {
        var sg = new THREE.SphereGeometry(1, 36, 20).toNonIndexed();
        var pos = sg.attributes.position, cols = [], cc = new THREE.Color();
        var gomos = [0xff5a5a, 0xffffff, 0xffc93c, 0x4d9de0, 0xffffff, 0x5cc970];
        for (var t = 0; t < pos.count; t += 3) {
          var cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3, cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3, cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
          var a = (Math.atan2(cz, cx) + Math.PI) / (Math.PI * 2);
          cc.set(Math.abs(cy) > 0.93 ? 0xffffff : gomos[Math.floor(a * 6) % 6]);
          for (var j = 0; j < 3; j++) cols.push(cc.r, cc.g, cc.b);
        }
        sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        sg.computeVertexNormals();
        return sg;
      });
      var BALL_R = 0.27, BALL_P = new THREE.Vector3(0, BASE_Y + BS + 0.03, ROW_Z);
      var ballG = new THREE.Group(); ballG.position.copy(BALL_P); scene.add(ballG);
      var ballSq = new THREE.Group(); ballG.add(ballSq);
      var ballM = new THREE.Mesh(ballGeo, addRim(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }))); ballM.castShadow = true; ballM.scale.setScalar(BALL_R); ballSq.add(ballM);
      var ballShadow = new THREE.Mesh(G('disc', function () { return new THREE.CircleGeometry(1, 24); }), new THREE.MeshBasicMaterial({ color: 0x2f6a2a, transparent: true, opacity: 0.25, depthWrite: false }));
      ballShadow.rotation.x = -Math.PI / 2; ballShadow.position.set(BALL_P.x, BALL_P.y + 0.06, BALL_P.z); scene.add(ballShadow);

      /* ----- herói (idêntico à cena aprovada) ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
        return e;
      }
      var hero = new THREE.Group(), hSq = new THREE.Group(), hB = new THREE.Group(); hero.add(hSq); hSq.add(hB); scene.add(hero);
      var PANTS = 0x2c3f7a, BLUE = 0x2f74e6, BLUE2 = 0x9cc4ff, ORANGE = 0xff8a2a, ORANGE2 = 0xe86f12;
      var hLegs = [-1, 1].map(function (sg) {
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
      var tuft = mesh(gCone, M(0x7a4426, { roughness: 0.6 }), 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, hHead); tuft.rotation.z = -0.5;
      var hEyes = [eye(hHead, -0.078, 0.0, 0.17, 0.055), eye(hHead, 0.078, 0.0, 0.17, 0.055)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead, true); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead, true); hMouth.rotation.z = Math.PI;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead);
      var HERO_P = new THREE.Vector3(-0.82, 0, -0.95);
      hero.position.copy(HERO_P); hero.scale.setScalar(1.3);

      /* ----- passarinho guia (mesmo traço: esferas, olhos iguais, rim light) ----- */
      var TOWER = new THREE.Vector3(1.12, 0, -1.2);
      block(0.42, 0.36, 0.42, 0x4d9de0, TOWER.x, 0.18, TOWER.z, 0.15, null, 0.06);
      block(0.36, 0.3, 0.36, 0xffc93c, TOWER.x, 0.51, TOWER.z, -0.1, null, 0.06);
      [[-1, -1], [1, 1], [-1, 1], [1, -1]].forEach(function (q) { PINS.push({ x: TOWER.x + q[0] * 0.09, y: 0.685, z: TOWER.z + q[1] * 0.09, ry: -0.1, sx: 1, sy: 1, sz: 1, c: 0xffe08a }); });
      var bird = new THREE.Group(), bB = new THREE.Group(); bird.add(bB); scene.add(bird);
      bird.position.set(TOWER.x, 0.67, TOWER.z); bird.scale.setScalar(1.25);
      var BIRD = 0x5ec8f2, BIRD2 = 0x3aa8e0, BELLY = 0xfff4e0;
      mesh(gSph, M(BIRD, { roughness: 0.6 }), 0.2, 0.19, 0.19, 0, 0.21, 0, bB);
      mesh(gSph, M(BELLY, { roughness: 0.7 }), 0.13, 0.13, 0.08, 0, 0.17, 0.13, bB, true);
      var bHead = new THREE.Group(); bHead.position.set(0, 0.42, 0.02); bB.add(bHead);
      mesh(gSph, M(BIRD, { roughness: 0.6 }), 0.15, 0.145, 0.145, 0, 0, 0, bHead);
      [[-0.03, 0.15, -0.3], [0.02, 0.17, 0.0], [0.06, 0.14, 0.35]].forEach(function (q) { var f = mesh(gSph, M(BIRD2, { roughness: 0.6 }), 0.025, 0.07, 0.025, q[0], q[1], -0.02, bHead); f.rotation.z = q[2]; });
      var bEyes = [eye(bHead, -0.055, 0.02, 0.12, 0.04), eye(bHead, 0.055, 0.02, 0.12, 0.04)];
      var beak = mesh(gCone, M(0xff9a2a, { roughness: 0.5 }), 0.035, 0.07, 0.035, 0, -0.03, 0.15, bHead); beak.rotation.x = Math.PI / 2;
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8fa0, { transparent: true, opacity: 0.6 }), 0.028, 0.018, 0.01, sg * 0.085, -0.035, 0.115, bHead, true); });
      var bWings = [-1, 1].map(function (sg) {
        var w = new THREE.Group(); w.position.set(sg * 0.17, 0.26, -0.01); bB.add(w);
        var wm = mesh(gSph, M(BIRD2, { roughness: 0.6 }), 0.06, 0.13, 0.1, sg * 0.03, -0.09, 0, w); wm.rotation.z = sg * 0.2;
        return w;
      });
      var tail = mesh(gSph, M(BIRD2, { roughness: 0.6 }), 0.05, 0.03, 0.11, 0, 0.13, -0.19, bB); tail.rotation.x = 0.5;
      [-1, 1].forEach(function (sg) { mesh(gSph, M(0xff9a2a), 0.035, 0.02, 0.05, sg * 0.06, 0.015, 0.04, bB); });

      instanced(gHex, pinMat(0xffffff), PINS, true);
      instanced(gBow, M(0xffffff, { roughness: 0.5 }), BOWS, false);

      /* faíscas, confete */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? 0.045 : 0.1, an = k / 10 * Math.PI * 2 + Math.PI / 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 32;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }), NSP);
      var spData = [], spCols = [0xfff27a, 0xffffff, 0xffc93c, 0xffffff];
      for (i = 0; i < NSP; i++) { spData.push({ k: i % 4, a: (i / NSP) * Math.PI * 2 * 4 + R(), up: 0.3 + R() * 0.5, r: 0.35 + R() * 0.35, s: 0.7 + R() * 0.6 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; scene.add(sparks);
      var NCF = 70;
      var conf = new THREE.InstancedMesh(gPlane, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), NCF);
      var cfData = [], cfCols = [0xff5a5a, 0xffc93c, 0x4d9de0, 0x5cc970, 0xff7aa8, 0xb48cff, 0xff9a2a];
      for (i = 0; i < NCF; i++) {
        var an = R() * Math.PI * 2, sp = 0.6 + R() * 1.2;
        cfData.push({ vx: Math.cos(an) * sp * 1.1, vy: 2.4 + R() * 2.0, vz: Math.sin(an) * sp * 0.4 + 0.2, rx: R() * 6, ry: R() * 6, w: 4 + R() * 6, s: 0.8 + R() * 0.5, ox: (R() - 0.5) * 2.2 });
        conf.setColorAt(i, tmpC.set(cfCols[i % cfCols.length]));
      }
      conf.instanceColor.needsUpdate = true; conf.frustumCulled = false; scene.add(conf);

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = 'primeirospassos-vig'; root.appendChild(vig);
      var hud = document.createElement('div'); hud.className = 'primeirospassos-hud';
      var starsHtml = ''; for (i = 0; i < 5; i++) starsHtml += '<div class="primeirospassos-star">' + STAR_OFF + STAR_ON + '</div>';
      var wordHtml = '<div class="primeirospassos-syl">' + LET.slice(0, 2).map(function (ch, k) { return '<span class="primeirospassos-ch">' + ch + '</span>'; }).join('') + '</div><span class="primeirospassos-dash">-</span><div class="primeirospassos-syl">' + LET.slice(2).map(function (ch) { return '<span class="primeirospassos-ch">' + ch + '</span>'; }).join('') + '</div>';
      hud.innerHTML =
        '<div class="primeirospassos-top primeirospassos-card"><div class="primeirospassos-ava">' + AVATAR + '</div><div class="primeirospassos-stars">' + starsHtml + '</div><div class="primeirospassos-home">' + IC_HOME + '</div></div>' +
        '<div class="primeirospassos-panel primeirospassos-card"><div class="primeirospassos-word">' + wordHtml + '</div>' +
        '<div class="primeirospassos-row"><div class="primeirospassos-side" style="background:#4d9de0">' + IC_SPK + '</div>' +
        '<div class="primeirospassos-micw"><div class="primeirospassos-ring"></div><div class="primeirospassos-ring"></div>' +
        '<div class="primeirospassos-wave" style="left:calc(-34px*var(--s))">' + WAVE_L + '</div><div class="primeirospassos-wave" style="right:calc(-34px*var(--s));transform:scaleX(-1)">' + WAVE_L + '</div>' +
        '<div class="primeirospassos-mic">' + IC_MIC + '</div></div>' +
        '<div class="primeirospassos-side" style="background:#fff0d0;box-shadow:0 calc(5px*var(--s)) 0 rgba(200,140,40,.25),0 calc(8px*var(--s)) calc(14px*var(--s)) rgba(30,60,90,.2)">' + IC_BALL + '</div></div></div>' +
        '<div class="primeirospassos-plus">+3' + STAR_BIG + '</div>';
      root.appendChild(hud);
      var q = function (s) { return hud.querySelector(s); }, qa = function (s) { return hud.querySelectorAll(s); };
      var elStars = Array.prototype.map.call(qa('.primeirospassos-star'), function (e) { return { el: e, on: e.querySelector('.primeirospassos-on') }; });
      var elCh = qa('.primeirospassos-ch'), elSyl = qa('.primeirospassos-syl'), elMic = q('.primeirospassos-mic'), elRings = qa('.primeirospassos-ring'), elPlus = q('.primeirospassos-plus');
      var elW = [qa('.primeirospassos-w1'), qa('.primeirospassos-w2'), qa('.primeirospassos-w3')];
      var elPanel = q('.primeirospassos-panel'), elBallBtn = q('.primeirospassos-side:last-child'), elTop = q('.primeirospassos-top');
      var flyStars = [0, 1, 2].map(function () { var e = document.createElement('div'); e.className = 'primeirospassos-fly'; e.innerHTML = STAR_BIG; hud.appendChild(e); return e; });

      var SVGNS = 'http://www.w3.org/2000/svg';
      var wipe = document.createElementNS(SVGNS, 'svg'); wipe.setAttribute('class', 'primeirospassos-wipe'); root.appendChild(wipe);
      var wipePath = document.createElementNS(SVGNS, 'path'); wipePath.setAttribute('fill', '#fff4df'); wipePath.setAttribute('fill-rule', 'evenodd'); wipe.appendChild(wipePath);
      var wipeEdge = document.createElementNS(SVGNS, 'path'); wipeEdge.setAttribute('fill', 'none'); wipeEdge.setAttribute('stroke', '#ffc93c'); wipeEdge.setAttribute('stroke-width', '8'); wipeEdge.setAttribute('stroke-linejoin', 'round'); wipe.appendChild(wipeEdge);
      wipe.style.display = 'none';

      /* ----- layout / câmera ----- */
      var S = 1, dist0 = 11, rootRect = null;
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H; camera.updateProjectionMatrix();
        var t = Math.tan(FOV / 2 * Math.PI / 180);
        var worldW = 3.15;
        dist0 = camera.aspect < 0.8 ? (worldW / 2) / (t * camera.aspect) : 3.3 / t;
        S = clamp(Math.min(W / 390, H / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        wipe.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);
      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion();
      function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }
      function rel(el) { var r = el.getBoundingClientRect(); if (!rootRect) rootRect = root.getBoundingClientRect(); return { x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height }; }
      var TARGET = new THREE.Vector3(0, 1.1, -0.15);

      function hopPos(b, s, out) {
        var k = clamp((s - b.t0) / (b.t1 - b.t0), 0, 1), end = SLOT[b.k];
        out.x = lerp(b.from.x, end.x, k); out.z = lerp(b.from.z, end.z, k);
        // dois pulos: um alto e um menor que pousa no lugar
        var y = 0;
        if (k < 0.55) { var a = k / 0.55; y = Math.sin(a * Math.PI) * 1.05; }
        else { var a2 = (k - 0.55) / 0.45; y = Math.sin(a2 * Math.PI) * 0.6; }
        out.y = lerp(b.from.y, end.y, k) + y;
        return k;
      }
      var hp = new THREE.Vector3();

      function update(t, wall) {
        rootRect = null;
        var s = t >= 5.6 ? t - LOOP : t;

        // câmera: perto e frontal, leve respiração e aproximação na palavra pronta
        var push = reduce ? 0 : sstep(2.4, 3.3, s) * (1 - sstep(4.9, 5.6, s));
        var dist = dist0 * (1 - 0.05 * push);
        var az = AZ + (reduce ? 0 : Math.sin(wall * 0.4) * 0.025);
        camera.position.set(TARGET.x + dist * Math.sin(az) * Math.cos(EL), TARGET.y + dist * Math.sin(EL), TARGET.z + dist * Math.cos(az) * Math.cos(EL));
        camera.lookAt(TARGET.x, TARGET.y + 0.05 * push, TARGET.z);
        camera.updateMatrixWorld();
        sky.position.copy(camera.position);
        camQ.copy(camera.quaternion);

        // nuvens passeando
        cloudMesh.position.x = Math.sin(wall * 0.05) * 1.2;

        // blocos quicam até o lugar
        var full = sstep(2.95, 3.05, s);
        blocks.forEach(function (b, k) {
          var g = b.g;
          var kk = hopPos(b, s, hp);
          g.position.copy(hp);
          var flying = s > b.t0 && kk < 1;
          // antes de sair: espera na beira, balançando
          var waitBob = s < b.t0 ? Math.abs(Math.sin(wall * 4 + k)) * 0.06 : 0;
          g.position.y += waitBob;
          var spin = flying ? (kk < 0.55 ? (kk / 0.55) * Math.PI * 2 * (k % 2 ? 1 : -1) : 0) : 0;
          b.inner.rotation.set(0, 0, spin);
          g.rotation.y = flying ? (1 - kk) * (k % 2 ? -0.4 : 0.4) : (s < b.t0 ? (k % 2 ? -0.35 : 0.35) : 0);
          // squash no pouso intermediário e no final
          var land1 = Math.abs(kk - 0.55) < 0.06 ? Math.cos((kk - 0.55) / 0.06 * Math.PI / 2) : 0;
          var cl = s > b.t1 && s < b.t1 + 0.2 ? Math.sin((s - b.t1) / 0.2 * Math.PI) : 0;
          // onda "BO" e "LA"
          var syl = k < 2 ? 3.1 : 3.45;
          var wv = s > syl && s < syl + 0.32 ? Math.sin((s - syl) / 0.32 * Math.PI) : 0;
          g.position.y += wv * 0.22;
          var sq = 1 - cl * 0.25 - land1 * 0.2 + wv * 0.08;
          b.inner.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
          b.inner.position.y = -(1 - sq) * BS / 2;
          b.mat.emissiveIntensity = Math.max(cl * 0.45, wv * 0.35, full * (1 - sstep(3.05, 3.6, s)) * 0.3);
        });
        seams.forEach(function (sm, j) {
          var b = blocks[j + 1], o = s > b.t1 - 0.02 ? 1 - sstep(b.t1 + 0.1, b.t1 + 0.7, s) : 0;
          o = Math.max(o, full * (1 - sstep(3.1, 3.7, s)));
          sm.material.opacity = o * 0.9; sm.visible = o > 0.01;
        });
        newBows.forEach(function (bw) {
          var b = blocks[bw.userData.k], k01 = clamp((s - b.t1) / 0.22, 0, 1);
          bw.scale.setScalar(Math.max(0.001, s > b.t1 ? outBack(k01, 2.6) : 0));
          bw.material.emissiveIntensity = (1 - sstep(b.t1 + 0.15, b.t1 + 0.8, s)) * 0.9;
        });
        ghosts.forEach(function (gh, k) {
          var b = blocks[k], a = (0.6 + 0.4 * Math.sin(wall * 5 + k)) * (1 - sstep(b.t1 - 0.12, b.t1, s));
          gh.g.visible = a > 0.01;
          gh.m.material.opacity = 0.3 * a; gh.e.material.opacity = 0.75 * a; gh.l.material.opacity = 0.85 * a;
          gh.g.scale.setScalar(1 + 0.02 * Math.sin(wall * 5 + k));
        });

        // faíscas a cada encaixe
        for (var i = 0; i < NSP; i++) {
          var sd = spData[i], b = blocks[sd.k], fk = clamp((s - b.t1) / 0.6, 0, 1), on = s > b.t1 && fk < 1;
          if (!on) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else {
            var ee = outCubic(fk), rr = sd.r * ee;
            dummy.position.set(SLOT[sd.k].x + Math.cos(sd.a) * rr, SLOT[sd.k].y + 0.1 + sd.up * ee + Math.sin(sd.a) * rr * 0.6 - fk * fk * 0.3, ROW_Z + BS / 2 + 0.1);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk * 1.3) * Math.PI) * 1.3 + 0.0001);
          }
          dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + sd.a);
          dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;

        // bola aparece e quica; confete
        var BT = 3.3;
        var bk = clamp((s - BT) / 0.3, 0, 1);
        var bsc = s > BT ? outBack(bk, 2.4) : 0;
        var bt = s - BT - 0.15, by = 0, bsq = 1;
        if (bt > 0) {
          var periods = [0.62, 0.5, 0.4, 0.34, 0.3, 0.28], hts = [1.25, 0.85, 0.55, 0.35, 0.22, 0.15], acc = 0;
          for (var p = 0; p < periods.length; p++) {
            if (bt < acc + periods[p]) { var u = (bt - acc) / periods[p]; by = hts[p] * 4 * u * (1 - u); var edge = Math.min(u, 1 - u); bsq = edge < 0.06 ? 1 - (0.06 - edge) / 0.06 * 0.22 : 1 + 0.05 * (1 - Math.abs(u - 0.5) * 2); break; }
            acc += periods[p];
          }
        }
        if (s < BT) by = 0;
        ballG.visible = bsc > 0.002;
        var bx = 0.36 * Math.sin(Math.max(0, bt) * 5.2) * (1 - sstep(2.0, 2.4, Math.max(0, bt)));
        ballG.position.set(BALL_P.x + bx, BALL_P.y + BALL_R * bsc + by + (1 - bk) * 0.5, BALL_P.z);
        ballShadow.position.x = BALL_P.x + bx;
        ballSq.scale.set(bsc / Math.sqrt(bsq), bsc * bsq, bsc / Math.sqrt(bsq));
        ballSq.position.y = -BALL_R * (1 - bsq);
        ballM.rotation.z = -(s - BT) * 4; ballM.rotation.x = (s - BT) * 1.5;
        ballShadow.visible = ballG.visible;
        var shs = BALL_R * bsc * (1 - by * 0.3);
        ballShadow.scale.setScalar(Math.max(0.001, shs)); ballShadow.material.opacity = 0.28 * (1 - by * 0.4);
        var ck = (s - BT) / 1.7;
        for (i = 0; i < NCF; i++) {
          var cd = cfData[i];
          if (ck <= 0 || ck >= 1) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); dummy.rotation.set(0, 0, 0); }
          else {
            var tt = ck * 1.7;
            dummy.position.set(cd.ox * 0.5 + cd.vx * tt * 0.9, 0.9 + cd.vy * tt - 3.4 * tt * tt * 0.9 + 0.0, ROW_Z + 0.2 + cd.vz * tt);
            dummy.position.x += Math.sin(tt * cd.w) * 0.06;
            dummy.rotation.set(cd.rx + tt * cd.w, cd.ry + tt * 3, tt * 2);
            dummy.scale.set(0.055 * cd.s, 0.09 * cd.s, 1).multiplyScalar(1 - sstep(0.8, 1, ck));
          }
          dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
        }
        conf.instanceMatrix.needsUpdate = true;

        // herói acena e comemora
        var cheer = sstep(3.3, 3.45, s) * (1 - sstep(4.9, 5.2, s));
        var look = Math.max(0, 1 - cheer);
        var focus = 0;
        blocks.forEach(function (b) { if (s > b.t0 && s < b.t1 + 0.1) focus = b.from.x > 0 ? 1 : -1; });
        hero.rotation.y = 0.12 + 0.12 * focus * look;
        var breathe = Math.sin(wall * 2.4) * 0.012;
        var jump = 0;
        [3.35, 3.85, 4.35].forEach(function (j0) { if (s > j0 && s < j0 + 0.42) jump = Math.sin((s - j0) / 0.42 * Math.PI); });
        hB.position.y = jump * 0.24;
        var sq2 = 1 + breathe + jump * 0.08;
        hSq.scale.set(1 / Math.sqrt(sq2), sq2, 1 / Math.sqrt(sq2));
        hLegs[0].rotation.x = -jump * 0.3; hLegs[1].rotation.x = -jump * 0.3;
        var waveA = Math.sin(wall * 9) * 0.35;
        hArms[0].rotation.set(0, 0, -0.16); hArms[1].rotation.set(0, 0, 0.16);
        var wav = 1 - cheer;
        hArms[1].rotation.z += wav * (2.5 + waveA); hArms[1].rotation.x -= wav * 0.15;
        hArms[0].rotation.x -= 0.1 * wav;
        hArms[0].rotation.z -= cheer * (2.4 + Math.sin(wall * 18) * 0.15); hArms[1].rotation.z += cheer * (2.4 + Math.sin(wall * 18 + 1) * 0.15);
        hHead.rotation.x = -0.05 + 0.18 * sstep(0.2, 0.6, s) * look * (1 - sstep(2.9, 3.2, s));
        hHead.rotation.y = 0.35 * focus * look;
        hHead.rotation.z = Math.sin(wall * 2) * 0.05 + 0.1 * cheer * Math.sin(wall * 9);
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + 0.5 + cheer * 1.2), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink);

        // passarinho: acena com a asa, pula e bate asas na festa
        var party = sstep(3.3, 3.45, s) * (1 - sstep(4.9, 5.2, s));
        var hop = 0; [0.0, 0.5, 1.0, 1.5].forEach(function (o) { var j0 = 3.32 + o; if (s > j0 && s < j0 + 0.34) hop = Math.sin((s - j0) / 0.34 * Math.PI); });
        bB.position.y = hop * 0.28 + Math.abs(Math.sin(wall * 3)) * 0.015 * (1 - party);
        bird.rotation.y = -0.45 + 0.25 * party;
        var bsq2 = 1 + Math.sin(wall * 3) * 0.03 + hop * 0.1;
        bB.scale.set(1 / Math.sqrt(bsq2), bsq2, 1 / Math.sqrt(bsq2));
        var flapB = Math.sin(wall * 30) * 0.9;
        bWings[0].rotation.z = -0.25 - party * (0.8 + flapB * 0.6) - (1 - party) * (2.0 + Math.sin(wall * 8) * 0.45);
        bWings[1].rotation.z = 0.25 + party * (0.8 + flapB * 0.6);
        bHead.rotation.z = Math.sin(wall * 2.6) * 0.12;
        bHead.rotation.x = -0.1 + Math.sin(wall * 5) * 0.05;
        var bbl = (wall + 0.8) % 2.7, bblink = bbl < 0.12 ? Math.abs(Math.cos(bbl / 0.12 * Math.PI)) : 1;
        bEyes[0].scale.y = bEyes[1].scale.y = Math.max(0.1, bblink);
        beak.scale.set(0.035, 0.07 + 0.02 * party * Math.abs(Math.sin(wall * 14)), 0.035);

        /* ----- HUD ----- */
        // letras da palavra acendem conforme os blocos encaixam
        for (i = 0; i < 4; i++) {
          var lk = clamp((s - blocks[i].t1) / 0.25, 0, 1), on2 = s > blocks[i].t1;
          var e = elCh[i];
          e.style.color = on2 ? HUDC[i] : '#e6dccb';
          e.style.textShadow = on2 ? '0 calc(3px*var(--s)) 0 rgba(0,0,0,.08)' : 'none';
          e.style.transform = 'scale(' + (on2 ? (lk < 1 ? outBack(lk, 3) : 1) : 0.92).toFixed(3) + ')';
        }
        [3.1, 3.45].forEach(function (st, j) {
          var sk = clamp((s - st) / 0.42, 0, 1), on3 = s > st && sk < 1;
          var pp = on3 ? Math.sin(sk * Math.PI) : 0;
          elSyl[j].style.transform = 'scale(' + (1 + pp * 0.22).toFixed(3) + ') translateY(' + (-pp * 6 * S).toFixed(1) + 'px)';
          elSyl[j].style.background = 'rgba(255,201,60,' + (pp * 0.35).toFixed(3) + ')';
        });
        // microfone pulsando com ondas
        var talkAmt = sstep(2.95, 3.1, s) * (1 - sstep(3.75, 3.95, s));
        var pulse = 1 + 0.05 * Math.sin(wall * 6) + talkAmt * 0.07 * Math.abs(Math.sin(wall * 18));
        elMic.style.transform = 'scale(' + pulse.toFixed(3) + ')';
        Array.prototype.forEach.call(elRings, function (rg, j) {
          var rk = (wall * 0.9 + j * 0.5) % 1;
          rg.style.transform = 'scale(' + (1 + rk * (0.45 + talkAmt * 0.3)).toFixed(3) + ')';
          rg.style.opacity = ((1 - rk) * (0.55 + talkAmt * 0.4)).toFixed(3);
        });
        elW.forEach(function (list, j) {
          var wv2 = 0.25 + 0.75 * Math.max(0, Math.sin(wall * (5 + talkAmt * 6) - j * 0.9));
          Array.prototype.forEach.call(list, function (el) { el.style.opacity = (wv2 * (0.55 + 0.45 * talkAmt)).toFixed(3); });
        });
        elBallBtn.style.transform = 'scale(' + (1 + 0.12 * (s > 3.3 && s < 3.7 ? Math.sin((s - 3.3) / 0.4 * Math.PI) : 0)).toFixed(3) + ')';

        // estrelas: 2 cheias no começo; +3 no fim
        var topR = rel(elTop);
        var pk = clamp((s - 3.95) / 1.15, 0, 1);
        var plusP = proj(0.3, 2.2, ROW_Z);
        elPlus.style.opacity = s > 3.95 ? (pk < 0.1 ? pk / 0.1 : 1 - sstep(0.75, 1, pk)).toFixed(3) : 0;
        elPlus.style.transform = 'translate(' + plusP.x.toFixed(1) + 'px,' + (plusP.y - 40 * S * outCubic(pk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (pk < 0.18 ? outBack(pk / 0.18, 2.6) : 1).toFixed(3) + ')';
        elStars.forEach(function (st, j) {
          var fillT = j < 2 ? -99 : 4.35 + (j - 2) * 0.18;
          var fk = clamp((s - fillT) / 0.25, 0, 1);
          st.on.style.transform = 'scale(' + (j < 2 ? 1 : (s > fillT ? outBack(fk, 3) : 0)).toFixed(3) + ')';
          st.el.style.transform = j >= 2 && s > fillT && fk < 1 ? 'rotate(' + (Math.sin(fk * Math.PI) * 18).toFixed(1) + 'deg)' : '';
        });
        flyStars.forEach(function (fe, j) {
          var t0f = 4.1 + j * 0.18, fk = (s - t0f) / 0.25;
          if (fk <= 0 || fk >= 1) { fe.style.opacity = 0; return; }
          var tr = rel(elStars[j + 2].el);
          var sxp = plusP.x + 30 * S, syp = plusP.y - 30 * S, ex = tr.x + tr.w / 2, ey = tr.y + tr.h / 2;
          var e2 = fk * fk * (3 - 2 * fk);
          fe.style.opacity = 1;
          fe.style.transform = 'translate(' + lerp(sxp, ex, e2).toFixed(1) + 'px,' + (lerp(syp, ey, e2) - Math.sin(fk * Math.PI) * 40 * S).toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (fk * 220).toFixed(0) + 'deg)';
        });

        // transição: íris em forma de estrela que fecha no herói e reabre
        var ik = t < 5.6 ? sstep(5.25, 5.6, t) : 1 - sstep(5.6, 6.0, t);
        if (ik <= 0.002) { wipe.style.display = 'none'; }
        else {
          wipe.style.display = 'block';
          hHead.getWorldPosition(v3); var cp = proj(v3.x, v3.y - 0.25, v3.z);
          var maxR = Math.sqrt(W * W + H * H) * 1.25, rad = Math.max(0, maxR * (1 - ik));
          var d = '';
          if (rad > 0.5) {
            for (var k = 0; k < 10; k++) { var rr2 = k % 2 ? rad * 0.5 : rad, an2 = -Math.PI / 2 + k * Math.PI / 5 + (1 - ik) * 0.6; d += (k ? 'L' : 'M') + (cp.x + Math.cos(an2) * rr2).toFixed(1) + ' ' + (cp.y + Math.sin(an2) * rr2).toFixed(1); }
            d += 'Z';
          }
          wipePath.setAttribute('d', 'M-10 -10H' + (W + 10) + 'V' + (H + 10) + 'H-10Z' + d);
          wipeEdge.setAttribute('d', d || 'M0 0');
        }
      }

      var raf = 0, t0 = performance.now();
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
