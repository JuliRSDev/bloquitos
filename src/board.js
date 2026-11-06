import { COLS, ROWS } from './constants.js';
import { SHAPES } from './pieces.js';

export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function absoluteCells(type, rot, x, y) {
  return SHAPES[type][rot].map(([cx, cy]) => [x + cx, y + cy]);
}

export function collides(board, type, rot, x, y) {
  return SHAPES[type][rot].some(([cx, cy]) => {
    const bx = x + cx;
    const by = y + cy;
    if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return true;
    return board[by][bx] !== null;
  });
}

export function lockPiece(board, type, rot, x, y) {
  for (const [bx, by] of absoluteCells(type, rot, x, y)) board[by][bx] = type;
}

export function findFullRows(board) {
  return board.flatMap((row, i) => (row.every((cell) => cell !== null) ? [i] : []));
}

/** Removes the given rows in place and pads the top with empty ones. */
export function removeRows(board, rows) {
  const toRemove = new Set(rows);
  const kept = board.filter((_, i) => !toRemove.has(i));
  const empty = Array.from({ length: rows.length }, () => Array(COLS).fill(null));
  board.splice(0, board.length, ...empty, ...kept);
}

export function dropDistance(board, type, rot, x, y) {
  let distance = 0;
  while (!collides(board, type, rot, x, y + distance + 1)) distance++;
  return distance;
}

/** 3-corner T-spin check: walls and floor count as occupied corners. */
export function isTSpinCorners(board, x, y) {
  const corners = [[x, y], [x + 2, y], [x, y + 2], [x + 2, y + 2]];
  const occupied = corners.filter(([cx, cy]) => {
    if (cx < 0 || cx >= COLS || cy >= ROWS) return true;
    if (cy < 0) return false;
    return board[cy][cx] !== null;
  });
  return occupied.length >= 3;
}
