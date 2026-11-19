## BUILD — 2026-11-18

- Wrote `tools/ci/apt-lock.js` per spec §5 (parseProcLocks, devParts, findHeldLock, waitForAptLocks exported; CLI mirrors retry.js's parseArgs/UsageError/main-guard layout). `tools/ci/retry.js` untouched.
- Wired the wrapper into both install run lines in `ci.yml`; one-line edit of the expected run string in `tests/ci/workflow.test.ts` plus the new SPEC-04 test. No other assertion changed.
- SPEC-10 real-lock test: `flock` is spawned detached and killed as a process group, because its `sleep` child inherits the flock'd descriptor and would otherwise keep the lock after `flock` itself dies.
- README sentence extended (SPEC-12).
- `npm run typecheck`: pass. `npm run lint`: pass (after `npm run format`-equivalent prettier write on the touched files).
- `npx vitest run tests/ci`: 5 files, 31 passed, 2 skipped (the Linux-CI-only sudo and real-lock tests; this machine is macOS).
- Manual judge scenario (spec §10) on macOS: waiting line, then `::error::apt lock <tmp>/l is still held by process 4242 after 3 s; not running echo hi`, exit 1; with the line removed, `hi`, exit 0. Run command prints the `/proc/locks not found` note then `installed`.
- Scope: ~560 changed lines vs budget 400 (warn band; formatting of the CLI and tests). Full `npm test` left to the stop-hook gate.
- SPEC-11 (green branch CI run) depends on the orchestrator's push.
