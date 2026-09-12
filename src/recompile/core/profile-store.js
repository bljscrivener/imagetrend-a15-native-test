// Versioned local profile/settings store.
// Patient answers and free-text chart content are forbidden here.

const STORAGE_KEY = 'gremlin.a15.profile';
export const PROFILE_SCHEMA_VERSION = 1;

const DEFAULT_PROFILE = Object.freeze({
  schemaVersion: PROFILE_SCHEMA_VERSION,
  reconstructionEnabled: true,
  reconstructionDisclosureAccepted: false,
  severityLabels: {
    INFO: 'Info',
    WARN: 'Meh',
    CRITICAL: 'OH SHIT'
  },
  ui: {
    investigatorOutputHeightPx: 180,
    compactMode: true
  },
  featureFlags: {
    nativeActions: false,
    consistencyRules: false,
    protocolAssist: false,
    nativeAiResearch: false
  },
  trustedMappings: {}
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeMappings(mappings) {
  if (!mappings || typeof mappings !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(mappings)) {
    if (!value || typeof value !== 'object') continue;
    out[key] = {
      bindingPathEntryID: value.bindingPathEntryID || null,
      bindingPath: value.bindingPath || null,
      controlType: value.controlType || null,
      formID: value.formID || null,
      reportingStandard: value.reportingStandard || null,
      optionFingerprint: Array.isArray(value.optionFingerprint) ? value.optionFingerprint.slice(0, 200) : [],
      verifiedAt: value.verifiedAt || null,
      sourceVersion: value.sourceVersion || null
    };
  }
  return out;
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return clone(DEFAULT_PROFILE);
  const base = clone(DEFAULT_PROFILE);

  // Future migrations should be additive and explicit.
  if ((raw.schemaVersion || 0) <= 1) {
    base.reconstructionEnabled = raw.reconstructionEnabled !== false;
    base.reconstructionDisclosureAccepted = Boolean(raw.reconstructionDisclosureAccepted);
    base.severityLabels = { ...base.severityLabels, ...(raw.severityLabels || {}) };
    base.ui = { ...base.ui, ...(raw.ui || {}) };
    base.featureFlags = { ...base.featureFlags, ...(raw.featureFlags || {}) };
    base.trustedMappings = sanitizeMappings(raw.trustedMappings);
  }

  base.schemaVersion = PROFILE_SCHEMA_VERSION;
  return base;
}

export function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return migrate(raw);
  } catch {
    return clone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile) {
  const next = migrate(profile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function updateProfile(mutator) {
  const current = loadProfile();
  const draft = clone(current);
  const result = mutator(draft) || draft;
  return saveProfile(result);
}

export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY);
  return clone(DEFAULT_PROFILE);
}
