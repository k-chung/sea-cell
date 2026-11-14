// Milestones (the race track) and missions (ways to reach them).
// The rival works through milestones in the order listed here.
// Phases: launch -> booster, orbit/rendezvous/transfer -> upper stage, eva/landing/reentry -> payload.

import type { MilestoneDef, MissionDef } from './types.ts';

export const milestones: MilestoneDef[] = [
  { id: 'satellite', name: 'First satellite', rivalEffort: 1.5 },
  { id: 'crewedOrbit', name: 'First human in orbit', rivalEffort: 4 },
  { id: 'spacewalk', name: 'First spacewalk', rivalEffort: 3 },
  { id: 'docking', name: 'First docking', rivalEffort: 3.5 },
  { id: 'lunarProbe', name: 'First lunar soft landing (robotic)', rivalEffort: 2.5 },
  { id: 'lunarFlyby', name: 'First crewed lunar flyby', rivalEffort: 5 },
  { id: 'moonLanding', name: 'First human on the Moon', rivalEffort: 6 },
];

export const missions: MissionDef[] = [
  {
    id: 'satellite', name: 'Orbital Satellite', milestone: 'satellite', requires: [],
    liftNeeded: 2, payloadKinds: ['satellite'], crewNeeded: 0,
    phases: ['launch', 'orbit'], prestige: 5,
    description: 'Put anything in orbit. The world will hear it beep.',
  },
  {
    id: 'crewedOrbit', name: 'Crewed Orbit', milestone: 'crewedOrbit', requires: ['satellite'],
    liftNeeded: 4, payloadKinds: ['capsule', 'lunarCapsule'], crewNeeded: 1,
    phases: ['launch', 'orbit', 'reentry'], prestige: 10,
    description: 'One astronaut, a few orbits, a safe splashdown.',
  },
  {
    id: 'spacewalk', name: 'Spacewalk', milestone: 'spacewalk', requires: ['crewedOrbit'],
    liftNeeded: 5, payloadKinds: ['capsule', 'lunarCapsule'], crewNeeded: 2,
    phases: ['launch', 'orbit', 'eva', 'reentry'], prestige: 8,
    description: 'Open the hatch and step outside.',
  },
  {
    id: 'docking', name: 'Orbital Docking', milestone: 'docking', requires: ['crewedOrbit'],
    liftNeeded: 5, payloadKinds: ['capsule', 'lunarCapsule'], crewNeeded: 2,
    phases: ['launch', 'rendezvous', 'reentry'], prestige: 8,
    description: 'Find a target in orbit and connect to it. Needed for a lunar-orbit landing.',
  },
  {
    id: 'lunarProbe', name: 'Robotic Lunar Lander', milestone: 'lunarProbe', requires: ['satellite'],
    liftNeeded: 6, payloadKinds: ['lunarProbe'], crewNeeded: 0,
    phases: ['launch', 'transfer', 'landing'], prestige: 6,
    description: 'Prove the surface can hold a lander.',
  },
  {
    id: 'lunarFlyby', name: 'Crewed Lunar Flyby', milestone: 'lunarFlyby', requires: ['crewedOrbit'],
    liftNeeded: 9, payloadKinds: ['lunarCapsule', 'lunarLander'], crewNeeded: 3,
    phases: ['launch', 'transfer', 'reentry'], prestige: 15,
    description: 'Loop around the Moon and come home. Skips ahead of spacewalks and docking.',
  },
  {
    id: 'moonLandingLOR', name: 'Moon Landing (lunar-orbit route)', milestone: 'moonLanding',
    requires: ['lunarFlyby', 'docking', 'lunarProbe'],
    liftNeeded: 12, payloadKinds: ['lunarLander'], crewNeeded: 3,
    phases: ['launch', 'transfer', 'landing', 'rendezvous', 'reentry'], prestige: 30,
    description: 'Lander separates in lunar orbit, then docks again to come home.',
  },
  {
    id: 'moonLandingDirect', name: 'Moon Landing (direct ascent)', milestone: 'moonLanding',
    requires: ['lunarFlyby', 'lunarProbe'],
    liftNeeded: 15, payloadKinds: ['lunarLander'], crewNeeded: 3,
    phases: ['launch', 'transfer', 'landing', 'reentry'], prestige: 30,
    description: 'Land the whole ship and fly it straight home. No docking needed, but it takes a monster rocket.',
  },
];
