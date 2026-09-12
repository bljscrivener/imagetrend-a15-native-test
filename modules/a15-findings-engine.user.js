// ==UserScript==
// @name         Gremlin Logic A15 Findings Engine
// @namespace    local.imagetrend.a15native.findings
// @version      0.1.0
// @description  Generic tiered findings engine and clickable field navigation for Gremlin Logic A15.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'findings-engine';
  const VERSION = '0.1.0';
  const severities = Object.freeze({
    info: { rank: 10, label: 'Note' },
    meh: { rank: 20, label: 'Check' },
    warning: { rank: 30, label: 'Warning' },
    critical: { rank: 40, label: 'Critical' }
  });

  function waitForRuntime(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (window.GremlinA15Runtime) return resolve(window.GremlinA15Runtime);
        if (Date.now() - start > timeoutMs) return reject(new Error('A15 runtime core not found.'));
        setTimeout(tick, 250);
      };
      tick();
    });
  }

  const rules = new Map();
  let findings = [];

  const normSeverity = value => severities[value] ? value : 'meh';
  const clone = value => {
    try { return structuredClone(value); }
    catch { try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }
  };

  function registerRule(rule) {
    if (!rule || typeof rule !== 'object') throw new Error('Rule definition required.');
    const id = String(rule.id || '').trim();
    if (!id) throw new Error('Rule id required.');
    if (typeof rule.evaluate !== 'function') throw new Error(`Rule ${id} requires evaluate().`);
    rules.set(id, {
      id,
      description: String(rule.description || ''),
      defaultSeverity: normSeverity(rule.defaultSeverity),
      evaluate: rule.evaluate
    });
    return id;
  }

  function fieldSelector(target = {}) {
    const esc = value => {
      try { return CSS.escape(String(value)); }
      catch { return String(value).replace(/["\\]/g, '\\$&'); }
    };
    if (target.entryId) {
      const id = esc(target.entryId);
      return `#${id},[BindingPathEntryID="${id}"],[bindingpathentryid="${id}"],[data-bindingpathentryid="${id}"],[data-binding-path-entry-id="${id}"]`;
    }
    if (target.controlId != null) {
      const id = esc(target.controlId);
      return `#${id},[ControlID="${id}"],[controlid="${id}"],[data-controlid="${id}"],[data-control-id="${id}"]`;
    }
    return null;
  }

  async function navigateTo(target = {}) {
    const runtime = window.GremlinA15Runtime;
    let el = null;
    const selector = fieldSelector(target);
    if (selector) {
      try { el = document.querySelector(selector); } catch {}
    }

    if (!el && target.bindingPath) {
      const all = document.querySelectorAll('#form-composer [data-bind],#form-composer .control,#form-composer input,#form-composer textarea,#form-composer select');
      for (const candidate of all) {
        let ctx;
        try { ctx = window.ko?.contextFor?.(candidate); } catch {}
        const value = (() => {
          try { return window.ko?.unwrap ? window.ko.unwrap(ctx?.$data?.BindingPath) : ctx?.$data?.BindingPath; }
          catch { return null; }
        })();
        if (value === target.bindingPath) { el = candidate; break; }
      }
    }

    if (el) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch { try { el.scrollIntoView(); } catch {} }
      const focusable = el.matches?.('input,textarea,select,button,[tabindex]') ? el : el.querySelector?.('input,textarea,select,button,[tabindex]');
      try { focusable?.focus?.({ preventScroll: true }); } catch { try { focusable?.focus?.(); } catch {} }
      runtime?.emit?.('finding-navigated', { target: clone(target), resolved: true });
      return true;
    }

    runtime?.emit?.('finding-navigated', { target: clone(target), resolved: false });
    return false;
  }

  async function evaluate(context = {}) {
    const runtime = window.GremlinA15Runtime;
    const next = [];
    for (const rule of rules.values()) {
      try {
        const result = await rule.evaluate({ runtime, context, navigateTo });
        if (!result) continue;
        const rows = Array.isArray(result) ? result : [result];
        for (const row of rows) {
          if (!row) continue;
          next.push({
            id: String(row.id || `${rule.id}:${next.length + 1}`),
            ruleId: rule.id,
            severity: normSeverity(row.severity || rule.defaultSeverity),
            title: String(row.title || rule.description || rule.id),
            message: String(row.message || ''),
            target: row.target ? clone(row.target) : null,
            meta: row.meta ? clone(row.meta) : null
          });
        }
      } catch (error) {
        runtime?.emit?.('runtime-error', { scope: `finding-rule:${rule.id}`, message: String(error?.message || error) });
      }
    }
    findings = next.sort((a, b) => severities[b.severity].rank - severities[a.severity].rank);
    runtime?.emit?.('findings-updated', { count: findings.length, critical: findings.filter(x => x.severity === 'critical').length });
    return clone(findings);
  }

  function getFindings() { return clone(findings); }
  function clearFindings() { findings = []; return []; }

  const api = Object.freeze({
    version: VERSION,
    severities,
    registerRule,
    evaluate,
    getFindings,
    clearFindings,
    navigateTo
  });

  Object.defineProperty(window, 'GremlinA15Findings', {
    value: api,
    enumerable: false,
    configurable: false,
    writable: false
  });

  waitForRuntime().then(runtime => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Tiered findings and clickable navigation.',
      defaultEnabled: true,
      start: async () => runtime.emit('findings-engine-ready', { severities: Object.keys(severities) }),
      stop: async () => clearFindings()
    });
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
