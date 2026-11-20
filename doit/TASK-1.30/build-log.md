## BUILD (2026-11-19)
- Implemented SPEC-01..07: holderText cleaning + export, devParts glibc masks + comment, apt-network.conf, CI step, README sentence.
- New tests: tests/ci/apt-lock.hardening.test.ts (5 tests), tests/ci/apt-network.test.ts (1 static + 1 GitHub-Actions-only, skipped locally).
- `npm run format`: ok. `npm run lint`: ok. `npm run typecheck`: ok.
- `npm test`: 92 files passed; 339 tests passed, 6 skipped (Linux/GitHub-CI-only).
- `node tools/ci/apt-lock.js --wait-seconds 5 stray -- node -e 0` → `apt-lock: usage: unexpected argument "stray"`, exit 2.
- Needs branch CI for SPEC-07 and the sudo install step.
