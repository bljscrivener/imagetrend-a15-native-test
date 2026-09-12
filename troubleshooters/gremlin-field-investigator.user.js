// ==UserScript==
// @name         Gremlin Field Investigator
// @namespace    local.imagetrend.gremlin.investigator
// @version      0.1.0
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

  const norm = v => (v == null ? '' : String(v)).trim();
  const uniq = xs => [...new Set(xs.filter(Boolean))];
  const safeJson = value => {
    try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
  };
  const unwrap = v => {
    try { return window.ko?.unwrap ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); }
    catch { return undefined; }
  };

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

  function nearestFieldNode(start) {
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
    const seen = new Set();
    return items.filter(x => {
      const key = `${x.label}\u0000${x.value}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 500);
  }

  function koSnapshot(el) {
    if (!window.ko || !el) return null;
    try {
      const ctx = window.ko.contextFor(el);
      const data = ctx?.$data;
      if (!data) return null;
      const out = { keys: Object.keys(data).slice(0, 120) };
      const likely = {};
      for (const k of out.keys) {
        if (!/(id|value|option|answer|binding|control|resource|element|question|label|text|name|selected|licensure|dose|route|location|size)/i.test(k)) continue;
        const v = unwrap(data[k]);
        if (v == null || ['string','number','boolean'].includes(typeof v)) likely[k] = v;
        else if (Array.isArray(v)) likely[k] = { type: 'array', length: v.length };
        else if (typeof v === 'object') likely[k] = { type: 'object', keys: Object.keys(v).slice(0, 30) };
      }
      out.likely = likely;
      return out;
    } catch (e) { return { error: String(e?.message || e) }; }
  }

  function flattenResources() {
    const resources = window.imagetrend?.formComposer?.agencyResources || {};
    const rows = [];
    for (const [resourceKey, resource] of Object.entries(resources)) {
      const elements = Array.isArray(resource?.Elements) ? resource.Elements : [];
      for (const e of elements) {
        rows.push({
          resourceKey,
          resourceId: norm(resource?.Id || resource?.ID || resource?.ResourceId),
          elementId: norm(e?.Id || e?.ID),
          value: norm(e?.Value ?? e?.Text ?? e?.Label ?? e?.Name),
          code: norm(e?.Code ?? e?.NemsisCode ?? e?.Key),
          parentId: norm(e?.ParentId ?? e?.ParentID),
          rawKeys: Object.keys(e || {}).slice(0, 30)
        });
      }
    }
    return rows;
  }

  function resourceMatches(meta, koInfo, options) {
    const rows = flattenResources();
    const needles = uniq([
      meta.BindingPathEntryID, meta.ControlID, meta.BindingPath,
      ...Object.values(koInfo?.likely || {}).filter(v => ['string','number'].includes(typeof v)).map(String),
      ...options.flatMap(o => [o.value, o.label])
    ].map(norm)).filter(x => x.length >= 2);
    if (!needles.length) return [];
    const scored = [];
    for (const r of rows) {
      let score = 0;
      for (const n of needles) {
        if (r.elementId === n) score += 8;
        if (r.resourceId === n || r.resourceKey === n) score += 7;
        if (r.code === n) score += 5;
        if (r.value === n) score += 4;
        if (r.parentId === n) score += 3;
      }
      if (score) scored.push({ ...r, score });
    }
    return scored.sort((a,b)=>b.score-a.score).slice(0, 250);
  }

  function fieldMeta(el) {
    const chain = [];
    let cur = el;
    for (let i = 0; cur && i < 10; i++, cur = cur.parentElement) chain.push(cur);
    const get = names => {
      for (const node of chain) {
        const v = readAttr(node, names);
        if (v) return v;
      }
      return null;
    };
    return {
      BindingPathEntryID: get(['BindingPathEntryID','data-bindingpathentryid','binding-path-entry-id','data-binding-path-entry-id']),
      BindingPath: get(['BindingPath','data-bindingpath','binding-path','data-binding-path']),
      ControlID: get(['ControlID','data-controlid','control-id','data-control-id']),
      tag: el?.tagName || null,
      type: el?.getAttribute?.('type') || null,
      id: el?.id || null,
      name: el?.getAttribute?.('name') || null,
      classes: el?.className && typeof el.className === 'string' ? el.className : null,
      attributes: attrs(el)
    };
  }

  function inspectElement(el) {
    const node = nearestFieldNode(el);
    const meta = fieldMeta(node);
    const options = visibleOptionText(node);
    const koInfo = koSnapshot(node);
    return {
      investigatorVersion: '0.1.0',
      mappingVersion: '2-investigator',
      capturedAt: new Date().toISOString(),
      route: location.pathname,
      field: meta,
      options,
      ko: koInfo,
      resourceMatches: resourceMatches(meta, koInfo, options),
      notes: [
        'Read-only capture. No chart write was attempted.',
        'Resource matches are ranked candidates, not guaranteed field ownership.',
        'Patient-entered scalar values are intentionally not exported by this tool.'
      ]
    };
  }

  function scanVisibleFields() {
    const roots = [document.querySelector('#form-composer'), ...document.querySelectorAll('.grid-flyout-active,[role="dialog"],.modal')].filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const root of roots.length ? roots : [document]) {
      for (const el of root.querySelectorAll('[BindingPathEntryID],[bindingpathentryid],[data-bindingpathentryid],[data-binding-path-entry-id],[BindingPath],[bindingpath],[data-bindingpath],[data-binding-path],[ControlID],[controlid],[data-controlid],[data-control-id],select,input,textarea')) {
        const node = nearestFieldNode(el);
        const meta = fieldMeta(node);
        const key = `${meta.BindingPathEntryID||''}|${meta.BindingPath||''}|${meta.ControlID||''}|${meta.id||''}`;
        if (!key.replace(/\|/g,'')) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        const options = visibleOptionText(node);
        const koInfo = koSnapshot(node);
        out.push({ field: meta, options, ko: koInfo, resourceMatches: resourceMatches(meta, koInfo, options) });
      }
    }
    return { investigatorVersion:'0.1.0', mappingVersion:'2-investigator', capturedAt:new Date().toISOString(), route:location.pathname, fields:out };
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
    :host{font:13px system-ui;color:#182230}button{font:inherit;cursor:pointer}.launch{border:0;border-radius:999px;padding:9px 12px;box-shadow:0 4px 16px #0004}
    .panel{width:440px;max-width:88vw;max-height:72vh;overflow:auto;background:#fff;border:2px solid #5b4b8a;border-radius:12px;padding:12px;box-shadow:0 10px 30px #0005}
    .row{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.row button{padding:7px 9px}.status{font-size:12px;margin:6px 0}pre{white-space:pre-wrap;word-break:break-word;background:#f4f4f7;padding:8px;border-radius:6px;max-height:42vh;overflow:auto}small{display:block;line-height:1.35}.hide{float:right}
  </style>
  <button class="launch">Field Investigator</button>
  <div class="panel" hidden>
    <button class="hide">×</button><strong>Gremlin Field Investigator 0.1.0</strong>
    <small>Read-only. Focus/tap the field you want to investigate, or open its flyout/dropdown first.</small>
    <div class="row"><button id="inspect">Inspect focused field</button><button id="scan">Scan visible tree</button><button id="pick">Pick next field</button></div>
    <div class="row"><button id="copy">Copy JSON</button><button id="clear">Clear</button></div>
    <div class="status">Idle.</div><pre>{}</pre>
  </div>`;
  document.body.append(host);

  const $ = s => shadow.querySelector(s);
  let result = {};
  let lastTarget = null;
  let picking = false;
  const status = t => $('.status').textContent = t;
  const render = r => { result = r; $('pre').textContent = JSON.stringify(r,null,2); };

  document.addEventListener('pointerdown', e => {
    if (host.contains?.(e.target)) return;
    lastTarget = e.target;
    if (picking) {
      picking = false;
      setTimeout(() => {
        const r = inspectElement(lastTarget);
        render(r); status(`Captured ${r.field.BindingPath || r.field.BindingPathEntryID || r.field.ControlID || r.field.tag || 'field'}.`);
      }, 50);
    }
  }, true);
  document.addEventListener('focusin', e => { if (!host.contains?.(e.target)) lastTarget = e.target; }, true);

  $('.launch').onclick = () => { $('.panel').hidden = false; $('.launch').hidden = true; };
  $('.hide').onclick = () => { $('.panel').hidden = true; $('.launch').hidden = false; };
  $('#clear').onclick = () => { render({}); status('Cleared.'); };
  $('#pick').onclick = () => { picking = true; status('Tap the ImageTrend field to investigate.'); };
  $('#inspect').onclick = () => {
    const target = lastTarget || document.activeElement;
    if (!target || target === document.body) return status('Tap/focus an ImageTrend field first.');
    const r = inspectElement(target); render(r); status(`Captured ${r.field.BindingPath || r.field.BindingPathEntryID || r.field.ControlID || r.field.tag || 'field'}.`);
  };
  $('#scan').onclick = () => { status('Scanning visible controls/resources…'); const r = scanVisibleFields(); render(r); status(`Captured ${r.fields.length} visible field records.`); };
  $('#copy').onclick = async () => {
    const text = JSON.stringify(result,null,2);
    try { await navigator.clipboard.writeText(text); status('JSON copied.'); }
    catch { const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();status('JSON copied (fallback).'); }
  };
})();
