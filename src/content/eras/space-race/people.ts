// Key personnel (passive bonuses) and political favors, offered as rewards.
// Names are lightly fictionalized.

import type { FavorDef, PersonnelDef } from '../../types.ts';

export const personnel: PersonnelDef[] = [
  {
    id: 'brandt', name: 'Dr. Wernher Brandt', title: 'Chief rocket designer',
    boosterReliability: 5,
    description: 'Every booster is more reliable.',
  },
  {
    id: 'hale', name: 'Dr. Margaret Hale', title: 'Guidance lead',
    upperReliability: 4,
    description: 'Upper stages are more reliable. Unlocks guidance options in a crisis.',
  },
  {
    id: 'calloway', name: 'Ed Calloway', title: 'Flight director',
    crisisOdds: 8,
    description: 'Better odds on every crisis option. Unlocks "work the problem" options.',
  },
  {
    id: 'webber', name: 'James Webber', title: 'Agency administrator',
    income: 10,
    description: '+10 budget every turn.',
  },
  {
    id: 'pallino', name: 'Rocco Pallino', title: 'Launch operations chief',
    testFlightCostMultiplier: 0.5,
    description: 'Test flights cost half.',
  },
  {
    id: 'lin', name: 'Dr. Chen Lin', title: 'Spacecraft systems lead',
    payloadReliability: 5,
    description: 'Every payload is more reliable.',
  },
];

export const favors: FavorDef[] = [
  {
    id: 'airForce', name: 'Air Force favor',
    description: 'Held until used. Unlocks military help in a crisis.',
  },
  {
    id: 'windfall', name: 'Budget windfall',
    instant: { budget: 40 },
    description: '+40 budget now.',
  },
  {
    id: 'senator', name: "Senator's backing",
    instant: { congress: 12 },
    description: '+12 Congress support now.',
  },
];
