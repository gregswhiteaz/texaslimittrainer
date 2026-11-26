import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { addStyleCounts, handStyleCounts } from '../../src/stats/style-stats';
import { DB_NAME, DB_VERSION, HANDS_STORE, openHandStore } from '../../src/storage/hand-store';
import type { HandRecord, HandStore } from '../../src/table/hand-record';
import { seatSession } from '../../src/table/session';
import { handWrite, sessionRecord } from '../../src/table/session-record';
import { sessionReport } from '../../src/table/session-report';
import { playSession } from '../support/session-play';

vi.setConfig({ testTimeout: 30_000 });

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const ENDED = new Date('2026-11-23T10:30:00Z');
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);

/** Writes the start record and 3 hands, as the app does; returns the stored records. */
async function play(store: HandStore): Promise<HandRecord[]> {
  const start = seatSession();
  await store.putSession(
    sessionRecord(start, { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED }),
  );
  for (const done of playSession(start, 3, codeFor)) {
    const { record, session } = handWrite(done, {
      sessionId: SESSION,
      startedAt: STARTED,
      completedAt: new Date(STARTED.getTime() + done.handNumber * 60_000),
    });
    await store.add(record, session);
  }
  return Promise.all([1, 2, 3].map(async (n) => (await store.get(SESSION, n)) as HandRecord));
}

/** Replaces stored hand `n` of SESSION with an invalid value, bypassing the add-only store. */
function corrupt(factory: IDBFactory, n: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME, DB_VERSION);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction(HANDS_STORE, 'readwrite');
      transaction.objectStore(HANDS_STORE).put({ sessionId: SESSION, handNumber: n, bad: true });
      transaction.oncomplete = () => {
        open.result.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

const userCounts = (records: readonly HandRecord[]) =>
  records
    .map((r) => handStyleCounts(r, r.userSeat))
    .reduce((total, counts) => addStyleCounts(total, counts));

describe('session end style', () => {
  it("endSession stores style counts from the session's valid hand records", async () => {
    const factory = new IDBFactory();
    const store = openHandStore(factory);
    const records = await play(store);
    const stored = await store.getSession(SESSION);

    const report = await store.endSession(SESSION, ENDED);
    expect(report?.style).toEqual(
      sessionReport(stored as NonNullable<typeof stored>, ENDED, records).style,
    );
    expect(report?.style).toEqual(userCounts(records));
    expect(report?.style?.handsDealt).toBe(3);
    expect(await store.getReport(SESSION)).toEqual(report);

    const other = new IDBFactory();
    const damaged = openHandStore(other);
    const kept = await play(damaged);
    await corrupt(other, 2);
    await expect(damaged.get(SESSION, 2)).rejects.toThrow(RangeError);
    const ended = await damaged.endSession(SESSION, ENDED);
    expect(ended?.handsPlayed).toBe(3);
    expect(ended?.style?.handsDealt).toBe(2);
    expect(ended?.style).toEqual(userCounts([kept[0], kept[2]] as HandRecord[]));
    expect(await damaged.getReport(SESSION)).toEqual(ended);
    expect((await damaged.getSession(SESSION))?.endedAt).toBe(ENDED.toISOString());
  });
});
