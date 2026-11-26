# Spec: TASK-3.26 — Tidy the side-pot hand result layout and pin split-pot rendering

Status: READY (approved 2026-11-26)
Task: TASK-3.26 · Parent/epic: TASK-3 · Requirements: n/a (follow-ups TASK-3.8 judge J-1-01/J-1-02, doc-69; TASK-2.4 judge J-1-02) · Dream: limit-holdem-trainer

## 1. Summary
Three UI polish items. (1) With side pots, the "Hand over" block lays out four flex columns (title, Pot
winners, Winners, Shown hands), so "Hand over" wraps and the shown-hand line is squeezed; the block must stack
its lists under the title when side pots exist. (2) The Pot winners line is assembled in JSX
(`Table.tsx:175` joins winner texts itself), so a wording change in `PotResultView.text` can drift unnoticed;
the line must render from view-model strings and a split side pot must be pinned in a render test and in
Chromium and WebKit. (3) The Game Config game-type options change height by 2 px when selected (1 px vs 2 px
border on a content-box `min-height`); both must keep the same height.

## 2. Scope
- In scope:
  - `PotResultView` gains `potText` and `winnersText`; `text` is built from them; `Table.tsx` renders them.
  - CSS: "Hand over" title never wraps; the hand-result block stacks its lists when it has a Pot winners list.
  - CSS: `.config-choice label` uses `box-sizing: border-box` so checked and unchecked options are equal height.
  - A crafted split-side-pot scene (render + browser), and new tests for all three ACs.
- Not doing:
  - No change to the hand-result layout when there are no side pots (single-pot blocks look exactly as now).
  - No change to the felt "Pots" list, wording of any line, engine, bots, advice, or storage.
  - No new visual (screenshot-baseline) test; no change to `e2e/cards.visual.spec.ts` or its snapshots.
  - No edits to locked tests (listed in §3).
  - No change to the Line-up radios beyond what the shared `.config-choice label` rule gives them (they get the
    same equal-height fix; see A-3).
- Scope budget: files=10, lines=280

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | With side pots the result block stacks: "Hand over" on its own row, then the Pot winners row, Winners row and Shown hands row, each list full width (items in a list still sit side by side and wrap). Without side pots the block stays one row as today. | yes | The AC fixes the outcome (title on one line, lines not squeezed); stacking is the smallest change that gives every line the full width, and leaving single-pot blocks alone keeps every locked layout test and the TASK-3.4 look unchanged. | Always stack (changes the common case and taller block every hand); `flex-wrap` only (lines can still land in narrow leftover space). |
| A-2 | The split-pot scene is crafted: SIDE_POT_SHOWDOWN with awards replaced by main $60 → You, side $81 → Ben $41, Ava $40 (same shape as `withAwards` in `tests/table/side-pots.test.ts:18`). | yes | The AC's exact `$81` odd-chip split cannot come from the scripted $20/$60/$60 deal; the unit test already crafts this exact award (`tests/table/side-pots.test.ts:99-113`). Display only, so chip totals need not reconcile. | Script a real tie in the engine (different amounts than the AC text). |
| A-3 | The height fix is `box-sizing: border-box` on `.config-choice label`, so every option is exactly 44 px (min-height) checked or not; the Line-up radios share the rule and also stop jumping. | yes | Matches the storyboard 44 px target in the CSS comment (`src/ui/styles.css:351`); the locked game-type e2e only needs ≥ 44 px (`e2e/game-type-choice.spec.ts:43-47`). | Keep 46 px by giving the checked option `min-height: 42px`. |
| A-4 | `PotResultView` gets two new string fields `potText` ("Side pot $81") and `winnersText` ("Ben wins $41, Ava wins $40"), with `text === \`${potText} · ${winnersText}\``. Table renders `potText` in `data-part="pot"` and `winnersText` in `data-part="pot-winners"`. | yes | The locked acceptance test reads the two `data-part` spans separately (`tests/ui/side-pots.acceptance.test.tsx:115-118`), so the line cannot become one span of `text`; two VM strings remove all wording from JSX except the shared aria-hidden " · " used by every result list. | Render `text` split at " · " in JSX (string surgery); keep JSX join (judge finding stays). |

## 3. Current system
- React 19 + TypeScript strict, Vite; Vitest (`renderToString`) for render tests, Playwright (Chromium + WebKit,
  viewport from `playwright.config.ts:13-16`) for browser tests; scripted table scenes via
  `e2e/support/table-harness-bundle.ts` + `e2e/support/table-scenes.tsx`.
- `src/ui/table/Table.tsx:165-224` — `HandResult`: `<div role="status" className="hand-result">`, title
  `<p className="hand-result-title">`, then optional Pot winners `<ul>` (line 169-179; line 173 builds
  `${p.label} $${p.amount}`, line 175 joins `p.winners.map(w => w.text).join(', ')`), Winners, Shown hands.
- `src/table/hand-result.ts:29-42` — `PotResultView { pot, label, amount, winners, text }`;
  `src/table/hand-result.ts:151-166` builds `pots` only when `awards.length >= 2`.
- `src/ui/styles.css:797-850` — `.hand-result { display:flex; align-items:center; gap:16px }`, lists are
  wrapping flex rows, `li { min-height: 42px }`. No `white-space`/`flex-shrink` on the title, hence the wrap.
- `src/ui/styles.css:351-367` — `.config-choice label { min-height:44px; border:1px }` and checked
  `{ padding:0 15px; border:2px }`; box-sizing is content-box (no global reset; `src/ui/styles.css:23` is
  `.screen` only), so heights are 46 px vs 48 px (TASK-2.4 judge J-1-02, `doit/TASK-2.4/judge/round-1.json:39`).
- `src/ui/config/GameConfigScreen.tsx:118-133` (game type) and `:222-241` (line-up) both use `.config-choice`.
- `:has()` is already used in the stylesheet (`src/ui/styles.css:853`, `:364`).
- Locked tests that touch these areas (must stay unchanged and green; none of their values change):
  - TASK-3.8: `tests/ui/side-pots.acceptance.test.tsx` (spans `data-part="pot"`/`"pot-winners"` and line text),
    `e2e/side-pots.spec.ts` (line text, block within 1280 px).
  - TASK-3.21: `e2e/short-stack.spec.ts:126-130`, `tests/table/short-stack.acceptance.test.ts:160` (line text).
  - TASK-3.4: `tests/ui/hand-result.acceptance.test.tsx:69` (exact `<p class="hand-result-title">Hand over</p>`).
  - TASK-3.11/9.2: `tests/ui/bust-dialog.acceptance.test.tsx:60` (exact `class="hand-result"` — so no markup
    class is added; the layout switch is CSS `:has()`).
  - TASK-1.15: `e2e/showdown-shown.spec.ts` (block within 1280 px); TASK-3.1/3.3/3.4/3.6/10.2 e2e Hand over checks.
  - TASK-2.4: `e2e/game-type-choice.spec.ts:43-47` (each `.config-choice label` ≥ 44 px — still true at 44),
    `tests/ui/game-config-game-type.acceptance.test.tsx`; TASK-2.5/2.19 line-up and phone-width tests.
- Visual snapshots: the only `toHaveScreenshot` test is `e2e/cards.visual.spec.ts` (card gallery sections
  `faces-two-colour`, `faces-four-colour`, `card-back`); neither change touches the card gallery, so no
  baseline (darwin or Linux) changes.
- Existing code to reuse:
  - `tests/support/table-scenarios.ts:464` `SIDE_POT_SHOWDOWN` → base for the crafted split scene.
  - `tests/table/side-pots.test.ts:18` `withAwards` pattern → same spread for the new scene.
  - `e2e/support/table-harness-bundle.ts` `buildTableScenes`/`openTableScene`, `e2e/support/axe.ts`
    `expectNoSeriousAxeViolations`.
  - `e2e/game-type-choice.spec.ts:19-24` `openGameConfig` steps (copy; the file is locked).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Side-pot layout switch via `.hand-result:has(> ul[aria-label='Pot winners'])`, not a new class | Modifier class on the div | Locked bust-dialog test matches the exact class attribute | no | n/a |
| D-2 | AC#1 "screenshot-checked" = geometric e2e assertions plus a full-block screenshot attached to the test report for the Judge (no baseline image) | Add a `toHaveScreenshot` baseline | Baselines need darwin + Linux images and the Visual workflow; geometry is objective and font-independent | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/hand-result.ts` — `PotResultView.potText`, `.winnersText`; `text` built from them.
- `src/ui/table/Table.tsx` — Pot winners `<li>` renders `p.potText` and `p.winnersText`.
- `src/ui/styles.css` — title no-wrap; stacked side-pot block; `.config-choice label` border-box.
- `tests/support/table-scenarios.ts` — export `SPLIT_SIDE_POT_SHOWDOWN`.
- `e2e/support/table-scenes.tsx` — register scene `'split-side-pot'`.
- `e2e/support/table-harness-bundle.ts` — add `'split-side-pot'` to the `TableScene` union.
- `tests/table/side-pots.test.ts` — add the two fields to the existing `toEqual` objects; new unit case.
- `tests/ui/split-side-pot.acceptance.test.tsx` — new render test (AC#2).
- `e2e/side-pot-result.spec.ts` — new browser test (AC#1, AC#2).
- `e2e/game-type-height.spec.ts` — new browser test (AC#3).

### Components, interfaces and data
```ts
export interface PotResultView {
  readonly pot: number;
  readonly label: string;
  readonly amount: number;
  readonly winners: readonly { seat; isUser; text }[];   // unchanged
  /** "Side pot $81" = `${label} $${amount}` */
  readonly potText: string;
  /** "Ben wins $41, Ava wins $40" = winners' text joined with ", " */
  readonly winnersText: string;
  /** `${potText} · ${winnersText}` */
  readonly text: string;
}
```
- Table Pot winners item (structure otherwise unchanged, keeps `key`/`data-pot`):
  `<span data-part="pot">{p.potText}</span><span aria-hidden="true"> · </span><span data-part="pot-winners">{p.winnersText}</span>`.
  No string building of pot/winner wording remains in `Table.tsx`.
- `SPLIT_SIDE_POT_SHOWDOWN: TableState` = `SIDE_POT_SHOWDOWN` with `hand.result.awards` =
  `[{ pot: 0, amount: 60, winners: [{ seat: 5, amount: 60 }] }, { pot: 1, amount: 81, winners: [{ seat: 2, amount: 41 }, { seat: 1, amount: 40 }] }]`
  (seat 5 = You, seat 2 = Ben, seat 1 = Ava). Doc comment states it is crafted (A-2).

### Rules and algorithms
- CSS (exact intent; builder may format):
  - `.hand-result-title { white-space: nowrap; flex-shrink: 0; }` (added to the existing rule).
  - `.hand-result:has(> ul[aria-label='Pot winners']) { flex-direction: column; align-items: stretch; gap: 4px; }`
    — the lists keep their own wrapping-row rules; each becomes a full-width row.
  - `.config-choice label { box-sizing: border-box; }` (added to the existing rule; checked/unchecked both 44 px).
- Worked example (split scene): Pot winners items read `Main pot $60 · You win $60`,
  `Side pot $81 · Ben wins $41, Ava wins $40`; Winners `You win $60 · Pair of aces`,
  `Ben wins $41 · Pair of kings`, `Ava wins $40 · Pair of queens`; no Shown hands list (Ava won a share).

### Error handling and configuration
- No new errors. `handResultView` keeps its `RangeError` for an unseated award seat.

## 6. Behaviour specification

### SPEC-01: Side-pot result keeps "Hand over" on one line and every line unsqueezed
- Verifies: AC#1
- Behaviour: Given the `side-pot-showdown` and `split-side-pot` scenes at 1280x720 in Chromium and WebKit,
  When the result block is shown, Then (a) the "Hand over" title text occupies exactly one line box (all
  client rects of a Range over its text share one top); (b) every `[data-part]` span inside the Pot winners,
  Winners and Shown hands items occupies one line box; (c) for every item in those lists
  `scrollWidth <= clientWidth`; (d) each of those lists is at least 50% of the block's content width wide;
  (e) the block's right edge is ≤ 1280 and `document.documentElement.scrollWidth <= 1280`; (f) axe has no
  serious violations; and a screenshot of the block is attached to the test result as `side-pot-result.png` /
  `split-side-pot-result.png`.
- Verification: acceptance `e2e/side-pot-result.spec.ts::the side-pot result keeps Hand over on one line and gives every line full width`

### SPEC-02: Single-pot result layout unchanged
- Verifies: AC#1
- Behaviour: Given the `shown-hands` scene (one pot) at 1280x720, When the result is shown, Then the "Hand
  over" title and the Winners list share one row (their bounding boxes' vertical ranges overlap) — the
  side-pot stacking does not apply without a Pot winners list.
- Verification: acceptance `e2e/side-pot-result.spec.ts::a single-pot result stays on one row`

### SPEC-03: Split side pot line in a render test, from the view model's text
- Verifies: AC#2
- Behaviour: Given `SPLIT_SIDE_POT_SHOWDOWN`, When `TableView` is rendered with `renderToString`, Then the
  Pot winners items' text (tags stripped) is exactly `['Main pot $60 · You win $60',
  'Side pot $81 · Ben wins $41, Ava wins $40']`; each item's text equals `handResultView(table).pots[k].text`;
  the `data-part="pot"` span equals `pots[k].potText` and the `data-part="pot-winners"` span equals
  `pots[k].winnersText`. The same equality to `pots[k].text` holds for `SIDE_POT_SHOWDOWN`.
- Verification: acceptance `tests/ui/split-side-pot.acceptance.test.tsx::a split side pot renders the view model's line text exactly`

### SPEC-04: Split side pot line in Chromium and WebKit
- Verifies: AC#2
- Behaviour: Given the `split-side-pot` scene at 1280x720, When it loads, Then the Pot winners list items
  have text exactly `['Main pot $60 · You win $60', 'Side pot $81 · Ben wins $41, Ava wins $40']`, and the
  page makes no http(s) requests.
- Verification: acceptance `e2e/side-pot-result.spec.ts::a split side pot reads Side pot $81 · Ben wins $41, Ava wins $40`

### SPEC-05: View model fields compose the line text
- Verifies: AC#2
- Behaviour: Given any `handResultView` with pots (SIDE_POT_SHOWDOWN, the three-pot and split `withAwards`
  cases), When it is built, Then each pot has `potText === \`${label} $${amount}\``,
  `winnersText === winners.map(w => w.text).join(', ')` and `text === \`${potText} · ${winnersText}\``; the
  existing `toEqual` for SIDE_POT_SHOWDOWN includes `potText: 'Main pot $60'`,
  `winnersText: 'You win $60'` and `potText: 'Side pot $80'`, `winnersText: 'Ben wins $80'`; and
  `Table.tsx` contains no `.join(` in the HandResult component.
- Verification: unit `tests/table/side-pots.test.ts::pot result text is built from potText and winnersText` plus command `awk '/^function HandResult/,/^}/' src/ui/table/Table.tsx | grep -c "join("` → 0

### SPEC-06: Game-type options keep the same height when the selection changes
- Verifies: AC#3
- Behaviour: Given the Game Config screen (Home → New game) in Chromium and WebKit, When the heights of the
  two game-type option labels are read, then Sit-and-go is checked and they are read again, then Cash game is
  checked and they are read again, Then in all three readings both labels have the same height, that height
  is identical across readings, and it is ≥ 44 px. The same holds for the Line-up option labels when a
  different preset is checked.
- Verification: acceptance `e2e/game-type-height.spec.ts::game-type options keep the same height when the selection changes`

### SPEC-07: Locked tests and full suite stay green
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the change, When the full checks run, Then lint, typecheck, unit/acceptance tests and the
  e2e suite pass with every locked test file listed in §3 byte-identical to `main`, and no visual snapshot
  file under `e2e/cards.visual.spec.ts-snapshots/` changes.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e && git diff --quiet main -- tests/ui/side-pots.acceptance.test.tsx e2e/side-pots.spec.ts e2e/short-stack.spec.ts tests/table/short-stack.acceptance.test.ts tests/ui/hand-result.acceptance.test.tsx tests/ui/bust-dialog.acceptance.test.tsx e2e/showdown-shown.spec.ts e2e/game-type-choice.spec.ts e2e/cards.visual.spec.ts-snapshots`

## 7. Edge cases
- Three or more pots ("Side pot 1/2"): covered by the same CSS rule and SPEC-05 (three-pot case).
- Side-pot result with Shown hands (SIDE_POT_SHOWDOWN) and without (split scene): SPEC-01 runs both.
- No side pots: SPEC-02 (unchanged single row); locked TASK-3.4/1.15 tests.
- Review panel open beside the table (narrower column): the stacked layout only gives more width; covered by
  existing `e2e/review*.spec.ts` staying green (SPEC-07).
- Phone widths for Game Config: locked `e2e/config-phone-width.spec.ts` stays green (SPEC-07).
- Invalid input, concurrency, persistence, permissions: N/A — display-only change with no input or storage.

## 8. Security considerations
- No new input, network, storage or dependency. Text is rendered by React (escaped). Scene is test-only and
  never imported by the app. Randomness: N/A.

## 9. Non-functional
- No layout overflow at 1280x720 (SPEC-01 e). No new runtime work; two extra strings per pot only when side pots exist.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, open `http://localhost:4173`, New game: switch Cash game ↔ Sit-and-go and watch the options keep their height. Side-pot results: `npx playwright test e2e/side-pot-result.spec.ts` and open the attached screenshots in `npx playwright show-report`.
- New tests: `tests/ui/split-side-pot.acceptance.test.tsx` → SPEC-03; `e2e/side-pot-result.spec.ts` → SPEC-01, 02, 04; `e2e/game-type-height.spec.ts` → SPEC-06; `tests/table/side-pots.test.ts` (new case) → SPEC-05.
- Judge scenario: run `npx playwright test e2e/side-pot-result.spec.ts e2e/game-type-height.spec.ts e2e/side-pots.spec.ts`, view the attached screenshots (title on one line, three full-width rows, readable lines), then in the built app open New game and toggle the game type to confirm no height jump.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-3.26/qa.md` (no questions asked).
