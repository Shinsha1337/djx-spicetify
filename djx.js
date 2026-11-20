// NAME: DJ X
// DESCRIPTION: Send text requests to the real Spotify DJ X from desktop.
// AUTHOR: Shinsha (Shinsha1337)
// VERSION: 1.1.0
// No API key, external AI service, or background server required.
(function djx() {
  "use strict";

  const VERSION = "1.1.0";
  const DJ_URI = "spotify:playlist:37i9dQZF1EYkqdzj48dyYq";
  const DJ_IDS = new Set([
    "37i9dQZF1EYkqdzj48dyYq", "37i9dQZF1EYkqdzj8OSOas", "37i9dQZF1EYkqdzjdvy3mw",
    "37i9dQZF1EYkqdzjicdiyA", "37i9dQZF1EYkqdzjmSSxKE", "37i9dQZF1EYkqdzjrzxMWI",
    "37i9dQZF1EYkqdzjwgd28M", "37i9dQZF1EYkqdzjAWShkQ", "37i9dQZF1EYkqdzjFDxwwU",
    "37i9dQZF1EYkqdzjKkcLIY", "37i9dQZF1EYkqdzjP0S0V2", "37i9dQZF1EYkqdzjTHxg76",
  ]);
  const MAX_PROMPT = 500;
  // Spotify Android reads its prompt ideas from this DJ backend method; the desktop build
  // exposes the same service, so the cards can be server-generated rather than hardcoded.
  const SUGGESTION_URL = "https://spclient.wg.spotify.com/dj-interaction-manager"
    + "/spotify.dj.interactionmanager.v0.DJInteractionManagerService/GetSuggestedPrompts";
  const MAX_SUGGESTIONS = 3;

  const DEFAULT_PERSONA_ID = "en-US-x";
  const DEFAULT_COMMENTARY_MODE = "default";
  const PRODUCT_STATE_DJ_LANGUAGE = "dj-language";
  const PRODUCT_STATE_DJ_COMMENTARY = "dj-voice-commentary";

  // Official Spotify DJ catalog (lexicon-formatlist-provider/v2/dj/available-personas).
  const DJ_LANGUAGES = [
    {
      languageTag: "en",
      displayName: "English",
      personas: [
        {
          personaName: "DJ X (US)",
          personaId: "en-US-x",
          descriptor: "Hype, welcoming, all charisma.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-x/f3182c2af8ef3d13fb55d78e75b13b85df94de528889d44f8a58648a94fee047.mp3",
          interactivityTitle: "Your DJ X here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Nisha (IND)",
          personaId: "en-US-1",
          descriptor: "Inviting and eager, infectious energy.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-1/7d6bdfbaa33d4a8addc8e87c94985e07a93456509576eaed914cfe1d718a3fc3.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Nell (UK)",
          personaId: "en-GB-2",
          descriptor: "Mellow, slower, deeply knowledgeable.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-GB-2/aba0033e6b5a8ed74eab4934a08c04a5e91dccf03f5a136292c3467700fc2804.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-GB",
        },
        {
          personaName: "Lane (US)",
          personaId: "en-US-3",
          descriptor: "Big-hearted energy, bright and spirited.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-3/8e6395b17ebe70fff64c4b5a0a3347e08f317132ceeeb0fa8d8cb8c159302f22.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Tess (US)",
          personaId: "en-US-4",
          descriptor: "Direct but inviting, in-the-know.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-4/5104f0af0c79df116ef47e81d696fcd40d9d0bad7ad687f5ed412888ffee10ea.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Casey (US)",
          personaId: "en-US-5",
          descriptor: "Laidback presence, warm and earnest.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-5/04c7af83dbd2137e006bb6a096cbf4314c59aba6071ea76c4d5f4782c10d70de.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Sam (AUS)",
          personaId: "en-US-6",
          descriptor: "Fun, keeps things not-so-serious.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-US-6/7377876ac0fcc07af9bb99a19be8452de87ecb4411d7c5af6e18c8ad038068b5.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-US",
        },
        {
          personaName: "Declan (IRE)",
          personaId: "en-GB-7",
          descriptor: "Straightforward, passionate, bit of a music nerd.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/en-GB-7/9f3178b0d3fcab5275c20231b257dd2143fdaf339500a075985912d2984fc0d3.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "en-GB",
        },
      ],
    },
    {
      languageTag: "es",
      displayName: "Spanish",
      personas: [
        {
          personaName: "Fabi (MX)",
          personaId: "es-MX-1",
          descriptor: "Witty, friendly, always a step ahead.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/es-MX-1/991712e0059c12bd58e1abd9001f34df68166887f31efc4a7a280ccebc11f20f.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "es-MX",
        },
        {
          personaName: "Nico (MX)",
          personaId: "es-MX-2",
          descriptor: "Down to earth, present, right there with you.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/es-MX-2/0c765c160c515bfa4560f34d04a20c612a5caeb8a8e32ee2f2cc53b01fd2a004.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "es-MX",
        },
      ],
    },
    {
      languageTag: "de",
      displayName: "German",
      personas: [
        {
          personaName: "Ben",
          personaId: "de-DE-z",
          descriptor: "Effortlessly cool, tells it like it is.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/de-DE-z/24cbe5174efffd9b348320ed26e945f03676d4da6c965d91304eb33c39f28eb5.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "de-DE",
        },
      ],
    },
    {
      languageTag: "fr",
      displayName: "French",
      personas: [
        {
          personaName: "Maia",
          personaId: "fr-FR-a",
          descriptor: "Understated and savvy, picks up on everything.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/fr-FR-a/52f3d68a8ec40f67c5c660a2df6905758e7534be4793ba857741d6ff75e568d0.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "fr-FR",
        },
      ],
    },
    {
      languageTag: "pt",
      displayName: "Portuguese",
      personas: [
        {
          personaName: "Dani (BR)",
          personaId: "pt-BR-b",
          descriptor: "Attuned, relatable, never misses a beat.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/pt-BR-b/f7bd1ada1e8ea290f0d5889fc143eb26c88f29a3874c955743ff77b86032c5fb.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "pt-BR",
        },
      ],
    },
    {
      languageTag: "it",
      displayName: "Italian",
      personas: [
        {
          personaName: "Alex",
          personaId: "it-IT-c",
          descriptor: "Eclectic, experienced, easy to trust.",
          previewUrl: "https://lexicon-assets.spotifycdn.com/dj-persona-previews/it-IT-c/fdb337d2bccf01fb504876c0af30f3e6506b1583e5b25e389366840776d735a7.mp3",
          interactivityTitle: "Your DJ here. What can I play for you?",
          localeTag: "it-IT",
        },
      ],
    },
  ];

  const COMMENTARY_OPTIONS = [
    {
      id: "default",
      title: "Introduce each set",
      subtitle: "DJ introduces songs, shares context and tees up music when the vibe shifts.",
    },
    {
      id: "sometimes",
      title: "Don’t break the flow",
      subtitle: "DJ only talks when you tap the DJ button to change the vibe.",
    },
  ];

  class DJError extends Error {
    constructor(message, code = "request_failed") {
      super(message);
      this.name = "DJError";
      this.code = code;
    }
  }

  function findPersona(personaId) {
    for (const group of DJ_LANGUAGES) {
      const match = group.personas.find((p) => p.personaId === personaId);
      if (match) return { ...match, languageDisplayName: group.displayName };
    }
    const fallbackGroup = DJ_LANGUAGES[0];
    return { ...fallbackGroup.personas[0], languageDisplayName: fallbackGroup.displayName };
  }

  function normalizeDJSettings(values = {}) {
    const rawLang = values?.[PRODUCT_STATE_DJ_LANGUAGE];
    const personaId = rawLang && rawLang !== "not-set" ? findPersona(rawLang).personaId : DEFAULT_PERSONA_ID;
    const commentary = values?.[PRODUCT_STATE_DJ_COMMENTARY] === "sometimes" ? "sometimes" : DEFAULT_COMMENTARY_MODE;
    return { personaId, commentary };
  }

  async function readDJSettings(spicetify) {
    const ps = spicetify?.Platform?.ProductStateAPI;
    if (!ps) return normalizeDJSettings();
    try {
      const values = (await ps.getValues?.()) || ps.getCachedValues?.() || {};
      return normalizeDJSettings(values);
    } catch {
      return normalizeDJSettings(ps.getCachedValues?.() || {});
    }
  }

  async function writeDJSetting(spicetify, key, value) {
    const ps = spicetify?.Platform?.ProductStateAPI;
    if (typeof ps?.setValues !== "function") {
      throw new DJError("Something went wrong.", "settings_unavailable");
    }
    try {
      await ps.setValues({ [key]: String(value) });
    } catch {
      throw new DJError("Something went wrong.", "settings_write_failed");
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

    async function restart() {
      epoch++;
      try {
        await player.play({ uri: DJ_URI }, origin, {});
      } catch (error) {
        throw readableError(error);
      }
    }

    return { request, letDJPick, restart };
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
    module.exports = {
      createClient, encodePromptSignal, normalizePrompt, isDJ, DJError, isDJButton, djPalette,
      PICK_PAYLOAD, encodeSuggestionRequest, decodeSuggestedPrompts, fetchSuggestedPrompts,
      DJ_LANGUAGES, COMMENTARY_OPTIONS, DEFAULT_PERSONA_ID, DEFAULT_COMMENTARY_MODE,
      PRODUCT_STATE_DJ_LANGUAGE, PRODUCT_STATE_DJ_COMMENTARY,
      findPersona, normalizeDJSettings, readDJSettings, writeDJSetting,
    };
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
    voice: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2.75 2.75 0 0 0-2.75 2.75v4a2.75 2.75 0 0 0 5.5 0v-4A2.75 2.75 0 0 0 8 1M6.75 3.75a1.25 1.25 0 1 1 2.5 0v4a1.25 1.25 0 1 1-2.5 0z"/><path d="M3.5 7.75a.75.75 0 0 0-1.5 0A6 6 0 0 0 7.25 13.7v.8H5.5a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5H8.75v-.8A6 6 0 0 0 14 7.75a.75.75 0 0 0-1.5 0 4.5 4.5 0 0 1-9 0"/></svg>',
    commentary: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 2.5A1.5 1.5 0 0 0 1 4v6.5A1.5 1.5 0 0 0 2.5 12h1.75v2.25a.75.75 0 0 0 1.22.584L9.013 12H13.5a1.5 1.5 0 0 0 1.5-1.5V4a1.5 1.5 0 0 0-1.5-1.5zm0 1.5h11v6.5H8.5l-2.75 2.138V10.5H2.5z"/></svg>',
    play: '<svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288z"/></svg>',
    stop: '<svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>',
    check: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M15.53 2.47a.75.75 0 0 1 0 1.06L4.907 14.153.47 9.716a.75.75 0 0 1 1.06-1.06l3.377 3.376L14.47 2.47a.75.75 0 0 1 1.06 0"/></svg>',
    close: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M2.47 2.47a.75.75 0 0 1 1.06 0L8 6.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L9.06 8l4.47 4.47a.75.75 0 1 1-1.06 1.06L8 9.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L6.94 8 2.47 3.53a.75.75 0 0 1 0-1.06"/></svg>',
  };

  const STYLE = `
    /* Hide Spotify's native DJ button when it mounts/unmounts, so only our persistent button is shown */
    html .main-nowPlayingBar-extraControls span:has(button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"]))),
    html .main-nowPlayingBar-extraControls button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"])):not(#djx-button) {
      display: none !important;
    }
    /* Persistent DJ button inherits Spotify's native extraControls / Spicy Lyrics hover behaviour */
    #djx-button {
      flex-shrink: 0;
      padding: 0;
      width: 32px;
      height: 32px;
      min-width: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 0;
      color: var(--text-subdued, rgba(var(--spice-rgb-text, 255, 255, 255), 0.7));
      cursor: pointer;
    }
    #djx-button .Wrapper-sm-only {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    #djx-button svg {
      color: inherit;
      fill: currentColor;
      pointer-events: none;
    }
    #djx-button:hover,
    #djx-button:focus-visible {
      color: var(--text-base, var(--spice-text, #ffffff));
    }
    /* While a DJ set is playing the icon carries DJ's own accent green. */
    #djx-button.djx-active,
    #djx-button.djx-active:hover {
      color: var(--djx-accent, #19E68C);
    }
    @keyframes djx-btn-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    #djx-button.djx-pending svg {
      animation: djx-btn-pulse 1.1s ease-in-out infinite;
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
    /* Native Spotify-styled right-click menu on the DJ button */
    #djx-context-menu {
      position: fixed;
      z-index: 2100;
      min-width: 248px;
      max-width: 300px;
      padding: 4px;
      border-radius: 4px;
      background: var(--background-elevated-base, #282828);
      color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 16px 24px rgba(0, 0, 0, 0.3), 0 6px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.06);
      font-family: inherit;
    }
    #djx-context-menu ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .djx-ctx-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: hsla(0, 0%, 100%, 0.9);
      font: inherit;
      font-size: 14px;
      line-height: 20px;
      text-align: left;
      cursor: pointer;
    }
    .djx-ctx-item:hover,
    .djx-ctx-item:focus-visible {
      background: hsla(0, 0%, 100%, 0.1);
      color: #ffffff;
      outline: none;
    }
    .djx-ctx-item svg {
      flex: 0 0 auto;
      color: rgba(255, 255, 255, 0.7);
    }
    .djx-ctx-item:hover svg,
    .djx-ctx-item:focus-visible svg {
      color: #ffffff;
    }
    .djx-ctx-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1 1 auto;
    }
    .djx-ctx-label {
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .djx-ctx-sub {
      font-size: 12px;
      line-height: 16px;
      color: var(--text-subdued, #a7a7a7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Modal dialog for Pick your DJ, DJ commentary, and Restart confirmation */
    #djx-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0);
      transition: background-color 0.16s ease;
    }
    #djx-modal-backdrop.djx-visible {
      background: rgba(0, 0, 0, 0.72);
    }
    #djx-modal {
      position: relative;
      display: flex;
      flex-direction: column;
      width: min(460px, calc(100vw - 32px));
      max-height: min(640px, calc(100vh - 48px));
      border-radius: 8px;
      background: var(--background-elevated-base, #282828);
      color: #ffffff;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
      font-family: inherit;
      opacity: 0;
      transform: translateY(8px) scale(0.985);
      transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.12s ease;
    }
    #djx-modal-backdrop.djx-visible #djx-modal {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .djx-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px 12px;
      flex: 0 0 auto;
    }
    .djx-modal-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      line-height: 26px;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .djx-modal-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
    }
    .djx-modal-close:hover,
    .djx-modal-close:focus-visible {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      outline: none;
    }
    .djx-modal-subtitle {
      margin: 0;
      padding: 0 24px 14px;
      font-size: 13px;
      line-height: 18px;
      color: var(--text-subdued, #b3b3b3);
      flex: 0 0 auto;
    }
    .djx-modal-body {
      overflow-y: auto;
      padding: 0 12px 20px;
      flex: 1 1 auto;
    }
    .djx-modal-body::-webkit-scrollbar {
      width: 8px;
    }
    .djx-modal-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 99px;
    }
    .djx-lang-heading {
      margin: 14px 12px 6px;
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      color: #ffffff;
    }
    .djx-lang-group:first-child .djx-lang-heading {
      margin-top: 4px;
    }
    .djx-option-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .djx-option-row:hover,
    .djx-option-row:focus-visible {
      background: rgba(255, 255, 255, 0.08);
      outline: none;
    }
    .djx-preview-btn {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #ffffff;
      color: #000000;
      cursor: pointer;
      transition: transform 0.1s ease, background 0.12s ease;
    }
    .djx-preview-btn:hover {
      transform: scale(1.06);
    }
    .djx-preview-btn:active {
      transform: scale(0.96);
    }
    .djx-preview-btn.djx-playing {
      background: #1ed760;
      color: #000000;
    }
    .djx-option-select {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .djx-option-select:focus-visible {
      outline: none;
    }
    .djx-option-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .djx-option-title {
      font-size: 15px;
      font-weight: 500;
      line-height: 20px;
      color: #ffffff;
    }
    .djx-option-desc {
      font-size: 13px;
      line-height: 18px;
      color: var(--text-subdued, #b3b3b3);
    }
    .djx-option-check {
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #1ed760;
      opacity: 0;
    }
    .djx-option-row.djx-selected .djx-option-check {
      opacity: 1;
    }
    #djx-modal.djx-confirm-modal {
      width: min(380px, calc(100vw - 32px));
    }
    .djx-confirm-copy {
      margin: 0;
      padding: 0 24px 20px;
      font-size: 14px;
      line-height: 20px;
      color: var(--text-subdued, #b3b3b3);
    }
    .djx-confirm-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 24px 20px;
    }
    .djx-btn-secondary {
      height: 36px;
      padding: 0 18px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #ffffff;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .djx-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .djx-btn-primary {
      height: 36px;
      padding: 0 22px;
      border: 0;
      border-radius: 999px;
      background: #ffffff;
      color: #000000;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .djx-btn-primary:hover {
      transform: scale(1.03);
      background: #f0f0f0;
    }
    @media (prefers-reduced-motion: reduce) {
      #djx-panel, #djx-panel.djx-closing, #djx-button, #djx-button.djx-pending svg,
      #djx-modal-backdrop, #djx-modal, .djx-pick, .djx-suggest, .djx-submit,
      .djx-preview-btn, .djx-btn-primary {
        transition: none !important;
        transform: none !important;
        animation: none !important;
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
    const suggestionCache = new Map();
    const cachedSettings = normalizeDJSettings(sp.Platform.ProductStateAPI?.getCachedValues?.());
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
    // track that is playing right now, and cached briefly in memory per track.
    function loadSuggestions() {
      const current = view;
      if (!current || current.closing) return;
      const track = sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "";
      current.trackUri = track;
      clearDynamicCards(current.cards);

      if (track && suggestionCache.has(track)) {
        renderSuggestions(current.cards, suggestionCache.get(track));
        return;
      }

      const skeletons = skeletonCards();
      current.cards.append(...skeletons);
      fetchSuggestedPrompts(sp).then((prompts) => {
        if (!view || view !== current || current.closing) {
          for (const card of skeletons) card.remove();
          return;
        }
        if ((sp.Platform.PlayerAPI.getState?.()?.item?.uri ?? "") !== track) {
          for (const card of skeletons) card.remove();
          return;
        }
        if (track && prompts.length) {
          if (suggestionCache.size >= 12) suggestionCache.delete(suggestionCache.keys().next().value);
          suggestionCache.set(track, prompts);
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
      if (track && track !== view.trackUri) loadSuggestions();
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
      view = {
        root,
        hero: root.querySelector(".djx-hero"),
        cards: root.querySelector(".djx-cards"),
        pick: root.querySelector(".djx-pick"),
        form: root.querySelector(".djx-form"),
        input: root.querySelector(".djx-input"),
        dismiss: new AbortController(),
        closing: false,
        trackUri: "",
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
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); }, { capture: true, signal });
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
