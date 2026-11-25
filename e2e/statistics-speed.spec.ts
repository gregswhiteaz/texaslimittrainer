import { expect, test } from '@playwright/test';
import { mixedGrades, nineSessions, statRecords } from '../tests/support/stat-records';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.1 (A-11): with 3,000 stored hands over 9 sessions, the 6th trend point shows within 1,000 ms of
// clicking Statistics on Home. Opt-in timing check: npm run e2e:slow.

const SLOW = process.env.TLH_SLOW_TESTS !== '1';
const SLOW_REASON = 'timing check: run npm run e2e:slow';
const BUDGET_MS = 1000;

test('3,000 stored hands open the Statistics trend within 1 second', async ({ page }) => {
  test.skip(SLOW, SLOW_REASON);
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await page.goto('/');
  await expect(menu).not.toHaveAttribute('data-paused', 'loading');
  const { records, sessions } = statRecords(nineSessions(3000), mixedGrades);
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu).not.toHaveAttribute('data-paused', 'loading');

  const sixth = page.locator('circle[data-point]').nth(5);
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('nav[aria-label="Main menu"] button')].find((b) =>
      b.textContent?.startsWith('Statistics'),
    );
    const started = performance.now();
    (window as { __statsShown?: Promise<number> }).__statsShown = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.querySelectorAll('circle[data-point]').length < 6) return;
        observer.disconnect();
        resolve(performance.now() - started);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    (button as HTMLButtonElement).click();
  });
  await expect(sixth).toBeVisible();
  const elapsed = await page.evaluate(
    () => (window as { __statsShown?: Promise<number> }).__statsShown,
  );
  expect(elapsed).toBeLessThanOrEqual(BUDGET_MS);
});
