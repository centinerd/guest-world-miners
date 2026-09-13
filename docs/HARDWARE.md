# The Rig

Everything the app knows about this specific PC. Machine-readable version lives
in [`src/config/rig.ts`](../src/config/rig.ts).

## Components

| Part | Model | Lighting protocol (via OpenRGB) |
|------|-------|--------------------------------|
| Case | Lian Li O11 Dynamic | — |
| Motherboard | ASUS ROG Strix Z590-A Gaming WiFi | ASUS Aura (SMBus + addressable header) |
| GPU | MSI GeForce RTX 3070 Ti | MSI (⚠️ support is model-dependent — verify) |
| CPU cooler | Arctic Liquid Freezer III Pro 360 | ARGB → **motherboard via ASUS hub** |
| Fans | 9× Lian Li Uni Fan | ARGB → **motherboard via ASUS hub** |
| RAM | Corsair Dominator Platinum RGB | Corsair |
| Cables | 2× Lian Li Strimer Plus | ❓ unknown — hub or own controller? |

## Addressable lighting layout (the important part)

The **9 Uni Fans AND the Arctic cooler ARGB** do **not** use a Lian Li L-Connect
controller. They feed a **5V 3-pin ARGB header on the motherboard through an ASUS
fan/RGB hub**. So OpenRGB sees them as generic addressable LEDs under the **ASUS
Aura** controller.

### Fan groups (physical)

| Group | Fans | Location |
|-------|------|----------|
| Top intake | 3 | under the AIO radiator |
| Bottom intake | 3 | |
| Rear exhaust | 2 | |
| Side exhaust | 1 | far left |

Total: **9 fans** (~16–20 LEDs each ≈ 150–180 addressable LEDs), likely split
across 2–3 motherboard ARGB headers because of the count.

## ❓ Open questions — resolved on the real hardware

These decide how ambitious the spatial effects and startup intro can be. Run the
tools in [`../README.md`](../README.md) to answer them.

1. **Chain vs mirror.** Does the ASUS hub chain the fans (each fan individually
   addressable → full per-fan spatial control) or mirror them (all fans identical
   → group-level only)?
   → `npm run probe mirror <deviceId>` and `npm run probe leds <deviceId>`
2. **Zone → physical mapping.** Which OpenRGB zone is which header / group of fans?
   → `npm run probe zones`
3. **LED count per fan** and the index order along each chain.
   → `npm run probe leds <deviceId>`
4. **Strimer Plus wiring** — on the ASUS hub, or their own Lian Li controller?
   → `npm run discover` (look for a Lian Li / Strimer device)
5. **GPU (MSI) support** — does OpenRGB expose it at all on this board revision?
   → `npm run discover`
6. **RAM (Corsair Dominator)** — exposed and controllable?
   → `npm run discover`

Record answers here as we learn them, and update `src/config/rig.ts`
(`topology`, LED counts, strimer wiring).
