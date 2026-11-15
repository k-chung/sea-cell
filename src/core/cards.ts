// Cards: dealing the offer each turn, what each card costs, and playing it.
//
// Four kinds share one small shape (CardRef = kind + id):
// - program:   a managerial decision; applies its effects (content: programs.ts)
// - part:      acquire a rocket part permanently (content: parts.ts)
// - staff:     hire a key person (content: people.ts)
// - astronaut: recruit an astronaut with the card's trait (content: crew traits)

import type { CardRef, Effect, Ruleset } from '../content/types.ts';
import { recruitAstronaut } from './astronauts.ts';
import { getPart, getPersonnel, getTrait } from './lookup.ts';
import { shuffle } from './rng.ts';
import type { GameState } from './state.ts';

export interface CardView {
  card: CardRef;
  title: string;
  text: string;
  cost: number;
  actions: number;
  /** null = playable; otherwise why not. */
  blockedReason: string | null;
}

/** Cost, action points and labels for any card. */
export function describeCard(r: Ruleset, card: CardRef): Omit<CardView, 'blockedReason' | 'card'> {
  const b = r.balance;
  switch (card.kind) {
    case 'program': {
      const def = r.content.programCards.find((c) => c.id === card.id);
      if (!def) throw new Error(`Unknown program card id "${card.id}"`);
      return {
        title: def.name,
        text: `${def.text} ${def.effects.map(effectLabel).join(', ')}`,
        cost: def.cost,
        actions: def.actions,
      };
    }
    case 'part': {
      const p = getPart(r, card.id);
      const stat = p.slot === 'payload' ? (p.crewSeats ? `${p.crewSeats} seats` : p.payloadKind) : `lift ${p.lift}`;
      return {
        title: p.name,
        text: `New ${p.slot}: ${stat}, ${p.reliability}%${p.fuel === 'none' ? '' : `, ${p.fuel}`}. ${p.description}`,
        cost: Math.round(p.cost * b.partCostMultiplier),
        actions: b.partCardActions,
      };
    }
    case 'staff': {
      const p = getPersonnel(r, card.id);
      return { title: p.name, text: `${p.title}. ${p.description}`, cost: b.staffHireCost, actions: 1 };
    }
    case 'astronaut': {
      const t = getTrait(r, card.id);
      return { title: `Recruit: ${t.name}`, text: t.description, cost: b.recruitCost, actions: 1 };
    }
  }
}

export function cardView(s: GameState, r: Ruleset, card: CardRef): CardView {
  const d = describeCard(r, card);
  const blockedReason =
    d.actions > s.actions ? `Needs ${d.actions} action point(s)` : d.cost > s.budget ? `Needs ${d.cost} budget` : null;
  return { card, ...d, blockedReason };
}

export function offerViews(s: GameState, r: Ruleset): CardView[] {
  return s.offer.map((card) => cardView(s, r, card));
}

/** Every card that could be dealt right now. */
function cardPool(s: GameState, r: Ruleset): CardRef[] {
  const alive = s.crew.filter((a) => a.status !== 'dead').length;
  return [
    ...r.content.programCards.map((c) => ({ kind: 'program' as const, id: c.id })),
    ...r.content.parts.filter((p) => !s.unlockedParts.includes(p.id)).map((p) => ({ kind: 'part' as const, id: p.id })),
    ...r.content.personnel
      .filter((p) => !s.personnel.includes(p.id))
      .map((p) => ({ kind: 'staff' as const, id: p.id })),
    ...(alive < 10 ? r.content.traits.map((t) => ({ kind: 'astronaut' as const, id: t.id })) : []),
  ];
}

const sameCard = (a: CardRef, b: CardRef) => a.kind === b.kind && a.id === b.id;

/** Deal `count` new cards into the offer (no duplicates). At least one dealt card is free of budget cost. */
export function dealCards(s: GameState, r: Ruleset, count: number): void {
  const pool = shuffle(
    s.rng,
    cardPool(s, r).filter((c) => !s.offer.some((o) => sameCard(o, c))),
  );
  const dealt = pool.slice(0, count);
  const hasFree = [...s.offer, ...dealt].some((c) => describeCard(r, c).cost === 0);
  const free = pool.slice(count).find((c) => describeCard(r, c).cost === 0);
  if (!hasFree && free && dealt.length) dealt[dealt.length - 1] = free;
  s.offer.push(...dealt);
}

/** Apply one effect. Every Effect kind is handled here and unit-tested. */
export function applyEffect(s: GameState, r: Ruleset, e: Effect): void {
  switch (e.kind) {
    case 'budget':
      s.budget += e.amount;
      return;
    case 'public':
      s.public = Math.max(0, Math.min(100, s.public + e.amount));
      return;
    case 'congress':
      s.congress = Math.max(0, Math.min(100, s.congress + e.amount));
      return;
    case 'prestige':
      s.prestige += e.amount;
      return;
    case 'actionsNextTurn':
      s.actionsNextTurn += e.amount;
      return;
    case 'nextLaunchBonus':
      s.nextLaunchBonus += e.amount;
      return;
    case 'drawCards':
      dealCards(s, r, e.amount);
      return;
  }
}

/** A short label like "+8 public" for an effect. */
export function effectLabel(e: Effect): string {
  const n = e.amount > 0 ? `+${e.amount}` : `${e.amount}`;
  switch (e.kind) {
    case 'budget':
      return `${n} budget`;
    case 'public':
      return `${n} public`;
    case 'congress':
      return `${n} Congress`;
    case 'prestige':
      return `${n} prestige`;
    case 'actionsNextTurn':
      return `${n} action(s) next turn`;
    case 'nextLaunchBonus':
      return `${n}% next launch`;
    case 'drawCards':
      return `draw ${e.amount}`;
  }
}

/** Play the card at `index` in the offer: pay, apply, remove it. Returns a report line. */
export function playCard(s: GameState, r: Ruleset, index: number): string {
  const card = s.offer[index];
  if (!card) throw new Error(`No card at offer index ${index}`);
  const view = cardView(s, r, card);
  if (view.blockedReason) throw new Error(`Can't play ${view.title}: ${view.blockedReason}`);
  s.budget -= view.cost;
  s.actions -= view.actions;
  s.offer.splice(index, 1);

  switch (card.kind) {
    case 'program': {
      const def = r.content.programCards.find((c) => c.id === card.id);
      for (const e of def?.effects ?? []) applyEffect(s, r, e);
      return `Played ${view.title}.`;
    }
    case 'part':
      s.unlockedParts.push(card.id);
      return `Acquired ${view.title}.`;
    case 'staff':
      s.personnel.push(card.id);
      return `Hired ${view.title}.`;
    case 'astronaut': {
      const a = recruitAstronaut(s, r, card.id);
      return `Recruited ${a.name} (${getTrait(r, card.id).name}).`;
    }
  }
}
