// ==UserScript==
// @name         Gremlin Logic A15 Control Center
// @namespace    local.imagetrend.a15native.ui
// @version      0.1.2
// @description  Compact A15 module UI for findings, profiles, reconstruction, compatibility, safety, native AI, saline flush, diagnostics, and help.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MODULE_ID = 'control-center';
  const VERSION = '0.1.2';
  const HOST_ID = 'gremlin-a15-control-center';
  let shadow = null;
  let runtime = null;

  function waitForRuntime(timeoutMs = 15000) {
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

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function currentFindings() { try { return window.GremlinA15Findings?.getFindings?.() || []; } catch { return []; } }
  function severityClass(s) { return ['info','meh','warning','critical'].includes(s) ? s : 'meh'; }

  function mount() {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483646';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host{font:13px system-ui,-apple-system,sans-serif;color:#e5e7eb}button,input,select{font:inherit}button{cursor:pointer}
        .launch{border:1px solid #2dd4bf;border-radius:999px;background:#0f172a;color:#d1fae5;padding:7px 10px;box-shadow:0 4px 14px #0007}
        .panel{width:340px;max-width:88vw;max-height:62vh;overflow:auto;background:#0b1220;border:1px solid #2dd4bf;border-radius:11px;box-shadow:0 12px 34px #0009;padding:10px}
        .head{display:flex;align-items:center;justify-content:space-between;gap:8px}.head b{font-size:14px}.close{border:0;background:transparent;color:#cbd5e1;font-size:20px;padding:0 4px}
        .tabs{display:flex;gap:4px;margin:8px 0;flex-wrap:wrap}.tabs button,.action{border:1px solid #334155;background:#111827;color:#e5e7eb;border-radius:7px;padding:6px 8px}.tabs button.active{border-color:#2dd4bf;color:#99f6e4}
        .view[hidden]{display:none}.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:7px 0}.stack{display:grid;gap:6px}.muted{color:#94a3b8;font-size:12px;line-height:1.35}.status{font-size:12px;color:#99f6e4;min-height:16px;margin-top:6px}
        .finding{border:1px solid #334155;border-left-width:4px;border-radius:7px;padding:7px;background:#0f172a}.finding.info{border-left-color:#64748b}.finding.meh{border-left-color:#eab308}.finding.warning{border-left-color:#f97316}.finding.critical{border-left-color:#ef4444}.finding h4{font-size:12px;margin:0 0 4px}.finding p{font-size:12px;margin:0 0 5px;color:#cbd5e1}.finding button{border:1px solid #475569;background:#111827;color:#dbeafe;border-radius:6px;padding:4px 6px}
        label.toggle{display:flex;gap:7px;align-items:flex-start}.box{border:1px solid #334155;border-radius:8px;padding:8px;background:#0f172a;margin:6px 0}.danger{border-color:#7f1d1d}.help{line-height:1.42;color:#cbd5e1;font-size:12px}.help strong{color:#f8fafc}.pill{display:inline-block;border:1px solid #475569;border-radius:999px;padding:2px 6px;font-size:11px;margin-left:4px}
        select,input[type=text]{background:#111827;color:#e5e7eb;border:1px solid #334155;border-radius:6px;padding:5px}
      </style>
      <button class="launch">A15</button>
      <section class="panel" hidden>
        <div class="head"><b>Gremlin Logic A15</b><button class="close">×</button></div>
        <div class="tabs"><button data-tab="findings" class="active">Findings</button><button data-tab="actions">Actions</button><button data-tab="settings">Settings</button><button data-tab="help">Help</button></div>
        <div class="view" data-view="findings"><div id="findings" class="stack"></div></div>
        <div class="view" data-view="actions" hidden>
          <div class="row"><button class="action" id="evaluate">Run checks</button><button class="action" id="rescan">Remap page</button></div>
          <div class="box"><strong>Compatibility <span class="pill" id="compat-state">unknown</span></strong><div class="row"><button class="action" id="compat-check">Check</button><button class="action" id="trust-map">Trust current map</button><button class="action" id="rollback-map">Rollback map</button></div><div class="muted">A new or materially changed ImageTrend structure may block mutation until its metadata map is reviewed.</div></div>
          <div class="box"><strong>Safety <span class="pill" id="safety-state">unknown</span></strong><div class="row"><button class="action" id="reset-safety">Reset circuit breaker</button></div></div>
          <div class="row"><button class="action" id="ai-capture">AI Capture</button><button class="action" id="ai-generate">AI Generate Values</button></div>
          <div class="box"><strong>Saline flush</strong><div class="muted">Requires an open medication editor. IV and IO remain distinct routes.</div><div class="row"><button class="action" id="flush-iv">Prepare IV flush</button><button class="action" id="flush-io">Prepare IO flush</button></div></div>
          <div class="row"><button class="action" id="diag">Copy diagnostics</button></div>
        </div>
        <div class="view" data-view="settings" hidden>
          <div class="box"><strong>Profile</strong><div class="row"><select id="profile"></select><button class="action" id="new-profile">New</button></div></div>
          <div class="box"><label class="toggle"><input type="checkbox" id="reconstruction"><span><strong>Adaptive reconstruction</strong><br><span class="muted">Recommended. Stores control/action metadata only so A15 can recover from ImageTrend UI changes. It does not record keystrokes or persist patient-entered scalar values.</span></span></label></div>
          <div class="box"><label class="toggle"><input type="checkbox" id="diagnostics"><span><strong>Capability diagnostics</strong><br><span class="muted">Runs low-noise capability probes after boot.</span></span></label></div>
        </div>
        <div class="view help" data-view="help" hidden>
          <div class="box"><strong>Reconstruction disclaimer</strong><p>A15 can maintain a metadata-only map of ImageTrend controls and actions. This improves update resilience when ImageTrend adds, moves, or renames controls. The mapper observes structural DOM changes only; it intentionally does not install keydown/input loggers and does not persist chart values.</p><p>You may disable reconstruction in Settings. Doing so reduces A15's ability to self-recover after ImageTrend updates and may cause features to degrade until a new map is captured manually.</p></div>
          <div class="box"><strong>Compatibility trust</strong><p>On a new or changed ImageTrend structure, mutation can remain blocked until the structural map is reviewed and explicitly trusted. Trusting a map does not approve clinical values; it only records the interface structure as known-good.</p></div>
          <div class="box"><strong>Native AI</strong><p>A15's AI bridge only invokes ImageTrend's own AI controls after an explicit user action. It does not forward chart content to a separate AI service. Native save/network behavior still requires live validation.</p></div>
          <div class="box danger"><strong>Clinical automation</strong><p>Any generated or autofilled chart content must be reviewed before saving. A15 fails closed when a target field or option cannot be resolved with sufficient confidence.</p></div>
        </div>
        <div class="status" id="status"></div>
      </section>`;
    document.body.append(host);
    wire();
    refresh();
  }

  const $ = s => shadow?.querySelector(s);
  const $$ = s => [...(shadow?.querySelectorAll(s) || [])];
  function status(msg) { const el = $('#status'); if (el) el.textContent = String(msg || ''); }

  function renderFindings() {
    const root = $('#findings');
    if (!root) return;
    const rows = currentFindings();
    if (!rows.length) { root.innerHTML = '<div class="muted">No current A15 findings. Run checks after the chart section you want to evaluate is visible.</div>'; return; }
    root.innerHTML = rows.map((f, i) => `<div class="finding ${severityClass(f.severity)}" data-index="${i}"><h4>${esc(String(f.severity || 'meh').toUpperCase())} · ${esc(f.title)}</h4><p>${esc(f.message)}</p>${f.target ? '<button data-nav="1">Go to field</button>' : ''}</div>`).join('');
    $$('#findings [data-nav]').forEach(btn => {
      btn.onclick = async () => {
        const i = Number(btn.closest('.finding')?.dataset.index);
        const f = currentFindings()[i];
        if (!f?.target) return;
        const ok = await window.GremlinA15Findings?.navigateTo?.(f.target);
        status(ok ? 'Field located.' : 'Field is not currently rendered.');
      };
    });
  }

  function refreshProfiles() {
    const select = $('#profile');
    if (!select || !runtime) return;
    const current = runtime.getProfile()?.id;
    select.innerHTML = runtime.listProfiles().map(p => `<option value="${esc(p.id)}" ${p.id === current ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  }

  function refreshCompatibility() {
    const c = window.GremlinA15Compatibility?.state?.();
    const state = c?.lastCheck?.state || 'DISCOVERED';
    if ($('#compat-state')) $('#compat-state').textContent = state;
    const s = window.GremlinA15Safety?.state?.();
    if ($('#safety-state')) $('#safety-state').textContent = s?.suspended ? 'SUSPENDED' : (s?.compatibilityAllowed === false ? 'BLOCKED' : 'READY');
  }

  function refreshSettings() {
    if (!runtime) return;
    $('#reconstruction').checked = runtime.settings.get('reconstructionEnabled', true);
    $('#diagnostics').checked = runtime.settings.get('diagnosticsEnabled', true);
    refreshProfiles();
    refreshCompatibility();
  }

  function refresh() { renderFindings(); refreshSettings(); }

  async function doFlush(route) {
    if (!window.GremlinA15Clinical) return status('Clinical module is not available.');
    const value = window.prompt(`Flush volume in mL for ${route}:`, '');
    if (value == null) return;
    const result = await window.GremlinA15Clinical.prepareSalineFlush({ route, doseMl: Number(value), confirm: true });
    status(result?.ok ? `${route} saline flush prepared. Review the medication before saving.` : `Flush not prepared: ${result?.reason || 'unknown error'}`);
    await window.GremlinA15Findings?.evaluate?.({ source: 'control-center' });
    renderFindings(); refreshCompatibility();
  }

  async function copyDiagnostics() {
    const payload = {
      at: new Date().toISOString(),
      runtime: runtime?.exportDiagnostics?.() || null,
      reconstruction: window.GremlinA15Reconstruction?.scan?.('diagnostics') || null,
      compatibility: window.GremlinA15Compatibility?.state?.() || null,
      safety: window.GremlinA15Safety?.state?.() || null,
      nativeActions: window.GremlinA15NativeActions?.capabilityMap?.() || null,
      ai: window.GremlinA15AI?.inspectWithoutInvoking?.() || null,
      protectedFields: window.GremlinA15ProtectedFields?.list?.() || [],
      findings: currentFindings().map(f => ({ id: f.id, ruleId: f.ruleId, severity: f.severity, title: f.title, target: f.target || null }))
    };
    const text = JSON.stringify(payload, null, 2);
    try { await navigator.clipboard.writeText(text); status('Diagnostics copied.'); }
    catch { status('Clipboard unavailable on this browser.'); }
  }

  function wire() {
    $('.launch').onclick = () => { $('.panel').hidden = false; $('.launch').hidden = true; refresh(); };
    $('.close').onclick = () => { $('.panel').hidden = true; $('.launch').hidden = false; };
    $$('.tabs button').forEach(btn => btn.onclick = () => {
      $$('.tabs button').forEach(x => x.classList.toggle('active', x === btn));
      $$('.view').forEach(v => v.hidden = v.dataset.view !== btn.dataset.tab);
      if (btn.dataset.tab === 'findings') renderFindings();
      if (btn.dataset.tab === 'settings' || btn.dataset.tab === 'actions') refreshSettings();
    });

    $('#evaluate').onclick = async () => { await window.GremlinA15Findings?.evaluate?.({ source: 'control-center' }); renderFindings(); status('Checks complete.'); };
    $('#rescan').onclick = () => { const r = window.GremlinA15Reconstruction?.scan?.('manual-ui'); status(r?.fingerprint ? `Map refreshed: ${r.fields?.length || 0} fields, ${r.actions?.length || 0} actions.` : 'Mapper unavailable or disabled.'); refreshCompatibility(); };
    $('#compat-check').onclick = () => { const r = window.GremlinA15Compatibility?.inspect?.(); status(r ? `${r.state}: ${r.reason}` : 'Compatibility guard unavailable.'); refreshCompatibility(); };
    $('#trust-map').onclick = () => { const r = window.GremlinA15Compatibility?.trustCurrent?.({ confirm: true }); status(r?.ok ? 'Current structural map trusted.' : `Map not trusted: ${r?.reason || 'guard unavailable'}`); window.GremlinA15Compatibility?.inspect?.(); refreshCompatibility(); };
    $('#rollback-map').onclick = () => { const r = window.GremlinA15Compatibility?.rollbackTrusted?.({ confirm: true }); status(r?.ok ? 'Previous trusted map restored.' : `Rollback unavailable: ${r?.reason || 'guard unavailable'}`); refreshCompatibility(); };
    $('#reset-safety').onclick = () => { const r = window.GremlinA15Safety?.reset?.({ confirm: true }); status(r?.ok ? 'Safety circuit breaker reset.' : `Reset not performed: ${r?.reason || 'guard unavailable'}`); refreshCompatibility(); };
    $('#ai-capture').onclick = async () => { const r = await window.GremlinA15AI?.openCapture?.({ confirm: true }); status(r?.ok ? 'Opened ImageTrend AI Capture.' : `AI Capture unavailable: ${r?.reason || 'module missing'}`); };
    $('#ai-generate').onclick = async () => { const r = await window.GremlinA15AI?.generateValues?.({ confirm: true }); status(r?.ok ? 'ImageTrend AI Generate Values invoked. Review the generated fields.' : `AI Generate Values unavailable: ${r?.reason || 'module missing'}`); };
    $('#flush-iv').onclick = () => doFlush('IV');
    $('#flush-io').onclick = () => doFlush('IO');
    $('#diag').onclick = copyDiagnostics;

    $('#reconstruction').onchange = e => {
      const enabled = !!e.target.checked;
      if (!enabled) {
        const proceed = window.confirm('Disable adaptive reconstruction?\n\nThis is a core resilience feature. Turning it off stops automatic metadata remapping and makes A15 more likely to break when ImageTrend changes its forms or controls. No keystrokes or patient-entered scalar values are recorded by the mapper.');
        if (!proceed) { e.target.checked = true; return status('Adaptive reconstruction remains enabled.'); }
      }
      runtime.settings.set('reconstructionEnabled', enabled);
      window.GremlinA15Reconstruction?.setEnabled?.(enabled);
      status(enabled ? 'Adaptive reconstruction enabled.' : 'Reconstruction disabled. Update resilience is reduced.');
    };
    $('#diagnostics').onchange = e => { runtime.settings.set('diagnosticsEnabled', !!e.target.checked); status(`Capability diagnostics ${e.target.checked ? 'enabled' : 'disabled'}.`); };
    $('#profile').onchange = e => { runtime.useProfile(e.target.value); refreshSettings(); status(`Profile changed to ${runtime.getProfile()?.name || e.target.value}.`); };
    $('#new-profile').onclick = () => {
      const name = window.prompt('New profile name:');
      if (!name?.trim()) return;
      const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `profile-${Date.now()}`;
      runtime.createProfile(id, name.trim()); runtime.useProfile(id); refreshSettings(); status(`Created profile “${name.trim()}”.`);
    };

    window.addEventListener('gremlin:a15:findings-updated', renderFindings);
    window.addEventListener('gremlin:a15:profile-changed', refreshSettings);
    window.addEventListener('gremlin:a15:compatibility-state', refreshCompatibility);
    window.addEventListener('gremlin:a15:safety-failure', refreshCompatibility);
    window.addEventListener('gremlin:a15:safety-reset', refreshCompatibility);
  }

  waitForRuntime().then(r => {
    runtime = r;
    runtime.registerModule({ id: MODULE_ID, version: VERSION, description: 'Compact A15 control center and help/settings surface.', defaultEnabled: true, start: async () => mount(), stop: async () => { document.getElementById(HOST_ID)?.remove?.(); shadow = null; } });
    runtime.startModule(MODULE_ID);
  }).catch(() => {});
})();
