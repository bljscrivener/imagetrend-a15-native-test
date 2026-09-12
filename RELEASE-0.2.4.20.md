# Gremlin Logic A15 — 0.2.4.20 audit note

Date: 2026-09-12

## Purpose

Complete the next GUI/mechanism separation step without rewriting the validated production executor.

## Changes

- Added `modules/a15-legacy-execution-bridge.user.js`.
  - Transitional, headless adapter over the production monolith's existing `Preview A15 changes` and `Go, baby, go` execution path.
  - Exposes `review()`, `executeReviewed()`, and `goBabyGo()` through `window.GremlinA15LegacyExecution`.
  - Suppresses the duplicate legacy GUI after the execution controls are detected.
  - Does not Save, Post, Finish, Transfer, or submit the chart.
- Updated `modules/a15-control-center.user.js` to v0.3.0 / bridge v1.1.0.
  - Remains DOM-free.
  - Adds execution state and `actions.goBabyGo()` / `actions.reviewExecution()` to the stable public bridge.
- Updated `modules/a15-gui.user.js` to v0.2.0.
  - Circular A15 orb now has one job only: Go Baby Go.
  - Loaded profile remains directly beneath the orb.
  - Profile-name click opens the secondary/settings surface.
  - GUI still contains no ImageTrend resolver, Knockout, or chart mutation code.
- Updated module manifest and README to make the transitional execution adapter and skin contract explicit.

## Architecture after this change

`ImageTrend -> production execution mechanism -> transitional legacy execution adapter -> headless control-center -> window.GremlinA15 -> replaceable GUI skin`

The transitional adapter is intentionally disposable. Once the modular executor reaches functional parity, the adapter can be replaced beneath `window.GremlinA15.actions.goBabyGo()` without changing the GUI.

## Validation gate

Live ImageTrend/iPad validation is still required before calling this cutover complete. Specifically verify:

1. Legacy A15 chrome is suppressed after load.
2. A15 orb is enabled only when the legacy executor is available.
3. Orb click performs the same review+apply path as the existing production controls.
4. Existing conflict/review behavior still fails closed.
5. Profile-name click opens settings and does not execute A15.
6. Chart Save/submit remains entirely manual.
