import { IDBFactory } from 'fake-indexeddb';
import { expect, it, vi } from 'vitest';
import { trendHand } from '../../src/stats/trends';
import { HANDS_STORE, openHandStore, SESSIONS_STORE } from '../../src/storage/hand-store';
import type { HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../../src/table/session';
import {
  cashPool,
  cloneRecords,
  forcedFoldRecord,
  mixedGrades,
  sitAndGoPool,
  statRecords,
} from '../support/stat-records';

vi.setConfig({ testTimeout: 30_000 });

// TASK-11.1 (A-3): trendData() reads every valid hand and session in one read-only transaction.

const DB = 'trend-data';

/** Puts raw values straight into a store, bypassing validation. */
async function putRaw(factory: IDBFactory, store: string, values: unknown[]): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = factory.open(DB);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    for (const value of values) transaction.objectStore(store).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

it('trendData reads valid hands and sessions and skips invalid values', async () => {
  const factory = new IDBFactory();
  const store = openHandStore(factory, DB);
  expect(await store.trendData()).toEqual({ hands: [], sessionStarts: new Map() });

  const layout = ['1', '2', '3'].map((id, i) => ({
    sessionId: id.repeat(32),
    startedAt: new Date(Date.UTC(2026, 10, 20, 12 - i)),
    hands: 4 - (i === 2 ? 1 : 0),
    ended: i > 0,
  }));
  const { records, sessions } = statRecords(layout, mixedGrades);
  const left = forcedFoldRecord('3'.repeat(32), 4, new Date(Date.UTC(2026, 10, 20, 11)));
  const valid = [...records, left];
  expect(valid).toHaveLength(12);
  for (const session of sessions) await store.putSession(session);
  for (const record of valid) await store.add(record);
  // An invalid hand value (bad completedAt) and an invalid session value (bad startedAt).
  await putRaw(factory, HANDS_STORE, [{ ...records[0], handNumber: 99, completedAt: 'yesterday' }]);
  await putRaw(factory, SESSIONS_STORE, [
    { ...sessions[0], sessionId: 'f'.repeat(32), startedAt: 'x' },
  ]);

  const data = await store.trendData();
  const key = (h: { sessionId: string; handNumber: number }) => `${h.sessionId}:${h.handNumber}`;
  const sorted = <T extends { sessionId: string; handNumber: number }>(hands: readonly T[]) =>
    [...hands].sort((a, b) => (key(a) < key(b) ? -1 : 1));
  expect(sorted(data.hands)).toEqual(sorted(valid.map(trendHand)));
  expect(data.hands.find((h) => key(h) === key(left))?.unhintedMajors).toBe(0);
  expect(data.sessionStarts).toEqual(new Map(sessions.map((s) => [s.sessionId, s.startedAt])));
});

it("trendData carries each cash hand's net and big bet", async () => {
  const store = openHandStore(new IDBFactory(), DB);
  const startedAt = new Date(Date.UTC(2026, 10, 21));
  const cash = cloneRecords(cashPool(CASH_STAKES[4] as Stake, 2), {
    sessionId: '4'.repeat(32),
    startedAt,
    hands: 2,
    ended: true,
  }).records;
  const sng = cloneRecords(sitAndGoPool(1), {
    sessionId: '5'.repeat(32),
    startedAt,
    hands: 1,
    ended: true,
  }).records[0] as HandRecord;
  for (const record of [...cash, sng]) await store.add(record);

  const { hands } = await store.trendData();
  expect(hands).toHaveLength(3);
  for (const record of cash) {
    const read = hands.find(
      (h) => h.sessionId === record.sessionId && h.handNumber === record.handNumber,
    );
    expect(read?.cash).toEqual(trendHand(record).cash);
    expect(read?.cash?.bigBet).toBe(20);
  }
  const sngHand = hands.find((h) => h.sessionId === '5'.repeat(32));
  expect(sngHand).toBeDefined();
  expect('cash' in (sngHand as object)).toBe(false);
});
