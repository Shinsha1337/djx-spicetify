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
  assert.equal(app.window.DJX.version, "1.0.0");
  assert.deepEqual(app.created.map((node) => node.tag), ["style"], "only the stylesheet exists before the panel opens");
  assert.deepEqual(app.listeners, ["click", "keydown"], "must intercept the native player DJ button and the shortcut");
  assert.equal(typeof app.window.DJX.toggle, "function");
  assert.equal(typeof app.window.DJX.getStatus, "function");
});
