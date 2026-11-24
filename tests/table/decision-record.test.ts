import { describe, expect, it } from 'vitest';
import { gradeView } from '../../src/advice/grade';
import { ACTION_RANGE_ADVICE, userAdviceOptions } from '../../src/advice/recommend';
import {
  decisionRecord,
  handRecord,
  parseHandRecord,
  type HandRecord,
} from '../../src/table/hand-record';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { BB_WALK, REVIEW_FOUR } from '../support/table-scenarios';

const SESSION = 'fedcba9876543210fedcba9876543210';

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
    completedAt: new Date('2026-11-24T10:00:00Z'),
  });
}

type Mutable = Record<string, unknown>;

/** A copy of `record` whose decisions are changed by `change`. */
function changed(record: HandRecord, change: (decisions: Mutable[]) => void): Mutable {
  const copy = structuredClone(record) as unknown as Mutable;
  change(copy.decisions as Mutable[]);
  return copy;
}

const at = (decisions: Mutable[], i: number): Mutable => decisions[i] as Mutable;

describe('decision record', () => {
  it('parseHandRecord rejects bad decision entries', () => {
    const record = recordOf(REVIEW_FOUR);
    expect(parseHandRecord(record)).toBe(record);
    const walk = recordOf(BB_WALK);
    expect(walk.decisions).toEqual([]);
    expect(parseHandRecord(walk)).toBe(walk);

    const missing = structuredClone(record) as unknown as Mutable;
    Reflect.deleteProperty(missing, 'decisions');
    expect(() => parseHandRecord(missing)).toThrow(
      new RangeError('Invalid hand record: decisions'),
    );

    const faults: [change: (d: Mutable[]) => void, field: string][] = [
      [(d) => (at(d, 1).street = 'showdown'), 'decisions[1].street'],
      [(d) => ((at(d, 0).action as Mutable).seat = 2), 'decisions[0].action.seat'],
      [(d) => (at(d, 1).basis = 'chart'), 'decisions[1].ruleId'],
      [(d) => (at(d, 1).equityPct = 101), 'decisions[1].equityPct'],
      [(d) => (at(d, 1).equityPct = NaN), 'decisions[1].equityPct'],
      [(d) => ((at(d, 2).grade as Mutable).ruleId = 'x'), 'decisions[2].grade.ruleId'],
      [(d) => ((at(d, 2).grade as Mutable).marginPts = Infinity), 'decisions[2].grade.marginPts'],
      [(d) => (at(d, 0).hinted = 'no'), 'decisions[0].hinted'],
      [
        (d) => (((at(d, 1).opponentBasis as Mutable[])[0] as Mutable).seat = 9),
        'decisions[1].opponentBasis[0].seat',
      ],
      [(d) => (at(d, 0).explanation = ''), 'decisions[0].explanation'],
      [(d) => (at(d, 0).explanation = 'x'.repeat(2001)), 'decisions[0].explanation'],
      [
        (d) => (((at(d, 1).opponentBasis as Mutable[])[0] as Mutable).text = ''),
        'decisions[1].opponentBasis[0].text',
      ],
      [
        (d) => (((at(d, 1).opponentBasis as Mutable[])[0] as Mutable).text = 'x'.repeat(201)),
        'decisions[1].opponentBasis[0].text',
      ],
      [(d) => (at(d, 0).alternative = 'limp'), 'decisions[0].alternative'],
      [(d) => ((at(d, 0).recommended as Mutable).seat = 2), 'decisions[0].recommended.seat'],
      [
        (d) =>
          ((at(d, 0).action as Mutable).amount = Number((at(d, 0).action as Mutable).amount) + 4),
        'decisions[0].action',
      ],
      [
        (d) =>
          ((at(d, 3).action as Mutable).amount = Number((at(d, 3).action as Mutable).amount) + 4),
        'decisions[3].action',
      ],
      [(d) => d.push(structuredClone(at(d, 3))), 'decisions'],
      [(d) => ((at(d, 3).action as Mutable).type = 'fold'), 'decisions[3].action'],
      [(d) => d.splice(1, 2, at(d, 2), at(d, 1)), 'decisions[1].street'],
      [(d) => d.splice(0, 2, at(d, 1), at(d, 0)), 'decisions[0].street'],
    ];
    for (const [change, field] of faults) {
      expect(() => parseHandRecord(changed(record, change)), field).toThrow(
        new RangeError(`Invalid hand record: ${field}`),
      );
    }
  });

  it('decisionRecord copies the advice of the hint path', () => {
    expect(userAdviceOptions(undefined)).toBe(ACTION_RANGE_ADVICE);
    const decisions = done(REVIEW_FOUR).userDecisions;
    for (const decision of decisions) {
      expect(decision.observed).toBeUndefined();
      const view = structuredClone(decision.view);
      const entry = decisionRecord(decision);
      const result = gradeView(decision.view, decision.action.type, ACTION_RANGE_ADVICE);
      const advice = result.recommendation;
      expect(entry.recommended).toEqual(advice.move);
      expect(entry.action).toEqual(decision.action);
      expect(entry.action).not.toBe(decision.action);
      expect(entry.grade).toEqual({
        grade: result.grade,
        ruleId: result.ruleId,
        marginPts: result.marginPts,
      });
      expect(entry.explanation).toBe(advice.explanation);
      expect(entry.alternative).toBe(advice.alternative);
      expect(entry.hinted).toBe(false);
      if (advice.basis === 'equity') {
        expect(entry).toMatchObject({
          ruleId: advice.ruleId,
          equityPct: advice.equityPct,
          requiredEquityPct: advice.requiredEquityPct,
          opponentBasis: advice.opponentBasis,
        });
      }
      expect(JSON.parse(JSON.stringify(entry))).toStrictEqual(entry);

      const mutable = entry as unknown as Mutable;
      (mutable.action as Mutable).type = 'fold';
      (mutable.recommended as Mutable).seat = 99;
      for (const basis of mutable.opponentBasis as Mutable[]) basis.text = 'changed';
      expect(decision.view).toEqual(view);
      expect(decisionRecord(decision)).toEqual(decisionRecord(decision));
      expect(decisionRecord(decision).action.type).toBe(decision.action.type);

      const input = structuredClone(decision);
      const kept = decisionRecord(input);
      const keptJson = JSON.stringify(kept);
      for (const move of [input.action, ...input.view.legalActions] as Mutable[]) {
        move.seat = 99;
        move.type = 'check';
        move.amount = 999;
      }
      expect(JSON.stringify(kept)).toBe(keptJson);
    }

    const observed = [{ seat: 2, hands: 40, vpip: 20, pfr: 10 }];
    const decision = decisions[1] as CompletedHand['userDecisions'][number];
    const withSnapshot = { ...decision, observed };
    const entry = decisionRecord(withSnapshot) as unknown as Mutable;
    for (const basis of entry.opponentBasis as Mutable[]) basis.seat = 7;
    expect(observed).toEqual([{ seat: 2, hands: 40, vpip: 20, pfr: 10 }]);
    expect(withSnapshot.observed).toBe(observed);
  });
});
