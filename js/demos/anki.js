// Bigger Card Images, played back in a pretend Anki.
// Two scales multiply: one for every card and one remembered per card. The
// shortcuts are the add-on's own.

import { el } from './kit.js';

const CARDS = [
  { q: 'Gram positive rods in long chains, spore forming. Which genus?', a: 'Bacillus', draw: 'rods' },
  { q: 'Gram positive cocci in grape-like clusters. Which genus?', a: 'Staphylococcus', draw: 'clusters' },
  { q: 'Gram positive cocci in chains. Which genus?', a: 'Streptococcus', draw: 'chains' },
];

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function micrograph(kind, seed) {
  const r = rnd(seed);
  const parts = [];
  const stain = '#5b2a91', light = '#8e5bd6';
  if (kind === 'rods') {
    for (let c = 0; c < 6; c++) {
      let x = 20 + r() * 160, y = 20 + r() * 110, a = r() * Math.PI;
      for (let i = 0; i < 4 + (r() * 4) | 0; i++) {
        parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="22" height="7" rx="3.5" transform="rotate(${(a * 57.3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i % 2 ? stain : light}"/>`);
        x += Math.cos(a) * 23; y += Math.sin(a) * 23; a += (r() - 0.5) * 0.4;
      }
    }
  } else if (kind === 'clusters') {
    for (let c = 0; c < 7; c++) {
      const cx = 25 + r() * 150, cy = 20 + r() * 110;
      for (let i = 0; i < 9; i++) parts.push(`<circle cx="${(cx + (r() - 0.5) * 22).toFixed(1)}" cy="${(cy + (r() - 0.5) * 22).toFixed(1)}" r="4.2" fill="${r() < 0.5 ? stain : light}"/>`);
    }
  } else {
    for (let c = 0; c < 5; c++) {
      let x = 15 + r() * 160, y = 15 + r() * 120, a = r() * 6.28;
      for (let i = 0; i < 9; i++) {
        parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${i % 2 ? stain : light}"/>`);
        x += Math.cos(a) * 8.2; y += Math.sin(a) * 8.2; a += (r() - 0.5) * 0.7;
      }
    }
  }
  return `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gram stain micrograph"><rect width="200" height="150" fill="#f4eefc"/>${parts.join('')}<circle cx="100" cy="75" r="140" fill="none" stroke="#17141c" stroke-opacity=".08" stroke-width="80"/></svg>`;
}

export function mount(host) {
  host.style.background = '#2c2c2c';
  const state = { on: true, all: 1, per: [1, 1, 1], card: 0, answer: false };
  const STEP = 1.15;

  const win = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;font-family:Arial,sans-serif;color:#eee' });
  win.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;padding:8px 14px;background:#1f1f1f;font-size:13px;border-bottom:1px solid #111">
      <b style="font-weight:600">Decks</b><span>Add</span><span>Browse</span><span>Stats</span>
      <span style="margin-left:auto;font:400 11px 'Martian Mono',monospace;color:#9a9a9a" class="ak-status"></span>
    </div>
    <div class="ak-card" style="overflow:auto;display:grid;place-items:center;padding:24px;text-align:center"></div>
    <div style="display:flex;gap:10px;justify-content:center;align-items:center;padding:12px;background:#1f1f1f;border-top:1px solid #111;flex-wrap:wrap" class="ak-bar"></div>`;
  host.appendChild(win);
  const cardEl = win.querySelector('.ak-card');
  const bar = win.querySelector('.ak-bar');
  const status = win.querySelector('.ak-status');

  const tip = el('div', { style: 'position:absolute;left:50%;bottom:70px;transform:translateX(-50%);background:#fffbe0;color:#111;border:1px solid #c9b960;padding:6px 12px;font:13px Arial,sans-serif;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap' });
  host.appendChild(tip);
  let tipT = 0;
  const tooltip = (text) => { tip.textContent = text; tip.style.opacity = 1; clearTimeout(tipT); tipT = setTimeout(() => { tip.style.opacity = 0; }, 1200); };

  const keyHelp = el('div', { class: 'dpanel', style: 'left:12px;top:46px;width:min(220px,40%);padding:10px 12px' });
  keyHelp.innerHTML = `<h4>BIGGER CARD IMAGES</h4>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:11px">
      <button class="dbtn" data-k="]" style="margin:0;padding:3px 7px">]</button><span>this card bigger</span>
      <button class="dbtn" data-k="[" style="margin:0;padding:3px 7px">[</button><span>this card smaller</span>
      <button class="dbtn" data-k="}" style="margin:0;padding:3px 7px">}</button><span>all cards bigger</span>
      <button class="dbtn" data-k="{" style="margin:0;padding:3px 7px">{</button><span>all cards smaller</span>
      <button class="dbtn" data-k="\\" style="margin:0;padding:3px 7px">\\</button><span>this card reset</span>
      <button class="dbtn" data-k="toggle" style="margin:0;padding:3px 7px">^+B</button><span>on / off</span>
    </div>`;
  host.appendChild(keyHelp);

  const pct = (v) => `${Math.round(v * 100)}%`;
  function render() {
    const c = CARDS[state.card];
    const scale = state.on ? state.all * state.per[state.card] : 1;
    cardEl.innerHTML = `
      <div style="max-width:620px">
        <p style="font-size:19px;line-height:1.4;margin:0 0 18px">${c.q}</p>
        <div style="width:${Math.round(150 * scale)}px;max-width:100%;margin:0 auto;transition:width .25s cubic-bezier(.16,1,.3,1);box-shadow:0 2px 0 #111">${micrograph(c.draw, state.card * 977 + 3)}</div>
        ${state.answer ? `<hr style="border:0;border-top:1px solid #555;margin:20px 0"><p style="font-size:22px;margin:0"><b>${c.a}</b></p>` : ''}
      </div>`;
    bar.innerHTML = state.answer
      ? ['Again', 'Hard', 'Good', 'Easy'].map((b, i) => `<button data-next style="background:#3a3a3a;color:#eee;border:1px solid #555;border-radius:4px;padding:8px 16px;font:13px Arial;cursor:pointer">${b}<br><small style="color:${['#ef5350', '#bdbdbd', '#66bb6a', '#42a5f5'][i]}">${['1m', '6m', '10m', '4d'][i]}</small></button>`).join('')
      : '<button data-show style="background:#3a3a3a;color:#eee;border:1px solid #555;border-radius:4px;padding:10px 26px;font:13px Arial;cursor:pointer">Show Answer</button>';
    status.textContent = state.on ? `card ${state.card + 1}/3   all ${pct(state.all)}   this ${pct(state.per[state.card])}` : 'add-on off';
  }
  render();

  function act(key, ctrl, shift) {
    if (key.toLowerCase() === 'b' && ctrl && shift) { state.on = !state.on; tooltip(state.on ? 'Bigger Card Images: on' : 'Bigger Card Images: off'); render(); return true; }
    if (key === 'toggle') { state.on = !state.on; tooltip(state.on ? 'Bigger Card Images: on' : 'Bigger Card Images: off'); render(); return true; }
    const i = state.card;
    if (key === ']') state.per[i] = Math.min(4, state.per[i] * STEP);
    else if (key === '[') state.per[i] = Math.max(0.3, state.per[i] / STEP);
    else if (key === '}') state.all = Math.min(4, state.all * STEP);
    else if (key === '{') state.all = Math.max(0.3, state.all / STEP);
    else if (key === '\\') state.per[i] = 1;
    else return false;
    if (!state.on) { tooltip('Switched off. Ctrl+Shift+B to switch it back on.'); render(); return true; }
    tooltip(key === '}' || key === '{' ? `All cards: ${pct(state.all)}` : `This card: ${pct(state.per[i])}`);
    render();
    return true;
  }

  const kd = (e) => {
    if (act(e.key, e.ctrlKey || e.metaKey, e.shiftKey)) { e.preventDefault(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  };
  function advance() {
    if (!state.answer) state.answer = true;
    else { state.answer = false; state.card = (state.card + 1) % CARDS.length; tooltip(`Card ${state.card + 1}: remembered at ${pct(state.per[state.card])}`); }
    render();
  }
  host.addEventListener('keydown', kd);
  host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }));
  host.addEventListener('click', (e) => {
    if (e.target.closest('[data-show], [data-next]')) advance();
    const k = e.target.closest('[data-k]');
    if (k) act(k.dataset.k, false, false);
  });

  return () => { host.removeEventListener('keydown', kd); clearTimeout(tipT); };
}
