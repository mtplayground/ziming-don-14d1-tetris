import { getActivePieceCells, getLandingPiece } from '../game/collision';
import { getTetrominoDefinition } from '../game/tetrominoes';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type ActivePiece,
  type BoardGrid,
  type GameState,
  type TetrominoId,
} from '../game/types';

export const DEFAULT_CELL_SIZE = 32;
export const DEFAULT_PREVIEW_CELL_SIZE = 24;
export const PREVIEW_GRID_SIZE = 4;

export interface BoardRenderOptions {
  cellSize?: number;
  devicePixelRatio?: number;
  backgroundColor?: string;
  gridColor?: string;
  cellInset?: number;
  lockedCellBorderColor?: string;
  activeCellBorderColor?: string;
  ghostAlpha?: number;
  ghostLineColor?: string;
}

export interface NextPiecePreviewOptions {
  cellSize?: number;
  devicePixelRatio?: number;
  backgroundColor?: string;
  gridColor?: string;
  cellInset?: number;
  cellBorderColor?: string;
}

export interface BoardRenderer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  render: (state: GameState) => void;
  renderBoard: (board: BoardGrid) => void;
  resize: (options?: BoardRenderOptions) => void;
}

export interface NextPiecePreviewRenderer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  render: (pieceId: TetrominoId | null) => void;
  resize: (options?: NextPiecePreviewOptions) => void;
}

interface ResolvedBoardRenderOptions {
  cellSize: number;
  devicePixelRatio: number;
  backgroundColor: string;
  gridColor: string;
  cellInset: number;
  lockedCellBorderColor: string;
  activeCellBorderColor: string;
  ghostAlpha: number;
  ghostLineColor: string;
}

interface ResolvedNextPiecePreviewOptions {
  cellSize: number;
  devicePixelRatio: number;
  backgroundColor: string;
  gridColor: string;
  cellInset: number;
  cellBorderColor: string;
}

export function createBoardCanvas(options: BoardRenderOptions = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = getCanvasContext(canvas);

  resizeBoardCanvas(canvas, context, options);
  return canvas;
}

export function createNextPiecePreviewCanvas(
  options: NextPiecePreviewOptions = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = getCanvasContext(canvas);

  resizeNextPiecePreviewCanvas(canvas, context, options);
  return canvas;
}

export function createBoardRenderer(
  canvas: HTMLCanvasElement,
  options: BoardRenderOptions = {},
): BoardRenderer {
  const context = getCanvasContext(canvas);
  let renderOptions = resolveBoardRenderOptions(options);

  resizeBoardCanvas(canvas, context, renderOptions);

  return {
    canvas,
    context,
    render: (state) => renderGameState(context, state, renderOptions),
    renderBoard: (board) => renderBoard(context, board, renderOptions),
    resize: (nextOptions = {}) => {
      renderOptions = resolveBoardRenderOptions({ ...renderOptions, ...nextOptions });
      resizeBoardCanvas(canvas, context, renderOptions);
    },
  };
}

export function createNextPiecePreviewRenderer(
  canvas: HTMLCanvasElement,
  options: NextPiecePreviewOptions = {},
): NextPiecePreviewRenderer {
  const context = getCanvasContext(canvas);
  let renderOptions = resolveNextPiecePreviewOptions(options);

  resizeNextPiecePreviewCanvas(canvas, context, renderOptions);

  return {
    canvas,
    context,
    render: (pieceId) => renderNextPiecePreview(context, pieceId, renderOptions),
    resize: (nextOptions = {}) => {
      renderOptions = resolveNextPiecePreviewOptions({ ...renderOptions, ...nextOptions });
      resizeNextPiecePreviewCanvas(canvas, context, renderOptions);
    },
  };
}

export function renderBoard(
  context: CanvasRenderingContext2D,
  board: BoardGrid,
  options: BoardRenderOptions = {},
): void {
  const renderOptions = resolveBoardRenderOptions(options);
  const width = BOARD_WIDTH * renderOptions.cellSize;
  const height = BOARD_HEIGHT * renderOptions.cellSize;

  renderBoardBackground(context, renderOptions, width, height);
  renderLockedCells(context, board, renderOptions);
  renderBoardGrid(context, renderOptions);
}

export function renderGameState(
  context: CanvasRenderingContext2D,
  state: GameState,
  options: BoardRenderOptions = {},
): void {
  const renderOptions = resolveBoardRenderOptions(options);
  const width = BOARD_WIDTH * renderOptions.cellSize;
  const height = BOARD_HEIGHT * renderOptions.cellSize;

  renderBoardBackground(context, renderOptions, width, height);
  renderLockedCells(context, state.board, renderOptions);

  if (state.activePiece !== null) {
    renderGhostPiece(context, state.board, state.activePiece, renderOptions);
    renderActivePiece(context, state.activePiece, renderOptions);
  }

  renderBoardGrid(context, renderOptions);
}

export function renderNextPiecePreview(
  context: CanvasRenderingContext2D,
  pieceId: TetrominoId | null,
  options: NextPiecePreviewOptions = {},
): void {
  const renderOptions = resolveNextPiecePreviewOptions(options);
  const size = PREVIEW_GRID_SIZE * renderOptions.cellSize;

  context.clearRect(0, 0, size, size);
  context.fillStyle = renderOptions.backgroundColor;
  context.fillRect(0, 0, size, size);
  renderPreviewGrid(context, renderOptions);

  if (pieceId === null) {
    return;
  }

  renderPreviewPiece(context, pieceId, renderOptions);
}

export function resizeBoardCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: BoardRenderOptions = {},
): void {
  const renderOptions = resolveBoardRenderOptions(options);
  const width = BOARD_WIDTH * renderOptions.cellSize;
  const height = BOARD_HEIGHT * renderOptions.cellSize;

  canvas.width = Math.floor(width * renderOptions.devicePixelRatio);
  canvas.height = Math.floor(height * renderOptions.devicePixelRatio);
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  context.setTransform(renderOptions.devicePixelRatio, 0, 0, renderOptions.devicePixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
}

export function resizeNextPiecePreviewCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: NextPiecePreviewOptions = {},
): void {
  const renderOptions = resolveNextPiecePreviewOptions(options);
  const size = PREVIEW_GRID_SIZE * renderOptions.cellSize;

  canvas.width = Math.floor(size * renderOptions.devicePixelRatio);
  canvas.height = Math.floor(size * renderOptions.devicePixelRatio);
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  context.setTransform(renderOptions.devicePixelRatio, 0, 0, renderOptions.devicePixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('Unable to initialize 2D canvas context');
  }

  return context;
}

function renderPreviewPiece(
  context: CanvasRenderingContext2D,
  pieceId: TetrominoId,
  options: ResolvedNextPiecePreviewOptions,
): void {
  const definition = getTetrominoDefinition(pieceId);
  const cells = getMatrixCells(definition.rotations[0]);

  if (cells.length === 0) {
    return;
  }

  const bounds = getCellBounds(cells);
  const pieceWidth = bounds.maxColumn - bounds.minColumn + 1;
  const pieceHeight = bounds.maxRow - bounds.minRow + 1;
  const columnOffset = (PREVIEW_GRID_SIZE - pieceWidth) / 2 - bounds.minColumn;
  const rowOffset = (PREVIEW_GRID_SIZE - pieceHeight) / 2 - bounds.minRow;

  for (const cell of cells) {
    const x = (cell.column + columnOffset) * options.cellSize + options.cellInset;
    const y = (cell.row + rowOffset) * options.cellSize + options.cellInset;
    const size = options.cellSize - options.cellInset * 2;

    fillCell(context, x, y, size, definition.color, options.cellBorderColor);
  }
}

function renderPreviewGrid(
  context: CanvasRenderingContext2D,
  options: ResolvedNextPiecePreviewOptions,
): void {
  const size = PREVIEW_GRID_SIZE * options.cellSize;

  context.beginPath();
  context.strokeStyle = options.gridColor;
  context.lineWidth = 1;

  for (let line = 0; line <= PREVIEW_GRID_SIZE; line += 1) {
    const offset = line * options.cellSize + 0.5;
    context.moveTo(offset, 0);
    context.lineTo(offset, size);
    context.moveTo(0, offset);
    context.lineTo(size, offset);
  }

  context.stroke();
}

function getMatrixCells(
  matrix: readonly (readonly number[])[],
): readonly { row: number; column: number }[] {
  const cells: { row: number; column: number }[] = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === 1) {
        cells.push({ row: rowIndex, column: columnIndex });
      }
    });
  });

  return cells;
}

function getCellBounds(cells: readonly { row: number; column: number }[]): {
  minRow: number;
  maxRow: number;
  minColumn: number;
  maxColumn: number;
} {
  return cells.reduce(
    (bounds, cell) => ({
      minRow: Math.min(bounds.minRow, cell.row),
      maxRow: Math.max(bounds.maxRow, cell.row),
      minColumn: Math.min(bounds.minColumn, cell.column),
      maxColumn: Math.max(bounds.maxColumn, cell.column),
    }),
    {
      minRow: Number.POSITIVE_INFINITY,
      maxRow: Number.NEGATIVE_INFINITY,
      minColumn: Number.POSITIVE_INFINITY,
      maxColumn: Number.NEGATIVE_INFINITY,
    },
  );
}

function renderLockedCells(
  context: CanvasRenderingContext2D,
  board: BoardGrid,
  options: ResolvedBoardRenderOptions,
): void {
  board.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === null) {
        return;
      }

      const x = columnIndex * options.cellSize + options.cellInset;
      const y = rowIndex * options.cellSize + options.cellInset;
      const size = options.cellSize - options.cellInset * 2;

      fillCell(
        context,
        x,
        y,
        size,
        getTetrominoDefinition(cell).color,
        options.lockedCellBorderColor,
      );
    });
  });
}

function renderActivePiece(
  context: CanvasRenderingContext2D,
  piece: ActivePiece,
  options: ResolvedBoardRenderOptions,
): void {
  const color = getTetrominoDefinition(piece.id).color;

  for (const position of getActivePieceCells(piece)) {
    if (position.row < 0) {
      continue;
    }

    const x = position.column * options.cellSize + options.cellInset;
    const y = position.row * options.cellSize + options.cellInset;
    const size = options.cellSize - options.cellInset * 2;

    fillCell(context, x, y, size, color, options.activeCellBorderColor);
  }
}

function renderGhostPiece(
  context: CanvasRenderingContext2D,
  board: BoardGrid,
  piece: ActivePiece,
  options: ResolvedBoardRenderOptions,
): void {
  const landingPiece = getLandingPiece(board, piece);

  context.save();
  context.globalAlpha = options.ghostAlpha;
  context.strokeStyle = options.ghostLineColor;
  context.lineWidth = 2;
  context.setLineDash([options.cellSize * 0.28, options.cellSize * 0.16]);

  for (const position of getActivePieceCells(landingPiece)) {
    if (position.row < 0) {
      continue;
    }

    const x = position.column * options.cellSize + options.cellInset + 0.5;
    const y = position.row * options.cellSize + options.cellInset + 0.5;
    const size = options.cellSize - options.cellInset * 2 - 1;

    context.strokeRect(x, y, size, size);
  }

  context.restore();
}

function renderBoardBackground(
  context: CanvasRenderingContext2D,
  options: ResolvedBoardRenderOptions,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.fillStyle = options.backgroundColor;
  context.fillRect(0, 0, width, height);
}

function fillCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillStyle: string,
  strokeStyle: string,
): void {
  context.fillStyle = fillStyle;
  context.fillRect(x, y, size, size);
  context.strokeStyle = strokeStyle;
  context.lineWidth = 1;
  context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function renderBoardGrid(
  context: CanvasRenderingContext2D,
  options: ResolvedBoardRenderOptions,
): void {
  const width = BOARD_WIDTH * options.cellSize;
  const height = BOARD_HEIGHT * options.cellSize;

  context.beginPath();
  context.strokeStyle = options.gridColor;
  context.lineWidth = 1;

  for (let column = 0; column <= BOARD_WIDTH; column += 1) {
    const x = column * options.cellSize + 0.5;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  for (let row = 0; row <= BOARD_HEIGHT; row += 1) {
    const y = row * options.cellSize + 0.5;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.stroke();
}

function resolveBoardRenderOptions(options: BoardRenderOptions): ResolvedBoardRenderOptions {
  return {
    cellSize: options.cellSize ?? DEFAULT_CELL_SIZE,
    devicePixelRatio: Math.max(options.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1, 1),
    backgroundColor: options.backgroundColor ?? '#020617',
    gridColor: options.gridColor ?? 'rgba(148, 163, 184, 0.2)',
    cellInset: options.cellInset ?? 2,
    lockedCellBorderColor: options.lockedCellBorderColor ?? 'rgba(255, 255, 255, 0.32)',
    activeCellBorderColor: options.activeCellBorderColor ?? 'rgba(255, 255, 255, 0.58)',
    ghostAlpha: options.ghostAlpha ?? 0.55,
    ghostLineColor: options.ghostLineColor ?? 'rgba(226, 232, 240, 0.9)',
  };
}

function resolveNextPiecePreviewOptions(
  options: NextPiecePreviewOptions,
): ResolvedNextPiecePreviewOptions {
  return {
    cellSize: options.cellSize ?? DEFAULT_PREVIEW_CELL_SIZE,
    devicePixelRatio: Math.max(options.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1, 1),
    backgroundColor: options.backgroundColor ?? '#020617',
    gridColor: options.gridColor ?? 'rgba(148, 163, 184, 0.14)',
    cellInset: options.cellInset ?? 2,
    cellBorderColor: options.cellBorderColor ?? 'rgba(255, 255, 255, 0.42)',
  };
}
