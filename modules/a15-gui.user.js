// ==UserScript==
// @name         Gremlin Logic A15 GUI
// @namespace    local.imagetrend.a15native.gui
// @version      0.2.0
// @description  Replaceable skin for Gremlin Logic A15. The A15 orb is the Go Baby Go control; all mechanism stays behind the GremlinA15 bridge.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const HOST_ID = 'gremlin-a15-gui';
  const VERSION = '0.2.0';
  let api = null;
  let shadow = null;
  let stopSubscription = null;
  let state = null;
  let localBusy = false;

  function waitForBridge(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.GremlinA15?.getState && window.GremlinA15?.actions) return resolve(window.GremlinA15);
        if (Date.now() - started > timeoutMs) return reject(new Error('A15 public bridge not found.'));
        setTimeout(tick, 200);
      };
      tick();
    });
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = s => shadow?.querySelector(s);
  const $$ = s => [...(shadow?.querySelectorAll(s) || [])];
  const profileLabel = () => state?.profile?.name || state?.profile?.id || 'No profile';

  function setStatus(message) {
    const el = $('#status');
    if (el) el.textContent = String(message || '');
  }

  function mount() {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483646';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host{font:13px/1.35 system-ui,-apple-system,sans-serif;color:#e5e7eb}*{box-sizing:border-box}button,select,input{font:inherit}
        .dock{display:grid;justify-items:center;gap:3px}.orb-wrap{position:relative}.orb{width:72px;height:72px;border-radius:50%;border:3px solid #2dd4bf;background:#0b1220;color:#ccfbf1;font-weight:900;font-size:19px;letter-spacing:.5px;box-shadow:0 6px 20px #0009;cursor:pointer;transition:transform .08s ease,opacity .15s ease,box-shadow .15s ease}.orb:active{transform:scale(.96)}.orb.busy{opacity:.65;box-shadow:0 0 0 5px #2dd4bf33,0 6px 20px #0009}.orb:disabled{cursor:default;opacity:.45}.profile-name{max-width:118px;border:0;background:transparent;color:#cbd5e1;font-size:11px;text-align:center;padding:2px 4px;cursor:pointer;text-shadow:0 1px 2px #000}.profile-name:hover{color:#99f6e4}.badge{position:absolute;right:-3px;top:-3px;min-width:21px;height:21px;border-radius:999px;padding:0 5px;display:grid;place-items:center;background:#b91c1c;color:white;font-size:10px;font-weight:700;border:2px solid #0b1220}.engine-dot{position:absolute;left:1px;bottom:2px;width:12px;height:12px;border-radius:50%;border:2px solid #0b1220;background:#475569}.engine-dot.ready{background:#22c55e}.engine-dot.running{background:#eab308}
        .panel{width:350px;max-width:90vw;max-height:67vh;overflow:auto;background:#0b1220;border:1px solid #2dd4bf;border-radius:12px;box-shadow:0 12px 36px #000a;padding:11px}.head{display:flex;align-items:center;gap:8px}.head strong{flex:1}.close{border:0;background:transparent;color:#cbd5e1;font-size:22px;cursor:pointer}.tabs{display:flex;gap:5px;flex-wrap:wrap;margin:9px 0}.tabs button,.action{border:1px solid #334155;background:#111827;color:#e5e7eb;border-radius:7px;padding:6px 8px;cursor:pointer}.tabs button.active{border-color:#2dd4bf;color:#99f6e4}.view[hidden],[hidden]{display:none!important}.box{border:1px solid #334155;border-radius:8px;background:#0f172a;padding:8px;margin:7px 0}.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}.muted{color:#94a3b8;font-size:11px}.status{min-height:18px;margin-top:7px;color:#99f6e4;font-size:11px}.finding{border:1px solid #334155;border-left-width:4px;border-radius:7px;padding:7px;margin:6px 0;background:#0f172a}.finding.info{border-left-color:#64748b}.finding.meh{border-left-color:#eab308}.finding.warning{border-left-color:#f97316}.finding.critical{border-left-color:#ef4444}.finding h4{margin:0 0 3px;font-size:12px}.finding p{margin:0;color:#cbd5e1;font-size:11px}.finding button{margin-top:5px}select{background:#111827;color:#e5e7eb;border:1px solid #334155;border-radius:6px;padding:5px;min-width:150px}label{display:flex;gap:7px;align-items:flex-start}.pill{display:inline-block;border:1px solid #475569;border-radius:999px;padding:2px 6px;font-size:10px}.danger{border-color:#7f1d1d}.version{color:#64748b;font-size:10px}.result{white-space:pre-wrap;max-height:120px;overflow:auto}
      </style>
      <div class="dock">
        <div class="orb-wrap">
          <button class="orb" id="orb" title="Go, baby, go">A15</button>
          <span class="badge" id="badge" hidden>0</span>
          <span class="engine-dot" id="engine-dot" title="Execution engine status"></span>
        </div>
        <button class="profile-name" id="profile-name" title="Open A15 settings"></button>
      </div>
      <section class="panel" hidden>
        <div class="head"><strong>Gremlin Logic A15</strong><span class="version">GUI ${VERSION}</span><button class="close" id="close">×</button></div>
        <div class="tabs"><button class="active" data-tab="findings">Findings</button><button data-tab="actions">Actions</button><button data-tab="settings">Settings</button></div>
        <div class="view" data-view="findings"><div id="findings"></div></div>
        <div class="view" data-view="actions" hidden>
          <div class="box"><strong>Execution</strong><div class="row"><button class="action" id="go">Go, baby, go</button><button class="action" id="review">Review only</button></div><div class="muted result" id="execution-result"></div></div>
          <div class="row"><button class="action" id="evaluate">Run checks</button><button class="action" id="remap">Remap page</button><button class="action" id="diagnostics">Copy diagnostics</button></div>
          <div class="box"><strong>Compatibility <span class="pill" id="compat"></span></strong><div class="row"><button class="action" id="compat-check">Check</button><button class="action" id="trust">Trust map</button><button class="action" id="rollback">Rollback</button></div></div>
          <div class="box"><strong>Safety <span class="pill" id="safety"></span></strong><div class="row"><button class="action" id="reset-safety">Reset circuit breaker</button></div></div>
          <div class="box"><strong>Native ImageTrend AI</strong><div class="row"><button class="action" id="ai-capture">AI Capture</button><button class="action" id="ai-generate">AI Generate Values</button></div></div>
        </div>
        <div class="view" data-view="settings" hidden>
          <div class="box"><strong>Profile</strong><div class="row"><select id="profile"></select><button class="action" id="new-profile">New</button></div></div>
          <div class="box"><label><input type="checkbox" id="reconstruction"><span><strong>Adaptive reconstruction</strong><br><span class="muted">Mechanism setting. This skin only sends the request through the A15 bridge.</span></span></label></div>
          <div class="box"><label><input type="checkbox" id="diag-setting"><span><strong>Capability diagnostics</strong></span></label></div>
          <div class="box danger"><span class="muted">Architectural rule: this GUI does not query ImageTrend controls, call Knockout, or own chart mutation logic. It may be replaced without changing the mechanism.</span></div>
        </div>
        <div class="status" id="status"></div>
      </section>`;
    document.body.append(host);
    wire();
    render();
  }

  function renderFindings() {
    const root = $('#findings');
    if (!root) return;
    const list = state?.findings || [];
    if (!list.length) {
      root.innerHTML = '<div class="muted">No current findings.</div>';
      return;
    }
    root.innerHTML = list.map((f, i) => `<div class="finding ${esc(f.severity || 'meh')}" data-index="${i}"><h4>${esc(String(f.severity || 'meh').toUpperCase())} · ${esc(f.title || 'Finding')}</h4><p>${esc(f.message || '')}</p>${f.target ? '<button class="action" data-nav>Go to field</button>' : ''}</div>`).join('');
    $$('[data-nav]').forEach(btn => btn.onclick = async () => {
      const index = Number(btn.closest('.finding')?.dataset.index);
      const ok = await api.actions.navigateToFinding(index);
      setStatus(ok ? 'Field located.' : 'Field is not currently rendered.');
    });
  }

  function render() {
    if (!shadow || !state) return;
    $('#profile-name').textContent = profileLabel();
    const count = (state.findings || []).filter(f => f.severity === 'warning' || f.severity === 'critical').length;
    $('#badge').textContent = String(count);
    $('#badge').hidden = count === 0;
    $('#compat').textContent = state.compatibility?.state || 'unknown';
    $('#safety').textContent = state.safety?.suspended ? 'SUSPENDED' : (state.safety?.compatibilityAllowed === false ? 'BLOCKED' : 'READY');
    $('#reconstruction').checked = state.settings?.reconstructionEnabled !== false;
    $('#diag-setting').checked = state.settings?.diagnosticsEnabled !== false;
    const select = $('#profile');
    select.innerHTML = (state.profiles || []).map(p => `<option value="${esc(p.id)}" ${p.id === state.profile?.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const executionBusy = localBusy || !!state.execution?.running;
    $('#orb').disabled = !state.execution?.available || executionBusy || !state.supportedRoute;
    $('#orb').classList.toggle('busy', executionBusy);
    $('#go').disabled = $('#orb').disabled;
    $('#review').disabled = !state.execution?.available || executionBusy || !state.supportedRoute;
    $('#engine-dot').className = `engine-dot ${executionBusy ? 'running' : (state.execution?.available ? 'ready' : '')}`;
    $('#execution-result').textContent = state.execution?.resultText || (state.execution?.available ? 'Execution engine ready.' : 'Execution engine unavailable.');
    renderFindings();
  }

  async function runGoBabyGo() {
    if (localBusy || !api) return;
    localBusy = true;
    render();
    try {
      const result = await api.actions.goBabyGo();
      setStatus(result?.ok ? 'A15 run returned. Review the chart before Save.' : `A15 did not run: ${result?.reason || 'unknown error'}`);
    } catch (error) {
      setStatus(`A15 did not run: ${error?.message || error}`);
    } finally {
      localBusy = false;
      state = api.getState();
      render();
    }
  }

  function openPanel(tab = 'findings') {
    $('.panel').hidden = false;
    $('.dock').hidden = true;
    const target = $(`.tabs button[data-tab="${tab}"]`) || $('.tabs button');
    target?.click();
    render();
  }

  function wire() {
    // Hard UI contract: the orb itself has exactly one job — run the active profile.
    $('#orb').onclick = runGoBabyGo;
    $('#profile-name').onclick = () => openPanel('settings');
    $('#close').onclick = () => { $('.panel').hidden = true; $('.dock').hidden = false; };
    $$('.tabs button').forEach(btn => btn.onclick = () => {
      $$('.tabs button').forEach(x => x.classList.toggle('active', x === btn));
      $$('.view').forEach(v => v.hidden = v.dataset.view !== btn.dataset.tab);
      if (btn.dataset.tab === 'findings') renderFindings();
    });

    $('#go').onclick = runGoBabyGo;
    $('#review').onclick = async () => {
      const r = await api.actions.reviewExecution();
      setStatus(r?.ok ? 'A15 review ready.' : `Review failed: ${r?.reason || 'unknown error'}`);
    };
    $('#evaluate').onclick = async () => { await api.actions.evaluate(); setStatus('Checks complete.'); };
    $('#remap').onclick = () => { const r = api.actions.remap(); setStatus(r?.fingerprint ? `Map refreshed: ${r.fields?.length || 0} fields.` : 'Mapper unavailable or disabled.'); };
    $('#compat-check').onclick = () => { const r = api.actions.compatibilityCheck(); setStatus(r ? `${r.state}: ${r.reason || ''}` : 'Compatibility guard unavailable.'); };
    $('#trust').onclick = () => { const r = api.actions.trustCurrentMap(); setStatus(r?.ok ? 'Current structural map trusted.' : `Map not trusted: ${r?.reason || 'unavailable'}`); };
    $('#rollback').onclick = () => { const r = api.actions.rollbackMap(); setStatus(r?.ok ? 'Previous trusted map restored.' : `Rollback unavailable: ${r?.reason || 'unavailable'}`); };
    $('#reset-safety').onclick = () => { const r = api.actions.resetSafety(); setStatus(r?.ok ? 'Safety circuit breaker reset.' : `Reset not performed: ${r?.reason || 'unavailable'}`); };
    $('#ai-capture').onclick = async () => { const r = await api.actions.openAiCapture(); setStatus(r?.ok ? 'Opened ImageTrend AI Capture.' : `AI Capture unavailable: ${r?.reason || 'unavailable'}`); };
    $('#ai-generate').onclick = async () => { const r = await api.actions.generateAiValues(); setStatus(r?.ok ? 'ImageTrend AI Generate Values invoked.' : `AI Generate Values unavailable: ${r?.reason || 'unavailable'}`); };
    $('#diagnostics').onclick = async () => {
      const payload = await api.actions.exportDiagnostics();
      try { await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); setStatus('Diagnostics copied.'); }
      catch { setStatus('Clipboard unavailable.'); }
    };

    $('#reconstruction').onchange = e => {
      const enabled = !!e.target.checked;
      if (!enabled && !window.confirm('Disable adaptive reconstruction? This reduces update resilience.')) {
        e.target.checked = true;
        return;
      }
      api.actions.setReconstructionEnabled(enabled);
      setStatus(`Adaptive reconstruction ${enabled ? 'enabled' : 'disabled'}.`);
    };
    $('#diag-setting').onchange = e => { api.actions.setDiagnosticsEnabled(!!e.target.checked); setStatus(`Capability diagnostics ${e.target.checked ? 'enabled' : 'disabled'}.`); };
    $('#profile').onchange = e => { api.actions.useProfile(e.target.value); setStatus(`Profile: ${e.target.selectedOptions[0]?.textContent || e.target.value}`); };
    $('#new-profile').onclick = () => {
      const name = window.prompt('New profile name:');
      if (!name?.trim()) return;
      const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `profile-${Date.now()}`;
      api.actions.createProfile(id, name.trim());
      api.actions.useProfile(id);
      setStatus(`Created profile “${name.trim()}”.`);
    };
  }

  waitForBridge().then(bridge => {
    api = bridge;
    state = api.getState();
    mount();
    stopSubscription = api.subscribe(next => { state = next; render(); });
  }).catch(() => {});

  window.addEventListener('pagehide', () => { try { stopSubscription?.(); } catch {} }, { once: true });
})();
