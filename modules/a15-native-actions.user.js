// ==UserScript==
// @name         Gremlin Logic A15 Native Actions
// @namespace    local.imagetrend.a15native.actions
// @version      0.1.0
// @description  Native-first ImageTrend action discovery/registry. Unknown signatures remain read-only until explicitly validated.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'native-actions';
  const VERSION = '0.1.0';
  const KNOWN_NAMES = [
    'navigateToSpecifiedPanel',
    'clickSpecifiedControl',
    'clickElement',
    'openGrid',
    'closeInputTools',
    'openAIAssistModal'
  ];
  const validatedAdapters = new Map();

  function waitForRuntime(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.GremlinA15Runtime) return resolve(window.GremlinA15Runtime);
        if (Date.now() - started > timeoutMs) return reject(new Error('A15 runtime core not found.'));
        setTimeout(tick, 250);
      };
      tick();
    });
  }

  function contexts() {
    const starts = [document.querySelector('#form-composer'), document.querySelector('#center-pane'), document.body].filter(Boolean);
    const out = [];
    const seen = new Set();
    for (const start of starts) {
      let el = start;
      for (let i = 0; el && i < 10; i++, el = el.parentElement) {
        try {
          const ctx = window.ko?.contextFor?.(el);
          for (const candidate of [ctx?.$data, ctx?.$parent, ctx?.$root]) {
            if (candidate && typeof candidate === 'object' && !seen.has(candidate)) {
              seen.add(candidate);
              out.push(candidate);
            }
          }
        } catch {}
      }
    }
    return out;
  }

  function resolveNative(name) {
    for (const obj of contexts()) {
      if (typeof obj?.[name] === 'function') return { owner: obj, fn: obj[name] };
    }
    return null;
  }

  function capabilityMap() {
    const native = {};
    for (const name of KNOWN_NAMES) native[name] = !!resolveNative(name);
    const adapters = Object.fromEntries([...validatedAdapters.entries()].map(([name, a]) => [name, { description: a.description, validated: true }]));
    return { native, adapters };
  }

  function registerValidatedAdapter(name, definition) {
    if (!name || !definition || typeof definition.invoke !== 'function') throw new Error('Validated adapter requires name and invoke().');
    validatedAdapters.set(String(name), {
      description: String(definition.description || ''),
      validate: typeof definition.validate === 'function' ? definition.validate : () => true,
      invoke: definition.invoke
    });
    return true;
  }

  async function invoke(name, args = {}, { confirm = false } = {}) {
    const adapter = validatedAdapters.get(String(name));
    if (!adapter) return { ok: false, reason: 'native-action-signature-not-validated', action: String(name) };
    const safety = window.GremlinA15Safety?.canMutate?.();
    if (safety && !safety.ok) return { ok: false, reason: safety.reason, blockedBySafety: true };
    let valid = false;
    try { valid = await adapter.validate(args); } catch { valid = false; }
    if (!valid) return { ok: false, reason: 'adapter-validation-failed', action: String(name) };
    if (confirm && !window.confirm(`Run ImageTrend native action “${name}”?`)) return { ok: false, reason: 'cancelled' };
    try {
      const result = await adapter.invoke(args);
      window.GremlinA15Runtime?.emit?.('native-action', { action: String(name), ok: true });
      return { ok: true, result };
    } catch (error) {
      window.GremlinA15Safety?.recordFailure?.(`native-action:${name}`, { message: String(error?.message || error) });
      return { ok: false, reason: 'native-action-threw', message: String(error?.message || error) };
    }
  }

  const api = Object.freeze({
    version: VERSION,
    capabilityMap,
    resolve: name => !!resolveNative(String(name)),
    registerValidatedAdapter,
    invoke,
    knownActions: () => [...KNOWN_NAMES]
  });

  Object.defineProperty(window, 'GremlinA15NativeActions', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Native ImageTrend action discovery. Unknown function signatures are never guessed or invoked.',
      defaultEnabled: true,
      start: async () => runtime.emit('native-actions-ready', capabilityMap()),
      stop: async () => {}
    });
    runtime.registerCapability('gremlin.nativeActions', () => ({ available: true, ...capabilityMap() }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
