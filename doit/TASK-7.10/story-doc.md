# TASK-7.10: Explain every recommendation in plain English with its numbers

Status: Done · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-036, REQ-037, REQ-061.2 · Branch: doit/TASK-7.10

## What was asked
Every recommendation (preflop and postflop) carries an `explanation`: at most 3 sentences, names at least one concept from the 10-concept list (pot odds, equity, position, hand strength, outs and draws, implied odds, value bet, bluff, opponent type, initiative) and defines it in the sentence that first names it (there is no glossary screen). Postflop text quotes the equity % and required equity % the advice returns. Templates per rule and per chart situation, written for this project. No UI in this story. Spec: doit/TASK-7.10/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | **Authored user-visible wording** (concept definitions, templates, seat/hand names) accepted as written in spec section 5 | yes | Plain English, original text (REQ-061.2) | Edit `src/advice/explanations.ts`, then the exact-copy test `tests/advice/explain.test.ts` and `docs/advice/explanations.md` |
| Q-2 | `readonly explanation: string` on both recommendation types (auto-accepted) | yes | REQ-037; hint and review read the same object | Remove field, re-pin tests |
| Q-3 | Two locked re-pins: TASK-7.3 AC#1 (`explanation: expect.any(String)`), TASK-7.8 AC#9 (key list adds `explanation`); no assertion dropped | yes | Adding a field changes the pinned shape | Revert with the field |
| Q-4 | Numbers per rule: equity % and required % on every postflop; value rules add equity vs callers and 50.0%; implied-odds adds outs and implied price; pot-odds-fold adds implied price when present; preflop quotes none | yes | AC#4; matches what each rule compared | Edit templates |
| Block 1 | Locked TASK-7.2 `preflop.acceptance` AC#6 typecheck sandbox list +8 files (explain.ts, explanations.ts, postflop.ts, equity.ts, ranges.ts, ranges/six-max.json, recommend.ts, engine/seeded-random.ts); assertions unchanged (auto-accepted) | yes | New import chain from preflop.ts | Revert list with explain.ts |
| A-1 | Percentages are `toFixed(1) + '%'` | yes | Equals the returned one-decimal number | Change `formatPct` |
| A-2 | "Names a concept" = whole-word, case-insensitive match of the concept's terms, no plurals | yes | Deterministic test oracle | Change terms |
| A-3 | Test sample = playtest machinery (seed 7310, Mixed line-up, 2–10 seats), advised with action ranges + `BOT_EQUITY` | yes | Cheap, covers all rules/situations | Change sample |
| A-4 | TASK-7.3 re-pin uses `expect.any(String)`; exact copy pinned in new unit tests | yes | Keeps that test about its own behaviour | Pin string |
| A-5 | Explanations computed for every recommendation incl. bots; playtest SHA unchanged | yes | One code path | Skip for bots |
| A-6 | Seat names: plain phrase + chart label; UTG and UTG+1 both "an early seat" | yes | Accurate at 7 and 10 seats | Rename |

Spec correction: the spec said 18 size x situation pairs; the real count in `APPLICABLE_SPOTS` is 17 (heads-up has no raise-and-calls). Tests compare to the set derived from `APPLICABLE_SPOTS`, so they are not affected.

## Clarifications and decisions
Q-1..Q-4 and Block 1 auto-accepted under the unattended rule (doit/TASK-7.10/qa.md). Decisions: D-1 field on both types; D-2 exact copy as in spec; D-3 numbers per rule; D-4 authored content in one typed TS module (`Record<PostflopRuleId,…>`, `Record<Situation,…>`, so a missing template is a type error; `{def:<id>}` placeholders write each definition once); D-5 locked re-pins; D-6 sample-size split (see Verification).

## What was built
- `src/advice/explanations.ts` (new) — all authored text: `CONCEPTS` (10, with terms and one-clause definitions), `POSTFLOP_TEMPLATES` (6 rule ids + `pot-odds-fold-implied`), `PREFLOP_CONTEXT` (6 situations), `PREFLOP_SENTENCES`, `SEAT_NAMES`, `RANK_NAMES`, `ADVICE_ING`. **This is where the user-visible wording lives; review it here.**
- `src/advice/explain.ts` (new) — pure `formatPct`, `fillTemplate`, `handClassName`, `explainPreflop`, `explainPostflop`.
- `src/advice/preflop.ts`, `src/advice/postflop.ts` — `explanation` field (last), filled at the end of `recommendPreflop` / `recommendPostflop`.
- `docs/advice/explanations.md` (new) — concepts, numbers per rule, preflop basis, exclusions (short-stack notes, approximate labels), originality statement.
- Tests: `tests/advice/explanations.acceptance.test.ts` (new, locked), `tests/advice/explain.test.ts` (new), re-pins in `postflop.acceptance`, `value-bet.acceptance`, `preflop.acceptance`. `package.json`: `test:slow` gains the acceptance file.
- Example (implied-odds call, 9 outs, 20.5 / 22.2 / 18.2): "You have a draw with 9 outs, the unseen cards that would complete your draw, and your equity, your share of the pot if the hand were played out to the end, is 20.5%. Pot odds, the cost of a call as a share of the pot after you call, ask for 22.2%, more than you have. Implied odds, the price of a call once you count the bets you expect to win if you hit, ask only for 18.2%, so calling earns chips over time."
- Review entries and the advice worker carry the string with no change (`GradeResult.recommendation` is passed through; structured clone).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | AC#1–AC#5 | `tests/advice/explanations.acceptance.test.ts`: 2,000-decision sample every push; same assertions on 10,000 under `TLH_SLOW_TESTS=1` | Pass | 2k run ~2.25 s wall (5 passed, 5 skipped); 10k slow run ~9.8 s (10 passed) |
| SPEC-06..08 | exact copy, data hygiene, helpers | `tests/advice/explain.test.ts` | Pass | 13 tests |
| SPEC-09 | playtest unchanged | `npm run -s playtest -- --hands 10000 --seed 42` | Pass | SHA 14d746f7…2e48 unchanged, 0 violations, ~+0.1 s |
| SPEC-10 | lint, typecheck, tests, coverage | `npm run lint && npm run typecheck && npm test` | Pass | gate fix-4 PASS (4 gate runs; coverage thresholds held) |
| SPEC-11 | docs | `docs/advice/explanations.md` | Written | this doc published to Backlog |
| SPEC-12 | CI | `gh run list --branch doit/TASK-7.10` | Not checked by the documentor | — |

- D-6: first build measured 7.7 s (under the 8 s trigger), but review round 1 flagged the cost; the file was split to 2,000 every push and 10,000 opt-in, covering all 6 rule ids and all 17 pairs in both.
- Judge: see doit/TASK-7.10/judge/ (not run at time of writing).

## Review
Round 1: 1 MINOR (sample time) fixed via the D-6 split; 1 NIT (`ADVICE_ING` in explain.ts) moved to the authored module. Round 2: 0 findings. Security: no findings. No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- Test title NIT: the AC#1 title says "10,000-decision" although the every-push run uses 2,000. Kept because the spec's verification names must match test titles.

## How to try it
- `npx vitest run tests/advice/explain.test.ts tests/advice/explanations.acceptance.test.ts`
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/explanations.acceptance.test.ts` (10,000 decisions)
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`

## Run metrics
Questions 4 (+1 block) · assumptions 6 · review rounds 2 · judge rounds 0 at doc time · gate runs 4 · escalations 0 · changed lines 874 (gate fix-4).

## Known limitations and follow-ups
- `bluff` and `opponent type` are defined but no template uses them (no current rule bluffs or reads habits). `opponent type` fits TASK-7.13 (observed-play range adjustment); no existing task found for bluff rules.
- The text is not shown anywhere yet: hint card is TASK-8.1, review "numbers and reason" is TASK-9.3.
- [trainer] When a bluffing rule lands, add a bluff template and extend the AC#2 sample check (owner: later bluff rule story; none found).
- [trainer] TASK-7.13: add an opponent-type template when ranges adjust to observed play.
- [trainer] TASK-8.1 / TASK-9.3: render `recommendation.explanation` in the hint card and review panel.

## Lessons for the factory (proposals — not applied)
- Spec counted 18 pairs without checking `APPLICABLE_SPOTS` (17). Proposal: spec template asks for counts to be derived by a quoted command.
- Adding a field to a recommendation broke three locked tests with fixed shapes or sandbox lists (TASK-7.2, 7.3, 7.8). Proposal: the spec step greps locked tests for sandbox file lists as well as key-set pins, so Block 1 is found before build.
- The 10,000 sample was first built at 7.7 s on the every-push path and only split after review. Proposal: default new sample tests to the small-every-push, large-opt-in split.
