/* Estilo 3D PIXELADO — mundo 3D low poly renderizado em baixa resolução e ampliado com pixels nítidos.
   Cena "a ponte da vila" (loop de 3,6 s). three.js r128 global. HUD em alta resolução por cima. */
(function () {
  window.SCENES = window.SCENES || {};
  var ID = 'pixel3d';
  var LOOP = 3.6;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOutBack(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function hash(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------------- pixel-art icons (tiny canvases scaled up with image-rendering:pixelated) ---------------- */
  var PAL = {
    k: '#3b2a2f', K: '#5a4148', w: '#ffffff', c: '#fff4dd',
    h: '#6b3f22', H: '#91592f', s: '#f6c9a0', S: '#e2a47c', r: '#f08a7a', m: '#a8483a', e: '#2b2030',
    b: '#3b7be0', B: '#2856a8', l: '#8fd3f0', L: '#b9e6f7',
    o: '#ff8a3d', O: '#d9661f', y: '#ffd04a', Y: '#f2a51f',
    g: '#7cc152', G: '#4f9a3c', t: '#c98a4b', T: '#8d5a2b', p: '#f3e2bd', P: '#e2c896',
    a: '#c7ccd6', A: '#8f97a8', x: '#e8534a'
  };
  var ICONS = {
    avatar: [
      'llllllllllllllll',
      'llllkkkkkkkkllll',
      'lllkhhHHHhhhklll',
      'llkhhHHHHHhhhkll',
      'lkhhhhhhhhhhhhkl',
      'lkhhshhhhhhshhkl',
      'lkhsssssssssshkl',
      'lkssesssssessskl',
      'lkssesssssessskl',
      'lksrrsssssrrsSkl',
      'llkssssmmsssSkll',
      'lllkkssssssSkkll',
      'llkbbkkkkkkbbkll',
      'lkbbbobbbbobbbkl',
      'kbbbbobbbbobbbbk',
      'kbbbbobbbbobbbbk'
    ],
    bridge: [
      '............',
      '............',
      'T..........T',
      'TkkkkkkkkkkT',
      'Ttttt..ttttT',
      'TkkkkkkkkkkT',
      'T.T......T.T',
      'T.T......T.T',
      'lLlTllllTlLl',
      'llLllLlllLll',
      'blllblLlbllb',
      '............'
    ],
    hammer: [
      '............',
      '.kkkkkkk....',
      'kAaaaaaAk...',
      'kAaaawaaAkk.',
      'kAAAAAAAAk..',
      '.kkkTTkkk...',
      '....kTTk....',
      '....kTtk....',
      '....kTtk....',
      '....kTtk....',
      '....kTtk....',
      '.....kk.....'
    ],
    bag: [
      '....kkkk....',
      '...kOkkOk...',
      '..kkkkkkkk..',
      '.kooooooook.',
      '.kOOOOOOOOk.',
      '.kooooooook.',
      '.kooykkyook.',
      '.koookkoook.',
      '.kooOOOOook.',
      '.kooOooOook.',
      '.kOOOOOOOOk.',
      '..kkkkkkkk..'
    ],
    map: [
      '............',
      'kkkkkkkkkkkk',
      'kppPgggpPppk',
      'kpgPggppPpxk',
      'kpgPgpppPxpk',
      'kppPlllpPxxk',
      'kpplllllPppk',
      'kplllPppPllk',
      'kppPpppgPgpk',
      'kppPppggPggk',
      'kkkkkkkkkkkk',
      '............'
    ],
    star: [
      '....k....',
      '...kyk...',
      '...kyk...',
      'kkkkyykkk',
      'kyyywyyyk',
      '.kyyyyyk.',
      '..kyYyk..',
      '.kyYkYyk.',
      '.kkk.kkk.'
    ],
    next: [
      'kkkkkkk',
      'kyyyyyk',
      '.kyyyk.',
      '..kyk..',
      '...k...'
    ],
    helmet: [
      '..........',
      '...kkkk...',
      '..kyywyk..',
      '.kyyywyyk.',
      '.kyyyyyyk.',
      'kkYYYYYYkk',
      'kYYYYYYYYk',
      '.kkkkkkkk.'
    ]
  };
  function iconCanvas(name, cls) {
    var rows = ICONS[name], h = rows.length, w = 0, i, j;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.className = cls || '';
    var g = cv.getContext('2d');
    for (i = 0; i < h; i++) for (j = 0; j < rows[i].length; j++) {
      var ch = rows[i][j]; if (ch === '.' || !PAL[ch]) continue;
      g.fillStyle = PAL[ch]; g.fillRect(j, i, 1, 1);
    }
    return cv;
  }

  var P = ID + '-';
  var CSS = '' +
    '.' + P + 'stage{position:absolute;left:0;top:0;image-rendering:pixelated;image-rendering:crisp-edges;display:block}' +
    '.' + P + 'hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,sans-serif;color:#3b2a2f;-webkit-font-smoothing:antialiased}' +
    '.' + P + 'hud canvas{image-rendering:pixelated;image-rendering:crisp-edges;display:block}' +
    '.' + P + 'card{background:#fff4dd;border:.19em solid #3b2a2f;border-radius:1em;box-shadow:0 .26em 0 #3b2a2f,0 .7em 1.2em rgba(59,42,47,.18)}' +
    '.' + P + 'top{position:absolute;left:.85em;right:.85em;top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:.7em;padding:.5em .85em .55em .5em}' +
    '.' + P + 'ava{flex:none;width:3.4em;height:3.4em;border-radius:50%;border:.19em solid #3b2a2f;overflow:hidden;background:#8fd3f0;box-shadow:inset 0 -.25em 0 rgba(0,0,0,.08)}' +
    '.' + P + 'ava canvas{width:100%;height:100%}' +
    '.' + P + 'info{flex:1;min-width:0}' +
    '.' + P + 'row{display:flex;justify-content:space-between;align-items:center;gap:.4em}' +
    '.' + P + 'lvl{font-family:"Fredoka","Nunito Sans",system-ui,sans-serif;font-weight:600;font-size:1.12em;white-space:nowrap;line-height:1.1}' +
    '.' + P + 'xpt{display:flex;align-items:center;gap:.25em;font-size:.8em;font-weight:800;color:#6d5960;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.' + P + 'xpt canvas{width:1.1em;height:1.1em}' +
    '.' + P + 'bar{position:relative;margin-top:.4em;height:.95em;background:#ead8b8;border:.16em solid #3b2a2f;border-radius:.6em;overflow:hidden}' +
    '.' + P + 'fill{position:absolute;left:0;top:0;bottom:0;width:62%;background:#7cc152;border-right:.16em solid #3b2a2f;' +
      'background-image:linear-gradient(180deg,rgba(255,255,255,.45) 0 34%,transparent 34% 72%,rgba(0,0,0,.12) 72%),repeating-linear-gradient(90deg,transparent 0 .9em,rgba(59,42,47,.18) .9em 1.05em)}' +
    '.' + P + 'gain{position:absolute;top:0;bottom:0;left:62%;width:0;background:#ffd04a}' +
    '.' + P + 'quest{position:absolute;left:.85em;top:calc(env(safe-area-inset-top,0px) + 38px + 5.75em);display:flex;align-items:center;gap:.55em;padding:.4em .85em .4em .45em;max-width:80%;font-weight:800;font-size:.88em;border-radius:.85em}' +
    '.' + P + 'quest .' + P + 'qi{flex:none;width:2.2em;height:2.2em;border-radius:.6em;background:#ffe6a6;border:.15em solid #3b2a2f;display:grid;place-items:center}' +
    '.' + P + 'quest .' + P + 'qi canvas{width:1.6em;height:1.6em}' +
    '.' + P + 'quest span{line-height:1.2}' +
    '.' + P + 'quest small{display:block;font-family:"Fredoka",system-ui,sans-serif;font-weight:600;font-size:.78em;letter-spacing:.06em;text-transform:uppercase;color:#d9661f}' +
    '.' + P + 'bub{position:absolute;left:.85em;right:.85em;top:0;padding:.95em 2.4em .85em 1em;opacity:0;transform-origin:var(--tx,70%) 0;border-radius:1em}' +
    '.' + P + 'tail{position:absolute;top:-.98em;left:calc(var(--tx,70%) - .75em);width:1.5em;height:1em;overflow:visible;transform:scaleY(-1)}' +
    '.' + P + 'next{position:absolute;right:.9em;bottom:.75em;width:.9em;height:.6em}' +
    '.' + P + 'name{display:inline-flex;align-items:center;gap:.35em;font-family:"Fredoka",system-ui,sans-serif;font-weight:600;font-size:.84em;color:#fff;background:#e0703a;border:.15em solid #3b2a2f;padding:.12em .55em .12em .35em;border-radius:.6em;position:absolute;left:.7em;top:-1.05em;box-shadow:0 .15em 0 #3b2a2f}' +
    '.' + P + 'name canvas{width:1.3em;height:1.04em}' +
    '.' + P + 'say{font-size:1.1em;font-weight:800;line-height:1.3}' +
    '.' + P + 'xp{position:absolute;left:0;top:0;display:flex;align-items:center;gap:.2em;font-family:"Fredoka",system-ui,sans-serif;font-weight:700;font-size:1.75em;color:#ffd04a;opacity:0;white-space:nowrap;transform:translate(-50%,-50%);' +
      'text-shadow:.07em 0 0 #3b2a2f,-.07em 0 0 #3b2a2f,0 .07em 0 #3b2a2f,0 -.07em 0 #3b2a2f,.07em .07em 0 #3b2a2f,-.07em .07em 0 #3b2a2f,.07em -.07em 0 #3b2a2f,-.07em -.07em 0 #3b2a2f,0 .16em 0 #3b2a2f}' +
    '.' + P + 'xp canvas{width:1em;height:1em}' +
    '.' + P + 'btns{position:absolute;left:.85em;right:.85em;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:.6em}' +
    '.' + P + 'btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:.25em;padding:.55em .2em .6em;font-family:"Fredoka","Nunito Sans",system-ui,sans-serif;font-weight:600;font-size:1.02em;border-radius:1.05em}' +
    '.' + P + 'btn .' + P + 'bi{width:2.75em;height:2.75em;border-radius:.8em;border:.15em solid #3b2a2f;display:grid;place-items:center}' +
    '.' + P + 'btn .' + P + 'bi canvas{width:2em;height:2em}' +
    '.' + P + 'btn.main{background:#ffd04a}' +
    '';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var disposables = [];

      /* ---------------- renderer (low-res) ---------------- */
      var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      var cv = renderer.domElement;
      cv.className = P + 'stage';
      host.appendChild(cv);

      var scene = new THREE.Scene();
      var FOG = 0xcfe6ef;
      scene.fog = new THREE.Fog(FOG, 22, 70);
      var camera = new THREE.PerspectiveCamera(60, W / H, 0.4, 140);

      // render target with depth for the outline / dither post pass
      var rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
      rt.texture.generateMipmaps = false;
      rt.depthTexture = new THREE.DepthTexture(4, 4);
      rt.depthTexture.format = THREE.DepthFormat;
      rt.depthTexture.type = THREE.UnsignedIntType;

      var postMat = new THREE.ShaderMaterial({
        uniforms: {
          tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture },
          res: { value: new THREE.Vector2(4, 4) }, cNear: { value: camera.near }, cFar: { value: camera.far },
          uFade: { value: 0 }, fadeCol: { value: new THREE.Color(0xfff4dd) }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: [
          'uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float cNear; uniform float cFar; uniform float uFade; uniform vec3 fadeCol;',
          'varying vec2 vUv;',
          'float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * cNear * cFar) / (cFar + cNear - z * (cFar - cNear)); }',
          'float D(vec2 o){ return lin(texture2D(tDepth, vUv + o / res).x); }',
          'float bayer(vec2 p){ p = mod(floor(p), 4.0);',
          '  float i = p.x + p.y * 4.0;',
          '  float v = 0.0;',
          '  if(i<0.5)v=0.0; else if(i<1.5)v=8.0; else if(i<2.5)v=2.0; else if(i<3.5)v=10.0;',
          '  else if(i<4.5)v=12.0; else if(i<5.5)v=4.0; else if(i<6.5)v=14.0; else if(i<7.5)v=6.0;',
          '  else if(i<8.5)v=3.0; else if(i<9.5)v=11.0; else if(i<10.5)v=1.0; else if(i<11.5)v=9.0;',
          '  else if(i<12.5)v=15.0; else if(i<13.5)v=7.0; else if(i<14.5)v=13.0; else v=5.0;',
          '  return (v + 0.5) / 16.0; }',
          'void main(){',
          '  vec3 c = texture2D(tColor, vUv).rgb;',
          '  float d = D(vec2(0.0));',
          '  float mx = max(max(D(vec2(1.0,0.0)), D(vec2(-1.0,0.0))), max(D(vec2(0.0,1.0)), D(vec2(0.0,-1.0))));',
          '  float edge = step(0.09 * d + 0.18, mx - d) * (1.0 - smoothstep(16.0, 30.0, d));',
          '  c = mix(c, c * vec3(0.30, 0.24, 0.32), edge * 0.92);',
          '  if (bayer(gl_FragCoord.xy) < uFade) c = fadeCol;',
          '  gl_FragColor = vec4(c, 1.0);',
          '}'
        ].join('\n'),
        depthTest: false, depthWrite: false
      });
      var postScene = new THREE.Scene();
      var postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
      postQuad.frustumCulled = false;
      postScene.add(postQuad);

      /* ---------------- materials ---------------- */
      var grad = new THREE.DataTexture(new Uint8Array([96, 96, 96, 255, 178, 178, 178, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
      grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
      var mats = {};
      function T(color, o) {
        var key = color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, gradientMap: grad };
        if (o) for (var k in o) p[k] = o[k];
        return (mats[key] = new THREE.MeshToonMaterial(p));
      }
      function mesh(geo, color, o, cast) {
        var m = new THREE.Mesh(geo, T(color, o));
        m.castShadow = cast !== false; m.receiveShadow = true;
        return m;
      }
      function flat(geo) { var g = geo.index ? geo.toNonIndexed() : geo; if (g !== geo) geo.dispose(); g.computeVertexNormals(); return g; }
      function jitter(geo, amt, seed) {
        var p = geo.attributes.position;
        for (var i = 0; i < p.count; i++) {
          var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          var kx = Math.round(x * 100), ky = Math.round(y * 100), kz = Math.round(z * 100);
          p.setXYZ(i, x + (hash(kx, ky, kz + seed) - 0.5) * amt, y + (hash(ky, kz, kx + seed) - 0.5) * amt, z + (hash(kz, kx, ky + seed) - 0.5) * amt);
        }
        return flat(geo);
      }
      var R = rng(11);

      /* ---------------- lights ---------------- */
      scene.add(new THREE.HemisphereLight(0xe4f2ff, 0x9cb07a, 0.5));
      var sun = new THREE.DirectionalLight(0xfff0d6, 0.68);
      sun.position.set(-6, 11, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
      sun.shadow.bias = -0.002;
      sun.target.position.set(0, 0, 0);
      scene.add(sun); scene.add(sun.target);

      /* ---------------- sky (dithered bands) ---------------- */
      var skyMat = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
        fragmentShader: [
          'varying vec3 vD;',
          'float bayer(vec2 p){ p = mod(floor(p), 2.0); return p.x < 0.5 ? (p.y < 0.5 ? 0.125 : 0.625) : (p.y < 0.5 ? 0.875 : 0.375); }',
          'void main(){',
          '  float h = clamp(vD.y, -0.1, 1.0);',
          '  float t = clamp((h + 0.02) / 0.42, 0.0, 1.0);',
          '  float steps = 6.0;',
          '  float q = floor(t * steps + bayer(gl_FragCoord.xy)) / steps;',
          '  vec3 hor = vec3(1.0, 0.93, 0.80); vec3 mid = vec3(0.62, 0.86, 0.95); vec3 top = vec3(0.30, 0.62, 0.90);',
          '  vec3 c = q < 0.5 ? mix(hor, mid, q * 2.0) : mix(mid, top, (q - 0.5) * 2.0);',
          '  gl_FragColor = vec4(c, 1.0);',
          '}'
        ].join('\n'),
        side: THREE.BackSide, depthWrite: false, fog: false
      });
      var sky = new THREE.Mesh(new THREE.SphereGeometry(100, 16, 10), skyMat);
      sky.renderOrder = -10; sky.frustumCulled = false;
      scene.add(sky);
      var sunDisk = new THREE.Mesh(new THREE.CircleGeometry(4, 10), new THREE.MeshBasicMaterial({ color: 0xfff6cf, fog: false }));
      sunDisk.position.set(-30, 34, -80); sunDisk.lookAt(0, 0, 0); scene.add(sunDisk);
      var sunHalo = new THREE.Mesh(new THREE.CircleGeometry(6.2, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c0, fog: false }));
      sunHalo.position.set(-30, 34, -80.6); sunHalo.lookAt(0, 0, 0); scene.add(sunHalo);

      /* ---------------- clouds ---------------- */
      var clouds = [];
      var cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: grad, emissive: 0xb9cfe0, emissiveIntensity: 0.45, fog: false });
      function cloud(x, y, z, s, seed) {
        var g = new THREE.Group();
        var parts = [[0, 0, 0, 1.3], [1.35, -0.25, 0.1, 0.95], [-1.3, -0.3, 0, 0.9], [0.45, 0.6, -0.2, 0.95], [-0.6, 0.45, 0.2, 0.75]];
        parts.forEach(function (q, j) {
          var m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(q[3], 0), 0.2, seed + j), cloudMat);
          m.position.set(q[0], q[1], q[2]); m.scale.y = 0.7; g.add(m);
        });
        var base = new THREE.Mesh(flat(new THREE.CylinderGeometry(2.1, 2.1, 0.5, 8)), cloudMat); base.position.y = -0.55; base.scale.z = 0.5; g.add(base);
        g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); clouds.push({ g: g, x: x, sp: 0.18 + seed * 0.02 });
      }
      cloud(-8, 13, -34, 1.8, 1); cloud(9, 17, -44, 2.3, 2); cloud(-1, 21, -58, 2.8, 3); cloud(-20, 18, -50, 2.4, 4); cloud(22, 14, -40, 2.0, 5);

      /* ---------------- mountains & hills ---------------- */
      function mountain(x, z, r, h, col, snow, seed) {
        var g = jitter(new THREE.ConeGeometry(r, h, 7, 3), r * 0.1, seed);
        var m = mesh(g, col, null, false); m.position.set(x, h / 2 - 1, z); m.rotation.y = seed; scene.add(m);
        if (snow) {
          var s = mesh(jitter(new THREE.ConeGeometry(r * 0.32, h * 0.32, 7, 1), r * 0.04, seed + 9), 0xf7f8ff, null, false);
          s.position.set(x, h - 1 - h * 0.16 + 0.05, z); s.rotation.y = seed; scene.add(s);
        }
      }
      mountain(-20, -52, 13, 20, 0x8f9fd0, true, 1); mountain(-2, -60, 17, 27, 0x8495c9, true, 2); mountain(16, -54, 14, 21, 0x96a8d6, true, 3); mountain(32, -48, 11, 14, 0x9db1da, false, 4);
      function hill(x, z, r, sy, col, seed) {
        var m = mesh(jitter(new THREE.IcosahedronGeometry(r, 1), r * 0.06, seed), col, null, false);
        m.position.set(x, -r * sy * 0.25, z); m.scale.set(1, sy, 0.8); scene.add(m); return m;
      }
      hill(-14, -24, 8, 0.55, 0x8cc95a, 21); hill(-3, -27, 9, 0.6, 0x7fbf55, 22); hill(10, -25, 8.5, 0.5, 0x92cf62, 23); hill(22, -22, 7, 0.55, 0x86c45b, 24);
      hill(-24, -18, 7, 0.6, 0x7cbb52, 25);

      /* ---------------- ground + river ---------------- */
      function riverZ(x) { return 0.22 * Math.sin(x * 0.33 + 0.4) - 0.08; }
      function gH(x, z) {
        var d = Math.abs(z - riverZ(x));
        var h = -0.72 * (1 - smooth(1.15, 1.85, d));
        var far = smooth(-5.5, -15, z);
        h += far * (1.0 + 0.8 * Math.sin(x * 0.33 + 1) + 0.45 * Math.sin(x * 0.9));
        h += smooth(4.5, 9, Math.abs(x)) * (z > 2 ? 0.55 : 0.25);
        return h;
      }
      function segDist(px, pz, ax, az, bx, bz) {
        var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
        var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
        var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz);
      }
      function pathD(x, z) {
        return Math.min(segDist(x, z, -3.2, 9, -1.7, 5.2), segDist(x, z, -1.7, 5.2, 0, 2.0),
          segDist(x, z, 0, -2.0, -0.9, -3.4), segDist(x, z, -0.9, -3.4, -2.4, -4.0), segDist(x, z, -0.9, -3.4, 1.6, -5.6));
      }
      var gg = new THREE.PlaneGeometry(46, 36, 58, 46);
      gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -6);
      var gp = gg.attributes.position, i, k;
      for (i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i), y = gH(x, z);
        var dr = Math.abs(z - riverZ(x));
        if (dr > 1.9 && pathD(x, z) > 0.7) y += (hash(Math.round(x * 10), Math.round(z * 10), 3) - 0.5) * 0.1;
        gp.setY(i, y);
      }
      var ground = flat(gg);
      var gpos = ground.attributes.position, gcol = [];
      var C = function (h) { return new THREE.Color(h); };
      var grassA = C(0x8fd05a), grassB = C(0x80c552), grassC = C(0x9bd866), pathA = C(0xe8c98f), pathB = C(0xdcb97c), sandA = C(0xeedaa6), mud = C(0xb79f78);
      for (i = 0; i < gpos.count; i += 3) {
        var cx = (gpos.getX(i) + gpos.getX(i + 1) + gpos.getX(i + 2)) / 3, cz = (gpos.getZ(i) + gpos.getZ(i + 1) + gpos.getZ(i + 2)) / 3, cy = (gpos.getY(i) + gpos.getY(i + 1) + gpos.getY(i + 2)) / 3;
        var dd = Math.abs(cz - riverZ(cx)), c;
        var n = Math.sin(cx * 0.55 + Math.sin(cz * 0.4) * 2) + Math.sin(cz * 0.7 - cx * 0.2);
        if (dd < 1.95 && cy < -0.05) c = cy < -0.45 ? mud : sandA;
        else if (pathD(cx, cz) < 0.55) c = hash(cx, cz, 5) > 0.5 ? pathA : pathB;
        else c = n > 0.9 ? grassC : (n < -0.8 ? grassB : grassA);
        for (k = 0; k < 3; k++) gcol.push(c.r, c.g, c.b);
      }
      ground.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      var groundM = new THREE.Mesh(ground, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad }));
      groundM.receiveShadow = true; scene.add(groundM);
      disposables.push(groundM.material);

      // water (custom shader: bands, glints, foam at the banks, linear fog)
      var wg = new THREE.PlaneGeometry(46, 3.3, 60, 1); wg.rotateX(-Math.PI / 2);
      var wp = wg.attributes.position;
      for (i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) + riverZ(wp.getX(i)));
      var waterMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, fogColor: { value: new THREE.Color(FOG) }, fogNear: { value: 22 }, fogFar: { value: 70 } },
        vertexShader: 'varying vec3 vW; varying float vZ; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vZ = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: [
          'uniform float uTime; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;',
          'varying vec3 vW; varying float vZ;',
          'void main(){',
          '  float rz = 0.22 * sin(vW.x * 0.33 + 0.4) - 0.08;',
          '  float e = abs(vW.z - rz) / 1.65;',
          '  vec3 deep = vec3(0.25, 0.62, 0.84); vec3 sh = vec3(0.45, 0.80, 0.90); vec3 lite = vec3(0.62, 0.89, 0.96);',
          '  vec3 c = mix(deep, sh, step(0.62, e));',
          '  float w = sin(vW.x * 2.6 - uTime * 2.4 + sin(vW.z * 3.1 + uTime * 0.7) * 1.6) * sin(vW.z * 4.3 + vW.x * 0.6 - uTime * 0.9);',
          '  c = mix(c, lite, step(0.42, w) * 0.85);',
          '  float g = step(0.88, w) * step(0.5, fract(sin(floor(vW.x * 4.0) * 12.9898 + floor(vW.z * 4.0) * 78.233) * 43758.5453 + uTime * 0.6));',
          '  c = mix(c, vec3(1.0), g);',
          '  float foam = step(0.86 + 0.05 * sin(vW.x * 5.0 - uTime * 3.0), e);',
          '  c = mix(c, vec3(0.93, 0.98, 1.0), foam);',
          '  c = mix(c, fogColor, smoothstep(fogNear, fogFar, vZ));',
          '  gl_FragColor = vec4(c, 1.0);',
          '}'
        ].join('\n')
      });
      var water = new THREE.Mesh(wg, waterMat);
      water.position.y = -0.36; scene.add(water);

      /* ---------------- props ---------------- */
      function rock(x, z, s, col) {
        var m = mesh(jitter(new THREE.DodecahedronGeometry(s, 0), s * 0.35, x * 3 + z), col || 0xaab3c0);
        m.position.set(x, gH(x, z) + s * 0.3, z); m.scale.y = 0.7; m.rotation.y = x; scene.add(m); return m;
      }
      function pine(x, z, s, dark) {
        var g = new THREE.Group();
        var trunk = mesh(flat(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 5)), 0x8d5a2b); trunk.position.y = 0.27; g.add(trunk);
        var c1 = mesh(jitter(new THREE.ConeGeometry(0.78, 1.15, 7, 1), 0.06, x), dark ? 0x2f8a55 : 0x3a9a5e); c1.position.y = 0.95; g.add(c1);
        var c2 = mesh(jitter(new THREE.ConeGeometry(0.6, 1.0, 7, 1), 0.06, z), dark ? 0x37975c : 0x44a866); c2.position.y = 1.5; c2.rotation.y = 0.4; g.add(c2);
        var c3 = mesh(flat(new THREE.ConeGeometry(0.4, 0.8, 7, 1)), 0x52b872); c3.position.y = 2.0; g.add(c3);
        g.position.set(x, gH(x, z), z); g.scale.setScalar(s); g.rotation.y = x * 1.7; scene.add(g); return g;
      }
      function roundTree(x, z, s, col, blossom) {
        var g = new THREE.Group();
        var trunk = mesh(flat(new THREE.CylinderGeometry(0.1, 0.15, 0.85, 5)), 0x8d5a2b); trunk.position.y = 0.42; g.add(trunk);
        var top = mesh(jitter(new THREE.IcosahedronGeometry(0.72, 0), 0.12, x + z), col); top.position.y = 1.3; g.add(top);
        var top2 = mesh(jitter(new THREE.IcosahedronGeometry(0.48, 0), 0.1, x - z), col); top2.position.set(0.38, 1.66, 0.12); g.add(top2);
        if (blossom) for (var q = 0; q < 6; q++) {
          var b = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), q % 2 ? 0xffffff : 0xff9ab0, null, false);
          var a = q * 1.1; b.position.set(Math.cos(a) * 0.6, 1.25 + (q % 3) * 0.2, Math.sin(a) * 0.6 + 0.15); g.add(b);
        }
        g.position.set(x, gH(x, z), z); g.scale.setScalar(s); scene.add(g); return g;
      }
      function bush(x, z, s, col) {
        var m = mesh(jitter(new THREE.IcosahedronGeometry(0.45, 0), 0.1, x * 7 + z), col || 0x5fb35a);
        m.position.set(x, gH(x, z) + 0.2 * s, z); m.scale.set(s, s * 0.75, s); scene.add(m); return m;
      }
      // far bank trees
      pine(-4.6, -2.7, 1.05); pine(-5.6, -5.4, 1.3, true); pine(-3.6, -7.2, 1.2); pine(4.4, -2.9, 1.1, true); pine(5.8, -5.6, 1.35);
      pine(2.6, -8.4, 1.25, true); pine(-0.8, -9.4, 1.3); pine(-7.6, -8.6, 1.4, true); pine(8.2, -8.8, 1.45); pine(0.9, -11.5, 1.4, true);
      roundTree(3.4, -3.9, 0.95, 0x86cc56, true); roundTree(-6.6, -3.0, 1.0, 0x79c24f);
      // near bank
      pine(-4.3, 4.2, 1.15, true); pine(4.6, 5.6, 1.3); pine(-5.4, 7.2, 1.35);
      roundTree(3.6, 3.0, 0.9, 0x8ed15e, true); roundTree(-3.4, 2.4, 0.85, 0x79c24f);
      bush(-1.6, 2.8, 1.0); bush(2.2, 4.2, 0.9, 0x6cbd5f); bush(-2.6, 6.2, 1.1, 0x58ab52); bush(1.1, -2.6, 0.8); bush(-2.0, -2.3, 0.9, 0x6cbd5f); bush(3.0, -2.4, 0.85, 0x58ab52);
      rock(-1.3, 1.65, 0.24); rock(1.5, 1.75, 0.28, 0x9aa4b2); rock(2.4, 2.0, 0.18); rock(-2.4, 1.85, 0.3); rock(2.1, -1.8, 0.26); rock(-2.8, -1.9, 0.2, 0x9aa4b2);
      rock(-6.5, -0.15, 0.3, 0x9aa4b2); rock(5.8, 0.25, 0.25);
      // flowers (become single bright pixels)
      var flowerCols = [0xff6f8a, 0xffd44a, 0xffffff, 0xb48cf2, 0xff9a4a];
      var fGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
      for (i = 0; i < 70; i++) {
        var fx = (R() - 0.5) * 15, fz = 7.5 - R() * 14;
        if (Math.abs(fz - riverZ(fx)) < 2.1 || pathD(fx, fz) < 0.75 || (Math.abs(fx) < 1 && fz < 3)) continue;
        var f = mesh(fGeo, flowerCols[i % 5], null, false); f.position.set(fx, gH(fx, fz) + 0.07, fz); scene.add(f);
      }
      // foreground grass tufts (chunky, read well at low resolution)
      var tuftGeo = flat(new THREE.ConeGeometry(0.1, 0.32, 4));
      for (i = 0; i < 46; i++) {
        var tx = (R() - 0.5) * 9, tz = 2.6 + R() * 7.5;
        if (pathD(tx, tz) < 0.7) continue;
        var tc = [0x5fae47, 0x6fc052, 0x4f9a3c][i % 3];
        for (var tt = 0; tt < 3; tt++) {
          var tf = mesh(tuftGeo, tc, null, false);
          tf.position.set(tx + (tt - 1) * 0.08, gH(tx, tz) + 0.12, tz + (tt % 2) * 0.05); tf.rotation.z = (tt - 1) * 0.35; scene.add(tf);
        }
      }
      var stump = mesh(flat(new THREE.CylinderGeometry(0.28, 0.33, 0.3, 7)), 0x9a6234); stump.position.set(1.9, gH(1.9, 5.6) + 0.15, 5.6); scene.add(stump);
      var stumpTop = mesh(flat(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 7)), 0xe8c98f, null, false); stumpTop.position.set(1.9, gH(1.9, 5.6) + 0.31, 5.6); scene.add(stumpTop);
      var mush = mesh(flat(new THREE.ConeGeometry(0.14, 0.12, 6)), 0xe8534a, null, false); mush.position.set(2.25, gH(2.25, 5.85) + 0.12, 5.85); scene.add(mush);
      var mushS = mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), 0xfff4dd, null, false); mushS.position.set(2.25, gH(2.25, 5.85) + 0.05, 5.85); scene.add(mushS);
      // lily pads
      for (i = 0; i < 5; i++) {
        var lx = [-3.2, -2.4, 2.6, 3.5, -5.2][i], lz = riverZ(lx) + [0.7, -0.6, 0.6, -0.8, 0.2][i];
        var lily = mesh(flat(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 7)), 0x4fa54a, null, false); lily.position.set(lx, -0.33, lz); scene.add(lily);
        if (i === 1 || i === 3) { var fl = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), 0xff9ab0, null, false); fl.position.set(lx, -0.28, lz); scene.add(fl); }
      }

      /* ---------------- houses ---------------- */
      var smokeSrc = [];
      function house(x, z, rot, wall, roof, s) {
        var g = new THREE.Group();
        var base = mesh(new THREE.BoxGeometry(1.9, 1.25, 1.55), wall); base.position.y = 0.62; g.add(base);
        var stone = mesh(new THREE.BoxGeometry(2.0, 0.22, 1.65), 0xb9a58d); stone.position.y = 0.11; g.add(stone);
        // gabled roof: two slanted slabs (ridge along x)
        var ra = Math.atan2(0.95, 1.18), rl = Math.sqrt(0.95 * 0.95 + 1.18 * 1.18);
        [-1, 1].forEach(function (sd) {
          var slab = mesh(new THREE.BoxGeometry(2.25, 0.13, rl + 0.05), roof);
          slab.position.set(0, 1.22 + 0.475 + 0.06, sd * 0.59); slab.rotation.x = sd * ra; g.add(slab);
        });
        var ridgeB = mesh(new THREE.BoxGeometry(2.3, 0.12, 0.16), roof); ridgeB.position.set(0, 2.2, 0); g.add(ridgeB);
        // wall-coloured gable triangles under the roof
        var gs = new THREE.Shape(); gs.moveTo(-0.78, 0); gs.lineTo(0.78, 0); gs.lineTo(0, 0.68); gs.lineTo(-0.78, 0);
        var ggeo = flat(new THREE.ExtrudeGeometry(gs, { depth: 1.9, bevelEnabled: false })); ggeo.translate(0, 0, -0.95);
        var gable = mesh(ggeo, wall); gable.position.y = 1.24; gable.rotation.y = Math.PI / 2; g.add(gable);
        var ch = mesh(new THREE.BoxGeometry(0.28, 0.65, 0.28), 0xb9a58d); ch.position.set(0.5, 1.95, -0.25); g.add(ch);
        var door = mesh(new THREE.BoxGeometry(0.42, 0.72, 0.06), 0x8d5a2b); door.position.set(-0.4, 0.48, 0.79); g.add(door);
        var knob = mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), 0xffd04a, null, false); knob.position.set(-0.28, 0.48, 0.83); g.add(knob);
        var win = mesh(new THREE.BoxGeometry(0.42, 0.38, 0.06), 0xffe58a, { emissive: 0xffc94a, emissiveIntensity: 0.35 }); win.position.set(0.42, 0.72, 0.79); g.add(win);
        var wf = mesh(new THREE.BoxGeometry(0.05, 0.4, 0.07), 0x8d5a2b, null, false); wf.position.set(0.42, 0.72, 0.8); g.add(wf);
        var box = mesh(new THREE.BoxGeometry(0.5, 0.11, 0.14), 0xc0703a); box.position.set(0.42, 0.48, 0.86); g.add(box);
        for (var q = 0; q < 3; q++) { var fl = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), [0xff6f8a, 0xffd44a, 0xff6f8a][q], null, false); fl.position.set(0.28 + q * 0.14, 0.57, 0.88); g.add(fl); }
        g.position.set(x, gH(x, z), z); g.rotation.y = rot; g.scale.setScalar(s || 1); scene.add(g);
        g.updateMatrixWorld(true);
        smokeSrc.push(new THREE.Vector3(0.5, 2.3, -0.25).applyMatrix4(g.matrixWorld));
        return g;
      }
      house(-2.9, -4.3, 0.35, 0xfbebd2, 0xe05a43, 1.0);
      house(3.3, -6.3, -0.4, 0xf4dfc6, 0x4a86c8, 0.9);
      var smoke = [];
      for (i = 0; i < 4; i++) {
        var sm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
        scene.add(sm); smoke.push(sm);
      }
      // fence on near bank
      for (i = 0; i < 6; i++) {
        var px = -5.6 + i * 0.6, pz = 3.0 + i * 0.05;
        var post = mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), 0xa8743f); post.position.set(px, gH(px, pz) + 0.25, pz); scene.add(post);
      }
      var rail = mesh(new THREE.BoxGeometry(3.2, 0.07, 0.05), 0xc08a52); rail.position.set(-4.1, 0.36, 3.13); rail.rotation.y = -0.08; scene.add(rail);
      // signpost by the path
      var sign = new THREE.Group();
      var sp1 = mesh(new THREE.BoxGeometry(0.09, 0.85, 0.09), 0x8d5a2b); sp1.position.y = 0.42; sign.add(sp1);
      var sb = mesh(new THREE.BoxGeometry(0.62, 0.22, 0.05), 0xe2a866); sb.position.set(0.18, 0.72, 0); sign.add(sb);
      sign.position.set(-1.25, 0, 4.1); sign.rotation.y = -0.5; scene.add(sign);
      // builder's corner: plank pile + crate near Tomé
      var pile = new THREE.Group();
      for (i = 0; i < 3; i++) { var pp = mesh(new THREE.BoxGeometry(1.0, 0.08, 0.28), [0xd39a5a, 0xc98a4b, 0xdba567][i]); pp.position.set(0, 0.05 + i * 0.09, (i - 1) * 0.06); pp.rotation.y = (i - 1) * 0.08; pile.add(pp); }
      var crate = mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), 0xc08a52); crate.position.set(0.75, 0.19, 0.1); pile.add(crate);
      var crateB = mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), 0x8d5a2b); crateB.position.set(0.75, 0.3, 0.1); pile.add(crateB);
      pile.position.set(2.15, 0, 3.1); pile.rotation.y = -0.4; scene.add(pile);

      /* ---------------- bridge (planks along z) ---------------- */
      var bridge = new THREE.Group(); scene.add(bridge);
      var DECK = 0.2, PD = 0.48, PG = 0.06, NPL = 8, MISSING = 4, PW = 1.2;
      var span = NPL * (PD + PG);
      function plankZ(j) { return span / 2 - PD / 2 - j * (PD + PG); }
      [-0.46, 0.46].forEach(function (x) {
        var st = mesh(new THREE.BoxGeometry(0.14, 0.16, span + 0.6), 0x7a4a26); st.position.set(x, DECK - 0.12, 0); bridge.add(st);
      });
      var plankCols = [0xd39a5a, 0xc98a4b, 0xdba567];
      var pGeo = new THREE.BoxGeometry(PW, 0.08, PD);
      for (i = 0; i < NPL; i++) {
        if (i === MISSING) continue;
        var pl = mesh(pGeo, plankCols[i % 3]);
        pl.position.set((hash(i, 1, 1) - 0.5) * 0.06, DECK, plankZ(i));
        pl.rotation.y = (hash(i, 2, 2) - 0.5) * 0.06; bridge.add(pl);
      }
      var endZ = [span / 2 + 0.1, -span / 2 - 0.1, 0];
      endZ.forEach(function (z) {
        [-0.66, 0.66].forEach(function (x) {
          var p = mesh(flat(new THREE.CylinderGeometry(0.08, 0.09, 1.1, 6)), 0x8d5a2b); p.position.set(x, 0.25, z); bridge.add(p);
          var cap = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), 0x7a4a26); cap.position.set(x, 0.82, z); bridge.add(cap);
        });
      });
      [-0.66, 0.66].forEach(function (x) {
        var rl = mesh(new THREE.BoxGeometry(0.08, 0.08, span + 0.3), 0xb27a42); rl.position.set(x, 0.74, 0); bridge.add(rl);
        var rl2 = mesh(new THREE.BoxGeometry(0.05, 0.05, span + 0.3), 0xb27a42); rl2.position.set(x, 0.45, 0); bridge.add(rl2);
      });
      [-0.9, 0.9].forEach(function (z) {
        [-0.46, 0.46].forEach(function (x) { var leg = mesh(flat(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 5)), 0x6e4322); leg.position.set(x, -0.25, z); bridge.add(leg); });
      });
      bridge.position.set(0, 0, riverZ(0));
      var gapZ = bridge.position.z + plankZ(MISSING);

      // highlighted slot (blinking) + the new plank
      var ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PW - 0.04, 0.06, PD - 0.04)), new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 1 }));
      ghost.position.set(0, DECK + 0.02, gapZ); scene.add(ghost);
      var marker = new THREE.Group();
      var mk = new THREE.Mesh(flat(new THREE.ConeGeometry(0.17, 0.3, 4)), T(0xffd04a, { emissive: 0xffb020, emissiveIntensity: 0.45 }));
      mk.rotation.x = Math.PI; marker.add(mk);
      var mkb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), T(0xffd04a, { emissive: 0xffb020, emissiveIntensity: 0.45 }));
      mkb.position.y = 0.2; marker.add(mkb);
      marker.position.set(0, 1.25, gapZ); marker.userData.s = 1.35; scene.add(marker);
      var newPlank = mesh(pGeo, 0xe8b070, { emissive: 0xffc94a, emissiveIntensity: 0 });
      newPlank.position.set(0, DECK, gapZ); scene.add(newPlank);

      /* ---------------- characters ---------------- */
      var SKIN = 0xf6c9a0;
      function limb(w, len, col) { var g = new THREE.Group(); var m = mesh(new THREE.BoxGeometry(w, len, w), col); m.position.y = -len / 2; g.add(m); return g; }
      function eye(x, y, z, g, s) { var e = mesh(new THREE.BoxGeometry(0.07 * (s || 1), 0.1 * (s || 1), 0.04), 0x2b2030, null, false); e.position.set(x, y, z); g.add(e); return e; }

      // hero: big head, blue hoodie, orange backpack
      var hero = new THREE.Group(), heroBody = new THREE.Group(); hero.add(heroBody);
      var hLegL = limb(0.13, 0.32, 0x2d4a86), hLegR = limb(0.13, 0.32, 0x2d4a86);
      hLegL.position.set(-0.09, 0.4, 0); hLegR.position.set(0.09, 0.4, 0);
      [hLegL, hLegR].forEach(function (l) {
        var sh = mesh(new THREE.BoxGeometry(0.15, 0.09, 0.22), 0xffffff); sh.position.set(0, -0.33, 0.035); l.add(sh);
        var so = mesh(new THREE.BoxGeometry(0.155, 0.035, 0.225), 0xff8a3d, null, false); so.position.set(0, -0.37, 0.035); l.add(so);
        heroBody.add(l);
      });
      var hTorso = mesh(new THREE.BoxGeometry(0.42, 0.4, 0.3), 0x3b7be0); hTorso.position.y = 0.6; heroBody.add(hTorso);
      var hHem = mesh(new THREE.BoxGeometry(0.44, 0.07, 0.32), 0x2856a8); hHem.position.y = 0.42; heroBody.add(hHem);
      var hPocket = mesh(new THREE.BoxGeometry(0.22, 0.1, 0.03), 0x2856a8, null, false); hPocket.position.set(0, 0.52, 0.16); heroBody.add(hPocket);
      var pack = mesh(new THREE.BoxGeometry(0.38, 0.42, 0.2), 0xff8a3d); pack.position.set(0, 0.64, -0.24); heroBody.add(pack);
      var flap = mesh(new THREE.BoxGeometry(0.39, 0.14, 0.22), 0xd9661f); flap.position.set(0, 0.8, -0.24); heroBody.add(flap);
      var pkt = mesh(new THREE.BoxGeometry(0.24, 0.13, 0.06), 0xd9661f, null, false); pkt.position.set(0, 0.54, -0.36); heroBody.add(pkt);
      var buckle = mesh(new THREE.BoxGeometry(0.07, 0.06, 0.03), 0xffd04a, null, false); buckle.position.set(0, 0.74, -0.355); heroBody.add(buckle);
      [-0.13, 0.13].forEach(function (x) { var st = mesh(new THREE.BoxGeometry(0.05, 0.36, 0.03), 0xd9661f, null, false); st.position.set(x, 0.64, 0.16); heroBody.add(st); });
      var hArmL = limb(0.11, 0.32, 0x3b7be0), hArmR = limb(0.11, 0.32, 0x3b7be0);
      hArmL.position.set(-0.27, 0.78, 0); hArmR.position.set(0.27, 0.78, 0);
      [hArmL, hArmR].forEach(function (a) { var hd = mesh(new THREE.BoxGeometry(0.11, 0.1, 0.11), SKIN); hd.position.y = -0.36; a.add(hd); heroBody.add(a); });
      var hHead = new THREE.Group(); hHead.position.y = 1.1; heroBody.add(hHead);
      hHead.add(mesh(jitter(new THREE.IcosahedronGeometry(0.3, 1), 0.0, 0), SKIN));
      var hair = mesh(jitter(new THREE.SphereGeometry(0.325, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), 0.03, 4), 0x6b3f22); hair.position.set(0, 0.02, -0.03); hair.rotation.x = -0.32; hHead.add(hair);
      var bangs = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.12), 0x6b3f22); bangs.position.set(0.02, 0.2, 0.2); bangs.rotation.z = -0.15; bangs.rotation.x = 0.3; hHead.add(bangs);
      var cow = mesh(new THREE.ConeGeometry(0.06, 0.2, 4), 0x6b3f22); cow.position.set(0.04, 0.36, -0.02); cow.rotation.z = -0.5; hHead.add(cow);
      var hEyeL = eye(-0.1, 0.0, 0.28, hHead), hEyeR = eye(0.1, 0.0, 0.28, hHead);
      [-0.17, 0.17].forEach(function (x) { var ck = mesh(new THREE.BoxGeometry(0.08, 0.04, 0.03), 0xf08a7a, null, false); ck.position.set(x, -0.08, 0.26); hHead.add(ck); });
      var mouth = mesh(new THREE.BoxGeometry(0.09, 0.035, 0.03), 0xa8483a, null, false); mouth.position.set(0, -0.11, 0.285); hHead.add(mouth);
      scene.add(hero);

      // Mestre Tomé: stocky, white beard, yellow hard hat, brown apron
      var tome = new THREE.Group(), tBody = new THREE.Group(); tome.add(tBody);
      var tLegL = limb(0.16, 0.36, 0x4f5f7a), tLegR = limb(0.16, 0.36, 0x4f5f7a);
      tLegL.position.set(-0.12, 0.44, 0); tLegR.position.set(0.12, 0.44, 0);
      [tLegL, tLegR].forEach(function (l) { var bt = mesh(new THREE.BoxGeometry(0.19, 0.11, 0.27), 0x5a3720); bt.position.set(0, -0.36, 0.04); l.add(bt); tBody.add(l); });
      var tTorso = mesh(flat(new THREE.CylinderGeometry(0.3, 0.33, 0.56, 7)), 0xd2553f); tTorso.position.y = 0.72; tBody.add(tTorso);
      var apron = mesh(new THREE.BoxGeometry(0.42, 0.56, 0.05), 0x9a6234); apron.position.set(0, 0.64, 0.31); tBody.add(apron);
      var apPkt = mesh(new THREE.BoxGeometry(0.28, 0.13, 0.03), 0x7a4a26, null, false); apPkt.position.set(0, 0.55, 0.345); tBody.add(apPkt);
      var pencil = mesh(new THREE.BoxGeometry(0.04, 0.16, 0.03), 0xffd04a, null, false); pencil.position.set(0.08, 0.64, 0.35); pencil.rotation.z = 0.25; tBody.add(pencil);
      var strap = mesh(new THREE.BoxGeometry(0.62, 0.05, 0.62), 0x7a4a26, null, false); strap.position.y = 0.62; strap.scale.z = 0.95; tBody.add(strap);
      var tArmL = limb(0.14, 0.4, 0xd2553f), tArmR = limb(0.14, 0.4, 0xd2553f);
      tArmL.position.set(-0.38, 0.95, 0); tArmR.position.set(0.38, 0.95, 0);
      [tArmL, tArmR].forEach(function (a) { var hd = mesh(new THREE.BoxGeometry(0.14, 0.13, 0.14), SKIN); hd.position.y = -0.45; a.add(hd); tBody.add(a); });
      var roll = mesh(flat(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6)), 0x6fb2e8); roll.rotation.x = Math.PI / 2; roll.position.set(0, -0.42, 0.05); tArmR.add(roll);
      var tHead = new THREE.Group(); tHead.position.y = 1.27; tBody.add(tHead);
      tHead.add(mesh(jitter(new THREE.IcosahedronGeometry(0.29, 1), 0.0, 0), SKIN));
      var beard = mesh(jitter(new THREE.IcosahedronGeometry(0.26, 0), 0.05, 11), 0xf6f6f2); beard.position.set(0, -0.17, 0.11); beard.scale.set(1.05, 1.05, 0.85); tHead.add(beard);
      var must = mesh(new THREE.BoxGeometry(0.26, 0.07, 0.07), 0xffffff, null, false); must.position.set(0, -0.06, 0.27); tHead.add(must);
      var tNose = mesh(new THREE.BoxGeometry(0.1, 0.09, 0.08), 0xec9f7e, null, false); tNose.position.set(0, 0.01, 0.3); tHead.add(tNose);
      eye(-0.1, 0.07, 0.27, tHead, 1.05); eye(0.1, 0.07, 0.27, tHead, 1.05);
      [-0.1, 0.1].forEach(function (x) { var br = mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), 0xf6f6f2, null, false); br.position.set(x, 0.17, 0.26); br.rotation.z = -x * 1.5; tHead.add(br); });
      var hat = mesh(jitter(new THREE.SphereGeometry(0.29, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0.0, 0), 0xffcf3a); hat.position.set(0, 0.17, -0.04); tHead.add(hat);
      var brim = mesh(flat(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 8)), 0xf2a51f); brim.position.set(0, 0.18, -0.02); brim.scale.set(1, 1, 0.92); tHead.add(brim);
      var ridge = mesh(new THREE.BoxGeometry(0.08, 0.07, 0.52), 0xf2a51f, null, false); ridge.position.y = 0.45; tHead.add(ridge);
      tome.position.set(1.5, 0, 2.7); tome.rotation.y = -0.4; scene.add(tome);

      // butterflies (tiny, just a couple of pixels)
      var flies = [];
      for (i = 0; i < 2; i++) {
        var bf = new THREE.Group();
        var wl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), new THREE.MeshBasicMaterial({ color: i ? 0xffffff : 0xffd04a, side: THREE.DoubleSide }));
        var wr = wl.clone(); wl.position.x = -0.06; wr.position.x = 0.06; bf.add(wl); bf.add(wr);
        scene.add(bf); flies.push({ g: bf, l: wl, r: wr, k: i });
      }

      /* ---------------- FX: pixel sparkles + dust ---------------- */
      function pixTex(rows, cols) {
        var c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
        var g = c.getContext('2d');
        for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) { var ch = rows[y][x]; if (cols[ch]) { g.fillStyle = cols[ch]; g.fillRect(x, y, 1, 1); } }
        var t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
      }
      var starTex = pixTex(['..y..', '..y..', 'yywyy', '..y..', '..y..'], { y: '#ffd04a', w: '#ffffff' });
      var NS = 14, starPos = new Float32Array(NS * 3), starSeed = [];
      for (i = 0; i < NS; i++) starSeed.push({ a: (i / NS) * Math.PI * 2 + hash(i, 3, 3) * 0.5, up: 0.5 + hash(i, 4, 4) * 0.9, r: 0.5 + hash(i, 5, 5) * 0.7 });
      var starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      var starMat = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, map: starTex, transparent: true, alphaTest: 0.5, depthWrite: false });
      var stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; scene.add(stars);
      var ND = 16, dustPos = new Float32Array(ND * 3), dustSeed = [];
      for (i = 0; i < ND; i++) dustSeed.push({ a: (i / ND) * Math.PI * 2, s: 0.6 + hash(i, 7, 7) * 0.6 });
      var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      var dustMat = new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, color: 0xf6e6c4, transparent: true, depthWrite: false });
      var dusts = new THREE.Points(dustGeo, dustMat); dusts.frustumCulled = false; scene.add(dusts);
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 8), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, DECK + 0.07, gapZ); scene.add(ring);
      disposables.push(starTex, grad);

      /* ---------------- HUD (high resolution DOM) ---------------- */
      var style = document.createElement('style'); style.textContent = CSS; host.appendChild(style);
      var hud = document.createElement('div'); hud.className = P + 'hud';
      hud.innerHTML =
        '<div class="' + P + 'top ' + P + 'card"><div class="' + P + 'ava"></div><div class="' + P + 'info">' +
          '<div class="' + P + 'row"><div class="' + P + 'lvl">Nível 4 · Explorador</div></div>' +
          '<div class="' + P + 'bar"><div class="' + P + 'fill"></div><div class="' + P + 'gain"></div></div>' +
          '<div class="' + P + 'row" style="margin-top:.28em"><span class="' + P + 'xpt ' + P + 'xps">XP</span><span class="' + P + 'xpt ' + P + 'xpn">620 / 1000</span></div>' +
        '</div></div>' +
        '<div class="' + P + 'quest ' + P + 'card"><div class="' + P + 'qi"></div><span><small>Missão</small>Consertar a ponte da vila</span></div>' +
        '<div class="' + P + 'bub ' + P + 'card"><div class="' + P + 'name">Mestre Tomé</div><div class="' + P + 'say">A viga precisa se apoiar dos dois lados!</div><div class="' + P + 'nx"></div>' +
          '<svg class="' + P + 'tail" viewBox="0 0 30 20"><path d="M0 1 L30 1 L12 19 Z" fill="#fff4dd"/><path d="M0 1.6 L12 19 L30 1.6" fill="none" stroke="#3b2a2f" stroke-width="3.6" stroke-linejoin="round"/></svg></div>' +
        '<div class="' + P + 'xp">+50 XP</div>' +
        '<div class="' + P + 'btns">' +
          '<div class="' + P + 'btn ' + P + 'card main"><div class="' + P + 'bi" style="background:#fff4dd"></div>Construir</div>' +
          '<div class="' + P + 'btn ' + P + 'card"><div class="' + P + 'bi" style="background:#ffe1c4"></div>Mochila</div>' +
          '<div class="' + P + 'btn ' + P + 'card"><div class="' + P + 'bi" style="background:#d6f0f8"></div>Mapa</div>' +
        '</div>';
      host.appendChild(hud);
      function q(sel) { return hud.querySelector('.' + P + sel); }
      q('ava').appendChild(iconCanvas('avatar'));
      q('qi').appendChild(iconCanvas('bridge'));
      q('xps').insertBefore(iconCanvas('star'), q('xps').firstChild);
      q('name').insertBefore(iconCanvas('helmet'), q('name').firstChild);
      q('xp').insertBefore(iconCanvas('star'), q('xp').firstChild);
      var bis = hud.querySelectorAll('.' + P + 'bi');
      bis[0].appendChild(iconCanvas('hammer')); bis[1].appendChild(iconCanvas('bag')); bis[2].appendChild(iconCanvas('map'));
      var nx = iconCanvas('next', P + 'next'); q('nx').appendChild(nx);
      var elBtns = q('btns');
      var elFill = q('fill'), elGain = q('gain'), elXpn = q('xpn'), elBub = q('bub'), elXp = q('xp'), elQuest = q('quest');

      /* ---------------- layout ---------------- */
      var SCALE = 3, RW = 130, RH = 281, CW = 390, CH = 844;
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        SCALE = Math.max(2, Math.round(W / 132));
        RW = Math.ceil(W / SCALE); RH = Math.ceil(H / SCALE);
        CW = RW * SCALE; CH = RH * SCALE;
        renderer.setSize(RW, RH, false);
        cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
        cv.style.left = Math.floor((W - CW) / 2) + 'px'; cv.style.top = Math.floor((H - CH) / 2) + 'px';
        rt.setSize(RW, RH);
        postMat.uniforms.res.value.set(RW, RH);
        camera.aspect = RW / RH;
        // keep ~5.6 world units visible across at the focus distance
        var dist = 7.6, halfW = 3.3;
        var vf = 2 * Math.atan(halfW / dist / camera.aspect) * 180 / Math.PI;
        camera.fov = clamp(vf, 40, 78);
        camera.setViewOffset(RW, RH, 0, -Math.round(RH * 0.07), RW, RH);
        camera.updateProjectionMatrix();
        var base = clamp(Math.min(W / 390, H / 720), 0.78, 1.5);
        hud.style.fontSize = (15 * base) + 'px';
      }
      layout();
      var ro = new ResizeObserver(function () { layout(); });
      ro.observe(host);

      /* ---------------- animation ---------------- */
      var HERO_A = new THREE.Vector3(-1.45, 0, 5.7), HERO_B = new THREE.Vector3(-0.3, 0, 2.85);
      var OFF = new THREE.Vector3(1.3, 4.1, 6.1);
      var look = new THREE.Vector3(), v3 = new THREE.Vector3();
      var cvLeft = 0, cvTop = 0;
      function proj(v) { v3.copy(v).project(camera); return { x: cvLeft + (v3.x + 1) / 2 * CW, y: cvTop + (1 - v3.y) / 2 * CH }; }
      var walkDir = Math.atan2(HERO_B.x - HERO_A.x, HERO_B.z - HERO_A.z);

      function update(t, wall) {
        var s = t >= 3.32 ? 0 : t; // story time (reset while the dither fade covers the screen)
        var fo = t < 3.32 ? smooth(3.0, 3.3, t) : 1 - smooth(3.34, 3.6, t);
        postMat.uniforms.uFade.value = fo * 1.02;

        // hero walk (limb pose stepped at 12 fps for a pixel-art feel)
        var wp = clamp(s / 1.25, 0, 1), ep = wp * (2 - wp);
        hero.position.lerpVectors(HERO_A, HERO_B, ep);
        var walk = 1 - smooth(1.0, 1.25, s);
        var sq = Math.floor(s * 12) / 12;
        var ph = sq * Math.PI * 2 * 2.0;
        var sw = Math.sin(ph) * 0.75 * walk;
        hLegL.rotation.x = sw; hLegR.rotation.x = -sw;
        hArmL.rotation.x = -sw * 0.9; hArmR.rotation.x = sw * 0.9;
        hArmL.rotation.z = -0.1; hArmR.rotation.z = 0.1;
        heroBody.position.y = Math.abs(Math.cos(ph)) * 0.07 * walk;
        // turn towards Tomé, then towards the camera to celebrate
        var faceTome = 1.25, faceCam = 0.35;
        var cheer = smooth(2.3, 2.45, s) * (1 - smooth(2.95, 3.15, s));
        hero.rotation.y = lerp(lerp(walkDir, faceTome, smooth(1.0, 1.4, s)), faceCam, smooth(2.2, 2.45, s));
        hHead.rotation.x = 0.12 * smooth(1.5, 1.8, s) * (1 - smooth(2.1, 2.3, s));
        hHead.rotation.y = -0.4 * smooth(1.55, 1.85, s) * (1 - smooth(2.15, 2.35, s));
        hArmL.rotation.x -= cheer * 2.7; hArmR.rotation.x -= cheer * 2.7;
        hArmL.rotation.z -= cheer * 0.35; hArmR.rotation.z += cheer * 0.35;
        var hop = s > 2.35 && s < 2.95 ? Math.abs(Math.sin((s - 2.35) / 0.3 * Math.PI)) : 0;
        heroBody.position.y += hop * 0.22;
        var blink = ((wall % 2.9) < 0.1) ? 0.2 : 1; hEyeL.scale.y = hEyeR.scale.y = blink;

        // mentor
        var talk = smooth(0.7, 0.95, s) * (1 - smooth(2.1, 2.35, s));
        tBody.position.y = Math.floor(Math.sin(wall * 2.2) * 2) * 0.01;
        tArmL.rotation.x = -talk * (1.5 + Math.sin(Math.floor(s * 10) / 10 * 9) * 0.2);
        tArmL.rotation.z = -talk * 0.45;
        var thumbs = smooth(2.35, 2.5, s) * (1 - smooth(3.0, 3.2, s));
        tArmR.rotation.x = -0.15 - thumbs * 2.4; tArmR.rotation.z = 0.1 + thumbs * 0.2;
        tHead.rotation.x = -0.22 + Math.sin(Math.floor(s * 10) / 10 * 12) * 0.07 * talk;
        tHead.rotation.y = -0.25 * talk;

        // plank drop: 1.6 → 2.25
        var land = clamp((s - 1.6) / 0.62, 0, 1);
        ghost.visible = s < 1.7 && Math.floor(wall * 5) % 3 !== 2;
        marker.visible = s < 1.55;
        marker.position.y = 0.72 + Math.floor((0.5 + 0.5 * Math.sin(wall * 6)) * 4) * 0.05;
        marker.rotation.y = Math.floor(wall * 8) * 0.39;
        var mks = 1 - smooth(1.35, 1.55, s); marker.scale.setScalar(Math.max(mks * 1.35, 0.001));
        newPlank.visible = s >= 1.55;
        newPlank.position.y = DECK + (1 - easeOutBack(land)) * 2.6;
        var spin = 1 - smooth(1.6, 2.15, s);
        newPlank.rotation.y = spin * 1.6; newPlank.rotation.x = spin * 0.4;
        var glow = smooth(1.55, 1.8, s) * (1 - smooth(2.4, 2.95, s));
        newPlank.material.emissiveIntensity = glow * (0.55 + 0.25 * (Math.floor(wall * 8) % 2));
        var bump = s > 2.2 && s < 2.4 ? Math.sin((s - 2.2) / 0.2 * Math.PI) : 0;
        newPlank.scale.set(1 + bump * 0.06, 1 - bump * 0.35, 1);

        // impact fx
        var T0 = 2.2, fx = clamp((s - T0) / 0.75, 0, 1), on = s > T0 && s < T0 + 0.75;
        var e = 1 - Math.pow(1 - fx, 3);
        for (var j = 0; j < NS; j++) {
          var u = starSeed[j];
          if (!on || (j % 3 === 0 && fx > 0.7)) { starPos[j * 3 + 1] = -50; continue; }
          starPos[j * 3] = Math.cos(u.a) * u.r * e * 1.1;
          starPos[j * 3 + 1] = DECK + 0.1 + u.up * e - fx * fx * 0.6;
          starPos[j * 3 + 2] = gapZ + Math.sin(u.a) * u.r * e * 0.8;
        }
        starGeo.attributes.position.needsUpdate = true;
        starMat.opacity = on ? 1 - smooth(0.75, 1, fx) : 0;
        var dk = clamp((s - T0) / 0.6, 0, 1), don = s > T0 && s < T0 + 0.6;
        for (j = 0; j < ND; j++) {
          var dsd = dustSeed[j];
          if (!don) { dustPos[j * 3 + 1] = -50; continue; }
          dustPos[j * 3] = Math.cos(dsd.a) * (0.55 + dk * 0.7 * dsd.s);
          dustPos[j * 3 + 1] = DECK + 0.03 + dk * 0.3 * dsd.s - dk * dk * 0.2;
          dustPos[j * 3 + 2] = gapZ + Math.sin(dsd.a) * (0.2 + dk * 0.5 * dsd.s);
        }
        dustGeo.attributes.position.needsUpdate = true;
        dustMat.opacity = don ? 1 - dk : 0;
        var rk = clamp((s - T0) / 0.5, 0, 1);
        ring.material.opacity = s > T0 && s < T0 + 0.5 ? (rk < 0.5 ? 0.95 : 0.5) : 0;
        ring.scale.setScalar(1 + rk * 1.6);

        // camera: 3rd person, follows the hero, gentle dolly/sway
        var cu = reduce ? 0.5 : 1;
        var lk = lerp(0.36, 0.55, smooth(0, 1.3, s));
        look.set(lerp(hero.position.x, 0.25, lk), 0.5, lerp(hero.position.z, gapZ, lk));
        var dolly = reduce ? 0 : smooth(0, 3.0, s) * 0.5;
        camera.position.set(look.x + OFF.x - dolly * 0.5 + Math.sin(wall * 0.6) * 0.06 * cu, look.y + OFF.y - dolly * 0.25 + Math.sin(wall * 0.9) * 0.04 * cu, look.z + OFF.z - dolly);
        camera.lookAt(look.x, look.y, look.z);

        // ambient life (wall time: continuous, never jumps)
        waterMat.uniforms.uTime.value = wall;
        clouds.forEach(function (c, j) { c.g.position.x = c.x + ((wall * c.sp + 30) % 60) - 30; });
        smoke.forEach(function (p, j) {
          var src = smokeSrc[j % smokeSrc.length];
          var kk = ((wall * 0.4 + j / 2) % 1);
          p.position.set(src.x + kk * 0.45, src.y + kk * 1.4, src.z);
          p.scale.setScalar(0.6 + kk * 1.3); p.material.opacity = 0.85 * (1 - kk);
        });
        flies.forEach(function (f) {
          var a = wall * (0.7 + f.k * 0.2) + f.k * 3;
          f.g.position.set(-2.3 + f.k * 4.6 + Math.sin(a) * 0.8, 0.7 + Math.sin(a * 2.3) * 0.2, 3.6 - f.k * 1.2 + Math.cos(a) * 0.6);
          var fl = Math.floor(wall * 14) % 2 ? 0.2 : 1.2;
          f.l.rotation.y = fl; f.r.rotation.y = -fl;
          f.g.rotation.y = a;
        });

        // HUD
        var xpK = smooth(2.45, 2.9, t) * (1 - smooth(3.08, 3.5, t)); // eases back under the dither fade so the loop closes
        elFill.style.width = (62 + 5 * xpK) + '%';
        elGain.style.left = (62 + 5 * xpK) + '%';
        elGain.style.width = (s > 2.4 && s < 2.75 ? 2 : 0) + '%';
        elXpn.textContent = Math.round(620 + 50 * xpK) + ' / 1000';
        var bIn = clamp((s - 0.8) / 0.28, 0, 1), bOut = smooth(2.2, 2.38, s);
        var bsc = (bIn > 0 ? Math.min(1.025, 1 + 2.2 * Math.pow(bIn - 1, 3) + 1.2 * Math.pow(bIn - 1, 2)) : 0) * (1 - bOut * 0.3);
        camera.updateMatrixWorld();
        var head = proj(v3.set(tome.position.x, 0.2, tome.position.z));
        var bw = elBub.offsetWidth || 210, bh = elBub.offsetHeight || 90;
        var bl = elBub.offsetLeft;
        var bt = elBtns.offsetTop - bh - 16;
        elBub.style.setProperty('--tx', clamp(head.x - bl, 30, bw - 30).toFixed(1) + 'px');
        elBub.style.transform = 'translateY(' + bt.toFixed(1) + 'px) scale(' + Math.max(bsc, 0.001).toFixed(3) + ')';
        nx.style.transform = 'translateY(' + (Math.floor(wall * 3) % 2 ? 2 : 0) + 'px)';
        elBub.style.opacity = (Math.min(1, bIn * 2) * (1 - bOut)).toFixed(3);
        var xk = clamp((s - 2.4) / 0.65, 0, 1);
        var xpPos = proj(v3.set(0, 1.0, gapZ));
        elXp.style.opacity = s > 2.4 ? (xk < 0.12 ? xk / 0.12 : 1 - smooth(0.6, 1, xk)).toFixed(3) : '0';
        elXp.style.left = xpPos.x + 'px';
        elXp.style.top = (xpPos.y - 80 * (1 - Math.pow(1 - xk, 2))) + 'px';
        elXp.style.transform = 'translate(-50%,-50%) scale(' + (0.7 + 0.45 * Math.min(1, xk * 5) - 0.1 * xk).toFixed(3) + ')';
      }

      var raf = 0, start = performance.now();
      function frame() {
        raf = requestAnimationFrame(frame);
        var el = (performance.now() - start) / 1000;
        var forced = typeof window.__sceneTime === 'number';
        var t = forced ? window.__sceneTime % LOOP : el % LOOP;
        cvLeft = parseFloat(cv.style.left) || 0; cvTop = parseFloat(cv.style.top) || 0;
        update(t, forced ? window.__sceneTime : el);
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCam);
      }
      frame();

      return {
        destroy: function () {
          cancelAnimationFrame(raf);
          ro.disconnect();
          [scene, postScene].forEach(function (sc2) {
            sc2.traverse(function (o) {
              if (o.geometry) o.geometry.dispose();
              if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }
            });
          });
          for (var key in mats) mats[key].dispose();
          disposables.forEach(function (d) { d.dispose(); });
          rt.depthTexture.dispose(); rt.dispose();
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
