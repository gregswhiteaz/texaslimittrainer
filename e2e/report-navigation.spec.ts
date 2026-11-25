import { expect, test, type Page } from '@playwright/test';
import { mixedGrades, statRecords } from '../tests/support/stat-records';
import {
  handOver,
  header,
  playToResult,
  seedStoredRecords,
  seedStoredSessions,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-11.6: View statistics and Back to Home from the Session Report (REQ-044.6).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const statisticsHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Statistics' });
const viewStatistics = (page: Page) => page.getByRole('button', { name: 'View statistics' });
const tableSize = (page: Page) => page.getByRole('combobox', { name: 'Table size' });
const gameType = (page: Page) => page.getByRole('combobox', { name: 'Game type' });
const groupBy = (page: Page) => page.getByRole('combobox', { name: 'Group by' });

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
}

/** From Home: New game → Start game, plays hand 1 to its result and chooses Leave table. */
async function playHandAndLeave(page: Page): Promise<void> {
  await menu(page)
    .getByRole('button', { name: /^New game/ })
    .click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntil(
    page,
    async () => (await header(page).textContent()) === 'Cash · 6 players · $4/$8 · Hand #1',
    { label: 'hand 1 not dealt' },
  );
  await playToResult(page, 1, fakeSlice(page));
  await expect(handOver(page)).toBeVisible();
  await page.getByRole('button', { name: 'Leave table' }).click();
  await expect(reportHeading(page)).toBeVisible();
}

async function expectDefaultFilters(page: Page): Promise<void> {
  await expect(tableSize(page).locator('option:checked')).toHaveText('All');
  await expect(gameType(page).locator('option:checked')).toHaveText('All');
  await expect(groupBy(page).locator('option:checked')).toHaveText('Every 500 hands');
}

/** The texts of the elements Tab reaches from the focused element, until focus leaves the page or repeats. */
async function tabOrder(page: Page, key: string): Promise<string[]> {
  const reached: string[] = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(key);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el === null || el === document.body ? null : (el.textContent ?? '');
    });
    if (focused === null || reached.includes(focused)) break;
    reached.push(focused);
  }
  return reached;
}

test('View statistics opens Statistics with the session just ended in its totals', async ({
  page,
  browserName,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPausedClock(page);
  await openHome(page);
  const { records, sessions } = statRecords(
    [
      {
        sessionId: 'a'.repeat(32),
        startedAt: new Date(Date.UTC(2026, 10, 1)),
        hands: 50,
        ended: true,
      },
    ],
    mixedGrades,
  );
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await playHandAndLeave(page);

  await expect(reportHeading(page)).toBeFocused();
  await expect(page.locator('.report-actions button')).toHaveText([
    'View statistics',
    'Back to Home',
  ]);
  // WebKit only tabs to buttons with Alt held (no full keyboard access).
  const order = await tabOrder(page, browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  expect(order.slice(-2)).toEqual(['View statistics', 'Back to Home']);
  await axeWithPausedClock(page);

  const reports = JSON.stringify(await storedReports(page));
  const stored = JSON.stringify(await storedSessions(page));
  await viewStatistics(page).click();
  await expect(statisticsHeading(page)).toBeFocused();
  await expect(page.locator('.stats-totals')).toHaveText('51 hands over 2 sessions');
  await expectDefaultFilters(page);
  expect(JSON.stringify(await storedReports(page))).toBe(reports);
  expect(JSON.stringify(await storedSessions(page))).toBe(stored);

  await page.getByRole('button', { name: '← Home' }).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Back to Home from the report opens Home without Resume for that session', async ({
  page,
}) => {
  await openPausedClock(page);
  await openHome(page);
  await playHandAndLeave(page);
  await expect(viewStatistics(page)).toBeVisible();
  const reports = JSON.stringify(await storedReports(page));
  const sessions = JSON.stringify(await storedSessions(page));

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  expect(JSON.stringify(await storedReports(page))).toBe(reports);
  expect(JSON.stringify(await storedSessions(page))).toBe(sessions);

  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.locator('.stats-totals')).toHaveText('1 hand over 1 session');
});

test('View statistics opens Statistics with default filters', async ({ page }) => {
  await openPausedClock(page);
  await openHome(page);
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(statisticsHeading(page)).toBeFocused();
  await tableSize(page).selectOption({ label: '6-max' });
  await groupBy(page).selectOption({ label: 'Session' });
  await expect(tableSize(page).locator('option:checked')).toHaveText('6-max');
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(homeHeading(page)).toBeFocused();

  await playHandAndLeave(page);
  await viewStatistics(page).click();
  await expect(statisticsHeading(page)).toBeFocused();
  await expectDefaultFilters(page);
});
