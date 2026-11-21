import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { buildTableScenes, openTableScene } from './support/table-harness-bundle';

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('shown losing hands appear after the winner, mucked cards never, axe clean', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'shown-hands');

  const winners = page.getByRole('list', { name: 'Winners' }).getByRole('listitem');
  await expect(winners).toHaveText(['Ben wins $16 · Pair of kings']);
  const shown = page.getByRole('list', { name: 'Shown hands' }).getByRole('listitem');
  await expect(shown).toHaveText(['Dee shows · Pair of fours', 'You show · Pair of eights']);
  for (const name of ["Dee's cards", 'Your shown cards']) {
    await expect(page.getByRole('group', { name }).locator('svg[data-card]')).toHaveCount(2);
  }
  await expect(page.locator('svg[data-card="5h"], svg[data-card="5s"]')).toHaveCount(0);

  const block = await page.getByRole('status').boundingBox();
  expect(block).not.toBeNull();
  expect((block?.x ?? 0) + (block?.width ?? 0)).toBeLessThanOrEqual(1280);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);

  await expectNoSeriousAxeViolations(page);
  // The scene page is inline content, so any network request at all would leave the origin.
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
