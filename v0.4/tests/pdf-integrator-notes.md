# PDFIntegrator validation checklist

Live/browser checks before promotion:

- JPEG under direct-wrap thresholds produces a one-page PDF without source retention.
- Oversize JPEG is resized/compressed and remains legible for fine print/handwriting.
- PNG and WebP convert to JPEG-backed one-page PDF.
- Direct PDF input is preserved without unnecessary re-encoding.
- Generated PDF begins `%PDF-` and opens in Safari/Chrome/Edge/Android Chrome.
- Source image object is not stored in localStorage/IndexedDB/runtime diagnostics.
- `release(itemId)` removes the retained transaction PDF.
- Oversized final PDF sets `sizeWarning`.
- Same PDF blob/hash is passed to native AI and later attachment worker once native contracts are mapped.
