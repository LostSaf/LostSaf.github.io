// The stage is one fixed canvas over the page. Little Me, the ink he sprays,
// the dust he hoovers up and the roller he changes pages with all draw here.
// Me stands on anchors, not coordinates: an anchor can be a point on an
// element, so when the page scrolls he scrolls with whatever he is standing on.

import { compose, drawText, textWidth, ORIGIN, BUF, onOutfit } from './sprite.js';

export const INKS = ['#2b44e0', '#ff4d9a', '#ffc414', '#00897b', '#ff5b2e', '#8e5bd6'];
const INK_BY_NAME = { blue: '#2b44e0', pink: '#ff4d9a', yolk: '#ffc414', teal: '#00897b', tomato: '#ff5b2e', violet: '#8e5bd6', moss: '#3a9d4f' };
export const inkOf = (n) => INK_BY_NAME[n] || n;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const hit = document.getElementById('me-hit');
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let W = 0, H = 0, dpr = 1;
export let SCALE = 4;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  SCALE = W >= 1100 ? 4 : 3;
  hit.style.width = 14 * SCALE + 'px';
  hit.style.height = 22 * SCALE + 'px';
}
resize();
addEventListener('resize', resize);

// ------------------------------------------------------------------ tweens
const tweens = new Set();
export function tween(dur, fn, ease = (t) => t) {
  return new Promise((res) => {
    if (reduced || dur <= 0) { fn(1); res(); return; }
    tweens.add({ t0: performance.now(), dur: dur * 1000, fn, ease, res });
  });
}
export const wait = (s) => tween(s, () => {});
export const ease = {
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

// ------------------------------------------------------------------ anchors
export function resolve(a) {
  if (!a) return { x: me.x, y: me.y };
  if (a.el) {
    const r = a.el.getBoundingClientRect();
    return { x: r.left + r.width * (a.ax ?? 0) + (a.dx ?? 0), y: r.top + r.height * (a.ay ?? 1) + (a.dy ?? 0) };
  }
  if (a.home) return home();
  if (a.fn) return a.fn();
  return { x: a.x < 0 ? W + a.x : a.x, y: a.y < 0 ? H + a.y : a.y };
}
export function home() {
  const gutter = Math.max(20, Math.min(76, W * 0.05));
  return { x: Math.max(6 * SCALE, gutter / 2), y: H - (W < 700 ? 12 : 18) };
}

// ------------------------------------------------------------------ me
export const me = {
  x: -80, y: H + 40,
  visible: false,
  facing: 1,
  pose: 'idle',
  step: 0,
  aim: 0.5,
  aimTarget: null,
  look: 0,
  blink: false,
  breathe: false,
  flame: false,
  fire: false,
  ink: 0,
  anchor: null,
  moving: 0,
  acting: 0,
  get busy() { return this.moving + this.acting; },
  bubble: null,
  roller: null,
  idleLook: true,
  scale: 1,
};

let pointer = { x: W / 2, y: H / 2 };
addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });

function faceToward(x) {
  if (Math.abs(x - me.x) > 6) me.facing = x >= me.x ? 1 : -1;
}
function aimToward(x, y) {
  faceToward(x);
  const head = { x: me.x, y: me.y - 10 * SCALE };
  const dx = (x - head.x) * me.facing, dy = y - head.y;
  me.aim = Math.max(-1.35, Math.min(1.0, Math.atan2(dy, Math.max(dx, 4))));
  me.look = Math.max(-1, Math.min(1, dy / 260));
}

export function show(at) {
  const p = resolve(at);
  me.x = p.x; me.y = p.y; me.visible = true;
}

export async function hop(target, o = {}) {
  me.moving++;
  const a = { x: me.x, y: me.y };
  const b0 = resolve(target);
  const dist = Math.hypot(b0.x - a.x, b0.y - a.y);
  const dur = o.dur ?? Math.min(1.05, Math.max(0.42, 0.32 + dist / 1500));
  const height = o.height ?? Math.min(230, 34 + dist * 0.22);
  me.anchor = null;
  faceToward(b0.x);
  me.flame = dist > 140;
  me.look = -0.2;
  await tween(dur, (t) => {
    const b = resolve(target);
    const e = ease.sine(t);
    me.x = a.x + (b.x - a.x) * e;
    me.y = a.y + (b.y - a.y) * e - height * 4 * t * (1 - t);
    me.pose = 'jump';
  });
  me.anchor = target;
  me.pose = 'idle';
  me.flame = false;
  me.look = 0;
  puff(me.x, me.y, 6);
  me.moving--;
}

export async function walk(target, speed = 120) {
  me.moving++;
  const a = me.x;
  const b0 = resolve(target);
  const dist = Math.abs(b0.x - a);
  me.anchor = null;
  faceToward(b0.x);
  await tween(dist / speed, (t) => {
    const b = resolve(target);
    me.x = a + (b.x - a) * t;
    me.y = b.y;
    me.pose = 'walk';
    me.step = Math.floor(Math.abs(me.x - a) / (2.2 * SCALE));
  });
  me.anchor = target;
  me.pose = 'idle';
  me.moving--;
}

export function say(text, secs = 1.8) {
  me.bubble = { text, until: performance.now() + secs * 1000, t0: performance.now() };
}

export function muzzle() {
  const st = lastFrame;
  if (!st) return { x: me.x, y: me.y - 8 * SCALE };
  const S = SCALE * me.scale;
  return {
    x: me.x + me.facing * (st.muzzle.x - ORIGIN.x + 0.5) * S,
    y: me.y + (st.muzzle.y - ORIGIN.y - 0.5) * S,
  };
}

// ------------------------------------------------------------------ particles
const parts = [];

function puff(x, y, n) {
  for (let i = 0; i < n; i++) {
    parts.push({ kind: 'puff', x: x + (Math.random() - 0.5) * 18, y: y - 2, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40, life: 0.45, age: 0, c: '#d6d0c4', s: SCALE });
  }
}

// Ink shot at a rectangle: a stream of square drops that land and splat.
export function fire(getRect, secs = 0.7, colors = INKS.slice(0, 3)) {
  me.acting++;
  return new Promise((res) => {
    const job = { getRect, colors, until: performance.now() + secs * 1000, acc: 0, res };
    fireJobs.add(job);
  }).finally(() => { me.acting--; });
}
const fireJobs = new Set();

// Pixels that fly out of the printer and settle on exact points, for the name.
export function assemble(points, colors, secs = 1.6) {
  me.acting++;
  return new Promise((res) => {
    if (reduced) { res(); return; }
    const job = { points: points.slice(), colors, spawned: 0, landed: 0, t0: performance.now(), secs, res, list: [] };
    assembleJobs.add(job);
  }).finally(() => { me.acting--; });
}
const assembleJobs = new Set();

export function scatterDust(list) {
  for (const d of list) {
    parts.push({ kind: 'dust', x: d.x, y: d.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, c: Math.random() < 0.82 ? '#17141c' : INKS[(Math.random() * 3) | 0], s: Math.random() < 0.3 ? 4 : 3, age: 0, life: 1e9 });
  }
}
export function vacuum(secs = 1.4) {
  me.acting++;
  return new Promise((res) => {
    vac = { until: performance.now() + secs * 1000, res };
  }).finally(() => { me.acting--; });
}
let vac = null;

// ------------------------------------------------------------------ roller
export function setRoller(r) { me.roller = r; }

// ------------------------------------------------------------------ loop
let last = performance.now();
let lastFrame = null;
let blinkAt = performance.now() + 2500;
let breatheAt = 0;

hit.addEventListener('click', () => {
  if (me.busy || !me.visible) return;
  const lines = ['hi!', 'hire me?', 'ink: 100%', 'i made this', 'boop', '~ ~ ~', 'scroll v', 'press ctrl+p'];
  say(lines[(Math.random() * lines.length) | 0]);
  const at = me.anchor;
  hop({ x: me.x, y: me.y }, { dur: 0.42, height: 34 }).then(() => { me.anchor = at; });
});

onOutfit(() => { lastFrame = null; });

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  for (const tw of tweens) {
    const t = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(tw.ease(t));
    if (t >= 1) { tweens.delete(tw); tw.res(); }
  }

  if (me.anchor && !me.moving) {
    const p = resolve(me.anchor);
    me.x = p.x; me.y = p.y;
  }

  // idle life: blink, breathe, watch the cursor
  if (now > blinkAt) { me.blink = true; if (now > blinkAt + 130) { me.blink = false; blinkAt = now + 1800 + Math.random() * 3600; } }
  if (now > breatheAt) { me.breathe = !me.breathe; breatheAt = now + 700; }

  const firing = fireJobs.size > 0 || assembleJobs.size > 0 || !!vac;
  if (me.aimTarget) {
    const p = typeof me.aimTarget === 'function' ? me.aimTarget() : me.aimTarget;
    aimToward(p.x, p.y);
  } else if (!me.busy && me.pose === 'idle' && me.idleLook && !me.roller) {
    faceToward(pointer.x);
    const dy = pointer.y - (me.y - 10 * SCALE);
    me.look += (Math.max(-1, Math.min(1, dy / 300)) - me.look) * 0.1;
    me.aim += (0.55 - me.aim) * 0.1;
  }
  me.fire = firing;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  if (me.roller) drawRoller(me.roller);

  // fire jobs: spawn drops toward random points of the target
  for (const job of fireJobs) {
    const r = job.getRect();
    job.acc += dt * 70;
    while (job.acc > 1) {
      job.acc -= 1;
      const m = muzzle();
      const tx = r.left + Math.random() * r.width, ty = r.top + Math.random() * r.height;
      parts.push({ kind: 'shot', x: m.x, y: m.y, sx: m.x, sy: m.y, tx, ty, age: 0, life: 0.22 + Math.random() * 0.22, c: job.colors[(Math.random() * job.colors.length) | 0], s: SCALE * (Math.random() < 0.3 ? 1.5 : 1), arc: -20 - Math.random() * 60 });
    }
    if (now > job.until) { fireJobs.delete(job); job.res(); }
  }

  // assemble jobs: the name
  for (const job of assembleJobs) {
    const el = (now - job.t0) / 1000;
    const want = Math.min(job.points.length, Math.floor(job.points.length * Math.min(1, el / (job.secs * 0.7))));
    while (job.spawned < want) {
      const m = muzzle();
      const p = job.points[job.spawned++];
      const q = { kind: 'build', x: m.x, y: m.y, sx: m.x, sy: m.y, tx: p.x, ty: p.y, age: 0, life: 0.45 + Math.random() * 0.4, c: job.colors[(Math.random() * job.colors.length) | 0], s: p.s, job, arc: -60 - Math.random() * 140 };
      parts.push(q);
      job.list.push(q);
    }
    if (job.spawned >= job.points.length && job.landed >= job.points.length) {
      assembleJobs.delete(job);
      // the built letters fade out as the real type prints over them
      for (const q of job.list) { q.kind = 'fade'; q.age = 0; q.life = 0.5 + Math.random() * 0.3; }
      job.res();
    }
  }

  if (vac) {
    const m = muzzle();
    let left = 0;
    for (const p of parts) {
      if (p.kind !== 'dust') continue;
      left++;
      const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
      const pull = 2400 / Math.max(d, 30) + 260;
      p.vx += (dx / d) * pull * dt * 9;
      p.vy += (dy / d) * pull * dt * 9;
      p.vx *= 0.9; p.vy *= 0.9;
      if (d < 10) { p.dead = true; me.ink = Math.min(1, me.ink + 0.006); }
    }
    me.aimTarget = () => {
      let sx = 0, sy = 0, n = 0;
      for (const p of parts) if (p.kind === 'dust') { sx += p.x; sy += p.y; n++; }
      return n ? { x: sx / n, y: sy / n } : { x: me.x + me.facing * 100, y: me.y - 60 };
    };
    if ((left === 0 && now > vac.until - 900) || now > vac.until + 2500) {
      for (const p of parts) if (p.kind === 'dust') p.dead = true;
      me.ink = 1;
      me.aimTarget = null;
      const r = vac.res; vac = null; r();
    }
  }

  // particles
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += dt;
    if (p.kind === 'shot' || p.kind === 'build') {
      const t = Math.min(1, p.age / p.life);
      const e = p.kind === 'build' ? ease.io(t) : t;
      p.x = p.sx + (p.tx - p.sx) * e;
      p.y = p.sy + (p.ty - p.sy) * e + p.arc * 4 * t * (1 - t);
      if (t >= 1) {
        if (p.kind === 'shot') { p.kind = 'splat'; p.age = 0; p.life = 0.35; }
        else { p.kind = 'built'; p.job.landed++; }
      }
    } else if (p.kind === 'dust') {
      if (!vac) { p.vx += (Math.random() - 0.5) * 20 * dt; p.vy += (Math.random() - 0.5) * 20 * dt - 2 * dt; p.vx *= 0.98; p.vy *= 0.98; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    } else if (p.kind === 'puff') {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.92;
    }
    if (p.dead || (p.kind !== 'built' && p.kind !== 'dust' && p.age > p.life)) { parts.splice(i, 1); continue; }

    let a = 1, s = p.s;
    if (p.kind === 'splat') { a = 1 - p.age / p.life; s = p.s * (1 + p.age * 3); }
    if (p.kind === 'puff') a = 1 - p.age / p.life;
    if (p.kind === 'fade') { a = 1 - p.age / p.life; s = p.s * (1 - p.age / p.life * 0.6); }
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.c;
    ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s), Math.ceil(s));
  }
  ctx.globalAlpha = 1;

  if (me.visible) drawMe(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function drawMe(now) {
  const st = compose({
    pose: me.pose, step: me.step, blink: me.blink, look: me.look, aim: me.aim,
    fire: me.fire, flame: me.flame, ink: me.ink, breathe: me.breathe, t: now / 1000,
  });
  lastFrame = st;
  const S = SCALE * me.scale;
  ctx.save();
  ctx.translate(Math.round(me.x), Math.round(me.y));
  ctx.scale(me.facing, 1);
  // a soft shadow so he sits on the page
  if (me.pose !== 'jump') {
    ctx.fillStyle = 'rgba(23,20,28,.12)';
    ctx.fillRect(-5 * S, -S * 0.5, 10 * S, S);
  }
  ctx.drawImage(st.canvas, -ORIGIN.x * S, -(ORIGIN.y + 1) * S, BUF * S, BUF * S);
  ctx.restore();

  hit.style.transform = `translate(${Math.round(me.x - 7 * S)}px, ${Math.round(me.y - 22 * S)}px)`;

  const b = me.bubble;
  if (b) {
    if (now > b.until) me.bubble = null;
    else {
      const s = 2;
      const text = b.text.slice(0, Math.max(1, Math.floor((now - b.t0) / 35)));
      const tw = textWidth(b.text, s);
      const bw = tw + 14, bh = 7 * s + 12;
      let bx = Math.round(me.x - bw / 2 + me.facing * 10), by = Math.round(me.y - 24 * SCALE - bh - 6);
      bx = Math.max(6, Math.min(W - bw - 6, bx));
      by = Math.max(6, by);
      ctx.fillStyle = '#17141c';
      ctx.fillRect(bx - 2, by, bw + 4, bh);
      ctx.fillRect(bx, by - 2, bw, bh + 4);
      ctx.fillStyle = '#fbfaf6';
      ctx.fillRect(bx, by, bw, bh);
      const tx = Math.round(Math.max(bx + 8, Math.min(bx + bw - 12, me.x)));
      ctx.fillStyle = '#17141c';
      ctx.fillRect(tx - 2, by + bh, 6, 2);
      ctx.fillRect(tx, by + bh + 2, 2, 4);
      ctx.fillStyle = '#fbfaf6';
      ctx.fillRect(tx, by + bh - 2, 2, 4);
      drawText(ctx, text, bx + 7, by + 6, s, '#17141c');
    }
  }
}

function drawRoller(r) {
  const S = SCALE;
  const x = Math.round(r.x), w = 7 * S;
  const ink = r.color;
  // nap of the roller: rows of pixel bumps that scroll as it turns
  ctx.fillStyle = ink;
  ctx.fillRect(x - w / 2, -S, w, H + 2 * S);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  const off = Math.floor(r.x / S) % 4;
  for (let y = -S * 4; y < H + S * 4; y += S * 4) ctx.fillRect(x - w / 2 + S, y + off * S, S, S * 2);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(x + w / 2 - S * 2, -S, S * 2, H + 2 * S);
  ctx.fillStyle = '#17141c';
  ctx.fillRect(x - w / 2 - S, -S, S, H + 2 * S);
  ctx.fillRect(x + w / 2, -S, S, H + 2 * S);
  // wet ink trail on the new page side
  const g = ctx.createLinearGradient(x, 0, x - r.dir * 90, 0);
  g.addColorStop(0, ink + 'aa');
  g.addColorStop(1, ink + '00');
  ctx.fillStyle = g;
  ctx.fillRect(Math.min(x, x - r.dir * 90), 0, 90, H);
  // the frame, from the bottom of the drum back to his hands
  const hand = muzzle();
  ctx.fillStyle = '#17141c';
  const fy = H - 30 * S / 4;
  ctx.fillRect(Math.min(x, hand.x), fy, Math.abs(x - hand.x), S);
  ctx.fillRect(Math.round(hand.x) - S, Math.min(fy, hand.y), S * 2, Math.abs(fy - hand.y) + S);
}
