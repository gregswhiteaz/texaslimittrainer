import { expect, test, type Page } from '@playwright/test';
import type { ObservedOpponent } from '../src/advice/ranges';
import { advanceToHand, playToResult } from './support/hand-records';
import { runUntilMyTurn } from './support/paused-clock';
import type { RecordsHarnessLog } from './support/records-harness';
import { buildRecordsHarness, openRecordsHarness } from './support/table-harness-bundle';

// The live session's observed counts (TASK-8.1 fix r1): the hint request and the stored decisions.

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];

declare global {
  interface Window {
    __recommendObserved: (readonly ObservedOpponent[] | null)[];
  }
}

/** Init script: records the `observed` of every recommend request posted to a worker (null if absent). */
function recordRecommends(): void {
  const sent: (readonly ObservedOpponent[] | null)[] = [];
  window.__recommendObserved = sent;
  const post = Worker.prototype.postMessage as (this: Worker, ...args: unknown[]) => void;
  Worker.prototype.postMessage = function (this: Worker, ...args: unknown[]): void {
    const message = args[0] as { kind?: unknown; observed?: readonly ObservedOpponent[] } | null;
    if (message?.kind === 'recommend') sent.push(message.observed ?? null);
    post.apply(this, args);
  };
}

const hintToggle = (page: Page) => page.locator('button.hint-toggle');

async function actionCount(page: Page): Promise<number> {
  return Number(
    await page.getByRole('region', { name: 'Table' }).getAttribute('data-action-count'),
  );
}

/** Selects Hint and waits for a ready card. */
async function openReadyHint(page: Page): Promise<void> {
  await hintToggle(page).click();
  await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
}

/** Check if offered, else the call; waits until it is applied. */
async function checkOrCall(page: Page): Promise<void> {
  const before = await actionCount(page);
  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  const check = enabled.filter({ hasText: /^Check$/ });
  await ((await check.count()) > 0 ? check : enabled.filter({ hasText: /^Call / })).click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

let bundle: string;
test.beforeAll(async () => {
  bundle = await buildRecordsHarness();
});

test("the hint and the user's stored decisions carry the session's observed snapshot", async ({
  page,
}) => {
  const fakeSlice = () => page.clock.runFor(50);
  const lastRecommend = async (): Promise<readonly ObservedOpponent[] | null | undefined> =>
    (await page.evaluate(() => window.__recommendObserved)).at(-1);
  const harnessLog = (): Promise<RecordsHarnessLog> => page.evaluate(() => window.__records);
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(recordRecommends);
  await openRecordsHarness(page, bundle, WORDS);

  // Hand 1: no hand has finished, so the hint is sent an empty snapshot.
  await runUntilMyTurn(page);
  await openReadyHint(page);
  expect(await lastRecommend()).toEqual([]);
  await checkOrCall(page);
  await playToResult(page, 1, fakeSlice, { play: 'call' });
  const deal = page.getByRole('button', { name: 'Deal next hand' });
  if ((await deal.count()) > 0) await deal.click();
  await advanceToHand(page, 2, fakeSlice);

  // Hand 2: one entry per bot seat, ascending, each with the one finished hand; never the user's seat.
  await runUntilMyTurn(page);
  const seats = page.locator('ul[aria-label="Seats"] > li[data-seat]');
  const userSeat = Number(await page.locator('li[data-user]').getAttribute('data-seat'));
  const botSeats = (await seats.evaluateAll((items) => items.map((li) => li.dataset.seat)))
    .map(Number)
    .filter((seat) => seat !== userSeat)
    .sort((a, b) => a - b);
  expect(botSeats.length).toBeGreaterThan(0);
  await openReadyHint(page);
  const hinted = await lastRecommend();
  expect(hinted?.map((o) => o.seat)).toEqual(botSeats);
  expect(hinted?.every((o) => o.hands === 1)).toBe(true);
  await checkOrCall(page);
  await playToResult(page, 2, fakeSlice, { play: 'call' });

  // Each decision stored the snapshot the hint used: empty in hand 1, the hand-2 hint's in hand 2.
  await expect.poll(async () => (await harnessLog()).observed.length).toBe(2);
  const [hand1, hand2] = (await harnessLog()).observed;
  expect(hand1?.length).toBeGreaterThan(0);
  for (const observed of hand1 ?? []) expect(observed).toEqual([]);
  expect(hand2?.length).toBeGreaterThan(0);
  for (const observed of hand2 ?? []) expect(observed).toEqual(hinted);
});
