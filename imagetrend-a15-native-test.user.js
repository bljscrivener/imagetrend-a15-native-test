// ==UserScript==
// @name         ImageTrend A15 Native Test (experimental)
// @namespace    local.imagetrend.a15native
// @version      0.2.4.7
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
  ui.innerHTML='<style>:host{font:14px system-ui;color:#253144}section{background:white;border:2px solid #864ca3;border-radius:12px;padding:16px;width:440px;max-width:85vw;max-height:70vh;overflow:auto;box-shadow:0 8px 24px #0004}button,select{font:inherit;padding:8px;margin:5px 0}select{width:100%}pre{white-space:pre-wrap;font:12px system-ui;background:#f4edf8;padding:9px}label{display:block;margin:10px 0}h3{margin:0}small{display:block;margin:8px 0}button{cursor:pointer}#apply{background:#864ca3;color:white;border:0;border-radius:5px}button:disabled{opacity:.45}[hidden]{display:none!important}</style><button id="launch">A15 Native Test</button><section hidden><h3>A15 Native Test · experimental 0.2.4.7</h3><small>Use on your TEST chart. Native field updates may persist immediately. This does not call the preset audit or chart Save.</small><p id="profile"><strong>Profile: A15</strong></p><button id="preview">Preview A15 changes</button><pre id="result">Review from any chart section. All mapped A15 defaults are selected; unavailable fields are listed for attention.</pre><label><input id="ack" type="checkbox">This is a TEST chart. All ready values match this scenario. I reviewed replacements in every vital/procedure entry.</label><button id="apply" disabled>Go, baby, go</button> <button id="hide">Minimize</button></section>';
  document.body.append(host);
  const $=s=>ui.querySelector(s);let reviewed=null,busy=false;
  const ENTRY_PATHS={"8a6e1556-e16f-516e-9f09-2a01527a24ba":"Incident.Scene.Response.Patient.Vitals","53af0886-1a17-576c-b77d-d64b3a7a930a":"Incident.Scene.Response.Patient.Vitals[].VitalsVitalsDateTimeModValue.VitalsDateTime","3ecad398-beca-5784-94f0-217e4bf92db7":"Incident.Scene.Response.Patient.Vitals[].VitalsObtainedPriorToEMSCareModValue.ObtainedPriorToEMSCare","8375d602-dcd5-5c1a-83e1-ceda50c7410c":"Incident.Scene.Response.Patient.Vitals[].VitalsCrewMemberIDModValue.LicensureID","7f5c88af-a3be-5947-b47b-ffe6cc957102":"Incident.Scene.Response.Patient.Vitals[].VitalsLevelOfResponseModValue.LevelOfResponse","94f6e43f-139c-5eda-bd46-bdb95d7111bd":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSEyeModValue.GCSEye","30b5cc8f-c8c4-5446-a140-df8017828842":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSVerbalModValue.GCSVerbal","de69b8e0-ea97-5898-af28-163665df5d03":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSMotorModValue.GCSMotor","d6db496e-fd74-5d8a-a016-e324072dcb9c":"Incident.Scene.Response.Patient.Vitals[].GCSQualifiers[].GCSQualifierGCSQualifierModValue.GCSQualifier","4fcdbba5-c769-5176-b37b-64db2f5aff94":"Incident.Scene.Response.Patient.Vitals[].VitalsGCSTotalModValue.GCSTotal","b0258daa-3a9c-5a0d-8f6d-629891c26562":"Incident.Scene.Response.Patient.Vitals[].VitalsSBPModValue.SBP","6fd0cdf7-f71a-50a9-b02a-5819f40e356a":"Incident.Scene.Response.Patient.Vitals[].VitalsDBPModValue.DBP","0dcf3d4f-f98d-53c9-a042-3bd73e6104d9":"Incident.Scene.Response.Patient.Vitals[].VitalsBPMethodModValue.BPMethod","37500c2a-2a78-53d2-9559-78c75eda9cb3":"Incident.Scene.Response.Patient.Vitals[].BPLocation","08dee948-3a33-5983-b74f-fe5823ae94a0":"Incident.Scene.Response.Patient.Vitals[].MeanArterialPressure","8d1b6f04-cc37-5ee1-85f7-9619cfb05873":"Incident.Scene.Response.Patient.Vitals[].VitalsPulseRateModValue.PulseRate","189b8c3d-3285-5066-b469-296a5c87d922":"Incident.Scene.Response.Patient.Vitals[].PulseRateMethod","946f201d-2126-5b9a-b73c-b6a098c254da":"Incident.Scene.Response.Patient.Vitals[].VitalsRespiratoryRateModValue.RespiratoryRate","1ac08c15-b252-5b17-bdd5-990dfb81b475":"Incident.Scene.Response.Patient.Vitals[].RespiratoryEffort","d4b32d81-fc1e-544f-aeba-77e176cac505":"Incident.Scene.Response.Patient.Vitals[].RespiratoryRegularity","76e7fb24-9a8f-51e9-8dfb-bdf1144ef197":"Incident.Scene.Response.Patient.Vitals[].VitalsPulseOximetryModValue.PulseOximetry","98cd8d07-762f-5665-9bef-e9b908b6d9dd":"Incident.Scene.Response.Patient.Vitals[].PulseOximetryQualifier","d892f99f-5dcc-5abb-b2fe-8a0d1935e581":"Incident.Scene.Response.Patient.Vitals[].VitalsCarbonDioxideModValue.CarbonDioxide","01975843-3408-5a00-b45b-79e64e0db108":"Incident.Scene.Response.Patient.Vitals[].VitalsCarbonDioxideModValue.Unit","84dd4a6f-18ce-51e2-a00c-1e54d1c31ead":"Incident.Scene.Response.Patient.Vitals[].VitalsBloodGlucoseModValue.BloodGlucose","7bea3862-f196-567b-b9e9-9239b9f103e8":"Incident.Scene.Response.Patient.Vitals[].VitalsBodyTemperatureCModValue.BodyTemperatureC","73e8899f-058f-5144-88f3-1c1640cb7a7d":"Incident.Scene.Response.Patient.Vitals[].TemperatureMethod","42cf38a8-8380-571b-93d4-392a3183d47c":"Incident.Scene.Response.Patient.Vitals[].VitalsPainScoreModValue.PainScore","37a26280-090a-5d8d-b95d-c6c950839a6f":"Incident.Scene.Response.Patient.Vitals[].VitalsPainScaleTypeModValue.PainScaleType","10388fca-facb-5673-87e2-e109f28bd064":"Incident.Scene.Response.Patient.Vitals[].VitalsStrokeScoreModValue.StrokeScore","408ab322-147e-5539-afaf-2062d143a55c":"Incident.Scene.Response.Patient.Vitals[].VitalsStrokeScaleTypeModValue.StrokeScaleType","ee0c31ce-9274-5df2-a435-95915e6e2ddb":"Incident.Scene.Response.Patient.Vitals[].RichmondAgitationSedationScale","5c02d626-6c37-5418-bb6e-696df46b3ef0":"Incident.Scene.Response.Patient.Vitals[].VitalsAPGARModValue.APGAR","59cd95c4-0496-546f-8c53-4b21bf9ff965":"Incident.Scene.Response.Patient.Vitals[].VitalsThrombolyticScreenModValue.ThrombolyticScreen","5ef095a7-a0ef-5d0b-9dcf-6a12ce47f85f":"Incident.Scene.Response.Patient.Vitals[].VitalsECGTypeModValue.ECGType","fc93d071-9efc-5ce9-a393-3507852a8e19":"Incident.Scene.Response.Patient.Vitals[].ECGCardiacRhythms[].ECGCardiacRhythmCardiacRhythmModValue.CardiacRhythm","50afd178-e284-59dd-a4f8-463af0acfad3":"Incident.Scene.Response.Patient.Vitals[].ECGInterpretations[].ECGInterpretationInterpretationMethodModValue.InterpretationMethod","1b57645d-c521-5d46-a400-5a67aaec7aad":"Incident.Scene.Response.Patient.Vitals[].VitalsWaveforms","c9b0b483-c98e-5a08-bd18-89a337374339":"Incident.Scene.Response.Patient.ProtocolUseds","915663be-bec8-5dc5-b2ae-e1901f5ade04":"Incident.Scene.Response.Patient.ProtocolUseds[].ProtocolUsedProtocolModValue.Protocol","51af94d0-e421-5002-af47-2539205ff625":"Incident.Scene.Response.Patient.ProtocolUseds[].ProtocolUsedProtocolAgeCategoryModValue.ProtocolAgeCategory","aa6d315f-ccbc-58c0-950e-2e0932ee67b6":"Incident.Scene.Response.Patient.PatientProcedures","231489ba-6c9e-5e78-a52b-40b13e6bcc26":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureDateTimeModValue.ProcedureDateTime","c07c1d8b-c7d4-5a5a-8ec1-01bf67f882e0":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePriorToEMSUnitCareModValue.PriorToEMSUnitCare","31eb2248-cb52-f111-b7ac-b38df619f2c6":"Incident.Scene.Response.Patient.PatientProcedures[].SupplementalQuestions.31eb2248-cb52-f111-b7ac-b38df619f2c6","03581536-da9b-562c-9229-8a29353b5f40":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureCrewMemberIDModValue.LicensureID","9d0465df-a31c-f111-88a8-cdf828d6164c":"Incident.Scene.Response.Patient.PatientProcedures[].SupplementalQuestions.9d0465df-a31c-f111-88a8-cdf828d6164c","d0c37cfb-ac96-5c0e-9eb6-d21aeb3f57d7":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePerformerRoleModValue.PerformerRole","6a3cd763-c562-574c-b209-bbced74d73c1":"Incident.Scene.Response.Patient.PatientProcedures[].ProcedureAuthorization","02dffd5f-4c68-506b-881d-5b00c78090aa":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedurePerformedModValue.ProcedurePerformed","14775b1d-c505-5161-b7c9-7c9ea3c56cc4":"Incident.Scene.Response.Patient.PatientProcedures[].SizeOfEquipment","7f9c5ed0-8a4e-5f82-be4b-c6139be2f60a":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureLocationModValue.ProcedureLocation","342287d1-d2df-5bc9-bc3a-572db35c10bb":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureVascularAccessLocationModValue.VascularAccessLocation","536eb7cc-2c34-58bc-994b-c46c6e5ee80f":"Incident.Scene.Response.Patient.PatientProcedures[].LaryngoscopeBladeProcedure","73a818d0-5b75-5cbf-911a-114f70d294e5":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureNumberOfAttemptsModValue.NumberOfAttempt","adcc71b8-0b92-5387-8b9f-cb94b729e4ac":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureProcedureSuccessfulModValue.ProcedureSuccessful","9cb81cbd-eb5d-5516-aacd-1a75a68e99a2":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedureComplications[].PatientProcedureComplicationProcedureComplicationModValue.ProcedureComplication","5d094507-a437-5112-8f16-58d56704dc7c":"Incident.Scene.Response.Patient.PatientProcedures[].PatientProcedurePatientResponseModValue.PatientResponse","21fff6b7-0787-5a85-91f4-3b6ec40cc2fa":"Incident.Scene.Response.Patient.PatientProcedures[].ProcedureComment","c432c124-8bd9-ef11-bfc8-001dd8b72ccf":"Incident.SupplementalQuestions.c432c124-8bd9-ef11-bfc8-001dd8b72ccf","417e9589-a07e-5982-8cec-7893618b9f83":"Incident.Scene.Response.Patient.Medications"};
  choices.push({id:'3ecad398-beca-5784-94f0-217e4bf92db7',label:'Obtained Prior to This Unit EMS Care',target:'No'});
  choices.push({id:'231489ba-6c9e-5e78-a52b-40b13e6bcc26',label:'Procedure timestamp',time:true});
  const procedureNames=['Assessment -ALS','Neurological assessment','Adult pain assessment','Moving a patient to a stretcher'];
  function procedureName(entry){
    const ko=window.ko,answer=ko.unwrap(entry.PatientProcedureProcedurePerformedModValue);
    const code=ko.unwrap(answer?.PlusOneCode)||ko.unwrap(answer?.ProcedurePerformed);
    const canonical=x=>norm(x).replace(/\s+/g,' ').replace(/\s*-\s*/g,'-').toLowerCase();
    const candidates=[...new Set(Object.values(window.imagetrend.formComposer.agencyResources||{}).flatMap(r=>(r?.Elements||[]).filter(e=>String(e.Id)===String(code)).map(e=>canonical(e.Value))))];
    if(!candidates.length)throw Error('Procedure code has no loaded display mapping. Open its entry and preview again.');
    if(candidates.length!==1)throw Error('Procedure code has conflicting display mappings.');
    const known=procedureNames.find(n=>canonical(n)===candidates[0]);
    if(!known)throw Error('Procedure '+candidates[0]+' is outside the A15 bundle.');
    return known;
  }
  let times={};
  async function readTimes(){
    const ids=['29335','29336','29337','29338'],url=location.href;
    const inputs=()=>ids.flatMap(id=>[...document.querySelectorAll('[id="'+id+'Date"]')]).filter(visible);
    let opener=null;
    try{
      if(!inputs().length){opener=document.querySelector('#response-times-tool');if(!opener)throw Error('Open Times to read procedure timing.');opener.click();for(let i=0;i<25&&!inputs().length;i++)await new Promise(r=>setTimeout(r,100));}
      if(url!==location.href||!inputs().length)throw Error('Timeline unavailable.');
      const next={};for(const id of ids){
        const date=[...document.querySelectorAll('[id="'+id+'Date"]')].filter(visible),time=[...document.querySelectorAll('[id="'+id+'Time"]')].filter(visible);
        if(date.length!==1||time.length!==1)continue;
        const d=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date[0].value),t=/^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time[0].value);
        if(!d||!t)continue;const v=new Date(+d[3],+d[1]-1,+d[2],+t[1],+t[2],+(t[3]||0));
        if(v.getFullYear()===+d[3]&&v.getMonth()===+d[1]-1&&v.getDate()===+d[2]&&+t[1]<24&&+t[2]<60&&+(t[3]||0)<60)next[id]=v.getTime();
      }times=next;
    }catch(e){times={};}
    finally{if(opener&&url===location.href&&inputs().length)opener.click();}
  }
  function procedureTiming(name){
    const scene=times['29335'],depart=times['29337'],patient=times['29336'];let value,source;
    if(name==='Moving a patient to a stretcher'){
      if(depart!=null){value=depart-120000;source='Depart Scene − 2 minutes';if(scene!=null&&value<scene)throw Error('Stretcher time precedes scene arrival.');}
      else if(scene!=null){value=scene+120000;source='Arrived on Scene + 2 minutes';}
      if(value!=null&&patient!=null&&value<patient)throw Error('Stretcher time precedes patient contact.');
    }else {value=patient;source='Arrived at Patient';}
    if(value==null)throw Error('Required timeline timestamp missing or invalid; no current-time fallback.');
    return {value:new Date(value).toISOString(),source};
  }
  const visible=n=>!!n&&n.isConnected&&!!n.getClientRects().length;
  const norm=x=>String(x??'').trim();
  function reset(){reviewed=null;$('#ack').checked=false;$('#apply').disabled=true;}
  function resolve(root,path,ko){let n=root;for(const p of path.split('.')){n=ko.unwrap(n);if(n==null||!(p in Object(n)))throw Error('Native field path unavailable.');n=n[p];}return n;}
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
    if(c.label==='Destination Team Pre-Arrival Alert or Activation')throw Error('Needs attention: activation creation remains manual.');
    if(c.label==='Type of Service Requested')throw Error('Needs attention: priority-dependent service rule requires native priority mapping.');
    if(c.input)throw Error('Needs attention: numeric/input mapping not enabled in native test.');
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
        const name=procedureName(entry);c={...c,entryLabel:name+' · entry '+(index+1)};
        if(c.time){const timing=procedureTiming(name);c={...c,target:timing.value,source:timing.source};}
      }
      path=captured.replace('[]','.'+index);
      template={BindingPathEntryID:c.id,BindingPathFromOrigin:path,ReportingStandardID:app.formComposer.reportingStandardID,IsMultiselect:path.includes('[]'),IsInGrid:false};
    }else{
      const templates=(app.formComposer.agencyPresetValues||[]).flatMap(d=>d.PresetValues||[]).filter(d=>d.BindingPathEntryID===c.id&&d.ReportingStandardID===app.formComposer.reportingStandardID);
      if(!templates.length)throw Error('Needs attention: no loaded native field mapping.');
      const signatures=[...new Set(templates.map(d=>JSON.stringify([d.BindingPathFromOrigin,!!d.IsMultiselect,!!d.IsInGrid])))];
      if(signatures.length!==1)throw Error('Needs attention: ambiguous native field mapping.');
      template=templates[0];path=template.BindingPathFromOrigin;
      if(template.IsInGrid||typeof path!=='string'||!path.startsWith('Incident.')||(path.match(/\[\]/g)||[]).length>(template.IsMultiselect?1:0))throw Error('Needs attention: unsupported repeated-entry mapping.');
    }
    const resources=app.formComposer.agencyResources?.[c.id.toLowerCase()];
    const special=c.label==='ECG Interpretation'&&c.target==='Not Applicable';
    const matches=c.time?[{Id:c.target}]:(resources?.[special?'NotValues':'Elements']||[]).filter(e=>norm(e.Value)===norm(c.target));
    if(matches.length!==1)throw Error('Needs attention: exact target choice missing or ambiguous.');
    const code=matches[0].Id;
    if(typeof code!=='string'||!code||code.includes('|'))throw Error('Needs attention: unsupported target code.');
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
    const current=c.time?norm(answers[0]):norm(ko.unwrap(vm.currentValueDisplay)),target=c.time?c.target:norm(ko.unwrap(vm.presetValueDisplay));
    if(!target||target!==norm(c.target))throw Error('Native preset could not translate the target code to a display value.');
    // The native multiselect writer removes all entries, so only an empty collection is eligible.
    const canApply=repeated?current!==target:!current&&(c.multi?collection.length===0:answers.every(value=>value==null||value===''));
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
    if(!path||!/^Incident.Scene.Response.Patient.(Vitals|PatientProcedures)\[\]\./.test(path))return [c];
    const ko=window.ko,form=document.querySelector('#form-composer');
    if(!ko||!form)return [c];
    const contexts=[form,...form.querySelectorAll('[data-bind]')].map(n=>ko.contextFor(n)).filter(Boolean);
    const roots=[...new Set(contexts.flatMap(x=>[x.$root,x.$data,...(x.$parents||[])]))].filter(r=>{try{return Array.isArray(ko.unwrap(resolve(r,path.split('[]')[0],ko)));}catch(_){return false;}});
    if(roots.length!==1)return [c];
    const entries=ko.unwrap(resolve(roots[0],path.split('[]')[0],ko));
    return entries.length?entries.map((entry,i)=>({...c,entry,label:c.label,entryLabel:(path.includes('.Vitals[]')?'Vital':'Procedure')+' '+(i+1)})):[c];
  }

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
      nativeSetInput(inputs.date, plannedTime.date);
      nativeSetInput(inputs.time, plannedTime.time);
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
    const lists = grid.querySelectorAll('.grid-item-display');
    if (lists.length !== 1)
      throw new Error('Procedures already exist or list is unavailable. Open an existing entry to review; automatic Add requires an empty list.');
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
    if (!/\/Incident\d+\/Form42(?:$|[/?])/.test(location.hash)) throw new Error('Open a Form42 chart.');
    const storageKey = 'it-a15-create:' + url + ':' + names.join('|');
    if (sessionStorage.getItem(storageKey)) throw new Error('Bundle already attempted in this tab. Review existing procedures before adding anything manually.');
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
    const names=entries.map(procedureName); // Unknown entries block creation, never assume missing.
    const missing=procedureNames.filter(n=>!names.includes(n));
    if(!missing.length)return null;
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
    await procedureWorkflow(plan.missing,n=>{$('#result').textContent='Created: '+n;});
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
      const targets=[...grid.querySelectorAll('[data-bind]')].filter(x=>visible(x)&&/click\s*:/.test(x.dataset.bind||'')&&/grid\.(?:open|edit)\w*\s*\(/i.test(x.dataset.bind||'')&&!/delete|remove|add/i.test(x.dataset.bind||''));
      const leaves=targets.filter(x=>!targets.some(y=>y!==x&&x.contains(y)));
      if(leaves.length!==entries.length)throw Error('Assessment row controls are not uniquely recognized.');
      leaves[0].click();const fly=await wait(()=>[...document.querySelectorAll('.grid-flyout-active')].find(visible));
      const input=fly.querySelector('input[id$="25415Date"]'),dateCtx=input&&ko.contextFor(input),def=dateCtx?.$data;
      const binding=ko.unwrap(def?.BindingPath)||ko.unwrap(def?.BindingPathFromOrigin),id=ko.unwrap(def?.BindingPathEntryID);
      if(!binding?.startsWith(path+'[].')||!id)throw Error('Assessment timestamp mapping unavailable. Close the open entry.');
      const cancel=fly.querySelector('button[data-bind*="cancelButtonClickHandler"]');if(!cancel)throw Error('Assessment Cancel unavailable.');cancel.click();await wait(()=>!fly.isConnected||!visible(fly));
      const expected=[plan.target,new Date(times['29338']??0).toISOString()];
      for(let i=0;i<entries.length;i++){
        check();if(collection().length!==entries.length||collection().some((x,j)=>x!==entries[j]))throw Error('Assessment entries changed.');
        const exact=binding.replace('[]','.'+i),vm=new window.imagetrend.runForm.PresetValueViewModel({BindingPathEntryID:id,BindingPathFromOrigin:exact,ReportingStandardID:window.imagetrend.formComposer.reportingStandardID,IsInGrid:false,IsMultiselect:false,IsNotValue:false,IsPertinentNegative:false,Value:expected[i]},plan.root);
        vm.applyPresetValue();if(Date.parse(ko.unwrap(resolve(plan.root,exact,ko)))!==Date.parse(expected[i]))throw Error('Assessment '+(i+1)+' timestamp verification failed.');
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
    for(const [i,input] of [date,time].entries()){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[i]);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('blur',{bubbles:true}));}
    if(date.value!==values[0]||time.value!==values[1])throw Error('Assessment timestamp was not accepted. Inspect the open entry.');
    check();const ok=fly.querySelector('button[data-bind*="okButtonClickHandler"]');
    if(!ok||ok.disabled||ok.classList.contains('disabled'))throw Error('Assessment OK unavailable.');
    ok.click();await wait(()=>!visible(fly)||!fly.isConnected);
    if(collection().length!==1)throw Error('Assessment entry count not verified. Inspect before retrying.');
    return 'Assessment/Exam created at patient contact; no findings were entered.';
  }
  $('#launch').onclick=()=>{$('section').hidden=false;$('#launch').hidden=true;};
  $('#hide').onclick=()=>{$('section').hidden=true;$('#launch').hidden=false;};
  $('#preview').onclick=async()=>{
    if(busy)return;busy=true;$('#preview').disabled=true;await readTimes();
    reset();try{
      const selected=choices;
      reviewed=selected.flatMap(expandChoice).map(c=>{try{return inspect(c);}catch(e){return {c,canApply:false,error:e.message};}});
      try{const creation=creationPlan();if(creation)reviewed.push(creation);}catch(e){reviewed.push({c:{label:'Create missing procedures',target:'A15'},error:e.message,canApply:false});}
      try{const assessment=assessmentPlan();if(assessment)reviewed.push(assessment);}catch(e){reviewed.push({c:{label:'Assessment/Exam',target:'Patient contact timestamp'},error:e.message,canApply:false});}
      $('#result').textContent=reviewed.map(x=>x.error?(x.c.entryLabel?x.c.entryLabel+' · ':'')+x.c.label+' → '+x.c.target+'\n'+x.error:(x.c.entryLabel?x.c.entryLabel+' · ':'')+x.c.label+'\nCurrent: '+(x.current||'(blank)')+' → '+x.target+(x.c.source?' ('+x.c.source+')':'')+'\n'+(x.canApply?(x.current?'Ready — replace with reviewed A15 value':'Ready'):x.current===x.target?'Already correct':'Existing answer preserved')).join('\n\n');
    }catch(e){reset();$('#result').textContent=e.message;}finally{busy=false;$('#preview').disabled=false;}
  };
  $('#ack').onchange=()=>{$('#apply').disabled=busy||!$('#ack').checked||!reviewed?.some(x=>x.canApply);};
  $('#apply').onclick=async()=>{
    if(busy||!reviewed?.some(x=>x.canApply)||!$('#ack').checked)return;
    busy=true;$('#apply').disabled=true;$('#preview').disabled=true;
    const results=[];
    try{
      if(reviewed.some(x=>(x.c.time||x.c.create||x.c.assessment)&&x.canApply))await readTimes();
      const pending=reviewed.filter(x=>x.canApply);
      const validate=old=>{
        if(old.c.create||old.c.assessment)return old;
        const fresh=inspect(old.c);
        if(fresh.url!==old.url||fresh.root!==old.root||fresh.snapshot!==old.snapshot||fresh.target!==old.target||!fresh.canApply)throw Error('Chart or field changed since preview. Preview again.');
        return fresh;
      };
      pending.forEach(validate);
      for(const old of pending){
        if(old.c.assessment){results.push(await createAssessment(old));continue;}
        if(old.c.create){await createReviewed(old);results.push('Verified: created '+old.missing.length+' missing procedures');continue;}
        const fresh=validate(old);
        fresh.vm.applyPresetValue();
        let verified=false;
        for(let i=0;i<30;i++){
          if(location.href!==fresh.url||inspect(fresh.c).root!==fresh.root)throw Error('Chart changed after write. Inspect before retrying.');
          fresh.vm.init();
          if((fresh.c.time?norm(window.ko.unwrap(resolve(fresh.root,fresh.c.path,window.ko))):norm(window.ko.unwrap(fresh.vm.currentValueDisplay)))===fresh.target){verified=true;break;}
          await new Promise(r=>setTimeout(r,100));
        }
        if(!verified)throw Error('Read-back failed for '+fresh.c.label+'. Inspect before retrying.');
        results.push('Verified: '+(fresh.c.entryLabel?fresh.c.entryLabel+' · ':'')+fresh.c.label);
      }
      $('#result').textContent=results.join('\n')+'\n'+groupedIssues(reviewed)+'\nVisit the fields to verify their displays. No explicit Save or preset audit called; native persistence may occur.';
    }catch(e){$('#result').textContent=results.join('\n')+'\nStopped: '+e.message+'\nEarlier writes may remain. Preview again after inspecting.';}
    finally{busy=false;reset();$('#preview').disabled=false;}
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
    const prior=ui.activeElement,finish=value=>{cover.remove();prior?.focus();done(value);};
    cover.querySelector('#nuke-cancel').onclick=()=>finish(false);cover.querySelector('#nuke-confirm').onclick=()=>finish(true);
    cover.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish(false);}if(e.key==='Tab'){e.preventDefault();const buttons=[...cover.querySelectorAll('button')];buttons[ui.activeElement===buttons[0]?1:0].focus();}};
    ui.append(cover);cover.querySelector('#nuke-cancel').focus();
  });}
  function celebrateClear(){
    const stage=document.createElement('div');stage.className='confetti';stage.setAttribute('aria-hidden','true');
    for(let i=0;i<48;i++){const bit=document.createElement('i');bit.style.cssText=`left:${i%2?95:5}vw;--dx:${(i%2?-1:1)*(50+Math.random()*650)}px;--color:${['#864ca3','#ffc857','#26b5b0','#e76f51'][i%4]};animation-delay:${Math.random()*180}ms`;stage.append(bit);}
    ui.append(stage);setTimeout(()=>stage.remove(),1800);
  }
  function mappedClearFields(root){
    const ko=window.ko,app=window.imagetrend,byPath=new Map();
    for(const d of (app.formComposer.agencyPresetValues||[]).flatMap(x=>x.PresetValues||[])){
      const path=d.BindingPathFromOrigin;
      if(d.ReportingStandardID!==app.formComposer.reportingStandardID||d.IsInGrid||typeof path!=='string'||!path.startsWith('Incident.Scene.Response.Patient.')||/Date|Time|Vitals|PatientProcedures|Medications|ProtocolUseds/.test(path))continue;
      // Only mapped profile fields and transport disposition; demographics are excluded.
      const choice=choices.find(x=>x.id===d.BindingPathEntryID);
      if(!choice&&!path.startsWith('Incident.Scene.Response.Patient.Disposition.'))continue;
      if((path.match(/\[\]/g)||[]).length>(d.IsMultiselect?1:0))continue;
      try{
        const endpoint=d.IsMultiselect?path.split('[]')[0]:path.slice(0,path.lastIndexOf('.'));
        const read=()=>{const value=ko.unwrap(resolve(root,endpoint,ko));return d.IsMultiselect?[...value]:[path.split('.').pop(),'NotValue','PertinentNegative','PlusOneCode'].map(k=>ko.unwrap(value[k])??null);};
        const before=read();if(!before.some(x=>x!=null&&x!==''))continue;
        const vm=new app.runForm.PresetValueViewModel({...d,Value:null,IsNotValue:false,IsPertinentNegative:false},root);
        if(!byPath.has(path))byPath.set(path,{label:choice?.label||d.FieldName||'Transport field',read,before,vm});
      }catch(_){/* Unsupported paths remain intact. */}
    }
    return [...byPath.values()];
  }
  clearButton.onclick=async()=>{
    if(busy)return;
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
      const entries=['Vitals','PatientProcedures','ProtocolUseds','Medications'].map(key=>({key,value:patient[key],items:ko.unwrap(patient[key])}));
      const eligible=entries.filter(x=>Array.isArray(x.items)&&x.items.length);
      const fields=mappedClearFields(roots[0]);
      if(!eligible.length&&!fields.length)throw Error('No mapped chart entries or fields to clear.');
      if(eligible.some(x=>typeof x.value?.removeAll!=='function'))throw Error('Native collection removal unavailable. No changes made.');
      const snapshot=eligible.map(x=>({...x,items:[...x.items]}));
      busy=true;
      if(!window.confirm('Clear these entries and mapped STAT/Transport fields?\n'+snapshot.map(x=>x.key+': '+x.items.length).concat(fields.map(x=>x.label)).join('\n')+'\nDispatch information and timeline timestamps are preserved. Unmapped fields remain untouched.'))return;
      if(!await nukeWarning())return;
      if(location.href!==url||!form.isConnected||!unlocked())throw Error('Chart changed. Clear cancelled.');
      for(const x of snapshot){const current=ko.unwrap(patient[x.key]);if(patient[x.key]!==x.value||current.length!==x.items.length||current.some((v,i)=>v!==x.items[i]))throw Error('Entries changed. Clear cancelled.');}
      for(const x of fields){const now=x.read();if(now.length!==x.before.length||now.some((v,i)=>v!==x.before[i]))throw Error('Fields changed. Clear cancelled.');}
      reset();busy=true;
      for(const x of snapshot){x.value.removeAll();if(ko.unwrap(x.value).length)throw Error('Removal not verified for '+x.key+'. Earlier removals may remain.');}
      for(const x of fields){if(location.href!==url||!unlocked())throw Error('Chart changed during clearing. Earlier removals may remain.');x.vm.applyPresetValue();if(x.read().some(v=>v!=null&&v!==''))throw Error('Clear not verified: '+x.label+'. Earlier removals may remain.');}
      $('#result').textContent='Cleared '+snapshot.map(x=>x.items.length+' '+x.key).join(', ')+' and '+fields.length+' mapped fields. Dispatch/timeline preserved; unmapped fields remain. Native persistence may occur.';
      Object.keys(sessionStorage).filter(k=>k.startsWith('it-a15-create:'+url+':')).forEach(k=>sessionStorage.removeItem(k));celebrateClear();
    }catch(e){$('#result').textContent='Clear stopped: '+e.message;}finally{busy=false;}
  };
  const rims=document.createElement('span');rims.className='rims';rims.setAttribute('aria-hidden','true');rims.textContent=' ⚙';$('h3').append(rims);
  effects.textContent+=' .rims{display:inline-block;color:#864ca3}:host([data-working]) .rims{animation:rims 1s linear infinite}@keyframes rims{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rims{animation:none!important}}';
  for(const button of [$('#preview'),$('#apply'),clearButton]){const run=button.onclick;button.onclick=async event=>{if(busy)return;host.setAttribute('data-working','');try{await run(event);}finally{host.removeAttribute('data-working');}};}

})();
