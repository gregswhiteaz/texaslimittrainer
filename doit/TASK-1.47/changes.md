# TASK-1.47 changes

- `tools/ci/apt-archives.js` — new: `restore` (sha256-verifies cached .deb files against `apt-cache show` before `sudo -n cp`) and `collect` (rebuilds the cache with only archives installed at that exact version per `dpkg-query`); exported parsers.
- `.github/workflows/ci.yml` — "Restore apt archive cache" (`actions/cache/restore`), new "Update apt index" step, new Restore/Collect run lines, "Save apt archive cache" (`actions/cache/save`) right after Collect.
- `tests/ci/apt-archives.acceptance.test.ts` — new: CLI behaviour with fake `apt-cache`, `dpkg-query`, `sudo` (SPEC-01..04).
- `tests/ci/apt-archives.test.ts` — new: parser unit tests (SPEC-05).
- `tests/ci/apt-archives-cache.test.ts` — rewritten wiring assertions for the new steps (SPEC-06; approved cross-story edit D-2).
- `tests/ci/workflow.test.ts` — pin regex widened by one optional path segment (approved cross-story edit D-3; prettier wrapped the line).
- `README.md` — CI paragraph: hash verification, pruning and early save.

No new dependencies (`actions/cache/restore` and `actions/cache/save` are the same pinned repository and commit as `actions/cache`).
