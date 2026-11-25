import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { realMoneyOffers } from './support/play-money';

// TASK-12.1: Home → Settings → Home, the version line and keyboard reach of the Settings controls.

const ORIGIN = 'http://localhost:4173';
const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string;
};

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const settingsButton = (page: Page) => menu(page).getByRole('button', { name: /^Settings/ });
const settingsHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'Settings' });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const homeButton = (page: Page) => page.getByRole('button', { name: '← Home' });

async function openSettings(page: Page): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await settingsButton(page).click();
  await expect(settingsHeading(page)).toBeFocused();
}

/** The texts of the elements `key` reaches from the focused element, in order. Focus may leave the page once
 *  and wrap to its start (the h1 follows ← Home); the walk stops when focus repeats or leaves a second time. */
async function tabOrder(page: Page, key: string): Promise<string[]> {
  const reached: string[] = [];
  let exits = 0;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(key);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el === null || el === document.body
        ? null
        : el.textContent || (el as HTMLInputElement).labels?.[0]?.textContent?.trim() || '';
    });
    if (focused === null) {
      if (++exits === 2) break;
      continue;
    }
    if (reached.includes(focused)) break;
    reached.push(focused);
  }
  return reached;
}

test('Settings opens from Home and ← Home returns', async ({ page }) => {
  await openSettings(page);
  await expect(settingsHeading(page)).toBeVisible();
  await expect(homeButton(page)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Table' })).toHaveCount(0);

  await homeButton(page).click();
  await expect(homeHeading(page)).toBeFocused();
  await expect(menu(page).getByRole('button', { name: /^New game/ })).toBeVisible();
  await expect(settingsButton(page)).toBeVisible();
});

test('every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44', async ({
  page,
  browserName,
}) => {
  await openSettings(page);
  await expect(
    page.getByRole('checkbox', { name: 'Show opponent styles at the table' }),
  ).toBeEnabled();
  const controls = page.locator(
    'main :is(a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]))',
  );
  const expected = await controls.evaluateAll((els) =>
    els.map(
      (el) => el.textContent || (el as HTMLInputElement).labels?.[0]?.textContent?.trim() || '',
    ),
  );
  expect(expected).toEqual(['← Home', 'Show opponent styles at the table']);
  // WebKit only tabs to buttons with Alt held (no full keyboard access, A-8).
  const order = await tabOrder(page, browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  // TASK-12.2 Block 1: the walk starts at the focused h1, after ← Home in the DOM, so Tab reaches the
  // controls after the h1 first, then wraps to ← Home. Each control still appears exactly once, in a fixed order.
  expect(order).toEqual([...expected.slice(1), expected[0]]);

  for (const control of await controls.all()) {
    expect(await control.evaluate((el) => el.tagName)).toMatch(
      /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/,
    );
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await homeButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(homeHeading(page)).toBeFocused();

  await settingsButton(page).click();
  await expect(settingsHeading(page)).toBeFocused();
  await homeButton(page).focus();
  await page.keyboard.press('Space');
  await expect(homeHeading(page)).toBeFocused();
});

test('Settings shows the version with no axe violations and no outside requests', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openSettings(page);
  await expect(page.locator('.settings-version')).toHaveText(`Version ${PKG.version}`);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Play',
    'Display',
    'Your data',
  ]);
  await expectNoSeriousAxeViolations(page);
  expect(realMoneyOffers(await page.locator('body').innerText())).toEqual([]);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
