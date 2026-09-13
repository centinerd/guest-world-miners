/**
 * `npm run discover`
 *
 * Connects to OpenRGB and prints every device it can see: name, type, total
 * LED count, its zones (with LED counts), and available onboard modes. Also
 * writes a JSON snapshot to ./snapshots so we can map your rig precisely.
 *
 * This is the first thing to run on the real PC. It answers: "what does
 * OpenRGB actually expose for my hardware, and how many LEDs per zone?"
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { connect, listDevices } from "../hardware/openrgb.js";

async function main(): Promise<void> {
  const client = await connect();
  try {
    const devices = await listDevices(client);

    console.log(`\nFound ${devices.length} device(s):\n`);
    for (const d of devices) {
      console.log(`[#${d.id}] ${d.name}`);
      console.log(`      type: ${d.typeName}   total LEDs: ${d.ledCount}   active mode: ${d.modes[d.activeMode] ?? d.activeMode}`);
      console.log(`      modes: ${d.modes.join(", ") || "(none)"}`);
      if (d.zones.length > 0) {
        console.log(`      zones:`);
        for (const z of d.zones) {
          const resize = z.resizable ? ` (resizable ${z.ledsMin}-${z.ledsMax})` : "";
          console.log(`        - zone #${z.id} "${z.name}": ${z.ledsCount} LEDs${resize}`);
        }
      }
      console.log("");
    }

    mkdirSync("snapshots", { recursive: true });
    const file = `snapshots/devices-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    writeFileSync(file, JSON.stringify(devices, null, 2));
    console.log(`Snapshot written to ${file}`);
    console.log(`\nNext: run "npm run probe zones" to see which physical part each zone is.`);
  } finally {
    client.disconnect();
  }
}

main().catch((err) => {
  console.error("\n" + (err as Error).message + "\n");
  process.exit(1);
});
