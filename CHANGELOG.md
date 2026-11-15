# Changelog

Plain-English notes on each playable version. Newest first.

## Unreleased: Module 0 (groundwork for the card-based redesign)
- No gameplay changes. Content reorganized by era; art layer; Biome lint/format; slimmer CLAUDE.md + docs.

## v0.2 "worm": the Mission Control look
- New look: a Mission Control CRT console on one fixed screen (status bar, vehicle, missions, race and crew).
- Pixel sprites: your rocket is drawn from the parts you pick; every astronaut has a portrait; a Soviet emblem.
- Flight animation: the rocket lifts off, flight log lines tick in one by one, the master alarm shakes,
  results stamp in. Respects reduced-motion settings.
- Sound effects (synthesized, no audio files), off by default: launch rumble, alarm, success, failure.
- Fewer words: meters, short labels and tooltips instead of sentences.
- Testing: E2E smoke tests (full run, gallery, phone width), a scene gallery, and ?seed= for fixed runs.
- Gameplay is unchanged from v0.1.

## v0.1 "cell" — first playable Moon race
- A full run: 24 six-month turns (Spring 1958 to Fall 1969) racing the Soviets to the Moon.
- Missions: satellite, crewed orbit, spacewalk, docking, robotic lunar lander, crewed lunar flyby,
  and two Moon landing routes (lunar-orbit rendezvous, or direct ascent on a giant rocket).
- Rockets built from a hand of 5 part cards (16 parts, 3 slots). Two synergies: matching fuel, spare lift.
- Each phase rolls against visible reliability; parts get more reliable with every success.
  Test flights and redundancy reduce risk.
- 27 crisis events with hard choices; blue options unlocked by crew traits, fuel, key people and favors.
- 6 generated astronauts with traits. Permadeath, or story mode (injuries instead).
- Public and Congress support; lose if either hits zero.
- Soviet rival with fuzzy intel; their firsts shake the public and loosen Congress's wallet.
- Programs instead of a mission: research, lobby Congress, PR tour, recruit, save money.
- Pick 1 of 3 rewards after each first: key people, new parts, political favors.
- Hall of Fame (recent runs, fallen astronauts), autosave, keyboard play, text size, phone-tolerant layout.
- Dev tools: dev panel, playtest notes with exact replays, balance sliders, balance bot, golden replays.
- Plain boxes and text. The CRT look comes later.

## Unreleased
- Project setup: design snapshot, architecture rules, working agreements, decision log.
