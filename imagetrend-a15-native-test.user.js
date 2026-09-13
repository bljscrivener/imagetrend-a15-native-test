// ==UserScript==
// @name         Gremlin Logic A15
// @namespace    local.imagetrend.a15native
// @version      0.2.4.19
// @description  Gremlin Logic A15: native defaults, local pre-run capture, bounded recovery and linked issues. A15 chart workflow.
// @match        https://*.imagetrendelite.com/Elite/*
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  // Bootstrap-level route healing: load on Elite first, then decide whether A15 should mount.
  // This keeps route changes (including iPad OfflineEmsRunForm) from failing before A15 can recover.
  const a15SupportedRoute=()=>/^\/Elite\/.+\/(?:Offline)?EmsRunForm(?:\/|$)/i.test(location.pathname);
  if(!a15SupportedRoute()){
    let lastHref=location.href;
    const healRoute=()=>{
      if(location.href===lastHref)return;
      lastHref=location.href;
      if(a15SupportedRoute())location.reload();
    };
    addEventListener('hashchange',healRoute);
    addEventListener('popstate',healRoute);
    // ImageTrend can change routes through history APIs without emitting hashchange/popstate.
    setInterval(healRoute,1200);
    return;
  }
  if(document.getElementById('it-a15-native-test'))return;
  const choices=[{"id":"95cf67b7-74f0-5a19-b258-08c7b96ef8d6","label":"Unit Disposition","target":"Patient Contact Made"},{"id":"a5db14f5-8f30-5131-937c-912204f5151d","label":"Type of Service Requested","target":"Emergency Response (Primary Response Area)"},{"id":"ffbe72d1-96b3-53c5-a4a1-530b61be4635","label":"Number of Pt's at Scene","target":"Single"},{"id":"ccc317e4-c422-592f-b490-2f3d1473be56","label":"Cardiac Arrest","target":"No"},{"id":"57f37db6-1c94-5266-8734-10cc7c7f3903","label":"Possible Stroke","target":"No"},{"id":"a21c0596-9e23-54f5-868e-a3809e80c27f","label":"Traumatic Injury","target":"No"},{"id":"66032c95-5556-5d89-a6fc-369c5b53509b","label":"Work-Related Illness/Injury","target":"No"},{"id":"8224dbe2-d85a-5cb1-8108-61264de6dd1b","label":"Incident/Pt Disposition","target":"Transport - Pt Treated, Transported by this Unit"},{"id":"249d37ae-50e7-523e-89a9-99e79c86c69d","label":"Patient Evaluation/Care","target":"Patient Evaluated and Care Provided"},{"id":"e4a449b1-be1e-5803-9ff2-533f42478c13","label":"Crew Disposition","target":"Initiated and Continued Primary Care"},{"id":"cfb7f889-af42-5a1b-8018-a55dfa923e00","label":"Transport Disposition","target":"Transport by This EMS Unit (This Crew Only)"},{"id":"3cf8b9c0-7cf5-5581-a1b4-0a6ec9de735e","label":"Primary Role of Unit","target":"Ground Transport (ALS Equipped)","mode":"fillBlank"},{"id":"2538b000-9d1a-52ab-9082-14aaa092730c","label":"Barriers to Patient Care","target":"None Noted","mode":"fillBlank"},{"id":"a43e6fca-b6bd-5c15-b9f4-9afb7773582b","label":"Number of Pts Transported in this Unit","target":"1","input":true,"mode":"fillBlank"},{"id":"12e06449-632f-5f97-b454-ec747e814719","label":"EMS Transport Method","target":"Ground-Ambulance","mode":"fillBlank"},{"id":"62dd5264-cd67-56ec-a3d3-f35e00818537","label":"Transport Mode from Scene","target":"Without Lights and Sirens","mode":"fillBlank"},{"id":"c05db124-d7cf-542c-a7bd-dbd12066f73d","label":"Transport from Scene Type","target":"No Lights or Sirens","mode":"fillBlank"},{"id":"0bf28da1-6fc8-5cb0-a49f-9541aef01cae","label":"How Pt Was Moved to Ambulance","target":"Stretcher","mode":"fillBlank"},{"id":"fca2bbb8-e1de-56ec-973e-7f6f1a597a03","label":"Patient Secured By","target":"Cot- 5 straps, Including Shoulders","mode":"fillBlank"},{"id":"fa166830-90f8-5671-8e1d-3e729c9779ec","label":"Position of Pt During Transport","target":"Semi-Fowlers","mode":"fillBlank"},{"id":"fe9abea5-c339-5375-a38c-3c9f8cbc6e54","label":"How Pt Was Moved From Ambulance","target":"Stretcher","mode":"fillBlank"},{"id":"969e7423-2a24-5d5c-b47b-a1331eb124d9","label":"Final Pt Acuity","target":"Lower Acuity (Green)","mode":"fillBlank"},{"id":"50ac60ee-31b5-5836-b004-25def8d05ae7","label":"Accepting Hospital Notified","target":"Yes","mode":"fillBlank"},{"id":"fe38276c-e64c-5d82-b377-fed71bb7023e","label":"Facility Notified By","target":"Phone","mode":"fillBlank"},{"id":"16ccfb92-ef4d-5527-a0ee-39639fd222f4","label":"Destination Team Pre-Arrival Alert or Activation","target":"No","mode":"fillBlank"},{"id":"ae3afe47-5b10-5761-8ee0-db6094b90b5c","label":"Type of Destination","target":"Hospital-Emergency Department","mode":"fillBlank"},{"id":"7f5c88af-a3be-5947-b47b-ffe6cc957102","label":"AVPU","target":"Alert","mode":"fillBlank"},{"id":"94f6e43f-139c-5eda-bd46-bdb95d7111bd","label":"GCS Eye","target":"4- Opens Eyes spontaneously (All Age Groups)","mode":"fillBlank"},{"id":"30b5cc8f-c8c4-5446-a140-df8017828842","label":"GCS Verbal","target":"5- Oriented (>2 Years); Smiles, oriented to sounds, follows objects, interacts","mode":"fillBlank"},{"id":"de69b8e0-ea97-5898-af28-163665df5d03","label":"GCS Motor","target":"6- Obeys commands (>2Years); Appropriate response to stimulation","mode":"fillBlank"},{"id":"d6db496e-fd74-5d8a-a016-e324072dcb9c","label":"GCS Qualifier","target":"Initial GCS has legitimate values without interventions such as intubation and sedation","mode":"fillBlank"},{"id":"0dcf3d4f-f98d-53c9-a042-3bd73e6104d9","label":"BP Method","target":"Cuff-Automated","mode":"fillBlank"},{"id":"189b8c3d-3285-5066-b469-296a5c87d922","label":"HR Method","target":"Electronic Monitor - Pulse Oximeter","mode":"fillBlank"},{"id":"1ac08c15-b252-5b17-bdd5-990dfb81b475","label":"Respiratory Effort","target":"Normal","mode":"fillBlank"},{"id":"98cd8d07-762f-5665-9bef-e9b908b6d9dd","label":"Pulse Oximetry Qualifier","target":"Room Air","mode":"fillBlank"},{"id":"37a26280-090a-5d8d-b95d-c6c950839a6f","label":"Pain Scale Type","target":"Numeric (0-10)","mode":"fillBlank"},{"id":"10388fca-facb-5673-87e2-e109f28bd064","label":"Stroke Scale Score","target":"Negative","mode":"fillBlank"},{"id":"408ab322-147e-5539-afaf-2062d143a55c","label":"Stroke Scale Type","target":"FAST","mode":"fillBlank"},{"id":"fc93d071-9efc-5ce9-a393-3507852a8e19","label":"ECG Interpretation","target":"Not Applicable","mode":"fillBlank"},{"id":"c07c1d8b-c7d4-5a5a-8ec1-01bf67f882e0","label":"Procedure Performed Prior to this Unit's EMS Care","target":"No","mode":"fillBlank"},{"id":"d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7","label":"Role/Type of Person Performing the Procedure","target":"Paramedic","mode":"procedureRole"},{"id":"6a3cd763-c562-574c-b209-bbced74d73c1","label":"Procedure Authorization","target":"Protocol (Standing Order)","mode":"fillBlank"},{"id":"adcc71b8-0b92-5387-8b9f-cb94b729e4ac","label":"Procedure Successful","target":"Yes","mode":"fillBlank"},{"id":"72b9a56c-7b33-51b6-ae0f-0fe6a14ce702","label":"First EMS Unit on Scene","target":"Yes"},{"id":"9c627521-8b03-58e4-b7ee-7d57e7ecd0cc","label":"Additional Response Mode Descriptors","target":"No Lights or Sirens"}];
  const host=document.createElement('div');host.id='it-a15-native-test';
  host.style.cssText='position:fixed;right:24px;top:90px;z-index:2147483646';
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML='<style>:host{font:14px system-ui;color:#253144}section{background:white;border:2px solid #864ca3;border-radius:12px;padding:16px;width:440px;max-width:85vw;max-height:70vh;overflow:auto;box-shadow:0 8px 24px #0004}button,select{font:inherit;padding:8px;margin:5px 0}select{width:100%}pre{white-space:pre-wrap;font:12px system-ui;background:#f4edf8;padding:9px}label{display:block;margin:10px 0}h3{margin:0}small{display:block;margin:8px 0}button{cursor:pointer}#apply{background:#864ca3;color:white;border:0;border-radius:5px}button:disabled{opacity:.45}[hidden]{display:none!important}</style><button id="launch">Gremlin Logic A15</button><section hidden><h3>Gremlin Logic · A15 0.2.4.19</h3><small>A15 chart workflow. Changes may persist immediately; chart Save remains yours.</small><p id="profile"><strong>Profile: A15</strong></p><button id="preview">Preview A15 changes</button><pre id="result">Review from any chart section. All mapped A15 defaults are selected; unavailable fields are listed for attention.</pre><small id="apply-note">Go, baby, go applies supported A15 defaults. Use only when they match the care provided. You remain responsible for chart accuracy and final review.</small><button id="apply" disabled>Go, baby, go</button> <button id="hide">Minimize</button></section>';
  document.body.append(host);
  const $=s=>ui.querySelector(s);let reviewed=null,busy=false;
  const ENTRY_PATHS={"8a6e1556-e16f-516e-9f09-2a01527a24ba":"Incident.Scene.Response.Patient.Vitals","53af0886-1a17-576c-b77d-d64b3a7a930a":"Incident.Scene.Response.Patient.Vitals[].VitalsVitalsDateTimeModValue.VitalsDateTime","3ecad398-beca-5784-94f0-217e4bf92db7":"Incident.Scene.Response.Patient.Vitals[].VitalsObtainedPriorToEMSCareModValue.ObtainedPriorToEMSCare","8375d602-dcd5-5c1a-83e1-ceda50c7410c":"Incident.Scene.Response.Patient.Vitals[].VitalsCrewMemberIDModValue.LicensureID","7f5c88af-a3be-5947-b47b-ffe6cc957102":"Incident.Scene.Response.Patient.Vitals[].VitalsLevelOfResponseModValue.LevelOfResponse","94f6e43f-139c-5eda-bd46-bdb95d7111bd":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSEyeModValue.GCSEye","30b5cc8f-c8c4-5446-a140-df8017828842":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSVerbalModValue.GCSVerbal","de69b8e0-ea97-5898-af28-163665df5d03":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSMotorModValue.GCSMotor","d6db496e-fd74-5d8a-a016-e324072dcb9c":"Incident.Scene.Response.Patient.Vitals[].GCSQualifiers[].GCSQualifierGCSQualifierModValue.GCSQualifier","4fcdbba5-c769-5176-b37b-64db2f5aff94":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSTotalModValue.GCSTotal","b0258daa-3a9c-5a0d-8f6d-629891c26562":"Incident.Scene.Response.Patient.Vitals[].VitalsSBPModValue.SBP","6fd0cdf7-f71a-50a9-b02a-5819f40e356a":"Incident.Scene.Response.Patient.Vitals[].VitalsDBPModValue.DBP","0dcf3d4f-f98d-53c9-a042-3bd73e6104d9":"Incident.Scene.Response.Patient.Vitals[].VitalsBPMethodModValue.BPMethod","37500c2a-2a78-53d2-9559-78c75eda9cb3":"Incident.Scene.Response.Patient.Vitals[].BPLocation","08dee948-3a33-5983-b74f-fe5823ae94a0":"Incident.Scene.Response.Patient.Vitals[].MeanArterialPressure","8d1b6f04-cc37-5ee1-85f7-9619cfb05873":"Incident.Scene.Response.Patient.Vitals[].VitalsPulseRateModValue.PulseRate","189b8c3d-3285-5066-b469-296a5c87d922":"Incident.Scene.Response.Patient.Vitals[].PulseRateMethod","946f201d-2126-5b9a-b73c-b6a098c254da":"Incident.Scene.Response.Patient.Vitals[].VitalsRespiratoryRateModValue.RespiratoryRate","1ac08c15-b252-5b17-bdd5-990dfb81b475":"Incident.Scene.Response.Patient.Vitals[].RespiratoryEffort","d4b32d81-fc1e-544f-aeba-77e176cac505":"Incident.Scene.Response.Patient.Vitals[].RespiratoryRegularity","76e7fb24-9a8f-51e9-8dfb-bdf1144ef197":"Incident.Scene.Response.Patient.Vitals[].VitalsPulseOximetryModValue.PulseOximetry","98cd8d07-762f-5665-9bef-e9b908b6d9dd":"Incident.Scene.Response.Patient.Vitals[].PulseOximetryQualifier","d892f99f-5dcc-5abb-b2fe-8a0d1935e581":"Incident.Scene.Response.Patient.Vitals[].VitalsCarbonDioxideModValue.CarbonDioxide","01975843-3408-5a00-b45b-79e64e0db108":"Incident.Scene.Response.Patient.Vitals[].VitalsCarbonDioxideModValue.Unit","84dd4a6f-18ce-51e2-a00c-1e54d1c31ead":"Incident.Scene.Response.Patient.Vitals[].VitalsBloodGlucoseModValue.BloodGlucose","7bea3862-f196-567b-b9e9-9239b9f103e8":"Incident.Scene.Response.Patient.Vitals[].VitalsBodyTemperatureCModValue.BodyTemperatureC","73e8899f-058f-5144-88f3-1c1640cb7a7d":"Incident.Scene.Response.Patient.Vitals[].TemperatureMethod","42cf38a8-8380-571b-93d4-392a3183d47c":"Incident.Scene.Response.Patient.Vitals[].VitalsPainScoreModValue.PainScore","37a26280-090a-5d8d-b95d-c6c950839a6f":"Incident.Scene.Response.Patient.Vitals[].VitalsPainScaleTypeModValue.PainScaleType","10388fca-facb-5673-87e2-e109f28bd064":"Incident.Scene.Response.Patient.Vitals[].VitalsStrokeScoreModValue.StrokeScore","408ab322-147e-5539-afaf-2062d143a55c":"Incident.Scene.Response.Patient.Vitals[].VitalsStrokeScaleTypeModValue.StrokeScaleType","ee0c31ce-9274-5df2-a435-95915e6e2ddb":"Incident.Scene.Response.Patient.Vitals[].RichmondAgitationSedationScale","5c02d626-6c37-5418-bb6e-696df46b3ef0":"Incident.Scene.Response.Patient.Vitals[].VitalsAPGARModValue.APGAR","59cd95c4-0496-546f-8c53-4b21bf9ff965":"Incident.Scene.Response.Patient.Vitals[].VitalsThrombolyticScreenModValue.ThrombolyticScreen","5ef095a7-a0ef-5d0b-9dcf-6a12ce47f85f":"Incident.Scene.Response.Patient.Vitals[].VitalsECGTypeModValue.ECGType","fc93d071-9efc-5ce9-a393-3507852a8e19":"Incident.Scene.Response.Patient.Vitals[].ECGCardiacRhythms[].ECGCardiacRhythmCardiacRhythmModValue.CardiacRhythm","50afd178-e284-59dd-a4f8-463af0acfad3":"Incident.Scene.Response.Patient.Vitals[].ECGInterpretations[].ECGInterpretationInterpretationMethodModValue.InterpretationMethod","1b57645d-c521-5d46-a400-5a67aaec7aad":"Incident.Scene.Response.Patient.Vitals[].VitalsWaveforms","c9b0b483-c98e-5a08-bd18-89a337374339":"Incident.Scene.Response.Patient.ProtocolUseds","915663be-bec8-5dc5-b2ae-e1901f5ade04":"Incident.Scene.Response.Patient.ProtocolUseds[].ProtocolUsedProtocolModValue.Protocol","51af94d0-e421-5002-af47-2539205ff625":"Incident.Scene.Response.Patient.ProtocolUseds[].ProtocolUsedProtocolAgeCategoryModValue.ProtocolAgeCategory","aa6d315f-ccbc-58c0-950e-2e0932ee67b6":"Incident.Scene.Response.Patient.PatientProcedures","231489ba-6c9e-5e78-a52b-40b13e6bcc26":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureDateTimeModValue.ProcedureDateTime","c07c1d8b-c7d4-5a5a-8ec1-01bf67f882e0":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePriorToEMSUnitCareModValue.PriorToEMSUnitCare","31eb2248-cb52-f111-b7ac-b38df619f2c6":"Incident.Scene.Response.Patient.PatientProcedures[].SupplementalQuestions.31eb2248-cb52-f111-b7ac-b38df619f2c6","03581536-da9b-562c-9229-8a29353b5f40":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureCrewMemberIDModValue.LicensureID","9d0465df-a31c-f111-88a8-cdf828d6164c":"Incident.Scene.Response.Patient.PatientProcedures[].SupplementalQuestions.9d0465df-a31c-f111-88a8-cdf828d6164c","d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePerformerRoleModValue.PerformerRole","6a3cd763-c562-574c-b209-bbced74d73c1":"Incident.Scene.Response.Patient.PatientProcedures[].ProcedureAuthorization","02dffd5f-4c68-506b-881d-5b00c78090aa":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedurePerformedModValue.ProcedurePerformed","14775b1d-c505-5161-b7c9-7c9ea3c56cc4":"Incident.Scene.Response.Patient.PatientProcedures[].SizeOfEquipment","7f9c5ed0-8a4e-5f82-be4b-c6139be2f60a":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureLocationModValue.ProcedureLocation","342287d1-d2df-5bc9-bc3a-572db35c10bb":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureVascularAccessLocationModValue.VascularAccessLocation","536eb7cc-2c34-58bc-994b-c46c6e5ee80f":"Incident.Scene.Response.Patient.PatientProcedures[].LaryngoscopeBladeProcedure","73a818d0-5b75-5cbf-911a-114f70d294e5":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureNumberOfAttemptsModValue.NumberOfAttempt","adcc71b8-0b92-5387-8b9f-cb94b729e4ac":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureSuccessfulModValue.ProcedureSuccessful","9cb81cbd-eb5d-5516-aacd-1a75a68e99a2":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureComplications[].PatientProcedureComplicationProcedureComplicationModValue.ProcedureComplication","5d094507-a437-5112-8f16-58d56704dc7c":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePatientResponseModValue.PatientResponse","21fff6b7-0787-5a85-91f4-3b6ec40cc2fa":"Incident.Scene.Response.Patient.PatientProcedures[].ProcedureComment","c432c124-8bd9-ef11-bfc8-001dd8b72ccf":"Incident.SupplementalQuestions.c432c124-8bd9-ef11-bfc8-001dd8b72ccf","417e9589-a07e-5982-8cec-7893618b9f83":"Incident.Scene.Response.Patient.Medications"};
  choices.push({id:'3ecad398-beca-5784-94f0-217e4bf92db7',label:'Obtained Prior to This Unit EMS Care',target:'No'});
  choices.push({id:'231489ba-6c9e-5e78-a52b-40b13e6bcc26',label:'Procedure timestamp',time:true});
  const procedureNames=['Assessment -ALS','Neurological assessment','Stroke Assessment','Adult pain assessment','Moving a patient to a stretcher'];
  function procedureName(entry,{quiet=false}={}){
    const ko=window.ko,answer=ko.unwrap(entry.PatientProcedureProcedurePerformedModValue);
    const code=ko.unwrap(answer?.PlusOneCode)||ko.unwrap(answer?.ProcedurePerformed);
    const canonical=x=>norm(x).replace(/\s+/g,' ').replace(/\s*-\s*/g,'-').toLowerCase();
    const candidates=[...new Set(Object.values(window.imagetrend.formComposer.agencyResources||{}).flatMap(r=>(r?.Elements||[]).filter(e=>String(e.Id)===String(code)).map(e=>canonical(e.Value))))];
    if(!candidates.length){if(quiet)return null;throw Error('Procedure code has no loaded display mapping. Open its entry and preview again.');}
    if(candidates.length!==1){if(quiet)return null;throw Error('Procedure code has conflicting display mappings.');}
    const known=procedureNames.find(n=>canonical(n)===candidates[0]);
    return known || null;
  }
  let times={},invalidTimes=new Set();
  function procedureTiming(name){
    const scene=times['29335'],depart=times['29337'],patient=times['29336'];let value,source;
    if(name==='Moving a patient to a stretcher'){
      if(invalidTimes.has('29337'))throw Error('Departure time is invalid; correct it before calculating stretcher time.');
      if(depart!=null){value=depart-120000;source='Depart Scene − 2 minutes';if(scene!=null&&value<scene)throw Error('Stretcher time precedes scene arrival.');}
      else if(scene!=null){value=scene+120000;source='Arrived on Scene + 2 minutes';}
      if(value!=null&&patient!=null&&value<patient)throw Error('Stretcher time precedes patient contact.');
      if(value!=null&&times['29338']!=null&&value>times['29338'])throw Error('Stretcher time is after destination arrival.');
    }else {value=patient;source='Arrived at Patient';}
    if(value==null)throw Error('Required timeline timestamp: '+missingTimes(name==='Moving a patient to a stretcher'?['29335','29337']:['29336']));
    return {value:localStamp(value),source};
  }
  const visible=n=>!!n&&n.isConnected&&!!n.getClientRects().length;
  const norm=x=>String(x??'').trim();
  function reset(){reviewed=null;$('#apply').disabled=busy;}
  function resolve(root,path,ko){let n=root;if(!path)return n;for(const p of path.split('.')){n=ko.unwrap(n);if(n==null||!(p in Object(n)))throw Error('Native field path unavailable.');n=n[p];}return n;}
  function inspect(choice){
    const app=window.imagetrend,ko=window.ko;let c=choice;
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
    if(PRIORITY_FIELDS.has(c.id))c=priorityChoice(c);
    if(c.problem)throw Error(c.problem);

    const captured=ENTRY_PATHS[c.id];
    const repeated=captured&&/^Incident.Scene.Response.Patient.(Vitals|PatientProcedures)\[\]\./.test(captured);
    let template,path,entry=null;
    if(repeated){
      const collectionPath=captured.split('[]')[0];
      const roots=[...new Set(owners)].filter(r=>{try{return Array.isArray(ko.unwrap(resolve(r,collectionPath,ko)));}catch(_){return false;}});
      if(roots.length!==1)throw Error('Cannot uniquely resolve entry collection.');
      const entries=ko.unwrap(resolve(roots[0],collectionPath,ko));
      if(!c.entry)throw Error(entries.length?'Entry selection required.':'No existing entries; creation remains manual.');
      const index=entries.indexOf(c.entry);
      if(index<0||entries.lastIndexOf(c.entry)!==index)throw Error('Reviewed entry removed or ambiguous.');
      entry=c.entry;
      if(collectionPath.endsWith('PatientProcedures')){
        const name=procedureName(entry);if(!name)throw Error('Unrelated procedure preserved.');c={...c,entryLabel:name+' · entry '+(index+1)};
        if(c.time){const timing=procedureTiming(name);c={...c,target:timing.value,source:timing.source};}
      }
      path=captured.replace('[]','.'+index);
      template={BindingPathEntryID:c.id,BindingPathFromOrigin:path,ReportingStandardID:app.formComposer.reportingStandardID,IsMultiselect:path.includes('[]'),IsInGrid:false};
    }else{
      learnDefinitions();
      const templates=[...(app.formComposer.agencyPresetValues||[]).flatMap(d=>d.PresetValues||[]),...learnedDefinitions.values()].filter(d=>d.BindingPathEntryID===c.id&&d.ReportingStandardID===app.formComposer.reportingStandardID);
      if(!templates.length&&captured)templates.push({BindingPathEntryID:c.id,BindingPathFromOrigin:captured,ReportingStandardID:app.formComposer.reportingStandardID,IsMultiselect:captured.includes('[]'),IsInGrid:false});
      if(!templates.length)throw Error('Needs attention: no loaded native field mapping.');
      const signatures=[...new Set(templates.map(d=>JSON.stringify([d.BindingPathFromOrigin,!!d.IsMultiselect,!!d.IsInGrid])))];
      if(signatures.length!==1)throw Error('Needs attention: ambiguous native field mapping.');
      template=templates[0];path=template.BindingPathFromOrigin;
      if(template.IsInGrid||typeof path!=='string'||!path.startsWith('Incident.')||(path.match(/\[\]/g)||[]).length>(template.IsMultiselect?1:0))throw Error('Needs attention: unsupported repeated-entry mapping.');
    }
    if(c.problem)throw Error(c.problem);
    if(c.time&&!c.target)throw Error('Required timeline timestamp: '+missingTimes(['29338']));
    // Resolve an agency-specific ID only from an exact structural path.
    // Labels and ControlID alone never authorize a field substitution.
    learnDefinitions();
    const structural=[...(app.formComposer.agencyPresetValues||[]).flatMap(d=>d.PresetValues||[]),...learnedDefinitions.values()].filter(d=>d.ReportingStandardID===app.formComposer.reportingStandardID&&d.BindingPathFromOrigin===path);
    const nativeIds=[...new Set(structural.map(d=>d.BindingPathEntryID))];
    if(nativeIds.length>1)throw Error('Conflicting agency field identities.');
    const nativeId=nativeIds[0]||template.BindingPathEntryID;
    const nativeContexts=contexts.filter(ctx=>ko.unwrap(ctx.$data?.BindingPathEntryID)===nativeId);
    if(nativeContexts.some(ctx=>app.FormComposer.isReadOnly(ctx)))throw Error('Target field is read-only.');
    template={...template,BindingPathEntryID:nativeId};
    const resources=app.formComposer.agencyResources?.[nativeId.toLowerCase()];
    const special=c.label==='ECG Interpretation'&&c.target==='Not Applicable';
    const requested=c.targets||[c.target];
    const matches=requested.map(target=>(c.time||c.input)?[{Id:target}]:(resources?.[special?'NotValues':'Elements']||[]).filter(e=>norm(e.Value)===norm(target)));
    if(matches.some(m=>m.length>1))throw Error('Needs attention: exact target choice ambiguous.');
    if(matches.some(m=>m.length===0))throw Error('Needs attention: exact target choice missing.');
    if(matches.some(m=>!m[0].Id||String(m[0].Id).includes('|')))throw Error('Needs attention: unsupported target code.');
    const code=matches.map(m=>String(m[0].Id)).join('|');
    if(c.targets)c={...c,target:requested.join('; ')};
    c={...c,path,value:code,multi:!!template.IsMultiselect};
    const defs=[{...template,Value:code,IsNotValue:special,IsPertinentNegative:false}];
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
    const current=(c.time||c.input)?norm(answers[0]):norm(ko.unwrap(vm.currentValueDisplay)),target=(c.time||c.input)?c.target:norm(ko.unwrap(vm.presetValueDisplay));
    if(!target||target!==norm(c.target))throw Error('Native preset could not translate the target code to a display value.');
    // The native multiselect writer removes all entries, so only an empty collection is eligible.
    const canApply=(repeated||PRIORITY_FIELDS.has(c.id))?current!==target:!current&&(c.multi?collection.length===0:answers.every(value=>value==null||value===''));
    if(repeated&&!c.multi&&!c.time){
      const raw=answers[3]??answers[0]??answers[1]??answers[2];
      const display=raw==null?'':norm([...(resources?.Elements||[]),...(resources?.NotValues||[]),...(resources?.PertinentNegatives||[])].find(x=>x.Id===raw)?.Value??raw);
      if(current!==display)throw Error('Native entry read-back does not match the addressed answer.');
    }
    return {c,root,vm,snapshot,current,target,canApply,url:location.href,endpoint};
  }
  function groupedIssues(items){
    const groups=new Map();for(const x of items.filter(x=>x.error)){
      const key=(x.c.entryLabel||x.c.label)+': '+x.error;
      if(!groups.has(key))groups.set(key,new Set());groups.get(key).add(x.c.label);
    }
    return [...groups].map(([message,fields])=>message+(fields.size>1?' [affects '+fields.size+' fields]':'')).join('\n');
  }
  function expandChoice(c){
    const path=ENTRY_PATHS[c.id];
    if(!path||!/^Incident.Scene.Response.Patient.(Vitals|PatientProcedures|Medications)\[\]\./.test(path))return [c];
    const ko=window.ko,form=document.querySelector('#form-composer');
    if(!ko||!form)return [c];
    const contexts=[form,...form.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(Boolean);
    const roots=[...new Set(contexts.flatMap(x=>[x.$root,x.$data,...(x.$parents||[])]))].filter(r=>{try{return Array.isArray(ko.unwrap(resolve(r,path.split('[]')[0],ko)));}catch(_){return false;}});
    if(roots.length!==1)return [c];
    const entries=ko.unwrap(resolve(roots[0],path.split('[]')[0],ko));
    return entries.flatMap((entry,i)=>{if(path.includes('.PatientProcedures[]')&&!procedureName(entry,{quiet:true}))return [];return [{...c,entry,label:c.label,entryLabel:(path.includes('.Vitals[]')?'Vital':path.includes('.Medications[]')?'Medication':'Procedure')+' '+(i+1)}];});
  }

  let stopRequested=false,clearProblems=[];
  const learnedDefinitions=new Map();
  function learnDefinitions(){
    const ko=window.ko;if(!ko?.contextFor)return;
    for(const node of document.querySelectorAll('[data-bind]')){
      const ctx=ko.contextFor(node);for(const d of [ctx?.$data,...(ctx?.$parents||[])]){
        const id=ko.unwrap(d?.BindingPathEntryID),path=ko.unwrap(d?.BindingPath)||ko.unwrap(d?.BindingPathFromOrigin);
        if(!id||typeof path!=='string'||!path.startsWith('Incident.'))continue;
        const def={BindingPathEntryID:id,BindingPathFromOrigin:path,ReportingStandardID:window.imagetrend.formComposer.reportingStandardID,IsMultiselect:path.includes('[]'),IsInGrid:false};
        learnedDefinitions.set(id+'|'+path,def);
      }
    }
  }
  const patientPrefix='Incident.Scene.Response.Patient.';
  ENTRY_PATHS['2538b000-9d1a-52ab-9082-14aaa092730c']=patientPrefix+'PatientBarriers[].PatientBarrierBarrierModValue.Barrier';
  ENTRY_PATHS['ae3afe47-5b10-5761-8ee0-db6094b90b5c']=patientPrefix+'Disposition.DispositionDestinationTypeModValue.DestinationType';
  Object.assign(ENTRY_PATHS,Object.fromEntries([
    ['a43e6fca-b6bd-5c15-b9f4-9afb7773582b','Disposition.DispositionNumberOfPatientsTransportedModValue.NumberOfPatientsTransported'],
    ['12e06449-632f-5f97-b454-ec747e814719','Disposition.DispositionEMSTransportMethodModValue.EMSTransportMethod'],
    ['62dd5264-cd67-56ec-a3d3-f35e00818537','Disposition.DispositionTransportModeFromSceneModValue.TransportModeFromScene'],
    ['c05db124-d7cf-542c-a7bd-dbd12066f73d','Disposition.AdditionalTransportModes[].AdditionalTransportModeTransportModeModValue.TransportMode'],
    ['0bf28da1-6fc8-5cb0-a49f-9541aef01cae','Disposition.PatientToAmbulances[].MethodPatientMoved'],
    ['fca2bbb8-e1de-56ec-973e-7f6f1a597a03','SafetyCheckPatientSecureds[].SecuredBy'],
    ['fa166830-90f8-5671-8e1d-3e729c9779ec','Disposition.PatientTransportPositions[].PatientTransportPosition1'],
    ['fe9abea5-c339-5375-a38c-3c9f8cbc6e54','Disposition.DispositionMethodPatientMovedFromAmbulances[].MethodPatientMovedFromAmbulance'],
    ['969e7423-2a24-5d5c-b47b-a1331eb124d9','Disposition.DispositionPatientConditionAtDestinationModValue.PatientConditionAtDestination'],
    ['50ac60ee-31b5-5836-b004-25def8d05ae7','InterfacilityTransfer.AcceptingHospitalNotified'],
    ['fe38276c-e64c-5d82-b377-fed71bb7023e','Disposition.FacilityNotifiedBy'],
    ['16ccfb92-ef4d-5527-a0ee-39639fd222f4','Disposition.HospitalTeamActivations[].HospitalTeamActivationPreArrivalActivationModValue.PreArrivalActivation']
  ].map(([id,path])=>[id,patientPrefix+path])));
  ENTRY_PATHS['9753adcb-f760-554b-94d6-60a5e82badd8']='Incident.Scene.Response.ResponseTime.ReceivingHospitalContacted';
  const delays=[['a7f8dd77-6a81-580f-9b55-43325de410c0','Response Delay','ResponseDelays[].ResponseDelayDelayReasonModValue.DelayReason'],['b8e1199a-3d25-5c25-9d50-25743474a17d','Scene Delay','SceneDelays[].SceneDelayDelayReasonModValue.DelayReason'],['3ecd70cc-229a-541b-993c-60d0928e963c','Transport Delay','TransportDelays[].TransportDelayDelayReasonModValue.DelayReason'],['6f0ddd39-647d-5bbc-a963-19a0bbf7fb9a','Destination Delay','TurnAroundDelays[].TurnAroundDelayDelayReasonModValue.DelayReason']];
  delays.forEach(([id,,path])=>ENTRY_PATHS[id]='Incident.Scene.Response.'+path);
  function localStamp(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw Error('Invalid timestamp.');const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;}
  const PRIORITY_FIELDS=new Set(['a5db14f5-8f30-5131-937c-912204f5151d','c1aa0ea5-0ad9-52d7-9170-4f0a725c2699','9c627521-8b03-58e4-b7ee-7d57e7ecd0cc']);
  Object.assign(ENTRY_PATHS,{
    'a5db14f5-8f30-5131-937c-912204f5151d':'Incident.Scene.Response.TypeOfServiceRequested',
    'c1aa0ea5-0ad9-52d7-9170-4f0a725c2699':'Incident.Scene.Response.ResponseModeToScene',
    '9c627521-8b03-58e4-b7ee-7d57e7ecd0cc':'Incident.Scene.Response.ResponseModes[].ResponseModeResponseModeModValue.ResponseMode',
    '3cf8b9c0-7cf5-5581-a1b4-0a6ec9de735e':'Incident.Scene.Response.PrimaryRoleOfUnit'
  });
  choices.push({id:'c1aa0ea5-0ad9-52d7-9170-4f0a725c2699',label:'Response Mode to Scene'});
  function priorityChoice(c){
    const value=window.ko.unwrap(resolve(currentRoot(),'Incident.Scene.Response.DispatchPriority',window.ko));
    const codes=['DispatchPriorityLevel_Priority1Critical','DispatchPriorityLevel_Priority2Emergent','DispatchPriorityLevel_Priority3LowerAcuity','DispatchPriorityLevel_Priority4NonAcuteegScheduledTransferorStandby','DispatchPriorityLevel_Priority5'];
    const priority=codes.indexOf(value)+1;
    if(!priority)throw Error('Dispatch Priority is missing or unsupported; response mode and service require review.');
    let target;
    if(c.id==='a5db14f5-8f30-5131-937c-912204f5151d'){
      if(priority>2)throw Error('Priority '+priority+': confirm transfer/service type manually; no service assumption applied.');
      target='Emergency Response (Primary Response Area)';
    }else if(c.id==='c1aa0ea5-0ad9-52d7-9170-4f0a725c2699')target=priority===1?'With Lights and Sirens':'Without Lights and Sirens';
    else {
      target=priority===1?'Lights and Sirens':'No Lights or Sirens';
      const ko=window.ko,list=ko.unwrap(resolve(currentRoot(),ENTRY_PATHS[c.id].split('[]')[0],ko));
      if(!Array.isArray(list))throw Error('Response descriptors collection unavailable.');
      const resources=window.imagetrend.formComposer.agencyResources?.[c.id]?.Elements||[];
      const retained=[];
      for(const entry of list){
        const mod=ko.unwrap(entry.ResponseModeResponseModeModValue),code=ko.unwrap(mod?.PlusOneCode)||ko.unwrap(mod?.ResponseMode);
        const matches=resources.filter(x=>x.Id===code);
        if(matches.length!==1)throw Error('Existing response descriptor is unknown; review before replacing.');
        const label=matches[0].Value;
        if(!['Lights and Sirens','No Lights or Sirens'].includes(label))retained.push(label);
      }
      if(retained.length)return {...c,target,targets:[...new Set([...retained,target])],prioritySource:value};
    }
    return {...c,target,prioritySource:value};
  }
  const TIME_LABELS={
    '29331':'Unit Notified by Dispatch','29332':'Unit En Route Date/Time',
    '29335':'Unit Arrived on Scene','29336':'Arrived at Patient',
    '29337':'Unit Left Scene','29338':'Arrived at Destination','29342':'Unit Back in Service'
  };
  function timePair(node){
    if(!node)return null;
    const region=node.closest('.grid-flyout-active')||document;
    const prefix=node.id.replace(/(Date|Time)$/,'');
    let date=[...region.querySelectorAll('input')].filter(n=>n.id===prefix+'Date'&&visible(n));
    let time=[...region.querySelectorAll('input')].filter(n=>n.id===prefix+'Time'&&visible(n));
    if(date.length===1&&time.length===1)return {date:date[0],time:time[0]};
    for(let parent=node.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
      const inputs=[...parent.querySelectorAll('input')].filter(n=>visible(n)&&n.type!=='hidden');
      if(inputs.length>2)break;
      if(inputs.length===2&&inputs.includes(node))return {date:inputs[0],time:inputs[1]};
    }
    return null;
  }
  function timelinePair(id){
    const clean=x=>String(x||'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().replace(/:$/,'');
    const labels=[...document.querySelectorAll('label,span,div')].filter(n=>visible(n)&&n.children.length===0&&clean(n.textContent)===TIME_LABELS[id]);
    const pairs=[];
    for(const label of labels){
      for(let p=label.parentElement;p&&p!==document.body;p=p.parentElement){
        const inputs=[...p.querySelectorAll('input')].filter(n=>visible(n)&&n.type!=='hidden');
        if(inputs.length>2)break;
        if(inputs.length===2){pairs.push({date:inputs[0],time:inputs[1]});break;}
      }
    }
    const unique=pairs.filter((p,i)=>pairs.findIndex(q=>q.date===p.date)===i);
    if(unique.length===1)return unique[0];
    if(unique.length>1)throw Error(TIME_LABELS[id]+': multiple visible timestamp controls.');
    const dates=[...document.querySelectorAll('input')].filter(n=>n.id===id+'Date'&&visible(n));
    return dates.length===1?timePair(dates[0]):null;
  }
  function parseWallTime(date,time){
    const d=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim()),t=/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
    if(!d||!t)return null;
    const v=new Date(+d[3],+d[1]-1,+d[2],+t[1],+t[2],+(t[3]||0));
    return v.getFullYear()===+d[3]&&v.getMonth()===+d[1]-1&&v.getDate()===+d[2]&&v.getHours()===+t[1]&&v.getMinutes()===+t[2]&&+(t[3]||0)<60?v.getTime():null;
  }
  let timelineError='';
  async function readTimes(){
    const ids=Object.keys(TIME_LABELS),url=location.href;let opener=null;
    times={};invalidTimes=new Set();timelineError='';
    const loaded=()=>ids.every(id=>timelinePair(id));
    const anyLoaded=()=>ids.some(id=>timelinePair(id));
    try{
      if(!loaded()){
        opener=document.querySelector('#response-times-tool')||[...document.querySelectorAll('[title],button,a')].find(n=>visible(n)&&(n.title==='Times'||n.textContent.trim()==='Times'));
        if(!opener&&!anyLoaded())throw Error('Times opener not found; open Times and run again.');
        if(opener){opener.click();
        for(let i=0;i<40&&!loaded();i++)await new Promise(r=>setTimeout(r,100));}
      }
      if(url!==location.href||!anyLoaded())throw Error('Response Times did not load.');
      // Wait for bound values to settle, not merely for the panel container to appear.
      let last='',stable=0;
      for(let i=0;i<20;i++){
        const now=JSON.stringify(ids.map(id=>{const p=timelinePair(id);return p?[p.date.value,p.time.value]:null;}));
        stable=now===last?stable+1:0;last=now;
        if(stable>=2)break;await new Promise(r=>setTimeout(r,100));
      }
      if(url!==location.href)throw Error('Chart changed while reading Times.');
      for(const id of ids){const pair=timelinePair(id);if(!pair)continue;const v=parseWallTime(pair.date.value,pair.time.value);if(v!=null)times[id]=v;else if(pair.date.value||pair.time.value)invalidTimes.add(id);}
    }catch(e){times={};timelineError=e.message;}
    finally{if(opener&&url===location.href){try{if(anyLoaded())opener.click();}catch(_){/* retain the read error */}}}
  }
  function missingTimes(ids){return ids.filter(id=>times[id]==null).map(id=>TIME_LABELS[id]+(invalidTimes.has(id)?' (invalid)':' (not read)')).join(', ')+(timelineError?' — '+timelineError:'');}
  async function writeTimePair(pair,stamp,shortcut){
    const {date,time}=pair;
    if(!date.isConnected||!time.isConnected||date.disabled||time.disabled||date.readOnly||time.readOnly)throw Error('Timestamp is not writable.');
    const expected=new Date(stamp),p=n=>String(n).padStart(2,'0');
    const values=[`${p(expected.getMonth()+1)}/${p(expected.getDate())}/${expected.getFullYear()}`,`${p(expected.getHours())}:${p(expected.getMinutes())}:${p(expected.getSeconds())}`];
    if(!Number.isFinite(expected.getTime()))throw Error('Invalid planned timestamp.');
    if(parseWallTime(date.value,time.value)===expected.getTime())return;
    date.focus();date.click();await new Promise(r=>setTimeout(r,100));
    const picker=document.getElementById('date-picker');
    if(shortcut&&visible(picker)){
      const button=[...picker.querySelectorAll('.time-button')].find(n=>n.querySelector('.time-button-label')?.textContent.trim()===shortcut.label);
      if(!button||button.classList.contains('disabled'))throw Error('Native '+shortcut.label+' shortcut unavailable.');
      button.click();await new Promise(r=>setTimeout(r,100));
      if(shortcut.minutes){
        const minute=picker.querySelector('.minute .minus-button');
        if(!minute)throw Error('Native minute adjustment unavailable.');
        for(let i=0;i<shortcut.minutes;i++)minute.click();
      }
    }else{
      for(const [i,input] of [date,time].entries()){
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[i]);
        for(const type of ['input','change','blur'])input.dispatchEvent(new Event(type,{bubbles:true}));
      }
    }
    await new Promise(r=>setTimeout(r,150));
    if(parseWallTime(date.value,time.value)!==expected.getTime())throw Error('Native timestamp read-back differs from '+values.join(' ')+'. Inspect the open entry.');
    if(visible(picker))picker.querySelector('.header .close')?.click();
  }
  async function writeReviewedTime(fresh){
    const beforeFly=[...document.querySelectorAll('.grid-flyout-active')].find(visible);
    const field=await openIssue(fresh.c,true);
    if(!field)throw Error('Timestamp field could not be opened.');
    if(location.href!==fresh.url||currentRoot()!==fresh.root)throw Error('Chart changed before timestamp write.');
    const date=[...field.querySelectorAll('input')].find(n=>/Date$/.test(n.id));
    const pair=timePair(date);if(!pair)throw Error('Timestamp date/time controls unavailable.');
    const shortcut=fresh.c.entry?(procedureName(fresh.c.entry)==='Moving a patient to a stretcher'?null:{label:'Patient Arrival'}):{label:'Destination Arrival',minutes:5};
    await writeTimePair(pair,fresh.target,shortcut);
    const fly=field.closest('.grid-flyout-active');
    if(fly&&!beforeFly){const ok=fly.querySelector('button[data-bind*="okButtonClickHandler"]');if(!ok||ok.disabled||ok.classList.contains('disabled'))throw Error('Timestamp updated; entry OK unavailable.');ok.click();await new Promise(r=>setTimeout(r,150));if(visible(fly))throw Error('Timestamp entry did not close.');}
  }

  function delayChoices(){
    const interval=(a,b)=>times[a]==null||times[b]==null?null:(times[b]-times[a])/1000;
    return delays.flatMap(([id,label],i)=>{
      const seconds=i===0?interval('29331','29332'):i===1?interval('29335','29337'):i===3?interval('29338','29342'):0;
      if(seconds==null||seconds<0)return [{id,label,problem:'Missing or invalid timeline interval: '+missingTimes(i===0?['29331','29332']:i===1?['29335','29337']:['29338','29342'])}];
      if(i===0)return seconds>120?[{id,label,target:'Staff Delay'}]:[];
      if(i===1)return [{id,label,target:seconds<=1200?'None/No Delay':'Staff Delay'}];
      if(i===2)return [{id,label,target:'None/No Delay'}];
      return seconds>1200?[{id,label,target:'Documentation',targets:['Documentation','ED Overcrowding / Transfer of Care']}]:[];
    });
  }
  // Capture only model data. Parent links, computed functions and UI caches are not chart answers.
  function captureLocal(root,reason){
    const ko=window.ko,seen=new WeakSet();
    function copy(value,key=''){
      if(typeof value==='function'){if(!ko.isObservable?.(value))return undefined;value=ko.unwrap(value);}
      if(value==null||['string','number','boolean'].includes(typeof value))return value;
      if(value instanceof Date)return localStamp(value);
      if(typeof value!=='object'||seen.has(value))return undefined;
      seen.add(value);let out;
      if(Array.isArray(value))out=value.map(x=>copy(x));else {out={};for(const k of Object.keys(value)){if(/^_|parent|validation|computed/i.test(k))continue;const v=copy(value[k],k);if(v!==undefined)out[k]=v;}}
      seen.delete(value);return out;
    }
    const data=copy(ko.unwrap(root.Incident));if(!data||!Object.keys(data).length)throw Error('Local capture has no incident data; no writes allowed.');
    const payload=JSON.stringify({schema:1,version:'0.2.4.18',reason,url:location.href,capturedAt:new Date().toISOString(),incident:data});
    // One latest snapshot per tab, retained only for this browser session. No network export.
    const key='it-a15-before-run';sessionStorage.setItem(key,payload);
    if(sessionStorage.getItem(key)!==payload)throw Error('Local capture verification failed; no writes allowed.');
  }
  function clearDefinitions(){
    learnDefinitions();const app=window.imagetrend,defs=[...(app.formComposer.agencyPresetValues||[]).flatMap(x=>x.PresetValues||[]),...learnedDefinitions.values()];
    const extra=choices.filter(c=>ENTRY_PATHS[c.id]&&!defs.some(d=>d.BindingPathEntryID===c.id)).map(c=>({BindingPathEntryID:c.id,BindingPathFromOrigin:ENTRY_PATHS[c.id],ReportingStandardID:app.formComposer.reportingStandardID,IsMultiselect:ENTRY_PATHS[c.id].includes('[]'),IsInGrid:false}));
    return [...defs,...extra];
  }
  function assessmentCollectionKeys(patient){
    const grid=document.getElementById('8e916322-32f6-582f-8ad2-69a689c49b0c'),ko=window.ko,def=grid&&ko.contextFor(grid)?.$data;
    const path=ko.unwrap(def?.BindingPath)||ko.unwrap(def?.BindingPathFromOrigin);
    if(path?.startsWith(patientPrefix)&&!path.slice(patientPrefix.length).includes('.')){const key=path.slice(patientPrefix.length);sessionStorage.setItem('it-a15-assessment-path',path);return [key];}
    const known=sessionStorage.getItem('it-a15-assessment-path');
    return known?.startsWith(patientPrefix)&&!known.slice(patientPrefix.length).includes('.')&&patient[known.slice(patientPrefix.length)]?[known.slice(patientPrefix.length)]:[];
  }
  async function openIssue(c,internal=false){
    if(busy&&!internal)return;
    if(c.create)c={...c,id:'aa6d315f-ccbc-58c0-950e-2e0932ee67b6'};
    if(c.assessment)c={...c,id:'8e916322-32f6-582f-8ad2-69a689c49b0c'};
    const find=()=>[...document.querySelectorAll('[id]')].filter(n=>{if(n.id!==c.id||!visible(n))return false;if(!c.entry)return true;const ctx=window.ko.contextFor(n);return [ctx?.$data,...(ctx?.$parents||[])].includes(c.entry);});
    let fields=find();
    if(fields.length!==1){
      const path=ENTRY_PATHS[c.id]||'',section=path.includes('Vitals')?'Assessment':path.includes('Procedure')||c.create?'Treatment':/Delay/.test(path)?'Delays':path.includes('Disposition')||path.includes('Interfacility')||c.label==='Receiving Hospital Contacted'?'Transport/Refusal':c.assessment?'Assessment':'STAT Info';
      const panel=path.includes('Vitals')?'Vital Signs':section==='Treatment'?'Procedures & Medications':section==='Transport/Refusal'?'Transport Info':c.assessment?'Assessment/Exam':section;
      document.querySelector('.section[title="'+section+'"]')?.click();await new Promise(r=>setTimeout(r,150));document.querySelector('.panel[title="'+panel+'"]')?.click();await new Promise(r=>setTimeout(r,250));
      if(c.entry){const ko=window.ko,rows=[...document.querySelectorAll('[data-bind]')].filter(n=>visible(n)&&/grid\.(open|edit)/i.test(n.dataset.bind||'')&&[ko.contextFor(n)?.$data,...(ko.contextFor(n)?.$parents||[])].includes(c.entry));const leaves=rows.filter(n=>!rows.some(x=>x!==n&&n.contains(x)));if(leaves.length===1){leaves[0].click();await new Promise(r=>setTimeout(r,250));}}
      fields=find();
    }
    if(fields.length!==1){$('#status').textContent='Open '+(c.entryLabel||c.label)+' manually; the exact field could not be located.';return;}
    fields[0].scrollIntoView({block:'center'});fields[0].style.outline='3px solid #eac65c';fields[0].querySelector('input,button,select')?.focus();setTimeout(()=>fields[0].style.outline='',3500);return fields[0];
  }
  function showIssues(items){const box=$('#issues'),issueUrl=location.href;box.replaceChildren();const seen=new Set();for(const x of items.filter(x=>x.error)){const key=[x.c.entryLabel,x.c.label,x.error].join('|');if(seen.has(key))continue;seen.add(key);const row=document.createElement('div'),link=document.createElement('button');link.textContent=(x.c.entryLabel?x.c.entryLabel+' · ':'')+x.c.label+' — Open field';link.onclick=()=>{if(location.href!==issueUrl){$('#status').textContent='Chart changed; run a new review for this chart.';return;}return openIssue(x.c);};const why=document.createElement('small');why.textContent=x.error;row.append(link,why);box.append(row);}if(box.children.length)setTally(true);}

  const procedureWorkflow=(()=>{
  const FORM = '#form-composer';
  const norm = v => String(v ?? '').replace(/[\u200b\u00ad]/g, '').replace(/\s+/g, ' ').trim();
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const protectedNumericSuffixes = ['25341','30193','25345','25349','25347','25352','25355f','25355c','25358','25357'];
  const isProtectedNumericId = id => protectedNumericSuffixes.some(s => String(id || '').endsWith(s));

  function allById(id) {
    return [...document.querySelectorAll(`[id="${CSS.escape(id)}"]`)].filter(el => el.closest(FORM));
  }
  function oneVisibleById(id) {
    const m = allById(id).filter(visible);
    if (!m.length) return null;
    if (m.length !== 1) throw new Error(`${id}: duplicate visible fields.`);
    return m[0];
  }
  function containerOf(el) {
    return el?.closest('.single-row-control, .smart-list-control, .date-time, [id]') || el;
  }

  function currentSmart(c) {
    const vals = [...c.querySelectorAll('button.smart-list-item')]
      .filter(b => b.classList.contains('selected') || b.getAttribute('aria-pressed') === 'true')
      .map(b => norm(b.querySelector('.smart-list-button-label')?.textContent || b.textContent))
      .filter(Boolean);
    const u = [...new Set(vals)];
    return u.length === 0 ? '' : u.length === 1 ? u[0] : u;
  }
  function currentSingle(c) {
    const v = norm(c.querySelector('.koSingleselect-selectedItem-value')?.textContent);
    return v === 'Not Recorded' ? '' : v;
  }
  function currentMulti(c) {
    // ImageTrend's actual selected-value element is .koMultiselect-selectedItem-value.
    // Prefer that exact leaf node so parent/child matches do not duplicate one selected item.
    let nodes = [...c.querySelectorAll('.koMultiselect-selectedItem-value')].filter(visible);
    if (!nodes.length) {
      nodes = [...c.querySelectorAll('.koMultiselect-selectedItem, .koMultiselect-selected-item')].filter(visible);
    }
    const vals = nodes.map(n => norm(n.textContent)).filter(Boolean);
    const special = [...c.querySelectorAll('.mod-value-watermark,.overlay-label')].filter(visible).map(n=>norm(n.textContent)).filter(v=>v==='Not Applicable'||v==='Not Recorded');
    if (!vals.length && special.length) return [...new Set(special)];
    return [...new Set(vals)];
  }
  function readField(el) {
    if (!el) return '';
    const c = containerOf(el);
    if (c.querySelector('button.smart-list-item')) return currentSmart(c);
    if (c.querySelector('.koSingleselect-selectedItem-value')) return currentSingle(c);
    if (c.querySelector('.koMultiselect-selectedItem-value, .koMultiselect-searchbar-input, komultiselect, .koMultiselect')) return currentMulti(c);
    if ('value' in el) return norm(el.value);
    const input = c.querySelector('input, textarea, select');
    return input && 'value' in input ? norm(input.value) : '';
  }
  const blank = v => Array.isArray(v) ? v.length === 0 : norm(v) === '';
  const same = (a,b) => Array.isArray(a) ? a.length === 1 && norm(a[0]) === norm(b) : norm(a) === norm(b);

  // Snapshot comparison is distinct from matching one requested choice.
  function unchanged(a, b) {
    if (Array.isArray(a) || Array.isArray(b)) {
      return Array.isArray(a) && Array.isArray(b) &&
        a.length === b.length && a.every((v, i) => norm(v) === norm(b[i]));
    }
    return norm(a) === norm(b);
  }

  function optionNodes(c, targetText) {
    const target = norm(targetText);
    const nodes = [...c.querySelectorAll([
      'button.smart-list-item',
      '.koSingleselect-dropDownItem',
      '.koMultiselect-dropDownItem',
      '.koMultiselect-dropdown-item',
      '[class*="koMultiselect"][class*="dropDownItem"]',
      '[data-bind*="getOptionDisplay"]',
      '.not-value-label'
    ].join(','))].filter(n => norm(n.textContent) === target);
    return [...new Set(nodes)];
  }
  function clickable(node, c) {
    // Stay inside this field. Never guess an arbitrary div/li or invoke KO directly.
    for (let n = node; n && n !== c && c.contains(n); n = n.parentElement) {
      if (n.matches('button,[role="option"],.koSingleselect-dropDownItem,.koMultiselect-dropDownItem,.koMultiselect-dropdown-item') ||
          /(?:^|,)\s*click\s*:/.test(n.getAttribute('data-bind') || '')) return n;
    }
    return null;
  }
  function disabledChoice(node, c) {
    for (let n = node; n && c.contains(n); n = n.parentElement) {
      if (n.classList.contains('disabled') || n.disabled || n.matches(':disabled') || n.getAttribute('aria-disabled') === 'true' ||
          n.getAttribute('aria-readonly') === 'true') return true;
      if (n === c) break;
    }
    return false;
  }
  async function expose(c) {
    const s = c.querySelector('button.koSingleselect-down-button,.koSingleselect-selectedItem[data-bind*="toggleDropDown"],.koSingleselect-placeholder[data-bind*="toggleDropDown"]');
    if (s && !s.disabled) { s.click(); await sleep(120); return; }
    const ms = c.querySelector('.koMultiselect-searchbar-input');
    if (ms && !ms.disabled) { ms.focus(); ms.click(); await sleep(120); return; }
    const mt = c.querySelector('button.koMultiselect-down-button,button[class*="koMultiselect"][class*="down"]');
    if (mt && !mt.disabled) { mt.click(); await sleep(120); }
  }
  async function setChoice(el, target, before) {
    const c = containerOf(el);
    if (!unchanged(readField(el), before)) throw new Error('Field changed since review.');
    if (target === 'Not Applicable') { await setSpecialChoice(el,target,before); return; }
    let nodes = optionNodes(c, target);
    if (!nodes.some(visible)) {
      await expose(c);
      const deadline=Date.now()+1800;
      do { nodes=optionNodes(c,target); if(nodes.some(visible))break; await sleep(100); } while(Date.now()<deadline&&el.isConnected);
    }
    const usable = [...new Set(nodes.filter(visible).map(n => clickable(n, c)).filter(Boolean).filter(visible))];
    if (usable.length !== 1) throw new Error(`Choice "${target}" missing or ambiguous.`);
    const node = usable[0];
    if (norm(node.textContent) !== norm(target)) throw new Error('Option click target contains unrelated content.');
    if (disabledChoice(node, c)) throw new Error(`Choice "${target}" is disabled.`);
    if (!el.isConnected || !visible(el) || !unchanged(readField(el), before))
      throw new Error('Field changed since review.');
    const chartUrl = location.href;
    node.click();
    const end = Date.now() + 3500;
    while (Date.now() < end) {
      if (location.href !== chartUrl || !el.isConnected || !visible(el))
        throw new Error('Chart/view changed during selection.');
      if (same(readField(el), target)) return;
      await sleep(100);
    }
    throw new Error(`ImageTrend did not confirm "${target}".`);
  }
  function nativeSetInput(el, value) {
    if (!el || !('value' in el)) throw new Error('Writable input not found.');
    if (el.disabled || el.readOnly) throw new Error('Input disabled/read-only.');
    if (isProtectedNumericId(el.id)) throw new Error('Protected clinical numeric field blocked.');
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto,'value')?.set;
    if (!setter) throw new Error('Native input setter unavailable.');
    setter.call(el,String(value));
    for (const type of ['input','change','blur']) el.dispatchEvent(new Event(type,{bubbles:true}));
  }


    const RULES=choices,recordChange=()=>{};
    const format=name=>{const date=new Date(procedureTiming(name).value);return {date:[String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0'),date.getFullYear()].join('/'),time:[date.getHours(),date.getMinutes(),date.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':')};};
    const stretcherTime=()=>format('Moving a patient to a stretcher'),patientArrivalTime=()=>format('Assessment -ALS');
    function scopedField(scope,id){const nodes=[...scope.querySelectorAll('[id="'+id+'"]')].filter(visible);if(nodes.length!==1)throw Error('Procedure field unavailable: '+id);return nodes[0];}
  function procedureTimeInputs(f) {
    const one = suffix => {
      const nodes = [...f.querySelectorAll('input[id$="' + suffix + '"]')].filter(visible);
      if (nodes.length !== 1 || nodes[0].disabled || nodes[0].readOnly) throw new Error('Writable procedure time fields unavailable.');
      return nodes[0];
    };
    return {date: one('25443Date'), time: one('25443Time')};
  }
  async function applyBundleDetails(f, name, timing) {
    const roles = [...f.querySelectorAll('[id="d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7"]')].filter(visible);
    if (roles.length !== 1) throw new Error('Procedure role missing or ambiguous.');
    const role = roles[0], before = readField(role);
    if (!same(before, 'Paramedic')) {
      if (!blank(before) && !same(before, 'Critical Care Paramedic')) throw new Error('Unexpected procedure role; existing value preserved.');
      await setChoice(role, 'Paramedic', before);
    }
    {
      const currentTiming = name === 'Moving a patient to a stretcher' ? stretcherTime() : patientArrivalTime();
      const plannedTime = name === 'Moving a patient to a stretcher' ? timing.stretcher : timing.arrival;
      if (JSON.stringify(currentTiming) !== JSON.stringify(plannedTime)) throw new Error('Timeline changed during bundle.');
      const inputs = procedureTimeInputs(f);
      await writeTimePair(inputs,procedureTiming(name).value,name==='Moving a patient to a stretcher'?null:{label:'Patient Arrival'});
      await sleep(150);
      if (norm(inputs.date.value) !== plannedTime.date || norm(inputs.time.value) !== plannedTime.time)
        throw new Error('ImageTrend did not confirm procedure time.');
    }
    for (const id of ['c07c1d8b-c7d4-5a5a-8ec1-01bf67f882e0','6a3cd763-c562-574c-b209-bbced74d73c1','adcc71b8-0b92-5387-8b9f-cb94b729e4ac']) {
      const rule=RULES.find(r=>r.id===id), el=scopedField(f,id), value=readField(el);
      if (blank(value)) await setChoice(el,rule.target,value);
      else if (!same(value,rule.target)) throw new Error(rule.label+': existing conflict preserved.');
    }
    if (!same(readField(role), 'Paramedic')) throw new Error('ImageTrend did not retain Paramedic.');
  }

  let PROCEDURE_NAMES=[];
  const PROCEDURE_ID = '02dffd5f-4c68-506b-881d-5b00c78090aa';
  function procedureFlyout() {
    const found = [...document.querySelectorAll('.grid-flyout-overlay.grid-flyout-active')]
      .filter(visible).filter(f => [...f.querySelectorAll('.grid-label')].some(n => norm(n.textContent) === 'Procedure'));
    if (found.length !== 1) throw new Error('Open one blank Procedure entry with ImageTrend Add first.');
    return found[0];
  }
  function procedureField(f) {
    const fields = [...f.querySelectorAll('[id]')].filter(n => n.id === PROCEDURE_ID && visible(n));
    if (fields.length !== 1) throw new Error('Procedure selector missing or ambiguous.');
    return fields[0];
  }
  function procedureKey(f) {
    const dates = [...f.querySelectorAll('input[id$="25443Date"]')].filter(visible);
    if (dates.length !== 1) throw new Error('Procedure entry identity missing or ambiguous.');
    return dates[0].id;
  }
  function procedureButton(f, handler, label) {
    const buttons = [...f.querySelectorAll('button.grid-button')].filter(visible)
      .filter(b => norm(b.textContent) === label && (b.getAttribute('data-bind') || '').includes('grid.' + handler + '($context)'));
    if (buttons.length !== 1 || disabledChoice(buttons[0], f)) throw new Error(label + ' unavailable or disabled.');
    return buttons[0];
  }

  async function openProcedureEntry() {
    const active = [...document.querySelectorAll('.grid-flyout-overlay.grid-flyout-active')].filter(visible);
    if (active.length) return procedureFlyout();
    const grids = [...document.querySelectorAll('[id="aa6d315f-ccbc-58c0-950e-2e0932ee67b6"]')].filter(visible);
    if (grids.length !== 1) throw new Error('Open Treatment → Procedures & Medications first.');
    const grid = grids[0];
    if (norm(grid.querySelector('.grid-label')?.textContent) !== 'Procedures') throw new Error('Procedures grid identity did not match.');
    // creationPlan checks the native collection. An empty grid may have no rendered rows.
    if ([...grid.querySelectorAll('button.grid-filter')].some(b => !b.classList.contains('grid-button-highlighted')))
      throw new Error('Show all procedure filters before adding.');
    const buttons = [...grid.querySelectorAll('.grid-actions button.grid-button')].filter(visible)
      .filter(b => norm(b.textContent) === 'Add' && (b.getAttribute('data-bind') || '').includes('grid.openSubformSelectionModal($context)'));
    if (buttons.length !== 1 || disabledChoice(buttons[0], grid)) throw new Error('Procedure Add unavailable or disabled.');
    const url = location.href;
    buttons[0].click();
    const end = Date.now() + 5000;
    while (Date.now() < end) {
      if (location.href !== url) throw new Error('Chart changed while opening procedure.');
      try { return procedureFlyout(); } catch (_) { /* wait for native flyout */ }
      await sleep(100);
    }
    throw new Error('Procedure entry did not open. Review any ImageTrend dialog before continuing.');
  }

  async function addProcedureBundle(names,onProgress) {
    PROCEDURE_NAMES=names;
    const url = location.href;
    if (!/\/Incident\d+\/Form\d+(?:$|[/?])/.test(location.hash)) throw new Error('Open an incident chart.');
    const storageKey = 'it-a15-create:' + url + ':' + names.join('|');
    // creationPlan has rechecked existing identities; an active populated flyout still blocks replay.
    if(stopRequested)throw Error('Stopped before procedure creation.');
    const timing = {stretcher:stretcherTime(),arrival:patientArrivalTime()};
    let f = await openProcedureEntry();
    if (!blank(readField(procedureField(f)))) throw new Error('The open procedure is populated. Open a blank entry first.');
    procedureKey(f);
    procedureButton(f, 'addAnotherButtonClickHandler', 'Add Another');
    procedureButton(f, 'okButtonClickHandler', 'OK');
    // Persist before the first mutation: failed/partial runs must not be blindly repeated.
    sessionStorage.setItem(storageKey, 'started');
    for (let i = 0; i < PROCEDURE_NAMES.length; i++) {
      if (location.href !== url) throw new Error('Chart changed during bundle.');
      f = procedureFlyout();
      const field = procedureField(f), key = procedureKey(f);
      if (!blank(readField(field))) throw new Error('Expected a new blank procedure. Stopped to preserve it.');
      // The captured single-select can filter its resource list through searchTerm.
      await expose(field);
      if (!optionNodes(field, PROCEDURE_NAMES[i]).some(visible)) {
        const searches = [...field.querySelectorAll('input.koSingleselect-searchbar-input')].filter(visible);
        if (searches.length === 1) {
          nativeSetInput(searches[0], PROCEDURE_NAMES[i]);
          const searchDeadline = Date.now() + 2000;
          while (Date.now() < searchDeadline && !optionNodes(field, PROCEDURE_NAMES[i]).some(visible)) await sleep(100);
        }
      }
      if (location.href !== url || procedureFlyout() !== f || procedureKey(f) !== key || !blank(readField(field)))
        throw new Error('Procedure changed while finding option.');
      await setChoice(field, PROCEDURE_NAMES[i], readField(field));
      recordChange({el:field,before:'',rule:{id:field.id,label:PROCEDURE_NAMES[i],target:PROCEDURE_NAMES[i]}});
      if (location.href !== url || procedureFlyout() !== f || procedureKey(f) !== key ||
          !same(readField(field), PROCEDURE_NAMES[i])) throw new Error('Procedure changed before confirmation.');
      await applyBundleDetails(f, PROCEDURE_NAMES[i], timing);
      if (location.href !== url || procedureFlyout() !== f || procedureKey(f) !== key || !same(readField(field), PROCEDURE_NAMES[i])) throw new Error('Procedure changed before acceptance.');
      const last = i === PROCEDURE_NAMES.length - 1;
      procedureButton(f, last ? 'okButtonClickHandler' : 'addAnotherButtonClickHandler', last ? 'OK' : 'Add Another').click();
      const deadline = Date.now() + 5000;
      let advanced = false;
      while (Date.now() < deadline) {
        if (location.href !== url) throw new Error('Chart changed during bundle.');
        if (last) {
          if (![...document.querySelectorAll('.grid-flyout-overlay.grid-flyout-active')].some(visible)) { advanced = true; break; }
        } else {
          try {
            const next = procedureFlyout();
            if (procedureKey(next) !== key && blank(readField(procedureField(next)))) { advanced = true; break; }
          } catch (_) { /* transient flyout replacement */ }
        }
        await sleep(100);
      }
      if (!advanced) throw new Error('ImageTrend did not advance after ' + PROCEDURE_NAMES[i] + '. Inspect the open entry; do not rerun blindly.');
      onProgress(PROCEDURE_NAMES[i]);
      if(stopRequested)throw Error('Stopped after current procedure. Review the open entry before continuing.');
    }
    sessionStorage.setItem(storageKey, 'completed');
  }


    return addProcedureBundle;
  })();
  function currentRoot(){
    const ko=window.ko,form=document.querySelector('#form-composer');if(!ko||!form)throw Error('Chart unavailable.');
    const contexts=[form,...form.querySelectorAll('[data-bind]')].map(x=>ko.contextFor(x)).filter(Boolean);
    const owners=[...new Set(contexts.flatMap(x=>[x.$root,x.$data,...(x.$parents||[])]))].filter(Boolean);
    const roots=owners.filter(r=>{try{return !!resolve(r,'Incident.Scene.Response.Patient',ko);}catch(_){return false;}});
    if(roots.length!==1)throw Error('Chart identity ambiguous.');
    const states=owners.filter(x=>'currentIncidentReadOnlyStatus' in Object(x)).map(x=>ko.unwrap(x.currentIncidentReadOnlyStatus));
    if(!states.length||states.some(x=>x!==false)||form.closest('.locked')||document.querySelector('#center-pane.locked,#left-pane.locked'))throw Error('Chart is not confirmed editable.');
    return roots[0];
  }
  function creationPlan(){
    const root=currentRoot(),entries=window.ko.unwrap(resolve(root,'Incident.Scene.Response.Patient.PatientProcedures',window.ko));
    if(!Array.isArray(entries))throw Error('Procedure collection unavailable.');
    const classified=entries.map(entry=>({entry,name:procedureName(entry,{quiet:true})}));
    const names=classified.map(x=>x.name).filter(Boolean);
    const missing=procedureNames.filter(n=>!names.includes(n));
    if(!missing.length)return null;
    // Preserve unrelated/unrecognized procedures without blocking creation of the known A15 bundle.
    // creationPlan only adds names from procedureNames and never edits unknown entries.
    const timing=missing.map(n=>procedureTiming(n).value);
    return {c:{create:true,label:'Create missing A15 procedures',target:missing.join('; ')},root,entries:[...entries],missing,timing,url:location.href,current:'',target:missing.join('; '),canApply:true};
  }
  async function createReviewed(plan){
    const fresh=creationPlan();
    if(!fresh||fresh.url!==plan.url||fresh.root!==plan.root||JSON.stringify(fresh.missing)!==JSON.stringify(plan.missing)||JSON.stringify(fresh.timing)!==JSON.stringify(plan.timing)||fresh.entries.length!==plan.entries.length||fresh.entries.some((x,i)=>x!==plan.entries[i]))throw Error('Procedures or timeline changed since review.');
    if([...document.querySelectorAll('.grid-flyout-active')].some(visible))throw Error('Close the open entry before creating procedures.');
    const clickPanel=async()=>{
      let target=document.querySelector('.panel[title="Procedures & Medications"]');
      if(!target||!visible(target)){const parent=document.querySelector('.section[title="Treatment"]');if(!parent)throw Error('Treatment navigation unavailable.');parent.click();await new Promise(r=>setTimeout(r,180));target=document.querySelector('.panel[title="Procedures & Medications"]');}
      if(!target)throw Error('Procedure panel unavailable.');target.click();
      for(let i=0;i<30;i++){if(location.href!==plan.url)throw Error('Chart changed.');if([...document.querySelectorAll('[id="aa6d315f-ccbc-58c0-950e-2e0932ee67b6"]')].some(visible))return;await new Promise(r=>setTimeout(r,100));}throw Error('Procedure panel did not open.');
    };
    await clickPanel();if(currentRoot()!==plan.root)throw Error('Chart changed.');
    let previous=null,stable=0;
    for(let attempt=0;attempt<20&&stable<2;attempt++){
      const entries=window.ko.unwrap(resolve(plan.root,'Incident.Scene.Response.Patient.PatientProcedures',window.ko));
      if(!Array.isArray(entries))throw Error('Procedure collection unavailable.');
      entries.forEach(procedureName);
      stable=previous&&entries.length===previous.length&&entries.every((entry,i)=>entry===previous[i])?stable+1:0;
      previous=[...entries];await new Promise(r=>setTimeout(r,150));
    }
    if(stable<2)throw Error('Procedure inventory did not settle.');
    // Navigation may hydrate entries that were absent during the first scan.
    // Recompute before every Add; never replay the original missing bundle.
    for(const name of plan.missing){
      if(location.href!==plan.url||currentRoot()!==plan.root)throw Error('Chart changed.');
      const current=creationPlan();
      if(!current||!current.missing.includes(name))continue;
      if(procedureTiming(name).value!==plan.timing[plan.missing.indexOf(name)])throw Error('Timeline changed.');
      await procedureWorkflow([name],n=>{$('#result').textContent='Created: '+n;});
      const entries=window.ko.unwrap(resolve(plan.root,'Incident.Scene.Response.Patient.PatientProcedures',window.ko));
      if(entries.filter(x=>procedureName(x)===name).length!==1)throw Error('Created procedure count not verified: '+name);
    }
    const after=window.ko.unwrap(resolve(plan.root,'Incident.Scene.Response.Patient.PatientProcedures',window.ko));
    for(const name of plan.missing)if(after.filter(x=>procedureName(x)===name).length!==1)throw Error('Created procedure count not verified: '+name);
  }

  function assessmentPlan(){
    if(!document.querySelector('.section[title="Assessment"]'))return null;
    const timing=procedureTiming('Assessment -ALS');
    return {c:{assessment:true,label:'Assessment/Exam',target:'First: patient contact. Second, if present: destination. No findings entered.'},root:currentRoot(),url:location.href,target:timing.value,destination:times['29338'],current:'Add first entry only if absent; never add a second',canApply:true};
  }
  async function createAssessment(plan){
    const check=()=>{if(location.href!==plan.url||currentRoot()!==plan.root)throw Error('Chart changed. Assessment stopped.');};
    check();if(procedureTiming('Assessment -ALS').value!==plan.target)throw Error('Patient contact time changed. Preview again.');
    if([...document.querySelectorAll('.grid-flyout-active')].some(visible))throw Error('Close the open entry before adding Assessment/Exam.');
    const wait=async fn=>{for(let i=0;i<30;i++){check();const x=fn();if(x)return x;await new Promise(r=>setTimeout(r,100));}throw Error('Assessment control did not load.');};
    let panel=document.querySelector('.panel[title="Assessment/Exam"]');
    if(!panel||!visible(panel)){document.querySelector('.section[title="Assessment"]').click();panel=await wait(()=>{const x=document.querySelector('.panel[title="Assessment/Exam"]');return x&&visible(x)&&x;});}
    panel.click();const grid=await wait(()=>{const x=document.getElementById('8e916322-32f6-582f-8ad2-69a689c49b0c');return x&&visible(x)&&x;});
    const ko=window.ko,ctx=ko.contextFor(grid),path=ko.unwrap(ctx?.$data?.BindingPath)||ko.unwrap(ctx?.$data?.BindingPathFromOrigin);
    if(!path||!path.startsWith('Incident.Scene.Response.Patient.')||path.includes('[]'))throw Error('Assessment collection mapping unavailable.');
    const collection=()=>ko.unwrap(resolve(plan.root,path,ko));
    if(!Array.isArray(collection()))throw Error('Assessment collection unavailable.');
    if(collection().length){
      const entries=[...collection()];
      if(entries.length>2)throw Error('More than two assessments: review timestamps manually.');
      if(entries.length===2&&(times['29338']==null||times['29338']!==plan.destination||times['29338']<Date.parse(plan.target)))throw Error('Second assessment needs a valid, unchanged destination arrival time after patient contact.');
      const targets=[...grid.querySelectorAll('[data-bind]')].filter(x=>visible(x)&&/click\s*:/.test(x.dataset.bind||'')&&/grid\.(?:openGridItemAndCloseAllSiblings|openItem|editItem)\s*\(/i.test(x.dataset.bind||'')&&!/delete|remove|add/i.test(x.dataset.bind||''));
      const leaves=targets.filter(x=>!targets.some(y=>y!==x&&x.contains(y)));
      if(leaves.length!==entries.length)throw Error('Assessment row controls are not uniquely recognized.');
      leaves[0].click();const fly=await wait(()=>[...document.querySelectorAll('.grid-flyout-active')].find(visible));
      const input=fly.querySelector('input[id$="25415Date"]'),dateCtx=input&&ko.contextFor(input),def=dateCtx?.$data;
      const binding=ko.unwrap(def?.BindingPath)||ko.unwrap(def?.BindingPathFromOrigin),id=ko.unwrap(def?.BindingPathEntryID);
      if(!binding?.startsWith(path+'[].')||!id)throw Error('Assessment timestamp mapping unavailable. Close the open entry.');
      const cancel=fly.querySelector('button[data-bind*="cancelButtonClickHandler"]');if(!cancel)throw Error('Assessment Cancel unavailable.');cancel.click();await wait(()=>!fly.isConnected||!visible(fly));
      const relative=binding.slice((path+'[].').length);
      const ordered=entries.map((entry,index)=>({entry,index,time:Date.parse(ko.unwrap(resolve(entry,relative,ko)))}));
      if(entries.length===2){if(ordered.some(x=>!Number.isFinite(x.time))||ordered[0].time===ordered[1].time)throw Error('Assessment chronology ambiguous; open each assessment and confirm its time.');ordered.sort((a,b)=>a.time-b.time);}
      const expected=[plan.target,localStamp(times['29338']??0)];
      for(let i=0;i<entries.length;i++){
        check();if(collection().length!==entries.length||collection().some((x,j)=>x!==entries[j]))throw Error('Assessment entries changed.');
        const rowTargets=[...grid.querySelectorAll('[data-bind]')].filter(x=>visible(x)&&/click\s*:/.test(x.dataset.bind||'')&&/grid\.(?:openGridItemAndCloseAllSiblings|openItem|editItem)\s*\(/i.test(x.dataset.bind||'')&&!/delete|remove|add/i.test(x.dataset.bind||''));
        const rows=rowTargets.filter(x=>!rowTargets.some(y=>y!==x&&x.contains(y)));
        if(rows.length!==entries.length)throw Error('Assessment rows changed.');
        rows[ordered[i].index].click();const active=await wait(()=>[...document.querySelectorAll('.grid-flyout-active')].find(visible));
        const pair=timePair(active.querySelector('input[id$="25415Date"]'));if(!pair)throw Error('Assessment time controls unavailable.');
        await writeTimePair(pair,expected[i],{label:i?'Destination Arrival':'Patient Arrival'});
        const ok=active.querySelector('button[data-bind*="okButtonClickHandler"]');if(!ok||ok.disabled||ok.classList.contains('disabled'))throw Error('Assessment OK unavailable.');
        ok.click();await wait(()=>!visible(active));
      }
      return 'Assessment timestamps verified: first at patient contact'+(entries.length===2?', second at destination':'')+'. Findings preserved.';
    }
    const add=grid.querySelector('.grid-actions button');
    if(!add||add.disabled||add.classList.contains('disabled'))throw Error('Assessment Add is unavailable.');
    add.click();const fly=await wait(()=>[...document.querySelectorAll('.grid-flyout-active')].find(visible));
    const date=fly.querySelector('input[id$="25415Date"]'),time=fly.querySelector('input[id$="25415Time"]');
    if(!date||!time||date.disabled||time.disabled)throw Error('Assessment date/time fields unavailable; inspect the open entry.');
    const dt=new Date(plan.target),pad=x=>String(x).padStart(2,'0');
    const values=[`${pad(dt.getMonth()+1)}/${pad(dt.getDate())}/${dt.getFullYear()}`,`${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`];
    await writeTimePair({date,time},plan.target,{label:'Patient Arrival'});
    const dateDef=ko.contextFor(date)?.$data,newBinding=ko.unwrap(dateDef?.BindingPath)||ko.unwrap(dateDef?.BindingPathFromOrigin);
    if(!newBinding?.startsWith(path+'[].'))throw Error('Assessment timestamp mapping unavailable before acceptance.');
    check();const ok=fly.querySelector('button[data-bind*="okButtonClickHandler"]');
    if(!ok||ok.disabled||ok.classList.contains('disabled'))throw Error('Assessment OK unavailable.');
    ok.click();await wait(()=>!visible(fly)||!fly.isConnected);
    if(collection().length!==1)throw Error('Assessment entry count not verified. Inspect before retrying.');
    if(!ko.unwrap(resolve(plan.root,newBinding.replace('[]','.0'),ko)))throw Error('Assessment timestamp missing after close.');
    return 'Assessment/Exam created at patient contact; no findings were entered.';
  }
  $('#launch').onclick=()=>{$('section').hidden=false;$('#launch').hidden=true;};
  $('#hide').onclick=()=>setTally(!$('#tally').open);
  $('#preview').onclick=async()=>{
    if(busy)return;busy=true;$('#apply').disabled=true;$('#preview').disabled=true;reportProgress('Reading timeline…');await readTimes();
    reset();try{
      const selected=[...choices,...delayChoices(),{id:'9753adcb-f760-554b-94d6-60a5e82badd8',label:'Receiving Hospital Contacted',time:true,target:times['29338']==null?'':localStamp(times['29338']-300000)}];
      reviewed=selected.flatMap(expandChoice).map(c=>{try{return inspect(c);}catch(e){return {c,canApply:false,error:e.message};}});
      try{const creation=creationPlan();if(creation)reviewed.push(creation);}catch(e){reviewed.push({c:{create:true,label:'Create missing procedures',target:'A15'},error:e.message,canApply:false});}
      try{const assessment=assessmentPlan();if(assessment)reviewed.push(assessment);}catch(e){reviewed.push({c:{assessment:true,label:'Assessment/Exam',target:'Patient contact timestamp'},error:e.message,canApply:false});}
      $('#result').textContent=reviewed.map(x=>x.error?(x.c.entryLabel?x.c.entryLabel+' · ':'')+x.c.label+' → '+x.c.target+'\n'+x.error:(x.c.entryLabel?x.c.entryLabel+' · ':'')+x.c.label+'\nCurrent: '+(x.current||'(blank)')+' → '+x.target+(x.c.source?' ('+x.c.source+')':'')+'\n'+(x.canApply?(x.current?'Ready — replace with reviewed A15 value':'Ready'):x.current===x.target?'Already correct':'Existing answer preserved')).join('\n\n');
    setTally(reviewed.some(x=>x.error));
    }catch(e){reset();$('#result').textContent=e.message;setTally(true);}finally{busy=false;$('#preview').disabled=false;$('#apply').disabled=false;}
  };
  $('#apply').onclick=async()=>{
    if(busy)return;
    stopRequested=false;let root,url;
    try{root=currentRoot();url=location.href;captureLocal(root,'apply');}
    catch(e){$('#result').textContent=e.message;setTally(true);return;}
    await $('#preview').onclick();
    if(!reviewed)return;
    busy=true;$('#apply').disabled=true;$('#preview').disabled=true;$('#stop').disabled=false;
    const results=[],issues=[],completed=new Set();let queue=[...reviewed],skipped=0,applied=0,runError="";
    const key=c=>c.id+'|'+(c.entryLabel||c.label);
    try{
      for(let pass=0;pass<3&&queue.length&&!stopRequested;pass++){
        const retry=[];let progress=0,checked=0;reportProgress(pass?'Recovery pass '+pass:'Applying A15',0,queue.length);
        for(const old of queue){
          if(stopRequested)break;
          if(location.href!==url||currentRoot()!==root)throw Error('Chart changed. Run stopped.');
          let fresh,wrote=false;reportProgress(old.c.entryLabel||old.c.label,checked++,queue.length);
          await new Promise(r=>setTimeout(r,0));
          try{
            if(old.c.create||old.c.assessment){
              if(old.error){issues.push(old);continue;}
              if(old.c.create){await createReviewed(old);results.push('Created missing A15 procedures');}
              else results.push(await createAssessment(old));
              progress++;applied++;continue;
            }
            fresh=inspect(old.c);
            if(!fresh.canApply){skipped++;continue;}
            if(old.snapshot&&fresh.snapshot!==old.snapshot)throw Error('Answer changed during run; preserved for review.');
            if(completed.has(key(fresh.c)))continue;
            wrote=true;
            if(fresh.c.time){await writeReviewedTime(fresh);completed.add(key(fresh.c));results.push('Verified native timestamp: '+fresh.c.label);progress++;applied++;continue;}
            fresh.vm.applyPresetValue();
            if(fresh.c.id==='16ccfb92-ef4d-5527-a0ee-39639fd222f4'){
              const path=patientPrefix+'Disposition.HospitalTeamActivations',list=window.ko.unwrap(resolve(root,path,window.ko));
              if(list.length!==1)throw Error('Activation count not verified.');
              const mod=window.ko.unwrap(list[0].HospitalTeamActivationActivationDateModValue);
              if(mod&&window.ko.unwrap(mod.ActivationDate)){
                new window.imagetrend.runForm.PresetValueViewModel({BindingPathEntryID:'7b1b48e5-c4af-586a-badb-aae56d9bf4bc',BindingPathFromOrigin:path+'.0.HospitalTeamActivationActivationDateModValue.ActivationDate',ReportingStandardID:window.imagetrend.formComposer.reportingStandardID,IsMultiselect:false,IsInGrid:false,Value:null},root).applyPresetValue();
                if(window.ko.unwrap(mod.ActivationDate))throw Error('Activation date did not remain blank.');
              }
            }
            let verified=false;
            for(let i=0;i<30;i++){
              if(location.href!==url||currentRoot()!==root)throw Error('Chart changed after write.');
              const after=inspect(fresh.c);if(after.current===fresh.target){verified=true;break;}
              await new Promise(r=>setTimeout(r,100));
            }
            if(!verified)throw Error('Write was attempted but read-back failed; inspect before retrying.');
            completed.add(key(fresh.c));results.push('Verified: '+(fresh.c.entryLabel||'')+' '+fresh.c.label);progress++;applied++;
          }catch(e){
            const item={...old,error:e.message};
            // Only missing mappings/options may heal. Never replay an attempted write or creation.
            if(!wrote&&!old.c.create&&!old.c.assessment&&/unavailable|missing|no loaded|not translate/i.test(e.message)&&!/ambiguous|read-only|locked|changed|timeline/i.test(e.message))retry.push(item);else issues.push(item);
          }
          $('#status').textContent=applied+' applied · '+(issues.length+retry.length)+' need attention'+(pass?' · healing pass '+(pass+1):'');
        }
        if(!retry.length)break;
        if(!progress||pass===2){issues.push(...retry);break;}
        results.push('Recovery: '+retry.length+' pending fields will be checked again after prerequisite changes.');
        queue=retry;await new Promise(r=>setTimeout(r,200));
      }
      $('#result').textContent=results.join('\n')+(stopRequested?'\nStopped after current step; unprocessed work remains.':'')+'\n'+groupedIssues(issues);
      $('#status').textContent=applied+' applied · '+skipped+' kept · '+issues.length+' need attention'+(stopRequested?' · stopped':'');
      showIssues(issues);setTally(issues.length>0||stopRequested);
    }catch(e){runError=e.message;$('#result').textContent=results.join('\n')+'\nStopped: '+e.message;setTally(true);}
    finally{if(runError||stopRequested)reportProgress(runError?'Stopped: '+runError:'Stopped',undefined,undefined,runError?'error':'stopped');else reportProgress(issues.length?'Finished - review issues':'Finished',1,1,issues.length?'attention':'done');busy=false;reset();$('#preview').disabled=false;$('#stop').disabled=true;}
  };

  const capture=document.createElement('button');capture.textContent='Copy field mappings';capture.id='capture';
  const captureStatus=document.createElement('small');captureStatus.id='capture-status';
  $('section').insertBefore(capture,$('#profile'));capture.after(captureStatus);
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

  const clearButton=document.createElement('button');clearButton.id='clear-entries';clearButton.textContent='Clear chart entries…';clearButton.style.cssText='background:#b91c1c;color:white;border:0;border-radius:5px';
  $('section').append(clearButton);
  const effects=document.createElement('style');effects.textContent=`
    .nuke-cover{position:fixed;inset:0;background:#101022c9;display:grid;place-items:center;z-index:10}.nuke-dialog{background:white;padding:18px;border:3px solid #b91c1c;border-radius:14px;width:min(400px,80vw)}.nuke-art{height:210px;overflow:hidden}.nuke-art img{width:100%;display:block}.nuke-dialog button{margin-right:10px}#nuke-confirm{background:#b91c1c;color:white}.confetti{position:fixed;pointer-events:none;inset:0;overflow:hidden}.confetti i{position:absolute;bottom:0;width:9px;height:16px;background:var(--color);animation:cannon 1400ms ease-out forwards}@keyframes cannon{to{transform:translate(var(--dx),-85vh) rotate(720deg);opacity:0}}@media(prefers-reduced-motion:reduce){.confetti{display:none}}
  `;ui.append(effects);
  function nukeWarning(){return new Promise(done=>{
    const cover=document.createElement('div');cover.className='nuke-cover';
    cover.innerHTML='<div class="nuke-dialog" role="dialog" aria-modal="true" aria-labelledby="nuke-title"><div class="nuke-art"><img alt="Thumbs-up mascot watching a cartoon explosion" src="https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/assets/clear-warning.png"></div><h3 id="nuke-title">This will nuke your chart, you good with that?</h3><p>Only the entries and fields listed in the first warning will be cleared. The helper cannot undo this.</p><button id="nuke-cancel">Cancel</button><button id="nuke-confirm">Yes, clear the listed data</button></div>';
    let settled=false;
    const prior=ui.activeElement,finish=value=>{if(settled)return;settled=true;cover.remove();prior?.focus();done(value);};
    cover.querySelectorAll('button').forEach(b=>b.type='button');
    cover.querySelector('#nuke-cancel').onclick=e=>{e.preventDefault();e.stopPropagation();finish(false);};cover.querySelector('#nuke-confirm').onclick=e=>{e.preventDefault();e.stopPropagation();finish(true);};
    cover.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish(false);}if(e.key==='Tab'){e.preventDefault();const buttons=[...cover.querySelectorAll('button')];buttons[ui.activeElement===buttons[0]?1:0].focus();}};
    attachArtFallback(cover);ui.append(cover);cover.querySelector('#nuke-cancel').focus();
  });}
  function attachArtFallback(container){
    const img=container.querySelector('img');if(!img)return;
    const fallback=document.createElement('div');fallback.setAttribute('aria-label','Thumbs-up gremlin and a cartoon mushroom cloud');fallback.innerHTML='<svg viewBox="0 0 360 150" role="img" aria-label="Thumbs-up gremlin watching a cartoon explosion"><path fill="#ffc857" d="M235 140V85C150 85 170 20 215 35C205 0 280 0 275 35C330 15 350 85 275 85V140Z"/><path fill="#975bc0" d="M40 125L30 55L55 65Q80 30 105 65L135 55L115 125Z"/><circle cx="65" cy="80" r="7" fill="white"/><circle cx="98" cy="80" r="7" fill="white"/><path d="M62 106Q80 120 104 103" fill="none" stroke="white" stroke-width="5"/><text x="135" y="125" font-size="42">👍</text></svg>';
    img.after(fallback);const loaded=()=>{if(img.naturalWidth)fallback.remove();};img.onload=loaded;img.onerror=()=>img.remove();loaded();
  }
  function celebrateClear(){
    const art=document.createElement('div');art.className='nuke-cover';art.innerHTML='<div class="nuke-dialog"><img style="width:100%" src="https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/assets/clear-warning.png" alt="Gremlin gives a thumbs-up after clearing"><h3>Listed entries cleared.</h3><button>Back to chart</button></div>';ui.append(art);art.querySelector('button').onclick=()=>art.remove();
    attachArtFallback(art);const stage=document.createElement('div');stage.className='confetti';stage.setAttribute('aria-hidden','true');
    for(let i=0;i<48;i++){const bit=document.createElement('i');bit.style.cssText=`left:${i%2?95:5}vw;--dx:${(i%2?-1:1)*(50+Math.random()*650)}px;--color:${['#864ca3','#ffc857','#26b5b0','#e76f51'][i%4]};animation-delay:${Math.random()*180}ms`;stage.append(bit);}
    ui.append(stage);setTimeout(()=>stage.remove(),1800);
  }
  function mappedClearFields(root){
    const ko=window.ko,app=window.imagetrend,byPath=new Map();clearProblems=[];
    for(const d of clearDefinitions()){
      const path=d.BindingPathFromOrigin;
      if(d.ReportingStandardID!==app.formComposer.reportingStandardID||d.IsInGrid||typeof path!=='string'||!path.startsWith('Incident.Scene.Response.Patient.')||/Date|Time|Vitals|PatientProcedures|Medications|ProtocolUseds/.test(path))continue;
      // Only mapped profile fields and transport disposition; demographics are excluded.
      const choice=choices.find(x=>x.id===d.BindingPathEntryID);
      if(!choice&&!path.startsWith('Incident.Scene.Response.Patient.Disposition.'))continue;
      if((path.match(/\[\]/g)||[]).length>(d.IsMultiselect?1:0))continue;
      try{
        const endpoint=d.IsMultiselect?path.split('[]')[0]:path.slice(0,path.lastIndexOf('.'));
        const read=()=>{const value=ko.unwrap(resolve(root,endpoint,ko));return d.IsMultiselect?[...value]:[path.split('.').pop(),'NotValue','PertinentNegative','PlusOneCode'].map(k=>ko.unwrap(value[k])??null);};
        const contexts=[...document.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(c=>ko.unwrap(c?.$data?.BindingPathEntryID)===d.BindingPathEntryID);
        if(contexts.some(c=>app.FormComposer.isReadOnly(c)))throw Error('Target is read-only.');
        const duplicates=clearDefinitions().filter(x=>x.BindingPathFromOrigin===path);if(new Set(duplicates.map(x=>JSON.stringify([x.BindingPathEntryID,!!x.IsMultiselect]))).size>1)throw Error('Conflicting clear definitions.');
        const before=read();if(!before.some(x=>x!=null&&x!==''))continue;
        // Defer native construction as well as execution until both confirmations.
        const apply=()=>new app.runForm.PresetValueViewModel({...d,Value:null,IsNotValue:false,IsPertinentNegative:false},root).applyPresetValue();
        if(!byPath.has(path))byPath.set(path,{label:choice?.label||d.FieldName||'Transport field',read,before,apply});
      }catch(e){clearProblems.push((d.FieldName||path)+': '+e.message);}
    }
    return [...byPath.values()];
  }
  clearButton.onclick=async()=>{
    if(busy)return;
    busy=true;
    try{
      const ko=window.ko,app=window.imagetrend,form=document.querySelector('#form-composer');
      if(!ko||!form)throw Error('Chart unavailable.');
      const contexts=[form,...form.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(Boolean);
      const owners=[...new Set([app.currentVm,...contexts.flatMap(x=>[x.$root,x.$data,...(x.$parents||[])])])].filter(Boolean);
      const unlocked=()=>{const statuses=owners.filter(o=>'currentIncidentReadOnlyStatus' in Object(o)).map(o=>ko.unwrap(o.currentIncidentReadOnlyStatus));return statuses.length&&statuses.every(x=>x===false)&&!form.closest('.locked')&&!document.querySelector('#center-pane.locked,#left-pane.locked');};
      if(!unlocked())throw Error('Chart editability not verified.');
      const path='Incident.Scene.Response.Patient',roots=owners.filter(o=>{try{return !!resolve(o,path,ko);}catch(_){return false;}});
      if(roots.length!==1)throw Error('Patient context ambiguous.');
      const patient=ko.unwrap(resolve(roots[0],path,ko)),url=location.href;
      // Inventory is read-only: do not navigate or construct native preset writers here.
      learnDefinitions();
      const entries=['Vitals','PatientProcedures','ProtocolUseds','Medications',...assessmentCollectionKeys(patient)].map(key=>({key,value:patient[key],items:ko.unwrap(patient[key])}));
      const eligible=entries.filter(x=>Array.isArray(x.items)&&x.items.length);
      for(const entry of eligible){
        const targets=[...document.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(c=>{const d=c?.$data;return (ko.unwrap(d?.BindingPath)||ko.unwrap(d?.BindingPathFromOrigin))===path+'.'+entry.key;});
        if(targets.some(c=>app.FormComposer.isReadOnly(c)))throw Error('Collection is read-only: '+entry.key);
      }
      const fields=mappedClearFields(roots[0]);
      if(!assessmentCollectionKeys(patient).length)clearProblems.push('Assessment/Exam collection was not resolved; those entries are preserved.');
      if(!eligible.length&&!fields.length)throw Error('No mapped chart entries or fields to clear.');
      if(eligible.some(x=>typeof x.value?.removeAll!=='function'))throw Error('Native collection removal unavailable. No changes made.');
      const snapshot=eligible.map(x=>({...x,items:[...x.items]}));
      busy=true;
      if(!window.confirm('Clear these entries and mapped STAT/Transport fields?\n'+snapshot.map(x=>x.key+': '+x.items.length).concat(fields.map(x=>x.label)).join('\n')+'\nDispatch information and timeline timestamps are preserved. Unmapped fields remain untouched.'+(clearProblems.length?'\nNot cleared:\n'+clearProblems.join('\n'):'')))return;
      if(!await nukeWarning())return;
      if(location.href!==url||!form.isConnected||!unlocked()||currentRoot()!==roots[0])throw Error('Chart changed. Clear cancelled.');
      for(const x of snapshot){const current=ko.unwrap(patient[x.key]);if(patient[x.key]!==x.value||current.length!==x.items.length||current.some((v,i)=>v!==x.items[i]))throw Error('Entries changed. Clear cancelled.');}
      for(const x of fields){const now=x.read();if(now.length!==x.before.length||now.some((v,i)=>v!==x.before[i]))throw Error('Fields changed. Clear cancelled.');}
      captureLocal(roots[0],'clear');
      reset();busy=true;
      for(const x of snapshot){x.value.removeAll();if(ko.unwrap(x.value).length)throw Error('Removal not verified for '+x.key+'. Earlier removals may remain.');}
      for(const x of fields){if(location.href!==url||!unlocked())throw Error('Chart changed during clearing. Earlier removals may remain.');x.apply();if(x.read().some(v=>v!=null&&v!==''))throw Error('Clear not verified: '+x.label+'. Earlier removals may remain.');}
      $('#result').textContent='Cleared '+snapshot.map(x=>x.items.length+' '+x.key).join(', ')+' and '+fields.length+' mapped fields. Dispatch/timeline preserved; unmapped fields remain. Native persistence may occur.';
      Object.keys(sessionStorage).filter(k=>k.startsWith('it-a15-create:'+url+':')).forEach(k=>sessionStorage.removeItem(k));if(!clearProblems.length)celebrateClear();else $('#result').textContent+='\nNeeds attention:\n'+clearProblems.join('\n');setTally(!!clearProblems.length);
    }catch(e){$('#result').textContent='Clear stopped: '+e.message;setTally(true);}finally{busy=false;}
  };
  const rims=document.createElement('span');rims.className='rims';rims.setAttribute('aria-hidden','true');rims.textContent=' ⚙';$('h3').append(rims);
  effects.textContent+=' .rims{display:inline-block;color:#864ca3}:host([data-working]) .rims{animation:rims 1s linear infinite}@keyframes rims{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rims{animation:none!important}}';
  for(const button of [$('#preview'),$('#apply'),clearButton]){const run=button.onclick;button.onclick=async event=>{if(busy)return;host.setAttribute('data-working','');try{await run(event);}finally{host.removeAttribute('data-working');}};}

  const tally=document.createElement('details');tally.id='tally';
  const summary=document.createElement('summary');summary.textContent='Expand details';
  const issues=document.createElement('div');issues.id='issues';tally.append(summary,issues,$('#result'));
  const status=document.createElement('p');status.id='status';status.setAttribute('role','status');status.textContent='Ready · A15';
  const progressBox=document.createElement('div');progressBox.id='run-progress';progressBox.hidden=true;
  progressBox.innerHTML='<label id="progress-label" for="progress-bar" role="status"></label><progress id="progress-bar" max="100" value="0"></progress>';
  function reportProgress(label,done,total,state='working'){
    progressBox.hidden=false;progressBox.dataset.state=state;const bar=progressBox.querySelector('progress');
    if(Number.isFinite(done)&&Number.isFinite(total)){bar.value=total?Math.min(100,Math.round(done/total*100)):100;}
    else if(state==='working')bar.removeAttribute('value');
    else if(!bar.hasAttribute('value'))bar.value=0;
    progressBox.querySelector('label').textContent=label+(Number.isFinite(total)?' · '+Math.round(bar.value)+'%':'');
    bar.setAttribute('aria-valuetext',label);
  }
  const controls=document.createElement('div');controls.id='top-controls';
  $('section').append(controls);
  $('#profile').innerHTML='<label for="profile-select">Profile</label><select id="profile-select"><option>A15</option></select>';
  const stop=document.createElement('button');stop.id='stop';stop.textContent='Stop after current step';stop.disabled=true;stop.onclick=()=>{stopRequested=true;stop.disabled=true;};
  controls.append($('#profile'),$('#apply'),progressBox,$('#apply-note'),stop);
  $('#apply').disabled=false;$('#apply').setAttribute('aria-describedby','apply-note');
  const shortcuts=document.createElement('div');shortcuts.className='shortcuts';
  let target=null;
  function rememberTimeTarget(node){
    if(!(node instanceof HTMLInputElement)||!node.closest('#form-composer,.grid-flyout-active'))return false;
    const pair=timePair(node);if(!pair)return false;
    target={id:node.id,url:location.href,node,pair};status.textContent='Timestamp target selected';return true;
  }
  // Safari/iPad can move focus away from the input when ImageTrend opens its native date picker.
  // Capture the intended target before that happens, and recover from the native picker if needed.
  for(const type of ['pointerdown','touchstart','click','focusin'])document.addEventListener(type,e=>rememberTimeTarget(e.target),true);
  function recoverTimeTarget(){
    if(target?.node?.isConnected&&target.url===location.href&&target.pair?.date?.isConnected&&target.pair?.time?.isConnected)return target;
    const picker=document.getElementById('date-picker'),ko=window.ko,vm=picker&&ko?.contextFor?.(picker)?.$data;
    const focused=ko?.unwrap?.(vm?.focusedElement);
    if(focused){const node=document.getElementById(focused);if(rememberTimeTarget(node))return target;}
    if(rememberTimeTarget(document.activeElement))return target;
    return null;
  }
  for(const [label,id] of [['At Pt','29336'],['Leaving Scene','29337']]){
    const b=document.createElement('button');b.textContent=label;b.onpointerdown=e=>{if(e.button===0)e.preventDefault();};b.onclick=async e=>{
      e?.stopPropagation();
      if(busy)return;busy=true;const t=recoverTimeTarget();
      try{
        if(!t||!t.node.isConnected||t.url!==location.href)throw Error('Tap the destination date/time field once, then press '+label+'.');
        const prefix=t.id.replace(/(Date|Time)$/,''),scope=t.node.closest('.date-time,.control,.single-row-control')||t.node.parentElement;
        const pair=t.pair,date=pair?.date,time=pair?.time;
        if(!date||!time||date.disabled||time.disabled||date.readOnly||time.readOnly)throw Error('Writable date/time pair not recognized.');
        const root=currentRoot(),before=[date.value,time.value];
        // Reuse the proven Timestamp Lab native source and writer before opening Times.
        const ko=window.ko;
        let picker=document.getElementById('date-picker'),vm=picker&&ko.contextFor(picker)?.$data;
        const ownsPair=()=>vm&&[date.id,time.id].includes(ko.unwrap(vm.focusedElement));
        if(!visible(picker)||!ownsPair()){
          date.click();await new Promise(r=>setTimeout(r,150));
          picker=document.getElementById('date-picker');vm=picker&&ko.contextFor(picker)?.$data;
        }
        if(visible(picker)&&ownsPair()&&typeof vm.setDateObj==='function'&&ko.isObservable?.(vm.datePickerInputObservable)){
          const response=ko.unwrap(vm.currentResponseTimesObject),key=id==='29336'?'ArrivedAtPatient':'UnitLeftScene';
          const source=()=>ko.unwrap(ko.unwrap(response?.['ResponseTime'+key+'ModValue'])?.[key]);
          if(!source())throw Error('Source timeline time unavailable.');
          if(window.imagetrend.helpers.isFire())throw Error('Timestamp shortcut supports EMS forms only.');
          const raw=source(),stamp=window.dateFns.parse(window.dateFns.format(raw,window.imagetrend.helpers.getISODateTimeFormat()));
          if(!(stamp instanceof Date)||!Number.isFinite(stamp.getTime()))throw Error('Source timestamp is invalid.');
          const ctx=ko.contextFor(date);if(!ctx||window.imagetrend.FormComposer.isReadOnly(ctx))throw Error('Timestamp is read-only.');
          const owners=[window.imagetrend.currentVm,ctx.$root,ctx.$data,...(ctx.$parents||[])].filter(Boolean),locks=owners.filter(o=>'currentIncidentReadOnlyStatus' in Object(o)).map(o=>ko.unwrap(o.currentIncidentReadOnlyStatus));
          if(!locks.length||locks.some(x=>x!==false))throw Error('Chart editability could not be verified.');
          captureLocal(root,'timestamp shortcut');
          if(currentRoot()!==root||location.href!==t.url||!date.isConnected||!ownsPair()||source()!==raw)throw Error('Target or source changed; focus it again.');
          vm.setDateObj(stamp);await new Promise(r=>setTimeout(r,150));
          if(currentRoot()!==root||location.href!==t.url||!date.isConnected||parseWallTime(date.value,time.value)!==stamp.getTime())throw Error('Native timestamp read-back mismatch.');
          status.textContent=label+' — verified';return;
        }
        await readTimes();
        if(times[id]==null)throw Error('Source timeline time unavailable.');
        if(currentRoot()!==root||location.href!==t.url||!date.isConnected||date.value!==before[0]||time.value!==before[1])throw Error('Target changed; focus it again.');
        captureLocal(root,'timestamp shortcut');
        await writeTimePair(pair,times[id],id==='29336'?{label:'Patient Arrival'}:null);
        status.textContent=label+' copied to '+(scope.querySelector('label')?.textContent||prefix);
      }catch(e){status.textContent=e.message;}finally{busy=false;}
    };shortcuts.append(b);
  }
  controls.append(shortcuts,$('#preview'),status);
  const timelineButton=document.createElement('button');timelineButton.id='read-timeline';timelineButton.textContent='Read timeline';$('#preview').after(timelineButton);
  timelineButton.onclick=async()=>{if(busy)return;busy=true;try{await readTimes();status.textContent=Object.keys(times).length+' timeline times read'+(invalidTimes.size?' · invalid times need attention':'');}finally{busy=false;}};
  const footer=document.createElement('footer');footer.append(capture,clearButton,captureStatus);
  $('section').append(controls,tally,footer);
  $('#hide').textContent='◕';$('#hide').title='Hide Gremlin Logic';$('#hide').setAttribute('aria-label','Hide Gremlin Logic');$('h3').append($('#hide'));
  $('#hide').onclick=()=>{$('section').hidden=true;$('#launch').hidden=false;};
  $('#launch').textContent='◕ A15';
  function setTally(open){tally.open=!!open;summary.textContent=open?'Collapse details':'Expand details';}
  tally.ontoggle=()=>summary.textContent=tally.open?'Collapse details':'Expand details';
  const preview=$('#preview').onclick;$('#preview').onclick=async e=>{await preview(e);showIssues(reviewed||[]);};
  effects.textContent+=`:host{color:#eee8f6}section{background:#20212a;border-color:#aa76d0;max-height:82vh;width:390px}h3{color:#e1c0fa}h3 #hide{float:right;border-radius:50%;padding:4px 9px}button,select{background:#30313e;color:#f4edf8;border:1px solid #65576f;border-radius:7px}button:hover{border-color:#c5a0e5}#apply{display:block;width:100%;font-weight:700;background:#8851ac;padding:13px}#preview,#capture{font-size:12px}#profile label{margin:8px 0 0}#top-controls{position:sticky;top:-16px;background:#20212a;padding:8px 0;z-index:1}#apply-note{font-size:11px;color:#c4bbcf}.shortcuts{display:flex;gap:8px}.shortcuts button{flex:1}#status{font-size:12px;color:#ddc6ee}pre{background:#292631;color:#ddd3e5}#issues>div{border-left:3px solid #e9be62;padding:6px;background:#34302b;margin:7px 0}#issues button{text-align:left;text-decoration:underline;color:#ffe0a0;border:0;background:none}footer{display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap;border-top:1px solid #514359;margin-top:12px;padding-top:8px}footer small{width:100%}#launch{background:#20212a;color:#e1c0fa;border-radius:20px}#tally summary{cursor:pointer;padding:10px 0}.nuke-dialog{background:#20212a;color:white}.nuke-cover{z-index:2147483647}`;
  effects.textContent+=' section{display:flex;flex-direction:column;overflow:hidden;max-height:calc(100vh - 130px)}#top-controls{position:static;flex-shrink:0}#tally{min-height:35px;overflow:auto}footer{flex-shrink:0}#profile{margin:4px 0}#profile label{margin:2px 0}#status{margin:6px 0}#issues small{margin:3px 0}section>small{font-size:11px}';

  effects.textContent+='#progress-bar{width:100%;height:10px;accent-color:#bb87dc}#progress-label{font-size:12px;margin:5px 0}#run-progress[data-state="error"] progress{accent-color:#ed8989}#run-progress[data-state="done"] progress{accent-color:#73c799}';
  // Optional UI and diagnostics. No clinical rules or chart writes belong here.
  const settingsKey='gremlin-ui-v1';
  let preferences={compact:false,animations:true,observe:false,reverse:false};
  try{preferences={...preferences,...JSON.parse(localStorage.getItem(settingsKey)||'{}')};}catch(_){}
  const diagnostics=[],observations=[];
  const savePreferences=()=>{try{localStorage.setItem(settingsKey,JSON.stringify(preferences));}catch(_){status.textContent='Settings could not be saved.';}};
  const toolsPanel=document.createElement('div');toolsPanel.id='gremlin-tools';toolsPanel.hidden=true;
  const tabs=document.createElement('nav');tabs.setAttribute('aria-label','Gremlin views');
  const workflowTab=document.createElement('button'),toolsTab=document.createElement('button');
  workflowTab.textContent='Home';toolsTab.textContent='Tools';
  const settingsTab=document.createElement('button'),settingsPanel=document.createElement('div');settingsTab.textContent='Settings';settingsPanel.id='gremlin-settings';settingsPanel.hidden=true;
  tabs.append(workflowTab,toolsTab,settingsTab);controls.before(tabs);
  toolsPanel.append($('#preview'),timelineButton,footer);tally.after(toolsPanel,settingsPanel);
  function selectView(view){view=view===true?'tools':view===false?'home':view;toolsPanel.hidden=view!=='tools';settingsPanel.hidden=view!=='settings';controls.hidden=view!=='home';tally.hidden=view!=='tools';workflowTab.setAttribute('aria-pressed',String(view==='home'));toolsTab.setAttribute('aria-pressed',String(view==='tools'));settingsTab.setAttribute('aria-pressed',String(view==='settings'));}
  workflowTab.onclick=()=>selectView(false);toolsTab.onclick=()=>selectView(true);selectView(false);settingsTab.onclick=()=>selectView('settings');
  const settings=document.createElement('fieldset');settings.innerHTML='<legend>Settings</legend>';
  function setting(label,key,apply){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=preferences[key];row.append(input,document.createTextNode(' '+label));settings.append(row);input.onchange=()=>{preferences[key]=input.checked;savePreferences();apply();};apply();}
  setting('Compact panel','compact',()=>host.toggleAttribute('data-compact',preferences.compact));
  setting('Celebration animations','animations',()=>host.toggleAttribute('data-no-animation',!preferences.animations));
  setting('Swap timestamp button positions','reverse',()=>shortcuts.style.flexDirection=preferences.reverse?'row-reverse':'row');
  setting('Record field visit order locally','observe',()=>{});
  toolsPanel.prepend(settings);
  const about=document.createElement('small');about.textContent='Gremlin Logic A15 0.2.4.18 · Updates are managed by Tampermonkey. Observation is limited to field IDs and order in this tab.';settings.append(about);
  const resetLayout=document.createElement('button');resetLayout.textContent='Reset panel position';resetLayout.onclick=()=>{host.style.left='';host.style.right='24px';host.style.top='90px';};settings.append(resetLayout);
  const header=$('h3');header.style.cursor='move';
  header.onpointerdown=e=>{if(e.target.closest('button')||e.button!==0)return;const box=host.getBoundingClientRect(),dx=e.clientX-box.left,dy=e.clientY-box.top;header.setPointerCapture(e.pointerId);const move=p=>{host.style.right='auto';host.style.left=Math.max(0,Math.min(innerWidth-80,p.clientX-dx))+'px';host.style.top=Math.max(0,Math.min(innerHeight-60,p.clientY-dy))+'px';};const end=()=>{header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);};header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);};
  function record(action,outcome){diagnostics.push({sequence:diagnostics.length+1,action,outcome});if(diagnostics.length>200)diagnostics.shift();}
  for(const [button,action] of [[$('#apply'),'apply'],[clearButton,'clear'],[timelineButton,'timeline'],...Array.from(shortcuts.children,b=>[b,b.textContent==='At Pt'?'patient-time':'departure-time'])]){
    const run=button.onclick;button.onclick=async e=>{if(busy){record(action,'busy — skipped');return;}record(action,'started');try{await run(e);const timestamp=action==='patient-time'||action==='departure-time';record(action,timestamp?(/verified|copied to/.test(status.textContent)?'VERIFIED':diagnosticReason(status.textContent)):$('#issues').children.length?'FINISHED_WITH_ISSUES':'FINISHED');}catch(error){record(action,'failed');throw error;}};
  }
  // Never copy free-form error text: it may contain a chart answer or timestamp.
  function diagnosticReason(text){for(const [pattern,reason] of [[/exact target choice missing/i,'TARGET_CHOICE_MISSING'],[/row controls|rows changed/i,'ROW_IDENTITY_UNRESOLVED'],[/conflicting agency/i,'FIELD_IDENTITY_CONFLICT'],[/timeline|contact time|destination arrival/i,'SOURCE_TIME_UNAVAILABLE_OR_CHANGED'],[/mapping|field path/i,'MAPPING_UNAVAILABLE'],[/readback|not verified|mismatch/i,'READBACK_NOT_VERIFIED'],[/locked|read.only/i,'READ_ONLY'],[/changed/i,'CONTEXT_CHANGED'],[/unavailable|did not load/i,'CONTROL_UNAVAILABLE']])if(pattern.test(text))return reason;return 'REVIEW_IN_APP';}
  async function copyReport(payload){const value=JSON.stringify(payload,null,2);try{await navigator.clipboard.writeText(value);status.textContent='Report copied.';}catch(_){const text=document.createElement('textarea');text.value=value;text.readOnly=true;text.setAttribute('aria-label','Diagnostic report to copy');toolsPanel.append(text);text.select();}}
  const copyLog=document.createElement('button');copyLog.id='copy-diagnostic-log';copyLog.textContent='Copy diagnostic log';copyLog.onclick=()=>copyReport({version:'0.2.4.18',events:diagnostics,issueCount:$('#issues').children.length,issues:Array.from($('#issues').children,row=>({field:row.querySelector('button')?.textContent?.replace(' — Open field',''),reason:diagnosticReason(row.querySelector('small')?.textContent||'')}))});toolsPanel.insertBefore(copyLog,footer);
  let lastField=null;
  document.addEventListener('focusin',e=>{
    if(!preferences.observe||!e.target.closest?.('#form-composer'))return;
    let node=e.target.closest('[id]'),id=null;
    while(node&&node.id!=='form-composer'){if(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(node.id)){id=node.id;break;}node=node.parentElement;}
    if(!id||id===lastField)return;lastField=id;observations.push({from:observations.at(-1)?.field||null,field:id});if(observations.length>200)observations.shift();
  });
  const copyObservation=document.createElement('button');copyObservation.textContent='View workflow steps';copyObservation.onclick=()=>{sequenceView.hidden=!sequenceView.hidden;sequenceText.textContent=observations.length?observations.map((x,i)=>(i+1)+'. '+(choices.find(c=>c.id===x.field)?.label||x.field)).join('\n'):'No field visits recorded.';};
  const sequenceView=document.createElement('div'),sequenceText=document.createElement('pre'),copySteps=document.createElement('button');sequenceView.hidden=true;copySteps.textContent='Copy workflow steps';copySteps.onclick=()=>copyReport({schema:1,kind:'field-focus-sequence',events:observations});sequenceView.append(sequenceText,copySteps);settings.append(sequenceView);
  const clearObservation=document.createElement('button');clearObservation.textContent='Clear recorded steps';clearObservation.onclick=()=>{observations.length=0;lastField=null;sequenceText.textContent='No field visits recorded.';};settings.append(copyObservation,clearObservation);
  window.addEventListener('hashchange',()=>{target=null;reviewed=null;times={};learnedDefinitions.clear();observations.length=0;lastField=null;record('context','changed');});
  ui.querySelectorAll('button').forEach(b=>b.type='button');
  effects.textContent+='[hidden]{display:none!important}nav{display:flex;gap:8px}#gremlin-tools{overflow:auto;min-height:0}fieldset{border:1px solid #65576f;border-radius:8px}fieldset label{display:block;margin:8px 0}fieldset small{display:block}textarea{width:95%;min-height:180px}:host([data-compact]) section{width:320px}:host([data-no-animation]) .confetti{display:none}';
  // Keep routine actions separate from experimental and developer tools.
  $('#profile').hidden=true;
  clearButton.textContent='Nukacharta';
  clearButton.title='Clear the reviewed chart entries. Two confirmations are required.';
  toolsTab.textContent='Tools';
  const advanced=document.createElement('details');advanced.id='advanced-tools';
  const advancedTitle=document.createElement('summary');advancedTitle.textContent='Debugging';
  const shortcutNote=document.createElement('small');shortcutNote.textContent='Legacy timestamp shortcuts: not yet reliable. Use Timestamp Lab until its replacement is integrated.';
  advanced.append(advancedTitle,timelineButton,capture,copyLog,copyObservation,clearObservation,sequenceView);
  const observationHelp=document.createElement('p');observationHelp.textContent='Enable Record field visit order locally, work through the chart, then View workflow steps. Records field IDs and order, not entered values. Nothing is sent automatically. Copy shares only when you paste it. Recording clears when you change charts or reload. It does not replay actions or fill fields.';advanced.append(observationHelp);settingsPanel.append(settings,advanced);toolsPanel.prepend($('#preview'));
  const toolShortcuts=document.createElement('div');toolShortcuts.className='shortcuts';toolShortcuts.id='tool-shortcuts';toolsPanel.prepend(toolShortcuts);
  const timestampButtons=Array.from(shortcuts.children);
  const layoutToggle=document.createElement('button');layoutToggle.type='button';layoutToggle.textContent='Arrange buttons';layoutToggle.id='arrange-buttons';settings.append(layoutToggle);
  let arranging=false,dragged=null;
  const layout=()=>{
    const saved=preferences.timestampLayout;
    const order=Array.isArray(saved)&&saved.length===2&&new Set(saved.map(x=>x.id)).size===2&&saved.every(x=>[0,1].includes(x.id)&&['workflow','tools'].includes(x.area))?saved:[{id:0,area:'workflow'},{id:1,area:'workflow'}];
    for(const item of order)(item.area==='tools'?toolShortcuts:shortcuts).append(timestampButtons[item.id]);
  };
  const saveLayout=()=>{preferences.timestampLayout=[...Array.from(shortcuts.children,b=>({id:timestampButtons.indexOf(b),area:'workflow'})),...Array.from(toolShortcuts.children,b=>({id:timestampButtons.indexOf(b),area:'tools'}))];savePreferences();};
  layout();
  layoutToggle.onclick=()=>{arranging=!arranging;host.toggleAttribute('data-arranging',arranging);layoutToggle.textContent=arranging?'Done arranging':'Arrange buttons';layoutToggle.setAttribute('aria-pressed',String(arranging));timestampButtons.forEach(b=>b.draggable=arranging);};
  timestampButtons.forEach(b=>{b.addEventListener('click',e=>{if(arranging){e.preventDefault();e.stopImmediatePropagation();}},true);b.ondragstart=e=>{if(!arranging){e.preventDefault();return;}dragged=b;e.dataTransfer.setData('text/plain',b.textContent);};b.ondragend=()=>{dragged=null;};});
  const drop=(area,before)=>e=>{if(!arranging||!dragged)return;e.preventDefault();area.insertBefore(dragged,before||null);saveLayout();dragged=null;};
  for(const area of [shortcuts,toolShortcuts]){area.ondragover=e=>{if(arranging)e.preventDefault();};area.ondrop=e=>{const before=e.target.closest('button');drop(area,before?.parentElement===area?before:null)(e);};}
  for(const [tab,area,tools] of [[workflowTab,shortcuts,false],[toolsTab,toolShortcuts,true]]){tab.ondragover=e=>{if(arranging)e.preventDefault();};tab.ondrop=e=>{drop(area)(e);selectView(tools);};}
  const resetButtons=document.createElement('button');resetButtons.type='button';resetButtons.textContent='Restore timestamp buttons';resetButtons.onclick=()=>{delete preferences.timestampLayout;preferences.reverse=false;shortcuts.style.flexDirection='row';layout();savePreferences();};settings.append(resetButtons);
  effects.textContent+=':host([data-arranging]) .shortcuts{min-height:45px;border:2px dashed #087db5;padding:5px}:host([data-arranging]) .shortcuts button{cursor:grab}#arrange-buttons{font-size:11px}#tool-shortcuts:empty{display:none}:host([data-arranging]) #tool-shortcuts:empty{display:flex}';
  toolsPanel.append(tally);
  const help=document.createElement('details');help.id='quick-help';
  help.innerHTML='<summary>Help me</summary><p><b>Go, baby, go</b> applies the supported A15 rules. Review the resulting chart; you control Save.</p><p><b>At Pt / Leaving Scene:</b> select the intended date/time field first. The native clock picker supplies the source time.</p><p><b>Needs attention</b> opens Tools with links to unresolved fields.</p><p><b>Settings → Debugging</b> contains diagnostic logs, field mapping, timeline reading and workflow observation.</p><p><b>Nukacharta</b> clears only its reviewed inventory after two confirmations. It is not Undo.</p><p>Drag the heading to move this panel. The corner button hides it; the A15 tab brings it back.</p>';
  toolsPanel.prepend(help);
  const layoutHelp=document.createElement('p');layoutHelp.textContent='Arrange buttons: drag At Pt or Leaving Scene onto Home or Tools, or before the other button to reorder. Click Done arranging when finished. Layout is saved in this browser. Settings → Restore timestamp buttons resets them.';help.append(layoutHelp);
  const updateStop=()=>{stop.hidden=stop.disabled;};updateStop();
  new MutationObserver(updateStop).observe(stop,{attributes:true,attributeFilter:['disabled']});

  const issueIndicator=document.createElement('button');issueIndicator.id='issue-indicator';issueIndicator.hidden=true;issueIndicator.onclick=()=>{selectView('tools');setTally(true);};controls.append(issueIndicator);
  const updateIssues=()=>{const count=$('#issues').children.length;issueIndicator.hidden=!count;issueIndicator.textContent=count+' need attention — view';};new MutationObserver(updateIssues).observe($('#issues'),{childList:true});updateIssues();
  $('#apply-note').hidden=true;$('#apply').title=$('#apply-note').textContent;toolsPanel.append($('#apply-note'));$('#apply-note').hidden=false;
  status.hidden=true;new MutationObserver(()=>{status.hidden=!status.textContent||status.textContent==='Ready · A15';}).observe(status,{childList:true,characterData:true,subtree:true});
  effects.textContent+='section{width:350px;border-radius:16px;padding:14px}nav button{flex:1}nav button[aria-pressed="true"]{background:#8851ac;color:white}#gremlin-settings,#gremlin-tools{overflow:auto;min-height:0}#quick-help{font-size:12px;margin:8px 0}#quick-help p{line-height:1.4}#advanced-tools summary{cursor:pointer;padding:10px 0}#run-progress[data-state="idle"]{display:none}section>small{display:none}#issue-indicator{font-size:12px;background:transparent;color:#ffe0a0}#tally{overflow:visible}#gremlin-tools #status{display:block}';

})();
