// Fuzzy odds: players see words, never exact percentages (owner decision 2026-11-15).
// The real numbers stay in the state for the rules, tests and the dev panel.

const BANDS: [min: number, word: string][] = [
  [95, 'Near certain'],
  [80, 'Very likely'],
  [65, 'Likely'],
  [45, 'Coin flip'],
  [25, 'Risky'],
  [0, 'Long shot'],
];

/** "Likely", "Coin flip"... for a chance from 0 to 100. */
export function likelihood(percent: number): string {
  return BANDS.find(([min]) => percent >= min)?.[1] ?? 'Long shot';
}

/** 1-5 filled pips for a chance, for an at-a-glance bar next to the word. */
export function likelihoodPips(percent: number): number {
  return Math.max(1, Math.min(5, Math.ceil(percent / 20)));
}

/** "safer" / "much safer" / "riskier" for a change in odds. */
export function boostWord(points: number): string {
  if (points < 0) return points <= -10 ? 'much riskier' : 'riskier';
  return points >= 15 ? 'much safer' : 'safer';
}
