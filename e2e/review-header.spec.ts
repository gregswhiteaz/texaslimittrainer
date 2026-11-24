import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { playToResult, storedRecords } from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { buildTableScenes, openTableScene, stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const CODE = '9e3779b9000000010000000200000003';

const summary = (panel: Locator) => panel.locator('[data-part="summary"]');
const replay = (panel: Locator) => panel.locator('[data-part="replay"]');

async function cardsOf(group: Locator): Promise<string[]> {
  return group
    .locator('svg[data-card]')
    .evaluateAll((cards) => cards.map((c) => c.getAttribute('data-card') ?? ''));
}

async function fontPx(locator: Locator): Promise<number> {
  return locator.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
}

function logRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  return requests;
}

test('the review header of a live hand matches the seat and the stored record', async ({
  page,
}) => {
  const requests = logRequests(page);
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  const advance = () => page.clock.runFor(50);
  await playToResult(page, 1, advance, { play: 'call' });
  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await runUntil(
    page,
    async () => (await panel.count()) > 0 && (await storedRecords(page)).length === 1,
    {
      label: 'review panel and stored record',
    },
  );
  await expect(panel).toBeVisible();

  const [record] = await storedRecords(page);
  expect(record?.replayCode).toBe(CODE);
  await expect(panel.locator('[data-part="replay-code"]')).toHaveText(CODE);
  await expect(replay(panel)).toHaveText(`Hand #1 · Replay code ${CODE}`);

  const userSeat = page.locator('li[data-user]');
  const seatCards = await cardsOf(userSeat);
  expect(seatCards).toHaveLength(2);
  expect(await cardsOf(panel.getByRole('group', { name: 'Your hole cards' }))).toEqual(seatCards);
  const seatPosition = (await userSeat.locator('[data-part="position"]').textContent()) ?? '';
  expect(seatPosition.length).toBeGreaterThan(0);
  await expect(summary(panel).locator('[data-part="position"]')).toHaveText(seatPosition);

  const stackText = (await userSeat.locator('[data-part="stack"]').textContent()) ?? '';
  const stack = Number(/^\$(\d+)$/.exec(stackText)?.[1]);
  expect(Number.isInteger(stack)).toBe(true);
  const expected =
    stack > 160
      ? `You won $${stack - 160}`
      : stack < 160
        ? `You lost $${160 - stack}`
        : 'You broke even';
  await expect(summary(panel).locator('[data-part="result"]')).toHaveText(expected);

  const replaySize = await fontPx(replay(panel));
  const explanations = panel.locator('[data-part="explanation"]');
  expect(await explanations.count()).toBeGreaterThan(0);
  for (const explanation of await explanations.all()) {
    expect(replaySize).toBeLessThan(await fontPx(explanation));
  }

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('the hand 133 header shows result, cards, position and the replay code in small text', async ({
  page,
}) => {
  const requests = logRequests(page);
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'review-header');
  const panel = page.getByRole('complementary', { name: 'Hand #133 review' });
  await expect(panel).toBeVisible();
  const heading = panel.getByRole('heading', { level: 2 });
  await expect(heading).toHaveText('Hand #133 review');
  await expect(summary(panel).locator('[data-part="result"]')).toHaveText('You lost $48');
  expect(await cardsOf(panel.getByRole('group', { name: 'Your hole cards' }))).toEqual([
    'Ah',
    '9s',
  ]);
  await expect(summary(panel).locator('[data-part="position"]')).toHaveText('Cutoff');
  await expect(replay(panel)).toHaveText(`Hand #133 · Replay code ${CODE}`);

  const headingBox = await heading.boundingBox();
  const summaryBox = await summary(panel).boundingBox();
  const entryBox = await panel.locator('li[data-entry]').first().boundingBox();
  if (headingBox === null || summaryBox === null || entryBox === null) {
    throw new Error('Header parts are not laid out');
  }
  expect(summaryBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);
  expect(summaryBox.y + summaryBox.height).toBeLessThanOrEqual(entryBox.y);

  const first = panel.locator('li[data-entry]').first();
  const replaySize = await fontPx(replay(panel));
  expect(replaySize).toBe(12);
  expect(replaySize).toBeLessThan(await fontPx(first.locator('[data-part="moves"]')));
  expect(replaySize).toBeLessThan(await fontPx(first.locator('[data-part="explanation"]')));

  const layout = await panel.evaluate((aside) => {
    const line = aside.querySelector('[data-part="replay"]') as Element;
    return {
      overflow: aside.scrollWidth - aside.clientWidth,
      beyond: line.getBoundingClientRect().right - aside.getBoundingClientRect().right,
    };
  });
  expect(layout.overflow).toBeLessThanOrEqual(0);
  expect(layout.beyond).toBeLessThanOrEqual(0);

  await expectNoSeriousAxeViolations(page);
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});
