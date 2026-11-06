import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { CLEAR_ANIM_MS, COLS, LOCK_DELAY_MS, ROWS } from '../src/constants.js';
import { seededRng } from './helpers.js';

function newGame() {
  const events = [];
  const game = new Game({ rng: seededRng(11), onEvent: (type, data) => events.push({ type, data }) });
  game.start();
  return { game, events };
}

test('start spawns a piece in play', () => {
  const { game } = newGame();
  assert.equal(game.status, 'playing');
  assert.ok(game.current);
});

test('gravity moves the piece down one row per second at level 1', () => {
  const { game } = newGame();
  const y = game.current.y;
  game.update(999);
  assert.equal(game.current.y, y);
  game.update(1);
  assert.equal(game.current.y, y + 1);
});

test('hard drop scores 2 per row and spawns the next piece', () => {
  const { game, events } = newGame();
  game.spawn('O');
  game.hardDrop();
  const drop = events.find((e) => e.type === 'harddrop').data;
  assert.equal(drop.distance, ROWS - 2 - 1);
  assert.equal(game.score, drop.distance * 2);
  assert.ok(game.current);
});

test('a grounded piece locks after the lock delay', () => {
  const { game, events } = newGame();
  game.spawn('O');
  game.current.y = ROWS - 2;
  game.update(LOCK_DELAY_MS);
  assert.ok(events.some((e) => e.type === 'lock'));
});

test('hold swaps once per piece', () => {
  const { game } = newGame();
  game.spawn('T');
  assert.equal(game.holdPiece(), true);
  assert.equal(game.holdType, 'T');
  assert.equal(game.holdPiece(), false);
  game.hardDrop();
  game.update(CLEAR_ANIM_MS);
  const incoming = game.current.type;
  assert.equal(game.holdPiece(), true);
  assert.equal(game.current.type, 'T');
  assert.equal(game.holdType, incoming);
});

test('clearing one line scores and removes the row after the animation', () => {
  const { game, events } = newGame();
  game.board[ROWS - 1].fill('Z', 0, 6);
  game.spawn('I');
  game.current.x = 6;
  game.hardDrop();
  const clear = events.find((e) => e.type === 'clear').data;
  assert.equal(clear.lines, 1);
  assert.equal(game.lines, 1);
  game.update(CLEAR_ANIM_MS);
  assert.equal(game.board[ROWS - 1].every((c) => c === null), true);
  assert.ok(game.current);
});

test('four lines at once is worth 800 and a second one chains back-to-back', () => {
  const { game, events } = newGame();
  const fillWell = () => {
    for (let r = ROWS - 4; r < ROWS; r++) game.board[r].fill('Z', 0, COLS - 1);
  };
  fillWell();
  game.spawn('I');
  game.rotate(1);
  game.current.x = COLS - 3;
  game.hardDrop();
  const first = events.filter((e) => e.type === 'clear')[0].data;
  assert.equal(first.lines, 4);
  assert.equal(first.points, 800);
  game.update(CLEAR_ANIM_MS);

  fillWell();
  game.spawn('I');
  game.rotate(1);
  game.current.x = COLS - 3;
  game.hardDrop();
  const second = events.filter((e) => e.type === 'clear')[1].data;
  assert.equal(second.backToBack, true);
});

test('wall kick lets T rotate against the left wall', () => {
  const { game } = newGame();
  game.spawn('T');
  game.current.rot = 1;
  game.current.x = -1;
  game.current.y = 10;
  assert.equal(game.rotate(1), true);
  assert.equal(game.current.rot, 2);
  assert.equal(game.current.x, 0);
});

test('game ends when a new piece cannot spawn', () => {
  const { game, events } = newGame();
  for (let r = 0; r < 4; r++) game.board[r].fill('I');
  game.spawn('T');
  assert.equal(game.status, 'over');
  assert.ok(events.some((e) => e.type === 'gameover'));
});

test('pause freezes gravity', () => {
  const { game } = newGame();
  const y = game.current.y;
  game.togglePause();
  game.update(5000);
  assert.equal(game.current.y, y);
  game.togglePause();
  assert.equal(game.status, 'playing');
});

test('soft drop speeds gravity up and scores a point per row', () => {
  const { game } = newGame();
  const y = game.current.y;
  game.setSoftDrop(true);
  game.update(100);
  assert.ok(game.current.y >= y + 2);
  assert.equal(game.score, game.current.y - y);
});
