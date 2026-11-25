import { expect, test, type Page } from '@playwright/test';

// TASK-2.19: Game Config fits 320 and 375 px screens with a full 10-player table.
const WIDTHS = [320, 375];
const NAMES = ['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy'];

const styleSelect = (page: Page, name: string) =>
  page.getByRole('combobox', { name: `Style for ${name}`, exact: true });
const opponents = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasNotText: /^You/ });

async function openTenPlayerConfig(page: Page, width: number): Promise<number> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
  await page.getByLabel('Players at the table').selectOption({ label: '10 (full ring)' });
  await expect(opponents(page)).toHaveCount(9);
  return page.evaluate(() => document.documentElement.clientWidth);
}

test('game config with 10 players does not scroll sideways at 320 and 375 px', async ({ page }) => {
  for (const width of WIDTHS) {
    const cw = await openTenPlayerConfig(page, width);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth - cw, `overflow at ${width}px`).toBeLessThanOrEqual(0);
    const panels = await page
      .locator('section.panel')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
    expect(panels).toHaveLength(2);
    for (const { left, right } of panels) {
      expect(left, `panel left at ${width}px`).toBeGreaterThanOrEqual(16);
      expect(right, `panel right at ${width}px`).toBeLessThanOrEqual(cw - 16);
    }
  }
});

test("every bot row's seat, name and style select are visible and usable at 320 and 375 px", async ({
  page,
}) => {
  for (const width of WIDTHS) {
    const cw = await openTenPlayerConfig(page, width);
    expect(await opponents(page).locator('.seat-name').allTextContents()).toEqual(NAMES);
    for (const [i, name] of NAMES.entries()) {
      const row = opponents(page).nth(i);
      await expect(row.locator('.seat-label')).toHaveText(/^Seat \d+$/);
      for (const part of [
        row.locator('.seat-label'),
        row.locator('.seat-name'),
        styleSelect(page, name),
      ]) {
        await expect(part).toBeVisible();
        const box = (await part.boundingBox()) ?? { x: -1, y: 0, width: 0, height: 0 };
        expect(box.x, `${name} left at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${name} right at ${width}px`).toBeLessThanOrEqual(cw);
      }
      const select = (await styleSelect(page, name).boundingBox()) ?? { width: 0, height: 0 };
      expect(select.height, `${name} select height`).toBeGreaterThanOrEqual(44);
      expect(select.width, `${name} select width`).toBeGreaterThanOrEqual(44);
    }
    await styleSelect(page, 'Ivy').selectOption({ label: 'Maniac' });
    expect(
      await styleSelect(page, 'Ivy').evaluate(
        (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent,
      ),
    ).toBe('Maniac');
  }
});
