(() => {
  'use strict';
  const app=window.GremlinA15App04;
  const core=window.GremlinA15Core04;
  if(!app || !core) throw new Error('A15 0.4 app/core required');
  if(document.getElementById('gremlin-a15-toolbar-04')) return;

  const VERSION='0.4.0-dev.2';
  const HOST_ID='gremlin-a15-toolbar-04';
  const OLD_GUI_ID='gremlin-a15-gui';
  let host=null, shadow=null, oldGuiHidden=false, lastCompleteAt=0;

  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const visible=el=>{ const r=el?.getBoundingClientRect?.(); const cs=el?getComputedStyle(el):null; return !!r&&r.width>0&&r.height>0&&cs?.display!=='none'&&cs?.visibility!=='hidden'; };

  function findAiCheck(){
    const bottom=document.querySelector('#bottom-pane') || document.body;
    const candidates=[...bottom.querySelectorAll('button,a,li,[role="button"],span,div')]
      .filter(el=>visible(el) && ['AI Check','AI ✓'].includes(norm(el.textContent)) && !el.closest(`#${HOST_ID}`));
    candidates.sort((a,b)=>{
      const rank=x=>/^(BUTTON|A|LI)$/.test(x.tagName)||x.getAttribute('role')==='button'?0:1;
      return rank(a)-rank(b) || (a.getBoundingClientRect().width*a.getBoundingClientRect().height)-(b.getBoundingClientRect().width*b.getBoundingClientRect().height);
    });
    return candidates[0]||null;
  }

  function anchorFor(ai){
    if(!ai) return null;
    return ai.closest('button,a,li,[role="button"]') || ai;
  }

  // Cosmetic skin only: preserve ImageTrend's native element, bindings, icon and click handler.
  // Replace only the visible text node, and keep the full semantic label for accessibility.
  function compactAiCheck(anchor){
    if(!anchor || anchor.dataset.gremlinAiCheckCompact==='1') return false;
    const walker=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(norm(node.nodeValue)==='AI Check'){
        const raw=String(node.nodeValue||'');
        const lead=raw.match(/^\s*/)?.[0]||'';
        const trail=raw.match(/\s*$/)?.[0]||'';
        node.nodeValue=`${lead}AI ✓${trail}`;
        anchor.dataset.gremlinAiCheckCompact='1';
        if(!anchor.getAttribute('aria-label')) anchor.setAttribute('aria-label','AI Check');
        if(!anchor.getAttribute('title')) anchor.setAttribute('title','AI Check');
        return true;
      }
    }
    return false;
  }

  function hideOldGui(hide=true){
    const old=document.getElementById(OLD_GUI_ID);
    if(!old) return false;
    old.style.display=hide?'none':'';
    oldGuiHidden=hide;
    return true;
  }

  function toggleOldGui(){
    const old=document.getElementById(OLD_GUI_ID);
    if(!old) return;
    hideOldGui(!oldGuiHidden);
  }

  function mount(){
    if(document.getElementById(HOST_ID)) return true;
    const ai=findAiCheck();
    if(!ai) return false;
    const anchor=anchorFor(ai);
    if(!anchor?.parentElement) return false;
    compactAiCheck(anchor);

    host=document.createElement('span');
    host.id=HOST_ID;
    host.setAttribute('data-a15-version',VERSION);
    host.style.cssText='display:inline-flex;align-items:center;vertical-align:middle;min-width:96px;height:58px;margin:0 6px;position:relative;z-index:3;';
    shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML=`
      <style>
        :host{all:initial}*{box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}
        .wrap{height:58px;display:flex;align-items:center;gap:7px;color:#22313f;white-space:nowrap}
        .ring{--p:0;--track:#6b7280;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;padding:3px;background:conic-gradient(#22d3ee calc(var(--p)*1turn),var(--track) 0);box-shadow:0 0 0 1px #0002;transition:background .16s linear}
        .btn{position:relative;width:42px;height:42px;border:0;border-radius:50%;background:#101820;color:#d9faff;font-weight:900;font-size:14px;letter-spacing:.2px;display:grid;place-items:center;box-shadow:inset 0 0 0 1px #ffffff12;cursor:pointer;padding:0}
        .btn:disabled{opacity:.55;cursor:default}.lamp{position:absolute;width:9px;height:9px;border-radius:50%;right:6px;top:7px;background:#64748b;box-shadow:0 0 0 1.5px #101820,0 0 5px currentColor}
        .lamp.green{background:#22c55e;color:#22c55e}.lamp.yellow{background:#eab308;color:#eab308}.lamp.red{background:#ef4444;color:#ef4444}.lamp.gray{background:#64748b;color:#64748b}
        .profile{border:0;background:transparent;padding:3px 2px;color:#263746;font-size:12px;font-weight:750;line-height:1.05;max-width:92px;overflow:hidden;text-overflow:ellipsis;cursor:pointer;text-align:left}.profile small{display:block;font-size:9px;font-weight:600;color:#667788;margin-top:2px}
        .tip{position:absolute;bottom:55px;left:0;background:#111827;color:#fff;border:1px solid #475569;border-radius:7px;padding:6px 8px;font:10px system-ui;box-shadow:0 5px 20px #0005;display:none;min-width:145px}.wrap:hover .tip{display:none}
      </style>
      <div class="wrap" title="A15 0.4 scheduler control">
        <div class="ring" id="ring"><button class="btn" id="run" type="button"><span>A15</span><i class="lamp gray" id="lamp"></i></button></div>
        <button class="profile" id="profile" type="button">Default<small id="sub">0.4</small></button>
        <div class="tip" id="tip"></div>
      </div>`;
    anchor.parentElement.insertBefore(host,anchor);
    shadow.getElementById('run').addEventListener('click',runA15);
    shadow.getElementById('profile').addEventListener('click',toggleOldGui);
    hideOldGui(true);
    render(app.state());
    return true;
  }

  function stateColor(s){
    const jobs=s.jobs||[];
    const hasError=jobs.some(j=>j.state==='error'||j.state==='blocked');
    const safety=s.legacyState?.safety;
    if(hasError || safety?.suspended || safety?.compatibilityAllowed===false) return 'red';
    if(jobs.some(j=>j.state==='running'||j.state==='queued')) return 'yellow';
    if(s.legacyAvailable) return 'green';
    return 'gray';
  }

  function progressValue(s){
    const jobs=s.jobs||[];
    const active=jobs.filter(j=>!['complete','error','blocked','canceled'].includes(j.state));
    if(active.length){
      const ids=new Set(active.map(j=>j.pipelineId).filter(Boolean));
      const related=ids.size?jobs.filter(j=>ids.has(j.pipelineId)):active;
      return related.reduce((n,j)=>n+(j.progress||0),0)/Math.max(1,related.length);
    }
    const recentComplete=jobs.some(j=>j.state==='complete');
    if(recentComplete && Date.now()-lastCompleteAt<1200) return 1;
    return 0;
  }

  function render(s){
    if(!shadow) return;
    const p=Math.max(0,Math.min(1,progressValue(s)));
    shadow.getElementById('ring').style.setProperty('--p',String(p));
    const lamp=shadow.getElementById('lamp');
    lamp.className=`lamp ${stateColor(s)}`;
    const profile=s.legacyState?.profile?.name || s.legacyState?.profile?.id || 'Default';
    shadow.getElementById('profile').childNodes[0].nodeValue=profile;
    const running=(s.jobs||[]).some(j=>j.state==='running'||j.state==='queued');
    const run=shadow.getElementById('run');
    run.disabled=!s.legacyAvailable || running;
    const agg=s.aggregate||{};
    shadow.getElementById('sub').textContent=running?`${Math.round((agg.progress||0)*100)}%`:'0.4';
    host?.setAttribute('data-a15-state',stateColor(s));
    host?.setAttribute('data-a15-progress',String(p));
  }

  function runA15(){
    try { app.run(); }
    catch(err){ core.emit('toolbar-error',{message:String(err?.message||err)}); render(app.state()); }
  }

  app.subscribe(render);
  core.on('job-completed',()=>{ lastCompleteAt=Date.now(); render(app.state()); setTimeout(()=>render(app.state()),1300); });

  if(!mount()){
    const obs=new MutationObserver(()=>{ if(mount()) obs.disconnect(); });
    obs.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>obs.disconnect(),20000);
  }

  const api=Object.freeze({version:VERSION,remount:()=>mount(),showLegacy:()=>hideOldGui(false),hideLegacy:()=>hideOldGui(true)});
  Object.defineProperty(window,'GremlinA15Toolbar04',{value:api,configurable:false,writable:false});
  core.emit('toolbar-ready',{version:VERSION});
})();
