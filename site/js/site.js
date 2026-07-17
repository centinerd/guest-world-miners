/* Shared site choreography — everything that isn't the intro.

   - the corner mark (the signature kept, small, the way back)
   - the tray ritual (§6): leaving through the veil, arriving on velvet
   - the game-page entrance: stage settles, then the code slides out
     beneath it. Slower than feels comfortable. No spring, ever. */
window.CENT = window.CENT || {};

CENT.site = (function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var veil = document.getElementById('veil');

  // ---- the corner mark ----
  function showMark(instant) {
    var mark = document.querySelector('.mark');
    if (!mark || mark.__shown) return;
    mark.__shown = true;
    mark.classList.add('is-shown');
    if (instant || reduced) gsap.set(mark, { opacity: 1 });
    else gsap.to(mark, { opacity: 1, duration: 0.9, ease: CENT.ease.vault });
  }

  // ---- leaving: the room dims, the piece lifts, then we go ----
  function leaveTo(href, piece) {
    if (reduced || !veil) { location.href = href; return; }
    var tl = gsap.timeline({ onComplete: function () { location.href = href; } });
    if (piece) tl.to(piece, { y: -10, duration: 0.5, ease: CENT.ease.vault }, 0);
    tl.to(veil, { opacity: 1, duration: 0.5, ease: CENT.ease.vault }, 0);
  }

  function bindNav() {
    document.querySelectorAll('a[data-piece]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;  // let new-tab be
        e.preventDefault();
        leaveTo(a.href, a);
      });
    });
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        leaveTo(a.href, null);
      });
    });
  }

  // ---- arriving on a game page: the tray ritual ----
  function enterTray() {
    var stage = document.querySelector('.tray__stage');
    var meta  = document.querySelector('.tray__meta');
    var rest  = document.querySelectorAll(
      '.tray__lines, .tray__code, .tray__quote, .tray__annotation, .tray__foot');

    showMark(true);
    CENT.pedestals.watch();

    if (reduced) {
      CENT.pedestals.revealStage();
      return;
    }

    gsap.set([stage, meta], { opacity: 0, y: 16 });
    gsap.set(rest, { opacity: 0, y: 26 });

    var tl = gsap.timeline({ delay: 0.25 });
    // the piece is presented first —
    tl.to(stage, { opacity: 1, y: 0, duration: 1.1, ease: CENT.ease.arrive }, 0);
    tl.call(function () { CENT.pedestals.revealStage(); }, null, 0.45);
    // — its provenance settles beneath it —
    tl.to(meta, { opacity: 1, y: 0, duration: 1.0, ease: CENT.ease.arrive }, 0.3);
    // — and the tray slides out, one object at a time, heavy and final.
    tl.to(rest, {
      opacity: 1, y: 0, duration: 1.0,
      ease: CENT.ease.arrive, stagger: 0.12
    }, 0.55);
  }

  // ---- boot ----
  document.addEventListener('DOMContentLoaded', function () {
    bindNav();
    if (document.body.classList.contains('page')) enterTray();
  });

  return { showMark: showMark, leaveTo: leaveTo };
})();
