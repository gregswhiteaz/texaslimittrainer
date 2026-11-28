# TASK-11.15: Make the report navigation tests robust on macOS keyboard settings and trim duplication

Status: Done pending user confirmation (not set by the Documentor) · Completed: 2026-11-27 · Epic: TASK-11 — Track progress over time · Milestone: m-1 · Requirements: n/a (test robustness follow-up from doc-139) · Branch: doit/TASK-11.15

## What was asked
`e2e/report-navigation.spec.ts` pressed `Alt+Tab` for every WebKit run, and its comment blamed WebKit in general. In fact WebKit on macOS skips buttons on plain Tab only when Full Keyboard Access (System Settings > Keyboard > Keyboard navigation) is off. Spec: doit/TASK-11.15/spec.md.
- AC#1: the Tab-order step passes on Linux CI and on macOS with or without Full Keyboard Access, uses Alt+Tab only where needed, and its comment states the macOS cause.
- AC#2 (added after Q-2): `back-focus`, `settings` and `error-recovery` e2e specs use the same `buttonTabKey` helper instead of hard-coded WebKit Alt+Tab, name the macOS cause in comments, and change no assertion.
- The original AC#2 (remove a duplicate placement check in `tests/ui/report-navigation.acceptance.test.tsx`) was dropped by the user. The file is unchanged.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The key is detected by a probe on a separate page in the same browser context, not by reading macOS settings or the user agent. | yes | Measures whether this browser instance tabs to a button. Leaves focus on the page under test alone. Needs no shell access. | Read `AppleKeyboardUIMode` from Node, or probe in-page and refocus. |
| A-2 | The helper prefers plain `Tab` and falls back to `Alt+Tab`. If neither reaches a button it throws. | yes | Meets "Alt+Tab only where needed". An unsupported setup fails loudly. | Always return Alt+Tab for WebKit. |
| A-3 | The helper lives in `e2e/support/keyboard.ts`, shared by all four specs. | yes | One place for the macOS explanation. | Inline the probe per file. |
| A-4 | The helper is browser-agnostic and also runs in Chromium, where it returns `Tab`. | yes | Removes the `browserName` branch entirely. | Keep `browserName === 'webkit' ? await buttonTabKey(page) : 'Tab'`. |

state.json records 0 assumptions logged; the four above are in spec.md section 2.

## Clarifications and decisions
- Q-1: Prove the "Full Keyboard Access off" case by toggling the macOS setting? Answer: no (recommended). No system settings were touched. The build was verified on this Mac with Keyboard navigation ON, plus Linux CI run 46089401147 (all four e2e shards green). The OFF case has not been run on a real Mac. It is covered only by the helper's injected fallback test (fake `reaches` function) and by reasoning about the Tab then Alt+Tab order.
- Q-2: Include `back-focus`, `settings` and `error-recovery` specs? Answer: yes. Added as the new AC#2. These are locked e2e files, edited under their owners (TASK-11.6, 12.10, 12.1, 12.2, 13.1) with no assertion changed. Counts stay report-navigation 30, back-focus 8, settings 22, error-recovery 41.
- D-1: The comments say "buttonTabKey holds Alt only then" instead of "picks Alt+Tab only then". The spec's own judge grep (no `Alt+Tab` or `browserName` in the four files) would otherwise fail. The comments still name macOS Full Keyboard Access as the cause.
- User decision: the original AC#2 was dropped, since deleting assertions from a locked test is refused by the safeguard and the check is harmless.

## What was built
- `e2e/support/keyboard.ts` (new): `chooseButtonTabKey(reaches)` returns `Tab`, else `Alt+Tab`, else throws. `buttonTabKey(page)` opens a probe page in the same context, loads a heading plus a button, focuses the heading, presses the key, checks that the active element is a BUTTON, and closes the probe in `finally`.
- `e2e/keyboard-helper.spec.ts` (new): a real-browser test (returned key reaches a button, page count and focus unchanged, Chromium gets Tab) and an injected fallback test.
- `e2e/report-navigation.spec.ts`, `back-focus.spec.ts`, `settings.spec.ts`, `error-recovery.spec.ts`: the browserName ternary became `await buttonTabKey(page)`. The comments name the macOS cause. Unused `browserName` was dropped, including the `expectErrorScreen` parameter, its six callers and five fixtures.
- No app code, config, CI or dependency changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `report-navigation.spec.ts` View statistics test | pass | judge round 1 |
| SPEC-02 (+02b) | AC#1 | `keyboard-helper.spec.ts` real-browser probe and injected fallback | pass | judge round 1 |
| SPEC-03 | AC#1, AC#2 | the five e2e files on chromium and webkit, plus CI | pass | 32 passed locally (Keyboard navigation ON, setting untouched); CI 46089401147 green |
| SPEC-04 | AC#2 | `back-focus.spec.ts` one Tab from Settings heading | pass | judge round 1 |
| SPEC-05 | AC#2 | `settings.spec.ts` every control reachable by Tab | pass | judge round 1 |
| SPEC-06 | AC#2 | `error-recovery.spec.ts` | pass | judge round 1 |
- Gates: build-1 and fix-2 pass: full `npm test && npm run e2e` (421 passed, 19 skipped), lint, typecheck, scope 126 of 130 lines.
- Judge round 1: PASS, 7/7, with no failed or unproven items. Integrity is clean and assertion counts are unchanged.
- Not run on a real Mac with Keyboard navigation OFF.

## Review
Round 1: code and security reviews found no BLOCKER or MAJOR items. Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- NIT, comment wording "holds Alt only then" differs from the spec's "picks Alt+Tab only then" in the four spec files. Intentional, see D-1.

## How to try it
`npx playwright test e2e/report-navigation.spec.ts e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/error-recovery.spec.ts e2e/keyboard-helper.spec.ts`

## Run metrics
Questions 2 · assumptions logged 4 (state.json counter 0) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 126 (budget 130) across 6 files.

## Known limitations and follow-ups
- The macOS Keyboard navigation OFF path is unverified on real hardware. Only the fake-page test covers it. [trainer] Optional: run the five e2e files once by hand with the setting off and note the result on TASK-11.15. Owner: TASK-11.15.
- The duplicate `tabOrder` helpers in report-navigation and settings were left unmerged. [trainer] Optional: move `tabOrder` into `e2e/support/keyboard.ts`. No owner task known.

## Lessons for the factory (proposals — not applied)
- The spec text quoted a literal `Alt+Tab` comment that conflicted with its own judge grep. Proposal: the spec template check that quoted wording does not contradict section 10 greps.
- state.json recorded 0 assumptions although spec.md has four. Proposal: have the spec step update the counter from the Assumptions table.
