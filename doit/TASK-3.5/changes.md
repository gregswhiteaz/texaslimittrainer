# Changes — TASK-3.5

- `src/assets/tlh-logo.jpg` — created: 512 × 512 JPEG (quality 80, 52,065 bytes) made with `sips -Z 512 -s format jpeg -s formatOptions 80` from `dreams/limit-holdem-trainer/brand/tlh-logo.jpg` (original untouched) (A-3, SPEC-09).
- `src/ui/cards/card-art.ts` — created: card geometry, colours, `SUIT_COLOURS`, `RANK_NAMES`/`RANK_LABELS`/`SUIT_NAMES`, `cardLabel`, original monoline rank-glyph paths and filled suit-symbol paths, `DeckColours` type.
- `src/ui/cards/PlayingCard.tsx` — created: `PlayingCard`, `CardBack`, `DeckColoursContext` (default two-colour), re-exported `DeckColours` (SPEC-01..06, 08).
- `tests/ui/playing-card.acceptance.test.tsx` — created: SPEC-01, SPEC-03, SPEC-04, SPEC-06 markup tests over all 52 cards.
- `tests/ui/card-art.test.ts` — created: labels, glyph widths, SPEC-05, SPEC-08, SPEC-09.
- `e2e/support/card-gallery.tsx` — created: test-only gallery entry (two-colour grid, four-colour grid, card back) (D-4).
- `e2e/support/card-gallery-bundle.ts` — created: `buildCardGallery()` (in-test Vite IIFE build) and `openCardGallery(page, bundle)`.
- `e2e/cards.spec.ts` — created: SPEC-02, SPEC-03, SPEC-04, SPEC-06, SPEC-10 in Chromium and WebKit.
- `e2e/cards.visual.spec.ts` — created: SPEC-07 visual snapshots (skipped off macOS, A-4).
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-chromium-darwin.png` — created: baseline.
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-chromium-darwin.png` — created: baseline.
- `e2e/cards.visual.spec.ts-snapshots/card-back-chromium-darwin.png` — created: baseline.
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-webkit-darwin.png` — created: baseline.
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-webkit-darwin.png` — created: baseline.
- `e2e/cards.visual.spec.ts-snapshots/card-back-webkit-darwin.png` — created: baseline.
- `doit/TASK-3.5/gallery.png` — created: review screenshot of the gallery (all 52 faces in both modes plus the back, Chromium, 2× scale) requested by the orchestrator; not shipped.

No new dependencies.
