import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import react from '@vitejs/plugin-react';
import { build, type Rolldown } from 'vite';

const GALLERY_ENTRY = fileURLToPath(new URL('./card-gallery.tsx', import.meta.url));
const GALLERY_HTML =
  '<!doctype html><html lang="en"><head><title>Card gallery</title></head><body><div id="root"></div></body></html>';

/** Builds the test-only card gallery as one IIFE script; the logo is inlined as a data URL. */
export async function buildCardGallery(): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [react()],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      minify: false,
      lib: { entry: GALLERY_ENTRY, formats: ['iife'], name: 'TlhCardGallery' },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[];
  const chunk = outputs.flatMap((output) => output.output).find((file) => file.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Vite produced no JavaScript chunk');
  return chunk.code;
}

/** Renders the gallery into a blank page and waits until the card-back logo has decoded. */
export async function openCardGallery(page: Page, bundle: string): Promise<void> {
  await page.setContent(GALLERY_HTML);
  await page.addScriptTag({ content: bundle });
  const logo = page.locator('[data-testid="card-back"] image[data-part="logo"]');
  await logo.waitFor({ state: 'attached' });
  const size = await logo.evaluate(async (node) => {
    const probe = new Image();
    probe.src = node.getAttribute('href') ?? '';
    await probe.decode();
    return { width: probe.naturalWidth, height: probe.naturalHeight };
  });
  if (size.width !== 512 || size.height !== 512) {
    throw new Error(`card-back logo decoded at ${size.width}x${size.height}, expected 512x512`);
  }
}
