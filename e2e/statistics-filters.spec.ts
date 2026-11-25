import { expect, test, type Page } from '@playwright/test';
import type { HandRecord } from '../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../src/table/session';
import type { SessionRecord } from '../src/table/session-record';
import { cashPool, cloneRecords, sitAndGoPool } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.4: the Statistics screen's table size and game type filters.

const ORIGIN = 'http://localhost:4173';

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

/** 500 6-player cash hands in 2 sessions and 200 heads-up sit-and-go hands in 1 session. */
function store(): { records: HandRecord[]; sessions: SessionRecord[] } {
  const cash = cashPool(CASH_STAKES[2] as Stake, 3);
  const headsUp = sitAndGoPool(3, 2);
  const layout = [
    { id: '7', pool: cash, hands: 300 },
    { id: '2', pool: headsUp, hands: 200 },
    { id: '4', pool: cash, hands: 200 },
  ];
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  layout.forEach(({ id, pool, hands }, i) => {
    const cloned = cloneRecords(pool, {
      sessionId: id.repeat(32),
      startedAt: new Date(Date.UTC(2026, 10, 1, i)),
      hands,
      ended: true,
    });
    records.push(...cloned.records);
    sessions.push(cloned.session);
  });
  return { records, sessions };
}

test('Statistics filters the trends by table size and game type', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  const { records, sessions } = store();
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();

  const tableSize = page.getByRole('combobox', { name: 'Table size' });
  const gameType = page.getByRole('combobox', { name: 'Game type' });
  const totals = page.locator('.stats-totals');
  const major = page.getByRole('region', { name: 'Major errors per 100 hands' });
  const bb100 = page.getByRole('region', { name: 'Big bets won per 100 hands' });

  await expect(tableSize.locator('option')).toHaveText(['All', 'Heads-up', '6-max', 'Full ring']);
  await expect(gameType.locator('option')).toHaveText(['All', 'Cash', 'Sit-and-go']);
  await expect(tableSize.locator('option:checked')).toHaveText('All');
  await expect(gameType.locator('option:checked')).toHaveText('All');
  await expect(totals).toHaveText('700 hands over 3 sessions');
  await expectNoSeriousAxeViolations(page);

  await tableSize.selectOption({ label: 'Heads-up' });
  await expect(totals).toHaveText('200 hands over 1 session');
  await expect(major.locator('.stats-message')).toHaveText(
    'Play 300 more hands to see your first trend point.',
  );
  await expect(bb100.getByText('No cash-game hands yet.')).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await tableSize.selectOption({ label: 'All' });
  await gameType.selectOption({ label: 'Sit-and-go' });
  await expect(totals).toHaveText('200 hands over 1 session');
  await expect(bb100.getByText('No cash-game hands yet.')).toBeVisible();

  await gameType.selectOption({ label: 'Cash' });
  await expect(totals).toHaveText('500 hands over 2 sessions');
  await expect(major.locator('circle[data-point]')).toHaveCount(1);
  await expectNoSeriousAxeViolations(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
