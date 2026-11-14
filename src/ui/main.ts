// UI controller: holds the current run, sends actions to the core, saves, and re-renders.
// The whole screen is redrawn after every change (simple and predictable; plenty fast for a card game).

import './styles.css';
import type { Balance } from '../content/types.ts';
import {
  actionsUntilTurn, createGame, dateLabel, lookup, newSeed, replay, step, STATE_VERSION,
  type Action, type GameState, type ProgramAction, type RunRecord,
} from '../core/index.ts';
import { renderDevPanel } from './devPanel.ts';
import { draftPlan, emptyDraft, renderApp, type Draft } from './render.ts';
import { baseRuleset, withOverrides } from './ruleset.ts';
import {
  addNote, addToHall, clearNotes, loadBalanceOverrides, loadNotes, loadSave, loadTextSize,
  saveBalanceOverrides, saveTextSize, SAVE_VERSION, writeSave, type FeedbackNote,
} from './storage.ts';

// ------------------------------------------------------------------ app state (UI only)

const app = {
  run: null as RunRecord | null,
  state: null as GameState | null,
  /** Balance overrides used by the current run. */
  runOverrides: {} as Partial<Balance>,
  /** Balance overrides being edited in the dev panel (used by the next new run). */
  pendingOverrides: loadBalanceOverrides(),
  draft: emptyDraft(),
  devOpen: false,
  storyMode: false,
  error: null as string | null,
  noteOpen: false,
  /** Two-step confirm for deleting notes. */
  confirmClearNotes: false,
};

const ruleset = () => withOverrides(app.runOverrides);
const root = document.getElementById('app') as HTMLElement;
const devRoot = document.getElementById('dev') as HTMLElement;

// ------------------------------------------------------------------ runs

function startRun(overrides: Partial<Balance>): void {
  app.runOverrides = overrides;
  const seed = newSeed();
  app.run = { rulesetId: baseRuleset.id, seed, options: { storyMode: app.storyMode }, actions: [] };
  app.state = createGame(ruleset(), seed, app.run.options);
  app.draft = emptyDraft();
  app.error = null;
  save();
}

function loadRun(run: RunRecord, overrides: Partial<Balance>): void {
  try {
    app.runOverrides = overrides;
    app.state = replay(ruleset(), run);
    app.run = { ...run, actions: [...run.actions] };
    app.draft = emptyDraft();
    app.error = null;
    save();
  } catch (err) {
    app.error = `Could not load that run (the game's content may have changed since it was saved). ${(err as Error).message}`;
  }
}

function save(): void {
  if (!app.run) return;
  writeSave({ saveVersion: SAVE_VERSION, stateVersion: STATE_VERSION, run: app.run, balanceOverrides: app.runOverrides });
}

/** Send one action to the core. Every game change goes through here. */
function dispatch(action: Action): void {
  if (!app.state || !app.run) return;
  const before = app.state;
  try {
    app.state = step(before, ruleset(), action);
  } catch (err) {
    app.error = (err as Error).message;
    return;
  }
  app.run.actions.push(action);
  app.error = null;
  if (app.state.phase === 'plan' && before.phase !== 'plan') app.draft = emptyDraft();
  if (app.state.phase === 'over' && before.phase !== 'over') recordHall(app.state);
  save();
}

function recordHall(s: GameState): void {
  const r = ruleset();
  addToHall(
    {
      endedAt: new Date().toISOString(), won: !!s.outcome?.won, reason: s.outcome?.reason ?? '',
      date: dateLabel(r, s.turn), prestige: s.prestige, milestones: Object.keys(s.milestones).length,
      seed: s.seed, storyMode: s.options.storyMode,
    },
    s.fallen.map((f) => ({ name: f.name, mission: f.mission, date: dateLabel(r, f.turn) })),
  );
}

// ------------------------------------------------------------------ reports, notes, downloads

function currentReport(note: string): FeedbackNote | null {
  if (!app.run || !app.state) return null;
  return {
    note, createdAt: new Date().toISOString(), date: dateLabel(ruleset(), app.state.turn),
    phase: app.state.phase, balanceOverrides: app.runOverrides, run: app.run,
  };
}

function download(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function openNote(): void {
  if (!app.state) return;
  app.noteOpen = true;
  render();
  document.getElementById('note-text')?.focus();
}

function saveNote(): void {
  const text = (document.getElementById('note-text') as HTMLTextAreaElement | null)?.value.trim();
  const report = text ? currentReport(text) : null;
  if (report) addNote(report);
  app.noteOpen = false;
}

function loadReportText(text: string): void {
  try {
    const data = JSON.parse(text) as Partial<FeedbackNote> & Partial<RunRecord>;
    if (data.run) loadRun(data.run, data.balanceOverrides ?? {});
    else if (data.seed !== undefined && data.actions) loadRun(data as RunRecord, {});
    else app.error = 'That JSON is not a run report or note.';
  } catch (err) {
    app.error = `Could not read that report: ${(err as Error).message}`;
  }
}

// ------------------------------------------------------------------ plan-screen draft

function updateDraft(change: (d: Draft) => void): void {
  change(app.draft);
  const mission = app.draft.missionId ? lookup.getMission(ruleset(), app.draft.missionId) : null;
  if (mission) app.draft.crewIds = app.draft.crewIds.slice(0, mission.crewNeeded);
}

function toggleCrew(id: string): void {
  updateDraft((d) => {
    if (d.crewIds.includes(id)) {
      d.crewIds = d.crewIds.filter((x) => x !== id);
      return;
    }
    const need = d.missionId ? lookup.getMission(ruleset(), d.missionId).crewNeeded : 0;
    d.crewIds = d.crewIds.length >= need ? [...d.crewIds.slice(0, need - 1), id] : [...d.crewIds, id];
  });
}

// ------------------------------------------------------------------ input handling

function onAct(act: string, arg: string, el: HTMLElement): void {
  switch (act) {
    // Title / menus
    case 'new-run': startRun(app.pendingOverrides); break;
    case 'continue-save': {
      const saved = loadSave();
      if (saved) loadRun(saved.run, saved.balanceOverrides);
      break;
    }
    case 'menu': app.state = null; app.run = null; break;
    case 'story-mode': app.storyMode = (el as HTMLInputElement).checked; break;

    // Plan screen
    case 'mission':
      updateDraft((d) => { d.missionId = arg; });
      scrollToBuilder = window.matchMedia('(max-width: 800px)').matches;
      break;
    case 'part': {
      const [slot, id] = arg.split('|') as ['booster' | 'upper' | 'payload', string];
      updateDraft((d) => { d[slot] = d[slot] === id ? null : id; });
      break;
    }
    case 'crew': toggleCrew(arg); break;
    case 'test-flight': app.draft.testFlight = (el as HTMLInputElement).checked; break;
    case 'redundancy': app.draft.redundancy = (el as HTMLInputElement).checked; break;
    case 'launch': {
      const plan = draftPlan(app.draft);
      if (plan) dispatch({ type: 'launch', ...plan });
      break;
    }
    case 'program': dispatch({ type: 'program', program: arg as ProgramAction }); break;

    // Crisis / reward / report
    case 'option': dispatch({ type: 'chooseOption', index: Number(arg) }); break;
    case 'reward': dispatch({ type: 'chooseReward', index: Number(arg) }); break;
    case 'continue': dispatch({ type: 'continue' }); break;

    // Tools
    case 'note': openNote(); return;
    case 'note-save': saveNote(); break;
    case 'note-cancel': app.noteOpen = false; break;
    case 'dev': app.devOpen = !app.devOpen; break;
    case 'text-smaller': setTextSize(loadTextSize() - 1); break;
    case 'text-larger': setTextSize(loadTextSize() + 1); break;

    // Dev panel
    case 'dev-copy-report': {
      const report = currentReport('');
      if (report) navigator.clipboard?.writeText(JSON.stringify(report)).catch(() => undefined);
      break;
    }
    case 'dev-download-report': {
      const report = currentReport('');
      if (report) download(`sea-cell-run-${report.run.seed}.json`, report);
      break;
    }
    case 'dev-jump': {
      if (!app.run) break;
      const turn = Number((document.getElementById('dev-turn') as HTMLInputElement).value) - 1;
      loadRun({ ...app.run, actions: actionsUntilTurn(ruleset(), app.run, turn) }, app.runOverrides);
      break;
    }
    case 'dev-force': {
      const eventId = (document.getElementById('dev-event') as HTMLSelectElement).value;
      dispatch({ type: 'dev', command: 'forceEvent', eventId });
      break;
    }
    case 'dev-budget': dispatch({ type: 'dev', command: 'addBudget', amount: 50 }); break;
    case 'dev-load': loadReportText((document.getElementById('dev-load') as HTMLTextAreaElement).value); break;
    case 'dev-download-notes': download('sea-cell-notes.json', loadNotes()); break;
    case 'dev-clear-notes':
      if (app.confirmClearNotes) clearNotes();
      app.confirmClearNotes = !app.confirmClearNotes;
      break;
    case 'dev-new-with-balance': startRun(app.pendingOverrides); break;
    case 'dev-export-balance': download('sea-cell-balance.json', { ...baseRuleset.balance, ...app.pendingOverrides }); break;
    case 'dev-reset-balance': app.pendingOverrides = {}; saveBalanceOverrides({}); break;
    default:
      console.warn(`Unhandled UI action "${act}"`);
  }
  render();
}

function onSlider(input: HTMLInputElement): void {
  const key = input.dataset.arg as keyof Balance;
  app.pendingOverrides = { ...app.pendingOverrides, [key]: Number(input.value) };
  saveBalanceOverrides(app.pendingOverrides);
  const output = input.parentElement?.querySelector('output');
  if (output) output.textContent = input.value;
}

const TEXT_SIZES = [0.75, 0.875, 1, 1.125, 1.25, 1.5];
function setTextSize(index: number): void {
  const i = Math.max(0, Math.min(TEXT_SIZES.length - 1, index));
  saveTextSize(i);
  document.documentElement.style.fontSize = `${(TEXT_SIZES[i] ?? 1) * 100}%`;
}

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('button[data-act]');
  if (el && !el.hasAttribute('disabled')) onAct(el.dataset.act ?? '', el.dataset.arg ?? '', el);
});

document.addEventListener('change', (e) => {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement && el.type === 'checkbox' && el.dataset.act) onAct(el.dataset.act, '', el);
});

document.addEventListener('input', (e) => {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement && el.dataset.act === 'slider') onSlider(el);
});

document.addEventListener('keydown', (e) => {
  const typing = (e.target as HTMLElement).closest('input, textarea, select');
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '`') { app.devOpen = !app.devOpen; render(); return; }
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openNote(); return; }
  if (/^[1-9]$/.test(e.key)) {
    const buttons = root.querySelectorAll<HTMLButtonElement>('.options button[data-act]');
    buttons[Number(e.key) - 1]?.click();
  }
});

// ------------------------------------------------------------------ render

let lastPhase: string | null = null;
/** On narrow screens, jump to the rocket builder after picking a mission. */
let scrollToBuilder = false;

function render(): void {
  const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.key;
  root.innerHTML = renderApp({
    state: app.state, ruleset: ruleset(), draft: app.draft,
    hasSave: !!loadSave(), storyMode: app.storyMode, error: app.error, noteOpen: app.noteOpen,
  });
  devRoot.innerHTML = app.devOpen
    ? renderDevPanel({
      state: app.state, run: app.run, ruleset: ruleset(), pendingOverrides: app.pendingOverrides,
      confirmClearNotes: app.confirmClearNotes,
    })
    : '';

  // Keyboard players: keep focus on the same control, or move it to the main button on a new screen.
  const phase = app.state?.phase ?? 'title';
  const same = focusKey ? document.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`) : null;
  if (same && phase === lastPhase) same.focus();
  else if (phase !== lastPhase) root.querySelector<HTMLElement>('.options button, button.primary')?.focus();
  lastPhase = phase;
  if (scrollToBuilder) {
    root.querySelector('#builder')?.scrollIntoView({ block: 'start' });
    scrollToBuilder = false;
  }
}

// ------------------------------------------------------------------ boot

setTextSize(loadTextSize());
render();
