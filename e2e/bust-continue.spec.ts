import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession, type TableState } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import {
  handOver,
  header,
  playToResult,
  seedStoredSessions,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-9.2: a cash bust with the review open shows Continue, which opens the Out of chips dialog (REQ-007.6).
// A-5: a stored session with the user on $12; the pinned words bust the user after three check/call
// decisions (tests/ui/bust-continue.acceptance).

const ORIGIN = 'http://localhost:4173';
const WORDS = [1, 1, 2, 3];
const SESSION_ID = 'f'.repeat(32);
const STARTED = new Date('2026-11-24T10:00:00Z');

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const bustDialog = (page: Page) => page.getByRole('dialog', { name: 'Out of chips' });
const reviewPanel = (page: Page) => page.getByRole('complementary');
const continueButton = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true });
const dealNextButton = (page: Page) => page.getByRole('button', { name: 'Deal next hand' });
const userSeat = (page: Page) => page.locator('li[data-user]');
const headerFor = (hand: number) => `Cash · 6 players · $4/$8 · Hand #${hand}`;

/** The A-5 seed: default 6-max, all TAG, 12 hands played, the user on $12, button on seat 3, hand 13. */
function seededSession(): SessionRecord {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  const table: TableState = {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 12 } : s)),
    button: 3,
    handNumber: 13,
  };
  return sessionRecord(table, { sessionId: SESSION_ID, startedAt: STARTED, updatedAt: STARTED });
}

/** Seeds the A-5 session, resumes it and plays hand 13 to its result with check/call: the review is open. */
async function bustWithReview(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [seededSession()]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 12 hands · paused',
  );
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(headerFor(13));
  await playToResult(page, 13, fakeSlice(page), { play: 'call' });
  await expect(handOver(page)).toHaveCount(1);
  await expect(page.getByRole('complementary', { name: 'Hand #13 review' })).toBeVisible();
  await expect(userSeat(page).locator('[data-part="stack"]')).toHaveText('$0');
  await expect(continueButton(page)).toBeVisible();
  await expect(dealNextButton(page)).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedRecords(page)).length).toBe(1);
}

test('a bust with the review open shows Continue, which opens the dialog, and Rebuy deals with $160', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await bustWithReview(page);
  await axeWithPausedClock(page);

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveText(headerFor(13));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(continueButton(page)).toBeVisible();

  await continueButton(page).click();
  const dialog = bustDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveText(['Rebuy', 'Leave table']);
  await expect(dialog.getByRole('button', { name: 'Rebuy' })).toBeFocused();
  await expect(reviewPanel(page)).toHaveCount(0);
  await expect(continueButton(page)).toHaveCount(0);

  await page.clock.runFor(5000);
  await expect(header(page)).toHaveText(headerFor(13));
  await expect(dialog).toBeVisible();
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([13]);
  await axeWithPausedClock(page);

  await dialog.getByRole('button', { name: 'Rebuy' }).click();
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

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Leave table from the dialog opened by Continue deals nothing more', async ({ page }) => {
  await bustWithReview(page);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(13);
  const [before] = await storedSessions(page);

  await continueButton(page).click();
  await bustDialog(page).getByRole('button', { name: 'Leave table' }).click();
  await expect(homeHeading(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.clock.runFor(5000);
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([13]);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(JSON.stringify(sessions[0])).toBe(JSON.stringify(before));
  expect(sessions[0]).not.toHaveProperty('endedAt');

  await resumeButton(page).click();
  await expect(bustDialog(page)).toBeVisible();
  await expect(header(page)).toHaveText(headerFor(14));
});
