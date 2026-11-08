/* KidsSchooling — utilidades: matemática, salvamento (localStorage) e sons gerados (WebAudio). */
(function () {
  'use strict';
  var KS = window.KS = window.KS || {};

  /* ---------- matemática ---------- */
  var U = KS.u = {};
  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.sstep = function (a, b, x) { x = U.clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  U.lerp = function (a, b, k) { return a + (b - a) * k; };
  U.outBack = function (x, c) { var c1 = c || 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  U.outCubic = function (x) { return 1 - Math.pow(1 - x, 3); };
  U.inOut = function (x) { x = U.clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  U.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  U.angLerp = function (a, b, k) { var d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };
  U.damp = function (dt, speed) { return 1 - Math.exp(-dt * speed); };

  /* ---------- salvamento local (com try/catch: modo anônimo, bloqueado etc.) ---------- */
  var KEY = 'kidsschooling.vilaDoRiacho.v1';
  KS.store = {
    load: function () {
      try { var s = window.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
    },
    save: function (data) {
      try { window.localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
    },
    clear: function () { try { window.localStorage.removeItem(KEY); } catch (e) { /* sem armazenamento */ } }
  };

  /* ---------- sons gerados (sem arquivos). Só liga depois do primeiro toque. ---------- */
  var ctx = null, master = null, vol = 0.7, noiseBuf = null;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }
  function tone(freq, t0, dur, type, gain, slideTo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, f0, f1, gain, q) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1.2; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
  }
  var SFX = {
    tap: function (t) { tone(660, t, 0.08, 'triangle', 0.12); },
    step: function (t) { noise(t, 0.06, 900, 500, 0.03, 0.8); },
    talk: function (t) { tone(420 + Math.random() * 120, t, 0.07, 'triangle', 0.05); },
    ok: function (t) { tone(523, t, 0.16, 'triangle', 0.18); tone(659, t + 0.09, 0.16, 'triangle', 0.18); tone(784, t + 0.18, 0.3, 'triangle', 0.2); },
    xp: function (t) { tone(988, t, 0.12, 'sine', 0.16); tone(1319, t + 0.08, 0.25, 'sine', 0.16); },
    err: function (t) { tone(330, t, 0.16, 'triangle', 0.14); tone(262, t + 0.13, 0.24, 'triangle', 0.14); },
    snap: function (t) { noise(t, 0.08, 2400, 900, 0.35, 0.9); tone(180, t, 0.12, 'square', 0.08, 90); tone(1200, t + 0.03, 0.08, 'sine', 0.08); },
    whoosh: function (t) { noise(t, 0.35, 300, 1800, 0.12, 0.7); },
    rumble: function (t) { noise(t, 1.6, 120, 60, 0.4, 0.6); tone(55, t, 1.6, 'sine', 0.25, 40); },
    select: function (t) { tone(784, t, 0.07, 'triangle', 0.12); tone(1046, t + 0.05, 0.1, 'triangle', 0.1); },
    fanfare: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.12, 0.35, 'triangle', 0.18); }); tone(1318, t + 0.5, 0.7, 'sine', 0.16); },
    creak: function (t) { tone(140, t, 0.4, 'sawtooth', 0.04, 110); }
  };
  KS.audio = {
    unlock: function () { ensure(); },
    play: function (name) {
      if (!ctx || vol <= 0.001 || !SFX[name]) return;
      try { SFX[name](ctx.currentTime + 0.005); } catch (e) { /* ignora */ }
    },
    setVolume: function (v) { vol = U.clamp(v, 0, 1); if (master) master.gain.value = vol; },
    getVolume: function () { return vol; }
  };
})();
