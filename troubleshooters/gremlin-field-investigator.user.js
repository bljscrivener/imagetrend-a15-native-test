// ==UserScript==
// @name         Gremlin Field Investigator
// @namespace    local.imagetrend.gremlin.investigator
// @version      0.2.4
// @description  Read-only ImageTrend field, binding, resource, and action investigator with compact iPad UI.
// @match        https://*.imagetrendelite.com/Elite/*
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-field-investigator.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-field-investigator.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('gremlin-field-investigator')) return;

  const HOST_ID = 'gremlin-field-investigator';
  const VERSION = '0.2.4';
  const FIELD_MAPPING_VERSION = '3-investigator';
  const ACTION_MAPPING_VERSION = '4-action-investigator';
  const FIELD_ATTRS = [
    'bindingpathentryid','binding-path-entry-id','data-bindingpathentryid','data-binding-path-entry-id',
    'bindingpath','binding-path','data-bindingpath','data-binding-path',
    'controlid','control-id','data-controlid','data-control-id'
  ];
  const META_KEYS = ['FormID','ControlID','Label','BindingPath','BindingPathEntryID','ControlType','PresetValueDefinitionID'];

  const norm = v => (v == null ? '' : String(v)).trim();
  const unwrap = v => {
    try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
    catch { return undefined; }
  };
  const primitive = v => v == null || ['string','number','boolean'].includes(typeof v);

  function attrs(el) {
    const out = {};
    if (!el?.attributes) return out;
    for (const a of el.attributes) {
      const k = a.name.toLowerCase();
      if (FIELD_ATTRS.includes(k) || /binding|control|entry|field|question|resource/i.test(k)) out[a.name] = a.value;
    }
    return out;
  }

  function readAttr(el, names) {
    for (let n of names) {
      const exact = el?.getAttribute?.(n);
      if (exact != null && exact !== '') return exact;
      n = n.toLowerCase();
      for (const a of el?.attributes || []) if (a.name.toLowerCase() === n && a.value) return a.value;
    }
    return null;
  }

  function contextChain(start) {
    const out = [];
    let el = start instanceof Element ? start : null;
    for (let i = 0; el && i < 16; i++, el = el.parentElement) {
      try {
        const ctx = window.ko?.contextFor?.(el);
        if (ctx?.$data && !out.some(x => x.data === ctx.$data)) out.push({el,data:ctx.$data,ctx});
      } catch {}
    }
    return out;
  }

  function nearestFieldNode(start) {
    const chain = contextChain(start);
    const withMeta = chain.find(x => META_KEYS.some(k => unwrap(x.data?.[k]) != null && unwrap(x.data?.[k]) !== ''));
    if (withMeta) return withMeta.el;
    let el = start instanceof Element ? start : null;
    for (let i = 0; el && i < 12; i++, el = el.parentElement) {
      const a = attrs(el);
      if (Object.keys(a).length || el.matches?.('select,input,textarea,[data-bind],[data-control-id],[data-controlid]')) return el;
    }
    return start instanceof Element ? start : document.activeElement;
  }

  function dedupeOptions(items) {
    const seen = new Set();
    return items.filter(x => {
      const key = `${x.label||''}\u0000${x.value||''}\u0000${x.id||''}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function visibleOptionText(el) {
    const items = [];
    if (el?.tagName === 'SELECT') {
      for (const o of el.options) items.push({ label: norm(o.textContent), value: norm(o.value), selected: !!o.selected, source: 'select' });
    }
    const root = el?.closest?.('.grid-flyout-active,[role="dialog"],.modal') || document;
    for (const o of root.querySelectorAll?.('[role="option"],option,.k-item,.ui-menu-item,[data-value]') || []) {
      const label = norm(o.textContent);
      const value = norm(o.getAttribute?.('data-value') || o.getAttribute?.('value'));
      if (label || value) items.push({ label, value, source: 'dom' });
    }
    return dedupeOptions(items).slice(0, 500);
  }

  function optionFromObject(o, source) {
    if (!o || typeof o !== 'object') return null;
    const labelKeys = ['Value','Label','Text','Name','DisplayName','Description','Title'];
    const valueKeys = ['Id','ID','ValueID','Code','Key','Value','NemsisCode'];
    let label = '', value = '';
    for (const k of labelKeys) {
      const v = unwrap(o[k]);
      if (primitive(v) && norm(v)) { label = norm(v); break; }
    }
    for (const k of valueKeys) {
      const v = unwrap(o[k]);
      if (primitive(v) && norm(v)) { value = norm(v); break; }
    }
    if (!label && !value) return null;
    return {label,value,source,rawKeys:Object.keys(o).slice(0,30)};
  }

  function traceOptionSources(start) {
    const results = [];
    const visited = new WeakSet();
    const addArray = (arr,path,depth) => {
      if (!Array.isArray(arr) || !arr.length || arr.length > 1000) return;
      const opts = dedupeOptions(arr.map(x => optionFromObject(unwrap(x), path)).filter(Boolean));
      if (opts.length >= 2) results.push({path,depth,count:arr.length,options:opts.slice(0,300)});
    };
    const walk = (obj,path,depth) => {
      obj = unwrap(obj);
      if (!obj || typeof obj !== 'object' || depth > 4 || visited.has(obj)) return;
      visited.add(obj);
      if (Array.isArray(obj)) { addArray(obj,path,depth); return; }
      for (const k of Object.keys(obj).slice(0,180)) {
        if (/patient|incident|narrative|address|name|dob|birth|phone|email/i.test(k) && !/displayname|resourceName/i.test(k)) continue;
        let v; try { v = unwrap(obj[k]); } catch { continue; }
        const childPath = `${path}.${k}`;
        if (Array.isArray(v)) addArray(v,childPath,depth+1);
        else if (v && typeof v === 'object' && /(option|choice|item|element|resource|value|list|data|control|detail|definition|size|location|route|unit)/i.test(k)) walk(v,childPath,depth+1);
      }
    };
    for (const [i,x] of contextChain(start).entries()) {
      walk(x.data,`koContext[${i}].$data`,0);
      try { if (x.ctx?.$parent) walk(x.ctx.$parent,`koContext[${i}].$parent`,0); } catch {}
    }
    const fc = window.imagetrend?.formComposer;
    if (fc) {
      for (const k of Object.keys(fc).filter(k=>/(resource|option|control|form|definition|element|size|location)/i.test(k)).slice(0,80)) {
        try { walk(fc[k],`formComposer.${k}`,0); } catch {}
      }
    }
    const seen = new Set();
    return results.filter(r => {
      const sig = r.options.slice(0,20).map(o=>`${o.label}|${o.value}`).join('||');
      if (!sig || seen.has(sig)) return false;
      seen.add(sig); return true;
    }).slice(0,80);
  }

  function koSnapshot(el) {
    const chain = contextChain(el);
    if (!chain.length) return null;
    const data = chain[0].data;
    const keys = Object.keys(data).slice(0,180);
    const likely = {};
    for (const k of keys) {
      if (!/(id|value|option|answer|binding|control|resource|element|question|label|text|selected|licensure|dose|route|location|size|type|preset)/i.test(k)) continue;
      const v = unwrap(data[k]);
      if (primitive(v)) likely[k] = v;
      else if (Array.isArray(v)) likely[k] = { type:'array', length:v.length };
      else if (typeof v === 'object' && v) likely[k] = { type:'object', keys:Object.keys(v).slice(0,40) };
    }
    return {keys,likely,contextDepth:chain.length};
  }

  function flattenResources() {
    const resources = window.imagetrend?.formComposer?.agencyResources || {};
    const rows = [];
    for (const [resourceKey, resource] of Object.entries(resources)) {
      const elements = Array.isArray(resource?.Elements) ? resource.Elements : [];
      for (const e of elements) rows.push({
        resourceKey,
        resourceId:norm(resource?.Id || resource?.ID || resource?.ResourceId),
        elementId:norm(e?.Id || e?.ID),
        value:norm(e?.Value ?? e?.Text ?? e?.Label ?? e?.Name),
        code:norm(e?.Code ?? e?.NemsisCode ?? e?.Key),
        parentId:norm(e?.ParentId ?? e?.ParentID),
        rawKeys:Object.keys(e || {}).slice(0,30)
      });
    }
    return rows;
  }

  function resourceMatches(meta, koInfo, options) {
    const rows = flattenResources();
    const needles = [...new Set([
      meta.BindingPathEntryID,meta.ControlID,meta.BindingPath,meta.ControlType,
      ...Object.values(koInfo?.likely || {}).filter(v=>primitive(v)).map(String),
      ...options.flatMap(o=>[o.value,o.label])
    ].map(norm).filter(x=>x.length>=2))];
    const scored = [];
    for (const r of rows) {
      let score = 0;
      for (const n of needles) {
        if (r.elementId===n) score+=8;
        if (r.resourceId===n || r.resourceKey===n) score+=7;
        if (r.code===n) score+=5;
        if (r.value===n) score+=4;
        if (r.parentId===n) score+=3;
      }
      if (score) scored.push({...r,score});
    }
    return scored.sort((a,b)=>b.score-a.score).slice(0,250);
  }

  function fieldMeta(el) {
    const chain = [];
    let cur = el;
    for (let i=0;cur&&i<12;i++,cur=cur.parentElement) chain.push(cur);
    const getAttr = names => {
      for (const node of chain) { const v=readAttr(node,names); if(v) return v; }
      return null;
    };
    const koChain = contextChain(el);
    const getKo = key => {
      for (const x of koChain) { const v=unwrap(x.data?.[key]); if(v!=null&&v!=='') return v; }
      return null;
    };
    return {
      BindingPathEntryID:getAttr(['BindingPathEntryID','data-bindingpathentryid','binding-path-entry-id','data-binding-path-entry-id']) || getKo('BindingPathEntryID'),
      BindingPath:getAttr(['BindingPath','data-bindingpath','binding-path','data-binding-path']) || getKo('BindingPath'),
      ControlID:getAttr(['ControlID','data-controlid','control-id','data-control-id']) || getKo('ControlID'),
      Label:getKo('Label'),
      ControlType:getKo('ControlType'),
      FormID:getKo('FormID'),
      PresetValueDefinitionID:getKo('PresetValueDefinitionID'),
      tag:el?.tagName||null,
      type:el?.getAttribute?.('type')||null,
      id:el?.id||null,
      name:el?.getAttribute?.('name')||null,
      classes:el?.className&&typeof el.className==='string'?el.className:null,
      attributes:attrs(el)
    };
  }

  function inspectElement(el) {
    const node=nearestFieldNode(el);
    const meta=fieldMeta(node);
    const options=visibleOptionText(node);
    const koInfo=koSnapshot(node);
    return {
      investigatorVersion:VERSION,
      mappingVersion:FIELD_MAPPING_VERSION,
      captureType:'field',
      capturedAt:new Date().toISOString(),
      route:location.pathname,
      field:meta,
      options,
      optionSources:traceOptionSources(node),
      ko:koInfo,
      resourceMatches:resourceMatches(meta,koInfo,options),
      notes:[
        'Read-only capture. No chart write was attempted.',
        'Field metadata may be promoted from the nearest Knockout control context when Safari interceptors obscure the DOM node.',
        'Option sources are read-only candidates discovered from live control/view-model arrays; verify ownership before integration.',
        'Patient-entered scalar values are intentionally not exported.'
      ]
    };
  }

  function scanVisibleFields() {
    const roots=[document.querySelector('#form-composer'),...document.querySelectorAll('.grid-flyout-active,[role="dialog"],.modal')].filter(Boolean);
    const seen=new Set(),out=[];
    for(const root of roots.length?roots:[document]) {
      const nodes=root.querySelectorAll('[BindingPathEntryID],[bindingpathentryid],[data-bindingpathentryid],[data-binding-path-entry-id],[BindingPath],[bindingpath],[data-bindingpath],[data-binding-path],[ControlID],[controlid],[data-controlid],[data-control-id],select,input,textarea,.interceptor');
      for(const el of nodes) {
        const node=nearestFieldNode(el),meta=fieldMeta(node);
        const key=`${meta.BindingPathEntryID||''}|${meta.BindingPath||''}|${meta.ControlID||''}`;
        if(!key.replace(/\|/g,'')||seen.has(key)) continue;
        seen.add(key);
        const options=visibleOptionText(node),koInfo=koSnapshot(node);
        out.push({field:meta,options,optionSources:traceOptionSources(node),ko:koInfo,resourceMatches:resourceMatches(meta,koInfo,options)});
      }
    }
    return {investigatorVersion:VERSION,mappingVersion:FIELD_MAPPING_VERSION,captureType:'field-scan',capturedAt:new Date().toISOString(),route:location.pathname,fields:out};
  }

  function actionCandidate(el) {
    if (!(el instanceof Element)) return false;
    const bind = norm(el.getAttribute('data-bind'));
    return el.matches('button,[role="button"],a[href],input[type="button"],input[type="submit"],.grid-button,.top-pane-button,.loginButton,.link') || /(?:^|[,\s])(?:click|submit)\s*:/i.test(bind) || /event\s*:\s*\{/i.test(bind);
  }

  function safeActionAttributes(el) {
    const keep = ['type','id','name','class','role','title','aria-label','href','data-bind','disabled','style'];
    const out = {};
    for (const k of keep) {
      const v = el.getAttribute?.(k);
      if (v != null && v !== '') out[k] = v;
    }
    return out;
  }

  function actionMeta(el) {
    const rect = el.getBoundingClientRect?.();
    return {
      text:norm(el.textContent).replace(/\s+/g,' ').slice(0,300),
      tag:el.tagName||null,
      type:el.getAttribute?.('type')||null,
      id:el.id||null,
      name:el.getAttribute?.('name')||null,
      classes:typeof el.className==='string'?el.className:null,
      role:el.getAttribute?.('role')||null,
      title:el.getAttribute?.('title')||null,
      ariaLabel:el.getAttribute?.('aria-label')||null,
      href:el.getAttribute?.('href')||null,
      onclickAttribute:el.getAttribute?.('onclick')||null,
      dataBind:el.getAttribute?.('data-bind')||null,
      attributes:safeActionAttributes(el),
      rect:rect?{x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)}:null,
      ancestors:[...function*(){let n=el;for(let i=0;n&&i<8;i++,n=n.parentElement)yield{depth:i,tag:n.tagName||null,id:n.id||null,classes:typeof n.className==='string'?n.className:null,dataBind:n.getAttribute?.('data-bind')||null,role:n.getAttribute?.('role')||null,ariaLabel:n.getAttribute?.('aria-label')||null};}()]
    };
  }

  function actionKoContexts(el) {
    const out=[];
    for(const [depth,x] of contextChain(el).entries()) {
      const d=x.data;
      const dataKeys=Object.keys(d||{}).slice(0,260);
      const likelyFunctions=[];
      const interesting={};
      for(const k of dataKeys) {
        let v;
        try { v=unwrap(d[k]); } catch { continue; }
        if(typeof d[k]==='function' && /(click|open|close|show|hide|toggle|navigate|save|post|finish|transfer|select|generate|handle|display|load|move|lock|cad|validation)/i.test(k)) likelyFunctions.push(k);
        if(!/(id|label|type|binding|control|status|selected|identifier|modal|move|read|save|incident|detail|option|value|min|max|show|form)/i.test(k)) continue;
        if(primitive(v)) interesting[k]=v;
        else if(Array.isArray(v)) interesting[k]={type:'array',length:v.length};
        else if(v&&typeof v==='object') interesting[k]={type:'object',keys:Object.keys(v).slice(0,40)};
      }
      out.push({depth,tag:x.el.tagName||null,id:x.el.id||null,classes:typeof x.el.className==='string'?x.el.className:null,dataKeys,likelyFunctions:likelyFunctions.slice(0,120),interesting});
    }
    return out;
  }

  function inspectAction(el) {
    return {
      investigatorVersion:VERSION,
      mappingVersion:ACTION_MAPPING_VERSION,
      captureType:'action',
      capturedAt:new Date().toISOString(),
      route:location.pathname,
      action:actionMeta(el),
      associatedField:fieldMeta(nearestFieldNode(el)),
      koContexts:actionKoContexts(el),
      notes:[
        'Read-only action capture.',
        'The target action was intercepted before normal click execution.',
        'No ImageTrend button action was intentionally fired.',
        'Knockout function names are reported when visible in the current binding context.',
        'Associated field metadata is provided separately because action buttons may inherit the surrounding control context.'
      ]
    };
  }

  function scanActions() {
    const root=document.querySelector('#form-composer')||document.querySelector('#center-pane')||document;
    const seen=new Set(),actions=[];
    for(const el of root.querySelectorAll('button,[role="button"],a[href],input[type="button"],input[type="submit"],[data-bind],.grid-button,.top-pane-button,.loginButton,.link')) {
      if(!actionCandidate(el)) continue;
      const meta=actionMeta(el);
      const key=`${meta.tag}|${meta.id||''}|${meta.text}|${meta.dataBind||''}`;
      if(seen.has(key))continue;
      seen.add(key);
      actions.push({action:meta,koContexts:actionKoContexts(el)});
      if(actions.length>=500)break;
    }
    return {investigatorVersion:VERSION,mappingVersion:ACTION_MAPPING_VERSION,captureType:'action-scan',capturedAt:new Date().toISOString(),route:location.pathname,actions};
  }

  const host=document.createElement('div');
  host.id=HOST_ID;
  host.style.cssText='position:fixed;right:10px;bottom:10px;z-index:2147483647';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
    :host{font:12px system-ui;color:#e6edf3}button{font:inherit;cursor:pointer;color:#e6edf3;background:#17212b;border:1px solid #2dd4bf;border-radius:7px}
    .launch{border-radius:999px;padding:7px 10px;background:#111827;color:#d1fae5;box-shadow:0 4px 14px #0007}
    .panel{width:330px;max-width:84vw;max-height:56vh;overflow:auto;background:#0f1720;border:1px solid #2dd4bf;border-radius:10px;padding:9px;box-shadow:0 10px 28px #0008}
    .head{display:flex;justify-content:space-between;align-items:center}.hide{border:0;background:transparent;font-size:18px;padding:0 4px}.row{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}.row button{padding:5px 7px}.status{font-size:11px;margin:5px 0;color:#99f6e4}.jsonbar{display:flex;justify-content:space-between;align-items:center;margin-top:5px}
    pre{white-space:pre-wrap;word-break:break-word;background:#09111a;color:#cbd5e1;border:1px solid #334155;padding:6px;border-radius:6px;max-height:180px;overflow:auto;font-size:10px;margin:5px 0 0}pre[hidden]{display:none}small{display:block;line-height:1.3;color:#94a3b8}
  </style><button class="launch">Investigator</button><div class="panel" hidden><div class="head"><strong>Field Investigator ${VERSION}</strong><button class="hide">×</button></div><small>Read-only. Pick mode intercepts one tap so the ImageTrend action does not fire.</small><div class="row"><button id="pick-field">Pick field</button><button id="inspect-field">Focused field</button><button id="scan-fields">Scan fields</button></div><div class="row"><button id="pick-action">Pick action</button><button id="scan-actions">Scan actions</button></div><div class="row"><button id="copy">Copy JSON</button><button id="clear">Clear</button></div><div class="status">Idle.</div><div class="jsonbar"><small id="summary">No capture.</small><button id="toggle-json">Show JSON</button></div><pre hidden>{}</pre></div>`;
  document.body.append(host);

  const $=s=>shadow.querySelector(s);
  let result={},lastTarget=null,pickMode=null;
  const status=t=>$('.status').textContent=t;
  const summarize=r=>{
    if(r.captureType==='field')return r.field?.Label||r.field?.BindingPath||r.field?.ControlID||'Field captured';
    if(r.captureType==='field-scan')return `${r.fields?.length||0} fields captured`;
    if(r.captureType==='action')return r.action?.text||r.action?.dataBind||'Action captured';
    if(r.captureType==='action-scan')return `${r.actions?.length||0} actions captured`;
    return 'No capture.';
  };
  const render=r=>{result=r;$('pre').textContent=JSON.stringify(r,null,2);$('#summary').textContent=summarize(r);};

  document.addEventListener('pointerdown',e=>{
    if(e.composedPath?.().includes(host))return;
    lastTarget=e.target;
    if(!pickMode)return;
    const mode=pickMode;pickMode=null;
    if(mode==='action'){
      e.preventDefault();e.stopImmediatePropagation();
      const target=[...e.composedPath()].find(x=>x instanceof Element&&actionCandidate(x))||e.target;
      setTimeout(()=>{const r=inspectAction(target);render(r);status(`Captured action: ${summarize(r)}.`);},20);
    }else{
      setTimeout(()=>{const r=inspectElement(e.target);render(r);status(`Captured field: ${summarize(r)}.`);},60);
    }
  },true);
  document.addEventListener('click',e=>{
    if(e.composedPath?.().includes(host))return;
    if(pickMode==='action'){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('focusin',e=>{if(!e.composedPath?.().includes(host))lastTarget=e.target;},true);

  $('.launch').onclick=()=>{$('.panel').hidden=false;$('.launch').hidden=true;};
  $('.hide').onclick=()=>{$('.panel').hidden=true;$('.launch').hidden=false;};
  $('#clear').onclick=()=>{render({});status('Cleared.');};
  $('#pick-field').onclick=()=>{pickMode='field';status('Tap the ImageTrend field to investigate.');};
  $('#pick-action').onclick=()=>{pickMode='action';status('Tap the ImageTrend action. This one tap will be intercepted.');};
  $('#inspect-field').onclick=()=>{const target=lastTarget||document.activeElement;if(!target||target===document.body)return status('Tap/focus an ImageTrend field first.');const r=inspectElement(target);render(r);status(`Captured field: ${summarize(r)}.`);};
  $('#scan-fields').onclick=()=>{status('Scanning visible fields…');const r=scanVisibleFields();render(r);status(`Captured ${r.fields.length} field records.`);};
  $('#scan-actions').onclick=()=>{status('Scanning visible actions…');const r=scanActions();render(r);status(`Captured ${r.actions.length} action records.`);};
  $('#toggle-json').onclick=()=>{const p=$('pre');p.hidden=!p.hidden;$('#toggle-json').textContent=p.hidden?'Show JSON':'Hide JSON';};
  $('#copy').onclick=async()=>{const text=JSON.stringify(result,null,2);try{await navigator.clipboard.writeText(text);status('JSON copied.');}catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();status('JSON copied (fallback).');}};
})();
