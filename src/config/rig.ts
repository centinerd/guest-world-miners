/**
 * The known description of THIS PC. This is what makes the app better than a
 * generic tool: we hard-code the real rig instead of guessing.
 *
 * Fields marked `verifyOnHardware: true` are our best understanding from
 * conversation but MUST be confirmed with `npm run discover` / `npm run probe`
 * on the actual machine (LED indices, chain-vs-mirror wiring, exact counts).
 * See docs/HARDWARE.md.
 */

export interface FanGroup {
  id: string;
  label: string;
  fanCount: number;
  position: "top" | "bottom" | "back" | "side";
  note?: string;
}

/** How the addressable LEDs behave through the ASUS hub. Decided by the probe. */
export type HubTopology = "unknown" | "chained" | "mirrored" | "mixed";

export const RIG = {
  case: "Lian Li O11 Dynamic",
  motherboard: "ASUS ROG Strix Z590-A Gaming WiFi (Aura)",
  gpu: "MSI GeForce RTX 3070 Ti",
  cooler: "Arctic Liquid Freezer III Pro 360",
  ram: "Corsair Dominator Platinum RGB",

  /**
   * Addressable lighting topology.
   *
   * The 9 Lian Li Uni Fans AND the Arctic cooler's ARGB all feed a 5V 3-pin
   * ARGB header on the motherboard THROUGH an ASUS fan/RGB hub. So they are
   * generic addressable (WS2812-style) LEDs controlled via the ASUS Aura
   * controller in OpenRGB, NOT via a Lian Li L-Connect controller.
   */
  addressable: {
    routedThrough: "ASUS Aura (motherboard) via ASUS fan/RGB hub",
    topology: "unknown" as HubTopology, // <-- resolved by `npm run probe`
    verifyOnHardware: true,
  },

  fanGroups: [
    { id: "top", label: "Top intake", fanCount: 3, position: "top", note: "under the AIO radiator" },
    { id: "bottom", label: "Bottom intake", fanCount: 3, position: "bottom" },
    { id: "back", label: "Rear exhaust", fanCount: 2, position: "back" },
    { id: "side", label: "Side exhaust", fanCount: 1, position: "side", note: "far left" },
  ] as FanGroup[],

  /**
   * Separate lighting "islands" that use their own protocols (not the ARGB hub):
   *  - Corsair Dominator RAM  (Corsair protocol)
   *  - MSI RTX 3070 Ti GPU    (MSI protocol; OpenRGB support is model-dependent)
   *  - Lian Li Strimer Plus x2 (TBD: on the hub, or on their own Lian Li controller?)
   */
  islands: {
    ram: { name: "Corsair Dominator Platinum RGB", verifyOnHardware: true },
    gpu: { name: "MSI RTX 3070 Ti", verifyOnHardware: true },
    strimers: {
      name: "Lian Li Strimer Plus x2",
      wiring: "unknown", // TODO: confirm — motherboard/hub, or own Lian Li controller
      verifyOnHardware: true,
    },
  },
} as const;

export const TOTAL_FANS = RIG.fanGroups.reduce((n, g) => n + g.fanCount, 0); // 9
