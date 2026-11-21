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

interface FacePaint {
  card: string;
  rankStroke: string[];
  rankFill: string[];
  suitFill: string[];
  suitStroke: string[];
}

async function facePaint(page: Page, section: string): Promise<FacePaint[]> {
  return page.locator(`[data-testid="${section}"] svg[data-card]`).evaluateAll((faces) =>
    faces.map((face) => {
      const paint = (part: string, property: 'fill' | 'stroke') => [
        ...new Set(
          [...face.querySelectorAll(`[data-part="${part}"] path`)].map(
            (path) => getComputedStyle(path)[property],
          ),
        ),
      ];
      return {
        card: face.getAttribute('data-card') ?? '',
        rankStroke: paint('rank', 'stroke'),
        rankFill: paint('rank', 'fill'),
        suitFill: paint('suit', 'fill'),
        suitStroke: paint('suit', 'stroke'),
      };
    }),
  );
}

function colourMismatches(faces: FacePaint[], expected: Record<string, string>): string[] {
  const mismatches: string[] = [];
  for (const face of faces) {
    if (face.rankStroke.length === 0 || face.suitFill.length === 0) {
      mismatches.push(`${face.card} paths`);
      continue;
    }
    const colour = [expected[face.card.charAt(1)]];
    const wanted = {
      rankStroke: colour,
      rankFill: ['none'],
      suitFill: colour,
      suitStroke: ['none'],
    };
    for (const [field, value] of Object.entries(wanted)) {
      const actual = face[field as keyof typeof wanted];
      if (JSON.stringify(actual) !== JSON.stringify(value))
        mismatches.push(`${face.card} ${field}`);
    }
  }
  return mismatches;
}

async function expectDeckColours(page: Page, section: string, expected: Record<string, string>) {
  const faces = await facePaint(page, section);
  expect(faces).toHaveLength(52);
  expect(colourMismatches(faces, expected)).toEqual([]);
}

async function logoProblems(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const logo = document.querySelector('[data-testid="card-back"] image[data-part="logo"]');
    if (!logo) return ['missing'];
    const problems: string[] = [];
    if (!logo.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
      problems.push('hidden');
    }
    const box = logo.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) problems.push('empty box');
    const probe = new Image();
    probe.src = logo.getAttribute('href') ?? '';
    const decoded = await probe.decode().then(
      () => probe.naturalWidth === 512 && probe.naturalHeight === 512,
      () => false,
    );
    if (!decoded) problems.push('not decoded');
    return problems;
  });
}

async function partsOutsideCard(page: Page, section: string): Promise<string[]> {
  return page.locator(`[data-testid="${section}"] svg[data-card]`).evaluateAll((faces) => {
    const outside: string[] = [];
    for (const face of faces) {
      const card = face.getBoundingClientRect();
      for (const part of ['rank', 'suit']) {
        const paths = [...face.querySelectorAll<SVGPathElement>(`[data-part="${part}"] path`)];
        const leaves = paths.some((path) => {
          const style = getComputedStyle(path);
          const h = style.stroke === 'none' ? 0 : parseFloat(style.strokeWidth) / 2;
          const box = path.getBBox();
          const m = path.getScreenCTM();
          if (!m) return true;
          const xs = [box.x - h, box.x + box.width + h];
          const ys = [box.y - h, box.y + box.height + h];
          return xs.some((x) =>
            ys.some((y) => {
              const sx = m.a * x + m.c * y + m.e;
              const sy = m.b * x + m.d * y + m.f;
              return (
                sx < card.left - 0.01 ||
                sx > card.right + 0.01 ||
                sy < card.top - 0.01 ||
                sy > card.bottom + 0.01
              );
            }),
          );
        });
        if (paths.length === 0 || leaves)
          outside.push(`${face.getAttribute('data-card') ?? ''} ${part}`);
      }
    }
    return outside;
  });
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

test('colour check fails when a path is painted differently from its group', async ({ page }) => {
  await openCardGallery(page, bundle);
  await page.evaluate(() => {
    const section = document.querySelector('[data-testid="faces-two-colour"]');
    section
      ?.querySelector('[data-card="2c"] [data-part="rank"] path')
      ?.setAttribute('stroke', '#00FF00');
    section
      ?.querySelector('[data-card="2d"] [data-part="suit"] path')
      ?.setAttribute('style', 'fill:#00FF00');
  });
  const faces = await facePaint(page, 'faces-two-colour');
  expect(colourMismatches(faces, TWO_COLOUR)).toEqual(['2c rankStroke', '2d suitFill']);
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
  expect(await logoProblems(page)).toEqual([]);
});

test('logo check fails when the logo is hidden or does not load', async ({ page }) => {
  const mutants: [string, string, string[]][] = [
    ['opacity', '0', ['hidden']],
    ['style', 'display:none', ['hidden', 'empty box']],
    ['href', 'data:image/jpeg;base64,AAAA', ['not decoded']],
  ];
  for (const [name, value, problems] of mutants) {
    await openCardGallery(page, bundle);
    await page.evaluate(
      ([attribute, text]) =>
        document
          .querySelector('[data-testid="card-back"] image[data-part="logo"]')
          ?.setAttribute(attribute, text),
      [name, value] as const,
    );
    expect(await logoProblems(page), `${name}=${value}`).toEqual(problems);
  }
});

test('rank and suit paths stay inside the card', async ({ page }) => {
  await openCardGallery(page, bundle);
  await expect(page.locator(FACES)).toHaveCount(104);
  for (const section of ['faces-two-colour', 'faces-four-colour']) {
    expect(await partsOutsideCard(page, section), section).toEqual([]);
  }
});

test('containment check fails when a glyph leaves the card', async ({ page }) => {
  await openCardGallery(page, bundle);
  await page.evaluate(() => {
    const section = document.querySelector('[data-testid="faces-two-colour"]');
    section
      ?.querySelector('[data-card="Ac"] [data-part="rank"]')
      ?.setAttribute('transform', 'translate(50 6)');
    section
      ?.querySelector('[data-card="Kh"] [data-part="suit"]')
      ?.setAttribute('transform', 'translate(40 48)');
  });
  const outside = await partsOutsideCard(page, 'faces-two-colour');
  expect(outside.sort()).toEqual(['Ac rank', 'Kh suit']);
});

test('containment check reports a part with no path', async ({ page }) => {
  await openCardGallery(page, bundle);
  await page.evaluate(() => {
    const section = document.querySelector('[data-testid="faces-two-colour"]');
    section
      ?.querySelectorAll('[data-card="Qs"] [data-part="rank"] path')
      .forEach((path) => path.remove());
    section?.querySelector('[data-card="3h"] [data-part="suit"]')?.remove();
  });
  const outside = await partsOutsideCard(page, 'faces-two-colour');
  expect(outside.sort()).toEqual(['3h suit', 'Qs rank']);
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
