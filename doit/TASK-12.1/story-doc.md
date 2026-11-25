# TASK-12.1: Open Settings from Home and see the app version

Status: Done · Completed: 2026-11-25 · Epic: TASK-12 — Tune the trainer · Milestone: m-1 · Requirements: REQ-002.3, REQ-050.5, REQ-050.6, REQ-057.1, REQ-057.2, REQ-057.4, REQ-061.1 · Branch: doit/TASK-12.1

## What was asked
Home gets a `Settings` entry. It opens a Settings screen with a `← Home` control, the heading, the storyboard sections (Play, Display, Your data) and a `Version <x>` line taken from `package.json`. The screen joins the play-money screen list and walk. This first slice also creates the local settings store with the REQ-050 defaults. No controls yet: those are TASK-12.2 and 12.4-12.9. Spec: doit/TASK-12.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Persisted format: DB `tlh-trainer` v4 adds object store `settings`. Key `'settings'` holds the defaults record (rapid, auto-open review on, opponent styles on, four-colour off, banter on), written by the v4 upgrade step. | Hard once users have v4 | Task says this slice creates the store. | New DB version that drops the store. |
| Q-2 | Home subtitle: "Speed, display, reset data". | yes | Storyboard text. | Edit `HomeScreen.tsx`. |
| Q-3 | Settings shows h2 Play, Display, Your data (with the "stored only in this browser" paragraph) and the version line. | yes | Storyboard. | Edit `SettingsScreen.tsx`. |
| Q-4 | Version shows `Version 0.0.0`. `package.json` is not bumped. | yes | Release numbering belongs to E13. | Change `version`. |
| Q-5 + Block 1 | Locked tests edited to add the new entry only, every check kept: `e2e/home.spec.ts`, `e2e/resume.spec.ts`, `e2e/play-money.spec.ts`, `tests/ui/screen-list.acceptance.test.ts`, plus `tests/storage/session-end.acceptance.test.ts` and `e2e/home-control.spec.ts` (DB v4, store names). | no (done) | Direct consequence of AC#1, AC#5 and Q-1. | n/a |
| A-1 | `onSettings` is an optional `HomeScreen` prop, last menu entry. | yes | Same as `onStatistics`; keeps locked Home tests unchanged. | Always render. |
| A-2 | Settings pushes no browser-history entry. | yes | Only the Table does. | Push one. |
| A-3 | Settings h1 gets focus on open. `← Home` returns focus to Home's h1. | yes | Same as Statistics. | n/a |
| A-4 | Version is a Vite `define` constant `__APP_VERSION__`, read as `APP_VERSION`. | yes | Avoids bundling all of `package.json`. | Env var. |
| A-5 | Settings model in `src/table/settings.ts` (headless). IndexedDB part in `hand-store.ts`. | yes | Mirrors `session-record.ts`. | Move files. |
| A-6 | `readSettings()` gives defaults if no record. An invalid record rejects with `RangeError('Invalid settings: <field>')`. | yes | Same as `getSession`. | Silent fallback. |
| A-7 | e2e DB helpers open at v4 and mirror the v4 step. | yes | Opening at v3 after upgrade fails with `VersionError`. | n/a |
| A-8 | The e2e test uses `Alt+Tab` in WebKit. | yes | Existing pattern. | n/a |

## Clarifications and decisions
Q-1..Q-5 and Block 1 were auto-accepted at the recommended option (autopilot); see doit/TASK-12.1/qa.md. D-6: the dialog detector regex now also reads `role={'dialog'}`, `role={"alertdialog"}` and a template literal. It is a small regex change, not an AST parse.

## What was built
- `src/ui/settings/SettingsScreen.tsx` (new): header (`← Home`, h1), three labelled sections, version line.
- `src/ui/app-version.ts` (new): `APP_VERSION`, `versionText(v)`. `vite.config.ts` injects the version through `define`.
- `src/ui/home/HomeScreen.tsx`, `src/ui/App.tsx`, `src/ui/styles.css`: Settings entry, `settings` route, styles.
- `src/table/settings.ts` (new): `Settings`, frozen `DEFAULT_SETTINGS`, `parseSettings`, `SettingsReader`.
- `src/storage/hand-store.ts`: `DB_VERSION = 4`, `SETTINGS_STORE`, `SETTINGS_KEY`, v4 upgrade step, `readSettings()`. Nothing in the app reads settings yet.
- Play-money: `settings` in `e2e/support/screen-list.ts`, detector regex in `e2e/support/play-money.ts`, walk step.
- Docs: new `docs/storage/settings.md`; updated `docs/ui/navigation.md`, `docs/ui/play-money.md`, `docs/storage/hand-records.md`, `sessions.md`, `reports.md` (the last two were stale at v3).
- New tests: `tests/ui/home-settings.acceptance.test.tsx`, `settings.acceptance.test.tsx`, `dialog-detector.acceptance.test.ts`, `tests/table/settings.test.ts`, `tests/storage/settings-store.test.ts`, `e2e/settings.spec.ts`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 03, 04, 08, 09, 11, 12, 13 | Home entry, version, route list, detector, store, upgrade, validation | Vitest | Pass | judge/round-1.json |
| SPEC-02, 05, 06, 07, 10, 14 | Open, back, keyboard, 44x44, axe, same origin, walk, Home menu | Playwright, Chromium and WebKit | Pass | judge/round-1.json |
| SPEC-15, 16, 17 | Lint, typecheck, docs, no engine change | Commands and manual | Pass | gates/build-1.json |

- `npm test`: 1397 passed, 46 skipped (opt-in). `src/table` 98.69% lines. Lint and typecheck clean. Full e2e: 332 passed, 18 skipped, 0 failed.
- Judge round 1: PASS 17/17. The judge ran a real upgrade. A v3 profile with real hands, sessions and a report was opened by the branch build in both browsers. It reached v4, all old records were byte-identical, and the defaults record was present. A reload kept v4.
- No failed items, no send-backs.

## Review
One review round (code and security). No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code), judge J-1-02: the upgrade unit test checks the defaults only through `readSettings`. It should assert the raw record.
- Judge J-1-01: in Chromium the first Tab from the Settings or Statistics heading leaves the page, because `← Home` comes before the h1 in the DOM. The second Tab reaches it. WebKit needs one `Alt+Tab`.
- NIT (security): no `onblocked` handler for a blocked upgrade. Pre-existing, no data loss.
- NIT: the dialog regex gives a false positive on `role={dialog}` and misses conditional roles.
- NIT: `docs/ui/play-money.md:64` has a broken wrap.
- NIT: `.settings-section` copies `.panel` without a comment.
- NIT: the locked session-end test name still says "upgrades to v3".
- Scope: 31 files against a budget of 25. The reviewer judged it justified (locked-test and stale-doc edits).

## How to try it
`npm run dev`, then Home, then Settings. It shows `Version 0.0.0`. Tab to `← Home` and press Enter. Checks: `npm test`, `npm run e2e -- e2e/settings.spec.ts`.

## Run metrics
Questions 5 (+ Block 1) · assumptions 8 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 4332 insertions, 92 deletions across 61 files (including doit artifacts).

## Known limitations and follow-ups
- [trainer] Assert the raw default record in the v3 upgrade test (`tests/storage/settings-store.test.ts`). Owner: TASK-12.1 follow-up, or fold into TASK-12.5.
- [trainer] Put `← Home` after the h1, or accept the extra Tab, on Settings and Statistics (J-1-01). Owner: TASK-12.2.
- [trainer] Nothing reads settings yet. TASK-2.11 and TASK-12.5 must call `readSettings()` and add a write API.
- [trainer] Add an `onblocked` handler for blocked upgrades. Owner: TASK-13 (storage versioning), if one exists.
- Not tracked (infra, below the value bar): dialog regex edge cases, the `play-money.md` wrap, the `.settings-section` comment, the stale test name. None caused a failure.

## Lessons for the factory (proposals — not applied)
- Spec Step 3 could grep for tests that pin the DB version or store names (`session-end.acceptance`, `home-control`). They surfaced only as Block 1 during the build.
