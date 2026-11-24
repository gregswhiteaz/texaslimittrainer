import { IDBFactory } from 'fake-indexeddb';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { openHandStore } from '../../src/storage/hand-store';
import type { HandRecord } from '../../src/table/hand-record';
import { seatSession } from '../../src/table/session';
import { handWrite, sessionRecord } from '../../src/table/session-record';
import type { SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';
import { playSession } from '../support/session-play';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:00:00Z');
const HANDS = 200;
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);

describe('session end errors acceptance', () => {
  it("AC#4 a scripted 200-hand session's tiles equal the values recomputed from its stored hand records", async () => {
    const store = openHandStore(new IDBFactory());
    const start = seatSession();
    await store.putSession(
      sessionRecord(start, { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED }),
    );
    for (const done of playSession(start, HANDS, codeFor)) {
      const { record, session } = handWrite(done, {
        sessionId: SESSION,
        startedAt: STARTED,
        completedAt: new Date(STARTED.getTime() + done.handNumber * 1000),
      });
      const decisions = record.decisions.map((d, i) => ({
        ...d,
        hinted: (record.handNumber + i) % 3 === 0,
      }));
      await store.add({ ...record, decisions }, session);
    }

    const report = (await store.endSession(SESSION, ENDED)) as SessionReport;
    const records: HandRecord[] = [];
    for (let n = 1; n <= HANDS; n++) records.push((await store.get(SESSION, n)) as HandRecord);
    const decisions = records.flatMap((r) => r.decisions);
    const count = (grade: 'major' | 'minor'): number =>
      decisions.filter((d) => !d.hinted && d.grade.grade === grade).length;
    const major = count('major');
    const minor = count('minor');

    expect(report.handsPlayed).toBe(HANDS);
    expect(report.errors).toEqual({ major, minor });
    expect(major).toBeGreaterThan(0);
    expect(minor).toBeGreaterThan(0);
    expect(decisions.some((d) => d.hinted && d.grade.grade !== 'correct')).toBe(true);

    const stored = (await store.getReport(SESSION)) as SessionReport;
    expect(stored).toEqual(report);
    const html = renderToString(
      createElement(ReportScreen, { report: stored, onHome: () => undefined }),
    ).replace(/<!-- -->/g, '');
    const tiles = [
      ...html.matchAll(
        /<div class="report-rate" data-rate="\w+"><dt>[^<]*<\/dt><dd>([^<]*)<\/dd>/g,
      ),
    ].map((m) => m[1]);
    expect(tiles).toEqual(['200', (major / 2).toFixed(1), (minor / 2).toFixed(1)]);
    // About 6 s alone, about 27 s with coverage instrumentation, more under the full parallel suite.
  }, 120_000);
});
