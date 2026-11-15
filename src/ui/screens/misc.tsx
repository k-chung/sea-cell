// Reward pick, game over, and the frame around every in-run screen (status bar + sidebar).

import { dateLabel, income, lookup, rewardLabel } from '../../core/index.ts';
import { CrewPortrait, RivalEmblem } from '../art.tsx';
import type { ScreenProps } from './props.ts';

export function RewardScreen({ s, r, act }: ScreenProps) {
  return (
    <section>
      <h2>A first! Pick a reward</h2>
      <div class="options">
        {s.rewardChoices.map((c, i) => {
          const l = rewardLabel(r, c);
          return (
            <button
              type="button"
              key={`${c.kind}:${c.id}`}
              class="option"
              data-act="reward"
              data-arg={i}
              onClick={() => act({ type: 'chooseReward', index: i })}
            >
              <span class="key">{i + 1}</span>
              <span class="grow">
                <b>{l.title}</b> <small>{l.detail}</small>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" data-act="reward" data-arg={-1} onClick={() => act({ type: 'chooseReward', index: -1 })}>
        Skip
      </button>
    </section>
  );
}

export function OverScreen({ s, r, onNewRun, onTitle }: ScreenProps & { onNewRun: () => void; onTitle: () => void }) {
  const won = s.outcome?.won;
  return (
    <section class="over">
      <span class={`stamp ${won ? 'good' : 'bad'}`}>{won ? 'Victory' : 'Program ended'}</span>
      <p class="event-text">{s.outcome?.reason}</p>
      <p>
        {dateLabel(r, s.turn)} · prestige {s.prestige} · seed {s.seed}
      </p>
      <h2>Milestones</h2>
      <ul>
        {Object.keys(s.milestones).map((id) => (
          <li key={id}>{lookup.getMilestone(r, id).name}</li>
        ))}
      </ul>
      <h2>Lost</h2>
      <ul>
        {s.fallen.length ? s.fallen.map((f) => <li key={f.name}>{f.name}, {f.mission}</li>) : <li>No one.</li>}
      </ul>
      <p class="row">
        <button type="button" class="primary" data-act="new-run" onClick={onNewRun}>
          New run
        </button>
        <button type="button" onClick={onTitle}>
          Title screen
        </button>
      </p>
    </section>
  );
}

export function StatusBar({ s, r }: ScreenProps) {
  const low = (n: number) => (n <= 20 ? ' low' : '');
  return (
    <div class="status">
      <b>{dateLabel(r, s.turn)}</b>
      <span>
        Turn {s.turn + 1}/{r.balance.turns}
      </span>
      <span>
        Budget ${s.budget} <small>+{income(s, r)}/turn</small>
      </span>
      <span class={low(s.public)} title="Public support. The program ends at 0.">
        Public <meter min={0} max={100} low={21} value={s.public} /> {s.public}
      </span>
      <span class={low(s.congress)} title="Congress support. The program ends at 0.">
        Congress <meter min={0} max={100} low={21} value={s.congress} /> {s.congress}
      </span>
      <span>Prestige {s.prestige}</span>
    </div>
  );
}

/** Phones get the sidebar collapsed (it sits below the main panel there). */
const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;

export function Sidebar({ s, r }: ScreenProps) {
  const phone = isPhone();
  const intel = s.rival.intelTarget ? lookup.getMilestone(r, s.rival.intelTarget).name : 'no activity';
  return (
    <aside class="sidebar" aria-label="Race and crew">
      <details open={!phone}>
        <summary>
          Race: you {Object.keys(s.milestones).length}, USSR {Object.keys(s.rival.milestones).length}
        </summary>
      <h2>
        Race <RivalEmblem scale={2} />
      </h2>
      <table class="race">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>You</th>
            <th>USSR</th>
          </tr>
        </thead>
        <tbody>
          {r.content.milestones.map((m) => (
            <tr key={m.id}>
              <td>{m.name.replace(/^First /, '')}</td>
              <td>{s.milestones[m.id] !== undefined ? '✔' : '–'}</td>
              <td>{s.rival.milestones[m.id] !== undefined ? '✔' : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p class="intel">
        Intel: Soviets likely on {intel} ({s.rival.intelStage ?? '?'}, estimate)
      </p>
      </details>
      <details open={!phone}>
        <summary>Crew ({s.crew.filter((a) => a.status !== 'dead').length})</summary>
      <ul class="crew">
        {s.crew.map((a) => (
          <li key={a.id} class={a.status} title={lookup.getTrait(r, a.traitId).description}>
            <CrewPortrait id={a.id} name="" scale={2} dead={a.status === 'dead'} />
            <span>
              {a.name}
              <br />
              <small>
                {lookup.getTrait(r, a.traitId).name} ·{' '}
                {a.status === 'dead' ? 'KIA' : a.status === 'injured' ? `injured ${a.injuredTurns}t` : `${a.flights} flights`}
              </small>
            </span>
          </li>
        ))}
      </ul>
      {(s.personnel.length > 0 || s.favors.length > 0) && (
        <>
          <h2>Staff and favors</h2>
          <ul>
            {s.personnel.map((id) => (
              <li key={id} title={lookup.getPersonnel(r, id).description}>
                {lookup.getPersonnel(r, id).name}
              </li>
            ))}
            {s.favors.map((id) => (
              <li key={id}>{lookup.getFavor(r, id).name}</li>
            ))}
          </ul>
        </>
      )}
      </details>
      <details>
        <summary>Program log</summary>
        <ul class="history">
          {[...s.history]
            .reverse()
            .slice(0, 40)
            .map((l, i) => (
              <li key={i}>{l}</li>
            ))}
        </ul>
      </details>
    </aside>
  );
}
