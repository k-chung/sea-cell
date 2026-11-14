// Rulesets: a named bundle of content + balance numbers.
// To prototype a variant, add a ruleset here (e.g. different parts, fewer events, a faster rival).

import type { Ruleset } from './types.ts';
import { balance } from './balance.ts';
import { parts } from './parts.ts';
import { milestones, missions } from './missions.ts';
import { traits, astronautNames } from './crew.ts';
import { events } from './events.ts';
import { personnel, favors } from './people.ts';

export const cellRuleset: Ruleset = {
  id: 'cell',
  name: 'v0.1 "cell": the Moon race',
  goalMilestone: 'moonLanding',
  content: { parts, milestones, missions, traits, events, personnel, favors, astronautNames },
  balance,
};

export const rulesets: Record<string, Ruleset> = {
  cell: cellRuleset,
};
