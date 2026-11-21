---
id: doc-73
title: 'TASK-6.2: Vary TAG''s play in mixed spots from its style data file'
type: other
created_date: '2026-11-21T22:26:00Z'
updated_date: '2026-11-21T22:26:00Z'
---
# TASK-6.2: Vary TAG's play in mixed spots from its style data file

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-026 (026.1, 026.3), REQ-028 (028.1–028.3) · Branch: doit/TASK-6.2

## What was asked
Add a bot style data file format (one JSON file per style: plain-English description plus the spot types the style plays as a mix, with a probability per action), a validator, and TAG's file. In a mixed spot TAG draws from the replay-seeded per-decision generator (TASK-6.18) instead of always playing the advice engine's recommendation. The playtest's TAG must get the same seed as the app's worker so both play identical hands. Also carries TASK-6.18's follow-ups: one shared seed bound and guard, and a lint guard for aliased globals, `globalThis.Math.random()` and `src/engine/bot-random.ts`. Spec: doit/TASK-6.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `decideTag(view)` with no `random` option returns the recommendation (no mixing). Every production path passes a generator (worker via `handleAdviceRequest`, playtest via `seededTagPolicy`). | yes | The locked TASK-6.1 test calls `decideTag(view)` and expects the chart move. | Make `random` required (breaks that locked test) |
| A-2 | A mixed decision uses exactly one `nextUint32()` draw `u`. Alternative chosen iff `u < alternative × 2^32`. A non-mixed decision draws nothing. | yes | Each decision has its own fresh generator, so draw count can't leak. Exact for 0.25. | `nextInt(100)` against percent weights |
| A-3 | `stepBot(table, policy = tagPolicy)` in `src/table/session.ts` keeps its pure default. | yes | No `src/ui` caller; changing it breaks locked TASK-3.1 `session.acceptance.test.ts:177`. | Default it to the seeded decision (TASK-3.1 owner) |
| A-4 | The lint guard bans bare references (not member-expression objects, property names or type names) to `Math`, `Date`, `crypto`, `performance`, `globalThis` in guarded files; `globalThis.Math` banned as a property. | yes | Covers `const c = crypto`, `const { random } = Math`, `f(crypto)`, `globalThis.Math.random()`. No existing code is hit. | Ban only declarator inits |
| A-5 | Style validation collects all problems into one `StyleValidationError` with a `problems` list; TAG's file is validated at import. | yes | Same pattern as the preflop chart. | Lazy validation |

Auto-accepted questions (autopilot, recommended option taken):
- **Q-1 Style file format (D-1):** JSON at `src/bots/styles/<style>.json`: `format: "tlh-bot-style"`, `version: 1`, `style`, `description` (≥15 words), `mixedSpots[{spot, actions{recommended, alternative} summing to 1 ±1e-9, justification ≥10 words}]`. `parseStyle(raw, fileName)` throws `StyleValidationError`.
- **Q-2 TAG's mix (D-2):** 0.75 recommended / 0.25 alternative in five preflop spots (`preflop-unopened`, `-limpers`, `-raise`, `-raise-and-calls`, `-blind-defence`). `preflop-re-raise` is **not** mixed: 77 of the 196 chart alternative cells are re-raise, mostly loose calls that would push VPIP toward the top of TAG's 18–26% band (REQ-027.1).
- **Q-3 Locked-test edits (D-5), amended to exact equality:** every edited locked assertion compares with the exact seeded decision. No `toContain`, set membership or "or". Unlocks recorded under TASK-3.6, TASK-6.1, TASK-6.18.
- **Q-4 (mid-build) sit-and-go test pins the pre-6.2 policy:** locked TASK-1.16 `games.acceptance.test.ts` AC#6 failed because the seeded default changed the seed-42 sng chip path (0 sit-and-gos complete in 10,000 hands vs 2). It now passes an explicit `makePolicy` that reproduces the pre-6.2 default; every assertion is unchanged. TASK-5.4 already covers multi-sng with another seed.

## What was built
**Style file format.** See Q-1. TAG's file `src/bots/styles/tag.json` is loaded and validated at import (`TAG_STYLE` in `src/bots/tag.ts`).

**TAG style description (from the file).** "TAG (tight-aggressive) plays few starting hands and plays them hard. It follows the trainer's own advice: the 6-max preflop chart before the flop and equity against pot odds after it. In close preflop spots, where the chart lists an acceptable alternative, it usually takes the chart's main action but sometimes the alternative, so it can't be beaten by one simple pattern. It never adapts to how you play."

**TAG's mixed spots and justifications** (all 0.75 recommended / 0.25 alternative):
| Spot | Justification |
|---|---|
| preflop-unopened | Alternative cells are opens or folds with hands of similar value; taking the alternative a quarter of the time stops opponents reading TAG's opening range exactly. |
| preflop-limpers | Close choices are isolation raises against over-limps or folds; an occasional alternative keeps players from knowing when TAG's raise means a strong hand. |
| preflop-raise | Alternatives are re-raises or calls with hands near the edge of the range; mixing means TAG's re-raises are not always premium hands. |
| preflop-raise-and-calls | Borderline cells are calls or folds that depend on implied odds; mixing stops opponents assuming every call shows a strong drawing hand. |
| preflop-blind-defence | A blind already has chips in the pot, so alternative cells are close in value; mixing calls, folds and re-raises makes TAG's blinds harder to attack with any two cards. |
`preflop-re-raise` is deliberately unmixed (Q-2). Postflop has no "alternative" in the advice, so no postflop spot type exists yet.

**Mixing rule (D-3, A-2).** Mix iff a generator was passed, the recommendation is preflop (`basis: 'chart'`), `alternative !== null`, and `TAG_STYLE` marks `preflop-<situation>` as mixed. Then draw once: `u < 0.25 × 2^32 = 1073741824` picks the alternative, else the recommendation. Everything else plays `recommend(view).move`.

**Hand-worked examples** (seed-42 run; asserted in `tests/bots/tag-mixing.acceptance.test.ts`; the build corrected the spec's seat numbers, which assumed button 6):
- Example 1, recommendation kept: code `000000000000002a0000000000000001`, seat 1 (BTN), ATo, situation raise, recommendation fold / alternative raise, decision k=0, seed `600557987`, draw `3626515352` ≥ 1073741824 → **fold**.
- Example 2, alternative chosen: code `000000000000002a0000000000000004`, seat 3 (CO), A6o, unopened, recommendation fold / alternative raise, k=0, seed `1408880392`, draw `168862582` < 1073741824 → **raise**. `handleAdviceRequest` with that seed returns the same raise.

**Playtest and worker parity (D-4).** `seededTagPolicy(code)` = `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`; `defaultPolicyFactory(6)` returns it. The worker uses the same `botDecisionSeed`, so the same draw.

**New playtest baseline.** `npm run -s playtest -- --hands 10000 --seed 42 --size 6`: 88,920 player actions, 0 invariant violations, stdout SHA-256 `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, two runs byte-identical.

**Shared seed bound (D-6).** `MAX_BOT_SEED = 0xffffffff` and `isBotSeed` exported from `src/engine/bot-random.ts`; `botRandom` and `handleAdviceRequest` both use them. Messages unchanged.

**Lint (D-7, A-4).** `BOT_DETERMINISM_FILES` adds `src/engine/bot-random.ts`; `globalThis.Math` and bare global references banned.

Files: `src/bots/style.ts` (new: types, `parseStyle`, `StyleValidationError`, `drawMixed`), `src/bots/styles/tag.json` (new), `src/bots/tag.ts`, `src/playtest/policy.ts`, `src/playtest/runner.ts`, `src/engine/bot-random.ts`, `src/table/advice-service.ts`, `tools/lint/headless-boundary.js`; new tests `tests/bots/tag-mixing.acceptance.test.ts`, `tag-seed-parity.acceptance.test.ts`, `style.test.ts`; extended `tests/toolchain/bot-determinism.test.ts`, `tests/bots/random.test.ts`, `tests/playtest/runner.test.ts`, `tests/table/advice-service.test.ts`. No new dependencies.

Locked-test edits (all exact seeded equality): TASK-3.6 `tests/ui/advice-worker.acceptance.test.ts` and `e2e/responsive-table.spec.ts`; TASK-6.1 `tests/bots/tag-playtest.acceptance.test.ts` (AC#5, AC#6); TASK-6.18 `tests/bots/bot-random.acceptance.test.ts` (only `:85` failed; `:174-176` untouched); TASK-1.16 `tests/playtest/games.acceptance.test.ts` (Q-4).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | Style loads, missing description, <2 non-zero actions, mixing picks only rec/alt, unmixed spots unchanged | `tests/bots/tag-mixing.acceptance.test.ts` | pass | gates/fix-3.json |
| SPEC-06 | Playtest and worker seed parity | `tests/bots/tag-seed-parity.acceptance.test.ts` (records the seeds passed to `botRandom`) | pass | gates/fix-3.json |
| SPEC-07, 08 | Validator rejections, draw example | `tests/bots/style.test.ts` | pass | gates/fix-3.json |
| SPEC-09, 10 | Lint guard probes | `tests/toolchain/bot-determinism.test.ts` | pass | gates/fix-3.json |
| SPEC-11 | Shared seed bound | `tests/bots/random.test.ts` | pass | gates/fix-3.json |
| SPEC-12 | Playtest baseline | `npm run -s playtest -- --hands 10000 --seed 42 --size 6` | pass: 88,920 actions, 0 violations, SHA matches | build-log.md |
| SPEC-13 | lint, typecheck, test, coverage, e2e, docs | `npm run lint && npm run typecheck && npm test` | pass | gates/fix-3.json |

- Final gate (fix run 3): `npm test` 538 passed / 7 skipped (155 files passed, 1 skipped); coverage 96.9% statements (`src/bots/style.ts` 100% lines, `tag.ts` 100% lines); lint and typecheck clean. Gate warnings: scope budget 1056 lines vs 800 and 20 files vs 19 (both below the fail limit).
- e2e (`npm run e2e`, build phase): 130 passed, 12 skipped, including `e2e/responsive-table.spec.ts`.
- DoD#3 (golden-spot suite), DoD#7 and DoD#12 (no screen or dialog) not applicable. CI status on the branch: not recorded in the artifacts.
- Judge: see doit/TASK-6.2/judge/.

## Review
Round 1: 0 blocking findings, 1 MINOR and 1 NIT, both fixed in-story (fix round 1). Security reviewer: clean. The style file is bundled static data; the validator fails closed (`__proto__` and `constructor` keys rejected, non-finite and out-of-range probabilities rejected, output Map built only from whitelisted keys).

### Non-blocking review notes (deliberately not fixed)
None outstanding. Fixed in-story:
- MINOR: the seed-parity test computed the playtest seeds independently of the policy. It now mocks `botRandom` to record the seeds the policy actually uses and asserts `[workerSeed]` per decision (mutation check failed as expected).
- NIT: `parseStyle` used `else if`, so `{0,0}` reported only the sum problem. It now reports both; test added.

## How to try it
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`
- `npx vitest run tests/bots` and `npm run lint && npm run typecheck && npm test`
- `npm run e2e -- e2e/responsive-table.spec.ts`

## Run metrics
Questions 4 (all auto-accepted) · assumptions logged 5 (A-1..A-5; state.json counter shows 0) · review rounds 1 · judge rounds: see judge/ · gate runs 3 (all PASS) · escalations 0 · changed lines 1056 (budget 800), 20 files (budget 19).

## Known limitations and follow-ups
- [trainer] Headless `stepBot` default in `src/table/session.ts` still uses the pure `tagPolicy`, so headless bot play does not mix. Switch the default to the seeded decision and update the locked `tests/table/session.acceptance.test.ts:177`. Owner: TASK-3.1 (A-3).
- Not in scope here: Calling station, Maniac and Rock style files (TASK-6.3 to 6.5), postflop mixing, style-band measurement (TASK-6.16), multi-style replay (TASK-6.15). The style description is not shown in the UI yet.

## Lessons for the factory (proposals — not applied)
- The spec's hand-worked examples used wrong seat numbers (assumed button 6) and had to be corrected in build. Proposal: the spec-writer should run the example through the real code, or mark such values "to be confirmed at build".
- A locked sit-and-go test (TASK-1.16) broke because a default policy change shifted a seed path; the spec's impact scan missed it and it cost a block and question Q-4. Proposal: before approving a spec that changes a default policy, run the full locked suite against a prototype.
- state.json `assumptions` stayed 0 despite five logged assumptions; the counter should be updated from the spec table.
