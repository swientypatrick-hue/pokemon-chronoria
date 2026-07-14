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
import type { Item } from "./dataModel.ts";

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

// Natural sort: splits into digit/non-digit runs and compares digit runs numerically, so
// "TM2" < "TM10" < "TM102" (plain localeCompare would put "TM10" before "TM102" before "TM2",
// since TM names aren't consistently zero-padded once there are 100+ of them).
function naturalCompare(a: string, b: string): number {
  const ax = a.match(/\d+|\D+/g) ?? [];
  const bx = b.match(/\d+|\D+/g) ?? [];
  const len = Math.max(ax.length, bx.length);
  for (let i = 0; i < len; i++) {
    const av = ax[i] ?? "";
    const bv = bx[i] ?? "";
    if (av === bv) continue;
    if (/^\d+$/.test(av) && /^\d+$/.test(bv)) return Number(av) - Number(bv);
    return av.localeCompare(bv, "de");
  }
  return 0;
}

function byName(a: Row, b: Row) {
  return naturalCompare(a.name, b.name);
}

// Berries and a handful of other ingredients call this out directly in their (already-German)
// Description text - no separate PBS "recipe" list exists, so this substring is the only signal.
function isRecipeIngredient(description: string): boolean {
  return description.includes("Rezept");
}

export async function exportItemListXlsx(items: Item[]) {
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
          locationNames: [...new Set(i.locations.map((l) => l.locationName))].sort((a, b) => a.localeCompare(b, "de")).join(", "),
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
    'Taschen stehen nebeneinander. "Anzahl" zählt eindeutige Orte/Quellen (Boden, verstecktes Item, NPC-Geschenk, Beerenbaum, Sonderitem), ' +
    '"Fundorte" listet diese Orte namentlich - keine Stückzahl pro Fundort und KEINE Shop-Bestände (Pokémon Märkte werden von diesem ' +
    'Datenexport nicht erfasst). Ein Item in der unteren Tabelle kann also trotzdem regulär im Laden kaufbar sein. "Rezept" = Ja, wenn die ' +
    'Item-Beschreibung "Rezept"/"Rezepte" erwähnt (Zutat für ein Kochrezept).';
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

  await wb.xlsx.writeFile(OUT_PATH);
  return { available: availableTotal, unavailable: unavailableTotal, path: OUT_PATH };
}
