/* The pedestal (§6) — arrival, the rake, and video discipline.

   - The rake is the signature: a specular streak travels across the piece
     as it arrives. Same move every time. Transform + opacity only (§5) —
     nothing glows at rest, so it lives fully off-frame and fires once.
   - Only the in-view pedestal plays. Four decoding loops would murder the
     framerate the rake depends on, so everything else stays paused. */
window.CENT = window.CENT || {};

CENT.pedestals = (function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Settle any [data-arrive]/[data-entrance] block in. Pedestals also rake.
  function arrive(el) {
    if (!el || el.__arrived) return;
    el.__arrived = true;

    if (!reduced) {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: CENT.ease.arrive });
    } else {
      gsap.set(el, { opacity: 1, y: 0 });
    }

    var rake = el.querySelector('.rake');
    var streak = el.querySelector('.rake__streak');
    if (rake && streak && !reduced) rakeAcross(rake, streak);
    playInView();
  }

  /* The rake: the streak travels edge to edge; the rake layer is masked to the
     frame ring, so only the brass surround catches the light (§5). Brightest
     as it crosses — a specular peak that's gone. Transform + opacity only. */
  function rakeAcross(rake, streak) {
    gsap.killTweensOf([rake, streak]);
    gsap.set(rake, { opacity: 0 });
    gsap.set(streak, { xPercent: -140, filter: 'brightness(1)' });
    var tl = gsap.timeline();
    tl.to(rake, { opacity: 1, duration: 0.18, ease: 'power1.out' }, 0)
      .to(streak, { xPercent: -10, filter: 'brightness(2)', duration: 0.6, ease: CENT.ease.arrive }, 0)
      .to(streak, { xPercent: 130, filter: 'brightness(1)', duration: 0.55, ease: 'power2.in' }, 0.6)
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

  // Scroll-driven arrivals: pedestal pieces and the contact block. The
  // entrance statement is NOT observed — it's in view behind the intro, so it
  // would arrive before the split; revealFirst() reveals it on the split.
  function watch() {
    var blocks = document.querySelectorAll('[data-arrive]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) arrive(e.target);
      });
    }, { threshold: 0.4 });
    blocks.forEach(function (b) { io.observe(b); });
  }

  /* The split reveals the entrance frame (what he does) and brings up the
     persistent corner mark. The pedestals rake on scroll. */
  function revealFirst() {
    arrive(document.querySelector('[data-entrance]'));
    if (CENT.site) CENT.site.showMark();
  }

  /* Game pages: the tray's stage is presented by site.js; this fires its
     rake and wakes its video once it's in place. */
  function revealStage() {
    var stage = document.querySelector('.tray__stage');
    if (!stage) return;
    var rake = stage.querySelector('.rake');
    var streak = stage.querySelector('.rake__streak');
    if (rake && streak && !reduced) rakeAcross(rake, streak);
    playInView();
  }

  return { watch: watch, revealFirst: revealFirst, revealStage: revealStage };
})();
