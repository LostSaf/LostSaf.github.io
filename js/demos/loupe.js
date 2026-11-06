// The DEN124 sheet, real file, under a loupe. The page is shown whole and too
// small to read; a second copy of the same document sits inside the lens at
// reading size, moved so the spot under your cursor is in the middle of it.

import { el } from './kit.js';

const SRC = 'assets/den124/cheat-sheet.html';
const PAGE_W = 780;

export function mount(host) {
  host.style.background = '#d9d3c4';
  host.style.touchAction = 'pan-y';
  const scroller = el('div', { style: 'position:absolute;inset:0;overflow:auto;cursor:none' });
  const sheet = el('div', { style: 'position:relative;margin:24px auto;box-shadow:0 1px 0 #17141c,6px 6px 0 rgba(23,20,28,.18);background:#fff;overflow:hidden' });
  const page = el('iframe', { src: SRC, title: 'DEN124 microbiology cheat sheet', tabindex: '-1', style: `border:0;width:${PAGE_W}px;transform-origin:0 0;pointer-events:none;display:block` });
  sheet.appendChild(page);
  scroller.appendChild(sheet);
  host.appendChild(scroller);

  const R = 130, L = 1.45;
  const lens = el('div', { style: `position:absolute;width:${R * 2}px;height:${R * 2}px;border-radius:50%;overflow:hidden;border:3px solid #17141c;box-shadow:0 0 0 6px #8e5bd6,0 14px 40px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .2s;background:#fff` });
  const zoomed = el('iframe', { src: SRC, title: '', tabindex: '-1', 'aria-hidden': 'true', style: `border:0;width:${PAGE_W}px;transform-origin:0 0;pointer-events:none;position:absolute;left:0;top:0` });
  lens.appendChild(zoomed);
  host.appendChild(lens);
  const hint = el('div', { class: 'dpanel', style: 'left:14px;bottom:14px;padding:8px 12px;pointer-events:none' }, '<h4 style="margin:0">MOVE OVER THE SHEET. SCROLL FOR PAGE 2.</h4>');
  host.appendChild(hint);

  let scale = 0.6, docH = 2200;
  const fit = () => {
    // a whole A4 page in view, too small to read without the lens
    const w = host.clientWidth, h = host.clientHeight;
    scale = Math.min(1, (w - 48) / PAGE_W, (h - 48) / (PAGE_W * 297 / 210));
    page.style.transform = `scale(${scale})`;
    sheet.style.width = `${PAGE_W * scale}px`;
    sheet.style.height = `${docH * scale}px`;
  };
  const measure = () => {
    try {
      const d = page.contentDocument.documentElement;
      docH = Math.max(d.scrollHeight, 600);
      page.style.height = zoomed.style.height = `${docH}px`;
    } catch { /* cross origin, keep the default */ }
    fit();
  };
  page.addEventListener('load', measure);
  zoomed.addEventListener('load', () => { zoomed.style.height = `${docH}px`; });
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  fit();

  const move = (e) => {
    const hr = host.getBoundingClientRect();
    const sr = sheet.getBoundingClientRect();
    const x = e.clientX - sr.left, y = e.clientY - sr.top;
    const inside = x >= 0 && y >= 0 && x <= sr.width && y <= sr.height;
    lens.style.opacity = inside ? 1 : 0;
    lens.style.left = `${e.clientX - hr.left - R}px`;
    lens.style.top = `${e.clientY - hr.top - R}px`;
    const dx = x / scale, dy = y / scale;
    zoomed.style.transform = `translate(${R - dx * L}px, ${R - dy * L}px) scale(${L})`;
  };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', () => { lens.style.opacity = 0; });

  return () => { ro.disconnect(); };
}
