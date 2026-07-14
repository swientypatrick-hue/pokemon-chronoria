// Shared PBS/map_metadata.txt lookup: maps a raw RPG Maker map id (e.g. "022") to its
// human-readable, already-German location name. Used by anything that needs to turn a map id
// into a display name (wild encounters, and trainer/item map locations).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord } from "./parsePbs.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

export function loadMapLocationNames(): Map<string, string> {
  const names = new Map<string, string>();
  const raw = readFileSync(join(SOURCE_DIR, "map_metadata.txt"), "utf-8");
  for (const block of parsePbsBlocks(raw)) {
    const r = blockToRecord(block);
    if (r.Name) names.set(block.headerParts[0], r.Name);
  }
  return names;
}
