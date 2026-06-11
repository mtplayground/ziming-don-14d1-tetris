import { softDropActivePiece } from './actions';
import { createActivePiece } from './board';
import { hasCollision, lockPiece } from './collision';
import { applyLineClears, getGravityIntervalMs } from './scoring';
import type { GameState, TetrominoId } from './types';

export type NextPieceProvider = () => TetrominoId | null;
export type RequestFrame = (callback: FrameRequestCallback) => number;
export type CancelFrame = (handle: number) => void;

export interface GravityTickResult {
  state: GameState;
  gravityIntervalMs: number;
  moved: boolean;
  locked: boolean;
  gameOver: boolean;
  clearedRows: number;
  pointsAwarded: number;
  leveledUp: boolean;
}

export interface GameLoopOptions {
  initialState: GameState;
  getNextPieceId?: NextPieceProvider;
  onTick?: (result: GravityTickResult) => void;
  requestFrame?: RequestFrame;
  cancelFrame?: CancelFrame;
  now?: () => number;
}

export interface GameLoopController {
  start: () => void;
  stop: () => void;
  step: (timestamp?: number) => readonly GravityTickResult[];
  getState: () => GameState;
  setState: (state: GameState) => void;
  isRunning: () => boolean;
}

export function advanceGravityTick(
  state: GameState,
  followingPieceId: TetrominoId | null = null,
): GravityTickResult {
  const gravityIntervalMs = getGravityIntervalMs(state.score.level);

  if (state.activePiece === null) {
    return createGravityTickResult({
      state,
      gravityIntervalMs,
      moved: false,
      locked: false,
      gameOver: false,
    });
  }

  const dropped = softDropActivePiece(state);

  if (dropped.moved) {
    return createGravityTickResult({
      state: dropped.state,
      gravityIntervalMs,
      moved: true,
      locked: false,
      gameOver: false,
    });
  }

  const lockedPiece = lockPiece(state.board, state.activePiece);
  const cleared = applyLineClears({
    ...state,
    board: lockedPiece.board,
    activePiece: null,
  });
  const spawnedPiece = state.nextPieceId === null ? null : createActivePiece(state.nextPieceId);
  const spawnBlocked = spawnedPiece !== null && hasCollision(cleared.state.board, spawnedPiece);
  const gameOver = lockedPiece.overflowed || spawnBlocked;
  const nextState: GameState = {
    ...cleared.state,
    activePiece: gameOver ? null : spawnedPiece,
    nextPieceId: followingPieceId,
  };

  return createGravityTickResult({
    state: nextState,
    gravityIntervalMs: cleared.gravityIntervalMs,
    moved: false,
    locked: true,
    gameOver,
    clearedRows: cleared.clearedRows,
    pointsAwarded: cleared.pointsAwarded,
    leveledUp: cleared.leveledUp,
  });
}

export function createGameLoop(options: GameLoopOptions): GameLoopController {
  let state = options.initialState;
  let running = false;
  let frameId: number | null = null;
  let lastTimestamp: number | null = null;
  let accumulatorMs = 0;

  const requestFrame =
    options.requestFrame ?? ((callback) => globalThis.requestAnimationFrame(callback));
  const cancelFrame = options.cancelFrame ?? ((handle) => globalThis.cancelAnimationFrame(handle));
  const now = options.now ?? (() => globalThis.performance.now());

  function start(): void {
    if (running) {
      return;
    }

    running = true;
    lastTimestamp = now();
    frameId = requestFrame(runFrame);
  }

  function stop(): void {
    running = false;

    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }
  }

  function runFrame(timestamp: number): void {
    step(timestamp);

    if (running) {
      frameId = requestFrame(runFrame);
    }
  }

  function step(timestamp: number = now()): readonly GravityTickResult[] {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
      return [];
    }

    const elapsedMs = Math.max(0, timestamp - lastTimestamp);
    const results: GravityTickResult[] = [];
    lastTimestamp = timestamp;
    accumulatorMs += elapsedMs;

    while (accumulatorMs >= getGravityIntervalMs(state.score.level)) {
      const intervalMs = getGravityIntervalMs(state.score.level);
      accumulatorMs -= intervalMs;

      const result = advanceGravityTick(state, options.getNextPieceId?.() ?? null);
      state = result.state;
      results.push(result);
      options.onTick?.(result);

      if (result.gameOver) {
        stop();
        break;
      }
    }

    return results;
  }

  return {
    start,
    stop,
    step,
    getState: () => state,
    setState: (nextState) => {
      state = nextState;
      accumulatorMs = 0;
      lastTimestamp = null;
    },
    isRunning: () => running,
  };
}

function createGravityTickResult({
  state,
  gravityIntervalMs,
  moved,
  locked,
  gameOver,
  clearedRows = 0,
  pointsAwarded = 0,
  leveledUp = false,
}: {
  state: GameState;
  gravityIntervalMs: number;
  moved: boolean;
  locked: boolean;
  gameOver: boolean;
  clearedRows?: number;
  pointsAwarded?: number;
  leveledUp?: boolean;
}): GravityTickResult {
  return {
    state,
    gravityIntervalMs,
    moved,
    locked,
    gameOver,
    clearedRows,
    pointsAwarded,
    leveledUp,
  };
}
