// Creature Collector: you are the client, try to cheat.
//
// The client can only send intents ("I want to catch that"). The server owns
// every coin, creature and roll, checks each intent against its own state, and
// sends back what really happened. The client's view only changes when the
// server says so.

import { stage, loop, el, INK } from './kit.js';

export function mount(host) {
  host.style.background = '#17141c';
  host.style.display = 'grid';
  host.style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,1.15fr)';

  const server = {
    coins: 120,
    owned: ['Mossling', 'Embercub'],
    player: { x: 40 },
    creatures: { 'mossling-14': { kind: 'Mossling', x: 44 }, 'glimmer-03': { kind: 'Glimmerfin', x: 340 } },
    lastIntent: 0,
    burst: 0,
  };
  let view = JSON.parse(JSON.stringify({ coins: server.coins, owned: server.owned }));

  const left = el('div', { style: 'position:relative;padding:18px;color:#fbfaf6;border-right:1.5px solid #fbfaf6;overflow:auto' });
  const right = el('div', { style: 'position:relative;overflow:hidden' });
  host.append(left, right);
  const narrow = () => {
    const n = host.clientWidth < 640;
    host.style.gridTemplateColumns = n ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1.15fr)';
    host.style.gridTemplateRows = n ? 'auto minmax(260px,1fr)' : '';
    host.style.height = n ? '820px' : '';
    left.style.borderRight = n ? '0' : '1.5px solid #fbfaf6';
    left.style.borderBottom = n ? '1.5px solid #fbfaf6' : '0';
  };
  const nro = new ResizeObserver(narrow);
  nro.observe(host);

  left.innerHTML = `
    <h4 style="margin:0 0 6px;font:400 11px/1 Silkscreen,monospace;color:#7fe3b0">CLIENT (YOU)</h4>
    <p style="margin:0 0 14px;font:400 12px/1.5 'Martian Mono',monospace;color:#b9b4c0">What you can see. You can ask for anything.</p>
    <div class="cc-view" style="font:400 12px/1.6 'Martian Mono',monospace;margin-bottom:14px"></div>
    <div class="cc-actions"></div>`;
  const viewEl = left.querySelector('.cc-view');
  const actions = left.querySelector('.cc-actions');
  const ACTIONS = [
    ['catch', 'Catch the Mossling next to you', false],
    ['coins', 'Set my coins to 999,999', true],
    ['far', 'Catch the Glimmerfin 300 studs away', true],
    ['trade', 'Trade away a Voidwyrm I do not own', true],
    ['roll', 'Open an egg and say it was mythic', true],
    ['spam', 'Send 50 catches in one second', true],
  ];
  actions.innerHTML = ACTIONS.map(([k, label, bad]) => `<button class="dbtn${bad ? ' is-bad' : ''}" data-a="${k}" style="display:flex;width:100%">${bad ? 'CHEAT: ' : ''}${label}</button>`).join('');

  const renderView = () => {
    viewEl.innerHTML = `<div>coins <b style="color:#ffc414">${view.coins.toLocaleString()}</b></div><div>creatures <b style="color:#ffc414">${view.owned.join(', ')}</b></div>`;
  };
  renderView();

  // the wire between them, drawn on a canvas, with the server log on top
  const s = stage(right);
  s.c.style.position = 'absolute'; s.c.style.inset = '0';
  const logBox = el('div', { style: 'position:absolute;left:18px;right:18px;top:64px;bottom:14px;overflow:hidden' });
  logBox.innerHTML = `<ul class="dlog" aria-live="polite" style="color:#fbfaf6"></ul>`;
  right.appendChild(logBox);
  const head = el('div', { style: 'position:absolute;left:18px;top:18px;color:#fbfaf6' }, `<h4 style="margin:0 0 6px;font:400 11px/1 Silkscreen,monospace;color:#ffc414">SERVER (THE TRUTH)</h4><p style="margin:0;font:400 12px/1.5 'Martian Mono',monospace;color:#b9b4c0">Owns every coin, creature and roll.</p>`);
  right.appendChild(head);
  const log = logBox.querySelector('.dlog');
  const packets = [];

  const write = (cls, html) => {
    log.prepend(el('li', { class: cls }, html));
    while (log.children.length > 14) log.lastChild.remove();
  };
  const send = (payload) => new Promise((res) => {
    packets.push({ t: 0, payload, res });
  });

  async function handle(kind) {
    const now = performance.now();
    if (kind === 'spam') {
      write('dim', 'received 50 x <code>{"intent":"catch"}</code> in 1s');
      write('no', 'RATE LIMIT: 1 catch every 0.8s. 49 dropped, 1 checked.');
      kind = 'catch';
    }
    if (kind === 'catch') {
      const c = server.creatures['mossling-14'];
      if (!c) { write('no', 'REJECT: that Mossling is already in your camp'); return; }
      const d = Math.abs(c.x - server.player.x);
      write('', `CHECK distance ${d.toFixed(1)} studs, limit 12`);
      write('', 'CHECK roll catch chance on the server: <code>0.72</code> vs <code>0.41</code>');
      server.owned.push('Mossling'); server.coins += 10; delete server.creatures['mossling-14'];
      write('ok', 'GRANT Mossling, +10 coins. SYNC sent.');
      view = { coins: server.coins, owned: [...server.owned] };
    } else if (kind === 'coins') {
      write('no', 'REJECT: there is no intent called setCoins. Coins only move on the server.');
    } else if (kind === 'far') {
      const d = Math.abs(server.creatures['glimmer-03'].x - server.player.x);
      write('', `CHECK distance ${d.toFixed(1)} studs, limit 12`);
      write('no', 'REJECT: out of reach. Your position is the server\'s, not yours.');
    } else if (kind === 'trade') {
      write('', 'CHECK owner of Voidwyrm: <code>nobody in this squad</code>');
      write('no', 'REJECT: you cannot trade what you do not own.');
    } else if (kind === 'roll') {
      write('dim', 'ignored field <code>result:"mythic"</code>');
      const r = Math.random();
      const tier = r < 0.02 ? 'Mythic' : r < 0.12 ? 'Rare' : 'Common';
      server.coins -= 25;
      write(tier === 'Mythic' ? 'ok' : '', `ROLL on the server: <code>${r.toFixed(3)}</code> = ${tier}. -25 coins.`);
      view.coins = server.coins;
    }
    renderView();
    server.lastIntent = now;
  }

  const payloads = {
    catch: '{"intent":"catch","id":"mossling-14"}',
    coins: '{"intent":"setCoins","value":999999}',
    far: '{"intent":"catch","id":"glimmer-03"}',
    trade: '{"intent":"trade","give":"Voidwyrm"}',
    roll: '{"intent":"openEgg","result":"mythic"}',
    spam: '{"intent":"catch"} x50',
  };
  let busy = false;
  actions.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || busy) return;
    busy = true;
    actions.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    write('dim', `<code>${payloads[b.dataset.a]}</code>`);
    await send(payloads[b.dataset.a]);
    await handle(b.dataset.a);
    busy = false;
    actions.querySelectorAll('button').forEach((x) => { x.disabled = false; });
  });

  const stop = loop(host, (dt, t) => {
    const { g, w, h } = s;
    g.clearRect(0, 0, w, h);
    // a dotted wire along the left edge, from the client into the server
    const y = h * 0.5;
    g.strokeStyle = 'rgba(251,250,246,.25)'; g.setLineDash([3, 6]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(14, y); g.stroke(); g.setLineDash([]);
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt / 0.55;
      const x = -8 + p.t * 26;
      g.fillStyle = INK.yolk; g.fillRect(x - 5, y - 5, 10, 10);
      g.fillStyle = INK.pink; g.fillRect(x - 2, y - 2, 4, 4);
      if (p.t >= 1) { packets.splice(i, 1); p.res(); }
    }
    // scanlines, for the feeling of a terminal
    g.fillStyle = 'rgba(255,255,255,.025)';
    for (let yy = (t * 20) % 4; yy < h; yy += 4) g.fillRect(0, yy, w, 1);
  });

  write('dim', 'server up. 2 creatures nearby. waiting for intents.');
  return () => { stop(); s.destroy(); nro.disconnect(); };
}
