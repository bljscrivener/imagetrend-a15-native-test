// ==UserScript==
// @name         GFI Export Current Hotfix
// @namespace    local.gremlin.investigator
// @version      0.1.0
// @description  Fixes stale GFI export/share handoff by binding each export to the currently rendered capture.
// @match        http://*/*
// @match        https://*/*
// @updateURL    https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gfi-export-current-hotfix.user.js
// @downloadURL  https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gfi-export-current-hotfix.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const HOST_ID = 'gremlin-universal-investigator';
  const PATCH_MARK = 'data-gfi-export-current-hotfix';
  let lastExportedCaptureId = null;

  const slug = value => String(value || 'gfi-capture')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'gfi-capture';

  function readCurrentCapture(shadow) {
    const pre = shadow?.querySelector('pre');
    if (!pre) return null;
    const text = pre.textContent || '';
    if (!text.trim() || text.trim() === '{}') return null;
    try {
      const parsed = JSON.parse(text);
      return parsed?.header?.captureId ? parsed : null;
    } catch {
      return null;
    }
  }

  function filenameFor(capture) {
    const h = capture.header || {};
    const base = slug(h.friendlyName || h.captureType || 'gfi-capture');
    const time = String(h.capturedAt || new Date().toISOString()).replace(/[:.]/g, '-');
    const id = slug(h.captureId || 'no-id');
    return `${base}-${time}-${id}.txt`;
  }

  function textFor(capture) {
    const h = capture.header || {};
    return [
      'GFI NORMALIZED CAPTURE',
      `Schema: ${h.schemaVersion || 'gfi.capture/1'}`,
      `Investigator: ${h.investigatorVersion || ''}`,
      `Capture: ${h.captureType || ''}`,
      `Capture-ID: ${h.captureId || ''}`,
      `Captured: ${h.capturedAt || ''}`,
      `Page: ${h.page?.title || document.title || ''}`,
      `Origin: ${h.page?.origin || location.origin}`,
      '',
      '--- JSON ---',
      JSON.stringify(capture, null, 2)
    ].join('\n');
  }

  function makeFile(capture) {
    const filename = filenameFor(capture);
    const text = textFor(capture);
    return {
      filename,
      text,
      file: new File([text], filename, { type: 'text/plain', lastModified: Date.now() })
    };
  }

  async function exportCurrent(shadow, { share = false, allowRepeat = false } = {}) {
    // Critical invariant: resolve the capture from GFI's currently rendered JSON
    // at the exact moment the user taps Export/Share. No File, Blob, filename, or
    // capture reference is retained from an earlier export.
    const capture = readCurrentCapture(shadow);
    if (!capture) return { ok: false, reason: 'empty' };

    const captureId = capture.header.captureId;
    if (!allowRepeat && captureId === lastExportedCaptureId) {
      return { ok: false, reason: 'duplicate', captureId };
    }

    const { filename, text, file } = makeFile(capture);

    if (share && typeof navigator.share === 'function') {
      try {
        if (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `GFI ${capture.header.captureType || 'capture'}`,
            text: `GFI capture ${captureId}: ${filename}`
          });
          lastExportedCaptureId = captureId;
          try { await navigator.clipboard?.writeText(`${filename}\n${captureId}`); } catch {}
          return { ok: true, reason: 'shared', captureId, filename };
        }
      } catch (error) {
        if (error?.name === 'AbortError') return { ok: false, reason: 'cancelled', captureId };
        console.warn('[GFI export hotfix] Native share failed; falling back to download.', error);
      }
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.documentElement.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    try { await navigator.clipboard?.writeText(`${filename}\n${captureId}`); } catch {}
    lastExportedCaptureId = captureId;
    return { ok: true, reason: 'downloaded', captureId, filename, bytes: text.length };
  }

  function setStatus(shadow, message) {
    const node = shadow?.querySelector('.status');
    if (node) node.textContent = message;
  }

  function replaceButtonHandler(button, handler) {
    if (!button || button.dataset.gfiExportHotfix === '1') return;
    // Replace the node so any old property/listener closure that retained a stale
    // capture cannot fire. Then attach exactly one fresh handler.
    const fresh = button.cloneNode(true);
    fresh.dataset.gfiExportHotfix = '1';
    button.replaceWith(fresh);
    fresh.addEventListener('click', handler, { capture: true });
  }

  function patchHost(host) {
    const shadow = host?.shadowRoot;
    if (!shadow || host.hasAttribute(PATCH_MARK)) return false;

    const exportCurrentButton = shadow.querySelector('#export-current');
    const shareButton = shadow.querySelector('#share-page, #share-current, #share-file');
    if (!exportCurrentButton && !shareButton) return false;

    if (exportCurrentButton) {
      replaceButtonHandler(exportCurrentButton, async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const r = await exportCurrent(shadow, { share: false });
        if (r.ok) setStatus(shadow, `Exported ${r.captureId} as ${r.filename}.`);
        else if (r.reason === 'duplicate') setStatus(shadow, `Already exported ${r.captureId}. Capture a new target first.`);
        else setStatus(shadow, r.reason === 'empty' ? 'Capture something first.' : `Export ${r.reason}.`);
      });
    }

    if (shareButton) {
      replaceButtonHandler(shareButton, async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const r = await exportCurrent(shadow, { share: true });
        if (r.ok) setStatus(shadow, `Shared ${r.captureId} as ${r.filename}.`);
        else if (r.reason === 'duplicate') setStatus(shadow, `Already shared ${r.captureId}. Capture a new target first.`);
        else if (r.reason === 'cancelled') setStatus(shadow, 'Share cancelled.');
        else setStatus(shadow, r.reason === 'empty' ? 'Capture something first.' : `Share ${r.reason}.`);
      });
    }

    const clear = shadow.querySelector('#clear');
    if (clear && clear.dataset.gfiExportHotfixReset !== '1') {
      clear.dataset.gfiExportHotfixReset = '1';
      clear.addEventListener('click', () => { lastExportedCaptureId = null; }, { capture: true });
    }

    host.setAttribute(PATCH_MARK, '0.1.0');
    console.info('[GFI export hotfix] Current-capture export guard installed.');
    return true;
  }

  function install() {
    const host = document.getElementById(HOST_ID);
    if (host && patchHost(host)) return;

    const observer = new MutationObserver(() => {
      const h = document.getElementById(HOST_ID);
      if (h && patchHost(h)) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // GFI may already exist but finish rendering later.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const h = document.getElementById(HOST_ID);
      if (h && patchHost(h)) {
        clearInterval(timer);
        observer.disconnect();
      } else if (tries > 120) {
        clearInterval(timer);
        observer.disconnect();
      }
    }, 250);
  }

  install();
})();
