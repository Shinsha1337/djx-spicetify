// NAME: DJ X
// DESCRIPTION: Send text requests to the real Spotify DJ X from desktop.
// AUTHOR: Shinsha (Shinsha1337)
// VERSION: 1.0.0
// No API key, external AI service, or background server required.
(function djx() {
  "use strict";

  const VERSION = "1.0.0";
  const DJ_URI = "spotify:playlist:37i9dQZF1EYkqdzj48dyYq";
  const DJ_IDS = new Set([
    "37i9dQZF1EYkqdzj48dyYq", "37i9dQZF1EYkqdzj8OSOas", "37i9dQZF1EYkqdzjdvy3mw",
    "37i9dQZF1EYkqdzjicdiyA", "37i9dQZF1EYkqdzjmSSxKE", "37i9dQZF1EYkqdzjrzxMWI",
  ]);
  const MAX_PROMPT = 500;
  // Spotify Android reads its prompt ideas from this DJ backend method; the desktop build
  // exposes the same service, so the cards can be server-generated rather than hardcoded.
  const SUGGESTION_URL = "https://spclient.wg.spotify.com/dj-interaction-manager"
    + "/spotify.dj.interactionmanager.v0.DJInteractionManagerService/GetSuggestedPrompts";
  const MAX_SUGGESTIONS = 3;

  class DJError extends Error {
    constructor(message, code = "request_failed") {
      super(message);
      this.name = "DJError";
      this.code = code;
    }
  }

  function normalizePrompt(value) {
    const prompt = String(value ?? "").trim();
    if (!prompt) throw new DJError("Tell DJ what you would like to hear first.", "empty_prompt");
    if (prompt.length > MAX_PROMPT) throw new DJError(`Keep your request under ${MAX_PROMPT + 1} characters.`, "long_prompt");
    return prompt;
  }

  function isDJ(state) {
    const context = state?.context;
    return context?.metadata?.lexicon_set_type === "your_dj"
      || DJ_IDS.has(context?.uri?.replace("spotify:playlist:", ""))
      || context?.uri === "spotify:lexicon:your-dj";
  }

  function encodeVarint(value) {
    const bytes = [];
    do {
      bytes.push((value & 127) | (value > 127 ? 128 : 0));
      value >>>= 7;
    } while (value);
    return bytes;
  }

  function encodeText(field, value) {
    const bytes = new TextEncoder().encode(value || "");
    return [...encodeVarint(field * 8 + 2), ...encodeVarint(bytes.length), ...bytes];
  }

  // Spotify Android 9.1.84: PromptSignalPayload.user_prompt = 1, input_type = 2.
  // The native "prompt" command expects base64 protobuf, not JSON or a bare prompt.
  function encodePromptSignal(value) {
    const bytes = [...encodeText(1, normalizePrompt(value)), 16, 2]; // TEXT = 2.
    return btoa(String.fromCharCode(...bytes));
  }

  // PromptSignalPayload with only input_type = 2 and no user_prompt: DJ picks the set by itself.
  const PICK_PAYLOAD = "EAI=";

  // The request is protobuf: field 1 is the playing track, field 2 is the phone's model
  // selector, which Android leaves at its default of 0.
  function encodeSuggestionRequest(trackUri) {
    return new Uint8Array([...encodeText(1, trackUri), 16, 0]);
  }

  // The response is one repeated string field, so it reads as tag 10, a varint length,
  // then UTF-8 text.
  function decodeSuggestedPrompts(bytes, limit = MAX_SUGGESTIONS) {
    const prompts = [];
    let offset = 0;
    const readVarint = () => {
      let value = 0, shift = 0, byte;
      do {
        if (offset >= bytes.length) return null;
        byte = bytes[offset++];
        value += (byte & 127) * (2 ** shift);
        shift += 7;
      } while (byte >= 128);
      return value;
    };
    while (offset < bytes.length && prompts.length < limit) {
      if (readVarint() !== 10) break;
      const length = readVarint();
      if (length === null || offset + length > bytes.length) break;
      const text = new TextDecoder().decode(bytes.subarray(offset, offset + length)).trim();
      offset += length;
      if (text) prompts.push(text);
    }
    return prompts;
  }

  function accessToken(spicetify) {
    try { return spicetify.Platform.AuthorizationAPI?.getState?.()?.token?.accessToken || null; }
    catch { return null; }
  }

  // Suggestions are a hint, not a requirement: any failure leaves the pick card alone.
  async function fetchSuggestedPrompts(spicetify, limit = MAX_SUGGESTIONS) {
    const track = spicetify.Platform.PlayerAPI?.getState?.()?.item?.uri;
    const token = accessToken(spicetify);
    if (!track || !token) return [];
    const response = await fetch(SUGGESTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-protobuf" },
      body: encodeSuggestionRequest(track),
    });
    if (!response.ok) return [];
    return decodeSuggestedPrompts(new Uint8Array(await response.arrayBuffer()), limit);
  }

  function interactiveRequestIds(state) {
    return new Set([state?.item, ...(state?.nextItems || [])]
      .map((item) => item?.metadata?.idj_request_id).filter(Boolean));
  }

  function readableError(error) {
    if (error instanceof DJError) return error;
    return new DJError("Spotify could not send the DJ command. Check playback and reapply Spicetify if Spotify just updated.", "native_command");
  }

  function createClient(spicetify) {
    const player = spicetify.Platform.PlayerAPI;
    const origin = { featureIdentifier: "endless", referrerIdentifier: "extension" };
    let requests = Promise.resolve();
    let epoch = 0;
    const sleep = () => new Promise((resolve) => setTimeout(resolve, 250));

    async function waitFor(predicate, message, code, ticket = epoch) {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        if (ticket !== epoch) throw new DJError("DJ request cancelled.", "cancelled");
        const result = predicate(player.getState());
        if (result) return result;
        await sleep();
      }
      throw new DJError(message, code);
    }

    async function sendPrompt(prompt, ticket) {
      const parameters = encodePromptSignal(prompt);
      if (isDJ(player.getState())) {
        // DJ is already on air: send into the running session. Restarting it (the branch below)
        // is what made Spotify re-introduce the set on every request.
        await player.sendSignal("prompt", parameters);
        return;
      }
      // The phone starts DJ with this raw signal when DJ is not active, including
      // during queued music. Starting ordinary DJ first would lose the prompt.
      const nativePlay = player._playlistPlayServiceClient;
      if (typeof nativePlay?.play === "function") {
        const reply = await nativePlay.play({
          context: { uri: DJ_URI, url: `context://${DJ_URI}`, isLoading: true },
          rawSignal: { identifier: "prompt", clientPayload: new TextEncoder().encode(parameters) },
          playOrigin: origin,
        });
        if (reply?.status?.statusCode !== 200) {
          throw new DJError("Spotify did not accept the DJ request. Check that DJ is available for this account.", "rejected");
        }
        return;
      }
      // Older Spicetify builds may expose only the public Player API.
      await player.play({ uri: DJ_URI }, origin, {});
      await waitFor((state) => isDJ(state) && player.canSendSignal("prompt"),
        "DJ requests are not ready. Start DJ from Spotify's Music tab and try again.", "missing_session", ticket);
      await player.sendSignal("prompt", parameters);
    }

    async function request(value, onProgress = () => {}) {
      const prompt = normalizePrompt(value);
      const ticket = epoch;
      const run = async () => {
        if (ticket !== epoch) throw new DJError("DJ request cancelled.", "cancelled");
        const before = interactiveRequestIds(player.getState());
        onProgress("DJ is picking music for you...");
        await sendPrompt(prompt, ticket);
        const requestId = await waitFor((state) => {
          if (!isDJ(state)) return false;
          return [...interactiveRequestIds(state)].find((id) => !before.has(id));
        }, "Spotify did not apply your DJ request. Check the music before trying again.", "not_applied", ticket);
        return { prompt, requestId };
      };
      // Match the phone's one-interaction-at-a-time behavior without locking the
      // panel. A second prompt can be entered while Spotify prepares the first.
      const result = requests.then(run).catch((error) => { throw readableError(error); });
      requests = result.catch(() => {});
      return result;
    }

    // Spotify ignores the native "jump" once its DJ interactive window closes; a prompt
    // signal with no request text makes DJ build a fresh set of its own choice instead.
    async function letDJPick() {
      epoch++;
      try {
        if (!isDJ(player.getState())) {
          await player.play({ uri: DJ_URI }, origin, {});
          await waitFor((state) => isDJ(state) && player.canSendSignal("prompt"),
            "DJ is still loading. Try again in a moment.", "missing_session");
        }
        if (!player.canSendSignal("prompt")) {
          throw new DJError("DJ is not taking requests right now. Try again in a moment.", "missing_session");
        }
        await player.sendSignal("prompt", PICK_PAYLOAD);
      } catch (error) {
        throw readableError(error);
      }
    }
    return { request, letDJPick };
  }

  // The player-bar DJ button has no stable id on every build; match its own test ids
  // first and its icon geometry second.
  function isDJButton(button) {
    if (!button) return false;
    return button.id === "djx-button"
      || button.matches?.('button[data-testid="dj-button"], button[data-testid="dj-jump-button"]')
      || !!button.querySelector?.('svg path[d^="M7.813 14.497"]');
  }

  // The DJ context carries its own palette; Spotify renders the DJ view with exactly these.
  const COLOR_KEYS = {
    background: "narration.background.color",
    jumpIcon: "narration.jump.icon.color",
    tag: "home.card.tag_color",
  };

  // Spotify hands these out as #AARRGGBB; CSS wants #RRGGBB.
  function cssColor(value, fallback) {
    const text = String(value ?? "").trim().toLowerCase();
    if (/^#[0-9a-f]{8}$/.test(text)) return `#${text.slice(3)}`;
    if (/^#[0-9a-f]{6}$/.test(text)) return text;
    return fallback;
  }

  function djPalette(metadata = {}) {
    return {
      background: cssColor(metadata[COLOR_KEYS.background], "#0a59b8"),
      accent: cssColor(metadata[COLOR_KEYS.jumpIcon] ?? metadata[COLOR_KEYS.tag], "#19E68C"),
    };
  }

  // A test seam for the request protocol; this branch never runs inside Spotify.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createClient, encodePromptSignal, normalizePrompt, isDJ, DJError, isDJButton, djPalette, PICK_PAYLOAD, encodeSuggestionRequest, decodeSuggestedPrompts, fetchSuggestedPrompts };
    return;
  }

  // Native encore_icon_dj_24 vector from Spotify Android app (res/drawable/encore_icon_dj_24.xml)
  const DJ_ICON_PATH_24 = "M11.74 20.997A9 9 0 0 1 3 12.022c.011-4.92 3.754-7.955 6.986-8.417 1.178-.169 1.792.05 2.183.346.438.333.774.894 1.144 1.773.108.256.216.536.332.834.622 1.61 1.444 3.737 3.443 5.239 1.398 1.05 2.026 2.118 2.208 3.066s-.052 1.917-.65 2.827c-1.22 1.858-3.87 3.31-6.71 3.31zm-.05 2q.155.003.31.003c6.076 0 11-4.924 11-11a10.98 10.98 0 0 0-2.47-6.947 11 11 0 0 0-3.61-2.894A10.96 10.96 0 0 0 12 1C5.925 1 1 5.925 1 12v.045c0 5.966 4.762 10.82 10.69 10.951Zm9.213-9.666c-.482-1.123-1.35-2.183-2.614-3.133-1.502-1.128-2.096-2.64-2.726-4.24a43 43 0 0 0-.407-1.01c-.234-.556-.51-1.138-.886-1.66q0.921,0.241 1.754.659a9.04 9.04 0 0 1 4.417 4.92 9.1 9.1 0 0 1 .463 4.464Z";

  const ICONS = {
    send: '<svg width="20" height="20" viewBox="0 0 16 16" fill="#000000" style="color: #000000;"><path d="M8 14.5a.75.75 0 0 1-.75-.75V4.31L4.03 7.53a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.31v9.44a.75.75 0 0 1-.75.75"/></svg>',
    // The exact 1:1 DJ glyph from the player-bar button, drawn in DJ's accent green: the same
    // variable the active button uses, so the two never drift apart.
    pick: `<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" style="fill: var(--djx-accent, #19E68C); color: var(--djx-accent, #19E68C);"><path d="${DJ_ICON_PATH_24}"/></svg>`,
    dj: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M7.813 14.497A6.5 6.5 0 0 1 1.5 8.016c.008-3.553 2.71-5.744 5.043-6.078.85-.121 1.288.037 1.564.246.312.238.553.639.822 1.276q.115.277.239.602c.451 1.167 1.05 2.717 2.505 3.81 1.01.76 1.46 1.529 1.592 2.209.13.679-.037 1.375-.468 2.03-.88 1.34-2.793 2.388-4.844 2.388zm-.037 1.5A8 8 0 1 0 0 8.032c0 4.34 3.464 7.87 7.776 7.965m6.666-7.124c-.358-.788-.979-1.532-1.868-2.2-1.082-.813-1.51-1.9-1.967-3.06a31 31 0 0 0-.296-.736 6.3 6.3 0 0 0-.605-1.151 6.53 6.53 0 0 1 4.39 4.01 6.5 6.5 0 0 1 .346 3.137"/></svg>',
  };

  const STYLE = `
    /* Hide Spotify's native DJ button when it mounts/unmounts, so only our persistent button is shown */
    html .main-nowPlayingBar-extraControls span:has(button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"]))),
    html .main-nowPlayingBar-extraControls button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"])):not(#djx-button) {
      display: none !important;
    }
    /* Our persistent DJ button, positioned left of the lyrics button with native hover scale */
    #djx-button {
      background: transparent !important;
      border: 0 !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      border-radius: 50% !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      transition: transform 0.15s cubic-bezier(0.3, 0, 0, 1), color 0.15s cubic-bezier(0.3, 0, 0, 1) !important;
      vertical-align: middle !important;
    }
    #djx-button svg {
      color: inherit !important;
      transition: inherit !important;
    }
    #djx-button:hover {
      color: #ffffff !important;
      transform: scale(1.08) !important;
    }
    /* While the sheet is open the icon carries DJ's own accent green. */
    #djx-button.djx-active,
    #djx-button.djx-active:hover {
      color: var(--djx-accent, #19E68C) !important;
    }
    #djx-button:active {
      transform: scale(0.96) !important;
    }
    /* The like button Spotify drops from the player bar while a DJ set is playing. Same shape,
       spacing and hover behaviour as the controls around it. */
    #djx-like-button {
      background: transparent !important;
      border: 0 !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      margin-left: 0 !important;
      border-radius: 50% !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      transition: transform 0.15s cubic-bezier(0.3, 0, 0, 1), color 0.15s cubic-bezier(0.3, 0, 0, 1) !important;
      vertical-align: middle !important;
    }
    #djx-like-button svg {
      color: inherit !important;
      transition: inherit !important;
    }
    #djx-like-button:hover {
      color: #ffffff !important;
      transform: scale(1.08) !important;
    }
    #djx-like-button:active {
      transform: scale(0.96) !important;
    }
    /* Liked tracks get Spotify's own accent, the same green its stock button uses. */
    #djx-like-button.djx-liked,
    #djx-like-button.djx-liked:hover {
      color: var(--text-bright-accent, #1ed760) !important;
    }
    /* Popup panel with smooth slide-up entrance and fade */
    #djx-panel {
      position: fixed;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      container-type: inline-size;
      width: min(400px, calc(100vw - 32px));
      max-height: calc(100vh - 120px);
      box-sizing: border-box;
      --djx-background: #0a59b8;
      --djx-tray: #0b4692;
      --djx-accent: #19E68C;
      background: var(--djx-background);
      color: #fff;
      font-family: inherit;
      font-weight: 400;
      text-align: left;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.45);
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.22s cubic-bezier(0, 0, 0.2, 1), transform 0.22s cubic-bezier(0, 0, 0.2, 1);
      pointer-events: none;
    }
    #djx-panel.djx-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #djx-panel.djx-closing {
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
      transition: opacity 0.18s cubic-bezier(0.4, 0, 1, 1), transform 0.18s cubic-bezier(0.4, 0, 1, 1);
    }
    #djx-panel * { box-sizing: border-box; }
    #djx-panel button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; }
    /* Keyboard focus stays inside the rounded shapes instead of hanging off their edges. */
    #djx-panel button:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.92) !important;
      outline-offset: -3px !important;
    }
    /* The white round button needs its ring outside, on the dark tray, to be visible. */
    #djx-panel .djx-submit:focus-visible {
      outline-offset: 2px !important;
    }
    /* The borderless prompt field never draws a ring or a highlight of its own. */
    #djx-panel .djx-input:focus-visible {
      outline: none !important;
    }
    .djx-top {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 16px 14px;
      min-height: 0;
      /* No overflow here on purpose: any "auto" axis turns the other one auto too, and the
         card row's edge bleed would grow a horizontal scrollbar. */
    }
    /* One line in any language, and it also shrinks with a narrow popup instead of clipping. */
    .djx-hero {
      margin: 0;
      font-size: clamp(12.5px, 3.85cqw, 15px);
      line-height: 1.3;
      letter-spacing: -0.2px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .djx-cards {
      display: flex;
      gap: 12px;
      /* Bleeds to the popup's right edge, exactly like the phone cuts cards at the screen edge.
         No trailing pad: a padded row ends mid-card, which slices a card on the left. */
      width: calc(100% + 16px);
      /* Chrome's scroll anchoring jumps the row to its end when the skeletons are replaced,
         which slices the first card on the left. */
      overflow-anchor: none;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      scroll-behavior: smooth;
      /* Trailing air so the last card rests 16px off the panel edge instead of touching it.
         Card width is chosen so that the end of the scroll is also a card start: no left slice. */
      padding-right: 16px;
    }
    .djx-cards::-webkit-scrollbar {
      display: none;
    }
    /* Measured from the phone: 100x70 pick, 164x70 prompt cards, 12 gap, 8 radius at 360dp.
       Scaled to a 400px popup that is 111x78, 182x78, 12, 9. */
    #djx-panel .djx-pick,
    #djx-panel .djx-suggest,
    #djx-panel .djx-skeleton {
      height: 78px;
      border-radius: 9px;
    }
    /* "Let DJ pick" card in its rounded substrate/tray matching mobile app */
    #djx-panel .djx-pick {
      display: flex;
      flex: 0 0 111px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1) !important;
      border: 0 !important;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    /* Server-generated prompt ideas: outlined, not filled, exactly like the phone. */
    #djx-panel .djx-suggest {
      display: flex;
      flex: 0 0 178px;
      align-items: center;
      padding: 16px;
      background: transparent !important;
      border: 0 !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      color: #b6ceea;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      text-align: left;
      overflow: hidden;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    /* Placeholder cards for the moment before the backend answers: two shimmering bars. */
    #djx-panel .djx-skeleton {
      display: flex;
      flex: 0 0 178px;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    #djx-panel .djx-bar {
      display: block;
      height: 10px;
      border-radius: 5px;
      background-image: linear-gradient(100deg,
        rgba(255, 255, 255, 0.13) 30%, rgba(255, 255, 255, 0.32) 50%, rgba(255, 255, 255, 0.13) 70%);
      background-size: 220% 100%;
      animation: djx-shimmer 1.5s linear infinite;
    }
    #djx-panel .djx-bar-short {
      width: 62%;
    }
    @keyframes djx-shimmer {
      from { background-position: 150% 0; }
      to { background-position: -50% 0; }
    }
    .djx-pick > span {
      color: #ffffff;
      white-space: nowrap;
      letter-spacing: -0.2px;
    }
    /* Hover is a paint-only change: scaling a card inside the scroll row clips against the
       popup edges and looks broken at any window size. */
    #djx-panel .djx-pick:hover {
      background: rgba(255, 255, 255, 0.16) !important;
    }
    #djx-panel .djx-pick:active {
      background: rgba(255, 255, 255, 0.22) !important;
    }
    #djx-panel .djx-suggest:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.26);
    }
    #djx-panel .djx-suggest:active {
      background: rgba(255, 255, 255, 0.09) !important;
    }
    /* Bottom input substrate tray matching the mobile app */
    .djx-form {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--djx-tray);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .djx-input {
      flex: 1 1 auto;
      min-width: 0;
      height: 38px;
      padding: 0 4px;
      border: 0 !important;
      background: transparent;
      color: #fff;
      font: inherit;
      font-size: 14px;
      outline: none !important;
      box-shadow: none !important;
    }
    .djx-input::placeholder {
      color: rgba(255, 255, 255, 0.65);
    }
    .djx-submit {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      background: #ffffff !important;
      color: #000000 !important;
      cursor: pointer;
      transition: transform 0.12s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .djx-submit svg {
      color: #000000 !important;
      fill: #000000 !important;
    }
    .djx-submit:hover {
      transform: scale(1.06);
    }
    .djx-submit:active {
      transform: scale(0.96);
    }
    @media (prefers-reduced-motion: reduce) {
      #djx-panel, #djx-panel.djx-closing, #djx-button, .djx-pick, .djx-suggest, .djx-submit {
        transition: none !important;
        transform: none !important;
      }
      #djx-panel .djx-bar {
        animation: none !important;
      }
    }
  `;

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
