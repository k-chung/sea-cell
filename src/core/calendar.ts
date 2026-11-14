// Turn number -> date label. Two turns per year: Spring and Fall.

import type { Ruleset } from '../content/types.ts';

export function dateLabel(r: Ruleset, turn: number): string {
  const year = r.balance.startYear + Math.floor(turn / 2);
  return `${turn % 2 === 0 ? 'Spring' : 'Fall'} ${year}`;
}
