# TASK-3.25 changes

- `e2e/support/card-gallery-bundle.ts` — `openCardGallery` now waits for the logo with a polling `locator.waitFor({state:'attached'})`, then decodes its `href` in an awaited `locator.evaluate` and throws unless 512x512 (D-1). Replaces the async `waitForFunction` predicate that never polled.
- `e2e/cards.spec.ts` — strengthen-only (D-2, Q-1): the logo mutation test asserts exactly one logo, mutates via `logo.evaluate` (no `?.` no-op), and asserts the attribute holds the mutant value. Mutant table and `logoProblems` expectation unchanged.
- `e2e/card-gallery-open.spec.ts` — new regression tests for `openCardGallery`: late-rendering gallery (SPEC-01) and undecodable logo (SPEC-02).

No new dependencies.
