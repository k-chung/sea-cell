// Vite settings. `base: './'` makes the built game work from any folder or host.
// Two pages: the game (index.html) and the dev-only scene gallery (gallery.html).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Version shown in the game, e.g. "v0.5 · 3f2a9c1", so a playtest build can be matched to what Claude said.
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();
const version = `v${pkg.version.replace(/\.0$/, '')} · ${commit}`;

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  // SINGLE=1 (used by `npm run build:single`) builds only the game, as one script, for the hosted copy.
  build: process.env.SINGLE
    ? { outDir: 'dist-single/build', emptyOutDir: true }
    : { rollupOptions: { input: { main: 'index.html', gallery: 'gallery.html' } } },
});
