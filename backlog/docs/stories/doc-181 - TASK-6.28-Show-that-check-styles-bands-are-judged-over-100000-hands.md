---
id: doc-181
title: 'TASK-6.28: Show that --check-styles bands are judged over 100,000 hands'
type: other
created_date: '2026-11-27T07:14:00Z'
updated_date: '2026-11-27T07:14:00Z'
---
# TASK-6.28: Show that --check-styles bands are judged over 100,000 hands

Status: Done (pending user confirmation) · Completed: 2026-11-27 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027, REQ-027.5 · Branch: doit/TASK-6.28

## What was asked
REQ-027 judges each bot style's VPIP, PFR and aggression over a 100,000-hand Mixed 6-max run. Neither `npm run playtest -- --help` nor `docs/stats/style-stats.md` said so. Short `--check-styles` runs (2,000 hands) failed from sample noise and looked like tuning problems (TASK-6.24). Acceptance: (1) help says the bands are judged over 100,000 hands, (2) the docs say so and explain the sample-noise failures, (3) no scale check is added to `npm test` or CI. Spec: doit/TASK-6.28/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Docs paragraph quotes the TASK-6.24 2,000-hand numbers (Rock VPIP 7.7–7.9% vs 8%, TAG PFR 13.7–13.9% vs 14%, Rock aggression 56.1–56.2% vs 55%). | yes | Makes "near a band edge" concrete. | Delete the example sentence. |
| A-2 | Docs AC is verified by a `grep -c` command plus manual reading, not a new test that reads markdown. | yes | No test reads `docs/stats/*.md` today. | Add a doc-reading unit test. |
| A-3 | Help text stays one line, so `USAGE.split('\n')[4]` keeps its shape. | yes | Every option note is one line. | Split the line and shift indexes. |

Autopilot auto-accepted, flagged for your review:
- Q-1 (wording of the help line and docs paragraph) was accepted as written.
- Q-2 (no runtime note for runs under 100,000 hands) was accepted as recommended.

## Clarifications and decisions
- Q-1: exact wording, auto-accepted as recommended (D-1).
- Q-2: no runtime note, auto-accepted as recommended (D-2). A printed note would change run output that locked tests pin. `check-styles.acceptance.test.ts` expects `Bot results:` right after `Style check: passed`. It also follows TASK-6.24's decision to document rather than warn.

## What was built
Documentation and help text only. CLI behaviour, bands, exit codes and run output are unchanged.
- `src/playtest/cli.ts` — the `--check-styles` line in `USAGE` now ends: "; the bands are judged over 100,000 hands (REQ-027), so shorter runs can fail from sample noise". Usage errors reprint it too.
- `tests/playtest/cli.test.ts` — the full-`USAGE` assertion and the `usage[4]` assertion use the new wording.
- `docs/stats/style-stats.md` — "In the playtest CLI" gains a paragraph. It gives the 100,000-hand fit-criterion command, the two noise causes (a rare mixed spot used only one way, and a stat near a band edge landing just outside it), the TASK-6.24 examples, and advice to confirm a short-run failure with a 100,000-hand run.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | unit, full `USAGE` assertion | pass | `npm test` |
| SPEC-02 | AC#1, AC#3 | unit, `usage[4]` assertion | pass | `npm test` |
| SPEC-03 | AC#1 | `npm run playtest -- --help \| grep …` | pass | 1 match |
| SPEC-04 | AC#2 | `grep -c` of 3 phrases, plus manual reading | pass | prints 3 |
| SPEC-05 | AC#3 | `npm test`, plus no change to `package.json`, `.github` or acceptance/perf tests, and no 100000+ `--hands` added | pass | gates/fix-2.json |
- `npm test`: 338 files passed (9 skipped), 1516 tests passed (57 skipped). Lint and typecheck clean.
- Gates: 2 runs (build, fix), both PASS. Judge round 1: PASS, no unproven AC.

## Review
Round 1: code review had no blocking findings, and security review had none (static text only).

### Non-blocking review notes (deliberately not fixed)
- NIT `docs/stats/style-stats.md:84`: the source line wrap is shorter than the surrounding ~120-column paragraphs. The builder re-wrapped it so the line-based SPEC-04 `grep -c` counts 3 instead of 2. The words and rendered Markdown are identical.

## How to try it
- `npm run playtest -- --help` shows the new `--check-styles` line.
- `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` runs the judged check.

## Run metrics
Questions: 2 (auto-accepted) · assumptions: 3 · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · changed lines: 13 (3 files).

## Known limitations and follow-ups
- Short runs still fail with no in-run warning, by decision D-2. If this keeps confusing people, a "run is shorter than 100,000 hands" note before the `Style check:` line could be reconsidered. It would need the locked acceptance test updated. [trainer] No existing task owns it, so it is optional and not needed now.
- The short-run failure causes (rare mixed spots, Rock/TAG band-edge floors) are documented, not fixed.

## Lessons for the factory (proposals — not applied)
- When a spec verifies docs with line-based `grep -c`, the spec's wrapped text can fail the check (this run needed a re-wrap, flagged as a NIT). Proposal: spec template guidance to use `grep -o … | wc -l`, or to give matching phrases that fit on separate lines.
