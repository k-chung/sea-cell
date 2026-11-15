// Turn flow: start of turn (income, new hand), program actions, rewards, and end of turn
// (rival moves, support drifts, injuries heal, win/lose checks).

import type { Ruleset } from '../content/types.ts';
import { dateLabel } from './calendar.ts';
import { dealCards } from './cards.ts';
import { likelihood } from './likelihood.ts';
import { getFavor, getMilestone, getPart, getPersonnel, personnelBonus } from './lookup.ts';
import { advanceRival } from './rival.ts';
import { shuffle } from './rng.ts';
import type { GameState, RewardChoice } from './state.ts';

// ---------------------------------------------------------------- start of turn

export function income(s: GameState, r: Ruleset): number {
  const b = r.balance;
  return Math.round(b.baseIncome + s.congress * b.incomePerCongress + personnelBonus(s, r, 'income'));
}

export function startNextTurn(s: GameState, r: Ruleset): void {
  s.turn += 1;
  s.budget += income(s, r);
  s.launchedThisTurn = false;
  s.flight = null;
  s.lastResult = null;
  s.report = [];
  s.rewardChoices = [];
  s.rewardSource = null;
  s.actions = r.balance.actionsPerTurn + s.actionsNextTurn;
  s.actionsNextTurn = 0;
  s.offer = [];
  dealCards(s, r, r.balance.offerSize);
  s.phase = 'plan';
}

// ---------------------------------------------------------------- end of turn

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Finish the turn: rival, drift, healing, win/lose. Then show the report. */
export function endTurn(s: GameState, r: Ruleset, lines: string[]): void {
  const b = r.balance;

  if (s.milestones[r.goalMilestone] !== undefined) {
    s.outcome = { won: true, reason: `You reached ${getMilestone(r, r.goalMilestone).name} first.` };
  } else {
    lines.push(...advanceRival(s, r));
  }

  if (!s.launchedThisTurn) {
    s.public += b.idlePublic;
    lines.push(`No launch this turn. Attention drifts (${b.idlePublic} public).`);
  }

  for (const a of s.crew) {
    if (a.status !== 'injured') continue;
    a.injuredTurns -= 1;
    if (a.injuredTurns <= 0) {
      a.status = 'ready';
      lines.push(`${a.name} is cleared to fly again.`);
    }
  }

  s.public = clamp(s.public);
  s.congress = clamp(s.congress);

  if (!s.outcome) s.outcome = checkLoss(s, r);
  if (s.outcome) lines.push(s.outcome.won ? `VICTORY. ${s.outcome.reason}` : `PROGRAM ENDED. ${s.outcome.reason}`);

  // Cards played this turn are already in the report; the turn's outcome follows them.
  s.report = [...s.report, ...lines];
  s.history.push(...s.report.map((l) => `${dateLabel(r, s.turn)}: ${l}`));
  s.phase = 'report';
}

function checkLoss(s: GameState, r: Ruleset): GameState['outcome'] {
  if (s.rival.milestones[r.goalMilestone] !== undefined) {
    return { won: false, reason: `The Soviets reached ${getMilestone(r, r.goalMilestone).name} first.` };
  }
  if (s.public <= 0) return { won: false, reason: 'Public support collapsed. The program is cancelled.' };
  if (s.congress <= 0) return { won: false, reason: 'Congress cut all funding.' };
  if (s.turn >= r.balance.turns - 1) {
    return { won: false, reason: 'The decade is over and the Moon is still out of reach.' };
  }
  return null;
}

/** After the report: game over, a reward, or the next turn. */
export function continueAfterReport(s: GameState, r: Ruleset): void {
  if (s.outcome) {
    s.phase = 'over';
    return;
  }
  if (s.rewardPending) {
    s.rewardPending = false;
    const choices = milestoneRewardChoices(s, r);
    if (choices.length) {
      s.rewardChoices = choices;
      s.rewardSource = 'milestone';
      s.phase = 'reward';
      return;
    }
  }
  startNextTurn(s, r);
}

// ---------------------------------------------------------------- rewards

/** Pick 1 of N after a first: try to offer one person, one part and one favor. */
export function milestoneRewardChoices(s: GameState, r: Ruleset): RewardChoice[] {
  const people = shuffle(
    s.rng,
    r.content.personnel.filter((p) => !s.personnel.includes(p.id)),
  ).map((p) => ({ kind: 'personnel' as const, id: p.id }));
  const parts = shuffle(
    s.rng,
    r.content.parts.filter((p) => !s.unlockedParts.includes(p.id)),
  ).map((p) => ({ kind: 'part' as const, id: p.id }));
  const favors = shuffle(
    s.rng,
    r.content.favors.filter((f) => f.instant || !s.favors.includes(f.id)),
  ).map((f) => ({ kind: 'favor' as const, id: f.id }));

  const choices: RewardChoice[] = [];
  for (const pool of [people, parts, favors]) {
    const first = pool.shift();
    if (first) choices.push(first);
  }
  const leftovers = [...people, ...parts, ...favors];
  while (choices.length < r.balance.rewardChoices && leftovers.length) {
    choices.push(leftovers.shift() as RewardChoice);
  }
  return choices.slice(0, r.balance.rewardChoices);
}

export function rewardLabel(r: Ruleset, c: RewardChoice): { title: string; detail: string } {
  if (c.kind === 'personnel') {
    const p = getPersonnel(r, c.id);
    return { title: `${p.name}, ${p.title}`, detail: p.description };
  }
  if (c.kind === 'part') {
    const p = getPart(r, c.id);
    const seats = p.crewSeats ? `, ${p.crewSeats} seats` : '';
    const lift = p.slot === 'payload' ? `${p.payloadKind ?? 'payload'}` : `Lift ${p.lift}`;
    return {
      title: `New part: ${p.name} (${p.slot})`,
      detail: `${lift}, ${likelihood(p.reliability).toLowerCase()} to work, cost ${p.cost}, ${p.fuel}${seats}. ${p.description}`,
    };
  }
  const f = getFavor(r, c.id);
  return { title: f.name, detail: f.description };
}

/** index -1 = skip. */
export function chooseReward(s: GameState, r: Ruleset, index: number): void {
  const lines: string[] = [];
  if (index >= 0) {
    const choice = s.rewardChoices[index];
    if (!choice) throw new Error(`No reward at index ${index}`);
    applyReward(s, r, choice);
    lines.push(`Gained: ${rewardLabel(r, choice).title}.`);
  } else {
    lines.push('You passed on the reward.');
  }
  s.rewardChoices = [];
  s.rewardSource = null;

  startNextTurn(s, r);
}

function applyReward(s: GameState, r: Ruleset, c: RewardChoice): void {
  if (c.kind === 'personnel') s.personnel.push(c.id);
  if (c.kind === 'part') s.unlockedParts.push(c.id);
  if (c.kind === 'favor') {
    const f = getFavor(r, c.id);
    if (f.instant) {
      s.budget += f.instant.budget ?? 0;
      s.public = clamp(s.public + (f.instant.public ?? 0));
      s.congress = clamp(s.congress + (f.instant.congress ?? 0));
    } else {
      s.favors.push(c.id);
    }
  }
}
