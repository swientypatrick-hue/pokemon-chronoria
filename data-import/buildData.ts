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
import { parseMedals } from "./parseMedals.ts";
import type { EncounterRef, Pokemon } from "./dataModel.ts";

const OUT_DIR = join(import.meta.dirname, "..", "src", "data");

function writeJson(name: string, data: unknown) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(data));
}

/** Encounter species entries sometimes carry a form suffix (e.g. "ZIGZAGOON_1") - encounters.txt
 *  deliberately distinguishes forms (a form can be rarer/only appear at certain times), so this
 *  resolves to the exact form rather than collapsing everything onto the base species. Falls
 *  back to the base species if the suffix doesn't match a real form (or there's no suffix). */
function resolveEncounterTarget(
  rawId: string,
  pokemonById: Map<string, Pokemon>
): { speciesId: string; formNumber: number | null } | null {
  if (pokemonById.has(rawId)) return { speciesId: rawId, formNumber: null };
  const match = rawId.match(/^(.+)_(\d+)$/);
  if (!match) return null;
  const [, base, formNumberRaw] = match;
  const species = pokemonById.get(base);
  if (!species) return null;
  const formNumber = Number(formNumberRaw);
  const formExists = species.forms.some((f) => f.formNumber === formNumber);
  return { speciesId: base, formNumber: formExists ? formNumber : null };
}

function main() {
  console.log("Lade Übersetzungen...");
  const ctx = loadTranslationContext();

  console.log("Parse Pokémon, Attacken, Fähigkeiten, Items, Trainer, Fundorte, Medaillen...");
  const pokemon = parsePokemon(ctx);
  const moves = parseMoves(ctx);
  const abilities = parseAbilities(ctx);
  const items = parseItems(ctx);
  const trainers = parseTrainers(ctx);
  const encounters = parseEncounters();
  const types = parseTypes(ctx);
  const medals = parseMedals();

  console.log("Baue Querverweise...");
  const pokemonById = new Map(pokemon.map((p) => [p.id, p]));
  const moveById = new Map(moves.map((m) => [m.id, m]));
  const abilityById = new Map(abilities.map((a) => [a.id, a]));

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

  // encounters -> pokemon.foundIn / form.foundIn
  let unresolvedEncounterSpecies = 0;
  for (const location of encounters) {
    for (const table of location.tables) {
      for (const slot of table.slots) {
        const target = resolveEncounterTarget(slot.species, pokemonById);
        if (!target) {
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
        const species = pokemonById.get(target.speciesId)!;
        if (target.formNumber === null) {
          species.foundIn.push(ref);
        } else {
          species.forms.find((f) => f.formNumber === target.formNumber)!.foundIn.push(ref);
        }
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
  writeJson("medals", medals);
  writeJson("meta", {
    generatedAt: new Date().toISOString(),
    counts: {
      pokemon: pokemon.length,
      moves: moves.length,
      abilities: abilities.length,
      items: items.length,
      trainers: trainers.length,
      locations: encounters.length,
      medals: medals.length,
    },
    translationFallbacks: {
      pokemonName: pokemon.filter((p) => p.nameFallback).length,
      pokedex: pokemon.filter((p) => p.pokedex.fallback).length,
      category: pokemon.filter((p) => p.category.fallback).length,
      moveName: moves.filter((m) => m.nameFallback).length,
      moveDescription: moves.filter((m) => m.description.fallback).length,
      abilityName: abilities.filter((a) => a.nameFallback).length,
      itemName: items.filter((i) => i.nameFallback).length,
      trainerTypeName: trainers.filter((t) => t.trainerTypeName.fallback).length,
    },
  });

  console.log(`Fertig: ${pokemon.length} Pokémon, ${moves.length} Attacken, ${abilities.length} Fähigkeiten, ` +
    `${items.length} Items, ${trainers.length} Trainer, ${encounters.length} Orte, ${medals.length} Medaillen.`);
}

main();
