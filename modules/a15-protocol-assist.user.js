// ==UserScript==
// @name         Gremlin Logic A15 Protocol Assist
// @namespace    local.imagetrend.a15native.protocols
// @version      0.1.0
// @description  Persistent protocol rule-pack framework for explicit, reviewable ImageTrend field suggestions and autofill.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'protocol-assist';
  const VERSION = '0.1.0';
  const STORAGE_KEY = 'gremlin.a15.protocol-packs.v1';
  const protocols = new Map();
  const safeParse = (s, f) => { try { return JSON.parse(s); } catch { return f; } };
  const clone = v => { try { return structuredClone(v); } catch { return safeParse(JSON.stringify(v), v); } };

  function waitForDeps(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.GremlinA15Runtime && window.GremlinA15Bridge) return resolve({ runtime: window.GremlinA15Runtime, bridge: window.GremlinA15Bridge });
        if (Date.now() - started > timeoutMs) return reject(new Error('A15 protocol dependencies not found.'));
        setTimeout(tick, 250);
      };
      tick();
    });
  }

  function loadStore() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    return raw && typeof raw === 'object' ? raw : { schemaVersion: 1, packs: {} };
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  }

  function factMatches(condition, facts = {}) {
    if (!condition) return true;
    if (Array.isArray(condition.all)) return condition.all.every(c => factMatches(c, facts));
    if (Array.isArray(condition.any)) return condition.any.some(c => factMatches(c, facts));
    if (condition.not) return !factMatches(condition.not, facts);
    const key = String(condition.fact || '');
    const actual = facts[key];
    if ('equals' in condition) return actual === condition.equals;
    if (Array.isArray(condition.in)) return condition.in.includes(actual);
    if ('exists' in condition) return condition.exists ? actual != null : actual == null;
    if ('matches' in condition) {
      try { return new RegExp(condition.matches, condition.flags || 'i').test(String(actual ?? '')); } catch { return false; }
    }
    return false;
  }

  function normalizeAction(action) {
    if (!action || typeof action !== 'object') throw new Error('Protocol action must be an object.');
    if (!action.target || typeof action.target !== 'object') throw new Error('Protocol action requires target metadata.');
    const type = action.type === 'select' ? 'select' : action.type === 'value' ? 'value' : null;
    if (!type) throw new Error('Protocol action type must be select or value.');
    if (type === 'select' && !Array.isArray(action.optionLabels)) throw new Error('Select action requires optionLabels[].');
    if (type === 'value' && action.value == null) throw new Error('Value action requires value.');
    return {
      id: String(action.id || `action-${Math.random().toString(36).slice(2, 8)}`),
      type,
      target: clone(action.target),
      optionLabels: type === 'select' ? action.optionLabels.map(String) : undefined,
      value: type === 'value' ? String(action.value) : undefined,
      when: action.when ? clone(action.when) : null,
      note: String(action.note || '')
    };
  }

  function registerProtocol(definition, { persist = false, packId = 'local' } = {}) {
    if (!definition || typeof definition !== 'object') throw new Error('Protocol definition required.');
    const id = String(definition.id || '').trim();
    if (!id) throw new Error('Protocol id required.');
    const record = {
      id,
      name: String(definition.name || id),
      version: String(definition.version || '1'),
      source: String(definition.source || ''),
      description: String(definition.description || ''),
      actions: (definition.actions || []).map(normalizeAction)
    };
    protocols.set(id, record);
    if (persist) {
      const store = loadStore();
      store.packs[packId] ||= { id: packId, name: packId, protocols: [] };
      store.packs[packId].protocols = store.packs[packId].protocols.filter(p => p.id !== id);
      store.packs[packId].protocols.push(clone(record));
      saveStore(store);
    }
    return clone(record);
  }

  function hydrateStoredPacks() {
    const store = loadStore();
    for (const pack of Object.values(store.packs || {})) {
      for (const p of pack?.protocols || []) {
        try { registerProtocol(p); } catch {}
      }
    }
  }

  function importPack(pack) {
    if (typeof pack === 'string') pack = safeParse(pack, null);
    if (!pack || typeof pack !== 'object') throw new Error('Invalid protocol pack.');
    const id = String(pack.id || `pack-${Date.now()}`);
    const normalized = {
      id,
      name: String(pack.name || id),
      version: String(pack.version || '1'),
      importedAt: new Date().toISOString(),
      protocols: (pack.protocols || []).map(p => registerProtocol(p))
    };
    const store = loadStore();
    store.packs[id] = clone(normalized);
    saveStore(store);
    window.GremlinA15Runtime?.emit?.('protocol-pack-imported', { packId: id, protocols: normalized.protocols.length });
    return clone(normalized);
  }

  function exportPacks() { return clone(loadStore()); }

  function suggestions(protocolId, facts = {}) {
    const p = protocols.get(String(protocolId));
    if (!p) return [];
    return p.actions.filter(a => factMatches(a.when, facts)).map(a => ({ ...clone(a), resolvable: !!window.GremlinA15Bridge?.resolve?.(a.target) }));
  }

  async function apply(protocolId, facts = {}, { confirm = true } = {}) {
    const p = protocols.get(String(protocolId));
    const bridge = window.GremlinA15Bridge;
    const runtime = window.GremlinA15Runtime;
    if (!p || !bridge) return { ok: false, reason: 'protocol-or-bridge-unavailable' };
    const actions = p.actions.filter(a => factMatches(a.when, facts));
    if (!actions.length) return { ok: true, applied: [], skipped: [], note: 'No matching actions.' };

    if (confirm && !window.confirm(`Apply ${actions.length} suggested field change(s) from “${p.name}”?\n\nA15 will change only fields it can resolve and verify. Review the chart before saving.`)) {
      return { ok: false, reason: 'cancelled' };
    }

    const applied = [], skipped = [];
    for (const action of actions) {
      let result;
      if (action.type === 'select') result = await bridge.selectByLabel(action.target, action.optionLabels, { fuzzy: false });
      else result = await bridge.setValue(action.target, action.value);
      (result?.ok ? applied : skipped).push({ actionId: action.id, result });
    }
    runtime?.emit?.('protocol-applied', { protocolId: p.id, applied: applied.length, skipped: skipped.length });
    return { ok: skipped.length === 0, protocolId: p.id, applied, skipped };
  }

  const api = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    registerProtocol,
    listProtocols: () => [...protocols.values()].map(p => ({ id: p.id, name: p.name, version: p.version, source: p.source, description: p.description, actions: p.actions.length })),
    getProtocol: id => clone(protocols.get(String(id)) || null),
    suggestions,
    apply,
    importPack,
    exportPacks,
    clearImportedPacks() { localStorage.removeItem(STORAGE_KEY); protocols.clear(); return true; }
  });

  Object.defineProperty(window, 'GremlinA15Protocols', { value: api, enumerable: false, configurable: false, writable: false });

  hydrateStoredPacks();

  waitForDeps().then(({ runtime }) => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Persistent protocol rule packs with explicit reviewable autofill. Ships without protocol content until a validated source is imported.',
      defaultEnabled: true,
      start: async () => runtime.emit('protocol-assist-ready', { protocols: protocols.size }),
      stop: async () => {}
    });
    runtime.registerCapability('gremlin.protocolAssist', () => ({ available: true, protocols: protocols.size, importedPacks: Object.keys(loadStore().packs || {}).length }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
