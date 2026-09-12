// Low-noise structural reconstruction. Never records chart answers, narrative text,
// measured values, signatures, credentials, or general keystrokes.

import { capabilitySnapshot, contextKey } from './runtime.js';
import { loadProfile, saveProfile } from './profile-store.js';

const MAX_OPTIONS = 200;

function unwrap(value) {
  try {
    if (window.ko?.unwrap) return window.ko.unwrap(value);
    return typeof value === 'function' ? value() : value;
  } catch { return undefined; }
}

function text(value) {
  return value == null ? '' : String(value).trim();
}

function controlFingerprint(data, el) {
  const optionLabels = [];
  try {
    const ctx = window.ko?.contextFor?.(el);
    const sourceCandidates = [ctx?.$data?.allResources, ctx?.$data?.filteredResources, ctx?.$parent?.Resources];
    for (const candidate of sourceCandidates) {
      const arr = unwrap(candidate);
      if (!Array.isArray(arr)) continue;
      for (const item of arr.slice(0, MAX_OPTIONS)) {
        const value = unwrap(item);
        const label = text(value?.Value ?? value?.Label ?? value?.Text ?? value?.Name);
        if (label) optionLabels.push(label);
      }
      if (optionLabels.length) break;
    }
  } catch {}

  return {
    bindingPathEntryID: text(unwrap(data?.BindingPathEntryID)) || null,
    bindingPath: text(unwrap(data?.BindingPath)) || null,
    controlID: text(unwrap(data?.ControlID)) || null,
    formID: text(unwrap(data?.FormID)) || null,
    controlType: text(unwrap(data?.ControlType)) || null,
    label: text(unwrap(data?.Label)) || null,
    tag: el?.tagName || null,
    classes: typeof el?.className === 'string' ? el.className : null,
    optionFingerprint: [...new Set(optionLabels)].sort().slice(0, MAX_OPTIONS)
  };
}

function isStructuralControl(data) {
  return Boolean(
    text(unwrap(data?.BindingPathEntryID)) ||
    text(unwrap(data?.BindingPath)) ||
    text(unwrap(data?.ControlID)) ||
    text(unwrap(data?.ControlType))
  );
}

export function scanStructuralCapabilities() {
  const root = document.querySelector('#form-composer');
  if (!root || !window.ko) return [];

  const seen = new Set();
  const capabilities = [];
  for (const el of root.querySelectorAll('[data-bind], input, textarea, select, kosingleselect, komultiselect, button')) {
    let data = null;
    try { data = window.ko?.contextFor?.(el)?.$data || null; } catch {}
    if (!data || !isStructuralControl(data)) continue;

    const fp = controlFingerprint(data, el);
    const key = [fp.bindingPathEntryID, fp.bindingPath, fp.controlID, fp.formID].filter(Boolean).join('|');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    capabilities.push(fp);
  }

  return capabilities;
}

export function reconstructCapabilities({ persist = true } = {}) {
  const profile = loadProfile();
  if (!profile.reconstructionEnabled) {
    return { enabled: false, persisted: false, reason: 'user-opted-out', capabilities: [] };
  }

  const snapshot = capabilitySnapshot();
  const key = contextKey(snapshot.context);
  const capabilities = scanStructuralCapabilities();
  const record = {
    schema: 1,
    observedAt: new Date().toISOString(),
    runtimeVersion: snapshot.runtimeVersion,
    context: {
      host: snapshot.context.host,
      organization: snapshot.context.organization,
      agency: snapshot.context.agency,
      reportingStandard: snapshot.context.reportingStandard,
      incidentType: snapshot.context.incidentType,
      formHierarchyCollectionID: snapshot.context.formHierarchyCollectionID
    },
    nativeActions: snapshot.nativeActions,
    capabilities
  };

  if (persist && key) {
    profile.trustedMappings = profile.trustedMappings || {};
    profile.trustedMappings[key] = record;
    saveProfile(profile);
  }

  return { enabled: true, persisted: Boolean(persist && key), key, record };
}

export const RECONSTRUCTION_DISCLOSURE =
  'Compatibility reconstruction observes ImageTrend structural metadata such as field identities, control types, option vocabularies, and native action availability. It does not record general keystrokes, narrative/free-text, credentials, patient answers, measured values, signatures, or other chart content. You may disable reconstruction, but doing so reduces the helper\'s ability to recover safely after ImageTrend changes.';
