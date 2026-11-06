// The choreography. The page starts as white paper. Little Me comes out of the
// corner, hoovers up what is left of the black screen as ink, builds the roof
// sign out of it, and then rides the elevator down, stepping out on each floor
// you scroll to and building the room one piece at a time.

import { me, show, hop, walk, say, fire, assemble, scatterDust, vacuum, wait, reduced, SCALE, home } from './stage.js';
import { buildIn, buildNow, namePoints } from './print.js';
import { sfx } from './sfx.js';

let skipped = false, showing = false, io = null, running = false;
const queue = [];
const skipBtn = document.getElementById('skip-show');
skipBtn.addEventListener('click', () => skipShow());

const rectOf = (el) => () => el.getBoundingClientRect();
const $ = (s) => document.querySelector(`#view ${s}`);

// standing in the elevator car, or in the corner on small screens
export function carAnchor() {
  return {
    fn: () => {
      const box = $('.car__box');
      const r = box && box.getBoundingClientRect();
      if (!r || !r.width) return home();
      return { x: r.left + r.width / 2, y: r.bottom - 12 };
    },
  };
}
// a point on a floor's ground, x in page pixels
const groundAt = (floor, x) => ({
  fn: () => {
    const g = floor.querySelector('.floor__ground').getBoundingClientRect();
    return { x: Math.max(g.left + 16, Math.min(g.right - 16, x())), y: g.top + 6 };
  },
});

export function buildAll(root) {
  root.querySelectorAll('[data-s="wait"], [data-s="building"]').forEach(buildNow);
  const n = root.querySelector('#name');
  n && n.classList.remove('is-dark');
}

export async function landingShow(intro) {
  showing = true;
  skipped = false;
  skipBtn.hidden = false;
  const name = $('#name');
  name.classList.add('is-dark');
  const tower = $('.tower');
  const roofSpot = (ax) => ({ el: tower, ax, ay: 0, dy: -16 });

  const steps = async () => {
    scatterDust(intro.dust || []);
    show({ x: -40, y: innerHeight + 60 });
    await hop({ home: true }, { dur: 0.7, height: 120 });
    if (skipped) return;
    say('hi!', 1.1);
    await wait(0.6);
    if (skipped) return;
    if (intro.dust && intro.dust.length) {
      say('ooh. pixels.', 1.3);
      sfx.suck();
      await vacuum(1.7);
      if (skipped) return;
      say('ink: 100%', 1);
      await wait(0.5);
    }
    me.ink = 1;
    if (skipped) return;

    // the sign: the board first, then the name out of flying pixels
    const sign = $('.sign');
    await hop(roofSpot(0.5), { height: 160 });
    if (skipped) return;
    me.aimTarget = () => { const r = sign.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    await Promise.all([fire(rectOf(sign), 0.6), buildIn(sign, { dur: 0.8 })]);
    if (skipped) return;
    say('my name first', 1.2);
    await assemble(namePoints(name), ['#fff4d6', '#ffcf3f', '#ff4fa3', '#3ff0e0'], 1.8);
    name.classList.remove('is-dark');
    sfx.ding();
    me.aimTarget = null;
    if (skipped) return;

    // the notice and the water tank on the roof
    const notice = $('.notice');
    await walk(roofSpot(0.12), 260);
    if (skipped) return;
    me.aimTarget = () => { const r = notice.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.4 }; };
    await Promise.all([fire(rectOf(notice), 0.5), buildIn(notice, { dur: 0.7 })]);
    const tank = $('.tank');
    if (tank && tank.offsetWidth) {
      await walk(roofSpot(0.82), 300);
      me.aimTarget = () => { const r = tank.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      await Promise.all([fire(rectOf(tank), 0.4), buildIn(tank, { dur: 0.5 })]);
    } else buildNow(tank);
    me.aimTarget = null;
    if (skipped) return;

    // then the building goes up under the roof, a storey at a time
    await raiseTower();
    if (skipped) return;
    await hop(carAnchor(), { height: 90 });
    say('scroll down v', 2.4);
  };

  if (reduced) {
    buildAll(document.getElementById('view'));
    show(carAnchor());
    me.anchor = carAnchor();
  } else {
    await steps();
  }
  showing = false;
  skipBtn.hidden = true;
  watchFloors(document.getElementById('view'));
}

function raiseTower() {
  const tower = $('.tower');
  const rest = [$('.street'), $('.cornerstone')];
  tower.dataset.s = 'done';
  rest.forEach((el) => { el.dataset.s = 'done'; });
  if (reduced) return Promise.resolve();
  sfx.ding();
  const a = tower.animate([{ clipPath: 'inset(-40px -40px 100% -40px)' }, { clipPath: 'inset(-40px -40px 0 -40px)' }], { duration: 1600, easing: 'steps(16, end)' });
  let k = 0;
  const t = setInterval(() => { sfx.build(); if (++k > 14) clearInterval(t); }, 100);
  return a.finished.catch(() => {}).then(() => clearInterval(t));
}

function skipShow() {
  if (!showing) return;
  skipped = true;
  me.aimTarget = null;
  const roof = $('.roof');
  roof && roof.querySelectorAll('[data-s]').forEach(buildNow);
  [$('.tower'), $('.street'), $('.cornerstone')].forEach(buildNow);
  const n = $('#name');
  n && n.classList.remove('is-dark');
  skipBtn.hidden = true;
  me.ink = 1;
  setTimeout(() => hop(carAnchor()), me.moving ? 900 : 60);
}

// ----------------------------------------------------------------- the floors
export function watchFloors(root) {
  stopWatching();
  const floors = [...root.querySelectorAll('.floor')].filter((f) => f.querySelector('[data-s="wait"]'));
  if (!floors.length) return;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !queue.includes(e.target)) { queue.push(e.target); io.unobserve(e.target); }
    }
    runQueue();
  }, { threshold: 0.3 });
  floors.forEach((f) => io.observe(f));
}
export function stopWatching() {
  io && io.disconnect();
  io = null;
  queue.length = 0;
}

const visible = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40; };

async function runQueue() {
  if (running) return;
  running = true;
  while (queue.length) {
    const floor = queue.shift();
    if (!floor.isConnected) continue;
    if (reduced || !visible(floor)) { floor.querySelectorAll('[data-s="wait"]').forEach(buildNow); continue; }
    await buildFloor(floor);
  }
  running = false;
  if (!me.moving) hop(carAnchor(), { height: 80 });
}

async function buildFloor(floor) {
  const items = [...floor.querySelectorAll('[data-s="wait"]')];
  const head = items.shift();
  const ground = floor.querySelector('.floor__ground').getBoundingClientRect();
  // step out of the lift onto this floor
  await hop(groundAt(floor, () => floor.querySelector('.floor__ground').getBoundingClientRect().right - 30), { height: 70 });
  if (head) {
    me.aimTarget = () => { const r = head.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    await Promise.all([fire(rectOf(head), 0.3), buildIn(head, { dur: 0.45 })]);
  }
  // then the room, right to left, a few things at a time
  items.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left);
  void ground;
  while (items.length) {
    if (!visible(floor)) { items.forEach(buildNow); break; }
    const batch = items.splice(0, 3);
    const lead = batch[0];
    await walk(groundAt(floor, () => { const r = lead.getBoundingClientRect(); return r.left + r.width + 24; }), 340);
    const union = () => {
      const rs = batch.map((el) => el.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top));
      return { left: l, top: t, width: Math.max(...rs.map((r) => r.right)) - l, height: Math.max(...rs.map((r) => r.bottom)) - t };
    };
    me.aimTarget = () => { const u = union(); return { x: u.left + u.width / 2, y: u.top + u.height / 2 }; };
    await Promise.all([fire(union, 0.3 + batch.length * 0.12), ...batch.map((el, i) => buildIn(el, { dur: 0.6, delay: i * 0.12 }))]);
  }
  me.aimTarget = null;
}
