# TASK-1.39: Recover dpkg and harden the remaining test timeouts

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up from TASK-1.23, doc-31) · Branch: doit/TASK-1.39

> **Correction to spec §8.** The spec says apt hash-checks `.deb` files that are cached in `/var/cache/apt/archives`. That is wrong. apt accepts a file already in that directory on name and size alone. It checks hashes only for files it downloads itself. The real safeguard is who can write the Actions cache. Saves are scoped to the ref that ran the job, so a fork PR or a feature branch cannot write the cache that `main` restores. The residual risk is persistence. Code already running in a job on `main`, such as a compromised npm dependency during tests or E2E, could plant a size-matched `.deb`. Later runs would then install it for up to about a month. The job already has passwordless sudo, so this gives no new privilege. Hardening follow-ups are listed below. Spec §8 itself was not edited.

## What was asked
Three acceptance criteria:
1. After a retry kills an apt attempt, the next attempt runs `sudo dpkg --configure -a` first, so an interrupted dpkg no longer fails the install.
2. `runInSandbox` kills the whole process group on timeout. A test uses a grandchild that ignores SIGTERM.
3. The Playwright system-dependency install finishes in its first attempt, within its step timeout, after main CI run #73 needed 3 attempts. The AC allows re-tuned timeouts or cached apt packages.

Spec: doit/TASK-1.39/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | dpkg recovery runs only when `/var/lib/dpkg/updates` has at least one entry. It runs `sudo -n dpkg --configure -a` once, after the lock wait and before the command, on every attempt. A missing directory means "not interrupted" | yes | A non-empty journal is the exact condition behind apt's "dpkg was interrupted" error. Healthy runs never call sudo, and the run lines in `ci.yml` stay unchanged | Run unconditionally on Linux, or add a retry.js hook (locked-test edit) |
| A-2 | If recovery fails or cannot start, print a `::warning::` and still run the command. The command's exit code is the wrapper's exit code | yes | The install may still succeed, and retry.js retries it if not | Fail the attempt with exit 1 |
| A-3 | `runInSandbox` stays synchronous. It `spawnSync`s a small CLI (`tests/support/process-group-cli.ts`) that calls the async `runProcessGroup` and prints JSON. Outer backstop is `timeoutMs + 15 s`, `maxBuffer` 64 MiB | yes | Making it async would edit about 25 call sites in 9 locked test files | Make it async and edit the locked callers |
| A-4 | New signature `runInSandbox(files, script, args?, { timeoutMs? })`, default 120 000 ms. `SandboxResult` gains `timedOut` | yes | The AC#2 test needs a short timeout. No caller compares the whole result object | A module-level setter |
| A-5 | The AC#2 test uses `timeoutMs: 15_000` | yes | Sandbox `npm test` takes 0.6–2.8 s on CI, so 15 s leaves a wide margin | 10 s or 30 s |
| A-6 | apt cache: path `~/.cache/apt-archives`, key `apt-archives-<os>-pw<version>-<YYYY-MM>`, restore-key prefix `apt-archives-<os>-pw<version>-`. None of the new steps has an `if:` | yes | Keeps the locked `if:` list unchanged. `apt-get` keeps downloaded archives by default, which the cold run confirmed (186 `.deb` files) | Key on Playwright version only, or a weekly stamp |

## Clarifications and decisions
- **Q-1 (AC#3 approach).** Run #89's attempt 1 needed 126 MB at about 85 KB/s, roughly 25 min against a 20-min job limit. Options were (a) cache the `.deb` archives (recommended), (b) a Playwright container image (parked, needs locked-test edits), or (c) longer timeouts only. **User answered (a).** Current retry, step and job limits stay unchanged.
- **Q-2 (locked-test edits for b/c).** Moot, because (a) needs none.
- **D-1.** Recovery lives in `apt-lock.js` (A-1).
- **D-2.** `runInSandbox` goes through a JSON CLI (A-3).
- **D-3.** AC#3 is solved by caching the archives. A cold cache on a slow mirror can still fail, and that was accepted.

## What was built
- `tools/ci/apt-lock.js`
  - New export `dpkgInterrupted(dir)` and option `--dpkg-updates <dir>` (default `/var/lib/dpkg/updates`).
  - After the lock wait and before the command, a non-empty journal triggers `sudo -n dpkg --configure -a`.
  - If the lock is still held, the existing `::error::` path runs and no recovery happens.
  - A failed recovery logs `::warning::apt-lock: sudo -n dpkg --configure -a failed (exit code N); running <command> anyway`.
- `tests/support/process-group-cli.ts` (new) runs one command via `runProcessGroup` and prints `{exitCode, output, timedOut}`. A bad usage exits 2.
- `tests/support/sandbox.ts` runs `npm run` through that CLI. It adds the `timeoutMs` option and `timedOut`. If the CLI itself fails, it returns exit code -1 with the CLI output.
- `.github/workflows/ci.yml`
  - "Read month stamp" step.
  - "Cache apt archives" (pinned actions/cache).
  - "Restore apt archives" copies cached `.deb` files into `/var/cache/apt/archives` with sudo, before both install steps.
  - "Collect apt archives" copies them back after the installs and logs the count and size.
  - The install run lines, `--attempts 3 --timeout-seconds 240 --delay-seconds 10`, `--wait-seconds 150`, step timeout 13 and job timeout 20 are unchanged.
- `README.md`: CI paragraph now mentions dpkg recovery and the apt cache.
- New tests: `tests/ci/apt-lock.dpkg.acceptance.test.ts`, `tests/support/sandbox-timeout.acceptance.test.ts`, `tests/ci/apt-archives-cache.test.ts`. No locked test was edited. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `apt-lock.dpkg.acceptance.test.ts` with a fake `sudo` on PATH | PASS | Marker `sudo -n dpkg --configure -a` then `ran`. Judge holdout: the wrapper exited 7 with the command's own code, and recovery waited for a released lock |
| SPEC-02 | AC#1 | same file | PASS | Empty and missing journal: no sudo call |
| SPEC-03 | AC#1 | same file | PASS | A fake sudo exiting 5 gave a warning, and the command still ran |
| SPEC-04 | AC#1 | same file | PASS | Lock held: exit 1, `::error::`, no recovery, command not run |
| SPEC-05 | AC#2 | `sandbox-timeout.acceptance.test.ts` | PASS | Grandchild that ignores SIGTERM is gone within 2 s. Test takes about 15.1 s |
| SPEC-06 | AC#2 | same file | PASS | Normal run returns the real exit code, `timedOut` false and the output |
| SPEC-07 | AC#3 | `apt-archives-cache.test.ts` | PASS | Pin, path, key, order and unchanged install limits. Judge compared the YAML to base: pre-existing steps deep-equal |
| SPEC-08 | AC#3 | manual: cold branch CI run 44831732531 | PASS | Cache miss. "Need to get 126 MB", "Fetched 126 MB in 18s", 186 `.deb` files collected, cache saved |
| SPEC-09 | AC#3 | manual: warm branch CI run 44832759000 | PASS | "Cache restored from key: apt-archives-Linux-pw1.65.1-2026-11". "Need to get 0 B/126 MB". "attempt 1 of 3 succeeded in 33.3 s". Job success |

- Gates: build gate and fix gate both PASS, with `npm test` giving 98 files, 355 passed and 6 skipped (Linux-only). Lint and typecheck are clean.
- Judge round 1: PASS, no failed items, no blocking findings, integrity PASS. The judge also ran an end-to-end check of the real CLI. Locally, with sudo not permitted, it printed the recovery line, then the warning, then ran the command and exited 0.
- The spec's own run command was not run locally, because it would call the real `sudo`. The fake-sudo tests cover the same path.

## Review
No blocking findings. The code reviewer and security reviewer each reported only MINOR and NIT items, and none were fixed.

### Non-blocking review notes (deliberately not fixed)
- MINOR, security: spec §8 wrongly says apt hash-checks cached `.deb` files (see the correction at the top). Hardening options: save the cache straight after Collect, and verify sha256 against the signed index.
- MINOR, code (`ci.yml`): `restore-keys` carries last month's `.deb` set forward. Collect copies everything in the archives directory, so superseded packages accumulate and the "refresh at most monthly" claim in A-6 does not remove them.
- MINOR, code (`apt-lock.js:266`): when sudo cannot start, `runCommand` prints `::error::` and the follow-up warning says "exit code 1". A-2 asked for one clear warning. This cannot happen on hosted runners.
- NIT, security (`apt-lock.js`): `dpkgInterrupted` rethrows errors other than ENOENT (such as EACCES), so `main` crashes with a stack trace.
- NIT, code (`sandbox-timeout.acceptance.test.ts`): the `ok` output assertion also matches the file name `tests/ok.test.ts`. The exit code and `timedOut` assertions carry the real check.

## How to try it
- `npx vitest run tests/ci/apt-lock.dpkg.acceptance.test.ts tests/support/sandbox-timeout.acceptance.test.ts tests/ci/apt-archives-cache.test.ts`
- `npm test`
- Manual dpkg check: `mkdir -p /tmp/tlh-dpkg-demo && touch /tmp/tlh-dpkg-demo/0001 && node tools/ci/apt-lock.js --wait-seconds 5 --dpkg-updates /tmp/tlh-dpkg-demo -- node -e 0`
- CI proof: `gh run view 44832759000 --log | grep -E "Cache restored|Need to get|attempt 1 of 3"`

## Run metrics
Questions 1 (Q-2 moot) · assumptions logged 6 in the spec (state.json counter shows 0) · review rounds 1 · judge rounds 1 · gate runs 2 · sendbacks 0 · escalations 0 · changed lines 412 across 8 files, against a budget of 380 lines and 8 files (warn level, mostly test code).

## Known limitations and follow-ups
- Known limitation: on a cold cache (first run, new Playwright version, new month, or eviction after 7 days unused) the install downloads the full 126 MB. On a slow mirror it can still exhaust all attempts. AC#3's "first attempt" holds for warm-cache runs only.
- Follow-up 1, MEDIUM, security hardening. Verify each restored `.deb`'s sha256 against the signed index (`apt-cache show`) before copying it into `/var/cache/apt/archives`. Alternatively, or as well, save the cache straight after Collect, using `actions/cache/restore` plus `actions/cache/save`, so later steps cannot add to it.
- Follow-up 2. Prune old `.deb` files, so last month's cache is not carried forward. Either run `apt-get autoclean` or empty the archives directory before Collect, or drop `restore-keys`.
- Follow-up 3, LOW. In `apt-lock.js`, print one clear warning when sudo cannot start, not `::error::` plus "exit code 1". NIT: make `dpkgInterrupted` handle EACCES without a stack trace. NIT: tighten the `ok` assertion in `sandbox-timeout.acceptance.test.ts`.
- Follow-up 4. The cold-cache slow-mirror limitation belongs to the parked CI container-image plan (option b).
- Spec §8 should be corrected to match the note at the top.

## Lessons for the factory (proposals — not applied)
- The spec asserted apt behaviour (hash-checking cached archives) that nobody had verified, and the security reviewer caught it. Proposal: when a spec makes a security claim about a third-party tool, require a cited source or a quick check on the real tool before the spec is approved.
- The change ran 412 lines against a 380-line budget, mostly tests. Proposal: set the scope budget with the test files counted, or state the test share separately.
- `state.json` shows `assumptions: 0` while the spec lists six assumptions. Proposal: count the spec's assumptions table, or drop the counter.
