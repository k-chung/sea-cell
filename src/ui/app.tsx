// The app shell: which screen to show, input (clicks + keyboard), notes, sound, dev panel.
// Game changes go through session.applyAction -> core step(); this file holds no game rules.

import { useEffect, useState } from 'preact/hooks';
import type { Balance } from '../content/types.ts';
import type { Action } from '../core/index.ts';
import { DevPanel } from './devPanel.tsx';
import { type Draft, emptyDraft } from './draft.ts';
import { CrisisScreen, FlightScreen, ReportScreen } from './screens/flight.tsx';
import { OverScreen, RewardScreen, Sidebar, StatusBar } from './screens/misc.tsx';
import { PlanScreen } from './screens/plan.tsx';
import type { ScreenProps } from './screens/props.ts';
import { applyAction, loadSession, makeReport, newSession, type Session, sessionRuleset } from './session.ts';
import { play } from './sound.ts';
import {
  addNote,
  type FeedbackNote,
  loadBalanceOverrides,
  loadHall,
  loadSave,
  loadSound,
  loadTextSize,
  saveSound,
  saveTextSize,
} from './storage.ts';

const TEXT_SIZES = [0.75, 0.875, 1, 1.125, 1.25, 1.5];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [storyMode, setStoryMode] = useState(false);
  const [soundOn, setSoundOn] = useState(loadSound());
  const [textSize, setTextSize] = useState(loadTextSize());
  const [pendingOverrides, setPendingOverrides] = useState<Partial<Balance>>(loadBalanceOverrides());

  useEffect(() => {
    document.documentElement.style.fontSize = `${(TEXT_SIZES[textSize] ?? 1) * 100}%`;
    saveTextSize(textSize);
  }, [textSize]);

  /** Every game change goes through here. */
  function act(action: Action) {
    if (!session) return;
    try {
      const next = applyAction(session, action);
      if (next.state.phase === 'plan' && session.state.phase !== 'plan') setDraft(emptyDraft());
      setSession(next);
      setError(null);
      if (soundOn) playFor(action, next);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function start(overrides: Partial<Balance>) {
    setSession(newSession(overrides, storyMode));
    setDraft(emptyDraft());
    setError(null);
  }

  function load(run: Session['run'], overrides: Partial<Balance>) {
    try {
      setSession(loadSession(run, overrides));
      setDraft(emptyDraft());
      setError(null);
    } catch (err) {
      setError(`Could not load that run (the game may have changed since). ${(err as Error).message}`);
    }
  }

  // Keyboard: ` dev panel, N note, 1-9 pick a crisis option or reward.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '`') setDevOpen((o) => !o);
      else if ((e.key === 'n' || e.key === 'N') && session) {
        e.preventDefault();
        setNoteOpen(true);
      } else if (/^[1-9]$/.test(e.key)) {
        document.querySelectorAll<HTMLButtonElement>('.options button')[Number(e.key) - 1]?.click();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [session]);

  // Move keyboard focus to the main button when the screen changes.
  const phase = session?.state.phase ?? 'title';
  useEffect(() => {
    document.querySelector<HTMLElement>('.options button, main button.primary:not(:disabled)')?.focus({ preventScroll: true });
  }, [phase]);

  const r = sessionRuleset(session);
  const tools = (
    <div class="tools">
      <button type="button" data-act="note" onClick={() => setNoteOpen(true)} disabled={!session}>
        Note (N)
      </button>
      <button
        type="button"
        aria-pressed={soundOn}
        onClick={() => {
          setSoundOn(!soundOn);
          saveSound(!soundOn);
          if (!soundOn) play('click');
        }}
      >
        Sound
      </button>
      <button type="button" aria-label="Smaller text" onClick={() => setTextSize(Math.max(0, textSize - 1))}>
        A−
      </button>
      <button type="button" aria-label="Larger text" onClick={() => setTextSize(Math.min(5, textSize + 1))}>
        A+
      </button>
      <button type="button" data-act="dev" onClick={() => setDevOpen(!devOpen)}>
        Dev
      </button>
      {session && (
        <button type="button" onClick={() => setSession(null)}>
          Menu
        </button>
      )}
    </div>
  );

  let screen = null;
  if (session) {
    const p: ScreenProps = { s: session.state, r, act, draft, setDraft, lastRocket: session.lastRocket };
    screen = (
      <>
        <StatusBar {...p} />
        <div class="layout">
          <main class={`phase-${phase}`}>
            {phase === 'plan' && <PlanScreen {...p} />}
            {phase === 'flight' && <FlightScreen {...p} />}
            {phase === 'crisis' && <CrisisScreen {...p} />}
            {phase === 'report' && <ReportScreen {...p} />}
            {phase === 'reward' && <RewardScreen {...p} />}
            {phase === 'over' && <OverScreen {...p} onNewRun={() => start(pendingOverrides)} onTitle={() => setSession(null)} />}
          </main>
          <Sidebar {...p} />
        </div>
      </>
    );
  }

  return (
    <div class="app">
      <header class="topbar">
        <b class="brand">Sea Cell</b>
        <span class="muted">{r.era.name}</span>
        {tools}
      </header>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      {noteOpen && session && <NoteBox makeNote={(text) => makeReport(session, text)} onDone={() => setNoteOpen(false)} />}
      {screen ?? (
        <TitleScreen
          storyMode={storyMode}
          setStoryMode={setStoryMode}
          onNew={() => start(pendingOverrides)}
          onContinue={() => {
            const saved = loadSave();
            if (saved) load(saved.run, saved.balanceOverrides);
          }}
        />
      )}
      {devOpen && (
        <DevPanel
          session={session}
          pendingOverrides={pendingOverrides}
          setPendingOverrides={setPendingOverrides}
          act={act}
          load={load}
          startWith={start}
          close={() => setDevOpen(false)}
        />
      )}
    </div>
  );
}

function playFor(action: Action, next: Session) {
  const s = next.state;
  const result = s.lastResult === 'success' ? 'success' : s.lastResult === 'abort' ? 'click' : 'fail';
  if (action.type === 'launch') {
    play('launch');
    setTimeout(() => play(s.phase === 'crisis' ? 'alarm' : result), 1000);
  } else play(action.type === 'chooseOption' ? result : 'click');
}

const NEW_IDEA_URL = 'https://github.com/k-chung/sea-cell/issues/new?template=idea.md';

/** A prefilled GitHub idea issue with the note and (if it fits in a link) the replay data. */
function ideaLink(note: FeedbackNote): { href: string; replayInLink: boolean } {
  const data = JSON.stringify(note);
  const replayInLink = data.length < 5000; // links much longer than this can fail
  const replay = replayInLink
    ? `\n\n<details><summary>Replay data</summary>\n\n\`\`\`json\n${data}\n\`\`\`\n</details>`
    : '\n\n(Replay data is on your clipboard: paste it here.)';
  const title = `Playtest: ${note.note.slice(0, 60)}`;
  return {
    href: `${NEW_IDEA_URL}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(note.note + replay)}`,
    replayInLink,
  };
}

/** Playtest note. "Send as idea" opens a prefilled GitHub issue (one tap on a phone); "Save" keeps it locally. */
function NoteBox({ makeNote, onDone }: { makeNote: (text: string) => FeedbackNote; onDone: () => void }) {
  const [text, setText] = useState('');
  const note = makeNote(text.trim() || '(no text)');
  const { href, replayInLink } = ideaLink(note);
  return (
    <section class="note" aria-label="Playtest note">
      <label for="note-text">Playtest note: what did you notice or feel right now? The exact moment is attached.</label>
      {/* biome-ignore lint/a11y/noAutofocus: the box opens on purpose to type into */}
      <textarea id="note-text" rows={2} autofocus value={text} onInput={(e) => setText(e.currentTarget.value)} />
      <a
        class="button primary"
        data-act="note-send"
        href={href}
        target="_blank"
        rel="noopener"
        onClick={() => {
          addNote(note);
          if (!replayInLink) navigator.clipboard?.writeText(JSON.stringify(note)).catch(() => undefined);
          onDone();
        }}
      >
        Send as idea
      </a>
      <button
        type="button"
        data-act="note-save"
        onClick={() => {
          if (text.trim()) addNote(note);
          onDone();
        }}
      >
        Save on this device
      </button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
    </section>
  );
}

export function TitleScreen(props: {
  storyMode: boolean;
  setStoryMode: (on: boolean) => void;
  onNew: () => void;
  onContinue: () => void;
}) {
  const hall = loadHall();
  const hasSave = !!loadSave();
  return (
    <main class="title">
      <h1>Sea Cell</h1>
      <p>Run a space program. Play cards, build rockets, and beat the Soviets to the Moon.</p>
      <p class="row">
        {hasSave && (
          <button type="button" class="primary" data-act="continue-save" onClick={props.onContinue}>
            Continue run
          </button>
        )}
        <button type="button" class={hasSave ? '' : 'primary'} data-act="new-run" onClick={props.onNew}>
          New run
        </button>
        <label class="check">
          <input
            type="checkbox"
            checked={props.storyMode}
            onChange={(e) => props.setStoryMode(e.currentTarget.checked)}
          />{' '}
          Story mode (crew are injured, not killed)
        </label>
      </p>
      <h2>How to play</h2>
      <ul>
        <li>Each turn you get action points and a hand of cards: decisions, parts, staff and astronauts.</li>
        <li>Play cards, then build a rocket from parts you own and launch, or end the turn.</li>
        <li>Each flight phase rolls its reliability. A failure is a crisis: your call.</li>
        <li>Lose if Public or Congress support hits 0, or the Soviets land on the Moon first.</li>
      </ul>
      <h2>Recent runs</h2>
      <ul>
        {hall.runs.length ? (
          hall.runs.slice(0, 6).map((h) => (
            <li key={h.endedAt}>
              {h.won ? 'Won' : 'Lost'} · {h.date} · prestige {h.prestige}
            </li>
          ))
        ) : (
          <li class="muted">No runs yet.</li>
        )}
      </ul>
      {hall.fallen.length > 0 && (
        <>
          <h2>In memoriam</h2>
          <ul>
            {hall.fallen.slice(0, 12).map((f, i) => (
              <li key={i}>
                {f.name} · {f.mission} · {f.date}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
