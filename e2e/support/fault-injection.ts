import type { Page } from '@playwright/test';

// TASK-13.1 D-3: test-only fault injection from a Playwright init script. Nothing here is imported from src/,
// so the production bundle carries no hook.

export type Fault = 'illegal-bot' | 'reject-bot' | 'worker-error' | 'report-render';

interface FaultWindow {
  __tlhFault?: Fault;
  __tlhWorkers?: number;
}

/**
 * Init script (page.addInitScript(installFaults)). Counts Worker constructions in `__tlhWorkers`. While a
 * bot fault is armed in `__tlhFault`, the next bot request is not forwarded: on a microtask its worker
 * dispatches an illegal action (seat 0 is never to act), an `ok:false` reply, or an `error` event. The
 * `report-render` fault throws from the Session report heading's focus call (ReportScreen's mount effect).
 * Every fault fires once.
 */
export function installFaults(): void {
  const faults = window as FaultWindow;
  faults.__tlhWorkers = 0;
  const RealWorker = window.Worker;
  class FaultyWorker extends RealWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      faults.__tlhWorkers = (faults.__tlhWorkers ?? 0) + 1;
    }
    override postMessage(
      message: unknown,
      options?: StructuredSerializeOptions | Transferable[],
    ): void {
      const fault = faults.__tlhFault;
      const request = message as { kind?: unknown; id?: unknown };
      if (
        (fault === 'illegal-bot' || fault === 'reject-bot' || fault === 'worker-error') &&
        request.kind === 'bot'
      ) {
        faults.__tlhFault = undefined;
        void Promise.resolve().then(() => {
          if (fault === 'worker-error') {
            this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure' }));
            return;
          }
          const data =
            fault === 'illegal-bot'
              ? { id: request.id, ok: true, value: { type: 'fold', seat: 0 } }
              : {
                  id: request.id,
                  ok: false,
                  error: { name: 'Error', message: 'Injected bot failure' },
                };
          this.dispatchEvent(new MessageEvent('message', { data }));
        });
        return;
      }
      super.postMessage(message, options as StructuredSerializeOptions);
    }
  }
  window.Worker = FaultyWorker;

  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions): void {
    if (faults.__tlhFault === 'report-render' && this.textContent === 'Session report') {
      faults.__tlhFault = undefined;
      throw new Error('Injected report failure');
    }
    focus.call(this, options);
  };
}

/** Arms `fault` for its next chance (one-shot). */
export async function armFault(page: Page, fault: Fault): Promise<void> {
  await page.evaluate((kind) => {
    (window as FaultWindow).__tlhFault = kind;
  }, fault);
}

/** How many Workers the page has constructed since it loaded. */
export const workerCount = (page: Page): Promise<number> =>
  page.evaluate(() => (window as FaultWindow).__tlhWorkers ?? 0);
