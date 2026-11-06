// Shared bits for the demos: a canvas that keeps itself sized, a loop that
// pauses off screen, and keyboard state scoped to the demo that has focus.

export function stage(host, { pixel = false } = {}) {
  const c = document.createElement('canvas');
  host.appendChild(c);
  const g = c.getContext('2d');
  const s = { c, g, w: 1, h: 1, dpr: 1 };
  const fit = () => {
    const r = host.getBoundingClientRect();
    s.dpr = Math.min(devicePixelRatio || 1, 2);
    s.w = Math.max(1, Math.round(r.width));
    s.h = Math.max(1, Math.round(r.height));
    c.width = Math.round(s.w * s.dpr);
    c.height = Math.round(s.h * s.dpr);
    g.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    g.imageSmoothingEnabled = !pixel;
    s.onResize && s.onResize();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  fit();
  s.destroy = () => ro.disconnect();
  return s;
}

export function loop(host, fn) {
  let raf = 0, last = performance.now(), visible = true;
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; });
  io.observe(host);
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) fn(dt, now / 1000);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); io.disconnect(); };
}

export function keys(host, prevent = []) {
  const down = new Set();
  const kd = (e) => {
    down.add(e.key.toLowerCase());
    if (prevent.includes(e.key.toLowerCase()) || prevent.includes(e.code)) e.preventDefault();
  };
  const ku = (e) => down.delete(e.key.toLowerCase());
  const blur = () => down.clear();
  host.addEventListener('keydown', kd);
  host.addEventListener('keyup', ku);
  host.addEventListener('blur', blur);
  host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }));
  return { down, off: () => { host.removeEventListener('keydown', kd); host.removeEventListener('keyup', ku); host.removeEventListener('blur', blur); } };
}

export function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'style') e.style.cssText = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (html) e.innerHTML = html;
  return e;
}

export const INK = {
  paper: '#fbfaf6', ink: '#17141c', blue: '#2b44e0', pink: '#ff4d9a', yolk: '#ffc414',
  teal: '#00897b', tomato: '#ff5b2e', violet: '#8e5bd6', moss: '#3a9d4f',
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
