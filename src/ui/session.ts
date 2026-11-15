// A play session: the current run (seed + actions), its game state, and saving.
// Plain functions, no UI code, so screens stay thin and this is easy to test and debug.

import type { Balance } from '../content/types.ts';
import {
  type Action,
  createGame,
  dateLabel,
  type GameState,
  newSeed,
  type RocketChoice,
  type RunRecord,
  replay,
  STATE_VERSION,
  step,
} from '../core/index.ts';
import { baseRuleset, withOverrides } from './ruleset.ts';
import { addToHall, type FeedbackNote, SAVE_VERSION, writeSave } from './storage.ts';

export interface Session {
  run: RunRecord;
  state: GameState;
  /** Dev-panel balance overrides this run was started with (part of the replay). */
  overrides: Partial<Balance>;
  /** Rocket of the latest launch, for drawing it after the flight state is gone. */
  lastRocket: RocketChoice | null;
}

export const sessionRuleset = (s: Session | null) => withOverrides(s?.overrides ?? {});

/** `?seed=123` in the page URL fixes the seed of new runs (debugging, E2E tests). */
function seedFromUrl(): number | null {
  const n = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function newSession(overrides: Partial<Balance>, storyMode: boolean): Session {
  const seed = seedFromUrl() ?? newSeed();
  const run: RunRecord = { rulesetId: baseRuleset.id, seed, options: { storyMode }, actions: [] };
  const session = { run, state: createGame(withOverrides(overrides), seed, run.options), overrides, lastRocket: null };
  save(session);
  return session;
}

/** Rebuild a session from a run record. Throws (with a reason) if it no longer replays. */
export function loadSession(run: RunRecord, overrides: Partial<Balance>): Session {
  const state = replay(withOverrides(overrides), run);
  const session = { run: { ...run, actions: [...run.actions] }, state, overrides, lastRocket: null };
  save(session);
  return session;
}

/** Apply one action. Throws if the core rejects it. Saves, and records the Hall of Fame at game over. */
export function applyAction(session: Session, action: Action): Session {
  const r = sessionRuleset(session);
  const state = step(session.state, r, action);
  const next: Session = {
    ...session,
    state,
    run: { ...session.run, actions: [...session.run.actions, action] },
    lastRocket: action.type === 'launch' ? action.rocket : session.lastRocket,
  };
  if (state.phase === 'over' && session.state.phase !== 'over') {
    addToHall(
      {
        endedAt: new Date().toISOString(),
        won: !!state.outcome?.won,
        reason: state.outcome?.reason ?? '',
        date: dateLabel(r, state.turn),
        prestige: state.prestige,
        milestones: Object.keys(state.milestones).length,
        seed: state.seed,
        storyMode: state.options.storyMode,
      },
      state.fallen.map((f) => ({ name: f.name, mission: f.mission, date: dateLabel(r, f.turn) })),
    );
  }
  save(next);
  return next;
}

function save(s: Session): void {
  writeSave({ saveVersion: SAVE_VERSION, stateVersion: STATE_VERSION, run: s.run, balanceOverrides: s.overrides });
}

/** Everything needed to replay this exact moment, with an optional note. */
export function makeReport(s: Session, note: string): FeedbackNote {
  return {
    note,
    createdAt: new Date().toISOString(),
    date: dateLabel(sessionRuleset(s), s.state.turn),
    phase: s.state.phase,
    balanceOverrides: s.overrides,
    run: s.run,
  };
}

/** Read a pasted run report or note. Throws with a readable message. */
export function parseReport(text: string): { run: RunRecord; overrides: Partial<Balance> } {
  const data = JSON.parse(text) as Partial<FeedbackNote> & Partial<RunRecord>;
  if (data.run) return { run: data.run, overrides: data.balanceOverrides ?? {} };
  if (data.seed !== undefined && data.actions) return { run: data as RunRecord, overrides: {} };
  throw new Error('That JSON is not a run report or note.');
}
