# TASK-11.2: See my BB/100 trend from cash hands against a break-even line

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 · Milestone: not recorded in the artifacts · Requirements: REQ-048 (048.1, .4, .11–.14), REQ-057.1, REQ-058.1 · Branch: doit/TASK-11.2

## What was asked
The Statistics screen gets a second chart, "Big bets won per 100 hands". It uses cash hands only. Each point is one complete group of 500 cash hands. A dashed line marks break-even (0). With 1–499 cash hands it says how many more are needed, and with none it says "No cash-game hands yet." Spec: doit/TASK-11.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A hand's net is `netResult(record)` (chips won and returned minus chips put in). Its big bet is `record.stake.bigBet`. Rebuys are never in a hand record. | yes | Existing helper. A probe of 200 hands with 8 rebuys matched the report. | Read stack deltas instead (wrong across rebuys). |
| A-2 | Group value is the exact Σ(net/bigBet)/n × 100, computed with integers via the lcm of the group's big bets, then rounded by the report's `bbPer100`. | yes | No float drift. A session's value equals its report exactly. | Float sum plus `Math.round` (can differ by 0.1). |
| A-3 | Hands use TASK-11.1's order, keep the cash ones and group them in 500s. Point positions are 1-based among cash hands. | yes | Same order as the Major-error chart. | Count positions among all hands. |
| A-4 | `TrendHand.cash` is optional and is present only for cash records. | yes | Keeps TASK-11.1's locked tests compiling. | Make it required (breaks locked tests). |
| A-5 | Geometry: same 400×160 box. hi = max(1, top value), lo = min(−1, bottom value). The dashed line sits at y(0), stroke #F0A030, dash "6 5". | yes | Break-even is always inside the plot. | Symmetric scale around 0. |
| A-6 | While loading or after a read failure the new card shows only its heading. The failure message stays in the first card. | yes | One failure message per screen. | Repeat the message. |
| A-7 | New markers have their own names (`p.stats-bb100-message`, `circle[data-bb100-point]`, `#stats-bb100-title`). | yes | Locked tests find the Major chart page-wide by `.stats-message` and `circle[data-point]`. | Reuse the names and edit 5 locked tests. |
| A-8 | Test data: a small pool of real played hands (3 stakes, plus sit-and-go) cloned to the needed counts. The suite plays 56 real hands. | yes | 2,000 played hands take about 50 s. | Play every hand (slow group only). |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): the ACs that mention the game-type filter and per-session points are met by pure functions here (`statisticsView`, the sit-and-go-only hand set, `bb100Value` of a session's hands). The filter and per-session UI stay in TASK-11.4 and TASK-11.5, which gained ACs to wire to these functions.
- Q-2 (auto-accepted): chart text is the caption "Dashed line: break-even", the note "Each point is 500 cash hands. Above the dashed line means you are winning.", the tooltip "Cash hands 501–1,000: +2.7" and an aria-label listing every value. The storyboard's "(G-3)" and "line-up" wording was left out.
- D-1: extend TASK-11.1's `trends.ts` rather than add a module or a second store read. `trendData()` is unchanged.
- D-3: one unlocked TASK-11.1 unit test (`tests/stats/trends.test.ts`) gained `bb100: { kind: 'no-cash' }` in its expected empty view. No locked test was edited.

## What was built
- `src/stats/trends.ts`: `CashSummary`, optional `TrendHand.cash`, `bb100Value`, `bb100Points`, `StatisticsView.bb100` (`no-cash` / `more-cash` / `points`), text constants and builders. `orderHands` runs once per view.
- `src/table/review.ts`: `netResult` parameter type widened. No behaviour change.
- `src/ui/stats/StatisticsScreen.tsx` and `src/ui/styles.css`: second card with the dashed `line.stats-break-even`, polyline and dots. The x-position helper is shared with the Major chart.
- `tests/support/stat-records.ts`: `cashPool`, `sitAndGoPool`, `cloneRecords`.
- `docs/stats/trends.md`: BB/100 section with a worked example.
- Example: +12 at $4/$8 and −20 at $10/$20 over 2 hands gives 25.0.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | AC#1–7 | `tests/stats/bb100.acceptance.test.tsx` (7 tests) | pass | 2,000 mixed-stake hands give 4 points recomputed independently. Sit-and-go excluded. Break-even line. Session value equals its report with a rebuy. Messages for 0, 300 of 800 and 499. |
| SPEC-08, 09 | unit | `trends.test.ts`, `trend-data.test.ts` | pass | Rules, geometry, text. Store carries `cash`. |
| SPEC-10 | browser | `e2e/statistics-bb100.spec.ts`, Chromium + WebKit | pass | 2 points, dashed line, axe clean, same-origin only. |
| SPEC-11 | checks | lint, typecheck, `npm test` | pass | 1355 passed, 46 slow skipped. `src/stats` 100% lines, overall 94.12%. |
| SPEC-12, 13 | docs, N/A | manual | pass | Doc written. No engine, bot or advice change. |

- Gates: build-1 and fix-2 both PASS. Judge round 1: PASS 13/13, no findings. The judge also ran a real production-preview session (643 hands, 1 rebuy, Chromium and WebKit). The value matched the Session Report BB/100 (−3.0) and an independent computation.

## Review
Round 1 (code and security) found no blocking issues.

### Non-blocking review notes (deliberately not fixed)
- Security, MINOR (`src/stats/trends.ts:163`): a tampered IndexedDB store with many unusual big bets can push the lcm past 2^53. `gcd` then recurses until the stack overflows. `statisticsView` runs in the `.then` success handler (`src/ui/App.tsx:90`), so the Statistics screen stays on loading instead of showing the load-failure message. Real play only stores the fixed stakes.
- Code, MINOR (`src/stats/trends.ts:107`): `trendHand` casts any source with `gameType: 'cash'` as having the cash fields.
- Code, NIT: no unit case for all-negative geometry.
- Scope: 799 changed lines against a 750 budget (10 files).

## How to try it
`npm run dev`, play a few cash hands, then Home → Statistics. The card shows "Play N more cash hands…". For the chart: `npm run build && npx playwright test e2e/statistics-bb100.spec.ts`.

## Run metrics
Questions 2 (auto-accepted) · assumptions 8 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 799.

## Known limitations and follow-ups
- [trainer] Harden `bb100Value` against a huge or non-finite lcm (fall back to a float sum, or catch the error so the Statistics screen shows the load-failure message). Owner: none found; the orchestrator should pick a Statistics-hardening task.
- [trainer] Make `TrendSource` a discriminated type so `trendHand` needs no cast for `gameType: 'cash'`.
- [trainer] Add a unit case for an all-negative geometry chart in `tests/stats/trends.test.ts`.
- [trainer] TASK-11.4 and TASK-11.5 must wire their filter and per-session UI to `statisticsView` and `bb100Value` (ACs already added).

## Lessons for the factory (proposals — not applied)
- The scope budget was exceeded by about 7%, which was in the warn band only. Spec budgets for stories that add both a UI card and test fixtures could start nearer 850 lines.
