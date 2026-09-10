// ==UserScript==
// @name         Gremlin Crew Auditor
// @namespace    local.gremlin.crew-auditor
// @version      0.1.0
// @description  Crew authority audit and procedure/medication provider-level correction.
// @match        https://*.imagetrendelite.com/Elite/*/EmsRunForm*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==
(() => {
 'use strict';
 if(document.getElementById('gremlin-crew-auditor'))return;
 const rules=[
  {kind:'Procedure',list:'PatientProcedures',identity:'PatientProcedureCrewMemberIDModValue',role:'PatientProcedurePerformerRoleModValue',key:'PerformerRole',field:'d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7'},
  {kind:'Medication',list:'Medications',identity:'MedicationCrewMemberIDModValue',role:'MedicationCrewMemberRoleModValue',key:'CrewMemberRole',field:'13ed4b85-9ccb-56d1-8bed-b31c95d75453'}
 ];
 const crewLevelField='2ee08dd2-f24c-5ac6-a024-79cbaf343eef';
 const host=document.createElement('div');host.id='gremlin-crew-auditor';host.style.cssText='position:fixed;right:12px;bottom:65px;z-index:2147483647';
 const ui=host.attachShadow({mode:'open'});ui.innerHTML=`<style>:host{font:13px system-ui;color:#eee}section{width:320px;max-width:85vw;max-height:70vh;overflow:auto;background:#24222d;border:2px solid #ae7acb;border-radius:12px;padding:12px}button{background:#563869;color:white;border:1px solid #ab87c0;border-radius:6px;padding:8px;margin:4px;cursor:pointer}button:disabled{opacity:.5}pre{white-space:pre-wrap;font:12px system-ui}small{display:block}h3{margin:0 0 8px}[hidden]{display:none!important}textarea{width:95%;height:140px}</style><button id="launch" hidden>Crew Auditor</button><section><h3>Crew Auditor · 0.1.0</h3><small>Crew/Unit Info is read-only authority. Corrections change only matched procedure/medication provider levels. Native changes may persist; no chart Save is called.</small><button id="scan">Scan only</button><button id="apply">Audit & correct levels</button><pre id="result">Ready. Unresolved identities are flagged, never assigned.</pre><button id="copy">Copy findings</button><button id="hide">Hide</button></section>`;
 document.body.append(host);const $=s=>ui.querySelector(s);let busy=false,report=[];
 const unwrap=x=>window.ko.unwrap(x),id=x=>String(unwrap(x)||'').trim().toLowerCase();
 const problem=code=>{throw Error(code);};
 function identity(mod){mod=unwrap(mod);return {performer:id(mod?.PerformerID),license:id(mod?.LicensureID)};}
 function members(provider,crew){return crew.filter(c=>provider.performer?c.identity.performer===provider.performer:provider.license&&c.identity.license===provider.license);}
 function audit(response,resources,signedIn){
  const issues=[],plans=[],raw=unwrap(response.CrewMembers);
  if(!Array.isArray(raw))problem('CREW_UNAVAILABLE');
  const crew=raw.filter(c=>!unwrap(c.DeletedStatus)).map(c=>({entry:c,identity:identity(c.CrewMemberAgencyPerformerIDModValue),level:unwrap(c.CrewMemberCrewMemberLevelModValue)}));
  if(crew.length!==2)issues.push({scope:'Crew',code:'EXPECTED_TWO_CREW',count:crew.length});
  const keys=crew.map(c=>c.identity.performer||c.identity.license);
  if(keys.some(k=>!k)||new Set(keys).size!==keys.length)issues.push({scope:'Crew',code:'CREW_IDENTITY_AMBIGUOUS'});
  const login=members({performer:id(signedIn)},crew);
  issues.push({scope:'Signed-in user',code:!signedIn?'LOGIN_ID_UNAVAILABLE':login.length===1?'MEMBER_VERIFIED':'NOT_UNIQUE_CREW_MEMBER'});
  const patient=unwrap(response.Patient),reporter=identity(unwrap(patient?.PatientResponse)?.PatientResponseCrewMemberIDModValue);
  issues.push({scope:'Report completer',code:members(reporter,crew).length===1?'MEMBER_VERIFIED':'NOT_UNIQUE_CREW_MEMBER'});
  for(const rule of rules){
   const entries=unwrap(patient?.[rule.list]);if(!Array.isArray(entries)){issues.push({scope:rule.kind,code:'COLLECTION_UNAVAILABLE'});continue;}
   entries.forEach((entry,index)=>{
    if(unwrap(entry.DeletedStatus))return;
    const scope=rule.kind+' '+(index+1),provider=identity(entry[rule.identity]),matched=members(provider,crew);
    if(matched.length!==1){issues.push({scope,code:'PROVIDER_NOT_UNIQUE_CREW_MEMBER'});return;}
    const authority=matched[0];
    if(provider.license&&authority.identity.license&&provider.license!==authority.identity.license){issues.push({scope,code:'PROVIDER_ID_CONFLICT'});return;}
    const level=unwrap(authority.level?.CrewMemberLevel);
    const source=(resources[crewLevelField]?.Elements||[]).filter(e=>e.Id===level);
    if(unwrap(authority.level?.NotValue)||source.length!==1){issues.push({scope,code:'CREW_LEVEL_UNAVAILABLE'});return;}
    const options=(resources[rule.field]?.Elements||[]).filter(e=>e.Value===source[0].Value&&e.ActiveStatus!=='False');
    if(options.length!==1){issues.push({scope,code:'EQUIVALENT_LEVEL_UNAVAILABLE'});return;}
    const role=unwrap(entry[rule.role]);if(!role){issues.push({scope,code:'ROLE_UNAVAILABLE'});return;}
    const before=[unwrap(role[rule.key]),unwrap(role.NotValue)],target=options[0].Id;
    const correct=before[0]===target&&!before[1];issues.push({scope,code:correct?'LEVEL_MATCHES':'LEVEL_CORRECTION_NEEDED'});
    if(!correct)plans.push({scope,rule,entry,index,authority,provider,before,target});
   });
  }
  return {issues,plans};
 }
 async function context(){
  const app=window.imagetrend;if(!window.ko||!app?.currentVm?.requestData)problem('NATIVE_API_UNAVAILABLE');
  const vm=app.currentVm,url=location.href;
  if(unwrap(vm.currentIncidentReadOnlyStatus)!==false)problem('CHART_NOT_EDITABLE');
  const incident=unwrap(await vm.requestData('accessExistingObservable',{pseudoPath:'Incident'}));
  if(location.href!==url||app.currentVm!==vm)problem('CHART_CHANGED');
  const response=unwrap(unwrap(incident?.Scene)?.Response);if(!response)problem('RESPONSE_UNAVAILABLE');
  return {app,vm,url,incident,response,root:{Incident:incident},signedIn:app.cookieHelper?.readCookie('performerId')};
 }
 function editable(plan,ctx){
  if(location.href!==ctx.url||window.imagetrend.currentVm!==ctx.vm||unwrap(ctx.vm.currentIncidentReadOnlyStatus)!==false)problem('CHART_CHANGED_OR_LOCKED');
  if(typeof ctx.app.FormComposer?.isReadOnly!=='function')problem('EDITABILITY_UNAVAILABLE');
  for(const node of document.querySelectorAll('[data-bind]')){
   const c=window.ko.contextFor(node);
   if(unwrap(c?.$data?.BindingPathEntryID)===plan.rule.field&&ctx.app.FormComposer.isReadOnly(c))problem('ROLE_READ_ONLY');
  }
 }
 async function run(apply){
  if(busy)return;busy=true;$('#scan').disabled=$('#apply').disabled=true;report=[];
  try{
   const ctx=await context(),get=()=>audit(ctx.response,ctx.app.formComposer.agencyResources||{},ctx.app.cookieHelper?.readCookie('performerId'));
   const result=get();report=result.issues;
   if(apply&&result.plans.length){
    sessionStorage.setItem('gremlin-crew-audit-before',JSON.stringify({url:ctx.url,roles:result.plans.map(p=>({scope:p.scope,index:p.index,before:p.before}))}));
    for(const initial of result.plans){
     try{
      editable(initial,ctx);
      const fresh=get().plans.find(p=>p.entry===initial.entry&&p.rule===initial.rule);
      if(!fresh||fresh.target!==initial.target||fresh.authority.entry!==initial.authority.entry||JSON.stringify(fresh.before)!==JSON.stringify(initial.before))problem('ENTRY_OR_AUTHORITY_CHANGED');
      const path='Incident.Scene.Response.Patient.'+fresh.rule.list+'.'+fresh.index+'.'+fresh.rule.role+'.'+fresh.rule.key;
      const writer=new ctx.app.runForm.PresetValueViewModel({BindingPathEntryID:fresh.rule.field,BindingPathFromOrigin:path,ReportingStandardID:ctx.app.formComposer.reportingStandardID,IsMultiselect:false,IsInGrid:false,Value:fresh.target,IsNotValue:false,IsPertinentNegative:false},ctx.root);
      writer.applyPresetValue();await new Promise(r=>setTimeout(r,100));
      editable(fresh,ctx);const role=unwrap(fresh.entry[fresh.rule.role]);
      if(unwrap(role[fresh.rule.key])!==fresh.target||unwrap(role.NotValue))problem('READBACK_MISMATCH');
      report=report.filter(x=>x.scope!==fresh.scope);report.push({scope:fresh.scope,code:'CORRECTED_VERIFIED'});
     }catch(e){report.push({scope:initial.scope,code:/^[A-Z_]+$/.test(e.message)?e.message:'NATIVE_WRITE_ERROR'});}
    }
   }
  }catch(e){report.push({scope:'Audit',code:/^[A-Z_]+$/.test(e.message)?e.message:'NATIVE_ERROR'});}
  finally{$('#result').textContent=report.map(x=>x.scope+': '+x.code+(x.count!==undefined?' ('+x.count+')':'')).join('\n')||'No entries found.';busy=false;$('#scan').disabled=$('#apply').disabled=false;}
 }
 $('#scan').onclick=()=>run(false);$('#apply').onclick=()=>run(true);
 $('#copy').onclick=async()=>{const text=JSON.stringify({version:'0.1.0',findings:report},null,2);try{await navigator.clipboard.writeText(text);}catch(_){const box=document.createElement('textarea');box.value=text;box.readOnly=true;$('section').append(box);box.select();}};
 $('#hide').onclick=()=>{$('section').hidden=true;$('#launch').hidden=false;};$('#launch').onclick=()=>{$('section').hidden=false;$('#launch').hidden=true;};ui.querySelectorAll('button').forEach(b=>{b.type='button';});
})();
