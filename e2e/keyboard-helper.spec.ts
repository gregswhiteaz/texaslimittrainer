import { expect, test } from '@playwright/test';
import { buttonTabKey, chooseButtonTabKey, type TabKey } from './support/keyboard';

test('chooseButtonTabKey falls back to Alt+Tab only when Tab misses', async () => {
  const run = async (reachable: TabKey[]) => {
    const calls: TabKey[] = [];
    const key = chooseButtonTabKey(async (candidate) => {
      calls.push(candidate);
      return reachable.includes(candidate);
    });
    return { key, calls };
  };

  const tab = await run(['Tab', 'Alt+Tab']);
  await expect(tab.key).resolves.toBe('Tab');
  expect(tab.calls).toEqual(['Tab']);

  const alt = await run(['Alt+Tab']);
  await expect(alt.key).resolves.toBe('Alt+Tab');
  expect(alt.calls).toEqual(['Tab', 'Alt+Tab']);

  const none = await run([]);
  await expect(none.key).rejects.toThrow(/neither Tab nor Alt\+Tab moves focus to a button/);
  expect(none.calls).toEqual(['Tab', 'Alt+Tab']);
});

test('buttonTabKey returns a key that tabs to a button and leaves the page as it was', async ({
  page,
  browserName,
}) => {
  await page.setContent('<input aria-label="Kept"><button>Other</button>');
  await page.locator('input').focus();
  const pages = page.context().pages().length;

  const key = await buttonTabKey(page);

  expect(['Tab', 'Alt+Tab']).toContain(key);
  if (browserName === 'chromium') expect(key).toBe('Tab');
  expect(page.context().pages()).toHaveLength(pages);
  await expect(page.locator('input')).toBeFocused();

  await page.setContent('<h1 tabindex="-1">Probe</h1><button>Probe</button>');
  await page.locator('h1').focus();
  await page.keyboard.press(key);
  await expect(page.locator('button')).toBeFocused();
});
