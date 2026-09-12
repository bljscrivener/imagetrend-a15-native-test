# Gremlin Logic A15 — 0.2.4.19 development audit

Date: 2026-09-12

## Architecture change: GUI divorced from mechanism

This change establishes a hard presentation/mechanism boundary in the modular A15 stack.

### Changed

- `modules/a15-control-center.user.js`
  - Converted from a DOM-owning UI module into a headless controller.
  - Exposes the stable `window.GremlinA15` bridge.
  - Provides state, subscriptions, and user-action commands without rendering UI.
  - Continues to route commands to findings, reconstruction, compatibility, safety, native AI, clinical logic, diagnostics, profiles, and settings.

- `modules/a15-gui.user.js`
  - Added as the first replaceable A15 skin.
  - Uses only `window.GremlinA15`.
  - Does not query ImageTrend controls, call Knockout, invoke `imagetrend.*`, or own chart mutation logic.
  - Displays the active profile beneath the A15 control surface.

- `modules/manifest.json`
  - Control center updated to v0.2.0.
  - GUI skin added after the control-center in load order.
  - Architectural boundary recorded as a rollout invariant.

- `modules/README.md`
  - Documents the public bridge contract and hard GUI/mechanism separation rule.

## Boundary rule

The GUI is now considered disposable presentation. Mechanism modules must function without it, and future skins must consume the public bridge rather than internal module globals or ImageTrend DOM APIs.

## Not yet changed

The legacy production monolithic userscript remains unchanged in this commit. The modular stack still requires live ImageTrend/iPad validation before it replaces the production artifact.
