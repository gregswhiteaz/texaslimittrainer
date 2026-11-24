import { expect, test, type Page } from '@playwright/test';
import { parseHandRecord } from '../src/table/hand-record';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  seedStoredRecords,
  storedCount,
  storedRecords,
} from './support/hand-records';
import {
  buildRecordsHarness,
  openRecordsHarness,
  stubReplayWords,
} from './support/table-harness-bundle';
import type { RecordsHarnessLog } from './support/records-harness';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003 (the same deck every hand). */
const WORDS = [0x9e3779b9, 1, 2, 3];
const PINNED_CODE = '9e3779b9000000010000000200000003';
const SESSION_ID = /^[0-9a-f]{32}$/;

let bundle: string;
test.beforeAll(async () => {
  bundle = await buildRecordsHarness();
});

/** Fake timers that only advance through clock.runFor. */
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

const fakeSlice = (page: Page) => () => page.clock.runFor(50);

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await startGame(page);
}

async function startGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
}

const harnessLog = (page: Page): Promise<RecordsHarnessLog> =>
  page.evaluate(() => window.__records);

async function eventAt(page: Page, event: string): Promise<number> {
  const found = (await harnessLog(page)).events.find((e) => e.event === event);
  if (found === undefined) throw new Error(`No ${event} event`);
  return found.at;
}

/** Runs the paused clock forward to fake time `at` (performance.now()). */
async function runTo(page: Page, at: number): Promise<void> {
  const now = await page.evaluate(() => performance.now());
  if (at > now) await page.clock.runFor(at - now);
}

async function expectSavedBeforeDeal(page: Page, resultAt: number): Promise<void> {
  const events = (await harnessLog(page)).events.map((e) => e.event);
  const saved = events.indexOf('saved:1');
  expect(saved).toBeGreaterThanOrEqual(0);
  expect(saved).toBeLessThan(events.indexOf('header:2'));
  expect(await eventAt(page, 'header:2')).toBeGreaterThanOrEqual(resultAt + 2000);
}

test("a hand's record is readable when the next hand is dealt and after a reload", async ({
  page,
}) => {
  await installPausedClock(page);
  await openApp(page);
  await playToResult(page, 1, fakeSlice(page));
  await advanceToHand(page, 2, fakeSlice(page));

  const records = await storedRecords(page);
  expect(records).toHaveLength(1);
  const [record] = records;
  expect(record?.handNumber).toBe(1);
  expect(record?.replayCode).toBe(PINNED_CODE);
  expect(record?.sessionId).toMatch(SESSION_ID);
  const json = JSON.stringify(record);

  await page.reload();
  const reloaded = await storedRecords(page);
  expect(reloaded).toHaveLength(1);
  expect(JSON.stringify(reloaded[0])).toBe(json);
});

test('the next hand is not dealt until a 2 s delayed write completes', async ({ page }) => {
  await installPausedClock(page);
  await openRecordsHarness(page, bundle, WORDS, { store: 'delay', delayMs: 2000 });
  await playToResult(page, 1, fakeSlice(page));
  const resultAt = await eventAt(page, 'result');

  await runTo(page, resultAt + 1900);
  await expect(header(page)).toHaveText(/Hand #1$/);
  expect(await storedCount(page)).toBe(0);

  await advanceToHand(page, 2, fakeSlice(page));
  await expectSavedBeforeDeal(page, resultAt);
  expect(await storedCount(page)).toBe(1);
});

test('Deal next hand waits for the write', async ({ page }) => {
  await installPausedClock(page);
  await openRecordsHarness(page, bundle, WORDS, { store: 'delay', delayMs: 2000 });
  await playToResult(page, 1, fakeSlice(page), { play: 'call' });
  const resultAt = await eventAt(page, 'result');

  await page.getByRole('button', { name: 'Deal next hand' }).click();
  await runTo(page, resultAt + 1900);
  await expect(header(page)).toHaveText(/Hand #1$/);
  expect(await storedCount(page)).toBe(0);

  await advanceToHand(page, 2, fakeSlice(page));
  await expectSavedBeforeDeal(page, resultAt);
});

test('the record stores the time the hand completed', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-17T14:32:05Z'));
  await openApp(page);
  await playToResult(page, 1, () => page.waitForTimeout(50));
  await expect.poll(() => storedCount(page)).toBe(1);
  const [record] = await storedRecords(page);
  expect(record?.completedAt).toBe('2026-11-17T14:32:05.000Z');
});

test('a stored record is unchanged by later hands and leaving the table', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);
  await playToResult(page, 1, fakeSlice(page));
  await expect.poll(() => storedCount(page)).toBe(1);
  const before = JSON.stringify((await storedRecords(page))[0]);

  for (const hand of [2, 3]) {
    await advanceToHand(page, hand, fakeSlice(page));
    await playToResult(page, hand, fakeSlice(page));
  }
  await page.getByRole('button', { name: 'Leave table' }).click();
  await expect.poll(() => storedCount(page)).toBe(3);

  const records = await storedRecords(page);
  const first = records.find((r) => r.handNumber === 1);
  expect(JSON.stringify(first)).toBe(before);
  await page.clock.runFor(5000);
  expect(await storedCount(page)).toBe(3);
});

const OLD_SESSION = 'f'.repeat(32);
const DAY_MS = 24 * 60 * 60 * 1000;

function oldRecord(handNumber: number, now: number): Record<string, unknown> {
  const seats = ['Ava', 'Ben', 'Cal', 'Dee', 'You', 'Eli'].map((name, index) => {
    const user = name === 'You';
    return {
      seat: index + 1,
      kind: user ? 'user' : 'bot',
      botId: user ? null : index < 4 ? index + 1 : 5,
      name,
      style: user ? null : 'TAG',
      startingStack: 160,
    };
  });
  const fold = (seat: number) => ({ street: 'preflop', seat, type: 'fold', amount: 0, added: 0 });
  return {
    sessionId: OLD_SESSION,
    handNumber,
    completedAt: new Date(now - (730 + handNumber / 1000) * DAY_MS).toISOString(),
    replayCode: PINNED_CODE,
    gameType: 'cash',
    stake: { smallBet: 4, bigBet: 8 },
    level: null,
    stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
    lineUp: 'Custom',
    button: 6,
    userSeat: 5,
    seats,
    userHoleCards: [0, 13],
    actions: [
      { street: 'preflop', seat: 1, type: 'small-blind', amount: 2, added: 2 },
      { street: 'preflop', seat: 2, type: 'big-blind', amount: 4, added: 4 },
      fold(3),
      fold(4),
      fold(5),
      fold(6),
      fold(1),
    ],
    decisions: [
      {
        street: 'preflop',
        action: { seat: 5, type: 'fold' },
        recommended: { seat: 5, type: 'fold' },
        alternative: null,
        ruleId: null,
        basis: 'chart',
        equityPct: null,
        requiredEquityPct: null,
        opponentBasis: [],
        explanation: 'Fold: this hand is not in the opening chart from this seat.',
        grade: { grade: 'correct', ruleId: 'match', marginPts: null },
        hinted: false,
      },
    ],
    board: [],
    shown: null,
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 0, amount: 4, winners: [{ seat: 2, amount: 4 }] }],
      returned: { seat: 2, amount: 2 },
    },
  };
}

test('1,000 records from 2 years ago are kept after launch and play', async ({ page }) => {
  test.setTimeout(60_000);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const now = Date.now();
  const seeded = Array.from({ length: 1000 }, (_, i) => oldRecord(i + 1, now));
  for (const record of seeded) parseHandRecord(record);

  await installPausedClock(page);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.evaluate(seedStoredRecords, seeded);
  await page.reload();
  await startGame(page);
  await playToResult(page, 1, fakeSlice(page));
  await advanceToHand(page, 2, fakeSlice(page));
  await page.getByRole('button', { name: 'Leave table' }).click();

  await expect.poll(() => storedCount(page)).toBe(1001);
  const kept = (await storedRecords(page)).filter((r) => r.sessionId === OLD_SESSION);
  expect(kept.map((r) => JSON.stringify(r))).toEqual(seeded.map((r) => JSON.stringify(r)));

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('onHandComplete fires exactly once per hand even with the same replay code', async ({
  page,
}) => {
  await installPausedClock(page);
  await openRecordsHarness(page, bundle, WORDS, { churn: true });

  await playToResult(page, 1, fakeSlice(page));
  await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(1);
  const renders = (await harnessLog(page)).renders;
  const resultAt = await eventAt(page, 'result');
  await runTo(page, resultAt + 1450);
  const paused = await harnessLog(page);
  expect(paused.renders - renders).toBeGreaterThanOrEqual(10);
  expect(paused.calls).toHaveLength(1);
  await advanceToHand(page, 2, fakeSlice(page));
  await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(1);

  await playToResult(page, 2, fakeSlice(page));
  await expect.poll(async () => (await harnessLog(page)).calls).toHaveLength(2);
  await advanceToHand(page, 3, fakeSlice(page));
  await playToResult(page, 3, fakeSlice(page));
  await expect
    .poll(async () => (await harnessLog(page)).calls)
    .toEqual([PINNED_CODE, PINNED_CODE, PINNED_CODE]);

  await expect.poll(() => storedCount(page)).toBe(3);
  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([1, 2, 3]);
  expect(records.map((r) => r.replayCode)).toEqual([PINNED_CODE, PINNED_CODE, PINNED_CODE]);
});

test('a new onHandComplete on each render does not restart the 1.5 s timer', async ({ page }) => {
  await installPausedClock(page);
  await openRecordsHarness(page, bundle, WORDS, { churn: true });
  await playToResult(page, 1, fakeSlice(page));
  const resultAt = await eventAt(page, 'result');

  await runTo(page, resultAt + 1400);
  await expect(header(page)).toHaveText(/Hand #1$/);
  await runTo(page, resultAt + 1600);
  await expect(header(page)).toHaveText(/Hand #2$/);
  expect(await eventAt(page, 'header:2')).toBeLessThanOrEqual(resultAt + 1600);
});

test('a failed write stops dealing', async ({ page }) => {
  const console: string[] = [];
  const errors: Error[] = [];
  page.on('console', (message) => console.push(message.text()));
  page.on('pageerror', (error) => errors.push(error));
  await installPausedClock(page);
  await openRecordsHarness(page, bundle, WORDS, { store: 'fail' });
  await playToResult(page, 1, fakeSlice(page));

  for (let slice = 0; slice < 100; slice++) await page.clock.runFor(50);
  await expect(header(page)).toHaveText(/Hand #1$/);
  await expect(handOver(page)).toBeVisible();
  expect(console.some((text) => text.includes('Hand record could not be saved'))).toBe(true);
  expect(errors).toEqual([]);
  expect((await harnessLog(page)).events.map((e) => e.event)).not.toContain('unhandled');
  await expect(page.getByRole('button', { name: 'Leave table' })).toBeEnabled();
  expect(await storedCount(page)).toBe(0);
});
