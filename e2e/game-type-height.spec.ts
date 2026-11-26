import { expect, test, type Page } from '@playwright/test';

const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });

async function openGameConfig(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
}

/** Heights of the option labels in the radio group named `group`. */
const heights = (page: Page, group: string): Promise<number[]> =>
  page
    .getByRole('radiogroup', { name: group })
    .locator('label')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));

/** Checks each of `names` in turn; every reading has one height, the same in all readings, ≥ 44 px. */
async function expectSteadyHeights(page: Page, group: string, names: string[]): Promise<void> {
  const readings = [await heights(page, group)];
  for (const name of names) {
    await radio(page, name).check();
    await expect(radio(page, name)).toBeChecked();
    readings.push(await heights(page, group));
  }
  const first = readings[0]?.[0] ?? 0;
  expect(first).toBeGreaterThanOrEqual(44);
  for (const reading of readings) {
    expect(reading.length, group).toBeGreaterThanOrEqual(2);
    expect(reading, group).toEqual(reading.map(() => first));
  }
}

test('game-type options keep the same height when the selection changes', async ({ page }) => {
  await openGameConfig(page);
  await expectSteadyHeights(page, 'Game type', ['Sit-and-go', 'Cash game']);
  await expectSteadyHeights(page, 'Line-up', ['Tough', 'Soft', 'Mixed']);
});
