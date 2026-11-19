import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import react from '@vitejs/plugin-react';
import { build, type Rolldown } from 'vite';

const HARNESS_ENTRY = fileURLToPath(new URL('./table-harness.tsx', import.meta.url));
const SCENES_ENTRY = fileURLToPath(new URL('./table-scenes.tsx', import.meta.url));
const HARNESS_HTML =
  '<!doctype html><html lang="en"><head><title>Table harness</title></head><body><div id="root"></div></body></html>';

/**
 * Makes every 4-word Uint32Array request (one replay code) receive `words`; other requests use the
 * real generator (A-11). Runs in the page, via addInitScript or evaluate.
 */
export function stubReplayWords(words: readonly number[]): void {
  const original = crypto.getRandomValues.bind(crypto);
  crypto.getRandomValues = ((array: ArrayBufferView<ArrayBuffer>) => {
    if (array instanceof Uint32Array && array.length === 4) {
      array.set(words);
      return array;
    }
    return original(array);
  }) as typeof crypto.getRandomValues;
}

/** Builds `entry` as one IIFE script; assets such as the logo are inlined as data URLs. */
async function buildIife(entry: string, name: string): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [react()],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      minify: false,
      lib: { entry, formats: ['iife'], name },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[];
  const chunk = outputs.flatMap((output) => output.output).find((file) => file.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Vite produced no JavaScript chunk');
  return chunk.code;
}

/** Builds the test-only $10/$20 Table harness as one IIFE script; the logo is inlined as a data URL. */
export function buildTableHarness(): Promise<string> {
  return buildIife(HARNESS_ENTRY, 'TlhTableHarness');
}

/** Builds the test-only scripted-scene page (table-scenes.tsx) with the shipped CSS inlined. */
export function buildTableScenes(): Promise<string> {
  return buildIife(SCENES_ENTRY, 'TlhTableScenes');
}

/** Renders the harness into a blank page with replay codes pinned to `words`. */
export async function openTableHarness(
  page: Page,
  bundle: string,
  words: readonly number[],
): Promise<void> {
  await page.setContent(HARNESS_HTML);
  await page.evaluate(stubReplayWords, words);
  await page.addScriptTag({ content: bundle });
}

export type TableScene = 'flop-bet' | 'seat-1';

/** Renders the scripted `scene` (see table-scenes.tsx) into a blank page. */
export async function openTableScene(page: Page, bundle: string, scene: TableScene): Promise<void> {
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Table scene</title></head><body><div id="root" data-scene="${scene}"></div></body></html>`,
  );
  await page.addScriptTag({ content: bundle });
  await page.getByRole('region', { name: 'Table' }).waitFor();
}
