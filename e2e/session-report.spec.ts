import { expect, test, type Browser, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession, type TableState } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import { bbPer100, sessionReport, signedDollars, signedTenths } from '../src/table/session-report';
import {
  handOver,
  header,
  playToResult,
  seedStoredSessions,
  storedRecords,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-10.1: Leave table ends the session and opens its saved Session Report (REQ-004.5, REQ-044, REQ-052).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const STARTED = new Date('2026-11-23T10:00:00Z');

type Json = Record<string, unknown>;

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const headerLine = (page: Page) => page.locator('.report-header-line');
const tileValues = (page: Page) => page.locator('.report-kpi dd');
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const leaveTable = (page: Page) => page.getByRole('button', { name: 'Leave table' });
const headerFor = (hand: number) => `Cash · 6 players · $4/$8 · Hand #${hand}`;

const userStack = (record: Json): number =>
  (record.seats as SessionRecord['seats']).find((s) => s.kind === 'user')?.stack as number;

async function openPausedClock(page: Page, words: readonly number[] = WORDS): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, words);
}

/** Opens the app and starts the default game ($4/$8, 6 players). */
async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntil(page, async () => (await header(page).textContent()) === headerFor(1), {
    label: 'hand 1 not dealt',
  });
}

/** Starts the default game, plays hand 1 to its result and chooses Leave table while Hand over shows. */
async function leaveAfterHand1(page: Page): Promise<void> {
  await startGame(page);
  await playToResult(page, 1, fakeSlice(page));
  await expect(handOver(page)).toBeVisible();
  await leaveTable(page).click();
  await expect(reportHeading(page)).toBeVisible();
}

/** Seeds `session`, reloads and resumes it: the Table shows its next hand. */
async function resumeSeeded(page: Page, session: SessionRecord, summary: string): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [session]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(summary);
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(headerFor(session.handsPlayed + 1));
}

async function inContext(browser: Browser, run: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext();
  try {
    await run(await context.newPage());
  } finally {
    await context.close();
  }
}

test('Leave table between hands ends the session and opens its saved report', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPausedClock(page);
  await leaveAfterHand1(page);

  await expect(reportHeading(page)).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(headerLine(page)).toHaveText('Cash · 6 players · $4/$8 · 1 hand');
  await expect(page.locator('.report-kpi dt')).toHaveText(['Result', 'BB/100', 'Rebuys']);
  const [session] = (await storedSessions(page)) as [Json];
  const result = userStack(session) - 160;
  await expect(tileValues(page)).toHaveText([
    signedDollars(result),
    signedTenths(bbPer100(result, 8, 1)),
    '0',
  ]);

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveCount(0);
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([1]);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  const [ended] = sessions as [Json];
  expect(ended.handsPlayed).toBe(1);
  const endedAt = ended.endedAt as string;
  expect(new Date(endedAt).toISOString()).toBe(endedAt);
  const reports = await storedReports(page);
  expect(reports).toEqual([sessionReport(ended as unknown as SessionRecord, new Date(endedAt))]);
  await axeWithPausedClock(page);

  const json = JSON.stringify(reports);
  await page.reload();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  expect(JSON.stringify(await storedReports(page))).toBe(json);
  expect((await storedSessions(page))[0]?.endedAt).toBe(endedAt);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Back to Home from the report opens Home without Resume', async ({ page }) => {
  await openPausedClock(page);
  await leaveAfterHand1(page);
  const reports = JSON.stringify(await storedReports(page));
  const sessions = JSON.stringify(await storedSessions(page));

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  expect(JSON.stringify(await storedReports(page))).toBe(reports);
  expect(JSON.stringify(await storedSessions(page))).toBe(sessions);
});

test('Leave table with the Hand Review open after hand 12 shows 12 hands', async ({ page }) => {
  // bust-continue.spec.ts's A-5 seed at hand 12: the user on $12, button on seat 3.
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  const table: TableState = {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 12 } : s)),
    button: 3,
    handNumber: 12,
  };
  const seed = sessionRecord(table, {
    sessionId: 'f'.repeat(32),
    startedAt: STARTED,
    updatedAt: STARTED,
  });
  await openPausedClock(page, [1, 1, 2, 3]);
  await resumeSeeded(page, seed, 'Cash · 6 players · $4/$8 · 11 hands · paused');
  await playToResult(page, 12, fakeSlice(page), { play: 'call' });
  await expect(page.getByRole('complementary', { name: 'Hand #12 review' })).toBeVisible();

  await leaveTable(page).click();
  await expect(reportHeading(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(headerLine(page)).toHaveText('Cash · 6 players · $4/$8 · 12 hands');

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveCount(0);
  const [session] = (await storedSessions(page)) as [Json];
  expect(session.handsPlayed).toBe(12);
  expect(typeof session.endedAt).toBe('string');
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([12]);
});

test('a seeded session shows Result, BB/100 and rebuys from its stored values', async ({
  browser,
}) => {
  const cases = [
    { hands: 214, rebuys: 1, stack: 366, tiles: ['+$46', '+2.7', '1'] },
    { hands: 100, rebuys: 0, stack: 120, tiles: ['-$40', '-5.0', '0'] },
  ];
  for (const { hands, rebuys, stack, tiles } of cases) {
    await inContext(browser, async (page) => {
      const seated = seatSession(DEFAULT_SESSION_CONFIG);
      const table: TableState = {
        ...seated,
        stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack } : s)),
        handNumber: hands + 1,
        rebuys,
      };
      const seed = sessionRecord(table, {
        sessionId: 'a'.repeat(32),
        startedAt: STARTED,
        updatedAt: STARTED,
      });
      await openPausedClock(page);
      await resumeSeeded(page, seed, `Cash · 6 players · $4/$8 · ${hands} hands · paused`);

      // Leave during hand hands + 1 (D-2): the unfinished hand is dropped.
      await leaveTable(page).click();
      await expect(reportHeading(page)).toBeFocused();
      await expect(headerLine(page)).toHaveText(`Cash · 6 players · $4/$8 · ${hands} hands`);
      await expect(tileValues(page)).toHaveText(tiles);
      await page.clock.runFor(5000);
      await expect(header(page)).toHaveCount(0);
      expect(await storedRecords(page)).toEqual([]);
      const [session] = (await storedSessions(page)) as [Json];
      expect(session.handsPlayed).toBe(hands);
    });
  }
});

test('a session with 0 completed hands ends without a report and is not stored', async ({
  page,
}) => {
  await openPausedClock(page);
  await startGame(page);
  await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 0 hands · paused',
  );
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(headerFor(1));

  await leaveTable(page).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(reportHeading(page)).toHaveCount(0);
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  expect(await storedSessions(page)).toEqual([]);
  expect(await storedReports(page)).toEqual([]);
  expect(await storedRecords(page)).toEqual([]);
});
