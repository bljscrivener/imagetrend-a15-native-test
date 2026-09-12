(() => {
  'use strict';
  const core=window.GremlinA15Core04;
  if(!core) throw new Error('A15 Core 0.4 required');
  if(window.GremlinA15Contracts04) return;

  const unavailable = name => async () => { throw new Error(`${name} is not mapped/validated yet`); };

  // Contract-first placeholders. These intentionally fail closed until GFI supplies validated native contracts.
  const imageTrendNative = Object.freeze({
    version:'0.4.0-dev.1',
    ingestPdf:unavailable('ImageTrend native PDF AI ingest'),
    verifyAiComplete:unavailable('ImageTrend AI completion verifier'),
    attachPdf:unavailable('ImageTrend native Add Document'),
    verifyAttachment:unavailable('ImageTrend attachment verifier')
  });

  // PDF service accepts an already-good PDF without transformation. Image conversion is deliberately not implemented
  // until acquisition behavior is validated; source images must remain transient and must never be persisted.
  const retained=new Map();
  const pdfIntegrator=Object.freeze({
    version:'0.4.0-dev.1',
    async prepare(source,{itemId}={}) {
      if(!(source instanceof Blob)) throw new Error('PDFIntegrator requires a Blob/File source');
      if(source.type !== 'application/pdf') throw new Error('Transient image-to-PDF adapter not implemented yet');
      if(!itemId) throw new Error('itemId required');
      const head=new Uint8Array(await source.slice(0,5).arrayBuffer());
      if(String.fromCharCode(...head) !== '%PDF-') throw new Error('invalid PDF signature');
      const record={ blob:source, name:source.name || `${itemId}.pdf`, size:source.size, type:'application/pdf', itemId };
      retained.set(itemId,record);
      return record;
    },
    get(itemId){ return retained.get(itemId) || null; },
    async release(itemId){ retained.delete(itemId); return true; }
  });

  core.registerService('imagetrend-native',imageTrendNative,{version:imageTrendNative.version,state:'unmapped'});
  core.registerService('pdf-integrator',pdfIntegrator,{version:pdfIntegrator.version,state:'partial'});

  const api=Object.freeze({version:'0.4.0-dev.1'});
  Object.defineProperty(window,'GremlinA15Contracts04',{value:api,configurable:false,writable:false});
  core.emit('service-contracts-ready',{version:api.version});
})();
