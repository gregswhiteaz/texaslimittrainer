import { IDBFactory } from 'fake-indexeddb';
import { expect, it } from 'vitest';
import { DB_NAME, SETTINGS_KEY, SETTINGS_STORE, openHandStore } from '../../src/storage/hand-store';
import { DEFAULT_SETTINGS } from '../../src/table/settings';

// TASK-12.2 (SPEC-07, A-4, A-6): writeSettings replaces the one settings record with a validated copy.

/** The settings record exactly as stored, read without parseSettings. */
function rawSettings(factory: IDBFactory): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction(SETTINGS_STORE).objectStore(SETTINGS_STORE).get(SETTINGS_KEY);
      get.onsuccess = () => {
        db.close();
        resolve(get.result);
      };
      get.onerror = () => {
        db.close();
        reject(get.error);
      };
    };
  });
}

it('writeSettings replaces the stored settings and rejects invalid ones', async () => {
  const factory = new IDBFactory();
  const store = openHandStore(factory);
  const off = { ...DEFAULT_SETTINGS, showOpponentStyles: false };

  await store.writeSettings(off);
  expect(await store.readSettings()).toEqual(off);
  expect(await openHandStore(factory).readSettings()).toEqual(off);

  await Promise.all([
    store.writeSettings(off),
    store.writeSettings({ ...DEFAULT_SETTINGS, showOpponentStyles: true }),
  ]);
  expect(await store.readSettings()).toEqual(DEFAULT_SETTINGS);

  await store.writeSettings({ ...off, extra: 1 } as never);
  expect(await rawSettings(factory)).toStrictEqual(off);

  await expect(
    store.writeSettings({ ...DEFAULT_SETTINGS, showOpponentStyles: 'no' } as never),
  ).rejects.toThrow(new RangeError('Invalid settings: showOpponentStyles'));
  expect(await rawSettings(factory)).toStrictEqual(off);
});
