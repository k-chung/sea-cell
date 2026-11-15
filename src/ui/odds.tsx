// How odds are shown: a word ("Likely") plus a 5-pip bar. Never an exact percentage (owner decision).

import { likelihood, likelihoodPips } from '../core/index.ts';

export function Odds({ p, big }: { p: number; big?: boolean }) {
  const pips = likelihoodPips(p);
  return (
    <span class={`odds-fuzzy${big ? ' big' : ''}`}>
      <span class="pips" aria-hidden="true">
        {'●'.repeat(pips)}
        {'○'.repeat(5 - pips)}
      </span>{' '}
      {likelihood(p)}
    </span>
  );
}
