import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { buildTableScenes, openTableScene } from './support/table-harness-bundle';

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const block = await page.getByRole('status').boundingBox();
  expect(block).not.toBeNull();
  expect((block?.x ?? 0) + (block?.width ?? 0)).toBeLessThanOrEqual(1280);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
}

test('side pots and their winners are shown separately, single pot otherwise, axe clean', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 1280, height: 720 });

  await openTableScene(page, scenes, 'side-pot-river');
  await expect(
    page.getByRole('list', { name: 'Pots', exact: true }).getByRole('listitem'),
  ).toHaveText(['Main pot $60', 'Side pot $80']);
  await expect(page.getByText(/^Pot \$/)).toHaveCount(0);
  await expectNoSeriousAxeViolations(page);

  await openTableScene(page, scenes, 'side-pot-showdown');
  await expect(page.getByRole('list', { name: 'Pot winners' }).getByRole('listitem')).toHaveText([
    'Main pot $60 · You win $60',
    'Side pot $80 · Ben wins $80',
  ]);
  await expect(
    page.getByRole('list', { name: 'Winners', exact: true }).getByRole('listitem'),
  ).toHaveText(['You win $60 · Pair of aces', 'Ben wins $80 · Pair of kings']);
  await expect(page.getByText('Pot $0', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);

  await openTableScene(page, scenes, 'flop-bet');
  await expect(page.getByRole('list', { name: 'Pots', exact: true })).toHaveCount(0);
  await expect(page.getByText('Pot $30', { exact: true })).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  // The scene page is inline content, so any network request at all would leave the origin.
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
