import { expect, test } from '@playwright/test';
import { buildCardGallery, openCardGallery } from './support/card-gallery-bundle';

let bundle = '';

test.beforeAll(async () => {
  bundle = await buildCardGallery();
});

test('openCardGallery waits for a gallery that renders late', async ({ page }) => {
  await openCardGallery(page, `setTimeout(() => {${bundle}\n}, 500);`);
  const found = await page.evaluate(async () => {
    const logos = document.querySelectorAll('[data-testid="card-back"] image[data-part="logo"]');
    const probe = new Image();
    probe.src = logos[0]?.getAttribute('href') ?? '';
    const size = await probe.decode().then(
      () => ({ width: probe.naturalWidth, height: probe.naturalHeight }),
      () => null,
    );
    return { count: logos.length, size };
  });
  expect(found).toEqual({ count: 1, size: { width: 512, height: 512 } });
});

test('openCardGallery rejects a logo that does not decode', async ({ page }) => {
  const script = `document.getElementById('root').innerHTML =
    '<section data-testid="card-back"><svg><image data-part="logo" href="data:image/jpeg;base64,AAAA"/></svg></section>';`;
  await expect(openCardGallery(page, script)).rejects.toThrow();
});
