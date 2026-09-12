// ==UserScript==
// @name         Gremlin Logic A15 Runtime Core
// @namespace    local.imagetrend.a15native.runtime
// @version      0.1.0
// @description  Stable runtime, persistent profile store, feature flags, capability registry, and low-noise reconstruction support for Gremlin Logic A15 add-on modules.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const RUNTIME_VERSION = '0.1.0';
  const STORAGE_KEY = 'gremlin.a15.runtime.v1';
  const EVENT_PREFIX = 'gremlin:a15:';
  const SUPPORTED_ROUTE = () => /^\/Elite\/.+\/(?:Offline)?EmsRunForm(?:\/|$)/i.test(location.pathname);
  const now = () => new Date().toISOString();

  // Do not install twice. Preserve the first live runtime until a full page reload.
  if (window.GremlinA15Runtime?.version) return;

  const safeParse = (text, fallback) => {
    try { return JSON.parse(text); } catch { return fallback; }
  };

  const clone = value => {
    try { return structuredClone(value); }
    catch { return safeParse(JSON.stringify(value), value); }
  };

  const DEFAULT_STATE = Object.freeze({
    schemaVersion: 1,
    activeProfileId: 'default',
    profiles: {
      default: {
        id: 'default',
        name: 'Default',
        createdAt: null,
        updatedAt: null,
        settings: {
          reconstructionEnabled: true,
          reconstructionNoticeAcknowledged: false,
          diagnosticsEnabled: true,
          severityMode: 'tiered'
        },
        featureFlags: {}
      }
    },
    migrations: {},
    runtime: {
      firstSeenAt: null,
      lastSeenAt: null,
      lastVersion: null
    }
  });

  function normalizeState(raw) {
    const state = raw && typeof raw === 'object' ? raw : {};
    state.schemaVersion = Number.isFinite(+state.schemaVersion) ? +state.schemaVersion : 1;
    state.activeProfileId = typeof state.activeProfileId === 'string' && state.activeProfileId ? state.activeProfileId : 'default';
    state.profiles = state.profiles && typeof state.profiles === 'object' ? state.profiles : {};
    state.migrations = state.migrations && typeof state.migrations === 'object' ? state.migrations : {};
    state.runtime = state.runtime && typeof state.runtime === 'object' ? state.runtime : {};

    if (!state.profiles.default) state.profiles.default = clone(DEFAULT_STATE.profiles.default);
    if (!state.profiles[state.activeProfileId]) state.activeProfileId = 'default';

    for (const [id, profile] of Object.entries(state.profiles)) {
      if (!profile || typeof profile !== 'object') {
        state.profiles[id] = clone(DEFAULT_STATE.profiles.default);
        state.profiles[id].id = id;
        continue;
      }
      profile.id = id;
      profile.name = typeof profile.name === 'string' && profile.name ? profile.name : id;
      profile.settings = profile.settings && typeof profile.settings === 'object' ? profile.settings : {};
      profile.featureFlags = profile.featureFlags && typeof profile.featureFlags === 'object' ? profile.featureFlags : {};
      for (const [key, value] of Object.entries(DEFAULT_STATE.profiles.default.settings)) {
        if (!(key in profile.settings)) profile.settings[key] = value;
      }
    }
    return state;
  }

  function loadState() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    const state = normalizeState(raw || clone(DEFAULT_STATE));
    const stamp = now();
    state.runtime.firstSeenAt ||= stamp;
    state.runtime.lastSeenAt = stamp;
    state.runtime.lastVersion = RUNTIME_VERSION;
    const p = state.profiles[state.activeProfileId];
    p.createdAt ||= stamp;
    p.updatedAt ||= stamp;
    return state;
  }

  let state = loadState();

  function persist(reason = 'update') {
    const p = state.profiles[state.activeProfileId];
    if (p) p.updatedAt = now();
    state.runtime.lastSeenAt = now();
    state.runtime.lastVersion = RUNTIME_VERSION;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      emit('state-saved', { reason, profileId: state.activeProfileId });
      return true;
    } catch (error) {
      emit('runtime-error', { scope: 'persist', message: String(error?.message || error) });
      return false;
    }
  }

  function emit(name, detail = {}) {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_PREFIX + name, {
        detail: { at: now(), runtimeVersion: RUNTIME_VERSION, ...detail }
      }));
    } catch {}
  }

  function profile() {
    return state.profiles[state.activeProfileId];
  }

  function ensureProfile(id, name = id) {
    if (!id || typeof id !== 'string') throw new Error('Profile id must be a non-empty string.');
    if (!state.profiles[id]) {
      const stamp = now();
      state.profiles[id] = {
        id,
        name: name || id,
        createdAt: stamp,
        updatedAt: stamp,
        settings: clone(DEFAULT_STATE.profiles.default.settings),
        featureFlags: {}
      };
      persist('profile-created');
    }
    return state.profiles[id];
  }

  const settings = {
    get(key, fallback) {
      const p = profile();
      return p && key in p.settings ? p.settings[key] : fallback;
    },
    set(key, value) {
      profile().settings[key] = value;
      persist(`setting:${key}`);
      emit('setting-changed', { key, value, profileId: state.activeProfileId });
      return value;
    },
    all() { return clone(profile().settings); }
  };

  const flags = {
    isEnabled(moduleId, fallback = true) {
      const p = profile();
      return moduleId in p.featureFlags ? !!p.featureFlags[moduleId] : !!fallback;
    },
    set(moduleId, enabled) {
      profile().featureFlags[moduleId] = !!enabled;
      persist(`feature:${moduleId}`);
      emit('feature-flag-changed', { moduleId, enabled: !!enabled, profileId: state.activeProfileId });
      return !!enabled;
    },
    all() { return clone(profile().featureFlags); }
  };

  const modules = new Map();
  const moduleStatus = new Map();

  function registerModule(definition) {
    if (!definition || typeof definition !== 'object') throw new Error('Module definition is required.');
    const id = String(definition.id || '').trim();
    if (!id) throw new Error('Module id is required.');
    if (modules.has(id)) return modules.get(id);

    const record = Object.freeze({
      id,
      version: String(definition.version || '0.0.0'),
      defaultEnabled: definition.defaultEnabled !== false,
      start: typeof definition.start === 'function' ? definition.start : async () => {},
      stop: typeof definition.stop === 'function' ? definition.stop : async () => {},
      description: String(definition.description || '')
    });
    modules.set(id, record);
    moduleStatus.set(id, { state: 'registered', at: now(), error: null });
    emit('module-registered', { moduleId: id, version: record.version });
    return record;
  }

  async function startModule(id) {
    const mod = modules.get(id);
    if (!mod) throw new Error(`Unknown module: ${id}`);
    if (!flags.isEnabled(id, mod.defaultEnabled)) {
      moduleStatus.set(id, { state: 'disabled', at: now(), error: null });
      return false;
    }
    const current = moduleStatus.get(id);
    if (current?.state === 'running') return true;
    try {
      moduleStatus.set(id, { state: 'starting', at: now(), error: null });
      await mod.start(api);
      moduleStatus.set(id, { state: 'running', at: now(), error: null });
      emit('module-started', { moduleId: id, version: mod.version });
      return true;
    } catch (error) {
      const message = String(error?.message || error);
      moduleStatus.set(id, { state: 'degraded', at: now(), error: message });
      emit('runtime-error', { scope: `module:${id}`, message });
      return false;
    }
  }

  async function stopModule(id) {
    const mod = modules.get(id);
    if (!mod) return false;
    try {
      await mod.stop(api);
      moduleStatus.set(id, { state: 'stopped', at: now(), error: null });
      emit('module-stopped', { moduleId: id });
      return true;
    } catch (error) {
      moduleStatus.set(id, { state: 'degraded', at: now(), error: String(error?.message || error) });
      return false;
    }
  }

  async function startAll() {
    for (const id of modules.keys()) await startModule(id);
  }

  const capabilities = new Map();

  function registerCapability(name, probe, meta = {}) {
    if (!name || typeof probe !== 'function') throw new Error('Capability requires a name and probe function.');
    capabilities.set(String(name), { probe, meta: clone(meta), last: null });
  }

  async function probeCapability(name) {
    const cap = capabilities.get(name);
    if (!cap) return { available: false, reason: 'unregistered' };
    try {
      const result = await cap.probe();
      cap.last = typeof result === 'object' && result !== null ? { ...result, checkedAt: now() } : { available: !!result, checkedAt: now() };
    } catch (error) {
      cap.last = { available: false, reason: String(error?.message || error), checkedAt: now() };
    }
    emit('capability-probed', { name, result: clone(cap.last) });
    return clone(cap.last);
  }

  async function probeAllCapabilities() {
    const out = {};
    for (const name of capabilities.keys()) out[name] = await probeCapability(name);
    return out;
  }

  const reconstruction = {
    // Metadata only: no keydown/input/value interception and no patient-entered scalar export.
    enabled() { return settings.get('reconstructionEnabled', true); },
    setEnabled(enabled) { return settings.set('reconstructionEnabled', !!enabled); },
    snapshot() {
      if (!this.enabled() || !SUPPORTED_ROUTE()) return { enabled: this.enabled(), route: location.pathname, controls: [] };
      const controls = [];
      const seen = new Set();
      const roots = [document.querySelector('#form-composer')].filter(Boolean);
      for (const root of roots) {
        for (const el of root.querySelectorAll('[data-bind],[bindingpathentryid],[BindingPathEntryID],[data-controlid],[ControlID],kosingleselect,komultiselect,textarea,input,select')) {
          let ctx;
          try { ctx = window.ko?.contextFor?.(el); } catch {}
          const d = ctx?.$data;
          const unwrap = v => {
            try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
            catch { return undefined; }
          };
          const entryId = unwrap(d?.BindingPathEntryID) || el.getAttribute?.('BindingPathEntryID') || el.getAttribute?.('bindingpathentryid') || null;
          const controlId = unwrap(d?.ControlID) || el.getAttribute?.('ControlID') || el.getAttribute?.('data-controlid') || null;
          const bindingPath = unwrap(d?.BindingPath) || null;
          const label = unwrap(d?.Label) || null;
          const controlType = unwrap(d?.ControlType) || null;
          if (!entryId && !controlId && !bindingPath) continue;
          const key = `${entryId || ''}|${controlId || ''}|${bindingPath || ''}`;
          if (seen.has(key)) continue;
          seen.add(key);
          controls.push({ entryId, controlId, bindingPath, label, controlType });
        }
      }
      return { enabled: true, route: location.pathname, capturedAt: now(), controls };
    }
  };

  const api = {
    version: RUNTIME_VERSION,
    storageKey: STORAGE_KEY,
    supportedRoute: SUPPORTED_ROUTE,
    getState: () => clone(state),
    getProfile: () => clone(profile()),
    listProfiles: () => Object.values(state.profiles).map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt, updatedAt: p.updatedAt })),
    createProfile(id, name) { return clone(ensureProfile(id, name)); },
    useProfile(id) {
      ensureProfile(id);
      state.activeProfileId = id;
      persist('profile-selected');
      emit('profile-changed', { profileId: id });
      return clone(profile());
    },
    settings,
    flags,
    registerModule,
    startModule,
    stopModule,
    startAll,
    moduleStatus: () => Object.fromEntries([...moduleStatus.entries()].map(([id, status]) => [id, clone(status)])),
    registerCapability,
    probeCapability,
    probeAllCapabilities,
    reconstruction,
    emit,
    exportDiagnostics() {
      return {
        runtimeVersion: RUNTIME_VERSION,
        route: location.pathname,
        supportedRoute: SUPPORTED_ROUTE(),
        activeProfileId: state.activeProfileId,
        settings: settings.all(),
        featureFlags: flags.all(),
        modules: this.moduleStatus(),
        capabilities: Object.fromEntries([...capabilities.entries()].map(([name, cap]) => [name, clone(cap.last)]))
      };
    }
  };

  Object.defineProperty(window, 'GremlinA15Runtime', {
    value: api,
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Stable hatches we already know about. These are probes only; they do not invoke ImageTrend actions.
  registerCapability('imagetrend.formComposer', () => ({ available: !!window.imagetrend?.formComposer }));
  registerCapability('imagetrend.knockout', () => ({ available: !!window.ko?.contextFor }));
  registerCapability('imagetrend.autoNarrative', () => ({
    available: !!window.imagetrend?.formComposer?.controlHandlers?.autoNarrative,
    methods: Object.keys(window.imagetrend?.formComposer?.controlHandlers?.autoNarrative || {}).filter(k => typeof window.imagetrend.formComposer.controlHandlers.autoNarrative[k] === 'function')
  }));
  registerCapability('imagetrend.aiGenerateValues', () => ({
    available: typeof window.imagetrend?.formComposer?.controlHandlers?.autoNarrative?.clickAiGenerateValues === 'function'
  }));

  persist('runtime-start');
  emit('runtime-ready', { route: location.pathname, supportedRoute: SUPPORTED_ROUTE() });

  // Low-noise delayed probe. No polling loop and no keystroke listeners.
  setTimeout(() => { if (settings.get('diagnosticsEnabled', true)) probeAllCapabilities(); }, 1800);
})();
