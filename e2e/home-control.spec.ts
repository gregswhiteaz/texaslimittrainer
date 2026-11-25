import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { replayCodeFromWords } from '../src/engine/deck';
import type { SeatNumber } from '../src/engine/hand';
import { styleCounts, styleStats } from '../src/stats/style-stats';
import { parseHandRecord } from '../src/table/hand-record';
import { DEFAULT_SESSION_CONFIG, seatSession } from '../src/table/session';
import { handWrite, type SessionRecord } from '../src/table/session-record';
import { playSession } from '../tests/support/session-play';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  seedStoredRecords,
  seedStoredSessions,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.14: the Table header's Home control pauses the session (REQ-004.9). One flow per browser, so the
// tests run in order on one page: hand 10 between hands (SPEC-02, SPEC-03), then hand 11 mid-hand (SPEC-04,
// SPEC-06, SPEC-05).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'd'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00Z');
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);

type Json = Record<string, unknown>;

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeButton = (page: Page) => page.getByRole('button', { name: 'Home', exact: true });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });

/** Records 1–9 and the session after hand 9 of a default 6-max session, played headless (A-4). */
function afterHand9(): { records: Json[]; session: SessionRecord } {
  const played = playSession(seatSession(DEFAULT_SESSION_CONFIG), 9, (n) =>
    replayCodeFromWords([0x9e3779b9, n, 2, 3]),
  );
  const writes = played.map((table, i) =>
    handWrite(table, { sessionId: SESSION_ID, startedAt: STARTED, completedAt: at(i + 1) }),
  );
  const last = writes.at(-1);
  if (last === undefined) throw new Error('No hands played');
  return { records: writes.map((w) => w.record as unknown as Json), session: last.session };
}

/** Runs in the page: the object store names of the existing tlh-trainer database. */
function storeNames(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const names = [...open.result.objectStoreNames];
      open.result.close();
      resolve(names);
    };
  });
}

/** Name and stack text of each seat in the Seats list, by seat number. */
const seatRows = (page: Page) =>
  page
    .getByRole('list', { name: 'Seats' })
    .getByRole('listitem')
    .evaluateAll((lis) =>
      lis
        .map((li) => ({
          seat: Number(li.getAttribute('data-seat')),
          name: li.querySelector('[data-part="name"]')?.textContent ?? '',
          stack: li.querySelector('[data-part="stack"]')?.textContent ?? '',
        }))
        .sort((a, b) => a.seat - b.seat),
    );

const storedRows = (record: Json) =>
  (record.seats as SessionRecord['seats']).map(({ seat, name, stack }) => ({
    seat,
    name,
    stack: `$${stack}`,
  }));

const actionCount = async (page: Page): Promise<number> =>
  Number(await tableSection(page).getAttribute('data-action-count'));

const statsBySeat = (records: Json[]) => {
  const parsed = records.map((r) => parseHandRecord(r));
  return ([1, 2, 3, 4, 5, 6] as SeatNumber[]).map((seat) => styleStats(styleCounts(parsed, seat)));
};

async function expectPausedHome(page: Page, hands: number): Promise<void> {
  await expect(homeHeading(page)).toBeVisible();
  await expect(homeHeading(page)).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    `Cash · 6 players · $4/$8 · ${hands} hands · paused`,
  );
}

/** Exactly one stored session, equal to `expected` and not ended, and no store besides hands, meta, reports, sessions and settings (TASK-12.1, TASK-13.2). */
async function expectSessionUnchanged(page: Page, expected: Json): Promise<void> {
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]).toEqual(expected);
  expect(sessions[0]).not.toHaveProperty('endedAt');
  expect(await page.evaluate(storeNames)).toEqual([
    'hands',
    'meta',
    'reports',
    'sessions',
    'settings',
  ]);
}

test.describe.serial('the Home control pauses the session', () => {
  let context: BrowserContext;
  let page: Page;
  const requests: string[] = [];
  let after10: Json;
  let recordsAfter10: Json[];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.on('request', (request) => requests.push(request.url()));
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.addInitScript(stubReplayWords, WORDS);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Home between hands after hand 10 opens Home with Resume showing 10 hands and the session not ended', async () => {
    const seed = afterHand9();
    await page.goto('/');
    await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
    await page.evaluate(seedStoredRecords, seed.records);
    await page.evaluate(seedStoredSessions, [seed.session]);
    await page.reload();
    await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
      'Cash · 6 players · $4/$8 · 9 hands · paused',
    );

    await resumeButton(page).click();
    await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #10');
    await runUntilMyTurn(page);
    await expect(homeButton(page)).toBeVisible();
    await axeWithPausedClock(page);
    await playToResult(page, 10, fakeSlice(page));
    await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(10);
    const [stored] = await storedSessions(page);
    if (stored === undefined) throw new Error('No stored session');
    after10 = stored;
    await expect(handOver(page)).toHaveCount(1);
    await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #10');

    await homeButton(page).click();
    await expectPausedHome(page, 10);
    await expectSessionUnchanged(page, after10);
    recordsAfter10 = await storedRecords(page);
    expect(recordsAfter10.map((r) => r.handNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    await axeWithPausedClock(page);

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
  });

  test('Resume after Home deals hand 11 with every stack as at the end of hand 10', async () => {
    await resumeButton(page).click();
    await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #11');
    expect(await seatRows(page)).toEqual(storedRows(after10));

    await runUntil(page, async () => (await page.locator('[data-part="dealer"]').count()) > 0, {
      label: 'hand 11 not dealt',
    });
    await expect(page.locator('[data-part="dealer"]')).toHaveCount(1);
    await expect(
      page.locator(`li[data-seat="${String(after10.button)}"] [data-part="dealer"]`),
    ).toHaveCount(1);
    expect((await storedSessions(page)).map((s) => s.sessionId)).toEqual([SESSION_ID]);
  });

  test('Home in the middle of hand 11 opens Home with Resume showing 10 hands and no report', async () => {
    const call = page.locator('[aria-label="Your actions"]').getByRole('button', {
      name: /^(Check|Call \$\d+)$/,
    });
    await runUntilMyTurn(page);
    while ((await actionCount(page)) < 3) {
      const before = await actionCount(page);
      await call.click();
      await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
      await runUntilMyTurn(page);
    }
    await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #11');
    await expect(handOver(page)).toHaveCount(0);

    await homeButton(page).click();
    await expectPausedHome(page, 10);
    await page.clock.runFor(5000);
    await expectSessionUnchanged(page, after10);
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  });

  test('the hand abandoned with Home has no record and the stats equal those of hands 1 to 10', async () => {
    const records = await storedRecords(page);
    expect(records.map((r) => r.handNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(records.every((r) => r.sessionId === SESSION_ID)).toBe(true);
    expect(records).toEqual(recordsAfter10);
    expect(statsBySeat(records)).toEqual(statsBySeat(recordsAfter10));
  });

  test('resuming after Home mid-hand deals a new hand 11 with the end-of-hand-10 stacks', async () => {
    await resumeButton(page).click();
    await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #11');
    expect(await seatRows(page)).toEqual(storedRows(after10));

    await advanceToHand(page, 11, fakeSlice(page));
    await playToResult(page, 11, fakeSlice(page));
    await expect.poll(async () => (await storedRecords(page)).length).toBe(11);
    const record = (await storedRecords(page)).find((r) => r.handNumber === 11);
    expect(record?.sessionId).toBe(SESSION_ID);
    await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(11);
    expect((await storedSessions(page)).map((s) => s.sessionId)).toEqual([SESSION_ID]);
  });
});
