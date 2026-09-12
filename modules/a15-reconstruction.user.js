// ==UserScript==
// @name         Gremlin Logic A15 Reconstruction Mapper
// @namespace    local.imagetrend.a15native.reconstruction
// @version      0.1.0
// @description  Low-noise metadata-only field/action reconstruction map for resilient A15 integrations.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'reconstruction-mapper';
  const VERSION = '0.1.0';
  const STORAGE_KEY = 'gremlin.a15.reconstruction.v1';
  const MAX_ROUTES = 24;
  const MAX_FIELDS = 1200;
  const MAX_ACTIONS = 500;
  let observer = null;
  let scanTimer = null;
  let lastSignature = '';

  const now = () => new Date().toISOString();
  const norm = v => (v == null ? '' : String(v)).trim();
  const unwrap = v => {
    try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
    catch { return undefined; }
  };
  const safeParse = (s, f) => { try { return JSON.parse(s); } catch { return f; } };
  const clone = v => { try { return structuredClone(v); } catch { return safeParse(JSON.stringify(v), v); } };

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

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function contextFor(el) {
    try { return window.ko?.contextFor?.(el) || null; } catch { return null; }
  }

  function fieldMeta(el) {
    let node = el;
    for (let depth = 0; node && depth < 10; depth++, node = node.parentElement) {
      const ctx = contextFor(node);
      const d = ctx?.$data;
      const entryId = unwrap(d?.BindingPathEntryID) || node.getAttribute?.('BindingPathEntryID') || node.getAttribute?.('bindingpathentryid') || node.getAttribute?.('data-bindingpathentryid') || null;
      const bindingPath = unwrap(d?.BindingPath) || node.getAttribute?.('BindingPath') || node.getAttribute?.('bindingpath') || node.getAttribute?.('data-bindingpath') || null;
      const controlId = unwrap(d?.ControlID) ?? node.getAttribute?.('ControlID') ?? node.getAttribute?.('controlid') ?? node.getAttribute?.('data-controlid') ?? null;
      if (!entryId && !bindingPath && controlId == null) continue;
      return {
        entryId: entryId || null,
        bindingPath: bindingPath || null,
        controlId: controlId == null ? null : controlId,
        formId: unwrap(d?.FormID) || null,
        label: unwrap(d?.Label) || null,
        controlType: unwrap(d?.ControlType) || null,
        tag: node.tagName || null
      };
    }
    return null;
  }

  function actionMeta(el) {
    if (!(el instanceof Element)) return null;
    const bind = norm(el.getAttribute('data-bind'));
    const text = norm(el.textContent).replace(/\s+/g, ' ').slice(0, 120);
    if (!bind && !el.matches('button,[role="button"],a[href],input[type="button"],input[type="submit"]')) return null;
    if (!/(click|submit|navigate|open|toggle|show|hide|select|generate|save|finish|post|transfer)/i.test(bind + ' ' + text)) return null;
    return {
      text,
      tag: el.tagName || null,
      id: el.id || null,
      classes: typeof el.className === 'string' ? el.className.slice(0, 160) : null,
      dataBind: bind.slice(0, 600) || null,
      role: el.getAttribute('role') || null,
      ariaLabel: el.getAttribute('aria-label') || null
    };
  }

  function collect() {
    const runtime = window.GremlinA15Runtime;
    if (!runtime?.reconstruction?.enabled?.()) return { disabled: true, route: location.pathname, fields: [], actions: [] };
    const root = document.querySelector('#form-composer') || document.querySelector('#center-pane') || document.body;
    if (!root) return { disabled: false, route: location.pathname, fields: [], actions: [] };

    const fields = [];
    const fieldSeen = new Set();
    for (const el of root.querySelectorAll('[data-bind],[BindingPathEntryID],[bindingpathentryid],[data-bindingpathentryid],[ControlID],[controlid],[data-controlid],kosingleselect,komultiselect,textarea,input,select,.interceptor')) {
      const m = fieldMeta(el);
      if (!m) continue;
      const key = `${m.entryId || ''}|${m.controlId ?? ''}|${m.bindingPath || ''}`;
      if (!key.replace(/\|/g, '') || fieldSeen.has(key)) continue;
      fieldSeen.add(key);
      fields.push(m);
      if (fields.length >= MAX_FIELDS) break;
    }

    const actions = [];
    const actionSeen = new Set();
    for (const el of root.querySelectorAll('button,[role="button"],a[href],[data-bind],input[type="button"],input[type="submit"]')) {
      const a = actionMeta(el);
      if (!a) continue;
      const key = `${a.text}|${a.tag}|${a.id || ''}|${a.dataBind || ''}`;
      if (actionSeen.has(key)) continue;
      actionSeen.add(key);
      actions.push(a);
      if (actions.length >= MAX_ACTIONS) break;
    }

    const fingerprint = hash(JSON.stringify({ fields, actions }));
    return { disabled: false, route: location.pathname, capturedAt: now(), fingerprint, fields, actions };
  }

  function loadStore() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    return raw && typeof raw === 'object' ? raw : { schemaVersion: 1, routes: {}, firstSeenAt: now(), lastSeenAt: null };
  }

  function persistSnapshot(snapshot, reason = 'scan') {
    if (snapshot.disabled || !snapshot.route) return false;
    const store = loadStore();
    store.lastSeenAt = now();
    const prior = store.routes[snapshot.route];
    if (prior?.fingerprint === snapshot.fingerprint) return false;
    store.routes[snapshot.route] = {
      fingerprint: snapshot.fingerprint,
      firstSeenAt: prior?.firstSeenAt || now(),
      updatedAt: now(),
      fields: snapshot.fields,
      actions: snapshot.actions
    };
    const keys = Object.keys(store.routes);
    if (keys.length > MAX_ROUTES) {
      keys.sort((a, b) => String(store.routes[a]?.updatedAt || '').localeCompare(String(store.routes[b]?.updatedAt || '')));
      while (keys.length > MAX_ROUTES) delete store.routes[keys.shift()];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    lastSignature = snapshot.fingerprint;
    window.GremlinA15Runtime?.emit?.('reconstruction-updated', {
      route: snapshot.route,
      fingerprint: snapshot.fingerprint,
      fields: snapshot.fields.length,
      actions: snapshot.actions.length,
      reason
    });
    return true;
  }

  function scan(reason = 'manual') {
    const snapshot = collect();
    if (!snapshot.disabled) persistSnapshot(snapshot, reason);
    return clone(snapshot);
  }

  function schedule(reason = 'dom-change', delay = 1400) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      const snap = collect();
      if (!snap.disabled && snap.fingerprint !== lastSignature) persistSnapshot(snap, reason);
    }, delay);
  }

  function startObserver() {
    if (observer) return;
    const root = document.querySelector('#center-pane') || document.body;
    if (!root) return;
    observer = new MutationObserver(records => {
      // Structural changes only. No characterData/attribute observation; this intentionally ignores typing.
      if (records.some(r => r.type === 'childList' && (r.addedNodes.length || r.removedNodes.length))) schedule('structure-change');
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function stopObserver() {
    observer?.disconnect?.();
    observer = null;
    clearTimeout(scanTimer);
  }

  const api = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    scan,
    getMap() { return clone(loadStore()); },
    clearMap() { localStorage.removeItem(STORAGE_KEY); lastSignature = ''; return true; },
    setEnabled(enabled) {
      const runtime = window.GremlinA15Runtime;
      runtime?.reconstruction?.setEnabled?.(!!enabled);
      if (enabled) { startObserver(); schedule('re-enabled', 250); }
      else stopObserver();
      return !!enabled;
    }
  });

  Object.defineProperty(window, 'GremlinA15Reconstruction', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Metadata-only adaptive field/action map. No keystroke logging and no patient scalar persistence.',
      defaultEnabled: true,
      start: async () => {
        if (!runtime.reconstruction.enabled()) return;
        setTimeout(() => { scan('boot'); startObserver(); }, 2200);
      },
      stop: async () => stopObserver()
    });
    runtime.registerCapability('gremlin.reconstructionMap', () => ({
      available: runtime.reconstruction.enabled(),
      routeKnown: !!loadStore().routes?.[location.pathname],
      fingerprint: loadStore().routes?.[location.pathname]?.fingerprint || null
    }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
