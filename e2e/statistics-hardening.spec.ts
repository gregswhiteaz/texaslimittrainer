import { expect, test, type Locator, type Page } from '@playwright/test';
import { statisticsView, trendHand } from '../src/stats/trends';
import type { HandRecord } from '../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../src/table/session';
import type { SessionRecord } from '../src/table/session-record';
import { cashPool, cloneRecords, sitAndGoPool, withGrades } from '../tests/support/stat-records';
import { seedStoredRecords, seedStoredSessions } from './support/hand-records';

// TASK-11.13 AC#4, AC#5: the App takes the G-2 target from every stored hand under every filter, and a filter
// select value that is not a known option counts as All.

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });

/** 1,200 hands in 6 sessions of 200, started an hour apart: cash then sit-and-go at 2, 6 and 10 seated. Every
 *  decision of each hand n with n % 10 === 0 is an unhinted Major, every other one unhinted Correct. */
function store(): { records: HandRecord[]; sessions: SessionRecord[] } {
  const stake = CASH_STAKES[2] as Stake;
  const pools = [2, 6, 10].flatMap((players) => [
    cashPool(stake, 3, players),
    sitAndGoPool(3, players),
  ]);
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  pools.forEach((pool, i) => {
    const cloned = cloneRecords(pool, {
      sessionId: String(i + 1).repeat(32),
      startedAt: new Date(Date.UTC(2026, 10, 1, i)),
      hands: 200,
      ended: true,
    });
    for (const record of cloned.records) {
      const major = record.handNumber % 10 === 0;
      records.push(
        withGrades(record, () => ({ grade: major ? 'major' : 'correct', hinted: false })),
      );
    }
    sessions.push(cloned.session);
  });
  return { records, sessions };
}

async function openStatistics(
  page: Page,
  records: HandRecord[],
  sessions: SessionRecord[],
): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, sessions);
  await page.evaluate(seedStoredRecords, records);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Statistics/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeFocused();
}

/** Changes `select`'s option `from` to the value 'bogus' in the DOM, then selects it. */
async function selectBogus(select: Locator, from: string): Promise<void> {
  await select.locator(`option[value="${from}"]`).evaluate((option: HTMLOptionElement) => {
    option.value = 'bogus';
  });
  await select.selectOption('bogus');
}

test('App takes the G-2 target from every stored hand under every filter', async ({ page }) => {
  const { records, sessions } = store();
  const expected = statisticsView({
    hands: records.map(trendHand),
    sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
  }).g2Target;
  expect(expected).not.toBeNull();
  expect(expected as number).toBeGreaterThan(0);
  const ending = new RegExp(
    `Dashed target line at ${(expected as number).toFixed(1).replace('.', '\\.')}$`,
  );
  await openStatistics(page, records, sessions);

  const card = page.getByRole('region', { name: 'Major errors per 100 hands' });
  const chart = card.getByRole('img');
  const totals = page.locator('.stats-totals');
  await expect(totals).toHaveText('1,200 hands over 6 sessions');
  await expect(chart).toHaveAttribute('aria-label', ending);
  await expect(chart.locator('line.stats-target')).toHaveCount(1);

  await page.getByRole('combobox', { name: 'Group by' }).selectOption({ label: 'Session' });
  const tableSize = page.getByRole('combobox', { name: 'Table size' });
  const gameType = page.getByRole('combobox', { name: 'Game type' });
  for (const size of ['All', 'Heads-up', '6-max', 'Full ring']) {
    for (const type of ['All', 'Cash', 'Sit-and-go']) {
      await tableSize.selectOption({ label: size });
      await gameType.selectOption({ label: type });
      const named = (size === 'All' ? 0 : 1) + (type === 'All' ? 0 : 1);
      const text =
        named === 2
          ? '200 hands over 1 session'
          : named === 0
            ? '1,200 hands over 6 sessions'
            : size === 'All'
              ? '600 hands over 3 sessions'
              : '400 hands over 2 sessions';
      await expect(totals).toHaveText(text);
      await expect(card.getByText('Dashed line: half your first-1,000 rate (G-2)')).toBeVisible();
      await expect(chart).toHaveAttribute('aria-label', ending);
      await expect(chart.locator('line.stats-target')).toHaveCount(1);
    }
  }
});

test('an unknown filter value is treated as All', async ({ page }) => {
  const { records, sessions } = store();
  await openStatistics(page, records, sessions);
  const tableSize = page.getByRole('combobox', { name: 'Table size' });
  const gameType = page.getByRole('combobox', { name: 'Game type' });
  const lineUp = page.getByRole('combobox', { name: 'Line-up' });
  const totals = page.locator('.stats-totals');

  await tableSize.selectOption({ label: 'Heads-up' });
  await gameType.selectOption({ label: 'Cash' });
  await expect(totals).toHaveText('200 hands over 1 session');

  await selectBogus(gameType, 'sit-and-go');
  await expect(gameType).toHaveValue('all');
  await expect(tableSize).toHaveValue('heads-up');
  await expect(totals).toHaveText('400 hands over 2 sessions');

  await selectBogus(tableSize, 'full-ring');
  await expect(tableSize).toHaveValue('all');
  await expect(totals).toHaveText('1,200 hands over 6 sessions');

  await gameType.selectOption({ label: 'Cash' });
  await expect(totals).toHaveText('600 hands over 3 sessions');
  await selectBogus(lineUp, 'Custom');
  await expect(lineUp).toHaveValue('all');
  await expect(gameType).toHaveValue('cash');
  await expect(totals).toHaveText('600 hands over 3 sessions');
});
