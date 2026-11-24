# TASK-2.14: Pause the session from the Table header Home control

Status: Done · Completed: 2026-11-23 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-004 (REQ-004.2, .6, .9) · Branch: doit/TASK-2.14

## What was asked
The Table header gets a Home control. Choosing it opens Home, where Resume session (TASK-2.6) shows the paused session. The session is never ended and no Session Report is made. Between hands nothing is lost. Mid-hand, the unfinished hand is dropped as if the app had been closed, and resuming deals a new hand from the end-of-last-hand stacks. The story also decides what browser Back and Forward do on Home, Game Config and the Table (AC#6), and caps `nextBotName` when a stored session is parsed (AC#7, a TASK-2.6 security follow-up). Spec: doit/TASK-2.14/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Pausing needs no new write. The stored session record already is the paused state, and Home leaves it byte-for-byte unchanged. | yes | Matches "as when the app is closed". A rewrite would move `updatedAt`, which orders paused sessions. | Re-put the record with `updatedAt` = now. |
| A-2 | Home reads the paused session only after all issued table writes have settled (`tableWritesSettled()`). This covers the Home control, Leave table and browser Back. | yes | A click right after a hand completes could otherwise read the record from before that write and show 9 hands instead of 10. | Await only in the Home control's handler. |
| A-3 | The control is a native `<button class="table-home">Home</button>`, 44 px, styled like Leave table, in a `.table-header-actions` group. Focus moves to Home's heading afterwards. | yes | The storyboard has no Home control. | Icon-only house button with `aria-label="Home"`. |
| A-4 | "After hand 10" is set up by seeding hands 1–9 headlessly. The user then plays hand 10 in the browser, and hand 11 is abandoned with Home. | yes | Ten browser hands per browser would add about 40 s per push. | Opt-in slow spec playing all 10 hands. |
| A-5 | The stats check for AC#5 runs in Node inside the e2e spec. It compares stored records and `styleStats(styleCounts(...))` before and after the abandoned hand. | yes | Stats are computed only from stored records. | Headless-only check. |
| A-6 | `Home` renders only when `onHome` is passed. App passes it. Test harnesses and existing render tests do not. | yes | Locked tests expect exactly one button (Leave table) in `<Table/>`. | Always render it and edit two locked tests. |

## Clarifications and decisions
Both questions were auto-accepted under the unattended rule (qa.md). Please review them.
- **Q-1 (auto-accepted, review):** a text button "Home" placed before Leave table, styled like Leave table. The planned header order is Home, Settings, Leave table. REQ-004.9 calls it "Home".
- **Q-2 (auto-accepted, review):** opening the Table (Start game or Resume) pushes one history entry `{ tlhTable: key }`.
  - Back on the Table pauses to Home, like the Home control.
  - Forward never reopens the Table.
  - Home and Game Config add no entries.
  - Leaving the Table in the app calls `history.back()`.
  - This reverses TASK-2.1 A-2 for the Table only.
- D-3: `nextBotName` is validated with `whole(..., 0, MAX_SESSION_COUNT)`.
- D-4: `tableWritesSettled()` is exported from `useTableSession.ts`, so one call covers every way of leaving the Table.
- Spec Detective: A-1..A-6 accepted as written.

## What was built
- `src/table/session-record.ts`: `nextBotName` is capped at `MAX_SESSION_COUNT`. A corrupt record is rejected on read, so Home stays usable.
- `src/ui/table/Table.tsx`, `TableScreen.tsx`: optional `onHome` prop and the Home button, before Leave table.
- `src/ui/table/useTableSession.ts`: `tableWritesSettled()` and a module-level chain of pending writes. It never rejects, and resolved links are not kept.
- `src/ui/App.tsx`: `goHome`/`openTable`, the history entry and `popstate` handling. The key is `${performance.timeOrigin}:${counter}`.
- `src/ui/styles.css`: `.table-header-actions`, and `.table-home` shares the `.table-leave` rule.
- `e2e/support/paused-clock.ts`: exports `axeWithPausedClock`.
- Docs: `docs/storage/sessions.md` (new "Pause from the Table" section and the cap), new `docs/ui/navigation.md`.
- New tests: `tests/ui/table-home.acceptance.test.tsx`, `tests/table/session-cap.acceptance.test.ts`, `e2e/home-control.spec.ts`, `e2e/history.spec.ts`.
- No changes to the engine, bots, advice or stats.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Home in the header | Render test with exact markup, plus a holdout render check | PASS | tests/ui/table-home.acceptance.test.tsx |
| SPEC-02..06 | AC#1–5: pause, resume, mid-hand abandon, no report, no stat trace | Playwright in Chromium and WebKit | PASS | e2e/home-control.spec.ts |
| SPEC-07, 09 | AC#6: Back/Forward; bad `nextBotName` leaves Home usable | Playwright | PASS | e2e/history.spec.ts |
| SPEC-08 | AC#7: `nextBotName` cap | Unit acceptance test | PASS | tests/table/session-cap.acceptance.test.ts |
| SPEC-10..12 | Repo checks, browsers/CI, docs | Lint, typecheck, `npm test`, full Playwright, doc review | PASS | gates/build-1.json, gates/fix-2.json |

- `npm test`: 997 passed, 41 opt-in slow skipped, 226 files. Lint and typecheck clean. Coverage thresholds met (table 97.99%, `session-record.ts` 90.74%).
- Full Playwright suite: 204 passed, 16 skipped (opt-in slow). The new specs ran 3 times each, 42/42.
- The judge also drove the spec's manual scenario on the real clock in Chromium and WebKit (6/6). Back on the Table opened Home with Resume "3 hands · paused".
- Locked test hashes match and the integrity check exits 0. No existing tests were touched.
- Judge round 1: PASS, 12/12, no blocking findings. Gates: build run 1 and fix run 2, both PASS.

## Review
There were no blocking findings in round 1. The security reviewer found nothing reachable. It also noted that the `nextBotName` cap closes the TASK-2.6 MINOR.

### Non-blocking review notes (deliberately not fixed)
- MINOR `src/ui/table/useTableSession.ts:writes-settled-race-untested`: no test exercises `tableWritesSettled`. Making it return `Promise.resolve()` would leave every test green, because SPEC-02 and SPEC-07 poll until the write lands before clicking.
- NIT `src/ui/App.tsx:history-key-clock-derived`: the history key comes from `performance.timeOrigin`, which is why SPEC-07 case 5 cannot use the paused clock.
- NIT `src/ui/App.tsx:forward-then-back-stays-on-home`: after Back and then Forward on the Table, Home sits on the stale entry. The next Back goes to the app's own entry and shows nothing, so a second Back is needed to leave.

## How to try it
- `npm test`
- `npm run build && npx playwright test e2e/home-control.spec.ts e2e/history.spec.ts`
- By hand: `npm run dev`, start a game, play a hand, then choose Home. Resume session shows "N hands · paused". Browser Back on the Table also opens Home.

## Run metrics
Questions 2 (both auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · send-backs 0 · escalations 0 · changed lines 790 (14 files, excluding doit/).

## Known limitations and follow-ups
- [trainer] Add a browser check that clicks Home or Back while a table write is still pending, for example by delaying the IndexedDB `sessions` put. This pins `tableWritesSettled` (A-2, D-4). Owner: none known.
- [trainer] Decide whether the history key should stop depending on `performance.timeOrigin` (a counter plus a random or session id), so that the paused-clock harness can cover reload cases. Owner: none known.
- [trainer] Fix Forward after Back on the Table: Home stays on the stale entry and the next Back appears to do nothing. Pin the behaviour with a test. Owner: none known.
- Limitation: Playwright's fake clock (`page.clock.install`) resets `performance.timeOrigin` to the install time on every load. Under a paused clock the history keys of two loads would collide. Only SPEC-07 case 5 (Back after reload, then Resume) therefore runs on the real clock. Production browsers are unaffected.
- Items for the user to review: Q-1 (label and placement) and Q-2 (Back/Forward navigation).

## Lessons for the factory (proposals — not applied)
- The spec's edge case "Home while a write is running" was planned to be covered by SPEC-07 (1) via Back. The same spec's polling requirements made that impossible. Proposal: when the spec adds a race guard, require a test that holds the awaited operation open, and have the spec reviewer check that no other SPEC item's setup defeats it.
- The paused-clock harness assumes distinct `timeOrigin` values per load, which only surfaced at build time. Proposal: add a note to the spec template's test plan, or to the e2e docs, that `page.clock` fakes `performance.timeOrigin`.
