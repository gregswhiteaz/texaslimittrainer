import type { Page } from '@playwright/test';

export type TabKey = 'Tab' | 'Alt+Tab';

/** Returns the first of Tab, Alt+Tab for which `reaches` resolves true; throws if neither does. */
export async function chooseButtonTabKey(
  reaches: (key: TabKey) => Promise<boolean>,
): Promise<TabKey> {
  for (const key of ['Tab', 'Alt+Tab'] as const) {
    if (await reaches(key)) return key;
  }
  throw new Error('buttonTabKey: neither Tab nor Alt+Tab moves focus to a button');
}

/**
 * The key that moves focus to a button in this browser. WebKit on macOS skips buttons on plain Tab unless
 * Full Keyboard Access (System Settings › Keyboard › Keyboard navigation) is on; Alt+Tab reaches them.
 * WebKit on Linux and Chromium tab to buttons with plain Tab. Probes on a separate page in the same context,
 * so `page` keeps its focus and state.
 */
export async function buttonTabKey(page: Page): Promise<TabKey> {
  const probe = await page.context().newPage();
  try {
    return await chooseButtonTabKey(async (key) => {
      await probe.setContent('<h1 tabindex="-1">Probe</h1><button>Probe</button>');
      await probe.locator('h1').focus();
      await probe.keyboard.press(key);
      return (await probe.evaluate(() => document.activeElement?.tagName)) === 'BUTTON';
    });
  } finally {
    await probe.close();
  }
}
