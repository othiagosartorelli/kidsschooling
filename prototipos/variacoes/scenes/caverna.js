/* CIÊNCIAS NA CAVERNA DOS CRISTAIS — KidsSchooling (variação do estilo aprovado "combinado")
   Mesmo herói, mesmos blocos de encaixe (pinos hexagonais + chaves borboleta), mesmo HUD em cartões creme.
   Muda: paleta noturna (azul-profundo, roxo, turquesa), cristais emissivos, lanterna quente com luz pontual,
   câmera que desce do enquadramento alto da exploração para um acompanhamento mais próximo.
   Exercício: hipótese "o cristal brilha mais no escuro ou na luz?". Loop de 6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'caverna';
  var LOOP = 6.0, CUT = 5.75;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function pulse(a, b, x) { return x > a && x < b ? Math.sin((x - a) / (b - a) * Math.PI) : 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }

  var FOV = 30;
  /* lago */
  var PC = { x: 1.6, z: -1.2 }, PRX = 1.38, PRZ = 0.98, WATER_Y = -0.13;
  function pondE(x, z) { var dx = (x - PC.x) / PRX, dz = (z - PC.z) / PRZ; return Math.sqrt(dx * dx + dz * dz); }
  function caveH(x, z) {
    var dz0 = z + 0.8, r = Math.sqrt(x * x * 0.78 + dz0 * dz0);
    var y = 0.05 * Math.sin(x * 1.3 + z * 0.7) * Math.cos(z * 1.1 - x * 0.4);
    y += 2.8 * sstep(4.6, 7.4, r) * (1 - sstep(1.2, 4.2, z));
    var e = pondE(x, z);
    y += 0.05 * sstep(0.88, 1.04, e) * (1 - sstep(1.04, 1.45, e));
    y -= 1.9 * (1 - sstep(0.76, 1.03, e));
    return y;
  }
  var TRAIL = [[0.9, 5.0], [0.55, 2.6], [0.1, 0.4], [-0.1, -0.5]];
  function trailD(x, z) { var d = 99; for (var i = 0; i < TRAIL.length - 1; i++) d = Math.min(d, segDist(x, z, TRAIL[i][0], TRAIL[i][1], TRAIL[i + 1][0], TRAIL[i + 1][1])); return d; }

  /* ---------- HUD (mesmo padrão de cartões, detalhes frios) ---------- */
  var CSS = [
    '.caverna-root{position:absolute;inset:0;overflow:hidden;background:#0d0b26;-webkit-user-select:none;user-select:none;}',
    '.caverna-root canvas.caverna-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.caverna-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 78% at 50% 50%,rgba(8,6,30,0) 48%,rgba(6,4,24,.62) 100%);}',
    '.caverna-wipe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;}',
    '.caverna-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.caverna-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(60,80,140,.14),0 calc(6px*var(--s)) calc(18px*var(--s)) rgba(4,6,30,.45);}',
    '.caverna-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.caverna-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.caverna-ava svg{display:block;width:100%;height:100%;}',
    '.caverna-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.caverna-stat{flex:1;min-width:0;}',
    '.caverna-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.caverna-ttl span{color:#1593a6;}',
    '.caverna-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#e7e6ec;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(40,40,90,.18);overflow:hidden;}',
    '.caverna-fill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(90deg,#2fc6c0,#7fdc5a);}',
    '.caverna-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.caverna-flash{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.caverna-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#6f6f86;font-variant-numeric:tabular-nums;}',
    '.caverna-xpn b{color:#2a3350;font-weight:800;}',
    '.caverna-pause{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#eceaf2;display:grid;place-items:center;}',
    '.caverna-pause svg{width:46%;height:46%;}',
    '.caverna-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(10px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:calc(232px*var(--s));}',
    '.caverna-qi{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#dcf6f4;display:grid;place-items:center;}',
    '.caverna-qi svg{width:80%;height:80%;}',
    '.caverna-qt{font-weight:700;font-size:calc(13.5px*var(--s));line-height:1.18;color:#3a4260;}',
    '.caverna-qt b{font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1593a6;}',
    '.caverna-chk{flex:none;width:calc(20px*var(--s));height:calc(20px*var(--s));border-radius:50%;border:calc(2px*var(--s)) solid #d5d3df;display:grid;place-items:center;box-sizing:border-box;}',
    '.caverna-chk svg{width:80%;height:80%;opacity:0;}',
    '.caverna-lamp{position:absolute;right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(7px*var(--s));padding:calc(7px*var(--s)) calc(9px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));}',
    '.caverna-li{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#fff0d6;display:grid;place-items:center;transition:none;}',
    '.caverna-li svg{width:82%;height:82%;}',
    '.caverna-lt{font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a4260;}',
    '.caverna-lt small{display:block;font:700 calc(11.5px*var(--s))/1.1 "Nunito Sans",system-ui,sans-serif;color:#c46a12;margin-top:calc(2px*var(--s));}',
    '.caverna-sw{position:relative;flex:none;width:calc(34px*var(--s));height:calc(20px*var(--s));border-radius:99px;background:#ffb04a;box-shadow:inset 0 calc(1px*var(--s)) calc(2px*var(--s)) rgba(0,0,0,.18);}',
    '.caverna-sw i{position:absolute;top:calc(2px*var(--s));left:calc(2px*var(--s));width:calc(16px*var(--s));height:calc(16px*var(--s));border-radius:50%;background:#fff;box-shadow:0 calc(1px*var(--s)) calc(2px*var(--s)) rgba(0,0,0,.25);}',
    '.caverna-bub{position:absolute;left:0;top:0;width:calc(196px*var(--s));padding:calc(16px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;transform-origin:0 100%;}',
    '.caverna-bub .caverna-tail{position:absolute;bottom:calc(-9px*var(--s));left:var(--tx,24px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));box-shadow:calc(4px*var(--s)) calc(4px*var(--s)) calc(8px*var(--s)) rgba(4,6,30,.25);}',
    '.caverna-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#5fe3d6;color:#0f4a52;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(10,80,90,.3);}',
    '.caverna-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.caverna-say{position:relative;font-weight:700;font-size:calc(15px*var(--s));line-height:1.25;color:#2a3350;}',
    '.caverna-say b{color:#1593a6;}',
    '.caverna-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(4,6,30,.45);font:600 calc(19px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1f9e6e;}',
    '.caverna-xp svg{width:calc(22px*var(--s));height:calc(22px*var(--s));}',
    /* cartão do experimento */
    '.caverna-ex{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px + 82px*var(--s));padding:calc(11px*var(--s)) calc(12px*var(--s)) calc(12px*var(--s));opacity:0;}',
    '.caverna-exh{display:flex;align-items:center;justify-content:space-between;gap:calc(8px*var(--s));}',
    '.caverna-tag{display:inline-flex;align-items:center;gap:calc(5px*var(--s));padding:calc(4px*var(--s)) calc(10px*var(--s)) calc(4px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#dcf6f4;color:#0f6f7c;font:600 calc(13px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;}',
    '.caverna-tag svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.caverna-step{font-weight:800;font-size:calc(12px*var(--s));color:#8a879c;display:flex;gap:calc(4px*var(--s));align-items:center;}',
    '.caverna-step i{width:calc(7px*var(--s));height:calc(7px*var(--s));border-radius:50%;background:#dcdbe6;display:inline-block;}',
    '.caverna-step i.on{background:#2fc6c0;}',
    '.caverna-exq{margin:calc(8px*var(--s)) calc(2px*var(--s)) calc(10px*var(--s));font:600 calc(17.5px*var(--s))/1.22 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.caverna-exq b{color:#1593a6;font-weight:600;}',
    '.caverna-opts{display:grid;grid-template-columns:1fr 1fr;gap:calc(9px*var(--s));}',
    '.caverna-opt{position:relative;display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(8px*var(--s));border-radius:calc(14px*var(--s));background:#fff;box-shadow:0 0 0 calc(2px*var(--s)) #e9e4d8 inset;font:600 calc(15.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.caverna-opt i{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));display:grid;place-items:center;}',
    '.caverna-opt i svg{width:84%;height:84%;}',
    '.caverna-ok{position:absolute;right:calc(-7px*var(--s));top:calc(-8px*var(--s));width:calc(24px*var(--s));height:calc(24px*var(--s));border-radius:50%;background:#43c59e;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;transform:scale(0);}',
    '.caverna-ok svg{width:72%;height:72%;}',
    /* caderno de anotações */
    '.caverna-nb{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px + 82px*var(--s));padding:calc(15px*var(--s)) calc(12px*var(--s)) calc(10px*var(--s)) calc(26px*var(--s));border-radius:calc(12px*var(--s)) calc(18px*var(--s)) calc(18px*var(--s)) calc(12px*var(--s));background:#fffdf6 repeating-linear-gradient(180deg,rgba(0,0,0,0) 0,rgba(0,0,0,0) calc(21px*var(--s)),#d7e5f6 calc(21px*var(--s)),#d7e5f6 calc(22px*var(--s)));background-position:0 calc(12px*var(--s));box-shadow:0 0 0 calc(1px*var(--s)) rgba(60,80,140,.14),0 calc(8px*var(--s)) calc(20px*var(--s)) rgba(4,6,30,.5);opacity:0;transform-origin:50% 100%;}',
    '.caverna-nb:before{content:"";position:absolute;left:calc(17px*var(--s));top:0;bottom:0;width:calc(1.5px*var(--s));background:#ff9a9a;}',
    '.caverna-ring{position:absolute;top:calc(-7px*var(--s));left:calc(22px*var(--s));right:calc(18px*var(--s));height:calc(14px*var(--s));background:radial-gradient(circle at 50% 50%,#8d93ad 0,#8d93ad calc(3.2px*var(--s)),rgba(0,0,0,0) calc(3.8px*var(--s))) 0 0/calc(19px*var(--s)) 100% repeat-x;}',
    '.caverna-nbh{display:flex;align-items:center;justify-content:space-between;}',
    '.caverna-nbt{font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#7a7f98;letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;gap:calc(5px*var(--s));}',
    '.caverna-nbt svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.caverna-nbd{font:400 calc(14px*var(--s))/1 "Patrick Hand","Nunito Sans",system-ui,sans-serif;color:#8a8fb0;}',
    '.caverna-nbb{display:flex;align-items:center;gap:calc(10px*var(--s));margin-top:calc(6px*var(--s));}',
    '.caverna-nb svg.caverna-sk{flex:none;display:block;width:calc(150px*var(--s));height:auto;margin-left:calc(-6px*var(--s));}',
    '.caverna-nbr{flex:1;min-width:0;}',
    '.caverna-hw{font:400 calc(19px*var(--s))/1.1 "Patrick Hand","Nunito Sans",system-ui,sans-serif;color:#2a4f9a;}',
    '.caverna-hw span{display:inline-block;}',
    '.caverna-stamp{display:inline-flex;align-items:center;gap:calc(4px*var(--s));margin-top:calc(8px*var(--s));padding:calc(4px*var(--s)) calc(10px*var(--s));border-radius:calc(9px*var(--s));border:calc(2.2px*var(--s)) solid #1f9e6e;color:#1f9e6e;background:rgba(67,197,158,.12);font:600 calc(16px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;transform:rotate(-6deg) scale(0);}',
    /* botões */
    '.caverna-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.caverna-btn{flex:1;height:calc(72px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.caverna-btn i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));display:grid;place-items:center;}',
    '.caverna-btn i svg{width:76%;height:76%;}',
    '.caverna-btn.caverna-pri{background:linear-gradient(180deg,#ff9b3d,#ff7a1a);color:#fff;box-shadow:0 0 0 calc(1px*var(--s)) rgba(160,70,0,.15),0 calc(6px*var(--s)) calc(18px*var(--s)) rgba(255,140,40,.35);}',
    '.caverna-btn.caverna-pri i{background:rgba(255,255,255,.22);}'
  ].join('\n');

  /* ícones SVG flat */
  var AVATAR = '<svg viewBox="0 0 64 64"><defs><linearGradient id="caverna-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="caverna-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#caverna-avbg)"/>' +
    '<g clip-path="url(#caverna-avc)">' +
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
  var IC_PAUSE = '<svg viewBox="0 0 20 20"><rect x="4.5" y="3.5" width="4" height="13" rx="1.6" fill="#6f6f86"/><rect x="11.5" y="3.5" width="4" height="13" rx="1.6" fill="#6f6f86"/></svg>';
  var IC_CHECK = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_XP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_CRYSTAL = '<svg viewBox="0 0 32 32"><path d="M5 27h22" stroke="#7b78a8" stroke-width="2.4" stroke-linecap="round"/><path d="M9 27l-2-9 3-4 3 4-1 9z" fill="#ff7ad9"/><path d="M10 14l3 4-1 9" fill="#e64fb7"/>' +
    '<path d="M13 27l-1-14 4-8 4 8-1 14z" fill="#5ff0ff"/><path d="M16 5l4 8-1 14h-3z" fill="#22c4e0"/><path d="M19 27l1-8 3-3 3 3-1 8z" fill="#ffc44d"/><path d="M23 16l3 3-1 8h-2z" fill="#f29a1a"/>' +
    '<path d="M15 9l1.2-2.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var IC_FLASK = '<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 9a2.2 2.2 0 0 0 2 3.3h10a2.2 2.2 0 0 0 2-3.3l-5-9V3" fill="#fff" stroke="#0f6f7c" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.2 15h9.6l2 3.6a1.4 1.4 0 0 1-1.2 2H6.4a1.4 1.4 0 0 1-1.2-2z" fill="#2fc6c0"/><circle cx="10.5" cy="17.4" r="1" fill="#fff"/><circle cx="13.6" cy="18.6" r=".7" fill="#fff"/></svg>';
  function icLantern(on) {
    return '<svg viewBox="0 0 32 32"><path d="M12.5 6.5a3.5 3.5 0 0 1 7 0" stroke="#4a4466" stroke-width="2" fill="none"/><path d="M10 8.5h12l-1.5 3h-9z" fill="#4a4466"/>' +
      '<rect x="11" y="11.5" width="10" height="11" rx="2.5" fill="' + (on ? '#ffd27a' : '#c9c6dc') + '"/>' + (on ? '<path d="M16 13.5c2 2.2 2.4 4 1.6 5.6a1.9 1.9 0 0 1-3.2 0c-.8-1.6-.4-3.4 1.6-5.6z" fill="#ff8a2a"/>' : '') +
      '<path d="M13 11.5v11M19 11.5v11" stroke="#4a4466" stroke-width="1.4"/><path d="M9.5 22.5h13l-1.2 3h-10.6z" fill="#4a4466"/></svg>';
  }
  var IC_NOTE = '<svg viewBox="0 0 32 32"><rect x="7" y="5" width="19" height="23" rx="3" fill="#5b8def"/><rect x="10" y="5" width="16" height="23" rx="2.5" fill="#fffdf6"/><path d="M13 11h10M13 15h10M13 19h7" stroke="#b8cbea" stroke-width="1.6" stroke-linecap="round"/><path d="M7 9h3M7 14h3M7 19h3M7 24h3" stroke="#3a62c4" stroke-width="2" stroke-linecap="round"/></svg>';
  var IC_LUPA = '<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="7.5" fill="#bff6f6" stroke="#0f6f7c" stroke-width="2.6"/><path d="M11 11.5a4 4 0 0 1 3.5-2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M19.6 19.6l6 6" stroke="#0f6f7c" stroke-width="3.6" stroke-linecap="round"/></svg>';
  var IC_MOON = '<svg viewBox="0 0 32 32"><path d="M19.5 6.5a10 10 0 1 0 6 15.5 8.5 8.5 0 0 1-6-15.5z" fill="#ffe08a"/><circle cx="24" cy="9" r="1.3" fill="#fff"/><circle cx="8" cy="8" r="1" fill="#fff"/><path d="M26.5 14.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#7ff6ff"/></svg>';
  var IC_SUN = '<svg viewBox="0 0 32 32"><g stroke="#f29a1a" stroke-width="2.2" stroke-linecap="round"><path d="M16 3.5v3.5M16 25v3.5M3.5 16H7M25 16h3.5M7.2 7.2l2.4 2.4M22.4 22.4l2.4 2.4M7.2 24.8l2.4-2.4M22.4 9.6l2.4-2.4"/></g><circle cx="16" cy="16" r="6.5" fill="#ffc93c"/></svg>';
  var IC_GOGGLE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><path d="M3.5 11.5h17" stroke="#24566a" stroke-width="1.6"/><circle cx="8.3" cy="12" r="3.6" fill="#bff8ff" stroke="#1f9ea0" stroke-width="1.8"/><circle cx="15.7" cy="12" r="3.6" fill="#bff8ff" stroke="#1f9ea0" stroke-width="1.8"/><path d="M7 10.6l1.4-1" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var SKETCH = '<svg class="caverna-sk" viewBox="14 0 122 62"><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20 52h56" stroke="#7a86b0" stroke-width="1.6"/>' +
    '<path d="M40 52l-3-22 9-14 9 14-3 22z" fill="#bff8ff" stroke="#2a4f9a" stroke-width="1.8"/><path d="M46 16v36" stroke="#2a4f9a" stroke-width="1.1"/>' +
    '<path d="M30 52l-3-12 5-6 4 6" fill="#ffd0f0" stroke="#2a4f9a" stroke-width="1.6"/>' +
    '<g stroke="#2fc6c0" stroke-width="1.8"><path d="M46 9V4M58 14l4-3M34 14l-4-3M64 26h5M23 26h5"/></g>' +
    '<path d="M96 20a10 10 0 1 0 9 15 8 8 0 0 1-9-15z" fill="#2a3a7a" stroke="#2a4f9a" stroke-width="1.4"/>' +
    '<path d="M118 22l2 4 4 .5-3 2.6.8 4-3.8-2-3.8 2 .8-4-3-2.6 4-.5z" fill="#ffd27a" stroke="#c4860f" stroke-width="1"/>' +
    '<path d="M82 46c6-3 10-3 16 0" stroke="#2a4f9a" stroke-width="1.6"/><path d="M95 43l3 3-4 1" stroke="#2a4f9a" stroke-width="1.6"/>' +
    '</g></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(20261109);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }

      var root = document.createElement('div'); root.className = 'caverna-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x0d0b26);
      var cv = renderer.domElement; cv.className = 'caverna-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x120f36, 16, 34);
      var camera = new THREE.PerspectiveCamera(FOV, W / H, 1, 120);

      /* ----- materiais com rim light (frio, ciano) ----- */
      var rimU = { uRimColor: { value: new THREE.Color(0x8fe8ff) }, uRimStr: { value: 0.5 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return 'caverna-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
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
      var gCone = G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); });
      var gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
      var gBow = G('bow', function () {
        var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
        var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
      });
      var gRock = G('rock', function () { return new THREE.IcosahedronGeometry(1, 1); });
      var gSpike = G('spike', function () { return new THREE.ConeGeometry(1, 1, 7); });
      var gCrys = G('crys', function () { return new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.86, 0), new THREE.Vector2(1, 0.14), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1.62)], 6); });
      var gPlane = G('plane', function () { var p = new THREE.PlaneGeometry(1, 1); p.rotateX(-Math.PI / 2); return p; });

      function mesh(geo, mat, sx, sy, sz, x, y, z, parent) {
        var m = new THREE.Mesh(geo, mat);
        m.scale.set(sx, sy, sz); m.position.set(x, y, z);
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
      var PINS = [], BOWS = [];
      var matPinFlat = {};
      function pinMat(col) { return matPinFlat[col] || (matPinFlat[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); }
      function addPin(x, y, z, col, ry) { PINS.push({ x: x, y: y + 0.025, z: z, ry: ry || 0, sx: 1, sy: 1, sz: 1, c: col }); }
      function addBow(x, y, z, ry, col, s) { BOWS.push({ x: x, y: y, z: z, ry: ry, sx: s || 1, sy: s || 1, sz: 1, c: col }); }
      function block(w, h, d, col, x, y, z, ry, parent, r) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }));
        m.position.set(x, y, z); m.rotation.y = ry || 0;
        (parent || scene).add(m); return m;
      }

      /* ----- texturas geradas ----- */
      function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
      var glowT = keep(new THREE.CanvasTexture(mkCanvas(128, 128, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,.62)'); gr.addColorStop(0.45, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      var blobT = keep(new THREE.CanvasTexture(mkCanvas(64, 64, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(4,2,20,.62)'); gr.addColorStop(0.55, 'rgba(4,2,20,.3)'); gr.addColorStop(1, 'rgba(4,2,20,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      var glintT = keep(new THREE.CanvasTexture(mkCanvas(256, 128, function (g, w, h) {
        g.lineCap = 'round'; var rr = rng(9);
        for (var k = 0; k < 20; k++) {
          var lx = rr() * w, ly = 10 + rr() * (h - 20), ll = 8 + rr() * 26;
          g.strokeStyle = 'rgba(255,255,255,' + (0.5 + rr() * 0.45) + ')'; g.lineWidth = 1.5 + rr() * 2;
          for (var o = -1; o <= 1; o++) { g.beginPath(); g.moveTo(lx + o * w, ly); g.lineTo(lx + ll + o * w, ly); g.stroke(); }
        }
      })));
      glintT.wrapS = glintT.wrapT = THREE.RepeatWrapping; glintT.repeat.set(2, 1.4);

      function glowMat(col, op) { return new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); }
      function poolMat(col, op) { return new THREE.MeshBasicMaterial({ map: glowT, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); }
      var HALOS = [];   // {sp, base, gain, s0}
      function halo(col, x, y, z, s, base, gain) { var sp = new THREE.Sprite(glowMat(col, base)); sp.position.set(x, y, z); sp.scale.set(s, s, 1); scene.add(sp); HALOS.push({ o: sp, base: base, gain: gain }); return sp; }
      function pool(col, x, z, s, base, gain, y) { var m = new THREE.Mesh(gPlane, poolMat(col, base)); m.position.set(x, (y === undefined ? caveH(x, z) : y) + 0.025, z); m.scale.set(s, 1, s); m.renderOrder = 3; scene.add(m); HALOS.push({ o: m, base: base, gain: gain }); return m; }
      function blob(x, z, s, parent) { var m = new THREE.Mesh(gPlane, G('blobm', function () { return new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false }); })); m.position.set(x, caveH(x, z) + 0.02, z); m.scale.set(s, 1, s); m.renderOrder = 1; (parent || scene).add(m); return m; }

      /* ----- luzes (frias + lanterna quente) ----- */
      var hemi = new THREE.HemisphereLight(0x7f7cff, 0x1d1648, 0.85); scene.add(hemi);
      var moon = new THREE.DirectionalLight(0x8ea4ff, 0.32); moon.position.set(-4, 9, 3); scene.add(moon);
      var fill = new THREE.DirectionalLight(0xa8b8ff, 0.42); scene.add(fill); scene.add(fill.target);
      var lampL = new THREE.PointLight(0xffb45e, 2.4, 3.6, 2); scene.add(lampL);
      var MC = new THREE.Vector3(-0.95, 0, -0.1);  // cristal principal
      var cyanL = new THREE.PointLight(0x46ecff, 1.0, 2.6, 2); cyanL.position.set(MC.x + 0.15, 0.55, MC.z + 0.35); scene.add(cyanL);
      var C1 = new THREE.Vector3(2.55, 0, -2.45);
      var pinkL = new THREE.PointLight(0xff5fd2, 1.1, 4.2, 2); pinkL.position.set(C1.x - 0.3, 0.9, C1.z + 0.4); scene.add(pinkL);

      /* ----- chão da caverna (cores por vértice) ----- */
      var GS = 30, GN = 110;
      var gg = new THREE.PlaneGeometry(GS, GS, GN, GN); gg.rotateX(-Math.PI / 2);
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
      var cA = new THREE.Color(0x3b3784), cB = new THREE.Color(0x2c296c), cPatch = new THREE.Color(0x4b4598), cMoss = new THREE.Color(0x1f7c86), cWet = new THREE.Color(0x232a62), cBed = new THREE.Color(0x06112a), cWall = new THREE.Color(0x2a2464), cWallT = new THREE.Color(0x3b2f7a), cPath = new THREE.Color(0x5a52a6), cPathE = new THREE.Color(0x4a4596);
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i), y = caveH(x, z);
        gp.setY(i, y);
        var nz = 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.5) * Math.cos(z * 0.7 - x * 0.3);
        c.copy(cA).lerp(cB, nz);
        var n2 = 0.5 + 0.5 * Math.sin(x * 1.7 - z * 1.3 + 1.0);
        c.lerp(cPatch, sstep(0.72, 1, n2) * 0.7);
        var n3 = 0.5 + 0.5 * Math.sin(x * 2.3 + z * 1.9 + 2.0) * Math.sin(z * 0.8);
        c.lerp(cMoss, sstep(0.78, 1, n3) * 0.55);
        var td = trailD(x, z);
        if (td < 0.62) { c.lerp(cPathE, 1 - sstep(0.4, 0.62, td)); c.lerp(cPath, (1 - sstep(0.15, 0.42, td)) * 0.85); }
        if (y > 0.15) c.lerp(cWall, sstep(0.15, 0.8, y)).lerp(cWallT, sstep(1.2, 2.6, y));
        var e = pondE(x, z);
        if (e < 1.25) c.lerp(cWet, 1 - sstep(1.0, 1.25, e));
        if (e < 1.0) c.lerp(cBed, 1 - sstep(0.8, 1.0, e));
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      scene.add(new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 })));

      /* ----- instanciados ----- */
      var dummy = new THREE.Object3D(), tmpC = new THREE.Color();
      function instanced(geo, mat, list, parent) {
        var im = new THREE.InstancedMesh(geo, mat, list.length);
        for (var k = 0; k < list.length; k++) {
          var L = list[k];
          dummy.position.set(L.x, L.y, L.z); dummy.rotation.set(L.rx || 0, L.ry || 0, L.rz || 0); dummy.scale.set(L.sx, L.sy, L.sz); dummy.updateMatrix();
          im.setMatrixAt(k, dummy.matrix);
          if (L.c !== undefined) im.setColorAt(k, tmpC.set(L.c));
        }
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        (parent || scene).add(im); return im;
      }

      /* paredes: rochas, estalagmites e estalactites */
      var ROCKS = [], SPK = [], STL = [];
      for (var a = 0; a < 46; a++) {
        var an = -Math.PI * 0.08 - a / 45 * Math.PI * 1.16, rr0 = 5.3 + R() * 1.4;
        var rx = Math.cos(an) * rr0 / Math.sqrt(0.78), rz = -0.8 + Math.sin(an) * rr0;
        if (rz > 2.4) continue;
        var rs = 0.55 + R() * 0.95;
        ROCKS.push({ x: rx, y: caveH(rx, rz) + rs * 0.15, z: rz, sx: rs * (1 + R() * 0.4), sy: rs * (0.8 + R() * 0.7), sz: rs, ry: R() * 6, rx: R() * 0.4, c: [0x37307a, 0x2d2868, 0x433a8a, 0x2a2560][a % 4] });
      }
      [[-3.3, 2.2, 0.55], [-3.8, 0.6, 0.7], [3.9, 1.6, 0.6], [4.3, -0.2, 0.75], [-2.4, -3.0, 0.45], [0.6, -3.9, 0.5], [3.4, -3.3, 0.55]].forEach(function (q) {
        ROCKS.push({ x: q[0], y: caveH(q[0], q[1]) + q[2] * 0.2, z: q[1], sx: q[2] * 1.3, sy: q[2] * 0.9, sz: q[2], ry: R() * 6, c: 0x3a3380 });
      });
      // pedras pequenas no chão
      for (var k = 0; k < 40; k++) {
        var px = -4 + R() * 8, pz = -3.5 + R() * 7;
        if (pondE(px, pz) < 1.15 || trailD(px, pz) < 0.5 || Math.hypot(px - MC.x, pz - MC.z) < 0.7 || Math.hypot(px + 1.3, pz + 1.55) < 0.6) continue;
        var ps = 0.06 + R() * 0.12;
        ROCKS.push({ x: px, y: caveH(px, pz) + ps * 0.25, z: pz, sx: ps * 1.4, sy: ps * 0.8, sz: ps, ry: R() * 6, c: [0x4b4598, 0x5a52a6, 0x3f3a88][k % 3] });
      }
      instanced(gRock, M(0xffffff, { flatShading: true, roughness: 0.92 }), ROCKS);
      for (a = 0; a < 26; a++) {
        var an2 = -0.15 - a / 25 * Math.PI * 0.95, r2 = 4.4 + R() * 1.0;
        var sx = Math.cos(an2) * r2 / Math.sqrt(0.78), sz = -0.8 + Math.sin(an2) * r2;
        if (sz > 1.8) continue;
        var sh = 0.5 + R() * 1.1, sw = 0.14 + R() * 0.16;
        SPK.push({ x: sx, y: caveH(sx, sz) + sh / 2 - 0.05, z: sz, sx: sw, sy: sh, sz: sw, ry: R() * 3, rz: (R() - 0.5) * 0.15, c: [0x4a4196, 0x3b3584, 0x5a4fa8][a % 3] });
      }
      [[-2.2, 1.5, 0.45], [2.95, 0.9, 0.55], [-0.2, -2.6, 0.4], [3.6, -1.6, 0.6]].forEach(function (q) { SPK.push({ x: q[0], y: caveH(q[0], q[1]) + q[2] / 2, z: q[1], sx: 0.12, sy: q[2], sz: 0.12, c: 0x4a4196 }); });
      instanced(gSpike, M(0xffffff, { flatShading: true, roughness: 0.85 }), SPK);
      for (a = 0; a < 18; a++) {
        var an3 = -0.35 - a / 17 * Math.PI * 0.75, r3 = 5.2 + R() * 0.8;
        var tx = Math.cos(an3) * r3 / Math.sqrt(0.78), tz = -0.8 + Math.sin(an3) * r3, th = 0.7 + R() * 1.3;
        STL.push({ x: tx, y: 4.4 - th / 2, z: tz, sx: 0.16 + R() * 0.14, sy: th, sz: 0.16 + R() * 0.12, rx: Math.PI, c: [0x3b3584, 0x4a4196][a % 2] });
      }
      instanced(gSpike, M(0xffffff, { flatShading: true, roughness: 0.85 }), STL);
      // teto em sombra (borda superior)
      var ceil = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1.2, 28, 1, true, Math.PI * 0.55, Math.PI * 0.9), M(0x221d52, { side: THREE.DoubleSide, flatShading: true }));
      ceil.scale.set(1 / Math.sqrt(0.78) * 0.72, 1, 0.72); ceil.position.set(0, 4.6, -0.8); scene.add(ceil);

      /* ----- cristais ----- */
      var CRY = { c: [], p: [], a: [] };
      var CRYC = { c: [0x8ff8ff, 0x1fc8e6], p: [0xffa6ec, 0xe8379f], a: [0xffd88a, 0xf28a12] };
      var HCOL = { c: 0x3fe6ff, p: 0xff5fd2, a: 0xffad3a };
      function cluster(cx, cz, key, n, size, keyB) {
        var gy = caveH(cx, cz);
        for (var j = 0; j < n; j++) {
          var kk = keyB && j % 3 === 2 ? keyB : key;
          var aa = j === 0 ? 0 : R() * Math.PI * 2, dd = j === 0 ? 0 : size * (0.18 + R() * 0.3);
          var hh = size * (j === 0 ? 0.62 : 0.25 + R() * 0.3), rr = size * (j === 0 ? 0.13 : 0.06 + R() * 0.06);
          var tilt = j === 0 ? 0.05 : 0.25 + R() * 0.45;
          CRY[kk].push({ x: cx + Math.cos(aa) * dd, y: gy - 0.03, z: cz + Math.sin(aa) * dd, sx: rr, sy: hh / 1.62, sz: rr, rx: Math.sin(aa) * tilt, rz: -Math.cos(aa) * tilt, ry: R() * 2, c: R() > 0.5 ? 0xffffff : 0xdfe8ff });
        }
        halo(HCOL[key], cx, gy + size * 0.35, cz, size * 2.3, 0.32, 0.4);
        pool(HCOL[key], cx, cz, size * 3.0, 0.22, 0.3);
      }
      cluster(C1.x, C1.z, 'p', 9, 1.35, 'c');
      cluster(-2.75, -2.45, 'a', 7, 1.05);
      cluster(3.15, -0.1, 'a', 6, 0.95, 'p');
      cluster(2.75, 1.4, 'c', 6, 0.9);
      cluster(-3.0, 1.15, 'p', 5, 0.85, 'c');
      cluster(0.4, -3.2, 'c', 8, 1.2, 'p');
      cluster(-1.75, 2.75, 'c', 4, 0.6);
      cluster(1.65, 3.05, 'a', 4, 0.55);
      cluster(-3.6, -0.9, 'c', 5, 0.9, 'a');
      var crysMats = {};
      var reflGroup = new THREE.Group(); reflGroup.scale.y = -1; reflGroup.position.y = 2 * WATER_Y; scene.add(reflGroup);
      ['c', 'p', 'a'].forEach(function (kk) {
        var mt = addRim(new THREE.MeshStandardMaterial({ color: CRYC[kk][0], emissive: CRYC[kk][1], emissiveIntensity: 0.8, roughness: 0.22, metalness: 0.05, flatShading: true }));
        crysMats[kk] = mt;
        instanced(gCrys, mt, CRY[kk]);
        instanced(gCrys, mt, CRY[kk], reflGroup);
      });
      // cristal principal (objeto do experimento) sobre uma rocha
      var mainG = new THREE.Group(); mainG.position.copy(MC); mainG.position.y = caveH(MC.x, MC.z); mainG.scale.setScalar(1.3); mainG.rotation.y = 0.4; scene.add(mainG);
      mesh(gRock, M(0x463f92, { flatShading: true, roughness: 0.9 }), 0.42, 0.22, 0.36, 0, 0.05, 0, mainG);
      mesh(gRock, M(0x3a3482, { flatShading: true, roughness: 0.9 }), 0.22, 0.15, 0.2, 0.3, 0.02, 0.15, mainG);
      var mainMat = addRim(new THREE.MeshStandardMaterial({ color: 0x9ffaff, emissive: 0x1fd2ee, emissiveIntensity: 1, roughness: 0.18, metalness: 0.05, flatShading: true }));
      var mainPink = addRim(new THREE.MeshStandardMaterial({ color: 0xffb2ef, emissive: 0xe8379f, emissiveIntensity: 0.9, roughness: 0.2, flatShading: true }));
      [[0, 0.12, 0, 0.13, 0.62, 0, 0], [0.13, 0.1, 0.06, 0.08, 0.36, 0.35, -0.3], [-0.14, 0.1, 0.04, 0.085, 0.4, -0.2, 0.4], [0.02, 0.1, -0.13, 0.07, 0.3, -0.45, 0.1], [-0.05, 0.1, 0.15, 0.06, 0.24, 0.45, 0.2]].forEach(function (q, j) {
        var m = mesh(gCrys, j === 2 || j === 4 ? mainPink : mainMat, q[3], q[4] / 1.62 * 1.6, q[3], q[0], q[1], q[2], mainG);
        m.rotation.set(q[5], j * 0.7, q[6]);
      });
      var mainHalo = halo(0x46ecff, MC.x, 0.75, MC.z, 2.2, 0.42, 0.55);
      pool(0x3fe6ff, MC.x + 0.15, MC.z + 0.1, 3.4, 0.3, 0.35);
      blob(MC.x, MC.z, 1.0);

      /* ----- cogumelos bioluminescentes ----- */
      var STEM = [], CAPT = [], CAPV = [], DOTS = [];
      function shrooms(cx, cz, n, key, sc) {
        for (var j = 0; j < n; j++) {
          var aa = R() * Math.PI * 2, dd = j === 0 ? 0 : 0.1 + R() * 0.22, x0 = cx + Math.cos(aa) * dd, z0 = cz + Math.sin(aa) * dd, gy = caveH(x0, z0);
          var s = sc * (j === 0 ? 1 : 0.55 + R() * 0.35), hgt = 0.2 * s, cr = 0.12 * s, lean = (R() - 0.5) * 0.3;
          STEM.push({ x: x0, y: gy + hgt / 2, z: z0, sx: 0.035 * s, sy: hgt, sz: 0.035 * s, rz: lean, c: 0xe6e0ff });
          var cap = { x: x0 - Math.sin(lean) * hgt * 0.5, y: gy + hgt - 0.01, z: z0, sx: cr, sy: cr * 0.7, sz: cr, rz: lean, c: 0xffffff };
          (key === 't' ? CAPT : CAPV).push(cap);
          for (var d = 0; d < 2; d++) { var da = R() * 6.28; DOTS.push({ x: cap.x + Math.cos(da) * cr * 0.55, y: cap.y + cr * 0.48, z: z0 + Math.sin(da) * cr * 0.55, sx: cr * 0.16, sy: cr * 0.1, sz: cr * 0.16, c: 0xffffff }); }
        }
        var gy0 = caveH(cx, cz);
        halo(key === 't' ? 0x3cf7d8 : 0xb47bff, cx, gy0 + 0.2 * sc, cz, 0.95 * sc + 0.3, 0.3, 0.3);
        pool(key === 't' ? 0x2fe6c6 : 0x9a5cff, cx, cz, 1.2 * sc + 0.4, 0.2, 0.22);
      }
      shrooms(-0.55, 1.35, 4, 't', 1.1);
      shrooms(1.05, 0.75, 3, 'v', 0.9);
      shrooms(-2.75, -1.55, 4, 'v', 1.2);
      shrooms(0.15, -1.65, 3, 't', 0.8);
      shrooms(2.15, 2.25, 3, 't', 0.9);
      shrooms(-2.4, 0.3, 3, 't', 0.8);
      shrooms(3.3, -1.35, 3, 'v', 1.0);
      shrooms(-0.3, 3.3, 3, 'v', 0.9);
      instanced(gCyl, M(0xffffff, { roughness: 0.6, emissive: 0x6a5fd0, emissiveIntensity: 0.35 }), STEM);
      var capTMat = addRim(new THREE.MeshStandardMaterial({ color: 0x5ff7de, emissive: 0x1fd6b8, emissiveIntensity: 0.8, roughness: 0.45 }));
      var capVMat = addRim(new THREE.MeshStandardMaterial({ color: 0xcf9bff, emissive: 0x8a3cf0, emissiveIntensity: 0.8, roughness: 0.45 }));
      instanced(gHemi, capTMat, CAPT); instanced(gHemi, capVMat, CAPV);
      instanced(gSphLo, new THREE.MeshBasicMaterial({ color: 0xffffff }), DOTS);

      /* ----- lago com reflexo ----- */
      var waterMat = new THREE.MeshStandardMaterial({ color: 0x1d5e8c, emissive: 0x0d4a6e, emissiveIntensity: 0.75, roughness: 0.1, metalness: 0.25, transparent: true, opacity: 0.6, depthWrite: false });
      var water = mesh(G('disc', function () { var d = new THREE.CircleGeometry(1, 48); d.rotateX(-Math.PI / 2); return d; }), waterMat, PRX, 1, PRZ, PC.x, WATER_Y, PC.z, scene); water.renderOrder = 2;
      var glint = mesh(geos.disc, new THREE.MeshBasicMaterial({ map: glintT, color: 0x9ff6ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }), PRX * 0.95, 1, PRZ * 0.95, PC.x, WATER_Y + 0.006, PC.z, scene); glint.renderOrder = 3;
      // brilhos refletidos na água
      pool(0xff5fd2, C1.x - 0.75, C1.z + 0.95, 1.5, 0.3, 0.3, WATER_Y);
      pool(0xffad3a, 2.6, -0.45, 1.0, 0.22, 0.25, WATER_Y);
      pool(0x3fe6ff, 1.0, -1.85, 1.1, 0.22, 0.3, WATER_Y);
      // gotas e ondinhas (períodos que dividem o loop)
      var DROPS = [{ x: 1.25, z: -1.05, o: 0 }, { x: 2.05, z: -1.45, o: 0.68 }, { x: 1.55, z: -0.62, o: 1.34 }];
      var dropMat = new THREE.MeshBasicMaterial({ color: 0xc9fbff, transparent: true, opacity: 0.9 });
      var ringGeo = G('ring', function () { var r = new THREE.RingGeometry(0.86, 1, 40); r.rotateX(-Math.PI / 2); return r; });
      DROPS.forEach(function (d) {
        d.m = mesh(gSphLo, dropMat, 0.028, 0.06, 0.028, d.x, 3, d.z, scene);
        d.r1 = mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 1, 1, 1, d.x, WATER_Y + 0.01, d.z, scene);
        d.r2 = mesh(ringGeo, d.r1.material.clone(), 1, 1, 1, d.x, WATER_Y + 0.012, d.z, scene);
        d.r1.renderOrder = d.r2.renderOrder = 4;
      });

      /* ----- esporos flutuantes (Points) ----- */
      var NSPO = 46, spoPos = new Float32Array(NSPO * 3), spoCol = new Float32Array(NSPO * 3), spo = [];
      var spoCols = [[0.25, 0.95, 1], [1, 0.45, 0.85], [1, 0.75, 0.3], [0.3, 1, 0.85]];
      for (i = 0; i < NSPO; i++) spo.push({ x: -3.2 + R() * 6.4, z: -3 + R() * 6, o: R(), sp: 0.08 + R() * 0.1, ph: R() * 6, c: spoCols[i % 4] });
      var spoGeo = new THREE.BufferGeometry();
      spoGeo.setAttribute('position', new THREE.BufferAttribute(spoPos, 3)); spoGeo.setAttribute('color', new THREE.BufferAttribute(spoCol, 3));
      var spores = new THREE.Points(spoGeo, new THREE.PointsMaterial({ size: 0.13, map: glowT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
      spores.frustumCulled = false; scene.add(spores);

      /* ----- bloco de encaixe: banquinho de pesquisa + caixa de amostras ----- */
      (function () {
        var bx = -2.05, bz = -0.05, ry = 0.5;
        block(0.5, 0.26, 0.42, 0xe9dfcc, bx, caveH(bx, bz) + 0.13, bz, ry);
        addPin(bx - 0.1, caveH(bx, bz) + 0.26, bz + 0.05, 0xffc93c, ry); addPin(bx + 0.12, caveH(bx, bz) + 0.26, bz - 0.06, 0xffc93c, ry);
        var b2 = block(0.36, 0.2, 0.3, 0x2fb5a3, bx + 0.05, caveH(bx, bz) + 0.36, bz, ry + 0.2);
        addPin(bx + 0.05, caveH(bx, bz) + 0.46, bz, 0xbff6ee, ry + 0.2);
        addBow(bx + 0.05 + Math.sin(ry + 0.2) * 0.151, caveH(bx, bz) + 0.36, bz + Math.cos(ry + 0.2) * 0.151, ry + 0.2, 0xffc93c, 0.7);
        // frascos de amostras
        [[-0.1, 0x5ff0ff], [0.02, 0xff7ad9], [0.13, 0xffc44d]].forEach(function (q) {
          var fx = bx + q[0], fz = bz + 0.3, gy = caveH(fx, fz);
          mesh(gCyl, new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.55, roughness: 0.1 }), 0.04, 0.13, 0.04, fx, gy + 0.065, fz, scene);
          mesh(gCyl, new THREE.MeshStandardMaterial({ color: q[1], emissive: q[1], emissiveIntensity: 0.8 }), 0.033, 0.07, 0.033, fx, gy + 0.04, fz, scene);
        });
        blob(bx, bz, 0.9);
      })();
      // placa de trilha em blocos
      (function () {
        var sx = 1.45, sz = 2.0, gy = caveH(sx, sz);
        block(0.12, 0.6, 0.12, 0x9a5f34, sx, gy + 0.3, sz, 0.3);
        addPin(sx, gy + 0.6, sz, 0xffc93c);
        var sg = block(0.62, 0.26, 0.07, 0xfff4e0, sx, gy + 0.5, sz + 0.07, 0.3);
        var lbl = new THREE.Mesh(rbox(0.16, 0.16, 0.02, 0.03), M(0x2fc6c0, { emissive: 0x2fc6c0, emissiveIntensity: 0.4 })); lbl.position.set(-0.16, 0, 0.045); sg.add(lbl);
        [0, 1].forEach(function (k2) { var ln = new THREE.Mesh(rbox(0.26, 0.035, 0.02, 0.012), M(0x6f6f9a)); ln.position.set(0.1, 0.04 - k2 * 0.07, 0.045); sg.add(ln); });
        blob(sx, sz, 0.5);
      })();

      instanced(gHex, pinMat(0xffffff), PINS);
      instanced(gBow, M(0xffffff, { roughness: 0.5 }), BOWS);

      /* ----- personagens ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e);
        return e;
      }
      // HERÓI (idêntico ao da exploração)
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
      var pack = new THREE.Mesh(rbox(0.32, 0.36, 0.17, 0.07), M(ORANGE, { roughness: 0.6 })); pack.position.set(0, 0.86, -0.2); hB.add(pack);
      var flap = new THREE.Mesh(rbox(0.33, 0.14, 0.18, 0.06), M(ORANGE2, { roughness: 0.6 })); flap.position.set(0, 0.99, -0.2); hB.add(flap);
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
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead); hMouth.rotation.z = Math.PI;
      var hMouthO = mesh(gSph, M(0x8c2f2a, { roughness: 0.5 }), 0.03, 0.035, 0.02, 0, -0.075, 0.19, hHead); hMouthO.visible = false;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead);
      var heroBlob = blob(0, 0, 0.75);

      // LANTERNA na mão direita do herói
      var lantern = new THREE.Group(); hArms[0].add(lantern); lantern.position.set(0, -0.37, 0.02);
      var BRASS = 0xd9a441, IRON = 0x3b3552;
      var lRing = mesh(G('tor', null), M(IRON, { roughness: 0.5 }), 0.035, 0.035, 0.035, 0, -0.02, 0, lantern); lRing.rotation.y = Math.PI / 2;
      mesh(G('lcap', function () { return new THREE.CylinderGeometry(0.035, 0.085, 0.06, 12); }), M(BRASS, { roughness: 0.4 }), 1, 1, 1, 0, -0.07, 0, lantern);
      var glassMat = new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffaa3c, emissiveIntensity: 1.6, roughness: 0.2 });
      mesh(gCyl, glassMat, 0.068, 0.13, 0.068, 0, -0.165, 0, lantern);
      [0, 1, 2, 3].forEach(function (k3) { var an4 = k3 * Math.PI / 2 + Math.PI / 4; mesh(gCyl, M(IRON, { roughness: 0.5 }), 0.011, 0.14, 0.011, Math.cos(an4) * 0.07, -0.165, Math.sin(an4) * 0.07, lantern); });
      mesh(G('lbase', function () { return new THREE.CylinderGeometry(0.085, 0.075, 0.035, 12); }), M(BRASS, { roughness: 0.4 }), 1, 1, 1, 0, -0.245, 0, lantern);
      var lampHalo = new THREE.Sprite(glowMat(0xffb45e, 0.6)); lampHalo.scale.set(1.1, 1.1, 1); lampHalo.position.set(0, -0.165, 0); lantern.add(lampHalo);
      var lampPool = new THREE.Mesh(gPlane, poolMat(0xffa040, 0.3)); lampPool.renderOrder = 3; scene.add(lampPool);

      // PROFESSORA ÍRIS (cientista: jaleco, óculos de proteção na testa, cabelo preso)
      var iris = new THREE.Group(), iB = new THREE.Group(); iris.add(iB); scene.add(iris);
      var COAT = 0xe6e9f6, COAT2 = 0xcfd5ea, ISKIN = 0xe3a87c, ISKIN2 = 0xd4946a, IHAIR = 0x4a2a1c, TEALS = 0x2fb5a3;
      [-1, 1].forEach(function (sg) {
        var L = capsule(0.078, 0.3, 0x3a3f72, iB); L.position.set(sg * 0.115, 0.55, 0);
        mesh(gSph, M(0x8a5cf0, { roughness: 0.5 }), 0.1, 0.075, 0.145, 0, -0.36, 0.04, L);
        mesh(gSph, M(0xffffff), 0.103, 0.03, 0.148, 0, -0.41, 0.04, L);
      });
      mesh(gSph, M(COAT), 0.27, 0.33, 0.23, 0, 0.92, 0, iB);
      mesh(G('coat', function () { return new THREE.CylinderGeometry(1, 1.16, 1, 18, 1, true); }), M(COAT, { side: THREE.DoubleSide, roughness: 0.8 }), 0.262, 0.44, 0.222, 0, 0.66, 0, iB);
      mesh(gSph, M(TEALS), 0.11, 0.15, 0.06, 0, 1.08, 0.185, iB);
      [-1, 1].forEach(function (sg) { var lp = new THREE.Mesh(rbox(0.08, 0.26, 0.03, 0.012), M(COAT2)); lp.position.set(sg * 0.075, 1.0, 0.215); lp.rotation.set(-0.25, 0, sg * 0.35); iB.add(lp); });
      [0.93, 0.83, 0.73].forEach(function (yy) { ball(0xb8c2e0, 0.018, 0, yy, 0.235 - (0.93 - yy) * 0.05, iB); });
      var ipk = new THREE.Mesh(rbox(0.1, 0.08, 0.03, 0.012), M(COAT2)); ipk.position.set(-0.13, 0.98, 0.205); ipk.rotation.set(-0.15, -0.45, 0); iB.add(ipk);
      [[0x2fc6c0, -0.155], [0xff7ad9, -0.125]].forEach(function (q) { mesh(gCyl, M(q[0]), 0.009, 0.08, 0.009, q[1], 1.03, 0.205, iB); });
      var badge = new THREE.Mesh(rbox(0.07, 0.045, 0.02, 0.01), M(0x2fc6c0, { emissive: 0x2fc6c0, emissiveIntensity: 0.3 })); badge.position.set(0.12, 1.0, 0.205); badge.rotation.y = 0.45; iB.add(badge);
      var iArms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.29, 1.13, 0); iB.add(A);
        capsule(0.075, 0.14, COAT, A);
        var fa = capsule(0.068, 0.15, COAT, A); fa.position.y = -0.17;
        mesh(gCyl, M(COAT2), 0.075, 0.03, 0.075, 0, -0.33, 0, A);
        ball(ISKIN, 0.075, 0, -0.38, 0, A);
        return A;
      });
      // caderno na mão esquerda, lápis na direita
      var iNote = new THREE.Group(); iArms[1].add(iNote); iNote.position.set(-0.02, -0.4, 0.09);
      var nbCover = new THREE.Mesh(rbox(0.2, 0.26, 0.03, 0.012), M(0x5b8def, { roughness: 0.6 })); iNote.add(nbCover);
      var nbPage = new THREE.Mesh(rbox(0.17, 0.23, 0.02, 0.008), M(0xfffdf6)); nbPage.position.set(0.01, 0, 0.018); iNote.add(nbPage);
      iNote.rotation.set(-1.0, 0.2, 0.1);
      var pencil = mesh(gCyl, M(0xffc93c), 0.012, 0.14, 0.012, 0, -0.42, 0.04, iArms[0]); pencil.rotation.x = 1.0;
      var iHead = new THREE.Group(); iHead.position.set(0, 1.47, 0.02); iB.add(iHead);
      mesh(gSph, M(ISKIN, { roughness: 0.6 }), 0.2, 0.205, 0.195, 0, 0, 0, iHead);
      [-1, 1].forEach(function (sg) { ball(ISKIN2, 0.042, sg * 0.195, -0.01, 0, iHead); });
      var ihair = mesh(gHemi, M(IHAIR, { roughness: 0.55 }), 0.218, 0.215, 0.218, 0, 0.0, -0.015, iHead); ihair.rotation.x = -0.4;
      mesh(gSph, M(IHAIR, { roughness: 0.55 }), 0.19, 0.17, 0.12, 0, -0.03, -0.1, iHead);
      mesh(gSph, M(IHAIR, { roughness: 0.55 }), 0.115, 0.055, 0.085, -0.08, 0.15, 0.12, iHead).rotation.z = 0.45;
      mesh(gSph, M(IHAIR, { roughness: 0.55 }), 0.09, 0.05, 0.08, 0.07, 0.165, 0.12, iHead).rotation.z = -0.35;
      var bun = ball(IHAIR, 0.105, 0, 0.13, -0.2, iHead, { roughness: 0.55 });
      var tie = mesh(G('tor', null), M(0xff7ad9), 0.07, 0.07, 0.07, 0, 0.09, -0.15, iHead); tie.rotation.x = 0.9;
      // óculos de proteção na testa
      var strap = mesh(G('strap', function () { return new THREE.TorusGeometry(1, 0.085, 6, 32); }), M(0x24566a, { roughness: 0.6 }), 0.212, 0.212, 0.212, 0, 0.1, 0, iHead); strap.rotation.x = Math.PI / 2 - 0.5;
      var gogL = new THREE.MeshStandardMaterial({ color: 0xbff8ff, emissive: 0x6fe8ff, emissiveIntensity: 0.55, roughness: 0.1 });
      [-1, 1].forEach(function (sg) {
        var gg2 = new THREE.Group(); gg2.position.set(sg * 0.066, 0.155, 0.158); gg2.rotation.set(-0.5, sg * 0.28, 0); iHead.add(gg2);
        var fr = mesh(gCyl, M(TEALS, { roughness: 0.4 }), 0.058, 0.04, 0.058, 0, 0, 0, gg2); fr.rotation.x = Math.PI / 2;
        var ln = mesh(gCyl, gogL, 0.044, 0.044, 0.044, 0, 0, 0.003, gg2); ln.rotation.x = Math.PI / 2;
        mesh(gSphLo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.012, 0.012, 0.004, -0.015, 0.016, 0.026, gg2);
      });
      var iEyes = [eye(iHead, -0.07, 0.01, 0.165, 0.05), eye(iHead, 0.07, 0.01, 0.165, 0.05)];
      [-1, 1].forEach(function (sg) { var lash = mesh(gSph, M(0x2a1a14), 0.026, 0.009, 0.01, sg * 0.105, 0.05, 0.16, iHead); lash.rotation.z = sg * 0.6; });
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x3a2116), 0.036, 0.01, 0.014, sg * 0.072, 0.075, 0.182, iHead); bw.rotation.z = sg * -0.15; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8f7a, { transparent: true, opacity: 0.55 }), 0.036, 0.021, 0.01, sg * 0.118, -0.055, 0.162, iHead); });
      var iMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.034, 0.028, 0.03, 0, -0.075, 0.182, iHead); iMouth.rotation.z = Math.PI;
      ball(ISKIN2, 0.022, 0, -0.02, 0.198, iHead);
      var IRIS_P = new THREE.Vector3(-1.95, 0, -0.95);
      iris.position.copy(IRIS_P); iris.position.y = caveH(IRIS_P.x, IRIS_P.z); iris.scale.setScalar(1.12); hero.scale.setScalar(1.12);
      blob(IRIS_P.x, IRIS_P.z, 0.85);

      /* faíscas (estrelinhas) na revelação */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 26;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }), NSP);
      var spData = [], spCols = [0x8ffaff, 0xffffff, 0xff9ee8, 0x5ff0ff];
      for (i = 0; i < NSP; i++) { spData.push({ a: (i / NSP) * Math.PI * 2 * 2.3 + R(), up: 0.5 + R() * 0.9, r: 0.35 + R() * 0.55, s: 0.7 + R() * 0.8, d: R() * 0.25 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; scene.add(sparks);
      var revRing = mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 1, 1, 1, MC.x, caveH(MC.x, MC.z) + 0.05, MC.z, scene);

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = 'caverna-vig'; root.appendChild(vig);
      var SVGNS = 'http://www.w3.org/2000/svg';
      var wipe = document.createElementNS(SVGNS, 'svg'); wipe.setAttribute('class', 'caverna-wipe'); root.appendChild(wipe);
      var wipePath = document.createElementNS(SVGNS, 'path'); wipePath.setAttribute('fill', '#171640'); wipePath.setAttribute('fill-rule', 'evenodd'); wipe.appendChild(wipePath);
      var wipeEdge = document.createElementNS(SVGNS, 'path'); wipeEdge.setAttribute('fill', 'none'); wipeEdge.setAttribute('stroke', '#5fe3d6'); wipeEdge.setAttribute('stroke-width', '6'); wipeEdge.setAttribute('stroke-linejoin', 'round'); wipe.appendChild(wipeEdge);
      wipe.style.display = 'none';

      var hud = document.createElement('div'); hud.className = 'caverna-hud';
      hud.innerHTML =
        '<div class="caverna-top caverna-card"><div class="caverna-ava">' + AVATAR + '<span class="caverna-lv">4</span></div>' +
        '<div class="caverna-stat"><div class="caverna-ttl">Nível 4 · <span>Explorador</span></div>' +
        '<div class="caverna-bar"><div class="caverna-fill"></div><div class="caverna-flash"></div></div>' +
        '<div class="caverna-xpn"><span>Experiência</span><span><b class="caverna-xpv">620</b> / 1000 XP</span></div></div>' +
        '<div class="caverna-pause">' + IC_PAUSE + '</div></div>' +
        '<div class="caverna-quest caverna-card"><div class="caverna-qi">' + IC_CRYSTAL + '</div><div class="caverna-qt"><b>Missão:</b> descobrir o segredo dos cristais</div><div class="caverna-chk">' + IC_CHECK + '</div></div>' +
        '<div class="caverna-lamp caverna-card"><div class="caverna-li"></div><div class="caverna-sw"><i></i></div></div>' +
        '<div class="caverna-bub caverna-card"><div class="caverna-tail"></div><div class="caverna-nm">' + IC_GOGGLE + 'Professora Íris</div><div class="caverna-say">Apague a lanterna e <b>observe</b> o cristal!</div></div>' +
        '<div class="caverna-nb"><div class="caverna-ring"></div><div class="caverna-nbh"><div class="caverna-nbt">' + IC_NOTE + 'Caderno de ciências</div><div class="caverna-nbd">Caverna · dia 3</div></div>' +
        '<div class="caverna-nbb">' + SKETCH + '<div class="caverna-nbr"><div class="caverna-hw">No escuro, o cristal brilhou mais!</div><div class="caverna-stamp">Observação ✓</div></div></div></div>' +
        '<div class="caverna-ex caverna-card"><div class="caverna-exh"><span class="caverna-tag">' + IC_FLASK + 'Hipótese</span><span class="caverna-step">Experimento <i class="on"></i><i></i><i></i></span></div>' +
        '<div class="caverna-exq">O cristal brilha mais <b>no escuro</b> ou <b>na luz</b>?</div>' +
        '<div class="caverna-opts"><div class="caverna-opt caverna-o1"><i style="background:#2b2f6e">' + IC_MOON + '</i>No escuro<span class="caverna-ok">' + IC_CHECK + '</span></div>' +
        '<div class="caverna-opt caverna-o2"><i style="background:#fff2c9">' + IC_SUN + '</i>Na luz</div></div></div>' +
        '<div class="caverna-xp">' + IC_XP + '+50 XP</div>' +
        '<div class="caverna-btns">' +
        '<div class="caverna-btn caverna-card caverna-pri"><i class="caverna-bli"></i>Lanterna</div>' +
        '<div class="caverna-btn caverna-card"><i style="background:#e6eeff">' + IC_NOTE + '</i>Caderno</div>' +
        '<div class="caverna-btn caverna-card"><i style="background:#dcf6f4">' + IC_LUPA + '</i>Lupa</div></div>';
      root.appendChild(hud);
      function q(sel) { return hud.querySelector(sel); }
      var elFill = q('.caverna-fill'), elFlash = q('.caverna-flash'), elXpv = q('.caverna-xpv'), elBub = q('.caverna-bub'), elXp = q('.caverna-xp'),
        elChk = q('.caverna-chk'), elChkSvg = elChk.querySelector('svg'), elBtns = q('.caverna-btns'), elPri = q('.caverna-pri'), elBli = q('.caverna-bli'),
        elLi = q('.caverna-li'), elSw = q('.caverna-sw'), elKnob = elSw.querySelector('i'), elLamp = q('.caverna-lamp'),
        elEx = q('.caverna-ex'), elO1 = q('.caverna-o1'), elO2 = q('.caverna-o2'), elOk = q('.caverna-ok'), elNb = q('.caverna-nb'), elStamp = q('.caverna-stamp'), elQuest = q('.caverna-quest');
      var lampState = null;
      function setLamp(on) {
        if (on === lampState) return; lampState = on;
        elLi.innerHTML = icLantern(on); elBli.innerHTML = icLantern(on);
        elLi.style.background = on ? '#fff0d6' : '#e3e2f2';
                elSw.style.background = on ? '#ffb04a' : '#5a5f9a';
      }
      setLamp(true);

      /* ----- layout / câmera ----- */
      var S = 1, T0 = Math.tan(FOV / 2 * Math.PI / 180);
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        S = clamp(Math.min(W / 390, H / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        wipe.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);
      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion(), wp = new THREE.Vector3();
      function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }

      var HERO_A = new THREE.Vector3(0.95, 0, 3.0), HERO_B = new THREE.Vector3(0.32, 0, -0.2);
      var dirWalk = Math.atan2(HERO_B.x - HERO_A.x, HERO_B.z - HERO_A.z);
      var dirCrys = Math.atan2(MC.x - HERO_B.x, MC.z - HERO_B.z);

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        var s = t >= CUT ? t - LOOP : t;

        // escuro: a lanterna apaga (2,55 s) e volta (4,9 s)
        var D = sstep(2.55, 2.9, s) * (1 - sstep(4.85, 5.3, s));
        var reveal = sstep(2.6, 3.3, s) * (1 - sstep(4.85, 5.3, s));

        // ----- câmera: alta (exploração) → próxima e mais baixa, acompanhando devagar
        var zk = reduce ? 1 : sstep(0.15, 2.3, s);
        var asp = Math.min(camera.aspect, 0.75);
        var az = lerp(24, 13, zk) * Math.PI / 180 - (reduce ? 0 : 0.05 * sstep(2.0, 5.6, s));
        var el = lerp(53, 31, zk) * Math.PI / 180;
        var ww = lerp(7.6, 4.25, zk) * (reduce ? 1 : 1 - 0.035 * sstep(2.3, 5.6, s));
        var dist = (ww / 2) / (T0 * asp);
        var hx = hero.position.x, hz = hero.position.z;
        var tx = lerp(0.35, -0.5 + 0.25 * (hx - HERO_B.x), zk), ty = lerp(0, 0.55, zk), tz = lerp(0.55, -0.5 + 0.25 * (hz - HERO_B.z), zk);
        camera.position.set(tx + dist * Math.sin(az) * Math.cos(el), ty + dist * Math.sin(el), tz + dist * Math.cos(az) * Math.cos(el));
        camera.lookAt(tx, ty, tz);
        camera.setViewOffset(W, H, 0, H * lerp(0.0, 0.035, zk), W, H);
        camera.updateMatrixWorld();
        scene.fog.near = dist - 3; scene.fog.far = dist + 16;
        fill.position.set(tx + Math.sin(az - 0.5) * 6, ty + 3.2, tz + Math.cos(az - 0.5) * 6); fill.target.position.set(tx, ty, tz);

        // ----- herói: caminha com a lanterna, para, apaga, se encanta, comemora
        var wk = clamp(s / 1.7, 0, 1), we = 1 - Math.pow(1 - wk, 1.7);
        hero.position.lerpVectors(HERO_A, HERO_B, we);
        hero.position.y = caveH(hero.position.x, hero.position.z) + 0.02;
        var walking = 1 - sstep(1.45, 1.75, s);
        var ph = s * Math.PI * 2 * 1.7;
        var sw = Math.sin(ph) * 0.7 * walking;
        hLegs[0].rotation.x = sw; hLegs[1].rotation.x = -sw;
        var bob = Math.abs(Math.cos(ph));
        hB.position.y = bob * 0.06 * walking;
        hB.rotation.z = Math.sin(ph) * 0.06 * walking;
        hB.rotation.x = 0.08 * walking;
        var turn = sstep(1.4, 2.0, s);
        var cheer = sstep(3.25, 3.45, s) * (1 - sstep(4.3, 4.6, s));
        var toCam = sstep(3.15, 3.5, s) * (1 - sstep(4.45, 4.85, s));
        hero.rotation.y = lerp(lerp(dirWalk, dirCrys, turn), 0.55, toCam);
        // braço com a lanterna: erguida para iluminar, abaixa para apagar
        var raise = (0.55 + 0.25 * turn) * (1 - sstep(2.4, 2.65, s)) + 0.55 * sstep(4.85, 5.3, s);
        var lift = 0.18 * sstep(2.4, 2.65, s) * (1 - sstep(4.85, 5.3, s));
        hArms[0].rotation.x = -raise - sw * 0.25 - lift; hArms[0].rotation.z = -0.22 - 0.12 * turn;
        // outro braço: balanço → toca a lanterna (apaga) → comemora
        var touch = sstep(2.25, 2.45, s) * (1 - sstep(2.65, 2.85, s));
        hArms[1].rotation.x = sw * 0.9 - touch * 1.1 - cheer * (2.6 + Math.sin(wall * 18) * 0.12);
        hArms[1].rotation.z = 0.18 - touch * 0.75 + cheer * 0.25;
        hArms[1].rotation.y = 0;
        // lanterna sempre na vertical, balançando de leve
        lantern.rotation.x = -hArms[0].rotation.x + Math.sin(wall * 3.2) * 0.08 + sw * 0.15;
        lantern.rotation.z = -hArms[0].rotation.z + Math.sin(wall * 2.3) * 0.05;
        var amaze = sstep(2.85, 3.05, s) * (1 - sstep(3.3, 3.45, s));
        var land = pulse(1.6, 1.85, s);
        var jump = pulse(3.3, 3.72, s);
        hB.position.y += jump * 0.28;
        var sq = 1 + (bob - 0.5) * 0.07 * walking - land * 0.08 + Math.sin(wall * 3.1) * 0.01 + jump * 0.1 - pulse(3.2, 3.3, s) * 0.12;
        hSq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        hHead.rotation.x = -0.15 - 0.18 * amaze + 0.05 * turn * (1 - toCam);
        hHead.rotation.y = -0.15 * turn * (1 - toCam) + 0.3 * sstep(1.0, 1.4, s) * (1 - sstep(1.5, 1.9, s));
        hHead.rotation.z = Math.sin(ph) * 0.05 * walking + 0.08 * cheer * Math.sin(wall * 9);
        hMouth.visible = amaze < 0.5; hMouthO.visible = amaze >= 0.5;
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + cheer * 1.4), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink) * (1 + amaze * 0.18);
        heroBlob.position.set(hero.position.x, caveH(hero.position.x, hero.position.z) + 0.02, hero.position.z);

        // lanterna: luz pontual quente segue o vidro
        hero.updateMatrixWorld(true);
        lantern.getWorldPosition(wp); wp.y -= 0.18;
        var flick = 1 + Math.sin(wall * 13) * 0.03 + Math.sin(wall * 7.3) * 0.03;
        lampL.position.copy(wp);
        lampL.intensity = 2.5 * (1 - D) * flick;
        lampL.visible = lampL.intensity > 0.01;
        glassMat.emissiveIntensity = 0.06 + 1.6 * (1 - D) * flick;
        glassMat.color.setHex(D > 0.6 ? 0xb9b4d6 : 0xffe6b0);
        lampHalo.material.opacity = 0.62 * (1 - D);
        lampPool.position.set(wp.x, caveH(wp.x, wp.z) + 0.03, wp.z); lampPool.scale.set(2.6, 1, 2.6); lampPool.material.opacity = 0.32 * (1 - D);

        // ----- caverna reage ao escuro
        hemi.intensity = 0.78 - 0.42 * D;
        moon.intensity = 0.32 - 0.2 * D;
        var pul = 0.5 + 0.5 * Math.sin(wall * 2.4);
        crysMats.c.emissiveIntensity = 0.75 + 0.85 * D + 0.12 * pul;
        crysMats.p.emissiveIntensity = 0.75 + 0.8 * D + 0.12 * Math.sin(wall * 2.0 + 1);
        crysMats.a.emissiveIntensity = 0.7 + 0.8 * D + 0.1 * Math.sin(wall * 1.7 + 2);
        mainMat.emissiveIntensity = 0.9 + 1.7 * D + 0.18 * pul;
        mainPink.emissiveIntensity = 0.8 + 1.2 * D;
        capTMat.emissiveIntensity = 0.75 + 0.55 * D + 0.15 * Math.sin(wall * 1.6);
        capVMat.emissiveIntensity = 0.75 + 0.55 * D + 0.15 * Math.sin(wall * 1.3 + 2);
        cyanL.intensity = 1.0 + 1.1 * D + 0.12 * pul;
        pinkL.intensity = 1.1 + 0.9 * D;
        HALOS.forEach(function (hh, j) { hh.o.material.opacity = (hh.base + hh.gain * D) * (0.88 + 0.12 * Math.sin(wall * 1.9 + j * 1.7)); });
        var ms = 2.2 + 1.3 * reveal + 0.15 * pul; mainHalo.scale.set(ms, ms, 1);
        rimU.uRimStr.value = 0.5;
        
        waterMat.emissiveIntensity = 0.75 + 0.5 * D;
        glintT.offset.x = -wall * 0.03; glintT.offset.y = Math.sin(wall * 0.6) * 0.02;
        glint.material.opacity = 0.26 + 0.1 * Math.sin(wall * 2.1) + 0.12 * D;

        // gotas (período 2 s → fecha o loop)
        DROPS.forEach(function (d) {
          var pp = ((t + d.o) % 2) / 2;
          if (pp < 0.34) { var f = pp / 0.34; d.m.visible = true; d.m.position.y = lerp(3.4, WATER_Y, f * f); }
          else d.m.visible = false;
          var r1 = clamp((pp - 0.34) / 0.5, 0, 1), r2 = clamp((pp - 0.42) / 0.5, 0, 1);
          d.r1.visible = pp > 0.34 && r1 < 1; d.r2.visible = pp > 0.42 && r2 < 1;
          d.r1.scale.set(0.04 + outCubic(r1) * 0.42, 1, 0.04 + outCubic(r1) * 0.42); d.r1.material.opacity = (1 - r1) * 0.85;
          d.r2.scale.set(0.03 + outCubic(r2) * 0.28, 1, 0.03 + outCubic(r2) * 0.28); d.r2.material.opacity = (1 - r2) * 0.6;
        });
        // esporos
        for (var i = 0; i < NSPO; i++) {
          var sp = spo[i], k = (wall * sp.sp + sp.o) % 1;
          spoPos[i * 3] = sp.x + Math.sin(wall * 0.7 + sp.ph) * 0.25; spoPos[i * 3 + 1] = 0.15 + k * 2.4; spoPos[i * 3 + 2] = sp.z + Math.cos(wall * 0.5 + sp.ph) * 0.2;
          var br = Math.sin(k * Math.PI) * (0.55 + 0.45 * Math.sin(wall * 3 + sp.ph)) * (0.7 + 0.5 * D);
          spoCol[i * 3] = sp.c[0] * br; spoCol[i * 3 + 1] = sp.c[1] * br; spoCol[i * 3 + 2] = sp.c[2] * br;
        }
        spoGeo.attributes.position.needsUpdate = true; spoGeo.attributes.color.needsUpdate = true;

        // ----- Professora Íris: explica, aponta, se encanta, anota
        var talk = sstep(0.75, 0.95, s) * (1 - sstep(2.45, 2.7, s));
        var wow = sstep(2.9, 3.1, s) * (1 - sstep(3.45, 3.65, s));
        var write = sstep(3.55, 3.75, s) * (1 - sstep(4.5, 4.75, s));
        iris.rotation.y = 0.55 - 0.35 * talk + 0.3 * wow + 0.2 * write;
        iB.position.y = Math.abs(Math.sin(wall * 2.0)) * 0.01 + wow * Math.max(0, Math.sin((s - 2.9) * 10)) * 0.05;
        iB.rotation.z = Math.sin(s * 6) * 0.03 * talk;
        var ia = iArms[1], ir = iArms[0];
        ir.rotation.set(-0.15, 0, -0.14); ia.rotation.set(-0.75, 0, 0.3);
        ir.rotation.x -= talk * (1.25 + Math.sin(s * 9) * 0.15); ir.rotation.z -= talk * 0.45;
        ir.rotation.x -= wow * 1.9; ir.rotation.z -= wow * 0.3; ia.rotation.x -= wow * 0.5;
        ir.rotation.x -= write * (0.95 + Math.sin(wall * 16) * 0.08); ir.rotation.z += write * (0.55 + Math.sin(wall * 11) * 0.06);
        ia.rotation.x -= write * 0.25; ia.rotation.z -= write * 0.12;
        iHead.rotation.x = -0.25 + Math.sin(s * 10) * 0.05 * talk + 0.22 * write - 0.1 * wow;
        iHead.rotation.y = -0.15 * talk + 0.2 * write;
        iHead.rotation.z = 0.08 * talk + 0.05 * Math.sin(wall * 1.2);
        iMouth.scale.set(0.034 * (1 + wow * 0.3), 0.028 * (1 + talk * (0.6 + 0.6 * Math.sin(s * 22)) + wow * 1.2), 0.03);
        var bl2 = (wall + 1.4) % 3.7, blink2 = bl2 < 0.12 ? Math.abs(Math.cos(bl2 / 0.12 * Math.PI)) : 1;
        iEyes[0].scale.y = iEyes[1].scale.y = Math.max(0.1, blink2);

        // ----- faíscas e anel na revelação
        camQ.copy(camera.quaternion);
        var gy0 = caveH(MC.x, MC.z);
        for (i = 0; i < NSP; i++) {
          var sd = spData[i], fk = clamp((s - 2.75 - sd.d) / 0.85, 0, 1), on = s > 2.75 + sd.d && fk < 1;
          if (!on) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else {
            var ee = outCubic(fk), rr = sd.r * ee;
            dummy.position.set(MC.x + Math.cos(sd.a) * rr, gy0 + 0.35 + sd.up * ee - fk * fk * 0.3, MC.z + Math.sin(sd.a) * rr * 0.8);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk * 1.3) * Math.PI) * 1.3 + 0.0001);
          }
          dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + sd.a);
          dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;
        var rk = clamp((s - 2.8) / 0.7, 0, 1);
        revRing.visible = s > 2.8 && rk < 1; revRing.scale.set(0.3 + outCubic(rk) * 1.4, 1, 0.3 + outCubic(rk) * 1.4); revRing.material.opacity = (1 - rk) * 0.9;

        // ----- HUD
        var xpK = sstep(4.4, 4.85, s);
        elFill.style.width = (62 + 5 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(620 + 50 * xpK);
        var fl2 = clamp((s - 4.45) / 0.5, 0, 1);
        elFlash.style.opacity = s > 4.45 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elFlash.style.left = (fl2 * 70) + '%';
        var done = sstep(4.3, 4.4, s);
        elChk.style.background = done > 0.5 ? '#43c59e' : 'transparent';
        elChk.style.borderColor = done > 0.5 ? '#43c59e' : '#d5d3df';
        elChk.style.transform = 'scale(' + (1 + 0.35 * pulse(4.3, 4.55, s)).toFixed(3) + ')';
        elChkSvg.style.opacity = done;
        // lanterna: botão apertado + interruptor
        var off = s > 2.55 && s < 4.9;
        setLamp(!off);
        elKnob.style.transform = 'translateX(' + (off ? 0 : 14 * S).toFixed(1) + 'px)';
        elLamp.style.transform = 'scale(' + (1 + 0.08 * (pulse(2.5, 2.75, s) + pulse(4.85, 5.1, s))).toFixed(3) + ')';
        var press = pulse(2.35, 2.65, s);
        elPri.style.transform = 'translateY(' + (press * 3 * S).toFixed(2) + 'px) scale(' + (1 - press * 0.05).toFixed(3) + ')';
        elPri.style.filter = press > 0.05 ? 'brightness(' + (1 - press * 0.12).toFixed(3) + ')' : '';

        // balão da Professora Íris (acima da cabeça)
        var bIn = clamp((s - 0.75) / 0.3, 0, 1), bOut = sstep(2.55, 2.8, s);
        var bsc = (bIn > 0 ? outBack(bIn, 2.2) : 0) * (1 - bOut * 0.3);
        var hp = proj(iris.position.x, iris.position.y + 2.05, iris.position.z);
        var bw2 = elBub.offsetWidth || 196, bh2 = elBub.offsetHeight || 80;
        var minTop = elQuest.offsetTop + elQuest.offsetHeight + 16 * S;
        var left = clamp(hp.x - 40 * S, 10 * S, W - bw2 - 10 * S);
        var topB = Math.max(minTop, hp.y - bh2 - 12 * S);
        var tx2 = clamp(hp.x - left, 22 * S, bw2 - 22 * S);
        elBub.style.setProperty('--tx', tx2.toFixed(1) + 'px');
        elBub.style.transformOrigin = tx2.toFixed(0) + 'px 100%';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 2.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, bsc).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 3) * (1 - bOut)).toFixed(3);

        // cartão da hipótese
        var eIn = sstep(1.1, 1.5, s), eOut = sstep(3.8, 4.05, s);
        elEx.style.opacity = (eIn * (1 - eOut)).toFixed(3);
        elEx.style.transform = 'translateY(' + ((1 - outCubic(eIn)) * 40 * S).toFixed(1) + 'px) scale(' + (1 - 0.06 * eOut).toFixed(3) + ')';
        var pick = sstep(3.15, 3.3, s);
        var okK = clamp((s - 3.2) / 0.25, 0, 1);
        elOk.style.transform = 'scale(' + (s > 3.2 ? outBack(okK, 2.6) : 0).toFixed(3) + ')';
        elO1.style.boxShadow = pick > 0.5 ? '0 0 0 ' + (2.5 * S).toFixed(1) + 'px #43c59e inset, 0 0 ' + (14 * S).toFixed(0) + 'px rgba(67,197,158,.35)' : '';
        elO1.style.background = pick > 0.5 ? '#eafaf3' : '';
        elO1.style.transform = 'scale(' + (1 + 0.06 * pulse(3.22, 3.5, s)).toFixed(3) + ')';
        elO2.style.opacity = (1 - 0.5 * pick).toFixed(2);
        // "pensando": as opções pulsam de leve antes do teste
        var think = sstep(1.7, 1.9, s) * (1 - sstep(2.3, 2.5, s));
        elO2.style.transform = 'scale(' + (1 + 0.025 * think * Math.sin(wall * 9)).toFixed(3) + ')';

        // caderno de anotações
        var nIn = clamp((s - 3.85) / 0.4, 0, 1), nOut = sstep(5.1, 5.4, s);
        elNb.style.opacity = (Math.min(1, nIn * 2.5) * (1 - nOut)).toFixed(3);
        elNb.style.transform = 'translateY(' + ((1 - outCubic(nIn)) * 70 * S + nOut * 20 * S).toFixed(1) + 'px) rotate(' + (-2.5 * (1 - outCubic(nIn)) - 0.6).toFixed(2) + 'deg)';
        var stK = clamp((s - 4.25) / 0.28, 0, 1);
        elStamp.style.transform = 'rotate(-6deg) scale(' + (s > 4.25 ? (stK < 1 ? 1.6 - 0.6 * outCubic(stK) : 1) : 0).toFixed(3) + ')';
        elStamp.style.opacity = s > 4.25 ? Math.min(1, stK * 3).toFixed(2) : '0';

        // +50 XP
        var xk = clamp((s - 4.35) / 0.85, 0, 1);
        var xpP = proj(hero.position.x, hero.position.y + 1.9, hero.position.z);
        elXp.style.opacity = s > 4.35 ? (xk < 0.12 ? xk / 0.12 : 1 - sstep(0.65, 1, xk)).toFixed(3) : 0;
        elXp.style.transform = 'translate(' + xpP.x.toFixed(1) + 'px,' + (xpP.y - 10 * S - 60 * S * outCubic(xk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.2 ? outBack(xk / 0.2, 2.4) : 1).toFixed(3) + ')';

        // transição em losango (mesma da exploração), em tons da caverna
        var ik = t < CUT ? sstep(5.45, CUT, t) : 1 - sstep(CUT, LOOP, t);
        if (ik <= 0.002) { wipe.style.display = 'none'; }
        else {
          wipe.style.display = 'block';
          var hpp = proj(hero.position.x, hero.position.y + 0.7, hero.position.z);
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
          for (var k in geos) if (geos[k]) geos[k].dispose();
          disposables.forEach(function (d) { d.dispose(); });
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
