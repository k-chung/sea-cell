// The rival program. It works through the milestone list in order, building "effort" each turn.
// You only see fuzzy intelligence about what it's working on; its firsts are always announced.

import type { Ruleset } from '../content/types.ts';
import { type RngState, random, rollPercent } from './rng.ts';
import type { GameState } from './state.ts';

function nextRivalMilestone(s: GameState, r: Ruleset) {
  return r.content.milestones.find((m) => s.rival.milestones[m.id] === undefined) ?? null;
}

/** Advance the rival one turn. Changes the state; returns report lines. */
export function advanceRival(s: GameState, r: Ruleset): string[] {
  const b = r.balance;
  const lines: string[] = [];
  const gain = b.rivalSpeed + (random(s.rng) * 2 - 1) * b.rivalVariance;
  s.rival.effort += Math.max(0, gain);

  let next = nextRivalMilestone(s, r);
  while (next && s.rival.effort >= next.rivalEffort) {
    s.rival.effort -= next.rivalEffort;
    s.rival.milestones[next.id] = s.turn;
    if (s.milestones[next.id] === undefined) {
      s.public += b.rivalShockPublic;
      s.congress += b.rivalShockCongress;
      lines.push(
        `SOVIET FIRST: ${next.name}. The public is shaken (${b.rivalShockPublic} public); Congress opens its wallet (+${b.rivalShockCongress} Congress).`,
      );
    } else {
      lines.push(`The Soviets have matched you: ${next.name}.`);
    }
    next = nextRivalMilestone(s, r);
  }
  updateIntel(s, r, s.rng);
  return lines;
}

/** Fuzzy estimate of the rival's next goal and progress. Sometimes wrong. */
function updateIntel(s: GameState, r: Ruleset, rng: RngState): void {
  const next = nextRivalMilestone(s, r);
  if (!next) {
    s.rival.intelTarget = null;
    s.rival.intelStage = null;
    return;
  }
  const stages = ['early', 'midway', 'close'] as const;
  const fraction = s.rival.effort / next.rivalEffort;
  let stageIndex = fraction < 0.34 ? 0 : fraction < 0.67 ? 1 : 2;
  let target = next.id;
  if (rollPercent(rng, r.balance.rivalIntelErrorChance * 100)) {
    // Bad intel: off by one stage, or names the wrong milestone.
    if (random(rng) < 0.5) {
      stageIndex = Math.max(0, Math.min(2, stageIndex + (random(rng) < 0.5 ? -1 : 1)));
    } else {
      const list = r.content.milestones;
      const i = list.findIndex((m) => m.id === next.id);
      target = (list[i + 1] ?? list[i - 1] ?? next).id;
    }
  }
  s.rival.intelTarget = target;
  s.rival.intelStage = stages[stageIndex] ?? 'early';
}
