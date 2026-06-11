export function createApp(): HTMLElement {
  const shell = document.createElement('main');
  shell.className = 'app-shell';

  const heading = document.createElement('h1');
  heading.textContent = 'ziming-don-14d1-tetris';

  const intro = document.createElement('p');
  intro.textContent = 'Vite and TypeScript are ready for the Tetris game implementation.';

  const boardMount = document.createElement('section');
  boardMount.className = 'game-stage';
  boardMount.setAttribute('aria-label', 'Game stage');

  shell.append(heading, intro, boardMount);
  return shell;
}
