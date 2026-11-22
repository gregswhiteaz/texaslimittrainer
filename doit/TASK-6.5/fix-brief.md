# Fix brief — TASK-6.5 (code review round 1 MINOR + NIT, strengthen-only, in-story)

1. **MINOR** `tests/bots/rock.acceptance.test.ts` (unlocked for this): in the SPEC-05 per-class sweep, build each
   "Rock without class X" style by editing a copy of the raw rock.json data and running it through
   `parseStyle(raw, 'rock.json')`, instead of copying ROCK_STYLE. Keep every assertion; keep the test under ~1 s locally.
2. **NIT** `tests/bots/rock.test.ts`: make the postflop no-bet test observe the free-check shortcut — pass an `equity`
   function that throws and assert the Rock still checks.
Record timings in build-log.md. `npm run format` before the gate. Never push.
