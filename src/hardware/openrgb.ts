/**
 * Thin, typed wrapper around the OpenRGB SDK.
 *
 * Everything else in the app talks to hardware through this module so that the
 * rest of the codebase never has to think about the raw SDK, connection
 * lifecycle, or the difference between "direct" (live) control and onboard modes.
 */
import { Client, utils } from "openrgb-sdk";
import type { Rgb } from "../core/color.js";

const DEFAULT_PORT = 6742;
const DEFAULT_HOST = "127.0.0.1";

/** A snapshot of one OpenRGB zone (usually a header / segment on a device). */
export interface ZoneInfo {
  id: number;
  name: string;
  ledsCount: number;
  ledsMin: number;
  ledsMax: number;
  resizable: boolean;
}

/** A snapshot of one OpenRGB device (a controller: motherboard, GPU, RAM, ...). */
export interface DeviceInfo {
  id: number;
  name: string;
  type: number;
  typeName: string;
  ledCount: number;
  activeMode: number;
  modes: string[];
  zones: ZoneInfo[];
}

const TYPE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(utils.deviceType).map(([name, value]) => [value as number, name]),
);

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Connect to a running OpenRGB SDK server. Throws a friendly error if OpenRGB
 * isn't running or the SDK server isn't enabled.
 */
export async function connect(
  name = "lumen-rgb",
  host = process.env.OPENRGB_HOST ?? DEFAULT_HOST,
  port = Number(process.env.OPENRGB_PORT ?? DEFAULT_PORT),
): Promise<Client> {
  const client = new Client(name, port, host);
  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Could not reach the OpenRGB SDK server at ${host}:${port}.\n` +
        `  1. Is OpenRGB running?\n` +
        `  2. In OpenRGB: SDK Server tab -> "Start Server" (or enable it in Settings).\n` +
        `Original error: ${(err as Error).message}`,
    );
  }
  return client;
}

/** Read every device's metadata (no colors changed). */
export async function listDevices(client: Client): Promise<DeviceInfo[]> {
  const count = await client.getControllerCount();
  const devices: DeviceInfo[] = [];
  for (let id = 0; id < count; id++) {
    const d = await client.getControllerData(id);
    devices.push({
      id,
      name: d.name,
      type: d.type,
      typeName: TYPE_NAMES[d.type] ?? "unknown",
      ledCount: d.leds.length,
      activeMode: d.activeMode,
      modes: d.modes.map((m) => m.name),
      zones: d.zones.map((z) => ({
        id: z.id,
        name: z.name,
        ledsCount: z.ledsCount,
        ledsMin: z.ledsMin,
        ledsMax: z.ledsMax,
        resizable: z.resizable,
      })),
    });
  }
  return devices;
}

/**
 * Put a device into direct/live control mode so updateLeds takes effect
 * immediately. Call this before any live rendering (probe, effects, intro).
 */
export function enterDirectMode(client: Client, deviceId: number): void {
  client.setCustomMode(deviceId);
}

/** Set every LED on a device to one color. */
export async function fill(client: Client, device: DeviceInfo, color: Rgb): Promise<void> {
  await client.updateLeds(deviceId(device), new Array(device.ledCount).fill(color));
}

/** Turn a whole device off (all LEDs black). */
export async function off(client: Client, device: DeviceInfo): Promise<void> {
  await fill(client, device, { red: 0, green: 0, blue: 0 });
}

/** Light a single LED by absolute index on a device. */
export function setLed(client: Client, deviceId: number, ledId: number, color: Rgb): void {
  client.updateSingleLed(deviceId, ledId, color);
}

/** Set an explicit array of colors (length should equal device.ledCount). */
export async function setLeds(client: Client, deviceId: number, colors: Rgb[]): Promise<void> {
  await client.updateLeds(deviceId, colors);
}

function deviceId(d: DeviceInfo | number): number {
  return typeof d === "number" ? d : d.id;
}

/**
 * Find the best onboard mode to use as a persistent fallback, preferring a
 * breathing effect, then a static one. Returns null if neither exists.
 */
export function pickFallbackMode(modes: string[]): { name: string; kind: "breathe" | "static" } | null {
  const breathe = modes.find((m) => /breath|pulse/i.test(m));
  if (breathe) return { name: breathe, kind: "breathe" };
  const staticMode = modes.find((m) => /static|direct|solid|fixed/i.test(m));
  if (staticMode) return { name: staticMode, kind: "static" };
  return null;
}

/**
 * Write an onboard mode + color to a device's hardware memory (saveMode), so it
 * persists across power cycles. This is the "never default" mechanism: whatever
 * we save here is what the device shows during the boot gap, before the app runs.
 */
export async function saveOnboard(
  client: Client,
  deviceId: number,
  modeName: string,
  color: Rgb,
  speed?: number,
): Promise<void> {
  await client.saveMode(deviceId, {
    name: modeName,
    colors: [color],
    ...(speed !== undefined ? { speed } : {}),
  });
}
