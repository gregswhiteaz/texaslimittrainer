import type { Page } from '@playwright/test';

// TASK-2.20 A-2, A-3: test-only hold of a `sessions` write from a Playwright init script. Nothing here is
// imported from src/, so the production bundle carries no hook.

type HoldState = 'armed' | 'held' | 'released';

interface HoldWindow {
  __tlhSessionsHold?: HoldState;
  /** Sorted, comma-joined store names of the transaction to hold (TASK-2.21 D-3); unset means `sessions`. */
  __tlhSessionsHoldScope?: string;
}

/**
 * Init script (page.addInitScript(holdSessionsWrite)). While `__tlhSessionsHold` is 'armed', the next
 * readwrite transaction whose scope is exactly the armed scope (by default `sessions`, the session start
 * record's put) is held open: the flag becomes 'held' and a chain of `count()` requests on the held store
 * (`sessions` if in scope, else the first store of the sorted scope) keeps it alive, so its data stays
 * uncommitted. Setting the flag to 'released' ends the chain and the transaction commits. Every
 * other transaction passes through unchanged.
 */
export function holdSessionsWrite(): void {
  const hold = window as HoldWindow;
  const transaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (
    this: IDBDatabase,
    storeNames: string | string[],
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
  ): IDBTransaction {
    const opened = transaction.call(this, storeNames, mode, options);
    const scope = (typeof storeNames === 'string' ? [storeNames] : Array.from(storeNames))
      .sort()
      .join(',');
    if (
      hold.__tlhSessionsHold === 'armed' &&
      mode === 'readwrite' &&
      scope === (hold.__tlhSessionsHoldScope ?? 'sessions')
    ) {
      hold.__tlhSessionsHold = 'held';
      const stores = scope.split(',');
      // split() always yields one name, so the `?? 'sessions'` fallback only satisfies the type checker.
      const store = opened.objectStore(
        stores.includes('sessions') ? 'sessions' : (stores[0] ?? 'sessions'),
      );
      const keepAlive = (): void => {
        if (hold.__tlhSessionsHold === 'held') store.count().onsuccess = keepAlive;
      };
      keepAlive();
    }
    return opened;
  } as typeof IDBDatabase.prototype.transaction;
}

/** Arms the hold for the next readwrite transaction over exactly `scope`. */
export async function armSessionsHold(
  page: Page,
  scope: readonly string[] = ['sessions'],
): Promise<void> {
  await page.evaluate(
    (joined) => {
      const hold = window as HoldWindow;
      hold.__tlhSessionsHoldScope = joined;
      hold.__tlhSessionsHold = 'armed';
    },
    [...scope].sort().join(','),
  );
}

/** 'armed', 'held', 'released', or undefined when never armed. */
export const sessionsHoldState = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => (window as HoldWindow).__tlhSessionsHold);

/** Lets the held transaction commit. */
export async function releaseSessionsHold(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as HoldWindow).__tlhSessionsHold = 'released';
  });
}
