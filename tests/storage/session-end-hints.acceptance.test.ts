import { IDBFactory } from 'fake-indexeddb';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { openHandStore } from '../../src/storage/hand-store';
import type { HandRecord } from '../../src/table/hand-record';
import { seatSession } from '../../src/table/session';
import { handWrite, sessionRecord } from '../../src/table/session-record';
import { bbPer100, type SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';
import { playSession } from '../support/session-play';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:00:00Z');
const HANDS = 50;
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);

describe('session end hints acceptance', () => {
  it('AC#4 the hinted count equals the stored decision records with the hinted flag', async () => {
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
    const hinted = decisions.filter((d) => d.hinted).length;

    expect(report.hints).toEqual({ hinted, decisions: decisions.length });
    expect(hinted).toBeGreaterThan(0);
    expect(hinted).toBeLessThan(decisions.length);

    const stored = (await store.getReport(SESSION)) as SessionReport;
    expect(stored).toEqual(report);
    const html = renderToString(
      createElement(ReportScreen, { report: stored, onHome: () => undefined }),
    ).replace(/<!-- -->/g, '');
    const value =
      /<div class="report-hints" data-hints="hinted"><dt>Hints used<\/dt><dd>([^<]*)<\/dd>/.exec(
        html,
      )?.[1];
    expect(value).toBe(
      `${hinted} of ${decisions.length} decisions (${bbPer100(hinted, 1, decisions.length).toFixed(1)}%)`,
    );
  }, 60_000);
});
