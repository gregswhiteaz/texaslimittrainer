import { expect, test, type Page } from '@playwright/test';
import type { HandRecord } from '../src/table/hand-record';
import type { SessionRecord } from '../src/table/session-record';
import { bbPer100, sessionReport, type SessionReport } from '../src/table/session-report';
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

// TASK-10.4: the Session Report shows hands played and Major / Minor errors per 100 hands (REQ-044.2).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

test('Leave table shows hands played and error rates from the stored decisions', async ({
  page,
}) => {
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

  const rates = page.getByLabel('Volume and errors');
  await expect(rates.locator('.report-rate dt')).toHaveText([
    'Hands played',
    'Major errors /100',
    'Minor errors /100',
  ]);

  await page.clock.runFor(5000);
  const [stored] = (await storedReports(page)) as unknown as [SessionReport];
  const errors = stored.errors as NonNullable<SessionReport['errors']>;
  expect(errors).toBeDefined();
  const [ended] = (await storedSessions(page)) as unknown as [SessionRecord];
  const records = (await storedRecords(page)) as unknown as HandRecord[];
  expect(errors).toEqual(sessionReport(ended, new Date(stored.endedAt), records).errors);
  await expect(rates.locator('.report-rate dd')).toHaveText([
    '1',
    bbPer100(errors.major, 1, 1).toFixed(1),
    bbPer100(errors.minor, 1, 1).toFixed(1),
  ]);

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
