const RARITY_LABELS: Record<string, string> = {
  LEGENDARY: "Legendär",
};

export function rarityLabel(rarity: string | null): string | null {
  if (!rarity) return null;
  return RARITY_LABELS[rarity] ?? rarity;
}
