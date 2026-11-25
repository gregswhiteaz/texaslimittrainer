import { describe, expect, it } from 'vitest';
import { statisticsView, trendHand, type TrendPoint } from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import {
  forcedFoldRecord,
  statRecords,
  type DecisionGrade,
  type GradeFor,
} from '../support/stat-records';

// TASK-11.1 AC#3–AC#5 at module level, from stored-shape hand records.

const SESSION = '4'.repeat(32);
const STARTED = new Date('2026-11-20T10:00:00Z');
const CORRECT: DecisionGrade = { grade: 'correct', hinted: false };

function viewOf(records: readonly HandRecord[]) {
  return statisticsView({
    hands: records.map(trendHand),
    sessionStarts: new Map([[SESSION, STARTED.toISOString()]]),
  });
}

const oneSession = (hands: number, gradeFor: GradeFor) =>
  statRecords([{ sessionId: SESSION, startedAt: STARTED, hands, ended: true }], gradeFor).records;

function pointsOf(records: readonly HandRecord[]): readonly TrendPoint[] {
  const { chart } = viewOf(records);
  if (chart.kind !== 'points') throw new Error(`no points: ${chart.kind}`);
  return chart.points;
}

describe('trends acceptance', () => {
  it('AC#3 a group with 5 unhinted and 5 hinted Majors plots 1.0', () => {
    const records = oneSession(500, (_, n, d) => {
      if (d === 1 && n >= 100 && n < 105) return { grade: 'major', hinted: false };
      if (d === 2 && n >= 200 && n < 205) return { grade: 'major', hinted: true };
      return { grade: (n + d) % 7 === 0 ? 'minor' : 'correct', hinted: (n + d) % 3 === 0 };
    });
    const decisions = records.flatMap((r) => r.decisions);
    const majors = (hinted: boolean) =>
      decisions.filter((d) => d.grade.grade === 'major' && d.hinted === hinted).length;
    expect([majors(false), majors(true)]).toEqual([5, 5]);
    expect(decisions.some((d) => d.grade.grade === 'minor' && !d.hinted)).toBe(true);

    const points = pointsOf(records);
    expect(points).toHaveLength(1);
    expect(points[0]?.majorPer100).toBe(1);
    expect(points[0]?.majorPer100.toFixed(1)).toBe('1.0');
  });

  it('AC#4 a group whose only non-Correct event is a forced fold plots 0.0', () => {
    const left = forcedFoldRecord(SESSION, 500, new Date(STARTED.getTime() + 500_000));
    expect(parseHandRecord(structuredClone(left))).toEqual(left);
    expect(left.forcedFold).toBe(true);
    const records = [...oneSession(499, () => CORRECT), left];
    expect(records.flatMap((r) => r.decisions).every((d) => d.grade.grade === 'correct')).toBe(
      true,
    );

    const points = pointsOf(records);
    expect(points).toHaveLength(1);
    expect(points[0]?.majorPer100).toBe(0);
    expect(points[0]?.majorPer100.toFixed(1)).toBe('0.0');
  });

  it('AC#5 1,200 hands plot exactly 2 points and the last 200 form none', () => {
    const plain = pointsOf(oneSession(1200, () => CORRECT));
    expect(plain.map(({ firstHand, lastHand }) => ({ firstHand, lastHand }))).toEqual([
      { firstHand: 1, lastHand: 500 },
      { firstHand: 501, lastHand: 1000 },
    ]);
    const lateMajors = oneSession(1200, (_, n, d) =>
      n > 1000 && d === 0 ? { grade: 'major', hinted: false } : CORRECT,
    );
    expect(lateMajors.flatMap((r) => r.decisions).some((d) => d.grade.grade === 'major')).toBe(
      true,
    );
    expect(pointsOf(lateMajors)).toEqual(plain);
    expect(viewOf(lateMajors).totals).toBe('1,200 hands over 1 session');
  });
});
