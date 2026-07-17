/* Shared site choreography — everything that isn't the intro.

   - the corner mark (the signature kept, small, the way back)
   - the tray transition (§6): the thumbnail becomes the video.
       · where cross-document View Transitions exist, the browser morphs the
         shared-named vitrine natively; we just let the link navigate.
       · where they don't, we fall back to the veil: the room dims to black,
         the piece lifts, then we go — and the page fades up from black.
   Slower than feels comfortable. No spring, ever. */
window.CENT = window.CENT || {};

CENT.site = (function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var veil = document.getElementById('veil');

  // Native cross-document morph available? Then don't hand-animate the nav.
  var NATIVE_MORPH = supportsViewTransitions();
  function supportsViewTransitions() {
    try { return CSS.supports('view-transition-name', 'none'); }
    catch (e) { return false; }
  }

  // ---- the corner mark ----
  function showMark(instant) {
    var mark = document.querySelector('.mark');
    if (!mark || mark.__shown) return;
    mark.__shown = true;
    mark.classList.add('is-shown');
    if (instant || reduced) gsap.set(mark, { opacity: 1 });
    else gsap.to(mark, { opacity: 1, duration: 0.9, ease: CENT.ease.vault });
  }

  // ---- fallback leaving (no native morph): the room dims, the piece lifts ----
  function veilTo(href, piece) {
    if (reduced || !veil) { location.href = href; return; }
    var tl = gsap.timeline({ onComplete: function () { location.href = href; } });
    if (piece) tl.to(piece, { y: -10, duration: 0.5, ease: CENT.ease.vault }, 0);
    tl.to(veil, { opacity: 1, duration: 0.5, ease: CENT.ease.vault }, 0);
  }

  function bindNav() {
    // With native View Transitions, plain navigation already morphs the piece —
    // intercepting would only get in the way. Let the links be links.
    if (NATIVE_MORPH) return;
    document.querySelectorAll('a[data-piece], a[data-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // let new-tab be
        e.preventDefault();
        veilTo(a.href, a.hasAttribute('data-piece') ? a : null);
      });
    });
  }

  // ---- arriving on a game page ----
  function enterTray() {
    showMark(true);
    CENT.pedestals.watch();     // wakes the in-view video, arms scroll arrivals
    CENT.pedestals.revealStage();

    var stage = document.querySelector('.tray__stage');
    var meta  = document.querySelector('.tray__meta');
    var rest  = document.querySelectorAll(
      '.tray__lines, .tray__code, .tray__quote, .tray__annotation, .tray__foot');

    if (reduced || NATIVE_MORPH) {
      // native morph brings the piece in; nothing to hand-animate here beyond
      // letting the content stand. (Reduced motion: everything simply shown.)
      return;
    }

    // no native morph → present it ourselves: the piece settles, then the tray
    // slides out beneath it, one object at a time, heavy and final.
    gsap.set([stage, meta], { opacity: 0, y: 16 });
    gsap.set(rest, { opacity: 0, y: 26 });
    var tl = gsap.timeline({ delay: 0.2 });
    tl.to(stage, { opacity: 1, y: 0, duration: 1.1, ease: CENT.ease.arrive }, 0);
    tl.to(meta,  { opacity: 1, y: 0, duration: 1.0, ease: CENT.ease.arrive }, 0.3);
    tl.to(rest,  { opacity: 1, y: 0, duration: 1.0, ease: CENT.ease.arrive, stagger: 0.12 }, 0.55);
  }

  // ---- boot ----
  document.addEventListener('DOMContentLoaded', function () {
    bindNav();
    if (document.body.classList.contains('page')) enterTray();
  });

  return { showMark: showMark };
})();
