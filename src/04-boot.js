    function toggle() {
      if (view && !view.closing) close();
      else open();
    }

    const FALLBACK_BTN_CLASS = "main-genericButton-button e-101111-legacy-button e-101111-legacy-button-tertiary e-101111-overflow-wrap-anywhere e-101111-button-tertiary--icon-only-small e-101111-button-tertiary--icon-only e-101111-button-tertiary--text-subdued encore-internal-color-text-subdued";

    function nativeButtonClasses(bar) {
      const sibling = bar.querySelector('button[data-testid="lyrics-button"], button.main-genericButton-button:not(#djx-button)');
      if (!sibling?.className) return FALLBACK_BTN_CLASS;
      const kept = sibling.className
        .split(/\s+/)
        .filter((cls) => cls && !cls.endsWith("-active") && !/^djx-/i.test(cls) && !/^SpicyLyrics/i.test(cls));
      if (!kept.includes("main-genericButton-button")) kept.unshift("main-genericButton-button");
      return kept.join(" ") || FALLBACK_BTN_CLASS;
    }

    // Mount our persistent button into .main-nowPlayingBar-extraControls to the left of lyrics
    function mountButton() {
      const bar = document.querySelector(".main-nowPlayingBar-extraControls");
      if (!bar) return;
      const lyrics = bar.querySelector('button[data-testid="lyrics-button"]');
      let button = document.getElementById("djx-button");
      if (!button) {
        button = document.createElement("button");
        button.id = "djx-button";
        button.type = "button";
        button.className = nativeButtonClasses(bar);
        button.setAttribute("aria-label", "DJ");
        button.setAttribute("aria-haspopup", "menu");
        button.innerHTML = `<span aria-hidden="true" class="Wrapper-sm-only Wrapper-small-only">${ICONS.dj}</span>`;
        if (lyrics) button.dataset.djxStyled = "1";
        let tippyInstance = null;
        if (typeof sp.Tippy === "function") {
          tippyInstance = sp.Tippy(button, {
            allowHTML: true,
            content: tooltip("DJ"),
            animation: "fade",
            delay: [200, 0],
          });
        }
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          tippyInstance?.hide?.();
          toggle();
        });
        button.addEventListener("contextmenu", (event) => {
          tippyInstance?.hide?.();
          openContextMenu(button, event);
        });
      } else if (button.dataset.djxStyled !== "1") {
        const cls = nativeButtonClasses(bar);
        const keepActive = button.classList.contains("djx-active");
        const keepPending = button.classList.contains("djx-pending");
        button.className = cls;
        if (keepActive) button.classList.add("djx-active");
        if (keepPending) button.classList.add("djx-pending");
        if (lyrics) button.dataset.djxStyled = "1";
      }

      if (lyrics && lyrics.parentElement === bar) {
        if (button.nextElementSibling !== lyrics) lyrics.before(button);
      } else if (button.parentElement !== bar) {
        bar.prepend(button);
      }
      syncPendingState();
    }

    // The icon carries DJ's accent green while a DJ set is playing — so it reads as
    // "DJ is on air" at a glance.
    function syncDjOnAir() {
      const button = document.getElementById("djx-button");
      if (!button) return;
      const stateSnapshot = sp.Platform.PlayerAPI.getState?.();
      // A snapshot taken mid-switch has no context; keep the previous reading instead of flickering.
      if (!stateSnapshot?.context?.uri) return;
      button.style.setProperty("--djx-accent", djPalette(stateSnapshot.context.metadata).accent);
      button.classList.toggle("djx-active", isDJ(stateSnapshot));
    }

    function tooltip(text) {
      return '<div id="context-menu"><div class="a_QAHZU3VTgG_kDYWmDv" style="background-color:rgb(40,40,40);color:#fff;border-radius:4px;padding:4px 8px;font-size:14px;font-weight:400;box-shadow:rgba(0,0,0,0.3) 0px 16px 24px,rgba(0,0,0,0.2) 0px 6px 8px;line-height:1.4;"><span id="hover-or-focus-tooltip" role="tooltip">'
        + text + "</span></div></div>";
    }

    function ensureButtonMounted() {
      const btn = document.getElementById("djx-button");
      const bar = btn?.parentElement?.classList?.contains("main-nowPlayingBar-extraControls")
        ? btn.parentElement
        : document.querySelector(".main-nowPlayingBar-extraControls");
      if (!bar) return;
      const lyrics = bar.querySelector('button[data-testid="lyrics-button"]');
      if (!btn || btn.parentElement !== bar || btn.dataset.djxStyled !== "1"
        || (lyrics && btn.nextElementSibling !== lyrics)) {
        mountButton();
        syncDjOnAir();
      }
    }

    new MutationObserver(ensureButtonMounted).observe(document.body, { childList: true, subtree: true });
    sp.Platform.PlayerAPI.getEvents?.()?.addListener?.("update", () => {
      syncDjOnAir();
      syncPanelTrack();
    });
    sp.Platform.ProductStateAPI?.getEvents?.()?.addListener?.("update", () => {
      void syncDJSettings();
    });
    mountButton();
    syncDjOnAir();
    void syncDJSettings();

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
      version: VERSION,
      open,
      close,
      toggle,
      openVoicePicker,
      openCommentarySettings,
      getStatus: () => ({
        pending: state.pending,
        lastError: state.lastError,
        lastRequestId: state.lastRequestId,
        personaId: state.personaId,
        commentary: state.commentary,
      }),
    });
    console.info(`[DJX] ${VERSION} loaded`);
  }
  boot();
})();
