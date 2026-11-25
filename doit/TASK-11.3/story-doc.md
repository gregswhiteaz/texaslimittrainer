# TASK-11.3: See the G-2 target line on my Major-error trend

Status: Done · Completed: 2026-11-25 · Epic: TASK-11 — Track progress over time · Milestone: m-1 · Requirements: REQ-040 (040.3), REQ-048 (048.3, 048.9), REQ-004.8, REQ-057, REQ-058 · Branch: doit/TASK-11.3

## What was asked
Once 1,000 hands are stored, the Major-error chart on the Statistics screen shows a dashed target line at half the G-2 baseline. The baseline is the unhinted Major errors per 100 hands over the first 1,000 hands in chronological order. A caption explains the line. With 999 or fewer hands there is no line. The target must not change with filters (ACs #4 and #5). Spec: doit/TASK-11.3/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Target = `bbPer100(m, 2, 1000)`: m/20 rounded half away from zero to tenths (62 gives 3.1, 63 gives 3.2). The line is drawn at the rounded value. | yes | Same integer-exact rounding the Major points use, so label and line agree. | Use unrounded m/20 and round the label separately. |
| A-2 | "1,000 hands exist" counts every valid hand from `trendData()`: any game type, table size or line-up, hinted or not, forced folds included. | yes | Matches what the screen counts elsewhere. | Count raw IndexedDB rows. |
| A-3 | The line is drawn only when the Major chart plots points. With a filter that leaves 0 to 499 hands, the message shows and there is no line or caption. `view.g2Target` still carries the value. | yes | There is no plot to draw on. | Draw an empty plot with only the target. |
| A-4 | yMax = max(1, every point, target). Unfiltered, the target never exceeds the largest point, so today's geometry is unchanged. | yes | Same idea as TASK-11.2 A-5. | Clip the line. |
| A-5 | Caption is `p.stats-goal` above the SVG. The line is `line.stats-target`, dash "6 5", x 0 to 400, stroke #F0A030 (via the break-even stroke rule). | yes | A locked bb100 test forbids `stats-break-even` on the Major card. | Reuse `stats-break-even` (breaks a locked test). |
| A-6 | Test fixtures are small real pools (24 real hands plus one forced fold), cloned to the counts needed. | yes | Keeps the normal suite fast. | Play every hand. |

## Clarifications and decisions
Both questions were auto-accepted at the recommended option (autopilot).
- Q-1: ACs #4 and #5 name filters owned by TASK-11.4 and TASK-11.8. Answer: meet them through `statisticsView(filtered, all)` with tests that filter real records. The orchestrator added ACs to TASK-11.4 and TASK-11.8, and an exact-rate note on TASK-11.11. No filter UI was built here.
- Q-2: Caption "Dashed line: half your first-1,000 rate (G-2)" plus aria-label suffix ". Dashed target line at <t>". Review note: this caption keeps "(G-2)", but the BB/100 card dropped "(G-3)" in TASK-11.2, so the two captions differ in style.

## What was built
- `src/stats/trends.ts`: `G2_BASELINE_HANDS`, `G2_CAPTION`, `g2Target(ordered)` (null below 1,000), `StatisticsView.g2Target`, `statisticsView(data, all = data)` (target and threshold come from `all`; ordering is reused when `all === data`), and `chartLabel(points, target?)`.
- `src/ui/stats/StatisticsScreen.tsx`: `MajorErrorTrend` takes the target and renders the caption, a dashed `line.stats-target` and a wider yMax. Markup is identical when the target is null (checked against HEAD).
- `src/ui/styles.css`: `.stats-target` shares the break-even stroke rule.
- `tests/support/stat-records.ts`: `graded` is exported as `withGrades`. `cashPool` and `sitAndGoPool` take an optional `players`, and `cashPool` takes an optional preset.
- `docs/stats/trends.md`: G-2 section. No new dependencies. Engine, bots and advice are untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | AC#1..#5 | `tests/stats/g2-target.acceptance.test.tsx` (module and renderToString) | PASS | 5/5 |
| SPEC-06 | rounding, threshold, geometry | `tests/stats/trends.test.ts` | PASS | 5/5 |
| SPEC-07 | browser flow | `e2e/statistics-target.spec.ts`, Chromium and WebKit, axe | PASS | judge also ran a holdout 1,300-hand shuffled flow |
| SPEC-08 | lint, types, suite | `npm run lint && npm run typecheck && npm test` | PASS | 1361 tests passed, 46 skipped; `src/stats` 100% lines |
| SPEC-09 | docs | `docs/stats/trends.md` | PASS | judge |
| SPEC-10 | no engine change | `git diff main -- src/engine src/bots src/advice` | PASS | empty |

Gates: 4 runs, all PASS. Judge round 1: PASS, 10/10 items, no findings. Judge holdout checks (unit and browser) passed in both engines.

## Review
- Round 1 MAJOR: every fixture was already in chronological order, so the ordering rule was not proven. Fixed in round 2. AC#3 and AC#5 now feed records sorted by sessionId. A mutation check (`g2Target(all.hands)`) now fails AC#3 and AC#5. This needed a locked-test unlock, done through the logged unlock flow.
- Security: no findings in either round.

### Non-blocking review notes (deliberately not fixed)
- MINOR no-test-target-without-points (open): no test asserts that a non-null target with a "more hands" or "no hands" Major chart shows no caption or line (A-3). The code is correct. Only the judge's holdout covers it.
- MINOR line-up-filter-vacuous (round 1): fixed in round 2 by seating the 9-max pool with the Tough preset, so AC#5 covers Custom (1,200 hands) and Tough (500).

## How to try it
`npm test`, or `npx vitest run tests/stats/g2-target.acceptance.test.tsx`, or `npm run build && npx playwright test e2e/statistics-target.spec.ts`.

## Run metrics
Questions 2 · assumptions 6 · review rounds 2 · judge rounds 1 · gate runs 4 · escalations 0 · changed lines 572 (scope budget was 560).

## Known limitations and follow-ups
- Changed lines were 572 against a 560 budget, mostly from the round-1 test strengthening. This is a small overrun with no impact.
- [trainer] Add a test that a non-null `g2Target` with a "more hands" or "no hands" Major chart shows no caption and no line. Owner: TASK-11.4, as part of its filter ACs.
- [trainer] Decide whether the BB/100 and Major captions should both keep or both drop the "(G-n)" suffix. Owner: TASK-11.11.
- Filter ACs (#4, #5) are already tracked on TASK-11.4 and TASK-11.8, and the exact-rate note on TASK-11.11.

## Lessons for the factory (proposals — not applied)
- Spec test guidance should say to feed ordering-dependent rules records in non-natural order. The round-1 MAJOR came from fixtures that happened to be already sorted.
- Carry open MINOR findings that name a spec assumption (A-3) into the build brief, so they are fixed or explicitly waived. This one was repeated unaddressed in round 2.
