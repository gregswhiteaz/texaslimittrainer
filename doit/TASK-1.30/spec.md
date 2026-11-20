# Spec: TASK-1.30 — Harden the CI apt install wrapper and mirror stalls

Status: READY (approved 2026-11-19 by orchestrator; no user questions)
Task: TASK-1.30 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.29 reviews and judge, doc-27) · Dream: limit-holdem-trainer

## 1. Summary
This task makes four small fixes to the CI apt handling added by TASK-1.29:
- `tools/ci/apt-lock.js` stops printing raw control characters from a lock holder's process name. A name can no longer start a GitHub workflow-command line.
- Tests pin three behaviours that had none: a signal-killed command, a stray argument before `--`, and the clamped final sleep.
- `devParts` decodes device numbers with a major of 4096 or more the way glibc does.
- A new CI step installs an apt config file that sets `Acquire::http(s)::Timeout` and `Acquire::Retries`. A stalled mirror connection then times out after 15 s and apt retries it, rather than idling for apt's 120 s default inside a 240 s attempt.

## 2. Scope
- In scope:
  - `tools/ci/apt-lock.js`: clean the holder name in `holderText`, export `holderText`, fix the `devParts` masks and add a code comment.
  - `tests/ci/apt-lock.hardening.test.ts` (new): tests for AC#1–AC#3.
  - `tools/ci/apt-network.conf` (new): the apt config with the network limits.
  - `.github/workflows/ci.yml`: one new step with no `if:`, placed before `npm ci`, that installs that file into `/etc/apt/apt.conf.d/`.
  - `tests/ci/apt-network.test.ts` (new):
    - a static check of the step and the config values, with a budget check;
    - a test that runs only on GitHub Actions Linux and checks that the runner's apt really sees the values.
  - `README.md`: add one sentence to the CI install paragraph.
- Not doing:
  - Editing the locked tests `tests/ci/workflow.test.ts` (TASK-1.7/1.19/1.29) or `tests/ci/apt-lock.test.ts` (TASK-1.29). The new step fits every existing assertion in workflow.test.ts (see §3).
  - Changing `tools/ci/retry.js`, its flags (`--attempts 3 --timeout-seconds 240 --delay-seconds 10`), the `--wait-seconds 150` of apt-lock, the two install steps' run lines, the step `timeout-minutes: 13` or the job `timeout-minutes: 20`. **TASK-1.39 AC#3 owns this**, along with caching the `.deb` archives between runs. This task uses only the first option in AC#4 (bounded timeout and retries).
  - Running `dpkg --configure -a` (TASK-1.39 AC#1) and killing a sudo'd apt (TASK-1.23 AC#4, done).
  - Changing the Ubuntu mirror, or using the Playwright Docker image.
  - Escaping `::` or other text in the holder name. Only control characters are replaced, as AC#1 states. A workflow command must start at the beginning of a line, so text with no newline cannot start one.
- Scope budget: files=6, lines=260   (apt-lock.js ~+15/−3, apt-lock.hardening.test.ts ~120, apt-network.conf ~8, apt-network.test.ts ~80, ci.yml +2, README +2/−1)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Each character matching `[\x00-\x1f\x7f]` in the holder name is replaced by `?`. The replacement happens in `holderText`, so the waiting line and the `::error::` line are both covered | yes | One choke point: both lines are built only through `holderText` (`tools/ci/apt-lock.js:108-111,134,231`). `?` is plain ASCII and shows that something was replaced | Delete the characters; `�`; `%XX` escapes |
| A-2 | `Acquire::http::Timeout "15"`, `Acquire::https::Timeout "15"` and `Acquire::Retries "3"` | yes | apt's Timeout limits the connect and each stalled read, not total speed. A slow mirror that keeps sending is never cut off; only a stall is. Worst case for one stalled file is 4 tries × 15 s plus apt's retry backoff of a few seconds, about 70 s. That is well inside the 240 s attempt, where apt's default 120 s stall used most of attempt 1 in run 44441353985 (doc-27). The ubuntu-24.04 runner mirror is plain http, so `https` is set only for completeness | 20–30 s timeouts; Retries 5; only `Acquire::http::Timeout` |
| A-3 | The config is a tracked file, `tools/ci/apt-network.conf`. A new step, "Bound apt network timeouts", copies it to `/etc/apt/apt.conf.d/99-ci-network` with `sudo install -m 0644`. The step has no `if:` and runs right after "Set up Node from .nvmrc" | yes (ephemeral runner; delete the step to undo) | `sudo` resets the environment, so `APT_CONFIG` would not reach Playwright's `sudo apt-get` (TASK-1.29 spec §3; `node_modules/playwright-core/lib/coreBundle.js:33787-33800`). A system conf.d file reaches it. Running before `npm test` lets a CI-only test check the live runner. Having no `if:` keeps the locked `if:` list unchanged (`tests/ci/workflow.test.ts:66-74`) | Inline `printf … \| sudo tee` in the workflow (cannot be unit-tested); have apt-lock.js write the file (a hidden side effect in a lock wrapper); edit the pinned run lines (a locked-test edit) |
| A-4 | `devParts` is fixed to glibc's `gnu_dev_major`/`gnu_dev_minor` masks, and a comment notes that Linux's kernel `dev_t` is 12:20 bits, so `/proc/locks` never shows a major of 4096 or more | yes | AC#3 accepts a fix or documentation. The fix is two masks and also removes the J-1-01 inconsistency | Document only |

## 3. Current system
- `tools/ci/apt-lock.js` (TASK-1.29). Full layout:
  - `processName` reads `/proc/<pid>/comm` and only `.trim()`s it (`:98-105`).
  - `holderText` puts the name in raw (`:108-111`).
  - The waiting line is printed at `:133-135`. The `::error::` line is printed at `:230-232`.
  - `devParts` (`:59-63`) masks the high bits with infinite-width `~0xfffn` / `~0xffn`. With a major ≥ 4096, `(dev >> 12n) & ~0xffn` pulls major bits 12+ into the minor (J-1-01).
  - A positional before `--` → `UsageError('unexpected argument "<x>"')` (`:190-191`) → exit 2 with `apt-lock: usage: …` on stderr (`:241-244`).
  - A signal-killed child prints `apt-lock: <cmd> was killed by <SIG>` and resolves 1 (`:161-165`).
  - The final sleep is clamped: `Math.min(pollSeconds * 1000, limitMs - (now() - start))` (`:138`).
- `tests/ci/apt-lock.test.ts` is **locked** (`doit/TASK-1.29/state.json` `locked_tests`). Its helpers are reused by copying, not importing: `runWrapper` at `:51-64`, `fakeArgs` at `:66-73`, `lockLine` at `:44-49`, the temp-dir `beforeEach` at `:25-41`, and the fake-clock `waitForAptLocks` call at `:186-218`. They are not exported.
- `.github/workflows/ci.yml:22-28`: "Set up Node from .nvmrc", then "Install dependencies" (`npm ci`). The install steps are at `:52-59`.
- Locked `tests/ci/workflow.test.ts` and why a new step without `if:`, whose run line does not start with `npm`, passes:
  - `:35` collects only `run: npm …` lines.
  - `:63-74`: there is no `|| true`, `set +e` or `continue-on-error`, and the `if:` list is unchanged.
  - `:82-85`: the install lines are unchanged.
  - `:96-153`: the install-step regexes anchor on those steps' own names.
  - `:173-179`: the named-steps check is still met.
  - `tests/ci/branch-protection.acceptance.test.ts:13` reads only the job name.
- Test gating precedent: `tests/ci/apt-lock.test.ts:220` sets `onLinuxCi = process.platform === 'linux' && process.env.CI === 'true'` and uses `describe.skipIf`.
- Tooling: Vitest runs `tests/**/*.test.ts` (`vite.config.ts:7`). Tool scripts are ESM `.js`, type-checked with `checkJs`. `npm run lint` = `eslint . --max-warnings 0 && prettier --check .` (`package.json` scripts). Prettier skips `.conf` files.
- `README.md:39-46` is the CI install paragraph.
- Existing code to reuse:
  - `tests/ci/apt-lock.test.ts:25-73` → copy `runWrapper`, `fakeArgs`, `lockLine` and the temp-dir setup into the new test file.
  - `tests/ci/apt-lock.test.ts:186-218` → the fake `now`/`sleep` pattern for the clamp test.
  - `tests/support/sandbox.ts` `REPO_ROOT` → file paths.
  - `tests/ci/workflow.test.ts:96-99` → the step-regex style for the static step check.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | AC#4 is met with a separate, unconditional workflow step that installs a tracked apt conf file. The pinned install run lines are not touched | (a) Add flags to the install run lines: breaks the exact strings in locked `workflow.test.ts:102-104,134-145`, a cross-story locked-test edit. (b) `APT_CONFIG` env: dropped by `sudo`. (c) Cache `.deb` archives: owned by TASK-1.39 AC#3 | No locked-test edit, reaches root apt, can be tested | no (CI-only, reversible) | n/a |
| D-2 | New tests go in new files (`apt-lock.hardening.test.ts`, `apt-network.test.ts`) | Append to locked `apt-lock.test.ts` | Avoids a locked-test edit | no | n/a |

## 5. Design

### Files to create / modify
- `tools/ci/apt-lock.js` — clean the holder name, export `holderText`, fix the `devParts` masks and add a comment (modify)
- `tests/ci/apt-lock.hardening.test.ts` — AC#1–AC#3 tests (create)
- `tools/ci/apt-network.conf` — apt network limits (create)
- `.github/workflows/ci.yml` — add the "Bound apt network timeouts" step (modify)
- `tests/ci/apt-network.test.ts` — static step/config/budget test and the GitHub-Actions-only live check (create)
- `README.md` — one sentence on the apt network limits (modify)

### Components, interfaces and data
- `export function holderText(held: { path: string, pid: number | null, name: string | null }): string`
  - `pid === null` → `'an unknown process'`.
  - A non-empty name → `` `process ${pid} (${clean(name)})` `` where `clean = (s) => s.replace(/[\x00-\x1f\x7f]/g, '?')`.
  - Otherwise → `` `process ${pid}` ``.
  - Behaviour for names without control characters is unchanged. The locked `apt-lock.test.ts` expectations (`process <pid> (flock)`) still hold.
- `devParts(dev: bigint)`:
  - `major = ((dev >> 8n) & 0xfffn) | ((dev >> 32n) & 0xfffff000n)`
  - `minor = (dev & 0xffn) | ((dev >> 12n) & 0xffffff00n)`
  - These are glibc's 32-bit-unsigned masks. Comment: Linux's kernel `dev_t` is 12-bit major / 20-bit minor, so `/proc/locks` and `stat` never report a major ≥ 4096 on Linux. The masks follow glibc so that the decode is still correct in that case.
- `tools/ci/apt-network.conf` (apt.conf syntax; a `//` comment line naming TASK-1.30 and the reason), then exactly:
  ```
  Acquire::http::Timeout "15";
  Acquire::https::Timeout "15";
  Acquire::Retries "3";
  ```
- `ci.yml` new step, inserted between "Set up Node from .nvmrc" (its `with:` block) and "Install dependencies":
  ```
        - name: Bound apt network timeouts
          run: sudo install -m 0644 tools/ci/apt-network.conf /etc/apt/apt.conf.d/99-ci-network
  ```

### Rules and algorithms
- devParts worked examples: `2049n` → `{8, 1}`. `66305n` → `{259, 1}` (unchanged). `17592491180357n` (makedev(4097, 0x12345)) → `{major: 4097, minor: 74565}`. The current code returns a wrong minor for this input.
- Clamp examples (fake clock, lock always held):
  - wait 5 s / poll 2 s → sleeps `[2000, 2000, 1000]`, final check at exactly 5000 ms.
  - wait 7 s / poll 3 s → sleeps `[3000, 3000, 1000]`, final check at 7000 ms.
- Budget rule (AC#4), checked by the static test from the conf values:
  - `(Retries + 1) × Timeout + Retries × 30 ≤ 240 − 60`. `30` is apt's maximum backoff per retry (`Acquire::Retries::Delay::Maximum` default) and `60` is the install headroom used by `tests/ci/workflow.test.ts:148`.
  - With 15/3: 60 + 90 = 150 ≤ 180.

### Error handling and configuration
- If `sudo install` fails, the step fails and the job fails. This is the normal behaviour; there is no `|| true`.
- If the conf file has a syntax error, apt fails at once on the install step. The CI-only live test catches this first.

## 6. Behaviour specification

### SPEC-01: Control characters in the holder name cannot start a workflow-command line
- Verifies: AC#1
- Behaviour: Given a held lock `{ path: '/x', pid: 4242, name: 'apt\n::warning::pwned\r\x1b\x7f' }`, When `holderText` formats it, Then the result is exactly `process 4242 (apt?::warning::pwned???)` and contains no `\n` or `\r`. With `name: 'apt-get'` the result is `process 4242 (apt-get)`, `name: null` gives `process 4242`, and `pid: null` gives `an unknown process`. The waiting line and the `::error::` line are both built only through `holderText`.
- Verification: acceptance `tests/ci/apt-lock.hardening.test.ts::holderText replaces control characters so no workflow command can start`

### SPEC-02: A signal-killed command exits 1
- Verifies: AC#2
- Behaviour: Given no lock is held (fake empty `/proc/locks`, `--lock <temp file>`), When the wrapped command is `node -e "process.kill(process.pid, 'SIGKILL')"`, Then apt-lock exits 1 and stdout contains `was killed by SIGKILL`.
- Verification: acceptance `tests/ci/apt-lock.hardening.test.ts::exits 1 when the command is killed by a signal`

### SPEC-03: An argument before `--` is a usage error
- Verifies: AC#2
- Behaviour: Given argv `--wait-seconds 5 stray -- node <markerScript>`, When apt-lock runs, Then it exits 2, stderr is exactly `apt-lock: usage: unexpected argument "stray"\n`, and the marker file is not created.
- Verification: acceptance `tests/ci/apt-lock.hardening.test.ts::rejects an argument before -- with a usage error`

### SPEC-04: The final check lands exactly at an uneven limit
- Verifies: AC#2
- Behaviour: Given a lock that is always held and a fake clock, When `waitForAptLocks` runs with wait 5/poll 2 and then wait 7/poll 3, Then the sleeps are `[2000, 2000, 1000]` and `[3000, 3000, 1000]`, the clock ends at exactly `5000` and `7000`, and the held lock is returned.
- Verification: acceptance `tests/ci/apt-lock.hardening.test.ts::clamps the final sleep so the last check is exactly at the limit`

### SPEC-05: devParts decodes majors of 4096 and above
- Verifies: AC#3
- Behaviour: Given `17592491180357n`, When `devParts` decodes it, Then it returns `{ major: 4097, minor: 74565 }`. Given `makedev(4096, 1)` = `(4096n << 32n) | 1n`, Then it returns `{ major: 4096, minor: 1 }`. `2049n` → `{8, 1}` and `66305n` → `{259, 1}` still hold. A round trip through a test-local glibc `makedev` works for majors `[0, 8, 259, 4095, 4096, 0xfffff]` × minors `[0, 1, 255, 256, 0xfffff, 0xffffffff]`. A source comment documents the kernel 12:20 limit.
- Verification: acceptance `tests/ci/apt-lock.hardening.test.ts::devParts matches glibc for majors of 4096 and above`

### SPEC-06: CI bounds apt's network stalls before any install
- Verifies: AC#4
- Behaviour: Given `.github/workflows/ci.yml`, Then a step named exactly `Bound apt network timeouts` exists. Its only key besides `name` is `run: sudo install -m 0644 tools/ci/apt-network.conf /etc/apt/apt.conf.d/99-ci-network`, and it has no `if:`. It comes before both `Install Playwright browsers` and `Install Playwright system dependencies`, and before `Install dependencies`. Given `tools/ci/apt-network.conf`, Then (ignoring `//` comment lines) it sets `Acquire::http::Timeout`, `Acquire::https::Timeout` and `Acquire::Retries` to integers. Each Timeout is ≥ 5 and ≤ 30, and Retries is ≥ 1 and ≤ 5. `(Retries + 1) × max(Timeout) + Retries × 30 ≤ 240 − 60`, where 240 is the attempt limit parsed from the install run line in ci.yml.
- Verification: acceptance `tests/ci/apt-network.test.ts::bounds apt network timeouts and retries before the Playwright installs`

### SPEC-07: The runner's apt really uses the limits (GitHub Actions Linux only)
- Verifies: AC#4
- Behaviour: Given `process.platform === 'linux' && process.env.GITHUB_ACTIONS === 'true'` (the test is skipped otherwise), When `apt-config dump` runs (no `-c`, so it reads the live `/etc/apt/apt.conf.d`), Then its output contains the lines `Acquire::http::Timeout "15";`, `Acquire::https::Timeout "15";` and `Acquire::Retries "3";`.
- Verification: integration `tests/ci/apt-network.test.ts::the runner apt config contains the network limits`

## 7. Edge cases
- Control characters in the name: SPEC-01. A name read as an empty string after trim is treated as no name (unchanged).
- Long names: `/proc/<pid>/comm` is at most 15 bytes. N/A.
- A signal kill: SPEC-02. A stray positional: SPEC-03. Limit/poll that do not divide: SPEC-04. A fractional poll (0.2 s) is already covered by the locked real-lock test.
- Major ≥ 4096: SPEC-05. It cannot occur on Linux; it is fixed for correctness.
- Stalled vs slow mirror: Timeout cuts only stalls. A steady slow trickle is still bounded only by retry.js's 240 s attempt. Making the whole step faster belongs to TASK-1.39 AC#3. The judge must not count this as a gap in this task.
- A stall that cannot be fixed (the whole mirror is down): apt fails within about 150 s of stalls per file, then retry.js retries. The step still ends inside its 13-minute timeout by the existing locked budget (`workflow.test.ts:114-115`).
- `apt-config` missing locally: SPEC-07 runs only on GitHub Actions.

## 8. Security considerations
- Trust boundary: `/proc/<pid>/comm` can be set by any local process, and it ends up in the job log. Control characters are replaced (SPEC-01), so it cannot inject `::` workflow commands such as `::add-mask::`, `::set-output::` or `::error::` on a new line.
- `sudo install` writes one fixed, repo-tracked file to a fixed path on an ephemeral runner. There is no user input in the command. The token stays `contents: read`.
- No new dependencies, secrets or randomness.

## 9. Non-functional
- One stalled file costs at most about (3 + 1) × 15 s plus backoff, which is ≤ 150 s by the SPEC-06 budget (typically about 70 s). Before this task, one stall could idle 120 s per try.
- The new step adds under 1 s to CI.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/apt-lock.js --wait-seconds 5 stray -- node -e 0` (prints the usage error, exit 2); CI end to end via a branch push
- New tests:
  - `tests/ci/apt-lock.hardening.test.ts` → SPEC-01..05
  - `tests/ci/apt-network.test.ts` → SPEC-06, SPEC-07
- Proven locally: SPEC-01..06, and the locked `workflow.test.ts` and `apt-lock.test.ts` still pass.
- Needs a branch CI run (the orchestrator pushes `doit/TASK-1.30`):
  - (a) the "Bound apt network timeouts" step succeeds with `sudo` on ubuntu-24.04;
  - (b) SPEC-07 passes, not skipped, in the `Test` step, which proves the runner's apt reads the limits;
  - (c) the Playwright install step still goes green.
- Cannot be shown on demand: a real mirror stall. That AC#4 outcome rests on apt's documented Timeout/Retries semantics plus the SPEC-06 budget. The judge should accept a, b and c plus the budget as the proof.
- Judge scenario:
  - Run `npm test`, then `node tools/ci/apt-lock.js --wait-seconds 5 stray -- node -e 0` (expect exit 2 and the usage line).
  - Inspect `ci.yml` and `apt-network.conf`.
  - Check the branch CI run log for (a), (b) and (c).

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.30/qa.md`.
