import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { gradeView, type GradeResult } from '../../src/advice/grade';
import { estimateOpponentRanges, type ObservedOpponent } from '../../src/advice/ranges';
import { recommend, userAdviceOptions, type Recommendation } from '../../src/advice/recommend';
import { openHandStore } from '../../src/storage/hand-store';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  decisionRecord,
  handRecord,
  parseHandRecord,
  type HandRecord,
  type HandRecordDecision,
} from '../../src/table/hand-record';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { PREFLOP_FOLD_ONLY, REVIEW_FOUR, userTableAfter } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';

/** REVIEW_FOUR's deck and moves: user Ah 9s, Ben Kd 7c, board Ks 9d 4c 2h 6s. */
const REVIEW_DECK = {
  1: 'Kd',
  7: '7c',
  4: 'Ah',
  10: '9s',
  13: 'Ks',
  14: '9d',
  15: '4c',
  17: '2h',
  19: '6s',
};
const REVIEW_MOVES =
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function recordOf(table: TableState): HandRecord {
  return handRecord(done(table), {
    sessionId: SESSION,
    handNumber: 1,
    config: table.config,
    completedAt: new Date('2026-11-24T09:00:00Z'),
  });
}

async function stored(table: TableState): Promise<HandRecord> {
  const record = recordOf(table);
  const store = openHandStore(new IDBFactory());
  await store.add(record);
  const read = await store.get(record.sessionId, record.handNumber);
  if (read === null) throw new Error('Record not stored');
  return read;
}

/** The worker's grade response for a decision, as the stored fields. */
function workerAdvice(
  view: CompletedHand['userDecisions'][number],
): Omit<HandRecordDecision, 'hinted'> {
  const response = handleAdviceRequest({
    id: 1,
    kind: 'grade',
    view: view.view,
    userAction: view.action.type,
    ...(view.observed === undefined ? {} : { observed: view.observed }),
  });
  if (!response.ok) throw new Error(response.error.message);
  const result = response.value as GradeResult<Recommendation>;
  const advice = result.recommendation;
  const equity = advice.basis === 'equity';
  return {
    street: view.view.street as HandRecordDecision['street'],
    action: view.action,
    recommended: advice.move,
    alternative: advice.alternative,
    ruleId: equity ? advice.ruleId : null,
    basis: advice.basis,
    equityPct: equity ? advice.equityPct : null,
    requiredEquityPct: equity ? advice.requiredEquityPct : null,
    opponentBasis: equity ? advice.opponentBasis : [],
    explanation: advice.explanation,
    grade: { grade: result.grade, ruleId: result.ruleId, marginPts: result.marginPts },
  };
}

const snapshot = (hands: number): ObservedOpponent[] => [{ seat: 2, hands, vpip: 60, pfr: 5 }];

describe('decision record acceptance', () => {
  it('four decisions are stored in order with recommendation, numbers, explanation and grade', async () => {
    const record = await stored(REVIEW_FOUR);
    const { decisions } = record;
    expect(decisions).toHaveLength(4);
    expect(decisions.map((d) => d.street)).toEqual(['preflop', 'flop', 'turn', 'river']);
    expect(decisions.map((d) => d.action.type)).toEqual(['raise', 'bet', 'check', 'call']);
    expect(decisions.map((d) => d.recommended.type)).toEqual(['raise', 'bet', 'bet', 'call']);
    expect(decisions.map((d) => d.grade.grade)).toEqual(['correct', 'correct', 'minor', 'correct']);
    for (const d of decisions) {
      for (const key of [
        'street',
        'action',
        'recommended',
        'alternative',
        'ruleId',
        'basis',
        'equityPct',
        'requiredEquityPct',
        'opponentBasis',
        'explanation',
        'grade',
        'hinted',
      ]) {
        expect(d, key).toHaveProperty(key);
      }
      expect(d.explanation.length).toBeGreaterThan(0);
      expect(d.action.seat).toBe(5);
    }
    expect(decisions[0]).toMatchObject({
      basis: 'chart',
      ruleId: null,
      equityPct: null,
      requiredEquityPct: null,
      opponentBasis: [],
    });
    for (const d of decisions.slice(1)) {
      expect(d.basis).toBe('equity');
      expect(Number.isFinite(d.equityPct)).toBe(true);
      expect(Number.isFinite(d.requiredEquityPct)).toBe(true);
      expect(d.opponentBasis.map((b) => b.seat)).toContain(2);
    }
    done(REVIEW_FOUR).userDecisions.forEach((decision, i) => {
      expect(decisions[i]).toEqual({ ...workerAdvice(decision), hinted: false });
    });
  });

  it('advice uses the decision-time snapshot of 29 hands, not 30', async () => {
    const table = userTableAfter(REVIEW_DECK, REVIEW_MOVES, 6, {}, snapshot(29));
    const hand = done(table);
    expect(hand.userDecisions.every((d) => d.observed !== undefined)).toBe(true);
    const { decisions } = await stored(table);
    expect(decisions).toHaveLength(4);
    hand.userDecisions.forEach((decision, i) => {
      const entry = decisions[i] as HandRecordDecision;
      expect(entry).toEqual({ ...workerAdvice(decision), hinted: false });
      if (entry.basis === 'chart') return;
      const at29 = recommend(decision.view, userAdviceOptions(snapshot(29)));
      const at30 = recommend(decision.view, userAdviceOptions(snapshot(30)));
      if (at29.basis !== 'equity' || at30.basis !== 'equity') throw new Error('Expected equity');
      expect(entry).toMatchObject({
        recommended: at29.move,
        ruleId: at29.ruleId,
        equityPct: at29.equityPct,
        requiredEquityPct: at29.requiredEquityPct,
        opponentBasis: at29.opponentBasis,
      });
      expect(entry.opponentBasis.find((b) => b.seat === 2)).toEqual({
        seat: 2,
        observedHands: null,
        text: 'typical player',
      });
      expect(at30.opponentBasis.find((b) => b.seat === 2)?.observedHands).toBe(30);
      expect(entry.opponentBasis).not.toEqual(at30.opponentBasis);
    });
  });

  it('a decision made without a hint has hinted false', async () => {
    const { decisions } = await stored(REVIEW_FOUR);
    expect(decisions).toHaveLength(4);
    for (const d of decisions) expect(d.hinted).toBe(false);
  });

  it('a preflop fold at the first decision stores exactly one graded entry', async () => {
    const { decisions } = await stored(PREFLOP_FOLD_ONLY);
    expect(decisions).toHaveLength(1);
    const [entry] = decisions as [HandRecordDecision];
    expect(entry).toMatchObject({ street: 'preflop', basis: 'chart', hinted: false });
    expect(entry.action.type).toBe('fold');
    expect(['correct', 'minor', 'major']).toContain(entry.grade.grade);
    const view = (
      done(PREFLOP_FOLD_ONLY).userDecisions[0] as CompletedHand['userDecisions'][number]
    ).view;
    expect(entry.grade.grade).toBe(gradeView(view, 'fold', userAdviceOptions()).grade);
  });

  it('stored grade data is the decided shape and round-trips through JSON', () => {
    const record = recordOf(REVIEW_FOUR);
    expect(JSON.parse(JSON.stringify(record.decisions))).toStrictEqual(record.decisions);
    expect(() => parseHandRecord(JSON.parse(JSON.stringify(record)))).not.toThrow();
    for (const d of record.decisions) {
      expect(Object.keys(d.grade).sort()).toEqual(['grade', 'marginPts', 'ruleId']);
    }
    const turn = record.decisions[2] as HandRecordDecision;
    expect(turn.street).toBe('turn');
    expect(turn.grade.ruleId).toBe('aggression-margin');
    expect(typeof turn.grade.marginPts).toBe('number');
    const decision = done(REVIEW_FOUR).userDecisions[2] as CompletedHand['userDecisions'][number];
    const response = handleAdviceRequest({
      id: 3,
      kind: 'grade',
      view: decision.view,
      userAction: 'check',
    });
    if (!response.ok) throw new Error(response.error.message);
    const result = response.value as GradeResult<Recommendation>;
    expect(turn.grade).toEqual({
      grade: result.grade,
      ruleId: result.ruleId,
      marginPts: result.marginPts,
    });
  });

  it('a null snapshot entry or bad seat throws RangeError, never TypeError', () => {
    const decision = done(REVIEW_FOUR).userDecisions[1] as CompletedHand['userDecisions'][number];
    const { view, action } = decision;
    expect(view.street).toBe('flop');
    const valid = { seat: 2, hands: 40, vpip: 20, pfr: 10 };
    const cases: [unknown[], RegExp][] = [
      [[null], /entry 0/],
      [[undefined], /entry 0/],
      [[42], /entry 0/],
      [[{ ...valid, seat: 0 }], /seat 0/],
      [[{ ...valid, seat: 1.5 }], /seat 1\.5/],
      [[{ ...valid, seat: '2' }], /seat 2/],
      [[{ ...valid, seat: NaN }], /seat NaN/],
      [[{ ...valid, seat: 11 }], /seat 11/],
      [[valid, null], /entry 1/],
    ];
    for (const [entries, message] of cases) {
      const s = entries as ObservedOpponent[];
      const label = JSON.stringify(entries);
      const calls: (() => unknown)[] = [
        () => estimateOpponentRanges(view, s),
        () => recommend(view, userAdviceOptions(s)),
        () => decisionRecord({ view, action, observed: s }),
      ];
      for (const call of calls) {
        let thrown: unknown;
        try {
          call();
        } catch (error) {
          thrown = error;
        }
        expect(thrown, label).toBeInstanceOf(RangeError);
        expect((thrown as Error).message, label).toMatch(message);
      }
      for (const request of [
        { id: 1, kind: 'recommend', view, observed: s } as const,
        { id: 2, kind: 'grade', view, userAction: action.type, observed: s } as const,
      ]) {
        const response = handleAdviceRequest(request);
        expect(response.ok, label).toBe(false);
        expect(!response.ok && response.error.name, label).toBe('RangeError');
      }
    }
  });
});
