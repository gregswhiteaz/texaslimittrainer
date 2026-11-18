// Judge probe: axe helper severity filtering and message format (copied into clone e2e/ to run).
import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './support/axe';
const doc = (body: string) => `<html lang="en"><head><title>P</title></head><body><main><h1>P</h1>${body}</main></body></html>`;
test('serious color-contrast rejects with formatted message', async ({ page }) => {
  await page.setContent(doc('<p style="color:#777;background:#888">low contrast</p>'));
  const err = await expectNoSeriousAxeViolations(page).then(() => null, (e: Error) => e);
  console.log('MSG:', err?.message);
  expect(err?.message).toMatch(/^axe: 1 serious\/critical violation\(s\)\n- color-contrast \(serious\): .+ — p$/);
});
test('moderate-only violation (content outside landmark) resolves', async ({ page }) => {
  await page.setContent(`<html lang="en"><head><title>P</title></head><body><h1>P</h1><p>outside</p></body></html>`);
  await expect(expectNoSeriousAxeViolations(page)).resolves.toBeUndefined();
});
test('two critical violations counted', async ({ page }) => {
  await page.setContent(doc('<img src="a.gif"><img src="b.gif">'));
  const err = await expectNoSeriousAxeViolations(page).then(() => null, (e: Error) => e);
  console.log('MSG2:', err?.message);
  expect(err?.message).toContain('image-alt (critical)');
});
