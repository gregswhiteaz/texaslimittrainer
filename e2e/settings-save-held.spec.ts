import { expect, test, type Page } from '@playwright/test';
import { readStore } from './support/hand-records';
import {
  armSessionsHold,
  holdSessionsWrite,
  releaseSessionsHold,
  sessionsHoldState,
} from './support/hold-writes';

// TASK-12.12 AC#3 (pins TASK-12.11 A-3): after a failed save showed the message, the next change clears it before
// that change's save settles.

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

/** Init script (A-6, copy of TASK-12.11's): while `__tlhFailSettingsPut` is true, every put on the `settings`
 *  store throws. Test-only; nothing here is imported from src/. */
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

test('the message clears at the next change before that save settles', async ({ page }) => {
  await page.addInitScript(failSettingsPuts);
  await page.addInitScript(holdSessionsWrite);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: /^Settings/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeFocused();
  await expect(toggle(page)).toBeEnabled();

  await setPutsFail(page, true);
  await toggle(page).focus();
  await page.keyboard.press('Space');
  await expect(alert(page)).toHaveText(MESSAGE);
  await expect(toggle(page)).toBeChecked();

  await setPutsFail(page, false);
  await armSessionsHold(page, ['settings']);
  await page.keyboard.press('Space');
  await expect.poll(() => sessionsHoldState(page)).toBe('held');
  await expect(alert(page)).toHaveCount(0);
  await expect(toggle(page)).not.toBeChecked();
  // The save is still unsettled after the checks above.
  expect(await sessionsHoldState(page)).toBe('held');

  await releaseSessionsHold(page);
  await expect
    .poll(() => page.evaluate(readStore, 'settings'))
    .toEqual([{ ...DEFAULTS, showOpponentStyles: false }]);
  await expect(alert(page)).toHaveCount(0);
});
