/**
 * `npm run probe <mode> [args]`
 *
 * The topology probe. This is how we discover — on the real hardware — whether
 * your ASUS hub CHAINS the fans (each fan is its own slice of the LED chain,
 * individually addressable → the full spatial dream works) or MIRRORS them
 * (all fans forced identical → group-level effects only).
 *
 * Modes:
 *   zones                     Light each ZONE of each device in turn (2s each).
 *                             Watch the case: tells you which physical part each
 *                             OpenRGB zone maps to.
 *
 *   leds <deviceId> [ms]      Walk LEDs one-at-a-time on a device (default 400ms).
 *                             Prints the index as each lights. Watch whether the
 *                             light travels fan-by-fan (chained) or nothing moves.
 *
 *   walk <deviceId> <chunk> [ms]
 *                             Like `leds` but lights `chunk` LEDs at a time —
 *                             handy for ~16-LED fans (try chunk = your per-fan count).
 *
 *   mirror <deviceId>         Light ONLY LED index 0 (bright white) and hold.
 *                             If ONE fan lights → chained. If ALL fans light the
 *                             same → mirrored. Press Ctrl+C when done.
 *
 * All modes leave the touched device(s) off on exit.
 */
import { connect, enterDirectMode, listDevices, off, setLed, sleep, type DeviceInfo } from "../hardware/openrgb.js";
import type { Client } from "openrgb-sdk";
import { WHITE, hsv, rgb } from "../core/color.js";

const PROBE_COLOR = rgb(0, 180, 255); // bright cyan — easy to spot

async function withDevice(client: Client, devices: DeviceInfo[], idArg: string | undefined): Promise<DeviceInfo> {
  if (idArg === undefined) throw new Error("This mode needs a device id. Run `npm run discover` to see ids.");
  const id = Number(idArg);
  const device = devices.find((d) => d.id === id);
  if (!device) throw new Error(`No device with id ${id}. Run "npm run discover" to see ids.`);
  enterDirectMode(client, id);
  await off(client, device);
  return device;
}

async function probeZones(client: Client, devices: DeviceInfo[]): Promise<void> {
  for (const d of devices) {
    if (d.zones.length === 0 || d.ledCount === 0) continue;
    enterDirectMode(client, d.id);
    await off(client, d);
    let cursor = 0;
    for (const z of d.zones) {
      console.log(`Lighting [#${d.id}] ${d.name} -> zone #${z.id} "${z.name}" (${z.ledsCount} LEDs, indices ${cursor}-${cursor + z.ledsCount - 1})`);
      const colors = new Array(d.ledCount).fill(rgb(10, 10, 10));
      for (let i = 0; i < z.ledsCount; i++) colors[cursor + i] = PROBE_COLOR;
      await client.updateLeds(d.id, colors);
      await sleep(2000);
      cursor += z.ledsCount;
    }
    await off(client, d);
  }
  console.log("\nDone. Note which physical part lit up for each zone.");
}

async function probeLeds(client: Client, devices: DeviceInfo[], idArg?: string, msArg?: string): Promise<void> {
  const device = await withDevice(client, devices, idArg);
  const ms = Number(msArg ?? 400);
  console.log(`Walking ${device.ledCount} LEDs on [#${device.id}] ${device.name}, ${ms}ms each. Watch the case...`);
  for (let i = 0; i < device.ledCount; i++) {
    if (i > 0) setLed(client, device.id, i - 1, { red: 0, green: 0, blue: 0 });
    // color shifts along the walk so it's obvious which direction the chain runs
    setLed(client, device.id, i, hsv((i / Math.max(1, device.ledCount)) * 300, 1, 1));
    process.stdout.write(`\r  LED ${i + 1}/${device.ledCount} (index ${i})   `);
    await sleep(ms);
  }
  console.log("");
  await off(client, device);
}

async function probeWalk(client: Client, devices: DeviceInfo[], idArg?: string, chunkArg?: string, msArg?: string): Promise<void> {
  const device = await withDevice(client, devices, idArg);
  const chunk = Math.max(1, Number(chunkArg ?? 16));
  const ms = Number(msArg ?? 700);
  console.log(`Walking ${device.ledCount} LEDs in chunks of ${chunk} on [#${device.id}] ${device.name}...`);
  let group = 0;
  for (let start = 0; start < device.ledCount; start += chunk) {
    const colors = new Array(device.ledCount).fill({ red: 0, green: 0, blue: 0 });
    const end = Math.min(start + chunk, device.ledCount);
    for (let i = start; i < end; i++) colors[i] = PROBE_COLOR;
    await client.updateLeds(device.id, colors);
    console.log(`  group ${++group}: indices ${start}-${end - 1}`);
    await sleep(ms);
  }
  await off(client, device);
}

async function probeMirror(client: Client, devices: DeviceInfo[], idArg?: string): Promise<void> {
  const device = await withDevice(client, devices, idArg);
  setLed(client, device.id, 0, WHITE);
  console.log(
    `Only LED index 0 of [#${device.id}] ${device.name} is lit.\n` +
      `  - If ONE fan/segment is lit  -> the hub CHAINS (per-fan control works!).\n` +
      `  - If MANY light identically  -> the hub MIRRORS (group-level only).\n` +
      `Press Ctrl+C when you've looked.`,
  );
  await new Promise(() => {}); // hold until Ctrl+C
}

async function main(): Promise<void> {
  const [mode, a, b, c] = process.argv.slice(2);
  const client = await connect();
  let holding = false;
  try {
    const devices = await listDevices(client);
    switch (mode) {
      case "zones": await probeZones(client, devices); break;
      case "leds": await probeLeds(client, devices, a, b); break;
      case "walk": await probeWalk(client, devices, a, b, c); break;
      case "mirror": holding = true; await probeMirror(client, devices, a); break;
      default:
        console.log('Usage: npm run probe <zones | leds <id> [ms] | walk <id> <chunk> [ms] | mirror <id>>');
    }
  } finally {
    if (!holding) client.disconnect();
  }
}

main().catch((err) => {
  console.error("\n" + (err as Error).message + "\n");
  process.exit(1);
});
