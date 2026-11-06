// Everything the site says lives here. Edit this file, not the pages.
// House rule for every string: no em dashes.
//
// Adding a project: add an object to `projects` with a `floor` id from
// `floors`. It appears in that room and gets its own page automatically.

export const site = {
  name: ['Safowan', 'Mostaque'],
  role: 'Developer',
  pitch:
    'I build websites that take real orders, Roblox games with tens of thousands of lines of Luau behind them, ' +
    'and study tools with a pair of cats in them. Also a stylist.',
  where: 'Toronto / Kingston',
  now: 'Right now: building Tides of Qingdao, a diving and cooking game on Roblox.',
  email: 'safowan123@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://linkedin.com/in/safowanmostaque' },
    { label: 'GitHub', href: 'https://github.com/LostSaf' },
    { label: 'Written in Real Stars', href: 'https://writteninrealstars.com' },
  ],
};

// Little Me. Change these to look more like you.
export const me = {
  skin: '#b97a52', skinShade: '#93603e',
  hair: '#221b1e', hairLight: '#4a3940',
  hoodie: '#2b44e0', hoodieShade: '#1b2c9e', hoodieLight: '#6a7cff',
  pants: '#2b2833', shoe: '#fbfaf6', sole: '#cfc9bb',
};

// The building, top to bottom.
export const floors = [
  { id: 'studio', no: '7', name: 'Studio', blurb: 'Websites, and the machinery behind them.' },
  { id: 'lab', no: '6', name: 'Lab', blurb: 'Browser extensions and AI tools.' },
  { id: 'arcade', no: '5', name: 'Arcade', blurb: 'Games: Roblox in Luau, and Unity in C#.' },
  { id: 'study', no: '4', name: 'Study', blurb: 'Anki add-ons. Boba and Aloe sleep on the desk.' },
  { id: 'gifts', no: '3', name: 'Gifts', blurb: 'Websites I made for my girlfriend.' },
  { id: 'atelier', no: '2', name: 'Atelier', blurb: 'Fashion: creative direction and styling.' },
  { id: 'workshop', no: '1', name: 'Workshop', blurb: 'The tools. Pick one and the building lights up where I used it.' },
  { id: 'mailroom', no: 'G', name: 'Mailroom', blurb: 'Say hello.' },
];

const M = (p) => `media/${p}`;

export const projects = [
  // ---------------------------------------------------------------- studio
  {
    slug: 'written-in-real-stars', floor: 'studio',
    title: 'Written in Real Stars',
    short: 'A name spelled in real catalogued stars, a 3D universe, and a print shop behind it.',
    year: '2026', role: 'Solo: design, front end, order server, ads',
    tags: ['three.js', 'WebGL', 'Node', 'Stripe', 'Prodigi API', 'MediaPipe'],
    live: 'https://writteninrealstars.com',
    screen: M('wirs/og.jpg'),
    lede:
      "Type someone's name and it gets spelled across the night sky using only real catalogued stars, each one where it really is. " +
      'Fly out into a 3D universe and find their face in the same star field. People buy it as a print, and a lab prints it and posts it to them.',
    media: [
      { type: 'image', src: M('wirs/og.jpg'), caption: 'The front page: the name Betty, in real stars' },
      { type: 'image', src: M('wirs/face-example.jpg'), caption: 'A face print: the photo cut out on the device and drawn in stars' },
      { type: 'image', src: M('wirs/print-face-name-black-frame.jpg'), caption: 'Face and name, framed' },
      { type: 'image', src: M('wirs/print-a3.jpg'), caption: 'An A3 plate as the lab prints it' },
      { type: 'image', src: M('wirs/print-detail.jpg'), caption: 'Plate detail' },
      { type: 'image', src: M('wirs/style-celestial.jpg'), caption: 'The Celestial style' },
      { type: 'image', src: M('wirs/style-noir.jpg'), caption: 'The Noir style' },
    ],
    demos: [{ id: 'stars', title: 'The real sky, and a server that cannot be talked down', note: "2,035 Hipparcos stars from the site's own catalogue, coloured by their B minus V index. Drag to look around. The panel sends orders the way the page does." }],
    built: [
      'A 3D sky in three.js with stars placed at their true distances in light years, and 1,404 galaxies and nebulae you can fly into and through.',
      'Face prints: a photo is cut out on the device with a selfie segmenter running in WebAssembly, lit like a portrait, and checked in the browser for a face and for unsafe content before anything is uploaded.',
      "An order server in Node: Stripe Checkout, a webhook, and the Prodigi print API. Prices come from the server's own catalogue, so a forged request cannot buy an A2 for a dollar.",
      'The browser never holds the artwork. Before payment the server returns a watermarked preview at about 77 dpi. After payment the print file sits behind a signed link that expires, and no PDF is ever written to disk.',
      'Names are drawn on the server, so how a name becomes stars stays off the page.',
      'A Content-Security-Policy on every page, HSTS, consent gated ad measurement, and its own accessibility and privacy pages.',
    ],
    hard: [
      ['Printing what the screen shows', 'The screen draws in WebGL and the print is drawn on the server. The browser sends the star data it is already showing and the server draws the plate from it, so the print matches the preview star for star.'],
      ['A deploy file that quietly undid a setting', 'A deploy file edited for a price change re-applied an old environment value and would have failed every paid order at the print lab. It now pins the live value and every deploy is checked with a real quote.'],
      ['Tracking only with a yes', 'Ad measurement loads only after the visitor agrees, honours Global Privacy Control, and never sends names, emails or gift codes.'],
    ],
    numbers: [['132', 'commits since 2 Sep 2026'], ['5,046', 'catalogued background stars'], ['1,404', 'galaxies and nebulae'], ['~4,500', 'lines in the order server']],
  },
  {
    slug: 'ad-factory', floor: 'studio',
    title: 'The Ad Factory',
    short: 'Video ads made by code: web pages recorded frame by frame on a virtual clock, captioned and scored by script.',
    year: '2026', role: 'Solo: recorder, scenes, sound',
    tags: ['Headless Chrome', 'CDP', 'Python', 'PIL', 'ffmpeg', 'Audio synthesis'],
    screen: M('ads/one-for-each-of-them.jpg'), screenVideo: M('ads/one-for-each-of-them.mp4'),
    lede:
      'Every ad for Written in Real Stars is a web page. A recorder drives headless Chrome on a virtual clock and screenshots every frame, Python adds captions and a synthesised score timed to what happens on screen, and ffmpeg puts it together. These are real ads that ran.',
    media: [
      { type: 'video', src: M('ads/made-in-15-seconds.mp4'), poster: M('ads/made-in-15-seconds.jpg'), caption: 'Made in 15 seconds', sound: true, tall: true },
      { type: 'video', src: M('ads/one-for-each-of-them.mp4'), poster: M('ads/one-for-each-of-them.jpg'), caption: 'One for each of them', sound: true, tall: true },
      { type: 'video', src: M('ads/couple-not-a-candle.mp4'), poster: M('ads/couple-not-a-candle.jpg'), caption: 'A Christmas gift that is not another candle', sound: true, tall: true },
    ],
    demos: [{ id: 'clock', title: 'Why the recorder runs on a virtual clock', note: 'Same scene, same slow screenshots. The wall clock recorder misses whatever happens while a screenshot is being taken. The virtual clock recorder cannot.' }],
    built: [
      'A recorder that freezes page time and steps it one frame at a time, so every frame lands exactly where it should no matter how slow the screenshot was.',
      'Scenes as plain HTML: message threads with typing bubbles and link cards, story posts with word by word captions, gift lists styled as scrapbooks.',
      'Real print renders dropped into real room photos with a perspective warp, so a framed print in an ad is the actual product.',
      'Music beds and sound effects synthesised in Python and placed on the frames where things happen.',
    ],
    hard: [
      ['A still page never finishes', 'Chrome skips screenshots of a page that has not changed, so a still scene hung the recorder. A single changing pixel keeps frames coming.'],
      ['Timers stop between scenes', 'Page timers pause while nothing is being recorded, so each scene starts from a fresh navigation instead of picking up where the last left off.'],
    ],
    numbers: [['0', 'dropped frames'], ['6', 'ad formats'], ['4', 'platforms the ads run on']],
  },

  // ---------------------------------------------------------------- arcade
  {
    slug: 'tides-of-qingdao', floor: 'arcade',
    title: 'Tides of Qingdao',
    short: 'Spear fish by day, cook the catch at Old Sea House by night.',
    year: '2026', role: 'Solo: design, code, world building',
    tags: ['Luau', 'Roblox', 'Rojo', 'Selene', 'StyLua', 'Procedural animation'],
    screen: M('tides/thumbnail-1-key-art.jpg'), screenVideo: M('tides/dive.mp4'),
    cabinet: { marquee: '#ffcf3f', side: '#c8202f' },
    lede:
      "A diving and cooking game on Roblox. By day you spear fish across five seas, a sunken village, 23 caves and eight bosses. By night you cook what you caught into Shandong dishes at Old Sea House, the restaurant your grandmother wants back on its feet. Every clip below is the real game.",
    media: [
      { type: 'video', src: M('tides/dive.mp4'), poster: M('tides/dive.jpg'), caption: 'Diving the Cold Current with a sling spear' },
      { type: 'video', src: M('tides/reel.mp4'), poster: M('tides/reel.jpg'), caption: 'Reeling a fish in: keep the line tight' },
      { type: 'video', src: M('tides/caves.mp4'), poster: M('tides/caves.jpg'), caption: 'Hairtail Hollow, one of 23 caves' },
      { type: 'video', src: M('tides/catch.mp4'), poster: M('tides/catch.jpg'), caption: "Hammer's Reach, jellyfish and a catch" },
      { type: 'video', src: M('tides/town.mp4'), poster: M('tides/town.jpg'), caption: 'Back to the harbour' },
      { type: 'video', src: M('tides/kitchen.mp4'), poster: M('tides/kitchen.jpg'), caption: 'Old Sea House, closed until dinner' },
      { type: 'image', src: M('tides/thumbnail-1-key-art.jpg'), caption: 'Store page key art' },
      { type: 'image', src: M('tides/thumbnail-3-cook.jpg'), caption: 'Cook by night' },
      { type: 'image', src: M('tides/thumbnail-4-boss.jpg'), caption: 'The Guardian, a procedural dragon' },
      { type: 'image', src: M('tides/thumbnail-11-moray-queen.jpg'), caption: 'The Moray Queen' },
      { type: 'image', src: M('tides/thumbnail-9-rare-catches.jpg'), caption: 'A Rainbow Mythic Red Lionfish' },
      { type: 'image', src: M('tides/thumbnail-8-caves.jpg'), caption: 'Hidden caves' },
      { type: 'image', src: M('tides/thumbnail-7-story.jpg'), caption: 'Nainai Wei and the story' },
      { type: 'image', src: M('tides/thumbnail-6-town.jpg'), caption: 'Qingdao, the town' },
      { type: 'image', src: M('tides/thumbnail-5-weapons.jpg'), caption: '5 weapons and 42 spear skins' },
    ],
    demos: [
      { id: 'wok', title: 'The wok station, ported from Wok.luau', note: 'The same numbers as the game: an 8 second cook, a heat zone that drifts, four tosses. Then it is graded the way the server grades it, which also throws out any result that could not really happen.' },
      { id: 'rarity', title: 'Every catch roll, ported from Rarity.luau', note: 'The real tier weights, luck powers and mutation odds. Push luck up and watch the rarer tiers open up, the same way boosts work in game.' },
    ],
    built: [
      '58,586 lines of Luau across 153 files, kept in Git and synced into Roblox Studio with Rojo, linted with Selene and formatted with StyLua.',
      "Fish drawn as jointed copies on each player's screen over the server's solid fish: the spine bends, the tail beats faster with speed, fins scull and jaws open.",
      'Bosses rigged in code from generated meshes: a procedural dragon built from a chain of segments, a squid with ten arms, an eel laid along a travelling S curve.',
      'Four cooking minigames (wok, steamer, dumpling bench, braise), each scored on the client and re-graded on the server.',
      'Rarity tiers and mutations rolled on the server for every catch, with the odds shown to players in game.',
      'The whole map rebuilt by scripts that are safe to run again: the harbour, a church built from parts, caves carved out of the seabed, rock formations and eight boss arenas.',
    ],
    hard: [
      ['Walls that flickered', 'Faces sharing a plane flicker as black and white strips. Every neighbouring column, wedge and skin stands a hair proud by kind, so no two faces ever share one.'],
      ['Parts vanishing a million studs down', "A NaN in a part's position sends it a million studs down with no error. Every unit vector that can be zero is guarded, and nothing eases toward a NaN."],
      ['A second tail', 'Fish streaming in one piece at a time showed a late tail over the jointed copy. Fish now stream as one piece and are redrawn if they ever gain a part.'],
      ['Two projects, one machine', "Another game's sync server once overwrote this one's code. Every name here is now namespaced and it syncs on its own port."],
    ],
    numbers: [['174', 'commits since 25 Sep 2026'], ['153', 'Luau files'], ['23', 'caves'], ['8', 'bosses']],
  },
  {
    slug: 'bonk-a-brainrot', floor: 'arcade',
    title: 'Bonk a Brainrot',
    short: 'A party fighter above the goo. The higher your percent, the farther you fly.',
    year: '2026', role: 'Solo',
    tags: ['Luau', 'Roblox', 'Physics', 'Monetisation'],
    screen: M('bonk/thumbnail-1-bonk.jpg'),
    cabinet: { marquee: '#ff5fd0', side: '#7a3df0' },
    lede:
      'Grab a bat and fight on a floating island above the brainrot goo. Every bonk raises your percent, and the higher it gets the farther you fly. The floor crumbles every round, and the last brainrot standing wins.',
    media: [
      { type: 'image', src: M('bonk/thumbnail-1-bonk.jpg'), caption: 'BONK' },
      { type: 'image', src: M('bonk/thumbnail-2-last-one-standing.jpg'), caption: 'The island crumbles away' },
      { type: 'image', src: M('bonk/thumbnail-3-hatch-brainrots.jpg'), caption: 'Sixteen brainrot pets from two eggs' },
      { type: 'image', src: M('bonk/thumbnail-4-knock-into-the-goo.jpg'), caption: 'Knock them into the goo' },
    ],
    shop: [
      { img: M('bonk/game-pass-vip.png'), name: 'VIP', price: '249 Robux', text: '2x coins from everything, a golden bat, a VIP tag.' },
      { img: M('bonk/game-pass-plus-2-pet-slots.png'), name: '+2 Pet Slots', price: '149 Robux', text: 'Equip five brainrots instead of three.' },
      { img: M('bonk/product-pile-of-coins-500.png'), name: 'Pile of Coins', price: '25 Robux', text: '500 coins, enough for five eggs.' },
      { img: M('bonk/product-bag-of-coins-2000.png'), name: 'Bag of Coins', price: 'Developer product', text: '2,000 coins.' },
      { img: M('bonk/product-vault-of-coins-7500.png'), name: 'Vault of Coins', price: 'Developer product', text: '7,500 coins.' },
    ],
    demos: [],
    built: [
      'Knockback that scales with damage taken, so big hits late in a round turn into home runs.',
      'An island that falls apart tile by tile each round.',
      'Seven modes including Low Gravity, MEGA BONK, Saturnita Space and Bombardiro Blitz, plus power ups: espresso speed, a banana super jump and a mega bonk.',
      'Sixteen pets from two eggs, a secret one in the Golden Egg, pets that follow you and multiply your coins, daily rewards and a wins leaderboard.',
      'The store page, thumbnails, game passes and developer products, priced for the audience.',
    ],
    hard: [],
    numbers: [['7', 'modes'], ['16', 'pets'], ['2', 'eggs'], ['12 to 16', 'players a server']],
  },
  {
    slug: 'creature-collector', floor: 'arcade',
    title: 'Creature Collector',
    short: 'Catch creatures by day, hold camp against the spirit by night. The server owns everything.',
    year: '2026', role: 'Solo: design doc, systems, code',
    tags: ['Luau', 'Roblox', 'Server authority', 'Market research', 'Image to 3D'],
    screen: M('cc/icon-cat-a.jpg'),
    cabinet: { marquee: '#9ee6a8', side: '#1f3d6b' },
    lede:
      'A co-op game for squads of one to four. By day you catch creatures with a timing ring; they earn coins at camp. At night one spirit hunts the camp: it shrieks the name of its next target, then runs at the lanterns, a player or a creature. It is still in development, so the pictures below are the concept art the game is being built from.',
    media: [
      { type: 'image', src: M('cc/style-sheet-v1.jpg'), caption: 'The locked style sheet: Mossling, Glowmoth, Starwhisker and the spirit' },
      { type: 'image', src: M('cc/icon-cat-a.jpg'), caption: 'Icon draft: Starwhisker by a lantern, the spirit behind' },
      { type: 'image', src: M('cc/thumb-camp-a.jpg'), caption: 'Camp at night' },
      { type: 'image', src: M('cc/starwhisker-v1.jpg'), caption: 'Starwhisker, drawn for its 3D model' },
      { type: 'image', src: M('cc/spirit-v2-model-sheet.jpg'), caption: 'The spirit, one solid silhouette for image to 3D' },
      { type: 'image', src: M('cc/icon-moss-b.jpg'), caption: 'Mossling with a lantern' },
    ],
    demos: [{ id: 'server', title: 'The catch ring, and the server that grades it', note: "The ring is the game's shared Catch module, ported line for line: the client draws with it and the server grades with it. Catch something, then try the cheats. Every check in the log is one the real server makes, with its real limits." }],
    built: [
      'A server authoritative design: the client only draws the world and sends intents. Captures are distance checked, rolls use server randomness with weighted tables, and every remote is rate limited.',
      'Each creature gets a unique id when it is caught, so trading can point at it later.',
      'Offline earnings worked out from server time only, capped at eight hours.',
      'Services started in a fixed boot order, with debug commands that reach live server state during playtests.',
      'Concept art made with image models from a style sheet I locked first, then the spirit turned into a 3D model from its model sheet.',
      'A design doc built on research into the most played Roblox games, aimed at week two retention and playing with friends.',
    ],
    hard: [
      ['Testing through a live engine', 'Debug commands go through a bindable function in Studio so tests read the real running services instead of fresh copies of them.'],
      ['A spirit that fears light', 'The first camp art had the spirit holding a lantern. It is afraid of light in the design, so those drafts were kept only as drafts.'],
    ],
    numbers: [['114', 'commits'], ['93', 'Luau files'], ['18,189', 'lines'], ['1 to 4', 'players a squad']],
  },

  // ---------------------------------------------------------------- study
  {
    slug: 'boba-and-aloe', floor: 'study', card: 'v3',
    title: 'Boba & Aloe, the Study Cats',
    short: 'Two sleepy cats in the corner of Anki who wake up to explain your card with Claude.',
    year: '2026', role: 'Solo',
    tags: ['Python', 'Anki add-on API', 'Claude API', 'JavaScript', 'SVG'],
    lede:
      'Boba is a small black cat with green eyes. Aloe is fluffy, white and brown, with blue eyes. They sleep in the corner of the reviewer. Wake them and they explain the answer on the card you are looking at, or answer your own questions about it, using Claude, images on the card included.',
    media: [],
    demos: [{ id: 'cats', title: 'The real add-on, in a pretend reviewer', note: "This is the add-on's own cats.js and cats.css. Only Anki's bridge is pretend: in Anki the reply comes live from Claude, here it is one saved answer." }],
    built: [
      "A Python add-on that hooks Anki's reviewer and serves its own JavaScript and CSS into the card through Anki's web exports.",
      'Calls the Claude Messages API from Python with the card text and up to five of its images, each checked against the size the API accepts.',
      'Keeps a conversation per card, so a follow-up question knows what was already said.',
      'Both cats are one hand drawn SVG sharing animation classes, so they fall asleep and wake up together.',
      'A settings window for the key, model, shortcut, corner and extra instructions like "explain like I am a nursing student".',
    ],
    hard: [['Typing inside a card', "Anki's reviewer listens for single key shortcuts, so typing a question would have answered the card. The question box stops its key events from reaching the reviewer."]],
    numbers: [['2', 'cats'], ['376', 'lines of Python'], ['5', 'images per question']],
  },
  {
    slug: 'boba-3d', floor: 'study', card: 'v2',
    title: 'Boba the Study Cat, in 3D',
    short: 'Boba rendered in Blender from a rigged, fur-groomed model, walking onto your cards.',
    year: '2026', role: 'Solo: rig, grooming, render, code',
    tags: ['Blender', 'Cycles', 'Rigging', 'Sprite animation', 'Claude API'],
    lede:
      'Before Aloe moved in, Boba lived alone. In this version he is a sprite sheet rendered in Blender from a 3D model of him: he walks in, looks at you, lies down and falls asleep, and wakes up when you need him.',
    media: [{ type: 'image', src: M('anki/boba_sprite.webp'), caption: 'The sprite sheet: 64 frames rendered in Cycles', contain: true }],
    demos: [{ id: 'boba', title: 'The real sprite and player', note: "The add-on's own boba.js playing the Blender sprite sheet. Wake him, or let him doze back off." }],
    built: [
      'Took a stock cat model, re-proportioned it, rigged it with an anatomical feline skeleton and groomed Boba\'s black coat, eyes and whiskers.',
      'Rendered every move in Cycles into one sprite sheet: a walk cycle filmed on a treadmill, lying down, a sleeping breath, waking, blinks, an ear twitch and a tail flick.',
      'A small sprite player in JavaScript with idle behaviour, so he blinks and twitches while you study.',
    ],
    hard: [['Walking without sliding', 'A walk cycle rendered in place looks like ice skating once it moves. Boba moves forward by exactly one stride per cycle, measured off the render, so his paws stay planted.']],
    numbers: [['64', 'frames'], ['7', 'moves'], ['200 x 140', 'pixels a frame']],
    credit: 'Base model "Realistic cat" by Micael Martins on Sketchfab, used under the Sketchfab Standard licence.',
  },
  {
    slug: 'study-cat-mac', floor: 'study', card: 'v1',
    title: 'Boba, Study Cat for Mac',
    short: 'The first Boba: hold to talk, and hear the answer read back.',
    year: '2026', role: 'Solo',
    tags: ['Python', 'Qt', 'Qt Multimedia', 'Claude API'],
    lede:
      'The first version of Boba sat in a small floating window beside the reviewer. Hold to talk and ask about the card out loud, and have the answer read back to you a page at a time.',
    media: [],
    demos: [],
    built: [
      'Microphone recording through Qt Multimedia at 16 kHz, with clear messages when macOS will not give a microphone.',
      'Answers split into short pages for reading aloud.',
      'A frameless window you can drag anywhere, and an explain button added to the card itself.',
    ],
    hard: [],
    numbers: [['1.3.0', 'version'], ['6', 'Python modules']],
  },
  {
    slug: 'bigger-card-images', floor: 'study', card: 'tool',
    title: 'Bigger Card Images',
    short: 'Make the pictures on your flashcards bigger, on every card or just this one.',
    year: '2026', role: 'Solo',
    tags: ['Python', 'Qt', 'Anki add-on API', 'JavaScript'],
    lede:
      'The images on my flashcards were too small to study from, so I wrote an add-on. It resizes images on every card at once or on one card at a time, remembers each card, and works in the reviewer, the previewer and the card layout screen.',
    media: [],
    demos: [{ id: 'anki', title: 'The shortcuts, on real looking cards', note: 'Click the card, then use the add-on\'s keys: ] and [ for this card, } and { for all cards, \\ to reset this card, Ctrl+Shift+B to switch it all off.' }],
    built: [
      "Hooks into Anki's reviewer, previewer and card layout through its Python API and injects a small script into each card's web view.",
      'Two scales that multiply: one for all cards and one remembered per card, saved with the add-on\'s config.',
      'A Tools menu, a slider dialog, and keyboard shortcuts that never clash with Anki\'s own.',
      'Tested by hand through twelve scripted steps, each one screenshotted.',
    ],
    hard: [['Three screens, one behaviour', 'The reviewer, previewer and card layout screen are built differently and not every Anki version has all three. The add-on finds the ones that exist and treats them the same.']],
    numbers: [['~480', 'lines of Python and JS'], ['12', 'tested scenarios'], ['2.1.45+', 'Anki versions']],
  },
];

projects.push(
  // ---------------------------------------------------------------- lab
  {
    slug: 'earshot', floor: 'lab', icon: 'mic',
    title: 'Earshot',
    short: 'Notes that follow the conversation. Talk, and the right line scrolls into view.',
    year: '2026', role: 'Solo',
    tags: ['Web Speech API', 'Claude API', 'JavaScript', 'Wake Lock'],
    lede:
      'Tap the mic and talk. Earshot listens with the browser\'s speech recognition and keeps your notes scrolled to whatever you are talking about, so the right line is already in front of you. Word matching is instant; with a Claude key, Claude reads what was said, picks the section that actually answers it, and gives you an opening line to say while you find your place.',
    media: [],
    demos: [{ id: 'earshot', title: 'The real app, with sample lecture notes', note: 'This is Earshot itself. I swapped its bundled notes for three short sample lectures. Allow the microphone, press the mic and talk about one of them. Works in Chrome and Edge.' }],
    built: [
      'Continuous speech recognition in the browser, restarted on its own when it stops.',
      'Matching that ignores filler words, five sensitivity levels from very picky to eager, and keywords you can add under any heading to steer it.',
      'Optional Claude routing, for questions where the literal words are not in the notes.',
      'Note sets you can switch on and off, auto scroll that can be turned off, and a wake lock so the screen stays on while it listens.',
      'One HTML file. Notes stay on your device unless you switch Claude routing on.',
    ],
    hard: [['A listener that kept hanging up', "The browser's speech recognition quietly ends after a pause. Earshot starts it again a quarter of a second later for as long as you are listening, so it never just stops following."]],
    numbers: [['1', 'HTML file'], ['0', 'servers'], ['2', 'ways to match']],
  },
  {
    slug: 'screen-translator', floor: 'lab', icon: 'eye',
    title: 'Screen Translator',
    short: 'A Chrome extension that translates everything on the page, text inside images and scans included.',
    year: '2026', role: 'Solo',
    tags: ['Chrome extension', 'Manifest V3', 'Tesseract OCR', 'Claude API'],
    lede:
      'Translates everything on the page, including words inside images and scanned documents, and keeps the translation in place as you scroll.',
    media: [], demos: [],
    built: [
      'A Manifest V3 extension: content script on the page, a service worker in the background, and an offscreen document doing the heavy work.',
      'Tesseract OCR reads text out of images and scans in the offscreen document, so the page itself never stalls.',
      'Translations laid back over the original positions and kept there as you scroll.',
      'A right click menu, and network rules so images from other sites can be read.',
    ],
    hard: [],
    numbers: [['1.3.0', 'version'], ['3', 'extension contexts']],
  },
  {
    slug: 'live-page-translator', floor: 'lab', icon: 'globe',
    title: 'Live Page Translator',
    short: 'Translates a page in place, and keeps translating whatever loads in after.',
    year: '2026', role: 'Solo',
    tags: ['Chrome extension', 'Manifest V3', 'MutationObserver', 'LibreTranslate'],
    lede:
      'A Chrome and Edge extension that translates a page where it stands and keeps going as new text arrives: feeds, chats and single page apps included.',
    media: [], demos: [],
    built: [
      "A content script walks the page's text nodes and replaces them with their translation.",
      'A service worker calls any LibreTranslate compatible endpoint, public or self hosted.',
      'A MutationObserver catches text added after load and translates it too.',
    ],
    hard: [],
    numbers: [['1.0.0', 'version'], ['0', 'page reloads needed']],
  },
  {
    slug: 'doc-preview-to-pdf', floor: 'lab', icon: 'doc',
    title: 'Doc Preview to PDF',
    short: 'Turns a Google Docs or Drive preview into one PDF you can highlight.',
    year: '2026', role: 'Solo',
    tags: ['Chrome extension', 'Manifest V3', 'PDF', 'Canvas'],
    lede:
      'Goes through every page of a Google Docs or Google Drive preview, captures each one and saves them as a single PDF, with an invisible text layer so a PDF reader can search and highlight it.',
    media: [], demos: [],
    built: [
      'Finds the pages in the preview and outlines them first, so you can check it picked the right document.',
      'Scrolls through by itself with a progress panel; Esc cancels and still lets you keep what it captured.',
      'A sharper mode that zooms the tab to 2x while capturing, and a slow mode for pages that render late.',
      'An invisible text layer over every word where the page has real text behind it.',
    ],
    hard: [['Half drawn pages', 'Previews only draw a page once it scrolls into view, so a fast capture can catch it half drawn. The capture scrolls each page in and gives it time, with a slower setting for heavy documents.']],
    numbers: [['1.1.0', 'version'], ['2x', 'capture zoom']],
  },
  {
    slug: 'agent', floor: 'lab', icon: 'term',
    title: 'Agent',
    short: 'A terminal AI agent that plans a goal, works through it, and remembers between sessions.',
    year: '2026', role: 'Solo',
    tags: ['Python', 'Claude API', 'Agents', 'Memory'],
    live: 'https://github.com/LostSaf/Agent', liveLabel: 'Code on GitHub',
    lede:
      'Give it a goal in the terminal. A planner breaks it into steps, a loop works through them with tools for web search, fetching pages, running code and files, and a final call pulls the results together. It remembers facts and session summaries between runs.',
    media: [], demos: [],
    built: [
      'A planner that turns one goal into steps, run one at a time and then synthesised.',
      'Memory that keeps facts and session summaries across runs, with commands to show, forget or clear it.',
      'The session summary is written in a finally block, so it is saved even if a run fails.',
    ],
    hard: [],
    numbers: [['4', 'tools'], ['1', 'goal in, one answer out']],
  },
  {
    slug: 'meme-mirror', floor: 'lab', icon: 'cam',
    title: 'Meme Mirror',
    short: 'Strike a pose at your webcam and the meme with the same pose appears beside you.',
    year: '2026', role: 'Solo',
    tags: ['Python', 'MediaPipe', 'OpenCV', 'Nearest neighbour'],
    live: 'https://github.com/LostSaf/MemeBot', liveLabel: 'Code on GitHub',
    lede:
      'A webcam mirror that matches your body pose against a library of meme poses. Hit one and its image appears beside you, with its sound if it has one.',
    media: [], demos: [],
    built: [
      "MediaPipe's pose landmarker turns each frame into body landmarks, and those into a feature vector.",
      'An indexer precomputes the same features for every meme in the library.',
      'Nearest neighbour matching with a distance threshold, a margin over the runner up and voting across frames, so it does not flicker between memes.',
    ],
    hard: [],
    numbers: [['3', 'checks before a match']],
  },
  {
    slug: 'artificial-persona', floor: 'lab', icon: 'wave',
    title: 'ArtificialPersona',
    short: 'Team project: speech to text, text to speech and deepfake video for anonymous real time talk.',
    year: '2024', role: 'Team of seven',
    tags: ['Speech to text', 'Text to speech', 'Deepfakes', 'Python'],
    live: 'https://github.com/david-courtis/ArtificialPersona', liveLabel: 'Code on GitHub',
    lede:
      'A neural network pipeline that chains speech to text, text to speech and deepfake video, so someone can talk in real time online with a voice and face that are not theirs.',
    media: [], demos: [],
    built: ['Built with David Courtis, Ovil Miranda, Carter Moore, Zane Prance, Kanika Poonia and Faiz Farook.'],
    hard: [],
    numbers: [['7', 'people'], ['3', 'models chained']],
  },

  // ---------------------------------------------------------------- arcade, Unity
  {
    slug: 'monsters-in-the-office', floor: 'arcade',
    title: "My Mom Needs Me Home for Dinner but There's Monsters in the Office",
    marquee: 'Monsters in the Office',
    short: 'Survival horror comedy in Unity: escape the office before dinner, and keep your mom updated.',
    year: '2024', role: 'Team of four, game design course',
    tags: ['Unity', 'C#', 'Game design', 'Team'],
    live: 'https://kamisama165.itch.io/my-mom-needs-me-home-for-dinner-but-theres-monsters-in-the-office', liveLabel: 'Play on itch.io',
    cabinet: { marquee: '#7cf0a0', side: '#1b1a22' },
    lede:
      "You are stuck at the office late at night and your mom wants you home for dinner. Find your way through a dim office maze while monsters hunt the light of your dying phone. Collect batteries, use what you find, survive the quick time events, and keep texting your mom so she does not ground you.",
    media: [], demos: [],
    built: [
      'Monsters drawn to the light from your phone, so the flashlight you need is also what gives you away.',
      'A battery that runs down, and batteries to find around the office.',
      'Quick time events, items to use, and staying quiet to stay alive.',
      'A mom meter: forget to text her and you lose.',
      'Made with Aryan Biswas, Kevin Hu and Hayden Chandler.',
    ],
    hard: [],
    numbers: [['4', 'people'], ['66 MB', 'download'], ['1', 'very patient mom']],
  },

  // ---------------------------------------------------------------- gifts
  {
    slug: 'girlfriends-day', floor: 'gifts', seal: '#d23b5a',
    title: "A National Girlfriend's Day card",
    short: 'A three page card: a title, our video, and an ending she can play again.',
    year: '2026', role: 'Solo',
    tags: ['Canvas', 'three.js', 'Web Audio', 'HTML'],
    lede:
      "A card for National Girlfriend's Day, made as a web page. It opens on a title page, moves to a page that plays a video of us, and ends on a finale she can replay, with music she can switch off and drawing on canvas throughout. It is hers, so it stays private here.",
    media: [], demos: [],
    built: [
      'Three pages that move from one to the next, each with its own drawn background.',
      'A video page, and music with an on and off switch.',
      'One HTML file she can open anywhere.',
    ],
    hard: [],
    numbers: [['3', 'pages'], ['1', 'person it is for']],
  },
  {
    slug: 'written-in-real-stars-gift', floor: 'gifts', seal: '#2b44e0', alias: 'written-in-real-stars',
    title: 'Written in Real Stars, the first one',
    short: 'Her name in real stars, before it was a shop. It still has a note to her hidden in the code.',
    year: '2026', role: 'Solo', tags: [], lede: '', media: [], demos: [], built: [], hard: [], numbers: [],
  },
);

export const earlier = [
  { title: 'CandieZ', text: 'Server authoritative trading for a live Roblox game past 10 million plays.' },
];

// Older and smaller things, kept on a shelf in the mailroom.
export const archive = [
  { title: 'LoL Winning Analysis', text: 'What wins League of Legends games, analysed in R.', year: '2023', href: 'https://github.com/LostSaf/LOL---Winning-Analysis' },
  { title: 'Word Problem Game', text: 'A word problem game in Python.', year: '2024', href: 'https://github.com/LostSaf/WordProblemGame' },
  { title: 'Fashion Portfolio', text: 'The styling portfolio, as its own site.', year: '2026', href: 'https://github.com/LostSaf/Fashion-Portfolio' },
];

// Fashion, from the styling portfolio.
export const fashion = {
  url: '', // link to the full styling portfolio once it is online
  credits: ['MUSE Magazine', 'Project Red', 'QFIN', 'QFSF', 'VCFS'],
  productions: [
    { slug: 'perpendicular-dance', title: 'Perpendicular Dance', org: 'Personal', roles: ['Creative Director', 'Stylist', 'Logistics'],
      desc: 'A personal direction on fast burning love: two bodies, fleeting intimacy, traced in laser light and smoke. Concept, casting, set logistics and the full wardrobe sourced and styled by me.',
      photos: ['perpendicular-dance-1.jpg', 'perpendicular-dance-4.jpg', 'perpendicular-dance-9.jpg'] },
    { slug: 'china', title: 'China', org: 'MUSE Magazine, Cultural Edition', roles: ['Stylist', 'Creative Assistant'],
      desc: "Styling and creative support for the China chapter of MUSE's Cultural Edition, translating its dress traditions and visual codes into wardrobe and editorial images.",
      photos: ['china-1.jpg', 'china-5.jpg'] },
    { slug: 'india', title: 'India', org: 'MUSE Magazine, Cultural Edition', roles: ['Stylist', 'Creative Assistant'],
      desc: "Wardrobe and visual direction drawing on the subcontinent's textile heritage: bandhani, mirror work, sharara and gold laced silks.",
      photos: ['india-1.jpg', 'india-6.jpg'] },
    { slug: 'in-exile', title: 'In Exile', org: 'Project Red, photoshoot', roles: ['Creative Director', 'Stylist'],
      desc: 'The Hermit. A directed photoshoot on belonging on your own terms: not fitting in, yet wholly at home in your own style. Concept and full wardrobe by me.',
      photos: ['in-exile-1.jpg', 'in-exile-3.jpg'] },
    { slug: 'iran', title: 'Iran', org: 'MUSE Magazine, Cultural Edition', roles: ['Stylist', 'Creative Assistant'],
      desc: 'Wardrobe and visual direction grounded in Persian heritage, weaving traditional symbols, textiles and craft objects into the editorial.',
      photos: ['iran-1.jpg'] },
    { slug: 'moth-to-a-flame', title: 'Moth to a Flame', org: 'VCFS', roles: ['Model', 'Accessory Stylist'],
      desc: 'The pull of seductive, dangerous beauty in deep red and noir. Modelled the look and led the accessory direction.',
      photos: ['moth-to-a-flame-1.jpg', 'moth-to-a-flame-4.jpg'] },
    { slug: 'luna', title: 'Luna', org: 'QFIN', roles: ['Stylist', 'Creative Assistant'],
      desc: "Conceived around Smashing Pumpkins' Luna: moonlit, violet blue intimacy in bedroom light and rhinestone pinned skin.",
      photos: ['luna-1.jpg'] },
    { slug: 'spooky', title: 'Spooky', org: 'QFSF', roles: ['Stylist', 'Creative Assistant', 'Model Co-Head'],
      desc: 'A witchy, autumnal editorial built on candlelight, masks and forest edge melancholy. Styled the looks and co-led the modelling team.',
      photos: ['spooky-1.jpg'] },
  ],
  more: ['Garden Club, MUSE Magazine', 'In Exile runway, Project Red', 'Second Skin, QFIN', 'A New Dawn, VCFS', 'Rearview, VCFS'],
  stats: [['14', 'productions'], ['5', 'organisations'], ['100%', 'wardrobe sourced by me']],
};

// Every skill points at where it was used.
export const skills = [
  { group: 'Web', items: [
    ['JavaScript', ['written-in-real-stars', 'ad-factory', 'boba-and-aloe', 'boba-3d', 'bigger-card-images']],
    ['WebGL and GLSL', ['written-in-real-stars']],
    ['three.js', ['written-in-real-stars']],
    ['Canvas', ['ad-factory']],
    ['HTML and CSS', ['written-in-real-stars', 'boba-and-aloe']],
  ]},
  { group: 'Back end', items: [
    ['Node and Express', ['written-in-real-stars']],
    ['Stripe', ['written-in-real-stars']],
    ['Webhooks and REST APIs', ['written-in-real-stars', 'boba-and-aloe']],
    ['Security', ['written-in-real-stars', 'creature-collector']],
    ['Docker, Render, Fly.io', ['written-in-real-stars']],
  ]},
  { group: 'Games', items: [
    ['Luau', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
    ['Roblox Studio', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
    ['Rojo, Selene, StyLua', ['tides-of-qingdao', 'creature-collector']],
    ['Procedural animation', ['tides-of-qingdao']],
    ['Server authority', ['creature-collector', 'tides-of-qingdao', 'written-in-real-stars']],
    ['Game design', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
  ]},
  { group: 'Everything else', items: [
    ['Python', ['bigger-card-images', 'boba-and-aloe', 'study-cat-mac', 'ad-factory']],
    ['Qt', ['bigger-card-images', 'study-cat-mac', 'boba-and-aloe']],
    ['Claude API', ['boba-and-aloe', 'boba-3d', 'study-cat-mac']],
    ['Blender', ['boba-3d']],
    ['On device ML', ['written-in-real-stars']],
    ['ffmpeg', ['ad-factory']],
  ]},
];

export const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
export const floorOf = (slug) => floors.find((f) => f.id === bySlug[slug].floor);
