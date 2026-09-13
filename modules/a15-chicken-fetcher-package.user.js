// ==UserScript==
// @name         Gremlin Logic A15 — Chicken Fetcher Package
// @namespace    local.imagetrend.a15.chickenfetcher
// @version      0.1.2
// @description  Unified iPad/Safari package: keeps the A15 modular stack in one Tampermonkey execution context and carries the validated legacy engine headlessly behind the new GUI.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @sandbox      raw
// @run-at       document-idle
// @noframes
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js?v=0.2.4.19
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-runtime-core.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-reconstruction.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-model-bridge.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-compatibility-guard.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-safety-guard.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-protected-fields.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-findings-engine.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-clinical-logic.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-legacy-execution-bridge.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-control-center.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/modules/a15-gui.user.js
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-workflow-helper/main/src/a15/a15-helper.user.js
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.2';
  const HOST = 'gremlin-a15-chicken-fetcher-status';
  const startedAt = new Date().toISOString();

  // Packaging only. Clinical/model modules are required here so their existing guarded
  // APIs live in the same raw/page context on iPad Safari; this wrapper itself owns no
  // clinical policy and performs no chart mutation.

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
      modelBridge: window.GremlinA15Bridge?.version || null,
      compatibility: window.GremlinA15Compatibility?.version || null,
      safety: window.GremlinA15Safety?.version || null,
      protectedFields: window.GremlinA15ProtectedFields?.version || null,
      findings: window.GremlinA15Findings?.version || null,
      clinical: window.GremlinA15Clinical?.version || null,
      legacyExecution: window.GremlinA15LegacyExecution?.version || null,
      controlCenter: window.GremlinA15?.version || null,
      guiMounted: !!guiHost,
      guiBridgeMode: guiHost?.dataset?.bridgeMode || null,
      legacyEnginePresent: !!legacyHost,
      legacyEngineHidden: legacyHost ? getComputedStyle(legacyHost).display === 'none' : null
    });
  }

  function publish(reason = 'package-ready') {
    const state = snapshot();
    try {
      document.documentElement.dataset.gremlinA15ChickenFetcher = JSON.stringify(state);
      window.dispatchEvent(new CustomEvent('gremlin:a15:chicken-fetcher-state', { detail: { reason, state } }));
    } catch {}
    return state;
  }

  function mountStatus() {
    if (document.getElementById(HOST)) return;
    const host = document.createElement('div');
    host.id = HOST;
    host.hidden = true;
    host.dataset.packageVersion = VERSION;
    document.documentElement.append(host);
  }

  mountStatus();
  publish();
  setTimeout(() => publish('settled-1s'), 1000);
  setTimeout(() => publish('settled-3s'), 3000);
})();
