/* The click (§2.3, ASSET LOCKED).
   A slide that seats — Magnetic_slide_closu. NOT a slash. The file is the full,
   untrimmed recording (mono, normalized): ~850ms of slide building under the
   writing, the thk (the seat) at ~872ms, then a ~1070ms tail that decays as the
   1100ms split finishes opening.

   Sync the LANDING, not the start: intro.js fires this at `t_crossing − 872ms`
   so the thk lands on the crossing frame. playClick(lead) is passed that offset
   so the synth fallback (which has no leading slide) can delay itself to land on
   the same frame. */
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
    // Play now: the file's own ~872ms of lead-in (the slide) puts the thk on
    // the crossing, because intro.js already called us `lead` seconds early.
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g).connect(ctx.destination);
    src.start();
  }

  function playSynth(lead) {
    // The synth is a point event with no slide, so wait out the lead the file
    // would have spent sliding — its hit lands on the same crossing frame.
    var t = ctx.currentTime + (lead || 0);
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

  // lead = seconds by which we were called before the crossing (the file's thk
  // offset). File ignores it (its own slide covers it); synth waits it out.
  function playClick(lead) {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (buffer) playFile(); else playSynth(lead);
  }

  return { prime: prime, playClick: playClick };
})();
