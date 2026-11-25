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
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-10.5: the Session Report lists postflop leaks with evidence and a fix (REQ-044.5, REQ-047).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const NO_LEAKS = 'No leaks found this session (a leak needs 8+ spots with 40%+ errors).';

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

test('Leave table shows the leaks section from the stored decisions', async ({ page }) => {
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
  await playToResult(page, 1, () => page.clock.runFor(50));
  await expect(handOver(page)).toBeVisible();
  await page.getByRole('button', { name: 'Leave table' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Session report' })).toBeVisible();

  const leaks = page.getByRole('region', { name: 'Biggest leaks this session' });
  await expect(leaks).toBeVisible();
  await expect(leaks.locator('.report-leaks-none')).toHaveText(NO_LEAKS);
  await expect(leaks.locator('.report-leak')).toHaveCount(0);

  await page.clock.runFor(5000);
  const [stored] = (await storedReports(page)) as unknown as [SessionReport];
  expect(stored.leakCounts).toBeDefined();
  const [ended] = (await storedSessions(page)) as unknown as [SessionRecord];
  const records = (await storedRecords(page)) as unknown as HandRecord[];
  expect(stored.leakCounts).toEqual(
    sessionReport(ended, new Date(stored.endedAt), records).leakCounts,
  );

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
