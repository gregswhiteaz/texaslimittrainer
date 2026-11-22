import { expect, test, type Page } from '@playwright/test';
import { delayWorkerReplies, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const IDLE = ['Fold', 'Call', 'Raise'];
const REPLY_DELAY_MS = 2000;

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const actionButtons = (page: Page) =>
  page.getByRole('group', { name: 'Your actions' }).getByRole('button');
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

/** Paused clock, every advice-worker reply REPLY_DELAY_MS late, pinned deal, New game → Start game. */
async function startDelayedGame(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(delayWorkerReplies, REPLY_DELAY_MS);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(tableSection(page)).toBeVisible();
}

test('with every worker reply 2 s late the bounded advance still reaches my turn', async ({
  page,
}) => {
  await startDelayedGame(page);
  await runUntilMyTurn(page);
  await expectToAct(page, '5');
  expect(await actionCount(page)).toBe(4);

  await actionButtons(page).getByText('Call $4', { exact: true }).click();
  await expect.poll(() => actionCount(page)).toBe(5);
  await expectToAct(page, '6');
  await expect(actionButtons(page)).toHaveText(IDLE);
});

test('with every worker reply 2 s late a fixed 1,000 ms budget is not enough', async ({ page }) => {
  await startDelayedGame(page);
  for (let ms = 0; ms < 1000; ms += 50) await page.clock.runFor(50);
  expect(await enabledActions(page).count()).toBe(0);
  expect(await actionCount(page)).toBeLessThan(4);

  await runUntilMyTurn(page);
  await expectToAct(page, '5');
});

test('runUntilMyTurn throws when my turn never comes', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
  await expect(runUntilMyTurn(page, { maxRealMs: 500 })).rejects.toThrow(
    /^runUntilMyTurn: not my turn after/,
  );
});
