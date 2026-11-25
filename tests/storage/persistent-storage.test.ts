import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DB_NAME,
  HANDS_STORE,
  META_STORE,
  PERSISTENT_STORAGE_KEY,
  REPORTS_STORE,
  SESSIONS_STORE,
  SETTINGS_KEY,
  SETTINGS_STORE,
  openHandStore,
} from '../../src/storage/hand-store';
import {
  browserPersist,
  parsePersistentStorage,
  requestPersistenceOnce,
  type PersistentStorageReader,
  type PersistentStorageWriter,
} from '../../src/storage/persistent-storage';

// TASK-13.2 (REQ-052.4): persistent storage is requested once, on first launch, and its result is stored in
// the version 5 `meta` store.

/** Opens `DB_NAME` at its current version, runs `body` and closes it. */
function withDb<T>(factory: IDBFactory, body: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      body(open.result).then(
        (value) => {
          open.result.close();
          resolve(value);
        },
        (error: unknown) => {
          open.result.close();
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    };
  });
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

const rawRecord = (factory: IDBFactory): Promise<unknown> =>
  withDb(factory, (db) =>
    request(
      db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(PERSISTENT_STORAGE_KEY),
    ),
  );

const putRaw = (factory: IDBFactory, value: unknown): Promise<unknown> =>
  withDb(factory, (db) =>
    request(
      db
        .transaction(META_STORE, 'readwrite')
        .objectStore(META_STORE)
        .put(value, PERSISTENT_STORAGE_KEY),
    ),
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requestPersistenceOnce', () => {
  it('asks only when no valid record exists and stores granted only for true', async () => {
    const answer = (value: unknown) => () => Promise.resolve(value);
    const reject = () => Promise.reject(new DOMException('Injected', 'UnknownError'));
    const fail = () => {
      throw new TypeError('Illegal invocation');
    };
    // [stored before, persist, persist calls, stored and returned granted]
    const rows: [unknown, (() => Promise<unknown>) | undefined, number, boolean][] = [
      [undefined, answer(true), 1, true],
      [undefined, answer(false), 1, false],
      [undefined, undefined, 0, false],
      [undefined, reject, 1, false],
      [{ granted: false }, answer(true), 0, false],
      [{ granted: true }, answer(false), 0, true],
      [{ granted: 'yes' }, answer(true), 1, true],
      [undefined, answer('granted'), 1, false],
      [undefined, fail, 1, false],
    ];
    for (const [i, [before, settle, calls, granted]] of rows.entries()) {
      const factory = new IDBFactory();
      const store = openHandStore(factory);
      if (before !== undefined) {
        await store.count();
        await putRaw(factory, before);
      }
      const persist = settle && vi.fn(settle);
      expect(await requestPersistenceOnce(store, persist), `row ${i}`).toBe(granted);
      expect(persist?.mock.calls.length ?? 0, `row ${i}`).toBe(calls);
      expect(await rawRecord(factory), `row ${i}`).toEqual({ granted });
    }

    // A second launch on the same database does not ask again.
    const factory = new IDBFactory();
    const first = vi.fn(() => Promise.resolve(false));
    expect(await requestPersistenceOnce(openHandStore(factory), first)).toBe(false);
    const second = vi.fn(() => Promise.resolve(true));
    expect(await requestPersistenceOnce(openHandStore(factory), second)).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(await rawRecord(factory)).toEqual({ granted: false });
  });

  it('read and write failures resolve null and are logged', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const readFailure = new Error('read failed');
    const unreadable: PersistentStorageReader & PersistentStorageWriter = {
      readPersistentStorage: () => Promise.reject(readFailure),
      writePersistentStorage: vi.fn(() => Promise.resolve()),
    };
    const notCalled = vi.fn(() => Promise.resolve(true));
    expect(await requestPersistenceOnce(unreadable, notCalled)).toBeNull();
    expect(notCalled).not.toHaveBeenCalled();
    expect(unreadable.writePersistentStorage).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Persistent storage could not be checked', readFailure);

    error.mockClear();
    const writeFailure = new Error('write failed');
    const unwritable: PersistentStorageReader & PersistentStorageWriter = {
      readPersistentStorage: () => Promise.resolve(null),
      writePersistentStorage: () => Promise.reject(writeFailure),
    };
    const called = vi.fn(() => Promise.resolve(true));
    expect(await requestPersistenceOnce(unwritable, called)).toBeNull();
    expect(called).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      'Persistent storage result could not be saved',
      writeFailure,
    );

    // A database that cannot be opened is a read failure: persist is not called.
    error.mockClear();
    const factory = new IDBFactory();
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, 99);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
    });
    const unopened = vi.fn(() => Promise.resolve(true));
    expect(await requestPersistenceOnce(openHandStore(factory), unopened)).toBeNull();
    expect(unopened).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      'Persistent storage could not be checked',
      expect.objectContaining({ name: 'VersionError' }),
    );
  });
});

describe('browserPersist', () => {
  it('browserPersist calls storage.persist as a method or is undefined', async () => {
    expect(
      browserPersist({ storage: undefined } as unknown as Pick<Navigator, 'storage'>),
    ).toBeUndefined();
    expect(
      browserPersist({ storage: {} } as unknown as Pick<Navigator, 'storage'>),
    ).toBeUndefined();

    const answer = Promise.resolve(true);
    const storage = {
      persist(this: unknown) {
        if (this !== storage) throw new TypeError('Illegal invocation');
        return answer;
      },
    };
    const spy = vi.spyOn(storage, 'persist');
    const persist = browserPersist({ storage } as unknown as Pick<Navigator, 'storage'>);
    expect(persist).toBeTypeOf('function');
    expect(persist?.()).toBe(answer);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(await answer).toBe(true);
  });
});

describe('meta store', () => {
  it('version 5 adds an empty meta store and keeps v4 records', async () => {
    const factory = new IDBFactory();
    const store = openHandStore(factory);
    expect(await store.readPersistentStorage()).toBeNull();
    const fresh = await withDb(factory, async (db) => ({
      version: db.version,
      names: [...db.objectStoreNames],
      meta: await request(db.transaction(META_STORE, 'readonly').objectStore(META_STORE).count()),
    }));
    expect(fresh).toEqual({
      version: 5,
      names: ['hands', 'meta', 'reports', 'sessions', 'settings'],
      meta: 0,
    });

    await store.writePersistentStorage(true);
    expect(await rawRecord(factory)).toEqual({ granted: true });
    expect(await openHandStore(factory).readPersistentStorage()).toBe(true);
    await store.writePersistentStorage(false);
    expect(await rawRecord(factory)).toEqual({ granted: false });
    expect(await store.readPersistentStorage()).toBe(false);

    for (const invalid of [{ granted: 'yes' }, { granted: 1 }, {}, null, [true], 'granted', true]) {
      await putRaw(factory, invalid);
      expect(await store.readPersistentStorage(), JSON.stringify(invalid)).toBeNull();
    }

    // A version 4 database with data upgrades with every record unchanged.
    const old = new IDBFactory();
    const id = 'a'.repeat(32);
    const hand = { sessionId: id, handNumber: 1, note: 'hand' };
    const session = { sessionId: id, note: 'session' };
    const report = { sessionId: id, note: 'report' };
    const settings = {
      defaultSpeed: 'realistic',
      autoOpenReview: false,
      showOpponentStyles: false,
      fourColourDeck: true,
      botBanter: false,
    };
    await new Promise<void>((resolve, reject) => {
      const open = old.open(DB_NAME, 4);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
        open.result.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
        open.result.createObjectStore(REPORTS_STORE, { keyPath: 'sessionId' });
        open.result.createObjectStore(SETTINGS_STORE);
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const transaction = open.result.transaction(
          [HANDS_STORE, SESSIONS_STORE, REPORTS_STORE, SETTINGS_STORE],
          'readwrite',
        );
        transaction.objectStore(HANDS_STORE).add(hand);
        transaction.objectStore(SESSIONS_STORE).add(session);
        transaction.objectStore(REPORTS_STORE).add(report);
        transaction.objectStore(SETTINGS_STORE).put(settings, SETTINGS_KEY);
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    const upgraded = openHandStore(old);
    expect(await upgraded.readPersistentStorage()).toBeNull();
    expect(await upgraded.readSettings()).toEqual(settings);
    const stored = await withDb(old, async (db) => {
      const transaction = db.transaction(
        [HANDS_STORE, SESSIONS_STORE, REPORTS_STORE, SETTINGS_STORE, META_STORE],
        'readonly',
      );
      return {
        version: db.version,
        names: [...db.objectStoreNames],
        hands: await request(transaction.objectStore(HANDS_STORE).getAll()),
        sessions: await request(transaction.objectStore(SESSIONS_STORE).getAll()),
        reports: await request(transaction.objectStore(REPORTS_STORE).getAll()),
        settings: await request(transaction.objectStore(SETTINGS_STORE).getAll()),
        meta: await request(transaction.objectStore(META_STORE).count()),
      };
    });
    expect(stored).toEqual({
      version: 5,
      names: ['hands', 'meta', 'reports', 'sessions', 'settings'],
      hands: [hand],
      sessions: [session],
      reports: [report],
      settings: [settings],
      meta: 0,
    });
  });

  it('parsePersistentStorage accepts only { granted: boolean }', () => {
    expect(parsePersistentStorage({ granted: true })).toBe(true);
    expect(parsePersistentStorage({ granted: false, extra: 1 })).toBe(false);
    for (const invalid of [undefined, null, [], 'x', 0, {}, { granted: 'true' }]) {
      expect(parsePersistentStorage(invalid)).toBeNull();
    }
  });
});
