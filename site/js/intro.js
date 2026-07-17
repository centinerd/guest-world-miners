/* THE INTRO (§2) — draw → glint → click → split.

   The whole trick is non-linear timing (§2.2): a hand accelerates into strokes
   and hesitates at joins. Linear = machine = dead.

   The wordmark is now the real asset: a hand-authored Centinily *signature* —
   a few long continuous strokes plus a couple of tiny accents, rather than 9
   per-letter skeletons. So the draw is derived from the actual path geometry:

     - strokes draw in document order, the glint riding the pen tip
     - duration is proportional to each stroke's length (a hand takes longer
       over a longer line), so the big C-through-body stroke gets the long beat
     - tiny accents (i-dots, nicks) pop in quick, no glint
     - the stroke whose tail ends furthest right is drawn LAST and rushes off
       (the y exit) — its endpoint is the crossing where the click lands

   This is asset-shape-agnostic: hand it 9 per-letter paths instead and it still
   works. Tunables live in PLAN below. */
window.CENT = window.CENT || {};

CENT.intro = (function () {
  var intro   = document.getElementById('intro');
  var gate    = document.getElementById('gate');
  var wrap    = document.getElementById('wordmarkWrap');
  var glint   = document.getElementById('glint');
  var flash   = document.getElementById('flash');
  var panelTop    = document.getElementById('panelTop');
  var panelBottom = document.getElementById('panelBottom');

  var PLAN = {
    hold: 0.20,        // beat after the click before ink appears (§2.2)
    drawTotal: 2.5,    // seconds across all real strokes
    strokeMin: 0.5,    // floor for a real stroke
    accentMax: 30,     // path length (viewBox units) below which it's an accent
    accentDur: 0.05,   // accents pop in
    gap: 0.05          // pen lift between strokes
  };

  var paths = [];
  var svg = null;
  var exitPath = null;

  function injectWordmark() {
    // Prefer the inline SVG (so the site runs from file:// with no server).
    // Fall back to fetching the asset file when served over http without it.
    var existing = wrap.querySelector('svg');
    if (existing) { adopt(existing); return Promise.resolve(); }
    return fetch('assets/wordmark/centinily.svg')
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        wrap.insertAdjacentHTML('afterbegin', txt);
        adopt(wrap.querySelector('svg'));
      });
  }

  function adopt(el) {
    svg = el;
    paths = Array.prototype.slice.call(svg.querySelectorAll('path'));
    primePaths();
  }

  // Measure each path and set it "undrawn": dasharray = length, offset = length.
  function primePaths() {
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      var end = p.getPointAtLength(len);
      p.__len = len;
      p.__endX = end.x;
      p.__accent = len < PLAN.accentMax;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    // the exit stroke = the real stroke whose tail ends furthest right
    exitPath = paths
      .filter(function (p) { return !p.__accent; })
      .reduce(function (a, b) { return b.__endX > a.__endX ? b : a; });
  }

  // Order + timing, derived from geometry.
  function drawSteps() {
    var strokes = paths.filter(function (p) { return !p.__accent; });
    var accents = paths.filter(function (p) { return p.__accent; });
    var others  = strokes.filter(function (p) { return p !== exitPath; });
    var totalLen = strokes.reduce(function (s, p) { return s + p.__len; }, 0) || 1;

    function durFor(p) {
      return Math.max(PLAN.strokeMin, PLAN.drawTotal * p.__len / totalLen);
    }

    var steps = [];
    // main strokes first, in document order, glint riding each
    others.forEach(function (p) {
      steps.push({ path: p, dur: durFor(p), ease: CENT.ease.letter, glint: true, gap: PLAN.gap });
    });
    // accents: quick, no glint, before the final crossing
    accents.forEach(function (p) {
      steps.push({ path: p, dur: PLAN.accentDur, ease: 'none', glint: false, gap: 0.02 });
    });
    // the exit stroke last — hesitates through the body, then rushes off (§2.2)
    steps.push({ path: exitPath, dur: durFor(exitPath), ease: CENT.ease.yexit, glint: true, gap: 0, isExit: true });
    return steps;
  }

  // Place the wordmark so its ink bottom sits on the vault seam — the whole
  // signature rides up intact on the top panel (its descenders dip below the
  // y-exit line, so we split just beneath the word, not through it).
  function layout() {
    var splitY = window.innerHeight / 2;               // the vault seam
    panelTop.style.height = (splitY + 1) + 'px';        // 1px overlap, no hairline
    panelBottom.style.height = (window.innerHeight - splitY) + 'px';

    var vbH = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 1;
    var bb = svg.getBBox();                             // ink bounds, viewBox units
    var fBottom = (bb.y + bb.height) / vbH;             // fraction of art height at ink bottom
    var svgH = svg.getBoundingClientRect().height;      // rendered height (px)

    wrap.style.bottom = (-(1 - fBottom) * svgH) + 'px';
    wrap.style.top = 'auto';
    return { splitY: splitY };
  }

  // Build the whole sequence and return the timeline (not yet playing).
  function build() {
    var geo = layout();
    var tl = gsap.timeline({ paused: true });

    gsap.set(glint, { opacity: 0 });
    gsap.set(flash, { opacity: 0, scale: 0.6 });

    var steps = drawSteps();
    var t = PLAN.hold;

    steps.forEach(function (s) {
      // the stroke draws
      tl.to(s.path, { strokeDashoffset: 0, duration: s.dur, ease: s.ease }, t);

      if (s.glint) {
        // the glint rides the pen tip along this exact path
        tl.to(glint, {
          duration: s.dur, ease: s.ease,
          motionPath: { path: s.path, align: s.path, alignOrigin: [0.5, 0.5] }
        }, t);
        // pen down; and pen up at the join (kept lit into the crossing on exit)
        tl.to(glint, { opacity: 1, duration: 0.06, ease: 'none' }, t);
        if (!s.isExit) tl.to(glint, { opacity: 0, duration: 0.06, ease: 'none' }, t + s.dur - 0.05);
      }

      t += s.dur + s.gap;
    });

    // ---- THE CLICK (§2.3): lands on the exact frame the y-tail crosses out.
    var crossAt = t; // == end of the exit stroke == glint at the tail tip
    tl.addLabel('cross', crossAt);

    tl.call(function () { if (CENT.audio) CENT.audio.playClick(); }, null, 'cross');
    positionFlash();
    tl.to(flash, { opacity: 1, scale: 1, duration: 0.016, ease: 'none' }, 'cross');
    tl.to(flash, { opacity: 0, scale: 1.3, duration: 0.13, ease: 'power2.out' }, 'cross+=0.016');
    tl.to(glint, { opacity: 0, duration: 0.06, ease: 'none' }, 'cross');

    // ---- THE SPLIT (§2.4): black parts along the y's line, a vault door.
    // Heavy in-out, no overshoot. The signature rides up with the top panel.
    tl.to(panelTop,    { yPercent: -100, duration: 1.1, ease: CENT.ease.vault }, 'cross+=0.02');
    tl.to(panelBottom, { yPercent:  100, duration: 1.1, ease: CENT.ease.vault }, 'cross+=0.02');

    // reveal the first pedestal as the doors open — the rake sweeps in
    tl.call(function () { CENT.pedestals.revealFirst(); }, null, 'cross+=0.42');
    tl.call(finish, null, 'cross+=1.15');

    return tl;
  }

  // The blowout fires at the crossing point — the y-tail's tip, in screen px.
  function positionFlash() {
    var pt = exitPath.getPointAtLength(exitPath.__len);
    var m = exitPath.getScreenCTM();
    flash.style.left = (pt.x * m.a + pt.y * m.c + m.e) + 'px';
    flash.style.top  = (pt.x * m.b + pt.y * m.d + m.f) + 'px';
  }

  function finish() {
    intro.classList.add('is-done');
    document.body.classList.remove('intro-open');
  }

  // ---------- public entry points ----------

  // Full performance, gated on the click.
  function run() {
    document.body.classList.add('intro-open');
    injectWordmark().then(function () {
      var tl = build();

      function begin(e) {
        if (e) e.preventDefault();
        gate.removeEventListener('click', begin);
        gate.removeEventListener('keydown', onKey);
        if (CENT.audio) CENT.audio.prime();     // unlock audio on the gesture
        gate.classList.add('is-dismissed');
        markSeen();
        tl.play();
      }
      function onKey(e) { if (e.key === 'Enter' || e.key === ' ') begin(e); }
      gate.addEventListener('click', begin);
      gate.addEventListener('keydown', onKey);
    });
  }

  // Reduced motion (§2.5): show the wordmark statically, no draw, cut to site.
  // No click sound here, so the gate is unnecessary — drop it instantly (not
  // the 600ms fade) so the static signature is seen at full brass, then hold.
  function runReduced() {
    document.body.classList.add('intro-open');
    gate.style.display = 'none';
    injectWordmark().then(function () {
      layout();
      paths.forEach(function (p) { p.style.strokeDashoffset = 0; });
      gsap.delayedCall(1.4, function () { finish(); CENT.pedestals.revealFirst(); });
    });
  }

  // Returning visitor / deep link: no gate, no intro at all.
  function skip() {
    gate.classList.add('is-dismissed');
    intro.classList.add('is-done');
    document.body.classList.remove('intro-open');
    CENT.pedestals.revealFirst();
  }

  function markSeen() { try { sessionStorage.setItem('cent_seen', '1'); } catch (e) {} }
  function hasSeen()  { try { return sessionStorage.getItem('cent_seen') === '1'; } catch (e) { return false; } }

  return { run: run, runReduced: runReduced, skip: skip, hasSeen: hasSeen };
})();
