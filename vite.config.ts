// Vite settings. `base: './'` makes the built game work from any folder or host.
// Two pages: the game (index.html) and the dev-only scene gallery (gallery.html).
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // SINGLE=1 (used by `npm run build:single`) builds only the game, as one script, for the hosted copy.
  build: process.env.SINGLE
    ? { outDir: 'dist-single/build', emptyOutDir: true }
    : { rollupOptions: { input: { main: 'index.html', gallery: 'gallery.html' } } },
});
