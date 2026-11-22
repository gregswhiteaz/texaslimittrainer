import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { buildCardGallery, openCardGallery } from './support/card-gallery-bundle';
import { runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';
import { expectToAct } from './support/table-locators';

const ORIGIN = 'http://localhost:4173';
/** TASK-3.1's pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const NAMES = ['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'You'];
const ASSET_LOGO = readFileSync(
  fileURLToPath(new URL('../src/assets/tlh-logo.jpg', import.meta.url)),
);
const BRAND_LOGO = readFileSync(
  fileURLToPath(new URL('../dreams/limit-holdem-trainer/brand/tlh-logo.jpg', import.meta.url)),
);

declare global {
  interface Window {
    __replayDraws: number;
  }
}

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/** Init script (after stubReplayWords): counts replay-code draws, i.e. 4-word Uint32Array requests. */
function countReplayDraws(): void {
  const stubbed = crypto.getRandomValues.bind(crypto);
  window.__replayDraws = 0;
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 4) window.__replayDraws += 1;
    return stubbed(array);
  }) as typeof crypto.getRandomValues;
}

async function openHome(page: Page): Promise<void> {
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(countReplayDraws);
  await page.goto('/');
  await expect(heading(page, 'TLH Trainer')).toBeVisible();
}

const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const replayDraws = (page: Page) => page.evaluate(() => window.__replayDraws);
const stackOf = (page: Page, seat: number) =>
  page.locator(`li[data-seat="${seat}"] [data-part="stack"]`);

async function storageAndHistory(page: Page) {
  return page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    history: history.length,
  }));
}

async function expectFitsAndTargets(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const buttons = page.getByRole('button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const box of await buttons.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()),
  )) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
}

test('launch opens Home with the TLH logo and the name TLH Trainer', async ({ page }) => {
  await openHome(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const logo = page.locator('main header img');
  await expect(logo).toHaveCount(1);
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const box = await logo.boundingBox();
  expect(box && { width: box.width, height: box.height }).toEqual({ width: 64, height: 64 });
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await expect(menu.getByRole('button')).toHaveCount(1);
  await expect(menu.getByRole('button', { name: /^New game/ })).toBeVisible();
  await expect(tableSection(page)).toHaveCount(0);
});

test('home logo is the resized brand logo shared with the card back', async ({ page }) => {
  await openHome(page);
  const logo = page.locator('main header img');
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);
  const src = await logo.evaluate((img: HTMLImageElement) => img.currentSrc);
  expect(new URL(src).origin).toBe(ORIGIN);

  const served = await page.request.get(src);
  expect(served.ok()).toBe(true);
  const servedBytes = await served.body();
  expect(sha256(servedBytes)).toBe(sha256(ASSET_LOGO));

  // The card back imports the same asset: the app bundle references exactly one JPEG, this URL.
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((els) => els.map((el) => (el as HTMLScriptElement).src));
  const jpegs = new Set<string>();
  for (const script of scripts) {
    const code = await (await page.request.get(script)).text();
    for (const match of code.matchAll(/[\w/.-]+\.jpg/g)) jpegs.add(new URL(match[0], ORIGIN).href);
  }
  expect([...jpegs]).toEqual([src]);

  // Drawn at 64 × 64, the served logo matches the brand original within 4 per channel on average.
  const meanDifference = await page.evaluate(
    async ({ servedUrl, brandUrl }) => {
      const pixels = async (url: string) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No 2D canvas context');
        context.drawImage(image, 0, 0, 64, 64);
        return context.getImageData(0, 0, 64, 64).data;
      };
      const [a, b] = [await pixels(servedUrl), await pixels(brandUrl)];
      let total = 0;
      let count = 0;
      for (let i = 0; i < a.length; i += 4) {
        for (let c = 0; c < 3; c += 1) {
          total += Math.abs((a[i + c] ?? 0) - (b[i + c] ?? 0));
          count += 1;
        }
      }
      return total / count;
    },
    { servedUrl: src, brandUrl: `data:image/jpeg;base64,${BRAND_LOGO.toString('base64')}` },
  );
  expect(meanDifference).toBeLessThanOrEqual(4);

  // The card back component's logo href carries the same bytes.
  await openCardGallery(page, await buildCardGallery());
  const href = await page.locator('image[data-part="logo"]').getAttribute('href');
  const base64 = /^data:image\/jpeg;base64,(.+)$/.exec(href ?? '')?.[1] ?? '';
  expect(sha256(Buffer.from(base64, 'base64'))).toBe(sha256(servedBytes));
});

test('home uses the charcoal background and a red New game control', async ({ page }) => {
  await openHome(page);

  const colours = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      return getComputedStyle(element);
    };
    const control = document.querySelector('nav[aria-label="Main menu"] button');
    return {
      html: style('html').backgroundColor,
      body: style('body').backgroundColor,
      main: style('main').backgroundColor,
      button: style('nav[aria-label="Main menu"] button').backgroundColor,
      text: [...(control?.querySelectorAll('span') ?? [])].map((s) => getComputedStyle(s).color),
    };
  });
  const charcoal = 'rgb(14, 15, 18)';
  const clear = 'rgba(0, 0, 0, 0)';
  expect(colours.html).toBe(charcoal);
  expect([charcoal, clear]).toContain(colours.body);
  expect([charcoal, clear]).toContain(colours.main);
  expect(colours.button).toBe('rgb(215, 38, 46)');
  expect(colours.text).toEqual(['rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
});

test('new game opens game config without starting a session', async ({ page }) => {
  await openHome(page);
  await newGame(page).click();

  await expect(heading(page, 'New game')).toBeVisible();
  await expect(heading(page, 'New game')).toBeFocused();
  await expect(button(page, 'Start game')).toBeVisible();
  await expect(button(page, 'Cancel')).toBeVisible();
  await expect(tableSection(page)).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Seats' })).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await replayDraws(page)).toBe(0);
});

test('cancel and home return to Home with nothing stored', async ({ page }) => {
  await openHome(page);
  const before = await storageAndHistory(page);

  for (const back of ['Cancel', '← Home']) {
    await newGame(page).click();
    await expect(heading(page, 'New game')).toBeVisible();
    await button(page, back).click();

    await expect(heading(page, 'TLH Trainer')).toBeFocused();
    await expect(newGame(page)).toBeVisible();
    await expect(heading(page, 'New game')).toHaveCount(0);
    expect(await replayDraws(page)).toBe(0);
    expect(await storageAndHistory(page)).toEqual(before);
  }
});

test('start game deals the first hand at the default table', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await openHome(page);
  await newGame(page).click();
  await button(page, 'Start game').click();

  await expect(tableSection(page)).toHaveCount(1);
  await expect(heading(page, 'TLH Trainer')).toBeFocused();
  const rows = await page
    .getByRole('list', { name: 'Seats' })
    .getByRole('listitem')
    .evaluateAll((lis) =>
      lis.map((li) => ({
        name: li.querySelector('[data-part="name"]')?.textContent ?? '',
        stack: li.querySelector('[data-part="stack"]')?.textContent ?? '',
      })),
    );
  expect(rows).toEqual(NAMES.map((name) => ({ name, stack: '$160' })));
  await expect(tableSection(page)).toHaveAttribute('data-action-count', '0');

  await runUntilMyTurn(page);
  await expect(stackOf(page, 1)).toHaveText('$158');
  await expect(stackOf(page, 2)).toHaveText('$156');
  const cards = page.locator('li[data-user] svg[data-card]');
  await expect(cards).toHaveCount(2);
  for (const code of await cards.evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-card')),
  )) {
    expect(code).toMatch(/^[2-9TJQKA][cdhs]$/);
  }
  await expectToAct(page, '5');
  const actions = page.getByRole('group', { name: 'Your actions' });
  await expect(actions.locator('button:not(:disabled)').first()).toBeVisible();
  await expect(tableSection(page)).toHaveCount(1);
  expect(await replayDraws(page)).toBe(1);
});

test('home and game config are axe clean, fit 1280x720 and make only same-origin requests', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openHome(page);
  await page.waitForLoadState('networkidle');

  await expectNoSeriousAxeViolations(page);
  await expectFitsAndTargets(page);

  await newGame(page).click();
  await expect(heading(page, 'New game')).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  await expectFitsAndTargets(page);

  await button(page, 'Start game').click();
  await expect(tableSection(page)).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
