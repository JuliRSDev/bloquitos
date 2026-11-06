import { CLEAR_ANIM_MS, COLS, HIDDEN_ROWS, PIECE_COLORS, VISIBLE_ROWS } from './constants.js';
import { SHAPES } from './pieces.js';
import { drawBlock, drawGhostBlock } from './blocks.js';
import { Particles } from './particles.js';

/** Resizes a canvas backing store to its CSS size and returns the CSS-pixel size. */
export function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cell = 20;
    this.particles = new Particles();
    this.resize();
  }

  resize() {
    const { width, height } = fitCanvas(this.canvas);
    this.cell = Math.min(width / COLS, height / VISIBLE_ROWS);
    this.size = { width, height };
  }

  render(game, dt) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.drawGrid();
    this.drawLocked(game);
    if (game.current && game.status !== 'ready') {
      this.drawGhost(game);
      this.drawCurrent(game);
    }
    this.particles.update(dt);
    this.particles.draw(ctx);
  }

  drawGrid() {
    const { ctx, cell } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(c * cell, 0);
      ctx.lineTo(c * cell, VISIBLE_ROWS * cell);
    }
    for (let r = 1; r < VISIBLE_ROWS; r++) {
      ctx.moveTo(0, r * cell);
      ctx.lineTo(COLS * cell, r * cell);
    }
    ctx.stroke();
  }

  drawLocked(game) {
    const { ctx, cell } = this;
    const clearing = game.clearing;
    const progress = clearing ? Math.min(clearing.elapsed / CLEAR_ANIM_MS, 1) : 0;
    for (let r = HIDDEN_ROWS; r < game.board.length; r++) {
      const isClearing = clearing?.rows.includes(r) ?? false;
      for (let c = 0; c < COLS; c++) {
        const type = game.board[r][c];
        if (!type) continue;
        const x = c * cell;
        const y = (r - HIDDEN_ROWS) * cell;
        if (!isClearing) {
          drawBlock(ctx, x, y, cell, PIECE_COLORS[type]);
          continue;
        }
        const flash = Math.sin(progress * Math.PI * 3) > 0 ? '#ffffff' : PIECE_COLORS[type];
        drawBlock(ctx, x, y, cell, flash, { alpha: 1 - progress * progress, glow: true });
      }
    }
  }

  drawGhost(game) {
    const { type, rot, x } = game.current;
    const gy = game.ghostY();
    for (const [cx, cy] of SHAPES[type][rot]) {
      const row = gy + cy - HIDDEN_ROWS;
      if (row < 0) continue;
      drawGhostBlock(this.ctx, (x + cx) * this.cell, row * this.cell, this.cell, PIECE_COLORS[type]);
    }
  }

  drawCurrent(game) {
    const { type, rot, x, y } = game.current;
    for (const [cx, cy] of SHAPES[type][rot]) {
      const row = y + cy - HIDDEN_ROWS;
      if (row < 0) continue;
      drawBlock(this.ctx, (x + cx) * this.cell, row * this.cell, this.cell, PIECE_COLORS[type], { glow: true });
    }
  }

  /** Confetti from every cell of the cleared rows. Call while the rows are still on the board. */
  burstRows(board, rows, lines) {
    for (const r of rows) {
      for (let c = 0; c < COLS; c++) {
        const type = board[r][c];
        if (!type) continue;
        this.particles.burst(
          (c + 0.5) * this.cell, (r - HIDDEN_ROWS + 0.5) * this.cell, PIECE_COLORS[type],
          lines >= 4 ? 5 : 2, { speed: 120 + lines * 60, lift: 120, size: this.cell * 0.28 },
        );
      }
    }
  }

  /** Little dust puff where a hard-dropped piece lands. */
  dust(cells) {
    for (const [cx, cy] of cells) {
      this.particles.burst(
        (cx + 0.5) * this.cell, (cy - HIDDEN_ROWS + 1) * this.cell, '#ffffff',
        1, { speed: 70, life: 350, size: this.cell * 0.14, lift: 60 },
      );
    }
  }
}
