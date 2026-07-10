import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord } from "./parsePbs.ts";
import { resolveTypeName, type TranslationContext } from "./translationContext.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

export interface TypeInfo {
  id: string;
  name: string; // German
}

// This fangame calls the Flying type "Wind" - not reflected anywhere in the PBS/translation
// files (confirmed with the project owner directly), so it's a hardcoded override rather than
// something derivable from data.
const NAME_OVERRIDES: Record<string, string> = {
  FLYING: "Wind",
};

export function parseTypes(ctx: TranslationContext): TypeInfo[] {
  const text = readFileSync(join(SOURCE_DIR, "types.txt"), "utf-8");
  return parsePbsBlocks(text).map((block) => {
    const r = blockToRecord(block);
    const id = block.headerParts[0];
    const name = NAME_OVERRIDES[id] ?? resolveTypeName(ctx, r.Name ?? id).text;
    return { id, name };
  });
}
