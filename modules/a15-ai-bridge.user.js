// ==UserScript==
// @name         Gremlin Logic A15 AI Bridge
// @namespace    local.imagetrend.a15native.ai
// @version      0.1.2
// @description  Guarded bridge to ImageTrend's native AI Capture and AI Generate Values actions for explicit A15 use.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const MODULE_ID = 'ai-bridge';
  const VERSION = '0.1.2';
  const NARRATIVE_ENTRY_ID = '9b465bdd-e13d-511c-8ead-d9743ed82234';

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

  const text = el => String(el?.textContent || '').trim().replace(/\s+/g, ' ');
  function findButton(exactText) {
    const target = exactText.toLowerCase();
    return [...document.querySelectorAll('button,[role="button"],.grid-button,.top-pane-button')].find(el => text(el).toLowerCase() === target) || null;
  }
  function narrativeContainer() {
    return document.getElementById(NARRATIVE_ENTRY_ID) || document.querySelector(`[BindingPathEntryID="${NARRATIVE_ENTRY_ID}"],[bindingpathentryid="${NARRATIVE_ENTRY_ID}"]`) || null;
  }
  function nativeAiHandler() { return window.imagetrend?.formComposer?.controlHandlers?.autoNarrative || null; }
  function safetyGate() {
    const guard = window.GremlinA15Safety;
    if (!guard?.canMutate) return { ok: false, reason: 'safety-module-unavailable' };
    return guard.canMutate();
  }

  function capabilities() {
    const handler = nativeAiHandler();
    const capture = findButton('AI Capture');
    const generate = findButton('AI Generate Values');
    const safety = safetyGate();
    return {
      handlerAvailable: !!handler,
      captureVisible: !!capture,
      captureDisabled: !!capture?.disabled,
      generateVisible: !!generate,
      generateDisabled: !!generate?.disabled,
      directGenerateAvailable: typeof handler?.clickAiGenerateValues === 'function',
      narrativeVisible: !!narrativeContainer(),
      safetyAllowed: !!safety.ok,
      safetyReason: safety.ok ? null : safety.reason
    };
  }

  async function openCapture({ confirm = true } = {}) {
    const runtime = window.GremlinA15Runtime;
    const gate = safetyGate();
    if (!gate.ok) return { ok: false, reason: gate.reason, blockedBySafety: true };
    const button = findButton('AI Capture');
    if (!button) return { ok: false, reason: 'ai-capture-button-not-found' };
    if (button.disabled || button.classList.contains('btn-disabled')) return { ok: false, reason: 'ai-capture-disabled' };
    if (confirm && !window.confirm('Open ImageTrend AI Capture?\n\nThis invokes ImageTrend\'s native AI feature. A15 does not send chart content to a separate AI service. Native save/network side effects still require live validation.')) return { ok: false, reason: 'cancelled' };
    runtime?.emit?.('ai-native-action', { action: 'capture', phase: 'before' });
    button.click();
    runtime?.emit?.('ai-native-action', { action: 'capture', phase: 'after' });
    return { ok: true };
  }

  async function generateValues({ confirm = true } = {}) {
    const runtime = window.GremlinA15Runtime;
    const gate = safetyGate();
    if (!gate.ok) return { ok: false, reason: gate.reason, blockedBySafety: true };
    const handler = nativeAiHandler();
    const visible = findButton('AI Generate Values');
    if (visible?.disabled) return { ok: false, reason: 'ai-generate-disabled' };
    if (confirm && !window.confirm('Run ImageTrend AI Generate Values for the current narrative context?\n\nReview every generated field before saving. Native save/network side effects still require live validation.')) return { ok: false, reason: 'cancelled' };
    runtime?.emit?.('ai-native-action', { action: 'generate-values', phase: 'before' });
    if (visible) {
      visible.click();
      runtime?.emit?.('ai-native-action', { action: 'generate-values', phase: 'after', path: 'native-button' });
      return { ok: true, path: 'native-button' };
    }
    if (typeof handler?.clickAiGenerateValues !== 'function') return { ok: false, reason: 'native-ai-handler-unavailable' };
    const container = narrativeContainer();
    if (!container) return { ok: false, reason: 'narrative-context-unavailable' };
    let ctx = null;
    try { ctx = window.ko?.contextFor?.(container); } catch {}
    if (!ctx) return { ok: false, reason: 'knockout-context-unavailable' };
    try {
      handler.clickAiGenerateValues(ctx);
      runtime?.emit?.('ai-native-action', { action: 'generate-values', phase: 'after', path: 'native-handler' });
      return { ok: true, path: 'native-handler' };
    } catch (error) {
      window.GremlinA15Safety?.recordFailure?.('native-ai-generate', { message: String(error?.message || error) });
      return { ok: false, reason: 'native-handler-threw', message: String(error?.message || error) };
    }
  }

  function inspectWithoutInvoking() {
    const handler = nativeAiHandler();
    return { ...capabilities(), handlerMethods: handler ? Object.keys(handler).filter(k => typeof handler[k] === 'function').sort() : [] };
  }

  const api = Object.freeze({ version: VERSION, capabilities, inspectWithoutInvoking, openCapture, generateValues });
  Object.defineProperty(window, 'GremlinA15AI', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({ id: MODULE_ID, version: VERSION, description: 'Explicit bridge to ImageTrend native AI actions. No background AI invocation and no external chart-data export.', defaultEnabled: true, start: async () => runtime.emit('ai-bridge-ready', inspectWithoutInvoking()), stop: async () => {} });
    runtime.registerCapability('gremlin.nativeAI', () => ({ available: !!nativeAiHandler(), ...capabilities() }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
