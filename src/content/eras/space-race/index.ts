// The Space Race era (1957-1969) as one content pack. A new era = a new folder shaped like this one.

import { astronautNames, traits } from '../../common/crew.ts';
import type { Content, EraDef } from '../../types.ts';
import { balance } from './balance.ts';
import { events } from './events.ts';
import { milestones, missions } from './missions.ts';
import { parts } from './parts.ts';
import { favors, personnel } from './people.ts';

export const era: EraDef = {
  id: 'space-race',
  name: 'The Space Race',
  startYear: 1957,
  endYear: 1969,
  description: 'Beat the Soviets to the Moon before Congress and the public lose faith.',
};

export const content: Content = { parts, milestones, missions, traits, events, personnel, favors, astronautNames };
export { balance };
