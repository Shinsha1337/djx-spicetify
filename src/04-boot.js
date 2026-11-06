        }
      }, { signal: view.dismiss.signal });

      const signal = view.dismiss.signal;
      // Every resting position must be a card start, otherwise the card at the left edge is
      // chopped mid-word. Stops are the cards' offsets inside the row, clamped to the scroll range.
      const stopsOf = (row) => {
        const max = Math.max(0, row.scrollWidth - row.clientWidth);
        const rowLeft = row.getBoundingClientRect().left;
        return [...row.children].map((card) =>
          Math.min(card.getBoundingClientRect().left - rowLeft + row.scrollLeft, max));
      };
      // A safety net for scrolling this panel did not drive itself (drag, assistive tech).
      let alignTimer;
      const alignRow = () => {
        const row = view?.cards;
        if (!row) return;
        const stops = stopsOf(row);
        if (!stops.length) return;
        const target = stops.reduce((best, stop) =>
          (Math.abs(stop - row.scrollLeft) < Math.abs(best - row.scrollLeft) ? stop : best), stops[0]);
        if (Math.abs(target - row.scrollLeft) > 0.5) row.scrollTo({ left: target, behavior: "smooth" });
      };
      view.cards.addEventListener("scroll", () => {
        clearTimeout(alignTimer);
        alignTimer = setTimeout(alignRow, 160);
      }, { signal });

      // One wheel notch advances a whole view: a plain wheel scrolls the row sideways, lands on
      // a card start, and nothing behind the popup moves. Trackpads emit many small deltas, so
      // they are accumulated and rate-limited into the same page steps.
      let wheelDelta = 0;
      let wheelLock = 0;
      view.cards.addEventListener("wheel", (event) => {
        event.preventDefault();
        const row = view.cards;
        wheelDelta += event.deltaY;
        const now = Date.now();
        if (now < wheelLock || Math.abs(wheelDelta) < 30) return;
        const forward = wheelDelta > 0;
        wheelDelta = 0;
        wheelLock = now + 180;
        const stops = [...new Set(stopsOf(row))].sort((a, b) => a - b);
        if (!stops.length) return;
        const max = Math.max(0, row.scrollWidth - row.clientWidth);
        const at = row.scrollLeft;
        const reach = row.clientWidth;
        // One notch advances a whole view: the furthest card start that still fits on screen, so a
        // single notch already shows the next pair of cards instead of stepping one card at a time.
        const target = forward
          ? (stops.filter((stop) => stop > at + 1 && stop <= at + reach).pop() ?? max)
          : ([...stops].filter((stop) => stop < at - 1 && stop >= at - reach).shift() ?? 0);
        if (Math.abs(target - at) < 1) return;
        row.scrollTo({ left: target, behavior: "smooth" });
      }, { passive: false, signal });
      root.addEventListener("wheel", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, { passive: false, signal });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); }, { capture: true, signal });
      document.addEventListener("click", (event) => {
        if (!view || view.closing) return;
        if (view.root.contains(event.target) || event.target.closest?.("#djx-button")) return;
        close();
      }, { capture: true, signal });
      window.addEventListener("resize", () => { if (view && !view.closing) place(view.root); }, { signal });

      document.body.append(root);
      place(root);
      applyPalette();
      loadSuggestions();

      // Trigger smooth entrance animation
      void root.offsetWidth;
      root.classList.add("djx-visible");
      view.input.focus();
    }

    function toggle() {
      if (view && !view.closing) close();
      else open();
    }

    // Mount our persistent button into .main-nowPlayingBar-extraControls to the left of lyrics
    function mountButton() {
      const bar = document.querySelector(".main-nowPlayingBar-extraControls");
      if (!bar) return;
      let button = document.getElementById("djx-button");
      if (!button) {
        button = document.createElement("button");
        button.id = "djx-button";
        button.type = "button";
        button.className = "e-10860-legacy-button e-10860-legacy-button-tertiary e-10860-overflow-wrap-anywhere e-10860-button-tertiary--icon-only-small e-10860-button-tertiary--icon-only e-10860-button-tertiary--text-subdued encore-internal-color-text-subdued";
        button.setAttribute("aria-label", "DJ");
        button.innerHTML = ICONS.dj;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          toggle();
        });
        if (typeof sp.Tippy === "function") {
          sp.Tippy(button, {
            allowHTML: true,
            content: tooltip("DJ"),
            animation: "fade",
            delay: [200, 0],
          });
        }
      }
      const lyrics = bar.querySelector('button[data-testid="lyrics-button"]');
      if (lyrics && lyrics.parentElement === bar) {
        if (button.nextElementSibling !== lyrics) lyrics.before(button);
      } else if (button.parentElement !== bar) {
        bar.prepend(button);
      }
    }

    // The icon carries DJ's accent green while a DJ set is playing — not while the sheet is open,
    // so it reads as "DJ is on air" at a glance. Driven by the same body observer that keeps the
    // button mounted, which fires constantly during playback.
    function syncDjOnAir() {
      const button = document.getElementById("djx-button");
      if (!button) return;
      const state = sp.Platform.PlayerAPI.getState?.();
      // A snapshot taken mid-switch has no context; keep the previous reading instead of flickering.
      if (!state?.context?.uri) return;
      button.style.setProperty("--djx-accent", djPalette(state.context.metadata).accent);
      button.classList.toggle("djx-active", isDJ(state));
    }

    // Spotify hides its own like button from the player bar while a DJ set is playing. Put an
    // identical one back into the same widget, so a DJ track can still be liked from the bar.
    // Our own button carries the same aria-label, so it must never count as the native one.
    const NATIVE_LIKE = 'button[aria-label="Add to Liked Songs"]:not(#djx-like-button), '
      + 'button[aria-label="Remove from Liked Songs"]:not(#djx-like-button)';

    function tooltip(text) {
      return '<div id="context-menu"><div class="a_QAHZU3VTgG_kDYWmDv" style="background-color:rgb(40,40,40);color:#fff;border-radius:4px;padding:4px 8px;font-size:14px;font-weight:400;box-shadow:rgba(0,0,0,0.3) 0px 16px 24px,rgba(0,0,0,0.2) 0px 6px 8px;line-height:1.4;"><span id="hover-or-focus-tooltip" role="tooltip">'
        + text + "</span></div></div>";
    }

    function likeGlyph(liked) {
      const icons = sp.SVGIcons || {};
      const glyph = icons[liked ? "check-alt-fill" : "plus-alt"] || icons[liked ? "check" : "plus"] || "";
      return `<svg role="img" height="16" width="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">${glyph}</svg>`;
    }

    function paintLike(button, liked) {
      const label = liked ? "Remove from Liked Songs" : "Add to Liked Songs";
      button.innerHTML = likeGlyph(liked);
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(liked));
      button.classList.toggle("djx-liked", liked);
      button._tippy?.setContent(tooltip(label));
    }

    async function readLike(button, uri) {
      try {
        const [liked] = await sp.Platform.LibraryAPI.contains(uri);
        if (button.isConnected && button.dataset.uri === uri) paintLike(button, !!liked);
      } catch { /* the button simply keeps its current glyph */ }
    }

    async function toggleLike(button) {
      const uri = button.dataset.uri;
      const liked = button.getAttribute("aria-pressed") === "true";
      try {
        if (liked) await sp.Platform.LibraryAPI.remove({ uris: [uri] });
        else await sp.Platform.LibraryAPI.add({ uris: [uri] });
      } catch { return; }
      paintLike(button, !liked);
    }

    function mountLikeButton() {
      const widget = document.querySelector('[data-testid="now-playing-widget-v2"]');
      const existing = document.getElementById("djx-like-button");
      const state = sp.Platform.PlayerAPI.getState?.();
      const uri = state?.item?.uri;
      const wanted = !!widget && isDJ(state) && uri?.startsWith("spotify:track:") && !widget.querySelector(NATIVE_LIKE);
      // Spotify's like button lives in the widget's last slot, right of the track info; use that
      // slot when it is there and fall back to the widget itself if a build drops it.
      const slot = widget && widget.children.length >= 3 ? widget.lastElementChild : widget;
      if (!wanted) {
        existing?.remove();
        return;
      }
      if (existing) {
        if (slot && existing.parentElement !== slot) slot.append(existing);
        if (existing.dataset.uri !== uri) {
          existing.dataset.uri = uri;
          paintLike(existing, sp.Platform.LibraryAPI?.containsSync?.(uri) === true);
          readLike(existing, uri);
        }
        return;
      }
      const button = document.createElement("button");
      button.id = "djx-like-button";
      button.type = "button";
      button.className = "e-10860-legacy-button e-10860-legacy-button-tertiary e-10860-overflow-wrap-anywhere e-10860-button-tertiary--icon-only-small e-10860-button-tertiary--icon-only e-10860-button-tertiary--text-subdued encore-internal-color-text-subdued";
      button.dataset.uri = uri;
      paintLike(button, sp.Platform.LibraryAPI?.containsSync?.(uri) === true);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleLike(button);
      });
      if (typeof sp.Tippy === "function") {
        sp.Tippy(button, { allowHTML: true, content: tooltip("Add to Liked Songs"), animation: "fade", delay: [200, 0] });
      }
      slot.append(button);
      readLike(button, uri);
    }

    // Spotify's React re-renders the player bar constantly; re-checking the like button on every
    // mutation is throttled so a re-render cannot turn into a mount/remove storm.
    let likeMountAt = 0;
    let likeMounts = 0;
    function scheduleLikeMount() {
      const now = Date.now();
      if (now - likeMountAt < 500) return;
      likeMountAt = now;
      mountLikeButton();
      likeMounts += 1;
    }

    // Keep the button present and mounted across all React re-renders, track changes and narration
    new MutationObserver(() => {
      mountButton();
      syncDjOnAir();
      scheduleLikeMount();
    }).observe(document.body, { childList: true, subtree: true });
    mountButton();
    syncDjOnAir();
    scheduleLikeMount();

    // Intercept clicks on Spotify's native DJ button if it receives clicks
    document.addEventListener("click", (event) => {
      const btn = event.target?.closest?.("button");
      if (!isDJButton(btn) || btn.id === "djx-button") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle();
    }, true);

    // Shift + D, but never while a field has focus — in Spotify's search box, a playlist name or
    // the prompt itself a capital D is just a D.
    document.addEventListener("keydown", (event) => {
      if (event.code !== "KeyD" || !event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target;
      // Typing always wins: in Spotify's search box or a playlist name a capital D is just a D.
      // Inside our own sheet the shortcut still toggles, so it can close what it opened.
      if (!view?.root.contains(target) && target instanceof HTMLElement
        && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      event.preventDefault();
      toggle();
    });

    window.DJX = Object.freeze({
      version: VERSION, open, close, toggle,
      getStatus: () => ({ pending: state.pending, lastError: state.lastError, lastRequestId: state.lastRequestId, likeMounts }),
    });
    console.info(`[DJX] ${VERSION} loaded`);
  }
  boot();
})();
