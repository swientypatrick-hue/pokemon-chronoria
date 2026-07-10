// Best-effort German labels for Essentials wild-encounter method codes (encounters.txt).
// Unknown/custom codes just fall back to the raw code - same pattern as evolutionMethods.ts.
const METHOD_LABELS: Record<string, string> = {
  Land: "Gras",
  LandMorning: "Gras (morgens)",
  LandDay: "Gras (tagsüber)",
  LandNight: "Gras (nachts)",
  Cave: "Höhle",
  CaveMorning: "Höhle (morgens)",
  CaveDay: "Höhle (tagsüber)",
  CaveNight: "Höhle (nachts)",
  Water: "Wasser (Oberfläche)",
  RockSmash: "Zerschlagener Fels",
  // Names match the actual in-game fishing rod items (items.txt: OLDROD/GOODROD/SUPERROD/
  // GOLDROD/MEGAROD/POWERROD/TREASUREROD/SLEEPROD/DOUBLEROD), not a generic translation.
  OldRod: "Angel",
  GoodRod: "Profi-Angel",
  SuperRod: "Meister-Angel",
  GoldRod: "Shiny-Angel",
  MegaRod: "Mega-Angel",
  PowerRod: "Fähigkeiten-Angel",
  SleepRod: "Schlummer-Angel",
  DoubleRod: "Doppel-Angel",
  TreasureRod: "Schatz-Angel",
  BugContest: "Käferwettbewerb",
  HeadbuttLow: "Kopfnuss (Baum, niedrig)",
  HeadbuttHigh: "Kopfnuss (Baum, hoch)",
  DarkGrass: "Dunkles Gras",
};

export function encounterMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method;
}
