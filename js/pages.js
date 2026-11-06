// Page markup, built from data.js. Anything with class "pr" waits to be printed.

import { site, facts, work, games, earlier, skills, fashion, bySlug } from './data.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ink = (p) => `--ink-a: var(--${p.ink[0]}); --ink-b: var(--${p.ink[1]});`;

const arrowLeft = '<svg viewBox="0 0 14 10" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M4 0h2v2H4zM2 2h2v2H2zM0 4h14v2H0zM2 6h2v2H2zM4 8h2v2H4z"/></svg>';

function topBar(home) {
  return `
  <header class="top pr" data-s="wait" data-print="nav">
    <a class="top__mark" href="#/" ${home ? 'data-scroll="top"' : ''} aria-label="Safowan Mostaque, front page"><i></i>S.M.</a>
    <nav aria-label="Sections">
      <a href="#/" data-scroll="work">Work</a>
      <a href="#/" data-scroll="games">Games</a>
      <a href="#/" data-scroll="skills">Skills</a>
      <a href="#/" data-scroll="wardrobe">Fashion</a>
      <a href="#/" data-scroll="contact">Contact</a>
      <button class="cvbtn" type="button" data-cv>Print CV</button>
    </nav>
  </header>`;
}

function card(p, size = '') {
  return `
  <a class="card pr ${size}" data-s="wait" href="#/${p.kind === 'game' ? 'games' : 'work'}/${p.slug}" data-slug="${p.slug}" style="${ink(p)}">
    <div class="card__cover"><canvas data-cover="${p.slug}" aria-hidden="true"></canvas><span class="card__tag">${p.kind === 'game' ? 'GAME' : 'BUILD'} / ${esc(p.year)}</span></div>
    <div class="card__body">
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__short">${esc(p.short)}</p>
      <div class="card__meta">${p.tags.slice(0, 4).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
    </div>
    <span class="card__go" aria-hidden="true">OPEN &gt;</span>
  </a>`;
}

function head(n, title, sub) {
  return `
  <div class="sec__head pr" data-s="wait">
    <span class="sec__no" data-n="${n}" aria-hidden="true">${n}</span>
    <h2 class="sec__title">${title}</h2>
    ${sub ? `<p class="sec__sub">${sub}</p>` : ''}
  </div>`;
}

export function homeHTML() {
  const lede = esc(site.lede).replace('the whole thing', '<em>the whole thing</em>');
  const tops = [['blue', '#2b44e0'], ['pink', '#ff4d9a'], ['yolk', '#ffc414'], ['moss', '#3a9d4f'], ['varsity', '#24202c'], ['knit', '#efe7d4']];
  return `
<div class="page page--home">
  <section class="hero wrap" id="top">
    ${topBar(true)}
    <p class="kicker hero__kicker pr" data-s="wait">Portfolio <b>No. 01</b> &nbsp;/&nbsp; ${new Date().getFullYear()} &nbsp;/&nbsp; printed live in your browser by a very small me</p>
    <h1 class="hero__name pr" data-s="wait" id="name" aria-label="${esc(site.name.join(' '))}"><span class="l1" aria-hidden="true">${esc(site.name[0])}</span><span class="l2" aria-hidden="true" data-text="${esc(site.name[1])}">${esc(site.name[1])}</span></h1>
    <div class="hero__art" aria-hidden="true"><canvas></canvas></div>
    <p class="hero__lede pr" data-s="wait">${lede}</p>
    <ul class="hero__facts pr" data-s="wait">
      ${facts.map((f) => `<li><b>${esc(f.n)}</b><span>${esc(f.t)}</span></li>`).join('')}
    </ul>
    <p class="hero__now pr" data-s="wait">${esc(site.now)}</p>
  </section>

  <section class="sec wrap" id="about" style="--ink-a: var(--yolk); --ink-b: var(--pink)">
    ${head('01', 'The short <em>version</em>')}
    <div class="about">
      <p class="about__big pr" data-s="wait">I like projects where the code ends up as something you can <mark>hold, play, or hang on a wall</mark>.</p>
      <div class="about__body pr" data-s="wait">
        <p>A name turned into real stars, printed by a lab and posted to someone's door. A seafood restaurant game where every fish bends its own spine. An Anki add-on, because the pictures on my flashcards were too small to study from.</p>
        <p>I work across the stack: <strong>WebGL and canvas</strong> at the front, <strong>Node, Stripe and a print lab's API</strong> at the back, <strong>Luau and Rojo</strong> for games, and <strong>Python</strong> whenever something should be automated. I write things down, I test what I ship, and I care how it looks.</p>
      </div>
    </div>
  </section>

  <section class="sec wrap" id="work" style="--ink-a: var(--blue); --ink-b: var(--pink)">
    ${head('02', 'Things that <em>ship</em>', 'Websites, tools, and the machinery behind them. Each one opens into its own page with something you can play with.')}
    <div class="cards" data-grid>
      ${work.map((p, i) => card(p, i === 0 ? 'is-feature' : i === 1 ? '' : 'is-wide')).join('')}
    </div>
  </section>

  <section class="sec wrap" id="games" style="--ink-a: var(--teal); --ink-b: var(--tomato)">
    ${head('03', 'Things you <em>play</em>', 'Roblox games written in Luau, kept in Git and synced into Studio with Rojo.')}
    <div class="cards" data-grid>
      ${games.map((p, i) => card(p, i === 0 ? 'is-feature' : i === 2 ? 'is-wide' : '')).join('')}
      <div class="card-note pr" data-s="wait">
        <b class="pixel">EARLIER</b>
        ${earlier.map((e) => `<p><strong>${esc(e.title)}</strong>. ${esc(e.text)}</p>`).join('')}
        <p>Most of my game code lives in private repos. Ask me and I will walk you through it.</p>
      </div>
    </div>
  </section>

  <section class="sec wrap" id="skills" style="--ink-a: var(--violet); --ink-b: var(--yolk)">
    ${head('04', 'The <em>loadout</em>', 'Every skill points at where I used it. Pick one and the projects light up.')}
    <div class="loadout">
      ${skills.map((g) => `
      <div class="loadout__group pr" data-s="wait">
        <h3>${esc(g.group)}</h3>
        <ul>${g.items.map(([name, used]) => `<li><button class="skill" type="button" aria-pressed="false" data-used="${used.join(' ')}">${esc(name)}<small>${used.length}</small></button></li>`).join('')}</ul>
      </div>`).join('')}
    </div>
    <p class="proof" aria-live="polite"></p>
  </section>

  <section class="sec wrap" id="wardrobe" style="--ink-a: var(--pink); --ink-b: var(--yolk)">
    ${head('05', 'The <em>wardrobe</em>', esc(fashion.blurb))}
    <div class="wardrobe">
      <div class="wardrobe__mirror pr" data-s="wait"><span class="wardrobe__label">FITTING ROOM</span><canvas data-mirror width="36" height="36" aria-label="Little Me, wearing the outfit you pick"></canvas></div>
      <div class="racks pr" data-s="wait">
        ${rack('Top', 'top', tops.map(([k, c]) => [k, c]))}
        ${rack('Hat', 'hat', [['none', '#fbfaf6'], ['cap', '#ff5b2e'], ['beanie', '#8e5bd6']])}
        ${rack('Glasses', 'eyes', [['none', '#fbfaf6'], ['shades', '#1d1922']])}
        ${rack('Shoes', 'shoes', [['cream', '#fbfaf6'], ['black', '#2b2833'], ['tomato', '#ff5b2e']])}
        <p class="wardrobe__note">Whatever you pick, the little me walking around the page wears it too.</p>
      </div>
    </div>
    ${fashion.looks.length ? `<div class="lookbook">${fashion.looks.map((l) => `<figure class="pr" data-s="wait"><img src="${esc(l.src)}" alt="${esc(l.caption)}" loading="lazy"><figcaption>${esc(l.caption)}</figcaption></figure>`).join('')}</div>` : ''}
  </section>

  <section class="sec wrap contact" id="contact" style="--ink-a: var(--tomato); --ink-b: var(--blue)">
    ${head('06', 'Say <em>hello</em>')}
    <p class="contact__big pr" data-s="wait">Let's make <em>something</em>.</p>
    <div class="contact__row pr" data-s="wait">
      ${site.email ? `<a class="btn is-solid" href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ''}
      ${site.links.map((l) => `<a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} &#8599;</a>`).join('')}
      <button class="btn" type="button" data-cv>Print my CV</button>
    </div>
    <p class="contact__print pr" data-s="wait">Or press <kbd>Ctrl</kbd> + <kbd>P</kbd> anywhere. This site prints itself as a one page CV.</p>
  </section>

  <footer class="colophon" id="colophon">
    <div class="wrap">
      <h2>HOW THIS PAGE WORKS</h2>
      <ol>
        <li><b>The black screen</b> is the wave equation, stepped on the CPU every frame and shaded in WebGL2 as lacquer: normals from the height field, mirrored studio lights, a glint that follows your cursor.</li>
        <li><b>The shatter</b> freezes that frame into a texture and breaks it into a quadtree of instanced shards, smaller the closer they were to your click, tumbling toward you in perspective.</li>
        <li><b>Little Me</b> is typed out pixel by pixel. The arm is a Bresenham line and the printer is rotated in pixel space, so he can aim anywhere and still look hand drawn.</li>
        <li><b>Every block</b> is printed in passes: a stepped scan, then a blue and a pink pass that land out of register and slide into line. The covers are real halftone screens at print angles.</li>
        <li><b>No framework, no build step, no libraries.</b> Plain modules, one canvas for him, one for the intro. View the source, it is meant to be read.</li>
      </ol>
      <div class="colophon__end"><span>Safowan Mostaque, ${new Date().getFullYear()}</span><span>Set in Bodoni Moda, Familjen Grotesk, Martian Mono and Silkscreen</span></div>
    </div>
  </footer>
</div>`;
}

function rack(label, part, items) {
  return `<div class="rack"><h3>${label}</h3><div class="rack__row">${items.map(([k, c]) => `<button class="swatch" type="button" data-part="${part}" data-key="${k}" aria-pressed="false" style="--c:${c}"><i></i>${esc(labelFor(part, k))}</button>`).join('')}</div></div>`;
}
function labelFor(part, k) {
  const names = { top: { blue: 'Blue hoodie', pink: 'Pink hoodie', yolk: 'Yolk hoodie', moss: 'Moss hoodie', varsity: 'Varsity', knit: 'Cream knit' }, hat: { none: 'None', cap: 'Cap', beanie: 'Beanie' }, eyes: { none: 'None', shades: 'Shades' }, shoes: { cream: 'Cream', black: 'Black', tomato: 'Tomato' } };
  return names[part][k];
}

export function projectHTML(p) {
  const list = [...work, ...games];
  const i = list.indexOf(p);
  const next = list[(i + 1) % list.length];
  return `
<div class="page page--project" style="${ink(p)}">
  <div class="wrap">
    ${topBar(false)}
    <article class="proj">
      <a class="proj__back" href="#/" data-back>${arrowLeft} Front page</a>
      <header class="proj__head">
        <div>
          <p class="kicker">${p.kind === 'game' ? 'Game' : 'Build'} &nbsp;/&nbsp; ${esc(p.year)} &nbsp;/&nbsp; ${esc(p.role)}</p>
          <h1 class="proj__title"><span>${esc(p.title)}</span></h1>
        </div>
        <div>
          <p class="proj__lede">${esc(p.lede)}</p>
          ${p.live ? `<div class="proj__links"><a class="btn is-solid" href="${esc(p.live)}" target="_blank" rel="noopener">Visit the live site &#8599;</a></div>` : ''}
        </div>
      </header>

      <dl class="numbers">${p.numbers.map(([n, t]) => `<div><dt>${esc(n)}</dt><dd>${esc(t)}</dd></div>`).join('')}</dl>

      <section class="demo-frame" aria-label="Interactive demo">
        <div class="demo-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><b>LIVE DEMO</b><span>${esc(p.demoNote)}</span></div>
        <div class="demo" data-demo="${p.demo}" tabindex="0"><div class="demo__loading">LOADING...</div></div>
      </section>

      <div class="proj__cols">
        <section>
          <h2>WHAT I BUILT</h2>
          <ol class="built">${p.built.map((b) => `<li><span>${esc(b)}</span></li>`).join('')}</ol>
          <div class="stack">${p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        </section>
        ${p.hard.length ? `<section>
          <h2>HARD PARTS</h2>
          <div class="hard">${p.hard.map(([h, t]) => `<article><h3>${esc(h)}</h3><p>${esc(t)}</p></article>`).join('')}</div>
        </section>` : '<section></section>'}
      </div>

      <a class="proj__next" href="#/${next.kind === 'game' ? 'games' : 'work'}/${next.slug}">
        <span><small>Next project</small><strong>${esc(next.title)}</strong></span>
        <span class="arrow" aria-hidden="true">&gt;</span>
      </a>
    </article>
  </div>
</div>`;
}

export function cvHTML() {
  const all = [...work, ...games];
  return `
  <header><h1>${esc(site.name.join(' '))}</h1><p>${esc(site.role)}</p>
  <p class="cv-links">${[site.email, ...site.links.map((l) => l.href.replace(/^https?:\/\//, ''))].filter(Boolean).map(esc).join('  ·  ')}</p></header>
  <p class="cv-lede">${esc(site.lede)}</p>
  <h2>Projects</h2>
  ${all.map((p) => `<div class="cv-p"><h3>${esc(p.title)} <span>${p.kind === 'game' ? 'Roblox game' : 'Build'}, ${esc(p.year)}. ${esc(p.tags.slice(0, 5).join(', '))}</span></h3><p>${esc(p.short)}</p><ul>${p.built.slice(0, 2).map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}
  ${earlier.map((e) => `<div class="cv-p"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div>`).join('')}
  <h2>Skills</h2>
  <div class="cv-skills">${skills.map((g) => `<p><b>${esc(g.group)}:</b> ${g.items.map(([n]) => esc(n)).join(', ')}</p>`).join('')}</div>
  <p class="cv-foot">The full, interactive version of this CV is a website. It prints itself.</p>`;
}

export { bySlug };
