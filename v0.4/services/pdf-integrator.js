(() => {
  'use strict';
  const core = window.GremlinA15Core04;
  if (!core) throw new Error('A15 Core 0.4 required');
  if (window.GremlinA15Pdf04) return;

  const VERSION = '0.4.0-dev.1';
  const retained = new Map();
  const DEFAULTS = Object.freeze({
    maxLongEdge: 2000,
    directJpegMaxLongEdge: 2200,
    directJpegMaxBytes: 1_300_000,
    targetBytes: 1_200_000,
    hardWarnBytes: 3_000_000,
    qualitySteps: [0.82, 0.74, 0.66],
    marginPt: 18
  });

  const ascii = s => new TextEncoder().encode(String(s));
  const concat = parts => {
    const n = parts.reduce((a,b)=>a+b.length,0);
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(p,o); o += p.length; }
    return out;
  };
  const sanitize = s => String(s || 'document').replace(/\.[^.]+$/,'').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'document';

  async function sha256(blob) {
    try {
      const d = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
      return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
    } catch { return null; }
  }

  function jpegInfo(bytes) {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i+1];
      i += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (i + 2 > bytes.length) break;
      const len = (bytes[i] << 8) | bytes[i+1];
      if (len < 2 || i + len > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return {
          height: (bytes[i+3] << 8) | bytes[i+4],
          width: (bytes[i+5] << 8) | bytes[i+6],
          components: bytes[i+7] || 3
        };
      }
      i += len;
    }
    return null;
  }

  async function decodeImage(blob) {
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(blob, { imageOrientation:'from-image' }).catch(()=>createImageBitmap(blob));
      return { width: bitmap.width, height: bitmap.height, draw: ctx => ctx.drawImage(bitmap,0,0), close: () => bitmap.close?.() };
    }
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.decoding = 'async';
      await new Promise((resolve,reject)=>{ img.onload=resolve; img.onerror=()=>reject(new Error('Image decode failed')); img.src=url; });
      return { width: img.naturalWidth, height: img.naturalHeight, draw: ctx => ctx.drawImage(img,0,0), close: () => {} };
    } finally { URL.revokeObjectURL(url); }
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encode failed')),type,quality));
  }

  async function normalizeToJpeg(source, opts) {
    const type = String(source.type || '').toLowerCase();
    const sourceBytes = new Uint8Array(await source.arrayBuffer());
    const sourceInfo = type === 'image/jpeg' || type === 'image/jpg' ? jpegInfo(sourceBytes) : null;
    if (sourceInfo) {
      const long = Math.max(sourceInfo.width, sourceInfo.height);
      if (source.size <= opts.directJpegMaxBytes && long <= opts.directJpegMaxLongEdge) {
        return { bytes: sourceBytes, ...sourceInfo, reencoded:false, sourceBytes:source.size };
      }
    }

    const decoded = await decodeImage(source);
    try {
      const scale = Math.min(1, opts.maxLongEdge / Math.max(decoded.width, decoded.height));
      let width = Math.max(1, Math.round(decoded.width * scale));
      let height = Math.max(1, Math.round(decoded.height * scale));
      let best = null;

      for (let pass = 0; pass < 2; pass++) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha:false });
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height);
        ctx.save(); ctx.scale(width/decoded.width,height/decoded.height); decoded.draw(ctx); ctx.restore();

        for (const q of opts.qualitySteps) {
          const blob = await canvasBlob(canvas,'image/jpeg',q);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const info = jpegInfo(bytes);
          best = { bytes, width, height, components:info?.components || 3, quality:q, reencoded:true, sourceBytes:source.size };
          if (blob.size <= opts.targetBytes) return best;
        }
        width = Math.max(1200, Math.round(width * 0.85));
        height = Math.max(1200, Math.round(height * 0.85));
      }
      return best;
    } finally { decoded.close(); }
  }

  function makePdf(jpeg, opts) {
    const portrait = jpeg.height >= jpeg.width;
    const pageW = portrait ? 612 : 792;
    const pageH = portrait ? 792 : 612;
    const m = opts.marginPt;
    const scale = Math.min((pageW-2*m)/jpeg.width,(pageH-2*m)/jpeg.height);
    const drawW = +(jpeg.width*scale).toFixed(3);
    const drawH = +(jpeg.height*scale).toFixed(3);
    const x = +((pageW-drawW)/2).toFixed(3);
    const y = +((pageH-drawH)/2).toFixed(3);
    const cs = jpeg.components === 1 ? '/DeviceGray' : (jpeg.components === 4 ? '/DeviceCMYK' : '/DeviceRGB');
    const content = ascii(`q\n${drawW} 0 0 ${drawH} ${x} ${y} cm\n/Im0 Do\nQ\n`);

    const parts = [new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,0x25,0xe2,0xe3,0xcf,0xd3,0x0a])];
    const offsets = [0];
    let pos = parts[0].length;
    const add = bytes => { parts.push(bytes); pos += bytes.length; };
    const obj = (n, bodyParts) => {
      offsets[n]=pos; add(ascii(`${n} 0 obj\n`));
      for (const p of bodyParts) add(typeof p === 'string' ? ascii(p) : p);
      add(ascii('\nendobj\n'));
    };

    obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2,['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
    obj(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`]);
    obj(4,[`<< /Length ${content.length} >>\nstream\n`,content,'endstream']);
    obj(5,[`<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.length} >>\nstream\n`,jpeg.bytes,'\nendstream']);

    const xref = pos;
    add(ascii('xref\n0 6\n0000000000 65535 f \n'));
    for (let i=1;i<=5;i++) add(ascii(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`));
    add(ascii(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
    return new Blob(parts,{type:'application/pdf'});
  }

  async function validatePdf(blob) {
    const head = new Uint8Array(await blob.slice(0,5).arrayBuffer());
    const ok = String.fromCharCode(...head) === '%PDF-';
    if (!ok) throw new Error('Generated PDF failed signature validation');
    return true;
  }

  async function prepare(source,{itemId,options={}}={}) {
    if (!(source instanceof Blob)) throw new Error('PDFIntegrator requires a Blob/File source');
    if (!itemId) throw new Error('itemId required');
    const opts = { ...DEFAULTS, ...options };
    let pdf;
    let converted = false;
    let sourceType = source.type || 'application/octet-stream';
    let imageMeta = null;

    if (source.type === 'application/pdf') {
      pdf = source;
      await validatePdf(pdf);
    } else if (/^image\/(jpeg|jpg|png|webp)$/i.test(source.type || '')) {
      const jpeg = await normalizeToJpeg(source,opts);
      pdf = makePdf(jpeg,opts);
      await validatePdf(pdf);
      converted = true;
      imageMeta = { width:jpeg.width,height:jpeg.height,reencoded:jpeg.reencoded,quality:jpeg.quality ?? null };
      // Source JPEG/image is intentionally not retained anywhere after this function returns.
    } else {
      throw new Error(`Unsupported source type: ${source.type || 'unknown'}`);
    }

    const name = `${sanitize(source.name || itemId)}.pdf`;
    const record = Object.freeze({
      itemId, blob:pdf, name, size:pdf.size, type:'application/pdf',
      sourceType, converted, imageMeta,
      sha256:await sha256(pdf),
      sizeWarning:pdf.size > opts.hardWarnBytes,
      createdAt:new Date().toISOString()
    });
    retained.set(itemId,record);
    core.emit('pdf-ready',{ itemId,name,size:record.size,converted,sizeWarning:record.sizeWarning });
    return record;
  }

  async function release(itemId) {
    retained.delete(itemId);
    core.emit('pdf-released',{itemId});
    return true;
  }

  const api = Object.freeze({ version:VERSION, prepare, get:itemId=>retained.get(itemId)||null, release, defaults:{...DEFAULTS} });
  core.registerService('pdf-integrator',api,{version:VERSION,state:'ready'});
  Object.defineProperty(window,'GremlinA15Pdf04',{value:api,configurable:false,writable:false});
  core.emit('pdf-integrator-ready',{version:VERSION});
})();
