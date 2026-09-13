(() => {
  'use strict';
  const core = window.GremlinA15Core04;
  if (!core) throw new Error('A15 Core 0.4 required');
  if (window.GremlinA15Contracts04) return;

  const unavailable = name => async () => { throw new Error(`${name} is not mapped/validated yet`); };

  // Native adapter contract. Read-only capability inspection is available now; mutating/file actions
  // deliberately fail closed until GFI produces a validated signature + verification contract.
  const imageTrendNative = Object.freeze({
    version: '0.4.0-dev.2',
    probe() {
      const it = window.imagetrend;
      const vm = window.imagetrend?.currentVm || window.currentVm || null;
      return {
        route: location.pathname,
        formComposer: !!it?.formComposer,
        knockout: !!window.ko?.contextFor,
        aiAssistModal: typeof window.openAIAssistModal === 'function' || typeof vm?.openAIAssistModal === 'function',
        autoNarrative: !!it?.formComposer?.controlHandlers?.autoNarrative,
        runFormAttachments: !!vm?.runFormAttachmentsVm,
        incidentAttachments: !!vm?.incidentAttachmentsVm,
        capturedAt: new Date().toISOString()
      };
    },
    ingestPdf: unavailable('ImageTrend native PDF AI ingest'),
    verifyAiComplete: unavailable('ImageTrend AI completion verifier'),
    attachPdf: unavailable('ImageTrend native Add Document'),
    verifyAttachment: unavailable('ImageTrend attachment verifier')
  });

  core.registerService('imagetrend-native', imageTrendNative, {
    version: imageTrendNative.version,
    state: 'read-only-probe/native-file-actions-unmapped'
  });

  const api = Object.freeze({ version: '0.4.0-dev.2' });
  Object.defineProperty(window, 'GremlinA15Contracts04', { value: api, configurable: false, writable: false });
  core.emit('service-contracts-ready', { version: api.version, native: imageTrendNative.probe() });
})();
