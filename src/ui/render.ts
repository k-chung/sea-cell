// Screens. Each function turns game state into HTML. No game rules here: numbers come from core.
// Buttons carry data-act="..." and data-arg="..."; main.ts maps those to actions.

import type { Ruleset } from '../content/types.ts';
import {
  crisisOptions, dateLabel, fillText, income, lookup, missionStatus, partReliability, previewLaunch,
  programOptions, rewardLabel, testFlightCost, type GameState, type LaunchPlan,
} from '../core/index.ts';
import { button, esc, signed } from './html.ts';
import { loadHall } from './storage.ts';

/** What the player has picked on the plan screen but not launched yet (UI-only). */
export interface Draft {
  missionId: string | null;
  booster: string | null;
  upper: string | null;
  payload: string | null;
  crewIds: string[];
  testFlight: boolean;
  redundancy: boolean;
}

export const emptyDraft = (): Draft => ({
  missionId: null, booster: null, upper: null, payload: null, crewIds: [], testFlight: false, redundancy: false,
});

export interface View {
  state: GameState | null;
  ruleset: Ruleset;
  draft: Draft;
  hasSave: boolean;
  storyMode: boolean;
  error: string | null;
  /** The playtest note box is open. */
  noteOpen: boolean;
}

/** A launch plan from the draft, or null if a slot is still empty. */
export function draftPlan(d: Draft): LaunchPlan | null {
  if (!d.missionId || !d.booster || !d.upper || !d.payload) return null;
  return {
    missionId: d.missionId,
    rocket: { booster: d.booster, upper: d.upper, payload: d.payload },
    crewIds: d.crewIds, testFlight: d.testFlight, redundancy: d.redundancy,
  };
}

export function renderApp(v: View): string {
  const error = v.error ? `<div class="error" role="alert">${esc(v.error)}</div>` : '';
  if (!v.state) return error + titleScreen(v);
  const s = v.state;
  const screen =
    s.phase === 'plan' ? planScreen(v, s)
    : s.phase === 'crisis' ? crisisScreen(v, s)
    : s.phase === 'reward' ? rewardScreen(v, s)
    : s.phase === 'report' ? reportScreen(s)
    : overScreen(v, s);
  return header(v, s) + error + (v.noteOpen ? noteBox() : '') + `<main>${screen}</main>` + footer(v, s);
}

// ------------------------------------------------------------------ shared parts

function noteBox(): string {
  return `
  <section class="box note" aria-label="Playtest note">
    <label for="note-text"><b>Playtest note.</b> What did you notice or feel right now?
      The exact game moment is saved with it, so it can be replayed.</label>
    <textarea id="note-text" rows="3"></textarea>
    ${button({ act: 'note-save', label: 'Save note', cls: 'primary' })}
    ${button({ act: 'note-cancel', label: 'Cancel' })}
  </section>`;
}

function header(v: View, s: GameState): string {
  const r = v.ruleset;
  const intel = s.rival.intelTarget
    ? `Intel: Soviets likely working on <b>${esc(lookup.getMilestone(r, s.rival.intelTarget).name)}</b> (${esc(s.rival.intelStage)}; estimate)`
    : 'Intel: no rival activity known';
  return `
  <header>
    <div class="topline">
      <span class="brand">SEA CELL</span>
      <span>${esc(dateLabel(r, s.turn))} · Turn ${s.turn + 1} of ${r.balance.turns}</span>
      <span class="tools">
        ${button({ act: 'note', label: 'Note (N)', title: 'Save a playtest note with this exact moment' })}
        ${button({ act: 'dev', label: 'Dev (`)', title: 'Developer panel' })}
        ${button({ act: 'text-smaller', label: 'A−', title: 'Smaller text' })}
        ${button({ act: 'text-larger', label: 'A+', title: 'Larger text' })}
        ${button({ act: 'menu', label: 'Menu' })}
      </span>
    </div>
    <div class="stats">
      <span>Budget <b>${s.budget}</b> <small>(${signed(income(s, r))}/turn)</small></span>
      ${meter('Public', s.public)}
      ${meter('Congress', s.congress)}
      <span>Prestige <b>${s.prestige}</b></span>
    </div>
    <div class="intel">${intel}</div>
  </header>`;
}

function meter(name: string, value: number): string {
  const warn = value <= 20 ? ' <b class="warn">LOW</b>' : '';
  return `<span class="meter">${name} <b>${value}</b>/100${warn}
    <span class="bar" aria-hidden="true"><span style="width:${value}%"></span></span></span>`;
}

function footer(v: View, s: GameState): string {
  const r = v.ruleset;
  const crew = s.crew.map((a) => {
    const trait = lookup.getTrait(r, a.traitId);
    const status = a.status === 'ready' ? '' : a.status === 'injured' ? ` · INJURED (${a.injuredTurns})` : ' · KIA';
    return `<li class="${a.status}">${esc(a.name)} · ${esc(trait.name)} · ${a.flights} flight(s)${esc(status)}</li>`;
  }).join('');
  const people = s.personnel.map((id) => {
    const p = lookup.getPersonnel(r, id);
    return `<li>${esc(p.name)}: ${esc(p.description)}</li>`;
  }).join('') || '<li>None yet</li>';
  const favors = s.favors.map((id) => `<li>${esc(lookup.getFavor(r, id).name)}</li>`).join('') || '<li>None</li>';
  const reached = Object.keys(s.milestones).map((id) => esc(lookup.getMilestone(r, id).name)).join(', ') || 'none';
  const rival = Object.keys(s.rival.milestones).map((id) => esc(lookup.getMilestone(r, id).name)).join(', ') || 'none';
  const history = [...s.history].reverse().slice(0, 60).map((l) => `<li>${esc(l)}</li>`).join('');
  return `
  <section class="roster">
    <div><h3>Astronauts</h3><ul>${crew}</ul></div>
    <div><h3>Key people</h3><ul>${people}</ul><h3>Favors held</h3><ul>${favors}</ul></div>
    <div><h3>Race</h3><p>You: ${reached}</p><p>Soviets: ${rival}</p></div>
  </section>
  <details class="history"><summary>Program history</summary><ul>${history}</ul></details>`;
}

// ------------------------------------------------------------------ title

function titleScreen(v: View): string {
  const hall = loadHall();
  const runs = hall.runs.slice(0, 8).map((h) =>
    `<li>${h.won ? 'WON' : 'Lost'} · ${esc(h.date)} · prestige ${h.prestige} · ${esc(h.reason)}${h.storyMode ? ' · story mode' : ''}</li>`,
  ).join('') || '<li>No runs yet.</li>';
  const fallen = hall.fallen.slice(0, 20).map((f) => `<li>${esc(f.name)} · ${esc(f.mission)} · ${esc(f.date)}</li>`).join('')
    || '<li>No one. Yet.</li>';
  return `
  <main class="title">
    <h1>SEA CELL</h1>
    <p class="subtitle">An alternate-history space race. Beat the Soviets to the Moon before Congress
      and the public lose faith. Every crewed launch is a gamble.</p>
    <div class="row">
      ${v.hasSave ? button({ act: 'continue-save', label: 'Continue run', cls: 'primary' }) : ''}
      ${button({ act: 'new-run', label: 'New run', cls: v.hasSave ? '' : 'primary' })}
      <label class="check"><input type="checkbox" data-act="story-mode" ${v.storyMode ? 'checked' : ''}>
        Story mode (astronauts are injured instead of killed)</label>
    </div>
    <section class="box"><h2>How to play</h2>
      <ul>
        <li>Each turn is 6 months. Pick a mission and build a rocket from your hand of 5 part cards,
          or run a program instead (research, lobbying, PR, recruiting).</li>
        <li>Each flight phase rolls against your rocket's reliability. A failure means a crisis: you make the call.</li>
        <li>Lose if Public or Congress support hits 0, if the Soviets land on the Moon first, or when the decade ends.</li>
        <li>Keyboard: Tab between buttons, Enter to press, 1-9 to pick crisis options and rewards, N to leave a playtest note, \` for the dev panel.</li>
      </ul>
    </section>
    <section class="box"><h2>Hall of Fame</h2><h3>Recent runs</h3><ul>${runs}</ul>
      <h3>In memoriam</h3><ul>${fallen}</ul></section>
  </main>`;
}

// ------------------------------------------------------------------ plan

function planScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const d = v.draft;

  const missions = r.content.missions.map((m) => {
    const st = missionStatus(s, r, m);
    const status = st.status === 'done' ? 'DONE (fly again for experience)'
      : st.status === 'available' ? 'AVAILABLE' : `LOCKED: needs ${st.missing.join(', ')}`;
    const rivalHas = s.rival.milestones[m.milestone] !== undefined && st.status !== 'done' ? ' · Soviets did it first' : '';
    const crew = m.crewNeeded ? `${m.crewNeeded} crew` : 'uncrewed';
    const label = `<b>${esc(m.name)}</b><br><small>${esc(status)}${esc(rivalHas)}<br>
      Lift ${m.liftNeeded} · ${crew} · phases: ${esc(m.phases.join(', '))}</small>`;
    return button({
      act: 'mission', arg: m.id, label, cls: `card mission ${st.status}`,
      pressed: d.missionId === m.id, disabled: st.status === 'locked',
      title: m.description,
    });
  }).join('');

  const programs = programOptions(s, r).map((p) => button({
    act: 'program', arg: p.program, cls: 'card program', disabled: !!p.blockedReason,
    label: `<b>${esc(p.label)}</b>${p.cost ? ` · cost ${p.cost}` : ''}<br><small>${esc(p.blockedReason ?? p.detail)}</small>`,
  })).join('');

  return `
  <div class="plan">
    <section class="box">
      <h2>1 · Choose a mission</h2>
      <div class="cards">${missions}</div>
      <h2>…or run a program instead (ends the turn)</h2>
      <div class="cards">${programs}</div>
    </section>
    <section class="box" id="builder">${d.missionId ? builder(v, s, d.missionId) : '<h2>2 · Build the rocket</h2><p>Choose a mission first.</p>'}</section>
  </div>`;
}

function builder(v: View, s: GameState, missionId: string): string {
  const r = v.ruleset;
  const d = v.draft;
  const mission = lookup.getMission(r, missionId);

  const slotCards = (slot: 'booster' | 'upper' | 'payload') => {
    const cards = s.hand.map((id) => lookup.getPart(r, id)).filter((p) => p.slot === slot).map((p) => {
      const rel = partReliability(s, r, p.id);
      const seats = p.crewSeats ? ` · ${p.crewSeats} seat(s)` : '';
      const lift = p.slot === 'payload' ? (p.payloadKind ?? '') : `lift ${p.lift}`;
      const selected = d[slot] === p.id;
      return button({
        act: 'part', arg: `${slot}|${p.id}`, cls: 'card part', pressed: selected, title: p.description,
        label: `<b>${selected ? '✔ ' : ''}${esc(p.name)}</b><br><small>${esc(lift)} · ${rel}% · cost ${p.cost} · ${esc(p.fuel)}${seats}</small>`,
      });
    }).join('');
    return cards || '<p class="muted">No card for this slot in your hand.</p>';
  };

  const crewSection = mission.crewNeeded === 0 ? '' : `
    <h3>Crew (pick ${mission.crewNeeded}; first picked is commander)</h3>
    <div class="cards">${s.crew.filter((a) => a.status !== 'dead').map((a) => {
      const trait = lookup.getTrait(r, a.traitId);
      const pos = d.crewIds.indexOf(a.id);
      return button({
        act: 'crew', arg: a.id, cls: 'card crew', pressed: pos >= 0, disabled: a.status !== 'ready',
        title: trait.description,
        label: `<b>${pos >= 0 ? `✔ ${pos + 1}. ` : ''}${esc(a.name)}</b><br><small>${esc(trait.name)} · ${a.flights} flight(s)${a.status === 'injured' ? ' · injured' : ''}</small>`,
      });
    }).join('')}</div>`;

  const plan = draftPlan(d);
  let previewHtml = '<p class="muted">Pick a booster, an upper stage and a payload.</p>';
  let canLaunch = false;
  if (plan) {
    const p = previewLaunch(s, r, plan);
    canLaunch = p.problems.length === 0;
    const phases = p.phases.map((x) => `<li>${esc(x.phase)} · ${esc(x.partName)} · <b>${x.reliability}%</b></li>`).join('');
    const total = Math.round(p.phases.reduce((acc, x) => acc * (x.reliability / 100), 1) * 100);
    previewHtml = `
      <p>Lift <b>${p.lift}</b> of ${p.liftNeeded} needed · Cost <b>${p.cost}</b> of ${s.budget}</p>
      <p>Phase reliability (a failed roll triggers a crisis):</p><ul>${phases}</ul>
      <p>Chance every phase goes smoothly: <b>${total}%</b></p>
      ${p.synergies.length ? `<p>Synergies:</p><ul>${p.synergies.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${p.problems.length ? `<p class="warn">Can't launch:</p><ul class="warn">${p.problems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
  }

  return `
    <h2>2 · Build the rocket: ${esc(mission.name)}</h2>
    <p class="muted">${esc(mission.description)} Needs lift ${mission.liftNeeded}, payload: ${esc(mission.payloadKinds.join(' or '))}.</p>
    <h3>Booster (launch)</h3><div class="cards">${slotCards('booster')}</div>
    <h3>Upper stage (orbit, rendezvous, transfer)</h3><div class="cards">${slotCards('upper')}</div>
    <h3>Payload (spacewalk, landing, reentry)</h3><div class="cards">${slotCards('payload')}</div>
    ${crewSection}
    <h3>Reduce the risk</h3>
    <label class="check"><input type="checkbox" data-act="test-flight" ${d.testFlight ? 'checked' : ''}>
      Test flight (cost ${testFlightCost(s, r)}): +${r.balance.testFlightBonus}% launch reliability</label>
    <label class="check"><input type="checkbox" data-act="redundancy" ${d.redundancy ? 'checked' : ''}>
      Redundancy (cost ${r.balance.redundancyCost}): re-roll the first failed phase once</label>
    <div class="preview">${previewHtml}</div>
    ${button({ act: 'launch', label: 'LAUNCH', cls: 'primary', disabled: !canLaunch })}`;
}

// ------------------------------------------------------------------ crisis

/** Shown when even the good outcome ends the mission without reaching the objective. */
const BEST_CASE = {
  success: '',
  abort: ' <small>(ends the mission: crew safe, no objective)</small>',
  lost: ' <small>(vehicle lost)</small>',
  disaster: ' <small>(crew lost)</small>',
} as const;

function crisisScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const flight = s.flight;
  if (!flight?.crisis) return '<p>No crisis.</p>';
  const event = lookup.getEvent(r, flight.crisis.eventId);
  const options = crisisOptions(s, r, event).map((o, i) => {
    const blue = o.unlockedBy ? `<span class="blue-tag">★ ${esc(o.unlockedBy)}</span> ` : '';
    return button({
      act: 'option', arg: o.index, cls: `card option${o.unlockedBy ? ' blue' : ''}`,
      label: `<span class="key">${i + 1}</span> ${blue}${esc(o.text)}${BEST_CASE[o.bestCase]} <b class="odds">${o.odds}%</b>`,
    });
  }).join('');
  return `
  <section class="box crisis">
    <ul class="log">${flight.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <h2>CRISIS · ${esc(flight.crisis.phase)} · ${esc(event.title)}</h2>
    <p class="event-text">${esc(fillText(s, flight, event.text))}</p>
    <p class="muted">Odds show the chance of the good outcome. ★ options are unlocked by your crew, hardware, people or favors.</p>
    <div class="options">${options}</div>
  </section>`;
}

// ------------------------------------------------------------------ reward

function rewardScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const title = s.rewardSource === 'research' ? 'Research: choose a part to unlock' : 'A first! Choose a reward';
  const choices = s.rewardChoices.map((c, i) => {
    const l = rewardLabel(r, c);
    return button({ act: 'reward', arg: i, cls: 'card reward', label: `<span class="key">${i + 1}</span> <b>${esc(l.title)}</b><br><small>${esc(l.detail)}</small>` });
  }).join('');
  return `
  <section class="box">
    <h2>${esc(title)}</h2>
    <div class="options">${choices}</div>
    ${button({ act: 'reward', arg: -1, label: 'Skip' })}
  </section>`;
}

// ------------------------------------------------------------------ report

function reportScreen(s: GameState): string {
  const lines = s.report.map((l) => `<li>${esc(l)}</li>`).join('');
  return `
  <section class="box report">
    <h2>Report</h2>
    <ul class="log">${lines}</ul>
    ${button({ act: 'continue', label: 'Continue', cls: 'primary' })}
  </section>`;
}

// ------------------------------------------------------------------ game over

function overScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const won = s.outcome?.won;
  const reached = Object.keys(s.milestones).map((id) => `<li>${esc(lookup.getMilestone(r, id).name)}</li>`).join('') || '<li>None</li>';
  const fallen = s.fallen.map((f) => `<li>${esc(f.name)}, ${esc(f.mission)}</li>`).join('') || '<li>No one.</li>';
  return `
  <section class="box over">
    <h2>${won ? 'VICTORY' : 'PROGRAM ENDED'}</h2>
    <p class="event-text">${esc(s.outcome?.reason ?? '')}</p>
    <p>${esc(dateLabel(r, s.turn))} · Prestige ${s.prestige} · Seed ${s.seed}</p>
    <h3>Milestones reached</h3><ul>${reached}</ul>
    <h3>Lost</h3><ul>${fallen}</ul>
    ${button({ act: 'new-run', label: 'New run', cls: 'primary' })}
    ${button({ act: 'menu', label: 'Title screen' })}
  </section>`;
}
