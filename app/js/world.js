/* KidsSchooling — Vila do Riacho: terreno, riacho, ponte quebrada (com encaixes da construção),
   casas, árvores, céu e grade de navegação (caminho + colisão simples). Baseado em combinado.js. */
(function () {
  'use strict';
  var KS = window.KS = window.KS || {};
  var u = KS.u, clamp = u.clamp, sstep = u.sstep;

  var AZ = 35 * Math.PI / 180;
  var RX = Math.cos(AZ), RZ = -Math.sin(AZ), FX = -Math.sin(AZ), FZ = -Math.cos(AZ);
  function uv2w(a, b) { return { x: RX * a + FX * b, z: RZ * a + FZ * b }; }
  function riverZ(x) { return 0.32 * Math.sin(x * 0.33) - 0.12 * Math.sin(x * 0.9); }
  function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }
  var PATHS = [
    [[0.8, 9.5], [0.5, 6.2], [0.15, 4.2], [0, 2.9]],
    [[0.15, 4.2], [1.05, 3.75]],
    [[0, -2.8], [0, -3.1], [1.5, -3.7], [2.7, -4.3]],
    [[0, -3.1], [-1.5, -4.3], [-2.4, -5.0]],
    [[0.5, 6.2], [-1.3, 5.2], [-2.2, 4.4]]
  ];
  function pathD(x, z) {
    var d = 99;
    for (var p = 0; p < PATHS.length; p++) { var P = PATHS[p]; for (var i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); }
    return d;
  }

  /* medidas da ponte (1 unidade = 1 m de jogo) */
  var B = KS.BRIDGE = {
    TILE_W: 1.3, TILE_H: 0.2, TILE_D: 0.4, TILE_Y: 0.26, STR_Y: 0.02, STR_H: 0.28, STR_W: 0.26, STR_X: 0.5,
    DECK_TOP: 0.36, JOINT: 1.08, PIER_W: 1.45, PIER_D: 0.4, PIER_Y0: -0.78, PIER_Y1: -0.12, END: 2.55
  };
  var WATER_Y = -0.3;

  KS.buildWorld = function (scene, K) {
    var W = {};
    var R = u.rng(20261108);
    var M = K.M, block = K.block, mesh = K.mesh, ball = K.ball, G = K.G, rbox = K.rbox;
    var dummy = new THREE.Object3D(), tmpC = new THREE.Color();
    var PINS = [], BOWS = [];
    function addPin(x, y, z, col, ry) { PINS.push({ x: x, y: y + 0.025, z: z, ry: ry || 0, sx: 1, sy: 1, sz: 1, c: col }); }
    function addBow(x, y, z, ry, col, s) { BOWS.push({ x: x, y: y, z: z, ry: ry, sx: s || 1, sy: s || 1, sz: 1, c: col }); }
    function instanced(geo, mat, list, shadow) {
      var im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
      for (var k = 0; k < list.length; k++) {
        var L = list[k];
        dummy.position.set(L.x, L.y, L.z); dummy.rotation.set(L.rx || 0, L.ry || 0, L.rz || 0); dummy.scale.set(L.sx, L.sy, L.sz); dummy.updateMatrix();
        im.setMatrixAt(k, dummy.matrix);
        if (L.c !== undefined) im.setColorAt(k, tmpC.set(L.c));
      }
      im.count = list.length;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      if (shadow) { im.castShadow = true; im.receiveShadow = true; }
      scene.add(im); return im;
    }
    function groundY(x, z) { var d = Math.abs(z - riverZ(x)); return -0.62 * (1 - sstep(1.25, 2.05, d)); }
    W.riverZ = riverZ; W.groundY = groundY; W.uv2w = uv2w;

    /* ----- céu (domo com degradê; só aparece com câmera baixa) ----- */
    var skyU = { uTop: { value: new THREE.Color(0x9fd4ff) }, uMid: { value: new THREE.Color(0xd9efd0) }, uBot: { value: new THREE.Color(0xd9efd0) }, uSun: { value: new THREE.Vector3(0, 0.2, -1).normalize() }, uSunCol: { value: new THREE.Color(0xfff2c8) }, uSunStr: { value: 0.0 } };
    var sky = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 14), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uSunStr; varying vec3 vD;' +
        'void main(){ float h = vD.y; vec3 c = h > 0.0 ? mix(uMid, uTop, smoothstep(0.0, 0.55, h)) : mix(uMid, uBot, smoothstep(0.0, -0.2, h));' +
        ' float s = max(dot(normalize(vD), normalize(uSun)), 0.0); c += uSunCol * (pow(s, 40.0) * 1.2 + pow(s, 6.0) * 0.35) * uSunStr; gl_FragColor = vec4(c, 1.0); }'
    }));
    sky.renderOrder = -10; scene.add(sky);
    W.sky = sky; W.skyU = skyU;

    /* ----- chão com cores por vértice ----- */
    var GS = 46, GN = 124;
    var gg = new THREE.PlaneGeometry(GS, GS, GN, GN);
    gg.rotateX(-Math.PI / 2);
    var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
    var cGrA = new THREE.Color(0x86cf5c), cGrB = new THREE.Color(0x6bbd4c), cGrC = new THREE.Color(0x9bd162), cPath = new THREE.Color(0xe6c68c), cPathE = new THREE.Color(0xd0a96c), cSand = new THREE.Color(0xe8d29a), cBed = new THREE.Color(0x3fa5a8), cWet = new THREE.Color(0xc9b17a), cStone = new THREE.Color(0xd8ccb4);
    var i;
    for (i = 0; i < gp.count; i++) {
      var x = gp.getX(i), z = gp.getZ(i);
      var d = Math.abs(z - riverZ(x));
      var y = -0.62 * (1 - sstep(1.25, 2.05, d));
      y += 0.05 * Math.sin(x * 0.8 + z * 0.5) * sstep(2.3, 3.2, d);
      var pd = pathD(x, z);
      if (pd < 0.7) y -= 0.02 * (1 - sstep(0.3, 0.7, pd));
      var far = Math.max(Math.abs(x), Math.abs(z));
      y -= 0.4 * sstep(17, 23, far);
      gp.setY(i, y);
      var nz = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.35) * Math.cos(z * 0.42 - x * 0.2);
      c.copy(cGrA).lerp(cGrB, nz);
      var n2 = 0.5 + 0.5 * Math.sin(x * 1.3 - z * 0.9 + 1.0);
      c.lerp(cGrC, sstep(0.75, 1, n2) * 0.6);
      if (pd < 0.78) { c.lerp(cPathE, 1 - sstep(0.55, 0.78, pd)); c.lerp(cPath, 1 - sstep(0.3, 0.56, pd)); }
      // pátio de pedra em volta do Guardião
      var gd = Math.sqrt(x * x + (z + 4.15) * (z + 4.15));
      if (gd < 1.6) c.lerp(cStone, (1 - sstep(1.2, 1.6, gd)) * (0.75 + 0.25 * Math.sin(x * 7) * Math.sin(z * 7)));
      if (d < 2.25) c.lerp(cSand, 1 - sstep(1.85, 2.25, d));
      if (d < 1.75) c.lerp(cWet, 1 - sstep(1.45, 1.75, d));
      if (d < 1.5) c.lerp(cBed, 1 - sstep(1.0, 1.5, d));
      gcol.push(c.r, c.g, c.b);
    }
    gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
    gg.computeVertexNormals();
    var ground = new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 }));
    ground.receiveShadow = true; scene.add(ground);
    W.ground = ground;
    // chão distante (some na névoa, para o horizonte da câmera baixa)
    var farG = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), M(0x79c257, { roughness: 1 }));
    farG.rotation.x = -Math.PI / 2; farG.position.y = -0.42; scene.add(farG);
    // colinas distantes
    var HILL = [];
    for (i = 0; i < 18; i++) {
      var an = i / 18 * Math.PI * 2 + R() * 0.2, rr = 27 + R() * 9;
      HILL.push({ x: Math.cos(an) * rr, y: -0.6, z: Math.sin(an) * rr, sx: 5 + R() * 4, sy: 2 + R() * 2.5, sz: 4 + R() * 3, c: [0x6fb653, 0x5ea94b, 0x84c463][i % 3] });
    }
    instanced(K.gSphLo, M(0xffffff, { roughness: 1 }), HILL, false);

    /* ----- água com brilho ----- */
    function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
    var waterBaseT = new THREE.CanvasTexture(mkCanvas(4, 128, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#bff3ee'); gr.addColorStop(0.08, '#7fdbe0'); gr.addColorStop(0.3, '#3fb4dc'); gr.addColorStop(0.5, '#2e9ad6'); gr.addColorStop(0.7, '#3fb4dc'); gr.addColorStop(0.92, '#7fdbe0'); gr.addColorStop(1, '#bff3ee');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }));
    var glintC = mkCanvas(256, 128, function (g, w, h) {
      g.lineCap = 'round'; var rr2 = u.rng(7);
      for (var k = 0; k < 22; k++) {
        var lx = rr2() * w, ly = 14 + rr2() * (h - 28), ll = 10 + rr2() * 34;
        g.strokeStyle = 'rgba(255,255,255,' + (0.55 + rr2() * 0.4) + ')'; g.lineWidth = 2 + rr2() * 2.5;
        for (var o = -1; o <= 1; o++) { g.beginPath(); g.moveTo(lx + o * w, ly); g.lineTo(lx + ll + o * w, ly); g.stroke(); }
      }
    });
    var glintT = new THREE.CanvasTexture(glintC); glintT.wrapS = glintT.wrapT = THREE.RepeatWrapping;
    var glintT2 = glintT.clone(); glintT2.needsUpdate = true; glintT2.wrapS = glintT2.wrapT = THREE.RepeatWrapping; glintT2.repeat.set(0.7, 1);
    function riverGeo(halfW, yy) {
      var NX = 90, NJ = 6, pos = [], uvs = [], idx = [], X0 = -23, X1 = 23;
      for (var a = 0; a <= NX; a++) {
        var xx = X0 + (X1 - X0) * a / NX, rz = riverZ(xx);
        for (var b = 0; b <= NJ; b++) { pos.push(xx, yy, rz - halfW + 2 * halfW * b / NJ); uvs.push(a / NX * 10, b / NJ); }
      }
      for (a = 0; a < NX; a++) for (var b2 = 0; b2 < NJ; b2++) { var i0 = a * (NJ + 1) + b2, i2 = i0 + NJ + 1; idx.push(i0, i0 + 1, i2, i0 + 1, i2 + 1, i2); }
      var bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); bg.setIndex(idx); bg.computeVertexNormals();
      return bg;
    }
    var waterMat = K.addRim(new THREE.MeshStandardMaterial({ map: waterBaseT, roughness: 0.25, metalness: 0, emissive: 0x1b6f9a, emissiveIntensity: 0.22, transparent: true, opacity: 0.94 }));
    var water = new THREE.Mesh(riverGeo(1.62, WATER_Y), waterMat);
    water.receiveShadow = true; scene.add(water);
    var glint1 = new THREE.Mesh(riverGeo(1.5, WATER_Y + 0.012), new THREE.MeshBasicMaterial({ map: glintT, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(glint1);
    var glint2 = new THREE.Mesh(riverGeo(1.5, WATER_Y + 0.02), new THREE.MeshBasicMaterial({ map: glintT2, transparent: true, opacity: 0.4, depthWrite: false }));
    scene.add(glint2);
    W.waterMat = waterMat;

    /* ----- zonas a evitar (decoração) e obstáculos (colisão do herói) ----- */
    var AVOID = [], OBST = [];
    function avoid(x, z, r) { AVOID.push([x, z, r]); }
    function obst(x, z, r) { OBST.push([x, z, r]); }
    function freeAt(x, z, rr) {
      if (Math.abs(z - riverZ(x)) < 2.3 + rr) return false;
      if (pathD(x, z) < 0.75 + rr) return false;
      for (var k = 0; k < AVOID.length; k++) { var a = AVOID[k]; var dx = x - a[0], dz = z - a[1]; if (dx * dx + dz * dz < (a[2] + rr) * (a[2] + rr)) return false; }
      return true;
    }

    /* ----- PONTE de blocos (metade estragada pela enchente) ----- */
    var WOOD = 0xcd8d4e, WOOD2 = 0xc3803f, WOOD3 = 0xd89a5c, BEAM = 0x9a5f34, STONE = 0xd9cdb8, STONE2 = 0xc9bca6, TEAL = 0x2fb5a3, PINC = 0xf2b968;
    var tileCols = [WOOD, WOOD2, WOOD3];
    [-1, 1].forEach(function (s) {
      // tábuas dos vãos laterais (intactos)
      [1.29, 1.71, 2.13].forEach(function (zz, k) {
        var tz = s * zz;
        block(B.TILE_W, B.TILE_H, B.TILE_D, tileCols[(k + (s > 0 ? 0 : 1)) % 3], 0, B.TILE_Y + Math.sin(k * 2.1 + s) * 0.004, tz, Math.sin(k * 3.3 + s) * 0.012);
        addPin(-0.47, B.TILE_Y + B.TILE_H / 2, tz, PINC); addPin(0.47, B.TILE_Y + B.TILE_H / 2, tz, PINC);
      });
      // longarinas (vigas antigas) dos vãos laterais
      [-1, 1].forEach(function (sx) { block(B.STR_W, B.STR_H, 1.5, BEAM, sx * B.STR_X, B.STR_Y, s * 1.83); });
      [1.5, 1.92].forEach(function (zz) { [-1, 1].forEach(function (sx) { addBow(sx * (B.TILE_W / 2 + 0.005), B.TILE_Y, s * zz, sx * Math.PI / 2, TEAL, 0.85); }); });
      // pilar antigo de pedra (apoio) — os dois que sobraram
      var ph = B.PIER_Y1 - B.PIER_Y0;
      block(B.PIER_W, ph, B.PIER_D, STONE2, 0, (B.PIER_Y0 + B.PIER_Y1) / 2, s * B.JOINT, 0, null, 0.06);
      block(B.PIER_W + 0.18, 0.16, B.PIER_D + 0.16, STONE, 0, B.PIER_Y0 + 0.14, s * B.JOINT, 0, null, 0.05);
      // cabeceiras de pedra
      var zz2 = s * B.END;
      block(1.6, 0.3, 0.62, STONE, 0, -0.02, zz2, 0);
      block(0.7, 0.24, 0.5, STONE2, -0.95, -0.05, zz2 + s * 0.06, 0.1 * s);
      block(0.62, 0.22, 0.46, STONE2, 0.95, -0.06, zz2 - s * 0.02, -0.12 * s);
      addPin(-0.5, 0.13, zz2, 0xe9dfcc); addPin(0.5, 0.13, zz2, 0xe9dfcc); addPin(0, 0.13, zz2, 0xe9dfcc);
      // postes de bloco (nas cabeceiras e sobre os pilares)
      [-1, 1].forEach(function (sx) {
        block(0.2, 0.62, 0.2, BEAM, sx * 0.76, 0.32, s * 2.08, 0);
        addPin(sx * 0.76, 0.63, s * 2.08, 0xffc93c);
        block(0.18, 0.96, 0.18, BEAM, sx * 0.78, 0.36, s * 1.2, 0);
        addPin(sx * 0.78, 0.84, s * 1.2, 0xffc93c);
      });
    });
    // cordas dos vãos laterais e (depois do conserto) do vão do meio
    function rope(pts) {
      var crv = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
      var m = new THREE.Mesh(new THREE.TubeGeometry(crv, 20, 0.025, 5, false), M(0xf0dcae, { roughness: 0.9 }));
      m.castShadow = true; scene.add(m); return m;
    }
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (sx) { rope([[sx * 0.76, 0.56, s * 2.08], [sx * 0.77, 0.5, s * 1.65], [sx * 0.78, 0.76, s * 1.2]]); }); });
    var midRopes = [-1, 1].map(function (sx) { var r = rope([[sx * 0.78, 0.76, 1.2], [sx * 0.78, 0.6, 0.6], [sx * 0.78, 0.56, 0], [sx * 0.78, 0.6, -0.6], [sx * 0.78, 0.76, -1.2]]); r.visible = false; return r; });
    // pedaços estragados: uma tábua presa nas pedras da margem e uma viga boiando
    var junk1 = block(0.9, 0.18, 0.36, WOOD2, 2.1, -0.32, riverZ(2.1) + 1.05, 0.5); junk1.rotation.z = 0.25;
    var floatBeam = new THREE.Group(); scene.add(floatBeam);
    block(0.26, 0.24, 0.95, BEAM, 0, 0, 0, 0, floatBeam);
    floatBeam.position.set(-2.6, WATER_Y + 0.02, riverZ(-2.6) - 0.5); floatBeam.rotation.y = 1.1;
    avoid(0, 2.7, 1.0); avoid(0, -2.7, 1.0);
    // corredor da ponte não pode receber decoração
    for (i = -2; i <= 2; i++) avoid(0, i * 1.2, 0.9);

    /* ----- CONSTRUÇÃO: encaixes (fantasmas) e peças novas ----- */
    var slots = [];
    var ghostFill = new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0.35, depthWrite: false });
    var ghostLine = new THREE.LineBasicMaterial({ color: 0xe9fffb, transparent: true, opacity: 0.85 });
    var hitMat = new THREE.MeshBasicMaterial({ visible: false });
    var NEWWOOD = 0xd99a5c, NEWBEAM = 0xb3713f, NEWSTONE = 0xe8decb;
    function pieceMat(col) { return K.addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.66, emissive: 0x2fe0c4, emissiveIntensity: 0 })); }
    function makeSlot(o) {
      // peça real (escondida até encaixar)
      var pg = new THREE.Group(); pg.position.copy(o.pos); pg.visible = false; scene.add(pg);
      var gh = new THREE.Group(); gh.position.copy(o.pos); scene.add(gh);
      var pmats = [];
      o.parts.forEach(function (p) {
        var mat = pieceMat(p.col); pmats.push(mat);
        var m = new THREE.Mesh(p.geo || rbox(p.w, p.h, p.d, p.r || 0.05), mat); m.position.set(p.x || 0, p.y || 0, p.z || 0); if (p.rot) m.rotation.copy(p.rot);
        m.castShadow = true; m.receiveShadow = true; pg.add(m);
        var gm = new THREE.Mesh(p.geo || rbox(p.w, p.h, p.d, p.r || 0.05), o.type === 'trava' ? ghostFill.clone() : ghostFill); gm.position.copy(m.position); gm.rotation.copy(m.rotation); gm.scale.copy(m.scale); gh.add(gm);
        if (!p.geo) { var el = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(p.w, p.h, p.d)), ghostLine); el.position.copy(m.position); gh.add(el); }
        (p.pins || []).forEach(function (q) { var pm = new THREE.Mesh(K.gHex, K.pinMat(0xffd27a)); pm.position.set((p.x || 0) + q[0], (p.y || 0) + p.h / 2 + 0.025, (p.z || 0) + q[1]); pm.castShadow = true; pg.add(pm); });
      });
      var hit = new THREE.Mesh(G('hitbox', function () { return new THREE.BoxGeometry(1, 1, 1); }), hitMat);
      hit.scale.set(o.hit[0], o.hit[1], o.hit[2]); hit.position.copy(o.pos); if (o.hitY) hit.position.y = o.hitY; scene.add(hit);
      var s = { id: o.id, type: o.type, pos: o.pos.clone(), piece: pg, ghost: gh, hit: hit, mats: pmats, placed: false, from: o.from, needs: o.needs || [], label: o.label };
      hit.userData.slot = s;
      slots.push(s); return s;
    }
    var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
    var pierH = B.PIER_Y1 - B.PIER_Y0;
    makeSlot({ id: 'pilar', type: 'pilar', label: 'pilar do meio', pos: V(0, (B.PIER_Y0 + B.PIER_Y1) / 2, 0), hit: [1.7, 0.9, 0.9], hitY: -0.05,
      parts: [{ w: B.PIER_W, h: pierH, d: B.PIER_D, col: NEWSTONE, r: 0.06, pins: [[-0.5, 0], [0, 0], [0.5, 0]] }, { w: B.PIER_W + 0.18, h: 0.16, d: B.PIER_D + 0.16, col: 0xd9cdb8, y: -pierH / 2 + 0.14, r: 0.05 }] });
    [1, -1].forEach(function (s) {
      makeSlot({ id: s > 0 ? 'viga1' : 'viga2', type: 'viga', label: s > 0 ? 'viga de cá' : 'viga de lá', pos: V(0, B.TILE_Y, s * B.JOINT / 2), hit: [1.5, 0.7, 1.05], needs: ['pilar'],
        parts: [
          { w: B.TILE_W, h: B.TILE_H, d: B.JOINT - 0.02, col: NEWWOOD, r: 0.06, pins: [[-0.47, -0.25], [0.47, -0.25], [-0.47, 0.25], [0.47, 0.25]] },
          { w: B.STR_W, h: B.STR_H, d: B.JOINT - 0.02, col: NEWBEAM, x: -B.STR_X, y: B.STR_Y - B.TILE_Y, r: 0.06 },
          { w: B.STR_W, h: B.STR_H, d: B.JOINT - 0.02, col: NEWBEAM, x: B.STR_X, y: B.STR_Y - B.TILE_Y, r: 0.06 }
        ] });
    });
    [-1, 1].forEach(function (sx) {
      makeSlot({ id: sx < 0 ? 'trava1' : 'trava2', type: 'trava', label: 'trava', pos: V(sx * 0.3, B.DECK_TOP + 0.012, 0), hit: [0.62, 0.5, 0.75], needs: ['viga1', 'viga2'],
        parts: [{ geo: K.gBowFlat, col: TEAL, w: 0.2, h: 0.03, d: 0.11, rot: new THREE.Euler(0, 0, 0) }] });
    });
    slots.forEach(function (s) { if (s.type === 'trava') { s.piece.scale.setScalar(2.2); s.ghost.scale.setScalar(2.2); } });
    W.slots = slots;
    W.midRopes = midRopes;
    W.ghostFill = ghostFill; W.ghostLine = ghostLine;

    /* grade técnica (blueprint) em volta do vão — aparece no modo construção */
    var gridU = { uR: { value: 3.2 }, uA: { value: 0 }, uC: { value: new THREE.Color(0x6fe6ff) } };
    var gridMat = new THREE.ShaderMaterial({
      uniforms: gridU, transparent: true, depthWrite: false, extensions: { derivatives: true },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'uniform float uR; uniform float uA; uniform vec3 uC; varying vec3 vW;',
        'float gl(vec2 p, float s, float wpx){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y) / wpx, 1.0); }',
        'void main(){',
        '  vec2 p = vW.xz; float d = length(p * vec2(1.25, 0.8));',
        '  float minor = gl(p, 0.2, 1.0) * 0.45; float major = gl(p, 1.0, 1.6);',
        '  float axis = (1.0 - min(abs(p.x) / fwidth(p.x) / 1.6, 1.0));',
        '  float a = max(max(minor, major), clamp(axis, 0.0, 1.0) * 0.9);',
        '  float fade = 1.0 - smoothstep(uR * 0.55, uR, d);',
        '  float fill = 0.14 * (1.0 - smoothstep(0.0, uR, d));',
        '  gl_FragColor = vec4(mix(uC, vec3(1.0), major * 0.25), (a * 0.8 + fill) * fade * uA);',
        '}'
      ].join('\n')
    });
    var grid = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), gridMat);
    grid.position.y = WATER_Y + 0.03; grid.renderOrder = 2; grid.visible = false; scene.add(grid);
    W.grid = grid; W.gridU = gridU;

    /* ----- casas com base de blocos ----- */
    var smokeSrc = [], HOUSES = [];
    function house(x, z, ry, wall, roof, s, chimney) {
      var g = new THREE.Group(); g.position.set(x, groundY(x, z), z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g);
      var bw = 1.95, bd = 1.6;
      [[-0.5, -0.42], [0.5, -0.42], [-0.5, 0.42], [0.5, 0.42]].forEach(function (q, j) { block(bw / 2 - 0.02, 0.26, bd / 2 - 0.02, j % 3 ? STONE : STONE2, q[0] * bw / 2, 0.13, q[1] * bd / 2, 0, g); });
      block(1.6, 1.05, 1.25, wall, 0, 0.26 + 0.525, 0, 0, g, 0.08);
      [-1, 1].forEach(function (sg) { var p = block(1.9, 0.12, 0.92, roof, 0, 1.6, sg * 0.37, 0, g, 0.05); p.rotation.x = sg * 0.6; });
      var ridge = mesh(K.gCyl, M(roof === 0xe8684a ? 0xc24f36 : 0x2d7f86), 0.08, 1.96, 0.08, 0, 1.86, 0, g); ridge.rotation.z = Math.PI / 2;
      var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.64, 0); sh.lineTo(0.64, 0); sh.lineTo(0, 0.5); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false }); e.translate(0, 0, -0.78); e.rotateY(Math.PI / 2); return e; });
      mesh(tri, M(wall), 1, 1, 1, 0, 1.31, 0, g);
      block(0.4, 0.62, 0.08, 0x8e5632, -0.38, 0.26 + 0.32, 0.64, 0, g, 0.04);
      ball(0xffc93c, 0.035, -0.26, 0.6, 0.69, g);
      var winM = M(0xbfe9ff, { emissive: 0x7cc8f0, emissiveIntensity: 0.35, roughness: 0.25 });
      var w1 = new THREE.Mesh(rbox(0.38, 0.34, 0.06, 0.04), winM); w1.position.set(0.36, 0.86, 0.64); g.add(w1);
      block(0.46, 0.06, 0.12, 0xfffaf0, 0.36, 0.66, 0.66, 0, g, 0.025);
      block(0.06, 0.34, 0.07, 0xfffaf0, 0.36, 0.86, 0.665, 0, g, 0.02);
      block(0.44, 0.12, 0.14, 0x8e5632, 0.36, 0.6, 0.7, 0, g, 0.03);
      [0xff6f91, 0xffd23f, 0xffffff].forEach(function (fc, j) { ball(fc, 0.055, 0.23 + j * 0.13, 0.69, 0.72, g); });
      var w2 = new THREE.Mesh(rbox(0.06, 0.32, 0.34, 0.03), winM); w2.position.set(0.81, 0.86, 0); g.add(w2);
      g.updateMatrixWorld(true);
      var v = new THREE.Vector3();
      [-0.88, 0, 0.88].forEach(function (px) { [-0.72, 0.72].forEach(function (pz) { v.set(px, 0.26, pz); g.localToWorld(v); addPin(v.x, v.y, v.z, 0xe9dfcc, ry); }); });
      if (chimney) { block(0.24, 0.5, 0.24, 0xd9cdb8, 0.4, 1.95, -0.25, 0, g, 0.05); v.set(0.4, 2.25, -0.25); g.localToWorld(v); smokeSrc.push(v.clone()); }
      avoid(x, z, 1.35 * s); obst(x, z, 1.12 * s);
      HOUSES.push({ g: g, x: x, z: z, r: 1.15 * s, hid: false });
      return g;
    }
    house(-2.35, 3.5, AZ + 0.2, 0xfff4e0, 0x3aa5a8, 1.0, true);
    house(-3.4, 6.9, AZ - 0.1, 0xfdeccf, 0xe8684a, 0.95, false);
    house(3.75, 6.4, AZ + 0.05, 0xfff4e0, 0x3aa5a8, 0.95, false);
    house(3.25, -4.75, AZ - 0.15, 0xfff4e0, 0xe8684a, 1.0, true);
    house(-3.1, -5.7, AZ + 0.12, 0xfdeccf, 0x3aa5a8, 0.95, false);

    /* cerca de blocos */
    (function () {
      var px0 = -1.25, pz0 = 6.2, dx = 0.55, dz = 0.38;
      for (var k = 0; k < 4; k++) {
        var fx = px0 - k * dx, fz = pz0 + k * dz;
        block(0.16, 0.46, 0.16, 0xfff4e0, fx, 0.23, fz, 0);
        addPin(fx, 0.46, fz, 0xffc93c);
        if (k < 3) { var rl = block(0.6, 0.1, 0.08, 0xfff4e0, fx - dx / 2, 0.32, fz + dz / 2, 0); rl.rotation.y = -Math.atan2(dz, -dx); }
        obst(fx, fz, 0.2);
      }
      avoid(px0 - 0.8, pz0 + 0.55, 1.1);
    })();

    /* bancada e pilha de blocos do Mestre Tomé */
    var TOME_P = W.TOME_P = new THREE.Vector3(1.55, 0, 3.05);
    var BENCH = new THREE.Vector3(2.45, 0, 2.75);
    (function () {
      var g = new THREE.Group(); g.position.copy(BENCH); g.rotation.y = -0.5; scene.add(g);
      block(1.1, 0.1, 0.55, 0xc98a4b, 0, 0.5, 0, 0, g, 0.04);
      [[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]].forEach(function (q) { block(0.09, 0.48, 0.09, 0x9a5f34, q[0], 0.24, q[1], 0, g, 0.03); });
      block(0.42, 0.14, 0.2, 0xd99a5c, -0.22, 0.62, 0, 0.2, g, 0.04);
      block(0.2, 0.2, 0.2, 0x2fb5a3, 0.25, 0.65, 0.05, 0.4, g, 0.05);
      block(0.16, 0.16, 0.16, 0xffc93c, 0.38, 0.63, -0.12, 0.1, g, 0.04);
      // pilha de blocos novos no chão
      block(0.9, 0.2, 0.4, 0xd99a5c, 0.2, 0.1, 0.65, 0.1, g, 0.05);
      block(0.9, 0.2, 0.4, 0xb3713f, 0.25, 0.3, 0.6, -0.05, g, 0.05);
      block(0.42, 0.42, 0.42, 0xe8decb, -0.55, 0.21, 0.6, 0.3, g, 0.06);
      g.updateMatrixWorld(true);
      var v = new THREE.Vector3(); v.set(-0.55, 0.42, 0.6); g.localToWorld(v); addPin(v.x, v.y, v.z, 0xe9dfcc);
      avoid(BENCH.x, BENCH.z + 0.2, 1.0); obst(BENCH.x, BENCH.z, 0.62); obst(BENCH.x - 0.35, BENCH.z + 0.6, 0.45);
    })();
    avoid(TOME_P.x, TOME_P.z, 0.8); obst(TOME_P.x, TOME_P.z, 0.42);

    /* pátio do Guardião (blocos antigos com musgo) */
    var GUARD_P = W.GUARD_P = new THREE.Vector3(0, 0, -4.4);
    (function () {
      [-1, 1].forEach(function (sx) {
        block(0.42, 1.0, 0.42, 0xcbbba4, sx * 1.55, 0.5, -4.6, 0.1 * sx);
        block(0.5, 0.18, 0.5, 0xb8a690, sx * 1.55, 1.05, -4.6, 0.1 * sx);
        mesh(K.gSphLo, M(0x6f9e44), 0.3, 0.1, 0.3, sx * 1.55, 1.15, -4.6);
        obst(sx * 1.55, -4.6, 0.35);
        block(0.6, 0.3, 0.45, 0xc9bca6, sx * 1.1, 0.15, -3.5, 0.3 * sx);
        obst(sx * 1.1, -3.5, 0.32);
      });
      avoid(0, -4.35, 2.1); obst(0, -4.4, 1.05);
    })();

    /* caixotes */
    (function () {
      var cx = -1.0, cz = 2.55;
      block(0.42, 0.42, 0.42, 0xd99a5c, cx, 0.21, cz, 0.3);
      block(0.36, 0.36, 0.36, 0xc98a4b, cx - 0.42, 0.18, cz + 0.12, -0.2);
      addPin(cx, 0.42, cz, PINC, 0.3); addPin(cx - 0.42, 0.36, cz + 0.12, PINC, -0.2);
      avoid(cx - 0.2, cz + 0.05, 0.55); obst(cx - 0.2, cz + 0.05, 0.45);
    })();
    avoid(0.6, 6.4, 0.7); avoid(0.2, 4.6, 0.6);

    /* ----- vegetação, pedras, flores (instanciadas) ----- */
    var TREES = [], tryN = 0;
    [[-3.3, 1.4], [-4.1, 4.4], [4.2, 4.4], [4.6, 2.4], [-4.2, -3.2], [1.8, -6.2], [4.6, -3.0], [-1.4, -6.6], [-4.8, 2.6], [5.0, 8.0], [-1.3, 8.4], [2.6, 8.6], [-5.0, -6.0], [5.2, -6.4]].forEach(function (p) {
      if (freeAt(p[0], p[1], 0.6)) { TREES.push([p[0], p[1], 0.85 + R() * 0.35]); avoid(p[0], p[1], 0.7); }
    });
    while (TREES.length < 44 && tryN < 900) {
      tryN++;
      var tx = -7.5 + R() * 15, tz = -8.5 + R() * 19;
      if (!freeAt(tx, tz, 0.55)) continue;
      TREES.push([tx, tz, 0.8 + R() * 0.45]); avoid(tx, tz, 0.75);
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
      obst(t[0], t[1], 0.32 * s);
    });
    var trunkIM = instanced(K.gCyl, M(0x9a6038), trunkL, true);
    var canIM = instanced(K.gSph, M(0xffffff, { roughness: 0.85 }), canL, true);
    W.TREES = TREES;
    var BUSH = [];
    for (tryN = 0; tryN < 500 && BUSH.length < 50; tryN++) {
      var bx = -6.5 + R() * 13, bz = -8 + R() * 17;
      if (!freeAt(bx, bz, 0.25)) continue;
      var bs = 0.2 + R() * 0.14, bc = [0x5bbd4c, 0x4fae4a, 0x6ccf5a][BUSH.length % 3];
      BUSH.push({ x: bx, y: groundY(bx, bz) + bs * 0.55, z: bz, sx: bs * 1.3, sy: bs, sz: bs * 1.1, c: bc });
      BUSH.push({ x: bx + bs * 0.9, y: groundY(bx, bz) + bs * 0.4, z: bz + 0.1, sx: bs * 0.85, sy: bs * 0.7, sz: bs * 0.8, c: bc });
      obst(bx + bs * 0.4, bz, bs * 1.2);
    }
    instanced(K.gSphLo, M(0xffffff, { roughness: 0.85 }), BUSH, true);
    var ROCK = [];
    for (i = 0; i < 52; i++) {
      var rx = -10 + i * 0.4 + R() * 0.3, sgn = i % 2 ? 1 : -1;
      if (Math.abs(rx) < 1.2) continue;
      var rz = riverZ(rx) + sgn * (1.5 + R() * 0.45), rs = 0.1 + R() * 0.16;
      ROCK.push({ x: rx, y: groundY(rx, rz) + rs * 0.2, z: rz, sx: rs * 1.3, sy: rs * 0.75, sz: rs, ry: R() * 3, c: [0xc9c3d6, 0xb7b2c8, 0xd8d2e2][i % 3] });
    }
    // pedrinhas na base dos pilares
    [[-0.85, 1.25], [0.86, 0.9], [-0.8, -1.2], [0.9, -0.95]].forEach(function (q) { ROCK.push({ x: q[0], y: -0.62, z: q[1], sx: 0.2, sy: 0.12, sz: 0.16, c: 0xb7b2c8 }); });
    instanced(K.gSphLo, M(0xffffff, { roughness: 0.8 }), ROCK, true);
    var FLW = [], TUF = [];
    var flCols = [0xffffff, 0xff7aa8, 0xffd23f, 0xb48cff, 0xff9a5c];
    for (tryN = 0; tryN < 1100 && FLW.length < 130; tryN++) {
      var cx = -6 + R() * 12, cz = -7.5 + R() * 16.5;
      if (!freeAt(cx, cz, 0.05)) continue;
      var col2 = flCols[Math.floor(R() * 5)];
      for (var k2 = 0; k2 < 3; k2++) {
        var fx = cx + (R() - 0.5) * 0.5, fz = cz + (R() - 0.5) * 0.5;
        if (!freeAt(fx, fz, 0)) continue;
        FLW.push({ x: fx, y: groundY(fx, fz) + 0.07, z: fz, sx: 0.055, sy: 0.04, sz: 0.055, c: col2 });
      }
    }
    for (tryN = 0; tryN < 600 && TUF.length < 160; tryN++) {
      var tu = -6.5 + R() * 13, tv = -8 + R() * 17;
      var dd = Math.abs(tv - riverZ(tu));
      if (dd < 2.0 && dd > 1.7 && Math.abs(tu) > 1.1) { /* junco na margem */ } else if (!freeAt(tu, tv, 0)) continue;
      TUF.push({ x: tu, y: groundY(tu, tv) + 0.07, z: tv, sx: 0.05, sy: 0.16 + R() * 0.08, sz: 0.05, rz: (R() - 0.5) * 0.4, c: [0x4fa844, 0x5fb84f, 0x3f9a3e][TUF.length % 3] });
    }
    instanced(K.gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
    instanced(G('tufcone', function () { return new THREE.ConeGeometry(1, 1, 5); }), M(0xffffff, { roughness: 0.9 }), TUF, false);
    var PADS = [[-2.6, 0.9], [2.4, -0.9], [3.6, 0.7], [-3.8, -0.4]].map(function (q) { return { x: q[0], y: WATER_Y + 0.03, z: riverZ(q[0]) + q[1], sx: 0.22, sy: 0.02, sz: 0.22, c: 0x4fb35a }; });
    instanced(K.gCyl, M(0xffffff, { roughness: 0.7 }), PADS, false);
    instanced(K.gHex, K.pinMat(0xffffff), PINS, true);
    instanced(K.gBow, M(0xffffff, { roughness: 0.5 }), BOWS, false);

    /* fumaça e borboletas */
    var smokeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.7, emissive: 0xffffff, emissiveIntensity: 0.35, depthWrite: false });
    var smoke = [];
    smokeSrc.forEach(function (src) { for (var k = 0; k < 3; k++) { var sm = new THREE.Mesh(K.gSphLo, smokeMat.clone()); scene.add(sm); smoke.push({ m: sm, src: src, o: k / 3 }); } });
    var wingGeo = G('wing', function () { var s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.05, 0.1, 0.16, 0.1, 0.13, 0.0); s.bezierCurveTo(0.16, -0.08, 0.05, -0.08, 0, 0); var g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; });
    var flies = [[0xffb547, -1.6, 4.4, 0], [0xff7aa8, 2.4, 5.2, 1.7], [0xb48cff, -1.8, -3.4, 3.1]].map(function (q) {
      var g = new THREE.Group(); scene.add(g);
      var m = new THREE.MeshBasicMaterial({ color: q[0], side: THREE.DoubleSide });
      var l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m); r.scale.x = -1; g.add(l); g.add(r);
      g.scale.setScalar(1.4);
      return { g: g, l: l, r: r, x: q[1], z: q[2], ph: q[3] };
    });

    /* ================= navegação: grade + A* + suavização ================= */
    var NX0 = -6, NZ0 = -7, CELL = 0.2, NW = 60, NH = 82;
    var blocked = new Uint8Array(NW * NH);
    W.bridgeFixed = false;
    function onBridgeDeck(x, z) { return Math.abs(x) < 0.45 && Math.abs(z) < 2.75 && (W.bridgeFixed || Math.abs(z) > B.JOINT + 0.12); }
    function cellBlocked(x, z) {
      if (x < -5.6 || x > 5.6 || z < -6.6 || z > 9.2) return true;
      var d = Math.abs(z - riverZ(x));
      if (d < 1.95 && !onBridgeDeck(x, z)) return true;
      if (Math.abs(x) >= 0.45 && Math.abs(x) < 0.95 && Math.abs(z) < 2.75 && d < 2.05) return true; // guarda-corpo / cordas
      for (var k = 0; k < OBST.length; k++) { var o = OBST[k]; var dx = x - o[0], dz = z - o[1]; if (dx * dx + dz * dz < (o[2] + 0.18) * (o[2] + 0.18)) return true; }
      return false;
    }
    W.extraObst = function (x, z, r) { OBST.push([x, z, r]); };
    W.rebuildNav = function () {
      for (var j = 0; j < NH; j++) for (var ii = 0; ii < NW; ii++) blocked[j * NW + ii] = cellBlocked(NX0 + (ii + 0.5) * CELL, NZ0 + (j + 0.5) * CELL) ? 1 : 0;
    };
    function toCell(x, z) { return [clamp(Math.floor((x - NX0) / CELL), 0, NW - 1), clamp(Math.floor((z - NZ0) / CELL), 0, NH - 1)]; }
    function cellC(ii, j) { return { x: NX0 + (ii + 0.5) * CELL, z: NZ0 + (j + 0.5) * CELL }; }
    function isFree(x, z) { var c2 = toCell(x, z); return !blocked[c2[1] * NW + c2[0]]; }
    W.isFree = isFree;
    function nearestFree(x, z) {
      var c0 = toCell(x, z);
      if (!blocked[c0[1] * NW + c0[0]]) return c0;
      for (var r = 1; r < 30; r++) {
        var best = null, bd = 1e9;
        for (var dj = -r; dj <= r; dj++) for (var di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          var ii = c0[0] + di, j = c0[1] + dj;
          if (ii < 0 || j < 0 || ii >= NW || j >= NH || blocked[j * NW + ii]) continue;
          var cc2 = cellC(ii, j), dd2 = (cc2.x - x) * (cc2.x - x) + (cc2.z - z) * (cc2.z - z);
          if (dd2 < bd) { bd = dd2; best = [ii, j]; }
        }
        if (best) return best;
      }
      return null;
    }
    function los(ax, az, bx, bz) {
      var dx = bx - ax, dz = bz - az, L = Math.sqrt(dx * dx + dz * dz), n = Math.ceil(L / 0.08);
      for (var k = 1; k < n; k++) { var t = k / n; if (!isFree(ax + dx * t, az + dz * t)) return false; }
      return true;
    }
    W.findPath = function (sx, sz, tx2, tz2) {
      var s = nearestFree(sx, sz), t = nearestFree(tx2, tz2);
      if (!s || !t) return null;
      var N = NW * NH, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      var open = [], si = s[1] * NW + s[0], ti = t[1] * NW + t[0];
      g[si] = 0; open.push([0, si]);
      function h(idx) { var ii = idx % NW, j = (idx / NW) | 0; var dx = Math.abs(ii - t[0]), dz = Math.abs(j - t[1]); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); }
      var found = false, iter = 0;
      while (open.length && iter++ < 20000) {
        // fila simples: pega o menor f
        var bi = 0; for (var k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
        var cur = open[bi][1]; open[bi] = open[open.length - 1]; open.pop();
        if (closed[cur]) continue; closed[cur] = 1;
        if (cur === ti) { found = true; break; }
        var ci = cur % NW, cj = (cur / NW) | 0;
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          var ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= NW || nj >= NH) continue;
          var nidx = nj * NW + ni; if (blocked[nidx] || closed[nidx]) continue;
          if (di && dj && (blocked[cj * NW + ni] || blocked[nj * NW + ci])) continue;
          var ng = g[cur] + (di && dj ? 1.414 : 1);
          if (ng < g[nidx]) { g[nidx] = ng; came[nidx] = cur; open.push([ng + h(nidx), nidx]); }
        }
      }
      if (!found) return null;
      var pts = [], c3 = ti;
      while (c3 >= 0) { var cc3 = cellC(c3 % NW, (c3 / NW) | 0); pts.push(cc3); if (c3 === si) break; c3 = came[c3]; }
      pts.reverse();
      // o destino exato, se estiver livre
      if (isFree(tx2, tz2)) pts[pts.length - 1] = { x: tx2, z: tz2 };
      pts[0] = { x: sx, z: sz };
      // suavização por linha de visão
      var out = [pts[0]], a = 0;
      while (a < pts.length - 1) {
        var b2 = pts.length - 1;
        while (b2 > a + 1 && !los(pts[a].x, pts[a].z, pts[b2].x, pts[b2].z)) b2--;
        out.push(pts[b2]); a = b2;
      }
      return out;
    };
    /* altura onde o herói pisa (chão ou tabuleiro da ponte) */
    W.heightAt = function (x, z) {
      var gy = groundY(x, z);
      if (Math.abs(x) < 0.7 && Math.abs(z) < 2.95) {
        var deck = B.DECK_TOP - 0.06 + (W.sag ? W.sag(z) : 0);
        var k = sstep(2.3, 2.95, Math.abs(z));
        return Math.max(gy, u.lerp(deck, Math.max(gy, 0), k));
      }
      return gy;
    };
    W.rebuildNav();

    /* ----- "corte" de câmera: esconde árvores/casas entre a câmera baixa e os personagens ----- */
    var treeHid = TREES.map(function () { return false; }), zeroM = new THREE.Matrix4().makeScale(0, 0, 0), keepM = new THREE.Matrix4();
    var origT = trunkL.map(function (L, k) { var m = new THREE.Matrix4(); trunkIM.getMatrixAt(k, m); return m; });
    var origC = canL.map(function (L, k) { var m = new THREE.Matrix4(); canIM.getMatrixAt(k, m); return m; });
    function blocks(cam, tgt, x, z, r) {
      var ax = cam.x, az = cam.z, vx = tgt.x - ax, vz = tgt.z - az, L2 = vx * vx + vz * vz;
      if (L2 < 1e-4) return false;
      var t = ((x - ax) * vx + (z - az) * vz) / L2;
      if (t < 0.0 || t > 0.93) return false;
      var dx = x - (ax + vx * t), dz = z - (az + vz * t);
      return dx * dx + dz * dz < r * r;
    }
    W.cutaway = function (cam, tgt, on) {
      var dirty = false;
      TREES.forEach(function (t, j) {
        var hide = on && blocks(cam, tgt, t[0], t[1], 0.85 * t[2] + 0.25);
        if (hide === treeHid[j]) return;
        treeHid[j] = hide; dirty = true;
        trunkIM.setMatrixAt(j, hide ? zeroM : origT[j]);
        for (var q = 0; q < 3; q++) canIM.setMatrixAt(j * 3 + q, hide ? zeroM : origC[j * 3 + q]);
      });
      if (dirty) { trunkIM.instanceMatrix.needsUpdate = true; canIM.instanceMatrix.needsUpdate = true; }
      HOUSES.forEach(function (h) { var hide = on && blocks(cam, tgt, h.x, h.z, h.r + 0.2); if (hide !== h.hid) { h.hid = hide; h.g.visible = !hide; } });
    };

    /* ----- animação do ambiente ----- */
    W.update = function (dt, wall) {
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
      floatBeam.position.y = WATER_Y + 0.02 + Math.sin(wall * 1.6) * 0.025;
      floatBeam.rotation.z = Math.sin(wall * 1.2) * 0.06;
    };
    return W;
  };
})();
