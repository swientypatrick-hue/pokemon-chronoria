// Shared helper for the standalone Excel reference exports (exportItemList.ts,
// exportPokemonList.ts): writes one "section" of a sheet as column-blocks laid out side by side
// (one block per group - bag pocket, Pokémon generation, ...) instead of one long vertical list,
// so a wide dataset still fits in relatively few rows and same-group rows are easy to compare.
import type ExcelJS from "exceljs";

export const FONT = { name: "Arial", size: 11 };
export const TITLE_FONT = { name: "Arial", size: 16, bold: true };
export const SECTION_FONT = { name: "Arial", size: 13, bold: true };
export const GROUP_HEADER_FONT = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
export const GROUP_HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF2F5496" } };
export const COL_HEADER_FONT = { name: "Arial", size: 10, bold: true };
export const COL_HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFD9E2F3" } };
export const NOTE_FONT = { name: "Arial", size: 10, italic: true, color: { argb: "FF666666" } };

export interface ColumnDef<Row> {
  header: string;
  width: number;
  get: (row: Row) => string | number;
  wrap?: boolean;
}

/** Writes one section as group column-blocks side by side, each block using the given column
 *  definitions. Returns the row after the last data row, so sections can be stacked. */
export function writeGroupedSection<Row>(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  title: string,
  countLabel: string,
  groupKeys: readonly (string | number)[],
  groupLabel: (key: string | number) => string,
  rowsByGroup: Map<string | number, Row[]>,
  columns: ColumnDef<Row>[]
): number {
  let row = startRow;
  const colsPerGroup = columns.length;
  const totalRows = [...rowsByGroup.values()].reduce((sum, list) => sum + list.length, 0);
  const totalCols = groupKeys.length * colsPerGroup;

  sheet.getCell(row, 1).value = title;
  sheet.getCell(row, 1).font = SECTION_FONT;
  row += 1;
  sheet.getCell(row, 1).value = countLabel;
  sheet.getCell(row, 1).font = FONT;
  sheet.getCell(row, 2).value = totalRows;
  sheet.getCell(row, 2).font = FONT;
  row += 1;

  const groupHeaderRow = row;
  groupKeys.forEach((key, i) => {
    const startCol = i * colsPerGroup + 1;
    const cell = sheet.getCell(groupHeaderRow, startCol);
    cell.value = groupLabel(key);
    cell.font = GROUP_HEADER_FONT;
    cell.fill = GROUP_HEADER_FILL;
    if (colsPerGroup > 1) {
      sheet.mergeCells(groupHeaderRow, startCol, groupHeaderRow, startCol + colsPerGroup - 1);
    }
  });
  row += 1;

  if (colsPerGroup > 1) {
    const colHeaderRow = row;
    groupKeys.forEach((_, i) => {
      const startCol = i * colsPerGroup + 1;
      columns.forEach((col, ci) => {
        const cell = sheet.getCell(colHeaderRow, startCol + ci);
        cell.value = col.header;
        cell.font = COL_HEADER_FONT;
        cell.fill = COL_HEADER_FILL;
      });
    });
    row += 1;
  }

  const dataStartRow = row;
  const maxLen = Math.max(0, ...groupKeys.map((k) => rowsByGroup.get(k)?.length ?? 0));
  for (let r = 0; r < maxLen; r++) {
    groupKeys.forEach((key, i) => {
      const list = rowsByGroup.get(key) ?? [];
      const item = list[r];
      if (!item) return;
      const startCol = i * colsPerGroup + 1;
      columns.forEach((col, ci) => {
        const cell = sheet.getCell(dataStartRow + r, startCol + ci);
        cell.value = col.get(item);
        cell.font = FONT;
        if (col.wrap) cell.alignment = { wrapText: true };
      });
    });
  }

  // Header underline plus a vertical separator between group blocks (right border on each
  // block's last column) so side-by-side groups stay easy to tell apart at a glance.
  const lastDataRow = dataStartRow + maxLen - 1;
  for (let r = groupHeaderRow; r <= Math.max(lastDataRow, groupHeaderRow); r++) {
    for (let c = 1; c <= totalCols; c++) {
      const isGroupBoundary = c % colsPerGroup === 0 && c !== totalCols;
      if (r !== groupHeaderRow && !isGroupBoundary) continue;
      sheet.getCell(r, c).border = {
        ...(r === groupHeaderRow ? { bottom: { style: "thin" as const, color: { argb: "FF000000" } } } : {}),
        ...(isGroupBoundary ? { right: { style: "medium" as const, color: { argb: "FF000000" } } } : {}),
      };
    }
  }

  return dataStartRow + maxLen;
}
