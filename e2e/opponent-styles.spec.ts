import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { readStore, storedSessions } from './support/hand-records';

// TASK-12.2: the Settings toggle "Show opponent styles at the table", saved at once and applied at the table.

const ORIGIN = 'http://localhost:4173';
const DEFAULTS = {
  defaultSpeed: 'rapid',
  autoOpenReview: true,
  showOpponentStyles: true,
  fourColourDeck: false,
  botBanter: true,
};

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const toggle = (page: Page) =>
  page.getByRole('checkbox', { name: 'Show opponent styles at the table' });
const table = (page: Page) => page.getByRole('region', { name: 'Table' });
const botSeats = (page: Page) =>
  page.getByRole('list', { name: 'Seats' }).locator('li[data-seat]:not([data-user])');

const storedSettings = (page: Page): Promise<unknown[]> => page.evaluate(readStore, 'settings');

async function openSettings(page: Page): Promise<void> {
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Settings/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeFocused();
}

async function settingsToHome(page: Page): Promise<void> {
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(homeHeading(page)).toBeFocused();
}

async function startDefaultGame(page: Page): Promise<void> {
  await menu(page)
    .getByRole('button', { name: /^New game/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await expect(botSeats(page)).toHaveCount(5);
}

/** Each bot seat as "Name Style", sorted; the style is '' when the seat shows none. */
async function botStyles(page: Page): Promise<string[]> {
  const rows = await botSeats(page).evaluateAll((lis) =>
    lis.map(
      (li) =>
        `${li.querySelector('[data-part="name"]')?.textContent ?? ''} ${li.querySelector('[data-part="style"]')?.textContent ?? ''}`,
    ),
  );
  return rows.sort();
}

const STYLES_SHOWN = ['Ava TAG', 'Ben Calling station', 'Cal Maniac', 'Dee Rock', 'Eli TAG'];

async function expectStylesHidden(page: Page): Promise<void> {
  await expect(table(page).locator('[data-part="style"]')).toHaveCount(0);
  expect(await botStyles(page)).toEqual(['Ava ', 'Ben ', 'Cal ', 'Dee ', 'Eli ']);
  const ben = botSeats(page).filter({
    has: page.locator('[data-part="name"]', { hasText: 'Ben' }),
  });
  await expect(ben.locator('[data-part="stack"]')).toHaveText(/^\$\d+$/);
  for (const line of await botSeats(page).locator('.seat-line').allTextContents()) {
    expect(line).not.toContain('·');
  }
}

test("a fresh install shows the toggle on and every bot's style at the table", async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  await expect(toggle(page)).toBeChecked();
  await expect(toggle(page)).toBeEnabled();
  await expectNoSeriousAxeViolations(page);
  expect(await storedSettings(page)).toEqual([DEFAULTS]);

  await settingsToHome(page);
  await startDefaultGame(page);
  await expect(table(page).locator('[data-part="style"]')).toHaveCount(5);
  expect(await botStyles(page)).toEqual(STYLES_SHOWN);
});

test('turning styles off is saved, kept after reload and hides every label at the table', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await openSettings(page);
  await expect(toggle(page)).toBeEnabled();
  await toggle(page).focus();
  await page.keyboard.press('Space');
  await expect(toggle(page)).not.toBeChecked();
  await expect
    .poll(() => storedSettings(page))
    .toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);

  await page.reload();
  await openSettings(page);
  await expect(toggle(page)).toBeEnabled();
  await expect(toggle(page)).not.toBeChecked();

  await settingsToHome(page);
  await startDefaultGame(page);
  await expectStylesHidden(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('a change made while paused applies when the table resumes', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  await expect(toggle(page)).toBeEnabled();
  await toggle(page).uncheck();
  await expect
    .poll(() => storedSettings(page))
    .toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);
  await settingsToHome(page);
  await startDefaultGame(page);
  await expectStylesHidden(page);
  await expect.poll(async () => (await storedSessions(page)).length).toBe(1);

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(homeHeading(page)).toBeFocused();
  await openSettings(page);
  await toggle(page).check();
  await expect(toggle(page)).toBeChecked();
  await settingsToHome(page);
  await page.getByRole('button', { name: /^Resume session/ }).click();
  await expect(botSeats(page)).toHaveCount(5);
  await expect(table(page).locator('[data-part="style"]')).toHaveCount(5);
  expect(await botStyles(page)).toEqual(STYLES_SHOWN);
});

/** Runs in the page: replaces the settings record with an invalid one (showOpponentStyles: 'no'). */
function storeInvalidSettings(defaults: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer', 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('settings', 'readwrite');
      transaction
        .objectStore('settings')
        .put({ ...defaults, showOpponentStyles: 'no' }, 'settings');
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

test('an invalid stored record shows the defaults and the next change repairs it', async ({
  page,
}) => {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(storeInvalidSettings, DEFAULTS);
  expect(await storedSettings(page)).toEqual([{ ...DEFAULTS, showOpponentStyles: 'no' }]);

  await page.reload();
  await openSettings(page);
  await expect(toggle(page)).toBeEnabled();
  await expect(toggle(page)).toBeChecked();
  await toggle(page).uncheck();
  await expect
    .poll(() => storedSettings(page))
    .toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);
});
