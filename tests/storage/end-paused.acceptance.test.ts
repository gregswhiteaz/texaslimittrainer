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
import { sessionReport, type SessionReport } from '../../src/table/session-report';

// TASK-2.7: Confirm on the new-game dialog ends the paused session and every older unended one (A-1, D-3).

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);
const D = 'd'.repeat(32);
const E = 'e'.repeat(32);
const F = 'f'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00.000Z');
const NOW = new Date('2026-11-24T09:00:00.000Z');

/** A valid $4/$8 6-max record of `hands` completed hands, last written at `updated`. */
const record = (sessionId: string, hands: number, updated: string): SessionRecord =>
  sessionRecord(
    { ...seatSession(), handNumber: hands + 1 },
    { sessionId, startedAt: STARTED, updatedAt: new Date(updated) },
  );

const RECORD_A = record(A, 4, '2026-11-23T10:10:00.000Z');
const RECORD_B = record(B, 0, '2026-11-23T10:05:00.000Z');
const RECORD_C = record(C, 2, '2026-11-23T10:01:00.000Z');
const RECORD_D = {
  ...record(D, 3, '2026-11-23T10:03:00.000Z'),
  endedAt: '2026-11-22T09:00:00.000Z',
};
const RECORD_E = {
  ...record(E, 1, '2026-11-23T10:02:00.000Z'),
  seats: RECORD_A.seats.map((s) => (s.kind === 'bot' ? { ...s, kind: 'robot' } : s)),
};
const RECORD_F = record(F, 3, '2026-11-23T10:00:30.000Z');

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

const byId = (values: readonly Record<string, unknown>[], id: string) =>
  values.find((v) => v.sessionId === id);

describe('end paused sessions storage acceptance', () => {
  it('ends the confirmed session now and older unended sessions at their updatedAt', async () => {
    const factory = new IDBFactory();
    await seed(factory, [RECORD_A, RECORD_B, RECORD_C, RECORD_D, RECORD_E]);
    const before = await all(factory, SESSIONS_STORE);
    const store = openHandStore(factory);

    const result = await store.endPausedSessions(A, NOW);

    const reportA = sessionReport(RECORD_A, NOW);
    const reportC = sessionReport(RECORD_C, new Date(RECORD_C.updatedAt));
    expect(result).toEqual({ report: reportA, rejected: [] });
    expect(reportA.handsPlayed).toBe(4);
    expect(reportC.handsPlayed).toBe(2);

    const sessions = await all(factory, SESSIONS_STORE);
    expect(sessions.map((s) => s.sessionId)).toEqual([A, C, D, E]);
    expect(byId(sessions, A)).toEqual({ ...RECORD_A, endedAt: NOW.toISOString() });
    expect(byId(sessions, C)).toEqual({ ...RECORD_C, endedAt: '2026-11-23T10:01:00.000Z' });
    expect(JSON.stringify(byId(sessions, D))).toBe(JSON.stringify(byId(before, D)));
    expect(JSON.stringify(byId(sessions, E))).toBe(JSON.stringify(byId(before, E)));

    const reports = await all(factory, REPORTS_STORE);
    expect(reports.map((r) => r.sessionId)).toEqual([A, C]);
    expect(reports).toEqual([reportA, reportC]);
    expect(reportA.endedAt).toBe(NOW.toISOString());
    expect(reportC.endedAt).toBe('2026-11-23T10:01:00.000Z');

    const paused = await store.pausedSession();
    expect(paused.session).toBeNull();
    expect(paused.rejected).toHaveLength(1);

    const relaunched = openHandStore(factory);
    expect(await relaunched.getReport(A)).toEqual(reportA);
    expect(await relaunched.getReport(C)).toEqual(reportC);
  });

  it('a failure ending the confirmed session changes nothing', async () => {
    const factory = new IDBFactory();
    const existing: SessionReport = sessionReport(RECORD_A, new Date('2026-11-23T11:00:00.000Z'));
    await seed(factory, [RECORD_A, RECORD_C], [existing]);
    const sessions = JSON.stringify(await all(factory, SESSIONS_STORE));
    const reports = JSON.stringify(await all(factory, REPORTS_STORE));
    const store = openHandStore(factory);

    const failure = store.endPausedSessions(A, NOW);
    await expect(failure).rejects.toBeInstanceOf(DOMException);
    await expect(failure).rejects.toMatchObject({ name: 'ConstraintError' });
    expect(JSON.stringify(await all(factory, SESSIONS_STORE))).toBe(sessions);
    expect(JSON.stringify(await all(factory, REPORTS_STORE))).toBe(reports);

    // An absent confirmed id: nothing to end for it, and the older C is still ended.
    const fresh = new IDBFactory();
    await seed(fresh, [RECORD_C]);
    expect(await openHandStore(fresh).endPausedSessions(A, NOW)).toEqual({
      report: null,
      rejected: [],
    });
    expect(byId(await all(fresh, SESSIONS_STORE), C)?.endedAt).toBe(RECORD_C.updatedAt);
    expect((await all(fresh, REPORTS_STORE)).map((r) => r.sessionId)).toEqual([C]);
  });

  it('a failure ending an older session is returned and the others still end', async () => {
    const factory = new IDBFactory();
    const existing = sessionReport(RECORD_C, new Date('2026-11-23T11:00:00.000Z'));
    await seed(factory, [RECORD_A, RECORD_C, RECORD_F], [existing]);
    const storedC = JSON.stringify(byId(await all(factory, SESSIONS_STORE), C));

    const result = await openHandStore(factory).endPausedSessions(A, NOW);

    expect(result.report?.sessionId).toBe(A);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]).toMatchObject({ name: 'ConstraintError' });
    const sessions = await all(factory, SESSIONS_STORE);
    expect(byId(sessions, A)?.endedAt).toBe(NOW.toISOString());
    expect(byId(sessions, F)?.endedAt).toBe(RECORD_F.updatedAt);
    expect(JSON.stringify(byId(sessions, C))).toBe(storedC);
    expect((await all(factory, REPORTS_STORE)).map((r) => r.sessionId)).toEqual([A, C, F]);
  });
});
