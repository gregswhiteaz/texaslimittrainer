import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { runUntil, runUntilMyTurn } from './support/paused-clock';
import { buildTableScenes, openTableScene, stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const CODE = '9e3779b9000000010000000200000003';
const RED = 'rgb(215, 38, 46)';

declare global {
  interface Window {
    __tableDisplayDraws: number;
  }
}

/** Init script (after stubReplayWords): counts replay-code draws, i.e. 4-word Uint32Array requests. */
function countReplayDraws(): void {
  const stubbed = crypto.getRandomValues.bind(crypto);
  window.__tableDisplayDraws = 0;
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 4) window.__tableDisplayDraws += 1;
    return stubbed(array);
  }) as typeof crypto.getRandomValues;
}

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(countReplayDraws);
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
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const seat = (page: Page, n: number) => page.locator(`li[data-seat="${n}"]`);
const seatItems = (page: Page) => page.getByRole('list', { name: 'Seats' }).getByRole('listitem');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
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
  const texts = await yourActions(page).getByRole('button').allTextContents();
  await clickAction(page, texts.includes('Check') ? 'Check' : /^Call \$\d+$/);
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

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('my seat is drawn at the bottom centre whatever its seat number', async ({ page }) => {
  for (const [scene, userSeat] of [
    ['flop-bet', '5'],
    ['seat-1', '1'],
  ] as const) {
    await openTableScene(page, scenes, scene);
    const user = page.locator('li[data-user]');
    await expect(user).toHaveAttribute('data-seat', userSeat);
    const felt = await box(page.locator('.table-felt'));
    const mine = await box(user);
    expect(Math.abs(mine.x + mine.width / 2 - (felt.x + felt.width / 2))).toBeLessThanOrEqual(2);
    const others = page.locator('li[data-seat]:not([data-user])');
    expect(await others.count()).toBe(5);
    for (const other of await others.all()) {
      const theirs = await box(other);
      expect(theirs.y + theirs.height).toBeLessThan(mine.y + mine.height);
    }
    if (scene === 'flop-bet') {
      await expect(user).toContainText('Cutoff');
      await expect(user.locator('[data-part="stack"]')).toHaveText('$184');
      await expect(user.getByRole('img', { name: 'Ace of hearts' })).toBeVisible();
      await expect(user.getByRole('img', { name: 'Nine of spades' })).toBeVisible();
      await expect(user.getByRole('img')).toHaveCount(2);
    }
  }
});

test('the seat to act is highlighted in red and labelled', async ({ page }) => {
  await openTableScene(page, scenes, 'flop-bet');
  const user = page.locator('li[data-user]');
  const border = (locator: Locator) =>
    locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return { colour: style.borderTopColor, width: style.borderTopWidth };
    });
  expect(await border(user)).toEqual({ colour: RED, width: '2px' });
  for (const other of await page.locator('li[data-seat]:not([data-user])').all()) {
    expect((await border(other)).colour).not.toBe(RED);
  }
  await expect(user.getByText('To act', { exact: true })).toBeVisible();
  await expectToAct(page, '5');
});

test('the header shows the session and Leave table returns to Home', async ({ page }) => {
  await openApp(page);
  expect(await nextTurn(page)).toBe('user');
  await expect(page.locator('.table-header-line')).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  expect(await page.evaluate(() => window.__tableDisplayDraws)).toBe(1);

  await page.getByRole('button', { name: 'Leave table' }).click();

  const home = page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
  await expect(home).toBeVisible();
  await expect(home).toBeFocused();
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
  await expect(tableSection(page)).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__tableDisplayDraws)).toBe(1);
  await expect(tableSection(page)).toHaveCount(0);
});

test('the replay code is not in the page text, attributes or accessible names during the hand', async ({
  page,
}) => {
  await openApp(page);
  const streets = new Set<string>();
  while ((await nextTurn(page)) === 'user') {
    streets.add((await tableSection(page).getAttribute('data-street')) ?? '');
    const sources = [
      await page.content(),
      await page.evaluate(() => document.title),
      await page.locator('body').ariaSnapshot(),
    ];
    for (const source of sources) {
      expect(source.toLowerCase()).not.toContain(CODE);
      expect(source.toLowerCase()).not.toContain('9e3779b9');
    }
    await checkOrCall(page);
  }
  expect([...streets].sort()).toEqual(['flop', 'preflop', 'river', 'turn']);
});

test("a bot's card back marker is small, shows the logo and passes axe", async ({ page }) => {
  await openTableScene(page, scenes, 'flop-bet');
  const back = seat(page, 2).getByRole('img', { name: 'Face-down card' });
  await expect(back).toHaveCount(1);
  const backBox = await box(back);
  expect(Math.abs(backBox.width - 30)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(backBox.height - 42)).toBeLessThanOrEqual(0.5);
  expect(backBox.width).toBeLessThan(60);
  expect(backBox.height).toBeLessThan(84);

  const logo = back.locator('image[data-part="logo"]');
  const logoBox = await box(logo);
  expect(logoBox.width).toBeGreaterThanOrEqual(24);
  expect(logoBox.height).toBeGreaterThanOrEqual(24);
  expect(logoBox.x).toBeGreaterThanOrEqual(backBox.x);
  expect(logoBox.y).toBeGreaterThanOrEqual(backBox.y);
  expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(backBox.x + backBox.width);
  expect(logoBox.y + logoBox.height).toBeLessThanOrEqual(backBox.y + backBox.height);
  const decoded = await logo.evaluate(async (node) => {
    const probe = new Image();
    probe.src = node.getAttribute('href') ?? '';
    await probe.decode();
    return { width: probe.naturalWidth, height: probe.naturalHeight };
  });
  expect(decoded).toEqual({ width: 512, height: 512 });
  await expectNoSeriousAxeViolations(page);
});

test('last actions and the player to act are visible text', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);
  await runUntilMyTurn(page);
  await expect(yourActions(page).getByRole('button', { name: 'Call $4' })).toBeEnabled();

  for (const n of [3, 4]) await expect(seat(page, n).getByText('Folded')).toBeVisible();
  await expect(seat(page, 1).getByText('Small blind $2', { exact: true })).toBeVisible();
  await expect(seat(page, 2).getByText('Big blind $4', { exact: true })).toBeVisible();
  await expectToAct(page, '5');
  expect(await tableSection(page).getAttribute('data-to-act')).toBeNull();

  await clickAction(page, 'Call $4');
  await expect(seat(page, 5).getByText('Called $4', { exact: true })).toBeVisible();
  await expect(seat(page, 5).getByText('This street $4', { exact: true })).toBeVisible();
  await expectToAct(page, '6');
});

test('the table fits 1280 wide, is axe clean and makes only same-origin requests', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await installPausedClock(page);
  await openApp(page);
  await runUntilMyTurn(page);
  await expect(yourActions(page).getByRole('button', { name: 'Call $4' })).toBeEnabled();
  await expectSeatsFit(page);
  await axeWithPausedClock(page);

  await clickAction(page, 'Call $4');
  await expectToAct(page, '6');
  await expectSeatsFit(page);
  await axeWithPausedClock(page);

  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  await runUntil(page, async () => {
    if ((await enabled.count()) > 0) await checkOrCall(page);
    return (await handOver(page).count()) > 0;
  });
  await expect(handOver(page)).toBeVisible();
  await expectToAct(page, '');
  await expectSeatsFit(page);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
