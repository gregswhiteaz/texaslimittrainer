import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct, toActSeats } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });
const stakeSelect = (page: Page) => page.getByLabel('Stakes (small bet / big bet)');
const buyInRow = (page: Page) =>
  page.locator('.config-fields div').filter({ has: page.locator('dt', { hasText: /^Buy-in$/ }) });
const selectedText = (page: Page) =>
  stakeSelect(page).evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent);
const storage = (page: Page) =>
  page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));

async function openGameConfig(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
}

test('sit-and-go hides the stake selector and cash game brings back the chosen stake', async ({
  page,
}) => {
  await openGameConfig(page);
  const before = await storage(page);

  const group = page.getByRole('radiogroup', { name: 'Game type' });
  await expect(group).toHaveCount(1);
  expect(
    await group
      .getByRole('radio')
      .evaluateAll((els) => els.map((el) => el.closest('label')?.textContent)),
  ).toEqual(['Cash game', 'Sit-and-go']);
  await expect(group.getByRole('radio')).toHaveCount(2);
  await expect(radio(page, 'Cash game')).toBeChecked();
  await expect(radio(page, 'Sit-and-go')).not.toBeChecked();
  await expectNoSeriousAxeViolations(page);
  for (const label of await page
    .locator('.config-choice label')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
    expect(label).toBeGreaterThanOrEqual(44);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await stakeSelect(page).selectOption({ label: '$6 / $12' });
  await radio(page, 'Sit-and-go').check();
  await expect(radio(page, 'Sit-and-go')).toBeChecked();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  const fields = await page.locator('.config-fields').innerText();
  expect(fields).not.toContain('Stakes (small bet / big bet)');
  expect(fields).not.toContain('Buy-in');
  await expectNoSeriousAxeViolations(page);

  await radio(page, 'Cash game').check();
  await expect(stakeSelect(page)).toBeVisible();
  await expect(stakeSelect(page)).toHaveRole('combobox');
  expect(await selectedText(page)).toBe('$6 / $12');
  await expect(buyInRow(page).locator('dd')).toHaveText('$240 (20 big bets)');

  await radio(page, 'Sit-and-go').check();
  await button(page, 'Cancel').click();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(radio(page, 'Cash game')).toBeChecked();
  expect(await selectedText(page)).toBe('$4 / $8');
  expect(await storage(page)).toEqual(before);
});

test('starting a sit-and-go opens the table with chip labels on the action bar', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, [0x9e3779b9, 1, 2, 3]);
  await openGameConfig(page);

  await radio(page, 'Sit-and-go').check();
  await button(page, 'Start game').click();

  await expect(page.locator('.table-header-line')).toHaveText(/^Sit-and-go · 6 players · /);
  for (let seat = 1; seat <= 6; seat += 1) {
    await expect(page.locator(`li[data-seat="${seat}"] [data-part="stack"]`)).toContainText('1500');
  }

  // 50 ms slices: React commits in a real task, so each bot timer is scheduled after the last slice.
  const userToAct = toActSeats(page).and(page.locator('[data-seat="5"]'));
  for (let ms = 0; ms < 5000 && (await userToAct.count()) === 0; ms += 50) {
    await page.clock.runFor(50);
  }
  await expectToAct(page, '5');
  const labels = await page
    .getByRole('group', { name: 'Your actions' })
    .locator('button:not(:disabled)')
    .allInnerTexts();
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    expect(label).toMatch(/^(Fold|Check|Call \d+|Bet \d+|Raise to \d+)$/);
    expect(label).not.toContain('$');
  }
  expect(labels.some((l) => l.startsWith('Call ') || l.startsWith('Raise to '))).toBe(true);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
