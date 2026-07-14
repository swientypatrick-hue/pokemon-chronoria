// Writes a standalone Excel reference file (project root, NOT under src/ or public/, so it
// never ships on the published wiki) listing every Pokémon species+form, split into "already
// used somewhere" (wild encounter, OR event/gift/trade/egg from the map-event dump) and
// "not used anywhere yet". Generations are laid out side by side (one column-block per
// generation) instead of one long vertical list. Regenerated every time buildData.ts runs,
// alongside Item-Uebersicht.xlsx.
import ExcelJS from "exceljs";
import { join } from "node:path";
import { parsePokemonMapLocations } from "./parsePokemonMapLocations.ts";
import { writeGroupedSection, TITLE_FONT, NOTE_FONT, type ColumnDef } from "./xlsxGroupedSection.ts";
import type { Pokemon } from "./dataModel.ts";

const OUT_PATH = join(import.meta.dirname, "..", "Pokemon-Uebersicht.xlsx");
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Row {
  dexNumber: number;
  name: string;
  id: string;
  count: number;
  locationNames: string;
}

const AVAILABLE_COLUMNS: ColumnDef<Row>[] = [
  { header: "Dex-Nr.", width: 8, get: (r) => r.dexNumber },
  { header: "Pokémon", width: 22, get: (r) => r.name },
  { header: "ID", width: 16, get: (r) => r.id },
  { header: "Anzahl", width: 9, get: (r) => r.count },
  { header: "Fundorte", width: 45, get: (r) => r.locationNames, wrap: true },
];
const UNAVAILABLE_COLUMNS: ColumnDef<Row>[] = [
  { header: "Dex-Nr.", width: 8, get: (r) => r.dexNumber },
  { header: "Pokémon", width: 22, get: (r) => r.name },
  { header: "ID", width: 16, get: (r) => r.id },
];

function formLabel(speciesName: string, form: { formNumber: number; formName: { text: string } | null }): string {
  if (form.formNumber === 0) return speciesName;
  const name = form.formName?.text || `Form ${form.formNumber}`;
  return `${speciesName} (${name})`;
}

function byDexNumber(a: Row, b: Row) {
  return a.dexNumber - b.dexNumber;
}

export async function exportPokemonListXlsx(pokemon: Pokemon[]) {
  const pokemonById = new Map(pokemon.map((p) => [p.id, p]));
  const eventLocations = parsePokemonMapLocations(pokemonById);

  const availableByGen = new Map<string | number, Row[]>();
  const unavailableByGen = new Map<string | number, Row[]>();
  for (const gen of GENERATIONS) {
    availableByGen.set(gen, []);
    unavailableByGen.set(gen, []);
  }

  // Same convention as src/lib/data.ts's pokemonDexNumber: position in the parsed pokemon.txt
  // order (1-based), which is exactly Pokédex order.
  pokemon.forEach((p, i) => {
    const dexNumber = i + 1;
    // Female-only "forms" are a gender-appearance toggle, not a separate obtainable form the
    // wiki lists on its own - same exclusion the species page itself already applies.
    const forms = [{ formNumber: 0, formName: null, foundIn: p.foundIn }, ...p.forms.filter((f) => !f.isFemaleForm)];
    for (const f of forms) {
      const wildNames = f.foundIn.map((r) => r.locationName);
      const eventNames = (eventLocations.get(p.id)?.get(f.formNumber) ?? []).map((r) => r.locationName);
      const locationNames = [...new Set([...wildNames, ...eventNames])].sort((a, b) => a.localeCompare(b, "de"));
      const row: Row = {
        dexNumber,
        name: formLabel(p.name, f),
        id: f.formNumber === 0 ? p.id : `${p.id}_${f.formNumber}`,
        count: locationNames.length,
        locationNames: locationNames.join(", "),
      };
      const target = row.count > 0 ? availableByGen : unavailableByGen;
      target.get(p.generation ?? 1)!.push(row);
    }
  });
  for (const gen of GENERATIONS) {
    availableByGen.get(gen)!.sort(byDexNumber);
    unavailableByGen.get(gen)!.sort(byDexNumber);
  }
  const availableTotal = [...availableByGen.values()].reduce((s, l) => s + l.length, 0);
  const unavailableTotal = [...unavailableByGen.values()].reduce((s, l) => s + l.length, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Chronoria Wiki (data-import/exportPokemonList.ts)";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Pokemon");
  const maxCols = GENERATIONS.length * AVAILABLE_COLUMNS.length;
  sheet.columns = Array.from({ length: maxCols }, (_, i) => ({
    width: AVAILABLE_COLUMNS[i % AVAILABLE_COLUMNS.length].width,
  }));

  let row = 1;
  sheet.getCell(row, 1).value = "Chronoria - Pokémon-Übersicht";
  sheet.getCell(row, 1).font = TITLE_FONT;
  row += 1;
  sheet.getCell(row, 1).value =
    "Generiert aus Wildfang-Encounterdaten (parseEncounters.ts) und dem Map-Event-Dump (parsePokemonMapLocations.ts: " +
    "pbAddPokemon/pbAddPokemonSilent, pbGenerateEgg, Pokemon.new, pbStartTrade), automatisch bei jedem build-data-Lauf. " +
    "Generationen stehen nebeneinander, sortiert nach Dex-Nummer. \"ID\" ist die interne PBS-ID (inkl. \"_N\"-Formen-Suffix). " +
    "Fundorte fassen Wildfang- und Event-/Geschenk-/Tausch-/Ei-Vorkommen zusammen, ohne die Quelle zu unterscheiden. " +
    "Bekannte Essentials-Demo-/Test-Maps werden ausgeschlossen (siehe parseMapLocations.ts EXCLUDED_MAP_IDS).";
  sheet.getCell(row, 1).font = NOTE_FONT;
  sheet.mergeCells(row, 1, row, maxCols);
  sheet.getRow(row).height = 45;
  sheet.getCell(row, 1).alignment = { wrapText: true, vertical: "top" };
  row += 2;

  row = writeGroupedSection(
    sheet,
    row,
    "Bereits verwendete Pokémon (Wildfang, Event, Geschenk, Tausch, Ei)",
    "Anzahl:",
    GENERATIONS,
    (gen) => `Generation ${gen}`,
    availableByGen,
    AVAILABLE_COLUMNS
  );
  row += 2;
  writeGroupedSection(
    sheet,
    row,
    "Noch nicht verwendete Pokémon/Formen",
    "Anzahl:",
    GENERATIONS,
    (gen) => `Generation ${gen}`,
    unavailableByGen,
    UNAVAILABLE_COLUMNS
  );

  await wb.xlsx.writeFile(OUT_PATH);
  return { used: availableTotal, unused: unavailableTotal, path: OUT_PATH };
}
