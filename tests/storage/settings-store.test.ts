import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  DB_NAME,
  HANDS_STORE,
  REPORTS_STORE,
  SESSIONS_STORE,
  SETTINGS_KEY,
  SETTINGS_STORE,
  openHandStore,
} from '../../src/storage/hand-store';
import { DEFAULT_SETTINGS } from '../../src/table/settings';

// TASK-12.1 (DoD#4, D-1): DB version 4 adds the settings store with the default record.

const DEFAULTS = {
  defaultSpeed: 'rapid',
  autoOpenReview: true,
  showOpponentStyles: true,
  fourColourDeck: false,
  botBanter: true,
};

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

/** Puts `value` as the settings record, or deletes the record when `value` is undefined. */
const writeSettings = (factory: IDBFactory, value: unknown) =>
  withDb(factory, async (db) => {
    const store = db.transaction(SETTINGS_STORE, 'readwrite').objectStore(SETTINGS_STORE);
    if (value === undefined) await request(store.delete(SETTINGS_KEY));
    else await request(store.put(value, SETTINGS_KEY));
  });

describe('settings store', () => {
  it('a new database stores the default settings', async () => {
    expect([SETTINGS_STORE, SETTINGS_KEY]).toEqual(['settings', 'settings']);
    const factory = new IDBFactory();
    const store = openHandStore(factory);
    expect(await store.count()).toBe(0);

    const { version, names, raw } = await withDb(factory, async (db) => ({
      version: db.version,
      names: [...db.objectStoreNames],
      raw: await request(
        db.transaction(SETTINGS_STORE, 'readonly').objectStore(SETTINGS_STORE).get(SETTINGS_KEY),
      ),
    }));
    expect(version).toBe(4);
    expect(names).toContain('settings');
    expect(raw).toEqual(DEFAULTS);
    expect(await store.readSettings()).toEqual(DEFAULTS);

    await writeSettings(factory, undefined);
    expect(await store.readSettings()).toBe(DEFAULT_SETTINGS);

    await writeSettings(factory, { ...DEFAULTS, fourColourDeck: 'no' });
    await expect(store.readSettings()).rejects.toThrow(
      new RangeError('Invalid settings: fourColourDeck'),
    );
  });

  it('upgrading a v3 database keeps its records and adds default settings', async () => {
    const factory = new IDBFactory();
    const hand = { sessionId: 'a'.repeat(32), handNumber: 1, note: 'hand' };
    const session = { sessionId: 'a'.repeat(32), note: 'session' };
    const report = { sessionId: 'a'.repeat(32), note: 'report' };
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, 3);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
        open.result.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
        open.result.createObjectStore(REPORTS_STORE, { keyPath: 'sessionId' });
      };
      open.onsuccess = () => {
        const transaction = open.result.transaction(
          [HANDS_STORE, SESSIONS_STORE, REPORTS_STORE],
          'readwrite',
        );
        transaction.objectStore(HANDS_STORE).add(hand);
        transaction.objectStore(SESSIONS_STORE).add(session);
        transaction.objectStore(REPORTS_STORE).add(report);
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    const store = openHandStore(factory);
    expect(await store.readSettings()).toEqual(DEFAULTS);
    const stored = await withDb(factory, async (db) => {
      const transaction = db.transaction([HANDS_STORE, SESSIONS_STORE, REPORTS_STORE], 'readonly');
      return {
        version: db.version,
        names: [...db.objectStoreNames],
        hands: await request(transaction.objectStore(HANDS_STORE).getAll()),
        sessions: await request(transaction.objectStore(SESSIONS_STORE).getAll()),
        reports: await request(transaction.objectStore(REPORTS_STORE).getAll()),
      };
    });
    expect(stored).toEqual({
      version: 4,
      names: ['hands', 'reports', 'sessions', 'settings'],
      hands: [hand],
      sessions: [session],
      reports: [report],
    });
  });
});
