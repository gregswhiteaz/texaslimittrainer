---
id: doc-20
title: 'TASK-3.5: Read big-index cards drawn in code'
type: other
created_date: '2026-11-18T20:31:00Z'
updated_date: '2026-11-18T20:31:00Z'
---
# TASK-3.5: Read big-index cards drawn in code

Status: Done (judge and CI pending at time of writing) · Completed: 2026-11-18 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: REQ-066 (also REQ-050.4 colours, REQ-057.1, REQ-058.1, REQ-061.3, REQ-067.3) · Branch: doit/TASK-3.5

To see the look, open `doit/TASK-3.5/gallery.png` (all 52 faces in both deck modes plus the card back).

## What was asked
As a learner I want cards drawn in code as big-index SVG (large rank plus large suit symbol, no face-card art) so I can read them instantly at Rapid speed. Ranks at least 24 CSS px tall at 1280 x 720; two-colour deck (hearts/diamonds red, spades/clubs black) and four-colour deck (clubs green, diamonds blue, hearts red, spades black); card backs show the TLH logo. Standalone component, no table yet. Spec: doit/TASK-3.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Code in `src/ui/cards/` (art data + components); tests in `tests/ui/` and `e2e/` | yes | Follows the TASK-1.1 test layout; keeps long path data out of the component | Move files; one `Card.tsx` |
| A-2 | One standard card size, 60 x 84 CSS px, for hole cards and board; no size prop | yes | AC#2 measures the hole-card/board size; later stories consume it as is | Add a `size` prop |
| A-3 | Logo ships as `src/assets/tlh-logo.jpg`, 512 x 512 JPEG q80 (52,065 bytes) made with macOS `sips` from the 1024 px brand original; imported through Vite (hashed file in `dist/assets/`); no `public/` | yes | Quarter of the original weight; enough for 2x card backs and a splash | Swap the file (original is 191 KB) |
| A-4 | Visual baselines committed for macOS only; `e2e/cards.visual.spec.ts` skips on other platforms, so Linux CI does not run the pixel comparison | yes | No Docker/Linux baselines available to the builder; cross-OS anti-aliasing would flake | Follow-up F-1 |
| A-5 | Invalid `card` (not integer 0-51) throws `RangeError('Invalid card: <value>')`, same as `formatCard` | yes | Engine bugs should fail loudly | Render blank card |
| A-6 | Rank height measured as the glyph group's geometric bounding box (stroke excluded) | yes | Conservative and font-independent | Pixel scan |
| A-7 | `deck` prop overrides `DeckColoursContext`; context default is `'two-colour'` | yes | REQ-050.4 default is off; TASK-12.7 only needs a provider | Prop only / context only |
| A-8 | Interface: `PlayingCard({ card, deck? })`, `CardBack()`, `DeckColoursContext`, fixed size (the orchestrator's D-5 call: internal props, reversible, so assumed not asked) | yes | No consumers yet | Change props when TASK-3.1/3.3 need it |

## Clarifications and decisions
Questions asked and answered by the user (all picked the recommended option):
- Q-1 Card face design: big corner rank top-left plus one large suit bottom-right, 60 x 84, face `#FAFAF7` with 1 px `#A7AEB8` border, ranks and suits as SVG paths (no text, no fonts), ten shown as "10", accessible names like "Ace of spades" / "Face-down card" (D-1).
- Q-2 Suit colours: storyboard colours, red `#B42318`, black `#111111`, four-colour clubs `#1D6B35`, diamonds `#1D4ED8` (D-2).
- Q-3 Card back: black `#000000` fill, 2 px `#D7262E` inset frame, full logo centred 52 x 52 (D-3).
- Q-4 Where cards show before the table exists: test-only gallery built inside the e2e tests; nothing new ships in the app (D-4).
- D-5 (orchestrator, not asked): component interface classified as an assumption, recorded as A-8.

## What was built
- `src/assets/tlh-logo.jpg` — 512 px logo derivative, the app's first image asset.
- `src/ui/cards/card-art.ts` — geometry, colour tables (`SUIT_COLOURS`), `RANK_NAMES`/`RANK_LABELS`/`SUIT_NAMES`, `cardLabel`, original monoline rank-glyph paths and filled suit paths.
- `src/ui/cards/PlayingCard.tsx` — `PlayingCard`, `CardBack`, `DeckColoursContext`, `DeckColours`. A face is an `<svg role="img" aria-label="Ace of spades">` with one rank group and one suit group of `<path>`s, colour set as `stroke`/`fill` on the group; no image/text/foreignObject. The back holds the logo `<image>` inside a black rect with a red frame.
- Usage: `<PlayingCard card={51} />`, `<PlayingCard card={1} deck="four-colour" />`, `<CardBack />`; wrap in `DeckColoursContext.Provider` to switch the whole deck.
- Test-only: `e2e/support/card-gallery.tsx` and `card-gallery-bundle.ts` (in-test Vite IIFE build, same pattern as `e2e/replay-seed.spec.ts`).
- No change to `App.tsx`, `main.tsx`, `index.html`, engine, bots, advice or stats. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Vitest markup test over 52 cards x 2 modes | pass | `tests/ui/playing-card.acceptance.test.tsx` |
| SPEC-02 | AC#1, AC#2 | Playwright, Chromium + WebKit, 1280 x 720, DSF 1; `boundingBox` and `getBBox x CTM` of all 104 rank/suit groups >= 24 px | pass | `e2e/cards.spec.ts` |
| SPEC-03/04 | AC#3, AC#4 | Markup and computed-colour tests in both decks | pass | acceptance + e2e |
| SPEC-05, 08, 09 | defaults, invalid input, logo asset | unit tests | pass | `tests/ui/card-art.test.ts` |
| SPEC-06 | AC#5 | Markup test; browser check that logo is >= 48 px and decodes to 512 x 512 | pass | acceptance + e2e |
| SPEC-07 | DoD#1 | Visual snapshots, 6 macOS baselines | pass locally; skipped off macOS | `e2e/cards.visual.spec.ts` |
| SPEC-10 | DoD#8, #9 | axe zero serious/critical; no http(s) requests | pass | `e2e/cards.spec.ts` |
| SPEC-11 | DoD#2, 3, 5, 6 | lint, typecheck, `npm test`, `npm run e2e` | pass | gates/build-2.json |
| SPEC-12 | DoD#11, #12 | CI on branch; doc published | CI pending; doc published | — |
| SPEC-13 | N/A items | no engine/bots/advice/App/main changes | pending judge | — |

- `npm test`: 54 files, 203 passed, 1 skipped; coverage 99.84% statements overall. `npm run e2e`: 24 passed (Chromium + WebKit).
- Gate run 1 FAILED on the scope-line budget: 2,602 changed lines against 950. Cause was the doit tool counting newline bytes in the new binary files (JPEG and PNG baselines). The tool was fixed to skip binaries; gate run 2 passed with the real size, 714 lines (budget 950, 15 of 15 files).
- Judge: pending. CI: pending.

## Review
Round 1, both reviewers, no BLOCKER or MAJOR findings. The code reviewer confirmed: all glyphs legible in `gallery.png` (6 vs 9 distinct, Q has a tail, "10" fits), the AC#2 measurement is genuine (DSF and viewport asserted; scaling the glyph to 0.8 or 0.5 fails the test), the gallery is not in the app bundle, and 8 mutants were caught (glyph scaled down, four-colour swap, context default, prop override ignored, label typo, validation removed, among them). Security reviewer: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `e2e/cards.spec.ts:25` reads the colour of the `<g>` group, not the painted `<path>`. A colour set on a path is caught only by the macOS visual snapshot, so Linux CI would miss it.
- MINOR: `e2e/cards.spec.ts:76` proves the logo decodes and its box is >= 48 px, not that it is painted. `opacity=0` passes the functional test; only the visual snapshot catches it.
- NIT: `tests/ui/card-art.test.ts:41` "glyphs fit the card" checks hand-written width fields, not drawn shapes; `RANK_GLYPHS[].width` is unused by the component.
- NIT: `PlayingCard.tsx:44` validates the card twice (`formatCard` then `cardLabel`); harmless.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run e2e`
- `npx playwright test e2e/cards.spec.ts e2e/cards.visual.spec.ts --project=chromium`, then open `playwright-report/index.html`.
- Cards are not reachable in the app until TASK-3.1; look at `doit/TASK-3.5/gallery.png`.

## Run metrics
Questions asked 4 · assumptions logged 8 · review rounds 1 (0 blocking findings) · judge rounds pending · gate runs 2 (1 false fail from the tool) · escalations 0 · changed lines 714 (budget 950).

## Known limitations and follow-ups
- Make the colour e2e read the painted `<path>` (or both group and path) so Linux CI catches path-level colour overrides — needs `e2e/cards.spec.ts` unlocked; owner: this task's test, or TASK-3.1.
- Add a logo-painted assertion (computed opacity 1 and visibility visible, or a centre-pixel check) to the card-back e2e — needs `e2e/cards.spec.ts` unlocked.
- Replace the glyph-fit unit test with one that checks drawn path geometry, or drop it and rely on SPEC-02 (`tests/ui/card-art.test.ts`).
- F-1: Generate Linux visual baselines in the Playwright Docker image and drop the macOS-only skip in `e2e/cards.visual.spec.ts` (owner: E13 CI/offline work or a new task).
- F-2: Wire `DeckColoursContext` to the persisted Deck colours setting at the app root — TASK-12.7.
- F-3: Add a smaller card-back marker size for bot seats — TASK-3.3.
- F-4: Reuse `src/assets/tlh-logo.jpg` for the splash and Home — TASK-2.12 — and derive app icons from it — E13 (TASK-13.12).

## Lessons for the factory (proposals — not applied)
- The scope-line gate counted newline bytes in new binary files (JPEG, PNG baselines) and failed with 2,602 lines against a real 714. Fixed in the tool during this run; add a regression test for binary files in the gate's line counter.
- Locked e2e tests cannot be improved after review finds a MINOR gap in them. Consider a rule that lets the orchestrator unlock a locked test for review-found test-strength findings without a send-back.
