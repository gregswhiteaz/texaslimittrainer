import { describe, expect, it } from 'vitest';
import { gradeDecision } from '../../src/advice/grade';
import type { PostflopRecommendation } from '../../src/advice/postflop';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, recommend, type Recommendation } from '../../src/advice/recommend';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { handleAdviceRequest, type AdviceResponse } from '../../src/table/advice-service';
import { reviewEntries } from '../../src/table/review';
import {
  applyUserAction,
  completedHand,
  userActions,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import { play, userTableAfter } from '../support/table-scenarios';

// About 15 s plain; coverage instrumentation in `npm test` makes the 1,000 sampled-equity advices 6-9x slower.
const AC4_TIMEOUT_MS = 300_000;
const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const USER: SeatNumber = 5;
const BEN: SeatNumber = 2;

/** The user (seat 5) holds Ah 9s; Ben (seat 2) defends his big blind and checks the Ks 9d 4c flop to the user. */
const USER_FLOP_TURN = userTableAfter(
  { 1: 'Kd', 7: '7c', 4: 'Ah', 10: '9s', 13: 'Ks', 14: '9d', 15: '4c', 17: '2h', 19: '6s' },
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check',
);
/** Ben at 29 hands: typical player (the snapshot at the decision). */
const AT_DECISION: ObservedOpponent[] = [{ seat: BEN, hands: 29, vpip: 60, pfr: 5 }];
/** Ben after more hands: a tight player. */
const LATER: ObservedOpponent[] = [{ seat: BEN, hands: 100, vpip: 10, pfr: 8 }];

const valueOf = (response: AdviceResponse) => {
  if (!response.ok) throw new Error(`${response.error.name}: ${response.error.message}`);
  return response.value;
};

/** The user checks the flop with `observed`, then the hand checks down. */
function checkedDown(observed: readonly ObservedOpponent[]): CompletedHand {
  const check = userActions(USER_FLOP_TURN).find((a) => a.type === 'check') as Action;
  const table: TableState = applyUserAction(USER_FLOP_TURN, check, observed);
  const hand = completedHand({
    ...table,
    hand: play(table.hand as HandState, '2:check 5:check 2:check 5:check'),
  });
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

/** Positions 1 and 7 deal the BB (seat 3) at button 1 on six seats; 13-15 are the flop. */
const HERO_AND_BOARD: Readonly<Record<number, string>> = {
  1: 'Kc',
  7: 'Qd',
  13: '7h',
  14: '8s',
  15: '2d',
};
const FIXED_POSITIONS = Object.keys(HERO_AND_BOARD).map(Number);
const FIXED_CARDS = parseCards(Object.values(HERO_AND_BOARD).join(' '));
/** UTG (4) opens, CO (6) calls, the BB (3) calls; on the flop the BB checks, UTG bets and CO calls. */
const MOVES: [SeatNumber, Action['type']][] = [
  [4, 'raise'],
  [5, 'fold'],
  [6, 'call'],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call'],
  [3, 'check'],
  [4, 'bet'],
  [6, 'call'],
];
const SNAPSHOT: ObservedOpponent[] = [
  { seat: 4, hands: 60, vpip: 18, pfr: 14 },
  { seat: 6, hands: 45, vpip: 40, pfr: 8 },
];

/** The fixed cards at their positions; every other position from a Fisher-Yates shuffle seeded by `seed`. */
function variedDeck(seed: number): Card[] {
  const rest = Array.from({ length: 52 }, (_, card) => card).filter(
    (card) => !FIXED_CARDS.includes(card),
  );
  const random = new Xoshiro128(seed);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = random.nextInt(i + 1);
    [rest[i], rest[j]] = [rest[j] as Card, rest[i] as Card];
  }
  return Array.from({ length: 52 }, (_, position) => {
    const fixed = FIXED_POSITIONS.indexOf(position);
    return fixed >= 0 ? (FIXED_CARDS[fixed] as Card) : (rest.shift() as Card);
  });
}

function heroDecision(deck: readonly Card[]): { state: HandState; view: PlayerView } {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: 6 }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type] of MOVES) {
    if (state.toAct !== seat) throw new Error(`Seat ${state.toAct} is to act, not ${seat}`);
    const action = legalActions(state).find((a) => a.type === type);
    const applied = action === undefined ? undefined : applyAction(state, action);
    if (applied === undefined || !applied.ok) throw new Error(`Seat ${seat} cannot ${type}`);
    state = applied.state;
  }
  return { state, view: playerView(state, 3) };
}

describe('advice determinism acceptance', () => {
  it('AC#3 review uses the decision-time snapshot', () => {
    const hand = checkedDown(AT_DECISION);
    const decision = hand.userDecisions[1];
    if (decision === undefined) throw new Error('No flop decision');
    const view = decision.view;
    expect(view.street).toBe('flop');
    expect(view.seat).toBe(USER);

    const hint = valueOf(
      handleAdviceRequest({ id: 1, kind: 'recommend', view, observed: AT_DECISION }),
    ) as PostflopRecommendation;
    const later = recommend(view, {
      opponentRanges: 'actions',
      observedOpponents: LATER,
    }) as PostflopRecommendation;
    expect(later.basis).toBe('equity');
    expect(hint.basis).toBe('equity');
    expect(later.equityPct).not.toBe(hint.equityPct);

    for (const options of [
      ACTION_RANGE_ADVICE,
      { ...ACTION_RANGE_ADVICE, observedOpponents: LATER },
    ]) {
      const review = reviewEntries(hand, options)[1]?.result.recommendation;
      if (review === undefined || review.basis !== 'equity' || hint.basis !== 'equity') {
        throw new Error('Expected postflop advice');
      }
      expect(review.action).toBe(hint.action);
      expect(review.move).toEqual(hint.move);
      expect(review.equityPct).toBe(hint.equityPct);
      expect(review.requiredEquityPct).toBe(hint.requiredEquityPct);
      expect(review.explanation).toBe(hint.explanation);
      expect(review.basis).toBe(hint.basis);
      expect(review.opponentBasis).toEqual(hint.opponentBasis);
      expect(review).toStrictEqual(hint);
    }
  });

  it(
    'AC#4 hidden cards never change hint or grade',
    () => {
      const first = heroDecision(variedDeck(1));
      const firstHint = recommend(first.view, {
        opponentRanges: 'actions',
        observedOpponents: SNAPSHOT,
      });
      expect(firstHint.basis === 'equity' && firstHint.equityMethod).toBe('sampled');
      expect(first.view.legalActions.some((a) => a.type === 'call')).toBe(true);
      expect(first.state.players.filter((p) => !p.folded && p.seat !== 3)).toHaveLength(2);
      const firstGrade = gradeDecision(firstHint, 'call');
      const othersOf = (state: HandState) =>
        state.players.filter((p) => p.seat !== 3).map((p) => p.holeCards.join(','));
      const firstOthers = othersOf(first.state).join('|');
      let differing = 0;
      for (let seed = 2; seed <= 1000; seed++) {
        const { state, view } = heroDecision(variedDeck(seed));
        expect(view).toStrictEqual(first.view);
        const hint = recommend(view, { opponentRanges: 'actions', observedOpponents: SNAPSHOT });
        expect(hint).toStrictEqual(firstHint);
        expect(gradeDecision(hint, 'call')).toStrictEqual(firstGrade);
        if (othersOf(state).join('|') !== firstOthers) differing++;
      }
      expect(differing).toBeGreaterThanOrEqual(900);
    },
    AC4_TIMEOUT_MS,
  );

  it('AC#6 stored recommendation regrades to a deep-equal GradeResult', () => {
    const hand = checkedDown(AT_DECISION);
    expect(hand.userDecisions.map((d) => d.view.street)).toEqual(['preflop', 'flop']);
    const entries = reviewEntries(hand, ACTION_RANGE_ADVICE);
    hand.userDecisions.forEach(({ view, action, observed }, i) => {
      const withObserved = observed === undefined ? {} : { observed };
      if (view.street === 'flop') expect(observed).toStrictEqual(AT_DECISION);
      const stored = structuredClone(
        valueOf(handleAdviceRequest({ id: i, kind: 'recommend', view, ...withObserved })),
      ) as Recommendation;
      const shown = gradeDecision(stored, action.type);
      expect(shown).toStrictEqual(entries[i]?.result);
      const graded = valueOf(
        handleAdviceRequest({
          id: i,
          kind: 'grade',
          view,
          userAction: action.type,
          ...withObserved,
        }),
      );
      expect(graded).toStrictEqual(shown);
      expect(graded).toStrictEqual(entries[i]?.result);
    });
  });
});
