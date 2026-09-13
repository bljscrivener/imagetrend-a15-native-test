// ==UserScript==
// @name         Gremlin Universal Investigator 0.3.5
// @namespace    local.gremlin.investigator
// @version      0.3.5
// @description  Read-only DOM investigator with stale-safe direct file handoff for iPad/Safari.
// @match        http://*/*
// @match        https://*/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const HOST_ID = 'gremlin-universal-investigator';
  if (document.getElementById(HOST_ID)) return;

  const VERSION = '0.3.5';
  const SCHEMA_VERSION = 'gfi.capture/1';
  const SESSION_KEY = 'gfi.capture.session.v1';
  const POS_KEY = 'gfi.ui.position.v1';
  const isImageTrend = /(^|\.)imagetrendelite\.com$/i.test(location.hostname) || !!window.imagetrend;

  let result = null;
  let lastTarget = null;
  let pickArmed = false;
  let lastExportedCaptureId = null;

  const norm = v => (v == null ? '' : String(v)).trim();
  const unwrap = v => {
    try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
    catch { return undefined; }
  };
  const primitive = v => v == null || ['string','number','boolean'].includes(typeof v);

  function makeId(prefix='gfi') {
    try { return `${prefix}-${crypto.randomUUID()}`; }
    catch { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
  }

  function sessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) { id = makeId('gfi-session'); sessionStorage.setItem(SESSION_KEY,id); }
      return id;
    } catch { return makeId('gfi-session'); }
  }

  function cssEscape(v) {
    try { return CSS.escape(v); }
    catch { return String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&'); }
  }

  function selectorFor(el) {
    if (!(el instanceof Element)) return null;
    if (el.id) return `#${cssEscape(el.id)}`;
    const parts=[]; let n=el;
    for (let d=0;n&&n.nodeType===1&&d<7;d++,n=n.parentElement) {
      let p=n.tagName.toLowerCase();
      const cls=[...n.classList].filter(Boolean).slice(0,2);
      if (cls.length) p += cls.map(c=>`.${cssEscape(c)}`).join('');
      const parent=n.parentElement;
      if (parent) {
        const sib=[...parent.children].filter(x=>x.tagName===n.tagName);
        if (sib.length>1) p += `:nth-of-type(${sib.indexOf(n)+1})`;
      }
      parts.unshift(p);
      try { if (document.querySelectorAll(parts.join(' > ')).length===1) return parts.join(' > '); } catch {}
    }
    return parts.join(' > ');
  }

  function safeAttrs(el) {
    const out={}; if (!(el instanceof Element)) return out;
    for (const a of [...el.attributes].slice(0,80)) {
      if (/^(value|srcdoc|nonce)$/i.test(a.name)) continue;
      let v=a.value;
      if (/^(href|src|action|formaction)$/i.test(a.name)) {
        try { const u=new URL(v,location.href); v=`${u.origin}${u.pathname}`; } catch {}
      }
      out[a.name]=String(v).slice(0,500);
    }
    return out;
  }

  function eventBindings(el) {
    const out={}; if (!(el instanceof Element)) return out;
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name)||a.name==='data-bind'||/^data-(action|event|click|command)/i.test(a.name)) out[a.name]=a.value.slice(0,1500);
    }
    return out;
  }

  function genericElement(el,eventType=null) {
    if (!(el instanceof Element)) return null;
    const r=el.getBoundingClientRect?.();
    return {
      selector:selectorFor(el), tag:el.tagName, id:el.id||null,
      classes:typeof el.className==='string'?el.className:null,
      role:el.getAttribute('role'), type:el.getAttribute('type'), name:el.getAttribute('name'),
      ariaLabel:el.getAttribute('aria-label'), text:norm(el.textContent).replace(/\s+/g,' ').slice(0,500),
      attributes:safeAttrs(el), eventBindings:eventBindings(el), eventType,
      rect:r?{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}:null
    };
  }

  function imageTrendMeta(el) {
    if (!isImageTrend || !(el instanceof Element)) return null;
    const chain=[]; for(let n=el,i=0;n&&i<14;i++,n=n.parentElement) chain.push(n);
    const keys=['FormID','ControlID','Label','BindingPath','BindingPathEntryID','ControlType','PresetValueDefinitionID'];
    const out={};
    for (const n of chain) {
      let d; try { d=window.ko?.contextFor?.(n)?.$data; } catch {}
      if (!d) continue;
      for (const k of keys) {
        if (out[k]!=null) continue;
        const v=unwrap(d[k]); if (v!=null&&v!=='') out[k]=v;
      }
    }
    return Object.keys(out).length?out:null;
  }

  function koSummary(el) {
    if (!window.ko?.contextFor || !(el instanceof Element)) return null;
    const contexts=[]; const seen=new Set(); let n=el;
    for(let depth=0;n&&depth<12;depth++,n=n.parentElement){
      let d; try { d=window.ko.contextFor(n)?.$data; } catch { continue; }
      if (!d||seen.has(d)) continue; seen.add(d);
      const likely={};
      for (const k of Object.keys(d).slice(0,220)) {
        if (!/(id|label|type|binding|control|resource|selected|option|value|action|click|route|license|provider|attachment|vital|procedure|medication|assessment)/i.test(k)) continue;
        let v; try { v=unwrap(d[k]); } catch { continue; }
        if (primitive(v)) likely[k]=v;
        else if (Array.isArray(v)) likely[k]={type:'array',length:v.length};
        else if (v&&typeof v==='object') likely[k]={type:'object',keys:Object.keys(v).slice(0,60)};
      }
      contexts.push({depth,tag:n.tagName,id:n.id||null,likely});
    }
    return contexts;
  }

  function sourceIdFor(el,meta) { return meta?.BindingPathEntryID||meta?.ControlID||el?.id||selectorFor(el)||location.pathname; }

  async function envelope(captureType,captureMethod,sourceId,data,provenance={}) {
    const capturedAt=new Date().toISOString();
    return {
      header:{
        schemaVersion:SCHEMA_VERSION, investigatorVersion:VERSION,
        captureId:makeId('gfi'), sessionId:sessionId(), captureType,captureMethod,capturedAt,
        sourceId:sourceId||location.pathname, status:'raw',
        provenance:{source:'dom',adapter:isImageTrend?'imagetrend':'generic-dom',derived:false,...provenance},
        page:{origin:location.origin,pathname:location.pathname,title:document.title,imageTrend:isImageTrend},
        investigatorPolicy:{mode:'read-only',mutationAllowed:false}
      },
      data,
      notes:['Read-only investigator capture.','Input values are intentionally excluded from exported attributes.','GFI does not invoke site actions, setters, clicks, submits, or field writes.']
    };
  }

  async function inspect(el,eventType='manual',method='element-pick') {
    const meta=imageTrendMeta(el);
    return envelope('element',method,sourceIdFor(el,meta),{
      element:genericElement(el,eventType), imageTrend:meta, knockout:koSummary(el),
      ancestors:(()=>{const a=[];let n=el;for(let i=0;n&&i<8;i++,n=n.parentElement)a.push(genericElement(n,eventType));return a;})()
    },{eventType});
  }

  async function pageScan() {
    const els=[...document.querySelectorAll('button,a[href],input,select,textarea,[role],[data-bind],[onclick]')].slice(0,1500);
    return envelope('page-scan','page-scan',location.pathname,{counts:{candidates:els.length},elements:els.map(e=>genericElement(e)).filter(Boolean)},{scope:'page'});
  }

  function filenameFor(capture) {
    const h=capture.header; const ts=String(h.capturedAt||new Date().toISOString()).replace(/[:.]/g,'-');
    const id=String(h.captureId||'no-id').replace(/[^a-zA-Z0-9_-]/g,'').slice(-18);
    const type=String(h.captureType||'capture').replace(/[^a-zA-Z0-9_-]/g,'-');
    return `${type}-${ts}-${id}.txt`;
  }

  function serialize(capture) {
    return `GFI NORMALIZED CAPTURE\nSchema: ${SCHEMA_VERSION}\nInvestigator: ${VERSION}\nCapture-ID: ${capture.header.captureId}\nCaptured: ${capture.header.capturedAt}\nPage: ${capture.header.page?.title||''}\nOrigin: ${capture.header.page?.origin||''}\n\n--- JSON ---\n${JSON.stringify(capture,null,2)}`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      try { const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0'; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); return true; } catch { return false; }
    }
  }

  function downloadCurrent(capture) {
    if (!capture?.header?.captureId) return {ok:false,reason:'empty'};
    const filename=filenameFor(capture), text=serialize(capture), blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename; a.style.display='none'; document.documentElement.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),3000);
    lastExportedCaptureId=capture.header.captureId;
    return {ok:true,filename,captureId:capture.header.captureId};
  }

  async function sendCurrent(capture) {
    if (!capture?.header?.captureId) return {ok:false,reason:'empty'};
    const filename=filenameFor(capture), text=serialize(capture), file=new File([text],filename,{type:'text/plain',lastModified:Date.now()});
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
        await navigator.share({files:[file],title:`GFI ${capture.header.captureType}`,text:`GFI ${capture.header.captureId} — send this file to ChatGPT.`});
        lastExportedCaptureId=capture.header.captureId;
        return {ok:true,mode:'share',filename,captureId:capture.header.captureId};
      }
    } catch (e) {
      if (e?.name==='AbortError') return {ok:false,reason:'cancelled'};
    }
    const d=downloadCurrent(capture); return {...d,mode:'download'};
  }

  const host=document.createElement('div'); host.id=HOST_ID; host.style.cssText='position:fixed;right:14px;bottom:120px;z-index:2147483647';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
  :host{font:13px system-ui;color:#e5eef5}.p{width:300px;background:#102536;border:1px solid #507894;border-radius:14px;padding:10px;box-shadow:0 8px 26px #0008}.h{display:flex;align-items:center;justify-content:space-between}.v{font-size:11px;color:#b9c8d4}.g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}button{font:inherit;padding:9px;border-radius:9px;border:1px solid #5f89a4;background:#18364b;color:#eaf4fb}.send{background:#176a48}.clear{background:#6a3939}.s{margin-top:8px;background:#0b1c29;padding:7px 9px;border-radius:8px;font-size:11px;word-break:break-word}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#6ee7a8;margin-right:5px}.mini{padding:6px 9px}.tiny{width:42px;height:42px;border-radius:50%;background:#102536;border:2px solid #507894;color:white;font-weight:800}.row{display:flex;gap:8px;margin-top:8px}.row button{flex:1;padding:7px}.help{display:none;font-size:11px;color:#c8d5de;margin-top:8px}.id{font-family:ui-monospace,monospace}
  </style><button class="tiny" hidden>GFI</button><div class="p"><div class="h"><b>GFI</b><span class="v"><span class="dot"></span>IDLE &nbsp; v${VERSION}</span><button class="mini">Mini</button></div><div class="g"><button id="inspect">Inspect</button><button id="scan">Scan</button><button id="send" class="send">Send</button><button id="clear" class="clear">Clear</button><button id="save">Save</button><button id="copy">Copy</button></div><div class="row"><button id="help">Help</button><button id="reset">Reset pos</button></div><div class="s">Ready · file-first · read-only.</div><div class="help">Inspect arms one blocked tap. Scan inventories the visible page. Send creates a brand-new file from the current capture at tap time and opens the native share sheet; choose ChatGPT. Save downloads the same current capture. Copy copies the full current capture text. Each export filename includes the capture timestamp + capture ID suffix.</div></div>`;
  document.documentElement.append(host);
  const $=s=>shadow.querySelector(s), panel=$('.p'), tiny=$('.tiny'), stat=$('.s');
  const status=t=>{stat.textContent=t};
  function setResult(r){result=r; const id=r?.header?.captureId||''; status(id?`Captured ${r.header.captureType} · ${id.slice(-8)} · ${new Date(r.header.capturedAt).toLocaleTimeString()}`:'Ready · file-first · read-only.');}

  $('#inspect').onclick=()=>{pickArmed=true; status('ARMED · tap the element to inspect; underlying action will be blocked.');};
  $('#scan').onclick=async()=>{setResult(await pageScan());};
  $('#send').onclick=async()=>{const current=result; const r=await sendCurrent(current); if(r.ok) status(`Sent ${r.captureId.slice(-8)} · ${r.filename}`); else status(r.reason==='cancelled'?'Share cancelled.':'Capture something first.');};
  $('#save').onclick=()=>{const current=result; const r=downloadCurrent(current); status(r.ok?`Saved ${r.captureId.slice(-8)} · ${r.filename}`:'Capture something first.');};
  $('#copy').onclick=async()=>{const current=result; if(!current) return status('Capture something first.'); const ok=await copyText(serialize(current)); status(ok?`Copied ${current.header.captureId.slice(-8)} · full current capture`:'Clipboard failed. Use Send or Save.');};
  $('#clear').onclick=()=>{result=null;lastTarget=null;pickArmed=false;lastExportedCaptureId=null;status('Cleared.');};
  $('#help').onclick=()=>{$('.help').style.display=$('.help').style.display==='block'?'none':'block';};
  $('#reset').onclick=()=>{host.style.right='14px';host.style.bottom='120px';host.style.left='';host.style.top='';try{localStorage.removeItem(POS_KEY);}catch{}status('Position reset.');};
  $('.mini').onclick=()=>{panel.hidden=true;tiny.hidden=false;}; tiny.onclick=()=>{tiny.hidden=true;panel.hidden=false;};

  function captureEvent(e){
    if (e.composedPath?.().includes(host)) return;
    const target=e.composedPath?.().find(x=>x instanceof Element) || e.target;
    if (target instanceof Element) lastTarget=target;
    if (!pickArmed) return;
    pickArmed=false; e.preventDefault?.(); e.stopImmediatePropagation?.();
    setTimeout(async()=>setResult(await inspect(target,e.type,'element-pick')),0);
  }
  for (const t of ['pointerdown','touchstart','mousedown']) document.addEventListener(t,captureEvent,{capture:true,passive:false});
  document.addEventListener('focusin',e=>{if(!e.composedPath?.().includes(host)&&e.target instanceof Element) lastTarget=e.target;},true);
})();
