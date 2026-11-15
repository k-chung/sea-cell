// Planning phase: play cards from the offer (action points + budget), then build a rocket and launch,
// or end the turn without launching.

import type { PartDef, Slot } from '../../content/types.ts';
import {
  type CardView,
  lookup,
  missionStatus,
  offerViews,
  partReliability,
  previewLaunch,
  testFlightCost,
} from '../../core/index.ts';
import { CrewPortrait, Rocket } from '../art.tsx';
import { draftPlan } from '../draft.ts';
import type { ScreenProps } from './props.ts';

const KIND_LABEL = { program: 'Decision', part: 'Part', staff: 'Staff', astronaut: 'Astronaut' } as const;

/** One card in the offer. Playing it is one click. */
export function OfferCard({ v, onPlay, index }: { v: CardView; onPlay: () => void; index: number }) {
  return (
    <button
      type="button"
      class={`card kind-${v.card.kind}`}
      data-act="card"
      data-arg={index}
      disabled={!!v.blockedReason}
      onClick={onPlay}
      title={v.blockedReason ?? v.text}
    >
      <span class="card-kind">{KIND_LABEL[v.card.kind]}</span>
      <b class="card-title">{v.title}</b>
      <span class="card-text">{v.text}</span>
      <span class="card-cost">
        {'●'.repeat(v.actions)}
        <span class="sr-only"> {v.actions} action point(s)</span>
        {v.cost ? ` $${v.cost}` : ' free'}
      </span>
      {v.blockedReason && <span class="card-blocked">{v.blockedReason}</span>}
    </button>
  );
}

export function PlanScreen(p: ScreenProps) {
  const { s, r, act } = p;
  const offer = offerViews(s, r);
  return (
    <div class="plan">
      <section aria-label="Cards">
        <h2>
          Cards <small>· {s.actions} action point(s) left</small>
        </h2>
        <div class="offer">
          {offer.map((v, i) => (
            <OfferCard key={`${v.card.kind}:${v.card.id}`} v={v} index={i} onPlay={() => act({ type: 'playCard', index: i })} />
          ))}
          {!offer.length && <p class="muted">No cards left this turn.</p>}
        </div>
      </section>
      <section aria-label="Launch">
        <MissionPicker {...p} />
        {p.draft.missionId && <Builder {...p} missionId={p.draft.missionId} />}
        <p class="turn-end">
          <button type="button" data-act="end-turn" onClick={() => act({ type: 'endTurn' })}>
            End turn without launching
          </button>
        </p>
      </section>
    </div>
  );
}

function MissionPicker({ s, r, draft, setDraft }: ScreenProps) {
  return (
    <>
      <h2>Mission</h2>
      <div class="missions">
        {r.content.missions.map((m) => {
          const st = missionStatus(s, r, m);
          const rivalFirst = s.rival.milestones[m.milestone] !== undefined && st.status !== 'done';
          return (
            <button
              type="button"
              key={m.id}
              class={`mission ${st.status}`}
              data-act="mission"
              data-arg={m.id}
              aria-pressed={draft.missionId === m.id}
              disabled={st.status === 'locked'}
              title={st.status === 'locked' ? `Needs: ${st.missing.join(', ')}` : m.description}
              onClick={() => setDraft({ ...draft, missionId: m.id, crewIds: draft.crewIds.slice(0, m.crewNeeded) })}
            >
              <b>{m.name}</b>
              <small>
                lift {m.liftNeeded} · {m.crewNeeded ? `${m.crewNeeded} crew` : 'uncrewed'} ·{' '}
                {st.status === 'done' ? 'done' : st.status === 'available' ? 'ready' : 'locked'}
                {rivalFirst && ' · Soviets first'}
              </small>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Builder({ s, r, draft, setDraft, act, missionId }: ScreenProps & { missionId: string }) {
  const mission = lookup.getMission(r, missionId);
  const owned = s.unlockedParts.map((id) => lookup.getPart(r, id));
  const part = (id: string | null) => (id ? lookup.getPart(r, id) : null);
  const plan = draftPlan(draft);
  const preview = plan ? previewLaunch(s, r, plan) : null;
  const clean = preview ? Math.round(preview.phases.reduce((a, x) => a * (x.reliability / 100), 1) * 100) : 0;

  const slotRow = (slot: Slot, label: string) => (
    <div class="slot">
      <span class="slot-name">{label}</span>
      <div class="chips">
        {owned
          .filter((x) => x.slot === slot)
          .map((x: PartDef) => (
            <button
              type="button"
              key={x.id}
              class="chip"
              data-act="part"
              data-arg={`${slot}|${x.id}`}
              aria-pressed={draft[slot] === x.id}
              title={x.description}
              onClick={() => setDraft({ ...draft, [slot]: draft[slot] === x.id ? null : x.id })}
            >
              {x.name}{' '}
              <small>
                {slot === 'payload' ? (x.crewSeats ? `${x.crewSeats} seat` : x.payloadKind) : `lift ${x.lift}`} ·{' '}
                {partReliability(s, r, x.id)}% · ${x.cost}
              </small>
            </button>
          ))}
      </div>
    </div>
  );

  const toggleCrew = (id: string) => {
    const has = draft.crewIds.includes(id);
    const next = has ? draft.crewIds.filter((x) => x !== id) : [...draft.crewIds, id].slice(-mission.crewNeeded);
    setDraft({ ...draft, crewIds: next });
  };

  return (
    <div class="builder">
      <div class="rocket-preview" aria-hidden={!plan}>
        <Rocket booster={part(draft.booster)} upper={part(draft.upper)} payload={part(draft.payload)} />
      </div>
      <div class="build-controls">
        {slotRow('payload', 'Payload')}
        {slotRow('upper', 'Upper stage')}
        {slotRow('booster', 'Booster')}
        {mission.crewNeeded > 0 && (
          <div class="slot">
            <span class="slot-name">
              Crew {draft.crewIds.length}/{mission.crewNeeded}
            </span>
            <div class="chips">
              {s.crew
                .filter((a) => a.status !== 'dead')
                .map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    class="chip crew-chip"
                    data-act="crew"
                    data-arg={a.id}
                    aria-pressed={draft.crewIds.includes(a.id)}
                    disabled={a.status !== 'ready'}
                    title={lookup.getTrait(r, a.traitId).description}
                    onClick={() => toggleCrew(a.id)}
                  >
                    <CrewPortrait id={a.id} name="" scale={2} /> {a.name}{' '}
                    <small>{lookup.getTrait(r, a.traitId).name}</small>
                  </button>
                ))}
            </div>
          </div>
        )}
        <div class="slot">
          <span class="slot-name">Reduce risk</span>
          <div class="chips">
            <label class="check">
              <input
                type="checkbox"
                checked={draft.testFlight}
                onChange={(e) => setDraft({ ...draft, testFlight: e.currentTarget.checked })}
              />{' '}
              Test flight ${testFlightCost(s, r)} (+{r.balance.testFlightBonus}% launch)
            </label>
            <label class="check">
              <input
                type="checkbox"
                checked={draft.redundancy}
                onChange={(e) => setDraft({ ...draft, redundancy: e.currentTarget.checked })}
              />{' '}
              Redundancy ${r.balance.redundancyCost} (re-roll first failure)
            </label>
          </div>
        </div>
        {preview && (
          <div class="preview">
            <p>
              Lift {preview.lift}/{preview.liftNeeded} · Cost ${preview.cost} of ${s.budget} · Clean flight{' '}
              <b>{clean}%</b>
              {s.nextLaunchBonus !== 0 && ` · card bonus ${s.nextLaunchBonus > 0 ? '+' : ''}${s.nextLaunchBonus}%`}
            </p>
            <ul class="phases">
              {preview.phases.map((x) => (
                <li key={x.phase}>
                  {x.phase} <meter min={0} max={100} value={x.reliability} /> {x.reliability}%
                </li>
              ))}
            </ul>
            {preview.problems.length > 0 && (
              <ul class="problems">
                {preview.problems.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button
          type="button"
          class="primary"
          data-act="launch"
          disabled={!plan || !preview || preview.problems.length > 0}
          onClick={() => plan && act({ type: 'launch', ...plan })}
        >
          Launch
        </button>
      </div>
    </div>
  );
}
