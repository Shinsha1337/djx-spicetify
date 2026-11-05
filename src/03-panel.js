  function boot() {
    const sp = window.Spicetify;
    if (!sp?.Platform?.PlayerAPI?.getState || !sp.Platform.PlayerAPI.canSendSignal || !sp.Platform.PlayerAPI.sendSignal
      || !document.body) {
      setTimeout(boot, 500);
      return;
    }
    if (window.DJX) return;

    const client = createClient(sp);
    const state = { draft: "", pending: 0, lastError: null, lastRequestId: null };
    let view;

    const style = document.createElement("style");
    style.id = "djx-style";
    style.textContent = STYLE;
    document.head.append(style);

    function keepStyleLast() {
      if (style !== document.head.lastElementChild) document.head.append(style);
    }
    keepStyleLast();
    new MutationObserver(keepStyleLast).observe(document.head, { childList: true });

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
        .finally(() => { state.pending--; });
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

    // Suggestion cards are the same server-side ideas the phone shows: fetched for the
    // track that is playing right now, and dropped if playback moved on meanwhile.
    function loadSuggestions() {
      const current = view;
      const track = sp.Platform.PlayerAPI.getState?.()?.item?.uri;
      const skeletons = skeletonCards();
      current.cards.append(...skeletons);
      const clear = () => { for (const card of skeletons) card.remove(); };
      fetchSuggestedPrompts(sp).then((prompts) => {
        clear();
        if (!view || view !== current || current.closing) return;
        if (sp.Platform.PlayerAPI.getState?.()?.item?.uri !== track) return;
        for (const text of prompts) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "djx-suggest";
          card.textContent = text;
          card.addEventListener("click", () => submit(text));
          current.cards.append(card);
        }
      }).catch(clear);
    }

    function submit(value) {
      if (!view || view.closing) return;
      let prompt;
      try { prompt = normalizePrompt(value ?? view.input.value); } catch { view.input.focus(); return; }
      state.draft = "";
      view.input.value = "";
      dispatch(() => client.request(prompt));
      // The request runs on the client, so the sheet can go away the moment it is sent.
      close();
    }

    function pick() {
      if (!view || view.closing) return;
      state.draft = "";
      view.input.value = "";
      dispatch(() => client.letDJPick());
      close();
    }

    function open() {
      if (view) {
        if (view.closing) {
          view.closing = false;
          view.root.classList.remove("djx-closing");
          view.root.classList.add("djx-visible");
          view.input.focus();
          return;
        }
        view.input.focus();
        return;
      }
      const root = document.createElement("section");
      root.id = "djx-panel";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-label", "DJ X");
      root.innerHTML = `
        <div class="djx-top">
          <h1 class="djx-hero">Your DJ X here. What can I play for you?</h1>
          <div class="djx-cards">
            <button type="button" class="djx-pick" aria-label="Let DJ pick">
              ${ICONS.pick}
              <span>Let DJ pick</span>
            </button>
          </div>
        </div>
        <form class="djx-form">
          <input class="djx-input" type="text" maxlength="${MAX_PROMPT}" autocomplete="off"
            placeholder="Enter a request in this language: English" aria-label="Your DJ X request">
          <button type="submit" class="djx-submit" aria-label="Send request">${ICONS.send}</button>
        </form>
      `;
      view = {
        root,
        cards: root.querySelector(".djx-cards"),
        pick: root.querySelector(".djx-pick"),
        form: root.querySelector(".djx-form"),
        input: root.querySelector(".djx-input"),
        dismiss: new AbortController(),
        closing: false,
      };
      view.pick.addEventListener("click", pick);
      view.form.addEventListener("submit", (event) => { event.preventDefault(); submit(); });
      view.input.value = state.draft;
      view.input.addEventListener("input", (event) => { state.draft = event.target.value; });
      view.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();
          submit();
        }
      });
      // Prevent Spotify global shortcuts while typing in the popup. Shift + D is let through so
      // the shortcut can close the sheet it opened.
      root.addEventListener("keydown", (event) => {
        if (event.code === "KeyD" && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) return;
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
