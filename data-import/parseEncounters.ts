import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks } from "./parsePbs.ts";
import { loadMapLocationNames } from "./mapMetadata.ts";
import type { EncounterLocation, EncounterSlot, EncounterTable } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

const isNumeric = (s: string) => /^\d+$/.test(s.trim());

export function parseEncounters(): EncounterLocation[] {
  const locationNames = loadMapLocationNames();
  const locations: EncounterLocation[] = [];

  for (const block of parsePbsBlocks(load("encounters.txt"))) {
    const mapId = block.headerParts[0];
    const tables: EncounterTable[] = [];
    let current: EncounterTable | null = null;

    for (const line of block.lines) {
      const parts = line.raw.split(",").map((p) => p.trim());
      if (parts.length < 2) continue;

      if (!isNumeric(parts[0])) {
        // "EncounterType,TotalSlots" - e.g. LandMorning,15 / OldRod,21
        current = { method: parts[0], slots: [] };
        tables.push(current);
        continue;
      }

      if (!current) continue; // stray slot line before any method header (shouldn't happen)
      // "chance,SPECIES,minLevel[,maxLevel]"
      const [chance, species, minLevel, maxLevel] = parts;
      const slot: EncounterSlot = {
        chance: Number(chance),
        species,
        minLevel: Number(minLevel),
        maxLevel: maxLevel !== undefined ? Number(maxLevel) : Number(minLevel),
      };
      current.slots.push(slot);
    }

    locations.push({
      mapId,
      locationName: locationNames.get(mapId) ?? block.headerComment ?? mapId,
      tables,
    });
  }

  return locations;
}
