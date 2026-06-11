import { hasCollision, isLandingPosition } from './collision';
import type { ActivePiece, GameState, RotationIndex } from './types';

export type RotationDirection = 'clockwise' | 'counterclockwise';

export interface MoveResult {
  state: GameState;
  moved: boolean;
}

export interface DropResult extends MoveResult {
  droppedRows: number;
  landed: boolean;
}

const WALL_KICK_COLUMN_OFFSETS = [0, -1, 1, -2, 2] as const;

export function translatePiece(
  piece: ActivePiece,
  rowDelta: number,
  columnDelta: number,
): ActivePiece {
  return {
    ...piece,
    position: {
      row: piece.position.row + rowDelta,
      column: piece.position.column + columnDelta,
    },
  };
}

export function moveActivePiece(state: GameState, columnDelta: number): MoveResult {
  if (state.activePiece === null) {
    return { state, moved: false };
  }

  const candidate = translatePiece(state.activePiece, 0, columnDelta);

  if (hasCollision(state.board, candidate)) {
    return { state, moved: false };
  }

  return {
    state: { ...state, activePiece: candidate },
    moved: true,
  };
}

export function moveActivePieceLeft(state: GameState): MoveResult {
  return moveActivePiece(state, -1);
}

export function moveActivePieceRight(state: GameState): MoveResult {
  return moveActivePiece(state, 1);
}

export function rotateActivePiece(
  state: GameState,
  direction: RotationDirection = 'clockwise',
): MoveResult {
  if (state.activePiece === null) {
    return { state, moved: false };
  }

  const rotationIndex = nextRotationIndex(state.activePiece.rotationIndex, direction);

  for (const columnOffset of WALL_KICK_COLUMN_OFFSETS) {
    const candidate: ActivePiece = {
      ...state.activePiece,
      rotationIndex,
      position: {
        row: state.activePiece.position.row,
        column: state.activePiece.position.column + columnOffset,
      },
    };

    if (!hasCollision(state.board, candidate)) {
      return {
        state: { ...state, activePiece: candidate },
        moved: true,
      };
    }
  }

  return { state, moved: false };
}

export function softDropActivePiece(state: GameState): DropResult {
  if (state.activePiece === null) {
    return { state, moved: false, droppedRows: 0, landed: false };
  }

  const candidate = translatePiece(state.activePiece, 1, 0);

  if (hasCollision(state.board, candidate)) {
    return { state, moved: false, droppedRows: 0, landed: true };
  }

  return {
    state: { ...state, activePiece: candidate },
    moved: true,
    droppedRows: 1,
    landed: isLandingPosition(state.board, candidate),
  };
}

export function hardDropActivePiece(state: GameState): DropResult {
  if (state.activePiece === null) {
    return { state, moved: false, droppedRows: 0, landed: false };
  }

  let droppedPiece = state.activePiece;
  let droppedRows = 0;

  while (!hasCollision(state.board, translatePiece(droppedPiece, 1, 0))) {
    droppedPiece = translatePiece(droppedPiece, 1, 0);
    droppedRows += 1;
  }

  return {
    state: { ...state, activePiece: droppedPiece },
    moved: droppedRows > 0,
    droppedRows,
    landed: true,
  };
}

function nextRotationIndex(
  rotationIndex: RotationIndex,
  direction: RotationDirection,
): RotationIndex {
  const offset = direction === 'clockwise' ? 1 : -1;
  const nextIndex = (rotationIndex + offset + 4) % 4;

  return nextIndex as RotationIndex;
}
