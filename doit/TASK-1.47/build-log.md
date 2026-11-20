## BUILD (2026-11-20)
- Added `tools/ci/apt-archives.js` (restore/collect + parsers), rewired ci.yml per spec §5 (restore/update/restore/installs/collect/save/E2E, no new `if:`), wrote SPEC-01..05 tests, rewrote SPEC-06 wiring test (D-2), widened the pin regex (D-3), updated README CI paragraph.
- Fakes log their arguments with `printf '%s\n'` (sh `echo` expands `\t` on dash/macOS sh).
- `npm run format` ok; `npm run lint` ok; `npm run typecheck` ok; `npm test`: 100 files, 360 passed, 6 skipped.
- SPEC-07 (live runner) is manual and needs a branch push; not run here.
