// Printing things onto the page.
//
// printEl: a block arrives the way a riso print does. The head scans down in
// steps, the blue and pink passes land out of register, then slide into line.
//
// namePoints: where the ink has to land to spell the name, found by drawing the
// same text into a canvas at the same place and reading back its pixels.
//
// Halftone: layered dot screens at real print angles, mixed with multiply, each
// layer with its own registration offset so it can be printed pass by pass.

import { reduced } from './stage.js';

const css = (el, v, fb) => (getComputedStyle(el).getPropertyValue(v).trim() || fb);

export function printEl(el, { dur = 0.75, delay = 0 } = {}) {
  if (!el || el.dataset.s === 'done' || el.dataset.s === 'printing') return Promise.resolve();
  el.dataset.s = 'printing';
  if (reduced) { el.dataset.s = 'done'; return Promise.resolve(); }
  const a = css(el, '--ink-a', '#2b44e0');
  const b = css(el, '--ink-b', '#ff4d9a');
  const off = Math.min(10, 4 + el.offsetHeight / 60);
  const kf = [
    { opacity: 1, clipPath: 'inset(0 0 100% 0)', filter: `drop-shadow(${off}px 0 0 ${b}) drop-shadow(${-off}px ${off / 2}px 0 ${a})`, transform: 'translateY(5px)', easing: 'steps(9, end)' },
    { opacity: 1, clipPath: 'inset(0 0 0% 0)', filter: `drop-shadow(${off * 0.8}px 0 0 ${b}) drop-shadow(${-off * 0.8}px ${off / 3}px 0 ${a})`, transform: 'translateY(2px)', offset: 0.45, easing: 'cubic-bezier(.2,.9,.25,1)' },
    { opacity: 1, clipPath: 'inset(0 0 0% 0)', filter: `drop-shadow(0px 0 0 ${b}) drop-shadow(0px 0px 0 ${a})`, transform: 'none' },
  ];
  const anim = el.animate(kf, { duration: dur * 1000, delay: delay * 1000, fill: 'backwards' });
  el.dataset.s = 'done';
  el.classList.add('is-printing');
  return anim.finished.catch(() => {}).then(() => el.classList.remove('is-printing'));
}

export function printNow(el) {
  if (!el) return;
  el.getAnimations().forEach((a) => a.finish());
  el.dataset.s = 'done';
}

// --------------------------------------------------------------- the name
export function namePoints(h1, maxPoints = 3200) {
  const box = h1.getBoundingClientRect();
  const c = document.createElement('canvas');
  const w = Math.ceil(box.width), h = Math.ceil(box.height + 40);
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  for (const line of h1.querySelectorAll('.l1, .l2')) {
    const cs = getComputedStyle(line);
    const r = line.getBoundingClientRect();
    const size = parseFloat(cs.fontSize);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing;
    g.textBaseline = 'alphabetic';
    const text = line.textContent;
    const m = g.measureText(text);
    const asc = m.fontBoundingBoxAscent ?? size * 0.9;
    const desc = m.fontBoundingBoxDescent ?? size * 0.25;
    const lh = parseFloat(cs.lineHeight) || size;
    const baseline = r.top - box.top + (lh - (asc + desc)) / 2 + asc;
    const x = r.left - box.left + parseFloat(cs.paddingLeft || 0);
    g.fillText(text, x, baseline);
  }
  const data = g.getImageData(0, 0, w, h).data;
  let filled = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
  filled *= 4;
  const step = Math.max(4, Math.ceil(Math.sqrt(filled / maxPoints)));
  const pts = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x: box.left + x, y: box.top + y, s: step });
    }
  }
  // left to right, so the name builds the way you would write it
  pts.sort((p, q) => p.x - q.x + (Math.random() - 0.5) * step * 30);
  return pts;
}

// --------------------------------------------------------------- halftone
export class Halftone {
  constructor(canvas, layers, { cell = 10, live = true } = {}) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.layers = layers.map((l) => ({ alpha: 1, dx: 0, dy: 0, ...l }));
    this.cell = cell;
    this.t = 0;
    this.pointer = null;
    this.live = live;
    this.visible = true;
    this.resize();
    this._ro = new ResizeObserver(() => { this.resize(); this.draw(); });
    this._ro.observe(canvas);
    if (live) {
      this._io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; });
      this._io.observe(canvas);
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      });
      canvas.addEventListener('pointerleave', () => { this.pointer = null; });
    }
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.dpr = dpr;
  }
  draw(t = this.t) {
    this.t = t;
    const { g, w, h, cell } = this;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    const span = Math.hypot(w, h);
    for (const L of this.layers) {
      if (L.alpha <= 0) continue;
      const ang = (L.angle * Math.PI) / 180;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const cs = L.cell || cell;
      g.globalAlpha = L.alpha;
      g.fillStyle = L.color;
      g.beginPath();
      const n = Math.ceil(span / cs / 2) + 1;
      for (let j = -n; j <= n; j++) {
        for (let i = -n; i <= n; i++) {
          const x = w / 2 + (i * ca - j * sa) * cs;
          const y = h / 2 + (i * sa + j * ca) * cs;
          if (x < -cs || y < -cs || x > w + cs || y > h + cs) continue;
          let v = L.field(x / w, y / h, t, this.pointer);
          if (v <= 0.02) continue;
          if (v > 1) v = 1;
          const r = Math.sqrt(v) * cs * 0.62;
          g.moveTo(x + L.dx + r, y + L.dy);
          g.arc(x + L.dx, y + L.dy, r, 0, Math.PI * 2);
        }
      }
      g.fill();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  start() {
    if (this._raf) return;
    let last = 0;
    const loop = (now) => {
      this._raf = requestAnimationFrame(loop);
      if (!this.visible || now - last < 33) return;
      last = now;
      this.draw(now / 1000);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop() { cancelAnimationFrame(this._raf); this._raf = 0; }
  destroy() { this.stop(); this._ro.disconnect(); this._io && this._io.disconnect(); }
}

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
