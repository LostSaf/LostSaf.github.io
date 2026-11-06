// Tides of Qingdao's wok station, ported from client/Cooking/Wok.luau and
// server/Cooking.luau. Same numbers, same physics, same grading. Hold HEAT to
// keep the needle in the drifting green "wok hei" zone and hit TOSS while it
// flashes. Then the result is graded the way the server grades it.

import { el } from './kit.js';
import { sfx } from '../sfx.js';

const W = { Duration: 8, ZoneWidth: 0.26, ZoneCenter: 0.55, ZoneDrift: 0.1, HeatUp: 0.6, HeatDown: 0.45, TossTimes: [1.6, 3.4, 5.2, 6.8], TossWindow: 0.7, ZoneWeight: 0.7 };
const GRADE = { ThreeStar: 0.75, TwoStar: 0.45 };
const STAR_MULT = [0.8, 1, 1.3];
const DISHES = [
  ['Wok-fried Greenling with Ginger', 30], ['Stir-fried Crab with Ginger and Scallion', 45], ['Crispy Fried Anchovies', 16],
  ['Spicy Cumin Mackerel', 45], ['Stir-fried Octopus with Scallion', 50], ['Chili Black Rockfish', 65],
];

// Roblox's math.noise is Perlin noise; this is the classic 2D version.
const P = (() => { const p = [...Array(256).keys()]; let s = 7; for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } return [...p, ...p]; })();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
function noise(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = P[X] + Y, b = P[X + 1] + Y;
  const l1 = grad(P[a], x, y) + u * (grad(P[b], x - 1, y) - grad(P[a], x, y));
  const l2 = grad(P[a + 1], x, y - 1) + u * (grad(P[b + 1], x - 1, y - 1) - grad(P[a + 1], x, y - 1));
  return l1 + v * (l2 - l1);
}

// server/Cooking.luau: Cooking.Score.Wok and Cooking.Stars
function serverScore(result, elapsed) {
  if (elapsed < W.Duration - 0.5 || typeof result.zone !== 'number' || typeof result.tosses !== 'number') return null;
  const zone = Math.min(1, Math.max(0, result.zone));
  const tosses = Math.min(W.TossTimes.length, Math.max(0, Math.floor(result.tosses)));
  return zone * W.ZoneWeight + (tosses / W.TossTimes.length) * (1 - W.ZoneWeight);
}
const stars = (s) => (s >= GRADE.ThreeStar ? 3 : s >= GRADE.TwoStar ? 2 : 1);
const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function mount(host) {
  host.style.background = '#2b1a14 url(media/tides/kitchen.jpg) center / cover';
  const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;place-items:center;padding:18px;background:rgba(20,10,8,.55);backdrop-filter:blur(3px)' });
  host.appendChild(wrap);
  const card = el('div', { style: 'width:min(560px,100%);background:#fff7e6;border:4px solid #2a1a12;border-radius:16px;box-shadow:0 8px 0 #2a1a12;padding:18px 20px 16px;color:#2a1a12;font-family:var(--f-text)' });
  wrap.appendChild(card);
  let dishIdx = 3;
  let state = 'idle', t0 = 0, raf = 0;
  let heat = 0.2, inZone = 0, hits = 0, toss = [], holdKey = false, holdBtn = false, tossPressed = false, lastResult = null;

  const ui = () => {
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font:400 15px/1 var(--f-sign);background:#c8202f;color:#fff;padding:5px 8px 3px;border-radius:6px">WOK</span>
        <b style="font:400 26px/1 var(--f-sign)" data-dish>${DISHES[dishIdx][0]}</b>
        <span style="margin-left:auto;font:400 18px/1 var(--f-sign);color:#8a5a2b">${DISHES[dishIdx][1]} coins</span>
      </div>
      <div style="position:relative;margin-top:16px;height:36px;border:3px solid #2a1a12;border-radius:10px;overflow:hidden;background:linear-gradient(90deg,#bedef0,#f5e2be 50%,#f5aa8c)" data-track>
        <i data-zone style="position:absolute;top:0;bottom:0;background:#4fc76a;border-left:3px solid #2a7a3a;border-right:3px solid #2a7a3a"></i>
        <i data-needle style="position:absolute;top:-2px;bottom:-2px;width:8px;margin-left:-4px;background:#fff;border:2px solid #2a1a12;border-radius:3px"></i>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font:400 15px/1 var(--f-sign)"><span style="color:#2b6f8f">COLD</span><span data-hei style="color:#2a7a3a;font-size:19px">WOK HEI 0%</span><span style="color:#b33">SCORCHING</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px;font:400 17px/1 var(--f-sign)">TOSSES <span data-pips style="display:flex;gap:6px">${W.TossTimes.map(() => '<i style="width:20px;height:20px;border-radius:50%;border:3px solid #2a1a12;background:#fff"></i>').join('')}</span>
        <b data-cue style="margin-left:auto;font:400 30px/1 var(--f-sign);color:#e8a400;visibility:hidden;-webkit-text-stroke:1px #2a1a12">TOSS!</b></div>
      <div style="margin-top:10px;height:10px;border:2px solid #2a1a12;border-radius:6px;overflow:hidden;background:#eee"><i data-timer style="display:block;height:100%;width:100%;background:#2a1a12"></i></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
        <button data-heat style="height:54px;border:3px solid #2a1a12;border-radius:12px;background:#ff7a4d;font:400 24px/1 var(--f-sign);box-shadow:0 4px 0 #2a1a12;cursor:pointer;touch-action:none">HEAT <small style="font-size:14px;opacity:.7">SPACE</small></button>
        <button data-toss style="height:54px;border:3px solid #2a1a12;border-radius:12px;background:#ffcf3f;font:400 24px/1 var(--f-sign);box-shadow:0 4px 0 #2a1a12;cursor:pointer">TOSS <small style="font-size:14px;opacity:.7">E</small></button>
      </div>
      <div data-out style="margin-top:14px;min-height:70px;font:400 13.5px/1.5 var(--f-mono)"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        <button class="key" data-start>Start cooking</button>
        <button class="key" data-next>Another dish</button>
        <button class="key" data-forge disabled>Send a forged result</button>
      </div>`;
  };
  ui();
  const q = (s) => card.querySelector(s);
  const out = (html) => { q('[data-out]').innerHTML = html; };
  out('Hold <b>HEAT</b> to keep the needle in the green and press <b>TOSS</b> while it flashes. Eight seconds.');

  const start = () => {
    if (state === 'cooking') return;
    state = 'cooking'; heat = 0.2; inZone = 0; hits = 0; toss = []; t0 = performance.now();
    q('[data-forge]').disabled = true;
    out('');
    q('[data-pips]').querySelectorAll('i').forEach((p) => { p.style.background = '#fff'; });
    host.focus({ preventScroll: true });
    let last = t0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      const holding = holdKey || holdBtn;
      heat += (holding ? W.HeatUp : -W.HeatDown) * dt + noise(t * 1.7, 3.1) * 0.35 * dt;
      heat = Math.min(1, Math.max(0, heat));
      const center = W.ZoneCenter + Math.sin(t * 0.9) * W.ZoneDrift;
      const lo = center - W.ZoneWidth / 2;
      const inside = heat >= lo && heat <= lo + W.ZoneWidth;
      if (inside) inZone += dt;
      const zone = q('[data-zone]');
      zone.style.left = `${lo * 100}%`; zone.style.width = `${W.ZoneWidth * 100}%`;
      const needle = q('[data-needle]');
      needle.style.left = `${heat * 100}%`;
      needle.style.background = inside ? '#fff' : '#ff4d4d';
      let cue = null;
      W.TossTimes.forEach((at, i) => {
        if (toss[i] === undefined) {
          if (t >= at && t <= at + W.TossWindow) cue = i;
          else if (t > at + W.TossWindow) { toss[i] = false; q('[data-pips]').children[i].style.background = '#bbb'; }
        }
      });
      if (tossPressed) {
        tossPressed = false;
        if (cue !== null) { toss[cue] = true; hits++; q('[data-pips]').children[cue].style.background = '#ffcf3f'; sfx.build(); cue = null; }
      }
      q('[data-cue]').style.visibility = cue !== null ? 'visible' : 'hidden';
      q('[data-timer]').style.width = `${Math.max(0, 1 - t / W.Duration) * 100}%`;
      q('[data-hei]').textContent = `WOK HEI ${Math.floor((inZone / Math.max(t, 1e-3)) * 100)}%`;
      if (t >= W.Duration) { finish(t); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };

  const grade = (result, elapsed, label) => {
    const score = serverScore(result, elapsed);
    const lines = [`<span style="color:#8a5a2b">client sends</span> <code>{ zone: ${result.zone.toFixed(3)}, tosses: ${result.tosses} }</code> after ${elapsed.toFixed(1)}s`];
    if (score === null) {
      lines.push('<b style="color:#c8202f">server: not believable.</b> A wok takes 8 seconds; this one claims to be done early. Nothing is served.');
      sfx.land();
    } else {
      const n = stars(score);
      const price = DISHES[dishIdx][1];
      lines.push(`server score <b>${score.toFixed(3)}</b> = 0.7 x zone + 0.3 x tosses`);
      lines.push(`<b style="font:400 26px/1 var(--f-sign);color:#e8a400">${starText(n)}</b> &nbsp;served for <b>${Math.round(price * STAR_MULT[n - 1])} coins</b> (${price} x ${STAR_MULT[n - 1]})`);
      if (n === 3) sfx.ding(); else sfx.blip();
    }
    out((label ? `<b>${label}</b><br>` : '') + lines.join('<br>'));
  };

  const finish = (t) => {
    cancelAnimationFrame(raf);
    state = 'done';
    q('[data-cue]').style.visibility = 'hidden';
    lastResult = { zone: inZone / W.Duration, tosses: hits };
    grade(lastResult, t);
    q('[data-forge]').disabled = false;
  };

  const kd = (e) => {
    if (e.code === 'Space') { e.preventDefault(); if (state !== 'cooking') start(); holdKey = true; }
    if (e.key === 'e' || e.key === 'E') { tossPressed = true; }
  };
  const ku = (e) => { if (e.code === 'Space') holdKey = false; };
  host.addEventListener('keydown', kd);
  host.addEventListener('keyup', ku);
  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('[data-heat]')) { e.preventDefault(); if (state !== 'cooking') start(); holdBtn = true; e.target.closest('[data-heat]').setPointerCapture(e.pointerId); }
    if (e.target.closest('[data-toss]')) tossPressed = true;
  });
  card.addEventListener('pointerup', () => { holdBtn = false; });
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-start]')) start();
    if (e.target.closest('[data-next]') && state !== 'cooking') { dishIdx = (dishIdx + 1) % DISHES.length; q('[data-dish]').textContent = DISHES[dishIdx][0]; card.querySelector('span[style*="margin-left:auto"]').textContent = `${DISHES[dishIdx][1]} coins`; sfx.blip(); }
    if (e.target.closest('[data-forge]') && lastResult) grade({ zone: 1, tosses: 4 }, 1.2, 'A forged result, a perfect cook claimed after 1.2 seconds:');
  });

  return () => { cancelAnimationFrame(raf); host.removeEventListener('keydown', kd); host.removeEventListener('keyup', ku); };
}
