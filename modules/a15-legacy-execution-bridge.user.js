// ==UserScript==
// @name         Gremlin Logic A15 Legacy Execution Bridge
// @namespace    local.imagetrend.a15native.legacybridge
// @version      0.1.0
// @description  Transitional headless adapter that exposes the validated monolithic A15 Preview/Apply execution path without exposing its legacy GUI to the replacement skin.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const API_VERSION = '0.1.0';
  const LEGACY_HOST_ID = 'it-a15-native-test';
  const EVENT = 'gremlin:a15:legacy-execution-state';
  let running = false;
  let legacyChromeHidden = false;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function host() {
    return document.getElementById(LEGACY_HOST_ID) || null;
  }

  function controls() {
    const h = host();
    const root = h?.shadowRoot;
    if (!h || !root) return { host: h, root, preview: null, apply: null, result: null };
    return {
      host: h,
      root,
      preview: root.querySelector('#preview'),
      apply: root.querySelector('#apply'),
      result: root.querySelector('#result')
    };
  }

  function available() {
    const c = controls();
    return !!(c.host && c.root && c.preview && c.apply);
  }

  function state() {
    const c = controls();
    return {
      apiVersion: API_VERSION,
      available: !!(c.host && c.root && c.preview && c.apply),
      running,
      applyReady: !!c.apply && !c.apply.disabled,
      resultText: String(c.result?.textContent || '').trim().slice(0, 3000),
      legacyChromeHidden
    };
  }

  function emit(reason) {
    try {
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { reason, state: state() } }));
    } catch {}
  }

  function hideLegacyChrome() {
    const c = controls();
    if (!c.host) return false;
    c.host.dataset.gremlinLegacyBridge = 'managed';
    c.host.style.setProperty('display', 'none', 'important');
    legacyChromeHidden = true;
    emit('legacy-chrome-hidden');
    return true;
  }

  function showLegacyChrome() {
    const c = controls();
    if (!c.host) return false;
    c.host.style.removeProperty('display');
    delete c.host.dataset.gremlinLegacyBridge;
    legacyChromeHidden = false;
    emit('legacy-chrome-shown');
    return true;
  }

  async function waitForLegacy(timeoutMs = 15000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if (available()) return controls();
      await sleep(150);
    }
    throw new Error('Legacy A15 execution engine is not available.');
  }

  async function waitUntil(predicate, timeoutMs, message) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const value = predicate();
      if (value) return value;
      await sleep(100);
    }
    throw new Error(message);
  }

  async function review() {
    if (running) throw new Error('A15 execution is already running.');
    const c = await waitForLegacy();
    c.preview.click();
    await waitUntil(() => {
      const next = controls();
      return next.apply && !next.apply.disabled ? next : null;
    }, 12000, 'A15 review did not produce an executable plan.');
    emit('review-ready');
    return state();
  }

  async function executeReviewed() {
    if (running) throw new Error('A15 execution is already running.');
    const c = await waitForLegacy();
    if (c.apply.disabled) throw new Error('A15 has not been reviewed or the reviewed plan is no longer valid.');
    running = true;
    emit('execution-started');
    try {
      c.apply.click();
      await waitUntil(() => {
        const next = controls();
        return next.apply && !next.apply.disabled ? null : next;
      }, 2500, 'A15 execution did not start.');

      // Legacy A15 owns the actual mutation lifecycle. We only wait for its Apply
      // control to become usable again or for a stable result message to appear.
      await waitUntil(() => {
        const next = controls();
        if (!next.apply) return true;
        const text = String(next.result?.textContent || '').trim();
        return !next.apply.disabled || /complete|completed|stopped|failed|error|review/i.test(text);
      }, 90000, 'A15 execution did not return to an idle state.');
      return state();
    } finally {
      running = false;
      emit('execution-finished');
    }
  }

  async function goBabyGo() {
    if (running) throw new Error('A15 execution is already running.');
    await review();
    return executeReviewed();
  }

  const api = Object.freeze({
    version: API_VERSION,
    state,
    review,
    executeReviewed,
    goBabyGo,
    hideLegacyChrome,
    showLegacyChrome
  });

  Object.defineProperty(window, 'GremlinA15LegacyExecution', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: api
  });

  waitForLegacy().then(() => {
    hideLegacyChrome();
    emit('bridge-ready');
  }).catch(() => emit('bridge-unavailable'));
})();
