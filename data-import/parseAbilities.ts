import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, type PbsBlock } from "./parsePbs.ts";
import { resolveInlineName, type TranslationContext } from "./translationContext.ts";
import type { Ability } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

function blockToAbility(block: PbsBlock, ctx: TranslationContext): Ability {
  const r = blockToRecord(block);
  const id = block.headerParts[0];
  return {
    id,
    name: resolveInlineName(ctx.abilityName, id, r.Name ?? id),
    description: r.Description ?? "",
    pokemonWithAbility: [],
  };
}

// Description is already hand-translated German directly in every one of these PBS files
// (base game and every expansion pack alike). Name mostly is too, but ~5% of abilities.txt
// entries are still English inline even though ABILITY_NAMES.txt has the real translation -
// resolveInlineName() prefers that name-anchor and only falls back to the inline field.
const ABILITY_FILES = ["abilities.txt", "abilities_Gen_9_Pack.txt", "abilities_Community_Loven.txt"];

export function parseAbilities(ctx: TranslationContext): Ability[] {
  const abilities = new Map<string, Ability>();
  for (const file of ABILITY_FILES) {
    for (const block of parsePbsBlocks(load(file))) {
      abilities.set(block.headerParts[0], blockToAbility(block, ctx));
    }
  }
  return [...abilities.values()];
}
