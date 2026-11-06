// ArtificialPersona, run in the browser.
//
// The real pipeline is Python on a GPU: Whisper hears you, an LLM translates,
// Bark or ElevenLabs speaks it, Wav2Lip moves your webcam face to match. Here
// the parts that are plain logic are ported from the repo as written (the
// phrase timing in audio_utils.py, the sentence buffer in tts_service.py, the
// translation request in translator.py, the frame Wav2Lip is fed in
// inference.py). The models are swapped for what a browser has, and each
// stand-in says so. The Source tab is the repo's own code.

import { el } from './kit.js';
import { sfx } from '../sfx.js';

// arg_parser.py defaults
const ARGS = { model: 'small', record_timeout: 1.2, phrase_timeout: 2.4, energy_threshold: 300, from_language: 'english', to_language: 'french', tts_model: 'elevenlabs', elevenlabs_voice: 'Rachel', bark_language: 'v2/en_speaker_6' };
const LANGS = { french: 'fr', spanish: 'es', german: 'de', italian: 'it', portuguese: 'pt', japanese: 'ja', chinese: 'zh', english: 'en' };
const FILES = ['main.py', 'arg_parser.py', 'audio_utils.py', 'transcriber.py', 'tts_service.py', 'translator.py', 'inference.py', 'video.py', 'player.py'];
const BASE = 'media/artificial-persona/';

// tts_service.py: is_sentence and get_complete_sentence, as written
const isSentence = (text) => /^[^.]*[^.0-9][.!?]$/.test(text);
function getCompleteSentence(sentences, state) {
  if (sentences.length >= 2 && isSentence(sentences[sentences.length - 1])) {
    let sentence = sentences.shift();
    while (sentences.length) sentence += sentences.shift();
    state.buffered = sentences.join(' ');
    return sentence;
  }
  return null;
}
// nltk.sent_tokenize, approximated: split after . ! or ? followed by a space
const sentTokenize = (text) => (text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map((s) => s.trim()).filter(Boolean);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KW = /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|in|not|and|or|is|None|True|False|self|lambda|yield|break|continue|pass|raise|global|async|await)\b/g;
function highlight(code) {
  // one pass over the raw text: comments, strings, then everything else
  const out = [];
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')/g;
  let last = 0, m;
  const plain = (s) => esc(s).replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#ffcf3f">$1</span>').replace(KW, '<b style="color:#ff9cc7">$1</b>');
  while ((m = re.exec(code))) {
    out.push(plain(code.slice(last, m.index)));
    out.push(m[1] ? `<span style="color:#8d8794">${esc(m[1])}</span>` : `<span style="color:#7fe3b0">${esc(m[2])}</span>`);
    last = re.lastIndex;
  }
  out.push(plain(code.slice(last)));
  return out.join('');
}

export function mount(host) {
  host.style.background = '#14111a';
  host.style.touchAction = 'auto';
  const root = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto auto 1fr;color:#eee9f5;font-family:var(--f-text);min-height:0' });
  host.appendChild(root);
  root.innerHTML = `
    <div style="display:flex;gap:6px;padding:10px 12px;border-bottom:3px solid #000;background:#1d1825;flex-wrap:wrap;align-items:center">
      <button class="key" data-tab="run" style="font-size:16px;padding:5px 10px 3px">Run the pipeline</button>
      <button class="key" data-tab="src" style="font-size:16px;padding:5px 10px 3px">Source</button>
      <span style="margin-left:auto;font:400 12px var(--f-mono);color:#9a94a2">GPL-3.0, <a href="https://github.com/david-courtis/ArtificialPersona" target="_blank" rel="noopener" style="color:#ffcf3f">github.com/david-courtis/ArtificialPersona</a></span>
    </div>
    <div data-stages style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:10px 12px;border-bottom:3px solid #000;overflow-x:auto"></div>
    <div data-body style="min-height:0;overflow:auto"></div>`;
  const q = (s) => root.querySelector(s);
  const STAGES = [
    ['MIC', 'Microphone at 48 kHz, energy threshold 300', 'your mic'],
    ['WHISPER', 'Whisper "small", noise reduced first', 'browser speech recognition'],
    ['SENTENCES', 'NLTK splits, only whole sentences go on', 'ported as written'],
    ['TRANSLATE', 'GPT-3.5, temperature 0.7', 'your browser\'s translator, if it has one'],
    ['VOICE', 'ElevenLabs multilingual v2 or Bark', 'your browser\'s voice'],
    ['WAV2LIP', 'Your webcam face, lip synced on a GPU', 'shows the frame it is fed'],
  ];
  q('[data-stages]').innerHTML = STAGES.map(([n, real, here], i) => `
    <div data-st="${i}" style="min-width:120px;border:2px solid #3a3346;background:#201b29;padding:7px 8px;transition:border-color .2s,background .2s">
      <b style="font:400 18px/1 var(--f-sign);color:#ffcf3f">${i + 1} ${n}</b>
      <div style="font-size:11.5px;line-height:1.35;margin-top:4px;color:#cfc9d8">${esc(real)}</div>
      <div style="font:400 11px/1.3 var(--f-mono);margin-top:4px;color:#7fe3b0">here: ${esc(here)}</div>
    </div>`).join('');
  const lit = (i, on = true) => { const c = q(`[data-st="${i}"]`); c.style.borderColor = on ? '#ffcf3f' : '#3a3346'; c.style.background = on ? '#2f2640' : '#201b29'; if (on) setTimeout(() => lit(i, false), 900); };

  // ---------------------------------------------------------------- run tab
  const run = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px;padding:12px' });
  run.innerHTML = `
    <div style="display:grid;gap:10px;align-content:start">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="key is-dark" data-mic style="border-color:#000">Start talking</button>
        <label style="font:400 13px var(--f-mono)">to <select data-to style="font:inherit;background:#201b29;color:#eee9f5;border:2px solid #6a5f7a;padding:3px 6px">${Object.keys(LANGS).filter((l) => l !== 'english').map((l) => `<option ${l === ARGS.to_language ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <form data-typed style="display:flex;gap:6px"><input data-text placeholder="or type what you would say, then Send" style="flex:1;min-width:0;font:inherit;font-size:14px;background:#201b29;color:#eee9f5;border:2px solid #6a5f7a;padding:7px 9px"><button class="key" style="font-size:16px">Send</button></form>
      <div><div style="font:400 17px/1 var(--f-sign);color:#9fd0ff">HEARD, LINE BY LINE</div><ul class="dlog" data-heard style="min-height:40px"></ul></div>
      <div><div style="font:400 17px/1 var(--f-sign);color:#9fd0ff">SENTENCE BUFFER</div><div data-buffer style="font:400 13px/1.5 var(--f-mono);color:#cfc9d8;min-height:22px;border:2px dashed #3a3346;padding:6px 8px">empty</div></div>
      <div><div style="font:400 17px/1 var(--f-sign);color:#9fd0ff">SPOKEN</div><ul class="dlog" data-spoken></ul></div>
    </div>
    <div style="display:grid;gap:10px;align-content:start">
      <div style="border:2px solid #3a3346;padding:10px;background:#1b1622">
        <div style="font:400 17px/1 var(--f-sign);color:#ffcf3f">THE REQUEST TRANSLATOR.PY SENDS</div>
        <pre data-req style="margin:6px 0 0;white-space:pre-wrap;font:400 12px/1.5 var(--f-mono);color:#cfc9d8"></pre>
      </div>
      <div style="border:2px solid #3a3346;padding:10px;background:#1b1622">
        <div style="font:400 17px/1 var(--f-sign);color:#ffcf3f">WHAT WAV2LIP IS FED</div>
        <p style="margin:6px 0 8px;font-size:13px;color:#cfc9d8">A 96 by 96 crop of your face with the lower half blacked out, so the model has to draw the mouth from the sound. Nothing leaves your device.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><canvas data-face width="96" height="96" style="width:144px;height:144px;image-rendering:pixelated;background:#000;border:2px solid #6a5f7a"></canvas>
        <button class="key" data-cam style="font-size:15px">Use my camera</button></div>
      </div>
      <p data-note style="margin:0;font:400 12px/1.5 var(--f-mono);color:#9a94a2"></p>
    </div>`;

  // ---------------------------------------------------------------- source tab
  const src = el('div', { style: 'display:grid;grid-template-columns:200px minmax(0,1fr);min-height:100%' });
  src.innerHTML = `
    <div style="border-right:3px solid #000;padding:10px;display:grid;gap:4px;align-content:start;background:#1b1622">
      ${FILES.map((f) => `<button data-file="${f}" style="text-align:left;background:none;border:2px solid transparent;color:#eee9f5;font:400 13px var(--f-mono);padding:5px 7px;cursor:pointer">${f}</button>`).join('')}
      <button data-file="#commits" style="text-align:left;background:none;border:2px solid transparent;color:#ffcf3f;font:400 13px var(--f-mono);padding:5px 7px;cursor:pointer;margin-top:8px">commit history</button>
      <a href="${BASE}LICENSE.txt" target="_blank" rel="noopener" style="color:#9a94a2;font:400 12px var(--f-mono);padding:5px 7px">GPL-3.0 licence</a>
    </div>
    <div data-code style="padding:10px 0;overflow:auto;font:400 12.5px/1.6 var(--f-mono)"></div>`;

  const body = q('[data-body]');
  const showTab = (t) => {
    body.textContent = '';
    body.appendChild(t === 'src' ? src : run);
    root.querySelectorAll('[data-tab]').forEach((b) => { b.style.background = b.dataset.tab === t ? '#ffcf3f' : ''; });
    if (t === 'src' && !src.dataset.loaded) { src.dataset.loaded = '1'; openFile('tts_service.py'); }
  };
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { showTab(b.dataset.tab); sfx.blip(); }));

  const openFile = async (f) => {
    src.querySelectorAll('[data-file]').forEach((b) => { b.style.borderColor = b.dataset.file === f ? '#ffcf3f' : 'transparent'; });
    const code = src.querySelector('[data-code]');
    if (f === '#commits') {
      const rows = await fetch(`${BASE}commits.json`).then((r) => r.json());
      code.innerHTML = `<ul class="dlog" style="padding:0 14px">${rows.map((c) => `<li><span class="dim">${esc(c.date)} ${esc(c.hash)}</span> <b style="color:#ffcf3f">${esc(c.author)}</b> ${esc(c.msg)}</li>`).join('')}</ul>`;
      return;
    }
    const text = await fetch(`${BASE}src/${f}`).then((r) => r.text());
    const lines = highlight(text).split('\n');
    code.innerHTML = `<table style="border-collapse:collapse">${lines.map((l, i) => `<tr><td style="color:#5a5266;text-align:right;padding:0 10px 0 14px;user-select:none;vertical-align:top">${i + 1}</td><td style="white-space:pre;padding-right:16px">${l || ' '}</td></tr>`).join('')}</table>`;
    code.scrollTop = 0;
  };
  src.addEventListener('click', (e) => { const b = e.target.closest('[data-file]'); if (b) { openFile(b.dataset.file); sfx.blip(); } });

  // ---------------------------------------------------------------- the pipeline
  const heard = run.querySelector('[data-heard]');
  const spoken = run.querySelector('[data-spoken]');
  const bufEl = run.querySelector('[data-buffer]');
  const reqEl = run.querySelector('[data-req]');
  const note = run.querySelector('[data-note]');
  const toSel = run.querySelector('[data-to]');
  const state = { buffered: '' };
  let translator = null, translatorFor = null;

  const showRequest = (text) => {
    reqEl.textContent = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You will be provided with a sentence in ${ARGS.from_language} and your task is to translate it into ${toSel.value}.` },
        { role: 'user', content: text || '...' },
      ],
      temperature: 0.7,
      top_p: 1,
    }, null, 2);
  };
  showRequest('');

  // the browser's translator can be missing, need a download, or never answer,
  // so every call to it gets a time limit and the sentence goes on regardless
  const within = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  async function translate(text) {
    const target = LANGS[toSel.value];
    if (!('Translator' in self)) return { text, how: 'no built in translator in this browser, so it goes on in English' };
    try {
      if (translatorFor !== target) {
        translator = null;
        translatorFor = target;
        const av = await within(self.Translator.availability({ sourceLanguage: 'en', targetLanguage: target }), 2500);
        if (av === 'unavailable') return { text, how: `this browser cannot translate into ${toSel.value}, so it goes on in English` };
        translator = await within(self.Translator.create({ sourceLanguage: 'en', targetLanguage: target }), av === 'available' ? 4000 : 2500);
      }
      if (translator) return { text: await within(translator.translate(text), 5000), how: `translated by your browser into ${toSel.value}` };
    } catch { translatorFor = null; }
    return { text, how: 'the browser translator did not answer in time, so it goes on in English' };
  }

  function speak(text) {
    if (!('speechSynthesis' in self)) return;
    const u = new SpeechSynthesisUtterance(text);
    const lang = LANGS[toSel.value];
    u.lang = lang;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // tts_service.py: generate_translate_audio
  async function generateTranslateAudio(sentence) {
    lit(2);
    showRequest(sentence);
    lit(3);
    const t = await translate(sentence);
    lit(4);
    speak(t.text);
    spoken.prepend(el('li', { class: 'ok' }, `${esc(t.text)} <span class="dim">(${esc(t.how)})</span>`));
    grabFace();
    lit(5);
  }

  // tts_service.py: generate_and_queue, with the phrase delivered by the transcriber
  async function deliverToTts(chunks) {
    for (const chunk of chunks) {
      state.buffered += chunk;
      const sentences = sentTokenize(state.buffered);
      bufEl.textContent = state.buffered || 'empty';
      const sentence = getCompleteSentence(sentences, state);
      if (sentence === null) continue;
      bufEl.textContent = state.buffered || 'empty';
      await generateTranslateAudio(sentence);
    }
    if (state.buffered) { const rest = state.buffered; state.buffered = ''; await generateTranslateAudio(rest); }
    bufEl.textContent = state.buffered || 'empty';
  }

  // audio_utils.py: a line ends after phrase_timeout seconds without speech
  let phrase = [], phraseLi = null, lastSpeech = 0, phraseTimer = 0;
  const endPhrase = () => {
    clearTimeout(phraseTimer);
    if (!phrase.length) return;
    const chunks = phrase.slice();
    phrase = []; phraseLi = null;
    deliverToTts(chunks);
  };
  function heardChunk(text) {
    const now = performance.now();
    if (phraseLi && now - lastSpeech > ARGS.phrase_timeout * 1000) endPhrase();
    lastSpeech = now;
    phrase.push((phrase.length ? ' ' : '') + text);
    if (!phraseLi) { phraseLi = el('li', {}, ''); heard.prepend(phraseLi); }
    phraseLi.textContent = phrase.join('');
    lit(1);
    clearTimeout(phraseTimer);
    phraseTimer = setTimeout(endPhrase, ARGS.phrase_timeout * 1000);
  }

  // the microphone, with the browser's recogniser standing in for Whisper
  const SR = self.SpeechRecognition || self.webkitSpeechRecognition;
  let rec = null, listening = false;
  const micBtn = run.querySelector('[data-mic]');
  if (!SR) { micBtn.disabled = true; micBtn.textContent = 'No speech recognition here'; note.textContent = 'This browser cannot listen. Type a sentence instead, or open the page in Chrome or Edge.'; }
  micBtn.addEventListener('click', () => {
    if (!SR) return;
    if (listening) { listening = false; rec && rec.stop(); micBtn.textContent = 'Start talking'; endPhrase(); return; }
    rec = new SR();
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) heardChunk(e.results[i][0].transcript.trim()); lit(0); };
    rec.onend = () => { if (listening) setTimeout(() => { try { rec.start(); } catch { /* already running */ } }, 250); };
    rec.onerror = (e) => { note.textContent = `Speech recognition: ${e.error}`; };
    listening = true;
    try { rec.start(); } catch { /* already running */ }
    micBtn.textContent = 'Stop';
    sfx.blip();
  });
  run.querySelector('[data-typed]').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = run.querySelector('[data-text]');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    lit(0);
    heardChunk(text);
    endPhrase();
  });
  toSel.addEventListener('change', () => showRequest(''));

  // inference.py datagen: face crop resized to 96, lower half masked
  const face = run.querySelector('[data-face]');
  const fctx = face.getContext('2d');
  let video = null, stream = null;
  function grabFace() {
    if (!video || video.readyState < 2) return;
    const w = video.videoWidth, h = video.videoHeight, s = Math.min(w, h) * 0.6;
    // no face detector here, so the centre square stands in for the box,
    // like the repo's own "specified bounding box" fallback
    fctx.drawImage(video, (w - s) / 2, (h - s) / 2 - s * 0.05, s, s, 0, 0, 96, 96);
    fctx.fillStyle = '#000';
    fctx.fillRect(0, 48, 96, 48);
  }
  run.querySelector('[data-cam]').addEventListener('click', async (e) => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; video = null; e.target.textContent = 'Use my camera'; fctx.clearRect(0, 0, 96, 96); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      video = document.createElement('video');
      video.muted = true; video.playsInline = true; video.srcObject = stream;
      await video.play();
      e.target.textContent = 'Camera off';
      const tick = () => { if (!video) return; grabFace(); setTimeout(tick, 400); };
      tick();
    } catch { note.textContent = 'No camera, or permission was not given.'; }
  });

  const ro = new ResizeObserver(() => {
    const narrow = host.clientWidth < 720;
    run.style.gridTemplateColumns = narrow ? '1fr' : 'minmax(0,1.2fr) minmax(0,1fr)';
    src.style.gridTemplateColumns = narrow ? '1fr' : '200px minmax(0,1fr)';
  });
  ro.observe(host);
  showTab('run');

  return () => {
    ro.disconnect();
    listening = false; rec && rec.stop();
    stream && stream.getTracks().forEach((t) => t.stop());
    'speechSynthesis' in self && speechSynthesis.cancel();
    clearTimeout(phraseTimer);
  };
}
