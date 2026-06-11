import { createActivePiece, getBoardCell, isInsideBoard, setBoardCell } from './board';
import { getTetrominoDefinition } from './tetrominoes';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type ActivePiece,
  type BoardGrid,
  type GameState,
  type GridPosition,
  type TetrominoId,
} from './types';

export interface LockPieceResult {
  board: BoardGrid;
  overflowed: boolean;
}

export interface LockAndSpawnResult {
  state: GameState;
  locked: boolean;
  gameOver: boolean;
}

export function getActivePieceCells(piece: ActivePiece): readonly GridPosition[] {
  const definition = getTetrominoDefinition(piece.id);
  const matrix = definition.rotations[piece.rotationIndex];
  const cells: GridPosition[] = [];

  matrix.forEach((row, rowOffset) => {
    row.forEach((cell, columnOffset) => {
      if (cell === 1) {
        cells.push({
          row: piece.position.row + rowOffset,
          column: piece.position.column + columnOffset,
        });
      }
    });
  });

  return cells;
}

export function hasCollision(board: BoardGrid, piece: ActivePiece): boolean {
  for (const position of getActivePieceCells(piece)) {
    if (position.column < 0 || position.column >= BOARD_WIDTH || position.row >= BOARD_HEIGHT) {
      return true;
    }

    if (position.row >= 0 && getBoardCell(board, position) !== null) {
      return true;
    }
  }

  return false;
}

export function isLandingPosition(board: BoardGrid, piece: ActivePiece): boolean {
  return hasCollision(board, {
    ...piece,
    position: {
      row: piece.position.row + 1,
      column: piece.position.column,
    },
  });
}

export function lockPiece(board: BoardGrid, piece: ActivePiece): LockPieceResult {
  let nextBoard = board;
  let overflowed = false;

  for (const position of getActivePieceCells(piece)) {
    if (position.row < 0) {
      overflowed = true;
      continue;
    }

    if (!isInsideBoard(position)) {
      throw new RangeError(
        `Cannot lock piece outside board: row ${position.row}, column ${position.column}`,
      );
    }

    if (getBoardCell(nextBoard, position) !== null) {
      throw new Error(
        `Cannot lock piece over occupied cell: row ${position.row}, column ${position.column}`,
      );
    }

    nextBoard = setBoardCell(nextBoard, position, piece.id);
  }

  return { board: nextBoard, overflowed };
}

export function lockActivePieceAndSpawnNext(
  state: GameState,
  followingPieceId: TetrominoId | null,
): LockAndSpawnResult {
  if (state.activePiece === null) {
    return {
      state: {
        ...state,
        nextPieceId: followingPieceId,
      },
      locked: false,
      gameOver: false,
    };
  }

  const lockedPiece = lockPiece(state.board, state.activePiece);
  const spawnedPiece = state.nextPieceId === null ? null : createActivePiece(state.nextPieceId);
  const spawnBlocked = spawnedPiece !== null && hasCollision(lockedPiece.board, spawnedPiece);
  const gameOver = lockedPiece.overflowed || spawnBlocked;

  return {
    state: {
      board: lockedPiece.board,
      activePiece: gameOver ? null : spawnedPiece,
      nextPieceId: followingPieceId,
      score: state.score,
    },
    locked: true,
    gameOver,
  };
}
