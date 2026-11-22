# Fix brief — TASK-7.5 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/advice/recommend.ts:exact-options-bypassed-by-style-only-variable (code review)
- Where: src/advice/recommend.ts:13
- Problem: The exact-keys guard does not reject an options variable that carries only bot keys (no advice key). D-4 says the guard rejects a bot's style or parameters 'for literals and for variables', and REQ-035.3 wants that to be a compile error. Because O is constrained `extends RecommendOptions` (an all-optional weak type), a variable such as `{ style: TAG_STYLE }` or `{ random: botRandom(1) }` fails the constraint, so inference falls back to O = RecommendOptions. ExactOptions<RecommendOptions, RecommendOptions> is `RecommendOptions & Record<never, never>`, and that intersection is not checked as a weak type, so the variable is accepted. The SPEC-08 literal `{ style: 'Maniac' }` is only rejected by the excess-property check after that same fallback, not by ExactOptions. recommendPostflop (postflop.ts:62) and gradeView (grade.ts:144) have the same gap.
- Evidence: Scratch tsc project (/tmp/t75check, extends the repo tsconfig). These compile with no error: `const styleOnly = { style: 'Rock' }; recommend(view, styleOnly);`, `const r = { random: botRandom(1) }; recommend(view, r); gradeView(view, 'call', r);`, `const extra = { random: 1 } as const; recommend(view, { ...extra });`. These are correctly rejected: `recommend(view, maniacOptions)`, `gradeView(view, 'call', stationOptions)`, `recommendPostflop(view, stationOptions)`, and a variable `{ style: 'Maniac', equity: undefined }`.
- Expected fix: Loosen the constraint so inference keeps the caller's keys, and intersect with Allowed so the value types are still checked: `export type ExactOptions<O, Allowed> = O & Allowed & Readonly<Record<Exclude<keyof O, keyof Allowed>, never>>;` with `<O extends object = RecommendOptions>` on recommend and gradeView, and `<O extends object = PostflopOptions>` on recommendPostflop. Verified in the scratch project: this rejects `{style}` and `{random}` variables, CallingStationOptions, and `{ equity: 5 }`. It still accepts `RecommendOptions | undefined` (the tag-playtest mock signature), `{ opponentRanges: 'actions' }`, no argument, and spreads of RecommendOptions. Add one `@ts-expect-error` line to a non-locked test, e.g. tests/advice/ranges.test.ts: `const styleOnly = { style: TAG_STYLE }; recommend(view, styleOnly)`. Explicit type arguments (`recommend<RecommendOptions>(view, x)`) and variables already widened to RecommendOptions can't be caught structurally. That is acceptable, but say so in the ExactOptions doc comment.


## Also (MINORs, strengthen-only, in this round)
- tests/advice/ranges.test.ts: `classify('Ah Kd', '5c 6d 7h 8s')` → 'air' (open-ender needs a hole card in the run).
- tests/advice/ranges.test.ts: a check-raise opponent's combos equal 'raise' narrowing (raise > bet aggregation).
- Add `@ts-expect-error` cases for a style-only variable and a `{ random }`-only variable in a NON-locked test file
  (tests/advice/ranges.test.ts or a new unit test file), for recommend, recommendPostflop and gradeView.
If any file you need is locked, write blocked.json. Bots must stay unchanged (playtest SHA 442dbf55…08fbc).
