# Spec: TASK-6.16 — Keep TAG and Rock bots inside their style bands

Status: READY (approved 2026-11-22)
Task: TASK-6.16 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-027 (027.1, 027.4, 027.5, 027.6), REQ-056.1, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
Since TASK-7.8, bots bet and raise for value after the flop. Spec-time measurements (100,000 hands, Mixed 6-max,
seeds 42, 7 and 1234; §3) put TAG inside every REQ-027.1 band. The Rock's VPIP and PFR are inside REQ-027.4, but its
postflop aggression is 70.0–70.9%, above the 55% ceiling. The Rock plays only strong starting hands, so the shared
value rule (bet or raise when equity against the calling range is above 50%) fires for it most of the time. This
task adds one postflop knob to the Rock's style file. The Rock bets or raises only when the advice does **and** its
equity against the calling range is above 75.0%. Otherwise it checks when nothing is owed and calls when a bet is
owed. A prototype measured Rock aggression at 46.9–47.2% on all three seeds, with VPIP, PFR and every TAG stat
unchanged. The 6-max chart, TAG's style file and the advice engine stay as they are. The user's advice doesn't change.

## 2. Scope
- In scope:
  - `src/bots/styles/rock.json`: a new `postflopValue` block (`thresholdPct: 75` plus an original justification), and
    one clause added to the description so it stays accurate (A-2).
  - `src/bots/style.ts`: the `PostflopValue` type, a `BotStyleData.postflopValue` field (`null` when the file has no
    block), and validation of the block in `parseStyle`.
  - `src/bots/rock.ts`: the postflop rule in `decideRock` (§5).
  - Tests: a new every-push acceptance file for the rule and the validation, a new opt-in slow acceptance file for the
    100,000-hand bands on three seeds, an update to one unlocked unit assertion in `tests/bots/rock.test.ts`, and the
    slow file added to `package.json` `test:slow`.
- Not doing:
  - Retuning the 6-max chart (`src/advice/charts/six-max.json`) or `src/bots/styles/tag.json`. TAG is inside all three
    bands on every seed (§3), so AC#4's retune and AC#5's "or the chart is retuned" don't apply (D-2). No chart
    counts, golden spots or default-playtest SHA change.
  - Changing the advice engine (`src/advice/**`) or passing any bot parameter into `recommend` (REQ-035.3,
    `src/advice/recommend.ts:9-17`).
  - Building `--check-styles`, its report, or the shared style-stat functions. Those are TASK-6.11 and TASK-7.12
    (Q-1).
  - Calling station or Maniac bands (TASK-6.17). At spec time Calling station aggression measures 51–53% against a
    10–25% band, so a full `--check-styles` run exits non-zero until TASK-6.17 lands (scope concern 2).
  - Giving the Rock randomness. It stays deterministic ("draws nothing", `src/bots/decide.ts:9`).
  - Line-up drift from bust replacement (scope concern 3).
- Scope budget: files=7, lines=330

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Style stats count bot seats by their style at each hand (`hand.lineUp`), as the spec-time harness did. Seat 1, the user stand-in that plays TAG, is excluded from TAG's numbers. A hand counts for a seat only if that seat was dealt in. | yes | REQ-027 measures "each bot style". Seat 1 is the user seat. Including it moves TAG by ≤0.3 points (user TAG 22.3/16.5/61.8–62.8 vs bot TAG 22.2–22.6/16.3–16.8/62.8–62.9), so the verdict is the same either way. | Include seat 1 in TAG. Defer to TASK-6.11's definition, which the CLI verification then uses. |
| A-2 | The Rock's description gains this clause after "it follows the trainer's own advice": ", except that after the flop it bets or raises only with very strong hands and checks or calls with the rest". The full new text is in §5. | yes | The description must stay true (REQ-061.2). Today no screen shows it (`grep '\.description' src` finds only the parser). Its 15-word minimum still holds. | Leave the description unchanged. It would then slightly overstate how closely the Rock follows the advice after the flop. |
| A-3 | `thresholdPct` must be a finite number from 50 to 100 inclusive. Below 50 the knob would never change anything, because the advice already needs more than 50 (`src/advice/postflop.ts:17,133`). | yes | Catches authoring mistakes early, as the other style fields do. | Allow 0–100. |
| A-4 | The 100,000-hand band test computes VPIP, PFR and aggression with a small counter inside the test file, using the REQ-045 formulas (blinds aren't voluntary; aggression counts flop, turn and river only). It doesn't wait for TASK-7.12's shared functions. | yes | Keeps this task independent of the enabler's API. The locked test states the observable behaviour (the bands), and the formulas are fixed by REQ-045. | Import TASK-7.12's functions once they exist. |

## 3. Current system
- Bots: `src/bots/decide.ts:10-15` dispatches by style. The Rock gets no generator (`decideRock(view)`).
  `src/bots/rock.ts:22-41` returns `recommend(view, advice).move` on every postflop street (`rock.ts:26`). Preflop,
  hands outside the style's starting range fold, or check when nothing is owed.
- The postflop value rule is in `src/advice/postflop.ts:130-147`: `value` is true when a bet or raise is legal and
  `Math.round(equityVsCallingRangePct*10) > Math.round(VALUE_THRESHOLD_PCT*10)`, with `VALUE_THRESHOLD_PCT = 50`
  (`postflop.ts:17`). Possible actions are value-bet → bet, check-free → check, value-raise → raise, pot-odds-call
  and pot-odds-fold. `PostflopRecommendation.equityVsCallingRangePct` is on every postflop recommendation (`postflop.ts:42-43`).
- Bots use `BOT_EQUITY` and the default `'unseen'` opponent ranges (`src/bots/tag.ts:26-31`, `rock.ts:25`).
- The style file schema is in `src/bots/style.ts:59-67` (`BotStyleData`). `parseStyle` (`style.ts:111-246`)
  validates authored JSON and throws `StyleValidationError` with every problem it finds. It enforces
  `JUSTIFICATION_WORDS = 10` (`style.ts:90`), and its message pattern is `` `${fileName}: style ${name} …` ``.
- Playtest: `runPlaytest(options, onHand, seams)` (`src/playtest/runner.ts:343`). With `lineUp: 'Mixed'` each
  `PlayedHand` carries `lineUp` (seat styles at that hand, `runner.ts:134-150`), and `final.actions` holds
  `ActionRecord`s with `street`, `seat` and `type`, blinds included (`src/engine/hand.ts:53-59`). The CLI
  (`src/playtest/cli.ts:44-49,55-65`) has **no `--check-styles` option**. TASK-6.11 (To Do) adds it, and TASK-7.12
  (To Do) adds the shared style-stat functions.
- Slow tests are gated with `const SLOW = process.env.TLH_SLOW_TESTS === '1'` and `it.runIf(SLOW)`
  (`tests/bots/tag-playtest.acceptance.test.ts:13,98`), and are listed in `package.json` `test:slow`. `test:sweeps`
  runs every `.acceptance.test.` file, so an ungated 100k test would land in CI shard 2.
- Spec-time measurements (harness `/tmp/t616/measure.ts`: runPlaytest with Mixed, size 6, cash, counting per A-1 and
  A-4). About 125–160 s per 100k run.

  | seed | TAG VPIP/PFR/AGG | Rock VPIP/PFR/AGG (today) | Rock AGG at 72 | Rock VPIP/PFR/AGG at 75 | TAG at 75 |
  |---|---|---|---|---|---|
  | 42 | 22.2 / 16.3 / 62.8 | 10.3 / 8.9 / **70.9** | 50.2 | 10.1 / 8.8 / 47.0 | 22.2 / 16.2 / 63.0 |
  | 7 | 22.4 / 16.5 / 62.9 | 9.9 / 8.5 / **70.0** | 50.8 | 10.0 / 8.7 / 46.9 | 22.3 / 16.3 / 63.3 |
  | 1234 | 22.6 / 16.8 / 62.8 | 10.0 / 8.7 / **70.7** | 50.5 | 9.9 / 8.4 / 47.2 | 22.2 / 16.2 / 63.1 |

  At 10k hands (seed 42), Rock aggression was 63.3 at a threshold of 60, 61.7 at 65, 53.2 at 70 and 46.8 at 75.
- Prototype test impact (repo copy, threshold 75): `vitest run` without CI, git or toolchain gives 164 files passed
  and 1 failed. The only failure is unlocked unit `tests/bots/rock.test.ts:110`, where a facing-bet view now calls
  instead of value-raising. **No locked test fails.** The locked `tests/advice/value-bet.acceptance.test.ts:385`
  (`decideRock(free)` bets 8s8c on Ks 8d 7c) still passes, because that spot's bot equity against the calling range
  is 93.2%. With `TLH_SLOW_TESTS=1`, the line-up, replacement, lineup-throughput, bot-replay, games and
  bot-results slow acceptance files all pass (6 files, 29 tests).
- Existing code to reuse:
  - `src/advice/recommend.ts` `recommend`, `adviceOptions` → the Rock keeps calling it and only post-processes the
    returned action.
  - `src/bots/style.ts` `isRecord`, `wordCount`, `JUSTIFICATION_WORDS`, `StyleValidationError` → validate the new
    block.
  - `tests/bots/rock.test.ts:115-128` `fixed(pct)` equity seam pattern → drive the rule's boundary tests.
  - `tests/bots/rock.acceptance.test.ts` `raw()` / `problemsOf` patterns (copy them; locked files can't be imported)
    → validation tests.
  - `tests/bots/tag-playtest.acceptance.test.ts:13,98` → slow gating.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Lower Rock aggression with a deterministic, style-file postflop value threshold (`postflopValue.thresholdPct: 75`) applied inside `decideRock` after `recommend`. | (a) Random passive deviations (`postflop/bet/check`, `postflop/raise/call`) reusing the deviation machinery. That needs new `DEVIATION_PAIRS` and a `'check'` instead-type, and gives the Rock a generator, which changes replay and decide wiring. (b) A Rock-only threshold passed into the advice engine, which breaks REQ-035.3. (c) Shrinking the starting range, which hits VPIP/PFR and barely moves postflop aggression. | It is the smallest change that keeps the Rock deterministic and keeps advice free of bot parameters. It also matches the description ("give its bets and raises real respect"): bets come only from very strong hands. The task asks for "style data files (and only them)", but the Rock has no postflop knob today, so the file can't express this without a small reader in code (Approved by Q-2). | yes | user (Q-2, auto-accepted) |
| D-2 | No 6-max chart or TAG file retune. AC#4 and AC#5 are met by measurement: TAG is inside every band (worst-case TAG aggression 63.3%, 1.7 points under the ceiling). | Retune anyway for more margin. | Retuning the chart changes the user's advice, chart counts, golden spots and the default playtest SHA for no band gain. AC#4 only asks for a retune when VPIP or PFR fall outside the band. | yes | user (Q-3, auto-accepted) |
| D-3 | Threshold 75 rather than 72. | 72 (aggression 50.2–50.8, 4.2 points under the ceiling). 70 (53.2 at 10k). | 75 puts aggression near the band centre (45), about 8 points from the ceiling and 12 from the floor. That leaves room for later strategy changes. | no | n/a |
| D-4 | The comparison mirrors the advice's rounding: the Rock keeps the aggressive move only when `Math.round(equityVsCallingRangePct*10) > Math.round(thresholdPct*10)`. | Raw float compare. | Same semantics as `postflop.ts:133`, and exact at the one-decimal boundary. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/styles/rock.json` — add `postflopValue`, and add the clause to `description` (A-2).
- `src/bots/style.ts` — `PostflopValue` type, `BotStyleData.postflopValue`, validation.
- `src/bots/rock.ts` — postflop rule, plus an updated doc comment.
- `tests/bots/rock-postflop.acceptance.test.ts` — new, every push (SPEC-03..SPEC-06).
- `tests/bots/style-bands.acceptance.test.ts` — new, opt-in slow (SPEC-01, SPEC-02).
- `tests/bots/rock.test.ts` — update the postflop assertion at lines 106-111 (unlocked unit).
- `package.json` — append `tests/bots/style-bands.acceptance.test.ts` to `test:slow`.

### Components, interfaces and data
- `src/bots/style.ts`:
  ```ts
  /** A style's own postflop value bar: keep the advice's bet/raise only above thresholdPct (percent, one decimal). */
  export interface PostflopValue {
    readonly thresholdPct: number;
    readonly justification: string;
  }
  // BotStyleData gains:
  /** null when the file has no postflopValue block. */
  readonly postflopValue: PostflopValue | null;
  ```
  `parseStyle` behaviour:
  - Block absent → `postflopValue: null`. TAG, Maniac and Calling station keep parsing unchanged.
  - Block present but not an object → problem `` `${fileName}: style ${name} postflopValue must be an object` ``.
  - `thresholdPct` not a finite number in [50, 100] → problem
    `` `${fileName}: style ${name} postflopValue must have a thresholdPct from 50 to 100` ``.
  - Justification under 10 words → problem
    `` `${fileName}: style ${name} postflopValue has no justification (at least 10 words)` ``.
  - Problems join the existing list. All of them are reported together, as today.
- `src/bots/rock.ts` `decideRock` postflop branch (replaces `rock.ts:26`):
  ```ts
  if (view.street !== 'preflop') {
    const rec = recommend(view, advice);
    const value = (options.style ?? ROCK_STYLE).postflopValue;
    if (value === null || rec.basis !== 'equity' || (rec.action !== 'bet' && rec.action !== 'raise')) return rec.move;
    if (Math.round(rec.equityVsCallingRangePct * 10) > Math.round(value.thresholdPct * 10)) return rec.move;
    return legal(owed > 0 ? 'call' : 'check'); // view.legalActions.find(a => a.type === …)
  }
  ```
  - A raise is only advised when a bet is owed, so `call` is legal there. A bet is only advised when nothing is owed,
    so `check` is legal there (`src/engine/hand.ts:342-350`).
  - The preflop path doesn't change. The Rock takes no generator.
- `rock.json` additions (original text, REQ-061.2):
  ```json
  "postflopValue": {
    "thresholdPct": 75,
    "justification": "After the flop the Rock bets or raises only when it expects to win at least three times in four against the hands that would call, so good but not dominant hands check or call and its postflop aggression stays inside its 35 to 55 percent band."
  }
  ```
  New description: "Rock (very tight) plays only a small set of strong starting hands and folds everything else
  before the flop, even many hands TAG would play. When it does play, it follows the trainer's own advice, except
  that after the flop it bets or raises only with very strong hands and checks or calls with the rest, so its raises
  usually mean a big pair or a strong ace. It checks its big blind when that is free rather than folding. Steal its
  blinds often, and give its bets and raises real respect."

### Rules and algorithms
- Rock postflop, worked examples with threshold 75 (rounded one-decimal equity against the calling range):
  - Nothing owed, advice `bet` at 75.1 → bet. At 75.0 → check. At 60.0 → check.
  - Bet owed, advice `raise` at 75.1 → raise. At 75.0 → call (amount = the legal call).
  - Advice `call`, `fold` or `check` → unchanged, whatever the equity.
  - Locked spot `value-bet.acceptance.test.ts:385` (8s8c on Ks 8d 7c, 93.2%) → bet, as today.
- Style stats (A-1, A-4), per style, over the bot seats whose style it is at each hand:
  - VPIP = hands with a preflop `call` or `raise` / hands dealt.
  - PFR = hands with a preflop `raise` / hands dealt.
  - Aggression = (flop, turn and river `bet` + `raise`) / (`bet` + `raise` + `call` on those streets).
  - Blinds (`small-blind`, `big-blind`) are never voluntary. The bands are inclusive.

### Error handling and configuration
- Invalid `postflopValue` in a style file → `StyleValidationError` at import, with the messages above.
- No new configuration, CLI options or dependencies.

## 6. Behaviour specification

### SPEC-01: TAG and Rock inside their bands at 100,000 hands on seed 42
- Verifies: AC#1, AC#2, AC#4, AC#5, DoD#1
- Behaviour: Given a 100,000-hand Mixed 6-max cash playtest with seed 42, When it completes, Then bot-seat TAG
  measures VPIP within [18, 26], PFR within [14, 22] and aggression within [45, 65]. The Rock measures VPIP within
  [8, 15], PFR within [6, 12] and aggression within [35, 55]. All values are percent, one decimal, bounds
  inclusive. TAG's band holds with the chart and `tag.json` unchanged, so AC#4's retune and AC#5's chart retune don't
  apply.
- Verification: acceptance `tests/bots/style-bands.acceptance.test.ts::TAG and Rock are inside their style bands over 100,000 Mixed 6-max hands (seed 42)` (opt-in slow: `npm run test:slow`)

### SPEC-02: Same bands on seeds 7 and 1234
- Verifies: AC#3, AC#5, DoD#1
- Behaviour: Given the same run with seed 7, and separately with seed 1234, When each completes, Then TAG and the
  Rock are inside the SPEC-01 bands for both seeds.
- Verification: acceptance `tests/bots/style-bands.acceptance.test.ts::TAG and Rock are inside their style bands over 100,000 Mixed 6-max hands (seeds 7 and 1234)` (opt-in slow; one `it` per seed, each with a 600 s timeout)

### SPEC-03: CLI check-styles re-check is deferred to TASK-6.11 (Q-1)
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given `--check-styles` doesn't exist yet (TASK-6.11), When this task is judged, Then AC#1–3 are verified
  by SPEC-01/02. TASK-6.11 carries the follow-up AC that re-runs
  `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed <s>` for s = 42, 7 and 1234 and
  checks the TAG and Rock lines (Approved by Q-1). This task adds no CLI code.
- Verification: manual Judge confirms `backlog task view TASK-6.11 --plain` lists the TAG/Rock CLI re-check AC and that SPEC-01/02 pass under `npm run test:slow`.

### SPEC-04: Rock keeps only very strong postflop bets and raises
- Verifies: AC#2, DoD#1, DoD#3
- Behaviour: Given a postflop view where the advice bets (nothing owed) and a fixed equity seam, When `decideRock`
  decides, Then it bets at 75.1% against the calling range and checks at 75.0% and 60.0%. Given a view where the
  advice raises (bet owed), Then it raises at 75.1% and calls at 75.0%. When the advice is call, fold or check, the
  Rock plays it unchanged. On the locked 8s8c Ks 8d 7c heads-up spot with `BOT_EQUITY`, the Rock still bets $4.
  `recommend` itself still returns bet/raise in those views, so the user's advice is unchanged.
- Verification: acceptance `tests/bots/rock-postflop.acceptance.test.ts::the Rock bets or raises after the flop only above its 75% value bar`

### SPEC-05: Rock style file carries a justified value bar; other styles have none
- Verifies: AC#2, DoD#9
- Behaviour: Given the shipped style files, When parsed, Then `ROCK_STYLE.postflopValue` is
  `{ thresholdPct: 75, justification }` with a justification of at least 10 words. The Rock description has at least 15
  words and contains "after the flop it bets or raises only with very strong hands". TAG, Maniac and Calling station
  have `postflopValue === null`.
- Verification: acceptance `tests/bots/rock-postflop.acceptance.test.ts::the Rock style file holds a justified postflop value bar and the other styles none`

### SPEC-06: Invalid postflopValue blocks are rejected with every problem
- Verifies: AC#2, DoD#1
- Behaviour: Given copies of `rock.json` with `postflopValue` set to `7`, with `thresholdPct` set to 49.9, 100.1,
  `"75"` or `null`, or with a 9-word justification, When `parseStyle(copy, 'rock.json')` runs, Then it
  throws `StyleValidationError` whose `problems` contain exactly the matching §5 message. Thresholds of exactly 50
  and exactly 100 parse.
- Verification: acceptance `tests/bots/rock-postflop.acceptance.test.ts::a bad postflopValue block is rejected with a clear problem`

### SPEC-07: Existing Rock unit test follows the new rule
- Verifies: DoD#1, DoD#2
- Behaviour: Given the three facing-bet postflop views in `tests/bots/rock.test.ts:106-111`, When `decideRock`
  decides, Then it equals `recommend(view).move` unless that move is a raise at or below 75.0%, in which case it is the
  legal call.
- Verification: unit `tests/bots/rock.test.ts::Rock folds or checks outside its range and plays the advice inside it`

### SPEC-08: Project checks, coverage, boundaries and network
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8, DoD#10
- Behaviour: Given the change, When lint, typecheck and the full test suite with coverage run locally and in CI,
  Then all pass with zero errors. Coverage holds at least 90% for bots and at least 70% overall. `src/bots/**` imports
  no UI code (the existing bots import-boundary test still passes). No network code is added.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-09: 10,000-hand Mixed playtest has zero invariant violations
- Verifies: DoD#6
- Behaviour: Given the changed Rock, When a 10,000-hand Mixed 6-max playtest runs, Then it reports
  `Invariant violations: 0` and exits 0.
- Verification: command `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42`

### SPEC-10: Non-applicable DoD items
- Verifies: DoD#7, DoD#11, DoD#12
- Behaviour: No screen or dialog is added or changed, so Playwright, axe and offline checks don't apply (DoD#7,
  DoD#12). Story documentation is written and published to Backlog.md by the doit docs stage (DoD#11).
- Verification: manual Judge confirms that `git diff --stat` touches no `src/ui/**` or `e2e/**` file, and that the
  story doc is published (`backlog doc list --plain`).

## 7. Edge cases
- The threshold boundary (75.0 vs 75.1, one-decimal rounding): SPEC-04.
- The advice raises but the street is capped: can't happen, because the advice only raises when a raise is legal
  (`postflop.ts:130-131`).
- A short stack facing a bet: `call` is always in `legalActions` when a bet is owed (`hand.ts:342-343`). SPEC-04 uses
  the legal call amount.
- A style file without the block (TAG, Maniac, Calling station, test style copies): `null` keeps today's behaviour
  (SPEC-05). The locked `rock.acceptance.test.ts` tests that build style copies with `startingRange` changes keep the
  block via `raw()`.
- Other table sizes: the postflop rule is size-independent. The preflop mapping is unchanged.
- Line-up drift from replacement (Calling stations and Maniacs bust): the Rock still gets 31k–72k hands per seed, so
  the samples are large. N/A for correctness.
- Concurrency, permissions, interruption: N/A (pure, synchronous decision).

## 8. Security considerations
- Trust boundary: style JSON is bundled, authored content validated at import (`parseStyle`). The new block is
  type- and range-checked, and echoed values aren't printed. No user input reaches it.
- No authn/authz, secrets, logging, network or new dependencies.
- Randomness: the Rock stays deterministic. Replay (REQ-013.3, TASK-6.15) is unaffected.

## 9. Non-functional
- Every-push tests: `rock-postflop.acceptance.test.ts` uses fixed equity seams and a handful of views, so it runs in
  under 2 s. No new sweep load beyond that file.
- The slow band test runs 3 × 100,000 hands at about 125–160 s each (measured), about 8 min total. It runs only with
  `TLH_SLOW_TESTS=1`, never on every push or in CI shards (standing rule).
- Bot decision cost: one comparison after the existing `recommend` call. No measurable change.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (the `--check-styles` CLI run follows in TASK-6.11, Q-1)
- New tests:
  - `tests/bots/rock-postflop.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06 (every push).
  - `tests/bots/style-bands.acceptance.test.ts` → SPEC-01, SPEC-02 (`it.runIf(TLH_SLOW_TESTS === '1')`, listed in
    `test:slow`).
  - `tests/bots/rock.test.ts` update → SPEC-07.
- Judge end-to-end: run `npm run test:slow -- tests/bots/style-bands.acceptance.test.ts`, or directly
  `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`, and confirm all three seeds pass. Then run SPEC-09.

## 11. Open questions
None. Resolved in `qa.md`:
- Q-1: build now; bands verified by the opt-in slow test (SPEC-01/02); CLI re-check moved to a TASK-6.11 AC (SPEC-03).
- Q-2: D-1 approved — deterministic `postflopValue.thresholdPct: 75` in `rock.json`, read by `style.ts`/`rock.ts`.
- Q-3: D-2 approved — no 6-max chart or TAG retune.

## 12. Clarifications log
See `doit/TASK-6.16/qa.md`.
