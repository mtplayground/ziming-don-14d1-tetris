export const TETROMINO_IDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export type TetrominoId = (typeof TETROMINO_IDS)[number];
export type MatrixCell = 0 | 1;
export type RotationIndex = 0 | 1 | 2 | 3;

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
