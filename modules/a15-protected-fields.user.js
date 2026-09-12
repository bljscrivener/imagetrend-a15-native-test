// ==UserScript==
// @name         Gremlin Logic A15 Protected Fields
// @namespace    local.imagetrend.a15native.protected
// @version      0.1.0
// @description  Central protected-field policy for A15 automation targets whose semantics are not yet validated.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'protected-fields';
  const VERSION = '0.1.0';
  const PROCEDURE_EQUIPMENT_SIZE = '14775b1d-c505-5161-b7c9-7c9ea3c56cc4';
  const policies = new Map([
    [PROCEDURE_EQUIPMENT_SIZE, {
      entryId: PROCEDURE_EQUIPMENT_SIZE,
      label: 'Size of Procedure Equipment',
      mode: 'quarantine',
      reason: 'ImageTrend currently exposes this as a numeric field. The old Adult/Pediatric categorical assumption is invalid and no numeric semantics have been validated yet.'
    }]
  ]);

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

  const clone = value => {
    try { return structuredClone(value); }
    catch { try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }
  };

  function keyFor(target = {}) {
    if (typeof target === 'string') return target;
    return String(target.entryId || target.BindingPathEntryID || '');
  }

  function check(target, value, { explicitOverride = false } = {}) {
    const policy = policies.get(keyFor(target));
    if (!policy) return { allowed: true, policy: null };
    if (policy.mode === 'quarantine') {
      if (explicitOverride && window.GremlinA15Runtime?.settings?.get?.('procedureEquipmentNumericSemanticsValidated', false)) {
        const numeric = Number(value);
        return Number.isFinite(numeric)
          ? { allowed: true, policy: clone(policy), reason: 'validated-numeric-override' }
          : { allowed: false, policy: clone(policy), reason: 'numeric-value-required' };
      }
      return { allowed: false, policy: clone(policy), reason: policy.reason };
    }
    return { allowed: true, policy: clone(policy) };
  }

  function registerPolicy(entryId, policy) {
    if (!entryId || !policy || typeof policy !== 'object') throw new Error('entryId and policy are required.');
    policies.set(String(entryId), { entryId: String(entryId), ...clone(policy) });
    return true;
  }

  const api = Object.freeze({
    version: VERSION,
    procedureEquipmentSizeEntryId: PROCEDURE_EQUIPMENT_SIZE,
    check,
    registerPolicy,
    list: () => [...policies.values()].map(clone)
  });

  Object.defineProperty(window, 'GremlinA15ProtectedFields', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Central quarantine for unvalidated automation targets such as numeric procedure equipment size.',
      defaultEnabled: true,
      start: async () => runtime.emit('protected-fields-ready', { count: policies.size }),
      stop: async () => {}
    });
    runtime.registerCapability('gremlin.protectedFields', () => ({ available: true, policies: policies.size }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
