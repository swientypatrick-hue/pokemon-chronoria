// Copies the relevant PBS + translation text files from the game project into
// data-import/source, so the parser (and CI, which has no access to the game
// project) always works off a committed, versioned snapshot. Also copies the front
// sprite artwork into public/sprites/ so pages can reference it directly.
//
// Usage: node data-import/syncData.ts [pfad-zum-spielprojekt]
// Default game dir: E:/Test

import { existsSync, mkdirSync, readdirSync, copyFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const gameDir = process.argv[2] ?? "E:/Test";
const outDir = join(import.meta.dirname, "source");
const publicDir = join(import.meta.dirname, "..", "public");

// CI (and anyone without the game project checked out) has no access to gameDir - dev/build
// now run this script unconditionally for local convenience, so skip quietly instead of
// throwing and just build off the already-committed source/ snapshot and public/ assets.
if (!existsSync(gameDir)) {
  console.log(`Spielprojekt-Ordner ${gameDir} nicht gefunden - Sync übersprungen, nutze vorhandenen Datenstand.`);
  process.exit(0);
}

const EXCLUDED_PBS_FILES = new Set<string>([]);
const EXCLUDED_PBS_PREFIXES = ["cup_", "battle_tower_", "trainers_DTS_Example"];

function copyTxtFiles(srcDir: string, destDir: string, filter?: (name: string) => boolean) {
  if (!existsSync(srcDir)) {
    throw new Error(`Quellordner fehlt: ${srcDir}`);
  }
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  const valid = new Set<string>();
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith(".txt")) continue;
    if (filter && !filter(name)) continue;
    copyFileSync(join(srcDir, name), join(destDir, name));
    valid.add(name);
    count++;
  }
  // Mirror the source: remove destination files that no longer exist (or are no longer
  // included) in the source, so renamed/deleted content doesn't linger forever.
  for (const name of readdirSync(destDir)) {
    if (name.endsWith(".txt") && !valid.has(name)) unlinkSync(join(destDir, name));
  }
  return count;
}

function isIncludedPbsFile(name: string) {
  if (EXCLUDED_PBS_FILES.has(name)) return false;
  return !EXCLUDED_PBS_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function copySprites(srcDir: string, destDir: string) {
  if (!existsSync(srcDir)) {
    throw new Error(`Sprite-Ordner fehlt: ${srcDir}`);
  }
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  const valid = new Set<string>();
  // Windows is case-insensitive but case-PRESERVING: if the destination already has
  // "CHARMANDER_FEMALE.png" and the source now has "CHARMANDER_female.png", copyFileSync
  // just overwrites the existing entry's *content* while silently keeping its old-cased
  // *name* on disk. The parser's sprite lookups are case-sensitive, so that stale casing
  // makes the sprite invisible to it - and the exact-match orphan check below would then
  // wrongly delete it next run (it no longer matches the source's casing either). Building
  // a case-insensitive map of what's already there lets us delete the stale-cased file
  // first, so the destination's casing always ends up matching the source exactly.
  const existingByLowerName = new Map<string, string>();
  for (const name of readdirSync(destDir)) {
    existingByLowerName.set(name.toLowerCase(), name);
  }
  for (const name of readdirSync(srcDir)) {
    if (!/\.png$/i.test(name)) continue;
    const existing = existingByLowerName.get(name.toLowerCase());
    if (existing && existing !== name) {
      unlinkSync(join(destDir, existing));
    }
    copyFileSync(join(srcDir, name), join(destDir, name));
    valid.add(name);
    count++;
  }
  // Mirror the source: remove destination files that no longer exist in the source, so
  // renamed/removed art (e.g. an old form's sprite) doesn't linger as an orphan forever.
  for (const name of readdirSync(destDir)) {
    if (/\.png$/i.test(name) && !valid.has(name)) unlinkSync(join(destDir, name));
  }
  return count;
}

const pbsCount = copyTxtFiles(join(gameDir, "PBS"), join(outDir, "PBS"), isIncludedPbsFile);
const deCount = copyTxtFiles(join(gameDir, "Text_deutsch_core"), join(outDir, "Text_deutsch_core"));
const enCoreCount = copyTxtFiles(join(gameDir, "Text_english_core"), join(outDir, "Text_english_core"));
const enGameCount = copyTxtFiles(join(gameDir, "Text_english_game"), join(outDir, "Text_english_game"));
const spriteCount = copySprites(join(gameDir, "Graphics", "Pokemon", "Front"), join(publicDir, "sprites"));
const shinySpriteCount = copySprites(join(gameDir, "Graphics", "Pokemon", "Front shiny"), join(publicDir, "sprites-shiny"));
const itemIconCount = copySprites(join(gameDir, "Graphics", "Items"), join(publicDir, "item-icons"));
const trainerSpriteCount = copySprites(join(gameDir, "Graphics", "Trainers"), join(publicDir, "trainers"));
const medalIconCount = copySprites(join(gameDir, "Graphics", "UI", "Medal Box", "Medals"), join(publicDir, "medals"));

console.log(`Sync abgeschlossen aus ${gameDir}:`);
console.log(`  PBS: ${pbsCount} Dateien`);
console.log(`  Text_deutsch_core: ${deCount} Dateien`);
console.log(`  Text_english_core: ${enCoreCount} Dateien`);
console.log(`  Text_english_game: ${enGameCount} Dateien`);
console.log(`  Sprites: ${spriteCount} Dateien`);
console.log(`  Shiny-Sprites: ${shinySpriteCount} Dateien`);
console.log(`  Item-Icons: ${itemIconCount} Dateien`);
console.log(`  Trainer-Sprites: ${trainerSpriteCount} Dateien`);
console.log(`  Medaillen-Icons: ${medalIconCount} Dateien`);
