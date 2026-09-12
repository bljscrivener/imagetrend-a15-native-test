(() => {
  'use strict';
  const core = window.GremlinA15Core04;
  if (!core) throw new Error('A15 Core 0.4 required');
  if (window.GremlinA15LegacyCompat04) return;

  const VERSION='0.4.0-dev.1';
  const bridge = () => window.GremlinA15 || null;

  const service = Object.freeze({
    version:VERSION,
    available(){ return !!bridge()?.getState && !!bridge()?.actions?.goBabyGo; },
    state(){ try { return bridge()?.getState?.() || null; } catch { return null; } },
    async goBabyGo(){
      const b=bridge();
      if(!b?.actions?.goBabyGo) throw new Error('Known-good A15 0.3 bridge unavailable');
      return b.actions.goBabyGo();
    },
    async review(){
      const b=bridge();
      if(!b?.actions?.reviewExecution) throw new Error('Known-good A15 0.3 review unavailable');
      return b.actions.reviewExecution();
    },
    subscribe(fn){
      const b=bridge();
      if(!b?.subscribe) return () => {};
      return b.subscribe(fn);
    }
  });

  core.registerService('legacy-a15',service,{version:VERSION,state:'compatibility-bridge'});

  core.registerWorker({
    id:'legacy-run-finger', version:VERSION, resources:['chart-mutation','legacy-execution'],
    async run(job,ctx){
      const legacy=ctx.service('legacy-a15');
      ctx.progress(.05,'legacy-starting');
      const result=await legacy.goBabyGo();
      ctx.progress(1,'legacy-complete');
      return result;
    }
  });

  core.registerWorker({
    id:'legacy-review-finger', version:VERSION, resources:['legacy-execution'],
    async run(job,ctx){
      const legacy=ctx.service('legacy-a15');
      ctx.progress(.1,'reviewing');
      const result=await legacy.review();
      ctx.progress(1,'review-complete');
      return result;
    }
  });

  const api=Object.freeze({
    version:VERSION,
    run(){ return core.submit({worker:'legacy-run-finger',pipelineId:'legacy-active',stage:'legacy',priority:10}); },
    review(){ return core.submit({worker:'legacy-review-finger',pipelineId:'legacy-active',stage:'review',priority:10}); },
    state:()=>service.state(),
    available:()=>service.available()
  });

  Object.defineProperty(window,'GremlinA15LegacyCompat04',{value:api,configurable:false,writable:false});
  core.emit('legacy-compat-ready',{version:VERSION,available:service.available()});
})();
