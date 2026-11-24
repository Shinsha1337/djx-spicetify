const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const source = readFileSync(require.resolve("../djx.js"), "utf8");

function start() {
  const created = [];
  const listeners = [];
  const element = (tag) => ({
    tag, children: [], isConnected: false,
    append(child) { this.children.push(child); child.isConnected = true; },
    setAttribute() {}, addEventListener() {},
  });
  const document = {
    body: element("body"), head: element("head"),
    createElement(tag) { const node = element(tag); created.push(node); return node; },
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: (event) => listeners.push(event),
  };
  let mutation;
  const window = { Spicetify: {
    Platform: { PlayerAPI: { getState() {}, canSendSignal() {}, sendSignal() {} } },
    // React, Player, Topbar, and the right-hand panel are intentionally unavailable at startup.
  } };
  vm.runInNewContext(source, { window, document, console: { info() {} },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} },
    queueMicrotask: (fn) => fn(), setTimeout() { throw new Error("Startup waited for an unrelated API"); },
  });
  return { window, created, listeners, remount: () => mutation() };
}

test("startup touches no Spotify UI, waits for nothing, and only hooks the DJ button and the shortcut", () => {
  const app = start();
  assert.equal(app.window.DJX.version, "1.1.1");
  assert.deepEqual(app.created.map((node) => node.tag), ["style"], "only the stylesheet exists before the panel opens");
  assert.deepEqual(app.listeners, ["click", "keydown"], "must intercept the native player DJ button and the shortcut");
  assert.equal(typeof app.window.DJX.toggle, "function");
  assert.equal(typeof app.window.DJX.getStatus, "function");
});

test("partial subValues keeps sibling DJ setting and nativeButtonClasses strips active classes without lyrics-button", () => {
  const nodes = new Map();
  let subCallback = null;
  const makeNode = (tag) => ({
    tag,
    id: "",
    className: "",
    children: [],
    dataset: {},
    style: { setProperty() {} },
    classList: {
      _set: new Set(),
      add(...xs) { xs.forEach((x) => this._set.add(x)); },
      remove(...xs) { xs.forEach((x) => this._set.delete(x)); },
      toggle(x, f) { if (f === undefined) { this._set.has(x) ? this._set.delete(x) : this._set.add(x); } else if (f) this._set.add(x); else this._set.delete(x); },
      contains(x) { return this._set.has(x); },
    },
    setAttribute() {},
    addEventListener() {},
    prepend(child) { this.children.unshift(child); child.parentElement = this; if (child.id) nodes.set(child.id, child); },
    append(child) { this.children.push(child); child.parentElement = this; if (child.id) nodes.set(child.id, child); },
    querySelector(sel) {
      if (sel.includes("main-genericButton-button")) return siblingBtn;
      return null;
    },
  });
  const siblingBtn = makeNode("button");
  siblingBtn.className = "main-genericButton-button main-genericButton-buttonActive main-genericButton-buttonActiveDot e-101111-button-tertiary--icon-only-small";
  const bar = makeNode("div");
  bar.className = "main-nowPlayingBar-extraControls";
  bar.classList.add("main-nowPlayingBar-extraControls");

  const document = {
    body: makeNode("body"),
    head: makeNode("head"),
    createElement: (tag) => makeNode(tag),
    getElementById: (id) => nodes.get(id) || null,
    querySelector: (sel) => (sel === ".main-nowPlayingBar-extraControls" ? bar : null),
    addEventListener() {},
  };
  const window = {
    Spicetify: {
      Platform: {
        initialProductState: { "dj-language": "de-DE-z", "dj-voice-commentary": "default" },
        PlayerAPI: { getState: () => ({}), canSendSignal() {}, sendSignal() {} },
        ProductStateAPI: {
          getCachedValues: () => ({ "dj-language": "de-DE-z", "dj-voice-commentary": "default" }),
          subValues(cb) { subCallback = cb; return () => {}; },
        },
      },
    },
  };

  vm.runInNewContext(source, {
    window, document,
    console: { info() {} },
    MutationObserver: class { observe() {} },
    setTimeout() {},
  });

  const djBtn = nodes.get("djx-button");
  assert.ok(djBtn);
  assert.equal(djBtn.dataset.djxStyled, "1");
  assert.equal(djBtn.className.includes("main-genericButton-buttonActive"), false);
  assert.equal(djBtn.className.includes("main-genericButton-buttonActiveDot"), false);

  subCallback({ "dj-voice-commentary": "sometimes" });
  assert.deepEqual(
    { personaId: window.DJX.getStatus().personaId, commentary: window.DJX.getStatus().commentary },
    { personaId: "de-DE-z", commentary: "sometimes" },
  );
});
