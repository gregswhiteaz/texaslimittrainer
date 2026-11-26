import { expect, test, type Page } from '@playwright/test';
import { seatSession } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import { sessionReport } from '../src/table/session-report';
import {
  header,
  playToResult,
  seedStoredSessions,
  storedReports,
  storedSessions,
} from './support/hand-records';
import {
  armSessionsHold,
  holdSessionsWrite,
  releaseSessionsHold,
  sessionsHoldState,
} from './support/hold-writes';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.21: a failed end returns focus to Start game (AC#2); the Table opens only after the paused session
// is ended (AC#3).

const WORDS = [0x9e3779b9, 1, 2, 3];
const STARTED = new Date('2026-11-23T10:00:00.000Z');
const A = 'a'.repeat(32);

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const startButton = (page: Page) => page.getByRole('button', { name: 'Start game', exact: true });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'End your paused session?' });
const confirmButton = (page: Page) =>
  dialog(page).getByRole('button', { name: 'End session and start', exact: true });
const cancelButton = (page: Page) =>
  dialog(page).getByRole('button', { name: 'Cancel', exact: true });
const playersSelect = (page: Page) => page.getByLabel('Players at the table');
const stakeSelect = (page: Page) => page.getByLabel('Stakes (small bet / big bet)');
const selectedText = (select: ReturnType<Page['getByLabel']>) =>
  select.evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent);

/** A valid $4/$8 6-max record of `hands` completed hands, last written at `updated`. */
const record = (sessionId: string, hands: number, updated: string): SessionRecord =>
  sessionRecord(
    { ...seatSession(), handNumber: hands + 1 },
    { sessionId, startedAt: STARTED, updatedAt: new Date(updated) },
  );

const RECORD_A = record(A, 4, '2026-11-23T10:10:00.000Z');

/** Runs in the page: puts `reports` into the existing tlh-trainer/reports store. */
function seedStoredReports(reports: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('reports', 'readwrite');
      for (const report of reports) transaction.objectStore('reports').put(report);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

/** Opens Home with `sessions` and `reports` stored, after a reload, once Home has read them. */
async function homeWith(
  page: Page,
  sessions: readonly unknown[],
  reports: readonly unknown[] = [],
): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [...sessions]);
  await page.evaluate(seedStoredReports, [...reports]);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
}

test('a failed end returns focus to Start game and keeps the chosen values', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openPausedClock(page);
  // A-3: a report already stored for the unended paused session makes the end's report add fail.
  await homeWith(page, [RECORD_A], [sessionReport(RECORD_A, new Date('2026-11-23T11:00:00.000Z'))]);
  await newGame(page).click();
  await playersSelect(page).selectOption({ label: '9' });
  await stakeSelect(page).selectOption({ label: '$10 / $20' });
  await startButton(page).click();
  await expect(dialog(page)).toBeVisible();
  const sessions = JSON.stringify(await storedSessions(page));
  const reports = JSON.stringify(await storedReports(page));

  await confirmButton(page).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(startButton(page)).toBeFocused();
  expect(await selectedText(playersSelect(page))).toBe('9');
  expect(await selectedText(stakeSelect(page))).toBe('$10 / $20');
  await page.clock.runFor(2000);
  await expect(header(page)).toHaveCount(0);
  await expect(startButton(page)).toBeFocused();
  expect(JSON.stringify(await storedSessions(page))).toBe(sessions);
  expect(JSON.stringify(await storedReports(page))).toBe(reports);
  expect(errors.some((text) => text.includes('Paused session could not be ended'))).toBe(true);
});

test('the Table opens only after the paused session is ended', async ({ page }) => {
  await openPausedClock(page);
  await page.addInitScript(holdSessionsWrite);
  await homeWith(page, [RECORD_A]);
  await newGame(page).click();
  await startButton(page).click();
  await expect(dialog(page)).toBeVisible();
  await armSessionsHold(page, ['hands', 'reports', 'sessions']);
  await confirmButton(page).click();

  await expect.poll(() => sessionsHoldState(page)).toBe('held');
  await page.clock.runFor(2000);
  await expect(dialog(page)).toBeVisible();
  await expect(cancelButton(page)).toBeDisabled();
  await expect(confirmButton(page)).toBeDisabled();
  await expect(header(page)).toHaveCount(0);

  await releaseSessionsHold(page);
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  const fresh = async () =>
    (await storedSessions(page)).filter(
      (s) => s.sessionId !== A && s.handsPlayed === 0 && typeof s.endedAt !== 'string',
    );
  await expect.poll(async () => (await fresh()).length).toBe(1);
  const [started] = await fresh();
  const id = started?.sessionId;
  if (typeof id !== 'string') throw new Error('no new session id');
  expect((await storedSessions(page)).filter((s) => s.sessionId !== A)).toHaveLength(1);

  await playToResult(page, 1, () => page.clock.runFor(50));
  await expect
    .poll(async () => (await storedSessions(page)).find((s) => s.sessionId === id)?.handsPlayed)
    .toBe(1);
  const sessions = await storedSessions(page);
  const unended = sessions.filter((s) => typeof s.endedAt !== 'string');
  expect(unended.map((s) => s.sessionId)).toEqual([id]);
  expect(typeof sessions.find((s) => s.sessionId === A)?.endedAt).toBe('string');
  expect((await storedReports(page)).map((r) => r.sessionId)).toEqual([A]);
});
