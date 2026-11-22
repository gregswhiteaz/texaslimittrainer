import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
const OPTIONS = ['$2 / $4', '$3 / $6', '$4 / $8', '$6 / $12', '$10 / $20', '$20 / $40'];
const REAL_MONEY =
  /deposit|payment|\bpay\b|purchase|buy chips|cash[- ]?out|withdraw|real[- ]?money|convert|currency|credit card/i;

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const stakeSelect = (page: Page) => page.getByLabel('Stakes (small bet / big bet)');
const buyInRow = (page: Page) =>
  page.locator('.config-fields div').filter({ has: page.locator('dt', { hasText: /^Buy-in$/ }) });
const stackOf = (page: Page, seat: number) =>
  page.locator(`li[data-seat="${seat}"] [data-part="stack"]`);
const actionOf = (page: Page, seat: number) =>
  page.locator(`li[data-seat="${seat}"] [data-part="action"]`);
const selectedText = (page: Page) =>
  stakeSelect(page).evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent);

async function openGameConfig(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
}

const storage = (page: Page) =>
  page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));

test('stake list is the six stakes with $4 / $8 selected and the buy-in follows the stake', async ({
  page,
}) => {
  await openGameConfig(page);
  const before = await storage(page);

  await expect(stakeSelect(page)).toHaveRole('combobox');
  expect(
    await stakeSelect(page)
      .locator('option')
      .evaluateAll((els) => els.map((el) => el.textContent)),
  ).toEqual(OPTIONS);
  expect(await selectedText(page)).toBe('$4 / $8');

  await stakeSelect(page).selectOption({ label: '$3 / $6' });
  await expect(buyInRow(page).locator('dd')).toHaveText('$120 (20 big bets)');
  await expect(
    buyInRow(page).locator('input, select, textarea, button, a, [contenteditable], [tabindex]'),
  ).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(2);

  await button(page, 'Cancel').click();
  await page.getByRole('button', { name: /^New game/ }).click();
  expect(await selectedText(page)).toBe('$4 / $8');
  await expect(buyInRow(page).locator('dd')).toHaveText('$160 (20 big bets)');
  expect(await storage(page)).toEqual(before);
});

test('starting at $10 / $20 shows $10/$20, posts $5 and $10 and seats $400', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, [0x9e3779b9, 1, 2, 3]);
  await openGameConfig(page);

  await stakeSelect(page).selectOption({ label: '$10 / $20' });
  await button(page, 'Start game').click();

  await expect(page.locator('.table-header-line')).toHaveText(
    'Cash · 6 players · $10/$20 · Hand #1',
  );
  for (let seat = 1; seat <= 6; seat += 1) await expect(stackOf(page, seat)).toHaveText('$400');

  // 50 ms slices: React commits in a real task, so each bot timer is scheduled after the last slice.
  for (let ms = 0; ms < 1000; ms += 50) await page.clock.runFor(50);
  await expect(actionOf(page, 1)).toHaveText('Small blind $5');
  await expect(stackOf(page, 1)).toHaveText('$395');
  await expect(actionOf(page, 2)).toHaveText('Big blind $10');
  await expect(stackOf(page, 2)).toHaveText('$390');

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('every stake keeps game config free of real-money controls and axe clean', async ({
  page,
}) => {
  await openGameConfig(page);
  const main = page.getByRole('main');

  for (const option of OPTIONS) {
    await stakeSelect(page).selectOption({ label: option });
    expect(await selectedText(page)).toBe(option);

    expect(await main.innerText()).not.toMatch(REAL_MONEY);
    expect(await page.getByRole('button').allInnerTexts()).toEqual([
      '← Home',
      'Cancel',
      'Start game',
    ]);
    await expect(page.getByRole('combobox')).toHaveCount(2);
    await expect(page.getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expectNoSeriousAxeViolations(page);

    const box = await stakeSelect(page).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
