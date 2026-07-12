// Wild held-item chances, per the Essentials PBS rule for WildItemCommon/Uncommon/Rare:
// https://essentialsengine.miraheze.org/wiki/Defining_a_species
// Chance per tier is 50% / 5% / 1%; multiple items within a tier are equally likely to be
// picked. If all three tiers list the exact same single item, its chance is 100% instead.
export interface WildItemRow {
  chance: string;
  itemIds: string[];
}

export function wildItemRows(common: string[], uncommon: string[], rare: string[]): WildItemRow[] {
  const allSameItem =
    common.length === 1 && uncommon.length === 1 && rare.length === 1 && common[0] === uncommon[0] && common[0] === rare[0];
  if (allSameItem) {
    return [{ chance: "100%", itemIds: common }];
  }
  const rows: WildItemRow[] = [];
  if (common.length > 0) rows.push({ chance: "50%", itemIds: common });
  if (uncommon.length > 0) rows.push({ chance: "5%", itemIds: uncommon });
  if (rare.length > 0) rows.push({ chance: "1%", itemIds: rare });
  return rows;
}
