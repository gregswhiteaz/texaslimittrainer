## BUILD (TASK-6.5)
- Extended `parseStyle` with the `startingRange` section (validated against the chart argument, default `SIX_MAX_CHART`), added `rock.json` (text from spec §5, then prettier), `decideRock`, and the worker dispatch (D-4).
- Worked examples verified against the real code; all spec values match: collection seed 65 gives 1,464 seat-1 preflop views, 0 violations. A `views[1]` BTN re-raise QTo, button 1, currentBet 16, betCount 4, owed 4: Rock fold, TAG call 4. B `views[141]` BB limpers QJs, button 5, currentBet 4, betCount 1, owed 0: TAG raise 8, Rock check. C `views[79]` UTG unopened AQo, button 4, owed 4: raise 8 (Rock and TAG). D `views[70]` BB blind-defence A2s, currentBet 8, betCount 2, owed 4: call 4. E without AQo in UTG unopened (14 classes) parses and folds `views[79]`. Per-spot counts and per-position unions (UTG 15/39 … BB 41/169) match D-2. All four SPEC-02 mutations give exactly the spec's problems.
- SPEC-05's per-class sweep builds the "copy without that class" as a `BotStyleData` copy of `ROCK_STYLE` (no re-parse per class); Example E goes through `parseStyle` on the edited JSON.
- Per-test timings, `npx vitest run … --coverage` (local):

| Test | ms |
|---|---|
| rock.acceptance: style file holds a starting range … | 8 |
| rock.acceptance: every Rock range class is a TAG non-fold cell … | 16 |
| rock.acceptance: facing a bet preflop the Rock folds … (includes the 1,000-hand view collection) | 305 |
| rock.acceptance: in the big blind … checks | 11 |
| rock.acceptance: removing a hand class … | 9 |
| rock.acceptance: a Rock seat in the worker … | 9 |
| rock.test: Rock folds or checks outside its range … | 296 |
| rock.test: seated Rocks among seeded TAGs (1,000 hands) | 121 |
| style.test: parseStyle validates starting ranges | 14 |
| advice-service.test: default bot decision dispatches the Rock | 1 |

  Whole new set: under 1 s locally.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (Player actions 88920, violations 0): unchanged.
- `npm test` → 161 files passed / 1 skipped; 568 tests passed / 8 skipped; coverage all files 97.05% stmts, bots 99.59%.
- `npm run lint`, `npm run typecheck` → clean. `npm run format` run. `npm run e2e` → 130 passed, 12 skipped.
- Gate build #1: PASS (1,024 changed lines vs budget 950: warn; 166 of them are prettier's one-key-per-line `rock.json`, 431 the acceptance file).
