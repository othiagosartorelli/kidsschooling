/* SANTUÁRIO AO AMANHECER — KidsSchooling (variação do estilo aprovado "combinado")
   Mesmo herói, mesmos blocos de encaixe (pinos hexagonais + chaves borboleta), mesmo HUD em cartões creme.
   Muda: paleta de amanhecer (lilás → pêssego → dourado), névoa no vale, raios de sol aditivos, orvalho, pássaros;
   câmera desce devagar do enquadramento alto da exploração até o banco onde o herói lê a Bíblia ao lado do Vovô Elias.
   Exercício: memorizar o Salmo 119:105, com lacunas que se preenchem pela voz. Loop de 7 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'santuario';
  var LOOP = 7.0, CUT = 6.6;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function pulse(a, b, x) { return x > a && x < b ? Math.sin((x - a) / (b - a) * Math.PI) : 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var FOV = 30;
  /* colina: platô elíptico que desce para o vale */
  var PRX = 6.4, PRZ = 8.8, PCZ = -2.8;
  function plateau(x, z) { var dx = x / PRX, dz = (z - PCZ) / PRZ; return Math.sqrt(dx * dx + dz * dz); }
  function hillH(x, z) {
    var e = plateau(x, z);
    var y = 0.06 * Math.sin(x * 0.7 + z * 0.4) * Math.cos(z * 0.6 - x * 0.3) + 0.12 * (1 - e) ;
    y -= 4.2 * sstep(0.92, 1.45, e);
    return y;
  }
  var WORDS = [['Lâmpada', 2.7], ['pés', 3.35], ['luz', 4.0], ['caminho', 4.65]];

  /* ---------- HUD ---------- */
  var CSS = [
    '.santuario-root{position:absolute;inset:0;overflow:hidden;background:#f6cdb8;-webkit-user-select:none;user-select:none;}',
    '.santuario-root canvas.santuario-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.santuario-vig{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(214,180,240,.38) 0%,rgba(255,196,170,.18) 26%,rgba(255,220,180,0) 46%),radial-gradient(120% 80% at 50% 45%,rgba(255,240,220,0) 55%,rgba(110,70,140,.26) 100%);}',
    '.santuario-glow{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(90% 70% at 50% 45%,#fffaf0 0%,#ffeccc 55%,#f8d2bf 100%);}',
    '.santuario-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.santuario-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(140,90,80,.10),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(110,60,70,.20);}',
    '.santuario-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));}',
    '.santuario-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.santuario-ava svg{display:block;width:100%;height:100%;}',
    '.santuario-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.santuario-stat{flex:1;min-width:0;}',
    '.santuario-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.santuario-ttl span{color:#8a5cc8;}',
    '.santuario-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#f1e6da;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(100,60,40,.16);overflow:hidden;}',
    '.santuario-fill{position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:99px;background:linear-gradient(90deg,#f3b64a,#9ad66a);}',
    '.santuario-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.santuario-flash{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.santuario-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#7b6f6e;font-variant-numeric:tabular-nums;}',
    '.santuario-xpn b{color:#2a3350;font-weight:800;}',
    '.santuario-pause{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#f3e8e0;display:grid;place-items:center;}',
    '.santuario-pause svg{width:46%;height:46%;}',
    '.santuario-quest{position:absolute;left:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(8px*var(--s));padding:calc(7px*var(--s)) calc(10px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));max-width:calc(214px*var(--s));}',
    '.santuario-qi{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#f1e8ff;display:grid;place-items:center;}',
    '.santuario-qi svg{width:82%;height:82%;}',
    '.santuario-qt{font-weight:700;font-size:calc(13.5px*var(--s));line-height:1.18;color:#3a4260;}',
    '.santuario-qt b{font:600 calc(13.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#8a5cc8;}',
    '.santuario-chk{flex:none;width:calc(20px*var(--s));height:calc(20px*var(--s));border-radius:50%;border:calc(2px*var(--s)) solid #e2d6cf;display:grid;place-items:center;box-sizing:border-box;}',
    '.santuario-chk svg{width:80%;height:80%;opacity:0;}',
    '.santuario-time{position:absolute;right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 84px*var(--s));display:flex;align-items:center;gap:calc(6px*var(--s));padding:calc(7px*var(--s)) calc(11px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));}',
    '.santuario-ti{flex:none;width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(11px*var(--s));background:#ffeedd;display:grid;place-items:center;}',
    '.santuario-ti svg{width:84%;height:84%;}',
    '.santuario-tt{font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a4260;}',
    '.santuario-tt small{display:block;font:700 calc(11.5px*var(--s))/1.1 "Nunito Sans",system-ui,sans-serif;color:#c0763a;margin-top:calc(2px*var(--s));}',
    '.santuario-bub{position:absolute;left:0;top:0;width:calc(196px*var(--s));padding:calc(16px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;transform-origin:0 100%;}',
    '.santuario-bub .santuario-tail{position:absolute;bottom:calc(-9px*var(--s));left:var(--tx,24px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));box-shadow:calc(4px*var(--s)) calc(4px*var(--s)) calc(8px*var(--s)) rgba(110,60,70,.14);}',
    '.santuario-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#d9c6ff;color:#4a2f7a;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(90,50,140,.22);}',
    '.santuario-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.santuario-say{position:relative;font-weight:700;font-size:calc(15px*var(--s));line-height:1.25;color:#2a3350;}',
    '.santuario-say b{color:#8a5cc8;}',
    '.santuario-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(5px*var(--s)) calc(12px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:#fffaf0;box-shadow:0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(110,60,70,.25);font:600 calc(19px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#1f9e6e;}',
    '.santuario-xp svg{width:calc(22px*var(--s));height:calc(22px*var(--s));}',
    /* cartão do versículo */
    '.santuario-vs{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px + 82px*var(--s));padding:calc(11px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;}',
    '.santuario-vh{display:flex;align-items:center;justify-content:space-between;gap:calc(8px*var(--s));}',
    '.santuario-tag{display:inline-flex;align-items:center;gap:calc(5px*var(--s));padding:calc(4px*var(--s)) calc(10px*var(--s)) calc(4px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#f1e8ff;color:#6a3fb0;font:600 calc(13px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;}',
    '.santuario-tag svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.santuario-dots{display:flex;gap:calc(5px*var(--s));align-items:center;}',
    '.santuario-dots i{width:calc(9px*var(--s));height:calc(9px*var(--s));border-radius:50%;background:#ece2d8;display:inline-block;}',
    '.santuario-vt{margin:calc(9px*var(--s)) calc(1px*var(--s)) 0;font:500 calc(18.5px*var(--s))/1.5 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a3550;text-wrap:pretty;}',
    '.santuario-sl{position:relative;display:inline-block;padding:0 calc(3px*var(--s));margin:0 calc(1px*var(--s));border-radius:calc(7px*var(--s));line-height:1.2;}',
    '.santuario-sl:after{content:"";position:absolute;left:calc(2px*var(--s));right:calc(2px*var(--s));bottom:calc(-2px*var(--s));border-bottom:calc(2.4px*var(--s)) dashed #c9b6ea;}',
    '.santuario-sl b{font-weight:600;color:#b56a12;opacity:0;display:inline-block;}',
    '.santuario-ref{margin-top:calc(2px*var(--s));text-align:right;font:700 calc(13px*var(--s))/1.2 "Nunito Sans",system-ui,sans-serif;color:#8a7f9e;}',
    '.santuario-mic{display:flex;align-items:center;gap:calc(10px*var(--s));margin-top:calc(7px*var(--s));padding:calc(7px*var(--s)) calc(10px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));border-radius:calc(14px*var(--s));background:#f8f1ff;}',
    '.santuario-mb{position:relative;flex:none;width:calc(38px*var(--s));height:calc(38px*var(--s));border-radius:50%;background:linear-gradient(160deg,#b99cff,#ffb38a);display:grid;place-items:center;}',
    '.santuario-mb svg{width:56%;height:56%;position:relative;}',
    '.santuario-mr{position:absolute;inset:0;border-radius:50%;border:calc(2px*var(--s)) solid #b99cff;opacity:0;}',
    '.santuario-ml{flex:1;min-width:0;font:600 calc(14px*var(--s))/1.15 "Fredoka","Baloo 2",system-ui,sans-serif;color:#6a3fb0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.santuario-wv{flex:none;display:flex;align-items:center;gap:calc(3px*var(--s));height:calc(26px*var(--s));}',
    '.santuario-wv i{display:block;width:calc(4px*var(--s));height:calc(6px*var(--s));border-radius:99px;background:#b99cff;}',
    /* botões */
    '.santuario-btns{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:calc(10px*var(--s));}',
    '.santuario-btn{flex:1;height:calc(72px*var(--s));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(4px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.santuario-btn i{width:calc(36px*var(--s));height:calc(36px*var(--s));border-radius:calc(12px*var(--s));display:grid;place-items:center;}',
    '.santuario-btn i svg{width:76%;height:76%;}',
    '.santuario-btn.santuario-pri{background:linear-gradient(180deg,#ff9b3d,#ff7a1a);color:#fff;box-shadow:0 0 0 calc(1px*var(--s)) rgba(160,70,0,.15),0 calc(6px*var(--s)) calc(16px*var(--s)) rgba(200,90,0,.3);}',
    '.santuario-btn.santuario-pri i{background:rgba(255,255,255,.22);}'
  ].join('\n');

  var AVATAR = '<svg viewBox="0 0 64 64"><defs><linearGradient id="santuario-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="santuario-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
    '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#santuario-avbg)"/>' +
    '<g clip-path="url(#santuario-avc)">' +
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
  var IC_PAUSE = '<svg viewBox="0 0 20 20"><rect x="4.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f6e"/><rect x="11.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f6e"/></svg>';
  var IC_CHECK = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_XP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_BOOK = '<svg viewBox="0 0 32 32"><path d="M16 9.5C13 7.2 8.8 6.6 4.5 7.2v16.5c4.3-.6 8.5 0 11.5 2.3 3-2.3 7.2-2.9 11.5-2.3V7.2c-4.3-.6-8.5 0-11.5 2.3z" fill="#8a5cc8"/><path d="M16 9.6c-2.6-2-6-2.6-9.6-2.2v14.7c3.6-.4 7 .2 9.6 2.2z" fill="#fffaf0"/><path d="M16 9.6c2.6-2 6-2.6 9.6-2.2v14.7c-3.6-.4-7 .2-9.6 2.2z" fill="#fff3dc"/>' +
    '<path d="M9 12h4.5M9 15h4.5M9 18h3.5M19 12h4M19 15h4M19 18h3" stroke="#d9c6ff" stroke-width="1.3" stroke-linecap="round"/><path d="M20.5 4.5v7l1.6-1.3 1.6 1.3v-7" fill="#f3b64a"/></svg>';
  var IC_HEART = '<svg viewBox="0 0 32 32"><path d="M16 27s-10-6.2-10-13.2A5.6 5.6 0 0 1 16 10.4a5.6 5.6 0 0 1 10 3.4C26 20.8 16 27 16 27z" fill="#ff8fa8"/><path d="M9.5 13.5a3 3 0 0 1 3-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M16 4v4M12 5.5l1.2 2.5M20 5.5l-1.2 2.5" stroke="#f3b64a" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var IC_SUNRISE = '<svg viewBox="0 0 32 32"><path d="M8 21a8 8 0 0 1 16 0z" fill="#ffb84a"/><g stroke="#ff9a3d" stroke-width="2" stroke-linecap="round"><path d="M16 6.5V9.5M6.8 10.3l2 2M25.2 10.3l-2 2M3.5 18h3M25.5 18h3"/></g><path d="M3.5 21.5h25" stroke="#b99cff" stroke-width="2.2" stroke-linecap="round"/><path d="M8 25.5h16" stroke="#d9c6ff" stroke-width="2" stroke-linecap="round"/></svg>';
  var IC_ELIAS = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><circle cx="12" cy="12.5" r="7" fill="#f3c3a0"/><path d="M5.2 11.5c0-2 1-3.2 2-3.6M18.8 11.5c0-2-1-3.2-2-3.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="9.3" cy="12" r="2.1" fill="none" stroke="#b8862f" stroke-width="1.1"/><circle cx="14.7" cy="12" r="2.1" fill="none" stroke="#b8862f" stroke-width="1.1"/><path d="M11.4 12h1.2" stroke="#b8862f" stroke-width="1"/><path d="M9.2 15.6q2.8-1.4 5.6 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';
  var IC_MIC = '<svg viewBox="0 0 24 24"><rect x="8.5" y="3" width="7" height="11.5" rx="3.5" fill="#fff"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var IC_EAR = '<svg viewBox="0 0 32 32"><path d="M7 12.5h4l6-5v17l-6-5H7z" fill="#8a5cc8"/><path d="M21 11.5a6 6 0 0 1 0 9M24 8.5a10 10 0 0 1 0 15" stroke="#b99cff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
  var IC_MICB = '<svg viewBox="0 0 32 32"><rect x="11.5" y="4.5" width="9" height="15" rx="4.5" fill="#fff"/><path d="M8 15.5a8 8 0 0 0 16 0M16 23.5v4M11.5 27.5h9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
  var IC_MAP = '<svg viewBox="0 0 32 32"><path d="M16 5l12 6.5L16 18 4 11.5z" fill="#8fd16a"/><path d="M4 11.5V16l12 6.5V18z" fill="#5fae4a"/><path d="M28 11.5V16l-12 6.5V18z" fill="#4c963d"/>' +
    '<path d="M9.5 8.5l13 7" stroke="#5aa9e6" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12.6" r="2.2" fill="#2f6fe0" stroke="#fff" stroke-width="1"/><path d="M20 27l2-3.5 2 3.5z" fill="#ff7a1a"/></svg>';

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, H = host.clientHeight || 844;
      var R = rng(119105);
      var disposables = [];
      function keep(o) { disposables.push(o); return o; }

      var root = document.createElement('div'); root.className = 'santuario-root'; host.appendChild(root);
      var styleEl = document.createElement('style'); styleEl.textContent = CSS; root.appendChild(styleEl);

      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      var cores = navigator.hardwareConcurrency || 4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores >= 6 ? 2 : 1.5));
      renderer.setSize(W, H, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0xf6cdb8);
      var cv = renderer.domElement; cv.className = 'santuario-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xeec3c8, 20, 60);
      var camera = new THREE.PerspectiveCamera(FOV, W / H, 1, 200);

      /* céu: gradiente lilás → pêssego → dourado */
      function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
      var skyT = keep(new THREE.CanvasTexture(mkCanvas(8, 256, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#9f8fd8'); gr.addColorStop(0.28, '#c6a6e0'); gr.addColorStop(0.5, '#f2b9c4'); gr.addColorStop(0.66, '#ffc9a6'); gr.addColorStop(0.8, '#ffdca0'); gr.addColorStop(1, '#ffe9bf');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      scene.background = skyT;

      /* ----- materiais com rim light dourado (contraluz do amanhecer) ----- */
      var rimU = { uRimColor: { value: new THREE.Color(0xffd6a0) }, uRimStr: { value: 0.55 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return 'santuario-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
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
      var gTor = G('tor', function () { return new THREE.TorusGeometry(1, 0.35, 8, 18); });
      var gHex = G('hex', function () { return new THREE.CylinderGeometry(0.068, 0.08, 0.05, 6); });
      var gBow = G('bow', function () {
        var s = new THREE.Shape(); s.moveTo(-0.1, -0.055); s.lineTo(0, -0.022); s.lineTo(0.1, -0.055); s.lineTo(0.1, 0.055); s.lineTo(0, 0.022); s.lineTo(-0.1, 0.055); s.closePath();
        var e = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); e.translate(0, 0, -0.004); return e;
      });
      var gPlane = G('plane', function () { var p = new THREE.PlaneGeometry(1, 1); p.rotateX(-Math.PI / 2); return p; });

      var NOSH = [];
      function mesh(geo, mat, sx, sy, sz, x, y, z, parent, noShadow) {
        var m = new THREE.Mesh(geo, mat);
        m.scale.set(sx, sy, sz); m.position.set(x, y, z);
        if (noShadow) m.userData.ns = true;
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

      /* texturas */
      var glowT = keep(new THREE.CanvasTexture(mkCanvas(128, 128, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      var mistT = keep(new THREE.CanvasTexture(mkCanvas(128, 64, function (g, w, h) {
        var rr = rng(5);
        for (var k = 0; k < 14; k++) {
          var x = 16 + rr() * (w - 32), y = 20 + rr() * (h - 40), r = 14 + rr() * 18;
          var gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(0, 0, w, h);
        }
      })));
      var rayT = keep(new THREE.CanvasTexture(mkCanvas(64, 256, function (g, w, h) {
        // estreito e forte no sol (topo), largo e suave no chão (base)
        for (var y = 0; y < h; y++) {
          var k = y / h, half = (0.08 + 0.42 * k) * w, a = Math.pow(1 - k, 1.3) * 0.9 + 0.1 * Math.sin(k * Math.PI);
          var gr = g.createLinearGradient(w / 2 - half, 0, w / 2 + half, 0);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(w / 2 - half, y, half * 2, 1);
        }
      })));
      var sparkT = keep(new THREE.CanvasTexture(mkCanvas(64, 64, function (g, w, h) {
        var gr = g.createRadialGradient(32, 32, 0, 32, 32, 12); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,.95)';
        g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62); g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2); g.fill();
      })));
      var shadeT = keep(new THREE.CanvasTexture(mkCanvas(64, 64, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));

      /* ----- luzes ----- */
      var hemi = new THREE.HemisphereLight(0xdcc8f6, 0x8a7a66, 0.64); scene.add(hemi);
      var sun = new THREE.DirectionalLight(0xffb98a, 0.95);
      sun.position.set(1.4, 5.0, -7.0); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      var sc = sun.shadow.camera; sc.left = -5.5; sc.right = 5.5; sc.top = 5.5; sc.bottom = -5.5; sc.near = 1; sc.far = 25;
      sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
      sun.target.position.set(0.2, 0, -0.4);
      scene.add(sun); scene.add(sun.target);
      var front = new THREE.DirectionalLight(0xf3dcff, 0.3); front.position.set(2.5, 5, 9); scene.add(front);

      /* ----- chão da colina ----- */
      var GS = 70, GN = 140;
      var gg = new THREE.PlaneGeometry(GS, GS, GN, GN); gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -12);
      var gp = gg.attributes.position, gcol = [], c = new THREE.Color();
      var cA = new THREE.Color(0x8fc47c), cB = new THREE.Color(0x76ae6a), cC = new THREE.Color(0xa8d28a), cWarm = new THREE.Color(0xf6c4a0), cPath = new THREE.Color(0xeedfc4), cPathE = new THREE.Color(0xd9c7a2), cFar = new THREE.Color(0xb7a6cf), cSlope = new THREE.Color(0x8aa874), cLil = new THREE.Color(0xb9a6d9);
      function pathDist(x, z) { var d = Math.abs(x - 0.15 - Math.sin(z * 0.6) * 0.25); return z > 0.6 && z < 9 ? d : (z > -8.6 && z < -0.6 ? Math.abs(x - 0.3 + (z + 0.6) * 0.16) : 9); }
      for (var i = 0; i < gp.count; i++) {
        var x = gp.getX(i), z = gp.getZ(i), y = hillH(x, z);
        gp.setY(i, y);
        var nz = 0.5 + 0.5 * Math.sin(x * 0.8 + z * 0.5) * Math.cos(z * 0.6 - x * 0.25);
        c.copy(cA).lerp(cB, nz);
        var n2 = 0.5 + 0.5 * Math.sin(x * 1.5 - z * 1.1 + 1.0);
        c.lerp(cC, sstep(0.7, 1, n2) * 0.6);
        // luz morna do amanhecer vindo da esquerda-fundo
        c.lerp(cWarm, clamp(0.12 - 0.022 * z + 0.02 * Math.sin(x * 0.7), 0, 0.3));
        c.lerp(cLil, clamp(0.05 + 0.03 * Math.abs(x), 0, 0.2));
        var pd = pathDist(x, z);
        if (pd < 0.55) { c.lerp(cPathE, 1 - sstep(0.4, 0.55, pd)); c.lerp(cPath, 1 - sstep(0.18, 0.42, pd)); }
        if (y < -0.2) c.lerp(cSlope, sstep(-0.2, -1.2, y)).lerp(cFar, sstep(-1.2, -4, y));
        gcol.push(c.r, c.g, c.b);
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
      gg.computeVertexNormals();
      var ground = new THREE.Mesh(gg, M(0xffffff, { vertexColors: true, roughness: 0.95 })); ground.receiveShadow = true; ground.userData.ns = true; scene.add(ground);

      /* colinas distantes em camadas (lilás) */
      [[-26, -54, 18, 6.0, 0xe2c6e6], [10, -56, 22, 6.6, 0xe8cbe2], [30, -50, 16, 5.4, 0xdcc0e2], [-10, -42, 14, 4.4, 0xcdb2dc], [16, -38, 12, 3.9, 0xc8acd8], [-22, -32, 10, 3.2, 0xbca2d0], [4, -30, 9, 2.6, 0xb398cb]].forEach(function (q) {
        var m = mesh(gSph, new THREE.MeshBasicMaterial({ color: q[4], fog: false }), q[2], q[3], q[2] * 0.6, q[0], -3.8, q[1], scene, true);
        m.userData.ns = true;
      });

      /* sol e raios */
      var SUNP = new THREE.Vector3(-3.3, 6.5, -48);
      var discT = keep(new THREE.CanvasTexture(mkCanvas(128, 128, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(0.62, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffcf96, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      sunGlow.position.copy(SUNP); sunGlow.position.z -= 0.5; sunGlow.scale.set(30, 30, 1); scene.add(sunGlow);
      var sunGlow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffe9bf, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
      sunGlow2.position.copy(SUNP); sunGlow2.position.z -= 0.25; sunGlow2.scale.set(11, 11, 1); scene.add(sunGlow2);
      var sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: discT, color: 0xfff1c8, transparent: true, opacity: 1, depthWrite: false, fog: false }));
      sunCore.position.copy(SUNP); sunCore.scale.set(3.6, 3.6, 1); scene.add(sunCore);
      var RAYS = [];
      var rayTargets = [[-4.2, 0, 1.2, 1.5], [-2.0, 0, 2.8, 1.1], [-0.6, 0, -0.6, 1.8], [1.4, 0, 2.6, 1.3], [-3.2, 0, -2.6, 1.0], [2.6, 0, -1.8, 1.2], [3.8, 0, 1.4, 1.0]];
      rayTargets.forEach(function (q, j) {
        var m = new THREE.Mesh(G('rayg', function () { var p = new THREE.PlaneGeometry(1, 1); p.translate(0, -0.5, 0); return p; }), new THREE.MeshBasicMaterial({ map: rayT, color: j % 2 ? 0xffd9a0 : 0xffc4b0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        m.matrixAutoUpdate = false; m.userData.ns = true; m.renderOrder = 5; scene.add(m);
        RAYS.push({ m: m, end: new THREE.Vector3(q[0], q[1], q[2]), w: q[3] * 4.2, ph: j * 1.3 });
      });

      /* névoa baixa no vale */
      var MIST = [];
      [[-9, -2.6, -6, 12], [9, -2.7, -4, 12], [0, -2.8, -16, 18], [-12, -2.5, -18, 14], [12, -2.6, -17, 14], [-7, -2.9, 6, 10], [8, -2.9, 6, 10]].forEach(function (q, j) {
        var m = mesh(gPlane, new THREE.MeshBasicMaterial({ map: mistT, color: j % 2 ? 0xfff0f0 : 0xffe8dc, transparent: true, opacity: 0.85, depthWrite: false, fog: false }), q[3], 1, q[3] * 0.55, q[0], q[1], q[2], scene, true);
        MIST.push({ m: m, x: q[0], ph: j * 1.7 });
      });
      [[-6.6, -0.4, -9, 7], [6.4, -0.6, -8, 7], [-1, -0.8, -12.5, 9], [4, -1, -13, 8]].forEach(function (q, j) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistT, color: 0xfff1ea, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
        sp.position.set(q[0], q[1], q[2]); sp.scale.set(q[3], q[3] * 0.32, 1); scene.add(sp); MIST.push({ m: sp, x: q[0], ph: j * 2.1, sprite: true });
      });

      /* ----- instanciados ----- */
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
        if (!shadow) im.userData.ns = true;
        scene.add(im); return im;
      }

      var AVOID = [];
      function avoid(x, z, r) { AVOID.push([x, z, r]); }
      function freeAt(x, z, rr) {
        if (plateau(x, z) > 0.9) return false;
        if (pathDist(x, z) < 0.6 + rr) return false;
        for (var k = 0; k < AVOID.length; k++) { var a = AVOID[k]; var dx = x - a[0], dz = z - a[1]; if (dx * dx + dz * dz < (a[2] + rr) * (a[2] + rr)) return false; }
        return true;
      }

      /* ----- BANCO de blocos de encaixe ----- */
      var WOOD = 0xd99a5c, WOOD2 = 0xc98a4b, BEAM = 0x9a5f34, STONE = 0xeee3d0, STONE2 = 0xdccfb8, TEAL = 0x2fb5a3;
      var BZ = 0.25, SEAT = 0.5;
      [-0.78, 0.78].forEach(function (sx) {
        block(0.2, 0.44, 0.46, STONE, sx, 0.22, BZ, 0);
        addPin(sx, 0.44, BZ - 0.12, 0xffc93c); addPin(sx, 0.44, BZ + 0.12, 0xffc93c);
        block(0.14, 0.62, 0.12, BEAM, sx, 0.86, BZ - 0.25, 0);
      });
      [-0.15, 0, 0.15].forEach(function (dz, j) { block(1.95, 0.08, 0.14, j % 2 ? WOOD2 : WOOD, 0, SEAT - 0.02, BZ + dz, 0, null, 0.03); });
      [0.78, 1.0].forEach(function (yy, j) { var b = block(1.9, 0.12, 0.07, j ? WOOD : WOOD2, 0, yy, BZ - 0.27, 0, null, 0.03); b.rotation.x = -0.12; });
      [-1, 1].forEach(function (sg) { addBow(sg * 0.982, SEAT - 0.02, BZ + 0.07, sg * Math.PI / 2, TEAL, 0.8); addBow(sg * 0.982, SEAT - 0.02, BZ - 0.08, sg * Math.PI / 2, TEAL, 0.8); });
      avoid(0, BZ, 1.4);

      /* ----- FONTE de pedra ----- */
      var FP = new THREE.Vector3(1.62, 0, -2.05);
      (function () {
        var g = new THREE.Group(); g.position.copy(FP); g.position.y = hillH(FP.x, FP.z); scene.add(g);
        mesh(G('oct', function () { return new THREE.CylinderGeometry(1, 1.06, 1, 8); }), M(0xe4d6c2, { flatShading: true }), 0.82, 0.3, 0.82, 0, 0.15, 0, g);
        mesh(G('octr', function () { return new THREE.CylinderGeometry(1, 1, 1, 8); }), M(0xeee2cf, { flatShading: true }), 0.86, 0.06, 0.86, 0, 0.32, 0, g);
        mesh(gCyl, M(0xa8dcef, { emissive: 0x7cc8f0, emissiveIntensity: 0.25, roughness: 0.15 }), 0.72, 0.02, 0.72, 0, 0.3, 0, g, true);
        mesh(gCyl, M(STONE2), 0.11, 0.6, 0.11, 0, 0.6, 0, g);
        mesh(G('bowl', function () { return new THREE.CylinderGeometry(1, 0.55, 1, 16); }), M(STONE), 0.34, 0.12, 0.34, 0, 0.9, 0, g);
        mesh(gCyl, M(0xa8dcef, { emissive: 0x7cc8f0, emissiveIntensity: 0.25, roughness: 0.15 }), 0.29, 0.02, 0.29, 0, 0.955, 0, g, true);
        mesh(gSph, M(STONE2), 0.06, 0.09, 0.06, 0, 1.03, 0, g);
        for (var k = 0; k < 8; k++) { var an = k / 8 * Math.PI * 2 + Math.PI / 8; addPin(FP.x + Math.cos(an) * 0.84, g.position.y + 0.35, FP.z + Math.sin(an) * 0.84, 0xe9dfcc, -an); }
      })();
      avoid(FP.x, FP.z, 1.1);
      var dropMat = new THREE.MeshBasicMaterial({ color: 0xe6f8ff, transparent: true, opacity: 0.9 });
      var NDR = 16, fdrops = [];
      for (i = 0; i < NDR; i++) { var dm = mesh(gSphLo, dropMat, 0.022, 0.022, 0.022, 0, 0, 0, scene, true); fdrops.push({ m: dm, a: i / NDR * Math.PI * 2, o: (i * 0.37) % 1 }); }
      var ringGeo = G('ring', function () { var r = new THREE.RingGeometry(0.86, 1, 36); r.rotateX(-Math.PI / 2); return r; });
      var fRings = [0, 1, 2].map(function (k) { var m = mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 1, 1, 1, FP.x, hillH(FP.x, FP.z) + 0.315, FP.z, scene, true); return { m: m, o: k / 3 }; });

      /* ----- OLIVEIRA ----- */
      var OP = new THREE.Vector3(-2.15, 0, -1.0);
      (function () {
        var g = new THREE.Group(); g.position.copy(OP); g.position.y = hillH(OP.x, OP.z); scene.add(g);
        var bark = M(0x8f7a66, { roughness: 0.9 });
        var t1 = mesh(gCyl, bark, 0.17, 0.9, 0.17, 0.02, 0.42, 0, g); t1.rotation.z = 0.12;
        var t2 = mesh(gCyl, bark, 0.11, 0.8, 0.11, -0.2, 1.05, 0.05, g); t2.rotation.z = 0.5;
        var t3 = mesh(gCyl, bark, 0.1, 0.75, 0.1, 0.2, 1.05, -0.05, g); t3.rotation.z = -0.55;
        var t4 = mesh(gCyl, bark, 0.08, 0.6, 0.08, 0.02, 1.15, 0.15, g); t4.rotation.x = 0.5;
        mesh(gSph, bark, 0.26, 0.12, 0.26, 0, 0.04, 0, g);
        var leaves = [[0, 1.6, 0, 0.62, 0xa6ba8c], [-0.55, 1.4, 0.1, 0.48, 0x93aa7c], [0.55, 1.42, -0.05, 0.5, 0x9fb586], [-0.2, 1.85, -0.25, 0.45, 0xb9caa0], [0.3, 1.86, 0.25, 0.42, 0xc3d2a8], [-0.4, 1.25, 0.4, 0.34, 0x8aa274], [0.45, 1.2, 0.38, 0.32, 0x8fa878], [0.05, 1.35, -0.45, 0.4, 0x8aa274]];
        leaves.forEach(function (q) { mesh(gSph, M(q[4], { roughness: 0.85 }), q[3] * 1.15, q[3] * 0.82, q[3] * 1.0, q[0], q[1], q[2], g); });
        var rr = rng(3);
        for (var k = 0; k < 14; k++) { var q = leaves[k % leaves.length], an = rr() * 6.28; mesh(gSphLo, M(0x4f5f3a, { roughness: 0.4 }), 0.035, 0.045, 0.035, q[0] + Math.cos(an) * q[3] * 1.05, q[1] - 0.1 + rr() * 0.2, q[2] + Math.sin(an) * q[3] * 0.95, g); }
      })();
      avoid(OP.x, OP.z, 1.2);

      /* ----- CAPELA simples ao fundo (cruz discreta) ----- */
      var CP = new THREE.Vector3(1.6, 0, -9.5);
      (function () {
        var g = new THREE.Group(); g.position.copy(CP); g.position.y = hillH(CP.x, CP.z); g.rotation.y = -0.18; scene.add(g);
        [[-0.55, -0.75], [0.55, -0.75], [-0.55, 0.75], [0.55, 0.75]].forEach(function (q, j) { block(1.08, 0.24, 1.48, j % 3 ? STONE : STONE2, q[0], 0.12, q[1], 0, g); });
        var WALL = 0xfdf3e3, ROOF = 0xc9726a, ROOF2 = 0xa95a55;
        block(1.9, 1.5, 2.7, WALL, 0, 0.24 + 0.75, 0, 0, g, 0.08);
        [-1, 1].forEach(function (sg) { var p = block(1.24, 0.12, 2.95, ROOF, sg * 0.5, 2.18, 0, 0, g, 0.05); p.rotation.z = -sg * 0.72; });
        var ridge = mesh(gCyl, M(ROOF2), 0.07, 2.98, 0.07, 0, 2.6, 0, g); ridge.rotation.x = Math.PI / 2;
        var tri = G('gable', function () { var sh = new THREE.Shape(); sh.moveTo(-0.95, 0); sh.lineTo(0.95, 0); sh.lineTo(0, 0.82); sh.closePath(); var e = new THREE.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: false }); e.translate(0, 0, -1.3); return e; });
        mesh(tri, M(WALL), 1, 1, 1, 0, 1.74, 0, g);
        // porta em arco
        block(0.5, 0.62, 0.08, 0x8e5632, 0, 0.24 + 0.31, 1.36, 0, g, 0.04);
        var arch = mesh(G('archg', function () { return new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16, 1, false, -Math.PI / 2, Math.PI); }), M(0x8e5632), 1, 1, 1, 0, 0.86, 1.36, g); arch.rotation.x = Math.PI / 2;
        ball(0xffc93c, 0.03, 0.12, 0.55, 1.42, g);
        // rosácea com luz morna
        var winM = M(0xffe2a8, { emissive: 0xffb860, emissiveIntensity: 0.75, roughness: 0.3 });
        var ros = mesh(gCyl, winM, 0.13, 0.05, 0.13, 0, 1.6, 1.36, g); ros.rotation.x = Math.PI / 2;
        var rosF = mesh(gTor, M(0xf7efe0), 0.14, 0.14, 0.1, 0, 1.6, 1.39, g);
        [-1, 1].forEach(function (sg) {
          [-0.55, 0.45].forEach(function (zz) {
            var w = new THREE.Mesh(rbox(0.06, 0.48, 0.24, 0.03), winM); w.position.set(sg * 0.96, 1.0, zz); g.add(w);
            var a2 = mesh(G('archw', function () { return new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12, 1, false, 0, Math.PI); }), winM, 1, 1, 1, sg * 0.96, 1.24, zz, g); a2.rotation.z = Math.PI / 2; a2.rotation.y = Math.PI / 2;
          });
        });
        // degraus
        block(0.9, 0.12, 0.3, STONE2, 0, 0.06, 1.62, 0, g);
        // torrezinha com sino e cruz discreta
        block(0.44, 0.5, 0.44, WALL, 0, 2.62, 0.95, 0, g, 0.04);
        block(0.26, 0.26, 0.48, 0x6a4a5a, 0, 2.68, 0.95, 0, g, 0.03);
        mesh(gHemi, M(0xe8b84a, { roughness: 0.35 }), 0.09, 0.12, 0.09, 0, 2.62, 0.98, g);
        var spire = mesh(G('spire', function () { return new THREE.ConeGeometry(1, 1, 4); }), M(ROOF), 0.36, 0.42, 0.36, 0, 3.08, 0.95, g); spire.rotation.y = Math.PI / 4;
        var CROSS = M(0xf2d38a, { roughness: 0.4, emissive: 0xffd890, emissiveIntensity: 0.25 });
        var cv1 = new THREE.Mesh(rbox(0.05, 0.34, 0.05, 0.015), CROSS); cv1.position.set(0, 3.46, 0.95); g.add(cv1);
        var ch1 = new THREE.Mesh(rbox(0.2, 0.05, 0.05, 0.015), CROSS); ch1.position.set(0, 3.52, 0.95); g.add(ch1);
        // pinos na base de pedra
        g.updateMatrixWorld(true);
        var v = new THREE.Vector3();
        [-0.9, 0, 0.9].forEach(function (px) { [-1.35, 1.35].forEach(function (pz) { v.set(px, 0.24, pz); g.localToWorld(v); addPin(v.x, v.y, v.z, 0xe9dfcc, -0.18); }); });
        // canteirinho de flores na frente
        [[-0.6, 0xff9ab5], [-0.42, 0xffffff], [0.42, 0xffd24a], [0.6, 0xc59bff]].forEach(function (q) { ball(q[1], 0.08, q[0], 0.3, 1.5, g); });
      })();
      avoid(CP.x, CP.z, 2.0);

      /* ----- vegetação ----- */
      var BUSH = [], tryN;
      var hedge = [];
      for (var a = 0; a < 34; a++) {
        var an = -Math.PI * 0.08 - a / 33 * Math.PI * 1.16, e0 = 0.86;
        var hx = Math.cos(an) * PRX * e0, hz = PCZ + Math.sin(an) * PRZ * e0;
        if (hz > 3.2) continue;
        if (Math.abs(hx - 1.3) < 1.0 && hz < -8) continue;
        var bs = 0.32 + R() * 0.16;
        hedge.push({ x: hx, y: hillH(hx, hz) + bs * 0.55, z: hz, sx: bs * 1.4, sy: bs, sz: bs * 1.1, c: [0x7fae66, 0x6fa05e, 0x8cbb70][a % 3] });
      }
      for (tryN = 0; tryN < 300 && BUSH.length < 22; tryN++) {
        var bx = -4.5 + R() * 9, bz = -6 + R() * 9;
        if (!freeAt(bx, bz, 0.35)) continue;
        var bs2 = 0.2 + R() * 0.14, bc = [0x7fb866, 0x6fa85c, 0x93c46e][BUSH.length % 3];
        BUSH.push({ x: bx, y: hillH(bx, bz) + bs2 * 0.55, z: bz, sx: bs2 * 1.3, sy: bs2, sz: bs2 * 1.1, c: bc });
        avoid(bx, bz, 0.35);
      }
      instanced(gSph, M(0xffffff, { roughness: 0.85 }), hedge.concat(BUSH), true);
      // lavandas
      var LAV = [], STEMS = [];
      [[-1.2, 1.4, 6], [1.25, 1.55, 6], [-3.0, 0.4, 7], [3.2, 0.9, 5], [-0.9, -2.8, 5], [2.6, -3.2, 5]].forEach(function (q) {
        for (var k = 0; k < q[2]; k++) {
          var lx = q[0] + (R() - 0.5) * 0.8, lz = q[1] + (R() - 0.5) * 0.45, gy = hillH(lx, lz), hh = 0.22 + R() * 0.1;
          STEMS.push({ x: lx, y: gy + hh * 0.4, z: lz, sx: 0.06, sy: hh * 0.8, sz: 0.06, c: 0x7da868 });
          LAV.push({ x: lx, y: gy + hh * 0.85, z: lz, sx: 0.045, sy: hh * 0.55, sz: 0.045, c: [0xa98be0, 0xb99cff, 0x9a7ad6][k % 3] });
        }
        avoid(q[0], q[1], 0.5);
      });
      instanced(G('tufcone', function () { return new THREE.ConeGeometry(1, 1, 5); }), M(0xffffff, { roughness: 0.9 }), STEMS, false);
      instanced(G('lavg', function () { return new THREE.SphereGeometry(1, 8, 6); }), M(0xffffff, { roughness: 0.7 }), LAV, false);
      // flores e grama
      var FLW = [], TUF = [];
      var flCols = [0xffffff, 0xff9ab5, 0xffd24a, 0xc59bff, 0xffb27a];
      for (tryN = 0; tryN < 900 && FLW.length < 120; tryN++) {
        var fx0 = -4.5 + R() * 9, fz0 = -6.5 + R() * 10;
        if (!freeAt(fx0, fz0, 0.05)) continue;
        var col2 = flCols[Math.floor(R() * 5)];
        for (var k2 = 0; k2 < 3; k2++) { var fx = fx0 + (R() - 0.5) * 0.45, fz = fz0 + (R() - 0.5) * 0.45; if (!freeAt(fx, fz, 0)) continue; FLW.push({ x: fx, y: hillH(fx, fz) + 0.07, z: fz, sx: 0.05, sy: 0.038, sz: 0.05, c: col2 }); }
      }
      for (tryN = 0; tryN < 700 && TUF.length < 170; tryN++) {
        var tx0 = -5 + R() * 10, tz0 = -7 + R() * 12;
        if (!freeAt(tx0, tz0, 0)) continue;
        TUF.push({ x: tx0, y: hillH(tx0, tz0) + 0.07, z: tz0, sx: 0.045, sy: 0.15 + R() * 0.08, sz: 0.045, rz: (R() - 0.5) * 0.4, c: [0x78b25c, 0x8cc06a, 0x6aa252][TUF.length % 3] });
      }
      instanced(gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
      instanced(geos.tufcone, M(0xffffff, { roughness: 0.9 }), TUF, false);
      // pedrinhas do caminho
      var STEP = [];
      for (var sz0 = 1.25; sz0 < 7.5; sz0 += 0.62) { var sx0 = 0.15 + Math.sin(sz0 * 0.6) * 0.25 + (R() - 0.5) * 0.12; STEP.push({ x: sx0, y: hillH(sx0, sz0) + 0.02, z: sz0, sx: 0.36 + R() * 0.08, sy: 0.05, sz: 0.24 + R() * 0.05, ry: (R() - 0.5) * 0.5, c: [0xf3e8d4, 0xe6d8bf][Math.floor(R() * 2)] }); }
      for (sz0 = -1.2; sz0 > -8.0; sz0 -= 0.62) { var sx1 = 0.3 - (sz0 + 0.6) * 0.16 + (R() - 0.5) * 0.12; STEP.push({ x: sx1, y: hillH(sx1, sz0) + 0.02, z: sz0, sx: 0.34 + R() * 0.08, sy: 0.05, sz: 0.22 + R() * 0.05, ry: (R() - 0.5) * 0.5, c: 0xeee2cc }); }
      instanced(gSphLo, M(0xffffff, { roughness: 0.85 }), STEP, false);

      instanced(gHex, pinMat(0xffffff), PINS, true);
      instanced(gBow, M(0xffffff, { roughness: 0.5 }), BOWS, false);

      /* orvalho (Points que cintilam) */
      var NDEW = 110, dewPos = new Float32Array(NDEW * 3), dewCol = new Float32Array(NDEW * 3), dew = [];
      for (tryN = 0; tryN < 1200 && dew.length < NDEW; tryN++) {
        var dx = -4 + R() * 8, dz = -4 + R() * 9;
        if (plateau(dx, dz) > 0.88 || Math.abs(dx) < 1.1 && Math.abs(dz - BZ) < 0.6) continue;
        dew.push({ ph: R() * 6.28, sp: 1.2 + R() * 2.2 });
        var di = dew.length - 1; dewPos[di * 3] = dx; dewPos[di * 3 + 1] = hillH(dx, dz) + 0.1 + R() * 0.08; dewPos[di * 3 + 2] = dz;
      }
      var dewGeo = new THREE.BufferGeometry();
      dewGeo.setAttribute('position', new THREE.BufferAttribute(dewPos, 3)); dewGeo.setAttribute('color', new THREE.BufferAttribute(dewCol, 3));
      var dewPts = new THREE.Points(dewGeo, new THREE.PointsMaterial({ size: 0.16, map: sparkT, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
      dewPts.frustumCulled = false; scene.add(dewPts);

      /* pássaros */
      var wingGeo = G('bwing', function () { var s = new THREE.Shape(); s.moveTo(0, 0.01); s.quadraticCurveTo(0.12, 0.11, 0.3, 0.05); s.quadraticCurveTo(0.15, 0.04, 0, -0.035); return new THREE.ShapeGeometry(s); });
      var birdMat = new THREE.MeshBasicMaterial({ color: 0x6d5a8a, side: THREE.DoubleSide, fog: false });
      var BIRDS = [[0.0, 3.3, -16, 1.0], [0.05, 3.7, -17, 0.85], [0.09, 3.0, -18, 0.9], [0.55, 4.0, -20, 1.0], [0.6, 4.4, -21, 0.8]].map(function (q) {
        var g = new THREE.Group(); scene.add(g);
        var l = new THREE.Mesh(wingGeo, birdMat), r = new THREE.Mesh(wingGeo, birdMat); r.scale.x = -1; g.add(l); g.add(r);
        mesh(gSphLo, birdMat, 0.035, 0.03, 0.03, 0, 0, 0, g, true);
        g.scale.setScalar(1.5 * q[3]);
        return { g: g, l: l, r: r, o: q[0], y: q[1], z: q[2], ph: q[0] * 20 };
      });

      /* ----- personagens ----- */
      var SKIN = 0xffcfa6, SKIN2 = 0xf7b98e;
      function eye(parent, x, y, z, r) {
        var e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
        mesh(gSph, M(0xffffff, { roughness: 0.3 }), r * 0.82, r, r * 0.5, 0, 0, 0, e, true);
        mesh(gSph, M(0x2a2342, { roughness: 0.25 }), r * 0.6, r * 0.7, r * 0.4, 0, -r * 0.08, r * 0.2, e, true);
        mesh(gSphLo, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.22, r * 0.22, r * 0.12, r * 0.18, r * 0.24, r * 0.45, e, true);
        return e;
      }
      // HERÓI (idêntico ao da exploração), sentado
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
      var col = mesh(gTor, M(BLUE2), 0.09, 0.09, 0.09, 0, 1.06, 0.0, hB); col.rotation.x = Math.PI / 2 - 0.25;
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
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(0x5c321b), 0.04, 0.012, 0.015, sg * 0.08, 0.075, 0.19, hHead, true); bw.rotation.z = sg * -0.2; });
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff9a8a, { transparent: true, opacity: 0.6 }), 0.038, 0.022, 0.01, sg * 0.125, -0.06, 0.168, hHead, true); });
      var hMouth = mesh(gSmile, M(0xa83b33, { roughness: 0.4 }), 0.036, 0.03, 0.03, 0, -0.07, 0.19, hHead, true); hMouth.rotation.z = Math.PI;
      var hMouthO = mesh(gSph, M(0x8c2f2a, { roughness: 0.5 }), 0.026, 0.03, 0.02, 0, -0.075, 0.19, hHead, true);
      ball(SKIN2, 0.022, 0, -0.025, 0.205, hHead);

      // BÍBLIA aberta nas mãos do herói (capa vinho, cruz dourada discreta, fita marcadora)
      var book = new THREE.Group(); hB.add(book); book.position.set(0, 0.84, 0.3);
      var bookIn = new THREE.Group(); book.add(bookIn); bookIn.rotation.x = -2.45;
      var COVER = M(0x7a2f3a, { roughness: 0.55 }), PAGE = M(0xfff8e8, { roughness: 0.9 }), GOLD = M(0xf2c45a, { roughness: 0.35, emissive: 0xffc860, emissiveIntensity: 0.15 });
      [-1, 1].forEach(function (sg) {
        var half = new THREE.Group(); half.rotation.y = sg * 0.32; bookIn.add(half);
        var cvm = new THREE.Mesh(rbox(0.21, 0.28, 0.018, 0.008), COVER); cvm.position.set(sg * 0.105, 0, 0); half.add(cvm);
        var pg = new THREE.Mesh(rbox(0.19, 0.26, 0.03, 0.01), PAGE); pg.position.set(sg * 0.1, 0, 0.022); half.add(pg);
        [0.06, 0.02, -0.02, -0.06].forEach(function (yy) { var ln = new THREE.Mesh(rbox(0.13, 0.008, 0.004, 0.002), M(0xd8c8b8)); ln.position.set(sg * 0.1, yy, 0.039); half.add(ln); });
        if (sg > 0) {
          var c1 = new THREE.Mesh(rbox(0.016, 0.085, 0.006, 0.003), GOLD); c1.position.set(0.105, 0.01, -0.012); half.add(c1);
          var c2 = new THREE.Mesh(rbox(0.055, 0.016, 0.006, 0.003), GOLD); c2.position.set(0.105, 0.03, -0.012); half.add(c2);
        }
      });
      mesh(gCyl, COVER, 0.018, 0.28, 0.018, 0, 0, -0.005, bookIn);
      var ribbon = new THREE.Mesh(rbox(0.018, 0.16, 0.004, 0.002), M(0xe8a83a)); ribbon.position.set(0.0, -0.2, 0.03); bookIn.add(ribbon);
      var flipG = new THREE.Group(); bookIn.add(flipG); flipG.position.set(0, 0, 0.04);
      var flipP = new THREE.Mesh(rbox(0.185, 0.25, 0.006, 0.003), PAGE); flipP.position.set(0.095, 0, 0); flipG.add(flipP);

      // VOVÔ ELIAS (idoso sereno: cardigã, óculos redondos, bigode branco, bengala)
      var elias = new THREE.Group(), eB = new THREE.Group(); elias.add(eB); scene.add(elias);
      var CARD = 0x6f9a7e, CARD2 = 0x5c8569, ESKIN = 0xf3c3a0, ESKIN2 = 0xe8ab86, WHITE = 0xf6f3ee, TROU = 0x6b6f86;
      var eLegs = [-1, 1].map(function (sg) {
        var hip = new THREE.Group(); hip.position.set(sg * 0.13, 0.56, 0.02); eB.add(hip);
        capsule(0.09, 0.3, TROU, hip);
        var knee = new THREE.Group(); knee.position.set(0, -0.3, 0); hip.add(knee);
        capsule(0.082, 0.3, TROU, knee);
        mesh(gSph, M(0x6a4228, { roughness: 0.5 }), 0.105, 0.075, 0.16, 0, -0.36, 0.05, knee);
        return { hip: hip, knee: knee };
      });
      mesh(gSph, M(TROU), 0.27, 0.16, 0.22, 0, 0.6, 0, eB);
      mesh(gSph, M(CARD), 0.3, 0.33, 0.25, 0, 0.9, 0, eB);
      mesh(gSph, M(0xf3e6c8), 0.085, 0.1, 0.05, 0, 1.12, 0.215, eB);
      [-1, 1].forEach(function (sg) { var lp = new THREE.Mesh(rbox(0.07, 0.3, 0.03, 0.012), M(CARD2)); lp.position.set(sg * 0.085, 0.98, 0.235); lp.rotation.set(-0.22, 0, sg * 0.28); eB.add(lp); });
      [-1, 1].forEach(function (sg) { var cl = new THREE.Mesh(rbox(0.07, 0.04, 0.02, 0.01), M(0xffffff)); cl.position.set(sg * 0.045, 1.16, 0.2); cl.rotation.set(-0.4, 0, sg * -0.5); eB.add(cl); });
      [0.92, 0.82, 0.72].forEach(function (yy) { ball(0xe8d3a8, 0.02, 0.06, yy, 0.25 - (0.92 - yy) * 0.05, eB); });
      [-1, 1].forEach(function (sg) { var pk = new THREE.Mesh(rbox(0.11, 0.09, 0.03, 0.012), M(CARD2)); pk.position.set(sg * 0.16, 0.75, 0.205); pk.rotation.y = sg * 0.5; eB.add(pk); });
      var eArms = [-1, 1].map(function (sg) {
        var A = new THREE.Group(); A.position.set(sg * 0.32, 1.12, 0); eB.add(A);
        capsule(0.085, 0.15, CARD, A);
        var fa = new THREE.Group(); fa.position.y = -0.17; A.add(fa);
        capsule(0.075, 0.15, CARD, fa);
        mesh(gCyl, M(CARD2), 0.08, 0.04, 0.08, 0, -0.16, 0, fa);
        ball(ESKIN, 0.08, 0, -0.21, 0, fa);
        return { A: A, fa: fa };
      });
      var eHead = new THREE.Group(); eHead.position.set(0, 1.45, 0.03); eB.add(eHead);
      mesh(gSph, M(ESKIN, { roughness: 0.6 }), 0.2, 0.21, 0.2, 0, 0, 0, eHead);
      [-1, 1].forEach(function (sg) { ball(ESKIN2, 0.046, sg * 0.198, -0.01, 0, eHead); });
      // cabelo branco só dos lados e atrás (topo calvo)
      mesh(gSph, M(WHITE, { roughness: 0.92 }), 0.19, 0.13, 0.15, 0, -0.02, -0.08, eHead);
      [-1, 1].forEach(function (sg) { mesh(gSph, M(WHITE, { roughness: 0.92 }), 0.045, 0.075, 0.095, sg * 0.178, 0.03, -0.035, eHead); });
      var eEyes = [eye(eHead, -0.07, 0.03, 0.168, 0.044), eye(eHead, 0.07, 0.03, 0.168, 0.044)];
      [-1, 1].forEach(function (sg) { var bw = mesh(gSph, M(WHITE, { roughness: 0.9 }), 0.052, 0.022, 0.025, sg * 0.075, 0.1, 0.178, eHead, true); bw.rotation.z = sg * -0.25; });
      // óculos redondos dourados
      var GLS = M(0xc9a24a, { roughness: 0.35 });
      [-1, 1].forEach(function (sg) {
        var rg = mesh(G('gls', function () { return new THREE.TorusGeometry(1, 0.13, 6, 22); }), GLS, 0.06, 0.06, 0.06, sg * 0.072, 0.03, 0.19, eHead, true);
        var tm = mesh(gCyl, GLS, 0.007, 0.16, 0.007, sg * 0.15, 0.04, 0.1, eHead, true); tm.rotation.x = Math.PI / 2; tm.rotation.z = sg * 0.25;
      });
      mesh(gCyl, GLS, 0.006, 0.03, 0.006, 0, 0.04, 0.2, eHead, true).rotation.z = Math.PI / 2;
      ball(0xf0a888, 0.046, 0, -0.01, 0.205, eHead);
      [-1, 1].forEach(function (sg) { var mu = mesh(gSph, M(WHITE, { roughness: 0.9 }), 0.065, 0.03, 0.04, sg * 0.05, -0.065, 0.19, eHead, true); mu.rotation.z = sg * 0.3; });
      var eMouth = mesh(gSmile, M(0x9a3b33, { roughness: 0.4 }), 0.03, 0.022, 0.02, 0, -0.11, 0.185, eHead, true); eMouth.rotation.z = Math.PI;
      [-1, 1].forEach(function (sg) { mesh(gSphLo, M(0xff8f7a, { transparent: true, opacity: 0.5 }), 0.035, 0.02, 0.01, sg * 0.12, -0.04, 0.165, eHead, true); });
      // bengala encostada no banco
      var cane = new THREE.Group(); scene.add(cane); cane.position.set(1.08, 0, BZ + 0.3); cane.rotation.z = 0.22; cane.rotation.x = -0.05;
      mesh(gCyl, M(0x8a5a34, { roughness: 0.6 }), 0.025, 0.86, 0.025, 0, 0.43, 0, cane);
      var hook = mesh(G('hook', function () { return new THREE.TorusGeometry(0.08, 0.026, 8, 16, Math.PI); }), M(0x8a5a34, { roughness: 0.6 }), 1, 1, 1, -0.08, 0.86, 0, cane);
      mesh(gCyl, M(0x3a2a20), 0.03, 0.03, 0.03, 0, 0.015, 0, cane);

      /* posições: sentados no banco */
      var SC = 1.12;
      hero.scale.setScalar(SC); elias.scale.setScalar(SC);
      hero.position.set(-0.42, SEAT + 0.03 - 0.6 * SC, BZ - 0.02);
      elias.position.set(0.44, SEAT + 0.03 - 0.56 * SC, BZ - 0.04);
      elias.rotation.y = -0.12; hero.rotation.y = 0.1;
      hLegs[0].rotation.set(-1.32, 0, -0.05); hLegs[1].rotation.set(-1.32, 0, 0.05);
      eLegs.forEach(function (L, j) { L.hip.rotation.set(-1.5, 0, (j ? 1 : -1) * 0.06); L.knee.rotation.x = 1.45; });

      /* brilho das palavras (faíscas douradas) */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 24;
      var sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }), NSP);
      var spData = [], spCols = [0xffe08a, 0xffffff, 0xffc9e0, 0xffd24a];
      for (i = 0; i < NSP; i++) { spData.push({ w: i % 4, a: R() * Math.PI * 2, up: 0.3 + R() * 0.5, r: 0.2 + R() * 0.35, s: 0.5 + R() * 0.6 }); sparks.setColorAt(i, tmpC.set(spCols[i % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; sparks.userData.ns = true; scene.add(sparks);
      var bookGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); scene.add(bookGlow);

      /* sombras: todos os sólidos projetam */
      scene.traverse(function (o) {
        if ((o.isMesh || o.isInstancedMesh) && !o.userData.ns && o.material && !o.material.transparent && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; }
      });
      ground.castShadow = false;

      /* ----- HUD ----- */
      var vig = document.createElement('div'); vig.className = 'santuario-vig'; root.appendChild(vig);
      var glowEl = document.createElement('div'); glowEl.className = 'santuario-glow'; root.appendChild(glowEl);
      var hud = document.createElement('div'); hud.className = 'santuario-hud';
      var verse = 'S0 para os meus S1 é tua palavra, e S2 para o meu S3.'.replace(/S(\d)/g, function (m0, d) { return '<span class="santuario-sl"><b>' + WORDS[+d][0] + '</b></span>'; });
      hud.innerHTML =
        '<div class="santuario-top santuario-card"><div class="santuario-ava">' + AVATAR + '<span class="santuario-lv">4</span></div>' +
        '<div class="santuario-stat"><div class="santuario-ttl">Nível 4 · <span>Explorador</span></div>' +
        '<div class="santuario-bar"><div class="santuario-fill"></div><div class="santuario-flash"></div></div>' +
        '<div class="santuario-xpn"><span>Experiência</span><span><b class="santuario-xpv">620</b> / 1000 XP</span></div></div>' +
        '<div class="santuario-pause">' + IC_PAUSE + '</div></div>' +
        '<div class="santuario-quest santuario-card"><div class="santuario-qi">' + IC_HEART + '</div><div class="santuario-qt"><b>Missão:</b> guardar a Palavra no coração</div><div class="santuario-chk">' + IC_CHECK + '</div></div>' +
        '<div class="santuario-time santuario-card"><div class="santuario-ti">' + IC_SUNRISE + '</div><div class="santuario-tt">Amanhecer</div></div>' +
        '<div class="santuario-bub santuario-card"><div class="santuario-tail"></div><div class="santuario-nm">' + IC_ELIAS + 'Vovô Elias</div><div class="santuario-say">Guarde no <b>coração</b> e repita com calma.</div></div>' +
        '<div class="santuario-vs santuario-card"><div class="santuario-vh"><span class="santuario-tag">' + IC_BOOK + 'Memorizar</span><span class="santuario-dots"><i></i><i></i><i></i><i></i></span></div>' +
        '<div class="santuario-vt">' + verse + '</div><div class="santuario-ref">— Salmo 119:105</div>' +
        '<div class="santuario-mic"><div class="santuario-mb"><span class="santuario-mr"></span><span class="santuario-mr"></span>' + IC_MIC + '</div><div class="santuario-ml">Toque e fale o versículo</div><div class="santuario-wv"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>' +
        '<div class="santuario-xp">' + IC_XP + '+30 XP</div>' +
        '<div class="santuario-btns">' +
        '<div class="santuario-btn santuario-card"><i style="background:#f1e8ff">' + IC_EAR + '</i>Ouvir</div>' +
        '<div class="santuario-btn santuario-card santuario-pri"><i>' + IC_MICB + '</i>Falar</div>' +
        '<div class="santuario-btn santuario-card"><i style="background:#e6f5dc">' + IC_MAP + '</i>Mapa</div></div>';
      root.appendChild(hud);
      function q(sel) { return hud.querySelector(sel); }
      function qa(sel) { return Array.prototype.slice.call(hud.querySelectorAll(sel)); }
      var elFill = q('.santuario-fill'), elFlash = q('.santuario-flash'), elXpv = q('.santuario-xpv'), elBub = q('.santuario-bub'), elXp = q('.santuario-xp'),
        elChk = q('.santuario-chk'), elChkSvg = elChk.querySelector('svg'), elPri = q('.santuario-pri'), elQuest = q('.santuario-quest'),
        elVs = q('.santuario-vs'), elSlots = qa('.santuario-sl'), elWords = qa('.santuario-sl b'), elDots = qa('.santuario-dots i'), elMl = q('.santuario-ml'), elMb = q('.santuario-mb'),
        elMr = qa('.santuario-mr'), elBars = qa('.santuario-wv i'), elWv = q('.santuario-wv'), elVt = q('.santuario-vt');
      var mlState = -1;

      /* ----- layout / câmera ----- */
      var S = 1, T0 = Math.tan(FOV / 2 * Math.PI / 180);
      function layout() {
        W = host.clientWidth || W; H = host.clientHeight || H;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        S = clamp(Math.min(W / 390, H / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);
      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion(), wp = new THREE.Vector3();
      var ax = new THREE.Vector3(), tc = new THREE.Vector3(), bx3 = new THREE.Vector3(), bz3 = new THREE.Vector3(), mid = new THREE.Vector3(), rm = new THREE.Matrix4();
      function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        var s = t >= CUT ? t - LOOP : t;

        // ----- câmera: do alto (exploração) desce devagar até o banco, contemplativa
        var zk = reduce ? 1 : sstep(0.05, 3.9, s);
        var zk2 = zk * zk * (3 - 2 * zk);
        var asp = Math.min(camera.aspect, 0.75);
        var az = lerp(12, 6, zk) * Math.PI / 180 + (reduce ? 0 : 0.03 * Math.sin(s * 0.5));
        var el = lerp(48, 3, zk2) * Math.PI / 180;
        var ww = lerp(8.0, 3.8, zk) * (reduce ? 1 : 1 - 0.03 * sstep(3.9, 6.6, s));
        var dist = (ww / 2) / (T0 * asp);
        var tx = lerp(-0.25, 0.05, zk), ty = lerp(0.0, 1.05, zk2), tz = lerp(-3.5, BZ, zk);
        camera.position.set(tx + dist * Math.sin(az) * Math.cos(el), ty + dist * Math.sin(el), tz + dist * Math.cos(az) * Math.cos(el));
        camera.lookAt(tx, ty, tz);
        camera.setViewOffset(W, H, 0, H * lerp(0.0, 0.02, zk), W, H);
        camera.updateMatrixWorld();
        scene.fog.near = dist + 4; scene.fog.far = dist + 48;

        // ----- herói: lê, levanta o rosto e recita, sorri
        var recite = sstep(2.15, 2.5, s) * (1 - sstep(5.6, 6.0, s));
        var speak = s > 2.45 && s < 5.0 ? (0.5 + 0.5 * Math.sin(s * 19) * Math.sin(s * 7.3)) : 0;
        var happy = sstep(5.0, 5.25, s) * (1 - sstep(6.0, 6.4, s));
        var breathe = Math.sin(wall * 1.6);
        hB.position.y = breathe * 0.006;
        hB.rotation.x = 0.06 - 0.04 * recite;
        hSq.scale.set(1, 1 + breathe * 0.008, 1);
        hHead.rotation.x = lerp(0.36, -0.08, recite) + Math.sin(wall * 1.1) * 0.02 + speak * 0.02;
        hHead.rotation.y = 0.12 * recite + 0.05 * Math.sin(wall * 0.7);
        hHead.rotation.z = 0.06 * happy * Math.sin(wall * 3);
        hMouth.visible = speak < 0.35;
        hMouthO.visible = !hMouth.visible;
        hMouthO.scale.set(0.026, 0.02 + 0.016 * speak, 0.02);
        hMouth.scale.set(0.036 * (1 + happy * 0.3), 0.03 * (1 + happy * 1.0), 0.03);
        var bl = wall % 3.4, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink) * (1 - 0.15 * (1 - recite));
        // braços segurando a Bíblia; ela baixa um pouco quando ele recita
        var bookDown = recite * 0.32;
        hArms[0].rotation.set(-0.95 + bookDown, 0, 0.42); hArms[1].rotation.set(-0.95 + bookDown, 0, -0.42);
        book.position.set(0, 0.86 - bookDown * 0.22, 0.31 - bookDown * 0.05);
        book.rotation.x = bookDown * 0.6;
        hLegs[0].rotation.x = -1.32 + Math.sin(wall * 2.2) * 0.12 * (0.4 + happy);
        hLegs[1].rotation.x = -1.32 - Math.sin(wall * 2.2) * 0.12 * (0.4 + happy);
        // página virando
        var fp = sstep(0.55, 1.15, s);
        flipG.rotation.y = -fp * (Math.PI - 0.64);
        flipG.visible = fp > 0.001 && fp < 0.999;

        // ----- Vovô Elias: fala com a mão no coração, acompanha, aprova com calma
        var talk = sstep(0.85, 1.05, s) * (1 - sstep(2.3, 2.55, s));
        var heart = sstep(1.1, 1.45, s) * (1 - sstep(2.5, 2.9, s));
        var listen = sstep(2.5, 2.9, s) * (1 - sstep(5.0, 5.3, s));
        var clap = sstep(5.05, 5.25, s) * (1 - sstep(5.85, 6.1, s));
        elias.rotation.y = -0.12 - 0.42 * (talk * 0.6 + listen + clap * 0.6);
        eB.position.y = breathe * 0.006;
        var ra = eArms[0], la = eArms[1];
        // descanso: mãos sobre os joelhos
        ra.A.rotation.set(-0.75, 0, 0.05); ra.fa.rotation.set(-0.45, 0, 0);
        la.A.rotation.set(-0.75, 0, -0.05); la.fa.rotation.set(-0.45, 0, 0);
        // mão direita (do lado do herói) ao coração
        ra.A.rotation.x -= heart * 0.35; ra.A.rotation.z += heart * 0.2; ra.fa.rotation.x -= heart * 1.15; ra.fa.rotation.z += heart * 1.05;
        // gesto aberto ao falar
        la.A.rotation.x -= talk * 0.35; la.fa.rotation.x -= talk * (0.55 + Math.sin(s * 5) * 0.12); la.A.rotation.z += talk * 0.25;
        // palmas suaves
        var cl = Math.abs(Math.sin((s - 5.05) * 9)) * clap;
        ra.A.rotation.x -= clap * 0.45; ra.A.rotation.z += clap * 0.12; ra.fa.rotation.x -= clap * 0.6; ra.fa.rotation.z += clap * (0.85 - cl * 0.2);
        la.A.rotation.x -= clap * 0.45; la.A.rotation.z -= clap * 0.12; la.fa.rotation.x -= clap * 0.6; la.fa.rotation.z -= clap * (0.85 - cl * 0.2);
        // aceno de cabeça a cada palavra
        var nod = 0;
        WORDS.forEach(function (w) { nod += pulse(w[1] + 0.05, w[1] + 0.45, s); });
        eHead.rotation.x = -0.12 + 0.12 * nod + Math.sin(s * 9) * 0.03 * talk + 0.03 * Math.sin(wall * 0.9);
        eHead.rotation.y = 0.05 * talk;
        eHead.rotation.z = 0.06 * listen + 0.04 * Math.sin(wall * 0.8);
        eMouth.scale.set(0.03 * (1 + clap * 0.3), 0.022 * (1 + talk * (0.6 + 0.6 * Math.sin(s * 20)) + clap * 0.8), 0.02);
        var bl2 = (wall + 1.7) % 4.1, blink2 = bl2 < 0.14 ? Math.abs(Math.cos(bl2 / 0.14 * Math.PI)) : 1;
        eEyes[0].scale.y = eEyes[1].scale.y = Math.max(0.1, blink2) * (0.72 - 0.3 * clap);

        // ----- ambiente: raios, névoa, orvalho, água, pássaros
        camera.getWorldPosition(tc);
        RAYS.forEach(function (r, j) {
          ax.subVectors(r.end, SUNP); var len = ax.length(); ax.divideScalar(len);
          mid.copy(SUNP).addScaledVector(ax, len * 0.5);
          bz3.subVectors(tc, mid).normalize();
          bx3.crossVectors(ax, bz3).normalize(); bz3.crossVectors(bx3, ax);
          // plano com origem no sol, eixo -y ao longo do raio
          rm.makeBasis(bx3.multiplyScalar(r.w), ax.clone().multiplyScalar(-len), bz3);
          rm.setPosition(SUNP);
          r.m.matrix.copy(rm); r.m.matrixWorldNeedsUpdate = true;
          r.m.material.opacity = (0.17 + 0.08 * Math.sin(wall * 0.45 + r.ph)) * (0.3 + 0.7 * zk);
        });
        MIST.forEach(function (m) { m.m.position.x = m.x + Math.sin(wall * 0.12 + m.ph) * 0.8; m.m.material.opacity = (m.sprite ? 0.5 : 0.8) + 0.08 * Math.sin(wall * 0.3 + m.ph); });
        for (var i = 0; i < dew.length; i++) {
          var d = dew[i], tw = Math.pow(Math.max(0, Math.sin(wall * d.sp + d.ph)), 6);
          dewCol[i * 3] = tw; dewCol[i * 3 + 1] = tw * 0.95; dewCol[i * 3 + 2] = tw * 0.85;
        }
        dewGeo.attributes.color.needsUpdate = true;
        var fy = hillH(FP.x, FP.z);
        fdrops.forEach(function (d) {
          var k = ((t / 0.7) + d.o) % 1, r0 = 0.3 + k * 0.32;
          d.m.position.set(FP.x + Math.cos(d.a) * r0, fy + 0.95 + 0.06 * Math.sin(k * Math.PI) - k * k * 0.62, FP.z + Math.sin(d.a) * r0);
        });
        fRings.forEach(function (r) { var k = ((t / 1.4) + r.o) % 1; r.m.scale.set(0.2 + k * 0.45, 1, 0.2 + k * 0.45); r.m.material.opacity = (1 - k) * 0.55; });
        BIRDS.forEach(function (b) {
          var k = ((t / LOOP) + b.o) % 1;
          b.g.position.set(-14 + k * 28, b.y + Math.sin(k * 6.28 * 2 + b.ph) * 0.25, b.z);
                    var fl = Math.sin(wall * 8 + b.ph) * 0.55;
          b.l.rotation.z = fl; b.r.rotation.z = -fl;
        });
        sunGlow.material.opacity = 0.78 + 0.08 * Math.sin(wall * 0.8);

        // brilho das palavras perto da Bíblia
        hero.updateMatrixWorld(true);
        book.getWorldPosition(wp);
        var anyW = 0;
        WORDS.forEach(function (w) { anyW = Math.max(anyW, pulse(w[1], w[1] + 0.6, s)); });
        var fin = pulse(5.0, 6.0, s);
        bookGlow.position.copy(wp); bookGlow.scale.setScalar(0.9 + 0.6 * Math.max(anyW, fin));
        bookGlow.material.opacity = 0.18 * recite + 0.45 * Math.max(anyW, fin);
        camQ.copy(camera.quaternion);
        for (i = 0; i < NSP; i++) {
          var sd = spData[i], t1 = WORDS[sd.w][1], fk = clamp((s - t1) / 0.7, 0, 1), on = s > t1 && fk < 1;
          if (!on) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
          else {
            var ee = outCubic(fk), rr = sd.r * ee;
            dummy.position.set(wp.x + Math.cos(sd.a) * rr, wp.y + 0.12 + sd.up * ee, wp.z + 0.1 + Math.sin(sd.a) * rr * 0.4);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk * 1.2) * Math.PI) + 0.0001);
          }
          dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 2 + sd.a);
          dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;

        // ----- HUD
        var xpK = sstep(5.2, 5.65, s);
        elFill.style.width = (62 + 3 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(620 + 30 * xpK);
        var fl2 = clamp((s - 5.25) / 0.5, 0, 1);
        elFlash.style.opacity = s > 5.25 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elFlash.style.left = (fl2 * 70) + '%';
        var done = sstep(5.05, 5.15, s);
        elChk.style.background = done > 0.5 ? '#43c59e' : 'transparent';
        elChk.style.borderColor = done > 0.5 ? '#43c59e' : '#e2d6cf';
        elChk.style.transform = 'scale(' + (1 + 0.3 * pulse(5.05, 5.3, s)).toFixed(3) + ')';
        elChkSvg.style.opacity = done;
        var press = pulse(2.0, 2.3, s);
        elPri.style.transform = 'translateY(' + (press * 3 * S).toFixed(2) + 'px) scale(' + (1 - press * 0.05).toFixed(3) + ')';
        var listening = s > 2.2 && s < 5.0;
        elPri.style.boxShadow = listening ? '0 0 0 ' + (3 * S).toFixed(1) + 'px rgba(185,156,255,' + (0.45 + 0.25 * Math.sin(wall * 4)).toFixed(2) + '),0 ' + (6 * S).toFixed(1) + 'px ' + (16 * S).toFixed(1) + 'px rgba(200,90,0,.3)' : '';

        // balão do Vovô Elias
        var bIn = clamp((s - 0.95) / 0.35, 0, 1), bOut = sstep(4.9, 5.2, s);
        var bsc = (bIn > 0 ? outBack(bIn, 1.8) : 0) * (1 - bOut * 0.2);
        elias.updateMatrixWorld(true);
        eHead.getWorldPosition(wp);
        var hp = proj(wp.x, wp.y + 0.36, wp.z);
        var bw2 = elBub.offsetWidth || 196, bh2 = elBub.offsetHeight || 80;
        var minTop = elQuest.offsetTop + elQuest.offsetHeight + 16 * S;
        var left = clamp(hp.x - bw2 + 46 * S, 10 * S, W - bw2 - 10 * S);
        var topB = Math.max(minTop, hp.y - bh2 - 12 * S);
        var tx2 = clamp(hp.x - left, 22 * S, bw2 - 22 * S);
        elBub.style.setProperty('--tx', tx2.toFixed(1) + 'px');
        elBub.style.transformOrigin = tx2.toFixed(0) + 'px 100%';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 1.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, bsc).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 2.5) * (1 - bOut)).toFixed(3);

        // cartão do versículo
        var vIn = sstep(1.55, 2.0, s), vOut = sstep(6.05, 6.45, s);
        elVs.style.opacity = (vIn * (1 - vOut)).toFixed(3);
        elVs.style.transform = 'translateY(' + ((1 - outCubic(vIn)) * 34 * S + vOut * 14 * S).toFixed(1) + 'px)';
        var filled = 0;
        WORDS.forEach(function (w, j) {
          var k = clamp((s - w[1]) / 0.35, 0, 1);
          if (s > w[1]) filled++;
          elWords[j].style.opacity = k.toFixed(3);
          elWords[j].style.transform = 'translateY(' + ((1 - outCubic(k)) * 6 * S).toFixed(1) + 'px)';
          var hl = pulse(w[1], w[1] + 0.9, s);
          var nextUp = s > (j ? WORDS[j - 1][1] : 2.2) && s < w[1] && listening;
          elSlots[j].style.background = k > 0 ? 'rgba(255,214,140,' + (0.28 + 0.4 * hl).toFixed(2) + ')' : (nextUp ? 'rgba(185,156,255,' + (0.12 + 0.1 * Math.sin(wall * 5)).toFixed(2) + ')' : 'transparent');
          elSlots[j].style.boxShadow = hl > 0.05 ? '0 0 ' + (12 * S * hl).toFixed(1) + 'px rgba(255,190,90,' + (0.6 * hl).toFixed(2) + ')' : '';
          elDots[j].style.background = s > w[1] + 0.1 ? '#f3b64a' : '#ece2d8';
          elDots[j].style.transform = 'scale(' + (1 + 0.5 * pulse(w[1] + 0.05, w[1] + 0.35, s)).toFixed(3) + ')';
        });
        var allDone = s > 5.0;
        elVt.style.color = allDone ? '#2a3350' : '#3a3550';
        elVs.style.boxShadow = allDone ? '0 0 0 ' + (2 * S).toFixed(1) + 'px rgba(243,182,74,' + (0.35 + 0.35 * pulse(5.0, 5.9, s)).toFixed(2) + '),0 ' + (6 * S).toFixed(1) + 'px ' + (18 * S).toFixed(1) + 'px rgba(110,60,70,.22)' : '';
        var st = allDone ? 2 : (listening ? 1 : 0);
        if (st !== mlState) {
          mlState = st;
          elMl.textContent = st === 2 ? 'Muito bem! Versículo guardado ✓' : (st === 1 ? 'Ouvindo… fale com calma' : 'Toque e fale o versículo');
          elMl.style.color = st === 2 ? '#1f9e6e' : '#6a3fb0';
          elMb.style.background = st === 2 ? 'linear-gradient(160deg,#5fd6a8,#43c59e)' : '';
          elWv.style.display = st === 2 ? 'none' : '';
        }
        elMr.forEach(function (r, j) {
          var k = ((wall * 0.8) + j * 0.5) % 1;
          r.style.transform = 'scale(' + (1 + k * 0.7).toFixed(3) + ')';
          r.style.opacity = listening ? ((1 - k) * 0.7).toFixed(3) : '0';
        });
        elBars.forEach(function (b, j) {
          var amp = listening ? (0.25 + 0.75 * speak) * (0.5 + 0.5 * Math.abs(Math.sin(wall * (7 + j * 1.3) + j))) : (allDone ? 0.18 : 0.12);
          b.style.height = ((5 + 19 * amp) * S).toFixed(1) + 'px';
          b.style.background = allDone ? '#8fe0bf' : '#b99cff';
        });

        // +30 XP
        var xk = clamp((s - 5.15) / 0.9, 0, 1);
        var xpP = proj(hero.position.x, 1.85, hero.position.z);
        elXp.style.opacity = s > 5.15 ? (xk < 0.12 ? xk / 0.12 : 1 - sstep(0.65, 1, xk)).toFixed(3) : 0;
        elXp.style.transform = 'translate(' + xpP.x.toFixed(1) + 'px,' + (xpP.y - 10 * S - 50 * S * outCubic(xk)).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.2 ? outBack(xk / 0.2, 2.0) : 1).toFixed(3) + ')';

        // transição suave: luz morna que clareia e revela o início
        var gk = t < CUT ? sstep(6.2, CUT, t) : 1 - sstep(CUT, LOOP, t);
        glowEl.style.opacity = gk.toFixed(3);
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
