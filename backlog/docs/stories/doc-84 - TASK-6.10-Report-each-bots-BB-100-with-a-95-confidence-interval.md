---
id: doc-84
title: 'TASK-6.10: Report each bot''s BB/100 with a 95% confidence interval'
type: other
created_date: '2026-11-22T19:15:00Z'
updated_date: '2026-11-22T19:15:00Z'
---
# TASK-6.10: Report each bot's BB/100 with a 95% confidence interval

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-062.3, REQ-030.4 · Branch: doit/TASK-6.10

## What was asked
Every `npm run playtest` run prints, for each bot, its name, style, hands played, BB/100 and the lower and upper bounds of its 95% confidence interval. BB/100 = mean per-hand chip result / big bet x 100. The interval is mean +/- 1.96 x sample SD / sqrt(n). A busted bot and its replacement are separate rows. Spec: doit/TASK-6.10/spec.md. TASK-6.12 reads these rows to prove TAG beats weaker styles.

## Assumptions made without asking — please review
Q-1 and Q-2 were auto-accepted (autopilot), not answered by you.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Block format and placement: a `Bot results: ...` header line plus one `Bot: <name>, <style>, seat N, <n> hands, <x> BB/100, 95% CI <lo> to <hi>` line per bot, inserted between the header (`Options/Table/Line-up`) and `Hands played:`. Rows print in every run mode, including the default run. | yes | Appending at the end would break locked `endsWith` pins in the invariants and replacement acceptance tests | Move the block; update the SHA |
| Q-2 | Seats with no bot name: default runs show `Seat N` with style `TAG` at size 6, else `Random`. In line-up runs seat 1 is `User`, style `TAG`. | yes | AC#1 needs a name and style per row. TASK-6.12 reads the seat-1 TAG row | Change the label in `winrate.ts` |
| A-1 | Per-hand result = final stack - starting stack, in chips. Hands stopped by a violation (or with `violations > 0`, or no result) count toward no bot. | yes | Abandoned hands strand chips in the pot. Runs with violations already exit 1 | Count them as 0 |
| A-2 | A bot is keyed by (seat, name, style). Rows are ordered by seat, then first counted hand. After a violation restart, preset bots merge back into their earlier rows. | yes | Replacement names are unique within a table run | One row per stint |
| A-3 | Big bet = `GAMES[game].stakes.bigBet`: $8 cash, 40 chips sit-and-go (the playtest stays at level 1). | yes | No blind levels in the playtest | Omit sng rows |
| A-4 | Replay mode (`--replay-code`) prints no rows. | yes | One hand gives no interval | Print `n/a` rows |
| A-5 | O(1) Welford accumulator per bot, no per-hand list. Rows grow with busts (about 0.3% of hands; roughly 3,400 rows for a 1M-hand line-up run). | yes | Keeps the runner's constant memory in hands | Cap or collapse rows |
| A-6 | Values use `toFixed(2)`; `-0.00` prints `0.00`; under 2 hands the interval is `n/a`. | yes | Deterministic, AC asks for 0.01 precision | Other rounding |

Known quirk (review MINOR #2, accepted and documented, not fixed): after a violation restart the replacement-name position resets, so a later "Jay" can merge with an earlier, different "Jay" in the same seat if the style also matches. This only affects runs that already fail with exit 1. A-2's rationale holds per table run, not across restarts.

## Clarifications and decisions
- D-1: block goes before `Hands played:`; `formatReport`, summary lines, violation block and `Bots replaced:` are untouched.
- D-2: the default run output changes, so the spec-cited baseline SHA moves (see below).
- Baseline SHAs for later specs (`npm run -s playtest -- --hands 10000 --seed 42 --size 6`):
  - NEW full default-run SHA: `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc`
  - Old SHA `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` is recovered with `| grep -v '^Bot' | shasum -a 256` (SPEC-07).

## What was built
- `src/playtest/winrate.ts` (new): `Tally`/`addResult` (Welford), `winRate`/`winRateOfTally`, `BotResults` tracker fed by `PlayedHand`, `formatBotResults`.
- `src/playtest/cli.ts`: run mode feeds every hand to `BotResults` through the existing `onHand` callback and prints the block before `Hands played:`. Million-tool shard sections carry the block too.
- Tests: `tests/playtest/bot-results.acceptance.test.ts` (6, SPEC-01..06), `tests/playtest/winrate.test.ts` (4 cases, SPEC-08..11).
- Example row: `Bot: Ava, Calling station, seat 2, 812 hands, -3.21 BB/100, 95% CI -9.80 to 3.38`. In sit-and-go the header says `(big bet 40 chips)`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | AC#1-#4 and edge cases | acceptance tests | pass | gates/build-1.json, fix-2, fix-3 |
| SPEC-07 | Other lines unchanged | old SHA via `grep -v '^Bot'` | pass | `aacd5e94...e01` unchanged (build-log) |
| SPEC-08..11 | Edge cases, rounding, identity, replay | unit tests; `winrate.ts` 100% lines/branches | pass | gates |
| SPEC-12 | lint, typecheck, tests | `npm test`: 178 files passed (2 skipped), 629 tests passed (11 skipped); coverage 97.59% lines | pass | gates/*.json |
| SPEC-13 | No network use; docs published | grep manual item; this doc | see Judge | build-log |
- `npm run playtest:million -- --hands 900` and `--lineups --hands 270`: `Result: PASS`.
- Invariant violations: 0 in the 10,000-hand default run.
- Judge: see doit/TASK-6.10/judge/ (no judge artifacts existed when this doc was written).

## Review
Round 1 had no blocking findings.
- MINOR #1 (completed hand with a violation was counted): fixed. `add()` now skips `violations > 0 || final.result === null`, matching the runner's restart rule. A unit case was added and confirmed to fail without the fix.
- NIT (redundant `first` sort key): dropped; output unchanged (SHA the same).

### Non-blocking review notes (deliberately not fixed)
- MINOR #2: restart name reuse can merge two different bots (documented above).
- Security MINOR (rows-grow-with-busts): rows and memory grow with busts; accepted as A-5.
- NIT: `String(lineUpSeat.name)` would print `null` if a bot ever had a null name; the lineup module uses `as string`. Not changed.

## How to try it
- `npm run playtest -- --hands 10000 --seed 42`
- `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`
- `npm run playtest -- --game sng --hands 2000`
- `npm run playtest:million -- --hands 900`

## Run metrics
Questions: 2 (auto-accepted) · assumptions: 6 · review rounds: 1 · judge rounds: pending · gate runs: 3 (build-1, fix-2, fix-3) · escalations: 0 · changed lines: 577 (build gate).

## Known limitations and follow-ups
- Per-style VPIP, PFR and aggression: owned by TASK-6.11 (existing). [trainer]
- TAG-beats-weaker-styles runs and per-seat `--lineup` lists: owned by TASK-6.12 (existing). [trainer]
- Pooling win rates across million-tool shards: no owning task found; TASK-6.12 may need it for large samples. Orchestrator to decide whether to add an AC to TASK-6.12. [trainer]
- BB/100 in the app UI / Statistics screen: owned by the statistics epic (TASK-11, AC #1 BB/100 trend charts). [trainer]

## Lessons for the factory (proposals — not applied)
- When a spec cites an output baseline SHA, have the spec state up front that adding output lines moves it, and give both SHAs (full and filtered). Here the baseline had to be split in two.
