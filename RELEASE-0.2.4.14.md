# Gremlin Logic A15 0.2.4.14

Repair release for the routine interface, destination selection and existing assessment rows.

- Home: Go, baby, go; At Pt; Leaving Scene. Contextual progress, status and an issue link appear when relevant.
- Tools: preview, linked findings, help and Nukacharta. Settings: appearance/layout, with a collapsible Debugging section for logs, mappings, timeline and observation.
- Restored charcoal/purple branding. Timestamp buttons can be moved between Home and Tools using Settings → Arrange buttons; layout is saved locally and can be reset.
- Type of Destination matches the native label Hospital-Emergency Department, resolving the code through the current agency resources. Existing values remain preserved by the fill-blank rule.
- STEMI probable is excluded from A15 pending separate investigation.
- Assessment row detection accepts entry-opening handlers, excluding the Add/subform-selection handler that caused false ambiguity. First assessment uses patient contact, an existing second uses destination arrival, findings are preserved, and no second is created automatically.
- Timestamp shortcuts use the proven Timestamp Lab native picker source/writer when available, with editability, source/target and read-back checks. Existing timeline fallback remains available.
- Workflow observation now has View workflow steps, Copy workflow steps and Clear recorded steps with a plain-language explanation. It records field IDs/order in the tab, not entered values; nothing is sent automatically.
- Diagnostic export includes normalized issue reasons and timestamp outcomes, without exporting arbitrary native error text or chart values.

Validation: eight automated suites cover assessment creation/update and preservation, procedure inventory hydration and duplicate prevention, scene threshold, priority rules, native timestamp/fallback behavior, lock protection, direct Go, two-stage clearing, UI tabs, saved layout and visibility. Browser DOM inspection confirmed the native assessment entry and Add handlers. No chart Save or submit was performed for this release.

Limits: end-to-end live verification of this release remains necessary. Unresolved or ambiguous procedure choices remain reported; new clinical helper rules and transactional Undo are not part of this release. Nukacharta is not Undo. P3/P4/P5 service categories remain manual.
