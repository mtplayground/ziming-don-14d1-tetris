import { getTetrominoDefinition } from './tetrominoes';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type ActivePiece,
  type BoardCell,
  type BoardGrid,
  type GameState,
  type GridPosition,
  type RotationIndex,
  type TetrominoId,
} from './types';

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from<BoardCell>({ length: BOARD_WIDTH }).fill(null),
  );
}

export function isInsideBoard({ row, column }: GridPosition): boolean {
  return row >= 0 && row < BOARD_HEIGHT && column >= 0 && column < BOARD_WIDTH;
}

export function getBoardCell(board: BoardGrid, position: GridPosition): BoardCell | undefined {
  if (!isInsideBoard(position)) {
    return undefined;
  }

  return board[position.row]?.[position.column];
}

export function setBoardCell(board: BoardGrid, position: GridPosition, cell: BoardCell): BoardGrid {
  if (!isInsideBoard(position)) {
    throw new RangeError(
      `Board position out of range: row ${position.row}, column ${position.column}`,
    );
  }

  return board.map((row, rowIndex) =>
    rowIndex === position.row
      ? row.map((existingCell, columnIndex) =>
          columnIndex === position.column ? cell : existingCell,
        )
      : row,
  );
}

export function createActivePiece(id: TetrominoId, rotationIndex: RotationIndex = 0): ActivePiece {
  const definition = getTetrominoDefinition(id);

  return {
    id,
    rotationIndex,
    position: { ...definition.spawnPosition },
  };
}

export function createGameState(activePieceId: TetrominoId | null = null): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: activePieceId === null ? null : createActivePiece(activePieceId),
  };
}
