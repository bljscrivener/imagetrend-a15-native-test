// ==UserScript==
// @name         Gremlin Logic A15 0.4 Dev Runtime
// @namespace    local.imagetrend.a15native.v04
// @version      0.4.0-dev.1
// @description  A15 0.4 asynchronous scheduler/runtime layered over the known-good 0.3 mechanism.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// @sandbox      raw
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/core/a15-core-0.4.js?v=1
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/services/service-contracts.js?v=2
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/services/pdf-integrator.js?v=1
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/services/legacy-compat.js?v=1
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/pipelines/evidence-pipeline.js?v=1
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/app/a15-app-0.4.js?v=1
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/ui/a15-toolbar-0.4.js?v=1
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/a15-0.4-dev.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-0.4-async-runtime/v0.4/a15-0.4-dev.user.js
// ==/UserScript==

(() => {
  'use strict';
  const version='0.4.0-dev.1';
  const state={
    version,
    loadedAt:new Date().toISOString(),
    core:window.GremlinA15Core04?.version || null,
    app:window.GremlinA15App04?.version || null,
    pdf:window.GremlinA15Pdf04?.version || null,
    evidence:window.GremlinA15Evidence04?.version || null,
    toolbar:window.GremlinA15Toolbar04?.version || null,
    legacyCompat:window.GremlinA15LegacyCompat04?.version || null
  };
  document.documentElement.setAttribute('data-gremlin-a15-04',JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('gremlin:a15:04:loader-ready',{detail:state}));
})();
