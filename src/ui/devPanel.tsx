// Developer panel (press ` to toggle): inspect state, jump to a turn, force a crisis,
// copy/load run reports and notes, and tweak balance numbers for the next run.
// Downloads don't work on the hosted page (the host blocks them); Copy does.

import { useState } from 'preact/hooks';
import type { Balance } from '../content/types.ts';
import { type Action, actionsUntilTurn } from '../core/index.ts';
import { baseRuleset } from './ruleset.ts';
import { makeReport, parseReport, type Session, sessionRuleset } from './session.ts';
import { clearNotes, loadNotes, saveBalanceOverrides } from './storage.ts';

/** Balance numbers exposed as sliders. Add more here as needed. */
const SLIDERS: { key: keyof Balance; min: number; max: number; step: number }[] = [
  { key: 'startBudget', min: 0, max: 200, step: 5 },
  { key: 'baseIncome', min: 0, max: 60, step: 1 },
  { key: 'actionsPerTurn', min: 1, max: 6, step: 1 },
  { key: 'offerSize', min: 3, max: 8, step: 1 },
  { key: 'partCostMultiplier', min: 0.5, max: 6, step: 0.25 },
  { key: 'minorCrisisChance', min: 0, max: 1, step: 0.05 },
  { key: 'rivalSpeed', min: 0.5, max: 2.5, step: 0.05 },
  { key: 'firstPublic', min: 0, max: 30, step: 1 },
  { key: 'disasterPublic', min: -40, max: 0, step: 1 },
  { key: 'idlePublic', min: -10, max: 0, step: 1 },
];

const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => undefined);

export function DevPanel(props: {
  session: Session | null;
  pendingOverrides: Partial<Balance>;
  setPendingOverrides: (o: Partial<Balance>) => void;
  act: (a: Action) => void;
  load: (run: Session['run'], overrides: Partial<Balance>) => void;
  startWith: (overrides: Partial<Balance>) => void;
  close: () => void;
}) {
  const { session, pendingOverrides } = props;
  const s = session?.state ?? null;
  const r = sessionRuleset(session);
  const [turn, setTurn] = useState(s ? s.turn + 1 : 1);
  const [eventId, setEventId] = useState(r.content.events[0]?.id ?? '');
  const [pasted, setPasted] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const notes = loadNotes();

  const setOverride = (key: keyof Balance, value: number) => {
    const next = { ...pendingOverrides, [key]: value };
    props.setPendingOverrides(next);
    saveBalanceOverrides(next);
  };

  return (
    <aside class="dev" aria-label="Developer panel">
      <h2>
        Dev panel{' '}
        <button type="button" onClick={props.close}>
          Close
        </button>
      </h2>
      <p>
        <a href="./gallery.html" target="_blank" rel="noopener">
          Scene gallery
        </a>{' '}
        (local dev only)
      </p>
      {s && session ? (
        <p>
          Seed <b>{s.seed}</b> · turn {s.turn + 1} · {s.phase} · {session.run.actions.length} actions
        </p>
      ) : (
        <p>No run in progress.</p>
      )}

      <fieldset disabled={!session}>
        <legend>Run</legend>
        <button type="button" onClick={() => session && copy(JSON.stringify(makeReport(session, '')))}>
          Copy run report
        </button>
        <label>
          Jump to turn{' '}
          <input type="number" min={1} value={turn} onInput={(e) => setTurn(Number(e.currentTarget.value))} />
        </label>
        <button
          type="button"
          onClick={() =>
            session &&
            props.load({ ...session.run, actions: actionsUntilTurn(r, session.run, turn - 1) }, session.overrides)
          }
        >
          Jump
        </button>
      </fieldset>

      <fieldset disabled={!s}>
        <legend>Force a crisis on the next launch</legend>
        <select value={eventId} onChange={(e) => setEventId(e.currentTarget.value)}>
          {r.content.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.severity})
            </option>
          ))}
        </select>
        <button type="button" onClick={() => props.act({ type: 'dev', command: 'forceEvent', eventId })}>
          Force
        </button>
        <button type="button" onClick={() => props.act({ type: 'dev', command: 'addBudget', amount: 50 })}>
          +50 budget
        </button>
      </fieldset>

      <fieldset>
        <legend>Load a run report or note</legend>
        <textarea rows={3} value={pasted} onInput={(e) => setPasted(e.currentTarget.value)} />
        <button
          type="button"
          onClick={() => {
            try {
              const { run, overrides } = parseReport(pasted);
              props.load(run, overrides);
            } catch (err) {
              alertInline(err);
            }
          }}
        >
          Load and replay
        </button>
      </fieldset>

      <fieldset>
        <legend>Playtest notes ({notes.length})</legend>
        <button type="button" disabled={!notes.length} onClick={() => copy(JSON.stringify(notes))}>
          Copy notes
        </button>
        <button
          type="button"
          disabled={!notes.length}
          onClick={() => {
            if (confirmClear) clearNotes();
            setConfirmClear(!confirmClear);
          }}
        >
          {confirmClear ? 'Really delete all notes?' : 'Clear notes'}
        </button>
      </fieldset>

      <fieldset>
        <legend>Balance (applies to the next new run)</legend>
        {SLIDERS.map(({ key, min, max, step }) => {
          const value = Number(pendingOverrides[key] ?? baseRuleset.balance[key]);
          return (
            <label key={key} class="slider">
              {key}
              {pendingOverrides[key] !== undefined && ' *'}: <output>{value}</output>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onInput={(e) => setOverride(key, Number(e.currentTarget.value))}
              />
            </label>
          );
        })}
        <button type="button" onClick={() => props.startWith(pendingOverrides)}>
          New run with these numbers
        </button>
        <button type="button" onClick={() => copy(JSON.stringify({ ...baseRuleset.balance, ...pendingOverrides }, null, 1))}>
          Copy balance JSON
        </button>
        <button
          type="button"
          onClick={() => {
            props.setPendingOverrides({});
            saveBalanceOverrides({});
          }}
        >
          Reset to defaults
        </button>
      </fieldset>

      <details>
        <summary>Game state (JSON)</summary>
        <pre>{JSON.stringify(s, null, 2)}</pre>
      </details>
    </aside>
  );
}

/** Show a load error in the console (the panel is a dev tool; the app shows errors for game actions). */
function alertInline(err: unknown) {
  console.warn('Dev panel:', (err as Error).message);
}
