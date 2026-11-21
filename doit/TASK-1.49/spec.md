# Spec: TASK-1.49 — Stop the sandbox-timeout test failing with EPERM

Status: READY (approved 2026-11-20)
Task: TASK-1.49 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.46 / TASK-1.40, doc-46) · Dream: limit-holdem-trainer

## 1. Summary
`runInSandbox` runs `npm run <script>` through `tests/support/process-group-cli.ts`, which prints the
`runProcessGroup` result as JSON on stdout. `runProcessGroup` kills the group with `killGroup` from
`tools/ci/retry.js`. On EPERM, `killGroup` writes the CI log line `retry: could not send SIGKILL to process group N
(EPERM)` to **stdout**. That line ends up in front of the JSON, `JSON.parse` fails, and `runInSandbox` falls back to
`timedOut: false`. That fallback is why the locked test fails at line 59. macOS returns EPERM from `kill(-pgid)`
when the group still has zombie or exiting members, and the signal still reaches every member that can receive
it. So the kill worked, and only the report was corrupted. This task makes `runProcessGroup` use its own quiet
group kill. EPERM and ESRCH are ignored and nothing is written to stdout, so the CLI's JSON stays clean.

## 2. Scope
- In scope:
  - `tests/support/process-group.ts`: replace the `killGroup` import from `tools/ci/retry.js` with a local,
    unexported `killGroupQuietly(pid)`. It sends SIGKILL to `-pid`, ignores ESRCH and EPERM, rethrows anything
    else, and writes nothing.
  - `tests/support/process-group.test.ts`: one new unit test (SPEC-01).
- Not doing:
  - Editing the locked `tests/support/sandbox-timeout.acceptance.test.ts` (TASK-1.39). No cross-story edit is
    needed, because the fault is in the helper.
  - Changing `tools/ci/retry.js`. Its stdout log line and the sudo escalation are correct for CI, and the locked
    and unit tests `tests/ci/retry.reap.test.ts:101,157` and `tests/ci/retry.sudo.test.ts:228` assert them.
  - Changing `sandbox.ts` (JSON parsing, backstop), `process-group-cli.ts`, timeouts, or the
    `ProcessGroupResult` shape.
  - Adding retries, polling or sudo to `runProcessGroup`.
- Scope budget: files=2, lines=60

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | EPERM from `kill(-pgid, SIGKILL)` in test support is ignored silently (no log). | yes | The only consumers are tests. A log line on stdout is the bug itself, and the grandchild's death is asserted directly by the tests. | Log to stderr instead. Rejected: it adds noise and nothing reads it. |
| A-2 | The fix lives in `process-group.ts`, not in `sandbox.ts` (for example, parsing only the last stdout line). | yes | It removes the cause, which is CI log output leaking into the test helper's stdout protocol. Parsing the last line would only hide it. | Make `sandbox.ts` parse the last line. Rejected as a workaround. |

## 3. Current system
- `tests/support/process-group.ts:2` imports `killGroup` from `tools/ci/retry.js`, and calls it at
  `:35` (timeout) and `:43` (after `close`, to sweep leftover group members).
- `tools/ci/retry.js:31`: `const log = (line) => process.stdout.write(...)`. `tools/ci/retry.js:40-52`:
  `killGroup` returns `'denied'` on EPERM after `log(\`retry: could not send ${signal} to process group ${pid} (EPERM)\`)`.
- `tests/support/process-group-cli.ts:14-19` awaits `runProcessGroup` and then writes `JSON.stringify(result)` to
  stdout, the same stream the log line went to.
- `tests/support/sandbox.ts:87-95`: if `JSON.parse(result.stdout)` throws, it returns
  `{ exitCode: -1, output: stdout+stderr, timedOut: <spawnSync ETIMEDOUT> }`, which gives `timedOut: false`.
- Evidence: `doit/TASK-1.46/gates/fix-2.json:23` shows the failure at
  `sandbox-timeout.acceptance.test.ts:59:48`. The message is `retry: could not send SIGKILL to process group 63232
  (EPERM)\n{"exitCode":-1,...,"timedOut":true}`. The CLI really reported `timedOut: true`, and the prefix broke the
  parse.
- Reproduced on this Mac while idle: in 20 detached node trees killed with `process.kill(-pid,'SIGKILL')` on a
  timer and again on `close`, 2 of 20 kills threw EPERM. Under load the window gets wider.
- Other consumer: `tests/ci/speed-limits.acceptance.test.ts:2,25` uses `runProcessGroup` directly. It is
  unaffected, because it does not parse stdout, and quieter kills cannot break it.
- `tests/support/process-group.test.ts` is not locked (checked every `doit/*/state.json` `locked_tests`).
  `tests/support/sandbox-timeout.acceptance.test.ts` is locked by TASK-1.39.
- Tests: Vitest 5 (`vite.config.ts`), `npm test` = `vitest run --coverage`.
- Existing code to reuse:
  - `tests/ci/retry.reap.test.ts:11-38` → the pattern of `realKill = process.kill.bind(process)`, an
    `errno(code)` helper, `vi.spyOn(process, 'kill')` routing negative pids, and
    `vi.spyOn(process.stdout, 'write')` capture. Copy the pattern locally into the unit test (a few lines). Do not
    import it from another test file.
  - `tests/ci/fixtures/flaky-command.js` `hang-tree` mode → a hanging command with a recorded grandchild pid
    (`<state>.child`), already used at `tests/support/process-group.test.ts:33`.
  - `isAlive` / `waitUntilGone` in `tests/support/process-group.test.ts:11-25`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `runProcessGroup` stops importing from `tools/ci/retry.js` and uses a local quiet group kill. | (a) Make `killGroup` accept a logger. (b) Make `sandbox.ts` parse the last stdout line. (c) Loosen the locked test. | (a) touches CI code and its tests. (b) hides the cause. (c) is forbidden and wrong. The local function is about 10 lines. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/support/process-group.ts` — local `killGroupQuietly`, drop the `retry.js` import
- `tests/support/process-group.test.ts` — new unit test for SPEC-01

### Components, interfaces and data
- `function killGroupQuietly(pid: number | undefined): void` (module-private):
  - `pid === undefined` → return.
  - `process.kill(-pid, 'SIGKILL')`. Catch: if `code` is `'ESRCH'` or `'EPERM'`, return. Otherwise rethrow.
  - Never writes to stdout or stderr.
- `runProcessGroup`'s signature, result and timing are unchanged. Both call sites (timer, `close`) use
  `killGroupQuietly(child.pid)`. Update the doc comment to say that EPERM (macOS: the group still has
  zombie/exiting members, and the signal still reached the others) and ESRCH are ignored.

### Rules and algorithms
- Example: timer fires → `kill(-123, SIGKILL)` succeeds → the tree dies → `close` → `kill(-123, SIGKILL)` throws
  EPERM because one member is a zombie → ignored → resolve `{exitCode:-1, output, timedOut:true}`. The CLI then
  prints only the JSON.

### Error handling and configuration
- Errors other than ESRCH/EPERM from `process.kill` (for example EINVAL) propagate as before. No new config.

## 6. Behaviour specification

### SPEC-01: EPERM from the group kill is ignored, prints nothing, and the grandchild still dies
- Verifies: AC#1
- Behaviour: Given `process.kill` is spied so that every negative-pid call first forwards to the real kill
  (ignoring any error it throws) and then throws an `EPERM` errno, and `process.stdout.write` is captured. When
  `runProcessGroup(process.execPath, [STUB, state, '1', 'hang-tree'], { timeoutMs: 500 })` runs. Then it resolves
  to `{ timedOut: true, exitCode: -1 }` (toMatchObject) without throwing, the spy threw EPERM at least once,
  the captured stdout does not contain `could not send`, and the grandchild pid from `<state>.child` is gone
  within 2000 ms (`waitUntilGone`). Restore the mocks in `finally` (`vi.restoreAllMocks()`), and remove the temp
  dir.
- Verification: unit `tests/support/process-group.test.ts::runProcessGroup > ignores an EPERM group kill without printing and still kills the grandchild`

### SPEC-02: the locked sandbox-timeout test passes, unchanged
- Verifies: AC#1
- Behaviour: Given the locked test file is byte-identical to TASK-1.39's locked sha
  (`41ab930e…b66`). When it runs. Then both tests pass: `timedOut` is true, `exitCode` is -1, and the grandchild
  is gone within 2000 ms.
- Verification: acceptance `tests/support/sandbox-timeout.acceptance.test.ts::runInSandbox timeout > a timed-out runInSandbox kills a grandchild that ignores SIGTERM`

### SPEC-03: 10 consecutive runs pass under 3x-core load
- Verifies: AC#2
- Behaviour: Given 3 × `hw.ncpu` busy-looping node processes. When the sandbox-timeout test file runs 10 times in
  a row. Then all 10 runs pass (`passed 10/10`), and no load processes remain afterwards.
- Verification: command `N=$(( $(sysctl -n hw.ncpu) * 3 )); pids=(); for i in $(seq $N); do node -e 'for(;;){}' & pids+=($!); done; ok=0; for r in $(seq 10); do npx vitest run tests/support/sandbox-timeout.acceptance.test.ts && ok=$((ok+1)); done; kill "${pids[@]}"; echo "passed $ok/10"` (run from the project root in bash/zsh; expect the last line `passed 10/10`)

## 7. Edge cases
- EPERM at the timeout kill (not only after `close`): covered by SPEC-01 (the spy throws on every group call).
- ESRCH (group already gone): ignored, as before (`retry.js` returned `'gone'`). Already exercised by the
  existing `returns the exit code and output` test, where the `close` kill usually hits an empty group.
- A real permission denial (a foreign-uid member): cannot happen in test support, because no sudo is used. If it
  did, the grandchild assertion in SPEC-01/SPEC-02 would fail, so it is not hidden.
- Concurrency/interruption/invalid input: N/A. The signature and inputs are unchanged.

## 8. Security considerations
N/A. Test-support code only. No new input, dependency, secret, or privilege (the sudo path stays in CI-only
`retry.js`).

## 9. Non-functional
- SPEC-03: 10 out of 10 under 3 × 14 = 42 busy processes on this Mac. The locked test's own bound is unchanged:
  less than 30 s per run with a 15 s sandbox timeout.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/support/sandbox-timeout.acceptance.test.ts tests/support/process-group.test.ts`
- New tests: `tests/support/process-group.test.ts` → SPEC-01. End to end for the Judge: run the SPEC-03 command
  (expect `passed 10/10`, then confirm with `pgrep -f "for(;;)"` that no load processes are left). Confirm with
  `shasum -a 256` that the locked test sha is unchanged.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.49/qa.md`.
