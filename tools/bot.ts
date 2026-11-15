// A simple AI player. Used by the balance bot (thousands of runs) and to record golden replays.
// It plays "reasonably": push for the next milestone with the most reliable rocket it can afford,
// pick crisis options by expected value, and patch up support when it gets low.
// It is NOT meant to play well; it's a yardstick for comparing balance changes.

import type { Ruleset } from '../src/content/types.ts';
import {
  type Action,
  type CardView,
  crisisOptions,
  type GameState,
  type LaunchPlan,
  lookup,
  missionStatus,
  offerViews,
  previewLaunch,
  testFlightCost,
} from '../src/core/index.ts';

const RESULT_SCORE = { success: 3, abort: 0.5, lost: -2, disaster: -6 } as const;

const PART_PRIORITY = [
  'odyssey-lander',
  'colossus-5',
  'odyssey',
  'surveyor',
  'colossus-1',
  'hydra-4',
  'centaurus',
  'nova',
  'thunderhead',
];
const PERSONNEL_PRIORITY = ['calloway', 'hale', 'brandt', 'lin', 'webber', 'pallino'];

export function botAction(s: GameState, r: Ruleset): Action {
  switch (s.phase) {
    case 'plan':
      return planAction(s, r);
    case 'crisis':
      return crisisAction(s, r);
    case 'reward':
      return rewardAction(s);
    case 'report':
      return { type: 'continue' };
    case 'over':
      throw new Error('Game is over');
  }
}

function planAction(s: GameState, r: Ruleset): Action {
  // 1. Play the most useful affordable card, if any is worth it.
  let bestIndex = -1;
  let bestScore = 0;
  offerViews(s, r).forEach((v, i) => {
    const score = cardScore(s, r, v);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  if (bestIndex >= 0) return { type: 'playCard', index: bestIndex };

  // 2. Launch toward the next milestone.
  for (const mission of r.content.missions.filter((m) => missionStatus(s, r, m).status === 'available')) {
    const plan = bestPlan(s, r, mission.id, 15);
    if (plan) return { type: 'launch', ...plan };
  }
  // 3. If rich, fly a reached mission again (avoids the idle penalty, builds reliability).
  if (s.budget > 70) {
    for (const mission of r.content.missions.filter((m) => missionStatus(s, r, m).status === 'done').reverse()) {
      const plan = bestPlan(s, r, mission.id, 40);
      if (plan) return { type: 'launch', ...plan };
    }
  }
  return { type: 'endTurn' };
}

/** How much the bot wants a card (0 = skip it). Keeps a budget reserve for launches. */
function cardScore(s: GameState, r: Ruleset, v: CardView): number {
  if (v.blockedReason) return 0;
  const affordable = s.budget - v.cost >= 20;
  switch (v.card.kind) {
    case 'part': {
      const i = PART_PRIORITY.indexOf(v.card.id);
      return i >= 0 && s.budget >= v.cost ? 20 - i : 0;
    }
    case 'staff':
      return affordable ? 6 : 0;
    case 'astronaut':
      return s.crew.filter((a) => a.status === 'ready').length < 3 && affordable ? 8 : 0;
    case 'program': {
      if (!affordable) return 0;
      const def = r.content.programCards.find((c) => c.id === v.card.id);
      let score = 0;
      for (const e of def?.effects ?? []) {
        if (e.kind === 'public' && s.public < 45) score += e.amount;
        if (e.kind === 'congress' && s.congress < 45) score += e.amount;
        if (e.kind === 'budget' && s.budget < 40) score += e.amount / 3;
        if (e.kind === 'nextLaunchBonus') score += e.amount / 2;
        if (e.kind === 'public' && e.amount < 0 && s.public < 30) score -= 10;
      }
      return score;
    }
  }
}

/** The most reliable affordable rocket from the current hand, keeping `reserve` budget if possible. */
function bestPlan(s: GameState, r: Ruleset, missionId: string, reserve: number): LaunchPlan | null {
  const mission = lookup.getMission(r, missionId);
  const hand = s.unlockedParts.map((id) => lookup.getPart(r, id));
  const crewIds = s.crew
    .filter((a) => a.status === 'ready')
    .sort((a, b) => b.flights - a.flights)
    .slice(0, mission.crewNeeded)
    .map((a) => a.id);

  let best: { plan: LaunchPlan; score: number } | null = null;
  for (const booster of hand.filter((p) => p.slot === 'booster')) {
    for (const upper of hand.filter((p) => p.slot === 'upper')) {
      for (const payload of hand.filter((p) => p.slot === 'payload')) {
        const base: LaunchPlan = {
          missionId,
          crewIds,
          testFlight: false,
          redundancy: false,
          rocket: { booster: booster.id, upper: upper.id, payload: payload.id },
        };
        const preview = previewLaunch(s, r, base);
        if (preview.problems.length) continue;
        const spare = s.budget - preview.cost;
        const plan = {
          ...base,
          testFlight: spare >= testFlightCost(s, r) + reserve,
          redundancy: spare >= testFlightCost(s, r) + r.balance.redundancyCost + reserve,
        };
        const final = previewLaunch(s, r, plan);
        const usable = final.problems.length ? base : plan;
        const odds = previewLaunch(s, r, usable).phases.reduce((p, x) => p * (x.reliability / 100), 1);
        if (!best || odds > best.score) best = { plan: usable, score: odds };
      }
    }
  }
  return best?.plan ?? null;
}

function crisisAction(s: GameState, r: Ruleset): Action {
  const crisis = s.flight?.crisis;
  if (!crisis) throw new Error('Bot: crisis phase without a crisis');
  const event = lookup.getEvent(r, crisis.eventId);
  let bestIndex = -1;
  let bestValue = -Infinity;
  for (const view of crisisOptions(s, r, event)) {
    const option = event.options[view.index];
    if (!option) continue;
    const fail = option.onFailure ?? option.onSuccess;
    const p = view.odds / 100;
    const value = p * RESULT_SCORE[option.onSuccess.result] + (1 - p) * RESULT_SCORE[fail.result];
    if (value > bestValue) {
      bestValue = value;
      bestIndex = view.index;
    }
  }
  return { type: 'chooseOption', index: bestIndex };
}

function rewardAction(s: GameState): Action {
  const rank = (c: GameState['rewardChoices'][number]) => {
    if (c.kind === 'personnel') return PERSONNEL_PRIORITY.indexOf(c.id);
    if (c.kind === 'part') {
      const i = PART_PRIORITY.indexOf(c.id);
      return i < 0 ? 50 : i + 2;
    }
    return c.id === 'windfall' ? 5 : 60;
  };
  let best = 0;
  s.rewardChoices.forEach((c, i) => {
    const current = s.rewardChoices[best];
    if (current && rank(c) < rank(current)) best = i;
  });
  return { type: 'chooseReward', index: s.rewardChoices.length ? best : -1 };
}
