import type { KeyboardAction } from './keyboard';

export interface TouchControlsOptions {
  onAction: (action: KeyboardAction) => void;
}

interface TouchButtonConfig {
  action: KeyboardAction;
  label: string;
  symbol: string;
  className?: string;
}

const TOUCH_BUTTONS: readonly TouchButtonConfig[] = [
  { action: 'move-left', label: 'Move left', symbol: '←' },
  { action: 'rotate-clockwise', label: 'Rotate', symbol: '↻' },
  { action: 'move-right', label: 'Move right', symbol: '→' },
  { action: 'soft-drop', label: 'Soft drop', symbol: '↓' },
  { action: 'hard-drop', label: 'Hard drop', symbol: '⤓', className: 'col-span-2' },
  { action: 'pause-toggle', label: 'Pause', symbol: 'Ⅱ' },
] as const;

const BASE_BUTTON_CLASS =
  'flex h-14 min-w-0 touch-manipulation select-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-2xl font-black leading-none text-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition active:translate-y-px active:bg-cyan-300/20 active:text-cyan-100';

export function createTouchControls({ onAction }: TouchControlsOptions): HTMLElement {
  const controls = document.createElement('nav');
  controls.className = 'grid w-full max-w-[28rem] grid-cols-3 gap-3 sm:hidden';
  controls.setAttribute('aria-label', 'Touch controls');

  for (const config of TOUCH_BUTTONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = [BASE_BUTTON_CLASS, config.className].filter(Boolean).join(' ');
    button.setAttribute('aria-label', config.label);
    button.title = config.label;
    button.textContent = config.symbol;
    button.addEventListener('click', () => onAction(config.action));

    controls.append(button);
  }

  return controls;
}
