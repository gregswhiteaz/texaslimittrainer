import { IDBFactory } from 'fake-indexeddb';
import { expect, it } from 'vitest';
import { statisticsView, type TrendPoint } from '../../src/stats/trends';
import { HANDS_STORE, openHandStore, SESSIONS_STORE } from '../../src/storage/hand-store';
import type { HandRecord } from '../../src/table/hand-record';
import { mixedGrades, nineSessions, statRecords } from '../support/stat-records';

// TASK-11.1 AC#2 (D-8): the 3,000-record store read. Opt-in slow (TLH_SLOW_TESTS=1, npm run test:slow).

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const DB = 'trend-data-3000';

it.runIf(SLOW)(
  'AC#2 3,000 stored hands over 9 sessions give 6 points recomputed from the stored records',
  async () => {
    const factory = new IDBFactory();
    const store = openHandStore(factory, DB);
    await store.count();
    const layout = nineSessions(3000);
    const { records, sessions } = statRecords(layout, mixedGrades);
    expect(sessions.filter((s) => s.endedAt === undefined)).toHaveLength(1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = factory.open(DB);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([HANDS_STORE, SESSIONS_STORE], 'readwrite');
      for (const session of sessions) transaction.objectStore(SESSIONS_STORE).put(session);
      for (const record of records) transaction.objectStore(HANDS_STORE).add(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();

    const view = statisticsView(await store.trendData());
    expect(view.totals).toBe('3,000 hands over 9 sessions');

    // Recomputed from store.get of each record, in session-start then hand-number order.
    const ordered: HandRecord[] = [];
    for (const session of [...layout].sort((a, b) => +a.startedAt - +b.startedAt)) {
      for (let n = 1; n <= session.hands; n++) {
        ordered.push((await store.get(session.sessionId, n)) as HandRecord);
      }
    }
    const expected: TrendPoint[] = [];
    for (let i = 0; i < 6; i++) {
      const majors = ordered
        .slice(i * 500, i * 500 + 500)
        .flatMap((r) => r.decisions)
        .filter((d) => !d.hinted && d.grade.grade === 'major').length;
      expected.push({ firstHand: i * 500 + 1, lastHand: i * 500 + 500, majorPer100: majors / 5 });
    }
    expect(view.chart).toEqual({ kind: 'points', points: expected });
  },
);
