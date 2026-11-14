// The ruleset the UI plays: the base ruleset with any dev-panel balance overrides on top.

import type { Balance, Ruleset } from '../content/types.ts';
import { cellRuleset } from '../content/rulesets.ts';

export const baseRuleset = cellRuleset;

export function withOverrides(overrides: Partial<Balance>): Ruleset {
  return { ...baseRuleset, balance: { ...baseRuleset.balance, ...overrides } };
}
