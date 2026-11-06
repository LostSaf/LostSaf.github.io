(function () {
  if (window.__bobaLoaded) return;
  window.__bobaLoaded = true;

  // Boba is a sprite sheet rendered in Blender from a rigged 3D model of him.
  // Frame indices into boba_sprite.webp (row-major, SPRITE.cols per row).
  var SPRITE = {
    w: 200, h: 140, cols: 8,
    walk: [0, 12],       // one walk cycle, filmed on a treadmill
    lie: [12, 20],       // stop, look at you, lie down, fall asleep
    breath: [32, 8],     // sleeping breath loop
    wake: [40, 18],      // asleep -> perked up (played backwards to doze off)
    blink: [58, 59],
    twitch: [60, 61],
    flick: [62, 63],
    stride: 64           // CSS px Boba moves forward per walk cycle
  };
  var WALK_CYCLES = 4;

  var root, panel, menuEl, askEl, replyEl, bodyEl, footEl, input, walker, cat;
  var awake = false;
  var hasReply = false;
  var mode = "asleep";   // intro | asleep | waking | awake | dozing
  var timer = null;
  var idleTimer = null;

  function md(t) {
    t = String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    t = t.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, function (m, c) { return "<pre>" + c + "</pre>"; });
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    t = t.replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/^\s*[-*]\s+/gm, "• ");
    return t.split(/(<pre>[\s\S]*?<\/pre>)/).map(function (seg, i) {
      return i % 2 ? seg : seg.replace(/\n/g, "<br>");
    }).join("");
  }

  function show(el, on) { el.hidden = !on; }

  // ---------------------------------------------------------------- sprite player

  function range(seq) {
    var out = [];
    for (var i = 0; i < seq[1]; i++) out.push(seq[0] + i);
    return out;
  }

  function setFrame(i) {
    cat.style.backgroundPosition =
      -(i % SPRITE.cols) * SPRITE.w + "px " + -Math.floor(i / SPRITE.cols) * SPRITE.h + "px";
  }

  function stop() {
    clearTimeout(timer);
    clearTimeout(idleTimer);
    timer = idleTimer = null;
  }

  function play(frames, fps, done) {
    stop();
    var k = 0;
    (function step() {
      setFrame(frames[k++]);
      if (k < frames.length) timer = setTimeout(step, 1000 / fps);
      else if (done) timer = setTimeout(done, 1000 / fps);
    })();
  }

  function loop(frames, fps) {
    stop();
    var k = 0;
    (function step() {
      setFrame(frames[k++ % frames.length]);
      timer = setTimeout(step, 1000 / fps);
    })();
  }

  function setMood(m) {
    mode = m;
    root.classList.toggle("boba-asleep", m === "asleep");
    root.classList.toggle("boba-awake", m !== "asleep" && m !== "intro");
  }

  function dozeLoop() {
    setMood("asleep");
    walker.style.transform = "";
    loop(range(SPRITE.breath), 3.5);
  }

  function idle() {
    var last = SPRITE.wake[0] + SPRITE.wake[1] - 1;
    setFrame(last);
    idleTimer = setTimeout(function () {
      var r = Math.random();
      var seq = r < 0.7 ? [SPRITE.blink[0], SPRITE.blink[1], SPRITE.blink[0]]
        : r < 0.85 ? [SPRITE.twitch[0], SPRITE.twitch[1], SPRITE.twitch[0]]
          : [SPRITE.flick[0], SPRITE.flick[1], SPRITE.flick[0]];
      play(seq.concat([last]), r < 0.7 ? 18 : 10, idle);
    }, 2500 + Math.random() * 3500);
  }

  function walkIn() {
    setMood("intro");
    var walk = range(SPRITE.walk);
    var total = walk.length * WALK_CYCLES;
    var dist = SPRITE.stride * WALK_CYCLES;
    var dir = root.classList.contains("corner-bl") ? -1 : 1;
    var k = 0;
    stop();
    (function step() {
      setFrame(walk[k % walk.length]);
      walker.style.transform = "translateX(" + (dir * dist * (1 - k / total)).toFixed(1) + "px)";
      k++;
      if (k <= total) timer = setTimeout(step, 1000 / 15);
      else {
        walker.style.transform = "";
        play(range(SPRITE.lie), 11, dozeLoop);
      }
    })();
  }

  function catWake() {
    if (mode === "awake" || mode === "waking") return;
    setMood("waking");
    walker.style.transform = "";
    var frames = range(SPRITE.wake);
    play(frames, 16, function () { setMood("awake"); idle(); });
  }

  function catSleep() {
    if (mode === "asleep" || mode === "dozing" || mode === "intro") return;
    setMood("dozing");
    play(range(SPRITE.wake).reverse(), 14, dozeLoop);
  }

  // ---------------------------------------------------------------- panel

  function setMode(m) {
    show(menuEl, m === "menu");
    show(askEl, m === "ask");
    show(replyEl, m === "reply" || (m === "ask" && hasReply));
    show(footEl, m === "reply");
  }

  function wake() {
    awake = true;
    show(panel, true);
    setMode(hasReply ? "reply" : "menu");
    catWake();
  }

  function sleep() {
    awake = false;
    show(panel, false);
    catSleep();
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    setMode("reply");
    pycmd("boba:ask:" + text);
  }

  function build() {
    if (document.getElementById("boba-root") || !document.body) return;
    root = document.createElement("div");
    root.id = "boba-root";
    root.className = "boba-asleep corner-br";
    root.innerHTML =
      '<div id="boba-panel" hidden>' +
      '<button id="boba-close" title="Let Boba sleep">×</button>' +
      '<div id="boba-menu"><div class="boba-hello">Mrrp? What can I help with?</div>' +
      '<button class="boba-opt" data-act="explain">✨ Explain the answer</button>' +
      '<button class="boba-opt" data-act="ask">💬 Ask my own question</button></div>' +
      '<div id="boba-reply" hidden><div id="boba-body"></div></div>' +
      '<div id="boba-ask" hidden><textarea id="boba-input" rows="2" placeholder="Ask Boba about this card…"></textarea>' +
      '<div class="boba-row"><button id="boba-back" class="boba-small">Back</button><button id="boba-send" class="boba-small primary">Send</button></div></div>' +
      '<div id="boba-foot" hidden><button id="boba-follow" class="boba-small">Ask a follow-up</button><button id="boba-menu-btn" class="boba-small">Menu</button></div>' +
      "</div>" +
      '<div id="boba-stage"><div id="boba-walker"><div id="boba-cat" title="Boba"></div>' +
      '<div class="boba-zzz"><span>z</span><span>z</span></div></div>' +
      '<button id="boba-paw" title="Wake Boba">🐾</button></div>';
    document.body.appendChild(root);

    panel = root.querySelector("#boba-panel");
    menuEl = root.querySelector("#boba-menu");
    askEl = root.querySelector("#boba-ask");
    replyEl = root.querySelector("#boba-reply");
    bodyEl = root.querySelector("#boba-body");
    footEl = root.querySelector("#boba-foot");
    input = root.querySelector("#boba-input");
    walker = root.querySelector("#boba-walker");
    cat = root.querySelector("#boba-cat");
    setFrame(SPRITE.breath[0]);
    dozeLoop();

    function toggle() {
      if (mode === "intro") dozeLoop();
      awake ? sleep() : wake();
    }
    cat.onclick = toggle;
    root.querySelector("#boba-paw").onclick = toggle;
    root.querySelector("#boba-close").onclick = sleep;
    root.querySelector("#boba-back").onclick = function () { setMode(hasReply ? "reply" : "menu"); };
    root.querySelector("#boba-send").onclick = send;
    root.querySelector("#boba-follow").onclick = function () { setMode("ask"); input.focus(); };
    root.querySelector("#boba-menu-btn").onclick = function () { hasReply = false; bodyEl.innerHTML = ""; setMode("menu"); };

    root.querySelector('[data-act="explain"]').onclick = function () {
      setMode("reply");
      pycmd("boba:explain");
    };
    root.querySelector('[data-act="ask"]').onclick = function () {
      setMode("ask");
      input.focus();
    };

    input.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    input.addEventListener("keyup", function (e) { e.stopPropagation(); });
    input.addEventListener("keypress", function (e) { e.stopPropagation(); });
  }

  window.bobaReset = function (opts) {
    build();
    if (!root) return;
    var corner = opts && opts.corner === "bottom-left" ? "corner-bl" : "corner-br";
    root.classList.remove("corner-bl", "corner-br");
    root.classList.add(corner);
    var paw = root.querySelector("#boba-paw");
    if (paw) paw.title = "Wake Boba" + (opts && opts.shortcut ? " (" + opts.shortcut + ")" : "");
    hasReply = false;
    bodyEl.innerHTML = "";
    input.value = "";
    awake = false;
    show(panel, false);
    if (opts && opts.intro) {
      // first card after opening a deck: Boba strolls in and settles down
      var img = new Image();
      img.onload = walkIn;
      img.onerror = dozeLoop;
      img.src = getComputedStyle(cat).backgroundImage.replace(/^url\(["']?|["']?\)$/g, "");
    } else {
      catSleep();
    }
  };

  window.bobaToggle = function () {
    build();
    if (mode === "intro") dozeLoop();
    awake ? sleep() : wake();
  };

  window.bobaThinking = function () {
    hasReply = true;
    bodyEl.innerHTML = '<div class="boba-thinking">Boba is thinking<span>.</span><span>.</span><span>.</span></div>';
    setMode("reply");
    footEl.hidden = true;
  };

  window.bobaReply = function (text, isError) {
    hasReply = true;
    bodyEl.innerHTML = (isError ? '<div class="boba-error">' : "<div>") + md(text) + "</div>";
    setMode("reply");
    replyEl.scrollTop = 0;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
