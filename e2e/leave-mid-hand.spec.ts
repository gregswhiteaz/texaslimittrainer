import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession } from '../src/table/session';
import { sessionRecord } from '../src/table/session-record';
import {
  header,
  seedStoredSessions,
  storedRecords,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct, toActSeats } from './support/table-locators';

// TASK-10.2: Leave table during a hand asks first, folds the user's hand on Confirm, plays the hand out and
// ends the session after it (REQ-004.5, REQ-004.7, REQ-004.8).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'd'.repeat(32);
const STARTED = new Date('2026-11-24T10:00:00Z');
const PROMPT = 'Leave now? Your hand will be folded.';

type Json = Record<string, unknown>;

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const leaveTable = (page: Page) => page.getByRole('button', { name: 'Leave table' });
const leaveDialog = (page: Page) => page.getByRole('dialog', { name: PROMPT });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const headerLine = (page: Page) => page.locator('.report-header-line');
const user = (page: Page) => page.locator('li[data-user]');
const userAction = (page: Page) => user(page).locator('[data-part="action"]');
const callButton = (page: Page) =>
  page.getByRole('group', { name: 'Your actions' }).getByRole('button', { name: /^Call \$\d+$/ });

const actionCount = async (page: Page): Promise<number> =>
  Number(await tableSection(page).getAttribute('data-action-count'));
const toActSeat = (page: Page) => toActSeats(page).getAttribute('data-seat');

declare global {
  interface Window {
    __leaveWorkerTraffic: { posts: number; replies: number };
  }
}

/** Init script (TASK-10.13 A-8): counts every Worker.postMessage and every `message` reply from a worker. */
function countWorkerTraffic(): void {
  const traffic = { posts: 0, replies: 0 };
  window.__leaveWorkerTraffic = traffic;
  const counted = new WeakSet<Worker>();
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (this: Worker, ...args: unknown[]) {
    if (!counted.has(this)) {
      counted.add(this);
      this.addEventListener('message', () => (traffic.replies += 1));
    }
    traffic.posts += 1;
    Reflect.apply(post, this, args);
  } as typeof post;
}

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(countWorkerTraffic);
}

/** Polls (at most 10 s real time) until every Worker request posted so far has had a reply. */
async function workerRepliesSettled(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => window.__leaveWorkerTraffic.replies >= window.__leaveWorkerTraffic.posts,
        ),
      { timeout: 10_000 },
    )
    .toBe(true);
}

/** SPEC-09 setup: a seeded 24-hand cash session resumed, run to the user's first turn in hand 25. */
async function resumeAtHand25(page: Page): Promise<void> {
  await openPausedClock(page);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  const seed = sessionRecord(
    { ...seatSession(DEFAULT_SESSION_CONFIG), handNumber: 25 },
    { sessionId: SESSION_ID, startedAt: STARTED, updatedAt: STARTED },
  );
  await page.evaluate(seedStoredSessions, [seed]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 24 hands · paused',
  );
  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #25');
  await runUntilMyTurn(page);
}

async function openLeaveDialog(page: Page): Promise<void> {
  await leaveTable(page).click();
  await expect(leaveDialog(page)).toBeVisible();
}

test('Leave table during a hand asks first and nothing moves while the dialog is open', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await resumeAtHand25(page);
  const count = await actionCount(page);

  await openLeaveDialog(page);
  const dialog = leaveDialog(page);
  expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
  await expect(dialog.getByRole('button')).toHaveText(['Cancel', 'Confirm']);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(tableSection(page)).toBeVisible();
  await expect(page.locator('main[aria-busy="true"]')).toHaveCount(0);

  await page.clock.runFor(5000);
  await expect(dialog).toBeVisible();
  expect(await actionCount(page)).toBe(count);
  await expectToAct(page, '5');
  const [session] = (await storedSessions(page)) as [Json];
  expect(session.endedAt).toBeUndefined();
  expect(await storedReports(page)).toEqual([]);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Cancel resumes the hand with the same cards, stack and player to act', async ({ page }) => {
  await resumeAtHand25(page);
  const cards = page.locator('[aria-label="Your cards"]');
  const snapshot = async () => ({
    cards: await cards.ariaSnapshot(),
    stack: await user(page).locator('[data-part="stack"]').textContent(),
    count: await actionCount(page),
    toAct: await toActSeat(page),
  });

  await openLeaveDialog(page);
  const before = await snapshot();
  await leaveDialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(leaveDialog(page)).toBeHidden();
  expect(await snapshot()).toEqual(before);
  expect(before.toAct).toBe('5');
  await expect(leaveTable(page)).toBeFocused();

  // Escape on a reopened dialog acts as Cancel.
  await openLeaveDialog(page);
  await page.keyboard.press('Escape');
  await expect(leaveDialog(page)).toBeHidden();
  await expect(leaveTable(page)).toBeFocused();
  expect(await snapshot()).toEqual(before);

  await expect(callButton(page)).toBeEnabled();
  await callButton(page).click();
  await expect.poll(() => actionCount(page)).toBe(before.count + 1);
  await expectToAct(page, '6');

  // Seat 6 to act: the dialog holds its turn, and Cancel lets seat 6 act next.
  const seat6 = page.locator('li[data-seat="6"] [data-part="action"]');
  await openLeaveDialog(page);
  await page.clock.runFor(1000);
  await workerRepliesSettled(page);
  await page.clock.runFor(1000);
  expect(await actionCount(page)).toBe(before.count + 1);
  await expect(seat6).toHaveCount(0);
  await leaveDialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(leaveDialog(page)).toBeHidden();
  const after = before.count + 1;
  await runUntil(page, async () => (await actionCount(page)) > after, {
    label: 'seat 6 did not act',
  });
  await expect(seat6).not.toHaveText(/^(Waiting)?$/);
});

test('Confirm while a bot is to act folds the user at once and ends after hand 25', async ({
  page,
}) => {
  await resumeAtHand25(page);
  await callButton(page).click();
  await expectToAct(page, '6');
  const n = await actionCount(page);

  await openLeaveDialog(page);
  await leaveDialog(page).getByRole('button', { name: 'Confirm' }).click();
  await expect(leaveDialog(page)).toHaveCount(0);
  await expect(userAction(page)).toHaveText('Folded');
  await expectToAct(page, '6');
  expect(await actionCount(page)).toBe(n + 1);

  await runUntil(page, async () => reportHeading(page).isVisible(), {
    label: 'no Session report',
  });
  await expect(reportHeading(page)).toBeFocused();
  await expect(headerLine(page)).toHaveText('Cash · 6 players · $4/$8 · 25 hands');

  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([25]);
  const [record] = records as [Json];
  expect(record.forcedFold).toBe(true);
  const decisions = record.decisions as { action: { type: string } }[];
  expect(decisions).toHaveLength(1);
  expect(decisions[0]?.action.type).toBe('call');
  const actions = record.actions as { seat: number; type: string }[];
  const call = actions.findIndex((a) => a.seat === 5 && a.type === 'call');
  const fold = actions.findIndex((a) => a.seat === 5 && a.type === 'fold');
  expect(call).toBeGreaterThanOrEqual(0);
  expect(fold).toBe(call + 1);

  const [session] = (await storedSessions(page)) as [Json];
  expect(session.handsPlayed).toBe(25);
  const endedAt = session.endedAt as string;
  expect(new Date(endedAt).toISOString()).toBe(endedAt);
  const reports = await storedReports(page);
  expect(reports.map((r) => r.handsPlayed)).toEqual([25]);

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveCount(0);
});

test('Confirm during hand 1 of a cash game stores and shows a 1-hand report', async ({ page }) => {
  await openPausedClock(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntilMyTurn(page);
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');

  await openLeaveDialog(page);
  await leaveDialog(page).getByRole('button', { name: 'Confirm' }).click();
  await expect(userAction(page)).toHaveText('Folded');

  await runUntil(page, async () => reportHeading(page).isVisible(), {
    label: 'no Session report',
  });
  await expect(reportHeading(page)).toBeFocused();
  await expect(headerLine(page)).toHaveText('Cash · 6 players · $4/$8 · 1 hand');
  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([1]);
  expect(records[0]?.forcedFold).toBe(true);
  expect(records[0]?.decisions).toEqual([]);
  expect((await storedReports(page)).map((r) => r.handsPlayed)).toEqual([1]);
});
