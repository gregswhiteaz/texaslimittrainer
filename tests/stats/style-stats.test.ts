import { describe, expect, it } from 'vitest';
import type { ActionRecord, HandResult, SeatNumber } from '../../src/engine/hand';
import { runPlaytest } from '../../src/playtest/runner';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  formatStat,
  handStyleCounts,
  styleCounts,
  type StatHand,
  type StyleCounts,
} from '../../src/stats/style-stats';
import type { CompletedHand } from '../../src/table/session';

const act = (
  street: ActionRecord['street'],
  seat: SeatNumber,
  type: ActionRecord['type'],
): ActionRecord => ({ street, seat, type, amount: 0, added: 0 });
const pre = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord =>
  act('preflop', seat, type);
const BOARD = [10, 20, 30, 40, 50];
const awardTo = (...winners: [SeatNumber, number][]): HandResult['awards'] => [
  {
    pot: 0,
    amount: winners.reduce((sum, [, amount]) => sum + amount, 0),
    winners: winners.map(([seat, amount]) => ({ seat, amount })),
  },
];
const statHand = (
  actions: readonly ActionRecord[],
  board: number,
  result: HandResult,
): StatHand => ({
  seats: [{ seat: 1 }, { seat: 5 }, { seat: 6 }],
  actions,
  board: BOARD.slice(0, board),
  result,
});

describe('style stats units', () => {
  it('edge hands: all-in, runout, muck, returned bet, side pot, fold-out', () => {
    // (a) all-in preflop (raise), runout to showdown with no flop actions.
    const allInRaise = statHand(
      [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(5, 'raise'), pre(1, 'fold'), pre(6, 'call')],
      5,
      { endedBy: 'showdown', showdown: [], awards: awardTo([6, 20]) },
    );
    expect(handStyleCounts(allInRaise, 5)).toMatchObject({
      voluntary: 1,
      preflopRaised: 1,
      sawFlop: 1,
      showdowns: 1,
      showdownsWon: 0,
      postflopAggressive: 0,
      postflopCalls: 0,
    });
    // (a) all-in preflop by calling.
    const allInCall = statHand(
      [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(6, 'raise'), pre(5, 'call'), pre(1, 'fold')],
      5,
      { endedBy: 'showdown', showdown: [], awards: awardTo([5, 20]) },
    );
    expect(handStyleCounts(allInCall, 5)).toMatchObject({
      voluntary: 1,
      preflopRaised: 0,
      sawFlop: 1,
      showdowns: 1,
      showdownsWon: 1,
    });

    // (b) all-in big blind that never acts: not voluntary, still sees the flop and the showdown.
    const allInBlind = statHand(
      [pre(6, 'small-blind'), pre(5, 'big-blind'), pre(1, 'raise'), pre(6, 'fold')],
      5,
      { endedBy: 'showdown', showdown: [], awards: awardTo([5, 6]) },
    );
    expect(handStyleCounts(allInBlind, 5)).toMatchObject({
      handsDealt: 1,
      voluntary: 0,
      sawFlop: 1,
      showdowns: 1,
      showdownsWon: 1,
    });

    // (c) mucked loser: absent from result.showdown, still a showdown, not won.
    const mucked = statHand(
      [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(5, 'call'), pre(1, 'fold'), pre(6, 'check')],
      5,
      {
        endedBy: 'showdown',
        showdown: [{ seat: 6, holeCards: [1, 2], rank: 1000 }],
        awards: awardTo([6, 12]),
      },
    );
    expect(handStyleCounts(mucked, 5)).toMatchObject({ showdowns: 1, showdownsWon: 0 });

    // (d) only money back is an uncalled bet.
    const returned = statHand(
      [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(5, 'raise'), pre(1, 'fold'), pre(6, 'call')],
      5,
      {
        endedBy: 'showdown',
        showdown: [],
        awards: awardTo([6, 20]),
        returned: { seat: 5, amount: 8 },
      },
    );
    expect(handStyleCounts(returned, 5)).toMatchObject({ showdowns: 1, showdownsWon: 0 });

    // (e) wins only a side pot.
    const sidePot = statHand(
      [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(5, 'raise'), pre(1, 'call'), pre(6, 'call')],
      5,
      {
        endedBy: 'showdown',
        showdown: [],
        awards: [
          { pot: 0, amount: 18, winners: [{ seat: 1, amount: 18 }] },
          { pot: 1, amount: 10, winners: [{ seat: 5, amount: 10 }] },
        ],
      },
    );
    expect(handStyleCounts(sidePot, 5)).toMatchObject({ showdowns: 1, showdownsWon: 1 });

    // (f) river bet, everyone folds: no showdown, one aggressive action.
    const riverFoldOut = statHand(
      [
        pre(1, 'small-blind'),
        pre(6, 'big-blind'),
        pre(5, 'call'),
        pre(1, 'fold'),
        pre(6, 'check'),
        act('flop', 6, 'check'),
        act('flop', 5, 'check'),
        act('turn', 6, 'check'),
        act('turn', 5, 'check'),
        act('river', 6, 'check'),
        act('river', 5, 'bet'),
        act('river', 6, 'fold'),
      ],
      5,
      { endedBy: 'fold', showdown: [], awards: awardTo([5, 8]) },
    );
    expect(handStyleCounts(riverFoldOut, 5)).toMatchObject({
      sawFlop: 1,
      showdowns: 0,
      showdownsWon: 0,
      postflopAggressive: 1,
      postflopCalls: 0,
    });
  });

  it('undealt seats, sums, purity and formatting', () => {
    const a = statHand(
      [
        pre(1, 'small-blind'),
        pre(6, 'big-blind'),
        pre(5, 'raise'),
        pre(1, 'fold'),
        pre(6, 'call'),
        act('flop', 6, 'bet'),
        act('flop', 5, 'raise'),
        act('flop', 6, 'call'),
      ],
      5,
      { endedBy: 'showdown', showdown: [], awards: awardTo([5, 30]) },
    );
    const b = statHand(
      [pre(5, 'small-blind'), pre(6, 'big-blind'), pre(1, 'call'), pre(5, 'call'), pre(6, 'check')],
      3,
      { endedBy: 'fold', showdown: [], awards: awardTo([1, 6]) },
    );
    const before = structuredClone([a, b]);

    expect(handStyleCounts(a, 9)).toEqual(EMPTY_STYLE_COUNTS);
    expect(Object.isFrozen(EMPTY_STYLE_COUNTS)).toBe(true);

    const x: StyleCounts = {
      handsDealt: 1,
      voluntary: 2,
      preflopRaised: 3,
      postflopAggressive: 4,
      postflopCalls: 5,
      sawFlop: 6,
      showdowns: 7,
      showdownsWon: 8,
    };
    const y: StyleCounts = {
      handsDealt: 10,
      voluntary: 20,
      preflopRaised: 30,
      postflopAggressive: 40,
      postflopCalls: 50,
      sawFlop: 60,
      showdowns: 70,
      showdownsWon: 80,
    };
    expect(addStyleCounts(x, y)).toEqual({
      handsDealt: 11,
      voluntary: 22,
      preflopRaised: 33,
      postflopAggressive: 44,
      postflopCalls: 55,
      sawFlop: 66,
      showdowns: 77,
      showdownsWon: 88,
    });

    const folded = [a, b].reduce(
      (sum, h) => addStyleCounts(sum, handStyleCounts(h, 5)),
      EMPTY_STYLE_COUNTS,
    );
    expect(styleCounts([a, b], 5)).toEqual(folded);
    expect(folded).toEqual({
      handsDealt: 2,
      voluntary: 2,
      preflopRaised: 1,
      postflopAggressive: 1,
      postflopCalls: 0,
      sawFlop: 2,
      showdowns: 1,
      showdownsWon: 1,
    });
    expect(styleCounts([], 5)).toEqual(EMPTY_STYLE_COUNTS);
    expect([a, b]).toEqual(before);

    expect(formatStat(100 / 3)).toBe('33%');
    expect(formatStat(200 / 3)).toBe('67%');
    expect(formatStat(0)).toBe('0%');
    expect(formatStat(100)).toBe('100%');
  });

  it('real playtest hands satisfy the count invariants', () => {
    const seats = [1, 2, 3, 4, 5, 6] as const;
    const totals = new Map<SeatNumber, StyleCounts>(seats.map((s) => [s, EMPTY_STYLE_COUNTS]));
    let seatsDealt = 0;
    let completed = 0;
    runPlaytest({ hands: 300, seed: 42, size: 6 }, (played) => {
      const { result } = played.final;
      if (result === null) return;
      completed++;
      const hand: StatHand = {
        seats: played.record.seats,
        actions: played.final.actions,
        board: played.final.board,
        result,
      };
      seatsDealt += played.record.seats.length;
      const perSeat = seats.map((s) => handStyleCounts(hand, s));
      const showdowns = perSeat.filter((c) => c.showdowns === 1).length;
      const won = perSeat.filter((c) => c.showdownsWon === 1).length;
      if (result.endedBy === 'showdown') {
        expect(showdowns).toBeGreaterThanOrEqual(2);
        expect(won).toBeGreaterThanOrEqual(1);
      } else {
        expect(showdowns).toBe(0);
      }
      seats.forEach((s, i) =>
        totals.set(s, addStyleCounts(totals.get(s) as StyleCounts, perSeat[i] as StyleCounts)),
      );
    });
    expect(completed).toBeGreaterThan(0);
    let dealtSum = 0;
    for (const c of totals.values()) {
      dealtSum += c.handsDealt;
      expect(c.preflopRaised).toBeLessThanOrEqual(c.voluntary);
      expect(c.voluntary).toBeLessThanOrEqual(c.handsDealt);
      expect(c.handsDealt).toBeLessThanOrEqual(300);
      expect(c.showdownsWon).toBeLessThanOrEqual(c.showdowns);
      expect(c.showdowns).toBeLessThanOrEqual(c.sawFlop);
      expect(c.sawFlop).toBeLessThanOrEqual(c.handsDealt);
    }
    expect(dealtSum).toBe(seatsDealt);
  });

  it('a CompletedHand is accepted as a StatHand', () => {
    const completed: CompletedHand = {
      replayCode: 'test',
      stakes: { smallBlind: 1, bigBlind: 2, smallBet: 2, bigBet: 4 },
      button: 6,
      seats: [
        { seat: 5, name: 'You', kind: 'user', style: null, startingStack: 100, botId: null },
        { seat: 6, name: 'Eli', kind: 'bot', style: 'TAG', startingStack: 100, botId: 1 },
      ],
      userSeat: 5,
      userHoleCards: [1, 2],
      actions: [
        pre(6, 'small-blind'),
        pre(5, 'big-blind'),
        pre(6, 'raise'),
        pre(5, 'raise'),
        pre(6, 'call'),
        act('flop', 5, 'bet'),
        act('flop', 6, 'fold'),
      ],
      board: BOARD.slice(0, 3),
      shown: null,
      result: { endedBy: 'fold', showdown: [], awards: awardTo([5, 10]) },
      userDecisions: [],
    };
    expect(handStyleCounts(completed, 5)).toEqual({
      handsDealt: 1,
      voluntary: 1,
      preflopRaised: 1,
      postflopAggressive: 1,
      postflopCalls: 0,
      sawFlop: 1,
      showdowns: 0,
      showdownsWon: 0,
    });
  });
});
