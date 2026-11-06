// Written in Real Stars: the real sky, and a server that cannot be talked down.
//
// 2,035 Hipparcos stars (magnitude under 5.2) from the site's own catalogue,
// placed on the celestial sphere from right ascension and declination, coloured
// from their B minus V index and drawn with a stereographic projection you can
// drag around. The panel sends orders to a pretend order server that prices
// everything from its own catalogue, the way the real one does.

import { stage, loop, el, clamp } from './kit.js';

// B minus V colour index to a star colour, from blue hot to red cool
const BV = [[-0.4, [155, 176, 255]], [0, [202, 215, 255]], [0.4, [248, 247, 255]], [0.8, [255, 244, 234]], [1.2, [255, 210, 161]], [1.6, [255, 204, 111]], [2.2, [255, 160, 90]]];
function bvColour(bv) {
  if (!(bv > -1)) bv = 0.6;
  for (let i = 1; i < BV.length; i++) {
    if (bv <= BV[i][0]) {
      const [a, ca] = BV[i - 1], [b, cb] = BV[i];
      const t = clamp((bv - a) / (b - a), 0, 1);
      return ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
    }
  }
  return BV[BV.length - 1][1];
}
const rad = Math.PI / 180;
const vec = (ra, dec) => [Math.cos(dec * rad) * Math.cos(ra * rad), Math.sin(dec * rad), Math.cos(dec * rad) * Math.sin(ra * rad)];

export function mount(host) {
  host.style.background = '#05060f';
  const s = stage(host);
  let stars = [], named = [];
  let yaw = 1.2, pitch = 0.35, vyaw = 0.02, vpitch = 0, zoom = 1;
  let drag = null, hover = null;

  fetch('assets/stars.json').then((r) => r.json()).then((d) => {
    stars = d.bg.map(([ra, dec, mag, bv]) => ({ v: vec(ra, dec), mag, col: bvColour(bv), tw: Math.random() * 6.28 }));
    named = d.named.map(([n, ra, dec, mag]) => ({ n, v: vec(ra, dec), mag }));
  });

  // ------------------------------------------------------------ drag
  const pd = (e) => { drag = { x: e.clientX, y: e.clientY }; host.setPointerCapture(e.pointerId); };
  const pm = (e) => {
    const r = host.getBoundingClientRect();
    hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    vyaw = -dx * 0.004 / zoom; vpitch = dy * 0.004 / zoom;
    yaw += vyaw; pitch = clamp(pitch + vpitch, -1.4, 1.4);
  };
  const pu = () => { drag = null; };
  const wh = (e) => { e.preventDefault(); zoom = clamp(zoom * Math.exp(-e.deltaY * 0.001), 0.6, 3.5); };
  host.addEventListener('pointerdown', pd);
  host.addEventListener('pointermove', pm);
  host.addEventListener('pointerup', pu);
  host.addEventListener('pointerleave', () => { hover = null; });
  host.addEventListener('wheel', wh, { passive: false });

  // ------------------------------------------------------------ draw
  const project = (v, cy, sy, cp, sp, f, cx0, cy0) => {
    // yaw about the pole, then pitch
    const x1 = v[0] * cy - v[2] * sy, z1 = v[0] * sy + v[2] * cy, y1 = v[1];
    const y2 = y1 * cp - z1 * sp, z2 = y1 * sp + z1 * cp;
    if (z2 < -0.35) return null;
    const k = f / (1 + z2);
    return [cx0 + x1 * k, cy0 - y2 * k, z2];
  };

  const stop = loop(host, (dt, t) => {
    const { g, w, h } = s;
    if (!drag) { yaw += vyaw; pitch = clamp(pitch + vpitch, -1.4, 1.4); vyaw += (0.0012 - vyaw) * 0.02; vpitch *= 0.94; }
    const grd = g.createRadialGradient(w * 0.5, h * 1.1, 10, w * 0.5, h * 0.6, Math.max(w, h));
    grd.addColorStop(0, '#1a1840'); grd.addColorStop(0.5, '#0a0b1f'); grd.addColorStop(1, '#04050c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);

    const f = Math.min(w, h) * 0.62 * zoom;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cx0 = w * 0.42, cy0 = h * 0.5;

    // a faint grid of right ascension and declination
    g.strokeStyle = 'rgba(120,130,255,.09)'; g.lineWidth = 1;
    for (let dec = -60; dec <= 60; dec += 30) {
      g.beginPath(); let started = false;
      for (let ra = 0; ra <= 360; ra += 4) {
        const p = project(vec(ra, dec), cyw, syw, cp, sp, f, cx0, cy0);
        if (!p) { started = false; continue; }
        if (!started) { g.moveTo(p[0], p[1]); started = true; } else g.lineTo(p[0], p[1]);
      }
      g.stroke();
    }
    for (let ra = 0; ra < 360; ra += 30) {
      g.beginPath(); let started = false;
      for (let dec = -80; dec <= 80; dec += 4) {
        const p = project(vec(ra, dec), cyw, syw, cp, sp, f, cx0, cy0);
        if (!p) { started = false; continue; }
        if (!started) { g.moveTo(p[0], p[1]); started = true; } else g.lineTo(p[0], p[1]);
      }
      g.stroke();
    }

    g.globalCompositeOperation = 'lighter';
    for (const st of stars) {
      const p = project(st.v, cyw, syw, cp, sp, f, cx0, cy0);
      if (!p || p[0] < -10 || p[1] < -10 || p[0] > w + 10 || p[1] > h + 10) continue;
      const r = Math.max(0.55, (5.4 - st.mag) * 0.62) * (0.75 + zoom * 0.25);
      const tw = 0.75 + 0.25 * Math.sin(t * 2.2 + st.tw);
      const [cr, cg, cb] = st.col;
      if (r > 1.6) {
        const halo = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4);
        halo.addColorStop(0, `rgba(${cr},${cg},${cb},${0.35 * tw})`);
        halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        g.fillStyle = halo;
        g.fillRect(p[0] - r * 4, p[1] - r * 4, r * 8, r * 8);
      }
      g.fillStyle = `rgba(${cr},${cg},${cb},${tw})`;
      g.beginPath(); g.arc(p[0], p[1], r * 0.6, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    // the nearest named star under the cursor
    let best = null, bd = 22;
    if (hover && !drag) {
      for (const st of named) {
        const p = project(st.v, cyw, syw, cp, sp, f, cx0, cy0);
        if (!p) continue;
        const d = Math.hypot(p[0] - hover.x, p[1] - hover.y);
        if (d < bd) { bd = d; best = { st, p }; }
      }
    }
    if (best) {
      const { st, p } = best;
      g.strokeStyle = '#ffc414'; g.lineWidth = 1.5;
      g.strokeRect(p[0] - 9, p[1] - 9, 18, 18);
      g.font = '500 12px "Atkinson Hyperlegible Mono", monospace';
      const label = `${st.n}  mag ${st.mag.toFixed(2)}`;
      const tw2 = g.measureText(label).width;
      g.fillStyle = 'rgba(5,6,15,.85)'; g.fillRect(p[0] + 14, p[1] - 22, tw2 + 14, 22);
      g.fillStyle = '#ffc414'; g.fillText(label, p[0] + 21, p[1] - 7);
    }
    g.font = '400 10px "Jersey 10", sans-serif';
    g.fillStyle = 'rgba(255,255,255,.4)';
    g.fillText(`${stars.length} REAL STARS  /  DRAG, SCROLL TO ZOOM, HOVER A BRIGHT ONE`, 16, h - 16);
  });

  // ------------------------------------------------------------ the order server
  const panel = el('div', { class: 'dpanel', style: 'right:14px;top:14px;width:min(330px,calc(100% - 28px));max-height:calc(100% - 28px);overflow:auto' });
  panel.innerHTML = `
    <h4>TRY TO FORGE AN ORDER</h4>
    <p>The page sends what you chose. The server decides what it costs.</p>
    <div>
      <button class="dbtn" data-o="honest">Order an A3 print</button>
      <button class="dbtn is-bad" data-o="forge">Forge: an A2 for $1</button>
      <button class="dbtn is-bad" data-o="pdf">Grab the print file before paying</button>
    </div>
    <ul class="dlog" aria-live="polite"></ul>`;
  host.appendChild(panel);
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  const log = panel.querySelector('.dlog');
  const say = (cls, html, delay) => new Promise((res) => setTimeout(() => {
    const li = el('li', { class: cls }, html);
    log.prepend(li);
    while (log.children.length > 9) log.lastChild.remove();
    res();
  }, delay));
  let busy = false;
  panel.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-o]');
    if (!b || busy) return;
    busy = true;
    panel.querySelectorAll('.dbtn').forEach((x) => { x.disabled = true; });
    const o = b.dataset.o;
    if (o === 'honest') {
      await say('dim', 'POST /api/order <code>{"size":"A3","stars":[...]}</code>', 0);
      await say('', 'server prices it from its own list: <code>catalogue.A3</code>', 450);
      await say('ok', 'Stripe Checkout opened for the server\'s price', 450);
      await say('dim', 'after payment, webhook fires, print lab gets a signed link', 500);
    } else if (o === 'forge') {
      await say('dim', 'POST /api/order <code>{"size":"A2","price":1}</code>', 0);
      await say('', 'server ignores <code>price</code>. It never reads one from the page.', 500);
      await say('ok', 'charged <code>catalogue.A2</code>, the full price, whatever the page said', 450);
    } else {
      await say('dim', 'GET /plates/1f3c.pdf', 0);
      await say('no', '404. No print file exists until the order is paid.', 450);
      await say('dim', 'POST /api/preview gives a watermarked JPEG at about 77 dpi instead', 450);
    }
    busy = false;
    panel.querySelectorAll('.dbtn').forEach((x) => { x.disabled = false; });
  });

  return () => { stop(); s.destroy(); };
}
