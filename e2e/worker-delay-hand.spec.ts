import { expect, test, type Page } from '@playwright/test';
import { delayWorkerReplies, runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const REPLY_DELAY_MS = 2000;
/** Every bot decision left in the hand waits REPLY_DELAY_MS real (about 6 s measured), so allow headroom. */
const HAND_REAL_MS = 30_000;

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

/** Paused clock, every advice-worker reply REPLY_DELAY_MS late, pinned deal, New game → Start game, fold. */
async function foldDelayedHand(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(delayWorkerReplies, REPLY_DELAY_MS);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(tableSection(page)).toBeVisible();
  await runUntilMyTurn(page);
  await expectToAct(page, '5');
  await page
    .getByRole('group', { name: 'Your actions' })
    .getByText('Fold', { exact: true })
    .click();
  await expect(enabledActions(page)).toHaveCount(0);
}

test('with every worker reply 2 s late runUntil plays the hand to its end', async ({ page }) => {
  test.setTimeout(HAND_REAL_MS + 30_000);
  await foldDelayedHand(page);
  await runUntil(page, async () => (await handOver(page).count()) > 0, { maxRealMs: HAND_REAL_MS });
  await expect(handOver(page)).toBeVisible();
  await expect(enabledActions(page)).toHaveCount(0);
});

test('with every worker reply 2 s late a 400-slice loop does not reach the end of the hand', async ({
  page,
}) => {
  test.setTimeout(HAND_REAL_MS + 30_000);
  await foldDelayedHand(page);
  for (let slice = 0; slice < 400 && (await handOver(page).count()) === 0; slice++) {
    await page.clock.runFor(50);
  }
  expect(await handOver(page).count()).toBe(0);

  await runUntil(page, async () => (await handOver(page).count()) > 0, { maxRealMs: HAND_REAL_MS });
  await expect(handOver(page)).toBeVisible();
});

test('runUntil throws at its fake-time bound', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
  await expect(
    runUntil(page, async () => false, { maxFakeMs: 500, label: 'never' }),
  ).rejects.toThrow(/^never after 500 ms fake \/ \d+ ms real$/);
});
