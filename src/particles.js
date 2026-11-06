const GRAVITY = 700; // px/s^2
const MAX_PARTICLES = 500;

export class Particles {
  constructor() {
    this.items = [];
  }

  burst(x, y, color, count, { speed = 160, life = 650, size = 5, lift = 0 } = {}) {
    for (let i = 0; i < count && this.items.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.items.push({
        x, y, color,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - lift,
        life: life * (0.6 + Math.random() * 0.4),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.7),
      });
    }
  }

  update(dt) {
    const s = dt / 1000;
    this.items = this.items.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.vy += GRAVITY * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
      return true;
    });
  }

  draw(ctx) {
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
