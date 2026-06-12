import { createApp } from './App';
import { appConfig } from './config';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  console.error('Unable to start app: missing #app root element');
} else {
  try {
    document.title = appConfig.title;
    root.append(createApp({ title: appConfig.title }));
  } catch (error) {
    renderStartupError(root, error);
  }
}

function renderStartupError(root: HTMLElement, error: unknown): void {
  console.error('Unable to start app', error);

  const message = document.createElement('main');
  message.className =
    'grid min-h-screen place-items-center bg-neutral-950 p-6 text-center text-stone-100';

  const content = document.createElement('section');
  content.className = 'grid max-w-md gap-3';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-black text-white';
  title.textContent = 'Unable to start';

  const body = document.createElement('p');
  body.className = 'text-sm leading-6 text-stone-300';
  body.textContent = 'The game could not initialize. Refresh the page to try again.';

  content.append(title, body);
  message.append(content);
  root.replaceChildren(message);
}
