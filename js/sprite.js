// Little Me, one pixel at a time.
//
// Every part is a hand typed map, one character per pixel. Parts are stacked
// into a small buffer each frame (legs, pack, body, head, hat, glasses), the
// arm is a Bresenham line from shoulder to hand, and the printer is rotated in
// pixel space with nearest neighbour sampling so it can aim anywhere and still
// look hand drawn.

import { me as defaultLook } from './data.js';

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return (0xff << 24) | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16);
};

const base = {
  k: '#1d1922', e: '#1d1922', w: '#fbfaf6', b: '#f2879f',
  m: '#ff4d9a', M: '#c42a6f', g: '#a7f0d0', G: '#2a8f6a', y: '#ffc414', Y: '#d99a00',
  a: '#ffc414', A: '#ff5b2e', d: '#1d1922', D: '#4b4458',
};

export const looks = {
  tops: {
    blue: { label: 'Blue hoodie', c: '#2b44e0', C: '#1b2c9e', L: '#6a7cff', sleeve: '#2b44e0' },
    pink: { label: 'Pink hoodie', c: '#ff4d9a', C: '#c42a6f', L: '#ff9cc7', sleeve: '#ff4d9a' },
    yolk: { label: 'Yolk hoodie', c: '#ffc414', C: '#d99a00', L: '#ffe27a', sleeve: '#ffc414' },
    moss: { label: 'Moss hoodie', c: '#3a9d4f', C: '#26703a', L: '#7fd18f', sleeve: '#3a9d4f' },
    varsity: { label: 'Varsity', c: '#24202c', C: '#141118', L: '#ff5b2e', sleeve: '#efe7d4' },
    knit: { label: 'Cream knit', c: '#efe7d4', C: '#cfc4aa', L: '#ffffff', sleeve: '#efe7d4' },
  },
  hats: { none: { label: 'No hat' }, cap: { label: 'Cap', q: '#ff5b2e', Q: '#c43c16' }, beanie: { label: 'Beanie', q: '#8e5bd6', Q: '#6a3fb0' } },
  eyes: { none: { label: 'No glasses' }, shades: { label: 'Shades' } },
  shoes: { cream: { label: 'Cream', o: '#fbfaf6', O: '#cfc9bb' }, black: { label: 'Black', o: '#2b2833', O: '#111014' }, tomato: { label: 'Tomato', o: '#ff5b2e', O: '#b83a14' } },
};

export const outfit = { top: 'blue', hat: 'none', eyes: 'none', shoes: 'cream' };
const listeners = new Set();
export function onOutfit(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setOutfit(part, key) {
  outfit[part] = key;
  rebuildPalette();
  listeners.forEach((fn) => fn(outfit));
}

let P = {};
function rebuildPalette() {
  const top = looks.tops[outfit.top];
  const shoe = looks.shoes[outfit.shoes];
  const hat = looks.hats[outfit.hat];
  const src = {
    ...base,
    s: defaultLook.skin, S: defaultLook.skinShade,
    h: defaultLook.hair, H: defaultLook.hairLight,
    p: defaultLook.pants, P: '#1f1d26',
    c: top.c, C: top.C, L: top.L, r: top.sleeve,
    o: shoe.o, O: shoe.O,
    q: hat.q || '#000', Q: hat.Q || '#000',
  };
  if (outfit.top === 'blue') { src.c = defaultLook.hoodie; src.C = defaultLook.hoodieShade; src.L = defaultLook.hoodieLight; src.r = defaultLook.hoodie; }
  if (outfit.shoes === 'cream') { src.o = defaultLook.shoe; src.O = defaultLook.sole; }
  P = {};
  for (const k in src) P[k] = hex(src[k]);
}
rebuildPalette();

const map = (rows) => rows.map((r) => r.replace(/ /g, ''));

const HEAD = map([
  '..kkkkkkk..',
  '.khhhhhhhhk',
  'khhHHhhhhhk',
  'khHhhhhhhhk',
  'khhhhhhhhhk',
  'khhhhhssshk',
  'khhhSsssesk',
  '.khhssssesk',
  '..khsssbsk.',
  '...kkkkkk..',
]);

const BODY = map([
  '.kccccck.',
  'kccccccck',
  'kcCccwcck',
  'kcCccwcck',
  'kcCLLLLck',
  '.kkkkkkk.',
]);

const LEGS = {
  idle: map(['..pp.pp..', '..pp.pp..', '..ooo.ooo', '..OOO.OOO']),
  w0: map(['..ppppp..', '.pp...pp.', 'ooo...ooo', 'OOO...OOO']),
  w1: map(['..pppp...', '...pPp...', '...ooo...', '...OOO...']),
  w2: map(['..ppppp..', '..pp..pp.', '.ooo..ooo', '.OOO..OOO']),
  jump: map(['..ppppp..', '.ppp.ppp.', '.ooo.ooo.', '.OOO.OOO.']),
  sit: map(['..ppppppp', '..ppppppp', '.......oo', '.......OO']),
};

const PACK = map(['.k.', 'kak', 'kak', 'kAk', '.k.']);

const MACHINE = map([
  '.kkkkkk...',
  'kmmmmmmkkk',
  'kmggmmmyyk',
  'kmgGmmmyyk',
  'kMMMMMMkkk',
  '.kk..kk...',
]);
const GRIP = { x: 3, y: 4 };
const NOZZLE = { x: 9, y: 2.5 };

const HATS = {
  cap: { dx: 0, dy: -1, rows: map([
    '...kkkkkk....',
    '..kqqqqqqk...',
    '.kqqQqqqqqk..',
    'kqqqqqqqqqqk.',
    'kqqqqqqqqqqk.',
    'kkkkkkkkqqqqk',
  ]) },
  beanie: { dx: 0, dy: -2, rows: map([
    '....kk.....',
    '...kqqk....',
    '..kqqqqqk..',
    '.kqQqQqQqk.',
    'kqqqqqqqqqk',
    'kQQQQQQQQQk',
    'kQQQQQQQQQk',
  ]) },
};
const SHADES = [[5, 6, 'k'], [6, 6, 'k'], [7, 6, 'd'], [8, 6, 'd'], [9, 6, 'D'], [7, 7, 'd'], [8, 7, 'd'], [9, 7, 'd']];

// ---------------------------------------------------------------- buffer
export const BUF = 36;
export const ORIGIN = { x: 13, y: 33 }; // between the feet, on the ground
const buf = new Uint32Array(BUF * BUF);
const cnv = document.createElement('canvas');
cnv.width = cnv.height = BUF;
const cctx = cnv.getContext('2d');
const img = cctx.createImageData(BUF, BUF);
const img32 = new Uint32Array(img.data.buffer);

function set(x, y, col) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= BUF || y >= BUF) return;
  buf[y * BUF + x] = col;
}
function blit(rows, x, y, sub) {
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      let ch = r[i];
      if (ch === '.') continue;
      if (sub && sub[ch]) ch = sub[ch];
      const col = P[ch];
      if (col !== undefined) set(x + i, y + j, col);
    }
  }
}
function line(x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    set(x0, y0, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
// nearest neighbour rotation of a map about its pivot, placed at (px, py)
function blitRotated(rows, pivot, px, py, ang, sub) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const R = 12;
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const sx = Math.round(c * x + s * y + pivot.x);
      const sy = Math.round(-s * x + c * y + pivot.y);
      if (sy < 0 || sy >= rows.length || sx < 0 || sx >= rows[sy].length) continue;
      let ch = rows[sy][sx];
      if (ch === '.') continue;
      if (sub && sub[ch]) ch = sub[ch];
      const col = P[ch];
      if (col !== undefined) set(px + x, py + y, col);
    }
  }
}

// state: { pose, step, blink, look, aim, fire, flame, ink, t }
export function compose(st) {
  buf.fill(0);
  const ox = ORIGIN.x, oy = ORIGIN.y;
  const air = st.pose === 'jump' || st.pose === 'fall';
  const legKey = st.pose === 'walk' ? ['w0', 'w1', 'w2', 'w1'][st.step & 3] : air ? 'jump' : st.pose === 'sit' ? 'sit' : 'idle';
  const bob = (st.pose === 'walk' && (st.step & 1)) || (st.pose === 'idle' && st.breathe) ? -1 : 0;
  const legs = LEGS[legKey];

  const bodyY = oy - 3 - 6 + bob - (st.pose === 'sit' ? -2 : 0);
  const headY = bodyY - 9;
  const headX = ox - 6;
  const bodyX = ox - 4;

  // jet flame under the pack
  if (st.flame) {
    const f = (st.t * 30) | 0;
    const fy = bodyY + 5;
    set(bodyX - 2 + 1, fy, P.y);
    set(bodyX - 2 + 1, fy + 1, f & 1 ? P.A : P.y);
    if (f & 2) set(bodyX - 2 + 1, fy + 2, P.A);
    if (f & 1) set(bodyX - 2, fy + 1, P.A);
  }
  blit(legs, ox - 4, oy - 3 - (st.pose === 'sit' ? -2 : 0) + (legs.length - 4));
  blit(PACK, bodyX - 2, bodyY + 0);
  blit(BODY, bodyX, bodyY);

  // head, with blinking and looking up or down
  const lookSub = {};
  blit(HEAD, headX, headY, lookSub);
  const eyeX = headX + 8;
  const sk = P.s, ink = P.e;
  if (st.blink) {
    set(eyeX, headY + 6, sk); set(eyeX, headY + 7, ink);
  } else if (st.look < -0.35) {
    set(eyeX, headY + 7, sk); set(eyeX, headY + 5, ink); set(eyeX, headY + 6, ink);
  } else if (st.look > 0.45) {
    set(eyeX, headY + 6, sk); set(eyeX, headY + 7, ink); set(eyeX, headY + 8, ink);
  }
  if (outfit.eyes === 'shades') for (const [x, y, ch] of SHADES) set(headX + x, headY + y, P[ch]);
  if (outfit.hat !== 'none') {
    const h = HATS[outfit.hat];
    blit(h.rows, headX + h.dx, headY + h.dy);
  }

  // arm and printer
  const sh = { x: bodyX + 6, y: bodyY + 2 };
  const aim = st.aim;
  const recoil = st.fire ? ((st.t * 24) | 0) % 2 : 0;
  const hand = { x: sh.x + Math.cos(aim) * (3 - recoil), y: sh.y + 1 + Math.sin(aim) * (3 - recoil) };
  const sub = st.ink != null ? inkSub(st.ink) : null;
  blitRotated(MACHINE, GRIP, hand.x, hand.y, aim, sub);
  line(sh.x, sh.y, hand.x, hand.y, P.r);
  set(hand.x, hand.y, P.s);

  // muzzle position in buffer space, for the stage to spray from
  const c = Math.cos(aim), s = Math.sin(aim);
  const nx = NOZZLE.x - GRIP.x + 1, ny = NOZZLE.y - GRIP.y;
  const muzzle = { x: hand.x + c * nx - s * ny, y: hand.y + s * nx + c * ny };

  img32.set(buf);
  cctx.putImageData(img, 0, 0);
  return { canvas: cnv, muzzle, shoulder: sh };
}

// the screen on the printer fills up as it loads ink
function inkSub(level) {
  if (level >= 0.66) return null;
  if (level >= 0.33) return { G: 'g' };
  return { g: 'G' };
}

// ---------------------------------------------------------------- pixel font
const GLYPHS = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 10001 01010 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111', 3: '11111 00010 00100 00010 00001 10001 01110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
  "'": '00100 00100 01000 00000 00000 00000 00000', '%': '11000 11001 00010 00100 01000 10011 00011',
  ':': '00000 01100 01100 00000 01100 01100 00000', '-': '00000 00000 00000 11111 00000 00000 00000',
  '/': '00001 00001 00010 00100 01000 10000 10000', '+': '00000 00100 00100 11111 00100 00100 00000',
  '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
  '&': '01100 10010 10100 01000 10101 10010 01101', '*': '00000 00100 10101 01110 10101 00100 00000',
  '^': '00100 01110 10101 00100 00100 00100 00100', v: '00100 00100 00100 00100 10101 01110 00100',
  '<': '00010 00100 01000 10000 01000 00100 00010', '>': '01000 00100 00010 00001 00010 00100 01000',
  '~': '00000 01010 11111 11111 01110 00100 00000', ' ': '00000 00000 00000 00000 00000 00000 00000',
};
const FONT = {};
for (const k in GLYPHS) FONT[k] = GLYPHS[k].split(' ').map((r) => parseInt(r, 2));

// ^ and v draw arrows, ~ draws a heart
export function textWidth(str, s) { return str.length * 6 * s - s; }
export function drawText(ctx, str, x, y, s, color) {
  ctx.fillStyle = color;
  for (let n = 0; n < str.length; n++) {
    let ch = str[n];
    if (ch !== 'v' && ch !== '~') ch = ch.toUpperCase();
    const g = FONT[ch] || FONT['?'];
    for (let r = 0; r < 7; r++) {
      const bits = g[r];
      if (!bits) continue;
      for (let c = 0; c < 5; c++) if (bits & (16 >> c)) ctx.fillRect(x + (n * 6 + c) * s, y + r * s, s, s);
    }
  }
}
