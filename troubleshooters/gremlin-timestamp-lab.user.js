// ==UserScript==
// @name         Gremlin Timestamp Lab
// @namespace    local.gremlin.timestamp-lab
// @version      0.1.0
// @description  Small native-picker timestamp experiment. Separate from A15.
// @match        https://*.imagetrendelite.com/Elite/*/EmsRunForm*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==
(() => {
  'use strict';
  if(document.getElementById('gremlin-timestamp-lab'))return;
  const host=document.createElement('div');host.id='gremlin-timestamp-lab';
  host.style.cssText='position:fixed;left:12px;bottom:65px;z-index:2147483647';
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML=`<style>:host{font:13px system-ui;color:#eee}section{width:290px;max-width:85vw;background:#24222d;border:2px solid #ae7acb;border-radius:12px;padding:12px;box-shadow:0 6px 20px #0005}h3{margin:0 0 8px}button{background:#563869;color:white;border:1px solid #ab87c0;border-radius:6px;padding:8px;margin:4px 2px;cursor:pointer}button:disabled{opacity:.5}p{font-size:12px}pre{white-space:pre-wrap;font:12px system-ui;background:#34303e;padding:8px}textarea{width:95%;height:150px}[hidden]{display:none!important}</style><button id="launch" hidden>◕ Time Lab</button><section><h3>Gremlin Time Lab · 0.1.0</h3><p>Open the native clock picker on your intended field. Use on a test chart; changes may persist immediately. No chart Save is called.</p><button id="inspect">Inspect target</button><div><button id="patient">At Pt</button><button id="departure">Leaving Scene</button></div><pre id="status">Open the native picker, then inspect or choose a timestamp.</pre><button id="copy">Copy log</button><button id="hide">Hide</button></section>`;
  document.body.append(host);
  const $=s=>ui.querySelector(s),events=[];let busy=false;
  const fail=code=>{throw new Error(code);};
  const visible=n=>!!n?.isConnected&&n.getClientRects().length>0;
  function inspect(){
    const ko=window.ko,app=window.imagetrend;
    if(!ko?.contextFor||!window.dateFns?.parse)fail('NATIVE_API_UNAVAILABLE');
    const picker=document.querySelector('#date-picker'),vm=picker&&ko.contextFor(picker)?.$data;
    if(!visible(picker)||!vm||!ko.unwrap(vm.displayDatePicker))fail('OPEN_NATIVE_PICKER');
    const node=document.getElementById(ko.unwrap(vm.focusedElement));
    if(!visible(node)||node.disabled||node.readOnly)fail('TARGET_UNAVAILABLE');
    const context=ko.contextFor(node);
    const owners=[app.currentVm,context?.$root,context?.$data,...(context?.$parents||[])].filter(Boolean);
    const locks=owners.filter(o=>'currentIncidentReadOnlyStatus' in Object(o)).map(o=>ko.unwrap(o.currentIncidentReadOnlyStatus));
    if(!locks.length||locks.some(x=>x!==false))fail('CHART_NOT_CONFIRMED_EDITABLE');
    if(!context||typeof app.FormComposer?.isReadOnly!=='function'||app.FormComposer.isReadOnly(context))fail('TARGET_NOT_CONFIRMED_EDITABLE');
    if(!ko.isObservable(vm.datePickerInputObservable)||typeof vm.setDateObj!=='function')fail('NATIVE_WRITER_UNAVAILABLE');
    const response=ko.unwrap(vm.currentResponseTimesObject);
    if(!response)fail('NATIVE_TIMELINE_UNAVAILABLE');
    return {vm,node,response,observable:vm.datePickerInputObservable,url:location.href};
  }
  function log(action,code){events.push({sequence:events.length+1,action,code});if(events.length>100)events.shift();$('#status').textContent=code.replaceAll('_',' ');}
  function source(state,action){
    const ko=window.ko;
    const mod=ko.unwrap(state.response[action==='patient'?'ResponseTimeArrivedAtPatientModValue':'ResponseTimeUnitLeftSceneModValue']);
    const raw=ko.unwrap(mod?.[action==='patient'?'ArrivedAtPatient':'UnitLeftScene']);
    if(!raw)fail('SOURCE_MISSING');
    // Match the EMS branch of ImageTrend's own quick-button conversion.
    if(window.imagetrend.helpers.isFire())fail('EMS_ONLY');
    const formatted=window.dateFns.format(raw,window.imagetrend.helpers.getISODateTimeFormat());
    const date=window.dateFns.parse(formatted);
    if(!(date instanceof Date)||!Number.isFinite(date.getTime()))fail('SOURCE_INVALID');
    return date;
  }
  async function run(action){
    if(busy){log(action,'BUSY_SKIPPED');return;}
    busy=true;$('#patient').disabled=$('#departure').disabled=true;
    try{
      log(action,'STARTED');const state=inspect(),date=source(state,action);
      const parse=value=>{const d=window.dateFns.parse(value);return d instanceof Date?d.getTime():NaN;};
      const before=window.ko.unwrap(state.observable);
      if(parse(before)===date.getTime()){log(action,'ALREADY_CORRECT');return;}
      // Local recovery evidence only. This is not an Undo implementation.
      sessionStorage.setItem('gremlin-time-lab-before',JSON.stringify({url:state.url,target:state.node.id,before}));
      const fresh=inspect();
      if(fresh.vm!==state.vm||fresh.observable!==state.observable||fresh.node!==state.node||fresh.url!==state.url||fresh.response!==state.response)fail('TARGET_CHANGED');
      if(source(fresh,action).getTime()!==date.getTime())fail('SOURCE_CHANGED');
      state.vm.setDateObj(date);
      await new Promise(r=>setTimeout(r,150));
      if(location.href!==state.url||!state.node.isConnected)fail('TARGET_CHANGED_AFTER_WRITE');
      if(parse(window.ko.unwrap(state.observable))!==date.getTime())fail('READBACK_MISMATCH');
      log(action,'NATIVE_READBACK_VERIFIED');
    }catch(e){const known=/^[A-Z_]+$/.test(e.message)?e.message:'NATIVE_ERROR';log(action,known);}
    finally{busy=false;$('#patient').disabled=$('#departure').disabled=false;}
  }
  $('#inspect').onclick=()=>{try{const state=inspect();log('inspect','TARGET_READY');$('#status').textContent+='\n'+String(state.vm.runFormInputInformation?.$data?.Label||'Timestamp field');}catch(e){log('inspect',/^[A-Z_]+$/.test(e.message)?e.message:'NATIVE_ERROR');}};
  $('#patient').onclick=()=>run('patient');$('#departure').onclick=()=>run('departure');
  $('#copy').onclick=async()=>{const text=JSON.stringify({version:'0.1.0',events},null,2);try{await navigator.clipboard.writeText(text);}catch(_){const box=document.createElement('textarea');box.readOnly=true;box.value=text;$('section').append(box);box.select();}};
  $('#hide').onclick=()=>{$('section').hidden=true;$('#launch').hidden=false;};
  $('#launch').onclick=()=>{$('section').hidden=false;$('#launch').hidden=true;};
  ui.querySelectorAll('button').forEach(b => { b.type = 'button'; });
})();
