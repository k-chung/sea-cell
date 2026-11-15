// Tests for the rules engine. Run: npm test

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { spaceRaceRuleset as r } from '../src/content/rulesets.ts';
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

  it('starts with crew, a full hand and the plan phase', () => {
    const s = newGame();
    expect(s.crew).toHaveLength(r.balance.startCrew);
    expect(s.hand).toHaveLength(r.balance.handSize);
    expect(s.phase).toBe('plan');
  });
});

describe('step', () => {
  it('never changes the state it was given', () => {
    const s = newGame();
    const before = structuredClone(s);
    step(s, r, { type: 'program', program: 'wait' });
    expect(s).toEqual(before);
  });

  it('rejects actions in the wrong phase with a clear message', () => {
    expect(() => step(newGame(), r, { type: 'continue' })).toThrow('needs phase "report"');
  });

  it('a program action ends the turn and the next turn pays income', () => {
    let s = newGame();
    s = step(s, r, { type: 'program', program: 'wait' });
    expect(s.phase).toBe('report');
    const budget = s.budget;
    s = step(s, r, { type: 'continue' });
    expect(s.turn).toBe(1);
    expect(s.budget).toBeGreaterThan(budget);
  });
});

describe('launch preview', () => {
  it('explains why a rocket cannot fly', () => {
    const s: GameState = { ...newGame(), hand: ['javelin', 'agile', 'pilgrim'] };
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
    let s: GameState = { ...newGame(), hand: ['javelin', 'agile', 'beacon'] };
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
