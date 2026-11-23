import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

const ORIGIN = 'http://localhost:4173';
const STYLE_LABELS = ['Tight-aggressive', 'Calling station', 'Maniac', 'Rock'];
const STUB_WORDS = [3, 2, 1, 0, 3];

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const randomise = (page: Page) => button(page, 'Randomise line-up');
const lineUp = (page: Page) => page.getByRole('radiogroup', { name: 'Line-up' });
const preset = (page: Page, name: string) => lineUp(page).getByRole('radio', { name, exact: true });
const styleSelect = (page: Page, name: string) =>
  page.getByRole('combobox', { name: `Style for ${name}`, exact: true });
const opponents = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasNotText: /^You/ });
const userRow = (page: Page) =>
  page.locator('section[aria-labelledby="config-opponents"] li').filter({ hasText: /^You/ });
const header = (page: Page) => page.locator('.table-header-line');
const playersSelect = (page: Page) => page.getByLabel('Players at the table');

/** Init script: 1-word Uint32Array draws get the next of `words` (cycling); all others are real. */
function stubSingleWords(words: number[]): void {
  const real = crypto.getRandomValues.bind(crypto);
  let next = 0;
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 1) {
      array[0] = words[next++ % words.length] as number;
      return array;
    }
    return real(array);
  }) as typeof crypto.getRandomValues;
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

const MIXED_DRAWN = [
  'Seat 6 Ava Rock',
  'Seat 1 Ben Maniac',
  'Seat 2 Cal Calling station',
  'Seat 3 Dee Tight-aggressive',
  'Seat 4 Eli Rock',
];

test('at 9 players randomise line-up gives every bot row one of the four styles', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openGameConfig(page);

  await playersSelect(page).selectOption('9');
  await expect(opponents(page)).toHaveCount(8);
  const before = (await rowTexts(page)).map((row) => row.split(' ').slice(0, 3).join(' '));

  await randomise(page).click();
  await expect
    .poll(async () => {
      const rows = await rowTexts(page);
      return rows.map((row) => {
        const seatAndName = row.split(' ').slice(0, 3).join(' ');
        const style = row.split(' ').slice(3).join(' ');
        return `${seatAndName} ${STYLE_LABELS.includes(style) ? 'ok' : style}`;
      });
    })
    .toEqual(before.map((seatAndName) => `${seatAndName} ok`));
  await expect(opponents(page)).toHaveCount(8);
  await expect(userRow(page).locator('.seat-label')).toHaveText('You');

  const box = await randomise(page).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await axeWithPausedClock(page);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('a randomised line-up is seated at the table after start game', async ({ page }) => {
  await page.addInitScript(stubSingleWords, STUB_WORDS);
  await openGameConfig(page);

  await randomise(page).click();
  await expect.poll(() => rowTexts(page)).toEqual(MIXED_DRAWN);
  await expect(preset(page, 'Mixed')).toBeChecked();

  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await expect
    .poll(async () => (await tableStyles(page)).sort(bySeatFrom(5, 6)))
    .toEqual(['6 Rock', '1 Maniac', '2 Calling station', '3 TAG', '4 Rock']);
});

test('randomise replaces earlier edits and a preset change clears it', async ({ page }) => {
  await page.addInitScript(stubSingleWords, STUB_WORDS);
  await openGameConfig(page);

  await styleSelect(page, 'Ava').selectOption({ label: 'Maniac' });
  await expect(styleSelect(page, 'Ava')).toHaveValue('Maniac');
  await randomise(page).click();
  await expect.poll(() => rowTexts(page)).toEqual(MIXED_DRAWN);

  await styleSelect(page, 'Dee').selectOption({ label: 'Maniac' });
  await expect
    .poll(() => rowTexts(page))
    .toEqual([
      'Seat 6 Ava Rock',
      'Seat 1 Ben Maniac',
      'Seat 2 Cal Calling station',
      'Seat 3 Dee Maniac',
      'Seat 4 Eli Rock',
    ]);

  await preset(page, 'Soft').check();
  await expect
    .poll(() => rowTexts(page))
    .toEqual([
      'Seat 6 Ava Calling station',
      'Seat 1 Ben Rock',
      'Seat 2 Cal Calling station',
      'Seat 3 Dee Rock',
      'Seat 4 Eli Calling station',
    ]);

  await randomise(page).click();
  await expect.poll(() => rowTexts(page)).toEqual(MIXED_DRAWN);
  await expect(preset(page, 'Soft')).toBeChecked();
});
