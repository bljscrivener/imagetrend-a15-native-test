(() => {
  'use strict';
  const core=window.GremlinA15Core04;
  if(!core) throw new Error('A15 Core 0.4 required');
  const results=[];
  const assert=(name,ok,detail='')=>results.push({name,ok:!!ok,detail});

  core.registerWorker({id:'smoke-fast',version:'1',resources:['smoke-a'],run:async(job,ctx)=>{ctx.progress(.5,'half');await new Promise(r=>setTimeout(r,20));ctx.progress(1,'done');return{ok:true};}});
  core.registerWorker({id:'smoke-after',version:'1',resources:['smoke-b'],run:async()=>({ok:true})});
  const a=core.submit({worker:'smoke-fast',pipelineId:'smoke'});
  const b=core.submit({worker:'smoke-after',pipelineId:'smoke',dependsOn:[a]});

  const done=new Promise(resolve=>{
    const off=core.on('*',()=>{
      const ja=core.getJob(a), jb=core.getJob(b);
      if(['complete','error','blocked','canceled'].includes(ja?.state)&&['complete','error','blocked','canceled'].includes(jb?.state)){
        off();
        assert('dependency-first',ja.state==='complete',JSON.stringify(ja));
        assert('dependent-completes',jb.state==='complete',JSON.stringify(jb));
        assert('aggregate-complete',core.aggregate('smoke').complete===2,JSON.stringify(core.aggregate('smoke')));
        resolve(results);
      }
    });
  });
  window.GremlinA15Smoke04=done;
})();
