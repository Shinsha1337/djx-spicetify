  if (window.DJX || window.__DJX_BOOTING__) return;
  window.__DJX_BOOTING__ = true;

  function boot() {
    const sp = window.Spicetify;
    if (!sp?.Platform?.PlayerAPI?.getState || !sp.Platform.PlayerAPI.canSendSignal || !sp.Platform.PlayerAPI.sendSignal
      || !document.body) {
      setTimeout(boot, 500);
      return;
    }
    if (window.DJX) return;

    const client = createClient(sp);
    const suggestionCache = new Map();
    const cachedSettings = normalizeDJSettings(
      sp.Platform.ProductStateAPI?.getCachedValues?.() || sp.Platform.initialProductState
    );
    const state = {
      draft: "",
      pending: 0,
      lastError: null,
      lastRequestId: null,
      personaId: cachedSettings.personaId,
      commentary: cachedSettings.commentary,
      history: [],
      historyIndex: -1,
      historyDraft: "",
    };
    let view;
    let closeContextMenu = () => {};
    let closeModal = () => {};

    const style = document.createElement("style");
    style.id = "djx-style";
    style.textContent = STYLE;
    document.head.append(style);

    let styleObserver;
    let styleMoves = 0;
    function keepStyleLast() {
      if (style === document.head.lastElementChild) return;
      if (++styleMoves > 16) {
        styleObserver?.disconnect();
        return;
      }
      document.head.append(style);
    }
    keepStyleLast();
    styleObserver = new MutationObserver(keepStyleLast);
    styleObserver.observe(document.head, { childList: true });

    // Position popup neatly above the player bar, right-aligned to the player controls
    function place(root) {
      const bar = document.querySelector(".main-nowPlayingBar-container")?.getBoundingClientRect();
      const bottom = bar ? Math.max(16, innerHeight - bar.top + 8) : 96;
      root.style.bottom = `${Math.round(bottom)}px`;
      root.style.right = "16px";
    }

    function applyPalette() {
      if (!view) return;
      const palette = djPalette(sp.Platform.PlayerAPI.getState?.()?.context?.metadata);
      for (const [name, value] of Object.entries(palette)) view.root.style.setProperty(`--djx-${name}`, value);
    }

    function syncPendingState() {
      const button = document.getElementById("djx-button");
      if (button) button.classList.toggle("djx-pending", state.pending > 0);
    }

    function syncPanelSettings() {
      if (!view) return;
      const persona = findPersona(state.personaId);
      if (view.hero) view.hero.textContent = persona.interactivityTitle;
      if (view.input) {
        view.input.placeholder = `Enter a request in this language: ${persona.languageDisplayName || "English"}`;
      }
      if (!view.closing) {
        const track = sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "";
        const cacheKey = track ? `${state.personaId}|${track}` : "";
        if (cacheKey && cacheKey !== view.cacheKey) loadSuggestions();
      }
    }

    function close() {
      const current = view;
      if (!current || current.closing) return;
      current.closing = true;
      view = undefined;
      current.dismiss.abort();
      current.root.classList.remove("djx-visible");
      current.root.classList.add("djx-closing");
      setTimeout(() => {
        current.root.remove();
      }, 190);
    }

    function dispatch(action) {
      state.pending++;
      syncPendingState();
      state.lastError = null;
      state.lastRequestId = null;
      Promise.resolve().then(() => action())
        .then((result) => { if (result?.requestId) state.lastRequestId = result.requestId; })
        .catch((error) => {
          const failure = readableError(error);
          if (failure.code === "cancelled") return;
          state.lastError = failure.code;
          sp.showNotification?.(failure.message, true);
        })
        .finally(() => {
          state.pending--;
          syncPendingState();
        });
    }

    // Placeholder cards for the moment before the backend answers, exactly like the phone.
    function skeletonCards(count = MAX_SUGGESTIONS) {
      return Array.from({ length: count }, () => {
        const card = document.createElement("div");
        card.className = "djx-skeleton";
        card.setAttribute("aria-hidden", "true");
        card.innerHTML = '<span class="djx-bar"></span><span class="djx-bar djx-bar-short"></span>';
        return card;
      });
    }

    function clearDynamicCards(row) {
      for (const node of [...row.querySelectorAll(".djx-skeleton, .djx-suggest")]) node.remove();
    }

    function renderSuggestions(row, prompts) {
      clearDynamicCards(row);
      for (const text of prompts) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "djx-suggest";
        card.textContent = text;
        card.addEventListener("click", () => submit(text));
        row.append(card);
      }
    }

    // Suggestion cards are the same server-side ideas the phone shows: fetched for the
    // track that is playing right now, and cached briefly in memory per persona + track.
    function loadSuggestions() {
      const current = view;
      if (!current || current.closing) return;
      const track = sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "";
      const cacheKey = track ? `${state.personaId}|${track}` : "";
      current.cacheKey = cacheKey;
      clearDynamicCards(current.cards);

      if (cacheKey && suggestionCache.has(cacheKey)) {
        renderSuggestions(current.cards, suggestionCache.get(cacheKey));
        return;
      }

      const skeletons = skeletonCards();
      current.cards.append(...skeletons);
      fetchSuggestedPrompts(sp).then((prompts) => {
        if (!view || view !== current || current.closing) {
          for (const card of skeletons) card.remove();
          return;
        }
        const liveTrack = sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "";
        const liveKey = liveTrack ? `${state.personaId}|${liveTrack}` : "";
        if (liveKey !== cacheKey) {
          for (const card of skeletons) card.remove();
          return;
        }
        if (cacheKey && prompts.length) {
          if (suggestionCache.size >= 12) suggestionCache.delete(suggestionCache.keys().next().value);
          suggestionCache.set(cacheKey, prompts);
        }
        renderSuggestions(current.cards, prompts);
      }).catch(() => {
        for (const card of skeletons) card.remove();
      });
    }

    function syncPanelTrack() {
      if (!view || view.closing) return;
      applyPalette();
      const track = sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "";
      const cacheKey = track ? `${state.personaId}|${track}` : "";
      if (cacheKey && cacheKey !== view.cacheKey) loadSuggestions();
    }

    function pushHistory(prompt) {
      if (state.history[state.history.length - 1] !== prompt) {
        state.history.push(prompt);
        if (state.history.length > 20) state.history.shift();
      }
      state.historyIndex = -1;
      state.historyDraft = "";
    }

    function submit(value) {
      if (!view || view.closing) return;
      let prompt;
      try { prompt = normalizePrompt(value ?? view.input.value); } catch { view.input.focus(); return; }
      pushHistory(prompt);
      state.draft = "";
      view.input.value = "";
      dispatch(() => client.request(prompt));
      // The request runs on the client, so the sheet can go away the moment it is sent.
      close();
    }

    function pick() {
      if (!view || view.closing) return;
      state.draft = "";
      state.historyIndex = -1;
      state.historyDraft = "";
      view.input.value = "";
      dispatch(() => client.letDJPick());
      close();
    }

    function open() {
      closeContextMenu();
      closeModal();
      if (view) {
        view.input.focus();
        return;
      }
      for (const stale of document.querySelectorAll("#djx-panel.djx-closing")) stale.remove();
      const root = document.createElement("section");
      root.id = "djx-panel";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-label", "DJ");
      root.innerHTML = `
        <div class="djx-top">
          <h1 class="djx-hero"></h1>
          <div class="djx-cards">
            <button type="button" class="djx-pick" aria-label="Let DJ pick">
              ${ICONS.pick}
              <span>Let DJ pick</span>
            </button>
          </div>
        </div>
        <form class="djx-form">
          <input class="djx-input" type="text" maxlength="${MAX_PROMPT}" autocomplete="off" aria-label="Your DJ request">
          <button type="submit" class="djx-submit" aria-label="Send request">${ICONS.send}</button>
        </form>
      `;
      const current = view = {
        root,
        hero: root.querySelector(".djx-hero"),
        cards: root.querySelector(".djx-cards"),
        pick: root.querySelector(".djx-pick"),
        form: root.querySelector(".djx-form"),
        input: root.querySelector(".djx-input"),
        dismiss: new AbortController(),
        closing: false,
        cacheKey: "",
      };
      syncPanelSettings();
      view.pick.addEventListener("click", pick);
      view.form.addEventListener("submit", (event) => { event.preventDefault(); submit(); });
      view.input.value = state.draft;
      view.input.addEventListener("input", (event) => {
        state.draft = event.target.value;
        state.historyIndex = -1;
      });
      view.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();
          submit();
          return;
        }
        if (event.key === "ArrowUp" && state.history.length) {
          event.preventDefault();
          if (state.historyIndex === -1) {
            state.historyDraft = view.input.value;
            state.historyIndex = state.history.length - 1;
          } else if (state.historyIndex > 0) {
            state.historyIndex--;
          }
          view.input.value = state.history[state.historyIndex];
          state.draft = view.input.value;
          const end = view.input.value.length;
          view.input.setSelectionRange?.(end, end);
          return;
        }
        if (event.key === "ArrowDown" && state.historyIndex !== -1) {
          event.preventDefault();
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            view.input.value = state.history[state.historyIndex];
          } else {
            state.historyIndex = -1;
            view.input.value = state.historyDraft;
          }
          state.draft = view.input.value;
          const end = view.input.value.length;
          view.input.setSelectionRange?.(end, end);
        }
      });
      // Prevent Spotify global shortcuts while typing in the popup. Shift + D is let through
      // outside the text field so the shortcut can close the sheet it opened.
      root.addEventListener("keydown", (event) => {
        if (event.code === "KeyD" && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey
          && event.target !== current.input) return;
        event.stopPropagation();
      });
      // The popup is a dialog: Tab cycles inside it instead of walking into the page behind.
      root.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const items = [...root.querySelectorAll("button, input")].filter((el) => !el.disabled);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
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
        const row = current.cards;
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
      signal.addEventListener("abort", () => clearTimeout(alignTimer), { once: true });

      // One wheel notch or horizontal trackpad swipe advances a whole view: stops on a card start,
      // and nothing behind the popup moves.
      let wheelDelta = 0;
      let wheelLock = 0;
      view.cards.addEventListener("wheel", (event) => {
        event.preventDefault();
        const row = view.cards;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        wheelDelta += delta;
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
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        close();
        document.getElementById("djx-button")?.focus?.();
      }, { capture: true, signal });
      document.addEventListener("click", (event) => {
        if (!view || view.closing) return;
        if (view.root.contains(event.target) || event.target.closest?.("#djx-button")) return;
        close();
      }, { capture: true, signal });
      window.addEventListener("resize", () => { if (view && !view.closing) place(view.root); }, { signal });

      const playerBar = document.querySelector(".main-nowPlayingBar-container");
      if (playerBar && typeof ResizeObserver === "function") {
        const ro = new ResizeObserver(() => { if (view && !view.closing) place(view.root); });
        ro.observe(playerBar);
        signal.addEventListener("abort", () => ro.disconnect(), { once: true });
      }

      document.body.append(root);
      place(root);
      applyPalette();
      loadSuggestions();

      // Trigger smooth entrance animation
      void root.offsetWidth;
      root.classList.add("djx-visible");
      view.input.focus();
      syncDJSettings().then(syncPanelSettings).catch(() => {});
    }
