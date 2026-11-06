# Safowan Mostaque, portfolio

The portfolio is a building. It starts as a black lacquer screen; click and it shatters into pixels, little Me hoovers them up as ink, builds the roof sign out of them, raises the tower, and rides the elevator down, building each floor as you reach it.

| Floor | What is in it |
| --- | --- |
| Roof | The sign, a short pitch with contact links, and a water tank with a day and night dial (the rooms follow your local time; drag it to change) |
| 7 Studio | Written in Real Stars, The Ad Factory |
| 6 Lab | Earshot, Screen Translator, Live Page Translator, Doc Preview to PDF, Agent, Meme Mirror, ArtificialPersona |
| 5 Arcade | Tides of Qingdao, Bonk a Brainrot, Creature Collector, Monsters in the Office, CandieZ |
| 4 Study | Boba & Aloe, Boba in 3D, Study Cat for Mac, Bigger Card Images |
| 3 Gifts | Sites made for my girlfriend |
| 2 Atelier | Fashion shoots, with a fitting room for little Me |
| 1 Workshop | Skills. Click one and the building lights up where it was used |
| G Mailroom | Email, LinkedIn, GitHub, print the CV, older repos |

The demos are real wherever they can be:

- **Tides of Qingdao:** real gameplay clips cut from a Studio recording, the wok station ported from `Wok.luau` and graded like `server/Cooking.luau`, and catch rolls ported from `Rarity.luau`.
- **Creature Collector:** the catch ring ported from the shared `Catch.luau`, with the server's real checks and limits.
- **Boba & Aloe, Boba 3D:** the add-ons' own `cats.js`, `boba.js` and CSS, and the Blender sprite sheet, running in a pretend reviewer (`media/anki/reviewer.html`) that plays Anki's bridge with one saved answer.
- **Earshot:** the real app. Its bundled notes are swapped for three sample lectures (`media/earshot/index.html`), so nothing private ships.
- **Written in Real Stars:** 2,035 stars from the site's own catalogue, and real product photos. **Ad Factory:** three real ads.

Press Ctrl + P anywhere and it prints as a one page CV. Sounds are synthesised; the SND button on the elevator panel turns them off.

## Run it

```
python dev-server.py
```

Open http://localhost:5190. The intro plays once per tab; add `?intro` to the address to see it again.

## Add a project

Everything the site says is in `js/data.js`. Add an object to `projects` with a `floor` id from `floors` and it appears in that room and gets its own page. Optional fields: `screen` / `screenVideo` (what shows on its monitor or cabinet), `media` (the gallery on its page), `demos`, `live`, `numbers`, `hard`.

Put images and clips in `media/<project>/`. House rule: no em dashes anywhere in the copy.

## Files

```
index.html          the shell
css/site.css        the building, the rooms, the project pages
css/print.css       the one page CV
js/app.js           routes, the elevator, the paint roller between pages
js/director.js      what gets built, in what order
js/intro.js         wave equation, lacquer shader, shatter
js/sprite.js        little Me's pixel maps and the bitmap font
js/stage.js         the canvas he lives on
js/print.js         the pixel build effect, the name sampler
js/sfx.js           every sound, synthesised
js/pages.js         page templates
js/demos/*.js       one module per demo
media/              real footage, photos, the add-ons' own files
```

## Put it online

Any static host. GitHub Pages: push this repo and turn on Pages for `main`.
