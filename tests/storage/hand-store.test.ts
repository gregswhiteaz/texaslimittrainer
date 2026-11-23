import { IDBDatabase, IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  HANDS_STORE,
  SESSIONS_STORE,
  openHandStore,
} from '../../src/storage/hand-store';
import { handRecord, type HandRecord } from '../../src/table/hand-record';
import { completedHand, nextHand } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

const OLD_SESSION = 'f'.repeat(32);
const NEW_SESSION = '0'.repeat(31) + '1';
const DAY_MS = 24 * 60 * 60 * 1000;

function session(sessionId: string): SessionRecord {
  const at = new Date('2026-11-23T10:00:00Z');
  return sessionRecord(nextHand(KINGS_SHOWDOWN), { sessionId, startedAt: at, updatedAt: at });
}

function record(sessionId: string, handNumber: number, completedAt: Date): HandRecord {
  const hand = completedHand(KINGS_SHOWDOWN);
  if (hand === null) throw new Error('Hand not complete');
  return handRecord(hand, { sessionId, handNumber, config: KINGS_SHOWDOWN.config, completedAt });
}

describe('hand store', () => {
  it('a new store keeps 1,000 old records', async () => {
    expect([DB_NAME, DB_VERSION, HANDS_STORE, SESSIONS_STORE]).toEqual([
      'tlh-trainer',
      2,
      'hands',
      'sessions',
    ]);
    const factory = new IDBFactory();
    const now = Date.now();
    const old = Array.from({ length: 1000 }, (_, i) =>
      record(OLD_SESSION, i + 1, new Date(now - (730 + i / 1000) * DAY_MS)),
    );
    const first = openHandStore(factory);
    for (const r of old) await first.add(r);

    const later = openHandStore(factory);
    await later.add(record(NEW_SESSION, 1, new Date(now)));
    expect(await later.count()).toBe(1001);
    for (const index of [0, 499, 999]) {
      const expected = old[index] as HandRecord;
      expect(await later.get(OLD_SESSION, expected.handNumber)).toEqual(expected);
    }
    expect(await later.get(OLD_SESSION, 1001)).toBeNull();
    expect(await later.get(NEW_SESSION, 2)).toBeNull();

    // A newer database version cannot be opened at version 2: every call rejects.
    await new Promise<void>((resolve) => {
      const open = factory.open('newer', 3);
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
    });
    const failed = openHandStore(factory, 'newer');
    await expect(failed.add(record(NEW_SESSION, 1, new Date(now)))).rejects.toMatchObject({
      name: 'VersionError',
    });
    await expect(failed.count()).rejects.toMatchObject({ name: 'VersionError' });
    await expect(failed.getSession(NEW_SESSION)).rejects.toMatchObject({ name: 'VersionError' });
    await expect(failed.putSession(session(NEW_SESSION))).rejects.toMatchObject({
      name: 'VersionError',
    });
  });

  it('upgrading a v1 database keeps its hand records and adds sessions', async () => {
    const factory = new IDBFactory();
    const old = [1, 2, 3].map((n) => record(OLD_SESSION, n, new Date(Date.now() - n * DAY_MS)));
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, 1);
      open.onupgradeneeded = () =>
        open.result.createObjectStore(HANDS_STORE, { keyPath: ['sessionId', 'handNumber'] });
      open.onsuccess = () => {
        const transaction = open.result.transaction(HANDS_STORE, 'readwrite');
        for (const r of old) transaction.objectStore(HANDS_STORE).add(r);
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    const store = openHandStore(factory);
    expect(await store.count()).toBe(3);
    for (const r of old) expect(await store.get(OLD_SESSION, r.handNumber)).toEqual(r);
    expect(await store.getSession(OLD_SESSION)).toBeNull();
    const stored = session(OLD_SESSION);
    await store.putSession(stored);
    expect(await store.getSession(OLD_SESSION)).toEqual(stored);

    // A stored session is validated when read.
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(DB_NAME, DB_VERSION);
      open.onsuccess = () => {
        const transaction = open.result.transaction(SESSIONS_STORE, 'readwrite');
        transaction.objectStore(SESSIONS_STORE).put({ ...stored, handsPlayed: -1 });
        transaction.oncomplete = () => {
          open.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
    await expect(store.getSession(OLD_SESSION)).rejects.toThrow(
      new RangeError('Invalid session record: handsPlayed'),
    );
  });

  it('writes each record in a strict-durability readwrite transaction', async () => {
    const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction');
    try {
      const store = openHandStore(new IDBFactory());
      await store.add(record(NEW_SESSION, 1, new Date()));
      expect(transaction).toHaveBeenCalledWith(HANDS_STORE, 'readwrite', { durability: 'strict' });
      await store.putSession(session(NEW_SESSION));
      expect(transaction).toHaveBeenCalledWith(SESSIONS_STORE, 'readwrite', {
        durability: 'strict',
      });
    } finally {
      transaction.mockRestore();
    }
  });
});
