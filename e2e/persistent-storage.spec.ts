import { expect, test, type Page } from '@playwright/test';

// TASK-13.2 (REQ-052.4): on first launch the app calls navigator.storage.persist() once and stores the result in
// tlh-trainer/meta; a relaunch does not ask again. The API is stubbed from init scripts only (no hook in src/).

const ORIGIN = 'http://localhost:4173';

type Mode = 'real' | 'true' | 'false' | 'missing' | 'reject';

const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const errorHeading = (page: Page) => page.getByRole('heading', { name: 'Something went wrong' });

/** Init script: replaces StorageManager.prototype.persist per `mode`. Calls are counted in
 *  localStorage['tlhPersistCalls'] (so the count survives a new page) and the real answer, for 'real', is kept in
 *  localStorage['tlhPersistAnswer']. */
function stubPersist(mode: Mode): void {
  const proto = StorageManager.prototype;
  const real = proto.persist;
  const count = () => {
    const calls = Number(localStorage.getItem('tlhPersistCalls') ?? '0');
    localStorage.setItem('tlhPersistCalls', String(calls + 1));
  };
  const answers: Record<Exclude<Mode, 'missing'>, (storage: StorageManager) => Promise<boolean>> = {
    real: (storage) =>
      real.call(storage).then((answer) => {
        localStorage.setItem('tlhPersistAnswer', JSON.stringify(answer));
        return answer;
      }),
    true: () => Promise.resolve(true),
    false: () => Promise.resolve(false),
    reject: () => Promise.reject(new DOMException('Injected', 'UnknownError')),
  };
  Object.defineProperty(proto, 'persist', {
    configurable: true,
    writable: true,
    value:
      mode === 'missing'
        ? undefined
        : function (this: StorageManager) {
            count();
            return answers[mode](this);
          },
  });
}

const stub = (page: Page, mode: Mode) => page.addInitScript(stubPersist, mode);

/** Runs in the page: the raw persistent-storage record in tlh-trainer/meta, or null when the app has not
 *  created the database or the record yet. Opens without a version and never creates the database itself. */
function storedRecord(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('tlh-trainer');
    open.onupgradeneeded = () => open.transaction?.abort();
    open.onerror = () => {
      if (open.error?.name === 'AbortError') resolve(null);
      else reject(open.error);
    };
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.close();
        resolve(null);
        return;
      }
      const request = db
        .transaction('meta', 'readonly')
        .objectStore('meta')
        .get('persistentStorage');
      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
      };
      request.onerror = () => reject(request.error);
    };
  });
}

const persistCalls = (page: Page): Promise<number> =>
  page.evaluate(() => Number(localStorage.getItem('tlhPersistCalls') ?? '0'));

/** Waits until the record is stored and returns it. */
async function awaitRecord(page: Page): Promise<unknown> {
  await expect.poll(() => page.evaluate(storedRecord)).not.toBeNull();
  return page.evaluate(storedRecord);
}

/** Collects page errors and request URLs from `page`. */
function watch(page: Page): { pageErrors: string[]; requests: string[] } {
  const seen = { pageErrors: [] as string[], requests: [] as string[] };
  page.on('pageerror', (error) => seen.pageErrors.push(error.message));
  page.on('request', (request) => seen.requests.push(request.url()));
  return seen;
}

test("a first launch in Chromium asks once and stores the browser's answer", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'AC#1 names Chromium');
  const seen = watch(page);
  await stub(page, 'real');
  await page.goto('/');
  await expect(homeHeading(page)).toBeVisible();

  const record = await awaitRecord(page);
  expect(await persistCalls(page)).toBe(1);
  const answer: unknown = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tlhPersistAnswer') ?? 'null'),
  );
  expect(typeof answer).toBe('boolean');
  expect(record).toEqual({ granted: answer === true });
  expect(seen.pageErrors).toEqual([]);
  expect(seen.requests.length).toBeGreaterThan(0);
  expect(seen.requests.map((url) => new URL(url).origin)).toEqual(seen.requests.map(() => ORIGIN));
});

test('a refused request is stored as not granted', async ({ page }) => {
  const seen = watch(page);
  await stub(page, 'false');
  await page.goto('/');
  await expect(homeHeading(page)).toBeVisible();

  expect(await awaitRecord(page)).toEqual({ granted: false });
  expect(await persistCalls(page)).toBe(1);
  expect(seen.pageErrors).toEqual([]);
});

test('a missing or failing persistent-storage API is stored as not granted and Home opens', async ({
  browser,
}) => {
  for (const mode of ['missing', 'reject'] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const seen = watch(page);
    await stub(page, mode);
    await page.goto('/');
    await expect(homeHeading(page), mode).toBeVisible();

    expect(await awaitRecord(page), mode).toEqual({ granted: false });
    expect(await persistCalls(page), mode).toBe(mode === 'missing' ? 0 : 1);
    await expect(homeHeading(page), mode).toBeVisible();
    await expect(errorHeading(page), mode).toHaveCount(0);
    expect(seen.pageErrors, mode).toEqual([]);
    await context.close();
  }
});

test('a relaunch does not ask again and keeps the stored result', async ({ context }) => {
  const first = await context.newPage();
  await stub(first, 'false');
  await first.goto('/');
  await expect(homeHeading(first)).toBeVisible();
  expect(await awaitRecord(first)).toEqual({ granted: false });
  expect(await persistCalls(first)).toBe(1);
  await first.close();

  const second = await context.newPage();
  const seen = watch(second);
  await stub(second, 'true');
  await second.goto('/');
  await expect(homeHeading(second)).toBeVisible();
  await second.waitForTimeout(500);
  expect(await persistCalls(second)).toBe(1);
  expect(await second.evaluate(storedRecord)).toEqual({ granted: false });
  expect(seen.pageErrors).toEqual([]);
});
