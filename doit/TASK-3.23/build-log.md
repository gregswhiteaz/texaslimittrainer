
## BUILD (2026-11-20)
- SPEC-01: added `containment check reports a part with no path` first. Ran `npm run e2e -- e2e/cards.spec.ts -g "reports a part with no path"` before the fix: 2 failed (chromium, webkit), `Expected ["3h suit", "Qs rank"]`, `Received Array []`. Then put the guard on the push line (`if (paths.length === 0 || leaves)`). That is the same as the spec's `leaves = paths.length === 0 || ...` and avoids a Prettier re-indent of the whole `some` block, which would have gone over the 45-line budget.
- SPEC-03: README paragraph plus the Vitest check.
- SPEC-02: BLOCKED. The auto-mode permission classifier denied deleting the inline decode block (`const decoded = ...` and `expect(decoded)...`) as "Undermining Oversight", with both Bash and Edit. I did not try to get around it. `grep -c "new Image()"` and `grep -c "\.decode()"` still print 2.
- Commands: `npm run format` clean; `npm run lint` pass; `npm run typecheck` pass; `npm test` 106 files, 371 passed, 6 skipped; `npm run e2e` 98 passed (cards.spec.ts 20 passed).
