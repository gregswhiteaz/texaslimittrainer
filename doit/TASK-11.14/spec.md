# Spec: TASK-11.14 — Harden the BB/100 trend against tampered stakes and type its cash summaries

Status: READY (approved 2026-11-26)
Task: TASK-11.14 · Parent/epic: TASK-11 · Requirements: REQ-048 (via TASK-11.2) · Dream: limit-holdem-trainer

## 1. Summary
This is a follow-up from the TASK-11.2 review (doc-135). Today `bb100Value` takes the least common multiple (LCM) of a
group's big bets in floating point. A tampered store with many unusual big bets pushes that LCM to `Infinity`. Then
`gcd(Infinity, b)` recurses on `NaN` until the stack overflows, so Statistics never shows the chart. The fix keeps
the exact LCM calculation while the LCM stays a safe integer. Every real stake does (LCM of all cash big bets = 120).
Above that limit, the value is the float per-hand sum Σ(net/bigBet)/n × 100, rounded half away from zero to tenths.
So normal data gives the same numbers as before, and tampered data shows a finite BB/100 value. The task also turns
`TrendSource` into a discriminated union, so `trendHand` needs no cast, and adds a unit case for an all-negative
BB/100 chart.

## 2. Scope
- In scope:
  - `src/stats/trends.ts`: an iterative `gcd`. `bb100Value` takes the exact path while the LCM is a safe integer and
    the float fallback above that. `TrendSource` becomes a union of cash and non-cash sources, and the cast in
    `trendHand` goes.
  - Tests: one new acceptance file (store, then `statisticsView`, then `renderToString`), and new unit cases in
    `tests/stats/trends.test.ts`.
  - Docs: the group-value rule in `docs/stats/trends.md`.
- Not doing:
  - Any change to `src/ui/App.tsx`. With a finite value, nothing in `statisticsView` throws for any parsed store.
    Any other unexpected throw in the success handler already reaches the TASK-13.1 error screen through
    `AppRoot`'s `unhandledrejection` listener (`src/ui/AppRoot.tsx:34-40`).
  - Any change to chart geometry (TASK-11.2 A-5), chart text, `bbPer100`, the Session Report, `parseHandRecord`
    validation, the IndexedDB schema or the stored record format.
  - Rejecting or skipping hands with non-standard stakes. They stay valid records, as they are today.
  - Editing any other task's locked acceptance test.
- Scope budget: files=4, lines=260

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The fallback triggers only when the running LCM would exceed `Number.MAX_SAFE_INTEGER`. Otherwise the exact path (today's code) runs unchanged. | yes | Every real stake mix has LCM ≤ 120 (`src/table/session.ts:63-64`), so normal output is identical. The exact path with a safe LCM can't overflow or recurse deeply. | Also fall back when `2 × LCM × n` or the scaled net sum exceeds 2^53. That only matters for tampered data and gives finite output either way. |
| A-2 | Fallback rounding: `v = (Σ net_i / bigBet_i) / n × 100` summed in hand order. `tenths = sign(v) × floor(abs(v) × 10 + 0.5)`. The result is `tenths / 10`, and 0 (never −0) when tenths is 0. | yes | Same half-away-from-zero rule as `bbPer100` (`src/table/session-report.ts:148-152`). Tampered data has no report to match exactly. | `Math.round` (rounds −x.x5 toward +∞). |
| A-3 | AC#3 "at the top of the plot" means the dashed break-even line is the highest element: its y is smaller than every point's y. It does not mean y = 10. The geometry stays TASK-11.2 A-5 (hi = max(1, values), so a +1 head-room stays above 0). | yes | Moving the line to y = 10 would change the chart for real all-negative histories (user-visible normal output), and the AC came from a NIT asking only for a unit case. | Change hi to max(0, values) so the line sits at y = 10 (user-visible geometry change; would need asking). |

## 3. Current system
- `src/stats/trends.ts:262`: `const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))`, which is recursive.
  `src/stats/trends.ts:266-275`: `bb100Value` reduces the LCM in floats. With the first 500 primes as big bets the
  LCM becomes `Infinity` and `gcd` throws "Maximum call stack size exceeded" (reproduced in node). With the first 16
  primes (2…53) the LCM is above 2^53 but finite. That gives no crash, only an inexact result.
- `bb100Value` is called from `bb100Points` (`:278`) and `groupedBb100Points` (`:363`). Both are reached through
  `statisticsView`.
- `src/ui/App.tsx:132-159`: the Statistics effect calls `statisticsView(data)` inside the `.then` success handler. A
  throw there skips the sibling failure handler and becomes an unhandled rejection. Since TASK-13.1, `AppRoot`
  (`src/ui/AppRoot.tsx:34-40`) shows the error screen for that. `App.tsx:395,405` call `statisticsView` synchronously
  in the filter and grouping handlers.
- Trust boundary: `trendData()` (`src/storage/hand-store.ts:171-195`) runs `trendHand(parseHandRecord(value))` and
  skips values that fail parsing. `parseHandRecord` checks `stake.bigBet` only as a whole number ≥ 1
  (`src/table/hand-record.ts:480-482`, `isWhole` = safe integer, `:162-167`). Action amounts and award amounts are
  safe integers, so `net` is always a finite integer-valued number and `bigBet ≥ 1`.
- `TrendSource` (`src/stats/trends.ts:40-55`) has an optional `gameType` and optional cash fields. `trendHand`
  (`:117-138`) casts with `record as Required<Pick<…>>` (`:132-135`). `HandRecord` (`src/table/hand-record.ts:74-106`)
  has `gameType: GameType` and all cash fields. tsc 5 accepts a `HandRecord` where a discriminated `cash | non-cash`
  union is expected; I checked this in a scratch file under `--strict --exactOptionalPropertyTypes`, together with an
  `@ts-expect-error` for `{ gameType: 'cash' }` without the fields. Test callers pass sources without `gameType`
  (`tests/stats/trends.test.ts:94,187,547`) and real `HandRecord`s.
- Geometry: `src/ui/stats/StatisticsScreen.tsx:99-148`. `hi = max(1, values)`, `lo = min(−1, values)`,
  `y(v) = round1(150 − (v − lo)/(hi − lo) × 140)`, with the dashed `stats-break-even` line at `y(0)`. The existing
  unit geometry cases are at `tests/stats/trends.test.ts:238-264` (`bbSvg` helper).
- Tests: vitest, with `.acceptance.test.` files run in the sweeps. `fake-indexeddb` store tests are in
  `tests/storage/trend-data.test.ts:1-37,70-100`.
- Existing code to reuse:
  - `bbPer100` (`src/table/session-report.ts:148`): exact-path rounding, unchanged.
  - `cashPool`, `cloneRecords` (`tests/support/stat-records.ts:146,165`): real cash records to clone, with the
    stake overwritten for the tampered store.
  - `openHandStore(new IDBFactory(), name)` and `store.add` (`tests/storage/trend-data.test.ts:70-85` pattern).
  - The `render` and `bbCard` / `bbTitles` markup helpers pattern from `tests/stats/bb100.acceptance.test.tsx:61-80`.
    Copy it locally, since that file is locked to TASK-11.2.
  - The `bbSvg` helper in `tests/stats/trends.test.ts:238` for the AC#3 case.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Exact path while the LCM is a safe integer, and the float per-hand sum (A-2) above that. | (a) BigInt exact rational everywhere: exact, but the LCM of k distinct tampered big bets grows to about 53·k bits, so a large tampered Day or Session group costs superlinear time and could hang the screen. (b) Float sum everywhere: changes normal output. For example, −46 at $2/$4 plus +57 at $20/$40 is exactly −503.75, which gives −503.8 exact but −503.7 float. (c) Catch the error and show the load-failure message: works, but the caller prefers a finite value, and it hides all statistics. | Normal output is identical, tampered data shows a finite value, and it runs in O(n). | no (no change to normal output) | n/a |
| D-2 | `TrendSource = CashTrendSource \| OtherTrendSource`. Both extend a shared base. Cash has `gameType: 'cash'` plus required `stake: { bigBet }`, `userSeat`, `actions`, `result`. Other has `gameType?: Exclude<GameType, 'cash'>`. | A type guard function, or keeping the cast. | The AC asks the type system to reject a cash source without its fields. `HandRecord` still satisfies it. | no | n/a |

## 5. Design

### Files to create / modify
- `src/stats/trends.ts`: the `TrendSource` union, a cast-free `trendHand`, an iterative `gcd`, and the safe-LCM check
  plus fallback in `bb100Value` (doc comment updated).
- `tests/stats/trends.test.ts`: unit cases for SPEC-02, SPEC-03, SPEC-04 and SPEC-05.
- `tests/stats/bb100-tampered.acceptance.test.tsx` (new): SPEC-01.
- `docs/stats/trends.md`: the group-value paragraph (around line 58) also states the fallback.

### Components, interfaces and data
```ts
interface TrendSourceBase { sessionId; handNumber; completedAt; decisions; seats?; lineUp? }   // as today
export interface CashTrendSource extends TrendSourceBase {
  readonly gameType: 'cash';
  readonly stake: { readonly bigBet: number };
  readonly userSeat: SeatNumber;
  readonly actions: readonly ActionRecord[];
  readonly result: HandResult;
}
export interface OtherTrendSource extends TrendSourceBase { readonly gameType?: Exclude<GameType, 'cash'> }
export type TrendSource = CashTrendSource | OtherTrendSource;
```
- In `trendHand`, `if (record.gameType !== 'cash') return base;` narrows `record` to `CashTrendSource`. Then
  `cash = { net: netResult(record), bigBet: record.stake.bigBet }`, with no `as`.
- `bb100Value(hands)` keeps its signature and its RangeError for empty or non-cash input.

### Rules and algorithms
- `gcd(a, b)`: `while (b !== 0) [a, b] = [b, a % b]; return a;`, for positive safe integers only.
- `bb100Value`: start with `L = 1`. For each summary, `next = (L / gcd(L, bigBet)) × bigBet`. If
  `next > Number.MAX_SAFE_INTEGER`, return `fallback(summaries)` (A-2). Otherwise set `L = next`. After the loop, run
  today's `bbPer100(Σ net × (L / bigBet), L, n)`.
- Worked examples:
  - Normal stakes, exact path, values as today: `[+12 @8, −20 @20]` gives 25. 500 hands @8 with Σ net = −52 gives −1.3.
    `[−46 @4, +57 @40]` gives −503.8.
  - Fallback: 16 hands with big bets 2, 3, 5, …, 53 (the first 16 primes, LCM ≈ 3.3e19). Net +1 on the bigBet-2 hand
    and 0 elsewhere gives Σ = 0.5, v = 3.125 and 3.1. Net −1 there gives −3.1. All nets 0 gives 0, never −0.
  - Fallback: 500 hands with the first 500 primes as big bets and net = +bigBet on each gives 100.

### Error handling and configuration
- No new error types. `bb100Value` never throws for non-empty cash input. Its output is finite because each
  `|net / bigBet| ≤ |net|` is finite and n ≥ 1.

## 6. Behaviour specification

### SPEC-01: Tampered stakes still give a finite BB/100 on Statistics
- Verifies: AC#1
- Behaviour: Given a fake-indexeddb hand store holding 500 cash hands cloned from `cashPool` records. Each hand's
  `stake.bigBet` is replaced by a distinct prime: the first 500 primes, 2…3571, so the exact LCM exceeds both 2^53
  and `Number.MAX_VALUE`. When `store.trendData()` is read and `statisticsView(data)` is rendered with
  `StatisticsScreen` (the path the Statistics screen takes on open), Then:
  - `statisticsView` returns without throwing.
  - The BB card has exactly one point. Its title matches `/^Cash hands 1–500: (\+|-)?\d+\.\d$/` and equals the test's
    own Σ(net/bigBet)/500 × 100, rounded half away from zero to tenths, in display form.
  - The markup has no `aria-busy="true"` and no "Your statistics could not be loaded." message.
  - The same data under `statisticsView(data, data, 'session')` also yields one finite point.
- Verification: acceptance `tests/stats/bb100-tampered.acceptance.test.tsx::AC#1 tampered big bets show a finite BB/100 point instead of failing`

### SPEC-02: bb100Value falls back only above a safe LCM, and normal stakes stay exact
- Verifies: AC#1
- Behaviour: Given the worked examples in §5, When `bb100Value` runs, Then:
  - It returns 25, −1.3 and −503.8 for the normal-stake inputs. The −503.8 case shows the exact path is kept: the float
    sum would give −503.7.
  - It returns 3.1, −3.1, 0 (`Object.is(v, 0)`) and 100 for the prime-stake inputs, with no throw.
  - Every pair of `CASH_STAKES` big bets yields the same value as `bbPer100(Σ net × (120 / bigBet), 120, n)` for a
    fixed net pattern.
- Verification: unit `tests/stats/trends.test.ts::bb100Value keeps exact rounding for real stakes and stays finite for tampered ones`

### SPEC-03: Grouped and 500-hand points stay finite for tampered stakes
- Verifies: AC#1
- Behaviour: Given 500 `TrendHand`s with the first 500 primes as big bets and net = +bigBet, When
  `statisticsView` runs with grouping `hands`, `session` and `day`, Then each `bb100` chart has kind `points`, and
  every point's `bb100` is 100.
- Verification: unit `tests/stats/trends.test.ts::statisticsView gives finite BB/100 points for tampered stakes in every grouping`

### SPEC-04: A cash source without its cash fields is a type error
- Verifies: AC#2
- Behaviour: Given `TrendSource`, When a test passes `{ sessionId, handNumber, completedAt, decisions: [], gameType:
  'cash' }` to `trendHand` (inside a function that is never called), Then `npm run typecheck` needs the
  `// @ts-expect-error` on it. The same holds for a cash source missing only `result`. A real cash `HandRecord` and a
  source with no `gameType` still type-check, and `trendHand` returns the same values as before (the existing cases
  pass unchanged). The body of `trendHand` contains no `as`.
- Verification: unit `tests/stats/trends.test.ts::TrendSource rejects a cash source without its cash fields`; command `npm run typecheck && ! sed -n '/^export function trendHand/,/^}/p' src/stats/trends.ts | grep -qw as`

### SPEC-05: All-negative BB/100 chart keeps break-even above every point
- Verifies: AC#3
- Behaviour: Given BB/100 points `[-2, -4]`, When `StatisticsScreen` renders, Then the `stats-break-even` line has
  `y1="38"` and `y2="38"`, the circles have `cx="10" cy="94"` and `cx="390" cy="150"`, the polyline is
  `points="10,94 390,150"`, and 38 is below every circle's cy (the line is the topmost element, A-3). Given the
  single point `[-3]`, the line has `y1="45"` and the circle is `cx="200" cy="150"`.
- Verification: unit `tests/stats/trends.test.ts::all-negative BB/100 geometry puts break-even above every point`

## 7. Edge cases
- Empty or non-cash input to `bb100Value`: today's RangeError is unchanged (existing case at `trends.test.ts:199-202`).
- An LCM that is exactly safe or below: exact path (SPEC-02, real stakes).
- An LCM that is above 2^53 but finite, or one that is `Infinity`: fallback (SPEC-02 with 16 primes, SPEC-01 and SPEC-03
  with 500 primes).
- A fallback result of 0 or −0: returns 0 (SPEC-02).
- A huge `net` in a tampered record: still a finite float, so the output is finite (§5 error handling). No separate
  case.
- Concurrency, permissions, interruption: N/A, since this is a pure calculation.

## 8. Security considerations
- Trust boundary: IndexedDB values. They are validated by `parseHandRecord` and then summarised by `trendHand`.
  This task removes a denial of service: a crafted store could make Statistics unusable through unbounded recursion.
  After the change, the work is O(n) with no recursion for any parsed store.
- No new dependency, secrets, injection surface or logging change. Randomness: N/A.

## 9. Non-functional
- `bb100Value` stays O(n) per group with no BigInt. The existing opt-in timing checks (`e2e/statistics-speed.spec.ts`,
  `tests/storage/trend-data-3000.acceptance.test.ts`) are unchanged and not run per push.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then Home, then Statistics. Real data shows the same BB/100 card as before.
- New tests:
  - `tests/stats/bb100-tampered.acceptance.test.tsx` → SPEC-01
  - `tests/stats/trends.test.ts` (added cases) → SPEC-02, SPEC-03, SPEC-04, SPEC-05
- Locked tests whose values would change: none. `tests/stats/bb100.acceptance.test.tsx` (TASK-11.2),
  `trend-grouping` (TASK-11.5), `trend-filters` (TASK-11.4), `trend-lineup` (TASK-11.7), `trend-view` and
  `trends.acceptance` (TASK-11.1/11.3) all use real stakes, so they take the exact path with the same values.
- Judge's end-to-end scenario: run `npx vitest run tests/stats/bb100-tampered.acceptance.test.tsx
  tests/stats/trends.test.ts tests/stats/bb100.acceptance.test.tsx`. Then run `npm run typecheck`. Optionally, in
  `npm run dev`, open Statistics with an existing cash history and confirm the BB/100 values are unchanged.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-11.14/qa.md`.
