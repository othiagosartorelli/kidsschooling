/* KidsSchooling — protótipo jogável: "Consertar a ponte da Vila do Riacho" (Engenharia civil · Nível 1).
   Estados: título → exploração → aula (diálogo + exercício) → construção → teste de carga → chefão → recompensa.
   three.js r128 global. Progresso salvo em localStorage (KS.store). */
(function () {
  'use strict';
  var KS = window.KS, u = KS.u, clamp = u.clamp, sstep = u.sstep, lerp = u.lerp, el = KS.el, I = KS.icons, B = KS.BRIDGE;

  /* sem three.js (sem internet) ou sem WebGL: mostra um aviso amigável em vez de uma tela vazia */
  function fatal(msg) {
    var ld = document.getElementById('loading');
    if (ld) ld.querySelector('span').innerHTML = msg;
  }
  if (!window.THREE) { fatal('Não foi possível carregar o jogo. Verifique a internet e toque para tentar de novo.'); document.addEventListener('click', function () { location.reload(); }); return; }

  /* ================= dados da missão ================= */
  var SKILLS = [
    { code: 'ENG-EST', nome: 'Estruturas' },
    { code: 'ENG-DES', nome: 'Desenho técnico' },
    { code: 'ENG-MAT', nome: 'Materiais' }
  ];
  var LEVELS = [0, 200, 500, 900, 1400, 2000, 2700, 3500];
  var LEVEL_NAMES = ['Aprendiz', 'Aprendiz', 'Explorador', 'Explorador', 'Mestre', 'Mestre', 'Mestre'];
  var BRONZE = 100; // XP numa skill para o distintivo bronze
  var REAL_MISSION_XP = 50;

  var LESSON = [
    { t: 'Olá! Eu sou o <b>Mestre Tomé</b>, construtor da vila. A enchente levou o meio da nossa ponte!', ill: 'gap' },
    { t: 'Toda ponte descansa sobre <b>apoios</b>: partes firmes, como as pedras da margem e os pilares.', ill: 'apoio' },
    { t: 'A <b>viga</b> é a peça deitada que vence o vão. Ela precisa se apoiar <b>dos dois lados</b>, senão cai!', ill: 'viga' },
    { t: 'Se o vão é grande, pomos um <b>pilar</b> no meio. Ele segura as vigas e leva o peso até o chão.', ill: 'pilar' }
  ];
  var QUIZ = [
    { id: 'aula-q1', q: 'Onde a viga precisa se apoiar?', o: ['Só de um lado', 'Nos dois lados', 'Em lugar nenhum: ela flutua'], c: 1,
      ok: 'Isso! Com apoio dos dois lados, a viga fica firme.', no: 'Ainda não. Se faltar apoio de um lado, a viga tomba. Tente de novo!' },
    { id: 'aula-q2', q: 'Para que serve o pilar?', o: ['Para enfeitar a ponte', 'Para segurar a viga e levar o peso até o chão', 'Para a água correr mais rápido'], c: 1,
      ok: 'Perfeito! O pilar é um apoio no meio do vão.', no: 'Quase! Pense: o que fica embaixo da viga, segurando o peso?' }
  ];

  /* ================= salvamento ================= */
  function fresh() {
    return { v: 1, hero: { girl: false, skin: 0 }, xp: { 'ENG-EST': 0, 'ENG-DES': 0, 'ENG-MAT': 0 }, got: {}, flags: { lesson: false, built: false, tested: false, boss: false },
      placed: {}, volume: 0.7, bossTries: 0, badges: [], realMission: 'bloqueada' };
  }
  var save = fresh();
  (function () {
    var s = KS.store.load();
    if (s && s.v === 1) { for (var k in save) if (s[k] !== undefined) save[k] = s[k]; }
  })();
  function persist() { KS.store.save(save); }
  function totalXP() { var t = 0; for (var k in save.xp) t += save.xp[k]; return t; }
  function levelOf(xp) { var l = 0; while (l < LEVELS.length - 1 && xp >= LEVELS[l + 1]) l++; return l; }
  KS.audio.setVolume(save.volume);

  /* ================= renderer, cena e câmera ================= */
  var stage = document.getElementById('stage'), hudRoot = document.getElementById('hud');
  var Wd = stage.clientWidth || window.innerWidth, Hd = stage.clientHeight || window.innerHeight;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { fatal('Este aparelho não conseguiu abrir os gráficos 3D (WebGL). Tente em outro navegador.'); return; }
  var cores = navigator.hardwareConcurrency || 4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
  renderer.setSize(Wd, Hd, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x8fcf6a);
  stage.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd9efd0, 30, 52);
  var camera = new THREE.PerspectiveCamera(30, Wd / Hd, 0.3, 200);

  var hemi = new THREE.HemisphereLight(0xd6ecff, 0x7f9f62, 0.6); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffe2b5, 0.86);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  var sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 34;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  var back = new THREE.DirectionalLight(0xbfe0ff, 0.28); scene.add(back);

  var K = KS.makeKit(scene);
  var W = KS.buildWorld(scene, K);

  /* personagens */
  var hero = null;
  function makeHero() {
    var old = hero;
    hero = K.buildHero(save.hero);
    scene.add(hero.g);
    if (old) { hero.g.position.copy(old.g.position); hero.g.rotation.y = old.g.rotation.y; scene.remove(old.g); }
    hero.path = null; hero.speed = 0; hero.stepPh = 0;
  }
  makeHero();
  var HERO_START = new THREE.Vector3(0.55, 0, 6.3);
  hero.g.position.copy(HERO_START); hero.g.rotation.y = Math.PI;
  var tome = K.buildTome(); scene.add(tome.g);
  tome.g.position.copy(W.TOME_P); tome.baseRy = -0.35; tome.g.rotation.y = tome.baseRy;
  var TOME_WATCH = new THREE.Vector3(-1.25, 0, 2.75); // no chefão ele assiste de longe, fora do quadro
  var TOME_BUILD = new THREE.Vector3(2.5, 0, 2.3); // na construção ele vai para a beira do rio, fora do caminho da câmera
  var guard = K.buildGuardian(); scene.add(guard.g);
  guard.g.position.copy(W.GUARD_P); guard.g.scale.setScalar(0.68);

  /* setas de força (teste de carga) */
  function arrow(col) {
    var g = new THREE.Group();
    var mt = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false });
    var sh = new THREE.Mesh(K.gCyl, mt); sh.scale.set(0.045, 0.42, 0.045); sh.position.y = 0.36; g.add(sh);
    var hd = new THREE.Mesh(K.gCone, mt); hd.scale.set(0.12, 0.2, 0.12); hd.position.y = 0.1; hd.rotation.x = Math.PI; g.add(hd);
    sh.renderOrder = hd.renderOrder = 9; g.visible = false; scene.add(g); return g;
  }
  var loadArrow = arrow(0xff8a2a);
  var reactArrows = [-B.JOINT, 0, B.JOINT].map(function (z) { var a = arrow(0x43c59e); a.rotation.x = Math.PI; a.position.set(0.95, -0.05, z); return a; });

  /* anel de toque no chão */
  var tapRing = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  tapRing.renderOrder = 4; scene.add(tapRing); var tapT = 1;

  /* materiais próprios por encaixe (para destacar os da peça escolhida) */
  W.ghostLine.depthTest = false;
  W.slots.forEach(function (s) {
    s.gmats = [];
    s.ghost.traverse(function (o) {
      // holograma: aparece por cima da água (o pilar fica quase todo submerso)
      if (o.isMesh) { o.material = W.ghostFill.clone(); o.material.depthTest = false; s.gmats.push(o.material); }
      o.renderOrder = 6;
    });
    s.anim = null;
    s.mark = el('div', 'ks-slotmark ks-hide', '<i></i>', hudRoot);
  });
  function slotScreenY(s) { return s.type === 'pilar' ? B.PIER_Y1 - 0.05 : s.pos.y + 0.05; }

  /* ================= paleta por momento (dia na vila × entardecer do chefão) ================= */
  var PAL = {
    day: { hs: 0xd6ecff, hg: 0x7f9f62, hi: 0.6, sc: 0xffe2b5, si: 0.86, sd: [-5.5, 11, 1.5], bc: 0xbfe0ff, bi: 0.28, fog: 0xd9efd0, clear: 0x8fcf6a, top: 0x8fcaf5, mid: 0xd9efd0, bot: 0xd9efd0, rim: 0xfff1d6, rs: 0.42, sunStr: 0.0, wem: 0x1b6f9a },
    dusk: { hs: 0xc7a6e8, hg: 0x6a4a5a, hi: 0.55, sc: 0xffa45a, si: 1.05, sd: [2.5, 4.2, -9], bc: 0xc4a8ff, bi: 0.55, fog: 0xd99a9a, clear: 0x8a5a7e, top: 0x4b2f7a, mid: 0xffa66b, bot: 0xd99a9a, rim: 0xffc27a, rs: 0.75, sunStr: 1.0, wem: 0x7a3f6a }
  };
  var palK = 0, palTarget = 0;
  var cA = new THREE.Color(), cB = new THREE.Color();
  function mixC(a, b, k, out) { return out.copy(cA.set(a)).lerp(cB.set(b), k); }
  var sunDir = new THREE.Vector3();
  function applyPalette() {
    var a = PAL.day, b = PAL.dusk, k = palK;
    mixC(a.hs, b.hs, k, hemi.color); mixC(a.hg, b.hg, k, hemi.groundColor); hemi.intensity = lerp(a.hi, b.hi, k);
    mixC(a.sc, b.sc, k, sun.color); sun.intensity = lerp(a.si, b.si, k);
    sunDir.set(lerp(a.sd[0], b.sd[0], k), lerp(a.sd[1], b.sd[1], k), lerp(a.sd[2], b.sd[2], k));
    mixC(a.bc, b.bc, k, back.color); back.intensity = lerp(a.bi, b.bi, k);
    mixC(a.fog, b.fog, k, scene.fog.color);
    renderer.setClearColor(mixC(a.clear, b.clear, k, new THREE.Color()));
    mixC(a.top, b.top, k, W.skyU.uTop.value); mixC(a.mid, b.mid, k, W.skyU.uMid.value); mixC(a.bot, b.bot, k, W.skyU.uBot.value);
    W.skyU.uSunStr.value = lerp(a.sunStr, b.sunStr, k); W.skyU.uSun.value.set(0.25, 0.12, -1).normalize();
    mixC(a.rim, b.rim, k, K.rimU.uRimColor.value); K.rimU.uRimStr.value = lerp(a.rs, b.rs, k);
    mixC(a.wem, b.wem, k, W.waterMat.emissive);
  }

  /* ================= HUD ================= */
  var S = 1;
  var vig = el('div', 'ks-vig', null, hudRoot), bpv = el('div', 'ks-bpv', null, hudRoot), dusk = el('div', 'ks-dusk', null, hudRoot), frame = el('div', 'ks-frame', null, hudRoot);
  var markTome = el('button', 'ks-mark ks-hide', '<i>!</i>', hudRoot); markTome.setAttribute('aria-label', 'Falar com o Mestre Tomé');
  var markGap = el('button', 'ks-mark ks-build ks-hide', '<i>' + I.build + '</i>', hudRoot); markGap.setAttribute('aria-label', 'Ir consertar a ponte');
  var markGuard = el('button', 'ks-mark ks-hide', '<i>!</i>', hudRoot); markGuard.setAttribute('aria-label', 'Atravessar a ponte');
  var dim3d = el('div', 'ks-dim3d ks-hide', 'vão: 2,2 m', hudRoot);

  var top = el('div', 'ks-top ks-card ks-out', '<div class="ks-ava"></div><div class="ks-stat"><div class="ks-ttl"></div><div class="ks-bar"><div class="ks-fill"></div><div class="ks-flash"></div></div><div class="ks-xpn"><span>Experiência</span><span class="ks-xpv"></span></div></div><button class="ks-pause" aria-label="Pausa">' + I.pause + '</button>', hudRoot);
  var elAva = top.querySelector('.ks-ava'), elTtl = top.querySelector('.ks-ttl'), elFill = top.querySelector('.ks-fill'), elFlash = top.querySelector('.ks-flash'), elXpv = top.querySelector('.ks-xpv');
  var quest = el('div', 'ks-quest ks-card ks-out', '<div class="ks-qi">' + I.quest + '</div><div class="ks-qt"></div>', hudRoot);
  var elQt = quest.querySelector('.ks-qt');
  var btns = el('div', 'ks-btns ks-out', '<button class="ks-btn ks-card ks-pri" data-a="build"><i>' + I.build + '</i>Construir</button><button class="ks-btn ks-card" data-a="bag"><i style="background:#fff0e0">' + I.bag + '</i>Mochila</button><button class="ks-btn ks-card" data-a="map"><i style="background:#e6f5dc">' + I.map + '</i>Mapa</button>', hudRoot);
  var btnBuild = btns.querySelector('[data-a=build]');
  var dlg = el('div', 'ks-dlg ks-card ks-out', '', hudRoot);
  var chal = el('div', 'ks-chal ks-card ks-out', '<div class="ks-chh"><span class="ks-mode">' + I.grid + 'Modo construção</span><span class="ks-trk">Engenharia civil · Nível 1</span><button class="ks-x" aria-label="Sair da construção">' + I.close + '</button></div>' +
    '<div class="ks-cht">Conserte o vão de <b>2,2 m</b> da ponte</div><div class="ks-steps"></div>', hudRoot);
  var elSteps = chal.querySelector('.ks-steps');
  var tip = el('div', 'ks-tip ks-card ks-out', '<div class="ks-nm">' + I.helmet + 'Mestre Tomé</div><div class="ks-say"></div>', hudRoot);
  var elTip = tip.querySelector('.ks-say');
  var pal = el('div', 'ks-pal ks-card ks-out', '<button class="ks-tool" data-t="viga"><em></em><i>' + I.viga + '</i>Viga</button><button class="ks-tool" data-t="pilar"><em></em><i>' + I.pilar + '</i>Pilar</button><button class="ks-tool" data-t="trava"><em></em><i>' + I.trava + '</i>Trava</button><span class="ks-sep"></span><button class="ks-test" disabled><i>' + I.play + '</i>Testar<br>carga</button>', hudRoot);
  var btnTest = pal.querySelector('.ks-test');
  var loadCard = el('div', 'ks-load ks-card ks-out', '<i>' + I.weight + '</i><div><h3>Teste de carga</h3><p>O peso desce pelas vigas até os apoios.</p><div class="ks-meter"><b></b></div></div>', hudRoot);
  var elMeter = loadCard.querySelector('.ks-meter b');
  var ban = el('div', 'ks-ban ks-hide', '<i>' + I.lock + '</i>Modo prova · <b>Chefão</b>', hudRoot);
  var bq = el('div', 'ks-bq ks-card ks-out', '', hudRoot);
  var ans = el('div', 'ks-ans ks-card ks-out', '<label for="ks-ta">Sua resposta (escreva com suas palavras)</label><textarea id="ks-ta" class="ks-ta" maxlength="400" placeholder="A viga precisa de apoio dos dois lados porque…"></textarea>' +
    '<div class="ks-row" style="align-items:center"><button class="ks-mic" aria-label="Responder por voz (disponível no app)">' + I.mic + '</button><span class="ks-micnote">Voz: disponível no app</span><button class="ks-go ks-green ks-send">Responder ' + I.arrow + '</button></div>', hudRoot);
  var ta = ans.querySelector('textarea'), btnSend = ans.querySelector('.ks-send');
  var doneBar = el('div', 'ks-ans ks-card ks-out', '<button class="ks-go" data-b="rw" style="width:100%">Ver recompensas ' + I.arrow + '</button>', hudRoot);
  var toastEl = el('div', 'ks-toast', '', hudRoot);
  // pausa flutuante para os momentos em que a barra de cima some (teste de carga e chefão)
  var fpause = el('button', 'ks-pause ks-card ks-fpause ks-hide', I.pause, hudRoot); fpause.setAttribute('aria-label', 'Pausa');
  var titleEl = el('div', 'ks-title ks-hide', '', hudRoot);
  var modal = el('div', 'ks-modal ks-hide', '', hudRoot);
  var reward = el('div', 'ks-reward ks-hide', '', hudRoot);
  var seal = null;

  function setOut(e, out) { e.classList.toggle('ks-out', !!out); }
  function show(e, on) { e.classList.toggle('ks-hide', !on); }
  var toastT = 0;
  function toast(msg, ms) { toastEl.classList.toggle('ks-high', mode === 'boss' || mode === 'build'); toastEl.innerHTML = msg; toastEl.classList.add('ks-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('ks-on'); }, ms || 2600); }

  function refreshTop(flash) {
    elAva.innerHTML = KS.avatarSVG(save.hero.girl, save.hero.skin) + '<span class="ks-lv">' + (levelOf(totalXP()) + 1) + '</span>';
    var t = totalXP(), l = levelOf(t), a = LEVELS[l], b = LEVELS[l + 1] || a + 1000;
    elTtl.innerHTML = 'Nível ' + (l + 1) + ' · <span>' + LEVEL_NAMES[l] + '</span>';
    elFill.style.width = (100 * clamp((t - a) / (b - a), 0, 1)).toFixed(1) + '%';
    elXpv.innerHTML = '<b>' + t + '</b> / ' + b + ' XP';
    if (flash) { elFlash.classList.remove('ks-run'); void elFlash.offsetWidth; elFlash.classList.add('ks-run'); }
  }
  function refreshQuest() {
    var f = save.flags, txt;
    if (!f.lesson) txt = '<b>Missão:</b> fale com o Mestre Tomé';
    else if (!f.built) txt = '<b>Missão:</b> conserte a ponte da vila';
    else if (!f.tested) txt = '<b>Missão:</b> faça o teste de carga';
    else if (!f.boss) txt = '<b>Missão:</b> atravesse a ponte';
    else txt = '<b>Missão cumprida:</b> a ponte está de pé!';
    if (elQt.innerHTML !== txt) { elQt.innerHTML = txt; quest.classList.remove('ks-bump'); void quest.offsetWidth; quest.classList.add('ks-bump'); }
  }
  /* XP: só por habilidade comprovada; cada etapa vale uma vez (chave em save.got) */
  function giveXP(key, skill, amount, sx, sy, label) {
    if (save.got[key]) return 0;
    save.got[key] = amount; save.xp[skill] = (save.xp[skill] || 0) + amount; persist();
    var f = el('div', 'ks-xpf', I.xp + '+' + amount + ' XP<small>' + (label || skill) + '</small>', hudRoot);
    f.style.left = (sx == null ? Wd / 2 : sx) + 'px'; f.style.top = (sy == null ? Hd * 0.42 : sy) + 'px';
    setTimeout(function () { f.remove(); }, 1700);
    KS.audio.play('xp');
    setTimeout(function () { refreshTop(true); }, 350);
    return amount;
  }

  /* ================= layout ================= */
  var aspect = Wd / Hd;
  function layout() {
    Wd = stage.clientWidth || window.innerWidth; Hd = stage.clientHeight || window.innerHeight;
    renderer.setSize(Wd, Hd, false);
    aspect = Wd / Hd; camera.aspect = aspect; camera.updateProjectionMatrix();
    S = clamp(Math.min(Wd / 390, Hd / 740), 0.82, 1.3);
    document.documentElement.style.setProperty('--s', S.toFixed(3));
  }
  layout();
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);

  var pv = new THREE.Vector3();
  function proj(x, y, z) { pv.set(x, y, z).project(camera); return { x: (pv.x + 1) / 2 * Wd, y: (1 - pv.y) / 2 * Hd, ok: pv.z < 1 && pv.z > -1 }; }
  function place(e, p, on) {
    var vis = on && p.ok && p.x > -40 && p.x < Wd + 40 && p.y > 0 && p.y < Hd;
    e.classList.toggle('ks-hide', !vis);
    if (vis) e.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
  }

  /* ================= câmera por momento ================= */
  var AZ = 35 * Math.PI / 180, EL = 53 * Math.PI / 180;
  var BOSS_CAM = { px: 0.7, py: 0.95, pz: 6.6, tx: 0.1, ty: 1.75, tz: 0.6, sh: 0.07 };
  var BUILD_CAM = { az: 24, el: 58, w: 3.7, sh: 0.09, tx: 0.05, tz: 0.05 };
  var TEST_CAM = { az: -90, el: 20, w: 4.4, sh: 0.0, ty: 0.55 };
  var camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3(), camFov = 30, wantFov = 30, camSpeed = 3;
  var camShift = 0, wantShift = 0; // desloca o enquadramento na tela (fração da altura; + = conteúdo desce)
  var shake = 0;
  function fitDist(worldW, fov) { var t = Math.tan(fov / 2 * Math.PI / 180); return aspect < 0.8 ? (worldW / 2) / (t * aspect) : (worldW * 0.75) / t; }
  function orbitPos(tgt, az, el2, dist, out) { return out.set(tgt.x + dist * Math.sin(az) * Math.cos(el2), tgt.y + dist * Math.sin(el2), tgt.z + dist * Math.cos(az) * Math.cos(el2)); }
  var wall = 0;
  function cameraWant(dt) {
    var hp = hero.g.position;
    camSpeed = 3; wantShift = 0;
    if (mode === 'title') {
      wantFov = 30;
      wantTgt.set(0.4, 0.6, 4.6);
      orbitPos(wantTgt, 0.25 + Math.sin(wall * 0.08) * 0.25, 22 * Math.PI / 180, fitDist(4.2, 30), wantPos);
      camSpeed = 2; wantShift = -0.06;
    } else if (mode === 'explore') {
      wantFov = 30;
      // antes da aula, o enquadramento puxa um pouco para o Mestre Tomé (o "!" fica sempre à vista)
      var fx = hp.x, fz = hp.z;
      if (!save.flags.lesson) { var tq = tome.g.position; fx = lerp(hp.x, tq.x, 0.4); fz = lerp(hp.z, tq.z, 0.4); }
      var tx = clamp(fx - Math.sin(AZ) * 0.6, -2.6, 2.6), tz = clamp(fz - Math.cos(AZ) * 0.6, -4.2, 7.0);
      wantTgt.set(tx, 0, tz);
      orbitPos(wantTgt, AZ, EL, fitDist(6.2, 30), wantPos);
      camSpeed = 4; wantShift = 0.03;
    } else if (mode === 'dialog') {
      var tp = tome.g.position, mx = (hp.x + tp.x) / 2, mz = (hp.z + tp.z) / 2;
      wantFov = 40;
      var dist = fitDist(3.1, 40);
      wantTgt.set(mx, 0.85, mz);
      orbitPos(wantTgt, DLG_AZ, 12 * Math.PI / 180, dist, wantPos);
      camSpeed = 2.6; wantShift = -0.2;
    } else if (mode === 'build') {
      wantFov = 30;
      wantTgt.set(BUILD_CAM.tx, 0, BUILD_CAM.tz);
      orbitPos(wantTgt, BUILD_CAM.az * Math.PI / 180, BUILD_CAM.el * Math.PI / 180, fitDist(BUILD_CAM.w, 30), wantPos);
      camSpeed = 2.6; wantShift = BUILD_CAM.sh;
    } else if (mode === 'test') {
      wantFov = 32;
      wantTgt.set(0, TEST_CAM.ty, clamp(hp.z, -2.2, 2.2));
      orbitPos(wantTgt, TEST_CAM.az * Math.PI / 180, TEST_CAM.el * Math.PI / 180, fitDist(TEST_CAM.w, 32), wantPos);
      camSpeed = 3; wantShift = TEST_CAM.sh;
    } else if (mode === 'awake' || mode === 'boss' || mode === 'reward') {
      // câmera baixa e dramática: atrás e ao lado do herói, olhando para cima, para o Guardião
      wantFov = 40;
      var gp = guard.g.position;
      wantTgt.set(gp.x + BOSS_CAM.tx, BOSS_CAM.ty, gp.z + BOSS_CAM.tz);
      wantPos.set(hp.x + BOSS_CAM.px, BOSS_CAM.py, hp.z + BOSS_CAM.pz);
      camSpeed = mode === 'awake' ? 1.1 : 2; wantShift = BOSS_CAM.sh;
    }
  }
  function updateCamera(dt) {
    cameraWant(dt);
    var k = u.damp(dt, camSpeed);
    camPos.lerp(wantPos, k); camTgt.lerp(wantTgt, k); camFov += (wantFov - camFov) * k; camShift += (wantShift - camShift) * k;
    camera.setViewOffset(Wd, Hd, 0, -camShift * Hd, Wd, Hd);
    camera.position.copy(camPos);
    if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 0.12); }
    camera.lookAt(camTgt);
    camera.fov = camFov; camera.updateProjectionMatrix();
    var cd = camPos.distanceTo(camTgt);
    scene.fog.near = cd * 0.9 + 6 + (palK * 2); scene.fog.far = cd + 26 + palK * 10;
    // sombra acompanha o alvo da câmera
    sun.target.position.set(camTgt.x, 0, camTgt.z);
    sun.position.copy(sun.target.position).add(sunDir);
    back.position.set(camTgt.x + 4 - 2 * palK, 5 - palK, camTgt.z - 8 + 16 * palK); // no entardecer vira luz de preenchimento pela frente
    W.sky.position.copy(camPos);
    W.cutaway(camPos, camTgt, camPos.y - camTgt.y < 4.5);
  }

  /* ================= estado do jogo ================= */
  var mode = 'title', paused = false;
  var tool = null, tipT = 0;
  var testT = 0, awakeT = 0;

  function applySaveToWorld() {
    W.slots.forEach(function (s) { var on = !!save.placed[s.id]; s.placed = on; s.piece.visible = on; s.ghost.visible = !on; s.piece.scale.setScalar(s.type === 'trava' ? 2.2 : 1); });
    W.bridgeFixed = !!save.flags.built;
    W.midRopes.forEach(function (r) { r.visible = W.bridgeFixed; });
    W.rebuildNav();
    guard.awake = save.flags.boss ? 1 : 0; guard.bow = 0;
  }

  /* ---------- tela inicial ---------- */
  function hasProgress() { return save.flags.lesson || totalXP() > 0 || Object.keys(save.placed).length > 0; }
  function renderTitle() {
    var h = save.hero;
    titleEl.innerHTML = '<div class="ks-logo"><div class="ks-logo-mark">' + I.logo + '<h1>Kids<span>Schooling</span></h1></div><p>Vila do Riacho · Engenharia civil · Nível 1</p><small>LOGO PROVISÓRIO · PROTÓTIPO</small></div>' +
      '<div class="ks-pick ks-card"><h2>Escolha seu herói</h2><div class="ks-pick-row"><div class="ks-pick-ava">' + KS.avatarSVG(h.girl, h.skin) + '</div><div class="ks-pick-ctl">' +
      '<div class="ks-seg" role="group" aria-label="Herói"><button data-g="0" aria-pressed="' + !h.girl + '">Menino</button><button data-g="1" aria-pressed="' + h.girl + '">Menina</button></div>' +
      '<div class="ks-skins" role="group" aria-label="Tom de pele"><span>Pele</span>' + KS.SKINS.map(function (s, i) { return '<button data-s="' + i + '" aria-label="Tom de pele ' + (i + 1) + '" aria-pressed="' + (h.skin === i) + '" style="background:' + s.css[0] + '"></button>'; }).join('') + '</div></div></div>' +
      (hasProgress() ? '<button class="ks-go ks-play" data-p="cont">Continuar ' + I.arrow + '</button><button class="ks-go ks-ghost ks-new" data-p="new">Novo jogo (apaga o progresso)</button>'
        : '<button class="ks-go ks-play" data-p="play">Jogar ' + I.play + '</button>') + '</div>';
  }
  titleEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    KS.audio.unlock();
    if (b.dataset.g != null) { save.hero.girl = b.dataset.g === '1'; makeHero(); renderTitle(); persist(); KS.audio.play('select'); }
    else if (b.dataset.s != null) { save.hero.skin = +b.dataset.s; makeHero(); renderTitle(); persist(); KS.audio.play('select'); }
    else if (b.dataset.p === 'play' || b.dataset.p === 'cont') { KS.audio.play('ok'); startGame(); }
    else if (b.dataset.p === 'new') {
      var hh = save.hero, vol = save.volume; save = fresh(); save.hero = hh; save.volume = vol; persist(); applySaveToWorld(); renderTitle(); KS.audio.play('tap');
    }
  });
  function enterTitle() {
    mode = 'title'; paused = false;
    [top, quest, btns, dlg, chal, tip, pal, loadCard, bq, ans, doneBar].forEach(function (e) { setOut(e, true); });
    show(ban, false); show(reward, false); show(modal, false); show(titleEl, true);
    hero.path = null; hero.g.position.copy(HERO_START); hero.g.rotation.y = 0.35;
    palTarget = 0; frame.style.opacity = 0; dusk.style.opacity = 0; bpv.style.opacity = 0;
    applySaveToWorld();
    renderTitle();
  }

  /* ---------- exploração ---------- */
  function startGame() {
    show(titleEl, false);
    applySaveToWorld();
    var f = save.flags;
    hero.g.position.copy(HERO_START); hero.g.rotation.y = Math.PI;
    if (f.lesson && !f.boss) hero.g.position.set(0.5, 0, 3.6);
    if (f.boss) hero.g.position.set(0, 0, -2.6);
    refreshTop(); refreshQuest();
    enterExplore();
    if (!f.lesson) setTimeout(function () { if (mode === 'explore') toast('Toque no chão para andar. Toque no <b>Mestre Tomé</b> (!) para conversar.', 4200); }, 900);
    else if (f.tested && !f.boss) setTimeout(function () { if (mode === 'explore') toast('Atravesse a ponte até o Guardião.', 3000); }, 700);
  }
  function enterExplore() {
    mode = 'explore'; tool = null;
    setOut(top, false); setOut(quest, false); setOut(btns, false);
    [dlg, chal, tip, pal, loadCard, bq, ans].forEach(function (e) { setOut(e, true); });
    show(ban, false); show(dim3d, false);
    W.grid.visible = false; bpv.style.opacity = 0; frame.style.opacity = 0;
    palTarget = 0; dusk.style.opacity = 0;
    tome.talk = 0; tome.point = 0; tome.conduct = 0; tome.cheer = 0;
    refreshQuest(); refreshTop();
  }
  function walkTo(x, z, onArrive, quiet) {
    var p = W.findPath(hero.g.position.x, hero.g.position.z, x, z);
    if (!p || p.length < 2) { if (onArrive) onArrive(); else if (!quiet) toast('Não dá para chegar ali.'); return; }
    hero.path = p; hero.pi = 1; hero.onArrive = onArrive || null;
  }
    function goToTome() {
    if (mode !== 'explore') return;
    KS.audio.play('tap');
    if (hero.g.position.distanceTo(DLG_SPOT) < 0.15) startLesson(); else walkTo(DLG_SPOT.x, DLG_SPOT.z, function () { if (mode === 'explore') startLesson(); });
  }
  var BRIDGE_SPOT = new THREE.Vector3(0, 0, 2.95);
  var HERO_BUILD = new THREE.Vector3(-2.0, 0, 1.9); // onde o herói assiste à construção (fora da frente da câmera)
  function goToBridge() {
    if (mode !== 'explore') return;
    if (!save.flags.lesson) { toast('Primeiro fale com o <b>Mestre Tomé</b> (toque nele).'); KS.audio.play('err'); return; }
    if (save.flags.tested) { toast('A ponte já está pronta! Atravesse até o Guardião.'); return; }
    KS.audio.play('tap');
    if (hero.g.position.distanceTo(BRIDGE_SPOT) < 0.5) enterBuild();
    else walkTo(BRIDGE_SPOT.x, BRIDGE_SPOT.z, function () { if (mode === 'explore') enterBuild(); });
  }
  markTome.addEventListener('click', function () { KS.audio.unlock(); goToTome(); });
  markGap.addEventListener('click', function () { KS.audio.unlock(); goToBridge(); });
  markGuard.addEventListener('click', function () { KS.audio.unlock(); if (mode === 'explore') walkTo(0, -2.75); });
  btns.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    KS.audio.unlock();
    if (b.dataset.a === 'build') goToBridge();
    else if (b.dataset.a === 'bag') { KS.audio.play('tap'); toast('<b>Mochila:</b> suas peças e ferramentas ficam aqui (em breve).'); }
    else if (b.dataset.a === 'map') { KS.audio.play('tap'); toast('<b>Mapa:</b> outras regiões abrem depois do chefão (em breve).'); }
  });

  /* ---------- aula com o Mestre Tomé ---------- */
  var lessonI = 0, quizI = 0, quizTries = 0;
  // posição fixa da conversa (dá um enquadramento bonito) e "trapaça de câmera": os dois viram um pouco para nós
  var DLG_SPOT = new THREE.Vector3(W.TOME_P.x - 1.0, 0, W.TOME_P.z + 0.42);
  var DLG_AZ = Math.atan2(0.42, 1.0); // perpendicular à linha herói–Tomé, do lado da câmera padrão
  function faceEachOther() {
    var hp = hero.g.position, tp = tome.g.position;
    hero.faceTo = u.angLerp(Math.atan2(tp.x - hp.x, tp.z - hp.z), DLG_AZ, 0.38);
    tome.faceTo = u.angLerp(Math.atan2(hp.x - tp.x, hp.z - tp.z), DLG_AZ, 0.38);
  }
  function startLesson() {
    mode = 'dialog'; hero.path = null;
    setOut(btns, true); setOut(quest, true);
    faceEachOther();
    if (save.flags.lesson) { lessonI = LESSON.length; quizI = QUIZ.length; renderOutro(true); }
    else { lessonI = 0; quizI = 0; renderLine(); }
    setOut(dlg, false);
  }
  function dots(n, i) { var s = '<div class="ks-step">'; for (var k = 0; k < n; k++) s += '<i class="' + (k <= i ? 'on' : '') + '"></i>'; return s + '</div>'; }
  function talk(sec) { tome.talk = 1; tome.talkUntil = wall + (sec || 1.6); for (var k = 0; k < 4; k++) setTimeout(function () { KS.audio.play('talk'); }, k * 110); }
  function renderLine() {
    var L = LESSON[lessonI];
    dlg.innerHTML = '<div class="ks-nm">' + I.helmet + 'Mestre Tomé</div>' + dots(LESSON.length + QUIZ.length, lessonI) +
      '<div class="ks-say">' + L.t + '</div><div class="ks-ill">' + KS.ILL[L.ill] + '</div>' +
      '<div class="ks-row"><button class="ks-go" data-d="next">Continuar ' + I.arrow + '</button></div>';
    tome.point = L.ill === 'gap' ? 1 : 0;
    talk(1.8);
  }
  function renderQuiz(fb) {
    var Q = QUIZ[quizI];
    var html = '<div class="ks-nm">' + I.helmet + 'Mestre Tomé</div>' + dots(LESSON.length + QUIZ.length, LESSON.length + quizI) +
      '<span class="ks-tag">' + I.quest + 'Exercício ' + (quizI + 1) + ' de ' + QUIZ.length + '</span><div class="ks-q">' + Q.q + '</div><div class="ks-opts">' +
      Q.o.map(function (o, i) { var cls = fb && fb.i === i ? (fb.ok ? ' ok' : ' no') : ''; return '<button class="ks-opt' + cls + '" data-o="' + i + '"' + (fb && fb.ok ? ' disabled' : '') + '><b>' + 'ABC'[i] + '</b>' + o + '</button>'; }).join('') + '</div>';
    if (fb) html += '<div class="ks-fb ' + (fb.ok ? 'ok' : 'no') + '">' + (fb.ok ? I.okc : I.hint) + '<span>' + (fb.ok ? Q.ok : Q.no) + '</span></div>';
    if (fb && fb.ok) html += '<div class="ks-row"><button class="ks-go" data-d="qnext">Continuar ' + I.arrow + '</button></div>';
    dlg.innerHTML = html;
  }
  function renderOutro(again) {
    dlg.innerHTML = '<div class="ks-nm">' + I.helmet + 'Mestre Tomé</div>' +
      '<div class="ks-say">' + (again ? (save.flags.built ? 'A ponte ficou ótima! Agora atravesse e fale com o <b>Guardião da Ponte Antiga</b>.' : 'Lembre: a viga precisa de apoio <b>dos dois lados</b>. Vá até a ponte e toque em <b>Construir</b>!')
        : 'Muito bem! Peguei as peças na bancada. Vá até o vão da ponte e toque em <b>Construir</b>.') + '</div>' +
      '<div class="ks-row"><button class="ks-go" data-d="end">' + (again ? 'Certo!' : 'Vamos lá!') + ' ' + I.arrow + '</button></div>';
    tome.point = 1; talk(1.6);
  }
  dlg.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || mode !== 'dialog' && mode !== 'awake') return;
    if (b.dataset.d === 'next') {
      KS.audio.play('tap');
      lessonI++;
      if (lessonI < LESSON.length) renderLine(); else { tome.point = 0; quizTries = 0; renderQuiz(); talk(1); }
    } else if (b.dataset.o != null) {
      var Q = QUIZ[quizI], i = +b.dataset.o, ok = i === Q.c;
      quizTries++;
      renderQuiz({ i: i, ok: ok });
      if (ok) {
        KS.audio.play('ok'); tome.cheer = 1; tome.cheerUntil = wall + 1.2; hero.cheer = 1; hero.cheerUntil = wall + 1.0;
        var r = b.getBoundingClientRect();
        giveXP(Q.id, 'ENG-EST', 10, r.left + r.width / 2, r.top - 10, 'Estruturas');
      } else { KS.audio.play('err'); }
    } else if (b.dataset.d === 'qnext') {
      KS.audio.play('tap');
      quizI++; quizTries = 0;
      if (quizI < QUIZ.length) renderQuiz(); else { save.flags.lesson = true; persist(); renderOutro(false); }
    } else if (b.dataset.d === 'end') {
      KS.audio.play('tap');
      setOut(dlg, true);
      enterExplore();
      if (!save.flags.built) setTimeout(function () { if (mode === 'explore') toast('Toque no ícone laranja sobre a ponte ou no botão <b>Construir</b>.', 3400); }, 500);
    } else if (b.dataset.d === 'gnext') {
      KS.audio.play('tap'); guardLine++; renderGuardIntro();
    }
  });

  /* ---------- modo construção ---------- */
  var STEPS = [{ t: 'pilar', n: 'Pilar' }, { t: 'viga', n: 'Vigas' }, { t: 'trava', n: 'Travas' }];
  function countType(t) { var n = 0, d = 0; W.slots.forEach(function (s) { if (s.type === t) { n++; if (s.placed) d++; } }); return { n: n, d: d }; }
  function allPlaced() { return W.slots.every(function (s) { return s.placed; }); }
  function refreshBuild() {
    var cur = null;
    elSteps.innerHTML = STEPS.map(function (st) {
      var c = countType(st.t), done = c.d === c.n; if (!done && !cur) cur = st.t;
      return '<span class="ks-st' + (done ? ' done' : (cur === st.t ? ' on' : '')) + '"><i>' + I.check + '</i>' + st.n + ' ' + c.d + '/' + c.n + '</span>';
    }).join('');
    Array.prototype.forEach.call(pal.querySelectorAll('.ks-tool'), function (b) {
      var c = countType(b.dataset.t); b.querySelector('em').textContent = c.n - c.d;
      b.classList.toggle('sel', tool === b.dataset.t); b.classList.toggle('used', c.n === c.d);
    });
    var ready = allPlaced();
    btnTest.disabled = !ready; btnTest.classList.toggle('ks-glow', ready && !save.flags.tested);
  }
  function showTip(html, kind, ms) {
    elTip.innerHTML = html; tip.classList.remove('ks-err', 'ks-good'); if (kind) tip.classList.add(kind);
    setOut(tip, false); tipT = wall + (ms ? ms / 1000 : 4.2);
    tome.talk = 1; tome.talkUntil = wall + 1.2;
  }
  function enterBuild() {
    mode = 'build'; hero.path = null; tool = null;
    hero.g.position.copy(HERO_BUILD); hero.faceTo = Math.atan2(-HERO_BUILD.x, -HERO_BUILD.z);
    setOut(btns, true); setOut(quest, true); setOut(top, true);
    setOut(chal, false); setOut(pal, false);
    W.grid.visible = true; bpv.style.opacity = 1;
    refreshBuild();
    KS.audio.play('whoosh');
    if (allPlaced()) showTip('A ponte está montada! Toque em <b>Testar carga</b>.', 'ks-good', 6000);
    else showTip('Escolha uma peça na barra de baixo e toque no encaixe azul certo. Comece pelo que <b>segura</b> a ponte!', null, 6500);
  }
  function exitBuild() { KS.audio.play('tap'); hero.g.position.copy(BRIDGE_SPOT); hero.faceTo = Math.PI; enterExplore(); }
  chal.querySelector('.ks-x').addEventListener('click', exitBuild);
  pal.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || mode !== 'build') return;
    if (b === btnTest) { if (!btnTest.disabled) startTest(); return; }
    var t = b.dataset.t, c = countType(t);
    if (c.d === c.n) { KS.audio.play('err'); showTip('Todas as peças de <b>' + t + '</b> já foram usadas.', null, 2600); return; }
    tool = tool === t ? null : t; KS.audio.play('select'); refreshBuild();
    if (tool) {
      var names = { viga: 'Viga: a peça deitada que vence o vão.', pilar: 'Pilar: o apoio que fica em pé, no meio do rio.', trava: 'Trava borboleta: une uma viga na outra.' };
      showTip(names[tool] + ' Agora toque no encaixe azul.', null, 3200);
    }
  });
  var BENCH_P = new THREE.Vector3(2.3, 0.7, 2.8);
  function tryPlace(s) {
    if (s.placed || s.anim) return;
    if (!tool) { KS.audio.play('err'); showTip('Primeiro escolha uma peça na barra de baixo: <b>viga</b>, <b>pilar</b> ou <b>trava</b>.', 'ks-err', 3600); return; }
    if (tool !== s.type) {
      KS.audio.play('err'); flashSlot(s);
      var why = { pilar: 'Esse encaixe fica <b>em pé</b>, dentro do rio: ele pede um <b>pilar</b>.', viga: 'Esse encaixe é <b>deitado</b> e vence o vão: ele pede uma <b>viga</b>.', trava: 'Esse encaixe pequeno <b>une as duas vigas</b>: ele pede uma <b>trava</b>.' };
      showTip(why[s.type], 'ks-err', 4200); return;
    }
    var missing = s.needs.filter(function (id) { return !W.slots.some(function (o) { return o.id === id && o.placed; }); });
    if (missing.length) {
      KS.audio.play('err');
      if (s.type === 'viga') { fallAnim(s); showTip('Opa! Sem o pilar, essa viga fica apoiada <b>só de um lado</b> e cai. Coloque o <b>pilar</b> primeiro!', 'ks-err', 5200); }
      else { flashSlot(s); showTip('A trava une uma viga na outra. Coloque as <b>duas vigas</b> primeiro.', 'ks-err', 4200); }
      return;
    }
    // encaixe!
    s.anim = { t: 0, kind: 'fly', from: BENCH_P.clone() };
    s.piece.visible = true; s.ghost.visible = false;
    tome.conduct = 1; tome.conductUntil = wall + 0.7;
    KS.audio.play('whoosh');
  }
  function flashSlot(s) { s.flash = 1; }
  function fallAnim(s) {
    var c = s.piece.clone(); c.visible = true; scene.add(c);
    fallers.push({ m: c, t: 0, base: s.pos.clone() });
  }
  var fallers = [];
  function onSnap(s) {
    s.placed = true; save.placed[s.id] = true; persist();
    var p = s.pos.clone(); if (s.type === 'pilar') p.y = B.PIER_Y1 + 0.05;
    K.burst(p, 14, 1, s.type === 'trava' ? 0.7 : 1.1);
    KS.audio.play('snap');
    var c = countType(s.type); if (c.d === c.n) tool = null;
    var msgs = { pilar: 'Isso! Agora cada viga terá apoio <b>dos dois lados</b>: o pilar antigo e o pilar novo.', viga: 'Encaixou! A viga está apoiada <b>nas duas pontas</b>.', trava: 'Clique! A <b>trava borboleta</b> prende uma viga na outra.' };
    refreshBuild();
    if (allPlaced()) {
      save.flags.built = true; W.bridgeFixed = true; W.rebuildNav(); persist();
      setTimeout(function () {
        W.midRopes.forEach(function (r) { r.visible = true; });
        K.burst(new THREE.Vector3(-0.78, 0.6, 0), 10, 0.8, 0.8); K.burst(new THREE.Vector3(0.78, 0.6, 0), 10, 0.8, 0.8);
        KS.audio.play('ok');
        var pp = proj(0, 0.5, 0);
        giveXP('construcao', 'ENG-DES', 15, pp.x, pp.y - 30, 'Desenho técnico');
        showTip('Ponte montada, seguindo o projeto! Coloquei as cordas. Agora toque em <b>Testar carga</b>.', 'ks-good', 8000);
        tome.cheer = 1; tome.cheerUntil = wall + 1.4;
        refreshBuild(); refreshQuest();
      }, 450);
    } else showTip(msgs[s.type], 'ks-good', 3600);
  }

  /* ---------- teste de carga ---------- */
  function startTest() {
    mode = 'test'; KS.audio.play('tap');
    setOut(chal, true); setOut(pal, true); setOut(tip, true); setOut(loadCard, false);
    W.grid.visible = false; bpv.style.opacity = 0.35;
    hero.g.position.copy(BRIDGE_SPOT);
    hero.path = [{ x: 0, z: 2.95 }, { x: 0, z: -2.75 }]; hero.pi = 1; hero.walkSpeed = 1.15;
    hero.onArrive = function () { finishTest(); };
    testT = 0; elMeter.style.width = '0%';
    loadArrow.visible = true; reactArrows.forEach(function (a) { a.visible = true; });
    KS.audio.play('creak');
  }
  function finishTest() {
    hero.walkSpeed = null;
    loadArrow.visible = false; reactArrows.forEach(function (a) { a.visible = false; });
    elMeter.style.width = '100%';
    save.flags.tested = true; persist();
    KS.audio.play('ok'); hero.cheer = 1; hero.cheerUntil = wall + 1.3;
    var hp = proj(hero.g.position.x, 1.8, hero.g.position.z);
    giveXP('teste-carga', 'ENG-EST', 15, hp.x, hp.y, 'Estruturas');
    setTimeout(function () { giveXP('teste-material', 'ENG-MAT', 10, hp.x, hp.y + 40, 'Materiais'); }, 500);
    loadCard.querySelector('h3').textContent = 'A ponte aguentou!';
    loadCard.querySelector('p').textContent = 'O peso desceu pelas vigas até o pilar e as margens.';
    setTimeout(startAwakening, 2000);
  }

  /* ---------- chefão: Guardião da Ponte Antiga ---------- */
  var guardLine = 0;
  var GUARD_LINES = [
    'Hmmm… Quem consertou a ponte? Eu sou o <b>Guardião da Ponte Antiga</b>.',
    'Construir é bom. <b>Entender</b> é melhor. Responda com suas palavras e o caminho se abrirá.'
  ];
  function startAwakening() {
    if (save.flags.boss) { enterExplore(); return; }
    mode = 'awake'; awakeT = 0; hero.path = null;
    hero.g.position.set(-0.2, 0, -2.75); hero.faceTo = Math.PI;
    setOut(loadCard, true); setOut(top, true); setOut(quest, true); setOut(btns, true);
    bpv.style.opacity = 0; palTarget = 1; dusk.style.opacity = 1;
    KS.audio.play('rumble'); shake = 0.12;
    guardLine = 0;
    setTimeout(function () { if (mode === 'awake') { renderGuardIntro(); setOut(dlg, false); } }, 2600);
  }
  function renderGuardIntro() {
    if (guardLine >= GUARD_LINES.length) { setOut(dlg, true); enterBoss(); return; }
    dlg.innerHTML = '<div class="ks-nm ks-guard">' + I.guard + 'Guardião da Ponte Antiga</div>' + dots(GUARD_LINES.length, guardLine) +
      '<div class="ks-say">' + GUARD_LINES[guardLine] + '</div><div class="ks-row"><button class="ks-go" data-d="gnext">' + (guardLine < GUARD_LINES.length - 1 ? 'Continuar' : 'Estou pronto!') + ' ' + I.arrow + '</button></div>';
    guard.talk = 1; guard.talkUntil = wall + 2;
  }
  function enterBoss() {
    mode = 'boss';
    show(ban, true); frame.style.opacity = 1;
    renderQuestion();
    setOut(bq, false); setOut(ans, false);
    ta.value = ''; btnSend.disabled = false; btnSend.innerHTML = 'Responder ' + I.arrow;
  }
  function renderQuestion(res) {
    var html = '<div class="ks-nm ks-guard">' + I.guard + 'Guardião da Ponte Antiga</div>';
    if (!res) {
      html += '<div class="ks-q">Explique com suas palavras: <b>por que a viga precisa de apoio dos dois lados?</b></div>';
    } else {
      if (!res.aprovado) html += '<div class="ks-q ks-q-sm">Por que a viga precisa de apoio <b>dos dois lados</b>?</div>';
      html += '<div class="ks-fb ' + (res.aprovado ? 'ok' : 'no') + '" style="margin-top:0">' + (res.aprovado ? I.okc : I.hint) + '<span>' + res.mensagem + (res.dica ? '<br><span style="font-weight:600">' + res.dica + '</span>' : '') + '</span></div>' +
        '<div class="ks-rub">' + res.criterios.map(function (c) { return '<span class="' + (c.ok ? 'ok' : '') + '"><i>' + (c.ok ? '✓' : '') + '</i>' + c.rotulo + '</span>'; }).join('') + '</div>';
    }
    bq.innerHTML = html;
  }
  ans.querySelector('.ks-mic').addEventListener('click', function () {
    KS.audio.play('err');
    toast('<b>Disponível no app.</b> A resposta por voz usa o microfone só com autorização do responsável.', 3600);
  });
  btnSend.addEventListener('click', function () {
    if (mode !== 'boss') return;
    save.bossTries = (save.bossTries || 0) + 1; persist();
    // >>> Aqui entra a IA tutora no app final (ver js/tutor.js). Hoje: avaliador local por palavras-chave.
    var res = KS.avaliarResposta(ta.value, save.bossTries);
    renderQuestion(res);
    guard.talk = 1; guard.talkUntil = wall + 1.6;
    if (res.aprovado) {
      KS.audio.play('ok'); btnSend.disabled = true; ta.blur();
      setOut(ans, true);
      guard.bowTarget = 1;
      setTimeout(function () {
        seal = el('div', 'ks-seal', KS.sealSVG(), hudRoot);
        KS.audio.play('fanfare');
        K.burst(new THREE.Vector3(0, 1.4, -3.7), 30, 1.4, 1.3);
        var xp = save.bossTries <= 1 ? 100 : save.bossTries === 2 ? 80 : 60;
        giveXP('chefao', 'ENG-EST', xp, Wd / 2, Hd * 0.62, 'Estruturas · chefão');
        save.flags.boss = true;
        if (save.badges.indexOf('ENG-EST-bronze') < 0 && save.xp['ENG-EST'] >= BRONZE) save.badges.push('ENG-EST-bronze');
        save.realMission = 'aguardando';
        persist(); refreshQuest();
        setOut(doneBar, false);
      }, 600);
    } else {
      KS.audio.play('err');
      btnSend.innerHTML = 'Tentar de novo ' + I.arrow;
      ta.focus();
    }
  });
  doneBar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.dataset.b === 'rw') { KS.audio.play('tap'); showReward(); } });

  /* ---------- recompensa ---------- */
  function showReward() {
    mode = 'reward';
    if (seal) { seal.remove(); seal = null; }
    setOut(bq, true); setOut(ans, true); setOut(doneBar, true); show(ban, false); frame.style.opacity = 0;
    var t = totalXP(), l = levelOf(t), a = LEVELS[l], b = LEVELS[l + 1] || a + 1000;
    var src = {
      'ENG-EST': [['aula-q1', 'aula'], ['aula-q2', 'aula'], ['teste-carga', 'teste de carga'], ['chefao', 'chefão']],
      'ENG-DES': [['construcao', 'construção pelo projeto']],
      'ENG-MAT': [['teste-material', 'teste de carga']]
    };
    var rows = SKILLS.map(function (sk) {
      var parts = {}, gained = 0;
      src[sk.code].forEach(function (q) { var v = save.got[q[0]] || 0; if (v) { parts[q[1]] = (parts[q[1]] || 0) + v; gained += v; } });
      var desc = Object.keys(parts).map(function (k) { return k + ' ' + parts[k]; }).join(' · ') || '—';
      var pct = Math.min(100, (save.xp[sk.code] || 0) / BRONZE * 100);
      return '<div class="ks-sk"><span class="ks-code">' + sk.code + '</span><span class="ks-skn">' + sk.nome + '</span><span class="ks-skx">+' + gained + ' XP</span>' +
        '<div class="ks-skb"><b data-w="' + pct.toFixed(0) + '"></b></div><span class="ks-src">' + desc + ' · ' + ((save.xp[sk.code] || 0) >= BRONZE ? 'bronze conquistado ✓' : (save.xp[sk.code] || 0) + '/' + BRONZE + ' para o bronze') + '</span></div>';
    }).join('');
    var hasBadge = save.badges.indexOf('ENG-EST-bronze') >= 0;
    reward.innerHTML = '<div class="ks-rw"><div class="ks-rw-hd"><h1>Missão concluída!</h1><p>A ponte da Vila do Riacho está de pé.</p></div>' +
      (hasBadge ? '<div class="ks-badge ks-card">' + KS.badgeSVG() + '<div><span class="ks-chip">Distintivo bronze · ENG-EST</span><h3>Construtor de Pontes</h3><p>Você mostrou que sabe por que a viga precisa de apoio dos dois lados.</p></div></div>' : '') +
      '<div class="ks-skills ks-card"><h3>XP por habilidade</h3>' + rows + '</div>' +
      '<div class="ks-lvl ks-card"><h3>Nível ' + (l + 1) + ' · ' + LEVEL_NAMES[l] + '</h3><div class="ks-bar"><div class="ks-fill" data-w="' + (100 * clamp((t - a) / (b - a), 0, 1)).toFixed(1) + '"></div></div><div class="ks-xpn"><span>XP total (soma das skills)</span><span><b>' + t + '</b> / ' + b + ' XP</span></div></div>' +
      '<div class="ks-real ks-card"><i>' + I.coins + '</i><div><h3>Missão no mundo real desbloqueada!</h3><p>Construa uma <b>ponte de palitos</b> que aguente <b>5 moedas</b>. Peça ao seu responsável para validar.</p><span class="ks-wait"><i></i>Aguardando validação do responsável · +' + REAL_MISSION_XP + ' XP</span></div></div>' +
      '<button class="ks-go" data-r="vila">Voltar à vila ' + I.home + '</button><button class="ks-go ks-ghost" data-r="menu">Tela inicial</button></div>';
    show(reward, true); reward.scrollTop = 0;
    setTimeout(function () { Array.prototype.forEach.call(reward.querySelectorAll('[data-w]'), function (b2) { b2.style.width = b2.dataset.w + '%'; }); }, 80);
    KS.audio.play('fanfare');
  }
  reward.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    KS.audio.play('tap');
    if (b.dataset.r === 'vila') { show(reward, false); guard.bowTarget = 0.25; hero.g.position.set(0, 0, -2.6); enterExplore(); toast('A vila agradece! Explore à vontade.'); }
    else if (b.dataset.r === 'menu') { show(reward, false); enterTitle(); }
  });

  /* ---------- pausa ---------- */
  top.querySelector('.ks-pause').addEventListener('click', function () { KS.audio.play('tap'); openPause(); });
  fpause.addEventListener('click', function () { KS.audio.play('tap'); openPause(); });
  function openPause() {
    paused = true;
    var v = Math.round(KS.audio.getVolume() * 100);
    modal.innerHTML = '<div class="ks-card" role="dialog" aria-label="Pausa"><h2>Pausa</h2><label class="ks-vol">' + I.vol + '<input type="range" min="0" max="100" step="5" value="' + v + '" aria-label="Volume"><b>' + v + '%</b></label>' +
      '<button class="ks-go" data-m="go">Continuar ' + I.play + '</button><button class="ks-go ks-ghost" data-m="mute">' + (v ? 'Desligar o som' : 'Ligar o som') + '</button><button class="ks-go ks-ghost" data-m="exit">Sair para a tela inicial</button>' +
      '<p class="ks-note">Seu progresso fica salvo neste aparelho.</p></div>';
    show(modal, true);
    var rng = modal.querySelector('input'), lbl = modal.querySelector('.ks-vol b');
    rng.addEventListener('input', function () { KS.audio.setVolume(rng.value / 100); save.volume = rng.value / 100; lbl.textContent = rng.value + '%'; persist(); });
    rng.addEventListener('change', function () { KS.audio.play('tap'); });
  }
  modal.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) { if (e.target === modal) { show(modal, false); paused = false; } return; }
    if (b.dataset.m === 'go') { show(modal, false); paused = false; KS.audio.play('tap'); }
    else if (b.dataset.m === 'mute') { var nv = KS.audio.getVolume() > 0 ? 0 : 0.7; KS.audio.setVolume(nv); save.volume = nv; persist(); openPause(); }
    else if (b.dataset.m === 'exit') { persist(); show(modal, false); enterTitle(); }
  });

  /* ================= toque / clique no mundo ================= */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), down = null;
  stage.addEventListener('pointerdown', function (e) { KS.audio.unlock(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  stage.addEventListener('pointerup', function (e) {
    if (!down) return;
    var d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (d > 14 || dt > 900 || paused) return;
    var r = stage.getBoundingClientRect();
    onTap(e.clientX - r.left, e.clientY - r.top);
  });
  function screenDist(x, y, wx, wy, wz) { var p = proj(wx, wy, wz); return p.ok ? Math.hypot(p.x - x, p.y - y) : 1e9; }
  function onTap(x, y) {
    ndc.set(x / Wd * 2 - 1, -(y / Hd) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (mode === 'explore') {
      var tp = tome.g.position;
      if (Math.min(screenDist(x, y, tp.x, 0.8, tp.z), screenDist(x, y, tp.x, 1.5, tp.z)) < 42 * S) { goToTome(); return; }
      if (save.flags.lesson && !save.flags.tested && screenDist(x, y, 0, 0.2, 0) < 48 * S) { goToBridge(); return; }
      if (screenDist(x, y, 0, 1.4, -4.4) < 50 * S && !save.flags.built) { KS.audio.play('tap'); toast('Uma estátua antiga de pedra… parece dormir do outro lado do rio.'); return; }
      var hits = ray.intersectObject(W.ground);
      if (hits.length) {
        var p = hits[0].point;
        KS.audio.play('tap');
        tapRing.position.set(p.x, W.heightAt(p.x, p.z) + 0.03, p.z); tapT = 0;
        walkTo(p.x, p.z);
      }
    } else if (mode === 'build') {
      var targets = W.slots.filter(function (s) { return !s.placed; }).map(function (s) { return s.hit; });
      var hs = ray.intersectObjects(targets);
      var pick = null;
      if (hs.length) {
        // prefere o encaixe que combina com a peça escolhida
        for (var i = 0; i < hs.length && !pick; i++) if (tool && hs[i].object.userData.slot.type === tool) pick = hs[i].object.userData.slot;
        if (!pick) pick = hs[0].object.userData.slot;
      } else {
        // toque perto (na tela) de um encaixe
        var best = null, bd = 44 * S;
        W.slots.forEach(function (s) { if (s.placed) return; var dd = screenDist(x, y, s.pos.x, s.type === 'pilar' ? B.PIER_Y1 : s.pos.y, s.pos.z); if (dd < bd) { bd = dd; best = s; } });
        pick = best;
      }
      if (pick) tryPlace(pick);
      else if (tool) showTip('Toque num dos <b>encaixes azuis</b> da ponte.', null, 2400);
    }
  }

  /* ================= laço principal ================= */
  var last = performance.now(), fpsAcc = 0;
  var tmpV = new THREE.Vector3();
  function update(dt) {
    wall += dt;
    // paleta
    palK += (palTarget - palK) * u.damp(dt, mode === 'awake' ? 0.9 : 1.6);
    applyPalette();
    // herói anda pelo caminho
    var speed = 0;
    if (hero.path && (mode === 'explore' || mode === 'test')) {
      var tgt = hero.path[hero.pi], hp = hero.g.position;
      var dx = tgt.x - hp.x, dz = tgt.z - hp.z, L = Math.sqrt(dx * dx + dz * dz);
      var sp = hero.walkSpeed || 2.4, step = sp * dt;
      if (L <= step) {
        hp.x = tgt.x; hp.z = tgt.z; hero.pi++;
        if (hero.pi >= hero.path.length) { hero.path = null; var cb = hero.onArrive; hero.onArrive = null; if (cb) cb(); }
      } else { hp.x += dx / L * step; hp.z += dz / L * step; speed = sp; hero.faceTo = Math.atan2(dx, dz); }
      if (speed) { hero.stepPh += dt * 3.8; if (hero.stepPh > 1) { hero.stepPh = 0; KS.audio.play('step'); } }
    }
    if (hero.faceTo != null) hero.g.rotation.y = u.angLerp(hero.g.rotation.y, hero.faceTo, u.damp(dt, 10));
    hero.wave = mode === 'title' ? 1 : 0;
    if (mode === 'title') hero.g.rotation.y = u.angLerp(hero.g.rotation.y, 0.45, u.damp(dt, 4));
    hero.g.position.y = W.heightAt(hero.g.position.x, hero.g.position.z);
    if (hero.cheerUntil && wall > hero.cheerUntil) { hero.cheer = 0; hero.cheerUntil = 0; }
    if (mode !== 'title' && !hero.cheerUntil) hero.cheer += (0 - hero.cheer) * u.damp(dt, 8);
    K.animHero(hero, dt, wall, speed);

    // Tomé
    if (tome.talkUntil && wall > tome.talkUntil) { tome.talk = 0; tome.talkUntil = 0; }
    if (tome.cheerUntil && wall > tome.cheerUntil) { tome.cheer = 0; tome.cheerUntil = 0; }
    if (tome.conductUntil && wall > tome.conductUntil) { tome.conduct = 0; tome.conductUntil = 0; }
    var tGoal = (mode === 'build' || mode === 'test') ? TOME_BUILD : (mode === 'awake' || mode === 'boss' || mode === 'reward') ? TOME_WATCH : W.TOME_P, tpos = tome.g.position;
    var tdx = tGoal.x - tpos.x, tdz = tGoal.z - tpos.z, tL = Math.hypot(tdx, tdz), tMove = tL > 0.02;
    if (tMove) { var ts = Math.min(tL, 1.5 * dt); tpos.x += tdx / tL * ts; tpos.z += tdz / tL * ts; }
    tpos.y = W.heightAt(tpos.x, tpos.z) + (tMove ? Math.abs(Math.sin(wall * 11)) * 0.05 : 0);
    var tFace = tMove ? Math.atan2(tdx, tdz) : mode === 'dialog' && tome.faceTo != null ? tome.faceTo : (mode === 'build' || mode === 'test') ? Math.atan2(-tpos.x, -tpos.z - 0.2) : tome.baseRy;
    if (mode === 'explore' && !tMove) { var hp2 = hero.g.position; if (hp2.distanceTo(tome.g.position) < 3) tFace = Math.atan2(hp2.x - tome.g.position.x, hp2.z - tome.g.position.z); }
    tome.g.rotation.y = u.angLerp(tome.g.rotation.y, tFace, u.damp(dt, 4));
    K.animTome(tome, dt, wall);

    // Guardião
    if (guard.talkUntil && wall > guard.talkUntil) { guard.talk = 0; guard.talkUntil = 0; }
    var gAw = (mode === 'awake' || mode === 'boss' || mode === 'reward' || save.flags.boss) ? 1 : 0;
    if (mode === 'awake') { awakeT += dt; gAw = sstep(0.4, 2.6, awakeT); if (awakeT > 0.5 && awakeT < 0.6) K.burst(new THREE.Vector3(0, 1.6, -4.0), 16, 0.7, 0.7); }
    guard.awake += (gAw - guard.awake) * u.damp(dt, 3);
    guard.bow += ((guard.bowTarget || 0) - guard.bow) * u.damp(dt, 2.5);
    K.animGuardian(guard, dt, wall);

    // construção: fantasmas pulsando, peças voando, erros
    var pulse = 0.5 + 0.5 * Math.sin(wall * 5);
    W.gridU.uA.value += ((mode === 'build' ? 1 : 0) - W.gridU.uA.value) * u.damp(dt, 4);
    W.slots.forEach(function (s) {
      var match = mode === 'build' && tool === s.type;
      var blocked = s.needs.some(function (id) { return !W.slots.some(function (o) { return o.id === id && o.placed; }); });
      var base = mode === 'build' ? (match ? 0.42 + 0.22 * pulse : blocked ? 0.12 : 0.2 + 0.1 * pulse) : 0.12 + 0.06 * pulse;
      if (s.flash) { s.flash = Math.max(0, s.flash - dt * 2.2); }
      s.gmats.forEach(function (m) { m.opacity = Math.min(0.9, base * 1.25 + (s.flash || 0) * 0.45); m.color.setHex(s.flash > 0.02 ? 0xff8a4a : match ? 0x8ff3ff : blocked ? 0x6a9ad8 : 0x3f9bff); });
      s.ghost.visible = !s.placed && !s.anim && (mode === 'build' || (save.flags.lesson && !save.flags.built && mode === 'explore'));
      if (s.anim) {
        var a = s.anim; a.t += dt / 0.55;
        var k = Math.min(1, a.t), e = k * k * (3 - 2 * k);
        s.piece.position.lerpVectors(a.from, s.pos, e); s.piece.position.y += Math.sin(Math.PI * k) * 1.6;
        s.piece.rotation.set(Math.sin(Math.PI * k) * 0.5, (1 - e) * Math.PI * 1.5, 0);
        if (k >= 1) {
          s.piece.position.copy(s.pos); s.piece.rotation.set(0, 0, 0);
          s.anim = null; s.squash = 0; onSnap(s);
        }
      }
      var baseScale = s.type === 'trava' ? 2.2 : 1;
      if (s.squash != null) {
        s.squash += dt / 0.2; var cl = s.squash < 1 ? Math.sin(s.squash * Math.PI) : 0;
        s.piece.scale.set(baseScale * (1 + cl * 0.1), baseScale * (1 - cl * 0.22), baseScale * (1 + cl * 0.1));
        s.mats.forEach(function (m) { m.emissiveIntensity = Math.max(0, 0.5 * (1 - s.squash / 3)); });
        if (s.squash > 3) s.squash = null;
      }
    });
    for (var fi = fallers.length - 1; fi >= 0; fi--) {
      var f = fallers[fi]; f.t += dt;
      var kk = Math.min(1, f.t / 1.0);
      // a viga apoiada só na margem tomba para dentro do rio
      f.m.position.set(f.base.x, f.base.y - kk * kk * 0.9, f.base.z - Math.sign(f.base.z) * kk * 0.15);
      f.m.rotation.x = Math.sign(f.base.z) * -kk * 0.9;
      if (f.t > 1.0) { K.burst(new THREE.Vector3(f.base.x, -0.28, f.base.z * 0.6), 12, 0.6, 0.6); KS.audio.play('whoosh'); scene.remove(f.m); fallers.splice(fi, 1); }
    }
    if (tipT && wall > tipT) { setOut(tip, true); tipT = 0; }

    // teste de carga: setas e deformação leve
    if (mode === 'test') {
      testT += dt;
      var hz = hero.g.position.z;
      W.sag = function (z) { return Math.abs(hz) < 2.4 ? -0.03 * Math.exp(-(z - hz) * (z - hz) / 0.3) * (Math.abs(z) < B.JOINT + 0.2 ? 1 : 0.4) : 0; };
      W.slots.forEach(function (s) { if (s.type === 'viga') s.piece.position.y = s.pos.y + W.sag(s.pos.z) * 0.8; });
      loadArrow.position.set(hero.g.position.x, hero.g.position.y + 1.95 + Math.sin(wall * 6) * 0.04, hz);
      reactArrows.forEach(function (a, i) {
        var z0 = [-B.JOINT, 0, B.JOINT][i], near = Math.exp(-(z0 - hz) * (z0 - hz) / 1.2);
        a.scale.setScalar(0.6 + 0.6 * near); a.position.y = -0.1 + 0.08 * Math.sin(wall * 6 + i);
      });
      elMeter.style.width = (100 * clamp((2.95 - hz) / 5.7, 0, 1)).toFixed(0) + '%';
    } else if (W.sag) { W.sag = null; W.slots.forEach(function (s) { if (s.type === 'viga' && s.placed && !s.anim) s.piece.position.y = s.pos.y; }); }

    // anel do toque
    if (tapT < 1) { tapT += dt / 0.55; tapRing.visible = true; tapRing.scale.setScalar(0.6 + tapT * 1.4); tapRing.material.opacity = (1 - tapT) * 0.9; } else tapRing.visible = false;

    W.update(dt, wall);
    K.updateFx(dt, camera, wall);
    updateCamera(dt);

    // marcadores na tela
    var tp = tome.g.position, f2 = save.flags;
    place(markTome, proj(tp.x, 2.25, tp.z), mode === 'explore' && !f2.lesson);
    place(markGap, proj(0, 0.95, 0.05), mode === 'explore' && f2.lesson && !f2.tested);
    place(markGuard, proj(0, 3.4, -4.4), mode === 'explore' && f2.tested && !f2.boss);
    show(fpause, mode === 'awake' || mode === 'boss');
    place(dim3d, proj(-1.2, 0.5, 0), mode === 'build' && !save.flags.built);
    W.slots.forEach(function (s) {
      var free = !s.needs.some(function (id) { return !W.slots.some(function (o) { return o.id === id && o.placed; }); });
      place(s.mark, proj(s.pos.x, slotScreenY(s), s.pos.z), mode === 'build' && !paused && tool === s.type && !s.placed && !s.anim && free);
    });
    btnBuild.classList.toggle('ks-glow', mode === 'explore' && f2.lesson && !f2.tested && hero.g.position.distanceTo(BRIDGE_SPOT) < 2.4);
    btnBuild.classList.toggle('ks-dim', !f2.lesson || f2.tested);

    // atravessar a ponte depois do teste acorda o Guardião
    if (mode === 'explore' && f2.tested && !f2.boss && hero.g.position.z < -2.35 && Math.abs(hero.g.position.x) < 0.6) startAwakening();
  }
  function frameLoop(now) {
    requestAnimationFrame(frameLoop);
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused) update(dt);
    renderer.render(scene, camera);
  }

  /* ================= início ================= */
  applySaveToWorld();
  enterTitle();
  cameraWant(0); camPos.copy(wantPos); camTgt.copy(wantTgt); camFov = wantFov;
  refreshTop();
  requestAnimationFrame(function (t) { last = t; frameLoop(t); });
  setTimeout(function () { var ld = document.getElementById('loading'); ld.classList.add('ks-gone'); setTimeout(function () { ld.remove(); }, 600); }, 250);

  /* ganchos para testes automatizados (posições na tela; não altera o jogo) */
  window.KS_DEBUG = {
    cam: BOSS_CAM, buildCam: BUILD_CAM, testCam: TEST_CAM,
    pos: function (name, x, z) { var v = name === 'tomeBuild' ? TOME_BUILD : name === 'heroBuild' ? HERO_BUILD : null; if (v) v.set(x, 0, z); if (name === 'heroBuild' && mode === 'build') hero.g.position.copy(HERO_BUILD); },
    jump: function (where) {
      if (where === 'boss' || where === 'awake') {
        save.flags = { lesson: true, built: true, tested: true, boss: false };
        W.slots.forEach(function (s) { save.placed[s.id] = true; });
        show(titleEl, false); applySaveToWorld(); refreshTop(); startAwakening();
        if (where === 'boss') { setOut(dlg, true); enterBoss(); }
      } else if (where === 'build' || where === 'test') {
        save.flags = { lesson: true, built: where === 'test', tested: false, boss: false };
        if (where === 'test') W.slots.forEach(function (s) { save.placed[s.id] = true; });
        show(titleEl, false); applySaveToWorld(); refreshTop(); enterExplore(); enterBuild();
        if (where === 'test') startTest();
      }
    },
    mode: function () { return mode; }, W: W,
    save: function () { return JSON.parse(JSON.stringify(save)); },
    hero: function () { var p = hero.g.position; return { x: p.x, z: p.z, moving: !!hero.path }; },
    screen: function (name) {
      if (name === 'tome') { var t = tome.g.position; return proj(t.x, 0.9, t.z); }
      if (name === 'gap') return proj(0, 0.2, 0);
      if (name.indexOf('slot:') === 0) { var s = W.slots.filter(function (o) { return o.id === name.slice(5); })[0]; return proj(s.pos.x, slotScreenY(s), s.pos.z); }
      if (name.indexOf('ground:') === 0) { var q = name.slice(7).split(','); return proj(+q[0], W.heightAt(+q[0], +q[1]), +q[1]); }
      return null;
    }
  };
})();
