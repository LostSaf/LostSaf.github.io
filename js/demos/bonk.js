// Bonk a Brainrot in miniature. Knockback grows with the percent you have
// taken, so the same swing that taps someone at 0% sends them into the goo at
// 120%. The island loses a tile every few seconds. A small bot fights back.

import { stage, loop, keys, el, INK, clamp } from './kit.js';

export function mount(host) {
  const s = stage(host);
  const k = keys(host, ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'j']);
  let W = s.w, H = s.h, TILE = 30, islandY = 0, gooY = 0, tiles = [];
  const score = { you: 0, bot: 0 };
  let banner = null, crumbleIn = 2.5, shake = 0;
  const pops = [];

  const you = { name: 'YOU', col: INK.pink, dark: '#c42a6f' };
  const bot = { name: 'BOT', col: INK.yolk, dark: '#d99a00' };
  const fighters = [you, bot];

  function reset() {
    W = s.w; H = s.h;
    islandY = Math.round(H * 0.6);
    gooY = Math.round(H * 0.86);
    const n = Math.max(8, Math.floor((W * 0.62) / TILE));
    const x0 = Math.round((W - n * TILE) / 2);
    tiles = Array.from({ length: n }, (_, i) => ({ x: x0 + i * TILE, alive: true, shake: 0, fy: 0, vy: 0 }));
    Object.assign(you, { x: x0 + TILE * 2, y: islandY - 40, vx: 0, vy: 0, pct: 0, face: 1, swing: 0, cd: 0, stun: 0, ground: false, out: false });
    Object.assign(bot, { x: x0 + (n - 2) * TILE, y: islandY - 40, vx: 0, vy: 0, pct: 0, face: -1, swing: 0, cd: 0, stun: 0, ground: false, out: false, think: 0 });
    crumbleIn = 2.5;
  }
  s.onResize = () => { if (!tiles.length || Math.abs(s.w - W) > 40) reset(); };
  reset();

  const tileAt = (x) => tiles.find((t) => t.alive && t.shake < 0.9 && x >= t.x && x < t.x + TILE);

  function swing(f) {
    if (f.cd > 0 || f.stun > 0 || f.out) return;
    f.swing = 0.2; f.cd = 0.42;
    const o = f === you ? bot : you;
    const dx = o.x - f.x, dy = o.y - f.y;
    if (!o.out && Math.sign(dx || f.face) === f.face && Math.abs(dx) < 54 && Math.abs(dy) < 36) {
      const dmg = 9 + Math.random() * 6;
      o.pct += dmg;
      const kb = 200 + o.pct * 7.2;
      o.vx = f.face * kb;
      o.vy = -(220 + o.pct * 3.4);
      o.stun = 0.22 + o.pct * 0.004;
      o.ground = false;
      shake = Math.min(14, 3 + o.pct * 0.06);
      pops.push({ x: (f.x + o.x) / 2, y: o.y - 30, t: 0, text: o.pct > 90 ? 'HOME RUN' : 'BONK!' });
    }
  }

  const kd = (e) => {
    const key = e.key.toLowerCase();
    if (key === ' ' || key === 'j') swing(you);
    if ((key === 'w' || key === 'arrowup') && you.ground && you.stun <= 0) { you.vy = -560; you.ground = false; }
  };
  host.addEventListener('keydown', kd);

  // touch buttons
  const pad = el('div', { style: 'position:absolute;left:12px;right:12px;bottom:12px;display:flex;gap:8px;justify-content:space-between;pointer-events:none' });
  pad.innerHTML = `<div><button class="dbtn" data-k="a" style="pointer-events:auto;background:#17141cdd;color:#fbfaf6">&lt;</button><button class="dbtn" data-k="d" style="pointer-events:auto;background:#17141cdd;color:#fbfaf6">&gt;</button></div>
    <div><button class="dbtn" data-k="w" style="pointer-events:auto;background:#17141cdd;color:#fbfaf6">JUMP</button><button class="dbtn" data-k=" " style="pointer-events:auto;background:#ff4d9a;color:#17141c;border-color:#ff4d9a">BONK</button></div>`;
  if (matchMedia('(pointer: coarse)').matches) host.appendChild(pad);
  pad.querySelectorAll('[data-k]').forEach((b) => {
    const key = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); k.down.add(key); kd({ key }); });
    b.addEventListener('pointerup', () => k.down.delete(key));
    b.addEventListener('pointerleave', () => k.down.delete(key));
  });

  function physics(f, dt, ax) {
    if (f.out) return;
    f.cd -= dt; f.swing -= dt; f.stun -= dt;
    if (f.stun <= 0) {
      f.vx += ax * dt;
      if (ax === 0 && f.ground) f.vx *= Math.pow(0.0005, dt);
      f.vx = clamp(f.vx, -250, 250);
      if (ax) f.face = Math.sign(ax);
    } else {
      f.vx *= Math.pow(0.6, dt);
    }
    f.vy += 1500 * dt;
    const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
    f.ground = false;
    if (f.vy >= 0 && f.y <= islandY - 14 + 2 && ny >= islandY - 14) {
      const t = tileAt(nx);
      if (t) { f.y = islandY - 14; f.vy = 0; f.ground = true; f.x = nx; return; }
    }
    f.x = nx; f.y = ny;
    if (f.y > gooY + 10 || f.x < -80 || f.x > W + 80 || f.y < -400) {
      f.out = true;
      const winner = f === you ? bot : you;
      score[winner === you ? 'you' : 'bot']++;
      banner = { text: winner === you ? 'KO! YOU WIN THE ROUND' : 'SPLASH. THE BOT WINS', t: 0 };
    }
  }

  function brain(dt) {
    if (bot.out || you.out) return 0;
    bot.think -= dt;
    const dx = you.x - bot.x, dist = Math.abs(dx);
    let ax = 0;
    if (bot.stun <= 0) {
      if (dist > 40) ax = Math.sign(dx) * 900;
      else { bot.face = Math.sign(dx) || bot.face; if (bot.think <= 0) { swing(bot); bot.think = 0.45 + Math.random() * 0.5; } }
      const ahead = tileAt(bot.x + Math.sign(ax || bot.face) * 22);
      if (!ahead && bot.ground) { if (Math.random() < 0.6) { bot.vy = -540; bot.ground = false; } else ax = -ax; }
      if (you.y < bot.y - 40 && bot.ground && Math.random() < dt * 2) { bot.vy = -540; bot.ground = false; }
    }
    return ax;
  }

  function drawFighter(g, f, t) {
    if (f.out) return;
    const sq = f.ground ? 1 + Math.sin(t * 12) * 0.03 : 0.92;
    g.save();
    g.translate(f.x, f.y);
    if (f.stun > 0) g.rotate(Math.sin(t * 40) * 0.15);
    // bat
    const sw = f.swing > 0 ? 1 - f.swing / 0.2 : 0;
    const ang = f.swing > 0 ? -1.9 + sw * 3.1 : -0.9;
    g.save(); g.scale(f.face, 1); g.translate(8, -2); g.rotate(ang);
    g.fillStyle = '#8a5a2b'; g.fillRect(0, -2.5, 34, 5);
    g.fillStyle = '#5e3a17'; g.fillRect(24, -4, 12, 8);
    g.restore();
    // body
    g.fillStyle = f.col;
    g.beginPath(); g.ellipse(0, 0, 15 / sq, 15 * sq, 0, 0, 6.283); g.fill();
    g.fillStyle = f.dark; g.beginPath(); g.ellipse(0, 6, 12, 6, 0, 0, Math.PI); g.fill();
    // face
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(f.face * 5, -4, 4.5, 0, 6.283); g.arc(f.face * 12, -4, 3.5, 0, 6.283); g.fill();
    g.fillStyle = INK.ink;
    g.beginPath(); g.arc(f.face * 6.5, -3.5, 2, 0, 6.283); g.arc(f.face * 13, -3.5, 1.7, 0, 6.283); g.fill();
    g.restore();
    // percent above head
    g.font = '400 11px "Silkscreen", monospace';
    g.textAlign = 'center';
    g.fillStyle = INK.ink;
    g.fillText(f.name, f.x, f.y - 24);
    g.textAlign = 'left';
  }

  const stop = loop(host, (dt, t) => {
    const g = s.g;
    // input
    let ax = 0;
    if (k.down.has('a') || k.down.has('arrowleft')) ax -= 900;
    if (k.down.has('d') || k.down.has('arrowright')) ax += 900;
    if (!banner) {
      physics(you, dt, ax);
      physics(bot, dt, brain(dt));
      crumbleIn -= dt;
      if (crumbleIn <= 0) {
        const alive = tiles.filter((tt) => tt.alive && tt.shake === 0);
        if (alive.length > 3) alive[(Math.random() * alive.length) | 0].shake = 0.001;
        crumbleIn = 1.6 + Math.random() * 1.6;
      }
    } else {
      banner.t += dt;
      if (banner.t > 1.8) { banner = null; reset(); }
    }
    for (const tt of tiles) {
      if (tt.shake > 0 && tt.alive) { tt.shake += dt; if (tt.shake > 0.9) { tt.vy += 1400 * dt; tt.fy += tt.vy * dt; if (tt.fy > H) tt.alive = false; } }
    }

    g.save();
    if (shake > 0) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= Math.pow(0.002, dt); if (shake < 0.3) shake = 0; }
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#ffe9a8'); sky.addColorStop(0.6, '#ffc7de'); sky.addColorStop(1, '#ff9cc7');
    g.fillStyle = sky; g.fillRect(-20, -20, W + 40, H + 40);
    // halftone sun
    g.fillStyle = 'rgba(255,91,46,.55)';
    for (let y = 20; y < 160; y += 9) for (let x = W - 200; x < W - 30; x += 9) {
      const d = Math.hypot(x - (W - 110), y - 86);
      const r = Math.max(0, 1 - d / 70) * 4.4;
      if (r > 0.3) { g.beginPath(); g.arc(x + ((y / 9) % 2) * 4.5, y, r, 0, 6.283); g.fill(); }
    }

    for (const tt of tiles) {
      if (!tt.alive) continue;
      const jig = tt.shake > 0 && tt.shake < 0.9 ? Math.sin(t * 70) * 2 : 0;
      const x = tt.x + jig, y = islandY + tt.fy;
      g.fillStyle = INK.moss; g.fillRect(x, y, TILE - 1, 8);
      g.fillStyle = '#8a5a2b'; g.fillRect(x, y + 8, TILE - 1, 16);
      g.fillStyle = '#5e3a17'; g.fillRect(x + 4, y + 24, TILE - 9, 6);
      g.strokeStyle = INK.ink; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, TILE - 2, 29);
    }
    for (const f of fighters) drawFighter(g, f, t);

    // goo
    g.fillStyle = INK.violet;
    g.beginPath(); g.moveTo(-20, H + 20);
    for (let x = -20; x <= W + 20; x += 10) g.lineTo(x, gooY + Math.sin(x * 0.04 + t * 2.4) * 5 + Math.sin(x * 0.013 - t) * 4);
    g.lineTo(W + 20, H + 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 9; i++) { const bx = (i * 131 + t * 30) % W; g.beginPath(); g.arc(bx, gooY + 18 + Math.sin(t * 3 + i) * 6, 3 + (i % 3), 0, 6.283); g.fill(); }

    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt;
      if (p.t > 0.8) { pops.splice(i, 1); continue; }
      g.globalAlpha = 1 - p.t / 0.8;
      g.font = `400 ${18 + p.t * 20}px "Silkscreen", monospace`;
      g.textAlign = 'center'; g.fillStyle = INK.ink; g.fillText(p.text, p.x + 2, p.y - p.t * 40 + 2);
      g.fillStyle = INK.yolk; g.fillText(p.text, p.x, p.y - p.t * 40);
      g.textAlign = 'left'; g.globalAlpha = 1;
    }
    g.restore();

    // percent cards
    const card = (f, x) => {
      const p = Math.round(f.pct);
      const heat = clamp(p / 140, 0, 1);
      g.fillStyle = INK.ink; g.fillRect(x, 14, 150, 52);
      g.fillStyle = f.col; g.fillRect(x, 14, 8, 52);
      g.font = '400 30px "Silkscreen", monospace';
      g.fillStyle = `rgb(255,${Math.round(250 - heat * 170)},${Math.round(246 - heat * 200)})`;
      g.fillText(`${p}%`, x + 18, 50);
      g.font = '400 10px "Silkscreen", monospace'; g.fillStyle = '#b9b4c0';
      g.fillText(`${f.name}  WINS ${f === you ? score.you : score.bot}`, x + 18, 61);
    };
    card(you, 14); card(bot, 172);
    if (banner) {
      g.fillStyle = 'rgba(23,20,28,.85)'; g.fillRect(0, H / 2 - 30, W, 60);
      g.font = '400 22px "Silkscreen", monospace'; g.textAlign = 'center'; g.fillStyle = INK.yolk;
      g.fillText(banner.text, W / 2, H / 2 + 8); g.textAlign = 'left';
    }
    if (document.activeElement !== host) {
      g.font = '400 11px "Silkscreen", monospace'; g.fillStyle = INK.ink; g.textAlign = 'right';
      g.fillText('CLICK TO PLAY', W - 16, H - 16); g.textAlign = 'left';
    }
  });

  return () => { stop(); k.off(); host.removeEventListener('keydown', kd); s.destroy(); };
}
