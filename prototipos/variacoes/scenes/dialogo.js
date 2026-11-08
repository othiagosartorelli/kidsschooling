/* Variação DIÁLOGO — Aula com mentor no Mercado (trilha Finanças pessoais) — KidsSchooling
   Mesmo estilo da cena "combinado" (personagens, blocos com pinos hexagonais e chaves borboleta,
   materiais com rim light, HUD em cartões creme). Muda a câmera (zoom do plano alto para um plano
   médio baixo, fundo enevoado) e a luz (fim de tarde dourado, sol baixo, sombras longas).
   Loop de 6 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'dialogo';
  var LOOP = 6.0;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function inOut(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* câmera: plano alto padrão (igual à exploração) -> plano médio baixo do diálogo */
  var FOV = 30;
  var CAM_HI = { az: 35 * Math.PI / 180, el: 53 * Math.PI / 180 };
  var CAM_LO = { az: 9 * Math.PI / 180, el: 8.5 * Math.PI / 180 };

  /* ---------- HUD ---------- */

  var CSS = [
    '.dialogo-root{position:absolute;inset:0;overflow:hidden;background:#f3a46c;-webkit-user-select:none;user-select:none;}',
    '.dialogo-root canvas.dialogo-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.dialogo-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(125% 85% at 50% 45%,rgba(255,200,120,0) 52%,rgba(120,40,60,.30) 100%);}',
    '.dialogo-glow{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,170,90,.0) 0%,rgba(255,170,90,0) 60%,rgba(120,40,70,.22) 100%);opacity:0;}',
    '.dialogo-wipe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;z-index:10;}',
    '.dialogo-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.dialogo-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(120,90,50,.10),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(80,30,20,.24);}',
    '.dialogo-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.dialogo-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.dialogo-ava svg{display:block;width:100%;height:100%;}',
    '.dialogo-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.dialogo-stat{flex:1;min-width:0;}',
    '.dialogo-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.dialogo-ttl span{color:#2f6fe0;}',
    '.dialogo-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#efe5d3;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(80,60,30,.18);overflow:hidden;}',
    '.dialogo-fill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(90deg,#43c59e,#7fdc5a);}',
    '.dialogo-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.dialogo-flash{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.dialogo-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#7b6f5e;font-variant-numeric:tabular-nums;}',
    '.dialogo-xpn b{color:#2a3350;font-weight:800;}',
    '.dialogo-pause{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#f3ead9;display:grid;place-items:center;}',
    '.dialogo-pause svg{width:46%;height:46%;}',
    '.dialogo-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(12px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:calc(214px*var(--s));}',
    '.dialogo-qi{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#fff1d6;display:grid;place-items:center;}',
    '.dialogo-qi svg{width:82%;height:82%;}',
    '.dialogo-qt{font-weight:700;font-size:calc(13.5px*var(--s));line-height:1.18;color:#3a4260;}',
    '.dialogo-qt b{font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#ff7a1a;}',
    '.dialogo-loc{position:absolute;right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(7px*var(--s));padding:calc(7px*var(--s)) calc(11px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));}',
    '.dialogo-loc i{flex:none;width:calc(30px*var(--s));height:calc(30px*var(--s));border-radius:calc(10px*var(--s));background:linear-gradient(180deg,#ffb36b,#ff7d6b);display:grid;place-items:center;}',
    '.dialogo-loc i svg{width:80%;height:80%;}',
    '.dialogo-loc span{font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a4260;}',
    '.dialogo-loc span small{display:block;font:700 calc(11px*var(--s))/1.2 "Nunito Sans",system-ui,sans-serif;color:#b0602a;}',
    '.dialogo-bub{position:absolute;left:0;top:0;width:calc(236px*var(--s));padding:calc(17px*var(--s)) calc(14px*var(--s)) calc(12px*var(--s));opacity:0;}',
    '.dialogo-tail{position:absolute;bottom:calc(-9px*var(--s));left:var(--tx,24px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));box-shadow:calc(4px*var(--s)) calc(4px*var(--s)) calc(8px*var(--s)) rgba(80,30,20,.14);}',
    '.dialogo-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#3fae6e;color:#fff;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(20,90,50,.3);}',
    '.dialogo-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.dialogo-say{position:relative;font-weight:700;font-size:calc(15.5px*var(--s));line-height:1.25;color:#2a3350;}',
    '.dialogo-say b{color:#e2463f;font-weight:800;}',
    '.dialogo-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(80,30,20,.3);font:600 calc(21px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1f9e6e;}',
    '.dialogo-xp svg{width:calc(24px*var(--s));height:calc(24px*var(--s));}',
    '.dialogo-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.dialogo-btn{flex:1;height:calc(72px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.dialogo-btn i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));display:grid;place-items:center;}',
    '.dialogo-btn i svg{width:76%;height:76%;}',
    '.dialogo-btn.dialogo-pri{background:linear-gradient(180deg,#ff9b3d,#ff7a1a);color:#fff;box-shadow:0 0 0 calc(1px*var(--s)) rgba(160,70,0,.15),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(200,90,0,.35);}',
    '.dialogo-btn.dialogo-pri i{background:rgba(255,255,255,.22);}',
    /* cartão de exercício */
    '.dialogo-ex{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 16px);padding:calc(24px*var(--s)) calc(14px*var(--s)) calc(14px*var(--s));transform:translateY(130%);}',
    '.dialogo-tag{position:absolute;left:calc(14px*var(--s));top:calc(-13px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(4px*var(--s)) calc(11px*var(--s)) calc(4px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#ffc93c;color:#4a3208;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(120,80,10,.25);}',
    '.dialogo-tag svg{width:calc(19px*var(--s));height:calc(19px*var(--s));}',
    '.dialogo-q{font:500 calc(18px*var(--s))/1.22 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;padding-right:calc(40px*var(--s));}',
    '.dialogo-q b{font-weight:600;color:#e07b12;white-space:nowrap;}',
    '.dialogo-jars{display:flex;gap:calc(8px*var(--s));margin-top:calc(10px*var(--s));}',
    '.dialogo-jar{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;padding:calc(8px*var(--s)) 0 calc(8px*var(--s));border-radius:calc(14px*var(--s));background:#f8efdf;}',
    '.dialogo-jar svg.dialogo-js{display:block;width:calc(74px*var(--s));height:calc(86px*var(--s));overflow:visible;}',
    '.dialogo-jl{margin-top:calc(4px*var(--s));font:600 calc(15.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.dialogo-amt{position:absolute;top:calc(-9px*var(--s));right:calc(4px*var(--s));padding:calc(4px*var(--s)) calc(8px*var(--s));border-radius:99px;color:#fff;font:600 calc(14px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(60,30,10,.25);transform:scale(0);white-space:nowrap;}',
    '.dialogo-done{position:absolute;right:calc(12px*var(--s));top:calc(12px*var(--s));width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;border:calc(2.5px*var(--s)) solid #e3d6bf;box-sizing:border-box;display:grid;place-items:center;}',
    '.dialogo-done svg{width:72%;height:72%;opacity:0;}',
    '.dialogo-coin{position:absolute;left:0;top:0;width:calc(34px*var(--s));height:calc(34px*var(--s));opacity:0;will-change:transform;}',
    '.dialogo-coin svg{display:block;width:100%;height:100%;}',
    '.dialogo-ctag{position:absolute;left:0;top:0;opacity:0;padding:calc(3px*var(--s)) calc(8px*var(--s));border-radius:99px;background:#fffaf0;color:#b4610c;font:600 calc(14px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(8px*var(--s)) rgba(80,30,10,.3);white-space:nowrap;}'
  ].join('\n');

  /* ícones SVG flat (mesmo desenho da cena aprovada) */
  var AVATAR = '<svg viewBox="0 0 64 64"><defs><linearGradient id="dialogo-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="dialogo-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#dialogo-avbg)"/>' +
    '<g clip-path="url(#dialogo-avc)">' +
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
  var IC_CHECK = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_XP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_BAG = '<svg viewBox="0 0 32 32"><path d="M11 9V7.5a5 5 0 0 1 10 0V9" stroke="#e86f12" stroke-width="2.6" fill="none"/><rect x="6" y="9" width="20" height="19" rx="6" fill="#ff8a2a"/><path d="M6 15.5a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1H6z" fill="#e86f12"/><rect x="12" y="19" width="8" height="5.5" rx="2" fill="#ffc48a"/><circle cx="16" cy="16.5" r="1.6" fill="#ffc93c"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 32 32"><path d="M16 5l12 6.5L16 18 4 11.5z" fill="#8fd16a"/><path d="M4 11.5V16l12 6.5V18z" fill="#5fae4a"/><path d="M28 11.5V16l-12 6.5V18z" fill="#4c963d"/>' +
    '<path d="M9.5 8.5l13 7" stroke="#5aa9e6" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12.6" r="2.2" fill="#2f6fe0" stroke="#fff" stroke-width="1"/><path d="M20 27l2-3.5 2 3.5z" fill="#ff7a1a"/></svg>';
  var IC_TALK = '<svg viewBox="0 0 32 32"><path d="M5 9a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7l-6 5v-5.2A5 5 0 0 1 5 16z" fill="#fff"/><circle cx="11" cy="12.5" r="1.8" fill="#ff7a1a"/><circle cx="16" cy="12.5" r="1.8" fill="#ff7a1a"/><circle cx="21" cy="12.5" r="1.8" fill="#ff7a1a"/></svg>';
  var IC_LEMON = '<svg viewBox="0 0 32 32"><path d="M8 9h13l-1.6 18a2 2 0 0 1-2 1.8h-5.8a2 2 0 0 1-2-1.8z" fill="#e8f6ff" stroke="#9cc4dd" stroke-width="1.4"/><path d="M9.2 15h10.6l-1 11.6a1.4 1.4 0 0 1-1.4 1.2h-5.8a1.4 1.4 0 0 1-1.4-1.2z" fill="#ffe14a"/><path d="M17 9l3-6" stroke="#ff6f91" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="22" cy="10" r="5.2" fill="#ffd23f" stroke="#e0a21a" stroke-width="1.2"/><path d="M22 5.6v8.8M17.6 10h8.8M18.9 6.9l6.2 6.2M25.1 6.9l-6.2 6.2" stroke="#fff3b0" stroke-width="1"/>' +
    '<circle cx="10" cy="24" r="4.6" fill="#ffc93c" stroke="#d9901a" stroke-width="1.2"/><text x="10" y="26" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="5.6" fill="#a8640c">R$</text></svg>';
  var IC_SUNSET = '<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="5" fill="#fff4c8"/><path d="M12 4.5v2.2M5.3 7.3l1.5 1.5M18.7 7.3l-1.5 1.5M3 14h2.2M19 14h2.2" stroke="#fff4c8" stroke-width="1.8" stroke-linecap="round"/><rect x="2" y="15" width="20" height="7" fill="#ff8a6b"/><path d="M4 17.5h16M7 20h10" stroke="#fff4c8" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></svg>';
  var IC_LIA = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><circle cx="12" cy="13.2" r="6.2" fill="#e8a878"/><path d="M5.2 13c-.4-5 2.8-8.4 6.8-8.4s7.2 3.4 6.8 8.4c-1.6-2.4-4-3.6-6.8-3.6s-5.2 1.2-6.8 3.6z" fill="#e2463f"/><circle cx="9" cy="7.6" r=".8" fill="#fff"/><circle cx="13.6" cy="6.6" r=".8" fill="#fff"/><circle cx="16" cy="9" r=".8" fill="#fff"/>' +
    '<circle cx="9.6" cy="13.2" r="1.9" fill="none" stroke="#7a3b2a" stroke-width="1"/><circle cx="14.4" cy="13.2" r="1.9" fill="none" stroke="#7a3b2a" stroke-width="1"/><path d="M11.5 13.2h1" stroke="#7a3b2a" stroke-width="1"/><path d="M10 16.4q2 1.6 4 0" stroke="#a83b33" stroke-width="1" fill="none" stroke-linecap="round"/></svg>';
  var IC_COIN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#ffc93c" stroke="#d9901a" stroke-width="1.6"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="#fff0a8" stroke-width="1.2"/><text x="12" y="15.4" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="9" fill="#a8640c">R$</text></svg>';
  var COIN = '<svg viewBox="0 0 30 30"><ellipse cx="15" cy="16.4" rx="13.4" ry="13" fill="#c9861a"/><circle cx="15" cy="14.6" r="13.2" fill="#ffd23f"/><circle cx="15" cy="14.6" r="13.2" fill="none" stroke="#e8a21a" stroke-width="1.6"/><circle cx="15" cy="14.6" r="9.4" fill="none" stroke="#fff3b0" stroke-width="1.3"/><path d="M7 9.5a10 10 0 0 1 7-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".8"/><text x="15" y="18.6" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="700" font-size="10.5" fill="#a8640c">R$</text></svg>';

  /* potes ilustrados */
  function JAR(k) {
    var lid = ['#ff6f91', '#43c59e', '#4a8ff0'][k], lid2 = ['#e2507a', '#2fa883', '#3474d6'][k];
    var ic = [
      '<path d="M40 61.5c-5.6-4-9-7-9-10.6 0-2.4 1.8-4.2 4.1-4.2 1.9 0 3.6 1.2 4.9 3 1.3-1.8 3-3 4.9-3 2.3 0 4.1 1.8 4.1 4.2 0 3.6-3.4 6.6-9 10.6z" fill="#ff6f91"/>',
      '<ellipse cx="40" cy="55" rx="9.4" ry="7.2" fill="#ff9fb6"/><circle cx="46.6" cy="53.2" r="3.4" fill="#ff9fb6"/><ellipse cx="47.8" cy="53.6" rx="1.6" ry="1.3" fill="#f07a98"/><path d="M34.5 49.5l1.6-3.6 2.6 3" fill="#ff9fb6"/><rect x="36.2" y="60.4" width="2.8" height="3.6" rx="1" fill="#f07a98"/><rect x="42" y="60.4" width="2.8" height="3.6" rx="1" fill="#f07a98"/><circle cx="43" cy="51.8" r="1" fill="#5a2a3a"/><rect x="37.4" y="47.2" width="5.6" height="1.6" rx=".8" fill="#5a2a3a"/>',
      '<path d="M35.5 50.5v-1.6a4.5 4.5 0 0 1 9 0v1.6" stroke="#2f6fe0" stroke-width="2" fill="none"/><rect x="31.5" y="50" width="17" height="13.5" rx="3.6" fill="#4a8ff0"/><path d="M31.5 55h17" stroke="#2f6fe0" stroke-width="1.6"/><circle cx="40" cy="58.4" r="2" fill="#ffd23f"/>'
    ][k];
    var s = '<svg class="dialogo-js" viewBox="0 0 80 92">' +
      '<ellipse cx="40" cy="88" rx="26" ry="3.6" fill="#5a3a20" opacity=".16"/>' +
      '<path d="M18 22h44v4c4 4 6 9 6 16v34a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V42c0-7 2-12 6-16z" fill="#d9f0fb" opacity=".75"/>';
    // moedas dentro do pote (reveladas aos poucos)
    for (var i = 0; i < 4; i++) {
      var cy = 78 - i * 6.2, cx = 40 + (i % 2 ? 3 : -3);
      s += '<g class="dialogo-st" style="opacity:0"><ellipse cx="' + cx + '" cy="' + (cy + 1.6) + '" rx="13" ry="4.6" fill="#c9861a"/><ellipse cx="' + cx + '" cy="' + cy + '" rx="13" ry="4.6" fill="#ffd23f" stroke="#e8a21a" stroke-width="1.1"/><ellipse cx="' + cx + '" cy="' + cy + '" rx="8" ry="2.6" fill="none" stroke="#fff3b0" stroke-width="1"/></g>';
    }
    s += '<path d="M18 22h44v4c4 4 6 9 6 16v34a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V42c0-7 2-12 6-16z" fill="none" stroke="#8fb7c9" stroke-width="2.2"/>' +
      '<path d="M19 46v26" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8"/><path d="M20.5 36q1-4 3.5-6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".75"/>' +
      '<rect x="27" y="44" width="26" height="23" rx="6" fill="#fffaf0" stroke="' + lid + '" stroke-width="1.6"/>' + ic +
      '<rect x="15" y="11" width="50" height="12" rx="4" fill="' + lid + '"/><rect x="15" y="18" width="50" height="5" rx="2" fill="' + lid2 + '"/><rect x="34" y="13.6" width="12" height="2.6" rx="1.3" fill="#3a2a2a" opacity=".55"/>' +
      '</svg>';
    return s;
  }

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(20261115);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }

      var root = document.createElement('div'); root.className = 'dialogo-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0xf3a46c);
      var cv = renderer.domElement; cv.className = 'dialogo-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      var FOGC = new THREE.Color(0xf6b07e);
      scene.fog = new THREE.Fog(FOGC.getHex(), 30, 60);
      var camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 140);

      /* ----- materiais com rim light (dourado, mais forte no fim de tarde) ----- */
      var rimU = { uRimColor: { value: new THREE.Color(0xffc98a) }, uRimStr: { value: 0.55 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return 'dialogo-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : '') + (m.map ? 'm' : ''); };
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

      /* ----- céu de fim de tarde (gradiente + sol baixo) ----- */
      var SUN_DIR = new THREE.Vector3(-0.42, 0.075, -0.9).normalize();
      var skyMat = new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN_DIR } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform vec3 uSun; varying vec3 vDir;',
          'void main(){',
          ' vec3 d = normalize(vDir); float h = d.y;',
          ' vec3 hor = vec3(1.0,0.83,0.55), mid = vec3(1.0,0.62,0.45), top = vec3(0.80,0.50,0.70), zen = vec3(0.50,0.45,0.78);',
          ' vec3 c = mix(hor, mid, smoothstep(0.0,0.16,h));',
          ' c = mix(c, top, smoothstep(0.14,0.45,h));',
          ' c = mix(c, zen, smoothstep(0.45,0.95,h));',
          ' c = mix(c, vec3(0.96,0.69,0.49), smoothstep(0.0,-0.12,h));',
          ' float s = max(dot(d,uSun),0.0);',
          ' c += vec3(1.0,0.72,0.35) * (pow(s,6.0)*0.35 + pow(s,40.0)*0.35);',
          ' c = mix(c, vec3(1.0,0.97,0.82), smoothstep(0.9985,0.9992,s));',
          ' gl_FragColor = vec4(c,1.0);',
          '}'].join('\n'),
        side: THREE.BackSide, depthWrite: false, fog: false
      });
      var sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), skyMat); sky.renderOrder = -10; scene.add(sky);

      /* nuvens alongadas e rosadas (planos) */
      var cloudC = mkCanvas(256, 64, function (g, w, h) {
        g.clearRect(0, 0, w, h);
        var rr = rng(3);
        for (var k = 0; k < 14; k++) {
          var x = 30 + rr() * (w - 60), y = 28 + rr() * 14, r = 10 + rr() * 16;
          var gr = g.createRadialGradient(x, y, 1, x, y, r);
          gr.addColorStop(0, 'rgba(255,214,200,.95)'); gr.addColorStop(0.6, 'rgba(255,190,180,.7)'); gr.addColorStop(1, 'rgba(255,180,170,0)');
          g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); g.fill();
        }
      });
      var cloudT = keep(new THREE.CanvasTexture(cloudC));
      var clouds = [[-14, 7.5, -48, 26], [12, 10, -50, 30], [-30, 13, -40, 22], [26, 5.5, -46, 20]].map(function (q) {
        var m = new THREE.Mesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), new THREE.MeshBasicMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, opacity: 0.85 }));
        m.scale.set(q[3], q[3] * 0.25, 1); m.position.set(q[0], q[1], q[2]); m.lookAt(0, q[1], 0); m.renderOrder = -9; scene.add(m);
        return m;
      });

      /* ----- luzes: sol baixo, quente, de trás/esquerda (sombras longas) ----- */
      var hemi = new THREE.HemisphereLight(0xffc9a8, 0x7a4a6a, 0.62); scene.add(hemi);
      var sun = new THREE.DirectionalLight(0xffb066, 1.25);
      sun.position.set(-7.5, 3.6, -5.8); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -8.5; sc.right = 8.5; sc.top = 8.5; sc.bottom = -8.5; sc.near = 1; sc.far = 30;
      sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
      sun.target.position.set(0.3, 0, 0.3);
      scene.add(sun); scene.add(sun.target);
      var fill = new THREE.DirectionalLight(0xff9f8a, 0.42); fill.position.set(3, 4, 9); scene.add(fill);

      /* ----- chão: praça de paralelepípedos ----- */
      var cobC = mkCanvas(512, 512, function (g, w, h) {
        g.fillStyle = '#d6a888'; g.fillRect(0, 0, w, h);
        var rr = rng(11), cols = ['#f8e0c6', '#f2d2b3', '#fbe9d6', '#eecaa9', '#f5d9c0', '#f3d0bd'];
        var rows = 14, rh = h / rows;
        for (var r = 0; r < rows; r++) {
          var x = (r % 2) * -20, y = r * rh;
          while (x < w) {
            var cw = 34 + rr() * 22;
            g.fillStyle = cols[Math.floor(rr() * cols.length)];
            var x0 = x + 2.5, y0 = y + 2.5, ww = cw - 5, hh = rh - 5, rad = 9;
            for (var o = -1; o <= 1; o++) {
              g.beginPath();
              g.moveTo(x0 + rad + o * w, y0); g.arcTo(x0 + ww + o * w, y0, x0 + ww + o * w, y0 + hh, rad); g.arcTo(x0 + ww + o * w, y0 + hh, x0 + o * w, y0 + hh, rad); g.arcTo(x0 + o * w, y0 + hh, x0 + o * w, y0, rad); g.arcTo(x0 + o * w, y0, x0 + ww + o * w, y0, rad); g.closePath(); g.fill();
            }
            g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0 + 5, y0 + 3, ww - 10, 3);
            x += cw;
          }
        }
      });
      var cobT = keep(new THREE.CanvasTexture(cobC)); cobT.wrapS = cobT.wrapT = THREE.RepeatWrapping; cobT.repeat.set(17, 17);
      cobT.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      var GS = 52;
      var gg = new THREE.PlaneGeometry(GS, GS, 60, 60); gg.rotateX(-Math.PI / 2);
      // cor por vértice: praça clara no centro, grama morna nas bordas
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color(), cIn = new THREE.Color(0xffffff), cOut = new THREE.Color(0x9fbf5a), cMid = new THREE.Color(0xffe2c6);
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i), d = Math.sqrt(x * x * 0.7 + z * z);
        c.copy(cIn).lerp(cMid, 0.4 * sstep(1.5, 5, d)).lerp(cOut, sstep(8.5, 10.5, d));
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      var ground = new THREE.Mesh(gg, addRim(new THREE.MeshStandardMaterial({ map: cobT, vertexColors: true, roughness: 0.95 })));
      ground.receiveShadow = true; scene.add(ground);

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

      /* ----- blocos de encaixe (pinos hexagonais + chaves borboleta) ----- */
      var PINS = [], BOWS = [], FRUIT = [];
      var matPinFlat = {};
      function pinMat(col) { return matPinFlat[col] || (matPinFlat[col] = addRim(new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, flatShading: true }))); }
      var vtmp = new THREE.Vector3();
      function addPinL(g, x, y, z, col) { g.updateMatrixWorld(true); vtmp.set(x, y, z); g.localToWorld(vtmp); PINS.push({ x: vtmp.x, y: vtmp.y + 0.025, z: vtmp.z, ry: g.rotation.y, sx: 1, sy: 1, sz: 1, c: col }); }
      function addBowL(g, x, y, z, ry, col, s) { g.updateMatrixWorld(true); vtmp.set(x, y, z); g.localToWorld(vtmp); BOWS.push({ x: vtmp.x, y: vtmp.y, z: vtmp.z, ry: ry + g.rotation.y, sx: s || 1, sy: s || 1, sz: 1, c: col }); }
      function block(w, h, d, col, x, y, z, ry, parent, r) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, { roughness: 0.72 }));
        m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
        (parent || scene).add(m); return m;
      }
      var WOOD = 0xcd8d4e, WOOD2 = 0xc3803f, WOOD3 = 0xd89a5c, BEAM = 0x9a5f34, TEAL = 0x2fb5a3, PINC = 0xf2b968;

      /* caixote de frutas (bloco com ripas + pilha de frutas) */
      function crate(parent, x, y, z, ry, fruitCol, kind, w, d) {
        w = w || 0.5; d = d || 0.36;
        var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; parent.add(g);
        block(w, 0.24, d, WOOD3, 0, 0.12, 0, 0, g, 0.035);
        [-1, 1].forEach(function (sg) { block(w + 0.02, 0.05, 0.03, BEAM, 0, 0.07 + (sg + 1) * 0.06, d / 2 + 0.006, 0, g, 0.012).castShadow = false; });
        addPinL(g, -w / 2 + 0.06, 0.24, -d / 2 + 0.06, PINC); addPinL(g, w / 2 - 0.06, 0.24, -d / 2 + 0.06, PINC);
        g.updateMatrixWorld(true);
        var nx = Math.round(w / 0.11), nz = Math.round(d / 0.11);
        for (var a = 0; a < nx; a++) for (var b = 0; b < nz; b++) {
          var fx = -w / 2 + (a + 0.5) * w / nx + (R() - 0.5) * 0.02, fz = -d / 2 + (b + 0.5) * d / nz + (R() - 0.5) * 0.02;
          var heap = 0.04 * Math.sin((a + 0.5) / nx * Math.PI) * Math.sin((b + 0.5) / nz * Math.PI);
          vtmp.set(fx, 0.26 + heap, fz); g.localToWorld(vtmp);
          var col = fruitCol[Math.floor(R() * fruitCol.length)];
          if (kind === 'lemon') FRUIT.push({ x: vtmp.x, y: vtmp.y, z: vtmp.z, sx: 0.062, sy: 0.05, sz: 0.05, ry: R() * 3, c: col });
          else if (kind === 'grape') FRUIT.push({ x: vtmp.x, y: vtmp.y, z: vtmp.z, sx: 0.04, sy: 0.04, sz: 0.04, c: col });
          else FRUIT.push({ x: vtmp.x, y: vtmp.y + 0.005, z: vtmp.z, sx: 0.058, sy: 0.054, sz: 0.058, c: col });
        }
        if (kind === 'grape') { // segunda camada
          for (a = 0; a < 6; a++) { vtmp.set((R() - 0.5) * w * 0.6, 0.31, (R() - 0.5) * d * 0.5); g.localToWorld(vtmp); FRUIT.push({ x: vtmp.x, y: vtmp.y, z: vtmp.z, sx: 0.04, sy: 0.04, sz: 0.04, c: fruitCol[a % fruitCol.length] }); }
        }
        return g;
      }

      /* toldo listrado (textura gerada) */
      var awnT = {};
      function stripeTex(a, b) {
        var key = a + b;
        if (awnT[key]) return awnT[key];
        var cc = mkCanvas(128, 8, function (g, w, h) { for (var k = 0; k < 8; k++) { g.fillStyle = k % 2 ? b : a; g.fillRect(k * 16, 0, 16, h); } });
        var t = keep(new THREE.CanvasTexture(cc)); t.magFilter = THREE.LinearFilter;
        return (awnT[key] = t);
      }
      var gScal = G('scal', function () { var g = new THREE.CircleGeometry(1, 14, Math.PI, Math.PI); return g; });

      function stall(x, z, ry, cA, cB, goods, s) {
        var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s || 1); scene.add(g);
        var cw = 1.5, cd = 0.62;
        // balcão de blocos
        block(cw, 0.6, cd, WOOD2, 0, 0.3, 0, 0, g, 0.05);
        block(cw + 0.1, 0.07, cd + 0.12, WOOD3, 0, 0.635, 0.02, 0, g, 0.03);
        block(cw - 0.12, 0.42, 0.04, cA === '#fff6e6' ? 0x3fae6e : 0xfff1dc, 0, 0.3, cd / 2 + 0.01, 0, g, 0.02);
        [-0.5, 0, 0.5].forEach(function (px) { addPinL(g, px, 0.67, -0.24, PINC); });
        addBowL(g, -cw / 2 - 0.005, 0.45, 0.12, -Math.PI / 2, TEAL, 0.8); addBowL(g, cw / 2 + 0.005, 0.45, 0.12, Math.PI / 2, TEAL, 0.8);
        // postes
        [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) {
          var hh = q[1] > 0 ? 1.62 : 1.95;
          block(0.08, hh, 0.08, BEAM, q[0] * (cw / 2 + 0.02), hh / 2, q[1] * (cd / 2 + 0.06), 0, g, 0.025);
        });
        // toldo inclinado
        var awM = addRim(new THREE.MeshStandardMaterial({ map: stripeTex(cA, cB), roughness: 0.8, side: THREE.DoubleSide }));
        var aw = new THREE.Mesh(G('awn', function () { var p = new THREE.PlaneGeometry(1, 1, 1, 4); var pp = p.attributes.position; for (var k = 0; k < pp.count; k++) { var yy = pp.getY(k); pp.setZ(k, 0.06 * Math.sin((yy + 0.5) * Math.PI)); } p.computeVertexNormals(); return p; }), awM);
        aw.scale.set(cw + 0.36, 1.05, 1); aw.position.set(0, 1.83, 0.06); aw.rotation.x = -Math.PI / 2 + 0.36; aw.castShadow = true; aw.receiveShadow = true; g.add(aw);
        // franja recortada
        var n = 8;
        for (var k = 0; k < n; k++) {
          var sm = new THREE.Mesh(gScal, M(k % 2 ? cB : cA, { side: THREE.DoubleSide, roughness: 0.8 }));
          var fx = -(cw + 0.36) / 2 + (k + 0.5) * (cw + 0.36) / n;
          sm.scale.set((cw + 0.36) / n / 2, 0.1, 1); sm.position.set(fx, 1.66, 0.565); g.add(sm);
        }
        if (goods) goods(g);
        return g;
      }

      /* ----- cenário do mercado ----- */
      var FR_OR = [0xff8a1a, 0xff9a2a, 0xf57d12], FR_AP = [0xe8443a, 0xd93a3a, 0xf05a3a], FR_LE = [0xffe14a, 0xffd23f, 0xfff06a], FR_GR = [0x8a4fc4, 0x7a46b4, 0x9c62d4], FR_GN = [0x8bd14a, 0x7cc23f];
      // barraca da Dona Lia (verde e creme) atrás dela
      var liaStall = stall(1.18, -1.32, -0.08, '#fff6e6', '#3fae6e', function (g) {
        crate(g, -0.45, 0.67, 0.0, 0.05, FR_OR, 'or');
        crate(g, 0.08, 0.67, -0.02, -0.04, FR_AP, 'ap');
        crate(g, 0.55, 0.67, 0.02, 0.06, FR_LE, 'lemon', 0.4);
        crate(g, -0.5, 0, 0.62, 0.2, FR_GN, 'ap', 0.46, 0.34);
        crate(g, 0.2, 0, 0.66, -0.15, FR_GR, 'grape', 0.44, 0.32);
      });
      stall(-2.75, -2.9, 0.42, '#3a8ee6', '#fff3e6', function (g) {
        crate(g, -0.4, 0.67, 0, 0, FR_AP, 'ap'); crate(g, 0.3, 0.67, 0, 0, FR_GN, 'ap');
      });
      stall(3.05, -3.25, -0.4, '#ffb21a', '#ff6b3d', function (g) {
        crate(g, -0.4, 0.67, 0, 0, FR_GR, 'grape'); crate(g, 0.3, 0.67, 0, 0, FR_OR, 'or');
        crate(g, 0.45, 0, 0.62, 0.3, FR_LE, 'lemon', 0.42, 0.32);
      });
      stall(-3.7, 0.9, 1.25, '#ff6f91', '#fff3e6', function (g) { crate(g, -0.3, 0.67, 0, 0, FR_OR, 'or'); crate(g, 0.35, 0.67, 0, 0, FR_LE, 'lemon', 0.4); });
      stall(3.9, 0.35, -1.3, '#e8513f', '#fff3e6', function (g) { crate(g, -0.3, 0.67, 0, 0, FR_AP, 'ap'); crate(g, 0.35, 0.67, 0, 0, FR_GN, 'ap', 0.4); });

      // pilhas de caixotes soltos
      var loose = new THREE.Group(); scene.add(loose);
      crate(loose, 2.25, 0, -0.55, 0.4, FR_OR, 'or');
      crate(loose, 2.42, 0, -0.1, -0.2, FR_LE, 'lemon', 0.42, 0.32);
      crate(loose, -2.2, 0, -1.45, -0.3, FR_AP, 'ap');
      block(0.48, 0.24, 0.34, WOOD2, 2.3, 0.37, -0.52, 0.35, loose, 0.035);

      /* banca de limonada do herói */
      var lemon = new THREE.Group(); lemon.position.set(-1.42, 0, -0.8); lemon.rotation.y = 0.18; scene.add(lemon);
      block(0.92, 0.5, 0.5, WOOD3, 0, 0.25, 0, 0, lemon, 0.04);
      var cloth = new THREE.Mesh(rbox(0.98, 0.06, 0.56, 0.025), addRim(new THREE.MeshStandardMaterial({ map: stripeTex('#ffe14a', '#fffaf0'), roughness: 0.85 }))); cloth.position.set(0, 0.52, 0); cloth.castShadow = true; cloth.receiveShadow = true; lemon.add(cloth);
      block(0.9, 0.3, 0.035, 0xffe14a, 0, 0.3, 0.26, 0, lemon, 0.015);
      addPinL(lemon, -0.36, 0.55, -0.18, PINC); addPinL(lemon, 0.36, 0.55, -0.18, PINC);
      addBowL(lemon, -0.465, 0.3, 0.0, -Math.PI / 2, TEAL, 0.75); addBowL(lemon, 0.465, 0.3, 0.0, Math.PI / 2, TEAL, 0.75);
      // jarra de limonada
      var pitcherM = addRim(new THREE.MeshStandardMaterial({ color: 0xfff2a0, roughness: 0.2, transparent: true, opacity: 0.82, emissive: 0xffc94a, emissiveIntensity: 0.25 }));
      var pitcher = new THREE.Mesh(G('pitch', function () { return new THREE.CylinderGeometry(0.085, 0.1, 0.26, 16); }), pitcherM); pitcher.position.set(-0.18, 0.68, 0.02); pitcher.castShadow = true; lemon.add(pitcher);
      var handle = mesh(G('hand', function () { return new THREE.TorusGeometry(1, 0.22, 6, 12, Math.PI); }), M(0xfff6d8, { roughness: 0.3 }), 0.06, 0.07, 0.07, -0.08, 0.69, 0.02, lemon); handle.rotation.z = -Math.PI / 2;
      [0.04, 0.17].forEach(function (gx) { var gl = new THREE.Mesh(G('glass', function () { return new THREE.CylinderGeometry(0.045, 0.038, 0.11, 12); }), pitcherM); gl.position.set(gx, 0.61, 0.1); gl.castShadow = true; lemon.add(gl); });
      lemon.updateMatrixWorld(true);
      [[0.3, 0.58, -0.08], [0.36, 0.58, 0.02], [0.27, 0.58, 0.06], [0.33, 0.63, -0.02]].forEach(function (q) { vtmp.set(q[0], q[1], q[2]); lemon.localToWorld(vtmp); FRUIT.push({ x: vtmp.x, y: vtmp.y, z: vtmp.z, sx: 0.062, sy: 0.05, sz: 0.05, ry: R() * 3, c: 0xffe14a }); });
      // placa com um limão desenhado
      var signC = mkCanvas(128, 96, function (g, w, h) {
        g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#ffb21a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
        g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(64, 50, 28, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff3a8'; g.beginPath(); g.arc(64, 50, 21, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#ffd23f'; g.lineWidth = 3; for (var k = 0; k < 4; k++) { var a = k * Math.PI / 4; g.beginPath(); g.moveTo(64 - Math.cos(a) * 21, 50 - Math.sin(a) * 21); g.lineTo(64 + Math.cos(a) * 21, 50 + Math.sin(a) * 21); g.stroke(); }
      });
      var signT = keep(new THREE.CanvasTexture(signC));
      block(0.05, 0.62, 0.05, BEAM, 0.4, 0.82, -0.2, 0, lemon, 0.02);
      var sign = new THREE.Mesh(rbox(0.36, 0.27, 0.035, 0.02), M(0xfffaf0)); sign.position.set(0.4, 1.12, -0.17); sign.castShadow = true; lemon.add(sign);
      var signF = new THREE.Mesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), new THREE.MeshBasicMaterial({ map: signT, toneMapped: false })); signF.scale.set(0.32, 0.24, 1); signF.position.set(0.4, 1.12, -0.15); lemon.add(signF);

      /* casas em volta da praça (janelas acesas) */
      var STONE = 0xe7c9b0, STONE2 = 0xd9b89e;
      function house(x, z, ry, wall, roof, s) {
        var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g);
        var bw = 1.95, bd = 1.6;
        [[-0.5, -0.42], [0.5, -0.42], [-0.5, 0.42], [0.5, 0.42]].forEach(function (q, j) { block(bw / 2 - 0.02, 0.26, bd / 2 - 0.02, j % 3 ? STONE : STONE2, q[0] * bw / 2, 0.13, q[1] * bd / 2, 0, g); });
        block(1.6, 1.05, 1.25, wall, 0, 0.26 + 0.525, 0, 0, g, 0.08);
        [-1, 1].forEach(function (sg) { var p = block(1.9, 0.12, 0.92, roof, 0, 1.6, sg * 0.37, 0, g, 0.05); p.rotation.x = sg * 0.6; });
        var ridge = mesh(gCyl, M(0x9a3f2e), 0.08, 1.96, 0.08, 0, 1.86, 0, g); ridge.rotation.z = Math.PI / 2;
        var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.64, 0); sh.lineTo(0.64, 0); sh.lineTo(0, 0.5); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 1.56, bevelEnabled: false }); e.translate(0, 0, -0.78); e.rotateY(Math.PI / 2); return e; });
        mesh(tri, M(wall), 1, 1, 1, 0, 1.31, 0, g);
        block(0.4, 0.62, 0.08, 0x8e5632, -0.38, 0.26 + 0.32, 0.64, 0, g, 0.04);
        var winM = M(0xffd27a, { emissive: 0xffa53a, emissiveIntensity: 0.75, roughness: 0.3 });
        var w1 = new THREE.Mesh(rbox(0.38, 0.34, 0.06, 0.04), winM); w1.position.set(0.36, 0.86, 0.64); g.add(w1);
        block(0.46, 0.06, 0.12, 0xfffaf0, 0.36, 0.66, 0.66, 0, g, 0.025);
        block(0.06, 0.34, 0.07, 0xfffaf0, 0.36, 0.86, 0.665, 0, g, 0.02);
        block(0.44, 0.12, 0.14, 0x8e5632, 0.36, 0.6, 0.7, 0, g, 0.03);
        [0xff6f91, 0xffd23f, 0xffffff].forEach(function (fc, j) { ball(fc, 0.055, 0.23 + j * 0.13, 0.69, 0.72, g); });
        [-0.88, 0, 0.88].forEach(function (px) { [-0.72, 0.72].forEach(function (pz) { addPinL(g, px, 0.26, pz, 0xf3e3cf); }); });
        // casas ficam na borda: só as paredes e o telhado projetam sombra (menos chamadas de desenho)
        g.traverse(function (o) { if (o.isMesh) o.castShadow = false; });
        g.children[4].castShadow = true; g.children[5].castShadow = true; g.children[6].castShadow = true;
        return g;
      }
      house(-1.0, -5.6, 0.12, 0xffe6cc, 0xd9573b, 1.05);
      house(1.6, -6.2, -0.1, 0xfff1dc, 0x3aa5a8, 1.0);
      house(4.6, -5.2, -0.5, 0xffe6cc, 0xe9a23b, 1.0);
      house(-4.4, -4.6, 0.55, 0xfff1dc, 0x3aa5a8, 1.0);
      house(-6.4, -1.2, 1.2, 0xffe6cc, 0xd9573b, 1.0);
      house(6.4, -1.8, -1.2, 0xfff1dc, 0xd9573b, 1.0);

      /* árvores (copas aquecidas pelo pôr do sol) */
      var trunkL = [], canL = [];
      var canopyCols = [0x7fae4a, 0x8fbf4f, 0x6f9e44, 0xe8a23b, 0x9cc456];
      [[-1.7, 6.2, 1.0], [-2.7, 6.9, 1.05], [3.0, 5.6, 0.9], [4.4, 3.6, 0.85], [-2.6, -4.6, 1.05], [2.9, -4.9, 1.0], [0.3, -4.2, 0.85], [-5.6, 2.6, 1.1], [5.8, 3.2, 1.1], [-6.9, -4.2, 1.2], [7.2, -4.0, 1.2], [-5.0, -6.8, 1.1], [5.6, -7.2, 1.1], [-3.4, 4.8, 1.0], [4.0, 5.2, 0.95], [-7.6, 0.8, 1.1], [7.8, 0.4, 1.1]].forEach(function (t, j) {
        var s = t[2];
        trunkL.push({ x: t[0], y: 0.35 * s, z: t[1], sx: 0.11 * s, sy: 0.7 * s, sz: 0.11 * s });
        var cc = canopyCols[j % 5];
        tmpC.set(cc); var cDark = tmpC.clone().multiplyScalar(0.84).getHex(), cLight = tmpC.clone().lerp(new THREE.Color(0xffe2a0), 0.25).getHex();
        canL.push({ x: t[0], y: 1.05 * s, z: t[1], sx: 0.62 * s, sy: 0.56 * s, sz: 0.62 * s, c: cc });
        canL.push({ x: t[0] - 0.28 * s, y: 0.86 * s, z: t[1] + 0.16 * s, sx: 0.4 * s, sy: 0.36 * s, sz: 0.4 * s, c: cDark });
        canL.push({ x: t[0] + 0.22 * s, y: 1.4 * s, z: t[1] + 0.08 * s, sx: 0.36 * s, sy: 0.32 * s, sz: 0.36 * s, c: cLight });
      });
      instanced(gCyl, M(0x9a6038), trunkL, true);
      instanced(gSph, M(0xffffff, { roughness: 0.85 }), canL, true);

      /* chafariz de blocos no meio da praça */
      var FOUNT = new THREE.Vector3(2.85, 0, 2.6);
      (function () {
        var n = 10, rad = 0.92;
        for (var k = 0; k < n; k++) {
          var a = k / n * Math.PI * 2, bx = FOUNT.x + Math.cos(a) * rad, bz = FOUNT.z + Math.sin(a) * rad;
          block(0.6, 0.34, 0.26, k % 2 ? STONE : STONE2, bx, 0.17, bz, -a + Math.PI / 2, null, 0.05);
          PINS.push({ x: bx, y: 0.365, z: bz, ry: -a, sx: 1, sy: 1, sz: 1, c: 0xfff1dc });
        }
        var wat = new THREE.Mesh(gCyl, addRim(new THREE.MeshStandardMaterial({ color: 0x5cc6d8, roughness: 0.15, emissive: 0xff9a5a, emissiveIntensity: 0.18 })));
        wat.scale.set(rad - 0.08, 0.04, rad - 0.08); wat.position.set(FOUNT.x, 0.26, FOUNT.z); wat.receiveShadow = true; scene.add(wat);
        block(0.3, 0.9, 0.3, STONE, FOUNT.x, 0.55, FOUNT.z, 0.4, null, 0.06);
        var bowl = mesh(G('bowl', function () { return new THREE.CylinderGeometry(1, 0.55, 0.5, 18); }), M(STONE2), 0.38, 0.32, 0.38, FOUNT.x, 1.06, FOUNT.z);
        mesh(gCyl, M(0x7fd6e6, { roughness: 0.15, emissive: 0xffa060, emissiveIntensity: 0.2 }), 0.34, 0.02, 0.34, FOUNT.x, 1.15, FOUNT.z, null, true);
        ball(0xffc93c, 0.07, FOUNT.x, 1.28, FOUNT.z);
      })();
      var dropMat = new THREE.MeshBasicMaterial({ color: 0xdaf6ff, transparent: true, opacity: 0.85 });
      var drops = new THREE.InstancedMesh(gSphLo, dropMat, 16); drops.frustumCulled = false; scene.add(drops);
      /* barris e floreiras */
      function barrel(x, z) {
        var g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
        mesh(G('barrel', function () { return new THREE.CylinderGeometry(0.2, 0.18, 0.5, 14); }), M(WOOD2), 1, 1, 1, 0, 0.25, 0, g);
        [0.1, 0.4].forEach(function (yy) { mesh(G('band2', function () { return new THREE.TorusGeometry(0.2, 0.018, 5, 18); }), M(0x6a4a50, { roughness: 0.5 }), 1, 1, 1, 0, yy, 0, g).rotation.x = Math.PI / 2; });
        mesh(gCyl, M(WOOD3), 0.19, 0.02, 0.19, 0, 0.5, 0, g);
        return g;
      }
      barrel(-2.35, 2.05); barrel(-2.0, 2.4); barrel(2.05, 4.1);
      [[-1.05, 2.45], [3.0, -0.95], [-2.6, -0.4], [-1.3, 4.5]].forEach(function (q, j) {
        block(0.5, 0.26, 0.32, [0x3aa5a8, 0xe8684a, 0xffc93c, 0x3aa5a8][j], q[0], 0.13, q[1], 0.3 * j, null, 0.05);
        for (var k = 0; k < 5; k++) FRUIT.push({ x: q[0] - 0.18 + k * 0.09, y: 0.3 + (k % 2) * 0.04, z: q[1] + (k % 2 ? 0.05 : -0.05), sx: 0.06, sy: 0.05, sz: 0.06, c: [0xff6f91, 0xffffff, 0xffd23f, 0xff8a5c, 0xb48cff][(k + j) % 5] });
        for (k = 0; k < 4; k++) FRUIT.push({ x: q[0] - 0.14 + k * 0.095, y: 0.27, z: q[1] + 0.02, sx: 0.07, sy: 0.05, sz: 0.07, c: 0x5fae4a });
      });

      /* postes de luz com lanterna acesa */
      var lampGlow = [];
      [[-1.95, 1.35], [2.15, 1.55], [-0.2, -3.2]].forEach(function (q) {
        block(0.09, 2.1, 0.09, 0x6a4a50, q[0], 1.05, q[1], 0, null, 0.03);
        block(0.26, 0.08, 0.26, 0x4a3a4a, q[0], 0.04, q[1], 0, null, 0.03);
        mesh(gSph, M(0xfff0b0, { emissive: 0xffc04a, emissiveIntensity: 1.2, roughness: 0.3 }), 0.12, 0.15, 0.12, q[0], 2.2, q[1], null, true);
        mesh(G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); }), M(0x4a3a4a), 0.17, 0.13, 0.17, q[0], 2.38, q[1]);
        lampGlow.push(new THREE.Vector3(q[0], 2.2, q[1]));
      });

      /* bandeirolas e cordão de luzinhas */
      var flagGeo = G('flag', function () { var s = new THREE.Shape(); s.moveTo(-0.085, 0); s.lineTo(0.085, 0); s.lineTo(0, -0.2); s.closePath(); return new THREE.ShapeGeometry(s); });
      var FLAGS = [], BULBS = [];
      var flagCols = [0xff5a5a, 0xffd23f, 0x3fae6e, 0x3a8ee6, 0xff8a2a, 0xff6f91, 0x9c62d4];
      var strings = [];
      function stringLine(ax, az, bx, bz, hA, hB, sag, n, kind) {
        var pts = [];
        for (var k = 0; k <= 24; k++) { var u = k / 24; pts.push(new THREE.Vector3(lerp(ax, bx, u), lerp(hA, hB, u) - sag * 4 * u * (1 - u), lerp(az, bz, u))); }
        var crv = new THREE.CatmullRomCurve3(pts);
        var rope = new THREE.Mesh(new THREE.TubeGeometry(crv, 30, 0.012, 4, false), M(0x6b4a3a, { roughness: 0.9 })); scene.add(rope);
        var dir = Math.atan2(bz - az, bx - ax);
        for (k = 1; k < n; k++) {
          var u2 = k / n, p = crv.getPoint(u2);
          if (kind === 'flag') FLAGS.push({ x: p.x, y: p.y, z: p.z, ry: -dir, c: flagCols[(k + strings.length * 3) % flagCols.length], ph: k * 0.7 + strings.length });
          else BULBS.push({ x: p.x, y: p.y - 0.03, z: p.z, sx: 0.035, sy: 0.045, sz: 0.035, c: 0xfff1b8 });
        }
        strings.push(rope);
      }
      // mastros
      [[-3.3, -1.5], [3.4, -1.9], [-2.3, -3.9], [2.5, -4.2], [-3.0, 2.4], [3.2, 2.6]].forEach(function (q) {
        block(0.1, 2.8, 0.1, BEAM, q[0], 1.4, q[1], 0, null, 0.03);
        var tp = block(0.16, 0.08, 0.16, 0xffc93c, q[0], 2.84, q[1], 0, null, 0.03);
        PINS.push({ x: q[0], y: 2.905, z: q[1], ry: 0, sx: 1, sy: 1, sz: 1, c: 0xffd27a });
      });
      stringLine(-3.3, -1.5, 3.4, -1.9, 2.72, 2.72, 0.42, 20, 'flag');
      stringLine(-2.3, -3.9, 2.5, -4.2, 2.72, 2.72, 0.38, 16, 'flag');
      stringLine(-3.3, -1.5, 2.5, -4.2, 2.5, 2.5, 0.5, 22, 'bulb');
      stringLine(-2.3, -3.9, 3.4, -1.9, 2.5, 2.5, 0.5, 22, 'bulb');
      stringLine(-3.0, 2.4, 3.2, 2.6, 2.72, 2.72, 0.4, 18, 'flag');
      stringLine(-3.0, 2.4, -3.3, -1.5, 2.6, 2.6, 0.3, 12, 'bulb');
      stringLine(3.2, 2.6, 3.4, -1.9, 2.6, 2.6, 0.3, 12, 'bulb');
      var flagMesh = new THREE.InstancedMesh(flagGeo, addRim(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })), FLAGS.length);
      FLAGS.forEach(function (f, k) { flagMesh.setColorAt(k, tmpC.set(f.c)); });
      flagMesh.instanceColor.needsUpdate = true; flagMesh.castShadow = true; scene.add(flagMesh);
      instanced(gSphLo, new THREE.MeshBasicMaterial({ color: 0xffffff }), BULBS, false);
      // halos das luzinhas (viram "bokeh" no plano fechado)
      var haloC = mkCanvas(64, 64, function (g, w, h) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.35, 'rgba(255,214,140,.55)'); gr.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      var haloT = keep(new THREE.CanvasTexture(haloC));
      var haloMat = new THREE.MeshBasicMaterial({ map: haloT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.7 });
      var haloSrc = BULBS.map(function (b) { return new THREE.Vector3(b.x, b.y, b.z); }).concat(lampGlow);
      var halos = new THREE.InstancedMesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), haloMat, haloSrc.length); halos.frustumCulled = false; scene.add(halos);

      /* ----- personagens ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
        return e;
      }
      // HERÓI (idêntico à cena aprovada)
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
      var tuft = mesh(G('cone', function () { return new THREE.ConeGeometry(1, 1, 10); }), M(0x7a4426, { roughness: 0.6 }), 0.06, 0.16, 0.06, 0.03, 0.24, -0.02, hHead); tuft.rotation.z = -0.5;
      var hEyes = [eye(hHead, -0.078, 0.0, 0.17, 0.055), eye(hHead, 0.078, 0.0, 0.17, 0.055)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead, true); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead, true); hMouth.rotation.z = Math.PI;
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead);
      var hHand = new THREE.Object3D(); hHand.position.set(0, -0.32, 0); hArms[1].add(hHand);

      // DONA LIA (comerciante ~50 anos: lenço na cabeça, avental verde, óculos) — mesmo traço do Mestre Tomé
      var lia = new THREE.Group(), lB = new THREE.Group(); lia.add(lB); scene.add(lia);
      var LSKIN = 0xe9a877, LSKIN2 = 0xdc9567, BLOUSE = 0xffd27a, SKIRT = 0xc6533e, LAPRON = 0x3aa565, LAPRON2 = 0x2b8a52, SCARF = 0xe2463f;
      [-1, 1].forEach(function (sg) { mesh(gSph, M(0x6b3e22, { roughness: 0.55 }), 0.1, 0.075, 0.15, sg * 0.12, 0.06, 0.05, lB); });
      var skirt = mesh(G('skirt', function () { return new THREE.CylinderGeometry(0.26, 0.335, 0.6, 20); }), M(SKIRT, { roughness: 0.85 }), 1, 1, 1, 0, 0.4, 0, lB);
      mesh(G('skhem', function () { return new THREE.TorusGeometry(0.325, 0.022, 6, 24); }), M(0xffc93c), 1, 1, 1, 0, 0.13, 0, lB).rotation.x = Math.PI / 2;
      mesh(gSph, M(BLOUSE), 0.29, 0.33, 0.25, 0, 0.92, 0, lB);
      var lApron = mesh(G('apron', function () { return new THREE.CylinderGeometry(1, 1.08, 1, 18, 1, true, -1.05, 2.1); }), M(LAPRON, { side: THREE.DoubleSide, roughness: 0.85 }), 0.31, 0.62, 0.27, 0, 0.62, 0.02, lB);
      var lBib = new THREE.Mesh(rbox(0.27, 0.24, 0.05, 0.02), M(LAPRON, { roughness: 0.85 })); lBib.position.set(0, 1.03, 0.21); lBib.rotation.x = -0.28; lBib.castShadow = true; lB.add(lBib);
      var lPocket = new THREE.Mesh(rbox(0.22, 0.12, 0.04, 0.02), M(LAPRON2)); lPocket.position.set(0, 0.6, 0.32); lPocket.rotation.x = 0.1; lB.add(lPocket);
      mesh(gSph, M(0xffd23f, { roughness: 0.35 }), 0.04, 0.04, 0.015, 0.05, 0.66, 0.335, lB, true); // moedinha no bolso
      mesh(gCyl, M(LAPRON2), 0.3, 0.04, 0.26, 0, 0.86, 0.01, lB);
      [-1, 1].forEach(function (sg) { var st = new THREE.Mesh(rbox(0.04, 0.3, 0.03, 0.012), M(LAPRON2)); st.position.set(sg * 0.12, 1.16, 0.17); st.rotation.x = -0.45; lB.add(st); });
      var lArms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.31, 1.12, 0); lB.add(A);
        capsule(0.082, 0.1, BLOUSE, A);
        var fa = capsule(0.066, 0.18, LSKIN2, A); fa.position.y = -0.15;
        ball(LSKIN, 0.08, 0, -0.38, 0, A);
        return A;
      });
      var lHead = new THREE.Group(); lHead.position.set(0, 1.44, 0.02); lB.add(lHead);
      mesh(gSph, M(LSKIN, { roughness: 0.6 }), 0.2, 0.205, 0.195, 0, 0, 0, lHead);
      // cabelo grisalho aparecendo nas têmporas
      [-1, 1].forEach(function (sg) { mesh(gSph, M(0x8a7a76, { roughness: 0.7 }), 0.07, 0.1, 0.09, sg * 0.165, 0.0, -0.03, lHead); });
      // lenço com bolinhas
      var scarf = mesh(gHemi, M(SCARF, { roughness: 0.7 }), 0.228, 0.235, 0.228, 0, 0.02, -0.015, lHead); scarf.rotation.x = -0.38;
      mesh(G('band', function () { return new THREE.TorusGeometry(1, 0.13, 8, 26); }), M(0xc23a34, { roughness: 0.7 }), 0.205, 0.205, 0.24, 0, 0.07, 0.02, lHead).rotation.x = Math.PI / 2 - 0.35;
      var dots = [];
      for (var di = 0; di < 9; di++) {
        var th = -1.0 + (di % 3) * 1.0 + (di > 2 ? 0.45 : 0), ph = 0.35 + Math.floor(di / 3) * 0.45;
        var dx = Math.sin(th) * Math.sin(ph), dy = Math.cos(ph), dz = Math.cos(th) * Math.sin(ph);
        var dv = new THREE.Vector3(dx, dy, dz).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.38);
        if (dv.z > 0.55) continue;
        dots.push(mesh(gSphLo, M(0xfffaf0, { roughness: 0.7 }), 0.022, 0.022, 0.01, dv.x * 0.232, dv.y * 0.238 + 0.02, dv.z * 0.232 - 0.015, lHead, true));
        dots[dots.length - 1].lookAt(dv.x * 2, dv.y * 2 + 0.02, dv.z * 2);
      }
      // nó atrás com pontas
      ball(SCARF, 0.06, 0, 0.14, -0.2, lHead);
      [-1, 1].forEach(function (sg) { var tl = mesh(gSph, M(SCARF, { roughness: 0.7 }), 0.05, 0.11, 0.025, sg * 0.05, 0.04, -0.25, lHead); tl.rotation.z = sg * 0.4; tl.rotation.x = 0.4; });
      // rosto
      var lEyes = [eye(lHead, -0.07, 0.01, 0.17, 0.043), eye(lHead, 0.07, 0.01, 0.17, 0.043)];
      var gRim = G('rim', function () { return new THREE.TorusGeometry(1, 0.11, 6, 22); });
      var glassM = M(0x7a3b2a, { roughness: 0.4 });
      [-1, 1].forEach(function (sg) { mesh(gRim, glassM, 0.058, 0.052, 0.058, sg * 0.072, 0.012, 0.195, lHead, true); });
      mesh(gCyl, glassM, 0.008, 0.03, 0.008, 0, 0.022, 0.2, lHead, true).rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) { var ar = mesh(gCyl, glassM, 0.007, 0.15, 0.007, sg * 0.14, 0.02, 0.12, lHead, true); ar.rotation.x = Math.PI / 2; ar.rotation.z = sg * 0.35; });
      mesh(gSph, M(0xffffff, { transparent: true, opacity: 0.18, roughness: 0.1 }), 0.052, 0.046, 0.01, -0.072, 0.012, 0.198, lHead, true);
      mesh(gSph, M(0xffffff, { transparent: true, opacity: 0.18, roughness: 0.1 }), 0.052, 0.046, 0.01, 0.072, 0.012, 0.198, lHead, true);
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x6b5650), 0.042, 0.012, 0.015, sg * 0.072, 0.085, 0.185, lHead, true); bw.rotation.z = sg * -0.25; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff7f6a, { transparent: true, opacity: 0.55 }), 0.036, 0.021, 0.01, sg * 0.118, -0.05, 0.165, lHead, true); });
      ball(LSKIN2, 0.032, 0, -0.03, 0.2, lHead);
      var lMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.045, 0.034, 0.03, 0, -0.095, 0.18, lHead, true); lMouth.rotation.z = Math.PI;
      [-1, 1].forEach(function (sg) { ball(0xffc93c, 0.022, sg * 0.195, -0.07, 0.0, lHead, { roughness: 0.3, metalness: 0.3 }); });

      /* posições */
      var HERO_A = new THREE.Vector3(-1.05, 0, 0.55), HERO_B = new THREE.Vector3(-0.6, 0, 0.12);
      var LIA_P = new THREE.Vector3(0.62, 0, -0.02);
      hero.scale.setScalar(1.12); lia.scale.setScalar(1.12);
      lia.position.copy(LIA_P);

      /* sobras instanciadas */
      instanced(gSphLo, M(0xffffff, { roughness: 0.55 }), FRUIT, true);
      instanced(gHex, pinMat(0xffffff), PINS, true);
      instanced(gBow, M(0xffffff, { roughness: 0.5 }), BOWS, false);

      /* "véu" translúcido atrás dos personagens: desfoca o fundo no plano fechado */
      var veilC = mkCanvas(4, 128, function (g, w, h) { var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,190,140,0.0)'); gr.addColorStop(0.25, 'rgba(255,190,140,0.65)'); gr.addColorStop(0.75, 'rgba(255,200,150,0.75)'); gr.addColorStop(1, 'rgba(255,205,160,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      var veilT = keep(new THREE.CanvasTexture(veilC));
      var veil = new THREE.Mesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), new THREE.MeshBasicMaterial({ map: veilT, transparent: true, depthWrite: false, opacity: 0, fog: false }));
      veil.scale.set(14, 7, 1); scene.add(veil);

      /* faíscas douradas quando o exercício termina */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 22;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }), NSP);
      var spData = [], spCols = [0xfff27a, 0xffffff, 0xffc93c, 0xff9a6b];
      for (i = 0; i < NSP; i++) { spData.push({ a: (i / NSP) * Math.PI * 2 + R() * 0.3, up: 0.5 + R() * 0.8, r: 0.35 + R() * 0.45, s: 0.6 + R() * 0.7 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; scene.add(sparks);

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = 'dialogo-vig'; root.appendChild(vig);
      var glowEl = document.createElement('div'); glowEl.className = 'dialogo-glow'; root.appendChild(glowEl);
      var SVGNS = 'http://www.w3.org/2000/svg';
      var hud = document.createElement('div'); hud.className = 'dialogo-hud';
      hud.innerHTML =
        '<div class="dialogo-top dialogo-card"><div class="dialogo-ava">' + AVATAR + '<span class="dialogo-lv">4</span></div>' +
        '<div class="dialogo-stat"><div class="dialogo-ttl">Nível 4 · <span>Explorador</span></div>' +
        '<div class="dialogo-bar"><div class="dialogo-fill"></div><div class="dialogo-flash"></div></div>' +
        '<div class="dialogo-xpn"><span>Experiência</span><span><b class="dialogo-xpv">620</b> / 1000 XP</span></div></div>' +
        '<div class="dialogo-pause">' + IC_PAUSE + '</div></div>' +
        '<div class="dialogo-quest dialogo-card"><div class="dialogo-qi">' + IC_LEMON + '</div><div class="dialogo-qt"><b>Missão:</b> dividir o lucro da limonada</div></div>' +
        '<div class="dialogo-loc dialogo-card"><i>' + IC_SUNSET + '</i><span>Mercado<small>fim de tarde</small></span></div>' +
        '<div class="dialogo-btns">' +
        '<div class="dialogo-btn dialogo-card dialogo-pri"><i>' + IC_TALK + '</i>Conversar</div>' +
        '<div class="dialogo-btn dialogo-card"><i style="background:#fff0e0">' + IC_BAG + '</i>Mochila</div>' +
        '<div class="dialogo-btn dialogo-card"><i style="background:#e6f5dc">' + IC_MAP + '</i>Mapa</div></div>' +
        '<div class="dialogo-ex dialogo-card"><div class="dialogo-tag">' + IC_COIN + 'Finanças pessoais</div>' +
        '<div class="dialogo-q">Você ganhou <b>R$ 20</b> vendendo limonada. Como vai dividir?</div>' +
        '<div class="dialogo-done">' + IC_CHECK + '</div>' +
        '<div class="dialogo-jars">' +
        ['Doar', 'Poupar', 'Gastar'].map(function (n, k) { return '<div class="dialogo-jar">' + JAR(k) + '<div class="dialogo-amt" style="background:' + ['#ff6f91', '#2fb383', '#3f86ec'][k] + '">R$ ' + [2, 8, 10][k] + '</div><div class="dialogo-jl">' + n + '</div></div>'; }).join('') +
        '</div></div>' +
        '<div class="dialogo-bub dialogo-card"><div class="dialogo-tail"></div><div class="dialogo-nm">' + IC_LIA + 'Dona Lia</div><div class="dialogo-say">Primeiro a gratidão: separe a parte de <b>doar</b>!</div></div>' +
        '<div class="dialogo-xp">' + IC_XP + '+40 XP</div>';
      root.appendChild(hud);
      var q = function (s) { return hud.querySelector(s); };
      var elFill = q('.dialogo-fill'), elFlash = q('.dialogo-flash'), elXpv = q('.dialogo-xpv'), elBub = q('.dialogo-bub'), elXp = q('.dialogo-xp'),
        elQuest = q('.dialogo-quest'), elLoc = q('.dialogo-loc'), elBtns = q('.dialogo-btns'), elTalk = q('.dialogo-pri'), elEx = q('.dialogo-ex'), elDone = q('.dialogo-done'), elDoneSvg = elDone.querySelector('svg');
      var jars = Array.prototype.map.call(hud.querySelectorAll('.dialogo-jar'), function (j) {
        return { el: j, svg: j.querySelector('svg'), amt: j.querySelector('.dialogo-amt'), st: j.querySelectorAll('.dialogo-st') };
      });
      // moedas voando: [pote, atraso]
      var FLY = [[0, 0], [1, 0], [1, 0.09], [1, 0.18], [2, 0], [2, 0.08], [2, 0.16], [2, 0.24]];
      var JT = [2.72, 3.3, 3.88], FLT = 0.5;
      var coins = FLY.map(function (f, k) {
        var e = document.createElement('div'); e.className = 'dialogo-coin'; e.innerHTML = COIN; hud.appendChild(e);
        var idx = 0; for (var m = 0; m < k; m++) if (FLY[m][0] === f[0]) idx++;
        return { el: e, j: f[0], t0: JT[f[0]] + f[1], idx: idx };
      });
      var ctags = [0, 1, 2].map(function (k) { var e = document.createElement('div'); e.className = 'dialogo-ctag'; e.textContent = 'R$ ' + [2, 8, 10][k]; hud.appendChild(e); return e; });

      /* ----- wipe (íris em forma de moeda) ----- */
      var wipe = document.createElementNS(SVGNS, 'svg'); wipe.setAttribute('class', 'dialogo-wipe'); root.appendChild(wipe);
      var wipePath = document.createElementNS(SVGNS, 'path'); wipePath.setAttribute('fill', '#fff1dc'); wipePath.setAttribute('fill-rule', 'evenodd'); wipe.appendChild(wipePath);
      var wipeEdge = document.createElementNS(SVGNS, 'circle'); wipeEdge.setAttribute('fill', 'none'); wipeEdge.setAttribute('stroke', '#ffb21a'); wipeEdge.setAttribute('stroke-width', '7'); wipe.appendChild(wipeEdge);
      var wipeEdge2 = document.createElementNS(SVGNS, 'circle'); wipeEdge2.setAttribute('fill', 'none'); wipeEdge2.setAttribute('stroke', '#ffd23f'); wipeEdge2.setAttribute('stroke-width', '3'); wipeEdge2.setAttribute('stroke-dasharray', '2 7'); wipe.appendChild(wipeEdge2);
      wipe.style.display = 'none';

      /* ----- layout / câmera ----- */
      var S = 1, distHi = 25, distLo = 11, rootRect = null;
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H; camera.updateProjectionMatrix();
        var t = Math.tan(FOV / 2 * Math.PI / 180);
        distHi = camera.aspect < 0.8 ? (6.6 / 2) / (t * camera.aspect) : 6.8 / t;
        // plano fechado: dois personagens (~2,7 de largura) ocupando o meio da tela
        var needH = 2.05 / 0.37, needW = 2.5;
        distLo = Math.max(needH, needW / camera.aspect) / (2 * t);
        S = clamp(Math.min(W / 390, H / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        wipe.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        rootRect = null;
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);

      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion();
      function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }
      function rel(el) { var r = el.getBoundingClientRect(); if (!rootRect) rootRect = root.getBoundingClientRect(); return { x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height }; }
      var TGT_HI = new THREE.Vector3(0.25, 0, 0.55), TGT_LO = new THREE.Vector3(0.04, 0.84, 0.05), tgt = new THREE.Vector3();

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        rootRect = null;
        var s = t >= 5.6 ? t - LOOP : t; // 5,6–6,0 já mostra o início (atrás da transição)

        // câmera: zoom do plano alto até o plano médio (e começa a voltar no fim)
        var zin = inOut(clamp((s - 0.45) / 1.45, 0, 1));
        var zout = inOut(clamp((s - 4.95) / 0.9, 0, 1)) * 0.55;
        var z = zin * (1 - zout);
        var az = lerp(CAM_HI.az, CAM_LO.az, z) + (reduce ? 0 : Math.sin(wall * 0.35) * 0.012 * z);
        var el = lerp(CAM_HI.el, CAM_LO.el, z);
        var dist = Math.exp(lerp(Math.log(distHi), Math.log(distLo), z));
        tgt.lerpVectors(TGT_HI, TGT_LO, z);
        if (!reduce) tgt.y += Math.sin(wall * 0.6) * 0.01 * z;
        camera.position.set(tgt.x + dist * Math.sin(az) * Math.cos(el), tgt.y + dist * Math.sin(el), tgt.z + dist * Math.cos(az) * Math.cos(el));
        camera.lookAt(tgt);
        camera.updateMatrixWorld();
        sky.position.copy(camera.position);
        // névoa: no plano fechado o fundo se dissolve no tom do céu
        scene.fog.near = lerp(distHi + 6, distLo + 1.6, z);
        scene.fog.far = lerp(distHi + 34, distLo + 13, z);
        veil.position.set(camera.position.x * 0 + 0.1, 1.3, -1.25 - 0.4);
        veil.lookAt(camera.position.x, 1.3, camera.position.z);
        veil.material.opacity = 0.42 * sstep(0.55, 1, z);
        hemi.intensity = 0.62 + 0.08 * z;

        // herói: anda dois passos até a Dona Lia e vira para ela
        var wk = clamp((s - 0.15) / 1.15, 0, 1), we = inOut(wk);
        hero.position.lerpVectors(HERO_A, HERO_B, we);
        var walking = s > 0.15 && s < 1.3 ? sstep(0.15, 0.3, s) * (1 - sstep(1.1, 1.3, s)) : 0;
        var ph = (s - 0.15) * Math.PI * 2 * 1.7;
        var sw = Math.sin(ph) * 0.65 * walking;
        hLegs[0].rotation.x = sw; hLegs[1].rotation.x = -sw;
        hArms[0].rotation.set(-sw * 0.8, 0, -0.16); hArms[1].rotation.set(sw * 0.8, 0, 0.16);
        var bob = Math.abs(Math.cos(ph));
        hB.position.y = bob * 0.06 * walking;
        hB.rotation.z = Math.sin(ph) * 0.06 * walking;
        hB.rotation.x = 0.06 * walking;
        var breathe = Math.sin(wall * 2.4) * 0.012;
        var sq = 1 + (bob - 0.5) * 0.07 * walking + breathe;
        var dirWalk = Math.atan2(HERO_B.x - HERO_A.x, HERO_B.z - HERO_A.z);
        var faceLia = 0.9;
        var turn = sstep(0.9, 1.5, s);
        var cheer = sstep(4.42, 4.55, s) * (1 - sstep(5.15, 5.4, s));
        hero.rotation.y = lerp(lerp(0.55, dirWalk, walking > 0 ? 1 : 0) * (1 - turn) + faceLia * turn, 0.35, cheer);
        if (s < 0.15) hero.rotation.y = 0.55;
        // escuta (acena com a cabeça) e entrega as moedas
        var listen = sstep(1.9, 2.1, s) * (1 - sstep(2.6, 2.75, s));
        var give = sstep(2.55, 2.75, s) * (1 - sstep(4.25, 4.45, s));
        hHead.rotation.x = -0.12 + Math.sin(wall * 7) * 0.06 * listen + 0.12 * give;
        hHead.rotation.y = -0.1 * give;
        hHead.rotation.z = 0.1 * listen + 0.08 * cheer * Math.sin(wall * 9);
        var pulse = 0;
        JT.forEach(function (jt) { pulse = Math.max(pulse, s > jt - 0.06 && s < jt + 0.22 ? Math.sin((s - jt + 0.06) / 0.28 * Math.PI) : 0); });
        hArms[1].rotation.x -= give * (1.15 + pulse * 0.45); hArms[1].rotation.z += give * 0.1;
        hArms[0].rotation.x -= give * 0.25;
        var jump = s > 4.45 && s < 4.9 ? Math.sin((s - 4.45) / 0.45 * Math.PI) : 0;
        hB.position.y += jump * 0.3;
        var pre = s > 4.36 && s < 4.46 ? Math.sin((s - 4.36) / 0.1 * Math.PI) : 0;
        sq += jump * 0.1 - pre * 0.12;
        hSq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        hArms[0].rotation.x -= cheer * 0.5; hArms[1].rotation.x -= cheer * 0.5 * (1 - give);
        hArms[0].rotation.z -= cheer * (2.3 + Math.sin(wall * 20) * 0.15); hArms[1].rotation.z += cheer * (2.3 + Math.sin(wall * 20 + 1) * 0.15);
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + cheer * 1.4 + pulse * 0.6), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink);

        // Dona Lia: acena, fala com gestos, aponta para os potes, aplaude
        var wave = sstep(0.35, 0.6, s) * (1 - sstep(1.35, 1.6, s));
        var talk = sstep(1.85, 2.05, s) * (1 - sstep(2.7, 2.9, s));
        var point = sstep(2.7, 2.9, s) * (1 - sstep(4.3, 4.45, s));
        var clap = sstep(4.42, 4.55, s) * (1 - sstep(5.2, 5.45, s));
        lia.rotation.y = lerp(-0.2, -0.62, sstep(0.2, 1.2, s)) + 0.15 * clap;
        lB.position.y = Math.abs(Math.sin(wall * 2.0)) * 0.01 + clap * Math.max(0, Math.sin((s - 4.45) * 14)) * 0.035;
        lB.rotation.z = Math.sin(s * 7) * 0.035 * talk;
        var la = lArms[0], lr = lArms[1];
        la.rotation.set(0, 0, -0.14); lr.rotation.set(0, 0, 0.14);
        // aceno com a mão direita (lado de fora)
        lr.rotation.z += wave * (2.5 + Math.sin(wall * 14) * 0.3); lr.rotation.x -= wave * 0.2;
        // fala: mão no peito (gratidão) e a outra gesticulando
        la.rotation.x -= talk * 1.25; la.rotation.z += talk * 0.75;
        lr.rotation.x -= talk * (0.9 + Math.sin(s * 9) * 0.2); lr.rotation.z += talk * 0.35;
        // aponta para os potes
        lr.rotation.x -= point * (0.9 + 0.08 * Math.sin(wall * 4)); lr.rotation.z += point * 0.2;
        la.rotation.x -= point * 0.3;
        // aplaude
        var cl = Math.sin(wall * 18) * 0.12;
        la.rotation.x -= clap * 1.3; la.rotation.z += clap * (0.65 + cl); lr.rotation.x -= clap * 1.3; lr.rotation.z -= clap * (0.65 + cl);
        lHead.rotation.x = -0.12 + Math.sin(s * 11) * 0.05 * talk + 0.18 * point - 0.1 * clap;
        lHead.rotation.z = 0.1 * talk + 0.05 * Math.sin(wall * 1.3) - 0.08 * wave;
        lHead.rotation.y = 0.15 * talk;
        var lsq = 1 + Math.sin(s * 11) * 0.02 * talk + Math.sin(wall * 2.2) * 0.008;
        lB.scale.set(1 / Math.sqrt(lsq), lsq, 1 / Math.sqrt(lsq));
        lMouth.scale.set(0.045, 0.034 * (1 + talk * (0.6 + 0.7 * Math.sin(s * 22)) + clap * 0.9 + wave * 0.4), 0.03);
        var bl2 = (wall + 1.4) % 3.7, blink2 = bl2 < 0.12 ? Math.abs(Math.cos(bl2 / 0.12 * Math.PI)) : 1;
        lEyes[0].scale.y = lEyes[1].scale.y = Math.max(0.1, blink2) * (1 - 0.3 * clap);

        // gotas do chafariz
        for (i = 0; i < 16; i++) {
          var dk = (wall * 0.9 + i / 16) % 1, da = i * 2.4;
          dummy.position.set(FOUNT.x + Math.cos(da) * (0.12 + dk * 0.32), 1.3 + 0.25 * Math.sin(dk * Math.PI) - dk * 1.0, FOUNT.z + Math.sin(da) * (0.12 + dk * 0.32));
          dummy.scale.setScalar(0.028 * (1 - dk * 0.4)); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); drops.setMatrixAt(i, dummy.matrix);
        }
        drops.instanceMatrix.needsUpdate = true;
        // bandeirolas ao vento
        for (var i = 0; i < FLAGS.length; i++) {
          var f = FLAGS[i];
          dummy.position.set(f.x, f.y, f.z); dummy.rotation.set(0.25 * Math.sin(wall * 2.6 + f.ph) + 0.15, f.ry, 0.05 * Math.sin(wall * 3.1 + f.ph)); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
          flagMesh.setMatrixAt(i, dummy.matrix);
        }
        flagMesh.instanceMatrix.needsUpdate = true;
        // halos/bokeh das luzinhas (maiores no plano fechado)
        camQ.copy(camera.quaternion);
        for (i = 0; i < haloSrc.length; i++) {
          var hs = haloSrc[i], big = i >= BULBS.length ? 1.6 : 1;
          dummy.position.copy(hs); dummy.quaternion.copy(camQ);
          var tw = 0.85 + 0.15 * Math.sin(wall * 3 + i * 1.7);
          dummy.scale.setScalar((0.32 + 0.55 * z) * big * tw); dummy.updateMatrix(); halos.setMatrixAt(i, dummy.matrix);
        }
        halos.instanceMatrix.needsUpdate = true;
        haloMat.opacity = 0.55 + 0.25 * z;
        clouds.forEach(function (cm, k) { cm.position.x += Math.sin(wall * 0.05 + k) * 0.0; });

        // faíscas ao concluir
        var sk = clamp((s - 4.42) / 0.8, 0, 1), sOn = s > 4.42 && sk < 1;
        var cen = new THREE.Vector3(0.0, 2.05, -0.1);
        for (i = 0; i < NSP; i++) {
          var sd = spData[i];
          if (!sOn) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else {
            var ee = outCubic(sk), rr = sd.r * ee * 1.6;
            dummy.position.set(cen.x + Math.cos(sd.a) * rr, cen.y + sd.up * ee * 0.8 - sk * sk * 0.5 + Math.sin(sd.a) * rr * 0.5, cen.z + 0.3);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, sk * 1.3) * Math.PI) * 1.05 + 0.0001);
          }
          dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 4 + sd.a);
          dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;

        /* ----- HUD ----- */
        // modo exploração -> modo diálogo
        var hudOut = sstep(0.55, 1.15, s) * (1 - sstep(5.0, 5.5, s));
        elBtns.style.transform = 'translateY(' + (hudOut * 140).toFixed(1) + '%)';
        elBtns.style.opacity = (1 - hudOut * 0.9).toFixed(3);
        elQuest.style.transform = 'translateX(' + (-hudOut * 115).toFixed(1) + '%)';
        elLoc.style.transform = 'translateX(' + (hudOut * 120).toFixed(1) + '%)';
        elTalk.style.transform = 'translateY(' + (-3 * S * Math.max(0, Math.sin(wall * 5)) * (1 - sstep(0.3, 0.55, s))).toFixed(2) + 'px)';
        glowEl.style.opacity = (z * 0.9).toFixed(3);
        var exIn = clamp((s - 1.35) / 0.55, 0, 1), exOut = sstep(5.0, 5.45, s);
        var exY = (1 - (exIn > 0 ? outBack(exIn, 1.4) : 0)) * 130 + exOut * 130;
        elEx.style.transform = 'translateY(' + exY.toFixed(2) + '%)';

        // moedas: saem da mão do herói e caem nos potes
        hHand.updateMatrixWorld(true);
        hHand.getWorldPosition(v3); var hp = proj(v3.x, v3.y, v3.z);
        var cs = 34 * S;
        var jr = jars.map(function (j) { return rel(j.svg); });
        coins.forEach(function (cn) {
          var k = (s - cn.t0) / FLT;
          if (k <= 0 || k >= 1) { cn.el.style.opacity = 0; return; }
          var J = jr[cn.j];
          var ex = J.x + J.w / 2 + (cn.idx % 2 ? 6 : -6) * S - cs / 2, ey = J.y + J.h * 0.18 - cs / 2;
          var sx = hp.x - cs / 2, sy = hp.y - cs / 2;
          var e = k * k * (3 - 2 * k);
          var x = lerp(sx, ex, e), y = lerp(sy, ey, k * k) - Math.sin(Math.PI * k) * 90 * S;
          var spin = Math.cos(k * Math.PI * 4);
          cn.el.style.opacity = Math.min(1, k * 6).toFixed(3);
          cn.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (Math.max(0.25, Math.abs(spin))).toFixed(3) + ',1) scale(' + (1.15 - 0.3 * k).toFixed(3) + ')';
        });
        ctags.forEach(function (tg, k) {
          var kk = (s - JT[k]) / (FLT + 0.25);
          if (kk <= 0 || kk >= 1) { tg.style.opacity = 0; return; }
          var J = jr[k];
          var ex = J.x + J.w / 2, ey = J.y - 6 * S;
          var x = lerp(hp.x, ex, kk * kk * (3 - 2 * kk)), y = lerp(hp.y - 30 * S, ey, kk) - Math.sin(Math.PI * kk) * 110 * S;
          tg.style.opacity = (Math.min(1, kk * 6) * (1 - sstep(0.75, 1, kk))).toFixed(3);
          tg.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
        });
        jars.forEach(function (j, k) {
          var nIn = 0, landT = 99;
          coins.forEach(function (cn) { if (cn.j === k && s > cn.t0 + FLT) { nIn++; landT = Math.min(landT, cn.t0 + FLT); } });
          var lastLand = 0; coins.forEach(function (cn) { if (cn.j === k && s > cn.t0 + FLT) lastLand = Math.max(lastLand, cn.t0 + FLT); });
          var nStack = [1, 2, 4][k];
          var show = Math.min(nStack, Math.round(nIn / [1, 3, 4][k] * nStack));
          for (var m = 0; m < j.st.length; m++) j.st[m].style.opacity = m < show ? 1 : 0;
          var bump = lastLand && s - lastLand < 0.22 ? Math.sin((s - lastLand) / 0.22 * Math.PI) : 0;
          j.svg.style.transform = 'scale(' + (1 + bump * 0.08).toFixed(3) + ',' + (1 - bump * 0.06).toFixed(3) + ')';
          j.svg.style.transformOrigin = '50% 100%';
          var ak = landT < 99 ? clamp((s - landT) / 0.28, 0, 1) : 0;
          j.amt.style.transform = 'scale(' + (ak > 0 ? outBack(ak, 2.6) : 0).toFixed(3) + ')';
          var lit = landT < 99 ? (1 - sstep(landT + 0.1, landT + 0.7, s)) : 0;
          j.el.style.background = lit > 0.01 ? 'rgba(255,' + Math.round(239 - 30 * lit) + ',' + Math.round(223 - 90 * lit) + ',1)' : '#f8efdf';
        });
        var done = sstep(4.38, 4.5, s);
        elDone.style.background = done > 0.5 ? '#43c59e' : 'transparent';
        elDone.style.borderColor = done > 0.5 ? '#43c59e' : '#e3d6bf';
        elDone.style.transform = 'scale(' + (1 + 0.4 * Math.sin(Math.PI * clamp((s - 4.38) / 0.28, 0, 1))).toFixed(3) + ')';
        elDoneSvg.style.opacity = done;

        // XP
        var xpK = sstep(4.55, 5.0, s);
        elFill.style.width = (62 + 4 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(620 + 40 * xpK);
        var fl2 = clamp((s - 4.6) / 0.5, 0, 1);
        elFlash.style.opacity = s > 4.6 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elFlash.style.left = (fl2 * 70) + '%';
        var xk = clamp((s - 4.45) / 0.85, 0, 1);
        var exR = rel(elEx);
        elXp.style.opacity = s > 4.45 ? (xk < 0.12 ? xk / 0.12 : 1 - sstep(0.7, 1, xk)).toFixed(3) : 0;
        elXp.style.transform = 'translate(' + (W / 2).toFixed(1) + 'px,' + (exR.y - 18 * S - 60 * S * outCubic(xk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.2 ? outBack(xk / 0.2, 2.4) : 1).toFixed(3) + ')';

        // balão da Dona Lia (acima dela, ponta para baixo)
        var bIn = clamp((s - 1.85) / 0.32, 0, 1), bOut = sstep(4.3, 4.55, s);
        var bsc = (bIn > 0 ? outBack(bIn, 2.2) : 0) * (1 - bOut * 0.25);
        lHead.updateMatrixWorld(true); lHead.getWorldPosition(v3);
        var lp = proj(v3.x, v3.y + 0.42, v3.z);
        var bw2 = elBub.offsetWidth || 236, bh2 = elBub.offsetHeight || 90;
        var topMin = rel(q('.dialogo-top')); var minTop = topMin.y + topMin.h + 18 * S;
        var left = clamp(lp.x - bw2 * 0.62, 10 * S, W - bw2 - 10 * S);
        var topB = Math.max(minTop, lp.y - bh2 - 12 * S);
        var tx2 = clamp(lp.x - left, 22 * S, bw2 - 22 * S);
        elBub.style.setProperty('--tx', tx2.toFixed(1) + 'px');
        elBub.style.transformOrigin = tx2.toFixed(0) + 'px 100%';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 2.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, bsc).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 3) * (1 - bOut)).toFixed(3);

        // transição em íris de moeda que fecha no herói e reabre
        var ik = t < 5.6 ? sstep(5.3, 5.6, t) : 1 - sstep(5.6, 6.0, t);
        if (ik <= 0.002) { wipe.style.display = 'none'; }
        else {
          wipe.style.display = 'block';
          hHead.getWorldPosition(v3); var hpp = proj(v3.x, v3.y - 0.2, v3.z);
          var maxR = Math.sqrt(W * W + H * H) * 1.05, rad = Math.max(0, maxR * (1 - ik));
          var circ = 'M' + (hpp.x - rad).toFixed(1) + ' ' + hpp.y.toFixed(1) + 'a' + rad.toFixed(1) + ' ' + rad.toFixed(1) + ' 0 1 0 ' + (2 * rad).toFixed(1) + ' 0a' + rad.toFixed(1) + ' ' + rad.toFixed(1) + ' 0 1 0 ' + (-2 * rad).toFixed(1) + ' 0Z';
          wipePath.setAttribute('d', 'M-10 -10H' + (W + 10) + 'V' + (H + 10) + 'H-10Z' + (rad > 0.5 ? circ : ''));
          [wipeEdge, wipeEdge2].forEach(function (ce, k) { ce.setAttribute('cx', hpp.x.toFixed(1)); ce.setAttribute('cy', hpp.y.toFixed(1)); ce.setAttribute('r', Math.max(0, rad - k * 9).toFixed(1)); ce.style.display = rad > 12 ? '' : 'none'; });
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
