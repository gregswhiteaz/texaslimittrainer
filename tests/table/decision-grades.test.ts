import { describe, expect, it } from 'vitest';
import { formatPct } from '../../src/advice/explain';
import type { GradeResult } from '../../src/advice/grade';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { recommend, type Recommendation } from '../../src/advice/recommend';
import { playerView } from '../../src/engine/player-view';
import { handleAdviceRequest, type AdviceRequest } from '../../src/table/advice-service';
import {
  gradedDecisions,
  NO_GRADES,
  requestNewGrades,
  type DecisionGrades,
} from '../../src/table/decision-grades';
import {
  decisionEntry,
  decisionRecord,
  handRecord,
  type HandRecordDecision,
} from '../../src/table/hand-record';
import { hintCard } from '../../src/table/hint';
import { storedReviewEntries } from '../../src/table/review';
import {
  completedHand,
  dealHand,
  nextHand,
  type CompletedHand,
  type TableState,
  type UserDecision,
} from '../../src/table/session';
import { AdviceClient, type WorkerLike } from '../../src/ui/advice/advice-client';
import { reviewGraded, type HeldReview } from '../../src/ui/table/Table';
import { requestDecisionGrade } from '../../src/ui/table/useTableSession';
import {
  CALL_THEN_FOLD,
  FLOP_BET,
  PREFLOP_DECISION,
  SCENARIO_CODE,
  SHOWDOWN,
  STORYBOARD_HISTORY,
} from '../support/table-scenarios';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

/** A stand-in entry naming the decision it was requested for. */
function entryFor(decision: UserDecision): HandRecordDecision {
  return { explanation: `${decision.view.street} ${decision.action.type}` } as HandRecordDecision;
}

/** A worker that records every request and answers it through handleAdviceRequest. */
function answeringWorker(posted: AdviceRequest[]): WorkerLike {
  const listeners = new Set<(event: MessageEvent) => void>();
  return {
    postMessage: (request: AdviceRequest) => {
      posted.push(request);
      const data = handleAdviceRequest(structuredClone(request));
      queueMicrotask(() => {
        for (const listener of listeners) listener({ data } as MessageEvent);
      });
    },
    addEventListener: (type: string, listener: (event: MessageEvent) => void) => {
      if (type === 'message') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: (event: MessageEvent) => void) => {
      if (type === 'message') listeners.delete(listener);
    },
    terminate: () => undefined,
  } as unknown as WorkerLike;
}

const snapshot: ObservedOpponent[] = [{ seat: 2, hands: 40, vpip: 60, pfr: 5 }];

describe('decision grades', () => {
  it('each decision is requested once when it appears', async () => {
    const calls: { decision: UserDecision; state: number }[] = [];
    let state = -1;
    const request = (decision: UserDecision): Promise<HandRecordDecision> => {
      calls.push({ decision, state });
      return Promise.resolve(entryFor(decision));
    };
    let grades: DecisionGrades = NO_GRADES;
    STORYBOARD_HISTORY.forEach((table, i) => {
      state = i;
      grades = requestNewGrades(grades, table, request);
      const again = requestNewGrades(grades, table, request);
      expect(again).toBe(grades);
    });
    expect(STORYBOARD_HISTORY.at(-1)).toBe(SHOWDOWN);
    expect(calls).toHaveLength(4);
    calls.forEach(({ decision, state: at }, i) => {
      const first = STORYBOARD_HISTORY.findIndex((t) => t.userDecisions.length === i + 1);
      expect(at).toBe(first);
      const expected = SHOWDOWN.userDecisions[i] as UserDecision;
      expect(decision).toBe(expected);
      expect(decision.view).toBe(expected.view);
      expect(decision.action).toBe(expected.action);
      expect(decision.observed).toBe(expected.observed);
    });

    const entries = await gradedDecisions(grades, SHOWDOWN);
    expect(entries.map((e) => e.explanation)).toEqual([
      'preflop raise',
      'flop call',
      'turn bet',
      'river check',
    ]);

    const next = dealHand(nextHand(SHOWDOWN), SCENARIO_CODE);
    expect(next.handNumber).toBe(SHOWDOWN.handNumber + 1);
    const fresh = requestNewGrades(grades, next, request);
    expect(fresh).toEqual({ handNumber: next.handNumber, pending: [] });
    expect(calls).toHaveLength(4);
    await expect(gradedDecisions(grades, next)).rejects.toThrow(
      new RangeError('Grades do not match the decisions'),
    );
    await expect(gradedDecisions(NO_GRADES, SHOWDOWN)).rejects.toThrow(
      new RangeError('Grades do not match the decisions'),
    );
    const partial = requestNewGrades(NO_GRADES, FLOP_BET, request);
    await expect(gradedDecisions(partial, SHOWDOWN)).rejects.toThrow(
      new RangeError('Grades do not match the decisions'),
    );

    const failure = new Error('Advice worker failed: error');
    let n = 0;
    const failing = requestNewGrades(NO_GRADES, SHOWDOWN, (d) =>
      n++ === 2 ? Promise.reject(failure) : Promise.resolve(entryFor(d)),
    );
    await expect(gradedDecisions(failing, SHOWDOWN)).rejects.toBe(failure);

    const posted: AdviceRequest[] = [];
    const client = new AdviceClient({
      postMessage: (request: AdviceRequest) => posted.push(request),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      terminate: () => undefined,
    } as unknown as WorkerLike);
    const view = (FLOP_BET.userDecisions.at(-1) as UserDecision).view;
    // Never answered: disposing the client at the end rejects them.
    const unanswered = [client.grade(view, 'call', snapshot), client.grade(view, 'call')];
    expect(posted).toEqual([
      { id: 1, kind: 'grade', view, userAction: 'call', observed: snapshot },
      { id: 2, kind: 'grade', view, userAction: 'call' },
    ]);
    expect(Object.hasOwn(posted[1] as object, 'observed')).toBe(false);
    client.dispose();
    for (const p of unanswered) await expect(p).rejects.toThrow('Advice client disposed');
  });

  it('review model edges', () => {
    const hand = done(SHOWDOWN);
    const decisions = hand.userDecisions.map(decisionRecord);
    const message = 'Review needs one stored decision per user decision';
    expect(() => storedReviewEntries(hand, [])).toThrow(new RangeError(message));
    const swapped = [decisions[1], decisions[0], ...decisions.slice(2)] as HandRecordDecision[];
    expect(() => storedReviewEntries(hand, swapped)).toThrow(new RangeError(message));
    expect(storedReviewEntries({ ...hand, userDecisions: [] }, [])).toEqual([]);

    const entries = storedReviewEntries(hand, decisions);
    const flop = entries[1];
    expect(flop?.decision).toBe(decisions[1]);
    (flop?.board as number[]).push(0);
    expect((hand.userDecisions[1] as UserDecision).view.board).toHaveLength(3);
    expect(flop?.equity).toBe(formatPct(decisions[1]?.equityPct as number));

    const callThenFold = done(CALL_THEN_FOLD);
    const preflopOnly = storedReviewEntries(
      callThenFold,
      callThenFold.userDecisions.map(decisionRecord),
    );
    expect(preflopOnly.map((e) => e.street)).toEqual(['preflop', 'preflop']);
    for (const e of preflopOnly) {
      expect(e.chartBasis).toMatch(/^From the 6-max chart: /);
      expect(e.equity).toBeNull();
      expect(e.requiredEquity).toBeNull();
    }

    const meta = {
      sessionId: '0123456789abcdef0123456789abcdef',
      handNumber: 1,
      config: SHOWDOWN.config,
      completedAt: new Date(0),
    };
    expect(() => handRecord(hand, meta, decisions.slice(1))).toThrow(
      new RangeError('Invalid hand record: decisions'),
    );

    const held: HeldReview = { hand, entries: null, open: true };
    expect(reviewGraded(null, hand, entries)).toBeNull();
    expect(reviewGraded(held, callThenFold, entries)).toBe(held);
    expect(reviewGraded(held, hand, entries)).toEqual({ hand, entries, open: true });
    expect(reviewGraded(held, hand, entries)?.entries).toBe(entries);

    const preView = playerView(PREFLOP_DECISION.hand as NonNullable<TableState['hand']>, 5);
    const pre = recommend(preView);
    expect(hintCard(pre, preView, PREFLOP_DECISION)).toEqual({
      action: 'Raise to $8',
      chartBasis: 'From the 6-max chart: raise A9o from the cutoff',
      equity: null,
      requiredEquity: null,
      explanation: pre.explanation,
      opponents: [
        { seat: 1, name: 'Ava', basis: 'typical player' },
        { seat: 2, name: 'Ben', basis: 'typical player' },
        { seat: 6, name: 'Eli', basis: 'typical player' },
      ],
    });
    const flopView = playerView(FLOP_BET.hand as NonNullable<TableState['hand']>, 5);
    const post = recommend(flopView);
    if (post.basis !== 'equity') throw new Error('Expected postflop advice');
    expect(hintCard(post, flopView, FLOP_BET)).toEqual({
      action: 'Call $4',
      chartBasis: null,
      equity: formatPct(post.equityPct),
      requiredEquity: formatPct(post.requiredEquityPct),
      explanation: post.explanation,
      opponents: [
        { seat: 2, name: 'Ben', basis: 'typical player' },
        { seat: 6, name: 'Eli', basis: 'typical player' },
      ],
    });
  });

  it('the grade reply becomes the stored entry', async () => {
    const hand = done(SHOWDOWN);
    for (const decision of hand.userDecisions) {
      const reply = handleAdviceRequest({
        id: 1,
        kind: 'grade',
        view: decision.view,
        userAction: decision.action.type,
        ...(decision.observed === undefined ? {} : { observed: decision.observed }),
      });
      if (!reply.ok) throw new Error(reply.error.message);
      const result = reply.value as GradeResult<Recommendation>;
      const entry = decisionEntry(result, decision);
      expect(entry).toEqual(decisionRecord(decision));
      expect(entry.hinted).toBe(false);
      expect(decisionEntry(result, { ...decision, hinted: true }).hinted).toBe(true);
      expect(entry.recommended).not.toBe(result.recommendation.move);
    }

    // The app-wide client does not exist yet: a failing create rejects instead of throwing.
    let failed: Promise<HandRecordDecision> | undefined;
    expect(() => {
      failed = requestDecisionGrade(() => {
        throw new Error('no worker');
      }, hand.userDecisions[0] as UserDecision);
    }).not.toThrow();
    await expect(failed).rejects.toThrow('no worker');

    const posted: AdviceRequest[] = [];
    // The same decisions with a snapshot, so their requests carry it.
    const observed = hand.userDecisions.map((d) => ({ ...d, observed: snapshot }));
    const create = (): WorkerLike => answeringWorker(posted);
    for (const decision of [...hand.userDecisions, ...observed]) {
      await expect(requestDecisionGrade(create, decision)).resolves.toEqual(
        decisionRecord(decision),
      );
    }
    expect(posted.map((r) => r.kind)).toEqual(Array<string>(8).fill('grade'));
    expect(posted.slice(4).every((r) => r.kind === 'grade' && r.observed !== undefined)).toBe(true);
    expect(posted.slice(0, 4).every((r) => !Object.hasOwn(r, 'observed'))).toBe(true);
  });
});
