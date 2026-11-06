// Everything the site says lives here. Edit this file, not the pages.
// House rule for every string below: no em dashes.

export const site = {
  name: ['Safowan', 'Mostaque'],
  short: 'Saf',
  role: 'Developer. Web, games, and the tools in between.',
  lede:
    'I build the whole thing. The shader and the server, the shop that takes real orders, ' +
    'the Roblox game with fifty eight thousand lines of Luau behind it, and the small tools I wished already existed.',
  now: 'Right now: building Tides of Qingdao, a diving and cooking game on Roblox.',
  links: [
    { label: 'GitHub', href: 'https://github.com/LostSaf' },
    { label: 'Written in Real Stars', href: 'https://writteninrealstars.com' },
    // Add these when you want them public:
    // { label: 'Email', href: 'mailto:you@example.com' },
    // { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-name' },
  ],
  email: '', // fill in to show a big "write to me" button
};

// Little Me. Change these to look more like you.
export const me = {
  skin: '#b97a52',
  skinShade: '#93603e',
  hair: '#221b1e',
  hairLight: '#4a3940',
  hoodie: '#2b44e0',
  hoodieShade: '#1b2c9e',
  hoodieLight: '#6a7cff',
  pants: '#2b2833',
  shoe: '#fbfaf6',
  sole: '#cfc9bb',
};

export const facts = [
  { n: '420', t: 'commits since September 2026' },
  { n: '58,586', t: 'lines of Luau in one game' },
  { n: '1', t: 'shop that prints and posts real orders' },
];

// ink pairs come from css/site.css (--blue, --pink, --yolk, --teal, --tomato, --violet, --moss)
export const work = [
  {
    slug: 'written-in-real-stars',
    kind: 'work',
    title: 'Written in Real Stars',
    short: 'A name spelled in real catalogued stars, a 3D universe to fly through, and a print shop behind it.',
    year: '2026',
    role: 'Solo: design, front end, order server, ads',
    ink: ['blue', 'yolk'],
    tags: ['three.js', 'WebGL', 'Node', 'Stripe', 'Prodigi API', 'MediaPipe'],
    live: 'https://writteninrealstars.com',
    lede:
      "Type someone's name and it gets spelled across the night sky using only real catalogued stars, each one where it really is. " +
      'Then fly out into a 3D universe and find their face waiting in the same star field. People buy it as a print, and a lab prints it and posts it to them.',
    demo: 'stars',
    demoNote: 'Drag to look around. These are 2,035 real Hipparcos stars from the site\'s own catalogue, coloured by their B minus V index.',
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
      ['A render.yaml that quietly undid a setting', 'A deploy file edited for a price change re-applied an old environment value and would have failed every paid order at the print lab. The file now pins the live value and every deploy is checked with a real quote.'],
      ['Tracking only with a yes', 'Ad measurement loads only after the visitor agrees, honours Global Privacy Control, and never sends names, emails or gift codes.'],
    ],
    numbers: [['132', 'commits since 2 Sep 2026'], ['5,046', 'catalogued background stars'], ['1,404', 'galaxies and nebulae'], ['~4,500', 'lines in the order server']],
  },
  {
    slug: 'ad-factory',
    kind: 'work',
    title: 'The Ad Factory',
    short: 'Video ads made by code: HTML scenes recorded frame by frame on a virtual clock, captioned and scored by script.',
    year: '2026',
    role: 'Solo: recorder, scenes, sound',
    ink: ['tomato', 'violet'],
    tags: ['Headless Chrome', 'CDP', 'Python', 'PIL', 'ffmpeg', 'Audio synthesis'],
    lede:
      'Every ad for Written in Real Stars is a web page. A recorder drives headless Chrome on a virtual clock and screenshots every frame, Python adds captions and a synthesised score timed to what happens on screen, and ffmpeg puts it together.',
    demo: 'clock',
    demoNote: 'Same scene, two recorders. The wall clock one drops frames whenever a screenshot is slow. The virtual clock one cannot.',
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
  {
    slug: 'bigger-card-images',
    kind: 'work',
    title: 'Bigger Card Images',
    short: 'An Anki add-on that makes the pictures on your flashcards bigger, on every card or just this one.',
    year: '2026',
    role: 'Solo',
    ink: ['teal', 'pink'],
    tags: ['Python', 'Qt', 'Anki add-on API', 'JavaScript'],
    lede:
      'The images on my flashcards were too small to study from, so I wrote an add-on. It resizes images on every card at once or on one card at a time, remembers each card, and works in the reviewer, the previewer and the card layout screen.',
    demo: 'anki',
    demoNote: 'Click the card first, then use the real shortcuts: ] and [ for this card, } and { for all cards, \\ to reset this card, Ctrl+Shift+B to switch it all off.',
    built: [
      'Hooks into Anki\'s reviewer, previewer and card layout through its Python API and injects a small script into each card\'s web view.',
      'Two scales that multiply: one for all cards and one remembered per card, saved with the add-on\'s config.',
      'A Tools menu, a slider dialog, and keyboard shortcuts that never clash with Anki\'s own.',
      'Tested by hand through twelve scripted steps, each one screenshotted.',
    ],
    hard: [
      ['Three screens, one behaviour', 'The reviewer, previewer and card layout screen are built differently and not every Anki version has all three. The add-on finds the ones that exist and treats them the same.'],
    ],
    numbers: [['~480', 'lines of Python and JS'], ['12', 'tested scenarios'], ['2.1.45+', 'Anki versions']],
  },
  {
    slug: 'den124-cheat-sheet',
    kind: 'work',
    title: 'DEN124 Cheat Sheet',
    short: 'Three modules of microbiology on two sides of A4, set in HTML and print CSS.',
    year: '2026',
    role: 'Solo',
    ink: ['violet', 'moss'],
    tags: ['HTML', 'Print CSS', '@page', 'CSS columns', 'Typography'],
    lede:
      'An exam allowed one sheet of notes, so I set three modules of microbiology into four columns at seven point, colour coded by module with clinical notes flagged in red, and printed it from the browser.',
    demo: 'loupe',
    demoNote: 'Move over the sheet to read it through the loupe. This is the real file.',
    built: [
      'An A4 page in CSS with @page margins, four balanced columns and rules between them.',
      'Tables and boxes that never split across a column, headings that never get left at the bottom of one.',
      'A colour system per module plus one clinical red, chosen to survive a black and white printer.',
    ],
    hard: [
      ['Fitting it all', 'Every block was tuned against the page height so the last line of each module lands on its page and nothing spills.'],
    ],
    numbers: [['2', 'sides of A4'], ['4', 'columns'], ['7pt', 'body text']],
  },
];

export const games = [
  {
    slug: 'tides-of-qingdao',
    kind: 'game',
    title: 'Tides of Qingdao',
    short: 'Dive a side-on sea by day, cook what you caught at a Qingdao seafood restaurant by night.',
    year: '2026',
    role: 'Solo: design, code, world building',
    ink: ['teal', 'tomato'],
    tags: ['Luau', 'Roblox', 'Rojo', 'Selene', 'StyLua', 'Procedural animation'],
    lede:
      'A diving and cooking game on Roblox. By day you dive a side-on sea with four regions, a sunken village, 23 caves and eight bosses. By night you cook the catch into Shandong dishes at a restaurant on the harbour.',
    demo: 'dive',
    demoNote: 'Move with the mouse or WASD. Click to grab a fish. Surface for air. Every fish bends its own spine.',
    built: [
      '58,586 lines of Luau across 153 files, kept in Git and synced into Roblox Studio with Rojo, linted with Selene and formatted with StyLua.',
      'Fish drawn as jointed copies on each player\'s screen over the server\'s solid fish: the spine bends, the tail beats faster with speed, fins scull and jaws open.',
      'Bosses rigged in code from generated meshes: a procedural dragon built from a chain of segments, a squid with ten arms, an eel laid along a travelling S curve.',
      'The whole map rebuilt by scripts that are safe to run again: the harbour, a church built from parts, caves carved out of the seabed, rock formations and eight boss arenas.',
      'A day and night loop, a kitchen with stations and recipes, rankings and a hall of fame on Roblox data stores, and a guide who teaches you the ropes.',
    ],
    hard: [
      ['Walls that flickered', 'Faces sharing a plane flicker as black and white strips. Every neighbouring column, wedge and skin stands a hair proud by kind, so no two faces ever share one.'],
      ['Parts vanishing to minus a million', 'A NaN in a part\'s position sends it a million studs down with no error. Every unit vector that can be zero is guarded, and nothing eases toward a NaN.'],
      ['A second tail', 'Fish streaming in one piece at a time showed a late tail over the jointed copy. Fish now stream as one piece and are redrawn if they ever gain a part.'],
      ['Two projects, one machine', 'Another game\'s sync server once overwrote this one\'s code. Every name here is now namespaced and it syncs on its own port.'],
    ],
    numbers: [['174', 'commits since 25 Sep 2026'], ['153', 'Luau files'], ['23', 'caves'], ['8', 'bosses']],
  },
  {
    slug: 'creature-collector',
    kind: 'game',
    title: 'Creature Collector',
    short: 'Co-op creature catching by day, defending camp from a monster by night. The server owns everything.',
    year: '2026',
    role: 'Solo: design doc, systems, code',
    ink: ['moss', 'violet'],
    tags: ['Luau', 'Roblox', 'Server authority', 'Market research'],
    lede:
      'A co-op game for squads of one to four: catch creatures by day, hold your camp against a monster at night. It started from a design doc with market research on what keeps Roblox players coming back for a second week.',
    demo: 'server',
    demoNote: 'You are the client. Try to cheat. The server has the final say on every coin, creature and roll.',
    built: [
      'A server authoritative design: the client only draws the world and sends intents, the server checks every one.',
      'Services started in a fixed boot order, with debug commands that reach live server state during playtests.',
      'Creatures and props generated as 3D meshes in Studio and rebuilt from their asset ids when the server boots.',
      'A design doc built on research into the most played Roblox games, aimed at week two retention and playing with friends.',
    ],
    hard: [
      ['Testing through a live engine', 'Debug commands go through a bindable function in Studio so tests read the real running services instead of fresh copies of them.'],
    ],
    numbers: [['114', 'commits'], ['93', 'Luau files'], ['18,189', 'lines'], ['1 to 4', 'players a squad']],
  },
  {
    slug: 'bonk-a-brainrot',
    kind: 'game',
    title: 'Bonk a Brainrot',
    short: 'A party fighter above the goo. Every bonk raises your percent, and the higher it gets the farther you fly.',
    year: '2026',
    role: 'Solo',
    ink: ['pink', 'yolk'],
    tags: ['Luau', 'Roblox', 'Physics', 'Monetisation'],
    lede:
      'Grab a bat and fight on a floating island above the goo. Hits raise your percent, knockback grows with it, the floor crumbles every round, and the last one standing wins.',
    demo: 'bonk',
    demoNote: 'Arrow keys or A and D to move, W to jump, Space to bonk. Watch the percent.',
    built: [
      'Knockback that scales with damage taken, so big hits late in a round turn into home runs.',
      'An island that falls apart tile by tile each round.',
      'Seven modes including low gravity and a mega bonk mode, power ups, sixteen pets from two eggs, daily rewards and a wins leaderboard.',
      'The store page, game passes and developer products, written and designed for launch.',
    ],
    hard: [],
    numbers: [['7', 'modes'], ['16', 'pets'], ['12 to 16', 'players a server']],
  },
];

export const earlier = [
  { title: 'CandieZ', text: 'Server authoritative trading for a live Roblox game past 10 million plays.' },
];

// Every skill points at where it was used, so nobody has to take my word for it.
export const skills = [
  { group: 'Web', items: [
    ['JavaScript', ['written-in-real-stars', 'ad-factory', 'bigger-card-images', 'site']],
    ['WebGL and GLSL', ['written-in-real-stars', 'site']],
    ['three.js', ['written-in-real-stars']],
    ['Canvas', ['site', 'ad-factory']],
    ['HTML and CSS', ['written-in-real-stars', 'den124-cheat-sheet', 'site']],
    ['Print CSS', ['den124-cheat-sheet', 'site']],
  ]},
  { group: 'Back end', items: [
    ['Node and Express', ['written-in-real-stars']],
    ['Stripe', ['written-in-real-stars']],
    ['Webhooks and REST APIs', ['written-in-real-stars']],
    ['Signed URLs', ['written-in-real-stars']],
    ['Content-Security-Policy', ['written-in-real-stars']],
    ['Docker, Render, Fly.io', ['written-in-real-stars']],
  ]},
  { group: 'Games', items: [
    ['Luau', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
    ['Roblox Studio', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
    ['Rojo, Selene, StyLua', ['tides-of-qingdao', 'creature-collector']],
    ['Procedural animation', ['tides-of-qingdao', 'site']],
    ['Server authority', ['creature-collector', 'written-in-real-stars']],
    ['Game design', ['tides-of-qingdao', 'creature-collector', 'bonk-a-brainrot']],
  ]},
  { group: 'Everything else', items: [
    ['Python', ['bigger-card-images', 'ad-factory']],
    ['Qt', ['bigger-card-images']],
    ['On device ML', ['written-in-real-stars']],
    ['Headless Chrome', ['ad-factory']],
    ['ffmpeg', ['ad-factory']],
    ['Git', ['written-in-real-stars', 'tides-of-qingdao', 'creature-collector', 'site']],
  ]},
];

export const fashion = {
  blurb: 'The other thing I put together by hand. Dress little Me while you are here.',
  // Add real looks like this and they appear as a lookbook:
  // { src: 'assets/fashion/look-01.jpg', caption: 'Look 01: ...' }
  looks: [],
};

export const all = [...work, ...games];
export const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
