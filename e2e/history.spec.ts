import { expect, test, type Browser, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession } from '../src/table/session';
import { MAX_SESSION_COUNT, sessionRecord } from '../src/table/session-record';
import { header, seedStoredSessions, storedRecords, storedSessions } from './support/hand-records';
import { runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.14 D-2: only opening the Table adds a history entry. Back on the Table pauses to Home; Forward never
// reopens it; Back on Home or Game Config leaves the app.

const WORDS = [0x9e3779b9, 1, 2, 3];
const STARTED = new Date('2026-11-23T10:00:00Z');

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });

async function inContext(
  browser: Browser,
  run: (page: Page) => Promise<void>,
  { pausedClock = true }: { pausedClock?: boolean } = {},
): Promise<void> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    if (pausedClock) {
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
    }
    await page.addInitScript(stubReplayWords, WORDS);
    await run(page);
  } finally {
    await context.close();
  }
}

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
}

async function startGame(page: Page): Promise<void> {
  await newGame(page).click();
  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await runUntilMyTurn(page);
}

async function expectPausedHome(page: Page, hands: number): Promise<void> {
  await expect(heading(page, 'TLH Trainer')).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    `Cash · 6 players · $4/$8 · ${hands} hands · paused`,
  );
}

async function expectLeftApp(page: Page): Promise<void> {
  await page.goBack();
  await expect.poll(() => page.url()).toBe('about:blank');
}

test('browser Back on the Table pauses to Home, Forward never reopens it, and Back on Home or Game Config leaves the app', async ({
  browser,
}) => {
  // (1) Back on the Table pauses to Home in the same document; Forward stays on Home.
  await inContext(browser, async (page) => {
    await openHome(page);
    await page.evaluate(() => {
      (window as { __sameDocument?: boolean }).__sameDocument = true;
    });
    await startGame(page);
    await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
    const [start] = await storedSessions(page);

    await page.goBack();
    await expectPausedHome(page, 0);
    expect(new URL(page.url()).pathname).toBe('/');
    expect(await page.evaluate(() => (window as { __sameDocument?: boolean }).__sameDocument)).toBe(
      true,
    );
    expect(await storedRecords(page)).toEqual([]);
    expect(await storedSessions(page)).toEqual([start]);

    await page.goForward();
    await page.clock.runFor(1000);
    await expect(heading(page, 'TLH Trainer')).toBeVisible();
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await expect(tableSection(page)).toHaveCount(0);
  });

  // (2) After the Home control, Back leaves the app; the session stays paused.
  await inContext(browser, async (page) => {
    await openHome(page);
    await startGame(page);
    await button(page, 'Home').click();
    await expectPausedHome(page, 0);
    // The Home control steps back off the Table's entry, so the app's own entry is current again.
    await expect.poll(() => page.evaluate(() => history.state as unknown)).toBeNull();
    await expectLeftApp(page);
    await openHome(page);
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await expect(resumeButton(page)).toHaveCount(1);
  });

  // (3) Back on Game Config leaves the app; no session was started.
  await inContext(browser, async (page) => {
    await openHome(page);
    await newGame(page).click();
    await expect(heading(page, 'New game')).toBeVisible();
    await expectLeftApp(page);
    await openHome(page);
    await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  });

  // (4) Back on Home leaves the app.
  await inContext(browser, async (page) => {
    await openHome(page);
    await expectLeftApp(page);
  });

  // (5) A Table entry from an earlier load does not keep a resumed Table open. Real clock: the fake one gives
  // every load the same performance.timeOrigin, which the entry keys rely on to differ across loads.
  await inContext(
    browser,
    async (page) => {
      await openHome(page);
      await newGame(page).click();
      await button(page, 'Start game').click();
      await expect(header(page)).toHaveText(/^Cash · 6 players · \$4\/\$8 · Hand #\d+$/);
      await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
      await page.reload();
      await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
      await resumeButton(page).click();
      await expect(tableSection(page)).toHaveCount(1);
      await page.goBack();
      await expect(heading(page, 'TLH Trainer')).toBeFocused();
      await expect(tableSection(page)).toHaveCount(0);
      await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    },
    { pausedClock: false },
  );
});

test('a stored session with nextBotName above the cap is skipped and Home stays usable', async ({
  page,
}) => {
  const bad = {
    ...sessionRecord(seatSession(DEFAULT_SESSION_CONFIG), {
      sessionId: 'e'.repeat(32),
      startedAt: STARTED,
      updatedAt: STARTED,
    }),
    nextBotName: MAX_SESSION_COUNT + 1,
  };
  const errors: string[] = [];
  const pageErrors: Error[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await openHome(page);
  await page.evaluate(seedStoredSessions, [bad]);
  await page.reload();

  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  await expect
    .poll(() => errors.some((text) => text.includes('Session record could not be read')))
    .toBe(true);
  expect(pageErrors).toEqual([]);

  await startGame(page);
  await expect.poll(async () => (await storedSessions(page)).length).toBe(2);
  const fresh = (await storedSessions(page)).filter((s) => s.sessionId !== bad.sessionId);
  expect(fresh).toHaveLength(1);
  expect(fresh[0]?.handsPlayed).toBe(0);
  expect(pageErrors).toEqual([]);
});
