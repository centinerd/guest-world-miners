# CENTINILY

A vitrine, not a portfolio. See `CENTINILY BRIEF` for every decision and the
Rejection List. This repo is the build; the brief is the law.

## What's built — the whole site

**Five routes** (§6: don't build a framework for this):

```
/                              the room — intro, statement, four pedestals,
                               the papers, the door
/showcase/everest/             Mount Everest Climbing Roleplay
/showcase/winter-everest/      Winter Adventure's Everest
/showcase/speed-galaxy/        Speed Galaxy Escape
/showcase/color-simulator/     Color Simulator — the movement; the annotation
```

### The home page, top to bottom

- **The gate** (§2.1) — black, one slow-blinking hairline, *click anywhere*.
- **The draw** (§2.2) — the hand-authored signature strokes on; non-linear
  timing lives inside each path's ease. The i-dots fire as the draw passes
  their x. The glint rides the pen tip.
- **The click** (§2.3, asset locked) — the full untrimmed slide, fired at
  `t_crossing − 872ms`; the thk seats on the crossing frame, the tail decays
  as the split opens.
- **The split** (§2.4) — a vault door along the y's line.
- **The statement** — *"Roblox systems, built for the people who own them."*
- **Four pedestals**, locked order (§6): Everest `2020–2022` → Winter
  Adventure `10,000,000 visits` → Speed Galaxy → Color Simulator. One per
  screen, brass hairline frame, the rake catches the frame on arrival.
  Numbers are hallmarks — small, stated once. The arc is never labeled.
- **The slab** (§7) — *"Work first. Then the invoice. Always has been."*
  Alone on a screen.
- **The papers** (§7) — TERMS, six numbered clauses, verbatim from the brief.
  A document, not a pitch.
- **The door** — *"Bring the game. Or the idea."* + Discord.

Per the brief (§7 "Clause 6 *is* §8"), the standard line is **omitted** —
try the site without it before adding it back.

### The game pages (§6 — a tray, not a case study)

Each page: the piece in its vitrine (rake on arrival) → provenance →
two lines on the system → the Lua, set like a catalogue plate → one
inscription from that game's owner (§7.5) → *the room*. Color Simulator
carries the site's **one annotation**. Everest carries **no quote** — that
space stays empty on purpose.

Deep links never see the intro — structurally: game pages contain no gate
and no wordmark draw.

### The thumbnail becomes the video (the tray transition)

On the home, each pedestal shows a **static thumbnail**
(`assets/posters/<slug>.png`). Its vitrine and the game page's vitrine share a
`view-transition-name`, so on navigation the browser **morphs the one framed
rectangle into the other** — the thumbnail lifts and becomes the page's video,
and back again. That's the tray ritual, made native (§6: "View Transitions API,
or push-state + GSAP").

Where cross-document View Transitions aren't supported, `js/site.js` falls back
to the **veil**: the room dims to black and the piece lifts, then the page fades
up from black (gated to fallback browsers with `@supports`, so it never fights
the morph). Both paths respect reduced motion.

The page video plays over the poster once footage exists; until then the poster
(== frame 0) stands in on both sides, so the morph is seamless now and stays
seamless when real loops drop in.

## PLACEHOLDERS — swap these

All marked with `PLACEHOLDER` comments in the HTML:

| What | Where |
|---|---|
| Discord handle | `index.html` `.contact__link` href |
| Dates: Speed Galaxy, Color Simulator | `index.html` + those pages |
| **All three owner quotes** (§7.5: ask what they were worried about — never ask for a testimonial) | each game page `.tray__quote` |
| **All four Lua snippets** (invented in the right voice; swap for real modules — §6 safety: live games show architecture, never attack surface) | each game page `.tray__code` |
| Thumbnails — placeholder "awaiting footage" plates; swap for real gameplay stills (frame 0 of each loop, pixel-exact per §6) | `assets/posters/*.png` |
| Video loops (capture spec §6: Studio, no HUD, frame 0 = frame N, `-an`, H.264+WebM) | `assets/video/*-loop.mp4` |
| `ALWAYS_INTRO` dev flag — **set `false` for launch** | `js/main.js` |

## Run it

No build step, no dependencies.

```sh
cd site
node serve.js        # http://localhost:8123 — serves the /showcase/ routes
```

(Double-clicking `index.html` still works for the home page; the subpages
want the server for clean URLs.)

The intro currently plays on **every** load (`ALWAYS_INTRO = true`, a dev
convenience). Production behavior — play once per session, skip for deep
links, static under reduced motion — is all behind that one flag.

## Layout

```
index.html                 the room
showcase/*/index.html      four trays
css/style.css              the entire design system, one file
js/ease.js                 the two eases (§4) — vault + arrive, nothing else
js/grain.js                baked film-grain tile (§9)
js/audio.js                the click — full file, thk-synced (§2.3)
js/intro.js                draw → glint → click → split (§2)
js/pedestal.js             arrivals, the rake, video discipline (§5/§6)
js/site.js                 the mark, the tray ritual, the veil
js/main.js                 which entrance the visitor gets (home only)
serve.js                   zero-dependency static server w/ directory routes
assets/wordmark/           the signature (4 open stroked paths — see §3)
assets/audio/click.wav     the slide that seats (mono, untrimmed)
assets/video/              drop loops here
```

Stack locked (§10): vanilla JS + GSAP. No framework, no Tailwind, no
component library. The design system is custom properties + one stylesheet,
which is why every screen is in the same voice.
