import { expect, test, type Page } from '@playwright/test';
import type { LineUpName } from '../src/table/session';
import { statRecords } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.7: the Statistics screen's line-up filter, through the real App wiring.

const ORIGIN = 'http://localhost:4173';

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

const LAYOUT: readonly { id: string; lineUp: LineUpName; hands: number }[] = [
  { id: '7', lineUp: 'Tough', hands: 1000 },
  { id: '2', lineUp: 'Custom', hands: 300 },
  { id: '9', lineUp: 'Mixed', hands: 200 },
];

/** 1,500 hands: the earliest (Tough) session holds 62 unhinted Majors, so the G-2 target is 3.1. */
function store() {
  const { records, sessions } = statRecords(
    LAYOUT.map(({ id, hands }, i) => ({
      sessionId: id.repeat(32),
      startedAt: new Date(Date.UTC(2026, 10, 1, i)),
      hands,
      ended: true,
    })),
    (s, n, d) => ({ grade: s === 0 && d === 0 && n <= 62 ? 'major' : 'correct', hinted: false }),
  );
  const lineUpOf = new Map(LAYOUT.map(({ id, lineUp }) => [id.repeat(32), lineUp]));
  return {
    records: records.map((r) => ({ ...r, lineUp: lineUpOf.get(r.sessionId) as LineUpName })),
    sessions,
  };
}

const openStatistics = async (page: Page) => {
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();
};

test('Statistics filters the trends by line-up', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  const { records, sessions } = store();
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await openStatistics(page);

  const lineUp = page.getByRole('combobox', { name: 'Line-up' });
  const tableSize = page.getByRole('combobox', { name: 'Table size' });
  const gameType = page.getByRole('combobox', { name: 'Game type' });
  const groupBy = page.getByRole('combobox', { name: 'Group by' });
  const totals = page.locator('.stats-totals');
  const major = page.getByRole('region', { name: 'Major errors per 100 hands' });

  await expect(lineUp.locator('option')).toHaveText(['All', 'Mixed', 'Tough', 'Soft', 'Custom']);
  await expect(lineUp.locator('option:checked')).toHaveText('All');
  await expect(totals).toHaveText('1,500 hands over 3 sessions');
  await expectNoSeriousAxeViolations(page);

  await lineUp.selectOption({ label: 'Custom' });
  await expect(totals).toHaveText('300 hands over 1 session');
  await expect(major.locator('.stats-message')).toHaveText(
    'Play 200 more hands to see your first trend point.',
  );
  await expect(tableSize.locator('option:checked')).toHaveText('All');
  await expect(gameType.locator('option:checked')).toHaveText('All');

  await groupBy.selectOption({ label: 'Session' });
  await expect(major.locator('circle[data-point]')).toHaveCount(1);
  await expect(major.getByText('Dashed line: half your first-1,000 rate (G-2)')).toBeVisible();
  await expect(major.getByRole('img', { name: /Dashed target line at 3\.1$/ })).toBeVisible();
  await expect(lineUp.locator('option:checked')).toHaveText('Custom');

  await lineUp.selectOption({ label: 'Soft' });
  await expect(major.getByText('Play your first hand to see trends.')).toBeVisible();
  await expect(totals).toHaveText('0 hands over 0 sessions');
  await expectNoSeriousAxeViolations(page);

  await page.getByRole('button', { name: '← Home' }).click();
  await expect(menu(page)).toBeVisible();
  await openStatistics(page);
  await expect(lineUp.locator('option:checked')).toHaveText('All');
  await expect(totals).toHaveText('1,500 hands over 3 sessions');

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
