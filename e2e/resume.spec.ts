import { expect, test, type Page } from '@playwright/test';
import { replayCodeFromWords } from '../src/engine/deck';
import {
  DEFAULT_SESSION_CONFIG,
  configForGameType,
  configForLineUp,
  configWithSeatStyle,
  seatSession,
  type BotStyle,
  type SessionConfig,
} from '../src/table/session';
import { handWrite, sessionRecord, type SessionRecord } from '../src/table/session-record';
import { playSession } from '../tests/support/session-play';
import { expectNoSeriousAxeViolations } from './support/axe';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  seedStoredSessions,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const STARTED = new Date('2026-11-23T10:00:00Z');
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const seatPart = (page: Page, seat: number, part: string) =>
  page.locator(`li[data-seat="${seat}"] [data-part="${part}"]`);

interface TimerWindow {
  __pausedTimers?: [typeof setTimeout, typeof clearTimeout];
}

/** Runs in the page: real timers from a Web Worker (untouched by the fake clock) for axe. */
function useWorkerTimers(): void {
  const source =
    'const t = new Map(); onmessage = ({ data: [id, ms] }) => { if (ms === null) { clearTimeout(t.get(id)); t.delete(id); } else t.set(id, setTimeout(() => { t.delete(id); postMessage(id); }, ms)); };';
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  const callbacks = new Map<number, () => void>();
  let next = 1;
  worker.onmessage = ({ data }: MessageEvent<number>) => {
    const callback = callbacks.get(data);
    callbacks.delete(data);
    callback?.();
  };
  (window as TimerWindow).__pausedTimers = [window.setTimeout, window.clearTimeout];
  window.setTimeout = ((callback: (...args: unknown[]) => void, ms = 0, ...args: unknown[]) => {
    const id = next++;
    callbacks.set(id, () => callback(...args));
    worker.postMessage([id, Number(ms) || 0]);
    return id;
  }) as typeof setTimeout;
  window.clearTimeout = ((id: number) => {
    callbacks.delete(id);
    worker.postMessage([id, null]);
  }) as typeof clearTimeout;
}

function restorePausedTimers(): void {
  const timers = (window as TimerWindow).__pausedTimers;
  if (timers) [window.setTimeout, window.clearTimeout] = timers;
}

/** axe needs running timers; under the paused clock it gets worker timers for the duration of the scan.
 *  Run it only where nothing is due (Home, or the user's turn). */
async function axeWithPausedClock(page: Page): Promise<void> {
  await page.evaluate(useWorkerTimers);
  try {
    await expectNoSeriousAxeViolations(page);
  } finally {
    await page.evaluate(restorePausedTimers);
  }
}

async function pausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

/** Opens Home, puts `records` into the sessions store, and reloads so Home reads them. */
async function homeWith(page: Page, records: readonly unknown[]): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [...records]);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
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
          style: li.querySelector('[data-part="style"]')?.textContent ?? null,
          stack: li.querySelector('[data-part="stack"]')?.textContent ?? '',
        }))
        .sort((a, b) => a.seat - b.seat),
    );

const storedRows = (record: Record<string, unknown>) =>
  (record.seats as SessionRecord['seats']).map(({ seat, name, style, stack }) => ({
    seat,
    name,
    style,
    stack: `$${stack}`,
  }));

/** A default 6-max start record with `minute`'s updatedAt; `id` is repeated to 32 hex characters. */
const startRecord = (id: string, minute: number): SessionRecord =>
  sessionRecord(seatSession(DEFAULT_SESSION_CONFIG), {
    sessionId: id.repeat(32),
    startedAt: STARTED,
    updatedAt: at(minute),
  });

/** A 9-player $10/$20 Custom session after 25 headless hands (button 1 at hand 1, so 8 next). */
function ninePlayerAfter25(): SessionRecord {
  const tens = configForGameType(DEFAULT_SESSION_CONFIG, 'cash', { smallBet: 10, bigBet: 20 });
  const mixed = configForLineUp(tens, 9, 'Mixed');
  const seat2 = mixed.seats.find((s) => s.seat === 2)?.style as BotStyle;
  const custom = configWithSeatStyle(mixed, 'Mixed', 2, seat2 === 'Rock' ? 'Maniac' : 'Rock');
  const config: SessionConfig = { ...custom, button: 1 };
  const played = playSession(seatSession(config), 25, (n) =>
    replayCodeFromWords([0x9e3779b9, n, 2, 3]),
  );
  const last = played.at(-1);
  if (last === undefined) throw new Error('No hands played');
  return handWrite(last, { sessionId: 'c'.repeat(32), startedAt: STARTED, completedAt: at(90) })
    .session;
}

async function expectNoResume(page: Page): Promise<void> {
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  // TASK-11.1: Home also lists Statistics. TASK-12.1: and Settings, last.
  await expect(menu(page).getByRole('button')).toHaveCount(3);
  await expect(menu(page).getByRole('button').last()).toHaveAccessibleName(/^Settings/);
  await expect(menu(page).getByRole('button').nth(1)).toHaveAccessibleName(/^Statistics/);
}

test('a session reloaded mid-hand resumes from Home at the same hand number under the same session id', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await pausedClock(page);
  await page.goto('/');
  await newGame(page).click();
  await button(page, 'Start game').click();
  for (const hand of [1, 2]) {
    await advanceToHand(page, hand, fakeSlice(page));
    await playToResult(page, hand, fakeSlice(page));
  }
  await advanceToHand(page, 3, fakeSlice(page));
  await expect(handOver(page)).toHaveCount(0);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(2);
  const [session] = await storedSessions(page);
  if (session === undefined) throw new Error('No stored session');

  await page.reload();
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  const entries = menu(page).getByRole('button');
  // TASK-11.1: Home also lists Statistics, after Resume session. TASK-12.1: Settings comes last.
  await expect(entries).toHaveCount(4);
  await expect(entries.last()).toHaveAccessibleName(/^Settings/);
  await expect(entries.nth(2)).toHaveAccessibleName(/^Statistics/);
  await expect(entries.nth(0)).toHaveText(/^New game/);
  await expect(entries.nth(1)).toHaveAccessibleName(/^Resume session/);
  await expect(entries.nth(1).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 2 hands · paused',
  );
  await axeWithPausedClock(page);

  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #3');
  expect(await seatRows(page)).toEqual(storedRows(session));

  await playToResult(page, 3, fakeSlice(page));
  await expect.poll(async () => (await storedRecords(page)).length).toBe(3);
  const records = await storedRecords(page);
  expect(records.map((r) => r.handNumber)).toEqual([1, 2, 3]);
  expect(records.every((r) => r.sessionId === session.sessionId)).toBe(true);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(3);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.sessionId).toBe(session.sessionId);
  expect(sessions[0]?.startedAt).toBe(session.startedAt);

  await button(page, 'Home').click();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 3 hands · paused',
  );

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Resume shows only for a stored unended session and restores a 9-player custom table', async ({
  browser,
}) => {
  const inContext = async (run: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await pausedClock(page);
      await run(page);
    } finally {
      await context.close();
    }
  };

  await inContext(async (page) => {
    await page.goto('/');
    await expectNoResume(page);
  });

  const ended = { ...startRecord('a', 5), endedAt: at(6).toISOString() };
  await inContext(async (page) => {
    await homeWith(page, [ended]);
    await expectNoResume(page);
  });

  const nine = ninePlayerAfter25();
  expect(nine.button).toBe(8);
  expect(nine.handsPlayed).toBe(25);
  expect(new Set(nine.seats.map((s) => s.style)).size).toBeGreaterThan(2);
  await inContext(async (page) => {
    await homeWith(page, [nine, ended]);
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
      'Cash · 9 players · $10/$20 · 25 hands · paused',
    );
    await resumeButton(page).click();
    await expect(header(page)).toHaveText('Cash · 9 players · $10/$20 · Hand #26');
    expect(await seatRows(page)).toEqual(storedRows(nine as unknown as Record<string, unknown>));

    await runUntilMyTurn(page);
    await expect(header(page)).toHaveText('Cash · 9 players · $10/$20 · Hand #26');
    await expect(seatPart(page, 8, 'dealer')).toHaveCount(1);
    await expect(page.locator('[data-part="dealer"]')).toHaveCount(1);
    await axeWithPausedClock(page);
  });
});

test('an invalid stored session is skipped and Home stays usable', async ({ browser }) => {
  const robot = structuredClone(startRecord('a', 5)) as unknown as {
    seats: { kind: string }[];
  };
  (robot.seats[1] as { kind: string }).kind = 'robot';
  const huge = { ...startRecord('b', 5), handsPlayed: Number.MAX_SAFE_INTEGER };

  for (const bad of [robot, huge]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      const pageErrors: Error[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error));
      await pausedClock(page);
      await homeWith(page, [bad]);
      await expectNoResume(page);
      await expect
        .poll(() => errors.some((text) => text.includes('Session record could not be read')))
        .toBe(true);
      expect(pageErrors).toEqual([]);

      await newGame(page).click();
      await button(page, 'Start game').click();
      await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
      await runUntilMyTurn(page);
      await expect.poll(async () => (await storedSessions(page)).length).toBe(2);
      const fresh = (await storedSessions(page)).filter(
        (s) => s.sessionId !== (bad as { sessionId: string }).sessionId,
      );
      expect(fresh).toHaveLength(1);
      expect(fresh[0]?.handsPlayed).toBe(0);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await pausedClock(page);
    const valid = { ...startRecord('c', 5), handsPlayed: 4 };
    const newerBad = { ...robot, sessionId: 'd'.repeat(32), updatedAt: at(50).toISOString() };
    await homeWith(page, [valid, newerBad]);
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
      'Cash · 6 players · $4/$8 · 4 hands · paused',
    );
  } finally {
    await context.close();
  }
});
