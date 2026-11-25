import { expect, test, type Page } from '@playwright/test';
import { statisticsView, trendHand } from '../src/stats/trends';
import type { HandRecord } from '../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../src/table/session';
import type { SessionRecord } from '../src/table/session-record';
import { cashPool, cloneRecords, sitAndGoPool } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.5: grouping the Statistics trends per session and per local day, in a fixed time zone.

const ORIGIN = 'http://localhost:4173';

test.use({ timezoneId: 'America/New_York' });

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

/** 1,000 hands: 6-player cash past New York midnight, heads-up sit-and-go, then 6-player cash. */
function store(): { records: HandRecord[]; sessions: SessionRecord[] } {
  const cash = cashPool(CASH_STAKES[2] as Stake, 3);
  const headsUp = sitAndGoPool(3, 2);
  const layout = [
    { id: '7', pool: cash, hands: 300, start: '2026-11-10T23:58:00-05:00' },
    { id: '2', pool: headsUp, hands: 400, start: '2026-11-12T10:00:00-05:00' },
    { id: '4', pool: cash, hands: 300, start: '2026-11-13T10:00:00-05:00' },
  ];
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  for (const { id, pool, hands, start } of layout) {
    const cloned = cloneRecords(pool, {
      sessionId: id.repeat(32),
      startedAt: new Date(start),
      hands,
      ended: true,
    });
    records.push(...cloned.records);
    sessions.push(cloned.session);
  }
  return { records, sessions };
}

test('Statistics groups the trends per session and per day', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  const { records, sessions } = store();
  const target = statisticsView({
    hands: records.map(trendHand),
    sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
  }).g2Target;
  expect(target).not.toBeNull();
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  const statistics = menu(page).getByRole('button', { name: /^Statistics/ });
  await statistics.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();

  const tableSize = page.getByRole('combobox', { name: 'Table size' });
  const groupBy = page.getByRole('combobox', { name: 'Group by' });
  const totals = page.locator('.stats-totals');
  const major = page.getByRole('region', { name: 'Major errors per 100 hands' });
  const bb100 = page.getByRole('region', { name: 'Big bets won per 100 hands' });
  const majorPoints = major.locator('circle[data-point]');

  await expect(groupBy.locator('option')).toHaveText(['Every 500 hands', 'Session', 'Day']);
  await expect(groupBy.locator('option:checked')).toHaveText('Every 500 hands');
  await expect(majorPoints).toHaveCount(2);
  await expectNoSeriousAxeViolations(page);

  await tableSize.selectOption({ label: '6-max' });
  await groupBy.selectOption({ label: 'Day' });
  await expect(tableSize.locator('option:checked')).toHaveText('6-max');
  await expect(majorPoints.locator('title')).toHaveText([
    /^10 Nov 2026: /,
    /^11 Nov 2026: /,
    /^13 Nov 2026: /,
  ]);
  await expect(totals).toHaveText('600 hands over 2 sessions');
  await expect(major.getByText('Dashed line: half your first-1,000 rate (G-2)')).toBeVisible();
  await expect(
    major.getByRole('img', {
      name: new RegExp(
        `Dashed target line at ${(target as number).toFixed(1).replace('.', '\\.')}$`,
      ),
    }),
  ).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await tableSize.selectOption({ label: 'All' });
  await expect(groupBy.locator('option:checked')).toHaveText('Day');
  await expect(majorPoints).toHaveCount(4);

  await groupBy.selectOption({ label: 'Session' });
  await expect(majorPoints).toHaveCount(3);
  await expect(bb100.locator('circle[data-bb100-point]')).toHaveCount(2);
  await expectNoSeriousAxeViolations(page);

  await page.getByRole('button', { name: '← Home' }).click();
  await statistics.click();
  await expect(groupBy.locator('option:checked')).toHaveText('Every 500 hands');
  await expect(majorPoints).toHaveCount(2);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
