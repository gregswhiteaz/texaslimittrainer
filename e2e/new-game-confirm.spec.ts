import { expect, test, type Browser, type Page } from '@playwright/test';
import { seatSession } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import {
  header,
  playToResult,
  seedStoredSessions,
  storedReports,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.7: Start game asks before ending a paused session (REQ-004.1, REQ-004.4, REQ-044.7, REQ-044.8).

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const STARTED = new Date('2026-11-23T10:00:00.000Z');
const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);
const D = 'd'.repeat(32);
const SUMMARY_A = 'Cash · 6 players · $4/$8 · 4 hands · paused';
const SAVED = 'Its Session Report will be saved.';
const NOT_SAVED = 'It has no completed hands, so no report is saved.';

type Json = Record<string, unknown>;

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
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

async function openPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

/** Opens Home with `sessions` stored, after a reload, once Home has read them. */
async function homeWith(page: Page, sessions: readonly unknown[]): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [...sessions]);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
}

/** From Home with `sessions` stored: New game, then Start game; the dialog shows `summary` and `line`. */
async function askToEnd(page: Page, summary: string, line: string): Promise<void> {
  await newGame(page).click();
  await startButton(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator('.end-session-summary')).toHaveText(summary);
  await expect(dialog(page)).toContainText(line);
}

async function inContext(browser: Browser, run: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext();
  try {
    await run(await context.newPage());
  } finally {
    await context.close();
  }
}

test('Start game with a paused session asks first and starts nothing', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPausedClock(page);
  await homeWith(page, [RECORD_A]);
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(SUMMARY_A);

  await askToEnd(page, SUMMARY_A, SAVED);
  await expect(dialog(page).locator('p')).toHaveText([
    'Starting a new game ends this paused session:',
    SUMMARY_A,
    SAVED,
  ]);
  await expect(dialog(page).getByRole('button')).toHaveText(['Cancel', 'End session and start']);
  await expect(cancelButton(page)).toBeFocused();
  expect(await dialog(page).evaluate((el: HTMLDialogElement) => el.matches(':modal'))).toBe(true);

  await page.clock.runFor(2000);
  await expect(header(page)).toHaveCount(0);
  expect(await storedSessions(page)).toEqual([RECORD_A]);
  expect(await storedReports(page)).toEqual([]);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Cancel and Escape keep the paused session and the chosen values', async ({ page }) => {
  await openPausedClock(page);
  await homeWith(page, [RECORD_A]);
  await newGame(page).click();
  await playersSelect(page).selectOption({ label: '9' });
  await stakeSelect(page).selectOption({ label: '$10 / $20' });
  const before = JSON.stringify(await storedSessions(page));

  const dismissals: [string, (page: Page) => Promise<void>][] = [
    ['Cancel', (p) => cancelButton(p).click()],
    ['Escape', (p) => p.keyboard.press('Escape')],
  ];
  for (const [label, dismiss] of dismissals) {
    await startButton(page).click();
    await expect(dialog(page), label).toBeVisible();
    await expect(cancelButton(page), label).toBeFocused();
    await dismiss(page);
    await expect(page.getByRole('dialog'), label).toHaveCount(0);
    await expect(startButton(page), label).toBeFocused();
    expect(await selectedText(playersSelect(page)), label).toBe('9');
    expect(await selectedText(stakeSelect(page)), label).toBe('$10 / $20');
    await page.clock.runFor(2000);
    await expect(header(page), label).toHaveCount(0);
    expect(JSON.stringify(await storedSessions(page)), label).toBe(before);
    expect(await storedReports(page), label).toEqual([]);
  }

  await page.getByRole('button', { name: '← Home' }).click();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(SUMMARY_A);
});

test('Confirm ends the paused session, saves its report and starts the new game', async ({
  page,
}) => {
  await openPausedClock(page);
  await homeWith(page, [RECORD_A]);
  await newGame(page).click();
  await playersSelect(page).selectOption({ label: '9' });
  await startButton(page).click();
  await confirmButton(page).click();

  await expect(header(page)).toHaveText('Cash · 9 players · $4/$8 · Hand #1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedSessions(page)).length).toBe(2);
  const sessions = await storedSessions(page);
  const endedA = sessions.find((s) => s.sessionId === A) as Json;
  expect(typeof endedA.endedAt).toBe('string');
  const reports = await storedReports(page);
  expect(reports).toHaveLength(1);
  const [report] = reports as [Json];
  expect(report.sessionId).toBe(A);
  expect(report.handsPlayed).toBe(4);
  expect(report.endedAt).toBe(endedA.endedAt);
  const fresh = sessions.find((s) => s.sessionId !== A) as Json;
  expect(fresh.handsPlayed).toBe(0);
  expect(fresh.endedAt ?? null).toBeNull();
});

test('after a confirmed new game only the new session is not ended', async ({ page }) => {
  const recordB = record(B, 0, '2026-11-23T10:05:00.000Z');
  const recordC = record(C, 2, '2026-11-23T10:01:00.000Z');
  await openPausedClock(page);
  await homeWith(page, [RECORD_A, recordB, recordC]);
  await askToEnd(page, SUMMARY_A, SAVED);
  await confirmButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await playToResult(page, 1, () => page.clock.runFor(50));

  const seeded = new Set([A, B, C]);
  await expect
    .poll(
      async () =>
        (await storedSessions(page)).find((s) => !seeded.has(s.sessionId as string))?.handsPlayed,
    )
    .toBe(1);
  const sessions = await storedSessions(page);
  const unended = sessions.filter((s) => typeof s.endedAt !== 'string');
  expect(unended).toHaveLength(1);
  expect(seeded.has(unended[0]?.sessionId as string)).toBe(false);
  expect(sessions.some((s) => s.sessionId === B)).toBe(false);
  const endedC = sessions.find((s) => s.sessionId === C) as Json;
  expect(endedC.endedAt).toBe(recordC.updatedAt);
  expect((await storedReports(page)).map((r) => r.sessionId).sort()).toEqual([A, C]);
});

test('a 0-hand paused session is discarded on Confirm', async ({ page }) => {
  await openPausedClock(page);
  await homeWith(page, [record(A, 0, '2026-11-23T10:00:00.000Z')]);
  await askToEnd(page, 'Cash · 6 players · $4/$8 · 0 hands · paused', NOT_SAVED);
  await expect(dialog(page)).not.toContainText(SAVED);
  await confirmButton(page).click();

  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  expect((await storedSessions(page)).some((s) => s.sessionId === A)).toBe(false);
  expect(await storedReports(page)).toEqual([]);
});

test('with no paused session Start game starts at once', async ({ browser }) => {
  const endedD = {
    ...record(D, 3, '2026-11-23T10:03:00.000Z'),
    endedAt: '2026-11-22T09:00:00.000Z',
  };
  for (const seeded of [[], [endedD]]) {
    await inContext(browser, async (page) => {
      await openPausedClock(page);
      await homeWith(page, seeded);
      await expect(menu(page)).toHaveAttribute('data-paused', 'none');
      const storedD = JSON.stringify((await storedSessions(page)).find((s) => s.sessionId === D));
      const reportsBefore = JSON.stringify(await storedReports(page));

      await newGame(page).click();
      await startButton(page).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
      await expect(page.getByRole('dialog')).toHaveCount(0);

      if (seeded.length > 0) {
        const stored = await storedSessions(page);
        expect(JSON.stringify(stored.find((s) => s.sessionId === D))).toBe(storedD);
        expect(JSON.stringify(await storedReports(page))).toBe(reportsBefore);
      }
    });
  }
});
