// ==UserScript==
// @name         Gremlin Logic A15 — Chicken Fetcher Package
// @namespace    local.imagetrend.a15.chickenfetcher
// @version      0.1.0
// @description  Unified iPad/Safari package: keeps the A15 modular stack in one Tampermonkey execution context and carries the validated legacy engine headlessly behind the new GUI.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @sandbox      raw
// @run-at       document-idle
// @noframes
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-runtime-core.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-reconstruction.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-compatibility-guard.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-safety-guard.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-protected-fields.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-findings-engine.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-legacy-execution-bridge.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-control-center.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-gui.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-workflow-helper/main/src/a15/a15-helper.user.js
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.0';
  const HOST = 'gremlin-a15-chicken-fetcher-status';
  const startedAt = new Date().toISOString();

  // This wrapper intentionally owns no clinical logic and performs no chart mutation.
  // Its job is packaging: every required A15 component executes in the same raw/page
  // context on iPad Safari so the existing window.GremlinA15* contracts work reliably.

  function snapshot() {
    const legacyHost = document.getElementById('it-a15-native-test');
    const guiHost = document.getElementById('gremlin-a15-gui');
    return Object.freeze({
      packageVersion: VERSION,
      startedAt,
      capturedAt: new Date().toISOString(),
      route: location.pathname,
      runtime: window.GremlinA15Runtime?.version || null,
      reconstruction: window.GremlinA15Reconstruction?.version || null,
      compatibility: window.GremlinA15Compatibility?.version || null,
      safety: window.GremlinA15Safety?.version || null,
      protectedFields: window.GremlinA15ProtectedFields?.version || null,
      findings: window.GremlinA15Findings?.version || null,
      legacyExecution: window.GremlinA15LegacyExecution?.version || null,
      controlCenter: window.GremlinA15?.version || null,
      guiMounted: !!guiHost,
      legacyEnginePresent: !!legacyHost,
      legacyEngineHidden: legacyHost ? getComputedStyle(legacyHost).display === 'none' : false
    });
  }

  Object.defineProperty(window, 'GremlinA15ChickenFetcherPackage', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: Object.freeze({ version: VERSION, snapshot })
  });

  function publish(reason) {
    const state = snapshot();
    try {
      document.documentElement.dataset.gremlinA15ChickenFetcher = JSON.stringify(state);
      window.dispatchEvent(new CustomEvent('gremlin:a15:chicken-fetcher-state', {
        detail: { reason, state }
      }));
    } catch {}
    return state;
  }

  publish('package-loaded');
  setTimeout(() => publish('settled-500ms'), 500);
  setTimeout(() => publish('settled-2000ms'), 2000);
  setTimeout(() => publish('settled-5000ms'), 5000);

  // Optional tiny failure marker only if the package itself loaded but the public bridge
  // never appeared. The normal A15 GUI owns all regular presentation.
  setTimeout(() => {
    if (window.GremlinA15?.getState || document.getElementById('gremlin-a15-gui')) return;
    if (document.getElementById(HOST)) return;
    const el = document.createElement('div');
    el.id = HOST;
    el.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483645;background:#2b1111;color:#fecaca;border:1px solid #ef4444;border-radius:9px;padding:8px 10px;font:12px system-ui;max-width:320px';
    el.textContent = 'Chicken Fetcher loaded, but A15 public bridge did not come up. Export a GFI scan for diagnostics.';
    document.body.appendChild(el);
    publish('bridge-timeout');
  }, 7000);
})();
