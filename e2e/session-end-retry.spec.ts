import { expect, test, type Page } from '@playwright/test';
import {
  handOver,
  header,
  playToResult,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-10.1 fix brief r2 item 1: if ending a session fails, it stays resumable, and leaving the resumed
// session again (same session id) ends it and shows its report rather than a stuck busy screen.

const WORDS = [0x9e3779b9, 1, 2, 3];

type Json = Record<string, unknown>;

interface FailWindow {
  __endFailures?: number;
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const leaveTable = (page: Page) => page.getByRole('button', { name: 'Leave table' });

/** Init script: the first read-write transaction over the reports store (endSession's) throws. */
function failFirstSessionEnd(): void {
  const w = window as FailWindow;
  w.__endFailures = 0;
  const transaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (
    this: IDBDatabase,
    names: string | string[],
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
  ): IDBTransaction {
    const stores = typeof names === 'string' ? [names] : [...names];
    if (w.__endFailures === 0 && mode === 'readwrite' && stores.includes('reports')) {
      w.__endFailures = 1;
      throw new DOMException('Injected failure', 'UnknownError');
    }
    return transaction.call(this, names, mode, options);
  };
}

test('Leave table after a failed end of the same resumed session shows its report', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(failFirstSessionEnd);
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntil(page, async () => (await header(page).count()) > 0, { label: 'no table' });
  await playToResult(page, 1, () => page.clock.runFor(50));
  await expect(handOver(page)).toBeVisible();

  await leaveTable(page).click();
  await expect(resumeButton(page)).toBeVisible();
  expect(await page.evaluate(() => (window as FailWindow).__endFailures)).toBe(1);
  expect(errors.some((text) => text.includes('Session could not be ended'))).toBe(true);
  const [before] = (await storedSessions(page)) as [Json];
  expect(before.endedAt).toBeUndefined();
  expect(await storedReports(page)).toEqual([]);

  await resumeButton(page).click();
  await expect(leaveTable(page)).toBeVisible();
  await leaveTable(page).click();
  await expect(reportHeading(page)).toBeFocused();
  await expect(page.locator('.report-header-line')).toHaveText('Cash · 6 players · $4/$8 · 1 hand');
  const [after] = (await storedSessions(page)) as [Json];
  expect(after.sessionId).toBe(before.sessionId);
  expect(typeof after.endedAt).toBe('string');
  expect(await storedReports(page)).toHaveLength(1);

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
});
