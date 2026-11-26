import type { HandRecordDecision } from './hand-record';
import type { TableState, UserDecision } from './session';

// Grades requested at decision time (TASK-9.3 A-1): one request per user decision of the current hand.

export interface DecisionGrades {
  readonly handNumber: number;
  /** One per requested decision of that hand, in order. */
  readonly pending: readonly Promise<HandRecordDecision>[];
}

export const NO_GRADES: DecisionGrades = { handNumber: 0, pending: [] };

/** Calls `request` once for each of table.userDecisions not yet requested for table.handNumber (starting
 *  afresh when the hand number changes); returns the new tracker (input unchanged if nothing is new). Each new
 *  request promise is marked handled at once (TASK-9.10 D-1), so a grade that fails mid-hand, or in a hand that
 *  never ends, is not an unhandled rejection; the tracker keeps the original promise, so gradedDecisions still
 *  rejects with its error. */
export function requestNewGrades(
  grades: DecisionGrades,
  table: TableState,
  request: (decision: UserDecision) => Promise<HandRecordDecision>,
): DecisionGrades {
  const current = grades.handNumber === table.handNumber ? grades : null;
  const requested = current?.pending.length ?? 0;
  if (current !== null && requested >= table.userDecisions.length) return grades;
  return {
    handNumber: table.handNumber,
    pending: [
      ...(current?.pending ?? []),
      ...table.userDecisions.slice(requested).map((decision) => {
        const grade = request(decision);
        grade.catch(() => undefined);
        return grade;
      }),
    ],
  };
}

/** All entries of table's hand in order. Rejects with RangeError('Grades do not match the decisions') if the
 *  tracker is for another hand or its count differs; rejects with the first failed request's error. */
export function gradedDecisions(
  grades: DecisionGrades,
  table: TableState,
): Promise<readonly HandRecordDecision[]> {
  if (
    grades.handNumber !== table.handNumber ||
    grades.pending.length !== table.userDecisions.length
  ) {
    return Promise.reject(new RangeError('Grades do not match the decisions'));
  }
  return Promise.all(grades.pending);
}
