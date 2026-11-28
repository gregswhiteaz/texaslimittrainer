# Spec: TASK-6.31 — Judge the one-action style check only on mixed spots seen at least 10 times

Status: READY (approved 2026-11-28)
Task: TASK-6.31 · Parent/epic: TASK-6 · Requirements: REQ-028 fit criterion (reworded by TASK-6.30, decision-9), REQ-028.3, REQ-027 · Dream: limit-holdem-trainer

## 1. Summary
`--check-styles` fails a run when a mixed spot used only one action, even when the spot came up once. TASK-6.30
(decision-9, Q-1 B, N = 10) reworded the REQ-028 fit criterion so a mixed spot is judged only when it came up at
least 10 times (recommended + alternative >= 10). This task applies that rule in `formatStyleReport`: spots with 1
to 9 decisions keep their `Mixed spot:` line and get a separate `Not judged (fewer than 10 decisions): <style>
<spot>` line, and do not fail the check; 0/0 spots pass as today. It re-pins the tests that depended on the old
rule, updates the `--help` text and the docs. Re-measured on current main (29ec6ce0, after TASK-7.40/7.41/7.42):
the 3-seat 100,000-hand run that motivated the story now already exits 0, because TAG `preflop-limpers` no longer
comes up there at all (0/0), so AC#3 (reworded by Q-1) asks only for exit 0 and `Style check: passed` there; the `Not judged` line is proven
end to end by a new fast 1,000-hand Mixed 6-max run that fails today (SPEC-09).

## 2. Scope
- In scope:
  - `src/playtest/style-check.ts`: export `MIN_JUDGED_DECISIONS = 10`; in `formatStyleReport` judge a spot only
    when `recommended + alternative >= 10`; print the `Not judged` lines (§5).
  - `src/playtest/cli.ts:60` `--check-styles` usage sentence (A-1) and its two copies in `tests/playtest/cli.test.ts`
    (`:115`, `:632`).
  - `tests/playtest/style-check.test.ts`: move the `formatStyleReport` assertions now at `:254-280` (inside
    "mixed decisions are classified only ...") into a new test named in SPEC-01, re-pin 5/0 and 0/5 to the
    10-decision boundary and add the not-judged cases (SPEC-01, SPEC-02).
  - Locked `tests/playtest/check-styles.acceptance.test.ts` (owners TASK-6.11 and TASK-6.25): only the fast
    `mixedSpots(300)` call becomes `mixedSpots(1000)` (SPEC-04, A-2).
  - Locked `tests/playtest/check-styles-three-seats.acceptance.test.ts` (owner TASK-7.46): assert exit 0 and
    `Style check: passed` again, and reword the `:8-9` comment to cite the REQ-028 fit criterion (SPEC-03, Q-1).
  - New fast acceptance test `tests/playtest/check-styles-not-judged.acceptance.test.ts` running the user's command
    on a real run that has 1–9 spots (SPEC-09, A-6).
  - Docs: `docs/stats/style-stats.md:76-90` and `docs/advice/range-model.md:284-297` (SPEC-06, A-3).
- Not doing:
  - Any change to bot behaviour, charts, mixing frequencies, `StyleCheck.add`, `MixedCounts` or the counters (task:
    "no new counter").
  - Any change to the band check, `STYLE_BANDS`, REQ text (TASK-6.30 already reworded REQ-028), the CI workflow
    `.github/workflows/style-bands.yml`, or `tests/playtest/style-check-short-handed.test.ts`.
  - Changing the `Mixed spot:` or `One action only:` line formats.
  - Changing the slow twin `mixedSpots(1000)` or any other case of the locked check-styles file (A-2).
  - A new slow test; the 100,000-hand runs stay only in the opt-in `npm run test:slow` group.
- Scope budget: files=9, lines=150   (style-check.ts ≈ 12, cli.ts 1, cli.test.ts 2, style-check.test.ts ≈ 30,
  check-styles.acceptance 1, three-seats acceptance ≈ 8, new not-judged acceptance ≈ 35, style-stats.md ≈ 8,
  range-model.md ≈ 15)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | New `--check-styles` usage line (one line, same position): `--check-styles: exit 1 unless every seated bot style's VPIP, PFR and aggression is inside its target band and every mixed spot that came up at least 10 times used both actions (rarer spots are listed as not judged); the bands are judged over 100,000 hands (REQ-027), so shorter runs can fail from sample noise` | yes | Developer CLI help, not trainer UI; smallest edit to the current sentence (`src/playtest/cli.ts:60`) that states the AC#5 rule. | Put the minimum in a separate usage line; name REQ-028 in the text |
| A-2 | The fast never-mixing case is re-pinned from `mixedSpots(300)` to `mixedSpots(1000)`; the slow twin `mixedSpots(1000)` ("original hand counts", TASK-6.25) stays as is, so both now run 1,000 hands. | yes | Measured (§3): a never-mixing TAG sees `preflop-unopened` 8 times at 300 hands (below 10, so the case would stop failing), 17 at 600 and 34 at 1,000; 1,000 is the task's suggestion and gives a 3.4x margin against later chart changes. One playtest of 1,000 hands takes about 2 s, so the case (three runs) stays well under its 60 s `FAST_TIMEOUT_MS`. The slow twin's label stays true and editing it is not needed by any AC. | 600 hands (17 decisions, ≈ 1.1 s per run); bump the slow twin to 2,000 |
| A-3 | Doc wording (§5 "Docs"): `docs/stats/style-stats.md` gains the 10-decision rule sentence; `docs/advice/range-model.md` updates the 3-seat table row "100,000 hands, after" to `exit 0` and replaces the `:293-297` paragraph with the current measurement, citing the REQ-028 fit criterion instead of REQ-027.5. | yes | Developer docs; the facts are measured in §3. | Leave the old table row and add a new row |
| A-4 | `Not judged` lines go directly after the last `Mixed spot:` line, before any `Outside band:` and `One action only:` lines, in the same style/spot order as the `Mixed spot:` lines. | yes | AC#1 says "follows the Mixed spot lines"; keeps all mixed-spot information together; no test filters break (§3). | After the `One action only:` lines |
| A-6 | AC#1 is shown end to end by a new fast acceptance test running `--hands 1000 --seed 42 --lineup mixed --size 6 --check-styles`: today it exits 1 only from `One action only` on limpers 2/0 and raise-and-calls 1/0 (no `Outside band` line, §3), so after the change it must exit 0 with two `Not judged` lines. | yes | The only fast real run found that has 1–9 spots and no band failure; a new file, so no locked file grows. | Add the case to the locked check-styles file (needs both owners again); unit test only |
| A-5 | A spot seen 1 to 9 times is "not judged" even when it used both actions (e.g. 3/4). | yes | TASK-6.30 D-1: "spots with 1 to 9 decisions are listed on a separate Not judged line"; one rule, no special case. | List only 1–9 spots that used one action |

## 3. Current system
- The rule today: `formatStyleReport` (`src/playtest/style-check.ts:159-207`) prints a `Mixed spot:` line per TAG
  mixed spot (`:192-194`) and adds `One action only: <style> <spot>, recommended <r>, alternative <a>` when exactly
  one count is above 0 (`:195-197`); `Outside band` then `One action only` lines follow (`:200`), then
  `Style check: passed|failed` (`:201`). The CLI exits 1 on `passed === false` (`src/playtest/cli.ts`, the
  `--check-styles` branch). 0/0 passes (TASK-6.11 A-6). Only TAG has mixed spots: unopened, limpers, raise,
  raise-and-calls, blind-defence (`src/bots/styles/tag.json:6`; `SPOT_TYPES` order `src/bots/style.ts:22-29`).
- Requirement: REQ-028 fit criterion (`dreams/limit-holdem-trainer/requirements.md:528`) already reads "harness
  shows each mixed spot type that came up at least 10 times in the run uses more than one action" (change log 1.19,
  `:1379`). REQ-027.5 is not the source of the rule (TASK-6.30 D-3), so the comments at
  `tests/playtest/check-styles-three-seats.acceptance.test.ts:8-9` and `docs/advice/range-model.md:294` that cite
  REQ-027.5 are wrong.
- Usage text: `src/playtest/cli.ts:60` "... and every mixed spot used both actions; ..."; asserted verbatim in
  `tests/playtest/cli.test.ts:115` (whole `USAGE`) and `:632` (`usage[4]`). Not locked.
- Unit test: `tests/playtest/style-check.test.ts:254-272` asserts 0/0 passes (with `Mixed spot ... 0\nStyle check:
  passed\n` adjacent, still true) and 5/0, 0/5 fail. Not locked.
- Other readers of the report lines, unaffected by an extra `Not judged` line: `tests/playtest/cli.test.ts:640-641`
  (line after `Style check:` is `Bot results:`), `tests/playtest/style-check-short-handed.test.ts:89` (filters
  `Mixed spot: TAG `), the slow 6-max test's block filter (`tests/playtest/check-styles.acceptance.test.ts:396-398`),
  the three-seats test filter (`:25`), and the `mixedSpots` regex on `Mixed spot:` lines (`:253`).
- Locks (from every `doit/*/state.json` `locked_tests`): `tests/playtest/check-styles.acceptance.test.ts` — TASK-6.11
  and TASK-6.25; `tests/playtest/check-styles-three-seats.acceptance.test.ts` — TASK-7.46. No other file this task
  touches is locked (`tests/stats/style-stats.acceptance.test.ts`, TASK-7.12, is not touched).
- The never-mixing case: `mixedSpots(hands)` (`tests/playtest/check-styles.acceptance.test.ts:241-272`), fast call
  `mixedSpots(300)` at `:358-362` (`FAST_TIMEOUT_MS = 60_000`, `:32`), slow twin `mixedSpots(1000)` at `:363-367`.
  It runs three playtests: plain `--check-styles`, never-mixing TAG via `seamFor('TAG', () => (view) =>
  decideTag(view))`, and a shared plain run.
- How tests run: vitest (`npm test` = `vitest run --coverage`); opt-in slow group `npm run test:slow`
  (`TLH_SLOW_TESTS=1`, includes both check-styles acceptance files, `package.json` `test:slow`).

### Re-measured on current main (29ec6ce0), seed 42
3 seats, all-TAG, 100,000 hands (`npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles`), today's
code: exit 0, `Style check: passed`, TAG VPIP 23.6, PFR 17.3, aggression 65.2; mixed spots unopened 5193/1747,
**limpers 0/0**, raise 0/0, raise-and-calls 0/0, blind-defence 3951/1359. So no spot is in 1–9 and the run prints no
`Not judged` line before or after this change (TASK-6.30 measured limpers 1/0 before TASK-7.40–7.42).

All 100,000-hand runs on current main, today's code (recommended / alternative):

| Run | unopened | limpers | raise | raise-and-calls | blind-defence | exit (why) |
|---|---|---|---|---|---|---|
| all-TAG 2, seed 42 | 2066 / 692 | 204 / 63 | 0 / 0 | 0 / 0 | 1265 / 454 | 1 (TAG VPIP, PFR, aggression outside) |
| all-TAG 3, seed 42 | 5193 / 1747 | 0 / 0 | 0 / 0 | 0 / 0 | 3951 / 1359 | 0 |
| all-TAG 4, seed 42 | 7000 / 2298 | 0 / 0 | 649 / 210 | 0 / 0 | 5346 / 1792 | 0 |
| all-TAG 5, seed 42 | 6831 / 2282 | 49 / 24 | 1195 / 386 | 9 / 5 | 5085 / 1675 | 0 |
| all-TAG 6, seed 42 | 8986 / 2941 | 59 / 19 | 1947 / 662 | 28 / 5 | 4237 / 1460 | 0 |
| all-TAG 7, seed 42 | 10519 / 3529 | 38 / 10 | 2620 / 925 | 70 / 28 | 3637 / 1205 | 0 |
| all-TAG 8, seed 42 | 6001 / 2056 | 15 / 3 | 1533 / 490 | 15 / 5 | 1287 / 442 | 1 (TAG VPIP, PFR outside) |
| all-TAG 9, seed 42 | 6743 / 2217 | 9 / 3 | 1707 / 592 | 35 / 12 | 1074 / 365 | 1 (TAG VPIP, PFR outside) |
| all-TAG 10, seed 42 | 7344 / 2517 | 10 / 5 | 2027 / 722 | 30 / 16 | 999 / 369 | 1 (TAG VPIP, PFR outside) |
| Mixed 6, seed 42 | 2699 / 894 | 332 / 99 | 696 / 247 | 10 / 4 | 1007 / 365 | 0 |
| Mixed 6, seed 7 | 2737 / 898 | 313 / 104 | 745 / 228 | 6 / 6 | 1015 / 349 | 0 |
| Mixed 6, seed 1234 | 2718 / 902 | 299 / 92 | 716 / 228 | 12 / 3 | 1042 / 327 | 0 |

No 100,000-hand run above has a spot with 1 to 9 decisions, so the new rule changes no 100,000-hand verdict. The
smallest judged spot in the REQ-027 fit-criterion runs is Mixed seed 7 `preflop-raise-and-calls` with 12 decisions
(>= 10, still judged).

6-max Mixed, seed 42, short runs (today's code):

| Hands | unopened | limpers | raise | raise-and-calls | blind-defence | Never-mixing TAG unopened |
|---|---|---|---|---|---|---|
| 300 | 6 / 2 | 0 / 0 | 4 / 1 | 0 / 0 | 4 / 1 | 8 / 0 |
| 500 | 9 / 3 | 1 / 0 | 6 / 2 | 0 / 0 | 6 / 2 | 12 / 0 |
| 600 | 11 / 5 | 1 / 0 | 6 / 4 | 0 / 0 | 9 / 3 | 17 / 0 |
| 1,000 | 25 / 8 | 2 / 0 | 10 / 4 | 1 / 0 | 14 / 5 | 34 / 0 |

At 1,000 hands the never-mixing TAG prints `One action only:` for unopened (34/0), raise (14/0) and blind-defence
(19/0); limpers (2/0) and raise-and-calls (1/0) become `Not judged`. Wall time per 1,000-hand run ≈ 1.9–2.3 s.

- Existing code to reuse:
  - `src/playtest/style-check.ts` `MixedCounts`, `mixedText`, the `oneAction` list → add the threshold there; no
    new counter or type.
  - `tests/playtest/style-check.test.ts` `report(c)` helper (`:255-256`) → the new boundary cases.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Judge a mixed spot only when recommended + alternative >= 10; 1–9 get `Not judged (fewer than 10 decisions): <style> <spot>`; 0/0 passes silently. | Keep the rule; N = 20 | Decided in TASK-6.30 | yes | user (TASK-6.30 Q-1, decision-9) |
| D-2 | The threshold is one exported constant `MIN_JUDGED_DECISIONS = 10` and the `Not judged` text uses it. | Literal 10 in two places | One source for the number | no | n/a |
| D-3 | AC#3: the 3-seat 100,000-hand run exits 0 with `Style check: passed` and no `One action only:` line, and the locked three-seats test asserts that; the `Not judged` line is proven by the new fast 1,000-hand Mixed 6-max test (SPEC-09). | Pin AC#3 to another 100,000-hand run with a 1–9 spot (none exists); keep the three-seats test band-only | The 3-seat run has limpers 0/0 on current main (§3) | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/playtest/style-check.ts` — `MIN_JUDGED_DECISIONS`, threshold in `formatStyleReport`, `Not judged` lines.
- `src/playtest/cli.ts` — `--check-styles` usage line (A-1).
- `tests/playtest/cli.test.ts` — the two usage copies (`:115`, `:632`).
- `tests/playtest/style-check.test.ts` — boundary cases (SPEC-01, SPEC-02).
- `tests/playtest/check-styles.acceptance.test.ts` — locked; `mixedSpots(300)` → `mixedSpots(1000)` only.
- `tests/playtest/check-styles-three-seats.acceptance.test.ts` — locked; exit 0 / passed assertions and comment.
- `tests/playtest/check-styles-not-judged.acceptance.test.ts` — new, fast (SPEC-09).
- `docs/stats/style-stats.md` — 10-decision rule.
- `docs/advice/range-model.md` — 3-seat table row and paragraph.

### Components, interfaces and data
- `export const MIN_JUDGED_DECISIONS = 10;` in `src/playtest/style-check.ts` (REQ-028 fit criterion).
- `formatStyleReport` signature and return type unchanged. Inside the `if (check)` block:
  ```ts
  const notJudged: string[] = [];
  // per spot, after pushing the Mixed spot line:
  const decisions = c.recommended + c.alternative;
  if (decisions >= MIN_JUDGED_DECISIONS) {
    if (c.recommended === 0 || c.alternative === 0) oneAction.push(`One action only: ${mixedText(style, spot, c)}`);
  } else if (decisions > 0) {
    notJudged.push(`Not judged (fewer than ${MIN_JUDGED_DECISIONS} decisions): ${style} ${spot}`);
  }
  // after the loops:
  lines.push(...notJudged, ...outside, ...oneAction);
  ```
  `passed` stays `outside.length + oneAction.length === 0`; `notJudged` never fails the check.

### Rules and algorithms
| recommended / alternative | Mixed spot line | Not judged line | One action only | Fails? |
|---|---|---|---|---|
| 0 / 0 | yes | no | no | no |
| 1 / 0, 9 / 0, 0 / 9, 3 / 4 | yes | yes | no | no |
| 10 / 0, 0 / 10 | yes | no | yes | yes |
| 9 / 1, 5 / 5 | yes | no | no | no |

Order of the block with check: `Style:` lines, `Mixed spot:` lines, `Not judged` lines, `Outside band:` lines,
`One action only:` lines, `Style check:` (A-4).

### Docs
- `docs/stats/style-stats.md:76-80`: "... the run exits 1 if a stat is outside its band or a mixed spot that came up
  at least 10 times used only one action; a mixed spot seen 1 to 9 times is listed as `Not judged (fewer than 10
  decisions): <style> <spot>` and does not fail the check (REQ-028 fit criterion, TASK-6.30)." Plus one sentence that
  all-TAG 3-seat `--check-styles` exits 0 over 100,000 hands (seed 42).
- `docs/advice/range-model.md:286-297`: table row "3 seats, 100,000 hands, after" → `exit 0`; paragraph replaced by
  the §3 measurement: the run exits 0; the earlier exit 1 came from the one-action rule (REQ-028 fit criterion, not
  REQ-027.5) on `preflop-limpers` 1/0; since TASK-7.40–7.42 that spot no longer comes up at 3 seats, and since
  TASK-6.31 a mixed spot is judged only when it came up at least 10 times; the three-seats slow test asserts exit 0.

### Error handling and configuration
No new errors or options. `--check-styles` exit codes unchanged in meaning (0 passed, 1 failed).

## 6. Behaviour specification

### SPEC-01: A mixed spot seen 1 to 9 times is listed as not judged and does not fail
- Verifies: AC#1, AC#2
- Behaviour: Given `formatStyleReport` with TAG counts inside every band and TAG `preflop-unopened` at 1/0, 9/0,
  0/9 or 3/4, When it reports with check, Then the text contains `Mixed spot: TAG preflop-unopened, recommended <r>,
  alternative <a>\nNot judged (fewer than 10 decisions): TAG preflop-unopened\nStyle check: passed\n`, has no
  `One action only:` line, and `passed` is true; with 0/0 there is no `Not judged` line and the text contains
  `Mixed spot: TAG preflop-unopened, recommended 0, alternative 0\nStyle check: passed\n`.
- Verification: unit `tests/playtest/style-check.test.ts::formatStyleReport judges a mixed spot only when it came up at least 10 times`

### SPEC-02: A mixed spot seen 10 or more times with one count 0 fails
- Verifies: AC#2
- Behaviour: Given the same counts with `preflop-unopened` at 10/0 or 0/10, When it reports with check, Then the
  text contains `Mixed spot: ...\nOne action only: TAG preflop-unopened, recommended 10, alternative 0\nStyle check:
  failed\n` (resp. `recommended 0, alternative 10`), has no `Not judged` line, and `passed` is false; at 9/1 it
  passes with neither line. Without check there are no `Mixed spot:` or `Not judged` lines (existing assertion kept).
- Verification: unit `tests/playtest/style-check.test.ts::formatStyleReport judges a mixed spot only when it came up at least 10 times`

### SPEC-03: The 3-seat 100,000-hand run passes --check-styles
- Verifies: AC#3, AC#6
- Behaviour: Given `npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles`, When it completes, Then
  it exits 0, prints `Style check: passed`, no `Outside band: TAG ` and no `One action only:` line, and the existing
  band assertions (aggression > 65 and <= 66) still hold.
- Verification: acceptance `tests/playtest/check-styles-three-seats.acceptance.test.ts::all-TAG 3-seat cash play passes --check-styles over 100,000 hands`

### SPEC-04: A never-mixing TAG still fails, now over 1,000 hands
- Verifies: AC#2, AC#4
- Behaviour: Given the fast never-mixing case run as `mixedSpots(1000)` (6-max Mixed, seed 42), When it runs, Then
  the plain run lists the five TAG `Mixed spot:` lines with unopened using both actions (25/8), and the never-mixing
  run exits 1 with `One action only: TAG preflop-unopened, recommended 34, alternative 0` (matched by the existing
  regex) and `Style check: failed`, within `FAST_TIMEOUT_MS`.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::--check-styles lists each mixed spot's action counts and fails a spot that used one action`

### SPEC-05: The 100,000-hand Mixed 6-max fit-criterion runs still pass
- Verifies: AC#4
- Behaviour: Given 100,000 Mixed 6-max hands on seeds 42, 7 and 1234, When each runs with `--check-styles`, Then
  each exits 0 with `Style check: passed` and no `One action only:` line (every spot there has >= 10 decisions, §3).
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::100,000 Mixed 6-max hands pass --check-styles on seeds 42, 7 and 1234` (run with `npm run test:slow`)

### SPEC-06: --help states the 10-decision minimum
- Verifies: AC#5
- Behaviour: Given `npm run playtest -- --help`, When it prints, Then the `--check-styles` line is exactly the A-1
  text, and `tests/playtest/cli.test.ts` asserts it in both places.
- Verification: command `npm run -s playtest -- --help | grep -F "every mixed spot that came up at least 10 times used both actions (rarer spots are listed as not judged)" && npx vitest run tests/playtest/cli.test.ts -t "rejects every invalid argument with its fixed message|--check-styles is a value-less run flag echoed in the Options line"`

### SPEC-07: Docs state the minimum and the 3-seat result
- Verifies: AC#6
- Behaviour: Given the story is done, When `docs/stats/style-stats.md` and `docs/advice/range-model.md` are read,
  Then both state that a mixed spot is judged only when it came up at least 10 times and that all-TAG 3-seat
  `--check-styles` exits 0 over 100,000 hands, and `range-model.md` no longer cites REQ-027.5 for the one-action rule.
- Verification: command `grep -n "at least 10 times" docs/stats/style-stats.md docs/advice/range-model.md && grep -n "exits 0" docs/stats/style-stats.md docs/advice/range-model.md && ! grep -n "REQ-027.5" docs/advice/range-model.md tests/playtest/check-styles-three-seats.acceptance.test.ts`

### SPEC-09: A real run with rare spots passes and lists them as not judged
- Verifies: AC#1, AC#3
- Behaviour: Given `main(['--hands', '1000', '--seed', '42', '--lineup', 'mixed', '--size', '6', '--check-styles'])`,
  When it completes, Then it returns 0 with empty stderr; the five `Mixed spot: TAG ...` lines include
  `Mixed spot: TAG preflop-limpers, recommended 2, alternative 0` and `Mixed spot: TAG preflop-raise-and-calls,
  recommended 1, alternative 0` unchanged; directly after the last `Mixed spot:` line come exactly
  `Not judged (fewer than 10 decisions): TAG preflop-limpers` then `Not judged (fewer than 10 decisions): TAG
  preflop-raise-and-calls`; there is no `One action only:` and no `Outside band:` line; and the next line is
  `Style check: passed`. (Today the same run prints two `One action only:` lines and exits 1, so the test fails
  before the change.)
- Verification: acceptance `tests/playtest/check-styles-not-judged.acceptance.test.ts::a 1,000-hand Mixed 6-max run lists its rare mixed spots as not judged and passes --check-styles`

### SPEC-08: Nothing else changes
- Verifies: AC#1
- Behaviour: Given the change, When the full suite, lint and typecheck run, Then all pass, and `git diff main --
  src/bots src/advice src/engine src/stats` is empty.
- Verification: command `npm test && npm run lint && npm run typecheck && git diff --exit-code main -- src/bots src/advice src/engine src/stats`

## 7. Edge cases
- 0/0: passes, no `Not judged` line (SPEC-01).
- Boundary 9 vs 10 decisions, both directions of one-action (SPEC-01, SPEC-02).
- 1–9 with both actions (A-5, SPEC-01).
- No counted hands: unchanged early return `Style check: failed, no bot hands were counted` (`style-check.ts:165-168`).
- Without `--check-styles`: no mixed-spot or `Not judged` lines (SPEC-02).
- Invalid input, concurrency, permissions: N/A (pure formatting of in-memory counts).

## 8. Security considerations
N/A: no untrusted input, no new dependency, no randomness change (bots and seeds untouched), dev-only CLI output.

## 9. Non-functional
- The fast never-mixing case runs three 1,000-hand playtests (≈ 6 s locally, 60 s timeout). 100,000-hand runs only
  in `npm run test:slow`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles`
- New/changed tests: `tests/playtest/check-styles-not-judged.acceptance.test.ts` (SPEC-09, fast, new),
  `tests/playtest/style-check.test.ts` (SPEC-01, SPEC-02), `tests/playtest/cli.test.ts`
  (SPEC-06), `tests/playtest/check-styles.acceptance.test.ts` fast case (SPEC-04), slow group (SPEC-03, SPEC-05:
  `npm run test:slow`).
- Judge scenario: run `npm run playtest -- --hands 1000 --seed 42 --lineup mixed --size 6 --check-styles` and see
  `Not judged (fewer than 10 decisions): TAG preflop-limpers` and `... TAG preflop-raise-and-calls` after the
  `Mixed spot:` lines and no `One action only:` line; run the 3-seat 100,000-hand command and see exit 0; run
  `npm run playtest -- --help`.

## 11. Open questions
- None. Q-1 answered (a) on 2026-11-28 (D-3).

## 12. Clarifications log
See `doit/TASK-6.31/qa.md`.
