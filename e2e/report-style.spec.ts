import { expect, test, type Page } from '@playwright/test';
import { styleSection } from '../src/stats/healthy-ranges';
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

// TASK-10.3: the Session Report shows the user's five style stats against the healthy ranges (REQ-044.4).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

test('Leave table shows my style against the 6-max healthy ranges', async ({ page }) => {
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

  const section = page.getByRole('region', { name: 'Your style vs healthy range (6-max)' });
  await expect(
    section.getByRole('heading', { level: 2, name: 'Your style vs healthy range (6-max)' }),
  ).toBeVisible();
  await expect(section.locator('.report-style-row .report-style-name')).toHaveText([
    'VPIP',
    'PFR',
    'Aggression',
    'WTSD',
    'W$SD',
  ]);

  await page.clock.runFor(5000);
  const [stored] = (await storedReports(page)) as unknown as [SessionReport];
  expect(stored.style).toBeDefined();
  const [ended] = (await storedSessions(page)) as unknown as [SessionRecord];
  const records = (await storedRecords(page)) as unknown as HandRecord[];
  expect(stored.style).toEqual(sessionReport(ended, new Date(stored.endedAt), records).style);
  expect(stored.style?.handsDealt).toBe(1);
  const expected = styleSection(6, stored.style as NonNullable<SessionReport['style']>).rows;
  await expect(section.locator('.report-style-row')).toHaveText(
    expected.map((r) => `${r.name} You ${r.value} · healthy ${r.range} · ${r.label}`),
  );

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
