(function () {
  if (window.__catsLoaded) return;
  window.__catsLoaded = true;

  // Both cats share one SVG and the same animation classes (tail, body,
  // head, ears, open/closed eyes), so they fall asleep and wake up together.
  var EYES =
    '<g class="eyes-closed"><path d="M85 53 Q91 58 97 53"/><path d="M103 53 Q109 58 115 53"/></g>' +
    '<g class="eyes-open">' +
    '<ellipse class="iris" cx="91" cy="52" rx="5.6" ry="6.2"/><ellipse class="pupil" cx="91" cy="52" rx="1.6" ry="5"/><circle class="shine" cx="92.8" cy="49.5" r="1.1"/>' +
    '<ellipse class="iris" cx="109" cy="52" rx="5.6" ry="6.2"/><ellipse class="pupil" cx="109" cy="52" rx="1.6" ry="5"/><circle class="shine" cx="110.8" cy="49.5" r="1.1"/>' +
    '</g>';

  // Boba: small black cat with green eyes.
  var BOBA =
    '<g class="cat cat-boba">' +
    '<path class="tail" d="M26 76 C 4 78, 2 52, 23 57"/>' +
    '<g class="body"><ellipse class="fur" cx="68" cy="66" rx="50" ry="21"/></g>' +
    '<g class="head">' +
    '<g class="ear l"><polygon class="fur" points="79,40 82,17 96,33"/><polygon class="inner" points="83,36 84.5,25 91,33"/></g>' +
    '<g class="ear r"><polygon class="fur" points="104,33 118,17 121,40"/><polygon class="inner" points="109,33 115.5,25 117,36"/></g>' +
    '<ellipse class="fur" cx="100" cy="52" rx="23" ry="19"/>' +
    EYES +
    '<path class="nose" d="M97.5 58 h5 l-2.5 3z"/>' +
    '<g class="whiskers"><path d="M80 60 L68 58"/><path d="M80 63 L69 65"/><path d="M120 60 L132 58"/><path d="M120 63 L131 65"/></g>' +
    '</g></g>';

  // Aloe: fluffy white cat with a brown mask, white blaze, dark ears,
  // blue eyes, a bushy brown tail, a tan hip patch and white mittens.
  // Drawn facing right like Boba, then mirrored so the two face each other.
  var ALOE =
    '<g class="cat cat-aloe" transform="translate(256 0) scale(-1 1)">' +
    '<g class="tail"><path d="M32.7 83.4 L28.6 85.2 L24.6 84.9 L20.5 85.7 L17.0 84.2 L13.0 84.0 L10.3 81.4 L6.6 80.1 L5.0 76.7 L1.9 74.2 L1.7 70.4 L-0.5 66.9 L0.9 63.1 L0.2 59.0 L2.9 55.8 L3.8 51.6 L7.7 49.4 L10.1 45.6 L14.6 44.4 Q25.9 46.1 21.1 56.2 L17.4 59.1 L15.5 61.9 L14.7 64.5 L14.7 67.0 L15.5 69.6 L17.3 72.3 L20.4 74.8 L25.1 76.5 L31.4 76.8 Z"/>' +
    '<path class="streak" d="M22.6 80.3 Q15.2 77.6 11.7 74.6 T8.0 64.5 T12.4 54.8"/></g>' +
    '<g class="body">' +
    '<ellipse class="fur" cx="68" cy="66" rx="50" ry="21"/>' +
    '<path class="patch" d="M19.7 60.6 A50 21 0 0 1 55.1 45.7 C55 53 46 62 34 63 C28 63.5 23 62.5 19.7 60.6 Z"/>' +
    '<g class="paws">' +
    '<ellipse class="fur" cx="90" cy="84.5" rx="6.8" ry="3.9"/><ellipse class="fur" cx="105" cy="84.5" rx="6.8" ry="3.9"/>' +
    '<path class="toes" d="M88 86.4 v-2 M92 86.4 v-2 M103 86.4 v-2 M107 86.4 v-2"/>' +
    '</g></g>' +
    '<g class="head">' +
    '<g class="ear l"><polygon class="fur" points="79,40 82,17 96,33"/><polygon class="inner" points="83,36 84.5,25 91,33"/></g>' +
    '<g class="ear r"><polygon class="fur" points="104,33 118,17 121,40"/><polygon class="inner" points="109,33 115.5,25 117,36"/></g>' +
    '<g class="fur">' +
    '<path d="M80 57 L71.5 62.5 L78 63.5 L74 68.5 L82 67.5 L89 68 Z"/><path d="M120 57 L128.5 62.5 L122 63.5 L126 68.5 L118 67.5 L111 68 Z"/>' +
    '<ellipse cx="100" cy="52" rx="23" ry="19"/></g>' +
    '<g class="fur-fill">' +
    '<path d="M80 57 L71.5 62.5 L78 63.5 L74 68.5 L82 67.5 L89 68 Z"/><path d="M120 57 L128.5 62.5 L122 63.5 L126 68.5 L118 67.5 L111 68 Z"/>' +
    '<ellipse cx="100" cy="52" rx="23" ry="19"/></g>' +
    '<path class="mask" d="M97.6 33.1 A23 19 0 0 0 77.29 55 C80.5 58.5 86.5 60 91.5 59.2 C95 58.4 96.7 55.5 96.8 52 L97.6 33.1 Z"/>' +
    '<path class="mask" d="M102.4 33.1 A23 19 0 0 1 122.71 55 C119.5 58.5 113.5 60 108.5 59.2 C105 58.4 103.3 55.5 103.2 52 L102.4 33.1 Z"/>' +
    EYES +
    '<path class="nose" d="M97.5 58 h5 l-2.5 3z"/>' +
    '<path class="mouth" d="M100 61 v1.6 M100 62.6 q-1.8 1.8 -3.6 0.4 M100 62.6 q1.8 1.8 3.6 0.4"/>' +
    '<g class="whiskers"><path d="M80 60 L66 57"/><path d="M80 63 L67 65.5"/><path d="M120 60 L134 57"/><path d="M120 63 L133 65.5"/></g>' +
    '</g></g>';

  var CAT_SVG =
    '<svg viewBox="0 0 256 90" width="238" height="84" xmlns="http://www.w3.org/2000/svg">' +
    BOBA + ALOE +
    '<g class="zzz"><text x="117" y="36" style="font-size:8px">z</text><text x="123" y="26" style="font-size:10px">z</text><text x="129" y="16" style="font-size:12px">Z</text></g>' +
    '</svg>';

  var root, panel, menuEl, askEl, replyEl, bodyEl, footEl, input;
  var awake = false;
  var hasReply = false;

  function md(t) {
    t = String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    t = t.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, function (m, c) { return "<pre>" + c + "</pre>"; });
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    t = t.replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/^\s*[-*]\s+/gm, "\u2022 ");
    return t.split(/(<pre>[\s\S]*?<\/pre>)/).map(function (seg, i) {
      return i % 2 ? seg : seg.replace(/\n/g, "<br>");
    }).join("");
  }

  function show(el, on) { el.hidden = !on; }

  function setMode(mode) {
    show(menuEl, mode === "menu");
    show(askEl, mode === "ask");
    show(replyEl, mode === "reply" || (mode === "ask" && hasReply));
    show(footEl, mode === "reply");
  }

  function wake() {
    awake = true;
    root.classList.remove("cats-asleep");
    root.classList.add("cats-awake");
    show(panel, true);
    setMode(hasReply ? "reply" : "menu");
  }

  function sleep() {
    awake = false;
    root.classList.remove("cats-awake");
    root.classList.add("cats-asleep");
    show(panel, false);
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    setMode("reply");
    pycmd("cats:ask:" + text);
  }

  function build() {
    if (document.getElementById("cats-root") || !document.body) return;
    root = document.createElement("div");
    root.id = "cats-root";
    root.className = "cats-asleep corner-br";
    root.innerHTML =
      '<div id="cats-panel" hidden>' +
      '<button id="cats-close" title="Let Boba &amp; Aloe sleep">\u00d7</button>' +
      '<div id="cats-menu"><div class="cats-hello">Mrrp? What can we help with?</div>' +
      '<button class="cats-opt" data-act="explain">\u2728 Explain the answer</button>' +
      '<button class="cats-opt" data-act="ask">\ud83d\udcac Ask my own question</button></div>' +
      '<div id="cats-reply" hidden><div id="cats-body"></div></div>' +
      '<div id="cats-ask" hidden><textarea id="cats-input" rows="2" placeholder="Ask Boba &amp; Aloe about this card\u2026"></textarea>' +
      '<div class="cats-row"><button id="cats-back" class="cats-small">Back</button><button id="cats-send" class="cats-small primary">Send</button></div></div>' +
      '<div id="cats-foot" hidden><button id="cats-follow" class="cats-small">Ask a follow-up</button><button id="cats-menu-btn" class="cats-small">Menu</button></div>' +
      "</div>" +
      '<div id="cats-stage"><div id="cats-cat" title="Boba &amp; Aloe">' + CAT_SVG + '</div>' +
      '<button id="cats-paw" title="Wake Boba &amp; Aloe">\ud83d\udc3e</button></div>';
    document.body.appendChild(root);

    panel = root.querySelector("#cats-panel");
    menuEl = root.querySelector("#cats-menu");
    askEl = root.querySelector("#cats-ask");
    replyEl = root.querySelector("#cats-reply");
    bodyEl = root.querySelector("#cats-body");
    footEl = root.querySelector("#cats-foot");
    input = root.querySelector("#cats-input");

    root.querySelector("#cats-cat").onclick = function () { awake ? sleep() : wake(); };
    root.querySelector("#cats-paw").onclick = function () { awake ? sleep() : wake(); };
    root.querySelector("#cats-close").onclick = sleep;
    root.querySelector("#cats-back").onclick = function () { setMode(hasReply ? "reply" : "menu"); };
    root.querySelector("#cats-send").onclick = send;
    root.querySelector("#cats-follow").onclick = function () { setMode("ask"); input.focus(); };
    root.querySelector("#cats-menu-btn").onclick = function () { hasReply = false; bodyEl.innerHTML = ""; setMode("menu"); };

    root.querySelector('[data-act="explain"]').onclick = function () {
      setMode("reply");
      pycmd("cats:explain");
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

  window.catsReset = function (opts) {
    build();
    if (!root) return;
    root.className = "cats-asleep " + (opts && opts.corner === "bottom-left" ? "corner-bl" : "corner-br");
    var paw = root.querySelector("#cats-paw");
    if (paw) paw.title = "Wake Boba & Aloe" + (opts && opts.shortcut ? " (" + opts.shortcut + ")" : "");
    hasReply = false;
    bodyEl.innerHTML = "";
    input.value = "";
    awake = false;
    show(panel, false);
  };

  window.catsToggle = function () {
    build();
    awake ? sleep() : wake();
  };

  window.catsThinking = function () {
    hasReply = true;
    bodyEl.innerHTML = '<div class="cats-thinking">Boba &amp; Aloe are thinking<span>.</span><span>.</span><span>.</span></div>';
    setMode("reply");
    footEl.hidden = true;
  };

  window.catsReply = function (text, isError) {
    hasReply = true;
    bodyEl.innerHTML = (isError ? '<div class="cats-error">' : "<div>") + md(text) + "</div>";
    setMode("reply");
    replyEl.scrollTop = 0;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
