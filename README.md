## Gremlin Logic 0.2.4.18

[Install / update](https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/imagetrend-a15-native-test.user.js) · [Release notes](RELEASE-0.2.4.18.md)

# imagetrend-a15-native-test
Experimental ImageTrend A15 native userscript test distribution

## Supported environments

### iPad Safari — supported

A15 has been verified running on iPad Safari in the ImageTrend Elite `OfflineEmsRunForm` route using a Safari userscript environment.

Verified on-device behavior includes:

- userscript injection and A15 UI launch
- A15 apply pass execution
- access to the ImageTrend page/native runtime
- patient-time shortcut with diagnostic outcome `VERIFIED`
- iPad/Safari-specific timestamp target recovery added in 0.2.4.18

A15 boots at the ImageTrend Elite application scope and performs its own internal run-form validation so `EmsRunForm` and `OfflineEmsRunForm` route differences do not prevent startup.

**Compatibility status:** first-class supported target, but still subject to ImageTrend agency/form differences and userscript-host limitations. A15 remains fail-closed for writes it cannot safely verify.

### Desktop browsers

Modern Chromium-family browsers and Firefox remain expected targets when used with a compatible userscript manager. Internet Explorer is not supported.

## Troubleshooters

**[Install Gremlin Crew Auditor](https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-crew-auditor.user.js)** · [Instructions](troubleshooters/README.md#crew-auditor-010) · [View code](troubleshooters/gremlin-crew-auditor.user.js)

Standalone crew-membership checks and provider-credential reconciliation for procedures and medications. One medication correction was user-verified live; integration into A15 remains future work.

**[Install Gremlin Timestamp Lab](https://raw.githubusercontent.com/bljscrivener/imagetrend-a15-native-test/main/troubleshooters/gremlin-timestamp-lab.user.js)** · [Instructions](troubleshooters/README.md) · [View code](troubleshooters/gremlin-timestamp-lab.user.js)

A small, separate diagnostic userscript for testing native timestamp behavior before integrating changes into A15. Both At Pt and Leaving Scene were reported working flawlessly by the user on a test chart on 2026-09-10. This does not establish compatibility with every agency or form.
