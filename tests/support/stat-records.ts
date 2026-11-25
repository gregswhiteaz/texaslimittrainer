import type { Grade } from '../../src/advice/grade';
import type { HandRecord } from '../../src/table/hand-record';
import { foldUserToLeave, nextStep, seatSession, stepBot } from '../../src/table/session';
import { handWrite, sessionRecord, type SessionRecord } from '../../src/table/session-record';
import { REVIEW_DECK, REVIEW_FOUR, userTableAfter } from './table-scenarios';

// TASK-11.1: stored-shape hand and session records for the Statistics trends, cloned from real handWrite records.
// No test-runner imports, so Vitest tests and e2e seeding can both use them.

export interface StatSession {
  readonly sessionId: string;
  readonly startedAt: Date;
  readonly hands: number;
  /** Ended sessions carry endedAt; the others are paused. */
  readonly ended: boolean;
}

export interface DecisionGrade {
  readonly grade: Grade;
  readonly hinted: boolean;
}

/** The grade of decision `decision` (0-based) of hand `handNumber` in the `session`-th session. */
export type GradeFor = (session: number, handNumber: number, decision: number) => DecisionGrade;

const TEMPLATE_META = {
  sessionId: '0'.repeat(32),
  startedAt: new Date('2026-01-01T00:00:00Z'),
  completedAt: new Date('2026-01-01T00:00:00Z'),
};
/** REVIEW_FOUR's record: 4 user decisions (raise, flop bet, turn check, river call). */
const TEMPLATE = handWrite(REVIEW_FOUR, TEMPLATE_META).record;
export const TEMPLATE_DECISIONS = TEMPLATE.decisions.length;

const completedAt = (session: StatSession, handNumber: number): Date =>
  new Date(session.startedAt.getTime() + handNumber * 1000);

function graded(record: HandRecord, grades: (decision: number) => DecisionGrade): HandRecord {
  return {
    ...record,
    decisions: record.decisions.map((d, i) => {
      const { grade, hinted } = grades(i);
      return { ...d, grade: { ...d.grade, grade }, hinted };
    }),
  };
}

/** One hand record per (session, hand), each a clone of the template with `gradeFor`'s grades, and one
 *  session record per session, in the order given. */
export function statRecords(
  sessions: readonly StatSession[],
  gradeFor: GradeFor,
): { records: HandRecord[]; sessions: SessionRecord[] } {
  const records: HandRecord[] = [];
  const sessionRecords = sessions.map((session, s) => {
    for (let n = 1; n <= session.hands; n++) {
      const clone: HandRecord = {
        ...structuredClone(TEMPLATE),
        sessionId: session.sessionId,
        handNumber: n,
        completedAt: completedAt(session, n).toISOString(),
      };
      records.push(graded(clone, (d) => gradeFor(s, n, d)));
    }
    const last = completedAt(session, session.hands);
    const record = sessionRecord(seatSession(), {
      sessionId: session.sessionId,
      startedAt: session.startedAt,
      updatedAt: last,
    });
    return {
      ...record,
      handsPlayed: session.hands,
      ...(session.ended && { endedAt: last.toISOString() }),
    };
  });
  return { records, sessions: sessionRecords };
}

const NINE_IDS = ['7', '2', '9', '0', '5', 'b', '3', 'e', '1'];
const NINE_WEIGHTS = [3, 7, 2, 9, 4, 6, 1, 8, 5];

/** Nine sessions holding `total` hands in uneven sizes (each ≥ 1 for total ≥ 45), started an hour apart in an
 *  order that differs from sessionId order; the last one is paused. */
export function nineSessions(total: number): StatSession[] {
  const weight = NINE_WEIGHTS.reduce((a, b) => a + b, 0);
  const sizes = NINE_WEIGHTS.map((w) => Math.floor((total * w) / weight));
  sizes[8] = total - sizes.slice(0, 8).reduce((a, b) => a + b, 0);
  return NINE_IDS.map((id, i) => ({
    sessionId: id.repeat(32),
    startedAt: new Date(Date.UTC(2026, 10, 1, i)),
    hands: sizes[i] as number,
    ended: i < 8,
  }));
}

/** A varying mix: unhinted and hinted Majors at a rate that depends on the session, Minors and Corrects. */
export const mixedGrades: GradeFor = (session, handNumber, decision) => {
  const v = (session * 7 + handNumber * 13 + decision * 5) % 23;
  const hinted = (handNumber + decision) % 4 === 0;
  if (v < 1 + (session % 3)) return { grade: 'major', hinted };
  return { grade: v < 6 ? 'minor' : 'correct', hinted };
};

/** A real forced-fold record (leave mid-hand, then the bots play out) whose decisions are all unhinted Correct. */
export function forcedFoldRecord(sessionId: string, handNumber: number, at: Date): HandRecord {
  let table = foldUserToLeave({
    ...userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call'),
    handNumber,
  });
  while (nextStep(table) === 'bot') table = stepBot(table);
  const { record } = handWrite(table, { sessionId, startedAt: at, completedAt: at });
  return graded(record, () => ({ grade: 'correct', hinted: false }));
}
