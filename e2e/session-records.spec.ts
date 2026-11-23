import { expect, test, type Page } from '@playwright/test';
import { configForLineUp, DEFAULT_SESSION_CONFIG } from '../src/table/session';
import { parseSessionRecord } from '../src/table/session-record';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = /^[0-9a-f]{32}$/;

const fakeSlice = (page: Page) => () => page.clock.runFor(50);

test('the session record is written at start and after each hand and survives a reload mid-hand', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  // Game Config's defaults: $4/$8 cash, 6 players, the Mixed line-up.
  await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
  const [start] = await storedSessions(page);
  expect(start?.handsPlayed).toBe(0);
  expect(start?.sessionId).toMatch(SESSION_ID);
  expect(start?.config).toEqual(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed'));
  expect(parseSessionRecord(start)).toBe(start);

  for (const hand of [1, 2]) {
    await advanceToHand(page, hand, fakeSlice(page));
    await playToResult(page, hand, fakeSlice(page));
  }
  await advanceToHand(page, 3, fakeSlice(page));
  await expect(header(page)).toHaveText(/Hand #3$/);
  await expect(handOver(page)).toHaveCount(0);

  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  const [session] = sessions;
  expect(session?.handsPlayed).toBe(2);
  expect(session?.sessionId).toBe(start?.sessionId);
  expect(session?.startedAt).toBe(start?.startedAt);
  expect(parseSessionRecord(session)).toBe(session);
  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([1, 2]);
  expect(records.every((r) => r.sessionId === session?.sessionId)).toBe(true);

  await page.reload();
  expect(await storedSessions(page)).toEqual([session]);
  const after = await storedRecords(page);
  expect(after).toHaveLength(2);
  expect(after.some((r) => r.handNumber === 3)).toBe(false);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
