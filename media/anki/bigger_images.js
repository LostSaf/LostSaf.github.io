// Bigger Card Images: resizes every image on the card.
// The all-cards size comes from Python (window.BCI_INIT, then BCI.set({...})).
// A card with its own size carries it in a hidden #bci-card marker that Python
// adds to the card's HTML, so it arrives together with the card's images.
(function () {
    if (window.BCI) {
        window.BCI.set(window.BCI_INIT || {});
        return;
    }

    const state = Object.assign(
        { enabled: false, scale: 1.5, fit: true },
        window.BCI_INIT || {},
    );

    // Image occlusion draws masks over the image at its own size; resizing
    // the picture alone would knock the masks out of place.
    const SKIP = "#image-occlusion-container img, .bci-skip, .bci-skip img";

    function root() {
        return document.getElementById("qa") || document.body;
    }

    function marker() {
        return root().querySelector("#bci-card");
    }

    function factor() {
        const own = parseFloat(marker()?.dataset.scale);
        if (own > 0) return own;
        return state.enabled ? state.scale : 1;
    }

    function targets(node) {
        if (!node || node.nodeType !== 1) return [];
        const imgs = node.tagName === "IMG" ? [node] : [...node.querySelectorAll("img")];
        return imgs.filter((img) => root().contains(img) && !img.matches(SKIP));
    }

    function restore(img) {
        if (img.dataset.bciOrig === undefined) return;
        img.style.cssText = img.dataset.bciOrig;
        delete img.dataset.bciOrig;
    }

    function resize(imgs) {
        // Put every image back to the card's own sizing first, then measure,
        // then write: one layout pass instead of one per image.
        imgs.forEach(restore);
        const f = factor();
        if (f === 1) return;

        const ready = [];
        for (const img of imgs) {
            if (img.complete && img.naturalWidth) {
                ready.push(img);
            } else {
                img.addEventListener("load", () => resize([img]), { once: true });
            }
        }

        const widths = ready.map((img) => img.offsetWidth || img.naturalWidth);
        ready.forEach((img, i) => {
            img.dataset.bciOrig = img.style.cssText;
            const s = img.style;
            s.setProperty("width", Math.round(widths[i] * f) + "px", "important");
            s.setProperty("height", "auto", "important");
            s.setProperty("max-width", state.fit ? "100%" : "none", "important");
            s.setProperty("max-height", "none", "important");
        });
    }

    function resizeAll() {
        resize(targets(root()));
    }

    // Anki swaps the card's HTML for every question and answer; catch the new images.
    new MutationObserver((records) => {
        const imgs = [];
        for (const r of records) {
            r.addedNodes.forEach((n) => imgs.push(...targets(n)));
        }
        if (imgs.length) resize(imgs);
    }).observe(document.body, { childList: true, subtree: true });

    window.BCI = {
        set(opts) {
            Object.assign(state, opts);
            resizeAll();
        },
        // Give the card on screen its own size, or null to follow the all-cards size.
        setCard(scale) {
            let m = marker();
            if (scale == null) {
                m?.remove();
            } else {
                if (!m) {
                    m = document.createElement("div");
                    m.id = "bci-card";
                    m.hidden = true;
                    root().appendChild(m);
                }
                m.dataset.scale = scale;
            }
            resizeAll();
        },
    };

    resizeAll();
})();
