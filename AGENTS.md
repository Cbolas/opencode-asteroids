# AGENTS.md

Static Asteroids clone: HTML5 Canvas + vanilla JS. No build step, bundler,
framework, dependencies, tests, or linting — do not look for npm scripts.

## Run

- `npx serve .` → http://localhost:3000, or open `index.html` directly (file:// works).
- Verification is manual: play in a browser.

## Architecture

- All game logic lives in `game.js` (single file, ES6+, 'use strict', no modules).
- Game state machine: `'playing' | 'dead' | 'gameover'` in `update()`.
- Classes: `Ship`, `Bullet`, `Asteroid`, `Particle`. Asteroid sizes 1–3 map to
  radius/speed/points via the `RADII`/`SPEEDS`/`POINTS` arrays.
- Space is toroidal — all movement goes through `wrap(v, max)`.
- Main loop clamps `dt` to 0.05s; input edge-detection via `pressed()` (consumes `justPressed`).

## Gotchas

- Canvas size is hardcoded in TWO places: `<canvas width height>` in `index.html`
  and `W`/`H` constants in `game.js`. Always change both together.
- Languages are mixed: code comments + HUD text are Spanish; README is Portuguese;
  `index.html` is `lang="es"`. Match each file's existing language.
- The README overstates features (power-ups, "estrela cadente" asteroid) — none are
  implemented. `game.js` is the source of truth.

## Style

2-space indent; section-divider comments (`// ── Name ──…`) organize `game.js`.
