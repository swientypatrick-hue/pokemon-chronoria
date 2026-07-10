// Generic parser for the Pokémon Essentials "PBS" text format used across
// pokemon.txt, moves.txt, abilities.txt, items.txt, trainers.txt, encounters.txt, etc.
//
// Shape: repeating blocks of
//   [HEADER] or [HEADER] # comment
//   key = value
//   key = value
//   ...
// separated by blank lines and/or "#-------------------------------" divider lines.
// Some files (trainers.txt, encounters.txt) additionally indent lines to nest them
// under the preceding line - callers that care about that use `line.indent`.

export interface PbsLine {
  raw: string;
  indent: number;
  key: string | null;
  value: string | null;
}

export interface PbsBlock {
  /** Raw comma-separated parts inside the [ ] header, e.g. ["BULBASAUR"] or ["LEADER_Arena2","Isaac","1"] */
  headerParts: string[];
  /** Trailing "# comment" text after the header line, if any (used by encounters.txt/map_metadata.txt) */
  headerComment: string | null;
  lines: PbsLine[];
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function isDividerLine(line: string): boolean {
  return /^#-+$/.test(line.trim());
}

function isCommentOnlyLine(line: string): boolean {
  return line.trim().startsWith("#");
}

export function parsePbsBlocks(fileText: string): PbsBlock[] {
  const text = stripBom(fileText);
  const rawLines = text.split(/\r?\n/);

  const blocks: PbsBlock[] = [];
  let current: PbsBlock | null = null;

  for (const rawLine of rawLines) {
    if (rawLine.trim() === "") continue;
    if (isDividerLine(rawLine)) continue;

    const headerMatch = rawLine.match(/^\s*\[(.+?)\]\s*(?:#\s*(.*))?$/);
    if (headerMatch) {
      if (current) blocks.push(current);
      const headerParts = headerMatch[1].split(",").map((s) => s.trim());
      current = {
        headerParts,
        headerComment: headerMatch[2]?.trim() ?? null,
        lines: [],
      };
      continue;
    }

    if (isCommentOnlyLine(rawLine)) continue;
    if (!current) continue; // stray line before any header (e.g. file-level comments)

    const indent = rawLine.match(/^(\s*)/)?.[1].length ?? 0;
    const trimmed = rawLine.trim();
    const eqIndex = trimmed.indexOf(" = ");
    const key = eqIndex >= 0 ? trimmed.slice(0, eqIndex).trim() : null;
    const value = eqIndex >= 0 ? trimmed.slice(eqIndex + 3).trim() : null;

    current.lines.push({ raw: trimmed, indent, key, value });
  }
  if (current) blocks.push(current);

  return blocks;
}

/** For flat blocks (pokemon.txt, moves.txt, abilities.txt, items.txt): every line is a top-level key=value. */
export function blockToRecord(block: PbsBlock): Record<string, string> {
  const record: Record<string, string> = {};
  for (const line of block.lines) {
    if (line.key) record[line.key] = line.value ?? "";
  }
  return record;
}

export function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}
