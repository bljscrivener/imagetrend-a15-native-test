# A15 0.4 — asynchronous native runtime (development)

This tree is intentionally separate from the working 0.3 modular/Chicken Fetcher deployment.

## Load order

1. `core/a15-core-0.4.js`
2. `services/service-contracts.js`
3. `services/pdf-integrator.js`
4. `services/legacy-compat.js`
5. `pipelines/evidence-pipeline.js`
6. `app/a15-app-0.4.js`
7. `ui/a15-toolbar-0.4.js`

`a15-0.4-dev.user.js` loads that stack in one Tampermonkey page context using `@sandbox raw`.

## What works now

- Core scheduler, dependencies, locks, cancellation, progress, checkpoints, event bus.
- Known-good 0.3 execution can be dispatched through a 0.4 `chart-mutation` job.
- A15 toolbar mounts next to the native `AI Check` control when discoverable, displays active profile, scheduler progress ring, and runtime status lamp. Clicking the profile toggles the existing 0.3 control surface for settings/review.
- PDFIntegrator accepts PDF directly and converts transient JPEG/PNG/WebP images into a compact one-page PDF without retaining the source image. Generated PDFs are signature-validated, hashed when WebCrypto is available, and held only for the active transaction.
- EvidencePipeline job graph exists: PDF -> native AI -> attachment -> release. Native AI concurrency starts at 1 while attachment uses its own resource lock.

## Intentionally fail-closed / not mapped yet

The following ImageTrend contracts are placeholders and throw until live GFI evidence validates them:

- PDF/file handoff to native ImageTrend AI.
- deterministic native-AI completion signal.
- native Add Document/file attachment invocation.
- deterministic attachment identity/completion verification.

Do not replace these placeholders with guessed DOM clicks or arbitrary function invocation.

## Safety invariants

- 0.3 remains the rollback/known-good mechanism.
- Core coordinates; workers perform domain operations; GUI is presentation only.
- No unrestricted native function executor.
- Manual user chart interaction has priority over automated chart mutation.
- One source capture -> one compact PDF. Source JPEG/image is transient only.
- Same PDF is used for ImageTrend AI and chart attachment; no second scan.
- Save/Post/Finish/submit remain manual.
