---
id: doc-82
title: 'TASK-6.8: Replace a busted bot with a new bot from the line-up preset'
type: other
created_date: '2026-11-22T17:46:00Z'
updated_date: '2026-11-22T17:46:00Z'
---
# TASK-6.8: Replace a busted bot with a new bot from the line-up preset

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-007.5, REQ-007.7, REQ-007.8, REQ-009.4, REQ-062.4 · Branch: doit/TASK-6.8

## What was asked
In a cash game a bot that ends a hand on $0 leaves, and before the next hand a new bot takes the seat with a $160 buy-in (20 big bets at $4/$8). Its style is drawn at random from the styles the session's line-up gives at the table size (all four for Custom). Its name is unique at the table. A bot with $1 or more keeps seat and stack. The same rule replaces the playtest's stack restore for `--lineup` cash runs, and a 10,000-hand `--lineup mixed` run must show zero violations. Spec: doit/TASK-6.8/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Every draw uses the preset chosen at session start (`config.lineUp`), even after replacements change seat styles. | yes | REQ-007.5 says "the session's line-up preset". | Re-resolve the line-up name after each replacement (would drift to Custom). |
| A-2 | "Current table size" = `config.players` (cash seats are never empty). | yes | Every cash seat is dealt in. | Count dealt-in seats. |
| A-3 | Several busts in one hand are replaced in ascending seat order, each taking the next name. | yes | Deterministic. | Random order. |
| A-4 | A playtest table restarted after a violation returns to the preset line-up and the name sequence restarts. | yes | A restarted table is a new table. | Keep replaced seats across the restart. |
| A-5 | The playtest Table line keeps its text ("a busted seat rebuys for $160") in `--lineup` runs; `Bots replaced:` reports replacements. | yes | Three locked tests pin that text. | Use a different Table line in `--lineup` runs. |
| A-6 | `nextHand` throws `RangeError('No replay code to draw a new bot from')` if a bot must be replaced with `replayCode` null. | yes | Only hand-built states hit it. | Fall back to a fixed code. |

state.json logs `assumptions: 0`; these six are the spec's own Assumptions table.

## Clarifications and decisions
- Q-1 (D-1): the style draw is seeded from the finished hand's replay code and seat (`fnv1a32(code/seat/replace)`), uniform over the distinct allowed styles. No crypto draw, so replays work. Approved.
- Q-2 (D-2): new bots are named Jay, Kit, Lou … Zed (17 names), then "Jay 2" …, never reused in a session, skipping names already seated. Approved.
- Q-3 (D-4, D-5): default playtest output is unchanged. `--lineup` cash runs replace bots and print `Bots replaced: <n>`. The Replay line gains `--lineup <name> --styles <slugs>` when styles differ from the preset, and replay mode accepts `--styles`. Approved.
- Q-4: three locked-test edits approved: TASK-3.4 `next-hand.acceptance` (seat 1 is now new bot Jay; the 60-hand test asserts the $94 bot keeps $94 instead of `topUps > 0`), and TASK-1.52 `policy-lineup.acceptance` (Tough run 200 → 45 hands). The TASK-1.52 file was not actually locked; the approval is recorded in the notes.
- D-3: allowed styles come from `seatLineUp(preset, size, 1)`. D-6: the TEMPORARY top-up stays for the user seat and sit-and-go. D-7: no bot `id` field; the never-reused name is the instance key.
- RECORDED DEVIATION: `drawReplacementStyle` lives in `src/table/session.ts`, not `src/bots/lineup.ts`, because the `tests/bots/tag.test.ts` boundary test forbids `src/bots/*` importing engine runtime code. Signature, seeding and behaviour are as specified.

## What was built
- `src/engine/bot-random.ts` — `replacementGenerator(code, seat)`.
- `src/bots/lineup.ts` — `REPLACEMENT_NAMES`, `replacementStyles`, `replacementName`, `nextReplacementName`.
- `src/table/session.ts` — `drawReplacementStyle`; `TableState.nextBotName`; cash `nextHand` replaces $0 bots ($160, drawn style, new name), keeps bots on $1+.
- `src/playtest/policy.ts` — `seatStylesPolicyFactory(seats)`; `lineUpPolicyFactory` delegates to it.
- `src/playtest/runner.ts` — `--lineup` cash runs replace busted bots; `PlayedHand.lineUp` / `replaced`; restart on violation.
- `src/playtest/cli.ts` — `Bots replaced:` line, `--styles`, USAGE line 2, Replay-line suffix.
- `package.json` — `test:slow` includes the new playtest acceptance file.
- Tests: new `tests/bots/replacement.acceptance.test.ts`, `tests/table/replace-bot.acceptance.test.ts`, `tests/playtest/replacement.acceptance.test.ts`; updated `tests/bots/lineup.test.ts`, `tests/playtest/cli.test.ts`, `tests/table/next-hand.test.ts`, `tests/support/table-scenarios.ts`; the two approved locked edits.
- Documentation SPEC item (SPEC-14): no screens, network or strategy content; the only documentation item is this story doc.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | AC#1, #2, #4, #9 | `replace-bot.acceptance`, `next-hand.test` | pass | gate fix-6 test command pass |
| SPEC-05..07 | AC#3, #7, #8 | 10,000-draw tallies | pass | same |
| SPEC-08 | AC#4, #5 | `lineup.test` | pass | same |
| SPEC-09, 11, 12 | AC#5, #6 | 300-hand runs, CLI, Replay line | pass | same |
| SPEC-10 | AC#6 | 10,000-hand `--lineup mixed` | 34 replacements, 0 violations | opt-in slow run |
| SPEC-11 | AC#6 | default 10k SHA | unchanged (`aacd5e94…e01`) | command |
| SPEC-13 | DoD | lint, typecheck, `npm test` | pass; branch CI #183 green | gates/*.json |

- Gate runs: 6 (build-1 and fix-2..5 PASS). Fix-6 reports `test command` pass but FAIL on test integrity, because the two new acceptance files were edited in the review-fix round (the in-story MINOR fixes). Scope warnings: 995 lines vs budget 700 (fail above 1400), 16 files vs 15.
- Judge: see doit/TASK-6.8/judge/.

## Review
Round 1: 0 blocking findings. Security reviewer: no findings (`--styles` validated against four slugs and the seat count; no Math.random; the draw happens after the hand ends).

### Non-blocking review notes (deliberately not fixed)
All three MINOR/NIT findings were fixed in-story (fix-brief.md): Soft check now also compares each style to `drawReplacementStyle`; `withFinalStacks` moved to `tests/support/table-scenarios.ts`; one `styleSlugs` helper. Nothing is left open.

## How to try it
- `npm run playtest -- --hands 2000 --seed 42 --lineup mixed` (prints `Bots replaced: <n>`)
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`
- `npm run test:slow` (10,000-hand Mixed run, about 72 s)

## Run metrics
Questions 4 · assumptions 6 (spec table) · review rounds 1 · judge rounds 0 so far · gate runs 6 · escalations 0 · changed lines about 995 (budget 700).

## Known limitations and follow-ups
- Bot top-up removal in cash is partly done: bots no longer get topped up in cash, but the user seat and sit-and-go keep the TEMPORARY top-up. TASK-3.21 ACs #1 and #3 ("top-up removed", comment gone) remain open for the user seat; AC#1's "bot replacement at $0" is now delivered here, and AC#6 (sit-and-go never refilled) is untouched. [trainer] Add a note to TASK-3.21 that bot top-up is already gone and AC#2 ($95 stays $95) is proven for bots by `replace-bot.acceptance`; remaining work is the user seat and sng.
- REQ-031.3 / REQ-070.3 use the unique name as bot identity (no id field, D-7). [trainer] Note on TASK-4.7 (initials avatar badge) and TASK-3.14 (observed stats on hover): bot identity is the never-reused name (Jay…Zed, then "Jay 2"); add an id field if they need more.
- [trainer] TASK-3.4's locked next-hand tests were rewritten for replacement; note under TASK-3.21 that its "SPEC-10/SPEC-11 tests updated" AC#3 must start from the Q-4-edited versions.
- No UI message for "bot left / joined" (not in scope).

## Lessons for the factory (proposals — not applied)
- The test-integrity gate fails when a fix round strengthens a locked test the builder itself created; allow edits to a story's own new acceptance files in fix rounds when the fix brief lists them.
- Spec said the TASK-1.52 file was locked but it was not; check lock status against state.json before writing the locked-tests table.
- The spec's file placement for `drawReplacementStyle` collided with the bots/ boundary test; the spec stage should check boundary tests when placing new functions.
- Scope budget (700 lines) was exceeded by about 40 percent; budget the tests more realistically.
