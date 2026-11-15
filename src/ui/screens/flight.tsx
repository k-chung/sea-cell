// Flight phase screens: a crisis decision, and the turn report afterwards.
// Flights go phase by phase: spend margin or crew abilities on the current phase, then proceed.

import { boostWord, crisisOptions, currentOdds, fillText, lookup, usableAbilities } from '../../core/index.ts';
import { Odds } from '../odds.tsx';
import { CrewPortrait, Rocket } from '../art.tsx';
import type { ScreenProps } from './props.ts';

const BEST_CASE = {
  success: '',
  abort: ' (ends the mission)',
  lost: ' (vehicle lost)',
  disaster: ' (crew lost)',
} as const;

const STAMP = {
  success: ['good', 'Mission success'],
  abort: ['warn', 'Aborted'],
  lost: ['bad', 'Vehicle lost'],
  disaster: ['bad', 'Disaster'],
} as const;

function FlyingRocket({ s, r, lastRocket }: ScreenProps) {
  const rocket = s.flight?.rocket ?? (s.launchedThisTurn ? lastRocket : null);
  if (!rocket) return null;
  const crashed = s.lastResult === 'lost' || s.lastResult === 'disaster';
  return (
    <div class={`flight-art${crashed ? ' crashed' : ' liftoff'}`}>
      <Rocket
        booster={lookup.getPart(r, rocket.booster)}
        upper={lookup.getPart(r, rocket.upper)}
        payload={lookup.getPart(r, rocket.payload)}
        flying={!crashed}
      />
    </div>
  );
}

const Log = ({ lines }: { lines: string[] }) => (
  <ul class="log">
    {lines.map((l, i) => (
      <li key={i} style={{ '--i': i }}>
        {l}
      </li>
    ))}
  </ul>
);

/** The phase track: done, current, still to fly. */
function PhaseTrack({ s, r }: ScreenProps) {
  const flight = s.flight;
  if (!flight) return null;
  const phases = lookup.getMission(r, flight.missionId).phases;
  return (
    <ol class="track">
      {phases.map((ph, i) => {
        const state = i < flight.phaseIndex ? 'done' : i === flight.phaseIndex ? 'now' : 'next';
        return (
          <li key={ph} class={state}>
            {state === 'done' ? '✔ ' : state === 'now' ? '▶ ' : ''}
            {ph}
          </li>
        );
      })}
    </ol>
  );
}

export function FlightScreen(p: ScreenProps) {
  const { s, r, act } = p;
  const flight = s.flight;
  if (!flight) return <p>No flight.</p>;
  const phase = lookup.getMission(r, flight.missionId).phases[flight.phaseIndex] ?? '';
  const abilities = usableAbilities(s, r);
  return (
    <div class="flight">
      <FlyingRocket {...p} />
      <div>
        <PhaseTrack {...p} />
        <section class="phase-now">
          <p class="muted">Now flying</p>
          <h1>
            {phase} <Odds p={currentOdds(s)} big />
          </h1>
          {flight.boost > 0 && <p class="good">Boosted by margin and crew</p>}
          <div class="flight-actions">
            <button
              type="button"
              data-act="margin"
              disabled={flight.margin <= 0}
              onClick={() => act({ type: 'spendMargin' })}
            >
              Spend margin: {boostWord(r.balance.marginBoost)} <small>({flight.margin} left)</small>
            </button>
            {abilities.map((a) => (
              <button
                type="button"
                key={a.crewId}
                class="blue"
                data-act="ability"
                data-arg={a.crewId}
                onClick={() => act({ type: 'useAbility', crewId: a.crewId })}
              >
                ★ {a.crewName}: {a.ability.name} ({boostWord(a.ability.bonus)})
              </button>
            ))}
            <button type="button" class="primary" data-act="proceed" onClick={() => act({ type: 'proceed' })}>
              Proceed
            </button>
          </div>
        </section>
        <Log lines={flight.lines} />
      </div>
    </div>
  );
}

export function CrisisScreen(p: ScreenProps) {
  const { s, r, act } = p;
  const flight = s.flight;
  if (!flight?.crisis) return <p>No crisis.</p>;
  const event = lookup.getEvent(r, flight.crisis.eventId);
  const leadId = flight.crewIds[0];
  const lead = leadId ? lookup.getAstronaut(s, leadId) : null;
  return (
    <div class="flight">
      <FlyingRocket {...p} />
      <div>
        <PhaseTrack {...p} />
        <Log lines={flight.lines} />
        <section class="alarm" style={{ '--i': flight.lines.length }}>
          <p class="alarm-head">Crisis · {flight.crisis.phase}</p>
          <div class="alarm-body">
            {lead && <CrewPortrait id={lead.id} name={lead.name} scale={4} />}
            <div>
              <h1>{event.title}</h1>
              <p class="event-text">{fillText(s, flight, event.text)}</p>
            </div>
          </div>
        </section>
        <div class="options">
          {crisisOptions(s, r, event).map((o, i) => (
            <button
              type="button"
              key={o.index}
              class={`option${o.unlockedBy ? ' blue' : ''}`}
              data-act="option"
              data-arg={o.index}
              onClick={() => act({ type: 'chooseOption', index: o.index })}
            >
              <span class="key">{i + 1}</span>
              <span class="grow">
                {o.unlockedBy && <b class="blue-tag">★ {o.unlockedBy}: </b>}
                {o.text}
                <small>{BEST_CASE[o.bestCase]}</small>
              </span>
              <Odds p={o.odds} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportScreen(p: ScreenProps) {
  const { s, act } = p;
  const stamp = s.lastResult ? STAMP[s.lastResult] : null;
  return (
    <div class="flight">
      <FlyingRocket {...p} />
      <div>
        <h2>Report</h2>
        <Log lines={s.report} />
        <div class="after" style={{ '--i': s.report.length }}>
          {stamp && <span class={`stamp ${stamp[0]}`}>{stamp[1]}</span>}
          <button type="button" class="primary" data-act="continue" onClick={() => act({ type: 'continue' })}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
