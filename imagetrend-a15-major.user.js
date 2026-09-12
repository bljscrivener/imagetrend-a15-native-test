// ==UserScript==
// @name         Gremlin Logic A15 Major
// @namespace    local.imagetrend.a15major
// @version      0.3.0-alpha.1
// @description  Gremlin Logic A15 major runtime layer: persistent profiles, low-noise reconstruction, capability registry, linked findings, and native ImageTrend AI adapter.
// @match        https://*.imagetrendelite.com/Elite/*
// @require      https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-major-0.3/imagetrend-a15-native-test.user.js
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-major-0.3/imagetrend-a15-major.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/a15-major-0.3/imagetrend-a15-major.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.3.0-alpha.1';
  const PROFILE_KEY = 'gl-a15-profile';
  const MAP_KEY = 'gl-a15-capability-map';
  const HOST_ID = 'gl-a15-major-layer';
  const ROUTE_RE = /^\/Elite\/.+\/(?:Offline)?EmsRunForm(?:\/|$)/i;

  if (!ROUTE_RE.test(location.pathname)) return;
  if (document.getElementById(HOST_ID)) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const unwrap = value => {
    try {
      if (window.ko?.unwrap) return window.ko.unwrap(value);
      return typeof value === 'function' ? value() : value;
    } catch (_) { return undefined; }
  };
  const norm = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const visible = el => !!el && el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';

  const PROFILE_DEFAULTS = Object.freeze({
    schema: 1,
    reconstructionEnabled: true,
    reconstructionDisclosureAccepted: false,
    diagnosticsEnabled: false,
    nativeAiAdapterEnabled: true,
    findingSeverities: { info: true, warning: true, critical: true },
    featureFlags: {
      capabilityRegistry: true,
      linkedFindings: true,
      nativeAiAdapter: true,
      clinicalConsistencyRules: false
    }
  });

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(PROFILE_DEFAULTS));
  }

  function migrateProfile(raw) {
    const base = cloneDefaults();
    if (!raw || typeof raw !== 'object') return base;
    const schema = Number(raw.schema || 0);
    if (schema <= 1) {
      return {
        ...base,
        ...raw,
        schema: 1,
        findingSeverities: { ...base.findingSeverities, ...(raw.findingSeverities || {}) },
        featureFlags: { ...base.featureFlags, ...(raw.featureFlags || {}) }
      };
    }
    return base;
  }

  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      const migrated = migrateProfile(raw);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (_) {
      const fresh = cloneDefaults();
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(fresh)); } catch (_) {}
      return fresh;
    }
  }

  let profile = loadProfile();
  function saveProfile(patch) {
    profile = migrateProfile({ ...profile, ...patch });
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    dispatchEvent(new CustomEvent('gl-a15-profile-changed', { detail: profile }));
    renderSettings();
    return profile;
  }

  function rootVm() {
    const root = document.querySelector('#form-composer');
    if (!root || !window.ko) return null;
    try { return window.ko.dataFor(root) || window.ko.contextFor(root)?.$data || null; }
    catch (_) { return null; }
  }

  function readControlMeta(el) {
    if (!el || !window.ko) return null;
    let node = el;
    for (let depth = 0; node && depth < 10; depth++, node = node.parentElement) {
      try {
        const d = window.ko.contextFor(node)?.$data;
        const id = unwrap(d?.BindingPathEntryID);
        const path = unwrap(d?.BindingPath);
        const controlId = unwrap(d?.ControlID);
        if (id || path || controlId) {
          return {
            bindingPathEntryId: norm(id),
            bindingPath: norm(path),
            controlId: controlId == null ? '' : String(controlId),
            label: norm(unwrap(d?.Label)),
            controlType: norm(unwrap(d?.ControlType)),
            formId: norm(unwrap(d?.FormID))
          };
        }
      } catch (_) {}
    }
    return null;
  }

  function structuralControls() {
    const root = document.querySelector('#form-composer');
    if (!root) return [];
    const rows = [];
    const seen = new Set();
    const nodes = root.querySelectorAll('[id], input, textarea, select, kosingleselect, komultiselect, .interceptor');
    for (const node of nodes) {
      const meta = readControlMeta(node);
      if (!meta?.bindingPathEntryId && !meta?.bindingPath && !meta?.controlId) continue;
      const key = [meta.bindingPathEntryId, meta.bindingPath, meta.controlId].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(meta);
    }
    return rows.slice(0, 1500);
  }

  function nativeFunctionNames(vm) {
    if (!vm || typeof vm !== 'object') return [];
    const allow = /(?:navigate|open|click|save|validation|panel|control|grid|ai|assist|finish|transfer|cad|incident)/i;
    return Object.keys(vm).filter(k => allow.test(k) && typeof vm[k] === 'function').sort().slice(0, 300);
  }

  function aiCapabilities() {
    const auto = window.imagetrend?.formComposer?.controlHandlers?.autoNarrative;
    const vm = rootVm();
    const aiCaptureButton = [...document.querySelectorAll('button')].find(b => /openAIAssistModal/.test(b.getAttribute('data-bind') || ''));
    const narrative = document.getElementById('9b465bdd-e13d-511c-8ead-d9743ed82234') || document.getElementById('25140');
    let context = null;
    try { context = narrative && window.ko?.contextFor?.(narrative); } catch (_) {}
    return {
      captureActionBound: !!aiCaptureButton,
      captureActionExpression: aiCaptureButton?.getAttribute('data-bind') || '',
      generateHandlerPresent: typeof auto?.clickAiGenerateValues === 'function',
      showPredicatePresent: typeof auto?.showAiGenerateValuesButton === 'function',
      disablePredicatePresent: typeof auto?.disableAiGenerateValuesButton === 'function',
      narrativeContextPresent: !!context,
      vmAiNames: vm ? Object.keys(vm).filter(k => /ai|assist/i.test(k)).sort() : []
    };
  }

  function mapFingerprint(map) {
    const text = JSON.stringify({ controls: map.controls, functions: map.functions, ai: map.ai });
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  let currentMap = null;
  let mapTimer = null;
  let lastMapAt = 0;

  function persistMap(map) {
    if (!profile.reconstructionEnabled) return;
    try {
      const previous = JSON.parse(localStorage.getItem(MAP_KEY) || 'null');
      const next = {
        schema: 1,
        a15Version: VERSION,
        capturedAt: new Date().toISOString(),
        route: location.pathname,
        fingerprint: mapFingerprint(map),
        controls: map.controls,
        functions: map.functions,
        ai: map.ai
      };
      if (previous?.fingerprint === next.fingerprint) {
        previous.lastSeenAt = next.capturedAt;
        previous.a15Version = VERSION;
        localStorage.setItem(MAP_KEY, JSON.stringify(previous));
        currentMap = previous;
      } else {
        next.previousFingerprint = previous?.fingerprint || null;
        localStorage.setItem(MAP_KEY, JSON.stringify(next));
        currentMap = next;
        dispatchEvent(new CustomEvent('gl-a15-capability-drift', { detail: next }));
      }
    } catch (_) {}
  }

  function reconstructNow(reason = 'manual') {
    if (!profile.reconstructionEnabled || !profile.featureFlags.capabilityRegistry) return null;
    const vm = rootVm();
    const map = {
      reason,
      controls: structuralControls(),
      functions: nativeFunctionNames(vm),
      ai: aiCapabilities()
    };
    persistMap(map);
    lastMapAt = Date.now();
    renderDiagnostics();
    return currentMap;
  }

  function scheduleReconstruction(reason = 'dom-change') {
    if (!profile.reconstructionEnabled || !profile.featureFlags.capabilityRegistry) return;
    clearTimeout(mapTimer);
    mapTimer = setTimeout(() => {
      if (Date.now() - lastMapAt < 2500) return;
      if ('requestIdleCallback' in window) requestIdleCallback(() => reconstructNow(reason), { timeout: 1500 });
      else reconstructNow(reason);
    }, 900);
  }

  const findings = [];
  const severityRank = { info: 1, warning: 2, critical: 3 };

  function addFinding(finding) {
    if (!finding?.id || !finding?.message) return;
    const severity = finding.severity || 'warning';
    if (!profile.findingSeverities[severity]) return;
    const i = findings.findIndex(x => x.id === finding.id);
    const normalized = { ...finding, severity, updatedAt: new Date().toISOString() };
    if (i >= 0) findings[i] = normalized; else findings.push(normalized);
    findings.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
    renderFindings();
  }

  function removeFinding(id) {
    const i = findings.findIndex(x => x.id === id);
    if (i >= 0) findings.splice(i, 1);
    renderFindings();
  }

  function openMappedField(bindingPathEntryId) {
    if (!bindingPathEntryId) return false;
    const candidates = [...document.querySelectorAll(`[id="${CSS.escape(bindingPathEntryId)}"]`)];
    const target = candidates.find(visible) || candidates[0];
    if (!target) return false;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const oldOutline = target.style.outline;
    target.style.outline = '3px solid #e0aa24';
    setTimeout(() => { if (target.isConnected) target.style.outline = oldOutline; }, 3500);
    target.querySelector('input,textarea,select,button')?.focus?.();
    return true;
  }

  const ruleRegistry = new Map();
  function registerRule(rule) {
    if (!rule?.id || typeof rule.evaluate !== 'function') throw new Error('Invalid A15 rule.');
    ruleRegistry.set(rule.id, rule);
  }

  async function runRules(trigger = 'manual') {
    if (!profile.featureFlags.linkedFindings) return [];
    for (const rule of ruleRegistry.values()) {
      if (rule.featureFlag && !profile.featureFlags[rule.featureFlag]) continue;
      try {
        const result = await rule.evaluate({ trigger, rootVm: rootVm(), map: currentMap, profile });
        if (!result) removeFinding(rule.id);
        else addFinding({ id: rule.id, ...result });
      } catch (error) {
        addFinding({
          id: `rule-error:${rule.id}`,
          severity: 'info',
          message: `${rule.id} could not evaluate: ${error.message}`
        });
      }
    }
    return [...findings];
  }

  // Structural drift is deliberately generic: it catches a changed ImageTrend surface without
  // pretending a newly discovered control is itself a clinical error.
  registerRule({
    id: 'capability-drift',
    evaluate() {
      if (!currentMap?.previousFingerprint || currentMap.previousFingerprint === currentMap.fingerprint) return null;
      return {
        severity: 'info',
        message: 'ImageTrend structure changed since the previous A15 map. Reconstruction captured the new surface.',
        detail: `Map ${currentMap.previousFingerprint} → ${currentMap.fingerprint}`
      };
    }
  });

  // Clinical consistency rules intentionally remain feature-gated until their field ownership
  // and scoping semantics are verified against captured maps. This prevents a plausible-looking
  // rule from silently becoming a chart-writing heuristic.
  registerRule({
    id: 'iv-io-route-consistency',
    featureFlag: 'clinicalConsistencyRules',
    evaluate() {
      return null;
    }
  });

  function narrativeContext() {
    const node = document.getElementById('9b465bdd-e13d-511c-8ead-d9743ed82234') || document.getElementById('25140');
    if (!node || !window.ko) return null;
    try { return window.ko.contextFor(node); } catch (_) { return null; }
  }

  function nativeAiState() {
    const auto = window.imagetrend?.formComposer?.controlHandlers?.autoNarrative;
    const ctx = narrativeContext();
    if (!auto || !ctx) return { available: false, reason: 'Narrative AI context is not loaded.' };
    if (typeof auto.clickAiGenerateValues !== 'function') return { available: false, reason: 'ImageTrend AI generate handler was not found.' };
    let shown = true, disabled = false;
    try {
      if (typeof auto.showAiGenerateValuesButton === 'function') shown = !!unwrap(auto.showAiGenerateValuesButton());
      if (typeof auto.disableAiGenerateValuesButton === 'function') disabled = !!unwrap(auto.disableAiGenerateValuesButton(ctx));
    } catch (error) {
      return { available: false, reason: `ImageTrend AI predicates failed: ${error.message}` };
    }
    return { available: shown && !disabled, shown, disabled, auto, ctx, reason: shown ? (disabled ? 'ImageTrend currently reports AI Generate Values disabled.' : '') : 'ImageTrend currently reports AI Generate Values hidden.' };
  }

  async function invokeNativeAiGenerate() {
    if (!profile.nativeAiAdapterEnabled || !profile.featureFlags.nativeAiAdapter) throw new Error('Native AI adapter is disabled in A15 settings.');
    const state = nativeAiState();
    if (!state.available) throw new Error(state.reason || 'ImageTrend AI generation is not currently available.');
    // This intentionally uses ImageTrend's own handler and predicates. A15 does not bypass
    // disabled/read-only/offline gates, and does not inject an external model into the chart.
    state.auto.clickAiGenerateValues(state.ctx);
    await sleep(150);
    return true;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483645';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{font:13px system-ui;color:#243047}button,input{font:inherit}button{cursor:pointer}
      #badge{border:1px solid #864ca3;background:#fff;color:#58366b;border-radius:999px;padding:7px 10px;box-shadow:0 3px 12px #0003}
      #panel{width:360px;max-width:82vw;max-height:58vh;overflow:auto;background:#fff;border:2px solid #864ca3;border-radius:12px;padding:12px;box-shadow:0 8px 24px #0004}
      .top{display:flex;justify-content:space-between;gap:8px;align-items:center}.tabs{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.tabs button,.actions button{padding:6px 8px;border:1px solid #c7b2d2;background:#faf7fc;border-radius:6px}.pane[hidden]{display:none!important}
      .finding{border:1px solid #ddd;border-left-width:5px;border-radius:7px;padding:7px;margin:6px 0}.finding.info{border-left-color:#6b8eaa}.finding.warning{border-left-color:#e0aa24}.finding.critical{border-left-color:#b42318}.finding small{display:block;margin-top:3px;color:#667085}
      label{display:block;margin:8px 0}.notice{background:#f7f2fa;border:1px solid #dbcce4;border-radius:7px;padding:8px;line-height:1.35}.muted{color:#667085}.status{font-size:12px;margin:6px 0}.actions{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}code{font-size:11px}
    </style>
    <button id="badge">A15 · 0</button>
    <div id="panel" hidden>
      <div class="top"><strong>Gremlin Logic A15 ${VERSION}</strong><button id="close">×</button></div>
      <div class="tabs"><button data-tab="findings">Findings</button><button data-tab="ai">ImageTrend AI</button><button data-tab="settings">Help / Settings</button><button data-tab="diag">Diagnostics</button></div>
      <div class="pane" id="findings"><div id="finding-list" class="muted">No A15 findings.</div><div class="actions"><button id="run-rules">Run checks</button></div></div>
      <div class="pane" id="ai" hidden><div id="ai-state" class="status"></div><div class="actions"><button id="ai-probe">Refresh AI state</button><button id="ai-generate">Use native AI Generate Values</button></div><div class="notice">A15 uses ImageTrend's own AI handler when ImageTrend reports it available. It does not bypass ImageTrend's disabled/read-only/offline gates and does not send chart data to a separate A15 AI service.</div></div>
      <div class="pane" id="settings" hidden>
        <div class="notice"><strong>Low-noise reconstruction</strong><br>A15 records structural metadata needed to survive ImageTrend updates: control/binding identifiers, control types, native action names, and capability state. It does not record arbitrary keystrokes, passwords, narrative text, names, DOBs, addresses, or patient-entered scalar values as reconstruction telemetry.</div>
        <label><input type="checkbox" id="recon"> Enable resilient reconstruction <span class="muted">(recommended)</span></label>
        <label><input type="checkbox" id="ai-enabled"> Enable native ImageTrend AI adapter</label>
        <label><input type="checkbox" id="diag-enabled"> Enable diagnostics panel</label>
        <label><input type="checkbox" id="clinical-rules"> Enable experimental clinical consistency rules</label>
        <div class="actions"><button id="accept-disclosure">Acknowledge reconstruction disclosure</button><button id="reset-profile">Reset A15 profile</button></div>
        <small class="muted">Profile/settings are stored separately from the userscript so normal A15 updates do not erase them.</small>
      </div>
      <div class="pane" id="diag" hidden><div id="diag-state" class="status"></div><div class="actions"><button id="remap">Reconstruct now</button></div></div>
    </div>`;
  document.body.append(host);

  const $ = sel => shadow.querySelector(sel);
  function showTab(name) {
    for (const pane of shadow.querySelectorAll('.pane')) pane.hidden = pane.id !== name;
    if (name === 'ai') renderAi();
    if (name === 'diag') renderDiagnostics();
  }

  function renderFindings() {
    const list = $('#finding-list');
    $('#badge').textContent = `A15 · ${findings.length}`;
    if (!findings.length) {
      list.className = 'muted';
      list.textContent = 'No A15 findings.';
      return;
    }
    list.className = '';
    list.replaceChildren();
    for (const f of findings) {
      const row = document.createElement('div');
      row.className = `finding ${f.severity}`;
      const text = document.createElement('div');
      text.textContent = `${f.severity === 'critical' ? 'OH SHIT' : f.severity === 'warning' ? 'Warning' : 'Note'} — ${f.message}`;
      row.append(text);
      if (f.detail) { const detail = document.createElement('small'); detail.textContent = f.detail; row.append(detail); }
      if (f.bindingPathEntryId) {
        const open = document.createElement('button');
        open.textContent = 'Open field';
        open.onclick = () => { if (!openMappedField(f.bindingPathEntryId)) $('#diag-state').textContent = 'Mapped field is not currently rendered; navigate to its panel and retry.'; };
        row.append(open);
      }
      list.append(row);
    }
  }

  function renderSettings() {
    $('#recon').checked = !!profile.reconstructionEnabled;
    $('#ai-enabled').checked = !!profile.nativeAiAdapterEnabled;
    $('#diag-enabled').checked = !!profile.diagnosticsEnabled;
    $('#clinical-rules').checked = !!profile.featureFlags.clinicalConsistencyRules;
    $('#accept-disclosure').disabled = !!profile.reconstructionDisclosureAccepted;
    $('#accept-disclosure').textContent = profile.reconstructionDisclosureAccepted ? 'Disclosure acknowledged' : 'Acknowledge reconstruction disclosure';
    shadow.querySelector('[data-tab="diag"]').hidden = !profile.diagnosticsEnabled;
  }

  function renderDiagnostics() {
    const d = $('#diag-state');
    if (!d) return;
    let stored = currentMap;
    if (!stored) {
      try { stored = JSON.parse(localStorage.getItem(MAP_KEY) || 'null'); } catch (_) {}
    }
    d.textContent = stored
      ? `Map ${stored.fingerprint || 'unknown'} · ${stored.controls?.length || 0} controls · ${stored.functions?.length || 0} native actions · ${stored.capturedAt || stored.lastSeenAt || ''}`
      : 'No capability map captured yet.';
  }

  function renderAi() {
    const state = nativeAiState();
    $('#ai-state').textContent = state.available ? 'Native ImageTrend AI Generate Values is available through the mapped handler.' : (state.reason || 'Native AI unavailable.');
    $('#ai-generate').disabled = !state.available || !profile.nativeAiAdapterEnabled || !profile.featureFlags.nativeAiAdapter;
  }

  $('#badge').onclick = () => { $('#panel').hidden = false; $('#badge').hidden = true; renderSettings(); renderFindings(); };
  $('#close').onclick = () => { $('#panel').hidden = true; $('#badge').hidden = false; };
  for (const tab of shadow.querySelectorAll('[data-tab]')) tab.onclick = () => showTab(tab.dataset.tab);
  $('#run-rules').onclick = () => runRules('manual');
  $('#ai-probe').onclick = renderAi;
  $('#ai-generate').onclick = async () => {
    $('#ai-state').textContent = 'Calling ImageTrend native AI handler…';
    try { await invokeNativeAiGenerate(); $('#ai-state').textContent = 'ImageTrend native AI handler invoked. Review any generated values before saving.'; }
    catch (error) { $('#ai-state').textContent = error.message; }
    renderAi();
  };
  $('#recon').onchange = e => saveProfile({ reconstructionEnabled: e.target.checked });
  $('#ai-enabled').onchange = e => saveProfile({ nativeAiAdapterEnabled: e.target.checked });
  $('#diag-enabled').onchange = e => saveProfile({ diagnosticsEnabled: e.target.checked });
  $('#clinical-rules').onchange = e => saveProfile({ featureFlags: { ...profile.featureFlags, clinicalConsistencyRules: e.target.checked } });
  $('#accept-disclosure').onclick = () => saveProfile({ reconstructionDisclosureAccepted: true });
  $('#reset-profile').onclick = () => {
    profile = cloneDefaults();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    renderSettings();
  };
  $('#remap').onclick = () => reconstructNow('manual');

  const observer = new MutationObserver(records => {
    if (!profile.reconstructionEnabled) return;
    const structural = records.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (n.id === 'form-composer' || n.querySelector?.('#form-composer,[data-bind],[id]'))));
    if (structural) scheduleReconstruction('structural-dom-change');
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // No keydown/input listeners are installed. Reconstruction is structural and event-light.
  renderSettings();
  setTimeout(() => {
    reconstructNow('startup');
    runRules('startup');
    renderAi();
  }, 1200);

  window.GremlinA15Major = Object.freeze({
    version: VERSION,
    getProfile: () => JSON.parse(JSON.stringify(profile)),
    reconstructNow,
    runRules,
    registerRule,
    addFinding,
    removeFinding,
    nativeAiState,
    invokeNativeAiGenerate,
    openMappedField
  });
})();
