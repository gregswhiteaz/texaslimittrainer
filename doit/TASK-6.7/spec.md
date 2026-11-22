# Spec: TASK-6.7 — Record an edited line-up as Custom

Status: READY (approved 2026-11-22)
Task: TASK-6.7 · Parent/epic: TASK-6 · Requirements: REQ-009 (REQ-009.6) · Dream: limit-holdem-trainer

## 1. Summary
The line-up module (`src/bots/lineup.ts`, TASK-6.6) gains two pure functions. `resolveLineUpName(preset, seats)`
returns the chosen preset's name when every bot seat's style equals that preset's assignment for the table size and
user seat, and `Custom` otherwise (REQ-009.6). `lineUpSessionConfig(base, preset, seats)` builds the `SessionConfig`
handed to the table on Start game: it carries the resolved line-up name and the actual (possibly edited) seat
styles and names. This keeps results against a preset apart from results against edited tables. Game Config wiring
(TASK-2.5/2.8) and persistence (E03) are later stories.

## 2. Scope
- In scope:
  - `resolveLineUpName` and `lineUpSessionConfig` in `src/bots/lineup.ts`, with input validation (RangeError).
  - Fix the `LineUpName` doc comment in `src/table/session.ts:71` so it states the REQ-009.6 rule (D-1).
  - Acceptance tests for AC#1–AC#4 in a new file, and unit tests for the error paths and branches.
- Not doing:
  - Any Game Config UI: preset picker, per-seat style editing, Start game wiring (TASK-2.5, TASK-2.8).
  - Storing the session or hand records, or Statistics filtering by line-up (E03, TASK-11.7).
  - Drawing the user seat or the starting button at random (REQ-010, its own story).
  - Randomise line-up (REQ-009.5), bust replacements (TASK-6.8).
  - Changing `seatLineUp`, `BOT_NAMES`, the preset rules, the playtest, `DEFAULT_SESSION_CONFIG` or any existing
    acceptance test file.
  - A helper to edit one seat's style (the Game Config story owns editing; tests edit seats inline).
- Scope budget: files=4, lines=300

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#1's example ("Mixed at 6 seats, seat 4 changed from Maniac to Rock") is tested with the user at seat 1. Under TASK-6.6's clockwise rule the Maniac (bot 3) sits at seat 4 only when the user is at seat 1. With the default user seat 5 (`src/table/session.ts:61`) seat 4 is TAG and the Maniac is seat 2; with the user at seat 4, seat 4 is the user. A unit test also covers the default seat 5 (Maniac at seat 2 edited to Rock → Custom). | yes | Follows the code (`src/bots/lineup.ts:31-36,53-58`), not the worked example. The AC's intent (one edited bot seat → Custom) is unchanged. | Test at user seat 5 editing seat 2 only |
| A-2 | Bot display names are ignored when resolving the name. Only styles decide Preset vs Custom. | yes | REQ-009.6 talks about seat styles only; names are fixed by order (TASK-6.6 A-1). | Treat a renamed bot as Custom |
| A-3 | `lineUpSessionConfig` keeps `gameType`, `stake`, `speed` and `button` from `base`, and sets `players`, `userSeat`, `seats` and `lineUp` from the line-up. The user's seat gets the name `You`, matching `DEFAULT_SEATS` (`src/table/session.ts:63`). | yes | Game Config already holds the other fields (`src/ui/config/GameConfigScreen.tsx:50-60`). `You` is existing text, not new. | Pass every field explicitly |
| A-4 | `lineUpSessionConfig` throws `RangeError('Button must be a seat at the table')` when `base.button` is not a whole number in 1..players. It never clamps or moves the button. | yes | The starting button is REQ-010's job; silently moving it would hide a caller bug (e.g. default button 6 at heads-up). | Clamp to the last seat; move to seat 1 |
| A-5 | Malformed seats throw `RangeError` with the messages in §5 (seat numbering, user count, missing bot style or name). Size and user-seat range errors come from `seatLineUp`. | yes | Same error style as `seatLineUp` (TASK-6.6 A-6). | Return Custom for malformed input |

## 3. Current system
- `src/bots/lineup.ts` (TASK-6.6): `LineUpPreset`, `LINE_UP_PRESETS`, `BOT_NAMES`, `LineUpSeat {seat, kind, style,
  name}` (`:19-27`), `seatLineUp(preset, size, userSeat)` (`:40-62`) which validates size 2..10, user seat 1..size and
  preset, and places bot k at seat `((userSeat − 1 + k) mod size) + 1`. Only type imports (TASK-6.6 D-4), so UI code
  can import it cheaply.
- Preset rule (`src/bots/lineup.ts:29-36`): Mixed cycles TAG, Calling station, Maniac, Rock over bots k = 1..n−1;
  Tough = bot 1 Maniac (n ≥ 3) else TAG; Soft = Calling station for odd k, Rock for even k.
- Session types (`src/table/session.ts`): `BotStyle` (`:51`, same union as `StyleName` in `src/bots/style.ts:11`),
  `SessionSeat {seat, name, kind, style}` (`:52-57`), `USER_SEAT = 5` (`:58`), `DEFAULT_SEATS` with the user named
  `You` (`:60-67`), `LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom'` (`:72`), `SessionConfig` cash | sit-and-go
  union (`:76-93`), `DEFAULT_SESSION_CONFIG` (`:94-103`, `lineUp: 'Custom'`). `SeatNumber = number`
  (`src/engine/hand.ts:5`).
- Game Config today shows only game type and stake choices and hands a `SessionConfig` to `onStart`
  (`src/ui/config/GameConfigScreen.tsx:15-19`). TASK-2.5 AC#6 will call this story's builder on Start game.
- Tests: Vitest; `npm test` = `vitest run --coverage` with ≥ 90% line coverage for `src/{engine,bots,advice,stats,
  playtest,table}/**` and ≥ 70% overall (`vite.config.ts:11-20`). CI's unit group excludes `*.acceptance.test.*`
  (`package.json:14`), so new source code must be covered by `tests/bots/lineup.test.ts` too.
- Lint: headless boundary for `src/bots/**` (`tools/lint/headless-boundary.js:7-9`): no React/DOM/IndexedDB/UI imports.
- Existing tests: `tests/bots/lineup.test.ts` (unit), `tests/bots/lineup.acceptance.test.ts` (TASK-6.6, locked — not
  touched).
- No golden-spot suite exists yet (`grep -rl golden tests` finds only a toolchain test; E07-S14 adds it).
- Existing code to reuse:
  - `src/bots/lineup.ts::seatLineUp` → the preset's expected styles and all size / user-seat / preset validation.
  - `src/bots/lineup.ts::LINE_UP_PRESETS` → iterate presets in tests.
  - `src/table/session.ts` types `SessionConfig`, `SessionSeat`, `LineUpName`, `DEFAULT_SESSION_CONFIG` (tests) →
    no new config types.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The name is compared only against the **chosen** preset. A Mixed table edited until it equals the Soft assignment is Custom, not Soft. Heads-up Mixed and Tough (both one TAG) each keep their chosen name. The `LineUpName` comment in `src/table/session.ts:71` ("Custom when the bot styles match no preset") is reworded to this rule. | Name whichever preset matches | REQ-009.6 ("differ from the chosen preset's assignment") and the task description say so; this is the codebase/requirements answer, not a new choice. | no | n/a |
| D-2 | Both functions live in `src/bots/lineup.ts` with `import type` from `../table/session` only (no runtime import). | Put the builder in `src/table/session.ts` | One line-up module, as the story describes; `session.ts` imports bot and engine code at runtime, `lineup.ts` stays light for Game Config (TASK-6.6 D-4). | no | n/a |
| D-3 | AC tests go in a new file `tests/bots/lineup-name.acceptance.test.ts`. | Append to `tests/bots/lineup.acceptance.test.ts` | That file is TASK-6.6's locked acceptance file. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/lineup.ts` — add `resolveLineUpName`, `lineUpSessionConfig` and a private seat-shape check.
- `src/table/session.ts` — reword the `LineUpName` doc comment only (D-1).
- `tests/bots/lineup-name.acceptance.test.ts` — new; AC#1–AC#4.
- `tests/bots/lineup.test.ts` — add unit tests for error paths, default user seat and builder fields.

### Components, interfaces and data
```ts
import type { LineUpName, SessionConfig } from '../table/session';

/** REQ-009.6: `preset` when every bot seat's style equals seatLineUp(preset, seats.length, userSeat) at that
 *  seat, otherwise 'Custom'. Names are ignored. Throws RangeError on malformed seats (§5 errors). */
export function resolveLineUpName(preset: LineUpPreset, seats: readonly LineUpSeat[]): LineUpName;

/** The SessionConfig for Start game: `base` with players = seats.length, userSeat = the user's seat,
 *  lineUp = resolveLineUpName(preset, seats), seats = each seat in ascending order as a SessionSeat
 *  (bots keep their name and style; the user is { name: 'You', kind: 'user', style: null }).
 *  gameType, stake (cash only), speed and button come from `base`. Pure: `base` and `seats` are not mutated. */
export function lineUpSessionConfig(
  base: SessionConfig,
  preset: LineUpPreset,
  seats: readonly LineUpSeat[],
): SessionConfig;
```
- Input `seats` is a `LineUpSeat[]` as produced by `seatLineUp` and then edited (a bot's `style` replaced).
- Invariants checked before anything else (in this order):
  1. `seats[i].seat === i + 1` for every i (ascending 1..n, no gaps or duplicates).
  2. Exactly one seat has `kind === 'user'`.
  3. Every bot seat has a non-null `style` and `name`.
  Then `seatLineUp(preset, seats.length, userSeat)` supplies the expected styles and validates size (2..10) and
  preset.
- Output of `lineUpSessionConfig` satisfies the `SessionConfigBase` comments: `players === seats.length`, one user
  seat at `userSeat`, ascending order.

### Rules and algorithms
- R-1: `resolveLineUpName` returns `preset` iff for every seat s with `kind === 'bot'`,
  `s.style === expected[s.seat − 1].style`, where `expected = seatLineUp(preset, n, userSeat)`. Otherwise `'Custom'`.
- Worked examples (checked against `src/bots/lineup.ts:29-36,53-58`):
  - Mixed, n=6, user seat 1: seats 2..6 = TAG, Calling station, Maniac, Rock, TAG. Seat 4 Maniac → Rock: Custom
    (AC#1, A-1).
  - Mixed, n=6, user seat 5 (default): seats 6, 1, 2, 3, 4 = TAG, Calling station, Maniac, Rock, TAG. Seat 2 Maniac →
    Rock: Custom.
  - Soft, n=6, user seat 1: seats 2..6 = CS, Rock, CS, Rock, CS. Seat 3 Rock → TAG: Custom; back to Rock: Soft
    (AC#3).
  - Mixed, n=6, user seat 1, edited to seats 2..6 = CS, Rock, CS, Rock, CS (the Soft assignment): Custom (D-1).
  - Tough, n=2, user seat 2: seat 1 TAG → Tough; resolved with preset Mixed → Mixed (D-1).
- R-2: `lineUpSessionConfig` = `{ ...base, players, userSeat, lineUp, seats }`; for a cash `base` the `stake` is kept,
  for a sit-and-go `base` there is no `stake` key.

### Error handling and configuration
All errors are `RangeError` with these exact messages (checked in this order):
- `'Seats must be numbered 1 to the table size in ascending order'` — invariant 1 fails (also an empty array).
- `'A line-up must have exactly one user seat'` — zero or 2+ user seats.
- `'Every bot seat must have a style and a name'` — a bot with `style` or `name` null.
- From `seatLineUp`: `'Table size must be a whole number from 2 to 10'` (e.g. 1 or 11 seats),
  `'Unknown line-up preset: <x>'`.
- `lineUpSessionConfig` only: `'Button must be a seat at the table'` when `base.button` is not an integer in
  1..seats.length (A-4). Checked after the seats are resolved.
No configuration or defaults are added.

## 6. Behaviour specification

### SPEC-01: An edited Mixed seat makes the line-up Custom
- Verifies: AC#1, DoD#1
- Behaviour: Given `seatLineUp('Mixed', 6, 1)` (seat 4 is Maniac) with seat 4's style changed to `Rock`, When
  `resolveLineUpName('Mixed', seats)` runs, Then it returns `'Custom'`; and `lineUpSessionConfig(
  DEFAULT_SESSION_CONFIG, 'Mixed', seats)` has `lineUp: 'Custom'` and seat styles, seats 1..6 = null, TAG, Calling
  station, Rock, Rock, TAG (the edited ones).
- Verification: acceptance `tests/bots/lineup-name.acceptance.test.ts::AC#1 Mixed at 6 seats with seat 4 changed from Maniac to Rock is Custom`

### SPEC-02: Every unedited preset resolves to its own name
- Verifies: AC#2, DoD#1
- Behaviour: Given each preset in `LINE_UP_PRESETS`, every size n in 2..10 and every user seat u in 1..n (162
  line-ups), When `resolveLineUpName(preset, seatLineUp(preset, n, u))` runs, Then it returns the preset name.
- Verification: acceptance `tests/bots/lineup-name.acceptance.test.ts::AC#2 every unedited preset at every size resolves to the preset name`

### SPEC-03: Editing a seat and changing it back restores the preset name
- Verifies: AC#3, DoD#1
- Behaviour: Given `seatLineUp('Soft', 6, 1)`, When seat 3's style is changed from `Rock` to `TAG`, Then
  `resolveLineUpName('Soft', …)` is `'Custom'`; When seat 3 is changed back to `Rock`, Then it is `'Soft'`.
- Verification: acceptance `tests/bots/lineup-name.acceptance.test.ts::AC#3 Soft with one seat changed to TAG and back is Soft`

### SPEC-04: The Start game config carries Custom and every edited style
- Verifies: AC#4, DoD#1
- Behaviour: Given a cash `base` = `{...DEFAULT_SESSION_CONFIG, button: 3}` and `seatLineUp('Mixed', 6, 1)` with seat
  4 → Rock and seat 6 → Calling station, When `lineUpSessionConfig(base, 'Mixed', seats)` runs, Then the result equals
  `{gameType: 'cash', stake: {smallBet: 4, bigBet: 8}, speed: 'rapid', button: 3, players: 6, userSeat: 1,
  lineUp: 'Custom', seats: [{seat: 1, name: 'You', kind: 'user', style: null}, {seat: 2, name: 'Ava', kind: 'bot',
  style: 'TAG'}, {seat: 3, name: 'Ben', kind: 'bot', style: 'Calling station'}, {seat: 4, name: 'Cal', kind: 'bot',
  style: 'Rock'}, {seat: 5, name: 'Dee', kind: 'bot', style: 'Rock'}, {seat: 6, name: 'Eli', kind: 'bot', style:
  'Calling station'}]}`; and with the seats unedited the result's `lineUp` is `'Mixed'`.
- Verification: acceptance `tests/bots/lineup-name.acceptance.test.ts::AC#4 Start game config carries Custom and every edited style`

### SPEC-05: Default user seat, chosen-preset-only rule and sit-and-go base
- Verifies: AC#1, AC#4
- Behaviour: Given `seatLineUp('Mixed', 6, 5)`, When seat 2 (the Maniac) → Rock, Then `resolveLineUpName` is
  `'Custom'` (A-1). Given `seatLineUp('Mixed', 6, 1)` edited to the Soft assignment, Then `resolveLineUpName('Mixed',
  …)` is `'Custom'` and `resolveLineUpName('Soft', …)` is `'Soft'` (D-1). Given `seatLineUp('Tough', 2, 2)`, Then
  `resolveLineUpName('Mixed', …)` is `'Mixed'`. Given a sit-and-go base
  (`configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', …)` with `button: 1`) and `seatLineUp('Soft', 4, 2)`, When
  `lineUpSessionConfig` runs, Then `gameType` is `'sit-and-go'`, `'stake' in result` is false, `players` is 4,
  `userSeat` 2, `lineUp` `'Soft'`. Neither input array nor `base` is mutated.
- Verification: unit `tests/bots/lineup.test.ts::resolveLineUpName and lineUpSessionConfig follow the rules`

### SPEC-06: Malformed seats and a bad button throw RangeError
- Verifies: DoD#1, DoD#2
- Behaviour: Given seats that break the §5 invariants, When `resolveLineUpName` or `lineUpSessionConfig` runs, Then
  it throws `RangeError` with the exact §5 message: `[]` and seats numbered `[1, 3]` or `[2, 1]` → numbering message;
  no user seat or two user seats → user-seat message; a bot with `style: null` or `name: null` → style-and-name
  message; 11 seats (valid numbering, one user) → table-size message; preset `'Custom'` → unknown-preset message.
  `lineUpSessionConfig` with `base.button` 0, 7 or 2.5 for 6 seats → `'Button must be a seat at the table'`.
- Verification: unit `tests/bots/lineup.test.ts::resolveLineUpName and lineUpSessionConfig reject malformed input`

### SPEC-07: Checks, coverage, boundaries, CI and documentation
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the finished change, When the checks run, Then:
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors and coverage holds (≥ 90% for
    `src/bots/**`, ≥ 70% overall); every new line in `src/bots/lineup.ts` is covered by `tests/bots/lineup.test.ts`
    alone (`npm run test:unit` passes its thresholds).
  - `src/bots/lineup.ts` has only `import type` statements and the headless-boundary lint is clean (no UI, React,
    DOM or browser-only imports).
  - `npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed` reports `Invariant violations: 0`
    (DoD#6; this story touches the bots module but not policies, so the result is unchanged).
  - CI is green on `doit/TASK-6.7`.
  - A story doc is published with `backlog doc`: the Preset vs Custom rule (D-1) with the §5 worked examples, the
    two functions, the error messages, and the AC#1 seat note (A-1).
  - Not applicable: DoD#3 (no golden-spot suite yet, E07-S14), DoD#7 and DoD#12 (no screen or dialog), DoD#8 (no
    network code), DoD#9 (no strategy content, chart, range or golden spot).
- Verification: command `npm run lint && npm run typecheck && npm test && npm run test:unit && npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed`

## 7. Edge cases
- Heads-up (n = 2): one bot; Mixed and Tough both expect TAG and each keeps its chosen name (SPEC-02, SPEC-05).
- Full ring (n = 10) and every user seat: SPEC-02.
- Edited then reverted: SPEC-03.
- Edited into another preset's pattern: Custom (SPEC-05, D-1).
- Every bot edited vs one bot edited: both Custom (SPEC-01, SPEC-04).
- Invalid input (bad numbering, user count, null style/name, size, preset, button): SPEC-06.
- Duplicate seats: covered by the numbering check (SPEC-06).
- Concurrency, interruption, dependency failure, permissions: N/A — pure synchronous functions with no I/O.

## 8. Security considerations
- Trust boundary: the seats come from Game Config state (TASK-2.5/2.8) and later from stored config (E03); the shape
  checks in §5 reject malformed seats. Style values are typed; runtime validation of unknown style strings belongs to
  the stored-data loader (E03/TASK-13.6), not here.
- No authn/authz, secrets, injection, logging, network, new dependencies or randomness. N/A.

## 9. Non-functional
- `resolveLineUpName` is O(n) for n ≤ 10; SPEC-02's 162 line-ups run in well under a second in the normal suite. No
  slow-group test is needed.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — pure module with no UI or CLI entry yet; Game Config wiring is TASK-2.5/2.8. The Judge runs
  `npx vitest run tests/bots/lineup-name.acceptance.test.ts tests/bots/lineup.test.ts`.
- New tests:
  - `tests/bots/lineup-name.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04.
  - `tests/bots/lineup.test.ts` (added cases) → SPEC-05, SPEC-06.
- End-to-end for the Judge: run the two test files above, then read SPEC-04's expected config and confirm the
  edited styles and `lineUp: 'Custom'` appear exactly; confirm `src/bots/lineup.ts` imports are type-only.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-6.7/qa.md`.
