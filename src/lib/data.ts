import pokemonData from "../data/pokemon.json";
import movesData from "../data/moves.json";
import abilitiesData from "../data/abilities.json";
import itemsData from "../data/items.json";
import trainersData from "../data/trainers.json";
import typesData from "../data/types.json";
import metaData from "../data/meta.json";
import type { Pokemon, Move, Ability, Item, Trainer } from "../../data-import/dataModel";

export const pokemon = pokemonData as Pokemon[];
export const moves = movesData as Move[];
export const abilities = abilitiesData as Ability[];
export const items = itemsData as Item[];
export const trainers = trainersData as Trainer[];
export const types = typesData as { id: string; name: string }[];
export const meta = metaData as {
  generatedAt: string;
  counts: Record<string, number>;
  translationFallbacks: Record<string, number>;
};

export const pokemonById = new Map(pokemon.map((p) => [p.id, p]));
/** Pokédex number = position in the source PBS files, the same order the game itself uses. */
export const pokemonDexNumber = new Map(pokemon.map((p, i) => [p.id, i + 1]));
export const moveById = new Map(moves.map((m) => [m.id, m]));
export const abilityById = new Map(abilities.map((a) => [a.id, a]));
export const itemById = new Map(items.map((i) => [i.id, i]));
export const trainerById = new Map(trainers.map((t) => [t.id, t]));
export const typeNameById = new Map(types.map((t) => [t.id, t.name]));

/** URL-safe slug for a PBS internal id or (for trainers) a "TYPE-Name-id" string. */
export function slugify(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

/**
 * Trainer ids embed a human name (e.g. "COOK-Stefano" vs "COOK-STEFANO" for two different
 * rematch entries) and can collide once lowercased by slugify - unlike every other category,
 * whose PBS internal names are already unique case-insensitively. De-duplicate with a
 * numeric suffix so every trainer still gets its own page.
 */
export const trainerSlugById = new Map<string, string>();
{
  const seen = new Map<string, number>();
  for (const t of trainers) {
    const base = slugify(t.id);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    trainerSlugById.set(t.id, n === 0 ? base : `${base}-${n + 1}`);
  }
}

export function trainerSlug(id: string): string {
  return trainerSlugById.get(id) ?? slugify(id);
}
