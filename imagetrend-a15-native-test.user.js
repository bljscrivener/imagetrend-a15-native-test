// ==UserScript==
// @name         ImageTrend A15 Native Test (experimental)
// @namespace    local.imagetrend.a15native
// @version      0.2.4.3
// @description  Isolated, reviewed native preset field experiment. A15 defaults through native preset mappings; test release.
// @match        https://pafford.imagetrendelite.com/Elite/Organizationpafford/Agencypmsmsboliv/EmsRunForm*
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if(document.getElementById('it-a15-native-test'))return;
  const choices=[{"id":"95cf67b7-74f0-5a19-b258-08c7b96ef8d6","label":"Unit Disposition","target":"Patient Contact Made"},{"id":"a5db14f5-8f30-5131-937c-912204f5151d","label":"Type of Service Requested","target":"Emergency Response (Primary Response Area)"},{"id":"ffbe72d1-96b3-53c5-a4a1-530b61be4635","label":"Number of Pt's at Scene","target":"Single"},{"id":"ccc317e4-c422-592f-b490-2f3d1473be56","label":"Cardiac Arrest","target":"No"},{"id":"57f37db6-1c94-5266-8734-10cc7c7f3903","label":"Possible Stroke","target":"No"},{"id":"a21c0596-9e23-54f5-868e-a3809e80c27f","label":"Traumatic Injury","target":"No"},{"id":"ed8c85c1-75e0-ed11-bfb9-001dd8b72ccf","label":"Is a STEMI probable?","target":"No"},{"id":"66032c95-5556-5d89-a6fc-369c5b53509b","label":"Work-Related Illness/Injury","target":"No"},{"id":"8224dbe2-d85a-5cb1-8108-61264de6dd1b","label":"Incident/Pt Disposition","target":"Transport - Pt Treated, Transported by this Unit"},{"id":"249d37ae-50e7-523e-89a9-99e79c86c69d","label":"Patient Evaluation/Care","target":"Patient Evaluated and Care Provided"},{"id":"e4a449b1-be1e-5803-9ff2-533f42478c13","label":"Crew Disposition","target":"Initiated and Continued Primary Care"},{"id":"cfb7f889-af42-5a1b-8018-a55dfa923e00","label":"Transport Disposition","target":"Transport by This EMS Unit (This Crew Only)"},{"id":"3cf8b9c0-7cf5-5581-a1b4-0a6ec9de735e","label":"Primary Role of Unit","target":"Ground Transport (ALS Equipped)","mode":"fillBlank"},{"id":"2538b000-9d1a-52ab-9082-14aaa092730c","label":"Barriers to Patient Care","target":"None Noted","mode":"fillBlank"},{"id":"25089","label":"Number of Pts Transported in this Unit","target":"1","input":true,"mode":"fillBlank"},{"id":"12e06449-632f-5f97-b454-ec747e814719","label":"EMS Transport Method","target":"Ground-Ambulance","mode":"fillBlank"},{"id":"62dd5264-cd67-56ec-a3d3-f35e00818537","label":"Transport Mode from Scene","target":"Without Lights and Sirens","mode":"fillBlank"},{"id":"c05db124-d7cf-542c-a7bd-dbd12066f73d","label":"Transport from Scene Type","target":"No Lights or Sirens","mode":"fillBlank"},{"id":"0bf28da1-6fc8-5cb0-a49f-9541aef01cae","label":"How Pt Was Moved to Ambulance","target":"Stretcher","mode":"fillBlank"},{"id":"fca2bbb8-e1de-56ec-973e-7f6f1a597a03","label":"Patient Secured By","target":"Cot- 5 straps, Including Shoulders","mode":"fillBlank"},{"id":"fa166830-90f8-5671-8e1d-3e729c9779ec","label":"Position of Pt During Transport","target":"Semi-Fowlers","mode":"fillBlank"},{"id":"fe9abea5-c339-5375-a38c-3c9f8cbc6e54","label":"How Pt Was Moved From Ambulance","target":"Stretcher","mode":"fillBlank"},{"id":"969e7423-2a24-5d5c-b47b-a1331eb124d9","label":"Final Pt Acuity","target":"Lower Acuity (Green)","mode":"fillBlank"},{"id":"50ac60ee-31b5-5836-b004-25def8d05ae7","label":"Accepting Hospital Notified","target":"Yes","mode":"fillBlank"},{"id":"fe38276c-e64c-5d82-b377-fed71bb7023e","label":"Facility Notified By","target":"Phone","mode":"fillBlank"},{"id":"16ccfb92-ef4d-5527-a0ee-39639fd222f4","label":"Destination Team Pre-Arrival Alert or Activation","target":"No","mode":"fillBlank"},{"id":"ae3afe47-5b10-5761-8ee0-db6094b90b5c","label":"Type of Destination","target":"Hospital","mode":"fillBlank"},{"id":"7f5c88af-a3be-5947-b47b-ffe6cc957102","label":"AVPU","target":"Alert","mode":"fillBlank"},{"id":"94f6e43f-139c-5eda-bd46-bdb95d7111bd","label":"GCS Eye","target":"4- Opens Eyes spontaneously (All Age Groups)","mode":"fillBlank"},{"id":"30b5cc8f-c8c4-5446-a140-df8017828842","label":"GCS Verbal","target":"5- Oriented (>2 Years); Smiles, oriented to sounds, follows objects, interacts","mode":"fillBlank"},{"id":"de69b8e0-ea97-5898-af28-163665df5d03","label":"GCS Motor","target":"6- Obeys commands (>2Years); Appropriate response to stimulation","mode":"fillBlank"},{"id":"d6db496e-fd74-5d8a-a016-e324072dcb9c","label":"GCS Qualifier","target":"Initial GCS has legitimate values without interventions such as intubation and sedation","mode":"fillBlank"},{"id":"0dcf3d4f-f98d-53c9-a042-3bd73e6104d9","label":"BP Method","target":"Cuff-Automated","mode":"fillBlank"},{"id":"189b8c3d-3285-5066-b469-296a5c87d922","label":"HR Method","target":"Electronic Monitor - Pulse Oximeter","mode":"fillBlank"},{"id":"1ac08c15-b252-5b17-bdd5-990dfb81b475","label":"Respiratory Effort","target":"Normal","mode":"fillBlank"},{"id":"98cd8d07-762f-5665-9bef-e9b908b6d9dd","label":"Pulse Oximetry Qualifier","target":"Room Air","mode":"fillBlank"},{"id":"37a26280-090a-5d8d-b95d-c6c950839a6f","label":"Pain Scale Type","target":"Numeric (0-10)","mode":"fillBlank"},{"id":"10388fca-facb-5673-87e2-e109f28bd064","label":"Stroke Scale Score","target":"Negative","mode":"fillBlank"},{"id":"408ab322-147e-5539-afaf-2062d143a55c","label":"Stroke Scale Type","target":"FAST","mode":"fillBlank"},{"id":"fc93d071-9efc-5ce9-a393-3507852a8e19","label":"ECG Interpretation","target":"Not Applicable","mode":"fillBlank"},{"id":"c07c1d8b-c7d4-5a5a-8ec1-01bf67f882e0","label":"Procedure Performed Prior to this Unit's EMS Care","target":"No","mode":"fillBlank"},{"id":"d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7","label":"Role/Type of Person Performing the Procedure","target":"Paramedic","mode":"procedureRole"},{"id":"6a3cd763-c562-574c-b209-bbced74d73c1","label":"Procedure Authorization","target":"Protocol (Standing Order)","mode":"fillBlank"},{"id":"adcc71b8-0b92-5387-8b9f-cb94b729e4ac","label":"Procedure Successful","target":"Yes","mode":"fillBlank"},{"id":"72b9a56c-7b33-51b6-ae0f-0fe6a14ce702","label":"First EMS Unit on Scene","target":"Yes"},{"id":"9c627521-8b03-58e4-b7ee-7d57e7ecd0cc","label":"Additional Response Mode Descriptors","target":"No Lights or Sirens"}];
  const host=document.createElement('div');host.id='it-a15-native-test';
  host.style.cssText='position:fixed;right:24px;top:90px;z-index:2147483646';
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML='<style>:host{font:14px system-ui;color:#253144}section{background:white;border:2px solid #864ca3;border-radius:12px;padding:16px;width:440px;max-width:85vw;max-height:70vh;overflow:auto;box-shadow:0 8px 24px #0004}button,select{font:inherit;padding:8px;margin:5px 0}select{width:100%}pre{white-space:pre-wrap;font:12px system-ui;background:#f4edf8;padding:9px}label{display:block;margin:10px 0}h3{margin:0}small{display:block;margin:8px 0}button{cursor:pointer}#apply{background:#864ca3;color:white;border:0;border-radius:5px}button:disabled{opacity:.45}[hidden]{display:none!important}</style><button id="launch">A15 Native Test</button><section hidden><h3>A15 Native Test · experimental 0.2.4.3</h3><small>Use on your TEST chart. Native field updates may persist immediately. This does not call the preset audit or chart Save.</small><select id="choice"></select><button id="preview">Preview selected values</button><pre id="result">Review from any chart section. All mapped A15 defaults are selected; unavailable fields are listed for attention.</pre><label><input id="ack" type="checkbox">This is a TEST chart. All ready values match this scenario and I reviewed them.</label><button id="apply" disabled>Go, baby, go</button> <button id="hide">Minimize</button></section>';
  document.body.append(host);
  const $=s=>ui.querySelector(s);let reviewed=null,busy=false;
  for(const [i,c] of choices.entries()){const o=document.createElement('option');o.value=i;o.textContent=c.label;$('#choice').append(o);}
  const both=document.createElement('option');both.value='both';both.textContent='All A15 defaults (review first)';$('#choice').prepend(both);$('#choice').value='both';
  const visible=n=>!!n&&n.isConnected&&!!n.getClientRects().length;
  const norm=x=>String(x??'').trim();
  function reset(){reviewed=null;$('#ack').checked=false;$('#apply').disabled=true;}
  function resolve(root,path,ko){let n=root;for(const p of path.split('.')){n=ko.unwrap(n);if(n==null||!(p in Object(n)))throw Error('Native field path unavailable.');n=n[p];}return n;}
  function inspect(choice){
    const app=window.imagetrend,ko=window.ko;let c=choice||choices[Number($('#choice').value)];
    if(!app?.runForm?.PresetValueViewModel||!ko?.contextFor)throw Error('Native preset API is unavailable in this userscript context. No changes made.');
    const form=document.querySelector('#form-composer');
    if(!form||!visible(form))throw Error('Open a chart form first.');
    if(form.closest('.locked'))throw Error('Chart is locked.');
    const contexts=[...new Set([form,...form.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(Boolean))];
    if(!contexts.length)throw Error('Chart context unavailable.');
    // isReadOnly expects a field context, not every nested template on the page.
    const owners=[...new Set([app.currentVm,...contexts.flatMap(ctx=>[ctx.$root,ctx.$data,...(ctx.$parents||[])])])].filter(Boolean);
    const statuses=owners.filter(o=>'currentIncidentReadOnlyStatus' in Object(o)).map(o=>ko.unwrap(o.currentIncidentReadOnlyStatus));
    if(!statuses.length||statuses.some(x=>x==null))throw Error('Chart editability could not be verified. No changes made.');
    if(statuses.some(Boolean)||document.querySelector('#center-pane.locked, #left-pane.locked'))throw Error('Chart is locked.');
    const targetContexts=contexts.filter(ctx=>ko.unwrap(ctx.$data?.BindingPathEntryID)===c.id);
    if(targetContexts.some(ctx=>app.FormComposer.isReadOnly(ctx)))throw Error('Target field is read-only.');
    const repeatedStart=choices.findIndex(x=>x.label==='AVPU'), ruleIndex=choices.findIndex(x=>x.id===c.id);
    if((ruleIndex>=repeatedStart&&ruleIndex<choices.length-2)||c.label==='Destination Team Pre-Arrival Alert or Activation')throw Error('Needs attention: procedure/vital/activation entries remain manual in this native test.');
    if(c.label==='Type of Service Requested')throw Error('Needs attention: priority-dependent service rule requires native priority mapping.');
    if(c.input)throw Error('Needs attention: numeric/input mapping not enabled in native test.');
    const templates=(app.formComposer.agencyPresetValues||[]).flatMap(d=>d.PresetValues||[]).filter(d=>d.BindingPathEntryID===c.id&&d.ReportingStandardID===app.formComposer.reportingStandardID);
    if(!templates.length)throw Error('Needs attention: no loaded native field mapping.');
    const signatures=[...new Set(templates.map(d=>JSON.stringify([d.BindingPathFromOrigin,!!d.IsMultiselect,!!d.IsInGrid])))];
    if(signatures.length!==1)throw Error('Needs attention: ambiguous native field mapping.');
    const template=templates[0],path=template.BindingPathFromOrigin;
    if(template.IsInGrid||typeof path!=='string'||!path.startsWith('Incident.')||(path.match(/\[\]/g)||[]).length>(template.IsMultiselect?1:0))throw Error('Needs attention: repeated-entry mapping requires separate testing.');
    const resources=app.formComposer.agencyResources?.[c.id.toLowerCase()];
    const matches=(resources?.Elements||[]).filter(e=>norm(e.Value)===norm(c.target));
    if(matches.length!==1)throw Error('Needs attention: exact target choice missing or ambiguous.');
    const code=matches[0].Id;
    if(typeof code!=='string'||!code||code.includes('|'))throw Error('Needs attention: unsupported target code.');
    c={...c,path,value:code,multi:!!template.IsMultiselect};
    const defs=[{...template,Value:code,IsNotValue:false,IsPertinentNegative:false}];
    const endpoint=c.multi?c.path.split('[]')[0]:c.path.slice(0,c.path.lastIndexOf('.'));
    const roots=[...new Set(contexts.flatMap(context=>[context.$data,...(context.$parents||[])]))].filter(r=>{try{return resolve(r,endpoint,ko)!=null;}catch(_){return false;}});
    if(roots.length!==1)throw Error('Could not uniquely resolve the native incident context.');
    const root=roots[0],branch=resolve(root,endpoint,ko);
    // Snapshot only the answer and its special-value flags, never model parent links.
    const valueKey=c.path.slice(c.path.lastIndexOf('.')+1);
    const readAnswer=answer=>{
      answer=ko.unwrap(answer);
      if(!answer||typeof answer!=='object')throw Error('Native answer structure unavailable.');
      return [valueKey,'NotValue','PertinentNegative','PlusOneCode'].map(key=>{
        const value=ko.unwrap(answer[key]);
        if(value!=null&&!['string','number','boolean'].includes(typeof value))throw Error('Unexpected native answer type.');
        return value??null;
      });
    };
    const collection=ko.unwrap(branch);
    if(c.multi&&!Array.isArray(collection))throw Error('Native answer collection unavailable.');
    const answers=c.multi?collection.map(item=>readAnswer(resolve(item,c.path.split('[].')[1].split('.').slice(0,-1).join('.'),ko))):readAnswer(branch);
    const snapshot=JSON.stringify(answers);
    const vm=new app.runForm.PresetValueViewModel({...defs[0]},root);
    const current=norm(ko.unwrap(vm.currentValueDisplay)),target=norm(ko.unwrap(vm.presetValueDisplay));
    if(!target||target!==norm(c.target))throw Error('Native preset could not translate the target code to a display value.');
    // The native multiselect writer removes all entries, so only an empty collection is eligible.
    const canApply=!current&&(c.multi?collection.length===0:answers.every(value=>value==null||value===''));
    return {c,root,vm,snapshot,current,target,canApply,url:location.href,endpoint};
  }
  $('#launch').onclick=()=>{$('section').hidden=false;$('#launch').hidden=true;};
  $('#hide').onclick=()=>{$('section').hidden=true;$('#launch').hidden=false;};
  $('#choice').onchange=reset;
  $('#preview').onclick=()=>{
    reset();try{
      const selected=$('#choice').value==='both'?choices:[choices[Number($('#choice').value)]];
      reviewed=selected.map(c=>{try{return inspect(c);}catch(e){return {c,canApply:false,error:e.message};}});
      $('#result').textContent=reviewed.map(x=>x.error?x.c.label+' → '+x.c.target+'\n'+x.error:x.c.label+'\nCurrent: '+(x.current||'(blank)')+' → '+x.target+'\n'+(x.canApply?'Ready':x.current===x.target?'Already correct':'Existing answer preserved')).join('\n\n');
    }catch(e){reset();$('#result').textContent=e.message;}
  };
  $('#ack').onchange=()=>{$('#apply').disabled=busy||!$('#ack').checked||!reviewed?.some(x=>x.canApply);};
  $('#apply').onclick=async()=>{
    if(busy||!reviewed?.some(x=>x.canApply)||!$('#ack').checked)return;
    busy=true;$('#apply').disabled=true;$('#preview').disabled=true;$('#choice').disabled=true;
    const results=[];
    try{
      const pending=reviewed.filter(x=>x.canApply);
      const validate=old=>{
        const fresh=inspect(old.c);
        if(fresh.url!==old.url||fresh.root!==old.root||fresh.snapshot!==old.snapshot||fresh.target!==old.target||!fresh.canApply)throw Error('Chart or field changed since preview. Preview again.');
        return fresh;
      };
      pending.forEach(validate);
      for(const old of pending){
        const fresh=validate(old);
        fresh.vm.applyPresetValue();
        let verified=false;
        for(let i=0;i<30;i++){
          if(location.href!==fresh.url||inspect(fresh.c).root!==fresh.root)throw Error('Chart changed after write. Inspect before retrying.');
          fresh.vm.init();
          if(norm(window.ko.unwrap(fresh.vm.currentValueDisplay))===fresh.target){verified=true;break;}
          await new Promise(r=>setTimeout(r,100));
        }
        if(!verified)throw Error('Read-back failed for '+fresh.c.label+'. Inspect before retrying.');
        results.push('Verified: '+fresh.c.label);
      }
      $('#result').textContent=results.join('\n')+'\n'+reviewed.filter(x=>x.error).map(x=>x.c.label+': '+x.error).join('\n')+'\nVisit the fields to verify their displays. No explicit Save or preset audit called; native persistence may occur.';
    }catch(e){$('#result').textContent=results.join('\n')+'\nStopped: '+e.message+'\nEarlier writes may remain. Preview again after inspecting.';}
    finally{busy=false;reset();$('#preview').disabled=false;$('#choice').disabled=false;}
  };
  const capture=document.createElement('button');capture.textContent='Copy field mappings';capture.id='capture';
  const captureStatus=document.createElement('small');captureStatus.id='capture-status';
  $('section').insertBefore(capture,$('#choice'));capture.after(captureStatus);
  capture.onclick=async()=>{
    if(busy)return;
    try{
      const ko=window.ko;
      if(!ko?.contextFor)throw Error('Native context unavailable.');
      const scopes=[...document.querySelectorAll('#form-composer, .grid-flyout-active')];
      const nodes=[...new Set(scopes.flatMap(s=>[s,...s.querySelectorAll('[data-bind]')]))];
      const fields=[],seen=new Set();
      // Whitelist definition metadata only. No answer values, names, dates or incident IDs.
      const keys=['BindingPathEntryID','BindingPath','BindingPathFromOrigin','FieldDefinitionID','ControlID','IsMultiselect','IsInGrid'];
      for(const node of nodes){
        const ctx=ko.contextFor(node);if(!ctx)continue;
        for(const owner of [ctx.$data,...(ctx.$parents||[])]){
          if(!owner||typeof owner!=='object')continue;
          const metadata={};
          for(const key of keys){
            if(!(key in owner))continue;
            const value=ko.unwrap(owner[key]);
            if(['string','boolean','number'].includes(typeof value))metadata[key]=value;
          }
          if(!metadata.BindingPath&&!metadata.BindingPathFromOrigin)continue;
          const signature=JSON.stringify(metadata);if(seen.has(signature))continue;seen.add(signature);
          fields.push(metadata);
        }
      }
      if(!fields.length)throw Error('No field definitions found in this view.');
      const payload=JSON.stringify({mappingVersion:'1',fields},null,2);
      await navigator.clipboard.writeText(payload);
      captureStatus.textContent='Copied '+fields.length+' field definitions. Paste them into our chat.';
    }catch(e){captureStatus.textContent='Mapping capture: '+e.message;}
  };

})();
