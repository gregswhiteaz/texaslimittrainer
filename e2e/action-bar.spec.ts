import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';
/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const IDLE = ['Fold', 'Call', 'Raise'];

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
}

/** Fake timers that only advance through clock.runFor. */
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

/** clock.runFor(1000) in 50 ms slices so each bot timer is scheduled after the previous commit. */
async function runFor1000(page: Page): Promise<void> {
  for (let ms = 0; ms < 1000; ms += 50) await page.clock.runFor(50);
}

interface TimerWindow {
  __pausedTimers?: [typeof setTimeout, typeof clearTimeout];
}

/**
 * Runs in the page: swaps the fake setTimeout/clearTimeout for real ones backed by a Web Worker, which
 * the fake clock does not touch, so axe can run while the app's own pending timers stay paused.
 */
function useWorkerTimers(): void {
  const source =
    'const t = new Map(); onmessage = ({ data: [id, ms] }) => { if (ms === null) { clearTimeout(t.get(id)); t.delete(id); } else t.set(id, setTimeout(() => { t.delete(id); postMessage(id); }, ms)); };';
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  const callbacks = new Map<number, () => void>();
  let next = 1;
  worker.onmessage = ({ data }: MessageEvent<number>) => {
    const callback = callbacks.get(data);
    callbacks.delete(data);
    callback?.();
  };
  (window as TimerWindow).__pausedTimers = [window.setTimeout, window.clearTimeout];
  window.setTimeout = ((callback: (...args: unknown[]) => void, ms = 0, ...args: unknown[]) => {
    const id = next++;
    callbacks.set(id, () => callback(...args));
    worker.postMessage([id, Number(ms) || 0]);
    return id;
  }) as typeof setTimeout;
  window.clearTimeout = ((id: number) => {
    callbacks.delete(id);
    worker.postMessage([id, null]);
  }) as typeof clearTimeout;
}

function restorePausedTimers(): void {
  const timers = (window as TimerWindow).__pausedTimers;
  if (timers) [window.setTimeout, window.clearTimeout] = timers;
}

/** axe needs running timers; under the paused clock it gets worker timers for the duration of the scan. */
async function axeWithPausedClock(page: Page): Promise<void> {
  await page.evaluate(useWorkerTimers);
  try {
    await expectNoSeriousAxeViolations(page);
  } finally {
    await page.evaluate(restorePausedTimers);
  }
}

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const actionButtons = (page: Page) => yourActions(page).getByRole('button');
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

async function buttonTexts(page: Page): Promise<string[]> {
  return actionButtons(page).allTextContents();
}

/** Waits for the user's turn (enabled buttons) or the end of the hand. */
async function nextTurn(page: Page): Promise<'user' | 'done'> {
  await page
    .locator('[aria-label="Your actions"] button:not(:disabled), [role="status"]')
    .first()
    .waitFor();
  return (await handOver(page).count()) > 0 ? 'done' : 'user';
}

async function clickAction(page: Page, name: string | RegExp): Promise<void> {
  const before = await actionCount(page);
  await yourActions(page)
    .getByRole('button', { name, exact: typeof name === 'string' })
    .click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

async function checkOrCall(page: Page): Promise<void> {
  const texts = await buttonTexts(page);
  await clickAction(page, texts.includes('Check') ? 'Check' : /^Call \$\d+$/);
}

async function expectAll(page: Page, state: 'enabled' | 'disabled'): Promise<void> {
  const buttons = await actionButtons(page).all();
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    if (state === 'enabled') await expect(button).toBeEnabled();
    else await expect(button).toBeDisabled();
  }
}

async function forceClickEvery(page: Page): Promise<void> {
  for (const button of await actionButtons(page).all()) await button.click({ force: true });
}

async function expectMinimumSize(page: Page, count: number): Promise<void> {
  const buttons = await actionButtons(page).all();
  expect(buttons).toHaveLength(count);
  for (const button of buttons) {
    const box = await button.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
}

test('my action bar shows exact amounts at each decision', async ({ page }) => {
  await openApp(page);
  const seen: Record<string, string[]> = {};

  while ((await nextTurn(page)) === 'user') {
    const street = (await tableSection(page).getAttribute('data-street')) ?? '';
    await expectAll(page, 'enabled');
    seen[street] ??= await buttonTexts(page);
    await checkOrCall(page);
  }

  expect(seen.preflop).toEqual(['Fold', 'Call $4', 'Raise to $8']);
  expect(seen.flop).toEqual(['Check', 'Bet $4']);
  expect(seen.turn).toEqual(['Check', 'Bet $8']);
});

test('the bar is disabled and submits nothing off-turn or after the hand', async ({
  page,
  browser,
}) => {
  await installPausedClock(page);
  await openApp(page);
  await runFor1000(page);
  await expectToAct(page, '5');
  expect(await actionCount(page)).toBe(4);

  await clickAction(page, 'Call $4');
  expect(await actionCount(page)).toBe(5);
  await expectToAct(page, '6');
  expect(await buttonTexts(page)).toEqual(IDLE);
  await expectAll(page, 'disabled');
  await forceClickEvery(page);
  expect(await actionCount(page)).toBe(5);
  await expectToAct(page, '6');
  expect(await buttonTexts(page)).toEqual(IDLE);

  // Real timers for the finished hand: a fresh context has no fake clock.
  const context = await browser.newContext({
    baseURL: ORIGIN,
    viewport: { width: 1280, height: 720 },
  });
  const real = await context.newPage();
  await openApp(real);
  expect(await nextTurn(real)).toBe('user');
  await clickAction(real, 'Fold');
  await expect(handOver(real)).toBeVisible();
  const finalCount = await actionCount(real);
  expect(await buttonTexts(real)).toEqual(IDLE);
  await expectAll(real, 'disabled');
  await forceClickEvery(real);
  await real.waitForTimeout(500);
  expect(await actionCount(real)).toBe(finalCount);
  await expectToAct(real, '');
  await expectAll(real, 'disabled');
  await context.close();
});

test('single key presses take no action', async ({ page }) => {
  await openApp(page);
  expect(await nextTurn(page)).toBe('user');
  const texts = await buttonTexts(page);
  const count = await actionCount(page);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  for (const key of ['f', 'c', 'r', 'h', 'k', 'b', 'Space']) await page.keyboard.press(key);
  await page.waitForTimeout(500);

  expect(await actionCount(page)).toBe(count);
  await expectToAct(page, '5');
  expect(await buttonTexts(page)).toEqual(texts);
  await expectAll(page, 'enabled');
});

test('every action button is at least 44 by 44 px', async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await installPausedClock(page);
  await openApp(page);
  await runFor1000(page);
  await expect(tableSection(page)).toHaveAttribute('data-street', 'preflop');
  await expectAll(page, 'enabled');
  await expectMinimumSize(page, 3);

  await clickAction(page, 'Call $4');
  await expectAll(page, 'disabled');
  await expectMinimumSize(page, 3);

  await runFor1000(page);
  await expect(tableSection(page)).toHaveAttribute('data-street', 'flop');
  await expectToAct(page, '5');
  await expectAll(page, 'enabled');
  await expectMinimumSize(page, 2);
});

test('action bar is axe clean and makes no outside requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await installPausedClock(page);
  await openApp(page);
  await runFor1000(page);
  await expectAll(page, 'enabled');
  await axeWithPausedClock(page);

  await clickAction(page, 'Call $4');
  await expectAll(page, 'disabled');
  await axeWithPausedClock(page);
  expect(await actionCount(page)).toBe(5);
  await expectToAct(page, '6');

  for (let slice = 0; slice < 400 && (await handOver(page).count()) === 0; slice++) {
    const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
    if ((await enabled.count()) > 0) await checkOrCall(page);
    else await page.clock.runFor(50);
  }
  await expect(handOver(page)).toBeVisible();
  await expectAll(page, 'disabled');
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
