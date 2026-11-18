import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
import { buildCardGallery, openCardGallery } from './support/card-gallery-bundle';

const RED = 'rgb(180, 35, 24)';
const BLACK = 'rgb(17, 17, 17)';
const GREEN = 'rgb(29, 107, 53)';
const BLUE = 'rgb(29, 78, 216)';
const TWO_COLOUR: Record<string, string> = { c: BLACK, d: RED, h: RED, s: BLACK };
const FOUR_COLOUR: Record<string, string> = { c: GREEN, d: BLUE, h: RED, s: BLACK };
const FACES = '[data-testid^="faces-"] svg[data-card]';

let bundle = '';

test.use({ deviceScaleFactor: 1 });

test.beforeAll(async () => {
  bundle = await buildCardGallery();
});

async function faceColours(page: Page, section: string) {
  return page.locator(`[data-testid="${section}"] svg[data-card]`).evaluateAll((faces) =>
    faces.map((face) => ({
      card: face.getAttribute('data-card') ?? '',
      rank: getComputedStyle(face.querySelector('[data-part="rank"]') as Element).stroke,
      suit: getComputedStyle(face.querySelector('[data-part="suit"]') as Element).fill,
    })),
  );
}

async function expectDeckColours(page: Page, section: string, expected: Record<string, string>) {
  const faces = await faceColours(page, section);
  expect(faces).toHaveLength(52);
  for (const face of faces) {
    const colour = expected[face.card.charAt(1)];
    expect(face, face.card).toEqual({ card: face.card, rank: colour, suit: colour });
  }
}

test('rank and suit are at least 24 CSS px tall at 1280x720', async ({ page }) => {
  await openCardGallery(page, bundle);
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(1);

  const faces = await page.locator(FACES).all();
  expect(faces).toHaveLength(104);
  for (const face of faces) {
    const card = await face.getAttribute('data-card');
    const box = await face.boundingBox();
    expect(box?.width, `${card} width`).toBeCloseTo(60, 0);
    expect(box?.height, `${card} height`).toBeCloseTo(84, 0);

    for (const part of ['rank', 'suit']) {
      const element = face.locator(`[data-part="${part}"]`);
      const partBox = await element.boundingBox();
      expect(partBox?.height, `${card} ${part} box`).toBeGreaterThanOrEqual(24);
      const geometric = await element.evaluate((node) => {
        const graphic = node as SVGGraphicsElement;
        return graphic.getBBox().height * (graphic.getScreenCTM()?.d ?? 0);
      });
      expect(geometric, `${card} ${part} geometry`).toBeGreaterThanOrEqual(24);
    }
  }
});

test('two-colour deck colours in the browser', async ({ page }) => {
  await openCardGallery(page, bundle);
  await expectDeckColours(page, 'faces-two-colour', TWO_COLOUR);
});

test('four-colour deck colours in the browser', async ({ page }) => {
  await openCardGallery(page, bundle);
  await expectDeckColours(page, 'faces-four-colour', FOUR_COLOUR);
});

test('card back shows the decoded TLH logo', async ({ page }) => {
  await openCardGallery(page, bundle);
  const back = page.getByRole('img', { name: 'Face-down card' });
  await expect(back).toHaveCount(1);
  const backBox = await back.boundingBox();
  const logo = back.locator('image[data-part="logo"]');
  const logoBox = await logo.boundingBox();
  if (!backBox || !logoBox) throw new Error('card back or logo is not rendered');

  expect(backBox.width).toBeCloseTo(60, 0);
  expect(backBox.height).toBeCloseTo(84, 0);
  expect(logoBox.width).toBeGreaterThanOrEqual(48);
  expect(logoBox.height).toBeGreaterThanOrEqual(48);
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
});

test('gallery has no serious axe violations and no network requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await openCardGallery(page, bundle);
  await expect(page.getByRole('img', { name: 'Ace of spades' })).toHaveCount(2);
  await expectNoSeriousAxeViolations(page);

  const external = requests.filter((url) => !/^(data|about):/.test(url));
  expect(external).toEqual([]);
});
