import { expect, test, type Browser, type Page } from '@playwright/test';
import { handOver, header, playToResult, storedSessions } from './support/hand-records';
import {
  armSessionsHold,
  holdSessionsWrite,
  releaseSessionsHold,
  sessionsHoldState,
} from './support/hold-writes';
import { runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.20: Home (and browser Back) wait for running table writes before reading the paused session (AC#1);
// the Table's history key is random (AC#2); Forward onto this load's Table entry steps off it (AC#3); and a
// resumed Table after a reload pauses on Back (AC#4).

const WORDS = [0x9e3779b9, 1, 2, 3];
const TABLE_KEY = /^[0-9a-f]{32}$/;

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const tableKey = (page: Page): Promise<unknown> =>
  page.evaluate(() => (history.state as { tlhTable?: unknown } | null)?.tlhTable);

async function inContext(
  browser: Browser,
  run: (page: Page) => Promise<void>,
  { pausedClock = true, hold = false }: { pausedClock?: boolean; hold?: boolean } = {},
): Promise<void> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    if (pausedClock) {
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
    }
    await page.addInitScript(stubReplayWords, WORDS);
    if (hold) await page.addInitScript(holdSessionsWrite);
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
}

async function expectPausedHome(page: Page, hands: number): Promise<void> {
  await expect(heading(page, 'TLH Trainer')).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    `Cash · 6 players · $4/$8 · ${hands} ${hands === 1 ? 'hand' : 'hands'} · paused`,
  );
}

/** Plays hand 1 to its result with the start record held, leaves the Table with `leave`, and checks Home
 *  waits for the held write before showing the paused hand count. */
async function leaveWhileHeld(page: Page, leave: (page: Page) => Promise<void>): Promise<void> {
  await openHome(page);
  await armSessionsHold(page);
  await startGame(page);
  await expect.poll(() => sessionsHoldState(page)).toBe('held');
  await playToResult(page, 1, () => page.clock.runFor(50));
  await expect(handOver(page)).toHaveCount(1);

  await leave(page);
  await expect(heading(page, 'TLH Trainer')).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await page.clock.runFor(2000);
  expect(await sessionsHoldState(page)).toBe('held');
  await expect(menu(page)).toHaveAttribute('data-paused', 'loading');
  await expect(resumeButton(page)).toHaveCount(0);

  await releaseSessionsHold(page);
  await expectPausedHome(page, 1);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.handsPlayed).toBe(1);
}

test('Home waits for a held sessions write before showing the paused hand count', async ({
  browser,
}) => {
  await inContext(browser, (page) => leaveWhileHeld(page, (p) => button(p, 'Home').click()), {
    hold: true,
  });
});

test('browser Back waits for a held sessions write before showing the paused hand count', async ({
  browser,
}) => {
  await inContext(
    browser,
    (page) =>
      leaveWhileHeld(page, async (p) => {
        await p.goBack();
      }),
    { hold: true },
  );
});

test('the Table history key is 32 random hex characters that differ across loads under the paused clock', async ({
  browser,
}) => {
  await inContext(browser, async (page) => {
    await openHome(page);
    await startGame(page);
    const first = await tableKey(page);
    expect(first).toMatch(TABLE_KEY);
    await expect.poll(async () => (await storedSessions(page)).length).toBe(1);

    await page.reload();
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await resumeButton(page).click();
    await expect(tableSection(page)).toHaveCount(1);
    const second = await tableKey(page);
    expect(second).toMatch(TABLE_KEY);
    expect(second).not.toBe(first);
  });
});

test('after Back then Forward on the Table one Back on Home leaves the app', async ({
  browser,
}) => {
  await inContext(browser, async (page) => {
    await openHome(page);
    await startGame(page);
    await runUntilMyTurn(page);

    await page.goBack();
    await expectPausedHome(page, 0);

    await page.goForward();
    await page.clock.runFor(1000);
    await expect(heading(page, 'TLH Trainer')).toBeVisible();
    await expect(tableSection(page)).toHaveCount(0);
    await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
    await expect.poll(() => page.evaluate(() => history.state as unknown)).toBeNull();

    await page.goBack();
    await expect.poll(() => page.url()).toBe('about:blank');
  });
});

test('after a reload on the Table and Resume browser Back opens Home on the real clock', async ({
  browser,
}) => {
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
