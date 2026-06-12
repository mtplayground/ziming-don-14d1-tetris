export type KeyboardAction =
  | 'move-left'
  | 'move-right'
  | 'rotate-clockwise'
  | 'soft-drop'
  | 'hard-drop'
  | 'pause-toggle';

export interface KeyboardControlsOptions {
  target?: Document | HTMLElement;
  onAction: (action: KeyboardAction, event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export interface KeyboardControls {
  dispose: () => void;
}

const NON_REPEATABLE_ACTIONS = new Set<KeyboardAction>(['hard-drop', 'pause-toggle']);

export function bindKeyboardControls({
  target = document,
  onAction,
  preventDefault = true,
}: KeyboardControlsOptions): KeyboardControls {
  const handleKeyDown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    const action = getKeyboardAction(event);

    if (action === null) {
      return;
    }

    if (event.repeat && NON_REPEATABLE_ACTIONS.has(action)) {
      return;
    }

    if (preventDefault) {
      event.preventDefault();
    }

    onAction(action, event);
  };

  target.addEventListener('keydown', handleKeyDown);

  return {
    dispose: () => target.removeEventListener('keydown', handleKeyDown),
  };
}

export function getKeyboardAction(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
): KeyboardAction | null {
  switch (event.key) {
    case 'ArrowLeft':
      return 'move-left';
    case 'ArrowRight':
      return 'move-right';
    case 'ArrowUp':
      return 'rotate-clockwise';
    case 'ArrowDown':
      return 'soft-drop';
    case ' ':
    case 'Spacebar':
      return 'hard-drop';
    case 'Escape':
    case 'Pause':
    case 'p':
    case 'P':
      return 'pause-toggle';
    default:
      break;
  }

  switch (event.code) {
    case 'Space':
      return 'hard-drop';
    case 'KeyP':
    case 'Pause':
      return 'pause-toggle';
    default:
      return null;
  }
}
