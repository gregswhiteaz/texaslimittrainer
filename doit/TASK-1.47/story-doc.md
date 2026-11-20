# TASK-1.47: Verify and prune the cached apt archives

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up J-1-01, J-1-03 from TASK-1.39, doc-43) · Branch: doit/TASK-1.47

## What was asked
TASK-1.39 caches the Playwright `.deb` files in the Actions cache. apt trusts a file in `/var/cache/apt/archives` on name and size, not hash, so a `.deb` planted in the cache would be installed as root on later runs. The task has three acceptance criteria:
- AC#1: verify each cached `.deb` against the signed apt index before apt can use it.
- AC#2: save the cache right after "Collect apt archives", so later steps (E2E) cannot change the saved entry.
- AC#3: prune the cache so only archives this install used are carried forward.

Spec: doit/TASK-1.47/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A new "Update apt index" step runs before "Restore apt archives". It uses the same retry and lock wrappers as the installs (`--attempts 3 --timeout-seconds 240`, `timeout-minutes: 13`). A failed update fails the job. | yes | The locked `apt-network.test.ts` reads the first `retry.js` line and needs `--timeout-seconds 240`. | Run `apt-get update` inside the script and skip the restore on failure. |
| A-2 | "Used by this install" means `dpkg-query` reports the package, arch and exact version with status `ii` after the installs. | yes | Exact, with no extra apt call. | `apt-get autoclean`, or clear the cache before the install. |
| A-3 | `restore` runs one `apt-cache show <name>[:arch]=<version>` per file. It accepts the file only if a record matches package, version and arch, and the record's SHA256 equals the file's. Any apt-cache failure drops that file. | yes | Per-file calls have well-defined errors. | Batch all specs into one call. |
| A-4 | `restore` does not delete rejected files. `collect` empties the cache's `*.deb` entries before copying, so a rejected file is never saved again. | yes | Less code, same end state. | Delete rejected files in `restore`. |
| A-5 | The save step has no `if:`. It uses `steps.apt-archives-cache.outputs.cache-primary-key`. An exact-key hit or a fork PR logs a warning and the step still passes. | yes | The locked `if:` list (`workflow.test.ts:66-74`) has no room for another. | Add an `if:` (needs another locked-test edit). |
| A-6 | The copy into the root-owned archives directory is one `sudo -n cp -- <files…> <dir>/` call. | yes | Works with GNU and BSD `cp`, so tests run on macOS. | `sudo cp -t`, or run the script under sudo. |

## Clarifications and decisions
Autopilot run: both questions were auto-accepted with the recommended option (qa.md).
- Q-1: widen the pin regex at `tests/ci/workflow.test.ts:169` (TASK-1.7, locked) by one optional path segment so `actions/cache/restore@<sha>` and `actions/cache/save@<sha>` pass. A 40-hex SHA and a `# vX.Y.Z` comment are still required. Unlock recorded under TASK-1.7.
- D-2: rewrite TASK-1.39's locked `tests/ci/apt-archives-cache.test.ts`, because it pins the exact wiring this task replaces. Unlock recorded under TASK-1.39.
- D-1: the logic lives in a tested script, `tools/ci/apt-archives.js`, and the YAML only calls it.
- D-4: prune by "installed at this exact version", and keep `restore-keys` so month-boundary runs stay warm.

## What was built
- `tools/ci/apt-archives.js` (new). Usage:
  - `node tools/ci/apt-archives.js restore --from <cacheDir> --to <archivesDir>`
  - `node tools/ci/apt-archives.js collect --from <archivesDir> --to <cacheDir>`
- `restore`, per `*.deb` in `--from`, sorted:
  1. `lstat` must show a regular file.
  2. The file name must match a strict `name_version_arch.deb` pattern (`%3a` decodes to `:`).
  3. `apt-cache show` must return a record that matches package, version and arch.
  4. The streamed sha256 must equal that record's `SHA256`.
  - Every drop is logged with a reason, and a sha mismatch is a `::warning::`. Kept files go in with one `sudo -n cp`.
- `collect` creates `--to` if missing, deletes its `*.deb` entries, reads `dpkg-query`, and copies only archives installed at exactly that version.
- Exported pure helpers: `parseDebFileName`, `parseAptRecords`, `parseInstalled`. The script follows the `apt-lock.js` conventions: `UsageError` with exit 2, sanitised log text, and a `main` guard.
- `.github/workflows/ci.yml`: step order is cache restore, Update apt index, Restore apt archives, the two installs (unchanged), Collect, cache save, E2E. There are no new `if:` lines.
- `README.md`: the CI paragraph now mentions hash verification, pruning and the early save.
- No new dependencies. The two sub-actions are the same repository and commit SHA as the old `actions/cache`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance: tampered `.deb` dropped, only index-matching archives copied | pass | `tests/ci/apt-archives.acceptance.test.ts` |
| SPEC-02 | AC#1 | Acceptance: nothing copied when apt-cache is unavailable, missing cache accepted, copy failure fails | pass | same file |
| SPEC-03 | AC#3, AC#1 | Acceptance: collect rebuilds the cache with only archives installed at that version | pass | same file |
| SPEC-04 | AC#3 | Acceptance: collect fails when dpkg-query fails, bad usage exits 2 | pass | same file |
| SPEC-05 | AC#1, AC#3 | Unit: file-name, apt-record and installed-set parsers | pass | `tests/ci/apt-archives.test.ts` |
| SPEC-06 | AC#1-3 | Workflow wiring and step order | pass | `tests/ci/apt-archives-cache.test.ts` |
| SPEC-07 | AC#1-3 | Manual: live branch CI run | pass | run 44837316525 (logs and job step order via `gh run view`) |

- `npm test`: 100 files, 360 passed, 6 skipped (gate fix-2, PASS). Format, lint and typecheck are clean.
- Judge round 1: PASS 7/7, with no failed items and no unproven AC or DoD.
- Mutation check by the code reviewer: removing `lstat` lets a symlink through, a wrong arch spec form makes the fake exit 100, skipping the cache wipe leaves a stale file, and skipping lower-casing breaks the SHA match. Each is caught by a test.

## Review
Round 1 had no BLOCKER or MAJOR findings from either the code or the security reviewer. The security reviewer found every path from the restored cache to the root-owned directory validated: `lstat`, strict file-name regex, no shell, and an index lookup per file.

### Non-blocking review notes (deliberately not fixed)
- MINOR: a hash-read error (EACCES, file removed mid-run) crashes `restore` with exit 1 instead of dropping the file.
- MINOR: hash-then-copy TOCTOU. Only code already running in the job could swap a file, and that code already has passwordless sudo, so it gains nothing.
- NIT: `collect` clears only `*.deb`, so a non-`.deb` file in a restored cache carries forward. Nothing reads it.
- NIT: the sudo start-failure message reads "could not start sudo" rather than "(exit code N)".
- NIT: 614 changed lines against a budget of 480. The extra is assertions and JSDoc.

## How to try it
- `npm test -- tests/ci/apt-archives`
- On CI: `gh run view 44837316525 --log | grep -E "apt-archives: |apt archives: |Cache saved"`

## Run metrics
Questions asked: 1 (plus decision D-2), both auto-accepted · assumptions logged: 6 (A-1 to A-6; state.json counter shows 0) · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · changed lines: 614 across 7 files (budget 480).

## Known limitations and follow-ups
No follow-ups need a task. Every review item above is infra hygiene that has not caused, and is unlikely to cause, a failure.

### Not tracked (infra, below the value bar)
- [infra] Hash-read error crashes `restore`. The cache directory is runner-owned, so this is unlikely. If it happened, the job would fail visibly and a rerun would fix it, so it is not a silent failure.
- [infra] Hash-then-copy TOCTOU. It is exploitable only by code that already has sudo.
- [infra] `collect` keeps non-`.deb` junk. This affects cache size only.
- [infra] "could not start sudo" wording.
- [infra] Budget overrun (614 against 480).

None of these caused or would plausibly cause a real failure.

Cold-cache slow-mirror behaviour (TASK-1.39 Follow-up 4) and the `apt-lock.js` warning nits (Follow-up 3) stay with their existing owners, as the spec's out-of-scope list says.

## Lessons for the factory (proposals — not applied)
- The scope budget was exceeded by 28 percent. The estimate left out JSDoc and assertion lines that `checkJs` and test strength require. When a spec sizes a new typed script, count about 1.5 times the logic lines.
- `state.json` shows `assumptions: 0` and `questions: 0` although the spec lists six assumptions and qa.md holds Q-1 and D-2. Either the counters should read from spec.md and qa.md, or the metrics line should say they are unreliable.
