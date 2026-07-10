// GitHub Pages serves project sites under a /<repo-name>/ subpath. Astro's `base` config
// (set from the BASE_PATH env var in the deploy workflow) carries that prefix; every internal
// link needs to go through this helper instead of a hardcoded root-relative string, or
// navigation breaks as soon as the site isn't served from the domain root.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function href(path: string): string {
  return BASE + path;
}
