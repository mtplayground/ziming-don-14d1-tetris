import { createGameState } from './game/board';
import {
  hardDropActivePiece,
  moveActivePieceLeft,
  moveActivePieceRight,
  rotateActivePiece,
  softDropActivePiece,
} from './game/actions';
import { advanceGravityTick, createGameLoop } from './game/loop';
import { TETROMINO_IDS } from './game/types';
import type { GameState, TetrominoId } from './game/types';
import { bindKeyboardControls, type KeyboardAction } from './input/keyboard';
import { createTouchControls } from './input/touch';
import {
  createBoardCanvas,
  createBoardRenderer,
  createNextPiecePreviewCanvas,
  createNextPiecePreviewRenderer,
  type NextPiecePreviewRenderer,
} from './render/canvas';

interface AppOptions {
  title: string;
}

interface HudElements {
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
}

type GamePhase = 'ready' | 'playing' | 'paused' | 'game-over';
type NextPieceProvider = () => TetrominoId;

interface GameActionResult {
  state: GameState;
  gameOver: boolean;
}

interface PhaseOverlayElements {
  container: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
  button: HTMLButtonElement;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export function createApp({ title }: AppOptions): HTMLElement {
  const shell = document.createElement('main');
  shell.className =
    'min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32rem),linear-gradient(135deg,#171717_0%,#111827_48%,#2b1635_100%)] px-4 py-6 text-stone-100 sm:px-6 lg:px-8';

  const layout = document.createElement('div');
  layout.className =
    'mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl content-center gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center';

  const playSection = document.createElement('section');
  playSection.className = 'grid gap-5';
  playSection.setAttribute('aria-labelledby', 'game-title');

  const heading = document.createElement('h1');
  heading.id = 'game-title';
  heading.className = 'text-balance text-4xl font-black tracking-normal text-white sm:text-5xl';
  heading.textContent = title;

  const intro = document.createElement('p');
  intro.className = 'max-w-2xl text-base leading-7 text-stone-300';
  intro.textContent = 'Stack the blocks. Keep the well open.';

  const boardMount = document.createElement('section');
  boardMount.className =
    'relative aspect-[10/20] w-full max-w-[28rem] overflow-hidden rounded-lg border border-cyan-300/30 bg-neutral-950 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/10';
  boardMount.setAttribute('aria-label', 'Game stage');

  const boardCanvas = createBoardCanvas();
  boardCanvas.className = 'block h-full w-full';
  boardCanvas.setAttribute('aria-label', 'Board grid');

  const nextPieceProvider = createRandomPieceProvider();
  let phase: GamePhase = 'ready';
  let gameState = createGameState();
  let previewRenderer: NextPiecePreviewRenderer | null = null;
  const hudElements = createHudElements();
  const phaseOverlay = createPhaseOverlay(handlePrimaryPhaseAction);
  const boardRenderer = createBoardRenderer(boardCanvas);
  const gameLoop = createGameLoop({
    initialState: gameState,
    getNextPieceId: nextPieceProvider,
    onTick: (result) => {
      gameState = result.state;

      if (result.gameOver) {
        phase = 'game-over';
      }

      renderGame();
    },
  });

  function renderGame(): void {
    boardRenderer.render(gameState);
    previewRenderer?.render(gameState.nextPieceId);
    renderHud(hudElements, gameState);
    renderPhaseOverlay(phaseOverlay, phase);
  }

  function handleGameAction(action: KeyboardAction): void {
    if (action === 'pause-toggle') {
      togglePause();
      return;
    }

    if (phase !== 'playing') {
      return;
    }

    const result = applyKeyboardAction(gameState, action, nextPieceProvider);
    gameState = result.state;
    gameLoop.setState(gameState);

    if (result.gameOver) {
      phase = 'game-over';
      gameLoop.stop();
    }

    renderGame();
  }

  function handlePrimaryPhaseAction(): void {
    if (phase === 'paused') {
      resumeGame();
      return;
    }

    startGame();
  }

  function startGame(): void {
    gameLoop.stop();
    gameState = createFreshGameState(nextPieceProvider);
    gameLoop.setState(gameState);
    phase = 'playing';
    renderGame();
    gameLoop.start();
  }

  function togglePause(): void {
    if (phase === 'playing') {
      phase = 'paused';
      gameLoop.stop();
      renderGame();
      return;
    }

    if (phase === 'paused') {
      resumeGame();
    }
  }

  function resumeGame(): void {
    phase = 'playing';
    renderGame();
    gameLoop.start();
  }

  boardMount.append(boardCanvas, phaseOverlay.container);

  const sidePanel = document.createElement('aside');
  sidePanel.className =
    'grid gap-4 rounded-lg border border-white/10 bg-neutral-950/70 p-4 shadow-xl shadow-black/30 backdrop-blur';
  sidePanel.setAttribute('aria-label', 'Game information');

  for (const label of ['Next', 'Score', 'Level', 'Lines']) {
    const panel = document.createElement('section');
    panel.className = 'rounded-md border border-white/10 bg-white/[0.04] p-4';

    const title = document.createElement('h2');
    title.className = 'text-sm font-semibold uppercase tracking-normal text-amber-200';
    title.textContent = label;

    panel.append(title);

    if (label === 'Next') {
      const previewCanvas = createNextPiecePreviewCanvas();
      previewCanvas.className = 'mt-3 block w-full rounded border border-white/10';
      previewCanvas.setAttribute('aria-label', 'Next piece preview');

      previewRenderer = createNextPiecePreviewRenderer(previewCanvas);
      panel.append(previewCanvas);
    }

    if (label === 'Score') {
      panel.append(hudElements.score);
    }

    if (label === 'Level') {
      panel.append(hudElements.level);
    }

    if (label === 'Lines') {
      panel.append(hudElements.lines);
    }

    sidePanel.append(panel);
  }

  bindKeyboardControls({
    onAction: handleGameAction,
  });

  const touchControls = createTouchControls({
    onAction: handleGameAction,
  });

  renderGame();

  playSection.append(heading, intro, boardMount, touchControls);
  layout.append(playSection, sidePanel);
  shell.append(layout);
  return shell;
}

function createHudElements(): HudElements {
  return {
    score: createHudValueElement('Current score'),
    level: createHudValueElement('Current level'),
    lines: createHudValueElement('Lines cleared'),
  };
}

function createHudValueElement(label: string): HTMLElement {
  const value = document.createElement('p');
  value.className = 'mt-2 text-3xl font-black tabular-nums leading-none text-white sm:text-4xl';
  value.setAttribute('aria-label', label);
  value.setAttribute('aria-live', 'polite');
  value.textContent = '0';

  return value;
}

function renderHud(hudElements: HudElements, state: ReturnType<typeof createGameState>): void {
  hudElements.score.textContent = NUMBER_FORMATTER.format(state.score.score);
  hudElements.level.textContent = NUMBER_FORMATTER.format(state.score.level);
  hudElements.lines.textContent = NUMBER_FORMATTER.format(state.score.lines);
}

function createPhaseOverlay(onPrimaryAction: () => void): PhaseOverlayElements {
  const container = document.createElement('section');
  container.className =
    'absolute inset-0 grid place-items-center bg-neutral-950/80 p-6 text-center backdrop-blur-sm';
  container.setAttribute('aria-live', 'polite');

  const panel = document.createElement('div');
  panel.className = 'grid max-w-72 gap-4';

  const title = document.createElement('h2');
  title.className = 'text-3xl font-black tracking-normal text-white';

  const body = document.createElement('p');
  body.className = 'text-sm leading-6 text-stone-300';

  const button = document.createElement('button');
  button.type = 'button';
  button.className =
    'min-h-12 rounded-lg bg-cyan-300 px-5 py-3 text-base font-black text-neutral-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-2 focus:ring-offset-neutral-950 active:translate-y-px';
  button.addEventListener('click', onPrimaryAction);

  panel.append(title, body, button);
  container.append(panel);

  return { container, title, body, button };
}

function renderPhaseOverlay(elements: PhaseOverlayElements, phase: GamePhase): void {
  elements.container.classList.toggle('hidden', phase === 'playing');

  if (phase === 'ready') {
    elements.title.textContent = 'Ready';
    elements.body.textContent = 'Start a new run.';
    elements.button.textContent = 'Start';
    return;
  }

  if (phase === 'paused') {
    elements.title.textContent = 'Paused';
    elements.body.textContent = 'The current run is stopped.';
    elements.button.textContent = 'Resume';
    return;
  }

  if (phase === 'game-over') {
    elements.title.textContent = 'Game over';
    elements.body.textContent = 'Start again with a clear board.';
    elements.button.textContent = 'Restart';
  }
}

function createRandomPieceProvider(): NextPieceProvider {
  return () => TETROMINO_IDS[Math.floor(Math.random() * TETROMINO_IDS.length)] ?? TETROMINO_IDS[0];
}

function createFreshGameState(nextPieceProvider: NextPieceProvider): GameState {
  return createGameState(nextPieceProvider(), nextPieceProvider());
}

function applyKeyboardAction(
  state: GameState,
  action: Exclude<KeyboardAction, 'pause-toggle'>,
  nextPieceProvider: NextPieceProvider,
): GameActionResult {
  switch (action) {
    case 'move-left':
      return { state: moveActivePieceLeft(state).state, gameOver: false };
    case 'move-right':
      return { state: moveActivePieceRight(state).state, gameOver: false };
    case 'rotate-clockwise':
      return { state: rotateActivePiece(state).state, gameOver: false };
    case 'soft-drop': {
      const result = softDropActivePiece(state);

      if (result.landed && !result.moved) {
        const tick = advanceGravityTick(result.state, nextPieceProvider());

        return { state: tick.state, gameOver: tick.gameOver };
      }

      return { state: result.state, gameOver: false };
    }
    case 'hard-drop': {
      const result = hardDropActivePiece(state);

      if (result.landed) {
        const tick = advanceGravityTick(result.state, nextPieceProvider());

        return { state: tick.state, gameOver: tick.gameOver };
      }

      return { state: result.state, gameOver: false };
    }
  }
}
