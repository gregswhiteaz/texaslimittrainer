import { expect, test, type Page } from '@playwright/test';
import { ERROR_HEADING } from '../src/ui/error/ErrorScreen';
import { armFault, gradeFaulted, installFaults } from './support/fault-injection';
import { handOver, header, storedCount } from './support/hand-records';
import { runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-9.10: a decision grade that fails mid-hand is handled; the hand ends with the failed-save log, no review
// panel and no error screen (D-2).

const WORDS = [0x9e3779b9, 1, 2, 3];
const SAVE_FAILED = 'Hand record could not be saved';

interface CountWindow {
  __unhandled?: number;
}

/** Init script: counts window `unhandledrejection` events in `__unhandled`. */
function countUnhandled(): void {
  const counts = window as CountWindow;
  counts.__unhandled = 0;
  window.addEventListener('unhandledrejection', () => {
    counts.__unhandled = (counts.__unhandled ?? 0) + 1;
  });
}

const unhandledCount = (page: Page): Promise<number> =>
  page.evaluate(() => (window as CountWindow).__unhandled ?? -1);
const errorHeading = (page: Page) => page.getByRole('heading', { level: 1, name: ERROR_HEADING });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

test('a grade that fails mid-hand logs the failed save at hand end with no unhandled rejection or review panel', async ({
  page,
}) => {
  const console: string[] = [];
  const errors: Error[] = [];
  page.on('console', (message) => console.push(message.text()));
  page.on('pageerror', (error) => errors.push(error));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(countUnhandled);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(installFaults);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  await runUntilMyTurn(page);
  await expect(header(page)).toHaveText(/Hand #1$/);
  await armFault(page, 'reject-grade');
  const texts = await enabledActions(page).allTextContents();
  const call = texts.includes('Check') ? 'Check' : texts.find((t) => /^Call \$\d+$/.test(t));
  if (call === undefined) throw new Error(`No Check or Call in ${texts.join(', ')}`);
  await enabledActions(page).filter({ hasText: call }).first().click();
  await expect.poll(() => gradeFaulted(page)).toBe(true);
  expect(await handOver(page).count()).toBe(0);

  await runUntil(
    page,
    async () => {
      expect(await errorHeading(page).count()).toBe(0);
      expect(await page.locator('aside').count()).toBe(0);
      if (console.some((text) => text.includes(SAVE_FAILED))) return true;
      if ((await enabledActions(page).count()) > 0) {
        const now = await enabledActions(page).allTextContents();
        await enabledActions(page)
          .filter({ hasText: now.includes('Fold') ? 'Fold' : 'Check' })
          .first()
          .click();
      }
      return false;
    },
    { label: 'failed save not logged' },
  );

  await expect(handOver(page)).toBeVisible();
  for (let slice = 0; slice < 100; slice++) {
    await page.clock.runFor(50);
    expect(await page.locator('aside.review-panel').count()).toBe(0);
  }
  await expect(header(page)).toHaveText(/Hand #1$/);
  await expect(page.getByRole('button', { name: 'Leave table' })).toBeEnabled();
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(errorHeading(page)).toHaveCount(0);
  expect(await unhandledCount(page)).toBe(0);
  expect(errors).toEqual([]);
  expect(console.filter((text) => text.includes('Unexpected error'))).toEqual([]);
  expect(await storedCount(page)).toBe(0);
});
