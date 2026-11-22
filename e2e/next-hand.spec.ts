import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003 (the same deck every hand). */
const WORDS = [0x9e3779b9, 1, 2, 3];

interface ResultRecord {
  /** performance.now() each time a [role="status"] appears. */
  statusAt: number[];
  /** Every .table-header-line text change. */
  headers: { text: string; at: number }[];
}

declare global {
  interface Window {
    __nextHandDraws: number;
    __result: ResultRecord;
  }
}

/** Init script (after stubReplayWords): counts replay-code draws, i.e. 4-word Uint32Array requests. */
function countReplayDraws(): void {
  const stubbed = crypto.getRandomValues.bind(crypto);
  window.__nextHandDraws = 0;
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 4) window.__nextHandDraws += 1;
    return stubbed(array);
  }) as typeof crypto.getRandomValues;
}

/** Init script: records when a result appears and when the header text changes. */
function recordResults(): void {
  const record: ResultRecord = { statusAt: [], headers: [] };
  window.__result = record;
  let hadStatus = false;
  let header: string | null = null;
  new MutationObserver(() => {
    const now = performance.now();
    const hasStatus = document.querySelector('[role="status"]') !== null;
    if (hasStatus && !hadStatus) record.statusAt.push(now);
    hadStatus = hasStatus;
    const text = document.querySelector('.table-header-line')?.textContent ?? null;
    if (text !== null && text !== header) record.headers.push({ text, at: now });
    header = text;
  }).observe(document, { subtree: true, childList: true, characterData: true });
}

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(countReplayDraws);
  await page.addInitScript(recordResults);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
}

/** Fake timers that only advance through clock.runFor. */
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

interface TimerWindow {
  __pausedTimers?: [typeof setTimeout, typeof clearTimeout];
}

/** Runs in the page: real timers from a Web Worker (untouched by the fake clock) for axe. */
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
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const winnerLines = (page: Page) => handOver(page).locator('li[data-seat]');
const header = (page: Page) => page.locator('.table-header-line');
const draws = (page: Page) => page.evaluate(() => window.__nextHandDraws);
const record = (page: Page) => page.evaluate(() => window.__result);

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

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

/**
 * Runs 50 ms slices until `done` holds; returns whether it did. With `max`, at most `max` slices; without,
 * runUntil's fake and real-time bounds (throws past them).
 */
async function slicesUntil(
  page: Page,
  done: () => Promise<boolean>,
  max?: number,
): Promise<boolean> {
  if (max === undefined) return runUntil(page, done);
  for (let slice = 0; slice < max; slice++) {
    if (await done()) return true;
    await page.clock.runFor(50);
  }
  return done();
}

async function slices(page: Page, count: number): Promise<void> {
  for (let slice = 0; slice < count; slice++) await page.clock.runFor(50);
}

/** Folds at the user's first turn, then runs slices until the result appears. */
async function foldToResult(page: Page): Promise<void> {
  expect(await slicesUntil(page, async () => (await enabledActions(page).count()) > 0)).toBe(true);
  await clickAction(page, 'Fold');
  expect(await slicesUntil(page, async () => (await handOver(page).count()) > 0)).toBe(true);
}

/** Face-up card codes inside (true) or outside (false) the result. */
async function faceUpCards(page: Page, inResult: boolean): Promise<string[]> {
  return tableSection(page)
    .locator('svg[data-card]:not([data-card="back"])')
    .evaluateAll(
      (svgs, inside) =>
        svgs
          .filter((s) => (s.closest('[role="status"]') !== null) === inside)
          .map((s) => s.getAttribute('data-card') ?? ''),
      inResult,
    );
}

async function seatStacks(page: Page): Promise<string[]> {
  return page
    .getByRole('list', { name: 'Seats' })
    .locator('li[data-seat]')
    .evaluateAll((lis) =>
      lis
        .sort((a, b) => Number(a.dataset.seat) - Number(b.dataset.seat))
        .map((li) => li.querySelector('[data-part="stack"]')?.textContent ?? ''),
    );
}

async function dealerSeats(page: Page): Promise<string[]> {
  return page
    .getByRole('list', { name: 'Seats' })
    .locator('li[data-seat]:has([data-part="dealer"])')
    .evaluateAll((lis) => lis.map((li) => li.getAttribute('data-seat') ?? ''));
}

/** From the result just shown: 28 slices with no deal, then the next deal within 4 more slices. */
async function expectNextDeal(page: Page, handNumber: number): Promise<void> {
  const statusAt = (await record(page)).statusAt.at(-1) as number;
  const count = await actionCount(page);
  const drawn = await draws(page);
  await slices(page, 28);
  await expect(header(page)).toHaveText(new RegExp(`Hand #${handNumber - 1}$`));
  await expect(handOver(page)).toBeVisible();
  expect(await actionCount(page)).toBe(count);
  expect(await draws(page)).toBe(drawn);

  const next = `Cash · 6 players · $4/$8 · Hand #${handNumber}`;
  expect(await slicesUntil(page, async () => (await header(page).textContent()) === next, 4)).toBe(
    true,
  );
  const dealtAt = (await record(page)).headers.at(-1);
  expect(dealtAt?.text).toBe(next);
  const gap = (dealtAt?.at ?? Infinity) - statusAt;
  expect(gap).toBeGreaterThanOrEqual(1400);
  expect(gap).toBeLessThanOrEqual(1600);
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(await draws(page)).toBe(drawn + 1);
}

test('the result shows the winner, amount and hand name, and nothing of an uncontested winner', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await installPausedClock(page);
  await openApp(page);

  await runUntil(page, async () => {
    if ((await enabledActions(page).count()) > 0) await checkOrCall(page);
    return (await handOver(page).count()) > 0;
  });
  await expect(handOver(page)).toBeVisible();
  await expect(tableSection(page)).toHaveAttribute('data-street', 'showdown');
  await expect(winnerLines(page)).toHaveCount(1);
  await expect(winnerLines(page)).toHaveText('Ben wins $10 · Two pair, eights and threes');
  expect(await faceUpCards(page, true)).toEqual(['3h', '8h']);
  await expect(handOver(page).getByRole('group', { name: "Ben's cards" })).toBeVisible();
  expect((await faceUpCards(page, false)).sort()).toEqual(
    ['4c', 'Qd', 'Jd', '6h', '9h', '3c', '8s'].sort(),
  );
  await axeWithPausedClock(page);

  const fresh = await page.context().newPage();
  fresh.on('request', (request) => requests.push(request.url()));
  await installPausedClock(fresh);
  await openApp(fresh);
  await foldToResult(fresh);
  await expect(winnerLines(fresh)).toHaveCount(1);
  await expect(winnerLines(fresh)).toHaveText('Ava wins $8');
  await expect(handOver(fresh)).not.toContainText(' · ');
  await expect(handOver(fresh).locator('svg')).toHaveCount(0);
  await axeWithPausedClock(fresh);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('the next hand is dealt 1.5 s after the result with stacks carried and the button moved', async ({
  page,
}) => {
  await installPausedClock(page);
  await openApp(page);
  await foldToResult(page);
  await expect(winnerLines(page)).toHaveText('Ava wins $8');
  expect(await draws(page)).toBe(1);

  await expectNextDeal(page, 2);
  expect(await actionCount(page)).toBe(2);
  expect(await dealerSeats(page)).toEqual(['1']);
  expect(await seatStacks(page)).toEqual(['$164', '$154', '$156', '$160', '$160', '$160']);
  expect(await draws(page)).toBe(2);

  await foldToResult(page);
  await expect(winnerLines(page)).toHaveText('Ben wins $8');
  await expectNextDeal(page, 3);
  expect(await dealerSeats(page)).toEqual(['2']);
  expect(await seatStacks(page)).toEqual(['$164', '$160', '$154', '$156', '$160', '$160']);
  await expectToAct(page, '5');
});

test('leaving during the result deals no further hand', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);
  await foldToResult(page);
  expect(await draws(page)).toBe(1);

  await slices(page, 10);
  await expect(handOver(page)).toBeVisible();
  await page.getByRole('button', { name: 'Leave table' }).click();

  const home = page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
  await expect(home).toBeFocused();
  await expect(tableSection(page)).toHaveCount(0);
  await slices(page, 60);
  expect(await draws(page)).toBe(1);
  await expect(tableSection(page)).toHaveCount(0);
});
