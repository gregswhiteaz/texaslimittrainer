# Build log — TASK-2.1

## BUILD (round 1)
- Session: grew `SessionConfig` to the D-2 shape with `DEFAULT_SESSION_CONFIG` and `resolveSessionConfig`; the table now seats `config.seats`, deals with `config.button` and checks `config.userSeat` (session, action bar, Table). No enums/parameter properties, so the module still loads under Node type stripping (playtest ran).
- UI: Home, Game Config and Table screens plus `App` screen state; charcoal theme and storyboard styles.
- Cross-story edits: exactly the four D-5 edits (two lines each in `e2e/table.spec.ts` and `e2e/action-bar.spec.ts` `openApp`; the import/render swap in `tests/ui/table.acceptance.test.tsx`; `tests/unit/app.test.tsx` rewritten). No other assertion touched. `npm run typecheck` and `npm run lint` passed after the edits.
- Judgment calls:
  - §5 shows `TableScreen` as `<h1 tabIndex={-1}>`, but the locked TASK-3.1 assertion `toContain('<h1>TLH Trainer</h1>')` needs a plain `<h1>` in server markup. `useHeadingFocus` sets `tabIndex = -1` on the element when it focuses it, which keeps both (A-4 behaviour and the kept assertion). It is one shared hook for three screens (extra file `src/ui/useHeadingFocus.ts`).
  - React 19's `renderToString` adds `<link rel="preload" as="image">` before `<main>` for the logo; the App unit test allows that optional leading link.
  - SPEC-02 "card back's href (same URL)": the built app renders no card back (only face-up user cards), so the test checks (a) the served Home logo bytes have the SHA-256 of `src/assets/tlh-logo.jpg`, (b) the app's served JS references exactly one `.jpg` URL, the Home logo's `currentSrc` (the card back imports the same asset module), and (c) the `CardBack` component's logo href in the existing card gallery harness (inlined data URL) decodes to the same bytes. Plus the 64 × 64 canvas mean difference ≤ 4 against the brand original.
- Commands:
  - `npx vitest run tests/table tests/ui tests/unit` — 17 + 18 tests passed.
  - `npm run typecheck` — pass; `npm run lint` — pass (eslint + prettier).
  - `npx playwright test e2e/home.spec.ts` — 14 passed (7 tests × Chromium, WebKit).
  - `npm run e2e` — 60 passed (Chromium + WebKit), including unchanged `e2e/smoke.spec.ts`.
  - `npm run playtest -- --hands 10000 --seed 42` — Invariant violations: 0.
  - Screenshots via a throwaway Chromium script against `vite preview` (1280x720): `doit/TASK-2.1/home.png`, `doit/TASK-2.1/config.png`.
  - Full `npm test` (coverage) left to the stop-hook gate as the last test run.
