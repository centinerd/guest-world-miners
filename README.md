# lumen-rgb

A custom RGB controller for **one specific PC** — so it can be perfect for that
one rig instead of generic. Built on the [OpenRGB](https://openrgb.org) engine.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full vision and
[`docs/HARDWARE.md`](docs/HARDWARE.md) for the rig it targets.

> Name is a placeholder — rename anytime.

## How it works

OpenRGB is the *engine*: it already reverse-engineered the protocols for most of
this hardware and exposes them over a local SDK server. This project is the
*app* on top — discovery, presets, spatial effects, the startup show.

```
lumen-rgb (this app, TypeScript)  ──SDK──►  OpenRGB server  ──►  your hardware
```

## Phase 1 (what's here now)

Three command-line tools to map the rig and lock in the "never default" behavior.
**Run these on the actual PC** (that's where the hardware is).

### One-time setup (Windows)

1. **Install OpenRGB** — https://openrgb.org/ (get the Windows build).
2. Launch OpenRGB **as Administrator** (needed for motherboard/SMBus access).
   Let it detect your devices.
3. Enable the SDK server: **SDK Server** tab → **Start Server** (default port
   `6742`). Tip: Settings → enable "Start server on startup".
4. **Install Node.js 20+** — https://nodejs.org/
5. In this folder:
   ```
   npm install
   ```

### The tools

```bash
# 1. See everything OpenRGB exposes (devices, zones, LED counts, modes).
#    Also writes a JSON snapshot to ./snapshots/
npm run discover

# 2. Find out how your ASUS hub is wired (the big question).
npm run probe zones            # light each zone in turn — which part is which?
npm run probe mirror <id>      # light ONLY LED 0: one fan (chained) or all (mirrored)?
npm run probe leds <id> [ms]   # walk LEDs one-by-one; does light travel fan-by-fan?
npm run probe walk <id> 16     # walk in chunks (try your per-fan LED count)

# 3. The "never default" guarantee: save a boot-gap effect to onboard memory.
npm run fallback               # slow cyan breathe everywhere it can
npm run fallback 1030ff        # custom color
npm run fallback 1030ff static # force static instead of breathe
```

Replace `<id>` with a device number from `npm run discover`.

### What we're trying to learn

Whether the fans are **individually addressable** (hub chains them) or **forced
identical** (hub mirrors them). That single fact decides whether the spatial wave
and fan-by-fan startup intro work per-fan or only per-group. See the open
questions in [`docs/HARDWARE.md`](docs/HARDWARE.md) — fill them in as you go.

## The boot experience (design)

```
[Power on] → devices replay their ONBOARD effect (the breathe we saved) = "loading"
     │        No software yet — this is the only thing that can run pre-Windows.
     ▼
[Windows + app load] → power-up (gather the drifting breathes into one surge)
     │                  → GameCube-style intro → fade to your last preset
     ▼
[Steady state] → presets, spatial effects, everything
```

Custom animation can't run while the PC is off or pre-boot (no software exists to
run it) — but the saved onboard breathe means it's never the factory rainbow, and
the cinematic intro fires the instant the app takes over.

## Project layout

```
src/
  core/color.ts        color math (rgb, hsv, lerp, scale)
  hardware/openrgb.ts  typed wrapper around the OpenRGB SDK
  config/rig.ts        the known description of THIS PC
  tools/
    discover.ts        enumerate devices/zones/modes
    probe.ts           topology probe (chain vs mirror)
    fallback.ts        write onboard "never default" effect
docs/
  ROADMAP.md           the plan
  HARDWARE.md          the rig + open questions
```

## Requirements

- Node.js 20+
- OpenRGB running with its SDK server enabled (localhost:6742 by default;
  override with `OPENRGB_HOST` / `OPENRGB_PORT` env vars)
