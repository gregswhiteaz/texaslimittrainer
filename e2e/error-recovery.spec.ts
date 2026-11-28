import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { replayCodeFromWords } from '../src/engine/deck';
import { DEFAULT_SESSION_CONFIG, seatSession } from '../src/table/session';
import { handWrite, type SessionRecord } from '../src/table/session-record';
import { ERROR_HEADING, ERROR_MESSAGE } from '../src/ui/error/ErrorScreen';
import { playSession } from '../tests/support/session-play';
import { armFault, installFaults, workerCount } from './support/fault-injection';
import { buttonTabKey } from './support/keyboard';
import {
  header,
  playToResult,
  seedStoredRecords,
  seedStoredSessions,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { axeWithPausedClock, runUntil, runUntilMyTurn } from './support/paused-clock';
import { realMoneyOffers } from './support/play-money';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-13.1: an unexpected error shows the error screen; Return Home keeps every completed hand
// (REQ-056.3, REQ-057.1, REQ-057.2, REQ-057.4).

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'e'.repeat(32);
const STARTED = new Date('2026-11-25T10:00:00Z');

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const errorHeading = (page: Page) => page.getByRole('heading', { level: 1, name: ERROR_HEADING });
const returnHome = (page: Page) => page.getByRole('button', { name: 'Return Home', exact: true });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

/** Name and stack text of each seat in the Seats list, by seat number (copied from e2e/resume.spec.ts). */
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

/** The default 6-max session after `hands` headless hands: each hand's record and the last session record. */
function seededHands(hands: number): { records: unknown[]; session: SessionRecord } {
  const played = playSession(seatSession(DEFAULT_SESSION_CONFIG), hands, (n) =>
    replayCodeFromWords([0x9e3779b9, n, 2, 3]),
  );
  const writes = played.map((table, i) =>
    handWrite(table, {
      sessionId: SESSION_ID,
      startedAt: STARTED,
      completedAt: new Date(STARTED.getTime() + (i + 1) * 60_000),
    }),
  );
  const last = writes.at(-1);
  if (last === undefined) throw new Error('No hands played');
  return { records: writes.map((w) => w.record), session: last.session };
}

/** Paused clock, pinned deals and the fault init script; opens Home with `hands` seeded and resumes. */
async function resumeSeeded(page: Page, hands: number): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(installFaults);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  const { records, session } = seededHands(hands);
  await page.evaluate(seedStoredRecords, records);
  await page.evaluate(seedStoredSessions, [session]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    `Cash · 6 players · $4/$8 · ${hands} hands · paused`,
  );
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(`Cash · 6 players · $4/$8 · Hand #${hands + 1}`);
}

/** Runs the paused clock, folding (or checking) at the user's turns, until the error screen shows. */
async function runUntilErrorScreen(page: Page): Promise<void> {
  await runUntil(
    page,
    async () => {
      if ((await errorHeading(page).count()) > 0) return true;
      if ((await enabledActions(page).count()) > 0) {
        const texts = await enabledActions(page).allTextContents();
        await enabledActions(page)
          .filter({ hasText: texts.includes('Fold') ? 'Fold' : 'Check' })
          .first()
          .click();
      }
      return false;
    },
    { label: 'error screen not shown' },
  );
}

/** The error screen alone: its three texts only, no details, one native button reached by Tab. */
async function expectErrorScreen(page: Page): Promise<void> {
  await expect(errorHeading(page)).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(page.locator('main')).toHaveCount(1);
  const text = await page.locator('main').innerText();
  expect(text.split(/\n+/).map((line) => line.trim())).toEqual([
    ERROR_HEADING,
    ERROR_MESSAGE,
    'Return Home',
  ]);
  for (const detail of ['Injected', 'Error', ' at ', '.ts', '.tsx', '.js']) {
    expect(text).not.toContain(detail);
  }
  expect(realMoneyOffers(await page.locator('body').innerText())).toEqual([]);
  // WebKit on macOS skips buttons on plain Tab when Full Keyboard Access is off; buttonTabKey holds Alt only then.
  await page.keyboard.press(await buttonTabKey(page));
  expect(
    await page.evaluate(() => {
      const el = document.activeElement;
      return el === null ? null : { tag: el.tagName, text: el.textContent };
    }),
  ).toEqual({ tag: 'BUTTON', text: 'Return Home' });
}

const expectSameOrigin = (requests: string[]): void => {
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
};

test('an error during a bot action in hand 15 shows the error screen and Resume continues from hand 14', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await resumeSeeded(page, 13);
  await playToResult(page, 14, fakeSlice(page));
  await expect.poll(async () => (await storedRecords(page)).length).toBe(14);
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(14);
  const records = await storedRecords(page);
  const [session] = await storedSessions(page);
  if (session === undefined) throw new Error('No stored session');

  await armFault(page, 'illegal-bot');
  await runUntilErrorScreen(page);
  await expectErrorScreen(page);
  await axeWithPausedClock(page);

  await page.keyboard.press('Enter');
  await expect(homeHeading(page)).toBeFocused();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 14 hands · paused',
  );

  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #15');
  expect(await seatRows(page)).toEqual(storedRows(session));
  const after = await storedRecords(page);
  expect(after.map((r) => r.handNumber)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  expect(after).toEqual(records);
  expect(await storedSessions(page)).toEqual([session]);

  expectSameOrigin(requests);
  const files = readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((name) =>
    /\.(js|html|css)$/.test(name),
  );
  expect(files.length).toBeGreaterThan(0);
  expect(
    files.filter((name) => readFileSync(join(DIST, name), 'utf8').includes('__tlhFault')),
  ).toEqual([]);
});

test('an error while the Session Report renders shows the error screen and Return Home opens Home', async ({
  page,
}) => {
  await resumeSeeded(page, 14);
  await runUntilMyTurn(page);
  await armFault(page, 'report-render');
  await page.getByRole('button', { name: 'Leave table' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  await runUntil(page, async () => (await errorHeading(page).count()) > 0, {
    label: 'error screen not shown',
  });
  await expect(page.getByRole('heading', { name: 'Session report' })).toHaveCount(0);
  await expectErrorScreen(page);

  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
});

test('a worker failure while a bot decides shows the error screen and a new game gets a fresh worker', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await resumeSeeded(page, 14);
  const records = await storedRecords(page);
  await page.evaluate(() => {
    (window as { __tlhMarker?: boolean }).__tlhMarker = true;
  });

  await armFault(page, 'worker-error');
  await runUntilErrorScreen(page);
  await expectErrorScreen(page);
  const workers = await workerCount(page);

  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 14 hands · paused',
  );
  expect(await storedRecords(page)).toEqual(records);

  await menu(page)
    .getByRole('button', { name: /^New game/ })
    .click();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.getByRole('button', { name: 'End session and start', exact: true }).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await runUntilMyTurn(page);
  expect(Number(await tableSection(page).getAttribute('data-action-count'))).toBeGreaterThan(2);
  expect(await workerCount(page)).toBe(workers + 1);
  expect(await page.evaluate(() => (window as { __tlhMarker?: boolean }).__tlhMarker)).toBe(true);
  expectSameOrigin(requests);
});

test('a rejected bot decision shows the error screen and Return Home keeps completed hands', async ({
  page,
}) => {
  await resumeSeeded(page, 14);
  const records = await storedRecords(page);

  await armFault(page, 'reject-bot');
  await runUntilErrorScreen(page);
  await expectErrorScreen(page);

  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 14 hands · paused',
  );
  expect(await storedRecords(page)).toEqual(records);
  expect(records).toHaveLength(14);
});

test('an uncaught error and an unhandled rejection show the error screen', async ({ page }) => {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  await page.evaluate(() =>
    queueMicrotask(() => {
      throw new Error('Injected uncaught');
    }),
  );
  await expectErrorScreen(page);
  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();

  await page.evaluate(() => {
    void Promise.reject(new Error('Injected rejection'));
  });
  await expectErrorScreen(page);
  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();
});
