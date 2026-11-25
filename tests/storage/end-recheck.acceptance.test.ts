import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  REPORTS_STORE,
  SESSIONS_STORE,
  openHandStore,
} from '../../src/storage/hand-store';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import { sessionReport } from '../../src/table/session-report';

// TASK-2.21 D-1: ended() rechecks "already ended" inside its own transaction and then writes nothing.

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00.000Z');
const ENDED_AT = '2026-11-22T09:00:00.000Z';
const NOW = new Date('2026-11-24T09:00:00.000Z');

/** A valid $4/$8 6-max record of `hands` completed hands, last written at `updated`. */
const record = (sessionId: string, hands: number, updated: string): SessionRecord =>
  sessionRecord(
    { ...seatSession(), handNumber: hands + 1 },
    { sessionId, startedAt: STARTED, updatedAt: new Date(updated) },
  );

const ended = (value: SessionRecord): SessionRecord => ({ ...value, endedAt: ENDED_AT });

function inDatabase(factory: IDBFactory, run: (db: IDBDatabase) => IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      open.result.createObjectStore('hands', { keyPath: ['sessionId', 'handNumber'] });
      open.result.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
      open.result.createObjectStore(REPORTS_STORE, { keyPath: 'sessionId' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = run(open.result);
      transaction.oncomplete = () => {
        open.result.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

/** Puts `sessions` and `reports` raw into `factory`'s database. */
async function seed(
  factory: IDBFactory,
  sessions: readonly unknown[],
  reports: readonly unknown[] = [],
): Promise<void> {
  await inDatabase(factory, (db) => {
    const transaction = db.transaction([SESSIONS_STORE, REPORTS_STORE], 'readwrite');
    for (const value of sessions) transaction.objectStore(SESSIONS_STORE).put(value);
    for (const value of reports) transaction.objectStore(REPORTS_STORE).put(value);
    return transaction;
  });
}

/** Every value in `store`, raw, in key order. */
async function all(factory: IDBFactory, store: string): Promise<Record<string, unknown>[]> {
  let values: Record<string, unknown>[] = [];
  await inDatabase(factory, (db) => {
    const transaction = db.transaction(store, 'readonly');
    const request = transaction.objectStore(store).getAll();
    request.onsuccess = () => {
      values = request.result as Record<string, unknown>[];
    };
    return transaction;
  });
  return values;
}

describe('end recheck storage acceptance', () => {
  it('an already-ended session is not ended again', async () => {
    const recordA = ended(record(A, 4, '2026-11-23T10:10:00.000Z'));
    const recordB = ended(record(B, 0, '2026-11-23T10:05:00.000Z'));
    const recordC = ended(record(C, 2, '2026-11-23T10:01:00.000Z'));
    const reportC = sessionReport(recordC, new Date(ENDED_AT));
    const cases: [string, SessionRecord, unknown[]][] = [
      ['no report', recordA, []],
      ['0 hands', recordB, []],
      ['with report', recordC, [reportC]],
    ];
    for (const [label, value, reports] of cases) {
      const factory = new IDBFactory();
      await seed(factory, [value], reports);
      const sessions = JSON.stringify(await all(factory, SESSIONS_STORE));
      const stored = JSON.stringify(await all(factory, REPORTS_STORE));

      await expect(
        openHandStore(factory).endSession(value.sessionId, NOW),
        label,
      ).rejects.toMatchObject({ name: 'ConstraintError' });
      await expect(
        openHandStore(factory).endSession(value.sessionId, NOW),
        label,
      ).rejects.toBeInstanceOf(DOMException);

      const after = await all(factory, SESSIONS_STORE);
      expect(JSON.stringify(after), label).toBe(sessions);
      expect(after[0]?.endedAt, label).toBe(ENDED_AT);
      expect(JSON.stringify(await all(factory, REPORTS_STORE)), label).toBe(stored);
    }
  });

  it('endPausedSessions rejects an already-ended confirmed session and changes nothing', async () => {
    const recordA = ended(record(A, 4, '2026-11-23T10:10:00.000Z'));
    const recordC = record(C, 2, '2026-11-23T10:01:00.000Z');
    const factory = new IDBFactory();
    await seed(factory, [recordA, recordC]);
    const before = JSON.stringify(await all(factory, SESSIONS_STORE));

    await expect(openHandStore(factory).endPausedSessions(A, NOW)).rejects.toMatchObject({
      name: 'ConstraintError',
    });

    const sessions = await all(factory, SESSIONS_STORE);
    expect(JSON.stringify(sessions)).toBe(before);
    expect(sessions.find((s) => s.sessionId === A)?.endedAt).toBe(ENDED_AT);
    expect(sessions.find((s) => s.sessionId === C)?.endedAt ?? null).toBeNull();
    expect(await all(factory, REPORTS_STORE)).toEqual([]);
  });
});
