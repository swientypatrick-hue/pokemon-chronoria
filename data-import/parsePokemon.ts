import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, splitList, type PbsBlock } from "./parsePbs.ts";
import { resolveText, type TranslationContext } from "./translationContext.ts";
import type { BaseStats, LevelMove, Evolution, Pokemon, PokemonForm } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

function parseBaseStats(value: string | undefined): BaseStats {
  // Essentials order: HP, Attack, Defense, SPEED, SpAtk, SpDef (speed is 4th, not last!)
  const [hp, attack, defense, speed, spAtk, spDef] = (value ?? "0,0,0,0,0,0").split(",").map(Number);
  return { hp, attack, defense, speed, spAtk, spDef };
}

function parseLevelMoves(value: string | undefined): LevelMove[] {
  const parts = splitList(value);
  const moves: LevelMove[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    moves.push({ level: Number(parts[i]), move: parts[i + 1] });
  }
  return moves;
}

function parseEvolutions(value: string | undefined): Evolution[] {
  const parts = splitList(value);
  const evolutions: Evolution[] = [];
  for (let i = 0; i + 2 < parts.length; i += 3) {
    evolutions.push({ target: parts[i], method: parts[i + 1] ?? "", param: parts[i + 2] ?? "" });
  }
  return evolutions;
}

function blockToPokemon(block: PbsBlock, ctx: TranslationContext): Pokemon {
  const r = blockToRecord(block);
  return {
    id: block.headerParts[0],
    name: r.Name ?? block.headerParts[0],
    types: splitList(r.Types),
    baseStats: parseBaseStats(r.BaseStats),
    abilities: splitList(r.Abilities),
    hiddenAbilities: splitList(r.HiddenAbilities),
    category: resolveText(ctx.speciesCategory, r.Category),
    pokedex: resolveText(ctx.pokedexText, r.Pokedex),
    height: Number(r.Height ?? 0),
    weight: Number(r.Weight ?? 0),
    genderRatio: r.GenderRatio ?? "",
    growthRate: r.GrowthRate ?? "",
    eggGroups: splitList(r.EggGroups),
    hatchSteps: Number(r.HatchSteps ?? 0),
    catchRate: Number(r.CatchRate ?? 0),
    levelMoves: parseLevelMoves(r.Moves),
    tutorMoves: splitList(r.TutorMoves),
    eggMoves: splitList(r.EggMoves),
    evolutions: parseEvolutions(r.Evolutions),
    evolvesFrom: null, // filled in by buildData.ts
    generation: r.Generation ? Number(r.Generation) : null,
    forms: [],
    foundIn: [],
    usedByTrainers: [],
  };
}

function blockToForm(block: PbsBlock, ctx: TranslationContext): PokemonForm {
  const r = blockToRecord(block);
  return {
    formNumber: Number(block.headerParts[1] ?? 0),
    formName: r.FormName ? resolveText(ctx.formName, r.FormName) : null,
    types: splitList(r.Types),
    baseStats: parseBaseStats(r.BaseStats),
    abilities: splitList(r.Abilities),
    hiddenAbilities: splitList(r.HiddenAbilities),
    levelMoves: parseLevelMoves(r.Moves),
    tutorMoves: splitList(r.TutorMoves),
    eggMoves: splitList(r.EggMoves),
  };
}

export function parsePokemon(ctx: TranslationContext): Pokemon[] {
  const baseBlocks = [
    ...parsePbsBlocks(load("pokemon.txt")),
    ...parsePbsBlocks(load("pokemon_base_Gen_9_Pack.txt")),
  ];
  const pokemon = new Map<string, Pokemon>();
  for (const block of baseBlocks) {
    const p = blockToPokemon(block, ctx);
    if (pokemon.has(p.id)) {
      console.warn(`[Pokémon] Doppelter Eintrag für ${p.id}, überschreibe.`);
    }
    pokemon.set(p.id, p);
  }

  const formBlocks = [
    ...parsePbsBlocks(load("pokemon_forms.txt")),
    ...parsePbsBlocks(load("pokemon_forms_Gen_9_Pack.txt")),
  ];
  for (const block of formBlocks) {
    const speciesId = block.headerParts[0];
    const base = pokemon.get(speciesId);
    if (!base) {
      console.warn(`[Pokémon] Form für unbekannte Spezies ${speciesId} übersprungen.`);
      continue;
    }
    base.forms.push(blockToForm(block, ctx));
  }

  return [...pokemon.values()];
}
