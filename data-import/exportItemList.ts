// Writes a standalone Excel reference file (project root, NOT under src/ or public/, so it
// never ships on the published wiki) listing every item, split into "already obtainable
// in-game" (has at least one map location from parseMapLocations.ts) and "not yet placed".
// Both sections lay pockets out side by side (one column-block per pocket) instead of one long
// vertical list, so the whole overview fits in far fewer rows. Regenerated every time
// buildData.ts runs, so it stays in sync whenever the map-event dump is re-synced.
import ExcelJS from "exceljs";
import { join } from "node:path";
import { pocketName } from "../src/lib/itemPockets.ts";
import { writeGroupedSection, TITLE_FONT, NOTE_FONT, type ColumnDef } from "./xlsxGroupedSection.ts";
import { naturalCompare } from "./naturalSort.ts";
import { addPricesSheet } from "./exportItemPrices.ts";
import type { Item, Pokemon } from "./dataModel.ts";

const OUT_PATH = join(import.meta.dirname, "..", "Item-Uebersicht.xlsx");
const POCKET_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Row {
  name: string;
  count: number;
  locationNames: string;
  recipeLabel: string;
}

const AVAILABLE_COLUMNS: ColumnDef<Row>[] = [
  { header: "Item", width: 22, get: (r) => r.name },
  { header: "Anzahl", width: 9, get: (r) => r.count },
  { header: "Fundorte", width: 45, get: (r) => r.locationNames, wrap: true },
  { header: "Rezept", width: 9, get: (r) => r.recipeLabel },
];
const UNAVAILABLE_COLUMNS: ColumnDef<Row>[] = [
  { header: "Item", width: 22, get: (r) => r.name },
  { header: "Rezept", width: 9, get: (r) => r.recipeLabel },
];

function byName(a: Row, b: Row) {
  return naturalCompare(a.name, b.name);
}

// Groups an item's locations by map name and formats them as e.g. "Route 3 (2), Ariduna (Shop)".
// "shop" locations (Poké Mart stock, see parseMapLocations.ts) aren't a physical pickup count,
// so they're shown as a standalone "(Shop)" flag instead of contributing to the numeric count -
// an item sold at two different mart counters on the same map is still just "available there",
// not "found twice". A map with neither a count above 1 nor a shop flag renders as a bare name,
// so the common single-location case stays exactly as readable as before this change.
function formatLocationsByMap(locations: { locationName: string; source: string }[]): string {
  const byMap = new Map<string, { count: number; shop: boolean }>();
  for (const l of locations) {
    const entry = byMap.get(l.locationName) ?? { count: 0, shop: false };
    if (l.source === "shop") entry.shop = true;
    else entry.count += 1;
    byMap.set(l.locationName, entry);
  }
  return [...byMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([name, { count, shop }]) => {
      const parts = [count > 1 ? String(count) : null, shop ? "Shop" : null].filter((p): p is string => p !== null);
      return parts.length ? `${name} (${parts.join(", ")})` : name;
    })
    .join(", ");
}

// Berries and a handful of other ingredients call this out directly in their (already-German)
// Description text - no separate PBS "recipe" list exists, so this substring is the only signal.
function isRecipeIngredient(description: string): boolean {
  return description.includes("Rezept");
}

export async function exportItemListXlsx(items: Item[], pokemon: Pokemon[]) {
  const availableByPocket = new Map<string | number, Row[]>();
  const unavailableByPocket = new Map<string | number, Row[]>();
  for (const pocket of POCKET_IDS) {
    const forPocket = items.filter((i) => i.pocket === pocket);
    availableByPocket.set(
      pocket,
      forPocket
        .filter((i) => i.locations.length > 0)
        .map((i) => ({
          name: i.name,
          count: i.locations.length,
          locationNames: formatLocationsByMap(i.locations),
          recipeLabel: isRecipeIngredient(i.description) ? "Ja" : "Nein",
        }))
        .sort(byName)
    );
    unavailableByPocket.set(
      pocket,
      forPocket
        .filter((i) => i.locations.length === 0)
        .map((i) => ({ name: i.name, count: 0, locationNames: "", recipeLabel: isRecipeIngredient(i.description) ? "Ja" : "Nein" }))
        .sort(byName)
    );
  }
  const availableTotal = [...availableByPocket.values()].reduce((s, l) => s + l.length, 0);
  const unavailableTotal = [...unavailableByPocket.values()].reduce((s, l) => s + l.length, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Chronoria Wiki (data-import/exportItemList.ts)";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Items");
  const maxCols = POCKET_IDS.length * AVAILABLE_COLUMNS.length; // widest section
  sheet.columns = Array.from({ length: maxCols }, (_, i) => ({
    width: AVAILABLE_COLUMNS[i % AVAILABLE_COLUMNS.length].width,
  }));

  let row = 1;
  sheet.getCell(row, 1).value = "Chronoria - Item-Übersicht";
  sheet.getCell(row, 1).font = TITLE_FONT;
  row += 1;
  sheet.getCell(row, 1).value =
    "Generiert aus den Map-Event-Fundorten der Wiki-Daten (data-import/parseMapLocations.ts), automatisch bei jedem build-data-Lauf. " +
    'Taschen stehen nebeneinander. "Anzahl" zählt eindeutige Orte/Quellen (Boden, verstecktes Item, NPC-Geschenk, Beerenbaum, Sonderitem, ' +
    'Shop-Bestand). "Fundorte" listet diese Orte namentlich, je Karte mit der Anzahl an nicht-Shop-Fundorten in Klammern, falls mehr als ' +
    'einer (z.B. "Route 3 (2)"), und einem zusätzlichen "(Shop)"-Vermerk, falls dort auch käuflich (z.B. "Route 1 (Shop)" oder kombiniert ' +
    '"Route 1 (2, Shop)"). "Rezept" = Ja, wenn die Item-Beschreibung "Rezept"/"Rezepte" erwähnt (Zutat für ein Kochrezept).';
  sheet.getCell(row, 1).font = NOTE_FONT;
  sheet.mergeCells(row, 1, row, maxCols);
  sheet.getRow(row).height = 45;
  sheet.getCell(row, 1).alignment = { wrapText: true, vertical: "top" };
  row += 2;

  row = writeGroupedSection(
    sheet,
    row,
    "Bereits im Spiel erhältliche Items",
    "Anzahl Items:",
    POCKET_IDS,
    (key) => pocketName(key as number),
    availableByPocket,
    AVAILABLE_COLUMNS
  );
  row += 2;
  writeGroupedSection(
    sheet,
    row,
    "Noch nicht im Spiel platzierte Items",
    "Anzahl Items:",
    POCKET_IDS,
    (key) => pocketName(key as number),
    unavailableByPocket,
    UNAVAILABLE_COLUMNS
  );

  const pricesResult = addPricesSheet(wb, items, pokemon);

  await wb.xlsx.writeFile(OUT_PATH);
  return { available: availableTotal, unavailable: unavailableTotal, prices: pricesResult.total, path: OUT_PATH };
}
