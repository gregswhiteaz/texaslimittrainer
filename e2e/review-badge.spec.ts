import { expect, test, type Page } from '@playwright/test';
import { advanceToHand, handOver, header, storedRecords } from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import type { RecordsHarnessLog } from './support/records-harness';
import { buildRecordsHarness, openRecordsHarness } from './support/table-harness-bundle';

// TASK-9.7: with auto-open off (records harness, autoOpen: false) a hand that would open the review shows a
// grade summary badge instead; the next hand still deals 1.5 s after the result unless the badge is clicked.

const ORIGIN = 'http://localhost:4173';
/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
/** The hands searched for a fitting hand. */
const MAX_HANDS = 5;
const BADGE_TEXT = /^(All correct|\d+ Major(, \d+ Minor)?|\d+ Minor)$/;

const badge = (page: Page) => page.locator('button.review-badge');
const tableRegion = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const reviewPanel = (page: Page, handNumber: number) =>
  page.getByRole('complementary', { name: `Hand #${handNumber} review` });
const dealNextButton = (page: Page) => page.getByRole('button', { name: 'Deal next hand' });

async function actionCount(page: Page): Promise<number> {
  return Number(await tableRegion(page).getAttribute('data-action-count'));
}

/** Clicks the enabled action button named `name`; waits until it is applied. */
async function clickAction(page: Page, name: RegExp): Promise<void> {
  const before = await actionCount(page);
  await enabledActions(page).filter({ hasText: name }).first().click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

/** Check if offered, else the call. */
async function checkOrCall(page: Page): Promise<void> {
  const texts = await enabledActions(page).allTextContents();
  await clickAction(page, texts.includes('Check') ? /^Check$/ : /^Call /);
}

/** Runs fake slices until it is the user's turn ('turn') or the hand's result is shown ('over'). */
function nextTurnOrResult(page: Page): Promise<'turn' | 'over'> {
  return runUntil(
    page,
    async () => {
      if ((await handOver(page).count()) > 0) return 'over';
      return (await enabledActions(page).count()) > 0 ? 'turn' : null;
    },
    { label: 'nextTurnOrResult: no turn or result' },
  );
}

/** Waits for hand `handNumber` and plays it to its result by checking or calling; returns the decisions. */
async function playHand(page: Page, handNumber: number): Promise<number> {
  await advanceToHand(page, handNumber, () => page.clock.runFor(50));
  let decisions = 0;
  for (; (await nextTurnOrResult(page)) === 'turn'; decisions++) await checkOrCall(page);
  return decisions;
}

/** Plays check-or-call until a hand ends after at least one user decision; returns its number. */
async function playToDecidedHand(page: Page): Promise<number> {
  for (let handNumber = 1; ; handNumber++) {
    expect(handNumber, `no user decision in hands 1-${MAX_HANDS}`).toBeLessThanOrEqual(MAX_HANDS);
    if ((await playHand(page, handNumber)) > 0) return handNumber;
  }
}

/** The stored grades of hand `handNumber`, polled in real time until its record is written. */
async function storedGrades(page: Page, handNumber: number): Promise<string[]> {
  let grades: string[] | undefined;
  await expect
    .poll(
      async () => {
        const record = (await storedRecords(page)).find((r) => r.handNumber === handNumber);
        const decisions = record?.decisions as { grade: { grade: string } }[] | undefined;
        grades = decisions?.map((d) => d.grade.grade);
        return grades !== undefined;
      },
      { intervals: [50] },
    )
    .toBe(true);
  return grades ?? [];
}

/** The A-2 rule, worked out independently of src/table/review.ts. */
function badgeText(grades: readonly string[]): string {
  const major = grades.filter((g) => g === 'major').length;
  const minor = grades.filter((g) => g === 'minor').length;
  const parts = [
    ...(major > 0 ? [`${major} Major`] : []),
    ...(minor > 0 ? [`${minor} Minor`] : []),
  ];
  return parts.join(', ') || 'All correct';
}

/** Runs the clock until hand `handNumber + 1` is dealt; returns the gap between the result and the deal. */
async function dealGap(page: Page, handNumber: number): Promise<number> {
  const next = `Hand #${handNumber + 1}`;
  await runUntil(page, async () => ((await header(page).textContent()) ?? '').endsWith(next), {
    label: `hand ${handNumber + 1} not dealt`,
  });
  const { events } = await page.evaluate((): RecordsHarnessLog => window.__records);
  const dealt = events.findIndex((e) => e.event === `header:${handNumber + 1}`);
  const result = events.slice(0, dealt).findLast((e) => e.event === 'result');
  if (dealt < 0 || result === undefined) throw new Error('No result or deal event');
  return (events[dealt]?.at ?? Infinity) - result.at;
}

let bundle: string;
test.beforeAll(async () => {
  bundle = await buildRecordsHarness();
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
});

test('with auto-open off a badge replaces the panel and the next hand deals after 1.5 s', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openRecordsHarness(page, bundle, WORDS, { autoOpen: false });

  const handNumber = await playToDecidedHand(page);
  await expect(badge(page)).toBeVisible();
  const grades = await storedGrades(page, handNumber);
  expect(grades.length).toBeGreaterThan(0);
  const shown = (await badge(page).textContent()) ?? '';
  expect(shown).toBe(badgeText(grades));
  expect(shown).toMatch(BADGE_TEXT);
  await expect(badge(page)).toHaveAttribute('aria-label', `Open hand review: ${shown}`);
  await expect(reviewPanel(page, handNumber)).toHaveCount(0);
  await expect(dealNextButton(page)).toHaveCount(0);
  await expect(header(page)).toHaveText(new RegExp(`Hand #${handNumber}$`));
  await axeWithPausedClock(page);

  const gap = await dealGap(page, handNumber);
  expect(gap).toBeGreaterThanOrEqual(1400);
  expect(gap).toBeLessThanOrEqual(1600);
  await expect(badge(page)).toHaveCount(0);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('clicking the badge opens the review for that hand and waits for Deal next hand', async ({
  page,
}) => {
  await openRecordsHarness(page, bundle, WORDS, { autoOpen: false });

  const handNumber = await playToDecidedHand(page);
  await expect(badge(page)).toBeVisible();
  const grades = await storedGrades(page, handNumber);
  await badge(page).click();

  const panel = reviewPanel(page, handNumber);
  await expect(panel).toBeVisible();
  await expect(panel.locator('li[data-entry]')).toHaveCount(grades.length);
  await expect(badge(page)).toHaveCount(0);

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveText(new RegExp(`Hand #${handNumber}$`));
  await expect(dealNextButton(page)).toBeVisible();

  await dealNextButton(page).click();
  await runUntil(
    page,
    async () => ((await header(page).textContent()) ?? '').endsWith(`Hand #${handNumber + 1}`),
    { label: `hand ${handNumber + 1} not dealt` },
  );
  await expect(badge(page)).toHaveCount(0);
  await expect(page.getByRole('complementary')).toHaveCount(0);
});

test('a lone preflop fold shows no badge', async ({ page }) => {
  await openRecordsHarness(page, bundle, WORDS, { autoOpen: false });

  for (let handNumber = 1; ; handNumber++) {
    expect(handNumber, `no foldable first turn in hands 1-${MAX_HANDS}`).toBeLessThanOrEqual(
      MAX_HANDS,
    );
    await advanceToHand(page, handNumber, () => page.clock.runFor(50));
    if ((await nextTurnOrResult(page)) === 'over') continue;
    const texts = await enabledActions(page).allTextContents();
    if (!texts.includes('Fold')) {
      await checkOrCall(page);
      while ((await nextTurnOrResult(page)) === 'turn') await checkOrCall(page);
      continue;
    }
    await expect(tableRegion(page)).toHaveAttribute('data-street', 'preflop');
    await clickAction(page, /^Fold$/);
    await nextTurnOrResult(page).then((step) => expect(step).toBe('over'));

    expect(await storedGrades(page, handNumber)).toHaveLength(1);
    await expect(badge(page)).toHaveCount(0);
    await expect(handOver(page)).toBeVisible();

    const gap = await dealGap(page, handNumber);
    expect(gap).toBeGreaterThanOrEqual(1400);
    expect(gap).toBeLessThanOrEqual(1600);
    return;
  }
});

test('with auto-open on the panel opens and no badge is shown', async ({ page }) => {
  await openRecordsHarness(page, bundle, WORDS);

  const handNumber = await playToDecidedHand(page);
  await expect(reviewPanel(page, handNumber)).toBeVisible();
  await expect(badge(page)).toHaveCount(0);
  await page.clock.runFor(5000);
  await expect(badge(page)).toHaveCount(0);
  await expect(header(page)).toHaveText(new RegExp(`Hand #${handNumber}$`));
});
