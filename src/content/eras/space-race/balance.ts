// Every tunable number in the game, in one place.
// Change a number, reload, play. The dev panel (press `) can also override these live.
// Odds and reliability are percentages (0-100). Support (public, congress) runs 0-100.

import type { Balance } from '../../types.ts';

export const balance: Balance = {
  // --- Calendar ---
  startYear: 1958,
  turns: 24, // 6-month turns: Spring 1958 to Fall 1969

  // --- Starting position ---
  startBudget: 60,
  startPublic: 55,
  startCongress: 55,
  startCrew: 6,

  // --- Money ---
  baseIncome: 12,
  incomePerCongress: 0.4, // income = baseIncome + congress x this

  // --- Rockets ---
  actionsPerTurn: 3, // action points to spend on cards each turn
  offerSize: 5, // cards dealt into the offer each turn
  partCardActions: 1, // acquiring a part card costs this many action points...
  partCostMultiplier: 4, // ...and its flight cost x this in budget
  staffHireCost: 25,
  reliabilityPerFlight: 3, // each successful flight of a part makes it more reliable...
  maxFlightBonus: 12, // ...up to this much
  reliabilityCap: 97,
  sameFuelBonus: 5, // synergy: booster and upper stage share a fuel
  liftMarginForBonus: 2, // synergy: this much spare lift...
  liftMarginBonus: 5, // ...makes the launch this much more reliable
  testFlightCost: 10,
  testFlightBonus: 8, // test flight: booster reliability bonus for this mission
  redundancyCost: 8, // redundancy: re-roll the first failed phase once

  // --- Crises ---
  minorCrisisPerPhase: 0.3, // chance of an anomaly in a phase that rolled fine
  marginBase: 1, // margin points per flight (+1 more with spare lift); each adds marginBoost% to one phase
  marginBoost: 10,
  veteranFlights: 2, // astronauts with this many flights are veterans...
  veteranBonus: 5, // ...and add this to crisis odds
  oddsFloor: 5,
  oddsCeiling: 95,

  // --- Support changes ---
  firstPublic: 10,
  firstCongress: 6,
  repeatPublic: 2,
  rivalFirstMultiplier: 0.5, // prestige and support if the rival got there first
  abortPublic: -4,
  lostPublic: -8,
  lostCongress: -6,
  disasterPublic: -15,
  disasterCongress: -12,
  injuryTurns: 4, // story mode: "lost" astronauts are injured this many turns instead
  idlePublic: -3, // turns with no launch

  // --- Rival ---
  rivalSpeed: 1.45, // effort per turn
  rivalVariance: 0.5, // +/- random effort per turn
  rivalShockPublic: -4, // when the rival gets a first
  rivalShockCongress: 4, // ...Congress panics and funds you more
  rivalIntelErrorChance: 0.25,

  // --- Recruiting (astronaut cards) ---
  recruitCost: 8,

  // --- Rewards ---
  rewardChoices: 3,
};
