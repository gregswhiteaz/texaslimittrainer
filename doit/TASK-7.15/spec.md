# Spec: TASK-7.15 — Prove advice is identical for identical decisions

Status: READY (approved 2026-11-24)
Task: TASK-7.15 · Parent/epic: TASK-7 · Requirements: REQ-025, REQ-036, REQ-062 · Dream: limit-holdem-trainer

## 1. Summary
Adds `--check-advice` to the playtest CLI. At every seat's decision point it computes the user-facing advice and the
grade of the action taken twice, from separate copies of the same view and observed-stat snapshot. It counts every
difference and reports the first one with its replay code and decision point. A decision the user makes can now carry
the observed-stat snapshot taken at that moment. The hint (advice worker) and the review both compute from that
snapshot, so the review repeats the hint even after the finished hand has changed the stats. Acceptance tests prove
the advice ignores hidden cards and that a stored recommendation re-grades to the same `GradeResult`.

## 2. Scope
- In scope:
  - `src/playtest/advice-check.ts`: the per-decision double computation, deep comparison, observed-stat snapshots
    built from the run's own completed hands, and counters.
  - `--check-advice` flag in `src/playtest/cli.ts` (parse, Options echo, report lines, exit code).
  - The runner passes the decision's `PlayerView` to the action hook (`src/playtest/runner.ts`).
  - Optional `observed` snapshot on `UserDecision`, on `applyUserAction`, and on the advice worker's `recommend` and
    `grade` requests. `reviewEntries` uses each decision's own snapshot.
  - Tests for AC#1–#6. The 10,000-hand run goes in the opt-in slow group, and every push runs 100 hands.
  - Docs: `docs/advice/determinism.md`.
- Not doing:
  - Computing observed stats in the app session or passing them from the UI (`src/ui/advice/advice-client.ts`). That is
    TASK-8.1 (`doit/TASK-7.13/spec.md:13`). This task only carries a snapshot the caller supplies.
  - Recording advice and grades with stored hands (TASK-3.12), and the hint-card vs review UI test (E08/E09, task Notes).
  - Changing bot play, bot equity budgets or the default playtest output (without `--check-advice` the output is
    byte-identical to today's).
  - Adding `--check-advice` to CI's playtest step (`.github/workflows/ci.yml:110`) or to `--replay-code` mode.
  - Any change to `src/advice/*` logic. Determinism already comes from the input-hash seed (`src/advice/equity.ts:136`).
    If the check finds a real mismatch, that is a bug to report, not something to fix in this story.
- Scope budget: files=13, lines=900

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Under `--check-advice` the advice gets a per-decision observed snapshot built from the run's own completed hands: one `ObservedOpponent` per seat number other than the acting seat that has `handsDealt ≥ 1`, ascending seat. `hands = handsDealt`, and `vpip`/`pfr` come unrounded from `styleStats(styleCounts)`. Hands with violations or no result are skipped. A seat listed in `hand.replaced` has its counts reset before that hand is added. | yes | REQ-036 names observed stats as an advice input. After 30 hands most decisions exercise the observed-range path. The playtest has no other source of stats. | Empty snapshot always (never exercises TASK-7.13 scaling); per-bot identity across seats |
| A-2 | Advice compared is the user-facing advice: `recommend(view, { opponentRanges: 'actions', observedOpponents })`, then `gradeDecision(recommendation, action.type)` for the action the seat actually took. | yes | Matches `ACTION_RANGE_ADVICE` (`src/advice/recommend.ts:21`) used by the worker and review (`src/table/advice-service.ts:65`, `src/table/review.ts:62`). | Bot advice options (BOT_EQUITY); 'unseen' ranges |
| A-3 | A mismatch is reported through the existing violation path as custom invariant id `advice-determinism`. That hand stops at that action like any violation, and the run continues. | yes | Reuses the replay line and the hand dump (`src/playtest/cli.ts:267-297`) and the exit-1 rule (`cli.ts:422`). | A separate exit code; a stop-the-run mode |
| A-4 | `applyUserAction(table, action, observed?)` stores a copy (`observed.map((o) => ({ ...o }))`). Without `observed` the decision has no `observed` key, so existing records are unchanged. | yes | A later in-place change to the caller's stats array can't reach the stored snapshot. Plain structured-clone data. | Store the caller's reference; freeze |
| A-5 | `reviewEntries` passes `{ ...options, observedOpponents: decision.observed }` only when the decision has `observed`. Otherwise it behaves as today. | yes | Keeps every existing review test green. | Always pass `[]` |
| A-6 | The AC#4 fixed decision point is a flop decision facing a bet with at least 2 live opponents (multiway, so the equity method can be `sampled`), with a fixed observed snapshot. Each variation reshuffles only deck positions that are not the hero's hole cards or the already-dealt board. The hero's grade is computed for `call`. | yes | Sampled equity is where a hidden-card leak into the seed would show. Covering only the flop keeps 1,000 variations within seconds (§9). | River-only (exact, cheaper); several spots |

## 3. Current system
- Playtest CLI: `src/playtest/cli.ts` — `parseArgs` (flags at `:111-132`, `--check-styles` pattern at `:118-121`),
  `USAGE` (`:51-56`), `main(argv, io, seams, bands)` (`:353-423`), and the exit rule `violations > 0 || !stylesPassed`
  (`:422`). The violation block prints `First violation: hand k, player action n (...)` and `Replay: npm run playtest --
  --replay-code …` (`:278-295`). Custom invariant ids are counted (`:274-277`, `src/playtest/runner.ts:162`).
- Runner: `playHand` builds each decision's view at `src/playtest/runner.ts` (`policy(playerView(state, state.toAct,
  earlierShowdowns))`) and calls `onAction({ before, action, result })`. A non-empty return stops the hand as a
  violation. `ActionHook` and `composeChecks` are at `runner.ts:94-99`. `runPlaytest(options, onHand, seams)` calls
  `onHand` for every hand.
- Advice: `recommend` (`src/advice/recommend.ts:33`); `gradeDecision` / `gradeView` (`src/advice/grade.ts`).
  `PostflopOptions.observedOpponents` (`src/advice/postflop.ts:74`). `ObservedOpponent {seat, hands, vpip, pfr}`
  (`src/advice/ranges.ts:300`). An invalid snapshot throws `RangeError` (TASK-7.13 A-7). `adviceOptions` drops the
  snapshot, so bots never see it (`tests/advice/observed-ranges.test.ts:300-302`). Equity sampling is seeded from
  the canonical input (`src/advice/equity.ts:136`).
- Worker: `handleAdviceRequest` (`src/table/advice-service.ts:46`) — `recommend` and `grade` requests carry a view
  only (`:23-29`).
- Session/review: `UserDecision {view, action}` (`src/table/session.ts:361`), recorded by `applyUserAction`
  (`session.ts:615-628`). `reviewEntries(hand, options)` regrades each decision with `gradeView` (`src/table/review.ts:38`).
- Stats: `handStyleCounts`, `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `styleStats` (`src/stats/style-stats.ts:34-117`).
  `StatHand` = `{seats, actions, board, result}` (`:5-13`). A `PlayedHand` maps to it as `{ seats: record.seats,
  actions: final.actions, board: final.board, result: final.result }`.
- Tests: Vitest. `npm test` = `vitest run --coverage`. CI's coverage job runs `test:unit`, which excludes
  `*.acceptance|perf|property.test.*` (`package.json:13-14`). Acceptance files run uncovered in `test:sweeps`. The
  opt-in slow group is `test:slow` (`TLH_SLOW_TESTS=1`, `package.json:16`). Slow tests use `it.runIf(SLOW)` with
  `SLOW_TIMEOUT_MS = 1_200_000` (`tests/playtest/check-styles.acceptance.test.ts:31-34`, `tests/playtest/playtest.acceptance.test.ts:63-65`).
- Measured on this machine (2026-11-23): a 300-hand 6-max playtest has 2,943 decision points (1,140 postflop). One
  user-advice + grade computation averages about 2 ms. So 10,000 hands have about 98,000 decision points, and
  `--check-advice` (2 computations each) adds about 6–7 minutes.
- Existing code to reuse:
  - `src/playtest/style-check.ts` (`StyleCheck` with `onAction` + `add(hand)`) → the shape for `AdviceCheck`.
  - `composeChecks` (`runner.ts:97`) → combine `checkStep`, the style check and the advice check.
  - `describeAction` (`src/engine/invariants.ts`) → the decision-point text.
  - `handStyleCounts` / `addStyleCounts` / `styleStats` → the A-1 snapshot.
  - `ACTION_RANGE_ADVICE` → the user advice options.
  - `handReplayCode(seed, k, game)` (`runner.ts:175`) → expected replay codes in tests.
  - `Xoshiro128` (`src/engine/seeded-random.ts:44`) → the seeded deck variations in AC#4.
  - Fixtures/patterns in `tests/advice/observed-ranges.acceptance.test.ts` (29- vs 30-hand snapshots, `toActView`)
    → AC#3 views.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Check every seat's decision point, not only seat 1. | Seat 1 only (about 16,000 points per 10,000 hands, about 1 min) | The task Notes say advice is computed "at every seat's decision point". AC#1 says "every decision point". | no | n/a (task text) |
| D-2 | `ActionHook` gains an optional 2nd parameter `view: PlayerView` (the exact view given to the policy). `composeChecks` forwards it. Existing one-parameter hooks are unchanged. | Wrap policies via `makePolicy` (bypasses line-up policies, `runner.ts:40-43`); recompute the view from `step.before` (loses `earlierShowdowns`) | Smallest change that gives the exact advice input. | no | n/a |
| D-3 | Each decision runs `advise(structuredClone(view), copy(snapshot))` twice. Each result is graded with `gradeDecision(r, action.type)`, and the two `GradeResult`s (which embed the recommendation) are compared with a structural deep compare that returns the first differing path. | `JSON.stringify` equality (hides `-0`/`NaN`/key-order details, gives no path); `node:util.isDeepStrictEqual` (no path) | AC#1 compares action, numbers, explanation, basis and grade. Every field is covered, and the path is the report. | no | n/a |
| D-4 | CLI text and USAGE for `--check-advice` exactly as in §5. The builder re-pins the USAGE literal in `tests/playtest/cli.test.ts:108-114` one-for-one, keeping the check count. That file is not hook-locked by any task, so no owner unlock is needed. | Violation block only; other wording | User-visible CLI text, following the `--check-styles` pattern. | yes | user (Q-1) |
| D-5 | The 10,000-hand `--check-advice` runs (AC#1, AC#5) are in `test:slow` only. Every push runs the same assertions at `--hands 100`. | Run 10,000 on every push (about 7 min) | Standing rule: scale checks are opt-in (`TLH_SLOW_TESTS=1`). | no | n/a (user rule 2026-11-21) |

## 5. Design

### Files to create / modify
- `src/playtest/advice-check.ts` — create: `AdviceCheck`, `userAdvice`, `firstDifference`, `observedSnapshot`.
- `src/playtest/cli.ts` — modify: `--check-advice` flag, Options echo, report lines, `advise` seam parameter.
- `src/playtest/runner.ts` — modify: pass `view` to `onAction`; `ActionHook` and `composeChecks` signatures.
- `src/table/advice-service.ts` — modify: optional `observed` on `recommend` and `grade` requests.
- `src/table/review.ts` — modify: use `decision.observed` (A-5).
- `src/table/session.ts` — modify: `UserDecision.observed?`; `applyUserAction(table, action, observed?)` (A-4).
- `tests/playtest/check-advice.acceptance.test.ts` — create: SPEC-01, 02, 05, 07.
- `tests/advice/determinism.acceptance.test.ts` — create: SPEC-03, 04, 06.
- `tests/playtest/advice-check.test.ts` — create: unit SPEC-08, 09.
- `tests/table/decision-snapshot.test.ts` — create: unit SPEC-10.
- `tests/playtest/cli.test.ts` — modify (D-4, Q-1): re-pin the USAGE literal one-for-one.
- `package.json` — modify: add `tests/playtest/check-advice.acceptance.test.ts` to `test:slow`.
- `docs/advice/determinism.md` — create: what is deterministic, the seed, the snapshot rule, how to run the check.

### Components, interfaces and data
```ts
// src/playtest/advice-check.ts
export type AdviseFn = (view: PlayerView, observed: readonly ObservedOpponent[]) => Recommendation;
/** recommend(view, { opponentRanges: 'actions', observedOpponents: observed }). */
export const userAdvice: AdviseFn;
/** '' when deep-equal; else the first differing path, e.g. 'recommendation.explanation', 'grade',
 *  'recommendation.outs[2]', '(root)'. Primitives compare with Object.is; arrays by length then elements;
 *  plain objects by own enumerable key list (same keys, same order) then values in a's key order. */
export function firstDifference(a: unknown, b: unknown): string;
/** A-1 snapshot for `seat` from per-seat counts. */
export function observedSnapshot(counts: ReadonlyMap<SeatNumber, StyleCounts>, seat: SeatNumber): ObservedOpponent[];
export interface AdviceMismatch {
  readonly handNumber: number; readonly replayCode: ReplayCode;
  readonly actionNumber: number;  // 1-based among player actions in the hand, as in HandViolation
  readonly action: Action; readonly path: string;
}
export class AdviceCheck {
  constructor(advise?: AdviseFn);            // default userAdvice
  /** Call before each hand is played: sets the hand number and code used in reports. */
  startHand(handNumber: number, code: ReplayCode): void;
  /** ActionHook: [] when equal, else [{ invariant: 'advice-determinism', message: `${path} differs` }]. */
  readonly onAction: ActionHook;
  /** After each hand: updates per-seat counts (A-1). */
  add(hand: PlayedHand): void;
  readonly decisions: number; readonly mismatches: number;
  readonly firstMismatch: AdviceMismatch | null;
}
```
How `startHand` gets called is the builder's choice (for example, `onAction` reads the hand number from a counter
that `add` advances, with the code from `handReplayCode(seed, k, game)`). The rule is that the reported hand number
and replay code are those of the hand the decision belongs to. An error thrown by `advise` or `gradeDecision`
propagates, as advice errors do today.

```ts
// src/playtest/runner.ts
export type ActionHook = (step: ActionStep, view: PlayerView) => readonly Violation[];
// src/table/advice-service.ts — recommend and grade requests gain: readonly observed?: readonly ObservedOpponent[];
//   forwarded as { ...ACTION_RANGE_ADVICE, observedOpponents: observed } when present.
// src/table/session.ts
export interface UserDecision { readonly view: PlayerView; readonly action: Action;
  /** Observed-stat snapshot at this decision (TASK-8.1 supplies it). */ readonly observed?: readonly ObservedOpponent[]; }
export function applyUserAction(table: TableState, action: Action, observed?: readonly ObservedOpponent[]): TableState;
// src/playtest/cli.ts
export function main(argv, io, seams = {}, bands = STYLE_BANDS, advise: AdviseFn = userAdvice): number;
// ParsedArgs 'run' gains: readonly checkAdvice?: true
```

### Rules and algorithms
- Per decision (only when `--check-advice`): `snap = observedSnapshot(counts, view.seat)`. Then
  `g1 = gradeDecision(advise(structuredClone(view), snap.map(o => ({...o}))), action.type)`, and `g2` the same from
  fresh copies. `path = firstDifference(g1, g2)`. `decisions++`. If `path !== ''`, then `mismatches++`, record
  `firstMismatch` if null, and return the violation.
- CLI parse: `--check-advice` is value-less. Given twice → `Error: --check-advice given more than once.`. With
  `--replay-code` → `Error: --check-advice is only valid without --replay-code.`. With `--help` → the existing
  `Error: --help cannot be combined with other options.`. It combines with `--check-styles` and `--lineup`. The hooks
  are composed as `checkStep`, then the style check if on, then the advice check.
- Output (D-4, approved by Q-1):
  - Options line: `… --check-styles --check-advice` when given (the advice flag goes last).
  - After the bot-results block, only with the flag: `Advice check: <decisions> decision points, <mismatches> mismatches`.
  - When mismatches > 0, the next line: `First advice mismatch: hand <k>, replay code <code>, player action <n>
    (<describeAction(action)>), <path> differs`.
  - USAGE line 1 ends `[--check-styles] [--check-advice]`. A new final line: `--check-advice: recompute the advice
    and grade at every decision point and exit 1 if any recomputation differs from the first`.
- Exit: unchanged rule. Mismatches are violations, so exit 1.
- Worked example (AC#2 stub): an `advise` that appends ` #<call count>` to `explanation`. Hand 1's first decision
  gives `recommendation.explanation` different on calls 1 and 2, so `First advice mismatch: hand 1, replay code
  <handReplayCode(42, 1)>, player action 1 (...), recommendation.explanation differs` and exit 1.

### Error handling and configuration
- An invalid snapshot from the worker request → `RangeError` from ranges → `{ ok: false, error: { name: 'RangeError', … } }`
  (the existing catch, `advice-service.ts:77-83`).
- No new configuration or dependencies.

## 6. Behaviour specification

### SPEC-01: 0 mismatches at every decision point
- Verifies: AC#1
- Behaviour: Given `main(['--hands', '10000', '--seed', '42', '--check-advice'])`, When it runs, Then it exits 0, the
  Options line ends ` --check-advice`, `Invariant violations: 0`, and there is exactly one line matching
  `^Advice check: (\d+) decision points, 0 mismatches$` with the count ≥ 10,000. The count equals the sum of
  `record.actions.length` over the run (all seats). Every push runs the same assertions at `--hands 100` (count ≥ 500).
  The 10,000-hand case runs only with `TLH_SLOW_TESTS=1`.
- Verification: acceptance `tests/playtest/check-advice.acceptance.test.ts::AC#1 check-advice recomputes every decision point with 0 mismatches`

### SPEC-02: First mismatch reported with replay code and decision point
- Verifies: AC#2
- Behaviour: Given the §5 stub `advise` (explanation suffixed with the call count), When
  `main(['--hands', '20', '--seed', '42', '--check-advice'], io, {}, STYLE_BANDS, stub)` runs, Then it exits 1. The
  output contains `First advice mismatch: hand 1, replay code ${handReplayCode(42, 1)}, player action 1 (`, it ends
  the line with `recommendation.explanation differs`, it contains `Replay: npm run playtest -- --replay-code
  ${handReplayCode(42, 1)}`, the `Advice check:` mismatch count is ≥ 1, and `advice-determinism` appears in
  `Violations by invariant:`. A second stub that varies only on postflop views reports the first postflop decision of
  the run, which the test finds independently with `runPlaytest`.
- Verification: acceptance `tests/playtest/check-advice.acceptance.test.ts::AC#2 varying advice prints the first mismatch and exits non-zero`

### SPEC-03: Review repeats the hint despite later stats
- Verifies: AC#3
- Behaviour: Given a postflop decision view V and a snapshot S taken at the decision (the facing opponent at 29
  hands, so typical player), and a later snapshot S2 for the same seat after the hand (30+ hands, tight, e.g. vpip 10,
  pfr 8). The test first checks that S2 really changes the advice
  (`recommend(V, {opponentRanges:'actions', observedOpponents:S2}).equityPct !== hint.equityPct`). When the hint is
  `handleAdviceRequest({ id: 1, kind: 'recommend', view: V, observed: S })` and the decision is recorded with
  `observed: S` (via `applyUserAction` or a `CompletedHand` whose decision carries `observed: S`), and the review
  is `reviewEntries(hand, ACTION_RANGE_ADVICE)` (the stats now S2), Then the review's `result.recommendation` has
  the same `action`, `move`, `equityPct`, `requiredEquityPct`, `explanation`, `basis` and `opponentBasis` as the hint
  (and is `toStrictEqual` to it as a whole).
- Verification: acceptance `tests/advice/determinism.acceptance.test.ts::AC#3 review uses the decision-time snapshot`

### SPEC-04: Hidden cards never change hint or grade
- Verifies: AC#4
- Behaviour: Given the A-6 fixed decision point and snapshot, When 1,000 decks are made with `Xoshiro128` seeds
  1..1000 (only the other players' hole cards and the undealt cards move), the same fixed action sequence is
  replayed, and the hero's view is taken, Then every variation's `recommend(view, {opponentRanges:'actions',
  observedOpponents})` is `toStrictEqual` to variation 1's, and `gradeDecision(rec, 'call')` is `toStrictEqual` to
  variation 1's. The test also checks that at least 900 of the variations differ from variation 1 in some other
  player's hole cards (the variation is real). Test timeout 60 s.
- Verification: acceptance `tests/advice/determinism.acceptance.test.ts::AC#4 hidden cards never change hint or grade`

### SPEC-05: Byte-identical output
- Verifies: AC#5
- Behaviour: Given two calls of `main` with the same argv including `--check-advice` (`--hands 100 --seed 42
  --lineup mixed --check-styles --check-advice` on every push; `--hands 10000 --seed 42 --check-advice` in the slow
  group), When each runs, Then the `out` strings are identical (`===`), and so are the exit codes.
- Verification: acceptance `tests/playtest/check-advice.acceptance.test.ts::AC#5 check-advice output is byte-identical across runs`

### SPEC-06: Stored recommendation re-grades deep-equal
- Verifies: AC#6
- Behaviour: Given a postflop decision and a preflop decision, each with a hint from the worker
  (`handleAdviceRequest` `recommend`, with snapshot S for the postflop one), stored via `structuredClone`, and the
  grade shown with the hint `gradeDecision(stored, action.type)`, When the review computes the entry for the same
  decision (`reviewEntries`, the decision carrying S), Then `gradeDecision(stored, action.type)` is `toStrictEqual`
  to the review's `result`, and the worker's `grade` request with S is `toStrictEqual` to both.
- Verification: acceptance `tests/advice/determinism.acceptance.test.ts::AC#6 stored recommendation regrades to a deep-equal GradeResult`

### SPEC-07: CLI parsing and default output unchanged
- Verifies: AC#1, DoD#1
- Behaviour: `parseArgs(['--check-advice'])` → `{kind:'run', options:{hands:10000, seed:42, size:6, game:'cash'},
  checkAdvice:true}`. A duplicate flag, `--replay-code … --check-advice` and `--help --check-advice` give the §5
  messages with exit 2. `main(['--hands','100','--seed','42'])` output is the same as before this task (no
  `Advice check` line, and the Options line is unchanged). `--help` prints the new USAGE.
- Verification: acceptance `tests/playtest/check-advice.acceptance.test.ts::check-advice flag parsing and unchanged default output`

### SPEC-08: Deep compare paths
- Verifies: AC#1, AC#2
- Behaviour: `firstDifference` returns `''` for deep-equal values. `'recommendation.explanation'` for a changed
  string. `'recommendation.outs[1]'` for a changed array element. `'recommendation.outs'` for a length change.
  `'marginPts'` for `null` vs `0`. `'x'` for `0` vs `-0` and for `NaN` vs `1` (Object.is). `'(root)'` for primitives
  that differ at the top. A key present in one object only → that key's path.
- Verification: unit `tests/playtest/advice-check.test.ts::firstDifference`

### SPEC-09: Observed snapshot from the run
- Verifies: AC#1
- Behaviour: Given counts for seats 1, 2 and 4 (seat 3 has none), `observedSnapshot(counts, 2)` returns entries for
  seats 1 and 4, ascending, with `hands = handsDealt` and `vpip`/`pfr` from `styleStats`. `AdviceCheck.add` skips
  hands with violations or no result, and resets a seat in `hand.replaced` before counting that hand. With a stub
  `advise` that records its inputs, both calls for one decision receive deep-equal but not identical (`!==`) view and
  snapshot objects.
- Verification: unit `tests/playtest/advice-check.test.ts::observed snapshot and isolated inputs`

### SPEC-10: Snapshot carried by session and worker
- Verifies: AC#3, AC#6
- Behaviour: `applyUserAction(table, action, S)` records `observed` deep-equal to S but not the same array. Mutating
  S afterwards doesn't change the record. Without `observed` the decision has exactly the keys `view` and `action`.
  The worker `recommend` with `observed: S` equals `recommend(view, {...ACTION_RANGE_ADVICE, observedOpponents: S})`.
  The worker `grade` with S equals `gradeView(view, a, {...ACTION_RANGE_ADVICE, observedOpponents: S})`. An invalid S
  (`hands: -1`) gives `ok: false` with `error.name === 'RangeError'`.
- Verification: unit `tests/table/decision-snapshot.test.ts::decision snapshot in session and worker`

### SPEC-11: Repo checks, coverage, golden suite, boundaries, no network
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#8
- Behaviour: Lint, typecheck and `npm test` pass with zero errors. `npm run test:unit` holds the coverage thresholds.
  `tests/golden/` passes 100%. `src/table/*` and `src/playtest/*` changes import no UI/DOM code (the existing
  boundary test passes), and no network APIs are added.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run test:unit && npx vitest run tests/golden/`

### SPEC-12: Playtest invariants and slow run
- Verifies: DoD#6, AC#1, AC#5
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42` reports `Invariant violations: 0`, and its output is
  byte-identical to `main` (no advice change). `npm run -s playtest -- --hands 10000 --seed 42 --check-advice` exits 0
  with `0 mismatches`. `npm run test:slow` passes including the new file.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --check-advice && npm run test:slow`

### SPEC-13: Documentation
- Verifies: DoD#11, DoD#9
- Behaviour: `docs/advice/determinism.md` states the REQ-036 guarantee, the input-hash seed, the decision-time
  snapshot rule (hint and review), the A-1 playtest snapshot, how to run `--check-advice` and what a mismatch report
  means. The text is original. The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/advice/determinism.md`; `backlog doc list --plain` shows the story doc

### SPEC-14: N/A items and CI
- Verifies: DoD#7, DoD#10, DoD#12
- Behaviour: DoD#7 and DoD#12 are N/A because no screen or dialog changes. CI is green on `doit/TASK-7.15`.
- Verification: manual `gh run list --branch doit/TASK-7.15 --limit 1` shows success

## 7. Edge cases
- Hand abandoned at a violation before the advice check runs (hooks in order, all run): the advice check still runs
  for that action and its result is counted; only the first-found violation stops the hand (SPEC-02).
- Seat with no hands yet / first 30 hands: snapshot empty or < 30 hands, so typical-player ranges (SPEC-09).
- Replaced bot (cash `--lineup`): counts reset (SPEC-09).
- Sit-and-go busted seats: not dealt in, so no decisions. Their old counts stay in the snapshot and are ignored by
  TASK-7.13 A-4.
- `advise` throws: propagates (same as advice errors in bots today), and the CLI crashes with a stack trace. N/A
  for the real engine, which is total on legal views (`tests/advice/postflop-ranges.property.test.ts`).
- Concurrency / interruption / permissions: N/A (single synchronous CLI run).

## 8. Security considerations
- Trust boundary: the worker message's new `observed` field. It is validated by `estimateOpponentRanges`
  (`RangeError`), and errors become `ok:false` (SPEC-10).
- REQ-025 hidden information: proven by SPEC-04. The advice input is only the `PlayerView` + snapshot.
- No new dependencies, secrets, network or randomness. The seeded `Xoshiro128` is only for test deck variations.

## 9. Non-functional
- Every-push cost: `check-advice.acceptance.test.ts` at 100 hands (about 1,000 decisions × 2 × about 2 ms ≈ 4 s per
  run; 3 runs) under 30 s total. `determinism.acceptance.test.ts` under 20 s (AC#4 is about 1,000 flop advices).
  Measured with `npx vitest run <file>`.
- Slow group: the 10,000-hand `--check-advice` takes about 7 min per run (2 runs for AC#5 plus 1 for AC#1; the
  builder may share one run between AC#1 and AC#5's first run, as `sharedCapture` does). Timeout 1,200,000 ms each.
- The default playtest (without the flag) has no added cost beyond one extra argument per hook call.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --check-advice`
- New tests:
  - `tests/playtest/check-advice.acceptance.test.ts` → SPEC-01, 02, 05, 07 (10,000-hand cases `it.runIf(SLOW)`)
  - `tests/advice/determinism.acceptance.test.ts` → SPEC-03, 04, 06
  - `tests/playtest/advice-check.test.ts` → SPEC-08, 09
  - `tests/table/decision-snapshot.test.ts` → SPEC-10
- End-to-end for the Judge: run `npm run -s playtest -- --hands 10000 --seed 42 --check-advice` twice, saving
  output to two files. Confirm `Advice check: N decision points, 0 mismatches` with N ≥ 10,000, exit 0, and that
  `cmp` reports the files identical. Then run `npx vitest run tests/playtest/check-advice.acceptance.test.ts -t AC#2`
  to see the mismatch report.

## 11. Open questions
- None. Q-1 is answered in `doit/TASK-7.15/qa.md`.

## 12. Clarifications log
See `doit/TASK-7.15/qa.md`.
