// Shape of the generated src/data/*.json files consumed by the Astro pages.
import type { TranslatedText } from "./translationContext.ts";

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spAtk: number;
  spDef: number;
}

export interface LevelMove {
  level: number;
  move: string; // move id
}

export interface Evolution {
  target: string; // species id
  method: string;
  param: string;
}

export interface PokemonForm {
  formNumber: number;
  formName: TranslatedText | null;
  types: string[];
  baseStats: BaseStats;
  abilities: string[];
  hiddenAbilities: string[];
  levelMoves: LevelMove[];
  tutorMoves: string[];
  eggMoves: string[];
  evolutions: Evolution[];
  pokedex: TranslatedText;
  height: number;
  weight: number;
  eggGroups: string[];
  hatchSteps: number;
  catchRate: number;
  raidRanks: number[];
  /** PBS item id of the Mega Stone that triggers this form, or null if it's not a Mega Evolution */
  megaStone: string | null;
  /** form number this Mega Evolution reverts to after battle (0 = base species). Only meaningful when megaStone is set. */
  unmegaForm: number;
  /** filename in public/sprites/, or null if no matching form sprite exists */
  sprite: string | null;
  /** filename in public/sprites/ for the "_female" gender-difference variant, or null if none exists */
  femaleSprite: string | null;
  /** filename in public/sprites-shiny/, or null if no matching shiny form sprite exists */
  shinySprite: string | null;
  /** filename in public/sprites-shiny/ for the "_female" gender-difference variant, or null if none exists */
  femaleShinySprite: string | null;
  /** item ids a wild Pokémon of this form may be found holding - 50%/5%/1% chance per tier (100% if all three are the same single item) */
  wildItemCommon: string[];
  wildItemUncommon: string[];
  wildItemRare: string[];
  /** true if this form exists solely to represent the species' female appearance/stats (PBS convention: FormName="Female", e.g. Indeedee/Meowstic/Basculegion/Oinkologne) - shown as a male/female toggle on the species page instead of in the Formen list. */
  isFemaleForm: boolean;
  // reverse index, filled in by buildData.ts
  foundIn: EncounterRef[];
}

export interface Pokemon {
  id: string;
  name: string;
  /** true if `name` is still the untranslated English species name */
  nameFallback: boolean;
  /** filename in public/sprites/, or null if no matching sprite exists */
  sprite: string | null;
  /** filename in public/sprites/ for the "_female" gender-difference variant, or null if none exists */
  femaleSprite: string | null;
  /** filename in public/sprites-shiny/, or null if no matching shiny sprite exists */
  shinySprite: string | null;
  /** filename in public/sprites-shiny/ for the "_female" gender-difference variant, or null if none exists */
  femaleShinySprite: string | null;
  types: string[];
  baseStats: BaseStats;
  abilities: string[];
  hiddenAbilities: string[];
  category: TranslatedText;
  pokedex: TranslatedText;
  height: number;
  weight: number;
  genderRatio: string;
  growthRate: string;
  eggGroups: string[];
  hatchSteps: number;
  catchRate: number;
  /** raid star ranks this species can appear at, e.g. [1,2] - empty if not raid-eligible */
  raidRanks: number[];
  /** item ids a wild Pokémon of this species may be found holding - 50%/5%/1% chance per tier (100% if all three are the same single item) */
  wildItemCommon: string[];
  wildItemUncommon: string[];
  wildItemRare: string[];
  levelMoves: LevelMove[];
  tutorMoves: string[];
  eggMoves: string[];
  evolutions: Evolution[];
  evolvesFrom: string | null; // filled in by buildData.ts
  generation: number | null;
  forms: PokemonForm[];
  // reverse index, filled in by buildData.ts
  foundIn: EncounterRef[];
}

export interface Move {
  id: string;
  name: string; // resolved via MOVE_NAMES.txt name-anchor, PBS inline as fallback
  /** true if `name` is still the untranslated English move name */
  nameFallback: boolean;
  type: string;
  category: string; // Physical/Special/Status
  power: number | null;
  accuracy: number | null;
  totalPP: number | null;
  target: string;
  priority: number;
  flags: string[];
  description: TranslatedText;
  // reverse index
  learnedByLevelUp: string[]; // species ids
  learnedByTutorOrEgg: string[];
}

export interface Ability {
  id: string;
  name: string; // resolved via ABILITY_NAMES.txt name-anchor, PBS inline as fallback
  /** true if `name` is still the untranslated English ability name */
  nameFallback: boolean;
  description: string; // already German inline in PBS
  // reverse index
  pokemonWithAbility: string[];
}

export interface Item {
  id: string;
  name: string; // resolved via ITEM_NAMES.txt name-anchor, PBS inline as fallback
  /** true if `name` is still the untranslated English item name */
  nameFallback: boolean;
  namePlural: string | null;
  description: string; // already German inline in PBS
  pocket: number | null;
  price: number | null;
  /** PBS "SellPrice" field, distinct from the derived default (Price / 4) Essentials uses when
   *  this is absent - explicitly 0 marks an item as buyable but never sellable, the signal
   *  priceRules.ts uses to detect one-off legendary form items (Adamant Crystal, Griseous
   *  Core, ...). null means the PBS entry has no SellPrice line at all. */
  sellPrice: number | null;
  fieldUse: string | null;
  flags: string[];
  /** filename in public/item-icons/, or null if no matching icon exists */
  icon: string | null;
  /** short content hash of the icon file, or null if icon is null - see data-import/fileHash.ts
   *  for why pages need this appended to the <img src> as a cache-busting query string */
  iconVersion: string | null;
  /** move id this TM/HM teaches, or null for items that don't teach a move */
  move: string | null;
  // reverse index, filled in by buildData.ts from the map-event dump
  locations: ItemLocationRef[];
}

export interface MedalCondition {
  type: string; // e.g. "Caught"
  param: string; // e.g. "GENESECT" (species id)
}

export interface Medal {
  id: string;
  name: string;
  /** filename in public/medals/, or null if no matching icon exists */
  icon: string | null;
  rarity: string | null; // e.g. "LEGENDARY", or null for the common ones
  description: string;
  tip: string;
  condition: MedalCondition | null;
}

export interface TrainerPokemon {
  species: string;
  level: number;
  form: number;
  moves: string[];
  // index into the species' Abilities+HiddenAbilities list (PBS AbilityIndex) - resolved to
  // a display name at render time, since it depends on the species' ability list.
  abilityIndex: number | null;
  item: string | null;
  gender: string | null;
  shiny: boolean;
  shadow: boolean;
  nature: string | null;
}

/** A map location a trainer or item is tied to, resolved from the map-event dump. */
export interface MapLocationRef {
  mapId: string;
  locationName: string;
}

/** Same as MapLocationRef, plus how the item is obtained there. "shop" means the item is sold
 *  at a Poké Mart on that map (pbPokemonMart(...) in the event dump) - unlike the other
 *  sources, this isn't a single physical pickup, so exportItemList.ts's per-map count treats it
 *  as a standalone "available for purchase" flag rather than counting it. */
export interface ItemLocationRef extends MapLocationRef {
  source: "ground" | "hidden" | "gift" | "berry" | "special" | "shop";
}

export interface Trainer {
  id: string; // "TRAINERTYPE-Name-optionalId"
  trainerType: string;
  trainerTypeName: TranslatedText;
  name: string;
  loseText: string | null;
  party: TrainerPokemon[];
  /** filename in public/trainers/, or null if no matching sprite exists */
  sprite: string | null;
  // reverse index, filled in by buildData.ts from the map-event dump
  locations: MapLocationRef[];
}

export interface EncounterSlot {
  chance: number;
  species: string;
  minLevel: number;
  maxLevel: number;
}

export interface EncounterTable {
  method: string; // LandMorning, OldRod, ...
  slots: EncounterSlot[];
}

export interface EncounterLocation {
  mapId: string;
  locationName: string;
  tables: EncounterTable[];
}

export interface EncounterRef {
  mapId: string;
  locationName: string;
  method: string;
  minLevel: number;
  maxLevel: number;
}
