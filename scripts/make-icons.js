// Rasterizes the app icon (same shapes as icons/icon.svg) into PNGs. Run: node scripts/make-icons.js
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../icons/', import.meta.url);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Blocks on a 512 grid: [x, y, color]
const BLOCKS = [
  [96, 256, '#c084fc'], [192, 256, '#c084fc'], [288, 256, '#c084fc'], [192, 160, '#c084fc'],
  [96, 352, '#ff7ab8'], [192, 352, '#ff7ab8'], [288, 352, '#5ee7ff'], [384, 352, '#5ee7ff'],
];
const BLOCK = 96;
const RADIUS = 22;

function insideRoundedRect(px, py, x, y, size, r) {
  if (px < x || py < y || px >= x + size || py >= y + size) return false;
  const cx = Math.min(Math.max(px, x + r), x + size - r);
  const cy = Math.min(Math.max(py, y + r), y + size - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function pixel(u, v) {
  for (const [x, y, color] of BLOCKS) {
    if (insideRoundedRect(u, v, x, y, BLOCK, RADIUS)) {
      const edge = !insideRoundedRect(u, v, x + 3, y + 3, BLOCK - 6, RADIUS - 3);
      const c = hex(color);
      return edge ? c.map((n) => Math.round(n * 0.72 + 255 * 0.28)) : c;
    }
  }
  const t = (u + v) / 1024;
  return [0x2b, 0x11, 0x50].map((a, i) => Math.round(a + ([0x12, 0x0d, 0x2b][i] - a) * t));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(size) {
  const SS = 3; // supersampling for smooth edges
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = pixel(((x + (sx + 0.5) / SS) / size) * 512, ((y + (sy + 0.5) / SS) / size) * 512);
          c.forEach((n, i) => { sum[i] += n; });
        }
      }
      sum.forEach((n, i) => { raw[y * (size * 3 + 1) + 1 + x * 3 + i] = Math.round(n / (SS * SS)); });
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(name, OUT), png(size));
  console.log('wrote', name);
}
