# TASK-12.1 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Create the settings store now (persisted format: DB tlh-trainer v4, store `settings`, defaults record under key 'settings', read-only readSettings())
Options: yes, as the task description says [Recommended]; defer to the first story that writes it.
**Answer: auto-accepted (recommended)** — create it. Additive upgrade (no existing data touched). Flag for review: persisted format.

## Q-2 — Home Settings entry subtitle (user-visible)
Options: "Speed, display, reset data" (storyboard) [Recommended]; "Trainer options and app version"; none.
**Answer: auto-accepted (recommended)**.

## Q-3 — What Settings shows now
Options: headings Play, Display, Your data (storyboard paragraph) + version line [Recommended]; only sections with content.
**Answer: auto-accepted (recommended)**.

## Q-4 — Version shown ("0.0.0" in package.json)
Options: keep 0.0.0, release numbering is E13 [Recommended]; bump to 0.1.0 now.
**Answer: auto-accepted (recommended)**.

## Q-5 — Locked tests from earlier stories (needed for AC#1, AC#5)
Unlocked with reason "TASK-12.1 Q-5": e2e/home.spec.ts (TASK-2.1); e2e/resume.spec.ts (TASK-2.6); tests/ui/screen-list.acceptance.test.ts (TASK-2.15, TASK-11.1); e2e/play-money.spec.ts (TASK-2.15, TASK-10.2, TASK-11.1). e2e/support/hand-records.ts and e2e/support/play-money.ts are not hook-locked. Update expected values; keep every check.
**Answer: auto-accepted (recommended)**.

## Block 1 — two more locked tests pin DB v3 / three stores
tests/storage/session-end.acceptance.test.ts (TASK-10.1): DB_VERSION 3 → 4, store names gain 'settings'. e2e/home-control.spec.ts (TASK-2.14): store names gain 'settings' (and its doc comment). Direct consequence of Q-1.
**Answer: auto-accepted (recommended)** — unlocked under owners; orchestrator edit; every check kept.
