// Rocket part cards. Edit freely: names, numbers and which parts start unlocked.
// lift: boosters + upper stages add up; a mission needs at least its liftNeeded.
// reliability: chance (0-100) the phases this part handles go smoothly.

import type { PartDef } from '../../types.ts';

export const parts: PartDef[] = [
  // --- Boosters (handle the launch phase) ---
  {
    id: 'javelin', name: 'Javelin', slot: 'booster', fuel: 'kerolox',
    lift: 2, reliability: 86, cost: 8, startsUnlocked: true,
    description: 'Small, proven missile booster.',
  },
  {
    id: 'titanus', name: 'Titanus', slot: 'booster', fuel: 'hypergolic',
    lift: 4, reliability: 82, cost: 16, startsUnlocked: true,
    description: 'Converted ICBM. Storable, toxic propellants.',
  },
  {
    id: 'thunderhead', name: 'Thunderhead', slot: 'booster', fuel: 'solid',
    lift: 5, reliability: 80, cost: 14, startsUnlocked: false,
    description: 'Cheap solid motor. Cannot be throttled.',
  },
  {
    id: 'colossus-1', name: 'Colossus I', slot: 'booster', fuel: 'kerolox',
    lift: 6, reliability: 78, cost: 26, startsUnlocked: false,
    description: 'Clustered engines: lots of lift, lots to go wrong.',
  },
  {
    id: 'colossus-5', name: 'Colossus V', slot: 'booster', fuel: 'kerolox',
    lift: 9, reliability: 76, cost: 42, startsUnlocked: false,
    description: 'The Moon rocket. Five huge engines.',
  },
  {
    id: 'nova', name: 'Nova', slot: 'booster', fuel: 'kerolox',
    lift: 12, reliability: 68, cost: 65, startsUnlocked: false,
    description: 'Enormous. Enables a direct flight to the Moon.',
  },

  // --- Upper stages (handle orbit, rendezvous and transfer phases) ---
  {
    id: 'agile', name: 'Agile Kick Stage', slot: 'upper', fuel: 'hypergolic',
    lift: 1, reliability: 90, cost: 4, startsUnlocked: true,
    description: 'Tiny, restartable, dependable.',
  },
  {
    id: 'vanguard-2', name: 'Vanguard II', slot: 'upper', fuel: 'kerolox',
    lift: 2, reliability: 86, cost: 8, startsUnlocked: true,
    description: 'Solid workhorse second stage.',
  },
  {
    id: 'centaurus', name: 'Centaurus', slot: 'upper', fuel: 'hydrolox',
    lift: 3, reliability: 76, cost: 14, startsUnlocked: false,
    description: 'Liquid hydrogen: efficient but finicky.',
  },
  {
    id: 'hydra-4', name: 'Hydra IV', slot: 'upper', fuel: 'hydrolox',
    lift: 4, reliability: 76, cost: 22, startsUnlocked: false,
    description: 'Big hydrogen stage for lunar flights.',
  },

  // --- Payloads (handle eva, landing and reentry phases) ---
  {
    id: 'beacon', name: 'Beacon Satellite', slot: 'payload', fuel: 'none',
    lift: 0, reliability: 92, cost: 3, payloadKind: 'satellite', startsUnlocked: true,
    description: 'A radio in a sphere. It beeps.',
  },
  {
    id: 'surveyor', name: 'Lunar Surveyor', slot: 'payload', fuel: 'none',
    lift: 0, reliability: 84, cost: 8, payloadKind: 'lunarProbe', startsUnlocked: false,
    description: 'Robotic lander to scout the Moon.',
  },
  {
    id: 'pilgrim', name: 'Pilgrim Capsule', slot: 'payload', fuel: 'none',
    lift: 0, reliability: 88, cost: 8, payloadKind: 'capsule', crewSeats: 1, startsUnlocked: true,
    description: 'One seat. Barely bigger than the astronaut.',
  },
  {
    id: 'tandem', name: 'Tandem Capsule', slot: 'payload', fuel: 'hypergolic',
    lift: 0, reliability: 85, cost: 14, payloadKind: 'capsule', crewSeats: 2, startsUnlocked: true,
    description: 'Two seats, a hatch you can open, thrusters to maneuver.',
  },
  {
    id: 'odyssey', name: 'Odyssey Command Ship', slot: 'payload', fuel: 'hypergolic',
    lift: 0, reliability: 82, cost: 24, payloadKind: 'lunarCapsule', crewSeats: 3, startsUnlocked: false,
    description: 'Three seats, built to go to the Moon and back.',
  },
  {
    id: 'odyssey-lander', name: 'Odyssey + Lunar Lander', slot: 'payload', fuel: 'hypergolic',
    lift: 0, reliability: 76, cost: 36, payloadKind: 'lunarLander', crewSeats: 3, startsUnlocked: false,
    description: 'Command ship plus a spidery lander.',
  },
];
