import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import react from '@vitejs/plugin-react';
import { build, type Rolldown } from 'vite';

const HARNESS_ENTRY = fileURLToPath(new URL('./table-harness.tsx', import.meta.url));
const SCENES_ENTRY = fileURLToPath(new URL('./table-scenes.tsx', import.meta.url));
const ADVICE_ENTRY = fileURLToPath(new URL('./advice-harness.tsx', import.meta.url));
const HARNESS_HTML =
  '<!doctype html><html lang="en"><head><title>Table harness</title></head><body><div id="root"></div></body></html>';
/** Harness pages are served at the app's origin, so workers can start (D-4). */
const HARNESS_ORIGIN = 'http://localhost:4173';

/** One bot request's computation window (A-5): postMessage to the response's message event. */
export interface AdviceWindow {
  id: number;
  seat: number;
  street: string;
  start: number;
  end: number | null;
  reply: unknown;
}
export interface AdviceEvent {
  type: 'pointerover' | 'resize';
  /** event.timeStamp */
  at: number;
  /** Timestamp of the second requestAnimationFrame callback after the event (A-4). */
  repaint: number | null;
}
export interface AdviceRecord {
  hands: unknown[];
  windows: AdviceWindow[];
  computing: boolean;
  longTasks: { start: number; duration: number }[];
  /** Every requestAnimationFrame timestamp. */
  frames: number[];
  events: AdviceEvent[];
}

declare global {
  interface Window {
    __tlhAdvice: AdviceRecord;
  }
}

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
  const chunk = outputs
    .flatMap((output) => output.output)
    .find((file) => file.type === 'chunk' && file.isEntry);
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

/** Builds the test-only advice harness (default table, instrumented slow worker) as one IIFE script. */
export function buildAdviceHarness(): Promise<string> {
  return buildIife(ADVICE_ENTRY, 'TlhAdviceHarness');
}

/** Opens `html` at HARNESS_ORIGIN/__harness/<name>, fulfilled by the test instead of the server. */
async function openHarnessPage(page: Page, name: string, html: string): Promise<void> {
  const url = `${HARNESS_ORIGIN}/__harness/${name}`;
  await page.route(url, (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto(url);
}

/** Renders the harness at the app's origin with replay codes pinned to `words`. */
export async function openTableHarness(
  page: Page,
  bundle: string,
  words: readonly number[],
): Promise<void> {
  await openHarnessPage(page, 'table', HARNESS_HTML);
  await page.evaluate(stubReplayWords, words);
  await page.addScriptTag({ content: bundle });
}

/**
 * Init script for the advice harness: creates window.__tlhAdvice and records long tasks (when supported),
 * every rAF timestamp, and seat pointerover / window resize events with their repaint time.
 */
export function instrumentAdvice(): void {
  const record: AdviceRecord = {
    hands: [],
    windows: [],
    computing: false,
    longTasks: [],
    frames: [],
    events: [],
  };
  window.__tlhAdvice = record;
  if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        record.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  }
  const frame = (at: number): void => {
    record.frames.push(at);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const onEvent = (event: Event): void => {
    const type = event.type as AdviceEvent['type'];
    if (type === 'pointerover') {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('ul[aria-label="Seats"]') === null) return;
    }
    const entry: AdviceEvent = { type, at: event.timeStamp, repaint: null };
    record.events.push(entry);
    requestAnimationFrame(() =>
      requestAnimationFrame((at) => {
        entry.repaint = at;
      }),
    );
  };
  document.addEventListener('pointerover', onEvent, { capture: true });
  window.addEventListener('resize', onEvent);
}

/**
 * Renders the advice harness at the app's origin: replay codes pinned to `words`, every bot decision
 * taking at least `slowMs` in the test-only slow worker (D-5).
 */
export async function openAdviceHarness(
  page: Page,
  bundle: string,
  words: readonly number[],
  slowMs: number,
): Promise<void> {
  await page.addInitScript(stubReplayWords, words);
  await page.addInitScript(instrumentAdvice);
  await openHarnessPage(
    page,
    'advice',
    `<!doctype html><html lang="en"><head><title>Advice harness</title></head><body><div id="root" data-slow-ms="${slowMs}"></div></body></html>`,
  );
  await page.addScriptTag({ content: bundle });
  await page.getByRole('region', { name: 'Table' }).waitFor();
}

export type TableScene =
  | 'flop-bet'
  | 'seat-1'
  | 'shown-hands'
  | 'capped-flop'
  | 'call-all-in'
  | 'raise-all-in'
  | 'bet-all-in'
  | 'side-pot-river'
  | 'side-pot-showdown';

/** Renders the scripted `scene` (see table-scenes.tsx) into a blank page. */
export async function openTableScene(page: Page, bundle: string, scene: TableScene): Promise<void> {
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Table scene</title></head><body><div id="root" data-scene="${scene}"></div></body></html>`,
  );
  await page.addScriptTag({ content: bundle });
  await page.getByRole('region', { name: 'Table' }).waitFor();
}
