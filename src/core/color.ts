/**
 * Color helpers. The OpenRGB SDK uses { red, green, blue } with 0-255 channels;
 * we re-export that shape as `Rgb` and add the math the effect engine will need.
 */

export interface Rgb {
  red: number;
  green: number;
  blue: number;
}

export const BLACK: Rgb = { red: 0, green: 0, blue: 0 };
export const WHITE: Rgb = { red: 255, green: 255, blue: 255 };

const clamp8 = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

export function rgb(red: number, green: number, blue: number): Rgb {
  return { red: clamp8(red), green: clamp8(green), blue: clamp8(blue) };
}

/** Parse "#rrggbb" (or "rrggbb") into an Rgb. */
export function hex(input: string): Rgb {
  const h = input.replace(/^#/, "");
  return rgb(
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  );
}

/** Scale a color's brightness by a factor in [0, 1]. Used for breathe / fades. */
export function scale(c: Rgb, factor: number): Rgb {
  return rgb(c.red * factor, c.green * factor, c.blue * factor);
}

/** Linear interpolate between two colors. t in [0, 1]. */
export function lerp(a: Rgb, b: Rgb, t: number): Rgb {
  return rgb(
    a.red + (b.red - a.red) * t,
    a.green + (b.green - a.green) * t,
    a.blue + (b.blue - a.blue) * t,
  );
}

/**
 * HSV -> Rgb. h in [0, 360), s and v in [0, 1].
 * Handy for rainbow/wave effects later where hue is a function of position.
 */
export function hsv(h: number, s: number, v: number): Rgb {
  const c = v * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgb((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
