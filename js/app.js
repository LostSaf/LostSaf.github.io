// Boot, routes, the elevator, and the page change.
//
// Routes are hashes (#/<floor>/<project>) so the site runs from any static
// host. Changing page is a paint roller: the next page is laid out in a fixed
// layer, little Me pushes the roller across, and the real page is swapped in
// behind it at the same scroll position.

import { runIntro } from './intro.js';
import { homeHTML, projectHTML, cvHTML, panelHTML, bySlug, esc } from './pages.js';
import { floors, fashion } from './data.js';
import { landingShow, watchFloors, stopWatching, buildAll, carAnchor, mountLift, goToThing } from './director.js';
import { me, show, hop, say, tween, setRoller, interrupt, reduced, SCALE, ease } from './stage.js';
import { setOutfit, outfit, compose, onOutfit } from './sprite.js';
import { sfx, unlockSound, sound } from './sfx.js';

const view = document.getElementById('view');
const next = document.getElementById('next');
const hit = document.getElementById('me-hit');
const panel = document.getElementById('panel');

let current = { route: null, cleanup: null };
let built = false;
let homeScroll = 0;
let transitioning = false;
let queued = null;
let pendingScroll = null;

document.getElementById('cv').innerHTML = cvHTML();
panel.innerHTML = panelHTML();

function parse(hash) {
  const m = (hash || '').match(/^#\/[a-z]+\/([\w-]+)/);
  if (m && bySlug[m[1]]) return { name: 'project', slug: m[1] };
  return { name: 'home' };
}
const same = (a, b) => a && b && a.name === b.name && a.slug === b.slug;
const ACCENT = { studio: '#1d6b58', lab: '#6a3df0', arcade: '#ff4fa3', study: '#2a6436', gifts: '#d23b5a', atelier: '#681a2b', workshop: '#ff7a1a', mailroom: '#27443a' };

// ----------------------------------------------------------------- the building
function mountHome(root) {
  const offs = [];

  // videos on screens play only while you can see them
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.2 });
  root.querySelectorAll('video[data-src]').forEach((v) => vio.observe(v));
  offs.push(() => vio.disconnect());

  // the elevator: the panel shows the floor you are looking at, and the car
  // follows it, unless little Me is out on a floor and has it waiting for him
  offs.push(mountLift(root, setPanel));

  // workshop tags light up everything that used them
  const tape = root.querySelector('.tape');
  const building = root.querySelector('.building');
  root.querySelectorAll('.tag').forEach((btn) => btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    root.querySelectorAll('.tag').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    root.querySelectorAll('[data-slug]').forEach((o) => o.classList.remove('is-lit'));
    building.classList.toggle('is-filtering', on);
    sfx.blip();
    if (!on) { tape.textContent = ''; return; }
    btn.setAttribute('aria-pressed', 'true');
    const used = btn.dataset.used.split(' ');
    used.forEach((s) => root.querySelectorAll(`[data-slug="${s}"]`).forEach((o) => o.classList.add('is-lit')));
    tape.innerHTML = `<span class="lbl">${esc(btn.firstChild.textContent)}</span> used in ` +
      used.map((s) => `<a href="#/${bySlug[s].floor}/${s}">${esc(bySlug[s].title)}</a>`).join(' ');
  }));

  // the cats wake up when you poke them
  const cats = root.querySelector('.desk__cats');
  cats.addEventListener('click', () => {
    const awake = cats.classList.toggle('is-awake');
    sfx.blip();
    if (awake && me.visible) say('mrrp?', 1.2);
    clearTimeout(cats._t);
    if (awake) cats._t = setTimeout(() => cats.classList.remove('is-awake'), 4000);
  });

  // fitting room
  const mirror = root.querySelector('[data-mirror]');
  const mctx = mirror.getContext('2d');
  let raf = 0, last = 0, blinkAt = 0;
  const paint = (now) => {
    raf = requestAnimationFrame(paint);
    if (now - last < 100) return;
    last = now;
    if (now > blinkAt + 140) blinkAt = now + 1600 + Math.random() * 3000;
    const st = compose({ pose: 'idle', step: 0, blink: now > blinkAt, look: -0.1, aim: 0.55, fire: false, flame: false, ink: 1, breathe: Math.floor(now / 650) % 2 === 0, t: now / 1000 });
    mctx.clearRect(0, 0, 36, 36);
    mctx.drawImage(st.canvas, 0, 0);
  };
  raf = requestAnimationFrame(paint);
  offs.push(() => cancelAnimationFrame(raf));
  const sync = () => root.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(outfit[b.dataset.part] === b.dataset.key)));
  sync();
  offs.push(onOutfit(sync));
  root.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => {
    setOutfit(b.dataset.part, b.dataset.key);
    sfx.blip();
    if (me.visible) say(['new fit!', 'very me', 'better?'][(Math.random() * 3) | 0], 1.1);
  }));

  // the shoots open in a lightbox
  root.querySelectorAll('[data-prod]').forEach((b) => b.addEventListener('click', () => openShoot(b.dataset.prod)));

  // day and night
  offs.push(mountDial(root.querySelector('.dial')));

  return () => offs.forEach((f) => f());
}

function setPanel(id) {
  panel.querySelectorAll('[data-go]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.go === id)));
  const f = floors.find((x) => x.id === id);
  panel.querySelector('.panel__screen').textContent = id === 'roof' ? 'R' : f ? f.no : '';
}

// A shoot opens as the whole roll: one photo at a time on a snapping track, the film strip under it.
// Photos load as you get near them, so a 30 photo shoot costs three photos to open.
let lb = null;
let shoot = null; // the open shoot: { go, step, at, opener, off }
function openShoot(slug) {
  const x = fashion.productions.find((p) => p.slug === slug);
  if (!x) return;
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-close]')) closeShoot(); });
    addEventListener('keydown', (e) => {
      if (!shoot) return;
      if (e.key === 'Escape') closeShoot();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); shoot.step(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); shoot.step(-1); }
      else if (e.key === 'Home') { e.preventDefault(); shoot.go(0); }
      else if (e.key === 'End') { e.preventDefault(); shoot.go(Infinity); }
    });
  }
  shoot?.off();
  const n = x.photos.length;
  const two = (i) => String(i).padStart(2, '0');
  lb.setAttribute('aria-label', `${x.title}, ${n} photos`);
  lb.innerHTML = `
    <div class="lb__stage">
      <div class="lb__track" aria-roledescription="carousel" aria-label="${esc(x.title)} photos">
        ${x.photos.map((ph, i) => `<figure class="lb__slide" aria-roledescription="slide" aria-label="${i + 1} of ${n}"><img data-src="media/fashion/${esc(ph)}" alt="${esc(x.title)}, photo ${i + 1} of ${n}" decoding="async"></figure>`).join('')}
      </div>
      <button class="lb__nav lb__nav--prev" type="button" data-step="-1" aria-label="Previous photo">&lt;</button>
      <button class="lb__nav lb__nav--next" type="button" data-step="1" aria-label="Next photo">&gt;</button>
    </div>
    <div class="lb__strip" role="group" aria-label="Every photo in ${esc(x.title)}">
      ${x.photos.map((ph, i) => `<button class="lb__thumb" type="button" data-i="${i}" aria-label="Photo ${i + 1}"><img src="media/fashion/thumbs/${esc(ph)}" alt="" loading="lazy"></button>`).join('')}
    </div>
    <div class="lb__text"><small>${esc(x.org)}</small><h3 style="--L:${Math.max(...x.title.split(' ').map((w) => w.length))}">${esc(x.title)}</h3>
      <p class="lb__count" aria-live="polite"><b>01</b> / ${two(n)}</p>
      <p>${esc(x.desc)}</p>
      <div class="lb__roles">${x.roles.map((r) => `<span>${esc(r)}</span>`).join('')}</div>
      <p style="margin-top:18px;font-size:14px">Wardrobe sourced and styled by me.${fashion.url ? ` <a href="${esc(fashion.url)}" target="_blank" rel="noopener">The full styling portfolio</a>.` : ''}</p>
      <p class="lb__hint">Scroll, swipe or use the arrow keys. Pick any frame on the strip.</p></div>
    <button class="key lb__close" type="button" data-close>Close</button>`;

  const track = lb.querySelector('.lb__track');
  const strip = lb.querySelector('.lb__strip');
  const imgs = [...track.querySelectorAll('img')];
  const thumbs = [...strip.querySelectorAll('.lb__thumb')];
  const count = lb.querySelector('.lb__count b');
  const [prev, next] = lb.querySelectorAll('.lb__nav');
  let at = -1;

  const load = (i) => { const im = imgs[i]; if (im && !im.src) im.src = im.dataset.src; };
  const show = (i) => {
    if (i === at) return;
    if (at >= 0) thumbs[at].setAttribute('aria-current', 'false');
    at = i;
    count.textContent = two(i + 1);
    prev.disabled = i === 0;
    next.disabled = i === n - 1;
    const t = thumbs[i];
    t.setAttribute('aria-current', 'true');
    const s = strip.getBoundingClientRect(), r = t.getBoundingClientRect();
    glide(strip.scrollLeft + r.left - s.left - (s.width - r.width) / 2);
  };
  // the strip eases itself along: Chrome drops one smooth scroll when another starts on the track
  let glideTo = 0, gliding = 0;
  const glide = (to) => {
    glideTo = Math.max(0, Math.min(strip.scrollWidth - strip.clientWidth, to));
    if (reduced) { strip.scrollLeft = glideTo; return; }
    if (gliding) return;
    const tick = () => {
      const d = glideTo - strip.scrollLeft;
      if (Math.abs(d) < 1 || !shoot) { strip.scrollLeft = glideTo; gliding = 0; return; }
      strip.scrollLeft += d * 0.2;
      gliding = requestAnimationFrame(tick);
    };
    gliding = requestAnimationFrame(tick);
  };
  // photos load around where the track comes to rest, so a long jump skips everything it flies past
  const near = (i) => { for (let k = i - 1; k <= i + 2; k++) load(k); };
  const go = (i, smooth = !reduced) => {
    i = Math.max(0, Math.min(n - 1, i));
    near(i);
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    show(i);
  };
  // where the track is decides the photo, so swipes and trackpads count too
  let rest = 0;
  const onScroll = () => {
    show(Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))));
    clearTimeout(rest);
    rest = setTimeout(() => near(at), 140);
  };
  track.addEventListener('scroll', onScroll, { passive: true });

  // a mouse wheel moves one photo per notch; sideways trackpad scrolling is left to the browser
  let acc = 0, lock = 0;
  const wheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = performance.now();
    if (now < lock) return;
    acc += e.deltaY;
    if (Math.abs(acc) >= 40) { go(at + Math.sign(acc)); acc = 0; lock = now + 420; }
  };
  track.addEventListener('wheel', wheel, { passive: false });
  // the strip scrolls sideways under a plain wheel
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
  }, { passive: false });

  lb.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(at + Number(b.dataset.step))));
  thumbs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.i))));
  // keep the same photo in view when the window changes size
  const ro = new ResizeObserver(() => { if (at >= 0) track.scrollTo({ left: at * track.clientWidth }); });
  ro.observe(track);

  shoot = {
    go, step: (d) => go(at + d), opener: document.activeElement,
    off: () => { ro.disconnect(); track.removeEventListener('scroll', onScroll); },
  };
  lb.classList.add('is-open');
  document.documentElement.style.overflow = 'hidden';
  near(0);
  show(0);
  lb.querySelector('[data-close]').focus();
  sfx.blip();
}
function closeShoot() {
  if (!shoot) return;
  const back = shoot.opener;
  shoot.off();
  shoot = null;
  lb.classList.remove('is-open');
  document.documentElement.style.overflow = '';
  if (back && back.isConnected) back.focus({ preventScroll: true });
}

function mountDial(dial) {
  const orb = dial.querySelector('.dial__orb');
  const label = dial.querySelector('.dial__time');
  let manual = null;
  const setHour = (h) => {
    h = ((h % 24) + 24) % 24;
    // daylight from 7 to 19, dusk and dawn either side
    const night = h >= 8 && h <= 18 ? 0 : h >= 21 || h <= 5 ? 1 : h > 18 ? (h - 18) / 3 : (8 - h) / 3;
    document.documentElement.style.setProperty('--night', night.toFixed(2));
    dial.classList.toggle('is-night', night > 0.5);
    const a = Math.PI * (1 - ((h + 18) % 12) / 12);
    orb.style.left = `${50 + Math.cos(a) * 42}%`;
    orb.style.top = `${92 - Math.sin(a) * 80}%`;
    label.textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
    dial.setAttribute('aria-valuenow', Math.floor(h));
  };
  const now = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  setHour(now());
  const t = setInterval(() => { if (manual === null) setHour(now()); }, 60000);
  let dragging = false;
  const fromPointer = (e) => {
    const r = dial.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    manual = 6 + x * 18;
    setHour(manual);
  };
  dial.addEventListener('pointerdown', (e) => { dragging = true; dial.setPointerCapture(e.pointerId); fromPointer(e); });
  dial.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  dial.addEventListener('pointerup', () => { dragging = false; sfx.blip(); });
  dial.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { manual = (manual ?? now()) + 1; setHour(manual); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { manual = (manual ?? now()) - 1; setHour(manual); e.preventDefault(); }
  });
  return () => clearInterval(t);
}

// ----------------------------------------------------------------- project pages
function mountViewer(host, p) {
  const media = p.media;
  host.innerHTML = `
    <div class="viewer__stage"></div>
    <div class="viewer__cap"><b></b><span></span></div>
    ${media.length > 1 ? `<div class="strip" role="tablist" aria-label="Media">${media.map((m, i) => `<button type="button" role="tab" class="${m.tall ? 'is-tall' : ''}" aria-label="${esc(m.caption)}" style="background-image:url('${esc(m.poster || m.src)}')">${m.type === 'video' ? '<i></i>' : ''}</button>`).join('')}</div>` : ''}`;
  const stage = host.querySelector('.viewer__stage');
  const capB = host.querySelector('.viewer__cap b');
  const capS = host.querySelector('.viewer__cap span');
  const cap = host.querySelector('.viewer__cap');
  const buttons = [...host.querySelectorAll('.strip button')];
  let soundBtn = null;
  const showItem = (i) => {
    const m = media[i];
    stage.classList.toggle('is-tall', !!m.tall);
    stage.innerHTML = m.type === 'video'
      ? `<video src="${esc(m.src)}" poster="${esc(m.poster || '')}" autoplay muted loop playsinline></video>`
      : `<img src="${esc(m.src)}" alt="${esc(m.caption)}" style="${m.contain ? 'object-fit:contain;background:#fff' : ''}">`;
    capB.textContent = `${String(i + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`;
    capS.textContent = m.caption;
    soundBtn && soundBtn.remove();
    soundBtn = null;
    if (m.sound) {
      soundBtn = document.createElement('button');
      soundBtn.className = 'key'; soundBtn.type = 'button'; soundBtn.textContent = 'Sound on';
      soundBtn.addEventListener('click', () => {
        const v = stage.querySelector('video');
        v.muted = !v.muted;
        soundBtn.textContent = v.muted ? 'Sound on' : 'Sound off';
      });
      cap.appendChild(soundBtn);
    }
    buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => { showItem(i); sfx.blip(); }));
  showItem(0);
}

function mountProject(root, p) {
  const offs = [];
  const v = root.querySelector('[data-viewer]');
  if (v) mountViewer(v, p);
  root.querySelectorAll('[data-demo]').forEach((host) => {
    let cleanup = null, dead = false;
    import(`./demos/${host.dataset.demo}.js`).then((mod) => {
      if (dead) return;
      host.textContent = '';
      cleanup = mod.mount(host, p) || null;
    }).catch((err) => {
      console.error(err);
      host.innerHTML = '<div class="demo__loading">THE DEMO DID NOT LOAD</div>';
    });
    offs.push(() => { dead = true; cleanup && cleanup(); });
  });
  setPanel(p.floor);
  return () => offs.forEach((f) => f());
}

function render(route, html) {
  view.innerHTML = html;
  if (route.name === 'home') {
    if (built || reduced) buildAll(view);
    current = { route, cleanup: mountHome(view) };
  } else {
    buildAll(view);
    current = { route, cleanup: mountProject(view, bySlug[route.slug]) };
  }
  document.title = route.name === 'home' ? 'Safowan Mostaque' : `${bySlug[route.slug].title} · Safowan Mostaque`;
}

function paintStatic(page) {
  page.querySelectorAll('video[data-src]').forEach((v) => { v.removeAttribute('data-src'); });
}

// ----------------------------------------------------------------- the roller
function roll(dir, color, onX) {
  const W = innerWidth, H = innerHeight;
  const S = SCALE;
  const r = { x: dir > 0 ? -40 : W + 40, dir, color };
  const x0 = r.x, x1 = dir > 0 ? W + 40 + 26 * S : -40 - 26 * S;
  setRoller(r);
  interrupt();
  me.visible = true; me.bubble = null;
  me.moving++;
  sfx.whoosh();
  return tween(reduced ? 0 : 1.2, (t) => {
    r.x = x0 + (x1 - x0) * t;
    me.facing = dir;
    me.x = r.x - dir * 18 * S;
    me.y = H - 4;
    me.pose = 'walk';
    me.step = Math.floor(Math.abs(r.x) / (2 * S));
    me.aim = -0.15;
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
  if (current.route && current.route.name === 'home') { homeScroll = scrollY; built = true; }

  const html = route.name === 'home' ? homeHTML() : projectHTML(bySlug[route.slug]);
  const dir = route.name === 'home' ? -1 : 1;
  const color = route.name === 'home' ? '#ffcf3f' : ACCENT[bySlug[route.slug].floor];
  const target = route.name === 'home' && !pendingScroll ? homeScroll : 0;

  next.innerHTML = html;
  const page = next.firstElementChild;
  buildAll(page);
  paintStatic(page);
  page.style.transform = `translateY(${-target}px)`;
  next.style.clipPath = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
  next.classList.add('is-on');
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
    const frame = view.querySelector('.viewer, .demo-frame');
    if (frame) {
      const r = frame.getBoundingClientRect();
      if (r.top > 60 && r.top < innerHeight - 60) {
        await hop({ el: frame, ax: 0.04, ay: 0, dx: 4 * SCALE, dy: -2 }, { height: 140 });
        say(frame.classList.contains('viewer') ? 'the real thing' : 'try it!', 1.6);
        return;
      }
    }
    await hop({ home: true }, { dur: 0.6, height: 90 });
    return;
  }
  await hop(carAnchor(), { dur: 0.7, height: 120 });
  watchFloors(view);
}

function scrollToId(id) {
  const el = id === 'roof' ? document.body : document.getElementById(id);
  if (!el) return;
  const y = id === 'roof' ? 0 : el.getBoundingClientRect().top + scrollY - 8;
  scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}

// ----------------------------------------------------------------- events
addEventListener('hashchange', () => {
  const h = location.hash;
  if (h && !h.startsWith('#/')) return;
  go(parse(h));
});

document.addEventListener('click', (e) => {
  const cv = e.target.closest('[data-cv]');
  if (cv) { e.preventDefault(); sfx.blip(); window.print(); return; }

  const floorBtn = e.target.closest('[data-go]');
  if (floorBtn) {
    e.preventDefault();
    sfx.blip();
    const id = floorBtn.dataset.go;
    if (current.route.name !== 'home') { pendingScroll = id; location.hash = '#/'; return; }
    scrollToId(id);
    return;
  }

  const snd = e.target.closest('[data-sound]');
  if (snd) {
    sound.set(!sound.on);
    snd.setAttribute('aria-pressed', String(sound.on));
    sfx.blip();
    return;
  }

  // walking over to a project before opening it
  const obj = e.target.closest('#view a[href^="#/"][data-slug]');
  if (obj && current.route.name === 'home' && !me.moving && !reduced && me.visible) {
    e.preventDefault();
    sfx.blip();
    // aim at the thing itself, so the spot moves with it while he rides there
    goToThing(obj, { el: obj, ax: 0.5, ay: 1 })
      .then(() => { location.hash = obj.getAttribute('href'); });
  }
});

document.addEventListener('pointerdown', unlockSound, { once: true });
document.addEventListener('keydown', unlockSound, { once: true });

// ----------------------------------------------------------------- boot
(async function boot() {
  const route = parse(location.hash);
  render(route, route.name === 'home' ? homeHTML() : projectHTML(bySlug[route.slug]));
  panel.querySelector('[data-sound]').setAttribute('aria-pressed', String(sound.on));

  const params = new URLSearchParams(location.search);
  const seen = params.has('skip') || (sessionStorage.getItem('sm-intro') === '1' && !params.has('intro'));

  if (seen) {
    document.body.classList.remove('is-intro');
    built = true;
    buildAll(view);
    me.ink = 1;
    hit.classList.add('is-live');
    arrive(route);
    return;
  }

  const intro = await runIntro({ reduced, onBreak: () => { unlockSound(); sfx.shatter(); } });
  sessionStorage.setItem('sm-intro', '1');
  document.body.classList.remove('is-intro', 'is-breaking');
  hit.classList.add('is-live');
  if (document.fonts) await document.fonts.ready;

  if (route.name === 'home') {
    await landingShow(intro);
    built = true;
  } else {
    me.ink = 1;
    arrive(route);
  }
})();
