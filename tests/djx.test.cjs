const test = require("node:test");
const assert = require("node:assert/strict");
const { createClient, encodePromptSignal, normalizePrompt, isDJ, isDJButton, djPalette, encodeSuggestionRequest, decodeSuggestedPrompts, fetchSuggestedPrompts } = require("../djx.js");

test("the DJ palette comes from the context metadata and tolerates #AARRGGBB", () => {
  assert.deepEqual(djPalette({
    "narration.background.color": "#FF0A59B8",
    "narration.jump.icon.color": "#FF19E68C",
  }), { background: "#0a59b8", accent: "#19e68c" });
  assert.equal(djPalette({}).background, "#0a59b8");
  assert.equal(djPalette({ "narration.background.color": "garbage" }).background, "#0a59b8");
  assert.equal(djPalette({ "home.card.tag_color": "#FF0D72EA" }).accent, "#0d72ea");
});

function fakeButton({ testid = null, path = null } = {}) {
  return {
    matches: (selector) => !!testid && selector.includes(`data-testid="${testid}"`),
    // Emulate `svg path[d^="..."]`: only a button whose icon starts with the quoted prefix matches.
    querySelector: (selector) => (path && selector.includes(path.slice(0, 13)) ? { getAttribute: () => path } : null),
  };
}

test("the bottom DJ button is recognized by its test id or its icon geometry", () => {
  assert.equal(isDJButton(fakeButton({ testid: "dj-button" })), true);
  assert.equal(isDJButton(fakeButton({ testid: "dj-jump-button" })), true);
  assert.equal(isDJButton(fakeButton({ path: "M7.813 14.497A6.5 6.5 0 0 1 1.5 8.016" })), true);
  assert.equal(isDJButton(fakeButton({ path: "M2 2h12v12H2z" })), false);
  assert.equal(isDJButton(fakeButton({ testid: "control-button-queue" })), false);
  assert.equal(isDJButton(null), false);
});

const DJ_URI = "spotify:playlist:37i9dQZF1EYkqdzj48dyYq";
function playing(id) {
  return {
    sessionId: "native-session",
    context: { uri: DJ_URI, metadata: { lexicon_set_type: "your_dj" } },
    item: { uri: "spotify:track:native-track", metadata: id ? { idj_request_id: id } : {} },
    nextItems: [],
  };
}

// Independent wire reader: the mobile PromptSignalPayload has only fields 1 and 2.
function readFields(parameters) {
  const bytes = Buffer.from(parameters, "base64");
  let offset = 0;
  const integer = () => {
    let value = 0, multiplier = 1;
    do {
      const byte = bytes[offset++];
      value += (byte % 128) * multiplier;
      if (byte < 128) return value;
      multiplier *= 128;
    } while (offset < bytes.length);
    throw new Error("Truncated protobuf");
  };
  const fields = {};
  while (offset < bytes.length) {
    const tag = integer();
    if (tag % 8 === 0) fields[Math.floor(tag / 8)] = integer();
    else {
      assert.equal(tag % 8, 2);
      const length = integer();
      fields[Math.floor(tag / 8)] = bytes.subarray(offset, offset + length).toString("utf8");
      offset += length;
    }
  }
  return fields;
}

function fixture({ ready = true, nativeStart = true, onCommand } = {}) {
  const calls = [];
  let state = playing();
  let index = 0;
  const apply = () => { state = playing(`idj-request-${++index}`); ready = true; };
  const player = {
    getState: () => state,
    canSendSignal: (signal) => signal === "prompt" ? ready : true,
    sendSignal: async (signal, parameters) => {
      calls.push({ signal, parameters });
      if (onCommand) await onCommand({ signal, parameters, apply });
      else if (signal === "prompt") apply();
    },
    play: async (...args) => { calls.push({ publicPlay: args }); state = playing(); ready = true; },
  };
  if (nativeStart) player._playlistPlayServiceClient = {
    play: async (request) => {
      calls.push({ nativePlay: request });
      if (onCommand) await onCommand({ request, apply });
      else apply();
      return { status: { statusCode: 200 } };
    },
  };
  // Deliberately no ConnectAPI, PlaylistAPI, RequestBuilder, or external transport.
  const client = createClient({ Platform: { PlayerAPI: player } });
  return { client, calls, player, apply, setState: (s) => { state = s; } };
}

test("the phone's text prompt signal is base64 protobuf, with text input type 2", () => {
  // Android 9.1.84 PromptSignalPayload: 0a 05 'metal' 10 02.
  assert.equal(encodePromptSignal("metal"), "CgVtZXRhbBAC");
  assert.deepEqual(readFields(encodePromptSignal("new metals that im recently into")), {
    1: "new metals that im recently into", 2: 2,
  });
});

test("Unicode, multibyte lengths, and trimmed input survive the native wire format", () => {
  const prompt = "Café 🎷 ".repeat(50);
  assert.deepEqual(readFields(encodePromptSignal(prompt)), { 1: prompt.trim(), 2: 2 });
  assert.deepEqual(readFields(encodePromptSignal("  metal  ")), { 1: "metal", 2: 2 });
});

test("invalid prompts cannot issue playback commands", async () => {
  const { client, calls } = fixture();
  await assert.rejects(client.request("   "), { code: "empty_prompt" });
  await assert.rejects(client.request("a".repeat(501)), { code: "long_prompt" });
  assert.equal(calls.length, 0);
  assert.equal(normalizePrompt("  jazz  "), "jazz");
});

test("an active DJ receives the same native prompt command as the phone", async () => {
  const { client, calls, player } = fixture();
  const session = player.getState().sessionId;
  const result = await client.request("  metal  ");
  assert.deepEqual(calls, [{ signal: "prompt", parameters: "CgVtZXRhbBAC" }]);
  assert.deepEqual(result, { prompt: "metal", requestId: "idj-request-1" });
  assert.equal(player.getState().sessionId, session, "a prompt must not restart ordinary DJ");
});

test("DJ starts atomically with a prompt when music is queued or another context is active", async () => {
  const { client, calls, setState } = fixture({ ready: false });
  setState({ context: { uri: "spotify:playlist:other" }, item: { uri: "spotify:track:other" } });
  await client.request("metal");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].nativePlay, {
    context: { uri: DJ_URI, url: `context://${DJ_URI}`, isLoading: true },
    rawSignal: { identifier: "prompt", clientPayload: new TextEncoder().encode("CgVtZXRhbBAC") },
    playOrigin: { featureIdentifier: "endless", referrerIdentifier: "extension" },
  });
});

test("the public Player API remains usable if Spicetify moves its native play client", async () => {
  const { client, calls, player, setState } = fixture({ ready: false, nativeStart: false });
  setState({ context: { uri: "spotify:playlist:other" }, item: { uri: "spotify:track:other" } });
  player._playlistPlayServiceClient = { play: {} }; // A changed SDK surface is not callable.
  await client.request("metal");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].publicPlay[0].uri, DJ_URI);
  assert.deepEqual(calls[1], { signal: "prompt", parameters: "CgVtZXRhbBAC" });
});

test("a new interactive request in the native upcoming set counts before narration finishes", async () => {
  const data = fixture({ onCommand: () => {
    const state = playing("idj-old");
    state.item = { uri: "spotify:media:0000000000000000000000", metadata: { is_narration: "true" } };
    state.nextItems = [{ uri: "spotify:track:requested", metadata: { idj_request_id: "idj-new" } }];
    data.setState(state);
  } });
  data.setState(playing("idj-old"));
  assert.equal((await data.client.request("metal")).requestId, "idj-new");
});

test("native command acceptance or a random DJ/session change is not prompt success", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  let sent;
  const started = new Promise((resolve) => { sent = resolve; });
  const data = fixture({ onCommand: () => {
    data.setState({ ...playing("idj-old"), sessionId: "unrelated-session" });
    sent();
  } });
  data.setState(playing("idj-old"));
  const rejected = assert.rejects(data.client.request("metal"), { code: "not_applied" });
  await started;
  await new Promise(setImmediate);
  t.mock.timers.tick(30001);
  await rejected;
  assert.equal(data.calls.length, 1, "never automatically resend a playback-changing command");
});

test("an on-air DJ is never restarted, even after Spotify drops prompt from its signals", async () => {
  // ready:false makes canSendSignal("prompt") false, which used to route into a fresh DJ start
  // and made Spotify re-introduce the set on every request.
  const data = fixture({ ready: false, onCommand: ({ apply }) => apply() });
  data.player.canSendSignal = () => false;
  const result = await data.client.request("metal");
  assert.equal(result.requestId, "idj-request-1");
  assert.deepEqual(data.calls, [{ signal: "prompt", parameters: "CgVtZXRhbBAC" }]);
  assert.equal(data.calls.some((call) => call.nativePlay || call.publicPlay), false, "no restart");
});

test("native rejections do not fall back to the obsolete HTTP service", async () => {
  const { client, player, calls, setState } = fixture({ ready: false });
  setState({ context: { uri: "spotify:playlist:other" }, item: { uri: "spotify:track:other" } });
  player._playlistPlayServiceClient.play = async () => ({ status: { statusCode: 403 } });
  await assert.rejects(client.request("metal"), { code: "rejected" });
  assert.equal(calls.length, 0);
});

test("pending prompts are serialized so Spotify cannot mix their generated sets", async () => {
  let release, started;
  const waiting = new Promise((resolve) => { release = resolve; });
  const sent = new Promise((resolve) => { started = resolve; });
  let count = 0;
  const data = fixture({ onCommand: async ({ apply }) => {
    if (++count === 1) { started(); await waiting; }
    apply();
  } });
  const first = data.client.request("metal");
  await sent;
  const second = data.client.request("jazz");
  await Promise.resolve();
  assert.equal(data.calls.length, 1);
  release();
  assert.equal((await first).requestId, "idj-request-1");
  assert.equal((await second).requestId, "idj-request-2");
  assert.deepEqual(data.calls.map((call) => readFields(call.parameters)[1]), ["metal", "jazz"]);
});

test("Let DJ pick cancels pending prompt work and sends the phone's prompt signal with no text", async () => {
  const { client, calls } = fixture();
  const pending = assert.rejects(client.request("metal"), { code: "cancelled" });
  await client.letDJPick();
  await pending;
  assert.deepEqual(calls, [{ signal: "prompt", parameters: "EAI=" }]);
  // The payload is PromptSignalPayload{ input_type = 2 } and nothing else.
  assert.equal(Buffer.from("EAI=", "base64").toString("hex"), "1002");
});

test("native interactive contexts remain recognizable as Spotify DJ", () => {
  assert.equal(isDJ({ context: { uri: DJ_URI, metadata: { agentic_product_type: "idj" } } }), true);
  assert.equal(isDJ({ context: { uri: "spotify:lexicon:your-dj" } }), true);
  assert.equal(isDJ({ context: { uri: "spotify:playlist:other" } }), false);
});

test("prompt ideas use the phone's DJ backend wire format", () => {
  // Request: field 1 is the playing track, field 2 is the model selector Android leaves at 0.
  assert.deepEqual(
    Buffer.from(encodeSuggestionRequest("spotify:track:abc")).toString("hex"),
    "0a1173706f746966793a747261636b3a6162631000",
  );
  // Response: one repeated string field, read as tag 10 + varint length + UTF-8.
  const response = Buffer.from("0a134561726c79206d6f726e696e6720696e646965", "hex");
  assert.deepEqual(decodeSuggestedPrompts(new Uint8Array(response)), ["Early morning indie"]);
  assert.deepEqual(decodeSuggestedPrompts(new Uint8Array([0x0a, 0x40])), [], "a truncated field is dropped");
  assert.deepEqual(decodeSuggestedPrompts(new Uint8Array([])), []);
});

test("suggestions follow the playing track and fail silently", async () => {
  const spicetify = {
    Platform: {
      PlayerAPI: { getState: () => ({ item: { uri: "spotify:track:abc" } }) },
      AuthorizationAPI: { getState: () => ({ token: { accessToken: "token" } }) },
    },
  };
  const requests = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: false };
  };
  try {
    assert.deepEqual(await fetchSuggestedPrompts(spicetify), [], "a refused request leaves the pick card alone");
    assert.match(requests[0].url, /DJInteractionManagerService\/GetSuggestedPrompts$/);
    assert.equal(requests[0].options.headers.Authorization, "Bearer token");
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from("0a044a617a7a", "hex") });
    assert.deepEqual(await fetchSuggestedPrompts(spicetify), ["Jazz"]);
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from("0a044a617a7a0a044a617a7a0a044a617a7a0a044a617a7a", "hex") });
    assert.equal((await fetchSuggestedPrompts(spicetify)).length, 3, "the row stays a single row");
  } finally {
    globalThis.fetch = original;
  }
});
