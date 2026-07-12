import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, type PbsBlock } from "./parsePbs.ts";
import type { Medal } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");
const ICONS_DIR = join(import.meta.dirname, "..", "public", "medals");

// These four ids are explicitly marked "Noch zu bearbeiten" (still to be done) in the source
// and are all identical unfinished placeholder copies of the Ninjatom medal (wrong name/icon/
// condition combination) - clearly not real content yet, so they're excluded from the wiki.
const EXCLUDED_MEDAL_IDS = new Set(["POKEMON", "POKEMON1", "POKEMON2", "POKEMON3"]);

function loadIconIndex(): Map<string, string> {
  const index = new Map<string, string>();
  if (!existsSync(ICONS_DIR)) return index;
  for (const name of readdirSync(ICONS_DIR)) {
    index.set(name.replace(/\.png$/i, ""), name);
  }
  return index;
}

function blockToMedal(block: PbsBlock, icons: Map<string, string>): Medal {
  const r = blockToRecord(block);
  const id = block.headerParts[0];
  const icon = r.Icon ?? "BASICMEDAL";
  const conditionParts = (r.Condition ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    id,
    name: r.Name ?? "Unbenannte Medallie",
    icon: icons.get(icon) ?? null,
    rarity: r.Rarity ? r.Rarity.toUpperCase() : null,
    description: r.Description ?? "",
    tip: r.Tip ?? "",
    condition: conditionParts.length === 2 ? { type: conditionParts[0], param: conditionParts[1] } : null,
  };
}

export function parseMedals(): Medal[] {
  const icons = loadIconIndex();
  const text = readFileSync(join(SOURCE_DIR, "medals.txt"), "utf-8");
  const medals: Medal[] = [];
  for (const block of parsePbsBlocks(text)) {
    const id = block.headerParts[0];
    if (EXCLUDED_MEDAL_IDS.has(id)) continue;
    medals.push(blockToMedal(block, icons));
  }
  return medals;
}
