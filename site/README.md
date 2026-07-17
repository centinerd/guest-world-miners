# CENTINILY

A vitrine, not a portfolio. See `CENTINILY BRIEF` for every decision and the
Rejection List. This repo is the build; the brief is the law.

## What's built

The **first build target** (brief §0): the gate through the first pedestal.

> Draw → glint → click → split → rake → bloom.

Everything in that sequence is here and working end to end:

- **The gate** (§2.1) — black, one slow-blinking hairline, *click anywhere*.
  `sessionStorage` skips it for returning visitors; deep links skip it too.
- **The draw** (§2.2) — the real hand-authored *Centinily* signature strokes on
  in brass hairline, non-linear. The long C-through-body stroke gets the big
  beat; the y-tail rushes off. Timing is derived from the path geometry, so it
  adapts to the asset (see The wordmark, below).
- **The glint** (§2.2) — one hot point of light rides the pen tip. The only
  light until the click.
- **The click** (§2.3) — a synthesized *caseback-torquing-home* thunk fires on
  the exact frame the y-tail reaches its tip, with a one-frame white blowout at
  that crossing point.
- **The split** (§2.4) — the black parts, a vault door, no overshoot, and the
  whole signature rides up on the top panel to reveal the first pedestal. (The
  seam sits just below the signature rather than through the y-line: this
  hand-drawn y exits mid-height with descenders below it, so splitting on the
  y-line would slice them. Faithful adaptation of the LOCKED intent; reversible.)
- **Pedestal 1** (§6) — Mount Everest Climbing Roleplay. One piece per screen,
  the rake sweeps as it arrives, the provenance line reads `2020–2022`. Nothing
  glows at rest.
- **Reduced motion** (§2.5) — static signature (gate dropped), then cut to site.

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

Timing lives in `js/intro.js` (`PLAN`) and `js/ease.js`. Tune by feel — the
brief says most tuning is "that was better three tries ago," so it's all git.

## The wordmark

The real asset is in: the hand-authored *Centinily* signature — a continuous
script rather than 9 per-letter skeletons. It's **4 open, stroked, curve-only
paths** (no fill, no `Z`), which passes the §3 *material* checks (stroke not
fill, beziers not polylines, open not closed). It does not match the §3 *shape*
spec (9 paths / ~30–40 nodes) — it's a signature with a high node count — but it
animates cleanly as a hairline and reads better than the per-letter approach
would have. The draw is geometry-driven, not hardcoded to 9 letters, so it just
works.

It lives in **two places** — an inline copy in `index.html` (so the site runs
from `file://`) and the canonical file `assets/wordmark/centinily.svg`. The
inline copy wins when present; delete it and the file is fetched (http only).

To swap a *new* wordmark in later: replace the `<path>` elements in both places.
The animation figures out the rest — it finds the tiny "accent" strokes by
length (`PLAN.accentMax` in `js/intro.js`) and picks the stroke whose tail ends
furthest right as the y-exit crossing. If your y-exit runs cleanly off the right
edge (the brief's §3 ideal), the crossing/blowout land at the frame edge; this
signature's tail ends mid-frame, so they land on the tail tip instead.

## The click

The real click is in: `assets/audio/click.wav` — a magnetic slide *closure*.
The source had ~460ms of slide before the snap, which would land the click half
a second after the y crosses, so it's trimmed to the snap transient (peak ~10ms
in), normalized for weight, and faded at the edges. `js/audio.js` fetches it and
uses it automatically; the synth thunk is now only a fallback if the file is
missing. To replace it, drop a new `click.wav` with its transient near the start
(so it lands on-frame) — no code change.

**Heads up:** the click only plays when **served** (`node serve.js`). Opening the
file by double-click (`file://`) can't `fetch()` the audio, so you'll get the
synth fallback there. Use the server to hear the real one.

## Swapping the remaining placeholder assets

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
