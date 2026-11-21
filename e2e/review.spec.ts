import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

// Helpers copied from next-hand.spec.ts and table-display.spec.ts; TASK-3.16 moves them into e2e/support.

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
/** Dealt with the button on seat 3, every bot folds to the user's big blind (A-8). */
const WALK_WORDS = [0x9e3779b9, 1, 2, 7];
const HEADER = 'Cash · 6 players · $4/$8 · Hand #';

interface ResultRecord {
  /** performance.now() each time a [role="status"] appears. */
  statusAt: number[];
  /** Every .table-header-line text change. */
  headers: { text: string; at: number }[];
}

declare global {
  interface Window {
    __reviewDraws: number;
    __reviewResult: ResultRecord;
  }
}

/**
 * Init script: the n-th replay-code draw (4-word Uint32Array request) gets sequence[n], the last entry once
 * the sequence runs out; draws are counted. Other requests use the real generator.
 */
function pinReplayCodes(sequence: readonly (readonly number[])[]): void {
  const original = crypto.getRandomValues.bind(crypto);
  window.__reviewDraws = 0;
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 4) {
      const words = sequence[Math.min(window.__reviewDraws, sequence.length - 1)] ?? [];
      window.__reviewDraws += 1;
      array.set(words);
      return array;
    }
    return original(array);
  }) as typeof crypto.getRandomValues;
}

/** Init script: records when a result appears and when the header text changes. */
function recordResults(): void {
  const record: ResultRecord = { statusAt: [], headers: [] };
  window.__reviewResult = record;
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

async function openApp(page: Page, sequence: readonly (readonly number[])[]): Promise<void> {
  await page.addInitScript(pinReplayCodes, sequence);
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
const seatItems = (page: Page) =>
  page.getByRole('list', { name: 'Seats' }).locator('li[data-seat]');
const reviewPanel = (page: Page) => page.getByRole('complementary');
const dealNextButton = (page: Page) => page.getByRole('button', { name: 'Deal next hand' });
const draws = (page: Page) => page.evaluate(() => window.__reviewDraws);
const record = (page: Page) => page.evaluate(() => window.__reviewResult);

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

/** Runs 50 ms slices, at most `max`, until `done` holds; returns whether it did. */
async function slicesUntil(page: Page, done: () => Promise<boolean>, max = 400): Promise<boolean> {
  for (let slice = 0; slice < max; slice++) {
    if (await done()) return true;
    await page.clock.runFor(50);
  }
  return done();
}

async function slices(page: Page, count: number): Promise<void> {
  for (let slice = 0; slice < count; slice++) await page.clock.runFor(50);
}

/** Checks or calls every turn until the result appears. */
async function checkOrCallToResult(page: Page): Promise<void> {
  for (let slice = 0; slice < 400 && (await handOver(page).count()) === 0; slice++) {
    if ((await enabledActions(page).count()) > 0) await checkOrCall(page);
    else await page.clock.runFor(50);
  }
  await expect(handOver(page)).toBeVisible();
}

async function seatStacks(page: Page): Promise<string[]> {
  return seatItems(page).evaluateAll((lis) =>
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
  const drawn = await draws(page);
  await slices(page, 28);
  await expect(header(page)).toHaveText(`${HEADER}${handNumber - 1}`);
  await expect(handOver(page)).toBeVisible();
  expect(await draws(page)).toBe(drawn);

  const next = `${HEADER}${handNumber}`;
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

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (rect === null) throw new Error('Element is not rendered');
  return rect;
}

/** No horizontal scroll, every seat inside x ∈ [0, 1280] and no two seats overlapping. */
async function expectSeatsFit(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const boxes = await seatItems(page).evaluateAll((lis) =>
    lis.map((li) => {
      const r = li.getBoundingClientRect();
      return { seat: li.getAttribute('data-seat'), x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  expect(boxes).toHaveLength(6);
  for (const [i, a] of boxes.entries()) {
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.x + a.w).toBeLessThanOrEqual(1280);
    for (const b of boxes.slice(i + 1)) {
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      expect(apart, `seats ${a.seat} and ${b.seat} overlap`).toBe(true);
    }
  }
}

async function expectNoReview(page: Page): Promise<void> {
  await expect(reviewPanel(page)).toHaveCount(0);
  await expect(dealNextButton(page)).toHaveCount(0);
}

interface EntryText {
  street: string;
  cards: string[];
  you: string;
  advice: string;
  grade: string;
}

async function entries(page: Page): Promise<EntryText[]> {
  return reviewPanel(page)
    .getByRole('list', { name: 'Decisions' })
    .locator('li[data-entry]')
    .evaluateAll((lis) =>
      lis.map((li) => {
        const part = (name: string): string =>
          li.querySelector(`[data-part="${name}"]`)?.textContent ?? '';
        return {
          street: part('street'),
          cards: [...li.querySelectorAll('svg[data-card]')].map(
            (svg) => svg.getAttribute('data-card') ?? '',
          ),
          you: part('you'),
          advice: part('advice'),
          grade: part('grade'),
        };
      }),
    );
}

/** The pinned check/call hand of the spec (§5). */
const PINNED_ENTRIES: EntryText[] = [
  { street: 'Preflop', cards: [], you: 'Call $4', advice: 'Fold', grade: 'Major error' },
  { street: 'Flop', cards: ['Jd', '6h', '9h'], you: 'Check', advice: 'Check', grade: 'Correct' },
  {
    street: 'Turn',
    cards: ['Jd', '6h', '9h', '3c'],
    you: 'Check',
    advice: 'Check',
    grade: 'Correct',
  },
  {
    street: 'River',
    cards: ['Jd', '6h', '9h', '3c', '8s'],
    you: 'Check',
    advice: 'Check',
    grade: 'Correct',
  },
];

test('a preflop fold or a big-blind walk opens no review and the next hand deals after 1.5 s', async ({
  page,
}) => {
  await installPausedClock(page);
  await openApp(page, [WORDS, WORDS, WORDS, WALK_WORDS]);

  for (const handNumber of [1, 2, 3]) {
    await expect(header(page)).toHaveText(`${HEADER}${handNumber}`);
    expect(await slicesUntil(page, async () => (await enabledActions(page).count()) > 0)).toBe(
      true,
    );
    await clickAction(page, 'Fold');
    expect(await slicesUntil(page, async () => (await handOver(page).count()) > 0)).toBe(true);
    await expectNoReview(page);
    await expectNextDeal(page, handNumber + 1);
  }

  await expect(header(page)).toHaveText(`${HEADER}4`);
  expect(await dealerSeats(page)).toEqual(['3']);
  for (let slice = 0; slice < 400 && (await handOver(page).count()) === 0; slice++) {
    expect(await enabledActions(page).count()).toBe(0);
    await page.clock.runFor(50);
  }
  await expect(winnerLines(page)).toHaveText('You win $4');
  await expectNoReview(page);
  await expectNextDeal(page, 5);
  expect(await draws(page)).toBe(5);
});

test('after a played hand the review opens beside the table, holds the next hand and Deal next hand deals hand 2', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await installPausedClock(page);
  await openApp(page, [WORDS]);
  await checkOrCallToResult(page);
  await expect(winnerLines(page)).toContainText('Ben wins $10');

  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Hand #1 review' })).toBeFocused();
  expect(await entries(page)).toEqual(PINNED_ENTRIES);

  const badges = panel.locator('[data-part="grade"]');
  const backgrounds = await badges.evaluateAll((spans) =>
    spans.map((s) => getComputedStyle(s).backgroundColor),
  );
  expect(backgrounds).toEqual([
    'rgb(163, 21, 28)',
    'rgb(47, 111, 224)',
    'rgb(47, 111, 224)',
    'rgb(47, 111, 224)',
  ]);
  for (const badge of await badges.all()) await expect(badge).toBeVisible();

  const panelBox = await box(panel);
  const tableBox = await box(tableSection(page));
  expect(panelBox.x).toBeGreaterThanOrEqual(tableBox.x + tableBox.width);
  expect(panelBox.y).toBeLessThan(tableBox.y + tableBox.height);
  expect(tableBox.y).toBeLessThan(panelBox.y + panelBox.height);
  await expectSeatsFit(page);
  await axeWithPausedClock(page);

  await slices(page, 200);
  await expect(header(page)).toHaveText(`${HEADER}1`);
  await expect(handOver(page)).toBeVisible();
  expect(await draws(page)).toBe(1);

  await dealNextButton(page).click();
  await expect(reviewPanel(page)).toHaveCount(0);
  await expect(dealNextButton(page)).toHaveCount(0);
  await expect(header(page)).toHaveText(`${HEADER}2`);
  expect(await draws(page)).toBe(2);
  expect(await dealerSeats(page)).toEqual(['1']);
  expect(await seatStacks(page)).toEqual(['$158', '$164', '$156', '$160', '$156', '$160']);
  await expect(page.getByRole('status')).toHaveCount(0);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('Close keeps the result and Deal next hand and nothing is dealt until it is clicked', async ({
  page,
}) => {
  await installPausedClock(page);
  await openApp(page, [WORDS]);
  await checkOrCallToResult(page);
  await expect(reviewPanel(page)).toBeVisible();

  await page.getByRole('button', { name: 'Close review' }).click();
  await expect(reviewPanel(page)).toHaveCount(0);
  await expect(handOver(page)).toBeVisible();
  await expect(dealNextButton(page)).toBeVisible();
  await expect(dealNextButton(page)).toBeFocused();
  const size = await box(dealNextButton(page));
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);

  await slices(page, 200);
  await expect(header(page)).toHaveText(`${HEADER}1`);
  await expect(handOver(page)).toBeVisible();
  expect(await draws(page)).toBe(1);

  await dealNextButton(page).click();
  await expect(header(page)).toHaveText(`${HEADER}2`);
  expect(await draws(page)).toBe(2);
  await expect(dealNextButton(page)).toHaveCount(0);
});
