# Gremlin Logic A15 0.2.4.16

## Safari / iPad bootstrap repair

- Broadened the userscript bootstrap scope to the ImageTrend Elite application so route matching cannot prevent A15 from starting its own recovery layer.
- Added an internal conservative route gate for `EmsRunForm` and `OfflineEmsRunForm`.
- Added bootstrap route healing for hash, history, and SPA route changes; when an unsupported Elite page transitions into a supported run form, A15 reloads once into the chart context.
- Specifically supports the iPad/Safari route shape `/Elite/<org>/RunForm/<agency>/OfflineEmsRunForm#/Incident...`.
- Clinical write behavior is unchanged; this patch only changes bootstrap/routing behavior.
