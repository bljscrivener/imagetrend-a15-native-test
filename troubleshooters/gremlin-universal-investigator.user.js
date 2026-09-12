// ==UserScript==
// @name         Gremlin Universal Investigator
// @namespace    local.gremlin.investigator
// @version      0.3.1
// @description  Read-only cross-site DOM/action investigator with normalized capture envelopes and Safari/iPad touch interception.
// @match        http://*/*
// @match        https://*/*
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-universal-investigator.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-universal-investigator.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('gremlin-universal-investigator')) return;

  const VERSION = '0.3.1';
  const SCHEMA_VERSION = 'gfi.capture/1';
  const HOST_ID = 'gremlin-universal-investigator';
  const PREF_KEY = 'gfi.capture.preferences.v1';
  const SESSION_KEY = 'gfi.capture.session.v1';
  const SOURCE_URL = 'https://github.com/bljscrivener/imagetrend-a15-native-test/blob/main/troubleshooters/gremlin-universal-investigator.user.js';
  const RAW_URL = 'https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-universal-investigator.user.js';
  const isImageTrend = /(^|\.)imagetrendelite\.com$/i.test(location.hostname) || !!window.imagetrend;
  const norm = v => (v == null ? '' : String(v)).trim();
  const primitive = v => v == null || ['string','number','boolean'].includes(typeof v);
  const unwrap = v => {
    try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
    catch { return undefined; }
  };

  let result = {};
  let lastTarget = null;
  let pickMode = null;
  let parentCaptureId = null;
  let lastGesture = { key:'', at:0 };

  function safeJsonParse(text, fallback={}) {
    try { return JSON.parse(text); } catch { return fallback; }
  }

  function makeId(prefix='gfi') {
    try { return `${prefix}-${crypto.randomUUID()}`; }
    catch { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
  }

  function getSessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = makeId('gfi-session');
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch { return makeId('gfi-session'); }
  }

  function getPrefs() {
    try {
      return { friendlyName:'', tags:[], profileId:'default', ...safeJsonParse(localStorage.getItem(PREF_KEY) || '{}') };
    } catch { return { friendlyName:'', tags:[], profileId:'default' }; }
  }

  function setPrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    if (!Array.isArray(next.tags)) next.tags = [];
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function parseTags(text) {
    return [...new Set(String(text || '').split(',').map(x=>x.trim()).filter(Boolean))].slice(0,40);
  }

  function composedElements(e) {
    const path = typeof e?.composedPath === 'function' ? e.composedPath() : [];
    const els = path.filter(x => x instanceof Element);
    if (els.length) return els;
    return e?.target instanceof Element ? [e.target] : [];
  }

  function sameGesture(e) {
    const els = composedElements(e);
    const el = els[0];
    const stable = `${el?.tagName||''}|${el?.id||''}|${el?.className||''}`;
    const now = performance.now();
    const duplicate = lastGesture.key === stable && now - lastGesture.at < 650;
    if (!duplicate) lastGesture = { key:stable, at:now };
    return duplicate;
  }

  function cssEscape(v) {
    try { return CSS.escape(v); } catch { return String(v).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  }

  function selectorFor(el) {
    if (!(el instanceof Element)) return null;
    if (el.id) return `#${cssEscape(el.id)}`;
    const parts = [];
    let node = el;
    for (let depth=0; node && node.nodeType===1 && depth<7; depth++, node=node.parentElement) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList].filter(Boolean).slice(0,2);
      if (classes.length) part += classes.map(c=>`.${cssEscape(c)}`).join('');
      const parent = node.parentElement;
      if (parent) {
        const siblings = [...parent.children].filter(x=>x.tagName===node.tagName);
        if (siblings.length>1) part += `:nth-of-type(${siblings.indexOf(node)+1})`;
      }
      parts.unshift(part);
      const candidate = parts.join(' > ');
      try { if (document.querySelectorAll(candidate).length===1) return candidate; } catch {}
    }
    return parts.join(' > ');
  }

  function safeAttrs(el) {
    const out = {};
    if (!(el instanceof Element)) return out;
    const sensitive = /^(value|srcdoc|nonce)$/i;
    for (const a of [...el.attributes].slice(0,80)) {
      if (sensitive.test(a.name)) continue;
      let value = a.value;
      if (/^(href|src|action|formaction)$/i.test(a.name)) {
        try {
          const u = new URL(value, location.href);
          value = `${u.origin}${u.pathname}`;
        } catch {}
      }
      out[a.name] = value.slice(0,500);
    }
    return out;
  }

  function eventBindings(el) {
    const out = {};
    if (!(el instanceof Element)) return out;
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name) || a.name === 'data-bind' || /^data-(action|event|click|command)/i.test(a.name)) out[a.name] = a.value.slice(0,1500);
    }
    return out;
  }

  function genericElement(el, eventType=null) {
    if (!(el instanceof Element)) return null;
    const rect = el.getBoundingClientRect?.();
    return {
      selector: selectorFor(el),
      tag: el.tagName,
      id: el.id || null,
      classes: typeof el.className === 'string' ? el.className : null,
      role: el.getAttribute('role'),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      ariaLabel: el.getAttribute('aria-label'),
      text: norm(el.textContent).replace(/\s+/g,' ').slice(0,500),
      attributes: safeAttrs(el),
      eventBindings: eventBindings(el),
      eventType,
      rect: rect ? {x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)} : null
    };
  }

  function koContextSummary(el) {
    if (!window.ko?.contextFor || !(el instanceof Element)) return null;
    const contexts=[];
    let node=el;
    for(let depth=0;node&&depth<12;depth++,node=node.parentElement){
      let ctx; try{ctx=window.ko.contextFor(node);}catch{continue;}
      const d=ctx?.$data;
      if(!d||contexts.some(x=>x.data===d))continue;
      const likely={};
      for(const k of Object.keys(d).slice(0,180)){
        if(!/(id|label|type|binding|control|resource|selected|option|value|action|click|route|license|provider)/i.test(k))continue;
        let v;try{v=unwrap(d[k]);}catch{continue;}
        if(primitive(v)) likely[k]=v;
        else if(Array.isArray(v)) likely[k]={type:'array',length:v.length};
        else if(v&&typeof v==='object') likely[k]={type:'object',keys:Object.keys(v).slice(0,30)};
      }
      contexts.push({depth,tag:node.tagName,id:node.id||null,likely});
      Object.defineProperty(contexts[contexts.length-1],'data',{value:d,enumerable:false});
    }
    return contexts.map(({data,...x})=>x);
  }

  function imageTrendMeta(el) {
    if (!isImageTrend || !(el instanceof Element)) return null;
    let node=el;
    const chain=[];
    for(let i=0;node&&i<14;i++,node=node.parentElement)chain.push(node);
    const keys=['FormID','ControlID','Label','BindingPath','BindingPathEntryID','ControlType','PresetValueDefinitionID'];
    const out={};
    for(const n of chain){
      let ctx;try{ctx=window.ko?.contextFor?.(n);}catch{}
      const d=ctx?.$data;
      if(!d)continue;
      for(const k of keys){
        if(out[k]!=null)continue;
        const v=unwrap(d[k]);
        if(v!=null&&v!=='')out[k]=v;
      }
    }
    for(const n of chain){
      out.BindingPathEntryID ??= n.getAttribute?.('BindingPathEntryID') || n.getAttribute?.('data-bindingpathentryid') || undefined;
      out.BindingPath ??= n.getAttribute?.('BindingPath') || n.getAttribute?.('data-bindingpath') || undefined;
      out.ControlID ??= n.getAttribute?.('ControlID') || n.getAttribute?.('data-controlid') || undefined;
    }
    return Object.keys(out).length ? out : null;
  }

  function pageMeta() {
    return {
      origin: location.origin,
      pathname: location.pathname,
      title: document.title,
      imageTrend: isImageTrend
    };
  }

  function deviceMeta() {
    return {
      platform: navigator.platform || null,
      userAgent: navigator.userAgent,
      language: navigator.language || null,
      touchPoints: navigator.maxTouchPoints || 0,
      viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1 }
    };
  }

  function sourceIdFor(el, imageTrend=null) {
    return imageTrend?.BindingPathEntryID || imageTrend?.ControlID || el?.id || selectorFor(el) || location.pathname;
  }

  function slug(text) {
    return norm(text).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  }

  async function digestObject(obj) {
    const text = JSON.stringify(obj);
    try {
      const bytes = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return { algorithm:'SHA-256', value:[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('') };
    } catch {
      let h = 2166136261;
      for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
      return { algorithm:'FNV-1a-32', value:(h>>>0).toString(16).padStart(8,'0') };
    }
  }

  async function envelope({captureType,captureMethod,sourceId,payload,provenance={},notes=[]}) {
    const prefs = getPrefs();
    const captureId = makeId('gfi');
    const capturedAt = new Date().toISOString();
    const datePart = capturedAt.replace(/[:.]/g,'-');
    const baseName = slug(prefs.friendlyName || `${captureType}-${document.title}`) || captureType;
    const relationships = parentCaptureId ? [{ type:'derivedFrom', targetCaptureId:parentCaptureId }] : [];
    const header = {
      schemaVersion: SCHEMA_VERSION,
      investigatorVersion: VERSION,
      captureId,
      sessionId: getSessionId(),
      parentCaptureId,
      friendlyName: prefs.friendlyName || '',
      tags: prefs.tags || [],
      profileId: prefs.profileId || 'default',
      captureType,
      captureMethod,
      capturedAt,
      sourceId: sourceId || location.pathname,
      status: 'raw',
      flags: [],
      relationships,
      provenance: {
        source: 'dom',
        adapter: isImageTrend ? 'imagetrend' : 'generic-dom',
        derived: false,
        ...provenance
      },
      page: pageMeta(),
      device: deviceMeta(),
      exportHints: {
        suggestedFilename: `${baseName}-${datePart}.json`,
        mimeType: 'application/json',
        reportSection: captureType
      }
    };
    const hash = await digestObject({header:{...header,flags:undefined,relationships:undefined},payload});
    header.hash = hash;
    return { header, data: payload, notes };
  }

  async function inspect(el, eventType=null, captureMethod='element-pick') {
    const imageTrend = imageTrendMeta(el);
    const payload = {
      element: genericElement(el,eventType),
      imageTrend,
      knockout: koContextSummary(el),
      ancestors: (()=>{const out=[];let n=el;for(let i=0;n&&i<8;i++,n=n.parentElement)out.push(genericElement(n,eventType));return out;})()
    };
    return envelope({
      captureType:'element',
      captureMethod,
      sourceId:sourceIdFor(el,imageTrend),
      payload,
      provenance:{eventType:eventType || null},
      notes:[
        'Read-only investigator capture.',
        'Input values are intentionally excluded from exported attributes.',
        'Capture-phase pointer/touch listeners are used for iPad/Safari compatibility.',
        'ImageTrend metadata is added only when ImageTrend/Knockout context is present.'
      ]
    });
  }

  async function pageScan() {
    const candidates = [...document.querySelectorAll('button,a[href],input,select,textarea,[role],[data-bind],[onclick]')].slice(0,1200);
    const payload = {
      counts:{
        candidates:candidates.length,
        buttons:document.querySelectorAll('button,[role="button"]').length,
        links:document.links.length,
        inputs:document.querySelectorAll('input,select,textarea').length
      },
      elements:candidates.map(el=>genericElement(el)).filter(Boolean)
    };
    return envelope({
      captureType:'page-scan',
      captureMethod:'page-scan',
      sourceId:location.pathname,
      payload,
      provenance:{scope:'page'}
    });
  }

  function consoleProbe(el) {
    const sel=selectorFor(el);
    if(!sel)return '';
    return `(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;return {tag:e.tagName,id:e.id,class:e.className,text:(e.textContent||'').trim().slice(0,500),attrs:Object.fromEntries([...e.attributes].map(a=>[a.name,a.value])),rect:e.getBoundingClientRect()};})()`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      try { const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();return true; }
      catch { return false; }
    }
  }

  const host=document.createElement('div');
  host.id=HOST_ID;
  host.style.cssText='position:fixed;right:10px;bottom:10px;z-index:2147483647';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
    :host{font:12px system-ui;color:#e6edf3}button,a,input{font:inherit}.launch{width:38px;height:38px;border-radius:999px;border:1px solid #2dd4bf;background:#111827;color:#d1fae5;font-weight:800;box-shadow:0 4px 14px #0007}.panel{width:370px;max-width:90vw;max-height:72vh;overflow:auto;background:#0f1720;border:1px solid #2dd4bf;border-radius:10px;padding:9px;box-shadow:0 10px 28px #0008}.head{display:flex;justify-content:space-between;align-items:center}.hide{border:0;background:transparent;color:#e6edf3;font-size:18px}.row{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}.row button,.row a{padding:5px 7px;color:#e6edf3;background:#17212b;border:1px solid #2dd4bf;border-radius:7px;text-decoration:none;cursor:pointer}.meta{border-top:1px solid #334155;border-bottom:1px solid #334155;margin:7px 0;padding:7px 0}.meta label{display:block;color:#94a3b8;font-size:10px;margin:3px 0}.meta input{box-sizing:border-box;width:100%;padding:5px 6px;background:#09111a;color:#e6edf3;border:1px solid #334155;border-radius:6px}.status{font-size:11px;margin:5px 0;color:#99f6e4}.summary{color:#94a3b8;font-size:11px}.power{border-top:1px solid #334155;margin-top:7px;padding-top:7px}pre{white-space:pre-wrap;word-break:break-word;background:#09111a;color:#cbd5e1;border:1px solid #334155;padding:6px;border-radius:6px;max-height:200px;overflow:auto;font-size:10px}pre[hidden]{display:none}</style>
    <button class="launch" title="Gremlin Investigator">GI</button>
    <div class="panel" hidden>
      <div class="head"><strong>Universal Investigator ${VERSION}</strong><button class="hide">×</button></div>
      <div class="summary">Read-only capture. Metadata is isolated in the export header; observations remain in data.</div>
      <div class="meta">
        <label>Friendly name<input id="friendly" placeholder="e.g. Unit 422 dashboard baseline"></label>
        <label>Tags<input id="tags" placeholder="comma,separated,tags"></label>
        <label>Profile<input id="profile" placeholder="default"></label>
      </div>
      <div class="row"><button id="pick">Pick element</button><button id="inspect">Last/focused</button><button id="scan">Page scan</button></div>
      <div class="row"><button id="copy-json">Copy JSON</button><button id="copy-header">Copy header</button><button id="clear">Clear</button><button id="toggle">Show JSON</button></div>
      <div class="row"><button id="pin-parent">Use current as parent</button><button id="clear-parent">Clear parent</button></div>
      <div class="power"><strong>Power tools</strong><div class="row"><button id="copy-selector">Copy selector</button><button id="copy-probe">Copy JS probe</button><a href="${SOURCE_URL}" target="_blank" rel="noopener">GitHub</a><a href="${RAW_URL}" target="_blank" rel="noopener">Raw</a></div></div>
      <div class="status">Idle.</div><pre hidden>{}</pre>
    </div>`;
  document.documentElement.append(host);

  const $=s=>shadow.querySelector(s);
  const status=t=>$('.status').textContent=t;
  const render=r=>{result=r;$('pre').textContent=JSON.stringify(r,null,2);};
  const prefs=getPrefs();
  $('#friendly').value=prefs.friendlyName||'';
  $('#tags').value=(prefs.tags||[]).join(', ');
  $('#profile').value=prefs.profileId||'default';

  function saveMetaInputs() {
    return setPrefs({
      friendlyName:$('#friendly').value.trim(),
      tags:parseTags($('#tags').value),
      profileId:$('#profile').value.trim() || 'default'
    });
  }
  for (const id of ['#friendly','#tags','#profile']) $(id).addEventListener('change',saveMetaInputs);

  async function captureEvent(e) {
    if (e.composedPath?.().includes(host)) return;
    const els=composedElements(e);
    if (els[0]) lastTarget=els[0];
    if (!pickMode) return;
    if (sameGesture(e)) return;
    pickMode=null;
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    const target=els[0]||e.target;
    saveMetaInputs();
    setTimeout(async()=>{render(await inspect(target,e.type,'element-pick'));status(`Captured ${target?.tagName||'element'} via ${e.type}.`);},0);
  }

  for (const type of ['pointerdown','touchstart','mousedown']) {
    document.addEventListener(type,captureEvent,{capture:true,passive:false});
  }
  document.addEventListener('click',e=>{
    if(e.composedPath?.().includes(host))return;
    if(pickMode){captureEvent(e);return;}
    if(lastGesture.at && performance.now()-lastGesture.at<700 && result?.header?.captureType==='element'){
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
    }
  },true);
  document.addEventListener('focusin',e=>{if(!e.composedPath?.().includes(host)&&e.target instanceof Element)lastTarget=e.target;},true);

  $('.launch').onclick=()=>{$('.panel').hidden=false;$('.launch').hidden=true;};
  $('.hide').onclick=()=>{$('.panel').hidden=true;$('.launch').hidden=false;};
  $('#pick').onclick=()=>{pickMode='element';status('Tap/click the element to inspect. The selected gesture will be intercepted.');};
  $('#inspect').onclick=async()=>{const el=lastTarget||document.activeElement;if(!(el instanceof Element)||el===document.body)return status('Tap or focus an element first.');saveMetaInputs();render(await inspect(el,'manual','last-focused'));status('Captured last/focused element.');};
  $('#scan').onclick=async()=>{saveMetaInputs();render(await pageScan());status(`Page scan captured ${result?.data?.elements?.length||0} candidates.`);};
  $('#clear').onclick=()=>{render({});lastTarget=null;pickMode=null;status('Capture cleared. Metadata preferences retained.');};
  $('#toggle').onclick=()=>{const p=$('pre');p.hidden=!p.hidden;$('#toggle').textContent=p.hidden?'Show JSON':'Hide JSON';};
  $('#copy-json').onclick=async()=>status(await copyText(JSON.stringify(result,null,2))?'JSON copied.':'Copy failed.');
  $('#copy-header').onclick=async()=>status(await copyText(JSON.stringify(result?.header||{},null,2))?'Header copied.':'Copy failed.');
  $('#pin-parent').onclick=()=>{if(!result?.header?.captureId)return status('Capture something first.');parentCaptureId=result.header.captureId;status(`Parent pinned: ${parentCaptureId}`);};
  $('#clear-parent').onclick=()=>{parentCaptureId=null;status('Parent link cleared.');};
  $('#copy-selector').onclick=async()=>{const el=lastTarget;if(!(el instanceof Element))return status('Inspect an element first.');status(await copyText(selectorFor(el)||'')?'Selector copied.':'Copy failed.');};
  $('#copy-probe').onclick=async()=>{const el=lastTarget;if(!(el instanceof Element))return status('Inspect an element first.');status(await copyText(consoleProbe(el))?'Console probe copied.':'Copy failed.');};
})();