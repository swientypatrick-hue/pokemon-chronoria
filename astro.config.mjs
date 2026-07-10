// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves a project repo under /<repo-name>/. The deploy workflow sets
// BASE_PATH to that automatically (see .github/workflows/deploy.yml); locally it defaults
// to "/" so `npm run dev` / `npm run preview` work at the domain root as usual.
const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  base,
});
