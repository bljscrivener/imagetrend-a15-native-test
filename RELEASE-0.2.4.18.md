# Gremlin Logic A15 0.2.4.18

## iPad Safari timestamp target recovery

- Timestamp shortcuts no longer depend on focusin alone.
- A15 remembers the last tapped/clicked/focused ImageTrend date-time pair before Safari moves focus into the native picker.
- If that cached target is lost, A15 attempts recovery from ImageTrend's native date-picker view model and then document.activeElement.
- Writes still require a live date/time pair on the same chart.
- Addresses repeated Focus the destination date/time field first failures on iPad Safari.
