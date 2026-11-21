# Spec: TASK-7.20 — Pin the preflop chart validator's edge cases

Status: READY (approved 2026-11-20)
Task: TASK-7.20 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: n/a (follow-up from the TASK-7.2 reviews, doc-14) · Dream: limit-holdem-trainer

## 1. Summary
The TASK-7.2 reviews left three loose ends in `src/advice/preflop-chart.ts`. (1) No test pins the rule that a
justification word is a run of letters, so the `/\S+/` mutant of `wordCount` survives. (2) `chartCell`'s
`RangeError('Unknown hand class <hc>')` is neither documented nor tested by message. (3) `parseChart` echoes bad
tokens and spot names at any length. This chore adds a test that kills the mutant (no code change needed for
that), documents and tests the hand-class `RangeError`, and cuts echoed tokens and spot names to 20 characters.

## 2. Scope
- In scope:
  - `src/advice/preflop-chart.ts`: a local `echo` helper (20-character cut), applied to the three echo sites
    (`invalid action`, `invalid alternative`, `spot … does not apply`). Rewrite the `chartCell` JSDoc so it
    lists both `RangeError`s.
  - New test file `tests/advice/preflop-chart-edges.acceptance.test.ts` covering SPEC-01..05.
- Not doing:
  - No change to `wordCount`, `CHART_WORDS` or `SPOT_WORDS`. The letter-run rule already rejects numeric and
    punctuation tokens (`src/advice/preflop-chart.ts:74-76`). Only the test is missing.
  - No edit to `tests/advice/preflop-chart.test.ts` or `tests/advice/preflop.acceptance.test.ts` (locked by
    TASK-7.2). Their echoed values are all 20 characters or fewer, so they stay green unchanged.
  - Not truncating `Chart file: unknown reference size "<value>"` (`:159`). It is not a token or a spot name,
    so it is out of the AC (scope concern).
  - Not changing `chartCell`'s messages or behaviour, and not truncating `<hc>` in `Unknown hand class <hc>`.
  - Not touching `echoText` in `src/engine/cards.ts` (10-character engine rule).
  - No change to `src/advice/charts/six-max.json`.
  - No new dependencies.
- Scope budget: files=2, lines=130

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Cut to at most 20 characters" means the echoed input is its first 20 characters, with `...` appended only when something was cut. A value of 20 characters or fewer is echoed unchanged. This uses the same shape as `echoText` (`src/engine/cards.ts:30-33`) with a 20-character limit. | yes | It matches the project's existing echo convention and the TASK-7.2 security review's suggestion ("the first 20 characters plus an ellipsis", `doit/TASK-7.2/reviews/round-1/security.json:9`) | 17 characters + `...` so the total is 20; no marker |
| A-2 | The spot name is cut as a single value (`"<position> <situation>"`), not per part. | yes | The message echoes the key as one string (`:172-175`), and the AC says "spot name" | Cut position and situation separately |
| A-3 | Only `"does not apply"` echoes an untrusted spot name. The `duplicate spot`, `missing spot`, missing-justification and per-cell messages use keys of valid `APPLICABLE_SPOTS` (at most 19 characters), so they need no cut. | yes | `found`/`spot` only hold keys that matched `applicable` (`:173-188`) | Wrap every key (no-op) |
| A-4 | Characters are counted in UTF-16 code units (`String.prototype.slice`), the same as `echoText`. | yes | Consistent with the existing helper. Inputs are bundled ASCII | Code-point slicing |
| A-5 | The AC#1 test covers both the chart-level (50-word) and the spot-level (15-word) justification, each given 60 numeric/punctuation tokens. | yes | The same `wordCount` guards both. "Missing its justification" matches both messages | Chart-level only |
| A-6 | Use a local `echo` helper in `preflop-chart.ts`, not a widened `echoText(text, max)`. | yes | Keeps the change inside one module. The advice validator does not depend on `engine/cards` | Add an optional limit to `echoText` |

## 3. Current system
- `src/advice/preflop-chart.ts:74-76` `wordCount` counts `/\p{L}+/gu` matches, and 0 for non-strings. It is
  used at `:166` (chart, `CHART_WORDS = 50`, `:62`) and `:182` (spot, `SPOT_WORDS = 15`, `:63`).
  The messages are `'<label>: missing plain-English justification (at least 50 words)'` and
  `'<label>: spot <key> is missing its plain-English justification (at least 15 words)'`.
- Echo sites: `:95` `` `${where} has invalid action "${token}" (use F, C or R)` ``; `:106`
  `` `${where} has invalid alternative "${token}"` `` (whole token); `:175`
  `` `${label}: spot ${key} does not apply at ${referenceSize}` `` where `key = spotKey(data.position,
  data.situation)` (`:78-79`, `String()` of untrusted values). Tokens come from `row.split(/\s+/)` (`:131`), so
  they never contain whitespace.
- `:202-215` `chartCell`: the JSDoc mentions only the missing-spot `RangeError`. `:213` throws
  `new RangeError(\`Unknown hand class ${hc}\`)` when `!Object.hasOwn(spot.cells, hc)`. `HandClass` is a plain
  `string` alias (`src/advice/hand-class.ts`), so any string type-checks.
- The existing test `tests/advice/preflop-chart.test.ts:197` only checks `toThrow(RangeError)` for
  `'constructor'` and never checks the message. Its `minimalChart()`/`withToken()` helpers (`:23-68`) are not
  exported.
- Shipped chart `src/advice/charts/six-max.json`: chart justification has 200 letter-words, the smallest spot
  justification has 61, the longest token has 4 characters and the longest spot key has 19 characters (measured with
  a letter-run count). It is parsed at import by `src/advice/preflop.ts:17` (`SIX_MAX_CHART`), so any
  validator regression fails every test that imports it. This task does not change the rules it is checked
  against.
- Locked tests: `doit/TASK-7.2/state.json` locks `tests/advice/preflop.acceptance.test.ts`. Its echo case
  (`:199`, token `X`) is 1 character. It is unaffected.
- Tests: Vitest (`npm test` = `vitest run --coverage`). Test files live in `tests/advice/*.test.ts` and
  `*.acceptance.test.ts`.
- Existing code to reuse:
  - `src/engine/cards.ts:30-33` `echoText` → the shape of the echo rule (copy the format, 20 instead of 10; A-6).
  - `tests/advice/preflop-chart.test.ts:23-68` → copy the `words`/`row`/`minimalChart`/`problemsOf`/`withToken`
    pattern into the new test file (those helpers are not exported, and the locked/existing file is not edited).
  - `src/advice/preflop-chart.ts` `APPLICABLE_SPOTS`, `parseChart`, `chartCell`, `ChartValidationError`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | AC#1 is met by tests alone. `wordCount` stays `/\p{L}+/gu`. | Change the counting rule | The code already behaves as the AC says; only the mutant-killing test is missing | no | n/a |
| D-2 | Echo cut = first 20 characters + `...` when longer (A-1). | See A-1 | Matches the existing `echoText` user-visible pattern; the caller directed following the AC's 20 | no | n/a |
| D-3 | All new tests go in one new acceptance file. | Add to `preflop-chart.test.ts` | Caller preference for new files; does not disturb TASK-7.2 snapshots | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/preflop-chart.ts` — add `ECHO_CHARS = 20` and `echo(text: string): string`; use it at the three
  echo sites; rewrite the `chartCell` JSDoc.
- `tests/advice/preflop-chart-edges.acceptance.test.ts` — new; SPEC-01..05.

### Components, interfaces and data
- `function echo(text: string): string` (module-private):
  `text.length <= ECHO_CHARS ? text : \`${text.slice(0, ECHO_CHARS)}...\``.
- Message changes (the format is otherwise identical):
  - `` `${where} has invalid action "${echo(token)}" (use F, C or R)` ``
  - `` `${where} has invalid alternative "${echo(token)}"` ``
  - `` `${label}: spot ${echo(key)} does not apply at ${referenceSize}` ``
- `chartCell` JSDoc, replacing `:202` exactly:
  ```
  /**
   * The authored cell for `hc` in the (position, situation) spot.
   * Throws RangeError('Chart <size> has no spot <position> <situation>') if the spot is absent.
   * Throws RangeError('Unknown hand class <hc>') if `hc` is not one of the 169 hand classes.
   */
  ```
  Signature and behaviour unchanged.

### Rules and algorithms
- Echo examples: `'X' + 'Y'.repeat(19)` (20 chars) → echoed unchanged; `'X' + 'Y'.repeat(30)` (31 chars) →
  `'X' + 'Y'.repeat(19) + '...'`; token `'R/' + 'Q'.repeat(30)` → `'R/' + 'Q'.repeat(18) + '...'`.
- Spot key `'P'.repeat(25) + ' unopened'` → `'P'.repeat(20) + '...'`; key `'P'.repeat(11) + ' unopened'`
  (20 chars) → unchanged.
- Word rule (unchanged): a word is a maximal run of Unicode letters. `'1 2 3 … , ; —'` → 0 words.

### Error handling and configuration
- No new error types. `ChartValidationError` still lists every problem, in the same order.

## 6. Behaviour specification

### SPEC-01: Numeric/punctuation justification is rejected as missing
- Verifies: AC#1
- Behaviour: Given an otherwise valid minimal chart whose chart `justification` is 60 space-separated tokens
  alternating numbers and punctuation (`Array.from({length: 60}, (_, i) => i % 2 ? '--;' : String(i)).join(' ')`),
  When `parseChart` runs, Then it throws `ChartValidationError` with problems exactly
  `['6-max chart: missing plain-English justification (at least 50 words)']`. And Given instead the
  `CO raise` spot's justification is those 60 tokens, Then problems are exactly
  `['6-max chart: spot CO raise is missing its plain-English justification (at least 15 words)']`.
- Verification: acceptance `tests/advice/preflop-chart-edges.acceptance.test.ts::rejects a justification of 60 numeric or punctuation tokens`

### SPEC-02: The shipped chart still validates
- Verifies: AC#1
- Behaviour: Given `src/advice/charts/six-max.json`, When `parseChart` runs on it, Then it returns a chart with
  26 spots and does not throw.
- Verification: acceptance `tests/advice/preflop-chart-edges.acceptance.test.ts::the shipped six-max chart still validates`

### SPEC-03: chartCell's unknown-hand-class RangeError is pinned and documented
- Verifies: AC#2
- Behaviour: Given a parsed minimal chart, When `chartCell(chart, 'CO', 'unopened', 'ZZ')` and
  `chartCell(chart, 'CO', 'unopened', 'constructor')` are called, Then each throws an error that is
  `instanceof RangeError` with `message` exactly `'Unknown hand class ZZ'` / `'Unknown hand class constructor'`.
  The `chartCell` JSDoc in `src/advice/preflop-chart.ts` contains `RangeError('Unknown hand class <hc>')`.
- Verification: acceptance `tests/advice/preflop-chart-edges.acceptance.test.ts::chartCell throws a documented RangeError for an unknown hand class`; command `grep -n "RangeError('Unknown hand class <hc>')" src/advice/preflop-chart.ts`

### SPEC-04: Long bad tokens are echoed cut to 20 characters
- Verifies: AC#3
- Behaviour: Given a minimal chart with the `CO unopened` `A9s` token (row 0, col 5) set to `'X' + 'Y'.repeat(30)`,
  When parsed, Then problems are exactly
  `['6-max chart: CO unopened A9s has invalid action "' + 'X' + 'Y'.repeat(19) + '..." (use F, C or R)']`.
  With the token `'R/' + 'Q'.repeat(30)` → `['6-max chart: CO unopened A9s has invalid alternative "R/' + 'Q'.repeat(18) + '..."']`.
  With the token `'X' + 'Y'.repeat(19)` (exactly 20) → `'… has invalid action "' + 'X' + 'Y'.repeat(19) + '" (use F, C or R)'` (no `...`).
- Verification: acceptance `tests/advice/preflop-chart-edges.acceptance.test.ts::cuts an echoed bad token to 20 characters`

### SPEC-05: Long bad spot names are echoed cut to 20 characters
- Verifies: AC#3
- Behaviour: Given a minimal chart with one extra spot `{ position: 'P'.repeat(25), situation: 'unopened', … }`,
  When parsed, Then problems are exactly `['6-max chart: spot ' + 'P'.repeat(20) + '... does not apply at 6-max']`.
  With position `'P'.repeat(11)` (key exactly 20 characters) → `['6-max chart: spot ' + 'P'.repeat(11) + ' unopened does not apply at 6-max']`.
- Verification: acceptance `tests/advice/preflop-chart-edges.acceptance.test.ts::cuts an echoed bad spot name to 20 characters`

## 7. Edge cases
- Boundary 20 vs 21 characters: SPEC-04 and SPEC-05 (exactly 20 is unchanged; longer is cut).
- Non-string spot fields (`undefined undefined`, 19 characters): covered by the existing
  `tests/advice/preflop-chart.test.ts:106`, which is unchanged.
- Mixed letters and digits (`a1`) still count as a word. This is unchanged and not pinned here.
- Empty, duplicate and concurrent cases: N/A. Pure synchronous function; empty justification is already covered (`tests/advice/preflop-chart.test.ts:161`).

## 8. Security considerations
- Trust boundary: `parseChart(raw: unknown)`. Today its only caller passes bundled JSON. The cut bounds the echoed
  text in error messages (TASK-7.2 security NIT). No new inputs, sinks, secrets, randomness or dependencies.

## 9. Non-functional
- None beyond the existing suite. `parseChart` cost is unchanged (O(1) work per echo).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print` (imports `SIX_MAX_CHART`, so it proves the shipped chart still validates)
- New tests: `tests/advice/preflop-chart-edges.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04,
  SPEC-05.
- Judge scenario: run `npm test`, then mutate `wordCount`'s regex to `/\S+/g` and confirm SPEC-01 fails
  (revert afterwards); run `npm run chart:print` and confirm it prints the chart with no error.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-7.20/qa.md`.
