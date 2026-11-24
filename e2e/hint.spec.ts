import { expect, test, type Locator, type Page } from '@playwright/test';
import { axeWithPausedClock, delayWorkerReplies, runUntilMyTurn } from './support/paused-clock';
import { buildTableScenes, openTableScene, stubReplayWords } from './support/table-harness-bundle';

/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const NO_LIMIT_TEXT = /\b(limit|remaining|left|cost|free hints?|\d+\s*(of|\/)\s*\d+\s*hints?)\b/i;

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const hintCard = (page: Page) => page.locator('#hint-card');
const hintToggle = (page: Page) => page.locator('button.hint-toggle');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

/** Paused clock, pinned deal, New game → Start game, then the user's first turn. */
async function startGame(page: Page, replyDelayMs: number | null = null): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  if (replyDelayMs !== null) await page.addInitScript(delayWorkerReplies, replyDelayMs);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(tableSection(page)).toBeVisible();
  await runUntilMyTurn(page);
}

/** Check if offered, else the call, else the first enabled action; waits until it is applied. */
async function checkOrCall(page: Page): Promise<void> {
  const before = await actionCount(page);
  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  const check = enabled.filter({ hasText: /^Check$/ });
  const call = enabled.filter({ hasText: /^Call / });
  const button: Locator =
    (await check.count()) > 0 ? check : (await call.count()) > 0 ? call.first() : enabled.first();
  await button.click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

/** Selects Hint and waits for a ready card with an action and an explanation. */
async function openReadyHint(page: Page): Promise<string> {
  await hintToggle(page).click();
  await expect(hintToggle(page)).toHaveText('Hide hint');
  await expect(hintToggle(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(hintCard(page).locator('[data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
  const explanation = (await hintCard(page)
    .locator('[data-part="hint-explanation"]')
    .textContent()) as string;
  expect(explanation.length).toBeGreaterThan(0);
  return explanation;
}

async function expectNoLimitText(page: Page, explanation: string): Promise<void> {
  const text = (await page.locator('main').innerText()).replace(explanation, '');
  expect(text).not.toMatch(NO_LIMIT_TEXT);
}

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('hint card never covers the action bar on a 10-seat table', async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'ten-seat-hint');
  await expect(page.getByRole('list', { name: 'Seats' }).getByRole('listitem')).toHaveCount(10);
  await expect(hintCard(page)).toBeVisible();
  await expect(hintCard(page).getByRole('listitem')).toHaveCount(9);
  const card = await hintCard(page).boundingBox();
  const bar = await yourActions(page).boundingBox();
  const toggle = await hintToggle(page).boundingBox();
  if (card === null || bar === null || toggle === null) throw new Error('Not laid out');
  for (const other of [bar, toggle]) {
    const overlaps =
      card.x < other.x + other.width &&
      other.x < card.x + card.width &&
      card.y < other.y + other.height &&
      other.y < card.y + card.height;
    expect(overlaps).toBe(false);
  }
  const buttons = await yourActions(page).getByRole('button').all();
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    await expect(button).toBeEnabled();
    await button.click({ trial: true });
  }
  await hintToggle(page).click({ trial: true });
});

test('Hint opens, hides and closes on an action', async ({ page }) => {
  await startGame(page);
  await expect(hintToggle(page)).toHaveText('Hint');
  await expect(hintToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(hintCard(page)).toHaveCount(0);

  await openReadyHint(page);
  await hintToggle(page).click();
  await expect(hintCard(page)).toHaveCount(0);
  await expect(hintToggle(page)).toHaveText('Hint');

  await openReadyHint(page);
  await axeWithPausedClock(page);
  await checkOrCall(page);
  await expect(hintCard(page)).toHaveCount(0);

  await runUntilMyTurn(page);
  await expect(hintCard(page)).toHaveCount(0);
  await expect(hintToggle(page)).toHaveText('Hint');
  await expect(hintToggle(page)).toBeEnabled();
});

test('a hint still computing never blocks the table or reappears after acting', async ({
  page,
}) => {
  const delayMs = 2000;
  await startGame(page, delayMs);
  const asked = Date.now();
  await hintToggle(page).click();
  await expect(hintCard(page)).toContainText('Working out the hint…');
  await expect(hintCard(page)).toHaveAttribute('aria-busy', 'true');

  await checkOrCall(page);
  expect(Date.now() - asked).toBeLessThan(delayMs);
  await expect(hintCard(page)).toHaveCount(0);

  // The delayed hint reply lands in real time; the card must stay closed.
  await page.waitForTimeout(delayMs + 500 - (Date.now() - asked));
  await expect(hintCard(page)).toHaveCount(0);
  await expect(hintToggle(page)).toHaveText('Hint');
});

test('hints are unlimited in the browser', async ({ page }) => {
  await startGame(page);
  for (let decision = 0; decision < 3; decision++) {
    if (decision > 0) await runUntilMyTurn(page);
    const explanation = await openReadyHint(page);
    await expectNoLimitText(page, explanation);
    if (decision === 1) {
      for (let cycle = 0; cycle < 10; cycle++) {
        await hintToggle(page).click();
        await expect(hintCard(page)).toHaveCount(0);
        await expect(hintToggle(page)).toHaveText('Hint');
        await hintToggle(page).click();
        await expect(hintCard(page).locator('[data-part="hint-action"]')).toHaveText(
          /^Recommended: \S/,
        );
        await expectNoLimitText(page, explanation);
      }
    }
    await checkOrCall(page);
  }
});
