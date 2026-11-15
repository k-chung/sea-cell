// The ruleset the UI plays: the base ruleset with any dev-panel balance overrides on top.

import { spaceRaceRuleset } from '../content/rulesets.ts';
import type { Balance, Ruleset } from '../content/types.ts';

export const baseRuleset = spaceRaceRuleset;

export function withOverrides(overrides: Partial<Balance>): Ruleset {
  return { ...baseRuleset, balance: { ...baseRuleset.balance, ...overrides } };
}
