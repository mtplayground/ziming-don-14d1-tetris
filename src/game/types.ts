export const TETROMINO_IDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type TetrominoId = (typeof TETROMINO_IDS)[number];
export type MatrixCell = 0 | 1;
export type RotationIndex = 0 | 1 | 2 | 3;
export type BoardCell = TetrominoId | null;
export type BoardRow = readonly BoardCell[];
export type BoardGrid = readonly BoardRow[];

export interface GridPosition {
  row: number;
  column: number;
}

export type RotationMatrix = readonly (readonly MatrixCell[])[];
export type RotationSet = readonly [RotationMatrix, RotationMatrix, RotationMatrix, RotationMatrix];

export interface TetrominoDefinition {
  id: TetrominoId;
  label: string;
  color: string;
  spawnPosition: GridPosition;
  rotations: RotationSet;
}

export interface ActivePiece {
  id: TetrominoId;
  position: GridPosition;
  rotationIndex: RotationIndex;
}

export interface GameState {
  board: BoardGrid;
  activePiece: ActivePiece | null;
}
