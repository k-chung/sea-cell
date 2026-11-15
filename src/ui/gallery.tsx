// Scene gallery (dev only): every screen in a known state on one page, to eyeball them all at once.
// Open /gallery.html while `npm run dev` runs. The E2E tests load it too.
// Scenes come from real actions through core from a fixed seed, so they stay honest.

import './styles.css';
import { render } from 'preact';
import { type Action, createGame, type GameState, step } from '../core/index.ts';
import { TitleScreen } from './app.tsx';
import { type Draft, emptyDraft } from './draft.ts';
import { CrisisScreen, ReportScreen } from './screens/flight.tsx';
import { OverScreen, RewardScreen, Sidebar, StatusBar } from './screens/misc.tsx';
import { PlanScreen } from './screens/plan.tsx';
import type { ScreenProps } from './screens/props.ts';
import { baseRuleset as r } from './ruleset.ts';

const SEED = 4242;
const run = (s: GameState, ...actions: Action[]) => actions.reduce((acc, a) => step(acc, r, a), s);
const noop = () => undefined;

/** Partway through a run: satellite and crewed orbit done, Soviets level. */
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
  };
}

const rocket = { booster: 'titanus', upper: 'vanguard-2', payload: 'tandem' };

function scenes(): { name: string; s: GameState | null; draft?: Draft; phaseScreen?: string }[] {
  const start = createGame(r, SEED, { storyMode: false });
  const mid = midGame();
  const crew = mid.crew.slice(0, 2).map((a) => a.id);
  const crisis = run(
    mid,
    { type: 'dev', command: 'forceEvent', eventId: 'suitBalloon' },
    { type: 'launch', missionId: 'spacewalk', rocket, crewIds: crew, testFlight: false, redundancy: false },
  );
  const report = run(crisis, { type: 'chooseOption', index: 1 });
  const reward: GameState = {
    ...mid,
    phase: 'reward',
    rewardSource: 'milestone',
    rewardChoices: [
      { kind: 'personnel', id: 'brandt' },
      { kind: 'part', id: 'colossus-1' },
      { kind: 'favor', id: 'windfall' },
    ],
  };
  const won: GameState = { ...mid, phase: 'over', outcome: { won: true, reason: 'You reached the Moon first.' } };
  const lost: GameState = {
    ...mid,
    phase: 'over',
    fallen: [{ name: mid.crew[0]?.name ?? '?', mission: 'Spacewalk', turn: 9 }],
    outcome: { won: false, reason: 'Public support collapsed. The program is cancelled.' },
  };
  return [
    { name: 'Title screen', s: null },
    { name: 'Plan: start of a run', s: start },
    { name: 'Plan: spacewalk built, crew picked', s: mid, draft: { ...emptyDraft(), missionId: 'spacewalk', ...rocket, crewIds: crew } },
    { name: 'Crisis (forced: suit ballooning)', s: crisis },
    { name: 'Report after the crisis', s: report },
    { name: 'Reward pick', s: reward },
    { name: 'Game over: victory', s: won },
    { name: 'Game over: program ended', s: lost },
  ];
}

function Scene({ s, draft }: { s: GameState | null; draft?: Draft }) {
  if (!s) return <TitleScreen storyMode={false} setStoryMode={noop} onNew={noop} onContinue={noop} />;
  const p: ScreenProps = { s, r, act: noop, draft: draft ?? emptyDraft(), setDraft: noop, lastRocket: rocket };
  return (
    <>
      <StatusBar {...p} />
      <div class="layout">
        <main class={`phase-${s.phase}`}>
          {s.phase === 'plan' && <PlanScreen {...p} />}
          {s.phase === 'crisis' && <CrisisScreen {...p} />}
          {s.phase === 'report' && <ReportScreen {...p} />}
          {s.phase === 'reward' && <RewardScreen {...p} />}
          {s.phase === 'over' && <OverScreen {...p} onNewRun={noop} onTitle={noop} />}
        </main>
        <Sidebar {...p} />
      </div>
    </>
  );
}

render(
  <div class="app">
    <h1>Scene gallery · seed {SEED}</h1>
    {scenes().map((sc, i) => (
      <section class="scene" data-scene={i} key={sc.name}>
        <h2>
          {i + 1}. {sc.name}
        </h2>
        <div class="scene-frame">
          <Scene s={sc.s} draft={sc.draft} />
        </div>
      </section>
    ))}
  </div>,
  document.getElementById('gallery') as HTMLElement,
);
