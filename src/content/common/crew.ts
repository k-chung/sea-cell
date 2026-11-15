// Astronaut traits and the name pool for generated astronauts.
// A trait boosts crisis options tagged with its skill, and can unlock blue options.

import type { TraitDef } from '../types.ts';

export const traits: TraitDef[] = [
  {
    id: 'testPilot', name: 'Test pilot', skill: 'piloting', skillBonus: 15,
    ability: { name: 'Hand-fly it', bonus: 20, phases: ['launch', 'rendezvous', 'landing'] },
    description: 'Better at piloting options. Unlocks manual-control options.',
  },
  {
    id: 'engineer', name: 'Engineer', skill: 'repair', skillBonus: 15,
    ability: { name: 'Fix it in flight', bonus: 15, phases: 'any' },
    description: 'Better at repair options. Unlocks improvised fixes.',
  },
  {
    id: 'iceWater', name: 'Ice water', skill: 'nerve', skillBonus: 15,
    ability: { name: 'Steady nerves', bonus: 20, phases: ['eva', 'transfer', 'reentry'] },
    description: 'Better at nerve options. Stays calm when it matters.',
  },
  {
    id: 'mediaDarling', name: 'Media darling', skill: 'charm', skillBonus: 15, successPublic: 3,
    description: 'Better at charm options. +3 public support when a flight succeeds.',
  },
  {
    id: 'lucky', name: 'Lucky', skill: 'nerve', skillBonus: 0, allOddsBonus: 5,
    ability: { name: 'Lucky break', bonus: 25, phases: 'any' },
    description: 'A little better at every crisis option.',
  },
];

export const astronautNames: string[] = [
  'Al Brennan', 'Gus Harlow', 'Deke Mercer', 'Wally Sheehan', 'Scott Kinder', 'Gordo Pryce',
  'Jerrie Cobbett', 'Ed Whitlock', 'Pete Conway', 'Jim Lovett', 'Neil Strand', 'Buzz Aldane',
  'Mike Collier', 'Frank Borden', 'John Younger', 'Dave Scotland', 'Molly Faust', 'Rhea Sedgwick',
  'Ellen Tatum', 'Vic Patsayev', 'Rusty Schwab', 'Tom Stafferton', 'Jack Swigart', 'Dee Hart',
];
