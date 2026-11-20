# TASK-1.30 changes

- `tools/ci/apt-lock.js` — `holderText` exported and replaces control characters `[\x00-\x1f\x7f]` in the holder name with `?` (SPEC-01); `devParts` uses glibc's 32-bit masks with a comment on Linux's 12:20 dev_t (SPEC-05).
- `tests/ci/apt-lock.hardening.test.ts` — new acceptance tests for SPEC-01..05 (control-character cleaning, signal-killed exit 1, stray argument usage error, clamped final sleep, devParts for majors >= 4096).
- `tools/ci/apt-network.conf` — new apt config: `Acquire::http(s)::Timeout "15"`, `Acquire::Retries "3"` (SPEC-06).
- `.github/workflows/ci.yml` — new "Bound apt network timeouts" step installing the conf into `/etc/apt/apt.conf.d/99-ci-network` before `npm ci` (SPEC-06).
- `tests/ci/apt-network.test.ts` — new static step/config/budget test (SPEC-06) and GitHub-Actions-only `apt-config dump` check (SPEC-07).
- `README.md` — one sentence on the apt network limits in the CI install paragraph.

No new dependencies.
