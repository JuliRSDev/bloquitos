import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECE_TYPES } from '../src/constants.js';
import { createBag } from '../src/bag.js';
import { gravityMs, levelForLines, scoreLineClear, scoreTSpinNoLines } from '../src/scoring.js';
import { seededRng } from './helpers.js';

test('each group of 7 draws contains every piece exactly once', () => {
  const bag = createBag(seededRng(7));
  for (let i = 0; i < 5; i++) {
    const group = Array.from({ length: 7 }, () => bag.next());
    assert.deepEqual([...group].sort(), [...PIECE_TYPES].sort());
  }
});

test('peek does not consume and matches the next draws', () => {
  const bag = createBag(seededRng(3));
  const preview = bag.peek(10);
  assert.deepEqual(bag.peek(10), preview);
  assert.deepEqual(Array.from({ length: 10 }, () => bag.next()), preview);
});

test('level goes up every 10 lines', () => {
  assert.equal(levelForLines(0), 1);
  assert.equal(levelForLines(9), 1);
  assert.equal(levelForLines(10), 2);
  assert.equal(levelForLines(35), 4);
});

test('gravity gets faster with level and never stalls', () => {
  assert.equal(gravityMs(1), 1000);
  assert.ok(gravityMs(5) < gravityMs(1));
  assert.ok(gravityMs(99) >= 16);
});

const base = { tSpin: false, level: 1, combo: 0, backToBack: false };

test('line clear scores scale with level', () => {
  assert.equal(scoreLineClear({ ...base, lines: 1 }).points, 100);
  assert.equal(scoreLineClear({ ...base, lines: 4, level: 3 }).points, 2400);
});

test('back-to-back applies only to difficult clears', () => {
  const quad = scoreLineClear({ ...base, lines: 4, backToBack: true });
  assert.equal(quad.points, 1200);
  assert.equal(quad.backToBackApplied, true);
  const single = scoreLineClear({ ...base, lines: 1, backToBack: true });
  assert.equal(single.backToBackApplied, false);
});

test('combo adds a bonus from the second consecutive clear', () => {
  assert.equal(scoreLineClear({ ...base, lines: 1, combo: 2, level: 2 }).points, 200 + 200);
});

test('t-spin scoring', () => {
  assert.equal(scoreLineClear({ ...base, lines: 2, tSpin: true }).points, 1200);
  assert.equal(scoreTSpinNoLines(2), 800);
});
