// Building things in front of you.
//
// buildIn: a block appears pixel by pixel. A mask the size of the block is
// drawn into a canvas a few cells at a time, in a random order that leans from
// the bottom up, and set as the block's CSS mask at each step.
//
// namePoints: where the ink has to land to spell the name, found by drawing the
// same text into a canvas at the same place and reading back its pixels.

import { reduced } from './stage.js';
import { sfx } from './sfx.js';

export function buildIn(el, { dur = 0.7, delay = 0, cell = 0 } = {}) {
  if (!el || el.dataset.s === 'done' || el.dataset.s === 'building') return Promise.resolve();
  if (reduced) { el.dataset.s = 'done'; return Promise.resolve(); }
  el.dataset.s = 'building';
  return new Promise((res) => {
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(r.width)), h = Math.max(1, Math.ceil(r.height));
      const c = cell || Math.max(8, Math.round(Math.sqrt(w * h) / 22));
      const cols = Math.ceil(w / c), rows = Math.ceil(h / c);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      const order = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) order.push([x, y, Math.random() + (rows - y) / rows * 0.9]);
      order.sort((a, b) => a[2] - b[2]);
      const steps = 12;
      let k = 0;
      g.fillStyle = '#000';
      const tick = () => {
        const upto = Math.ceil(order.length * (k + 1) / steps);
        for (let i = Math.ceil(order.length * k / steps); i < upto; i++) g.fillRect(order[i][0] * c, order[i][1] * c, c, c);
        const url = `url(${cv.toDataURL()})`;
        el.style.webkitMaskImage = url; el.style.maskImage = url;
        el.style.webkitMaskSize = '100% 100%'; el.style.maskSize = '100% 100%';
        el.style.webkitMaskRepeat = 'no-repeat'; el.style.maskRepeat = 'no-repeat';
        if (k === 0) { el.dataset.s = 'done'; }
        if (k % 3 === 0) sfx.build();
        k++;
        if (k < steps) setTimeout(tick, (dur * 1000) / steps);
        else {
          el.style.webkitMaskImage = el.style.maskImage = '';
          res();
        }
      };
      tick();
    }, delay * 1000);
  });
}

export function buildNow(el) {
  if (!el) return;
  el.style.webkitMaskImage = el.style.maskImage = '';
  el.dataset.s = 'done';
}

export function namePoints(h1, maxPoints = 3000) {
  const box = h1.getBoundingClientRect();
  const c = document.createElement('canvas');
  const w = Math.ceil(box.width), h = Math.ceil(box.height + 30);
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  for (const line of h1.querySelectorAll('span')) {
    const cs = getComputedStyle(line);
    const r = line.getBoundingClientRect();
    const size = parseFloat(cs.fontSize);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing;
    g.textBaseline = 'alphabetic';
    let text = line.textContent;
    if (cs.textTransform === 'uppercase') text = text.toUpperCase();
    const m = g.measureText(text);
    const asc = m.fontBoundingBoxAscent ?? size * 0.8;
    const desc = m.fontBoundingBoxDescent ?? size * 0.2;
    const lh = parseFloat(cs.lineHeight) || size;
    const baseline = r.top - box.top + (lh - (asc + desc)) / 2 + asc;
    g.fillText(text, r.left - box.left, baseline);
  }
  const data = g.getImageData(0, 0, w, h).data;
  let filled = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
  filled *= 4;
  const step = Math.max(4, Math.ceil(Math.sqrt(filled / maxPoints)));
  const pts = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
    if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x: box.left + x, y: box.top + y, s: step });
  }
  pts.sort((p, q) => p.x - q.x + (Math.random() - 0.5) * step * 30);
  return pts;
}
