import { expect, test, type Page } from '@playwright/test';
import { replayCodeFromWords, type ReplayCode } from '../src/engine/deck';
import type { Action, SeatNumber } from '../src/engine/hand';
import type { SeatPolicy } from '../src/engine/player-view';
import { seededTagPolicy } from '../src/playtest/policy';
import { playHand, toAction } from '../src/playtest/runner';
import type { CompletedHand } from '../src/table/session';
import { expectNoSeriousAxeViolations } from './support/axe';
import {
  buildAdviceHarness,
  openAdviceHarness,
  type AdviceWindow,
} from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words (A-11): 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const USER_SEAT = 5;
const SLOW = process.env.TLH_SLOW_TESTS !== '1';
const SLOW_REASON = 'timing check: run npm run e2e:slow';

let bundle: Promise<string> | null = null;
/** The advice harness, built once per Playwright worker. */
function adviceBundle(): Promise<string> {
  bundle ??= buildAdviceHarness();
  return bundle;
}

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });

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

/** Clicks `name` and waits until the click has been applied. */
async function clickAction(page: Page, name: string): Promise<void> {
  const before = await actionCount(page);
  await yourActions(page).getByRole('button', { name, exact: true }).click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

async function checkOrCall(page: Page): Promise<void> {
  const check = yourActions(page).getByRole('button', { name: 'Check', exact: true });
  const call = yourActions(page).getByRole('button', { name: /^Call \$\d+$/ });
  await clickAction(page, (await check.count()) > 0 ? 'Check' : ((await call.textContent()) ?? ''));
}

/** Checks or calls at every turn until the current hand ends. */
async function playToEnd(page: Page): Promise<void> {
  while ((await nextTurn(page)) === 'user') await checkOrCall(page);
}

/** The finished hands and bot request windows, read together. */
async function record(page: Page): Promise<{ hands: CompletedHand[]; windows: AdviceWindow[] }> {
  return page.evaluate(() => ({
    hands: window.__tlhAdvice.hands as CompletedHand[],
    windows: window.__tlhAdvice.windows,
  }));
}

/** A hand's actions without the blinds, as Actions. */
const playerActions = (hand: CompletedHand): Action[] =>
  hand.actions.filter((a) => a.type !== 'small-blind' && a.type !== 'big-blind').map(toAction);

const overlaps = (start: number, duration: number, w: AdviceWindow): boolean =>
  w.end !== null && start < w.end && start + duration > w.start;

const inWindow = (at: number, windows: readonly AdviceWindow[]): boolean =>
  windows.some((w) => w.end !== null && w.start <= at && at < w.end);

test('slow bot decisions never block the main thread for more than 100 ms', async ({
  page,
  browserName,
}) => {
  test.skip(SLOW, SLOW_REASON);
  test.skip(browserName !== 'chromium', 'WebKit has no Long Tasks API');
  test.setTimeout(120_000);
  await openAdviceHarness(page, await adviceBundle(), WORDS, 300);
  expect(await page.evaluate(() => PerformanceObserver.supportedEntryTypes)).toContain('longtask');

  await playToEnd(page);
  const { windows } = await record(page);
  const longTasks = await page.evaluate(() => window.__tlhAdvice.longTasks);
  expect(windows.some((w) => w.street !== 'preflop')).toBe(true);
  for (const w of windows) {
    expect(w.end).not.toBeNull();
    expect((w.end ?? 0) - w.start).toBeGreaterThanOrEqual(300);
  }
  const blocking = longTasks.filter(
    (t) => t.duration > 100 && windows.some((w) => overlaps(t.start, t.duration, w)),
  );
  expect(blocking).toEqual([]);

  // Sanity: the observer is live, so a 200 ms busy loop is recorded. It runs in a page task, since
  // a script evaluated through the DevTools protocol is not reported as a long task.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          const start = performance.now();
          while (performance.now() - start < 200) {
            /* spin */
          }
          resolve();
        }, 0),
      ),
  );
  await expect
    .poll(() =>
      page.evaluate(() => Math.max(0, ...window.__tlhAdvice.longTasks.map((t) => t.duration))),
    )
    .toBeGreaterThanOrEqual(150);
});

test('p95 frame time during bot computation is at most 100 ms over 200 samples', async ({
  page,
  browserName,
}) => {
  test.skip(SLOW, SLOW_REASON);
  test.skip(browserName !== 'chromium', 'p95 frame time is measured in Chromium (A-2)');
  test.setTimeout(240_000);
  await openAdviceHarness(page, await adviceBundle(), WORDS, 300);

  /** One sample per rAF interval that starts inside a computation window (A-6). */
  const samples = async (): Promise<number[]> => {
    const { windows } = await record(page);
    const frames = await page.evaluate(() => window.__tlhAdvice.frames);
    return frames.flatMap((at, i) => {
      const next = frames[i + 1];
      return next !== undefined && inWindow(at, windows) ? [next - at] : [];
    });
  };

  for (let hand = 1; hand <= 6; hand++) {
    await playToEnd(page);
    if ((await samples()).length >= 200) break;
    if (hand < 6) {
      const done = hand;
      await expect.poll(async () => (await record(page)).hands.length).toBe(done);
      await page.getByRole('button', { name: 'Deal next hand' }).click();
      await expect(handOver(page)).toHaveCount(0);
    }
  }

  const durations = (await samples()).sort((a, b) => a - b);
  const p95 = durations[Math.ceil(0.95 * durations.length) - 1] ?? Infinity;
  const max = durations[durations.length - 1] ?? Infinity;
  test.info().annotations.push({
    type: 'frame-times',
    description: JSON.stringify({ samples: durations.length, p95, max }),
  });
  expect(durations.length).toBeGreaterThanOrEqual(200);
  expect(p95).toBeLessThanOrEqual(100);
});

test('hovering a seat and resizing repaint within 100 ms while a bot decides', async ({ page }) => {
  test.skip(SLOW, SLOW_REASON);
  test.setTimeout(60_000);
  await openAdviceHarness(page, await adviceBundle(), WORDS, 1000);

  await page.waitForFunction(() => window.__tlhAdvice.computing);
  const before = await actionCount(page);
  const current = (await record(page)).windows.length - 1;
  await page.locator('li[data-seat="1"]').hover();
  await page.setViewportSize({ width: 1100, height: 700 });

  await page.waitForFunction((i) => window.__tlhAdvice.windows[i]?.end !== null, current);
  await expect
    .poll(() => page.evaluate(() => window.__tlhAdvice.events.every((e) => e.repaint !== null)))
    .toBe(true);
  const { windows } = await record(page);
  const events = await page.evaluate(() => window.__tlhAdvice.events);
  for (const type of ['pointerover', 'resize'] as const) {
    const matching = events.filter((e) => e.type === type);
    expect(matching.length, type).toBeGreaterThan(0);
    for (const e of matching) {
      expect(inWindow(e.at, windows), `${type} at ${e.at}`).toBe(true);
      expect((e.repaint ?? Infinity) - e.at, `${type} repaint`).toBeLessThanOrEqual(100);
    }
  }

  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
  await expectNoSeriousAxeViolations(page);
});

test('bot actions computed in the worker match the headless playtest', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openAdviceHarness(page, await adviceBundle(), WORDS, 0);

  await playToEnd(page);
  await expect.poll(async () => (await record(page)).hands.length).toBeGreaterThanOrEqual(1);
  const hand = (await record(page)).hands[0] as CompletedHand;
  const code = replayCodeFromWords(WORDS);
  expect(hand.replayCode).toBe(code);

  const actions = playerActions(hand);
  const userActions = actions.filter((a) => a.seat === USER_SEAT);
  let next = 0;
  const replayUser: SeatPolicy = () => userActions[next++] as Action;
  const makePolicy = (c: ReplayCode, seat: SeatNumber): SeatPolicy =>
    seat === USER_SEAT ? replayUser : seededTagPolicy(c);
  expect(actions).toEqual(playHand(code, 6, 6, 1, { makePolicy }).record.actions);
  expect(hand.actions.some((a) => a.seat !== USER_SEAT && a.street !== 'preflop')).toBe(true);

  expect(requests.length).toBeGreaterThan(0);
  for (const url of requests) expect(new URL(url).origin, url).toBe(ORIGIN);
});

test('every bot decision is served by the advice worker', async ({ page }) => {
  await openAdviceHarness(page, await adviceBundle(), WORDS, 0);

  await playToEnd(page);
  await expect.poll(async () => (await record(page)).hands.length).toBeGreaterThanOrEqual(1);
  const { hands, windows } = await record(page);
  const bots = playerActions(hands[0] as CompletedHand).filter((a) => a.seat !== USER_SEAT);
  // Read as soon as the hand ends: the next hand is dealt NEXT_HAND_DELAY_MS later at the earliest.
  expect(bots.length).toBeGreaterThan(0);
  expect(windows).toHaveLength(bots.length);
  bots.forEach((action, i) => {
    const w = windows[i] as AdviceWindow;
    expect(w.seat, `window ${i}`).toBe(action.seat);
    expect(w.reply, `window ${i}`).toEqual(action);
    expect(w.end, `window ${i}`).not.toBeNull();
  });
});
