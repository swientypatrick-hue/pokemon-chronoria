// Small abstract 14x14 glyphs for each type, used inline inside TypeBadge - fill="currentColor"
// so they inherit the badge's white icon color. Kept intentionally simple (1-2 paths each) to
// stay legible at 12px and to keep the inline SVG markup compact.
const TYPE_ICONS: Record<string, string> = {
  NORMAL: '<circle cx="7" cy="7" r="4" fill="currentColor"/>',
  FIGHTING:
    '<path d="M4 5.5a1.5 1.5 0 0 1 3 0v-.3a1.3 1.3 0 0 1 2.6 0v.3a1.3 1.3 0 0 1 2.6 0v2.2a3.3 3.3 0 0 1-3.3 3.3H7a3 3 0 0 1-3-3V5.5Z" fill="currentColor"/>',
  FLYING:
    '<path d="M1.5 10c2-5.5 6-8.5 11-8-1.5 1.8-2.2 3.4-2 5 2 .2 3-.2 3.5-1-1.8 3.4-5 5-8.5 5-1.5 0-3-.4-4-1Z" fill="currentColor"/>',
  POISON:
    '<path d="M6 2S2.8 5.8 2.8 8a3.2 3.2 0 0 0 6.4 0C9.2 5.8 6 2 6 2Z" fill="currentColor"/><circle cx="11" cy="4" r="1.6" fill="currentColor"/>',
  GROUND:
    '<path d="M1 10.5C2.5 6 5 4 7 4s4.5 2 6 6.5H1Z" fill="currentColor"/><path d="M6 6.5 7.3 8.3 6.2 10" stroke="currentColor" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.5"/>',
  ROCK: '<path d="M2 8.5 4 3.5l4-1.5 4 2v4.5l-3 3.5H5L2 8.5Z" fill="currentColor"/>',
  BUG: '<ellipse cx="7" cy="8" rx="3.2" ry="4" fill="currentColor"/><path d="M5 4 3.5 2M9 4l1.5-2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
  GHOST:
    '<path d="M7 2A4 4 0 0 0 3 6v5.5l1.2-1.2L5.5 11.5l1.5-1.2 1.5 1.2 1.3-1.2L11 11.5V6A4 4 0 0 0 7 2Z" fill="currentColor"/>',
  STEEL: '<path d="M7 1.5 12 5l-1.5 6.5H3.5L2 5 7 1.5Z" fill="currentColor"/>',
  FIRE: '<path d="M7 1c1 2-2 3-2 5.2A2 2 0 0 0 7 8.2 1.6 1.6 0 0 0 8.6 6.6C10 8 10.5 9.4 10.5 10.6A3.5 3.5 0 0 1 7 14a3.5 3.5 0 0 1-3.5-3.5C3.5 7 6 5.5 7 1Z" fill="currentColor"/>',
  WATER:
    '<path d="M7 1.2S2.5 6.7 2.5 9.6a4.5 4.5 0 0 0 9 0C11.5 6.7 7 1.2 7 1.2Z" fill="currentColor"/>',
  GRASS:
    '<path d="M12.5 1.5C6 1.5 1.5 6 1.5 12.5 8 12.5 12.5 8 12.5 1.5Z" fill="currentColor"/><path d="M2 12.5 11 3.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.55"/>',
  ELECTRIC: '<path d="M8 1 2.5 8.2h3.3L5 13l6-7.6H7.6L8 1Z" fill="currentColor"/>',
  PSYCHIC:
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M1 7c1.8-3 4-4.5 6-4.5S11.2 4 13 7c-1.8 3-4 4.5-6 4.5S2.8 10 1 7Zm6 1.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" fill="currentColor"/>',
  ICE: '<g stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M7 1.5v11M2.2 4.25l9.6 5.5M2.2 9.75l9.6-5.5"/></g>',
  DRAGON:
    '<path d="M1.5 8c2-4 5-6.5 8-6.5-1 2-1 3.5 0 5-2.5.5-4 .5-8 1.5Z" fill="currentColor"/><path d="M1.5 8c2 3 5 4.5 8 4.5-1-1.6-1-3.1 0-4.6-2.5-.4-4-.4-8 .1Z" fill="currentColor" opacity="0.7"/>',
  DARK: '<path d="M9.5 1.8A5.8 5.8 0 1 0 9.5 12.2 6.8 6.8 0 0 1 9.5 1.8Z" fill="currentColor"/>',
  FAIRY:
    '<path d="M7 0.5c.3 2.6 1 3.3 3.6 3.6C7.9 4.4 7.3 5.1 7 7.7 6.7 5.1 6 4.4 3.4 4.1 6 3.8 6.7 3.1 7 0.5Z" fill="currentColor"/><path d="M11.8 7.2c.16 1.3.5 1.7 1.85 1.85-1.35.15-1.7.5-1.85 1.85-.16-1.35-.5-1.7-1.85-1.85 1.35-.15 1.7-.5 1.85-1.85Z" fill="currentColor"/>',
};

const FALLBACK_ICON = '<circle cx="7" cy="7" r="3.5" fill="currentColor"/>';

export function typeIcon(type: string): string {
  return TYPE_ICONS[type] ?? FALLBACK_ICON;
}
