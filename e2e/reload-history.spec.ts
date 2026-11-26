import { expect, test, type Browser, type Page } from '@playwright/test';
import { header, storedSessions } from './support/hand-records';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.22: after a reload on the Table, opening the Table again replaces the earlier load's Table entry, so one
// Back from Home leaves the app with no page reload on the way (AC#1).

const WORDS = [0x9e3779b9, 1, 2, 3];

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'End your paused session?' });
const historyLength = (page: Page): Promise<number> => page.evaluate(() => history.length);
const historyState = (page: Page): Promise<unknown> =>
  page.evaluate(() => history.state as unknown);
const setMarker = (page: Page): Promise<void> =>
  page.evaluate(() => {
    (window as unknown as { tlhMarker?: boolean }).tlhMarker = true;
  });
const hasMarker = (page: Page): Promise<boolean> =>
  page.evaluate(() => (window as unknown as { tlhMarker?: boolean }).tlhMarker === true);

async function inContext(browser: Browser, run: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.addInitScript(stubReplayWords, WORDS);
    await run(page);
  } finally {
    await context.close();
  }
}

/** Opens Home, starts a game, waits for its start record, then reloads on the Table. Returns `history.length`
 *  as it was while the Table showed before the reload. */
async function startAndReload(page: Page): Promise<number> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await newGame(page).click();
  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await expect.poll(async () => (await storedSessions(page)).length).toBe(1);
  const length = await historyLength(page);

  await page.reload();
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  return length;
}

async function expectPausedHome(page: Page): Promise<void> {
  await expect(heading(page, 'TLH Trainer')).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
}

test('after a reload on the Table, Resume and Home, one Back leaves the app', async ({
  browser,
}) => {
  await inContext(browser, async (page) => {
    const length = await startAndReload(page);
    await resumeButton(page).click();
    await expect(tableSection(page)).toHaveCount(1);

    await button(page, 'Home').click();
    await setMarker(page);
    await expectPausedHome(page);
    await expect.poll(() => historyState(page)).toBeNull();
    expect(await historyLength(page)).toBe(length);
    expect(await hasMarker(page)).toBe(true);

    await page.goBack();
    await expect.poll(() => page.url()).toBe('about:blank');
  });
});

test('after a reload on the Table and Resume, Back pauses to Home and one more Back leaves the app', async ({
  browser,
}) => {
  await inContext(browser, async (page) => {
    const length = await startAndReload(page);
    await resumeButton(page).click();
    await expect(tableSection(page)).toHaveCount(1);

    await setMarker(page);
    await page.goBack();
    await expectPausedHome(page);
    expect(await hasMarker(page)).toBe(true);
    expect(await historyState(page)).toBeNull();
    expect(await historyLength(page)).toBe(length);

    await page.goBack();
    await expect.poll(() => page.url()).toBe('about:blank');
  });
});

test('after a reload on the Table a new game then Home leaves the app with one Back', async ({
  browser,
}) => {
  await inContext(browser, async (page) => {
    const length = await startAndReload(page);
    await newGame(page).click();
    await button(page, 'Start game').click();
    await dialog(page).getByRole('button', { name: 'End session and start', exact: true }).click();
    await expect(tableSection(page)).toHaveCount(1);

    await button(page, 'Home').click();
    await setMarker(page);
    await expect(heading(page, 'TLH Trainer')).toBeFocused();
    await expect(tableSection(page)).toHaveCount(0);
    await expect.poll(() => historyState(page)).toBeNull();
    expect(await historyLength(page)).toBe(length);
    expect(await hasMarker(page)).toBe(true);

    await page.goBack();
    await expect.poll(() => page.url()).toBe('about:blank');
  });
});
