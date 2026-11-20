# TASK-1.36 changes

- `.github/dependabot.yml` — npm entry: `exclude-patterns: [typescript, typescript-eslint]` on `npm-minor-patch`, new `typescript` group (`typescript`, `typescript-eslint`), and `ignore` rules for semver-major of `@types/node` and `typescript` (spec §5).
- `tests/ci/dependabot.acceptance.test.ts` — TASK-1.24 locked file, user-approved append-only edit (qa.md Q-1): one new `it` pinning the group, exclusion and ignore rules (SPEC-01..03); existing lines unchanged.
- `README.md` — one sentence in `### Dependency updates` describing the `typescript` group and the ignored majors (SPEC-05).

No new dependencies.
