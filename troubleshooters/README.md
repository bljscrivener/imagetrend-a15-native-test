# Gremlin troubleshooters

## Timestamp Lab 0.1.0

[Install the userscript](https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-timestamp-lab.user.js)

Open the install link with Tampermonkey enabled, install as a separate script, and refresh your test chart. If the browser displays source instead, copy the entire file into a new Tampermonkey script and save. Do not replace the A15 script with this lab.

1. Open ImageTrend's native date/time picker for the field you want to change.
2. Click **Inspect target** in the small Time Lab panel.
3. Click **At Pt** or **Leaving Scene**.
4. Confirm the date/time shown by ImageTrend. **Copy log** exports result codes without chart values.

The lab uses the active native picker's target observable and response-time object. It does not open Times or depend on A15's remembered field target. It never calls chart Save; native subscriptions may persist changes immediately.

Both buttons were user-confirmed working on a test chart. Controlled tests also covered already-correct values, missing source times, locked charts, and a closed picker. Live verification is still required for other configurations and midnight cases.

Before changing a timestamp, the lab stores the previous value and chart/target identity locally in this tab's sessionStorage under `gremlin-time-lab-before`. The next write replaces it. This capture is not included in Copy log and is not an implemented Undo.

Use only the lab's controls for the experiment; avoid simultaneous A15 runs. Hide restores a small launch button. Disable or remove this separate script in Tampermonkey when finished.

No compilation is required. Edit the single userscript and run `node --check troubleshooters/gremlin-timestamp-lab.user.js` for a syntax check. Keep experiments focused; procedure scanning is a proposed next experiment and is not included here.
