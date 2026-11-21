# Spec: TASK-3.25 — Make the card-back logo check wait for the image before judging it

Status: READY (approved 2026-11-21)
Task: TASK-3.25 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: n/a (follow-up from TASK-1.17 judge J-2-01) · Dream: limit-holdem-trainer

## 1. Summary
`e2e/cards.spec.ts::logo check fails when the logo is hidden or does not load` flakes on WebKit in CI. The
broken-image mutant reports `['missing']` instead of `['not decoded']`. The cause is in test support, not
product code. `openCardGallery` passes an `async` predicate to `page.waitForFunction`. Playwright checks the
predicate's return value for truthiness only once, and a Promise is always truthy, so the predicate runs once
and never polls. If React has not committed the gallery at that moment, the wait returns at once. The mutant's
`?.setAttribute` then does nothing and `logoProblems` finds no logo. This task makes `openCardGallery` really
wait for the logo and its decode, makes the mutant fail loudly when the logo is absent, and adds a test that
reproduces the late-render race every time.

## 2. Scope
- In scope:
  - `e2e/support/card-gallery-bundle.ts` `openCardGallery`: wait for the logo element with a polling locator wait,
    then decode its `href` in a separately awaited evaluate. Throw a clear error if the decode is not 512x512.
  - `e2e/cards.spec.ts` mutation test (strengthen-only, locked file): before mutating, assert there is exactly
    one logo; mutate through a locator (no `?.`); assert the attribute now holds the mutant value; then run the
    existing `logoProblems` assertion unchanged.
  - New unlocked e2e file `e2e/card-gallery-open.spec.ts` with regression tests for `openCardGallery`: a gallery
    that renders late, and a logo that fails to decode.
  - One-off AC#2 check: 50 in a row per browser locally, plus one green CI run.
- Not doing:
  - Any change to `src/` (the `CardBack` component is static and correct, `src/ui/cards/PlayingCard.tsx:102-136`).
  - Changing `logoProblems` or any existing assertion or expected problem list in `e2e/cards.spec.ts`.
  - Rewriting the other `?.` mutations in `e2e/cards.spec.ts` (colour, containment). If those no-op, their
    tests fail rather than pass, and the `openCardGallery` fix removes the shared race.
  - Adding a permanent 50-repeat or slow test, retries, or `waitForTimeout` sleeps.
  - Changing `playwright.config.ts` or the CI workflow.
- Scope budget: files=3, lines=70

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `openCardGallery` treats "logo element attached and its href decodes to 512x512" as "gallery rendered". It does not separately wait for the 104 faces. | yes | The gallery is one synchronous `createRoot().render` with no Suspense or lazy parts (`e2e/support/card-gallery.tsx:61-67`), so the whole tree commits at once. When the logo exists, every face exists too. | Also wait for `svg[data-card]` count 105 |
| A-2 | The regression tests go in a new file `e2e/card-gallery-open.spec.ts`, not in the locked `e2e/cards.spec.ts`. | yes | This keeps the locked-file edit to the minimum that AC#1 requires. | Add them to `e2e/cards.spec.ts` |
| A-3 | The late render is simulated by wrapping the real bundle in `setTimeout(() => { <bundle> }, 500)`. | yes | This makes the CI race happen every time in both browsers: a 500 ms delay always beats the single predicate check. It runs the real gallery code. | CPU throttling (Chromium-only, non-deterministic) |
| A-4 | AC#2's "50 times in a row" is run with `--repeat-each 50 --workers 1`, once per browser project. It is a one-off command whose output goes in the build log, not a permanent test. | yes | Standing rule: speed or scale checks are not part of every push. `--workers 1` makes the 50 runs sequential, so "in a row" is literal. | Parallel workers; a slow-group test |

## 3. Current system
- `e2e/support/card-gallery-bundle.ts:30-41` `openCardGallery`: `setContent`, `addScriptTag({content: bundle})`,
  then `page.waitForFunction(async () => …)`.
- Playwright 1.65.1 `waitForFunction` (`node_modules/playwright-core/lib/coreBundle.js:26048-26058`): `const success
  = predicate(); if (success) { fulfill(success); return; }`. An `async` predicate returns a Promise, which is
  truthy, so polling stops after the first call. The wait then resolves with the Promise's value, even `false`.
- Reproduced (scratch scripts, not committed):
  - `page.waitForFunction(async () => document.querySelector('#never') !== null)` resolves with `false` after
    14 ms (WebKit) and 9 ms (Chromium). The same happens for any `async` predicate.
  - With the real gallery bundle, 30 loads per browser: the wait returned `false` (logo not rendered yet when
    checked) in 10/30 WebKit loads and 0/30 Chromium loads. Locally React commits before the next Playwright
    round trip, so the test still passes. On slower CI WebKit runners, both the mutant `evaluate` and
    `logoProblems` can run before the commit, which gives `['missing']`. This matches CI runs 44892551075 and
    44893582074.
- `e2e/support/card-gallery.tsx:61-67`: the gallery renders through `createRoot(root).render(<StrictMode>…)`.
  React schedules this render in a later task, so `addScriptTag` returns before the DOM exists.
- `src/ui/cards/PlayingCard.tsx:125-133`: `<image data-part="logo" href={logoUrl} …/>` is static: no state, no
  `onError`, never removed. This rules out a product bug.
- `e2e/cards.spec.ts:79-98` `logoProblems`: looks up the logo, then checks visibility and box size, and decodes
  `href` with `new Image().decode()` inside an awaited `page.evaluate`. The decode settles on success or failure,
  so judging already waits for it. The only gap is that the logo may not exist yet.
- `e2e/cards.spec.ts:215-232`: the mutation test, with three mutants and `?.setAttribute` at `:226-227`.
- Locks: `e2e/cards.spec.ts` is in `locked_tests` of `doit/TASK-3.5/state.json`, `doit/TASK-3.20/state.json` and
  `doit/TASK-3.23/state.json`. `e2e/support/card-gallery-bundle.ts` is not locked.
- Tests: `npm run e2e` runs Playwright on Chromium and WebKit (`playwright.config.ts:13-16`), with `retries: 0`
  and `fullyParallel`. `tsconfig.json:23` includes `e2e`, so the new code is typechecked and linted.
- Existing code to reuse:
  - `e2e/support/card-gallery-bundle.ts` `buildCardGallery` → builds the real bundle that the new tests wrap.
  - `e2e/cards.spec.ts:205-210` → the locator `evaluate` + `new Image().decode()` pattern, reused inside
    `openCardGallery`.
  - `e2e/cards.spec.ts:17-19` → `beforeAll` bundle build pattern for the new spec file.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Fix the root cause in `openCardGallery`: `locator.waitFor({state:'attached'})` (real polling, strict single match), then an awaited `locator.evaluate` that decodes `href`. Throw `card-back logo decoded at <w>x<h>, expected 512x512` on a size mismatch. If the decode is rejected, the error propagates. | Keep `waitForFunction` but make the predicate synchronous, with a separate decode step; add a sleep; add retries | The locator wait polls and fails on timeout. It also fails if more than one logo matches. A sleep or retry would hide the bug. | no | n/a |
| D-2 | Make a strengthen-only edit to the locked `e2e/cards.spec.ts` (owners TASK-3.5, TASK-3.20, TASK-3.23) in the logo mutation test only. Add `await expect(logo).toHaveCount(1)` before mutating. Replace `document.querySelector(...)?.setAttribute` with `logo.evaluate((node, [a, t]) => node.setAttribute(a, t), [name, value])`. Add `await expect(logo).toHaveAttribute(name, value)` after mutating. The mutant table and the `logoProblems` assertion stay unchanged. The orchestrator runs `doit.py unlock` for each owner with reason "TASK-3.25 AC#1 strengthen-only". | Leave the locked file alone and rely on the `openCardGallery` fix (AC#1 explicitly requires no silent `?.` no-op) | AC#1 names this behaviour, and only this file contains it | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `e2e/support/card-gallery-bundle.ts` — `openCardGallery` really waits for the logo and its decode (D-1).
- `e2e/cards.spec.ts` — the mutation test asserts the logo exists, mutates without `?.`, and confirms the attribute changed (D-2).
- `e2e/card-gallery-open.spec.ts` — new regression tests for `openCardGallery` (SPEC-01, SPEC-02).

### Components, interfaces and data
- `openCardGallery(page: Page, bundle: string): Promise<void>` — the signature is unchanged. Postcondition on resolve:
  exactly one `[data-testid="card-back"] image[data-part="logo"]` is attached, and its `href` decodes to 512x512.
  Rejects if:
  - the logo never attaches within the action/test timeout (Playwright `TimeoutError`);
  - more than one logo matches (strict-mode error);
  - the decode is rejected (the evaluate error propagates);
  - the decode gives a size other than 512x512 (`Error('card-back logo decoded at <w>x<h>, expected 512x512')`).
- Selector constant: `'[data-testid="card-back"] image[data-part="logo"]'`. This is the same string as
  `e2e/cards.spec.ts:81`.

### Rules and algorithms
- `openCardGallery`: `setContent(GALLERY_HTML)` → `addScriptTag({content: bundle})` → `logo.waitFor({state:'attached'})`
  → `size = await logo.evaluate(async node => { probe = new Image(); probe.src = href ?? ''; await probe.decode();
  return {width, height} })` → throw unless `512x512`. No `async` predicate is passed to `waitForFunction`.
- Mutation test, per mutant `[name, value, problems]`: `openCardGallery` → `expect(logo).toHaveCount(1)` →
  `logo.evaluate(setAttribute(name, value))` → `expect(logo).toHaveAttribute(name, value)` →
  `expect(await logoProblems(page), \`${name}=${value}\`).toEqual(problems)`. The expected lists are unchanged:
  `opacity=0` gives `['hidden']`, `style=display:none` gives `['hidden','empty box']`, and
  `href=data:image/jpeg;base64,AAAA` gives `['not decoded']`.

### Error handling and configuration
- No new configuration. Errors come from Playwright (timeout, strict mode) or the one explicit size error above.

## 6. Behaviour specification

### SPEC-01: the gallery opener waits for a late render
- Verifies: AC#1
- Behaviour: Given the real gallery bundle wrapped so that it starts 500 ms after injection
  (`setTimeout(() => {<bundle>\n}, 500)`), When `openCardGallery(page, delayedBundle)` resolves, Then an
  immediate `page.evaluate` finds exactly one `[data-testid="card-back"] image[data-part="logo"]`, and decoding
  its `href` gives `{width: 512, height: 512}`. This passes in both Chromium and WebKit. With the old
  `openCardGallery`, the count is 0.
- Verification: acceptance `e2e/card-gallery-open.spec.ts::openCardGallery waits for a gallery that renders late`

### SPEC-02: the gallery opener fails loudly on a logo that does not decode
- Verifies: AC#1
- Behaviour: Given a script that renders `<section data-testid="card-back"><svg><image data-part="logo"
  href="data:image/jpeg;base64,AAAA"/></svg></section>` into `#root`, When `openCardGallery(page, script)` runs,
  Then it rejects. It does not resolve.
- Verification: acceptance `e2e/card-gallery-open.spec.ts::openCardGallery rejects a logo that does not decode`

### SPEC-03: the logo mutation test mutates a logo it has proven exists
- Verifies: AC#1, AC#2
- Behaviour: Given the gallery is open, When each of the three mutants is applied, Then the test has already
  asserted exactly one logo element exists. The mutation goes through a locator, not `?.`. The attribute is
  asserted to equal the mutant value. Only then is `logoProblems` compared to the unchanged expected lists
  (`['hidden']`, `['hidden','empty box']`, `['not decoded']`). The broken-image case is judged only after
  `probe.decode()` has settled, inside the awaited `logoProblems` evaluate.
- Verification: acceptance `e2e/cards.spec.ts::logo check fails when the logo is hidden or does not load`

### SPEC-04: stable across 50 consecutive runs per browser and one CI run
- Verifies: AC#2
- Behaviour: Given the fix, When the mutation test runs 50 times in a row in each browser, Then all 100 runs
  pass, and the GitHub Actions `CI` run for the pushed branch is green, including WebKit e2e.
- Verification: command `npx playwright test e2e/cards.spec.ts -g "logo check fails when the logo is hidden or does not load" --repeat-each 50 --workers 1 --project chromium --project webkit` (expect `100 passed`), then `gh run list --branch doit/TASK-3.25 --workflow CI --limit 1` shows `completed success`. Record both outputs in the build log.

## 7. Edge cases
- Gallery not rendered when the wait starts: SPEC-01.
- Logo present but its image fails to decode: SPEC-02.
- Logo missing when a mutant is applied: SPEC-03 (`toHaveCount(1)` fails with a clear message, not `['missing']`).
- More than one logo: strict-mode failure in `openCardGallery` (D-1). The current gallery has one, so this is a guard and has no test.
- Mutation silently ignored by the browser: SPEC-03 (`toHaveAttribute`).
- Interruption, permissions, concurrency across workers: N/A. Each test has its own page.

## 8. Security considerations
- Test-only code, with no new trust boundary, secrets, dependencies or randomness. N/A.

## 9. Non-functional
- `openCardGallery` adds at most one extra round trip per call (about 10 ms). The new spec file loads the gallery
  twice per browser (the first load includes a 500 ms delay), which adds about 2 s to `npm run e2e`.
- The 50x repeat is a one-off command (SPEC-04), not part of `npm run e2e` or CI.

## 10. Test plan
- Test command: `npm test && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/cards.spec.ts e2e/card-gallery-open.spec.ts`
- New tests (path → SPEC ids):
  - `e2e/card-gallery-open.spec.ts::openCardGallery waits for a gallery that renders late` → SPEC-01
  - `e2e/card-gallery-open.spec.ts::openCardGallery rejects a logo that does not decode` → SPEC-02
  - `e2e/cards.spec.ts::logo check fails when the logo is hidden or does not load` (strengthened) → SPEC-03
- Judge scenario:
  1. Run `npm run e2e -- e2e/cards.spec.ts e2e/card-gallery-open.spec.ts`. Everything should pass in both browsers.
  2. Temporarily restore the old `async` `waitForFunction` in `openCardGallery` and confirm SPEC-01 fails in both
     browsers (logo count 0). Then restore the fix.
  3. Run the SPEC-04 command and check `100 passed`. Check that the branch's CI run is green.
  4. Diff `e2e/cards.spec.ts`: only additions, plus the one `?.setAttribute` call replaced by `logo.evaluate`.
     The mutant table and the `logoProblems` expectation should be byte-identical.

## 11. Open questions
- None. Q-1 was answered by the user on 2026-11-21 with (a): approve the strengthen-only edit D-2 to the locked `e2e/cards.spec.ts`. Unlocks are recorded under TASK-3.5, TASK-3.20 and TASK-3.23.

## 12. Clarifications log
See `doit/TASK-3.25/qa.md`.
