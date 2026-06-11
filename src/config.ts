const defaultTitle = 'ziming-don-14d1-tetris';

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE?.trim() || defaultTitle,
} as const;
