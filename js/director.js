// The choreography. The front page starts blank; little Me comes out of the
// corner, hoovers up what is left of the black screen as ink, and prints the
// page one piece at a time. Anything further down gets printed when you
// scroll to it.

import { me, show, hop, say, fire, assemble, scatterDust, vacuum, wait, resolve, reduced, SCALE, inkOf } from './stage.js';
import { printEl, printNow, namePoints } from './print.js';

let skipped = false;
let showing = false;
let io = null;
const queue = [];
let running = false;
let homeTimer = 0;

const skipBtn = document.getElementById('skip-show');
skipBtn.addEventListener('click', () => skipShow());

const HOME = { home: true };
const rectOf = (el) => () => el.getBoundingClientRect();

// where Me should stand to print an element: just left of its bottom left
// corner, or of whatever part of it is on screen
function standBy(el) {
  const r = el.getBoundingClientRect();
  const visBottom = Math.min(r.bottom, innerHeight - 30);
  const ay = r.height ? Math.max(0.2, Math.min(1, (visBottom - r.top) / r.height)) : 1;
  const leftRoom = r.left > 8 * SCALE + 20;
  return leftRoom
    ? { el, ax: 0, ay, dx: -6 * SCALE, dy: 0 }
    : { el, ax: 0, ay, dx: 7 * SCALE, dy: 12 * SCALE / 4 + 10 };
}

export function isShowing() { return showing; }

export async function landingShow(intro, art) {
  const view = document.getElementById('view');
  const $ = (s) => view.querySelector(s);
  showing = true;
  skipped = false;
  skipBtn.hidden = false;

  const steps = async () => {
    scatterDust(intro.dust || []);
    show({ x: -40, y: innerHeight + 60 });
    await hop(HOME, { dur: 0.7, height: 120 });
    if (skipped) return;
    say('hi!', 1.2);
    await wait(0.7);
    if (skipped) return;
    if (intro.dust && intro.dust.length) {
      say('ooh. pixels.', 1.4);
      await vacuum(1.8);
      if (skipped) return;
      say('ink: 100%', 1.1);
      await wait(0.6);
    } else {
      me.ink = 1;
    }
    if (skipped) return;

    // the name, built from flying pixels
    const name = $('#name');
    const nr = name.getBoundingClientRect();
    const spot = { el: name, ax: Math.min(0.78, (innerWidth * 0.5 - nr.left) / nr.width), ay: 1, dx: 0, dy: 18 };
    await hop(spot);
    if (skipped) return;
    me.aimTarget = () => { const r = name.getBoundingClientRect(); return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.4 }; };
    say('my name first', 1.3);
    await assemble(namePoints(name), [inkOf('blue'), inkOf('pink'), '#17141c', '#17141c'], 1.9);
    me.aimTarget = null;
    printEl(name, { dur: 0.6 });
    if (skipped) return;

    // the line above it
    const kicker = $('.hero__kicker');
    await hop(standBy(kicker));
    if (skipped) return;
    me.aimTarget = () => { const r = kicker.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top }; };
    await Promise.all([fire(rectOf(kicker), 0.45), printEl(kicker, { dur: 0.6, delay: 0.1 })]);
    me.aimTarget = null;
    if (skipped) return;

    // the halftone, one ink at a time
    const facts = $('.hero__facts');
    await hop(standBy($('.hero__lede')));
    if (skipped) return;
    const artEl = $('.hero__art');
    me.aimTarget = () => { const r = artEl.getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.45 }; };
    for (const L of art.layers) {
      if (skipped) return;
      const from = { dx: (Math.random() - 0.5) * 50, dy: (Math.random() - 0.5) * 40 };
      L.dx = from.dx; L.dy = from.dy;
      const go = fire(rectOf(artEl), 0.5, [L.color]);
      await new Promise((res) => {
        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / 650);
          const e = 1 - Math.pow(1 - t, 3);
          L.alpha = Math.min(1, t * 2.2);
          L.dx = from.dx * (1 - e); L.dy = from.dy * (1 - e);
          if (t < 1 && !skipped) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      await go;
    }
    me.aimTarget = null;
    if (skipped) return;

    // the words under the name
    const lede = $('.hero__lede');
    me.aimTarget = () => { const r = lede.getBoundingClientRect(); return { x: r.left + r.width * 0.6, y: r.top + r.height * 0.5 }; };
    await Promise.all([fire(rectOf(lede), 0.55), printEl(lede, { dur: 0.8, delay: 0.05 })]);
    me.aimTarget = null;
    if (skipped) return;

    await hop(standBy(facts));
    if (skipped) return;
    me.aimTarget = () => { const r = facts.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }; };
    await Promise.all([fire(rectOf(facts), 0.5), printEl(facts, { dur: 0.7, delay: 0.05 })]);
    me.aimTarget = null;
    if (skipped) return;

    // up to the top bar on the jetpack
    const nav = $('.top');
    say('wheee', 0.9);
    await hop({ el: nav, ax: 0.42, ay: 1, dx: 0, dy: -4 }, { height: 120 });
    if (skipped) return;
    me.aimTarget = () => { const r = nav.getBoundingClientRect(); return { x: r.right - 120, y: r.top + r.height / 2 }; };
    await Promise.all([fire(rectOf(nav), 0.5), printEl(nav, { dur: 0.6, delay: 0.05 })]);
    me.aimTarget = null;
    if (skipped) return;

    const now = $('.hero__now');
    await hop(standBy(now));
    if (skipped) return;
    await Promise.all([fire(rectOf(now), 0.35), printEl(now, { dur: 0.5 })]);
    if (skipped) return;
    await hop(HOME);
    say('scroll down v', 2.6);
  };

  if (reduced) {
    printAll(view);
    art.layers.forEach((L) => { L.alpha = 1; L.dx = L.dy = 0; });
    show(HOME);
    me.ink = 1;
  } else {
    await steps();
  }
  if (skipped) {
    art.layers.forEach((L) => { L.alpha = 1; L.dx = L.dy = 0; });
  }
  showing = false;
  skipBtn.hidden = true;
  watchScroll(view);
}

function printAll(root) {
  root.querySelectorAll('.pr').forEach(printNow);
}

function skipShow() {
  if (!showing) return;
  skipped = true;
  me.aimTarget = null;
  const view = document.getElementById('view');
  const hero = view.querySelector('.hero');
  hero && hero.querySelectorAll('.pr').forEach(printNow);
  skipBtn.hidden = true;
  me.ink = 1;
  setTimeout(() => { if (!me.moving) hop(HOME); else setTimeout(() => hop(HOME), 900); }, 50);
}

// ----------------------------------------------------------- scroll printing
export function watchScroll(root) {
  stopWatching();
  const waiting = [...root.querySelectorAll('.pr[data-s="wait"]')];
  if (!waiting.length) return;
  io = new IntersectionObserver((entries) => {
    const fresh = entries.filter((e) => e.isIntersecting).map((e) => e.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    for (const el of fresh) { io.unobserve(el); if (el.dataset.s === 'wait') queue.push(el); }
    if (fresh.length) runQueue();
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  waiting.forEach((el) => io.observe(el));
}
export function stopWatching() {
  io && io.disconnect();
  io = null;
  queue.length = 0;
}

async function runQueue() {
  if (running) return;
  running = true;
  clearTimeout(homeTimer);
  while (queue.length) {
    const batch = queue.splice(0, queue.length).filter((el) => el.dataset.s === 'wait' && el.isConnected);
    if (!batch.length) continue;
    const onScreen = batch.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    batch.filter((el) => !onScreen.includes(el)).forEach(printNow);
    if (!onScreen.length) continue;
    if (reduced || onScreen.length > 8) { onScreen.forEach((el, i) => printEl(el, { dur: 0.5, delay: i * 0.05 })); continue; }

    const first = onScreen[0];
    await hop(standBy(first));
    const union = () => {
      const rs = onScreen.map((el) => el.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top));
      const r = Math.max(...rs.map((r) => r.right)), b = Math.max(...rs.map((r) => r.bottom));
      return { left: l, top: t, width: r - l, height: b - t };
    };
    me.aimTarget = () => { const u = union(); return { x: u.left + u.width / 2, y: u.top + u.height / 2 }; };
    const inks = [...new Set(onScreen.map((el) => getComputedStyle(el).getPropertyValue('--ink-a').trim()).filter(Boolean))];
    const prints = onScreen.map((el, i) => printEl(el, { dur: 0.7, delay: 0.08 + i * 0.13 }));
    await Promise.all([fire(union, 0.35 + onScreen.length * 0.1, inks.length ? [...inks, inkOf('pink'), '#17141c'] : undefined), ...prints]);
    me.aimTarget = null;
  }
  running = false;
  homeTimer = setTimeout(() => {
    if (!running && !me.busy && !(me.anchor && me.anchor.home)) hop(HOME);
  }, 1100);
}

export function goHomeSoon() { clearTimeout(homeTimer); homeTimer = setTimeout(() => { if (!me.busy) hop(HOME); }, 400); }
export { printAll };
