# TASK-3.13: Play at Rapid bot pace

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-3 · Milestone: m-1 · Requirements: REQ-011.1, REQ-024.3, REQ-024.6 · Branch: doit/TASK-3.13

## What was asked
At Rapid speed a bot action shows within 300 ms of the previous action, at 6-max and at 10-max (also after the user folds). 200 hands finish in under 60 minutes with the fixed 1.5 s between-hands delay counted. A test must fail if an artificial wait is added. Rapid was already the only speed and bots already ran on the next macrotask, so the story is mostly proof plus a guard. Spec: doit/TASK-3.13/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Rapid bot wait is the named constant `RAPID_BOT_DELAY_MS = 0`, read via `botActionDelayMs(speed)`; the hook's bot timer uses it. Deal step keeps literal 0. | yes | One place says "Rapid adds no wait"; TASK-3.18 can add Realistic there. | Put the literal back |
| A-2 | Scripted user: Fold if legal, else Check; if Hand Review opens, wait 1.5 s then Deal next hand. | yes | Review auto-open can't be disabled until E12; waiting keeps the 1.5 s gap in every hand. | Add an auto-open seam in E12 |
| A-3 | "200 hands complete" = hand #201 dealt (200 gaps counted). | yes | Conservative. | Stop at the 200th result |
| A-4 | Real-time checks run in Chromium only; the paused-clock check runs in both projects. | yes | Matches TASK-3.6 A-2. | Time WebKit too |
| A-5 | Every-push bound: at most 100 ms fake time per bot action, clock advanced 1 ms at a time and never while a worker request is in flight. | yes | Today's code needs about 1 ms; 400 ms fails. | Tighten or loosen the cap |
| A-6 | 10-max harness seats: Ava, Ben, Cal, Dee, You (seat 5), Eli, Fay, Gus, Hal, Ivy; $4/$8, button seat 6, pinned words. | yes | Game Config can't seat 10 yet. | Use a players choice in Game Config |
| A-7 | Model worst case charges 300 ms per bot action and 0 for the user. | yes | Makes REQ-024.6 a deterministic every-push bound. | Model measured latency |

## Clarifications and decisions
No questions were asked (qa.md does not exist; state.json shows 0 questions).
- D-1: Real-time checks are opt-in (`TLH_SLOW_TESTS=1`, `npm run e2e:slow`) per the user's standing rule (2026-11-21). Every push runs: SPEC-01 unit, SPEC-02 fake-clock guard (with a 400 ms self-test) and SPEC-03 200-hand model.
- D-2/D-3: deterministic guards on every push; 10-max checks use a test-only harness that `src/` never imports.
- Recorded deviation (fix brief, Option 4): the 6-max advice chart throws at 10 seats until TASK-7.6, so SPEC-05 could not run with real TAG bots. The 10-max harness uses a test-only worker (`pace-advice.worker.ts`, raise-first policy) that runs the production worker host and `handleAdviceRequest`. Bot turns still go through useTableSession, `botActionDelayMs`, the shared advice client and the worker reply. TASK-7.6 now has an AC to re-prove SPEC-05 with real TAG bots.
- Recorded deviation: the SPEC-02 meter returns cap+1 (not cap) when the action hasn't shown by the cap. As first written, the mutation `RAPID_BOT_DELAY_MS = 400` still passed.

## What was built
- `src/table/session.ts`: `RAPID_BOT_DELAY_MS = 0`, `botActionDelayMs(speed)`.
- `src/ui/table/useTableSession.ts`: bot `setTimeout` uses `botActionDelayMs(table.config.speed)`.
- `tests/table/pace.test.ts` (SPEC-01), `tests/table/pace.acceptance.test.ts` (SPEC-03).
- `e2e/rapid-pace.spec.ts`: SPEC-02 (every push, both projects); SPEC-04/05/06 (opt-in, Chromium).
- `e2e/support/pace-harness.tsx`, `e2e/support/pace-advice.worker.ts` (marker `tlh-test-pace-advice`, not in `dist/`), `buildPaceHarness()`/`openPaceHarness()` in `table-harness-bundle.ts`.
- `package.json`: `e2e:slow` also runs `e2e/rapid-pace.spec.ts`. `README.md`: "Rapid pace" bullet in the performance section (documents `npm run e2e:slow`).
- No new dependencies. Build gate: 521 lines / 10 files (budget 460 / 9; the overrun comes from the extra test worker).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#4 | unit `pace.test.ts` | pass | build-log |
| SPEC-02 | AC#4 | paused-clock e2e, both projects, plus 400 ms self-test | pass; mutation 400 ms fails ("bot action 1: 101 ms of fake time") | build-log |
| SPEC-03 | AC#3, AC#5 | 200-hand model | pass | gates/build-1.json |
| SPEC-04 | AC#1 | opt-in, 6-max real time | 80 actions, slowest 16 ms, median 0.6 ms (limit 300) | `e2e:slow` run, build-log FIX 1 |
| SPEC-05 | AC#2 | opt-in, 10-max, test-only raise-first worker | 235 actions, slowest 45.8 ms, median 0.2 ms | same |
| SPEC-06 | AC#3, AC#5 | opt-in, 200 real hands | 365,769 ms = 1,968.5 hands/hour (60 min limit; includes 300,000 ms of gaps) | same |
| SPEC-07 | DoD | lint, typecheck, `npm test` | clean; 517 passed, 7 skipped; coverage 96.8% | build-log |
| SPEC-08 | DoD#6 | playtest 10,000 hands cash and SnG, seed 42 | Invariant violations: 0 each | build-log |
| SPEC-09 | DoD | CI plus this doc | CI run after push; opt-in tests skip there | orchestrator |
| SPEC-10 | N/A DoD items | no screen changes | Judge | doit/TASK-3.13/judge/ |

- `npm run e2e`: 130 passed, 12 skipped. `npm run e2e:slow`: 15 passed, 5 skipped, 0 failed (6.1 min). Responsive-table frame times in the same run: p95 16.7 ms.
- Gates: build-1, fix-2, fix-3, fix-4 (gate_runs 4); build gate PASS with the budget warnings above.
- Judge: see doit/TASK-3.13/judge/.

## Review
Round 1: 0 blocking. Security: clean (a constant feeding an existing timer; no new input, dependency or network origin; test-only code not in `dist/`).

### Non-blocking review notes (deliberately not fixed)
- MINOR: the 10-max harness labels bots "TAG" although the test worker ignores style (test-harness polish).
- NITs: test-harness polish (see reviews/round-1/code.json).

## How to try it
- Every push: `npm run e2e -- e2e/rapid-pace.spec.ts` and `npm test`.
- Opt-in real-time checks (about 6 min): `npm run e2e:slow`.
- Mutation check: set `RAPID_BOT_DELAY_MS = 400`; SPEC-01 and SPEC-02 fail. Revert afterwards.

## Run metrics
Questions 0 · assumptions logged in state.json 0 (A-1..A-7 are in the spec) · review rounds 1 · judge rounds 0 at time of writing · gate runs 4 · escalations 0 · sendbacks 0 · changed lines about 521 per the build gate.

## Known limitations and follow-ups
- [trainer] Re-prove 10-max bot pace with real TAG bots once 10-seat charts exist: owned by TASK-7.6 (AC already added).
- Not tracked (infra, below the value bar): the test-harness polish items from review (bot label, NITs).
- Timing checks are opt-in, so CI does not measure real-time pace; only the fake-clock guard and the model run every push.

## Lessons for the factory (proposals — not applied)
- The spec assumed the 10-seat advice path worked; it threw at 10 seats and cost a BUILD block plus a fix brief. Proposal: the spec step should check that a feature chosen for a new table size actually runs there before listing it as verifiable.
- The first SPEC-02 meter let a 400 ms wait pass. Proposal: require the spec's mutation check to be run during the build, not only at judging.
- The 6-minute `e2e:slow` run was needed twice (list reporter hides annotations). Proposal: use `--reporter=list,json` for opt-in timing runs from the first run.
