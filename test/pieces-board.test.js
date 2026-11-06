import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECE_TYPES, COLS, ROWS } from '../src/constants.js';
import { SHAPES, getKicks } from '../src/pieces.js';
import {
  createBoard, collides, lockPiece, findFullRows, removeRows, dropDistance, isTSpinCorners,
} from '../src/board.js';

test('every piece has 4 cells in each of its 4 rotations', () => {
  for (const type of PIECE_TYPES) {
    assert.equal(SHAPES[type].length, 4);
    for (const cells of SHAPES[type]) assert.equal(cells.length, 4, type);
  }
});

test('O never changes shape and gets a single no-op kick', () => {
  assert.deepEqual(SHAPES.O[0], SHAPES.O[1]);
  assert.deepEqual(getKicks('O', 0, 1), [[0, 0]]);
});

test('kicks flip the SRS y axis to board coordinates', () => {
  assert.deepEqual(getKicks('T', 0, 1)[2], [-1, -1]);
  assert.equal(getKicks('I', 1, 2).length, 5);
});

test('walls, floor and locked cells collide', () => {
  const board = createBoard();
  assert.equal(collides(board, 'O', 0, -1, 5), true);
  assert.equal(collides(board, 'O', 0, COLS - 1, 5), true);
  assert.equal(collides(board, 'O', 0, 4, ROWS - 1), true);
  assert.equal(collides(board, 'O', 0, 4, 5), false);
  lockPiece(board, 'O', 0, 4, 5);
  assert.equal(collides(board, 'O', 0, 4, 5), true);
});

test('dropDistance stops on the floor', () => {
  const board = createBoard();
  assert.equal(dropDistance(board, 'O', 0, 4, 0), ROWS - 2);
});

test('full rows are found and removed, rows above fall', () => {
  const board = createBoard();
  board[ROWS - 1].fill('I');
  board[ROWS - 2][0] = 'T';
  assert.deepEqual(findFullRows(board), [ROWS - 1]);
  removeRows(board, [ROWS - 1]);
  assert.equal(board.length, ROWS);
  assert.equal(board[ROWS - 1][0], 'T');
  assert.equal(findFullRows(board).length, 0);
});

test('T-spin needs 3 occupied corners (walls count)', () => {
  const board = createBoard();
  assert.equal(isTSpinCorners(board, 4, 10), false);
  board[10][4] = 'I';
  board[10][6] = 'I';
  assert.equal(isTSpinCorners(board, 4, 10), false);
  board[12][4] = 'I';
  assert.equal(isTSpinCorners(board, 4, 10), true);
  assert.equal(isTSpinCorners(createBoard(), -1, ROWS - 2), true);
});
