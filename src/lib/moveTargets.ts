// Exact German target labels from the game's own GameData::Target script registrations
// (provided directly by the project owner) - not a guess/translation, the authoritative text.
const TARGET_LABELS: Record<string, string> = {
  None: "Keiner",
  User: "Anwender",
  NearAlly: "Mitstreiter",
  UserOrNearAlly: "Anwender oder Mitstreiter",
  AllAllies: "Alle Mitstreiter",
  UserAndAllies: "Anwender und Mitstreiter",
  NearFoe: "Naher Gegner",
  RandomNearFoe: "Zufälliger Gegner",
  AllNearFoes: "Alle Gegner",
  Foe: "Gegner",
  AllFoes: "Alle Gegner",
  NearOther: "Nächstes Pokémon",
  AllNearOthers: "Alle nahen Pokémon",
  Other: "Andere",
  AllBattlers: "Alle",
  UserSide: "Anwender-Seite",
  FoeSide: "Gegner-Seite",
  BothSides: "Beide Seiten",
};

export function targetLabel(target: string): string {
  return TARGET_LABELS[target] ?? target;
}
