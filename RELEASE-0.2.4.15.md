# Gremlin Logic 0.2.4.15

Timestamp integration repair: reuse an already-open native picker rather than focusing and clicking its date input again. Accept either Date or Time as the picker target for the selected pair. Pointer interaction with a shortcut preserves the input focus. If a picker needs opening, use one click without a preceding focus call.

Live inspection of the test chart confirmed both source times existed in the native picker, and that its focusedElement can identify the Time input. The previous run lost the picker context and fell back to the unavailable timeline reader.

Regression coverage verifies the open Time-targeted picker works for both shortcuts without clicking Date, plus locked-chart protection and the existing eight-suite regression set. No clinical defaults or clearing behavior changed.
