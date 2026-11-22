import { expect, test, type Page } from '@playwright/test';
import { buildPaceHarness, openPaceHarness, stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const USER_SEAT = '5';
/** REQ-011.1: at Rapid each bot action shows at most 300 ms after the previous action. */
const RAPID_BUDGET_MS = 300;
/** Every-push bound on fake time per bot action (A-5). */
const FAKE_CAP_MS = 100;
/** REQ-024.3: the pause between a hand's result and the next deal. */
const NEXT_HAND_DELAY_MS = 1500;
const HOUR_MS = 3_600_000;
const SLOW = process.env.TLH_SLOW_TESTS !== '1';
const SLOW_REASON = 'timing check: run npm run e2e:slow';
const CHROMIUM_REASON = 'timing measured in Chromium (A-4)';

interface CountChange {
  count: number;
  /** The seat marked "To act" just before the change ('' if none). */
  toAct: string;
  at: number;
}
interface PaceRecord {
  changes: CountChange[];
  headers: { text: string; at: number }[];
}
interface BotGap {
  hand: number;
  seat: string;
  ms: number;
}

declare global {
  interface Window {
    __pace: PaceRecord;
    __workerPosts: number;
  }
}

/** Init script: records every data-action-count change and every header text change. */
function recordPace(): void {
  const record: PaceRecord = { changes: [], headers: [] };
  window.__pace = record;
  let lastCount: string | null = null;
  let lastToAct = '';
  let header: string | null = null;
  new MutationObserver(() => {
    const now = performance.now();
    const text = document.querySelector('.table-header-line')?.textContent ?? null;
    if (text !== null && text !== header) record.headers.push({ text, at: now });
    header = text;
    const section = document.querySelector('section[aria-label="Table"]');
    if (!section) return;
    const count = section.getAttribute('data-action-count');
    if (count === lastCount) return;
    lastCount = count;
    record.changes.push({ count: Number(count), toAct: lastToAct, at: now });
    lastToAct =
      [...section.querySelectorAll('li[data-seat]')]
        .find((li) => li.textContent?.includes('To act'))
        ?.getAttribute('data-seat') ?? '';
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
}

/** Init script: counts every Worker.postMessage, i.e. every advice request. */
function countWorkerPosts(): void {
  window.__workerPosts = 0;
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (this: Worker, ...args: unknown[]) {
    window.__workerPosts += 1;
    Reflect.apply(post, this, args);
  } as typeof post;
}

/**
 * Bot actions (§5): a count increase whose previous change is in the same hand and left a bot to act.
 * A deal (count drops, or rises from 0) starts a new hand.
 */
function botGaps(changes: readonly CountChange[]): BotGap[] {
  const gaps: BotGap[] = [];
  let hand = 0;
  changes.forEach((change, i) => {
    const previous = changes[i - 1];
    if (previous === undefined) return;
    if (previous.count === 0 || change.count < previous.count) {
      hand += 1;
      return;
    }
    if (change.count > previous.count && change.toAct !== '' && change.toAct !== USER_SEAT) {
      gaps.push({ hand, seat: change.toAct, ms: change.at - previous.at });
    }
  });
  return gaps;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Attaches { samples, max, median } and fails on the first gap over the Rapid budget. */
function expectGapsWithinBudget(gaps: readonly BotGap[], minSamples: number): void {
  const ms = gaps.map((g) => g.ms);
  test.info().annotations.push({
    type: 'bot-action-gaps',
    description: JSON.stringify({ samples: ms.length, max: Math.max(...ms), median: median(ms) }),
  });
  expect(gaps.length).toBeGreaterThanOrEqual(minSamples);
  for (const gap of gaps) {
    expect(
      gap.ms,
      `seat ${gap.seat}, hand ${gap.hand}: ${gap.ms.toFixed(1)} ms`,
    ).toBeLessThanOrEqual(RAPID_BUDGET_MS);
  }
}

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const header = (page: Page) => page.locator('.table-header-line');
const dealNextButton = (page: Page) => page.getByRole('button', { name: 'Deal next hand' });
const workerPosts = (page: Page) => page.evaluate(() => window.__workerPosts);

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

async function openNewGame(page: Page, words: readonly number[] | null): Promise<void> {
  if (words !== null) await page.addInitScript(stubReplayWords, words);
  await page.addInitScript(recordPace);
  await page.addInitScript(countWorkerPosts);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
}

async function startGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(tableSection(page)).toBeVisible();
}

/** Fake timers that only advance through clock.runFor. */
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

/** Waits for the user's turn (enabled buttons) or the end of the hand. */
async function nextTurn(page: Page): Promise<'user' | 'done'> {
  await page
    .locator('[aria-label="Your actions"] button:not(:disabled), [role="status"]')
    .first()
    .waitFor();
  return (await handOver(page).count()) > 0 ? 'done' : 'user';
}

/** Clicks `name` and waits until the click has been applied. */
async function clickAction(page: Page, name: string | RegExp): Promise<void> {
  const before = await actionCount(page);
  await yourActions(page)
    .getByRole('button', { name, exact: typeof name === 'string' })
    .click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

async function checkOrCall(page: Page): Promise<void> {
  const texts = await yourActions(page).getByRole('button').allTextContents();
  await clickAction(page, texts.includes('Check') ? 'Check' : /^Call \$\d+$/);
}

/** The scripted user (A-2): Fold when it is enabled, otherwise Check. */
async function foldElseCheck(page: Page): Promise<void> {
  const fold = yourActions(page).getByRole('button', { name: 'Fold', exact: true });
  await clickAction(page, (await fold.isEnabled()) ? 'Fold' : 'Check');
}

/**
 * From hand `n`'s result to hand n + 1's deal: lets the auto-deal run, or, if the review holds the hand,
 * waits `holdMs` and clicks Deal next hand.
 */
async function toNextHand(page: Page, n: number, holdMs: number): Promise<void> {
  const next = header(page).filter({ hasText: new RegExp(`Hand #${n + 1}$`) });
  await dealNextButton(page).or(next).first().waitFor({ timeout: 10_000 });
  if (await dealNextButton(page).isVisible()) {
    if (holdMs > 0) await page.waitForTimeout(holdMs);
    await dealNextButton(page).click();
  }
  await next.waitFor({ timeout: 10_000 });
}

/**
 * Paused clock: advances fake time 1 ms at a time until the pending bot action shows, never while a worker
 * request is in flight (§5). Returns the fake ms, cap + 1 if the action has not shown after `cap` ms, or null
 * when it is the user's turn or the hand is over and no bot decision has been posted since metering began.
 * The post check comes before the turn check: a reply landing between reads still counts as a bot action.
 */
async function meterBotAction(page: Page, cap: number): Promise<number | null> {
  const before = await actionCount(page);
  const posts = await workerPosts(page);
  for (let fake = 0; ; fake += 1) {
    if ((await actionCount(page)) > before) return fake;
    if ((await workerPosts(page)) > posts) {
      await expect.poll(() => actionCount(page), { timeout: 10_000 }).toBeGreaterThan(before);
      return fake;
    }
    if ((await enabledActions(page).count()) > 0 || (await handOver(page).count()) > 0) return null;
    if (fake > cap) return fake;
    await page.clock.runFor(1);
  }
}

test('each bot action appears on the next tick of a paused clock', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await installPausedClock(page);
  await openNewGame(page, WORDS);
  await startGame(page);
  for (let ms = 0; ms < FAKE_CAP_MS && (await actionCount(page)) === 0; ms++) {
    await page.clock.runFor(1);
  }
  expect(await actionCount(page)).toBeGreaterThan(0);

  const samples: number[] = [];
  for (let guard = 0; guard < 200; guard++) {
    if ((await handOver(page).count()) > 0) break;
    if ((await enabledActions(page).count()) > 0) {
      await checkOrCall(page);
      continue;
    }
    const fake = await meterBotAction(page, FAKE_CAP_MS);
    if (fake !== null) samples.push(fake);
  }

  await expect(handOver(page)).toBeVisible();
  expect(samples.length).toBeGreaterThanOrEqual(5);
  for (const [i, fake] of samples.entries()) {
    expect(fake, `bot action ${i + 1}: ${fake} ms of fake time`).toBeLessThanOrEqual(FAKE_CAP_MS);
  }
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('the paused-clock pace check catches a 400 ms wait', async ({ page }) => {
  await installPausedClock(page);
  await openNewGame(page, WORDS);
  await page.evaluate(() => {
    const fakeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, ms?: number, ...args: unknown[]) =>
      fakeSetTimeout(handler, Number(ms ?? 0) === 0 ? 400 : ms, ...args)) as typeof setTimeout;
  });
  await startGame(page);
  for (let ms = 0; ms < 2000 && (await actionCount(page)) === 0; ms++) {
    await page.clock.runFor(1);
  }
  await expect(header(page)).toHaveText(/Hand #1$/);
  expect(await actionCount(page), 'only the blinds are posted').toBe(2);
  await expect(tableSection(page).locator('li[data-seat="3"]')).toContainText('To act');

  const samples: number[] = [];
  while (samples.length < 2) {
    const fake = await meterBotAction(page, 1000);
    expect(fake, 'a bot is to act').not.toBeNull();
    samples.push(fake ?? 0);
  }
  for (const fake of samples) expect(fake).toBeGreaterThanOrEqual(400);
});

test('each bot action at 6-max shows within 300 ms of the previous action', async ({
  page,
  browserName,
}) => {
  test.skip(SLOW, SLOW_REASON);
  test.skip(browserName !== 'chromium', CHROMIUM_REASON);
  test.setTimeout(180_000);
  await openNewGame(page, WORDS);
  await startGame(page);

  for (let n = 1; n <= 10; n++) {
    while ((await nextTurn(page)) === 'user') await checkOrCall(page);
    if (n < 10) await toNextHand(page, n, 0);
  }

  expectGapsWithinBudget(botGaps(await page.evaluate(() => window.__pace.changes)), 30);
});

test('at 10 players every bot action after the user folds shows within 300 ms', async ({
  page,
  browserName,
}) => {
  test.skip(SLOW, SLOW_REASON);
  test.skip(browserName !== 'chromium', CHROMIUM_REASON);
  test.setTimeout(180_000);
  await page.addInitScript(recordPace);
  await openPaceHarness(page, await buildPaceHarness(), WORDS);
  await expect(header(page)).toHaveText('Cash · 10 players · $4/$8 · Hand #1');

  for (let n = 1; n <= 5; n++) {
    while ((await nextTurn(page)) === 'user') await foldElseCheck(page);
    if (n < 5) await toNextHand(page, n, 0);
  }

  expectGapsWithinBudget(botGaps(await page.evaluate(() => window.__pace.changes)), 9);
});

test('200 rapid hands with a folding user finish in under 60 minutes', async ({
  page,
  browserName,
}) => {
  test.skip(SLOW, SLOW_REASON);
  test.skip(browserName !== 'chromium', CHROMIUM_REASON);
  test.setTimeout(65 * 60_000);
  await openNewGame(page, null);
  await startGame(page);
  await expect(header(page)).toHaveText(/Hand #1$/);

  for (let n = 1; n <= 200; n++) {
    while ((await nextTurn(page)) === 'user') await foldElseCheck(page);
    await toNextHand(page, n, NEXT_HAND_DELAY_MS);
  }

  const headers = await page.evaluate(() => window.__pace.headers);
  const first = headers.find((h) => h.text.endsWith('Hand #1'));
  const last = headers.find((h) => h.text.endsWith('Hand #201'));
  expect(first).toBeDefined();
  expect(last).toBeDefined();
  const elapsedMs = (last?.at ?? Infinity) - (first?.at ?? 0);
  const handsPerHour = (200 * HOUR_MS) / elapsedMs;
  test.info().annotations.push({
    type: 'hands-per-hour',
    description: JSON.stringify({ hands: 200, elapsedMs: Math.round(elapsedMs), handsPerHour }),
  });
  expect(elapsedMs).toBeGreaterThanOrEqual(200 * NEXT_HAND_DELAY_MS);
  expect(elapsedMs).toBeLessThan(HOUR_MS);
  expect(handsPerHour).toBeGreaterThanOrEqual(200);
});
