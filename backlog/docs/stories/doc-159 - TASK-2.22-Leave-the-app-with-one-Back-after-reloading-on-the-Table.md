---
id: doc-159
title: 'TASK-2.22: Leave the app with one Back after reloading on the Table'
type: other
created_date: '2026-11-26T11:14:00Z'
updated_date: '2026-11-26T11:14:00Z'
---
# TASK-2.22: Leave the app with one Back after reloading on the Table

Status: Done · Completed: 2026-11-26 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-004.9 (via TASK-2.14, TASK-2.20) · Branch: doit/TASK-2.22

## What was asked
After reloading the page while the Table is shown, then Resume (or Start game) and Home, the user needed two Back presses to leave the app. AC#1: one Back from Home leaves the app (or the extra entry is replaced). Spec: doit/TASK-2.22/spec.md.

The task premise was partly wrong. No page reload happens: the first Back from Home is a silent step onto the earlier load's Table entry, and the app shows nothing different. `docs/ui/navigation.md` claimed that this step reloads the page, and that claim is now corrected.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "A Table entry is current" means `entryKey(history.state)` is a string. **Superseded by the recorded deviation below:** the code now replaces only an earlier page load's entry (key differs from `lastTableKey`). | yes | The only writer of `tlhTable` is `openTable`, always with a 32-hex string. | Change the condition in `openTable`. |
| A-2 | The new tests live in a new every-push file `e2e/reload-history.spec.ts`, not in the locked history specs and not in the slow group. | yes | Each case stops at the deal under the paused clock; it is a behaviour test, and no locked-test edit is needed. | Move the cases into `history.spec.ts` or `pause-history.spec.ts` (needs an unlock). |
| A-3 | "No page reload" is asserted by a `window` marker that survives to Home, plus `history.state === null`, `history.length` equal to its pre-reload value, and one `goBack()` reaching `about:blank`. | yes | With one Back leaving the app there is no intermediate page, so these checks prove no extra entry and no reload. | Count Playwright `load` events (also fires for `about:blank`, so ambiguous). |

Recorded deviation (orchestrator, after CI run 45803095640 failed): the spec's D-1/A-1 replaced whenever any Table entry was current. While `closeTable`'s `history.back()` is still pending, this load's own entry is still current. Replacing it let that pending Back pop the new Table entry, which timed out the WebKit players-choice test. The fix replaces only an earlier load's entry and pushes otherwise. The AC is unchanged and the judge accepted this on substance. See `fix-brief.md`.

## Clarifications and decisions
- Questions asked: none. D-1 (replace instead of push) is covered by the AC's "or the extra entry is replaced" wording.
- D-1: `openTable` replaces a stale Table entry instead of pushing above it (refined by the deviation above).
- D-2: correct the reload paragraphs in `docs/ui/navigation.md`.

## What was built
- `src/ui/App.tsx` → `openTable` calls `history.replaceState({ tlhTable: key }, '')` when the current entry carries a string `tlhTable` key different from `lastTableKey` (an earlier page load's entry). Otherwise it pushes as before. A comment names TASK-2.22.
- `e2e/reload-history.spec.ts` → new acceptance spec, Chromium and WebKit, run on every push:
  - reload, Resume, Home, one Back leaves;
  - reload, Resume, Back on the Table, one more Back leaves;
  - New game, Start game, `End session and start`, Home, one Back leaves.
- `docs/ui/navigation.md` → "Browser Back and Forward": replace rule, no reload when stepping back from an earlier load's entry, the remaining two-Back case, a new reload example, and a Tests entry. The "would reload the page" sentence was removed.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Reload, Resume, Home: one Back leaves | reload-history test 1 (Chromium, WebKit, x5); holdout runs | PASS | length L, state null, marker kept, one goBack reaches about:blank; fails against base (6/6) |
| SPEC-02 | Back on the resumed Table pauses to Home; one more Back leaves | reload-history test 2 | PASS | Home focused, state null, length L |
| SPEC-03 | New game without a reload | reload-history test 3 | PASS | length L, state null, one Back leaves |
| SPEC-04 | Existing history behaviour unchanged | locked history, pause-history, home, home-control, error-recovery specs; players-choice WebKit x10 | PASS | no locked file touched; full e2e 389 passed |
| SPEC-05 | Navigation doc corrected | doc review | PASS | one wording finding J-1-01, fixed |

- `npm test`: 325 files passed, 7 skipped; 1454 tests passed, 52 skipped (opt-in). Lint, typecheck and prettier are clean.
- Full Playwright: 389 passed, 19 skipped, 0 failed. Focused set: 54/54 passed. `reload-history` with `--repeat-each=5`: 30/30.
- The judge's extra checks on both engines (paused and real clock) covered two reloads before Resume, Resume twice, Forward after Home, Back on the Table then Resume and Home, and Leave table then an immediate New game. All passed 5 times in a row.
- Gates: build-1, fix-2, fix-3 and fix-4 all PASS.
- Judge round 1: PASS (5/5). The only finding was J-1-01 (LOW, run-on sentence in the doc), fixed by the orchestrator.

## Review
- Round 1: code review had one NIT, security review had no findings. CI then failed on the race above, which led to the deviation.
- Round 2: code review had two MINORs, both resolved by the orchestrator (doc wording; deviation recorded in `fix-brief.md` and `changes.md`). Security review had no findings: the key is only type-checked and compared, never evaluated or used as a URL.

### Non-blocking review notes (deliberately not fixed)
- NIT (r1) `e2e/reload-history.spec.ts`: in SPEC-01 and SPEC-03 the marker is set after the Home click, so it adds little beyond the state and length assertions. Kept as specified by A-3.
- NIT (r2) `src/ui/App.tsx`: no deterministic test pins the same-load push branch. The race is covered only indirectly and intermittently by `e2e/players-choice.spec.ts:94` in WebKit.
- MINOR (r2) spec.md D-1/A-1 still describe the earlier rule. The deviation is recorded in `fix-brief.md` and the first MINOR was fixed in the doc, but the spec text itself was left as written.

## How to try it
- `npm run build && npx playwright test e2e/reload-history.spec.ts e2e/history.spec.ts e2e/pause-history.spec.ts`
- Manually: start a game, reload, Resume, Home, then press Back once. You should leave the app.

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 2 · judge rounds 1 · gate runs 4 · escalations 0 · changed lines 165 (3 files).

## Known limitations and follow-ups
- Known limitation (spec "Not doing"): reload on the Table, then Back from Home without reopening the Table, still takes two Backs. The first is a silent step onto the stale entry.
- Follow-up candidates:
  - [trainer] Make one Back from Home leave the app after a reload on the Table even if the Table is never reopened (for example, rewrite the stale entry's state on load when the app starts on Home). Owner: TASK-2 family. Low priority; it was deliberately excluded from AC#1.
- Not tracked (race test): a deterministic test for the same-load push branch is hard to build, and the CI players-choice test already caught the real failure once. This is below the value bar.

## Lessons for the factory (proposals — not applied)
- The spec's A-1 rejected the `!== lastTableKey` alternative with reasoning that missed the pending `closeTable` back, and review r1 did not spot it. CI found it. When a spec touches `history` push/replace, it should list the in-flight async history operations (pending `back()`) as a required analysis item.
- The task premise (a reload on the first Back) was wrong. Have the spec stage reproduce the reported symptom before accepting the premise. This run's spec did, which is why the doc claim was caught.
- The spec was not updated after the deviation, which caused a review MINOR. A deviation should patch spec D/A rows in the same step.
