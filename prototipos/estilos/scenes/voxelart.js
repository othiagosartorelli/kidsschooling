/* Estilo VOXEL ART DETALHADO — KidsSchooling
   Diorama flutuante esculpido em milhares de voxels pequenos (estilo MagicaVoxel),
   personagens com rosto em voxels, riacho translúcido e a viga que se monta cubo a cubo.
   Loop de 3,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'voxelart';
  var LOOP = 3.6;
  var TAU = Math.PI * 2;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function h3(x, y, z) { var s = Math.sin(x * 127.1 + y * 269.5 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
  function h2(x, z) { return h3(x, 0.37, z); }
  function vnoise(x, z) {
    var xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
    var a = h2(xi, zi), b = h2(xi + 1, zi), c = h2(xi, zi + 1), d = h2(xi + 1, zi + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }
  function jit(c, amt, r) {
    var k = 1 + (r - 0.5) * amt;
    var R = Math.min(255, Math.round(((c >> 16) & 255) * k)), G = Math.min(255, Math.round(((c >> 8) & 255) * k)), B = Math.min(255, Math.round((c & 255) * k));
    return (R << 16) | (G << 8) | B;
  }
  function pick(arr, r) { return arr[Math.min(arr.length - 1, Math.floor(r * arr.length))]; }

  /* =====================================================================
     WORLD (built once, cached across mounts)
     ===================================================================== */
  var KX = 512, KY = 128;
  function key(x, y, z) { return ((x + 256) * KY + (y + 64)) * KX + (z + 256); }

  var X0 = -23, X1 = 21, Z0 = -36, Z1 = 20, YB = -7;
  function zc(x) { return 1.8 * Math.sin(x * 0.11) + 0.6 * Math.sin(x * 0.27); }
  function hw(x) { return 5.6 + 0.9 * Math.sin(x * 0.19 + 1.3); }
  function segD(px, pz, ax, az, bx, bz) {
    var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
    var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
    var dx = wx - vx * k, dz = wz - vz * k; return Math.sqrt(dx * dx + dz * dz);
  }
  var PATHS = [[[11.5, -24], [8.5, -19], [3.5, -14], [0.5, -9]], [[0.5, 9], [1.5, 13], [3.5, 17], [4, 21]]];
  function pathD(x, z) {
    var best = 99, px = x + 0.5, pz = z + 0.5;
    PATHS.forEach(function (P) { for (var i = 0; i < P.length - 1; i++) best = Math.min(best, segD(px, pz, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); });
    return best;
  }
  function landH(x, z) {
    var h = 0;
    var bz = (x > 3 ? -35 : -30) + 1.5 * Math.sin(x * 0.33);
    if (z < bz) h = 1;
    if (z < bz - 3 && x < 3) h = 2;
    var dd = Math.sqrt((x + 17) * (x + 17) + (z + 22) * (z + 22) * 0.8) + (vnoise(x * 0.3, z * 0.3) - 0.5) * 3;
    if (dd < 10) h = Math.max(h, 1); if (dd < 6.5) h = Math.max(h, 2); if (dd < 3.6) h = Math.max(h, 3);
    dd = Math.sqrt((x - 15) * (x - 15) + (z - 13) * (z - 13)) + (vnoise(x * 0.4 + 9, z * 0.4) - 0.5) * 2;
    if (dd < 6.5) h = Math.max(h, 1); if (dd < 3) h = Math.max(h, 2);
    return h;
  }

  var GRASS = [0x6cc04f, 0x78c957, 0x84d25f, 0x8fd967, 0x63b649];
  var DIRT = [0xa8754a, 0x9b6a42, 0x8f603c, 0xb27f52];
  var STONE = [0x8b8e9b, 0x7f8290, 0x979aa7, 0x737684];
  var WOOD = [0xc48a55, 0xb67b47, 0xcf9862, 0xbb8350];
  var WOODD = 0x7e5233;
  var FLOWERS = [0xff6f8e, 0xffd23f, 0xb48cff, 0xffffff, 0xff8a3d, 0x6fc3ff];

  var WORLD = null;
  function buildWorld() {
    var M = new Map();
    var free = [], water = [], fall = [], top = {};
    function put(x, y, z, c) { M.set(key(x, y, z), c); }
    function has(x, y, z) { return M.has(key(x, y, z)); }
    function box(x0, x1, y0, y1, z0, z1, c) {
      for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++)
        put(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
    }
    function topY(x, z) { var v = top[x + ',' + z]; return v === undefined ? 0 : v; }

    /* ---------- terrain island ---------- */
    for (var x = X0; x <= X1; x++) for (var z = Z0; z <= Z1; z++) {
      var d = Math.abs(z + 0.5 - zc(x)), w = hw(x);
      var e = Math.min(x - X0, X1 - x, z - Z0, Z1 - z);
      var bottom = YB - Math.min(10, Math.floor(Math.sqrt(e) * 2.7 + h2(x, z) * 2.2));
      var y, c, r;
      if (d < w) {
        var hb = d < w - 2.6 ? -3 : (d < w - 1.3 ? -2 : -1);
        top[x + ',' + z] = hb;
        for (y = bottom; y <= hb; y++) {
          r = h3(x, y, z);
          if (y === hb) c = hb === -3 ? jit(pick([0x6f8796, 0x7b93a1, 0x62798a, 0x8aa0ab], r), 0.12, h3(z, x, 3)) : jit(hb === -2 ? 0xc9b37f : 0xdcc690, 0.1, r);
          else c = y < -6 ? jit(pick(STONE, r), 0.1, h2(y, x)) : jit(pick(DIRT, (y * 0.37 + r * 0.4) % 1), 0.08, r);
          put(x, y, z, c);
        }
        water.push([x, z, -hb, d / w]);
      } else {
        var h = landH(x, z), pd = pathD(x, z);
        top[x + ',' + z] = h;
        for (y = bottom; y <= h; y++) {
          r = h3(x, y, z);
          if (y === h) {
            if (pd < 1.55) c = jit(pick([0xe2c08a, 0xd9b47c, 0xe8cb98], r), 0.08, h3(z, y, x));
            else if (pd < 2.1 && r < 0.45) c = jit(0xb9c96a, 0.1, r);
            else if (d < w + 1.1 && h === 0) c = jit(pick([0xe6d39c, 0xd8c48c], r), 0.08, h3(z, 1, x));
            else c = jit(pick(GRASS, clamp(vnoise(x * 0.17, z * 0.17) * 0.8 + r * 0.35, 0, 0.999)), 0.07, h3(z, y, x));
          } else if (y === h - 1 && r < 0.55) c = jit(0x5aa443, 0.1, r);
          else if (y < -6) c = jit(pick(STONE, r), 0.1, h2(y, x)) ;
          else c = r < 0.06 ? jit(0x9a9aa6, 0.1, r * 9) : jit(pick(DIRT, ((y + 20) * 0.29 + h2(x, z) * 0.25) % 1), 0.07, r);
          put(x, y, z, c);
        }
        if (bottom < YB - 4 && h3(x, 5, z) < 0.05) put(x, bottom - 1, z, 0x6f5a3e);
      }
    }

    /* ---------- reeds & lily pads ---------- */
    water.forEach(function (wv) {
      var x = wv[0], z = wv[1], r = h2(x * 3, z * 7);
      if (wv[3] > 0.78 && r < 0.16 && Math.abs(x) > 6 && x < X1 - 1) {
        var hgt = 2 + Math.floor(r * 12) % 2;
        for (var y = 0; y <= hgt; y++) put(x, y, z, jit(0x4f9a3c, 0.15, h3(x, y, z)));
        put(x, hgt + 1, z, 0x7a4a2a);
      }
    });
    [[-14, 0], [12, 2], [-19, -2], [17, -1]].forEach(function (p, i) {
      var x = p[0], z = Math.round(zc(x) + p[1] * 0.5);
      free.push([x + 0.5, 0.62, z + 0.5, 1.8, 0.16, 1.6, 0x58b34a]);
      free.push([x + 1.5, 0.62, z + 1.3, 0.9, 0.16, 0.9, 0x6cc457]);
      if (i % 2 === 0) free.push([x + 0.6, 0.92, z + 0.4, 0.5, 0.42, 0.5, 0xff8fb0]);
    });

    /* ---------- waterfall off the right edge ---------- */
    for (var fz = Z0; fz <= Z1; fz++) {
      var dd = Math.abs(fz + 0.5 - zc(X1));
      if (dd < hw(X1)) for (var fy = 0; fy >= -15; fy--) fall.push([X1 + 1.18, fy + 0.3, fz + 0.5, fy, fz]);
    }

    /* ---------- bridge ---------- */
    box(-5, 5, -2, 0, 7, 8, function (x, y, z) { return jit(pick(STONE, h3(x, y, z)), 0.12, h3(z, y, x)); });
    box(-5, 5, -2, 0, -8, -7, function (x, y, z) { return jit(pick(STONE, h3(x, y, z)), 0.12, h3(z, y, x)); });
    box(-4, -4, 1, 1, -8, 8, function (x, y, z) { return jit(WOODD, 0.1, h3(x, y, z)); });
    box(4, 4, 1, 1, -8, 8, function (x, y, z) { return jit(WOODD, 0.1, h3(x, y, z)); });
    for (var bz = -8; bz <= 8; bz++) {
      if (bz >= -1 && bz <= 1) continue;
      var pc = WOOD[(bz + 8) % 4];
      for (var bx = -4; bx <= 4; bx++) put(bx, 2, bz, (bx === -4 || bx === 4) && bz % 2 === 0 ? 0x5b4636 : jit(pc, 0.1, h3(bx, 2, bz)));
    }
    for (bx = -4; bx <= 4; bx++) { put(bx, 1, 9, jit(WOOD[bx & 3], 0.1, h3(bx, 1, 9))); put(bx, 1, -9, jit(WOOD[(bx + 1) & 3], 0.1, h3(bx, 1, -9))); }
    [-8, -4, 4, 8].forEach(function (pz) { [-5, 5].forEach(function (px) { box(px, px, 0, 5, pz, pz, function (x, y, z) { return jit(0x8a5a37, 0.1, h3(x, y, z)); }); }); });
    [-5, 5].forEach(function (px) {
      box(px, px, 5, 5, -8, 8, function (x, y, z) { return jit(0xa8703f, 0.1, h3(x, y, z)); });
      box(px, px, 3, 3, -8, 8, function (x, y, z) { return z % 4 === 0 ? 0x8a5a37 : jit(0x9a643a, 0.1, h3(x, y, z)); });
    });
    // lantern post at the near end
    box(7, 7, 1, 6, 9, 9, 0x6e4a2f); box(6, 7, 7, 7, 9, 9, 0x6e4a2f);
    put(6, 6, 9, 0x3a3340); put(6, 5, 9, 0xffd76a); put(6, 4, 9, 0x3a3340);

    /* ---------- house ---------- */
    (function () {
      var x0 = 6, x1 = 17, z0 = -33, z1 = -25, yt = 8, x, y, z, k;
      for (x = x0; x <= x1; x++) for (y = 1; y <= yt; y++) for (z = z0; z <= z1; z++) {
        var ex = x === x0 || x === x1, ez = z === z0 || z === z1, c, r = h3(x, y, z);
        if (!ex && !ez) { put(x, y, z, 0xd9c7a8); continue; }
        if (y === 1) c = jit(pick(STONE, r), 0.14, h3(z, x, y));
        else if (ex && ez) c = jit(0x8a5a35, 0.08, r);
        else if (y === yt || y === 5) c = jit(0x96643c, 0.08, r);
        else c = jit(r < 0.5 ? 0xfbf1dc : 0xf4e6cb, 0.03, h3(z, y, x));
        put(x, y, z, c);
      }
      // door
      box(11, 12, 2, 5, z1, z1, function (x, y) { return x === 11 ? 0xa86d3e : 0x995f34; });
      box(10, 10, 2, 6, z1, z1, 0x7a4b2c); box(13, 13, 2, 6, z1, z1, 0x7a4b2c); box(10, 13, 6, 6, z1, z1, 0x7a4b2c);
      free.push([12.3, 3.6, z1 + 1.05, 0.32, 0.32, 0.25, 0xffd23f]);
      box(10, 13, 1, 1, z1 + 1, z1 + 1, function (x) { return jit(0xb9b7c2, 0.1, h2(x, 4)); });
      // front windows with flower boxes
      [[8, 9, 7], [14, 15, 16]].forEach(function (wnd) {
        box(wnd[0], wnd[1], 3, 4, z1, z1, 0x8fd0f2); put(wnd[0], 4, z1, 0xe9f9ff);
        box(wnd[2], wnd[2], 3, 4, z1, z1, 0x3fa3a0);
        box(wnd[0] - 1, wnd[1] + 1, 2, 2, z1 + 1, z1 + 1, 0x7a4b2c);
        for (var fx = wnd[0] - 1; fx <= wnd[1] + 1; fx++) put(fx, 3, z1 + 1, (fx & 1) ? 0xff6f8e : (fx % 3 ? 0xffd23f : 0x5fb548));
      });
      // side windows (visible right face)
      [-31, -28].forEach(function (wz) {
        box(x1, x1, 3, 4, wz, wz + 1, 0x8fd0f2); put(x1, 4, wz + 1, 0xe9f9ff);
        box(x1 + 1, x1 + 1, 2, 2, wz - 1, wz + 2, 0x7a4b2c);
        put(x1 + 1, 3, wz, 0xff6f8e); put(x1 + 1, 3, wz + 1, 0xb48cff);
      });
      // roof (gable along x)
      for (k = 0; k <= 5; k++) {
        y = yt + 1 + k;
        var zf = z1 + 1 - k, zb = z0 - 1 + k;
        for (x = x0 - 1; x <= x1 + 1; x++) {
          var rc = k === 5 ? 0xa83a28 : (k === 0 ? 0xb8402c : ((k + (x >> 1)) & 1 ? 0xe0553f : 0xd14a35));
          put(x, y, zf, jit(rc, 0.1, h3(x, y, zf)));
          put(x, y, zb, jit(rc, 0.1, h3(x, y, zb)));
          if (x >= x0 && x <= x1) for (z = zb + 1; z < zf; z++) {
            var gab = x === x0 || x === x1;
            put(x, y, z, gab ? (z === -29 && y === 11 && x === x1 ? 0x8fd0f2 : jit(0xf8eed8, 0.03, h3(x, y, z))) : 0xd9c7a8);
          }
        }
      }
      box(x1, x1, 10, 10, -30, -28, 0x96643c); put(x1, 12, -29, 0x96643c);
      // chimney
      box(14, 15, 9, 16, -32, -31, function (x, y, z) { return jit(pick(STONE, h3(x, y, z)), 0.15, h3(z, x, y)); });
      box(13, 16, 16, 16, -33, -30, 0x5f616e);
      // flower beds along the front
      [6, 7, 8, 15, 16, 17].forEach(function (fx) { put(fx, 0, z1 + 1, 0x6b4a33); put(fx, 1, z1 + 1, fx & 1 ? 0x5fb548 : pick(FLOWERS, h2(fx, 3))); });
      // barrels & mailbox
      [[19, -27], [19, -29]].forEach(function (b) {
        box(b[0], b[0] + 1, 1, 3, b[1], b[1] + 1, function (x, y, z) { return y === 2 ? 0x5f5a66 : jit(0xa36a3c, 0.1, h3(x, y, z)); });
      });
      box(14, 14, 1, 3, -20, -20, 0x7a4b2c); box(13, 15, 4, 5, -20, -20, function (x) { return x === 15 ? 0xd23c3c : 0xe85050; }); put(15, 6, -20, 0xffd23f);
      // garden fence (with gate gap for the path)
      for (x = 4; x <= 19; x++) {
        if (x >= 8 && x <= 11) continue;
        put(x, 1, -21, jit(0xf4ead6, 0.05, h2(x, 1))); put(x, 2, -21, jit(0xf4ead6, 0.05, h2(x, 2)));
        if (x % 2 === 0) put(x, 3, -21, 0xfaf3e3);
      }
    })();

    /* ---------- builder's corner (next to Mestre Tomé) ---------- */
    box(-18, -14, 1, 1, -15, -14, function (x, y, z) { return x === -18 || x === -14 ? 0xe2b27a : jit(WOOD[(z + 20) & 3], 0.1, h3(x, y, z)); });
    box(-17, -13, 2, 2, -15, -15, function (x, y, z) { return x === -17 || x === -13 ? 0xe2b27a : jit(WOOD[2], 0.1, h3(x, y, z)); });
    box(-17, -15, 2, 2, -14, -14, function (x, y, z) { return x === -17 ? 0xe2b27a : jit(WOOD[1], 0.1, h3(x, y, z)); });
    box(-16, -14, 3, 3, -15, -15, function (x, y, z) { return x === -16 ? 0xe2b27a : jit(WOOD[0], 0.1, h3(x, y, z)); });
    box(-6, -4, 1, 2, -16, -15, function (x, y) { return y === 2 ? 0xc23d2f : 0xe04b3a; });
    box(-5, -5, 3, 3, -16, -15, 0x5f616e); put(-6, 1, -14, 0xffd23f);

    /* ---------- fences ---------- */
    for (x = -23; x <= -11; x++) {
      put(x, topY(x, 17) + 1, 17, jit(0xf4ead6, 0.05, h2(x, 5)));
      put(x, topY(x, 17) + 2, 17, jit(0xf4ead6, 0.05, h2(x, 6)));
      if (x % 3 === 0) put(x, topY(x, 17) + 3, 17, 0xfaf3e3);
    }

    /* ---------- trees ---------- */
    function tree(cx, cz, R, th, pal, fruit, seed) {
      var gy = topY(cx, cz) + 1, x, y, z;
      for (x = cx; x <= cx + 1; x++) for (z = cz; z <= cz + 1; z++) for (y = gy; y < gy + th + 2; y++) put(x, y, z, jit((x + z + y) & 1 ? 0x8a5a37 : 0x7a4d2f, 0.1, h3(x, y, z)));
      [[cx - 1, cz], [cx + 2, cz + 1], [cx, cz + 2], [cx + 1, cz - 1]].forEach(function (p, i) { if (h2(seed, i) < 0.75) put(p[0], gy, p[1], 0x7a4d2f); });
      var ox = cx + 1, oy = gy + th + R * 0.55, oz = cz + 1;
      var blobs = [[0, 0, 0, R], [R * 0.55, -R * 0.25, R * 0.35, R * 0.68], [-R * 0.5, -R * 0.2, -R * 0.35, R * 0.7], [0.1 * R, 0.42 * R, -0.1 * R, R * 0.62], [-0.3 * R, -0.1 * R, 0.5 * R, R * 0.6]];
      var set = {}, cells = [];
      var Rm = Math.ceil(R * 1.6);
      for (x = -Rm; x <= Rm; x++) for (y = -Rm; y <= Rm; y++) for (z = -Rm; z <= Rm; z++) {
        var px = x + 0.5, py = y + 0.5, pz = z + 0.5, inside = false;
        for (var b = 0; b < blobs.length && !inside; b++) {
          var B = blobs[b], dx = px - B[0], dy = (py - B[1]) * 1.18, dz = pz - B[2];
          if (dx * dx + dy * dy + dz * dz < B[3] * B[3] * (0.92 + h3(x + seed, y, z) * 0.16)) inside = true;
        }
        if (inside) { set[x + ',' + y + ',' + z] = 1; cells.push([x, y, z]); }
      }
      cells.forEach(function (q) {
        var x = q[0], y = q[1], z = q[2];
        var surf = !set[(x + 1) + ',' + y + ',' + z] || !set[x + ',' + (y + 1) + ',' + z] || !set[x + ',' + y + ',' + (z + 1)] || !set[(x - 1) + ',' + y + ',' + z] || !set[x + ',' + y + ',' + (z - 1)];
        var r = h3(x + seed * 3, y, z), ny = (y + 0.5) / R;
        var c = pick(pal, clamp(0.45 + ny * 0.45 + (r - 0.5) * 0.5, 0, 0.999));
        if (surf && fruit && r < 0.055 && ny < 0.7) c = fruit;
        put(Math.floor(ox + x), Math.floor(oy + y), Math.floor(oz + z), jit(c, 0.08, h3(z, x, y + seed)));
      });
    }
    var LEAF = [0x2f8a3e, 0x3c9c45, 0x4cae4c, 0x5ec257, 0x74d264];
    var LEAF2 = [0x3a8f3a, 0x4aa346, 0x5db552, 0x70c65c, 0x86d66a];
    var PINK = [0xe9799d, 0xf48fae, 0xfba6c0, 0xffbcd0, 0xffd3e0];
    tree(-18, -27, 6.2, 7, LEAF, 0xe8433b, 1);
    tree(-18, 10, 5.0, 5, LEAF2, 0xff9a2e, 2);
    tree(15, 13, 3.9, 5, PINK, 0xffffff, 3);
    tree(-5, -32, 5.2, 6, LEAF2, 0xe8433b, 4);
    tree(17, -15, 4.2, 5, LEAF, 0xffc93c, 5);
    tree(-11, -33, 3.8, 4, LEAF, null, 6);

    /* ---------- bushes ---------- */
    function bush(cx, cz, R, pal, berry) {
      var gy = topY(cx, cz) + 1;
      for (var x = -3; x <= 3; x++) for (var y = 0; y <= 3; y++) for (var z = -3; z <= 3; z++) {
        var dx = x, dy = y * 1.3, dz = z;
        if (dx * dx + dy * dy + dz * dz < R * R * (0.85 + h3(x, y, z + cx) * 0.3)) {
          var r = h3(x + cx, y, z + cz);
          put(cx + x, gy + y, cz + z, r < 0.07 && berry ? berry : jit(pick(pal, clamp(0.3 + y * 0.2 + r * 0.3, 0, 0.99)), 0.1, r));
        }
      }
    }
    bush(-10, 16, 2.6, LEAF2, 0xff6f8e); bush(9, 13, 2.3, LEAF, 0xffd23f); bush(-3, -21, 2.2, LEAF2, 0xe8433b);
    bush(-20, -5, 2.4, LEAF, null); bush(-14, -20, 2.2, LEAF2, 0xb48cff); bush(3, -30, 2.4, LEAF, 0xff6f8e);
    bush(17, 17, 2.2, LEAF2, null);

    /* ---------- rocks ---------- */
    function rock(x, z, big) {
      var gy = topY(x, z) + 1;
      box(x, x + 1, gy, gy, z, z + (big ? 1 : 0), function (a, b, c) { return jit(pick(STONE, h3(a, b, c)), 0.1, h3(c, a, b)); });
      if (big) { put(x, gy + 1, z, jit(0x9da0ad, 0.08, h2(x, z))); put(x + 1, gy + 1, z + 1, 0x6fbe55); }
    }
    rock(-9, -9, true); rock(8, -9, false); rock(12, 7, true); rock(-15, 6, false); rock(-7, 8, true); rock(17, 5, false); rock(-4, 15, false);

    /* ---------- mushrooms ---------- */
    [[-14, 14], [-21, -21]].forEach(function (m) {
      var gy = topY(m[0], m[1]) + 1;
      put(m[0], gy, m[1], 0xf4ead6);
      put(m[0], gy + 1, m[1], 0xe8433b); put(m[0] + 1, gy + 1, m[1], 0xffffff); put(m[0] - 1, gy + 1, m[1], 0xe8433b); put(m[0], gy + 1, m[1] + 1, 0xe8433b); put(m[0], gy + 1, m[1] - 1, 0xffffff);
      put(m[0], gy + 2, m[1], 0xe8433b);
    });

    /* ---------- flowers & grass tufts ---------- */
    function freeSpot(x, z) {
      if (x <= X0 + 1 || x >= X1 - 1 || z <= Z0 + 1 || z >= Z1) return false;
      var d = Math.abs(z + 0.5 - zc(x)); if (d < hw(x) + 1.3) return false;
      if (pathD(x, z) < 2.2) return false;
      var y = topY(x, z); if (has(x, y + 1, z) || has(x, y + 2, z)) return false;
      if (Math.abs(x) < 7 && Math.abs(z) < 11) return false;
      if (x > 0 && x < 12 && z < -11 && z > -26) return false; // hero walkway
      if (x > -14 && x < -6 && z < -8 && z > -14) return false; // Tomé
      return true;
    }
    var n;
    for (n = 0; n < 260; n++) {
      var fx = X0 + Math.floor(h2(n, 11) * (X1 - X0)), fz2 = Z0 + Math.floor(h2(n, 23) * (Z1 - Z0));
      if (!freeSpot(fx, fz2)) continue;
      var gy = topY(fx, fz2) + 1;
      if (n % 3 === 0) {
        var col = pick(FLOWERS, h2(n, 5));
        put(fx, gy, fz2, 0x4f9a3c);
        if (n % 2) { put(fx, gy + 1, fz2, 0xffe36a); if (freeSpot(fx + 1, fz2)) put(fx + 1, gy + 1, fz2, col); put(fx - 1, gy + 1, fz2, col); put(fx, gy + 1, fz2 + 1, col); put(fx, gy + 1, fz2 - 1, col); }
        else put(fx, gy + 1, fz2, col);
      } else {
        put(fx, gy, fz2, jit(n & 1 ? 0x58a83f : 0x7cc95a, 0.1, h2(n, 2)));
        if (n % 5 === 1) put(fx, gy + 1, fz2, 0x63b649);
      }
    }

    /* ---------- tiny floating islets in the sky ---------- */
    function islet(cx, cy, cz, R, withTree) {
      for (var x = -R; x <= R; x++) for (var z = -R; z <= R; z++) {
        var dd = Math.sqrt(x * x + z * z); if (dd > R + 0.3) continue;
        var depth = Math.max(1, Math.round((R - dd) * 1.3 + h2(x + cx, z) * 1.5));
        for (var y = 0; y > -depth - 1; y--) put(cx + x, cy + y, cz + z, y === 0 ? jit(pick(GRASS, h2(x, z)), 0.08, h2(z, x)) : (y === -1 ? jit(DIRT[0], 0.1, h2(x, y)) : jit(pick(STONE, h3(x, y, z)), 0.1, h2(y, x))));
      }
      if (withTree) {
        for (var ty = 1; ty <= 3; ty++) put(cx, cy + ty, cz, 0x7a4d2f);
        for (x = -2; x <= 2; x++) for (y = 0; y <= 2; y++) for (z = -2; z <= 2; z++) if (x * x + (y - 1) * (y - 1) * 1.6 + z * z < 5.2) put(cx + x, cy + 4 + y, cz + z, jit(pick(LEAF2, (y + 1) / 3.2), 0.1, h3(x, y, z)));
      } else { put(cx, cy + 1, cz, 0xff6f8e); put(cx + 1, cy + 1, cz - 1, 0xffd23f); }
    }
    islet(-17, -50, -5, 4, true);

    /* ---------- emit: only voxels with a face toward the camera (+x, +y, +z) ---------- */
    var out = [];
    M.forEach(function (c, k) {
      var z = k % KX, t = (k - z) / KX; z -= 256;
      var y = t % KY, x = (t - y) / KY - 256; y -= 64;
      var ex = !has(x + 1, y, z), ey = !has(x, y + 1, z), ez = !has(x, y, z + 1);
      if (!ex && !ey && !ez) return;
      var ao = 1;
      if (ey) {
        var nn = 0;
        for (var dx = -1; dx <= 1; dx++) for (var dz = -1; dz <= 1; dz++) if ((dx || dz) && has(x + dx, y + 1, z + dz)) nn++;
        ao -= nn * 0.055;
        for (var kk = 2; kk <= 14; kk++) if (has(x, y + kk, z)) { ao *= 0.66 + kk * 0.016; break; }
      } else {
        if (has(x + 1, y + 1, z) || has(x, y + 1, z + 1)) ao -= 0.12;
        if (y < -4) ao -= Math.min(0.25, (-4 - y) * 0.022);
      }
      ao = clamp(ao, 0.5, 1);
      out.push(x + 0.5, y + 0.5, z + 0.5, 1, 1, 1, ((c >> 16) & 255) / 255 * ao, ((c >> 8) & 255) / 255 * ao, (c & 255) / 255 * ao);
    });
    free.forEach(function (f) { out.push(f[0], f[1], f[2], f[3], f[4], f[5], ((f[6] >> 16) & 255) / 255, ((f[6] >> 8) & 255) / 255, (f[6] & 255) / 255); });
    return { inst: new Float32Array(out), water: water, fall: fall };
  }

  /* =====================================================================
     CHARACTERS (voxel models, built per part)
     ===================================================================== */
  function Part() { this.m = {}; }
  Part.prototype.set = function (x, y, z, c) { this.m[x + ',' + y + ',' + z] = [x, y, z, c]; };
  Part.prototype.del = function (x, y, z) { delete this.m[x + ',' + y + ',' + z]; };
  Part.prototype.box = function (x0, x1, y0, y1, z0, z1, c) {
    for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
  };
  Part.prototype.cells = function () {
    var m = this.m, out = [];
    Object.keys(m).forEach(function (k) {
      var c = m[k], x = c[0], y = c[1], z = c[2];
      if (m[(x + 1) + ',' + y + ',' + z] && m[(x - 1) + ',' + y + ',' + z] && m[x + ',' + (y + 1) + ',' + z] && m[x + ',' + (y - 1) + ',' + z] && m[x + ',' + y + ',' + (z + 1)] && m[x + ',' + y + ',' + (z - 1)]) return;
      out.push(c);
    });
    return out;
  };

  function heroParts() {
    var SK = 0xf7c9a0, HAIR = 0x6b3f22, HAIR2 = 0x7f4c2a, BL = 0x3f86e8, BL2 = 0x2c5fb8, OR = 0xff8a1f, OR2 = 0xe06d12;
    var legL = new Part(), legR = new Part(), body = new Part(), armL = new Part(), armR = new Part(), head = new Part();
    [[legL, -2], [legR, 0]].forEach(function (L) {
      var p = L[0], x0 = L[1];
      p.box(x0, x0 + 1, 0, 0, -1, 1, 0x5a3a2a); p.set(x0, 0, 1, 0x6b4733);
      p.box(x0, x0 + 1, 1, 1, -1, 0, 0xf4f1ea);
      p.box(x0, x0 + 1, 2, 2, -1, 0, SK);
      p.box(x0, x0 + 1, 3, 3, -1, 0, BL2);
    });
    body.box(-3, 2, 4, 4, -1, 1, BL2);
    body.box(-3, 2, 5, 8, -1, 1, function (x, y) { return y === 6 ? 0x5b9cf0 : BL; });
    body.set(-1, 8, 1, 0xf4f1ea); body.set(0, 8, 1, 0xf4f1ea); body.set(-1, 7, 1, 0xf4f1ea);
    body.box(-2, -2, 5, 8, 1, 1, OR); body.box(1, 1, 5, 8, 1, 1, OR);
    body.set(2, 7, 1, 0xffd23f);
    // backpack
    body.box(-3, 2, 4, 8, -3, -2, function (x, y) { return (x === -3 || x === 2 || y === 4) ? OR2 : OR; });
    body.box(-3, 2, 7, 8, -4, -4, 0xf07a18);
    body.box(-2, 1, 5, 6, -4, -4, 0xffab52);
    body.set(-1, 7, -5, 0xffd23f); body.set(0, 7, -5, 0xffd23f);
    body.box(-3, 2, 9, 9, -3, -3, 0xe06d12);
    [[armL, -4], [armR, 3]].forEach(function (A) {
      var p = A[0], x = A[1];
      p.box(x, x, 7, 8, -1, 0, BL); p.box(x, x, 5, 6, -1, 0, SK); p.box(x, x, 4, 4, -1, 0, 0xf0b890);
    });
    head.box(-4, 3, 9, 15, -3, 3, function (x, y, z) {
      if (y >= 14) return (x + z) & 1 ? HAIR : HAIR2;
      if (z === -3 && y >= 10) return HAIR;
      if ((x === -4 || x === 3) && z <= 1 && y >= 11) return HAIR2;
      return SK;
    });
    [[-4, -3], [3, -3]].forEach(function (p) { for (var y = 9; y <= 15; y++) head.del(p[0], y, p[1]); });
    head.del(-4, 9, 3); head.del(3, 9, 3);
    // face
    head.box(-3, -2, 12, 13, 3, 3, 0x2a2238); head.box(1, 2, 12, 13, 3, 3, 0x2a2238);
    head.set(-2, 13, 3, 0xffffff); head.set(2, 13, 3, 0xffffff);
    head.set(-1, 10, 3, 0x9a3434); head.set(0, 10, 3, 0x9a3434);
    head.set(-3, 10, 3, 0xff9c9c); head.set(2, 10, 3, 0xff9c9c);
    head.set(-4, 13, 3, HAIR); head.set(-1, 13, 3, HAIR2); head.set(0, 13, 3, HAIR); head.set(3, 13, 3, HAIR2);
    head.set(-5, 11, 0, 0xf0b890); head.set(4, 11, 0, 0xf0b890);
    head.box(-1, 0, 16, 16, 0, 1, HAIR); head.set(0, 16, 2, HAIR2); head.set(0, 17, 1, HAIR);
    return {
      legL: [legL, [-1, 4, 0]], legR: [legR, [1, 4, 0]], body: [body, [0, 0, 0]],
      armL: [armL, [-3.5, 8.5, 0]], armR: [armR, [3.5, 8.5, 0]], head: [head, [0, 9, 0]]
    };
  }

  function tomeParts() {
    var SK = 0xf0b48a, BE = 0xf7f4ee, BE2 = 0xe9e5dc, SH = 0x3fa39a, SH2 = 0x348c84, AP = 0x8b5a2f, AP2 = 0x9f6a3a, Y = 0xffcf2e, Y2 = 0xf2b91c;
    var legL = new Part(), legR = new Part(), body = new Part(), armL = new Part(), armR = new Part(), head = new Part();
    [[legL, -3], [legR, 1]].forEach(function (L) {
      var p = L[0], x0 = L[1];
      p.box(x0, x0 + 1, 0, 1, -1, 1, 0x4a3426); p.box(x0, x0 + 1, 1, 1, 1, 1, 0x5a4030);
      p.box(x0, x0 + 1, 2, 4, -1, 0, function (x, y) { return y === 4 ? 0x5c5e74 : 0x6d6f86; });
    });
    body.box(-4, 3, 5, 11, -2, 1, function (x, y, z) { return ((y + (x & 1)) % 3 === 0) ? SH2 : SH; });
    body.box(-3, 2, 6, 9, 2, 2, AP);
    body.box(-3, 2, 5, 5, 2, 2, 0x7a4d28);
    body.box(-2, 1, 10, 10, 2, 2, AP);
    body.box(-3, -3, 10, 11, 2, 2, AP); body.box(2, 2, 10, 11, 2, 2, AP);
    body.box(-2, 1, 6, 7, 3, 3, AP2);
    body.set(1, 8, 3, 0xffd23f); body.set(1, 7, 3, 0xffd23f);
    body.set(-2, 8, 3, 0xff8a3d); body.set(-2, 9, 3, 0x3a3340);
    body.box(-4, 3, 7, 7, -2, -2, AP);
    [[armL, -5], [armR, 4]].forEach(function (A) {
      var p = A[0], x = A[1];
      p.box(x, x, 9, 11, -1, 0, SH); p.box(x, x, 8, 8, -1, 0, 0xf1e2c4); p.box(x, x, 6, 7, -1, 0, SK); p.box(x, x, 5, 5, -1, 0, 0xe6a57c);
    });
    head.box(-4, 3, 12, 17, -3, 3, function (x, y, z) {
      if (z === -3 && y <= 15) return BE2;
      if ((x === -4 || x === 3) && y >= 15 && z <= 1) return BE;
      return SK;
    });
    head.del(-4, 17, -3); head.del(3, 17, -3);
    // beard
    head.box(-4, 3, 12, 14, 3, 3, function (x, y) { return (x + y) & 1 ? BE : BE2; });
    head.box(-3, 2, 11, 14, 4, 4, function (x, y) { return (x + y) & 1 ? BE : BE2; });
    head.box(-2, 1, 10, 10, 3, 4, BE2);
    head.box(-3, 2, 11, 11, 3, 3, BE);
    head.box(-4, -4, 12, 14, 0, 2, BE); head.box(3, 3, 12, 14, 0, 2, BE);
    head.box(-3, 2, 15, 15, 4, 4, BE); head.del(-1, 15, 4); head.del(0, 15, 4);
    head.set(-1, 15, 4, 0xe09a72); head.set(0, 15, 4, 0xe09a72); head.set(-1, 16, 4, 0xe8a47c); head.set(0, 16, 4, 0xe8a47c);
    head.set(-1, 13, 4, 0x8a3030); head.set(0, 13, 4, 0x8a3030);
    head.del(-3, 15, 4); head.del(2, 15, 4);
    head.set(-3, 15, 3, 0xf59a8a); head.set(2, 15, 3, 0xf59a8a);
    head.box(-3, -2, 16, 16, 3, 3, 0x2a2238); head.box(1, 2, 16, 16, 3, 3, 0x2a2238);
    head.box(-3, -2, 17, 17, 3, 3, BE); head.box(1, 2, 17, 17, 3, 3, BE);
    head.set(-5, 15, 0, SK); head.set(4, 15, 0, SK);
    // helmet
    head.box(-5, 4, 18, 18, -4, 4, Y);
    head.box(-4, 3, 18, 18, 5, 5, Y2);
    head.box(-4, 3, 19, 19, -3, 3, Y);
    head.box(-3, 2, 20, 20, -2, 2, 0xffdc55);
    head.box(-1, 0, 19, 21, -3, 3, function (x, y, z) { return y === 21 && (z === -3 || z === 3) ? undefined : Y2; });
    head.del(-1, 21, -3); head.del(0, 21, -3); head.del(-1, 21, 3); head.del(0, 21, 3);
    head.set(-1, 19, 4, 0xff8a1f); head.set(0, 19, 4, 0xff8a1f);
    return {
      legL: [legL, [-2, 5, 0]], legR: [legR, [2, 5, 0]], body: [body, [0, 0, 0]],
      armL: [armL, [-4.5, 11, -0.5]], armR: [armR, [4.5, 11, -0.5]], head: [head, [0, 12, 0]]
    };
  }

  var CHARS = null;

  /* =====================================================================
     HUD (DOM) — chamfered cards, mini-voxel icons
     ===================================================================== */
  function hexs(c) { return '#' + ('00000' + c.toString(16)).slice(-6); }
  function shade(c, k) { var R = Math.min(255, Math.round(((c >> 16) & 255) * k)), G = Math.min(255, Math.round(((c >> 8) & 255) * k)), B = Math.min(255, Math.round((c & 255) * k)); return hexs((R << 16) | (G << 8) | B); }
  function isoSVG(vox) {
    var set = {}; vox.forEach(function (v) { set[v[0] + ',' + v[1] + ',' + v[2]] = 1; });
    var C = Math.cos(Math.PI / 6), S = 0.5;
    function P(x, y, z) { return [(x - z) * C, (x + z) * S - y]; }
    var polys = [], minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    vox.slice().sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[1] - b[1]; }).forEach(function (v) {
      var x = v[0], y = v[1], z = v[2], c = v[3];
      var faces = [];
      if (!set[x + ',' + (y + 1) + ',' + z]) faces.push([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1], 1.18]);
      if (!set[x + ',' + y + ',' + (z + 1)]) faces.push([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1], 1.0]);
      if (!set[(x + 1) + ',' + y + ',' + z]) faces.push([[x + 1, y, z], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z], 0.78]);
      faces.forEach(function (f) {
        var pts = f.slice(0, 4).map(function (p) { var q = P(p[0], p[1], p[2]); minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); return q[0].toFixed(3) + ',' + q[1].toFixed(3); });
        var col = shade(c, f[4]);
        polys.push('<polygon points="' + pts.join(' ') + '" fill="' + col + '" stroke="' + col + '" stroke-width="0.05" stroke-linejoin="round"/>');
      });
    });
    var pad = 0.15;
    return '<svg viewBox="' + (minx - pad).toFixed(2) + ' ' + (miny - pad).toFixed(2) + ' ' + (maxx - minx + 2 * pad).toFixed(2) + ' ' + (maxy - miny + 2 * pad).toFixed(2) + '" aria-hidden="true">' + polys.join('') + '</svg>';
  }
  function pixSVG(rows, pal) {
    var h = rows.length, w = rows[0].length, s = '';
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var ch = rows[y][x]; if (pal[ch]) s += '<rect x="' + x + '" y="' + y + '" width="1.04" height="1.04" fill="' + pal[ch] + '"/>'; }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true">' + s + '</svg>';
  }

  var ICONS = null;
  function icons() {
    if (ICONS) return ICONS;
    var v, x, y, z;
    // bridge with glowing plank
    v = [];
    for (z = 0; z <= 4; z++) for (x = 0; x <= 2; x++) v.push([x, 0, z, z === 2 ? 0xffd23f : (z & 1 ? 0xc48a55 : 0xb37845)]);
    [[0, 0], [2, 0], [0, 4], [2, 4]].forEach(function (p) { v.push([p[0], 1, p[1], 0x7e5233]); });
    var bridge = isoSVG(v);
    // hammer
    v = [];
    for (y = 0; y <= 3; y++) v.push([1, y, 1, y === 0 ? 0x7e5233 : 0xb67b47]);
    for (x = 0; x <= 3; x++) v.push([x, 4, 1, x === 3 ? 0x5f616e : 0x8b8e9b]);
    v.push([0, 5, 1, 0x9da0ad]); v.push([1, 5, 1, 0x9da0ad]);
    var hammer = isoSVG(v);
    // backpack
    v = [];
    for (x = 0; x <= 2; x++) for (y = 0; y <= 3; y++) for (z = 0; z <= 1; z++) v.push([x, y, z, y === 3 ? 0xe06d12 : 0xff8a1f]);
    for (x = 0; x <= 2; x++) v.push([x, 1, 2, 0xffab52]);
    v.push([1, 2, 2, 0xffd23f]);
    var bag = isoSVG(v);
    // map tile with pin
    v = [];
    for (x = 0; x <= 3; x++) for (z = 0; z <= 3; z++) v.push([x, 0, z, (x === 1 && z <= 2) || (x === 2 && z === 3) ? 0x45a9e6 : ((x + z) & 1 ? 0x78c957 : 0x6cc04f)]);
    v.push([3, 1, 0, 0x3c9c45]); v.push([3, 2, 0, 0x5ec257]);
    v.push([2, 1, 1, 0xe8433b]); v.push([2, 2, 1, 0xe8433b]); v.push([2, 3, 1, 0xff6f6f]);
    var map = isoSVG(v);
    var avatar = pixSVG([
      '..........',
      '...hhhh...',
      '..hhhhhh..',
      '.hhhhhhhh.',
      '.hsshsshh.',
      '.hsssssh..',
      '.sewssews.',
      '.seesseeS.',
      '.psssssps.',
      '..smmmms..',
      '...ssss...',
      '..bbbbbb..'
    ], { h: '#6b3f22', s: '#f7c9a0', S: '#f7c9a0', e: '#2a2238', w: '#ffffff', p: '#ff9c9c', m: '#9a3434', b: '#3f86e8' });
    var star = pixSVG(['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'], { y: '#ffd23f' });
    var check = pixSVG(['.......', '.....w.', '....ww.', 'w..ww..', 'ww.w...', '.www...', '..w....'], { w: '#ffffff' });
    var helm = pixSVG(['..yyy..', '.yyyyy.', 'yyyyyyy', 'YYYYYYY'], { y: '#ffcf2e', Y: '#e0a516' });
    ICONS = { bridge: bridge, hammer: hammer, bag: bag, map: map, avatar: avatar, star: star, check: check, helm: helm };
    return ICONS;
  }

  var P = 'voxelart-';
  var CSS = [
    '.P-root{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#6fc0f4 0%,#a6dcfa 38%,#d8f0fd 66%,#fff3dc 100%);font-family:"Fredoka","Baloo 2",system-ui,sans-serif;color:#26304d;-webkit-user-select:none;user-select:none;}',
    '.P-root canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.P-hud{position:absolute;inset:0;pointer-events:none;font-size:calc(16px*var(--s));}',
    '.P-sh{filter:drop-shadow(0 calc(3px*var(--s)) 0 rgba(38,48,77,.16)) drop-shadow(0 calc(7px*var(--s)) calc(12px*var(--s)) rgba(38,48,77,.18));}',
    '.P-card{--c:calc(9px*var(--s));background:rgba(255,255,255,.95);clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% var(--c),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,var(--c) 100%,0 calc(100% - var(--c)),0 var(--c));}',
    '.P-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px);}',
    '.P-topc{display:flex;align-items:center;gap:calc(11px*var(--s));padding:calc(9px*var(--s)) calc(13px*var(--s)) calc(10px*var(--s)) calc(9px*var(--s));box-shadow:inset 0 calc(-4px*var(--s)) 0 rgba(38,48,77,.06);}',
    '.P-ava{position:relative;flex:none;width:calc(52px*var(--s));height:calc(52px*var(--s));border-radius:50%;background:radial-gradient(circle at 50% 40%,#d6f0ff,#9fd6f7);box-shadow:0 0 0 calc(3px*var(--s)) #fff,0 0 0 calc(5.5px*var(--s)) #ff9f3a;overflow:hidden;margin-left:calc(4px*var(--s));}',
    '.P-ava svg{position:absolute;left:12%;top:14%;width:76%;height:86%;display:block}',
    '.P-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(7px*var(--s));}',
    '.P-lvl{font-weight:600;font-size:calc(17px*var(--s));line-height:1.05;white-space:nowrap;letter-spacing:.005em;}',
    '.P-lvl b{font-weight:700;color:#ef7d16;}',
    '.P-lvl span{color:#8a93ad;font-weight:500;margin:0 calc(2px*var(--s));}',
    '.P-xprow{display:flex;align-items:center;gap:calc(8px*var(--s));}',
    '.P-xp{--c:calc(4px*var(--s));position:relative;flex:1;height:calc(14px*var(--s));background:#e4eaf4;clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% var(--c),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,var(--c) 100%,0 calc(100% - var(--c)),0 var(--c));}',
    '.P-xpfill{position:absolute;left:0;top:0;bottom:0;width:62%;background:linear-gradient(180deg,#9df27f 0%,#5fd35f 55%,#3fb653 100%);}',
    '.P-xpseg{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 2px),rgba(255,255,255,.75) calc(10% - 2px),rgba(255,255,255,.75) 10%);}',
    '.P-xpglow{position:absolute;top:0;bottom:0;width:calc(18px*var(--s));background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.P-xptxt{flex:none;font-weight:600;font-size:calc(12.5px*var(--s));color:#5d6787;font-variant-numeric:tabular-nums;min-width:calc(78px*var(--s));text-align:right;}',
    '.P-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 40px + 84px*var(--s));max-width:84%;}',
    '.P-questc{display:flex;align-items:center;gap:calc(9px*var(--s));padding:calc(7px*var(--s)) calc(10px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));}',
    '.P-tile{--c:calc(6px*var(--s));flex:none;display:grid;place-items:center;clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% var(--c),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,var(--c) 100%,0 calc(100% - var(--c)),0 var(--c));}',
    '.P-qi{width:calc(36px*var(--s));height:calc(36px*var(--s));background:#fff1c7;}',
    '.P-qi svg{width:84%;height:84%}',
    '.P-qt{font-weight:500;font-size:calc(14.5px*var(--s));line-height:1.12;}',
    '.P-qt b{display:block;font-weight:600;font-size:calc(11.5px*var(--s));color:#ef7d16;letter-spacing:.1em;text-transform:uppercase;margin-bottom:calc(1px*var(--s));}',
    '.P-chk{width:calc(22px*var(--s));height:calc(22px*var(--s));background:#e4eaf4;margin-left:calc(2px*var(--s));}',
    '.P-chk svg{width:70%;height:70%;opacity:0}',
    '.P-bub{position:absolute;left:0;top:0;width:calc(212px*var(--s));opacity:0;transform-origin:20% 100%;will-change:transform,opacity;}',
    '.P-bubc{padding:calc(16px*var(--s)) calc(13px*var(--s)) calc(11px*var(--s));}',
    '.P-say{font-weight:600;font-size:calc(15.5px*var(--s));line-height:1.2;color:#26304d;}',
    '.P-tag{--c:calc(5px*var(--s));position:absolute;left:calc(10px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));background:#ff9f3a;color:#fff;font-weight:600;font-size:calc(13px*var(--s));padding:calc(3px*var(--s)) calc(9px*var(--s)) calc(3px*var(--s)) calc(7px*var(--s));white-space:nowrap;}',
    '.P-tag svg{width:calc(15px*var(--s));height:calc(9px*var(--s));}',
    '.P-tail{position:absolute;top:100%;width:calc(18px*var(--s));}',
    '.P-tail i{display:block;height:calc(5px*var(--s));background:rgba(255,255,255,.95);}',
    '.P-plus{position:absolute;left:0;top:0;display:flex;align-items:center;gap:calc(4px*var(--s));font-weight:700;font-size:calc(31px*var(--s));color:#ffd23f;-webkit-text-stroke:calc(6px*var(--s)) #26304d;paint-order:stroke fill;letter-spacing:.01em;opacity:0;white-space:nowrap;filter:drop-shadow(0 calc(3px*var(--s)) 0 rgba(38,48,77,.35));}',
    '.P-plus svg{width:calc(20px*var(--s));height:calc(20px*var(--s));}',
    '.P-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.P-btnw{flex:1;min-width:0;position:relative;}',
    '.P-btn{height:calc(78px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font-weight:600;font-size:calc(15.5px*var(--s));color:#26304d;}',
    '.P-btn svg{width:calc(38px*var(--s));height:calc(32px*var(--s));}',
    '.P-b1{box-shadow:inset 0 calc(-6px*var(--s)) 0 #ff9f3a;}.P-b2{box-shadow:inset 0 calc(-6px*var(--s)) 0 #4c9cf0;}.P-b3{box-shadow:inset 0 calc(-6px*var(--s)) 0 #4cc38a;}',
    '.P-ring{--c:calc(11px*var(--s));position:absolute;inset:calc(-4px*var(--s));background:#ffd23f;opacity:0;clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% var(--c),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,var(--c) 100%,0 calc(100% - var(--c)),0 var(--c));}',
    '.P-wipe{position:absolute;inset:0;pointer-events:none;}'
  ].join('\n').replace(/\.P-/g, '.' + P);

  function buildHUD(root) {
    var I = icons();
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var hud = document.createElement('div'); hud.className = P + 'hud';
    hud.innerHTML =
      '<div class="' + P + 'top ' + P + 'sh"><div class="' + P + 'card ' + P + 'topc">' +
        '<div class="' + P + 'ava">' + I.avatar + '</div>' +
        '<div class="' + P + 'stat"><div class="' + P + 'lvl"><b>Nível 4</b><span>·</span>Explorador</div>' +
        '<div class="' + P + 'xprow"><div class="' + P + 'xp"><div class="' + P + 'xpfill"></div><div class="' + P + 'xpglow"></div><div class="' + P + 'xpseg"></div></div><div class="' + P + 'xptxt">620/1000 XP</div></div></div>' +
      '</div></div>' +
      '<div class="' + P + 'quest ' + P + 'sh"><div class="' + P + 'card ' + P + 'questc">' +
        '<div class="' + P + 'tile ' + P + 'qi">' + I.bridge + '</div>' +
        '<div class="' + P + 'qt"><b>Missão</b>Consertar a ponte da vila</div>' +
        '<div class="' + P + 'tile ' + P + 'chk">' + I.check + '</div>' +
      '</div></div>' +
      '<div class="' + P + 'bub ' + P + 'sh"><div class="' + P + 'card ' + P + 'bubc"><div class="' + P + 'say">A viga precisa se apoiar dos dois lados!</div></div>' +
        '<div class="' + P + 'tile ' + P + 'tag">' + I.helm + 'Mestre Tomé</div>' +
        '<div class="' + P + 'tail"><i style="width:100%"></i><i style="width:66%;margin-left:17%"></i><i style="width:33%;margin-left:34%"></i></div>' +
      '</div>' +
      '<div class="' + P + 'plus">' + I.star + '+50 XP</div>' +
      '<div class="' + P + 'btns">' +
        '<div class="' + P + 'btnw"><div class="' + P + 'ring"></div><div class="' + P + 'sh"><div class="' + P + 'card ' + P + 'btn ' + P + 'b1">' + I.hammer + 'Construir</div></div></div>' +
        '<div class="' + P + 'btnw"><div class="' + P + 'sh"><div class="' + P + 'card ' + P + 'btn ' + P + 'b2">' + I.bag + 'Mochila</div></div></div>' +
        '<div class="' + P + 'btnw"><div class="' + P + 'sh"><div class="' + P + 'card ' + P + 'btn ' + P + 'b3">' + I.map + 'Mapa</div></div></div>' +
      '</div>';
    root.appendChild(hud);
    var q = function (c) { return hud.querySelector('.' + P + c); };
    return { hud: hud, fill: q('xpfill'), glow: q('xpglow'), txt: q('xptxt'), bub: q('bub'), tail: q('tail'), plus: q('plus'), quest: q('quest'), chk: q('chk'), chkI: q('chk svg'), ring: q('ring') };
  }

  /* =====================================================================
     MOUNT
     ===================================================================== */
  function mount(host) {
    var reduced = false;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    if (!WORLD) WORLD = buildWorld();
    if (!CHARS) CHARS = { hero: heroParts(), tome: tomeParts() };

    var root = document.createElement('div'); root.className = P + 'root';
    host.appendChild(root);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    var wipe = document.createElement('canvas'); wipe.className = P + 'wipe'; root.appendChild(wipe);
    var wctx = wipe.getContext('2d');
    var H = buildHUD(root);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(20, 0.5, 150, 520);

    scene.add(new THREE.HemisphereLight(0xd8efff, 0xb59c74, 0.62));
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    var sun = new THREE.DirectionalLight(0xffe6c2, 0.92);
    sun.position.set(-26, 60, 34);
    sun.target.position.set(0, 0, -6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var scam = sun.shadow.camera; scam.left = -44; scam.right = 44; scam.top = 44; scam.bottom = -44; scam.near = 10; scam.far = 150;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);

    /* --- voxel material: per-voxel soft gradient + crisp edge darkening (fake AO inside each cube) --- */
    var unitBox = new THREE.BoxGeometry(1, 1, 1);
    function voxPatch(sh) {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc;\nvarying float vUp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position; vUp = normal.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc;\nvarying float vUp;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 aa = abs(vLoc) * 2.0; float mx = max(aa.x, max(aa.y, aa.z)); float mn = min(aa.x, min(aa.y, aa.z)); float md = aa.x + aa.y + aa.z - mx - mn;\n float edge = smoothstep(0.8, 1.0, md);\n float grad = mix(mix(0.8, 1.0, clamp(vLoc.y + 0.5, 0.0, 1.0)), 1.05, step(0.5, vUp));\n diffuseColor.rgb *= grad * (1.0 - 0.1 * edge); }');
    }
    function voxMat(opts) { var m = new THREE.MeshLambertMaterial(opts || {}); m.onBeforeCompile = voxPatch; return m; }

    var disposables = [unitBox];
    function instanced(n, material) {
      var m = new THREE.InstancedMesh(unitBox, material, n);
      m.frustumCulled = false; disposables.push(material);
      return m;
    }

    /* --- static world --- */
    var ID_ = WORLD.inst, NS = ID_.length / 9;
    var worldMat = voxMat();
    var world = instanced(NS, worldMat);
    var wm = world.instanceMatrix.array, wc = new Float32Array(NS * 3);
    for (var i = 0; i < NS; i++) {
      var o = i * 9, b = i * 16;
      wm[b] = ID_[o + 3]; wm[b + 1] = 0; wm[b + 2] = 0; wm[b + 3] = 0;
      wm[b + 4] = 0; wm[b + 5] = ID_[o + 4]; wm[b + 6] = 0; wm[b + 7] = 0;
      wm[b + 8] = 0; wm[b + 9] = 0; wm[b + 10] = ID_[o + 5]; wm[b + 11] = 0;
      wm[b + 12] = ID_[o]; wm[b + 13] = ID_[o + 1]; wm[b + 14] = ID_[o + 2]; wm[b + 15] = 1;
      wc[i * 3] = ID_[o + 6]; wc[i * 3 + 1] = ID_[o + 7]; wc[i * 3 + 2] = ID_[o + 8];
    }
    world.instanceColor = new THREE.InstancedBufferAttribute(wc, 3);
    world.instanceMatrix.needsUpdate = true;
    world.castShadow = true; world.receiveShadow = true;
    scene.add(world);

    /* --- water (translucent thin voxels) + waterfall --- */
    var WV = WORLD.water, FV = WORLD.fall, NW = WV.length, NF = FV.length;
    var waterMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.74, shininess: 60, specular: 0x5f8fb0, depthWrite: false });
    var water = instanced(NW, waterMat);
    var fallMesh = instanced(NF, voxMat({ emissive: 0x3f8fd6, emissiveIntensity: 0.55 }));
    var dummy = new THREE.Object3D();
    var waterBase = new Float32Array((NW + NF) * 3);
    for (i = 0; i < NW; i++) {
      var w = WV[i];
      dummy.position.set(w[0] + 0.5, 0.38, w[1] + 0.5); dummy.scale.set(1, 0.34, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      water.setMatrixAt(i, dummy.matrix);
      var dep = w[2];
      var base = dep >= 3 ? [0.10, 0.42, 0.82] : dep === 2 ? [0.16, 0.54, 0.88] : [0.28, 0.68, 0.92];
      waterBase[i * 3] = base[0]; waterBase[i * 3 + 1] = base[1]; waterBase[i * 3 + 2] = base[2];
    }
    for (i = 0; i < NF; i++) {
      var f = FV[i];
      dummy.position.set(f[0] - 0.1, f[1], f[2]); dummy.scale.set(0.6, 1, 1); dummy.updateMatrix();
      fallMesh.setMatrixAt(i, dummy.matrix);
      var fade = clamp(1 + f[3] / 18, 0.3, 1);
      waterBase[(NW + i) * 3] = 0.36 + (1 - fade) * 0.55; waterBase[(NW + i) * 3 + 1] = 0.7 + (1 - fade) * 0.27; waterBase[(NW + i) * 3 + 2] = 0.97;
    }
    water.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NW * 3), 3);
    water.instanceColor.setUsage(THREE.DynamicDrawUsage);
    water.renderOrder = 2;
    scene.add(water);
    fallMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NF * 3), 3);
    fallMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(fallMesh);
    var glintIdx = []; for (i = 0; i < NW; i++) if (h2(WV[i][0] * 1.7, WV[i][1] * 2.3) < 0.07) glintIdx.push(i);

    /* --- clouds --- */
    var cloudCells = [];
    [[24, -34, -5, 7, 0], [-30, 15, -20, 5, 1], [26, 22, -32, 4, 2]].forEach(function (cd) {
      var R = cd[3];
      for (var x = -R - 3; x <= R + 3; x++) for (var y = 0; y <= 4; y++) for (var z = -3; z <= 3; z++) {
        var e1 = (x * x) / (R * R) + (y * y) / 9 + (z * z) / 9;
        var e2 = ((x - R * 0.4) * (x - R * 0.4)) / (R * R * 0.3) + ((y - 2) * (y - 2)) / 6 + (z * z) / 7;
        if (e1 < 1 || e2 < 1) cloudCells.push([cd[0] + x, cd[1] + y, cd[2] + z, cd[4], y]);
      }
    });
    var cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdfefff, emissiveIntensity: 0.55 });
    var clouds = instanced(cloudCells.length, cloudMat);
    var cloudCol = new Float32Array(cloudCells.length * 3);
    cloudCells.forEach(function (c, k) { var s = c[4] === 0 ? 0.88 : 1; cloudCol[k * 3] = s; cloudCol[k * 3 + 1] = s; cloudCol[k * 3 + 2] = s; });
    clouds.instanceColor = new THREE.InstancedBufferAttribute(cloudCol, 3);
    scene.add(clouds);
    function placeClouds(t) {
      for (var k = 0; k < cloudCells.length; k++) {
        var c = cloudCells[k], off = Math.sin(t * TAU / LOOP + c[3] * 1.7) * 1.2;
        dummy.position.set(c[0] + 0.5 + off, c[1] + 0.5, c[2] + 0.5); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        clouds.setMatrixAt(k, dummy.matrix);
      }
      clouds.instanceMatrix.needsUpdate = true;
    }

    /* --- characters --- */
    var charMat = voxMat();
    function buildChar(def) {
      var g = new THREE.Group(), parts = {};
      var bodyG = new THREE.Group(); g.add(bodyG);
      Object.keys(def).forEach(function (name) {
        var part = def[name][0], pv = def[name][1], cells = part.cells();
        var m = instanced(cells.length, charMat);
        var col = new Float32Array(cells.length * 3);
        cells.forEach(function (c, k) {
          dummy.position.set(c[0] + 0.5 - pv[0], c[1] + 0.5 - pv[1], c[2] + 0.5 - pv[2]); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
          m.setMatrixAt(k, dummy.matrix);
          var cc = jit(c[3], 0.06, h3(c[0], c[1], c[2])), ao = c[1] <= 0 ? 0.85 : 1;
          col[k * 3] = ((cc >> 16) & 255) / 255 * ao; col[k * 3 + 1] = ((cc >> 8) & 255) / 255 * ao; col[k * 3 + 2] = (cc & 255) / 255 * ao;
        });
        m.instanceColor = new THREE.InstancedBufferAttribute(col, 3);
        m.castShadow = true; m.receiveShadow = true;
        var pg = new THREE.Group(); pg.position.set(pv[0], pv[1], pv[2]); pg.add(m);
        (name === 'legL' || name === 'legR' ? g : bodyG).add(pg);
        parts[name] = pg;
      });
      parts.root = g; parts.bodyG = bodyG;
      scene.add(g);
      return parts;
    }
    var hero = buildChar(CHARS.hero);
    var tome = buildChar(CHARS.tome);
    var CS = 0.6;
    hero.root.scale.setScalar(CS); tome.root.scale.setScalar(CS);
    tome.root.position.set(-8.5, 1, -11.5);
    tome.root.rotation.y = 0.62;

    /* --- the missing beam: 27 voxels that fly in --- */
    var beamCells = [];
    for (var bx = -4; bx <= 4; bx++) for (var bz = -1; bz <= 1; bz++) beamCells.push([bx, 2, bz]);
    var NB = beamCells.length;
    var beamInfo = beamCells.map(function (c, k) {
      var order = (c[0] + 4) / 8 * 0.8 + h3(c[0], 7, c[2]) * 0.2;
      var a = k * 2.399 + 0.6, rad = 9 + h3(k, 1, 2) * 5;
      var start = 1.42 + order * 0.52;
      var wc0 = jit(WOOD[(c[2] + 9) & 3], 0.12, h3(c[0], 2, c[2]));
      return {
        tx: c[0] + 0.5, ty: c[1] + 0.5, tz: c[2] + 0.5,
        sx: Math.cos(a) * rad, sy: 9 + h3(k, 3, 4) * 7, sz: Math.sin(a) * rad * 0.8 - 2,
        s: start, L: start + 0.42, spin: (h3(k, 5, 6) - 0.5) * 9,
        r: ((wc0 >> 16) & 255) / 255, g: ((wc0 >> 8) & 255) / 255, b: (wc0 & 255) / 255
      };
    });
    var beamMat = voxMat({ emissive: 0xffc94a, emissiveIntensity: 0 });
    var beam = instanced(NB, beamMat);
    beam.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NB * 3), 3);
    beam.castShadow = true; beam.receiveShadow = true;
    scene.add(beam);
    var ghostMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.3, depthWrite: false });
    var ghost = instanced(NB, ghostMat);
    ghost.renderOrder = 3;
    scene.add(ghost);

    /* --- sparks (stateless, loop-safe) --- */
    var NSP = NB * 2 + 30;
    var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var sparks = instanced(NSP, sparkMat);
    var spCol = new Float32Array(NSP * 3), spInfo = [];
    for (i = 0; i < NSP; i++) {
      var burst = i >= NB * 2, src = burst ? -1 : (i >> 1);
      var ang = h3(i, 9, 1) * TAU, el = burst ? 0.3 + h3(i, 2, 8) * 1.0 : 0.6 + h3(i, 4, 4) * 0.7;
      spInfo.push({ src: src, dx: Math.cos(ang) * Math.cos(el), dy: Math.sin(el), dz: Math.sin(ang) * Math.cos(el), sp: burst ? 5 + h3(i, 1, 1) * 5 : 2.5 + h3(i, 3, 3) * 2, sz: burst ? 0.5 + h3(i, 6, 6) * 0.35 : 0.32 });
      var yc = h3(i, 8, 8) < 0.5;
      spCol[i * 3] = 1; spCol[i * 3 + 1] = yc ? 0.86 : 1; spCol[i * 3 + 2] = yc ? 0.35 : 0.92;
    }
    sparks.instanceColor = new THREE.InstancedBufferAttribute(spCol, 3);
    sparks.renderOrder = 4;
    scene.add(sparks);

    /* --- glow sprite --- */
    var gc = document.createElement('canvas'); gc.width = gc.height = 128;
    var gg = gc.getContext('2d'), grd = gg.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,246,190,1)'); grd.addColorStop(0.35, 'rgba(255,215,90,0.55)'); grd.addColorStop(1, 'rgba(255,200,60,0)');
    gg.fillStyle = grd; gg.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(gc);
    var glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 });
    var glow = new THREE.Sprite(glowMat); glow.position.set(0.5, 3.2, 0.5); glow.renderOrder = 5;
    scene.add(glow); disposables.push(glowMat, glowTex);

    /* --- dynamic small things: chimney smoke + butterflies --- */
    var NSM = 7, NBF = 4;
    var dynMat = voxMat();
    var dyn = instanced(NSM + NBF, dynMat);
    var dynCol = new Float32Array((NSM + NBF) * 3);
    for (i = 0; i < NSM; i++) { dynCol[i * 3] = 0.94; dynCol[i * 3 + 1] = 0.95; dynCol[i * 3 + 2] = 0.98; }
    [[1, 0.85, 0.25], [1, 0.85, 0.25], [1, 0.62, 0.78], [1, 0.62, 0.78]].forEach(function (c, k) { dynCol[(NSM + k) * 3] = c[0]; dynCol[(NSM + k) * 3 + 1] = c[1]; dynCol[(NSM + k) * 3 + 2] = c[2]; });
    dyn.instanceColor = new THREE.InstancedBufferAttribute(dynCol, 3);
    scene.add(dyn);

    /* --- layout --- */
    var Wd = 1, Hd = 1, S = 1;
    function layout() {
      var r = host.getBoundingClientRect();
      Wd = Math.max(1, r.width); Hd = Math.max(1, r.height);
      S = clamp(Wd / 390, 0.8, 1.4);
      H.hud.style.setProperty('--s', S.toFixed(3));
      renderer.setSize(Wd, Hd, false);
      var asp = Wd / Hd;
      camera.aspect = asp;
      var halfW = Math.atan(24.5 / 300);
      // in landscape keep the diorama height in view instead
      var vf = 2 * Math.atan(Math.tan(halfW) / asp) * 180 / Math.PI;
      camera.fov = clamp(vf, 15.5, 40);
      camera.updateProjectionMatrix();
      wipe.width = Math.round(Wd); wipe.height = Math.round(Hd);
    }
    layout();
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
    if (ro) ro.observe(host);

    var tmpV = new THREE.Vector3();
    function toScreen(x, y, z) {
      tmpV.set(x, y, z).project(camera);
      return { x: (tmpV.x + 1) / 2 * Wd, y: (1 - tmpV.y) / 2 * Hd };
    }

    /* --- pixel wipe (loop transition) --- */
    function drawWipe(c) {
      wctx.clearRect(0, 0, wipe.width, wipe.height);
      if (c <= 0) return;
      var cs = Math.max(16, Math.round(26 * S)), nx = Math.ceil(Wd / cs) + 1, ny = Math.ceil(Hd / cs) + 1;
      for (var j = 0; j < ny; j++) for (var i2 = 0; i2 < nx; i2++) {
        var r = h2(i2 * 1.3, j * 0.7) * 0.55 + (1 - (j / ny)) * 0.25 + (i2 / nx) * 0.2;
        var k = clamp((c * 1.6 - r * 0.6), 0, 1);
        if (k <= 0) continue;
        var sz = Math.ceil(cs * k) + 1, px = Math.floor(i2 * cs + (cs - sz) / 2), py = Math.floor(j * cs + (cs - sz) / 2);
        wctx.fillStyle = ((i2 + j) & 1) ? '#e6f5ff' : '#d6eefd';
        wctx.fillRect(px, py, sz, sz);
        if (k < 1) { wctx.fillStyle = 'rgba(255,255,255,.7)'; wctx.fillRect(px, py, sz, Math.max(2, sz * 0.18)); }
      }
    }

    /* --- animation --- */
    var t0 = performance.now(), raf = 0;
    var HS = { x: 9.5, z: -21.5 }, HE = { x: 2.2, z: -11.6 };
    var HD = Math.sqrt((HE.x - HS.x) * (HE.x - HS.x) + (HE.z - HS.z) * (HE.z - HS.z));
    var target = new THREE.Vector3(2.5, 4, -10);
    var lastXP = -1, lastChk = -1;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var t = typeof window.__SCENE_TIME === 'number' ? window.__SCENE_TIME : (typeof window.__animT === 'number' ? window.__animT : ((now - t0) / 1000) % LOOP);
      t = ((t % LOOP) + LOOP) % LOOP;
      var te = t >= 3.34 ? 0 : t;       // story time (reset under the pixel wipe)
      var ph = t * TAU / LOOP;
      var amp = reduced ? 0.2 : 1;

      // camera: gentle orbit + breathing dolly, periodic
      var yaw = (22 + 2.2 * Math.sin(ph) * amp) * Math.PI / 180;
      var elv = (43 + 0.8 * Math.sin(ph * 2 + 0.6) * amp) * Math.PI / 180;
      var dist = 300 - 6 * (0.5 - 0.5 * Math.cos(ph)) * amp;
      camera.position.set(target.x + Math.sin(yaw) * Math.cos(elv) * dist, target.y + Math.sin(elv) * dist, target.z + Math.cos(yaw) * Math.cos(elv) * dist);
      camera.lookAt(target);

      // water shimmer: flowing bands + glints
      var wcA = water.instanceColor.array, fcA = fallMesh.instanceColor.array;
      for (var k = 0; k < NW; k++) {
        var wv = WV[k];
        var wave = Math.sin(wv[0] * 0.55 + wv[1] * 0.35 - ph * 2) * 0.5 + 0.5;
        var wave2 = Math.sin(wv[0] * 0.23 - wv[1] * 0.6 - ph) * 0.5 + 0.5;
        var lift = wave * 0.1 + wave2 * 0.06 + (wave > 0.93 ? 0.18 : 0);
        wcA[k * 3] = waterBase[k * 3] + lift; wcA[k * 3 + 1] = waterBase[k * 3 + 1] + lift; wcA[k * 3 + 2] = Math.min(1, waterBase[k * 3 + 2] + lift * 0.6);
      }
      for (k = 0; k < glintIdx.length; k++) {
        var gi = glintIdx[k], gp = Math.sin(ph * 2 + k * 2.1);
        if (gp > 0.75) { var gk = (gp - 0.75) * 4; wcA[gi * 3] += gk * 0.5; wcA[gi * 3 + 1] += gk * 0.35; wcA[gi * 3 + 2] += gk * 0.2; }
      }
      for (k = 0; k < NF; k++) {
        var fv = FV[k], ii = NW + k;
        var band = ((fv[3] + t * 10 / LOOP * 4 + Math.floor(h2(fv[4], 1) * 2.2)) % 4 + 4) % 4;
        var foam = band < 1 ? 0.26 : (band < 1.6 ? 0.1 : 0);
        fcA[k * 3] = Math.min(1, waterBase[ii * 3] + foam); fcA[k * 3 + 1] = Math.min(1, waterBase[ii * 3 + 1] + foam); fcA[k * 3 + 2] = waterBase[ii * 3 + 2];
      }
      water.instanceColor.needsUpdate = true; fallMesh.instanceColor.needsUpdate = true;

      placeClouds(t);

      // smoke + butterflies
      for (k = 0; k < NSM; k++) {
        var sp = ((t / LOOP) * 2 + k / NSM) % 1;
        var ss = (0.6 + sp * 1.4) * (1 - sstep(0.75, 1, sp)) * sstep(0, 0.12, sp);
        dummy.position.set(15 + sp * 3.5 + Math.sin(sp * 6 + k) * 0.5, 17.5 + sp * 9, -31 + sp * 1.5);
        dummy.rotation.set(sp * 2, sp * 3, 0); dummy.scale.set(ss, ss, ss); dummy.updateMatrix();
        dyn.setMatrixAt(k, dummy.matrix);
      }
      for (k = 0; k < 2; k++) {
        var bph = ph + k * 2.4, cx = k ? 13 : -15, cz = k ? 9 : 14;
        var bxp = cx + Math.sin(bph) * 3, byp = 4 + Math.sin(bph * 2) * 1.2 + (k ? 0.5 : 0), bzp = cz + Math.sin(bph * 2 + 1) * 2;
        var flap = Math.sin(t * 40 + k) * 0.9;
        for (var wgi = 0; wgi < 2; wgi++) {
          var sgn = wgi ? 1 : -1;
          dummy.position.set(bxp + sgn * Math.cos(flap) * 0.45, byp + Math.abs(Math.sin(flap)) * 0.4, bzp);
          dummy.rotation.set(0, Math.cos(bph) * 0.8, sgn * flap); dummy.scale.set(0.8, 0.12, 0.7); dummy.updateMatrix();
          dyn.setMatrixAt(NSM + k * 2 + wgi, dummy.matrix);
        }
      }
      dyn.instanceMatrix.needsUpdate = true;

      /* ---- hero ---- */
      var wk = clamp(te / 1.2, 0, 1);
      var wpos = wk < 0.85 ? wk / 0.85 * 0.9 : 0.9 + outCubic((wk - 0.85) / 0.15) * 0.1;
      var hx = lerp(HS.x, HE.x, wpos), hz = lerp(HS.z, HE.z, wpos);
      var walkEnv = sstep(0, 0.08, te) * (1 - sstep(1.0, 1.22, te));
      var stride = wpos * HD * TAU / 3.4;
      var sw = Math.sin(stride) * walkEnv;
      hero.root.position.set(hx, 1, hz);
      var faceWalk = Math.atan2(HE.x - HS.x, HE.z - HS.z);
      hero.root.rotation.y = lerp(faceWalk, -0.18, sstep(1.05, 1.5, te));
      hero.legL.rotation.x = sw * 0.62; hero.legR.rotation.x = -sw * 0.62;
      hero.armL.rotation.x = -sw * 0.55; hero.armR.rotation.x = sw * 0.55;
      hero.armL.rotation.z = 0; hero.armR.rotation.z = 0;
      var bob = Math.abs(Math.cos(stride)) * 0.45 * walkEnv;
      var hop = te > 2.38 && te < 2.86 ? Math.sin((te - 2.38) / 0.48 * Math.PI) : 0;
      hero.bodyG.position.y = bob + hop * 2.6 + (walkEnv < 0.5 ? Math.sin(t * 5) * 0.08 : 0);
      hero.legL.position.y = 4 + hop * 2.6; hero.legR.position.y = 4 + hop * 2.6;
      if (hop > 0) {
        hero.armL.rotation.x = -2.7 * Math.min(1, hop * 2); hero.armR.rotation.x = -2.7 * Math.min(1, hop * 2);
        hero.armL.rotation.z = -0.25 * hop; hero.armR.rotation.z = 0.25 * hop;
        hero.legL.rotation.x = -0.35 * hop; hero.legR.rotation.x = 0.25 * hop;
      }
      var watch = sstep(1.35, 1.6, te) * (1 - sstep(2.5, 2.8, te));
      hero.head.rotation.x = -0.18 * watch + Math.sin(stride * 2) * 0.03 * walkEnv;
      hero.head.rotation.y = 0.1 * watch;
      hero.head.rotation.z = Math.sin(te * 3) * 0.05 * (1 - walkEnv);

      /* ---- Mestre Tomé ---- */
      tome.bodyG.position.y = Math.sin(ph * 2) * 0.12;
      var point = sstep(0.72, 0.95, te) * (1 - sstep(1.4, 1.6, te));
      var conduct = sstep(1.38, 1.6, te) * (1 - sstep(2.3, 2.45, te));
      var cheer = te > 2.36 && te < 3.05 ? Math.sin((te - 2.36) / 0.69 * Math.PI) : 0;
      tome.armR.rotation.x = -1.45 * point - (1.9 + Math.sin(te * 14) * 0.18) * conduct - 2.6 * cheer;
      tome.armR.rotation.z = 0.25 * point + 0.15 * conduct;
      tome.armL.rotation.x = -(1.7 + Math.sin(te * 14 + 1.5) * 0.18) * conduct - 0.3 * cheer;
      tome.armL.rotation.z = -0.15 * conduct - Math.sin(te * 18) * 0.3 * cheer - 0.3 * cheer;
      tome.head.rotation.x = Math.sin(te * 9) * 0.06 * point - 0.12 * conduct;
      tome.head.rotation.y = 0.12 * point;
      tome.head.rotation.z = Math.sin(ph * 2) * 0.04;
      tome.legL.rotation.x = 0; tome.legR.rotation.x = 0;

      /* ---- beam assembly ---- */
      var bca = beam.instanceColor.array, landed = 0;
      for (k = 0; k < NB; k++) {
        var bi = beamInfo[k], u, s, x, y, z, rot = 0, flash = 0;
        if (te < bi.s - 0.12) { s = 0; x = bi.sx; y = bi.sy; z = bi.sz; }
        else if (te < bi.s) { s = 0.55 * outBack((te - (bi.s - 0.12)) / 0.12); x = bi.sx; y = bi.sy; z = bi.sz; rot = bi.spin; }
        else if (te < bi.L) {
          u = (te - bi.s) / (bi.L - bi.s);
          var e = outCubic(u), mx2 = (bi.sx + bi.tx) / 2, my2 = Math.max(bi.sy, bi.ty) + 4, mz2 = (bi.sz + bi.tz) / 2;
          var a1 = (1 - e) * (1 - e), a2 = 2 * (1 - e) * e, a3 = e * e;
          x = a1 * bi.sx + a2 * mx2 + a3 * bi.tx; y = a1 * bi.sy + a2 * my2 + a3 * bi.ty; z = a1 * bi.sz + a2 * mz2 + a3 * bi.tz;
          s = 0.55 + 0.45 * e; rot = bi.spin * (1 - e);
        } else {
          landed++;
          var lt = te - bi.L;
          x = bi.tx; z = bi.tz; y = bi.ty + Math.max(0, Math.sin(lt * 26) * Math.exp(-lt * 14) * 0.22);
          s = 1 + Math.exp(-lt * 12) * 0.18; flash = Math.exp(-lt * 7);
        }
        dummy.position.set(x, y, z); dummy.rotation.set(rot * 0.7, rot, rot * 0.4); dummy.scale.set(s, s, s); dummy.updateMatrix();
        beam.setMatrixAt(k, dummy.matrix);
        var flying = te >= bi.s - 0.12 && te < bi.L ? 1 : 0;
        var gold = flying ? 0.75 : 0;
        bca[k * 3] = lerp(bi.r, 1.0, gold) + flash * 0.6; bca[k * 3 + 1] = lerp(bi.g, 0.9, gold) + flash * 0.55; bca[k * 3 + 2] = lerp(bi.b, 0.45, gold) + flash * 0.4;
        // ghost slot
        var gs = te < bi.L ? 0.42 + 0.06 * Math.sin(te * 9 + k * 0.7) : 0;
        dummy.position.set(bi.tx, bi.ty, bi.tz); dummy.rotation.set(0, 0, 0); dummy.scale.set(gs, gs, gs); dummy.updateMatrix();
        ghost.setMatrixAt(k, dummy.matrix);
      }
      beam.instanceMatrix.needsUpdate = true; beam.instanceColor.needsUpdate = true; ghost.instanceMatrix.needsUpdate = true;
      var allIn = te - 2.36;
      beamMat.emissiveIntensity = (te > 1.3 && te < 2.36 ? 0.18 : 0) + (allIn > 0 ? 0.75 * Math.exp(-allIn * 3.2) * (0.75 + 0.25 * Math.cos(allIn * 18)) : 0);
      ghostMat.opacity = (0.62 + 0.2 * Math.sin(te * 9)) * (1 - sstep(2.2, 2.4, te));

      // sparks
      for (k = 0; k < NSP; k++) {
        var si = spInfo[k], tStart = si.src < 0 ? 2.36 : beamInfo[si.src].L, life = si.src < 0 ? 0.75 : 0.42;
        var lk = (te - tStart) / life, sx = 0, sy = -50, sz = 0, sc = 0;
        if (lk > 0 && lk < 1) {
          var ox = si.src < 0 ? 0.5 : beamInfo[si.src].tx, oy = si.src < 0 ? 2.6 : beamInfo[si.src].ty + 0.3, oz = si.src < 0 ? 0.5 : beamInfo[si.src].tz;
          var dd2 = si.sp * (lk - lk * lk * 0.45) * life;
          sx = ox + si.dx * dd2 * (si.src < 0 ? 1.6 : 1); sy = oy + si.dy * dd2 - lk * lk * 0.8; sz = oz + si.dz * dd2 * (si.src < 0 ? 1.2 : 1);
          sc = si.sz * (1 - lk);
        }
        dummy.position.set(sx, sy, sz); dummy.rotation.set(lk * 4, lk * 5, 0); dummy.scale.set(sc, sc, sc); dummy.updateMatrix();
        sparks.setMatrixAt(k, dummy.matrix);
      }
      sparks.instanceMatrix.needsUpdate = true;
      var gl = sstep(1.35, 1.9, te) * 0.42 + (allIn > 0 ? Math.exp(-allIn * 3.5) * 0.5 : 0);
      gl *= 1 - sstep(2.9, 3.2, te);
      glowMat.opacity = clamp(gl, 0, 1);
      var gsz = 10 + (allIn > 0 ? Math.min(1, allIn * 6) * 6 * Math.exp(-allIn * 2) : 0);
      glow.scale.set(gsz, gsz * 0.75, 1);

      renderer.render(scene, camera);

      /* ---- HUD ---- */
      var bubIn = sstep(0.8, 1.0, te), bubOut = 1 - sstep(2.9, 3.08, te);
      var bo = bubIn * bubOut;
      H.bub.style.opacity = bo.toFixed(3);
      if (bo > 0.001) {
        var tp = tome.root.position;
        var hp = toScreen(tp.x + 0.3, tp.y + 14, tp.z + 0.3);
        var bw = H.bub.offsetWidth, bh = H.bub.offsetHeight;
        var bxx = clamp(hp.x - bw * 0.3, 10 * S, Wd - bw - 10 * S);
        var minTop = H.quest.offsetTop + H.quest.offsetHeight + 22 * S;
        var byy = Math.max(minTop, hp.y - bh - 14 * S);
        var pop = bubIn < 1 ? outBack(bubIn) : 1;
        H.bub.style.transform = 'translate(' + bxx.toFixed(1) + 'px,' + byy.toFixed(1) + 'px) scale(' + (0.55 + 0.45 * pop).toFixed(3) + ')';
        H.tail.style.left = clamp(hp.x - bxx - 9 * S, 14 * S, bw - 32 * S).toFixed(1) + 'px';
      }
      var pt = clamp((te - 2.38) / 0.85, 0, 1);
      var pop2 = pt > 0 && pt < 1 ? (pt < 0.12 ? pt / 0.12 : 1 - sstep(0.62, 1, pt)) : 0;
      H.plus.style.opacity = pop2.toFixed(3);
      if (pop2 > 0) {
        var bp = toScreen(0.5, 5, 0.5);
        H.plus.style.transform = 'translate(' + (bp.x + 40 * S).toFixed(1) + 'px,' + (bp.y - 10 * S - outCubic(pt) * 80 * S).toFixed(1) + 'px) scale(' + (0.6 + 0.4 * outBack(clamp(pt / 0.2, 0, 1))).toFixed(3) + ')';
      }
      var xpk = sstep(2.5, 2.9, t) * (1 - sstep(3.12, 3.5, t));
      var xpv = Math.round(620 + 50 * xpk);
      H.fill.style.width = (62 + 5 * xpk).toFixed(2) + '%';
      H.glow.style.left = 'calc(' + (62 + 5 * xpk).toFixed(2) + '% - ' + (14 * S).toFixed(1) + 'px)';
      H.glow.style.opacity = (xpk > 0 && xpk < 1 ? 1 : (te > 2.9 && te < 3.2 ? 1 - sstep(2.9, 3.2, te) : 0)).toFixed(2);
      if (xpv !== lastXP) { H.txt.textContent = xpv + '/1000 XP'; lastXP = xpv; }
      var done = te >= 2.4 ? 1 : 0;
      if (done !== lastChk) {
        lastChk = done;
        H.chk.style.background = done ? '#4cc35e' : '#e4eaf4';
        H.chkI.style.opacity = done ? '1' : '0';
      }
      H.chk.style.transform = 'scale(' + (te > 2.4 && te < 2.7 ? 1 + 0.25 * Math.sin((te - 2.4) / 0.3 * Math.PI) : 1).toFixed(3) + ')';
      H.ring.style.opacity = (sstep(1.35, 1.55, te) * (1 - sstep(2.35, 2.6, te)) * (0.55 + 0.45 * Math.sin(te * 12))).toFixed(3);

      // pixel wipe: in 3.08→3.30, hold, out 3.38→3.58
      var wc2 = t < 3.08 ? 0 : (t < 3.3 ? sstep(3.08, 3.3, t) : (t < 3.38 ? 1 : 1 - sstep(3.38, 3.58, t)));
      drawWipe(wc2);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        scene.traverse(function (o) { if (o.isInstancedMesh && o.dispose) o.dispose(); });
        disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        host.innerHTML = '';
      }
    };
  }

  window.SCENES[ID] = { mount: mount };
})();
