/* The pedestal (§6) — arrival, the rake, and video discipline.

   - The rake is the signature: a specular streak travels across the piece
     as it arrives. Same move every time. Transform + opacity only (§5) —
     nothing glows at rest, so it lives fully off-frame and fires once.
   - Only the in-view pedestal plays. Four decoding loops would murder the
     framerate the rake depends on, so everything else stays paused. */
window.CENT = window.CENT || {};

CENT.pedestals = (function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arrive(piece) {
    if (piece.__arrived) return;
    piece.__arrived = true;

    var vitrine = piece.querySelector('[data-vitrine]');
    var rake = piece.querySelector('.rake');

    // The piece settles in — arrives already still, expo-out, no spring.
    if (piece.hasAttribute('data-arrive') && !reduced) {
      gsap.to(piece, {
        opacity: 1, y: 0, duration: 1.1,
        ease: CENT.ease.arrive
      });
    } else {
      gsap.set(piece, { opacity: 1, y: 0 });
    }

    if (rake && !reduced) rakeAcross(rake);
    playInView();
  }

  /* The rake: light travels edge to edge, brightest as it crosses the
     bezel — a slow specular sweep that peaks and is gone. */
  function rakeAcross(rake) {
    gsap.killTweensOf(rake);
    gsap.set(rake, { opacity: 0, xPercent: -140, filter: 'brightness(1)' });
    var tl = gsap.timeline();
    tl.to(rake, { opacity: 1, duration: 0.18, ease: 'power1.out' }, 0)
      // travel edge to edge, brightest (the supernova) as it crosses the bezel
      .to(rake, { xPercent: -10, filter: 'brightness(2)', duration: 0.6, ease: CENT.ease.arrive }, 0)
      .to(rake, { xPercent: 130, filter: 'brightness(1)', duration: 0.55, ease: 'power2.in' }, 0.6)
      .to(rake, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.85);
  }

  /* Lazy video: load on first arrival, and only ever let the in-view one run. */
  function initVideo(video) {
    if (!video || video.__init) return;
    video.__init = true;
    var src = video.getAttribute('data-src');
    if (!src) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!video.src) video.src = src;   // load only when needed
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });
    io.observe(video);

    // A missing file must not leave a broken box — placeholder stays.
    video.addEventListener('error', function () { video.style.display = 'none'; });
  }

  function playInView() {
    document.querySelectorAll('[data-vitrine] video.loop').forEach(initVideo);
  }

  function watch() {
    var pieces = document.querySelectorAll('[data-pedestal] .piece');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) arrive(e.target);
      });
    }, { threshold: 0.4 });
    pieces.forEach(function (p) { io.observe(p); });
  }

  /* Fire the first pedestal's rake explicitly the moment the split reveals
     it — arrival = the vault opening, not a scroll. */
  function revealFirst() {
    var first = document.querySelector('#pedestal-1 .piece');
    if (first) arrive(first);
  }

  return { watch: watch, revealFirst: revealFirst };
})();
