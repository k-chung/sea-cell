# Sea Cell (codename)

Named for how it will grow: cell, worm, sea snake... eventually a Sea Dragon.

An alternate-history space race roguelike, 1958–1969. Run a space program, build rockets from part cards, fly risky missions, and make hard calls when things go wrong. Beat the Soviets to the Moon before Public or Congress support runs out.

Inspired by *For All Mankind*, the Sea Dragon rocket, FTL, Slay the Spire, XCOM, Reigns and Frostpunk.

## Play it locally

Needs [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the game with live reload |
| `npm test` | Run the rules tests and golden replays |
| `npm run bot` | Balance bot: play 500 runs with a simple AI and print win rate, crisis rate, etc. (`npm run bot -- 2000` for more) |
| `npm run golden:update` | Re-record golden replays after an *intended* rules or content change |
| `npm run build` | Type-check and build the game into `dist/` |

## Where things live

| Folder | What's in it | Edit it when... |
| --- | --- | --- |
| `src/content/` | All game data: parts, missions, crises, crew traits, people, and **`balance.ts` (every tunable number)** | You want to change numbers, names, events or cards |
| `src/core/` | The rules engine. Pure TypeScript, no browser code. `step(state, action)` is the only way the game changes | You want to change how the game works |
| `src/ui/` | Screens, input, saving, dev panel. No game rules | You want to change how it looks or feels to use |
| `tools/` | Balance bot, golden replay recorder, the simple AI player | |
| `tests/` | Rules tests and golden replays | |

## Debugging

- Press **`** (backtick) in game for the dev panel: game state, seed, jump to any turn, force a crisis, balance sliders.
- Press **N** to save a playtest note. It stores the exact moment (seed + every action), so it can be replayed.
- A run is just a seed plus a list of actions. Any run report or note can be pasted into the dev panel to replay it exactly.

See `CLAUDE.md` for the architecture and working rules, `docs/decisions.md` for why things are the way they are.
