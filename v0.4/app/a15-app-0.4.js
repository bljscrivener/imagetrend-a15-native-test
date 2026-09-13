(() => {
  'use strict';
  const core=window.GremlinA15Core04;
  if(!core) throw new Error('A15 Core 0.4 required');
  if(window.GremlinA15App04) return;

  const VERSION='0.4.0-dev.2';
  const listeners=new Set();
  const snapshot=()=>({
    version:VERSION,
    legacyAvailable:!!window.GremlinA15LegacyCompat04?.available?.(),
    clinicalAvailable:!!window.GremlinA15LegacyCompat04?.clinicalAvailable?.(),
    legacyState:window.GremlinA15LegacyCompat04?.state?.() || null,
    jobs:core.listJobs(),
    aggregate:core.aggregate(),
    native:core.service('imagetrend-native',false)?.probe?.() || null
  });
  const publish=()=>{ const s=snapshot(); listeners.forEach(fn=>{try{fn(s)}catch{}}); };
  core.on('*',publish);
  try { window.GremlinA15?.subscribe?.(()=>publish()); } catch {}

  const api=Object.freeze({
    version:VERSION,
    state:snapshot,
    subscribe(fn){ listeners.add(fn); try{fn(snapshot())}catch{}; return()=>listeners.delete(fn); },
    run(){ if(!window.GremlinA15LegacyCompat04?.available?.()) throw new Error('A15 0.3 execution bridge unavailable'); return window.GremlinA15LegacyCompat04.run(); },
    review(){ if(!window.GremlinA15LegacyCompat04?.available?.()) throw new Error('A15 0.3 execution bridge unavailable'); return window.GremlinA15LegacyCompat04.review(); },
    prepareSalineFlush(route,doseMl){
      if(!window.GremlinA15LegacyCompat04?.clinicalAvailable?.()) throw new Error('A15 clinical saline-flush helper unavailable');
      return window.GremlinA15LegacyCompat04.prepareSalineFlush(route,doseMl);
    },
    enqueueSource(source,options={}){
      if(!window.GremlinA15Evidence04?.enqueue) throw new Error('EvidencePipeline unavailable');
      return window.GremlinA15Evidence04.enqueue(source,options);
    },
    async prepareOnly(source,options={}){
      const pdf=core.service('pdf-integrator');
      const itemId=options.itemId || `preview-${Date.now()}`;
      return pdf.prepare(source,{itemId,options:options.pdfOptions||{}});
    },
    releasePrepared:itemId=>core.service('pdf-integrator').release(itemId),
    progress:pipelineId=>core.aggregate(pipelineId)
  });

  Object.defineProperty(window,'GremlinA15App04',{value:api,configurable:false,writable:false});
  core.emit('app-ready',{version:VERSION});
})();
