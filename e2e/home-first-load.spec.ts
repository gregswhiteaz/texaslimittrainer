import { expect, test } from '@playwright/test';

test('first load of Home does not move focus to its heading', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
  await expect(heading).toBeVisible();
  // The focus effect runs after paint; wait, then read once so an early check cannot pass vacuously.
  await page.waitForTimeout(500);

  const focus = await page.evaluate(() => ({
    onBody: document.activeElement === document.body,
    onHeading: document.activeElement === document.querySelector('h1'),
  }));
  expect(focus).toEqual({ onBody: true, onHeading: false });
});
