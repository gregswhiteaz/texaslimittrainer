import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession, type TableState } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import { handOver, header, playToResult, seedStoredSessions } from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-3.21: without the top-up a short user plays their own chips. A-4: a stored session with the user on
// $50 in hand 13 (button 3); the pinned words leave the user on $18, and hand 14 reaches every all-in label
// and a live side pot (tests/table/short-stack.acceptance pins the same values headlessly).

const ORIGIN = 'http://localhost:4173';
const WORDS = [40, 1, 2, 3];
const SESSION_ID = 'f'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00Z');

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const userSeat = (page: Page) => page.locator('li[data-user]');
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const potItems = (page: Page) =>
  page.getByRole('list', { name: 'Pots', exact: true }).getByRole('listitem');
const actionCount = async (page: Page): Promise<number> =>
  Number(await page.getByRole('region', { name: 'Table' }).getAttribute('data-action-count'));

/** The A-4 seed: default 6-max, all TAG, 12 hands played, the user on $50 with the button on seat 3. */
function seededSession(): SessionRecord {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  const table: TableState = {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 50 } : s)),
    button: 3,
    handNumber: 13,
  };
  return sessionRecord(table, { sessionId: SESSION_ID, startedAt: STARTED, updatedAt: STARTED });
}

/** Waits (real time) until no bot decision is in flight: the action count holds across two reads. */
async function settled(page: Page): Promise<void> {
  let before = await actionCount(page);
  for (;;) {
    await page.waitForTimeout(250);
    const now = await actionCount(page);
    if (now === before) return;
    before = now;
  }
}

test('a short user sees all-in labels, side pots and pot winners in the live session', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main menu' })).not.toHaveAttribute(
    'data-paused',
    'loading',
  );
  await page.evaluate(seedStoredSessions, [seededSession()]);
  await page.reload();
  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #13');

  await playToResult(page, 13, fakeSlice(page), { play: 'call' });
  await expect(userSeat(page).locator('[data-part="stack"]')).toHaveText('$18');

  // The user decided in hand 13, so its review holds the auto-deal; Deal next hand takes the same nextHand path.
  await page.getByRole('button', { name: 'Deal next hand' }).click();
  await runUntil(page, async () => (await handOver(page).count()) === 0, {
    label: 'hand 14 was not dealt',
  });
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #14');
  const stack = Number(
    ((await userSeat(page).locator('[data-part="stack"]').textContent()) ?? '').replace('$', ''),
  );
  const street = userSeat(page).locator('[data-part="street"]');
  const streetAmount =
    (await street.count()) === 0
      ? 0
      : Number(/\$(\d+)$/.exec((await street.textContent()) ?? '')?.[1]);
  expect(stack + streetAmount).toBe(18);
  await expect(userSeat(page).locator('[data-part="stack"]')).not.toHaveText('$160');

  const labels: string[][] = [];
  let mostPots = 0;
  let checkedPots = false;
  for (let slice = 0; (await handOver(page).count()) === 0; slice++) {
    if (slice >= 2000) throw new Error('hand 14 has no result');
    const pots = await potItems(page).count();
    mostPots = Math.max(mostPots, pots);
    if (pots >= 2 && !checkedPots) {
      await settled(page);
      await expect(page.getByRole('list', { name: 'Pots', exact: true })).toBeVisible();
      await axeWithPausedClock(page);
      checkedPots = true;
    }
    if ((await enabledActions(page).count()) > 0) {
      const texts = await yourActions(page).getByRole('button').allTextContents();
      labels.push(texts);
      const before = await actionCount(page);
      await yourActions(page)
        .getByRole('button', { name: texts.includes('Check') ? 'Check' : /^Call / })
        .click();
      await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
      continue;
    }
    await page.clock.runFor(50);
  }
  // Three full-size turns first (from the small blind and a $4 flop bet offered), then the all-ins.
  expect(labels).toEqual([
    ['Fold', 'Call $6', 'Raise to $12'],
    ['Fold', 'Call $4', 'Raise to $16'],
    ['Check', 'Bet $4'],
    ['Fold', 'Call $4', 'Raise all-in to $6'],
    ['Check', 'Bet all-in $2'],
    ['Fold', 'Call all-in $2'],
  ]);
  expect(mostPots).toBeGreaterThanOrEqual(2);
  expect(checkedPots).toBe(true);

  await expect(page.getByRole('list', { name: 'Pot winners' }).getByRole('listitem')).toHaveText([
    'Main pot $54 · Dee wins $54',
    // TASK-7.32: the bots read action ranges and fold earlier, so the side pot is $44 ($124 before).
    'Side pot $44 · Dee wins $44',
  ]);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
