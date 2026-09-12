# A15 modular major-update stack

This directory is the development-stage replacement architecture for the monolithic Gremlin Logic A15 userscript. The existing production artifact remains unchanged until this stack passes live ImageTrend validation.

## Architectural boundary

A15 now has an explicit controller/skin boundary.

- `a15-control-center.user.js` is **headless**. It owns no DOM. It exposes the stable `window.GremlinA15` bridge (`getState()`, `subscribe()`, and `actions`).
- `a15-gui.user.js` is a **replaceable skin**. It may render controls, collect user intent, and display state, but it may only talk to the mechanism through `window.GremlinA15`.
- GUI code must not query ImageTrend fields, call Knockout, invoke `imagetrend.*`, or contain chart mutation logic.
- Mechanism modules must not depend on the GUI being present. A15 must remain operable headlessly for testing and future alternate skins.

This is a hard boundary, not a style preference. The GUI can be redesigned, replaced, minimized, or removed without changing the mechanism.

## Load order

1. `a15-runtime-core.user.js` — persistent profiles/settings, feature flags, module lifecycle, capability probes.
2. `a15-findings-engine.user.js` — reusable findings/severity engine and clickable field navigation.
3. `a15-reconstruction.user.js` — PHI-free structural field/action map with low-noise remapping.
4. `a15-compatibility-guard.user.js` — DISCOVERED / PASS / REVIEW / BLOCKED schema-drift state and last-known-good structural baseline.
5. `a15-safety-guard.user.js` — editability/busy/offline checks plus mutation-budget circuit breaker.
6. `a15-protected-fields.user.js` — quarantines known targets whose semantics are not yet safe for automation.
7. `a15-native-actions.user.js` — validated native ImageTrend actions exposed to the mechanism.
8. `a15-model-bridge.user.js` — field resolver and verified explicit write adapters.
9. `a15-clinical-logic.user.js` — saline-flush helper and reusable route/access consistency rule.
10. `a15-ai-bridge.user.js` — explicit bridge to ImageTrend's native AI Capture / AI Generate Values surfaces.
11. `a15-protocol-assist.user.js` — persistent declarative protocol packs; ships with no protocol content until a validated manual is ingested.
12. `a15-control-center.user.js` — headless application/controller bridge; publishes `window.GremlinA15`.
13. `a15-gui.user.js` — current iPad-friendly presentation skin; depends only on the public bridge.

`manifest.json` is the machine-readable dependency/load-order record.

## Public UI contract

The GUI-facing contract is intentionally small:

```js
window.GremlinA15 = {
  version,
  getState(),
  subscribe(listener),
  actions: {
    evaluate(),
    remap(),
    compatibilityCheck(),
    trustCurrentMap(),
    rollbackMap(),
    resetSafety(),
    openAiCapture(),
    generateAiValues(),
    prepareSalineFlush(route, doseMl),
    setReconstructionEnabled(enabled),
    setDiagnosticsEnabled(enabled),
    useProfile(id),
    createProfile(id, name),
    navigateToFinding(index),
    exportDiagnostics()
  }
};
```

New GUI features should expand this bridge only when the capability belongs to the mechanism. They should not reach around it to internal module globals.

## Hard safety invariants

- Never automatically Save, Post, Finish, Transfer, or submit a chart.
- Clinical/protocol writes require an explicit user action.
- A write must resolve its target without ambiguity and verify the resulting value.
- Uncertainty reduces capability. Structural drift can quarantine mutation paths.
- Reconstruction observes structure, not typing. It does not install a keylogger and does not persist narrative text, patient answers, measured values, patient names, DOBs, incident identifiers, or other chart content.
- IV and IO remain distinct administration routes.
- `Size of Procedure Equipment` (`14775b1d-c505-5161-b7c9-7c9ea3c56cc4`) is quarantined from protocol automation until its numeric semantics are validated. The former Adult/Pediatric categorical assumption is invalid.
- Native AI integration calls only ImageTrend's already-authorized native controls and only after explicit user action. No chart data is sent to a separate A15 AI service.

## Persistent state

The code and user state are deliberately separate. Updating module source must not erase user profiles or settings.

- Runtime/profile state: `gremlin.a15.runtime.v1`
- Structural reconstruction map: `gremlin.a15.reconstruction.v1`
- Compatibility baselines: `gremlin.a15.compatibility.v1`
- Protocol packs: `gremlin.a15.protocol-packs.v1`

No persistent store above is intended to contain patient chart values.

## Current validation state

The modular implementation is written, but it is **not yet promoted over the production A15 userscript**. Required next gate is live iPad/ImageTrend validation of module load order, bridge/GUI separation, resolver behavior, select/read-back behavior, saline-flush medication editing, findings navigation, profile persistence, reconstruction drift handling, and native AI invocation.

The protocol framework is complete as mechanism, but protocol content remains intentionally empty until a stable protocol manual is obtained and reviewed. Numeric procedure-equipment semantics also remain intentionally unresolved and quarantined.
