import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { buildTableScenes, openTableScene, type TableScene } from './support/table-harness-bundle';

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

const LISTS = ['Pot winners', 'Winners', 'Shown hands'];

/** Layout facts of the result block, read in the page. */
async function resultLayout(page: Page) {
  return page.getByRole('status').evaluate((block, names) => {
    const lineTops = (rects: DOMRectList): number[] => [
      ...new Set([...rects].filter((r) => r.width > 0).map((r) => Math.round(r.top))),
    ];
    const title = block.querySelector('.hand-result-title') as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(title);
    const style = getComputedStyle(block);
    const contentWidth =
      block.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const lists = names.flatMap((name) => {
      const list = block.querySelector<HTMLElement>(`ul[aria-label='${name}']`);
      if (list === null) return [];
      const items = [...list.querySelectorAll<HTMLElement>(':scope > li')];
      return [
        {
          name,
          width: list.getBoundingClientRect().width,
          overflowing: items.filter((li) => li.scrollWidth > li.clientWidth).length,
          parts: [...list.querySelectorAll<HTMLElement>('li [data-part]')].map((span) => ({
            text: span.textContent,
            lines: lineTops(span.getClientRects()).length,
          })),
        },
      ];
    });
    return {
      titleText: title.textContent,
      titleLines: lineTops(range.getClientRects()).length,
      contentWidth,
      right: block.getBoundingClientRect().right,
      pageWidth: document.documentElement.scrollWidth,
      lists,
    };
  }, LISTS);
}

async function expectFullWidthResult(
  page: Page,
  testInfo: TestInfo,
  scene: TableScene,
  shot: string,
): Promise<void> {
  await openTableScene(page, scenes, scene);
  const layout = await resultLayout(page);
  expect(layout.titleText).toBe('Hand over');
  expect(layout.titleLines, 'Hand over lines').toBe(1);
  expect(layout.lists.map((l) => l.name)).toContain('Pot winners');
  for (const list of layout.lists) {
    expect(list.parts.length, list.name).toBeGreaterThan(0);
    for (const p of list.parts) expect(p.lines, `${list.name}: ${p.text}`).toBe(1);
    expect(list.overflowing, `${list.name} overflowing items`).toBe(0);
    expect(list.width, `${list.name} width`).toBeGreaterThanOrEqual(layout.contentWidth / 2);
  }
  expect(layout.right).toBeLessThanOrEqual(1280);
  expect(layout.pageWidth).toBeLessThanOrEqual(1280);
  await expectNoSeriousAxeViolations(page);
  await testInfo.attach(shot, {
    body: await page.getByRole('status').screenshot(),
    contentType: 'image/png',
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
});

test('the side-pot result keeps Hand over on one line and gives every line full width', async ({
  page,
}, testInfo) => {
  await expectFullWidthResult(page, testInfo, 'side-pot-showdown', 'side-pot-result.png');
  await expect(page.getByRole('list', { name: 'Shown hands' }).getByRole('listitem')).toHaveText([
    'Ava shows · Pair of queens',
  ]);
  await expectFullWidthResult(page, testInfo, 'split-side-pot', 'split-side-pot-result.png');
});

test('a single-pot result stays on one row', async ({ page }) => {
  await openTableScene(page, scenes, 'shown-hands');
  await expect(page.getByRole('list', { name: 'Pot winners' })).toHaveCount(0);
  const title = await page.locator('.hand-result-title').boundingBox();
  const winners = await page.getByRole('list', { name: 'Winners', exact: true }).boundingBox();
  expect(title).not.toBeNull();
  expect(winners).not.toBeNull();
  if (title === null || winners === null) return;
  expect(title.y).toBeLessThan(winners.y + winners.height);
  expect(winners.y).toBeLessThan(title.y + title.height);
});

test('a split side pot reads Side pot $81 · Ben wins $41, Ava wins $40', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openTableScene(page, scenes, 'split-side-pot');
  await expect(page.getByRole('list', { name: 'Pot winners' }).getByRole('listitem')).toHaveText([
    'Main pot $60 · You win $60',
    'Side pot $81 · Ben wins $41, Ava wins $40',
  ]);
  // The scene page is inline content, so any network request at all would leave the origin.
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
