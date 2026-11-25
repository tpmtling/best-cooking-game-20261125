# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/tpmtling/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/tpmtling/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

The Copper Ladle: an original 2D canvas cooking game. Run a tiny kitchen through a 180-second lunch rush — take orders from the board, chop and grill each ingredient, stack dishes on the plate, and ring the bell at SERVE before the ticket runs out. Orders get longer and faster as the shift goes on; three missed orders end the day.

## Run it

```sh
cd game && python3 -m http.server 8000
# open http://localhost:8000 in a desktop browser
```

Keyboard: arrow keys or A/D to walk, SPACE to use a station, Q for the plate, X to dump what you carry, P to pause. Mouse: click a station to walk there, click the plate to add an ingredient.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `game/index.html` — the game page (canvas, no network requests)
- `game/src/config.js` — tuning, palette, recipes
- `game/src/random.js` — the seeded random source
- `game/src/world.js` — the kitchen: chef, stations, orders, plate, till
- `game/src/input.js` — keyboard and mouse
- `game/src/render.js` — everything the player sees
- `game/src/shots.js` — the staged screenshot scenes (`?shot=start|play|end`)
- `game/src/main.js` — boot and the one loop
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=s0etxp1t&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
