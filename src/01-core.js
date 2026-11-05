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
