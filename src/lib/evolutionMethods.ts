// Small best-effort dictionary for the most common Essentials evolution method codes.
// Uncommon/custom methods just fall back to showing the raw code - acceptable for a
// friend-group wiki, not worth a full translation layer.
const METHOD_LABELS: Record<string, string> = {
  Level: "Level",
  LevelMale: "Level (männlich)",
  LevelFemale: "Level (weiblich)",
  LevelDay: "Level (tagsüber)",
  LevelNight: "Level (nachts)",
  LevelDusk: "Level (Dämmerung)",
  LevelHold: "Level (mit Item im Gepäck)",
  Item: "mit Item",
  ItemMale: "mit Item (männlich)",
  ItemFemale: "mit Item (weiblich)",
  ItemDay: "mit Item (tagsüber)",
  ItemNight: "mit Item (nachts)",
  ItemHold: "mit Item im Gepäck",
  Trade: "durch Tausch",
  TradeItem: "durch Tausch (mit Item)",
  TradeSpecies: "durch Tausch (gegen bestimmte Spezies)",
  Happiness: "durch Freundschaft",
  HappinessDay: "durch Freundschaft (tagsüber)",
  HappinessNight: "durch Freundschaft (nachts)",
  HappinessMove: "durch Freundschaft (kennt Attacke)",
  Beauty: "durch Schönheit",
  Stat: "durch Statuswert-Vergleich",
  AttackGreater: "wenn Angriff > Verteidigung",
  DefenseGreater: "wenn Verteidigung > Angriff",
  AtkDefEqual: "wenn Angriff = Verteidigung",
  HasMove: "kennt bestimmte Attacke",
  HasInParty: "bestimmtes Team-Mitglied",
  Location: "an bestimmtem Ort",
  MaxHappiness: "bei maximaler Freundschaft",
  Male: "männlich",
  Female: "weiblich",
  Silcoon: "Zufall (Silodra-Zweig)",
  Cascoon: "Zufall (Cascoon-Zweig)",
  NoneOfTheAbove: "sonstige Bedingung",
};

export function evolutionMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method;
}

/** Renders a short human description of an evolution's method + param, e.g. "Level 16" or
 *  "mit Item (Wasserstein)". itemName is used to resolve Item-based methods to a display name. */
export function formatEvolutionCondition(
  method: string,
  param: string,
  itemName: (id: string) => string | undefined
): string {
  const label = evolutionMethodLabel(method);
  if (!param) return label;
  if (method.startsWith("Level")) return `${label} ${param}`;
  if (method.startsWith("Item") || method === "TradeItem") return `${label}: ${itemName(param) ?? param}`;
  if (method.startsWith("Happiness") || method === "Beauty" || method === "MaxHappiness") return label;
  return `${label} (${param})`;
}
