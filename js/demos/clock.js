// The Ad Factory's one big idea: record on a virtual clock.
//
// The scene below is a function of time and nothing else. A wall clock
// recorder screenshots it while it runs; when a screenshot is slow, the scene
// has moved on and those moments never make it into the video, which then
// plays back fast and jumpy. A virtual clock recorder freezes time, takes the
// screenshot however long it takes, then steps exactly one frame. Same scene,
// same slow screenshots, every frame lands.

import { stage, loop, el, INK, clamp } from './kit.js';

const FPS = 30, DUR = 2.4;

// the "ad": a shooting star crosses a sky while a name types itself out
function scene(g, x, y, w, h, t) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#0a0b1f'); sky.addColorStop(1, '#25205a');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  for (let i = 0; i < 40; i++) {
    const sx = x + ((i * 97.13) % 1) * w + ((i * 53) % w), sy = y + ((i * 31) % h);
    g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * ((i * 7) % 10) / 10})`;
    g.fillRect(x + ((i * 61) % w), sy, 1.5, 1.5);
  }
  const p = (t % DUR) / DUR;
  const sx = x + w * (-0.1 + p * 1.2), sy = y + h * (0.18 + p * 0.35);
  const tr = g.createLinearGradient(sx - 70, sy - 21, sx, sy);
  tr.addColorStop(0, 'rgba(255,196,20,0)'); tr.addColorStop(1, 'rgba(255,196,20,.9)');
  g.strokeStyle = tr; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 70, sy - 21); g.lineTo(sx, sy); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 3.5, 0, 6.283); g.fill();
  const name = 'AMELIA';
  const n = Math.min(name.length, Math.floor(p * 9));
  g.font = `700 ${Math.round(h * 0.17)}px "Jersey 10", sans-serif`;
  g.fillStyle = '#fbfaf6'; g.textAlign = 'center';
  g.fillText(name.slice(0, n) + (Math.floor(t * 3) % 2 ? '|' : ' '), x + w / 2, y + h * 0.78);
  g.textAlign = 'left';
  g.restore();
}

function record(kind, shotMs) {
  const frames = [];
  let t = 0, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (t < DUR) {
    frames.push(t);
    if (kind === 'virtual') { t += 1 / FPS; continue; }
    // the page keeps running while the screenshot is taken
    let cost = shotMs / 1000 * (0.6 + rnd() * 0.8);
    if (rnd() < 0.12) cost += 0.09 + rnd() * 0.12; // the odd slow one
    t += Math.max(1 / FPS, cost);
  }
  return frames;
}

export function mount(host) {
  host.style.background = '#17141c';
  const s = stage(host);
  let shotMs = 70;
  let wall = record('wall', shotMs), virt = record('virtual', shotMs);
  let play = 0;

  const ctl = el('div', { class: 'dpanel', style: 'left:14px;bottom:14px;right:14px;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:10px 14px' });
  ctl.innerHTML = `
    <label style="display:flex;gap:10px;align-items:center;font:400 11px "Atkinson Hyperlegible Mono",monospace">
      Screenshot takes <input type="range" min="10" max="160" value="${shotMs}" style="accent-color:#ff5b2e;width:150px"> <b class="ms" style="color:#ffc414;min-width:46px">${shotMs} ms</b>
    </label>
    <button class="dbtn" data-rec style="margin:0">Record again</button>
    <span class="cnt" style="font:400 11px "Atkinson Hyperlegible Mono",monospace;color:#b9b4c0"></span>`;
  host.appendChild(ctl);
  const range = ctl.querySelector('input');
  const cnt = ctl.querySelector('.cnt');
  const rerecord = () => {
    wall = record('wall', shotMs); virt = record('virtual', shotMs); play = 0;
    cnt.textContent = `wall clock kept ${wall.length} frames, virtual kept ${virt.length}. Pink gaps are moments the wall clock never saw.`;
  };
  range.addEventListener('input', () => { shotMs = +range.value; ctl.querySelector('.ms').textContent = `${shotMs} ms`; rerecord(); });
  ctl.querySelector('[data-rec]').addEventListener('click', rerecord);
  rerecord();

  const stop = loop(host, (dt, t) => {
    const { g, w, h } = s;
    g.fillStyle = '#17141c'; g.fillRect(0, 0, w, h);
    play += dt;
    const pad = 18, gap = 18;
    const bottom = ctl.offsetHeight + 28;
    const colW = (w - pad * 2 - gap) / 2;
    const scrH = Math.min(colW * 0.56, h - bottom - 120);
    const lanes = [['WALL CLOCK', wall, INK.pink], ['VIRTUAL CLOCK', virt, '#7fe3b0']];
    lanes.forEach(([label, frames, col], i) => {
      const x = pad + i * (colW + gap), y = 40;
      g.font = '400 11px "Jersey 10", sans-serif'; g.fillStyle = col;
      g.fillText(label, x, 26);
      // the encoded video plays its frames back at 30 a second, whatever they were
      const idx = Math.floor(play * FPS) % Math.max(1, Math.ceil(DUR * FPS));
      const fi = Math.min(frames.length - 1, idx);
      const shown = idx < frames.length ? frames[fi] : null;
      if (shown !== null) scene(g, x, y, colW, scrH, shown);
      else { g.fillStyle = '#000'; g.fillRect(x, y, colW, scrH); g.fillStyle = '#ff8fb8'; g.font = '400 11px "Jersey 10", sans-serif'; g.fillText('VIDEO ALREADY ENDED', x + 14, y + 24); }
      g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x, y, colW, scrH);
      g.fillStyle = 'rgba(251,250,246,.6)'; g.font = '400 10px "Atkinson Hyperlegible Mono", monospace';
      g.fillText(`${frames.length} frames, plays for ${(frames.length / FPS).toFixed(2)}s`, x, y + scrH + 18);

      // the timeline: when each frame was taken, in scene time
      const ty = y + scrH + 40, tw = colW;
      g.strokeStyle = 'rgba(251,250,246,.25)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, ty); g.lineTo(x + tw, ty); g.stroke();
      for (let k = 0; k < frames.length; k++) {
        const fx = x + (frames[k] / DUR) * tw;
        const gapBefore = k ? frames[k] - frames[k - 1] : 1 / FPS;
        g.fillStyle = gapBefore > 1.5 / FPS ? INK.pink : col;
        g.fillRect(fx - 1, ty - 8, 2, 16);
        if (k && gapBefore > 1.5 / FPS) {
          g.fillStyle = 'rgba(255,77,154,.18)';
          g.fillRect(x + (frames[k - 1] / DUR) * tw + 1, ty - 8, (gapBefore / DUR) * tw - 2, 16);
        }
      }
      // playhead
      if (shown !== null) {
        const px = x + (shown / DUR) * tw;
        g.fillStyle = INK.yolk; g.fillRect(px - 1, ty - 14, 3, 28);
      }
      g.fillStyle = 'rgba(251,250,246,.5)';
      g.fillText('scene time 0s', x, ty + 26);
      g.textAlign = 'right'; g.fillText(`${DUR}s`, x + tw, ty + 26); g.textAlign = 'left';
    });
  });

  return () => { stop(); s.destroy(); };
}
