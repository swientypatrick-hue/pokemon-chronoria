// Orchestrates all parsers, builds cross-reference indices between the categories, and
// writes the clean, ready-to-render JSON that the Astro pages consume.
//
// Usage: node data-import/buildData.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadTranslationContext } from "./translationContext.ts";
import { parsePokemon } from "./parsePokemon.ts";
import { parseMoves } from "./parseMoves.ts";
import { parseAbilities } from "./parseAbilities.ts";
import { parseItems } from "./parseItems.ts";
import { parseTrainers } from "./parseTrainers.ts";
import { parseEncounters } from "./parseEncounters.ts";
import { parseTypes } from "./parseTypes.ts";
import type { EncounterRef } from "./dataModel.ts";

const OUT_DIR = join(import.meta.dirname, "..", "src", "data");

function writeJson(name: string, data: unknown) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(data));
}

/** Encounter species entries sometimes carry a form suffix (e.g. "ZIGZAGOON_1") that isn't
 *  a standalone PBS pokemon.txt entry - it refers to form 1 of the base species. Resolve to
 *  the base species id so encounter data still attaches to a real Pokémon page. */
function resolveEncounterSpeciesId(rawId: string, knownIds: Set<string>): string | null {
  if (knownIds.has(rawId)) return rawId;
  const base = rawId.replace(/_\d+$/, "");
  return knownIds.has(base) ? base : null;
}

function main() {
  console.log("Lade Übersetzungen...");
  const ctx = loadTranslationContext();

  console.log("Parse Pokémon, Attacken, Fähigkeiten, Items, Trainer, Fundorte...");
  const pokemon = parsePokemon(ctx);
  const moves = parseMoves(ctx);
  const abilities = parseAbilities();
  const items = parseItems();
  const trainers = parseTrainers(ctx);
  const encounters = parseEncounters();
  const types = parseTypes(ctx);

  console.log("Baue Querverweise...");
  const pokemonById = new Map(pokemon.map((p) => [p.id, p]));
  const moveById = new Map(moves.map((m) => [m.id, m]));
  const abilityById = new Map(abilities.map((a) => [a.id, a]));
  const knownPokemonIds = new Set(pokemonById.keys());

  // evolvesFrom
  for (const p of pokemon) {
    for (const evo of p.evolutions) {
      const target = pokemonById.get(evo.target);
      if (target) target.evolvesFrom = p.id;
    }
  }

  // move <-> pokemon (level-up, tutor/egg)
  for (const p of pokemon) {
    for (const lm of p.levelMoves) {
      moveById.get(lm.move)?.learnedByLevelUp.push(p.id);
    }
    for (const moveId of [...p.tutorMoves, ...p.eggMoves]) {
      moveById.get(moveId)?.learnedByTutorOrEgg.push(p.id);
    }
  }

  // ability <-> pokemon
  for (const p of pokemon) {
    for (const abilityId of [...p.abilities, ...p.hiddenAbilities]) {
      abilityById.get(abilityId)?.pokemonWithAbility.push(p.id);
    }
  }

  // trainer -> pokemon.usedByTrainers
  for (const t of trainers) {
    for (const tp of t.party) {
      const id = resolveEncounterSpeciesId(tp.species, knownPokemonIds);
      if (id) pokemonById.get(id)!.usedByTrainers.push(t.id);
    }
  }

  // encounters -> pokemon.foundIn
  let unresolvedEncounterSpecies = 0;
  for (const location of encounters) {
    for (const table of location.tables) {
      for (const slot of table.slots) {
        const id = resolveEncounterSpeciesId(slot.species, knownPokemonIds);
        if (!id) {
          unresolvedEncounterSpecies++;
          continue;
        }
        const ref: EncounterRef = {
          mapId: location.mapId,
          locationName: location.locationName,
          method: table.method,
          minLevel: slot.minLevel,
          maxLevel: slot.maxLevel,
        };
        pokemonById.get(id)!.foundIn.push(ref);
      }
    }
  }
  if (unresolvedEncounterSpecies > 0) {
    console.warn(`[Fundorte] ${unresolvedEncounterSpecies} Encounter-Einträge ohne passendes Pokémon übersprungen.`);
  }

  console.log("Schreibe JSON-Dateien...");
  writeJson("pokemon", pokemon);
  writeJson("moves", moves);
  writeJson("abilities", abilities);
  writeJson("items", items);
  writeJson("trainers", trainers);
  writeJson("encounters", encounters);
  writeJson("types", types);
  writeJson("meta", {
    generatedAt: new Date().toISOString(),
    counts: {
      pokemon: pokemon.length,
      moves: moves.length,
      abilities: abilities.length,
      items: items.length,
      trainers: trainers.length,
      locations: encounters.length,
    },
    translationFallbacks: {
      pokedex: pokemon.filter((p) => p.pokedex.fallback).length,
      category: pokemon.filter((p) => p.category.fallback).length,
      moveDescription: moves.filter((m) => m.description.fallback).length,
      trainerTypeName: trainers.filter((t) => t.trainerTypeName.fallback).length,
    },
  });

  console.log(`Fertig: ${pokemon.length} Pokémon, ${moves.length} Attacken, ${abilities.length} Fähigkeiten, ` +
    `${items.length} Items, ${trainers.length} Trainer, ${encounters.length} Orte.`);
}

main();
