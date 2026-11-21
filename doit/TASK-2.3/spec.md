# Spec: TASK-2.3 — Choose the stake for a cash game

Status: READY (approved 2026-11-21)
Task: TASK-2.3 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-006, REQ-007 · Dream: limit-holdem-trainer

## 1. Summary
Game Config today shows the stake as a read-only "$4 / $8" row (TASK-2.1 D-6). This story turns that row into a
stake selector offering exactly the six REQ-006.1 stakes, $4/$8 preselected. The read-only Buy-in row then
follows the chosen stake (20 × big bet), and Start game hands the chosen stake to the table. The engine, the
session, the table header and the TEMPORARY top-up already derive blinds, stacks and header text from
`SessionConfig.stake`, so the product change is a stake list constant plus the selector. The rest is tests that
prove all six stakes end to end.

## 2. Scope
- In scope:
  - `src/table/session.ts`: export `CASH_STAKES`, the six REQ-006.1 stakes in ascending order.
    `DEFAULT_SESSION_CONFIG.stake` stays `{ smallBet: 4, bigBet: 8 }`.
  - `src/ui/config/GameConfigScreen.tsx`: the Stakes row becomes a labelled native `<select>` holding the
    chosen stake in local state, seeded from `config.stake`. The Buy-in row stays read-only text computed from
    the chosen stake. Start game calls `onStart({ ...config, stake: chosen })`.
  - `src/ui/styles.css`: style the select (44 px target, dark theme) and vertically centre the field rows.
  - New tests (unit, acceptance, Playwright), plus the extraction-only amendment of one locked TASK-2.1 test
    (Q-2, approved).
- Not doing:
  - Game type, players, line-up, bot style or speed selectors (TASK-2.4, TASK-2.2, TASK-2.5, TASK-2.11).
  - Hiding the stake selector for Sit-and-go (REQ-006.4 belongs to TASK-2.4, which adds the game-type choice).
  - Remembering the last chosen stake, or any storage (TASK-2.10). Nothing is written to `localStorage` or
    `sessionStorage`.
  - Rebuy / Leave table dialog and bot replacement (REQ-007.2–007.8, E03). The TEMPORARY top-up in
    `nextHand` stays as is. It already tops up to `buyIn(table.config.stake)`, i.e. 20 big bets of the chosen
    stake (`src/table/session.ts:168-174`), and its removal belongs to TASK-1.16 / TASK-3.11 / TASK-3.21.
  - A stake option for the playtest CLI (`src/playtest/runner.ts:29-30` stays at $4/$8, A-5).
  - The app-wide no-real-money check (E02-S14).
  - Any change to the engine, bots or advice.
- Scope budget: files=7, lines=340

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Nothing is stored. "First use" means every opening of Game Config: each New game shows $4/$8, including after Cancel or ← Home, until TASK-2.10 pre-fills from the last session. | yes | The app stores nothing (TASK-2.1 A-2, locked `e2e/home.spec.ts::cancel and home return to Home with nothing stored`). Persisting a stake would add a stored data format, which TASK-2.10 owns. | Keep the last chosen stake in `App` memory for the browser session |
| A-2 | Changing the stake updates the Buy-in text in place without an `aria-live` announcement. | yes | The buy-in is a static summary next to the control. Screen-reader users read it in document order after the select. No other Game Config field announces. | `aria-live="polite"` on the Buy-in value; `aria-describedby` from the select to the Buy-in |
| A-3 | Each `<option value>` is `"<smallBet>/<bigBet>"` (e.g. `"4/8"`). The select's `id` is `config-stake`. | yes | Unique, readable keys that need no index arithmetic. They are not user-visible. | Index into `CASH_STAKES` |
| A-4 | `CASH_STAKES` lives in `src/table/session.ts` next to `Stake`, `stakesFor` and `buyIn`. | yes | Headless module under the 90% coverage group. The UI imports from it already (`GameConfigScreen.tsx:1-7`). | New `src/table/stakes.ts` |
| A-5 | The 10,000-hand playtest keeps its fixed $4/$8 cash stakes. All six stakes are exercised by the new session/engine tests instead. | yes | The engine is stake-generic (`createHand` validates any stakes, `src/engine/hand.ts:160-169`). A CLI flag is outside this story. | Add `--stake` to the playtest CLI |
| A-6 | The selector does not guard against a `config.stake` outside `CASH_STAKES`. | yes | The only producer is `DEFAULT_SESSION_CONFIG` (TASK-2.1 A-11). TASK-2.10's loader must validate stored config. | Fall back to $4/$8 when unknown |

## 3. Current system
- Stack: React 19 + Vite 8 + TypeScript 6 strict; Vitest 5 in the `node` environment (`vite.config.ts:7-8`). UI
  unit tests render with `react-dom/server` `renderToString` and regex the markup
  (`tests/ui/home.acceptance.test.tsx:1-9`). There is no jsdom, so interaction is tested in Playwright
  (Chromium + WebKit, 1280×720, `playwright.config.ts:3-17`).
- Lint enforces the headless boundary (engine/bots/advice/stats import no UI) via
  `tools/lint/headless-boundary.js` (`eslint.config.js:6`). Coverage: 70% overall, 90% for
  `src/{engine,bots,advice,stats,playtest,table}` (`vite.config.ts:16-19`).
- Stake plumbing already exists and is generic:
  - `Stake { smallBet, bigBet }`, `stakesFor` (small blind = floor(smallBet/2), big blind = smallBet) and
    `buyIn = 20 × bigBet` live at `src/table/session.ts:26-43`. `DEFAULT_SESSION_CONFIG.stake = { 4, 8 }` is at
    `:85-94`.
  - `seatSession` seats every player with `buyIn(config.stake)` and `stakesFor(config.stake)`
    (`src/table/session.ts:122-135`). The engine posts `stakes.smallBlind` / `stakes.bigBlind`
    (`src/engine/hand.ts:250-288`).
  - The TEMPORARY top-up refills to `buyIn(table.config.stake)` below `minimumStack(stakes)`
    (`src/table/session.ts:168-174`), so it already scales to 20 big bets of any stake.
  - Table header: `headerText` renders `Cash · 6 players · $<sb>/$<bb> · Hand #n`
    (`src/table/table-view.ts:46-49`), shown in `.table-header-line` (`e2e/table-display.spec.ts:202`).
  - Seat markup: `li[data-seat="n"] [data-part="stack"]` and `[data-part="action"]` (last action, e.g.
    "Small blind $2") (`src/ui/table/Table.tsx:33-76`, `lastActionText` at `src/table/table-view.ts:52-57`).
  - Advice and bots work from pot odds and the chart, which are ratios and hand classes, not dollar amounts
    (`src/advice/postflop.ts:70-78`). No `$4/$8` assumption exists outside the defaults and the playtest
    constants (`src/playtest/runner.ts:29-30`), so nothing needs to scale.
- Game Config: `src/ui/config/GameConfigScreen.tsx:36-104` renders a `<dl className="config-fields">` of
  `[label, value]` rows. The Stakes row is `` `$${smallBet} / $${bigBet}` `` and the Buy-in row is
  `` `$${stack} (${stack / bigBet} big bets)` ``. Start game calls `onStart(config)`. `App` passes
  `DEFAULT_SESSION_CONFIG` and moves to the table with whatever config `onStart` returns
  (`src/ui/App.tsx:24-31`), so `App` needs no change.
- Storyboard: `dreams/limit-holdem-trainer/storyboards/Config.dc.html:41-45` shows a native
  `<select id="stakes">` labelled "Stakes (small bet / big bet)" with options like `$2 / $4`, styled
  `min-height: 44px; font-size: 15px; padding: 0 12px; border: 1px solid #4A515C; border-radius: 8px; background: #1A1D22`.
- Locked tests touching this screen (owner TASK-2.1, `doit/TASK-2.1/state.json` `locked_tests`):
  - `tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots`. It
    breaks: its `<dt>(.*?)</dt><dd>(.*?)</dd>` extraction would capture the label/select markup, and it
    asserts `not.toMatch(/<(input|select|textarea)[\s>]/)` (lines 44-52, 70). See Q-2.
  - `e2e/home.spec.ts` (default $4/$8 flow, axe, same-origin) and
    `tests/table/session-config.acceptance.test.ts` are unaffected because the default stays $4/$8.
  - `tests/table/session.acceptance.test.ts::buy-in is 20 big bets of the configured stake` (TASK-3.1) is
    unaffected.
- Existing code to reuse:
  - `src/table/session.ts` → `Stake`, `stakesFor`, `buyIn`, `seatSession`, `dealHand`, `DEFAULT_SESSION_CONFIG`.
  - `src/table/table-view.ts` → `headerText`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords`. `e2e/support/axe.ts` →
    `expectNoSeriousAxeViolations`. `e2e/support/table-locators.ts` → `expectToAct`.
  - Paused-clock pattern for the first deal: `e2e/home.spec.ts:212-249` (install clock at 0, `pauseAt(1000)`,
    advance in 50 ms slices).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The stake control is a native `<select id="config-stake">` inside the existing Stakes row: `<dt><label htmlFor="config-stake">Stakes (small bet / big bet)</label></dt><dd><select …>`. There are six options in `CASH_STAKES` order. Option text is `$<smallBet> / $<bigBet>` (`$2 / $4`, `$3 / $6`, `$4 / $8`, `$6 / $12`, `$10 / $20`, `$20 / $40`). The Buy-in row stays plain read-only text `$<20×bigBet> (20 big bets)`. No other text is added. | Radio group of six stake buttons; options written `$2/$4` (no spaces, as in the AC and table header); a separate fieldset outside the `<dl>` | Matches the storyboard control and label and the approved TASK-2.1 Q-4 row text `$4 / $8`. One 44 px control keeps the panel within 1280×720. | yes | user (Q-1, auto-accepted) |
| D-2 | Amend locked `tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots` (owner TASK-2.1) in extraction only. (a) Strip tags from each `<dt>`. (b) When a `<dd>` holds a `<select>`, take the text of its `selected=""` `<option>`. (c) Replace `expect(html).not.toMatch(/<(input|select|textarea)[\s>]/)` with `expect(html.match(/<(input|select|textarea)[\s>]/g)).toEqual(['<select '])`, i.e. exactly one select and still no input or textarea. The expected `fields` array (incl. `['Stakes (small bet / big bet)', '$4 / $8']`, `['Buy-in', '$160 (20 big bets)']`), the rows and the button list stay byte-identical. | Leave the test untouched (impossible: any selector is a control, and the row markup changes); delete the no-controls assertion | Keeps every behavioural expectation. Only the "no form controls" clause narrows, and it narrows to exactly the control this story adds. | yes | user (Q-2, auto-accepted) |
| D-3 | `CASH_STAKES: readonly Stake[]` = `[{2,4},{3,6},{4,8},{6,12},{10,20},{20,40}]`, frozen (`Object.freeze` on the array and on each entry). The default stays the literal `{ smallBet: 4, bigBet: 8 }`. | Derive the default as `CASH_STAKES[2]` | The locked session-config test asserts the default by value, so either works. The literal keeps the default readable. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add exported `CASH_STAKES` (REQ-006.1) with a doc comment.
- `src/ui/config/GameConfigScreen.tsx` — stake `useState`, the Stakes row as label + select, Buy-in from the
  chosen stake, Start game passes `{ ...config, stake }`. Update the header comment (no longer fully read-only).
- `src/ui/styles.css` — `.config-fields select` styling and `align-items: center` on `.config-fields div`.
- `tests/ui/home.acceptance.test.tsx` — LOCKED (TASK-2.1); extraction-only amendment per D-2 / Q-2.
- `tests/table/stakes.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03.
- `tests/ui/game-config-stake.acceptance.test.tsx` — new: SPEC-04, SPEC-05, SPEC-06.
- `e2e/stake-choice.spec.ts` — new: SPEC-07, SPEC-08, SPEC-09.

### Components, interfaces and data
- `src/table/session.ts`:
  ```ts
  /** REQ-006.1: the cash stakes offered on Game Config, ascending; first-use default $4/$8. */
  export const CASH_STAKES: readonly Stake[]
  ```
- `GameConfigScreen` props are unchanged (`config`, `onStart`, `onCancel`).
  - `const [stake, setStake] = useState<Stake>(config.stake)`.
  - The select's `value` is `` `${stake.smallBet}/${stake.bigBet}` ``. `onChange` sets the `CASH_STAKES` entry
    whose key equals `event.target.value`.
  - Start game: `onStart({ ...config, stake })`. With no change this is a config equal by value to
    `DEFAULT_SESSION_CONFIG`.
  - The other rows (Game type, Players, Speed) and the Opponents panel are unchanged. Row order is unchanged:
    Game type, Players at the table, Stakes, Buy-in, Speed.
- `SessionConfig` shape, `App`, the table and the engine are unchanged. No persisted data.

### Rules and algorithms
Hand-worked for each stake (blinds = floor(smallBet/2) / smallBet; buy-in = 20 × bigBet):

| Option text | Key | Blinds (SB / BB) | Buy-in text |
|---|---|---|---|
| `$2 / $4` | `2/4` | $1 / $2 | `$80 (20 big bets)` |
| `$3 / $6` | `3/6` | $1 / $3 | `$120 (20 big bets)` |
| `$4 / $8` (default) | `4/8` | $2 / $4 | `$160 (20 big bets)` |
| `$6 / $12` | `6/12` | $3 / $6 | `$240 (20 big bets)` |
| `$10 / $20` | `10/20` | $5 / $10 | `$400 (20 big bets)` |
| `$20 / $40` | `20/40` | $10 / $20 | `$800 (20 big bets)` |

Worked example (AC#3): choose `$10 / $20` and press Start game. The header reads
`Cash · 6 players · $10/$20 · Hand #1`, and all six seats show `$400` before the deal. The default button is 6,
so seat 1 posts the small blind (`Small blind $5`, stack `$395`) and seat 2 the big blind (`Big blind $10`,
stack `$390`).

### Error handling and configuration
- No user input outside the six options exists, so no error path. An unknown `config.stake` is not produced
  (A-6).
- Default: $4/$8 on every opening of Game Config (A-1).

## 6. Behaviour specification

### SPEC-01: The stake list is exactly the six REQ-006 stakes, $4/$8 by default
- Verifies: AC#1, DoD#1
- Behaviour: Given `CASH_STAKES` and `DEFAULT_SESSION_CONFIG`, When read, Then `CASH_STAKES` equals
  `[{2,4},{3,6},{4,8},{6,12},{10,20},{20,40}]` (as `{ smallBet, bigBet }`) in that order, has length 6, is
  frozen, and `DEFAULT_SESSION_CONFIG.stake` equals `{ smallBet: 4, bigBet: 8 }`.
- Verification: acceptance `tests/table/stakes.acceptance.test.ts::cash stakes are exactly the six REQ-006 stakes with $4/$8 the default`

### SPEC-02: The engine posts the REQ-006.2 blinds at every stake
- Verifies: AC#2, DoD#1
- Behaviour: Given each stake of `CASH_STAKES` in order, When `seatSession({ stake })` is dealt with a fixed
  replay code, Then the hand's first two action records are `small-blind` and `big-blind`, with amounts
  [1,2], [1,3], [2,4], [3,6], [5,10], [10,20] respectively. `stakesFor(stake)` gives the same blinds, and every
  starting stack is `20 × bigBet` (80, 120, 160, 240, 400, 800).
- Verification: acceptance `tests/table/stakes.acceptance.test.ts::every stake posts its REQ-006 blinds and seats a 20 big bet buy-in`

### SPEC-03: A $10/$20 session has the $10/$20 header, $5/$10 blinds and $400 stacks
- Verifies: AC#3, DoD#1
- Behaviour: Given `seatSession({ ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 10, bigBet: 20 } })`, When the
  first hand is dealt, Then `headerText(table.config, 1)` is `Cash · 6 players · $10/$20 · Hand #1`, every
  `startingStack` is 400, `hand.stakes` is `{ smallBlind: 5, bigBlind: 10, smallBet: 10, bigBet: 20 }`, the
  `small-blind` record is seat 1 amount 5 and the `big-blind` record is seat 2 amount 10 (default button 6).
- Verification: acceptance `tests/table/stakes.acceptance.test.ts::a $10/$20 session shows $10/$20, posts $5 and $10 and seats $400 stacks`

### SPEC-04: Game Config renders the stake selector with six options and $4 / $8 selected
- Verifies: AC#1, DoD#1
- Behaviour: Given `GameConfigScreen` rendered (`renderToString`) with `DEFAULT_SESSION_CONFIG`, When the
  markup is read, Then there is exactly one `<select>`, with `id="config-stake"` and a `<label for="config-stake">`
  whose text is `Stakes (small bet / big bet)`. Its option texts are exactly
  `['$2 / $4', '$3 / $6', '$4 / $8', '$6 / $12', '$10 / $20', '$20 / $40']`, and only `$4 / $8` carries
  `selected`. The Buy-in value is `$160 (20 big bets)`.
- Verification: acceptance `tests/ui/game-config-stake.acceptance.test.tsx::game config offers exactly six stakes with $4 / $8 selected`

### SPEC-05: The buy-in is read-only text of 20 big bets of the chosen stake
- Verifies: AC#4, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with `{ ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 3, bigBet: 6 } }`,
  When the Buy-in row is read, Then its `<dd>` is exactly `$120 (20 big bets)` and contains no `<input`,
  `<select`, `<textarea`, `<button` or `contenteditable`. The only `<select>` on the screen is `config-stake`
  with `$3 / $6` selected. The same holds for every stake in the §5 table (buy-in texts `$80`…`$800`).
- Verification: acceptance `tests/ui/game-config-stake.acceptance.test.tsx::buy-in reads 20 big bets of the chosen stake and offers no control`

### SPEC-06: No stake or buy-in text or control offers real money
- Verifies: AC#5, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with each of the six stakes, When the visible text (tags
  stripped) and every control's markup are inspected, Then nothing matches
  `/deposit|payment|\bpay\b|purchase|buy chips|cash[- ]?out|withdraw|real[- ]?money|convert|currency|credit card/i`.
  The controls are exactly the buttons `['← Home', 'Cancel', 'Start game']` plus the one stake select. No
  `<a`, `<input` or `<form` is present.
- Verification: acceptance `tests/ui/game-config-stake.acceptance.test.tsx::no stake or buy-in text or control offers deposit, payment or real money`

### SPEC-07: In the browser, the stake list and default are right and the buy-in follows the stake
- Verifies: AC#1, AC#4, DoD#1, DoD#7
- Behaviour: Given Home → New game in Chromium and WebKit, When the combobox labelled
  `Stakes (small bet / big bet)` is read, Then its option texts are exactly the six of SPEC-04 and its selected
  option text is `$4 / $8`. When `$3 / $6` is selected, Then the Buy-in value reads `$120 (20 big bets)`, the
  Buy-in row contains no interactive element (no element matching
  `input, select, textarea, button, a, [contenteditable], [tabindex]`), and the page has exactly one combobox.
  When Cancel and then New game are pressed, Then `$4 / $8` is selected again (A-1), and
  `localStorage.length` and `sessionStorage.length` are unchanged.
- Verification: acceptance `e2e/stake-choice.spec.ts::stake list is the six stakes with $4 / $8 selected and the buy-in follows the stake`

### SPEC-08: Starting at $10/$20 shows $10/$20, posts $5/$10 and seats $400 stacks
- Verifies: AC#3, DoD#1, DoD#7, DoD#8
- Behaviour: Given the clock installed at 0 and paused at 1000, `stubReplayWords` with
  `[0x9e3779b9, 1, 2, 3]`, Home → New game, and `$10 / $20` selected, When Start game is pressed, Then
  `.table-header-line` reads `Cash · 6 players · $10/$20 · Hand #1` and the six seat stacks all read `$400`.
  After advancing the clock in 50 ms slices to 1000 ms, seat 1's `[data-part="action"]` reads
  `Small blind $5` with stack `$395`, and seat 2's reads `Big blind $10` with stack `$390`. Every request the
  page made has origin `http://localhost:4173`.
- Verification: acceptance `e2e/stake-choice.spec.ts::starting at $10 / $20 shows $10/$20, posts $5 and $10 and seats $400`

### SPEC-09: Every stake keeps Game Config free of real-money controls and axe clean
- Verifies: AC#5, DoD#1, DoD#7
- Behaviour: Given Game Config in Chromium and WebKit, When each of the six stakes is selected in turn, Then
  the main region's text matches none of the SPEC-06 pattern, the buttons are exactly `← Home`, `Cancel`,
  `Start game`, there is one combobox, no link and no textbox, and
  `expectNoSeriousAxeViolations` passes. The select's bounding box is at least 44 px high, and the page has
  no horizontal overflow at 1280×720.
- Verification: acceptance `e2e/stake-choice.spec.ts::every stake keeps game config free of real-money controls and axe clean`

### SPEC-10: Earlier stories' tests still pass, with the default flow at $4/$8
- Verifies: DoD#1, DoD#7
- Behaviour: Given the change, When the full unit and browser suites run, Then all pass, including locked
  `e2e/home.spec.ts` (default $160 stacks, axe, same-origin), `tests/table/session-config.acceptance.test.ts`
  and the D-2-amended `tests/ui/home.acceptance.test.tsx` with its expected values unchanged.
- Verification: integration `npm test && npm run e2e`

### SPEC-11: Lint, typecheck, tests, coverage and headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint (incl. the headless-boundary rule and
  prettier), typecheck and the tests pass with zero errors, and coverage meets ≥90% for
  `src/{engine,bots,advice,stats,playtest,table}` and ≥70% overall.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-12: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given the engine, bots and advice are untouched (only `src/table/session.ts` gains a constant),
  When the 10,000-hand playtest runs, Then it reports zero invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-13: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch `doit/TASK-2.3` is pushed, When CI runs, Then every job is green. The story
  document for TASK-2.3 is published to Backlog.md.
- Verification: manual CI run on branch `doit/TASK-2.3` and `backlog doc list --plain`

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) are not yet Done,
  and this story adds no strategy content, When judged, Then these items are N/A.
- Verification: manual Judge confirms the diff adds no strategy text and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Boundaries: the smallest ($2/$4, SB $1, buy-in $80) and largest ($20/$40, SB $10, buy-in $800) stakes, and
  the odd small bet ($3/$6 → SB floor(1.5) = $1). Covered by SPEC-02 and SPEC-05.
- Reopening Game Config after Cancel / ← Home resets to $4/$8 (A-1). Covered by SPEC-07.
- Selecting the already-selected stake: no change. Native select, no test needed.
- TEMPORARY top-up at a non-default stake: already refills to `buyIn(table.config.stake)`
  (`src/table/session.ts:168-174`), i.e. 20 big bets of the chosen stake. Code unchanged and owned by
  TASK-3.21, so no new test.
- Invalid or unknown stake: cannot occur (A-6). Persistence, concurrency, network failure: N/A, since nothing is
  stored or fetched.

## 8. Security considerations
- Trust boundaries: the only new input is a native select limited to six hard-coded options. The handler
  maps its value back to a `CASH_STAKES` entry, so no free-form value reaches the session.
- No authn/authz, secrets, injection surface, logging, new dependencies, randomness or network requests
  (SPEC-08 asserts same-origin only).
- Play money only: SPEC-06 and SPEC-09 assert no deposit, payment, purchase, cash-out or conversion text or
  control (REQ-006.3).

## 9. Non-functional
- Accessibility: zero serious/critical axe violations on Game Config at every stake (SPEC-09). The select has a
  programmatic label and is at least 44 px tall. No horizontal overflow at 1280×720.
- Offline/network: no new requests (SPEC-08).
- No performance-sensitive code. No slow-group tests added.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173` (or `npm run dev`)
- New tests: `tests/table/stakes.acceptance.test.ts` → SPEC-01..03;
  `tests/ui/game-config-stake.acceptance.test.tsx` → SPEC-04..06; `e2e/stake-choice.spec.ts` → SPEC-07..09.
  Amended (locked, Q-2): `tests/ui/home.acceptance.test.tsx`. Browser e2e: `npm run e2e`.
- E2E notes for the builder: select by `page.getByLabel('Stakes (small bet / big bet)')` and
  `selectOption({ label: '$10 / $20' })`. Read the Buy-in value through the `<dd>` following the `<dt>` with
  text `Buy-in`. For the deal, copy the paused-clock pattern from `e2e/home.spec.ts:212-249` (install the clock
  and `stubReplayWords` before `page.goto`). Stack checks before advancing the clock show the seated $400.
- Judge scenario: `npm run build && npm run preview`, open `http://localhost:4173` at 1280×720 in Chrome and
  Safari. New game → the Stakes select lists `$2 / $4` … `$20 / $40` with `$4 / $8` selected and Buy-in
  `$160 (20 big bets)`. Pick `$3 / $6` → Buy-in `$120 (20 big bets)`, not editable. Cancel → New game →
  back to `$4 / $8`. Pick `$10 / $20` → Start game → header `Cash · 6 players · $10/$20 · Hand #1`, stacks
  $400, seat 1 `Small blind $5`, seat 2 `Big blind $10`. Play a hand. No deposit, payment or cash-out wording
  anywhere on Game Config.

## 11. Open questions
- None. Q-1 and Q-2 answered (auto-accepted, recommended options) in `doit/TASK-2.3/qa.md`.

## 12. Clarifications log
See `doit/TASK-2.3/qa.md`.
