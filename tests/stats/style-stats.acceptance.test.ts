import { describe, expect, it } from 'vitest';
import type { ActionRecord, PotAward, SeatNumber } from '../../src/engine/hand';
import {
  formatStat,
  NO_STAT,
  styleCounts,
  styleStats,
  type StatHand,
} from '../../src/stats/style-stats';

const ME: SeatNumber = 5;

const act = (
  street: ActionRecord['street'],
  seat: SeatNumber,
  type: ActionRecord['type'],
): ActionRecord => ({
  street,
  seat,
  type,
  amount: 0,
  added: 0,
});
const pre = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord =>
  act('preflop', seat, type);

interface HandSpec {
  readonly actions: readonly ActionRecord[];
  readonly board?: number;
  readonly endedBy?: 'fold' | 'showdown';
  readonly awards?: readonly PotAward[];
}
/** Seats 1, 5 and 6 dealt in; seat 6 takes the pot unless awards are given. */
function hand({ actions, board = 0, endedBy = 'fold', awards }: HandSpec): StatHand {
  return {
    seats: [{ seat: 1 }, { seat: 5 }, { seat: 6 }],
    actions,
    board: [10, 20, 30, 40, 50].slice(0, board),
    result: {
      endedBy,
      showdown: [],
      awards: awards ?? [{ pot: 0, amount: 12, winners: [{ seat: 6, amount: 12 }] }],
    },
  };
}
const statsOf = (hands: readonly StatHand[]) => styleStats(styleCounts(hands, ME));

describe('style stats (REQ-045)', () => {
  it('AC#1 VPIP is 50% and PFR is 20% over 10 hands', () => {
    const hands = [
      // Small-blind completion: a preflop call after posting.
      hand({
        actions: [
          pre(5, 'small-blind'),
          pre(6, 'big-blind'),
          pre(1, 'fold'),
          pre(5, 'call'),
          pre(6, 'check'),
        ],
        board: 3,
      }),
      hand({
        actions: [
          pre(6, 'small-blind'),
          pre(1, 'big-blind'),
          pre(5, 'call'),
          pre(6, 'fold'),
          pre(1, 'check'),
        ],
        board: 3,
      }),
      hand({
        actions: [
          pre(1, 'small-blind'),
          pre(6, 'big-blind'),
          pre(5, 'call'),
          pre(1, 'fold'),
          pre(6, 'check'),
        ],
        board: 3,
      }),
      hand({
        actions: [
          pre(6, 'small-blind'),
          pre(1, 'big-blind'),
          pre(5, 'raise'),
          pre(6, 'fold'),
          pre(1, 'fold'),
        ],
      }),
      hand({
        actions: [
          pre(1, 'small-blind'),
          pre(6, 'big-blind'),
          pre(5, 'raise'),
          pre(1, 'fold'),
          pre(6, 'call'),
        ],
        board: 3,
      }),
      // Big blind checks its option.
      hand({
        actions: [
          pre(6, 'small-blind'),
          pre(5, 'big-blind'),
          pre(1, 'call'),
          pre(6, 'call'),
          pre(5, 'check'),
        ],
        board: 3,
      }),
      // Posted the small blind and folded.
      hand({
        actions: [
          pre(5, 'small-blind'),
          pre(6, 'big-blind'),
          pre(1, 'raise'),
          pre(5, 'fold'),
          pre(6, 'fold'),
        ],
      }),
      hand({
        actions: [
          pre(6, 'small-blind'),
          pre(1, 'big-blind'),
          pre(5, 'fold'),
          pre(6, 'call'),
          pre(1, 'check'),
        ],
        board: 3,
      }),
      hand({
        actions: [pre(1, 'small-blind'), pre(6, 'big-blind'), pre(5, 'fold'), pre(1, 'fold')],
      }),
      hand({
        actions: [pre(6, 'small-blind'), pre(1, 'big-blind'), pre(5, 'fold'), pre(6, 'fold')],
      }),
    ];
    const counts = styleCounts(hands, ME);
    expect(counts.handsDealt).toBe(10);
    expect(counts.voluntary).toBe(5);
    expect(counts.preflopRaised).toBe(2);
    const stats = styleStats(counts);
    expect(stats.vpip).toBe(50);
    expect(stats.pfr).toBe(20);
    expect(formatStat(stats.vpip)).toBe('50%');
    expect(formatStat(stats.pfr)).toBe('20%');
  });

  it('AC#2 Aggression is 50% using flop, turn and river actions only', () => {
    const blinds = [pre(1, 'small-blind'), pre(6, 'big-blind')];
    const hands = [
      hand({
        actions: [
          ...blinds,
          pre(5, 'raise'),
          pre(1, 'fold'),
          pre(6, 'call'),
          act('flop', 6, 'check'),
          act('flop', 5, 'bet'),
          act('flop', 6, 'call'),
          act('turn', 6, 'check'),
          act('turn', 5, 'bet'),
          act('turn', 6, 'raise'),
          act('turn', 5, 'call'),
          act('river', 6, 'check'),
          act('river', 5, 'bet'),
          act('river', 6, 'call'),
        ],
        board: 5,
        endedBy: 'showdown',
      }),
      hand({
        actions: [
          ...blinds,
          pre(5, 'raise'),
          pre(1, 'fold'),
          pre(6, 'raise'),
          pre(5, 'call'),
          act('flop', 6, 'bet'),
          act('flop', 5, 'call'),
          act('turn', 6, 'bet'),
          act('turn', 5, 'raise'),
          act('turn', 6, 'call'),
          act('river', 6, 'bet'),
          act('river', 5, 'call'),
        ],
        board: 5,
        endedBy: 'showdown',
      }),
      hand({
        actions: [
          ...blinds,
          pre(5, 'call'),
          pre(1, 'fold'),
          pre(6, 'check'),
          act('flop', 6, 'check'),
          act('flop', 5, 'check'),
          act('turn', 6, 'bet'),
          act('turn', 5, 'call'),
          act('river', 6, 'bet'),
          act('river', 5, 'fold'),
        ],
        board: 5,
      }),
    ];
    const counts = styleCounts(hands, ME);
    expect(counts.postflopAggressive).toBe(4);
    expect(counts.postflopCalls).toBe(4);
    expect(counts.preflopRaised).toBe(2);
    const { aggression } = styleStats(counts);
    expect(aggression).toBe(50);
    expect(formatStat(aggression)).toBe('50%');
  });

  it('AC#3 WTSD is 25% when 2 of 8 flops reach showdown', () => {
    const blinds = [pre(1, 'small-blind'), pre(6, 'big-blind')];
    const toFlop = [...blinds, pre(5, 'call'), pre(1, 'fold'), pre(6, 'check')];
    const showdownHand = hand({
      actions: [
        ...toFlop,
        act('flop', 6, 'check'),
        act('flop', 5, 'check'),
        act('turn', 6, 'check'),
        act('turn', 5, 'check'),
        act('river', 6, 'check'),
        act('river', 5, 'check'),
      ],
      board: 5,
      endedBy: 'showdown',
    });
    const foldsOnFlop = hand({
      actions: [...toFlop, act('flop', 6, 'bet'), act('flop', 5, 'fold')],
      board: 3,
    });
    const foldsOnTurn = hand({
      actions: [
        ...toFlop,
        act('flop', 6, 'check'),
        act('flop', 5, 'check'),
        act('turn', 6, 'bet'),
        act('turn', 5, 'fold'),
      ],
      board: 4,
    });
    const opponentFolds = hand({
      actions: [...toFlop, act('flop', 6, 'check'), act('flop', 5, 'bet'), act('flop', 6, 'fold')],
      board: 3,
      awards: [{ pot: 0, amount: 12, winners: [{ seat: 5, amount: 12 }] }],
    });
    // Seat 5 folds preflop while the others go on to a flop: not a flop seen.
    const foldsPreflop = hand({
      actions: [...blinds, pre(5, 'fold'), pre(1, 'call'), pre(6, 'check')],
      board: 3,
    });
    const hands = [
      showdownHand,
      showdownHand,
      foldsOnFlop,
      foldsOnFlop,
      foldsOnTurn,
      foldsOnTurn,
      opponentFolds,
      opponentFolds,
      foldsPreflop,
      foldsPreflop,
    ];
    const counts = styleCounts(hands, ME);
    expect(counts.sawFlop).toBe(8);
    expect(counts.showdowns).toBe(2);
    expect(styleStats(counts).wtsd).toBe(25);
    expect(formatStat(styleStats(counts).wtsd)).toBe('25%');
  });

  it('AC#4 W$SD is 50% when one of two showdowns is a split pot', () => {
    const actions = [
      pre(1, 'small-blind'),
      pre(6, 'big-blind'),
      pre(5, 'call'),
      pre(1, 'fold'),
      pre(6, 'check'),
    ];
    const lost = hand({
      actions,
      board: 5,
      endedBy: 'showdown',
      awards: [{ pot: 0, amount: 10, winners: [{ seat: 6, amount: 10 }] }],
    });
    const split = hand({
      actions,
      board: 5,
      endedBy: 'showdown',
      awards: [
        {
          pot: 0,
          amount: 10,
          winners: [
            { seat: 5, amount: 5 },
            { seat: 6, amount: 5 },
          ],
        },
      ],
    });
    const counts = styleCounts([lost, split], ME);
    expect(counts.showdowns).toBe(2);
    expect(counts.showdownsWon).toBe(1);
    expect(styleStats(counts).wsd).toBe(50);
    expect(formatStat(styleStats(counts).wsd)).toBe('50%');
  });

  it('AC#5 a stat with a zero denominator shows —', () => {
    expect(NO_STAT).toBe('—');
    const blinds = [pre(1, 'small-blind'), pre(6, 'big-blind')];

    // (a) no hands: every stat is null.
    const none = statsOf([]);
    for (const key of ['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'] as const) {
      expect(none[key], key).toBeNull();
      expect(formatStat(none[key])).toBe('—');
    }

    // (b) never saw a flop: WTSD and W$SD are null; VPIP and PFR are numbers. With no postflop action,
    // Aggression is null too.
    const noFlop = statsOf([
      hand({ actions: [...blinds, pre(5, 'raise'), pre(1, 'fold'), pre(6, 'fold')] }),
      hand({ actions: [...blinds, pre(5, 'fold'), pre(1, 'call'), pre(6, 'check')], board: 3 }),
    ]);
    expect(noFlop.vpip).toBe(50);
    expect(noFlop.pfr).toBe(50);
    expect(noFlop.wtsd).toBeNull();
    expect(noFlop.wsd).toBeNull();
    expect(noFlop.aggression).toBeNull();
    expect(formatStat(noFlop.wtsd)).toBe('—');
    expect(formatStat(noFlop.wsd)).toBe('—');

    // (c) saw flops, never reached showdown: only W$SD is null.
    const noShowdown = statsOf([
      hand({
        actions: [
          ...blinds,
          pre(5, 'call'),
          pre(1, 'fold'),
          pre(6, 'check'),
          act('flop', 6, 'check'),
          act('flop', 5, 'bet'),
          act('flop', 6, 'fold'),
        ],
        board: 3,
        awards: [{ pot: 0, amount: 8, winners: [{ seat: 5, amount: 8 }] }],
      }),
    ]);
    expect(noShowdown.vpip).toBe(100);
    expect(noShowdown.pfr).toBe(0);
    expect(noShowdown.aggression).toBe(100);
    expect(noShowdown.wtsd).toBe(0);
    expect(noShowdown.wsd).toBeNull();
    expect(formatStat(noShowdown.wsd)).toBe('—');

    // (d) only postflop checks: Aggression is null, the rest are numbers.
    const onlyChecks = statsOf([
      hand({
        actions: [
          ...blinds,
          pre(5, 'call'),
          pre(1, 'fold'),
          pre(6, 'check'),
          act('flop', 6, 'check'),
          act('flop', 5, 'check'),
          act('turn', 6, 'check'),
          act('turn', 5, 'check'),
          act('river', 6, 'check'),
          act('river', 5, 'check'),
        ],
        board: 5,
        endedBy: 'showdown',
      }),
    ]);
    expect(onlyChecks.aggression).toBeNull();
    expect(formatStat(onlyChecks.aggression)).toBe('—');
    expect(onlyChecks.vpip).toBe(100);
    expect(onlyChecks.pfr).toBe(0);
    expect(onlyChecks.wtsd).toBe(100);
    expect(onlyChecks.wsd).toBe(0);
  });

  it('AC#6 posting a blind and folding is not VPIP', () => {
    const hands = [
      hand({
        actions: [
          pre(6, 'small-blind'),
          pre(5, 'big-blind'),
          pre(1, 'raise'),
          pre(6, 'fold'),
          pre(5, 'fold'),
        ],
      }),
      hand({
        actions: [pre(5, 'small-blind'), pre(6, 'big-blind'), pre(1, 'fold'), pre(5, 'fold')],
      }),
    ];
    const counts = styleCounts(hands, ME);
    expect(counts.handsDealt).toBe(2);
    expect(counts.voluntary).toBe(0);
    const { vpip } = styleStats(counts);
    expect(vpip).toBe(0);
    expect(formatStat(vpip)).toBe('0%');
  });
});
