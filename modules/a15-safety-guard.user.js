// ==UserScript==
// @name         Gremlin Logic A15 Safety Guard
// @namespace    local.imagetrend.a15native.safety
// @version      0.1.0
// @description  Editability gate, compatibility quarantine check, mutation budget, and fail-closed circuit breaker for A15 writes.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'safety-guard';
  const VERSION = '0.1.0';
  const DEFAULT_BUDGET = 3;
  let failures = 0;
  let suspended = false;
  let suspendReason = null;

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

  const unwrap = v => { try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); } catch { return undefined; } };

  function rootModel() {
    const root = document.querySelector('#form-composer') || document.querySelector('#center-pane');
    try { return window.ko?.contextFor?.(root)?.$data || null; } catch { return null; }
  }

  function state() {
    const d = rootModel();
    return {
      routeSupported: !!window.GremlinA15Runtime?.supportedRoute?.(),
      readOnly: !!unwrap(d?.currentIncidentReadOnlyStatus),
      saving: !!unwrap(d?.isSaving),
      posting: !!unwrap(d?.isPosting),
      offline: !!unwrap(d?.isNetworkOffline),
      suspended,
      suspendReason,
      failures,
      budget: Number(window.GremlinA15Runtime?.settings?.get?.('mutationFailureBudget', DEFAULT_BUDGET)) || DEFAULT_BUDGET,
      compatibilityAllowed: window.GremlinA15Compatibility?.mutationAllowed?.() !== false
    };
  }

  function canMutate() {
    const s = state();
    if (!s.routeSupported) return { ok: false, reason: 'unsupported-route', state: s };
    if (s.readOnly) return { ok: false, reason: 'incident-read-only', state: s };
    if (s.saving || s.posting) return { ok: false, reason: 'incident-busy', state: s };
    if (s.offline) return { ok: false, reason: 'network-offline', state: s };
    if (!s.compatibilityAllowed) return { ok: false, reason: 'compatibility-quarantine', state: s };
    if (s.suspended) return { ok: false, reason: 'circuit-breaker-open', state: s };
    return { ok: true, reason: null, state: s };
  }

  function recordFailure(scope, detail = {}) {
    failures += 1;
    const budget = state().budget;
    if (failures >= budget) {
      suspended = true;
      suspendReason = `Mutation failure budget exhausted in ${scope || 'unknown scope'}.`;
    }
    window.GremlinA15Runtime?.emit?.('safety-failure', { scope, failures, budget, suspended, detail });
    return state();
  }

  function recordSuccess(scope) {
    window.GremlinA15Runtime?.emit?.('safety-success', { scope, failures });
    return state();
  }

  function suspend(reason = 'manual') {
    suspended = true;
    suspendReason = String(reason);
    window.GremlinA15Runtime?.emit?.('safety-suspended', { reason: suspendReason });
    return state();
  }

  function reset({ confirm = true } = {}) {
    if (confirm && !window.confirm('Reset the A15 mutation circuit breaker for this page?\n\nOnly continue if the underlying mapping/problem has been reviewed.')) return { ok: false, reason: 'cancelled' };
    failures = 0;
    suspended = false;
    suspendReason = null;
    window.GremlinA15Runtime?.emit?.('safety-reset', {});
    return { ok: true, state: state() };
  }

  const api = Object.freeze({ version: VERSION, state, canMutate, recordFailure, recordSuccess, suspend, reset });
  Object.defineProperty(window, 'GremlinA15Safety', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Fail-closed mutation gate and circuit breaker.',
      defaultEnabled: true,
      start: async () => runtime.emit('safety-guard-ready', state()),
      stop: async () => {}
    });
    runtime.registerCapability('gremlin.safetyGuard', () => ({ available: true, ...state() }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
