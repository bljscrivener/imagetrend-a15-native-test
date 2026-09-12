// Gremlin Logic A15 — native-first recompile foundation
// Intentionally non-mutating. This layer discovers capabilities and enforces trust/context gates.

export const RUNTIME_VERSION = '0.1.0-foundation';

export const DiscoveryLayer = Object.freeze({
  NATIVE_MODEL: 'native-model',
  KNOCKOUT: 'knockout',
  DOM: 'dom',
  FALLBACK: 'monkey-fallback'
});

export const CapabilityState = Object.freeze({
  READY: 'READY',
  DISCOVERED: 'DISCOVERED',
  REVIEW: 'REVIEW',
  BLOCKED: 'BLOCKED',
  UNAVAILABLE: 'UNAVAILABLE'
});

function unwrap(value) {
  try {
    if (window.ko?.unwrap) return window.ko.unwrap(value);
    return typeof value === 'function' ? value() : value;
  } catch {
    return undefined;
  }
}

function stableString(value) {
  return value == null ? '' : String(value).trim();
}

export function currentImageTrendContext() {
  const composer = document.querySelector('#form-composer');
  let vm = null;
  try { vm = composer && window.ko?.dataFor?.(composer); } catch {}

  const reportingStandard = (() => {
    try { return unwrap(vm?.getReportingStandardID?.()); } catch { return null; }
  })();

  const incidentType = (() => {
    try { return unwrap(vm?.getIncidentTypeID?.()); } catch { return null; }
  })();

  const route = location.pathname;
  const agencyMatch = route.match(/\/RunForm\/Agency([^/]+)\//i);

  return Object.freeze({
    host: location.host,
    organization: route.match(/\/Organization([^/]+)\//i)?.[1] || null,
    agency: agencyMatch?.[1] || null,
    route,
    reportingStandard: reportingStandard ?? null,
    incidentType: incidentType ?? null,
    formHierarchyCollectionID: stableString(unwrap(vm?.currentModelObject?.Incident?.FormHierarchyCollectionID)) || null,
    dataLayerType: stableString(unwrap(vm?.dataLayerType)) || null,
    readOnly: Boolean(unwrap(vm?.currentIncidentReadOnlyStatus)),
    offline: Boolean(unwrap(vm?.isNetworkOffline) || unwrap(vm?.isOffline)),
    loaded: Boolean(unwrap(vm?.finishedLoading)),
    saving: Boolean(unwrap(vm?.isSaving))
  });
}

export function contextKey(ctx = currentImageTrendContext()) {
  return [
    ctx.host,
    ctx.organization,
    ctx.agency,
    ctx.formHierarchyCollectionID,
    ctx.reportingStandard,
    ctx.incidentType
  ].map(stableString).join('|');
}

export function mutationGate(ctx = currentImageTrendContext()) {
  const reasons = [];
  if (!ctx.loaded) reasons.push('run-form-not-loaded');
  if (ctx.readOnly) reasons.push('chart-read-only');
  if (ctx.saving) reasons.push('chart-saving');
  if (!ctx.host || !/imagetrendelite\.com$/i.test(ctx.host)) reasons.push('unexpected-host');
  if (!ctx.route.includes('/RunForm/')) reasons.push('unexpected-route');

  return Object.freeze({
    allowed: reasons.length === 0,
    reasons
  });
}

function nativeVm() {
  const node = document.querySelector('#form-composer') || document.body;
  try { return window.ko?.dataFor?.(node) || window.ko?.contextFor?.(node)?.$data || null; }
  catch { return null; }
}

export function discoverNativeActions() {
  const vm = nativeVm();
  if (!vm) return [];

  const names = [
    'navigateToSpecifiedPanel',
    'clickSpecifiedControl',
    'clickElement',
    'openGrid',
    'navigateToPanelWhereRuleIsFlagged',
    'closeAllOpenMenusAndFlyouts'
  ];

  return names.map(name => ({
    name,
    available: typeof vm?.[name] === 'function',
    layer: DiscoveryLayer.NATIVE_MODEL
  }));
}

export function capabilitySnapshot() {
  const ctx = currentImageTrendContext();
  return Object.freeze({
    runtimeVersion: RUNTIME_VERSION,
    capturedAt: new Date().toISOString(),
    context: ctx,
    contextKey: contextKey(ctx),
    gate: mutationGate(ctx),
    nativeActions: discoverNativeActions(),
    knockoutAvailable: Boolean(window.ko),
    formComposerAvailable: Boolean(window.imagetrend?.formComposer)
  });
}
