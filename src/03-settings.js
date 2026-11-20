    async function syncDJSettings() {
      try {
        const next = await readDJSettings(sp);
        state.personaId = next.personaId;
        state.commentary = next.commentary;
        syncPanelSettings();
        return next;
      } catch {
        return { personaId: state.personaId, commentary: state.commentary };
      }
    }

    function escapeHtml(text) {
      return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
      }[ch]));
    }

    const preview = { audio: null, personaId: null, button: null, pausedSpotify: false };

    function setPreviewButtonState(button, personaName, playing) {
      if (!button) return;
      button.classList.toggle("djx-playing", playing);
      button.innerHTML = playing ? ICONS.stop : ICONS.play;
      button.setAttribute(
        "aria-label",
        playing ? `Stop ${personaName} voice preview` : `Play ${personaName} voice preview`
      );
    }

    function stopPreview(keepPaused = false) {
      const { audio, button, pausedSpotify } = preview;
      if (button) {
        const name = button.dataset.personaName || "DJ";
        setPreviewButtonState(button, name, false);
      }
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.src = "";
      }
      preview.audio = null;
      preview.personaId = null;
      preview.button = null;
      if (!keepPaused && pausedSpotify) {
        preview.pausedSpotify = false;
        sp.Platform.PlayerAPI.resume?.()?.catch?.(() => {});
      }
    }

    function togglePreview(persona, button) {
      if (preview.personaId === persona.personaId && preview.audio) {
        stopPreview(false);
        return;
      }
      const wasSpotifyPlaying = !preview.pausedSpotify && sp.Platform.PlayerAPI.getState?.()?.isPaused === false;
      stopPreview(true);
      if (wasSpotifyPlaying) {
        preview.pausedSpotify = true;
        sp.Platform.PlayerAPI.pause?.()?.catch?.(() => {});
      }
      if (typeof Audio !== "function" || !persona.previewUrl) return;
      const audio = new Audio(persona.previewUrl);
      const volume = sp.Platform.PlaybackAPI?.getVolume?.();
      if (typeof volume === "number" && Number.isFinite(volume)) {
        audio.volume = Math.min(1, Math.max(0.1, volume));
      }
      preview.audio = audio;
      preview.personaId = persona.personaId;
      preview.button = button;
      setPreviewButtonState(button, persona.personaName, true);
      audio.onended = () => {
        if (preview.audio === audio) stopPreview(false);
      };
      audio.onerror = () => {
        if (preview.audio === audio) {
          stopPreview(false);
          sp.showNotification?.("Unable to play voice preview", true);
        }
      };
      audio.play()?.catch?.(() => {
        if (preview.audio === audio) {
          stopPreview(false);
          sp.showNotification?.("Unable to play voice preview", true);
        }
      });
    }

    let activeModal = null;

    closeModal = function closeCurrentModal(keepPaused = false) {
      stopPreview(keepPaused);
      const current = activeModal;
      if (!current || current.closing) return;
      current.closing = true;
      activeModal = null;
      current.dismiss.abort();
      current.backdrop.removeAttribute("id");
      current.modal.removeAttribute("id");
      current.backdrop.classList.remove("djx-visible");
      setTimeout(() => current.backdrop.remove(), 160);
    };

    function mountModal({ className = "", title, subtitle = "", keepPaused = false, buildBody }) {
      closeContextMenu();
      closeModal(keepPaused);

      const backdrop = document.createElement("div");
      backdrop.id = "djx-modal-backdrop";

      const modal = document.createElement("div");
      modal.id = "djx-modal";
      if (className) modal.className = className;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      const header = document.createElement("div");
      header.className = "djx-modal-header";
      const heading = document.createElement("h2");
      heading.className = "djx-modal-title";
      heading.textContent = title;
      modal.setAttribute("aria-label", title);

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "djx-modal-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.innerHTML = ICONS.close;
      closeBtn.addEventListener("click", () => closeModal());
      header.append(heading, closeBtn);
      modal.append(header);

      if (subtitle) {
        const desc = document.createElement("p");
        desc.className = "djx-modal-subtitle";
        desc.textContent = subtitle;
        modal.append(desc);
      }

      const dismiss = new AbortController();
      const { signal } = dismiss;
      const active = { backdrop, modal, dismiss, closing: false };
      activeModal = active;

      buildBody(modal, signal);
      backdrop.append(modal);

      modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }
        if (event.key === "Tab") {
          const items = [...modal.querySelectorAll("button")].filter((el) => !el.disabled);
          if (!items.length) return;
          const first = items[0], last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        event.stopPropagation();
      }, { signal });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeModal();
        }
      }, { capture: true, signal });

      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) closeModal();
      }, { signal });

      document.body.append(backdrop);
      void backdrop.offsetWidth;
      backdrop.classList.add("djx-visible");
      (modal.querySelector("button:not(.djx-modal-close)") || closeBtn).focus();
    }

    function openRestartConfirm() {
      mountModal({
        className: "djx-confirm-modal",
        title: "DJ will restart",
        keepPaused: true,
        buildBody(modal) {
          const copy = document.createElement("p");
          copy.className = "djx-confirm-copy";
          copy.textContent = "Your DJ session will start again with the new setting";

          const actions = document.createElement("div");
          actions.className = "djx-confirm-actions";

          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.className = "djx-btn-secondary";
          cancelBtn.textContent = "Not now";
          cancelBtn.addEventListener("click", () => closeModal(false));

          const confirmBtn = document.createElement("button");
          confirmBtn.type = "button";
          confirmBtn.className = "djx-btn-primary";
          confirmBtn.textContent = "Restart DJ";
          confirmBtn.addEventListener("click", () => {
            closeModal(true);
            dispatch(() => client.restart());
          });

          actions.append(cancelBtn, confirmBtn);
          modal.append(copy, actions);
        },
      });
    }

    async function applySettingChange(key, value) {
      const prev = key === PRODUCT_STATE_DJ_LANGUAGE ? state.personaId : state.commentary;
      try {
        await writeDJSetting(sp, key, value);
        if (key === PRODUCT_STATE_DJ_LANGUAGE) state.personaId = value;
        else state.commentary = value;
        syncPanelSettings();
      } catch (error) {
        const failure = readableError(error);
        sp.showNotification?.(failure.message, true);
        return false;
      }
      const djPlaying = isDJ(sp.Platform.PlayerAPI.getState?.());
      if (djPlaying && prev !== value) openRestartConfirm();
      return true;
    }

    function openVoicePicker() {
      syncDJSettings().then(() => {
        if (!activeModal?.modal) return;
        for (const row of activeModal.modal.querySelectorAll("[data-persona-id]")) {
          const active = row.dataset.personaId === state.personaId;
          row.classList.toggle("djx-selected", active);
          row.querySelector(".djx-option-select")?.setAttribute("aria-checked", String(active));
        }
      });

      mountModal({
        title: "Pick your DJ",
        subtitle: "Pick your character. They all share the same Spotify brain, but each has its own personality and speaking style.",
        buildBody(modal) {
          const body = document.createElement("div");
          body.className = "djx-modal-body";
          body.setAttribute("role", "radiogroup");
          body.setAttribute("aria-label", "Pick your DJ");

          for (const group of DJ_LANGUAGES) {
            const section = document.createElement("div");
            section.className = "djx-lang-group";
            const heading = document.createElement("div");
            heading.className = "djx-lang-heading";
            heading.textContent = group.displayName;
            section.append(heading);

            for (const persona of group.personas) {
              const selected = persona.personaId === state.personaId;
              const row = document.createElement("div");
              row.className = `djx-option-row${selected ? " djx-selected" : ""}`;
              row.dataset.personaId = persona.personaId;

              const playBtn = document.createElement("button");
              playBtn.type = "button";
              playBtn.className = "djx-preview-btn";
              playBtn.dataset.personaName = persona.personaName;
              setPreviewButtonState(playBtn, persona.personaName, false);
              playBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                togglePreview(persona, playBtn);
              });

              const selectBtn = document.createElement("button");
              selectBtn.type = "button";
              selectBtn.className = "djx-option-select";
              selectBtn.setAttribute("role", "radio");
              selectBtn.setAttribute("aria-checked", String(selected));
              selectBtn.innerHTML = `
                <span class="djx-option-copy">
                  <span class="djx-option-title">${escapeHtml(persona.personaName)}</span>
                  <span class="djx-option-desc">${escapeHtml(persona.descriptor)}</span>
                </span>
                <span class="djx-option-check" aria-hidden="true">${ICONS.check}</span>
              `;

              const choose = async () => {
                for (const item of body.querySelectorAll("[data-persona-id]")) {
                  const active = item === row;
                  item.classList.toggle("djx-selected", active);
                  item.querySelector(".djx-option-select")?.setAttribute("aria-checked", String(active));
                }
                const ok = await applySettingChange(PRODUCT_STATE_DJ_LANGUAGE, persona.personaId);
                if (!ok) {
                  for (const item of body.querySelectorAll("[data-persona-id]")) {
                    const active = item.dataset.personaId === state.personaId;
                    item.classList.toggle("djx-selected", active);
                    item.querySelector(".djx-option-select")?.setAttribute("aria-checked", String(active));
                  }
                }
              };

              selectBtn.addEventListener("click", choose);
              row.addEventListener("click", (event) => {
                if (event.target.closest(".djx-preview-btn") || event.target.closest(".djx-option-select")) return;
                choose();
              });

              row.append(playBtn, selectBtn);
              section.append(row);
            }
            body.append(section);
          }

          modal.append(body);
        },
      });
    }

    function openCommentarySettings() {
      syncDJSettings().then(() => {
        if (!activeModal?.modal) return;
        for (const row of activeModal.modal.querySelectorAll("[data-commentary-id]")) {
          const active = row.dataset.commentaryId === state.commentary;
          row.classList.toggle("djx-selected", active);
          row.setAttribute("aria-checked", String(active));
        }
      });

      mountModal({
        title: "DJ commentary",
        buildBody(modal) {
          const body = document.createElement("div");
          body.className = "djx-modal-body";
          body.setAttribute("role", "radiogroup");
          body.setAttribute("aria-label", "DJ commentary");

          for (const option of COMMENTARY_OPTIONS) {
            const selected = option.id === state.commentary;
            const row = document.createElement("button");
            row.type = "button";
            row.className = `djx-option-row${selected ? " djx-selected" : ""}`;
            row.dataset.commentaryId = option.id;
            row.setAttribute("role", "radio");
            row.setAttribute("aria-checked", String(selected));
            row.innerHTML = `
              <span class="djx-option-copy">
                <span class="djx-option-title">${escapeHtml(option.title)}</span>
                <span class="djx-option-desc">${escapeHtml(option.subtitle)}</span>
              </span>
              <span class="djx-option-check" aria-hidden="true">${ICONS.check}</span>
            `;
            row.addEventListener("click", async () => {
              for (const item of body.querySelectorAll("[data-commentary-id]")) {
                const active = item === row;
                item.classList.toggle("djx-selected", active);
                item.setAttribute("aria-checked", String(active));
              }
              const ok = await applySettingChange(PRODUCT_STATE_DJ_COMMENTARY, option.id);
              if (!ok) {
                for (const item of body.querySelectorAll("[data-commentary-id]")) {
                  const active = item.dataset.commentaryId === state.commentary;
                  item.classList.toggle("djx-selected", active);
                  item.setAttribute("aria-checked", String(active));
                }
              }
            });
            body.append(row);
          }

          modal.append(body);
        },
      });
    }

    let activeMenu = null;

    closeContextMenu = function closeMenu() {
      const current = activeMenu;
      if (!current) return;
      activeMenu = null;
      current.dismiss.abort();
      current.menu.remove();
    };

    function placeContextMenu(menu, anchor, event) {
      const width = menu.offsetWidth || 248;
      const height = menu.offsetHeight || 116;
      const rect = anchor?.getBoundingClientRect?.();
      const pointerX = Number.isFinite(event?.clientX) && event.clientX > 0 ? event.clientX : null;
      const desiredLeft = rect
        ? rect.right - width
        : (pointerX ?? innerWidth - 16) - width;
      const left = Math.max(8, Math.min(desiredLeft, innerWidth - width - 8));
      const top = rect
        ? Math.max(8, rect.top - height - 8)
        : Math.max(8, (event?.clientY ?? innerHeight - 80) - height - 8);
      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;
    }

    function openContextMenu(anchor, event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if (view && !view.closing) close();
      closeModal();
      closeContextMenu();

      const menu = document.createElement("div");
      menu.id = "djx-context-menu";
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-label", "DJ settings");

      const currentCommentary = () =>
        (COMMENTARY_OPTIONS.find((opt) => opt.id === state.commentary) || COMMENTARY_OPTIONS[0]).title;

      menu.innerHTML = `
        <ul>
          <li>
            <button type="button" class="djx-ctx-item" role="menuitem" data-action="voice">
              ${ICONS.voice}
              <span class="djx-ctx-text">
                <span class="djx-ctx-label">Pick your DJ</span>
                <span class="djx-ctx-sub" data-sub="voice"></span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" class="djx-ctx-item" role="menuitem" data-action="commentary">
              ${ICONS.commentary}
              <span class="djx-ctx-text">
                <span class="djx-ctx-label">DJ commentary</span>
                <span class="djx-ctx-sub" data-sub="commentary"></span>
              </span>
            </button>
          </li>
        </ul>
      `;

      const updateLabels = () => {
        const voiceSub = menu.querySelector('[data-sub="voice"]');
        const commentarySub = menu.querySelector('[data-sub="commentary"]');
        if (voiceSub) voiceSub.textContent = findPersona(state.personaId).personaName;
        if (commentarySub) commentarySub.textContent = currentCommentary();
      };
      updateLabels();

      const dismiss = new AbortController();
      const { signal } = dismiss;
      activeMenu = { menu, dismiss };

      menu.querySelector('[data-action="voice"]').addEventListener("click", () => {
        closeContextMenu();
        openVoicePicker();
      });
      menu.querySelector('[data-action="commentary"]').addEventListener("click", () => {
        closeContextMenu();
        openCommentarySettings();
      });

      menu.addEventListener("keydown", (e) => {
        const items = [...menu.querySelectorAll(".djx-ctx-item")];
        const idx = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[(idx + 1) % items.length]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[(idx - 1 + items.length) % items.length]?.focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeContextMenu();
          anchor?.focus?.();
        }
      }, { signal });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeContextMenu();
      }, { capture: true, signal });
      document.addEventListener("pointerdown", (e) => {
        if (!menu.contains(e.target) && e.target !== anchor && !anchor?.contains?.(e.target)) {
          closeContextMenu();
        }
      }, { capture: true, signal });
      window.addEventListener("resize", closeContextMenu, { signal });

      document.body.append(menu);
      placeContextMenu(menu, anchor, event);
      menu.querySelector(".djx-ctx-item")?.focus();
      syncDJSettings().then(() => {
        if (activeMenu?.menu === menu) updateLabels();
      });
    }
