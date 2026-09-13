// ==UserScript==
// @name         Gremlin Logic A15 Medication Provider Repair
// @namespace    local.imagetrend.a15.medprovider
// @version      0.1.0
// @description  Guarded per-medication provider-certification repair for the A15 workflow.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if (window.GremlinA15MedicationRepair?.version) return;

  const VERSION = '0.1.0';
  const norm = value => String(value ?? '').replace(/[\u200b\u00ad]/g, '').replace(/\s+/g, ' ').trim();
  const unwrap = value => window.ko?.unwrap ? window.ko.unwrap(value) : (typeof value === 'function' ? value() : value);

  function resolve(root, path) {
    let node = root;
    for (const part of String(path || '').split('.')) {
      node = unwrap(node);
      if (node == null || !(part in Object(node))) throw new Error('Native field path unavailable: ' + path);
      node = node[part];
    }
    return node;
  }

  function chartRoot() {
    const ko = window.ko;
    const app = window.imagetrend;
    const form = document.querySelector('#form-composer');
    if (!ko?.contextFor || !app?.runForm?.PresetValueViewModel || !form) throw new Error('ImageTrend chart model unavailable.');
    const contexts = [form, ...form.querySelectorAll('[data-bind]')].map(n => ko.contextFor(n)).filter(Boolean);
    const owners = [...new Set(contexts.flatMap(c => [c.$root, c.$data, ...(c.$parents || [])]))].filter(Boolean);
    const roots = owners.filter(r => {
      try { return Array.isArray(unwrap(resolve(r, 'Incident.Scene.Response.Patient.Medications'))); }
      catch { return false; }
    });
    if (roots.length !== 1) throw new Error('Medication chart context is unavailable or ambiguous.');
    const states = owners.filter(o => 'currentIncidentReadOnlyStatus' in Object(o)).map(o => unwrap(o.currentIncidentReadOnlyStatus));
    if (!states.length || states.some(v => v !== false) || document.querySelector('#center-pane.locked,#left-pane.locked')) throw new Error('Chart is not confirmed editable.');
    return roots[0];
  }

  function learnedDefinitions() {
    const ko = window.ko;
    const out = [];
    if (!ko?.contextFor) return out;
    for (const node of document.querySelectorAll('[data-bind]')) {
      const ctx = ko.contextFor(node);
      for (const d of [ctx?.$data, ...(ctx?.$parents || [])]) {
        const id = unwrap(d?.BindingPathEntryID);
        const path = unwrap(d?.BindingPath) || unwrap(d?.BindingPathFromOrigin);
        if (!id || typeof path !== 'string' || !path.startsWith('Incident.')) continue;
        out.push({ BindingPathEntryID: id, BindingPathFromOrigin: path, ReportingStandardID: window.imagetrend?.formComposer?.reportingStandardID });
      }
    }
    return out;
  }

  function discoverField() {
    const app = window.imagetrend;
    const reportingStandardID = app?.formComposer?.reportingStandardID;
    const defs = [
      ...(app?.formComposer?.agencyPresetValues || []).flatMap(x => x?.PresetValues || []),
      ...learnedDefinitions()
    ];
    const unique = new Map();
    for (const d of defs) {
      const id = d?.BindingPathEntryID;
      const path = d?.BindingPathFromOrigin;
      if (!id || typeof path !== 'string') continue;
      if (!/^Incident\.Scene\.Response\.Patient\.Medications\[\]\./.test(path)) continue;
      if (!/(certification|licensurelevel|providertype|providerlevel|crewmemberlevel)/i.test(path)) continue;
      if (d.ReportingStandardID && reportingStandardID && d.ReportingStandardID !== reportingStandardID) continue;
      const resource = app.formComposer.agencyResources?.[String(id).toLowerCase()];
      const paramedic = (resource?.Elements || []).filter(e => norm(e?.Value) === 'Paramedic');
      if (paramedic.length !== 1) continue;
      unique.set(id + '|' + path, { id, path, code: String(paramedic[0].Id) });
    }
    const matches = [...unique.values()];
    if (matches.length === 0) throw new Error('Medication provider certification mapping is not loaded. Open one medication entry once, then run A15 again.');
    if (matches.length !== 1) throw new Error('Medication provider certification mapping is ambiguous; no medication metadata changed.');
    return matches[0];
  }

  function makeVm(root, mapping, index) {
    const path = mapping.path.replace('[]', '.' + index);
    return new window.imagetrend.runForm.PresetValueViewModel({
      BindingPathEntryID: mapping.id,
      BindingPathFromOrigin: path,
      ReportingStandardID: window.imagetrend.formComposer.reportingStandardID,
      IsMultiselect: false,
      IsInGrid: false,
      Value: mapping.code,
      IsNotValue: false,
      IsPertinentNegative: false
    }, root);
  }

  async function run({ confirm = false } = {}) {
    if (!confirm) throw new Error('Explicit confirmation required.');
    const root = chartRoot();
    const medications = unwrap(resolve(root, 'Incident.Scene.Response.Patient.Medications'));
    if (!Array.isArray(medications) || medications.length === 0) return { ok: true, changed: 0, kept: 0, issues: [], message: 'No medication entries.' };

    const mapping = discoverField();
    let changed = 0, kept = 0;
    const issues = [];

    for (let index = 0; index < medications.length; index++) {
      if (chartRoot() !== root) throw new Error('Chart changed during medication metadata repair.');
      const vm = makeVm(root, mapping, index);
      const current = norm(unwrap(vm.currentValueDisplay));
      const target = norm(unwrap(vm.presetValueDisplay));
      if (target !== 'Paramedic') throw new Error('Native medication provider option did not resolve to Paramedic.');
      if (current === target) { kept++; continue; }
      if (current && current !== 'Critical Care Paramedic') {
        issues.push({ index: index + 1, current, reason: 'Unexpected provider certification preserved.' });
        continue;
      }
      vm.applyPresetValue();
      let verified = false;
      for (let attempt = 0; attempt < 25; attempt++) {
        await new Promise(r => setTimeout(r, 80));
        const check = makeVm(root, mapping, index);
        if (norm(unwrap(check.currentValueDisplay)) === 'Paramedic') { verified = true; break; }
      }
      if (!verified) throw new Error('Medication ' + (index + 1) + ' provider certification write did not verify.');
      changed++;
    }

    const result = { ok: issues.length === 0, changed, kept, issues, mapping: { id: mapping.id, path: mapping.path }, target: 'Paramedic' };
    try { window.dispatchEvent(new CustomEvent('gremlin:a15:medication-provider-repair', { detail: result })); } catch {}
    return result;
  }

  Object.defineProperty(window, 'GremlinA15MedicationRepair', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: Object.freeze({ version: VERSION, discoverField, run })
  });
})();
