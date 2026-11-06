// Boot, routes, and the page change.
//
// Routes are hashes (#/work/<slug>, #/games/<slug>) so the site runs from any
// static host with no server config. Changing page is a paint roller: the
// next page is laid out in a fixed layer, little Me pushes a roller across the
// screen, and the layer is uncovered behind it. When the roller leaves, the
// real page is swapped in at the same scroll position, so nothing jumps.

import { runIntro } from './intro.js';
import { homeHTML, projectHTML, cvHTML, bySlug } from './pages.js';
import { landingShow, watchScroll, stopWatching, printAll, goHomeSoon } from './director.js';
import { me, show, hop, say, tween, setRoller, reduced, SCALE, inkOf, ease } from './stage.js';
import { Halftone } from './print.js';
import { heroLayers, coverLayers } from './covers.js';
import { setOutfit, outfit, compose, onOutfit } from './sprite.js';

const view = document.getElementById('view');
const next = document.getElementById('next');
const hit = document.getElementById('me-hit');

let current = { route: null, cleanup: null };
let homePrinted = false;
let homeScroll = 0;
let transitioning = false;
let queued = null;
let pendingScroll = null;
let homeArt = null;

document.getElementById('cv').innerHTML = cvHTML();

function parse(hash) {
  const m = (hash || '').match(/^#\/(work|games)\/([\w-]+)/);
  if (m && bySlug[m[2]]) return { name: 'project', slug: m[2] };
  return { name: 'home' };
}
const same = (a, b) => a && b && a.name === b.name && a.slug === b.slug;

// ----------------------------------------------------------------- mounting
function mountHome(root, printed) {
  const offs = [];
  const art = new Halftone(root.querySelector('.hero__art canvas'), heroLayers.map((l) => ({ ...l })), { cell: 11 });
  if (!printed) art.layers.forEach((L) => { L.alpha = 0; });
  art.draw(0);
  art.start();
  offs.push(() => art.destroy());
  homeArt = art;

  root.querySelectorAll('canvas[data-cover]').forEach((c) => {
    const p = bySlug[c.dataset.cover];
    const ht = new Halftone(c, coverLayers[p.slug](p.ink.map(inkOf)), { cell: 8 });
    ht.draw(1.3);
    const card = c.closest('.card');
    card.addEventListener('pointerenter', () => ht.start());
    card.addEventListener('pointerleave', () => { ht.stop(); });
    offs.push(() => ht.destroy());
  });

  // skills light up the projects that used them
  const proof = root.querySelector('.proof');
  const grids = root.querySelectorAll('[data-grid]');
  root.querySelectorAll('.skill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      root.querySelectorAll('.skill').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      root.querySelectorAll('.card').forEach((c) => c.classList.remove('is-lit'));
      grids.forEach((g) => g.classList.toggle('is-filtering', on));
      if (!on) { proof.textContent = ''; return; }
      btn.setAttribute('aria-pressed', 'true');
      const used = btn.dataset.used.split(' ');
      used.forEach((s) => root.querySelectorAll(`.card[data-slug="${s}"]`).forEach((c) => c.classList.add('is-lit')));
      const name = btn.firstChild.textContent;
      proof.innerHTML = `<span class="pixel">${name}</span><span>used in</span>` + used.map((s) => {
        if (s === 'site') return '<a href="#/" data-scroll="colophon">this site</a>';
        const p = bySlug[s];
        return `<a href="#/${p.kind === 'game' ? 'games' : 'work'}/${s}">${p.title}</a>`;
      }).join('<span>/</span>');
    });
  });

  // the fitting room
  const mirror = root.querySelector('[data-mirror]');
  const mctx = mirror.getContext('2d');
  let raf = 0, last = 0, blinkAt = 0, breathe = false;
  const paint = (now) => {
    raf = requestAnimationFrame(paint);
    if (now - last < 90) return;
    last = now;
    if (now > blinkAt + 140) blinkAt = now + 1600 + Math.random() * 3000;
    breathe = Math.floor(now / 650) % 2 === 0;
    const st = compose({ pose: 'idle', step: 0, blink: now > blinkAt, look: -0.1, aim: 0.55, fire: false, flame: false, ink: 1, breathe, t: now / 1000 });
    mctx.clearRect(0, 0, 36, 36);
    mctx.drawImage(st.canvas, 0, 0);
  };
  raf = requestAnimationFrame(paint);
  offs.push(() => cancelAnimationFrame(raf));
  const syncSwatches = () => root.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(outfit[b.dataset.part] === b.dataset.key)));
  syncSwatches();
  offs.push(onOutfit(syncSwatches));
  const lines = { top: ['new fit!', 'comfy', 'very me'], hat: ['hat on', 'better?'], eyes: ['cool.', 'i see you'], shoes: ['fresh', 'clean'] };
  root.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => {
    setOutfit(b.dataset.part, b.dataset.key);
    const l = lines[b.dataset.part];
    if (me.visible) say(l[(Math.random() * l.length) | 0], 1.2);
  }));

  return () => offs.forEach((f) => f());
}

function mountProject(root, p) {
  const host = root.querySelector('.demo');
  let cleanup = null, dead = false;
  import(`./demos/${p.demo}.js`).then((mod) => {
    if (dead) return;
    host.textContent = '';
    cleanup = mod.mount(host, p) || null;
  }).catch((err) => {
    console.error(err);
    host.innerHTML = '<div class="demo__loading">THE DEMO DID NOT LOAD</div>';
  });
  return () => { dead = true; cleanup && cleanup(); };
}

function render(route, html) {
  view.innerHTML = html;
  if (route.name === 'home') {
    if (homePrinted || reduced) printAll(view);
    current = { route, cleanup: mountHome(view, homePrinted || reduced) };
  } else {
    printAll(view);
    current = { route, cleanup: mountProject(view, bySlug[route.slug]) };
  }
  document.title = route.name === 'home' ? 'Safowan Mostaque · Developer' : `${bySlug[route.slug].title} · Safowan Mostaque`;
}

// paint the copy under the roller once, so covers are not blank while it rolls
function paintStatic(page) {
  page.querySelectorAll('canvas[data-cover]').forEach((c) => {
    const p = bySlug[c.dataset.cover];
    const ht = new Halftone(c, coverLayers[p.slug](p.ink.map(inkOf)), { cell: 8, live: false });
    ht.draw(1.3); ht.destroy();
  });
  const art = page.querySelector('.hero__art canvas');
  if (art) { const ht = new Halftone(art, heroLayers, { cell: 11, live: false }); ht.draw(homeArt ? homeArt.t : 0); ht.destroy(); }
}

// ----------------------------------------------------------------- the roller
function roll(dir, color, onX) {
  const W = innerWidth, H = innerHeight;
  const S = SCALE;
  const r = { x: dir > 0 ? -40 : W + 40, dir, color };
  const x0 = r.x, x1 = dir > 0 ? W + 40 + 26 * S : -40 - 26 * S;
  setRoller(r);
  me.visible = true; me.anchor = null; me.aimTarget = null; me.bubble = null;
  me.moving++;
  return tween(reduced ? 0 : 1.25, (t) => {
    r.x = x0 + (x1 - x0) * t;
    me.facing = dir;
    me.x = r.x - dir * 18 * S;
    me.y = H - 4;
    me.pose = 'walk';
    me.step = Math.floor(Math.abs(r.x) / (2 * S));
    me.aim = -0.15;
    me.look = 0;
    onX(Math.max(0, Math.min(W, r.x)));
  }, ease.io).then(() => { setRoller(null); me.moving--; });
}

async function go(route) {
  if (same(route, current.route)) {
    if (pendingScroll) { scrollToId(pendingScroll); pendingScroll = null; }
    return;
  }
  if (transitioning) { queued = route; return; }
  transitioning = true;
  stopWatching();
  if (current.route && current.route.name === 'home') { homeScroll = scrollY; homePrinted = true; }

  const html = route.name === 'home' ? homeHTML() : projectHTML(bySlug[route.slug]);
  const dir = route.name === 'home' ? -1 : 1;
  const color = route.name === 'home' ? inkOf('blue') : inkOf(bySlug[route.slug].ink[0]);
  const target = route.name === 'home' && !pendingScroll ? homeScroll : 0;

  next.innerHTML = html;
  const page = next.firstElementChild;
  page.querySelectorAll('.pr').forEach((el) => { el.dataset.s = 'done'; });
  page.style.transform = `translateY(${-target}px)`;
  next.style.clipPath = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
  next.classList.add('is-on');
  paintStatic(page);
  document.documentElement.style.overflow = 'hidden';

  await roll(dir, color, (x) => {
    next.style.clipPath = dir > 0 ? `inset(0 ${innerWidth - x}px 0 0)` : `inset(0 0 0 ${x}px)`;
  });

  current.cleanup && current.cleanup();
  render(route, html);
  document.documentElement.style.overflow = '';
  scrollTo(0, target);
  next.classList.remove('is-on');
  next.textContent = '';
  next.style.clipPath = '';
  view.focus({ preventScroll: true });
  transitioning = false;

  arrive(route);
  if (pendingScroll) { const id = pendingScroll; pendingScroll = null; setTimeout(() => scrollToId(id), 60); }
  if (queued) { const q = queued; queued = null; go(q); }
}

// little Me comes back out of the corner after a page change
async function arrive(route) {
  show({ x: -40, y: innerHeight + 60 });
  if (route.name === 'project') {
    const frame = view.querySelector('.demo-frame');
    const r = frame.getBoundingClientRect();
    if (r.top > 60 && r.top < innerHeight - 60) {
      await hop({ el: frame, ax: 0.04, ay: 0, dx: 4 * SCALE, dy: -2 }, { height: 140 });
      say('try it!', 1.6);
      return;
    }
  }
  await hop({ home: true }, { dur: 0.6, height: 90 });
  if (route.name === 'home') watchScroll(view);
}

function scrollToId(id) {
  const el = id === 'top' ? document.body : document.getElementById(id);
  if (!el) return;
  const y = id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - 16;
  scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  goHomeSoon();
}

// ----------------------------------------------------------------- events
addEventListener('hashchange', () => {
  const h = location.hash;
  if (h && !h.startsWith('#/')) return;
  go(parse(h));
});

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-scroll], [data-cv]');
  if (!a) return;
  e.preventDefault();
  if (a.hasAttribute('data-cv')) { window.print(); return; }
  const id = a.dataset.scroll;
  if (current.route.name !== 'home') { pendingScroll = id; location.hash = '#/'; return; }
  scrollToId(id);
});

// ----------------------------------------------------------------- boot
(async function boot() {
  const route = parse(location.hash);
  render(route, route.name === 'home' ? homeHTML() : projectHTML(bySlug[route.slug]));

  const params = new URLSearchParams(location.search);
  const seen = sessionStorage.getItem('sm-intro') === '1' && !params.has('intro');

  if (seen) {
    document.body.classList.remove('is-intro');
    homePrinted = true;
    printAll(view);
    homeArt && homeArt.layers.forEach((L) => { L.alpha = 1; });
    me.ink = 1;
    hit.classList.add('is-live');
    arrive(route);
    return;
  }

  const intro = await runIntro({ reduced });
  sessionStorage.setItem('sm-intro', '1');
  document.body.classList.remove('is-intro', 'is-breaking');
  hit.classList.add('is-live');
  if (document.fonts) await document.fonts.ready;

  if (route.name === 'home') {
    await landingShow(intro, homeArt);
    homePrinted = true;
  } else {
    me.ink = 1;
    arrive(route);
  }
})();
