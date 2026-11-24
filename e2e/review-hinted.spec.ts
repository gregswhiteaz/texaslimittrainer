import { expect, test, type Locator, type Page } from '@playwright/test';
import { advanceToHand, handOver, storedRecords } from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { buildRecordsHarness, openRecordsHarness } from './support/table-harness-bundle';

// Helpers copied from e2e/hinted.spec.ts (locked; TASK-8.2). A review entry shows a "hinted" tag iff its
// stored decision is hinted (TASK-9.6).

const ORIGIN = 'http://localhost:4173';
/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
/** A-5: the hands searched for a fitting hand. */
const MAX_HANDS = 5;
const GRADES = ['Correct', 'Minor error', 'Major error'];

const hintToggle = (page: Page) => page.locator('button.hint-toggle');
const tableRegion = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const reviewPanel = (page: Page, handNumber: number) =>
  page.getByRole('complementary', { name: `Hand #${handNumber} review` });

async function actionCount(page: Page): Promise<number> {
  return Number(await tableRegion(page).getAttribute('data-action-count'));
}

/** Selects Hint and waits for a ready card. */
async function openReadyHint(page: Page): Promise<void> {
  await hintToggle(page).click();
  await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
}

/** Selects Hint, then Hide hint. */
async function openAndHideHint(page: Page): Promise<void> {
  await hintToggle(page).click();
  await expect(hintToggle(page)).toHaveText('Hide hint');
  await hintToggle(page).click();
  await expect(hintToggle(page)).toHaveText('Hint');
}

/** Check if offered, else the call; waits until it is applied. */
async function checkOrCall(page: Page): Promise<void> {
  const before = await actionCount(page);
  const check = enabledActions(page).filter({ hasText: /^Check$/ });
  await ((await check.count()) > 0 ? check : enabledActions(page).filter({ hasText: /^Call / }))
    .first()
    .click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
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

/**
 * Plays hand `handNumber` by checking or calling; `hint(street, index)` runs before the user's `index`-th
 * decision (0-based) and returns whether it opened a Hint. Returns the indexes of the hinted decisions.
 */
async function playHand(
  page: Page,
  handNumber: number,
  hint: (street: string, index: number) => Promise<boolean>,
): Promise<number[]> {
  await advanceToHand(page, handNumber, () => page.clock.runFor(50));
  const hinted: number[] = [];
  for (let index = 0; (await nextTurnOrResult(page)) === 'turn'; index++) {
    const street = (await tableRegion(page).getAttribute('data-street')) ?? '';
    if (await hint(street, index)) hinted.push(index);
    await checkOrCall(page);
  }
  return hinted;
}

/** The stored decisions of hand `handNumber`, once its record is written. */
async function storedDecisions(
  page: Page,
  handNumber: number,
): Promise<{ street: string; hinted: boolean }[]> {
  let decisions: { street: string; hinted: boolean }[] | undefined;
  await expect
    .poll(async () => {
      const record = (await storedRecords(page)).find((r) => r.handNumber === handNumber);
      decisions = record?.decisions as typeof decisions;
      return decisions !== undefined;
    })
    .toBe(true);
  return decisions ?? [];
}

async function dealNext(page: Page): Promise<void> {
  const deal = page.getByRole('button', { name: 'Deal next hand' });
  if ((await deal.count()) > 0) await deal.click();
}

interface ShownEntry {
  street: string;
  grade: string;
  tags: string[];
}

/** Waits for hand `handNumber`'s review and returns each entry's street, grade text and hinted tags. */
async function reviewEntries(page: Page, handNumber: number): Promise<ShownEntry[]> {
  const panel = reviewPanel(page, handNumber);
  await runUntil(page, async () => (await panel.count()) > 0, {
    label: `no review for hand ${handNumber}`,
  });
  await expect(panel).toBeVisible();
  return panel
    .getByRole('list', { name: 'Decisions' })
    .locator('li[data-entry]')
    .evaluateAll((lis) =>
      lis.map((li) => ({
        street: li.getAttribute('data-street') ?? '',
        grade: li.querySelector('[data-part="grade"]')?.textContent ?? '',
        tags: [...li.querySelectorAll('[data-part="hinted"]')].map((t) => t.textContent ?? ''),
      })),
    );
}

async function layoutOf(panel: Locator): Promise<{ overflow: number; outside: number }> {
  return panel.evaluate((aside) => {
    const box = aside.getBoundingClientRect();
    const outside = [...aside.querySelectorAll('[data-part="hinted"]')].filter((tag) => {
      const r = tag.getBoundingClientRect();
      return r.left < box.left || r.right > box.right;
    }).length;
    return { overflow: aside.scrollWidth - aside.clientWidth, outside };
  });
}

let bundle: string;
test.beforeAll(async () => {
  bundle = await buildRecordsHarness();
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
});

test('opening Hint at the flop tags only the flop entry in the review', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openRecordsHarness(page, bundle, WORDS);

  let handNumber = 0;
  let hinted: number[] = [];
  while (hinted.length === 0) {
    handNumber += 1;
    expect(handNumber, `no user flop decision in hands 1-${MAX_HANDS}`).toBeLessThanOrEqual(
      MAX_HANDS,
    );
    if (handNumber > 1) await dealNext(page);
    let opened = false;
    hinted = await playHand(page, handNumber, async (street) => {
      if (street !== 'flop' || opened) return false;
      await openReadyHint(page);
      opened = true;
      return true;
    });
    if (hinted.length === 0) {
      const decisions = await storedDecisions(page, handNumber);
      if (decisions.length > 0) {
        const earlier = await reviewEntries(page, handNumber);
        expect(earlier.flatMap((e) => e.tags)).toEqual([]);
      }
    }
  }

  const entries = await reviewEntries(page, handNumber);
  const decisions = await storedDecisions(page, handNumber);
  const [index] = hinted as [number];
  expect(decisions.length).toBeGreaterThanOrEqual(2);
  expect(entries).toHaveLength(decisions.length);
  expect(entries[index]?.street).toBe('flop');
  entries.forEach((e, i) => {
    expect(e.tags, `entry ${i + 1}`).toEqual(i === index ? ['hinted'] : []);
    expect(GRADES, `entry ${i + 1} grade`).toContain(e.grade);
  });
  decisions.forEach((d, i) => expect(d.hinted, `decision ${i}`).toBe(i === index));

  const panel = reviewPanel(page, handNumber);
  const layout = await layoutOf(panel);
  expect(layout.overflow).toBeLessThanOrEqual(0);
  expect(layout.outside).toBe(0);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('hint opened and hidden at the first decision tags only the first review entry', async ({
  page,
}) => {
  await openRecordsHarness(page, bundle, WORDS);

  for (let handNumber = 1; ; handNumber++) {
    expect(
      handNumber,
      `no hand with 2+ user decisions in hands 1-${MAX_HANDS}`,
    ).toBeLessThanOrEqual(MAX_HANDS);
    if (handNumber > 1) await dealNext(page);
    const hinted = await playHand(page, handNumber, async (_street, index) => {
      if (index !== 0) return false;
      await openAndHideHint(page);
      return true;
    });
    const decisions = await storedDecisions(page, handNumber);
    if (hinted.length === 0 || decisions.length < 2) continue;

    const entries = await reviewEntries(page, handNumber);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries).toHaveLength(decisions.length);
    entries.forEach((e, i) => expect(e.tags, `entry ${i + 1}`).toEqual(i === 0 ? ['hinted'] : []));
    expect(decisions.map((d) => d.hinted)).toEqual(decisions.map((_, i) => i === 0));
    return;
  }
});
