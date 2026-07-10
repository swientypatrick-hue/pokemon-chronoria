import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, splitList, type PbsBlock } from "./parsePbs.ts";
import type { Item } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

function toNumberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function blockToItem(block: PbsBlock): Item {
  const r = blockToRecord(block);
  return {
    id: block.headerParts[0],
    name: r.Name ?? block.headerParts[0],
    namePlural: r.NamePlural ?? null,
    description: r.Description ?? "",
    pocket: toNumberOrNull(r.Pocket),
    price: toNumberOrNull(r.Price),
    fieldUse: r.FieldUse ?? null,
    flags: splitList(r.Flags),
  };
}

// Name/Description are already hand-translated German directly in the base file and every
// expansion pack (except items_raid_bait.txt, a single custom item left in English) - no
// Text_deutsch_core lookup needed.
const ITEM_FILES = ["items.txt", "items_Gen_9_Pack.txt", "items_MedalBox.txt", "items_raid_bait.txt"];

export function parseItems(): Item[] {
  const items = new Map<string, Item>();
  for (const file of ITEM_FILES) {
    for (const block of parsePbsBlocks(load(file))) {
      items.set(block.headerParts[0], blockToItem(block));
    }
  }
  return [...items.values()];
}
