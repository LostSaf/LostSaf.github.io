// Creature Collector's catch, and the server that owns it.
//
// The ring is shared/Logic/Catch.luau ported line for line: the client draws
// with it and the server grades with it, so a press is judged the same on both
// sides. The numbers are the game's own (Config.Creatures.Catch, Capture and
// Net.RateLimits). The server log shows every check the real server makes.

import { el } from './kit.js';
import { sfx } from '../sfx.js';

const RULES = { LeadInSeconds: 0.8, TurnsPerRound: 2, PerfectShare: 1 / 3, MinZoneOffsetDegrees: 90, MaxChance: 0.95, LagGraceSeconds: 0.5, Shakes: 3 };
const BY_RARITY = {
  Common: { Hits: 1, ZoneDegrees: 100, TurnsPerSecond: 0.6, Chance: 1, PerfectBonus: 0, RunChance: 0 },
  Uncommon: { Hits: 2, ZoneDegrees: 75, TurnsPerSecond: 0.75, Chance: 0.85, PerfectBonus: 0.05, RunChance: 0 },
  Rare: { Hits: 3, ZoneDegrees: 55, TurnsPerSecond: 0.9, Chance: 0.65, PerfectBonus: 0.08, RunChance: 0.15 },
  Epic: { Hits: 3, ZoneDegrees: 40, TurnsPerSecond: 1.1, Chance: 0.5, PerfectBonus: 0.1, RunChance: 0.25 },
};
const COLORS = { Common: '#c8c8c8', Uncommon: '#6ec85a', Rare: '#5096f0', Epic: '#b45ae6' };
const CREATURES = [['Mossling', 'Common', 'Light'], ['Reedwing', 'Uncommon', 'Alarm'], ['Glowmoth', 'Rare', 'Light'], ['Thornback', 'Epic', 'Guard']];
const CAPTURE = { MaxDistance: 12, DistanceGraceStuds: 4, CooldownSeconds: 1, InventoryCap: 200 };
const PRESS_LIMIT = { Burst: 6, RefillPerSecond: 4 };
const SIZES = [['Small', 35], ['Normal', 45], ['Large', 16], ['Giant', 4]];

// ---- shared/Logic/Catch.luau
const Catch = {
  challenge: (d) => ({ hits: d.Hits, zoneDegrees: d.ZoneDegrees, turnsPerSecond: d.TurnsPerSecond, leadIn: RULES.LeadInSeconds, turnsPerRound: RULES.TurnsPerRound, perfectShare: RULES.PerfectShare,
    offsets: Array.from({ length: d.Hits }, () => RULES.MinZoneOffsetDegrees + Math.random() * (360 - 2 * RULES.MinZoneOffsetDegrees)) }),
  markerAngle: (c, t) => (t <= c.leadIn ? 0 : (((t - c.leadIn) * c.turnsPerSecond * 360) % 360)),
  zoneCenter: (c, round, roundStart) => (Catch.markerAngle(c, roundStart) + c.offsets[round - 1]) % 360,
  angleBetween: (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; },
  start: (c) => ({ round: 1, roundStart: c.leadIn, perfects: 0, done: false, failed: false }),
  deadline: (c, s) => s.roundStart + c.turnsPerRound / c.turnsPerSecond,
  grade(c, s, t) {
    if (t < s.roundStart || t > Catch.deadline(c, s)) return 'Miss';
    const off = Catch.angleBetween(Catch.markerAngle(c, t), Catch.zoneCenter(c, s.round, s.roundStart));
    const half = c.zoneDegrees / 2;
    return off <= half * c.perfectShare ? 'Perfect' : off <= half ? 'Good' : 'Miss';
  },
  press(c, s, t, elapsed, lag) {
    if (s.done || s.failed) return null;
    if (t !== t || t > elapsed + lag || t < 0) return null;
    if (s.round > 1 && t < s.roundStart) return null;
    const g = Catch.grade(c, s, t);
    if (g === 'Miss') s.failed = true;
    else { if (g === 'Perfect') s.perfects++; if (s.round >= c.hits) s.done = true; else { s.round++; s.roundStart = t; } }
    return g;
  },
  expired: (c, s, elapsed, lag) => !s.done && !s.failed && elapsed > Catch.deadline(c, s) + lag,
  chance: (d, perfects, net, max) => (d.Chance >= 1 ? 1 : Math.min(d.Chance + perfects * d.PerfectBonus + net, max)),
};

export function mount(host) {
  host.style.background = '#101a2c url(media/cc/thumb-camp-a.jpg) center / cover';
  host.style.touchAction = 'auto';
  const box = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);background:rgba(8,12,26,.82);color:#eef3ff;font-family:var(--f-text)' });
  host.appendChild(box);
  box.innerHTML = `
    <div data-left style="position:relative;display:grid;grid-template-rows:auto 1fr auto;padding:14px;border-right:3px solid #eef3ff;min-height:0">
      <div style="display:flex;gap:6px;flex-wrap:wrap" data-pick>${CREATURES.map(([n, r], i) => `<button class="key" data-c="${i}" style="font-size:16px;padding:5px 9px 3px;box-shadow:0 3px 0 #000;border-color:#000;background:${COLORS[r]}">${n}</button>`).join('')}</div>
      <canvas data-ring style="width:100%;height:100%;min-height:220px;cursor:pointer"></canvas>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="dbtn is-bad" data-cheat="future">Cheat: press from the future</button>
        <button class="dbtn is-bad" data-cheat="far">Cheat: catch from 40 studs</button>
        <button class="dbtn is-bad" data-cheat="mash">Cheat: mash 20 presses</button>
        <button class="dbtn is-bad" data-cheat="claim">Cheat: just say it was caught</button>
      </div>
    </div>
    <div style="display:grid;grid-template-rows:auto 1fr;min-height:0;padding:14px 16px">
      <div><b style="font:400 22px/1 var(--f-sign);color:#ffcf3f">SERVER</b> <span style="font:400 13px var(--f-mono);color:#9fb0d0">owns every coin, creature and roll</span>
        <div data-inv style="margin-top:6px;font:400 13px/1.4 var(--f-mono);color:#cfd8ee"></div></div>
      <ul class="dlog" data-log style="overflow:auto;min-height:0;margin-top:8px"></ul>
    </div>`;
  const q = (s) => box.querySelector(s);
  const log = q('[data-log]');
  const write = (cls, html) => { log.prepend(el('li', { class: cls }, html)); while (log.children.length > 40) log.lastChild.remove(); };
  const canvas = q('[data-ring]');
  const g = canvas.getContext('2d');

  const inv = { creatures: [] };
  const drawInv = () => { q('[data-inv]').innerHTML = `camp ${inv.creatures.length}/${CAPTURE.InventoryCap} ${inv.creatures.slice(-3).map((c) => `<span style="color:${COLORS[c.rarity]}">${c.name}#${c.id}</span>`).join(' ')}`; };
  drawInv();
  let bucket = PRESS_LIMIT.Burst, bucketAt = performance.now(), lastCapture = -10;
  const take = () => {
    const now = performance.now();
    bucket = Math.min(PRESS_LIMIT.Burst, bucket + ((now - bucketAt) / 1000) * PRESS_LIMIT.RefillPerSecond);
    bucketAt = now;
    if (bucket >= 1) { bucket -= 1; return true; }
    return false;
  };

  let pick = 0, catching = null, raf = 0, flash = null;
  const begin = (distance = 4.1) => {
    const [name, rarity] = CREATURES[pick];
    const now = performance.now() / 1000;
    write('dim', `<code>{"intent":"capture","id":"${name.toLowerCase()}-${(Math.random() * 900 + 100) | 0}"}</code>`);
    const limit = CAPTURE.MaxDistance + CAPTURE.DistanceGraceStuds;
    if (distance > limit) { write('no', `REJECT distance ${distance.toFixed(1)} studs, limit ${CAPTURE.MaxDistance} + ${CAPTURE.DistanceGraceStuds} grace. Your position is the server's.`); sfx.land(); return; }
    write('', `CHECK distance ${distance.toFixed(1)} studs, limit ${CAPTURE.MaxDistance} + ${CAPTURE.DistanceGraceStuds} grace`);
    if (now - lastCapture < CAPTURE.CooldownSeconds) { write('no', `REJECT cooldown: one capture a second`); return; }
    const d = BY_RARITY[rarity];
    const c = Catch.challenge(d);
    catching = { name, rarity, d, c, s: Catch.start(c), t0: performance.now(), result: null };
    write('', `START ${rarity} ring: ${d.Hits} hit${d.Hits > 1 ? 's' : ''}, ${d.ZoneDegrees} degree zone, ${d.TurnsPerSecond} turns a second`);
    host.focus({ preventScroll: true });
  };

  const press = (tClient) => {
    if (!catching || catching.result) return;
    const elapsed = (performance.now() - catching.t0) / 1000 + 0.06; // the press arrives a little after it was made
    if (!take()) { write('no', `DROP press: rate limit, burst ${PRESS_LIMIT.Burst}, refills ${PRESS_LIMIT.RefillPerSecond} a second`); return; }
    const t = tClient ?? (performance.now() - catching.t0) / 1000;
    const g2 = Catch.press(catching.c, catching.s, t, elapsed, RULES.LagGraceSeconds);
    if (g2 === null) { write('no', `REFUSE press at t=${t.toFixed(2)}s: the server's clock says ${elapsed.toFixed(2)}s, more than ${RULES.LagGraceSeconds}s of lag grace`); sfx.land(); return; }
    write(g2 === 'Miss' ? 'no' : 'ok', `PRESS t=${t.toFixed(2)}s graded on the server: ${g2}`);
    flash = { text: g2.toUpperCase(), at: performance.now(), color: g2 === 'Perfect' ? '#ffcf3f' : g2 === 'Good' ? '#7fe3b0' : '#ff8fb8' };
    if (g2 !== 'Miss') sfx.build(); else sfx.land();
    if (catching.s.failed) { catching.result = 'broke free'; write('no', `${catching.name} broke free. Try again in 2 seconds.`); }
    else if (catching.s.done) roll();
  };

  const roll = () => {
    const { d, s, name, rarity } = catching;
    const chance = Catch.chance(d, s.perfects, 0, RULES.MaxChance);
    const r = Math.random();
    write('', `ROLL on the server: ${r.toFixed(3)} against ${chance >= 1 ? 'a sure catch' : `${d.Chance} + ${s.perfects} perfect x ${d.PerfectBonus} = ${chance.toFixed(2)}`}`);
    if (r < chance) {
      let sum = 0; const sr = Math.random() * 100; const size = SIZES.find(([, w]) => (sum += w) >= sr)[0];
      const id = Math.random().toString(16).slice(2, 6);
      inv.creatures.push({ name, rarity, id });
      write('ok', `GRANT ${size} ${name}#${id}, a unique id so it can be traded later. SYNC sent.`);
      catching.result = 'caught'; lastCapture = performance.now() / 1000; sfx.ding();
    } else if (Math.random() < d.RunChance) {
      write('no', `${name} ran off. Rare ones do, ${Math.round(d.RunChance * 100)}% of the time.`); catching.result = 'ran';
    } else { write('no', `${name} broke out of the ball.`); catching.result = 'broke out'; }
    drawInv();
  };

  const draw = () => {
    raf = requestAnimationFrame(draw);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2;
    g.lineWidth = 16; g.strokeStyle = 'rgba(255,255,255,.14)';
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    if (!catching) {
      g.fillStyle = '#eef3ff'; g.font = '400 24px "Jersey 10"'; g.textAlign = 'center';
      g.fillText('PICK A CREATURE', cx, cy - 4);
      g.font = '400 16px "Jersey 10"'; g.fillStyle = '#9fb0d0'; g.fillText('then SPACE or click when the marker is in the green', cx, cy + 20);
      g.textAlign = 'left';
      return;
    }
    const { c, s } = catching;
    const t = (performance.now() - catching.t0) / 1000;
    if (!catching.result && Catch.expired(c, s, t, RULES.LagGraceSeconds)) { catching.result = 'too slow'; write('no', 'Round ran out: the marker went round twice.'); }
    const rad = (deg) => (deg - 90) * Math.PI / 180;
    if (!s.done && !s.failed) {
      const center = Catch.zoneCenter(c, s.round, s.roundStart), half = c.zoneDegrees / 2;
      g.strokeStyle = '#4fc76a'; g.lineWidth = 16;
      g.beginPath(); g.arc(cx, cy, R, rad(center - half), rad(center + half)); g.stroke();
      g.strokeStyle = '#ffcf3f';
      g.beginPath(); g.arc(cx, cy, R, rad(center - half * c.perfectShare), rad(center + half * c.perfectShare)); g.stroke();
    }
    const a = rad(Catch.markerAngle(c, t));
    g.strokeStyle = '#fff'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22)); g.lineTo(cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22)); g.stroke();
    g.textAlign = 'center';
    g.fillStyle = COLORS[catching.rarity]; g.font = '400 28px "Jersey 10"';
    g.fillText(catching.name.toUpperCase(), cx, cy - 6);
    g.fillStyle = '#cfd8ee'; g.font = '400 17px "Jersey 10"';
    g.fillText(catching.result ? catching.result.toUpperCase() : t < c.leadIn ? 'GET READY' : `HIT ${Math.min(s.round, c.hits)} OF ${c.hits}`, cx, cy + 18);
    if (flash && performance.now() - flash.at < 600) { g.fillStyle = flash.color; g.font = '400 34px "Jersey 10"'; g.fillText(flash.text, cx, cy - R - 18); }
    g.textAlign = 'left';
  };
  raf = requestAnimationFrame(draw);

  box.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]');
    if (c) { pick = +c.dataset.c; begin(); sfx.blip(); return; }
    if (e.target === canvas) { if (!catching || catching.result) begin(); else press(); return; }
    const ch = e.target.closest('[data-cheat]');
    if (!ch) return;
    const k = ch.dataset.cheat;
    if (k === 'far') begin(40);
    if (k === 'future') { if (!catching || catching.result) begin(); setTimeout(() => press((performance.now() - catching.t0) / 1000 + 2), 900); }
    if (k === 'mash') { if (!catching || catching.result) begin(); for (let i = 0; i < 20; i++) press(); }
    if (k === 'claim') { write('dim', '<code>{"intent":"caught","name":"Thornback"}</code>'); write('no', 'IGNORE: there is no remote for that. Catches are rolled on the server, never reported by the client.'); sfx.land(); }
  });
  const kd = (e) => { if (e.code === 'Space') { e.preventDefault(); if (!catching || catching.result) begin(); else press(); } };
  host.addEventListener('keydown', kd);
  const ro = new ResizeObserver(() => {
    const narrow = host.clientWidth < 680;
    box.style.gridTemplateColumns = narrow ? '1fr' : 'minmax(0,1fr) minmax(0,1.05fr)';
    box.style.gridTemplateRows = narrow ? 'minmax(0,1.2fr) minmax(0,1fr)' : '';
    q('[data-left]').style.borderRight = narrow ? '0' : '3px solid #eef3ff';
    q('[data-left]').style.borderBottom = narrow ? '3px solid #eef3ff' : '0';
  });
  ro.observe(host);
  write('dim', 'server up. Meadow and Forest spawning.');
  return () => { cancelAnimationFrame(raf); host.removeEventListener('keydown', kd); ro.disconnect(); };
}
