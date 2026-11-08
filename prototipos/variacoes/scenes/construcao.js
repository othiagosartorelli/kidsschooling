/* MODO CONSTRUÇÃO NA OFICINA — variação do estilo COMBINADO (aprovado). KidsSchooling
   Trilha Engenharia civil · Nível 3. A câmera parte do enquadramento alto padrão da exploração
   e dá zoom (mais perto e mais de cima) na plataforma de obra ao lado da oficina do Mestre Tomé.
   Entra o "modo construção": mundo levemente dessaturado e azulado, grade técnica ciano no chão,
   linhas de cota, peças fantasma, setas de força. Torre com contraventamento em X + 3 caixotes.
   Loop de 6,6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'construcao';
  var LOOP = 6.6;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function inOut(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pulse(s, a, d) { return s > a && s < a + d ? Math.sin((s - a) / d * Math.PI) : 0; }

  /* câmera: enquadramento padrão da exploração (igual ao combinado) e o da construção */
  var AZ = 35 * Math.PI / 180, EL0 = 53 * Math.PI / 180, FOV = 30;
  var AZ1 = 33 * Math.PI / 180, EL1 = 58 * Math.PI / 180;
  var RX = Math.cos(AZ), RZ = -Math.sin(AZ);
  var FX = -Math.sin(AZ), FZ = -Math.cos(AZ);
  function uv2w(u, v) { return { x: RX * u + FX * v, z: RZ * u + FZ * v }; }

  /* ---------- HUD (mesmo sistema de cartões creme do combinado) ---------- */
  var CSS = [
    '.@@-root{position:absolute;inset:0;overflow:hidden;background:#8fcf6a;-webkit-user-select:none;user-select:none;}',
    '.@@-root canvas.@@-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.@@-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 80% at 50% 48%,rgba(255,255,255,0) 55%,rgba(40,60,40,.22) 100%);}',
    '.@@-bpv{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(110% 70% at 50% 50%,rgba(20,60,120,0) 50%,rgba(14,40,92,.42) 100%),linear-gradient(180deg,rgba(40,110,200,.10),rgba(40,110,200,0) 40%,rgba(40,110,200,.08));}',
    '.@@-wipe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;}',
    '.@@-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.@@-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(120,90,50,.10),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(50,40,20,.20);}',
    '.@@-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.@@-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.@@-ava svg{display:block;width:100%;height:100%;}',
    '.@@-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.@@-stat{flex:1;min-width:0;}',
    '.@@-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.@@-ttl span{color:#2f6fe0;}',
    '.@@-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#efe5d3;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(80,60,30,.18);overflow:hidden;}',
    '.@@-fill{position:absolute;left:0;top:0;bottom:0;width:56%;border-radius:99px;background:linear-gradient(90deg,#43c59e,#7fdc5a);}',
    '.@@-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.@@-flash{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.@@-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#7b6f5e;font-variant-numeric:tabular-nums;}',
    '.@@-xpn b{color:#2a3350;font-weight:800;}',
    '.@@-pause{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#f3ead9;display:grid;place-items:center;}',
    '.@@-pause svg{width:46%;height:46%;}',
    /* missão (exploração) */
    '.@@-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(12px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:calc(236px*var(--s));}',
    '.@@-qi{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#e3f1ff;display:grid;place-items:center;}',
    '.@@-qi svg{width:80%;height:80%;}',
    '.@@-qt{font-weight:700;font-size:calc(13.5px*var(--s));line-height:1.18;color:#3a4260;}',
    '.@@-qt b{font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#ff7a1a;}',
    /* cartão de desafio (modo construção) */
    '.@@-chal{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));padding:calc(10px*var(--s)) calc(12px*var(--s)) calc(10px*var(--s));opacity:0;}',
    '.@@-chh{display:flex;align-items:center;gap:calc(7px*var(--s));}',
    '.@@-tag{display:inline-flex;align-items:center;gap:calc(4px*var(--s));padding:calc(3px*var(--s)) calc(9px*var(--s)) calc(3px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#2f6fe0;color:#fff;font:600 calc(12.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.02em;}',
    '.@@-tag svg{width:calc(15px*var(--s));height:calc(15px*var(--s));}',
    '.@@-trk{font-weight:800;font-size:calc(12px*var(--s));color:#7b6f5e;white-space:nowrap;}',
    '.@@-cht{margin-top:calc(6px*var(--s));font:600 calc(17px*var(--s))/1.18 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.@@-cht b{font-weight:600;color:#ff7a1a;}',
    '.@@-chr{margin-top:calc(8px*var(--s));display:flex;align-items:center;gap:calc(10px*var(--s));}',
    '.@@-crs{display:flex;gap:calc(5px*var(--s));flex:none;}',
    '.@@-cr{width:calc(30px*var(--s));height:calc(30px*var(--s));border-radius:calc(9px*var(--s));background:#f3ead9;display:grid;place-items:center;box-shadow:inset 0 0 0 calc(1.5px*var(--s)) #e2d4bb;}',
    '.@@-cr svg{width:78%;height:78%;opacity:.28;filter:grayscale(1);}',
    '.@@-cr.on{background:#fff0e0;box-shadow:inset 0 0 0 calc(2px*var(--s)) #ff9b3d;}',
    '.@@-cr.on svg{opacity:1;filter:none;}',
    '.@@-stab{flex:1;min-width:0;}',
    '.@@-stl{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:calc(12px*var(--s));color:#7b6f5e;line-height:1;white-space:nowrap;}',
    '.@@-stl b{font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2f6fe0;}',
    '.@@-sbar{position:relative;margin-top:calc(5px*var(--s));height:calc(10px*var(--s));border-radius:99px;background:#efe5d3;overflow:hidden;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(80,60,30,.18);}',
    '.@@-sfill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:linear-gradient(90deg,#5aa9e6,#2f6fe0);}',
    '.@@-ok{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:calc(6px*var(--s));border-radius:calc(12px*var(--s));background:#43c59e;color:#fff;font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;opacity:0;box-shadow:0 calc(4px*var(--s)) calc(10px*var(--s)) rgba(30,140,100,.35);}',
    '.@@-ok svg{width:calc(20px*var(--s));height:calc(20px*var(--s));}',
    '.@@-chr{position:relative;}',
    /* selo do modo e cantoneiras técnicas */
    '.@@-mode{position:absolute;left:50%;top:0;display:flex;align-items:center;gap:calc(6px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(7px*var(--s));border-radius:99px;background:rgba(16,44,92,.88);color:#bff6ff;font:600 calc(13px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 0 0 calc(1.5px*var(--s)) rgba(120,230,255,.75),0 calc(5px*var(--s)) calc(14px*var(--s)) rgba(10,30,70,.35);opacity:0;white-space:nowrap;}',
    '.@@-mode svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.@@-crn{position:absolute;width:calc(22px*var(--s));height:calc(22px*var(--s));border:calc(2.5px*var(--s)) solid #8ff3ff;opacity:0;filter:drop-shadow(0 0 calc(3px*var(--s)) rgba(120,240,255,.8));}',
    /* rótulos de cota e selo de estabilidade no mundo */
    '.@@-dim{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;padding:calc(3px*var(--s)) calc(8px*var(--s));border-radius:calc(8px*var(--s));background:rgba(16,44,92,.9);color:#fff;font:600 calc(14px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 0 0 calc(1.5px*var(--s)) #8ff3ff,0 calc(3px*var(--s)) calc(8px*var(--s)) rgba(10,30,70,.35);}',
    '.@@-wok{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(6px*var(--s));padding:calc(6px*var(--s)) calc(13px*var(--s)) calc(6px*var(--s)) calc(7px*var(--s));border-radius:99px;background:#43c59e;color:#fff;font:600 calc(16px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 0 0 calc(3px*var(--s)) #fffaf0,0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(20,90,60,.4);}',
    '.@@-wok svg{width:calc(22px*var(--s));height:calc(22px*var(--s));}',
    /* balão do Mestre Tomé (cauda para baixo) */
    '.@@-bub{position:absolute;left:0;top:0;width:calc(206px*var(--s));padding:calc(16px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;transform-origin:0 0;}',
    '.@@-bub .@@-tail{position:absolute;top:calc(-9px*var(--s));left:var(--tx,24px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));box-shadow:calc(4px*var(--s)) calc(4px*var(--s)) calc(8px*var(--s)) rgba(50,40,20,.12);}',
    '.@@-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#ffc93c;color:#4a3208;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(120,80,10,.25);}',
    '.@@-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.@@-say{position:relative;font-weight:700;font-size:calc(15px*var(--s));line-height:1.25;color:#2a3350;}',
    '.@@-say b{color:#1f9bb0;font-weight:800;}',
    '.@@-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(50,40,20,.25);font:600 calc(19px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1f9e6e;}',
    '.@@-xp svg{width:calc(22px*var(--s));height:calc(22px*var(--s));}',
    /* botões da exploração */
    '.@@-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.@@-btn{flex:1;height:calc(72px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.@@-btn i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));display:grid;place-items:center;}',
    '.@@-btn i svg{width:76%;height:76%;}',
    '.@@-btn.@@-pri{background:linear-gradient(180deg,#ff9b3d,#ff7a1a);color:#fff;box-shadow:0 0 0 calc(1px*var(--s)) rgba(160,70,0,.15),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(200,90,0,.35);}',
    '.@@-btn.@@-pri i{background:rgba(255,255,255,.22);}',
    /* paleta de ferramentas (modo construção) */
    '.@@-pal{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);height:calc(84px*var(--s));display:flex;align-items:center;gap:calc(6px*var(--s));padding:0 calc(8px*var(--s));box-sizing:border-box;opacity:0;}',
    '.@@-tool{position:relative;flex:1;height:calc(68px*var(--s));border-radius:calc(14px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(3px*var(--s));font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#5d5546;}',
    '.@@-tool i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));display:grid;place-items:center;background:#f3ead9;}',
    '.@@-tool i svg{width:82%;height:82%;}',
    '.@@-tool em{position:absolute;right:calc(3px*var(--s));top:calc(3px*var(--s));min-width:calc(19px*var(--s));height:calc(17px*var(--s));padding:0 calc(4px*var(--s));box-sizing:border-box;border-radius:99px;background:#efe5d3;color:#7b6f5e;font:700 calc(11px*var(--s))/calc(17px*var(--s)) "Nunito Sans",system-ui,sans-serif;font-style:normal;text-align:center;}',
    '.@@-tool.sel{background:#e3f1ff;color:#1d4fb0;box-shadow:inset 0 0 0 calc(2.5px*var(--s)) #2f6fe0,0 calc(6px*var(--s)) calc(12px*var(--s)) rgba(47,111,224,.28);}',
    '.@@-tool.sel i{background:#fff;}',
    '.@@-tool.sel em{background:#2f6fe0;color:#fff;}',
    '.@@-sep{flex:none;width:calc(1.5px*var(--s));height:calc(48px*var(--s));background:#e8dcc6;border-radius:2px;}',
    '.@@-test{flex:none;width:calc(70px*var(--s));height:calc(68px*var(--s));border-radius:calc(14px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));background:linear-gradient(180deg,#5fd6a8,#2fb582);color:#fff;font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(5px*var(--s)) calc(12px*var(--s)) rgba(30,140,100,.35);}',
    '.@@-test i{width:calc(32px*var(--s));height:calc(32px*var(--s));border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;}',
    '.@@-test i svg{width:60%;height:60%;}'
  ].join('\n').replace(/@@/g, ID);

  function H(str) { return str.replace(/@@/g, ID); }

  /* ícones SVG flat (mesmo traço do combinado) */
  var AVATAR = H('<svg viewBox="0 0 64 64"><defs><linearGradient id="@@-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="@@-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#@@-avbg)"/>' +
    '<g clip-path="url(#@@-avc)">' +
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
    '</g></svg>');
  var IC_PAUSE = '<svg viewBox="0 0 20 20"><rect x="4.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/><rect x="11.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/></svg>';
  var IC_HELMET = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><path d="M5 15a7 7 0 0 1 14 0z" fill="#ffc93c" stroke="#d99a12" stroke-width="1.2"/><rect x="3.5" y="14.5" width="17" height="3" rx="1.5" fill="#f2a71a"/><path d="M12 8v6" stroke="#d99a12" stroke-width="1.6"/></svg>';
  var IC_XP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_CHECKW = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M6.5 12.5l3.6 3.6 7.4-8" stroke="#2fb582" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_BUILD = '<svg viewBox="0 0 32 32"><path d="M5 19l11-5.5L27 19 16 24.5z" fill="#fff"/><path d="M5 19v4.5L16 29v-4.5z" fill="#ffe2c4"/><path d="M27 19v4.5L16 29v-4.5z" fill="#ffd0a3"/>' +
    '<path d="M9 10.5l7-3.5 7 3.5-7 3.5z" fill="#fff"/><path d="M9 10.5v3.8l7 3.5v-3.8z" fill="#ffe2c4"/><path d="M23 10.5v3.8l-7 3.5v-3.8z" fill="#ffd0a3"/>' +
    '<path d="M13.6 9.2l1.2-.7h2.4l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/><path d="M8.8 18.6l1.2-.7h2.4l1.2.7-1.2.7H10z M18.4 18.6l1.2-.7H22l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 32 32"><path d="M11 9V7.5a5 5 0 0 1 10 0V9" stroke="#e86f12" stroke-width="2.6" fill="none"/><rect x="6" y="9" width="20" height="19" rx="6" fill="#ff8a2a"/><path d="M6 15.5a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1H6z" fill="#e86f12"/><rect x="12" y="19" width="8" height="5.5" rx="2" fill="#ffc48a"/><circle cx="16" cy="16.5" r="1.6" fill="#ffc93c"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 32 32"><path d="M16 5l12 6.5L16 18 4 11.5z" fill="#8fd16a"/><path d="M4 11.5V16l12 6.5V18z" fill="#5fae4a"/><path d="M28 11.5V16l-12 6.5V18z" fill="#4c963d"/>' +
    '<path d="M9.5 8.5l13 7" stroke="#5aa9e6" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12.6" r="2.2" fill="#2f6fe0" stroke="#fff" stroke-width="1"/><path d="M20 27l2-3.5 2 3.5z" fill="#ff7a1a"/></svg>';
  var IC_SHOP = '<svg viewBox="0 0 32 32"><path d="M4 14l12-8 12 8" fill="#e8684a"/><path d="M4 14l12-8 12 8" stroke="#c24f36" stroke-width="2" fill="none" stroke-linejoin="round"/><rect x="7" y="13.5" width="18" height="13" rx="2" fill="#fff4e0"/><rect x="12" y="18" width="8" height="8.5" rx="1.5" fill="#8e5632"/><rect x="9" y="11" width="14" height="4" rx="1.5" fill="#ffc93c"/><path d="M3 28h26" stroke="#9c6237" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var IC_TROPHY = '<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#ffc93c"/><path d="M7 6H4.5a3 3 0 0 0 3 4M17 6h2.5a3 3 0 0 1-3 4" stroke="#ffc93c" stroke-width="1.8" fill="none"/><rect x="10.8" y="13.5" width="2.4" height="3.5" fill="#ffc93c"/><rect x="7.5" y="17" width="9" height="3" rx="1.2" fill="#fff"/></svg>';
  var IC_GRID = '<svg viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="none" stroke="#8ff3ff" stroke-width="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="#8ff3ff" stroke-width="1.3" opacity=".8"/><path d="M6 18l12-12" stroke="#ffc93c" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var IC_VIGA = '<svg viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="8" rx="2.5" fill="#d99a5c"/><rect x="4.5" y="12" width="23" height="2.4" rx="1.2" fill="#f0bf86"/><circle cx="9" cy="10.4" r="1.7" fill="#ffc93c"/><circle cx="16" cy="10.4" r="1.7" fill="#ffc93c"/><circle cx="23" cy="10.4" r="1.7" fill="#ffc93c"/><rect x="5" y="19" width="4" height="9" rx="1.4" fill="#9a5f34"/><rect x="23" y="19" width="4" height="9" rx="1.4" fill="#9a5f34"/></svg>';
  var IC_PILAR = '<svg viewBox="0 0 32 32"><rect x="12" y="6" width="8" height="20" rx="2.4" fill="#d99a5c"/><rect x="13.3" y="7" width="2.4" height="18" rx="1.2" fill="#f0bf86"/><path d="M13.5 5.2l1.2-1.6h2.6l1.2 1.6z" fill="#ffc93c"/><rect x="8" y="26" width="16" height="3.5" rx="1.5" fill="#c9bca6"/></svg>';
  var IC_TRAVA = '<svg viewBox="0 0 32 32"><rect x="5" y="5" width="4" height="23" rx="1.5" fill="#d99a5c"/><rect x="23" y="5" width="4" height="23" rx="1.5" fill="#d99a5c"/><rect x="5" y="4" width="22" height="4" rx="1.5" fill="#c3803f"/><path d="M8.5 25.5L23.5 9M8.5 9l15 16.5" stroke="#2fb5a3" stroke-width="3.4" stroke-linecap="round"/><path d="M14.6 17.2l1.4-1.4 1.4 1.4-1.4 1.4z" fill="#ffc93c"/></svg>';
  var IC_APAGAR = '<svg viewBox="0 0 32 32"><path d="M6.5 19.5l10-10a2.5 2.5 0 0 1 3.5 0l5 5a2.5 2.5 0 0 1 0 3.5l-8 8H12z" fill="#ff8fa8"/><path d="M6.5 19.5l5.5 6.5h5l-1.5 0-6-6z" fill="#fff"/><path d="M6.5 19.5l4.2-4.2 7 7-3.8 3.7H12z" fill="#fff4e0"/><path d="M13 27h13" stroke="#c9bca6" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var IC_PLAY = '<svg viewBox="0 0 20 20"><path d="M6.5 4.2l9 5.8-9 5.8z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var IC_CRATE = '<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="3" fill="#d99a5c"/><rect x="5" y="5" width="22" height="22" rx="3" fill="none" stroke="#9a5f34" stroke-width="3"/><path d="M8 24L24 8" stroke="#9a5f34" stroke-width="3" stroke-linecap="round"/><path d="M14.5 3.7l1-1.4h1.6l1 1.4z" fill="#ffc93c"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, Hh = host.clientHeight || 844;
      var R = rng(20261109);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }
      var dead = false;

      var root = document.createElement('div'); root.className = ID + '-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, Hh, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      var CLEAR0 = new THREE.Color(0x8fcf6a), CLEAR1 = new THREE.Color(0x6f93a8), clearC = new THREE.Color();
      renderer.setClearColor(CLEAR0);
      var cv = renderer.domElement; cv.className = ID + '-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      var FOG0 = new THREE.Color(0xd9efd0), FOG1 = new THREE.Color(0xc2d6ea);
      scene.fog = new THREE.Fog(0xd9efd0, 30, 56);
      var camera = new THREE.PerspectiveCamera(FOV, W / Hh, 1, 140);

      /* ----- materiais com rim light + "modo construção" (dessatura e azula o mundo) -----
         categoria: 'w' mundo (dessatura forte), 'c' personagens (leve), 'v' peças novas (vivas) */
      var U = {
        uRimColor: { value: new THREE.Color(0xfff1d6) }, uRimStr: { value: 0.42 },
        uTint: { value: new THREE.Vector3(0.80, 0.93, 1.16) },
        dW: { value: 0 }, dC: { value: 0 }, dV: { value: 0 }
      };
      var RIM0 = new THREE.Color(0xfff1d6), RIM1 = new THREE.Color(0xc8f6ff);
      function addRim(m, cat) {
        cat = cat || 'w';
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = U.uRimColor; sh.uniforms.uRimStr = U.uRimStr; sh.uniforms.uTint = U.uTint;
          sh.uniforms.uDesat = cat === 'w' ? U.dW : cat === 'c' ? U.dC : U.dV;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\nuniform vec3 uTint;\nuniform float uDesat;\n' + sh.fragmentShader
            .replace('#include <emissivemap_fragment>',
              '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;')
            .replace('#include <fog_fragment>',
              '#include <fog_fragment>\n float dLum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));\n gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(gl_FragColor.rgb, vec3(dLum), 0.75) * uTint, uDesat);');
        };
        m.customProgramCacheKey = function () { return ID + '-rim' + cat + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
        return m;
      }
      var mats = {};
      function M(color, o, cat) {
        cat = cat || 'w';
        var key = cat + color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, roughness: 0.78, metalness: 0 };
        if (o) for (var k in o) p[k] = o[k];
        return (mats[key] = addRim(new THREE.MeshStandardMaterial(p), cat));
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
      var gBow = G('bow', function () {
        var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
        var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
      });
      var gCone = G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); });
      var gBoxU = G('boxu', function () { return new THREE.BoxGeometry(1, 1, 1); });

      function mesh(geo, mat, sx, sy, sz, x, y, z, parent, noShadow) {
        var m = new THREE.Mesh(geo, mat);
        m.scale.set(sx, sy, sz); m.position.set(x, y, z);
        if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
        if (parent) parent.add(m);
        return m;
      }
      function ball(col, r, x, y, z, parent, o, cat) { return mesh(gSph, M(col, o, cat), r, r, r, x, y, z, parent); }
      function capsule(r, len, col, parent, o, cat) {
        var g = new THREE.Group();
        mesh(gCyl, M(col, o, cat), r, len, r, 0, -len / 2, 0, g);
        mesh(gSph, M(col, o, cat), r, r, r, 0, 0, 0, g);
        mesh(gSph, M(col, o, cat), r, r, r, 0, -len, 0, g);
        if (parent) parent.add(g);
        return g;
      }

      /* ----- luzes ----- */
      var hemi = new THREE.HemisphereLight(0xd6ecff, 0x7f9f62, 0.6); scene.add(hemi);
      var sun = new THREE.DirectionalLight(0xffe2b5, 0.86);
      sun.position.set(-5.5, 11, 1.5); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 2; sc.far = 30;
      sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
      sun.target.position.set(0, 0, 0);
      scene.add(sun); scene.add(sun.target);
      var back = new THREE.DirectionalLight(0xbfe0ff, 0.28); back.position.set(4, 5, -8); scene.add(back);

      /* ----- chão: grama + canteiro de obra + caminho até a oficina ----- */
      var SHOP = uv2w(-1.75, 2.35); SHOP.ry = AZ - 0.08;
      var DECK = 1.42; // meia largura da plataforma
      function segDist(px, pz, ax, az, bx, bz) { var vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az; var k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); var dx = px - (ax + vx * k), dz = pz - (az + vz * k); return Math.sqrt(dx * dx + dz * dz); }
      var pA = uv2w(-0.2, -6.5), pB = uv2w(-0.6, -1.9), pC = uv2w(-1.6, 1.4);
      function pathD(x, z) { return Math.min(segDist(x, z, pA.x, pA.z, pB.x, pB.z), segDist(x, z, pB.x, pB.z, pC.x, pC.z)); }
      var GS = 46, GN = 110;
      var gg = new THREE.PlaneGeometry(GS, GS, GN, GN);
      gg.rotateX(-Math.PI / 2);
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
      var cGrA = new THREE.Color(0x86cf5c), cGrB = new THREE.Color(0x6bbd4c), cGrC = new THREE.Color(0x9bd162), cPath = new THREE.Color(0xe6c68c), cPathE = new THREE.Color(0xd0a96c), cDirt = new THREE.Color(0xdcbf8a), cDirt2 = new THREE.Color(0xcfae74);
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i);
        var y = 0.05 * Math.sin(x * 0.8 + z * 0.5) * sstep(3.2, 4.5, Math.sqrt(x * x + z * z));
        gp.setY(i, y);
        var nz = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.35) * Math.cos(z * 0.42 - x * 0.2);
        c.copy(cGrA).lerp(cGrB, nz);
        var n2 = 0.5 + 0.5 * Math.sin(x * 1.3 - z * 0.9 + 1.0);
        c.lerp(cGrC, sstep(0.75, 1, n2) * 0.6);
        var pd = pathD(x, z);
        if (pd < 0.78) { c.lerp(cPathE, 1 - sstep(0.55, 0.78, pd)); c.lerp(cPath, 1 - sstep(0.3, 0.56, pd)); }
        var dd = Math.max(Math.abs(x), Math.abs(z)) + 0.25 * Math.sin(x * 3.1 + z * 2.3);
        if (dd < 2.6) { c.lerp(cDirt2, 1 - sstep(2.2, 2.6, dd)); c.lerp(cDirt, (1 - sstep(1.8, 2.3, dd)) * (0.6 + 0.4 * Math.sin(x * 5 + z * 4))); }
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      var ground = new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 }));
      ground.receiveShadow = true; scene.add(ground);

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

      var AVOID = [];
      function avoid(x, z, r) { AVOID.push([x, z, r]); }
      function freeAt(x, z, rr) {
        if (Math.max(Math.abs(x), Math.abs(z)) < 2.75 + rr) return false;
        if (pathD(x, z) < 0.75 + rr) return false;
        for (var k = 0; k < AVOID.length; k++) { var a = AVOID[k]; var dx = x - a[0], dz = z - a[1]; if (dx * dx + dz * dz < (a[2] + rr) * (a[2] + rr)) return false; }
        return true;
      }

      /* ----- blocos de encaixe (pinos hexagonais + chaves borboleta) ----- */
      var PINS = [], BOWS = [];
      var matPinFlat = {};
      function pinMat(col, cat) { var k = col + (cat || 'w'); return matPinFlat[k] || (matPinFlat[k] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }), cat)); }
      function addPin(x, y, z, col, ry) { PINS.push({ x: x, y: y + 0.025, z: z, ry: ry || 0, sx: 1, sy: 1, sz: 1, c: col }); }
      function block(w, h, d, col, x, y, z, ry, parent, r, cat) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }, cat));
        m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
        (parent || scene).add(m); return m;
      }
      var WOOD = 0xcd8d4e, WOOD2 = 0xc3803f, WOOD3 = 0xd89a5c, BEAM = 0x9a5f34, STONE = 0xd9cdb8, STONE2 = 0xc9bca6, TEAL = 0x2fb5a3, PINC = 0xf2b968;

      /* ----- plataforma de obra (tablado de blocos) ----- */
      var DECK_Y = 0.08, TN = 4, TS = (DECK * 2) / TN;
      for (var a = 0; a < TN; a++) for (var b2 = 0; b2 < TN; b2++) {
        var tx0 = -DECK + TS * (a + 0.5), tz0 = -DECK + TS * (b2 + 0.5);
        block(TS - 0.04, 0.1, TS - 0.04, [WOOD, WOOD2, WOOD3][(a + b2 * 2) % 3], tx0, DECK_Y - 0.05 + Math.sin(a * 2.1 + b2) * 0.004, tz0, 0, null, 0.04);
      }
      // borda de pedra com pinos
      [-1, 1].forEach(function (sg) {
        block(DECK * 2 + 0.3, 0.12, 0.18, STONE, 0, 0.04, sg * (DECK + 0.1), 0);
        block(0.18, 0.12, DECK * 2 + 0.3, STONE2, sg * (DECK + 0.1), 0.04, 0, 0);
        for (var k = -2; k <= 2; k++) { addPin(k * 0.62, 0.1, sg * (DECK + 0.1), 0xe9dfcc); addPin(sg * (DECK + 0.1), 0.1, k * 0.62, 0xe9dfcc); }
      });

      /* ----- torre: medidas (1 unidade = 1 m de jogo) ----- */
      var PX = 0.6, FOOT_H = 0.12, FOOT_Y = DECK_Y + FOOT_H / 2, PIL_H = 1.72, PIL_W = 0.2;
      var PIL_Y0 = DECK_Y + FOOT_H, PIL_YC = PIL_Y0 + PIL_H / 2, PIL_TOP = PIL_Y0 + PIL_H;
      var BEAM_H = 0.18, BEAM_YC = PIL_TOP + BEAM_H / 2, BEAM_TOP = PIL_TOP + BEAM_H;
      var PLATE_H = 0.11, PLATE_YC = BEAM_TOP + PLATE_H / 2, PLATE_TOP = BEAM_TOP + PLATE_H;
      var CR = 0.44;
      // sapatas pré-colocadas
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { block(0.38, FOOT_H, 0.38, STONE, q[0] * PX, FOOT_Y, q[1] * PX, 0, null, 0.035); });

      /* ----- oficina do Mestre Tomé ----- */
      var shop = new THREE.Group(); shop.position.set(SHOP.x, 0, SHOP.z); shop.rotation.y = SHOP.ry; scene.add(shop);
      (function () {
        var g = shop;
        [[-0.62, -0.45], [0.62, -0.45], [-0.62, 0.45], [0.62, 0.45]].forEach(function (q, j) { block(1.2, 0.24, 0.86, j % 3 ? STONE : STONE2, q[0], 0.12, q[1], 0, g); });
        block(2.3, 1.3, 0.14, 0xc98a4b, 0, 0.24 + 0.65, -0.78, 0, g, 0.05);
        [-1, 1].forEach(function (sg) { block(0.14, 1.3, 1.5, 0xd99a5c, sg * 1.08, 0.24 + 0.65, -0.08, 0, g, 0.05); });
        // tábuas verticais na parede de fundo
        for (var k = -3; k <= 3; k++) block(0.04, 1.2, 0.03, 0xb3713f, k * 0.3, 0.86, -0.7, 0, g, 0.012);
        // postes da frente
        [-1, 1].forEach(function (sg) { block(0.16, 1.45, 0.16, BEAM, sg * 1.08, 0.24 + 0.72, 0.72, 0, g, 0.04); });
        block(2.36, 0.16, 0.18, BEAM, 0, 1.62, 0.72, 0, g, 0.04);
        // telhado
        [-1, 1].forEach(function (sg) { var p = block(2.7, 0.12, 1.12, 0xe8684a, 0, 2.02, sg * 0.42, 0, g, 0.05); p.rotation.x = sg * 0.6; });
        var ridge = mesh(gCyl, M(0xc24f36), 0.09, 2.76, 0.09, 0, 2.3, 0, g); ridge.rotation.z = Math.PI / 2;
        var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.8, 0); sh.lineTo(0.8, 0); sh.lineTo(0, 0.55); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 2.16, bevelEnabled: false }); e.translate(0, 0, -1.08); e.rotateY(Math.PI / 2); return e; });
        mesh(tri, M(0xfff4e0), 1, 1, 1, 0, 1.62, -0.03, g);
        // bancada com blocos e ferramentas
        block(1.5, 0.1, 0.52, 0xb3713f, 0, 0.92, -0.38, 0, g, 0.03);
        [[-0.66, -0.2], [0.66, -0.2], [-0.66, -0.56], [0.66, -0.56]].forEach(function (q) { block(0.08, 0.68, 0.08, BEAM, q[0], 0.58, q[1], 0, g, 0.025); });
        block(0.3, 0.16, 0.2, 0xff8a2a, -0.4, 1.05, -0.38, 0.2, g, 0.04);
        block(0.2, 0.2, 0.2, TEAL, -0.1, 1.07, -0.42, -0.3, g, 0.04);
        block(0.36, 0.1, 0.16, 0xffc93c, 0.3, 1.02, -0.32, 0.1, g, 0.03);
        // painel de ferramentas na parede
        block(1.2, 0.5, 0.04, 0xe8d3a8, 0, 1.38, -0.69, 0, g, 0.02);
        [[-0.4, 0xff8a2a], [-0.12, 0x5aa9e6], [0.16, 0x9a5f34], [0.42, TEAL]].forEach(function (q) { block(0.08, 0.3, 0.04, q[1], q[0], 1.38, -0.66, 0, g, 0.02); });
        // placa
        var signC = document.createElement('canvas'); signC.width = 256; signC.height = 80;
        var signT = keep(new THREE.CanvasTexture(signC));
        function drawSign() {
          var x2 = signC.getContext('2d');
          x2.fillStyle = '#fff4e0'; x2.fillRect(0, 0, 256, 80);
          x2.fillStyle = '#8e5632'; x2.font = '600 46px Fredoka, "Baloo 2", system-ui, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
          x2.fillText('OFICINA', 128, 43);
          signT.needsUpdate = true;
        }
        drawSign();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!dead) drawSign(); });
        var sign = new THREE.Mesh(rbox(1.0, 0.32, 0.06, 0.03), M(0x8e5632)); sign.position.set(0, 1.86, 0.86); g.add(sign);
        var face = new THREE.Mesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), addRim(new THREE.MeshStandardMaterial({ map: signT, roughness: 0.8 }), 'w'));
        face.scale.set(0.9, 0.26, 1); face.position.set(0, 1.86, 0.895); g.add(face);
        g.updateMatrixWorld(true);
        var v = new THREE.Vector3();
        [-0.9, 0, 0.9].forEach(function (px) { v.set(px, 0.24, 0.86); g.localToWorld(v); addPin(v.x, v.y, v.z, 0xe9dfcc, SHOP.ry); });
      })();
      avoid(SHOP.x, SHOP.z, 1.8);

      /* pilha de madeira e cavalete */
      var LUM = uv2w(2.05, 2.0);
      (function () {
        var g = new THREE.Group(); g.position.set(LUM.x, 0, LUM.z); g.rotation.y = AZ + 0.35; scene.add(g);
        for (var k = 0; k < 3; k++) for (var j = 0; j < 3 - k; j++) block(1.3, 0.13, 0.17, [WOOD, WOOD2, WOOD3][(k + j) % 3], 0, 0.07 + k * 0.13, (j - (2 - k) / 2) * 0.19, 0, g, 0.04);
        block(0.14, 0.4, 0.5, BEAM, -0.5, 0.2, 0, 0, g, 0.03); block(0.14, 0.4, 0.5, BEAM, 0.5, 0.2, 0, 0, g, 0.03);
        avoid(LUM.x, LUM.z, 0.9);
      })();
      /* barril e blocos coloridos soltos perto do herói */
      var BAR = uv2w(-2.55, 0.5);
      mesh(gCyl, M(0xb3713f), 0.26, 0.56, 0.26, BAR.x, 0.28, BAR.z, scene);
      [0.12, 0.44].forEach(function (yy) { mesh(gCyl, M(0x7d5a3a), 0.272, 0.05, 0.272, BAR.x, yy, BAR.z, scene); });
      avoid(BAR.x, BAR.z, 0.5);

      /* caixotes à espera (vão para o topo da torre) */
      var CRATE_PILE = uv2w(2.05, 0.75);
      function crate(cat) {
        var g = new THREE.Group();
        var body = new THREE.Mesh(rbox(CR, CR, CR, 0.05), M(0xd99a5c, { roughness: 0.72 }, cat)); body.castShadow = true; body.receiveShadow = true; g.add(body);
        var fr = M(0x9a5f34, { roughness: 0.8 }, cat);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (q) {
          var nx = q[0], nz = q[1];
          // moldura + diagonal em cada face lateral
          var dg = new THREE.Mesh(rbox(0.06, CR * 1.2, 0.03, 0.012), fr);
          dg.position.set(nx * (CR / 2 + 0.005), 0, nz * (CR / 2 + 0.005)); dg.rotation.y = nx ? Math.PI / 2 : 0; dg.rotateZ(0.785); g.add(dg);
        });
        [-1, 1].forEach(function (sy) {
          [[1, 0], [0, 1]].forEach(function (q) {
            var e1 = new THREE.Mesh(rbox(q[0] ? 0.06 : CR + 0.02, 0.06, q[1] ? 0.06 : CR + 0.02, 0.015), fr);
            [-1, 1].forEach(function (sx) { var e = e1.clone(); e.position.set(q[0] ? sx * CR / 2 : 0, sy * CR / 2 * 0.94, q[1] ? sx * CR / 2 : 0); g.add(e); });
          });
        });
        var pm = new THREE.Mesh(gHex, pinMat(0xffd27a, cat)); pm.position.y = CR / 2 + 0.025; g.add(pm);
        scene.add(g);
        return g;
      }

      /* ----- personagens (idênticos ao combinado) ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }, 'c'), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }, 'c'), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }, 'c'), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
        return e;
      }
      var hero = new THREE.Group(), hSq = new THREE.Group(), hB = new THREE.Group(); hero.add(hSq); hSq.add(hB); scene.add(hero);
      var PANTS = 0x2c3f7a, BLUE = 0x2f74e6, BLUE2 = 0x9cc4ff, ORANGE = 0xff8a2a, ORANGE2 = 0xe86f12;
      var hLegs = [-1, 1].map(function (sg) {
        var L = capsule(0.072, 0.32, PANTS, hB, null, 'c'); L.position.set(sg * 0.105, 0.6, 0);
        mesh(gSph, M(0xf7f3ea, null, 'c'), 0.09, 0.075, 0.13, 0, -0.38, 0.035, L);
        mesh(gSph, M(0xe2553f, null, 'c'), 0.093, 0.035, 0.135, 0, -0.43, 0.035, L);
        return L;
      });
      mesh(gSph, M(PANTS, null, 'c'), 0.19, 0.13, 0.15, 0, 0.62, 0, hB);
      mesh(gSph, M(BLUE, null, 'c'), 0.205, 0.25, 0.16, 0, 0.84, 0, hB);
      mesh(gSph, M(0x2563c9, null, 'c'), 0.2, 0.05, 0.155, 0, 0.66, 0, hB);
      var col = mesh(G('tor', function () { return new THREE.TorusGeometry(1, 0.35, 8, 18); }), M(BLUE2, null, 'c'), 0.09, 0.09, 0.09, 0, 1.06, 0.0, hB); col.rotation.x = Math.PI / 2 - 0.25;
      mesh(gSph, M(0xffc93c, { roughness: 0.4 }, 'c'), 0.035, 0.035, 0.015, 0.09, 0.9, 0.155, hB);
      var pack = new THREE.Mesh(rbox(0.32, 0.36, 0.17, 0.07), M(ORANGE, { roughness: 0.6 }, 'c')); pack.position.set(0, 0.86, -0.2); pack.castShadow = true; hB.add(pack);
      var flap = new THREE.Mesh(rbox(0.33, 0.14, 0.18, 0.06), M(ORANGE2, { roughness: 0.6 }, 'c')); flap.position.set(0, 0.99, -0.2); flap.castShadow = true; hB.add(flap);
      var pkt = new THREE.Mesh(rbox(0.2, 0.12, 0.06, 0.04), M(ORANGE2, { roughness: 0.6 }, 'c')); pkt.position.set(0, 0.76, -0.3); hB.add(pkt);
      var roll = mesh(gCyl, M(0x5fae7a, { roughness: 0.8 }, 'c'), 0.075, 0.38, 0.075, 0, 1.1, -0.21, hB); roll.rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) { var st = new THREE.Mesh(rbox(0.05, 0.36, 0.03, 0.015), M(ORANGE2, null, 'c')); st.position.set(sg * 0.1, 0.88, 0.14); st.rotation.x = -0.1; hB.add(st); });
      var hArms = [-1, 1].map(function (sg) {
        var A = capsule(0.058, 0.26, BLUE, hB, null, 'c'); A.position.set(sg * 0.24, 1.0, 0);
        ball(SKIN, 0.068, 0, -0.32, 0, A, null, 'c');
        return A;
      });
      var hHead = new THREE.Group(); hHead.position.set(0, 1.24, 0.01); hB.add(hHead);
      mesh(gSph, M(SKIN, { roughness: 0.62 }, 'c'), 0.215, 0.205, 0.2, 0, 0, 0, hHead);
      [-1, 1].forEach(function (sg) { ball(SKIN2, 0.045, sg * 0.21, -0.01, -0.01, hHead, null, 'c'); });
      var hair = mesh(gHemi, M(0x7a4426, { roughness: 0.6 }, 'c'), 0.232, 0.228, 0.226, 0, 0.0, -0.012, hHead); hair.rotation.x = -0.42;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }, 'c'), 0.2, 0.17, 0.12, 0, -0.04, -0.11, hHead);
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }, 'c'), 0.13, 0.06, 0.09, -0.06, 0.15, 0.13, hHead).rotation.z = 0.35;
      mesh(gSph, M(0x7a4426, { roughness: 0.6 }, 'c'), 0.1, 0.05, 0.08, 0.09, 0.16, 0.12, hHead).rotation.z = -0.4;
      var tuft = mesh(gCone, M(0x7a4426, { roughness: 0.6 }, 'c'), 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, hHead); tuft.rotation.z = -0.5;
      var hEyes = [eye(hHead, -0.078, 0.0, 0.17, 0.055), eye(hHead, 0.078, 0.0, 0.17, 0.055)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b, null, 'c'), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }, 'c'), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead, true); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }, 'c'), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead, true); hMouth.rotation.z = Math.PI;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead, null, 'c');

      var tome = new THREE.Group(), tB = new THREE.Group(); tome.add(tB); scene.add(tome);
      var SHIRT = 0xd65a40, APRON = 0x8b5a2b;
      [-1, 1].forEach(function (sg) {
        var L = capsule(0.088, 0.3, 0x45577f, tB, null, 'c'); L.position.set(sg * 0.13, 0.55, 0);
        mesh(gSph, M(0x6b3e22, { roughness: 0.55 }, 'c'), 0.11, 0.08, 0.15, 0, -0.36, 0.04, L);
      });
      mesh(gSph, M(SHIRT, null, 'c'), 0.31, 0.34, 0.26, 0, 0.92, 0, tB);
      mesh(G('apron', function () { return new THREE.CylinderGeometry(1, 1.08, 1, 18, 1, true, -1.05, 2.1); }), M(APRON, { side: THREE.DoubleSide, roughness: 0.85 }, 'c'), 0.3, 0.52, 0.255, 0, 0.82, 0.012, tB);
      var bib = new THREE.Mesh(rbox(0.28, 0.24, 0.05, 0.02), M(APRON, { roughness: 0.85 }, 'c')); bib.position.set(0, 1.08, 0.22); bib.rotation.x = -0.3; tB.add(bib);
      var pocket = new THREE.Mesh(rbox(0.2, 0.11, 0.04, 0.015), M(0x744820, null, 'c')); pocket.position.set(0.0, 0.72, 0.29); pocket.rotation.x = 0.08; tB.add(pocket);
      var ruler = new THREE.Mesh(rbox(0.035, 0.16, 0.02, 0.008), M(0xffc93c, null, 'c')); ruler.position.set(0.06, 0.8, 0.3); ruler.rotation.z = 0.18; tB.add(ruler);
      mesh(gCyl, M(0x6b3e22, null, 'c'), 0.33, 0.04, 0.27, 0, 0.62, 0, tB);
      var tArms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.33, 1.13, 0); tB.add(A);
        capsule(0.085, 0.14, SHIRT, A, null, 'c');
        var fa = capsule(0.072, 0.16, SKIN2, A, null, 'c'); fa.position.y = -0.17;
        ball(SKIN, 0.088, 0, -0.38, 0, A, null, 'c');
        return A;
      });
      var tHead = new THREE.Group(); tHead.position.set(0, 1.47, 0.02); tB.add(tHead);
      mesh(gSph, M(SKIN2, { roughness: 0.6 }, 'c'), 0.205, 0.21, 0.2, 0, 0, 0, tHead);
      [-1, 1].forEach(function (sg) { ball(0xeba57d, 0.045, sg * 0.2, -0.01, 0, tHead, null, 'c'); });
      [[0, -0.15, 0.1, 0.17, 0.15, 0.12], [-0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0.12, -0.08, 0.1, 0.1, 0.12, 0.1], [0, -0.26, 0.07, 0.11, 0.1, 0.09], [-0.17, 0.0, 0.03, 0.06, 0.1, 0.07], [0.17, 0.0, 0.03, 0.06, 0.1, 0.07]].forEach(function (q) {
        mesh(gSph, M(0xf7f6f2, { roughness: 0.92 }, 'c'), q[3], q[4], q[5], q[0], q[1], q[2], tHead);
      });
      var tMouth = mesh(gSph, M(0x8c2f2a, { roughness: 0.5 }, 'c'), 0.05, 0.03, 0.03, 0, -0.105, 0.19, tHead, true);
      [-1, 1].forEach(function (sg) { var mu = mesh(gSph, M(0xffffff, { roughness: 0.9 }, 'c'), 0.07, 0.032, 0.045, sg * 0.055, -0.055, 0.19, tHead, true); mu.rotation.z = sg * 0.35; });
      ball(0xf09a7a, 0.045, 0, -0.005, 0.205, tHead, null, 'c');
      var tEyes = [eye(tHead, -0.072, 0.035, 0.168, 0.047), eye(tHead, 0.072, 0.035, 0.168, 0.047)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0xffffff, { roughness: 0.9 }, 'c'), 0.05, 0.02, 0.025, sg * 0.075, 0.105, 0.175, tHead, true); bw.rotation.z = sg * -0.3; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8f7a, { transparent: true, opacity: 0.55 }, 'c'), 0.035, 0.02, 0.01, sg * 0.12, -0.03, 0.17, tHead, true); });
      var helm = mesh(gHemi, M(0xffc629, { roughness: 0.4 }, 'c'), 0.222, 0.2, 0.222, 0, 0.1, -0.02, tHead); helm.rotation.x = -0.25;
      var brim = mesh(gCyl, M(0xf2a71a, { roughness: 0.4 }, 'c'), 0.25, 0.022, 0.25, 0, 0.1, -0.01, tHead); brim.rotation.x = -0.25;
      var hridge = new THREE.Mesh(rbox(0.05, 0.05, 0.4, 0.02), M(0xf2a71a, { roughness: 0.4 }, 'c')); hridge.position.set(0, 0.28, -0.07); hridge.rotation.x = -0.25; tHead.add(hridge);

      var HP = uv2w(-1.68, -1.5), TP = uv2w(1.5, -1.05);
      hero.position.set(HP.x, 0, HP.z); tome.position.set(TP.x, 0, TP.z);
      hero.scale.setScalar(1.12); tome.scale.setScalar(1.12);
      avoid(HP.x, HP.z, 0.7); avoid(TP.x, TP.z, 0.7); avoid(CRATE_PILE.x, CRATE_PILE.z, 0.7);

      /* ----- peças da torre (vivas) + fantasmas ----- */
      var PIECES = [];
      var ghostFill = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.0, depthWrite: false });
      var ghostLine = new THREE.LineBasicMaterial({ color: 0xbff8ff, transparent: true, opacity: 0.0, depthWrite: false });
      var ghostNextFill = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.0, depthWrite: false });
      var ghostNextLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
      function piece(o) {
        var g = new THREE.Group();
        var mat = addRim(new THREE.MeshStandardMaterial({ color: o.col, roughness: 0.66, emissive: 0x2fe0f4, emissiveIntensity: 0 }), 'v');
        var m = new THREE.Mesh(rbox(o.w, o.h, o.d, o.r || 0.045), mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
        (o.pins || []).forEach(function (p) { var pm = new THREE.Mesh(gHex, pinMat(0xffd27a, 'v')); pm.position.set(p[0], o.h / 2 + 0.025, p[1]); pm.castShadow = true; g.add(pm); });
        g.position.copy(o.end); g.rotation.copy(o.rot); g.visible = false; scene.add(g);
        // fantasma
        var gh = new THREE.Group(); gh.position.copy(o.end); gh.rotation.copy(o.rot); scene.add(gh);
        var gm = new THREE.Mesh(rbox(o.w, o.h, o.d, o.r || 0.045), ghostFill); gh.add(gm);
        var eg = keep(new THREE.EdgesGeometry(G('bx' + o.w + o.h + o.d, function () { return new THREE.BoxGeometry(o.w, o.h, o.d); })));
        var el = new THREE.LineSegments(eg, ghostLine); gh.add(el);
        o.g = g; o.mat = mat; o.gh = gh; o.gm = gm; o.el = el; o.endRot = o.rot.clone();
        PIECES.push(o);
        return o;
      }
      var E = function (x, y, z) { return new THREE.Vector3(x, y, z); }, Rr = function (x, y, z) { return new THREE.Euler(x || 0, y || 0, z || 0); };
      var PIL_COL = 0xe0a462, BEAM_COL = 0xc77d3c, PLATE_COL = 0xe9b574;
      var pil = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
      pil.forEach(function (q, k) { piece({ kind: 'pilar', w: PIL_W, h: PIL_H, d: PIL_W, col: PIL_COL, end: E(q[0] * PX, PIL_YC, q[1] * PX), rot: Rr(), t0: 1.62 + k * 0.15, t1: 1.62 + k * 0.15 + 0.26, drop: 1.25 }); });
      [1, -1].forEach(function (sz, k) { piece({ kind: 'viga', w: PX * 2 + 0.24, h: BEAM_H, d: 0.24, col: BEAM_COL, end: E(0, BEAM_YC, sz * PX), rot: Rr(), t0: 2.36 + k * 0.15, t1: 2.36 + k * 0.15 + 0.26, drop: 1.0, spin: 0.9 }); });
      // contraventamento em X: face +z (frente-esquerda) e face +x (frente-direita)
      var BR_Y0 = PIL_Y0 + 0.12, BR_Y1 = PIL_TOP - 0.1, BR_SPAN = PX * 2, BR_RISE = BR_Y1 - BR_Y0;
      var BR_LEN = Math.sqrt(BR_SPAN * BR_SPAN + BR_RISE * BR_RISE) - 0.1, BR_ANG = Math.atan2(BR_RISE, BR_SPAN);
      var BR_OFF = PX + PIL_W / 2 + 0.035, BR_YC = (BR_Y0 + BR_Y1) / 2;
      piece({ kind: 'trava', w: BR_LEN, h: 0.13, d: 0.08, col: TEAL, r: 0.03, end: E(0, BR_YC, BR_OFF), rot: Rr(0, 0, BR_ANG), t0: 2.92, t1: 3.16, drop: 0.9, spin: 0.7 });
      piece({ kind: 'trava', w: BR_LEN, h: 0.13, d: 0.08, col: TEAL, r: 0.03, end: E(0, BR_YC, BR_OFF + 0.075), rot: Rr(0, 0, -BR_ANG), t0: 3.06, t1: 3.3, drop: 0.9, spin: -0.7 });
      piece({ kind: 'trava', w: BR_LEN, h: 0.13, d: 0.08, col: TEAL, r: 0.03, end: E(BR_OFF, BR_YC, 0), rot: Rr(0, Math.PI / 2, BR_ANG), t0: 3.24, t1: 3.48, drop: 0.9, spin: 0.7 });
      piece({ kind: 'trava', w: BR_LEN, h: 0.13, d: 0.08, col: TEAL, r: 0.03, end: E(BR_OFF + 0.075, BR_YC, 0), rot: Rr(0, Math.PI / 2, -BR_ANG), t0: 3.38, t1: 3.62, drop: 0.9, spin: -0.7 });
      piece({ kind: 'viga', w: PX * 2 + 0.3, h: PLATE_H, d: PX * 2 + 0.3, col: PLATE_COL, r: 0.04, pins: [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]], end: E(0, PLATE_YC, 0), rot: Rr(), t0: 3.98, t1: 4.2, drop: 0.7, spin: 0.5, glow: 0.25 });
      var NP = PIECES.length;
      // chaves borboleta nos encaixes do X (aparecem no clique)
      var xBows = [];
      [[0, BR_YC, BR_OFF + 0.12, 0, 3], [BR_OFF + 0.12, BR_YC, 0, Math.PI / 2, 5]].forEach(function (q) {
        var bm = new THREE.Mesh(gBow, addRim(new THREE.MeshStandardMaterial({ color: 0xffc93c, roughness: 0.5, emissive: 0xffe08a, emissiveIntensity: 0 }), 'v'));
        bm.position.set(q[0], q[1], q[2]); bm.rotation.y = q[3]; bm.scale.setScalar(0.001); bm.userData.k = q[4]; scene.add(bm); xBows.push(bm);
      });
      // triângulos destacados (face +z e face +x)
      var triMats = [];
      function triFace(pts, rotY, off) {
        var sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); sh.lineTo(pts[1][0], pts[1][1]); sh.lineTo(pts[2][0], pts[2][1]); sh.closePath();
        var gm = keep(new THREE.ShapeGeometry(sh));
        var mt = new THREE.MeshBasicMaterial({ color: 0x8ff3ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        var m = new THREE.Mesh(gm, mt); m.rotation.y = rotY; m.position.copy(off); m.visible = false; scene.add(m);
        triMats.push({ m: m, mt: mt });
      }
      var cx0 = 0, cy0 = BR_YC, xL = -PX, xR = PX, yB = BR_Y0, yT = BR_Y1;
      var trisPts = [[[xL, yB], [xR, yB], [cx0, cy0]], [[xR, yB], [xR, yT], [cx0, cy0]], [[xR, yT], [xL, yT], [cx0, cy0]], [[xL, yT], [xL, yB], [cx0, cy0]]];
      trisPts.forEach(function (p) { triFace(p, 0, E(0, 0, BR_OFF + 0.13)); });
      trisPts.forEach(function (p) { triFace(p.map(function (q) { return [-q[0], q[1]]; }), Math.PI / 2, E(BR_OFF + 0.13, 0, 0)); });

      /* caixotes: 2 lado a lado + 1 em cima (também um triângulo!) */
      var CRATES = [
        { end: E(-0.24, PLATE_TOP + CR / 2, 0.02), t0: 4.34, t1: 4.6 },
        { end: E(0.24, PLATE_TOP + CR / 2, -0.02), t0: 4.48, t1: 4.74 },
        { end: E(0.0, PLATE_TOP + CR * 1.5, 0.0), t0: 4.64, t1: 4.92 }
      ].map(function (o, k) {
        o.g = crate('v'); o.start = E(CRATE_PILE.x + (k - 1) * 0.12, CR / 2 + (k === 2 ? CR : 0), CRATE_PILE.z + (k === 1 ? 0.5 : 0)); o.k = k;
        if (k === 1) { o.start.x = CRATE_PILE.x + 0.25; o.start.z = CRATE_PILE.z - 0.4; }
        if (k === 0) { o.start.x = CRATE_PILE.x - 0.25; o.start.z = CRATE_PILE.z + 0.3; }
        if (k === 2) { o.start.x = CRATE_PILE.x - 0.25; o.start.z = CRATE_PILE.z + 0.3; }
        return o;
      });

      /* ----- grade técnica (blueprint) ----- */
      var gridU = { uR: { value: 0 }, uA: { value: 0 }, uC: { value: new THREE.Color(0x6fe6ff) }, uT: { value: 0 } };
      var gridMat = new THREE.ShaderMaterial({
        uniforms: gridU, transparent: true, depthWrite: false,
        extensions: { derivatives: true },
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: [
          'uniform float uR; uniform float uA; uniform vec3 uC; uniform float uT; varying vec3 vW;',
          'float gl(vec2 p, float s, float wpx){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y) / wpx, 1.0); }',
          'void main(){',
          '  vec2 p = vW.xz; float d = length(p);',
          '  float minor = gl(p, 0.2, 1.0) * 0.45; float major = gl(p, 1.0, 1.6);',
          '  float axis = (1.0 - min(abs(p.x) / fwidth(p.x) / 1.6, 1.0)) + (1.0 - min(abs(p.y) / fwidth(p.y) / 1.6, 1.0));',
          '  float a = max(max(minor, major), clamp(axis, 0.0, 1.0) * 0.9);',
          '  float fade = 1.0 - smoothstep(uR * 0.55, uR, d);',
          '  float ring = smoothstep(uR - 0.5, uR - 0.05, d) * (1.0 - smoothstep(uR - 0.05, uR + 0.02, d));',
          '  float fill = 0.16 * (1.0 - smoothstep(0.0, uR, d));',
          '  float al = (a * 0.85 + fill) * fade + ring * 0.9;',
          '  vec3 colr = mix(uC, vec3(1.0), ring * 0.6 + major * 0.25);',
          '  gl_FragColor = vec4(colr, al * uA);',
          '}'
        ].join('\n')
      });
      var grid = new THREE.Mesh(G('gridpl', function () { var p = new THREE.PlaneGeometry(10, 10); p.rotateX(-Math.PI / 2); return p; }), gridMat);
      grid.position.y = DECK_Y + 0.006; grid.renderOrder = 2; scene.add(grid);
      // marcadores das sapatas
      var footRings = [];
      pil.forEach(function (q) {
        var rm = new THREE.Mesh(G('ringf', function () { var r = new THREE.RingGeometry(0.26, 0.31, 4, 1); r.rotateX(-Math.PI / 2); r.rotateY(Math.PI / 4); return r; }), new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0, depthWrite: false }));
        rm.position.set(q[0] * PX, DECK_Y + 0.01, q[1] * PX); rm.renderOrder = 3; scene.add(rm); footRings.push(rm);
      });

      /* ----- linhas de cota (2 m e 1,5 m) ----- */
      var dimMat = new THREE.MeshBasicMaterial({ color: 0xbff8ff, transparent: true, opacity: 0, depthWrite: false });
      function bar(a, b, th) {
        var d = new THREE.Vector3().subVectors(b, a), L = d.length();
        var m = new THREE.Mesh(gBoxU, dimMat); m.scale.set(th, L, th); m.position.copy(a).addScaledVector(d, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.renderOrder = 4; scene.add(m); return m;
      }
      function arrowHead(p, dir) {
        var m = new THREE.Mesh(gCone, dimMat); m.scale.set(0.045, 0.12, 0.045); m.position.copy(p).addScaledVector(dir, -0.06);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); m.renderOrder = 4; scene.add(m); return m;
      }
      // horizontal: ao longo da face +z, deslocada para fora
      var hzZ = PX + 0.62, hY = DECK_Y + 0.03, hx0 = -PX - PIL_W / 2, hx1 = PX + PIL_W / 2;
      bar(E(hx0, hY, hzZ), E(hx1, hY, hzZ), 0.022);
      arrowHead(E(hx0, hY, hzZ), E(-1, 0, 0)); arrowHead(E(hx1, hY, hzZ), E(1, 0, 0));
      bar(E(hx0, hY, PX + 0.15), E(hx0, hY, hzZ + 0.12), 0.016); bar(E(hx1, hY, PX + 0.15), E(hx1, hY, hzZ + 0.12), 0.016);
      // vertical: ao lado do pilar mais à esquerda na tela
      var vOff = new THREE.Vector3(-RX, 0, -RZ).multiplyScalar(0.5);
      var vb = E(-PX + vOff.x, DECK_Y, PX + vOff.z), vt = E(-PX + vOff.x, BEAM_TOP, PX + vOff.z);
      bar(vb, vt, 0.022);
      arrowHead(vb.clone(), E(0, -1, 0)); arrowHead(vt.clone(), E(0, 1, 0));
      bar(E(-PX - 0.1, BEAM_TOP, PX), E(vt.x - vOff.x * 0.25, BEAM_TOP, vt.z - vOff.z * 0.25), 0.016);
      var DIM_H = E((hx0 + hx1) / 2, hY, hzZ), DIM_V = E(vb.x, (DECK_Y + BEAM_TOP) / 2, vb.z);

      /* ----- setas de força: peso (para baixo) e reação (para cima) ----- */
      function arrow(col) {
        var g = new THREE.Group();
        var mt = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false });
        var sh = new THREE.Mesh(gCyl, mt); sh.scale.set(0.035, 0.34, 0.035); sh.position.y = 0.17 + 0.14; g.add(sh);
        var hd = new THREE.Mesh(gCone, mt); hd.scale.set(0.09, 0.16, 0.09); hd.position.y = 0.08; hd.rotation.x = Math.PI; g.add(hd);
        g.renderOrder = 5; sh.renderOrder = 5; hd.renderOrder = 5;
        g.userData.mt = mt; g.visible = false; scene.add(g); return g;
      }
      var wArrows = CRATES.map(function () { return arrow(0xff9b3d); });
      var rArrows = pil.map(function (q) { var a = arrow(0x5fe8a8); a.rotation.x = Math.PI; a.position.set(q[0] * (PX + 0.32), DECK_Y + 0.62, q[1] * (PX + 0.32)); return a; });
      // pontos de carga descendo pelas travas
      var NLD = 24;
      var loadDots = new THREE.InstancedMesh(gSphLo, new THREE.MeshBasicMaterial({ color: 0xbfffe6, transparent: true, opacity: 0.95, depthWrite: false }), NLD);
      loadDots.frustumCulled = false; loadDots.renderOrder = 6; scene.add(loadDots);
      var LPATH = [
        [E(0, BR_Y1, BR_OFF + 0.05), E(-PX, BR_Y0, BR_OFF + 0.05)], [E(0, BR_Y1, BR_OFF + 0.05), E(PX, BR_Y0, BR_OFF + 0.05)],
        [E(BR_OFF + 0.05, BR_Y1, 0), E(BR_OFF + 0.05, BR_Y0, PX)], [E(BR_OFF + 0.05, BR_Y1, 0), E(BR_OFF + 0.05, BR_Y0, -PX)],
        [E(-PX, PIL_TOP, PX + 0.12), E(-PX, PIL_Y0, PX + 0.12)], [E(PX + 0.12, PIL_TOP, -PX), E(PX + 0.12, PIL_Y0, -PX)]
      ];
      LPATH.forEach(function (p) { var d = new THREE.Vector3().subVectors(p[1], p[0]); var L = d.length(); p[0].addScaledVector(d, 0); p.push(L); });

      /* faíscas e anéis de encaixe */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 96;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }), NSP);
      var spData = [], spCols = [0xfff27a, 0xffffff, 0x8ffff0, 0xffc93c];
      for (i = 0; i < NSP; i++) { spData.push({ a: (i % 8) / 8 * Math.PI * 2 + R() * 0.6, up: 0.3 + R() * 0.6, r: 0.35 + R() * 0.45, s: 0.6 + R() * 0.6 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; scene.add(sparks);
      var NRING = 6;
      var rings = []; for (i = 0; i < NRING; i++) { var rm = new THREE.Mesh(G('ring', function () { return new THREE.RingGeometry(0.8, 1, 40); }), new THREE.MeshBasicMaterial({ color: 0xbffff6, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); rm.rotation.x = -Math.PI / 2; rm.visible = false; scene.add(rm); rings.push(rm); }
      // feixe de "teleporte" vindo da paleta
      var beamMat = new THREE.MeshBasicMaterial({ color: 0x8ff3ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      var beam = new THREE.Mesh(G('beamc', function () { return new THREE.CylinderGeometry(1, 1, 1, 16, 1, true); }), beamMat); beam.visible = false; beam.renderOrder = 7; scene.add(beam);

      /* ----- vegetação ----- */
      var TREES = [], tryN = 0;
      [[-3.0, 1.6], [3.2, 2.6], [3.6, -0.6], [-2.6, -2.6], [0.6, -3.6], [-3.6, 4.6], [4.0, 4.6], [-4.8, 0.2]].forEach(function (p) { var w = uv2w(p[0], p[1]); if (freeAt(w.x, w.z, 0.6)) { TREES.push([w.x, w.z, 0.85 + R() * 0.35]); avoid(w.x, w.z, 0.7); } });
      while (TREES.length < 30 && tryN < 700) {
        tryN++;
        var u = -6 + R() * 12, vv = -9 + R() * 20, w = uv2w(u, vv);
        if (Math.abs(u) < 2.9 && vv > -3.4 && vv < 3.0) continue;
        if (!freeAt(w.x, w.z, 0.55)) continue;
        TREES.push([w.x, w.z, 0.8 + R() * 0.45]); avoid(w.x, w.z, 0.75);
      }
      var trunkL = [], canL = [];
      var canopyCols = [0x58b84e, 0x4aa648, 0x6cc45a, 0x3f9a4a, 0x7fcf5c];
      TREES.forEach(function (t, j) {
        var s = t[2];
        trunkL.push({ x: t[0], y: 0.35 * s, z: t[1], sx: 0.11 * s, sy: 0.7 * s, sz: 0.11 * s });
        var cc = canopyCols[j % 5];
        if (j % 9 === 4) cc = 0xf2b13f; if (j % 11 === 7) cc = 0xf49ac1;
        tmpC.set(cc); var cDark = tmpC.clone().multiplyScalar(0.86).getHex(), cLight = tmpC.clone().lerp(new THREE.Color(0xfff6c8), 0.18).getHex();
        canL.push({ x: t[0], y: 1.05 * s, z: t[1], sx: 0.62 * s, sy: 0.56 * s, sz: 0.62 * s, c: cc });
        canL.push({ x: t[0] - 0.28 * s, y: 0.86 * s, z: t[1] + 0.16 * s, sx: 0.4 * s, sy: 0.36 * s, sz: 0.4 * s, c: cDark });
        canL.push({ x: t[0] + 0.22 * s, y: 1.4 * s, z: t[1] + 0.08 * s, sx: 0.36 * s, sy: 0.32 * s, sz: 0.36 * s, c: cLight });
      });
      instanced(gCyl, M(0x9a6038), trunkL, true);
      instanced(gSph, M(0xffffff, { roughness: 0.85 }), canL, true);
      var BUSH = [];
      for (tryN = 0; tryN < 500 && BUSH.length < 40; tryN++) {
        var u2 = -5 + R() * 10, v2 = -8 + R() * 18, wb = uv2w(u2, v2);
        if (!freeAt(wb.x, wb.z, 0.25)) continue;
        var bs = 0.2 + R() * 0.14, bc = [0x5bbd4c, 0x4fae4a, 0x6ccf5a][BUSH.length % 3];
        BUSH.push({ x: wb.x, y: bs * 0.55, z: wb.z, sx: bs * 1.3, sy: bs, sz: bs * 1.1, c: bc });
        BUSH.push({ x: wb.x + bs * 0.9, y: bs * 0.4, z: wb.z + 0.1, sx: bs * 0.85, sy: bs * 0.7, sz: bs * 0.8, c: bc });
      }
      instanced(gSphLo, M(0xffffff, { roughness: 0.85 }), BUSH, true);
      var FLW = [], TUF = [], ROCK = [];
      var flCols = [0xffffff, 0xff7aa8, 0xffd23f, 0xb48cff, 0xff9a5c];
      for (tryN = 0; tryN < 900 && FLW.length < 100; tryN++) {
        var cu = -4.5 + R() * 9, cvv = -7 + R() * 15, cw = uv2w(cu, cvv);
        if (!freeAt(cw.x, cw.z, 0.05)) continue;
        var col2 = flCols[Math.floor(R() * 5)];
        for (var k2 = 0; k2 < 3; k2++) { var fx = cw.x + (R() - 0.5) * 0.5, fz = cw.z + (R() - 0.5) * 0.5; if (freeAt(fx, fz, 0)) FLW.push({ x: fx, y: 0.07, z: fz, sx: 0.055, sy: 0.04, sz: 0.055, c: col2 }); }
      }
      for (tryN = 0; tryN < 500 && TUF.length < 120; tryN++) {
        var tu = -5 + R() * 10, tv = -8 + R() * 18, tw = uv2w(tu, tv);
        if (!freeAt(tw.x, tw.z, 0)) continue;
        TUF.push({ x: tw.x, y: 0.07, z: tw.z, sx: 0.05, sy: 0.16 + R() * 0.08, sz: 0.05, rz: (R() - 0.5) * 0.4, c: [0x4fa844, 0x5fb84f, 0x3f9a3e][TUF.length % 3] });
      }
      for (i = 0; i < 14; i++) { var ra = R() * Math.PI * 2, rd = 2.6 + R() * 0.6, rs = 0.08 + R() * 0.1; ROCK.push({ x: Math.cos(ra) * rd * 1.1, y: rs * 0.25, z: Math.sin(ra) * rd, sx: rs * 1.3, sy: rs * 0.75, sz: rs, ry: R() * 3, c: [0xc9c3d6, 0xb7b2c8, 0xd8d2e2][i % 3] }); }
      instanced(gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
      instanced(G('tufcone', function () { return new THREE.ConeGeometry(1, 1, 5); }), M(0xffffff, { roughness: 0.9 }), TUF, false);
      instanced(gSphLo, M(0xffffff, { roughness: 0.8 }), ROCK, true);
      instanced(gHex, pinMat(0xffffff), PINS, true);

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = ID + '-vig'; root.appendChild(vig);
      var bpv = document.createElement('div'); bpv.className = ID + '-bpv'; root.appendChild(bpv);
      var SVGNS = 'http://www.w3.org/2000/svg';
      var wipe = document.createElementNS(SVGNS, 'svg'); wipe.setAttribute('class', ID + '-wipe'); root.appendChild(wipe);
      var wipePath = document.createElementNS(SVGNS, 'path'); wipePath.setAttribute('fill', '#fff4df'); wipePath.setAttribute('fill-rule', 'evenodd'); wipe.appendChild(wipePath);
      var wipeEdge = document.createElementNS(SVGNS, 'path'); wipeEdge.setAttribute('fill', 'none'); wipeEdge.setAttribute('stroke', '#ff8a2a'); wipeEdge.setAttribute('stroke-width', '6'); wipeEdge.setAttribute('stroke-linejoin', 'round'); wipe.appendChild(wipeEdge);
      wipe.style.display = 'none';

      var hud = document.createElement('div'); hud.className = ID + '-hud';
      hud.innerHTML = H(
        '<div class="@@-crn" style="border-right:0;border-bottom:0;border-top-left-radius:calc(8px*var(--s))"></div><div class="@@-crn" style="border-left:0;border-bottom:0;border-top-right-radius:calc(8px*var(--s))"></div>' +
        '<div class="@@-crn" style="border-right:0;border-top:0;border-bottom-left-radius:calc(8px*var(--s))"></div><div class="@@-crn" style="border-left:0;border-top:0;border-bottom-right-radius:calc(8px*var(--s))"></div>' +
        '<div class="@@-dim" data-d="h">1,5 m</div><div class="@@-dim" data-d="v">2 m</div>' +
        '<div class="@@-wok">' + IC_CHECKW + 'Estrutura estável</div>' +
        '<div class="@@-top @@-card"><div class="@@-ava">' + AVATAR + '<span class="@@-lv">3</span></div>' +
        '<div class="@@-stat"><div class="@@-ttl">Nível 3 · <span>Construtor</span></div>' +
        '<div class="@@-bar"><div class="@@-fill"></div><div class="@@-flash"></div></div>' +
        '<div class="@@-xpn"><span>Experiência</span><span><b class="@@-xpv">340</b> / 600 XP</span></div></div>' +
        '<div class="@@-pause">' + IC_PAUSE + '</div></div>' +
        '<div class="@@-quest @@-card"><div class="@@-qi">' + IC_SHOP + '</div><div class="@@-qt"><b>Missão:</b> ajudar na oficina do Mestre Tomé</div></div>' +
        '<div class="@@-chal @@-card"><div class="@@-chh"><span class="@@-tag">' + IC_TROPHY + 'Desafio</span><span class="@@-trk">Engenharia civil · Nível 3</span></div>' +
        '<div class="@@-cht">Construa uma torre que aguente <b>3 caixotes</b></div>' +
        '<div class="@@-chr"><div class="@@-crs"><div class="@@-cr">' + IC_CRATE + '</div><div class="@@-cr">' + IC_CRATE + '</div><div class="@@-cr">' + IC_CRATE + '</div></div>' +
        '<div class="@@-stab"><div class="@@-stl"><span>Estabilidade</span><b class="@@-stv">0%</b></div><div class="@@-sbar"><div class="@@-sfill"></div></div></div>' +
        '<div class="@@-ok">' + IC_CHECKW + 'Estrutura estável</div></div></div>' +
        '<div class="@@-mode">' + IC_GRID + 'Modo construção</div>' +
        '<div class="@@-bub @@-card"><div class="@@-tail"></div><div class="@@-nm">' + IC_HELMET + 'Mestre Tomé</div><div class="@@-say"><b>Triângulos</b> deixam tudo mais firme!</div></div>' +
        '<div class="@@-xp">' + IC_XP + '+60 XP</div>' +
        '<div class="@@-btns">' +
        '<div class="@@-btn @@-card @@-pri"><i>' + IC_BUILD + '</i>Construir</div>' +
        '<div class="@@-btn @@-card"><i style="background:#fff0e0">' + IC_BAG + '</i>Mochila</div>' +
        '<div class="@@-btn @@-card"><i style="background:#e6f5dc">' + IC_MAP + '</i>Mapa</div></div>' +
        '<div class="@@-pal @@-card">' +
        '<div class="@@-tool" data-t="viga"><i>' + IC_VIGA + '</i>Viga<em>3</em></div>' +
        '<div class="@@-tool" data-t="pilar"><i>' + IC_PILAR + '</i>Pilar<em>4</em></div>' +
        '<div class="@@-tool" data-t="trava"><i>' + IC_TRAVA + '</i>Trava<em>4</em></div>' +
        '<div class="@@-tool" data-t="apagar"><i>' + IC_APAGAR + '</i>Apagar</div>' +
        '<div class="@@-sep"></div><div class="@@-test"><i>' + IC_PLAY + '</i>Testar</div></div>');
      root.appendChild(hud);
      function q(sel) { return hud.querySelector('.' + ID + '-' + sel); }
      var elFill = q('fill'), elFlash = q('flash'), elXpv = q('xpv'), elBub = q('bub'), elXp = q('xp'), elQuest = q('quest'), elChal = q('chal'), elMode = q('mode'),
        elBtns = q('btns'), elBuild = q('pri'), elPal = q('pal'), elTest = q('test'), elSfill = q('sfill'), elStv = q('stv'), elOk = q('ok'), elWok = q('wok');
      var elCrs = hud.querySelectorAll('.' + ID + '-cr'), elCrn = hud.querySelectorAll('.' + ID + '-crn'), elDims = hud.querySelectorAll('.' + ID + '-dim');
      var tools = {}; Array.prototype.forEach.call(hud.querySelectorAll('.' + ID + '-tool'), function (e2) { tools[e2.getAttribute('data-t')] = e2; e2.userData = { cnt: e2.querySelector('em') }; });

      /* ----- layout / câmera ----- */
      var S = 1, dist0 = 26, dist1 = 14, zoneTop = 300, zoneBot = 700;
      function layout() {
        W = host.clientWidth || W; Hh = host.clientHeight || Hh;
        renderer.setSize(W, Hh, false);
        camera.aspect = W / Hh;
        var t = Math.tan(FOV / 2 * Math.PI / 180);
        dist0 = camera.aspect < 0.8 ? (6.3 / 2) / (t * camera.aspect) : 6.6 / t;
        dist1 = camera.aspect < 0.8 ? (4.6 / 2) / (t * camera.aspect) : 4.8 / t;
        camera.updateProjectionMatrix();
        S = clamp(Math.min(W / 390, Hh / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        wipe.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
        zoneTop = elChal.offsetTop + elChal.offsetHeight + 8 * S;
        zoneBot = elPal.offsetTop - 8 * S;
        var cs = 22 * S, m = 10 * S;
        var pos = [[m, zoneTop], [W - m - cs, zoneTop], [m, zoneBot - cs], [W - m - cs, zoneBot - cs]];
        Array.prototype.forEach.call(elCrn, function (e2, k) { e2.style.left = pos[k][0] + 'px'; e2.style.top = pos[k][1] + 'px'; });
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);

      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion();
      function proj(p) { v3.copy(p).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * Hh }; }
      function projXYZ(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * Hh }; }
      var T0 = new THREE.Vector3(0.25, 0, 0.45), T1 = new THREE.Vector3(0.05, 1.05, 0.05), Tc = new THREE.Vector3();

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        var s = t >= LOOP - 0.3 ? t - LOOP : t;

        var zk = reduce ? sstep(0.4, 0.9, s) : inOut(clamp((s - 0.45) / 1.15, 0, 1));
        var mode = sstep(0.6, 1.35, s);
        // câmera: do alto padrão da exploração -> mais perto e mais de cima
        var az = lerp(AZ, AZ1, zk) + (reduce ? 0 : 0.03 * Math.sin(wall * 0.5) * zk);
        var el = lerp(EL0, EL1, zk);
        var dist = lerp(dist0, dist1, zk) * (1 - (reduce ? 0 : 0.02 * sstep(1.6, 6.0, s)));
        Tc.lerpVectors(T0, T1, zk);
        // centra a torre na faixa livre entre o cartão de desafio e a paleta
        camera.position.set(Tc.x + dist * Math.sin(az) * Math.cos(el), Tc.y + dist * Math.sin(el), Tc.z + dist * Math.cos(az) * Math.cos(el));
        camera.lookAt(Tc);
        var zoneMid = (zoneTop + zoneBot) / 2, off = (zoneMid - Hh / 2) * zk;
        if (Math.abs(off) > 0.5) camera.setViewOffset(W, Hh, 0, -off, W, Hh); else camera.clearViewOffset();
        camera.updateMatrixWorld();

        // paleta de cor/luz do modo construção
        U.dW.value = mode * 0.62; U.dC.value = mode * 0.18; U.dV.value = 0;
        U.uRimColor.value.copy(RIM0).lerp(RIM1, mode); U.uRimStr.value = 0.42 + 0.2 * mode;
        clearC.copy(CLEAR0).lerp(CLEAR1, mode); renderer.setClearColor(clearC);
        scene.fog.color.copy(FOG0).lerp(FOG1, mode);
        hemi.intensity = 0.6 + 0.08 * mode; sun.intensity = 0.86 - 0.12 * mode;
        bpv.style.opacity = mode.toFixed(3);
        vig.style.opacity = (1 - mode).toFixed(3);

        // grade técnica
        var gk = sstep(0.75, 1.75, s);
        gridU.uR.value = 0.2 + gk * 4.6; gridU.uA.value = mode; gridU.uT.value = wall;
        grid.visible = mode > 0.01;
        footRings.forEach(function (fr, k) {
          var p = PIECES[k], on = mode * (1 - sstep(p.t1 - 0.05, p.t1 + 0.1, s));
          fr.visible = on > 0.01; fr.material.opacity = on * (0.55 + 0.35 * Math.sin(wall * 6 + k));
          fr.scale.setScalar(1 + 0.08 * Math.sin(wall * 6 + k));
        });
        // cotas
        var dk = sstep(1.25, 1.7, s);
        dimMat.opacity = 0.9 * dk * mode;

        // peças
        camQ.copy(camera.quaternion);
        var stab = 0, beamOn = 0, beamP = null, beamK = 0;
        var nextIdx = -1;
        for (var k = 0; k < NP; k++) if (s < PIECES[k].t1) { nextIdx = k; break; }
        for (k = 0; k < NP; k++) {
          var p = PIECES[k], g = p.g;
          var appear = p.t0 - 0.28;
          if (s < appear) { g.visible = false; }
          else {
            g.visible = true;
            var ak = clamp((s - appear) / 0.28, 0, 1), fk = clamp((s - p.t0) / (p.t1 - p.t0), 0, 1);
            var fall = fk * fk;
            g.position.copy(p.end); g.position.y += p.drop * (1 - fall);
            g.rotation.copy(p.endRot);
            if (p.spin) g.rotation.y += p.spin * (1 - outCubic(fk)) * (1 - fk);
            var sc2 = s < p.t0 ? outBack(ak, 2.2) : 1;
            var cl = pulse(s, p.t1, 0.16);
            g.scale.set(sc2 * (1 + cl * 0.1), sc2 * (1 - cl * 0.2), sc2 * (1 + cl * 0.1));
            var gl0 = p.glow || 0.55; p.mat.emissiveIntensity = s < p.t1 ? gl0 * (1 - fk * 0.5) : gl0 * (1 - sstep(p.t1, p.t1 + 0.5, s));
            if (s > appear && s < p.t1) { beamOn = Math.max(beamOn, Math.sin(Math.PI * clamp((s - appear) / (p.t1 - appear), 0, 1))); beamP = p; }
          }
          // fantasma
          var isNext = k === nextIdx || (nextIdx >= 0 && k > nextIdx && PIECES[k].t0 - 0.28 < s);
          var gOn = mode * (s < p.t1 ? 1 : 0);
          p.gh.visible = gOn > 0.01;
          if (p.gh.visible) {
            var pl = 0.5 + 0.5 * Math.sin(wall * 7 + k);
            p.gm.material = isNext ? ghostNextFill : ghostFill;
            p.el.material = isNext ? ghostNextLine : ghostLine;
          }
          if (s > p.t1) stab += 1;
        }
        ghostFill.opacity = 0.07 * mode; ghostLine.opacity = 0.42 * mode;
        var gp2 = 0.5 + 0.5 * Math.sin(wall * 7);
        ghostNextFill.opacity = (0.16 + 0.14 * gp2) * mode; ghostNextLine.opacity = (0.6 + 0.4 * gp2) * mode;
        // feixe da paleta sobre a peça em queda
        beam.visible = beamOn > 0.02 && beamP;
        if (beam.visible) {
          var bp = beamP.end, topY = bp.y + beamP.drop + 1.6;
          beam.position.set(bp.x, (bp.y + topY) / 2, bp.z); beam.scale.set(0.12 + 0.05 * beamOn, topY - bp.y, 0.12 + 0.05 * beamOn);
          beamMat.opacity = 0.22 * beamOn;
        }
        // chaves borboleta do X
        xBows.forEach(function (bw) {
          var pp = PIECES[bw.userData.k], k01 = clamp((s - pp.t1) / 0.22, 0, 1);
          bw.scale.setScalar(Math.max(0.001, s > pp.t1 ? outBack(k01, 2.6) * 1.25 : 0));
          bw.material.emissiveIntensity = (1 - sstep(pp.t1 + 0.15, pp.t1 + 0.8, s)) * 0.9;
        });
        // triângulos brilhando (dica do Mestre Tomé)
        triMats.forEach(function (tm, j) {
          var face = j < 4 ? 0 : 1, start = face ? 3.62 : 3.3, tj = start + (j % 4) * 0.12;
          var on = sstep(tj, tj + 0.12, s) * (1 - sstep(4.25, 4.6, s));
          var fl = 0.5 + 0.5 * Math.sin(wall * 8 - j);
          tm.m.visible = on > 0.01; tm.mt.opacity = on * (0.16 + 0.12 * fl);
        });

        // caixotes voando para o topo
        var crN = 0;
        CRATES.forEach(function (o, k) {
          var k01 = clamp((s - o.t0) / (o.t1 - o.t0), 0, 1), e = k01 * k01 * (3 - 2 * k01);
          o.g.position.lerpVectors(o.start, o.end, e);
          o.g.position.y += Math.sin(Math.PI * k01) * 1.4;
          o.g.rotation.set(Math.sin(Math.PI * k01) * 0.3, (1 - e) * 1.2 + k * 0.1 * (1 - e), Math.sin(Math.PI * k01) * 0.25);
          var cl = pulse(s, o.t1, 0.18);
          o.g.scale.set(1 + cl * 0.1, 1 - cl * 0.18, 1 + cl * 0.1);
          if (s > o.t1) crN++;
          // seta de peso
          var a = wArrows[k], wa = sstep(o.t1, o.t1 + 0.18, s) * (1 - sstep(5.75, 6.0, s));
          a.visible = wa > 0.01;
          if (a.visible) { a.userData.mt.opacity = wa * 0.95; a.position.set(o.end.x + (k === 2 ? 0 : (k ? 0.08 : -0.08)), o.end.y + CR / 2 + 0.06 + 0.06 * Math.abs(Math.sin(wall * 5 + k)), o.end.z); a.scale.setScalar(0.9 + 0.1 * wa); }
        });
        // reação nos apoios + caminho das cargas
        var stable = sstep(4.95, 5.1, s);
        rArrows.forEach(function (a, k) {
          var ra2 = sstep(4.9 + k * 0.04, 5.08 + k * 0.04, s) * (1 - sstep(5.75, 6.0, s));
          a.visible = ra2 > 0.01;
          if (a.visible) { a.userData.mt.opacity = ra2 * 0.95; a.scale.setScalar(0.8 * (0.85 + 0.15 * ra2)); a.position.y = DECK_Y + 0.58 + 0.05 * Math.abs(Math.sin(wall * 5 + k)); }
        });
        var ld = sstep(4.88, 5.05, s) * (1 - sstep(5.7, 5.95, s));
        for (var di = 0; di < NLD; di++) {
          var path = LPATH[di % LPATH.length], ph = ((wall * 0.9 + Math.floor(di / LPATH.length) / 4) % 1);
          if (ld < 0.01) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else { dummy.position.lerpVectors(path[0], path[1], ph); dummy.scale.setScalar(0.04 * ld * Math.sin(ph * Math.PI) + 0.0001); }
          dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); loadDots.setMatrixAt(di, dummy.matrix);
        }
        loadDots.instanceMatrix.needsUpdate = true;

        // faíscas e anéis por encaixe
        var events = PIECES.map(function (p) { return { t: p.t1, pos: p.end, big: p.kind === 'viga' }; }).concat(CRATES.map(function (o) { return { t: o.t1, pos: o.end, big: true }; }));
        for (var si = 0; si < NSP; si++) {
          var ev = events[Math.floor(si / 8) % events.length], sd = spData[si];
          var fk2 = clamp((s - ev.t) / 0.6, 0, 1), on2 = s > ev.t && fk2 < 1 && Math.floor(si / 8) < events.length;
          if (!on2) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); dummy.rotation.set(0, 0, 0); }
          else {
            var ee = outCubic(fk2), rr2 = sd.r * ee * (ev.big ? 1.3 : 0.8);
            dummy.position.set(ev.pos.x + Math.cos(sd.a) * rr2, ev.pos.y + 0.05 + sd.up * ee - fk2 * fk2 * 0.4, ev.pos.z + Math.sin(sd.a) * rr2);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk2 * 1.3) * Math.PI) * 1.2 + 0.0001);
            dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + sd.a);
          }
          dummy.updateMatrix(); sparks.setMatrixAt(si, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;
        rings.forEach(function (rg) { rg.visible = false; });
        events.forEach(function (ev, j) {
          var rk = clamp((s - ev.t) / 0.45, 0, 1);
          if (s > ev.t && rk < 1) { var rg = rings[j % NRING]; rg.visible = true; rg.position.set(ev.pos.x, Math.max(DECK_Y + 0.02, ev.pos.y - 0.3), ev.pos.z); rg.scale.setScalar((ev.big ? 0.5 : 0.25) + outCubic(rk) * (ev.big ? 0.9 : 0.5)); rg.material.opacity = (1 - rk) * 0.8; }
        });

        // ---- herói: rege as peças com o braço; comemora no fim
        var cheer = sstep(5.0, 5.15, s) * (1 - sstep(5.75, 5.95, s));
        var conduct = sstep(1.45, 1.65, s) * (1 - sstep(4.85, 5.0, s));
        var faceTower = Math.atan2(-hero.position.x, -hero.position.z);
        hero.rotation.y = lerp(faceTower + 0.55, faceTower, conduct) + cheer * 0.6;
        var idleB = Math.sin(wall * 2.4);
        hB.position.y = 0.006 * idleB;
        hB.rotation.set(0, 0, 0);
        hLegs[0].rotation.x = 0; hLegs[1].rotation.x = 0;
        var jump = s > 5.03 && s < 5.45 ? Math.sin((s - 5.03) / 0.42 * Math.PI) : 0;
        hB.position.y += jump * 0.3;
        var sq = 1 + 0.012 * idleB + jump * 0.1 - pulse(s, 4.95, 0.1) * 0.1;
        hSq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        hArms[0].rotation.set(0, 0, -0.18); hArms[1].rotation.set(0, 0, 0.18);
        var wave = Math.sin(wall * 9);
        hArms[1].rotation.x = -conduct * (2.3 + wave * 0.18); hArms[1].rotation.z += conduct * 0.2;
        hArms[0].rotation.x = -conduct * 0.4;
        hArms[0].rotation.x -= cheer * 0.5; hArms[1].rotation.x -= cheer * 0.5 * (1 - conduct);
        hArms[0].rotation.z -= cheer * (2.3 + Math.sin(wall * 20) * 0.15); hArms[1].rotation.z += cheer * (2.3 + Math.sin(wall * 20 + 1) * 0.15);
        hHead.rotation.x = -0.18 - 0.25 * conduct; hHead.rotation.y = 0.15 * Math.sin(wall * 0.9) * (1 - conduct); hHead.rotation.z = 0.08 * cheer * Math.sin(wall * 9);
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + cheer * 1.4 + conduct * 0.3), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink);

        // ---- Mestre Tomé: dica dos triângulos, joinha no fim
        var talk = sstep(2.85, 3.05, s) * (1 - sstep(4.3, 4.5, s));
        var thumbs = sstep(5.0, 5.15, s) * (1 - sstep(5.75, 5.95, s));
        var faceT = Math.atan2(-tome.position.x, -tome.position.z);
        tome.rotation.y = faceT + 0.75 - 0.35 * talk + 0.15 * thumbs;
        tB.position.y = Math.abs(Math.sin(wall * 2.2)) * 0.012 + thumbs * Math.max(0, Math.sin((s - 5.0) * 12)) * 0.05;
        tB.rotation.z = Math.sin(s * 7) * 0.04 * talk;
        var ta = tArms[0], tr = tArms[1];
        ta.rotation.set(0, 0, -0.12); tr.rotation.set(0, 0, 0.12);
        // aponta para a torre (braço esquerdo, do lado da torre) com dedo de professor
        ta.rotation.x = -talk * (1.5 + Math.sin(s * 10) * 0.15); ta.rotation.z -= talk * 0.5;
        tr.rotation.x = -talk * 0.3;
        tr.rotation.x -= thumbs * 2.2; tr.rotation.z += thumbs * 0.2;
        ta.rotation.x -= thumbs * 0.4; ta.rotation.z -= thumbs * 0.6;
        tHead.rotation.x = -0.45 + Math.sin(s * 11) * 0.06 * talk + thumbs * Math.sin((s - 5.0) * 16) * 0.08;
        tHead.rotation.z = 0.08 * talk + 0.06 * Math.sin(wall * 1.3);
        tHead.rotation.y = -0.2 * talk;
        var tsq = 1 + Math.sin(s * 11) * 0.025 * talk;
        tB.scale.set(1 / Math.sqrt(tsq), tsq, 1 / Math.sqrt(tsq));
        tMouth.scale.set(0.05, 0.03 * (1 + talk * (0.6 + 0.6 * Math.sin(s * 22)) + thumbs * 0.8), 0.03);
        var bl2 = (wall + 1.4) % 3.7, blink2 = bl2 < 0.12 ? Math.abs(Math.cos(bl2 / 0.12 * Math.PI)) : 1;
        tEyes[0].scale.y = tEyes[1].scale.y = Math.max(0.1, blink2) * (1 - 0.35 * thumbs);

        // ---- HUD
        // exploração -> modo construção
        var hx = sstep(0.42, 0.75, s);
        var press = pulse(s, 0.3, 0.2);
        elBuild.style.transform = 'translateY(' + (-3 * S * Math.max(0, Math.sin(wall * 5)) * (1 - sstep(0.15, 0.3, s))).toFixed(2) + 'px) scale(' + (1 - press * 0.08).toFixed(3) + ')';
        elBtns.style.opacity = (1 - hx).toFixed(3);
        elBtns.style.transform = 'translateY(' + (hx * 30 * S).toFixed(1) + 'px)';
        elBtns.style.display = hx > 0.99 ? 'none' : 'flex';
        var px2 = sstep(0.62, 1.0, s);
        elPal.style.opacity = px2.toFixed(3);
        elPal.style.transform = 'translateY(' + ((1 - outBack(px2, 1.6)) * 40 * S).toFixed(1) + 'px)';
        elQuest.style.opacity = (1 - hx).toFixed(3);
        var ck = sstep(0.75, 1.1, s);
        elChal.style.opacity = ck.toFixed(3);
        elChal.style.transform = 'translateY(' + ((1 - ck) * -10 * S).toFixed(1) + 'px) scale(' + (0.96 + 0.04 * ck).toFixed(3) + ')';
        var mk = sstep(1.0, 1.3, s) * (1 - sstep(5.85, 6.0, s));
        elMode.style.opacity = mk.toFixed(3);
        elMode.style.transform = 'translate(-50%,' + (zoneTop + 2 * S).toFixed(1) + 'px) scale(' + (s < 1.3 ? outBack(clamp((s - 1.0) / 0.3, 0, 1), 2) : 1).toFixed(3) + ')';
        Array.prototype.forEach.call(elCrn, function (e2) { e2.style.opacity = (mode * 0.9).toFixed(3); });

        // ferramenta selecionada
        var sel = s < 2.3 ? 'pilar' : s < 2.86 ? 'viga' : s < 3.72 ? 'trava' : 'viga';
        var used = { pilar: 0, viga: 0, trava: 0 };
        for (k = 0; k < NP; k++) if (s > PIECES[k].t0) used[PIECES[k].kind]++;
        for (var tn in tools) {
          var te = tools[tn], on3 = tn === sel && s > 1.0 && s < 4.25;
          te.classList.toggle('sel', on3);
          te.style.transform = on3 ? 'translateY(' + (-5 * S).toFixed(1) + 'px)' : 'none';
          if (tn === 'pilar') te.userData.cnt.textContent = 4 - used.pilar;
          if (tn === 'viga') te.userData.cnt.textContent = 3 - used.viga;
          if (tn === 'trava') te.userData.cnt.textContent = 4 - used.trava;
        }
        var tp = pulse(s, 4.24, 0.2);
        elTest.style.transform = 'scale(' + (1 - tp * 0.1 + (s > 4.1 && s < 4.24 ? 0.04 * Math.sin(wall * 30) : 0)).toFixed(3) + ')';
        elTest.style.boxShadow = s > 4.1 && s < 4.55 ? '0 0 0 ' + (3 * S).toFixed(1) + 'px #fffaf0,0 0 0 ' + (6 * S).toFixed(1) + 'px rgba(47,181,130,.6)' : '';

        // estabilidade e caixotes
        var stp = Math.round(clamp(stab / NP, 0, 1) * 90 + crN * (10 / 3));
        elSfill.style.width = stp + '%';
        elStv.textContent = stp + '%';
        elSfill.style.background = stp >= 100 ? 'linear-gradient(90deg,#43c59e,#7fdc5a)' : 'linear-gradient(90deg,#5aa9e6,#2f6fe0)';
        Array.prototype.forEach.call(elCrs, function (e2, k) { e2.classList.toggle('on', s > CRATES[k].t1); e2.style.transform = 'scale(' + (1 + 0.25 * pulse(s, CRATES[k].t1, 0.25)).toFixed(3) + ')'; });
        var okk = sstep(4.95, 5.1, s);
        elOk.style.opacity = okk.toFixed(3);
        elOk.style.transform = 'scale(' + (s < 5.25 ? 0.85 + 0.15 * outBack(clamp((s - 4.95) / 0.3, 0, 1), 2.4) : 1).toFixed(3) + ')';

        // rótulos de cota
        var dimA = dk * mode * (1 - sstep(5.85, 6.0, s));
        var ph1 = projXYZ(DIM_H.x, DIM_H.y, DIM_H.z), pv1 = projXYZ(DIM_V.x, DIM_V.y, DIM_V.z);
        elDims[0].style.transform = 'translate(' + ph1.x.toFixed(1) + 'px,' + ph1.y.toFixed(1) + 'px) translate(-50%,-50%)';
        elDims[1].style.transform = 'translate(' + pv1.x.toFixed(1) + 'px,' + pv1.y.toFixed(1) + 'px) translate(-50%,-50%)';
        elDims[0].style.opacity = elDims[1].style.opacity = dimA.toFixed(3);

        // selo "Estrutura estável" sobre a torre
        var wk2 = sstep(4.98, 5.12, s) * (1 - sstep(5.9, 6.0, s));
        var wp = projXYZ(0, PLATE_TOP + CR * 2 + 0.35, 0);
        elWok.style.display = 'none';
        elWok.style.transform = 'translate(' + wp.x.toFixed(1) + 'px,' + (wp.y - 6 * S * Math.sin(wall * 3)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (s < 5.3 ? outBack(clamp((s - 4.98) / 0.3, 0, 1), 2.6) : 1).toFixed(3) + ')';

        // XP
        var xpK = sstep(5.25, 5.7, s);
        elFill.style.width = (56.7 + 10 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(340 + 60 * xpK);
        var fl2 = clamp((s - 5.3) / 0.5, 0, 1);
        elFlash.style.opacity = s > 5.3 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elFlash.style.left = (fl2 * 70) + '%';
        var xk = clamp((s - 5.12) / 0.8, 0, 1);
        elXp.style.opacity = s > 5.12 ? (xk < 0.12 ? xk / 0.12 : 1 - sstep(0.7, 1, xk)).toFixed(3) : 0;
        elXp.style.transform = 'translate(' + (wp.x).toFixed(1) + 'px,' + (wp.y + 10 * S - 46 * S * outCubic(xk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.2 ? outBack(xk / 0.2, 2.4) : 1).toFixed(3) + ')';

        // balão do Mestre Tomé (acima da cabeça, cauda para baixo)
        var bIn = clamp((s - 2.85) / 0.3, 0, 1), bOut = sstep(4.35, 4.6, s);
        var bsc = (bIn > 0 ? outBack(bIn, 2.2) : 0) * (1 - bOut * 0.3);
        var hp = projXYZ(tome.position.x, -0.02, tome.position.z);
        var bw2 = elBub.offsetWidth || 206, bh2 = elBub.offsetHeight || 80;
        var left = clamp(hp.x - bw2 + 80 * S, 10 * S, W - bw2 - 8 * S);
        var topB = Math.min(zoneBot - bh2 - 4 * S, hp.y + 16 * S);
        var tx2 = clamp(hp.x - left, 22 * S, bw2 - 22 * S);
        elBub.style.setProperty('--tx', tx2.toFixed(1) + 'px');
        elBub.style.transformOrigin = tx2.toFixed(0) + 'px 0';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 2.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, bsc).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 3) * (1 - bOut)).toFixed(3);

        // transição em losango (igual ao combinado) que fecha na torre e reabre
        var ik = t < LOOP - 0.3 ? sstep(LOOP - 0.6, LOOP - 0.3, t) : 1 - sstep(LOOP - 0.3, LOOP, t);
        if (ik <= 0.002) { wipe.style.display = 'none'; }
        else {
          wipe.style.display = 'block';
          var hpp = t < LOOP - 0.3 ? projXYZ(0, 1.2, 0) : projXYZ(hero.position.x, 0.7, hero.position.z);
          var maxR = (W + Hh) * 1.1, rad = Math.max(0, maxR * (1 - ik));
          var dia = 'M' + hpp.x.toFixed(1) + ' ' + (hpp.y - rad * 0.62).toFixed(1) + 'L' + (hpp.x + rad).toFixed(1) + ' ' + hpp.y.toFixed(1) + 'L' + hpp.x.toFixed(1) + ' ' + (hpp.y + rad * 0.62).toFixed(1) + 'L' + (hpp.x - rad).toFixed(1) + ' ' + hpp.y.toFixed(1) + 'Z';
          wipePath.setAttribute('d', 'M-10 -10H' + (W + 10) + 'V' + (Hh + 10) + 'H-10Z' + (rad > 0.5 ? dia : ''));
          wipeEdge.setAttribute('d', rad > 0.5 ? dia : 'M0 0');
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
          [ghostFill, ghostLine, ghostNextFill, ghostNextLine].forEach(function (m) { m.dispose(); });
          renderer.dispose();
          if (renderer.forceContextLoss) renderer.forceContextLoss();
          host.innerHTML = '';
        }
      };
    }
  };
})();
