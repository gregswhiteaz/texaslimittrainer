# TASK-13.1 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Error screen wording (user-visible)
Options: heading "Something went wrong"; sentence "The app hit an unexpected problem. Every completed hand is saved, and a paused session resumes from its last completed hand."; button "Return Home" [Recommended]; shorter sentence; "Unexpected error" heading.
**Answer: auto-accepted (recommended)**.

## Q-2 — Session on an error
Options: write nothing, end nothing — session stays after its last completed hand, unfinished hand dropped, Home shows Resume (matches REQ-004.2, AC#2/#3) [Recommended]; end and show report; store a partial hand.
**Answer: auto-accepted (recommended)**.

## Q-3 — Logging / telemetry
Options: one local console.error per error screen, nothing stored or sent [Recommended]; local IndexedDB error log; nothing.
**Answer: auto-accepted (recommended)**.
