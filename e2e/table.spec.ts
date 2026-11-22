import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import {
  buildTableHarness,
  openTableHarness,
  stubReplayWords,
} from './support/table-harness-bundle';
import { runUntilMyTurn } from './support/paused-clock';
import { expectToAct } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words for every test (A-11): 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const NAMES = ['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'You'];
/** The idle (disabled) set plus the exact-amount labels (TASK-3.2 D-4). */
const BUTTON_NAME = /^(Fold|Check|Call|Raise|Call \$\d+|Bet \$\d+|Raise to \$\d+|Leave table)$/;
const BOARD_BY_STREET: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

interface CountChange {
  count: number;
  toAct: string;
  at: number;
}
interface TableRecord {
  changes: CountChange[];
  /** performance.now() each time an enabled button appears in "Your actions". */
  turns: number[];
}

declare global {
  interface Window {
    __table: TableRecord;
  }
}

/** Init script: records every data-action-count change and every new user turn. */
function recordTable(): void {
  const record: TableRecord = { changes: [], turns: [] };
  window.__table = record;
  let lastCount: string | null = null;
  let hadButtons = false;
  new MutationObserver(() => {
    const section = document.querySelector('section[aria-label="Table"]');
    if (!section) return;
    const now = performance.now();
    const count = section.getAttribute('data-action-count');
    if (count !== lastCount) {
      lastCount = count;
      record.changes.push({
        count: Number(count),
        toAct:
          [...section.querySelectorAll('li[data-seat]')]
            .find((li) => li.textContent?.includes('To act'))
            ?.getAttribute('data-seat') ?? '',
        at: now,
      });
    }
    const enabled =
      section.querySelector('[aria-label="Your actions"] button:not(:disabled)') !== null;
    if (enabled && !hadButtons) record.turns.push(now);
    hadButtons = enabled;
  }).observe(document, { subtree: true, childList: true, attributes: true });
}

/** Fake timers that only advance through clock.runFor (no timer runs until then). */
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

/**
 * clock.runFor(1000) in 50 ms slices: React commits in a real (unfaked) task, so each bot timer is
 * scheduled only after the previous slice returns.
 */
async function runFor1000(page: Page): Promise<void> {
  for (let ms = 0; ms < 1000; ms += 50) await page.clock.runFor(50);
}

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(recordTable);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
}

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const stackOf = (page: Page, seat: number) =>
  page.locator(`li[data-seat="${seat}"] [data-part="stack"]`);

async function seatRows(page: Page) {
  const items = page.getByRole('list', { name: 'Seats' }).getByRole('listitem');
  return items.evaluateAll((lis) =>
    lis.map((li) => ({
      name: li.querySelector('[data-part="name"]')?.textContent ?? '',
      stack: li.querySelector('[data-part="stack"]')?.textContent ?? '',
    })),
  );
}

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

async function userCards(page: Page): Promise<string[]> {
  return page
    .locator('li[data-user] svg[data-card]')
    .evaluateAll((cards) => cards.map((c) => c.getAttribute('data-card') ?? ''));
}

/** Waits for the user's turn (enabled buttons) or the end of the hand. */
async function nextTurn(page: Page): Promise<'user' | 'done'> {
  await page
    .locator('[aria-label="Your actions"] button:not(:disabled), [role="status"]')
    .first()
    .waitFor();
  return (await handOver(page).count()) > 0 ? 'done' : 'user';
}

/** Under the paused clock: runs 50 ms slices until the user's turn (enabled buttons) or the end of the hand. */
async function nextTurnPaused(page: Page): Promise<'user' | 'done' | 'timeout'> {
  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  for (let slice = 0; slice < 400; slice++) {
    if ((await enabled.count()) > 0) return 'user';
    if ((await handOver(page).count()) > 0) return 'done';
    await page.clock.runFor(50);
  }
  return 'timeout';
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

/** The bar stays on screen with every button disabled (TASK-3.2 D-3/D-4). */
async function expectDisabledBar(page: Page): Promise<void> {
  await expect(yourActions(page)).toBeVisible();
  const buttons = yourActions(page).getByRole('button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) await expect(button).toBeDisabled();
}

async function expectNoBuyInControl(page: Page): Promise<void> {
  await expect(page.locator('input, select, textarea, a')).toHaveCount(0);
  const names = await page.getByRole('button').allTextContents();
  for (const name of names) expect(name).toMatch(BUTTON_NAME);
}

test('default table seats the user and five bots with $160 each', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);

  await expect(tableSection(page)).toBeVisible();
  expect(await seatRows(page)).toEqual(NAMES.map((name) => ({ name, stack: '$160' })));
  expect(await actionCount(page)).toBe(0);

  await runFor1000(page);
  await expect(stackOf(page, 1)).toHaveText('$158');
  await expect(stackOf(page, 2)).toHaveText('$156');
  await expect(yourActions(page)).toBeVisible();
});

test('stake $10/$20 starts every stack at $400 with no buy-in control', async ({ page }) => {
  const bundle = await buildTableHarness();
  await installPausedClock(page);
  await openTableHarness(page, bundle, WORDS);

  await expect(tableSection(page)).toBeVisible();
  expect(await seatRows(page)).toEqual(NAMES.map((name) => ({ name, stack: '$400' })));
  await expectNoBuyInControl(page);

  await runFor1000(page);
  await expect(yourActions(page)).toBeVisible();
  await expect(stackOf(page, 1)).toHaveText('$395');
  await expect(stackOf(page, 2)).toHaveText('$390');
  await expectNoBuyInControl(page);
});

test('check or call at every decision plays to showdown with my cards face up', async ({
  page,
}) => {
  await installPausedClock(page);
  await openApp(page);
  const streets = new Set<string>();
  let dealt: string[] | null = null;

  while ((await nextTurnPaused(page)) === 'user') {
    const street = (await tableSection(page).getAttribute('data-street')) ?? '';
    const board = await page
      .getByRole('group', { name: 'Board' })
      .locator('svg[data-card]')
      .count();
    expect(board, street).toBe(BOARD_BY_STREET[street]);
    streets.add(street);

    const cards = await userCards(page);
    expect(cards).toHaveLength(2);
    expect(cards).not.toContain('back');
    dealt ??= cards;
    expect(cards).toEqual(dealt);
    await expect(tableSection(page).locator('svg[data-card]:not([data-card="back"])')).toHaveCount(
      2 + board,
    );

    await checkOrCall(page);
  }

  expect([...streets].sort()).toEqual(['flop', 'preflop', 'river', 'turn']);
  await expect(tableSection(page)).toHaveAttribute('data-street', 'showdown');
  await expectDisabledBar(page);
  await expect(handOver(page)).toBeVisible();
  expect(await userCards(page)).toEqual(dealt);
  await expect(page.getByRole('group', { name: 'Board' }).locator('svg[data-card]')).toHaveCount(5);
  expect(
    await tableSection(page)
      .locator('svg[data-card]:not([data-card="back"])')
      .evaluateAll((svgs) => svgs.filter((s) => s.closest('[role="status"]') === null).length),
  ).toBe(7);

  const finalCount = await actionCount(page);
  for (let slice = 0; slice < 28; slice++) await page.clock.runFor(50);
  expect(await actionCount(page)).toBe(finalCount);
  await expect(handOver(page)).toBeVisible();
  expect(await userCards(page)).toEqual(dealt);
  await expect(page.locator('.table-header-line')).toHaveText(/Hand #1$/);
  expect(await page.evaluate(() => window.__table.turns.length)).toBeGreaterThanOrEqual(4);
});

test('after a preflop fold the bots finish the hand without me', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);
  expect(await nextTurnPaused(page)).toBe('user');
  const dealt = await userCards(page);
  expect(dealt).toHaveLength(2);

  await clickAction(page, 'Fold');
  expect(await nextTurnPaused(page)).toBe('done');
  await expect(handOver(page)).toBeVisible();

  await expectToAct(page, '');
  await expectDisabledBar(page);
  expect(await userCards(page)).toEqual(dealt);
  const { changes, turns } = await page.evaluate(() => window.__table);
  expect(turns).toHaveLength(1);
  const counts = changes.map((c) => c.count);
  for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1] ?? 0);
  expect(changes.at(-1)?.toAct).toBe('');
});

test('ten idle minutes on my turn change nothing', async ({ page }) => {
  await installPausedClock(page);
  await openApp(page);
  await runUntilMyTurn(page);
  await expect(yourActions(page)).toBeVisible();
  const buttons = yourActions(page).getByRole('button');
  const names = await buttons.allTextContents();
  const count = await actionCount(page);

  await page.clock.runFor(600_000);

  await expect(yourActions(page)).toBeVisible();
  expect(await buttons.allTextContents()).toEqual(names);
  for (const button of await buttons.all()) await expect(button).toBeEnabled();
  await expectToAct(page, '5');
  expect(await actionCount(page)).toBe(count);
});

test('my buttons are enabled within 100 ms of the bot action, axe clean, no outside requests', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openApp(page);

  expect(await nextTurn(page)).toBe('user');
  const { changes, turns } = await page.evaluate(() => window.__table);
  const firstTurn = turns[0] as number;
  const preceding = changes.filter((c) => c.at <= firstTurn);
  const last = preceding.at(-1);
  const beforeLast = preceding.at(-2);
  // Blinds (2) plus Cal and Dee: Dee (seat 4) acted and left seat 5 to act.
  expect(last?.count).toBe(4);
  expect(last?.toAct).toBe('5');
  expect(beforeLast?.toAct).toBe('4');
  expect(firstTurn - (last?.at ?? Infinity)).toBeLessThanOrEqual(100);
  await expectNoSeriousAxeViolations(page);

  while ((await nextTurn(page)) === 'user') await checkOrCall(page);
  await expect(handOver(page)).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
