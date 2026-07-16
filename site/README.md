# CENTINILY

A vitrine, not a portfolio. See `CENTINILY BRIEF` for every decision and the
Rejection List. This repo is the build; the brief is the law.

## What's built

The **first build target** (brief §0): the gate through the first pedestal.

> Draw → glint → click → split → rake → bloom.

Everything in that sequence is here and working end to end:

- **The gate** (§2.1) — black, one slow-blinking hairline, *click anywhere*.
  `sessionStorage` skips it for returning visitors; deep links skip it too.
- **The draw** (§2.2) — the wordmark strokes on, per-letter, non-linear. The C
  gets its own beat; the y rushes off-frame.
- **The glint** (§2.2) — one hot point of light rides the pen tip. The only
  light until the click.
- **The click** (§2.3) — a synthesized *caseback-torquing-home* thunk fires on
  the exact frame the y crosses the edge, with a one-frame white blowout.
- **The split** (§2.4, LOCKED) — the black parts along the y's line, a vault
  door, no overshoot, revealing the first pedestal.
- **Pedestal 1** (§6) — Mount Everest Climbing Roleplay. One piece per screen,
  the rake sweeps as it arrives, the provenance line reads `2020–2022`. Nothing
  glows at rest.
- **Reduced motion** (§2.5) — static wordmark, no draw, no click, cut to site.

**Not built yet, on purpose** (per §0 — prove the one move first): pedestals
2–4, the terms (§7), the standard line (§8), the game-page routes (§6). The
signature move is proven; the rest is repetition of it.

## Run it

Static site, no build step, no dependencies. Two ways, easiest first:

**1. Just open it.** Double-click `site/index.html` (or drag it into a browser).
The wordmark is inlined, so it runs straight from `file://` — no server.

**2. Serve it** (closer to production; use this once real audio/video go in):

```sh
cd site
node serve.js            # zero-dependency, prints a localhost URL
# — or, if you prefer Python —
python3 -m http.server 8123
```

Then open the URL it prints (e.g. http://localhost:8123).

**Note on the intro:** it plays once per browser session (`sessionStorage`), so
after the first time you'll skip straight to the site. To watch it again, open a
private window, hard-reload with the tab closed and reopened, or run this in the
console and reload: `sessionStorage.removeItem('cent_seen')`.

Timing lives in `js/intro.js` (`BEATS`) and `js/ease.js`. Tune by feel — the
brief says most tuning is "that was better three tries ago," so it's all git.

## Swapping the two pending assets

Both are placeholders wired against the real path. No code changes to swap.

### 1. The wordmark — `assets/wordmark/centinily.svg`

The current wordmark is a **structural stand-in**, not the asset. It satisfies
the contract the animation depends on (brief §3): 9 open skeleton paths in draw
order `C e n t i n i l y`, stroke not fill, no `Z`, the y extended off-frame.

It lives in **two places** — an inline copy in `index.html` (so the site runs
from `file://`) and the canonical file `assets/wordmark/centinily.svg`. The
inline copy wins when present; delete it and the file is fetched instead (http
only). To swap in the real asset, replace the nine `<path>` elements in
`index.html` (and, for tidiness, the file too). Keep the `id="p1"…"p9"`, keep
draw order, keep the y exit running off the right edge (x > 1600). Run the
brief's 20-second acceptance check first.

### 2. The click — `assets/audio/click.wav`

`js/audio.js` synthesizes a placeholder thunk. Drop a real recording at
`assets/audio/click.wav` and it is used automatically — the frame-accurate sync
fires the same `playClick()` either way. Then tune the `'cross'` label offset in
`js/intro.js` frame by frame against the y crossing.

### (Footage) — `assets/video/everest-loop.mp4` + `everest-poster.jpg`

The vitrine shows a placeholder until a silent, chromeless loop is dropped in.
Lazy-loaded, and only the in-view pedestal ever plays (§6 performance rule).

## Layout

```
index.html            gate + intro + pedestal 1
css/style.css         palette, type, grain, vignette, motion (§4/§9)
js/vendor/            GSAP core + CustomEase + MotionPathPlugin (vendored)
js/ease.js            the two eases, everywhere (§4)
js/grain.js           baked film-grain tile (§9)
js/audio.js           the click — synth placeholder + real-file swap (§2.3)
js/intro.js           draw → glint → click → split (§2)
js/pedestal.js        arrival, the rake, video discipline (§5/§6)
js/main.js            which entrance the visitor gets
assets/wordmark/      the placeholder wordmark (swap this)
assets/audio/         the click (drop click.wav here)
assets/video/         pedestal footage (drop loop + poster here)
```

Stack is locked to vanilla JS + GSAP (brief §10). No framework — there are maybe
four pieces of state on the whole site.
