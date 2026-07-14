// German labels for how an item is obtained at a given map location (see ItemLocationRef).
const ITEM_LOCATION_SOURCE_LABELS: Record<string, string> = {
  ground: "Am Boden",
  hidden: "Verstecktes Item",
  gift: "Geschenk",
  berry: "Beerenbaum",
  special: "Besonderes Item",
};

export function itemLocationSourceLabel(source: string): string {
  return ITEM_LOCATION_SOURCE_LABELS[source] ?? source;
}
