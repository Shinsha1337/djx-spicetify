// NAME: DJ X
// DESCRIPTION: Send text requests to the real Spotify DJ X from desktop.
// AUTHOR: Shinsha (Shinsha1337)
// VERSION: 1.0.1
// No API key, external AI service, or background server required.
(function djx() {
  "use strict";

  const VERSION = "1.0.1";
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
