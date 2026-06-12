import { describe, expect, it } from 'vitest';
import { rotateActivePiece } from './actions';
import { clearFullRows, createEmptyBoard, createGameState, setBoardCell } from './board';
import { hasCollision } from './collision';
import { applyScoreForLineClear, calculateLineClearPoints } from './scoring';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type BoardRow,
  type GameState,
  type TetrominoId,
} from './types';

function filledRow(pieceId: TetrominoId = 'I'): BoardRow {
  return Array.from({ length: BOARD_WIDTH }, () => pieceId);
}

function stateWithActivePiece(activePiece: NonNullable<GameState['activePiece']>): GameState {
  return {
    ...createGameState(),
    activePiece,
  };
}

describe('collision detection', () => {
  it('detects wall and floor collisions', () => {
    const board = createEmptyBoard();

    expect(
      hasCollision(board, {
        id: 'O',
        rotationIndex: 0,
        position: { row: 0, column: -1 },
      }),
    ).toBe(true);

    expect(
      hasCollision(board, {
        id: 'O',
        rotationIndex: 0,
        position: { row: BOARD_HEIGHT - 1, column: 4 },
      }),
    ).toBe(true);
  });

  it('detects collisions with locked cells', () => {
    const board = setBoardCell(createEmptyBoard(), { row: 1, column: 4 }, 'T');

    expect(
      hasCollision(board, {
        id: 'O',
        rotationIndex: 0,
        position: { row: 0, column: 4 },
      }),
    ).toBe(true);
  });
});

describe('rotation', () => {
  it('rotates active pieces clockwise when the target position is open', () => {
    const state = createGameState('T');
    const result = rotateActivePiece(state);

    expect(result.moved).toBe(true);
    expect(result.state.activePiece?.rotationIndex).toBe(1);
  });

  it('uses a basic wall kick when rotation would otherwise cross the right wall', () => {
    const state = stateWithActivePiece({
      id: 'T',
      rotationIndex: 0,
      position: { row: 0, column: 8 },
    });
    const result = rotateActivePiece(state);

    expect(result.moved).toBe(true);
    expect(result.state.activePiece).toMatchObject({
      rotationIndex: 1,
      position: { row: 0, column: 7 },
    });
  });
});

describe('line clearing', () => {
  it('removes full rows and shifts remaining cells downward', () => {
    const board = createEmptyBoard().map((row, rowIndex) => {
      if (rowIndex === BOARD_HEIGHT - 2) {
        return setBoardCell([row], { row: 0, column: 0 }, 'J')[0] ?? row;
      }

      if (rowIndex === BOARD_HEIGHT - 1) {
        return filledRow('Z');
      }

      return row;
    });
    const result = clearFullRows(board);

    expect(result.clearedRows).toBe(1);
    expect(result.clearedRowIndexes).toEqual([BOARD_HEIGHT - 1]);
    expect(result.board[BOARD_HEIGHT - 1]?.[0]).toBe('J');
    expect(result.board[0]?.every((cell) => cell === null)).toBe(true);
  });
});

describe('scoring', () => {
  it('awards multi-line bonuses at the current level', () => {
    expect(calculateLineClearPoints(1, 2)).toBe(200);
    expect(calculateLineClearPoints(2, 2)).toBe(600);
    expect(calculateLineClearPoints(3, 2)).toBe(1000);
    expect(calculateLineClearPoints(4, 2)).toBe(1600);
  });

  it('increments lines, score, and level after a line clear', () => {
    const result = applyScoreForLineClear({ score: 900, level: 1, lines: 9 }, 1);

    expect(result.pointsAwarded).toBe(100);
    expect(result.leveledUp).toBe(true);
    expect(result.score).toEqual({
      score: 1000,
      level: 2,
      lines: 10,
    });
  });
});
