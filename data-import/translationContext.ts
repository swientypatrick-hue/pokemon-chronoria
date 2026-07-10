// Loads the handful of Text_deutsch_core files that are actually needed (see README.md for
// why most PBS files don't need any external translation lookup at all - Name/Description are
// already German inline almost everywhere) and exposes them as ready-to-use lookup maps.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTranslationFile, buildTextIndex, buildNameAnchorIndex, normalizeKey } from "./parseTranslations.ts";

const SOURCE_DIR = join(import.meta.dirname, "source");

function load(relPath: string): string {
  return readFileSync(join(SOURCE_DIR, relPath), "utf-8");
}

export interface TranslationContext {
  /** English Pokedex text (verbatim from pokemon.txt) -> German Pokedex text */
  pokedexText: Map<string, string>;
  /** English move Description text -> German Description text */
  moveDescriptionText: Map<string, string>;
  /** English species Category word (e.g. "Seed") -> German ("Samen") */
  speciesCategory: Map<string, string>;
  /** English form name (e.g. "Alolan Form") -> German */
  formName: Map<string, string>;
  /** normalized internal type code (e.g. "FIGHTING") -> German type name */
  typeName: Map<string, string>;
  /** English trainer class display name -> German (only ~50 of 348 classes are translated) */
  trainerTypeName: Map<string, string>;
}

export function loadTranslationContext(): TranslationContext {
  const pokedexText = buildTextIndex(parseTranslationFile(load("Text_deutsch_core/POKEDEX_ENTRIES.txt")));
  const moveDescriptionText = buildTextIndex(parseTranslationFile(load("Text_deutsch_core/MOVE_DESCRIPTIONS.txt")));
  const speciesCategory = buildTextIndex(parseTranslationFile(load("Text_deutsch_core/SPECIES_CATEGORIES.txt")));
  const formName = buildTextIndex(parseTranslationFile(load("Text_deutsch_core/SPECIES_FORM_NAMES.txt")));
  const trainerTypeName = buildTextIndex(parseTranslationFile(load("Text_deutsch_core/TRAINER_TYPE_NAMES.txt")));

  const typeNameAnchor = buildNameAnchorIndex(parseTranslationFile(load("Text_deutsch_core/TYPE_NAMES.txt")));
  const typeName = new Map<string, string>();
  for (const [key, pair] of typeNameAnchor) typeName.set(key, pair.de);

  return { pokedexText, moveDescriptionText, speciesCategory, formName, typeName, trainerTypeName };
}

export interface TranslatedText {
  text: string;
  /** true if no German match was found and this is the raw English/PBS fallback text */
  fallback: boolean;
}

/**
 * Look up `english` in `dict`; falls back to the English text itself (marked) if missing.
 * Also treats a found-but-untranslated entry (some Text_deutsch_core rows still have the
 * German line literally duplicating the English one, e.g. Bug Buzz's description) as a
 * fallback, since showing it unmarked would misrepresent it as done.
 */
export function resolveText(dict: Map<string, string>, english: string | undefined): TranslatedText {
  const trimmed = english?.trim() ?? "";
  if (!trimmed) return { text: "", fallback: false };
  const de = dict.get(trimmed);
  if (de === undefined) return { text: trimmed, fallback: true };
  if (de.trim() === trimmed) return { text: trimmed, fallback: true };
  return { text: de, fallback: false };
}

export function resolveTypeName(ctx: TranslationContext, internalCode: string): TranslatedText {
  const de = ctx.typeName.get(normalizeKey(internalCode));
  return de !== undefined ? { text: de, fallback: false } : { text: internalCode, fallback: true };
}
