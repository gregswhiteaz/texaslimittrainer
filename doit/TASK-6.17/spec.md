# Spec: TASK-6.17 — Keep Calling station and Maniac bots inside their style bands

Status: READY (approved 2026-11-22)
Task: TASK-6.17 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-027 (027.1–027.6), REQ-056.1, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
Since TASK-7.8 the bots bet and raise for value after the flop. TASK-6.16 then moved the Rock inside its bands. Two
styles are still out of band at 100,000 Mixed 6-max hands. The Calling station's postflop aggression is 51–53% against
a 10–25% band, because it plays every advised value bet and raise. The Maniac's is 84.1–84.9% against an 85% ceiling,
which leaves almost no margin. This task makes two style-data changes:
- The Calling station gets the same deterministic `postflopValue` bar the Rock has, set to `thresholdPct: 88`.
  `decideCallingStation` reads it.
- The Maniac's two postflop deviation probabilities drop from 0.85 to 0.6.

A prototype measured all four styles inside every band on seeds 42, 7 and 1234 (§3). The advice engine, the 6-max
chart, TAG's and the Rock's files, and the default playtest output (SHA `2cbbafa7…bb98`) all stay unchanged.

## 2. Scope
- In scope:
  - `src/bots/styles/calling-station.json`: a new `postflopValue` block (`thresholdPct: 88` plus an original
    justification). The description stays as it is (A-2).
  - `src/bots/styles/maniac.json`: the `postflop/check/bet` and `postflop/call/raise` probabilities go from 0.85 to 0.6.
    The `postflop/check/bet` justification is rewritten so it stays true (A-3).
  - `src/bots/style.ts`: a shared helper `postflopValueMove` (§5) that applies a style's `postflopValue` bar.
  - `src/bots/calling-station.ts`: apply the bar after `recommend` and before any draw. Update the doc comment.
  - `src/bots/rock.ts`: use the shared helper instead of its inline copy. Behaviour is identical, and the locked
    `rock-postflop.acceptance.test.ts` guards it.
  - Tests:
    - A new every-push acceptance file for the Calling station's bar.
    - Approved re-pins of four locked files (§5 "Locked-test edits", Q-3). One of them,
      `style-bands.acceptance.test.ts`, gains the Calling station and Maniac bands.
    - One unlocked unit pin in `tests/playtest/cli.test.ts`.
- Not doing:
  - Building `--check-styles`, its report, the shared style-stat functions, or the CI job that runs it. Those are
    TASK-6.11 and TASK-7.12. The CLI re-check and the nightly/on-demand CI run become follow-up ACs on TASK-6.11 (Q-1, Q-2).
  - Changing the advice engine (`src/advice/**`), the 6-max chart, `tag.json` or `rock.json`. The user's advice is
    unchanged (REQ-035.3).
  - New deviation pairs (`postflop/bet/*`, `postflop/raise/call`) or a `'check'` instead-type (D-1 alternative).
  - Changing preflop behaviour. Calling station and Maniac VPIP and PFR are already inside their bands (§3).
  - Changing line-up drift from bust replacement, or adding a dedicated line-up for measuring (D-4, scope concern 2).
  - Giving the Calling station's bar any randomness. The bar draws nothing.
- Scope budget: files=11, lines=320

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Style stats use TASK-6.16's A-1/A-4 counting unchanged: bot seats by their style at each hand (`hand.lineUp`), seat 1 excluded, REQ-045 formulas, counted in the test file. | yes | The extended locked test already counts this way (`tests/bots/style-bands.acceptance.test.ts:33-79`). | Wait for TASK-7.12's shared functions. |
| A-2 | The Calling station description isn't changed. It already says it "rarely raises" and "hardly ever bets on its own" (`calling-station.json:5`), and the bar makes that more true, not less. | yes | REQ-061.2 needs the description to stay true, and it does. Every text change needs re-reading. | Add a clause such as "after the flop it bets or raises only with very strong hands". |
| A-3 | The Maniac's `postflop/check/bet` justification becomes: "Betting more often than not when it is checked to, whatever it holds, is the Maniac's defining leak: its bets show little strength, so the learner should call down lighter, and the checks it keeps hold its postflop aggression inside its 65 to 85 percent band." The `postflop/call/raise` justification ("Raising most bets it would call…") and the description ("bets most of the time when everyone checks to it") stay as they are, because 60% is still "most". | yes | "Almost every time" is no longer true at 0.6 (REQ-061.2). | Rewrite all three texts. |
| A-4 | The Calling station's bar applies whether or not a `random` generator is passed, as the Rock's does. Without a generator, `decideCallingStation` is "the advice except where the value bar demotes a bet or raise". | yes | The bar is deterministic style data, not a deviation draw. Every existing no-generator caller still passes in the prototype, including the locked `value-bet.acceptance.test.ts:386` spot at 93.2%, which is above 88. | Apply the bar only when `random` is given. |
| A-5 | The shared helper sits in `src/bots/style.ts`, which already imports advice modules (`style.ts:1-9`), and the Rock is refactored onto it. | yes | One rule in one place. The locked Rock tests pin its behaviour. | Duplicate the 10 lines in `calling-station.ts` and leave `rock.ts` alone. |
| A-6 | The `rock-postflop.acceptance.test.ts` test title "…and the other styles none" is kept, with a comment noting that the Calling station has had a bar since TASK-6.17. | yes | TASK-6.16's spec and story doc cite the title. Only the body is re-pinned. | Rename the title to "…TAG and the Maniac none". |

## 3. Current system
- Calling station: `src/bots/calling-station.ts:27-47`.
  - It calls `recommend` with `BOT_EQUITY` and returns `advice.move` when it has no `random` (`:37`).
  - Otherwise, when the style has a deviation for the advised action, one draw decides whether it plays passively:
    call if a bet is owed, else check (`:38-46`).
  - Its style file (`src/bots/styles/calling-station.json`) has deviations `preflop/fold/call` 0.5,
    `preflop/raise/call` 0.6 and `postflop/fold/call` 0.5. It has no postflop bet or raise deviation, so every advised
    value bet or raise is played.
- Maniac: `src/bots/maniac.ts:24-41`. Its deviations replace the advised action with the aggressive one. In
  `maniac.json` the postflop deviations are `postflop/check/bet` 0.85 and `postflop/call/raise` 0.85.
- Rock bar (TASK-6.16):
  - `src/bots/rock.ts:30-44` keeps an advised postflop bet or raise only when
    `Math.round(equityVsCallingRangePct*10) > Math.round(thresholdPct*10)`. Otherwise it checks when nothing is owed
    and calls when a bet is owed.
  - The `PostflopValue` type and `BotStyleData.postflopValue` (null when absent) are in `src/bots/style.ts:59-74`.
  - `parseStyle` validates the block for any file (`style.ts:249-272`), and its messages use the file name and style
    name. So `calling-station.json` gets validation for free.
- Deviation pairs are fixed in `style.ts:39-48`. There is no `postflop/bet/*` or `postflop/raise/call` pair and no
  `'check'` instead-type.
- Line-up: in Mixed 6-max, seats 2..6 are TAG, Calling station, Maniac, Rock, TAG (`src/bots/lineup.ts:49-55`).
  A cash bot that busts is replaced by a style drawn from the preset (`src/playtest/runner.ts:69-71`,
  `lineup.ts:133-144`). Losing styles bust more, so over 100k hands the seats drift to TAG and the Rock.
- Band test: `tests/bots/style-bands.acceptance.test.ts` (locked by TASK-6.16). It is opt-in slow
  (`TLH_SLOW_TESTS === '1'`) and listed in `package.json:17` `test:slow`. Its `BANDS` map (`:16-19`) drives
  `expectInBands` (`:81-96`), so adding entries adds styles with no logic change.
- CLI: there is no `--check-styles` (`src/playtest/cli.ts:44-60`). TASK-6.11 AC#8 already carries the TAG/Rock CLI
  re-check (`backlog task view TASK-6.11`). On-demand CI workflows exist (`.github/workflows/million-lineups.yml`,
  `workflow_dispatch`).
- Spec-time measurements, 100,000 hands, Mixed, 6-max, cash. Harness `/tmp/t617/repo/measure.ts`, counting per A-1.
  About 145–155 s per run with 6 runs in parallel.

  | seed | config | TAG VPIP/PFR/AGG | CS hands · VPIP/PFR/AGG | Maniac hands · VPIP/PFR/AGG | Rock VPIP/PFR/AGG |
  |---|---|---|---|---|---|
  | 42 | today (TASK-6.17 notes) | in band | AGG 51–53 | AGG 84.1–84.9 | in band |
  | 42 | **CS 88, Maniac 0.6** | 22.2 / 16.4 / 63.8 | 8,207 · 59.6 / 6.7 / 15.3 | 3,641 · 56.1 / 53.3 / 79.3 | 10.2 / 8.8 / 47.8 |
  | 7 | **CS 88, Maniac 0.6** | 22.3 / 16.4 / 63.8 | 8,049 · 58.7 / 6.5 / 14.8 | 5,057 · 56.4 / 53.6 / 77.4 | 10.1 / 8.7 / 47.0 |
  | 1234 | **CS 88, Maniac 0.6** | 22.2 / 16.2 / 63.4 | 3,478 · 59.9 / 6.7 / 15.8 | 3,257 · 57.3 / 54.3 / 78.9 | 10.0 / 8.5 / 45.4 |
  | 42 | CS 90, Maniac 0.65 | 22.2 / 16.3 / 63.4 | 4,875 · 59.3 / 6.6 / 11.9 | 2,890 · 55.6 / 53.1 / 81.5 | 10.1 / 8.8 / 46.9 |
  | 7 | CS 90, Maniac 0.65 | 22.3 / 16.3 / 63.6 | 4,345 · 62.0 / 7.9 / 12.8 | 2,425 · 55.4 / 53.1 / 79.7 | 10.0 / 8.6 / 46.5 |
  | 1234 | CS 90, Maniac 0.65 | 22.3 / 16.3 / 63.4 | 2,546 · 59.3 / 6.2 / 14.0 | 2,579 · 56.1 / 53.4 / 79.9 | 10.3 / 8.9 / 49.0 |

  20,000-hand sweep on seed 42 (Maniac at 0.75 unless noted). Calling station aggression was 35.3 at a threshold of
  70, 21.2 at 80, 19.3 at 85, 13.1 at 90 and 6.3 at 95. Maniac aggression was 82.9–84.3 at 0.75 and 80.1 at 0.7.
  Zero invariant violations in every run.
- Sampling error at the chosen config, on the smallest sample (seed 1234: 3,478 CS hands, 2,202 CS postflop actions;
  3,257 Maniac hands, 4,259 Maniac actions). One standard error is about 0.8 points for CS aggression (margin to the
  10% floor: 4.8 points, about 6 SE) and about 0.6 points for Maniac aggression (margin to the 85% ceiling: 5.7
  points, about 9 SE). VPIP and PFR margins are 3.3 points or more, at least 6 SE.
- Prototype test impact (repo copy, final config, with the §5 re-pins not yet applied):
  - `vitest run` (excluding ci, git and toolchain): 162 files passed, 4 failed (5 tests).
  - `TLH_SLOW_TESTS=1` over the `test:slow` list without `style-bands`: 12 files passed, 1 failed (the same replacement
    test).
  - Every failure is a re-pin listed in §5. Once the re-pins are applied, the replacement and cli files pass.
  - `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` gives
    `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98` (unchanged; that run seats TAG only).
  - A 10k Mixed run reports `Invariant violations: 0`.
- Existing code to reuse:
  - `src/bots/rock.ts:30-44` → the bar logic, moved into the shared `postflopValueMove`.
  - `src/bots/style.ts` `parseStyle` postflopValue validation → no new validation code.
  - `tests/bots/rock-postflop.acceptance.test.ts:19-93` `spotDeck`/`viewAt`/`free`/`facing`/`fixed`/`legal`/`raw`
    patterns → copy them into the new acceptance file (locked files can't be imported).
  - `tests/bots/style-bands.acceptance.test.ts` `BANDS`/`expectInBands` → extended, not duplicated.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Calling station: a deterministic `postflopValue.thresholdPct: 88` in `calling-station.json`, applied in `decideCallingStation` through a shared helper. | (a) New deviation pairs `postflop/bet/check`-like and `postflop/raise/call` with probabilities. That needs a `'check'` instead-type or odd semantics, adds draws and so changes every later bot decision stream, and is noisier. (b) A threshold inside the advice engine, which breaks REQ-035.3. (c) A lower `preflop/fold/call` probability, which moves VPIP but not postflop aggression. | It reuses the knob TASK-6.16 built and needs no new schema. It is deterministic and adds no draws, so the station's random stream is unchanged. It matches the description ("hardly ever bets on its own"). It is the smallest change that moves aggression from about 52 to about 15. | yes | user (Q-3, auto-accepted) |
| D-2 | Maniac: both postflop deviation probabilities (`check→bet`, `call→raise`) go from 0.85 to 0.6. | 0.75 (aggression 82.9–84.3 at 20k, under 3 points of margin). 0.65 (79.7–81.5). Lowering only one of the two. | 0.6 puts aggression at 77.4–79.3, 5.7–7.6 points under the ceiling and 12+ above the floor. Lowering both keeps the Maniac's two leaks in proportion. VPIP and PFR are preflop and don't change. | yes | user (Q-3, auto-accepted) |
| D-3 | Threshold 88 rather than 90 or 85. | 90 (11.9–14.0, only 1.9 points above the floor). 85 (19.3 at 20k, nearer the 17.5 centre but measured only at 20k). | 88 measured 14.8–15.8 on all three seeds at 100k, 4.8+ points from the floor and 9+ from the ceiling. | no | n/a |
| D-4 | Keep measuring with the Mixed line-up, as the AC and REQ-027 say, rather than a dedicated style-heavy line-up. | A Soft-plus-Maniac or custom line-up with more seats per loose style, for larger samples. | The sample sizes above give at least 6 SE of margin on every stat. A custom line-up would measure something other than what REQ-027 and the TASK-6.11 CLI check measure. | yes | user (Q-4, auto-accepted) |
| D-5 | The bands are verified by extending the locked opt-in slow `style-bands.acceptance.test.ts` (two `BANDS` entries plus "every bot style" titles), not by a new file. | A new slow file for the CS and Maniac bands only, or for all four (which repeats 3×100k runs). | One run per seed checks all four styles together, which is exactly AC#4. There is no logic change and no extra slow time. | yes | user (Q-1, Q-3, auto-accepted) |
| D-6 | Locked-test re-pins as listed in §5. Each keeps or raises its assertion count. | Avoid the edits by picking other tuning values. Any change to Calling station or Maniac play moves the seed-42 replacement timing and the pinned 0.85 draws. | The tuning necessarily changes pinned play. The re-pins state the same behaviour at the new parameters. | yes | user (Q-3, auto-accepted) |
| D-7 | The bar is applied before the deviation draw, and a demoted move consumes no draw. | Apply it after the draw. | The Calling station has no deviation for bet or raise advice anyway, so no draw would happen either way. Applying it first keeps that obvious and keeps the random stream the same as today. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/styles/calling-station.json` — add `postflopValue`.
- `src/bots/styles/maniac.json` — postflop probabilities 0.85 → 0.6, and the new `postflop/check/bet` justification (A-3).
- `src/bots/style.ts` — add `postflopValueMove`.
- `src/bots/calling-station.ts` — apply the bar, and update the doc comment.
- `src/bots/rock.ts` — use `postflopValueMove`.
- `tests/bots/calling-station-postflop.acceptance.test.ts` — new, every push (SPEC-04, SPEC-05, SPEC-06).
- `tests/bots/style-bands.acceptance.test.ts` — locked re-pin (TASK-6.16): bands for the Calling station and the Maniac (SPEC-01, SPEC-02).
- `tests/bots/rock-postflop.acceptance.test.ts` — locked re-pin (TASK-6.16).
- `tests/bots/maniac.acceptance.test.ts` — locked re-pin (TASK-6.4).
- `tests/playtest/replacement.acceptance.test.ts` — locked re-pin (TASK-6.8).
- `tests/playtest/cli.test.ts` — unlocked unit pin (hands 15/16 → 17/18).

### Components, interfaces and data
- `src/bots/style.ts`:
  ```ts
  /**
   * Under `style.postflopValue`, the passive move (check when nothing is owed, else call) that replaces an advised
   * postflop bet or raise whose rounded equity against the calling range is at or below the threshold; undefined
   * when the advice stands (no bar, preflop/chart advice, any other action, or equity above the threshold).
   */
  export function postflopValueMove(
    style: BotStyleData,
    view: PlayerView,
    rec: Recommendation,
  ): Action | undefined;
  ```
  - The rule is exactly `rock.ts:33-44`: `value === null || rec.basis !== 'equity' || (rec.action !== 'bet' && rec.action !== 'raise')`
    → `undefined`.
  - `Math.round(rec.equityVsCallingRangePct * 10) > Math.round(value.thresholdPct * 10)` → `undefined`.
  - Otherwise it returns the legal `call` when `view.currentBet - hero.streetContribution > 0`, else the legal `check`.
  - It imports only types from `../engine/*` and `../advice/recommend`. The bots import-boundary rule still holds.
- `src/bots/rock.ts` postflop branch:
  `const rec = recommend(view, advice); return postflopValueMove(style, view, rec) ?? rec.move;`
- `src/bots/calling-station.ts`, after `recommend` and before `if (options.random === undefined)`:
  `const demoted = postflopValueMove(options.style ?? CALLING_STATION_STYLE, view, advice); if (demoted !== undefined) return demoted;`
  The doc comment gains: "After the flop a style `postflopValue` bar first turns an advised bet or raise at or below
  its threshold into a check or call (no draw)."
- `calling-station.json` addition (original text, REQ-061.2):
  ```json
  "postflopValue": {
    "thresholdPct": 88,
    "justification": "After the flop the station bets or raises only when it expects to win nearly nine times in ten against the hands that would call, so it checks or calls with everything else and its postflop aggression stays inside its 10 to 25 percent band."
  }
  ```
- `maniac.json`: `postflop/check/bet` gets `"probability": 0.6` and the A-3 justification. `postflop/call/raise` gets
  `"probability": 0.6`. Nothing else changes.

### Rules and algorithms
- Calling station postflop, threshold 88 (equity rounded to one decimal):
  - Nothing owed, advice `bet` at 88.1 → bet. At 88.0 → check. At 60.0 → check.
  - Bet owed, advice `raise` at 88.1 → raise. At 88.0 → call (the legal call amount).
  - Advice `fold` with a generator → the existing `postflop/fold/call` draw, unchanged.
  - Advice `call` or `check` → unchanged.
  - The locked spot `value-bet.acceptance.test.ts:386` (8s8c on Ks 8d 7c, 93.2%) → bet, as today.
- Maniac: a draw `u` with `u < 0.6 × 2^32` plays the deviation. For example, the pinned turn spot with
  `u = 3612399516` (0.841) used to raise and now calls.
- Style stats are unchanged from TASK-6.16 (A-1). Bands (inclusive, percent, one decimal):

  | Style | VPIP | PFR | Aggression |
  |---|---|---|---|
  | TAG | 18–26 | 14–22 | 45–65 |
  | Rock | 8–15 | 6–12 | 35–55 |
  | Calling station | 45–65 | 3–10 | 10–25 |
  | Maniac | 50–75 | 35–60 | 65–85 |

### Locked-test edits (Q-3; each re-pins the same behaviour at the new parameters, and no assertion is dropped)
Unlock each file under its owner with the reason "TASK-6.17 Q-3", and log it in qa.md. Any further locked file that
fails only on re-pinnable expected values is approved the same way. The builder's first gate run confirms the list.

| File (owner) | What changes | Assertion count |
|---|---|---|
| `tests/bots/style-bands.acceptance.test.ts` (TASK-6.16) | `BANDS` gains `'Calling station': { vpip: [45, 65], pfr: [3, 10], aggression: [10, 25] }` and `Maniac: { vpip: [50, 75], pfr: [35, 60], aggression: [65, 85] }`, and the comment cites REQ-027.2/027.3. Titles become `every bot style is inside its style band over 100,000 Mixed 6-max hands (seed 42)` and `… (seeds 7 and 1234)`. | Same 5 `expect` calls; the loop covers 4 styles. |
| `tests/bots/rock-postflop.acceptance.test.ts` (TASK-6.16) | `:153-155`: the loop over `[TAG, MANIAC, CS]` asserting `postflopValue` null becomes a loop over `[[TAG_STYLE, null], [MANIAC_STYLE, null], [CALLING_STATION_STYLE, 88]]` asserting `style.postflopValue?.thresholdPct ?? null` equals the expected value. The title is kept (A-6), with a comment. | Same (one `expect` in the loop). |
| `tests/bots/maniac.acceptance.test.ts` (TASK-6.4) | `:160-161` probability `0.85` → `0.6`. Example C (`:283`, `:294`): the comment becomes "u ≥ 0.6 threshold, the Maniac calls like TAG" and the expected move becomes `{ seat: 1, type: 'call', amount: 8 }`. | Same. |
| `tests/playtest/replacement.acceptance.test.ts` (TASK-6.8) | `:150` `firstReplaced` = the first hand with a replacement **and** a seat whose style differs from hand 1's line-up. Only those hands print `--styles`. Seed 42's first replacement (hand 18) now redraws the same style. | Same. |

The unlocked `tests/playtest/cli.test.ts:600-603` changes its comment to "takes effect at hand 18", and its pairs
become `['17', 0], ['18', 1]`.

### Error handling and configuration
- An invalid `postflopValue` in `calling-station.json` throws `StyleValidationError` at import, with the existing
  messages (prefix `calling-station.json: style Calling station postflopValue …`).
- `postflopValueMove` can't find no legal passive move: the advice bets only when nothing is owed (so check is
  legal) and raises only when a bet is owed (so call is legal) (`src/engine/hand.ts:342-350`). It keeps the Rock's
  `as Action`.
- No new configuration, CLI options or dependencies.

## 6. Behaviour specification

### SPEC-01: All four styles inside their bands at 100,000 Mixed 6-max hands on seed 42
- Verifies: AC#1, AC#2, AC#4, DoD#2
- Behaviour: Given a 100,000-hand Mixed 6-max cash playtest with seed 42, When it completes, Then it plays 100,000
  hands with 0 violations. The bot-seat Calling station measures VPIP within [45, 65], PFR within [3, 10] and
  aggression within [10, 25]. The Maniac measures VPIP within [50, 75], PFR within [35, 60] and aggression within
  [65, 85]. TAG and the Rock stay inside their TASK-6.16 bands. All values are percent, one decimal, bounds inclusive.
- Verification: acceptance `tests/bots/style-bands.acceptance.test.ts::every bot style is inside its style band over 100,000 Mixed 6-max hands (seed 42)` (opt-in slow: `npm run test:slow`)

### SPEC-02: Same bands on seeds 7 and 1234
- Verifies: AC#3, AC#4, DoD#2
- Behaviour: Given the same run with seed 7, and separately with seed 1234, When each completes, Then all four styles,
  including the Calling station and the Maniac, are inside the SPEC-01 bands for both seeds.
- Verification: acceptance `tests/bots/style-bands.acceptance.test.ts::every bot style is inside its style band over 100,000 Mixed 6-max hands (seeds 7 and 1234)` (opt-in slow; one `it` per seed, 600 s timeout each)

### SPEC-03: CLI check-styles run and its CI job are deferred to TASK-6.11
- Verifies: AC#1, AC#2, AC#3, AC#4, DoD#1
- Behaviour: Given that `--check-styles` doesn't exist yet (TASK-6.11), When this task is judged, Then AC#1–4 are
  verified by SPEC-01/02. TASK-6.11 carries two follow-up ACs:
  - (a) AC#8 extended to all four styles, re-running `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed <s>`
    for s = 42, 7 and 1234 and expecting exit 0.
  - (b) That run added to a nightly or on-demand (`workflow_dispatch`) CI job (Q-1, Q-2).
  This task adds no CLI or workflow code.
- Verification: manual Judge confirms that `backlog task view TASK-6.11 --plain` lists both follow-up ACs and that SPEC-01/02 pass under `npm run test:slow`.

### SPEC-04: The Calling station bets or raises after the flop only above its 88% value bar
- Verifies: AC#1, AC#3, DoD#2, DoD#3
- Behaviour: The station keeps an advised postflop bet or raise only above 88.0% equity against the calling range.
  - Given a heads-up flop view (Ks 8d 7c) where the advice bets with nothing owed, and a fixed equity seam, When
    `decideCallingStation` decides (with and without a `random` generator), Then it bets at 88.1% and checks at 88.0%
    and 60.0%.
  - Given a view where the advice raises with a bet of 4 owed, Then it raises at 88.1% and calls 4 at 88.0%.
  - When the advice is call or check, the station plays it unchanged.
  - A demoted move consumes no draw: a counting generator shows 0 calls to `nextUint32`.
  - `recommend` still returns bet/raise in those views, so the user's advice is unchanged.
  - On the 8s8c Ks 8d 7c spot with `BOT_EQUITY`, the station still bets $4.
- Verification: acceptance `tests/bots/calling-station-postflop.acceptance.test.ts::the Calling station bets or raises after the flop only above its 88% value bar`

### SPEC-05: Style files carry the justified Calling station bar and the Maniac's 0.6 postflop deviations
- Verifies: AC#1, AC#2, DoD#10
- Behaviour: Given the shipped style files, When parsed, Then:
  - `CALLING_STATION_STYLE.postflopValue` is `{ thresholdPct: 88, justification }`, with a justification of at
    least 10 words.
  - The Calling station description still has at least 15 words and contains "hardly ever bets on its own".
  - The Maniac's `postflop/check/bet` and `postflop/call/raise` deviations have probability 0.6. Its `postflop/check/bet`
    justification contains "more often than not" and not "almost every time".
  - Rock keeps `thresholdPct` 75, and TAG and the Maniac have `postflopValue === null`.
- Verification: acceptance `tests/bots/calling-station-postflop.acceptance.test.ts::the Calling station holds a justified 88% value bar and the Maniac bets or raises after the flop at 0.6`

### SPEC-06: An invalid Calling station bar is rejected with a clear problem
- Verifies: AC#1, DoD#2
- Behaviour: Given copies of `calling-station.json`, When `parseStyle(copy, 'calling-station.json')` runs, Then it
  throws `StyleValidationError` whose `problems` contain exactly the matching message:
  - `thresholdPct` 49.9 or `"88"` → `calling-station.json: style Calling station postflopValue must have a thresholdPct from 50 to 100`.
  - A 9-word justification → `calling-station.json: style Calling station postflopValue has no justification (at least 10 words)`.
- Verification: acceptance `tests/bots/calling-station-postflop.acceptance.test.ts::a bad Calling station postflopValue block is rejected with a clear problem`

### SPEC-07: Rock behaviour is unchanged after the refactor
- Verifies: DoD#2, DoD#3
- Behaviour: Given the Rock now uses `postflopValueMove`, When the locked TASK-6.16 Rock tests and `tests/bots/rock.test.ts`
  run, Then they pass unchanged (75.1 bets or raises; 75.0 checks or calls; preflop path untouched).
- Verification: acceptance `tests/bots/rock-postflop.acceptance.test.ts::the Rock bets or raises after the flop only above its 75% value bar`

### SPEC-08: Re-pinned replacement and CLI tests follow the new seed-42 bust timing
- Verifies: DoD#2, DoD#3
- Behaviour: Given seed 42 Mixed 6-max cash, When 17 hands are played, Then `Bots replaced: 0`. When 18 are played,
  Then `Bots replaced: 1`. When the first hand whose replacement changed a seat's style is flagged as a violation,
  Then the printed Replay line ends with `--lineup mixed --styles <slugs>` and reproduces the hand.
- Verification: acceptance `tests/playtest/replacement.acceptance.test.ts::a violation after a replacement prints a Replay line that reproduces the hand`

### SPEC-09: Project checks, coverage, boundaries and network
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#9, DoD#11
- Behaviour: Given the change, When lint, typecheck and the full suite with coverage run locally and in CI on the
  branch, Then all pass with zero errors. That includes `tests/playtest/cli.test.ts`, the golden-spot suite and the
  bots import-boundary test. Coverage is at least 90% for bots and at least 70% overall. No network code is added.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-10: 10,000-hand Mixed playtest has zero invariant violations, and the default playtest output is unchanged
- Verifies: DoD#7
- Behaviour: Given the change, When `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42` runs, Then it
  reports `Invariant violations: 0` and exits 0. `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` still
  gives `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98`.
- Verification: command `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42 && npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`

### SPEC-11: Non-applicable DoD items and story documentation
- Verifies: DoD#8, DoD#12, DoD#13
- Behaviour: No screen or dialog is added or changed, so Playwright, axe and offline checks don't apply (DoD#8,
  DoD#13). The doit docs stage writes the story documentation and publishes it to Backlog.md (DoD#12).
- Verification: manual Judge confirms that `git diff --stat` touches no `src/ui/**` or `e2e/**` file and that the story doc is published (`backlog doc list --plain`).

## 7. Edge cases
- The threshold boundary (88.0 vs 88.1, one-decimal rounding): SPEC-04.
- A short stack facing a bet: `call` is always legal when a bet is owed (`hand.ts:342-343`). SPEC-04 uses the legal
  call amount.
- No-generator callers (`decideCallingStation(view)`): the bar still applies (A-4). The locked
  `value-bet.acceptance.test.ts:386` spot (93.2%) still bets (SPEC-04).
- The Maniac's deviation falls back on a capped street: that path is unchanged (`maniac.ts:36-40`), and only the
  probability changes.
- Small samples from line-up drift: the Calling station gets as few as 2.5k–3.5k hands per seed. Margins are at least
  6 SE (§3). D-4 / Q-4.
- Other table sizes: the bar doesn't depend on table size. REQ-027 bands are 6-max only.
- Concurrency, permissions, interruption: N/A (pure, synchronous decision).

## 8. Security considerations
- Trust boundary: style JSON is bundled, authored content, validated at import by the existing `parseStyle` checks.
  No user input reaches it.
- No authn/authz, secrets, logging, network or new dependencies.
- Randomness: the Calling station's bar draws nothing (D-7). The Maniac keeps its seeded per-decision generator
  (REQ-028.1), so replay (REQ-013.3) stays deterministic. Only the probability compared against changes.

## 9. Non-functional
- Every-push: the new acceptance file uses fixed equity seams and three views, under 2 s.
- The opt-in slow band test stays 3 × 100,000 hands (about 2.5 min each) and only adds two map entries. It runs only
  with `TLH_SLOW_TESTS=1`, never on every push or in CI shards (standing rule).
- Bot decision cost: one comparison after the existing `recommend` call.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (the `--check-styles` CLI run follows in TASK-6.11, Q-1)
- New and changed tests:
  - `tests/bots/calling-station-postflop.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06 (every push, new).
  - `tests/bots/style-bands.acceptance.test.ts` → SPEC-01, SPEC-02 (locked re-pin, opt-in slow).
  - `tests/bots/rock-postflop.acceptance.test.ts` → SPEC-07 (locked re-pin).
  - `tests/playtest/replacement.acceptance.test.ts`, `tests/playtest/cli.test.ts` → SPEC-08.
  - `tests/bots/maniac.acceptance.test.ts` → SPEC-09 (locked re-pin).
- Judge end-to-end: run `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` and confirm all
  three seeds pass with the printed CS/Maniac lines inside their bands. Then run SPEC-10.

## 11. Open questions
None. Resolved in `qa.md` (all auto-accepted, recommended):
- Q-1: build now; AC#1–4 verified by the opt-in slow band test (SPEC-01/02); TASK-6.11 carries the CLI re-check for all four styles (SPEC-03).
- Q-2: DoD#1 (100k check-styles run in nightly/on-demand CI) deferred to a TASK-6.11 follow-up AC (SPEC-03).
- Q-3: D-1/D-2 approved (Calling station `postflopValue.thresholdPct: 88` via the shared helper; Maniac postflop deviations 0.85 → 0.6), plus the D-6 locked re-pins. Files unlocked under their owners: style-bands and rock-postflop (TASK-6.16), maniac.acceptance (TASK-6.4), replacement.acceptance (TASK-6.8).
- Q-4: D-4 approved. Keep the Mixed line-up for the band test.

## 12. Clarifications log
See `doit/TASK-6.17/qa.md`.
