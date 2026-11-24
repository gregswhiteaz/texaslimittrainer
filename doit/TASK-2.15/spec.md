# Spec: TASK-2.15 — Practise with play money only

Status: READY (no questions; A-1..A-8 assumed)
Task: TASK-2.15 · Parent/epic: TASK-2 · Requirements: REQ-006 (006.3), REQ-061 (061.1) · Dream: limit-holdem-trainer

## 1. Summary
This story adds a play-money check that runs on every push. It does not change the app. A screen list names
every App screen and every dialog component. A Playwright walk visits each entry in the built app and fails if
any shown text, or any control's accessible text, offers a deposit, payment, purchase, cash-out, real-money wager
or real-money conversion. A unit-suite test fails when an App screen or dialog component is missing from the
list, so later screens can't escape the check. A scan of the built `dist/` and `package.json` finds no payment
library, no Payment Request API and no payment-provider URL. A fixture page with a "Deposit" button shows that
the check fails and names the screen.

## 2. Scope
- In scope:
  - `e2e/support/screen-list.ts` (new): the screen list. It holds data only and imports nothing.
  - `e2e/support/play-money.ts` (new): pure functions. These are the offer matcher, the source scan that finds
    App screens and dialog components, the list comparison and the bundle/package matcher. Vitest and
    Playwright both import it, so it must not import `@playwright/test`.
  - `e2e/play-money.spec.ts` (new): the walk, the Deposit fixture and the bundle + `package.json` scan.
  - `tests/ui/play-money.test.ts` (new): unit tests for the matchers and the comparison, using fixtures.
  - `tests/ui/screen-list.acceptance.test.ts` (new): the real comparison of `src/ui` against the list.
  - `docs/ui/play-money.md` (new): what the check flags, how to register a new screen or dialog, and how to
    run it.
- Not doing:
  - No change to any file under `src/`, and no visible text change.
  - No new dependency. No change to `package.json`, the Playwright config or the CI workflow. The new spec is
    picked up by `npm run e2e`, which already runs on every push (`.github/workflows/ci.yml`, step "E2E").
  - No axe run and no layout checks (no screen changes). No visual snapshots.
  - Transitive dependencies in `package-lock.json` are not scanned. AC#3 names `package.json`, and the
    `dist/` scan catches any payment code that actually ships.
  - The check does not cover every possible table state. The Table is visited at a user turn with the hint card
    ready and after a result with the Hand Review open (SPEC-01), and that's all.
  - Statistics and Settings aren't registered (they don't exist yet; their epics register them, per the task
    Notes).
- Scope budget: files=6, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The vocabulary of a real-money offer is the fixed phrase list in §5 "Rules". Matching is case-insensitive and word-bounded. Single poker words (`buy`, `pay`, `cash`, `wager`, `bet`, `$`) are never flagged alone. Only offer phrases are flagged. | yes | Rendered text already contains "Buy-in", "Rebuy for $160", "Cash game", "cash result", "-$160", and advice text says "pays off value bets" and "buy position" (`src/bots/styles/calling-station.json:27`, `src/advice/charts/full-ring.json:250`). Flagging single words would fail on legitimate trainer text. | A broad word list with an allow-list of exceptions, which is fragile as strategy text grows. |
| A-2 | The screen list lives in `e2e/support/screen-list.ts`, not in `src/`. | yes | It is test registration data. Keeping it out of `src/` keeps it out of the bundle and out of the coverage denominator. | `src/ui/screen-list.ts` (closer to `App.tsx`, but ships unused data). |
| A-3 | AC#2's "every route and dialog component in the built app" is found from the source that the build compiles. Routes are every `name: '<x>'` literal in the `Screen` union of `src/ui/App.tsx`. Dialog components are every `src/ui/**/*.tsx` file (tests excluded) containing `<dialog` or `role="dialog"`/`role="alertdialog"`, named by file basename. The comparison runs in Vitest (`npm test`), in milliseconds. | yes | The app has no router (`App.tsx:16-22` state union). Minified `dist/` loses component names. A source scan is exact and fast. | Inspect the running app at runtime. That can't enumerate screens that aren't reachable. |
| A-4 | The comparison also fails on a stale entry: one whose route or component no longer exists in the source. The failure names that entry. | yes | Keeps the list honest in both directions. It costs one extra set difference. | Only check the missing direction. |
| A-5 | The walk is one Playwright test per browser project (Chromium and WebKit, as for every spec). It reuses TASK-3.11's A-6 bust seed (`e2e/rebuy.spec.ts:20-49`), copied into the new spec because `rebuy.spec.ts` is locked. Target: under 20 s of real time per project locally. It doesn't go in the opt-in slow group. | yes | It is a correctness check that runs in seconds, as the standing rule requires (2026-11-21). One page and one walk avoid repeating setup. | One test per screen: more isolation, but about 3× the setup time. |
| A-6 | The transient `ending` screen (`App.tsx:250-251`, an empty `<main aria-busy="true">`) is captured with a MutationObserver. The observer is installed in the page before Leave table is clicked. It records the busy `<main>`'s collected text when the element first appears. | yes | The ending screen is shown only until IndexedDB resolves. The observer's microtask runs before that, so the capture is deterministic. | Leave `ending` unlisted (AC#2 forbids this), or stub the store so it hangs (invasive). |
| A-7 | The text the check reads is `document.body.innerText`, `textContent` of every `<option>`, the values of the attributes `aria-label`, `aria-description`, `title`, `alt` and `placeholder` on any element, and the `value` of every `<input>`. | yes | This covers visible text and the accessible names of controls, including icon-only buttons. | Accessibility snapshot (differs between browsers). |
| A-8 | The bundle scan reads the `dist/` that Playwright's `webServer` builds before any test runs (`playwright.config.ts:20-24`). It doesn't run its own build. | yes | This avoids a second ~seconds-long `vite build` in `npm test`. `dist/` is always fresh because `reuseExistingServer: false`. | A Vitest build into a temp directory, as `tests/toolchain/build.test.ts` does (slower for every `npm test`). |

## 3. Current system
- Routing: `src/ui/App.tsx:16-22` is the `Screen` union, and it has no router. The names are `home`, `config`,
  `table` (twice: new game and resume), `ending` and `report`. The rendering switch is at `App.tsx:208-259`, and
  the `ending` screen is `<main className="screen" aria-busy="true"></main>` (`App.tsx:251`).
- Dialogs: two components use a native `<dialog>`. They are `src/ui/config/EndSessionDialog.tsx:31` (TASK-2.7,
  heading "End your paused session?") and `src/ui/table/BustDialog.tsx:18` (TASK-3.11, heading "Out of chips",
  buttons Rebuy and Leave table). No other `role="dialog"` exists in `src/ui`. The hint card is a `<section>`
  (`HintCard.tsx:14`), the review panel an `<aside>` (`ReviewPanel.tsx:26`) and the grade badge a button
  (`Table.tsx:312-315`). All three are parts of the Table, not dialogs.
- Play-money vocabulary already on screen: Home "Set up a cash game or sit-and-go" (`HomeScreen.tsx:33`), Game
  Config "Cash game" and "Buy-in" (`GameConfigScreen.tsx:35,169`), bust text "Rebuy for $160 to keep playing"
  (`BustDialog.tsx:29`), and report KPIs "Result / BB/100 / Rebuys" with "-$160" (`e2e/rebuy.spec.ts:162-163`).
- Current bundle: `dist/assets/*.js` contains only the URLs `http://www.w3.org` and `https://react.dev`, and no
  `PaymentRequest`, `canMakePayment` or provider host (checked with grep on the current `dist/`).
  `package.json` dependencies are react and react-dom. No dev dependency matches a payment pattern.
- Tests: `npm test` = `vitest run --coverage` over `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`). `npm run e2e` =
  `playwright test` over `e2e/**/*.spec.ts` in Chromium and WebKit (`playwright.config.ts:8-19`). Its
  `webServer` runs `npm run build && npm run preview` on port 4173. CI runs `npm run e2e` on every push
  (`.github/workflows/ci.yml`, job `e2e`). `tsconfig.json:23` includes `e2e`, so typecheck and lint cover the new
  files.
- Locked tests: the build edits no existing test. Tests that are locked and nearby, and must stay untouched:
  `e2e/rebuy.spec.ts` (TASK-3.11), `e2e/new-game-confirm.spec.ts` (TASK-2.7), `e2e/smoke.spec.ts` and
  `tests/toolchain/build.test.ts` (TASK-1.1), and `tests/ui/report-screen.acceptance.test.tsx` (TASK-10.1). No
  `e2e/support/*` file is locked, so the new support files are free to create.
- Existing code to reuse:
  - `e2e/support/hand-records.ts` → `seedStoredSessions`, `header`, `handOver`, `playToResult`.
  - `e2e/support/paused-clock.ts` → `runUntil`, `runUntilMyTurn`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords` (pinned replay words).
  - `src/table/session.ts` → `DEFAULT_SESSION_CONFIG`, `seatSession`, and `src/table/session-record.ts` →
    `sessionRecord` (A-6 seed construction, as in `e2e/rebuy.spec.ts:36-46`).
  - Locators already used elsewhere: `getByRole('dialog', { name: 'Out of chips' })`,
    `getByRole('button', { name: 'Leave table' })` (`e2e/session-report.spec.ts:34`),
    `getByRole('complementary', { name: 'Hand #N review' })` (`e2e/session-report.spec.ts:158`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Put the play-money check in `e2e/` and the list-vs-source comparison in Vitest. Share both through one pure module, `e2e/support/play-money.ts`. | Do everything in Playwright, or do everything in Vitest with a jsdom render. | The text check needs the real built app. The coverage check is a pure source scan. One module keeps a single definition of each rule. | no | n/a |
| D-2 | The bundle scan is an e2e test that reads the `webServer`'s `dist/` (A-8). | A Vitest build into a temp directory. | It is fast and needs no extra build. | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/support/screen-list.ts` — new: `SCREEN_LIST` and the `ScreenId` type.
- `e2e/support/play-money.ts` — new: `realMoneyOffers`, `appScreens`, `unlistedScreens`, `paymentFindings`.
- `e2e/play-money.spec.ts` — new: the walk (SPEC-01), the fixture (SPEC-06) and the bundle scan (SPEC-04).
- `tests/ui/play-money.test.ts` — new: unit tests (SPEC-03, SPEC-05, SPEC-07).
- `tests/ui/screen-list.acceptance.test.ts` — new: the real comparison (SPEC-02).
- `docs/ui/play-money.md` — new: documentation (SPEC-08).

### Components, interfaces and data
- `e2e/support/screen-list.ts`:
  ```ts
  export type ScreenEntry =
    | { readonly id: string; readonly kind: 'screen'; readonly route: string }
    | { readonly id: string; readonly kind: 'dialog'; readonly component: string };
  export const SCREEN_LIST = [
    { id: 'home', kind: 'screen', route: 'home' },
    { id: 'game-config', kind: 'screen', route: 'config' },
    { id: 'end-session-dialog', kind: 'dialog', component: 'EndSessionDialog' },
    { id: 'table', kind: 'screen', route: 'table' },
    { id: 'bust-dialog', kind: 'dialog', component: 'BustDialog' },
    { id: 'ending', kind: 'screen', route: 'ending' },
    { id: 'session-report', kind: 'screen', route: 'report' },
  ] as const satisfies readonly ScreenEntry[];
  export type ScreenId = (typeof SCREEN_LIST)[number]['id'];
  ```
  The file has a header comment: "Register every new App screen and dialog component here; the play-money check
  visits each (TASK-2.15)."
- `realMoneyOffers(text: string): string[]` returns every matched phrase, in order, exactly as it appears in
  `text`. It returns `[]` when nothing matches.
- `appScreens(appSource: string, uiFiles: readonly { path: string; source: string }[]): { routes: string[];
  dialogs: string[] }`. Routes are the unique `name: '<x>'` literals inside the `type Screen =` declaration (up
  to its terminating `;`). Dialogs are the basenames, without `.tsx`, of files whose source matches
  `/<dialog\b|role=["']?(alert)?dialog\b/`. Both lists are sorted.
- `unlistedScreens(found: { routes: string[]; dialogs: string[] }, list: readonly ScreenEntry[]): string[]`
  returns messages, sorted:
  - `screen <route> is not in the screen list` for each found route with no `kind: 'screen'` entry.
  - `dialog <Component> is not in the screen list` for each found dialog with no `kind: 'dialog'` entry.
  - `screen list entry <id> matches no screen or dialog in the app` for each stale entry (A-4).
- `paymentFindings(files: readonly { name: string; text: string }[], pkg: Record<string, unknown>): string[]`
  returns messages, in this order:
  - `<file>: Payment Request API (<match>)` for each API match.
  - `<file>: payment-provider URL (<host>)` for each provider host.
  - `package.json: payment library <name>` for each matching key in `dependencies`, `devDependencies`,
    `optionalDependencies` or `peerDependencies`.

### Rules and algorithms
- **Real-money offer phrases** (A-1). The regex is case-insensitive, each phrase is wrapped in `\b…\b`, and
  `[\s-]?` means an optional space or hyphen:
  - `deposit\w*`, `withdraw\w*`, `cash[\s-]?outs?`, `purchas\w*`, `checkout`, `payments?`, `pay (now|with|online)`
  - `buy (now|chips|more chips|coins|credits|tokens)`, `top[\s-]?up`
  - `real[\s-]?(money|cash)`, `redeem\w*`, `convert\w* (chips|winnings|to cash|to money)`,
    `exchange (chips|winnings)`
  - `credit card`, `debit card`, `card number`, `paypal`, `stripe`, `apple pay`, `google pay`, `venmo`, `skrill`,
    `neteller`, `klarna`
- Worked examples for `realMoneyOffers`:
  | Input | Result |
  |---|---|
  | `Deposit` | `['Deposit']` |
  | `Cash out` | `['Cash out']` |
  | `Cashout now` | `['Cashout']` |
  | `Buy chips` | `['Buy chips']` |
  | `Pay now` | `['Pay now']` |
  | `Play for real money` | `['real money']` |
  | `Withdraw winnings` | `['Withdraw']` |
  | `Redeem chips` | `['Redeem']` |
  | `Convert chips to cash` | `['Convert chips']` |
  | `Top up` | `['Top up']` |
  | `Apple Pay` | `['Apple Pay']` |
  | `Rebuy for $160 to keep playing, or leave the table.` | `[]` |
  | `Buy-in $160 (20 big bets)` | `[]` |
  | `Cash · 6 players · $4/$8 · 12 hands · paused` | `[]` |
  | `Set up a cash game or sit-and-go` | `[]` |
  | `Your cash result: won $56` | `[]` |
  | `Result -$160 BB/100 -153.8 Rebuys 0` | `[]` |
  | `it pays off value bets with weak pairs` | `[]` |
  | `raise more often to buy position` | `[]` |
  | `Bet $8` | `[]` |
  | `Rebuy` | `[]` |
  | `Leave table` | `[]` |
- **Payment Request API** in `dist/` (`.js`, `.html`, `.css` files): the regex
  `\b(PaymentRequest|PaymentResponse|PaymentRequestUpdateEvent|PaymentMethodChangeEvent|PaymentAddress)\b|canMakePayment`.
- **Payment-provider hosts** (case-insensitive, any subdomain, word-bounded): `stripe.com`, `stripe.network`,
  `paypal.com`, `paypalobjects.com`, `braintreegateway.com`, `braintree-api.com`, `adyen.com`, `checkout.com`,
  `squareup.com`, `squarecdn.com`, `razorpay.com`, `klarna.com`, `mollie.com`, `paddle.com`, `pay.google.com`,
  `apple-pay-gateway.apple.com`, `skrill.com`, `neteller.com`, `venmo.com`, `coinbase.com`, `chargebee.com`,
  `recurly.com`, `lemonsqueezy.com`.
- **Payment library names** in `package.json`: a key matches
  `/(^|[@/-])(stripe|paypal|braintree|adyen|square|razorpay|klarna|mollie|paddle|chargebee|recurly|lemonsqueezy|revenuecat|payment|payments|billing|checkout)([/-]|$)/i`.
  Matched: `@stripe/stripe-js`, `stripe`, `react-paypal-js`, `@paypal/react-paypal-js`,
  `payment-request-polyfill`. Not matched: `react`, `vite`, `@playwright/test`,
  `fast-check`, `prettier`.
- **Worked example (source scan, current repo)**: `App.tsx:16-22` gives routes
  `['config','ending','home','report','table']`, and the dialog files give `['BustDialog','EndSessionDialog']`.
  Against `SCREEN_LIST`, `unlistedScreens` returns `[]`.
- **Worked example (fixture)**: add `| { readonly name: 'stats' }` to an App source fixture, a file
  `src/ui/settings/SettingsDialog.tsx` whose source is `<dialog open>…</dialog>`, and a list with an extra
  entry `{ id: 'old', kind: 'screen', route: 'gone' }`. The result is these three messages, sorted:
  `dialog SettingsDialog is not in the screen list`, `screen list entry old matches no screen or dialog in the
  app`, `screen stats is not in the screen list`.
- **Check on a page** (in `e2e/play-money.spec.ts`): `checkPlayMoney(page, id: ScreenId | 'fixture-deposit')`
  collects text per A-7 with `page.evaluate`, then runs `realMoneyOffers` on each string. If anything matches, it
  throws `Error('Play-money check failed on <id>: "<match>", "<match>"…')`. Otherwise it adds `id` to the
  walk's `visited` set.
- **Walk** (SPEC-01). Under a paused clock (`page.clock.install({ time: 0 })`, `pauseAt(1000)`), with
  `stubReplayWords([0x9e3779b9, 1, 2, 3])` and the A-6 seed (6-max default TAG, user seat 5 on $4, button 3,
  hand 13, session id `'e'.repeat(32)`):
  1. Open `/`, seed the session and reload. Home shows `Resume session` with subtitle
     `Cash · 6 players · $4/$8 · 12 hands · paused`. Check `home`.
  2. Choose New game, then check `game-config`.
  3. Choose Start game. The dialog "End your paused session?" opens. Check `end-session-dialog`.
  4. Choose the dialog's Cancel, then Game Config's Cancel (`GameConfigScreen.tsx:182`), which returns to Home.
     Choose Resume session. The header shows `Hand #13`. Check `table`.
  5. Run the clock with `runUntil` until hand 13 is over. "Out of chips" opens. Check `bust-dialog`.
  6. Choose Rebuy. The header shows `Hand #14`. The user is in the small blind (button moves to seat 4), so there
     is always a preflop decision. Call `runUntilMyTurn` and choose Hint. Wait for `[data-part="hint-action"]`.
     Check `table` again.
  7. `playToResult(page, 14, …)` (folds). The complementary `Hand #14 review` is visible. Check `table` again.
  8. Install the A-6 MutationObserver (window promise), then choose Leave table. Await the recorded busy-`main`
     text and run `realMoneyOffers` on it as `ending`.
  9. The "Session report" heading is visible. Check `session-report`.
  10. Expect every `SCREEN_LIST` id to be in `visited`. On failure, name the missing ids:
      `screen list entries not visited: <ids>`.
  11. Every request URL during the walk has origin `http://localhost:4173` (DoD#8).

### Error handling and configuration
- Error messages are as above. They always name the screen id or entry, so a CI failure points at the
  offending screen.
- No configuration and no environment variables. The spec doesn't use `TLH_SLOW_TESTS` (A-5).

## 6. Behaviour specification

### SPEC-01: Every listed screen and dialog shows only play money
- Verifies: AC#1, DoD#1, DoD#8
- Behaviour: Given the built app and the A-6 seeded paused session, When the walk in §5 visits Home, Game Config,
  the end-session dialog, the Table (hand 13, hand 14 with the hint card ready, and hand 14 with the review
  open), the bust dialog, the ending screen and the Session Report, Then `realMoneyOffers` returns `[]` for every
  collected string on each. Every `SCREEN_LIST` id is visited, and every request is same-origin
  (`http://localhost:4173`).
- Verification: acceptance `e2e/play-money.spec.ts::every listed screen and dialog shows only play money`

### SPEC-02: The screen list names every App screen and dialog component
- Verifies: AC#2, DoD#1
- Behaviour: Given `src/ui/App.tsx` and every `src/ui/**/*.tsx` file except `*.test.tsx`, When
  `appScreens` scans them and `unlistedScreens` compares the result with `SCREEN_LIST`, Then the result is `[]`,
  and the assertion message lists the returned strings. As a sanity check, `appScreens` returns routes
  `['config','ending','home','report','table']` and dialogs `['BustDialog','EndSessionDialog']`.
- Verification: acceptance `tests/ui/screen-list.acceptance.test.ts::the screen list names every App screen and every dialog component`

### SPEC-03: A missing screen, missing dialog or stale entry fails by name
- Verifies: AC#2, DoD#1
- Behaviour: Given the fixture in §5 ("Worked example (fixture)"), When `unlistedScreens(appScreens(...), list)`
  runs, Then it returns exactly these three messages, in this order:
  `dialog SettingsDialog is not in the screen list`, `screen list entry old matches no screen or dialog in the
  app`, `screen stats is not in the screen list`.
  A fixture with `role="alertdialog"` on a `<div>` in `ConfirmBox.tsx` is found as dialog `ConfirmBox`.
- Verification: unit `tests/ui/play-money.test.ts::unlistedScreens names an unlisted screen, an unlisted dialog and a stale entry`

### SPEC-04: The built bundle and package.json ship no payment code
- Verifies: AC#3, DoD#1
- Behaviour: Given the `dist/` built by the Playwright `webServer` and the repo `package.json`, When
  `paymentFindings` scans every `.js`, `.html` and `.css` file under `dist/` (recursively, at least one `.js`
  file) and `package.json`, Then it returns `[]`.
- Verification: acceptance `e2e/play-money.spec.ts::the built bundle and package.json carry no payment library, Payment Request API or payment-provider URL`

### SPEC-05: The bundle matcher finds each kind of payment code
- Verifies: AC#3, DoD#1
- Behaviour: Given the files `a.js` = `const r = new PaymentRequest(m, d);` and
  `b.js` = `load("https://js.stripe.com/v3")`, and a package with
  `dependencies: { react: '1', '@stripe/stripe-js': '1' }`, When `paymentFindings` runs, Then it returns exactly
  `['a.js: Payment Request API (PaymentRequest)', 'b.js: payment-provider URL (js.stripe.com)',
  'package.json: payment library @stripe/stripe-js']`. Given `x.js` =
  `fetch("http://www.w3.org/2000/svg"); "https://react.dev"` and `{ dependencies: { react: '1', 'react-dom': '1' } }`,
  Then it returns `[]`.
- Verification: unit `tests/ui/play-money.test.ts::paymentFindings flags the Payment Request API, a provider URL and a payment library`

### SPEC-06: A fixture screen with a Deposit control fails the check and is named
- Verifies: AC#4, DoD#1
- Behaviour: Given a page set with
  `page.setContent('<main><h1>Fixture</h1><button type="button">Deposit</button></main>')`, When
  `checkPlayMoney(page, 'fixture-deposit')` runs, Then it rejects with an error whose message is exactly
  `Play-money check failed on fixture-deposit: "Deposit"`. Given the same page with an icon button
  `<button aria-label="Deposit"></button>` and no text, Then it rejects with the same message.
- Verification: acceptance `e2e/play-money.spec.ts::a fixture screen with a Deposit control fails the check and names it`

### SPEC-07: The offer matcher flags offers and not play-money vocabulary
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given each input in the §5 worked-example table, When `realMoneyOffers(input)` runs, Then it returns
  that row's result exactly.
- Verification: unit `tests/ui/play-money.test.ts::realMoneyOffers flags real-money offers and not play-money vocabulary`

### SPEC-08: Checks, boundaries and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#7, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the finished build, When the gates run, Then all of the following hold:
  - Lint, typecheck and `npm test` pass. The golden suite passes 100%. Coverage thresholds hold (no `src` change).
  - No engine, bots, advice or statistics change, so the boundary test still passes and the 10,000-hand
    playtest still reports 0 violations (DoD#6 is run for completeness).
  - DoD#7 N/A: no screen is added or changed, but the new spec still runs in Chromium and WebKit.
  - DoD#9 N/A: no strategy content. DoD#12 N/A: no service worker yet.
  - CI is green on the branch.
  - `docs/ui/play-money.md` documents the phrase list, the screen list, how to register a screen or dialog,
    and the commands. It is published to Backlog.md.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run -s playtest -- --hands 10000 --seed 42 && npx playwright test e2e/play-money.spec.ts`

## 7. Edge cases
- Transient screen (`ending`): captured by the observer (A-6) → SPEC-01.
- Icon-only control with only an `aria-label`: collected (A-7) → SPEC-06.
- Offer text inside a modal `<dialog>`: it is in `body.innerText` while open → SPEC-01 (bust and end-session
  dialogs).
- Mixed case and hyphenation (`Cash-Out`, `CASHOUT`, `Top-up`): case-insensitive with `[\s-]?` → SPEC-07.
- A new screen added to the `Screen` union, or a new `<dialog>` component, without registration → SPEC-02 fails.
  SPEC-03 proves the failure names it.
- A registered entry removed from the app → stale-entry message (A-4) → SPEC-03.
- Empty `dist/` (build failed): SPEC-04 asserts at least one `.js` file is scanned, so the scan can't pass on
  nothing.
- Hint worker fails, so the card shows the error text: that text is still scanned, but the walk waits for
  `hint-action`, so a failure there surfaces as a timeout naming the hint (acceptable: the existing hint specs
  cover the worker).
- Concurrency, permissions, invalid input: N/A, because the check only reads fixed sources and the page it
  drives.

## 8. Security considerations
- Trust boundaries: none new. The tests read repo files and the locally built bundle.
- New dependencies: none. Network: the walk asserts same-origin requests (DoD#8).
- Regexes run on bounded, trusted input, with no catastrophic backtracking: alternations of literals with at
  most `\w*`.
- Randomness: the walk pins replay words with `stubReplayWords` for determinism. It has no fairness impact.

## 9. Non-functional
- The walk takes under 20 s of real time per browser project locally, measured from the Playwright list reporter
  duration (A-5). The fixture and bundle tests take under 2 s each.
- The Vitest files add under 1 s to `npm test`.
- Nothing goes in `test:slow` or `e2e:slow`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/play-money.spec.ts` (builds the app, then runs the walk, the fixture and
  the bundle scan in Chromium and WebKit).
- New tests (path → SPEC ids):
  - `e2e/play-money.spec.ts` → SPEC-01, SPEC-04, SPEC-06
  - `tests/ui/screen-list.acceptance.test.ts` → SPEC-02
  - `tests/ui/play-money.test.ts` → SPEC-03, SPEC-05, SPEC-07
- Judge's end-to-end scenarios:
  - Run `npx playwright test e2e/play-money.spec.ts`. All 6 tests pass (3 tests × 2 browsers).
  - Temporarily add `<button>Deposit</button>` to `HomeScreen`. The walk fails with
    `Play-money check failed on home: "Deposit"`. Revert.
  - Temporarily add `| { readonly name: 'stats' }` to `App.tsx`'s `Screen` type. `npx vitest run
    tests/ui/screen-list.acceptance.test.ts` fails, naming `screen stats is not in the screen list`. Revert.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-2.15/qa.md`.
