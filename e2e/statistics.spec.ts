import { expect, test, type Page } from '@playwright/test';
import { mixedGrades, nineSessions, statRecords } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.1: Home → Statistics → Home, the totals line and the Major-error trend from stored hands.

const ORIGIN = 'http://localhost:4173';

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const statisticsButton = (page: Page) => menu(page).getByRole('button', { name: /^Statistics/ });
const statisticsHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Statistics' });

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
}

test('Statistics opens from Home and Home returns', async ({ page }) => {
  await openHome(page);
  await statisticsButton(page).click();

  await expect(statisticsHeading(page)).toBeFocused();
  await expect(page.getByRole('button', { name: '← Home' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Table' })).toHaveCount(0);

  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeFocused();
  await expect(menu(page).getByRole('button', { name: /^New game/ })).toBeVisible();
  await expect(statisticsButton(page)).toBeVisible();
});

test('Statistics shows totals and the trend from stored hands, and the empty state, with no axe violations', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openHome(page);
  await statisticsButton(page).click();
  await expect(page.locator('.stats-message')).toHaveText('Play your first hand to see trends.');
  await expect(page.locator('.stats-totals')).toHaveText('0 hands over 0 sessions');
  await expectNoSeriousAxeViolations(page);

  const { records, sessions } = statRecords(nineSessions(1840), mixedGrades);
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await statisticsButton(page).click();

  await expect(page.locator('.stats-totals')).toHaveText('1,840 hands over 9 sessions');
  const chart = page.getByRole('img', { name: /^Major errors per 100 hands, one point/ });
  await expect(chart).toBeVisible();
  await expect(chart.locator('circle[data-point]')).toHaveCount(3);
  await expect(page.locator('.stats-message')).toHaveCount(0);
  await expectNoSeriousAxeViolations(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
