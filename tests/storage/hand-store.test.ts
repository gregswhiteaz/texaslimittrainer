import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { DB_NAME, DB_VERSION, HANDS_STORE, openHandStore } from '../../src/storage/hand-store';
import { handRecord, type HandRecord } from '../../src/table/hand-record';
import { completedHand } from '../../src/table/session';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

const OLD_SESSION = 'f'.repeat(32);
const NEW_SESSION = '0'.repeat(31) + '1';
const DAY_MS = 24 * 60 * 60 * 1000;

function record(sessionId: string, handNumber: number, completedAt: Date): HandRecord {
  const hand = completedHand(KINGS_SHOWDOWN);
  if (hand === null) throw new Error('Hand not complete');
  return handRecord(hand, { sessionId, handNumber, config: KINGS_SHOWDOWN.config, completedAt });
}

describe('hand store', () => {
  it('a new store keeps 1,000 old records', async () => {
    expect([DB_NAME, DB_VERSION, HANDS_STORE]).toEqual(['tlh-trainer', 1, 'hands']);
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

    // A newer database version cannot be opened at version 1: every call rejects.
    await new Promise<void>((resolve) => {
      const open = factory.open('newer', 2);
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
  });
});
