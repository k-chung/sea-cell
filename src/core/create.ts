// Start a new run: check the content, build the starting state, recruit crew, deal the first hand.

import type { Ruleset } from '../content/types.ts';
import { recruitAstronaut } from './astronauts.ts';
import { createRng } from './rng.ts';
import { type GameOptions, type GameState, STATE_VERSION } from './state.ts';
import { drawHand } from './turn.ts';
import { validateContent } from './validateContent.ts';

export function createGame(r: Ruleset, seed: number, options: GameOptions): GameState {
  const errors = validateContent(r);
  if (errors.length) throw new Error(`Content errors:\n- ${errors.join('\n- ')}`);
  const b = r.balance;

  const s: GameState = {
    version: STATE_VERSION,
    rulesetId: r.id,
    seed,
    options,
    rng: createRng(seed),
    turn: 0,
    phase: 'plan',
    budget: b.startBudget,
    public: b.startPublic,
    congress: b.startCongress,
    prestige: 0,
    unlockedParts: r.content.parts.filter((p) => p.startsUnlocked).map((p) => p.id),
    partFlights: {},
    hand: [],
    crew: [],
    nextCrewNumber: 1,
    personnel: [],
    favors: [],
    milestones: {},
    rival: { effort: 0, milestones: {}, intelTarget: r.content.milestones[0]?.id ?? null, intelStage: 'early' },
    launchedThisTurn: false,
    flight: null,
    lastResult: null,
    report: [],
    rewardPending: false,
    rewardChoices: [],
    rewardSource: null,
    history: [],
    fallen: [],
    outcome: null,
    forcedEventId: null,
  };

  for (let i = 0; i < b.startCrew; i++) recruitAstronaut(s, r);
  drawHand(s, r);
  return s;
}
