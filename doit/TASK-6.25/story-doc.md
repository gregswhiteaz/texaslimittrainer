# TASK-6.25: Keep every bot style inside its band in the Mixed line-up now that bots read opponents' actions

Status: Done · Completed: 2026-11-24 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027 (027.1-027.6), REQ-007.5/007.7/007.8, REQ-026.2/026.3, REQ-029.2 · Branch: doit/TASK-6.25

## What was asked
After TASK-7.32 the bots fold to bets, and the Maniac became a big winner (about +17 big bets/100 hands, no busts in 20,000 hands). Because a busted bot was replaced by a random preset style, Mixed seats filled with Maniacs (74% of bot seat-hands by 10,000 hands) and TAG and the Rock drifted out of their REQ-027 bands. Acceptance: every style inside its unchanged band over 100,000 hands (AC#1), the style-bands workflow commands exit 0 (AC#2), the slow check-styles test passes (AC#3). Spec: doit/TASK-6.25/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Auto-accepted. A replacement bot keeps the busted bot's style (presets and Custom). **This reverses your earlier Q-113 (REQ-007.8: random preset style).** REQ-007.5 reworded, 007.7/007.8 retired. | yes | Seat replacement was the cause of the drift. Measured: making the Maniac lose is not reachable inside its bands. | Restore the style draw from git (`drawReplacementStyle`, `replacementStyles`, `replacementGenerator`) and REQ text |
| Q-2 | Auto-accepted. Maniac postflop call-to-raise 0.6 to 0.2, new postflop fold-to-call 0.8. Rock value bar 75 to 80 and wider ranges after a raise. | yes | The only tested set that puts all four styles in band on seeds 42, 7, 1234 at 100,000 hands. | Revert maniac.json / rock.json |
| Block 1 | Locked check-styles fast test timeout 30,000 to 60,000 ms, no assertion changed (TASK-6.11). | yes | Soft-line-up runs now keep their 3 Calling stations, so the test takes about 30-34 s in the full suite (6.5 s alone). | Lower the hand count 300 to 200 instead |
| Re-pins | Locked tests re-pinned one for one with check counts kept (reason "TASK-6.25 Q-1/Q-2"): maniac, calling-station-postflop, rock, rock-postflop, bots/replacement, playtest/replacement, table/replace-bot acceptance tests, plus session-records (not locked). | yes | Values they pinned are the ones this story changes. | Git revert of those files |
| A-1 | `nextHand` no longer throws "No replay code to draw a new bot from". | yes | The throw only guarded the draw. | Keep as invariant |
| A-2 | Custom sessions also keep the busted bot's style. | yes | One rule. | Keep a four-style draw for Custom |
| A-3 | `replacementGenerator`, `replacementStyles`, `drawReplacementStyle` deleted with their unit tests. | yes | Dead code otherwise. | Restore from git |
| A-4 | Maniac description and justifications rewritten ("after the flop it calls most bets the pot odds say to fold"). Not shown in the UI. | yes | REQ-026.3 needs a true description. | n/a |
| A-5 | Builder may nudge P1 numbers if a seed lands within 0.3 of a band edge. | yes | Prototype ran on a scratch copy. | n/a |
| A-6 | `rtm.md` not edited by hand (dream tooling output). | yes | Same as TASK-7.32. | n/a |
| A-7 | Playtest `--styles` option kept. A Replay line prints `--styles` only for a custom `--styles` run. | yes | Still useful for replaying a given line-up. | Remove `--styles` |

## Clarifications and decisions
Q-1, Q-2 and Block 1 were auto-accepted at the recommended option (doit/TASK-6.25/qa.md). D-1: stop the drift by keeping style on replacement. D-2: retune Maniac and Rock. D-3: bands, band tests and the workflow stay untouched.

## What was built
- `src/table/session.ts` (`nextHand`) and `src/playtest/runner.ts`: the replacement takes the busted seat's current style, with a new name, a fresh buy-in and a new bot id. Random style draw code removed from `session.ts`, `src/bots/lineup.ts` and `src/engine/bot-random.ts`. Stored sessions already keep each seat's style, so the storage format is unchanged.
- `src/bots/styles/maniac.json`: postflop call-to-raise 0.2, new postflop fold-to-call 0.8, new description. The deviation pair was already allowed, so no code change.
- `src/bots/styles/rock.json`: `postflopValue.thresholdPct` 80, wider HJ/CO/BTN raise, CO/BTN raise-and-call and SB blind-defence ranges (still strict subsets of the TAG chart), justifications updated.
- Docs: `dreams/limit-holdem-trainer/requirements.md` (REQ-007.5 reworded, 007.7/007.8 retired, changelog 1.11), `docs/advice/postflop-rules.md`.
- Tests: new `tests/playtest/mixed-composition.acceptance.test.ts` (fast, SPEC-04); re-pins listed above; `tests/table/next-hand.test.ts`, `tests/bots/lineup.test.ts`, `tests/bots/maniac.test.ts`, `tests/bots/style.test.ts` updated; check-styles `FAST_TIMEOUT_MS` raised.
- 22 files, 554 changed lines (spec budget 22 files, 650 lines).

Final 100,000-hand results (V/P/A), all inside the unchanged bands:

| Seed | TAG | Station | Maniac | Rock |
|---|---|---|---|---|
| 42 | 20.4/14.6/59.5 | 60.5/7.2/18.7 | 56.1/53.2/82.3 | 8.7/7.2/50.1 |
| 7 | 20.6/14.8/59.3 | 60.2/6.8/18.4 | 56.1/53.2/82.2 | 8.8/7.3/49.5 |
| 1234 | 20.6/14.8/59.3 | 60.3/7.1/18.2 | 55.8/52.9/82.2 | 8.8/7.3/50.6 |

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | slow style-bands test, 3 seeds | PASS | judge/round-1.json (slow style-bands + check-styles: 15 tests, exit 0) |
| SPEC-02 | AC#2 | CLI loop on seeds 42, 7, 1234 | PASS | each "Style check: passed", 0 violations |
| SPEC-03 | AC#3 | slow check-styles test | PASS | same run |
| SPEC-04 | AC#1, AC#3 | mixed-composition acceptance test; real app run | PASS | style multiset constant; app Mixed: Eli (TAG) to Jay (TAG), Ben (Calling station) to Kit (Calling station) |
| SPEC-05 | AC#1, AC#3 | maniac acceptance test | PASS | re-pinned parameters |
| SPEC-06 | AC#1 | all-TAG playtest SHA-256 | PASS | d9800984...b8a3 unchanged |
| SPEC-07 | AC#1 | grep of requirements and docs | PASS | reviewer and judge |

- `npm test`: 281 files passed, 4 skipped; 1310 tests passed, 45 skipped. Typecheck and lint exit 0. Playwright: 304 passed, 16 skipped.
- Gate run 1 PASS. Judge round 1 PASS 7/7, test-integrity check clean. No send-backs.

## Review
One review round (code, security). No blocking findings. Security: no reachable vulnerability. A resumed session's style is already validated, and the one change is that old replay lines that involved a bust now replay under the same-style rule (covered by A-7).

### Non-blocking review notes (deliberately not fixed)
- MINOR `src/playtest/cli.ts`: `replacedStylesOption` can never return a value in a real run now (also judge J-1-02). Dead code with a stale comment.
- MINOR `src/bots/styles/rock.json`: the CO raise justification omits the AJo offsuit addition.
- NIT `src/bots/styles/maniac.json`: wording of the fold-to-call justification.
- NIT `tests/bots/replacement.acceptance.test.ts`: `tally()` still loops 10,000 replay codes though no draw uses them.
- Judge J-1-01: `PlaytestOptions.lineUp` comment in `runner.ts` still says "drawn from the preset".
- Judge J-1-03: the band-edges fast test has about 1.8x headroom under the new 60 s limit.

## How to try it
- `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42` (also 7 and 1234); expect `Style check: passed`.
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts tests/playtest/check-styles.acceptance.test.ts`
- `npm test` for the fast suite, including the new composition test.

## Run metrics
Questions 2 (plus Block 1) · assumptions 7 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 554 over 22 files.

## Known limitations and follow-ups
- [trainer] The Maniac is still a strong winner (about +12 BB/100); this bears on TASK-6.12 (TAG beating weaker tables). Owner: TASK-6.12.
- [trainer] TAG PFR is only 0.6 above its band floor at 100,000 hands (about 6 standard errors). Any later change to TAG or the Maniac needs a re-run of the style bands. Pin in the owning style-bands story, TASK-6.17.
- [trainer] Delete `replacedStylesOption` in `src/playtest/cli.ts` and adjust the `cli.test.ts` test that exercises it; update the stale `PlaytestOptions.lineUp` comment in `runner.ts`. Owner: TASK-6.8.
- [trainer] Add AJo offsuit to the Rock CO raise justification, fix the Maniac fold-to-call wording, and stop `tally()` looping 10,000 codes in `tests/bots/replacement.acceptance.test.ts`. Owner: TASK-6.5 (Rock) / TASK-6.8.

### Not tracked (infra, below the value bar)
- The band-edges fast test sits at about 30-34 s in the full suite (60 s limit now). It did not fail at the new limit; no action unless it grows.

## Lessons for the factory (proposals — not applied)
- The locked check-styles fast test hit its timeout only because the line-up now keeps Calling stations. Spec prototypes should also run the full suite once (the prototype did, which found 13 failures) and report the slowest locked test, so timeout bumps are planned in the spec rather than found in build.
- Reversing an earlier user decision (Q-113) was auto-accepted. Autopilot should list such reversals in the final summary head line (done here), so the user sees them first.
