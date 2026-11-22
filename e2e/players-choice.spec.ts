import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
const LABELS = ['2 (heads-up)', '3', '4', '5', '6 (6-max)', '7', '8', '9', '10 (full ring)'];
const SIX_MAX_NOTE = 'Advice will be approximate (based on 6-max).';
const FULL_RING_NOTE = 'Advice will be approximate (based on full ring).';
const NOTES: Readonly<Record<number, string>> = {
  3: SIX_MAX_NOTE,
  4: SIX_MAX_NOTE,
  5: SIX_MAX_NOTE,
  7: SIX_MAX_NOTE,
  8: FULL_RING_NOTE,
};

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const playersSelect = (page: Page) => page.getByLabel('Players at the table');
const note = (page: Page) => page.locator('#config-players-note');
const opponents = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasNotText: /^You/ });
const youRow = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasText: /^You/ });
const seats = (page: Page) => page.getByRole('list', { name: 'Seats' }).getByRole('listitem');
const header = (page: Page) => page.locator('.table-header-line');
const seatPart = (page: Page, seat: number, part: string) =>
  page.locator(`li[data-seat="${seat}"] [data-part="${part}"]`);
const selectedText = (page: Page) =>
  playersSelect(page).evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent);

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

async function openGameConfig(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
}

async function expectNote(page: Page, n: number): Promise<void> {
  const text = NOTES[n];
  if (text === undefined) {
    await expect(note(page)).toHaveCount(0);
    await expect(playersSelect(page)).not.toHaveAttribute('aria-describedby');
  } else {
    await expect(note(page)).toHaveText(text);
    await expect(playersSelect(page)).toHaveAccessibleDescription(text);
  }
}

test('each table size from 2 to 10 starts with that many players and the right advice note', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await openGameConfig(page);

  await expect(playersSelect(page)).toHaveRole('combobox');
  expect(
    await playersSelect(page)
      .locator('option')
      .evaluateAll((els) => els.map((el) => el.textContent)),
  ).toEqual(LABELS);
  expect(await selectedText(page)).toBe('6 (6-max)');
  await expectNote(page, 6);
  await expect(opponents(page)).toHaveCount(5);

  for (const [i, label] of LABELS.entries()) {
    const n = i + 2;
    await playersSelect(page).selectOption({ label });
    expect(await selectedText(page)).toBe(label);
    await expectNote(page, n);
    await expect(opponents(page)).toHaveCount(n - 1);
    await expect(youRow(page)).toHaveText(new RegExp(`^You\\s*Seat ${Math.min(5, n)}$`));
    if (n === 7) await axeWithPausedClock(page);
  }
  await playersSelect(page).selectOption({ label: '6 (6-max)' });
  await expectNote(page, 6);
  await expect(opponents(page)).toHaveText([
    /^Seat 1\s*Ava/,
    /^Seat 2\s*Ben/,
    /^Seat 3\s*Cal/,
    /^Seat 4\s*Dee/,
    /^Seat 6\s*Eli/,
  ]);

  for (const [i, label] of LABELS.entries()) {
    const n = i + 2;
    await playersSelect(page).selectOption({ label });
    await button(page, 'Start game').click();

    await expect(header(page)).toHaveText(`Cash · ${n} players · $4/$8 · Hand #1`);
    await expect(seats(page)).toHaveCount(n);
    await expect(page.locator('li[data-user]')).toHaveCount(1);
    if (n === 2 || n === 10) await axeWithPausedClock(page);

    await button(page, 'Leave table').click();
    await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
    await page.getByRole('button', { name: /^New game/ }).click();
    expect(await selectedText(page)).toBe('6 (6-max)');
  }

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('a heads-up table puts the small blind on the button', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  // SCENARIO_CODE: the button bot does not fold preflop heads-up (pinned in table-size.acceptance.test.ts).
  await page.addInitScript(stubReplayWords, [0x9e3779b9, 1, 2, 3]);
  await openGameConfig(page);

  await playersSelect(page).selectOption({ label: '2 (heads-up)' });
  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 2 players · $4/$8 · Hand #1');

  await runUntilMyTurn(page);
  await expect(header(page)).toHaveText('Cash · 2 players · $4/$8 · Hand #1');
  await expect(seatPart(page, 1, 'dealer')).toHaveCount(1);
  await expect(seatPart(page, 2, 'dealer')).toHaveCount(0);
  await expect(seatPart(page, 1, 'name')).toHaveText('Ava');
  await expect(page.locator('li[data-user]')).toHaveAttribute('data-seat', '2');
  await expect(seatPart(page, 2, 'position')).toHaveText('Big blind');
  await expect(seatPart(page, 2, 'stack')).toHaveText('$156');
  // Ava (button, small blind) acted first: her line moved on from the blind; the user's still shows it.
  await expect(seatPart(page, 1, 'action')).toHaveText(/^(Called \$2|Raised to \$8)$/);
  await expect(seatPart(page, 2, 'action')).toHaveText('Big blind $4');
});
