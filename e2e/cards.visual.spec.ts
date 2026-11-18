import { expect, test } from '@playwright/test';
import { buildCardGallery, openCardGallery } from './support/card-gallery-bundle';

let bundle = '';

test.skip(process.platform !== 'darwin', 'visual baselines are macOS-only (A-4)');

test.beforeAll(async () => {
  bundle = await buildCardGallery();
});

test('cards match visual snapshots', async ({ page }) => {
  await openCardGallery(page, bundle);
  for (const section of ['faces-two-colour', 'faces-four-colour', 'card-back']) {
    await expect(page.getByTestId(section)).toHaveScreenshot(`${section}.png`, {
      animations: 'disabled',
    });
  }
});
