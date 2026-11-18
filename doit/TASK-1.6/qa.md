# Q&A — TASK-1.6

## Q-1 — Playtest CLI options and report (public interface, user-visible output)
Asked 2026-11-18. Options: approve §5 design (Recommended) / drop replay mode / JSON report.
**Answer (user):** Approve as designed (Recommended) — --hands, --seed, --size, --replay-code + --button replay mode, --help; exit 0/1/2; fixed error and USAGE text; `Label: value` report lines in §5 order; replay mode prints the hand.

## Q-2 — Replay codes and seat randomness from --seed
Asked 2026-11-18. Options: seed + hand number (Recommended) / one random stream / hash seed + hand.
**Answer (user):** Seed + hand number (Recommended) — hand k's code = replayCodeFromWords([floor(seed/2^32), seed mod 2^32, 0, k]); seat generator Xoshiro128(fnv1a32(code + '/' + seat)).

## Q-3 — How `npm run playtest` runs TypeScript
Asked 2026-11-18. Options: Node built-in type stripping + resolve hook, no new dependency (Recommended) / add tsx / build then run.
**Answer (user):** Node built-in, no new dep (Recommended) — `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts`; engines.node raised to >=22.18.0 (A-7).
