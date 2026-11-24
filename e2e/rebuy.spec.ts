import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession, type TableState } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  seedStoredSessions,
  storedRecords,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-3.11: Rebuy / Leave table when the user's cash stack reaches $0 (REQ-007). A-6: a stored session with
// the user on $4 in the big blind of hand 13; the pinned words bust the user (tests/table/rebuy.acceptance).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'e'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00Z');

type Json = Record<string, unknown>;

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const bustDialog = (page: Page) => page.getByRole('dialog', { name: 'Out of chips' });
const userSeat = (page: Page) => page.locator('li[data-user]');
const headerFor = (hand: number) => `Cash · 6 players · $4/$8 · Hand #${hand}`;

/** The A-6 seed: default 6-max, all TAG, 12 hands played, the user on $4 in the big blind of hand 13. */
function seededSession(): SessionRecord {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  const table: TableState = {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 4 } : s)),
    button: 3,
    handNumber: 13,
  };
  return sessionRecord(table, { sessionId: SESSION_ID, startedAt: STARTED, updatedAt: STARTED });
}

const userStack = (record: Json): number | undefined =>
  (record.seats as SessionRecord['seats']).find((s) => s.kind === 'user')?.stack;

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

/** Seeds the A-6 session, resumes it and runs hand 13 to its result: the dialog is open. */
async function bustAtHand13(page: Page): Promise<void> {
  await openPausedClock(page);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [seededSession()]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 12 hands · paused',
  );
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(headerFor(13));
  await runUntil(page, async () => (await handOver(page).count()) > 0, {
    label: 'hand 13 has no result',
  });
  await expect(bustDialog(page)).toBeVisible();
  await expect.poll(async () => (await storedRecords(page)).length).toBe(1);
}

test('a bust opens the Rebuy and Leave table dialog and no hand is dealt after 1.5 s', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await bustAtHand13(page);

  const dialog = bustDialog(page);
  await expect(dialog.getByRole('button')).toHaveText(['Rebuy', 'Leave table']);
  await expect(dialog.getByRole('button', { name: 'Rebuy' })).toBeFocused();
  await expect(userSeat(page).locator('[data-part="stack"]')).toHaveText('$0');

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveText(headerFor(13));
  await expect(bustDialog(page)).toBeVisible();
  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([13]);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  const [session] = sessions as [Json];
  expect(session.handsPlayed).toBe(13);
  expect(userStack(session)).toBe(0);
  expect(session.rebuys).toBe(0);

  await page.keyboard.press('Escape');
  await page.clock.runFor(100);
  await expect(bustDialog(page)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Rebuy' })).toBeVisible();

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Rebuy sets the stack to $160, deals the next hand and counts one rebuy', async ({ page }) => {
  await bustAtHand13(page);

  await bustDialog(page).getByRole('button', { name: 'Rebuy' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(header(page)).toHaveText(headerFor(14));
  const stack = Number(
    ((await userSeat(page).locator('[data-part="stack"]').textContent()) ?? '').replace('$', ''),
  );
  const street = userSeat(page).locator('[data-part="street"]');
  const streetAmount =
    (await street.count()) === 0
      ? 0
      : Number(/\$(\d+)$/.exec((await street.textContent()) ?? '')?.[1]);
  expect(stack + streetAmount).toBe(160);

  await playToResult(page, 14, fakeSlice(page));
  await expect.poll(async () => (await storedRecords(page)).length).toBe(2);
  const record = (await storedRecords(page)).find((r) => r.handNumber === 14);
  const user = (record?.seats as { kind: string; startingStack: number }[] | undefined)?.find(
    (s) => s.kind === 'user',
  );
  expect(user?.startingStack).toBe(160);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(14);
  expect((await storedSessions(page))[0]?.rebuys).toBe(1);
});

test('Leave table in the bust dialog ends the session and opens its Session Report', async ({
  page,
}) => {
  await bustAtHand13(page);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(13);

  await bustDialog(page).getByRole('button', { name: 'Leave table' }).click();
  await expect(reportHeading(page)).toBeVisible();
  await expect(reportHeading(page)).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.report-header-line')).toHaveText(
    'Cash · 6 players · $4/$8 · 13 hands',
  );
  await expect(page.locator('.report-kpi dt')).toHaveText(['Result', 'BB/100', 'Rebuys']);
  await expect(page.locator('.report-kpi dd')).toHaveText(['-$160', '-153.8', '0']);

  await page.clock.runFor(5000);
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([13]);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.handsPlayed).toBe(13);
  expect(typeof sessions[0]?.endedAt).toBe('string');
  const reports = await storedReports(page);
  expect(reports).toHaveLength(1);
  expect(reports[0]?.endedAt).toBe(sessions[0]?.endedAt);
  await expect(header(page)).toHaveCount(0);
});

test('no rebuy or add-chips control while the user has chips', async ({ page }) => {
  await openPausedClock(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  const expectNoControl = async (): Promise<void> => {
    await expect(page.getByRole('button', { name: /rebuy|add chips/i })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };

  await runUntilMyTurn(page);
  await expectNoControl();
  await playToResult(page, 1, fakeSlice(page));
  await expect(handOver(page)).toHaveCount(1);
  await expectNoControl();
  await advanceToHand(page, 2, fakeSlice(page));
  await expectNoControl();
});
