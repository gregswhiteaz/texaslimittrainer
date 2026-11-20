## BUILD (2026-11-19)
- Implemented SPEC-01..07: holderText cleaning + export, devParts glibc masks + comment, apt-network.conf, CI step, README sentence.
- New tests: tests/ci/apt-lock.hardening.test.ts (5 tests), tests/ci/apt-network.test.ts (1 static + 1 GitHub-Actions-only, skipped locally).
- `npm run format`: ok. `npm run lint`: ok. `npm run typecheck`: ok.
- `npm test`: 92 files passed; 339 tests passed, 6 skipped (Linux/GitHub-CI-only).
- `node tools/ci/apt-lock.js --wait-seconds 5 stray -- node -e 0` → `apt-lock: usage: unexpected argument "stray"`, exit 2.
- Needs branch CI for SPEC-07 and the sudo install step.

## FIX (2026-11-19)
- Item 1 [MAJOR] SPEC-07 Acquire::Retries not effective: fixed. CI step now `sudo tee -a /etc/apt/apt.conf < tools/ci/apt-network.conf > /dev/null` (same name/position, one run line, no `if:`), so apt reads the values last; SPEC-06 static check updated to the new run line; SPEC-07 failure message now lists every `apt-config dump` line matching `/Acquire::(Retries|https?::Timeout)/`; README sentence says the conf is appended to `/etc/apt/apt.conf`.
- `npm run format`/`lint`/`typecheck`: ok. `npm test`: 92 files passed; 339 passed, 6 skipped. SPEC-07 still needs branch CI.
