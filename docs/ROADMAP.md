# Roadmap

Building a custom RGB controller for one known PC, on top of the OpenRGB engine.
The goal isn't to support thousands of setups — it's to be *perfect* for this one.

## The dream (target experience)

- **Presets** — design a look, name it, switch the whole rig to it instantly.
- **Spatial layout editor** — place each fan group, cooler, RAM, strimers, GPU
  where they physically sit, with rough sizes (SignalRGB-style).
- **Position-aware effects** — waves/ripples computed from real x/y/size, so a
  wave actually travels across the case in space.
- **Never the default** — the rig never shows the factory rainbow. A chosen calm
  effect lives in each device's onboard memory for the boot gap.
- **Startup show** — power on → onboard breathe ("loading") → app loads → power-up
  → GameCube-style intro (fan-by-fan wake, strimers pulsing, white blast) → fade
  into the last-used preset.

## Hard constraints (physics, not laziness)

- Custom animations need software running → the cinematic intro can only play once
  Windows + the app are up. Before that, only each device's **onboard** effect
  plays. So "never default" = save a tasteful onboard effect; "intro" = plays on
  app launch. See the boot timeline in the chat / README.
- Per-fan spatial effects require the ASUS hub to **chain** (not mirror) the LEDs.
  Unknown until probed. If mirrored, we fall back to **per-group** effects.

## Phases

### Phase 1 — Discover & guarantee (this commit) ✅
- [x] Project scaffold (TypeScript + OpenRGB SDK)
- [x] `discover` — enumerate devices, zones, LED counts, modes (+ JSON snapshot)
- [x] `probe` — zones / leds / walk / mirror → resolve chain-vs-mirror topology
- [x] `fallback` — write onboard breathe/static to every device ("never default")
- [ ] **Run all three on the real PC; fill in `src/config/rig.ts` + HARDWARE.md**

### Phase 2 — Model & engine
- [ ] Device map: LED index → { group, fan, position (x,y), size }
- [ ] Preset format (JSON): per-group/per-LED colors + effect params
- [ ] Effect engine: render loop pushing frames via `updateLeds` (target 30–60fps)
- [ ] First spatial effects: static, breathe (synced), spatial wave, ripple

### Phase 3 — The show
- [ ] Startup sequencer: power-up (gather drifting breathes) → intro timeline → preset
- [ ] Intro choreography DSL (keyframes per group/fan over time)
- [ ] Run as a boot service; fast connect + play on launch

### Phase 4 — Desktop app (Electron)
- [ ] Tray app, auto-start on login/boot
- [ ] Spatial layout editor (drag/place components, set sizes)
- [ ] Preset manager UI + live preview
- [ ] Intro editor (timeline)

## Decisions
- **Engine:** OpenRGB (SDK server on localhost:6742) — it already speaks to most
  of this hardware; we build the app on top.
- **Language/stack:** TypeScript on Node, later wrapped in Electron.
- **Name:** `lumen-rgb` is a placeholder — rename anytime.
