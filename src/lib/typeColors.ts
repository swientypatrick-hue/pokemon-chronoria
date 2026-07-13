// Palette matches pokewiki.de's type badges (read via getComputedStyle on
// https://www.pokewiki.de/Typen), not the classic muted Bulbapedia colors.
export const TYPE_COLORS: Record<string, string> = {
  NORMAL: "#BBBBAA",
  FIGHTING: "#BB5544",
  FLYING: "#96CAFF",
  POISON: "#9553CD",
  GROUND: "#A67439",
  ROCK: "#BBAA66",
  BUG: "#92C12A",
  GHOST: "#6E4370",
  STEEL: "#AAAABB",
  FIRE: "#FF421C",
  WATER: "#2C9BE3",
  GRASS: "#62BC5A",
  ELECTRIC: "#FFDC00",
  PSYCHIC: "#FF6380",
  ICE: "#74CFC0",
  DRAGON: "#5670BE",
  DARK: "#4E4545",
  FAIRY: "#EC8FE6",
  QMARKS: "#68A090",
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#68A090";
}

/** Shifts a hex color's RGB channels by `amount` (positive lightens, negative darkens),
 *  clamped to 0-255 - used to build the diagonal glass-badge gradient from a single base color. */
export function mixColor(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (c: number) => Math.min(255, Math.max(0, c + amount));
  const r = clamp((n >> 16) & 255);
  const g = clamp((n >> 8) & 255);
  const b = clamp(n & 255);
  return `rgb(${r},${g},${b})`;
}

/** Picks readable ink for a badge from its own perceived brightness, rather than forcing white
 *  everywhere and faking contrast with a text-stroke - that trick looked "dirty" on light hues
 *  (ELECTRIC, NORMAL, FLYING). Dark ink on pale badges, white ink on saturated/dark ones. */
export function textColorFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 160 ? "#2b2418" : "#ffffff";
}
