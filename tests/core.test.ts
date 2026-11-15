// Tests for the rules engine. Run: npm test

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { spaceRaceRuleset as r } from '../src/content/rulesets.ts';
import type { Effect } from '../src/content/types.ts';
import { applyEffect, offerViews } from '../src/core/cards.ts';
import {
  type Action,
  createGame,
  type GameState,
  previewLaunch,
  type RunRecord,
  replay,
  step,
  validateContent,
} from '../src/core/index.ts';
import { createRng, random } from '../src/core/rng.ts';
import { summarize } from '../tools/golden.ts';
import { playBotRun } from '../tools/play.ts';

const newGame = (seed = 1, storyMode = false) => createGame(r, seed, { storyMode });

describe('content', () => {
  it('has no errors', () => {
    expect(validateContent(r)).toEqual([]);
  });

  it('reports bad references with file and entry', () => {
    const broken = structuredClone(r);
    const first = broken.content.missions[0];
    if (first) first.milestone = 'nope';
    expect(validateContent(broken).join('\n')).toContain('missions.ts "satellite": milestone "nope" does not exist');
  });
});

describe('random numbers', () => {
  it('same seed gives the same sequence', () => {
    const a = createRng(42),
      b = createRng(42);
    expect([random(a), random(a), random(a)]).toEqual([random(b), random(b), random(b)]);
  });
});

describe('starting a run', () => {
  it('is deterministic for a seed', () => {
    expect(newGame(7)).toEqual(newGame(7));
  });

  it('starts with crew, a full offer, action points and the plan phase', () => {
    const s = newGame();
    expect(s.crew).toHaveLength(r.balance.startCrew);
    expect(s.offer).toHaveLength(r.balance.offerSize);
    expect(s.actions).toBe(r.balance.actionsPerTurn);
    expect(s.phase).toBe('plan');
  });
});

describe('step', () => {
  it('never changes the state it was given', () => {
    const s = newGame();
    const before = structuredClone(s);
    step(s, r, { type: 'endTurn' });
    expect(s).toEqual(before);
  });

  it('rejects actions in the wrong phase with a clear message', () => {
    expect(() => step(newGame(), r, { type: 'continue' })).toThrow('needs phase "report"');
  });

  it('ending the turn shows a report and the next turn pays income', () => {
    let s = newGame();
    s = step(s, r, { type: 'endTurn' });
    expect(s.phase).toBe('report');
    const budget = s.budget;
    s = step(s, r, { type: 'continue' });
    expect(s.turn).toBe(1);
    expect(s.budget).toBeGreaterThan(budget);
  });
});

describe('cards', () => {
  const program = (id: string): GameState => ({ ...newGame(), offer: [{ kind: 'program', id }], budget: 100 });

  it('every effect kind does what it says', () => {
    const s = { ...newGame(), offer: [], budget: 50, public: 50, congress: 50, prestige: 0 };
    const cases: [Effect, (x: GameState) => number, number][] = [
      [{ kind: 'budget', amount: 10 }, (x) => x.budget, 60],
      [{ kind: 'public', amount: 10 }, (x) => x.public, 60],
      [{ kind: 'congress', amount: -10 }, (x) => x.congress, 40],
      [{ kind: 'prestige', amount: 3 }, (x) => x.prestige, 3],
      [{ kind: 'actionsNextTurn', amount: 2 }, (x) => x.actionsNextTurn, 2],
      [{ kind: 'nextLaunchBonus', amount: 8 }, (x) => x.nextLaunchBonus, 8],
      [{ kind: 'drawCards', amount: 2 }, (x) => x.offer.length, 2],
    ];
    for (const [effect, read, expected] of cases) {
      const copy = structuredClone(s);
      applyEffect(copy, r, effect);
      expect(read(copy), effect.kind).toBe(expected);
    }
  });

  it('playing a card pays its cost, spends action points and applies effects', () => {
    const s = step(program('pr-tour'), r, { type: 'playCard', index: 0 });
    expect(s.budget).toBe(90);
    expect(s.actions).toBe(r.balance.actionsPerTurn - 1);
    expect(s.public).toBe(r.balance.startPublic + 8);
    expect(s.offer).toHaveLength(0);
  });

  it('a card needs enough action points', () => {
    const s = { ...program('budget-hearing'), actions: 1 };
    expect(() => step(s, r, { type: 'playCard', index: 0 })).toThrow('Needs 2 action point(s)');
  });

  it('a part card unlocks the part for building', () => {
    const s = step({ ...newGame(), offer: [{ kind: 'part', id: 'colossus-1' }], budget: 200 }, r, {
      type: 'playCard',
      index: 0,
    });
    expect(s.unlockedParts).toContain('colossus-1');
  });

  it('the offer has no duplicates and at least one free card', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newGame(seed);
      expect(new Set(s.offer.map((c) => `${c.kind}:${c.id}`)).size).toBe(s.offer.length);
      expect(offerViews(s, r).some((v) => v.cost === 0)).toBe(true);
    }
  });

  it('a launch bonus card improves the next launch only', () => {
    const s = step(program('static-fire'), r, { type: 'playCard', index: 0 });
    expect(s.nextLaunchBonus).toBe(8);
  });
});

describe('launch preview', () => {
  it('explains why a rocket cannot fly', () => {
    const s = newGame();
    const preview = previewLaunch(s, r, {
      missionId: 'crewedOrbit',
      crewIds: [],
      testFlight: false,
      redundancy: false,
      rocket: { booster: 'javelin', upper: 'agile', payload: 'pilgrim' },
    });
    expect(preview.problems).toContain('Not enough lift: 3 of 4');
    expect(preview.problems).toContain('Pick 1 astronaut(s); 0 picked');
  });

  it('a forced crisis appears on the next launch', () => {
    let s = newGame();
    s = step(s, r, { type: 'dev', command: 'forceEvent', eventId: 'satSpin' });
    s = step(s, r, {
      type: 'launch',
      missionId: 'satellite',
      crewIds: [],
      testFlight: false,
      redundancy: false,
      rocket: { booster: 'javelin', upper: 'agile', payload: 'beacon' },
    });
    expect(s.phase).toBe('crisis');
    expect(s.flight?.crisis?.eventId).toBe('satSpin');
  });
});

describe('whole runs', () => {
  it('a run replays exactly from its seed and actions', () => {
    const run = playBotRun(r, 5);
    const record: RunRecord = { rulesetId: r.id, seed: 5, options: { storyMode: false }, actions: run.actions };
    expect(replay(r, record)).toEqual(run.final);
  });

  it('story mode never kills astronauts', () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(playBotRun(r, seed, true).final.fallen).toEqual([]);
    }
  });
});

describe('golden replays (if this fails after an intended change: npm run golden:update)', () => {
  const dir = new URL('./golden/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    it(file, () => {
      const g = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as RunRecord & {
        expected: unknown;
        actions: Action[];
      };
      expect(summarize(replay(r, g))).toEqual(g.expected);
    });
  }
});
