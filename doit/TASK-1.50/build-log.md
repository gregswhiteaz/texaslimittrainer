## BUILD (TASK-1.50)
- Split `ci.yml` into six jobs (e2e, checks, coverage, sweeps ×2, changes, tooling) with the §5 names, steps, `if:` list, schedule and 30-min limits; e2e/apt step bodies and all pins copied verbatim. `visual.yml` job limits 5/15 → 30.
- Added `test:unit`, `test:sweeps`, `test:tooling` (spec text verbatim); `npm test` unchanged.
- Added `tools/ci/tooling-changed.js` (apt-archives.js pattern: header usage, `parseArgs`, `UsageError` exit 2, `safe()`, `pathToFileURL` main guard). Local run command: `node tools/ci/tooling-changed.js --event push --base <HEAD~1> --head <HEAD> --default-branch main` → `no tooling files among 16 changed file(s)` / `tooling=false`, exit 0; without `--event` → `tooling-changed: --event is required`, exit 2.
- New tests: `tests/ci/ci-jobs.acceptance.test.ts` (3), `tests/ci/tooling-changed.test.ts` (2), `tests/toolchain/test-groups.acceptance.test.ts` (2). Locked-test edits only in the four Q-6 files, as in spec §5; no other locked test needed changes (`apt-network.test.ts` holds because `e2e` is first, A-7).
- `ci-jobs` pin check: instead of hard-coding today's SHAs (which would break every Dependabot actions bump), it asserts each action has exactly one 40-hex pin in `ci.yml`, the cache/restore/save pins share one SHA, and checkout/setup-node/upload-artifact equal `visual.yml`'s (untouched). `git diff .github/workflows/ci.yml` shows no pin changed.
- `story-doc.md`: the builder hook doesn't allow writing it. The orchestrator must copy spec §3.1 verbatim into `doit/TASK-1.50/story-doc.md` under a "CI profile (before)" heading (SPEC-01, A-9).
- Local runs (14-core Mac):
  - `npm run test:unit` → `Coverage enabled with v8`, 46 files passed, 167 tests passed / 1 skipped, thresholds met.
  - `npm run test:sweeps -- --shard=1/2` → 42 passed / 1 skipped (43); `--shard=2/2` → 43 passed (43). 43 + 43 = 86 sweep files.
  - `vitest list --filesOnly` partition: unit 46 + sweeps 86 + tooling 30 = 162 (now 165: the 3 new files are all tooling, so unit 46, sweeps 86, tooling 33).
  - `npx vitest run tests/ci/ tests/git tests/toolchain/test-groups.acceptance.test.ts` → 23 files passed, 87 tests passed / 6 skipped.
  - `npm test` → 164 files passed / 1 skipped; 575 tests passed / 8 skipped; all files 97.35% lines.
  - `npm run lint`, `npm run typecheck` → clean. `npm run format` run.

### Live CI proofs: for the orchestrator (the builder may not push)
Push to `doit/TASK-1.50` in this order. Wait for each run to finish before the next push, because concurrency cancels in-progress runs. Record every run ID here.

Commands for each run:
- Jobs: `gh run view <id> --json createdAt,jobs --jq '{created: .createdAt, jobs: [.jobs[] | {name, conclusion, startedAt, completedAt}]}'`
- Wall time = max(`completedAt`) − `createdAt`, in seconds. The hard limit is ≤ 540 s; the target is 300–360 s.
- Overlap: every job except `Tooling tests` should have `startedAt` within 120 s of `createdAt`.

**Run A: build commit (SPEC-04, SPEC-06, SPEC-10b).** Commit the build (all files in changes.md) and push.
- Expect 7 job runs, all `success`:
  - `E2E (Chromium and WebKit)`
  - `Lint, typecheck, build and playtest`
  - `Unit tests with coverage`
  - `Sweep tests (shard 1 of 2)`
  - `Sweep tests (shard 2 of 2)`
  - `Detect tooling changes`: prints `N tooling file(s) changed` … `tooling=true`. The branch touches `.github/`. On a first push to a new branch, the diff is taken from the merge-base with `origin/main`.
  - `Tooling tests`: `success`, and its log lists `tests/ci/` files.
- Shard counts: `gh run view <id> --log | grep "Test Files"`. The two shard lines should sum to the sweeps total, 86 files. Locally it is 43 + 43, with one skipped in shard 1.
- Coverage: `gh run view <id> --log | grep "Coverage enabled"`. Expect exactly 1 line, under `Unit tests with coverage`, and none under the shards or tooling.
- Risk to watch: `Detect tooling changes` uses `setup-node` with `cache: npm` but never runs `npm ci`. If its post step fails on a missing `~/.npm` (a cold cache), report it. The spec mandates this step shape, so that would be a spec issue, not a silent fix.

**Run B: gated-off run (SPEC-10a).** Push a commit that touches only non-tooling paths. For example, commit only `doit/TASK-1.50/story-doc.md` and this build-log: `doit/` is not a tooling path.
- Expect `Detect tooling changes` to print `no tooling files among N changed file(s)` and `tooling=false`.
- Expect `Tooling tests` to conclude `skipped`.
- Expect the other 6 job runs to be `success`.

**Run C: drill (SPEC-12, AC#6).** Make one commit that flips exactly one assertion in each of these files:
- `tests/table/pace.test.ts`, e.g. the first `it('Rapid adds no wait before a bot acts')`. Unit group.
- `tests/engine/bet-cap.acceptance.test.ts`, one assertion. Shard 1: confirmed locally, since `--shard=1/2` ran it.
- `tests/playtest/heads-up.acceptance.test.ts`, one assertion. Shard 2: not in the local shard-1 output.
- `tests/ci/retry.test.ts`, e.g. `runs a succeeding command once without delay`. Tooling; touching `tests/ci/` turns tooling on.

What to expect:
- `failure`: `Unit tests with coverage`, `Sweep tests (shard 1 of 2)`, `Sweep tests (shard 2 of 2)`, `Tooling tests`.
- `success`: `Lint, typecheck, build and playtest`, `E2E (Chromium and WebKit)`, `Detect tooling changes`.
- No job is `skipped` or `cancelled`.
- `gh run view <id> --log-failed | grep -E "FAIL|failed"`: each failing job names only its own broken test, with `1 failed`.
- If CI places a sweep file in the other shard, pick a file that the run A shard log shows in the needed shard.

**Run D: revert (SPEC-12).** Only after run C has finished, push `git revert <drill>`.
- Expect all 7 job runs `success`. Tooling runs, because `tests/ci/` changed.
- This is the final green run for SPEC-04. Record its wall time against the 5–6 min target and the 540 s limit.

The drill commit edits locked test files and the revert restores them byte for byte, so `HEAD` matches the locked snapshot again. Run `doit.py test-integrity TASK-1.50` after the revert to confirm.

After merge (A-2): record the first `main` run's wall time in story-doc.md, and the first scheduled 06:00 UTC run (only `Detect tooling changes` + `Tooling tests`). Open a follow-up task if the main run is over 540 s.

- Gate build #1: PASS (1124 changed lines vs budget 1000: warn; 13 files).

## Live runs (orchestrator)
- Run A1 #165 (44983160212, c24fd6f): FAIL — Tooling tests: test-groups.acceptance `toContain('Coverage enabled with v8')` failed because GitHub Actions colours vitest output. Fixed (b968549): sandbox output checks use `stripVTControlCharacters` (own test unlocked, strengthen — the `not.toContain('ERROR: Coverage')` check is now meaningful under colour too). Wall 247 s.
- Run A2 #166 (44983750106, b968549): SUCCESS, all 7 jobs, wall 212 s (unit 73, shard1 136, shard2 107, tooling 108, e2e 210, checks 46, detect 20).
