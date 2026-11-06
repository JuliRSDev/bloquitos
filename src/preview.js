import { PIECE_COLORS } from './constants.js';
import { SHAPES } from './pieces.js';
import { drawBlock } from './blocks.js';
import { fitCanvas } from './renderer.js';

/**
 * Draws pieces centred in equal slots along the canvas' long axis.
 * Used for both the hold box (1 slot) and the next queue (n slots).
 */
export class PreviewCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = { width: 0, height: 0 };
    this.lastKey = '';
    this.resize();
  }

  resize() {
    this.size = fitCanvas(this.canvas);
    this.lastKey = '';
  }

  /** @param {string[]} types @param {boolean} [dimmed] */
  draw(types, dimmed = false) {
    const key = `${types.join('')}${dimmed}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { width, height } = this.size;
    const { ctx } = this;
    ctx.clearRect(0, 0, width, height);
    const horizontal = width > height;
    const slots = Math.max(types.length, 1);
    const slotW = horizontal ? width / slots : width;
    const slotH = horizontal ? height : height / slots;
    const cell = Math.min(slotW / 4.4, slotH / 3);

    types.forEach((type, i) => {
      const cells = SHAPES[type][0];
      const xs = cells.map(([x]) => x);
      const ys = cells.map(([, y]) => y);
      const w = Math.max(...xs) - Math.min(...xs) + 1;
      const h = Math.max(...ys) - Math.min(...ys) + 1;
      const originX = (horizontal ? i * slotW : 0) + (slotW - w * cell) / 2 - Math.min(...xs) * cell;
      const originY = (horizontal ? 0 : i * slotH) + (slotH - h * cell) / 2 - Math.min(...ys) * cell;
      for (const [cx, cy] of cells) {
        drawBlock(ctx, originX + cx * cell, originY + cy * cell, cell, PIECE_COLORS[type], {
          alpha: dimmed ? 0.35 : 1,
        });
      }
    });
  }
}
