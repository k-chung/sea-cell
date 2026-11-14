// Bundle the built game (dist/) into ONE self-contained HTML file: dist-single/sea-cell.html.
// Used to share a playable copy as a hosted page (no install needed). Run after `npm run build`:
//   npm run build:single

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
if (js.includes('</script')) throw new Error('Bundled JS contains "</script"; cannot inline safely');

// The page host adds its own doctype/html/head/body, so the file holds just the page content.
const html = `<title>Sea Cell</title>
<meta name="claude:viewport-fit-sides" content="cover">
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
