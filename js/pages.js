// Page markup, built from data.js. Anything with data-s="wait" is built in
// front of you by little Me.

import { site, floors, projects, earlier, archive, fashion, skills, bySlug } from './data.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const hrefOf = (p) => `#/${p.floor}/${p.alias || p.slug}`;
const onFloor = (id) => projects.filter((p) => p.floor === id);
const W = 'data-s="wait"';

// The two cats, drawn exactly as the Boba & Aloe add-on draws them.
const EYES = '<g class="eyes-closed"><path d="M85 53 Q91 58 97 53"/><path d="M103 53 Q109 58 115 53"/></g><g class="eyes-open"><ellipse class="iris" cx="91" cy="52" rx="5.6" ry="6.2"/><ellipse class="pupil" cx="91" cy="52" rx="1.6" ry="5"/><circle class="shine" cx="92.8" cy="49.5" r="1.1"/><ellipse class="iris" cx="109" cy="52" rx="5.6" ry="6.2"/><ellipse class="pupil" cx="109" cy="52" rx="1.6" ry="5"/><circle class="shine" cx="110.8" cy="49.5" r="1.1"/></g>';
const BOBA = '<g class="cat cat-boba"><path class="tail" d="M26 76 C 4 78, 2 52, 23 57"/><g class="body"><ellipse class="fur" cx="68" cy="66" rx="50" ry="21"/></g><g class="head"><g class="ear l"><polygon class="fur" points="79,40 82,17 96,33"/><polygon class="inner" points="83,36 84.5,25 91,33"/></g><g class="ear r"><polygon class="fur" points="104,33 118,17 121,40"/><polygon class="inner" points="109,33 115.5,25 117,36"/></g><ellipse class="fur" cx="100" cy="52" rx="23" ry="19"/>' + EYES + '<path class="nose" d="M97.5 58 h5 l-2.5 3z"/><g class="whiskers"><path d="M80 60 L68 58"/><path d="M80 63 L69 65"/><path d="M120 60 L132 58"/><path d="M120 63 L131 65"/></g></g></g>';
const ALOE = '<g class="cat cat-aloe" transform="translate(256 0) scale(-1 1)"><g class="tail"><path d="M32.7 83.4 L28.6 85.2 L24.6 84.9 L20.5 85.7 L17.0 84.2 L13.0 84.0 L10.3 81.4 L6.6 80.1 L5.0 76.7 L1.9 74.2 L1.7 70.4 L-0.5 66.9 L0.9 63.1 L0.2 59.0 L2.9 55.8 L3.8 51.6 L7.7 49.4 L10.1 45.6 L14.6 44.4 Q25.9 46.1 21.1 56.2 L17.4 59.1 L15.5 61.9 L14.7 64.5 L14.7 67.0 L15.5 69.6 L17.3 72.3 L20.4 74.8 L25.1 76.5 L31.4 76.8 Z"/><path class="streak" d="M22.6 80.3 Q15.2 77.6 11.7 74.6 T8.0 64.5 T12.4 54.8"/></g><g class="body"><ellipse class="fur" cx="68" cy="66" rx="50" ry="21"/><path class="patch" d="M19.7 60.6 A50 21 0 0 1 55.1 45.7 C55 53 46 62 34 63 C28 63.5 23 62.5 19.7 60.6 Z"/><g class="paws"><ellipse class="fur" cx="90" cy="84.5" rx="6.8" ry="3.9"/><ellipse class="fur" cx="105" cy="84.5" rx="6.8" ry="3.9"/><path class="toes" d="M88 86.4 v-2 M92 86.4 v-2 M103 86.4 v-2 M107 86.4 v-2"/></g></g><g class="head"><g class="ear l"><polygon class="fur" points="79,40 82,17 96,33"/><polygon class="inner" points="83,36 84.5,25 91,33"/></g><g class="ear r"><polygon class="fur" points="104,33 118,17 121,40"/><polygon class="inner" points="109,33 115.5,25 117,36"/></g><g class="fur"><path d="M80 57 L71.5 62.5 L78 63.5 L74 68.5 L82 67.5 L89 68 Z"/><path d="M120 57 L128.5 62.5 L122 63.5 L126 68.5 L118 67.5 L111 68 Z"/><ellipse cx="100" cy="52" rx="23" ry="19"/></g><g class="fur-fill"><path d="M80 57 L71.5 62.5 L78 63.5 L74 68.5 L82 67.5 L89 68 Z"/><path d="M120 57 L128.5 62.5 L122 63.5 L126 68.5 L118 67.5 L111 68 Z"/><ellipse cx="100" cy="52" rx="23" ry="19"/></g><path class="mask" d="M97.6 33.1 A23 19 0 0 0 77.29 55 C80.5 58.5 86.5 60 91.5 59.2 C95 58.4 96.7 55.5 96.8 52 L97.6 33.1 Z"/><path class="mask" d="M102.4 33.1 A23 19 0 0 1 122.71 55 C119.5 58.5 113.5 60 108.5 59.2 C105 58.4 103.3 55.5 103.2 52 L102.4 33.1 Z"/>' + EYES + '<path class="nose" d="M97.5 58 h5 l-2.5 3z"/><path class="mouth" d="M100 61 v1.6 M100 62.6 q-1.8 1.8 -3.6 0.4 M100 62.6 q1.8 1.8 3.6 0.4"/><g class="whiskers"><path d="M80 60 L66 57"/><path d="M80 63 L67 65.5"/><path d="M120 60 L134 57"/><path d="M120 63 L133 65.5"/></g></g></g>';
export const CATS_SVG = `<svg viewBox="0 0 256 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Boba and Aloe, asleep">${BOBA}${ALOE}<g class="zzz"><text x="117" y="36" style="font-size:8px">z</text><text x="123" y="26" style="font-size:10px">z</text><text x="129" y="16" style="font-size:12px">Z</text></g></svg>`;

const ICONS = {
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  doc: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8"/>',
  term: '<rect x="2" y="4" width="20" height="16"/><path d="M6 9l4 3-4 3M12 16h6"/>',
  cam: '<rect x="2" y="7" width="15" height="12"/><path d="M17 11l5-3v10l-5-3"/>',
  wave: '<path d="M2 12h3l2-6 3 12 3-9 2 6 2-3h5"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">${ICONS[n] || ICONS.term}</svg>`;

// ---------------------------------------------------------------- the roof
function roof() {
  const [first, last] = site.name;
  return `
  <header class="roof" id="roof">
    <div class="sign" ${W} data-build="sign">
      <div class="sign__board">
        <span class="sign__bulbs" aria-hidden="true"></span>
        <h1 class="sign__name" id="name"><span>${esc(first)}</span><span>${esc(last)}</span></h1>
        <p class="sign__role">${esc(site.role)} &nbsp;+&nbsp; stylist &nbsp;+&nbsp; ${esc(site.where)}</p>
      </div>
      <div class="sign__legs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="deck">
      <div class="notice" ${W}>
        <p class="notice__pitch">${esc(site.pitch)}</p>
        <div class="notice__links">
          <a class="key is-dark" href="mailto:${esc(site.email)}">Email me</a>
          ${site.links.map((l) => `<a class="key" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
          <button class="key" type="button" data-cv>Print CV</button>
        </div>
        <p class="notice__now">${esc(site.now)}</p>
      </div>
      <div class="tank" ${W} aria-hidden="false">
        <div class="tank__body"><div class="dial" role="slider" tabindex="0" aria-label="Time of day in the building" aria-valuemin="0" aria-valuemax="24" aria-valuenow="12"><i class="dial__arc"></i><i class="dial__orb"></i><span class="dial__time">12:00</span></div></div>
        <div class="tank__legs"></div>
      </div>
    </div>
  </header>`;
}

// ---------------------------------------------------------------- rooms
function placard(p) {
  return `<span class="placard"><b>${esc(p.title)}</b><span>${esc(p.short)}</span></span>`;
}

const ROOMS = {
  studio: () => onFloor('studio').map((p) => `
    <a class="obj monitor" href="${hrefOf(p)}" data-slug="${p.slug}" ${W}>
      <span class="monitor__body"><span class="monitor__screen">${p.screenVideo
        ? `<video data-src="${esc(p.screenVideo)}" poster="${esc(p.screen)}" muted loop playsinline preload="none"></video>`
        : `<img src="${esc(p.screen)}" alt="" loading="lazy">`}</span><i class="monitor__led"></i></span>
      <span class="monitor__neck"></span><span class="monitor__desk"></span>
      ${placard(p)}
    </a>`).join(''),

  lab: () => `<div class="bench">${onFloor('lab').map((p) => `
    <a class="obj app" href="${hrefOf(p)}" data-slug="${p.slug}" ${W}>
      <span class="app__bar"><i></i><i></i><i></i><em>${esc(p.year)}</em></span>
      <span class="app__body"><span class="app__icon">${icon(p.icon)}</span><b>${esc(p.title)}</b><span>${esc(p.short)}</span></span>
    </a>`).join('')}</div>`,

  arcade: () => onFloor('arcade').map((p) => `
    <a class="obj cab" href="${hrefOf(p)}" data-slug="${p.slug}" style="--marquee:${p.cabinet.marquee};--side:${p.cabinet.side}" ${W}>
      <span class="cab__art">
        <span class="cab__marquee">${esc(p.marquee || p.title)}</span>
        <span class="cab__face">
          <span class="cab__screen">${p.screenVideo
            ? `<video data-src="${esc(p.screenVideo)}" poster="${esc(p.screen)}" muted loop playsinline preload="none"></video>`
            : p.screen ? `<img src="${esc(p.screen)}" alt="" loading="lazy">`
            : `<span class="cab__title"><b>Monsters</b><small>in the</small><b>Office</b></span>`}</span>
          <span class="cab__deck"><i class="stick"></i><i class="btn"></i><i class="btn b"></i></span>
          <span class="cab__base"><i></i></span>
        </span>
      </span>
      ${placard(p)}
    </a>`).join('') + earlier.map((e) => `
    <div class="obj cab is-broken" ${W} style="--marquee:#c9c9c9;--side:#4a4753">
      <span class="cab__art"><span class="cab__marquee">${esc(e.title)}</span>
        <span class="cab__face"><span class="cab__screen"><b>Out of order</b></span><span class="cab__deck"><i class="stick"></i><i class="btn"></i></span><span class="cab__base"><i></i></span></span></span>
      <span class="placard"><b>Earlier: ${esc(e.title)}</b><span>${esc(e.text)}</span></span>
    </div>`).join(''),

  study: () => `
    <div class="cork" ${W}>
      ${onFloor('study').map((p) => `
      <a class="icard" href="${hrefOf(p)}" data-slug="${p.slug}">
        <small>${p.card === 'tool' ? 'ADD-ON' : p.card === 'dental' ? 'DENTAL TRAINER' : `STUDY CAT ${esc(p.card.toUpperCase())}`} &nbsp;/&nbsp; ${esc(p.year)}</small>
        <b>${esc(p.title)}</b><span>${esc(p.short)}</span>
      </a>`).join('')}
    </div>
    <div class="desk" ${W}>
      <span class="desk__note">wake us?</span>
      <button class="desk__cats" type="button" aria-label="Boba and Aloe. Click to wake them.">${CATS_SVG}</button>
      <span class="desk__lamp lampglow" aria-hidden="true"></span>
      <span class="desk__top"></span><span class="desk__legs"></span>
    </div>`,

  gifts: () => `<div class="lights" aria-hidden="true"></div>` + onFloor('gifts').map((p) => `
    <a class="obj env" href="${hrefOf(p)}" data-slug="${p.alias || p.slug}" style="--seal:${p.seal}" ${W}>
      <span class="env__paper"><b>${esc(p.title)}</b><span>${esc(p.short)}</span></span>
      <span class="env__front" aria-hidden="true"></span>
      <i class="env__seal" aria-hidden="true">&#9829;</i>
    </a>`).join(''),

  atelier: () => `
    <div class="gallery">
      ${fashion.productions.map((x) => `
      <button class="frame" type="button" data-prod="${x.slug}" ${W}>
        <span class="frame__gilt"><img src="media/fashion/${esc(x.photos[0])}" alt="${esc(x.title)}, ${esc(x.org)}" loading="lazy"></span>
        <span class="frame__plate"><b>${esc(x.title)}</b><span>${esc(x.org)}</span></span>
      </button>`).join('')}
    </div>
    <div class="rail" ${W}>
      <div class="atelier__stats">${fashion.stats.map(([n, t]) => `<span><b>${esc(n)}</b>${esc(t)}</span>`).join('')}</div>
      <div class="callsheet"><b>Also on the call sheet</b><ul>${fashion.more.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        <p style="margin:8px 0 0">Credits with ${fashion.credits.map(esc).join(', ')}.</p></div>
      <div class="fitting"><b>Fitting room</b>
      <div class="mirror" title="Fitting room"><canvas data-mirror width="36" height="36" aria-label="Little Me, wearing the outfit you pick"></canvas></div>
      <div class="swatches" role="group" aria-label="Dress little Me">
        ${[['top', 'blue', '#2b44e0'], ['top', 'pink', '#ff4d9a'], ['top', 'yolk', '#ffc414'], ['top', 'moss', '#3a9d4f'], ['top', 'varsity', '#24202c'], ['top', 'knit', '#efe7d4'],
          ['hat', 'cap', '#ff5b2e'], ['hat', 'beanie', '#8e5bd6'], ['hat', 'none', '#fdfdf9'], ['eyes', 'shades', '#1d1922'], ['eyes', 'none', '#cfd8de']]
          .map(([part, key, c]) => `<button class="swatch" type="button" data-part="${part}" data-key="${key}" aria-pressed="false" style="--c:${c}" aria-label="${part} ${key}" title="${part}: ${key}"></button>`).join('')}
      </div></div>
    </div>`,

  workshop: () => `
    <div class="board" ${W}>
      ${skills.map((g) => `<div><h3>${esc(g.group)}</h3><ul>${g.items.map(([name, used]) => `<li><button class="tag" type="button" aria-pressed="false" data-used="${used.join(' ')}">${esc(name)}<small>${used.length}</small></button></li>`).join('')}</ul></div>`).join('')}
    </div>
    <p class="tape" aria-live="polite"></p>`,

  mailroom: () => `
    <h2 class="hello" ${W}>Say hello</h2>
    <div class="boxes" ${W}>
      <a class="pobox" href="mailto:${esc(site.email)}"><small>EMAIL</small><b>${esc(site.email)}</b></a>
      ${site.links.map((l) => `<a class="pobox" href="${esc(l.href)}" target="_blank" rel="noopener"><small>${esc(l.label.toUpperCase())}</small><b>${esc(l.href.replace(/^https?:\/\//, ''))}</b></a>`).join('')}
    </div>
    <button class="printer" type="button" data-cv ${W}><span class="printer__paper"></span><span class="printer__body">PRINT CV</span></button>
    <div class="shelf" ${W}><b>On the shelf</b>${archive.map((a) => `<a href="${esc(a.href)}" target="_blank" rel="noopener"><span>${esc(a.title)}</span><small>${esc(a.year)}. ${esc(a.text)}</small></a>`).join('')}</div>`,
};

function floorHTML(f) {
  return `
  <section class="floor" id="${f.id}" data-floor="${f.id}" aria-labelledby="h-${f.id}">
    <div class="floor__head" ${W}><span class="floor__no" aria-hidden="true">${esc(f.no)}</span><h2 class="floor__name" id="h-${f.id}">${esc(f.name)}</h2><p class="floor__blurb">${esc(f.blurb)}</p></div>
    <div class="room room--${f.id}">${ROOMS[f.id](f)}</div>
    <div class="floor__ground" aria-hidden="true"></div>
    <div class="floor__door" aria-hidden="true"></div>
  </section>`;
}

export function homeHTML() {
  return `
<div class="page page--home">
  <div class="building">
    ${roof()}
    <div class="tower" ${W}>
      <div class="shaft" aria-hidden="true"></div>
      <div class="car" aria-hidden="true"><i class="car__cable"></i><span class="car__lamp">R</span><span class="car__box"></span></div>
      ${floors.map(floorHTML).join('')}
    </div>
  </div>
  <div class="street" aria-hidden="true" ${W}></div>
  <footer class="cornerstone" ${W}>
    <div class="cornerstone__stone">LAID<br>${new Date().getFullYear()}</div>
    <ol>
      <li><b>The black screen</b> is the wave equation stepped every frame and shaded in WebGL2 as lacquer, with a glint that follows your cursor.</li>
      <li><b>The shatter</b> freezes that frame into a texture and breaks it into a quadtree of instanced shards, smaller the closer they were to your click.</li>
      <li><b>Little Me</b> is typed out pixel by pixel. His arm is a Bresenham line and his printer is rotated in pixel space, so he can aim anywhere.</li>
      <li><b>The demos are the real thing</b> where they can be: game systems ported line for line from the Luau, add-ons running their own code, real footage and real ads.</li>
      <li><b>No framework, no build step.</b> Plain modules, one canvas for him, one for the intro, and a synthesiser for the sounds. View the source.</li>
    </ol>
  </footer>
</div>`;
}

// ---------------------------------------------------------------- projects
export function projectHTML(p) {
  const floor = floors.find((f) => f.id === p.floor);
  const list = projects.filter((x) => !x.alias);
  const i = list.indexOf(p);
  const next = list[(i + 1) % list.length];
  const nextFloor = floors.find((f) => f.id === next.floor);
  return `
<div class="page page--project" data-floor="${p.floor}">
  <div class="ptop" data-floor="${p.floor}">
    <a class="key" href="#/" data-back>&lt; Building</a>
    <span class="ptop__where"><i>${esc(floor.no)}</i>${esc(floor.name)}</span>
    <span class="ptop__links">${p.live ? `<a class="key is-dark" href="${esc(p.live)}" target="_blank" rel="noopener">${esc(p.liveLabel || 'Visit the live site')}</a>` : ''}</span>
  </div>
  <header class="phero" data-floor="${p.floor}">
    <div class="phero__in">
      <h1 class="ptitle${p.title.length > 34 ? ' is-xlong' : ''}" style="--L:${Math.max(6, ...p.title.split(/\s+/).map((w) => w.length))}">${esc(p.title)}</h1>
      <div>
        <p class="pmeta">${esc(p.year)} &nbsp;/&nbsp; ${esc(p.role)}</p>
        <p class="plede">${esc(p.lede)}</p>
        <div class="pchips">${p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>
    ${p.numbers.length ? `<div class="pnumbers">${p.numbers.map(([n, t]) => `<div class="counter"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('')}</div>` : ''}
  </header>

  <div class="pbody" data-floor="${p.floor}">
    ${p.media.length ? `
    <section class="psec">
      <div class="psec__head"><h2>${p.floor === 'arcade' && p.media.some((m) => m.type === 'video') ? 'Real footage' : 'The real thing'}</h2></div>
      <div class="viewer" data-viewer="${p.slug}"></div>
    </section>` : ''}

    ${p.demos.map((d) => `
    <section class="psec">
      <div class="psec__head"><h2>${esc(d.title)}</h2><p>${esc(d.note)}</p></div>
      <div class="demo-frame"><div class="demo" data-demo="${d.id}" tabindex="0"><div class="demo__loading">LOADING</div></div></div>
    </section>`).join('')}

    ${p.shop ? `
    <section class="psec">
      <div class="psec__head"><h2>The shop</h2><p>Game passes and developer products, written and priced for launch.</p></div>
      <div class="shop">${p.shop.map((s) => `<div class="shop__item"><img src="${esc(s.img)}" alt="" loading="lazy"><b>${esc(s.name)}</b><small>${esc(s.price)}</small><span>${esc(s.text)}</span></div>`).join('')}</div>
    </section>` : ''}

    <section class="psec pnotes">
      <div>
        <div class="psec__head"><h2>${esc(p.builtTitle || 'What I built')}</h2></div>
        <ol class="built">${p.built.map((b) => `<li><span>${esc(b)}</span></li>`).join('')}</ol>
        ${p.credit ? `<p class="credit">${esc(p.credit)}</p>` : ''}
      </div>
      ${p.hard.length ? `<div>
        <div class="psec__head"><h2>Bugs I beat</h2></div>
        <div class="tickets">${p.hard.map(([h, t], k) => `<article class="ticket"><small>TICKET ${String(k + 1).padStart(3, '0')}</small><h3>${esc(h)}</h3><p>${esc(t)}</p></article>`).join('')}</div>
      </div>` : '<div></div>'}
    </section>
  </div>

  <a class="pnext" href="${hrefOf(next)}" data-floor="${next.floor}">
    <span><small>Next: floor ${esc(nextFloor.no)}, ${esc(nextFloor.name)}</small><strong>${esc(next.title)}</strong></span>
    <span class="arrow" aria-hidden="true">&gt;</span>
  </a>
</div>`;
}

export function cvHTML() {
  const list = projects.filter((p) => !p.alias);
  return `
  <header><h1>${esc(site.name.join(' '))}</h1><p>${esc(site.role)}, ${esc(site.where)}</p>
  <p class="cv-links">${[site.email, ...site.links.map((l) => l.href.replace(/^https?:\/\//, ''))].map(esc).join('  ·  ')}</p></header>
  <p class="cv-lede">${esc(site.pitch)}</p>
  <h2>Projects</h2>
  ${list.map((p) => `<div class="cv-p"><h3>${esc(p.title)} <span>${esc(p.year)}. ${esc(p.tags.slice(0, 4).join(', '))}</span></h3><p>${esc(p.short)}</p></div>`).join('')}
  <h2>Fashion</h2><p>Creative direction and styling across ${fashion.productions.length + fashion.more.length} productions with ${fashion.credits.map(esc).join(', ')}.</p>
  <h2>Skills</h2>
  <div class="cv-skills">${skills.map((g) => `<p><b>${esc(g.group)}:</b> ${g.items.map(([n]) => esc(n)).join(', ')}</p>`).join('')}</div>
  <p class="cv-foot">The full version of this CV is a building you can walk around. It prints itself.</p>`;
}

export function panelHTML() {
  return `<span class="panel__screen" aria-hidden="true">R</span>
    <button type="button" data-go="roof" aria-label="Roof"><span>Roof</span>R</button>
    ${floors.map((f) => `<button type="button" data-go="${f.id}" aria-label="Floor ${esc(f.no)}, ${esc(f.name)}"><span>${esc(f.name)}</span>${esc(f.no)}</button>`).join('')}
    <button type="button" class="panel__small" data-sound aria-pressed="true" aria-label="Sound">SND</button>`;
}

export { bySlug };
