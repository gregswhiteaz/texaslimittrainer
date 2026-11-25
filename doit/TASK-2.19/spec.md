# Spec: TASK-2.19 — Fit Game Config's opponent rows on a phone screen

Status: READY (approved 2026-11-25)
Task: TASK-2.19 · Parent/epic: TASK-2 · Requirements: n/a (follow-up from TASK-2.9 judge J-1-02, doc-91) · Dream: limit-holdem-trainer

## 1. Summary
TASK-2.8 put a "Style" select in every bot row of Game Config's Opponents panel. A row can't shrink below
322 px of content, so at 320 px and 375 px the Opponents panel grows to 372 px and the page scrolls sideways
(scrollWidth 388). This task fixes it with CSS only: on narrow screens each bot row lets its Style control
wrap onto a second line. The desktop layout doesn't change, and a new Playwright acceptance test checks phone
widths.

## 2. Scope
- In scope:
  - A CSS change to the `.config-seats li` / `.config-style` rules in `src/ui/styles.css`. On narrow screens
    the Style control wraps below the seat and name. Rows that already fit stay on one line.
  - A new e2e acceptance spec that checks 320 px and 375 px wide screens with 10 players.
- Not doing:
  - Any change to `src/ui/config/GameConfigScreen.tsx` markup (the locked TASK-2.8 test
    `tests/ui/game-config-seat-style.acceptance.test.tsx` pins `<li>`, `seat-name` and `config-style` markup).
  - Changing option labels (for example shortening "Tight-aggressive"), select padding or the chevron, panel
    padding, `.screen` padding or the page gutter.
  - Layout changes to other screens or to the Session panel. It already fits once the Opponents panel can
    shrink (measured: both panels span 16–304 px at 320 px).
  - A visual snapshot test. Adding the spec to `test:slow`/`e2e:slow`, which isn't needed because it's a
    single fast page load per width.
- Scope budget: files=2, lines=70

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "16px gutter" means the current 16 px between the viewport edge and the panels' outer edge (body 8 px default margin + `.screen` 8 px side padding, `src/ui/styles.css:22-30`; measured panel left = 16 px). The fix keeps it unchanged | yes | Measured and unchanged by the fix | Reduce gutter to win width (rejected: user asked to keep it) |
| A-2 | "Fully visible" means each bot row's seat label, name and Style select boxes lie within `[0, clientWidth]` horizontally and the select is at least 44 px tall. "Usable" means choosing an option in the select updates it | yes | Objective, cheap to check in Playwright | Pixel snapshot comparison (rejected: brittle, slower) |
| A-3 | The new spec runs on both configured Playwright projects (chromium, webkit), like every other e2e spec, using `page.setViewportSize` | yes | Matches `playwright.config.ts` and existing narrow-width checks | Chromium only |

## 3. Current system
- Game Config row markup: `src/ui/config/GameConfigScreen.tsx:234-262`. Each bot `<li>` holds
  `span.seat-label` ("Seat n"), `span.seat-name` and `label.config-style` ("Style" + `<select aria-label="Style for <name>">`).
  The user row is the last `<li>` ("You", "Seat n").
- Row CSS: `src/ui/styles.css:405-441`. `.config-seats li` is `display:flex; gap:12px` with no wrap (`:412-418`).
  `.seat-label` is `width:64px` (`:424-428`), `.seat-name` is `flex:1 1 120px` (`:430-433`) and `.config-style` is
  inline flex with gap 8 (`:435-441`). The select gets `appearance:none; min-height:44px; padding:0 36px 0 12px`
  (`:329-343`). `.panel` is `flex:1 1 420px; padding:24px; border:1px` (`:287-293`) inside the wrapping
  `.config-panels` (`:281-285`). There are no `@media` rules in `styles.css`.
- **Measurement (Playwright, chromium, 10 players, built app via `vite preview`):**
  - 320 px: `documentElement.scrollWidth = 388`. The Opponents `section.panel` runs from 16 to 388 px (372 wide).
    The panel's min-content width is set by the bot `<li>` at 322 px = seat-label 32 + 12 + seat-name 60 + 12 +
    `label.config-style` 206 (the "Style" text plus a 166 px select, whose width comes from "Tight-aggressive" + 48 px padding).
    Every other element that overflows (opponents header, Randomise button, line-up group) only does so because
    it sits inside that too-wide panel.
  - 375 px: same scrollWidth 388, with the same panel as the only overflowing element.
  - Available row width is 320 − 2×16 gutter − 2×1 border − 2×24 padding = **238 px** (293 px at 375). One line
    needs at least 322 px, so no single-line layout fits without clipping the select text.
  - Trial with `.config-seats li { flex-wrap: wrap }` and `.config-style { margin-left: auto }`: scrollWidth =
    clientWidth at 320 and 375. Both panels span 16 → cw−16. Every bot row has 2 lines (name line, then Style
    select right-aligned, select 166×44, row 91 px tall versus 61 px before). At 1280 px every row stays on one
    line with identical select position (961–1127).
- Tests that pin Game Config markup or row layout (checked against `locked_tests` in `doit/TASK-2.*/state.json`):
  - `tests/ui/game-config-seat-style.acceptance.test.tsx`: locked by TASK-2.8. It regex-pins `<li>` (no
    attributes), `<span class="seat-name">`, `<label class="config-style">Style<select aria-label=…>`. This
    task makes no markup change, so it doesn't need to change.
  - `e2e/seat-style.spec.ts` (TASK-2.8), `e2e/randomise-lineup.spec.ts` (TASK-2.9),
    `e2e/game-type-choice.spec.ts` (TASK-2.4), `e2e/lineup-choice.spec.ts` (TASK-2.5) and
    `e2e/players-choice.spec.ts` (TASK-2.2) are all locked. They select by role/label and `li` text. They run at
    the 1280×720 default, where the layout doesn't change. `e2e/game-type-choice.spec.ts:48-51` asserts no
    sideways overflow at 1280, which still holds. `e2e/randomise-lineup.spec.ts:151` asserts width ≥ 44, which still holds.
  - **No locked test needs to change.**
- Tests: unit/acceptance via Vitest (`npm test`). Browser via Playwright (`npm run e2e`, `playwright.config.ts`
  builds and serves on :4173, chromium and webkit at 1280×720). Existing narrow-width overflow pattern:
  `e2e/game-type-choice.spec.ts:48-51` (`scrollWidth - clientWidth <= 0`).
- Existing code to reuse:
  - `e2e/game-type-choice.spec.ts:48-51` → overflow check pattern.
  - `e2e/seat-style.spec.ts:12-14` → `styleSelect` / `opponents` locators (copy the pattern, since locked files can't be imported from).
  - `src/bots/lineup.ts:7` `BOT_NAMES` → the 9 expected bot names at 10 players.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | CSS-only fix: `.config-seats li { flex-wrap: wrap; }` and `.config-style { margin-left: auto; }`. On narrow screens the Style control wraps to its own line, right-aligned | (b) wrap without `margin-left:auto` (Style left-aligned under "Seat n"); (c) shrink the select so text clips; (d) media query cutting panel padding/gaps (still 309 px > 293 at 375, never fits at 320); (e) shorten option labels (changes locked text) | Measured: smallest change that removes scroll at both widths, keeps 44 px select, 16 px gutter and desktop layout; no markup change | yes | user (Q-1, autopilot accepted recommended) |
| D-2 | One new acceptance spec `e2e/config-phone-width.spec.ts`. It isn't added to the slow list | Extend a locked spec (not allowed); Vitest/jsdom (no layout engine) | Layout needs a real browser. One page load per width keeps it fast | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/styles.css` — add `flex-wrap: wrap` to `.config-seats li` and `margin-left: auto` to `.config-style`, with a short comment referencing TASK-2.19 (about 3 lines). Exact values per D-1 (approved by Q-1).
- `e2e/config-phone-width.spec.ts` — new acceptance spec (SPEC-01, SPEC-02).

### Components, interfaces and data
- No TS/TSX changes, no new interfaces or data.

### Rules and algorithms
- A bot row stays on one line when seat label, name and Style control fit in the panel's content width.
  Otherwise the Style control (the "Style" text plus the select, kept together) moves to the next line.
  It is right-aligned (D-1, approved by Q-1). Rows never overflow the panel.
- Worked example (measured): at 320 px the content width is 238 px and a single line needs 322 px, so it wraps.
  At 1280 px the content width is about 450 px, so it stays on one line.

### Error handling and configuration
- N/A — static styling.

## 6. Behaviour specification

### SPEC-01: No sideways scroll at phone widths with 10 players
- Verifies: AC#1
- Behaviour: Given the viewport is 320×800 (then 375×800) and Game Config is open with "Players at the table" set
  to 10 (9 bot rows), When the screen renders, Then
  `document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0`, and both `section.panel`
  elements have `left >= 16` and `right <= clientWidth - 16`.
- Verification: acceptance `e2e/config-phone-width.spec.ts::game config with 10 players does not scroll sideways at 320 and 375 px`

### SPEC-02: Every bot row's seat, name and Style select are visible and usable
- Verifies: AC#1
- Behaviour: Given the same two widths and 10 players, When the screen renders, Then there are exactly 9 bot rows
  (the Opponents `li`s other than the "You" row), with names `Ava, Ben, Cal, Dee, Eli, Fay, Gus, Hal, Ivy` in order. In
  each row the `.seat-label` ("Seat n"), `.seat-name` and the `Style for <name>` combobox are visible, with
  bounding boxes inside `[0, clientWidth]` horizontally, and the combobox is ≥ 44 px tall and ≥ 44 px wide. When the user
  chooses "Maniac" in the last row's select (`Style for Ivy`), Then that select shows "Maniac".
- Verification: acceptance `e2e/config-phone-width.spec.ts::every bot row's seat, name and style select are visible and usable at 320 and 375 px`

### SPEC-03: Desktop row layout unchanged and checks green
- Verifies: AC#1
- Behaviour: Given the default 1280×720 viewport, When the existing locked Game Config e2e and acceptance tests run,
  Then they pass unchanged. Lint, typecheck and unit suites stay green.
- Verification: command `npm run lint && npm run typecheck && npm test && npx playwright test e2e/config-phone-width.spec.ts e2e/seat-style.spec.ts e2e/randomise-lineup.spec.ts e2e/game-type-choice.spec.ts e2e/lineup-choice.spec.ts e2e/players-choice.spec.ts`

## 7. Edge cases
- Longest option "Tight-aggressive" sets the select width (166 px). It fits on the wrapped line (238 px available). Covered by SPEC-02.
- Fewer players (2–9): fewer rows, and each row behaves the same. 10 is the worst case for height only, not width, so it isn't a separate item.
- Replacement-bot names (e.g. "Quinn 2", `src/bots/lineup.ts:131-138`) only appear after busts at the table, not on Game Config. N/A.
- User row ("You · Seat n") is short and always fits. N/A.
- Widths between 375 and the one-line threshold (about 420 px): rows wrap the same way, and no overflow can occur because wrapping removes the 322 px min-content. N/A as a separate test.

## 8. Security considerations
N/A — CSS-only change. No input, storage, dependencies or randomness touched.

## 9. Non-functional
- Touch targets: Style select ≥ 44×44 px at 320/375 (SPEC-02).
- Gutter: 16 px each side at 320/375 (SPEC-01).
- Suite speed: the new spec is 2 page loads per browser project. It adds no Vitest tests and is not slow-gated.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173` → New game → Players 10, with the browser window or devtools device width at 320 and 375
- New tests: `e2e/config-phone-width.spec.ts` → SPEC-01, SPEC-02. Use `page.setViewportSize({ width, height: 800 })` for each of [320, 375]. Open Home → "New game" → select 10 in "Players at the table".
- Judge scenario: at 320 px and 375 px, open New game, choose 10 players, confirm there is no horizontal scrollbar, every opponent row shows Seat, name and a full Style select, and changing a style works. Then confirm at 1280 px that the rows look as before (one line each).

## 11. Open questions
- None. Q-1 was answered in `doit/TASK-2.19/qa.md`: the Style control wraps to a second line, right-aligned (D-1).

## 12. Clarifications log
See `doit/TASK-2.19/qa.md`.
