import { expect, test, type Page } from '@playwright/test';
import { advanceToHand, handOver, storedRecords } from './support/hand-records';
import { runUntil, runUntilMyTurn } from './support/paused-clock';
import type { RecordsHarnessLog } from './support/records-harness';
import { buildRecordsHarness, openRecordsHarness } from './support/table-harness-bundle';

// A decision is stored as hinted iff Hint was selected at it before acting (TASK-8.2).

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
/** A-5: the hands searched for a user flop decision. */
const MAX_HANDS = 5;

const hintToggle = (page: Page) => page.locator('button.hint-toggle');
const tableRegion = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableRegion(page).getAttribute('data-action-count'));
}

/** Selects Hint and waits for a ready card. */
async function openReadyHint(page: Page): Promise<void> {
  await hintToggle(page).click();
  await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
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
 * Plays hand `handNumber` by checking or calling; `hintAt(street, index)` says whether to open a ready Hint
 * before the user's `index`-th decision (0-based). Returns the indexes of the hinted decisions.
 */
async function playHand(
  page: Page,
  handNumber: number,
  hintAt: (street: string, index: number) => boolean,
): Promise<number[]> {
  await advanceToHand(page, handNumber, () => page.clock.runFor(50));
  const hinted: number[] = [];
  for (let index = 0; (await nextTurnOrResult(page)) === 'turn'; index++) {
    const street = (await tableRegion(page).getAttribute('data-street')) ?? '';
    if (hintAt(street, index) && hinted.length === 0) {
      await openReadyHint(page);
      hinted.push(index);
    }
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

const userDecisionCount = async (page: Page, handNumber: number): Promise<number | undefined> =>
  (await page.evaluate((): RecordsHarnessLog => window.__records)).observed[handNumber - 1]?.length;

async function dealNext(page: Page): Promise<void> {
  const deal = page.getByRole('button', { name: 'Deal next hand' });
  if ((await deal.count()) > 0) await deal.click();
}

let bundle: string;
test.beforeAll(async () => {
  bundle = await buildRecordsHarness();
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await openRecordsHarness(page, bundle, WORDS);
});

test('opening Hint at the flop stores only the flop decision as hinted', async ({ page }) => {
  let handNumber = 0;
  let hinted: number[] = [];
  while (hinted.length === 0) {
    handNumber += 1;
    expect(handNumber, `no user flop decision in hands 1-${MAX_HANDS}`).toBeLessThanOrEqual(
      MAX_HANDS,
    );
    if (handNumber > 1) await dealNext(page);
    hinted = await playHand(page, handNumber, (street) => street === 'flop');
  }

  const decisions = await storedDecisions(page, handNumber);
  await expect.poll(() => userDecisionCount(page, handNumber)).toBe(decisions.length);
  const [index] = hinted as [number];
  expect(decisions.length).toBeGreaterThanOrEqual(2);
  expect(decisions[index]?.street).toBe('flop');
  expect(decisions[0]?.street).toBe('preflop');
  decisions.forEach((d, i) => expect(d.hinted, `entry ${i}`).toBe(i === index));
});

test('a hint opened three times and hidden again marks one decision hinted', async ({ page }) => {
  await runUntilMyTurn(page);
  for (let i = 0; i < 3; i++) {
    await hintToggle(page).click();
    await expect(hintToggle(page)).toHaveText('Hide hint');
    await hintToggle(page).click();
    await expect(hintToggle(page)).toHaveText('Hint');
  }
  await checkOrCall(page);
  await playHand(page, 1, () => false);

  const decisions = await storedDecisions(page, 1);
  await expect.poll(() => userDecisionCount(page, 1)).toBe(decisions.length);
  expect(decisions[0]?.hinted).toBe(true);
  expect(decisions.filter((d) => d.hinted)).toHaveLength(1);
});
