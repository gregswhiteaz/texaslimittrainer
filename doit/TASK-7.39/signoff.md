# Sign-off package — TASK-7.39

Base `ff79ebdd` (git worktree) vs branch `doit/TASK-7.39` working tree. Apple M4 Pro, Node 22.18.0, `CI` unset,
2026-11-27. Q-1 = A: with 7 or more live opponents, the user's calling-range equity is sampled from 10,000 deals
(was 30,000). Spots with 6 or fewer opponents reuse an identical run, so their advice stays byte-identical.

## 1. Speed

CPU-time p95 (ms), 20 runs after 15 warm-ups. Headroom limit = 75% of target.

Headroom passes (base: `-t "headroom|actions-mode"`, because the base headroom test does not time the actions spot;
branch: `-t headroom`):

| Scenario | Limit | Base 1 | Base 2 | Base 3 | Branch 1 | Branch 2 | Branch 3 |
|---|---|---|---|---|---|---|---|
| actions: 6-max flop facing a bet, one opponent | 18.75 | 21.25 | 21.35 | 21.77 | 9.93 | 10.00 | 10.00 |
| HU flop facing a bet | 18.75 | 9.33 | 9.44 | 9.25 | 9.66 | 9.34 | 9.40 |
| 9-seat flop vs 8 opponents | 75 (base: 150) | 131.53 | 131.47 | 131.04 | 65.81 | 65.99 | 66.33 |

All 3 branch passes: `Tests 1 passed`, every scenario within its limit.

Full file at scale 1 (`ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts`), one run each:

| Scenario | Target | Base | Branch |
|---|---|---|---|
| HU flop facing a bet | 25 | 9.48 | 9.82 |
| 6-max flop vs 3 opponents | 50 | 19.74 | 19.53 |
| 10-seat flop vs 9 opponents | 100 | 53.82 | 54.05 |
| 10-seat flop checked to the SB vs 9 opponents (value-bet) | 100 | 53.28 | 53.55 |
| actions: 6-max flop facing a bet, one opponent | 25 | 19.68 | 10.22 |
| actions: 6-max flop vs 3 opponents | 50 | 23.17 | 23.72 |
| headroom: 9-seat flop vs 8 opponents | 150 → 75 | 131.33 | 66.12 |
| headroom: HU flop facing a bet | 18.75 | 9.41 | 9.37 |
| headroom: actions spot | 18.75 | — | 10.04 |

Both runs: `Tests 4 passed (4)`.

## 2. Bots and seeded runs

SHA-256 of `npm run -s playtest -- <args>` stdout. Every run exited 0.

| Args | Base | Branch | Same |
|---|---|---|---|
| (defaults) | d4d84efb02d49242388de13a4d0e39a1824d0f575badf4f1b2dd81b53cb22992 | d4d84efb02d49242388de13a4d0e39a1824d0f575badf4f1b2dd81b53cb22992 | yes |
| `--size 9` | b8c9e16c7a54768ff48d126610697aad58e23bb88258bec348b3e7f8f20183f9 | b8c9e16c7a54768ff48d126610697aad58e23bb88258bec348b3e7f8f20183f9 | yes |
| `--size 10` | 2788394b23387b653d42bc4a5afe74d45ec7b73a274eeebf6a429c7fb2a035da | 2788394b23387b653d42bc4a5afe74d45ec7b73a274eeebf6a429c7fb2a035da | yes |
| `--lineup mixed --size 9` | 129863c82826551e21deb5c6533d088c8ca321591cdaac06449975a104cd13ce | 129863c82826551e21deb5c6533d088c8ca321591cdaac06449975a104cd13ce | yes |
| `--lineup soft --size 10` | 2b209e6455fe14811548b0884a17b8146a8602e0dd8a9641eba5728cdb847018 | 2b209e6455fe14811548b0884a17b8146a8602e0dd8a9641eba5728cdb847018 | yes |
| `--game sng` | 9da4206254161b60b975a8d2211629eb22ceb9891dfaf45569903ef11e0b8e58 | 9da4206254161b60b975a8d2211629eb22ceb9891dfaf45569903ef11e0b8e58 | yes |
| `--check-advice --hands 2000 --size 9` | 8a7ede6c8c169c91b8db03258b615460a10397f92589e3fd0c264fa23fac3e81 | 8a7ede6c8c169c91b8db03258b615460a10397f92589e3fd0c264fa23fac3e81 | yes |
| `--check-advice --hands 2000 --size 10` | e17f45bab88528da827c49594e717f5734794401a548b89d41d43c0b1bb1feec | e17f45bab88528da827c49594e717f5734794401a548b89d41d43c0b1bb1feec | yes |

All identical, as expected: bots inject `BOT_EQUITY`, which takes the unchanged path. Nothing to explain.

## 3. User advice delta

`node --import ./tools/playtest/resolve-ts.js doit/TASK-7.39/advice-delta.ts <baseWorktree> .`. Every seat plays
calling-station, seed 7390, 3,000 hands per size, up to 300 postflop views per bucket. Each view is advised with
`ACTION_RANGE_ADVICE` on both trees. "Fallback flips" count views where the calling number equals `equityPct` on
one side only. This includes coincidental equality (for example 10-seat 7cKh on Qh5c4d: 5.3 / 5.3 → 5.3 / 5.5).

| Size | Opponents | Views | Differing | Max abs Δ calling (pts) | Mean abs Δ calling | Action / ruleId flips | Fallback flips | Explanation changes |
|---|---|---|---|---|---|---|---|---|
| 9 | < 7 | 300 | 0 | 0.0 | 0.000 | 0 / 0 | 0 | 0 |
| 9 | ≥ 7 | 300 | 168 | 0.9 | 0.133 | 0 / 0 | 8 | 162 |
| 10 | < 7 | 300 | 0 | 0.0 | 0.000 | 0 / 0 | 0 | 0 |
| 10 | ≥ 7 | 300 | 146 | 1.1 | 0.106 | 0 / 0 | 6 | 143 |

The < 7 bucket shows 0 differences at both sizes (AC#1). In the ≥ 7 bucket, only the calling-range number (and the
explanation text that quotes it) moves, by at most 1.1 points. No recommended action or rule changes.
`equityPct` is unchanged everywhere.

Changed ≥ 7 views (first 20; equity / calling, before → after):

| Size | Hero | Board | Opponents | Numbers | Action |
|---|---|---|---|---|---|
| 9 | JdTc | Ks5h3d | 8 | 3 / 5 → 3 / 4.9 | check → check |
| 9 | Kh9s | Ks5h3d | 8 | 14.5 / 13.6 → 14.5 / 13.4 | check → check |
| 9 | AcJc | Ks5h3d | 8 | 4 / 3.2 → 4 / 2.9 | check → check |
| 9 | 5d8s | Ks5h3d | 8 | 11.4 / 5.8 → 11.4 / 6 | check → check |
| 9 | 8d7c | Ks5h3d | 8 | 4.4 / 3.9 → 4.4 / 3.8 | check → check |
| 9 | TsQs | Ks5h3d | 8 | 7.5 / 8 → 7.5 / 7.8 | check → check |
| 9 | Kc6c | Ks5h3d | 8 | 23.3 / 8.9 → 23.3 / 9.1 | check → check |
| 9 | 8c4h | Ks5h3d | 8 | 4.2 / 3.3 → 4.2 / 3.5 | check → check |
| 9 | AcJc | Ks5h3d3h | 8 | 2.9 / 1.3 → 2.9 / 1.2 | check → check |
| 9 | 5d8s | Ks5h3d3h | 8 | 13 / 3 → 13 / 2.9 | check → check |
| 9 | 7c9h | TsKh5s | 7 | 2.9 / 3.2 → 2.9 / 3.3 | check → check |
| 9 | AhKc | TsKh5s | 7 | 24.1 / 17.3 → 24.1 / 17 | check → check |
| 9 | 8h2c | TsKh5s | 7 | 0.7 / 0.5 → 0.7 / 0.4 | check → check |
| 9 | AsTh | TsKh5s | 7 | 18.8 / 11.4 → 18.8 / 11.7 | check → check |
| 9 | Ad2d | TsKh5s | 7 | 3 / 3.2 → 3 / 3 | check → check |
| 9 | Ks6s | TsKh5s | 7 | 46 / 36.1 → 46 / 36.4 | check → check |
| 9 | AhKc | TsKh5s3c | 7 | 39 / 30.3 → 39 / 30 | check → check |
| 9 | AsTh | TsKh5s3c | 7 | 16.7 / 7.1 → 16.7 / 7.2 | check → check |
| 9 | 2sTc | TsKh5s3c | 7 | 11.1 / 5.5 → 11.1 / 5.6 | check → check |
| 9 | Ad2d | TsKh5s3c | 7 | 7 / 7.4 → 7 / 7.6 | check → check |

Size 10 examples (first 20 of 146) include: QsQc on Qh5c4d, 8 opponents, 74.1 / 58 → 74.1 / 57.6, bet → bet;
9c6s on 6d6c7sKc9h, 7 opponents, 100 / 96.2 → 100 / 96.4, bet → bet; the rest are checks with |Δ| ≤ 0.4.

## 4. Tests

- `npm test`: exit 0. 354 files passed, 11 skipped; 1567 tests passed, 60 skipped.
- `npm run test:slow`: exit 0. 27 files, 114 tests passed.
- SPEC-08 locked seeded tests: 14 files, 342 passed, 3 skipped. `TLH_SLOW_TESTS=1` games + maniac: 11 passed.
- `git diff --stat ff79ebdd -- tests e2e` lists `tests/advice/postflop.perf.test.ts` (21+/14−) plus the two new
  untracked files `tests/advice/calling-run-identity.acceptance.test.ts` and `tests/advice/postflop-calling-run.test.ts`.
  No locked test or golden JSON changed.

## 5. Decision for the user

- **Approve**: 10,000 calling-range deals at 7+ opponents. The 9-seat spot runs at about 66 ms (limit 75). User
  advice changes only in 7+-way pots, by at most 1.1 points on the calling-range number, with no action changes in
  the sample.
- **Approve with a different trial count or opponent threshold** (for example 8,000 trials, or 8+ opponents only):
  the builder re-runs the measurements and refreshes this package.
- **Reject**: AC#2 is not met, and the orchestrator blocks the task.
