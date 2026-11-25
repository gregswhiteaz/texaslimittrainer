# TASK-12.2 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Control type, placement, wording (user-visible)
Options: native checkbox "Show opponent styles at the table" in Display, ticked = shown, styled like the storyboard's checkbox [Recommended]; switch; radio group.
**Answer: auto-accepted (recommended)** — native checkbox.

## Q-2 — Locked TASK-12.1 test e2e/settings.spec.ts
Options: (rec) re-pin the control list AND measure the 44x44 rule on the control's label instead of the control; (alt) make the checkbox itself at least 44x44 so the existing size check stays as is, edits 1-3 only.
**Answer: auto-accepted — the alternative.** Measuring on the label would loosen a locked assertion, which doit never does. So: the checkbox's own box is at least 44x44 (visual box may stay 20x20 inside, but the input element's rendered size must pass the unchanged check); edits are 1) wait until enabled, 2) name controls by text or label, 3) expected list ['← Home', 'Show opponent styles at the table']. The 44x44 assertion is not changed. Unlocked under TASK-12.1.

## Q-3 — First write to the settings record
Options: writeSettings(settings) of the whole validated record on every change, durability strict, screen updates first, a failed save is logged [Recommended]; save on leaving Settings; patch-style update; undo on failure.
**Answer: auto-accepted (recommended)**.
