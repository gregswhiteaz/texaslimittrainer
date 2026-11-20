import { expect, test } from '@playwright/test';
import { buildCardGallery, openCardGallery } from './support/card-gallery-bundle';

let bundle = '';

const runsHere =
  process.platform === 'darwin' ||
  (process.platform === 'linux' && process.env.TLH_VISUAL_LINUX === '1');
test.skip(
  !runsHere,
  'card baselines exist for macOS and for Linux in the Playwright Docker image (Visual workflow)',
);

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
