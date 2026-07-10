import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePbsBlocks, blockToRecord, splitList, type PbsBlock } from "./parsePbs.ts";
import { resolveText, resolveInlineName, type TranslationContext, type TranslatedText } from "./translationContext.ts";
import type { Move } from "./dataModel.ts";

const SOURCE_DIR = join(import.meta.dirname, "source", "PBS");

function load(file: string): string {
  return readFileSync(join(SOURCE_DIR, file), "utf-8");
}

function toNumberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function blockToMove(block: PbsBlock, ctx: TranslationContext, description: TranslatedText): Move {
  const r = blockToRecord(block);
  const id = block.headerParts[0];
  return {
    id,
    name: resolveInlineName(ctx.moveName, id, r.Name ?? id),
    type: r.Type ?? "",
    category: r.Category ?? "",
    power: toNumberOrNull(r.Power),
    accuracy: toNumberOrNull(r.Accuracy),
    totalPP: toNumberOrNull(r.TotalPP),
    target: r.Target ?? "",
    priority: Number(r.Priority ?? 0),
    flags: splitList(r.Flags),
    description,
    learnedByLevelUp: [],
    learnedByTutorOrEgg: [],
  };
}

export function parseMoves(ctx: TranslationContext): Move[] {
  const moves = new Map<string, Move>();

  // Base moves.txt: Description is still English in PBS, resolve via text-anchor.
  for (const block of parsePbsBlocks(load("moves.txt"))) {
    const r = blockToRecord(block);
    moves.set(block.headerParts[0], blockToMove(block, ctx, resolveText(ctx.moveDescriptionText, r.Description)));
  }

  // Gen 9 Pack moves already carry a hand-written German Description inline - use as-is.
  for (const block of parsePbsBlocks(load("moves_Gen_9_Pack.txt"))) {
    const r = blockToRecord(block);
    moves.set(block.headerParts[0], blockToMove(block, ctx, { text: r.Description ?? "", fallback: false }));
  }

  return [...moves.values()];
}
