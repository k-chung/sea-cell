// Balance bot: plays many runs with the simple AI and prints summary numbers.
// Usage: npm run bot            (500 runs)
//        npm run bot -- 2000    (2000 runs)
// Compare the numbers before and after a balance change. The bot is a yardstick, not a good player.

import { cellRuleset } from '../src/content/rulesets.ts';
import { playBotRun } from './play.ts';

const runs = Number(process.argv[2] ?? 500);
const r = cellRuleset;

let wins = 0, launches = 0, crises = 0, deaths = 0;
const winTurns: number[] = [];
const lossReasons: Record<string, number> = {};
const reached: Record<string, number> = {};
const rivalReached: Record<string, number> = {};

for (let seed = 1; seed <= runs; seed++) {
  const run = playBotRun(r, seed);
  const s = run.final;
  launches += run.launches;
  crises += run.crises;
  deaths += s.fallen.length;
  for (const id of Object.keys(s.milestones)) reached[id] = (reached[id] ?? 0) + 1;
  for (const id of Object.keys(s.rival.milestones)) rivalReached[id] = (rivalReached[id] ?? 0) + 1;
  if (s.outcome?.won) {
    wins++;
    winTurns.push(s.turn);
  } else {
    const reason = s.outcome?.reason ?? 'unknown';
    lossReasons[reason] = (lossReasons[reason] ?? 0) + 1;
  }
}

const pct = (n: number) => `${((100 * n) / runs).toFixed(1)}%`;
const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-');

console.log(`\nRuleset: ${r.name}   Runs: ${runs}`);
console.log(`Bot win rate:          ${pct(wins)}`);
console.log(`Avg winning turn:      ${avg(winTurns)} of ${r.balance.turns}`);
console.log(`Launches per run:      ${(launches / runs).toFixed(1)}`);
console.log(`Missions with crisis:  ${launches ? ((100 * crises) / launches).toFixed(1) : 0}%  (target ~70%)`);
console.log(`Astronaut deaths/run:  ${(deaths / runs).toFixed(2)}`);
console.log('\nLoss reasons:');
for (const [reason, n] of Object.entries(lossReasons).sort((a, b) => b[1] - a[1])) console.log(`  ${pct(n).padStart(6)}  ${reason}`);
console.log('\nMilestone reached by:   you     rival');
for (const m of r.content.milestones) {
  console.log(`  ${m.name.padEnd(36)} ${pct(reached[m.id] ?? 0).padStart(6)}  ${pct(rivalReached[m.id] ?? 0).padStart(6)}`);
}
