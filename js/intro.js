// The black screen.
//
// A height field is stepped with the 2D wave equation on the CPU every frame
// (two substeps, damped), uploaded as a half float texture, and shaded in
// WebGL2 as glossy lacquer: per pixel normals from the field, mirror
// reflections of a few studio lights, a specular glint that follows the
// cursor, and a thin film sheen on steep slopes.
//
// Clicking freezes one frame into a texture and breaks it into a quadtree of
// instanced square shards, smaller the closer they sit to the click. A
// shockwave sets each one loose, they tumble toward you in perspective, and
// the white page underneath shows through.

const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const SURFACE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uH, uGlow, uCrisp;
uniform vec2 uTexel, uRes, uMouse, uTextShift, uClick;
uniform float uTime, uGlitch, uFlash, uSnap, uFade, uAspect;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float box(vec2 q, vec2 c, vec2 h, float soft, float ang){
  float s = sin(ang), co = cos(ang);
  vec2 d = q - c;
  d = vec2(co * d.x - s * d.y, s * d.x + co * d.y);
  vec2 e = abs(d) - h;
  float dist = length(max(e, 0.)) + min(max(e.x, e.y), 0.);
  return 1. - smoothstep(-soft, soft, dist);
}

void main(){
  vec2 uv = vUv;

  // glitch: rows slip sideways for a moment before the break
  float row = floor(uv.y * 54.);
  float gk = step(.78, hash(vec2(row, floor(uTime * 26.))));
  uv.x += (hash(vec2(row, 7.3)) - .5) * .09 * gk * uGlitch;

  float hL = texture(uH, uv - vec2(uTexel.x, 0.)).r;
  float hR = texture(uH, uv + vec2(uTexel.x, 0.)).r;
  float hU = texture(uH, uv - vec2(0., uTexel.y)).r;
  float hD = texture(uH, uv + vec2(0., uTexel.y)).r;
  vec3 N = normalize(vec3((hL - hR) * 1.6, (hU - hD) * 1.6, 1.));

  // world: x in [0, aspect], y in [0, 1] down the screen, z toward the viewer
  vec3 P = vec3(uv.x * uAspect, uv.y, 0.);
  vec3 C = vec3(.5 * uAspect, .5, 1.);
  vec3 V = normalize(P - C);
  vec3 R = reflect(V, N);

  // where the reflected ray meets the light plane one unit up
  vec2 Q = P.xy + R.xy / max(R.z, .05);
  float A = uAspect;
  float drift = sin(uTime * .11) * .05;

  vec3 col = vec3(.006, .006, .008);
  col += vec3(.016, .015, .02) * smoothstep(1.4, -.4, Q.y);              // ceiling falloff
  // a long strip light, hottest in the middle and fading toward its ends
  float along = 1. - smoothstep(.12 * A, .5 * A, abs(Q.x - .45 * A - drift));
  float across = exp(-pow((Q.y + .06 - (Q.x - .45 * A) * .07) / .03, 2.));
  col += vec3(.95, .94, 1.) * .42 * along * across;
  col += vec3(.8, .78, 1.) * .05 * along * exp(-pow((Q.y + .06) / .2, 2.));      // its bloom on the lacquer
  col += vec3(.75, .8, 1.) * .05 * box(Q, vec2(1.3 * A, 1.3), vec2(.4 * A, .34), .38, .2);   // softbox, far corner
  col += vec3(1., .78, .86) * .03 * box(Q, vec2(-.2 * A, 1.25), vec2(.35 * A, .25), .4, -.3); // warm bounce

  // glint that follows the cursor
  vec2 m = uMouse / uRes;
  vec3 L = normalize(vec3(m.x * uAspect, m.y, .22) - P);
  vec3 H = normalize(L - V);
  float nh = max(dot(N, H), 0.);
  col += vec3(1., .97, .95) * (pow(nh, 520.) * 1.6 + pow(nh, 40.) * .03);

  // thin film on the slopes, the same inks the page is printed in
  float slope = length(N.xy);
  vec3 film = .5 + .5 * cos(6.2831 * (slope * 7. + uTime * .04 + vec3(0., .36, .68)));
  col += film * smoothstep(.015, .16, slope) * .07;

  // the word floating above lights the lacquer a little
  float g = texture(uGlow, uv - uTextShift + N.xy * .045).r;
  col += vec3(.9, .88, 1.) * g * .2;

  if (uSnap > .5) {
    float c = texture(uCrisp, uv - uTextShift).r;
    col = mix(col, vec3(.96, .95, .99), c);
  }

  vec2 cv = uv - .5;
  col *= 1. - .42 * dot(cv, cv) * 1.6;

  col += uFlash * exp(-length(vUv * uRes - uClick) / 140.) * vec3(1., .96, .98);
  col *= 1. - uGlitch * .3 * step(.5, fract(gl_FragCoord.y * .5));
  col.r *= 1. + uGlitch * gk * .8;
  col.b *= 1. + uGlitch * (1. - gk) * .5;

  col *= uFade;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.) - .5) / 255. * 1.6;
  o = vec4(col, 1.);
}`;

const SHARD_VS = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aRect;
layout(location=2) in vec4 aVel;
layout(location=3) in vec4 aSpin;
uniform vec2 uRes;
uniform float uT, uLife;
out vec2 vUv, vLocal;
out float vAge, vSheen, vSeed;

mat3 rot(vec3 a, float t){
  float s = sin(t), c = cos(t), oc = 1. - c;
  return mat3(oc*a.x*a.x + c,     oc*a.x*a.y + a.z*s, oc*a.z*a.x - a.y*s,
              oc*a.x*a.y - a.z*s, oc*a.y*a.y + c,     oc*a.y*a.z + a.x*s,
              oc*a.z*a.x + a.y*s, oc*a.y*a.z - a.x*s, oc*a.z*a.z + c);
}

void main(){
  float t = max(0., uT - aVel.w);
  float age = t / uLife;
  vec2 center = aRect.xy + aRect.zw * .5;
  float shrink = 1. - smoothstep(.25, 1., age) * .7;
  vec3 local = vec3((aCorner - .5) * aRect.zw * shrink, 0.);
  mat3 R = rot(aSpin.xyz, aSpin.w * t);
  vec3 w = vec3(center + aVel.xy * t + vec2(0., 1100.) * t * t * .5, aVel.z * t) + R * local;
  float F = 1500.;
  vec2 vp = uRes * .5;
  float k = F / max(F - w.z, 60.);
  vec2 s = vp + (w.xy - vp) * k;
  gl_Position = vec4(s.x / uRes.x * 2. - 1., 1. - s.y / uRes.y * 2., 0., 1.);
  vUv = (aRect.xy + aCorner * aRect.zw) / uRes;
  vLocal = aCorner;
  vAge = age;
  vec3 n = R * vec3(0., 0., 1.);
  vSheen = pow(max(dot(n, normalize(vec3(.35, -.55, 1.))), 0.), 14.) * step(.0001, t);
  vSeed = fract(sin(dot(aRect.xy, vec2(12.9898, 78.233))) * 43758.5453);
}`;

const SHARD_FS = `#version 300 es
precision highp float;
in vec2 vUv, vLocal;
in float vAge, vSheen, vSeed;
out vec4 o;
uniform sampler2D uSnapTex;
void main(){
  vec3 c = texture(uSnapTex, vec2(vUv.x, 1. - vUv.y)).rgb;
  float lv = mix(64., 5., smoothstep(0., .6, vAge));
  c = floor(c * lv + .5) / lv;
  float e = min(min(vLocal.x, 1. - vLocal.x), min(vLocal.y, 1. - vLocal.y));
  vec3 ink = vSeed < .33 ? vec3(1., .3, .6) : vSeed < .66 ? vec3(.17, .27, .88) : vec3(1., .77, .08);
  float edge = (1. - smoothstep(.0, .09, e)) * smoothstep(.0, .12, vAge);
  c = mix(c, ink, edge * .85);
  c += vSheen * .55;
  c = mix(c, ink, smoothstep(.55, .9, vAge) * .6);
  float a = 1. - smoothstep(.6, 1., vAge);
  o = vec4(c * a, a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

const LABEL = 'Click here';
const LAYERS = 14;

function buildFloatingWord(btn) {
  const rig = btn.querySelector('.float3d__rig');
  rig.textContent = '';
  for (let i = LAYERS; i >= 0; i--) {
    const s = document.createElement('span');
    s.textContent = LABEL;
    s.style.setProperty('--i', i);
    s.style.setProperty('--n', LAYERS);
    s.style.setProperty('--k', (LAYERS - i) / LAYERS * 10);
    if (i === 0) s.className = 'is-face';
    rig.appendChild(s);
  }
  return rig;
}

// Draws the label where the button really is, one letter at a time so the
// letter spacing matches the CSS on every browser.
function drawLabel(ctx, rect, blur) {
  const { canvas } = ctx;
  const sx = canvas.width / innerWidth;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(sx, sx);
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = '#fff';
  ctx.font = '500 12px "Martian Mono", monospace';
  ctx.textBaseline = 'middle';
  const spacing = 12 * 0.5;
  const chars = LABEL.toUpperCase().split('');
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width + spacing;
  w -= spacing;
  let x = rect.left + rect.width / 2 - w / 2;
  const y = rect.top + rect.height / 2;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    if (blur) { ctx.fillText(ch, x, y); }
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
}

export function runIntro({ reduced = false } = {}) {
  return new Promise((resolve) => {
    const root = document.getElementById('intro');
    const canvas = document.getElementById('intro-gl');
    const btn = document.getElementById('enter');
    const hint = root.querySelector('.intro-hint');
    const rig = buildFloatingWord(btn);
    root.style.touchAction = 'none';

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const gl = !reduced && canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    const mouse = { x: innerWidth / 2, y: innerHeight * 0.62, px: null, py: null, moved: false };
    const tilt = { rx: 0, ry: 0 };
    let done = false;

    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!mouse.moved) { mouse.moved = true; hint && hint.classList.add('is-off'); }
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);

    const finish = (info) => {
      if (done) return;
      done = true;
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      resolve(info);
    };

    // ------------------------------------------------------------ no WebGL2
    if (!gl) {
      const tiltLoop = () => {
        if (done) return;
        tilt.rx += ((mouse.y / innerHeight - 0.5) * -22 - tilt.rx) * 0.08;
        tilt.ry += ((mouse.x / innerWidth - 0.5) * 30 - tilt.ry) * 0.08;
        rig.style.setProperty('--rx', tilt.rx.toFixed(2) + 'deg');
        rig.style.setProperty('--ry', tilt.ry.toFixed(2) + 'deg');
        requestAnimationFrame(tiltLoop);
      };
      tiltLoop();
      btn.addEventListener('click', () => {
        const r = btn.getBoundingClientRect();
        document.body.classList.add('is-breaking');
        root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 300 : 600, fill: 'forwards' })
          .finished.then(() => finish({ x: r.left + r.width / 2, y: r.top + r.height / 2, dust: [] }));
      }, { once: true });
      return;
    }

    // ------------------------------------------------------------ WebGL2
    const surface = program(gl, QUAD_VS, SURFACE_FS);
    const shards = program(gl, SHARD_VS, SHARD_FS);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const makeTex = (filter) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const hTex = makeTex(gl.LINEAR);
    const glowTex = makeTex(gl.LINEAR);
    const crispTex = makeTex(gl.LINEAR);

    const glowCanvas = document.createElement('canvas');
    const crispCanvas = document.createElement('canvas');
    const glowCtx = glowCanvas.getContext('2d');
    const crispCtx = crispCanvas.getContext('2d');
    let labelRect = null;

    let W, H, SW, SH, cell, prev, cur;
    function resize() {
      W = Math.max(1, innerWidth); H = Math.max(1, innerHeight);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      cell = Math.max(4, Math.ceil(W / 420));
      SW = Math.ceil(W / cell) + 2;
      SH = Math.ceil(H / cell) + 2;
      prev = new Float32Array(SW * SH);
      cur = new Float32Array(SW * SH);
      gl.bindTexture(gl.TEXTURE_2D, hTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, SW, SH, 0, gl.RED, gl.FLOAT, cur);
      glowCanvas.width = Math.round(W / 2); glowCanvas.height = Math.round(H / 2);
      crispCanvas.width = Math.round(W * dpr); crispCanvas.height = Math.round(H * dpr);
      paintLabel();
    }
    function paintLabel() {
      labelRect = btn.getBoundingClientRect();
      drawLabel(glowCtx, labelRect, 7);
      drawLabel(crispCtx, labelRect, 0);
      for (const [tex, c] of [[glowTex, glowCanvas], [crispTex, crispCanvas]]) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, c);
      }
    }
    resize();
    document.fonts && document.fonts.ready.then(() => { if (!done) paintLabel(); });
    const onResize = () => { if (!breaking) resize(); };
    addEventListener('resize', onResize);

    function drop(px, py, radiusPx, amp) {
      const cx = px / cell + 1, cy = py / cell + 1;
      const r = Math.max(1.5, radiusPx / cell);
      const x0 = Math.max(1, Math.floor(cx - r)), x1 = Math.min(SW - 2, Math.ceil(cx + r));
      const y0 = Math.max(1, Math.floor(cy - r)), y1 = Math.min(SH - 2, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = Math.hypot(x - cx, y - cy) / r;
          if (d < 1) cur[y * SW + x] += amp * (Math.cos(d * Math.PI) * 0.5 + 0.5);
        }
      }
    }
    function step() {
      const damp = 0.984;
      for (let y = 1; y < SH - 1; y++) {
        let i = y * SW + 1;
        for (let x = 1; x < SW - 1; x++, i++) {
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - SW] + cur[i + SW]) * 0.5 - prev[i]) * damp;
        }
      }
      const t = prev; prev = cur; cur = t;
    }

    // -------------------------------------------------------- shards setup
    let breaking = false, breakT0 = 0, click = { x: 0, y: 0 };
    let shardVao, shardCount = 0, shardEnd = 0, snapTex, snapFbo;
    const LIFE = 1.15;

    function buildShards(cx, cy) {
      const data = [];
      const base = 96;
      const maxD = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
      const speed = maxD / 0.95;
      const split = (x, y, s) => {
        const mx = x + s / 2, my = y + s / 2;
        const d = Math.hypot(mx - cx, my - cy);
        if (s > 6 && (d < s * 5.5 || (s > 24 && Math.random() < 0.22))) {
          const h = s / 2;
          split(x, y, h); split(x + h, y, h); split(x, y + h, h); split(x + h, y + h, h);
          return;
        }
        if (x >= W || y >= H) return;
        const dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
        const push = (260 + Math.random() * 620) * (1 + 220 / (d + 90));
        const vx = dx / dl * push + (Math.random() - 0.5) * 220;
        const vy = dy / dl * push - 240 - Math.random() * 380;
        const vz = 200 + Math.random() * 1100 * (1 + 120 / (d + 120));
        const delay = d / speed + Math.random() * 0.06;
        let ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = (Math.random() - 0.5) * 0.4;
        const al = Math.hypot(ax, ay, az) || 1;
        data.push(x, y, s, s, vx, vy, vz, delay, ax / al, ay / al, az / al, 2 + Math.random() * 9);
        shardEnd = Math.max(shardEnd, delay + LIFE);
      };
      for (let y = 0; y < H; y += base) for (let x = 0; x < W; x += base) split(x, y, base);
      shardCount = data.length / 12;

      shardVao = gl.createVertexArray();
      gl.bindVertexArray(shardVao);
      const corners = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, corners);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      for (let a = 1; a <= 3; a++) {
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 48, (a - 1) * 16);
        gl.vertexAttribDivisor(a, 1);
      }
      gl.bindVertexArray(null);
    }

    function snapshot() {
      snapTex = makeTex(gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      snapFbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, snapFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, snapTex, 0);
      drawSurface(performance.now() / 1000, 0.35, 0, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function drawSurface(time, glitch, flash, snap) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(surface.p);
      const u = surface.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glowTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, crispTex);
      gl.uniform1i(u.uH, 0); gl.uniform1i(u.uGlow, 1); gl.uniform1i(u.uCrisp, 2);
      // the field has a one cell border; sample the visible part
      gl.uniform2f(u.uTexel, 1 / SW, 1 / SH);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform2f(u.uClick, click.x, click.y);
      const r = btn.getBoundingClientRect();
      gl.uniform2f(u.uTextShift, (r.left - labelRect.left) / W, (r.top - labelRect.top) / H);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uGlitch, glitch);
      gl.uniform1f(u.uFlash, flash);
      gl.uniform1f(u.uSnap, snap);
      gl.uniform1f(u.uFade, fade);
      gl.uniform1f(u.uAspect, W / H);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ----------------------------------------------------------- the loop
    let last = performance.now(), nextAmbient = 1.2, nextPulse = 0.6, fade = 0;
    const t0 = performance.now();

    function frame(now) {
      if (done) return;
      const time = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!breaking) {
        fade = Math.min(1, fade + dt * 0.7);

        // the cursor's path, laid down as a line of small drops
        if (mouse.px !== null) {
          const dx = mouse.x - mouse.px, dy = mouse.y - mouse.py;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.5) {
            const n = Math.min(40, Math.ceil(dist / (cell * 2)));
            const amp = Math.min(1.1, 0.12 + dist * 0.012) / Math.sqrt(n);
            for (let i = 1; i <= n; i++) drop(mouse.px + dx * i / n, mouse.py + dy * i / n, 10, -amp);
          }
        }
        mouse.px = mouse.x; mouse.py = mouse.y;

        nextAmbient -= dt;
        if (nextAmbient <= 0) {
          nextAmbient = 1.6 + Math.random() * 2.4;
          drop(Math.random() * W, Math.random() * H, 7, -0.9);
        }
        nextPulse -= dt;
        if (nextPulse <= 0) {
          nextPulse = 1.9;
          const r = btn.getBoundingClientRect();
          drop(r.left + r.width / 2, r.top + r.height / 2 + 18, 30, 0.35);
        }
        step(); step();
        gl.bindTexture(gl.TEXTURE_2D, hTex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SW, SH, gl.RED, gl.FLOAT, cur);

        tilt.rx += ((mouse.y / H - 0.5) * -24 - tilt.rx) * 0.07;
        tilt.ry += ((mouse.x / W - 0.5) * 34 - tilt.ry) * 0.07;
        rig.style.setProperty('--rx', tilt.rx.toFixed(2) + 'deg');
        rig.style.setProperty('--ry', tilt.ry.toFixed(2) + 'deg');

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        drawSurface(time, 0, 0, 0);
      } else {
        const bt = (now - breakT0) / 1000;
        if (bt < 0.24) {
          // a beat of glitch before it goes
          step();
          gl.bindTexture(gl.TEXTURE_2D, hTex);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SW, SH, gl.RED, gl.FLOAT, cur);
          drawSurface(time, 1 - bt / 0.24 * 0.6, Math.max(0, 1 - bt / 0.18), 1);
        } else {
          if (!shardVao) {
            gl.bindTexture(gl.TEXTURE_2D, hTex);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SW, SH, gl.RED, gl.FLOAT, cur);
            snapshot();
            buildShards(click.x, click.y);
            root.classList.add('is-breaking');
            document.body.classList.add('is-breaking');
            btn.classList.add('is-gone');
          }
          const st = bt - 0.24;
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          gl.useProgram(shards.p);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, snapTex);
          gl.uniform1i(shards.u.uSnapTex, 0);
          gl.uniform2f(shards.u.uRes, W, H);
          gl.uniform1f(shards.u.uT, st);
          gl.uniform1f(shards.u.uLife, LIFE);
          gl.bindVertexArray(shardVao);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, shardCount);
          if (st > shardEnd) {
            removeEventListener('resize', onResize);
            const dust = [];
            for (let i = 0; i < 220; i++) {
              const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * Math.min(W, H) * 0.42;
              dust.push({ x: click.x + Math.cos(a) * r, y: click.y + Math.sin(a) * r * 0.8 });
            }
            const lose = gl.getExtension('WEBGL_lose_context');
            lose && lose.loseContext();
            finish({ x: click.x, y: click.y, dust });
            return;
          }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const go = (e) => {
      if (breaking) return;
      breaking = true;
      breakT0 = performance.now();
      const r = btn.getBoundingClientRect();
      const kb = !e || e.detail === 0;
      click = kb ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: e.clientX, y: e.clientY };
      drop(click.x, click.y, 40, -3);
      paintLabel();
    };
    btn.addEventListener('click', go);
  });
}
