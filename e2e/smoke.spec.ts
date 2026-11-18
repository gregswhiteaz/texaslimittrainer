import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

const ORIGIN = 'http://localhost:4173';
const PIXEL_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

test('start page loads in the built app', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');

  await expect(page).toHaveTitle('TLH Trainer');
  await expect(page.getByRole('heading', { level: 1, name: 'TLH Trainer' })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
});

test('start page has no serious or critical axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  if (process.env.E2E_INJECT_A11Y_VIOLATION === '1') {
    await page.locator('main').evaluate((main, src) => {
      const img = document.createElement('img');
      img.src = src;
      main.append(img);
    }, PIXEL_GIF);
  }

  await expectNoSeriousAxeViolations(page);
});

test('start page makes only same-origin requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
