// Bag pocket display names. There's no PocketNames list in the PBS/script files, so this is
// inferred from what's actually stored in each pocket number (e.g. pocket 3 only ever contains
// Poké Balls, pocket 6 only ever contains Mega Stones) - correct this list directly if a name
// doesn't match what's shown in-game.
const POCKET_NAMES: Record<number, string> = {
  1: "Items",
  2: "Medizin",
  3: "Pokébälle",
  4: "TMs & HMs",
  5: "Beeren",
  6: "Mega-Steine",
  7: "Kampf-Items",
  8: "Wichtige Items",
};

export function pocketName(pocket: number | null): string {
  if (pocket === null) return "–";
  return POCKET_NAMES[pocket] ?? `Tasche ${pocket}`;
}
