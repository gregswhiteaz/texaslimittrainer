import type { Page } from '@playwright/test';
import { expectNoSeriousAxeViolations } from './axe';

/**
 * Under a paused clock: runs 50 ms fake slices until `check` returns a truthy value, and returns it. Each
 * slice waits for the previous one, so a bot timer set after a real-time worker reply still gets its turn.
 * Throws `${label} after … ms fake / … ms real` past either bound; real time uses Node's clock, which the
 * page clock does not fake.
 */
export async function runUntil<T>(
  page: Page,
  check: () => Promise<T | null>,
  {
    maxFakeMs = 600_000,
    maxRealMs = 10_000,
    label = 'runUntil: condition not met',
  }: { maxFakeMs?: number; maxRealMs?: number; label?: string } = {},
): Promise<T> {
  const start = Date.now();
  let fake = 0;
  for (;;) {
    const result = await check();
    if (result) return result;
    const real = Date.now() - start;
    if (fake >= maxFakeMs || real >= maxRealMs) {
      throw new Error(`${label} after ${fake} ms fake / ${real} ms real`);
    }
    await page.clock.runFor(50);
    fake += 50;
  }
}

/** runUntil a Your actions button is enabled. */
export async function runUntilMyTurn(
  page: Page,
  bounds: { maxFakeMs?: number; maxRealMs?: number } = {},
): Promise<void> {
  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  await runUntil(page, async () => (await enabled.count()) > 0, {
    ...bounds,
    label: 'runUntilMyTurn: not my turn',
  });
}

/**
 * Init script (page.addInitScript(delayWorkerReplies, ms)): every `message` event from a Worker the page
 * creates is held back and dispatched again after `ms` real milliseconds, in arrival order. The delay
 * runs in a blob worker, whose timers the page clock does not touch.
 */
export function delayWorkerReplies(ms: number): void {
  const RealWorker = window.Worker;
  const source = `onmessage = (e) => setTimeout(() => postMessage(e.data), ${Number(ms)});`;
  const timer = new RealWorker(
    URL.createObjectURL(new Blob([source], { type: 'text/javascript' })),
  );
  const held = new Map<number, () => void>();
  const released = new WeakSet<Event>();
  let next = 1;
  timer.onmessage = ({ data }: MessageEvent<number>) => {
    const deliver = held.get(data);
    held.delete(data);
    deliver?.();
  };
  class DelayedWorker extends RealWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      this.addEventListener('message', (event) => {
        if (released.has(event)) return;
        event.stopImmediatePropagation();
        const id = next++;
        held.set(id, () => {
          const again = new MessageEvent('message', { data: event.data });
          released.add(again);
          this.dispatchEvent(again);
        });
        timer.postMessage(id);
      });
    }
  }
  window.Worker = DelayedWorker;
}

interface TimerWindow {
  __pausedTimers?: [typeof setTimeout, typeof clearTimeout];
}

/** Runs in the page: real timers from a Web Worker (untouched by the fake clock) for axe. */
function useWorkerTimers(): void {
  const source =
    'const t = new Map(); onmessage = ({ data: [id, ms] }) => { if (ms === null) { clearTimeout(t.get(id)); t.delete(id); } else t.set(id, setTimeout(() => { t.delete(id); postMessage(id); }, ms)); };';
  const worker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  const callbacks = new Map<number, () => void>();
  let next = 1;
  worker.onmessage = ({ data }: MessageEvent<number>) => {
    const callback = callbacks.get(data);
    callbacks.delete(data);
    callback?.();
  };
  (window as TimerWindow).__pausedTimers = [window.setTimeout, window.clearTimeout];
  window.setTimeout = ((callback: (...args: unknown[]) => void, ms = 0, ...args: unknown[]) => {
    const id = next++;
    callbacks.set(id, () => callback(...args));
    worker.postMessage([id, Number(ms) || 0]);
    return id;
  }) as typeof setTimeout;
  window.clearTimeout = ((id: number) => {
    callbacks.delete(id);
    worker.postMessage([id, null]);
  }) as typeof clearTimeout;
}

function restorePausedTimers(): void {
  const timers = (window as TimerWindow).__pausedTimers;
  if (timers) [window.setTimeout, window.clearTimeout] = timers;
}

/** axe needs running timers; under the paused clock it gets worker timers for the duration of the scan.
 *  Run it only where nothing is due (Home, or the user's turn). Copied from e2e/resume.spec.ts (locked). */
export async function axeWithPausedClock(page: Page): Promise<void> {
  await page.evaluate(useWorkerTimers);
  try {
    await expectNoSeriousAxeViolations(page);
  } finally {
    await page.evaluate(restorePausedTimers);
  }
}
