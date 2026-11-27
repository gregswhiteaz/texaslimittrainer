import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { readStore } from './support/hand-records';

// TASK-12.11: a settings save that fails shows a message on Settings and the toggle goes back to the stored
// value.

const DEFAULTS = {
  defaultSpeed: 'rapid',
  autoOpenReview: true,
  showOpponentStyles: true,
  fourColourDeck: false,
  botBanter: true,
};
const MESSAGE = 'Your change could not be saved, so the setting is unchanged.';

interface FailWindow {
  __tlhFailSettingsPut?: boolean;
}

/** Init script (A-5): while `__tlhFailSettingsPut` is true, every put on the `settings` store throws. Test-only;
 *  nothing here is imported from src/. */
function failSettingsPuts(): void {
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (
    this: IDBObjectStore,
    value: unknown,
    key?: IDBValidKey,
  ): IDBRequest<IDBValidKey> {
    if (this.name === 'settings' && (window as FailWindow).__tlhFailSettingsPut === true) {
      throw new DOMException('Test: settings put failed', 'UnknownError');
    }
    return put.call(this, value, key);
  };
}

const setPutsFail = (page: Page, fail: boolean): Promise<void> =>
  page.evaluate((value) => {
    (window as FailWindow).__tlhFailSettingsPut = value;
  }, fail);

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const toggle = (page: Page) =>
  page.getByRole('checkbox', { name: 'Show opponent styles at the table' });
const alert = (page: Page) => page.getByRole('alert');
const storedSettings = (page: Page): Promise<unknown[]> => page.evaluate(readStore, 'settings');

async function openSettings(page: Page): Promise<void> {
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Settings/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeFocused();
}

/** Opens Settings, makes saves fail and unticks the toggle with the keyboard; ends with the message shown. */
async function failOneChange(page: Page): Promise<void> {
  await page.addInitScript(failSettingsPuts);
  await page.goto('/');
  await openSettings(page);
  await expect(toggle(page)).toBeEnabled();
  await setPutsFail(page, true);
  await toggle(page).focus();
  await page.keyboard.press('Space');
  await expect(alert(page)).toHaveText(MESSAGE);
  await expect(alert(page)).toBeVisible();
}

test('a failed save shows the message, keeps the toggle and the stored record unchanged', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await failOneChange(page);
  await expect(toggle(page)).toBeChecked();
  await expect(toggle(page)).toBeFocused();
  expect(await storedSettings(page)).toEqual([DEFAULTS]);
  expect(errors.some((text) => text.includes('Settings could not be saved'))).toBe(true);
  await expectNoSeriousAxeViolations(page);
});

test('the next change or reopening Settings clears the message', async ({ page }) => {
  await failOneChange(page);
  await setPutsFail(page, false);
  await page.keyboard.press('Space');
  await expect(alert(page)).toHaveCount(0);
  await expect(toggle(page)).not.toBeChecked();
  await expect
    .poll(() => storedSettings(page))
    .toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);

  await setPutsFail(page, true);
  await page.keyboard.press('Space');
  await expect(alert(page)).toHaveText(MESSAGE);
  await expect(toggle(page)).not.toBeChecked();
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeFocused();
  await openSettings(page);
  await expect(alert(page)).toHaveCount(0);
  await expect(toggle(page)).not.toBeChecked();
  expect(await storedSettings(page)).toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);
});
