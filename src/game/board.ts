import { getTetrominoDefinition } from './tetrominoes';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type ActivePiece,
  type BoardCell,
  type BoardGrid,
  type BoardRow,
  type GameState,
  type GridPosition,
  type RotationIndex,
  type ScoreState,
  type TetrominoId,
  STARTING_LEVEL,
} from './types';

export interface ClearFullRowsResult {
  board: BoardGrid;
  clearedRows: number;
  clearedRowIndexes: readonly number[];
}

export function createEmptyRow(): BoardRow {
  return Array.from<BoardCell>({ length: BOARD_WIDTH }).fill(null);
}

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_HEIGHT }, () => createEmptyRow());
}

export function createInitialScoreState(): ScoreState {
  return {
    score: 0,
    level: STARTING_LEVEL,
    lines: 0,
  };
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

export function isFullRow(row: BoardRow): boolean {
  return row.every((cell) => cell !== null);
}

export function getFullRowIndexes(board: BoardGrid): readonly number[] {
  return board.reduce<number[]>((indexes, row, rowIndex) => {
    if (isFullRow(row)) {
      indexes.push(rowIndex);
    }

    return indexes;
  }, []);
}

export function clearFullRows(board: BoardGrid): ClearFullRowsResult {
  const clearedRowIndexes = getFullRowIndexes(board);

  if (clearedRowIndexes.length === 0) {
    return {
      board,
      clearedRows: 0,
      clearedRowIndexes,
    };
  }

  const remainingRows = board.filter((row) => !isFullRow(row));
  const emptyRows = Array.from({ length: clearedRowIndexes.length }, () => createEmptyRow());

  return {
    board: [...emptyRows, ...remainingRows],
    clearedRows: clearedRowIndexes.length,
    clearedRowIndexes,
  };
}

export function createActivePiece(id: TetrominoId, rotationIndex: RotationIndex = 0): ActivePiece {
  const definition = getTetrominoDefinition(id);

  return {
    id,
    rotationIndex,
    position: { ...definition.spawnPosition },
  };
}

export function createGameState(
  activePieceId: TetrominoId | null = null,
  nextPieceId: TetrominoId | null = null,
): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: activePieceId === null ? null : createActivePiece(activePieceId),
    nextPieceId,
    score: createInitialScoreState(),
  };
}
