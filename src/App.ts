import { createGameState } from './game/board';
import {
  hardDropActivePiece,
  moveActivePieceLeft,
  moveActivePieceRight,
  rotateActivePiece,
  softDropActivePiece,
} from './game/actions';
import { advanceGravityTick } from './game/loop';
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
    'aspect-[10/20] w-full max-w-[28rem] overflow-hidden rounded-lg border border-cyan-300/30 bg-neutral-950 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/10';
  boardMount.setAttribute('aria-label', 'Game stage');

  const boardCanvas = createBoardCanvas();
  boardCanvas.className = 'block h-full w-full';
  boardCanvas.setAttribute('aria-label', 'Board grid');

  let gameState = createGameState('T', 'I');
  let paused = false;
  let previewRenderer: NextPiecePreviewRenderer | null = null;
  const hudElements = createHudElements();
  const boardRenderer = createBoardRenderer(boardCanvas);

  const renderGame = (): void => {
    boardRenderer.render(gameState);
    previewRenderer?.render(gameState.nextPieceId);
    renderHud(hudElements, gameState);
  };

  const handleGameAction = (action: KeyboardAction): void => {
    if (action === 'pause-toggle') {
      paused = !paused;
      return;
    }

    if (paused) {
      return;
    }

    gameState = applyKeyboardAction(gameState, action);
    renderGame();
  };

  boardMount.append(boardCanvas);

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

function applyKeyboardAction(
  state: ReturnType<typeof createGameState>,
  action: Exclude<KeyboardAction, 'pause-toggle'>,
): ReturnType<typeof createGameState> {
  switch (action) {
    case 'move-left':
      return moveActivePieceLeft(state).state;
    case 'move-right':
      return moveActivePieceRight(state).state;
    case 'rotate-clockwise':
      return rotateActivePiece(state).state;
    case 'soft-drop': {
      const result = softDropActivePiece(state);

      return result.landed && !result.moved ? advanceGravityTick(result.state).state : result.state;
    }
    case 'hard-drop': {
      const result = hardDropActivePiece(state);

      return result.landed ? advanceGravityTick(result.state).state : result.state;
    }
  }
}
