/* KidsSchooling — ícones SVG flat, avatar do herói, ilustrações da aula, distintivo e selo.
   Mesmo traço das cenas aprovadas (combinado/construcao/chefao). */
(function () {
  'use strict';
  var KS = window.KS = window.KS || {};
  var I = KS.icons = {};
  var uid = 0;

  /* avatar do herói (menino/menina, tom de pele) */
  KS.avatarSVG = function (girl, skinIdx, bg) {
    var P = KS.SKINS[skinIdx | 0] || KS.SKINS[0], c = P.css, id = 'ksav' + (++uid);
    var hairBack = girl ? '<path d="M15.5 30c-1 9 0 17 3 22h27c3-5 4-13 3-22z" fill="' + c[2] + '"/><circle cx="32" cy="12.5" r="5.5" fill="' + c[2] + '"/><circle cx="32" cy="9.5" r="2.4" fill="#ffc93c"/>' : '';
    var extra = girl ? '<circle cx="42" cy="17.5" r="2.2" fill="#ff6f91"/><path d="M22.4 30.2l-1.6-1.4M41.6 30.2l1.6-1.4" stroke="#2a2342" stroke-width="1.2" stroke-linecap="round"/>' : '<path d="M31 13.5c1.5-4.5 5.5-6.5 9-5.5-2 1.2-3.2 3-3.4 5.4z" fill="' + c[2] + '"/>';
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (bg || '#bfe3ff') + '"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient><clipPath id="' + id + 'c"><circle cx="32" cy="32" r="29"/></clipPath></defs>' +
      '<circle cx="32" cy="32" r="31.5" fill="#fffaf0"/><circle cx="32" cy="32" r="29" fill="url(#' + id + 'g)"/>' +
      '<g clip-path="url(#' + id + 'c)">' + hairBack +
      '<path d="M18 30c-4 0-6 4-6 10v24h12z" fill="#ff8a2a"/><path d="M46 30c4 0 6 4 6 10v24H40z" fill="#ff8a2a"/>' +
      '<path d="M11 64c1-11 9-16 21-16s20 5 21 16z" fill="#2f74e6"/><path d="M25 48.5l7 5 7-5" fill="none" stroke="#9cc4ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M17 50l5 14M47 50l-5 14" stroke="#e86f12" stroke-width="4.2" stroke-linecap="round"/>' +
      '<circle cx="32" cy="30" r="14.5" fill="' + c[0] + '"/><circle cx="17.8" cy="31" r="3.2" fill="' + c[1] + '"/><circle cx="46.2" cy="31" r="3.2" fill="' + c[1] + '"/>' +
      '<path d="M17 28.5c-.6-9.5 6-15.5 15-15.5 9.2 0 15.6 6 15 15.5-2.2-3.4-5.5-5.6-9.5-6.3 1.4 1.6 1.8 3.2 1.6 4.6-3.7-3.8-9.7-5.1-15-3.8-2.7.7-5.1 2.6-7.1 5.5z" fill="' + c[2] + '"/>' + extra +
      '<path d="M22.2 27.6q3-2 5.8-.4M36 27.2q2.8-1.6 5.8.4" stroke="' + c[3] + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="26" cy="31.8" rx="2.6" ry="3.2" fill="#2a2342"/><ellipse cx="38" cy="31.8" rx="2.6" ry="3.2" fill="#2a2342"/><circle cx="26.9" cy="30.6" r="1" fill="#fff"/><circle cx="38.9" cy="30.6" r="1" fill="#fff"/>' +
      '<ellipse cx="21.8" cy="36.4" rx="2.6" ry="1.6" fill="#ff9a8a" opacity=".6"/><ellipse cx="42.2" cy="36.4" rx="2.6" ry="1.6" fill="#ff9a8a" opacity=".6"/>' +
      '<path d="M27.5 37.4q4.5 4.6 9 0z" fill="#b8473c"/><path d="M29 38.2q3 1.3 6 0" stroke="#fff" stroke-width="1" fill="none"/>' +
      '</g></svg>';
  };

  I.pause = '<svg viewBox="0 0 20 20"><rect x="4.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/><rect x="11.5" y="3.5" width="4" height="13" rx="1.6" fill="#7b6f5e"/></svg>';
  I.close = '<svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="#7b6f5e" stroke-width="3" stroke-linecap="round"/></svg>';
  I.quest = '<svg viewBox="0 0 32 32"><path d="M3 22h26" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/><path d="M4 26q3-2 6 0t6 0 6 0 6 0" stroke="#5aa9e6" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<rect x="4" y="15" width="7" height="5" rx="1.5" fill="#c98a4b"/><rect x="21" y="15" width="7" height="5" rx="1.5" fill="#c98a4b"/><rect x="12.5" y="15" width="7" height="5" rx="1.5" fill="none" stroke="#ff8a2a" stroke-width="1.6" stroke-dasharray="2 1.6"/>' +
    '<path d="M14.5 15l1-1.6h2l1 1.6" fill="#ffc93c"/><path d="M5 15v-6M27 15v-6" stroke="#9c6237" stroke-width="2.2" stroke-linecap="round"/><path d="M5 9q11 5 22 0" stroke="#e8d3a8" stroke-width="1.6" fill="none"/></svg>';
  I.check = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.helmet = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><path d="M5 15a7 7 0 0 1 14 0z" fill="#ffc93c" stroke="#d99a12" stroke-width="1.2"/><rect x="3.5" y="14.5" width="17" height="3" rx="1.5" fill="#f2a71a"/><path d="M12 8v6" stroke="#d99a12" stroke-width="1.6"/></svg>';
  I.xp = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M12 5.2l2 4.2 4.6.6-3.4 3.2.9 4.6L12 15.6l-4.1 2.2.9-4.6L5.4 10l4.6-.6z" fill="#fff"/></svg>';
  I.build = '<svg viewBox="0 0 32 32"><path d="M5 19l11-5.5L27 19 16 24.5z" fill="#fff"/><path d="M5 19v4.5L16 29v-4.5z" fill="#ffe2c4"/><path d="M27 19v4.5L16 29v-4.5z" fill="#ffd0a3"/>' +
    '<path d="M9 10.5l7-3.5 7 3.5-7 3.5z" fill="#fff"/><path d="M9 10.5v3.8l7 3.5v-3.8z" fill="#ffe2c4"/><path d="M23 10.5v3.8l-7 3.5v-3.8z" fill="#ffd0a3"/>' +
    '<path d="M13.6 9.2l1.2-.7h2.4l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/><path d="M8.8 18.6l1.2-.7h2.4l1.2.7-1.2.7H10z M18.4 18.6l1.2-.7H22l1.2.7-1.2.7h-2.4z" fill="#ff7a1a" opacity=".55"/></svg>';
  I.bag = '<svg viewBox="0 0 32 32"><path d="M11 9V7.5a5 5 0 0 1 10 0V9" stroke="#e86f12" stroke-width="2.6" fill="none"/><rect x="6" y="9" width="20" height="19" rx="6" fill="#ff8a2a"/><path d="M6 15.5a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1H6z" fill="#e86f12"/><rect x="12" y="19" width="8" height="5.5" rx="2" fill="#ffc48a"/><circle cx="16" cy="16.5" r="1.6" fill="#ffc93c"/></svg>';
  I.map = '<svg viewBox="0 0 32 32"><path d="M16 5l12 6.5L16 18 4 11.5z" fill="#8fd16a"/><path d="M4 11.5V16l12 6.5V18z" fill="#5fae4a"/><path d="M28 11.5V16l-12 6.5V18z" fill="#4c963d"/>' +
    '<path d="M9.5 8.5l13 7" stroke="#5aa9e6" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12.6" r="2.2" fill="#2f6fe0" stroke="#fff" stroke-width="1"/><path d="M20 27l2-3.5 2 3.5z" fill="#ff7a1a"/></svg>';
  I.grid = '<svg viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="none" stroke="#8ff3ff" stroke-width="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="#8ff3ff" stroke-width="1.3" opacity=".8"/><path d="M6 18l12-12" stroke="#ffc93c" stroke-width="2.2" stroke-linecap="round"/></svg>';
  I.viga = '<svg viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="8" rx="2.5" fill="#d99a5c"/><rect x="4.5" y="12" width="23" height="2.4" rx="1.2" fill="#f0bf86"/><circle cx="9" cy="10.4" r="1.7" fill="#ffc93c"/><circle cx="16" cy="10.4" r="1.7" fill="#ffc93c"/><circle cx="23" cy="10.4" r="1.7" fill="#ffc93c"/><rect x="5" y="19" width="4" height="5" rx="1.4" fill="#9a5f34"/><rect x="23" y="19" width="4" height="5" rx="1.4" fill="#9a5f34"/></svg>';
  I.pilar = '<svg viewBox="0 0 32 32"><rect x="9" y="7" width="14" height="19" rx="2.6" fill="#e8decb"/><rect x="10.5" y="8" width="3" height="17" rx="1.4" fill="#fffaf0"/><path d="M11 6.2l1.2-1.6h2.4l1.2 1.6zM17 6.2l1.2-1.6h2.4l1.2 1.6z" fill="#ffc93c"/><rect x="6" y="25.5" width="20" height="3.8" rx="1.5" fill="#c9bca6"/></svg>';
  I.trava = '<svg viewBox="0 0 32 32"><path d="M5 9l11 5 11-5v14l-11-5-11 5z" fill="#2fb5a3"/><path d="M5 9l11 5 11-5" stroke="#8ff3e4" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="16" cy="16" r="1.8" fill="#ffc93c"/></svg>';
  I.play = '<svg viewBox="0 0 20 20"><path d="M6.5 4.2l9 5.8-9 5.8z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  I.arrow = '<svg viewBox="0 0 20 20"><path d="M4 10h11M10.5 5l5 5-5 5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.okc = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#43c59e"/><path d="M6.5 12.5l3.6 3.6 7.4-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  I.hint = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ffb27a"/><path d="M12 6.5a3.8 3.8 0 0 0-2.4 6.8c.6.5.9 1 .9 1.7h3c0-.7.3-1.2.9-1.7A3.8 3.8 0 0 0 12 6.5z" fill="#fff"/><rect x="10.3" y="16" width="3.4" height="1.8" rx=".9" fill="#fff"/></svg>';
  I.lock = '<svg viewBox="0 0 24 24"><path d="M7.6 10.5V8a4.4 4.4 0 0 1 8.8 0v2.5" stroke="#ffcf6a" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="4.5" y="10" width="15" height="11" rx="3.2" fill="#ffc93c"/><rect x="4.5" y="10" width="15" height="3.6" rx="1.8" fill="#ffe08a"/><circle cx="12" cy="15.3" r="1.7" fill="#7a4a12"/><rect x="11.2" y="15.8" width="1.6" height="3" rx=".8" fill="#7a4a12"/></svg>';
  I.mic = '<svg viewBox="0 0 32 32"><rect x="11" y="3.5" width="10" height="16.5" rx="5" fill="#fff"/><path d="M7.5 15a8.5 8.5 0 0 0 17 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M16 23.5V28M11.5 28.2h9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>';
  I.guard = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#fffaf0"/><rect x="5.2" y="5.5" width="13.6" height="13" rx="4" fill="#bfae98"/><rect x="4.6" y="7.2" width="14.8" height="2.6" rx="1.2" fill="#8a5a34"/><ellipse cx="9.2" cy="12" rx="1.7" ry="1.25" fill="#ffb238"/><ellipse cx="14.8" cy="12" rx="1.7" ry="1.25" fill="#ffb238"/><path d="M5.2 15.5q6.8 6.5 13.6 0v3H5.2z" fill="#6f9e44"/><path d="M10 15q2 1.3 4 0" stroke="#5a4636" stroke-width="1" fill="none" stroke-linecap="round"/></svg>';
  I.weight = '<svg viewBox="0 0 32 32"><path d="M16 4v14" stroke="#ff8a2a" stroke-width="3.4" stroke-linecap="round"/><path d="M10 13l6 7 6-7z" fill="#ff8a2a"/><path d="M5 24h22" stroke="#c98a4b" stroke-width="4" stroke-linecap="round"/><path d="M7 28v-3M25 28v-3" stroke="#43c59e" stroke-width="3" stroke-linecap="round"/></svg>';
  I.vol = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#ff8a2a"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#ff8a2a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  I.home = '<svg viewBox="0 0 20 20"><path d="M3 9.5L10 4l7 5.5V17h-4.5v-4.5h-5V17H3z" fill="#fff"/></svg>';
  I.coins = '<svg viewBox="0 0 32 32"><path d="M3 21h26" stroke="#c98a4b" stroke-width="3" stroke-linecap="round"/><path d="M7 21v6M25 21v6" stroke="#9a5f34" stroke-width="3" stroke-linecap="round"/><path d="M6 20.5q10-3 20 0" stroke="#e8c48a" stroke-width="2" fill="none"/>' +
    '<ellipse cx="16" cy="17" rx="4.5" ry="1.8" fill="#f2a71a"/><ellipse cx="16" cy="15.4" rx="4.5" ry="1.8" fill="#ffc93c"/><ellipse cx="16" cy="13.8" rx="4.5" ry="1.8" fill="#f2a71a"/><ellipse cx="16" cy="12.2" rx="4.5" ry="1.8" fill="#ffd65a"/><ellipse cx="16" cy="10.6" rx="4.5" ry="1.8" fill="#ffc93c" stroke="#d99a12" stroke-width=".8"/></svg>';
  I.logo = '<svg viewBox="0 0 64 64"><path d="M32 6l22 11v26L32 54 10 43V17z" fill="#ff8a2a"/><path d="M32 6l22 11-22 11-22-11z" fill="#ffb15c"/><path d="M32 28v26L10 43V17z" fill="#e86f12"/>' +
    '<path d="M26 14.5l3-1.7h6l3 1.7-3 1.7h-6z" fill="#ffd23f"/><path d="M15 34l9-4.5v9L15 43z" fill="#2fb5a3"/><path d="M37 41l9-4.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M37 46l9-4.5" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>';

  /* ilustrações da aula (2D limpa) */
  var ILL_BASE = '<rect x="0" y="62" width="240" height="18" fill="#7fd0f0"/><path d="M0 66q10-3 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke="#bff3ee" stroke-width="2" fill="none"/>' +
    '<path d="M0 44h52l14 36H0z" fill="#8fd16a"/><path d="M240 44h-52l-14 36h66z" fill="#8fd16a"/><path d="M0 44h52v6H0zM188 44h52v6h-52z" fill="#6bbd4c"/>';
  KS.ILL = {
    gap: '<svg viewBox="0 0 240 84">' + ILL_BASE +
      '<rect x="20" y="34" width="62" height="10" rx="3" fill="#cd8d4e"/><rect x="158" y="34" width="62" height="10" rx="3" fill="#cd8d4e"/><rect x="88" y="34" width="64" height="10" rx="3" fill="none" stroke="#ff8a2a" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<text x="120" y="26" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="600" font-size="13" fill="#e8701a">falta este pedaço!</text></svg>',
    apoio: '<svg viewBox="0 0 240 84">' + ILL_BASE +
      '<rect x="22" y="22" width="196" height="12" rx="3.5" fill="#cd8d4e"/><rect x="24" y="23.5" width="192" height="3" rx="1.5" fill="#e8b17a"/>' +
      '<path d="M30 34h22v10H30zM188 34h22v10h-22z" fill="#d9cdb8" stroke="#b8a690" stroke-width="1.5"/>' +
      '<circle cx="41" cy="39" r="9" fill="none" stroke="#2f6fe0" stroke-width="2.4"/><circle cx="199" cy="39" r="9" fill="none" stroke="#2f6fe0" stroke-width="2.4"/>' +
      '<text x="41" y="60" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="600" font-size="12" fill="#1d4fb0">apoio</text><text x="199" y="60" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="600" font-size="12" fill="#1d4fb0">apoio</text></svg>',
    viga: '<svg viewBox="0 0 240 84">' + ILL_BASE +
      '<rect x="22" y="22" width="196" height="12" rx="3.5" fill="#cd8d4e"/><rect x="24" y="23.5" width="192" height="3" rx="1.5" fill="#e8b17a"/>' +
      '<path d="M30 34h22v10H30zM188 34h22v10h-22z" fill="#d9cdb8"/>' +
      '<path d="M120 4v12" stroke="#ff8a2a" stroke-width="3" stroke-linecap="round"/><path d="M114 12l6 7 6-7z" fill="#ff8a2a"/>' +
      '<path d="M41 50v-6M199 50v-6" stroke="#43c59e" stroke-width="3" stroke-linecap="round"/><path d="M36 47l5-6 5 6zM194 47l5-6 5 6z" fill="#43c59e"/>' +
      '<text x="120" y="52" text-anchor="middle" font-family="Fredoka,system-ui,sans-serif" font-weight="600" font-size="13" fill="#9a5f34">viga</text></svg>',
    pilar: '<svg viewBox="0 0 240 84">' + ILL_BASE +
      '<rect x="22" y="22" width="196" height="12" rx="3.5" fill="#cd8d4e"/><rect x="24" y="23.5" width="192" height="3" rx="1.5" fill="#e8b17a"/>' +
      '<path d="M30 34h22v10H30zM188 34h22v10h-22z" fill="#d9cdb8"/>' +
      '<rect x="110" y="34" width="20" height="46" rx="3" fill="#e8decb" stroke="#b8a690" stroke-width="1.5"/><path d="M120 40v26" stroke="#ff8a2a" stroke-width="2.4" stroke-dasharray="3 3"/><path d="M115 62l5 6 5-6z" fill="#ff8a2a"/>' +
      '<text x="150" y="58" font-family="Fredoka,system-ui,sans-serif" font-weight="600" font-size="13" fill="#1d4fb0">pilar</text></svg>'
  };

  /* distintivo bronze "Construtor de Pontes" */
  KS.badgeSVG = function () {
    var id = 'ksbd' + (++uid), n = 24, d = '';
    for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 44 : 48; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); }
    return '<svg viewBox="0 0 100 100"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2b27a"/><stop offset=".5" stop-color="#cd7f32"/><stop offset="1" stop-color="#9a5a22"/></linearGradient></defs>' +
      '<path d="M30 80l-8 18 12-4 6 8 6-16zM70 80l8 18-12-4-6 8-6-16z" fill="#2f6fe0"/>' +
      '<path d="' + d + 'Z" fill="url(#' + id + ')" stroke="#8a4f1c" stroke-width="1.5"/><circle cx="50" cy="50" r="34" fill="#fffaf0" stroke="#e0a466" stroke-width="3"/>' +
      '<path d="M22 60h56" stroke="#5aa9e6" stroke-width="4" stroke-linecap="round"/><path d="M24 66q6-3 12 0t12 0 12 0 12 0" stroke="#5aa9e6" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<rect x="22" y="44" width="56" height="7" rx="2" fill="#cd8d4e"/><rect x="45" y="51" width="10" height="11" rx="1.5" fill="#e8decb"/><path d="M28 44v-10M72 44v-10" stroke="#9a5f34" stroke-width="3" stroke-linecap="round"/><path d="M28 34q22 10 44 0" stroke="#e8d3a8" stroke-width="2" fill="none"/>' +
      '<path d="M50 20l2.4 4.8 5.3.8-3.9 3.7.9 5.2L50 32l-4.7 2.5.9-5.2-3.9-3.7 5.3-.8z" fill="#cd7f32"/></svg>';
  };
  /* selo "Resposta aprovada" do chefão */
  KS.sealSVG = function () {
    var id = 'kssl' + (++uid), n = 26, R1 = 92, R2 = 84, d = '';
    for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? R2 : R1; d += (i ? 'L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1); }
    return '<svg viewBox="0 0 200 200"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f2a71a"/></linearGradient></defs>' +
      '<path d="' + d + 'Z" fill="url(#' + id + ')" stroke="#d98a12" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="100" r="66" fill="#fffaf0" stroke="#f2a71a" stroke-width="4"/><circle cx="100" cy="100" r="58" fill="none" stroke="#ffcf6a" stroke-width="1.6" stroke-dasharray="3 4"/>' +
      '<circle cx="100" cy="88" r="30" fill="#2fb582"/><path d="M85 88.5l10 10 20-21" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8 128h22l-8 12 8 12H8z" fill="#1f8a63"/><path d="M192 128h-22l8 12-8 12h22z" fill="#1f8a63"/>' +
      '<path d="M22 120h156v28H22z" fill="#2fb582"/><path d="M22 148l10 6v-6zM178 148l-10 6v-6z" fill="#17694b"/>' +
      '<text x="100" y="139.5" text-anchor="middle" font-family="Fredoka,\'Baloo 2\',system-ui,sans-serif" font-weight="600" font-size="19" fill="#fff">Resposta aprovada</text></svg>';
  };

  /* helpers de DOM */
  KS.el = function (tag, cls, html, parent) {
    var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
  };
})();
