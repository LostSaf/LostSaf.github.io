// Tides of Qingdao, the short version: a dive off Captain Gao's boat.
//
// Each fish is a chain of segments. The head steers (wander, flee the diver)
// with a small sideways wobble, and every segment after it follows the one in
// front at a fixed distance, so the wobble travels down the body as a wave and
// the spine bends on its own. The tail beats faster when the fish is in a hurry.
// The same idea runs the jointed fish in the real game.

import { stage, loop, keys, el, INK, clamp, lerp } from './kit.js';

const SPECIES = [
  { name: 'Spanish mackerel', dish: 'Mackerel dumplings', col: INK.blue, belly: '#9fb0ff', len: 64, segs: 9, width: 9, speed: 95 },
  { name: 'Yellow croaker', dish: 'Braised yellow croaker', col: INK.yolk, belly: '#fff0b8', len: 48, segs: 8, width: 10, speed: 70 },
  { name: 'Prawn', dish: 'Oil braised prawns', col: INK.tomato, belly: '#ffc2ad', len: 24, segs: 6, width: 4.5, speed: 55 },
  { name: 'Squid', dish: 'Grilled squid', col: INK.pink, belly: '#ffd0e4', len: 40, segs: 7, width: 8, speed: 80, squid: true },
];
const CLAM = { name: 'Clam', dish: 'Spicy fried clams' };

export function mount(host) {
  host.style.background = '#0b3d4a';
  const s = stage(host);
  const k = keys(host, ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd']);
  let W = s.w, H = s.h, surface = 0, floorY = 0;
  const layout = () => { W = s.w; H = s.h; surface = Math.round(H * 0.16); floorY = H - 46; };
  s.onResize = layout; layout();

  const diver = { x: W * 0.3, y: surface + 90, vx: 0, vy: 0, ang: 0, kick: 0, o2: 1, out: 0 };
  const fish = [];
  const clams = [];
  const bubbles = [];
  const catches = [];
  let pointer = null, pointerActive = 0, flash = null;

  const seabed = (x) => floorY + Math.sin(x * 0.012) * 8 + Math.sin(x * 0.031 + 1) * 5;

  function spawnFish(edge) {
    const sp = SPECIES[(Math.random() * SPECIES.length) | 0];
    const scale = 0.8 + Math.random() * 0.45;
    const x = edge ? (Math.random() < 0.5 ? -60 : W + 60) : 60 + Math.random() * (W - 120);
    const y = surface + 50 + Math.random() * (floorY - surface - 90);
    const len = sp.len * scale, n = sp.segs;
    const pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: x - i * (len / n), y });
    fish.push({ sp, scale, len, n, pts, vx: (x < 0 ? 1 : -1) * sp.speed * 0.5, vy: 0, phase: Math.random() * 6, tx: Math.random() * W, ty: y, retarget: 0, flee: 0 });
  }
  for (let i = 0; i < 10; i++) spawnFish(false);
  for (let i = 0; i < 6; i++) clams.push({ x: 40 + Math.random() * (W - 80), open: Math.random() * 6 });

  // ------------------------------------------------------------ input
  const pm = (e) => {
    const r = host.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    pointerActive = 1.5;
  };
  const grab = () => {
    const hand = { x: diver.x + Math.cos(diver.ang) * 26, y: diver.y + Math.sin(diver.ang) * 26 };
    let best = null, bd = 48;
    for (const f of fish) {
      const d = Math.hypot(f.pts[0].x - hand.x, f.pts[0].y - hand.y);
      if (d < bd) { bd = d; best = f; }
    }
    if (best) {
      fish.splice(fish.indexOf(best), 1);
      catches.push(best.sp);
      flash = { x: best.pts[0].x, y: best.pts[0].y, t: 0, text: best.sp.name };
      setTimeout(() => spawnFish(true), 1500);
      updateMenu();
      return;
    }
    for (const c of clams) {
      if (Math.hypot(c.x - hand.x, seabed(c.x) - 6 - hand.y) < 40 && !c.taken) {
        c.taken = true;
        catches.push(CLAM);
        flash = { x: c.x, y: seabed(c.x) - 10, t: 0, text: 'Clam' };
        setTimeout(() => { c.taken = false; c.x = 40 + Math.random() * (W - 80); }, 4000);
        updateMenu();
        return;
      }
    }
    flash = { x: hand.x, y: hand.y, t: 0, text: 'missed', miss: true };
  };
  host.addEventListener('pointermove', pm);
  host.addEventListener('pointerdown', (e) => { pm(e); grab(); });
  const kd = (e) => { if (e.key === ' ' || e.key.toLowerCase() === 'e') grab(); };
  host.addEventListener('keydown', kd);

  // ------------------------------------------------------------ the menu
  const panel = el('div', { class: 'dpanel', style: 'right:14px;top:14px;width:min(250px,44%);pointer-events:none' });
  host.appendChild(panel);
  function updateMenu() {
    const counts = new Map();
    for (const c of catches) counts.set(c.dish, (counts.get(c.dish) || 0) + 1);
    panel.innerHTML = `<h4>TONIGHT'S MENU</h4>` + (counts.size
      ? `<ul class="dlog">${[...counts].map(([d, n]) => `<li class="ok">${d} <span class="dim">x${n}</span></li>`).join('')}</ul>`
      : '<p>Nothing caught yet. Click near a fish, or a clam on the seabed.</p>');
  }
  updateMenu();

  // ------------------------------------------------------------ simulation
  function stepDiver(dt) {
    let ax = 0, ay = 0;
    const kx = (k.down.has('d') || k.down.has('arrowright') ? 1 : 0) - (k.down.has('a') || k.down.has('arrowleft') ? 1 : 0);
    const ky = (k.down.has('s') || k.down.has('arrowdown') ? 1 : 0) - (k.down.has('w') || k.down.has('arrowup') ? 1 : 0);
    if (diver.out > 0) {
      diver.out -= dt; ay = -900;
    } else if (kx || ky) {
      ax = kx * 520; ay = ky * 520;
    } else if (pointer && pointerActive > 0) {
      const dx = pointer.x - diver.x, dy = pointer.y - diver.y, d = Math.hypot(dx, dy);
      if (d > 14) { ax = (dx / d) * Math.min(520, d * 6); ay = (dy / d) * Math.min(520, d * 6); }
    }
    pointerActive -= dt * 0.15;
    diver.vx += ax * dt; diver.vy += ay * dt;
    if (diver.y < surface) diver.vy += 700 * dt; // air: fall back in
    diver.vx *= Math.pow(0.12, dt); diver.vy *= Math.pow(0.12, dt);
    diver.x = clamp(diver.x + diver.vx * dt, 20, W - 20);
    diver.y = clamp(diver.y + diver.vy * dt, surface - 30, seabed(diver.x) - 16);
    const sp = Math.hypot(diver.vx, diver.vy);
    if (sp > 20) {
      let a = Math.atan2(diver.vy, diver.vx);
      let d = a - diver.ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      diver.ang += d * Math.min(1, dt * 6);
    }
    diver.kick += dt * (2 + sp * 0.05);
    const under = diver.y > surface + 6;
    diver.o2 = clamp(diver.o2 + (under ? -dt / 26 : dt / 1.6), 0, 1);
    if (diver.o2 <= 0 && diver.out <= 0) { diver.out = 1.6; flash = { x: diver.x, y: diver.y - 30, t: 0, text: 'out of air!', miss: true }; }
    if (under && Math.random() < dt * 2.2) bubbles.push({ x: diver.x + Math.cos(diver.ang) * 10, y: diver.y - 8, r: 2 + Math.random() * 3, t: 0 });
  }

  function stepFish(f, dt, t) {
    const head = f.pts[0];
    f.retarget -= dt;
    if (f.retarget <= 0 || Math.hypot(f.tx - head.x, f.ty - head.y) < 30) {
      f.tx = 30 + Math.random() * (W - 60);
      f.ty = surface + 40 + Math.random() * (floorY - surface - 80);
      f.retarget = 3 + Math.random() * 5;
    }
    let dx = f.tx - head.x, dy = f.ty - head.y, d = Math.hypot(dx, dy) || 1;
    let speed = f.sp.speed;
    const ddx = head.x - diver.x, ddy = head.y - diver.y, dd = Math.hypot(ddx, ddy) || 1;
    if (dd < 120) { dx = ddx; dy = ddy; d = dd; speed *= 2.1; f.flee = 1; } else f.flee *= 0.97;
    f.vx += ((dx / d) * speed - f.vx) * dt * 1.6;
    f.vy += ((dy / d) * speed - f.vy) * dt * 1.6;
    const v = Math.hypot(f.vx, f.vy);
    f.phase += dt * (5 + v * 0.07);
    const wob = Math.sin(f.phase) * 0.45;
    const c = Math.cos(wob), sn = Math.sin(wob);
    head.x += (f.vx * c - f.vy * sn) * dt;
    head.y += (f.vx * sn + f.vy * c) * dt;
    head.y = clamp(head.y, surface + 14, seabed(head.x) - 10);
    const segLen = f.len / f.n;
    for (let i = 1; i < f.n; i++) {
      const a = f.pts[i - 1], b = f.pts[i];
      const ex = b.x - a.x, ey = b.y - a.y, el2 = Math.hypot(ex, ey) || 1;
      b.x = a.x + (ex / el2) * segLen;
      b.y = a.y + (ey / el2) * segLen;
    }
    if (head.x < -120 || head.x > W + 120) { head.x = clamp(head.x, -100, W + 100); f.tx = W / 2; }
  }

  // ------------------------------------------------------------ drawing
  function drawFish(g, f, t) {
    const P = f.pts, n = f.n;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let tx = a.x - b.x, ty = a.y - b.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const w = f.sp.width * f.scale * Math.pow(Math.sin(Math.PI * (i + 0.7) / (n + 0.4)), 0.75);
      left.push([P[i].x - ty * w, P[i].y + tx * w]);
      right.push([P[i].x + ty * w, P[i].y - tx * w]);
    }
    const tail = P[n - 1], pre = P[n - 2];
    let tx = tail.x - pre.x, ty = tail.y - pre.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const beat = Math.sin(f.phase * 1.3) * 0.5;
    const fl = f.sp.width * f.scale * 1.5;
    g.fillStyle = f.sp.col;
    if (f.sp.squid) {
      // trailing arms
      g.strokeStyle = f.sp.col; g.lineWidth = 1.6;
      for (let a = -2; a <= 2; a++) {
        g.beginPath(); g.moveTo(tail.x, tail.y);
        g.quadraticCurveTo(tail.x + tx * 10 - ty * a * 3, tail.y + ty * 10 + tx * a * 3, tail.x + tx * 18 - ty * (a * 4 + Math.sin(f.phase + a) * 4), tail.y + ty * 18 + tx * (a * 4 + Math.sin(f.phase + a) * 4));
        g.stroke();
      }
    } else {
      g.beginPath();
      g.moveTo(tail.x, tail.y);
      const ca = Math.cos(beat), sa = Math.sin(beat);
      const rx = tx * ca - ty * sa, ry = tx * sa + ty * ca;
      g.lineTo(tail.x + rx * fl - ry * fl * 0.7, tail.y + ry * fl + rx * fl * 0.7);
      g.lineTo(tail.x + rx * fl * 0.6, tail.y + ry * fl * 0.6);
      g.lineTo(tail.x + rx * fl + ry * fl * 0.7, tail.y + ry * fl - rx * fl * 0.7);
      g.closePath(); g.fill();
    }
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) g.lineTo(left[i][0], left[i][1]);
    for (let i = n - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath(); g.fill();
    // belly
    g.fillStyle = f.sp.belly; g.globalAlpha = 0.55;
    g.beginPath();
    g.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < n - 1; i++) g.lineTo((P[i].x + right[i][0]) / 2, (P[i].y + right[i][1]) / 2);
    g.lineTo(P[n - 1].x, P[n - 1].y);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    // eye
    const hx = P[0].x, hy = P[0].y;
    let dx = P[0].x - P[1].x, dy = P[0].y - P[1].y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const ex = hx - dx * f.sp.width * 0.4 * f.scale - dy * 2.5, ey = hy - dy * f.sp.width * 0.4 * f.scale + dx * 2.5;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 2.6 * f.scale, 0, 6.283); g.fill();
    g.fillStyle = INK.ink; g.beginPath(); g.arc(ex + dx * 0.8, ey + dy * 0.8, 1.4 * f.scale, 0, 6.283); g.fill();
  }

  function drawDiver(g, t) {
    g.save();
    g.translate(diver.x, diver.y);
    const flip = Math.cos(diver.ang) < 0 ? -1 : 1;
    g.rotate(diver.ang);
    g.scale(1, flip);
    const kick = Math.sin(diver.kick * 6) * 0.5;
    // flippers
    g.fillStyle = INK.yolk;
    for (const s2 of [-1, 1]) {
      g.save(); g.translate(-22, s2 * 4); g.rotate(kick * s2 + Math.PI);
      g.beginPath(); g.moveTo(0, -3); g.lineTo(16, -6); g.lineTo(16, 6); g.lineTo(0, 3); g.closePath(); g.fill();
      g.restore();
    }
    // body
    g.fillStyle = INK.ink;
    g.beginPath(); g.ellipse(-4, 0, 20, 8, 0, 0, 6.283); g.fill();
    g.fillStyle = INK.tomato; g.fillRect(-12, -8, 4, 16);
    // tank
    g.fillStyle = '#d8d3c7'; g.beginPath(); g.ellipse(-6, -9, 11, 3.6, 0, 0, 6.283); g.fill();
    // arm reaching
    g.strokeStyle = INK.ink; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(6, 3); g.lineTo(22 + Math.sin(t * 3) * 1.5, 6); g.stroke();
    // head, mask, snorkel
    g.fillStyle = '#b97a52'; g.beginPath(); g.arc(18, -1, 7, 0, 6.283); g.fill();
    g.fillStyle = '#221b1e'; g.beginPath(); g.arc(16, -4, 6.5, Math.PI, 2 * Math.PI); g.fill();
    g.fillStyle = INK.pink; g.fillRect(19, -4, 6, 5);
    g.fillStyle = '#bff3ff'; g.fillRect(20, -3, 4, 3);
    g.strokeStyle = INK.yolk; g.lineWidth = 2;
    g.beginPath(); g.moveTo(14, -6); g.lineTo(12, -15); g.stroke();
    g.restore();
  }

  const stop = loop(host, (dt, t) => {
    const g = s.g;
    stepDiver(dt);
    for (const f of fish) stepFish(f, dt, t);

    // sky and the boat
    g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, surface + 4);
    g.fillStyle = 'rgba(255,196,20,.55)'; g.beginPath(); g.arc(W * 0.82, surface * 0.45, 16, 0, 6.283); g.fill();
    const bx = W * 0.58, by = surface + Math.sin(t * 1.4) * 1.5;
    g.fillStyle = INK.tomato; g.beginPath(); g.moveTo(bx - 54, by - 10); g.lineTo(bx + 60, by - 10); g.lineTo(bx + 44, by + 6); g.lineTo(bx - 44, by + 6); g.closePath(); g.fill();
    g.fillStyle = INK.paper; g.fillRect(bx - 20, by - 26, 30, 16);
    g.strokeStyle = INK.ink; g.lineWidth = 1.5; g.strokeRect(bx - 20, by - 26, 30, 16);
    g.fillStyle = INK.ink; g.font = '400 9px "Silkscreen", monospace'; g.fillText("HAI'OU", bx - 40, by + 1);

    // water
    const wg = g.createLinearGradient(0, surface, 0, H);
    wg.addColorStop(0, '#2aa6a0'); wg.addColorStop(0.45, '#127a7f'); wg.addColorStop(1, '#0a3442');
    g.fillStyle = wg;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) g.lineTo(x, surface + Math.sin(x * 0.03 + t * 2) * 2.5 + Math.sin(x * 0.011 - t) * 2);
    g.lineTo(W, H); g.closePath(); g.fill();

    // light from above
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x0 = ((i * 0.19 + t * 0.012) % 1.2 - 0.1) * W;
      const a = 0.05 + 0.03 * Math.sin(t * 0.7 + i);
      const lg = g.createLinearGradient(0, surface, 0, H * 0.85);
      lg.addColorStop(0, `rgba(190,255,240,${a})`); lg.addColorStop(1, 'rgba(190,255,240,0)');
      g.fillStyle = lg;
      g.beginPath(); g.moveTo(x0, surface); g.lineTo(x0 + 40, surface); g.lineTo(x0 + 140, H * 0.85); g.lineTo(x0 + 60, H * 0.85); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    // kelp
    g.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const x = (i + 0.5) * (W / 14) + Math.sin(i * 7.3) * 20;
      const base = seabed(x), hgt = 50 + ((i * 37) % 70);
      g.strokeStyle = i % 2 ? INK.moss : '#256b37'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, base);
      for (let j = 1; j <= 6; j++) {
        const yy = base - (hgt * j) / 6;
        g.lineTo(x + Math.sin(t * 1.3 + i + j * 0.6) * j * 2.6, yy);
      }
      g.stroke();
    }

    // seabed and clams
    g.fillStyle = '#e9d9a8';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, seabed(x));
    g.lineTo(W, H); g.closePath(); g.fill();
    g.fillStyle = 'rgba(142,91,214,.25)';
    for (let x = 6; x < W; x += 11) for (let y = 6; y < 46; y += 11) g.fillRect(x + (y % 22 ? 5 : 0), seabed(x) + y, 2, 2);
    for (const c of clams) {
      if (c.taken) continue;
      const cy = seabed(c.x) - 4, o = Math.max(0, Math.sin(t * 1.5 + c.open)) * 3;
      g.fillStyle = INK.violet;
      g.beginPath(); g.ellipse(c.x, cy, 9, 5, 0, Math.PI, 0); g.fill();
      g.beginPath(); g.ellipse(c.x, cy + o, 9, 4, 0, 0, Math.PI); g.fill();
      if (o > 1) { g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(c.x, cy + o / 2, 2, 0, 6.283); g.fill(); }
    }

    for (const f of fish) drawFish(g, f, t);
    drawDiver(g, t);

    // bubbles
    g.strokeStyle = 'rgba(230,255,250,.8)'; g.lineWidth = 1.2;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.t += dt; b.y -= (40 + b.r * 12) * dt; b.x += Math.sin(b.t * 6 + b.r) * 0.4;
      if (b.y < surface) { bubbles.splice(i, 1); continue; }
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.283); g.stroke();
    }

    // catch flash
    if (flash) {
      flash.t += dt;
      const a = 1 - flash.t / 1.1;
      if (a <= 0) flash = null;
      else {
        g.globalAlpha = a;
        g.font = '400 12px "Silkscreen", monospace';
        g.fillStyle = flash.miss ? '#ffd0e4' : INK.yolk;
        g.fillText(flash.miss ? flash.text : `+ ${flash.text}`, flash.x + 10, flash.y - 10 - flash.t * 30);
        g.globalAlpha = 1;
      }
    }

    // oxygen
    g.fillStyle = 'rgba(23,20,28,.75)'; g.fillRect(14, surface + 14, 132, 26);
    g.fillStyle = diver.o2 < 0.25 ? INK.pink : '#7fe3b0';
    g.fillRect(48, surface + 22, 90 * diver.o2, 10);
    g.strokeStyle = '#fbfaf6'; g.lineWidth = 1; g.strokeRect(48, surface + 22, 90, 10);
    g.fillStyle = '#fbfaf6'; g.font = '400 10px "Silkscreen", monospace'; g.fillText('O2', 22, surface + 31);
    g.fillStyle = 'rgba(251,250,246,.55)'; g.fillText(`CAUGHT ${catches.length}`, 16, H - 14);
  });

  return () => { stop(); k.off(); host.removeEventListener('keydown', kd); s.destroy(); };
}
