// Rulesets: an era's content + balance numbers, plus the goal. Prototype variants are extra rulesets
// here (e.g. a faster rival), not forks of the code.

import * as spaceRace from './eras/space-race/index.ts';
import type { Ruleset } from './types.ts';

export const spaceRaceRuleset: Ruleset = {
  id: 'space-race',
  name: 'The Space Race (1957-1969)',
  era: spaceRace.era,
  goalMilestone: 'moonLanding',
  content: spaceRace.content,
  balance: spaceRace.balance,
};

export const rulesets: Record<string, Ruleset> = { [spaceRaceRuleset.id]: spaceRaceRuleset };
