---
id: doc-65
title: 'TASK-3.25: Make the card-back logo check wait for the image before judging it'
type: other
created_date: '2026-11-21T16:23:00Z'
updated_date: '2026-11-21T16:23:00Z'
---
# TASK-3.25: Make the card-back logo check wait for the image before judging it

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: n/a (follow-up from TASK-1.17 judge J-2-01) · Branch: doit/TASK-3.25

## What was asked
`e2e/cards.spec.ts::logo check fails when the logo is hidden or does not load` flaked on WebKit in CI (broken-image mutant reported `['missing']` instead of `['not decoded']`). AC#1: the check must wait for the logo and its decode and must not silently no-op. AC#2: stable 50 times in a row per browser, plus a green CI run. Spec: doit/TASK-3.25/spec.md.

Root cause: a test-helper bug, not product code. `openCardGallery` passed an `async` predicate to `page.waitForFunction`. In Playwright 1.65.1 the predicate's return value is tested for truthiness once, and a Promise is always truthy, so the wait resolved once without polling. When React had not yet committed the gallery (10/30 WebKit loads, 0/30 Chromium), the mutant's `?.setAttribute` did nothing and `logoProblems` found no logo. `CardBack` (`src/ui/cards/PlayingCard.tsx`) is static and correct; `src/` is untouched.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Gallery rendered" means the logo is attached and decodes to 512x512; the 104 faces are not waited for separately. | yes | The gallery is one synchronous `createRoot().render`, so everything commits together. | Also wait for `svg[data-card]` count 105. |
| A-2 | Regression tests live in a new file `e2e/card-gallery-open.spec.ts`, not the locked `cards.spec.ts`. | yes | Keeps the locked-file edit minimal. | Move them into `cards.spec.ts`. |
| A-3 | A late render is simulated by wrapping the real bundle in `setTimeout(..., 500)`. | yes | A 500 ms delay always beats the single predicate check, in both browsers. | CPU throttling (Chromium-only, non-deterministic). |
| A-4 | "50 in a row" is a one-off `--repeat-each 50 --workers 1` run per browser, not a permanent test. | yes | Standing rule: scale checks are not part of every push. | Add a slow-group test. |

## Clarifications and decisions
- Q-1 (locked `e2e/cards.spec.ts`, owners TASK-3.5, TASK-3.20, TASK-3.23): answered by the user, (a) yes, make a strengthen-only edit. Unlocks recorded under those three tasks.
- D-1: fix at the root in `openCardGallery` with a polling `locator.waitFor({state:'attached'})` and an awaited decode; no sleeps or retries.
- D-2: strengthen-only edit to the mutation test (user-approved via Q-1).

## What was built
- `e2e/support/card-gallery-bundle.ts` — `openCardGallery` waits for the single logo (polling, strict), then decodes its `href` in an awaited `locator.evaluate` and throws `card-back logo decoded at WxH, expected 512x512` unless 512x512. A rejected decode propagates. Signature unchanged.
- `e2e/cards.spec.ts` — the logo mutation test asserts `toHaveCount(1)` before mutating, mutates via `logo.evaluate` (no `?.`), and asserts `toHaveAttribute(name, value)` after. The mutant table and the `logoProblems` expectation are unchanged.
- `e2e/card-gallery-open.spec.ts` (new) — SPEC-01 late-rendering gallery, SPEC-02 undecodable logo.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `card-gallery-open.spec.ts::waits for a gallery that renders late` | pass; fails on the old helper in both browsers (`count: 0`) | build-log.md |
| SPEC-02 | AC#1 | `card-gallery-open.spec.ts::rejects a logo that does not decode` | pass (see review note: does not discriminate old vs new) | build-log.md |
| SPEC-03 | AC#1, AC#2 | strengthened `cards.spec.ts` mutation test | pass | 24 passed (cards + card-gallery-open specs) |
| SPEC-04 | AC#2 | `--repeat-each 50 --workers 1`, chromium + webkit | 100 passed (1.2m) | build-log.md |
| SPEC-04 | AC#2 | branch CI run on 303f566 | in progress when written | Judge: see doit/TASK-3.25/judge/ |

Also: `npm test` 133 files passed / 1 skipped, 473 tests passed / 7 skipped; `npm run e2e` 104 passed; format, lint, typecheck clean. Judge: see doit/TASK-3.25/judge/.

## Review
Round 1: 0 blocking findings. Security: no findings. Reviewer confirmed there are no other `waitForFunction` calls in `e2e/`.

### Non-blocking review notes (deliberately not fixed)
- MINOR: SPEC-02 uses `rejects.toThrow()`, which accepts any error; the old helper also rejected (with `EncodingError`), so it cannot catch a regression. Test-harness only.
- NIT: the decode probe (`new Image(); decode()`) now exists in four places; accepted, since the test must check independently of the helper.

## How to try it
- `npm run e2e -- e2e/cards.spec.ts e2e/card-gallery-open.spec.ts`
- `npx playwright test e2e/cards.spec.ts -g "logo check fails when the logo is hidden or does not load" --repeat-each 50 --workers 1 --project chromium --project webkit`

## Run metrics
Questions 1 · assumptions logged 4 (in spec) · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed files 3 (e2e only).

## Known limitations and follow-ups
- None tracked.

### Not tracked (infra, below the value bar)
- [infra] SPEC-02 `rejects.toThrow()` matcher is loose (could be narrowed to the decode error). Test-harness; did not cause a failure.

## Lessons for the factory (proposals — not applied)
- Add a lint or review check for `async` predicates passed to Playwright `waitForFunction`; they silently never poll.
