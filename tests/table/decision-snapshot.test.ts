import { describe, expect, it } from 'vitest';
import { gradeView } from '../../src/advice/grade';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, recommend } from '../../src/advice/recommend';
import type { Action } from '../../src/engine/hand';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { applyUserAction, userActions, type UserDecision } from '../../src/table/session';
import { userTableAfter } from '../support/table-scenarios';

/** The user (seat 5) holds Ah 9s on a Ks 9d 4c flop; Ben (seat 2) checked to them. */
const FLOP_TURN = userTableAfter(
  { 1: 'Kd', 7: '7c', 4: 'Ah', 10: '9s', 13: 'Ks', 14: '9d', 15: '4c' },
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check',
);

const lastDecision = (decisions: readonly UserDecision[]) =>
  decisions[decisions.length - 1] as UserDecision;

describe('decision snapshot', () => {
  it('decision snapshot in session and worker', () => {
    const bet = userActions(FLOP_TURN).find((a) => a.type === 'bet') as Action;
    const snapshot: ObservedOpponent[] = [{ seat: 2, hands: 40, vpip: 12, pfr: 9 }];

    const recorded = lastDecision(applyUserAction(FLOP_TURN, bet, snapshot).userDecisions);
    expect(recorded.observed).toStrictEqual(snapshot);
    expect(recorded.observed).not.toBe(snapshot);
    expect(recorded.observed?.[0]).not.toBe(snapshot[0]);
    snapshot.push({ seat: 3, hands: 1, vpip: 0, pfr: 0 });
    (snapshot[0] as { hands: number }).hands = 1;
    expect(recorded.observed).toStrictEqual([{ seat: 2, hands: 40, vpip: 12, pfr: 9 }]);
    snapshot.length = 1;
    (snapshot[0] as { hands: number }).hands = 40;

    const plain = lastDecision(applyUserAction(FLOP_TURN, bet).userDecisions);
    expect(Object.keys(plain)).toEqual(['view', 'action']);

    const { view } = recorded;
    const options = { ...ACTION_RANGE_ADVICE, observedOpponents: snapshot };
    expect(handleAdviceRequest({ id: 1, kind: 'recommend', view, observed: snapshot })).toEqual({
      id: 1,
      ok: true,
      value: recommend(view, options),
    });
    expect(
      handleAdviceRequest({ id: 2, kind: 'grade', view, userAction: 'check', observed: snapshot }),
    ).toEqual({ id: 2, ok: true, value: gradeView(view, 'check', options) });

    const invalid = [{ seat: 2, hands: -1, vpip: 12, pfr: 9 }];
    for (const request of [
      { id: 3, kind: 'recommend', view, observed: invalid } as const,
      { id: 4, kind: 'grade', view, userAction: 'check', observed: invalid } as const,
    ]) {
      const response = handleAdviceRequest(request);
      expect(response.ok).toBe(false);
      expect(!response.ok && response.error.name).toBe('RangeError');
    }
  });
});
