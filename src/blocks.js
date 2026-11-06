function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Glossy rounded block. `x`,`y` is the top-left corner of the cell. */
export function drawBlock(ctx, x, y, size, color, { alpha = 1, glow = false } = {}) {
  const pad = Math.max(1, size * 0.07);
  const s = size - pad * 2;
  const r = size * 0.24;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.55;
  }
  ctx.fillStyle = color;
  roundedRect(ctx, x + pad, y + pad, s, s, r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  roundedRect(ctx, x + pad + s * 0.12, y + pad + s * 0.1, s * 0.76, s * 0.26, r * 0.6);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundedRect(ctx, x + pad + s * 0.12, y + pad + s * 0.72, s * 0.76, s * 0.17, r * 0.5);
  ctx.fill();
  ctx.restore();
}

export function drawGhostBlock(ctx, x, y, size, color) {
  const pad = Math.max(1.5, size * 0.09);
  const s = size - pad * 2;
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = color;
  roundedRect(ctx, x + pad, y + pad, s, s, size * 0.22);
  ctx.fill();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.07);
  ctx.stroke();
  ctx.restore();
}
