// Developer panel (press ` to toggle): inspect state, jump to a turn, force a crisis,
// export/load run reports, and tweak balance numbers live.

import type { Balance, Ruleset } from '../content/types.ts';
import type { GameState, RunRecord } from '../core/index.ts';
import { button, esc } from './html.ts';
import { loadNotes } from './storage.ts';

/** Balance numbers exposed as sliders. Add more here as needed. */
export const SLIDERS: { key: keyof Balance; min: number; max: number; step: number }[] = [
  { key: 'startBudget', min: 0, max: 200, step: 5 },
  { key: 'baseIncome', min: 0, max: 60, step: 1 },
  { key: 'incomePerCongress', min: 0, max: 1, step: 0.05 },
  { key: 'handSize', min: 3, max: 8, step: 1 },
  { key: 'minorCrisisChance', min: 0, max: 1, step: 0.05 },
  { key: 'testFlightBonus', min: 0, max: 20, step: 1 },
  { key: 'rivalSpeed', min: 0.5, max: 2.5, step: 0.05 },
  { key: 'rivalVariance', min: 0, max: 1.5, step: 0.05 },
  { key: 'firstPublic', min: 0, max: 30, step: 1 },
  { key: 'disasterPublic', min: -40, max: 0, step: 1 },
  { key: 'idlePublic', min: -10, max: 0, step: 1 },
  { key: 'researchCost', min: 0, max: 60, step: 1 },
];

export function renderDevPanel(opts: {
  state: GameState | null;
  run: RunRecord | null;
  ruleset: Ruleset;
  pendingOverrides: Partial<Balance>;
  confirmClearNotes: boolean;
}): string {
  const { state: s, run, ruleset: r, pendingOverrides } = opts;
  const notes = loadNotes();
  const events = r.content.events
    .map((e) => `<option value="${esc(e.id)}">${esc(e.title)} (${esc(e.severity)})</option>`)
    .join('');
  const sliders = SLIDERS.map(({ key, min, max, step }) => {
    const value = pendingOverrides[key] ?? r.balance[key];
    const changed = pendingOverrides[key] !== undefined ? ' *' : '';
    return `<label class="slider">${esc(key)}${changed}: <output>${esc(value)}</output>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${esc(value)}" data-act="slider" data-arg="${esc(key)}"></label>`;
  }).join('');

  const runInfo =
    s && run
      ? `<p>Seed <b>${s.seed}</b> · turn ${s.turn + 1} · phase ${esc(s.phase)} · ${run.actions.length} actions · ruleset ${esc(r.id)}</p>`
      : '<p>No run in progress.</p>';

  return `
  <aside class="dev" aria-label="Developer panel">
    <h2>Dev panel ${button({ act: 'dev', label: 'Close' })}</h2>
    <p><a href="./gallery.html" target="_blank" rel="noopener">Scene gallery</a>: every screen at once (local dev builds only).</p>
    ${runInfo}
    <div class="dev-group">
      <h3>Run</h3>
      ${button({ act: 'dev-copy-report', label: 'Copy run report', disabled: !run })}
      ${button({ act: 'dev-download-report', label: 'Download run report', disabled: !run })}
      <label>Jump to turn <input type="number" id="dev-turn" min="1" value="${s ? s.turn + 1 : 1}" style="width:5em"></label>
      ${button({ act: 'dev-jump', label: 'Jump', disabled: !run })}
    </div>
    <div class="dev-group">
      <h3>Force a crisis on the next launch</h3>
      <select id="dev-event">${events}</select>
      ${button({ act: 'dev-force', label: 'Force', disabled: !s })}
      ${button({ act: 'dev-budget', label: '+50 budget', disabled: !s })}
      <p class="muted">Dev actions are recorded in the action log, so replays stay exact.</p>
    </div>
    <div class="dev-group">
      <h3>Load a run report or feedback note</h3>
      <textarea id="dev-load" rows="3" placeholder="Paste a run report or a single note (JSON) here"></textarea>
      ${button({ act: 'dev-load', label: 'Load and replay' })}
    </div>
    <div class="dev-group">
      <h3>Playtest notes (${notes.length})</h3>
      ${button({ act: 'dev-copy-notes', label: 'Copy notes', disabled: !notes.length })}
      ${button({ act: 'dev-download-notes', label: 'Download notes', disabled: !notes.length })}
      <p class="muted">Downloads don't work when the game runs as a hosted page; use Copy and paste the text anywhere.</p>
      ${button({ act: 'dev-clear-notes', label: opts.confirmClearNotes ? 'Really delete all notes?' : 'Clear notes', disabled: !notes.length })}
    </div>
    <div class="dev-group">
      <h3>Balance (applies to the next new run)</h3>
      ${sliders}
      ${button({ act: 'dev-new-with-balance', label: 'New run with these numbers' })}
      ${button({ act: 'dev-export-balance', label: 'Export balance JSON' })}
      ${button({ act: 'dev-reset-balance', label: 'Reset to defaults' })}
    </div>
    <details><summary>Game state (JSON)</summary><pre>${esc(JSON.stringify(s, null, 2))}</pre></details>
  </aside>`;
}
