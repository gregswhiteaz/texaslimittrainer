import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import {
  buildTableScenes,
  openTableScene,
  stubReplayWords,
  type TableScene,
} from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const IDLE = ['Fold', 'Call', 'Raise'];

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const actionButtons = (page: Page) =>
  page.getByRole('group', { name: 'Your actions' }).getByRole('button');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

async function expectEnabledTexts(page: Page, texts: string[]): Promise<void> {
  await expect(actionButtons(page)).toHaveText(texts);
  for (const button of await actionButtons(page).all()) await expect(button).toBeEnabled();
}

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('an idle button with its disabled attribute removed changes nothing', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  // clock.runFor in 50 ms slices so each bot timer is scheduled after the previous commit.
  for (let ms = 0; ms < 1000; ms += 50) await page.clock.runFor(50);
  await expectToAct(page, '5');

  await actionButtons(page).getByText('Call $4', { exact: true }).click();
  await expect.poll(() => actionCount(page)).toBe(5);
  await expectToAct(page, '6');
  await expect(actionButtons(page)).toHaveText(IDLE);

  await page
    .getByRole('group', { name: 'Your actions' })
    .evaluate((group) =>
      group.querySelectorAll('button').forEach((b) => b.removeAttribute('disabled')),
    );
  const buttons = await actionButtons(page).all();
  expect(buttons).toHaveLength(3);
  for (const button of buttons) await expect(button).toBeEnabled();
  for (const button of buttons) await button.click();

  expect(await actionCount(page)).toBe(5);
  await expectToAct(page, '6');
  await expect(actionButtons(page)).toHaveText(IDLE);
});

test('capped and all-in scenes show the exact labels', async ({ page }) => {
  const expected: [TableScene, string[]][] = [
    ['capped-flop', ['Fold', 'Call $4']],
    ['call-all-in', ['Fold', 'Call all-in $3']],
    ['raise-all-in', ['Fold', 'Call $4', 'Raise all-in to $6']],
    ['bet-all-in', ['Check', 'Bet all-in $3']],
  ];
  for (const [scene, texts] of expected) {
    await openTableScene(page, scenes, scene);
    await expectToAct(page, '5');
    await expectEnabledTexts(page, texts);
  }
});

test('the all-in bar is 44 px, axe clean and makes no outside requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'raise-all-in');
  await expectEnabledTexts(page, ['Fold', 'Call $4', 'Raise all-in to $6']);

  for (const button of await actionButtons(page).all()) {
    const box = await button.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await expectNoSeriousAxeViolations(page);
  // The scene page is inline content, so any network request at all would leave the origin.
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
