# Spec: TASK-11.15 — Make the report navigation tests robust on macOS keyboard settings and trim duplication

Status: READY (approved 2026-11-28)
Task: TASK-11.15 · Parent/epic: TASK-11 · Requirements: n/a (test robustness follow-up from doc-139) · Dream: limit-holdem-trainer

## 1. Summary
`e2e/report-navigation.spec.ts` walks the Session Report Tab order with `Alt+Tab` whenever the browser is
WebKit, and its comment blames WebKit in general. WebKit only skips buttons on plain Tab on macOS when Full
Keyboard Access (System Settings › Keyboard › Keyboard navigation) is off. This task adds a small e2e support
helper that works out which key reaches a button in the running browser: plain `Tab` when that works,
otherwise `Alt+Tab`. The Tab-order step uses the helper, and the comment names the macOS cause (AC#1). The same change applies
to the three other e2e files that hard-code WebKit `Alt+Tab` (AC#2, added after Q-2). The original AC#2 (the
duplicate unit check) was dropped by the user on 2026-11-28 and is not in this spec.

## 2. Scope
- In scope:
  - New helper `e2e/support/keyboard.ts` exporting `buttonTabKey(page)` and the pure `chooseButtonTabKey(reaches)`,
  so the fallback can be tested without changing a real Mac setting (Q-1).
  - `e2e/report-navigation.spec.ts`: the Tab-order step at lines 112-113 uses `await buttonTabKey(page)` in
    place of the `browserName === 'webkit'` ternary. The comment there names the macOS cause. The now-unused
    `browserName` fixture at line 84 is dropped.
  - New helper test `e2e/keyboard-helper.spec.ts` (same pattern as `e2e/axe-helper.spec.ts`).
  - AC#2 (Approved by Q-2): `e2e/back-focus.spec.ts:25-26`, `e2e/settings.spec.ts:78-79` and
    `e2e/error-recovery.spec.ts:136-137` use `buttonTabKey` the same way, and their comments name the macOS
    cause. `browserName` is dropped where it becomes unused: `back-focus.spec.ts:23`, `settings.spec.ts:63`,
    and in `error-recovery.spec.ts` the `browserName` parameter of `expectErrorScreen` (`:122`), its six
    callers (`:167, :207, :229, :261, :284, :291`) and their fixtures (`:153, :196, :217, :254, :274`).
- Not doing:
  - The original AC#2 / `tests/ui/report-navigation.acceptance.test.tsx`: dropped by the user and left unchanged.
  - Any change to an `expect` in the four e2e files. Assertion counts stay 30 / 8 / 22 / 41.
  - Merging the duplicate `tabOrder` helpers in report-navigation and settings.
  - Any change to app code, `playwright.config.ts`, CI workflows, or the order/assertions in the test.
  - Changing the macOS keyboard setting, in a test or by hand (Q-1), or adding a CI job for macOS.
- Scope budget: files=6, lines=130

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The key is detected with a probe on a separate page in the same browser context, not by inspecting macOS settings or the user agent. | yes | Measures what actually matters: whether this browser instance tabs to a button. It does not disturb focus on the page under test, and needs no shell access to `defaults`. | Read `AppleKeyboardUIMode` from Node (macOS-only, and Playwright WebKit might not follow it); probe in-page and re-focus the heading (changes the state being tested). |
| A-2 | The helper prefers plain `Tab` and only falls back to `Alt+Tab`. If neither reaches the button it throws. | yes | "Alt+Tab only where needed" (AC#1). Throwing makes an unsupported setup fail loudly instead of hiding behind a later order mismatch. | Always return `Alt+Tab` for WebKit as a fallback (hides the cause). |
| A-3 | The helper lives in `e2e/support/keyboard.ts`, shared by all four files. | yes | One place for the macOS explanation (AC#1, AC#2). | Inline the probe in each file. |
| A-4 | The helper is browser-agnostic: it runs in Chromium too, where it returns `Tab`. | yes | Removes the `browserName` branch altogether. Chromium tabs to buttons with plain Tab (probe below). | Keep `browserName === 'webkit' ? await buttonTabKey(page) : 'Tab'`. |

## 3. Current system
- `e2e/report-navigation.spec.ts:66-79` defines `tabOrder(page, key)`, which presses `key` up to 20 times and
  collects the focused element's text. `:112-114`:
  `// WebKit only tabs to buttons with Alt held (no full keyboard access).` then
  `const order = await tabOrder(page, browserName === 'webkit' ? 'Alt+Tab' : 'Tab');` and
  `expect(order.slice(-2)).toEqual(['View statistics', 'Back to Home']);`. `browserName` is destructured at `:84`
  and used only at `:113`.
- The same pattern appears in `e2e/back-focus.spec.ts:25-26`, `e2e/settings.spec.ts:78-79` and
  `e2e/error-recovery.spec.ts:136-137`. It came from TASK-12.1 A-8 (`doit/TASK-12.1/spec.md:49`).
- Projects: `playwright.config.ts` runs `chromium` (Desktop Chrome) and `webkit` (Desktop Safari) at 1280x720.
  CI runs e2e on `ubuntu-24.04` (`.github/workflows/ci.yml:20`).
- Lock status (codebase): `e2e/report-navigation.spec.ts` is in `locked_tests` of TASK-11.6 only
  (`doit/TASK-11.6/state.json`, sha `9cd39944…`, matching the file now; 30 asserts). No other
  `doit/*/state.json` lists it in `locked_tests`. The other three are owned by back-focus TASK-12.10, settings
  TASK-12.1/12.10/12.2 and error-recovery TASK-13.1, and all four were unlocked under those owners (Q-2).
  TASK-11.15's own `locked_tests` is empty. The builder hook
  enforces only the active task's locks (`~/.claude/skills/doit/scripts/doit.py:701`). Editing this file is
  required by AC#1 and AC#2. The integrity check fails if the assertion count drops (`doit.py:359-361`), and
  this change removes no `expect`. Current counts are report-navigation 30, back-focus 8, settings 22 and
  error-recovery 41, using `ASSERT_RE` at `doit.py:46`.
- Probe on this Mac (2026-11-27, `AppleKeyboardUIMode = 2`, i.e. Keyboard navigation on): WebKit and Chromium
  both move focus from a `tabindex="-1"` h1 to a following `<button>` with both `Tab` and `Alt+Tab`. So with Full
  Keyboard Access on, plain Tab works. The original A-8 observation (plain Tab skipped buttons) matches it being
  off.
- Conventions: e2e support modules in `e2e/support/*.ts` export typed functions taking `Page`
  (e.g. `e2e/support/paused-clock.ts:10`). Helper self-tests use `page.setContent` probes (`e2e/axe-helper.spec.ts:6-21`).
  TypeScript strict, `tsconfig.json:23` includes `e2e`. Lint is eslint `--max-warnings 0` plus prettier.
- Existing code to reuse:
  - `e2e/report-navigation.spec.ts:66` `tabOrder` → unchanged. It receives the detected key.
  - `e2e/axe-helper.spec.ts` → probe-document pattern for the helper's own test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Detect the button Tab key at run time with a probe page (A-1, A-2) | Hard-code per OS (`process.platform === 'darwin'`): still wrong with FKA on/off | Works on Linux CI and on macOS whatever the setting | no | n/a |
| D-2 | Convert all four Alt+Tab users to the helper | Report-navigation only | AC#2 added by the user | yes | user (Q-2) |
| D-3 | Prove "without FKA" by the helper's injected-probe test, not by toggling macOS settings; real runs are macOS with Keyboard navigation ON plus Linux CI (orchestrator pushes the branch) | Toggle `AppleKeyboardUIMode` for a run | User declined touching system settings | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `e2e/support/keyboard.ts` — new: `buttonTabKey(page)` plus a doc comment stating the macOS cause.
- `e2e/report-navigation.spec.ts` — Tab-order step uses `buttonTabKey`, comment names the macOS cause, unused `browserName` dropped.
- `e2e/keyboard-helper.spec.ts` — new: the helper's own tests (pure fallback plus real-browser probe).
- `e2e/back-focus.spec.ts` — `buttonTabKey` at the Tab press, comment, drop the unused `browserName`.
- `e2e/settings.spec.ts` — `buttonTabKey` in the `tabOrder` call, comment, drop the unused `browserName`.
- `e2e/error-recovery.spec.ts` — `buttonTabKey` in `expectErrorScreen`, comment, drop the `browserName` param, callers and fixtures.

### Components, interfaces and data
- `export type TabKey = 'Tab' | 'Alt+Tab'`
- `export async function chooseButtonTabKey(reaches: (key: TabKey) => Promise<boolean>): Promise<TabKey>`
  tries `'Tab'` and then `'Alt+Tab'`, and returns the first key for which `reaches` resolves `true`. It does not
  call `reaches('Alt+Tab')` when `'Tab'` succeeds. If neither succeeds it throws
  `Error('buttonTabKey: neither Tab nor Alt+Tab moves focus to a button')`.
- `export async function buttonTabKey(page: Page): Promise<TabKey>`, which is `chooseButtonTabKey` with the
  probe-page `reaches` below:
  - Opens `probe = await page.context().newPage()` and, in `try/finally`, always closes it.
  - For each candidate in order `['Tab', 'Alt+Tab']`: `probe.setContent('<h1 tabindex="-1">Probe</h1><button>Probe</button>')`,
    focus the h1 (`probe.locator('h1').focus()`), press the candidate, and read `document.activeElement?.tagName`.
    `reaches` is true when focus ends on `BUTTON`.
  - Does not touch `page`'s focus, storage, clock or request listeners. The probe page makes no network requests.
- Doc comment (wording may vary, content fixed): WebKit on macOS skips buttons on plain Tab unless Full Keyboard
  Access (System Settings › Keyboard › Keyboard navigation) is on, and `Alt+Tab` reaches them. WebKit on Linux and
  Chromium tab to buttons with plain Tab.
- report-navigation step becomes:
  `// WebKit on macOS skips buttons on plain Tab when Full Keyboard Access is off; buttonTabKey picks Alt+Tab only then.`
  `const order = await tabOrder(page, await buttonTabKey(page));`. The `expect(order.slice(-2))…` line stays
  exactly as it is.
- AC#2 call sites:
  - back-focus: `await page.keyboard.press(await buttonTabKey(page));`
  - settings: `const order = await tabOrder(page, await buttonTabKey(page));`
  - error-recovery: `await page.keyboard.press(await buttonTabKey(page));` inside `expectErrorScreen(page)`.
  Each gets a one-line comment naming macOS Full Keyboard Access. The `expect` lines around them are unchanged.

### Rules and algorithms
- Linux CI (WebKit/Chromium): Tab reaches the button, so the helper returns `Tab`.
- macOS, FKA on: `Tab` (observed above). macOS, FKA off: `Tab` skips the button, so `Alt+Tab` is returned.

### Error handling and configuration
- Probe failure throws the message above. The probe page is closed in `finally`. No configuration.

## 6. Behaviour specification

### SPEC-01: The report Tab-order step passes with the key the browser needs
- Verifies: AC#1
- Behaviour: Given the Session Report with its h1 focused (Chromium or WebKit, Linux CI or macOS with Full
  Keyboard Access on or off), When the test walks the Tab order with `await buttonTabKey(page)`, Then the last
  two reached elements are exactly `['View statistics', 'Back to Home']`. The file has no `browserName === 'webkit'`
  ternary and no `Alt+Tab` literal, its comment at the step names macOS Full Keyboard Access as the cause, and
  its assertion count is still at least 30.
- Verification: acceptance `e2e/report-navigation.spec.ts::View statistics opens Statistics with the session just ended in its totals`

### SPEC-02: buttonTabKey prefers plain Tab and returns a key that reaches a button
- Verifies: AC#1
- Behaviour: Given any page in Chromium or WebKit, When `buttonTabKey(page)` is awaited, Then it resolves to
  `'Tab'` or `'Alt+Tab'`, and pressing that key from a focused `tabindex="-1"` h1 on a probe document moves focus
  to the following `<button>`. In Chromium it resolves to `'Tab'`. Afterwards the context has the same number of
  pages as before (probe closed) and the element focused on `page` is unchanged.
- Verification: unit `e2e/keyboard-helper.spec.ts::buttonTabKey returns a key that tabs to a button and leaves the page as it was`

### SPEC-02b: The fallback picks Alt+Tab only when plain Tab misses, and fails loudly otherwise
- Verifies: AC#1
- Behaviour: Given an injected `reaches`, When `chooseButtonTabKey` runs, Then the results are as follows.
  `Tab`→true gives `'Tab'`, and `reaches` is called once, with `'Tab'` only. `Tab`→false and `Alt+Tab`→true
  gives `'Alt+Tab'` (calls `['Tab', 'Alt+Tab']`); this is the macOS case with Full Keyboard Access off. Both false
  rejects with `/neither Tab nor Alt\+Tab moves focus to a button/`.
- Verification: unit `e2e/keyboard-helper.spec.ts::chooseButtonTabKey falls back to Alt+Tab only when Tab misses`

### SPEC-03: Works on Linux CI and on macOS with Keyboard navigation on
- Verifies: AC#1, AC#2
- Behaviour: Given this Mac with Keyboard navigation ON (unchanged, Q-1), When the Run command (section 10)
  runs on chromium and webkit, Then all pass. After the orchestrator pushes the branch, the CI e2e job on
  `ubuntu-24.04` passes too. The off case is covered by SPEC-02b (D-3).
- Verification: command `npx playwright test e2e/report-navigation.spec.ts e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/error-recovery.spec.ts e2e/keyboard-helper.spec.ts` plus the CI e2e run on the pushed branch

### SPEC-04: back-focus one Tab reaches ← Home via the helper
- Verifies: AC#2
- Behaviour: Given Settings or Statistics with its h1 focused, When the key from `await buttonTabKey(page)` is
  pressed once, Then `← Home` is focused. The file has no `Alt+Tab` literal and no `browserName`, its comment
  names macOS Full Keyboard Access, and its assertion count stays 8.
- Verification: acceptance `e2e/back-focus.spec.ts::one Tab from the Settings heading reaches ← Home`

### SPEC-05: Settings Tab walk follows the controls via the helper
- Verifies: AC#2
- Behaviour: Given Settings, When `tabOrder(page, await buttonTabKey(page))` runs, Then `order` equals
  `['← Home', 'Show opponent styles at the table']` (expect unchanged). The file has no `Alt+Tab` literal and no
  `browserName`, its comment names macOS Full Keyboard Access, and its assertion count stays 22.
- Verification: acceptance `e2e/settings.spec.ts::every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44`

### SPEC-06: Error screen Tab reaches Return Home via the helper
- Verifies: AC#2
- Behaviour: Given any error-recovery scenario that calls `expectErrorScreen(page)`, When the key from
  `await buttonTabKey(page)` is pressed, Then the focused element is `{ tag: 'BUTTON', text: 'Return Home' }`
  (expect unchanged). The file has no `Alt+Tab` literal and no `browserName`, its comment names macOS Full
  Keyboard Access, and its assertion count stays 41.
- Verification: acceptance `e2e/error-recovery.spec.ts`

## 7. Edge cases
- Neither key reaches a button (unknown platform setting): the helper throws with a clear message (A-2). This is
  covered by code review, because it can't be reproduced on the supported platforms.
- Probe page left open on failure: prevented by `finally` and checked in SPEC-02 (page count).
- Probe page interfering with `page.on('request')` at `e2e/report-navigation.spec.ts:86-87`: the listener is
  per-page and the probe uses `setContent`, so N/A.
- Clock installed context-wide (`page.clock.install`): the probe has no timers, so N/A.
- error-recovery init scripts (`installFaults`, `e2e/support/fault-injection.ts:16`) and `workerCount`: the
  probe page creates no Workers and runs only static HTML. Fault counters live on `page`'s window, so N/A.
- Focus on `page` while the probe page opens: Playwright emulates focus per page. SPEC-02 asserts that `page`'s
  focused element is unchanged, and SPEC-04/06 press the key only after `buttonTabKey` resolves.
- Concurrency: `fullyParallel` uses separate contexts per test, so N/A.

## 8. Security considerations
N/A. This is test-only code with no untrusted input, no secrets, no new dependencies and no randomness.

## 9. Non-functional
The probe adds at most one page open plus two `setContent` calls per call, which should stay under 500 ms (see
Playwright list reporter timings). No change to the slow-test split.

## 10. Test plan
- Test command: `npm test && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/report-navigation.spec.ts e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/error-recovery.spec.ts e2e/keyboard-helper.spec.ts`
- New tests: `e2e/keyboard-helper.spec.ts` → SPEC-02, SPEC-02b. Modified: report-navigation → SPEC-01,
  back-focus → SPEC-04, settings → SPEC-05, error-recovery → SPEC-06.
- Judge scenario: run the Run command on both projects locally. Confirm that
  `grep -n "Alt+Tab\|browserName" e2e/report-navigation.spec.ts e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/error-recovery.spec.ts`
  finds nothing, that each step's comment names macOS Full Keyboard Access, and that assertion counts are
  unchanged (30/8/22/41). The orchestrator pushes the branch, and the CI e2e job (Linux) must pass as evidence.

## 11. Open questions
- None. Q-1 and Q-2 are answered in `doit/TASK-11.15/qa.md`.

## 12. Clarifications log
See `doit/TASK-11.15/qa.md`.
