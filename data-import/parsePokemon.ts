import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, splitList, type PbsBlock } from "./parsePbs.ts";
import { resolveText, resolveInlineName, type TranslationContext } from "./translationContext.ts";
import type { BaseStats, LevelMove, Evolution, Pokemon, PokemonForm } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");
const SPRITES_DIR = join(import.meta.dirname, "..", "public", "sprites");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

/** Sprite files are named exactly like the PBS internal id (case-sensitive, e.g.
 *  "NIDORANfE.png"), with "_1"/"_2" suffixes for alternate forms. Build a lookup once so we
 *  don't re-scan the directory per species, and so we pick up whichever exact
 *  casing/extension (.png vs .PNG) the file actually has on disk. */
function loadSpriteIndex(): Map<string, string> {
  const index = new Map<string, string>();
  if (!existsSync(SPRITES_DIR)) return index;
  for (const name of readdirSync(SPRITES_DIR)) {
    const withoutExt = name.replace(/\.png$/i, "");
    index.set(withoutExt, name);
  }
  return index;
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

function blockToPokemon(block: PbsBlock, ctx: TranslationContext, sprites: Map<string, string>): Pokemon {
  const r = blockToRecord(block);
  const id = block.headerParts[0];
  const resolvedName = resolveInlineName(ctx.speciesName, id, r.Name ?? id);
  return {
    id,
    name: resolvedName.text,
    nameFallback: resolvedName.fallback,
    sprite: sprites.get(id) ?? null,
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
    raidRanks: splitList(r.RaidRanks).map(Number),
    levelMoves: parseLevelMoves(r.Moves),
    tutorMoves: splitList(r.TutorMoves),
    eggMoves: splitList(r.EggMoves),
    evolutions: parseEvolutions(r.Evolutions),
    evolvesFrom: null, // filled in by buildData.ts
    generation: r.Generation ? Number(r.Generation) : null,
    forms: [],
    foundIn: [],
  };
}

/**
 * Form PBS blocks only redeclare fields that actually differ from the base species - e.g.
 * Mega Charizard Y has no `Types` line at all (its type doesn't change), and no `Moves`/
 * `TutorMoves`/`EggMoves` (Mega Evolutions can't level up or breed while mega-evolved). A
 * field that's simply absent from the block must inherit the base species' value, not default
 * to empty/zero - otherwise unchanged forms wrongly show 0/0/0/0/0/0 stats or no type badge.
 */
function blockToForm(block: PbsBlock, ctx: TranslationContext, sprites: Map<string, string>, base: Pokemon): PokemonForm {
  const r = blockToRecord(block);
  const [speciesId, formNumberRaw] = block.headerParts;
  const formNumber = Number(formNumberRaw ?? 0);
  return {
    formNumber,
    formName: r.FormName ? resolveText(ctx.formName, r.FormName) : null,
    types: r.Types !== undefined ? splitList(r.Types) : base.types,
    baseStats: r.BaseStats !== undefined ? parseBaseStats(r.BaseStats) : base.baseStats,
    abilities: r.Abilities !== undefined ? splitList(r.Abilities) : base.abilities,
    hiddenAbilities: r.HiddenAbilities !== undefined ? splitList(r.HiddenAbilities) : base.hiddenAbilities,
    levelMoves: r.Moves !== undefined ? parseLevelMoves(r.Moves) : base.levelMoves,
    tutorMoves: r.TutorMoves !== undefined ? splitList(r.TutorMoves) : base.tutorMoves,
    eggMoves: r.EggMoves !== undefined ? splitList(r.EggMoves) : base.eggMoves,
    evolutions: r.Evolutions !== undefined ? parseEvolutions(r.Evolutions) : base.evolutions,
    pokedex: r.Pokedex !== undefined ? resolveText(ctx.pokedexText, r.Pokedex) : base.pokedex,
    height: r.Height !== undefined ? Number(r.Height) : base.height,
    weight: r.Weight !== undefined ? Number(r.Weight) : base.weight,
    eggGroups: r.EggGroups !== undefined ? splitList(r.EggGroups) : base.eggGroups,
    hatchSteps: r.HatchSteps !== undefined ? Number(r.HatchSteps) : base.hatchSteps,
    catchRate: r.CatchRate !== undefined ? Number(r.CatchRate) : base.catchRate,
    raidRanks: r.RaidRanks !== undefined ? splitList(r.RaidRanks).map(Number) : base.raidRanks,
    megaStone: r.MegaStone ?? null,
    unmegaForm: r.UnmegaForm !== undefined ? Number(r.UnmegaForm) : 0,
    sprite: sprites.get(`${speciesId}_${formNumber}`) ?? null,
    foundIn: [],
  };
}

function statsEqual(a: BaseStats, b: BaseStats): boolean {
  return (
    a.hp === b.hp &&
    a.attack === b.attack &&
    a.defense === b.defense &&
    a.speed === b.speed &&
    a.spAtk === b.spAtk &&
    a.spDef === b.spDef
  );
}

function typesEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((t, i) => t === b[i]);
}

const spriteHashCache = new Map<string, string>();
function spriteHash(filename: string): string {
  let hash = spriteHashCache.get(filename);
  if (hash === undefined) {
    hash = createHash("sha256").update(readFileSync(join(SPRITES_DIR, filename))).digest("hex");
    spriteHashCache.set(filename, hash);
  }
  return hash;
}

/** A form with no sprite of its own isn't visually distinct from anything either way, so it
 *  doesn't rule out "duplicate" - but a form whose sprite file is merely a byte-identical copy
 *  of another entry's sprite (common for engine bookkeeping forms) also counts as the same
 *  picture, not proof of a real distinct form. Only an actually different image counts. */
function sameSprite(a: string | null, b: string | null): boolean {
  if (a === null) return true;
  if (b === null) return false;
  return spriteHash(a) === spriteHash(b);
}

/**
 * Some form blocks have no FormName and are visually identical (types + stats + sprite) to the
 * base species or an already-kept form - e.g. Zygarde's "PokedexForm" shadow entries (whose
 * sprite is literally a copy of another form's), or Rockruff's unnamed second block that has no
 * sprite of its own. These are internal engine bookkeeping, not player-facing forms, so they'd
 * just show up as a confusing duplicate row in the wiki's forms table. Forms like Alcremie's many
 * unnamed flavor variants are NOT caught by this - they share stats/types but each has its own
 * distinct artwork, so they're clearly real, separate forms worth showing.
 */
function isUnnamedDuplicate(form: PokemonForm, base: Pokemon): boolean {
  if (form.formName !== null) return false;
  const candidates = [base, ...base.forms];
  return candidates.some(
    (c) => typesEqual(form.types, c.types) && statsEqual(form.baseStats, c.baseStats) && sameSprite(form.sprite, c.sprite)
  );
}

export function parsePokemon(ctx: TranslationContext): Pokemon[] {
  const sprites = loadSpriteIndex();

  const baseBlocks = [
    ...parsePbsBlocks(load("pokemon.txt")),
    ...parsePbsBlocks(load("pokemon_base_Gen_9_Pack.txt")),
  ];
  const pokemon = new Map<string, Pokemon>();
  for (const block of baseBlocks) {
    const p = blockToPokemon(block, ctx, sprites);
    if (p.id === "MISSINGNO") continue; // glitch species, not a real Pokémon - keep it off the wiki
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
    const form = blockToForm(block, ctx, sprites, base);
    if (isUnnamedDuplicate(form, base)) continue;
    base.forms.push(form);
  }

  return [...pokemon.values()];
}
