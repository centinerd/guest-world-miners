/* THE INTRO (§2) — draw → glint → click → split.

   The whole trick is non-linear timing (§2.2): a hand accelerates into
   strokes and hesitates at joins. Linear = machine = dead. So per-letter
   durations vary, the C gets its own enormous beat, and the y rushes off.

   The wordmark is a placeholder (assets/wordmark/centinily.svg) but the
   structural contract is real: 9 open skeleton paths in draw order, the y
   exiting horizontally off-frame. Everything here works unchanged when the
   hand-authored asset is swapped in. */
window.CENT = window.CENT || {};

CENT.intro = (function () {
  var intro   = document.getElementById('intro');
  var gate    = document.getElementById('gate');
  var wrap    = document.getElementById('wordmarkWrap');
  var glint   = document.getElementById('glint');
  var flash   = document.getElementById('flash');
  var panelTop    = document.getElementById('panelTop');
  var panelBottom = document.getElementById('panelBottom');

  var VIEWBOX_H = 520;

  // per-letter beats (seconds). C is enormous; entinil staggers ~200ms;
  // y hesitates then rushes off. Gaps are the pen lifting between letters.
  var BEATS = [
    { dur: 0.90, gap: 0.05, ease: 'letter' }, // C — its own time
    { dur: 0.20, gap: 0.03, ease: 'letter' }, // e
    { dur: 0.21, gap: 0.03, ease: 'letter' }, // n
    { dur: 0.19, gap: 0.04, ease: 'letter' }, // t
    { dur: 0.16, gap: 0.02, ease: 'letter' }, // i
    { dur: 0.21, gap: 0.03, ease: 'letter' }, // n
    { dur: 0.16, gap: 0.02, ease: 'letter' }, // i
    { dur: 0.22, gap: 0.05, ease: 'letter' }, // l
    { dur: 0.40, gap: 0.00, ease: 'yexit'  }  // y — loop, then off-frame
  ];

  var paths = [];
  var svg = null;

  function injectWordmark() {
    // Prefer the inline SVG (so the site runs from file:// with no server).
    // Fall back to fetching the asset file when served over http without it.
    var existing = wrap.querySelector('svg');
    if (existing) {
      svg = existing;
      paths = Array.prototype.slice.call(svg.querySelectorAll('path'));
      primePaths();
      return Promise.resolve();
    }
    return fetch('assets/wordmark/centinily.svg')
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        wrap.insertAdjacentHTML('afterbegin', txt);
        svg = wrap.querySelector('svg');
        paths = Array.prototype.slice.call(svg.querySelectorAll('path'));
        primePaths();
      });
  }

  // Set each path to "undrawn": dasharray = length, offset = length.
  function primePaths() {
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.__len = len;
    });
  }

  // Place the wordmark so the y-exit endpoint lands exactly on the split
  // line (the meeting edge of the two panels), and size the panels to it.
  function layout() {
    var splitY = window.innerHeight / 2;          // the vault seam
    // overlap the two panels by 1px so no subpixel hairline shows at the seam
    panelTop.style.height = (splitY + 1) + 'px';
    panelBottom.style.height = (window.innerHeight - splitY) + 'px';

    // fractional height of the y-exit endpoint within the SVG viewBox
    var yPath = paths[paths.length - 1];
    var end = yPath.getPointAtLength(yPath.__len);
    var fY = end.y / VIEWBOX_H;                    // 0..1 from top of art

    // rendered wordmark height (SVG width drives it, height auto)
    var svgH = svg.getBoundingClientRect().height;

    // hang the wrapper below the panel bottom so the endpoint sits on it:
    //   bottom = -(1 - fY) * svgH
    wrap.style.bottom = (-(1 - fY) * svgH) + 'px';
    wrap.style.top = 'auto';

    return { splitY: splitY };
  }

  function easeFor(name) {
    return CENT.ease[name] || CENT.ease.letter;
  }

  // Build the whole sequence and return the timeline (not yet playing).
  function build() {
    var geo = layout();
    var tl = gsap.timeline({ paused: true });

    gsap.set(glint, { opacity: 0 });
    gsap.set(flash, { opacity: 0, scale: 0.6 });

    var t = 0.20; // hold after click before anything (§2.2) — confidence

    paths.forEach(function (p, i) {
      var b = BEATS[i];
      var ease = easeFor(b.ease);

      // the stroke draws
      tl.to(p, { strokeDashoffset: 0, duration: b.dur, ease: ease }, t);

      // the glint rides the pen tip along this exact path
      tl.to(glint, {
        duration: b.dur,
        ease: ease,
        motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] }
      }, t);

      // pen down / pen up — the point lights the stroke, then lifts at the join
      tl.to(glint, { opacity: 1, duration: 0.06, ease: 'none' }, t);
      if (i < paths.length - 1) {
        tl.to(glint, { opacity: 0, duration: 0.06, ease: 'none' }, t + b.dur - 0.05);
      }

      t += b.dur + b.gap;
    });

    // ---- THE CLICK (§2.3): lands on the exact frame the y crosses the edge.
    var crossAt = t; // == end of the y tween == glint at the off-frame endpoint
    tl.addLabel('cross', crossAt);

    // fire the sound on that frame, and one frame of white blows out
    tl.call(function () { if (CENT.audio) CENT.audio.playClick(); }, null, 'cross');
    positionFlash(geo.splitY);
    tl.to(flash, { opacity: 1, scale: 1, duration: 0.016, ease: 'none' }, 'cross');
    tl.to(flash, { opacity: 0, scale: 1.3, duration: 0.13, ease: 'power2.out' }, 'cross+=0.016');
    tl.to(glint, { opacity: 0, duration: 0.06, ease: 'none' }, 'cross');

    // ---- THE SPLIT (§2.4, LOCKED): black parts along the y's line.
    // A vault door, not a curtain. Heavy in-out, no overshoot.
    tl.to(panelTop,    { yPercent: -100, duration: 1.1, ease: CENT.ease.vault }, 'cross+=0.02');
    tl.to(panelBottom, { yPercent:  100, duration: 1.1, ease: CENT.ease.vault }, 'cross+=0.02');

    // reveal the first pedestal as the doors open — the rake sweeps in
    tl.call(function () { CENT.pedestals.revealFirst(); }, null, 'cross+=0.42');

    // tidy up once the doors are open
    tl.call(finish, null, 'cross+=1.15');

    return tl;
  }

  function positionFlash(splitY) {
    // the crossing point: the right viewport edge, on the split line
    flash.style.left = window.innerWidth + 'px';
    flash.style.top = splitY + 'px';
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
      function onKey(e) {
        if (e.key === 'Enter' || e.key === ' ') begin(e);
      }
      gate.addEventListener('click', begin);
      gate.addEventListener('keydown', onKey);
    });
  }

  // Reduced motion (§2.5): show the wordmark statically, no draw, no click,
  // cut to site. Four lines of intent.
  function runReduced() {
    document.body.classList.add('intro-open');
    gate.classList.add('is-dismissed');
    injectWordmark().then(function () {
      layout();
      paths.forEach(function (p) { p.style.strokeDashoffset = 0; });
      gsap.delayedCall(0.7, function () {
        finish();
        CENT.pedestals.revealFirst();
      });
    });
  }

  // Returning visitor / deep link: no gate, no intro at all.
  function skip() {
    gate.classList.add('is-dismissed');
    intro.classList.add('is-done');
    document.body.classList.remove('intro-open');
    CENT.pedestals.revealFirst();
  }

  function markSeen() {
    try { sessionStorage.setItem('cent_seen', '1'); } catch (e) {}
  }
  function hasSeen() {
    try { return sessionStorage.getItem('cent_seen') === '1'; } catch (e) { return false; }
  }

  return { run: run, runReduced: runReduced, skip: skip, hasSeen: hasSeen };
})();
