# TASK-3.25 — Questions and answers

## Q-1 — Strengthen-only edit to the locked e2e/cards.spec.ts (owners TASK-3.5, TASK-3.20, TASK-3.23)?
Root cause: `openCardGallery` passes an async predicate to `page.waitForFunction`; Playwright 1.65.1 treats the returned
Promise as truthy and resolves without polling, so the gallery helper can return before the logo renders (10/30 WebKit
loads). The helper fix needs no approval. AC#1 also requires removing the silent `?.setAttribute` no-op in the locked
mutation test: add `expect(logo).toHaveCount(1)`, mutate via `logo.evaluate`, add `expect(logo).toHaveAttribute(name, value)`;
mutant table and expected problem lists byte-identical.
Options: (a) yes, strengthen it [Recommended]; (b) helper fix only, drop that part of AC#1.
**Answer: user — (a) yes, strengthen it** (2026-11-21). Unlocks recorded under TASK-3.5, TASK-3.20, TASK-3.23.
