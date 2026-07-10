// Copies the relevant PBS + translation text files from the game project into
// data-import/source, so the parser (and CI, which has no access to the game
// project) always works off a committed, versioned snapshot. Also copies the front
// sprite artwork into public/sprites/ so pages can reference it directly.
//
// Usage: node data-import/syncData.ts [pfad-zum-spielprojekt]
// Default game dir: E:/Test

import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const gameDir = process.argv[2] ?? "E:/Test";
const outDir = join(import.meta.dirname, "source");
const publicDir = join(import.meta.dirname, "..", "public");

const EXCLUDED_PBS_FILES = new Set<string>([]);
const EXCLUDED_PBS_PREFIXES = ["cup_", "battle_tower_", "trainers_DTS_Example"];

function copyTxtFiles(srcDir: string, destDir: string, filter?: (name: string) => boolean) {
  if (!existsSync(srcDir)) {
    throw new Error(`Quellordner fehlt: ${srcDir}`);
  }
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith(".txt")) continue;
    if (filter && !filter(name)) continue;
    copyFileSync(join(srcDir, name), join(destDir, name));
    count++;
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
  for (const name of readdirSync(srcDir)) {
    if (!/\.png$/i.test(name)) continue;
    copyFileSync(join(srcDir, name), join(destDir, name));
    count++;
  }
  return count;
}

const pbsCount = copyTxtFiles(join(gameDir, "PBS"), join(outDir, "PBS"), isIncludedPbsFile);
const deCount = copyTxtFiles(join(gameDir, "Text_deutsch_core"), join(outDir, "Text_deutsch_core"));
const enCoreCount = copyTxtFiles(join(gameDir, "Text_english_core"), join(outDir, "Text_english_core"));
const enGameCount = copyTxtFiles(join(gameDir, "Text_english_game"), join(outDir, "Text_english_game"));
const spriteCount = copySprites(join(gameDir, "Graphics", "Pokemon", "Front"), join(publicDir, "sprites"));
const itemIconCount = copySprites(join(gameDir, "Graphics", "Items"), join(publicDir, "item-icons"));

console.log(`Sync abgeschlossen aus ${gameDir}:`);
console.log(`  PBS: ${pbsCount} Dateien`);
console.log(`  Text_deutsch_core: ${deCount} Dateien`);
console.log(`  Text_english_core: ${enCoreCount} Dateien`);
console.log(`  Text_english_game: ${enGameCount} Dateien`);
console.log(`  Sprites: ${spriteCount} Dateien`);
console.log(`  Item-Icons: ${itemIconCount} Dateien`);
