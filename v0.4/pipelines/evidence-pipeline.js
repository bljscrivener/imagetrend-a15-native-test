(() => {
  'use strict';
  const core = window.GremlinA15Core04;
  if (!core) throw new Error('A15 Core 0.4 required');
  if (window.GremlinA15Evidence04) return;

  const VERSION='0.4.0-dev.1';
  const uid = p => `${p}-${crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  // Local preparation finger. Production PDF service will accept PDF directly or convert a transient image.
  core.registerWorker({
    id:'pdf-finger', version:VERSION, resources:['local-pdf'],
    async run(job,ctx) {
      const pdf=ctx.service('pdf-integrator');
      ctx.progress(.05,'preparing-pdf');
      const result=await pdf.prepare(job.payload?.source,{ signal:ctx.signal, itemId:job.itemId });
      ctx.progress(1,'pdf-ready');
      return result;
    }
  });

  // Native AI is intentionally serialized by the native-ai resource lock.
  core.registerWorker({
    id:'ai-finger', version:VERSION, resources:['native-ai'],
    async run(job,ctx) {
      const native=ctx.service('imagetrend-native');
      const pdfJob=core.getJob(job.payload.pdfJobId);
      if (!pdfJob?.result) throw new Error('PDF dependency result unavailable');
      ctx.progress(.05,'ai-queued');
      const receipt=await native.ingestPdf(pdfJob.result,{ signal:ctx.signal, itemId:job.itemId, onProgress:p=>ctx.progress(p,'ai-processing') });
      await native.verifyAiComplete(receipt,{ signal:ctx.signal });
      ctx.progress(1,'ai-complete');
      return receipt;
    }
  });

  core.registerWorker({
    id:'attach-finger', version:VERSION, resources:['attachment'],
    async run(job,ctx) {
      const native=ctx.service('imagetrend-native');
      const pdfJob=core.getJob(job.payload.pdfJobId);
      if (!pdfJob?.result) throw new Error('PDF dependency result unavailable');
      ctx.progress(.05,'attaching');
      const receipt=await native.attachPdf(pdfJob.result,{ signal:ctx.signal, itemId:job.itemId, onProgress:p=>ctx.progress(p,'attaching') });
      await native.verifyAttachment(receipt,{ signal:ctx.signal });
      ctx.progress(1,'attached');
      return receipt;
    }
  });

  core.registerWorker({
    id:'release-finger', version:VERSION,
    async run(job,ctx) {
      const pdf=ctx.service('pdf-integrator');
      await pdf.release(job.itemId);
      ctx.progress(1,'released');
      return { released:true };
    }
  });

  function enqueue(source, options={}) {
    const pipelineId=options.pipelineId || uid('evidence');
    const itemId=options.itemId || uid('doc');
    const pdfJob=core.submit({ worker:'pdf-finger', pipelineId,itemId,stage:'captured',payload:{source},priority:20 });
    const aiJob=core.submit({ worker:'ai-finger', pipelineId,itemId,stage:'ai-queued',payload:{pdfJobId:pdfJob},dependsOn:[pdfJob],priority:30 });
    // Attachment follows verified AI completion but uses a separate lock and can overlap with AI for another item.
    const attachJob=core.submit({ worker:'attach-finger', pipelineId,itemId,stage:'attachment-queued',payload:{pdfJobId:pdfJob,aiJobId:aiJob},dependsOn:[aiJob],priority:40 });
    const releaseJob=core.submit({ worker:'release-finger', pipelineId,itemId,stage:'release',payload:{pdfJobId:pdfJob},dependsOn:[attachJob],priority:90 });
    return { pipelineId,itemId,jobs:{pdfJob,aiJob,attachJob,releaseJob} };
  }

  const api=Object.freeze({ version:VERSION, enqueue, progress:pipelineId=>core.aggregate(pipelineId) });
  Object.defineProperty(window,'GremlinA15Evidence04',{value:api,configurable:false,writable:false});
  core.emit('evidence-pipeline-ready',{version:VERSION});
})();
