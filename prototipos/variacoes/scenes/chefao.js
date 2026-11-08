/* CHEFÃO · PROVA FINAL — variação do estilo COMBINADO (aprovado). KidsSchooling
   Não é luta: é um desafio de conhecimento diante do Guardião da Ponte Antiga (pedra, madeira e musgo,
   olhos de luz âmbar, sereno). Ponte de pedra num desfiladeiro ao entardecer: céu roxo-alaranjado,
   raios de luz, poeira dourada. Câmera baixa olhando para cima, órbita lenta, vinheta e contraste.
   HUD de modo prova: tela travada, anel de tempo, pergunta, microfone com forma de onda, selo de aprovação,
   +200 XP; o guardião se curva e abre uma passagem iluminada. Loop de 7 s. Global THREE r128. */
(function () {
  'use strict';
  window.SCENES = window.SCENES || {};
  var ID = 'chefao';
  var LOOP = 7.0;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function outBack(x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pulse(s, a, d) { return s > a && s < a + d ? Math.sin((s - a) / d * Math.PI) : 0; }

  /* ---------- HUD: mesmos cartões creme + moldura dourada do modo prova ---------- */
  var CSS = [
    '.@@-root{position:absolute;inset:0;overflow:hidden;background:#3b2552;-webkit-user-select:none;user-select:none;}',
    '.@@-root canvas.@@-gl{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.@@-grade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(60,20,90,.28) 0%,rgba(60,20,90,0) 30%,rgba(255,140,60,0) 60%,rgba(40,10,60,.35) 100%);}',
    '.@@-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(95% 62% at 50% 46%,rgba(20,6,30,0) 52%,rgba(20,6,30,.62) 100%);}',
    '.@@-frame{position:absolute;inset:calc(5px*var(--s));border-radius:calc(30px*var(--s));pointer-events:none;box-shadow:inset 0 0 0 calc(2px*var(--s)) rgba(255,207,106,.9),inset 0 0 calc(26px*var(--s)) rgba(255,170,60,.35),0 0 0 calc(10px*var(--s)) rgba(20,6,30,.0);}',
    '.@@-flash{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(70% 50% at 50% 45%,#fff8e6 0%,#ffd98a 45%,#ff9a52 100%);}',
    '.@@-hud{position:absolute;inset:0;pointer-events:none;font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a3350;font-size:calc(14px*var(--s));-webkit-font-smoothing:antialiased;}',
    '.@@-card{background:#fffaf0;border-radius:calc(18px*var(--s));box-shadow:0 calc(1px*var(--s)) 0 rgba(255,255,255,.9) inset,0 0 0 calc(1px*var(--s)) rgba(120,90,50,.10),0 calc(8px*var(--s)) calc(20px*var(--s)) rgba(30,10,40,.35);}',
    '.@@-top{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px);display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(8px*var(--s)) calc(12px*var(--s)) calc(8px*var(--s)) calc(8px*var(--s));box-shadow:0 0 0 calc(2px*var(--s)) #ffcf6a,0 calc(8px*var(--s)) calc(20px*var(--s)) rgba(30,10,40,.35);}',
    '.@@-ava{position:relative;flex:none;width:calc(54px*var(--s));height:calc(54px*var(--s));}',
    '.@@-ava svg{display:block;width:100%;height:100%;}',
    '.@@-lv{position:absolute;right:calc(-4px*var(--s));bottom:calc(-3px*var(--s));min-width:calc(21px*var(--s));height:calc(21px*var(--s));border-radius:99px;background:#ff8a2a;color:#fff;font:600 calc(12.5px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;display:grid;place-items:center;box-shadow:0 0 0 calc(2.5px*var(--s)) #fffaf0;}',
    '.@@-stat{flex:1;min-width:0;}',
    '.@@-ttl{font:600 calc(17.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;white-space:nowrap;letter-spacing:.005em;}',
    '.@@-ttl span{color:#2f6fe0;}',
    '.@@-bar{position:relative;margin-top:calc(6px*var(--s));height:calc(11px*var(--s));border-radius:99px;background:#efe5d3;box-shadow:inset 0 calc(1.5px*var(--s)) calc(2px*var(--s)) rgba(80,60,30,.18);overflow:hidden;}',
    '.@@-fill{position:absolute;left:0;top:0;bottom:0;width:78%;border-radius:99px;background:linear-gradient(90deg,#43c59e,#7fdc5a);}',
    '.@@-fill:after{content:"";position:absolute;left:calc(5px*var(--s));right:calc(5px*var(--s));top:calc(2px*var(--s));height:calc(3px*var(--s));border-radius:99px;background:rgba(255,255,255,.55);}',
    '.@@-shine{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9),rgba(255,255,255,0));opacity:0;}',
    '.@@-xpn{margin-top:calc(4px*var(--s));display:flex;justify-content:space-between;font-weight:700;font-size:calc(12px*var(--s));line-height:1;color:#7b6f5e;font-variant-numeric:tabular-nums;}',
    '.@@-xpn b{color:#2a3350;font-weight:800;}',
    '.@@-lk{flex:none;width:calc(34px*var(--s));height:calc(34px*var(--s));border-radius:50%;background:#3a2152;display:grid;place-items:center;box-shadow:0 0 0 calc(2px*var(--s)) #ffcf6a;}',
    '.@@-lk svg{width:58%;height:58%;}',
    /* faixa do modo prova */
    '.@@-ban{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 38px + 80px*var(--s));display:flex;align-items:center;gap:calc(7px*var(--s));padding:calc(5px*var(--s)) calc(14px*var(--s)) calc(5px*var(--s)) calc(6px*var(--s));border-radius:99px;background:linear-gradient(180deg,#53307a,#321a4e);color:#fff3d6;font:600 calc(14px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap;box-shadow:0 0 0 calc(1.5px*var(--s)) #ffcf6a,0 calc(6px*var(--s)) calc(14px*var(--s)) rgba(20,6,30,.45);transform:translateX(-50%);overflow:hidden;}',
    '.@@-ban i{width:calc(24px*var(--s));height:calc(24px*var(--s));border-radius:50%;background:rgba(255,207,106,.18);display:grid;place-items:center;}',
    '.@@-ban i svg{width:76%;height:76%;}',
    '.@@-ban b{color:#ffcf6a;font-weight:600;}',
    '.@@-ban .@@-bsh{position:absolute;top:0;bottom:0;width:40%;background:linear-gradient(90deg,rgba(255,230,160,0),rgba(255,230,160,.35),rgba(255,230,160,0));}',
    /* cartão da pergunta + anel de tempo */
    '.@@-q{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));top:calc(env(safe-area-inset-top,0px) + 38px + 118px*var(--s));padding:calc(12px*var(--s)) calc(14px*var(--s)) calc(13px*var(--s));box-shadow:0 0 0 calc(2px*var(--s)) #ffcf6a,0 calc(8px*var(--s)) calc(22px*var(--s)) rgba(30,10,40,.4);}',
    '.@@-qh{display:flex;align-items:center;gap:calc(7px*var(--s));padding-right:calc(54px*var(--s));}',
    '.@@-qtag{display:inline-flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#3a2152;color:#ffcf6a;font:600 calc(12.5px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;white-space:nowrap;}',
    '.@@-qtag svg{width:calc(19px*var(--s));height:calc(19px*var(--s));}',
    '.@@-qwho{font-weight:800;font-size:calc(12px*var(--s));color:#7b6f5e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.@@-qt{margin-top:calc(8px*var(--s));font:600 calc(17px*var(--s))/1.22 "Fredoka","Baloo 2",system-ui,sans-serif;color:#2a3350;}',
    '.@@-qt b{font-weight:600;color:#7a3fc0;}',
    '.@@-ok{position:absolute;right:calc(12px*var(--s));bottom:calc(-13px*var(--s));display:flex;align-items:center;gap:calc(4px*var(--s));padding:calc(4px*var(--s)) calc(11px*var(--s)) calc(4px*var(--s)) calc(5px*var(--s));border-radius:99px;background:#2fb582;color:#fff;font:600 calc(13px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;opacity:0;box-shadow:0 0 0 calc(2px*var(--s)) #fffaf0,0 calc(4px*var(--s)) calc(10px*var(--s)) rgba(20,90,60,.35);}',
    '.@@-ok svg{width:calc(17px*var(--s));height:calc(17px*var(--s));}',
    '.@@-ring{position:absolute;right:calc(-6px*var(--s));top:calc(-14px*var(--s));width:calc(62px*var(--s));height:calc(62px*var(--s));border-radius:50%;background:#fffaf0;box-shadow:0 0 0 calc(2px*var(--s)) #ffcf6a,0 calc(5px*var(--s)) calc(12px*var(--s)) rgba(30,10,40,.35);}',
    '.@@-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);}',
    '.@@-rt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 calc(16px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a2152;font-variant-numeric:tabular-nums;}',
    '.@@-rt small{font:800 calc(9px*var(--s))/1 "Nunito Sans",system-ui,sans-serif;color:#9a8b74;letter-spacing:.06em;text-transform:uppercase;margin-top:calc(2px*var(--s));}',
    /* microfone */
    '.@@-mic{position:absolute;left:calc(12px*var(--s));right:calc(12px*var(--s));bottom:calc(env(safe-area-inset-bottom,0px) + 20px);height:calc(104px*var(--s));box-shadow:0 0 0 calc(2px*var(--s)) #ffcf6a,0 calc(8px*var(--s)) calc(22px*var(--s)) rgba(30,10,40,.4);}',
    '.@@-wv{position:absolute;top:calc(20px*var(--s));height:calc(46px*var(--s));display:flex;align-items:center;gap:calc(3.5px*var(--s));}',
    '.@@-wv i{display:block;width:calc(5px*var(--s));height:calc(6px*var(--s));border-radius:99px;background:linear-gradient(180deg,#ffb04a,#ff7a1a);}',
    '.@@-wv.l{left:calc(14px*var(--s));right:calc(50% + 50px*var(--s));justify-content:flex-end;}',
    '.@@-wv.r{right:calc(14px*var(--s));left:calc(50% + 50px*var(--s));justify-content:flex-start;}',
    '.@@-mb{position:absolute;left:50%;top:calc(-28px*var(--s));width:calc(88px*var(--s));height:calc(88px*var(--s));margin-left:calc(-44px*var(--s));border-radius:50%;background:radial-gradient(circle at 50% 35%,#ffab52,#ff7a1a 70%);display:grid;place-items:center;box-shadow:0 0 0 calc(5px*var(--s)) #fffaf0,0 0 0 calc(7px*var(--s)) #ffcf6a,0 calc(8px*var(--s)) calc(18px*var(--s)) rgba(200,80,0,.45);}',
    '.@@-mb svg{width:48%;height:48%;}',
    '.@@-halo{position:absolute;left:50%;top:calc(16px*var(--s));width:calc(88px*var(--s));height:calc(88px*var(--s));margin:calc(-44px*var(--s)) 0 0 calc(-44px*var(--s));border-radius:50%;border:calc(3px*var(--s)) solid #ffb04a;opacity:0;box-sizing:border-box;}',
    '.@@-ml{position:absolute;left:0;right:0;bottom:calc(11px*var(--s));display:flex;align-items:center;justify-content:center;gap:calc(6px*var(--s));font:600 calc(15px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#3a2152;white-space:nowrap;}',
    '.@@-dot{width:calc(9px*var(--s));height:calc(9px*var(--s));border-radius:50%;background:#ff5a4a;box-shadow:0 0 0 calc(3px*var(--s)) rgba(255,90,74,.25);}',
    /* selo, XP e fala do guardião */
    '.@@-seal{position:absolute;left:0;top:0;width:calc(190px*var(--s));height:calc(190px*var(--s));opacity:0;}',
    '.@@-seal svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 calc(8px*var(--s)) calc(14px*var(--s)) rgba(30,10,40,.45));}',
    '.@@-burst{position:absolute;left:0;top:0;width:calc(300px*var(--s));height:calc(300px*var(--s));border-radius:50%;opacity:0;background:repeating-conic-gradient(from 0deg,rgba(255,222,140,.55) 0deg 7deg,rgba(255,222,140,0) 7deg 22.5deg);-webkit-mask:radial-gradient(circle,#000 18%,transparent 68%);mask:radial-gradient(circle,#000 18%,transparent 68%);}',
    '.@@-xp{position:absolute;left:0;top:0;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:calc(7px*var(--s));padding:calc(7px*var(--s)) calc(16px*var(--s)) calc(7px*var(--s)) calc(7px*var(--s));border-radius:99px;background:linear-gradient(180deg,#ffd86a,#f2a71a);box-shadow:0 0 0 calc(3px*var(--s)) #fffaf0,0 0 calc(26px*var(--s)) rgba(255,200,90,.85),0 calc(8px*var(--s)) calc(16px*var(--s)) rgba(120,60,0,.35);font:600 calc(26px*var(--s))/1 "Fredoka","Baloo 2",system-ui,sans-serif;color:#5a2e00;letter-spacing:.01em;}',
    '.@@-xp svg{width:calc(30px*var(--s));height:calc(30px*var(--s));}',
    '.@@-bub{position:absolute;left:0;top:0;width:calc(178px*var(--s));padding:calc(16px*var(--s)) calc(14px*var(--s)) calc(11px*var(--s));opacity:0;transform-origin:0 100%;}',
    '.@@-bub .@@-tail{position:absolute;left:calc(-7px*var(--s));top:var(--ty,30px);width:calc(20px*var(--s));height:calc(20px*var(--s));background:#fffaf0;transform:translateX(-50%) rotate(45deg);border-radius:calc(3px*var(--s));}',
    '.@@-nm{position:absolute;left:calc(12px*var(--s));top:calc(-12px*var(--s));display:flex;align-items:center;gap:calc(5px*var(--s));padding:calc(3px*var(--s)) calc(10px*var(--s)) calc(3px*var(--s)) calc(4px*var(--s));border-radius:99px;background:#3a2152;color:#ffcf6a;font:600 calc(13px*var(--s))/1.1 "Fredoka","Baloo 2",system-ui,sans-serif;box-shadow:0 calc(3px*var(--s)) calc(6px*var(--s)) rgba(30,10,40,.3);white-space:nowrap;}',
    '.@@-nm svg{width:calc(18px*var(--s));height:calc(18px*var(--s));}',
    '.@@-say{position:relative;font-weight:700;font-size:calc(15px*var(--s));line-height:1.25;color:#2a3350;}'
  ].join('\n').replace(/@@/g, ID);
  function H(str) { return str.replace(/@@/g, ID); }

  var AVATAR = H('<svg viewBox="0 0 64 64"><defs><linearGradient id="@@-avbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ffeedc"/></linearGradient><clipPath id="@@-avc"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
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
  var IC_LOCK = '<svg viewBox="0 0 24 24"><path d="M7.6 10.5V8a4.4 4.4 0 0 1 8.8 0v2.5" stroke="#ffcf6a" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="4.5" y="10" width="15" height="11" rx="3.2" fill="#ffc93c"/><rect x="4.5" y="10" width="15" height="3.6" rx="1.8" fill="#ffe08a"/><circle cx="12" cy="15.3" r="1.7" fill="#7a4a12"/><rect x="11.2" y="15.8" width="1.6" height="3" rx=".8" fill="#7a4a12"/></svg>';
  var IC_MIC = '<svg viewBox="0 0 32 32"><rect x="11" y="3.5" width="10" height="16.5" rx="5" fill="#fff"/><path d="M7.5 15a8.5 8.5 0 0 0 17 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M16 23.5V28M11.5 28.2h9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M13.6 8.5h4.8M13.6 12h4.8" stroke="#ffc48a" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var IC_GUARD = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><rect x="5.2" y="5.5" width="13.6" height="13" rx="4" fill="#bfae98"/><rect x="4.6" y="7.2" width="14.8" height="2.6" rx="1.2" fill="#8a5a34"/><ellipse cx="9.2" cy="12" rx="1.7" ry="1.25" fill="#ffb238"/><ellipse cx="14.8" cy="12" rx="1.7" ry="1.25" fill="#ffb238"/><path d="M5.2 15.5q6.8 6.5 13.6 0v3H5.2z" fill="#6f9e44"/><path d="M10 15q2 1.3 4 0" stroke="#5a4636" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M12 5.5V3.2M12 3.5q2-1.6 3.4-.4" stroke="#6f9e44" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';
  var IC_XPG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fffaf0"/><circle cx="12" cy="12" r="9" fill="#ff9b2a"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  var IC_CHECKW = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M6.5 12.5l3.6 3.6 7.4-8" stroke="#2fb582" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.4l-5.4 3 1.2-6.1-4.5-4.2 6.1-.7z" fill="#ffcf6a"/></svg>';
  function sealSVG() {
    var n = 26, R1 = 92, R2 = 84, d = '';
    for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? R2 : R1; d += (i ? 'L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1); }
    return H('<svg viewBox="0 0 200 200"><defs><linearGradient id="@@-sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f2a71a"/></linearGradient>' +
      '<linearGradient id="@@-sh" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="@@-sc"><path d="' + d + 'Z"/></clipPath></defs>' +
      '<path d="' + d + 'Z" fill="url(#@@-sg)" stroke="#d98a12" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="100" r="66" fill="#fffaf0" stroke="#f2a71a" stroke-width="4"/><circle cx="100" cy="100" r="58" fill="none" stroke="#ffcf6a" stroke-width="1.6" stroke-dasharray="3 4"/>' +
      '<circle cx="100" cy="88" r="30" fill="#2fb582"/><path d="M85 88.5l10 10 20-21" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M62 62l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#ffcf6a"/><path d="M138 62l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#ffcf6a"/>' +
      '<g clip-path="url(#@@-sc)"><rect class="@@-sshine" x="-200" y="0" width="200" height="200" fill="url(#@@-sh)"/></g>' +
      '<path d="M8 128h22l-8 12 8 12H8z" fill="#1f8a63"/><path d="M192 128h-22l8 12-8 12h22z" fill="#1f8a63"/>' +
      '<path d="M22 120h156v28H22z" fill="#2fb582"/><path d="M22 148l10 6v-6zM178 148l-10 6v-6z" fill="#17694b"/>' +
      '<text x="100" y="139.5" text-anchor="middle" font-family="Fredoka,\'Baloo 2\',system-ui,sans-serif" font-weight="600" font-size="19" fill="#fff" letter-spacing=".3">Resposta aprovada</text></svg>');
  }

  window.SCENES[ID] = {
    mount: function (host) {
      var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var W = host.clientWidth || 390, Hh = host.clientHeight || 844;
      var R = rng(77011);
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
      renderer.setClearColor(0x3b2552);
      var cv = renderer.domElement; cv.className = ID + '-gl'; root.appendChild(cv);

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x8a5a8e, 16, 78);
      var camera = new THREE.PerspectiveCamera(48, W / Hh, 0.3, 260);

      /* rim light forte e quente (contraluz do pôr do sol) */
      var rimU = { uRimColor: { value: new THREE.Color(0xffb46e) }, uRimStr: { value: 0.95 } };
      function addRim(m) {
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uRimColor = rimU.uRimColor; sh.uniforms.uRimStr = rimU.uRimStr;
          sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimStr;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n totalEmissiveRadiance += uRimColor * (rimF * rimF * rimF) * uRimStr;');
        };
        m.customProgramCacheKey = function () { return ID + '-rim' + (m.flatShading ? 'f' : '') + (m.vertexColors ? 'v' : ''); };
        return m;
      }
      var mats = {};
      function M(color, o) {
        var key = color + (o ? JSON.stringify(o) : '');
        if (mats[key]) return mats[key];
        var p = { color: color, roughness: 0.8, metalness: 0 };
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
      function block(w, h, d, col, x, y, z, ry, parent, r, o) {
        var m = new THREE.Mesh(rbox(w, h, d, r || Math.min(0.07, h * 0.3, w * 0.3, d * 0.3)), M(col, o || { roughness: 0.8 }));
        m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true;
        (parent || scene).add(m); return m;
      }
      function mkCanvas(w, h, fn) { var cc = document.createElement('canvas'); cc.width = w; cc.height = h; fn(cc.getContext('2d'), w, h); return cc; }
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

      /* ----- céu de entardecer (degradê roxo -> laranja + halo do sol) ----- */
      var SUN_DIR = new THREE.Vector3(-0.32, 0.075, -1).normalize();
      var skyMat = new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN_DIR }, uGlow: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform vec3 uSun; uniform float uGlow; varying vec3 vDir;',
          'void main(){',
          '  float h = vDir.y;',
          '  vec3 hor = vec3(1.0, 0.80, 0.50), low = vec3(0.98, 0.50, 0.36), mid = vec3(0.62, 0.30, 0.56), top = vec3(0.22, 0.14, 0.42);',
          '  vec3 c = mix(hor, low, smoothstep(-0.02, 0.10, h));',
          '  c = mix(c, mid, smoothstep(0.10, 0.36, h));',
          '  c = mix(c, top, smoothstep(0.36, 0.95, h));',
          '  c = mix(c, vec3(0.42, 0.22, 0.42), smoothstep(0.0, -0.25, h));',
          '  float sd = max(dot(vDir, uSun), 0.0);',
          '  c += vec3(1.0, 0.62, 0.30) * pow(sd, 6.0) * 0.45 + vec3(1.0, 0.86, 0.6) * pow(sd, 60.0) * (0.6 + uGlow * 0.3) + vec3(1.0, 0.97, 0.88) * smoothstep(0.9993, 0.9996, sd);',
          '  gl_FragColor = vec4(c, 1.0);',
          '}'
        ].join('\n')
      });
      var sky = new THREE.Mesh(G('skysph', function () { return new THREE.SphereGeometry(200, 32, 18); }), skyMat); sky.renderOrder = -10; scene.add(sky);

      /* raios de luz (leque girando atrás do guardião) */
      var raysT = keep(new THREE.CanvasTexture(mkCanvas(512, 512, function (g, w, h) {
        g.translate(w / 2, h / 2);
        var rr = rng(5);
        for (var k = 0; k < 18; k++) {
          var a = k / 18 * Math.PI * 2 + rr() * 0.2, wd = 0.05 + rr() * 0.07;
          var gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
          gr.addColorStop(0, 'rgba(255,236,190,0.9)'); gr.addColorStop(0.35, 'rgba(255,200,130,0.35)'); gr.addColorStop(1, 'rgba(255,170,110,0)');
          g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, w / 2, a - wd, a + wd); g.closePath(); g.fill();
        }
      })));
      var rays = new THREE.Mesh(G('plane', function () { return new THREE.PlaneGeometry(1, 1); }), new THREE.MeshBasicMaterial({ map: raysT, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      rays.renderOrder = -9; scene.add(rays);
      var glowT = keep(new THREE.CanvasTexture(mkCanvas(128, 128, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,200,0.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      })));
      // feixes volumétricos atravessando o desfiladeiro
      var shaftT = keep(new THREE.CanvasTexture(mkCanvas(64, 256, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, w, 0);
        gr.addColorStop(0, 'rgba(255,210,150,0)'); gr.addColorStop(0.5, 'rgba(255,210,150,1)'); gr.addColorStop(1, 'rgba(255,210,150,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        var g2 = g.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.25, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalCompositeOperation = 'destination-in'; g.fillStyle = g2; g.fillRect(0, 0, w, h);
      })));
      var shafts = [[-2.6, 5.5, -9, 1.6, 0.42], [1.8, 6.5, -12, 2.2, 0.36], [-0.4, 7.5, -16, 3.0, 0.48], [3.6, 6, -7, 1.2, 0.5]].map(function (q, k) {
        var m = new THREE.Mesh(G('plane'), new THREE.MeshBasicMaterial({ map: shaftT, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
        m.position.set(q[0], q[1], q[2]); m.scale.set(q[3], 16, 1); m.rotation.set(0, 0.3, q[4]); m.renderOrder = 8; scene.add(m);
        return { m: m, base: 0.08 + k * 0.012, ph: k * 1.7 };
      });

      /* nuvens e mesas distantes (silhuetas na névoa) */
      var CLOUD = [];
      [[-30, 22, -110, 22, 3.2, 0xd88aa0], [18, 30, -120, 26, 3.6, 0xb978a8], [40, 18, -100, 16, 2.6, 0xf0a08a], [-8, 38, -130, 30, 4, 0x8c66b0], [-48, 30, -95, 18, 3, 0xa874a8], [6, 14, -90, 14, 2, 0xffb68a]].forEach(function (q) {
        for (var k = 0; k < 3; k++) CLOUD.push({ x: q[0] + (k - 1) * q[3] * 0.55, y: q[1] + (k === 1 ? q[4] * 0.5 : 0), z: q[2], sx: q[3] * (k === 1 ? 0.7 : 0.5), sy: q[4] * (k === 1 ? 1.2 : 0.8), sz: 4, c: q[5] });
      });
      instanced(gSphLo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), CLOUD, false);
      var MESA = [];
      [[-34, -70, 14, 9, 0x8a5a92], [-14, -82, 10, 6, 0x9a6496], [22, -76, 18, 11, 0x84588e], [44, -64, 12, 8, 0x7a4f88], [-56, -58, 14, 12, 0x77508a], [6, -95, 22, 7, 0xa06a98]].forEach(function (q) {
        MESA.push({ x: q[0], y: q[3] / 2 - 8, z: q[1], sx: q[2], sy: q[3] + 8, sz: q[2] * 0.6, c: q[4] });
        MESA.push({ x: q[0] + q[2] * 0.1, y: q[3] - 7.6 + 1.2, z: q[1] + 1, sx: q[2] * 0.8, sy: 2.4, sz: q[2] * 0.5, c: q[4] });
      });
      instanced(rbox(1, 1, 1, 0.12), M(0xffffff, { roughness: 1 }), MESA, false);

      /* ----- luzes: contraluz quente + preenchimento lilás ----- */
      var hemi = new THREE.HemisphereLight(0x9a90d6, 0x50304a, 0.72); scene.add(hemi);
      var key = new THREE.DirectionalLight(0xffa860, 1.45);
      key.position.set(-5.5, 9, -14); key.target.position.set(0, 0, -1.5); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      var ksc = key.shadow.camera; ksc.left = -7; ksc.right = 7; ksc.top = 9; ksc.bottom = -9; ksc.near = 2; ksc.far = 40;
      key.shadow.bias = -0.0008; key.shadow.normalBias = 0.03; key.shadow.radius = 3;
      scene.add(key); scene.add(key.target);
      var fill = new THREE.DirectionalLight(0xa8b0ff, 0.5); fill.position.set(6, 5, 12); scene.add(fill);
      var warm = new THREE.DirectionalLight(0xffb27a, 0.16); warm.position.set(-8, 2.5, 9); scene.add(warm);
      var gateL = new THREE.PointLight(0xffc870, 0, 18, 2); gateL.position.set(1.6, 2.2, -7.0); scene.add(gateL);

      /* ----- desfiladeiro: paredes de pedra em camadas (instanciadas) ----- */
      var ROCKC = [0xd98a5f, 0xc77656, 0xe3a173, 0xb86a5a, 0xcf8466];
      var ROCKS = [];
      function column(x, z, w, d, topY, k0) {
        var y = -26, j = 0;
        while (y < topY) {
          var hh = Math.min(1.4 + R() * 1.6, topY - y), inset = (topY - y) < 5 ? (1 - (topY - y) / 5) * 0.25 : 0;
          ROCKS.push({ x: x + (R() - 0.5) * 0.25, y: y + hh / 2, z: z + (R() - 0.5) * 0.25, sx: w * (1 - inset), sy: hh, sz: d * (1 - inset), ry: (R() - 0.5) * 0.12, c: ROCKC[(k0 + j) % 5] });
          y += hh; j++;
        }
      }
      // penhasco do fundo (onde fica o portal), mais baixo no centro
      for (var xi = -11; xi <= 11; xi++) {
        var ax = Math.abs(xi);
        var top = ax < 2 ? 3.6 : 3.6 + Math.pow(ax - 1.5, 1.25) * 0.75 + (R() - 0.5) * 0.8;
        column(xi * 1.5, -10.6 - R() * 0.6 - ax * 0.12, 1.6, 3.2, top, xi + 11);
      }
      // agulhas de rocha nas laterais, emoldurando o guardião
      [[-3.6, -6.5, 7.5], [-4.6, -3.0, 9.5], [-3.3, -9.2, 5.5], [3.7, -5.5, 6.5], [4.6, -1.5, 10.5], [3.4, -8.8, 4.8], [-6.5, -12, 11], [6.8, -13, 12], [-5.6, 1.8, 6], [5.8, 2.6, 7], [-6.2, 7, 5], [6.4, 8, 6]].forEach(function (q, k) {
        column(q[0], q[1], 1.5 + R() * 0.8, 1.5 + R() * 0.8, q[2], k);
        column(q[0] + (q[0] > 0 ? 0.9 : -0.9), q[1] - 0.7, 1.2, 1.3, q[2] * 0.72, k + 2);
      });
      // paredes do cânion recuando para os lados
      for (var zi = 0; zi < 9; zi++) {
        [-1, 1].forEach(function (sg) { column(sg * (8 + zi * 1.2 + R()), -14 - zi * 4, 3.4, 3.4, 9 + R() * 6, zi); });
      }
      instanced(rbox(1, 1, 1, 0.1), M(0xffffff, { roughness: 0.92 }), ROCKS, true);
      // musgo nos topos
      var MOSS = [];
      ROCKS.forEach(function (r) { if (r.y + r.sy / 2 > 2.5 && R() < 0.35) MOSS.push({ x: r.x, y: r.y + r.sy / 2, z: r.z, sx: r.sx * 0.42, sy: 0.16, sz: r.sz * 0.42, c: R() < 0.5 ? 0x6f9e44 : 0x5c8a3a }); });
      instanced(gSphLo, M(0xffffff, { roughness: 0.9 }), MOSS, false);

      /* ----- ponte antiga de pedra ----- */
      var STONE_A = 0xcfae8e, STONE_B = 0xbe9b7c, STONE_C = 0xd9bc9c, PINC = 0xe9c98a, TEAL = 0x2fb5a3;
      var BW = 1.5, PINS = [], BOWS = [];
      function addPin(x, y, z, col) { PINS.push({ x: x, y: y + 0.025, z: z, sx: 1.5, sy: 1.5, sz: 1.5, c: col }); }
      for (var bz = 17.2; bz >= -10; bz -= 0.8) {
        var cc2 = [0xa78672, 0x9a7a68, 0xb08f78][Math.round(Math.abs(bz) * 1.25) % 3];
        block(BW * 2 - 0.04, 0.32, 0.76, cc2, Math.sin(bz * 2.3) * 0.02, -0.16 + Math.sin(bz * 3.1) * 0.012, bz, Math.sin(bz * 1.7) * 0.012, null, 0.06);
      }
      // corpo da ponte e arco por baixo
      block(BW * 2 + 0.2, 1.4, 28, 0xa9876c, 0, -1.05, 3.6, 0, null, 0.12);
      [-1.6, 6.4, 13.5].forEach(function (pz) { block(BW * 2 - 0.4, 24, 2.0, 0x9a7a62, 0, -13, pz, 0, null, 0.2); });
      // parapeitos com pinos e musgo (com falhas antigas)
      [-1, 1].forEach(function (sg) {
        for (var pz2 = 17.0; pz2 >= -9.6; pz2 -= 0.9) {
          if ((sg < 0 && Math.abs(pz2 - 0.2) < 0.4) || (sg > 0 && Math.abs(pz2 + 6.1) < 0.4)) continue;
          var hh2 = 0.5 + Math.sin(pz2 * 4.1 + sg) * 0.05;
          block(0.36, hh2, 0.84, [STONE_B, STONE_A, STONE_C][Math.round(Math.abs(pz2 * 3) + sg) % 3], sg * (BW - 0.1), hh2 / 2, pz2, Math.sin(pz2 * 2.7) * 0.03, null, 0.06);
          addPin(sg * (BW - 0.1), hh2, pz2, PINC);
          if (pz2 < 4 && Math.sin(pz2 * 5.3 + sg * 2) > 0.35) mesh(gSphLo, M(0x6f9e44, { roughness: 0.9 }), 0.2, 0.08, 0.36, sg * (BW - 0.1), hh2 + 0.03, pz2 + 0.1, scene);
        }
        // postes de lanterna
        [5.2, 0.6, -2.6].forEach(function (lz) {
          block(0.3, 1.25, 0.3, 0xa98468, sg * (BW - 0.1), 0.6, lz, 0, null, 0.06);
          block(0.44, 0.12, 0.44, 0x8a5a34, sg * (BW - 0.1), 1.28, lz, 0, null, 0.04);
        });
      });
      // pedras soltas e florzinhas no musgo da ponte
      var FLW = [];
      for (var fi = 0; fi < 34; fi++) { var fz = 10 - R() * 20, fx = (R() < 0.5 ? -1 : 1) * (BW - 0.35 - R() * 0.15); FLW.push({ x: fx, y: 0.04, z: fz, sx: 0.05, sy: 0.035, sz: 0.05, c: [0xffffff, 0xff9ac1, 0xffd23f, 0xb48cff][fi % 4] }); }
      instanced(gSphLo, M(0xffffff, { roughness: 0.6 }), FLW, false);
      // lanternas (brilho)
      var lampMat = new THREE.SpriteMaterial({ map: glowT, color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
      var lamps = [];
      [-1, 1].forEach(function (sg) { [5.2, 0.6, -2.6].forEach(function (lz) {
        var orb = mesh(gSphLo, new THREE.MeshBasicMaterial({ color: 0xffd58a }), 0.11, 0.11, 0.11, sg * (BW - 0.1), 1.46, lz, scene, true);
        var sp = new THREE.Sprite(lampMat); sp.position.set(sg * (BW - 0.1), 1.46, lz); sp.scale.setScalar(0.9); scene.add(sp); lamps.push(sp);
      }); });

      /* ----- portal na rocha, ao fundo: passagem que se ilumina ----- */
      var GATE_Z = -8.2;
      var GATE_X = 1.75;
      var gate = new THREE.Group(); gate.position.set(GATE_X, 0, GATE_Z); gate.scale.setScalar(1.05); gate.rotation.y = -0.1; scene.add(gate);
      (function () {
        [-1, 1].forEach(function (sg) { for (var k = 0; k < 3; k++) block(0.6, 0.78, 0.7, k % 2 ? 0xd9bc9c : 0xcfae8e, sg * 1.25, 0.39 + k * 0.8, 0, 0, gate, 0.08); });
        var NA = 9;
        for (var k2 = 0; k2 < NA; k2++) {
          var a = k2 / (NA - 1) * Math.PI, rr2 = 1.25;
          var bm = block(0.62, 0.42, 0.72, k2 === 4 ? 0xffd27a : (k2 % 2 ? 0xd9bc9c : 0xcfae8e), Math.cos(a) * rr2, 2.38 + Math.sin(a) * rr2 * 0.95, 0, 0, gate, 0.08);
          bm.rotation.z = a - Math.PI / 2;
        }
      })();
      var gateInMat = new THREE.MeshBasicMaterial({ color: 0x2a1530 });
      var gateIn = new THREE.Mesh(G('gateshape', function () {
        var sh = new THREE.Shape(); sh.moveTo(-0.95, 0); sh.lineTo(0.95, 0); sh.lineTo(0.95, 2.38); sh.absarc(0, 2.38, 0.95, 0, Math.PI, false); sh.lineTo(-0.95, 0);
        return new THREE.ShapeGeometry(sh, 16);
      }), gateInMat);
      gateIn.position.set(0, 0, -0.2); gate.add(gateIn);
      var doors = [-1, 1].map(function (sg) {
        var piv = new THREE.Group(); piv.position.set(sg * 0.95, 0, 0.02); gate.add(piv);
        var d = block(0.95, 3.2, 0.12, 0x8a5a34, -sg * 0.475, 1.6, 0, 0, piv, 0.04);
        [0.7, 1.6, 2.5].forEach(function (yy) { block(0.97, 0.12, 0.05, 0x5f3a20, -sg * 0.475, yy, 0.07, 0, piv, 0.02); });
        var knob = mesh(gSphLo, M(0xffc93c, { roughness: 0.4 }), 0.06, 0.06, 0.06, -sg * 0.85, 1.4, 0.1, piv);
        return piv;
      });
      // máscara do topo da porta (arco): esconde o retângulo acima do arco
      var gateGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffd28a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      gateGlow.position.set(GATE_X, 2.2, GATE_Z + 0.5); gateGlow.scale.set(6, 6, 1); scene.add(gateGlow);
      var gateBeam = new THREE.Mesh(G('plane'), new THREE.MeshBasicMaterial({ map: shaftT, color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      gateBeam.position.set(GATE_X - 0.4, 0.02, GATE_Z + 4.5); gateBeam.rotation.set(-Math.PI / 2, 0, 0.12); gateBeam.scale.set(2.4, 9, 1); scene.add(gateBeam);
      // caminho de luz no piso
      var PATHN = 18, pathTiles = [];
      for (var pi = 0; pi < PATHN; pi++) {
        var pm = new THREE.Mesh(G('plane'), new THREE.MeshBasicMaterial({ color: 0xffb347, map: glowT, transparent: true, opacity: 0, depthWrite: false, fog: false }));
        var pz3 = GATE_Z + 0.9 + pi * 0.8, px3 = lerp(GATE_X - 0.4, 0.45, sstep(0, PATHN * 0.6, pi));
        pm.position.set(px3, 0.05, pz3); pm.rotation.x = -Math.PI / 2; pm.scale.set(1.5, 1.1, 1); pm.renderOrder = 3; scene.add(pm);
        pathTiles.push(pm);
        var mo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffd58a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        mo.position.set(px3, 0.16, pz3); mo.scale.set(1.5, 0.7, 1); scene.add(mo); pm.userData.mo = mo;
      }

      /* ----- GUARDIÃO DA PONTE ANTIGA (pedra, madeira e musgo; olhos âmbar; sereno) ----- */
      var GST = 0xcbbba4, GST2 = 0xb8a690, GST3 = 0xd9cbb5, GWOOD = 0x8a5a34, GWOOD2 = 0x6f4526, MOSSC = 0x6f9e44, MOSSC2 = 0x5c8a3a;
      var guard = new THREE.Group(); guard.position.set(0, 0, -4.2); scene.add(guard);
      var gBody = new THREE.Group(); guard.add(gBody);
      var GS = 1.0; gBody.scale.setScalar(GS);
      // pernas = pilares de ponte
      [-1, 1].forEach(function (sg) {
        block(0.98, 0.36, 1.18, GST2, sg * 0.62, 0.18, 0.08, 0, gBody, 0.1);
        block(0.74, 1.55, 0.74, GST, sg * 0.62, 1.12, 0, 0, gBody, 0.12);
        block(0.8, 0.16, 0.8, GWOOD, sg * 0.62, 1.2, 0, 0, gBody, 0.04);
        mesh(gSphLo, M(MOSSC), 0.36, 0.12, 0.36, sg * 0.62, 1.92, 0.05, gBody);
      });
      var torso = new THREE.Group(); torso.position.set(0, 1.95, 0); gBody.add(torso);
      block(1.95, 0.5, 1.05, GWOOD, 0, 0.12, 0, 0, torso, 0.1);
      [-1, 1].forEach(function (sg) { var bw = new THREE.Mesh(gBow, M(TEAL, { roughness: 0.5 })); bw.position.set(sg * 0.98, 0.12, 0.2); bw.rotation.y = sg * Math.PI / 2; bw.scale.setScalar(2.4); torso.add(bw); });
      block(2.2, 1.7, 1.22, GST, 0, 1.15, 0, 0, torso, 0.22);
      block(1.9, 0.5, 1.1, GST3, 0, 2.02, -0.02, 0, torso, 0.2);
      // peitoral de madeira com o emblema da ponte (arco âmbar)
      block(1.3, 0.95, 0.14, GWOOD, 0, 1.2, 0.62, 0, torso, 0.05);
      block(1.36, 0.1, 0.16, GWOOD2, 0, 1.68, 0.63, 0, torso, 0.03);
      var runeMat = new THREE.MeshBasicMaterial({ color: 0xffb648 });
      var rune = new THREE.Mesh(G('runearc', function () { return new THREE.TorusGeometry(0.34, 0.055, 6, 20, Math.PI); }), runeMat); rune.position.set(0, 1.0, 0.7); torso.add(rune);
      var runeB = new THREE.Mesh(rbox(0.86, 0.07, 0.04, 0.02), runeMat); runeB.position.set(0, 1.0, 0.7); torso.add(runeB);
      [-1, 1].forEach(function (sg) { var rp = new THREE.Mesh(rbox(0.07, 0.3, 0.04, 0.02), runeMat); rp.position.set(sg * 0.34, 0.86, 0.7); torso.add(rp); });
      // fissuras luminosas
      var crackMat = new THREE.MeshBasicMaterial({ color: 0xffa83c });
      [[-0.75, 1.5, 0.62, 0.5, 0.35], [0.8, 0.85, 0.62, 0.45, -0.5], [-0.62, 0.62, 0.62, 0.3, 0.9]].forEach(function (q) { var cm = new THREE.Mesh(rbox(0.035, q[3], 0.02, 0.01), crackMat); cm.position.set(q[0], q[1], q[2]); cm.rotation.z = q[4]; torso.add(cm); });
      // pinos hexagonais nos ombros (identidade dos blocos)
      var gPins = [];
      [-0.6, -0.2, 0.2, 0.6].forEach(function (px) { var pm2 = new THREE.Mesh(gHex, M(PINC, { roughness: 0.6, flatShading: true })); pm2.scale.setScalar(2.2); pm2.position.set(px, 2.3, 0.3); torso.add(pm2); });
      // musgo e flores no topo do tronco
      [[-0.75, 2.28, 0.0, 0.55], [0.7, 2.27, -0.1, 0.5], [0, 2.3, -0.3, 0.6]].forEach(function (q) { mesh(gSphLo, M(MOSSC), q[3], 0.16, q[3] * 0.8, q[0], q[1], q[2], torso); });
      [[-0.6, 2.4, 0.25, 0xff9ac1], [0.55, 2.39, 0.2, 0xffffff], [0.78, 2.37, -0.15, 0xffd23f], [-0.85, 2.36, -0.2, 0xffffff]].forEach(function (q) { ball(q[3], 0.06, q[0], q[1], q[2], torso); });
      // ombros (rochas redondas com musgo)
      var arms = [-1, 1].map(function (sg) {
        var sh = new THREE.Group(); sh.position.set(sg * 1.32, 1.85, 0); torso.add(sh);
        mesh(gSph, M(GST2), 0.56, 0.52, 0.56, 0, 0, 0, sh);
        mesh(gHemi, M(MOSSC), 0.5, 0.26, 0.5, 0, 0.26, 0, sh);
        ball(0xff9ac1, 0.05, sg * 0.1, 0.5, 0.2, sh); ball(0xffffff, 0.045, -sg * 0.15, 0.48, 0.1, sh);
        var up = block(0.56, 1.0, 0.56, GST, 0, -0.62, 0, 0, sh, 0.12);
        var elbow = new THREE.Group(); elbow.position.set(0, -1.12, 0); sh.add(elbow);
        var bw = new THREE.Mesh(gBow, M(TEAL, { roughness: 0.5 })); bw.position.set(sg * 0.29, 0, 0); bw.rotation.y = sg * Math.PI / 2; bw.scale.setScalar(2.2); elbow.add(bw);
        block(0.5, 0.95, 0.5, GWOOD, 0, -0.45, 0, 0, elbow, 0.08);
        [-0.2, -0.65].forEach(function (yy) { mesh(gCyl, M(0xd9c08a, { roughness: 0.9 }), 0.27, 0.07, 0.27, 0, yy, 0, elbow); });
        var hand = block(0.62, 0.5, 0.5, GST3, 0, -1.08, 0.04, 0, elbow, 0.16);
        // cipós pendurados
        var vine = new THREE.Mesh(G('vine' + sg, function () { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0.3), new THREE.Vector3(sg * 0.1, -0.35, 0.36), new THREE.Vector3(sg * 0.05, -0.8, 0.33)]), 10, 0.03, 5, false); }), M(MOSSC2));
        sh.add(vine);
        return { sh: sh, elbow: elbow, sg: sg };
      });
      // cabeça
      var gHead = new THREE.Group(); gHead.position.set(0, 2.62, 0.08); torso.add(gHead);
      mesh(gCyl, M(GST2), 0.32, 0.3, 0.32, 0, -0.18, 0, gHead);
      var hb = new THREE.Group(); hb.position.y = 0.55; gHead.add(hb);
      block(1.25, 1.08, 1.0, GST3, 0, 0, 0, 0, hb, 0.28);
      block(1.36, 0.2, 0.34, GWOOD, 0, 0.28, 0.4, 0, hb, 0.05);
      block(0.24, 0.36, 0.22, GST, 0, -0.05, 0.52, 0, hb, 0.08);
      [-1, 1].forEach(function (sg) { block(0.16, 0.34, 0.3, GST2, sg * 0.66, -0.02, 0, 0, hb, 0.06); });
      // olhos de luz âmbar (fecham dormindo, abrem ao acordar)
      var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffbe4a });
      var gEyes = [-1, 1].map(function (sg) {
        var e = new THREE.Group(); e.position.set(sg * 0.29, 0.07, 0.505); hb.add(e);
        mesh(gSph, M(0x5a4636, { roughness: 0.9 }), 0.17, 0.12, 0.05, 0, 0, -0.01, e, true);
        var iris = mesh(gSph, eyeMat, 0.13, 0.095, 0.05, 0, 0, 0.012, e, true);
        var hl = mesh(gSphLo, new THREE.MeshBasicMaterial({ color: 0xfff6dc }), 0.035, 0.03, 0.02, sg * -0.04 + 0.03, 0.03, 0.05, e, true);
        // pálpebra de pedra (meia-lua) — expressão serena
        var lid = mesh(gHemi, M(GST3), 0.165, 0.16, 0.07, 0, 0, 0.0, e, true); lid.rotation.x = Math.PI / 2;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffb040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        sp.position.set(0, 0, 0.08); sp.scale.setScalar(0.6); e.add(sp);
        return { e: e, iris: iris, lid: lid, sp: sp, hl: hl };
      });
      [-1, 1].forEach(function (sg) { var br = block(0.3, 0.07, 0.08, 0x8f7d68, sg * 0.29, 0.21, 0.5, 0, hb, 0.03); br.rotation.z = sg * -0.12; });
      var gMouth = mesh(gSmile, M(0x5a4636, { roughness: 0.9 }), 0.13, 0.08, 0.06, 0, -0.27, 0.49, hb, true); gMouth.rotation.z = Math.PI;
      // barba de musgo
      [[0, -0.5, 0.42, 0.42, 0.2], [-0.28, -0.42, 0.42, 0.22, 0.18], [0.28, -0.42, 0.42, 0.22, 0.18], [0, -0.66, 0.36, 0.26, 0.16], [-0.46, -0.28, 0.38, 0.12, 0.2], [0.46, -0.28, 0.38, 0.12, 0.2]].forEach(function (q, k) { mesh(gSph, M(k % 2 ? MOSSC2 : MOSSC, { roughness: 0.95 }), q[3], q[4], 0.16, q[0], q[1], q[2], hb); });
      ball(0xffffff, 0.05, -0.18, -0.58, 0.55, hb); ball(0xff9ac1, 0.045, 0.2, -0.62, 0.5, hb);
      // coroa de broto (folhinhas) e musgo no topo
      mesh(gHemi, M(MOSSC), 0.5, 0.18, 0.42, 0, 0.5, -0.05, hb);
      var sprout = new THREE.Group(); sprout.position.set(0.12, 0.62, 0.02); hb.add(sprout);
      mesh(gCyl, M(0x5c8a3a), 0.025, 0.3, 0.025, 0, 0.15, 0, sprout);
      [-1, 1].forEach(function (sg) { var lf = mesh(gSph, M(0x8cc65a, { roughness: 0.6 }), 0.13, 0.04, 0.07, sg * 0.12, 0.3, 0, sprout); lf.rotation.z = sg * 0.5; });
      ball(0xffd23f, 0.05, 0, 0.33, 0, sprout);

      /* ----- herói (idêntico ao combinado) ----- */
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
      var HERO_P = new THREE.Vector3(-0.42, 0, 4.2);
      hero.position.copy(HERO_P); hero.scale.setScalar(1.12);

      instanced(gHex, addRim(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, flatShading: true })), PINS, true);

      /* ondas de voz do herói até o guardião */
      var voiceRings = [0, 1, 2].map(function () {
        var m = new THREE.Mesh(G('vring', function () { return new THREE.TorusGeometry(0.3, 0.025, 6, 32); }), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        m.visible = false; scene.add(m); return m;
      });
      /* poeira dourada */
      var NDUST = 170, dPos = new Float32Array(NDUST * 3), dSeed = [];
      for (var di = 0; di < NDUST; di++) dSeed.push({ x: -5 + R() * 10, y: -1 + R() * 9, z: -11 + R() * 15, sp: 0.15 + R() * 0.3, ph: R() * 6.28, a: R() });
      var dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
      var dMat = new THREE.PointsMaterial({ map: glowT, color: 0xffd58a, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
      var dust = new THREE.Points(dGeo, dMat); dust.frustumCulled = false; dust.renderOrder = 9; scene.add(dust);
      /* pedrinhas caindo quando acorda */
      var pebbles = [];
      for (var pb = 0; pb < 10; pb++) pebbles.push({ m: mesh(gSphLo, M(GST2), 0.05 + R() * 0.04, 0.04 + R() * 0.03, 0.05, 0, -50, 0, scene, true), x: (R() < 0.5 ? -1 : 1) * (1.2 + R() * 0.5) * GS, z: -4.2 + (R() - 0.5) * 0.6, t: 0.35 + R() * 0.5, h: 4.4 + R() * 0.6 });
      /* estrelinhas douradas da aprovação */
      var starGeo = G('star', function () { var s = new THREE.Shape(); for (var k = 0; k < 8; k++) { var rr = k % 2 ? 0.035 : 0.1, an = k / 8 * Math.PI * 2; if (!k) s.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else s.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } s.closePath(); return new THREE.ShapeGeometry(s); });
      var NSP = 46, sparks = new THREE.InstancedMesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }), NSP);
      var spData = [], spCols = [0xffe27a, 0xffffff, 0xffc93c, 0xffb46e];
      for (var si = 0; si < NSP; si++) { spData.push({ a: R() * Math.PI * 2, b: (R() - 0.3) * 1.4, r: 1.2 + R() * 2.4, s: 1.4 + R() * 1.6, d: R() * 0.25 }); sparks.setColorAt(si, tmpC.set(spCols[si % 4])); }
      sparks.instanceColor.needsUpdate = true; sparks.frustumCulled = false; sparks.renderOrder = 10; scene.add(sparks);

      /* ----- HUD ----- */
      var grade = document.createElement('div'); grade.className = ID + '-grade'; root.appendChild(grade);
      var vig = document.createElement('div'); vig.className = ID + '-vig'; root.appendChild(vig);
      var frameEl = document.createElement('div'); frameEl.className = ID + '-frame'; root.appendChild(frameEl);
      var hud = document.createElement('div'); hud.className = ID + '-hud';
      var bars = ''; for (var bi = 0; bi < 11; bi++) bars += '<i></i>';
      hud.innerHTML = H(
        '<div class="@@-burst"></div><div class="@@-seal">' + sealSVG() + '</div>' +
        '<div class="@@-bub @@-card"><div class="@@-tail"></div><div class="@@-nm">' + IC_GUARD + 'Guardião da Ponte</div><div class="@@-say">Sábia resposta. Pode passar!</div></div>' +
        '<div class="@@-top @@-card"><div class="@@-ava">' + AVATAR + '<span class="@@-lv">4</span></div>' +
        '<div class="@@-stat"><div class="@@-ttl">Nível 4 · <span>Explorador</span></div>' +
        '<div class="@@-bar"><div class="@@-fill"></div><div class="@@-shine"></div></div>' +
        '<div class="@@-xpn"><span>Experiência</span><span><b class="@@-xpv">780</b> / 1000 XP</span></div></div>' +
        '<div class="@@-lk">' + IC_LOCK + '</div></div>' +
        '<div class="@@-ban"><span class="@@-bsh"></span><i>' + IC_LOCK + '</i>Prova final <b>·</b> tela travada</div>' +
        '<div class="@@-q @@-card"><div class="@@-qh"><span class="@@-qtag">' + IC_GUARD + 'Pergunta final</span><span class="@@-qwho">Guardião da Ponte Antiga</span></div>' +
        '<div class="@@-qt">Explique com suas palavras: por que uma viga precisa de <b>apoio dos dois lados</b>?</div>' +
        '<div class="@@-ring"><svg viewBox="0 0 62 62"><circle cx="31" cy="31" r="24" fill="none" stroke="#efe5d3" stroke-width="6"/><circle class="@@-rp" cx="31" cy="31" r="24" fill="none" stroke="#ff8a2a" stroke-width="6" stroke-linecap="round" stroke-dasharray="150.8" stroke-dashoffset="0"/></svg><div class="@@-rt"><span class="@@-rv">0:45</span><small>tempo</small></div></div>' +
        '<div class="@@-ok">' + IC_CHECKW + 'Aprovada</div></div>' +
        '<div class="@@-mic @@-card"><div class="@@-wv l">' + bars + '</div><div class="@@-wv r">' + bars + '</div>' +
        '<div class="@@-halo"></div><div class="@@-halo"></div><div class="@@-mb">' + IC_MIC + '</div>' +
        '<div class="@@-ml"><span class="@@-dot"></span><span class="@@-mlt">Responda em voz alta</span></div></div>' +
        '<div class="@@-xp">' + IC_XPG + '+200 XP</div>');
      root.appendChild(hud);
      var flashEl = document.createElement('div'); flashEl.className = ID + '-flash'; root.appendChild(flashEl);
      function q(sel) { return hud.querySelector('.' + ID + '-' + sel); }
      var elFill = q('fill'), elShine = q('shine'), elXpv = q('xpv'), elBan = q('ban'), elBsh = q('bsh'), elQ = q('q'), elRp = q('rp'), elRv = q('rv'), elRing = q('ring'), elOk = q('ok'),
        elMic = q('mic'), elMb = q('mb'), elMlt = q('mlt'), elDot = q('dot'), elSeal = q('seal'), elBurst = q('burst'), elXp = q('xp'), elBub = q('bub'), elSShine = hud.querySelector('.' + ID + '-sshine');
      var elHalos = hud.querySelectorAll('.' + ID + '-halo');
      var barEls = Array.prototype.slice.call(hud.querySelectorAll('.' + ID + '-wv i'));

      /* ----- layout / câmera ----- */
      var S = 1, zoneTop = 300, zoneBot = 700;
      function layout() {
        W = host.clientWidth || W; Hh = host.clientHeight || Hh;
        renderer.setSize(W, Hh, false);
        camera.aspect = W / Hh;
        camera.fov = camera.aspect < 0.8 ? 46 : 36;
        camera.updateProjectionMatrix();
        S = clamp(Math.min(W / 390, Hh / 700), 0.78, 1.45);
        root.style.setProperty('--s', S.toFixed(3));
        zoneTop = elQ.offsetTop + elQ.offsetHeight;
        zoneBot = elMic.offsetTop - 30 * S;
      }
      layout();
      var ro = new ResizeObserver(layout); ro.observe(host);
      var v3 = new THREE.Vector3(), camQ = new THREE.Quaternion();
      function projV(v) { v3.copy(v).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * Hh }; }
      function projXYZ(x, y, z) { v3.set(x, y, z); return projV(v3); }
      var ORBIT_C = new THREE.Vector3(0, 0, 2.0), LOOK = new THREE.Vector3(), wv = new THREE.Vector3(), headW = new THREE.Vector3(), heroHeadW = new THREE.Vector3();

      /* ----- quadro a quadro ----- */
      function update(t, wall) {
        var s = t >= LOOP - 0.3 ? t - LOOP : t;
        var ph = t / LOOP * Math.PI * 2;

        // câmera baixa, olhando para cima, órbita lenta (fecha o loop sozinha)
        var orb = reduce ? 0 : 1;
        var ang = 0.09 * Math.sin(ph) * orb, rad = 11.8 - 0.35 * Math.sin(ph * 2 + 0.7) * orb;
        camera.position.set(ORBIT_C.x + Math.sin(ang) * rad, 0.75 + 0.08 * Math.sin(ph + 1) * orb, ORBIT_C.z + Math.cos(ang) * rad);
        LOOK.set(0.35 * camera.position.x + 0.15, 2.55, -4.2);
        camera.lookAt(LOOK);
        var zoneMid = (zoneTop + zoneBot) / 2, off = (zoneMid - Hh / 2);
        if (Math.abs(off) > 0.5) camera.setViewOffset(W, Hh, 0, -off, W, Hh); else camera.clearViewOffset();
        camera.updateMatrixWorld();
        sky.position.copy(camera.position);
        rays.position.copy(camera.position).addScaledVector(SUN_DIR, 150);
        rays.quaternion.copy(camera.quaternion); rays.rotateZ(wall * 0.05);
        rays.scale.setScalar(150);

        // guardião: acorda -> ouve -> analisa -> curva-se e abre passagem
        var wake = sstep(0.15, 0.95, s);
        var listen = sstep(1.1, 1.4, s) * (1 - sstep(3.6, 3.9, s));
        var think = sstep(3.55, 3.75, s) * (1 - sstep(4.0, 4.15, s));
        var bow = sstep(4.35, 5.15, s) * (1 - sstep(6.0, 6.5, s));
        var breathe = Math.sin(wall * 1.4);
        gBody.position.y = 0.025 * breathe * GS;
        torso.rotation.x = -0.12 * (1 - wake) + 0.02 * breathe + bow * 0.3;
        torso.rotation.z = 0.02 * Math.sin(wall * 0.7);
        guard.position.x = -1.15 * bow; guard.rotation.y = 0.38 * bow;
        gHead.rotation.x = 0.32 * (1 - wake) - 0.1 * wake * (1 - bow) + 0.07 * Math.sin(s * 9) * think + bow * 0.16;
        gHead.rotation.z = 0.05 * Math.sin(wall * 0.9) + 0.08 * listen;
        gHead.rotation.y = -0.06 * listen;
        // braços: repousam; na reverência, o direito abre o caminho e o esquerdo vai ao peito
        arms.forEach(function (a) {
          var sg = a.sg;
          a.sh.rotation.set(0, 0, sg * 0.1 + sg * 0.03 * breathe);
          a.elbow.rotation.set(-0.35, 0, 0);
          if (sg > 0) { a.sh.rotation.x = -bow * 0.55; a.sh.rotation.z += bow * 0.75; a.elbow.rotation.x = -0.35 - bow * 0.3; }
          else { a.sh.rotation.x = -bow * 0.9; a.elbow.rotation.x = -0.35 - bow * 1.4; a.sh.rotation.z -= bow * 0.1; }
        });
        // olhos acendendo
        var eo = sstep(0.3, 0.8, s);
        var gbl = (wall + 0.8) % 4.3, gblink = gbl < 0.16 ? Math.abs(Math.cos(gbl / 0.16 * Math.PI)) : 1;
        gEyes.forEach(function (e) {
          var open = Math.max(0.08, eo * (0.82 - 0.2 * bow) * gblink);
          e.iris.scale.y = 0.095 * open; e.hl.visible = open > 0.4;
          e.lid.position.y = 0.04 + 0.12 * open; e.lid.scale.y = 0.16 * (1 - open * 0.55);
          e.sp.material.opacity = (0.25 + 0.75 * eo) * (0.8 + 0.2 * Math.sin(wall * 3));
          e.sp.scale.setScalar(0.5 + 0.35 * eo + 0.15 * bow);
        });
        eyeMat.color.setRGB(1, 0.62 + 0.18 * eo, 0.2 + 0.15 * eo);
        var glowP = 0.4 + 0.6 * eo;
        runeMat.color.setRGB(1, 0.55 + 0.25 * glowP * (0.85 + 0.15 * Math.sin(wall * 2.2)), 0.18 + 0.3 * bow);
        crackMat.color.setRGB(0.6 + 0.4 * glowP, 0.36 + 0.3 * glowP, 0.12 + 0.1 * glowP);
        gMouth.scale.set(0.13, 0.08 * (1 + 0.6 * bow), 0.06);
        // pedrinhas e poeira do despertar
        pebbles.forEach(function (p) {
          var k = clamp((s - p.t) / 0.7, 0, 1);
          if (k <= 0 || k >= 1) { p.m.position.y = -50; return; }
          p.m.position.set(p.x * (1 + k * 0.1), p.h - 4.6 * k * k, p.z + k * 0.3);
        });

        // herói: olha para cima, responde por voz (gestos), comemora
        var talk = listen;
        var cheer = sstep(4.1, 4.25, s) * (1 - sstep(4.85, 5.1, s));
        hero.rotation.y = Math.PI - 0.5 + 0.1 * talk;
        var idle = Math.sin(wall * 2.4);
        hB.position.y = 0.006 * idle;
        var jump = s > 4.12 && s < 4.55 ? Math.sin((s - 4.12) / 0.43 * Math.PI) : 0;
        hB.position.y += jump * 0.3;
        var sq = 1 + 0.012 * idle + jump * 0.1;
        hSq.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        hLegs[0].rotation.x = 0; hLegs[1].rotation.x = 0;
        hArms[0].rotation.set(0, 0, -0.18); hArms[1].rotation.set(0, 0, 0.18);
        var g1 = Math.sin(wall * 4.2), g2 = Math.sin(wall * 3.1 + 1);
        hArms[1].rotation.x = -talk * (1.1 + 0.35 * g1); hArms[1].rotation.z += talk * (0.35 + 0.15 * g2);
        hArms[0].rotation.x = -talk * (0.5 + 0.25 * g2);
        hArms[0].rotation.z -= cheer * (2.3 + Math.sin(wall * 20) * 0.15); hArms[1].rotation.z += cheer * (2.3 + Math.sin(wall * 20 + 1) * 0.15);
        hArms[0].rotation.x -= cheer * 0.4; hArms[1].rotation.x -= cheer * 0.4 * (1 - talk);
        hHead.rotation.x = -0.55 + 0.06 * Math.sin(wall * 7) * talk;
        hHead.rotation.y = 0.12 * Math.sin(wall * 1.3) * talk;
        hHead.rotation.z = 0.08 * cheer * Math.sin(wall * 9);
        hMouth.scale.set(0.036 * (1 + cheer * 0.35), 0.03 * (1 + talk * (0.8 + 0.8 * Math.sin(wall * 18)) + cheer * 1.4), 0.03);
        var bl = wall % 3.1, blink = bl < 0.12 ? Math.abs(Math.cos(bl / 0.12 * Math.PI)) : 1;
        hEyes[0].scale.y = hEyes[1].scale.y = Math.max(0.1, blink);

        // ondas de voz
        hHead.getWorldPosition(heroHeadW);
        gHead.getWorldPosition(headW);
        voiceRings.forEach(function (vr, k) {
          var kk = ((wall * 1.3 + k / 3) % 1), on = listen;
          vr.visible = on > 0.02;
          if (!vr.visible) return;
          vr.position.lerpVectors(heroHeadW, headW, 0.06 + kk * 0.4);
          vr.lookAt(headW);
          vr.scale.setScalar(0.5 + kk * 1.5);
          vr.material.opacity = on * Math.sin(kk * Math.PI) * 0.6;
        });

        // passagem iluminada
        var open = sstep(4.55, 5.4, s) * (1 - sstep(6.1, 6.6, s));
        doors[0].rotation.y = -open * 1.25; doors[1].rotation.y = open * 1.25;
        gateInMat.color.setRGB(lerp(0.16, 1.0, open), lerp(0.08, 0.93, open), lerp(0.19, 0.72, open));
        gateGlow.material.opacity = open * (0.9 + 0.1 * Math.sin(wall * 3));
        gateGlow.scale.setScalar(4 + 5 * open);
        gateBeam.material.opacity = open * 0.45;
        gateL.intensity = open * 2.2;
        pathTiles.forEach(function (pt, k) {
          var tk = 4.7 + k * 0.045;
          var on = sstep(tk, tk + 0.2, s) * (1 - sstep(6.1, 6.6, s));
          pt.material.opacity = on * (0.75 + 0.25 * Math.sin(wall * 4 - k * 0.6));
          var mo = pt.userData.mo; mo.material.opacity = on * (0.7 + 0.3 * Math.sin(wall * 5 - k * 0.7)); mo.position.y = 0.14 + 0.05 * Math.sin(wall * 3 + k);
        });
        lamps.forEach(function (lp, k) { lp.material.opacity = 0.7 + 0.15 * Math.sin(wall * 5 + k) + 0.2 * open; lp.scale.setScalar(0.85 + 0.25 * open); });
        skyMat.uniforms.uGlow.value = open;
        rays.material.opacity = 0.32 + 0.06 * Math.sin(wall * 0.8) + 0.12 * open;
        shafts.forEach(function (sf) { sf.m.material.opacity = sf.base * (0.75 + 0.25 * Math.sin(wall * 0.6 + sf.ph)) * (1 + 0.6 * open); });
        rimU.uRimStr.value = 0.95 + 0.25 * open;

        // poeira dourada flutuando
        for (var i = 0; i < NDUST; i++) {
          var d = dSeed[i], yy = d.y + ((wall * d.sp * 0.35 + d.a * 9) % 9);
          if (yy > 8) yy -= 9;
          dPos[i * 3] = d.x + Math.sin(wall * 0.5 + d.ph) * 0.35; dPos[i * 3 + 1] = yy; dPos[i * 3 + 2] = d.z + Math.cos(wall * 0.4 + d.ph) * 0.3;
        }
        dGeo.attributes.position.needsUpdate = true;
        dMat.size = 0.13 + 0.05 * open;

        // estrelinhas douradas na aprovação
        camQ.copy(camera.quaternion);
        var chest = new THREE.Vector3(); torso.localToWorld(chest.set(0, 1.1, 0.7));
        for (var k2 = 0; k2 < NSP; k2++) {
          var sd = spData[k2], fk = clamp((s - 4.05 - sd.d) / 1.1, 0, 1);
          if (fk <= 0 || fk >= 1) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); dummy.rotation.set(0, 0, 0); }
          else {
            var ee = outCubic(fk), rr = sd.r * ee;
            dummy.position.set(chest.x + Math.cos(sd.a) * rr, chest.y + Math.sin(sd.a) * rr * 0.8 + sd.b * ee - fk * fk * 0.8, chest.z + 0.8);
            dummy.scale.setScalar(sd.s * Math.sin(Math.min(1, fk * 1.2) * Math.PI) + 0.0001);
            dummy.quaternion.copy(camQ); dummy.rotateZ(wall * 3 + sd.a);
          }
          dummy.updateMatrix(); sparks.setMatrixAt(k2, dummy.matrix);
        }
        sparks.instanceMatrix.needsUpdate = true;

        // ---- HUD
        var cdTot = 45, stopAt = 3.9, el2 = clamp(s, 0, stopAt), remain = Math.ceil(cdTot - el2 * 2.2);
        var frac = (cdTot - el2 * 2.2) / cdTot;
        elRp.setAttribute('stroke-dashoffset', (150.8 * (1 - frac)).toFixed(1));
        elRp.setAttribute('stroke', s > 4.0 ? '#2fb582' : '#ff8a2a');
        elRv.textContent = '0:' + (remain < 10 ? '0' : '') + remain;
        elRing.style.transform = 'scale(' + (1 + 0.06 * pulse((s % 1 + 1) % 1, 0, 0.18) * (s < stopAt ? 1 : 0)).toFixed(3) + ')';
        elBsh.style.left = (((wall * 0.35) % 1.6) * 100 - 40).toFixed(1) + '%';
        frameEl.style.opacity = (0.75 + 0.25 * Math.sin(wall * 2.2)).toFixed(3);
        var ask = pulse(s, 0.75, 0.5);
        elQ.style.transform = 'scale(' + (1 + 0.025 * ask).toFixed(4) + ')';
        var okk = sstep(4.15, 4.3, s);
        elOk.style.opacity = okk.toFixed(3);
        elOk.style.transform = 'scale(' + (s < 4.45 ? outBack(clamp((s - 4.15) / 0.3, 0, 1), 2.4) : 1).toFixed(3) + ')';
        elQ.style.boxShadow = okk > 0.5 ? '0 0 0 ' + (2.5 * S).toFixed(1) + 'px #2fb582,0 ' + (8 * S).toFixed(1) + 'px ' + (22 * S).toFixed(1) + 'px rgba(30,10,40,.4)' : '';

        // microfone + forma de onda
        var rec = listen, done = sstep(4.0, 4.15, s);
        elMlt.textContent = s < 1.15 ? 'Responda em voz alta' : s < 3.6 ? 'Ouvindo… fale com calma' : s < 4.05 ? 'Analisando sua resposta…' : 'Resposta enviada';
        elDot.style.background = done > 0.5 ? '#2fb582' : s < 1.15 ? '#c9bca6' : s < 3.6 ? '#ff5a4a' : '#ffb04a';
        elDot.style.opacity = s > 1.15 && s < 3.6 ? (0.55 + 0.45 * Math.abs(Math.sin(wall * 4))).toFixed(2) : '1';
        elMb.style.background = done > 0.5 ? 'radial-gradient(circle at 50% 35%,#5fd6a8,#2fb582 70%)' : '';
        elMb.style.transform = 'scale(' + (1 + 0.05 * rec * Math.abs(Math.sin(wall * 9)) + 0.12 * pulse(s, 4.0, 0.3) - 0.08 * pulse(s, 1.0, 0.18)).toFixed(3) + ')';
        Array.prototype.forEach.call(elHalos, function (h, k) {
          var hk = ((wall * 0.9 + k * 0.5) % 1);
          h.style.opacity = (rec * (1 - hk) * 0.8).toFixed(3);
          h.style.transform = 'scale(' + (1 + hk * 0.9).toFixed(3) + ')';
          h.style.borderColor = '#ffb04a';
        });
        var nb = barEls.length / 2;
        barEls.forEach(function (b, k) {
          var side = k < nb ? 0 : 1, j = side ? k - nb : nb - 1 - (k);
          var env = 0.55 + 0.45 * Math.sin(wall * 2.3 + 0.7) * Math.sin(wall * 1.3);
          var v = Math.abs(Math.sin(wall * (7 + j * 0.9) + j * 1.7 + side)) * (1 - j / (nb + 2)) * env;
          var idleV = 0.12 + 0.05 * Math.sin(wall * 3 + j);
          var thinkV = 0.18 + 0.15 * Math.max(0, Math.sin(wall * 10 - j * 0.8));
          var h = rec > 0.01 ? lerp(idleV, 0.2 + 0.8 * v, rec) : (think > 0.01 ? thinkV : idleV);
          if (done > 0.5) h = 0.1;
          b.style.height = (6 + 40 * h).toFixed(1) * S + 'px';
          b.style.background = done > 0.5 ? '#9fdcc2' : (rec > 0.01 ? '' : '#e2d4bb');
        });

        // selo "Resposta aprovada"
        var sk = clamp((s - 4.05) / 0.35, 0, 1), sOut = sstep(5.05, 5.35, s);
        var sp2 = projV(new THREE.Vector3(0, 0, 0).copy(chest)), sw = elSeal.offsetWidth || 190;
        var scY = clamp(sp2.y, zoneTop + sw * 0.55, zoneBot - sw * 0.45);
        elSeal.style.opacity = (s > 4.05 ? Math.min(1, sk * 2) * (1 - sOut) : 0).toFixed(3);
        var stamp = s < 4.4 ? lerp(2.2, 1, outCubic(sk)) - 0.08 * pulse(s, 4.35, 0.15) : 1 + 0.02 * Math.sin(wall * 3);
        elSeal.style.transform = 'translate(' + (W / 2).toFixed(1) + 'px,' + scY.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + lerp(-24, -7, outCubic(sk)).toFixed(2) + 'deg) scale(' + (stamp * (1 - 0.4 * sOut)).toFixed(3) + ')';
        if (elSShine) elSShine.setAttribute('x', (-200 + 400 * clamp((s - 4.4) / 0.6, 0, 1)).toFixed(1));
        var bk = sstep(4.05, 4.3, s) * (1 - sstep(5.0, 5.4, s));
        elBurst.style.opacity = bk.toFixed(3);
        elBurst.style.transform = 'translate(' + (W / 2).toFixed(1) + 'px,' + scY.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (wall * 18).toFixed(1) + 'deg) scale(' + (0.6 + 0.5 * bk).toFixed(3) + ')';

        // +200 XP sobe até a barra
        var xk = clamp((s - 4.35) / 1.1, 0, 1);
        var xpTop = q('top').offsetTop + q('top').offsetHeight * 0.5;
        elXp.style.opacity = s > 4.35 ? (xk < 0.1 ? xk / 0.1 : 1 - sstep(0.78, 1, xk)).toFixed(3) : 0;
        var xy = lerp(scY - sw * 0.62, xpTop, outCubic(clamp((xk - 0.25) / 0.6, 0, 1)));
        elXp.style.transform = 'translate(' + (W / 2).toFixed(1) + 'px,' + xy.toFixed(1) + 'px) translate(-50%,-50%) scale(' + (xk < 0.18 ? outBack(xk / 0.18, 2.6) : 1 - 0.45 * sstep(0.6, 1, xk)).toFixed(3) + ')';
        var xpK = sstep(5.0, 5.5, s);
        elFill.style.width = (78 + 20 * xpK).toFixed(2) + '%';
        elXpv.textContent = Math.round(780 + 200 * xpK);
        var fl2 = clamp((s - 5.05) / 0.55, 0, 1);
        elShine.style.opacity = s > 5.05 && fl2 < 1 ? Math.sin(fl2 * Math.PI) : 0;
        elShine.style.left = (fl2 * 70) + '%';

        // fala do guardião
        var bIn = clamp((s - 5.25) / 0.3, 0, 1), bOut = sstep(6.15, 6.4, s);
        var hp = projV(headW);
        var bw2 = elBub.offsetWidth || 196, bh2 = elBub.offsetHeight || 80;
        var left = clamp(hp.x + 62 * S, 10 * S, W - bw2 - 10 * S);
        var topB = clamp(hp.y - bh2 * 0.35, zoneTop + 26 * S, zoneBot - bh2);
        var ty2 = clamp(hp.y - topB - 10 * S, 14 * S, bh2 - 26 * S);
        elBub.style.setProperty('--ty', ty2.toFixed(1) + 'px');
        elBub.style.transformOrigin = '0 ' + ty2.toFixed(0) + 'px';
        elBub.style.transform = 'translate(' + left.toFixed(1) + 'px,' + (topB + Math.sin(wall * 2.6) * 1.5).toFixed(1) + 'px) scale(' + Math.max(0.001, (bIn > 0 ? outBack(bIn, 2.2) : 0)).toFixed(3) + ')';
        elBub.style.opacity = (Math.min(1, bIn * 3) * (1 - bOut)).toFixed(3);

        // transição: clarão dourado que fecha e reabre o loop
        var ik = t < LOOP - 0.3 ? sstep(LOOP - 0.62, LOOP - 0.3, t) : 1 - sstep(LOOP - 0.3, LOOP, t);
        flashEl.style.opacity = ik.toFixed(3);
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
