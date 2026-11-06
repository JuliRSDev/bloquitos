import { CLEAR_ANIM_MS, HIDDEN_ROWS, LOCK_DELAY_MS, MAX_LOCK_RESETS } from './constants.js';
import { getKicks, spawnX } from './pieces.js';
import {
  absoluteCells, collides, createBoard, dropDistance, findFullRows,
  isTSpinCorners, lockPiece, removeRows,
} from './board.js';
import { createBag } from './bag.js';
import { gravityMs, levelForLines, scoreLineClear, scoreTSpinNoLines } from './scoring.js';

const SOFT_DROP_DIVISOR = 20;
const SPAWN_Y = 1;

/**
 * Pure game state machine (no DOM). Side effects are reported through `onEvent`:
 * start, move, rotate, hold, lock, harddrop, clear, tspin, levelup, pause, gameover.
 */
export class Game {
  constructor({ rng = Math.random, onEvent = () => {} } = {}) {
    this.rng = rng;
    this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.board = createBoard();
    this.bag = createBag(this.rng);
    this.current = null;
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.status = 'ready';
    this.clearing = null;
    this.softDrop = false;
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastWasRotation = false;
  }

  start() {
    this.reset();
    this.status = 'playing';
    this.emit('start');
    this.spawn();
  }

  emit(type, data = {}) {
    this.onEvent(type, data);
  }

  upcoming(count) {
    return this.bag.peek(count);
  }

  isActive() {
    return this.status === 'playing' && this.current !== null;
  }

  ghostY() {
    const { type, rot, x, y } = this.current;
    return y + dropDistance(this.board, type, rot, x, y);
  }

  spawn(type = this.bag.next()) {
    this.gravityAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lastWasRotation = false;
    const piece = { type, rot: 0, x: spawnX(type), y: SPAWN_Y };
    if (collides(this.board, type, 0, piece.x, piece.y)) {
      this.endGame();
      return;
    }
    this.current = piece;
  }

  nextPiece() {
    this.canHold = true;
    this.spawn();
  }

  endGame() {
    this.current = null;
    this.status = 'over';
    this.emit('gameover', { score: this.score, lines: this.lines, level: this.level });
  }

  togglePause() {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.softDrop = false;
    } else if (this.status === 'paused') {
      this.status = 'playing';
    } else {
      return;
    }
    this.emit('pause', { paused: this.status === 'paused' });
  }

  isGrounded() {
    const { type, rot, x, y } = this.current;
    return collides(this.board, type, rot, x, y + 1);
  }

  /** Called after a successful move/rotation: grounded pieces get their lock timer reset (limited). */
  refreshLockDelay() {
    if (!this.isGrounded()) {
      this.lockTimer = 0;
      return;
    }
    if (this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  move(dx) {
    if (!this.isActive()) return false;
    const { type, rot, x, y } = this.current;
    if (collides(this.board, type, rot, x + dx, y)) return false;
    this.current.x += dx;
    this.lastWasRotation = false;
    this.refreshLockDelay();
    this.emit('move');
    return true;
  }

  /** @param {1 | -1} dir 1 = clockwise */
  rotate(dir) {
    if (!this.isActive()) return false;
    const { type, rot, x, y } = this.current;
    const to = (rot + dir + 4) % 4;
    for (const [kx, ky] of getKicks(type, rot, to)) {
      if (collides(this.board, type, to, x + kx, y + ky)) continue;
      this.current.rot = to;
      this.current.x = x + kx;
      this.current.y = y + ky;
      this.lastWasRotation = true;
      this.refreshLockDelay();
      this.emit('rotate');
      return true;
    }
    return false;
  }

  setSoftDrop(on) {
    this.softDrop = on;
  }

  hardDrop() {
    if (!this.isActive()) return;
    const { type, rot, x, y } = this.current;
    const distance = dropDistance(this.board, type, rot, x, y);
    if (distance > 0) this.lastWasRotation = false;
    this.current.y += distance;
    this.score += distance * 2;
    this.emit('harddrop', { distance, cells: absoluteCells(type, rot, x, y + distance) });
    this.lockCurrent();
  }

  holdPiece() {
    if (!this.isActive() || !this.canHold) return false;
    const previous = this.holdType;
    this.holdType = this.current.type;
    this.canHold = false;
    this.emit('hold');
    this.spawn(previous ?? undefined);
    return true;
  }

  lockCurrent() {
    const { type, rot, x, y } = this.current;
    const tSpin = type === 'T' && this.lastWasRotation && isTSpinCorners(this.board, x, y);
    const cells = absoluteCells(type, rot, x, y);
    lockPiece(this.board, type, rot, x, y);
    this.current = null;
    this.emit('lock', { cells, type });

    if (cells.every(([, cy]) => cy < HIDDEN_ROWS)) {
      this.endGame();
      return;
    }
    const rows = findFullRows(this.board);
    if (rows.length === 0) {
      this.combo = -1;
      if (tSpin) {
        this.score += scoreTSpinNoLines(this.level);
        this.emit('tspin', { lines: 0 });
      }
      this.nextPiece();
      return;
    }
    this.startClear(rows, tSpin);
  }

  startClear(rows, tSpin) {
    const lines = rows.length;
    this.combo += 1;
    const { points, difficult, backToBackApplied } = scoreLineClear({
      lines, tSpin, level: this.level, combo: this.combo, backToBack: this.backToBack,
    });
    this.score += points;
    this.backToBack = difficult;
    const previousLevel = this.level;
    this.lines += lines;
    this.level = levelForLines(this.lines);
    this.clearing = { rows, elapsed: 0 };
    this.emit('clear', {
      rows, lines, tSpin, combo: this.combo, backToBack: backToBackApplied, points,
    });
    if (this.level > previousLevel) this.emit('levelup', { level: this.level });
  }

  tryStepDown() {
    const { type, rot, x, y } = this.current;
    if (collides(this.board, type, rot, x, y + 1)) return false;
    this.current.y += 1;
    this.lastWasRotation = false;
    if (this.softDrop) this.score += 1;
    return true;
  }

  update(dt) {
    if (this.status !== 'playing') return;

    if (this.clearing) {
      this.clearing.elapsed += dt;
      if (this.clearing.elapsed >= CLEAR_ANIM_MS) {
        removeRows(this.board, this.clearing.rows);
        this.clearing = null;
        this.nextPiece();
      }
      return;
    }
    if (!this.current) return;

    const gravity = gravityMs(this.level);
    const interval = this.softDrop ? Math.min(gravity, Math.max(gravity / SOFT_DROP_DIVISOR, 30)) : gravity;
    this.gravityAcc += dt;
    while (this.gravityAcc >= interval) {
      if (!this.tryStepDown()) {
        this.gravityAcc = 0;
        break;
      }
      this.gravityAcc -= interval;
    }

    if (!this.isGrounded()) {
      this.lockTimer = 0;
      return;
    }
    this.lockTimer += dt;
    if (this.lockTimer >= LOCK_DELAY_MS) this.lockCurrent();
  }
}
