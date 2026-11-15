// Screens for the Mission Control CRT console. Each function turns game state into HTML.
// No game rules here: every number comes from core. Buttons carry data-act / data-arg;
// main.ts maps those to actions.
//
// Layout: one fixed console screen.
//   status bar (top) · VEHICLE panel (left) · main panel (center) · RACE + CREW panel (right)
// On narrow screens the panels stack and the page scrolls.

import type { Ruleset } from '../content/types.ts';
import {
  crisisOptions,
  dateLabel,
  fillText,
  type GameState,
  income,
  type LaunchPlan,
  lookup,
  missionStatus,
  partReliability,
  previewLaunch,
  programOptions,
  type RocketChoice,
  rewardLabel,
  testFlightCost,
} from '../core/index.ts';
import { face, rivalIcon, rocketRows, sprite, titleRocket } from './art.ts';
import { button, esc } from './html.ts';
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
  missionId: null,
  booster: null,
  upper: null,
  payload: null,
  crewIds: [],
  testFlight: false,
  redundancy: false,
});

export interface View {
  state: GameState | null;
  ruleset: Ruleset;
  draft: Draft;
  /** The rocket of the most recent launch (the flight state is gone once a mission resolves). */
  lastRocket: RocketChoice | null;
  hasSave: boolean;
  storyMode: boolean;
  soundOn: boolean;
  error: string | null;
  noteOpen: boolean;
}

export function draftPlan(d: Draft): LaunchPlan | null {
  if (!d.missionId || !d.booster || !d.upper || !d.payload) return null;
  return {
    missionId: d.missionId,
    rocket: { booster: d.booster, upper: d.upper, payload: d.payload },
    crewIds: d.crewIds,
    testFlight: d.testFlight,
    redundancy: d.redundancy,
  };
}

// ------------------------------------------------------------------ small pieces

/** A text meter like [######----]. */
const bar = (value: number, max = 100, width = 10) => {
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
};
const pad3 = (n: number) => String(Math.max(0, n)).padStart(3, '0');
const FUEL: Record<string, string> = { kerolox: 'KER', hydrolox: 'HYD', hypergolic: 'HYP', solid: 'SOL', none: '---' };
const short = (name: string) => name.replace(/^First /, '').toUpperCase();

/** Lines that appear one by one (CSS animation; --i sets each line's delay). */
const revealList = (lines: string[]) =>
  `<ul class="log">${lines.map((l, i) => `<li style="--i:${i}">${esc(l)}</li>`).join('')}</ul>`;

// ------------------------------------------------------------------ app

export function renderApp(v: View): string {
  const error = v.error ? `<div class="error" role="alert">ERROR: ${esc(v.error)}</div>` : '';
  if (!v.state) return `<div class="console title-screen">${error}${titleScreen(v)}</div>`;
  const s = v.state;
  const main =
    s.phase === 'plan'
      ? planScreen(v, s)
      : s.phase === 'crisis'
        ? crisisScreen(v, s)
        : s.phase === 'reward'
          ? rewardScreen(v, s)
          : s.phase === 'report'
            ? reportScreen(s)
            : overScreen(v, s);
  return `
  <div class="console phase-${s.phase}">
    ${statusBar(v, s)}
    ${error}
    ${v.noteOpen ? noteBox() : ''}
    <div class="panels">
      <aside class="panel vehicle" aria-label="Vehicle">${vehiclePanel(v, s)}</aside>
      <main class="panel main">${main}</main>
      <aside class="panel side" aria-label="Race and crew">${sidePanel(v, s)}</aside>
    </div>
  </div>`;
}

function statusBar(v: View, s: GameState): string {
  const r = v.ruleset;
  const low = (n: number) => (n <= 20 ? 'low' : '');
  return `
  <header class="status">
    <span class="brand">SEA CELL // FLIGHT CONTROL</span>
    <span>${esc(dateLabel(r, s.turn).toUpperCase())} · T${s.turn + 1}/${r.balance.turns}</span>
    <span>BUDGET ${pad3(s.budget)} <small>+${income(s, r)}/T</small></span>
    <span class="${low(s.public)}" title="Public support. The program ends at 0.">PUBLIC ${bar(s.public)} ${s.public}</span>
    <span class="${low(s.congress)}" title="Congress support. The program ends at 0.">CONGRESS ${bar(s.congress)} ${s.congress}</span>
    <span>PRESTIGE ${pad3(s.prestige)}</span>
    <span class="tools">
      ${button({ act: 'note', label: '[N]OTE', title: 'Save a playtest note with this exact moment' })}
      ${button({ act: 'sound', label: v.soundOn ? 'SND:ON' : 'SND:OFF', title: 'Sound effects' })}
      ${button({ act: 'text-smaller', label: 'A-', title: 'Smaller text' })}
      ${button({ act: 'text-larger', label: 'A+', title: 'Larger text' })}
      ${button({ act: 'dev', label: 'DEV', title: 'Developer panel (backtick key)' })}
      ${button({ act: 'menu', label: 'MENU' })}
    </span>
  </header>`;
}

function noteBox(): string {
  return `
  <section class="note" aria-label="Playtest note">
    <label for="note-text">PLAYTEST NOTE: WHAT DID YOU NOTICE OR FEEL RIGHT NOW? THE EXACT MOMENT IS SAVED WITH IT.</label>
    <textarea id="note-text" rows="2"></textarea>
    ${button({ act: 'note-save', label: '[SAVE NOTE]', cls: 'primary' })}
    ${button({ act: 'note-cancel', label: '[CANCEL]' })}
  </section>`;
}

// ------------------------------------------------------------------ vehicle panel (left)

function vehiclePanel(v: View, s: GameState): string {
  const r = v.ruleset;
  const part = (id: string | null) => (id ? lookup.getPart(r, id) : null);
  const flying = s.phase === 'crisis' || s.phase === 'report';
  const rocket =
    s.phase === 'plan'
      ? { booster: v.draft.booster, upper: v.draft.upper, payload: v.draft.payload }
      : flying
        ? (s.flight?.rocket ?? (s.launchedThisTurn ? v.lastRocket : null))
        : null;

  let art = '<p class="dim">NO VEHICLE ON PAD</p>';
  if (rocket && (rocket.booster || rocket.upper || rocket.payload)) {
    const rows = rocketRows(part(rocket.booster), part(rocket.upper), part(rocket.payload), flying);
    const crashed = s.phase === 'report' && (s.lastResult === 'lost' || s.lastResult === 'disaster');
    art = `<div class="rocket${flying ? ' liftoff' : ''}${crashed ? ' crashed' : ''}">${sprite(rows, 7, 'Your rocket')}</div>`;
  }

  let phases = '';
  const plan = draftPlan(v.draft);
  if (s.phase === 'plan' && plan) {
    const p = previewLaunch(s, r, plan);
    phases = `<ul class="phases">${p.phases
      .map(
        (x) =>
          `<li><span>${esc(x.phase.toUpperCase())}</span><span>${bar(x.reliability, 100, 8)} ${x.reliability}%</span></li>`,
      )
      .join('')}</ul>`;
  }
  return `<h2>VEHICLE</h2><div class="pad">${art}</div>${phases}`;
}

// ------------------------------------------------------------------ side panel (right)

function sidePanel(v: View, s: GameState): string {
  const r = v.ruleset;
  const ladder = r.content.milestones
    .map((m) => {
      const you = s.milestones[m.id] !== undefined;
      const them = s.rival.milestones[m.id] !== undefined;
      return `<li><span class="${you ? 'got' : 'dim'}" title="You">${you ? '■' : '□'}</span><span class="${them ? 'red' : 'dim'}" title="USSR">${them ? '■' : '□'}</span> ${esc(short(m.name))}</li>`;
    })
    .join('');
  const intel = s.rival.intelTarget
    ? `${esc(short(lookup.getMilestone(r, s.rival.intelTarget).name))} · ${esc((s.rival.intelStage ?? '').toUpperCase())}`
    : 'NO ACTIVITY';

  const crew = s.crew
    .map((a) => {
      const trait = lookup.getTrait(r, a.traitId);
      const status =
        a.status === 'dead' ? 'KIA' : a.status === 'injured' ? `INJURED ${a.injuredTurns}T` : `${a.flights} FLT`;
      return `<li class="${a.status}" title="${esc(trait.description)}">${face(a.id, a.name, 3, a.status === 'dead')}
      <span>${esc(a.name.toUpperCase())}<br><small>${esc(trait.name.toUpperCase())} · ${status}</small></span></li>`;
    })
    .join('');

  const staff = [
    ...s.personnel
      .map((id) => lookup.getPersonnel(r, id))
      .map((p) => `<li title="${esc(p.description)}">${esc(p.name.toUpperCase())}</li>`),
    ...s.favors.map((id) => `<li>${esc(lookup.getFavor(r, id).name.toUpperCase())}</li>`),
  ].join('');
  const history = [...s.history]
    .reverse()
    .slice(0, 40)
    .map((l) => `<li>${esc(l)}</li>`)
    .join('');

  return `
    <h2>RACE <small>YOU / USSR</small> ${rivalIcon(3)}</h2>
    <ul class="ladder">${ladder}</ul>
    <p class="intel">INTEL: ${intel} <small>(ESTIMATE)</small></p>
    <h2>CREW</h2><ul class="crew">${crew}</ul>
    ${staff ? `<h2>STAFF &amp; FAVORS</h2><ul class="plain">${staff}</ul>` : ''}
    <details class="history"><summary>LOG</summary><ul>${history}</ul></details>`;
}

// ------------------------------------------------------------------ title

function titleScreen(v: View): string {
  const hall = loadHall();
  const runs =
    hall.runs
      .slice(0, 6)
      .map(
        (h) =>
          `<li>${h.won ? 'WON ' : 'LOST'} · ${esc(h.date.toUpperCase())} · PRESTIGE ${h.prestige}${h.storyMode ? ' · STORY' : ''}</li>`,
      )
      .join('') || '<li class="dim">NO RUNS ON FILE</li>';
  const fallen =
    hall.fallen
      .slice(0, 12)
      .map(
        (f) => `<li>${esc(f.name.toUpperCase())} · ${esc(f.mission.toUpperCase())} · ${esc(f.date.toUpperCase())}</li>`,
      )
      .join('') || '<li class="dim">NO ONE. YET.</li>';
  return `
  <main class="title-card">
    <div class="rocket liftoff">${titleRocket(6)}</div>
    <div>
      <h1>SEA CELL</h1>
      <p>BEAT THE SOVIETS TO THE MOON BEFORE CONGRESS AND THE PUBLIC LOSE FAITH.</p>
      <div class="row">
        ${v.hasSave ? button({ act: 'continue-save', label: '[CONTINUE RUN]', cls: 'primary' }) : ''}
        ${button({ act: 'new-run', label: '[NEW RUN]', cls: v.hasSave ? '' : 'primary' })}
        <label class="check"><input type="checkbox" data-act="story-mode" ${v.storyMode ? 'checked' : ''}> STORY MODE (CREW ARE INJURED, NOT KILLED)</label>
      </div>
      <div class="title-cols">
        <section><h2>HOW TO FLY</h2><ul class="plain">
          <li>PICK A MISSION. BUILD A ROCKET FROM 5 PART CARDS.</li>
          <li>EACH PHASE ROLLS ITS RELIABILITY. A FAILURE IS A CRISIS: YOUR CALL.</li>
          <li>LOSE IF PUBLIC OR CONGRESS HITS 0, OR THE SOVIETS LAND FIRST.</li>
          <li>KEYS: TAB/ENTER · 1-9 PICK · N NOTE · \` DEV</li></ul></section>
        <section><h2>RECENT RUNS</h2><ul class="plain">${runs}</ul></section>
        <section><h2>IN MEMORIAM</h2><ul class="plain">${fallen}</ul></section>
      </div>
    </div>
  </main>`;
}

// ------------------------------------------------------------------ plan

function planScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const d = v.draft;
  const missions = r.content.missions
    .map((m) => {
      const st = missionStatus(s, r, m);
      const tag = st.status === 'done' ? 'DONE' : st.status === 'available' ? 'READY' : 'LOCKED';
      const first =
        s.rival.milestones[m.milestone] !== undefined && st.status !== 'done'
          ? ' <span class="red">USSR 1ST</span>'
          : '';
      const crew = m.crewNeeded ? `CREW ${m.crewNeeded}` : 'AUTO';
      const tip = st.status === 'locked' ? `Needs: ${st.missing.join(', ')}` : m.description;
      return button({
        act: 'mission',
        arg: m.id,
        cls: `row mission ${st.status}`,
        pressed: d.missionId === m.id,
        disabled: st.status === 'locked',
        title: tip,
        label: `<span class="grow">${esc(m.name.toUpperCase())}${first}</span><span>LIFT ${m.liftNeeded}</span><span>${crew}</span><span class="tag">${tag}</span>`,
      });
    })
    .join('');

  const programs = programOptions(s, r)
    .map((p) =>
      button({
        act: 'program',
        arg: p.program,
        cls: 'chip',
        disabled: !!p.blockedReason,
        title: p.blockedReason ?? p.detail,
        label: `${esc(p.label.toUpperCase())}${p.cost ? ` $${p.cost}` : ''}`,
      }),
    )
    .join('');

  return `
    <h2>MISSIONS</h2>
    <div class="list">${missions}</div>
    <p class="orders">NO LAUNCH THIS TURN: ${programs}</p>
    ${d.missionId ? builder(v, s, d.missionId) : '<p class="dim blink">&gt; SELECT A MISSION_</p>'}`;
}

function builder(v: View, s: GameState, missionId: string): string {
  const r = v.ruleset;
  const d = v.draft;
  const mission = lookup.getMission(r, missionId);

  const cards = (slot: 'booster' | 'upper' | 'payload') =>
    s.hand
      .map((id) => lookup.getPart(r, id))
      .filter((p) => p.slot === slot)
      .map((p) => {
        const stat =
          p.slot === 'payload'
            ? p.crewSeats
              ? `${p.crewSeats} SEAT`
              : (p.payloadKind ?? '').toUpperCase()
            : `LIFT ${p.lift}`;
        return button({
          act: 'part',
          arg: `${slot}|${p.id}`,
          cls: 'card',
          pressed: d[slot] === p.id,
          title: p.description,
          label: `<b>${esc(p.name.toUpperCase())}</b><span>${stat} · ${partReliability(s, r, p.id)}% · $${p.cost} · ${FUEL[p.fuel]}</span>`,
        });
      })
      .join('') || '<span class="dim">NONE IN HAND</span>';

  const crew =
    mission.crewNeeded === 0
      ? ''
      : `
    <div class="slot"><span class="slot-name">CREW ${d.crewIds.length}/${mission.crewNeeded}</span><div class="cards">
    ${s.crew
      .filter((a) => a.status !== 'dead')
      .map((a) => {
        const pos = d.crewIds.indexOf(a.id);
        return button({
          act: 'crew',
          arg: a.id,
          cls: 'card crew-card',
          pressed: pos >= 0,
          disabled: a.status !== 'ready',
          title: `${a.name}: ${lookup.getTrait(r, a.traitId).description}`,
          label: `${face(a.id, a.name, 2)}<span>${pos === 0 ? 'CDR ' : ''}${esc((a.name.split(' ').pop() ?? '').toUpperCase())}</span>`,
        });
      })
      .join('')}</div></div>`;

  const plan = draftPlan(d);
  const p = plan ? previewLaunch(s, r, plan) : null;
  const clean = p ? Math.round(p.phases.reduce((acc, x) => acc * (x.reliability / 100), 1) * 100) : 0;
  const readout = p
    ? `
    <div class="readout">
      <span>LIFT ${p.lift}/${p.liftNeeded}</span><span>COST $${p.cost}/${s.budget}</span>
      <span>CLEAN FLIGHT ${clean}%</span>
      ${p.synergies.map((x) => `<span class="good" title="${esc(x)}">+SYNERGY</span>`).join('')}
    </div>
    ${p.problems.length ? `<ul class="problems">${p.problems.map((x) => `<li>! ${esc(x.toUpperCase())}</li>`).join('')}</ul>` : ''}`
    : '';

  return `
    <h2>BUILD: ${esc(mission.name.toUpperCase())}</h2>
    <div class="slot"><span class="slot-name">PAYLOAD</span><div class="cards">${cards('payload')}</div></div>
    <div class="slot"><span class="slot-name">UPPER</span><div class="cards">${cards('upper')}</div></div>
    <div class="slot"><span class="slot-name">BOOSTER</span><div class="cards">${cards('booster')}</div></div>
    ${crew}
    <div class="options-row">
      <label class="check" title="+${r.balance.testFlightBonus}% launch reliability"><input type="checkbox" data-act="test-flight" ${d.testFlight ? 'checked' : ''}> TEST FLIGHT $${testFlightCost(s, r)}</label>
      <label class="check" title="Re-roll the first failed phase once"><input type="checkbox" data-act="redundancy" ${d.redundancy ? 'checked' : ''}> REDUNDANCY $${r.balance.redundancyCost}</label>
    </div>
    ${readout}
    ${button({ act: 'launch', label: '[ LAUNCH ]', cls: 'primary launch', disabled: !p || p.problems.length > 0 })}`;
}

// ------------------------------------------------------------------ crisis

const BEST_CASE = { success: '', abort: ' /ENDS MISSION/', lost: ' /VEHICLE LOST/', disaster: ' /CREW LOST/' } as const;

function crisisScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const flight = s.flight;
  if (!flight?.crisis) return '<p>NO CRISIS.</p>';
  const event = lookup.getEvent(r, flight.crisis.eventId);
  const n = flight.lines.length;
  const leadId = flight.crewIds[0];
  const lead = leadId ? lookup.getAstronaut(s, leadId) : null;
  const options = crisisOptions(s, r, event)
    .map((o, i) =>
      button({
        act: 'option',
        arg: o.index,
        cls: `option${o.unlockedBy ? ' blue' : ''}`,
        label: `<span>[${i + 1}]</span><span class="grow">${o.unlockedBy ? `★ ${esc(o.unlockedBy.toUpperCase())}: ` : ''}${esc(o.text.toUpperCase())}<small>${BEST_CASE[o.bestCase]}</small></span><span>${o.odds}%</span>`,
      }),
    )
    .join('');
  return `
    ${revealList(flight.lines)}
    <section class="alarm" style="--i:${n}">
      <div class="alarm-head">▲ MASTER ALARM · ${esc(flight.crisis.phase.toUpperCase())}</div>
      <div class="alarm-body">
        ${lead ? face(lead.id, lead.name, 4) : ''}
        <div><h1>${esc(event.title.toUpperCase())}</h1>
        <p class="event-text">${esc(fillText(s, flight, event.text))}</p></div>
      </div>
    </section>
    <div class="options reveal" style="--i:${n + 1}">${options}</div>`;
}

// ------------------------------------------------------------------ reward

function rewardScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const title = s.rewardSource === 'research' ? 'RESEARCH: PICK A PART TO UNLOCK' : 'A FIRST! PICK A REWARD';
  const choices = s.rewardChoices
    .map((c, i) => {
      const l = rewardLabel(r, c);
      return button({
        act: 'reward',
        arg: i,
        cls: 'option',
        label: `<span>[${i + 1}]</span><span class="grow"><b>${esc(l.title.toUpperCase())}</b><small> ${esc(l.detail)}</small></span>`,
      });
    })
    .join('');
  return `<h2>${title}</h2><div class="options">${choices}</div>${button({ act: 'reward', arg: -1, label: '[SKIP]' })}`;
}

// ------------------------------------------------------------------ report

const STAMPS = {
  success: ['good', 'MISSION SUCCESS'],
  abort: ['amber', 'ABORTED'],
  lost: ['red', 'VEHICLE LOST'],
  disaster: ['red', 'DISASTER'],
} as const;

function reportScreen(s: GameState): string {
  const stamp = s.lastResult ? STAMPS[s.lastResult] : null;
  return `
    <h2>REPORT</h2>
    ${revealList(s.report)}
    <div class="after reveal" style="--i:${s.report.length}">
      ${stamp ? `<div class="stamp ${stamp[0]} pop">${stamp[1]}</div>` : ''}
      ${button({ act: 'continue', label: '[ CONTINUE ]', cls: 'primary' })}
    </div>`;
}

// ------------------------------------------------------------------ game over

function overScreen(v: View, s: GameState): string {
  const r = v.ruleset;
  const reached =
    Object.keys(s.milestones)
      .map((id) => `<li>■ ${esc(short(lookup.getMilestone(r, id).name))}</li>`)
      .join('') || '<li class="dim">NONE</li>';
  const fallen =
    s.fallen.map((f) => `<li>${esc(f.name.toUpperCase())} · ${esc(f.mission.toUpperCase())}</li>`).join('') ||
    '<li class="dim">NO ONE</li>';
  return `
    <div class="stamp ${s.outcome?.won ? 'good' : 'red'} pop">${s.outcome?.won ? 'VICTORY' : 'PROGRAM ENDED'}</div>
    <p class="event-text">${esc(s.outcome?.reason ?? '')}</p>
    <p>${esc(dateLabel(r, s.turn).toUpperCase())} · PRESTIGE ${s.prestige} · SEED ${s.seed}</p>
    <h2>MILESTONES</h2><ul class="plain">${reached}</ul>
    <h2>LOST</h2><ul class="plain">${fallen}</ul>
    <div class="row">${button({ act: 'new-run', label: '[NEW RUN]', cls: 'primary' })} ${button({ act: 'menu', label: '[TITLE]' })}</div>`;
}
