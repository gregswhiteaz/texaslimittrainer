# Spec: TASK-6.2 — Vary TAG's play in mixed spots from its style data file

Status: READY (approved 2026-11-21)
Task: TASK-6.2 · Parent/epic: TASK-6 · Requirements: REQ-026 (026.1, 026.3), REQ-028 (028.1–028.3) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the bot style data file format: one JSON file per style, holding a plain-English description and the
spot types the style marks as mixed, each with a probability for every action. It also adds the validator and TAG's
file. TAG keeps playing the advice engine's recommendation, except in a preflop chart cell that has an acceptable
alternative in a spot type its file marks as mixed. There it draws once from the per-decision generator that
TASK-6.18 already seeds from the replay code, seat and decision number. The playtest's TAG policy gets the same
per-decision seed as the app's worker, so the playtest and the app play identical hands. The task also carries
TASK-6.18's follow-ups: one shared seed bound and guard, and a lint guard that catches aliased globals and
`globalThis.Math.random()` and also covers `src/engine/bot-random.ts`.

## 2. Scope
- In scope:
  - `src/bots/style.ts` (new): style types, `parseStyle` validator, `StyleValidationError`, the mixing draw.
  - `src/bots/styles/tag.json` (new): TAG's style file (description, mixed spot types, probabilities, justifications).
  - `src/bots/tag.ts`: load and validate TAG's file at import (`TAG_STYLE`). `decideTag` mixes when a generator is
    passed.
  - `src/playtest/policy.ts` and `src/playtest/runner.ts`: a seeded TAG policy, used as the 6-max default.
  - `src/engine/bot-random.ts` and `src/table/advice-service.ts`: shared `MAX_BOT_SEED`/`isBotSeed` (AC#6).
  - `tools/lint/headless-boundary.js`: the alias / `globalThis.Math` / `bot-random.ts` lint coverage (AC#6, AC#7).
  - Tests for AC#1–AC#7. The approved edits to locked tests are listed in D-5.
- Not doing:
  - Calling station, Maniac and Rock style files or their deviations (TASK-6.3 to TASK-6.5). The validator only
    accepts the four style names. TAG's is the only file shipped.
  - Postflop mixing. The postflop advice has no "alternative", so no postflop spot type exists yet.
  - Any change to the preflop chart, the advice engine, the replay code, seed derivation (TASK-6.18 D-1) or the
    worker protocol.
  - Changing `stepBot`'s default policy in `src/table/session.ts` (A-3).
  - Measuring style bands (TASK-6.16) or full-hand replay with every style (TASK-6.15).
  - UI or user-visible text in the app. The style description isn't shown anywhere yet.
  - Deleting or loosening any locked assertion. The locked-test edits in D-5 replace "TAG equals the pure
    recommendation" with "TAG equals the seeded decision", which is at least as strict.
- Scope budget: files=19, lines=800

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `decideTag(view)` with no `random` option returns the recommendation (no mixing). Every production path passes a generator: the worker via `handleAdviceRequest`, and the playtest via `seededTagPolicy`. `tagPolicy` stays `(view) => decideTag(view)`. | yes | The locked `tests/bots/tag.acceptance.test.ts` (TASK-6.1) calls `decideTag(view)` with one argument and expects the chart move (`:119-151`). A required `random` would break it. REQ-028.3 is about bots in play, and those always have a generator. | Make `random` required (breaks a locked test and typecheck) |
| A-2 | A mixed decision uses exactly one `nextUint32()` draw `u` from the decision's fresh generator. The alternative is chosen iff `u < alternative × 2^32`. A non-mixed decision draws nothing. | yes | Each decision has its own seeded generator (TASK-6.18 D-1), so the number of draws can't leak into other decisions. One comparison is exact for 0.25 (threshold 1073741824). | `nextInt(100)` against percent weights |
| A-3 | `stepBot(table, policy = tagPolicy)` keeps its default. It's a headless helper with no caller in `src/ui` (grep), and the app decides bots in the worker. | yes | Changing it would break the locked `tests/table/session.acceptance.test.ts:177` (TASK-3.1) with no user-visible gain. Logged as a scope concern. | Default `stepBot` to the seeded decision (needs the TASK-3.1 owner) |
| A-4 | The lint guard for aliases bans bare references (not the object of a member expression, not a non-computed property or key name, not a type name) to `Math`, `Date`, `crypto`, `performance` and `globalThis` in guarded files. `globalThis.Math` is banned as a property. | yes | It covers `const c = crypto`, `const { random } = Math`, `const g = globalThis`, `f(crypto)` and `globalThis.Math.random()`. Grep finds no such bare use in `src/bots`, `src/advice` or `src/engine/bot-random.ts`, so nothing existing breaks. | Ban only `VariableDeclarator` inits (misses `f(crypto)` and assignments) |
| A-5 | Style validation follows the chart's pattern (`src/advice/preflop-chart.ts:51-58,159-175`). All problems are collected into one `StyleValidationError` with a `problems` list. TAG's file is validated at import, so a broken shipped file fails every test that loads `src/bots/tag.ts`. | yes | Same behaviour as the shipped chart (`src/advice/preflop.ts:17`). | Lazy validation on first decision |

## 3. Current system
- TAG: `src/bots/tag.ts:7-9` `BotRandom { nextUint32(): number }`, `:12` `TagOptions = RecommendOptions & { random? }`
  (reserved for this task). `:21-29` `decideTag`: the postflop free-check shortcut, then `recommend(view, options).move`.
  `:32` `tagPolicy = (view) => decideTag(view)`.
- Advice: `src/advice/recommend.ts:10` routes preflop to `recommendPreflop`. `src/advice/preflop.ts:21-37`
  `PreflopRecommendation` has `situation`, `cell`, `action`, `alternative` (already made legal: capped raise becomes
  call, nothing owed becomes check, `null` if it equals `action`) and `move`. `:75-113` `recommendPreflop`.
  Situations: `src/advice/preflop-chart.ts:5-6`
  (`unopened|limpers|raise|raise-and-calls|re-raise|blind-defence`).
- Chart alternatives (`src/advice/charts/six-max.json`, `X/Y` tokens parsed at `src/advice/preflop-chart.ts:97-120`):
  196 cells across all six situations. unopened 30, limpers 28, raise 17, raise-and-calls 23, re-raise 77,
  blind-defence 21 (counted from the JSON).
- JSON data import pattern: `src/advice/preflop.ts:3` `import sixMax from './charts/six-max.json' with { type: 'json' };`,
  validated at `:17`. Node type stripping loads it in the playtest (`tools/playtest/resolve-ts.js`).
- Bots import boundary (unlocked `tests/bots/tag.test.ts:65-95,147-156`): every `src/bots/*.ts` (non-recursive)
  must import from `src/engine` only the listed types, type-only. Its import regex
  `^import\s+(type\s+)?([\s\S]*?)\s+from\s+'([^']+)';` doesn't allow a `with {…}` clause before `;`. So in a
  `src/bots/*.ts` file the JSON import must be the **last** import statement, with no later `from '…';` line.
  Otherwise the lazy match swallows the next import.
- Seeds: `src/engine/bot-random.ts:7` `MAX_SEED` (private), `:22` `botDecisionSeed(code, view)`, `:29-34` `botRandom`
  (RangeError message). The duplicate check is `src/table/advice-service.ts:47-49` `isSeed`, used at `:66`.
  `:44-45` the worker default `decideTag(view, { random })`.
- Playtest: `src/playtest/runner.ts:133-140` `defaultPolicyFactory(6)` returns `allTag = () => tagPolicy`.
  `PolicyFactory(code, seat)` at `:66`. `src/playtest/policy.ts` re-exports `seatGenerator`.
- Main thread: `src/table/session.ts:250-259` `botTurn` computes `seed = botDecisionSeed(replayCode, view)`.
  `:270` `stepBot(table, policy = tagPolicy)`.
- Lint: `tools/lint/headless-boundary.js:73-105` `BOT_DETERMINISM_FILES = ['src/bots/**','src/advice/**']` and
  `botDeterminismConfig` (`no-restricted-properties` and `no-restricted-syntax`, re-including headless entries; it must
  not use `no-restricted-globals`, because the locked `tests/toolchain/boundary.property.test.ts:12-27` (TASK-1.1)
  checks that rule's messages). The unit test is `tests/toolchain/bot-determinism.test.ts` (unlocked; probes via
  `ESLint.lintText`).
- Tests: Vitest (`npm test` = `vitest run --coverage`). Playwright e2e (`npm run e2e`). The 10k playtest CLI runs in
  about 0.7 s in-process. Measured: 10,000 hands seed 42 with a prototype of this design took 640 ms.
- Existing code to reuse:
  - `src/engine/bot-random.ts` `botDecisionSeed`, `botRandom`, `botDecisionIndex` → the seed path (no new derivation).
  - `src/advice/preflop.ts` `PreflopRecommendation.alternative` → the legal alternative (no new chart lookup).
  - `src/advice/preflop-chart.ts` `ChartValidationError` / `wordCount` / `echo` pattern → mirror it in
    `StyleValidationError` (copy the small helpers; don't import private ones).
  - `tests/bots/tag.acceptance.test.ts:86-97` `playAgainstRandom` pattern (TAG at seat 1 against random-move seats,
    seed 61) → collect views for every situation.
  - `tests/support/table-scenarios.ts`, `src/table/session.ts` `dealHand`/`botTurn`/`applyBotDecision` → the
    app path for AC#5.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Style file format: JSON at `src/bots/styles/<style>.json`, validated by `parseStyle(raw, fileName)` (schema in §5). | TS module; integer percents | It matches the chart (`format`/`version`, JSON import, validation at import, justification text). It's plain data that later styles extend. | yes | user (Q-1, auto-accepted) |
| D-2 | TAG's mixed spot types and probabilities: `preflop-unopened`, `preflop-limpers`, `preflop-raise`, `preflop-raise-and-calls`, `preflop-blind-defence`, each recommended 0.75 / alternative 0.25. `preflop-re-raise` is **not** mixed. Justifications are in §5. | All six; 0.8/0.2; 0.5/0.5 | The chart already marks these cells as close ("acceptable alternative", TASK-7.2/7.19). A 25% alternative rate gives real variation while TAG mostly plays the chart. 77 of the 196 alternative cells are in re-raise, 60 of them call-versus-fold with hands that are often dominated, so mixing there mostly adds loose calls and would push TAG's VPIP toward the top of its 18–26% band (REQ-027.1). Prototype over 10,000 hands at seed 42: 590 alternatives chosen, 0 violations. | yes | user (Q-2, auto-accepted) |
| D-3 | Mixing rule: mix iff a generator was passed, the recommendation is preflop (`basis: 'chart'`), `alternative !== null` and `TAG_STYLE` marks `preflop-<situation>` as mixed. Then draw once (A-2) and play the legal alternative or the recommendation. Otherwise play `recommend(view).move`. | Mix every borderline (`*`) cell | AC#3 and the task description name the chart cell's acceptable alternative. Borderline cells without an alternative have no second action. | no | n/a |
| D-4 | Playtest: `seededTagPolicy(code)` in `src/playtest/policy.ts` = `(view) => decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`. `defaultPolicyFactory(6)` returns `(code) => seededTagPolicy(code)`. | Keep the playtest pure | AC#5. The worker gets `seed = botDecisionSeed(code, view)` (`src/table/session.ts:258`) and builds `botRandom(seed)` (`src/table/advice-service.ts:67`). Same formula, so same draw. | no | n/a |
| D-5 | Locked-test edits: each changed assertion compares with the **exact** seeded TAG decision (`decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`, or the worker/playtest with the real seed) by equality. No edit widens what an assertion accepts, and none deletes one: see §5 "Locked-test edits". | Keep the playtest pure | AC#5 says the TASK-3.6 test is updated "with its owner's approval". The TASK-6.1 and TASK-6.18 tests assert that TAG never deviates from the recommendation, which REQ-028.3 now forbids in mixed spots. | yes | user (Q-3, auto-accepted with amendment: exact equality, no widening) |
| D-6 | `MAX_BOT_SEED = 0xffffffff` and `isBotSeed(seed: unknown): seed is number` are exported from `src/engine/bot-random.ts`. `botRandom` and `handleAdviceRequest` both use `isBotSeed`. `advice-service.ts` loses its local `isSeed` and the `0xffffffff` literal. Error messages are unchanged. | Keep both | AC#6 and TASK-6.18 review MINOR. | no | n/a |
| D-7 | Lint: `BOT_DETERMINISM_FILES` gains `'src/engine/bot-random.ts'`. `no-restricted-properties` gains `{object:'globalThis', property:'Math'}`. `no-restricted-syntax` gains the bare-reference ban (A-4). All new messages use the existing REQ-028.1 message. | — | AC#6, AC#7, TASK-6.18 judge J-1-01. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/style.ts` — new: `StyleName`, `SPOT_TYPES`, `SpotType`, `MixedSpot`, `BotStyleData`, `StyleValidationError`,
  `parseStyle`, `drawMixed`.
- `src/bots/styles/tag.json` — new: TAG's style file.
- `src/bots/tag.ts` — `TAG_STYLE = parseStyle(tagStyle, 'tag.json')`, mixing in `decideTag` (D-3). The JSON import goes last.
- `src/playtest/policy.ts` — `seededTagPolicy(code)`.
- `src/playtest/runner.ts` — `defaultPolicyFactory(6)` returns the seeded TAG factory. Update its doc comment.
- `src/engine/bot-random.ts` — export `MAX_BOT_SEED`, `isBotSeed`. `botRandom` uses them.
- `src/table/advice-service.ts` — use `isBotSeed` and drop `isSeed`.
- `tools/lint/headless-boundary.js` — D-7.
- `tests/bots/tag-mixing.acceptance.test.ts` — new (SPEC-01..SPEC-05).
- `tests/bots/tag-seed-parity.acceptance.test.ts` — new (SPEC-06).
- `tests/bots/style.test.ts` — new unit (SPEC-07, SPEC-08).
- `tests/toolchain/bot-determinism.test.ts` — extend probes (SPEC-09, SPEC-10).
- `tests/bots/random.test.ts` — add `isBotSeed`/`MAX_BOT_SEED` boundaries (SPEC-11).
- `tests/playtest/runner.test.ts` — `:205` and `:336` expect the seeded TAG factory instead of `tagPolicy` (unlocked).
- `tests/table/advice-service.test.ts` — `:33-36` expect `decideTag(view, { random: botRandom(0) })` for the
  `seed: 0` request (unlocked; tightened to the real default path).
- `tests/ui/advice-worker.acceptance.test.ts` — locked (TASK-3.6), edit per D-5.
- `e2e/responsive-table.spec.ts` — locked (TASK-3.6), edit per D-5.
- `tests/bots/tag-playtest.acceptance.test.ts` — locked (TASK-6.1), edit per D-5.
- `tests/bots/bot-random.acceptance.test.ts` — locked (TASK-6.18), edit per D-5.

### Components, interfaces and data
`src/bots/style.ts` (no engine imports; imports `Situation` type-only from `../advice/preflop-chart` if needed):
```ts
export type StyleName = 'TAG' | 'Calling station' | 'Maniac' | 'Rock';
export const SPOT_TYPES = ['preflop-unopened', 'preflop-limpers', 'preflop-raise',
  'preflop-raise-and-calls', 'preflop-re-raise', 'preflop-blind-defence'] as const;
export type SpotType = (typeof SPOT_TYPES)[number];
/** Probabilities over the advice's recommended action and the chart cell's acceptable alternative; sum 1. */
export interface MixedSpot { readonly recommended: number; readonly alternative: number; readonly justification: string }
export interface BotStyleData {
  readonly style: StyleName;
  readonly description: string;
  readonly mixedSpots: ReadonlyMap<SpotType, MixedSpot>;
}
export class StyleValidationError extends Error { readonly problems: readonly string[] } // name 'StyleValidationError'
/** Validates authored JSON from `fileName`. Throws StyleValidationError listing every problem. */
export function parseStyle(raw: unknown, fileName: string): BotStyleData;
/** One nextUint32 draw u: 'alternative' iff u < spot.alternative * 2**32, else 'recommended'. */
export function drawMixed(spot: MixedSpot, random: { nextUint32(): number }): 'recommended' | 'alternative';
```
`StyleValidationError.message` = `Invalid style file <fileName>:\n- ` + problems joined by `\n- `.

`src/bots/styles/tag.json` (the text below is the recommended content; it's original):
```json
{
  "format": "tlh-bot-style",
  "version": 1,
  "style": "TAG",
  "description": "TAG (tight-aggressive) plays few starting hands and plays them hard. It follows the trainer's own advice: the 6-max preflop chart before the flop and equity against pot odds after it. In close preflop spots, where the chart lists an acceptable alternative, it usually takes the chart's main action but sometimes the alternative, so it can't be beaten by one simple pattern. It never adapts to how you play.",
  "mixedSpots": [
    { "spot": "preflop-unopened", "actions": { "recommended": 0.75, "alternative": 0.25 },
      "justification": "With the pot unopened the alternative cells are opens or folds with hands of similar value; taking the alternative a quarter of the time stops opponents reading TAG's opening range exactly." },
    { "spot": "preflop-limpers", "actions": { "recommended": 0.75, "alternative": 0.25 },
      "justification": "Against limpers the close choices are isolation raises against over-limps or folds; an occasional alternative keeps players from knowing when TAG's raise means a strong hand." },
    { "spot": "preflop-raise", "actions": { "recommended": 0.75, "alternative": 0.25 },
      "justification": "Facing one raise the alternatives are re-raises or calls with hands near the edge of the range; mixing them means TAG's re-raises are not always premium hands." },
    { "spot": "preflop-raise-and-calls", "actions": { "recommended": 0.75, "alternative": 0.25 },
      "justification": "With a raise and callers the borderline cells are calls or folds that depend on implied odds; mixing them stops opponents assuming every call shows a strong drawing hand." },
    { "spot": "preflop-blind-defence", "actions": { "recommended": 0.75, "alternative": 0.25 },
      "justification": "A blind already has chips in the pot, so its alternative cells are close in value; mixing calls, folds and re-raises makes TAG's blinds harder to attack with any two cards." }
  ]
}
```
(`preflop-re-raise` is deliberately absent: see D-2.)

`src/bots/tag.ts`:
```ts
export const TAG_STYLE: BotStyleData; // parseStyle(tagStyle, 'tag.json') at import
export type TagOptions = RecommendOptions & { readonly random?: BotRandom }; // unchanged
export function decideTag(view: PlayerView, options?: TagOptions): Action; // D-3
export const tagPolicy: SeatPolicy; // unchanged: decideTag(view), no mixing (A-1)
```
`src/playtest/policy.ts`: `export function seededTagPolicy(code: ReplayCode): SeatPolicy` (D-4).
`src/engine/bot-random.ts`: `export const MAX_BOT_SEED = 0xffffffff; export function isBotSeed(seed: unknown): seed is number`.

### Rules and algorithms
- Validation (`parseStyle(raw, file)`), with every problem collected:
  - Not an object, or `format !== 'tlh-bot-style'`, or `version !== 1` → `<file>: expected format "tlh-bot-style" version 1` (stops here).
  - `style` not a `StyleName` → `<file>: unknown style "<echo>"`.
  - `description` missing, not a string, or under 15 words (`\p{L}+` count) → `<file>: style has no plain-English description (at least 15 words)`.
  - `mixedSpots` not an array → `<file>: mixedSpots must be a list`.
  - For each entry, with `S` = the style name (or `?`):
    - `spot` not in `SPOT_TYPES` → `<file>: style S has unknown spot type "<echo>"`.
    - A repeated `spot` → `<file>: style S lists spot type <spot> twice`.
    - `actions` keys other than `recommended`/`alternative` → `<file>: style S spot type <spot> has unknown action "<key>"`.
    - A probability that is missing, not a finite number, or outside [0, 1] → `<file>: style S spot type <spot> has an invalid probability for <action>`.
    - Sum differs from 1 by more than 1e-9 → `<file>: style S spot type <spot> probabilities sum to <sum>, not 1`.
    - Fewer than two actions with probability > 0 → `<file>: style S marks spot type <spot> as mixed with fewer than two actions of non-zero probability`.
    - `justification` under 10 words → `<file>: style S spot type <spot> has no justification (at least 10 words)`.
- Decision (D-3), hand-worked end to end with the current code and the recommended TAG file (computed by a prototype
  probe against `src/` at HEAD):
  - Example 1 (alternative chosen): playtest seed 42, hand 1, code `000000000000002a0000000000000001`, 6-max, button 6.
    Seat 6 (BTN) holds As Td (ATo), facing one raise. Situation `raise`, cell `F*/R`: recommendation `fold`,
    alternative `raise`. k = `botDecisionIndex` = 0. Seed = `botDecisionSeed(code, view)` = `4290467780`.
    `botRandom(4290467780).nextUint32()` = u = `584394998` < 1073741824 (0.25 × 2^32), so the alternative wins. TAG
    plays `view.legalActions`' raise (a re-raise).
  - Example 2 (recommendation kept): same run, hand 4, code `000000000000002a0000000000000004`, seat 5 (CO), As 6c
    (A6o), `unopened`, cell `F*/R`. k=0, seed `3582685763`, u = `2590574823` ≥ 1073741824, so TAG plays `fold`.
  - Over codes `handReplayCode(6002, i)`, i = 1..1000, Example 1's view chose the alternative 250 times (prototype).
- Playtest baseline (prototype of this exact rule and the recommended file): `npm run -s playtest -- --hands 10000
  --seed 42 --size 6` gives `Hands played: 10000`, `Ended by fold: 5427`, `Ended at showdown: 4573`, `Player actions:
  88920`, `Streets capped at 4 bets: 241`, `Largest pot: $70`, `Invariant violations: 0`, stdout SHA-256
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`. The old baseline was `a15b8375…c4dc7` with 88746
  actions. If Q-2 changes the probabilities, the builder records the new hash in `build-log.md` and SPEC-12 uses it.
- Lint (D-7, A-4), for guarded files (`src/bots/**`, `src/advice/**`, `src/engine/bot-random.ts`):
  - Flagged with the REQ-028.1 message: `globalThis.Math.random()`, `const c = crypto;`, `const p = performance;`,
    `const D = Date;`, `const { random } = Math;`, `const m = Math;`, `const g = globalThis;`, `let x; x = crypto;`,
    `use(crypto);` (with `declare function use(x: unknown): void;`).
  - Still clean: `Math.floor(1.5)`, `Math.max(1, 2)`, `const o = { crypto: 1, performance: 2 }; o.crypto;`,
    `const random = (): number => 1;`, `globalThis.structuredClone` (not a banned property).

### Locked-test edits (D-5, approved Q-3: exact equality only; unlocks recorded under TASK-3.6, TASK-6.1, TASK-6.18)
1. `tests/ui/advice-worker.acceptance.test.ts` (owner TASK-3.6): `:107` `client.decideBot(view, 'TAG')` becomes
   `client.decideBot(view, 'TAG', botDecisionSeed(code, view))`, and `botDecisionSeed` is imported from
   `../../src/engine/bot-random`. The comparison with `playHand(code, 6, 6, k)` (now seeded by default) is unchanged.
2. `e2e/responsive-table.spec.ts` (owner TASK-3.6): the import of `tagPolicy` becomes `seededTagPolicy` from
   `../src/playtest/policy`. `:212-213` `makePolicy = (code: ReplayCode, seat) => seat === USER_SEAT ? replayUser :
   seededTagPolicy(code)`. The `toEqual` against the app's actions is unchanged.
3. `tests/bots/tag-playtest.acceptance.test.ts` (owner TASK-6.1):
   - AC#5: `:57` `{ makePolicy: () => tagPolicy }` becomes `{ makePolicy: (code) => seededTagPolicy(code) }`. At
     `:65-77` the hook compares `step.action` with `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`,
     where `code = handReplayCode(42, hand)` and `hand` is advanced by `runPlaytest`'s `onHand` callback.
   - AC#6: `:100` compares `step.action` by equality with the exact seeded decision for that view,
     `decideTag(call.view, { random: botRandom(botDecisionSeed(handReplayCode(6, hand), call.view)) })`, where `hand`
     is advanced by `runPlaytest`'s `onHand` callback. It's computed with `spy.recording` set to `false` around
     the call, so the spy's one-recommend-call-per-action count stays exact. The existing `call.result.move`
     comparison is replaced by this one, not kept as an alternative. The recommend-call count and street assertions
     stay.
4. `tests/bots/bot-random.acceptance.test.ts` (owner TASK-6.18):
   - `:85` `expect(first.action).toEqual(decideTag(point.view))` becomes
     `expect(first.action).toEqual(decideTag(point.view, { random: botRandom(botDecisionSeed(point.code, point.view)) }))`.
     This is exact equality with the seeded decision, recomputed from the code rather than from `first.seed`.
   - `:174-176` `.toEqual(recommend(turn.view).move)` becomes `.toEqual(decideTag(a.view, { random:
     botRandom(botDecisionSeed(SCENARIO_CODE, a.view)) }))` for both turns. This is exact equality, so the turns with
     and without user decisions must give the identical seeded action.
   - Edit 4 applies only to the lines that fail under the new behaviour. The builder records in `build-log.md` which
     lines needed it.
- Rule for every edit: replacing an assertion is allowed only with an equality against the exact seeded decision.
  No `toContain`, set membership or "or" conditions may be introduced.
- Not edited: `tests/bots/tag.acceptance.test.ts` (A-1 keeps `decideTag(view)` pure), `tests/table/session.acceptance.test.ts` (A-3).

### Error handling and configuration
- A bad shipped `tag.json` throws `StyleValidationError` at import (A-5).
- If `decideTag` finds no legal move of the alternative's type (not reachable: `recommendPreflop` already makes it
  legal), it throws `Error('No legal <type> for seat <n>')`.
- Seed errors are unchanged: `RangeError` from `botRandom`, and `TypeError('Malformed bot request seed')` in the worker.

## 6. Behaviour specification

### SPEC-01: TAG's style file loads with its parameters and description
- Verifies: AC#1, DoD#9
- Behaviour: Given `src/bots/styles/tag.json`, When `src/bots/tag.ts` is imported, Then `TAG_STYLE.style === 'TAG'`,
  `TAG_STYLE.description` has at least 15 words, and `TAG_STYLE.mixedSpots` has exactly the keys `preflop-unopened,
  preflop-limpers, preflop-raise, preflop-raise-and-calls, preflop-blind-defence`, each `{recommended: 0.75,
  alternative: 0.25}` with a justification of at least 10 words. `preflop-re-raise` is absent. The raw JSON passed to
  `parseStyle` gives the same result.
- Verification: acceptance `tests/bots/tag-mixing.acceptance.test.ts::TAG's style file holds its mixed spots and a description`

### SPEC-02: A style file without a description fails naming the file
- Verifies: AC#1
- Behaviour: Given TAG's JSON with `description` removed (and, separately, set to `""` and to a 3-word string), When
  `parseStyle(raw, 'tag.json')` runs, Then it throws `StyleValidationError` whose `problems` contains `tag.json: style
  has no plain-English description (at least 15 words)` and whose message contains `tag.json`.
- Verification: acceptance `tests/bots/tag-mixing.acceptance.test.ts::a style file without a description fails naming the file`

### SPEC-03: A mixed spot with fewer than two non-zero actions fails naming style and spot type
- Verifies: AC#2
- Behaviour: Given TAG's JSON with `preflop-raise` set to `{recommended: 1, alternative: 0}` (and, separately,
  `{recommended: 0, alternative: 1}`), When `parseStyle(raw, 'tag.json')` runs, Then it throws `StyleValidationError`
  with the problem `tag.json: style TAG marks spot type preflop-raise as mixed with fewer than two actions of
  non-zero probability`. The unchanged JSON parses without error.
- Verification: acceptance `tests/bots/tag-mixing.acceptance.test.ts::a mixed spot needs two actions of non-zero probability`

### SPEC-04: In a mixed spot TAG picks only the recommendation or the alternative, each at least once
- Verifies: AC#3, DoD#1
- Behaviour: Given, for each of the five mixed situations, the first TAG view with `recommend(view).alternative !==
  null` from `runPlaytest({hands: 200, seed: 61, size: 6})` with TAG at seat 1 and `randomMovePolicy(seatGenerator(code,
  seat))` elsewhere, When TAG decides that view under codes `handReplayCode(6002, i)`, i = 1..1000 (seed =
  `botDecisionSeed(code, view)`, action = `decideTag(view, { random: botRandom(seed) })`), Then every action equals
  `recommend(view).move` or the legal move of type `alternative`, and both occur at least once. Also Example 1 (§5)
  gives seed `4290467780`, first draw `584394998`, and a `raise`. Example 2 gives seed `3582685763` and `fold`.
  `handleAdviceRequest({id:1, kind:'bot', view, style:'TAG', seed: 4290467780})` returns that same raise. (Runs in
  about 1 s, in the normal suite.)
- Verification: acceptance `tests/bots/tag-mixing.acceptance.test.ts::in a mixed spot TAG chooses only the recommendation or the alternative and each at least once`

### SPEC-05: Outside mixed spots TAG plays the recommendation under any replay code
- Verifies: AC#4
- Behaviour: Given the first `re-raise` view with an alternative from the SPEC-04 collection, When TAG decides it under
  the 1,000 codes, Then every action equals `recommend(view).move`. Also, given every TAG decision in a 300-hand all-TAG
  6-max playtest (seed 6, default seeded policy) whose spot isn't mixed (postflop, preflop with `alternative ===
  null`, or `re-raise`), the played action equals `recommend(view).move`. Postflop decisions and preflop decisions with no
  alternative are each seen at least once, and at least 100 decisions are checked.
- Verification: acceptance `tests/bots/tag-mixing.acceptance.test.ts::outside mixed spots TAG plays the recommended action`

### SPEC-06: The playtest TAG and the app's worker get the same seed and play the same hand
- Verifies: AC#5
- Behaviour: Given 30 codes `handReplayCode(7, k)`, When each is played through the app path headlessly
  (`dealHand(seatSession(), code)`, the user always checks or calls, each bot turn answered by
  `handleAdviceRequest({id, kind:'bot', view: turn.view, style: turn.style, seed: turn.seed})` and applied with
  `applyBotDecision`) and through `playHand(code, 6, <the table's button>, 1, {makePolicy: (c, seat) => seat ===
  USER_SEAT ? replayUser : seededTagPolicy(c)})`, Then:
  - the two action lists are equal;
  - for each bot action, `botDecisionSeed(code, playerView(step.before, seat))` in the playtest equals the `turn.seed`
    the app sent at the same (seat, decision index);
  - across the 30 hands at least one bot action differs from `recommend(view).move`, so the match isn't trivial.
  The default `playHand(code, 6, 6, k)` equals `playHand(..., {makePolicy: (c) => seededTagPolicy(c)})`.
- Verification: acceptance `tests/bots/tag-seed-parity.acceptance.test.ts::the playtest TAG gets the same per-decision seed as the worker`

### SPEC-07: Validator rejects every malformed style file with a listed problem
- Verifies: AC#1, AC#2
- Behaviour: Each rule in §5 "Validation" has one case producing exactly its message: bad format/version, unknown
  style, non-array `mixedSpots`, unknown spot type, duplicate spot, unknown action key, probability `-0.1` / `1.5` /
  `"0.5"` / `NaN`, sum `0.9`, missing justification. Several problems in one file are all listed. Messages echo at
  most 20 characters of untrusted text.
- Verification: unit `tests/bots/style.test.ts::parseStyle lists every problem`

### SPEC-08: Mixing draw worked example and the no-generator path
- Verifies: AC#3, AC#4
- Behaviour: `drawMixed({recommended: 0.75, alternative: 0.25, …}, r)` returns `alternative` for `r.nextUint32()` =
  `0` and `1073741823`, and `recommended` for `1073741824` and `4294967295`. It calls `nextUint32` exactly once.
  `decideTag(view)` with no `random` at Example 1's view returns `fold` (A-1). A stub generator is not called at a
  postflop view or at a preflop view with `alternative === null`.
- Verification: unit `tests/bots/style.test.ts::drawMixed thresholds and when TAG draws`

### SPEC-09: Lint guard catches aliased globals in bot decision code
- Verifies: AC#6, DoD#2
- Behaviour: Given each "flagged" probe in §5 Lint linted as `src/bots/probe.ts` and `src/advice/probe.ts`, Then
  each gives an error containing `Non-deterministic source in bot decision code` and `REQ-028.1`. Each "still
  clean" probe gives no errors. The same probes in `src/engine/probe.ts` give no REQ-028.1 message, and the existing
  probes keep passing.
- Verification: unit `tests/toolchain/bot-determinism.test.ts::aliased globals are caught in bot decision code`

### SPEC-10: Lint guard covers bot-random.ts and globalThis.Math.random()
- Verifies: AC#7
- Behaviour: Given `export const probe = globalThis.Math.random();` linted as `src/bots/probe.ts`,
  `src/advice/probe.ts` and `src/engine/bot-random.ts`, Then each gives the REQ-028.1 error. Every existing probe
  (`Math.random()`, `Date.now()`, …) linted as `src/engine/bot-random.ts` also gives it. `npm run lint` on the real
  `src/engine/bot-random.ts` is clean.
- Verification: unit `tests/toolchain/bot-determinism.test.ts::the guard covers bot-random.ts and globalThis.Math`

### SPEC-11: One shared seed bound and guard
- Verifies: AC#6
- Behaviour: `MAX_BOT_SEED === 4294967295`. `isBotSeed` is true for `0` and `4294967295`, and false for `-1`, `1.5`,
  `4294967296`, `NaN`, `'7'`, `undefined`. `botRandom` throws the unchanged `RangeError` exactly where `isBotSeed` is
  false. `src/table/advice-service.ts` imports `isBotSeed` and contains no `0xffffffff`/`4294967295` literal and no
  local seed check. The existing malformed-seed cases in `tests/table/advice-service.test.ts` still pass.
- Verification: unit `tests/bots/random.test.ts::one shared bot seed bound and guard`

### SPEC-12: Playtest stays clean and reproducible with mixing TAG
- Verifies: DoD#6, AC#5
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` exits 0 with `Invariant violations: 0` and
  `Player actions: 88920`. Its stdout SHA-256 is `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, and
  a second run is byte-identical. The edited `tests/bots/tag-playtest.acceptance.test.ts` AC#5 and AC#6 pass, both comparing every played action
  by equality with the exact seeded decision.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-13: Checks, coverage, boundaries, CI and documentation
- Verifies: AC#6, AC#7, DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and the coverage thresholds hold
  (≥ 90% engine/bots/advice/statistics, ≥ 70% overall). `tests/bots/tag.test.ts`'s bots import boundary passes, so
  `src/bots/*.ts` has no runtime engine import and no UI import. `npm run e2e -- e2e/responsive-table.spec.ts` passes,
  including its same-origin request check (DoD#8). CI is green on `doit/TASK-6.2`. A story doc covering the style file
  format, TAG's mixed spots and justifications, the mixing rule with Example 1, and the new playtest baseline is
  published with `backlog doc`. Not applicable: DoD#3 (the golden-spot suite, E07-S14, doesn't exist yet), DoD#7 and
  DoD#12 (no screen or dialog). DoD#9: the description and every mixed spot carry original justification text,
  enforced by the validator.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Mixed situation but the cell has no alternative, or the alternative collapses to the same legal action (capped raise
  becomes call): no draw, recommendation (SPEC-08).
- Re-raise cell with an alternative: not mixed for TAG (SPEC-05).
- Postflop: never mixed (SPEC-05, SPEC-08).
- Probability boundaries: `u = 2^30 − 1` gives the alternative and `u = 2^30` gives the recommendation (SPEC-08).
  Probabilities of exactly 0 or 1 are valid numbers but fail the mixed rule (SPEC-03).
- Floating sums such as 0.1 + 0.2 + … are tolerated within 1e-9 (SPEC-07).
- Duplicate spot types and unknown keys are rejected (SPEC-07).
- A decideTag call without a generator gives the recommendation (A-1, SPEC-08).
- Concurrency, interruption, permissions, dependency failure: N/A. This is pure computation over bundled data.

## 8. Security considerations
- Trust boundary: style files are bundled, authored data. They're still validated at import (fail closed), and
  messages echo at most 20 characters. Worker messages are unchanged and the seed is still validated, now by one
  guard (SPEC-11).
- Hidden information: the mixing reads only the bot's `PlayerView` and its generator, and the replay code stays on
  the main thread (unchanged, TASK-6.18).
- Randomness: the non-cryptographic seeded PRNG is deliberate. Fairness here means reproducibility and independence
  from the user (REQ-028, REQ-029). The lint guard is tightened (SPEC-09, SPEC-10).
- New dependencies, secrets, authn, injection, logs: none / N/A.

## 9. Non-functional
- Speed: one extra `nextUint32` per mixed decision. The 10k-hand playtest took 640 ms in the prototype. No timing
  assertion (speed checks stay opt-in).
- Determinism: same code and same user actions give byte-identical playtest output (SPEC-12) and identical
  app/playtest hands (SPEC-06).
- The AC#3 distribution check (5 × 1,000 decisions, about 1 s) runs in the normal suite. It's a correctness check.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- New tests:
  - `tests/bots/tag-mixing.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05
  - `tests/bots/tag-seed-parity.acceptance.test.ts` → SPEC-06
  - `tests/bots/style.test.ts` → SPEC-07, SPEC-08
  - `tests/toolchain/bot-determinism.test.ts` (extended) → SPEC-09, SPEC-10
  - `tests/bots/random.test.ts` (extended) → SPEC-11
  - Edited per D-5: `tests/ui/advice-worker.acceptance.test.ts`, `e2e/responsive-table.spec.ts`,
    `tests/bots/tag-playtest.acceptance.test.ts`, `tests/bots/bot-random.acceptance.test.ts`.
- Judge end-to-end:
  1. Run the SPEC-12 command twice. Both hashes should equal the recorded baseline, with 0 violations.
  2. Re-derive Example 1 by hand: `botDecisionSeed('000000000000002a0000000000000001', view of seat 6)` should give
     `4290467780` and a first draw of `584394998`, and TAG should raise.
  3. Edit `tag.json` locally to `alternative: 0` for one spot, check that every test importing TAG fails with the
     SPEC-03 message, then revert.
  4. Add `const c = crypto;` and `globalThis.Math.random();` to `src/bots/tag.ts`, check that `npm run lint` fails
     with the REQ-028.1 message, then revert.
  5. Run `npm run e2e -- e2e/responsive-table.spec.ts` (app worker equals headless playtest).

## 11. Open questions
- None. Q-1 (D-1) and Q-2 (D-2) were auto-accepted as recommended. Q-3 (D-5) was auto-accepted with the
  amendment that every locked edit uses exact equality with the seeded decision. See `doit/TASK-6.2/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.2/qa.md`.
