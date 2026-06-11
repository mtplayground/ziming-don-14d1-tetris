import { createApp } from './App';
import { appConfig } from './config';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root element');
}

document.title = appConfig.title;
root.append(createApp({ title: appConfig.title }));
