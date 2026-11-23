import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

const ORIGIN = 'http://localhost:4173';
const STYLE_OPTIONS = ['Tight-aggressive', 'Calling station', 'Maniac', 'Rock'];
const NAMES = ['Ava', 'Ben', 'Cal', 'Dee', 'Eli'];

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const lineUp = (page: Page) => page.getByRole('radiogroup', { name: 'Line-up' });
const preset = (page: Page, name: string) => lineUp(page).getByRole('radio', { name, exact: true });
const styleSelect = (page: Page, name: string) =>
  page.getByRole('combobox', { name: `Style for ${name}`, exact: true });
const opponents = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasNotText: /^You/ });
const header = (page: Page) => page.locator('.table-header-line');
const playersSelect = (page: Page) => page.getByLabel('Players at the table');

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

/** Each Opponents row as "Seat n Name <selected style label>". */
async function rowTexts(page: Page): Promise<string[]> {
  return opponents(page).evaluateAll((lis) =>
    lis.map((li) =>
      [
        ...[...li.querySelectorAll('span')].map((s) => s.textContent ?? ''),
        li.querySelector('select')?.selectedOptions[0]?.textContent ?? '',
      ].join(' '),
    ),
  );
}

/** The table's bot styles as "seat style", in the Seats list order. */
async function tableStyles(page: Page): Promise<string[]> {
  return page
    .getByRole('list', { name: 'Seats' })
    .locator('li[data-seat]:not([data-user])')
    .evaluateAll((lis) =>
      lis.map(
        (li) =>
          `${(li as HTMLElement).dataset.seat ?? ''} ${li.querySelector('[data-part="style"]')?.textContent ?? ''}`,
      ),
    );
}

const bySeatFrom = (userSeat: number, players: number) => (a: string, b: string) => {
  const distance = (row: string) => (Number(row.split(' ')[0]) - userSeat + players) % players;
  return distance(a) - distance(b);
};

test('every row offers four styles and start game seats the edited bot as a Rock', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openGameConfig(page);

  await expect(opponents(page)).toHaveCount(5);
  for (const name of NAMES) {
    await expect(styleSelect(page, name)).toHaveCount(1);
    expect(await styleSelect(page, name).locator('option').allTextContents()).toEqual(
      STYLE_OPTIONS,
    );
  }

  await styleSelect(page, 'Cal').selectOption({ label: 'Rock' });
  await expect(styleSelect(page, 'Cal')).toHaveValue('Rock');
  await axeWithPausedClock(page);

  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  expect((await tableStyles(page)).sort(bySeatFrom(5, 6))).toEqual([
    '6 TAG',
    '1 Calling station',
    '2 Rock',
    '3 Rock',
    '4 TAG',
  ]);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test("changing one row's style changes only that row", async ({ page }) => {
  await openGameConfig(page);

  await styleSelect(page, 'Cal').selectOption({ label: 'Rock' });
  await expect
    .poll(() => rowTexts(page))
    .toEqual([
      'Seat 6 Ava Tight-aggressive',
      'Seat 1 Ben Calling station',
      'Seat 2 Cal Rock',
      'Seat 3 Dee Rock',
      'Seat 4 Eli Tight-aggressive',
    ]);
  await expect(preset(page, 'Mixed')).toBeChecked();

  for (const label of ['Calling station', 'Maniac', 'Rock']) {
    await styleSelect(page, 'Ava').selectOption({ label });
    await expect
      .poll(() => rowTexts(page))
      .toEqual([
        `Seat 6 Ava ${label}`,
        'Seat 1 Ben Calling station',
        'Seat 2 Cal Rock',
        'Seat 3 Dee Rock',
        'Seat 4 Eli Tight-aggressive',
      ]);
    await expect(preset(page, 'Mixed')).toBeChecked();
  }
});

test('changing a tough seat to rock and back starts the tough table', async ({ page }) => {
  await openGameConfig(page);
  const tough = [
    'Seat 6 Ava Maniac',
    'Seat 1 Ben Tight-aggressive',
    'Seat 2 Cal Tight-aggressive',
    'Seat 3 Dee Tight-aggressive',
    'Seat 4 Eli Tight-aggressive',
  ];

  await preset(page, 'Tough').check();
  await styleSelect(page, 'Ben').selectOption({ label: 'Rock' });
  await expect(styleSelect(page, 'Ben')).toHaveValue('Rock');
  await styleSelect(page, 'Ben').selectOption({ label: 'Tight-aggressive' });
  await expect.poll(() => rowTexts(page)).toEqual(tough);

  await styleSelect(page, 'Cal').selectOption({ label: 'Rock' });
  await preset(page, 'Mixed').check();
  await expect
    .poll(() => rowTexts(page))
    .toEqual([
      'Seat 6 Ava Tight-aggressive',
      'Seat 1 Ben Calling station',
      'Seat 2 Cal Maniac',
      'Seat 3 Dee Rock',
      'Seat 4 Eli Tight-aggressive',
    ]);

  await preset(page, 'Tough').check();
  await styleSelect(page, 'Ben').selectOption({ label: 'Rock' });
  await styleSelect(page, 'Ben').selectOption({ label: 'Tight-aggressive' });
  await expect.poll(() => rowTexts(page)).toEqual(tough);

  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  expect((await tableStyles(page)).sort(bySeatFrom(5, 6))).toEqual([
    '6 Maniac',
    '1 TAG',
    '2 TAG',
    '3 TAG',
    '4 TAG',
  ]);
});

test('changing the players count clears the style edits', async ({ page }) => {
  await openGameConfig(page);

  await styleSelect(page, 'Cal').selectOption({ label: 'Rock' });
  await expect(styleSelect(page, 'Cal')).toHaveValue('Rock');
  await playersSelect(page).selectOption('4');
  await expect(opponents(page)).toHaveCount(3);
  await playersSelect(page).selectOption('6');
  await expect(opponents(page)).toHaveCount(5);
  await expect
    .poll(() => rowTexts(page))
    .toEqual([
      'Seat 6 Ava Tight-aggressive',
      'Seat 1 Ben Calling station',
      'Seat 2 Cal Maniac',
      'Seat 3 Dee Rock',
      'Seat 4 Eli Tight-aggressive',
    ]);
  await expect(preset(page, 'Mixed')).toBeChecked();
});
