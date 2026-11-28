import { expect, test, type Page } from '@playwright/test';
import { buttonTabKey } from './support/keyboard';

// TASK-12.10 (AC#3): one Tab from the focused Settings / Statistics heading reaches ← Home, which still shows
// before the heading.

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const homeButton = (page: Page) => page.getByRole('button', { name: '← Home' });

/** Opens `screen` from Home and waits until its h1 is focused and, on Statistics, the charts have loaded. */
async function openScreen(page: Page, screen: 'Settings' | 'Statistics'): Promise<void> {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await menu(page)
    .getByRole('button', { name: new RegExp(`^${screen}`) })
    .click();
  if (screen === 'Statistics') {
    await expect(page.locator('.stats-chart[aria-busy="true"]')).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { level: 1, name: screen })).toBeFocused();
}

for (const screen of ['Settings', 'Statistics'] as const) {
  test(`one Tab from the ${screen} heading reaches ← Home`, async ({ page }) => {
    await openScreen(page, screen);
    // WebKit on macOS skips buttons on plain Tab when Full Keyboard Access is off; buttonTabKey holds Alt only then.
    await page.keyboard.press(await buttonTabKey(page));
    await expect(homeButton(page)).toBeFocused();
  });
}

test('← Home stays visually before the heading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const screen of ['Settings', 'Statistics'] as const) {
    await openScreen(page, screen);
    const button = await homeButton(page).boundingBox();
    const heading = await page.getByRole('heading', { level: 1, name: screen }).boundingBox();
    expect(button).not.toBeNull();
    expect(heading).not.toBeNull();
    if (button === null || heading === null) return;
    expect(button.x + button.width).toBeLessThanOrEqual(heading.x);
    // Same row: the vertical centres are within one box of each other.
    expect(Math.abs(button.y + button.height / 2 - (heading.y + heading.height / 2))).toBeLessThan(
      Math.min(button.height, heading.height),
    );
  }
});
