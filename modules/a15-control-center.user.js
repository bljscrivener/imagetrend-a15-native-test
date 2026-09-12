// ==UserScript==
// @name         Gremlin Logic A15 Control Center
// @namespace    local.imagetrend.a15native.control
// @version      0.3.0
// @description  Headless A15 application/controller bridge. Owns no DOM and exposes a stable UI-facing API over A15 runtime modules.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'control-center';
  const VERSION = '0.3.0';
  const BRIDGE_VERSION = '1.1.0';
  const EVENT = 'gremlin:a15:bridge-state';
  let runtime = null;
  let unsubscribe = [];

  function waitForRuntime(timeoutMs = 15000) {
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

  const clone = value => {
    try { return structuredClone(value); }
    catch {
      try { return JSON.parse(JSON.stringify(value)); }
      catch { return value; }
    }
  };

  function findings() {
    try { return window.GremlinA15Findings?.getFindings?.() || []; }
    catch { return []; }
  }

  function compatibility() {
    try { return window.GremlinA15Compatibility?.state?.() || null; }
    catch { return null; }
  }

  function safety() {
    try { return window.GremlinA15Safety?.state?.() || null; }
    catch { return null; }
  }

  function execution() {
    try {
      const x = window.GremlinA15LegacyExecution?.state?.();
      return x || { available: false, running: false, applyReady: false, resultText: '', legacyChromeHidden: false };
    } catch {
      return { available: false, running: false, applyReady: false, resultText: '', legacyChromeHidden: false };
    }
  }

  function profileState() {
    const active = runtime?.getProfile?.() || null;
    const profiles = runtime?.listProfiles?.() || [];
    return {
      active: active ? { id: active.id, name: active.name } : null,
      profiles: profiles.map(p => ({ id: p.id, name: p.name }))
    };
  }

  function getState() {
    const c = compatibility();
    const s = safety();
    const p = profileState();
    const x = execution();
    return clone({
      bridgeVersion: BRIDGE_VERSION,
      runtimeVersion: runtime?.version || null,
      route: location.pathname,
      supportedRoute: /^\/Elite\/.+\/(?:Offline)?EmsRunForm(?:\/|$)/i.test(location.pathname),
      profile: p.active,
      profiles: p.profiles,
      settings: runtime?.settings?.all?.() || {},
      findings: findings(),
      execution: {
        available: !!x.available,
        running: !!x.running,
        applyReady: !!x.applyReady,
        resultText: String(x.resultText || ''),
        legacyChromeHidden: !!x.legacyChromeHidden
      },
      compatibility: {
        state: c?.lastCheck?.state || c?.state || 'DISCOVERED',
        fingerprint: c?.lastCheck?.fingerprint || c?.trusted?.fingerprint || null
      },
      safety: {
        suspended: !!s?.suspended,
        compatibilityAllowed: s?.compatibilityAllowed !== false,
        failures: s?.failures ?? 0,
        budget: s?.budget ?? null
      }
    });
  }

  function notify(reason = 'state') {
    try {
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { reason, state: getState() } }));
    } catch {}
  }

  function on(name, handler) {
    window.addEventListener(name, handler);
    unsubscribe.push(() => window.removeEventListener(name, handler));
  }

  async function exportDiagnostics() {
    return {
      at: new Date().toISOString(),
      runtime: runtime?.exportDiagnostics?.() || null,
      reconstruction: window.GremlinA15Reconstruction?.scan?.('diagnostics') || null,
      compatibility: compatibility(),
      safety: safety(),
      execution: execution(),
      nativeActions: window.GremlinA15NativeActions?.capabilityMap?.() || null,
      ai: window.GremlinA15AI?.inspectWithoutInvoking?.() || null,
      protectedFields: window.GremlinA15ProtectedFields?.list?.() || [],
      findings: findings().map(f => ({
        id: f.id,
        ruleId: f.ruleId,
        severity: f.severity,
        title: f.title,
        target: f.target || null
      }))
    };
  }

  const actions = Object.freeze({
    async goBabyGo() {
      if (!window.GremlinA15LegacyExecution?.goBabyGo) return { ok: false, reason: 'execution engine unavailable' };
      notify('execution-requested');
      try {
        const result = await window.GremlinA15LegacyExecution.goBabyGo();
        notify('execution-complete');
        return { ok: true, state: result };
      } catch (error) {
        notify('execution-error');
        return { ok: false, reason: String(error?.message || error), state: execution() };
      }
    },

    async reviewExecution() {
      if (!window.GremlinA15LegacyExecution?.review) return { ok: false, reason: 'execution engine unavailable' };
      try {
        const result = await window.GremlinA15LegacyExecution.review();
        notify('execution-reviewed');
        return { ok: true, state: result };
      } catch (error) {
        notify('execution-review-error');
        return { ok: false, reason: String(error?.message || error), state: execution() };
      }
    },

    async evaluate() {
      const result = await window.GremlinA15Findings?.evaluate?.({ source: 'control-center' });
      notify('findings-evaluated');
      return result;
    },

    remap() {
      const result = window.GremlinA15Reconstruction?.scan?.('manual-ui') || null;
      notify('reconstruction-remapped');
      return result;
    },

    compatibilityCheck() {
      const result = window.GremlinA15Compatibility?.inspect?.() || null;
      notify('compatibility-checked');
      return result;
    },

    trustCurrentMap() {
      const result = window.GremlinA15Compatibility?.trustCurrent?.({ confirm: true }) || null;
      window.GremlinA15Compatibility?.inspect?.();
      notify('compatibility-trusted');
      return result;
    },

    rollbackMap() {
      const result = window.GremlinA15Compatibility?.rollbackTrusted?.({ confirm: true }) || null;
      notify('compatibility-rollback');
      return result;
    },

    resetSafety() {
      const result = window.GremlinA15Safety?.reset?.({ confirm: true }) || null;
      notify('safety-reset');
      return result;
    },

    async openAiCapture() {
      const result = await window.GremlinA15AI?.openCapture?.({ confirm: true });
      notify('ai-capture');
      return result;
    },

    async generateAiValues() {
      const result = await window.GremlinA15AI?.generateValues?.({ confirm: true });
      notify('ai-generate');
      return result;
    },

    async prepareSalineFlush(route, doseMl) {
      if (!window.GremlinA15Clinical?.prepareSalineFlush) return { ok: false, reason: 'clinical module unavailable' };
      const result = await window.GremlinA15Clinical.prepareSalineFlush({ route, doseMl: Number(doseMl), confirm: true });
      await window.GremlinA15Findings?.evaluate?.({ source: 'control-center' });
      notify('clinical-action');
      return result;
    },

    setReconstructionEnabled(enabled) {
      runtime.settings.set('reconstructionEnabled', !!enabled);
      window.GremlinA15Reconstruction?.setEnabled?.(!!enabled);
      notify('setting-reconstruction');
      return !!enabled;
    },

    setDiagnosticsEnabled(enabled) {
      runtime.settings.set('diagnosticsEnabled', !!enabled);
      notify('setting-diagnostics');
      return !!enabled;
    },

    useProfile(id) {
      const result = runtime.useProfile(id);
      notify('profile-changed');
      return result;
    },

    createProfile(id, name) {
      const result = runtime.createProfile(id, name);
      notify('profile-created');
      return result;
    },

    async navigateToFinding(index) {
      const f = findings()[Number(index)];
      if (!f?.target) return false;
      return !!(await window.GremlinA15Findings?.navigateTo?.(f.target));
    },

    async exportDiagnostics() {
      return exportDiagnostics();
    }
  });

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    const handler = event => listener(clone(event.detail?.state || getState()), event.detail?.reason || 'state');
    window.addEventListener(EVENT, handler);
    listener(getState(), 'subscribe');
    return () => window.removeEventListener(EVENT, handler);
  }

  function installBridge() {
    const bridge = Object.freeze({
      version: BRIDGE_VERSION,
      getState,
      subscribe,
      actions
    });
    Object.defineProperty(window, 'GremlinA15', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: bridge
    });

    const relay = e => notify(e.type.replace('gremlin:a15:', ''));
    [
      'gremlin:a15:findings-updated',
      'gremlin:a15:profile-changed',
      'gremlin:a15:setting-changed',
      'gremlin:a15:compatibility-state',
      'gremlin:a15:safety-failure',
      'gremlin:a15:safety-reset',
      'gremlin:a15:module-started',
      'gremlin:a15:module-stopped',
      'gremlin:a15:legacy-execution-state'
    ].forEach(name => on(name, relay));

    notify('bridge-ready');
  }

  function uninstallBridge() {
    unsubscribe.splice(0).forEach(fn => { try { fn(); } catch {} });
    try { delete window.GremlinA15; } catch {}
  }

  waitForRuntime().then(r => {
    runtime = r;
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Headless A15 controller and stable UI bridge. No DOM ownership.',
      defaultEnabled: true,
      start: async () => installBridge(),
      stop: async () => uninstallBridge()
    });
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
