// Two ink halftone covers, one per project, drawn from little field functions.
// Each field returns how much ink lands at (u, v) at time t.

import { smooth } from './print.js';
import { inkOf } from './stage.js';

const g2 = (u, v, x, y, r) => Math.exp(-((u - x) ** 2 + (v - y) ** 2) / (r * r));
const seg = (u, v, ax, ay, bx, by) => {
  const px = u - ax, py = v - ay, dx = bx - ax, dy = by - ay;
  const h = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - dx * h, py - dy * h);
};
const bump = (p, u, v) => (p ? 0.55 * g2(u, v, p.x, p.y, 0.12) : 0);

const W_STARS = [[0.16, 0.34], [0.27, 0.66], [0.38, 0.42], [0.5, 0.7], [0.62, 0.36], [0.73, 0.6], [0.84, 0.3]];

export const heroLayers = [
  { color: inkOf('blue'), angle: 15, cell: 11, field: (u, v, t, p) => smooth(0.4, 0.04, Math.hypot(u - 0.56 - 0.03 * Math.sin(t * 0.3), v - 0.46)) * (0.92 + 0.12 * Math.sin(u * 9 + t * 0.7)) + bump(p, u, v) },
  { color: inkOf('pink'), angle: 75, cell: 11, field: (u, v, t, p) => smooth(0.3, 0.0, Math.hypot(u - 0.33, v - 0.69 - 0.02 * Math.cos(t * 0.25))) * 1.05 + bump(p, u, v) * 0.6 },
  { color: inkOf('yolk'), angle: 45, cell: 9, field: (u, v, t, p) => smooth(0.15, 0.0, Math.hypot(u - 0.8, v - 0.19 - 0.015 * Math.sin(t * 0.5))) + bump(p, u, v) * 0.4 },
];

export const coverLayers = {
  'written-in-real-stars': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => 0.18 + 0.7 * smooth(1.1, 0.0, v) + bump(p, u, v) },
    { color: b, angle: 45, cell: 7, field: (u, v, t) => {
      let f = 0;
      for (let i = 0; i < W_STARS.length; i++) {
        const [x, y] = W_STARS[i];
        f += g2(u, v, x, y, 0.035 + 0.008 * Math.sin(t * 3 + i)) * 1.3;
        if (i) f += seg(u, v, W_STARS[i - 1][0], W_STARS[i - 1][1], x, y) < 0.008 ? 0.55 : 0;
      }
      return f;
    } },
  ],
  'ad-factory': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => {
      const scroll = (u + t * 0.06) % (1 / 3);
      const inFrame = scroll > 0.03 && scroll < 1 / 3 - 0.03 && v > 0.22 && v < 0.78;
      const holes = (v < 0.15 || v > 0.85) && ((u + t * 0.06) * 18) % 1 < 0.5 && (v > 0.05 && v < 0.95);
      return (inFrame ? 0.85 : 0.08) + (holes ? 0.9 : 0) + bump(p, u, v);
    } },
    { color: b, angle: 75, field: (u, v) => {
      const x = (u - 0.5) * 1.6, y = v - 0.5;
      return x > -0.1 && x < 0.16 && Math.abs(y) < (0.16 - x) * 0.7 ? 1 : 0;
    } },
  ],
  'bigger-card-images': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => {
      const inCard = Math.abs(u - 0.5) < 0.3 && Math.abs(v - 0.5) < 0.38;
      const edge = inCard && (Math.abs(u - 0.5) > 0.28 || Math.abs(v - 0.5) > 0.36);
      return (edge ? 1 : inCard ? 0.22 : 0.04) + bump(p, u, v);
    } },
    { color: b, angle: 75, field: (u, v, t) => {
      const s = 0.1 + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.4));
      return Math.abs(u - 0.5) < s * 1.2 && Math.abs(v - 0.46) < s ? 0.95 : 0;
    } },
  ],
  'den124-cheat-sheet': ([a, b]) => [
    { color: a, angle: 15, cell: 7, field: (u, v, t, p) => {
      const col = Math.floor(u * 4), cu = u * 4 - col;
      if (cu < 0.08 || cu > 0.92 || v < 0.08 || v > 0.94) return 0.02;
      const row = Math.floor(v * 30);
      const len = 0.45 + 0.5 * ((Math.sin(row * 12.9898 + col * 78.233) * 43758.5453) % 1 + 1) % 1;
      return ((v * 30) % 1 < 0.5 && cu < len ? 0.75 : 0.05) + bump(p, u, v);
    } },
    { color: b, angle: 75, field: (u, v) => {
      const col = Math.floor(u * 4), cu = u * 4 - col;
      const head = v > 0.08 && v < 0.16 && cu > 0.08 && cu < 0.92;
      const flag = Math.abs(v - (0.35 + col * 0.13)) < 0.025 && cu > 0.08 && cu < 0.7;
      return head || flag ? 0.9 : 0;
    } },
  ],
  'tides-of-qingdao': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => 0.12 + 0.75 * smooth(0.1, 1.0, v) + 0.18 * Math.sin(u * 14 - t * 1.2 + v * 6) * smooth(0.0, 0.5, v) + bump(p, u, v) },
    { color: b, angle: 75, field: (u, v, t) => {
      let f = 0;
      for (const [y, sp, ph, sc] of [[0.45, 0.07, 0.1, 1], [0.7, -0.05, 0.6, 0.8], [0.3, 0.04, 0.35, 0.6]]) {
        const x = ((ph + t * sp) % 1 + 1) % 1 * 1.3 - 0.15;
        const dir = sp > 0 ? 1 : -1;
        const du = (u - x) * dir / sc, dv = (v - y - 0.01 * Math.sin(t * 5 + ph * 9)) / sc;
        if ((du / 0.11) ** 2 + (dv / 0.05) ** 2 < 1) f = 1;
        if (du < -0.09 && du > -0.16 && Math.abs(dv) < (-0.09 - du) * 0.9) f = 1;
      }
      return f;
    } },
  ],
  'creature-collector': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => {
      const hill = v > 0.68 - 0.08 * Math.sin(u * 4 + 1) ? 0.85 : 0;
      const sun = smooth(0.12, 0.05, Math.hypot(u - 0.24, v - 0.32)) * (0.5 + 0.5 * Math.sin(t * 0.8));
      return Math.max(hill, sun) + 0.06 + bump(p, u, v);
    } },
    { color: b, angle: 75, field: (u, v, t) => {
      const night = smooth(-0.05, 0.25, u - 0.55 + Math.sin(t * 0.4) * 0.15) * 0.55;
      const moon = Math.hypot(u - 0.76, v - 0.3) < 0.09 && Math.hypot(u - 0.8, v - 0.27) > 0.075 ? 1 : 0;
      const eyes = (Math.hypot(u - 0.66, v - 0.6) < 0.02 || Math.hypot(u - 0.72, v - 0.6) < 0.02) && Math.sin(t * 2) > -0.6 ? 1 : 0;
      return night + moon + eyes;
    } },
  ],
  'bonk-a-brainrot': ([a, b]) => [
    { color: a, angle: 15, field: (u, v, t, p) => (v > 0.8 + 0.03 * Math.sin(u * 16 + t * 2) ? 0.95 : 0.06) + bump(p, u, v) },
    { color: b, angle: 75, field: (u, v, t) => {
      const island = v > 0.55 && v < 0.63 && u > 0.2 && u < 0.8 && Math.floor(u * 12 + 0.5) % 5 !== Math.floor(t) % 5 ? 0.95 : 0;
      const k = (t * 0.5) % 1;
      const bx = 0.45 + k * 0.6, by = 0.45 - Math.sin(k * Math.PI) * 0.3;
      const blob = Math.hypot(u - bx, (v - by) * 1.2) < 0.07 ? 1 : 0;
      return island + blob;
    } },
  ],
};
