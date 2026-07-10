import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord } from "./parsePbs.ts";
import { resolveTypeName, type TranslationContext } from "./translationContext.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

export interface TypeInfo {
  id: string;
  name: string; // German
}

export function parseTypes(ctx: TranslationContext): TypeInfo[] {
  const text = readFileSync(join(SOURCE_DIR, "types.txt"), "utf-8");
  return parsePbsBlocks(text).map((block) => {
    const r = blockToRecord(block);
    return { id: block.headerParts[0], name: resolveTypeName(ctx, r.Name ?? block.headerParts[0]).text };
  });
}
