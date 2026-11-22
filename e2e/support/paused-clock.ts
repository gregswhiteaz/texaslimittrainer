import type { Page } from '@playwright/test';

/**
 * Under a paused clock: runs 50 ms fake slices until a Your actions button is enabled. Each slice waits
 * for the previous one, so a bot timer set after a real-time worker reply still gets its turn.
 * Throws past either bound; real time uses Node's clock, which the page clock does not fake.
 */
export async function runUntilMyTurn(
  page: Page,
  { maxFakeMs = 600_000, maxRealMs = 10_000 }: { maxFakeMs?: number; maxRealMs?: number } = {},
): Promise<void> {
  const enabled = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  const start = Date.now();
  let fake = 0;
  while ((await enabled.count()) === 0) {
    const real = Date.now() - start;
    if (fake >= maxFakeMs || real >= maxRealMs) {
      throw new Error(`runUntilMyTurn: not my turn after ${fake} ms fake / ${real} ms real`);
    }
    await page.clock.runFor(50);
    fake += 50;
  }
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
