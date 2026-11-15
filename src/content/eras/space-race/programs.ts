// Program cards: the managerial decisions dealt into each turn's offer.
// cost = budget, actions = action points. Effects: see Effect in ../../types.ts.
// Many cards have strings attached on purpose: no free lunches.

import type { ProgramCardDef } from '../../types.ts';

export const programCards: ProgramCardDef[] = [
  { id: 'pr-tour', name: 'Astronaut PR Tour', text: 'Parades and handshakes.', cost: 10, actions: 1,
    effects: [{ kind: 'public', amount: 8 }] },
  { id: 'press-conference', name: 'Press Conference', text: 'Cheap, quick, a little hollow.', cost: 0, actions: 1,
    effects: [{ kind: 'public', amount: 4 }] },
  { id: 'tv-special', name: 'Live TV Special', text: 'The whole nation tunes in.', cost: 15, actions: 1,
    effects: [{ kind: 'public', amount: 10 }, { kind: 'congress', amount: 2 }] },
  { id: 'work-the-hill', name: 'Work the Hill', text: 'Backroom deals win votes, not hearts.', cost: 0, actions: 1,
    effects: [{ kind: 'congress', amount: 8 }, { kind: 'public', amount: -3 }] },
  { id: 'budget-hearing', name: 'Budget Hearing', text: 'Two days of testimony.', cost: 0, actions: 2,
    effects: [{ kind: 'congress', amount: 12 }] },
  { id: 'defense-contract', name: 'Defense Contract', text: 'Build missiles for the Air Force.', cost: 0, actions: 1,
    effects: [{ kind: 'budget', amount: 30 }, { kind: 'public', amount: -5 }] },
  { id: 'cost-cutting', name: 'Cost Cutting', text: 'Cheaper parts, thinner margins.', cost: 0, actions: 1,
    effects: [{ kind: 'budget', amount: 15 }, { kind: 'nextLaunchBonus', amount: -5 }] },
  { id: 'static-fire', name: 'Static Fire Campaign', text: 'Light the engines on the ground first.', cost: 12, actions: 1,
    effects: [{ kind: 'nextLaunchBonus', amount: 8 }] },
  { id: 'quality-audit', name: 'Quality Audit', text: 'Inspect every weld.', cost: 8, actions: 2,
    effects: [{ kind: 'nextLaunchBonus', amount: 12 }] },
  { id: 'crunch-time', name: 'Crunch Time', text: 'More done next turn; tired hands on the pad.', cost: 0, actions: 1,
    effects: [{ kind: 'actionsNextTurn', amount: 2 }, { kind: 'nextLaunchBonus', amount: -5 }] },
  { id: 'think-tank', name: 'Think Tank Study', text: 'Fresh options on the table.', cost: 5, actions: 1,
    effects: [{ kind: 'drawCards', amount: 2 }] },
];
