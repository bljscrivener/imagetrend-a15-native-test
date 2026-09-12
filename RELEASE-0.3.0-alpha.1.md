# Gremlin Logic A15 0.3.0-alpha.1

This is the first staged major-update layer for A15. It deliberately rides on the current 0.2.4.18 userscript while the native architecture is proven, so the existing workflow remains available during migration.

## Added

- Persistent versioned A15 profile in `localStorage`, separate from userscript source updates.
- Low-noise reconstruction/capability mapping with explicit opt-out and disclosure.
- Structural mapping only: binding/control metadata, native action names, and capability state. No arbitrary key logging and no reconstruction capture of narrative text, credentials, names, DOBs, addresses, or patient-entered scalar values.
- Capability fingerprinting and drift detection so ImageTrend UI/configuration changes can be noticed and remapped.
- Generic finding/rule registry with `info`, `warning`, and `critical` severities plus clickable mapped-field navigation.
- Clinical consistency rule feature gate. IV/IO route consistency is reserved but remains disabled until row ownership/scoping is verified against live maps.
- Native ImageTrend AI adapter that locates the auto-narrative handler behind `AI Generate Values` and can invoke it without depending on the button being rendered, but only when ImageTrend's own show/disable predicates say the action is available.
- A15 Help / Settings disclosure, reconstruction toggle, AI adapter toggle, diagnostics toggle, and experimental-rule toggle.
- Diagnostics view showing current mapping fingerprint, discovered controls, native actions, and capture time.

## Safety / update strategy

- A15 does not bypass ImageTrend read-only/offline/disabled AI gates.
- The major layer installs no `keydown` or `input` telemetry listeners.
- Existing A15 0.2.4.18 behavior remains the underlying workflow during this alpha.
- This is intentionally staged on the `a15-major-0.3` branch before replacing the production userscript on `main`.

## Next implementation tranche

1. Promote verified Field Investigator maps into the capability registry.
2. Implement row-scoped medication/procedure ownership for IV-vs-IO consistency checks.
3. Add severity-aware linked findings into the main A15 review flow.
4. Add verified saline-flush bundles with distinct IV and IO routes.
5. Add protocol-reference adapter once the protocol manual/source is acquired.
6. Migrate legacy click paths to native ImageTrend actions where the action map is proven.
