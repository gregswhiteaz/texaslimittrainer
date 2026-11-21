# TASK-3.23: Tighten the card visual checks and keep the Linux baselines current

Status: Done · Completed: 2026-11-20 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: n/a (follow-up from the TASK-3.20 review) · Branch: doit/TASK-3.23

## What was asked
Close a gap in the card containment check: a rank or suit part with no `<path>` was silently passed, so a vanished glyph was never reported. Also document in the README what to do when a Dependabot `@playwright/test` bump changes rendering and turns `Visual` red. Spec: doit/TASK-3.23/spec.md.

Scope change: the original AC#2 (delete the duplicate inline logo decode from the locked `e2e/cards.spec.ts`) was **dropped by the user** (Q-1) after Claude Code's permission safeguard refused to delete assertions from a locked test. The duplicate check stays; it is harmless. The old AC#3 became AC#2. The SPEC-02 id is retired.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A part is reported when its group has zero `<path>`s (this also covers a missing group). The report string stays `"<card> <part>"`. | yes | One guard covers both cases and leaves the existing expected arrays unchanged. | Add a separate "missing" message. |
| A-2 | The mutation test removes all paths from `Qs` rank and the whole `3h` suit group, and expects `['3h suit', 'Qs rank']`. | yes | Covers both "no path" shapes. The other cards guard against false positives. | Use a single mutant. |
| A-3 | The README check lives in `tests/ci/visual-workflow.test.ts` (not locked). | yes | That file already owns the Visual workflow checks. | Move it to a new acceptance file. |

## Clarifications and decisions
- D-1: strengthen-only edit of `e2e/cards.spec.ts` (locked by TASK-3.20 and TASK-3.5), auto-accepted under autopilot. One guard and one test were added. No assertion was removed or loosened.
- D-2: AC#2 is met with a README paragraph, not a workflow that regenerates baselines (that would need `contents: write` and a bot commit).
- Q-1 (escalation, user, 2026-11-20): the safeguard refused removing the duplicate logo-decode assertions from the locked test. The user chose to drop that AC and keep the check.

## What was built
- `e2e/cards.spec.ts` — in `partsOutsideCard`, the push condition became `paths.length === 0 || leaves`. New test `containment check reports a part with no path`.
- `README.md` — a paragraph in `### Card visual baselines`. When a Dependabot `@playwright/test` bump makes `Visual` red, run `gh workflow run visual.yml --ref <branch> -f update=true` on that branch, follow the download/copy steps, and push the new `*-linux.png` files before merging.
- `tests/ci/visual-workflow.test.ts` — `README explains regenerating baselines after a Playwright bump`.
- 3 files, 29 insertions and 1 deletion. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | e2e `containment check reports a part with no path`, plus the existing containment tests | pass | The test failed before the fix in Chromium and WebKit (`Received []`) and passed after. |
| SPEC-03 | AC#2 | unit `README explains regenerating baselines after a Playwright bump` | pass | The test fails if the paragraph is removed. |

- Format, lint and typecheck passed. `npm test`: 106 files, 371 passed, 6 skipped. `npm run e2e`: 98 passed (cards.spec.ts 20).
- Gate runs: 1. Judge: round 1, PASS, no unproven AC.

## Review
Round 1, code and security. No BLOCKER or MAJOR findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: two of the three README test assertions (`@playwright/test` and the `gh workflow run` command) already matched the README before this change. Only `Dependabot` depends on the new paragraph. The test still fails if the paragraph is removed. This is test-harness only and would not cause a real failure.
- NIT: `changes.md` carried a stale "SPEC-02 NOT done" note. It was corrected after withdrawal (Q-1).

## How to try it
`npm run e2e -- e2e/cards.spec.ts` and `npm test`.

## Run metrics
Questions: 1 · assumptions: 3 logged in the spec · review rounds: 1 · judge rounds: 1 · gate runs: 1 · escalations: 1 · changed lines: +29/-1.

## Known limitations and follow-ups
- The duplicate inline logo decode remains in `card back shows the decoded TLH logo` (accepted, Q-1).
- Not tracked (infra, below the value bar): tightening the README unit test to inspect only the new paragraph. It is test-harness only and would not cause a real failure.

## Lessons for the factory (proposals — not applied)
- [factory] Specs must not plan deletions of assertions from locked tests. The permission safeguard refuses them, and this run spent an escalation on it. Where a locked test needs cleanup, drop the item or have the user make the edit.
