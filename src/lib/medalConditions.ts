import type { MedalCondition } from "../../data-import/dataModel";

const CONDITION_LABELS: Record<string, string> = {
  Caught: "Fange",
};

/** Renders a short human description of a medal condition, e.g. "Fange Genesect".
 *  pokemonName resolves the species id param to a display name. */
export function formatMedalCondition(
  condition: MedalCondition,
  pokemonName: (id: string) => string | undefined
): string {
  const label = CONDITION_LABELS[condition.type] ?? condition.type;
  if (condition.type === "Caught") {
    return `${label} ${pokemonName(condition.param) ?? condition.param}`;
  }
  return `${label}: ${condition.param}`;
}

const RARITY_LABELS: Record<string, string> = {
  LEGENDARY: "Legendär",
};

export function rarityLabel(rarity: string | null): string | null {
  if (!rarity) return null;
  return RARITY_LABELS[rarity] ?? rarity;
}
