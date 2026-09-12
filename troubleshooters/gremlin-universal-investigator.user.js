// ==UserScript==
// @name         Gremlin Universal Investigator
// @namespace    local.gremlin.investigator
// @version      0.3.0
// @description  Read-only cross-site DOM/action investigator with Safari/iPad touch interception and ImageTrend enrichment.
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

  const VERSION = '0.3.0';
  const HOST_ID = 'gremlin-universal-investigator';
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
  let lastGesture = { key:'', at:0 };

  function composedElements(e) {
    const path = typeof e?.composedPath === 'function' ? e.composedPath() : [];
    const els = path.filter(x => x instanceof Element);
    if (els.length) return els;
    return e?.target instanceof Element ? [e.target] : [];
  }

  function gestureKey(e) {
    const els = composedElements(e);
    const el = els[0];
    return `${e.type}|${el?.tagName||''}|${el?.id||''}|${Math.round(e.timeStamp||performance.now())}`;
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

  function inspect(el, eventType=null) {
    return {
      investigatorVersion: VERSION,
      captureType: 'element',
      capturedAt: new Date().toISOString(),
      page: {
        origin: location.origin,
        pathname: location.pathname,
        title: document.title,
        platform: navigator.platform || null,
        userAgent: navigator.userAgent,
        touchPoints: navigator.maxTouchPoints || 0,
        imageTrend: isImageTrend
      },
      element: genericElement(el,eventType),
      imageTrend: imageTrendMeta(el),
      knockout: koContextSummary(el),
      ancestors: (()=>{const out=[];let n=el;for(let i=0;n&&i<8;i++,n=n.parentElement)out.push(genericElement(n,eventType));return out;})(),
      notes:[
        'Read-only investigator capture.',
        'Input values are intentionally excluded from exported attributes.',
        'Capture-phase pointer/touch listeners are used for iPad/Safari compatibility.',
        'ImageTrend metadata is added only when ImageTrend/Knockout context is present.'
      ]
    };
  }

  function pageScan() {
    const candidates = [...document.querySelectorAll('button,a[href],input,select,textarea,[role],[data-bind],[onclick]')].slice(0,1200);
    return {
      investigatorVersion: VERSION,
      captureType:'page-scan',
      capturedAt:new Date().toISOString(),
      page:{origin:location.origin,pathname:location.pathname,title:document.title,imageTrend:isImageTrend},
      counts:{candidates:candidates.length,buttons:document.querySelectorAll('button,[role="button"]').length,links:document.links.length,inputs:document.querySelectorAll('input,select,textarea').length},
      elements:candidates.map(el=>genericElement(el)).filter(Boolean)
    };
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
    :host{font:12px system-ui;color:#e6edf3}button,a{font:inherit}.launch{width:38px;height:38px;border-radius:999px;border:1px solid #2dd4bf;background:#111827;color:#d1fae5;font-weight:800;box-shadow:0 4px 14px #0007}.panel{width:350px;max-width:88vw;max-height:68vh;overflow:auto;background:#0f1720;border:1px solid #2dd4bf;border-radius:10px;padding:9px;box-shadow:0 10px 28px #0008}.head{display:flex;justify-content:space-between;align-items:center}.hide{border:0;background:transparent;color:#e6edf3;font-size:18px}.row{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}.row button,.row a{padding:5px 7px;color:#e6edf3;background:#17212b;border:1px solid #2dd4bf;border-radius:7px;text-decoration:none;cursor:pointer}.status{font-size:11px;margin:5px 0;color:#99f6e4}.summary{color:#94a3b8;font-size:11px}.power{border-top:1px solid #334155;margin-top:7px;padding-top:7px}pre{white-space:pre-wrap;word-break:break-word;background:#09111a;color:#cbd5e1;border:1px solid #334155;padding:6px;border-radius:6px;max-height:200px;overflow:auto;font-size:10px}pre[hidden]{display:none}</style>
    <button class="launch" title="Gremlin Investigator">GI</button>
    <div class="panel" hidden>
      <div class="head"><strong>Universal Investigator ${VERSION}</strong><button class="hide">×</button></div>
      <div class="summary">Read-only. Works on ordinary sites; adds ImageTrend metadata when available.</div>
      <div class="row"><button id="pick">Pick element</button><button id="inspect">Last/focused</button><button id="scan">Page scan</button></div>
      <div class="row"><button id="copy-json">Copy JSON</button><button id="clear">Clear</button><button id="toggle">Show JSON</button></div>
      <div class="power"><strong>Power tools</strong><div class="row"><button id="copy-selector">Copy selector</button><button id="copy-probe">Copy JS probe</button><a href="${SOURCE_URL}" target="_blank" rel="noopener">GitHub</a><a href="${RAW_URL}" target="_blank" rel="noopener">Raw</a></div></div>
      <div class="status">Idle.</div><pre hidden>{}</pre>
    </div>`;
  document.documentElement.append(host);

  const $=s=>shadow.querySelector(s);
  const status=t=>$('.status').textContent=t;
  const render=r=>{result=r;$('pre').textContent=JSON.stringify(r,null,2);};

  function captureEvent(e) {
    if (e.composedPath?.().includes(host)) return;
    const els=composedElements(e);
    if (els[0]) lastTarget=els[0];
    if (!pickMode) return;
    if (sameGesture(e)) return;
    const mode=pickMode;
    pickMode=null;
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    const target=els[0]||e.target;
    setTimeout(()=>{render(inspect(target,e.type));status(`Captured ${target?.tagName||'element'} via ${e.type}.`);},0);
  }

  for (const type of ['pointerdown','touchstart','mousedown']) {
    document.addEventListener(type,captureEvent,{capture:true,passive:false});
  }
  document.addEventListener('click',e=>{
    if(e.composedPath?.().includes(host))return;
    if(pickMode){captureEvent(e);return;}
    if(lastGesture.at && performance.now()-lastGesture.at<700 && result?.captureType==='element'){
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
    }
  },true);
  document.addEventListener('focusin',e=>{if(!e.composedPath?.().includes(host)&&e.target instanceof Element)lastTarget=e.target;},true);

  $('.launch').onclick=()=>{$('.panel').hidden=false;$('.launch').hidden=true;};
  $('.hide').onclick=()=>{$('.panel').hidden=true;$('.launch').hidden=false;};
  $('#pick').onclick=()=>{pickMode='element';status('Tap/click the element to inspect. The selected gesture will be intercepted.');};
  $('#inspect').onclick=()=>{const el=lastTarget||document.activeElement;if(!(el instanceof Element)||el===document.body)return status('Tap or focus an element first.');render(inspect(el,'manual'));status('Captured last/focused element.');};
  $('#scan').onclick=()=>{render(pageScan());status(`Page scan captured ${result?.elements?.length||0} candidates.`);};
  $('#clear').onclick=()=>{render({});lastTarget=null;pickMode=null;status('Cleared.');};
  $('#toggle').onclick=()=>{const p=$('pre');p.hidden=!p.hidden;$('#toggle').textContent=p.hidden?'Show JSON':'Hide JSON';};
  $('#copy-json').onclick=async()=>status(await copyText(JSON.stringify(result,null,2))?'JSON copied.':'Copy failed.');
  $('#copy-selector').onclick=async()=>{const el=lastTarget;if(!(el instanceof Element))return status('Inspect an element first.');status(await copyText(selectorFor(el)||'')?'Selector copied.':'Copy failed.');};
  $('#copy-probe').onclick=async()=>{const el=lastTarget;if(!(el instanceof Element))return status('Inspect an element first.');status(await copyText(consoleProbe(el))?'Console probe copied.':'Copy failed.');};
})();