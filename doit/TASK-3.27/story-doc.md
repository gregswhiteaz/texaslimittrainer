# TASK-3.27: Make the Rapid-pace 400 ms self-test deterministic in WebKit

Status: In review (judge pending) · Completed: 2026-11-21 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: n/a (follow-up of TASK-3.13 SPEC-02) · Branch: doit/TASK-3.27

## What was asked
`e2e/rapid-pace.spec.ts::the paused-clock pace check catches a 400 ms wait` failed once in WebKit on main CI #155 (the meter returned `null`, "a bot is to act"). The task guessed that the 50 ms start-up slices let bot actions finish before metering began. Make the test deterministic: AC#1 = 50 consecutive passes per browser locally, one green CI run, and the mutants; AC#2 (rewritten in Q-1) = 1 ms start-up steps until the deal shows, exactly two blinds posted and seat 3 to act, and the meter returns a time for the last bot before the user even if its reply lands between checks. Spec: doit/TASK-3.27/spec.md.

Real root cause (the start-up hypothesis was refuted by reproduction): a check-order race in `meterBotAction`. When the metered bot is the last one before the user's turn, its worker reply can land between the helper's `actionCount` read and its "user's turn / hand over" read, so it returned `null` for a bot action that did happen. The CI error-context snapshot confirms both bots Folded and You "To act". The same race could silently drop samples in the every-push guard test.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The AC's mutant (`RAPID_BOT_DELAY_MS = 400`) targets the every-push guard test; the self-test passes under it by design (it expects >= 400). A second mutant (drop the self-test's `setTimeout` stretch) proves the self-test has teeth. | yes | Same mutant TASK-3.13's judge used on the guard; self-test asserts `>= 400`. | Treat the self-test as the mutant target (impossible as written) |
| A-2 | No permanent regression test for the race; proof is the ordering argument plus a one-off stress run with injected worker latency. | yes | A deterministic repro needs an injected worker delay: a stress harness, slow on every push. | Add opt-in jittered-worker spec `e2e/rapid-pace-meter.spec.ts` |
| A-3 | The 50x runs use `-g "paused"` (both paused-clock tests) in both projects. | yes | Both use the changed helper. | Self-test only |

## Clarifications and decisions
- Q-1: user chose (a): reorder the helper's checks; 1 ms start-up steps until the deal shows; assert exactly 2 blinds and seat 3 to act. The old AC#1 was replaced in Backlog.
- Q-2: user approved the strengthen-only edit to `e2e/rapid-pace.spec.ts` (locked by TASK-3.13). Unlock recorded under TASK-3.13.
- D-1: move the worker-post check before the `null` return (smallest change, exact by ordering proof). D-2: 1 ms start-up steps capped at 2 000 fake ms, exact assertions. D-3: keep pinned words `[0x9e3779b9, 1, 2, 3]` and the 2-sample self-test (3 bots before the user is impossible in hand 1).

## What was built
Only `e2e/rapid-pace.spec.ts` changed (7 insertions, 5 deletions; gate counted 12 lines; no `src/` or dependency changes):
- `meterBotAction` checks `workerPosts > posts` before deciding it is the user's turn / hand over; doc comment updated. Signature and return meanings unchanged.
- The 400 ms self-test start-up advances the clock `runFor(1)` until the deal shows (cap 2 000 fake ms), then asserts `actionCount` is exactly `2` (was `> 0`) and seat 3's row shows `To act`. No assertion removed or loosened.

## How it was verified
Judge: see doit/TASK-3.27/judge/.
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | meter never returns null for the last pre-user bot | self-test + stress | pass | stress WebKit, injected worker delay 0–4000 hops, `--repeat-each 30`: fixed order 30/30; old order 23 pass / 7 fail, all "a bot is to act" |
| SPEC-02 | start-up stops at deal, 2 blinds, seat 3 to act | self-test | pass | build-log |
| SPEC-03 | guard meters every bot action | guard test | pass | build-log |
| SPEC-04 | 50 passes per browser | `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project chromium --project webkit --repeat-each 50` | 200/200 passed | build-log; CI run URL to be recorded after the orchestrator pushes (pending) |
| SPEC-05 | mutants | temporary edits, reverted | pass | M1 (`RAPID_BOT_DELAY_MS = 400`): guard fails in both projects ("101 ms", cap 100), self-test passes (A-1). M2 (stretch dropped): self-test fails in both (`expected >= 400, received 1`), guard passes |
- Gates: build-1 PASS, fix-2 PASS. `npm run format` no changes, lint and typecheck clean, `npm test` 548 passed / 7 skipped, `npm run e2e` 130 passed / 12 skipped.
- Self-test duration +0.4–1.0 s per project (chromium 2.4→2.8 s, webkit 3.3→4.3 s), under the 10 s limit.

## Review
Round 1: code reviewer 0 blocking; security clean.

### Non-blocking review notes (deliberately not fixed)
- MINOR: no committed test fails if the reorder is reverted (accepted by A-2; opt-in SLOW-flag harness possible later).
- NIT: the 2 000 start-up cap is a bare literal.

## How to try it
`npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project webkit --repeat-each 50 --reporter=line`

## Run metrics
Questions 2 · assumptions 3 · review rounds 1 · judge rounds 0 at time of writing · gate runs 2 · escalations 0 · changed lines 12 (1 file).

## Known limitations and follow-ups
- Not tracked (infra, below the value bar): permanent regression harness for the race (MINOR) and naming the 2 000 cap (NIT). Both are test-harness polish and neither caused a failure.
- The guard's own start-up loop can in theory lose seat 3's sample but cannot fail (8 samples vs minimum 5).
- CI run URL for AC#1 must be recorded after push.

## Lessons for the factory (proposals — not applied)
- The task's root-cause hypothesis was wrong; for flaky-test tasks, have the spec step reproduce and check CI error-context artifacts before fixing the hypothesised cause (done here, and it caught it).
