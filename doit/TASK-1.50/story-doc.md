# TASK-1.50: Cut CI wall time with parallel jobs, single coverage run and change-gated tooling tests

Status: awaiting judge (story doc written before the judge) · Epic: TASK-1 · Requirements: n/a (CI infrastructure) · Branch: doit/TASK-1.50

## What was asked
CI was one serial job: 19 min 26 s on main #164. Split it into parallel jobs, instrument coverage once, run the process-spawning tooling tests only when tooling changes (and on a schedule), put a 30-minute limit on every job, prove it with live runs and a deliberate-failure drill. Hard limit 9 min wall (half of #164), target 5-6 min. Spec: doit/TASK-1.50/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The 30-min job limit applies to every job in `ci.yml`, `visual.yml` (was 5 and 15) and `million.yml` (already 30) | yes | AC#5 says "the CI workflows" | Revert `visual.yml` values and its test |
| A-2 | Wall time is proven on the final green branch run, not on main (not measurable before merge); first main run is recorded after merge | yes | Branch run is an upper bound (tooling runs too) | Hold task open until merge |
| A-3 | The tooling trigger list is wider than "tools/, config files, .github/": also tooling test folders, `tests/support/**`, `README.md`, Linux card baselines, `*.perf.test.*`, `src/engine/bot-random.ts`, and (added in review) `index.html` | yes | Tooling tests read or run each of these; SPEC-09 guards the list | Trim `TOOLING_DIRS`/`TOOLING_FILES` |
| A-4 | `tests/support/**` tests are not gated; they fall into unit or sweeps by name | yes | AC#4 names only CI scripts, git helpers, lint/toolchain config | Add to tooling group |
| A-5 | If the change base can't be determined, the detector decides `tooling=true` and prints a `::warning::` | yes | Never skip tooling tests on uncertainty | Fail the `changes` job instead |
| A-6 | First push of a branch (`before` = 40 zeros) diffs against `merge-base origin/<default> <head>` | yes | Otherwise every new `doit/*` branch runs tooling | Always run on new branches |
| A-7 | `e2e` is the first job in the file | yes | Locked `apt-network.test.ts` checks step order by text position, so it needs no edit | Edit that locked test |
| A-8 | Sweep shards use `fail-fast: false` | yes | One failing shard must not cancel the other (visible in the drill) | Default fail-fast |
| A-9 | AC#1's record is spec §3.1, committed before any CI change, copied verbatim below | yes | Spec commit precedes build commits | Separate docs file |
| A-10 | vitest worker count left at default | yes | Out of scope; changes test timing | `--maxWorkers=2` in CI |

## Clarifications and decisions
Q-1 to Q-6 were all answered by the user with the recommended option (see doit/TASK-1.50/qa.md).
- Q-1 / D-2: coverage runs once, over the unit group only (92.0% global, 97.8% headless lines measured; full suite 97.4%). Thresholds unchanged (70% global, 90% headless).
- Q-2 / D-1: three groups via npm scripts, 2 sweep shards.
- Q-3 / D-3: change detection by an in-repo script, no new third-party action (rejected `dorny/paths-filter`, separate `tooling.yml`).
- Q-4 / D-4: daily 06:00 UTC tooling-only schedule.
- Q-5 / D-5: no aggregate job; six required contexts listed in README.
- Q-6 / D-6: user approved cross-story edits to four locked tests (below).
- D-7: `npm test` stays `vitest run --coverage` (full suite) because locked TASK-1.1 tests pin it.

## What was built
**Job layout (check names)**, all `ubuntu-24.04`, `timeout-minutes: 30`, action pins unchanged:
| id | Check name | Runs |
|---|---|---|
| `e2e` | `E2E (Chromium and WebKit)` | apt/Playwright steps (verbatim), `npm run e2e` |
| `checks` | `Lint, typecheck, build and playtest` | both audits, lint, typecheck, build, playtest |
| `coverage` | `Unit tests with coverage` | `npm run test:unit` |
| `sweeps` | `Sweep tests (shard N of 2)` | `npm run test:sweeps -- --shard=N/2`, matrix, `fail-fast: false` |
| `changes` | `Detect tooling changes` | `tools/ci/tooling-changed.js` (checkout `fetch-depth: 0`) |
| `tooling` | `Tooling tests` | `needs: changes`, `if: needs.changes.outputs.tooling == 'true'`; Bound apt network timeouts first, then `npm run test:tooling` |

Only `tooling` has `needs:`; the rest start in parallel.

**Triggers.** `push`, `pull_request`, and `schedule` (`0 6 * * *`, daily 06:00 UTC, default branch only). On schedule only `changes` and `tooling` run; the other four jobs have `if: github.event_name != 'schedule'`.

**What triggers tooling tests.** `tools/`, `.github/`, `tests/{ci,git,toolchain,support}/`, Linux card baselines (`e2e/cards.visual.spec.ts-snapshots/`), `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`, `playwright.config.ts`, `.prettierrc.json`, `.prettierignore`, `.nvmrc`, `README.md`, `index.html` (added in review), `src/engine/bot-random.ts`, and any `*.perf.test.*`. Schedule and `workflow_dispatch` always run. Unknown event, invalid or missing SHA, unreachable base, or git error: `tooling=true` with a `::warning::`. Matched paths are listed indented by two spaces so none can start a workflow command.

**Coverage once.** `--coverage` appears only in `test:unit` (unit group: everything not sweeps or tooling). Sweeps and tooling run without instrumentation. Thresholds unchanged in `vite.config.ts`.

**New npm scripts** (`package.json`): `test:unit`, `test:sweeps`, `test:tooling` (partition 162 files = 46 + 86 + 30). `npm test` unchanged: everything, with coverage.

**Files.** `.github/workflows/ci.yml` (rewrite), `visual.yml` (timeouts), `package.json`, `tools/ci/tooling-changed.js` (new), `README.md` (CI + branch protection), `tests/support/sandbox.ts` (`'test:unit'`), new tests `tests/ci/ci-jobs.acceptance.test.ts`, `tests/ci/tooling-changed.test.ts`, `tests/toolchain/test-groups.acceptance.test.ts`.

**Locked-test edits approved by the user (Q-6/D-6; unlocked under TASK-1.7, 1.39, 1.24, 1.17).** Each keeps or tightens its intent; only the job timeout loosens (20 to 30, required by AC#5).
- `tests/ci/workflow.test.ts`: per-job exact command lists, exact `if:` list, Playtest last step of `checks`, every job timeout 30.
- `tests/ci/apt-archives-cache.test.ts`: job timeout `'30'`.
- `tests/ci/branch-protection.acceptance.test.ts`: exact six job ids; README lists the six contexts.
- `tests/ci/million-workflow.acceptance.test.ts`: `ci.yml` checkout/setup-node pins identical and equal to million.yml's.
- Also, own new test `test-groups.acceptance` was strengthened after run #165 (see below).

## How it was verified
| SPEC | Covers | Verification | Result |
|---|---|---|---|
| 01 | CI profile recorded | spec commit precedes CI changes; section below | recorded |
| 02, 07, 11 | job layout, gating wiring, 30-min limits | `tests/ci/ci-jobs.acceptance.test.ts` | pass |
| 03, 05 | partition; coverage only in `test:unit`, thresholds enforced | `tests/toolchain/test-groups.acceptance.test.ts` | pass |
| 08, 09 | detector decisions; trigger list covers every file tooling tests read | `tests/ci/tooling-changed.test.ts` | pass |
| 13, 14 | locked tests and README | edited locked tests, README review | pass (judge to confirm) |
| 04, 06, 10, 12 | live runs | below | pass |

Local: `npm test` 164 files passed, 1 skipped; 575 tests passed, 8 skipped; lint, typecheck, format clean. Gate runs: 6.

**Live evidence** (doit/TASK-1.50/build-log.md "Live runs"):
- #165 FAIL: the tooling job failed because GitHub colours vitest output, so `toContain('Coverage enabled with v8')` missed. Fixed by stripping ANSI (`stripVTControlCharacters`) in the sandbox output checks.
- #166 GREEN, 212 s wall (unit 73 s, shard 1 136 s, shard 2 107 s, tooling 108 s, e2e 210 s, checks 46 s, detect 20 s).
- #167 (doit-only change): detector printed `tooling=false`, `Tooling tests` skipped, other six jobs success, 229 s.
- #168 drill: exactly Unit, Sweep 1/2, Sweep 2/2 and Tooling failed, each "1 failed" naming only its own drill test; Lint/typecheck/build/playtest, E2E and Detect succeeded; nothing skipped or cancelled.
- #169 drill reverted: green, wall 233 s versus CI #164 about 1,172 s, roughly 5x faster. Inside the 540 s hard limit and under the 300-360 s target. (Tooling ran, as the branch touches `tools/` and `.github/`, so this is the worst case.)

Judge: see doit/TASK-1.50/judge/.

## Billed minutes and the Actions budget
Billed minutes round each job up to a whole minute. Spec estimate: before about 20 per run; after about 15 (tooling gated off) or about 17 (tooling on); schedule about 3 per night (about 90 per month). Rounding the job times of #166 gives about 15 with tooling, so the estimate looks right (my calculation, not a billing figure). Concern: `ci.yml` used about 2,680 wall-minutes over 164 runs since 2026-11-18, far above the 2,000 min/month Free-plan allowance. This task cuts minutes per run, not the number of runs. Billing could not be read (token lacks the `user` scope). The user was told at Q-4.

## Review
Round 1: 0 blocking. Fixed: security MINOR (a file named `::error::x.perf.test.ts` could inject a workflow command through the listing; now indented, with a test) and two code MINORs (`index.html` not a tooling path though the build tests use it; `listFiles` silently ignoring non-path `vitest list` lines).

### Non-blocking review notes
- NIT (security): `actions/checkout` keeps default `persist-credentials` (matches existing jobs; token is read-only).
- NIT (code): the "... and N more" line for the matched-paths listing.
Both not tracked (infra, below the value bar).

## How to try it
- `npm run test:unit`, `npm run test:sweeps -- --shard=1/2`, `npm run test:tooling`, `npm test` (all).
- `node tools/ci/tooling-changed.js --event push --base "$(git rev-parse HEAD~1)" --head "$(git rev-parse HEAD)" --default-branch main`

## Run metrics
Questions 6 · assumptions 10 · review rounds 1 · judge rounds pending · gate runs 6 · escalations 0 · changed lines about 1,124 at gate #1 (budget 1,000, warn; 13 files).

## Known limitations and follow-ups
- [trainer-infra, none] Branch protection is not enforced (403 on private Free plan); README lists the six contexts for manual setup.
- Post-merge (orchestrator appends): first main run wall time (open a task if over 540 s) and first nightly 06:00 UTC run (only `Detect tooling changes` + `Tooling tests`).
- [infra] Actions budget: runs per month are still the main cost driver; would plausibly cause real failure (runs blocked when the allowance is exhausted). Owner: none yet; needs billing read via `gh auth refresh -s user`.
- Not tracked (infra, below the value bar): `persist-credentials` default; "... and N more" line.

## Lessons for the factory (proposals — not applied)
- Spec said tests assert text in sandbox/vitest output; add a rule "strip ANSI before asserting on tool output, since CI sets colour" (cost run #165, one wasted live run).
- Gate #1 flagged 1,124 lines against a 1,000 budget; the budget estimate should count new test files more generously for CI stories.

## CI profile (before)

_Copied verbatim from spec §3.1 (SPEC-01, A-9); recorded before any CI change._

Sources:
- `gh run view 44977960174 --log`: main CI #164, 2026-11-22, the per-test durations of the `npm test` step summed per file.
- Local runs on a 14-core Mac: `npx vitest run --reporter=verbose` with `--coverage`, then with `--coverage.enabled=false`.

**Step times for #164.**
- Job: 19 min 26 s (run created → updated: 1,172 s).
- Test step: 869 s (vitest reports 868.6 s; 161 files passed, 1 skipped).
- E2E: 210 s.
- Setup (checkout, setup-node, `npm ci`): 13 s.
- Lint: 20 s. Typecheck: 9 s. Build: 1 s. Playtest: 3 s.
- Playwright and apt steps: ~39 s.

**Summed per-file test time on CI #164: 805 s.**

| Group | Files | CI s (with coverage) | Share |
|---|---|---|---|
| Bot/engine/playtest sweeps (`tests/{bots,engine,playtest}`) | — | 550 | 68% |
| Process-spawning tooling tests (`tests/{ci,git,toolchain}`) | 30 | 97 | 12% |
| Everything else (advice, ui, table, support, src) | — | 158 | 20% |

**Top files on CI #164 (s, with coverage).**

| File | s |
|---|---|
| `bots/tag-mixing.acceptance` | 131.2 |
| `bots/calling-station.acceptance` | 56.8 |
| `bots/tag.acceptance` | 37.8 |
| `engine/bet-cap.acceptance` | 36.1 |
| `advice/equity.perf` | 36.1 |
| `bots/calling-station` | 34.2 |
| `bots/maniac.acceptance` | 29.9 |
| `engine/side-pots.property` | 29.6 |
| `advice/postflop.perf` | 27.2 |
| `ci/speed-limits.acceptance` | 18.3 |
| `playtest/million.acceptance` | 18.3 |
| `advice/postflop.acceptance` | 17.0 |
| `support/sandbox-timeout.acceptance` | 16.1 |
| `engine/hand-evaluator.perf` | 15.1 |
| `playtest/games.acceptance` | 14.9 |
| `toolchain/boundary` | 14.7 |

**Coverage instrumentation share (local, summed per-file).**
- 353 s with coverage vs 187 s without, so about **47%** of test time is coverage.
- Process CPU: 354 s user vs 182 s.
- Sweeps: 221 → 94 s, a 2.4× slowdown from coverage (`tag-mixing` 4.3×).
- Tooling: 60 → 59 s. Coverage doesn't touch these, because they spawn child processes.

**Projected CI cost after the split (no coverage on sweeps).**
- Sweeps: ≈ 258 s.
- 2 vitest shards: 138 s and 120 s. With 3 shards: 103, 97 and 58 s.
- Unit group with coverage: ≈ 75 s.
- Tooling: ≈ 97 s.
- The critical path becomes e2e at ≈ 4.5 min.

**Coverage on the unit group alone (46 files, measured).**
- Lines: 92.02% global and 97.84% for the headless glob.
- Thresholds: 70% global and 90% headless. Both pass with margin.
- The full suite measures 97.35%.

**Actions usage.**
- `ci.yml`: 164 runs since 2026-11-18, ≈ 2,680 wall-minutes.
- `visual.yml`: 84 runs, ≈ 114 min.
- Billing could not be read: the token lacks the `user` scope.
- See "Scope concerns" in §2.
