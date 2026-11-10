/* Lista de ilustrações da apostila (Finanças · Nível 1). Cada uma monta uma pequena cena com o kit. */
(function () {
  var S = window.SHOTS = {};
  function face(o, ry) { o.root.rotation.y = ry; return o; }
  function smile(o, k) { o.mouth.scale.y *= k; return o; }
  function coinInHand(kit, who, r) {
    var c = kit.coin({ r: r || 0.1, th: 0.03 });
    c.rotation.x = Math.PI / 2; c.position.set(0, -0.08, 0.06); who.hand.add(c); return c;
  }

  /* ----- Dona Lia ----- */
  S['lia-acena'] = { w: 700, h: 900, az: 18, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), 0.15); g.add(L.root);
    L.arms[1].rotation.set(-0.25, 0, 0.14 + 2.45); L.head.rotation.z = -0.1; L.head.rotation.x = -0.06; smile(L, 1.5);
    L.arms[0].rotation.set(-0.15, 0, -0.2);
  } };
  S['lia-aponta'] = { w: 800, h: 900, az: 10, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), 0.55); g.add(L.root);
    L.arms[1].rotation.set(-1.25, 0, 0.55); L.arms[0].rotation.set(-0.3, 0, -0.2);
    L.head.rotation.set(-0.05, -0.25, 0.06); smile(L, 1.4);
  } };
  S['lia-aponta-esq'] = { w: 800, h: 900, az: -10, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), -0.55); g.add(L.root);
    L.arms[0].rotation.set(-1.25, 0, -0.55); L.arms[1].rotation.set(-0.3, 0, 0.2);
    L.head.rotation.set(-0.05, 0.25, -0.06); smile(L, 1.4);
  } };
  S['lia-coracao'] = { w: 700, h: 900, az: 15, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), 0.1); g.add(L.root);
    L.arms[0].rotation.set(-1.25, 0, -0.14 + 0.85); L.arms[1].rotation.set(-0.7, 0, 0.6);
    L.head.rotation.set(-0.04, 0.1, 0.1); smile(L, 1.3);
  } };
  S['lia-moeda'] = { w: 700, h: 900, az: 15, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), 0.2); g.add(L.root);
    L.arms[1].rotation.set(-1.75, 0, 0.25); L.arms[0].rotation.set(-0.2, 0, -0.2);
    var c = coinInHand(k, L, 0.13); c.position.set(0, -0.14, 0.02); c.rotation.set(Math.PI / 2 + 0.2, 0, 0);
    L.head.rotation.set(-0.02, 0.1, -0.06); smile(L, 1.4);
  } };
  S['lia-comemora'] = { w: 800, h: 900, az: 12, el: 10, build: function (k, g) {
    var L = face(k.makeLia(), 0.05); g.add(L.root);
    L.arms[0].rotation.set(-0.3, 0, -2.35); L.arms[1].rotation.set(-0.3, 0, 2.35);
    L.head.rotation.x = -0.12; smile(L, 1.9);
  } };
  S['lia-busto'] = { w: 700, h: 700, az: 15, el: 8, ground: false, pad: 0.02, build: function (k, g) {
    var L = face(k.makeLia(), 0.15); g.add(L.root); smile(L, 1.4);
    return { fit: new THREE.Box3(new THREE.Vector3(-0.42, 0.95, -0.3), new THREE.Vector3(0.42, 1.75, 0.3)) };
  } };

  /* ----- Herói ----- */
  S['heroi-pe'] = { w: 600, h: 900, az: 20, el: 10, build: function (k, g) {
    var H = face(k.makeHero(), 0.12); g.add(H.root); H.head.rotation.x = -0.08; smile(H, 1.3);
  } };
  S['heroi-comemora'] = { w: 700, h: 900, az: 15, el: 10, build: function (k, g) {
    var H = face(k.makeHero(), -0.15); g.add(H.root);
    H.arms[0].rotation.set(-0.4, 0, -2.45); H.arms[1].rotation.set(-0.4, 0, 2.45); H.head.rotation.x = -0.15; smile(H, 1.8);
    H.body.position.y = 0.06; H.legs[0].rotation.x = 0.25; H.legs[1].rotation.x = -0.15;
  } };
  S['heroi-pensa'] = { w: 600, h: 900, az: 20, el: 10, build: function (k, g) {
    var H = face(k.makeHero(), -0.25); g.add(H.root);
    H.arms[1].rotation.set(-2.15, 0.0, -0.75); H.head.rotation.set(-0.12, 0.15, 0.16); H.mouth.scale.y *= 0.6;
  } };
  S['heroi-moeda'] = { w: 600, h: 900, az: 20, el: 10, build: function (k, g) {
    var H = face(k.makeHero(), 0.35); g.add(H.root);
    H.arms[1].rotation.set(-1.35, 0, 0.12); coinInHand(k, H, 0.1);
    H.head.rotation.x = -0.05; smile(H, 1.4);
  } };
  S['heroi-busto'] = { w: 700, h: 700, az: 12, el: 6, ground: false, pad: 0.02, build: function (k, g) {
    var H = face(k.makeHero(), 0.0); g.add(H.root); smile(H, 1.4);
    return { fit: new THREE.Box3(new THREE.Vector3(-0.36, 0.78, -0.3), new THREE.Vector3(0.36, 1.52, 0.3)) };
  } };

  /* ----- potes e moedas ----- */
  ['doar', 'poupar', 'gastar'].forEach(function (n, i) {
    S['pote-' + n] = { w: 500, h: 600, az: 0, el: 12, build: function (k, g) { var j = k.jar(i, [2, 6, 4][i]); g.add(j); } };
  });
  S['potes-trio'] = { w: 1100, h: 600, az: 0, el: 12, build: function (k, g) {
    [0, 1, 2].forEach(function (i) { var j = k.jar(i, [2, 6, 4][i]); j.position.x = (i - 1) * 0.72; g.add(j); });
  } };
  S['potes-vazios'] = { w: 1100, h: 600, az: 0, el: 12, ground: false, build: function (k, g) {
    [0, 1, 2].forEach(function (i) { var j = k.jar(i, 0); j.position.x = (i - 1) * 0.72; g.add(j); });
  } };
  S['moedas'] = { w: 800, h: 600, az: 20, el: 28, build: function (k, g) { g.add(k.coinPile()); } };
  S['moeda'] = { w: 500, h: 500, az: 0, el: 6, ground: false, build: function (k, g) {
    var c = k.coin({ r: 0.5, th: 0.1 }); c.rotation.x = Math.PI / 2; c.position.y = 0.5; g.add(c);
  } };

  /* ----- mercado ----- */
  S['barraca-lia'] = { w: 1000, h: 900, az: 20, el: 14, build: function (k, g) {
    var st = k.liaStall(); g.add(st);
    var L = face(k.makeLia(), 0.2); L.root.position.set(0.95, 0, 0.95); g.add(L.root);
    L.arms[1].rotation.set(-0.25, 0, 0.14 + 2.45); smile(L, 1.5); L.head.rotation.z = -0.08;
    var b = k.barrel(); b.position.set(-1.05, 0, 0.6); g.add(b);
  } };
  S['barraca-brinquedos'] = { w: 900, h: 900, az: 20, el: 14, build: function (k, g) { g.add(k.toyStall()); } };
  S['banca-limonada'] = { w: 900, h: 900, az: 22, el: 12, build: function (k, g) {
    var st = k.lemonStand(); g.add(st);
    var H = face(k.makeHero(), 0.0); H.root.position.set(-0.1, 0, -0.55); g.add(H.root);
    H.arms[0].rotation.set(-0.9, 0, -0.1); H.arms[1].rotation.set(-0.9, 0, 0.1); smile(H, 1.6);
    var L = face(k.makeLia(), -0.6); L.root.position.set(1.3, 0, 0.6); g.add(L.root);
    L.arms[1].rotation.set(-1.3, 0, 0.15); var c = coinInHand(k, L, 0.1); c.rotation.set(Math.PI / 2 + 0.3, 0, 0);
    L.head.rotation.set(-0.05, 0, 0.05); smile(L, 1.3);
  } };
  S['capela'] = { w: 700, h: 800, az: 25, el: 16, build: function (k, g) { g.add(k.chapel()); var t = k.tree(0.9); t.position.set(1.35, 0, -0.2); g.add(t); } };
  S['casa'] = { w: 800, h: 700, az: 25, el: 18, build: function (k, g) { g.add(k.house(0xffe6cc, 0xd9573b)); var t = k.tree(0.8, 0x8fbf4f); t.position.set(-1.3, 0, 0.1); g.add(t); } };

  /* capa: Dona Lia e o Herói diante da barraca, com os três potes no balcão */
  S['capa'] = { w: 1200, h: 1000, az: 14, el: 12, build: function (k, g) {
    var st = k.liaStall(); st.position.set(0, 0, -0.55); g.add(st);
    var L = face(k.makeLia(), -0.35); L.root.position.set(0.85, 0, 0.5); g.add(L.root);
    L.arms[1].rotation.set(-0.25, 0, 0.14 + 2.45); smile(L, 1.5); L.head.rotation.set(-0.05, -0.15, -0.08);
    var H = face(k.makeHero(), 0.4); H.root.position.set(-0.95, 0, 0.75); g.add(H.root);
    H.arms[1].rotation.set(-1.35, 0, 0.12); coinInHand(k, H, 0.1); smile(H, 1.5);
    var tri = [0, 1, 2].map(function (i) { var j = k.jar(i, [2, 6, 4][i]); j.scale.setScalar(0.55); j.position.set(-0.2 + (i - 1) * 0.4, 0, 1.25); g.add(j); return j; });
    var b = k.barrel(); b.position.set(-1.7, 0, -0.3); g.add(b);
    var c2 = k.crate(g, 1.5, 0, -0.2, -0.3, k.FR.OR, 'or');
  } };

  /* mapa isométrico da jornada do nível */
  S['mapa'] = { w: 1500, h: 1100, az: 38, el: 34, outline: 0.02, shadow: 0.16, ground: false, build: function (k, g) {
    var W = 13, D = 10, R = k.rng;
    // ilha de blocos: grama em cima, terra nas laterais, pinos hexagonais na borda
    k.block(W, 0.5, D, 0xc98d5a, 0, -0.27, 0, 0, g, 0.18);
    k.block(W - 0.02, 0.14, D - 0.02, 0x7db35a, 0, -0.04, 0, 0, g, 0.07);
    for (var x = -W / 2 + 0.5; x <= W / 2 - 0.4; x += 1.0) { k.pin(g, x, 0.03, D / 2 - 0.25, 0xb6dd85); k.pin(g, x, 0.03, -D / 2 + 0.25, 0xb6dd85); }
    for (var z = -D / 2 + 1.25; z <= D / 2 - 1.2; z += 1.0) { k.pin(g, W / 2 - 0.25, 0.03, z, 0xb6dd85); k.pin(g, -W / 2 + 0.25, 0.03, z, 0xb6dd85); }
    [-1, 1].forEach(function (s) { k.bow(g, s * (W / 2 + 0.01), -0.27, 1.5, s * Math.PI / 2, k.COL.TEAL, 1.6); k.bow(g, s * (W / 2 + 0.01), -0.27, -1.5, s * Math.PI / 2, k.COL.TEAL, 1.6); });
    [-3, 0, 3].forEach(function (xx) { k.bow(g, xx, -0.27, D / 2 + 0.01, 0, k.COL.TEAL, 1.6); });
    // caminho em serpentina (paralelepípedos)
    var P = [[-6.3, 3.9], [-4.3, 3.6], [-1.0, 3.7], [2.4, 3.6], [4.9, 3.0], [5.2, 0.9], [3.8, 0.4], [1.6, 0.6], [-1.6, 0.5], [-3.8, -0.4], [-4.6, -2.0], [-3.2, -3.2], [-1.4, -3.4]];
    var stones = [0xf8e0c6, 0xf2d2b3, 0xfbe9d6, 0xeecaa9];
    function lerp(a, b, t) { return a + (b - a) * t; }
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.42);
      for (var j = 0; j < n; j++) {
        var t = j / n, px = lerp(a[0], b[0], t), pz = lerp(a[1], b[1], t), ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
        [-0.22, 0.22].forEach(function (off) {
          k.block(0.36, 0.06, 0.36, stones[(i + j + (off > 0 ? 1 : 0)) % 4], px + Math.cos(ang) * off + (R() - 0.5) * 0.04, 0.05, pz - Math.sin(ang) * off + (R() - 0.5) * 0.04, ang + (R() - 0.5) * 0.15, g, 0.05);
        });
      }
    }
    var mk = [];
    function put(o, x, z, ry, s) { o.position.set(x, 0.03, z); o.rotation.y = ry || 0; if (s) o.scale.setScalar(s); g.add(o); return o; }
    // 1 limonada (trabalho)
    var ls = put(k.lemonStand(), -4.3, 2.55, 0.1, 1.25);
    var hero = k.makeHero(); hero.root.position.set(-4.3, 0.03, 1.85); hero.root.scale.setScalar(1.05); g.add(hero.root);
    mk.push({ id: '1', pos: new THREE.Vector3(-4.0, 1.75, 2.45) });
    // 2 barraca da Dona Lia (três potes)
    put(k.liaStall(), -1.0, 2.35, 0, 1.0);
    var lia = k.makeLia(); lia.root.position.set(-0.05, 0.03, 3.0); lia.root.rotation.y = -0.5; g.add(lia.root);
    lia.arms[1].rotation.set(-0.25, 0, 2.55);
    mk.push({ id: '2', pos: new THREE.Vector3(-1.0, 2.15, 2.3) });
    // 3 brinquedos x frutas (necessidade e desejo)
    put(k.toyStall(), 2.5, 2.3, -0.08, 1.0);
    mk.push({ id: '3', pos: new THREE.Vector3(2.5, 2.15, 2.25) });
    // 4 esperar para comprar: pote grande de poupar num pedestal de blocos
    k.block(0.8, 0.5, 0.8, 0xfff1dc, 5.6, 0.28, 1.95, 0, g, 0.08); k.pin(g, 5.35, 0.53, 1.7, 0xf3e3cf); k.pin(g, 5.85, 0.53, 2.2, 0xf3e3cf);
    var jp = k.jar(1, 6); jp.position.set(5.6, 0.53, 1.95); jp.scale.setScalar(1.1); g.add(jp);
    var bench = new THREE.Group(); k.block(1.0, 0.1, 0.36, k.COL.WOOD3, 0, 0.36, 0, 0, bench, 0.04); [-0.4, 0.4].forEach(function (xx) { k.block(0.1, 0.32, 0.3, k.COL.BEAM, xx, 0.16, 0, 0, bench, 0.03); }); put(bench, 6.0, 0.6, -1.4);
    mk.push({ id: '4', pos: new THREE.Vector3(5.6, 1.45, 1.95) });
    // 5 contar moedas: mesa de caixa com moedas
    var tb = new THREE.Group(); k.block(0.95, 0.5, 0.6, k.COL.WOOD2, 0, 0.25, 0, 0, tb, 0.05); k.block(1.05, 0.07, 0.7, k.COL.WOOD3, 0, 0.53, 0, 0, tb, 0.03);
    var cp = k.coinPile(); cp.scale.setScalar(0.55); cp.position.set(0, 0.57, 0); tb.add(cp); put(tb, 2.0, -0.45, 0.2);
    var b1 = put(k.barrel(), 2.85, -0.7); var b2 = put(k.barrel(), 1.1, -0.85);
    mk.push({ id: '5', pos: new THREE.Vector3(2.0, 0.85, -0.45) });
    // missão: a casa da família
    put(k.house(0xffe6cc, 0xd9573b), -1.6, -1.25, 0.15, 1.0);
    mk.push({ id: 'M', pos: new THREE.Vector3(-1.6, 2.05, -1.25) });
    // chefão: coreto
    put(k.gazebo(), -1.0, -3.55, 0, 1.0);
    mk.push({ id: 'C', pos: new THREE.Vector3(-1.0, 2.15, -3.55) });
    // capelinha (doar), chafariz, árvores
    put(k.chapel(), 3.9, -3.1, -0.3, 0.95);
    put(k.fountain(), -4.4, 0.9, 0, 0.7);
    [[-5.7, -3.8, 1.0, 0x7fae4a], [-5.6, -1.2, 0.85, 0x8fbf4f], [-3.0, -2.0, 0.75, 0xe8a23b], [1.4, -3.9, 0.9, 0x9cc456], [5.6, -3.7, 0.95, 0x6f9e44], [5.7, -1.6, 0.8, 0x8fbf4f], [0.4, -1.9, 0.7, 0x7fae4a], [-5.8, 1.6, 0.8, 0x9cc456], [4.3, 4.3, 0.7, 0xe8a23b], [0.8, 4.4, 0.6, 0x7fae4a], [-2.6, 4.4, 0.65, 0x8fbf4f]].forEach(function (t) { put(k.tree(t[2], t[3]), t[0], t[1], R() * 3); });
    [[-2.7, 2.3], [0.55, 1.8], [4.1, 2.5]].forEach(function (q) { var c = k.crate(g, q[0], 0.03, q[1], R(), k.FR.OR, 'or', 0.42, 0.32); });
    return { markers: mk };
  } };
})();
