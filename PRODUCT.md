# ziming-don-14d1-tetris

## Snapshot

`ziming-don-14d1-tetris` is a browser-based Tetris game built as a static Vite + TypeScript application. It renders gameplay on canvas, uses Tailwind CSS for the surrounding UI, and can be self-hosted from the generated `dist/` directory.

## Current Capabilities

- Seven tetrominoes with rotation states, spawn positions, active/next piece state, and locked-cell board model.
- Collision detection for walls, floor, and locked stacks, with piece locking and next-piece spawning.
- Movement controls for left/right, clockwise rotation with basic wall kicks, soft drop, and hard drop.
- Tick-based gravity loop with level-based speed, pause/resume, game-over detection, and restart.
- Line clearing, score calculation, level progression, and live score/level/lines HUD.
- Canvas rendering for the board, locked cells, active piece, ghost landing outline, and next-piece preview.
- Keyboard controls plus mobile on-screen touch controls.
- Start, pause, and game-over overlays, including final score/level/lines on game over.
- Static production build via Vite.

## Architecture

- `src/game/` contains the pure engine: tetromino definitions, board model, collision, actions, scoring, and game loop.
- `src/render/` contains canvas rendering utilities for the board and next-piece preview.
- `src/input/` maps keyboard and touch interactions to shared game actions.
- `src/App.ts` composes state, loop, input, rendering, HUD, and overlays.
- `src/main.ts` mounts the app and renders a startup fallback if initialization fails.

## Testing And Validation

- Unit tests use Vitest and cover core engine collision, rotation, line clearing, and scoring behavior.
- End-to-end smoke testing uses Playwright to start a game, clear lines, and reach game over.
- Standard validation commands:
  - `npm test`
  - `npm run test:e2e`
  - `npm run lint`
  - `npm run build`

## Conventions

- Default development and preview servers listen on `0.0.0.0:8080`.
- App title defaults to `ziming-don-14d1-tetris` and may be overridden with `VITE_APP_TITLE`.
- The app is frontend-only; there is no backend, database, or authentication flow.
- Generated artifacts are ignored: `dist/`, `playwright-report/`, and `test-results/`.
