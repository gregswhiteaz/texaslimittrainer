import { expect, test, type Page } from '@playwright/test';
import type { HandRecord } from '../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../src/table/session';
import type { SessionRecord } from '../src/table/session-record';
import { cashPool, cloneRecords, sitAndGoPool } from '../tests/support/stat-records';
import { expectNoSeriousAxeViolations } from './support/axe';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.2: the cash-only BB/100 trend with its break-even line, and the no-cash state.

const ORIGIN = 'http://localhost:4173';

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

async function openStatistics(page: Page): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();
}

/** 1,000 cash hands at two stakes and 500 sit-and-go hands, interleaved by session start. */
function mixedStore(): { records: HandRecord[]; sessions: SessionRecord[] } {
  const pools = [
    cashPool(CASH_STAKES[2] as Stake, 4),
    sitAndGoPool(3),
    cashPool(CASH_STAKES[4] as Stake, 4),
  ];
  const layout = [
    { id: '3', pool: 0, hands: 400 },
    { id: 'a', pool: 1, hands: 250 },
    { id: '5', pool: 2, hands: 600 },
    { id: '1', pool: 1, hands: 250 },
  ];
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  layout.forEach(({ id, pool, hands }, i) => {
    const cloned = cloneRecords(pools[pool] as HandRecord[], {
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

test('Statistics shows the cash-only BB/100 trend with a break-even line, and the no-cash state', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const card = page.getByRole('region', { name: 'Big bets won per 100 hands' });

  await openStatistics(page);
  await expect(card.getByText('No cash-game hands yet.')).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  const { records, sessions } = mixedStore();
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await openStatistics(page);

  const chart = card.getByRole('img', { name: /^Big bets won per 100 hands/ });
  await expect(chart).toBeVisible();
  await expect(chart.locator('circle[data-bb100-point]')).toHaveCount(2);
  await expect(chart.locator('line.stats-break-even')).toHaveCount(1);
  await expect(card.getByText('Dashed line: break-even')).toBeVisible();
  await expect(
    card.getByText('Each point is 500 cash hands. Above the dashed line means you are winning.'),
  ).toBeVisible();
  await expect(card.locator('.stats-bb100-message')).toHaveCount(0);
  const major = page.getByRole('img', { name: /^Major errors per 100 hands, one point/ });
  await expect(major.locator('circle[data-point]')).toHaveCount(3);
  await expectNoSeriousAxeViolations(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
