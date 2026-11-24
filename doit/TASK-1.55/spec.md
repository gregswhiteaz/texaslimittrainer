# Spec: TASK-1.55 — Make the onHandComplete-once e2e check wait for the callback

Status: READY (approved 2026-11-23)
Task: TASK-1.55 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
Main CI #249 failed in WebKit because `e2e/hand-records.spec.ts` test 'onHandComplete fires exactly once per
hand even with the same replay code' read the records-harness call log once, right after the result appeared,
and saw 0 calls. `onHandComplete` is called after the real IndexedDB write resolves, so an immediate read races
it. This task replaces each immediate call-count read in that test with a bounded `expect.poll` on the exact
same expected value. Test-only change; no product code changes.

## 2. Scope
- In scope: the call-count reads in the test at `e2e/hand-records.spec.ts:230-257`.
- Not doing:
  - No product code changes (`src/**`), no harness changes (`e2e/support/**`), no config changes.
  - No dropped, loosened or reworded assertions; no new tests; no timeout increases.
  - Other reads of the harness log in this file are not racy (see §3) and stay as they are.
  - `e2e/session-records.spec.ts` does not exist in the repo; nothing to change there.
- Scope budget: files=1, lines=15

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Use Playwright's default `expect.poll` timeout (5 s, no `expect.timeout` override in `playwright.config.ts`) as the bound. | yes | Same bound as the existing `expect.poll(() => storedCount(page))` at `e2e/hand-records.spec.ts:254`; the IndexedDB write resolves in real time, not on the paused fake clock, so polling needs no clock advance. | Explicit `{ timeout: 10_000 }` |
| A-2 | The "still exactly 1 after the 1450 ms advance" check (line 243) stays an immediate exact read, after line 237 has polled until the count reached 1. | yes | Once the count has reached 1, an immediate exact read after the time advance is the strongest check that no second call arrived; polling it would add nothing. Matches the task brief. | Poll it as well |

## 3. Current system
- `e2e/hand-records.spec.ts:49-50` — `harnessLog(page)` returns `window.__records` (`{ events, calls, renders }`).
- `e2e/support/records-harness.tsx:76-79` — each parent render increments `renders`; `onHandComplete` pushes
  `hand.replayCode` to `calls`. `:12` — default store pauses under the fake clock then calls the real
  IndexedDB `add`, so the callback lands asynchronously after the result is visible.
- `e2e/hand-records.spec.ts:237,245,248,251-252` — the immediate count reads that race the callback.
- Other harness-log reads in the file are safe and unchanged: `eventAt` (`:52-56`) is used for the `result`
  and `header:2` events that are logged when they render (already awaited via the UI); `expectSavedBeforeDeal`
  (`:64-70`) runs after `header:2` is visible, which the product only shows after `saved:1`; `:287` is a
  negative `not.toContain('unhandled')` check after 100 clock slices, where polling would not strengthen it.
- `e2e/hand-records-kill.spec.ts` does not use `window.__records`.
- Playwright projects: `chromium` and `webkit` (`playwright.config.ts:13-15`).
- Existing code to reuse:
  - `e2e/hand-records.spec.ts:254` → the `await expect.poll(() => …).toBe(…)` pattern already in the file.
  - `harnessLog` helper → the polled function body.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Poll `(await harnessLog(page)).calls` with `toHaveLength(n)` / `toEqual([...])` | Wait for a `saved:n` event first, then read | Smallest change, keeps the exact matchers and values; precisely what AC#1 asks | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/hand-records.spec.ts` — replace the racy immediate reads in the onHandComplete-once test with `expect.poll`.

### Components, interfaces and data
- No interface changes.

### Rules and algorithms
Exact edits inside test 'onHandComplete fires exactly once per hand even with the same replay code':
- Line 237 → `await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(1);`
  (lines 238-243 unchanged: renders baseline, time advance, `paused.calls` exact `toHaveLength(1)`.)
- Line 245 → `await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(1);`
- Line 248 → `await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(2);`
- Lines 251-252 → `await expect.poll(async () => (await harnessLog(page)).calls).toEqual([PINNED_CODE, PINNED_CODE, PINNED_CODE]);`
  (formatted by Prettier).
- Lines 254-257 unchanged.
- Since `calls` only grows, polling for an exact count still fails if the count overshoots (it never comes back
  down), so no assertion is loosened.

### Error handling and configuration
- On timeout `expect.poll` fails with the last received value, same diagnostic quality as before.

## 6. Behaviour specification

### SPEC-01: call-count checks wait for the callback and stay exact
- Verifies: AC#1
- Behaviour: Given the records harness with churn under the paused clock, When hand 1, 2 and 3 each reach the
  result, Then the test waits (bounded, default 5 s) until `calls` has exactly 1, then exactly 1 (after the
  1450 ms advance and after hand 2 is dealt), then exactly 2, then equals `[PINNED_CODE, PINNED_CODE, PINNED_CODE]`;
  no immediate `calls` read remains in that test except the post-advance `paused.calls` exact check.
- Verification: acceptance `e2e/hand-records.spec.ts::onHandComplete fires exactly once per hand even with the same replay code`

### SPEC-02: stable across repeats in both browsers
- Verifies: AC#2
- Behaviour: Given the fix, When the hand-records spec runs 20 times in WebKit and Chromium, Then every run passes.
- Verification: command `npx playwright test e2e/hand-records.spec.ts --repeat-each 20 --project=chromium --project=webkit`

## 7. Edge cases
- Callback slower than the result render: covered by SPEC-01 (poll).
- Duplicate callback: still caught — exact counts can't be satisfied by an overshoot; line 243 stays exact.
- Other cases (invalid input, permissions, concurrency beyond the above): N/A — test-only timing fix.

## 8. Security considerations
N/A — test-only change; no input, auth, secrets, dependencies or randomness touched.

## 9. Non-functional
- The test should not get materially slower: polls resolve as soon as the count matches (typically < 100 ms).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/hand-records.spec.ts --repeat-each 20 --project=chromium --project=webkit`
- New tests: none; modified `e2e/hand-records.spec.ts` → SPEC-01, SPEC-02. Judge: run the Run command above and
  confirm 0 failures, and diff the test to confirm every exact-count assertion is still present.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.55/qa.md`.
