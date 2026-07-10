// Parser for Text_deutsch_core / Text_english_core / Text_english_game files.
//
// Shape:
//   # comment lines...
//   #-------------------------------
//   [SECTION_NAME]
//   <english line 1>
//   <german line 1>
//   <english line 2>
//   <german line 2>
//   ...
//
// There are no per-entry identifiers - line N of the "other language" file lines
// up with the Nth [HEADER] block of the corresponding PBS file, purely by order.
// See parseTranslations docs in the plan for why this positional join is fragile
// and needs a length/spot-check against the PBS source.

export interface TranslationFile {
  section: string;
  /** Index-aligned with the source PBS file's block order. */
  pairs: { en: string; de: string }[];
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseTranslationFile(fileText: string): TranslationFile {
  const lines = stripBom(fileText)
    .split(/\r?\n/)
    .map((l) => l.replace(/\r$/, ""));

  let section = "";
  const contentLines: string[] = [];
  let sectionFound = false;

  for (const line of lines) {
    if (!sectionFound) {
      const headerMatch = line.match(/^\s*\[(.+?)\]\s*$/);
      if (headerMatch) {
        section = headerMatch[1];
        sectionFound = true;
      }
      continue; // skip comments/dividers before the header
    }
    if (line === "") continue; // some files pad with blank lines at EOF
    contentLines.push(line);
  }

  const pairs: { en: string; de: string }[] = [];
  for (let i = 0; i < contentLines.length; i += 2) {
    pairs.push({ en: contentLines[i], de: contentLines[i + 1] ?? "" });
  }

  return { section, pairs };
}

// --- Reality check (see data-import/README.md): the Text_deutsch_core files are a stale
// snapshot from an earlier point in this fangame's development (counts don't match current
// PBS files, e.g. 730 item names for 891 current items) and are NOT reliably index-aligned
// with today's PBS file order. Positional zipping is therefore unsafe as a general strategy.
// Instead we match by content, using whichever anchor is actually stable:

export function normalizeKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Name-anchor: match a PBS internal name (e.g. "BULBASAUR") against a *_NAMES.txt english column. */
export function buildNameAnchorIndex(translation: TranslationFile): Map<string, { en: string; de: string }> {
  const map = new Map<string, { en: string; de: string }>();
  for (const pair of translation.pairs) {
    map.set(normalizeKey(pair.en), pair);
  }
  return map;
}

/**
 * EN text -> DE text lookup, keyed on the exact English string. Covers two cases with the
 * same mechanism:
 *  - phrase dictionaries: short fields (type names, trainer class names, species categories)
 *    that repeat the same English text across many PBS entries.
 *  - text-anchors: long free-text fields where the PBS file itself still carries the original
 *    English (moves.txt Description, pokemon.txt Pokedex) - match that verbatim against the
 *    translation file's English column, far more robust than trusting row order.
 */
export function buildTextIndex(translation: TranslationFile): Map<string, string> {
  const map = new Map<string, string>();
  for (const pair of translation.pairs) {
    map.set(pair.en.trim(), pair.de);
  }
  return map;
}
