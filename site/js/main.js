/* Orchestration. Decide which entrance the visitor gets, then hand off.
   Four pieces of state on the whole site — this is most of them. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A deep link (a client sent one piece) skips the intro entirely (§6).
  // Absolute rule, separate from the returning-visitor skip.
  function isDeepLink() {
    // Pathname routing only applies when served over http(s). On file:// the
    // pathname is the local filesystem path (…/site/index.html), which must NOT
    // count as a deep link — otherwise double-clicking the file skips the intro.
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      var p = location.pathname.replace(/\/index\.html$/, '');
      if (p && p !== '/' && p !== '') return true;           // /showcase/...
    }
    if (/^#\/?showcase/i.test(location.hash)) return true;   // hash routing
    if (/[?&]piece=/.test(location.search)) return true;
    return false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    CENT.pedestals.watch();

    if (isDeepLink()) { CENT.intro.skip(); return; }
    if (reduced)      { CENT.intro.runReduced(); return; }
    if (CENT.intro.hasSeen()) { CENT.intro.skip(); return; }  // don't play twice

    CENT.intro.run();
  });
})();
