# Spec: TASK-3.20 — Make card tests catch painted colour and logo regressions in CI

Status: READY (approved 2026-11-19)
Task: TASK-3.20 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: n/a (follow-up from TASK-3.5 code review, doc-20) · Dream: limit-holdem-trainer

## 1. Summary
TASK-3.5's review found three test gaps (`doit/TASK-3.5/reviews/round-1/code.json:19-29`): the e2e colour checks
read the `<g data-part>` group's computed colour instead of the painted `<path>`, the card-back logo test does not
prove the logo is visible, and the glyph-fit unit test checks hand-written width numbers. Today only the macOS-only
pixel snapshots catch the first two, so Linux CI misses them. This task makes the functional e2e checks read what is
actually painted, adds an e2e "glyph stays inside the card" geometry check (replacing the unit test), and adds a
`Visual` GitHub Actions workflow that runs the card pixel snapshots on Linux inside the official Playwright Docker
image against committed Linux baselines generated in that same image.

## 2. Scope
- In scope:
  - `e2e/cards.spec.ts`: path-level colour check, logo visibility check, glyph-inside-card check, and in-suite
    mutation tests proving each check fails on the regression named in AC#1, AC#2 and AC#4.
  - `e2e/cards.visual.spec.ts`: also runs on Linux when `TLH_VISUAL_LINUX=1` (only set by the new workflow).
  - `.github/workflows/visual.yml` (new): runs the card visual spec in `mcr.microsoft.com/playwright:v<version>-noble`;
    uploads baselines as an artifact when a run fails or when dispatched with `update: true`.
  - Six committed Linux baselines `e2e/cards.visual.spec.ts-snapshots/*-linux.png`, produced by that workflow.
  - `tests/ci/visual-workflow.test.ts` (new): structural checks of `visual.yml` and the baseline files.
  - `tests/ui/card-art.test.ts`: remove the `glyphs fit the card` test (AC#4 "or removed" branch).
  - `README.md`: a short "Card visual baselines" subsection under "Continuous integration".
- Not doing:
  - Any change to `.github/workflows/ci.yml`, `tests/ci/workflow.test.ts` or `tests/ci/branch-protection.acceptance.test.ts`.
    `ci.yml` must stay a single `checks` job (`tests/ci/branch-protection.acceptance.test.ts:12`). Its npm command list
    and `if:` list are asserted exactly (`tests/ci/workflow.test.ts:35-47`, `:63-74`), and `run: npx playwright` is
    forbidden there (`:85`).
  - Making the `Visual` check a required status check in branch protection. That needs repo admin credentials and a
    branch-protection change (A-2).
  - Changing card art, `src/ui/cards/*`, the gallery, or the `RANK_GLYPHS[].width` fields.
  - Changing or deleting the macOS baselines (`*-darwin.png`).
  - Running the rest of the e2e suite in Docker.
- Scope budget: files=12, lines=380   (cards.spec.ts ~+150/−15, cards.visual.spec.ts ~+4/−1, visual.yml ~75, visual-workflow.test.ts ~100, card-art.test.ts −5, README ~20, plus 6 binary PNG baselines)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Linux visual tests run in a **new workflow file** `.github/workflows/visual.yml`, not in `ci.yml` | yes | Purely additive. Leaves the locked `ci.yml` tests untouched (single-job rule, exact npm command list, exact `if:` list, no `run: npx playwright`). Running inside the Docker image needs `container:`, which would apply to the whole `checks` job | Second job in `ci.yml` plus edits to two locked tests; run the snapshots on the bare runner (pixel drift risk between the Docker image and the runner's WebKit libraries) |
| A-2 | The `Visual` check is not added to branch-protection required contexts. A red `Visual` run is visible on every push/PR but does not block merges | yes | Changing protection needs admin `gh api` calls and edits to a locked README test (`tests/ci/branch-protection.acceptance.test.ts:22`). Out of this task's scope | Add `"Card visual snapshots …"` to the contexts (follow-up) |
| A-3 | The visual spec runs when `process.platform === 'darwin'`, or when `process.platform === 'linux'` and `TLH_VISUAL_LINUX === '1'`. It skips everywhere else, including the main `ci.yml` e2e step (that runs on the bare runner, not in Docker) | yes | Linux baselines are only valid in the Docker image. An explicit opt-in env var is easier to see than sniffing the image | Detect `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` |
| A-4 | The Docker image tag is read from `package-lock.json` at run time (a `playwright-version` job, the same `node -p` read as `ci.yml:44`, validated as `^\d+\.\d+\.\d+$`) and used as `mcr.microsoft.com/playwright:v<version>-noble` | yes | A Dependabot bump of `@playwright/test` then uses the matching image automatically, so browsers always match the npm package. If a bump changes rendering, `Visual` fails, which is the right signal. Then regenerate | Hard-code the tag and add a test that it equals the lockfile version (every Playwright bump PR would fail until it is edited by hand) |
| A-5 | "Leaves the card" means some part of a rank or suit path's geometric bounding box, widened by half its computed `stroke-width` when the stroke is not `none`, lies outside the card's 60 × 84 outer `<svg>` rectangle by more than 0.01 CSS px | yes | Round caps and joins (`PlayingCard.tsx:80-81`) reach at most half the stroke beyond the geometry. getBBox + getScreenCTM is engine-independent. Chromium and WebKit disagree on whether getBoundingClientRect counts the stroke | Use the inner 1 px border as the limit; pixel scan |
| A-6 | The glyph-fit unit test is **removed** (`tests/ui/card-art.test.ts:42-45`), because the new e2e check covers it in Chromium and WebKit, including in Linux CI. `RANK_GLYPHS[].width` stays (data, out of scope) | yes | AC#4 allows removal when the e2e geometry check covers it. A unit-level path-bbox check would need an SVG path parser | Keep it and add a path parser |
| A-7 | "Logo visible" means `element.checkVisibility({ opacityProperty: true, visibilityProperty: true })` is true (this covers `display:none`, `visibility:hidden` and opacity 0 on the element or an ancestor), its client rect is non-empty, and its `href` decodes to 512 × 512. "Failed to load" is detected by the decode rejecting | yes | Supported in Chromium and WebKit. No pixel decoding or new dependency needed | Screenshot the logo region and count non-black pixels |
| A-8 | The Linux baselines are produced by the workflow's first run on this branch. A missing baseline makes Playwright write it and fail the test (default `updateSnapshots` mode, `node_modules/playwright/lib/matchers/expect.js:12515-12520`), and the failed run uploads the written PNGs. The orchestrator downloads them, commits them unchanged and pushes, and the next run must pass | yes | Docker is not installed locally (`command -v docker` prints nothing). `workflow_dispatch` only works once `visual.yml` is on `main`. Afterwards `gh workflow run visual.yml --ref <branch> -f update=true` regenerates them | Local Docker; a hand-run dispatch after merge |

## 3. Current system
- Playwright 1.65.1 (`package.json` devDependencies). Projects `chromium` and `webkit` at 1280 × 720, `testDir: ./e2e`,
  and a `webServer` that builds and previews the app (`playwright.config.ts:1-24`). Snapshot names use the default
  `{arg}-{projectName}-{platform}` suffix (existing `e2e/cards.visual.spec.ts-snapshots/*-darwin.png`).
- `e2e/cards.spec.ts`:
  - `faceColours` reads `getComputedStyle` of the `[data-part]` **group** (`:21-29`) and compares it with `TWO_COLOUR`/`FOUR_COLOUR` (`:5-10`).
  - The logo test checks the box size and decodes the href in a separate `Image`, but not visibility (`:73-99`).
  - The geometry test checks the rank/suit height is ≥ 24 px, but not containment (`:40-63`).
- `e2e/cards.visual.spec.ts:6` skips unless `darwin` (TASK-3.5 A-4).
- `src/ui/cards/PlayingCard.tsx`:
  - Rank `<g data-part="rank">` with stroke = suit colour, `fill="none"`, `strokeWidth=4.5`, round caps/joins, one `<path>` (`:73-84`).
  - Suit `<g data-part="suit">` with `fill` = colour, one `<path>` (`:85-92`).
  - Back logo `<image data-part="logo">`, 52 × 52 at (4, 16) (`:125-133`).
- Card codes: `formatCard` returns rank char + suit char, e.g. `2c`, `Ac`, `Kh` (`src/engine/cards.ts:48-53`). Card 0 = `2c`, 1 = `2d`.
- `.github/workflows/ci.yml`:
  - One job on `ubuntu-24.04`, `permissions: contents: read`.
  - SHA-pinned actions: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`, upload-artifact `cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2` (`:20-23`, `:68`).
  - The lockfile Playwright version is read at `:42-44`.
- Dependabot updates github-actions and npm weekly (`.github/dependabot.yml`). It will also update `visual.yml`'s pins.
- Tests: Vitest (`npm test`), Playwright (`npm run e2e`). `tests/support/sandbox.ts` exports `REPO_ROOT` (used at `tests/ci/workflow.test.ts:4`).
- Existing code to reuse:
  - `e2e/support/card-gallery-bundle.ts` → `buildCardGallery`, `openCardGallery` (the gallery and logo-decode wait).
  - `e2e/cards.spec.ts` → the `RED/BLACK/GREEN/BLUE`, `TWO_COLOUR`, `FOUR_COLOUR`, `FACES` constants.
  - `.github/workflows/ci.yml:42-44` → the lockfile version read. `:20-26` → the checkout/setup-node steps and pins.
  - `tests/ci/workflow.test.ts:144-150` → the SHA-pin regex.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Linux visual baselines are generated and compared inside `mcr.microsoft.com/playwright:v<lockfile version>-noble`, run as `--user 1001` (Playwright's documented GitHub Actions setup) | Bare runner | Named by AC#3. The image is Microsoft's official CI-only image, nothing ships to users, and the same image is used to generate and compare, so pixels are deterministic | yes | task AC#3 |
| D-2 | Each check gets a pure "error list" helper (`colourMismatches`, `logoProblems`, `partsOutsideCard`). Real tests assert `[]`. Mutation tests break the DOM in the page and assert the exact list | Only manual mutation runs | Proves inside CI, on every run, that each check fails on the named regression | no | n/a |
| D-3 | On failure, or when dispatched with `update: true`, the workflow uploads the artifacts `card-visual-baselines` (the `*-linux.png` files) and `card-visual-report` (`playwright-report/`), kept 7 days | One artifact with both paths (the artifact layout then changes depending on which paths exist) | Stable layout: the PNGs sit at the artifact root | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/cards.spec.ts` — modify: path-level colours, logo visibility, glyph containment, mutation tests
- `e2e/cards.visual.spec.ts` — modify: skip predicate (A-3)
- `.github/workflows/visual.yml` — new: Linux visual workflow in the Playwright Docker image
- `tests/ci/visual-workflow.test.ts` — new: structure of `visual.yml` and Linux baseline presence
- `tests/ui/card-art.test.ts` — modify: remove `glyphs fit the card`
- `README.md` — modify: "Card visual baselines" subsection
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-chromium-linux.png` — new baseline (from CI artifact)
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-chromium-linux.png` — new baseline (from CI artifact)
- `e2e/cards.visual.spec.ts-snapshots/card-back-chromium-linux.png` — new baseline (from CI artifact)
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-webkit-linux.png` — new baseline (from CI artifact)
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-webkit-linux.png` — new baseline (from CI artifact)
- `e2e/cards.visual.spec.ts-snapshots/card-back-webkit-linux.png` — new baseline (from CI artifact)

### Components, interfaces and data

`e2e/cards.spec.ts` helpers (module-private):

```ts
interface FacePaint {
  card: string;            // data-card, e.g. '2c'
  rankStroke: string[];    // distinct computed `stroke` of every <path> under [data-part="rank"]
  rankFill: string[];      // distinct computed `fill` of those paths
  suitFill: string[];      // distinct computed `fill` of every <path> under [data-part="suit"]
  suitStroke: string[];    // distinct computed `stroke` of those paths
}
async function facePaint(page: Page, section: string): Promise<FacePaint[]>;
function colourMismatches(faces: FacePaint[], expected: Record<string, string>): string[];
async function logoProblems(page: Page): Promise<string[]>;
async function partsOutsideCard(page: Page, section: string): Promise<string[]>;
```

- `colourMismatches` returns entries `"<card> <field>"`, with `field` one of `rankStroke | rankFill | suitFill | suitStroke | paths`, in DOM order:
  - `rankStroke` and `suitFill` must each equal `[expected[suitChar]]`.
  - `rankFill` and `suitStroke` must each equal `['none']`.
  - Both path counts must be ≥ 1, else `"<card> paths"`.
- `logoProblems` evaluates on `[data-testid="card-back"] image[data-part="logo"]` and returns a subset of `['missing', 'hidden', 'empty box', 'not decoded']`, in that order:
  - `missing` — no element. The other checks are then skipped.
  - `hidden` — `checkVisibility({ opacityProperty: true, visibilityProperty: true })` is false.
  - `empty box` — the client rect width or height is 0.
  - `not decoded` — `new Image()` with the element's `href` rejects on `decode()`, or its natural size is not 512 × 512.
- `partsOutsideCard` checks every `svg[data-card]` in the section, for each part `rank` then `suit`:
  - Take every `<path>` inside the part, its `getBBox()` widened by `h = strokeWidth/2` (0 when the computed stroke is `none`), mapped through `getScreenCTM()` (`x' = a·x + c·y + e`, `y' = b·x + d·y + f`, all four corners).
  - Compare with the `<svg>`'s `getBoundingClientRect()`.
  - Return `"<card> <part>"` when any corner lies outside by more than 0.01 px, in DOM order.

`e2e/cards.visual.spec.ts` skip predicate (A-3):

```ts
const runsHere =
  process.platform === 'darwin' ||
  (process.platform === 'linux' && process.env.TLH_VISUAL_LINUX === '1');
test.skip(!runsHere, 'card baselines exist for macOS and for Linux in the Playwright Docker image (Visual workflow)');
```

The rest of the file is unchanged.

`.github/workflows/visual.yml` (exact shape; reuse the action SHAs from `ci.yml`):

```yaml
name: Visual

on:
  push:
  pull_request:
  workflow_dispatch:
    inputs:
      update:
        description: Regenerate the Linux card baselines and upload them as an artifact
        type: boolean
        default: false

permissions:
  contents: read

concurrency:
  group: visual-${{ github.event_name }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  playwright-version:
    name: Read Playwright version
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    outputs:
      version: ${{ steps.read.outputs.version }}
    steps:
      - name: Check out
        uses: actions/checkout@<sha> # v7.0.1
      - name: Read Playwright version
        id: read
        run: |
          version=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test'].version")
          [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "bad Playwright version: $version"; exit 1; }
          echo "version=$version" >> "$GITHUB_OUTPUT"
  cards:
    name: Card visual snapshots (Linux, Playwright Docker image)
    needs: playwright-version
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    container:
      image: mcr.microsoft.com/playwright:v${{ needs.playwright-version.outputs.version }}-noble
      options: --user 1001
    env:
      TLH_VISUAL_LINUX: '1'
    steps:
      - name: Check out            # checkout pin
      - name: Set up Node from .nvmrc   # setup-node pin, node-version-file: .nvmrc, cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Card visual tests
        if: ${{ !inputs.update }}
        run: npm run e2e -- e2e/cards.visual.spec.ts
      - name: Regenerate card baselines
        if: ${{ inputs.update }}
        run: npm run e2e -- e2e/cards.visual.spec.ts --update-snapshots=all
      - name: Upload card baselines
        if: failure() || inputs.update
        uses: actions/upload-artifact@<sha> # v7.0.2
        with:
          name: card-visual-baselines
          path: e2e/cards.visual.spec.ts-snapshots/*-linux.png
          retention-days: 7
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@<sha> # v7.0.2
        with:
          name: card-visual-report
          path: playwright-report/
          retention-days: 7
```

No `continue-on-error`, `|| true` or `set +e`.

### Rules and algorithms
- Colour example: two-colour `Kh` → `{rankStroke:['rgb(180, 35, 24)'], rankFill:['none'], suitFill:['rgb(180, 35, 24)'], suitStroke:['none']}` → no mismatch.
  - With `stroke="#00FF00"` set on `2c`'s rank `<path>`: `rankStroke:['rgb(0, 255, 0)']` → `'2c rankStroke'`.
  - With `style="fill:#00FF00"` on `2d`'s suit `<path>`: `suitFill:['rgb(0, 255, 0)']` → `'2d suitFill'`.
- Containment example: `Ac` rank group with `transform="translate(50 6)"`. The A glyph spans x 1..16 plus a 2.25 stroke, so the right edge is at 68.25 > 60 → `'Ac rank'`.
  - `Kh` suit group with `transform="translate(40 48)"`. The heart spans x 0..30, so the right edge is at 70 → `'Kh suit'`.
  - Unmodified faces: the widest rank (`10`) reaches x ≈ 33.75 and suits sit in x 24..54, y 48..78. No entries.
- Baseline bootstrap and update (README text):
  - The first `Visual` run with a missing baseline writes it and fails.
  - Download it with `gh run download <run-id> -n card-visual-baselines -D <dir>`.
  - Copy the `*-linux.png` files into `e2e/cards.visual.spec.ts-snapshots/` unchanged and commit.
  - After `visual.yml` is on `main`, regenerate with `gh workflow run visual.yml --ref <branch> -f update=true`, then download the same way.

### Error handling and configuration
- `TLH_VISUAL_LINUX` is only read by `e2e/cards.visual.spec.ts`. Its only effective value is `'1'`.
- A bad lockfile version stops the `playwright-version` job with `bad Playwright version: <v>`.

## 6. Behaviour specification

### SPEC-01: Colour check reads the painted path
- Verifies: AC#1
- Behaviour: Given the card gallery in Chromium or WebKit, When `facePaint`/`colourMismatches` run on `faces-two-colour` and `faces-four-colour`, Then each section has 52 faces and the mismatch list is `[]`; And Given `stroke="#00FF00"` set on `2c`'s rank `<path>` and inline `style="fill:#00FF00"` on `2d`'s suit `<path>` in `faces-two-colour`, When the check runs, Then it returns exactly `['2c rankStroke', '2d suitFill']`
- Verification: acceptance `e2e/cards.spec.ts::two-colour deck colours in the browser`, `e2e/cards.spec.ts::four-colour deck colours in the browser`, `e2e/cards.spec.ts::colour check fails when a path is painted differently from its group`

### SPEC-02: Logo check fails when the logo is not visible
- Verifies: AC#2
- Behaviour: Given the gallery, When `logoProblems` runs, Then it returns `[]` (the existing box-size checks stay); And Given, each on a freshly opened gallery, (a) `opacity="0"` on the logo `<image>`, (b) inline `style="display:none"` on it, (c) its `href` replaced with `data:image/jpeg;base64,AAAA`, When `logoProblems` runs, Then it returns (a) `['hidden']`, (b) `['hidden', 'empty box']`, (c) `['not decoded']`
- Verification: acceptance `e2e/cards.spec.ts::card back shows the decoded TLH logo`, `e2e/cards.spec.ts::logo check fails when the logo is hidden or does not load`

### SPEC-03: Glyph containment checked on the drawn shapes
- Verifies: AC#4
- Behaviour: Given all 104 faces, When `partsOutsideCard` runs on each section, Then it returns `[]`; And Given `transform="translate(50 6)"` on `Ac`'s rank group and `transform="translate(40 48)"` on `Kh`'s suit group in `faces-two-colour`, When it runs, Then the sorted result is exactly `['Ac rank', 'Kh suit']`; And `tests/ui/card-art.test.ts` no longer contains `glyphs fit the card`
- Verification: acceptance `e2e/cards.spec.ts::rank and suit paths stay inside the card`, `e2e/cards.spec.ts::containment check fails when a glyph leaves the card`

### SPEC-04: Visual workflow runs the card snapshots on Linux in the Playwright image
- Verifies: AC#3
- Behaviour: Given `visual.yml`, When parsed as text, Then:
  - it triggers on `push`, `pull_request` and `workflow_dispatch`, with a boolean `update` input defaulting to `false`, and has no branch or path filters;
  - it has `permissions: contents: read`;
  - the `cards` job's image is exactly `mcr.microsoft.com/playwright:v${{ needs.playwright-version.outputs.version }}-noble` with `options: --user 1001`, and the version is read from `package-lock.json` and checked against `^[0-9]+\.[0-9]+\.[0-9]+$`;
  - it sets `TLH_VISUAL_LINUX: '1'`;
  - its npm run commands are, in order, `npm ci`, `npm run e2e -- e2e/cards.visual.spec.ts`, `npm run e2e -- e2e/cards.visual.spec.ts --update-snapshots=all`;
  - every `uses:` is pinned to a 40-hex SHA with a `# vX.Y.Z` comment;
  - it never contains `continue-on-error`, `|| true` or `set +e`.
  And `e2e/cards.visual.spec.ts-snapshots/` contains `{faces-two-colour,faces-four-colour,card-back}-{chromium,webkit}-linux.png` (6 files)
- Verification: unit `tests/ci/visual-workflow.test.ts::visual workflow`

### SPEC-05: Linux CI actually runs and passes the visual tests
- Verifies: AC#3
- Behaviour: Given the committed Linux baselines on the pushed branch, When the `Visual` workflow runs, Then the `cards` job concludes `success` and its log reports `2 passed` (chromium + webkit) with no skipped tests; And Given the main `ci.yml` e2e step on the bare runner, Then `cards.visual.spec.ts` is still skipped there and every other card e2e test runs
- Verification: command `gh run list --workflow visual.yml --branch doit/TASK-3.20 --limit 1 --json conclusion --jq '.[0].conclusion'` prints `success`, and `gh run view <id> --log | grep -E '2 passed'` matches with no `skipped`

### SPEC-06: macOS behaviour preserved
- Verifies: AC#3
- Behaviour: Given macOS without `TLH_VISUAL_LINUX`, When `npm run e2e` runs, Then `cards.visual.spec.ts` runs against the unchanged `*-darwin.png` baselines and passes, and all `cards.spec.ts` tests pass in both projects
- Verification: command `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts`

## 7. Edge cases
- Missing baseline (first run, or a new browser project): Playwright writes it and fails, and the artifact is uploaded (A-8). This is intended. Covered by the SPEC-05 bootstrap.
- A Playwright version bump changes rendering: `Visual` fails, and you regenerate through dispatch. The image always follows the lockfile (A-4).
- A logo hidden through an ancestor (e.g. the `<svg>` at opacity 0): `checkVisibility` covers ancestors. Mutation tests cover the three AC cases only.
- Multiple paths per part: the helpers iterate all paths. Today there is one per part (`PlayingCard.tsx:83`, `:91`).
- A fork PR: the workflow has read-only permissions and no secrets. Works as is.
- Concurrency: `cancel-in-progress` per ref, mirroring `ci.yml:11-13`.
- Interruption, permissions, invalid input: N/A, no runtime input.

## 8. Security considerations
- New CI-only container image `mcr.microsoft.com/playwright` (official Microsoft image, named by AC#3). It is not pinned by digest. Its tag follows the lockfile version. It never ships to users. The job has a read-only token and no secrets.
- Expression injection: no `${{ }}` expression is interpolated into any shell `run`. The image tag comes from a job output that was validated against a strict semver regex before it was written. `inputs.update` is a typed boolean used only in `if:`.
- Actions are SHA-pinned (asserted by SPEC-04). No new npm dependencies. No randomness or sensitive data.

## 9. Non-functional
- `Visual` workflow wall time ≤ 15 min (job timeout). Expected ~3–5 min including the image pull.
- Added `cards.spec.ts` time ≤ 10 s per project (gallery opens: 3 extra for the logo mutants plus 2 more).
- `npm test` stays green with no coverage change (only a test is removed).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts` locally. On CI, push the branch and check `gh run list --workflow visual.yml --branch doit/TASK-3.20`.
- New tests:
  - `e2e/cards.spec.ts` (acceptance, locked) → SPEC-01, SPEC-02, SPEC-03
  - `tests/ci/visual-workflow.test.ts` (unit) → SPEC-04
- Build procedure (needs the orchestrator):
  1. The builder commits code and tests without Linux baselines. `tests/ci/visual-workflow.test.ts`'s baseline assertion fails until step 3.
  2. Push. The `Visual` run fails with "A snapshot doesn't exist … writing actual" and uploads `card-visual-baselines`.
  3. `gh run download <id> -n card-visual-baselines -D /tmp/tlh-baselines`. Copy the 6 PNGs into `e2e/cards.visual.spec.ts-snapshots/`, commit and push.
  4. The second `Visual` run must pass (SPEC-05). CI must stay green.
- End-to-end scenario for the Judge:
  1. Run `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts` on macOS.
  2. In a scratch copy, add `stroke="#00ff00"` on the rank `<path>` in `PlayingCard.tsx` and `opacity={0}` on the logo `<image>`. Confirm the colour and logo tests fail in Chromium.
  3. Inspect the latest green `Visual` run on the branch: 2 passed, 0 skipped.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-3.20/qa.md` (no questions: the Docker image is named by AC#3. Other points are A-1…A-8).
