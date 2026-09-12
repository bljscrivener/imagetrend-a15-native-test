// ==UserScript==
// @name         Gremlin Logic A15 Model Bridge
// @namespace    local.imagetrend.a15native.bridge
// @version      0.1.2
// @description  Fail-closed live ImageTrend field resolver and explicit write bridge for A15 modules.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'model-bridge';
  const VERSION = '0.1.2';
  const knownFields = new Map();
  const norm = v => (v == null ? '' : String(v)).trim();
  const unwrap = v => { try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); } catch { return undefined; } };
  const clone = v => { try { return structuredClone(v); } catch { try { return JSON.parse(JSON.stringify(v)); } catch { return v; } } };

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

  function contextFor(el) { try { return window.ko?.contextFor?.(el) || null; } catch { return null; } }

  function getMeta(el) {
    let node = el;
    for (let depth = 0; node && depth < 12; depth++, node = node.parentElement) {
      const d = contextFor(node)?.$data;
      const entryId = unwrap(d?.BindingPathEntryID) || node.getAttribute?.('BindingPathEntryID') || node.getAttribute?.('bindingpathentryid') || null;
      const bindingPath = unwrap(d?.BindingPath) || node.getAttribute?.('BindingPath') || node.getAttribute?.('bindingpath') || null;
      const controlId = unwrap(d?.ControlID) ?? node.getAttribute?.('ControlID') ?? node.getAttribute?.('controlid') ?? null;
      if (!entryId && !bindingPath && controlId == null) continue;
      return {
        element: node,
        entryId: entryId || null,
        bindingPath: bindingPath || null,
        controlId: controlId == null ? null : controlId,
        formId: unwrap(d?.FormID) || null,
        label: unwrap(d?.Label) || null,
        controlType: unwrap(d?.ControlType) || null,
        context: contextFor(node)
      };
    }
    return null;
  }

  function allFieldMetas() {
    const root = document.querySelector('#form-composer') || document;
    const out = [], seen = new Set();
    for (const el of root.querySelectorAll('[data-bind],[BindingPathEntryID],[bindingpathentryid],[ControlID],[controlid],kosingleselect,komultiselect,input,textarea,select,.interceptor')) {
      const m = getMeta(el);
      if (!m) continue;
      const key = `${m.entryId || ''}|${m.controlId ?? ''}|${m.bindingPath || ''}`;
      if (!key.replace(/\|/g, '') || seen.has(key)) continue;
      seen.add(key); out.push(m);
    }
    return out;
  }

  function score(meta, target = {}) {
    let s = 0;
    if (target.entryId && norm(meta.entryId) === norm(target.entryId)) s += 100;
    if (target.controlId != null && norm(meta.controlId) === norm(target.controlId)) s += 80;
    if (target.bindingPath && norm(meta.bindingPath) === norm(target.bindingPath)) s += 70;
    if (target.label && norm(meta.label).toLowerCase() === norm(target.label).toLowerCase()) s += 60;
    if (target.labelIncludes && norm(meta.label).toLowerCase().includes(norm(target.labelIncludes).toLowerCase())) s += 30;
    if (target.controlType && norm(meta.controlType).toLowerCase() === norm(target.controlType).toLowerCase()) s += 10;
    return s;
  }

  function resolve(target = {}) {
    if (typeof target === 'string') target = knownFields.get(target) || { label: target };
    const candidates = allFieldMetas().map(m => ({ m, s: score(m, target) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    if (!candidates.length) return null;
    if (candidates.length > 1 && candidates[0].s === candidates[1].s && candidates[0].s < 100) return null;
    return candidates[0].m;
  }

  function inputOf(meta) {
    if (!meta?.element) return null;
    if (meta.element.matches?.('input,textarea,select,kosingleselect,komultiselect')) return meta.element;
    return meta.element.querySelector?.('input,textarea,select,kosingleselect,komultiselect,[contenteditable="true"]') || meta.element;
  }

  function nativeSet(el, value) {
    if (!el) return false;
    if (el instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, value);
    } else if (el instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(el, value);
    } else if (el instanceof HTMLSelectElement) {
      el.value = value;
    } else if (el.isContentEditable) {
      el.textContent = value;
    } else {
      return false;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  function readDisplay(meta) {
    const el = inputOf(meta);
    if (!el) return null;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return norm(el.value);
    const selected = meta.element.querySelector?.('.koSingleselect-selectedItem,.selected-item,[aria-selected="true"]');
    return norm(selected?.textContent || meta.element.textContent);
  }

  function resourcesFromContext(meta) {
    const contexts = [];
    let node = meta?.element;
    for (let i = 0; node && i < 8; i++, node = node.parentElement) {
      const ctx = contextFor(node);
      if (ctx?.$data && !contexts.includes(ctx.$data)) contexts.push(ctx.$data);
    }
    const arrays = [];
    for (const d of contexts) {
      for (const k of ['allResources','filteredResources','filteredScrollResources','resources','Resources','items','options']) {
        const v = unwrap(d?.[k]);
        if (Array.isArray(v) && v.length) arrays.push({ data: d, key: k, values: v });
      }
    }
    return { contexts, arrays };
  }

  function optionLabel(item) {
    item = unwrap(item);
    if (item == null) return '';
    if (typeof item !== 'object') return norm(item);
    for (const k of ['Value','Label','Text','Name','DisplayName','Description','Title']) {
      const v = unwrap(item[k]);
      if (v != null && norm(v)) return norm(v);
    }
    return '';
  }

  function findOption(meta, wanted, { fuzzy = false } = {}) {
    const names = (Array.isArray(wanted) ? wanted : [wanted]).map(x => norm(x).toLowerCase()).filter(Boolean);
    const { contexts, arrays } = resourcesFromContext(meta);
    for (const source of arrays) {
      const exact = source.values.find(x => names.includes(optionLabel(x).toLowerCase()));
      if (exact) return { item: exact, owner: source.data, source: source.key };
    }
    if (fuzzy) {
      for (const source of arrays) {
        const match = source.values.find(x => names.some(n => optionLabel(x).toLowerCase().includes(n) || n.includes(optionLabel(x).toLowerCase())));
        if (match) return { item: match, owner: source.data, source: source.key };
      }
    }
    for (const d of contexts) {
      const list = unwrap(d?.allResources);
      if (!Array.isArray(list)) continue;
      const match = list.find(x => names.includes(optionLabel(x).toLowerCase()));
      if (match) return { item: match, owner: d, source: 'allResources' };
    }
    return null;
  }

  function safetyCheck(scope) {
    const safety = window.GremlinA15Safety;
    if (!safety?.canMutate) return { ok: false, reason: 'safety-module-unavailable' };
    const gate = safety.canMutate();
    if (!gate.ok) window.GremlinA15Runtime?.emit?.('write-blocked', { scope, reason: gate.reason });
    return gate;
  }

  function protectionCheck(meta, proposedValue) {
    const protectedFields = window.GremlinA15ProtectedFields;
    if (!protectedFields?.check) return { allowed: false, reason: 'protected-field-policy-unavailable' };
    return protectedFields.check({ entryId: meta?.entryId, bindingPath: meta?.bindingPath, controlId: meta?.controlId }, proposedValue);
  }

  function recordOutcome(scope, result) {
    const safety = window.GremlinA15Safety;
    if (!safety) return;
    if (result?.ok) safety.recordSuccess?.(scope);
    else safety.recordFailure?.(scope, { reason: result?.reason || 'unknown' });
  }

  async function selectByLabel(target, labels, options = {}) {
    const gate = safetyCheck('selectByLabel');
    if (!gate.ok) return { ok: false, reason: gate.reason, blockedBySafety: true };

    const meta = resolve(target);
    if (!meta) {
      const out = { ok: false, reason: 'field-not-resolved' };
      recordOutcome('selectByLabel', out); return out;
    }
    const found = findOption(meta, labels, options);
    if (!found) {
      const out = { ok: false, reason: 'option-not-found', field: brief(meta) };
      recordOutcome('selectByLabel', out); return out;
    }
    const protection = protectionCheck(meta, optionLabel(found.item));
    if (!protection.allowed) {
      const out = { ok: false, reason: 'protected-field-quarantine', field: brief(meta), detail: protection.reason };
      recordOutcome('selectByLabel', out); return out;
    }

    const contexts = resourcesFromContext(meta).contexts;
    let invoked = false;
    for (const d of [found.owner, ...contexts]) {
      if (typeof d?.selectItem === 'function') {
        try { d.selectItem(found.item); invoked = true; break; } catch {}
      }
      if (typeof d?.selectedItem === 'function') {
        try { d.selectedItem(found.item); invoked = true; break; } catch {}
      }
    }
    if (!invoked) {
      const host = inputOf(meta);
      if (host instanceof HTMLSelectElement) {
        const wanted = optionLabel(found.item);
        const opt = [...host.options].find(o => norm(o.textContent).toLowerCase() === wanted.toLowerCase());
        if (opt) { nativeSet(host, opt.value); invoked = true; }
      }
    }
    if (!invoked) {
      const out = { ok: false, reason: 'selection-function-unavailable', field: brief(meta) };
      recordOutcome('selectByLabel', out); return out;
    }
    await new Promise(r => setTimeout(r, 80));
    const selectedLabel = optionLabel(found.item);
    const displayed = readDisplay(meta);
    const ok = !displayed || displayed.toLowerCase().includes(selectedLabel.toLowerCase()) || selectedLabel.toLowerCase().includes(displayed.toLowerCase());
    const out = { ok, reason: ok ? null : 'verification-failed', field: brief(meta), selectedLabel, displayed };
    recordOutcome('selectByLabel', out); return out;
  }

  async function setValue(target, value, { verify = true } = {}) {
    const gate = safetyCheck('setValue');
    if (!gate.ok) return { ok: false, reason: gate.reason, blockedBySafety: true };

    const meta = resolve(target);
    if (!meta) {
      const out = { ok: false, reason: 'field-not-resolved' };
      recordOutcome('setValue', out); return out;
    }
    const protection = protectionCheck(meta, value);
    if (!protection.allowed) {
      const out = { ok: false, reason: 'protected-field-quarantine', field: brief(meta), detail: protection.reason };
      recordOutcome('setValue', out); return out;
    }
    const el = inputOf(meta);
    if (!nativeSet(el, value)) {
      const out = { ok: false, reason: 'unsupported-control', field: brief(meta) };
      recordOutcome('setValue', out); return out;
    }
    await new Promise(r => setTimeout(r, 60));
    const displayed = readDisplay(meta);
    const ok = !verify || norm(displayed) === norm(value);
    const out = { ok, reason: ok ? null : 'verification-failed', field: brief(meta), displayed };
    recordOutcome('setValue', out); return out;
  }

  function brief(meta) {
    return meta ? { entryId: meta.entryId || null, bindingPath: meta.bindingPath || null, controlId: meta.controlId ?? null, formId: meta.formId || null, label: meta.label || null, controlType: meta.controlType || null } : null;
  }

  function registerField(id, descriptor) {
    if (!id || !descriptor) throw new Error('Field id and descriptor are required.');
    knownFields.set(String(id), clone(descriptor));
    return String(id);
  }

  const api = Object.freeze({
    version: VERSION,
    registerField,
    knownFields: () => Object.fromEntries([...knownFields.entries()].map(([k, v]) => [k, clone(v)])),
    resolve: target => brief(resolve(target)),
    resolveElement: target => resolve(target)?.element || null,
    read(target) { const m = resolve(target); return m ? readDisplay(m) : null; },
    setValue,
    selectByLabel,
    findOption(target, labels, options) { const m = resolve(target); if (!m) return null; const f = findOption(m, labels, options); return f ? { label: optionLabel(f.item), source: f.source } : null; },
    allFields: () => allFieldMetas().map(brief)
  });

  Object.defineProperty(window, 'GremlinA15Bridge', { value: api, enumerable: false, configurable: false, writable: false });

  waitForRuntime().then(runtime => {
    runtime.registerModule({ id: MODULE_ID, version: VERSION, description: 'Live field resolver and explicit, verified write bridge. Values are never persisted by this module.', defaultEnabled: true, start: async () => runtime.emit('model-bridge-ready', {}), stop: async () => {} });
    runtime.registerCapability('gremlin.modelBridge', () => ({ available: true, visibleFields: allFieldMetas().length, safetyGuard: !!window.GremlinA15Safety, protectedFieldPolicy: !!window.GremlinA15ProtectedFields }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
