/**
 * `npm run fallback [hexColor] [breathe|static]`
 *
 * The "never default" guarantee. Writes a chosen effect into every device's
 * ONBOARD memory (saveMode), so that during the boot gap — power on, before
 * Windows + the app are running — each device replays THIS instead of the
 * factory rainbow. Nothing runs it; the hardware remembers it.
 *
 * Default: a slow BREATHE in deep cyan (off -> full -> off), which reads as
 * "system loading..." and sets up the app's power-up hand-off. Falls back to a
 * static color on devices that have no breathing mode.
 *
 * Examples:
 *   npm run fallback                 # slow cyan breathe everywhere it can
 *   npm run fallback 1030ff          # breathe in a custom color
 *   npm run fallback 1030ff static   # force a static color instead of breathe
 */
import { connect, listDevices, pickFallbackMode, saveOnboard } from "../hardware/openrgb.js";
import { hex, rgb, type Rgb } from "../core/color.js";

const DEFAULT_COLOR: Rgb = rgb(0, 120, 200); // deep cyan
const SLOW_SPEED = 0; // OpenRGB speed is a mode-relative value; 0 = slowest end. Tune per device.

async function main(): Promise<void> {
  const [colorArg, kindArg] = process.argv.slice(2);
  const color = colorArg ? hex(colorArg) : DEFAULT_COLOR;
  const forceKind = kindArg === "static" ? "static" : kindArg === "breathe" ? "breathe" : undefined;

  const client = await connect();
  try {
    const devices = await listDevices(client);
    console.log(`\nWriting onboard fallback (${forceKind ?? "breathe-preferred"}) in #${colorArg ?? "0078c8"} to ${devices.length} device(s):\n`);

    for (const d of devices) {
      const pick = pickFallbackMode(d.modes);
      if (!pick) {
        console.log(`  [#${d.id}] ${d.name}: no breathe/static onboard mode found -> skipped`);
        continue;
      }
      // Honor a forced kind if that mode exists; otherwise use the best pick.
      let modeName = pick.name;
      if (forceKind === "static") {
        modeName = d.modes.find((m) => /static|direct|solid|fixed/i.test(m)) ?? pick.name;
      } else if (forceKind === "breathe") {
        modeName = d.modes.find((m) => /breath|pulse/i.test(m)) ?? pick.name;
      }
      const isBreathe = /breath|pulse/i.test(modeName);
      try {
        await saveOnboard(client, d.id, modeName, color, isBreathe ? SLOW_SPEED : undefined);
        console.log(`  [#${d.id}] ${d.name}: saved onboard "${modeName}"${isBreathe ? " (slow breathe)" : ""}`);
      } catch (err) {
        console.log(`  [#${d.id}] ${d.name}: saveMode failed for "${modeName}" -> ${(err as Error).message}`);
      }
    }

    console.log(
      `\nDone. Fully power the PC down (not just reboot) and check: the boot-gap\n` +
        `lighting should now be your chosen ${forceKind === "static" ? "color" : "breathe"}, never the rainbow default.`,
    );
  } finally {
    client.disconnect();
  }
}

main().catch((err) => {
  console.error("\n" + (err as Error).message + "\n");
  process.exit(1);
});
