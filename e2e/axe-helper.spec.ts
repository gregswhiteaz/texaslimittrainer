import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';

const PIXEL_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function probeDocument(image: string): string {
  return `<html lang="en"><head><title>Axe probe</title></head><body><main><h1>Probe</h1>${image}</main></body></html>`;
}

test('fails on an image without alt text', async ({ page }) => {
  await page.setContent(probeDocument(`<img src="${PIXEL_GIF}">`));

  await expect(expectNoSeriousAxeViolations(page)).rejects.toThrow(/image-alt \(critical\)/);
});

test('passes on a decorative image with empty alt', async ({ page }) => {
  await page.setContent(probeDocument(`<img src="${PIXEL_GIF}" alt="">`));

  await expect(expectNoSeriousAxeViolations(page)).resolves.toBeUndefined();
});
