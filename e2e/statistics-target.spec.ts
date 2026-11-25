import { expect, test, type Page } from '@playwright/test';
import { statRecords } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.3: the G-2 target line on the Major-error trend once 1,000 hands are stored.

const ORIGIN = 'http://localhost:4173';

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

test('Statistics draws the G-2 target line once 1,000 hands are stored', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  // 1,000 hands in two sessions: 31 unhinted Majors and 10 hinted Majors in each.
  const { records, sessions } = statRecords(
    ['1', '2'].map((id, i) => ({
      sessionId: id.repeat(32),
      startedAt: new Date(Date.UTC(2026, 10, 1, i)),
      hands: 500,
      ended: true,
    })),
    (_s, n, d) => ({
      grade: (d === 0 && n <= 31) || (d === 1 && n <= 10) ? 'major' : 'correct',
      hinted: d === 1,
    }),
  );
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();

  const card = page.getByRole('region', { name: 'Major errors per 100 hands' });
  await expect(card.getByText('Dashed line: half your first-1,000 rate (G-2)')).toBeVisible();
  const chart = card.getByRole('img', { name: /Dashed target line at 3\.1$/ });
  await expect(chart).toBeVisible();
  await expect(chart.locator('line.stats-target')).toHaveCount(1);
  await expect(chart.locator('circle[data-point]')).toHaveCount(2);
  await expectNoSeriousAxeViolations(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
