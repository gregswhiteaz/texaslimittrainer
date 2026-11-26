import { expect, test, type Page } from '@playwright/test';
import type { HandRecord } from '../src/table/hand-record';
import type { SessionRecord } from '../src/table/session-record';
import { sessionReport, type SessionReport } from '../src/table/session-report';
import {
  handOver,
  header,
  playToResult,
  storedRecords,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-10.7: the Session Report shows how many of the user's decisions used a hint (REQ-044.3, REQ-040.4).

const ORIGIN = 'http://localhost:4173';
/** TASK-3.1's pinned replay code words; the user acts in hand 1. */
const WORDS = [0x9e3779b9, 1, 2, 3];

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

test('Leave table shows how many decisions used a hint', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPausedClock(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntil(
    page,
    async () => (await header(page).textContent()) === 'Cash · 6 players · $4/$8 · Hand #1',
    { label: 'hand 1 not dealt' },
  );
  await runUntilMyTurn(page);
  await page.locator('button.hint-toggle').click();
  await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
  await playToResult(page, 1, () => page.clock.runFor(50));
  await expect(handOver(page)).toBeVisible();
  await page.getByRole('button', { name: 'Leave table' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Session report' })).toBeVisible();

  await page.clock.runFor(5000);
  const [stored] = (await storedReports(page)) as unknown as [SessionReport];
  const hints = stored.hints as NonNullable<SessionReport['hints']>;
  expect(hints).toBeDefined();
  expect(hints.hinted).toBeGreaterThanOrEqual(1);
  const [ended] = (await storedSessions(page)) as unknown as [SessionRecord];
  const records = (await storedRecords(page)) as unknown as HandRecord[];
  expect(hints).toEqual(sessionReport(ended, new Date(stored.endedAt), records).hints);

  const tile = page.getByLabel('Volume and errors').locator('.report-hints');
  await expect(tile.locator('dt')).toHaveText('Hints used');
  const { hinted, decisions } = hints;
  const tenths = Math.floor((2000 * hinted + decisions) / (2 * decisions));
  const expected = `${hinted} of ${decisions} ${decisions === 1 ? 'decision' : 'decisions'} (${Math.floor(tenths / 10)}.${tenths % 10}%)`;
  await expect(tile.locator('dd')).toHaveText(expected);

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
