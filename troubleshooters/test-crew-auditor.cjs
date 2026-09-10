const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
let source=fs.readFileSync(__dirname+'/gremlin-crew-auditor.user.js','utf8');
const controls=new Map(),ui={querySelector(s){if(!controls.has(s))controls.set(s,{});return controls.get(s);},querySelectorAll(){return [];}},host={style:{},attachShadow(){return ui;}};
const sandbox={window:{ko:{unwrap:x=>typeof x==='function'?x():x}},document:{getElementById(){},createElement(){return host;},body:{append(){}},querySelectorAll(){return [];}},location:{href:'https://example.test'},sessionStorage:{setItem(){}},setTimeout,console};
source=source.replace(/\}\)\(\);\s*$/,'window.test={audit,rules,crewLevelField,run};})();');vm.runInNewContext(source,sandbox);
const {audit,rules,crewLevelField,run}=sandbox.window.test;
const crew=(p,l)=>({CrewMemberAgencyPerformerIDModValue:{PerformerID:p,LicensureID:'license-'+p},CrewMemberCrewMemberLevelModValue:{CrewMemberLevel:l}});
const response={CrewMembers:[crew('a','crew-paramedic'),crew('b','crew-emt')],Patient:{PatientResponse:{PatientResponseCrewMemberIDModValue:{PerformerID:'b'}}}};
const resources={[crewLevelField]:{Elements:[{Id:'crew-paramedic',Value:'Paramedic'},{Id:'crew-emt',Value:'EMT'}]}};
for(const rule of rules){resources[rule.field]={Elements:[{Id:rule.kind+'-paramedic',Value:'Paramedic'},{Id:rule.kind+'-emt',Value:'EMT'}]};response.Patient[rule.list]=[{[rule.identity]:{PerformerID:'a',LicensureID:'license-a'},[rule.role]:{[rule.key]:'critical-care',NotValue:null}}];}
let r=audit(response,resources,'a');assert.equal(r.plans.length,2);assert.equal(r.issues.filter(x=>x.code==='MEMBER_VERIFIED').length,2);
assert.equal(audit(response,resources,'unknown').issues.some(x=>x.scope==='Signed-in user'&&x.code==='NOT_UNIQUE_CREW_MEMBER'),true);
response.CrewMembers.pop();assert.equal(audit(response,resources,'a').issues.some(x=>x.code==='EXPECTED_TWO_CREW'),true);response.CrewMembers.push(crew('b','crew-emt'));
const rule=rules[0],entry=response.Patient[rule.list][0];entry[rule.identity].PerformerID='unknown';assert.equal(audit(response,resources,'a').plans.length,1);entry[rule.identity].PerformerID='a';
resources[rule.field].Elements.push({Id:'duplicate',Value:'Paramedic'});assert.equal(audit(response,resources,'a').plans.length,1);resources[rule.field].Elements.pop();
let writes=0;const snapshot=JSON.stringify(response.CrewMembers);
sandbox.window.imagetrend={currentVm:{currentIncidentReadOnlyStatus:false,requestData:async()=>({Scene:{Response:response}})},cookieHelper:{readCookie:()=> 'a'},FormComposer:{isReadOnly:()=>false},formComposer:{agencyResources:resources},runForm:{PresetValueViewModel:function(config,root){this.applyPresetValue=()=>{writes++;let obj=root;const parts=config.BindingPathFromOrigin.split('.');for(const part of parts.slice(0,-1))obj=obj[part];obj[parts.at(-1)]=config.Value;obj.NotValue=null;};}}};
(async()=>{await run(false);assert.equal(writes,0);await run(true);assert.equal(writes,2);assert.equal(JSON.stringify(response.CrewMembers),snapshot);await run(true);assert.equal(writes,2);sandbox.window.imagetrend.currentVm.currentIncidentReadOnlyStatus=true;await run(true);assert.equal(writes,2);assert.match(controls.get('#result').textContent,/CHART_NOT_EDITABLE/);console.log('PASS: independent membership, crew count, unknown identity, ambiguous credentials, scan-only, both native write paths, unchanged crew, repeat-run no-op, locked chart.');})().catch(e=>{console.error(e);process.exitCode=1;});
