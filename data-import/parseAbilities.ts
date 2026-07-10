import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, type PbsBlock } from "./parsePbs.ts";
import type { Ability } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

function blockToAbility(block: PbsBlock): Ability {
  const r = blockToRecord(block);
  return {
    id: block.headerParts[0],
    name: r.Name ?? block.headerParts[0],
    description: r.Description ?? "",
    pokemonWithAbility: [],
  };
}

// Name/Description are already hand-translated German directly in every one of these PBS
// files (base game and every expansion pack alike) - no Text_deutsch_core lookup needed.
const ABILITY_FILES = ["abilities.txt", "abilities_Gen_9_Pack.txt", "abilities_Community_Loven.txt"];

export function parseAbilities(): Ability[] {
  const abilities = new Map<string, Ability>();
  for (const file of ABILITY_FILES) {
    for (const block of parsePbsBlocks(load(file))) {
      abilities.set(block.headerParts[0], blockToAbility(block));
    }
  }
  return [...abilities.values()];
}
