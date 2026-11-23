import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

const ORIGIN = 'http://localhost:4173';
const MIXED_ROWS = [
  'Seat 6 Ava Tight-aggressive',
  'Seat 1 Ben Calling station',
  'Seat 2 Cal Maniac',
  'Seat 3 Dee Rock',
  'Seat 4 Eli Tight-aggressive',
];

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const lineUp = (page: Page) => page.getByRole('radiogroup', { name: 'Line-up' });
const preset = (page: Page, name: string) => lineUp(page).getByRole('radio', { name, exact: true });
const playersSelect = (page: Page) => page.getByLabel('Players at the table');
const opponents = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasNotText: /^You/ });
const header = (page: Page) => page.locator('.table-header-line');

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
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
}

/** Each Opponents row as "Seat n Name Style". */
async function rowTexts(page: Page): Promise<string[]> {
  return opponents(page).evaluateAll((lis) =>
    lis.map((li) => [...li.querySelectorAll('span')].map((s) => s.textContent ?? '').join(' ')),
  );
}

test('first use selects Mixed and Start game with Soft seats exactly the listed bots', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openGameConfig(page);

  await expect(lineUp(page).getByRole('radio')).toHaveCount(3);
  expect(await lineUp(page).locator('label').allTextContents()).toEqual(['Mixed', 'Tough', 'Soft']);
  await expect(preset(page, 'Mixed')).toBeChecked();
  await expect(preset(page, 'Tough')).not.toBeChecked();
  await expect(preset(page, 'Soft')).not.toBeChecked();
  expect(await rowTexts(page)).toEqual(MIXED_ROWS);
  await axeWithPausedClock(page);

  await preset(page, 'Soft').check();
  await expect(preset(page, 'Soft')).toBeChecked();
  await expect(preset(page, 'Mixed')).not.toBeChecked();
  const listed = await opponents(page).evaluateAll((lis) =>
    lis.map((li) => {
      const [seat = '', name = '', style = ''] = [...li.querySelectorAll('span')].map(
        (s) => s.textContent ?? '',
      );
      return { seat: seat.replace('Seat ', ''), name, style };
    }),
  );
  expect(listed.map((r) => r.style)).toEqual([
    'Calling station',
    'Rock',
    'Calling station',
    'Rock',
    'Calling station',
  ]);

  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  const seated = await page
    .getByRole('list', { name: 'Seats' })
    .locator('li[data-seat]:not([data-user])')
    .evaluateAll((lis) =>
      lis.map((li) => ({
        seat: (li as HTMLElement).dataset.seat ?? '',
        name: li.querySelector('[data-part="name"]')?.textContent ?? '',
        style: li.querySelector('[data-part="style"]')?.textContent ?? '',
      })),
    );
  const bySeat = (a: { seat: string }, b: { seat: string }) => Number(a.seat) - Number(b.seat);
  expect(seated.sort(bySeat)).toEqual([...listed].sort(bySeat));
  await expect(page.locator('li[data-user]')).toHaveAttribute('data-seat', '5');

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('the rows follow the preset and the players count', async ({ page }) => {
  await openGameConfig(page);

  await preset(page, 'Soft').check();
  await playersSelect(page).selectOption({ label: '4' });
  await expect(opponents(page)).toHaveCount(3);
  expect(await rowTexts(page)).toEqual([
    'Seat 1 Ava Calling station',
    'Seat 2 Ben Rock',
    'Seat 3 Cal Calling station',
  ]);
  await expect(preset(page, 'Soft')).toBeChecked();

  await preset(page, 'Tough').check();
  await playersSelect(page).selectOption({ label: '9' });
  await expect(opponents(page)).toHaveCount(8);
  const tough = await rowTexts(page);
  expect(tough[0]).toBe('Seat 6 Ava Maniac');
  expect(tough.filter((r) => r.endsWith('Maniac'))).toHaveLength(1);
  expect(tough.slice(1).every((r) => r.endsWith('Tight-aggressive'))).toBe(true);
  await axeWithPausedClock(page);

  await playersSelect(page).selectOption({ label: '2 (heads-up)' });
  await expect(preset(page, 'Tough')).toBeChecked();
  await expect(opponents(page)).toHaveCount(1);
  expect(await rowTexts(page)).toEqual(['Seat 1 Ava Tight-aggressive']);
});
