// ==UserScript==
// @name         Gremlin Logic A15 Compatibility Guard
// @namespace    local.imagetrend.a15native.compatibility
// @version      0.1.0
// @description  PHI-free structural drift classification, quarantine state, and last-known-good compatibility snapshots for A15.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'compatibility-guard';
  const VERSION = '0.1.0';
  const STORAGE_KEY = 'gremlin.a15.compatibility.v1';
  const safeParse = (s, f) => { try { return JSON.parse(s); } catch { return f; } };
  const clone = v => { try { return structuredClone(v); } catch { return safeParse(JSON.stringify(v), v); } };

  function waitForDeps(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.GremlinA15Runtime && window.GremlinA15Reconstruction) return resolve({ runtime: window.GremlinA15Runtime, recon: window.GremlinA15Reconstruction });
        if (Date.now() - started > timeoutMs) return reject(new Error('A15 compatibility dependencies not found.'));
        setTimeout(tick, 250);
      };
      tick();
    });
  }

  function keyOfField(f) {
    return String(f?.entryId || f?.bindingPath || f?.controlId || '').trim();
  }

  function keyOfAction(a) {
    return `${a?.text || ''}|${a?.dataBind || ''}`.trim();
  }

  function setDiff(oldItems = [], newItems = [], keyFn) {
    const oldMap = new Map(oldItems.map(x => [keyFn(x), x]).filter(([k]) => k));
    const newMap = new Map(newItems.map(x => [keyFn(x), x]).filter(([k]) => k));
    const added = [], removed = [], changed = [];
    for (const [k, v] of newMap) {
      if (!oldMap.has(k)) added.push(v);
      else if (JSON.stringify(oldMap.get(k)) !== JSON.stringify(v)) changed.push({ before: oldMap.get(k), after: v });
    }
    for (const [k, v] of oldMap) if (!newMap.has(k)) removed.push(v);
    return { added, removed, changed };
  }

  function loadStore() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    return raw && typeof raw === 'object' ? raw : { schemaVersion: 1, routes: {} };
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  }

  function classify(route, current) {
    const store = loadStore();
    const state = store.routes[route];
    if (!state?.trusted) {
      return {
        state: 'DISCOVERED',
        route,
        reason: 'No trusted structural baseline exists yet.',
        current,
        diff: { fields: { added: current.fields || [], removed: [], changed: [] }, actions: { added: current.actions || [], removed: [], changed: [] } }
      };
    }

    const fieldDiff = setDiff(state.trusted.fields || [], current.fields || [], keyOfField);
    const actionDiff = setDiff(state.trusted.actions || [], current.actions || [], keyOfAction);
    const removedCritical = fieldDiff.removed.length + actionDiff.removed.length;
    const changed = fieldDiff.changed.length + actionDiff.changed.length;
    const additions = fieldDiff.added.length + actionDiff.added.length;

    let status = 'PASS';
    let reason = 'Current structural map matches the trusted baseline.';
    if (removedCritical > 0 || changed > 8) {
      status = 'BLOCKED';
      reason = 'Trusted controls/actions disappeared or changed materially. Mutation features should remain quarantined until reviewed.';
    } else if (changed > 0 || additions > 0) {
      status = 'REVIEW';
      reason = 'Structural drift detected. New/changed controls require review before promotion to trusted state.';
    }

    return { state: status, route, reason, current, trusted: clone(state.trusted), diff: { fields: fieldDiff, actions: actionDiff } };
  }

  function inspect() {
    const current = window.GremlinA15Reconstruction?.scan?.('compatibility-check');
    if (!current || current.disabled) return { state: 'BLOCKED', route: location.pathname, reason: 'Reconstruction unavailable or disabled.' };
    const result = classify(location.pathname, current);
    const store = loadStore();
    store.routes[location.pathname] ||= {};
    store.routes[location.pathname].lastCheck = {
      state: result.state,
      checkedAt: new Date().toISOString(),
      fingerprint: current.fingerprint,
      counts: { fields: current.fields?.length || 0, actions: current.actions?.length || 0 }
    };
    saveStore(store);
    window.GremlinA15Runtime?.emit?.('compatibility-state', { route: result.route, state: result.state, reason: result.reason });
    return clone(result);
  }

  function trustCurrent({ confirm = true } = {}) {
    const current = window.GremlinA15Reconstruction?.scan?.('trust-candidate');
    if (!current || current.disabled) return { ok: false, reason: 'reconstruction-unavailable' };
    if (confirm && !window.confirm('Promote the current PHI-free structural map to trusted compatibility baseline?\n\nDo this only after the current ImageTrend form has been manually checked.')) return { ok: false, reason: 'cancelled' };
    const store = loadStore();
    const routeState = store.routes[location.pathname] ||= {};
    if (routeState.trusted) routeState.lastKnownGood = routeState.trusted;
    routeState.trusted = {
      fingerprint: current.fingerprint,
      trustedAt: new Date().toISOString(),
      fields: current.fields || [],
      actions: current.actions || []
    };
    routeState.lastCheck = { state: 'PASS', checkedAt: new Date().toISOString(), fingerprint: current.fingerprint };
    saveStore(store);
    window.GremlinA15Runtime?.emit?.('compatibility-trusted', { route: location.pathname, fingerprint: current.fingerprint });
    return { ok: true, fingerprint: current.fingerprint };
  }

  function rollbackTrusted({ confirm = true } = {}) {
    const store = loadStore();
    const state = store.routes[location.pathname];
    if (!state?.lastKnownGood) return { ok: false, reason: 'no-last-known-good' };
    if (confirm && !window.confirm('Restore the previous trusted structural baseline for this route?')) return { ok: false, reason: 'cancelled' };
    const current = state.trusted;
    state.trusted = state.lastKnownGood;
    state.lastKnownGood = current;
    saveStore(store);
    return { ok: true, fingerprint: state.trusted?.fingerprint || null };
  }

  function mutationAllowed() {
    const store = loadStore();
    const state = store.routes[location.pathname]?.lastCheck?.state;
    return !state || state === 'PASS' || state === 'REVIEW';
  }

  const api = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    inspect,
    trustCurrent,
    rollbackTrusted,
    mutationAllowed,
    state() { return clone(loadStore().routes?.[location.pathname] || null); },
    allState() { return clone(loadStore()); }
  });

  Object.defineProperty(window, 'GremlinA15Compatibility', { value: api, enumerable: false, configurable: false, writable: false });

  waitForDeps().then(({ runtime }) => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Structural drift classification and compatibility quarantine with last-known-good baseline.',
      defaultEnabled: true,
      start: async () => setTimeout(() => inspect(), 3200),
      stop: async () => {}
    });
    runtime.registerCapability('gremlin.compatibilityGuard', () => {
      const s = loadStore().routes?.[location.pathname];
      return { available: true, state: s?.lastCheck?.state || 'DISCOVERED', trustedFingerprint: s?.trusted?.fingerprint || null };
    });
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
