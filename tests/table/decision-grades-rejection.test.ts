import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gradedDecisions, NO_GRADES, requestNewGrades } from '../../src/table/decision-grades';
import type { HandRecordDecision } from '../../src/table/hand-record';
import type { UserDecision } from '../../src/table/session';
import { CALL_THEN_FOLD, PREFLOP_FOLD_ONLY } from '../support/table-scenarios';

// TASK-9.10 D-1: a grade request that rejects is handled when it is requested; the hand end still sees it.

const macrotask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const entryFor = (decision: UserDecision): HandRecordDecision =>
  ({ explanation: `${decision.view.street} ${decision.action.type}` }) as HandRecordDecision;

describe('TASK-9.10 failed decision grade', () => {
  const unhandled: unknown[] = [];
  const listener = (reason: unknown): void => {
    unhandled.push(reason);
  };
  beforeEach(() => {
    unhandled.length = 0;
    process.on('unhandledRejection', listener);
  });
  afterEach(() => {
    process.off('unhandledRejection', listener);
  });

  it('a rejected grade request is handled when requested', async () => {
    expect(PREFLOP_FOLD_ONLY.userDecisions).toHaveLength(1);
    const grades = requestNewGrades(NO_GRADES, PREFLOP_FOLD_ONLY, () =>
      Promise.reject(new Error('x')),
    );
    await macrotask();
    await macrotask();
    expect(unhandled).toEqual([]);
    expect(grades.pending).toHaveLength(1);
  });

  it("gradedDecisions still rejects with the failed grade's error", async () => {
    const failure = new Error('x');
    const grades = requestNewGrades(NO_GRADES, PREFLOP_FOLD_ONLY, () => Promise.reject(failure));
    await expect(gradedDecisions(grades, PREFLOP_FOLD_ONLY)).rejects.toBe(failure);

    expect(CALL_THEN_FOLD.userDecisions).toHaveLength(2);
    const requested: Promise<HandRecordDecision>[] = [];
    const [first, second] = CALL_THEN_FOLD.userDecisions as [UserDecision, UserDecision];
    const mixed = requestNewGrades(NO_GRADES, CALL_THEN_FOLD, (decision) => {
      const grade =
        decision === first ? Promise.reject(failure) : Promise.resolve(entryFor(decision));
      requested.push(grade);
      return grade;
    });
    expect(mixed.pending).toHaveLength(2);
    mixed.pending.forEach((grade, i) => expect(grade).toBe(requested[i]));
    await expect(mixed.pending[1]).resolves.toEqual(entryFor(second));
    await expect(gradedDecisions(mixed, CALL_THEN_FOLD)).rejects.toBe(failure);
    await macrotask();
    await macrotask();
    expect(unhandled).toEqual([]);
  });
});
