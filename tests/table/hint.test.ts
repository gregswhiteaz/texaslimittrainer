import { describe, expect, it } from 'vitest';
import type { PostflopRecommendation } from '../../src/advice/postflop';
import { recommend, type Recommendation } from '../../src/advice/recommend';
import type { Action, HandState } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import {
  hintArrived,
  hintCard,
  hintFailed,
  hintInput,
  NO_HINT,
  requestHint,
  shownHint,
  toggleHint,
  type HintCardView,
  type HintState,
} from '../../src/table/hint';
import { configForGameType, type TableState } from '../../src/table/session';
import {
  CALL_ALL_IN,
  FLOP_BET,
  PREFLOP,
  PREFLOP_DECISION,
  RIVER,
} from '../support/table-scenarios';

const userView = (t: TableState): PlayerView => playerView(t.hand as HandState, t.config.userSeat);

const CARD: HintCardView = {
  action: 'Call $4',
  chartBasis: null,
  equity: '50.0%',
  requiredEquity: '13.3%',
  explanation: 'Because.',
  opponents: [],
};

/** A postflop recommendation moving `move`, without running the engine. */
function postflop(move: Action, equityPct: number): PostflopRecommendation {
  return {
    basis: 'equity',
    street: 'flop',
    action: move.type,
    alternative: null,
    move,
    ruleId: 'pot-odds-call',
    equityPct,
    requiredEquityPct: 42.857,
    callAmount: 4,
    pot: 26,
    opponents: 1,
    equityMethod: 'exact',
    equityVsCallingRangePct: equityPct,
    impliedRequiredEquityPct: null,
    outs: [],
    opponentBasis: [
      { seat: 2, observedHands: 45, text: 'based on 45 hands of this opponent' },
      { seat: 6, observedHands: null, text: 'typical player' },
    ],
    explanation: 'Your equity, 12.0%, beats   the price. Call.',
  };
}

describe('hint', () => {
  it('hint state machine', () => {
    const a = FLOP_BET.hand as HandState;
    const b = RIVER.hand as HandState;

    const opened = toggleHint(NO_HINT, a);
    expect(opened).toEqual({
      state: { open: true, decision: a, card: null, failed: false },
      request: true,
    });
    expect(shownHint(opened.state, a, true)).toBe('loading');

    const ready = hintArrived(opened.state, a, CARD);
    expect(ready.card).toBe(CARD);
    expect(shownHint(ready, a, true)).toBe('ready');
    expect(hintArrived(ready, b, { ...CARD, action: 'Fold' })).toBe(ready);
    expect(hintFailed(ready, b)).toBe(ready);

    const closed = toggleHint(ready, a);
    expect(closed).toEqual({ state: { ...ready, open: false }, request: false });
    expect(shownHint(closed.state, a, true)).toBe('none');

    const reopened = toggleHint(closed.state, a);
    expect(reopened).toEqual({ state: { ...ready, open: true }, request: false });
    expect(reopened.state.card).toBe(CARD);

    // A new decision starts over, even with a cached card for the old one.
    expect(toggleHint(closed.state, b)).toEqual({
      state: { open: true, decision: b, card: null, failed: false },
      request: true,
    });

    const failed = hintFailed(opened.state, a);
    expect(failed.failed).toBe(true);
    expect(shownHint(failed, a, true)).toBe('error');
    const failedClosed = toggleHint(failed, a).state;
    expect(toggleHint(failedClosed, a)).toEqual({
      state: { open: true, decision: a, card: null, failed: false },
      request: true,
    });

    const both: HintState = { open: true, decision: a, card: CARD, failed: true };
    expect(shownHint(both, a, true)).toBe('error');
    expect(shownHint(ready, b, true)).toBe('none');
    expect(shownHint(ready, a, false)).toBe('none');
    expect(shownHint(ready, null, true)).toBe('none');
    expect(shownHint(NO_HINT, a, true)).toBe('none');
  });

  it('hint input and request only on the user turn', async () => {
    expect(hintInput(PREFLOP, {})).toBeNull();
    const input = hintInput(FLOP_BET, {});
    expect(input).toEqual({ view: userView(FLOP_BET), observed: [] });
    const calls: unknown[][] = [];
    const advisor = {
      recommend: (...args: unknown[]) => {
        calls.push(args);
        return Promise.resolve({} as Recommendation);
      },
    };
    await expect(requestHint(advisor, PREFLOP, {})).rejects.toThrow(
      new RangeError("Not the user's turn"),
    );
    expect(calls).toEqual([]);
    await requestHint(advisor, FLOP_BET, {});
    expect(calls).toEqual([[userView(FLOP_BET), []]]);
  });

  it('hint card model', () => {
    const view = userView(FLOP_BET);
    const call = view.legalActions.find((a) => a.type === 'call') as Action;
    const rec = postflop(call, 12);
    const card = hintCard(rec, view, FLOP_BET);
    expect(card).toEqual({
      action: 'Call $4',
      chartBasis: null,
      equity: '12.0%',
      requiredEquity: '42.9%',
      explanation: rec.explanation,
      opponents: [
        { seat: 2, name: 'Ben', basis: 'based on 45 hands of this opponent' },
        { seat: 6, name: 'Eli', basis: 'typical player' },
      ],
    });
    expect(card.explanation).toBe(rec.explanation);

    const raise = view.legalActions.find((a) => a.type === 'raise') as Action;
    const sitAndGo: TableState = {
      ...FLOP_BET,
      config: configForGameType(FLOP_BET.config, 'sit-and-go', { smallBet: 4, bigBet: 8 }),
    };
    expect(hintCard(postflop(raise, 60), view, sitAndGo).action).toBe('Raise to 8');
    expect(hintCard(postflop(raise, 60), view, FLOP_BET).action).toBe('Raise to $8');

    const shortView = userView(CALL_ALL_IN);
    const shortCall = shortView.legalActions.find((a) => a.type === 'call') as Action;
    expect(hintCard(postflop(shortCall, 30), shortView, CALL_ALL_IN).action).toBe('Call all-in $3');

    const preView = userView(PREFLOP_DECISION);
    const pre = recommend(preView);
    const preCard = hintCard(pre, preView, PREFLOP_DECISION);
    expect(preCard).toEqual({
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
  });
});
