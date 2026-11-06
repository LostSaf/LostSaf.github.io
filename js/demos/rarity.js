// Every catch in Tides of Qingdao is rolled on the server by shared/Rarity.luau.
// This is that module in JavaScript: the same tier weights and luck powers, the
// same mutation odds tried rarest first, the same Box-Muller size roll and the
// same value and score maths. Luck runs from 1 to 10, as boosts do in game.

import { el } from './kit.js';
import { sfx } from '../sfx.js';

const TIERS = [
  { Id: 'Common', Weight: 60, LuckPower: 0, Value: 1, Score: 1, Color: 'rgb(220,220,215)' },
  { Id: 'Uncommon', Weight: 25, LuckPower: 0.5, Value: 1.5, Score: 2, Color: 'rgb(110,210,110)' },
  { Id: 'Rare', Weight: 10, LuckPower: 0.8, Value: 2.5, Score: 4, Color: 'rgb(80,160,255)' },
  { Id: 'Epic', Weight: 4, LuckPower: 1, Value: 5, Score: 8, Color: 'rgb(185,100,255)' },
  { Id: 'Legendary', Weight: 0.9, LuckPower: 1, Value: 12, Score: 16, Color: 'rgb(255,180,50)' },
  { Id: 'Mythic', Weight: 0.1, LuckPower: 1, Value: 40, Score: 40, Color: 'rgb(255,70,110)' },
];
const MUTATIONS = [
  { Id: 'Golden', OneIn: 60, Value: 3, Score: 2, Color: 'rgb(255,205,60)' },
  { Id: 'Albino', OneIn: 80, Value: 2.5, Score: 2, Color: 'rgb(250,248,245)' },
  { Id: 'Glowing', OneIn: 100, Value: 3, Score: 2.5, Color: 'rgb(120,255,220)' },
  { Id: 'Giant', OneIn: 120, Value: 2.5, Score: 2.5, SizeMul: 2.5, Color: 'rgb(255,150,90)' },
  { Id: 'Shadow', OneIn: 250, Value: 5, Score: 4, Color: 'rgb(110,60,170)' },
  { Id: 'Rainbow', OneIn: 1000, Value: 10, Score: 8, Color: 'rgb(255,120,200)' },
];
const MAX_LUCK = 10;
const SIZE = { Spread: 0.28, Min: 0.5, Max: 3 };
const TIER_SIZE = { Legendary: 1.2, Mythic: 1.4 };
const SPECIES = {
  'Jiaozhou Bay': ['Fat Greenling', 'Red Seabream', 'Blue Swimming Crab', 'Spanish Mackerel', 'Olive Flounder', 'Baby Octopus', 'Golden Cuttlefish', 'Black Rockfish', 'Mantis Shrimp', 'Yellow Croaker', 'Hairtail', 'Conger Eel'],
  'Yellow Sea Cold Current': ['Japanese Flying Squid', 'Pacific Cod', 'Monkfish', 'Greater Amberjack', 'Yesso Scallop'],
  'South China Sea Reef': ['Parrotfish', 'Leopard Coral Grouper', 'Crimson Snapper', 'Painted Spiny Lobster', 'Abalone', 'Red Lionfish'],
  'Sunken Village': ['Silver Pomfret', 'Moray Eel', 'Spiky Sea Cucumber', 'Slipper Lobster'],
  "Dragon King's Trench": ['Lanternfish', 'Ghost Shark', 'Giant Isopod', 'Giant Oarfish', 'Vampire Squid'],
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function odds(luck) {
  luck = clamp(luck, 1, MAX_LUCK);
  const w = TIERS.map((t) => t.Weight * luck ** t.LuckPower);
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / total);
}
const mutationChance = (m, luck) => Math.min(0.5, clamp(luck, 1, MAX_LUCK) / m.OneIn);
function rollTier(luck) {
  const o = odds(luck);
  let roll = Math.random();
  for (let i = o.length - 1; i >= 0; i--) { roll -= o[i]; if (roll <= 0) return i; } // rarest down, as in the Luau
  return 0;
}
function rollMutation(luck) {
  for (let i = MUTATIONS.length - 1; i >= 0; i--) if (Math.random() < mutationChance(MUTATIONS[i], luck)) return MUTATIONS[i];
  return null;
}
function rollSize(tier, mutation) {
  const u1 = Math.max(Math.random(), 1e-6), u2 = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let f = clamp(Math.exp(normal * SIZE.Spread), SIZE.Min, SIZE.Max);
  f *= TIER_SIZE[TIERS[tier].Id] || 1;
  if (mutation && mutation.SizeMul) f *= mutation.SizeMul;
  return f;
}
const valueMul = (tier, m, size) => TIERS[tier].Value * (m ? m.Value : 1) * clamp(size, 0.7, 2);
const score = (tier, m) => Math.floor(TIERS[tier].Score * (m ? m.Score : 1) * 10);
const nameOf = (fish, tier, m) => [m && m.Id, tier > 0 && TIERS[tier].Id, fish].filter(Boolean).join(' ');

const pct = (p) => (p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.001 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);

export function mount(host) {
  host.style.background = '#0d2f4a url(media/tides/thumbnail-2-dive.jpg) center / cover';
  host.style.touchAction = 'auto';
  const box = el('div', { style: 'position:absolute;inset:0;overflow:auto;padding:16px;background:linear-gradient(90deg,rgba(6,20,36,.92) 0 52%,rgba(6,20,36,.55));color:#eaf6ff;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;font-family:var(--f-text)' });
  host.appendChild(box);
  const regions = Object.keys(SPECIES);
  box.innerHTML = `
    <div>
      <label style="display:flex;align-items:center;gap:10px;font:400 22px/1 var(--f-sign)">LUCK x<b data-l style="color:#ffcf3f;min-width:26px">1</b>
        <input type="range" min="1" max="10" step="0.5" value="1" data-luck style="flex:1;accent-color:#ffcf3f"></label>
      <div data-odds style="margin-top:12px;display:grid;gap:6px"></div>
      <div style="margin-top:14px;font:400 18px/1 var(--f-sign);color:#9fd0ff">MUTATIONS, PER FISH</div>
      <div data-mut style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font:400 13px/1.4 var(--f-mono)"></div>
    </div>
    <div style="display:grid;gap:12px;align-content:start">
      <label style="font:400 13px/1.3 var(--f-mono)">Sea <select data-region style="margin-left:6px;font:inherit;background:#0b1b2e;color:#eaf6ff;border:2px solid #9fd0ff;padding:3px 6px">${regions.map((r) => `<option>${r}</option>`).join('')}</select></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="key" data-roll>Spear a fish</button><button class="key" data-many>Spear 10,000</button></div>
      <div data-card style="min-height:150px"></div>
      <div data-hist style="font:400 12.5px/1.5 var(--f-mono)"></div>
    </div>`;
  const q = (s) => box.querySelector(s);
  let luck = 1;

  const drawOdds = () => {
    const o = odds(luck);
    q('[data-odds]').innerHTML = TIERS.map((t, i) => `
      <div style="display:grid;grid-template-columns:96px 1fr 70px;gap:8px;align-items:center;font:400 13px/1 var(--f-mono)">
        <b style="font:400 19px/1 var(--f-sign);color:${t.Color}">${t.Id}</b>
        <span style="height:14px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.25)"><i style="display:block;height:100%;width:${Math.max(0.6, o[i] * 100)}%;background:${t.Color};transition:width .3s"></i></span>
        <span style="text-align:right">${pct(o[i])}</span>
      </div>`).join('');
    q('[data-mut]').innerHTML = MUTATIONS.map((m) => `<span><b style="color:${m.Color}">${m.Id}</b> 1 in ${Math.round(1 / mutationChance(m, luck))}</span>`).join('');
    q('[data-l]').textContent = luck;
  };
  drawOdds();
  q('[data-luck]').addEventListener('input', (e) => { luck = +e.target.value; drawOdds(); });

  const spear = () => {
    const pool = SPECIES[q('[data-region]').value];
    const fish = pool[(Math.random() * pool.length) | 0];
    const tier = rollTier(luck), m = rollMutation(luck), size = rollSize(tier, m);
    const t = TIERS[tier];
    q('[data-card]').innerHTML = `
      <div style="background:#fffaf0;color:#1b1a22;border:4px solid ${m ? m.Color : t.Color};border-radius:14px;padding:14px 16px;box-shadow:0 6px 0 rgba(0,0,0,.4);animation:dlog-in .3s">
        <div style="font:400 15px/1 var(--f-sign);color:#8a5a2b">${tier >= 3 ? 'ANNOUNCED TO THE SERVER' : 'CAUGHT'}</div>
        <div style="font:400 30px/1 var(--f-sign);margin-top:6px;color:${tier ? '#1b1a22' : '#1b1a22'}">${nameOf(fish, tier, m)}</div>
        <div style="margin-top:8px;font:400 13px/1.6 var(--f-mono)">size x${size.toFixed(2)} &nbsp;/&nbsp; worth x${valueMul(tier, m, size).toFixed(2)} &nbsp;/&nbsp; score ${score(tier, m)}</div>
      </div>`;
    if (tier >= 3 || m) sfx.ding(); else sfx.blip();
  };
  const many = () => {
    const n = 10000, counts = TIERS.map(() => 0), mc = {};
    for (let i = 0; i < n; i++) { counts[rollTier(luck)]++; const m = rollMutation(luck); if (m) mc[m.Id] = (mc[m.Id] || 0) + 1; }
    const o = odds(luck);
    q('[data-hist]').innerHTML = `<b style="font:400 18px/1 var(--f-sign);color:#ffcf3f">10,000 CATCHES AT LUCK x${luck}</b><br>` +
      TIERS.map((t, i) => `<span style="color:${t.Color}">${t.Id}</span> ${counts[i]} <span style="opacity:.6">(expected ${Math.round(o[i] * n)})</span>`).join('<br>') +
      '<br>' + MUTATIONS.map((m) => `${m.Id} ${mc[m.Id] || 0}`).join(', ');
    sfx.blip();
  };
  q('[data-roll]').addEventListener('click', spear);
  q('[data-many]').addEventListener('click', many);
  spear();
  const ro = new ResizeObserver(() => { box.style.gridTemplateColumns = host.clientWidth < 640 ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)'; });
  ro.observe(host);
  return () => ro.disconnect();
}
