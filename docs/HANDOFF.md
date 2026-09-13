# Handoff — read this first

Context for a Claude Code session picking this up **locally on the user's PC**.
This project was designed in a cloud session that couldn't reach the hardware;
the goal now is to run the Phase 1 tools against the real machine.

## What this project is

A custom RGB controller for **one specific PC** (see `docs/HARDWARE.md`), built on
the **OpenRGB** SDK. The point is to be perfect for this one rig, not generic like
SignalRGB. Full vision in `docs/ROADMAP.md`.

## Decisions already made

- **Engine:** OpenRGB (SDK server, localhost:6742). We build the app on top; we do
  NOT reverse-engineer protocols ourselves.
- **Stack:** TypeScript on Node, later wrapped in an Electron desktop app.
- **User is hands-on** ("I'll build it, guide me") — comfortable running commands.

## The user's dream (target experience)

- Presets they can design and switch the whole rig to.
- A **spatial layout editor** (place components where they physically are, with
  sizes) so effects like a **wave** can travel across the case in real space.
- **"Never the factory rainbow."** Ever. Handled by saving a calm effect to each
  device's onboard memory (the boot-gap fallback).
- A **startup show**: power on → onboard breathe ("loading") → app loads →
  power-up (gather the drifting breathes) → GameCube-style intro (fan-by-fan wake,
  Strimer cables pulsing, white blast) → fade into the last-used preset.

## Hard constraints established (don't re-litigate)

- Custom animation needs software running, so the cinematic intro can only play
  once Windows + the app are up. Pre-boot / powered-off, ONLY each device's onboard
  effect can play. Hence: onboard breathe = "never default"; intro = on app launch.
- Per-fan spatial effects require the ASUS hub to **chain** the LEDs (each fan its
  own slice), not **mirror** them (all identical). **Unknown until probed.** If
  mirrored, we fall back to per-group effects.

## Key hardware fact

The 9 Lian Li Uni Fans **and** the Arctic Liquid Freezer III cooler ARGB do NOT
use a Lian Li controller — they feed a **5V ARGB header on the ASUS motherboard
through an ASUS fan/RGB hub**. So they appear under the **ASUS Aura** controller in
OpenRGB as generic addressable LEDs. Corsair RAM, MSI GPU, and the 2× Strimer Plus
are separate islands (Strimer wiring still unconfirmed).

## Current status: Phase 1 built, NOT yet run on hardware

Tools exist and typecheck; they've only been run in the cloud (no hardware).

## Immediate next steps (do these on the PC)

1. Ensure OpenRGB is installed, running **as Administrator**, with **SDK Server →
   Start Server** enabled.
2. `npm install`
3. `npm run discover` — capture the device list, zones, LED counts, modes.
   Update `src/config/rig.ts` and the open-questions table in `docs/HARDWARE.md`
   with what you find.
4. `npm run probe zones`, then `npm run probe mirror <id>` and
   `npm run probe leds <id>` on the Aura/addressable device to resolve the
   **chain-vs-mirror** question. Record the answer in `rig.ts` (`topology`).
5. Optionally `npm run fallback` to lock in the "never default" onboard breathe.

Once topology is known, proceed to Phase 2 (device map → effect engine) per
`docs/ROADMAP.md`.
