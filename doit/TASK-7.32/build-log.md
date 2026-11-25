# TASK-7.32 build log

## BUILD (round 1)

What was done
- Bots (`decideTag`, `decideRock`, `decideCallingStation`, `decideManiac`) spread `BOT_ADVICE = { opponentRanges: 'actions' }`
  before `adviceOptions(options)` (A-5); no observed stats (REQ-029.2).
- `recommendPostflop`: turn price `(call + R) ÷ (pot + call + 2R)`, R = min(bigBet, stack − call) when an opponent can
  still bet (A-1); value raise needs > 65% (`VALUE_RAISE_THRESHOLD_PCT`), value bet stays > 50%; new fields
  `requiredCountsRiverBet`, `valueThresholdPct`.
- Judgment call: the two new fields are optional in `PostflopRecommendation` (always set by `recommendPostflop`).
  Making them required breaks type-checking of hand-built inputs in the locked `tests/advice/value-copy.acceptance.test.ts`
  (TASK-8.1, not unlocked) and `tests/advice/explain.test.ts`, `tests/table/hint.test.ts`. Absent = false / 50.
- Explanation: Q-3 inline clause via `POT_ODDS_LEAD` → `POT_ODDS_RIVER_BET_LEAD` when the flag is set; value-raise copy
  shows 65.0%.
- Grading: `aggression-margin` measures from `valueThresholdPct ?? 50` (A-3).
- Judgment call: `src/advice/golden.ts` clear-cut rule also passes the engine's `valueThresholdPct`, so golden spots are
  clear-cut under the same grading the learner gets. This made 5 value-raise spots non-clear-cut in addition to the
  spec's 8 turn calls; all 13 were replaced per D-4 (log in docs/advice/golden-spots.md, coverage counts and multiway
  count unchanged; 6max-flop-co-raise-jj keeps its id with a 3-way line).
- Docs: postflop-rules.md (rules, examples, "Why bots almost never folded (TASK-7.32)"), range-model.md,
  explanations.md, golden-spots.md; REQ-033.1/033.2 amended with changelog row 1.10; package.json test:slow lists the
  new file.

Locked test edits (reason "TASK-7.32 Q-1"; values replaced one-for-one, no assertion removed)
- grade.acceptance AC#7: required 25 → 33.3, margin 20 → 28.3 (turn price).
- implied-odds AC#1/3/4: required 22.2 → 30.8, 40 → 44.4, 18.2 → 26.7.
- postflop.acceptance AC#1: toStrictEqual gains `requiredCountsRiverBet: false`, `valueThresholdPct: 65`; AC#6 turn 25 → 33.3.
- postflop-coverage AC#2: expected price formula includes R on the turn; value test uses 65 when owed.
- value-bet AC#6/AC#8: 0.501 → 0.651 (50.1 → 65.1); AC#9 key list gains the two fields; expectedRule uses 65 when owed.
  Test titles kept (TASK-7.8 spec-items reference them).
- tag.acceptance AC#2/AC#3, tag-mixing "outside mixed spots": expected advice `{ ...BOT_ADVICE, equity: BOT_EQUITY }`.
- calling-station.acceptance: advice with BOT_ADVICE; Example C fold[0]→fold[1], Example B fold[30]→fold[35], D-5 point
  6→3 (77 HJ), with their codes/seeds/u re-derived (same hands and outcomes).
- maniac.acceptance: advice with BOT_ADVICE; Example E check[2] JTo → check[8] 96o; B call[3]→call[1] (same T8o);
  C call[1] 7hQh turn → call[29] KdAd turn (the bots now fold 7hQh's turn); H call[2] 7hQh river → point 122 = call[38]
  8s8d river (no river call point < 84 has u < 0.6); worker test call[1] with seed 1461725007. Same properties asserted.
- style-bots "earlier showdowns": flagged hand 5 → 6 (first showdown is now hand 5), arrays/indexes shifted by one.
- games AC#6: in-process sit-and-go seed 42 → 7 (seed 42 no longer finishes a sit-and-go in 10,000 hands; seed 7 does
  at hand 5,732).
- next-hand sixty hands: hand 43 seat 2 stack 30 → 62.
- short-stack e2e seed: side pot $124 → $44.
- golden: 13 spots replaced, graded example margin 26.9 → 18.3 (logged in golden-spots.md).
- Unlocked unit tests: postflop.test.ts (3 rule tests + SPEC-05 test), maniac.test.ts, rock.test.ts (BOT_ADVICE).

Commands and results
- `npx vitest run` (normal suite): 1307 passed, 2 failed, 45 skipped — the 2 failures are the blocked locked tests
  (explanations.acceptance AC#4, review.acceptance; see blocked.json).
- `npm run lint`, `npm run typecheck`: pass.
- `npm run playtest -- --hands 10000 --seed 42 --size 6`: VPIP 22.4, PFR 16.3, aggression 64.5; ended at showdown 1,907
  of 10,000; 0 violations.
- `npm run test:slow` (full, 1,324 s): 87 passed, 8 failed. 100,000-hand all-TAG: VPIP 22.2, PFR 16.2, Aggression 64.3,
  WTSD 40.4, W$SD 51.5 (all inside). Failures: style-bands ×3 (accepted until TASK-6.25, not edited);
  explanations.acceptance AC#4 ×2 (blocked); check-styles "100,000 Mixed 6-max hands pass --check-styles" (Mixed drift,
  same cause as style-bands; blocked); tag-playtest AC#5 10,000 and heads-up AC#4 10,000 timed out at 120 s because the
  stop-hook gate ran `npm test` concurrently — re-run alone both pass in ~55 s.
- `npm run build && npx playwright test` (full, chromium + webkit): 302 passed, 16 skipped, 2 failed — both
  e2e/short-stack.spec.ts (side pot $124 → $44, unlocked for this story); re-pinned, re-run: 2 passed.
- Gate notes: the stop-hook gate counts TASK-10.5 files from main because `base_commit` predates the main merge
  (scope budget 2,607 lines and "unlisted" files come from that); the gate's runs overlapped the slow run, which caused
  the check-styles 300-hand timeout seen in gates/build-1.json.

Blocked (blocked.json)
- tests/advice/explanations.acceptance.test.ts (owner TASK-7.10) AC#4 hard-codes '50.0%' for value-raise; Q-3 says it
  shows 65.0%. Needed edit: `'50.0%'` → `rec.ruleId === 'value-raise' ? '65.0%' : '50.0%'`.
- tests/table/review.acceptance.test.ts (owner TASK-9.1): REVIEW_FOUR river call vs advised raise at 65.2% against
  callers grades Minor (0.2 from 65) instead of Major (15.2 from 50), per A-3. Needed edit: 4th label 'Major error' →
  'Minor error'.
- tests/playtest/check-styles.acceptance.test.ts (owner TASK-6.11) slow test "100,000 Mixed 6-max hands pass
  --check-styles on seeds 42, 7 and 1234" fails with the Mixed REQ-027 drift (TAG PFR 10.3 / Aggression 31.3, Rock
  VPIP 6.7 …) — the same knock-on Q-2 deferred to TASK-6.25; not fixable inside this story.
