// ==UserScript==
// @name         Gremlin Logic A15 GUI
// @namespace    local.imagetrend.a15native.gui
// @version      0.3.0
// @description  Replaceable A15 skin with Safari-safe page-context bridge fallback.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.3.0';
  const HOST_ID = 'gremlin-a15-gui';
  const REQ = 'gremlin:a15:gui-rpc-request';
  const RES = 'gremlin:a15:gui-rpc-response';
  const STATE = 'gremlin:a15:gui-rpc-state';
  const READY = 'gremlin:a15:gui-rpc-ready';

  let api = null;
  let state = null;
  let shadow = null;
  let busy = false;
  let stopSubscription = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = s => shadow?.querySelector(s);
  const $$ = s => [...(shadow?.querySelectorAll(s) || [])];
  const clone = value => {
    try { return structuredClone(value); }
    catch { try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }
  };

  function installPageProxy() {
    if (document.documentElement.dataset.gremlinA15GuiProxy === '1') return;
    document.documentElement.dataset.gremlinA15GuiProxy = '1';

    const script = document.createElement('script');
    script.textContent = `(() => {
      if (window.__gremlinA15GuiProxy) return;
      window.__gremlinA15GuiProxy = true;
      const REQ=${JSON.stringify(REQ)}, RES=${JSON.stringify(RES)}, STATE=${JSON.stringify(STATE)}, READY=${JSON.stringify(READY)};
      const safe = v => { try { return structuredClone(v); } catch { try { return JSON.parse(JSON.stringify(v)); } catch { return null; } } };
      const respond = (id, ok, value, error) => document.dispatchEvent(new CustomEvent(RES,{detail:{id,ok,value:safe(value),error:error?String(error):null}}));
      const bridge = () => window.GremlinA15;
      document.addEventListener(REQ, async e => {
        const d=e.detail||{}, id=d.id;
        try {
          const b=bridge();
          if (!b) throw new Error('A15 public bridge not found in page context');
          let value;
          if (d.kind==='getState') value=b.getState();
          else if (d.kind==='action') {
            const fn=b.actions?.[d.name];
            if (typeof fn!=='function') throw new Error('A15 action unavailable: '+d.name);
            value=await fn(...(Array.isArray(d.args)?d.args:[]));
          } else throw new Error('Unknown RPC request');
          respond(id,true,value,null);
        } catch (err) { respond(id,false,null,err?.message||err); }
      });
      const publish = reason => {
        try { const b=bridge(); if (b?.getState) document.dispatchEvent(new CustomEvent(STATE,{detail:{reason,state:safe(b.getState())}})); } catch {}
      };
      window.addEventListener('gremlin:a15:bridge-state', e => publish(e.detail?.reason||'state'));
      const timer=setInterval(() => {
        if (bridge()?.getState) {
          clearInterval(timer);
          document.dispatchEvent(new CustomEvent(READY,{detail:{version:bridge().version||null}}));
          publish('proxy-ready');
        }
      },200);
      setTimeout(()=>clearInterval(timer),20000);
    })();`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function makeRpcApi() {
    let seq = 0;
    const pending = new Map();
    const listeners = new Set();

    const onResponse = e => {
      const d = e.detail || {};
      const p = pending.get(d.id);
      if (!p) return;
      pending.delete(d.id);
      clearTimeout(p.timer);
      d.ok ? p.resolve(d.value) : p.reject(new Error(d.error || 'A15 RPC failed'));
    };
    const onState = e => {
      const d = e.detail || {};
      listeners.forEach(fn => { try { fn(clone(d.state), d.reason || 'state'); } catch {} });
    };
    document.addEventListener(RES, onResponse);
    document.addEventListener(STATE, onState);

    const rpc = (kind, name = null, args = []) => new Promise((resolve, reject) => {
      const id = `gui-${Date.now()}-${++seq}`;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('A15 RPC timeout')); }, 8000);
      pending.set(id, { resolve, reject, timer });
      document.dispatchEvent(new CustomEvent(REQ, { detail: { id, kind, name, args } }));
    });

    const actionNames = [
      'goBabyGo','reviewExecution','evaluate','remap','compatibilityCheck','trustCurrentMap','rollbackMap',
      'resetSafety','openAiCapture','generateAiValues','setReconstructionEnabled','setDiagnosticsEnabled',
      'useProfile','createProfile','navigateToFinding','exportDiagnostics'
    ];
    const actions = {};
    actionNames.forEach(name => { actions[name] = (...args) => rpc('action', name, args); });

    return {
      version: 'safari-rpc/1',
      async getState() { return rpc('getState'); },
      actions,
      subscribe(fn) {
        listeners.add(fn);
        rpc('getState').then(s => fn(s, 'subscribe')).catch(() => {});
        return () => listeners.delete(fn);
      },
      destroy() {
        document.removeEventListener(RES, onResponse);
        document.removeEventListener(STATE, onState);
        pending.forEach(p => { clearTimeout(p.timer); p.reject(new Error('GUI unloaded')); });
        pending.clear();
        listeners.clear();
      }
    };
  }

  async function waitForBridge(timeoutMs = 18000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (window.GremlinA15?.getState && window.GremlinA15?.actions) return { mode:'direct', api:window.GremlinA15 };
      await new Promise(r => setTimeout(r, 150));
    }
    throw new Error('direct bridge unavailable');
  }

  async function acquireBridge() {
    // Direct path first. Safari/Tampermonkey may isolate userscript globals; in that case
    // install a tiny page-context proxy and communicate only through serialized DOM events.
    try { return await waitForBridge(2200); } catch {}
    installPageProxy();
    const rpcApi = makeRpcApi();
    const started = Date.now();
    while (Date.now() - started < 18000) {
      try {
        const s = await rpcApi.getState();
        if (s) return { mode:'safari-rpc', api:rpcApi };
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    rpcApi.destroy?.();
    throw new Error('A15 bridge unavailable in both userscript and page contexts');
  }

  function setStatus(message) {
    const el = $('#status');
    if (el) el.textContent = String(message || '');
  }

  function mountFailure(message) {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483646';
    const root = host.attachShadow({mode:'open'});
    root.innerHTML = `<style>:host{font:12px system-ui}.e{max-width:300px;background:#2b1111;color:#fecaca;border:1px solid #ef4444;border-radius:10px;padding:10px;box-shadow:0 8px 24px #0008}.v{color:#fca5a5;font-size:10px}</style><div class="e"><strong>A15 GUI did not connect</strong><div>${esc(message)}</div><div class="v">GUI ${VERSION}</div></div>`;
    document.body.append(host);
  }

  function mount(mode) {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.dataset.bridgeMode = mode;
    host.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483646';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host{font:13px/1.35 system-ui,-apple-system,sans-serif;color:#e5e7eb}*{box-sizing:border-box}button,select,input{font:inherit}
        .dock{display:grid;justify-items:center;gap:3px}.orb-wrap{position:relative}.orb{width:72px;height:72px;border-radius:50%;border:3px solid #2dd4bf;background:#0b1220;color:#ccfbf1;font-weight:900;font-size:19px;box-shadow:0 6px 20px #0009;cursor:pointer}.orb.busy{opacity:.65}.orb:disabled{opacity:.45}.profile{border:0;background:transparent;color:#cbd5e1;font-size:11px;max-width:120px}.badge{position:absolute;right:-3px;top:-3px;min-width:21px;height:21px;border-radius:999px;padding:0 5px;display:grid;place-items:center;background:#b91c1c;color:#fff;font-size:10px;font-weight:700;border:2px solid #0b1220}.dot{position:absolute;left:1px;bottom:2px;width:12px;height:12px;border-radius:50%;border:2px solid #0b1220;background:#475569}.dot.ready{background:#22c55e}.dot.running{background:#eab308}
        .panel{width:350px;max-width:90vw;max-height:67vh;overflow:auto;background:#0b1220;border:1px solid #2dd4bf;border-radius:12px;box-shadow:0 12px 36px #000a;padding:11px}.head{display:flex;gap:8px;align-items:center}.head strong{flex:1}.close{border:0;background:transparent;color:#cbd5e1;font-size:22px}.tabs{display:flex;gap:5px;margin:9px 0}.tabs button,.action{border:1px solid #334155;background:#111827;color:#e5e7eb;border-radius:7px;padding:6px 8px}.tabs button.active{border-color:#2dd4bf;color:#99f6e4}.view[hidden],[hidden]{display:none!important}.box{border:1px solid #334155;border-radius:8px;background:#0f172a;padding:8px;margin:7px 0}.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}.muted{color:#94a3b8;font-size:11px}.status{min-height:18px;margin-top:7px;color:#99f6e4;font-size:11px}.finding{border:1px solid #334155;border-left-width:4px;border-radius:7px;padding:7px;margin:6px 0;background:#0f172a}.finding.warning{border-left-color:#f97316}.finding.critical{border-left-color:#ef4444}.finding.info{border-left-color:#64748b}.finding.meh{border-left-color:#eab308}.pill{display:inline-block;border:1px solid #475569;border-radius:999px;padding:2px 6px;font-size:10px}.version{color:#64748b;font-size:10px}select{background:#111827;color:#e5e7eb;border:1px solid #334155;border-radius:6px;padding:5px}
      </style>
      <div class="dock"><div class="orb-wrap"><button class="orb" id="orb">A15</button><span class="badge" id="badge" hidden>0</span><span class="dot" id="dot"></span></div><button class="profile" id="profile-name"></button></div>
      <section class="panel" hidden>
        <div class="head"><strong>Gremlin Logic A15</strong><span class="version">GUI ${VERSION} · ${esc(mode)}</span><button class="close" id="close">×</button></div>
        <div class="tabs"><button class="active" data-tab="findings">Findings</button><button data-tab="actions">Actions</button><button data-tab="settings">Settings</button></div>
        <div class="view" data-view="findings"><div id="findings"></div></div>
        <div class="view" data-view="actions" hidden><div class="box"><strong>Execution</strong><div class="row"><button class="action" id="go">Go, baby, go</button><button class="action" id="review">Review only</button></div><div class="muted" id="execution"></div></div><div class="row"><button class="action" id="evaluate">Run checks</button><button class="action" id="remap">Remap page</button><button class="action" id="diagnostics">Copy diagnostics</button></div><div class="box"><strong>Compatibility <span class="pill" id="compat"></span></strong><div class="row"><button class="action" id="compat-check">Check</button></div></div><div class="box"><strong>Safety <span class="pill" id="safety"></span></strong></div></div>
        <div class="view" data-view="settings" hidden><div class="box"><strong>Profile</strong><div class="row"><select id="profile"></select></div></div><div class="box"><label><input type="checkbox" id="reconstruction"> Adaptive reconstruction</label></div><div class="box"><label><input type="checkbox" id="diag-setting"> Capability diagnostics</label></div></div>
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
    if (!list.length) { root.innerHTML = '<div class="muted">No current findings.</div>'; return; }
    root.innerHTML = list.map((f,i)=>`<div class="finding ${esc(f.severity||'meh')}" data-index="${i}"><strong>${esc(String(f.severity||'meh').toUpperCase())} · ${esc(f.title||'Finding')}</strong><div class="muted">${esc(f.message||'')}</div>${f.target?'<button class="action" data-nav>Go to field</button>':''}</div>`).join('');
    $$('[data-nav]').forEach(btn => btn.onclick = async () => {
      const i = Number(btn.closest('.finding')?.dataset.index);
      const ok = await api.actions.navigateToFinding(i);
      setStatus(ok ? 'Field located.' : 'Field is not currently rendered.');
    });
  }

  function render() {
    if (!shadow || !state) return;
    $('#profile-name').textContent = state.profile?.name || state.profile?.id || 'No profile';
    const count=(state.findings||[]).filter(f=>['warning','critical'].includes(f.severity)).length;
    $('#badge').textContent=String(count); $('#badge').hidden=count===0;
    $('#compat').textContent=state.compatibility?.state||'unknown';
    $('#safety').textContent=state.safety?.suspended?'SUSPENDED':(state.safety?.compatibilityAllowed===false?'BLOCKED':'READY');
    $('#reconstruction').checked=state.settings?.reconstructionEnabled!==false;
    $('#diag-setting').checked=state.settings?.diagnosticsEnabled!==false;
    $('#profile').innerHTML=(state.profiles||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===state.profile?.id?'selected':''}>${esc(p.name)}</option>`).join('');
    const running=busy||!!state.execution?.running;
    const disabled=!state.execution?.available||running||!state.supportedRoute;
    $('#orb').disabled=disabled; $('#go').disabled=disabled; $('#review').disabled=!state.execution?.available||running||!state.supportedRoute;
    $('#orb').classList.toggle('busy',running); $('#dot').className=`dot ${running?'running':(state.execution?.available?'ready':'')}`;
    $('#execution').textContent=state.execution?.resultText||(state.execution?.available?'Execution engine ready.':'Execution engine unavailable.');
    renderFindings();
  }

  async function refresh() { state = await api.getState(); render(); }

  async function runGoBabyGo() {
    if (busy) return;
    busy=true; render();
    try {
      const r=await api.actions.goBabyGo();
      setStatus(r?.ok?'A15 run returned. Review the chart before Save.':`A15 did not run: ${r?.reason||'unknown error'}`);
    } catch(e) { setStatus(`A15 did not run: ${e?.message||e}`); }
    finally { busy=false; try { await refresh(); } catch {} }
  }

  function openPanel(tab='findings') {
    $('.panel').hidden=false; $('.dock').hidden=true;
    $(`.tabs button[data-tab="${tab}"]`)?.click(); render();
  }

  function wire() {
    $('#orb').onclick=runGoBabyGo;
    $('#profile-name').onclick=()=>openPanel('settings');
    $('#close').onclick=()=>{$('.panel').hidden=true;$('.dock').hidden=false;};
    $$('.tabs button').forEach(btn=>btn.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.toggle('active',x===btn));$$('.view').forEach(v=>v.hidden=v.dataset.view!==btn.dataset.tab);});
    $('#go').onclick=runGoBabyGo;
    $('#review').onclick=async()=>{const r=await api.actions.reviewExecution();setStatus(r?.ok?'A15 review ready.':`Review failed: ${r?.reason||'unknown error'}`);await refresh();};
    $('#evaluate').onclick=async()=>{await api.actions.evaluate();setStatus('Checks complete.');await refresh();};
    $('#remap').onclick=async()=>{const r=await api.actions.remap();setStatus(r?.fingerprint?`Map refreshed: ${r.fields?.length||0} fields.`:'Mapper unavailable or disabled.');await refresh();};
    $('#compat-check').onclick=async()=>{const r=await api.actions.compatibilityCheck();setStatus(r?`${r.state}: ${r.reason||''}`:'Compatibility guard unavailable.');await refresh();};
    $('#diagnostics').onclick=async()=>{const payload=await api.actions.exportDiagnostics();try{await navigator.clipboard.writeText(JSON.stringify(payload,null,2));setStatus('Diagnostics copied.');}catch{setStatus('Clipboard unavailable.');}};
    $('#reconstruction').onchange=async e=>{await api.actions.setReconstructionEnabled(!!e.target.checked);await refresh();};
    $('#diag-setting').onchange=async e=>{await api.actions.setDiagnosticsEnabled(!!e.target.checked);await refresh();};
    $('#profile').onchange=async e=>{await api.actions.useProfile(e.target.value);await refresh();};
  }

  acquireBridge().then(async result => {
    api=result.api;
    state=await api.getState();
    mount(result.mode);
    stopSubscription=api.subscribe((next)=>{state=next;render();});
    document.dispatchEvent(new CustomEvent('gremlin:a15-gui-ready',{detail:{version:VERSION,bridgeMode:result.mode}}));
  }).catch(error => {
    console.warn('[A15 GUI]', error);
    mountFailure(error?.message || error);
  });

  window.addEventListener('pagehide',()=>{try{stopSubscription?.();}catch{} try{api?.destroy?.();}catch{}},{once:true});
})();
