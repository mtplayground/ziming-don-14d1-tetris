import { clearFullRows } from './board';
import { STARTING_LEVEL, type GameState, type ScoreState } from './types';

export const LINES_PER_LEVEL = 10;
export const INITIAL_GRAVITY_INTERVAL_MS = 1000;
export const MIN_GRAVITY_INTERVAL_MS = 100;
export const GRAVITY_INTERVAL_STEP_MS = 75;

const LINE_CLEAR_BASE_POINTS = [0, 100, 300, 500, 800] as const;

export interface ScoreUpdate {
  score: ScoreState;
  pointsAwarded: number;
  leveledUp: boolean;
  gravityIntervalMs: number;
}

export interface LineClearUpdate extends ScoreUpdate {
  state: GameState;
  clearedRows: number;
  clearedRowIndexes: readonly number[];
}

export function calculateLineClearPoints(clearedRows: number, level: number): number {
  if (clearedRows <= 0) {
    return 0;
  }

  const tetrises = Math.floor(clearedRows / 4);
  const remainder = clearedRows % 4;
  const basePoints =
    tetrises * LINE_CLEAR_BASE_POINTS[4] + (LINE_CLEAR_BASE_POINTS[remainder] ?? 0);

  return basePoints * Math.max(level, STARTING_LEVEL);
}

export function calculateLevel(lines: number): number {
  return Math.floor(Math.max(lines, 0) / LINES_PER_LEVEL) + STARTING_LEVEL;
}

export function getGravityIntervalMs(level: number): number {
  const levelOffset = Math.max(level, STARTING_LEVEL) - STARTING_LEVEL;
  const interval = INITIAL_GRAVITY_INTERVAL_MS - levelOffset * GRAVITY_INTERVAL_STEP_MS;

  return Math.max(interval, MIN_GRAVITY_INTERVAL_MS);
}

export function applyScoreForLineClear(score: ScoreState, clearedRows: number): ScoreUpdate {
  const nextLines = score.lines + Math.max(clearedRows, 0);
  const nextLevel = calculateLevel(nextLines);
  const pointsAwarded = calculateLineClearPoints(clearedRows, score.level);

  return {
    score: {
      score: score.score + pointsAwarded,
      level: nextLevel,
      lines: nextLines,
    },
    pointsAwarded,
    leveledUp: nextLevel > score.level,
    gravityIntervalMs: getGravityIntervalMs(nextLevel),
  };
}

export function applyLineClears(state: GameState): LineClearUpdate {
  const lineClear = clearFullRows(state.board);
  const scoreUpdate = applyScoreForLineClear(state.score, lineClear.clearedRows);

  return {
    ...scoreUpdate,
    state: {
      ...state,
      board: lineClear.board,
      score: scoreUpdate.score,
    },
    clearedRows: lineClear.clearedRows,
    clearedRowIndexes: lineClear.clearedRowIndexes,
  };
}
