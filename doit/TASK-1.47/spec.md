# Spec: TASK-1.47 — Verify and prune the cached apt archives

Status: READY (approved 2026-11-20)
Task: TASK-1.47 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up J-1-01, J-1-03 from TASK-1.39, doc-43) · Dream: limit-holdem-trainer

## 1. Summary
TASK-1.39 caches the downloaded Playwright `.deb` files in the Actions cache (`.github/workflows/ci.yml:57-76`). apt trusts a file already in `/var/cache/apt/archives` on name and size, not hash (doc-43 correction). So a `.deb` planted in the cache by code in a `main` job would be installed as root on later runs. This task does three things:
- **Verify (AC#1).** A new script, `tools/ci/apt-archives.js restore`, copies a cached `.deb` into `/var/cache/apt/archives` only if its sha256 matches the `SHA256:` field that `apt-cache show` reports for that exact package, version and architecture. It runs after a fresh `apt-get update`, so the index is the signed one.
- **Save early (AC#2).** The single `actions/cache` step becomes `actions/cache/restore` plus an `actions/cache/save` step placed directly after "Collect apt archives". Steps after that (E2E) can no longer change the saved entry.
- **Prune (AC#3).** `tools/ci/apt-archives.js collect` rebuilds the cache directory from scratch. It keeps only the `.deb` files whose package is installed at exactly that version (per `dpkg-query`), so archives that the current install did not use are not carried forward.

## 2. Scope
- In scope:
  - `tools/ci/apt-archives.js` (new): `restore` and `collect` subcommands, plus exported pure helpers.
  - `.github/workflows/ci.yml`: a new "Update apt index" step, the cache step split into restore and save, and new run lines for "Restore apt archives" and "Collect apt archives".
  - `tests/ci/apt-archives.acceptance.test.ts` (new): CLI behaviour of `restore` and `collect`, using fake `apt-cache`, `dpkg-query` and `sudo` on PATH.
  - `tests/ci/apt-archives.test.ts` (new): unit tests for the file-name and apt-record parsers.
  - `tests/ci/apt-archives-cache.test.ts` (TASK-1.39, locked): rewrite the wiring assertions for the new steps. This is an approved cross-story edit (D-2).
  - `tests/ci/workflow.test.ts` (TASK-1.7, locked): widen the pin regex at `:169` by one optional path segment, so that `actions/cache/restore@<sha>` and `actions/cache/save@<sha>` are accepted. The rest of the assertion stays the same: a 40-hex SHA and a `# vX.Y.Z` comment are still required. This is an approved cross-story edit (D-3, Q-1).
  - `README.md`: CI paragraph (`README.md:47-49`) mentions hash verification, the early save and pruning.
- Not doing:
  - Any change to the two Playwright install steps, their `if:` lines, run lines or limits. Any change to the job timeout or `tools/ci/apt-network.conf`.
  - Any new `if:` line. The locked list is at `tests/ci/workflow.test.ts:66-74`.
  - Any change to `tests/ci/apt-network.test.ts` (TASK-1.30).
  - The cold-cache slow-mirror limitation (TASK-1.39 Follow-up 4) and the `apt-lock.js` warning nits (Follow-up 3).
  - Verifying `.deb` files that apt downloads itself. apt already hash-checks those.
  - Changing the cache key or `restore-keys` format.
- Scope budget: files=7, lines=480   (apt-archives.js ~170, acceptance test ~150, unit test ~60, apt-archives-cache.test.ts ~±60, ci.yml ~+20/−8, workflow.test.ts ±1, README ~±6)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The signed index is refreshed by a new step, "Update apt index", placed before "Restore apt archives". Its run line is `node tools/ci/retry.js --label "Update apt index" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- sudo apt-get update`, with `timeout-minutes: 13` | yes | Same retry and lock limits as the install steps. The locked `tests/ci/apt-network.test.ts:55-58` reads the first `retry.js` run line in the workflow and requires `--timeout-seconds 240`, and this step becomes that first line. A failed update fails the job, as a failed update inside the install would today | Run `apt-get update` inside the script; skip the restore when the update fails |
| A-2 | "Used by this install" means: `dpkg-query` reports package `<name>` with architecture `<arch>`, status `ii`, at exactly `<version>` once the install steps have finished | yes | Exact, and no extra apt call. A restored but superseded version, or a planted file under an uninstalled name, is not installed, so it is not collected | `apt-get autoclean` (keeps old versions that are still downloadable); clear the cache before the install and collect everything |
| A-3 | `restore` runs one `apt-cache show <spec>` per file. `<spec>` is `<name>:<arch>=<version>`, or `<name>=<version>` when `<arch>` is `all`. A file is accepted only if a returned record has the same `Package`, `Version` and `Architecture` and its `SHA256` equals the file's sha256. Any `apt-cache` failure, including a non-zero exit with no matching record, drops that file | yes | One call per file has well-defined errors. 186 files at about 50 ms each is under 15 s, which SPEC-07 checks | Batch all specs into one call (its partial-failure behaviour is less clear) |
| A-4 | `restore` does not delete rejected files from the source directory. `collect` empties the cache directory (`*.deb` entries) before it copies, so a rejected file is never saved again | yes | Less code, and the same end state after Collect | Delete rejected files during `restore` |
| A-5 | The save step uses `key: ${{ steps.apt-archives-cache.outputs.cache-primary-key }}` and has no `if:`. On an exact-key hit, the save logs that the key already exists and the step still passes. On a fork PR it logs a warning and passes. Both are logged as warnings by `actions/cache/save`, not failures, and SPEC-07 confirms this on the live runner | yes | The locked `if:` list leaves no room for `if: cache-hit != 'true'` | Add an `if:` (needs another locked-test edit) |
| A-6 | Copying into the root-owned archives directory uses one `sudo -n cp -- <files…> <dir>/` call. This POSIX form works with both GNU and BSD `cp`, so the tests run on macOS too | yes | Mirrors `apt-lock.js`'s `sudo -n` use (`tools/ci/apt-lock.js:262`) | `sudo cp -t` (GNU only); running the script under sudo |

## 3. Current system
- `.github/workflows/ci.yml:48-79`: "Read month stamp" (id `month`), "Cache apt archives" (combined `actions/cache`, which saves in its post step at job end, after E2E), "Restore apt archives" (`find … -exec sudo cp`), the two install steps, "Collect apt archives" (`find … -exec cp` into the cache directory, which still holds every restored file, so nothing is ever pruned), then "E2E".
- Locked tests that constrain the YAML:
  - `tests/ci/workflow.test.ts:62-75`: no `continue-on-error`, `|| true` or `set +e`, and exactly three `if:` lines.
  - `:155-171`: every `uses:` line matches `^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$`. That allows only one `/`, so `actions/cache/restore@…` fails it (D-3).
  - `:34-47`: only `npm` run lines are order-checked, so new `node` run lines are fine.
  - `tests/ci/apt-network.test.ts:19-33,55-58`: "Bound apt network timeouts" comes before the installs, and the first `retry.js` run line has `--timeout-seconds 240` (A-1).
  - `tests/ci/apt-archives-cache.test.ts:6-63` (TASK-1.39): pins the old `find` run lines and the combined cache step, so it must change (D-2).
- Script conventions to follow (`tools/ci/apt-lock.js`): ESM `.js` with JSDoc types (checked by `tsc` through `allowJs`/`checkJs`, `tsconfig.json`), `parseArgs` with a `UsageError` class that exits 2, `log()` to stdout, control characters replaced with `?` in logged text (`apt-lock.js:129-135`), and a `main` guard on `import.meta.url` (`:277-285`).
- Test conventions: `tests/ci/apt-lock.dpkg.acceptance.test.ts:28-75` uses temp dirs from `mkdtempSync` and fake binaries on `PATH` (`fakeSudo`), and spawns the script with `process.execPath`. `REPO_ROOT` comes from `tests/support/sandbox`. The step-parsing helpers are at `tests/ci/apt-archives-cache.test.ts:9-15`.
- Tests run with `npm test` (`vitest run --coverage`). Coverage includes `src/` only (`vite.config.ts:13`), so `tools/` adds no threshold.
- Existing code to reuse:
  - `tools/ci/apt-lock.js` → the `UsageError`, `parseArgs` and `main`-guard pattern, and the control-character sanitising in `holderText`. Copy these patterns; do not import them.
  - `tools/ci/retry.js` + `tools/ci/apt-lock.js` → wrap the new `sudo apt-get update` (A-1).
  - `tests/ci/apt-lock.dpkg.acceptance.test.ts` `fakeSudo`/`runWrapper` → the same fake-PATH technique for `sudo`, `apt-cache` and `dpkg-query`.
  - `actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0` (`ci.yml:53`) → the same SHA for `actions/cache/restore` and `actions/cache/save`. Same repository and same commit, so no new dependency.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Verification and pruning live in `tools/ci/apt-archives.js` (`restore`/`collect`). The YAML only calls it | Inline shell in YAML | The caller asked for a small tested script. It can be tested with fakes | no | n/a |
| D-2 | Rewrite the wiring assertions in TASK-1.39's locked `tests/ci/apt-archives-cache.test.ts`. The orchestrator records `doit.py unlock TASK-1.39 tests/ci/apt-archives-cache.test.ts --reason "TASK-1.47 AC#1-3 replace the cache wiring it pins"` | Leave it (it would fail); a new file plus deleting the old one | The ACs require changing exactly the lines it pins. Precedent: TASK-1.36 D-2 | yes | D-2 in qa.md (autopilot, recommended, 2026-11-20; unlock recorded under TASK-1.39) |
| D-3 | Widen `tests/ci/workflow.test.ts:169` (TASK-1.7, locked) to `/^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$/`. Nothing else in that file changes. The orchestrator records `doit.py unlock TASK-1.7 tests/ci/workflow.test.ts --reason "TASK-1.47 AC#2 needs actions/cache/restore and actions/cache/save sub-action pins"` | Keep the combined `actions/cache` (fails AC#2); a local composite action (also fails the regex) | AC#2 names the sub-actions, and both are SHA-pinned like every other action. Precedent: TASK-1.8, 1.19 and 1.29 edited this file | yes | Q-1 (autopilot, recommended option (a), 2026-11-20; unlock recorded under TASK-1.7) |
| D-4 | Pruning by "installed at exactly this version" (A-2), with the cache directory emptied before Collect copies | `apt-get autoclean`; drop `restore-keys` | It carries forward only what this install used, which also blocks junk under unused names. Keeping `restore-keys` keeps month-boundary runs warm | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/apt-archives.js` — new: `restore` and `collect` subcommands and exported helpers.
- `.github/workflows/ci.yml` — "Update apt index", the restore/save split, and new Restore/Collect run lines.
- `tests/ci/apt-archives.acceptance.test.ts` — new: CLI behaviour (SPEC-01 to SPEC-04).
- `tests/ci/apt-archives.test.ts` — new: parser units (SPEC-05).
- `tests/ci/apt-archives-cache.test.ts` — rewritten wiring check (SPEC-06). Cross-story, D-2.
- `tests/ci/workflow.test.ts` — one-line pin-regex widening (D-3).
- `README.md` — CI paragraph.

### Components, interfaces and data
`tools/ci/apt-archives.js` (ESM, JSDoc-typed). Usage:
```
node tools/ci/apt-archives.js restore --from <cacheDir> --to <archivesDir>
node tools/ci/apt-archives.js collect --from <archivesDir> --to <cacheDir>
```
Exports (pure, unit-tested):
- `parseDebFileName(fileName: string): { name: string, version: string, arch: string } | null`. It matches `^([a-z0-9][a-z0-9+.-]*)_([A-Za-z0-9.+~%-]+)_([a-z0-9-]+)\.deb$` and decodes `%3a`/`%3A` to `:` in the version. It returns null for anything else, including a version that still contains `%` after decoding.
- `parseAptRecords(text: string): { package: string, version: string, architecture: string, sha256: string }[]`. It splits `apt-cache show` output on blank lines and reads the `Package:`, `Version:`, `Architecture:` and `SHA256:` fields. Records without all four fields are skipped. `sha256` is lower-cased.
- `parseInstalled(text: string): Set<string>`. Input is `dpkg-query -W -f '${Package}\t${Version}\t${Architecture}\t${db:Status-Abbrev}\n'` output. Output is the set of `name|version|arch` keys for lines whose status starts with `ii`.

CLI behaviour:
- **`restore`**: for each directory entry of `--from`, sorted, whose name ends `.deb`:
  1. `lstat`: it must be a regular file. Otherwise drop it with reason `not a regular file`.
  2. `parseDebFileName`: otherwise drop it with reason `unrecognised file name`.
  3. `spawnSync('apt-cache', ['show', spec])` (A-3), using an argument array and no shell. Look for a record with an equal package, version and architecture. If none is found, drop it with reason `not in the apt index`.
  4. Stream the file's sha256 (`node:crypto`). If it is not equal to that record's `SHA256`, drop it with reason `sha256 mismatch`.

  Then, if at least one file is kept, run `sudo -n cp -- <abs kept paths…> <to>/`. Log `apt-archives: dropped <file>: <reason>` for each drop, as a `::warning::` line for `sha256 mismatch`. End with `apt-archives: restored <k> of <n> .deb files (<d> dropped)`.
- **`collect`**: create `--to` if it is missing and delete every `*.deb` entry in it. Run `dpkg-query` (as above) and build the installed set. Copy (`copyFileSync`) each regular `.deb` in `--from` whose parsed `name|version|arch` is in the set. Log `apt archives: <k> .deb files, <size> MB (<s> not used by this install)`.

### Rules and algorithms
- Worked example (restore). The cache holds:
  - `libfoo1_1.2-3_amd64.deb`: sha matches the index. **Copied.**
  - `libbar_2%3a0.9_all.deb`: the version decodes to `2:0.9`, and the spec is `libbar=2:0.9`. Its sha differs. **Dropped, sha256 mismatch.**
  - `libold_1.0_amd64.deb`: `apt-cache` exits 100 with no record. **Dropped, not in the apt index.**
  - `evil.deb`: **dropped, unrecognised file name.**
  - `link_1.0_amd64.deb`, a symlink: **dropped, not a regular file.**

  Result: `/var/cache/apt/archives` gains only `libfoo1_1.2-3_amd64.deb`, and the log says `restored 1 of 5 .deb files (4 dropped)`.
- Worked example (collect). dpkg reports `libfoo1 1.2-3 amd64 ii` and `libnew 4.0 amd64 ii`. The archives directory holds `libfoo1_1.2-3_amd64.deb`, `libnew_4.0_amd64.deb` and `libfoo1_1.1-0_amd64.deb` (the old restored version). The cache directory before the run holds the tampered `libbar_2%3a0.9_all.deb`. After the run, the cache directory holds exactly `libfoo1_1.2-3_amd64.deb` and `libnew_4.0_amd64.deb`, and the log says `(1 not used by this install)`.
- Workflow order after the change:
  1. "Read month stamp"
  2. "Cache Playwright browsers"
  3. "Restore apt archive cache": `uses: actions/cache/restore@55cc…a9 # v6.1.0`, `id: apt-archives-cache`, with the same path, key and restore-keys as today.
  4. "Update apt index" (A-1)
  5. "Restore apt archives": `node tools/ci/apt-archives.js restore --from ~/.cache/apt-archives --to /var/cache/apt/archives`
  6. both install steps (unchanged)
  7. "Collect apt archives": `node tools/ci/apt-archives.js collect --from /var/cache/apt/archives --to ~/.cache/apt-archives`
  8. "Save apt archive cache": `uses: actions/cache/save@55cc…a9 # v6.1.0`, `path: ~/.cache/apt-archives`, `key: ${{ steps.apt-archives-cache.outputs.cache-primary-key }}`
  9. "E2E"

  None of the new or renamed steps has an `if:`.

### Error handling and configuration
- Usage errors (unknown subcommand, missing `--from`/`--to`, stray argument) write `apt-archives: usage: <message>` to stderr and exit 2.
- `restore` exits 0 even when files are dropped. A dropped file only means apt downloads that package again. It exits 1 with `::error::apt-archives: copying verified archives failed (exit code N)` if `sudo cp` fails or cannot start.
- If `apt-cache` cannot start (ENOENT), every file is dropped with reason `apt-cache unavailable`. This fails safe.
- `collect` exits 1 with `::error::apt-archives: dpkg-query failed (exit code N)` if `dpkg-query` exits non-zero. Collecting nothing is safer than collecting unverified files. The job fails, so the problem shows up.
- A missing `--from` directory counts as empty for both subcommands (first run: the cache directory does not exist yet). `restore` logs `restored 0 of 0`.
- File names in log lines have control characters replaced with `?`, as `apt-lock.js:129-135` does.

## 6. Behaviour specification

### SPEC-01: restore copies only archives whose sha256 matches the apt index
- Verifies: AC#1
- Behaviour: Given a cache directory with the five files from the §5 restore example, a fake `apt-cache` on PATH that prints records (including the correct SHA256 for `libfoo1` and a different SHA256 for `libbar` at `2:0.9`) and exits 100 for `libold`, and a fake `sudo` that drops `-n` and execs the rest, When `node tools/ci/apt-archives.js restore --from <cache> --to <archives>` runs, Then it exits 0, `<archives>` contains exactly `libfoo1_1.2-3_amd64.deb` with identical bytes, stdout contains `::warning::apt-archives: dropped libbar_2%3a0.9_all.deb: sha256 mismatch` and `restored 1 of 5 .deb files (4 dropped)`, and the fake `apt-cache` was called with `show libbar=2:0.9` and `show libfoo1:amd64=1.2-3`.
- Verification: acceptance `tests/ci/apt-archives.acceptance.test.ts::restore drops a tampered .deb and copies only archives that match the signed index`

### SPEC-02: restore fails safe when apt-cache is unavailable or the cache is empty
- Verifies: AC#1
- Behaviour: Given (a) a PATH where `apt-cache` does not exist and one genuine `.deb` in the cache, Then `restore` exits 0, copies nothing, does not call `sudo`, and logs `dropped …: apt-cache unavailable`. Given (b) a `--from` directory that does not exist, Then `restore` exits 0 and logs `restored 0 of 0 .deb files (0 dropped)`. Given (c) the fake `sudo` exits 1, Then `restore` exits 1 and logs `::error::apt-archives: copying verified archives failed (exit code 1)`.
- Verification: acceptance `tests/ci/apt-archives.acceptance.test.ts::restore copies nothing when apt-cache is unavailable, accepts a missing cache and fails when the copy fails`

### SPEC-03: collect keeps only archives the current install used
- Verifies: AC#3, AC#1
- Behaviour: Given the §5 collect example (fake `dpkg-query` on PATH printing `libfoo1\t1.2-3\tamd64\tii ` and `libnew\t4.0\tamd64\tii `, plus a `libgone\t1.0\tamd64\trc ` line whose `libgone_1.0_amd64.deb` is also in the archives directory), When `collect --from <archives> --to <cache>` runs, Then it exits 0, `<cache>` contains exactly `libfoo1_1.2-3_amd64.deb` and `libnew_4.0_amd64.deb` (the old `libfoo1_1.1-0`, the not-installed `libgone` and the previously cached tampered `libbar` are all gone), and stdout contains `apt archives: 2 .deb files` and `(2 not used by this install)`.
- Verification: acceptance `tests/ci/apt-archives.acceptance.test.ts::collect rebuilds the cache with only the archives installed at that version`

### SPEC-04: collect fails when dpkg-query fails; usage errors exit 2
- Verifies: AC#3
- Behaviour: Given a fake `dpkg-query` that exits 2, When `collect` runs, Then it exits 1 with `::error::apt-archives: dpkg-query failed (exit code 2)`. Given `node tools/ci/apt-archives.js prune --from a --to b`, or `restore --from a` with no `--to`, Then it exits 2 and stderr starts with `apt-archives: usage:`.
- Verification: acceptance `tests/ci/apt-archives.acceptance.test.ts::collect fails when dpkg-query fails and bad usage exits 2`

### SPEC-05: parsers read apt file names, records and dpkg status exactly
- Verifies: AC#1, AC#3
- Behaviour: Given the exported parsers, When each is called, Then:
  - `parseDebFileName('libbar_2%3a0.9_all.deb')` → `{ name: 'libbar', version: '2:0.9', arch: 'all' }`.
  - `parseDebFileName` returns null for `evil.deb`, `-x_1_amd64.deb`, `a_1_amd64.deb.part`, `a_1%2f_amd64.deb` and a name containing `/` or a newline.
  - `parseAptRecords` on two records separated by a blank line returns both, with `sha256` lower-cased, and skips a record without `SHA256:`.
  - `parseInstalled` keeps `ii ` lines and skips `rc ` and `iU ` lines.
- Verification: unit `tests/ci/apt-archives.test.ts::parses apt file names, records and installed packages`

### SPEC-06: the workflow verifies on restore, saves right after Collect and installs unchanged
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given `ci.yml`, When it is read, Then:
  - "Restore apt archive cache" uses `actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0` with `id: apt-archives-cache`, `path: ~/.cache/apt-archives`, the TASK-1.39 key (`apt-archives-${{ runner.os }}-pw<version>-<month>`, month from `date -u +%Y-%m`) and restore-keys prefix.
  - "Update apt index" runs `retry.js … -- node tools/ci/apt-lock.js --wait-seconds 150 -- sudo apt-get update` (A-1).
  - "Restore apt archives" and "Collect apt archives" have exactly the run lines in §5.
  - "Save apt archive cache" is the step directly after "Collect apt archives" (index + 1). It uses `actions/cache/save@<same SHA> # v6.1.0` with the same path and `key: ${{ steps.apt-archives-cache.outputs.cache-primary-key }}`, and comes before "E2E".
  - The order is: cache restore < update < restore < both installs < collect < save < E2E.
  - No step uses the combined `actions/cache@…` for apt archives, and none of the five apt-archive steps has an `if:`.
  - Both install steps keep their exact TASK-1.39 bodies, and the job timeout is 20.
  - The full suite, including the locked `workflow.test.ts` (with D-3) and `apt-network.test.ts`, passes.
- Verification: acceptance `tests/ci/apt-archives-cache.test.ts::verifies restored archives, saves the cache right after Collect and leaves the installs unchanged`

### SPEC-07: on the live ubuntu-24.04 runner, genuine cached archives pass verification and the cache is saved before E2E (branch run)
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the branch pushed to GitHub, When CI runs (the first run that restores an `apt-archives-Linux-pw1.65.1-…` entry, either from `main` or from an earlier branch run), Then:
  - "Update apt index" logs `attempt 1 of 3 succeeded`.
  - "Restore apt archives" logs `restored <k> of <n> .deb files (<d> dropped)` with k > 0 and d = 0. Genuine archives match `apt-cache show` on the real runner, which proves the A-3 approach works.
  - The update and restore steps together take less than 60 s.
  - The install step logs `attempt 1 of 3 succeeded`, and apt reports `Need to get` of 10 MB or less.
  - "Collect apt archives" logs `apt archives: <m> .deb files` with m > 0.
  - "Save apt archive cache" runs before "E2E" and passes, logging either `Cache saved` or that the key already exists.
  - The job passes.

  If no entry exists yet (cold), the first run must show `restored 0 of 0`, a collect count above 0 and `Cache saved`, and a second run must then meet the conditions above.
- Verification: manual — `gh run view <branch-run-id> --log | grep -E "Update apt index|apt-archives: |apt archives: |Need to get|attempt 1 of 3 succeeded|Cache saved|already exists|Cache restored from key"` plus `gh run view <branch-run-id> --json jobs` for step order and durations

## 7. Edge cases
- Empty or missing cache directory (first run, eviction): SPEC-02(b). `collect` creates the directory (SPEC-03).
- Tampered content, an unknown version, a bad file name, a symlink: SPEC-01, SPEC-05.
- Epoch versions (`%3a`): SPEC-01, SPEC-05.
- Arch `all` versus arch-specific packages: SPEC-01 (both spec forms).
- Last month's set restored through `restore-keys`: superseded versions are not installed, so they are not collected (SPEC-03). Genuine but unneeded files may still be copied into the archives directory, which is harmless because apt ignores them.
- `apt-cache` missing: SPEC-02(a). `sudo cp` failure: SPEC-02(c). `dpkg-query` failure: SPEC-04.
- Exact-key hit or a fork PR at save time: A-5, SPEC-07.
- `apt-get update` failure or stall: retried and bounded by `retry.js` (A-1). If all attempts fail, the job fails, as an install failure would.
- An install that fails partway: the job stops before Collect and Save, so nothing is saved.
- Concurrency: N/A. Steps run one after another, and nothing else writes the cache directory between the hash and the copy.

## 8. Security considerations
- Trust boundary: the restored Actions cache directory (`~/.cache/apt-archives`) is untrusted. Each file is validated before it reaches the root-owned archives directory:
  - it must be a regular file (lstat, no symlinks);
  - its name must match a strict regex (no `/`, no leading `-`, no control characters);
  - its exact name, version and architecture must have a record in the index that `apt-get update` fetched and verified with GPG on this run;
  - its sha256 must equal that record's `SHA256`.
- Injection: `apt-cache`, `dpkg-query` and `sudo cp` are spawned with argument arrays and no shell. `cp` gets `--` and absolute paths. Logged file names are sanitised against `::` workflow-command injection.
- Time-of-check versus time-of-use between hashing and `sudo cp`: N/A in practice. No other step runs at the same time, and code that could race it already has passwordless sudo.
- Persistence: the cache is saved right after Collect (AC#2), so code in "E2E" cannot add to it. Collect copies only installed archives (AC#3), and those came either from apt's verified download or from a verified restore.
- Secrets, auth, randomness, sensitive data: N/A. No new dependency: the restore and save sub-actions are the same pinned repository and commit.

## 9. Non-functional
- On a warm branch run, "Update apt index" plus "Restore apt archives" take less than 60 s, measured from the job's step durations (SPEC-07). The warm install still downloads 10 MB or less in attempt 1.
- Cache size can only shrink or stay the same compared with TASK-1.39 (186 files, ~126 MB), because only installed archives are kept.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/apt-archives.js restore --from ~/.cache/apt-archives --to /var/cache/apt/archives` (CI, ubuntu-24.04). Locally, run the acceptance tests, which use fakes.
- New tests:
  - `tests/ci/apt-archives.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/ci/apt-archives.test.ts` → SPEC-05
  - `tests/ci/apt-archives-cache.test.ts` (rewritten) → SPEC-06
  - Branch CI run → SPEC-07 (manual, needs a GitHub run; this is the only item that does)
- End-to-end scenario for the Judge:
  1. Run `npx vitest run tests/ci/apt-archives.acceptance.test.ts tests/ci/apt-archives.test.ts tests/ci/apt-archives-cache.test.ts tests/ci/workflow.test.ts tests/ci/apt-network.test.ts`.
  2. Push the branch and check SPEC-07 in the run log: 0 dropped, attempt 1 for both retried steps, Save before E2E, job green.
  3. Optionally tamper locally: copy a fixture, flip one byte, and see it dropped (SPEC-01).

## 11. Open questions
- None. Q-1 was answered with option (a): widen only the pin regex at `tests/ci/workflow.test.ts:169` (D-3). See `doit/TASK-1.47/qa.md`.

## 12. Clarifications log
See `doit/TASK-1.47/qa.md`.
