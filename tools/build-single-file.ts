// Bundle the built game (dist-single/build/) into ONE self-contained HTML file: dist-single/sea-cell.html.
// Used to share a playable copy as a hosted page (no install needed). Run via:
//   npm run build:single

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Only the files the game page uses (not the dev-only gallery).
const index = readFileSync('dist-single/build/index.html', 'utf8');
const used = (re: RegExp) =>
  [...index.matchAll(re)].map((m) => readFileSync(`dist-single/build/${m[1]}`, 'utf8')).join('\n');
const css = used(/href="\.\/(assets\/[^"]+\.css)"/g);
const js = used(/src="\.\/(assets\/[^"]+\.js)"/g);
if (js.includes('</script')) throw new Error('Bundled JS contains "</script"; cannot inline safely');

// The page host adds its own doctype/html/head/body, so the file holds just the page content.
const html = `<title>Sea Cell</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
<style>
${css}
</style>
<div id="app"></div>
<div id="dev"></div>
<script type="module">
${js}
</script>
`;
mkdirSync('dist-single', { recursive: true });
writeFileSync('dist-single/sea-cell.html', html);
console.log(`Wrote dist-single/sea-cell.html (${Math.round(html.length / 1024)} KB)`);
