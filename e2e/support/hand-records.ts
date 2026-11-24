import { expect, type Page } from '@playwright/test';

// Raw IndexedDB access to tlh-trainer from the page, independent of src/storage (TASK-3.9, TASK-3.10), and a
// helper that plays the user's hands by folding.

/** Runs in the page: every value in tlh-trainer's `store` ('hands', 'sessions' or 'reports') in key order,
 *  after opening the database at v3 (creating the stores as the app does if they are missing). */
export function readStore(store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer', 3);
    open.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        open.result.createObjectStore('hands', { keyPath: ['sessionId', 'handNumber'] });
      }
      if (event.oldVersion < 2) open.result.createObjectStore('sessions', { keyPath: 'sessionId' });
      if (event.oldVersion < 3) open.result.createObjectStore('reports', { keyPath: 'sessionId' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    };
  });
}

/** Runs in the page: adds `records` straight into tlh-trainer/hands (v3) in one transaction. */
export function seedStoredRecords(records: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer', 3);
    open.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        open.result.createObjectStore('hands', { keyPath: ['sessionId', 'handNumber'] });
      }
      if (event.oldVersion < 2) open.result.createObjectStore('sessions', { keyPath: 'sessionId' });
      if (event.oldVersion < 3) open.result.createObjectStore('reports', { keyPath: 'sessionId' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('hands', 'readwrite');
      const store = transaction.objectStore('hands');
      for (const record of records) store.add(record);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

/** Runs in the page: puts `records` as they are into tlh-trainer/sessions (v3) in one transaction. */
export function seedStoredSessions(records: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer', 3);
    open.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) {
        open.result.createObjectStore('hands', { keyPath: ['sessionId', 'handNumber'] });
      }
      if (event.oldVersion < 2) open.result.createObjectStore('sessions', { keyPath: 'sessionId' });
      if (event.oldVersion < 3) open.result.createObjectStore('reports', { keyPath: 'sessionId' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      for (const record of records) store.put(record);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export const storedRecords = (page: Page): Promise<Record<string, unknown>[]> =>
  page.evaluate(readStore, 'hands') as Promise<Record<string, unknown>[]>;

export const storedSessions = (page: Page): Promise<Record<string, unknown>[]> =>
  page.evaluate(readStore, 'sessions') as Promise<Record<string, unknown>[]>;

export const storedReports = (page: Page): Promise<Record<string, unknown>[]> =>
  page.evaluate(readStore, 'reports') as Promise<Record<string, unknown>[]>;

export const storedCount = async (page: Page): Promise<number> =>
  (await storedRecords(page)).length;

export const header = (page: Page) => page.locator('.table-header-line');
export const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');

/** The hand number in the header, or null before the table shows one. */
export async function headerHand(page: Page): Promise<number | null> {
  if ((await header(page).count()) === 0) return null;
  const match = /Hand #(\d+)$/.exec((await header(page).textContent()) ?? '');
  return match ? Number(match[1]) : null;
}

async function actionCount(page: Page): Promise<number> {
  return Number(
    await page.getByRole('region', { name: 'Table' }).getAttribute('data-action-count'),
  );
}

/** Clicks Fold, or Check/Call when the user cannot fold (`play: 'call'` always checks or calls). */
async function act(page: Page, play: 'fold' | 'call'): Promise<void> {
  const texts = await yourActions(page).getByRole('button').allTextContents();
  const name =
    play === 'fold' && texts.includes('Fold')
      ? 'Fold'
      : texts.includes('Check')
        ? 'Check'
        : /^Call \$\d+$/;
  const before = await actionCount(page);
  await yourActions(page)
    .getByRole('button', { name, exact: typeof name === 'string' })
    .click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

/**
 * Advances with `advance` (one fake or real slice) and acts at each of the user's turns until hand
 * `handNumber`'s result is shown.
 */
export async function playToResult(
  page: Page,
  handNumber: number,
  advance: () => Promise<void>,
  { play = 'fold', maxSlices = 2000 }: { play?: 'fold' | 'call'; maxSlices?: number } = {},
): Promise<void> {
  for (let slice = 0; slice < maxSlices; slice++) {
    if ((await headerHand(page)) === handNumber) {
      if ((await handOver(page).count()) > 0) return;
      if ((await enabledActions(page).count()) > 0) {
        await act(page, play);
        continue;
      }
    }
    await advance();
  }
  throw new Error(`playToResult: hand ${handNumber} has no result after ${maxSlices} slices`);
}

/** Advances until the header shows hand `handNumber`. */
export async function advanceToHand(
  page: Page,
  handNumber: number,
  advance: () => Promise<void>,
  maxSlices = 400,
): Promise<void> {
  for (let slice = 0; slice < maxSlices; slice++) {
    if ((await headerHand(page)) === handNumber) return;
    await advance();
  }
  throw new Error(`advanceToHand: hand ${handNumber} not dealt after ${maxSlices} slices`);
}
