// ==UserScript==
// @name         Gremlin Logic A15 Clinical Logic
// @namespace    local.imagetrend.a15native.clinical
// @version      0.1.0
// @description  Explicit saline-flush helper and generic IV/IO medication-route consistency checks for A15.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'clinical-logic';
  const VERSION = '0.1.0';
  const ROUTE_FIELD = {
    entryId: '3cf58b90-40f9-5a3d-b0db-c4036ef18542',
    bindingPath: 'Incident.Scene.Response.Patient.Medications[].MedicationAdministeredRouteModValue.AdministeredRoute',
    label: 'Medication Administered Route'
  };
  const DOSE_FIELD = {
    entryId: '7db5b43a-f4e4-534a-9558-89f62d40f0bd',
    bindingPath: 'Incident.Scene.Response.Patient.Medications[].MedicationDosageModValue.Dosage',
    label: 'Medication Dosage'
  };
  const UNIT_FIELD = {
    entryId: 'eaf4b842-017d-59f7-a657-78a984b4c3c4',
    bindingPath: 'Incident.Scene.Response.Patient.Medications[].MedicationDosageUnitModValue.DosageUnit',
    label: 'Medication Dosage Units'
  };

  let timer = null;

  function waitForDeps(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (window.GremlinA15Runtime && window.GremlinA15Bridge && window.GremlinA15Findings) {
          return resolve({ runtime: window.GremlinA15Runtime, bridge: window.GremlinA15Bridge, findings: window.GremlinA15Findings });
        }
        if (Date.now() - start > timeoutMs) return reject(new Error('A15 clinical dependencies not found.'));
        setTimeout(tick, 250);
      };
      tick();
    });
  }

  const norm = v => (v == null ? '' : String(v)).trim();
  const lower = v => norm(v).toLowerCase();

  function routeKind(value) {
    const s = lower(value);
    if (!s) return null;
    if (/intraosseous|\bio\b/.test(s)) return 'IO';
    if (/intravenous|\biv\b|central line|portacath/.test(s)) return 'IV';
    return null;
  }

  function collectAccessEvidence(bridge) {
    const hits = [];
    for (const f of bridge.allFields()) {
      const label = lower(f.label);
      if (!label || !/(vascular|access|intravenous|intraosseous|\biv\b|\bio\b)/i.test(label)) continue;
      const value = bridge.read(f.entryId ? { entryId: f.entryId } : f.bindingPath ? { bindingPath: f.bindingPath } : { controlId: f.controlId });
      const kind = routeKind(`${f.label || ''} ${value || ''}`);
      if (kind) hits.push({ kind, label: f.label || null });
    }
    const kinds = [...new Set(hits.map(h => h.kind))];
    return { kinds, hits };
  }

  function currentMedicationRoute(bridge) {
    return routeKind(bridge.read(ROUTE_FIELD));
  }

  async function prepareSalineFlush({ route, doseMl, medicationLabels, confirm = true } = {}) {
    const bridge = window.GremlinA15Bridge;
    const runtime = window.GremlinA15Runtime;
    if (!bridge || !runtime) return { ok: false, reason: 'dependencies-unavailable' };

    const kind = String(route || '').toUpperCase();
    if (!['IV', 'IO'].includes(kind)) return { ok: false, reason: 'route-must-be-IV-or-IO' };
    const dose = Number(doseMl);
    if (!Number.isFinite(dose) || dose <= 0 || dose > 100) return { ok: false, reason: 'dose-must-be-a-positive-ml-value-at-or-below-100' };

    const visibleRoute = bridge.resolve(ROUTE_FIELD);
    const visibleDose = bridge.resolve(DOSE_FIELD);
    const visibleUnit = bridge.resolve(UNIT_FIELD);
    const visibleMedication = bridge.resolve({ label: 'Medication Given' });
    if (!visibleRoute || !visibleDose || !visibleUnit || !visibleMedication) {
      return { ok: false, reason: 'medication-editor-not-open-or-fields-unmapped', missing: {
        route: !visibleRoute,
        dose: !visibleDose,
        unit: !visibleUnit,
        medication: !visibleMedication
      } };
    }

    if (confirm && typeof window.confirm === 'function') {
      const yes = window.confirm(`Prepare a ${dose} mL normal-saline flush documented by the ${kind} route?\n\nA15 will only fill the visible medication editor. Review all fields before saving the medication.`);
      if (!yes) return { ok: false, reason: 'cancelled' };
    }

    const labels = medicationLabels || ['Normal Saline Flush', 'Saline Flush', '0.9% Sodium Chloride', 'Sodium Chloride 0.9%', 'Normal Saline'];
    const result = { ok: false, route: null, dose: null, units: null, medication: null, fallbackOther: null };

    result.route = await bridge.selectByLabel(ROUTE_FIELD, kind === 'IO' ? ['Intraosseous (IO)'] : ['Intravenous (IV)', 'IV Push'], { fuzzy: false });
    if (!result.route.ok) return { ...result, reason: 'route-selection-failed' };

    result.dose = await bridge.setValue(DOSE_FIELD, String(dose));
    if (!result.dose.ok) return { ...result, reason: 'dose-write-failed' };

    result.units = await bridge.selectByLabel(UNIT_FIELD, ['Milliliters (ml)', 'Milliliters'], { fuzzy: true });
    if (!result.units.ok) return { ...result, reason: 'unit-selection-failed' };

    result.medication = await bridge.selectByLabel({ label: 'Medication Given' }, labels, { fuzzy: true });
    if (!result.medication.ok) {
      const other = await bridge.selectByLabel({ label: 'Medication Given' }, ['Other', 'Other/miscellaneous'], { fuzzy: true });
      if (!other.ok) return { ...result, reason: 'saline-medication-option-not-found' };
      const otherName = bridge.resolve({ label: 'Other Medication Name' });
      if (!otherName) return { ...result, reason: 'other-medication-name-field-unavailable' };
      result.fallbackOther = await bridge.setValue({ label: 'Other Medication Name' }, 'Normal Saline Flush');
      if (!result.fallbackOther.ok) return { ...result, reason: 'other-medication-name-write-failed' };
      result.medication = other;
    }

    result.ok = true;
    runtime.emit('saline-flush-prepared', { route: kind, doseMl: dose, usedOtherMedicationFallback: !!result.fallbackOther });
    return result;
  }

  function registerRules(findings, bridge) {
    findings.registerRule({
      id: 'medication-route-vs-access',
      description: 'Medication route does not agree with the documented vascular access route.',
      defaultSeverity: 'warning',
      evaluate() {
        const medRoute = currentMedicationRoute(bridge);
        if (!medRoute) return null;
        const access = collectAccessEvidence(bridge);
        // Multiple routes can coexist. Only flag when the available evidence points to exactly one route.
        if (access.kinds.length !== 1 || access.kinds[0] === medRoute) return null;
        const documented = access.kinds[0];
        return {
          id: `med-route-mismatch:${documented}:${medRoute}`,
          severity: 'warning',
          title: `${medRoute} medication on ${documented} access?`,
          message: `The visible medication is documented as ${medRoute}, while the visible vascular-access evidence indicates ${documented}. Verify the route; IV and IO are intentionally treated as different routes.`,
          target: ROUTE_FIELD,
          meta: { medicationRoute: medRoute, documentedAccessRoute: documented, evidenceCount: access.hits.length }
        };
      }
    });
  }

  function scheduleEvaluate(delay = 700) {
    clearTimeout(timer);
    timer = setTimeout(() => window.GremlinA15Findings?.evaluate?.({ source: MODULE_ID }), delay);
  }

  const api = Object.freeze({
    version: VERSION,
    routeKind,
    prepareSalineFlush,
    inspectRouteConsistency() {
      const bridge = window.GremlinA15Bridge;
      if (!bridge) return null;
      return { medicationRoute: currentMedicationRoute(bridge), access: collectAccessEvidence(bridge) };
    },
    evaluateNow: () => window.GremlinA15Findings?.evaluate?.({ source: MODULE_ID })
  });

  Object.defineProperty(window, 'GremlinA15Clinical', { value: api, enumerable: false, configurable: false, writable: false });

  waitForDeps().then(({ runtime, bridge, findings }) => {
    bridge.registerField('medication.route', ROUTE_FIELD);
    bridge.registerField('medication.dose', DOSE_FIELD);
    bridge.registerField('medication.units', UNIT_FIELD);
    registerRules(findings, bridge);

    runtime.registerModule({
      id: MODULE_ID,
      version: VERSION,
      description: 'Medication-route consistency rules and explicit saline-flush helper.',
      defaultEnabled: true,
      start: async () => {
        window.addEventListener('change', scheduleEvaluate, true);
        window.addEventListener('gremlin:a15:reconstruction-updated', scheduleEvaluate);
        scheduleEvaluate(1200);
      },
      stop: async () => {
        clearTimeout(timer);
        window.removeEventListener('change', scheduleEvaluate, true);
        window.removeEventListener('gremlin:a15:reconstruction-updated', scheduleEvaluate);
      }
    });
    runtime.registerCapability('gremlin.salineFlush', () => ({
      available: !!bridge.resolve(ROUTE_FIELD) && !!bridge.resolve(DOSE_FIELD) && !!bridge.resolve(UNIT_FIELD) && !!bridge.resolve({ label: 'Medication Given' }),
      requiresOpenMedicationEditor: true,
      writesOnlyAfterExplicitCall: true
    }));
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
