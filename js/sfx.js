// Every sound on the site is synthesised here, so there are no audio files.
// Nothing plays until you have clicked or pressed a key, and the SND button on
// the elevator panel switches it all off (remembered for next time).

let ctx = null, master = null, noiseBuf = null;
let on = localStorage.getItem('sm-sound') !== 'off';

export const sound = {
  get on() { return on; },
  set(v) { on = v; localStorage.setItem('sm-sound', v ? 'on' : 'off'); },
};

export function unlockSound() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no audio, no problem */ }
}

const ready = () => ctx && on && ctx.state === 'running';

function tone(freq, dur, { type = 'square', vol = 0.3, slide = 1, at = 0 } = {}) {
  if (!ready()) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.03);
}

function noise(dur, { vol = 0.2, freq = 2000, q = 1, sweep = 1, at = 0 } = {}) {
  if (!ready()) return;
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf;
  f.type = 'bandpass';
  f.frequency.setValueAtTime(freq, t);
  if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  f.Q.value = q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t, Math.random() * 0.5, dur + 0.05);
}

let lastStep = 0, lastSpray = 0, lastType = 0;
export const sfx = {
  blip: () => tone(988, 0.07, { vol: 0.12 }),
  type: () => { const n = performance.now(); if (n - lastType < 45) return; lastType = n; tone(1400 + Math.random() * 500, 0.025, { vol: 0.045 }); },
  step: () => { const n = performance.now(); if (n - lastStep < 140) return; lastStep = n; noise(0.035, { vol: 0.09, freq: 700, q: 2 }); },
  jump: () => tone(260, 0.2, { vol: 0.1, slide: 2.4 }),
  land: () => noise(0.07, { vol: 0.12, freq: 300 }),
  spray: () => { const n = performance.now(); if (n - lastSpray < 110) return; lastSpray = n; noise(0.09, { vol: 0.07, freq: 3200, q: 0.7 }); },
  build: () => tone(330 + Math.random() * 330, 0.045, { vol: 0.05 }),
  ding: () => { tone(1318.5, 0.6, { type: 'sine', vol: 0.18 }); tone(1046.5, 0.9, { type: 'sine', vol: 0.16, at: 0.17 }); },
  whoosh: () => noise(1.1, { vol: 0.12, freq: 300, q: 0.6, sweep: 5 }),
  shatter: () => { noise(0.7, { vol: 0.35, freq: 2600, q: 0.4, sweep: 0.3 }); tone(90, 0.5, { type: 'sine', vol: 0.3, slide: 0.5 }); for (let i = 0; i < 8; i++) tone(1800 + Math.random() * 2400, 0.08, { vol: 0.04, at: 0.15 + i * 0.07 }); },
  suck: () => tone(200, 0.6, { type: 'sawtooth', vol: 0.04, slide: 3 }),
};
