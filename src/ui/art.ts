// Turns text pixel maps (src/content/sprites.ts) into small SVG images.
// Colors come from CSS variables, so the CRT theme controls every sprite.

import {
  boosterSprites,
  faceSprite,
  flameSprite,
  hairStyles,
  payloadSprites,
  rivalSprite,
  upperSprites,
} from '../content/art/pixel-sprites.ts';
import type { PartDef } from '../content/types.ts';

const COLORS: Record<string, string> = {
  d: 'var(--px-dark)',
  m: 'var(--px-mid)',
  b: 'var(--px-bright)',
  w: 'var(--px-white)',
  a: 'var(--px-amber)',
  r: 'var(--px-red)',
};

/** One SVG for a pixel map. `scale` = screen pixels per sprite pixel. */
export function sprite(rows: string[], scale: number, label: string, cls = ''): string {
  const width = rows[0]?.length ?? 0;
  const rects: string[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = COLORS[row[x] ?? '.'];
      if (color) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
    }
  });
  const role = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="sprite ${cls}" ${role} viewBox="0 0 ${width} ${rows.length}" width="${width * scale}" height="${rows.length * scale}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

/** A rocket stacked from the chosen parts: payload on top, then upper stage, then booster. */
export function rocketRows(
  booster: PartDef | null,
  upper: PartDef | null,
  payload: PartDef | null,
  flame: boolean,
): string[] {
  const rows: string[] = [];
  if (payload?.payloadKind) rows.push(...payloadSprites[payload.payloadKind]);
  if (upper) rows.push(...(upper.fuel === 'hydrolox' ? upperSprites.hydrogen : upperSprites.standard));
  if (booster) {
    const size = booster.lift <= 2 ? 'small' : booster.lift <= 5 ? 'medium' : booster.lift <= 9 ? 'large' : 'huge';
    rows.push(...boosterSprites[size]);
  }
  if (flame && rows.length) rows.push(...flameSprite);
  return rows;
}

/** A small number from an id, so each astronaut always gets the same look. */
function hash(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** An astronaut's portrait: hair style, skin and hair shade vary by astronaut; KIA crew are dimmed. */
export function face(id: string, name: string, scale: number, dead = false): string {
  const h = hash(id);
  const hair = hairStyles[h % hairStyles.length] ?? 'HHHHHH';
  const skin = ['b', 'm', 'w'][(h >> 3) % 3] ?? 'b';
  const hairColor = ['d', 'a', 'm'][(h >> 5) % 3] ?? 'd';
  const rows = faceSprite.map((row, i) => {
    const withHair = i === 2 ? row.slice(0, 3) + hair + row.slice(9) : row;
    return withHair
      .replaceAll('S', skin)
      .replaceAll('H', hairColor)
      .replaceAll('k', 'd')
      .replaceAll('o', 'd')
      .replaceAll('u', dead ? 'd' : 'm');
  });
  return sprite(rows, scale, name, dead ? 'dead' : '');
}

export const rivalIcon = (scale: number) => sprite(rivalSprite, scale, 'Soviet program');

/** The big rocket on the title screen. */
export const titleRocket = (scale: number) =>
  sprite(
    [...payloadSprites.lunarCapsule, ...upperSprites.hydrogen, ...boosterSprites.large, ...flameSprite],
    scale,
    'Moon rocket lifting off',
  );
