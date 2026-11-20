# TASK-1.39 changes

- `tools/ci/apt-lock.js` — AC#1: new export `dpkgInterrupted(dir)` (non-empty dpkg updates journal; missing dir = false) and `--dpkg-updates <dir>` option (default `/var/lib/dpkg/updates`). After the lock wait and before the command, an interrupted dpkg runs `sudo -n dpkg --configure -a`; a failure logs `::warning::apt-lock: sudo -n dpkg --configure -a failed (exit code N); running <command> anyway` and the command still runs.
- `tests/ci/apt-lock.dpkg.acceptance.test.ts` — new AC#1 tests SPEC-01..04 (fake `sudo` on PATH), plus a `dpkgInterrupted` unit check.
- `tests/support/process-group-cli.ts` — new CLI: runs one command through `runProcessGroup` and prints `{exitCode, output, timedOut}` as JSON (exit 2 on bad usage).
- `tests/support/sandbox.ts` — AC#2: `runInSandbox` runs `npm run` through the CLI (sync `spawnSync` with a `timeoutMs + 15 s` backstop and 64 MiB maxBuffer), so a timeout kills the whole process group; new optional `{ timeoutMs }` and `SandboxResult.timedOut`; falls back to `exitCode: -1` with the CLI output if the CLI fails.
- `tests/support/sandbox-timeout.acceptance.test.ts` — new AC#2 tests SPEC-05 (grandchild ignoring SIGTERM is killed at a 15 s timeout) and SPEC-06 (normal run returns exit code and output).
- `.github/workflows/ci.yml` — AC#3 option (a): "Read month stamp" step, "Cache apt archives" (pinned actions/cache, path `~/.cache/apt-archives`, key `apt-archives-<os>-pw<version>-<YYYY-MM>`, restore-key prefix), "Restore apt archives" before the installs and "Collect apt archives" after them; no `if:`, install run lines unchanged.
- `tests/ci/apt-archives-cache.test.ts` — new static check SPEC-07 of the cache wiring and the unchanged install limits.
- `README.md` — CI paragraph: dpkg recovery and the apt archive cache.

No new dependencies.
