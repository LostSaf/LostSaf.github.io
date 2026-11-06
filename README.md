# Safowan Mostaque, portfolio

A portfolio that shows the skill in how it is built. No framework, no build step, no libraries.

1. **The black screen.** A height field stepped with the wave equation every frame, shaded in WebGL2 as glossy lacquer. Your cursor leaves ripples; the words float above it in CSS 3D.
2. **The shatter.** Clicking freezes the frame into a texture and breaks it into a quadtree of instanced square shards that tumble toward you, and the white page shows through.
3. **Little Me.** A pixel version of you walks out of the corner, hoovers up the leftover pixels as ink, and prints the page piece by piece: the name is built from flying pixels, everything else lands in riso style ink passes.
4. **Page changes.** Little Me pushes a paint roller across the screen and the next page is underneath.
5. **Every project page has its own working demo.**

| Project | Demo |
| --- | --- |
| Written in Real Stars | 2,035 real Hipparcos stars from the site's catalogue to drag around, and an order server you can try to cheat |
| The Ad Factory | Wall clock recording versus virtual clock recording, side by side |
| Bigger Card Images | A pretend Anki reviewer where the add-on's real shortcuts work |
| DEN124 Cheat Sheet | The real sheet under a magnifying loupe |
| Tides of Qingdao | A small dive where every fish bends its own spine; catches become dishes |
| Creature Collector | You are the client; try to cheat the server |
| Bonk a Brainrot | A fighter where knockback grows with percent and the island crumbles |

Press Ctrl + P anywhere and the site prints as a one page CV.

## Run it

The scripts are ES modules, so it has to be served over http (opening `index.html` as a file will not work).

```
python dev-server.py
```

Then open http://localhost:5190. The intro plays once per browser tab; add `?intro` to the address to see it again.

## Change what it says

Everything the site says is in `js/data.js`: your name, the lede, the projects, the skills, the links. Little Me's skin, hair and clothes are in the `me` block of the same file.

Things to fill in:

- `site.email` and the commented out LinkedIn link in `site.links`
- `fashion.looks`: put photos in `assets/fashion/` and list them, and they show as a lookbook
- check the CandieZ line in `earlier` says what you want it to

House rule: no em dashes anywhere in the copy.

## Files

```
index.html          the shell
css/site.css        the look: paper, riso inks, type
css/print.css       the one page CV
js/app.js           boot, routes, the paint roller
js/intro.js         wave equation, lacquer shader, shatter
js/sprite.js        little Me's pixel maps, the pixel rotator, the bitmap font
js/stage.js         the canvas he lives on: moving, aiming, ink, dust
js/director.js      the order things get printed in
js/print.js         ink passes, the name sampler, halftone screens
js/covers.js        the halftone card covers
js/pages.js         the page templates
js/demos/*.js       one demo per project
assets/             the star catalogue extract and the cheat sheet
```

## Put it online

Any static host. For GitHub Pages: make a repository, push this folder, and turn on Pages for the main branch. For Netlify: drag the folder onto app.netlify.com/drop.

Fonts come from Google Fonts: Bodoni Moda, Familjen Grotesk, Martian Mono and Silkscreen.
