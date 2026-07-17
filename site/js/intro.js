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

  // §2.2 beat table. Non-linear timing lives INSIDE each path (the eases),
  // not in gaps between letters — the script is joined, there is nothing to
  // stagger. The i dots are the only real pen-lifts and fire as the draw
  // passes their x (§2.2), never batched at the end.
  var PLAN = {
    hold: 0.20,        // beat after the click before ink appears
    durMain: 2.00,     // path 1 — the C swash through the middle
    durExit: 1.48,     // path 3 — t/i/l/y run (~1.1s) + loop (~0.2) + exit (~0.18, 3x)
    gap: 0.05,         // the single join between the two strokes
    accentMax: 30,     // path length (viewBox units) below which it's an i dot
    dotDur: 0.06,      // an i dot pops in
    clickLead: 0.872   // §2.3: fire the file this far before the crossing so the
                       // thk (at ~872ms into it) lands on the crossing frame
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

  var mainPath = null;   // path 1 — C swash through the middle
  var dots = [];         // the i dots (paths 2, 4), by x

  // Measure each path and set it "undrawn": dasharray = length, offset = length.
  function primePaths() {
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      var start = p.getPointAtLength(0);
      var end = p.getPointAtLength(len);
      p.__len = len;
      p.__startX = start.x;
      p.__endX = end.x;
      p.__accent = len < PLAN.accentMax;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    var strokes = paths.filter(function (p) { return !p.__accent; });
    // exit stroke = the one whose tail ends furthest right (the y exit)
    exitPath = strokes.reduce(function (a, b) { return b.__endX > a.__endX ? b : a; });
    // main stroke = the other long stroke (the C swash through the middle)
    mainPath = strokes.filter(function (p) { return p !== exitPath; })
                      .reduce(function (a, b) { return b.__len > a.__len ? b : a; }, strokes[0]);
    dots = paths.filter(function (p) { return p.__accent; })
                .sort(function (a, b) { return a.__startX - b.__startX; });
  }

  // Time within [start, start+dur] at which the pen tip drawing `path` first
  // reaches x = targetX. Used to fire the i dots as the draw passes them (§2.2).
  function timeAtX(path, targetX, start, dur) {
    var L = path.__len, N = 240;
    for (var i = 1; i <= N; i++) {
      if (path.getPointAtLength(L * i / N).x >= targetX) return start + dur * i / N;
    }
    return null;
  }

  // Draw one stroke: the line reveals and the glint rides the pen tip, same
  // ease. Pen down at the start; pen up at the join, unless it's the exit
  // stroke (the glint stays lit into the crossing).
  function drawStroke(tl, path, start, dur, ease, isExit) {
    tl.to(path, { strokeDashoffset: 0, duration: dur, ease: ease }, start);
    tl.to(glint, {
      duration: dur, ease: ease,
      motionPath: { path: path, align: path, alignOrigin: [0.5, 0.5] }
    }, start);
    tl.to(glint, { opacity: 1, duration: 0.06, ease: 'none' }, start);
    if (!isExit) tl.to(glint, { opacity: 0, duration: 0.06, ease: 'none' }, start + dur - 0.05);
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

    // ---- THE DRAW (§2.2). Two strokes, glint riding each; the non-linear
    // timing lives inside the eases, not in gaps.
    var mStart = PLAN.hold;
    var eStart = mStart + PLAN.durMain + PLAN.gap;

    // path 1 — the C swash gets most of it (ease-in spends the time early)
    drawStroke(tl, mainPath, mStart, PLAN.durMain, CENT.ease.letter, false);
    // path 3 — the run hesitates through the loop, then rushes the exit off-frame
    drawStroke(tl, exitPath, eStart, PLAN.durExit, CENT.ease.yexit, true);

    // the i dots — fire as the draw passes their x (paths 2, 4 at x≈649, 810),
    // never batched at the end (that would land them after the descender rips).
    dots.forEach(function (d) {
      var when = timeAtX(mainPath, d.__startX, mStart, PLAN.durMain);   // passed while writing path 1?
      if (when === null) when = timeAtX(exitPath, d.__startX, eStart, PLAN.durExit); // else during path 3
      if (when === null) when = eStart;
      tl.to(d, { strokeDashoffset: 0, duration: PLAN.dotDur, ease: 'none' }, when);
    });

    // ---- THE CLICK (§2.3): lands on the exact frame the y-tail crosses out.
    var crossAt = eStart + PLAN.durExit; // end of the exit stroke == glint at the tail tip
    tl.addLabel('cross', crossAt);

    // Fire the sound `clickLead` early so the slide builds under the writing and
    // the thk seats on the crossing frame (§2.3). Synth waits the lead out.
    tl.call(function () { if (CENT.audio) CENT.audio.playClick(PLAN.clickLead); },
            null, Math.max(0, crossAt - PLAN.clickLead));
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
