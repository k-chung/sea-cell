// Scene gallery (dev only): every screen in a known state, on one page, so a person can eyeball
// them all at once. Open /gallery.html while `npm run dev` runs. The E2E tests load it too.
// Scenes are built by playing real actions through core from a fixed seed, so they stay honest.

import './styles.css';
import { type Action, createGame, type GameState, lookup, step } from '../core/index.ts';
import { esc } from './html.ts';
import { type Draft, emptyDraft, renderApp, type View } from './render.ts';
import { baseRuleset as r } from './ruleset.ts';

const SEED = 4242;
const run = (s: GameState, ...actions: Action[]) => actions.reduce((acc, a) => step(acc, r, a), s);

/** A run partway in: satellite and crewed orbit done, a hand that can fly a spacewalk. */
function midGame(): GameState {
  const s = createGame(r, SEED, { storyMode: false });
  return {
    ...s,
    turn: 9,
    budget: 84,
    public: 61,
    congress: 48,
    prestige: 23,
    milestones: { satellite: 1, crewedOrbit: 4 },
    rival: { ...s.rival, milestones: { satellite: 0, crewedOrbit: 3 } },
    hand: ['titanus', 'javelin', 'vanguard-2', 'agile', 'tandem'],
  };
}

const spacewalk = (s: GameState): Action => ({
  type: 'launch',
  missionId: 'spacewalk',
  testFlight: false,
  redundancy: false,
  rocket: { booster: 'titanus', upper: 'vanguard-2', payload: 'tandem' },
  crewIds: s.crew.slice(0, 2).map((a) => a.id),
});

function scenes(): { name: string; view: Partial<View> }[] {
  const start = createGame(r, SEED, { storyMode: false });
  const mid = midGame();
  const draft: Draft = {
    ...emptyDraft(),
    missionId: 'spacewalk',
    booster: 'titanus',
    upper: 'vanguard-2',
    payload: 'tandem',
    crewIds: mid.crew.slice(0, 2).map((a) => a.id),
  };
  const crisis = run(mid, { type: 'dev', command: 'forceEvent', eventId: 'suitBalloon' }, spacewalk(mid));
  const report = run(crisis, { type: 'chooseOption', index: 1 });
  const research = run(start, { type: 'program', program: 'research' });
  const won: GameState = {
    ...mid,
    phase: 'over',
    milestones: { ...mid.milestones, moonLanding: 20 },
    outcome: { won: true, reason: `You reached ${lookup.getMilestone(r, 'moonLanding').name} first.` },
  };
  const lost: GameState = {
    ...mid,
    phase: 'over',
    fallen: [{ name: mid.crew[0]?.name ?? '?', mission: 'Spacewalk', turn: 9 }],
    outcome: { won: false, reason: 'Public support collapsed. The program is cancelled.' },
  };
  return [
    { name: 'Title screen', view: { state: null } },
    { name: 'Plan: start of a run', view: { state: start } },
    { name: 'Plan: rocket built, crew picked', view: { state: mid, draft } },
    { name: 'Crisis (forced: suit ballooning)', view: { state: crisis } },
    {
      name: 'Report after the crisis',
      view: { state: report, lastRocket: { booster: 'titanus', upper: 'vanguard-2', payload: 'tandem' } },
    },
    { name: 'Reward: research pick', view: { state: research } },
    { name: 'Game over: victory', view: { state: won } },
    { name: 'Game over: program ended', view: { state: lost } },
    { name: 'Playtest note open + error banner', view: { state: mid, noteOpen: true, error: 'Example error message' } },
  ];
}

const base: View = {
  state: null,
  ruleset: r,
  draft: emptyDraft(),
  lastRocket: null,
  hasSave: false,
  storyMode: false,
  soundOn: false,
  error: null,
  noteOpen: false,
};

const root = document.getElementById('gallery') as HTMLElement;
root.innerHTML =
  `<h1 style="padding:16px">SCENE GALLERY · seed ${SEED}</h1>` +
  scenes()
    .map(
      (sc, i) => `
  <section class="scene" data-scene="${i}">
    <h2 style="padding:0 16px">${i + 1}. ${esc(sc.name)}</h2>
    <div class="scene-frame">${renderApp({ ...base, ...sc.view })}</div>
  </section>`,
    )
    .join('');
