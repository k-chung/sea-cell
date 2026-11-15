// Re-record the golden replays in tests/golden/. Run after an intentional rules/content change:
//   npm run golden:update

import { writeFileSync } from 'node:fs';
import { spaceRaceRuleset } from '../src/content/rulesets.ts';
import { GOLDEN_SEEDS, summarize } from './golden.ts';
import { playBotRun } from './play.ts';

for (const seed of GOLDEN_SEEDS) {
  const run = playBotRun(spaceRaceRuleset, seed);
  const file = `tests/golden/space-race-${seed}.json`;
  const record = {
    rulesetId: spaceRaceRuleset.id,
    seed,
    options: { storyMode: false },
    actions: run.actions,
    expected: summarize(run.final),
  };
  writeFileSync(file, `${JSON.stringify(record, null, 1)}\n`);
  console.log(`Wrote ${file} (${run.actions.length} actions, ${run.final.outcome?.won ? 'won' : 'lost'})`);
}
