import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, splitList, type PbsBlock } from "./parsePbs.ts";
import type { TranslationContext } from "./translationContext.ts";
import type { Trainer, TrainerPokemon } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");
const TRAINER_SPRITES_DIR = join(import.meta.dirname, "..", "public", "trainers");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

/** Same idea as the Pokémon sprite index: build a lookup once so we pick up whichever exact
 *  casing/extension the trainer graphic actually has on disk, keyed by the trainerType id. */
function loadTrainerSpriteIndex(): Map<string, string> {
  const index = new Map<string, string>();
  if (!existsSync(TRAINER_SPRITES_DIR)) return index;
  for (const name of readdirSync(TRAINER_SPRITES_DIR)) {
    const withoutExt = name.replace(/\.png$/i, "");
    index.set(withoutExt, name);
  }
  return index;
}

function parseTrainerTypeNames(): Map<string, string> {
  const names = new Map<string, string>();
  for (const block of parsePbsBlocks(load("trainer_types.txt"))) {
    const r = blockToRecord(block);
    if (r.Name) names.set(block.headerParts[0], r.Name);
  }
  return names;
}

function blockToTrainer(
  block: PbsBlock,
  typeEnglishNames: Map<string, string>,
  ctx: TranslationContext,
  sprites: Map<string, string>
): Trainer {
  const [trainerType, name, disambiguator] = block.headerParts;
  const id = [trainerType, name, disambiguator].filter(Boolean).join("-");

  let loseText: string | null = null;
  const party: TrainerPokemon[] = [];
  let current: TrainerPokemon | null = null;

  for (const line of block.lines) {
    if (line.key === "Pokemon") {
      const [species, level] = splitList(line.value ?? "");
      current = {
        species,
        level: Number(level ?? 0),
        form: 0,
        moves: [],
        abilityIndex: null,
        item: null,
        gender: null,
        shiny: false,
        shadow: false,
        nature: null,
      };
      party.push(current);
      continue;
    }
    if (!current) {
      // Trainer-level fields (Items, LoseText, ...) before the first Pokemon line.
      if (line.key === "LoseText") loseText = line.value;
      continue;
    }
    switch (line.key) {
      case "Moves":
        current.moves = splitList(line.value ?? "");
        break;
      case "Item":
        current.item = line.value;
        break;
      case "Gender":
        current.gender = line.value;
        break;
      case "Shiny":
        current.shiny = line.value === "true";
        break;
      case "Shadow":
        current.shadow = line.value === "true";
        break;
      case "Nature":
        current.nature = line.value;
        break;
      case "AbilityIndex":
        current.abilityIndex = Number(line.value);
        break;
      case "Form":
        current.form = Number(line.value);
        break;
    }
  }

  // trainer_types.txt's Name field is an inconsistent mix of still-English classes
  // ("Pokémon Trainer") and already hand-translated custom ones ("Arenaleiter") - unlike
  // moves/pokemon there's no reliable signal for which is which, so unlike resolveText()
  // elsewhere we don't mark a dictionary miss as an untranslated fallback here: unmatched
  // classes just keep their PBS text as-is rather than showing a misleading "EN" badge on
  // text that's often already correct German.
  const englishTypeName = typeEnglishNames.get(trainerType) ?? trainerType;
  const translatedTypeName = ctx.trainerTypeName.get(englishTypeName.trim());
  return {
    id,
    trainerType,
    trainerTypeName: { text: translatedTypeName ?? englishTypeName, fallback: false },
    name,
    loseText,
    party,
    sprite: sprites.get(trainerType) ?? null,
    locations: [],
  };
}

// Battle-Tower/Cup pools (cup_*.txt, battle_tower_*.txt) are intentionally excluded from
// data-import/source - they're huge generic rental pools, not meaningful wiki content.
export function parseTrainers(ctx: TranslationContext): Trainer[] {
  const typeEnglishNames = parseTrainerTypeNames();
  const sprites = loadTrainerSpriteIndex();
  return parsePbsBlocks(load("trainers.txt")).map((block) => blockToTrainer(block, typeEnglishNames, ctx, sprites));
}
