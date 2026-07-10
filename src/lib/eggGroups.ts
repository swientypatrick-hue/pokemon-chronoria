// German egg group names, sourced from pokewiki.de/Ei-Gruppen.
const EGG_GROUP_LABELS: Record<string, string> = {
  Amorphous: "Amorph",
  Bug: "Käfer",
  Ditto: "Ditto",
  Dragon: "Drache",
  Fairy: "Fee",
  Field: "Feld",
  Flying: "Flug",
  Grass: "Pflanzen",
  Humanlike: "Humanotyp",
  Mineral: "Mineral",
  Monster: "Monster",
  Undiscovered: "Unbekannt",
  Water1: "Wasser 1",
  Water2: "Wasser 2",
  Water3: "Wasser 3",
};

export function eggGroupLabel(group: string): string {
  return EGG_GROUP_LABELS[group] ?? group;
}
