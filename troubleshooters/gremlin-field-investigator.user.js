// ==UserScript==
// @name         Gremlin Field Investigator
// @namespace    local.imagetrend.gremlin.investigator
// @version      0.2.0
// @description  Read-only ImageTrend field/binding/resource investigator for mapping native controls and option vocabularies.
// @match        https://*.imagetrendelite.com/Elite/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('gremlin-field-investigator')) return;

  const HOST_ID = 'gremlin-field-investigator';
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
    const withMeta = chain.find(x => {
      const d = x.data;
      return META_KEYS.some(k => unwrap(d?.[k]) != null && unwrap(d?.[k]) !== '');
    });
    if (withMeta) return withMeta.el;
    let el = start instanceof Element ? start : null;
    for (let i = 0; el && i < 12; i++, el = el.parentElement) {
      const a = attrs(el);
      if (Object.keys(a).length || el.matches?.('select,input,textarea,[data-bind],[data-control-id],[data-controlid]')) return el;
    }
    return start instanceof Element ? start : document.activeElement;
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

  function dedupeOptions(items) {
    const seen = new Set();
    return items.filter(x => {
      const key = `${x.label||''}\u0000${x.value||''}\u0000${x.id||''}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function optionFromObject(o, source) {
    if (!o || typeof o !== 'object') return null;
    const labelKeys = ['Value','Label','Text','Name','DisplayName','Description','Title'];
    const valueKeys = ['Id','ID','ValueID','Code','Key','Value','NemsisCode'];
    let label = '';
    let value = '';
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
      if (!obj || typeof obj !== 'object' || depth > 4) return;
      if (visited.has(obj)) return;
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
      else if (typeof v === 'object') likely[k] = { type:'object', keys:Object.keys(v).slice(0,40) };
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
    const optionSources=traceOptionSources(node);
    return {
      investigatorVersion:'0.2.0',
      mappingVersion:'3-investigator',
      capturedAt:new Date().toISOString(),
      route:location.pathname,
      field:meta,
      options,
      optionSources,
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
    return {investigatorVersion:'0.2.0',mappingVersion:'3-investigator',capturedAt:new Date().toISOString(),route:location.pathname,fields:out};
  }

  const host=document.createElement('div');
  host.id=HOST_ID;
  host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483647';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>:host{font:13px system-ui;color:#182230}button{font:inherit;cursor:pointer}.launch{border:0;border-radius:999px;padding:9px 12px;box-shadow:0 4px 16px #0004}.panel{width:460px;max-width:90vw;max-height:74vh;overflow:auto;background:#fff;border:2px solid #5b4b8a;border-radius:12px;padding:12px;box-shadow:0 10px 30px #0005}.row{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.row button{padding:7px 9px}.status{font-size:12px;margin:6px 0}pre{white-space:pre-wrap;word-break:break-word;background:#f4f4f7;padding:8px;border-radius:6px;max-height:44vh;overflow:auto}small{display:block;line-height:1.35}.hide{float:right}</style><button class="launch">Field Investigator</button><div class="panel" hidden><button class="hide">×</button><strong>Gremlin Field Investigator 0.2.0</strong><small>Read-only. Tap/focus a field, or open its flyout/dropdown first. v0.2 traces Knockout option sources and survives Safari interceptor overlays.</small><div class="row"><button id="inspect">Inspect focused field</button><button id="scan">Scan visible tree</button><button id="pick">Pick next field</button></div><div class="row"><button id="copy">Copy JSON</button><button id="clear">Clear</button></div><div class="status">Idle.</div><pre>{}</pre></div>`;
  document.body.append(host);

  const $=s=>shadow.querySelector(s); let result={},lastTarget=null,picking=false;
  const status=t=>$('.status').textContent=t;
  const render=r=>{result=r;$('pre').textContent=JSON.stringify(r,null,2);};
  document.addEventListener('pointerdown',e=>{
    if(e.composedPath?.().includes(host))return;
    lastTarget=e.target;
    if(picking){picking=false;setTimeout(()=>{const r=inspectElement(lastTarget);render(r);status(`Captured ${r.field.Label||r.field.BindingPath||r.field.ControlID||r.field.tag||'field'}.`);},80);}
  },true);
  document.addEventListener('focusin',e=>{if(!e.composedPath?.().includes(host))lastTarget=e.target;},true);
  $('.launch').onclick=()=>{$('.panel').hidden=false;$('.launch').hidden=true;};
  $('.hide').onclick=()=>{$('.panel').hidden=true;$('.launch').hidden=false;};
  $('#clear').onclick=()=>{render({});status('Cleared.');};
  $('#pick').onclick=()=>{picking=true;status('Tap the ImageTrend field to investigate.');};
  $('#inspect').onclick=()=>{const target=lastTarget||document.activeElement;if(!target||target===document.body)return status('Tap/focus an ImageTrend field first.');const r=inspectElement(target);render(r);status(`Captured ${r.field.Label||r.field.BindingPath||r.field.ControlID||r.field.tag||'field'}.`);};
  $('#scan').onclick=()=>{status('Scanning visible controls and option sources…');const r=scanVisibleFields();render(r);status(`Captured ${r.fields.length} visible field records.`);};
  $('#copy').onclick=async()=>{const text=JSON.stringify(result,null,2);try{await navigator.clipboard.writeText(text);status('JSON copied.');}catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();status('JSON copied (fallback).');}};
})();
