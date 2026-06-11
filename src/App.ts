import { createGameState } from './game/board';
import { createBoardCanvas, createBoardRenderer } from './render/canvas';

interface AppOptions {
  title: string;
}

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

  const boardRenderer = createBoardRenderer(boardCanvas);
  boardRenderer.render(createGameState().board);
  boardMount.append(boardCanvas);

  const sidePanel = document.createElement('aside');
  sidePanel.className =
    'grid gap-4 rounded-lg border border-white/10 bg-neutral-950/70 p-4 shadow-xl shadow-black/30 backdrop-blur';
  sidePanel.setAttribute('aria-label', 'Game information');

  for (const label of ['Next', 'Score', 'Level']) {
    const panel = document.createElement('section');
    panel.className = 'rounded-md border border-white/10 bg-white/[0.04] p-4';

    const title = document.createElement('h2');
    title.className = 'text-sm font-semibold uppercase tracking-normal text-amber-200';
    title.textContent = label;

    panel.append(title);
    sidePanel.append(panel);
  }

  playSection.append(heading, intro, boardMount);
  layout.append(playSection, sidePanel);
  shell.append(layout);
  return shell;
}
