/* The click (§2.3).
   Rolex's sound is a caseback torquing home — a heavy door, a clasp closing.
   NOT a slash. Short, dense, no ring, no metallic sustain.

   This synthesises a placeholder so timing can be tuned now. Drop a real file
   at assets/audio/click.wav and it is used automatically, no code change — the
   frame-accurate sync in intro.js fires the same play() either way. */
window.CENT = window.CENT || {};

CENT.audio = (function () {
  var ctx = null;
  var buffer = null;          // decoded real file, if present
  var ready = false;

  var FILE = 'assets/audio/click.wav';

  function prime() {
    // Must be called from a user gesture (the gate) to unlock audio.
    if (ready) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ready = true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      loadFile();
    } catch (e) { ctx = null; }
  }

  function loadFile() {
    // Best-effort: prefer a real recording when one is dropped in.
    fetch(FILE)
      .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function (buf) { return ctx.decodeAudioData(buf); })
      .then(function (decoded) { buffer = decoded; })
      .catch(function () { buffer = null; /* synth fallback stays */ });
  }

  function playFile() {
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g).connect(ctx.destination);
    src.start();
  }

  function playSynth() {
    var t = ctx.currentTime;
    var out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);

    // 1) low body — a torquing thump. Sine dropping fast, hard decay.
    var body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(180, t);
    body.frequency.exponentialRampToValueAtTime(52, t + 0.055);
    var bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.9, t + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);
    body.connect(bodyGain).connect(out);
    body.start(t); body.stop(t + 0.2);

    // 2) the contact — a short filtered noise burst. The "torque home".
    var dur = 0.09;
    var noise = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    var nd = noise.getChannelData(0);
    for (var i = 0; i < nd.length; i++) {
      nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 2.4);
    }
    var nSrc = ctx.createBufferSource();
    nSrc.buffer = noise;
    var band = ctx.createBiquadFilter();
    band.type = 'lowpass';
    band.frequency.setValueAtTime(2600, t);
    band.frequency.exponentialRampToValueAtTime(700, t + 0.06);
    band.Q.value = 0.8;
    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.5, t);
    nGain.gain.exponentialRampToValueAtTime(0.0006, t + 0.08);
    nSrc.connect(band).connect(nGain).connect(out);
    nSrc.start(t); nSrc.stop(t + dur);
  }

  function playClick() {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (buffer) playFile(); else playSynth();
  }

  return { prime: prime, playClick: playClick };
})();
