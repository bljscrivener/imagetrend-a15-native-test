# A15 0.4 build log

## 2026-09-12

- Branch created from `main`: `a15-0.4-async-runtime`.
- Async scheduler kernel added.
- EvidencePipeline workers added: PDF, AI, attachment, release.
- Native service contract split; unmapped file actions fail closed.
- Compact one-page PDFIntegrator implemented for PDF/JPEG/PNG/WebP with transient image handling.
- Known-good 0.3 execution bridged into 0.4 scheduler as a compatibility worker.
- Public app façade added.
- Toolbar-integrated A15 badge/progress/profile control added immediately before `AI Check` when discoverable.
- Single-install Tampermonkey dev loader added using `@sandbox raw`.
- Scheduler smoke fixture and PDF validation checklist added.

Live mapping still required for native PDF->AI handoff, AI-complete signal, Add Document handoff, and attachment verification.
