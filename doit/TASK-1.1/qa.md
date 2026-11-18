# Q&A — TASK-1.1

## Q-1 — D-2 Supporting third-party dependencies
- Asked: approve @vitejs/plugin-react, @vitest/coverage-v8, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-config-prettier, globals, @types/react, @types/react-dom, @types/node (exact pins)?
- Answer: Approve.

## Q-2 — D-3 npm audit advisory GHSA-fc5q-39xc-vjpf (picomatch ReDoS via dev tooling)
- Options: Accept dev-only (recommended) | Force-fix (downgrade Vitest) | Drop typescript-eslint.
- Answer: **Force-fix (downgrade Vitest)**. Pin Vitest (and @vitest/coverage-v8 to the matching version) to the 3.x line that `npm audit fix --force` selects, keep typescript-eslint, and verify `npm audit` reports 0 high/critical advisories afterwards. If the downgrade alone does not clear the advisory (it also arrives via typescript-eslint/tinyglobby/fdir), use npm `overrides` to a patched picomatch if one exists; if no clean resolution exists, report back rather than dropping tools.

## Q-3 — Audit rule after force-fix proved impossible
- Evidence: no patched picomatch exists (advisory covers <=4.0.7 = latest); Vite itself depends on it; `npm audit fix --force` (Vitest 3.1.4) yields 18 advisories incl. 3 critical.
- Options: Shipped deps clean + no critical anywhere (recommended) | Shipped deps clean only | Block the story.
- Answer: **Shipped deps clean + no critical anywhere.** Keep Vitest 5.1.0. Enforce `npm audit --omit=dev --audit-level=high` exits 0 AND all-deps `npm audit --audit-level=critical` exits 0. Dev-only high picomatch advisory tolerated until a fix is published. Supersedes Q-2.
