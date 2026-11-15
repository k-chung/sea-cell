// THE ART LAYER. Screens ask for art by name (rocket, crew portrait, rival emblem) and never draw it
// themselves, so the art style can be swapped in one file. Current art: placeholder pixel sprites from
// src/content/art/pixel-sprites.ts, colored by CSS tokens (--px-*). Module 3 replaces this with the final style.

import type { PartDef } from '../content/types.ts';
import {
  boosterSprites,
  faceSprite,
  flameSprite,
  hairStyles,
  payloadSprites,
  rivalSprite,
  upperSprites,
} from '../content/art/pixel-sprites.ts';

const COLORS: Record<string, string> = {
  d: 'var(--px-dark)',
  m: 'var(--px-mid)',
  b: 'var(--px-bright)',
  w: 'var(--px-white)',
  a: 'var(--px-amber)',
  r: 'var(--px-red)',
};

/** Draw a text pixel map. `scale` = screen pixels per sprite pixel; empty label = decorative. */
function Sprite({ rows, scale, label, dim }: { rows: string[]; scale: number; label: string; dim?: boolean }) {
  const width = rows[0]?.length ?? 0;
  const rects = rows.flatMap((row, y) =>
    [...row].map((ch, x) => {
      const fill = COLORS[ch];
      return fill ? <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} /> : null;
    }),
  );
  return (
    <svg
      class={`sprite${dim ? ' dim' : ''}`}
      viewBox={`0 0 ${width} ${rows.length}`}
      width={width * scale}
      height={rows.length * scale}
      shape-rendering="crispEdges"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
    >
      {rects}
    </svg>
  );
}

/** A rocket stacked from the chosen parts: payload on top, then upper stage, then booster. */
export function Rocket(props: {
  booster: PartDef | null;
  upper: PartDef | null;
  payload: PartDef | null;
  flying?: boolean;
  scale?: number;
}) {
  const rows: string[] = [];
  if (props.payload?.payloadKind) rows.push(...payloadSprites[props.payload.payloadKind]);
  if (props.upper) rows.push(...(props.upper.fuel === 'hydrolox' ? upperSprites.hydrogen : upperSprites.standard));
  if (props.booster) {
    const lift = props.booster.lift;
    rows.push(...boosterSprites[lift <= 2 ? 'small' : lift <= 5 ? 'medium' : lift <= 9 ? 'large' : 'huge']);
  }
  if (!rows.length) return null;
  if (props.flying) rows.push(...flameSprite);
  return <Sprite rows={rows} scale={props.scale ?? 6} label="Your rocket" />;
}

/** A small number from an id, so each astronaut always looks the same. */
function hash(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** An astronaut's portrait. Hair and shading vary per astronaut; fallen crew are dimmed. */
export function CrewPortrait({ id, name, scale = 3, dead }: { id: string; name: string; scale?: number; dead?: boolean }) {
  const h = hash(id);
  const hair = hairStyles[h % hairStyles.length] ?? 'HHHHHH';
  const skin = ['b', 'm', 'w'][(h >> 3) % 3] ?? 'b';
  const hairColor = ['d', 'a', 'm'][(h >> 5) % 3] ?? 'd';
  const rows = faceSprite.map((row, i) =>
    (i === 2 ? row.slice(0, 3) + hair + row.slice(9) : row)
      .replaceAll('S', skin)
      .replaceAll('H', hairColor)
      .replaceAll('k', 'd')
      .replaceAll('o', 'd')
      .replaceAll('u', 'm'),
  );
  return <Sprite rows={rows} scale={scale} label={name} dim={dead} />;
}

export const RivalEmblem = ({ scale = 3 }: { scale?: number }) => (
  <Sprite rows={rivalSprite} scale={scale} label="Soviet program" />
);
