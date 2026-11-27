import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  HANDS_STORE,
  REPORTS_STORE,
  SESSIONS_STORE,
  SETTINGS_STORE,
  UpgradeBlockedError,
  openHandStore,
} from '../../src/storage/hand-store';

// TASK-12.10 (AC#2, D-1): a blocked upgrade rejects instead of hanging, and the next call retries.

/** Opens `DB_NAME` at `version` with no `versionchange` handler, creating `stores` on upgrade, and resolves with
 *  the connection and the `oldVersion` of its upgrade (null when no upgrade ran). Rejects if the open is blocked. */
function openRaw(
  factory: IDBFactory,
  version: number,
  stores: string[] = [],
): Promise<{ db: IDBDatabase; oldVersion: number | null }> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME, version);
    let oldVersion: number | null = null;
    open.onupgradeneeded = (event) => {
      oldVersion = event.oldVersion;
      for (const store of stores) open.result.createObjectStore(store);
    };
    open.onblocked = () => reject(new Error('blocked'));
    open.onerror = () => reject(open.error);
    open.onsuccess = () => resolve({ db: open.result, oldVersion });
  });
}

/** A v4 app database (hands, sessions, reports, settings) held open by a connection that never closes itself. */
const openV4Blocker = async (factory: IDBFactory) =>
  (await openRaw(factory, 4, [HANDS_STORE, SESSIONS_STORE, REPORTS_STORE, SETTINGS_STORE])).db;

describe('blocked database upgrade', () => {
  it('a blocked upgrade rejects with UpgradeBlockedError', async () => {
    const factory = new IDBFactory();
    const blocker = await openV4Blocker(factory);

    const error: unknown = await openHandStore(factory)
      .count()
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(error).toBeInstanceOf(UpgradeBlockedError);
    expect((error as Error).name).toBe('UpgradeBlockedError');
    expect(blocker.version).toBe(4);
    blocker.close();
  });

  it('the next call after a blocked upgrade retries and upgrades', async () => {
    const factory = new IDBFactory();
    const blocker = await openV4Blocker(factory);
    const store = openHandStore(factory);
    await expect(store.count()).rejects.toBeInstanceOf(UpgradeBlockedError);

    blocker.close();
    expect(await store.count()).toBe(0);
    const { db } = await openRaw(factory, DB_VERSION);
    expect(db.version).toBe(5);
    expect([...db.objectStoreNames]).toContain(SETTINGS_STORE);
    db.close();
  });

  it('a call made while the upgrade is still blocked rejects promptly', async () => {
    const factory = new IDBFactory();
    const blocker = await openV4Blocker(factory);
    const store = openHandStore(factory);
    await expect(store.count()).rejects.toBeInstanceOf(UpgradeBlockedError);

    const started = Date.now();
    await expect(store.count()).rejects.toBeInstanceOf(UpgradeBlockedError);
    await expect(store.readSettings()).rejects.toBeInstanceOf(UpgradeBlockedError);
    expect(Date.now() - started).toBeLessThan(1000);

    blocker.close();
    expect(await store.count()).toBe(0);
  });

  it('a blocked open that later succeeds closes its connection', async () => {
    const factory = new IDBFactory();
    const blocker = await openV4Blocker(factory);
    await expect(openHandStore(factory).count()).rejects.toBeInstanceOf(UpgradeBlockedError);

    blocker.close();
    // Queued behind the late upgrade to 5; openRaw rejects if that late connection is still open and blocks it.
    const { db, oldVersion } = await openRaw(factory, DB_VERSION + 1);
    expect(oldVersion).toBe(5);
    db.close();
  });

  it('an open app connection closes on versionchange so a newer version opens', async () => {
    const factory = new IDBFactory();
    expect(await openHandStore(factory).count()).toBe(0);

    const { db, oldVersion } = await openRaw(factory, DB_VERSION + 1);
    expect(oldVersion).toBe(5);
    db.close();
  });
});
